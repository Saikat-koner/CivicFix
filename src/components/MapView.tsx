import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker as MapLibreMarker, Popup as MapLibrePopup } from 'maplibre-gl';
import {
  CivicIssue,
  IssueStatus,
  IssueCategory,
  SmartWasteBin,
  GarbageTruck,
  EmergencyHotlinePlace,
  MapOverlayVisibilityState,
  TrafficSegment,
  InfrastructureHotspot,
  WardBoundary,
} from '../types';
import { reverseGeocode, reverseGeocodeWardAndDistrict } from '../utils/geocoding';
import { soundFX } from '../utils/audioFeedback';
import { getCurrentLivePosition, LiveLocationData } from '../utils/liveLocation';
import { INITIAL_SMART_BINS, INITIAL_GARBAGE_TRUCKS } from '../data/garbageData';
import { EMERGENCY_HOTLINE_PLACES } from '../data/emergencyPlaces';
import {
  getActiveTrafficSegments,
  getActiveInfrastructureHotspots,
  getActiveWardBoundaries,
} from '../data/mapLayersData';
import { MapLayerControlPanel } from './MapLayerControlPanel';
import { audibleNarrator } from '../utils/audibleNarrator';
import {
  Crosshair,
  Layers,
  Navigation,
  ZoomIn,
  ZoomOut,
  Flame,
  Maximize2,
  Compass,
  Radio,
  X,
  Eye,
  PlusCircle,
  MapPin,
  AlertTriangle,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  LocateFixed,
  Loader2,
  Move,
  Trash2,
  Truck,
  ShieldAlert,
  PhoneCall,
  PhoneForwarded,
  Volume2,
  VolumeX,
  Square,
  Filter,
  Droplets,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Box,
  RotateCw,
} from 'lucide-react';

export type MapTileLayer =
  | 'osm'
  | 'voyager'
  | 'positron'
  | 'dark'
  | 'hot'
  | 'cyclosm'
  | 'topo'
  | 'satellite';

export interface MapViewProps {
  issues: CivicIssue[];
  selectedIssue: CivicIssue | null;
  onSelectIssue: (issue: CivicIssue) => void;
  onStartNavigation?: (issue: CivicIssue) => void;
  onNavigateIssue?: (issue: CivicIssue) => void; // alias
  activeStatusFilter?: IssueStatus | 'all';
  statusFilter?: IssueStatus | 'all'; // alias
  onStatusFilterChange?: (status: IssueStatus | 'all') => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  interactivePicker?: boolean;
  onLocationPicked?: (lat: number, lng: number, address: string) => void;
  routeCoordinates?: [number, number][];
  userLocation?: { lat: number; lng: number; accuracy?: number };
  className?: string;
  onQuickReportAtLocation?: (lat: number, lng: number, address?: string) => void;
  onInstantQuickReport?: (category: IssueCategory, lat: number, lng: number, address: string) => void;
  isLiveLocationActive?: boolean;
  onLiveLocationChange?: (location: LiveLocationData) => void;
  pointAtLocationOnly?: boolean;
  onTogglePointAtLocationOnly?: (enabled: boolean) => void;
  userName?: string;
  userAddress?: string;
  flyToUserTrigger?: number;
  highlightEmergencyPlace?: EmergencyHotlinePlace | null;
  onSelectEmergencyPlace?: (place: EmergencyHotlinePlace) => void;
  isDarkMode?: boolean;
  onUpvote?: (issueId: string) => void;
}

export interface PinnedMapLocation {
  lat: number;
  lng: number;
  address: string;
  district?: string;
  isGeocoding?: boolean;
}

/**
 * OpenFreeMap & Raster Style Map Configurations for MapLibre GL
 * Provides 60 FPS GPU-rendered vector tiles with 3D buildings at zero API cost.
 */
