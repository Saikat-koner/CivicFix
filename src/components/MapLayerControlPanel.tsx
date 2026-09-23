import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers,
  Car,
  Zap,
  Building,
  Flame,
  ShieldAlert,
  Radio,
  MapPin,
  X,
  RotateCcw,
  CheckCheck,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { MapOverlayVisibilityState } from '../types';
import { soundFX } from '../utils/audioFeedback';

interface MapLayerControlPanelProps {
  visibility: MapOverlayVisibilityState;
  onToggleLayer: (key: keyof MapOverlayVisibilityState) => void;
  onSetAllLayers: (enable: boolean) => void;
  onResetDefaults: () => void;
  trafficCount?: number;
  infrastructureCount?: number;
  wardCount?: number;
  emergencyCount?: number;
  issuesCount?: number;
  activeHotlineFilter?: string;
  onHotlineFilterChange?: (filter: 'all' | '112' | '1533' | '1916' | '1912' | '1033' | '103') => void;
  overlayOpacity?: number;
  onOpacityChange?: (opacity: number) => void;
  isDarkMode?: boolean;
  className?: string;
  buttonClassName?: string;
  onFlyTo?: (lat: number, lng: number, zoom: number) => void;
}

export const MapLayerControlPanel: React.FC<MapLayerControlPanelProps> = ({
  visibility,
  onToggleLayer,
  onSetAllLayers,
  onResetDefaults,
  trafficCount = 0,
  infrastructureCount = 0,
  wardCount = 0,
  emergencyCount = 0,
  issuesCount = 0,
  activeHotlineFilter = 'all',
  onHotlineFilterChange,
  overlayOpacity = 0.85,
  onOpacityChange,
  isDarkMode = false,
  className,
  buttonClassName,
  onFlyTo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const activeLayersCount = Object.values(visibility).filter(Boolean).length;
  const totalLayersCount = Object.keys(visibility).length;

  const handleToggle = (key: keyof MapOverlayVisibilityState) => {
    soundFX.playClick();
    onToggleLayer(key);
  };

  const updatePanelPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const container = buttonRef.current.closest('#civic-map-view-container') || document.body;
    const containerRect = container.getBoundingClientRect();

    const containerWidth = containerRect.width;
    // Calculate width: comfortable up to 368px on normal/wide screens, or bounded to container on mobile
    const targetWidth = Math.min(368, Math.max(280, containerWidth - 20));

    // Distance from button's edges to container edges
    const spaceToLeft = buttonRect.right - containerRect.left;
    const spaceToRight = containerRect.right - buttonRect.left;
    const offsetFromContainerLeft = buttonRect.left - containerRect.left;

    const newStyle: React.CSSProperties = {
      width: `${targetWidth}px`,
      maxWidth: 'calc(100vw - 20px)',
    };

    // Calculate maximum available height to prevent overflowing off bottom
    const spaceBelow = Math.max(260, containerRect.bottom - buttonRect.bottom - 16);
    const viewportSpaceBelow = Math.max(260, window.innerHeight - buttonRect.bottom - 16);
    newStyle.maxHeight = `${Math.min(520, spaceBelow, viewportSpaceBelow)}px`;

    // Horizontal placement:
    // If container is very narrow (e.g. mobile screen < 420px), center inside container:
    if (containerWidth <= targetWidth + 24) {
      newStyle.left = `${-(offsetFromContainerLeft) + 10}px`;
      newStyle.right = 'auto';
    } else if (spaceToLeft < targetWidth + 10 && spaceToRight >= targetWidth) {
      // Button is near the left edge of container - align left so panel extends to the right
      newStyle.left = '0px';
      newStyle.right = 'auto';
    } else if (spaceToRight < targetWidth + 10 && spaceToLeft >= targetWidth) {
      // Button is near the right edge of container - align right so panel extends to the left
      newStyle.right = '0px';
      newStyle.left = 'auto';
    } else {
      // Fallback: check which side has more room
      if (spaceToRight >= spaceToLeft) {
        newStyle.left = '0px';
        newStyle.right = 'auto';
      } else {
        newStyle.right = '0px';
        newStyle.left = 'auto';
      }
    }

    setPanelStyle(newStyle);
  }, []);

  useEffect(() => {
    if (isExpanded) {
      updatePanelPosition();
      const handleResize = () => updatePanelPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);

      // Click outside listener
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          panelRef.current &&
          !panelRef.current.contains(target) &&
          buttonRef.current &&
          !buttonRef.current.contains(target)
        ) {
          setIsExpanded(false);
        }
      };

      // Escape key listener
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsExpanded(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isExpanded, updatePanelPosition]);

  return (
    <div className={className || "relative z-30 flex flex-col items-start"}>
      {/* Floating Toggle Button */}
      <button
        ref={buttonRef}
        id="map-floating-layer-control-panel-btn"
        type="button"
        onClick={() => {
          soundFX.playClick();
          setIsExpanded(!isExpanded);
        }}
        className={buttonClassName || `pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-sm backdrop-blur-md border transition-all duration-200 cursor-pointer whitespace-nowrap ${
          isExpanded
            ? 'bg-[#0050c8] text-white border-[#0050c8] shadow-[#0050c8]/25 ring-2 ring-[#0050c8]/30'
            : isDarkMode
            ? 'bg-[#1e293b]/95 text-gray-200 border-gray-700 hover:bg-[#334155]'
            : 'bg-white/95 text-[#121c28] border-[#c2c6d7] hover:bg-[#EDF4FF]'
        }`}
        title="Toggle Map Layers Control Panel"
      >
        <div className="relative shrink-0">
          <Layers className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          {activeLayersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
          )}
        </div>
        <span className="text-xs font-bold tracking-tight">Layers</span>
        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${
            isExpanded
              ? 'bg-white/20 text-white'
              : 'bg-[#EDF4FF] dark:bg-gray-850 text-[#0050c8] dark:text-blue-300'
          }`}
        >
          {activeLayersCount}/{totalLayersCount}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 opacity-80 shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-80 shrink-0" />
        )}
      </button>

      {/* Floating Control Panel Modal / Card */}
      {isExpanded && (
        <div
          ref={panelRef}
          id="map-floating-layer-control-panel"
          style={panelStyle}
          className={`pointer-events-auto absolute top-full mt-2 overflow-y-auto rounded-3xl shadow-2xl backdrop-blur-xl border p-4 space-y-3.5 transition-all duration-200 z-50 animate-in fade-in zoom-in-95 ${
            isDarkMode
              ? 'bg-[#0f172a]/95 text-gray-100 border-slate-700 shadow-black/60'
              : 'bg-white/95 text-[#121c28] border-[#c2c6d7] shadow-blue-900/10'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-gray-700/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0050c8]/10 text-[#0050c8] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight text-[#121c28] dark:text-white uppercase">
                  Map Layers & Overlays
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {activeLayersCount} of {totalLayersCount} active on canvas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setShowOpacitySlider(!showOpacitySlider);
                }}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  showOpacitySlider
                    ? 'bg-[#0050c8] text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Adjust Overlay Opacity"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Close Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                soundFX.playSuccess();
                onSetAllLayers(true);
              }}
              className="flex-1 py-1 px-2 rounded-xl bg-gray-100 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#0050c8] dark:text-blue-400 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3 h-3" />
              <span>All On</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onSetAllLayers(false);
              }}
              className="flex-1 py-1 px-2 rounded-xl bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onResetDefaults();
              }}
              className="flex-1 py-1 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Overlay Opacity Slider Drawer */}
          {showOpacitySlider && onOpacityChange && (
            <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 dark:text-gray-300">
                <span>Overlay Intensity</span>
                <span className="text-[#0050c8] dark:text-blue-400 font-mono">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-full accent-[#0050c8] cursor-pointer"
              />
            </div>
          )}

          {/* LAYER 1: TRAFFIC DATA */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              visibility.traffic
                ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-xs'
                : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    visibility.traffic
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#121c28] dark:text-white">
                      Traffic & Mobility
                    </span>
                    {visibility.traffic && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {trafficCount} corridors • Live speeds & delays
                  </p>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <button
                id="layer-toggle-traffic"
                type="button"
                onClick={() => handleToggle('traffic')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  visibility.traffic ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    visibility.traffic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {visibility.traffic && (
              <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Smooth (&gt;40km/h)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Moderate (20-40)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    Congested (&lt;20)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* LAYER 2: INFRASTRUCTURE HOTSPOTS */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              visibility.infrastructure
                ? 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-xs'
                : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    visibility.infrastructure
                      ? 'bg-[#0050c8] text-white shadow-md shadow-blue-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#121c28] dark:text-white">
                      Infrastructure Hotspots
                    </span>
                    {visibility.infrastructure && (
                      <span className="text-[9px] font-extrabold bg-blue-100 text-[#0050c8] px-1.5 py-0.2 rounded-full">
                        IoT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {infrastructureCount} nodes • Substations, pumps, sluices
                  </p>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <button
                id="layer-toggle-infrastructure"
                type="button"
                onClick={() => handleToggle('infrastructure')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  visibility.infrastructure ? 'bg-[#0050c8]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    visibility.infrastructure ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {visibility.infrastructure && (
              <div className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex flex-wrap gap-1 text-[9px] font-bold">
                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  ⚡ Substations
                </span>
                <span className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  💧 Water Pumps
                </span>
                <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  🌊 Storm Sluices
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  🚆 Transit Hubs
                </span>
              </div>
            )}
          </div>

          {/* LAYER 3: WARD BOUNDARIES */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              visibility.wardBoundaries
                ? 'bg-purple-50/80 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 shadow-xs'
                : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    visibility.wardBoundaries
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#121c28] dark:text-white">
                      Ward Boundary Overlays
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {wardCount} boundaries • Municipal zones & stats
                  </p>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <button
                id="layer-toggle-ward-boundaries"
                type="button"
                onClick={() => handleToggle('wardBoundaries')}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  visibility.wardBoundaries ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    visibility.wardBoundaries ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {visibility.wardBoundaries && (
              <div className="mt-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/60 text-[9.5px] text-purple-900 dark:text-purple-300 flex items-center gap-1.5 font-medium">
                <Info className="w-3 h-3 text-purple-600 shrink-0" />
                <span>Click any ward polygon to see corporator & resolution rate</span>
              </div>
            )}
          </div>

          {/* SECONDARY TOGGLES (Heatmap, Emergency Stations, Radar, Issue Pins) */}
          <div className="space-y-1.5 pt-1 border-t border-gray-200/80 dark:border-gray-700/80">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
              Safety & Citizen Telemetry
            </p>

            {/* 4. Hazard Density */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-2">
                <Flame
                  className={`w-3.5 h-3.5 ${
                    visibility.hazardHeatmap ? 'text-red-500' : 'text-gray-400'
                  }`}
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Hazard Density Heatmap
                </span>
              </div>
              <input
                type="checkbox"
                id="layer-checkbox-hazard"
                checked={visibility.hazardHeatmap}
                onChange={() => handleToggle('hazardHeatmap')}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </div>

            {/* 5. Emergency Command Stations */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    className={`w-3.5 h-3.5 ${
                      visibility.emergencyStations ? 'text-red-600' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Emergency Stations ({emergencyCount})
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="layer-checkbox-emergency"
                  checked={visibility.emergencyStations}
                  onChange={() => handleToggle('emergencyStations')}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                />
              </div>

              {visibility.emergencyStations && onHotlineFilterChange && (
                <div className="flex items-center gap-1 px-2 pt-0.5 pb-1 flex-wrap">
                  {(['all', '112', '1533', '1916', '1912'] as const).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onHotlineFilterChange(num)}
                      className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                        activeHotlineFilter === num
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50'
                      }`}
                    >
                      {num === 'all' ? 'All' : num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Proximity Radar (800m) */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-3.5 h-3.5 ${
                    visibility.proximityRadar ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  800m Proximity Radar Circle
                </span>
              </div>
              <input
                type="checkbox"
                id="layer-checkbox-radar"
                checked={visibility.proximityRadar}
                onChange={() => handleToggle('proximityRadar')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
            </div>

            {/* 7. Citizen Reported Issue Pins */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-2">
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    visibility.civicIssues ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Citizen Issue Pins ({issuesCount})
                </span>
              </div>
              <input
                type="checkbox"
                id="layer-checkbox-issues"
                checked={visibility.civicIssues}
                onChange={() => handleToggle('civicIssues')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick City Jump Section */}
          {onFlyTo && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block">
                Jump to Region / City:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {[
                  { name: 'India', lat: 20.5937, lng: 78.9629, zoom: 5, icon: '🇮🇳' },
                  { name: 'Delhi', lat: 28.6139, lng: 77.2090, zoom: 12, icon: '🏛️' },
                  { name: 'Mumbai', lat: 18.9750, lng: 72.8258, zoom: 12, icon: '🌊' },
                  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, zoom: 12, icon: '🌿' },
                  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, zoom: 12, icon: '🎨' },
                  { name: 'Chennai', lat: 13.0827, lng: 80.2707, zoom: 12, icon: '🏖️' },
                  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, zoom: 12, icon: '💎' },
                  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, zoom: 12, icon: '🦁' },
                  { name: 'Pune', lat: 18.5204, lng: 73.8567, zoom: 12, icon: '⛰️' },
                  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, zoom: 12, icon: '🏰' },
                  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, zoom: 12, icon: '🕌' },
                ].map((reg) => (
                  <button
                    key={reg.name}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onFlyTo(reg.lat, reg.lng, reg.zoom);
                      setIsExpanded(false);
                    }}
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/40 text-gray-800 dark:text-gray-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{reg.icon}</span>
                    <span>{reg.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
