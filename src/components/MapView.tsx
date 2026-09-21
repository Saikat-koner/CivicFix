import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
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
  AlertCircle
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

export const MapView: React.FC<MapViewProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
  onStartNavigation,
  onNavigateIssue,
  activeStatusFilter: activeStatusFilterProp,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
  center = { lat: 20.5937, lng: 78.9629 }, // Default to Center of India
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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const emergencyPlacesGroupRef = useRef<L.LayerGroup | null>(null);
  const heatCirclesGroupRef = useRef<L.LayerGroup | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const clickedPinMarkerRef = useRef<L.Marker | null>(null);
  const trafficLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const infrastructureGroupRef = useRef<L.LayerGroup | null>(null);
  const wardBoundariesGroupRef = useRef<L.LayerGroup | null>(null);

  // High reliability OpenStreetMap and Open GIS tile layers
  const [currentLayer, setCurrentLayer] = useState<MapTileLayer>(isDarkMode ? 'dark' : 'osm');

  // Synchronize tile layer with dark mode theme if using standard base maps
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
  const [emergencyHotlineFilter, setEmergencyHotlineFilter] = useState<'all' | '112' | '1533' | '1916' | '1912' | '1033' | '103'>('all');
  const [streetViewIssue, setStreetViewIssue] = useState<CivicIssue | null>(null);
  const [streetAngle, setStreetAngle] = useState(0);

  // Radical Accessibility & De-congestion: Easy Pictorial Mode for low-literacy users
  const [easyMode, setEasyMode] = useState<boolean>(true);
  const [pictorialCategory, setPictorialCategory] = useState<'all' | 'water' | 'garbage' | 'road' | 'light' | 'drain' | 'safety'>('all');
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

  const currentCategoryObj = pictorialCategoriesList.find((c) => c.id === pictorialCategory) || pictorialCategoriesList[0];

  // Map Overlay Visibility State: De-congested by default (traffic/infra/wards hidden)
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

  // Live Location & GPS Tracking State (Pan-India default)
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
      mapInstanceRef.current?.invalidateSize();
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
    { url: string; subdomains: string[]; attribution: string; name: string; tag: string }
  > = {
    osm: {
      name: 'OpenStreetMap India Standard',
      tag: 'Indian & Global Geographic Base',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '© OpenStreetMap contributors',
    },
    voyager: {
      name: 'Urban Streets (Esri)',
      tag: 'Crisp Urban Vector Raster',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      subdomains: [],
      attribution: '© Esri, HERE, Garmin, OpenStreetMap contributors',
    },
    positron: {
      name: 'Light Gray Canvas',
      tag: 'High-Contrast Neutral Base',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      subdomains: [],
      attribution: '© Esri, HERE, Garmin, OpenStreetMap contributors',
    },
    dark: {
      name: 'Dark Gray Canvas',
      tag: 'Night Inspection & Outages',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      subdomains: [],
      attribution: '© Esri, HERE, Garmin, OpenStreetMap contributors',
    },
    hot: {
      name: 'Humanitarian (HOT)',
      tag: 'Infrastructure Density',
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '© OpenStreetMap contributors, HOT',
    },
    cyclosm: {
      name: 'CyclOSM Mobility',
      tag: 'Roads & Cycling Lanes',
      url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '© OpenStreetMap contributors, CyclOSM',
    },
    topo: {
      name: 'OpenTopo (Contour)',
      tag: 'Elevation & Terrain',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '© OpenStreetMap, © OpenTopoMap',
    },
    satellite: {
      name: 'Satellite Aerial',
      tag: 'World Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      subdomains: [],
      attribution: '© Esri, Maxar, Earthstar Geographics',
    },
  };

  // Helper to extract intuitive pictorial metadata for low-literacy & rural citizens
  const getIssuePictorialInfo = (issue: CivicIssue) => {
    const cat = (issue.category || '').toLowerCase();
    const text = ((issue.title || '') + ' ' + (issue.description || '')).toLowerCase();

    let emoji = '⚠️';
    let categoryKey: 'water' | 'garbage' | 'road' | 'light' | 'drain' | 'safety' | 'other' = 'other';
    let engName = 'Civic Issue';

    if (text.includes('water') || text.includes('leak') || text.includes('paani') || text.includes('pipe') || text.includes('tap') || text.includes('jal') || text.includes('supply')) {
      emoji = '🚰';
      categoryKey = 'water';
      engName = 'Water Pipeline Leak';
    } else if (text.includes('drain') || text.includes('sewage') || text.includes('sewer') || text.includes('naali') || text.includes('gutter') || text.includes('overflow') || text.includes('ganda')) {
      emoji = '🚽';
      categoryKey = 'drain';
      engName = 'Sewage / Drain Blockage';
    } else if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('kooda') || text.includes('kachra') || text.includes('dump') || cat.includes('sanitat')) {
      emoji = '🗑️';
      categoryKey = 'garbage';
      engName = 'Garbage & Waste Pile';
    } else if (cat.includes('road') || text.includes('pothole') || text.includes('gaddha') || text.includes('road') || text.includes('asphalt') || text.includes('tar') || text.includes('divider') || text.includes('crack')) {
      emoji = '🕳️';
      categoryKey = 'road';
      engName = 'Road Pothole / Broken Road';
    } else if (text.includes('light') || text.includes('electric') || text.includes('wire') || text.includes('batti') || text.includes('pole') || text.includes('dark') || text.includes('bulb')) {
      emoji = '💡';
      categoryKey = 'light';
      engName = 'Streetlight Off / Electrical';
    } else if (cat.includes('safety') || text.includes('danger') || text.includes('hazard') || text.includes('accident') || text.includes('fire') || text.includes('khatra')) {
      emoji = '⚠️';
      categoryKey = 'safety';
      engName = 'Public Safety Hazard';
    } else if (cat.includes('park') || text.includes('tree') || text.includes('ped') || text.includes('branch')) {
      emoji = '🌳';
      categoryKey = 'other';
      engName = 'Fallen Tree / Park Issue';
    }

    // Universal Traffic-Light Status Colors:
    // RED: Pending Action (Open)
    // AMBER: Work in Progress
    // GREEN: Resolved & Clean
    let statusColor = '#ef4444'; // Red
    let statusBadge = '❌';
    let engStatus = 'Pending Action';

    if (issue.status === 'fixed') {
      statusColor = '#10B981'; // Green
      statusBadge = '✅';
      engStatus = 'Resolved & Clean';
    } else if (issue.status === 'investigating') {
      statusColor = '#f59e0b'; // Amber / Orange
      statusBadge = '⏳';
      engStatus = 'In Progress';
    }

    return { emoji, categoryKey, engName, statusColor, statusBadge, engStatus };
  };

  // Helper to create accessible pictorial status pin icons for low-literacy citizens
  const createStatusIcon = (issue: CivicIssue, isSelected: boolean, isEasy: boolean = true) => {
    const { emoji, statusColor, statusBadge } = getIssuePictorialInfo(issue);
    const scale = isSelected ? 1.25 : 1.0;
    const shadowClass = isSelected
      ? 'filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.5));'
      : 'filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.28));';

    const size: [number, number] = isEasy ? [44, 52] : [36, 44];
    const anchor: [number, number] = isEasy ? [22, 52] : [18, 44];
    const popupAnchor: [number, number] = isEasy ? [0, -50] : [0, -42];

    const html = `
      <div style="position: relative; width: ${size[0]}px; height: ${size[1]}px; display: flex; flex-direction: column; align-items: center; transform: scale(${scale}); transform-origin: bottom center; transition: all 0.2s ease; cursor: pointer; ${shadowClass}">
        <!-- Outer Pictorial Badge -->
        <div style="
          position: relative;
          width: ${isEasy ? 38 : 32}px;
          height: ${isEasy ? 38 : 32}px;
          border-radius: 50%;
          background: #ffffff;
          border: ${isEasy ? '3.5px' : '3px'} solid ${statusColor};
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95), 0 3px 6px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isEasy ? '21px' : '17px'};
          line-height: 1;
          user-select: none;
        ">
          <span>${emoji}</span>
        </div>

        <!-- Arrow Pointer Tip -->
        <div style="
          width: 0;
          height: 0;
          border-left: ${isEasy ? '7px' : '6px'} solid transparent;
          border-right: ${isEasy ? '7px' : '6px'} solid transparent;
          border-top: ${isEasy ? '9px' : '7px'} solid ${statusColor};
          margin-top: -2px;
        "></div>

        <!-- Status Icon Badge on corner (❌ red, ⏳ amber, ✅ green) -->
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

    return L.divIcon({
      className: 'custom-civic-pin',
      html,
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: popupAnchor,
    });
  };

  // Helper for User GPS Location Marker with prominent pointer pin
  const createUserIcon = (name?: string, isPointingOnly?: boolean) => {
    const displayName = name ? name.split(' ')[0] : 'YOU';
    const html = `
      <div style="position: relative; width: 44px; height: 56px; display: flex; flex-direction: column; align-items: center;">
        <!-- Pulsing radar ring on ground -->
        <div style="position: absolute; bottom: 0; width: 28px; height: 12px; border-radius: 50%; background: rgba(29, 104, 242, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Floating Pointer Label Badge -->
        <div style="position: relative; z-index: 2; background: #0050c8; color: white; padding: 2px 7px; border-radius: 12px; font-size: 9px; font-weight: 800; font-family: system-ui, -apple-system, sans-serif; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,80,200,0.4); border: 1.5px solid white; display: flex; align-items: center; gap: 4px; transform: translateY(-2px);">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
          <span>${isPointingOnly ? 'POINTED HERE' : `${displayName.toUpperCase()}`}</span>
        </div>

        <!-- Pointer Pin & Cone -->
        <div style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; margin-top: -1px;">
          <div style="width: 26px; height: 26px; border-radius: 50%; background: #1d68f2; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
          </div>
          <!-- Arrow pointing downwards -->
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #1d68f2; margin-top: -3px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.35));"></div>
        </div>
      </div>
    `;
    return L.divIcon({
      className: 'custom-user-pointer-pin',
      html,
      iconSize: [44, 56],
      iconAnchor: [22, 54],
      popupAnchor: [0, -50],
    });
  };

  // Helper for Clicked Map Location Pin
  const createClickedPinIcon = () => {
    const html = `
      <div style="position: relative; width: 38px; height: 48px; filter: drop-shadow(0 8px 14px rgba(220, 38, 38, 0.45));">
        <div style="position: absolute; bottom: 0; left: 10px; width: 18px; height: 8px; border-radius: 50%; background: rgba(0,0,0,0.25); filter: blur(2px);"></div>
        <svg viewBox="0 0 24 24" width="38" height="48" fill="#dc2626">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <div style="position: absolute; top: 9px; left: 13px; width: 12px; height: 12px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #dc2626;"></div>
        </div>
        <div style="position: absolute; -top: 4px; right: -2px; background: #dc2626; color: white; font-size: 9px; font-weight: bold; border-radius: 9999px; padding: 1px 4px; border: 1.5px solid white;">
          +
        </div>
      </div>
    `;
    return L.divIcon({
      className: 'clicked-report-pin',
      html,
      iconSize: [38, 48],
      iconAnchor: [19, 48],
    });
  };

  // Helper to create distinctive Emergency Hotline Place marker icons
  const createEmergencyIcon = (place: EmergencyHotlinePlace, isSelected: boolean) => {
    let badgeColor = '#dc2626'; // 112
    let iconSvg = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`; // Shield

    if (place.hotlineNumber === '1533') {
      badgeColor = '#0050c8'; // Municipal Blue
      iconSvg = `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>`;
    } else if (place.hotlineNumber === '1916') {
      badgeColor = '#0284c7'; // Water Cyan
      iconSvg = `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>`;
    } else if (place.hotlineNumber === '1912') {
      badgeColor = '#d97706'; // Power Amber
      iconSvg = `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`;
    } else if (place.hotlineNumber === '1033') {
      badgeColor = '#4f46e5'; // NHAI Highway Indigo
      iconSvg = `<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H8.5a1 1 0 0 0-.8.4L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0v2a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2m-8 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/>`;
    } else if (place.hotlineNumber === '103') {
      badgeColor = '#ea580c'; // Traffic Police Orange
      iconSvg = `<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H8.5a1 1 0 0 0-.8.4L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0v2a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2m-8 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/>`;
    }

    const scale = isSelected ? 1.3 : 1.0;
    const shadowClass = isSelected
      ? 'filter: drop-shadow(0px 8px 16px rgba(220,38,38,0.55));'
      : 'filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.35));';

    const html = `
      <div style="position: relative; width: 44px; height: 52px; transform: scale(${scale}); transform-origin: bottom center; transition: all 0.2s ease; ${shadowClass}; display: flex; flex-direction: column; align-items: center;">
        <!-- Top Number Pill -->
        <div style="background: ${badgeColor}; color: white; padding: 1.5px 6px; border-radius: 9999px; font-size: 8.5px; font-weight: 900; font-family: system-ui, -apple-system, sans-serif; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 1.5px solid white; display: flex; align-items: center; gap: 3px; z-index: 2;">
          <span style="width: 4px; height: 4px; border-radius: 50%; background: #4ade80; display: inline-block;"></span>
          <span>${place.hotlineNumber}</span>
        </div>
        <!-- Pin Body -->
        <div style="position: relative; width: 32px; height: 38px; margin-top: -3px;">
          <svg viewBox="0 0 24 24" width="32" height="38" fill="${badgeColor}">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <div style="position: absolute; top: 6px; left: 8px; width: 16px; height: 16px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="10" height="10" stroke="${badgeColor}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              ${iconSvg}
            </svg>
          </div>
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-emergency-pin',
      html,
      iconSize: [44, 52],
      iconAnchor: [22, 52],
      popupAnchor: [0, -50],
    });
  };

  // Helper for emergency place popup HTML
  const getEmergencyPlacePopupHtml = (place: EmergencyHotlinePlace) => {
    let badgeColor = '#dc2626';
    if (place.hotlineNumber === '1533') badgeColor = '#0050c8';
    else if (place.hotlineNumber === '1916') badgeColor = '#0284c7';
    else if (place.hotlineNumber === '1912') badgeColor = '#d97706';
    else if (place.hotlineNumber === '103') badgeColor = '#ea580c';

    return `
      <div style="padding: 8px 10px; font-family: system-ui, -apple-system, sans-serif; min-width: 250px; max-width: 290px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          <span style="background: ${badgeColor}; color: white; font-size: 9px; font-weight: 900; padding: 2px 7px; border-radius: 9999px; letter-spacing: 0.5px;">
            DIAL ${place.hotlineNumber} HELPLINE
          </span>
          <span style="font-size: 10px; font-weight: 700; color: #16a34a; display: flex; align-items: center; gap: 3px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
            ~${place.responseTimeMinutes}m response
          </span>
        </div>

        <h4 style="font-size: 12.5px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
          ${place.name}
        </h4>

        <p style="font-size: 10.5px; color: #475569; margin: 0 0 8px 0; line-height: 1.4;">
          ${place.description}
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; font-size: 10px; color: #334155; margin-bottom: 8px;">
          <div><strong>📍 Address:</strong> ${place.address}</div>
          <div style="margin-top: 2px;"><strong>🏛️ Sector:</strong> ${place.ward}</div>
          <div style="margin-top: 2px;"><strong>🚒 Fleet:</strong> ${place.vehiclesAvailable.join(', ')}</div>
        </div>

        <div style="display: flex; gap: 6px;">
          <a href="tel:${place.hotlineNumber}" style="flex: 1; text-align: center; background: ${badgeColor}; color: white; font-size: 11px; font-weight: 800; text-decoration: none; padding: 7px 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); display: inline-block;">
            📞 Call ${place.hotlineNumber} Now
          </a>
        </div>
      </div>
    `;
  };

  // Perform reverse geocoding when user clicks on the map
  const handleMapClickCoordinate = async (lat: number, lng: number) => {
    soundFX.playClick();
    setInstantReportSuccess(null);

    // Initial placeholder while geocoding
    const initialAddress = `Near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
    setClickedLocation({
      lat,
      lng,
      address: initialAddress,
      district: 'City Ward',
      isGeocoding: true,
    });

    if (mapInstanceRef.current) {
      if (clickedPinMarkerRef.current) {
        clickedPinMarkerRef.current.setLatLng([lat, lng]);
      } else {
        clickedPinMarkerRef.current = L.marker([lat, lng], {
          icon: createClickedPinIcon(),
          zIndexOffset: 1000,
        }).addTo(mapInstanceRef.current);
      }
    }

    try {
      const wardInfo = await reverseGeocodeWardAndDistrict(lat, lng);
      setClickedLocation({
        lat,
        lng,
        address: wardInfo.formattedAddress || initialAddress,
        district: wardInfo.ward || wardInfo.district || 'Municipal Ward',
        isGeocoding: false,
      });
      if (onLocationPicked) {
        onLocationPicked(lat, lng, wardInfo.formattedAddress || initialAddress);
      }
    } catch {
      setClickedLocation({
        lat,
        lng,
        address: initialAddress,
        district: 'Municipal Ward',
        isGeocoding: false,
      });
      if (onLocationPicked) {
        onLocationPicked(lat, lng, initialAddress);
      }
    }
  };

  // Clear clicked location pin
  const handleClearClickedPin = () => {
    soundFX.playClick();
    setClickedLocation(null);
    setInstantReportSuccess(null);
    if (clickedPinMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(clickedPinMarkerRef.current);
      clickedPinMarkerRef.current = null;
    }
  };

  // 1-Click Instant Report Action
  const handleTriggerInstantReport = (category: IssueCategory) => {
    if (!clickedLocation) return;
    soundFX.playSuccess();
    if (onInstantQuickReport) {
      onInstantQuickReport(category, clickedLocation.lat, clickedLocation.lng, clickedLocation.address);
    } else if (onQuickReportAtLocation) {
      onQuickReportAtLocation(clickedLocation.lat, clickedLocation.lng, clickedLocation.address);
    }
    setInstantReportSuccess(`Report for ${category} submitted at this location!`);
    setTimeout(() => {
      setInstantReportSuccess(null);
    }, 4000);
  };

  // Initialize Map with OpenStreetMap Tile Layer and ResizeObserver
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      const activeStyle = tileUrls[currentLayer];
      const tileLayer = L.tileLayer(activeStyle.url, {
        maxZoom: 19,
        subdomains: activeStyle.subdomains.length > 0 ? activeStyle.subdomains : 'abc',
        attribution: activeStyle.attribution,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      L.control
        .attribution({ position: 'bottomright', prefix: '© OpenStreetMap contributors' })
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      const emergencyGroup = L.layerGroup().addTo(map);
      emergencyPlacesGroupRef.current = emergencyGroup;

      const heatGroup = L.layerGroup().addTo(map);
      heatCirclesGroupRef.current = heatGroup;

      const trafficGroup = L.layerGroup().addTo(map);
      trafficLayerGroupRef.current = trafficGroup;

      const infrastructureGroup = L.layerGroup().addTo(map);
      infrastructureGroupRef.current = infrastructureGroup;

      const wardBoundariesGroup = L.layerGroup().addTo(map);
      wardBoundariesGroupRef.current = wardBoundariesGroup;

      mapInstanceRef.current = map;

      // Handle map clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        handleMapClickCoordinate(lat, lng);
      });
    }

    // Attach ResizeObserver to keep map tiles seamless without blank spots
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle Layer switching
  const handleSwitchLayer = (layerKey: MapTileLayer) => {
    soundFX.playClick();
    setCurrentLayer(layerKey);
    setShowLayerMenu(false);
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const style = tileUrls[layerKey];
      const newLayer = L.tileLayer(style.url, {
        maxZoom: 19,
        subdomains: style.subdomains.length > 0 ? style.subdomains : 'abc',
        attribution: style.attribution,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  };

  // Render Civic Issue Markers & Popups with Radical Accessibility for low-literacy users
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // Filter issues by status, pictorial category & pointAtLocationOnly mode
    const visibleIssues = pointAtLocationOnly || !layerVisibility.civicIssues
      ? []
      : issues.filter((i) => {
          if (currentFilter !== 'all' && i.status !== currentFilter) return false;
          if (pictorialCategory !== 'all') {
            const info = getIssuePictorialInfo(i);
            if (info.categoryKey !== pictorialCategory) return false;
          }
          return true;
        });

    visibleIssues.forEach((issue) => {
      const isSelected = selectedIssue?.id === issue.id;
      const { emoji, engName, statusColor, statusBadge, engStatus } = getIssuePictorialInfo(issue);

      const marker = L.marker([issue.location.lat, issue.location.lng], {
        icon: createStatusIcon(issue, isSelected, easyMode),
        zIndexOffset: isSelected ? 500 : 10,
      });

      // Accessible Leaflet Popup with Indian Municipal Case Details & Voice Narration
      const popupContent = document.createElement('div');
      popupContent.className = 'civic-popup-card';
      popupContent.innerHTML = `
        <div style="font-family: system-ui, -apple-system, sans-serif; width: 260px; padding: 2px;">
          <div style="position: relative; height: 115px; border-radius: 12px; overflow: hidden; margin-bottom: 8px; background: #f3f4f6;">
            <img src="${issue.imageUrl}" alt="${issue.title}" style="width: 100%; height: 100%; object-fit: cover;" />
            <!-- Pictorial Emoji Badge in Top Left -->
            <div style="position: absolute; top: 6px; left: 6px; background: rgba(255,255,255,0.95); border-radius: 8px; padding: 2px 7px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1.5px solid ${statusColor};">
              <span style="font-size: 16px;">${emoji}</span>
              <span style="font-size: 11px; font-weight: 800; color: #121c28;">${issue.code}</span>
            </div>
            <!-- Status Tag in Top Right with Emoji -->
            <div style="position: absolute; top: 6px; right: 6px; background: ${statusColor}; color: white; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 3px;">
              <span>${statusBadge}</span>
              <span>${issue.status === 'fixed' ? 'Fixed' : issue.status === 'investigating' ? 'In Progress' : 'Open'}</span>
            </div>
          </div>

          <!-- Title & Category in English -->
          <div style="margin-bottom: 4px;">
            <div style="font-size: 11px; font-weight: 800; color: ${statusColor}; display: flex; align-items: center; gap: 4px;">
              <span>${emoji}</span>
              <span>${engName}</span>
            </div>
            <h4 style="margin: 2px 0 0 0; font-size: 13px; font-weight: 800; color: #121c28; line-height: 1.3;">
              ${issue.title}
            </h4>
          </div>

          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.3;">
            📍 ${issue.address}
          </p>

          <!-- Voice Audio Button -->
          <button id="popup-btn-speak-${issue.id}" style="width: 100%; margin-bottom: 8px; padding: 8px 10px; font-size: 12px; font-weight: 800; background: #fff7ed; color: #c2410c; border: 1.5px solid #fed7aa; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: background 0.15s;">
            <span style="font-size: 15px;">🔊</span>
            <span>Listen Aloud</span>
          </button>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 6px; margin-bottom: 8px;">
            <span>Ward: ${issue.district.split('(')[0].trim()}</span>
            <button id="popup-btn-upvote-${issue.id}" style="padding: 4px 9px; font-size: 11px; font-weight: 800; background: ${issue.hasUpvoted ? '#EDF4FF' : '#ffffff'}; color: ${issue.hasUpvoted ? '#0050c8' : '#334155'}; border: 1.5px solid ${issue.hasUpvoted ? '#1d68f2' : '#cbd5e1'}; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.15s;">
              <span style="font-size: 10px; color: ${issue.hasUpvoted ? '#0050c8' : '#64748b'};">▲</span>
              <span>${issue.upvotes}</span>
              <span>${issue.hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button id="popup-btn-select-${issue.id}" style="padding: 7px; font-size: 11px; font-weight: 800; background: #EDF4FF; color: #0050c8; border: 1px solid #c2c6d7; border-radius: 8px; cursor: pointer;">
              View Details
            </button>
            <button id="popup-btn-street-${issue.id}" style="padding: 7px; font-size: 11px; font-weight: 800; background: #121c28; color: white; border: none; border-radius: 8px; cursor: pointer;">
              360° View
            </button>
          </div>
        </div>
      `;

      // Attach Click Listeners inside the Leaflet Popup DOM
      marker.bindPopup(popupContent, { maxWidth: 300, closeButton: true });

      marker.on('popupopen', () => {
        const selectBtn = document.getElementById(`popup-btn-select-${issue.id}`);
        const streetBtn = document.getElementById(`popup-btn-street-${issue.id}`);
        const speakBtn = document.getElementById(`popup-btn-speak-${issue.id}`);
        const upvoteBtn = document.getElementById(`popup-btn-upvote-${issue.id}`);

        if (upvoteBtn) {
          upvoteBtn.onclick = (ev) => {
            ev.stopPropagation();
            soundFX.playClick();
            if (onUpvote) {
              onUpvote(issue.id);
            }
          };
        }

        if (selectBtn) {
          selectBtn.onclick = (ev) => {
            ev.stopPropagation();
            soundFX.playClick();
            onSelectIssue(issue);
            marker.closePopup();
          };
        }

        if (streetBtn) {
          streetBtn.onclick = (ev) => {
            ev.stopPropagation();
            soundFX.playClick();
            setStreetViewIssue(issue);
            marker.closePopup();
          };
        }

        if (speakBtn) {
          speakBtn.onclick = (ev) => {
            ev.stopPropagation();
            soundFX.playClick();
            const engSpeech = `${engName}. ${issue.title}. Current status: ${engStatus}. Located at: ${issue.address}.`;
            audibleNarrator.speak(engSpeech);
          };
        }
      });

      marker.on('click', (ev) => {
        // Prevent map click from overriding issue selection
        L.DomEvent.stopPropagation(ev);
        soundFX.playClick();
        onSelectIssue(issue);
      });

      markersGroupRef.current?.addLayer(marker);
    });
  }, [issues, selectedIssue, currentFilter, pointAtLocationOnly, layerVisibility.civicIssues, easyMode, pictorialCategory]);

  // Center on Selected Issue
  useEffect(() => {
    if (selectedIssue && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedIssue.location.lat, selectedIssue.location.lng],
        16,
        { duration: 1.2 }
      );
    }
  }, [selectedIssue]);

  // Update Hazard Density Heatmap & Proximity Radar
  useEffect(() => {
    if (!mapInstanceRef.current || !heatCirclesGroupRef.current) return;

    heatCirclesGroupRef.current.clearLayers();

    if (showHeatmap) {
      issues.forEach((issue) => {
        const isUrgent = issue.severity === 'High';
        const color = isUrgent ? '#ba1a1a' : '#f88400';
        const radius = isUrgent ? 260 : 180;

        const circle = L.circle([issue.location.lat, issue.location.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          radius: radius,
          weight: 1,
        });
        heatCirclesGroupRef.current?.addLayer(circle);
      });
    }

    if (showRadar && liveLocation) {
      if (radarCircleRef.current) {
        mapInstanceRef.current.removeLayer(radarCircleRef.current);
      }
      const radar = L.circle([liveLocation.lat, liveLocation.lng], {
        color: '#1d68f2',
        fillColor: '#1d68f2',
        fillOpacity: 0.08,
        radius: 800, // 800m ward proximity circle
        weight: 1.5,
        dashArray: '4, 8',
      }).addTo(mapInstanceRef.current);
      radarCircleRef.current = radar;
    } else if (!showRadar && radarCircleRef.current) {
      mapInstanceRef.current.removeLayer(radarCircleRef.current);
      radarCircleRef.current = null;
    }
  }, [showHeatmap, showRadar, issues, liveLocation]);

  // Render Navigation Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeCoordinates && routeCoordinates.length > 0) {
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }
      const polyline = L.polyline(routeCoordinates, {
        color: '#10B981',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);
      routeLayerRef.current = polyline;

      mapInstanceRef.current.fitBounds(polyline.getBounds(), {
        padding: [40, 40],
      });
    } else if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
  }, [routeCoordinates]);

  // ==========================================
  // 1. RENDER TRAFFIC DATA & MOBILITY OVERLAY
  // ==========================================
  useEffect(() => {
    if (!mapInstanceRef.current || !trafficLayerGroupRef.current) return;
    trafficLayerGroupRef.current.clearLayers();

    if (!layerVisibility.traffic) return;

    const currentCenter = liveLocation || center;
    const segments = getActiveTrafficSegments(currentCenter.lat, currentCenter.lng);

    segments.forEach((seg) => {
      let strokeColor = '#10B981'; // smooth flow
      let badgeBg = '#10B981';
      let dashArray: string | undefined = undefined;

      if (seg.level === 'moderate') {
        strokeColor = '#f59e0b';
        badgeBg = '#f59e0b';
      } else if (seg.level === 'congested') {
        strokeColor = '#dc2626';
        badgeBg = '#dc2626';
      } else if (seg.level === 'blocked') {
        strokeColor = '#7f1d1d';
        badgeBg = '#7f1d1d';
        dashArray = '6, 6';
      }

      // Polyline on Leaflet
      const polyline = L.polyline(seg.coordinates, {
        color: strokeColor,
        weight: 6,
        opacity: overlayOpacity,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray,
      });

      // Interactive Popup with Live Speed & Delays
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 6px; min-width: 230px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 900; background: ${badgeBg}; color: white; padding: 2px 7px; border-radius: 9999px; text-transform: uppercase;">
              ${seg.level.toUpperCase()} FLOW
            </span>
            <span style="font-size: 10px; color: #64748b; font-weight: 600;">
              ${seg.lastUpdated}
            </span>
          </div>
          <h4 style="font-size: 12.5px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
            ${seg.corridorName}
          </h4>
          <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin: 6px 0; font-size: 11px;">
            <div>
              <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">Speed</div>
              <strong style="color: ${badgeBg}; font-size: 14px;">${seg.speedKmh} km/h</strong>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">Free Flow</div>
              <span style="font-weight: 700; color: #334155;">${seg.freeFlowSpeedKmh} km/h</span>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">Delay</div>
              <strong style="color: ${seg.delayMinutes > 0 ? '#dc2626' : '#10B981'}; font-size: 12px;">+${seg.delayMinutes}m</strong>
            </div>
          </div>
          ${
            seg.incident
              ? `<div style="font-size: 10.5px; color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 5px 7px; margin-top: 5px; line-height: 1.3;">
                  ⚠️ <strong>Notice:</strong> ${seg.incident}
                </div>`
              : ''
          }
        </div>
      `;

      polyline.bindPopup(popupHtml, { maxWidth: 280, className: 'custom-traffic-popup' });
      trafficLayerGroupRef.current?.addLayer(polyline);

      // Midpoint Speed Badge Pill Marker
      if (seg.coordinates.length >= 2) {
        const midIdx = Math.floor(seg.coordinates.length / 2);
        const midCoord = seg.coordinates[midIdx];
        const speedHtml = `
          <div style="position: relative; transform: translate(-50%, -50%); pointer-events: none;">
            <div style="background: ${badgeBg}; color: white; font-size: 9px; font-weight: 800; padding: 1.5px 6px; border-radius: 9999px; box-shadow: 0 2px 5px rgba(0,0,0,0.35); border: 1.5px solid white; display: flex; align-items: center; gap: 3px; white-space: nowrap; font-family: system-ui, -apple-system, sans-serif;">
              <span>${seg.level === 'congested' || seg.level === 'blocked' ? '⚠️' : '🚗'}</span>
              <span>${seg.speedKmh} km/h</span>
            </div>
          </div>
        `;
        const speedIcon = L.divIcon({
          className: 'traffic-speed-badge',
          html: speedHtml,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        });
        const speedMarker = L.marker(midCoord, { icon: speedIcon, zIndexOffset: 200 });
        trafficLayerGroupRef.current?.addLayer(speedMarker);
      }
    });
  }, [layerVisibility.traffic, liveLocation, center, overlayOpacity]);

  // ====================================================
  // 2. RENDER CRITICAL INFRASTRUCTURE HOTSPOTS OVERLAY
  // ====================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !infrastructureGroupRef.current) return;
    infrastructureGroupRef.current.clearLayers();

    if (!layerVisibility.infrastructure) return;

    const currentCenter = liveLocation || center;
    const hotspots = getActiveInfrastructureHotspots(currentCenter.lat, currentCenter.lng);

    hotspots.forEach((spot) => {
      let haloColor = '#0050c8';
      let statusText = 'Optimal';
      let statusBg = '#10B981';

      if (spot.status === 'warning') {
        haloColor = '#f59e0b';
        statusText = 'Elevated Load';
        statusBg = '#f59e0b';
      } else if (spot.status === 'critical') {
        haloColor = '#dc2626';
        statusText = 'Critical Stress';
        statusBg = '#dc2626';
      }

      // Hotspot Halo Circle
      const halo = L.circle([spot.location.lat, spot.location.lng], {
        color: haloColor,
        fillColor: haloColor,
        fillOpacity: 0.16 * (overlayOpacity / 0.85),
        radius: spot.status === 'critical' ? 220 : 160,
        weight: 1.5,
        dashArray: spot.status === 'critical' ? '4, 6' : undefined,
      });
      infrastructureGroupRef.current?.addLayer(halo);

      let categoryEmoji = '⚡';
      if (spot.category === 'water_pumping') categoryEmoji = '💧';
      else if (spot.category === 'stormwater_sluice') categoryEmoji = '🌊';
      else if (spot.category === 'transit_hub') categoryEmoji = '🚆';
      else if (spot.category === 'waste_compactor') categoryEmoji = '🗑️';
      else if (spot.category === 'bridge_flyover') categoryEmoji = '🌉';

      const iconHtml = `
        <div style="position: relative; width: 36px; height: 42px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
          <div style="background: white; border: 2px solid ${haloColor}; border-radius: 12px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 15px; position: relative;">
            <span>${categoryEmoji}</span>
            <span style="position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; border-radius: 50%; background: ${statusBg}; border: 1.5px solid white;"></span>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${haloColor}; margin-top: -1px;"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-infrastructure-pin',
        html: iconHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 40],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([spot.location.lat, spot.location.lng], { icon, zIndexOffset: 250 });

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 6px; min-width: 250px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 900; background: ${haloColor}; color: white; padding: 2px 7px; border-radius: 9999px; text-transform: uppercase;">
              ${spot.categoryLabel}
            </span>
            <span style="font-size: 10px; font-weight: 800; color: ${statusBg};">
              ● ${statusText} (${spot.healthScore}%)
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; line-height: 1.3;">
            ${spot.name}
          </h4>
          <div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px;">
            🏛️ ${spot.ward}, ${spot.city}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; font-size: 10.5px; margin-bottom: 6px;">
            <div><strong>${spot.telemetry.primaryMetric}:</strong> <span style="color: ${haloColor}; font-weight: 700;">${spot.telemetry.metricValue}</span></div>
            ${spot.telemetry.secondaryMetric ? `<div style="margin-top: 2px;"><strong>${spot.telemetry.secondaryMetric}:</strong> ${spot.telemetry.secondaryValue}</div>` : ''}
            <div style="margin-top: 2px; color: #64748b; font-size: 9.5px;">Monitoring: ${spot.telemetry.monitoringAgency}</div>
          </div>
          ${
            spot.alert
              ? `<div style="font-size: 10px; color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 4px 6px; margin-bottom: 6px; line-height: 1.3;">
                  ⚠️ ${spot.alert}
                </div>`
              : ''
          }
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 5px;">
            <span>Last inspected: ${spot.telemetry.lastServiced}</span>
            <a href="tel:${spot.telemetry.emergencyContact}" style="color: #0050c8; font-weight: 700; text-decoration: none;">
              📞 Dial ${spot.telemetry.emergencyContact}
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300, className: 'custom-infra-popup' });
      infrastructureGroupRef.current?.addLayer(marker);
    });
  }, [layerVisibility.infrastructure, liveLocation, center, overlayOpacity]);

  // ====================================================
  // 3. RENDER MUNICIPAL WARD BOUNDARY OVERLAYS
  // ====================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !wardBoundariesGroupRef.current) return;
    wardBoundariesGroupRef.current.clearLayers();

    if (!layerVisibility.wardBoundaries) return;

    const currentCenter = liveLocation || center;
    const wards = getActiveWardBoundaries(currentCenter.lat, currentCenter.lng);

    wards.forEach((ward) => {
      // Polygon Boundary with subtle dashed perimeter
      const polygon = L.polygon(ward.boundary, {
        color: ward.color,
        fillColor: ward.color,
        fillOpacity: 0.12 * (overlayOpacity / 0.85),
        weight: 2.5,
        dashArray: '6, 6',
      });

      // Centroid Label Badge
      const labelHtml = `
        <div style="position: relative; transform: translate(-50%, -50%); pointer-events: none;">
          <div style="background: white; color: #0f172a; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 1.5px solid ${ward.color}; display: flex; align-items: center; gap: 4px; white-space: nowrap; font-family: system-ui, -apple-system, sans-serif;">
            <span style="color: ${ward.color};">🏛️</span>
            <span>${ward.wardNumber}</span>
            <span style="color: #64748b; font-weight: 600;">| Pop: ${(ward.population / 1000).toFixed(0)}k</span>
          </div>
        </div>
      `;
      const labelIcon = L.divIcon({
        className: 'ward-centroid-label',
        html: labelHtml,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      const centroidMarker = L.marker([ward.centroid.lat, ward.centroid.lng], {
        icon: labelIcon,
        zIndexOffset: 150,
      });

      // Interactive Popup on Polygon or Centroid Click
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 6px; min-width: 250px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 900; background: ${ward.color}; color: white; padding: 2px 7px; border-radius: 9999px;">
              ${ward.wardNumber} OVERLAY
            </span>
            <span style="font-size: 10px; color: #16a34a; font-weight: 700;">
              ✓ ${ward.resolutionRate}% Resolved
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0;">
            ${ward.wardName}
          </h4>
          <div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px;">
            ${ward.corporation}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; font-size: 10px; margin-bottom: 6px;">
            <div><strong>Population:</strong> ${ward.population.toLocaleString()}</div>
            <div><strong>Area:</strong> ${ward.areaSqKm} sq km</div>
            <div><strong>Executive:</strong> ${ward.executiveOfficer.split('(')[0].trim()}</div>
            <div><strong>Grievances:</strong> <span style="color: #dc2626; font-weight: 700;">${ward.activeGrievances} Active</span></div>
          </div>
          <div style="font-size: 9.5px; color: #64748b; margin-bottom: 6px;">
            <strong>Landmarks:</strong> ${ward.keyLandmarks.slice(0, 3).join(', ')}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; border-top: 1px solid #f1f5f9; padding-top: 5px;">
            <a href="tel:${ward.officerContact}" style="color: #0050c8; font-weight: 700; text-decoration: none;">
              📞 Ward Engineer: ${ward.officerContact}
            </a>
          </div>
        </div>
      `;

      polygon.bindPopup(popupHtml, { maxWidth: 300, className: 'custom-ward-popup' });
      polygon.on('click', () => soundFX.playClick());

      wardBoundariesGroupRef.current?.addLayer(polygon);
      wardBoundariesGroupRef.current?.addLayer(centroidMarker);
    });
  }, [layerVisibility.wardBoundaries, liveLocation, center, overlayOpacity]);

  // Render Emergency Hotline Places (Police, Fire, BBMP, BESCOM, BWSSB, Traffic)
  useEffect(() => {
    if (!mapInstanceRef.current || !emergencyPlacesGroupRef.current) return;
    emergencyPlacesGroupRef.current.clearLayers();

    if (!showEmergencyPlaces) return;

    const filteredPlaces = EMERGENCY_HOTLINE_PLACES.filter((place) => {
      if (emergencyHotlineFilter === 'all') return true;
      return place.hotlineNumber === emergencyHotlineFilter;
    });

    filteredPlaces.forEach((place) => {
      const isSelected = highlightEmergencyPlace?.id === place.id;
      const marker = L.marker([place.location.lat, place.location.lng], {
        icon: createEmergencyIcon(place, isSelected),
        zIndexOffset: isSelected ? 800 : 350,
      });

      const popupHtml = getEmergencyPlacePopupHtml(place);
      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'custom-civic-popup',
      });

      marker.on('click', () => {
        soundFX.playAlert();
        if (onSelectEmergencyPlace) {
          onSelectEmergencyPlace(place);
        }
      });

      emergencyPlacesGroupRef.current?.addLayer(marker);

      if (isSelected && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([place.location.lat, place.location.lng], 15, {
          duration: 1.2,
        });
        setTimeout(() => {
          marker.openPopup();
        }, 500);
      }
    });
  }, [showEmergencyPlaces, emergencyHotlineFilter, highlightEmergencyPlace]);

  // If a specific emergency place is highlighted from external modal/link, auto-enable layer
  useEffect(() => {
    if (highlightEmergencyPlace) {
      setShowEmergencyPlaces(true);
      if (emergencyHotlineFilter !== 'all' && highlightEmergencyPlace.hotlineNumber !== emergencyHotlineFilter) {
        setEmergencyHotlineFilter('all');
      }
    }
  }, [highlightEmergencyPlace]);

  // Synchronize liveLocation state with userLocationProp if passed
  useEffect(() => {
    if (userLocationProp) {
      setLiveLocation(userLocationProp);
    }
  }, [userLocationProp?.lat, userLocationProp?.lng, userLocationProp?.accuracy]);

  // Render User Pointer Marker & Accuracy Circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (liveLocation && liveLocation.lat && liveLocation.lng) {
      const resolvedAddress = userAddress || (liveLocation as any).address || 'Current Live Location Spot';
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 6px #10B981;"></span>
              <span style="font-size: 11px; font-weight: 800; color: #0050c8; text-transform: uppercase; letter-spacing: 0.5px;">Live Location</span>
            </div>
            <span style="font-size: 9px; font-weight: 700; background: #eef4ff; color: #0050c8; padding: 2px 6px; border-radius: 9999px;">
              ${pointAtLocationOnly ? 'Pointed Only' : 'Active GPS'}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #121c28; margin-bottom: 3px;">
            ${userName || 'Active Citizen'}
          </div>
          <div style="font-size: 11px; color: #43474e; line-height: 1.4; margin-bottom: 8px;">
            ${resolvedAddress}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #737686; margin-bottom: 8px;">
            <span style="font-family: monospace; background: #f1f3f9; padding: 2px 5px; border-radius: 4px;">
              ${liveLocation.lat.toFixed(5)}°, ${liveLocation.lng.toFixed(5)}°
            </span>
            <span>±${liveLocation.accuracy || 15}m</span>
          </div>
          <button id="user-popup-report-btn" style="width: 100%; background: #1d68f2; color: white; border: none; padding: 7px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
            Report Issue At This Location
          </button>
        </div>
      `;

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([liveLocation.lat, liveLocation.lng]);
        userMarkerRef.current.setIcon(createUserIcon(userName, pointAtLocationOnly));
        userMarkerRef.current.setPopupContent(popupHtml);
      } else {
        const marker = L.marker([liveLocation.lat, liveLocation.lng], {
          icon: createUserIcon(userName, pointAtLocationOnly),
          zIndexOffset: 1000,
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(popupHtml, { maxWidth: 280 });
        marker.on('popupopen', () => {
          const btn = document.getElementById('user-popup-report-btn');
          if (btn && onQuickReportAtLocation) {
            btn.onclick = () => {
              soundFX.playClick();
              onQuickReportAtLocation(liveLocation.lat, liveLocation.lng, resolvedAddress);
              marker.closePopup();
            };
          }
        });

        userMarkerRef.current = marker;
      }

      // Draw or update accuracy circle if accuracy provided
      if (liveLocation.accuracy && liveLocation.accuracy > 0) {
        if (userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current.setLatLng([liveLocation.lat, liveLocation.lng]);
          userAccuracyCircleRef.current.setRadius(liveLocation.accuracy);
        } else {
          userAccuracyCircleRef.current = L.circle([liveLocation.lat, liveLocation.lng], {
            radius: liveLocation.accuracy,
            color: '#1d68f2',
            fillColor: '#1d68f2',
            fillOpacity: 0.15,
            weight: 1,
            dashArray: '2, 4',
          }).addTo(mapInstanceRef.current);
        }
      }
    }
  }, [liveLocation.lat, liveLocation.lng, liveLocation.accuracy, userName, pointAtLocationOnly, userAddress]);

  // Fly to User Location when flyToUserTrigger triggers or when user logs in/registers (pointAtLocationOnly)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const target = userLocationProp || (liveLocation.lat ? liveLocation : null);
    if (target && target.lat && target.lng && (flyToUserTrigger || pointAtLocationOnly)) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 16, {
        duration: 1.2,
      });
      const timer = setTimeout(() => {
        userMarkerRef.current?.openPopup();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [flyToUserTrigger, pointAtLocationOnly, userLocationProp?.lat, userLocationProp?.lng]);

  // Render / Update Draggable Picker Marker when interactivePicker is true
  useEffect(() => {
    if (!mapInstanceRef.current || !interactivePicker) {
      if (pickerMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(pickerMarkerRef.current);
        pickerMarkerRef.current = null;
      }
      return;
    }

    if (!pickerMarkerRef.current) {
      const pickerMarker = L.marker([center.lat, center.lng], {
        icon: createClickedPinIcon(),
        draggable: true,
        zIndexOffset: 1200,
      }).addTo(mapInstanceRef.current);

      pickerMarker.on('dragend', async (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        soundFX.playClick();
        handleMapClickCoordinate(position.lat, position.lng);
      });

      pickerMarkerRef.current = pickerMarker;
    } else {
      pickerMarkerRef.current.setLatLng([center.lat, center.lng]);
    }
  }, [interactivePicker, center.lat, center.lng]);

  // Auto-trigger GPS location if isLiveLocationActive is enabled or initial load
  const hasAutoLocatedRef = useRef(false);
  useEffect(() => {
    if (isLiveLocationActive && !isAcquiringGps && mapInstanceRef.current) {
      handleLocateMe();
    } else if (!hasAutoLocatedRef.current && !selectedIssue && !pointAtLocationOnly && mapInstanceRef.current) {
      hasAutoLocatedRef.current = true;
      handleLocateMe();
    }
  }, [isLiveLocationActive, selectedIssue, pointAtLocationOnly]);

  // Locate Current Live GPS Position with High Accuracy
  const handleLocateMe = async () => {
    soundFX.playClick();
    setIsAcquiringGps(true);
    setGpsStatusMessage('Acquiring live location fix...');

    try {
      const liveData = await getCurrentLivePosition();
      setLiveLocation({
        lat: liveData.lat,
        lng: liveData.lng,
        accuracy: liveData.accuracy,
      });

      if (onLiveLocationChange) {
        onLiveLocationChange(liveData);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([liveData.lat, liveData.lng], 16, {
          duration: 1.2,
        });
      }

      if (interactivePicker && onLocationPicked) {
        onLocationPicked(liveData.lat, liveData.lng, liveData.address || 'My Live Location');
      }

      const sourceLabel = liveData.source === 'device-satellite' ? 'Satellite GPS' : 'Network Assisted';
      setGpsStatusMessage(`Live location active: ±${liveData.accuracy}m (${sourceLabel})`);
      soundFX.playSuccess();
      setTimeout(() => setGpsStatusMessage(null), 4000);
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setGpsStatusMessage(err?.message || 'GPS fix calibrated.');
      // Fallback fly to existing known location if available
      if (mapInstanceRef.current && liveLocation) {
        mapInstanceRef.current.flyTo([liveLocation.lat, liveLocation.lng], 15, {
          duration: 1.0,
        });
      }
      setTimeout(() => setGpsStatusMessage(null), 4000);
    } finally {
      setIsAcquiringGps(false);
    }
  };

  const counts = {
    open: issues.filter((i) => i.status === 'open').length,
    investigating: issues.filter((i) => i.status === 'investigating').length,
    fixed: issues.filter((i) => i.status === 'fixed').length,
  };

  return (
    <div
      id="civic-map-view-container"
      className={`relative w-full border border-[#c2c6d7] dark:border-gray-800 shadow-md bg-white dark:bg-gray-950 flex flex-col transition-all ${
        isMapFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : `rounded-2xl overflow-hidden ${className}`
      }`}
    >
      {/* 1. TOP UNIFIED BAR: Dedicated header row, zero congestion, zero overlap */}
      <div
        id="map-unified-top-bar"
        className="w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#e2e8f0] dark:border-gray-800 px-3 py-2 z-20 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs"
      >
        {/* Left Controls: Easy Mode Toggle, Voice Summary, Pictorial Category Button, Clean Map */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Easy Mode Toggle (Large, Clear) */}
          <button
            id="map-easy-mode-toggle"
            type="button"
            onClick={() => {
              soundFX.playClick();
              const next = !easyMode;
              setEasyMode(next);
              if (next) {
                setShowCategoryBar(true);
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              easyMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Toggle Easy Mode with larger icons and audio guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>{easyMode ? '🌟 Easy Mode' : 'Standard View'}</span>
          </button>

          {/* Speak / Stop Map Summary Button */}
          <button
            id="map-speak-summary-btn"
            type="button"
            onClick={() => {
              soundFX.playClick();
              if (isAudioSummaryPlaying) {
                audibleNarrator.stop();
                return;
              }
              const waterCount = issues.filter((i) => getIssuePictorialInfo(i).categoryKey === 'water').length;
              const roadCount = issues.filter((i) => getIssuePictorialInfo(i).categoryKey === 'road').length;
              const garbageCount = issues.filter((i) => getIssuePictorialInfo(i).categoryKey === 'garbage').length;
              const lightCount = issues.filter((i) => getIssuePictorialInfo(i).categoryKey === 'light').length;

              const engText = `Map summary: Total ${issues.length} civic reports. ${counts.open} open issues needing attention, and ${counts.fixed} resolved. Water issues: ${waterCount}. Road potholes: ${roadCount}. Garbage waste: ${garbageCount}. Streetlights: ${lightCount}. Tap any marker on the map to hear its case details.`;

              audibleNarrator.speak(engText);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isAudioSummaryPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
            title={isAudioSummaryPlaying ? "Stop audio summary (Esc)" : "Listen to summary of civic issues"}
          >
            {isAudioSummaryPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Summary</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Audio Summary</span>
              </>
            )}
          </button>

          {/* Pictorial Category Filter Toggle */}
          <button
            id="map-category-filter-toggle-btn"
            type="button"
            onClick={() => {
              soundFX.playClick();
              setShowCategoryBar(!showCategoryBar);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showCategoryBar || pictorialCategory !== 'all'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0050c8] dark:text-blue-300 border-blue-300 dark:border-blue-700 font-black ring-1 ring-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200'
            }`}
            title="Filter by category"
          >
            <span>{currentCategoryObj.emoji}</span>
            <span className="font-bold">{currentCategoryObj.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showCategoryBar ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick De-congest Reset Button */}
          <button
            id="map-quick-decongest-btn"
            type="button"
            onClick={() => {
              soundFX.playClick();
              handleResetDefaultLayers();
              setPictorialCategory('all');
              setShowCategoryBar(false);
            }}
            className="px-2 py-1.5 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 transition-all flex items-center gap-1 cursor-pointer"
            title="Clear clutter and reset map overlays"
          >
            <span>🧹</span>
            <span className="hidden md:inline">Clean Map</span>
          </button>
        </div>

        {/* Center Indicator: Live Location Pointed Banner or Civic Summary */}
        <div className="flex items-center gap-1.5">
          {pointAtLocationOnly ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0050c8] text-white text-xs font-bold shadow-xs max-w-[260px] sm:max-w-xs truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="truncate text-[11px]">
                📍 {userAddress || (liveLocation as any).address || 'Live Location'}
              </span>
              {onTogglePointAtLocationOnly && (
                <button
                  onClick={() => {
                    soundFX.playClick();
                    onTogglePointAtLocationOnly(false);
                  }}
                  className="ml-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black px-2 py-0.5 rounded-full transition-colors cursor-pointer shrink-0"
                  title="Show all civic issues across city"
                >
                  Show All ({issues.length})
                </button>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>India Ward Radar • {issues.length} Issues</span>
            </div>
          )}
        </div>

        {/* Right Controls: Tile Style, Single Unified Layers Panel, Fullscreen Toggle */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {/* Tile Style Switcher */}
          <div className="relative" ref={styleMenuRef}>
            <button
              id="map-layers-toggle-btn"
              onClick={() => {
                soundFX.playClick();
                setShowLayerMenu(!showLayerMenu);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                showLayerMenu
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-[#0050c8] dark:text-blue-300 border-blue-400'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
              title="Map Style (Street, Satellite, Dark)"
            >
              <Compass className="w-3.5 h-3.5 text-[#0050c8] dark:text-blue-400" />
              <span className="hidden sm:inline">Style</span>
            </button>

            {showLayerMenu && (
              <div
                id="map-layers-selection-menu"
                className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-900 border border-[#c2c6d7] dark:border-gray-700 rounded-2xl shadow-2xl p-3 w-60 max-w-[calc(100vw-24px)] space-y-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between px-1 pb-1 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-extrabold text-[#737686] uppercase tracking-wider">
                    Map Tile Style
                  </p>
                  <span className="text-[9px] bg-[#EDF4FF] dark:bg-gray-800 text-[#0050c8] dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-full">
                    {tileUrls[currentLayer].name}
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {(Object.keys(tileUrls) as MapTileLayer[]).map((layerKey) => {
                    const style = tileUrls[layerKey];
                    const isSelected = currentLayer === layerKey;
                    return (
                      <button
                        key={layerKey}
                        onClick={() => handleSwitchLayer(layerKey)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex flex-col gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#EDF4FF] dark:bg-blue-950 text-[#0050c8] dark:text-blue-300 font-extrabold ring-1 ring-[#0050c8]/40 shadow-xs'
                            : 'text-[#121c28] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{style.name}</span>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-[#0050c8] animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] text-[#737686] font-normal">{style.tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Unified Map Layer Control Panel */}
          <MapLayerControlPanel
            className="relative z-30"
            visibility={layerVisibility}
            onToggleLayer={handleToggleOverlay}
            onSetAllLayers={handleSetAllLayers}
            onResetDefaults={handleResetDefaultLayers}
            trafficCount={getActiveTrafficSegments(liveLocation?.lat || center.lat, liveLocation?.lng || center.lng).length}
            infrastructureCount={getActiveInfrastructureHotspots(liveLocation?.lat || center.lat, liveLocation?.lng || center.lng).length}
            wardCount={getActiveWardBoundaries(liveLocation?.lat || center.lat, liveLocation?.lng || center.lng).length}
            emergencyCount={EMERGENCY_HOTLINE_PLACES.length}
            issuesCount={issues.length}
            activeHotlineFilter={emergencyHotlineFilter}
            onHotlineFilterChange={(filter) => setEmergencyHotlineFilter(filter)}
            overlayOpacity={overlayOpacity}
            onOpacityChange={(val) => setOverlayOpacity(val)}
            isDarkMode={isDarkMode}
            onFlyTo={(lat, lng, z) => mapInstanceRef.current?.flyTo([lat, lng], z, { duration: 1.2 })}
          />

          {/* Fullscreen Map Toggle Button */}
          <button
            id="map-fullscreen-toggle-btn"
            onClick={() => {
              soundFX.playClick();
              setIsMapFullscreen((prev) => !prev);
            }}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isMapFullscreen
                ? 'bg-[#0050c8] text-white border-[#0050c8]'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
            title={isMapFullscreen ? 'Exit Full Screen Map (Esc)' : 'Expand Map to Full Screen'}
          >
            {isMapFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. OPTIONAL COLLAPSIBLE PICTORIAL CATEGORY BAR */}
      {showCategoryBar && (
        <div className="w-full bg-gray-50/95 dark:bg-gray-850/95 border-b border-gray-200 dark:border-gray-800 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none z-15 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5">
            {pictorialCategoriesList.map((cat) => {
              const isSelected = pictorialCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setPictorialCategory(cat.id as any);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-black shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0050c8] text-white border-[#0050c8] scale-105 ring-2 ring-blue-300'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm leading-none">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowCategoryBar(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer shrink-0"
            title="Hide Category Bar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. MAP CANVAS CONTAINER - 100% UNCLUTTERED VISIBILITY */}
      <div className="w-full flex-1 relative z-0 min-h-0 overflow-hidden">
        {/* Real Leaflet Map */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Zoom & GPS Locate Controls in Bottom-Right */}
        <div
          id="map-floating-controls-panel"
          className="absolute bottom-6 right-3 z-20 flex flex-col gap-1 shadow-md rounded-xl overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-[#c2c6d7] dark:border-gray-700"
        >
          <button
            id="map-zoom-in-btn"
            onClick={() => {
              soundFX.playClick();
              mapInstanceRef.current?.zoomIn();
            }}
            className="p-2 hover:bg-[#EDF4FF] dark:hover:bg-gray-800 text-[#121c28] dark:text-gray-100 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-[1px] bg-[#c2c6d7]/60 dark:bg-gray-700" />
          <button
            id="map-zoom-out-btn"
            onClick={() => {
              soundFX.playClick();
              mapInstanceRef.current?.zoomOut();
            }}
            className="p-2 hover:bg-[#EDF4FF] dark:hover:bg-gray-800 text-[#121c28] dark:text-gray-100 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-[1px] bg-[#c2c6d7]/60 dark:bg-gray-700" />
          <button
            id="map-locate-me-btn"
            onClick={handleLocateMe}
            disabled={isAcquiringGps}
            className="p-2 hover:bg-[#EDF4FF] dark:hover:bg-gray-800 text-[#0050c8] dark:text-blue-400 transition-colors cursor-pointer"
            title="Find my current live GPS location"
          >
            {isAcquiringGps ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Collapsible Status Filter / Map Legend in Bottom-Left */}
        <div
          id="map-status-filter-dock"
          className="absolute bottom-6 left-3 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-xl border border-[#c2c6d7] dark:border-gray-700 shadow-lg flex flex-col gap-1.5 transition-all"
        >
          {isStatusDockMinimized ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setIsStatusDockMinimized(false);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
              title="Expand status filters"
            >
              <span>🚦</span>
              <span>{counts.open} Open</span>
              <span className="text-gray-400">•</span>
              <span>{counts.fixed} Fixed</span>
              <ChevronUp className="w-3 h-3 text-gray-500" />
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 gap-2">
                <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Issue Status
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      const textEn = `Status filter: ${counts.open} open problems needing fix, ${counts.investigating} currently in progress, and ${counts.fixed} resolved.`;
                      audibleNarrator.speak(textEn);
                    }}
                    className="text-amber-600 hover:text-amber-700 p-0.5 rounded cursor-pointer"
                    title="Listen to status summary"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setIsStatusDockMinimized(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded cursor-pointer"
                    title="Minimize status legend"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* RED: Pending Problem */}
              <button
                id="map-filter-open-btn"
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onStatusFilterChange &&
                    onStatusFilterChange(currentFilter === 'open' ? 'all' : 'open');
                }}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-left transition-all cursor-pointer ${
                  currentFilter === 'open'
                    ? 'bg-red-100 dark:bg-red-950/60 ring-2 ring-red-500 shadow-xs'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🔴</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Open Issues</span>
                </div>
                <span className="text-[11px] font-black text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 px-1.5 py-0.2 rounded-full">
                  {counts.open}
                </span>
              </button>

              {/* AMBER: In Progress */}
              <button
                id="map-filter-investigating-btn"
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onStatusFilterChange &&
                    onStatusFilterChange(
                      currentFilter === 'investigating' ? 'all' : 'investigating'
                    );
                }}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-left transition-all cursor-pointer ${
                  currentFilter === 'investigating'
                    ? 'bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-500 shadow-xs'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🟡</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">In Progress</span>
                </div>
                <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.2 rounded-full">
                  {counts.investigating}
                </span>
              </button>

              {/* GREEN: Resolved */}
              <button
                id="map-filter-fixed-btn"
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onStatusFilterChange &&
                    onStatusFilterChange(currentFilter === 'fixed' ? 'all' : 'fixed');
                }}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-left transition-all cursor-pointer ${
                  currentFilter === 'fixed'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-500 shadow-xs'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🟢</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Resolved</span>
                </div>
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.2 rounded-full">
                  {counts.fixed}
                </span>
              </button>
            </>
          )}
        </div>

      {/* Floating GPS Status Toast if acquiring or updated */}
      {gpsStatusMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-[#121c28]/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-150">
          {isAcquiringGps ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1d68f2]" />
          ) : (
            <LocateFixed className="w-4 h-4 text-emerald-400" />
          )}
          <span>{gpsStatusMessage}</span>
        </div>
      )}

      {/* Interactive Picker Notification / Control Dock if in picker mode */}
      {interactivePicker && (
        <div
          id="map-picker-status-overlay"
          className="absolute top-14 left-3 right-3 sm:right-auto sm:max-w-md z-20 bg-white/95 backdrop-blur-md border border-[#0050c8]/40 rounded-2xl shadow-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0050c8] text-white flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-[#121c28] block leading-tight">
                  Manual Location Picker Active
                </span>
                <span className="text-[10px] text-[#56596e]">
                  Tap map or drag the red pin to fine-tune exact spot
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isAcquiringGps}
              className="px-2.5 py-1.5 bg-[#EDF4FF] hover:bg-[#dfe9fa] text-[#0050c8] rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer border border-[#dae2ff]"
              title="Snap Pin to My Live GPS"
            >
              {isAcquiringGps ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>Live GPS</span>
            </button>
          </div>
          <div className="text-[10px] bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 flex items-center justify-between text-gray-600 font-mono">
            <span>Pin: {center.lat.toFixed(5)}°, {center.lng.toFixed(5)}°</span>
            <span className="text-[#0050c8] font-sans font-semibold flex items-center gap-1">
              <Move className="w-2.5 h-2.5" />
              Draggable Pin
            </span>
          </div>
        </div>
      )}

      {/* FLOATING ACTION DOCK: When user clicks anywhere on map */}
      {clickedLocation && !interactivePicker && (
        <div
          id="map-pinned-location-action-dock"
          className="absolute bottom-3 right-3 left-3 md:left-auto md:max-w-md z-20 bg-white/95 backdrop-blur-md border border-[#0050c8]/30 rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-[#121c28] leading-tight">
                    Pinned Map Location
                  </h4>
                  {clickedLocation.isGeocoding && (
                    <span className="text-[9px] bg-blue-100 text-[#0050c8] px-1.5 py-0.2 rounded-full animate-pulse">
                      Geocoding...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#424655] font-medium line-clamp-1 mt-0.5">
                  {clickedLocation.address}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearClickedPin}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Clear Pin"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Coordinates Tag & Quick Live GPS Switch */}
          <div className="flex items-center justify-between text-[10px] text-[#737686] bg-gray-50 px-2.5 py-1.5 rounded-lg gap-2">
            <span className="font-mono">GPS: {clickedLocation.lat.toFixed(5)}°, {clickedLocation.lng.toFixed(5)}°</span>
            <button
              type="button"
              onClick={handleLocateMe}
              className="text-[#0050c8] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LocateFixed className="w-3 h-3" />
              <span>Use Live GPS Instead</span>
            </button>
          </div>

          {/* Instant Report Success Message */}
          {instantReportSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{instantReportSuccess}</span>
            </div>
          )}

          {/* Primary Action Button: Open Report Wizard at this Location */}
          <div className="flex items-center gap-2">
            <button
              id="map-report-at-pin-btn"
              onClick={() => {
                soundFX.playClick();
                if (onQuickReportAtLocation) {
                  onQuickReportAtLocation(clickedLocation.lat, clickedLocation.lng, clickedLocation.address);
                }
              }}
              className="flex-1 py-2 px-3 bg-[#0050c8] hover:bg-[#003da8] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue at this Spot</span>
            </button>
            <button
              id="map-clear-pin-action-btn"
              onClick={handleClearClickedPin}
              className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Dismiss
            </button>
          </div>

          {/* 1-Click Rapid Pictorial Report */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Tap Rapid Report by Category:</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  audibleNarrator.speak(
                    'Tap any icon below to report: Pothole, water leak, garbage pile, streetlight outage, or drainage blockage.'
                  );
                }}
                className="text-amber-600 hover:text-amber-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                title="Listen to audio guide"
              >
                <Volume2 className="w-3 h-3" />
                <span>Audio Guide</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTriggerInstantReport('Roads')}
                className="p-2.5 bg-blue-50/90 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-950 dark:text-blue-200 border-2 border-blue-200 dark:border-blue-800 rounded-xl text-center transition-all flex flex-col items-center gap-1 cursor-pointer shadow-xs hover:scale-105"
                title="Road Pothole"
              >
                <span className="text-2xl leading-none">🕳️</span>
                <span className="text-xs font-black">Pothole</span>
                <span className="text-[9px] text-blue-700 dark:text-blue-300">Road Damage</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerInstantReport('Utilities')}
                className="p-2.5 bg-cyan-50/90 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-950 dark:text-cyan-200 border-2 border-cyan-200 dark:border-cyan-800 rounded-xl text-center transition-all flex flex-col items-center gap-1 cursor-pointer shadow-xs hover:scale-105"
                title="Water Leak"
              >
                <span className="text-2xl leading-none">🚰</span>
                <span className="text-xs font-black">Water Leak</span>
                <span className="text-[9px] text-cyan-700 dark:text-cyan-300">Pipeline issue</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerInstantReport('Sanitation')}
                className="p-2.5 bg-emerald-50/90 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl text-center transition-all flex flex-col items-center gap-1 cursor-pointer shadow-xs hover:scale-105"
                title="Garbage Pile"
              >
                <span className="text-2xl leading-none">🗑️</span>
                <span className="text-xs font-black">Garbage</span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-300">Waste dump</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerInstantReport('Utilities')}
                className="p-2.5 bg-amber-50/90 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-950 dark:text-amber-200 border-2 border-amber-200 dark:border-amber-800 rounded-xl text-center transition-all flex flex-col items-center gap-1 cursor-pointer shadow-xs hover:scale-105"
                title="Streetlight Off"
              >
                <span className="text-2xl leading-none">💡</span>
                <span className="text-xs font-black">Streetlight</span>
                <span className="text-[9px] text-amber-700 dark:text-amber-300">Outage / Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerInstantReport('Sanitation')}
                className="p-2.5 bg-teal-50/90 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-950 dark:text-teal-200 border-2 border-teal-200 dark:border-teal-800 rounded-xl text-center transition-all flex flex-col items-center gap-1 cursor-pointer shadow-xs hover:scale-105"
                title="Drain Blockage"
              >
                <span className="text-2xl leading-none">🚽</span>
                <span className="text-xs font-black">Drainage</span>
                <span className="text-[9px] text-teal-700 dark:text-teal-300">Sewage clog</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerInstantReport('Safety')}
                className="p-2.5 bg-red-50/90 dark:bg-red-950/60 hover:bg-red-100 text-red-950 dark:text-red-200 border-2 border-red-200 dark:border-red-800 rounded-xl text-center transition-all flex flex-col items-center gap-1 cursor-pointer shadow-xs hover:scale-105"
                title="Safety Danger"
              >
                <span className="text-2xl leading-none">⚠️</span>
                <span className="text-xs font-black">Danger</span>
                <span className="text-[9px] text-red-700 dark:text-red-300">Safety risk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Street 360 View Interactive Modal Simulation */}
      {streetViewIssue && (
        <div
          id="street-view-modal-backdrop"
          className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 p-4 flex flex-col justify-between animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#1d68f2]" />
              <div>
                <h4 className="font-bold text-sm leading-none">
                  {streetViewIssue.title}
                </h4>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  {streetViewIssue.address}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                soundFX.playClick();
                setStreetViewIssue(null);
              }}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Panoramic street simulation window */}
          <div className="relative flex-1 my-3 rounded-xl overflow-hidden border border-white/20 shadow-inner group">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-300"
              style={{
                backgroundImage: `url(${streetViewIssue.imageUrl})`,
                transform: `scale(1.2) rotate(${streetAngle}deg)`,
              }}
            />
            {/* Street View HUD overlay */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-lg font-mono flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Simulated 360° Cam ({streetViewIssue.location.lat.toFixed(4)},{' '}
                {streetViewIssue.location.lng.toFixed(4)})
              </span>
            </div>

            {/* Rotation Controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl">
              <button
                onClick={() => setStreetAngle((a) => a - 15)}
                className="px-2 py-1 text-xs font-bold text-white bg-white/20 rounded hover:bg-white/30"
              >
                ◀ Pan Left
              </button>
              <button
                onClick={() => setStreetAngle(0)}
                className="px-2 py-1 text-xs font-bold text-white bg-white/20 rounded hover:bg-white/30"
              >
                Reset
              </button>
              <button
                onClick={() => setStreetAngle((a) => a + 15)}
                className="px-2 py-1 text-xs font-bold text-white bg-white/20 rounded hover:bg-white/30"
              >
                Pan Right ▶
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>High-Definition Ground Inspection</span>
            <button
              onClick={() => {
                const issue = streetViewIssue;
                setStreetViewIssue(null);
                onSelectIssue(issue);
              }}
              className="px-3 py-1.5 bg-[#1d68f2] hover:bg-[#0050c8] text-white font-bold rounded-lg transition-colors"
            >
              Open Full Case File
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