function getMapStyleSpec(layer: MapTileLayer, isDark: boolean): string | maplibregl.StyleSpecification {
  // Vector Styles (OpenFreeMap)
  if (layer === 'voyager' || (layer === 'osm' && !isDark)) {
    return 'https://tiles.openfreemap.org/styles/liberty';
  }
  if (layer === 'dark' || (layer === 'osm' && isDark)) {
    return 'https://tiles.openfreemap.org/styles/dark';
  }
  if (layer === 'positron') {
    return 'https://tiles.openfreemap.org/styles/positron';
  }

  // Raster fallback styles (OSM, Satellite, Topo, CyclOSM, HOT)
  const rasterSources: Record<string, { tiles: string[]; attribution: string; maxzoom?: number }> = {
    satellite: {
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    topo: {
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      attribution: '© OpenStreetMap, © OpenTopoMap',
      maxzoom: 17,
    },
    hot: {
      tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
      attribution: '© OpenStreetMap contributors, HOT',
      maxzoom: 19,
    },
    cyclosm: {
      tiles: ['https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'],
      attribution: '© OpenStreetMap contributors, CyclOSM',
      maxzoom: 19,
    },
    osm: {
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  };

  const src = rasterSources[layer] || rasterSources.osm;
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: src.tiles,
        tileSize: 256,
        attribution: src.attribution,
        maxzoom: src.maxzoom || 19,
      },
    },
    layers: [
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

export const MapView: React.FC<MapViewProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
  onStartNavigation,
  onNavigateIssue,
  activeStatusFilter: activeStatusFilterProp,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
  center = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5,
  interactivePicker = false,
  onLocationPicked,
  routeCoordinates,
  userLocation: userLocationProp,
  className = 'h-[440px] sm:h-[500px] md:h-[560px] lg:h-[620px] xl:h-[680px] w-full',
  onQuickReportAtLocation,
  onInstantQuickReport,
  isLiveLocationActive = false,
  onLiveLocationChange,
  pointAtLocationOnly = false,
  onTogglePointAtLocationOnly,
  userName,
  userAddress,
  flyToUserTrigger,
  highlightEmergencyPlace,
  onSelectEmergencyPlace,
  isDarkMode = false,
  onUpvote,
}) => {
  const currentFilter = activeStatusFilterProp || statusFilterProp || 'all';
  const handleNav = onStartNavigation || onNavigateIssue;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const pickerMarkerRef = useRef<MapLibreMarker | null>(null);
  const clickedMarkerRef = useRef<MapLibreMarker | null>(null);
  const activePopupRef = useRef<MapLibrePopup | null>(null);

  // High reliability Vector & Open GIS tile layer state
  const [currentLayer, setCurrentLayer] = useState<MapTileLayer>(isDarkMode ? 'dark' : 'osm');
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [currentBearing, setCurrentBearing] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number>(0);

  // Synchronize tile layer with dark mode theme
  useEffect(() => {
    if (isDarkMode && currentLayer === 'osm') {
      setCurrentLayer('dark');
    } else if (!isDarkMode && currentLayer === 'dark') {
      setCurrentLayer('osm');
    }
  }, [isDarkMode]);

  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isAudioSummaryPlaying, setIsAudioSummaryPlaying] = useState(false);
  const styleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubSpeaking = audibleNarrator.onSpeakingChange((speaking) => {
      setIsAudioSummaryPlaying(speaking);
    });
    return () => {
      unsubSpeaking();
    };
  }, []);

  useEffect(() => {
    if (!showLayerMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLayerMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLayerMenu]);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [showEmergencyPlaces, setShowEmergencyPlaces] = useState<boolean>(false);
  const [emergencyHotlineFilter, setEmergencyHotlineFilter] = useState<
    'all' | '112' | '1533' | '1916' | '1912' | '1033' | '103'
  >('all');
  const [streetViewIssue, setStreetViewIssue] = useState<CivicIssue | null>(null);
  const [streetAngle, setStreetAngle] = useState(0);

  // Pictorial accessibility categories
  const [easyMode, setEasyMode] = useState<boolean>(true);
  const [pictorialCategory, setPictorialCategory] = useState<
    'all' | 'water' | 'garbage' | 'road' | 'light' | 'drain' | 'safety'
  >('all');
  const [showCategoryBar, setShowCategoryBar] = useState<boolean>(false);
  const [isStatusDockMinimized, setIsStatusDockMinimized] = useState<boolean>(false);

  const pictorialCategoriesList = [
    { id: 'all', emoji: '🌟', label: 'All' },
    { id: 'water', emoji: '🚰', label: 'Water' },
    { id: 'garbage', emoji: '🗑️', label: 'Garbage' },
    { id: 'road', emoji: '🕳️', label: 'Roads' },
    { id: 'light', emoji: '💡', label: 'Light' },
    { id: 'drain', emoji: '🚽', label: 'Drain' },
    { id: 'safety', emoji: '⚠️', label: 'Safety' },
  ] as const;

  const currentCategoryObj =
    pictorialCategoriesList.find((c) => c.id === pictorialCategory) || pictorialCategoriesList[0];

  // Map Overlay Visibility State
  const [layerVisibility, setLayerVisibility] = useState<MapOverlayVisibilityState>({
    traffic: false,
    infrastructure: false,
    wardBoundaries: false,
    hazardHeatmap: false,
    emergencyStations: false,
    proximityRadar: false,
    civicIssues: true,
  });
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85);

  const handleToggleOverlay = (key: keyof MapOverlayVisibilityState) => {
    setLayerVisibility((prev) => {
      const next = !prev[key];
      if (key === 'hazardHeatmap') setShowHeatmap(next);
      if (key === 'emergencyStations') setShowEmergencyPlaces(next);
      if (key === 'proximityRadar') setShowRadar(next);
      return { ...prev, [key]: next };
    });
  };

  const handleSetAllLayers = (enable: boolean) => {
    setLayerVisibility({
      traffic: enable,
      infrastructure: enable,
      wardBoundaries: enable,
      hazardHeatmap: enable,
      emergencyStations: enable,
      proximityRadar: enable,
      civicIssues: enable,
    });
    setShowHeatmap(enable);
    setShowEmergencyPlaces(enable);
    setShowRadar(enable);
  };

  const handleResetDefaultLayers = () => {
    setLayerVisibility({
      traffic: false,
      infrastructure: false,
      wardBoundaries: false,
      hazardHeatmap: false,
      emergencyStations: false,
      proximityRadar: false,
      civicIssues: true,
    });
    setShowHeatmap(false);
    setShowEmergencyPlaces(false);
    setShowRadar(false);
  };

  // Sync layerVisibility when external controls toggle state
  useEffect(() => {
    setLayerVisibility((prev) => ({
      ...prev,
      hazardHeatmap: showHeatmap,
      emergencyStations: showEmergencyPlaces,
      proximityRadar: showRadar,
    }));
  }, [showHeatmap, showEmergencyPlaces, showRadar]);

  // Live Location & GPS Tracking State
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number; accuracy?: number }>(
    userLocationProp || { lat: 20.5937, lng: 78.9629 }
  );
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // Clicked Location on Map (For interactive 1-click viewing and reporting)
  const [clickedLocation, setClickedLocation] = useState<PinnedMapLocation | null>(null);
  const [instantReportSuccess, setInstantReportSuccess] = useState<string | null>(null);

  // Fullscreen map view state
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isMapFullscreen, showCategoryBar]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMapFullscreen) {
        setIsMapFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapFullscreen]);

  const tileUrls: Record<
    MapTileLayer,
    { name: string; tag: string }
  > = {
    osm: {
      name: 'OpenFreeMap Liberty Vector',
      tag: '60 FPS GPU-Rendered Vector Map',
    },
    voyager: {
      name: 'OpenFreeMap Liberty',
      tag: 'Crisp Urban Vector Tiles',
    },
    positron: {
      name: 'Positron Minimal Canvas',
      tag: 'High-Contrast Neutral Base',
    },
    dark: {
      name: 'OpenFreeMap Dark Vector',
      tag: 'Night Inspection & Outages',
    },
    hot: {
      name: 'Humanitarian (HOT)',
      tag: 'Infrastructure Density',
    },
    cyclosm: {
      name: 'CyclOSM Mobility',
      tag: 'Roads & Cycling Lanes',
    },
    topo: {
      name: 'OpenTopo (Contour)',
      tag: 'Elevation & Terrain',
    },
    satellite: {
      name: 'Satellite Aerial (Esri)',
      tag: 'World High-Res Imagery',
    },
  };

  // Helper to extract intuitive pictorial metadata for low-literacy citizens
  const getIssuePictorialInfo = (issue: CivicIssue) => {
    const cat = (issue.category || '').toLowerCase();
    const text = ((issue.title || '') + ' ' + (issue.description || '')).toLowerCase();

    let emoji = '⚠️';
    let categoryKey: 'water' | 'garbage' | 'road' | 'light' | 'drain' | 'safety' | 'other' = 'other';
    let engName = 'Civic Issue';

    if (
      text.includes('water') ||
      text.includes('leak') ||
      text.includes('paani') ||
      text.includes('pipe') ||
      text.includes('tap') ||
      text.includes('jal') ||
      text.includes('supply')
    ) {
      emoji = '🚰';
      categoryKey = 'water';
      engName = 'Water Pipeline Leak';
    } else if (
      text.includes('drain') ||
      text.includes('sewage') ||
      text.includes('sewer') ||
      text.includes('naali') ||
      text.includes('gutter') ||
      text.includes('overflow') ||
      text.includes('ganda')
    ) {
      emoji = '🚽';
      categoryKey = 'drain';
      engName = 'Sewage / Drain Blockage';
    } else if (
      text.includes('garbage') ||
      text.includes('waste') ||
      text.includes('trash') ||
      text.includes('kooda') ||
      text.includes('kachra') ||
      text.includes('dump') ||
      cat.includes('sanitat')
    ) {
      emoji = '🗑️';
      categoryKey = 'garbage';
      engName = 'Garbage & Waste Pile';
    } else if (
      cat.includes('road') ||
      text.includes('pothole') ||
      text.includes('gaddha') ||
      text.includes('road') ||
      text.includes('asphalt') ||
      text.includes('tar') ||
      text.includes('divider') ||
      text.includes('crack')
    ) {
      emoji = '🕳️';
      categoryKey = 'road';
      engName = 'Road Pothole / Broken Road';
    } else if (
      text.includes('light') ||
      text.includes('electric') ||
      text.includes('wire') ||
      text.includes('batti') ||
      text.includes('pole') ||
      text.includes('dark') ||
      text.includes('bulb')
    ) {
      emoji = '💡';
      categoryKey = 'light';
      engName = 'Streetlight Off / Electrical';
    } else if (
      cat.includes('safety') ||
      text.includes('danger') ||
      text.includes('hazard') ||
      text.includes('accident') ||
      text.includes('fire') ||
      text.includes('khatra')
    ) {
      emoji = '⚠️';
      categoryKey = 'safety';
      engName = 'Public Safety Hazard';
    } else if (cat.includes('park') || text.includes('tree') || text.includes('ped') || text.includes('branch')) {
      emoji = '🌳';
      categoryKey = 'other';
      engName = 'Fallen Tree / Park Issue';
    }

    let statusColor = '#ef4444'; // Red
    let statusBadge = '❌';
    let engStatus = 'Pending Action';

    if (issue.status === 'fixed') {
      statusColor = '#10B981'; // Green
      statusBadge = '✅';
      engStatus = 'Resolved & Clean';
    } else if (issue.status === 'investigating') {
      statusColor = '#f59e0b'; // Amber
      statusBadge = '⏳';
      engStatus = 'In Progress';
    }

    return { emoji, categoryKey, engName, statusColor, statusBadge, engStatus };
  };

  // -------------------------------------------------------------
  // 1. Initialize MapLibre GL instance
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const styleSpec = getMapStyleSpec(currentLayer, isDarkMode);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleSpec,
      center: [center.lng, center.lat],
      zoom: zoom,
      pitch: is3DMode ? 55 : 0,
      bearing: 0,
      maxPitch: 85,
    });

    map.on('rotate', () => {
      setCurrentBearing(Math.round(map.getBearing()));
    });
    map.on('pitch', () => {
      setCurrentPitch(Math.round(map.getPitch()));
    });

    // Add 3D Extruded Buildings layer once vector style loads
    map.on('load', () => {
      tryAdd3DBuildings(map, isDarkMode);
    });

    map.on('style.load', () => {
      tryAdd3DBuildings(map, isDarkMode);
      refreshMapLayers(map);
    });

    // Interactive map click for pin-dropping & inspection
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;

      if (interactivePicker && onLocationPicked) {
        soundFX.playClick();
        const addr = await reverseGeocode(lat, lng);
        onLocationPicked(lat, lng, addr);
        return;
      }

      // Drop inspection pin
      soundFX.playClick();
      setClickedLocation({
        lat,
        lng,
        address: 'Locating address...',
        isGeocoding: true,
      });

      const wardInfo = await reverseGeocodeWardAndDistrict(lat, lng);
      setClickedLocation({
        lat,
        lng,
        address: wardInfo.formattedAddress,
        district: wardInfo.ward,
        isGeocoding: false,
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------
  // 2. Helper to Add 3D Extruded Buildings on Vector Layers
  // -------------------------------------------------------------
  const tryAdd3DBuildings = (map: MapLibreMap, isDark: boolean) => {
    try {
      if (map.getLayer('3d-buildings')) return;

      const layers = map.getStyle().layers;
      if (!layers) return;

      const labelLayerId = layers.find(
        (l) => l.type === 'symbol' && (l.layout as any)?.['text-field']
      )?.id;

      // Check if openmaptiles or building source exists
      if (map.getSource('openmaptiles')) {
        map.addLayer(
          {
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': isDark ? '#1e293b' : '#cbd5e1',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                0,
                15.05,
                ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                0,
                15.05,
                ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
              ],
              'fill-extrusion-opacity': isDark ? 0.8 : 0.65,
            },
          },
          labelLayerId
        );
      }
    } catch {
      // Non-vector style or already added
    }
  };

  // -------------------------------------------------------------
  // 3. Switch Tile Styles (OpenFreeMap vector vs Raster)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const styleSpec = getMapStyleSpec(currentLayer, isDarkMode);
    mapRef.current.setStyle(styleSpec);
  }, [currentLayer, isDarkMode]);

  // -------------------------------------------------------------
  // 4. Toggle 3D Oblique Camera Mode (0° vs 55° pitch)
  // -------------------------------------------------------------
  const toggle3DMode = () => {
    if (!mapRef.current) return;
    soundFX.playClick();
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    mapRef.current.easeTo({
      pitch: next3D ? 55 : 0,
      bearing: next3D ? -20 : 0,
      duration: 1000,
    });
  };

  const resetBearing = () => {
    if (!mapRef.current) return;
    soundFX.playClick();
    mapRef.current.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 600,
    });
    setIs3DMode(false);
  };

  // -------------------------------------------------------------
  // 5. Render Civic Issue HTML Markers & Click Popups
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!layerVisibility.civicIssues) return;

    // Filter issues by status & pictorial category
    const filteredIssues = issues.filter((issue) => {
      const matchesStatus = currentFilter === 'all' || issue.status === currentFilter;
      if (!matchesStatus) return false;
      if (pictorialCategory === 'all') return true;
      const { categoryKey } = getIssuePictorialInfo(issue);
      return categoryKey === pictorialCategory;
    });

    filteredIssues.forEach((issue) => {
      const isSelected = selectedIssue?.id === issue.id;
      const { emoji, statusColor, statusBadge, engName, engStatus } = getIssuePictorialInfo(issue);

      const el = document.createElement('div');
      el.className = 'custom-maplibre-pin';
      el.style.cursor = 'pointer';

      const scale = isSelected ? 1.25 : 1.0;
      const shadowClass = isSelected
        ? 'filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.5));'
        : 'filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.28));';

      const pinSize = easyMode ? [44, 52] : [36, 44];

      el.innerHTML = `
        <div style="position: relative; width: ${pinSize[0]}px; height: ${pinSize[1]}px; display: flex; flex-direction: column; align-items: center; transform: scale(${scale}); transform-origin: bottom center; transition: all 0.2s ease; ${shadowClass}">
          <!-- Outer Circle Badge -->
          <div style="
            position: relative;
            width: ${easyMode ? 38 : 32}px;
            height: ${easyMode ? 38 : 32}px;
            border-radius: 50%;
            background: #ffffff;
            border: ${easyMode ? '3.5px' : '3px'} solid ${statusColor};
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95), 0 3px 6px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${easyMode ? '21px' : '17px'};
            line-height: 1;
            user-select: none;
          ">
            <span>${emoji}</span>
          </div>

          <!-- Arrow Pointer -->
          <div style="
            width: 0;
            height: 0;
            border-left: ${easyMode ? '7px' : '6px'} solid transparent;
            border-right: ${easyMode ? '7px' : '6px'} solid transparent;
            border-top: ${easyMode ? '9px' : '7px'} solid ${statusColor};
            margin-top: -2px;
          "></div>

          <!-- Status badge corner -->
          <div style="
            position: absolute;
            top: -3px;
            right: 0px;
            background: ${statusColor};
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            width: 17px;
            height: 17px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${statusBadge}
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        soundFX.playClick();
        onSelectIssue(issue);
        openIssuePopup(map, issue, el);
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([issue.location.lng, issue.location.lat])
        .addTo(map);

      markersRef.current.push(marker);

      // If this issue is selected, open popup automatically
      if (isSelected) {
        openIssuePopup(map, issue, el);
      }
    });
  }, [issues, currentFilter, pictorialCategory, selectedIssue, easyMode, layerVisibility.civicIssues]);

  // -------------------------------------------------------------
  // 6. Interactive Popup Creator for Civic Issues
  // -------------------------------------------------------------
  const openIssuePopup = (map: MapLibreMap, issue: CivicIssue, markerEl: HTMLElement) => {
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }

    const { emoji, statusColor, statusBadge, engName, engStatus } = getIssuePictorialInfo(issue);

    const popupContainer = document.createElement('div');
    popupContainer.className = 'civic-popup-card';
    popupContainer.style.width = '280px';
    popupContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    popupContainer.innerHTML = `
      <div style="padding: 12px; background: ${isDarkMode ? '#131b26' : '#ffffff'}; color: ${isDarkMode ? '#f1f5f9' : '#121c28'}; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.25);">
        <!-- Header Pill & Category -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 20px;">${emoji}</span>
            <div>
              <div style="font-size: 13px; font-weight: 700; line-height: 1.2;">${issue.title}</div>
              <div style="font-size: 10px; color: ${isDarkMode ? '#94a3b8' : '#64748b'};">${engName}</div>
            </div>
          </div>
          <span style="background: ${statusColor}18; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
            <span>${statusBadge}</span>
            <span>${engStatus}</span>
          </span>
        </div>

        <!-- Address -->
        <div style="font-size: 11px; color: ${isDarkMode ? '#cbd5e1' : '#475569'}; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 4px;">
          <span style="font-size: 13px;">📍</span>
          <span style="line-height: 1.3;">${issue.address || `${issue.location.lat.toFixed(4)}, ${issue.location.lng.toFixed(4)}`}</span>
        </div>

        <!-- Action Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px;">
          <button id="popup-nav-btn" style="background: #0050c8; color: white; border: none; padding: 7px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span>🧭 Navigate</span>
          </button>
          <button id="popup-street-btn" style="background: ${isDarkMode ? '#1e293b' : '#f1f5f9'}; color: ${isDarkMode ? '#f8fafc' : '#0f172a'}; border: 1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}; padding: 7px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span>📷 360° View</span>
          </button>
        </div>

        <!-- Audio Narration & Upvotes Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDarkMode ? '#1e293b' : '#f1f5f9'};">
          <button id="popup-audio-btn" style="background: transparent; border: none; color: #0050c8; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>🔊 Listen Audio</span>
          </button>
          <button id="popup-upvote-btn" style="background: #10B98118; border: 1px solid #10B98140; color: #10B981; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>▲ ${issue.upvotes || 0} Upvotes</span>
          </button>
        </div>
      </div>
    `;

    // Attach event listeners to popup DOM elements
    popupContainer.querySelector('#popup-nav-btn')?.addEventListener('click', () => {
      soundFX.playClick();
      if (handleNav) handleNav(issue);
    });

    popupContainer.querySelector('#popup-street-btn')?.addEventListener('click', () => {
      soundFX.playClick();
      setStreetViewIssue(issue);
    });

    popupContainer.querySelector('#popup-audio-btn')?.addEventListener('click', () => {
      soundFX.playClick();
      audibleNarrator.speakIssue(issue);
    });

    popupContainer.querySelector('#popup-upvote-btn')?.addEventListener('click', () => {
      soundFX.playUpvote();
      if (onUpvote) onUpvote(issue.id);
    });

    const popup = new maplibregl.Popup({
      offset: [0, -45],
      closeButton: false,
      maxWidth: '300px',
    })
      .setLngLat([issue.location.lng, issue.location.lat])
      .setDOMContent(popupContainer)
      .addTo(map);

    activePopupRef.current = popup;
  };

  // -------------------------------------------------------------
  // 7. Render GPS Live Location Marker & Radius
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !liveLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const el = document.createElement('div');
    el.className = 'custom-user-marker';
    const displayName = userName ? userName.split(' ')[0] : 'YOU';

    el.innerHTML = `
      <div style="position: relative; width: 44px; height: 56px; display: flex; flex-direction: column; align-items: center;">
        <!-- Pulsing radar ring on ground -->
        <div style="position: absolute; bottom: 0; width: 28px; height: 12px; border-radius: 50%; background: rgba(0, 80, 200, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>

        <!-- Floating Label Badge -->
        <div style="position: relative; z-index: 2; background: #0050c8; color: white; padding: 2px 7px; border-radius: 12px; font-size: 9px; font-weight: 800; font-family: system-ui, -apple-system, sans-serif; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,80,200,0.4); border: 1.5px solid white; display: flex; align-items: center; gap: 4px; transform: translateY(-2px);">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
          <span>${pointAtLocationOnly ? 'POINTED HERE' : `${displayName.toUpperCase()}`}</span>
        </div>

        <!-- Pointer Pin -->
        <div style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; margin-top: -1px;">
          <div style="width: 26px; height: 26px; border-radius: 50%; background: #1d68f2; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #1d68f2; margin-top: -3px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.35));"></div>
        </div>
      </div>
    `;

    const marker = new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([liveLocation.lng, liveLocation.lat])
      .addTo(map);

    userMarkerRef.current = marker;
  }, [liveLocation, userName, pointAtLocationOnly]);

  // -------------------------------------------------------------
  // 8. Render Clicked / Picked Pin Location
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (clickedMarkerRef.current) {
      clickedMarkerRef.current.remove();
      clickedMarkerRef.current = null;
    }

    if (!clickedLocation) return;

    const el = document.createElement('div');
    el.className = 'custom-clicked-pin';
    el.innerHTML = `
      <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center; animation: bounce 0.4s ease-out;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #0050c8; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 6px 16px rgba(0,80,200,0.5);">
          📍
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #0050c8; margin-top: -2px;"></div>
      </div>
    `;

    const marker = new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([clickedLocation.lng, clickedLocation.lat])
      .addTo(map);

    clickedMarkerRef.current = marker;
  }, [clickedLocation]);

  // -------------------------------------------------------------
  // 9. Render Turn-by-Turn Route Vector Polylines
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRouteLayer = () => {
      if (!map.isStyleLoaded()) return;

      const sourceId = 'navigation-route-source';
      const glowLayerId = 'navigation-route-glow';
      const lineLayerId = 'navigation-route-line';

      if (!routeCoordinates || routeCoordinates.length === 0) {
        if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        return;
      }

      // Convert [lat, lng] to [lng, lat] GeoJSON LineString coordinates
      const coords = routeCoordinates.map(([lat, lng]) => [lng, lat]);
      const geojson = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: coords,
        },
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
        });

        // Glowing underlay
        map.addLayer({
          id: glowLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#0050c8',
            'line-width': 10,
            'line-opacity': 0.4,
            'line-blur': 4,
          },
        });

        // Sharp navigation path
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#10B981',
            'line-width': 5,
          },
        });
      }

      // Auto-fit camera to route bounding box
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 1000 });
    };

    if (map.isStyleLoaded()) {
      updateRouteLayer();
    } else {
      map.once('style.load', updateRouteLayer);
    }
  }, [routeCoordinates]);

  // -------------------------------------------------------------
  // 10. Refresh Map Vector Layers (Traffic, Infrastructure, Wards)
  // -------------------------------------------------------------
  const refreshMapLayers = (map: MapLibreMap) => {
    if (!map.isStyleLoaded()) return;

    // Traffic GeoJSON Layer
    const trafficSourceId = 'civic-traffic-source';
    const trafficLayerId = 'civic-traffic-line';

    if (layerVisibility.traffic) {
      const trafficSegments = getActiveTrafficSegments(center.lat, center.lng);
      const features = trafficSegments.map((seg) => ({
        type: 'Feature' as const,
        properties: {
          congestion: seg.level,
          color:
            seg.level === 'blocked' || seg.level === 'congested'
              ? '#ef4444'
              : seg.level === 'moderate'
              ? '#f59e0b'
              : '#10B981',
          speed: seg.speedKmh,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: seg.coordinates.map(([lat, lng]: [number, number]) => [lng, lat]),
        },
      }));

      const geojson = {
        type: 'FeatureCollection' as const,
        features,
      };

      if (map.getSource(trafficSourceId)) {
        (map.getSource(trafficSourceId) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(trafficSourceId, { type: 'geojson', data: geojson });
        map.addLayer({
          id: trafficLayerId,
          type: 'line',
          source: trafficSourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 4,
            'line-opacity': overlayOpacity,
          },
        });
      }
    } else {
      if (map.getLayer(trafficLayerId)) map.removeLayer(trafficLayerId);
      if (map.getSource(trafficSourceId)) map.removeSource(trafficSourceId);
    }

    // Ward Boundaries GeoJSON Layer
    const wardSourceId = 'civic-ward-source';
    const wardFillLayerId = 'civic-ward-fill';
    const wardLineLayerId = 'civic-ward-line';

    if (layerVisibility.wardBoundaries) {
      const wards = getActiveWardBoundaries(center.lat, center.lng);
      const features = wards.map((w) => ({
        type: 'Feature' as const,
        properties: { name: w.wardName, wardNumber: w.wardNumber },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [w.boundary.map(([lat, lng]: [number, number]) => [lng, lat])],
        },
      }));

      const geojson = { type: 'FeatureCollection' as const, features };

      if (map.getSource(wardSourceId)) {
        (map.getSource(wardSourceId) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(wardSourceId, { type: 'geojson', data: geojson });
        map.addLayer({
          id: wardFillLayerId,
          type: 'fill',
          source: wardSourceId,
          paint: {
            'fill-color': '#0050c8',
            'fill-opacity': 0.15 * overlayOpacity,
          },
        });
        map.addLayer({
          id: wardLineLayerId,
          type: 'line',
          source: wardSourceId,
          paint: {
            'line-color': '#0050c8',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });
      }
    } else {
      if (map.getLayer(wardFillLayerId)) map.removeLayer(wardFillLayerId);
      if (map.getLayer(wardLineLayerId)) map.removeLayer(wardLineLayerId);
      if (map.getSource(wardSourceId)) map.removeSource(wardSourceId);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;
    refreshMapLayers(mapRef.current);
  }, [layerVisibility, overlayOpacity]);

  // -------------------------------------------------------------
  // 11. GPS Acquire & Fly to User
  // -------------------------------------------------------------
  const handleAcquireGps = useCallback(async () => {
    soundFX.playClick();
    setIsAcquiringGps(true);
    setGpsStatusMessage('Connecting to satellite GPS...');

    try {
      const pos = await getCurrentLivePosition();
      const newLoc = { lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy };
      setLiveLocation(newLoc);
      setGpsStatusMessage(`Accurate to ±${Math.round(pos.accuracy)}m`);

      if (onLiveLocationChange) {
        onLiveLocationChange(pos);
      }

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [pos.lng, pos.lat],
          zoom: 16,
          pitch: is3DMode ? 55 : 0,
          essential: true,
          duration: 1200,
        });
      }
    } catch {
      setGpsStatusMessage('Location permission needed or unavailable');
    } finally {
      setIsAcquiringGps(false);
      setTimeout(() => setGpsStatusMessage(null), 4000);
    }
  }, [onLiveLocationChange, is3DMode]);

  // Trigger fly to user when external trigger fires
  useEffect(() => {
    if (flyToUserTrigger && liveLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [liveLocation.lng, liveLocation.lat],
        zoom: 16,
        essential: true,
        duration: 1000,
      });
    }
  }, [flyToUserTrigger]);

  // -------------------------------------------------------------
  // 12. Instant Quick Report Submission from Clicked Pin
  // -------------------------------------------------------------
  const handleQuickSubmit = (category: IssueCategory) => {
    if (!clickedLocation) return;
    soundFX.playSuccess();

    if (onInstantQuickReport) {
      onInstantQuickReport(category, clickedLocation.lat, clickedLocation.lng, clickedLocation.address);
    } else if (onQuickReportAtLocation) {
      onQuickReportAtLocation(clickedLocation.lat, clickedLocation.lng, clickedLocation.address);
    }

    setInstantReportSuccess(`Reported ${category} grievance successfully!`);
    setTimeout(() => {
      setInstantReportSuccess(null);
      setClickedLocation(null);
    }, 2500);
  };

  return (
    <div
      id="civic-map-view-container"
      className={`relative overflow-hidden rounded-2xl border border-[#c2c6d7] dark:border-slate-800 shadow-md ${
        isMapFullscreen ? 'fixed inset-0 z-50 rounded-none h-full w-full' : className
      }`}
    >
      {/* MapLibre GL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left Floating Notice & Overlay Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-auto">
        <MapLayerControlPanel
          visibility={layerVisibility}
          onToggleLayer={handleToggleOverlay}
          onSetAllLayers={handleSetAllLayers}
          onResetDefaults={handleResetDefaultLayers}
          trafficCount={getActiveTrafficSegments().length}
          infrastructureCount={getActiveInfrastructureHotspots().length}
          wardCount={getActiveWardBoundaries().length}
          emergencyCount={EMERGENCY_HOTLINE_PLACES.length}
          issuesCount={issues.length}
          activeHotlineFilter={emergencyHotlineFilter}
          onHotlineFilterChange={setEmergencyHotlineFilter}
          overlayOpacity={overlayOpacity}
          onOpacityChange={setOverlayOpacity}
          isDarkMode={isDarkMode}
        />

        {/* 3D Oblique Vector Perspective Button */}
        <button
          onClick={toggle3DMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md backdrop-blur-md transition-all ${
            is3DMode
              ? 'bg-blue-600 text-white shadow-blue-500/30'
              : 'bg-white/95 dark:bg-slate-900/95 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-100'
          }`}
          title="Toggle 3D Extruded Buildings & Pitch View"
        >
          <Box className="w-3.5 h-3.5" />
          <span>{is3DMode ? '3D Active (55°)' : '3D Vector View'}</span>
        </button>

        {/* Bearing Reset Compass */}
        {currentBearing !== 0 && (
          <button
            onClick={resetBearing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white/95 dark:bg-slate-900/95 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 shadow-md backdrop-blur-md"
            title="Reset North Heading"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" style={{ transform: `rotate(${-currentBearing}deg)` }} />
            <span>Reset North ({currentBearing}°)</span>
          </button>
        )}
      </div>

      {/* Top Right Floating Toolbar: Layers, Fullscreen, GPS */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* Tile Layer Selector */}
        <div className="relative" ref={styleMenuRef}>
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            title="Map Tile Style"
          >
            <Layers className="w-5 h-5" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-2 z-50 text-xs">
              <div className="font-bold text-gray-900 dark:text-white px-2 py-1 mb-1 border-b border-gray-100 dark:border-slate-800">
                Vector & Tile Styles
              </div>
              {(Object.keys(tileUrls) as MapTileLayer[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    soundFX.playClick();
                    setCurrentLayer(key);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex flex-col transition-colors ${
                    currentLayer === key
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tileUrls[key].name}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                    {tileUrls[key].tag}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Locate Me Button */}
        <button
          onClick={handleAcquireGps}
          disabled={isAcquiringGps}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Fly to GPS Location"
        >
          {isAcquiringGps ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
        </button>

        {/* Zoom In */}
        <button
          onClick={() => {
            soundFX.playClick();
            mapRef.current?.zoomIn();
          }}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => {
            soundFX.playClick();
            mapRef.current?.zoomOut();
          }}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => {
            soundFX.playClick();
            setIsMapFullscreen(!isMapFullscreen);
          }}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Floating Status Bar & Pictorial Filters */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col items-center gap-2 pointer-events-none">
        {/* GPS Status Message Toast */}
        {gpsStatusMessage && (
          <div className="bg-gray-900/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-in fade-in">
            {gpsStatusMessage}
          </div>
        )}

        {/* Clicked Location 1-Click Quick Report Drawer */}
        {clickedLocation && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-slate-800 pointer-events-auto animate-in slide-in-from-bottom-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  📍
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    {clickedLocation.district || 'Selected Map Location'}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {clickedLocation.address}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setClickedLocation(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {instantReportSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs p-2 rounded-xl font-bold text-center">
                ✅ {instantReportSuccess}
              </div>
            ) : (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  1-Click Instant Report at this spot:
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleQuickSubmit('Water Supply & Leakages')}
                    className="flex flex-col items-center p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors text-center"
                  >
                    <span className="text-lg mb-1">🚰</span>
                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Water</span>
                  </button>
                  <button
                    onClick={() => handleQuickSubmit('Garbage & Solid Waste')}
                    className="flex flex-col items-center p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-center"
                  >
                    <span className="text-lg mb-1">🗑️</span>
                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Garbage</span>
                  </button>
                  <button
                    onClick={() => handleQuickSubmit('Roads & Potholes')}
                    className="flex flex-col items-center p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors text-center"
                  >
                    <span className="text-lg mb-1">🕳️</span>
                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Pothole</span>
                  </button>
                  <button
                    onClick={() => handleQuickSubmit('Street Lighting & Electrical')}
                    className="flex flex-col items-center p-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/60 transition-colors text-center"
                  >
                    <span className="text-lg mb-1">💡</span>
                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Light</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pictorial Category Quick Filter Bar */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-1.5 flex items-center gap-1 pointer-events-auto overflow-x-auto max-w-full">
          {pictorialCategoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundFX.playClick();
                setPictorialCategory(cat.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                pictorialCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 360° Street View Panoramic Inspector Modal */}
      {streetViewIssue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-800">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-base flex items-center gap-2">
                  <span>📷 360° Ground Inspection</span>
                  <span className="bg-blue-600/30 text-blue-400 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30 font-semibold">
                    OpenStreetMap Ground Imagery
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{streetViewIssue.address}</div>
              </div>
              <button
                onClick={() => setStreetViewIssue(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated 360° Viewer Screen */}
            <div className="relative h-72 bg-black overflow-hidden flex items-center justify-center">
              <div
                className="w-full h-full bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage: `url(${streetViewIssue.imageUrl || 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=1200&q=80'})`,
                  transform: `scale(1.2) rotate(${streetAngle * 0.05}deg) translateX(${streetAngle * 2}px)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/10">
                Lat: {streetViewIssue.location.lat.toFixed(4)}, Lng: {streetViewIssue.location.lng.toFixed(4)}
              </div>
            </div>

            {/* Street Angle Slider & Controls */}
            <div className="p-4 bg-slate-950 flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">Pan Angle:</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={streetAngle}
                  onChange={(e) => setStreetAngle(parseInt(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-12 text-right">{streetAngle}°</span>
              </div>
              <button
                onClick={() => {
                  const issue = streetViewIssue;
                  setStreetViewIssue(null);
                  if (handleNav) handleNav(issue);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Start Navigation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
