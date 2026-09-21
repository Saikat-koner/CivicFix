import React, { useState } from 'react';
import { Contributor, UserRole } from '../types';
import {
  X,
  Award,
  MapPin,
  Mail,
  LogOut,
  KeyRound,
  Building2,
  ShieldCheck,
  Trophy,
  CheckCircle2,
  Clock,
  Volume2,
  Globe,
  Sliders,
  Sparkles,
  Smartphone,
  Monitor,
  Gift,
  ArrowRight,
  TrendingUp,
  History,
  ShieldAlert,
  Copy,
  Check,
  Camera,
  Smile,
} from 'lucide-react';
import { audibleNarrator, SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/audibleNarrator';
import { soundFX } from '../utils/audioFeedback';
import { AvatarPicker } from './AvatarPicker';

interface UserProfileModalProps {
  user: Contributor;
  userRole: UserRole;
  email?: string;
  district?: string;
  isLoggedIn?: boolean;
  onClose: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onSignOut: () => void;
  defaultView?: 'desktop' | 'mobile';
  onUpdateAvatar?: (newAvatar: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  userRole,
  email = 'elena.rostova@metro.org',
  district = 'Downtown Metro Sector (Ward 1)',
  isLoggedIn = true,
  onClose,
  onOpenAuthModal,
  onSignOut,
  defaultView = 'desktop',
  onUpdateAvatar,
}) => {
  const [profileView, setProfileView] = useState<'desktop' | 'mobile'>(defaultView);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(audibleNarrator.getLanguage());
  const [isAudible, setIsAudible] = useState<boolean>(audibleNarrator.isAudibleEnabled());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundFX.isEnabled());
  const [copiedId, setCopiedId] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const permanentId = user.permanentUserId || user.id;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(permanentId);
    setCopiedId(true);
    soundFX.playClick();
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleAudibleToggle = () => {
    const next = audibleNarrator.toggleAudibleMode();
    setIsAudible(next);
  };

  const handleSoundToggle = () => {
    const next = soundFX.toggleSound();
    setSoundEnabled(next);
  };

  const handleLangChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    audibleNarrator.setLanguage(lang);
  };

  // Lifetime impact verification history mock
  const verificationHistory = [
    {
      id: 'v1',
      title: 'Cracked Bitumen Pothole #CFX-8921',
      date: 'Yesterday at 4:15 PM',
      reward: '+100 CC',
      status: 'Confirmed Fixed by Citizen Vote',
      badge: 'Rapid Verifier',
    },
    {
      id: 'v2',
      title: 'Dark Intersection Luminaire #CFX-8919',
      date: '3 days ago',
      reward: '+50 CC',
      status: 'Report Submitted & Dispatched',
      badge: 'Street Sentinel',
    },
    {
      id: 'v3',
      title: 'Water Main Pavement Leak #CFX-8920',
      date: '5 days ago',
      reward: '+100 CC',
      status: 'Emergency Triage Verified',
      badge: 'Eagle Eye',
    },
  ];

  const badgesTrophyCabinet = [
    { name: 'Eagle Eye', desc: 'First 5 infrastructure hazards identified with 95%+ vision accuracy', unlocked: true, icon: '🦅' },
    { name: 'Pothole Patrol', desc: 'Reported and verified 10+ road asphalt craters', unlocked: true, icon: '🚧' },
    { name: 'Street Sentinel', desc: 'Active nighttime streetlight outage reporter', unlocked: true, icon: '💡' },
    { name: 'Rapid Verifier', desc: 'Audited 5+ crew repairs within 24 hours of completion', unlocked: true, icon: '⚡' },
    { name: 'Civic Champion', desc: 'Achieved top 5% community rank in Ward 1', unlocked: false, icon: '🏆' },
    { name: 'Ombudsman Envoy', desc: 'Successfully escalated and resolved a public safety issue', unlocked: false, icon: '🏛️' },
  ];

  return (
    <div
      id="user-profile-modal-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-[#c2c6d7] relative overflow-hidden my-6">
        {/* Top Archetype Bar: Screen 8 (Desktop) vs Screen 9 (Mobile) */}
        <div className="bg-[#121c28] text-white px-5 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider hidden sm:inline">
              Profile Screen:
            </span>
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setProfileView('desktop')}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  profileView === 'desktop'
                    ? 'bg-[#1d68f2] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Impact Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileView('mobile')}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  profileView === 'mobile'
                    ? 'bg-[#1d68f2] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Badges & Credits</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================== SCREEN 8: COMMUNITY IMPACT PROFILE & AWARDS (DESKTOP) ===================== */}
        {profileView === 'desktop' ? (
          <div className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Profile Hero Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-[#1d68f2] shadow-md ring-4 ring-[#EDF4FF] cursor-pointer"
                    onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                    title="Click to change face icon or avatar"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                    className="absolute -top-1.5 -left-1.5 p-1 bg-white hover:bg-blue-50 text-blue-600 rounded-full border border-blue-200 shadow-xs transition-all cursor-pointer"
                    title="Change Face Icon / Avatar"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <div
                    className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white shadow-xs ${
                      userRole === 'admin' ? 'bg-[#003180] text-white' : 'bg-[#10B981] text-white'
                    }`}
                  >
                    {userRole === 'admin' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-black text-[#121c28]">{user.name}</h3>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                        userRole === 'admin'
                          ? 'bg-[#003180] text-white border-[#003180]'
                          : 'bg-[#EDF4FF] text-[#0050c8] border-[#dae2ff]'
                      }`}
                    >
                      {userRole === 'admin' ? 'City Official' : 'Verified Resident Rank: Master Sentinel'}
                    </span>
                  </div>
                  <p className="text-xs text-[#56596e] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1d68f2]" />
                    <span>{district}</span>
                    <span className="mx-1">•</span>
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{email}</span>
                  </p>

                  {/* Permanent Unique Citizen ID Credential */}
                  <div className="inline-flex items-center gap-2 mt-2 px-2.5 py-1 bg-gray-100 hover:bg-gray-200/80 rounded-lg text-xs font-mono text-[#121c28] border border-gray-200 transition-colors">
                    <span className="text-[10px] font-sans font-extrabold text-gray-500 uppercase tracking-wider">Permanent ID:</span>
                    <span className="font-black text-[#0050c8]">{permanentId}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-gray-400 hover:text-blue-600 p-0.5 cursor-pointer transition-colors"
                      title="Copy Permanent User ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {copiedId && (
                      <span className="text-[10px] font-sans text-emerald-600 font-bold">Copied!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl border border-red-200 text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Avatar & Face Icon Editor */}
            {isEditingAvatar && (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 animate-in fade-in duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-900">
                      Select Your Profile Avatar or Face Icon
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingAvatar(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 font-bold cursor-pointer px-2.5 py-1 bg-white rounded-lg border border-gray-200 shadow-2xs"
                  >
                    Done
                  </button>
                </div>
                <AvatarPicker
                  selectedAvatarUrl={user.avatar}
                  onSelectAvatar={(newUrl) => {
                    if (onUpdateAvatar) onUpdateAvatar(newUrl);
                  }}
                  userRole={userRole}
                  userName={user.name}
                />
              </div>
            )}

            {/* Governor’s Civic Award Qualification Progress */}
            <div className="bg-gradient-to-r from-[#0050c8] to-[#1d68f2] rounded-2xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/15 text-amber-300">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider">
                      Governor’s Civic Honor Award 2026
                    </h4>
                    <p className="text-xs text-white/80">
                      Annual municipal award honoring citizens with high verified impact.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black bg-amber-400 text-[#121c28] px-3 py-1 rounded-full shadow-xs">
                  82% Qualified
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: '82%' }} />
                </div>
                <div className="flex justify-between text-[11px] text-white/80 font-medium">
                  <span>820 / 1,000 Verified Points</span>
                  <span>180 pts to Official Medal Ceremony</span>
                </div>
              </div>
            </div>

            {/* Lifetime Impact Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60">
                <span className="text-[10px] font-extrabold text-[#737686] uppercase tracking-wider block mb-1">
                  Civic Credits Balance
                </span>
                <span className="text-2xl font-black text-[#0050c8]">
                  {user.civicCredits.toLocaleString()} CC
                </span>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Top 3% in City</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60">
                <span className="text-[10px] font-extrabold text-[#737686] uppercase tracking-wider block mb-1">
                  Issues Resolved
                </span>
                <span className="text-2xl font-black text-[#10B981]">
                  {user.issuesResolved} Tickets
                </span>
                <p className="text-[10px] text-[#56596e] font-bold mt-0.5">100% Verified Quality</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60">
                <span className="text-[10px] font-extrabold text-[#737686] uppercase tracking-wider block mb-1">
                  Citizen Verifications
                </span>
                <span className="text-2xl font-black text-[#f88400]">
                  34 Audits
                </span>
                <p className="text-[10px] text-[#56596e] font-bold mt-0.5">Before/After Validated</p>
              </div>

              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-[#c2c6d7]/60">
                <span className="text-[10px] font-extrabold text-[#737686] uppercase tracking-wider block mb-1">
                  Public Commute Time Saved
                </span>
                <span className="text-2xl font-black text-[#121c28]">
                  14.5 Hours
                </span>
                <p className="text-[10px] text-[#56596e] font-bold mt-0.5">Pothole Clearance Impact</p>
              </div>
            </div>

            {/* Badge Trophy Cabinet */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-[#121c28] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#0050c8]" />
                  <span>Accredited Badge Trophy Cabinet</span>
                </h4>
                <span className="text-xs text-[#737686]">4 of 6 Unlocked</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {badgesTrophyCabinet.map((badge) => (
                  <div
                    key={badge.name}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      badge.unlocked
                        ? 'bg-white border-[#c2c6d7] shadow-xs'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-extrabold text-xs text-[#121c28] truncate">{badge.name}</h5>
                          {badge.unlocked && (
                            <span className="text-[10px] font-black text-[#10B981] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Unlocked
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#56596e] mt-0.5 line-clamp-2">{badge.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification History Timeline */}
            <div>
              <h4 className="text-xs font-black text-[#121c28] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0050c8]" />
                <span>Recent Community Verification Timeline</span>
              </h4>

              <div className="space-y-2.5">
                {verificationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-[#c2c6d7] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#EDF4FF] text-[#0050c8] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[#121c28]">{item.title}</h5>
                        <p className="text-[11px] text-[#737686]">{item.date} • {item.status}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center">
                      <span className="text-xs font-black text-[#0050c8] bg-[#EDF4FF] px-2.5 py-1 rounded-full border border-[#dae2ff]">
                        {item.reward}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ===================== SCREEN 9: CITIZEN BADGES & CIVIC CREDITS (MOBILE) ===================== */
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-[#f8f9ff]">
            {/* Simulated Mobile Device Frame */}
            <div className="w-full max-w-sm bg-white rounded-3xl border-4 border-[#121c28] shadow-2xl p-5 space-y-4 relative">
              {/* Notch */}
              <div className="w-28 h-4 bg-[#121c28] rounded-full mx-auto mb-1" />

              {/* Mobile Profile Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-[#1d68f2]"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-base text-[#121c28] truncate">{user.name}</h3>
                  <p className="text-xs text-[#56596e] truncate">{district}</p>
                  <span className="text-[10px] font-black text-[#0050c8] bg-[#EDF4FF] px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Level 3 Community Scout
                  </span>
                </div>
              </div>

              {/* Mobile Permanent Citizen ID */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-[#121c28]">
                <div className="flex flex-col">
                  <span className="text-[9px] font-sans font-extrabold text-gray-500 uppercase">Permanent ID</span>
                  <span className="font-bold text-[#0050c8]">{permanentId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 cursor-pointer shadow-2xs"
                  title="Copy Permanent User ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Civic Credits & Perks Redeem Card */}
              <div className="bg-gradient-to-r from-[#0050c8] to-[#1d68f2] p-4 rounded-2xl text-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Civic Credits Balance
                  </span>
                  <Award className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-3xl font-black">
                  {user.civicCredits.toLocaleString()} <span className="text-xs font-normal opacity-80">CC</span>
                </div>
                <p className="text-[11px] text-white/85">
                  Redeemable for public transit discounts & local utility offsets.
                </p>
              </div>

              {/* Redeemed Public Perks Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-extrabold text-[#121c28] uppercase tracking-wider">
                  <span>Available Civic Perks</span>
                  <span className="text-[10px] text-[#0050c8] font-bold">1-Tap Claim</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl border border-[#c2c6d7] flex items-center justify-between bg-white shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#f88400]" />
                      <div>
                        <span className="font-bold text-[#121c28] block">BMTC Monthly Bus Pass</span>
                        <span className="text-[10px] text-[#737686]">20% Civic Discount Voucher</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-[#0050c8] bg-[#EDF4FF] px-2 py-0.5 rounded">
                      250 CC
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-[#c2c6d7] flex items-center justify-between bg-white shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-[#121c28] block">BESCOM Electricity Credit</span>
                        <span className="text-[10px] text-[#737686]">₹150 bill subsidy voucher</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-[#0050c8] bg-[#EDF4FF] px-2 py-0.5 rounded">
                      400 CC
                    </span>
                  </div>
                </div>
              </div>

              {/* Radical Accessibility Preferences */}
              <div className="bg-[#f8f9ff] p-3.5 rounded-2xl border border-[#c2c6d7]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#121c28] uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#0050c8]" />
                    <span>Radical Accessibility</span>
                  </span>
                  <span className="text-[10px] text-[#10B981] font-black">Persistent</span>
                </div>

                {/* Audible Narration Toggle */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#0050c8]" />
                    <span>Audible Screen Narration</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAudible}
                    onChange={handleAudibleToggle}
                    className="w-4 h-4 text-[#0050c8] rounded focus:ring-[#0050c8] cursor-pointer"
                  />
                </div>

                {/* Sound FX Toggle */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f88400]" />
                    <span>Haptic Chimes & FX</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={handleSoundToggle}
                    className="w-4 h-4 text-[#0050c8] rounded focus:ring-[#0050c8] cursor-pointer"
                  />
                </div>

                {/* Multilingual Subtitles Config */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#737686] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#0050c8]" />
                    <span>Dual Subtitle Language</span>
                  </label>
                  <select
                    value={currentLang}
                    onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
                    className="w-full p-2 bg-white border border-[#c2c6d7] rounded-xl text-xs font-bold"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bottom Quick Switcher */}
              <div className="pt-1 flex items-center justify-end text-xs">
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    className="text-red-600 font-bold hover:underline"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
