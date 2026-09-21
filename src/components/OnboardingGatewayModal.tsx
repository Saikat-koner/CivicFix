import React, { useState } from 'react';
import { UserRole } from '../types';
import {
  X,
  UserCheck,
  Building2,
  Sparkles,
  Award,
  Clock,
  ShieldCheck,
  TrendingUp,
  Volume2,
  VolumeX,
  Globe,
  ArrowRight,
  Smartphone,
  Monitor,
  CheckCircle2,
  Zap,
  MapPin
} from 'lucide-react';
import { audibleNarrator, SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/audibleNarrator';
import { soundFX } from '../utils/audioFeedback';

interface OnboardingGatewayModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectRole: (role: UserRole) => void;
  defaultViewport?: 'desktop' | 'mobile';
  initialDeviceMode?: 'mobile' | 'desktop';
  onOpenAuth?: (role: any) => void;
}

export const OnboardingGatewayModal: React.FC<OnboardingGatewayModalProps> = ({
  isOpen = true,
  onClose,
  onSelectRole,
  defaultViewport = 'desktop',
  initialDeviceMode,
  onOpenAuth,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(initialDeviceMode || defaultViewport);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(audibleNarrator.getLanguage());
  const [isAudible, setIsAudible] = useState<boolean>(audibleNarrator.isAudibleEnabled());

  if (!isOpen) return null;

  const handleAudibleToggle = () => {
    const next = audibleNarrator.toggleAudibleMode();
    setIsAudible(next);
  };

  const handleLangChange = (code: SupportedLanguage) => {
    setSelectedLang(code);
    audibleNarrator.setLanguage(code);
  };

  const handleChoose = (role: UserRole) => {
    soundFX.playSuccess();
    onSelectRole(role);
    onClose();
  };

  return (
    <div
      id="onboarding-gateway-modal-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#c2c6d7] overflow-hidden my-6">
        {/* Top Control Bar: Desktop / Mobile toggle, Audible mode, Language, Close */}
        <div className="bg-[#121c28] text-white px-5 py-3 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider hidden sm:inline">
              Screen Preview Archetype:
            </span>
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-[#1d68f2] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Terminal</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-[#1d68f2] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Citizen App</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audible Button */}
            <button
              type="button"
              onClick={handleAudibleToggle}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isAudible
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-white/10 text-white/70 hover:text-white border-white/10'
              }`}
              title="One-touch Audible Mode Narration for visually impaired citizens"
            >
              {isAudible ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isAudible ? 'Audible ON' : 'Audible Assist'}</span>
            </button>

            {/* Language Pill */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/10 text-xs">
              <Globe className="w-3.5 h-3.5 text-blue-300" />
              <select
                value={selectedLang}
                onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#121c28] text-white">
                    {l.flag} {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Gateway"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCREEN 1: DESKTOP VIEWPORT ARCHETYPE */}
        {viewMode === 'desktop' ? (
          <div className="p-6 md:p-10 space-y-8 animate-in fade-in">
            {/* Hero Value Proposition */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#EDF4FF] rounded-full border border-[#dae2ff] text-xs font-black text-[#0050c8]">
                <Sparkles className="w-4 h-4 text-[#1d68f2]" />
                <span>Next-Generation Municipal Co-Governance</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-[#121c28] tracking-tight leading-tight">
                CivicFix — Every Voice Matters. <br className="hidden sm:inline" />
                <span className="text-[#0050c8]">Transform Your City in 3 Taps.</span>
              </h1>
              <p className="text-sm md:text-base text-[#424655] max-w-2xl mx-auto font-medium">
                Bridge the gap between residents and city hall. Report hazards with automated computer vision, eliminate duplicate work orders, track live repair crews, and earn verified Civic Credits.
              </p>
            </div>

            {/* Live Municipal Impact Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60 text-center space-y-1">
                <span className="text-[11px] font-extrabold text-[#737686] uppercase tracking-wider block">
                  Issues Resolved
                </span>
                <span className="text-2xl md:text-3xl font-black text-[#10B981]">12,480+</span>
                <p className="text-[10px] text-[#56596e]">Verified by Citizens</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60 text-center space-y-1">
                <span className="text-[11px] font-extrabold text-[#737686] uppercase tracking-wider block">
                  Avg Triage Speed
                </span>
                <span className="text-2xl md:text-3xl font-black text-[#0050c8]">4.2 Hours</span>
                <p className="text-[10px] text-[#56596e]">Rapid Dispatch SLA</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60 text-center space-y-1">
                <span className="text-[11px] font-extrabold text-[#737686] uppercase tracking-wider block">
                  SLA Adherence
                </span>
                <span className="text-2xl md:text-3xl font-black text-[#f88400]">98.4%</span>
                <p className="text-[10px] text-[#56596e]">Audited by Ombudsman</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60 text-center space-y-1">
                <span className="text-[11px] font-extrabold text-[#737686] uppercase tracking-wider block">
                  Active Crews
                </span>
                <span className="text-2xl md:text-3xl font-black text-[#121c28]">142 Teams</span>
                <p className="text-[10px] text-[#56596e]">Field Operations Live</p>
              </div>
            </div>

            {/* Bifurcated Path Cards: Citizen vs Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Card 1: Citizen Discovery & Reporting */}
              <div
                onClick={() => handleChoose('citizen')}
                className="group relative bg-white rounded-3xl p-6 md:p-8 border-2 border-[#c2c6d7] hover:border-[#0050c8] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#eef4ff] group-hover:bg-[#0050c8] text-[#0050c8] group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-[#0050c8] uppercase tracking-wider block">
                      Resident & Commuter Gateway
                    </span>
                    <h3 className="text-2xl font-black text-[#121c28] group-hover:text-[#0050c8] transition-colors mt-0.5">
                      Citizen Portal
                    </h3>
                    <p className="text-xs text-[#424655] mt-2 leading-relaxed">
                      Report infrastructure hazards (potholes, dark streetlights, broken pipes), track live municipal resolution on OpenStreetMap, upvote nearby issues, and earn verified Civic Credits for rewards.
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-[#56596e]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      <span>3-Step AI-assisted hazard reporting with camera detection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      <span>Duplicate suppression preventing redundant city work orders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      <span>Escalate unsolved issues to Zonal Commissioners & Ombudsman</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="w-full py-3 bg-[#0050c8] group-hover:bg-[#1d68f2] text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Enter Citizen Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Card 2: Administrative Command Center */}
              <div
                onClick={() => handleChoose('admin')}
                className="group relative bg-[#0b1320] rounded-3xl p-6 md:p-8 border-2 border-[#003180] hover:border-[#1d68f2] shadow-sm hover:shadow-xl transition-all cursor-pointer text-white flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-[#1d68f2] text-white flex items-center justify-center transition-colors shadow-xs">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider block">
                      Authorized Municipal Personnel
                    </span>
                    <h3 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors mt-0.5">
                      Municipal Command Center
                    </h3>
                    <p className="text-xs text-white/80 mt-2 leading-relaxed">
                      Official dispatcher triage console for Ward Engineers, Commissioners, and field response crews. Verify incoming tickets, assign response teams, update repair photos, and manage hearing appointments.
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-white/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Automated density heatmap and SLA tracking dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Rapid crew assignment (Asphalt Unit, Luminaire Electrical, Sanitation)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Review citizen escalations and grievance hearing schedules</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="w-full py-3 bg-[#1d68f2] group-hover:bg-blue-600 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Enter Municipal Command</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SCREEN 2: MOBILE GATEWAY ARCHETYPE */
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-[#f8f9ff] min-h-[540px]">
            {/* Simulated Mobile Device Frame */}
            <div className="w-full max-w-sm bg-white rounded-3xl border-4 border-[#121c28] shadow-2xl p-5 space-y-5 relative">
              {/* Mobile Notch */}
              <div className="w-28 h-4 bg-[#121c28] rounded-full mx-auto mb-1" />

              {/* Mobile Role Selection Card Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0050c8] text-white shadow-md mx-auto mb-1">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-[#121c28] tracking-tight">
                  Welcome to CivicFix
                </h2>
                <p className="text-xs text-[#56596e]">
                  Select your role to get started in your community
                </p>
              </div>

              {/* Language Auto-Detect Banner */}
              <div className="p-2.5 bg-[#EDF4FF] rounded-xl border border-[#dae2ff] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#0050c8] font-bold">
                  <Globe className="w-4 h-4" />
                  <span>Detected: {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.nativeName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAudibleToggle}
                  className="px-2 py-0.5 bg-white text-[#0050c8] border border-[#dae2ff] rounded-lg text-[11px] font-bold flex items-center gap-1"
                >
                  {isAudible ? <Volume2 className="w-3 h-3 text-emerald-600" /> : <VolumeX className="w-3 h-3" />}
                  <span>{isAudible ? 'Audio ON' : 'Audio Assist'}</span>
                </button>
              </div>

              {/* Mobile Bifurcated Role Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleChoose('citizen')}
                  className="w-full p-4 rounded-2xl border-2 border-[#0050c8] bg-[#EDF4FF] text-left hover:bg-[#dfe9fa] transition-all flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0050c8] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#0050c8]">
                        Citizen Portal
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#0050c8] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-[#424655] mt-0.5">
                      Report road hazards, vote on fixes & earn Civic Credits.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleChoose('admin')}
                  className="w-full p-4 rounded-2xl border-2 border-[#0b1320] bg-[#0b1320] text-left hover:bg-[#1a2332] transition-all flex items-start gap-3.5 group cursor-pointer text-white"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-white">
                        Admin / Official
                      </span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      Dispatch repair crews, verify work & review citizen hearings.
                    </p>
                  </div>
                </button>
              </div>

              {/* Quick Metrics Footer */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-around text-center text-xs">
                <div>
                  <span className="font-black text-[#10B981] block">12.4K+</span>
                  <span className="text-[10px] text-[#737686]">Resolved</span>
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div>
                  <span className="font-black text-[#0050c8] block">4.2 hrs</span>
                  <span className="text-[10px] text-[#737686]">Response</span>
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div>
                  <span className="font-black text-[#f88400] block">98.4%</span>
                  <span className="text-[10px] text-[#737686]">SLA Target</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
