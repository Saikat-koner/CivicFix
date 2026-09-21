import React, { useState } from 'react';
import { AreaCivicAlert, AREA_CIVIC_ALERTS } from '../data/areaAlertsData';
import {
  X,
  AlertTriangle,
  Hammer,
  Scale,
  Clock,
  MapPin,
  Building2,
  PhoneCall,
  Calendar,
  Filter,
  CheckCircle2,
  Compass,
  Bell,
  Share2,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';

interface AreaAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCity?: string;
  onLocateOnMap?: (lat: number, lng: number) => void;
}

export const AreaAlertsModal: React.FC<AreaAlertsModalProps> = ({
  isOpen,
  onClose,
  userCity = 'Bengaluru',
  onLocateOnMap,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'public_work' | 'dispute' | 'utility_disruption'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [subscribed, setSubscribed] = useState<boolean>(false);

  if (!isOpen) return null;

  const cities = ['All Cities', 'Bengaluru', 'New Delhi'];

  const filteredAlerts = AREA_CIVIC_ALERTS.filter((alert) => {
    const matchesTab = activeTab === 'all' || alert.category === activeTab;
    const matchesCity = selectedCity === 'All Cities' || alert.city === selectedCity;
    return matchesTab && matchesCity;
  });

  const handleToggleSubscribe = () => {
    soundFX.playClick();
    setSubscribed(!subscribed);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>High Impact</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Moderate Delay</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Advisory</span>
          </span>
        );
    }
  };

  return (
    <div
      id="area-alerts-modal-overlay"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="area-alerts-modal-container"
        className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-auto text-gray-900 dark:text-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner shrink-0">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">Area Civic Alerts & Disputes</h3>
                <span className="text-[10px] font-black px-2 py-0.5 bg-white/25 rounded-full uppercase tracking-wider">
                  Live Public Notices
                </span>
              </div>
              <p className="text-xs text-white/90 font-medium">
                Official notices on active road excavations, infrastructure works, and civic property/zoning disputes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & City Selector Controls */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              All Alerts ({AREA_CIVIC_ALERTS.length})
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('public_work');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'public_work'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <Hammer className="w-3.5 h-3.5 text-orange-500" />
              <span>Ongoing Works</span>
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('dispute');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'dispute'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-purple-500" />
              <span>Active Disputes</span>
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('utility_disruption');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'utility_disruption'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
              <span>Utilities</span>
            </button>
          </div>

          {/* City Selector & SMS Alert Subscription */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => {
                soundFX.playClick();
                setSelectedCity(e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={handleToggleSubscribe}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                subscribed
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100'
              }`}
              title="Get SMS / WhatsApp alerts when new disputes or works happen in your area"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{subscribed ? 'Alerts Active' : 'Subscribe Alerts'}</span>
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-gray-700 dark:text-gray-300">
                No active disputes or disruptions reported in this area.
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Civic routes are clear. Municipal maintenance teams will update this board when works commence.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber-200/80 dark:border-gray-700 p-4 sm:p-5 shadow-sm hover:border-amber-400 transition-all space-y-3 relative overflow-hidden"
              >
                {/* Accent corner line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    alert.category === 'dispute'
                      ? 'bg-purple-600'
                      : alert.severity === 'high'
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                  }`}
                />

                {/* Top Row: Title, Category, Severity */}
                <div className="flex flex-wrap items-start justify-between gap-2 pt-0.5">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-[10px] font-mono font-bold">
                        {alert.id}
                      </span>
                      {getSeverityBadge(alert.severity)}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          alert.category === 'dispute'
                            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300'
                            : 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300'
                        }`}
                      >
                        {alert.category === 'dispute' ? '⚖️ Active Dispute / Notice' : '🚧 Public Infrastructure Work'}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 leading-snug">
                      {alert.title}
                    </h4>

                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {alert.area}, {alert.city}
                      </span>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div className="text-right bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 shrink-0">
                    <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">Target ETA</div>
                    <div className="text-sm font-black text-amber-950 dark:text-amber-200 flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{alert.daysRemaining} days left</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {alert.description}
                </p>

                {/* Dispute / Legal details if applicable */}
                {alert.disputeDetails && (
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-purple-600" />
                      <span>Court Stay / Adjudication Notice:</span>
                    </div>
                    <p className="text-purple-800 dark:text-purple-300/90 text-[11px] leading-relaxed">
                      {alert.disputeDetails}
                    </p>
                  </div>
                )}

                {/* Alternate Route / Advice */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs space-y-1">
                  <div className="font-extrabold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>Citizen Advisory & Alternate Routes:</span>
                  </div>
                  <p className="text-blue-900 dark:text-blue-200 text-[11.5px] leading-relaxed">
                    {alert.alternateRouteOrAdvice}
                  </p>
                </div>

                {/* Footer details: Executing Agency, Helpline, Locate */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Executing Authority</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-500" />
                      <span>{alert.executingAgency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${alert.contactHelpline.split(' ')[0]}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{alert.contactHelpline}</span>
                    </a>

                    {onLocateOnMap && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          onLocateOnMap(alert.location.lat, alert.location.lng);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-[#0050c8] hover:bg-[#003da0] text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Locate on Map</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Notices updated every 4 hours from Municipal GIS & Traffic Police</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
