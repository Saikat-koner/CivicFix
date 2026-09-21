import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue } from '../types';
import {
  ArrowLeft,
  MapPin,
  Timer,
  CheckCircle2,
  Clock,
  Wrench,
  Users,
  CheckSquare,
  RefreshCw,
  CalendarCheck,
  Navigation,
  Share2,
  ThumbsUp,
  Award,
  MessageSquare,
  Send,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  Printer,
  Zap,
  AlertTriangle,
  PhoneCall
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IssueDetailModalProps {
  issue: CivicIssue;
  onBack: () => void;
  onNavigate: (issue: CivicIssue) => void;
  onVoteResolution: (issueId: string, vote: 'stillThere' | 'isFixed') => void;
  onOpenEscalate: (issue: CivicIssue, mode: 'reopen' | 'appointment' | 'higher_up') => void;
  onOpenHigherUpsDirectory?: () => void;
  onOpenWorkOrder?: (issue: CivicIssue) => void;
  onUpvote?: (issueId: string) => void;
  onAddComment?: (issueId: string, text: string) => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onBack,
  onNavigate,
  onVoteResolution,
  onOpenEscalate,
  onOpenHigherUpsDirectory,
  onOpenWorkOrder,
  onUpvote,
  onAddComment,
}) => {
  const [voted, setVoted] = useState<'stillThere' | 'isFixed' | null>(
    issue.verificationVotes.userVote || null
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showBeforeAfterSlider, setShowBeforeAfterSlider] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  // 2-Hour Rapid On-Site Survey State (-10 to +45 pts)
  const [showRapidSurveyModal, setShowRapidSurveyModal] = useState(false);
  const [hazardPoints, setHazardPoints] = useState<number>(0);
  const [blockagePoints, setBlockagePoints] = useState<number>(0);
  const [proximityPoints, setProximityPoints] = useState<number>(0);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [groundModifier, setGroundModifier] = useState<number>(issue.groundModifier || 0);

  const baseScore = issue.severityScore || (issue.severity === 'High' ? 82.5 : issue.severity === 'Medium' ? 62.0 : 42.0);
  const currentScore = Math.min(100, Math.max(0, baseScore + groundModifier));
  const currentSeverityLevel = currentScore >= 80 ? 'S5' : currentScore >= 65 ? 'S4' : currentScore >= 50 ? 'S3' : currentScore >= 35 ? 'S2' : 'S1';
  const slaHours = currentSeverityLevel === 'S5' ? 4 : currentSeverityLevel === 'S4' ? 12 : currentSeverityLevel === 'S3' ? 48 : currentSeverityLevel === 'S2' ? 168 : 336;

  const handleWhatsAppMobilize = () => {
    const slaStr = slaHours < 24 ? `${slaHours}h` : `${Math.round(slaHours / 24)}d`;
    const text = `🚨 *URGENT HAZARD ALERT:* ${issue.category} reported at ${issue.address}!\n• Calculated Severity: *${currentSeverityLevel}* (Score: ${currentScore.toFixed(1)}/100)\n• Statutory SLA: *${slaStr}*\n• Status: ${issue.status.toUpperCase()}\n\nVerify & upvote on CivicFix Official Citizen Portal:\n${window.location.origin}/#issue-${issue.code}`;
    
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // safe fallback
    }

    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAuditSubmit = () => {
    const totalMod = Math.min(45, Math.max(-10, hazardPoints + blockagePoints + proximityPoints));
    setGroundModifier(totalMod);
    setSurveySubmitted(true);
    setShowRapidSurveyModal(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0050c8', '#10B981', '#FFD700'],
    });
  };

  const handleVote = (vote: 'stillThere' | 'isFixed') => {
    setVoted(vote);
    onVoteResolution(issue.id, vote);

    if (vote === 'isFixed') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#1d68f2', '#f88400'],
      });
    }
  };

  const handleShare = () => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
    } catch {
      // Ignore clipboard restrictions in iframe
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !onAddComment) return;
    onAddComment(issue.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div
      id="issue-detail-page-container"
      className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 pb-28 space-y-8 animate-in fade-in duration-200"
    >
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="detail-back-button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[#424655] hover:text-[#0050c8] font-semibold text-sm transition-colors group cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#c2c6d7] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Activity</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenWorkOrder && (
            <button
              id="detail-work-order-button"
              onClick={() => onOpenWorkOrder(issue)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border bg-white hover:bg-gray-50 text-[#121c28] border-[#c2c6d7] shadow-sm cursor-pointer"
              title="Generate Official Municipal Work Order & Printable QR Flyer"
            >
              <Printer className="w-4 h-4 text-[#0050c8]" />
              <span className="hidden sm:inline">Print Work Order & QR Flyer</span>
              <span className="sm:hidden">Print / QR</span>
            </button>
          )}

          {onUpvote && (
            <button
              id="detail-upvote-button"
              onClick={() => onUpvote(issue.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                issue.hasUpvoted
                  ? 'bg-[#EDF4FF] text-[#0050c8] border-[#1d68f2]'
                  : 'bg-white text-[#424655] border-[#c2c6d7] hover:bg-gray-50'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${issue.hasUpvoted ? 'fill-[#0050c8]' : ''}`} />
              <span>{issue.upvotes} Upvotes</span>
            </button>
          )}

          <button
            id="detail-whatsapp-mobilize-button"
            onClick={handleWhatsAppMobilize}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm cursor-pointer"
            title="Mobilize Ward Neighbors via WhatsApp"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{copiedWhatsApp ? 'Alert Copied!' : 'Mobilize WhatsApp'}</span>
          </button>

          <button
            id="detail-share-button"
            onClick={handleShare}
            className="p-2 rounded-lg bg-white text-[#424655] hover:text-[#0050c8] border border-[#c2c6d7] shadow-sm text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Share Issue Link"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Hero Section (Bento Layout: Image on left, Details on right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Image Card with Before/After inspection toggle */}
        <article className="lg:col-span-7 bg-white border border-[#c2c6d7] rounded-2xl overflow-hidden shadow-sm relative group h-[280px] sm:h-[360px] md:h-[400px]">
          {showBeforeAfterSlider && issue.repairedImageUrl ? (
            /* Interactive Before/After Split Slider */
            <div className="relative w-full h-full select-none overflow-hidden">
              <img
                src={issue.repairedImageUrl}
                alt="Repaired"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={issue.imageUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Slider Grabber Line */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />

              <div className="absolute top-4 left-4 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md">
                Original (Left) vs Repaired (Right)
              </div>
            </div>
          ) : (
            <img
              src={issue.repairedImageUrl || issue.imageUrl}
              alt={issue.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Toggle Before/After if available */}
          {issue.repairedImageUrl && (
            <button
              onClick={() => setShowBeforeAfterSlider(!showBeforeAfterSlider)}
              className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-white text-[#121c28] text-xs font-bold px-3 py-1.5 rounded-xl shadow-md border border-[#c2c6d7] flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0050c8]" />
              <span>{showBeforeAfterSlider ? 'Standard View' : 'Before/After Slider'}</span>
            </button>
          )}

          {/* Status Badge Overlay */}
          <div className="absolute top-4 right-4 z-10">
            {issue.status === 'fixed' ? (
              <div className="bg-[#10B981] text-white font-bold text-xs md:text-sm px-4 py-1.5 rounded-full shadow-md border border-[#10B981] flex items-center gap-1.5 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4" />
                Fixed & Verified
              </div>
            ) : issue.status === 'investigating' ? (
              <div className="bg-[#f88400] text-white font-bold text-xs md:text-sm px-4 py-1.5 rounded-full shadow-md border border-[#f88400] flex items-center gap-1.5 backdrop-blur-sm">
                <Clock className="w-4 h-4 animate-spin" />
                Investigating
              </div>
            ) : (
              <div className="bg-[#1d68f2] text-white font-bold text-xs md:text-sm px-4 py-1.5 rounded-full shadow-md border border-[#1d68f2] flex items-center gap-1.5 backdrop-blur-sm">
                <MapPin className="w-4 h-4" />
                Open Report
              </div>
            )}
          </div>

          {/* Navigation Overlay Button */}
          <button
            id="detail-start-navigation-btn"
            onClick={() => onNavigate(issue)}
            className="absolute bottom-4 right-4 z-10 bg-white/95 hover:bg-white text-[#0050c8] font-bold text-xs md:text-sm px-4 py-2 rounded-xl shadow-lg border border-[#dae2ff] flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <Navigation className="w-4 h-4 text-[#1d68f2]" />
            <span>Turn-by-Turn GPS Navigation</span>
          </button>
        </article>

        {/* Details Card */}
        <article className="lg:col-span-5 bg-white border border-[#c2c6d7] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#121c28] tracking-tight leading-tight">
              {issue.title}
            </h1>

            <div className="flex items-start gap-2.5 text-[#424655]">
              <MapPin className="w-5 h-5 text-[#0050c8] flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-[#121c28]">{issue.address}</span>
                <br />
                <span className="text-xs text-[#737686]">Reported via Verified GPS Geo-Location</span>
              </p>
            </div>

            <p className="text-sm text-[#424655] leading-relaxed pt-2">
              {issue.description}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider mb-1">Issue ID</p>
                <p className="text-sm font-extrabold text-[#121c28] font-mono">{issue.code}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider mb-1">Category</p>
                <div className="inline-flex items-center gap-1.5 bg-[#EDF4FF] text-[#0050c8] px-3 py-1 rounded-full border border-[#dae2ff]">
                  <span className="text-xs font-bold">{issue.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* S1-S5 Statutory Severity & 5-Variable Engine Banner */}
          <div className="mt-4 p-4 rounded-xl border border-orange-200 bg-gradient-to-br from-amber-50/80 to-orange-50/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-gray-900">5-Variable Deterministic Severity</span>
              </div>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full text-white shadow-xs ${
                currentSeverityLevel === 'S5' ? 'bg-red-600 animate-pulse' :
                currentSeverityLevel === 'S4' ? 'bg-orange-600' :
                currentSeverityLevel === 'S3' ? 'bg-amber-600' :
                currentSeverityLevel === 'S2' ? 'bg-indigo-600' : 'bg-teal-600'
              }`}>
                {currentSeverityLevel} • {currentSeverityLevel === 'S5' ? 'Critical Emergency' : currentSeverityLevel === 'S4' ? 'Severe Disruption' : currentSeverityLevel === 'S3' ? 'Moderate Impact' : currentSeverityLevel === 'S2' ? 'Standard Redressal' : 'Minor'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-gray-700">
              <div>
                Score: <strong className="text-sm font-black text-gray-900">{currentScore.toFixed(1)} / 100</strong>
                {groundModifier !== 0 && (
                  <span className="ml-1.5 text-[11px] font-bold text-blue-700">
                    ({groundModifier > 0 ? `+${groundModifier}` : groundModifier} Ground Mod)
                  </span>
                )}
              </div>
              <div className="font-semibold text-gray-800">
                Statutory SLA: <strong className="text-orange-700">{slaHours < 24 ? `${slaHours} Hours` : `${Math.round(slaHours / 24)} Days`}</strong>
              </div>
            </div>
          </div>

          {/* 2-Hour Rapid On-Site Survey Framework Banner */}
          <div className="mt-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">2-Hour Rapid On-Site Survey</span>
                  <span className="text-[10px] font-mono font-bold bg-blue-200/80 text-blue-800 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="text-[11px] text-gray-600">
                  {surveySubmitted ? '✅ Ground audit submitted! +50 XP Awarded.' : 'On-ground? Audit hazard to calibrate SLA priority.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              id="detail-rapid-survey-audit-btn"
              onClick={() => setShowRapidSurveyModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0050c8] hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{surveySubmitted ? 'Re-Audit' : 'Audit (+50 XP)'}</span>
            </button>
          </div>

          {/* Time Elapsed Highlight */}
          <div className="mt-4 bg-[#EDF4FF] rounded-xl p-4 flex items-center justify-between border border-[#dae2ff] shadow-inner">
            <div className="flex items-center gap-2.5">
              <Timer className="w-6 h-6 text-[#1d68f2]" />
              <span className="text-sm font-bold text-[#121c28]">Time Elapsed</span>
            </div>
            <span className="text-2xl font-extrabold text-[#0050c8] tracking-tight">{issue.timeElapsed}</span>
          </div>

          {/* Community Endorsement & Direct Upvote Button */}
          <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#121c28]">
                <ThumbsUp className="w-4 h-4 text-[#0050c8]" />
                <span>Community Verification & Impact</span>
              </div>
              <p className="text-xs text-[#56596e] mt-0.5">
                {issue.upvotes} {issue.upvotes === 1 ? 'citizen has' : 'citizens have'} upvoted and verified this issue.
              </p>
            </div>
            {onUpvote && (
              <button
                type="button"
                id="modal-body-upvote-button"
                onClick={() => onUpvote(issue.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  issue.hasUpvoted
                    ? 'bg-[#0050c8] text-white ring-2 ring-blue-300'
                    : 'bg-white text-[#0050c8] border border-[#1d68f2] hover:bg-blue-50'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${issue.hasUpvoted ? 'fill-white' : ''}`} />
                <span>{issue.hasUpvoted ? `Upvoted (▲ ${issue.upvotes})` : 'Upvote (+10 CC)'}</span>
              </button>
            )}
          </div>
        </article>
      </section>

      {/* Resolution Progress Timeline & Community Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resolution Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#c2c6d7] rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#121c28] tracking-tight">Resolution Progress</h2>
            <span className="text-xs font-semibold text-[#0050c8] bg-[#EDF4FF] px-2.5 py-1 rounded-full border border-[#dae2ff]">
              City Works Tracking
            </span>
          </div>

          <div className="relative pl-3">
            {/* Timeline Vertical Background Track */}
            <div className="absolute left-[29px] top-5 bottom-5 w-0.5 bg-gray-200/90 rounded-full" />

            {/* Timeline Vertical Animated Progress Line with smooth growth */}
            <motion.div
              className="absolute left-[29px] top-5 bottom-5 w-0.5 origin-top bg-gradient-to-b from-[#1d68f2] via-[#0050c8] to-[#10B981] rounded-full shadow-xs"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Dynamic Pulsing Energy Wave running along vertical line */}
            <motion.div
              className="absolute left-[28px] top-5 w-1 h-8 bg-[#1d68f2] rounded-full blur-[1px] opacity-75 pointer-events-none"
              animate={{
                y: [0, 180, 0],
                opacity: [0.2, 0.85, 0.2],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
              }}
            />

            <div className="space-y-8 relative">
              <AnimatePresence initial={false}>
                {issue.timeline.map((step, idx) => {
                  const isStepFixed =
                    step.title.toLowerCase().includes('fixed') ||
                    step.title.toLowerCase().includes('resolved');

                  return (
                    <motion.div
                      key={step.id}
                      layout
                      initial={{ opacity: 0, x: -24, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 24,
                        delay: idx * 0.08,
                      }}
                      className="relative flex items-start gap-4 group"
                    >
                      {/* Node Indicator with Glow & Pulse Animations */}
                      <div className="relative flex-shrink-0">
                        {/* Looping Radar Pulse for Active / Current Step */}
                        {step.isCurrent && (
                          <>
                            <motion.div
                              className="absolute -inset-2 rounded-full bg-[#1d68f2]/30 pointer-events-none"
                              animate={{
                                scale: [1, 1.55, 1],
                                opacity: [0.8, 0, 0.8],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 2.2,
                                ease: 'easeInOut',
                              }}
                            />
                            <motion.div
                              className="absolute -inset-1 rounded-full bg-[#ffdcc4] pointer-events-none"
                              animate={{
                                scale: [1, 1.25, 1],
                                opacity: [0.9, 0.3, 0.9],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.8,
                                ease: 'easeInOut',
                                delay: 0.4,
                              }}
                            />
                          </>
                        )}

                        {/* Looping Beacon for Fixed / Resolved Step */}
                        {isStepFixed && (
                          <motion.div
                            className="absolute -inset-1.5 rounded-full bg-[#10B981]/25 pointer-events-none"
                            animate={{
                              scale: [1, 1.35, 1],
                              opacity: [0.7, 0.1, 0.7],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 2.6,
                              ease: 'easeInOut',
                            }}
                          />
                        )}

                        {/* Core Node Icon Circle */}
                        <motion.div
                          initial={{ scale: 0.4, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 420,
                            damping: 18,
                            delay: idx * 0.08 + 0.05,
                          }}
                          whileHover={{ scale: 1.12 }}
                          className={`z-10 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm transition-colors ${
                            isStepFixed
                              ? 'bg-[#10B981] text-white shadow-[#10B981]/20'
                              : step.completed
                              ? 'bg-[#1d68f2] text-white shadow-[#1d68f2]/20'
                              : 'bg-gray-100 text-gray-400 border border-gray-300'
                          }`}
                        >
                          {isStepFixed ? (
                            <Wrench className="w-5 h-5" />
                          ) : step.completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </motion.div>
                      </div>

                      {/* Step Info Content Card */}
                      <motion.div
                        className="pt-0.5 flex-1"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.08 + 0.1 }}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm md:text-base font-bold ${
                              isStepFixed ? 'text-[#10B981]' : 'text-[#121c28]'
                            }`}
                          >
                            {step.title}
                          </h3>
                          {step.isCurrent && (
                            <motion.span
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="px-2.5 py-0.5 text-[10px] font-extrabold bg-[#ffdcc4] text-[#924c00] rounded-full uppercase tracking-wide border border-[#ffb787]/40 shadow-2xs"
                            >
                              Active Step
                            </motion.span>
                          )}
                          {isStepFixed && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#dcfce7] text-[#15803d] rounded-full uppercase tracking-wide border border-[#86efac]">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-[#424655] mt-0.5 font-medium">
                          {step.timestamp} • <span className="text-[#737686]">{step.actor}</span>
                        </p>
                        {step.description && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.08 + 0.15 }}
                            className="text-xs text-[#56596e] mt-1.5 bg-[#f8f9ff] p-2.5 rounded-xl border border-[#c2c6d7]/50 leading-relaxed"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Community & Verification Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Merged Reports Card */}
          <div className="bg-white border border-[#c2c6d7] rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EDF4FF] text-[#0050c8] flex items-center justify-center flex-shrink-0 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#121c28] mb-1">Merged Reports</h3>
              <p className="text-xs text-[#424655] leading-relaxed">
                {issue.mergedReportsCount} other citizens reported this same hazard. Duplicate reports were combined to prioritize dispatch.
              </p>
            </div>
          </div>

          {/* Verify Resolution Poll */}
          <div
            id="resolution-verification-card"
            className="bg-white border border-[#c2c6d7] rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 text-[#0050c8]">
              <CheckSquare className="w-5 h-5 text-[#1d68f2]" />
              <h3 className="text-sm font-bold text-[#121c28]">Community Ground Check</h3>
            </div>
            <p className="text-xs text-[#424655]">
              Is the problem still there? Help the community confirm municipal work accuracy and earn +10 Civic Credits.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="vote-still-there-btn"
                onClick={() => handleVote('stillThere')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  voted === 'stillThere'
                    ? 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a] shadow-sm'
                    : 'border-[#c2c6d7] text-[#424655] hover:bg-[#ffdad6]/40 hover:text-[#93000a]'
                }`}
              >
                Still There ({issue.verificationVotes.stillThere + (voted === 'stillThere' ? 1 : 0)})
              </button>
              <button
                id="vote-is-fixed-btn"
                onClick={() => handleVote('isFixed')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  voted === 'isFixed'
                    ? 'bg-[#10B981] text-white border-[#10B981] shadow-sm'
                    : 'bg-[#dfe9fa] border-transparent text-[#0050c8] hover:bg-[#10B981] hover:text-white'
                }`}
              >
                Confirmed Fixed ({issue.verificationVotes.isFixed + (voted === 'isFixed' ? 1 : 0)})
              </button>
            </div>

            {voted && (
              <div className="bg-[#EDF4FF] p-2 rounded-lg text-center text-[11px] text-[#0050c8] font-semibold flex items-center justify-center gap-1 animate-in fade-in">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>+10 Civic Credits awarded for your verification vote!</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Citizen & Municipal Comments Discussion Thread */}
      <section className="bg-white border border-[#c2c6d7] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0050c8]" />
            <h2 className="text-xl font-bold text-[#121c28] tracking-tight">
              Community Discussion & Dispatch Logs ({issue.comments?.length || 0})
            </h2>
          </div>
          <span className="text-xs text-[#737686]">Public Record</span>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {issue.comments && issue.comments.length > 0 ? (
            issue.comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-xl border transition-all ${
                  comment.isOfficial
                    ? 'bg-[#EDF4FF]/70 border-[#dae2ff]'
                    : 'bg-[#f8f9ff] border-[#c2c6d7]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-7 h-7 rounded-full object-cover border border-[#c2c6d7]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#121c28]">
                          {comment.author}
                        </span>
                        {comment.isOfficial && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-[#0050c8] text-white rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            Official City Dispatch
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#737686]">{comment.timestamp}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#424655] leading-relaxed pl-9">
                  {comment.text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#737686] text-center py-4">
              No comments yet. Be the first to share an update on this location!
            </p>
          )}
        </div>

        {/* Add Comment Input Form */}
        <form onSubmit={handleCommentSubmit} className="pt-2 flex items-center gap-3">
          <input
            id="issue-new-comment-input"
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add citizen observation or update..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#c2c6d7] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1d68f2] transition-all"
          />
          <button
            id="issue-submit-comment-btn"
            type="submit"
            disabled={!newCommentText.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </form>
      </section>

      {/* Escalation Action Area (matching dark aesthetic in screenshots with higher-up escalation) */}
      <section className="bg-[#121c28] text-white rounded-2xl p-6 md:p-8 shadow-xl space-y-4 relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#0050c8] rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none" />

        {/* Active Escalation Notice if applicable */}
        {issue.escalationStatus === 'escalated_to_higher_up' && (
          <div className="relative z-10 bg-[#ea580c]/20 border border-[#ea580c]/50 p-3.5 rounded-xl flex items-center justify-between text-xs text-[#ffdcc4]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffdcc4]" />
              <span>
                <strong>Higher-Up Redressal Underway:</strong> This case is directly being audited by the Municipal Commissioner's Office.
              </span>
            </div>
            {onOpenHigherUpsDirectory && (
              <button
                onClick={onOpenHigherUpsDirectory}
                className="underline hover:text-white font-bold cursor-pointer text-[11px]"
              >
                Track Ombudsman Log
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f88400]/20 text-[#ffdcc4] text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Citizen Redressal & Oversight</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Not satisfied with the solution or problem unsolved?
            </h2>
            <p className="text-xs md:text-sm text-gray-300 max-w-xl">
              If repairs are inadequate, delayed, or poorly executed, you have the statutory right to contact Higher-Ups (Municipal Commissioner, Ward Councilor) or schedule an official hearing.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 w-full md:w-auto">
            <button
              id="detail-reopen-issue-btn"
              onClick={() => onOpenEscalate(issue, 'reopen')}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-gray-600 text-white font-bold text-xs hover:bg-white/10 hover:border-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reopen Case</span>
            </button>

            <button
              id="detail-higher-up-btn"
              onClick={() => onOpenEscalate(issue, 'higher_up')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#f88400] hover:bg-[#ea580c] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Contact Higher-Up</span>
            </button>

            <button
              id="detail-book-appointment-btn"
              onClick={() => onOpenEscalate(issue, 'appointment')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2-Hour Rapid On-Site Survey Ground-Truth Audit Modal */}
      {showRapidSurveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">2-Hour Rapid Ground-Truth Audit</h3>
                  <p className="text-xs text-gray-500">Recalibrate severity and verify hazard proximity</p>
                </div>
              </div>
              <button
                onClick={() => setShowRapidSurveyModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold px-2 py-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Ground Truth Variables */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-800 block mb-1.5">
                  1. Observed Hazard Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Minimal (-10 pts)', pts: -10 },
                    { label: 'Moderate (+0 pts)', pts: 0 },
                    { label: 'High (+10 pts)', pts: 10 },
                    { label: 'Lethal/Critical (+20 pts)', pts: 20 },
                  ].map((h) => (
                    <button
                      key={h.pts}
                      type="button"
                      onClick={() => setHazardPoints(h.pts)}
                      className={`p-2 rounded-lg border text-left font-medium transition-all ${
                        hazardPoints === h.pts
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1.5">
                  2. Road Blockage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'None (+0 pts)', pts: 0 },
                    { label: 'Partial (+5 pts)', pts: 5 },
                    { label: 'Full Closure (+15 pts)', pts: 15 },
                  ].map((b) => (
                    <button
                      key={b.pts}
                      type="button"
                      onClick={() => setBlockagePoints(b.pts)}
                      className={`p-2 rounded-lg border text-left font-medium transition-all ${
                        blockagePoints === b.pts
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1.5">
                  3. Sensitive Proximity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Normal Corridor (+0 pts)', pts: 0 },
                    { label: 'School / Hospital / Vulnerable (+10 pts)', pts: 10 },
                  ].map((p) => (
                    <button
                      key={p.pts}
                      type="button"
                      onClick={() => setProximityPoints(p.pts)}
                      className={`p-2 rounded-lg border text-left font-medium transition-all ${
                        proximityPoints === p.pts
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Modifier Preview */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-gray-700">Calculated Ground Modifier:</span>
                <span className="text-sm font-black text-blue-700">
                  {Math.min(45, Math.max(-10, hazardPoints + blockagePoints + proximityPoints)) >= 0
                    ? `+${Math.min(45, Math.max(-10, hazardPoints + blockagePoints + proximityPoints))}`
                    : Math.min(45, Math.max(-10, hazardPoints + blockagePoints + proximityPoints))} pts
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowRapidSurveyModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="submit-rapid-audit-btn"
                onClick={handleAuditSubmit}
                className="px-5 py-2 rounded-xl bg-[#0050c8] hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit Ground-Truth Audit (+50 XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
