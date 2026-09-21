import React, { useState, useEffect } from 'react';
import { Cookie, Check, X, Shield, Settings2 } from 'lucide-react';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    gpsCaching: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem('civicfix_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      'civicfix_cookie_consent',
      JSON.stringify({ essential: true, analytics: true, gpsCaching: true, timestamp: new Date().toISOString() })
    );
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(
      'civicfix_cookie_consent',
      JSON.stringify({ essential: true, analytics: false, gpsCaching: false, timestamp: new Date().toISOString() })
    );
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(
      'civicfix_cookie_consent',
      JSON.stringify({ ...preferences, timestamp: new Date().toISOString() })
    );
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      id="cookie-consent-banner"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 bg-white dark:bg-[#1e2330] rounded-2xl shadow-2xl border border-blue-100 dark:border-gray-800 p-4 text-[#121c28] dark:text-gray-100 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#0050c8] dark:text-blue-400 flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs md:text-sm font-bold">Civic Data & Privacy Preferences</h4>
            <button
              onClick={handleEssentialOnly}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-[#424655] dark:text-gray-400 mt-1 leading-relaxed">
            CivicFix uses essential local storage to cache GPS defect coordinates and offline drafts. No third-party ad trackers.
          </p>

          {showPreferences && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-not-allowed opacity-80">
                <span className="text-[11px] font-medium">Essential Municipal Cache</span>
                <input type="checkbox" checked disabled className="accent-blue-600" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] font-medium">Telemetry & Ward Analytics</span>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="accent-blue-600 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] font-medium">GPS Tile Offline Caching</span>
                <input
                  type="checkbox"
                  checked={preferences.gpsCaching}
                  onChange={(e) => setPreferences({ ...preferences, gpsCaching: e.target.checked })}
                  className="accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
            {showPreferences ? (
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-3 py-1.5 bg-[#0050c8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Save Preferences
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3 py-1.5 bg-[#0050c8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="px-2 py-1.5 text-gray-500 hover:text-blue-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-[11px] text-[#0050c8] hover:underline ml-auto cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
