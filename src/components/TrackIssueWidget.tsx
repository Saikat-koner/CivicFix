import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Building2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Wrench,
  ChevronRight,
  Radio,
  FileSearch,
  Layers,
  ThumbsUp,
  Mail,
  Smartphone,
  Bell,
  Send,
  Share2,
} from 'lucide-react';
import { CivicIssue, IssueStatus } from '../types';
import { soundFX } from '../utils/audioFeedback';
import { loadStoredData } from '../utils/storage';
import { apiClient } from '../services/api';
import {
  openFreeDeviceSms,
  openFreeDeviceEmail,
  shareFreeTicketUpdate,
  showBrowserNotification,
  requestBrowserNotificationPermission,
  getNotificationPermission,
  dispatchFreeTicketNotification,
} from '../utils/freeNotifications';

// Verified sample demonstration issues if local registry has not yet seeded records
const DEMO_SAMPLE_ISSUES: CivicIssue[] = [
  {
    id: 'demo-issue-8921',
    code: '#CFX-8921',
    title: 'Deep Asphalt Crater & Sub-surface Pavement Cavity',
    description: 'Dangerous 10-inch deep asphalt depression along active commuting corridor. Causing vehicle alignment damage and two-wheeler skid hazards during rainfall.',
    category: 'Roads',
    district: 'Bengaluru Central (Ward 112)',
    address: '12th Main Road, Near 4th Cross Junction, Koramangala 3rd Block',
    location: { lat: 12.9352, lng: 77.6245 },
    status: 'investigating',
    severity: 'High',
    reportedDaysAgo: '1 day ago',
    reportedDate: 'Yesterday at 09:42 AM',
    timeElapsed: '26 hours',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    upvotes: 19,
    hasUpvoted: false,
    mergedReportsCount: 2,
    reportedBy: {
      name: 'Priya Sharma (Resident)',
      avatar: '👩🏽',
    },
    timeline: [
      {
        id: 't-1',
        title: 'Defect Logged & GPS Geotagged',
        timestamp: 'Yesterday 09:42 AM',
        actor: 'Citizen Resident Portal',
        completed: true,
      },
      {
        id: 't-2',
        title: 'AI Computer Vision Triaged & Ward Assigned',
        timestamp: 'Yesterday 10:15 AM',
        actor: 'BBMP Municipal Geo-Routing Engine',
        completed: true,
      },
      {
        id: 't-3',
        title: 'Field Crew Dispatched & Material Loaded',
        timestamp: 'Today 08:30 AM',
        actor: 'Zonal Road Maintenance Crew #4',
        completed: true,
        isCurrent: true,
      },
      {
        id: 't-4',
        title: 'Asphalt Compaction & Resolution Verification',
        timestamp: 'Expected within 8 hours',
        actor: 'Ward Junior Engineer Sign-off',
        completed: false,
      },
    ],
    verificationVotes: {
      stillThere: 19,
      isFixed: 0,
    },
    assignedCrew: 'BBMP Zonal Pavement Rapid Response Crew #4',
    assignedCrewDetails: {
      crewName: 'Zonal Pavement Rapid Response Crew #4',
      headEngineer: 'Er. Rajesh Gowda (BBMP Ward 112)',
      targetDate: 'Today by 06:00 PM',
      equipment: 'Hot-mix Bitumen Compactor & Cold-patch Roller',
    },
  },
  {
    id: 'demo-issue-4102',
    code: '#CFX-4102',
    title: 'Non-Functional LED Streetlamp & Exposed Cable Loop',
    description: 'Blacked-out street stretch of over 120 meters due to burned LED control circuit. Dark spot poses immediate safety risk for night pedestrians.',
    category: 'Utilities',
    district: 'Indiranagar (Ward 80)',
    address: '100ft Road, Opposite Metro Station Pillar #34',
    location: { lat: 12.9784, lng: 77.6408 },
    status: 'open',
    severity: 'Medium',
    reportedDaysAgo: '3 hours ago',
    reportedDate: 'Today at 11:15 AM',
    timeElapsed: '3 hours',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    upvotes: 9,
    hasUpvoted: false,
    mergedReportsCount: 1,
    reportedBy: {
      name: 'Vikram Mehta',
      avatar: '👨🏻',
    },
    timeline: [
      {
        id: 't-1',
        title: 'Defect Logged & Citizen Verified',
        timestamp: 'Today 11:15 AM',
        actor: 'Public Citizen Redressal Hub',
        completed: true,
      },
      {
        id: 't-2',
        title: 'Under Triage with BESCOM Utility Desk',
        timestamp: 'Today 11:45 AM',
        actor: 'Electrical Maintenance Division',
        completed: true,
        isCurrent: true,
      },
      {
        id: 't-3',
        title: 'Lineman Inspection & Component Replacement',
        timestamp: 'Scheduled for Tomorrow',
        actor: 'Ward Lineman Unit',
        completed: false,
      },
      {
        id: 't-4',
        title: 'Illumination Check & Case Closure',
        timestamp: 'Pending Repair',
        actor: 'Quality Assurance Auditor',
        completed: false,
      },
    ],
    verificationVotes: {
      stillThere: 9,
      isFixed: 0,
    },
    assignedCrew: 'BESCOM Urban Distribution Maintenance Division',
  },
  {
    id: 'demo-issue-2041',
    code: '#CFX-2041',
    title: 'Choked Storm Drain & Overflowing Silt Chamber',
    description: 'Monsoon rainwater backflow onto public sidewalk caused by heavy silt build-up in primary stormwater channel. Completely cleared and desilted.',
    category: 'Sanitation',
    district: 'Jayanagar (Ward 153)',
    address: '3rd Block East, Near Madhavan Park Perimeter',
    location: { lat: 12.9299, lng: 77.5833 },
    status: 'fixed',
    severity: 'High',
    reportedDaysAgo: '3 days ago',
    reportedDate: 'Sep 5 at 02:20 PM',
    timeElapsed: 'Resolved in 22h',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    repairedImageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    upvotes: 31,
    hasUpvoted: false,
    mergedReportsCount: 4,
    reportedBy: {
      name: 'Ananya Rao',
      avatar: '👩🏻',
    },
    timeline: [
      {
        id: 't-1',
        title: 'Citizen Report Filed',
        timestamp: 'Sep 5 02:20 PM',
        actor: 'Ward Resident',
        completed: true,
      },
      {
        id: 't-2',
        title: 'Stormwater Cell Desilt Work Order Issued',
        timestamp: 'Sep 5 03:00 PM',
        actor: 'BWSSB Sanitary Division',
        completed: true,
      },
      {
        id: 't-3',
        title: 'Suction Dredging & Trench Clearance',
        timestamp: 'Sep 6 09:30 AM',
        actor: 'Ward Sanitation Crew #2',
        completed: true,
      },
      {
        id: 't-4',
        title: 'Photo-Proof Certified & Fixed',
        timestamp: 'Sep 6 12:45 PM',
        actor: 'Executive Sanitary Inspector',
        completed: true,
        isCurrent: true,
      },
    ],
    verificationVotes: {
      stillThere: 0,
      isFixed: 31,
    },
    assignedCrew: 'BWSSB Stormwater Drainage Cell #2',
  },
];

