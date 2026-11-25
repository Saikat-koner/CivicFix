import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Award,
  ChevronRight,
  Camera,
  Layers,
  MessageCircle,
  PhoneCall,
  Check,
  Zap,
  Map as MapIcon,
  Search,
  ChevronDown,
  Smartphone,
  X,
  Copy,
  Send,
  Share2,
  ExternalLink,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { Contributor, CivicIssue } from '../types';
import { CIVIC_FAQ_ITEMS } from '../data/faq';
import { TrackIssueWidget } from './TrackIssueWidget';
import { soundFX } from '../utils/audioFeedback';
import confetti from 'canvas-confetti';

interface PeopleHomepageProps {
  onOpenHotlines?: () => void;
  currentUser?: Contributor;
  onGoToDashboard?: () => void;
  onReportIssue?: () => void;
  onOpenActivity?: () => void;
  onOpenAdmin?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenContact?: () => void;
  onOpenCommandPalette?: () => void;
  issues?: CivicIssue[];
  onSelectIssue?: (issue: CivicIssue) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const PeopleHomepage: React.FC<PeopleHomepageProps> = ({
  onOpenHotlines,
  onGoToDashboard,
  onReportIssue,
  onOpenActivity,
  onOpenAdmin,
  onOpenPrivacy,
  onOpenTerms,
  onOpenContact,
  onOpenCommandPalette,
  issues = [],
  onSelectIssue,
}) => {
  // Web Share API & Share Modal State
  const [shareToast, setShareToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Active FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openCount = issues.filter((i) => i.status === 'open').length;
  const inProgressCount = issues.filter((i) => i.status === 'investigating').length;
  const resolvedCount = issues.filter((i) => i.status === 'fixed').length;

  const getCivicFixShareData = () => {
    const originUrl =
      typeof window !== 'undefined' ? window.location.origin || window.location.href : 'https://civicfix.org';
    const title = 'CivicFix — Citizen Municipal Redressal Portal';
    const text =
      'Join me on CivicFix to report broken roads, potholes, dark streetlights, and sanitation hazards directly to municipal authorities. No login required — track real-time repairs and strengthen your neighborhood!';
    return { title, text, url: originUrl };
  };

  const handleShareCivicFix = async () => {
    soundFX.playClick();
    const { title, text, url } = getCivicFixShareData();
    const sharePayload = { title, text, url };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const canShare = typeof navigator.canShare === 'function' ? navigator.canShare(sharePayload) : true;
        if (canShare) {
          await navigator.share(sharePayload);
          soundFX.playSuccess();
          try {
            confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
          } catch {}
          setShareToast({
            message: 'CivicFix invitation shared! Thank you for strengthening our neighborhood.',
            type: 'success',
          });
          setTimeout(() => setShareToast(null), 4000);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('[WebShare] Native share failed or blocked by iframe, falling back to share dialog:', err);
      }
    }

    try {
      const fullInvite = `${title}\n\n${text}\n\n👉 Visit CivicFix: ${url}`;
      await navigator.clipboard.writeText(fullInvite);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
      soundFX.playSuccess();
      setShareToast({
        message: 'Invitation link copied to clipboard! You can also share using the options below.',
        type: 'success',
      });
    } catch {
      setShareToast({
        message: 'Share CivicFix with neighbors and friends.',
        type: 'info',
      });
    }

    setShowShareModal(true);
    setTimeout(() => setShareToast(null), 4500);
  };

  const REPORTABLE_CATEGORIES = [
    {
      title: 'Potholes & Broken Roads',
      desc: 'Craters, dangerous asphalt cracks, unpaved trenches, missing speed breakers.',
      icon: <Layers className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      badge: 'Avg. 24h Response',
    },
    {
      title: 'Streetlights & Electrical',
      desc: 'Dark road stretches, non-functioning LED lamps, dangling wires, open transformer boxes.',
      icon: <Zap className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      badge: 'Safety Priority',
    },
    {
      title: 'Garbage & Overflowing Waste',
      desc: 'Uncleared community bins, illegal corner dumping, non-collection in residential wards.',
      icon: <AlertCircle className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badge: 'Daily Cleared',
    },
    {
      title: 'Drainage & Water Overflow',
      desc: 'Monsoon waterlogging, choked storm drains, open manholes, drinking water pipe leaks.',
      icon: <Radio className="w-5 h-5 text-cyan-600" />,
      color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
      badge: 'Emergency Ready',
    },
    {
      title: 'Traffic Signals & Signage',
      desc: 'Broken traffic lights, blind junction obstructions, missing directional or pedestrian signage.',
      icon: <MapPin className="w-5 h-5 text-rose-600" />,
      color: 'bg-rose-50 border-rose-200 text-rose-900',
      badge: 'High Impact',
    },
    {
      title: 'Parks & Public Amenities',
      desc: 'Broken public benches, vandalized playground swings, fallen tree branches, unlit public walkways.',
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200 text-purple-900',
      badge: 'Community Loved',
    },
  ];

  const FAQ_ITEMS = CIVIC_FAQ_ITEMS;

  return (
    <div
      id="people-homepage"
      className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b0f17] text-[#121c28] dark:text-gray-100 flex flex-col font-sans selection:bg-[#1d68f2] selection:text-white"
    >
      {/* Main Content Area */}
      <main className="flex-1">
        {/* HERO SECTION: Open Citizen Portal — No Login Required */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f0f5ff] to-[#f8f9ff] dark:from-[#121620] dark:via-[#111827] dark:to-[#0b0f17] py-12 md:py-16 border-b border-[#e2e8f0] dark:border-gray-800">
          {/* Subtle civic decorative grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-start">
              {/* Left Column (7 cols): Citizen Headline, Search & Track Issue Widget */}
              <div className="md:col-span-7 space-y-6 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0050c8] dark:text-blue-300 text-xs font-black uppercase tracking-wider shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-[#0050c8] dark:text-blue-400" />
                  <span>Open Municipal Public Redressal Portal • No Login Required</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#121c28] dark:text-white tracking-tight leading-[1.12]">
                    The Homepage for the People of the City.
                  </h1>
                  <p className="text-base sm:text-lg text-[#424655] dark:text-gray-300 max-w-xl font-normal leading-relaxed">
                    Report broken roads, potholes, dark streetlights, and sanitation hazards directly to your Municipal Corporation. Track real-time repair progress, upvote neighborhood issues, and demand transparent civic governance — instantly, without signing up.
                  </p>

                  {/* ⌘K Quick Command & Issue Search Pill */}
                  {onOpenCommandPalette && (
                    <button
                      type="button"
                      onClick={onOpenCommandPalette}
                      className="w-full max-w-md flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white dark:bg-[#161b26] border border-[#dae2ff] dark:border-gray-700 shadow-sm hover:border-[#0050c8] text-left transition-all cursor-pointer group"
                    >
                      <span className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <Search className="w-4 h-4 text-gray-400 group-hover:text-[#0050c8]" />
                        <span>Search municipal services, issues or ward corporators...</span>
                      </span>
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-[#0050c8] dark:text-blue-300 rounded border border-blue-100 dark:border-blue-800">
                        ⌘K
                      </kbd>
                    </button>
                  )}

                  {/* Quick Share & Hotlines Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      id="hero-share-civicfix-btn"
                      type="button"
                      onClick={handleShareCivicFix}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                      title="Invite neighbors to use CivicFix"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Invite Neighbors & Friends (Share)</span>
                    </button>
                    {onOpenHotlines && (
                      <button
                        type="button"
                        onClick={onOpenHotlines}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                        <span>24/7 Emergency Hotlines</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* SIMPLIFIED 'TRACK ISSUE' WIDGET */}
                <TrackIssueWidget
                  issues={issues}
                  onSelectIssue={onSelectIssue}
                  onGoToDashboard={onGoToDashboard}
                />

                {/* INSTANT OPEN REPORTING CALLOUT BANNER */}
                <div className="p-4 bg-gradient-to-r from-blue-900 to-[#003da1] text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Spot a Hazard? Report It Instantly — No Login Needed!</span>
                    </div>
                    <p className="text-xs text-blue-100">
                      Upload a photo, drop a GPS pin, and dispatch a municipal repair ticket in under 30 seconds.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onReportIssue?.();
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-blue-50 text-[#003da1] font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Report Issue Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onGoToDashboard?.();
                      }}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
                    >
                      Open Live Map
                    </button>
                  </div>
                </div>

                {/* 4 Citizen Guarantee Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 bg-white dark:bg-[#161b26] rounded-2xl border border-[#dae2ff] dark:border-gray-800 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0050c8] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#121c28] dark:text-white">GPS-Verified Pins</h4>
                      <p className="text-[11px] text-[#737686] dark:text-gray-400 mt-0.5">Automated ward geocoding</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#161b26] rounded-2xl border border-[#dae2ff] dark:border-gray-800 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#121c28] dark:text-white">48-Hour SLA</h4>
                      <p className="text-[11px] text-[#737686] dark:text-gray-400 mt-0.5">Guaranteed municipal timer</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#161b26] rounded-2xl border border-[#dae2ff] dark:border-gray-800 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#121c28] dark:text-white">Photo Proof Fixes</h4>
                      <p className="text-[11px] text-[#737686] dark:text-gray-400 mt-0.5">Before & after transparency</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#161b26] rounded-2xl border border-[#dae2ff] dark:border-gray-800 shadow-2xs flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#121c28] dark:text-white">Civic Credits</h4>
                      <p className="text-[11px] text-[#737686] dark:text-gray-400 mt-0.5">Earn parking & transit passes</p>
                    </div>
                  </div>
                </div>

                {/* Civic Authority Verification Notice */}
                <div className="flex items-center gap-3 text-xs text-[#424655] dark:text-gray-300 bg-white/70 dark:bg-[#161b26]/70 backdrop-blur-xs p-3 rounded-2xl border border-[#dae2ff] dark:border-gray-800">
                  <span className="flex items-center gap-1.5 text-[#0050c8] dark:text-blue-400 font-black shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#0050c8] dark:text-blue-400" />
                    BBMP Certified:
                  </span>
                  <span className="text-[11px] text-[#424655] dark:text-gray-300">
                    All reported infrastructure hazards are routed directly to zonal executive engineers with GPS-tagged work orders.
                  </span>
                </div>
              </div>

              {/* Right Column (5 cols): Open Citizen Quick-Access Hub (Replaces Login/Register Card) */}
              <div className="md:col-span-5">
                <div
                  id="people-homepage-quick-hub"
                  className="bg-white dark:bg-[#161b26] rounded-3xl border border-[#c2c6d7] dark:border-gray-800 shadow-xl p-5 sm:p-6 space-y-5 relative"
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#0050c8] dark:text-blue-400 flex items-center justify-center font-bold">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-[#121c28] dark:text-white">
                          Instant Citizen Hub
                        </h3>
                        <p className="text-[11px] text-[#737686] dark:text-gray-400">
                          Full open access — no sign-in or registration needed
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-wider text-[#10B981] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      Open Live
                    </span>
                  </div>

                  {/* Live Ward Snapshot */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-2xl bg-[#f8f9ff] dark:bg-gray-800/70 border border-[#dae2ff] dark:border-gray-700 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737686] dark:text-gray-400 block">
                        Open
                      </span>
                      <span className="text-xl font-black text-amber-600">{openCount}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#f8f9ff] dark:bg-gray-800/70 border border-[#dae2ff] dark:border-gray-700 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737686] dark:text-gray-400 block">
                        In Progress
                      </span>
                      <span className="text-xl font-black text-[#0050c8] dark:text-blue-400">{inProgressCount}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#f8f9ff] dark:bg-gray-800/70 border border-[#dae2ff] dark:border-gray-700 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737686] dark:text-gray-400 block">
                        Resolved
                      </span>
                      <span className="text-xl font-black text-emerald-600">{resolvedCount}</span>
                    </div>
                  </div>

                  {/* Direct 1-Click Action Cards */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onReportIssue?.();
                      }}
                      className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#0050c8] to-[#1d68f2] hover:from-[#003da1] hover:to-[#0050c8] text-white text-left shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-black text-sm block">Report a Civic Hazard</span>
                          <span className="text-[11px] text-blue-100">
                            Snap a photo, AI-detect defect & pin GPS location
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onGoToDashboard?.();
                      }}
                      className="w-full p-3.5 rounded-2xl bg-[#f8f9ff] dark:bg-gray-800/60 hover:bg-[#eef4ff] dark:hover:bg-gray-800 border border-[#dae2ff] dark:border-gray-700 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#0050c8] dark:text-blue-400 flex items-center justify-center shrink-0">
                          <MapIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs text-[#121c28] dark:text-white block">
                            Explore Live City Radar Map
                          </span>
                          <span className="text-[11px] text-[#737686] dark:text-gray-400">
                            View real-time ward pins, SLAs & live navigation
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#0050c8] shrink-0 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onOpenActivity?.();
                      }}
                      className="w-full p-3.5 rounded-2xl bg-[#f8f9ff] dark:bg-gray-800/60 hover:bg-[#eef4ff] dark:hover:bg-gray-800 border border-[#dae2ff] dark:border-gray-700 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs text-[#121c28] dark:text-white block">
                            Browse Community Activity Feed
                          </span>
                          <span className="text-[11px] text-[#737686] dark:text-gray-400">
                            Upvote reports, comment & verify completed repairs
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onOpenAdmin?.();
                      }}
                      className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs block">
                            City Commissioner Admin Command
                          </span>
                          <span className="text-[11px] text-slate-300">
                            Triage tickets, assign field crews & inspect database
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-300 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Open Access Assurance */}
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>100% Open Public Utility:</strong> Every tool on CivicFix is directly accessible with zero sign-up barriers.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: ABOUT CIVICFIX */}
        <section id="about-civicfix-section" className="py-16 bg-[#edf3ff] dark:bg-[#101521] border-b border-[#dae2ff] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-black text-[#0050c8] uppercase tracking-wider bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 shadow-2xs">
                About the App & Website
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-[#121c28] dark:text-white tracking-tight">
                Everything You Need to Know About CivicFix
              </h2>
              <p className="text-xs md:text-sm text-[#424655] dark:text-gray-400 leading-relaxed">
                CivicFix is the official municipal citizen redressal platform built to bridge the gap between residents and city authorities through complete transparency, rapid resolution, and open civic participation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="p-6 bg-white dark:bg-[#161b26] rounded-3xl border border-[#dae2ff] dark:border-gray-800 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#0050c8] flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-[#121c28] dark:text-white">What is CivicFix?</h3>
                  <p className="text-xs text-[#424655] dark:text-gray-300 leading-relaxed">
                    A digital municipal portal where city residents report infrastructure failures—like dangerous potholes, broken streetlamps, sewage overflow, and open garbage dumps—directly to ward engineers.
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] font-bold text-[#0050c8]">
                  Direct line to Municipal Corporation
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 bg-white dark:bg-[#161b26] rounded-3xl border border-[#dae2ff] dark:border-gray-800 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-[#121c28] dark:text-white">Why Was It Built?</h3>
                  <p className="text-xs text-[#424655] dark:text-gray-300 leading-relaxed">
                    Traditional municipal grievance systems relied on slow paper complaints and ignored calls. CivicFix introduces an unalterable 48-Hour SLA countdown clock that holds contractors and engineers publicly accountable.
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] font-bold text-emerald-700">
                  48h guaranteed response SLA
                </div>
              </div>

              {/* Card 3: Open & Frictionless Access */}
              <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-emerald-950 dark:text-emerald-200">Open Public Access</h3>
                  <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                    No login or signup barriers. Any resident or visitor can immediately view city-wide hazards, file new geotagged reports, upvote urgent repairs, and track municipal resolution in real time.
                  </p>
                </div>
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 text-[11px] font-black text-emerald-900 dark:text-emerald-300">
                  Zero login required — start immediately
                </div>
              </div>

              {/* Card 4: Full Civic Toolkit */}
              <div className="p-6 bg-white dark:bg-[#161b26] rounded-3xl border border-[#dae2ff] dark:border-gray-800 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-[#121c28] dark:text-white">Full Civic Toolkit</h3>
                  <p className="text-xs text-[#424655] dark:text-gray-300 leading-relaxed">
                    Submit GPS-pinned reports with camera photos, track live field crews, verify contractor before/after repairs, earn Civic Credits for public transit, and book meetings with Ward Corporators.
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] font-bold text-purple-700">
                  All features unlocked instantly
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW IT WORKS (3 EASY STEPS) */}
        <section id="how-it-works-section" className="py-16 bg-white dark:bg-[#121620] border-b border-[#e2e8f0] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-black text-[#0050c8] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Simple & Transparent
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#121c28] dark:text-white tracking-tight">
                How CivicFix Works for the People
              </h2>
              <p className="text-xs md:text-sm text-[#424655] dark:text-gray-400">
                No tedious municipal paperwork, no accounts required. Transparent redressal in 3 simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="p-6 bg-[#f8f9ff] dark:bg-[#161b26] rounded-3xl border border-[#dae2ff] dark:border-gray-800 space-y-4 relative group hover:border-[#0050c8] transition-all shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#0050c8] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  1
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#121c28] dark:text-white">Spot, Snap & Geo-Pin</h3>
                  <p className="text-xs text-[#424655] dark:text-gray-300 leading-relaxed">
                    Notice a pothole, overflowed garbage bin, or broken light? Take a quick photo. Our AI automatically identifies the hazard type and records your exact GPS coordinates.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-[#0050c8] flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Instant mobile upload with offline queue</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 bg-[#f8f9ff] dark:bg-[#161b26] rounded-3xl border border-[#dae2ff] dark:border-gray-800 space-y-4 relative group hover:border-[#0050c8] transition-all shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#1d68f2] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  2
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#121c28] dark:text-white">Ward Crew Dispatched</h3>
                  <p className="text-xs text-[#424655] dark:text-gray-300 leading-relaxed">
                    The ticket is instantly sent to the on-duty Ward Engineer and field crew. A public 48-hour countdown SLA begins so everyone in the neighborhood can track the repair.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-[#0050c8] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Real-time status updates on the live map</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 bg-[#f8f9ff] dark:bg-[#161b26] rounded-3xl border border-[#dae2ff] dark:border-gray-800 space-y-4 relative group hover:border-[#0050c8] transition-all shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  3
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#121c28] dark:text-white">Photo Proof & Rewards</h3>
                  <p className="text-xs text-[#424655] dark:text-gray-300 leading-relaxed">
                    Once fixed, the team uploads after-repair photos. Neighbors verify the fix, and you receive Civic Credits to claim parking passes, transit cards, and community badges.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>+100 CC resolution reward</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: WHAT THE PEOPLE CAN REPORT (CATALOG GRID) */}
        <section id="reportable-categories-section" className="py-16 bg-[#f8f9ff] dark:bg-[#0b0f17] border-b border-[#e2e8f0] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-black text-[#0050c8] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Civic Services Catalog
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-[#121c28] dark:text-white tracking-tight mt-2">
                  What You Can Report in Your Ward
                </h2>
                <p className="text-xs md:text-sm text-[#424655] dark:text-gray-400 mt-1">
                  Covering all municipal departments across roads, electricity, sanitation, and safety. Click any category to file a report right away.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onReportIssue?.();
                }}
                className="self-start md:self-auto px-4 py-2.5 bg-[#0050c8] hover:bg-[#003da1] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report an Issue Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {REPORTABLE_CATEGORIES.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    soundFX.playClick();
                    onReportIssue?.();
                  }}
                  className="p-5 bg-white dark:bg-[#161b26] rounded-2xl border border-[#dae2ff] dark:border-gray-800 hover:border-[#0050c8] hover:shadow-md transition-all cursor-pointer space-y-3 group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${cat.color} flex items-center justify-center`}>
                      {cat.icon}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Instant Report
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {cat.badge}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-[#121c28] dark:text-white group-hover:text-[#0050c8] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#424655] dark:text-gray-400 mt-1 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#0050c8] group-hover:translate-x-1 transition-transform">
                    <span>File report in your ward</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: CITIZEN CHARTER & GUARANTEED RIGHTS */}
        <section id="citizen-charter-section" className="py-16 bg-white dark:bg-[#121620] border-b border-[#e2e8f0] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Guaranteed by Municipal Law
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#121c28] dark:text-white tracking-tight">
                The Citizen Redressal Charter
              </h2>
              <p className="text-xs md:text-sm text-[#424655] dark:text-gray-400">
                CivicFix enforces transparency and accountability between the administration and the people.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/30 dark:to-[#161b26] rounded-2xl border border-blue-100 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[#121c28] dark:text-white">48-Hour Response</h4>
                <p className="text-xs text-[#424655] dark:text-gray-400 leading-relaxed">
                  Every legitimate issue receives an automated municipal inspection acknowledgment and assignment within 48 hours.
                </p>
              </div>

              <div className="p-5 bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/30 dark:to-[#161b26] rounded-2xl border border-emerald-100 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[#121c28] dark:text-white">Photo Proof Standard</h4>
                <p className="text-xs text-[#424655] dark:text-gray-400 leading-relaxed">
                  No ticket can be marked "Resolved" without a timestamped, geo-tagged photograph uploaded by the municipal contractor.
                </p>
              </div>

              <div className="p-5 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/30 dark:to-[#161b26] rounded-2xl border border-amber-100 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[#121c28] dark:text-white">Ombudsman Escalation</h4>
                <p className="text-xs text-[#424655] dark:text-gray-400 leading-relaxed">
                  Overdue tickets can be directly escalated to the City Ombudsman Desk for administrative inquiry and physical appointment.
                </p>
              </div>

              <div className="p-5 bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/30 dark:to-[#161b26] rounded-2xl border border-purple-100 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[#121c28] dark:text-white">Civic Recognition</h4>
                <p className="text-xs text-[#424655] dark:text-gray-400 leading-relaxed">
                  Active neighborhood contributors receive formal Certificates of Civic Appreciation signed by Municipal Authorities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS (FAQ) */}
        <section
          id="faq-section"
          className="py-16 bg-[#f8f9ff] dark:bg-[#151a26] border-b border-[#e2e8f0] dark:border-gray-800 relative"
        >
          <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-8 relative">
            <div className="text-center space-y-2">
              <span className="text-xs font-black text-[#0050c8] dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/80">
                Got Questions?
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#121c28] dark:text-white tracking-tight">
                Frequently Asked Questions by Residents
              </h2>
              <p className="text-xs md:text-sm text-[#424655] dark:text-gray-400 max-w-xl mx-auto">
                Official municipal guidelines on reporting civic hazards, tracking repair SLAs, and reaching city hall authorities.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1e2330] rounded-2xl border border-[#dae2ff] dark:border-gray-800 overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenFaq(openFaq === idx ? null : idx);
                      soundFX.playClick();
                    }}
                    className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-[#121c28] dark:text-gray-100 hover:text-[#0050c8] dark:hover:text-blue-400 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 flex-wrap">
                      {faq.category && (
                        <span className="text-[10px] uppercase font-black tracking-wider bg-blue-50 dark:bg-blue-950/60 text-[#0050c8] dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                          {faq.category}
                        </span>
                      )}
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                        openFaq === idx ? 'rotate-180 text-[#0050c8] dark:text-blue-400' : ''
                      }`}
                    />
                  </button>

                  {openFaq === idx && (
                    <div className="px-4 md:px-5 pb-5 text-xs text-[#424655] dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/80 pt-3 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* In-Section Municipal Direct Redressal Help Banner */}
            <div className="p-5 md:p-6 bg-gradient-to-r from-blue-50/90 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-[#1e2330] dark:to-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-11 h-11 rounded-2xl bg-[#0050c8] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#121c28] dark:text-white">
                    Need Direct Municipal Assistance?
                  </h4>
                  <p className="text-xs text-[#424655] dark:text-gray-400 mt-0.5">
                    Connect directly with the Central Control Room, Ward Nodal Officers, or submit a formal citizen grievance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="ask-the-city-section-cta"
                onClick={() => {
                  soundFX.playClick();
                  onOpenContact?.();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0050c8] hover:bg-[#003da1] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Municipal Desk</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 6: FINAL CTA BANNER */}
        <section className="py-16 bg-gradient-to-r from-[#003da1] via-[#0050c8] to-[#1d68f2] text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 md:px-8 text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Open to All Neighborhood Residents — No Sign-Up Required</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Ready to Make Your Neighborhood Safer & Cleaner?
            </h2>

            <p className="text-sm md:text-base text-blue-100 max-w-xl mx-auto font-normal">
              Submit your first geotagged infrastructure report in seconds or explore active repairs happening across your city right now.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onReportIssue?.();
                }}
                className="px-6 py-3 bg-white text-[#0050c8] hover:bg-blue-50 font-black text-xs md:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report an Issue Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onGoToDashboard?.();
                }}
                className="px-6 py-3 bg-blue-900/40 hover:bg-blue-900/60 text-white font-bold text-xs md:text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <MapIcon className="w-4 h-4" />
                <span>Open Live City Radar</span>
              </button>

              <button
                id="footer-cta-share-btn"
                type="button"
                onClick={handleShareCivicFix}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                title="Invite neighbors via mobile native share"
              >
                <Share2 className="w-4 h-4" />
                <span>Share CivicFix with Neighbors</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#121620] border-t border-[#c2c6d7] dark:border-gray-800 py-8 pb-24 md:pb-8 text-[#737686] dark:text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0050c8]" />
            <span className="font-bold text-[#121c28] dark:text-white">CivicFix Citizen Redressal Portal</span>
            <span>&bull;</span>
            <span>Open Public Municipal Utility</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="hover:text-[#0050c8] cursor-pointer flex items-center gap-1"
              >
                <span>⌘K Search</span>
              </button>
            )}
            {onOpenPrivacy && (
              <button onClick={onOpenPrivacy} className="hover:text-[#0050c8] cursor-pointer">
                Privacy Policy
              </button>
            )}
            {onOpenTerms && (
              <button onClick={onOpenTerms} className="hover:text-[#0050c8] cursor-pointer">
                Terms of Service
              </button>
            )}
            {onOpenContact && (
              <button onClick={onOpenContact} className="hover:text-[#0050c8] cursor-pointer">
                City Hall Address
              </button>
            )}
            <button onClick={() => onReportIssue?.()} className="hover:text-[#0050c8] font-bold cursor-pointer">
              Report Issue
            </button>
            <button onClick={() => onGoToDashboard?.()} className="hover:text-[#0050c8] font-bold cursor-pointer">
              City Radar
            </button>
            {onOpenHotlines && (
              <button onClick={onOpenHotlines} className="hover:text-red-600 font-bold cursor-pointer">
                Emergency 112
              </button>
            )}
            <button
              id="footer-share-link-btn"
              onClick={handleShareCivicFix}
              className="hover:text-emerald-600 font-bold cursor-pointer flex items-center gap-1 text-emerald-700 dark:text-emerald-400"
              title="Share CivicFix"
            >
              <Share2 className="w-3 h-3" />
              <span>Share CivicFix</span>
            </button>
            <span className="text-gray-400">Wards 1–198</span>
          </div>
        </div>
      </footer>

      {/* Share CivicFix Modal (Native Web Share & Social Fallback) */}
      {showShareModal && (
        <div
          id="share-civicfix-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowShareModal(false);
          }}
        >
          <div
            id="share-civicfix-modal"
            className="bg-white dark:bg-[#161b26] rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative animate-in zoom-in-95 text-[#121c28] dark:text-gray-100"
          >
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-100 dark:ring-emerald-900">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white leading-tight">
                    Invite to CivicFix
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Open Municipal Public Redressal Portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-share-modal-btn"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                aria-label="Close share dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Invite neighbors, family, and resident welfare associations (RWAs) to use CivicFix. Together we can report road potholes, broken lights, and sanitation hazards directly to municipal authorities with transparent 48-hour SLA tracking — no login needed!
              </p>

              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  type="button"
                  id="modal-native-share-btn"
                  onClick={async () => {
                    const { title, text, url } = getCivicFixShareData();
                    try {
                      await navigator.share({ title, text, url });
                      setShowShareModal(false);
                      soundFX.playSuccess();
                      try {
                        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
                      } catch {}
                    } catch (e: any) {
                      if (e?.name !== 'AbortError') {
                        console.warn('Native share retry failed:', e);
                      }
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open Mobile Native Share Sheet</span>
                </button>
              )}

              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Quick Share Options
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    id="share-whatsapp-btn"
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      'CivicFix — Citizen Municipal Redressal Portal\n\n' +
                        'Report broken roads, potholes, dark streetlights, and sanitation hazards directly to municipal authorities (no login required)!\n\n' +
                        (typeof window !== 'undefined' ? window.location.origin || window.location.href : '')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundFX.playClick()}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    id="share-telegram-btn"
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.origin || window.location.href : ''
                    )}&text=${encodeURIComponent(
                      'Use CivicFix to report potholes, streetlights, and sanitation hazards directly to municipal authorities — no login required!'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundFX.playClick()}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-sky-500" />
                    <span>Telegram</span>
                  </a>

                  <a
                    id="share-twitter-btn"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      'Report potholes, streetlights, and sanitation hazards with live SLA tracking on CivicFix!'
                    )}&url=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.origin || window.location.href : ''
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundFX.playClick()}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    <span>X (Twitter)</span>
                  </a>

                  <a
                    id="share-email-btn"
                    href={`mailto:?subject=${encodeURIComponent(
                      'CivicFix — Open Citizen Municipal Redressal Portal'
                    )}&body=${encodeURIComponent(
                      'Hi,\n\nCheck out CivicFix, our open municipal public grievance and infrastructure tracking portal. Anyone can report broken roads, potholes, dark streetlights, and sanitation hazards directly without signing up!\n\nVisit here: ' +
                        (typeof window !== 'undefined' ? window.location.origin || window.location.href : '')
                    )}`}
                    onClick={() => soundFX.playClick()}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <span>Email RWA</span>
                  </a>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Direct Portal URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== 'undefined' ? window.location.origin || window.location.href : 'https://civicfix.org'
                    }
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    id="copy-share-url-btn"
                    onClick={async () => {
                      const { title, text, url } = getCivicFixShareData();
                      const fullInvite = `${title}\n\n${text}\n\n👉 ${url}`;
                      try {
                        await navigator.clipboard.writeText(fullInvite);
                        setCopiedShareLink(true);
                        soundFX.playSuccess();
                        try {
                          confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
                        } catch {}
                        setTimeout(() => setCopiedShareLink(false), 2500);
                      } catch (err) {
                        console.warn('Copy failed:', err);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-[#0050c8] hover:bg-[#003da1] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    {copiedShareLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Share Toast Notification */}
      {shareToast && (
        <div
          id="civicfix-share-toast"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-gray-900 rounded-2xl p-3.5 shadow-2xl border border-emerald-300 dark:border-emerald-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5"
          role="status"
          aria-live="polite"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">CivicFix Share</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{shareToast.message}</p>
          </div>
          <button
            onClick={() => setShareToast(null)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 cursor-pointer"
            aria-label="Dismiss share notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
