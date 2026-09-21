// Real-Time Live Location (GPS) & Manual Geolocation Utilities
import { reverseGeocode, reverseGeocodeWardAndDistrict } from './geocoding';

export interface LiveLocationData {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  address?: string;
  district?: string;
  source?: 'device-satellite' | 'network-ip' | 'calibrated-city';
  isFallback?: boolean;
}

export type LocationSelectionMode = 'live' | 'manual';

export interface LocationPermissionStatus {
  state: 'granted' | 'prompt' | 'denied' | 'unsupported';
  message: string;
}

/**
 * Checks browser permission state for geolocation if supported
 */
export async function checkGeolocationPermission(): Promise<LocationPermissionStatus> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return {
      state: 'unsupported',
      message: 'Geolocation is not supported on this device/browser.',
    };
  }

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return {
        state: status.state,
        message:
          status.state === 'granted'
            ? 'Live GPS location permission granted.'
            : status.state === 'denied'
            ? 'Location access was blocked. Please enable location permissions in your browser or select manually.'
            : 'Browser will prompt for location permission.',
      };
    } catch {
      // Some browsers don't support query for geolocation
    }
  }

  return {
    state: 'prompt',
    message: 'Ready to acquire live location fix.',
  };
}

/**
 * Fallback to Server / Network IP Geolocation
 */
async function getNetworkLocationFallback(): Promise<LiveLocationData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/location/locate', {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.lat && data.lng) {
        return {
          lat: Number(data.lat),
          lng: Number(data.lng),
          accuracy: Number(data.accuracy) || 500,
          heading: null,
          speed: null,
          timestamp: Date.now(),
          address: data.address || `City Ward (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`,
          district: data.district || 'Municipal Ward',
          source: data.source || 'network-ip',
          isFallback: true,
        };
      }
    }
  } catch {
    // Server location route error
  }

  // Second attempt: Client-side public IP geocoding
  try {
    const publicController = new AbortController();
    const publicTimeout = setTimeout(() => publicController.abort(), 2500);
    const publicRes = await fetch('https://freeipapi.com/api/json', {
      signal: publicController.signal,
    });
    clearTimeout(publicTimeout);
    if (publicRes.ok) {
      const pData = await publicRes.json();
      if (pData && pData.latitude && pData.longitude) {
        return {
          lat: Number(pData.latitude),
          lng: Number(pData.longitude),
          accuracy: 800,
          heading: null,
          speed: null,
          timestamp: Date.now(),
          address: `${pData.cityName || 'City Center'}, ${pData.regionName || 'State'}, ${pData.countryName || 'India'}`,
          district: pData.regionName || 'Municipal Ward',
          source: 'network-ip',
          isFallback: true,
        };
      }
    }
  } catch {
    // Secondary fallback
  }

  // Guaranteed Default Pan-India Central Hub (New Delhi NDMC / Central Hub)
  return {
    lat: 28.6139,
    lng: 77.2090,
    accuracy: 500,
    heading: null,
    speed: null,
    timestamp: Date.now(),
    address: 'Rajpath / Central Vista, New Delhi, Delhi 110001',
    district: 'NDMC Central Ward',
    source: 'calibrated-city',
    isFallback: true,
  };
}

/**
 * Obtains current live GPS position with fast multi-tier fallback.
 * Guaranteed to NEVER reject or leave the user stuck.
 */
export function getCurrentLivePosition(): Promise<LiveLocationData> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      getNetworkLocationFallback().then(resolve);
      return;
    }

    let isResolved = false;

    // Fast satellite GPS attempt
    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 3500,
      maximumAge: 10000,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (isResolved) return;
        isResolved = true;
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        let address = '';
        let district = '';
        try {
          const wardInfo = await reverseGeocodeWardAndDistrict(latitude, longitude);
          address = wardInfo.formattedAddress;
          district = wardInfo.ward;
        } catch {
          address = `GPS Spot (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          district = `Ward (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        }

        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy || 10),
          heading: heading ?? null,
          speed: speed ?? null,
          timestamp: pos.timestamp || Date.now(),
          address,
          district,
          source: 'device-satellite',
          isFallback: false,
        });
      },
      () => {
        if (isResolved) return;

        // Try standard non-high-accuracy GPS
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (isResolved) return;
            isResolved = true;
            const { latitude, longitude, accuracy } = pos.coords;
            let address = '';
            let district = '';
            try {
              const wardInfo = await reverseGeocodeWardAndDistrict(latitude, longitude);
              address = wardInfo.formattedAddress;
              district = wardInfo.ward;
            } catch {
              address = `GPS Spot (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
              district = `Ward (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
            }

            resolve({
              lat: latitude,
              lng: longitude,
              accuracy: Math.round(accuracy || 25),
              timestamp: pos.timestamp || Date.now(),
              address,
              district,
              source: 'device-satellite',
              isFallback: false,
            });
          },
          () => {
            if (isResolved) return;
            isResolved = true;
            // Immediate network IP / city calibration fallback
            getNetworkLocationFallback().then(resolve);
          },
          { enableHighAccuracy: false, timeout: 2500, maximumAge: 30000 }
        );
      },
      highAccuracyOptions
    );

    // Hard safety timeout in case browser hangs on prompt
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        getNetworkLocationFallback().then(resolve);
      }
    }, 6500);
  });
}

/**
 * Watches real-time position updates
 */
export function watchLivePosition(
  onUpdate: (data: LiveLocationData) => void,
  onError: (error: Error) => void
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError(new Error('Geolocation is not supported.'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const { latitude, longitude, accuracy, heading, speed } = pos.coords;
      onUpdate({
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy || 10),
        heading: heading ?? null,
        speed: speed ?? null,
        timestamp: pos.timestamp || Date.now(),
        source: 'device-satellite',
      });
    },
    () => {
      // If live watch fails, do a single fallback update so the UI still functions
      getNetworkLocationFallback().then(onUpdate);
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. You can select your location manually on the map.';
    case error.POSITION_UNAVAILABLE:
      return 'Location signal is unavailable. Please check GPS reception or select manually.';
    case error.TIMEOUT:
      return 'Location request timed out. Please retry or select location manually.';
    default:
      return 'An unknown error occurred while retrieving live location.';
  }
}

/**
 * Validates coordinate inputs
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Formats lat/lng for display
 */
export function formatCoordinateString(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}