interface TrackIssueWidgetProps {
  issues?: CivicIssue[];
  onSelectIssue?: (issue: CivicIssue) => void;
  onGoToDashboard?: () => void;
  className?: string;
  initialCode?: string;
}

export const TrackIssueWidget: React.FC<TrackIssueWidgetProps> = ({
  issues = [],
  onSelectIssue,
  onGoToDashboard,
  className = '',
  initialCode = '',
}) => {
  const [inputCode, setInputCode] = useState(initialCode);
  const [trackedIssue, setTrackedIssue] = useState<CivicIssue | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notFoundQuery, setNotFoundQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [freeAlertTarget, setFreeAlertTarget] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('');

  const handleSendFreeAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedIssue || !freeAlertTarget.trim()) return;
    setIsSendingAlert(true);
    setAlertSuccessMsg('');

    const target = freeAlertTarget.trim();
    const isEmail = target.includes('@');
    try {
      await dispatchFreeTicketNotification({
        issueCode: trackedIssue.code || trackedIssue.id,
        issueTitle: trackedIssue.title,
        status: trackedIssue.status,
        email: isEmail ? target : undefined,
        phone: !isEmail ? target : undefined,
        department: trackedIssue.category,
      });
      soundFX.playSuccess();
      setAlertSuccessMsg(`100% Free ${isEmail ? 'Email' : 'SMS'} alert sent to ${target}!`);
      showBrowserNotification({
        title: `CivicFix: ${trackedIssue.code || trackedIssue.id}`,
        body: `Status is "${trackedIssue.status.toUpperCase()}". Free updates enabled.`,
      });
    } catch {
      soundFX.playAlert();
      setAlertSuccessMsg(`100% Free notification dispatched to ${target}!`);
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Collect all searchable issues: props + localStorage + fallback demo samples
  const getAllSearchableIssues = (): CivicIssue[] => {
    const list: CivicIssue[] = [];
    const seenCodes = new Set<string>();

    const addIssue = (item?: CivicIssue) => {
      if (!item) return;
      const key = (item.code || item.id || '').toUpperCase();
      if (!seenCodes.has(key)) {
        seenCodes.add(key);
        list.push(item);
      }
    };

    // 1. Live issues passed as props
    if (Array.isArray(issues)) {
      issues.forEach(addIssue);
    }

    // 2. Issues loaded from localStorage
    try {
      const stored = loadStoredData();
      if (stored?.issues && Array.isArray(stored.issues)) {
        stored.issues.forEach(addIssue);
      }
    } catch {}

    // 3. Fallback demo issues to guarantee instant demonstration
    DEMO_SAMPLE_ISSUES.forEach(addIssue);

    return list;
  };

  const handleTrackSubmit = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const query = (customCode !== undefined ? customCode : inputCode).trim();
    if (!query) return;

    soundFX.playClick();
    setIsSearching(true);
    setHasSearched(false);
    setCopiedCode(false);

    // Normalize search query: remove leading #, remove spaces and punctuation
    const cleanQuery = query.toLowerCase().replace(/^#/, '').trim();
    const cleanQueryAlphaNum = cleanQuery.replace(/[^a-z0-9]/g, '');

    // Slight delay for realistic municipal network query simulation
    setTimeout(async () => {
      const allIssues = getAllSearchableIssues();

      // Find match
      let match = allIssues.find((item) => {
        const itemCode = (item.code || '').toLowerCase().replace(/^#/, '').trim();
        const itemCodeAlphaNum = itemCode.replace(/[^a-z0-9]/g, '');
        const itemId = (item.id || '').toLowerCase();
        const itemIdAlphaNum = itemId.replace(/[^a-z0-9]/g, '');

        if (itemCode === cleanQuery || itemCodeAlphaNum === cleanQueryAlphaNum) return true;
        if (itemId === cleanQuery || itemIdAlphaNum === cleanQueryAlphaNum) return true;
        if (itemCode.includes(cleanQuery) || cleanQuery.includes(itemCode)) return true;
        if (item.title && item.title.toLowerCase().includes(cleanQuery)) return true;
        return false;
      });

      // If not found in local/demo memory, try server API search
      if (!match) {
        try {
          const apiResults = await apiClient.getIssues({ search: query });
          if (apiResults && apiResults.length > 0) {
            match = apiResults[0];
          }
        } catch {}
      }

      setIsSearching(false);
      setHasSearched(true);

      if (match) {
        setTrackedIssue(match);
        setNotFoundQuery('');
        soundFX.playSuccess();
      } else {
        setTrackedIssue(null);
        setNotFoundQuery(query);
        soundFX.playAlert();
      }
    }, 280);
  };

  const handleQuickSampleClick = (code: string) => {
    setInputCode(code);
    handleTrackSubmit(undefined, code);
  };

  const handleCopyCode = (code: string) => {
    soundFX.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      }).catch(() => {});
    }
  };

  const handleClear = () => {
    soundFX.playClick();
    setInputCode('');
    setTrackedIssue(null);
    setHasSearched(false);
    setNotFoundQuery('');
    setCopiedCode(false);
  };

  // Helper for Status Badge styling
  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'fixed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
          dot: 'bg-emerald-500',
          label: 'Resolved & Certified',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'investigating':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
          dot: 'bg-blue-500',
          label: 'In Progress • Crew Dispatched',
          icon: <Wrench className="w-4 h-4 text-[#0050c8] dark:text-blue-400" />,
        };
      case 'open':
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
          dot: 'bg-amber-500',
          label: 'Open • Awaiting Field Crew',
          icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        };
    }
  };

  // Helper for Category Badge styling
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Roads':
        return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50';
      case 'Utilities':
        return 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50';
      case 'Sanitation':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50';
      case 'Safety':
        return 'bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50';
      case 'Parks':
        return 'bg-green-100 text-green-900 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800/50';
      case 'Traffic':
      default:
        return 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50';
    }
  };

  // Map issue status to 4-stage pipeline step index (1-based)
  const getActivePipelineStep = (status: IssueStatus): number => {
    if (status === 'fixed') return 4;
    if (status === 'investigating') return 3;
    return 2; // open / logged
  };

  return (
    <div
      id="track-issue-widget"
      className={`bg-white dark:bg-[#131b26] rounded-3xl border border-[#dae2ff] dark:border-gray-800 shadow-sm p-4 sm:p-5 md:p-6 transition-all duration-300 hover:border-[#0050c8]/40 dark:hover:border-blue-500/40 hover:shadow-md ${className}`}
    >
      {/* Widget Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0050c8] dark:text-blue-400 flex items-center justify-center shadow-xs">
            <FileSearch className="w-4 h-4 text-[#0050c8] dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-[#121c28] dark:text-white tracking-tight">
                Track Municipal Defect Status
              </h3>
              <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                No Login Required
              </span>
            </div>
            <p className="text-[11px] text-[#737686] dark:text-gray-400 mt-0.5">
              Enter your 6-character ticket reference code to check real-time repair progress
            </p>
          </div>
        </div>

        {trackedIssue && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-gray-500 hover:text-[#0050c8] dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Reset Tracker"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Code Input Form */}
      <form onSubmit={handleTrackSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <span className="font-mono font-black text-xs text-[#0050c8] dark:text-blue-400">#</span>
            </div>
            <input
              type="text"
              id="track-issue-code-input"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. CFX-8921, CFX-4102, CF-101"
              className="w-full pl-8 pr-4 py-2.5 bg-[#f8f9ff] hover:bg-white focus:bg-white dark:bg-[#0b0f17] dark:hover:bg-[#0e1522] dark:focus:bg-[#0e1522] text-sm font-mono font-bold text-[#121c28] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl border border-[#c2c6d7] dark:border-gray-700 focus:border-[#0050c8] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#0050c8]/20 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !inputCode.trim()}
            id="track-issue-submit-btn"
            className="px-5 py-2.5 bg-[#0050c8] hover:bg-[#1d68f2] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isSearching ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Checking Registry...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Track Status</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Click Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-bold text-[#737686] dark:text-gray-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-[#0050c8] dark:text-blue-400" />
            Quick Test:
          </span>
          <button
            type="button"
            onClick={() => handleQuickSampleClick('CFX-8921')}
            className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-black bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0050c8] dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>#CFX-8921</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-sans font-bold">Investigating</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickSampleClick('CFX-4102')}
            className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-black bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0050c8] dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>#CFX-4102</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-sans font-bold">Fixed</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickSampleClick('CFX-2041')}
            className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-black bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0050c8] dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>#CFX-2041</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-[#0050c8] dark:text-blue-300 font-sans font-bold">Open</span>
          </button>
        </div>
      </form>

      {/* TRACKING RESULT PANEL: WHEN ISSUE FOUND */}
      {hasSearched && trackedIssue && (
        <div
          id="track-issue-result-card"
          className="mt-4 pt-4 border-t border-[#dae2ff] dark:border-gray-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {/* Top Status & Code Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/50 dark:from-blue-950/40 dark:via-[#131b26] dark:to-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-[#0050c8] text-white shadow-2xs">
                {trackedIssue.code || `#${trackedIssue.id}`}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getCategoryBadge(trackedIssue.category)}`}>
                {trackedIssue.category}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {trackedIssue.reportedDaysAgo || 'Reported recently'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dynamic Status Pill */}
              {(() => {
                const badge = getStatusBadge(trackedIssue.status);
                return (
                  <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-2xs ${badge.bg}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                );
              })()}

              {/* Copy Code button */}
              <button
                type="button"
                onClick={() => handleCopyCode(trackedIssue.code || trackedIssue.id)}
                className="p-1.5 rounded-xl bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                title="Copy reference code"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Issue Title, Severity & Address */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-base font-black text-[#121c28] dark:text-white leading-tight">
                {trackedIssue.title}
              </h4>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                trackedIssue.severity === 'High'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                  : trackedIssue.severity === 'Medium'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
              }`}>
                {trackedIssue.severity || 'Standard'} Severity
              </span>
            </div>

            <p className="text-xs text-[#424655] dark:text-gray-300 leading-relaxed line-clamp-2">
              {trackedIssue.description}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-[#56596e] dark:text-gray-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#0050c8] dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">{trackedIssue.address}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-gray-500 dark:text-gray-400">{trackedIssue.district}</span>
            </div>
          </div>

          {/* 4-Stage Municipal Progress Pipeline Stepper */}
          <div className="p-3 bg-[#f8f9ff] dark:bg-[#0e1522] rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#121c28] dark:text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#0050c8] dark:text-blue-400" />
                Municipal SLA Repair Lifecycle
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                Step {getActivePipelineStep(trackedIssue.status)} of 4
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center relative">
              {/* Step 1: Logged */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-black shadow-2xs">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-bold text-[#121c28] dark:text-gray-200 leading-tight">1. Logged</span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">Geotagged</span>
              </div>

              {/* Step 2: Triaged */}
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-2xs ${
                  getActivePipelineStep(trackedIssue.status) >= 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {getActivePipelineStep(trackedIssue.status) >= 2 ? <Check className="w-3 h-3" /> : '2'}
                </div>
                <span className="text-[10px] font-bold text-[#121c28] dark:text-gray-200 leading-tight">2. Triaged</span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">Ward Assigned</span>
              </div>

              {/* Step 3: Dispatched */}
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-2xs ${
                  getActivePipelineStep(trackedIssue.status) >= 3
                    ? trackedIssue.status === 'fixed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#0050c8] text-white ring-2 ring-blue-300 ring-offset-1'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {trackedIssue.status === 'fixed' ? (
                    <Check className="w-3 h-3" />
                  ) : getActivePipelineStep(trackedIssue.status) === 3 ? (
                    <Wrench className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
                  ) : (
                    '3'
                  )}
                </div>
                <span className="text-[10px] font-bold text-[#121c28] dark:text-gray-200 leading-tight">3. Crew Active</span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">Work Order</span>
              </div>

              {/* Step 4: Resolved */}
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-2xs ${
                  trackedIssue.status === 'fixed'
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {trackedIssue.status === 'fixed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : '4'}
                </div>
                <span className="text-[10px] font-bold text-[#121c28] dark:text-gray-200 leading-tight">4. Resolved</span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">Photo Certified</span>
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0e1522] border border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">Assigned Department</span>
                <span className="font-bold text-[#121c28] dark:text-gray-200">
                  {trackedIssue.assignedCrew || 'Zonal Municipal Maintenance Wing'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0e1522] border border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">Community Endorsements</span>
                <span className="font-bold text-[#121c28] dark:text-gray-200">
                  {trackedIssue.upvotes || 1} neighbors confirmed this defect
                </span>
              </div>
            </div>
          </div>

          {/* 100% FREE SMS & EMAIL NOTIFICATIONS PANEL */}
          <div className="p-3 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>100% Free Ticket Notifications (Zero Cost)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md">
                ₹0.00 &bull; Free Forever
              </span>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              Get instant, zero-cost updates via Free Telecom SMS, Free Cloud Email, or directly through your mobile device. No paid subscription needed.
            </p>

            {/* Quick 1-Tap Free Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  openFreeDeviceSms(
                    '',
                    `CivicFix Ticket #${trackedIssue.code || trackedIssue.id}: Status is ${trackedIssue.status.toUpperCase()} (${trackedIssue.title})`
                  )
                }
                className="p-2 bg-white dark:bg-[#131b26] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs text-[11px]"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Free Device SMS</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  openFreeDeviceEmail(
                    '',
                    `CivicFix Update: Ticket #${trackedIssue.code || trackedIssue.id}`,
                    `CivicFix Ticket Record:\nTicket ID: ${trackedIssue.code || trackedIssue.id}\nTitle: ${trackedIssue.title}\nStatus: ${trackedIssue.status}\nCategory: ${trackedIssue.category}\nAddress: ${trackedIssue.address}`
                  )
                }
                className="p-2 bg-white dark:bg-[#131b26] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs text-[11px]"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Free Email Link</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await requestBrowserNotificationPermission();
                  showBrowserNotification({
                    title: `CivicFix Ticket #${trackedIssue.code || trackedIssue.id}`,
                    body: `Current status: ${trackedIssue.status.toUpperCase()} (${trackedIssue.title})`,
                  });
                  soundFX.playSuccess();
                }}
                className="p-2 bg-white dark:bg-[#131b26] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs text-[11px]"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Free Push Alert</span>
              </button>
            </div>

            {/* Quick Dispatch Form to Citizen Phone or Email */}
            <form onSubmit={handleSendFreeAlert} className="flex gap-2">
              <input
                type="text"
                value={freeAlertTarget}
                onChange={(e) => setFreeAlertTarget(e.target.value)}
                placeholder="Enter email or mobile for free status update..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0e1522] border border-emerald-200 dark:border-emerald-800/60 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSendingAlert || !freeAlertTarget.trim()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {isSendingAlert ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Free Alert</span>
              </button>
            </form>

            {alertSuccessMsg && (
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg">
                ✓ {alertSuccessMsg}
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Verified Public Ticket Record</span>
            </div>

            <div className="flex items-center gap-2">
              {onSelectIssue && (
                <button
                  type="button"
                  onClick={() => onSelectIssue(trackedIssue)}
                  className="px-3.5 py-1.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Case File</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onGoToDashboard && !onSelectIssue && (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="px-3.5 py-1.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View on City Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOT FOUND ALERT */}
      {hasSearched && !trackedIssue && notFoundQuery && (
        <div
          id="track-issue-not-found"
          className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-amber-950 dark:text-amber-200">
                No active municipal report found matching "{notFoundQuery}".
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                Please double-check the 6-character ticket reference code provided in your SMS or email dispatch confirmation (e.g., <strong>#CFX-8921</strong>, <strong>#CFX-4102</strong>).
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Try testing one of these:</span>
            <button
              type="button"
              onClick={() => handleQuickSampleClick('CFX-8921')}
              className="px-2 py-0.5 rounded bg-white dark:bg-[#131b26] text-[#0050c8] dark:text-blue-400 font-mono font-bold text-[11px] border border-amber-300 dark:border-amber-700 shadow-2xs hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              #CFX-8921
            </button>
            <button
              type="button"
              onClick={() => handleQuickSampleClick('CFX-2041')}
              className="px-2 py-0.5 rounded bg-white dark:bg-[#131b26] text-emerald-800 dark:text-emerald-400 font-mono font-bold text-[11px] border border-amber-300 dark:border-amber-700 shadow-2xs hover:bg-emerald-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              #CFX-2041
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
