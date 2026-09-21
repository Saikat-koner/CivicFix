import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Lock,
  Compass,
  FileSpreadsheet,
  Building2,
  Trophy,
  ShieldCheck,
  Radio,
  ExternalLink
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';

export interface ScreenJumpAction {
  phase: number;
  screenNumber: number;
  title: string;
  badge: string;
  target:
    | 'screen-1-desktop-gateway'
    | 'screen-2-mobile-gateway'
    | 'screen-3-login-register'
    | 'screen-4-verify-otp'
    | 'screen-5-security-pin'
    | 'screen-6-desktop-dashboard'
    | 'screen-7-mobile-dashboard'
    | 'screen-8-desktop-profile'
    | 'screen-9-mobile-profile'
    | 'screen-10-report-step1'
    | 'screen-11-report-step2'
    | 'screen-12-report-step3'
    | 'screen-13-report-desktop'
    | 'screen-14-issue-details'
    | 'screen-15-leaderboard'
    | 'screen-16-admin-command';
}

export const ALL_16_SCREENS: ScreenJumpAction[] = [
  // Phase 1
  { phase: 1, screenNumber: 1, title: 'Welcome & Role Gateway (Desktop)', badge: 'Desktop', target: 'screen-1-desktop-gateway' },
  { phase: 1, screenNumber: 2, title: 'Citizen / Admin Gateway (Mobile)', badge: 'Mobile', target: 'screen-2-mobile-gateway' },
  { phase: 1, screenNumber: 3, title: 'Unified Auth & Registration', badge: 'Auth', target: 'screen-3-login-register' },
  { phase: 1, screenNumber: 4, title: 'Identity & SMS/OTP Verification', badge: 'MFA', target: 'screen-4-verify-otp' },
  { phase: 1, screenNumber: 5, title: 'Security PIN Vault', badge: 'Vault', target: 'screen-5-security-pin' },
  // Phase 2
  { phase: 2, screenNumber: 6, title: 'Citizen Master City Overview (Desktop)', badge: 'Desktop', target: 'screen-6-desktop-dashboard' },
  { phase: 2, screenNumber: 7, title: 'Citizen Core Dashboard (Mobile)', badge: 'Mobile', target: 'screen-7-mobile-dashboard' },
  { phase: 2, screenNumber: 8, title: 'Community Impact Profile & Awards', badge: 'Desktop', target: 'screen-8-desktop-profile' },
  { phase: 2, screenNumber: 9, title: 'Citizen Badges & Civic Credits', badge: 'Mobile', target: 'screen-9-mobile-profile' },
  // Phase 3
  { phase: 3, screenNumber: 10, title: 'Step 1: Capture & Computer Vision Triage', badge: 'AI Vision', target: 'screen-10-report-step1' },
  { phase: 3, screenNumber: 11, title: 'Step 2: Geolocation & Duplicate Detection', badge: 'Proximity', target: 'screen-11-report-step2' },
  { phase: 3, screenNumber: 12, title: 'Step 3: Details, Severity & Voice Dictation', badge: 'Voice', target: 'screen-12-report-step3' },
  { phase: 3, screenNumber: 13, title: 'Full Desktop Reporting Suite', badge: 'Desktop', target: 'screen-13-report-desktop' },
  // Phase 4
  { phase: 4, screenNumber: 14, title: 'Issue Lifecycle & Resolution Timeline', badge: 'Timeline', target: 'screen-14-issue-details' },
  { phase: 4, screenNumber: 15, title: 'Civic Leaderboard & Governor’s Award', badge: 'Awards', target: 'screen-15-leaderboard' },
  // Phase 5
  { phase: 5, screenNumber: 16, title: 'Municipal Command Center (Desktop/Mobile)', badge: 'Admin SLA', target: 'screen-16-admin-command' },
];

interface PhaseShowcaseBarProps {
  onNavigateScreen: (action: ScreenJumpAction) => void;
  activeScreenNumber?: number;
}

export const PhaseShowcaseBar: React.FC<PhaseShowcaseBarProps> = ({
  onNavigateScreen,
  activeScreenNumber = 6,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number | 'all'>('all');

  const filteredScreens = ALL_16_SCREENS.filter((s) => {
    if (selectedPhaseFilter === 'all') return true;
    return s.phase === selectedPhaseFilter;
  });

  return (
    <aside
      id="phase-showcase-roadmap-bar"
      aria-label="Phase Showcase Roadmap Bar"
      className="bg-[#0b1320] text-white border-b border-white/10 z-30 sticky top-0 shadow-lg text-xs"
    >
      {/* Header Strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1d68f2] text-white font-extrabold text-[11px]">
            <Layers className="w-3.5 h-3.5" />
            <span>16-Screen Blueprint Navigator</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-white/70">
            <span>Current View:</span>
            <span className="font-bold text-amber-300">
              Screen {activeScreenNumber}: {ALL_16_SCREENS.find((s) => s.screenNumber === activeScreenNumber)?.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase Quick Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              onClick={() => setSelectedPhaseFilter('all')}
              className={`px-2 py-0.5 rounded ${
                selectedPhaseFilter === 'all' ? 'bg-[#1d68f2] text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              All (16)
            </button>
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPhaseFilter(p)}
                className={`px-2 py-0.5 rounded ${
                  selectedPhaseFilter === p ? 'bg-[#1d68f2] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsOpen(!isOpen);
            }}
            className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{isOpen ? 'Close Blueprint Drawer' : 'Browse All 16 Screens'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded 16-Screen Grid */}
      {isOpen && (
        <div className="border-t border-white/10 bg-[#080e18] p-4 sm:p-6 max-h-[70vh] overflow-y-auto animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <p className="text-white/80">
                Click any screen to immediately activate its exact desktop or mobile workflow on canvas:
              </p>
              <div className="flex items-center gap-3 text-[11px] text-white/60">
                <span className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" /> Desktop View
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Mobile Frame
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredScreens.map((screen) => {
                const isActive = activeScreenNumber === screen.screenNumber;
                return (
                  <button
                    key={screen.screenNumber}
                    onClick={() => {
                      soundFX.playClick();
                      onNavigateScreen(screen);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer ${
                      isActive
                        ? 'bg-[#1d68f2] border-white text-white shadow-lg ring-2 ring-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/20 text-white/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        Phase {screen.phase} • Screen {screen.screenNumber}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          screen.badge === 'Desktop'
                            ? 'bg-blue-900/60 text-blue-300'
                            : screen.badge === 'Mobile'
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : 'bg-amber-900/60 text-amber-300'
                        }`}
                      >
                        {screen.badge}
                      </span>
                    </div>

                    <div className="font-bold text-xs leading-snug line-clamp-2">
                      {screen.title}
                    </div>

                    <div
                      className={`text-[10px] font-semibold flex items-center justify-between pt-1 border-t ${
                        isActive ? 'border-white/20 text-white/90' : 'border-white/10 text-white/60'
                      }`}
                    >
                      <span>Jump to Screen</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
