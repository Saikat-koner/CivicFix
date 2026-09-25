import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CivicIssue,
  Contributor,
  CivicQuest,
  AppNotification,
  IssueCategory,
  IssueStatus,
  IssueComment,
  UserRole,
  HigherUpOfficial,
  MunicipalAppointment,
  GrievancePetition,
  QueuedOfflineReport,
  EmergencyHotlinePlace
} from './types';
import {
  INITIAL_ISSUES,
  INITIAL_CONTRIBUTORS,
  INITIAL_QUESTS,
  INITIAL_NOTIFICATIONS,
  HIGHER_UP_OFFICIALS,
  INITIAL_APPOINTMENTS,
  INITIAL_GRIEVANCES,
  ADMIN_USER_PROFILE
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MapView } from './components/MapView';
import { IssueCard } from './components/IssueCard';
import { IssueDetailModal } from './components/IssueDetailModal';
import { ReportWizard } from './components/ReportWizard';
import { LeaderboardView } from './components/LeaderboardView';
import { NavigationMode } from './components/NavigationMode';
import { EscalateModal } from './components/EscalateModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminPortal } from './components/AdminPortal';
import { AppointmentBookingModal } from './components/AppointmentBookingModal';
import { AuthModal, AuthSuccessData } from './components/AuthModal';
import { EmergencyHotlinesModal } from './components/EmergencyHotlinesModal';
import { PrintableWorkOrderModal } from './components/PrintableWorkOrderModal';
import { OnboardingGatewayModal } from './components/OnboardingGatewayModal';
import { AuthGate } from './components/AuthGate';
import { PeopleHomepage } from './components/PeopleHomepage';
import { AudibleSubtitleBar } from './components/AudibleSubtitleBar';
import { DatabaseDiagnosticsModal } from './components/DatabaseDiagnosticsModal';
import { FreeApiIntegrationsModal } from './components/FreeApiIntegrationsModal';
import { CityStatsBanner } from './components/CityStatsBanner';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { CommandPalette } from './components/CommandPalette';
import { CookieBanner } from './components/CookieBanner';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { BackToTopAndSupport } from './components/BackToTopAndSupport';
import { UndoToast, UndoToastItem } from './components/UndoToast';
import {
  loadStoredData,
  saveStoredData,
  getOfflineQueue,
  saveOfflineReport,
  removeOfflineReport,
  clearOfflineQueue,
  isSimulatedOffline,
  setSimulatedOffline,
  getCurrentSession,
  clearCurrentSession,
  updateUserAvatar,
  updateUserContactVerification,
  DEDICATED_ADMIN_ACCOUNT,
  getStoredOfficials,
  saveStoredOfficials
} from './utils/storage';
import { getCurrentLivePosition, LiveLocationData } from './utils/liveLocation';
import { soundFX } from './utils/audioFeedback';
import { apiClient } from './services/api';
import { useCivicStream } from './hooks/useCivicStream';
import {
  dispatchFreeTicketNotification,
  showBrowserNotification,
} from './utils/freeNotifications';
import {
  Plus,
  Search,
  Award,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Sparkles,
  Zap,
  Building2,
  ShieldAlert,
  Calendar,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const GUEST_USER_PROFILE: Contributor = {
  rank: 99,
  id: 'guest-visitor',
  name: 'Guest Citizen',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  issuesResolved: 0,
  civicCredits: 0,
  isCurrentUser: true,
  badges: ['Visitor Mode'],
};

/**
 * Standard Web Vibration API helper for mobile tactile haptic feedback.
 * Invokes navigator.vibrate with duration patterns to enrich mobile tactile feel.
 */
const triggerVibration = (pattern: number | number[] = 35) => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Graceful fallback if unsupported or blocked by permissions
    }
  }
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'portal' | 'report' | 'activity' | 'ranks' | 'admin'>('home');
  const [userRole, setUserRole] = useState<UserRole>('citizen');
  
  // Core Entities State
  const [issues, setIssues] = useState<CivicIssue[]>(INITIAL_ISSUES);
  const [contributors, setContributors] = useState<Contributor[]>(INITIAL_CONTRIBUTORS);
  const [quests, setQuests] = useState<CivicQuest[]>(INITIAL_QUESTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [officials, setOfficials] = useState<HigherUpOfficial[]>(() => getStoredOfficials());
  const [appointments, setAppointments] = useState<MunicipalAppointment[]>(INITIAL_APPOINTMENTS);
  const [grievances, setGrievances] = useState<GrievancePetition[]>(INITIAL_GRIEVANCES);

  // Selected Issue for Detail Modal or Navigation
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [navigatingIssue, setNavigatingIssue] = useState<CivicIssue | null>(null);

  // Real-Time SSE Stream Subscription (StreamBuilder Reactive Pattern)
  const { isConnected: isStreamConnected, eventCount: streamEventCount } = useCivicStream({
    onIssueCreated: (newIssue) => {
      setIssues((prev) => {
        if (prev.some((it) => it.id === newIssue.id)) return prev;
        return [newIssue, ...prev];
      });
      soundFX.playSuccess();
    },
    onIssueUpdated: (updatedIssue) => {
      setIssues((prev) =>
        prev.map((it) => (it.id === updatedIssue.id ? { ...it, ...updatedIssue } : it))
      );
      setSelectedIssue((cur) => (cur && cur.id === updatedIssue.id ? { ...cur, ...updatedIssue } : cur));
    },
    onIssueDeleted: (deletedId) => {
      setIssues((prev) => prev.filter((it) => it.id !== deletedId));
      setSelectedIssue((cur) => (cur && cur.id === deletedId ? null : cur));
    },
    onUpvoted: (issueId, updatedIssue) => {
      setIssues((prev) =>
        prev.map((it) => (it.id === issueId ? { ...it, upvotes: updatedIssue.upvotes } : it))
      );
      setSelectedIssue((cur) =>
        cur && cur.id === issueId ? { ...cur, upvotes: updatedIssue.upvotes } : cur
      );
    },
    onVoteRecorded: (issueId, updatedIssue) => {
      setIssues((prev) =>
        prev.map((it) =>
          it.id === issueId ? { ...it, verificationVotes: updatedIssue.verificationVotes } : it
        )
      );
      setSelectedIssue((cur) =>
        cur && cur.id === issueId
          ? { ...cur, verificationVotes: updatedIssue.verificationVotes }
          : cur
      );
    },
    onCommentAdded: (issueId, updatedIssue) => {
      setIssues((prev) =>
        prev.map((it) =>
          it.id === issueId ? { ...it, comments: updatedIssue.comments } : it
        )
      );
      setSelectedIssue((cur) =>
        cur && cur.id === issueId ? { ...cur, comments: updatedIssue.comments } : cur
      );
    },
  });

  // Fetch initial live issues from Express backend
  useEffect(() => {
    apiClient.getIssues()
      .then((serverIssues) => {
        if (serverIssues && Array.isArray(serverIssues) && serverIssues.length > 0) {
          setIssues(serverIssues);
        }
      })
      .catch((err) => {
        console.log('Using local issues cache fallback:', err);
      });
  }, []);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All Issues');
  const [mapStatusFilter, setMapStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportInitialLocation, setReportInitialLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
    district?: string;
  } | null>(null);

  // Modals State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHigherUpsModal, setShowHigherUpsModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDbDiagnosticsModal, setShowDbDiagnosticsModal] = useState(false);
  const [showFreeApiModal, setShowFreeApiModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showPrivacyTermsModal, setShowPrivacyTermsModal] = useState(false);
  const [privacyTermsTab, setPrivacyTermsTab] = useState<'privacy' | 'terms' | 'contact' | 'notfound'>('privacy');
  const [undoToast, setUndoToast] = useState<UndoToastItem | null>(null);

  // Dark Mode State with LocalStorage persistence & system preference fallback
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('civicfix_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      body.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('civicfix_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      root.setAttribute('data-theme', 'light');
      body.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      localStorage.setItem('civicfix_theme', 'light');
    }
  }, [isDarkMode]);

  // Global ⌘K / Ctrl+K keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic Meta Title & Meta Description Per Page / Screen
  useEffect(() => {
    const tabTitles: Record<string, { title: string; desc: string }> = {
      home: {
        title: 'CivicFix | Citizen Redressal & Public Infrastructure Portal',
        desc: 'Official municipal civic issue reporting, real-time repair progress tracking, and open citizen redressal.',
      },
      portal: {
        title: 'CivicFix | Live Ward Issues & Feed',
        desc: 'Browse active civic reports, verified repair statuses, and community votes across municipal wards.',
      },
      report: {
        title: 'CivicFix | Report Municipal Defect & Potholes',
        desc: 'Submit geotagged defect reports with AI visual image analysis and automatic municipal department routing.',
      },
      activity: {
        title: 'CivicFix | Interactive OpenStreetMap Ward Map',
        desc: 'Full-screen municipal defect map with live GPS tracking, route hazard alerts, and ward boundary layers.',
      },
      ranks: {
        title: 'CivicFix | Citizen Leaderboard & Civic Credits',
        desc: 'Top community contributors, civic tier badges, and redeemable municipal utility vouchers.',
      },
      admin: {
        title: 'CivicFix | Municipal Commissioner Operations Desk',
        desc: 'Administrative triage desk for citizen grievance review, emergency dispatch, and field crew assignment.',
      },
    };

    const info = tabTitles[currentTab] || tabTitles.home;
    document.title = info.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', info.desc);
    }
  }, [currentTab]);
  const [workOrderIssue, setWorkOrderIssue] = useState<CivicIssue | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('citizen');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [resetTokenParam, setResetTokenParam] = useState<string | null>(null);
  const [resetEmailParam, setResetEmailParam] = useState<string | null>(null);
  const pendingAuthActionRef = useRef<(() => void) | null>(null);

  // Auto-detect ?reset_token=..., ?auth_mode=forgot, ?forgot=true, or #forgot-password in URL
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('reset_token');
      const email = urlParams.get('email');
      const mode = urlParams.get('auth_mode') || urlParams.get('auth');
      const isForgotHash = window.location.hash === '#forgot' || window.location.hash === '#forgot-password';
      const isLoginHash = window.location.hash === '#login' || window.location.hash === '#signin';

      if (token) {
        setResetTokenParam(token);
        if (email) setResetEmailParam(email);
        setAuthModalMode('forgot');
        setShowAuthModal(true);
      } else if (mode === 'forgot' || urlParams.has('forgot') || isForgotHash) {
        if (email) setResetEmailParam(email);
        setAuthModalMode('forgot');
        setShowAuthModal(true);
      } else if (mode === 'login' || isLoginHash) {
        setAuthModalMode('login');
        setShowAuthModal(true);
      }
    } catch {
      // URL parsing fallback
    }
  }, []);

  // Gateway States
  const [showOnboardingGateway, setShowOnboardingGateway] = useState(false);
  const [onboardingDeviceMode, setOnboardingDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Auth Session State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userDistrict, setUserDistrict] = useState('Bengaluru Central (Ward 112)');
  const [userPhone, setUserPhone] = useState('');

  // Live location & single-location pointing mode
  const [userLiveLocation, setUserLiveLocation] = useState<LiveLocationData | null>(null);
  const [pointAtUserLocationOnly, setPointAtUserLocationOnly] = useState<boolean>(false);
  const [flyToUserTrigger, setFlyToUserTrigger] = useState<number>(0);
  const [highlightedEmergencyPlace, setHighlightedEmergencyPlace] = useState<EmergencyHotlinePlace | null>(null);

  const handleNavigateToMapWithEmergencyPlace = useCallback((place: EmergencyHotlinePlace) => {
    setHighlightedEmergencyPlace(place);
    setShowEmergencyModal(false);
    setCurrentTab('home');
    soundFX.playAlert();
    setTimeout(() => {
      const mapEl = document.getElementById('interactive-city-map') || document.getElementById('home-dashboard-main');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }, []);

  // Persistent Connection Status & Offline Queue State
  const [queuedReports, setQueuedReports] = useState<QueuedOfflineReport[]>(() => getOfflineQueue());
  const [isSimulatedOfflineState, setIsSimulatedOfflineState] = useState<boolean>(() => isSimulatedOffline());
  const [isOnlineState, setIsOnlineState] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine && !isSimulatedOffline();
    }
    return true;
  });
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  // Live Database Sync State (Automatic time-by-time synchronization with Cloud SQL PostgreSQL)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [autoSyncIntervalSec, setAutoSyncIntervalSec] = useState<number>(12); // 12s polling default
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);

  // Connection & Offline Queue Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      const simulated = isSimulatedOffline();
      setIsOnlineState(!simulated);
      if (!simulated) {
        soundFX.playSuccess();
        const currentQueue = getOfflineQueue();
        if (currentQueue.length > 0) {
          setNotifications((prev) => [
            {
              id: `notif-${Date.now()}`,
              type: 'dispatch',
              title: `Network Connection Restored (${currentQueue.length} Queued)`,
              desc: `Municipal cloud connection active. Click Sync in the Header to transmit your ${currentQueue.length} offline report${currentQueue.length > 1 ? 's' : ''}.`,
              time: 'Just now',
              unread: true,
            },
            ...prev,
          ]);
        }
      }
    };

    const handleOffline = () => {
      setIsOnlineState(false);
      soundFX.playClick();
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'dispatch',
          title: 'Connection Lost • Working Offline',
          desc: 'Your device is disconnected from the city network. Reports will be safely preserved in your encrypted local offline queue.',
          time: 'Just now',
          unread: true,
        },
        ...prev,
      ]);
    };

    const handleQueueChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ queue: QueuedOfflineReport[] }>;
      if (customEvent.detail && customEvent.detail.queue) {
        setQueuedReports(customEvent.detail.queue);
      } else {
        setQueuedReports(getOfflineQueue());
      }
    };

    const handleConnectionChanged = () => {
      const sim = isSimulatedOffline();
      setIsSimulatedOfflineState(sim);
      const realOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnlineState(realOnline && !sim);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('civicfix-offline-queue-changed', handleQueueChanged);
    window.addEventListener('civicfix-connection-changed', handleConnectionChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('civicfix-offline-queue-changed', handleQueueChanged);
      window.removeEventListener('civicfix-connection-changed', handleConnectionChanged);
    };
  }, []);

  // Initial Load from Persistence & Active Session & Express API
  useEffect(() => {
    try {
      const stored = loadStoredData();
      if (stored) {
        if (stored.issues && stored.issues.length > 0) setIssues(stored.issues);
        if (stored.appointments && stored.appointments.length > 0) setAppointments(stored.appointments);
        if (stored.grievances && stored.grievances.length > 0) setGrievances(stored.grievances);
        if (stored.contributors && stored.contributors.length > 0) setContributors(stored.contributors);
      }

      // Check current session
      const currentSession = getCurrentSession();
      if (currentSession) {
        setIsLoggedIn(true);
        setUserRole(currentSession.role);
        setUserEmail(currentSession.email);
        setUserDistrict(currentSession.district);
        if (currentSession.phone) setUserPhone(currentSession.phone);

        // Acquire live location for restored user session and point at it
        getCurrentLivePosition().then((livePos) => {
          setUserLiveLocation(livePos);
          setPointAtUserLocationOnly(true);
          setFlyToUserTrigger(Date.now());
          if (livePos.district) setUserDistrict(livePos.district);
        }).catch(() => {
          // Fallback
        });

        // Update contributor list with user session
        setContributors((prev) => {
          const exists = prev.find((c) => c.id === currentSession.user.id);
          if (exists) {
            return prev.map((c) => ({
              ...c,
              isCurrentUser: c.id === currentSession.user.id,
            }));
          }
          return [
            ...prev.map((c) => ({ ...c, isCurrentUser: false })),
            { ...currentSession.user, isCurrentUser: true },
          ];
        });
      }

      // Check if there are queued offline reports from when user was disconnected
      const offlineQueue = getOfflineQueue();
      if (offlineQueue && offlineQueue.length > 0) {
        setQueuedReports(offlineQueue);
        setIssues((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const toAdd: CivicIssue[] = offlineQueue
            .filter((q) => !existingIds.has(q.id))
            .map((q) => ({
              id: q.id,
              code: q.code,
              title: q.title,
              description: q.description,
              category: q.category,
              district: q.district,
              address: q.address,
              location: q.location,
              status: 'open' as IssueStatus,
              reportedDaysAgo: 'Queued Offline',
              reportedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              imageUrl: q.imageUrl,
              severity: q.severity,
              upvotes: 1,
              hasUpvoted: true,
              mergedReportsCount: 1,
              isOfflineQueued: true,
              queuedAt: q.queuedAt,
              reportedBy: {
                name: q.reporterName || 'Citizen Reporter',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
              },
              timeElapsed: 'Queued locally',
              timeline: [
                {
                  id: 't-1',
                  title: 'Report Queued Offline',
                  timestamp: 'Pending Sync',
                  actor: 'Encrypted Device Cache',
                  completed: true,
                  isCurrent: true,
                },
              ],
              verificationVotes: {
                stillThere: 1,
                isFixed: 0,
                userVote: 'stillThere',
              },
            }));
          return [...toAdd, ...prev];
        });
      }

      // Sync with fullstack backend API
      apiClient.getIssues().then((serverIssues) => {
        if (serverIssues && serverIssues.length > 0) {
          setIssues((prev) => {
            // Keep any locally created issues that aren't on server yet
            const serverIds = new Set(serverIssues.map((i) => i.id));
            const localOnly = prev.filter((i) => !serverIds.has(i.id));
            return [...localOnly, ...serverIssues];
          });
        }
      }).catch(() => {
        // Backend fallback handled gracefully
      });
    } catch {
      // Fallback cleanly to default dataset
    }
  }, []);

  // Save updates to Persistence
  useEffect(() => {
    try {
      saveStoredData({
        issues,
        appointments,
        grievances,
        contributors,
      });
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [issues, appointments, grievances, contributors]);

  const [appointmentContext, setAppointmentContext] = useState<{
    official?: HigherUpOfficial;
    issue?: CivicIssue;
  }>({});

  const [escalateState, setEscalateState] = useState<{
    isOpen: boolean;
    issue: CivicIssue | null;
    mode: 'reopen' | 'appointment' | 'higher_up';
  }>({
    isOpen: false,
    issue: null,
    mode: 'reopen',
  });

  const loggedInCitizenUser = contributors.find((c) => c.isCurrentUser);
  const activeUser = isLoggedIn
    ? userRole === 'admin'
      ? ADMIN_USER_PROFILE
      : (loggedInCitizenUser || GUEST_USER_PROFILE)
    : GUEST_USER_PROFILE;

  // Open Auth Modal helper
  const handleOpenAuthModal = (
    mode: 'login' | 'register' | 'forgot' = 'login',
    role: UserRole = 'citizen',
    prompt: string | null = null
  ) => {
    setAuthModalMode(mode);
    setAuthInitialRole(role);
    setAuthPromptMessage(prompt);
    setShowAuthModal(true);
  };

  // Auth Guard Helper
  const requireAuth = (
    action: () => void,
    requiredRole: UserRole = 'citizen',
    promptText?: string
  ) => {
    if (!isLoggedIn) {
      pendingAuthActionRef.current = action;
      handleOpenAuthModal('login', requiredRole, promptText || 'Please sign in or register an account to perform this action.');
      return;
    }

    if (requiredRole === 'admin' && userRole !== 'admin') {
      pendingAuthActionRef.current = action;
      handleOpenAuthModal('login', 'admin', promptText || 'Official Municipal Administrator credentials are required for City Hall Admin Command.');
      return;
    }

    action();
  };

  // Handle Login / Registration completion
  const handleAuthSuccess = (data: AuthSuccessData) => {
    setIsLoggedIn(true);
    setUserRole(data.role);
    setUserEmail(data.email);
    setUserDistrict(data.district);
    if (data.phone) setUserPhone(data.phone);

    // Update contributor list to mark the authenticated user as active
    setContributors((prev) => {
      const existing = prev.find((c) => c.id === data.user.id);
      if (existing) {
        return prev.map((c) => ({
          ...c,
          isCurrentUser: c.id === data.user.id,
        }));
      }
      return [
        ...prev.map((c) => ({ ...c, isCurrentUser: false })),
        { ...data.user, isCurrentUser: true },
      ];
    });

    // Make map navigate to home, acquire live location, and point at that location only!
    setCurrentTab('home');
    setPointAtUserLocationOnly(true);

    // Acquire live position immediately
    getCurrentLivePosition().then((livePos) => {
      setUserLiveLocation(livePos);
      setFlyToUserTrigger(Date.now());
      if (livePos.district) {
        setUserDistrict(livePos.district);
      }

      // Add alert notification for location point
      const locNotif: AppNotification = {
        id: `notif-loc-${Date.now()}`,
        type: 'community',
        title: '📍 Map Pointed to Your Live Location',
        desc: `Map is locked and pointing exclusively at your live location: ${livePos.address || `${livePos.lat.toFixed(4)}, ${livePos.lng.toFixed(4)}`}.`,
        time: 'Just now',
        unread: true,
      };
      setNotifications((prev) => [locNotif, ...prev]);
    }).catch(() => {
      setFlyToUserTrigger(Date.now());
    });

    // Add welcome notification
    const welcomeNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'reward',
      title: `Welcome, ${data.user.name}!`,
      desc: data.role === 'admin' 
        ? 'Authenticated as Authorized City Commissioner. Map centered and pointing at your live location.'
        : `Signed into CivicFix accredited network. Map pointing at your live location in ${data.district}.`,
      time: 'Just now',
      unread: true,
      ccAmount: data.user.civicCredits,
    };
    setNotifications((prev) => [welcomeNotif, ...prev]);

    // If an action was pending before login, trigger it
    if (pendingAuthActionRef.current) {
      const pendingAction = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      setTimeout(() => {
        pendingAction();
      }, 100);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    clearCurrentSession();
    setIsLoggedIn(false);
    setUserRole('citizen');
    setPointAtUserLocationOnly(false);
    setUserLiveLocation(null);
    setUserEmail('');
    setUserPhone('');
    setContributors((prev) =>
      prev.map((c) => ({
        ...c,
        isCurrentUser: false,
      }))
    );
    setCurrentTab('home');

    const logoutNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'status_change',
      title: 'Signed Out of CivicFix Terminal',
      desc: 'You have signed out. Sign in or register to submit reports and earn Civic Credits.',
      time: 'Just now',
      unread: true,
    };
    setNotifications((prev) => [logoutNotif, ...prev]);
  };

  // Update user avatar across storage and active contributors
  const handleUpdateUserAvatar = (newAvatar: string) => {
    updateUserAvatar(activeUser.id, newAvatar);
    setContributors((prev) =>
      prev.map((c) =>
        c.isCurrentUser || c.id === activeUser.id
          ? { ...c, avatar: newAvatar }
          : c
      )
    );
    soundFX.playSuccess();
    const avatarNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'reward',
      title: 'Profile Avatar Updated',
      desc: 'Your municipal citizen badge face icon has been refreshed across the network.',
      time: 'Just now',
      unread: true,
    };
    setNotifications((prev) => [avatarNotif, ...prev]);
  };

  // Toggle between Citizen & Admin Person
  const handleToggleUserRole = () => {
    if (userRole === 'citizen') {
      requireAuth(
        () => {
          setUserRole('admin');
          setCurrentTab('admin');
          confetti({ particleCount: 35, spread: 45 });
        },
        'admin',
        'Official Municipal Administrator credentials required to access Admin Dispatch.'
      );
    } else {
      setUserRole('citizen');
      setCurrentTab('home');
    }
  };

  // Upvote / Confirm issue (Requires Auth)
  const handleUpvote = (issueId: string) => {
    requireAuth(
      () => {
        setIssues((prev) =>
          prev.map((item) => {
            if (item.id === issueId) {
              const hasUpvoted = !item.hasUpvoted;
              const upvotes = hasUpvoted ? item.upvotes + 1 : item.upvotes - 1;
              return { ...item, upvotes, hasUpvoted };
            }
            return item;
          })
        );

        // Sync with Express backend
        apiClient.upvoteIssue(issueId, { userRole, userName: activeUser.name, userEmail })
          .catch((err) => console.warn('Upvote sync error:', err));

        // Vibration feedback on upvote
        triggerVibration(25);

        // Award +10 CC if upvoting
        setContributors((prev) =>
          prev.map((c) =>
            c.isCurrentUser
              ? { ...c, civicCredits: c.civicCredits + 10 }
              : c
          )
        );

        confetti({
          particleCount: 40,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#0050c8', '#10B981'],
        });
      },
      'citizen',
      'Please sign in or register to upvote and verify this civic report.'
    );
  };

  // Add Comment on Issue (Requires Auth)
  const handleAddComment = (issueId: string, text: string) => {
    requireAuth(
      () => {
        const newComment: IssueComment = {
          id: `comm-${Date.now()}`,
          author: activeUser.name,
          avatar: activeUser.avatar,
          timestamp: 'Just now',
          text,
          isOfficial: userRole === 'admin',
          upvotes: 0,
        };

        setIssues((prev) =>
          prev.map((item) => {
            if (item.id === issueId) {
              const comments = item.comments ? [newComment, ...item.comments] : [newComment];
              return { ...item, comments };
            }
            return item;
          })
        );

        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue((prev) =>
            prev ? { ...prev, comments: prev.comments ? [newComment, ...prev.comments] : [newComment] } : null
          );
        }

        // Sync comment with Express backend
        apiClient.addComment(issueId, text, {
          userRole,
          userName: activeUser.name,
          userEmail,
          isOfficial: userRole === 'admin',
          department: userRole === 'admin' ? 'BBMP Control Room' : undefined,
        }).catch((err) => console.warn('Comment sync error:', err));

        if (userRole === 'citizen') {
          setContributors((prev) =>
            prev.map((c) =>
              c.isCurrentUser ? { ...c, civicCredits: c.civicCredits + 5 } : c
            )
          );
        }
      },
      'citizen',
      'Please sign in or register to post comments on civic reports.'
    );
  };

  // Claim Quest Reward
  const handleClaimQuestReward = (questId: string, reward: number) => {
    // Vibration API celebratory haptic sequence on quest reward claim
    triggerVibration([60, 50, 60, 50, 120]);
    soundFX.playSuccess();

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true, completed: true } : q))
    );

    setContributors((prev) =>
      prev.map((c) =>
        c.isCurrentUser
          ? { ...c, civicCredits: c.civicCredits + reward }
          : c
      )
    );

    const newNotification: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Quest Completed!',
      desc: `You earned +${reward} CC for completing a civic mission.`,
      time: 'Just now',
      unread: true,
      type: 'reward',
      ccAmount: reward,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  // Notifications Handlers
  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    if (notif.issueId) {
      const target = issues.find((i) => i.id === notif.issueId);
      if (target) {
        setSelectedIssue(target);
      }
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Verify Resolution Poll in Detail Modal
  const handleVoteResolution = (issueId: string, vote: 'stillThere' | 'isFixed') => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const currentVote = item.verificationVotes.userVote;
          let stillThere = item.verificationVotes.stillThere;
          let isFixed = item.verificationVotes.isFixed;

          if (currentVote === 'stillThere') stillThere--;
          if (currentVote === 'isFixed') isFixed--;

          if (vote === 'stillThere') stillThere++;
          if (vote === 'isFixed') isFixed++;

          return {
            ...item,
            status: vote === 'isFixed' && isFixed >= 5 ? 'fixed' : item.status,
            verificationVotes: {
              stillThere,
              isFixed,
              userVote: vote,
            },
          };
        }
        return item;
      })
    );

    // Sync vote to Express backend
    apiClient.submitVote(issueId, vote, { userRole, userName: activeUser.name, userEmail })
      .catch((err) => console.warn('Vote sync error:', err));

    // Vibration feedback on resolution verification vote
    triggerVibration([30, 40, 30]);

    // Award +10 Civic Credits
    setContributors((prev) =>
      prev.map((c) =>
        c.isCurrentUser
          ? { ...c, civicCredits: c.civicCredits + 10 }
          : c
      )
    );
  };

  // Handle New Issue Submission
  const handleReportSubmit = (
    newIssueData: Omit<CivicIssue, 'id' | 'code' | 'timeline' | 'verificationVotes' | 'upvotes'>
  ) => {
    const newId = `issue-${Date.now()}`;
    const newCode = `#CFX-${Math.floor(1000 + Math.random() * 9000)}`;
    const isCurrentlyOffline = !isOnlineState;

    const newIssue: CivicIssue = {
      ...newIssueData,
      id: newId,
      code: newCode,
      isOfflineQueued: isCurrentlyOffline,
      queuedAt: isCurrentlyOffline ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      upvotes: 1,
      hasUpvoted: true,
      timeline: [
        {
          id: 't-1',
          title: isCurrentlyOffline ? 'Report Stored in Offline Queue' : 'Report Submitted',
          timestamp: 'Just now',
          actor: isCurrentlyOffline ? 'Local Device Cache (Awaiting Network)' : 'AI Image Triaged & Priority Marked',
          completed: true,
          isCurrent: true,
        },
      ],
      verificationVotes: {
        stillThere: 1,
        isFixed: 0,
        userVote: 'stillThere',
      },
    };

    setIssues((prev) => [newIssue, ...prev]);

    if (isCurrentlyOffline) {
      // Save locally to offline queue
      const savedReport = saveOfflineReport({
        id: newIssue.id,
        code: newIssue.code,
        title: newIssue.title,
        description: newIssue.description,
        category: newIssue.category,
        district: newIssue.district,
        address: newIssue.address,
        location: newIssue.location,
        imageUrl: newIssue.imageUrl,
        severity: newIssue.severity,
        reporterName: activeUser.name,
      });

      setQueuedReports((prev) => [savedReport, ...prev.filter((q) => q.id !== savedReport.id)]);

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'dispatch',
          title: `Report Stored in Offline Queue (${newCode})`,
          desc: `"${newIssue.title}" was saved locally. It will auto-transmit to municipal dispatch once you reconnect.`,
          time: 'Just now',
          unread: true,
          issueId: newIssue.id,
        },
        ...prev,
      ]);
    } else {
      // Asynchronously dispatch to backend Express API
      apiClient.createIssue({
        title: newIssue.title,
        description: newIssue.description,
        category: newIssue.category,
        district: newIssue.district,
        address: newIssue.address,
        location: newIssue.location,
        imageUrl: newIssue.imageUrl,
        severity: newIssue.severity,
        reporterName: activeUser.name,
      }, {
        userRole,
        userName: activeUser.name,
        userEmail,
      })
      .then((serverIssue) => {
        if (serverIssue) {
          setIssues((prev) =>
            prev.map((it) => (it.id === newIssue.id ? { ...it, ...serverIssue } : it))
          );
        }
      })
      .catch((err) => console.warn('Background server sync error:', err));
    }

    // Trigger mobile haptic feedback on report submission
    triggerVibration([50, 40, 50]);
    soundFX.playSuccess();

    // Dispatch 100% free SMS/Email status notification to citizen
    dispatchFreeTicketNotification({
      issueCode: newCode,
      issueTitle: newIssue.title,
      status: 'submitted',
      email: userEmail || activeUser.email,
      phone: userPhone || activeUser.phone,
      citizenName: activeUser.name,
      department: newIssue.category,
    }).catch((err) => console.warn('Free ticket notification dispatch:', err));

    showBrowserNotification({
      title: `CivicFix: Report Dispatched (${newCode})`,
      body: `"${newIssue.title}" has been registered. 100% free SMS & email updates enabled.`,
    });

    // Update quest progress for reporting
    setQuests((prev) =>
      prev.map((q) => {
        if ((q.id === 'quest-1' || q.id === 'q-1') && q.current < q.target) {
          const nextVal = q.current + 1;
          const isComplete = nextVal >= q.target;
          if (isComplete) {
            // Quest complete triumphant haptic sequence
            setTimeout(() => {
              triggerVibration([60, 50, 60, 50, 120]);
            }, 300);
          }
          return { ...q, current: nextVal, completed: isComplete };
        }
        return q;
      })
    );

    // Reward +50 Civic Credits and mark first report as completed
    setContributors((prev) =>
      prev.map((c) =>
        c.isCurrentUser
          ? {
              ...c,
              civicCredits: c.civicCredits + 50,
              issuesResolved: c.issuesResolved + 1,
              firstReportSubmitted: true,
            }
          : c
      )
    );

    updateUserContactVerification(activeUser.id || userEmail, {
      email: userEmail || activeUser.email || '',
      phone: userPhone || activeUser.phone || '',
      firstReportSubmitted: true,
    });

    setCurrentTab('home');
    setSelectedIssue(newIssue);
    setReportInitialLocation(null);
  };

  // Centralized Database Synchronizer: syncs offline queue + pulls fresh database records time-by-time
  const syncWithDatabase = useCallback(async (isManualTrigger = false) => {
    if (!isOnlineState || isSimulatedOfflineState) return;

    setIsLiveSyncing(true);
    if (isManualTrigger) {
      setIsSyncingOffline(true);
      soundFX.playClick();
    }

    try {
      if (isSimulatedOfflineState) {
        setSimulatedOffline(false);
        setIsSimulatedOfflineState(false);
        setIsOnlineState(typeof navigator !== 'undefined' ? navigator.onLine : true);
      }

      // 1. If any offline queue items exist, flush them to PostgreSQL
      const currentQueue = getOfflineQueue();
      if (currentQueue && currentQueue.length > 0) {
        const syncPromises = currentQueue.map((item) =>
          apiClient.createIssue({
            title: item.title,
            description: item.description,
            category: item.category,
            district: item.district,
            address: item.address,
            location: item.location,
            imageUrl: item.imageUrl,
            severity: item.severity,
            reporterName: item.reporterName || activeUser.name,
          }, {
            userRole,
            userName: activeUser.name,
            userEmail,
          }).catch((err) => console.warn('Failed syncing offline report:', item.id, err))
        );

        await Promise.all(syncPromises);

        const count = currentQueue.length;
        clearOfflineQueue();
        setQueuedReports([]);

        if (isManualTrigger) {
          soundFX.playSuccess();
          confetti({
            particleCount: 50,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#10B981', '#0050c8', '#38bdf8'],
          });

          setNotifications((prev) => [
            {
              id: `notif-${Date.now()}`,
              type: 'reward',
              title: `Cloud Sync Complete: ${count} Reports Transmitted!`,
              desc: `All ${count} pending offline hazard reports have been successfully registered with municipal dispatch.`,
              time: 'Just now',
              unread: true,
              ccAmount: count * 50,
            },
            ...prev,
          ]);
        }
      }

      // 2. Fetch fresh issues from Cloud SQL PostgreSQL via Express API
      const freshIssues = await apiClient.getIssues();
      if (Array.isArray(freshIssues)) {
        setIssues((prev) => {
          const localOfflineOnly = prev.filter((i) => i.isOfflineQueued);
          if (freshIssues.length === 0 && localOfflineOnly.length === 0) {
            return [];
          }

          const seenIds = new Set<string>();
          const merged: CivicIssue[] = [];

          // First add all fresh issues from the database
          for (const sIssue of freshIssues) {
            merged.push(sIssue);
            seenIds.add(sIssue.id);
            if (sIssue.code) seenIds.add(sIssue.code.toLowerCase());
          }

          // Preserve any local offline queued reports not yet synced
          for (const lIssue of localOfflineOnly) {
            if (!seenIds.has(lIssue.id) && (!lIssue.code || !seenIds.has(lIssue.code.toLowerCase()))) {
              merged.push(lIssue);
            }
          }

          return merged;
        });

        // If an issue is currently selected in the details view/modal, update it with fresh DB data
        setSelectedIssue((current) => {
          if (!current) return null;
          const updated = freshIssues.find(
            (i) => i.id === current.id || (i.code && current.code && i.code.toLowerCase() === current.code.toLowerCase())
          );
          return updated ? { ...current, ...updated } : current;
        });
      }

      setLastSyncTime(new Date());

      if (isManualTrigger && (!currentQueue || currentQueue.length === 0)) {
        soundFX.playSuccess();
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            type: 'dispatch',
            title: 'Database Synchronized',
            desc: `PostgreSQL connection active. Successfully synchronized with cloud records.`,
            time: 'Just now',
            unread: true,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.warn('[SyncEngine] Background DB synchronization notice:', err);
    } finally {
      setIsLiveSyncing(false);
      setIsSyncingOffline(false);
    }
  }, [isOnlineState, isSimulatedOfflineState, activeUser.name, userRole, userEmail]);

  // Offline Queue Synchronizer & Action Handlers
  const handleSyncOfflineQueue = async () => {
    await syncWithDatabase(true);
  };

  // Time-by-Time Auto Sync Timer (polls database periodically)
  useEffect(() => {
    if (!autoSyncEnabled || autoSyncIntervalSec <= 0) return;
    if (!isOnlineState || isSimulatedOfflineState) return;

    const timer = setInterval(() => {
      // Only poll when tab is visible to conserve container CPU and bandwidth
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncWithDatabase(false);
      }
    }, autoSyncIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, autoSyncIntervalSec, isOnlineState, isSimulatedOfflineState, syncWithDatabase]);

  // Sync immediately when user switches back to tab or windows refocuses
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnlineState && !isSimulatedOfflineState) {
        syncWithDatabase(false);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isOnlineState, isSimulatedOfflineState, syncWithDatabase]);

  // Immediate initial synchronization with backend on initial load
  useEffect(() => {
    syncWithDatabase(false);
  }, [syncWithDatabase]);

  const handleToggleSimulateOffline = () => {
    const nextVal = !isSimulatedOfflineState;
    setSimulatedOffline(nextVal);
    setIsSimulatedOfflineState(nextVal);
    const realOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnlineState(realOnline && !nextVal);

    soundFX.playClick();
    if (nextVal) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'dispatch',
          title: 'Offline Simulation Active',
          desc: 'Simulating disconnected network environment. Reports submitted will be queued locally on this device.',
          time: 'Just now',
          unread: true,
        },
        ...prev,
      ]);
    } else {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'dispatch',
          title: 'Online Mode Restored',
          desc: 'Connected to live municipal cloud services.',
          time: 'Just now',
          unread: true,
        },
        ...prev,
      ]);
    }
  };

  const handleAddTestOfflineReport = () => {
    soundFX.playSuccess();
    const testSamples = [
      {
        title: 'Dangerous Pothole on 100ft Road',
        category: 'Roads' as IssueCategory,
        address: 'Near 12th Main Junction, Indiranagar',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        severity: 'High' as const,
      },
      {
        title: 'Streetlight Pole Electrical Outage',
        category: 'Utilities' as IssueCategory,
        address: '8th Cross, 4th Block, Koramangala',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        severity: 'Medium' as const,
      },
      {
        title: 'Overflowing Solid Waste at Bus Shelter',
        category: 'Sanitation' as IssueCategory,
        address: 'BMTC Bus Shelter, HSR Layout Sector 1',
        imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
        severity: 'High' as const,
      },
    ];

    const sample = testSamples[Math.floor(Math.random() * testSamples.length)];
    const newCode = `#CFX-OFF-${Math.floor(1000 + Math.random() * 9000)}`;

    const testItem = saveOfflineReport({
      code: newCode,
      title: sample.title,
      description: 'Emergency test report queued in offline mode for demonstration.',
      category: sample.category,
      district: 'Bengaluru Metropolitan Ward',
      address: sample.address,
      location: { lat: 12.9716 + (Math.random() - 0.5) * 0.04, lng: 77.5946 + (Math.random() - 0.5) * 0.04 },
      imageUrl: sample.imageUrl,
      severity: sample.severity,
      reporterName: activeUser.name,
    });

    setQueuedReports(getOfflineQueue());

    // Inject into local issues list with isOfflineQueued
    const queuedIssue: CivicIssue = {
      id: testItem.id,
      code: testItem.code,
      title: testItem.title,
      description: testItem.description,
      category: testItem.category,
      district: testItem.district,
      address: testItem.address,
      location: testItem.location,
      status: 'open',
      reportedDaysAgo: 'Queued Offline',
      reportedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      imageUrl: testItem.imageUrl,
      severity: testItem.severity,
      upvotes: 1,
      hasUpvoted: true,
      mergedReportsCount: 1,
      isOfflineQueued: true,
      queuedAt: testItem.queuedAt,
      reportedBy: {
        name: activeUser.name,
        avatar: activeUser.avatar,
      },
      timeElapsed: 'Just now',
      timeline: [
        {
          id: 't-1',
          title: 'Report Queued Offline',
          timestamp: 'Just now',
          actor: 'Encrypted Device Cache',
          completed: true,
          isCurrent: true,
        },
      ],
      verificationVotes: {
        stillThere: 1,
        isFixed: 0,
        userVote: 'stillThere',
      },
    };

    setIssues((prev) => [queuedIssue, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: 'dispatch',
        title: `Test Report Queued (${testItem.code})`,
        desc: `"${testItem.title}" queued locally. Persistent Header indicator now alerts user of pending report.`,
        time: 'Just now',
        unread: true,
        issueId: queuedIssue.id,
      },
      ...prev,
    ]);
  };

  const handleRemoveQueuedReport = (id: string) => {
    removeOfflineReport(id);
    setQueuedReports(getOfflineQueue());
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearOfflineQueue = () => {
    clearOfflineQueue();
    setQueuedReports([]);
    setIssues((prev) => prev.filter((i) => !i.isOfflineQueued));
  };

  // Map Click-to-Report: Open Report Wizard with pre-pinned location
  const handleQuickReportAtLocation = (lat: number, lng: number, address?: string) => {
    soundFX.playClick();
    setReportInitialLocation({
      lat,
      lng,
      address: address || `Near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
      district: 'Bengaluru Metropolitan Ward',
    });
    setCurrentTab('report');
  };

  // Map 1-Click Instant Hazard Report Handler
  const handleInstantQuickReport = (
    category: IssueCategory,
    lat: number,
    lng: number,
    address: string
  ) => {
    soundFX.playSuccess();
    const newId = `issue-${Date.now()}`;
    const newCode = `#CFX-${Math.floor(1000 + Math.random() * 9000)}`;
    const categoryTitles: Record<string, string> = {
      Roads: 'Road Damage & Pothole Hazard',
      Utilities: 'Utility & Streetlight Grid Malfunction',
      Sanitation: 'Unsegregated Solid Waste Accumulation',
      Parks: 'Public Park Infrastructure Damage',
      Traffic: 'Traffic Signal & Intersection Obstruction',
    };

    const newIssue: CivicIssue = {
      id: newId,
      code: newCode,
      title: categoryTitles[category] || `${category} Civic Incident`,
      description: `Rapid 1-click citizen report logged at ${address}. Verified via GPS coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}).`,
      category,
      district: 'BBMP Municipal Ward',
      address,
      location: { lat, lng },
      status: 'open',
      reportedDaysAgo: 'Just now',
      reportedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      severity: 'High',
      upvotes: 1,
      hasUpvoted: true,
      mergedReportsCount: 1,
      reportedBy: {
        name: activeUser.name,
        avatar: activeUser.avatar,
      },
      timeElapsed: 'Just now',
      timeline: [
        {
          id: `t-${Date.now()}`,
          title: 'Rapid Hazard Report Logged',
          timestamp: 'Just now',
          actor: 'Citizen 1-Click Map GPS Verification',
          completed: true,
          isCurrent: true,
        },
      ],
      comments: [],
      verificationVotes: {
        stillThere: 1,
        isFixed: 0,
      },
    };

    setIssues((prev) => [newIssue, ...prev]);
    setSelectedIssue(newIssue);

    // Sync to backend
    apiClient.createIssue({
      title: newIssue.title,
      description: newIssue.description,
      category: newIssue.category,
      district: newIssue.district,
      address: newIssue.address,
      location: newIssue.location,
      imageUrl: newIssue.imageUrl,
      severity: newIssue.severity,
      reporterName: activeUser.name,
    }, {
      userRole,
      userName: activeUser.name,
      userEmail,
    }).catch((err) => console.warn('Instant report server sync error:', err));

    // Award +40 Civic Credits
    setContributors((prev) =>
      prev.map((c) =>
        c.isCurrentUser
          ? {
              ...c,
              civicCredits: c.civicCredits + 40,
              issuesResolved: c.issuesResolved + 1,
            }
          : c
      )
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: 'reward',
        title: 'Rapid Report Logged: +40 CC Awarded!',
        desc: `Your 1-click report for ${newIssue.title} at ${address} has been dispatched to municipal field crews.`,
        time: 'Just now',
        unread: true,
        issueId: newIssue.id,
        ccAmount: 40,
      },
      ...prev,
    ]);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0050c8', '#10B981', '#f88400'],
    });
  };

  // Reopen Case Handler
  const handleConfirmReopen = (issueId: string, reason: string) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          return {
            ...item,
            status: 'investigating',
            escalationStatus: 'reopened',
            timeline: [
              ...item.timeline,
              {
                id: `t-${Date.now()}`,
                title: 'Case Reopened by Citizen',
                timestamp: 'Just now',
                actor: 'Field Quality Assurance Review',
                description: reason,
                completed: true,
                isCurrent: true,
              },
            ],
          };
        }
        return item;
      })
    );

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Case Reopened',
      desc: `Case #${issueId} re-queued for municipal quality audit.`,
      time: 'Just now',
      unread: true,
      type: 'dispatch',
      issueId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Higher-Up Grievance Petition Filing Handler
  const handleCreateGrievance = (
    issueId: string,
    data: { officialId: string; officialName: string; reason: string; severity: 'Urgent' | 'High' | 'Critical' }
  ) => {
    const targetIssue = issues.find((i) => i.id === issueId);
    const targetOfficial = officials.find((o) => o.id === data.officialId) || officials[0];
    const petitionNumber = `GRV-${Math.floor(10000 + Math.random() * 90000)}`;

    const newGrievance: GrievancePetition = {
      id: `grv-${Date.now()}`,
      petitionNumber,
      issueId,
      issueCode: targetIssue?.code || '#CFX-UNKNOWN',
      issueTitle: targetIssue?.title || 'Civic Infrastructure Hazard',
      citizenName: activeUser.name,
      targetHigherUpId: targetOfficial.id,
      targetHigherUpName: targetOfficial.name,
      targetHigherUpRole: targetOfficial.role,
      filedAt: 'Just now',
      severity: data.severity,
      dissatisfactionReason: data.reason,
      escalationType: 'poor_quality_fix',
      status: 'under_review',
    };

    setGrievances((prev) => [newGrievance, ...prev]);

    // Sync petition with Express backend
    apiClient.filePetition({
      issueId,
      issueCode: targetIssue?.code || '#CFX-UNKNOWN',
      issueTitle: targetIssue?.title || 'Civic Infrastructure Hazard',
      citizenName: activeUser.name,
      targetHigherUpId: targetOfficial.id,
      targetHigherUpName: targetOfficial.name,
      targetHigherUpRole: targetOfficial.role,
      dissatisfactionReason: data.reason,
      escalationType: 'poor_quality_fix',
      severity: data.severity,
    }, {
      userRole,
      userName: activeUser.name,
      userEmail,
    }).catch((err) => console.warn('Petition sync error:', err));

    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          return {
            ...item,
            escalationStatus: 'escalated_to_higher_up',
            activePetitionId: newGrievance.id,
            timeline: [
              ...item.timeline,
              {
                id: `t-${Date.now()}`,
                title: `Grievance Escalated to ${targetOfficial.name}`,
                timestamp: 'Just now',
                actor: `Petition ${petitionNumber}`,
                description: `Formal grievance filed with ${targetOfficial.role}. Executive intervention requested.`,
                completed: true,
                isCurrent: true,
              },
            ],
          };
        }
        return item;
      })
    );

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Higher-Up Petition Registered',
      desc: `Petition ${petitionNumber} submitted to ${targetOfficial.name}. Guaranteed 24hr review.`,
      time: 'Just now',
      unread: true,
      type: 'dispatch',
      issueId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Appointment Booking Handler
  const handleCreateAppointment = (apptData: {
    officialId: string;
    officialName: string;
    officialRole: string;
    department: string;
    citizenName: string;
    citizenPhone: string;
    citizenEmail: string;
    date: string;
    timeSlot: string;
    meetingMode: 'in-person' | 'video' | 'phone';
    locationOrLink: string;
    agenda: string;
    issueId?: string;
    issueCode?: string;
  }) => {
    const newAppointment: MunicipalAppointment = {
      id: `appt-${Date.now()}`,
      ...apptData,
      status: 'confirmed',
      createdAt: 'Just now',
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Sync appointment with Express backend
    apiClient.bookAppointment({
      issueId: apptData.issueId,
      issueCode: apptData.issueCode,
      issueTitle: `Case #${apptData.issueCode || 'Civic Issue'} Redressal`,
      citizenName: apptData.citizenName,
      citizenPhone: apptData.citizenPhone,
      citizenEmail: apptData.citizenEmail,
      officialId: apptData.officialId,
      officialName: apptData.officialName,
      officialRole: apptData.officialRole,
      department: apptData.department,
      date: apptData.date,
      timeSlot: apptData.timeSlot,
      meetingMode: apptData.meetingMode,
      locationOrLink: apptData.locationOrLink,
      agenda: apptData.agenda,
    }, {
      userRole,
      userName: activeUser.name,
      userEmail,
    }).catch((err) => console.warn('Appointment booking sync error:', err));

    if (apptData.issueId) {
      setIssues((prev) =>
        prev.map((item) => {
          if (item.id === apptData.issueId) {
            return {
              ...item,
              escalationStatus: 'appointment_booked',
              appointmentDetails: {
                date: apptData.date,
                time: apptData.timeSlot,
                department: apptData.department,
                officerName: apptData.officialName,
              },
            };
          }
          return item;
        })
      );
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Official Consultation Booked',
      desc: `Meeting with ${apptData.officialName} confirmed for ${apptData.date} at ${apptData.timeSlot}.`,
      time: 'Just now',
      unread: true,
      type: 'dispatch',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Escalate Modal Appointment Wrapper
  const handleConfirmAppointmentModal = (
    issueId: string,
    appt: { date: string; time: string; department: string; officerName: string; meetingMode?: 'in-person' | 'video' | 'phone' }
  ) => {
    const targetIssue = issues.find((i) => i.id === issueId);
    const targetOfficial = officials.find((o) => o.name === appt.officerName) || officials[0];

    handleCreateAppointment({
      officialId: targetOfficial.id,
      officialName: targetOfficial.name,
      officialRole: targetOfficial.role,
      department: appt.department,
      citizenName: activeUser.name,
      citizenPhone: '(555) 349-2018',
      citizenEmail: 'citizen@civicfix.org',
      date: appt.date,
      timeSlot: appt.time,
      meetingMode: appt.meetingMode || 'in-person',
      locationOrLink: targetOfficial.officeLocation,
      agenda: `Case #${targetIssue?.code || issueId} resolution review consultation.`,
      issueId,
      issueCode: targetIssue?.code,
    });
  };

  // Admin Actions Handlers
  const handleAdminUpdateIssueStatus = (
    issueId: string,
    status: IssueStatus,
    officialNote?: string,
    repairImageUrl?: string
  ) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          const updatedTimeline = [
            ...item.timeline,
            {
              id: `t-${Date.now()}`,
              title: status === 'fixed' ? 'Repairs Certified Fixed by Field Supervisor' : `Status Updated to ${status}`,
              timestamp: 'Just now',
              actor: 'City Operations Center',
              description: officialNote,
              completed: true,
              isCurrent: true,
            },
          ];

          return {
            ...item,
            status,
            repairedImageUrl: repairImageUrl || item.repairedImageUrl,
            timeline: updatedTimeline,
          };
        }
        return item;
      })
    );

    // Sync with Express backend
    apiClient.updateStatus(issueId, status, officialNote, repairImageUrl, {
      userRole: 'admin',
      userName: 'BBMP Municipal Officer',
    }).catch((err) => console.warn('Admin status sync error:', err));
  };

  const handleAdminAssignCrew = (issueId: string, crewName: string) => {
    setIssues((prev) =>
      prev.map((item) => (item.id === issueId ? { ...item, assignedCrew: crewName } : item))
    );
  };

  const handleAdminUpdateGrievanceStatus = (
    grievanceId: string,
    status: GrievancePetition['status'],
    adminRemark: string
  ) => {
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === grievanceId ? { ...g, status, adminRemarks: adminRemark } : g
      )
    );
  };

  const handleAdminUpdateAppointmentStatus = (
    appointmentId: string,
    status: MunicipalAppointment['status'],
    _note?: string
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
    );
  };

  // Admin Direct Database Handlers
  const handleAdminUpdateIssue = async (issueId: string, updates: Partial<CivicIssue>) => {
    try {
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issueId || item.code?.toLowerCase() === issueId.toLowerCase()
            ? { ...item, ...updates }
            : item
        )
      );
      await apiClient.updateIssue(issueId, updates, {
        userRole: 'admin',
        userName: activeUser?.name || 'Administrator',
      });
      soundFX.playSuccess();
      triggerVibration([40, 40]);
    } catch (err) {
      console.error('Failed to update issue in PostgreSQL:', err);
    }
  };

  const handleAdminDeleteIssue = async (issueId: string) => {
    try {
      const targetIssue = issues.find(
        (item) => item.id === issueId || item.code?.toLowerCase() === issueId.toLowerCase()
      );
      const trackingCode = targetIssue?.code || issueId;

      setIssues((prev) =>
        prev.filter((item) => item.id !== issueId && item.code?.toLowerCase() !== issueId.toLowerCase())
      );
      if (selectedIssue && (selectedIssue.id === issueId || selectedIssue.code?.toLowerCase() === issueId.toLowerCase())) {
        setSelectedIssue(null);
      }

      await apiClient.deleteIssue(trackingCode, {
        userRole: 'admin',
        userName: activeUser?.name || 'Administrator',
      });
      soundFX.playClick();
      triggerVibration([50]);

      const deleteNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        type: 'status_change',
        title: 'Issue Deleted from PostgreSQL',
        desc: `Record #${trackingCode} was permanently removed from Cloud SQL by Administrator.`,
        time: 'Just now',
        unread: true,
      };
      setNotifications((prev) => [deleteNotif, ...prev]);
    } catch (err) {
      console.error('Failed to delete issue in PostgreSQL:', err);
    }
  };

  const handleAdminReseedDatabase = async () => {
    try {
      await apiClient.reseedDatabase();
      await syncWithDatabase(false);
      soundFX.playSuccess();
      triggerVibration([60, 50, 60]);
    } catch (err) {
      console.error('Failed to reseed database:', err);
    }
  };

  const handleAdminAddOfficial = (newOfficial: Omit<HigherUpOfficial, 'id'>) => {
    const created: HigherUpOfficial = {
      ...newOfficial,
      id: `official-${Date.now()}`,
    };
    setOfficials((prev) => {
      const updated = [created, ...prev];
      saveStoredOfficials(updated);
      return updated;
    });
    soundFX.playSuccess();
    confetti({ particleCount: 40 });
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Higher-Up Authority Registered',
      desc: `${newOfficial.name} (${newOfficial.role}) added with contact details and appointment schedule.`,
      time: 'Just now',
      unread: true,
      type: 'dispatch',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleAdminUpdateOfficial = (officialId: string, updates: Partial<HigherUpOfficial>) => {
    setOfficials((prev) => {
      const updated = prev.map((o) => (o.id === officialId ? { ...o, ...updates } : o));
      saveStoredOfficials(updated);
      return updated;
    });
    soundFX.playSuccess();
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Official Profile & Appointments Updated',
      desc: `Details and schedule have been updated in the municipal registry.`,
      time: 'Just now',
      unread: true,
      type: 'dispatch',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleAdminDeleteOfficial = (officialId: string) => {
    setOfficials((prev) => {
      const updated = prev.filter((o) => o.id !== officialId);
      saveStoredOfficials(updated);
      return updated;
    });
    soundFX.playClick();
  };

  const handleAdminBookAppointmentForOfficial = (appointmentData: Omit<MunicipalAppointment, 'id' | 'createdAt'>) => {
    const newAppointment: MunicipalAppointment = {
      ...appointmentData,
      id: `appt-adm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [newAppointment, ...prev]);
    soundFX.playSuccess();
    confetti({ particleCount: 30 });
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Official Appointment Scheduled',
      desc: `Consultation with ${appointmentData.officialName} set for ${appointmentData.date} at ${appointmentData.timeSlot} (${appointmentData.citizenName}).`,
      time: 'Just now',
      unread: true,
      type: 'dispatch',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleReloadDbData = async () => {
    await syncWithDatabase(false);
  };

  // Redeem Perk in Perks Shop
  const handleRedeemPerk = (_perkName: string, cost: number) => {
    if (activeUser.civicCredits >= cost) {
      setContributors((prev) =>
        prev.map((c) =>
          c.isCurrentUser ? { ...c, civicCredits: c.civicCredits - cost } : c
        )
      );
    }
  };

  // Filtered Issues for Recent Activity / Feed
  const filteredIssues = issues.filter((issue) => {
    const matchesCategory =
      selectedCategory === 'All Issues' ||
      issue.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      mapStatusFilter === 'all' || issue.status === mapStatusFilter;

    return matchesCategory && matchesSearch && matchesStatus;
  });

  // ================= HOMEPAGE FOR THE PEOPLE & CITIZEN AUTHENTICATION HUB =================
  // Provides the full citizen landing portal with embedded Login & Registration
  if (!isLoggedIn) {
    return (
      <div
        id="civicfix-people-homepage-wrapper"
        className="min-h-screen bg-[#f8f9ff] dark:bg-[#121620] text-[#121c28] dark:text-gray-100 flex flex-col font-sans selection:bg-[#1d68f2] selection:text-white"
      >
        <AudibleSubtitleBar />
        <PeopleHomepage
          onAuthSuccess={handleAuthSuccess}
          onOpenHotlines={() => setShowEmergencyModal(true)}
          isLoggedIn={false}
          currentUser={activeUser}
          onOpenPrivacy={() => {
            setPrivacyTermsTab('privacy');
            setShowPrivacyTermsModal(true);
          }}
          onOpenTerms={() => {
            setPrivacyTermsTab('terms');
            setShowPrivacyTermsModal(true);
          }}
          onOpenContact={() => {
            setPrivacyTermsTab('contact');
            setShowPrivacyTermsModal(true);
          }}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        />
        {showEmergencyModal && (
          <EmergencyHotlinesModal
            onClose={() => setShowEmergencyModal(false)}
            onNavigateToMapWithPlace={handleNavigateToMapWithEmergencyPlace}
          />
        )}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          issues={issues}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
          onNavigateTab={(tab) => {
            if (tab === 'feed') setCurrentTab('portal');
            else if (tab === 'map') setCurrentTab('activity');
            else if (tab === 'report') setCurrentTab('report');
            else if (tab === 'leaderboard') setCurrentTab('ranks');
            else if (tab === 'admin') setCurrentTab('admin');
          }}
          onOpenHotlines={() => setShowEmergencyModal(true)}
          onToggleTheme={() => setIsDarkMode((prev) => !prev)}
          isDarkMode={isDarkMode}
          onOpenPrivacy={() => {
            setPrivacyTermsTab('privacy');
            setShowPrivacyTermsModal(true);
          }}
          onOpenTerms={() => {
            setPrivacyTermsTab('terms');
            setShowPrivacyTermsModal(true);
          }}
          onOpenFaq={() => {
            setPrivacyTermsTab('terms');
            setShowPrivacyTermsModal(true);
          }}
          onOpenApiModal={userRole === 'admin' ? () => setShowFreeApiModal(true) : undefined}
          userRole={userRole}
        />
        <CookieBanner
          onOpenPrivacy={() => {
            setPrivacyTermsTab('privacy');
            setShowPrivacyTermsModal(true);
          }}
        />
        <PrivacyTermsModal
          isOpen={showPrivacyTermsModal}
          onClose={() => setShowPrivacyTermsModal(false)}
          defaultTab={privacyTermsTab}
        />
        <BackToTopAndSupport
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenHotlines={() => setShowEmergencyModal(true)}
          onOpenFaq={() => {
            setPrivacyTermsTab('terms');
            setShowPrivacyTermsModal(true);
          }}
        />
        <UndoToast toast={undoToast} onDismiss={() => setUndoToast(null)} />
      </div>
    );
  }

  return (
    <div
      id="civicfix-app-root"
      className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b0f17] text-[#121c28] dark:text-[#f1f5f9] flex flex-col font-sans selection:bg-[#1d68f2] selection:text-white"
    >
      {/* Radical Accessibility Audible Narration Subtitle Bar */}
      <AudibleSubtitleBar />

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'report') {
            requireAuth(
              () => {
                setSelectedIssue(null);
                setNavigatingIssue(null);
                setCurrentTab('report');
              },
              'citizen',
              'Please sign in or register to submit an infrastructure hazard report.'
            );
          } else if (tab === 'admin') {
            requireAuth(
              () => {
                setSelectedIssue(null);
                setNavigatingIssue(null);
                setCurrentTab('admin');
              },
              'admin',
              'Official Municipal Administrator credentials required to access Dispatch Operations.'
            );
          } else {
            setSelectedIssue(null);
            setNavigatingIssue(null);
            setCurrentTab(tab);
          }
        }}
        currentUser={activeUser}
        userRole={userRole}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={(mode) => handleOpenAuthModal(mode)}
        onToggleUserRole={handleToggleUserRole}
        onOpenProfile={() => {
          if (!isLoggedIn) {
            handleOpenAuthModal('login', 'citizen', 'Please sign in or register to access your Civic Profile.');
          } else {
            setShowProfileModal(true);
          }
        }}
        onOpenEmergencyModal={() => setShowEmergencyModal(true)}
        onOpenDbDiagnostics={() => setShowDbDiagnosticsModal(true)}
        onOpenApiModal={() => setShowFreeApiModal(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
        isOnline={isOnlineState}
        queuedReports={queuedReports}
        isSyncing={isSyncingOffline}
        onSyncNow={handleSyncOfflineQueue}
        onToggleSimulateOffline={handleToggleSimulateOffline}
        isSimulatingOffline={isSimulatedOfflineState}
        onRemoveQueuedReport={handleRemoveQueuedReport}
        onClearQueue={handleClearOfflineQueue}
        onAddTestReport={handleAddTestOfflineReport}
        lastSyncTime={lastSyncTime}
        isLiveSyncing={isLiveSyncing}
        autoSyncEnabled={autoSyncEnabled}
        autoSyncIntervalSec={autoSyncIntervalSec}
        onToggleAutoSync={() => setAutoSyncEnabled((prev) => !prev)}
        onChangeSyncInterval={(sec) => setAutoSyncIntervalSec(sec)}
      />

      {/* Main Content Area */}
      <div
        id="main-content-layout"
        className={`flex-1 w-full transition-all duration-200 ${
          !isOnlineState ? 'pt-28 sm:pt-24' : 'pt-16'
        }`}
      >
        {/* VIEW 1: ACTIVE REAL-TIME NAVIGATION MODE */}
        {navigatingIssue ? (
          <NavigationMode
            targetIssue={navigatingIssue}
            allIssues={issues}
            onClose={() => setNavigatingIssue(null)}
            onArrived={(issue) => {
              setNavigatingIssue(null);
              setSelectedIssue(issue);
            }}
          />
        ) : selectedIssue ? (
          /* VIEW 2: FULL ISSUE DETAILS VIEW */
          <IssueDetailModal
            issue={selectedIssue}
            onBack={() => setSelectedIssue(null)}
            onNavigate={(issue) => setNavigatingIssue(issue)}
            onVoteResolution={handleVoteResolution}
            onOpenEscalate={(issue, mode) =>
              requireAuth(
                () => setEscalateState({ isOpen: true, issue, mode }),
                'citizen',
                'Please sign in or register to file a municipal escalation.'
              )
            }
            onOpenWorkOrder={(issue) => setWorkOrderIssue(issue)}
            onUpvote={handleUpvote}
            onAddComment={handleAddComment}
          />
        ) : currentTab === 'portal' ? (
          /* VIEW: HOMEPAGE FOR THE PEOPLE (PUBLIC CITIZEN REDRESSAL HUB) */
          <PeopleHomepage
            onAuthSuccess={handleAuthSuccess}
            onOpenHotlines={() => setShowEmergencyModal(true)}
            isLoggedIn={isLoggedIn}
            currentUser={activeUser}
            onGoToDashboard={() => setCurrentTab('home')}
            issues={issues}
            onSelectIssue={(issue) => {
              setSelectedIssue(issue);
              setCurrentTab('home');
            }}
            onOpenPrivacy={() => {
              setPrivacyTermsTab('privacy');
              setShowPrivacyTermsModal(true);
            }}
            onOpenTerms={() => {
              setPrivacyTermsTab('terms');
              setShowPrivacyTermsModal(true);
            }}
            onOpenContact={() => {
              setPrivacyTermsTab('contact');
              setShowPrivacyTermsModal(true);
            }}
            onOpenCommandPalette={() => setShowCommandPalette(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode((prev) => !prev)}
          />
        ) : currentTab === 'admin' ? (
          /* VIEW 3: ADMIN PERSON / COMMISSIONER OPERATIONS DASHBOARD */
          <AdminPortal
            issues={issues}
            appointments={appointments}
            grievances={grievances}
            officials={officials}
            adminUser={activeUser}
            onUpdateIssueStatus={handleAdminUpdateIssueStatus}
            onAssignCrew={handleAdminAssignCrew}
            onUpdateGrievanceStatus={handleAdminUpdateGrievanceStatus}
            onUpdateAppointmentStatus={handleAdminUpdateAppointmentStatus}
            onOpenIssueDetail={(issue) => setSelectedIssue(issue)}
            onOpenDbDiagnostics={() => setShowDbDiagnosticsModal(true)}
            onOpenApiModal={() => setShowFreeApiModal(true)}
            onUpdateIssue={handleAdminUpdateIssue}
            onDeleteIssue={handleAdminDeleteIssue}
            onReseedDatabase={handleAdminReseedDatabase}
            onSyncDatabase={() => syncWithDatabase(true)}
            onAddOfficial={handleAdminAddOfficial}
            onUpdateOfficial={handleAdminUpdateOfficial}
            onDeleteOfficial={handleAdminDeleteOfficial}
            onBookOfficialAppointment={handleAdminBookAppointmentForOfficial}
            lastSyncTime={lastSyncTime}
            isLiveSyncing={isLiveSyncing}
          />
        ) : currentTab === 'report' ? (
          /* VIEW 5: 3-STEP REPORT WIZARD */
          <ReportWizard
            onCancel={() => {
              setCurrentTab('home');
              setReportInitialLocation(null);
            }}
            onSubmit={handleReportSubmit}
            existingIssues={issues}
            initialLocation={reportInitialLocation || undefined}
            currentUser={activeUser}
            userEmail={userEmail}
            userPhone={userPhone}
            userRole={userRole}
            onContactVerified={(email, phone) => {
              if (email) setUserEmail(email);
              if (phone) setUserPhone(phone);
              setContributors((prev) =>
                prev.map((c) =>
                  c.isCurrentUser
                    ? {
                        ...c,
                        email: email || c.email,
                        phone: phone || c.phone,
                        emailVerified: true,
                        phoneVerified: true,
                        contactVerified: true,
                        firstReportSubmitted: true,
                      }
                    : c
                )
              );
            }}
            onMergeUpvote={(issueId) => {
              handleUpvote(issueId);
              setContributors((prev) =>
                prev.map((c) =>
                  c.isCurrentUser
                    ? { ...c, civicCredits: c.civicCredits + 10, impactPoints: c.impactPoints + 10 }
                    : c
                )
              );
              const target = issues.find((i) => i.id === issueId);
              if (target) {
                setSelectedIssue(target);
              }
              setCurrentTab('home');
            }}
          />
        ) : currentTab === 'ranks' ? (
          /* VIEW 6: LEADERBOARD & RANKS */
          <LeaderboardView
            contributors={contributors}
            currentUser={activeUser}
            quests={quests}
            onRedeemPerk={handleRedeemPerk}
            onClaimQuestReward={handleClaimQuestReward}
          />
        ) : currentTab === 'activity' ? (
          /* VIEW 7: COMPREHENSIVE ACTIVITY FEED WITH FILTERS */
          <main
            id="activity-feed-main"
            className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-28 space-y-6 animate-in fade-in duration-200"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#121c28] tracking-tight">
                  Civic Activity Feed
                </h1>
                <p className="text-xs md:text-sm text-[#424655] mt-0.5">
                  Browse, upvote, and navigate to reported infrastructure issues in your community.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#737686] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="activity-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search issues, streets, #ID..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#c2c6d7] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#1d68f2]"
                />
              </div>
            </div>

            {/* Issues List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onSelect={(item) => setSelectedIssue(item)}
                  onNavigate={(item) => setNavigatingIssue(item)}
                  onUpvote={(id) => handleUpvote(id)}
                />
              ))}
            </div>
          </main>
        ) : (
          /* VIEW 8: MAIN HOME DASHBOARD WITH INTERACTIVE MAP & SIDEBAR */
          <main
            id="home-dashboard-main"
            className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-28 space-y-6 animate-in fade-in duration-200"
          >
            {/* Top Overview & Role Status Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#121c28] tracking-tight">
                  City Infrastructure Radar
                </h1>
                <p className="text-xs md:text-sm text-[#424655] mt-0.5">
                  Real-time OpenStreetMap tracking, live navigation, and official municipal redressal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    requireAuth(
                      () => {
                        setAppointmentContext({});
                        setShowAppointmentModal(true);
                      },
                      'citizen',
                      'Please sign in or register to book an appointment with a City Official.'
                    )
                  }
                  className="px-3.5 py-2 bg-[#eef4ff] border border-[#dae2ff] text-[#0050c8] hover:bg-[#dae2ff] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Calendar className="w-4 h-4 text-[#0050c8]" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </div>

            {/* Live Real-time StreamBuilder & SSE Status Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 bg-white border border-[#c2c6d7] rounded-xl shadow-xs text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isStreamConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <span className="font-bold text-[#121c28]">
                  {isStreamConnected ? 'StreamBuilder SSE: Live Real-Time Feed Active' : 'Connecting to Live Civic Stream...'}
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  ({streamEventCount} events received)
                </span>
              </div>
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Zero-polling SSE • Instant sync on new reports, upvotes & comments</span>
              </div>
            </div>

            {/* Split Screen Layout: Map on left (2 cols), Stats/Filters on right (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Map Section (2 Columns) */}
              <div className="lg:col-span-2 space-y-4">
                <MapView
                  issues={filteredIssues}
                  selectedIssue={selectedIssue}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onNavigateIssue={(issue) => setNavigatingIssue(issue)}
                  onUpvote={handleUpvote}
                  statusFilter={mapStatusFilter}
                  onStatusFilterChange={(st) => setMapStatusFilter(st)}
                  onQuickReportAtLocation={handleQuickReportAtLocation}
                  onInstantQuickReport={handleInstantQuickReport}
                  userLocation={
                    userLiveLocation
                      ? {
                          lat: userLiveLocation.lat,
                          lng: userLiveLocation.lng,
                          accuracy: userLiveLocation.accuracy,
                        }
                      : undefined
                  }
                  pointAtLocationOnly={pointAtUserLocationOnly}
                  onTogglePointAtLocationOnly={(enabled) => setPointAtUserLocationOnly(enabled)}
                  userName={activeUser.name}
                  userAddress={userLiveLocation?.address}
                  flyToUserTrigger={flyToUserTrigger}
                  isLiveLocationActive={pointAtUserLocationOnly}
                  highlightEmergencyPlace={highlightedEmergencyPlace}
                  onSelectEmergencyPlace={(place) => setHighlightedEmergencyPlace(place)}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Sidebar Section (1 Column) */}
              <div className="space-y-6">
                {/* User Stats Card */}
                <div
                  id="home-user-stats-card"
                  className="bg-white rounded-2xl border border-[#c2c6d7] p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#737686] uppercase tracking-wider">
                      Your Civic Impact
                    </h3>
                    <button
                      id="home-leaderboard-link-btn"
                      onClick={() => setCurrentTab('ranks')}
                      className="text-xs font-semibold text-[#0050c8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Leaderboard</span>
                      <TrendingUp className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Civic Credits Box */}
                    <div className="bg-[#eef4ff] p-4 rounded-xl border border-[#dae2ff] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1d68f2] text-white flex items-center justify-center shadow-xs">
                          <Award className="w-5 h-5 text-amber-300" />
                        </div>
                        <span className="text-xs md:text-sm font-bold text-[#121c28]">
                          Civic Credits
                        </span>
                      </div>
                      <span className="text-xl md:text-2xl font-extrabold text-[#0050c8] font-mono">
                        {activeUser.civicCredits.toLocaleString()}
                      </span>
                    </div>

                    {/* Local Rank Box */}
                    <div className="bg-[#eef4ff] p-4 rounded-xl border border-[#dae2ff] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#ffdcc4] text-[#924c00] flex items-center justify-center shadow-xs">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-xs md:text-sm font-bold text-[#121c28]">
                          Local Rank
                        </span>
                      </div>
                      <span className="text-xl md:text-2xl font-extrabold text-[#f88400]">
                        #4
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div
                  id="home-quick-filters-card"
                  className="bg-white rounded-2xl border border-[#c2c6d7] p-6 shadow-sm"
                >
                  <h3 className="text-xs font-bold text-[#737686] uppercase tracking-wider mb-3">
                    Filter Issues
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['All Issues', 'Roads', 'Utilities', 'Parks', 'Traffic'].map((cat) => (
                      <button
                        key={cat}
                        id={`home-filter-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'border border-[#1d68f2] bg-[#1d68f2] text-white shadow-xs'
                            : 'border border-[#c2c6d7] bg-white text-[#424655] hover:bg-[#EDF4FF]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City Resolution Rate Card */}
                <CityStatsBanner />
              </div>
            </div>

            {/* Floating Action Button (FAB) for Reporting */}
            <button
              id="home-fab-report-button"
              onClick={() =>
                requireAuth(
                  () => setCurrentTab('report'),
                  'citizen',
                  'Please sign in or register to report an infrastructure hazard.'
                )
              }
              className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-[#0050c8] hover:bg-[#1d68f2] text-white rounded-full p-4 md:px-6 shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 z-30 ring-4 ring-white/50 cursor-pointer"
              aria-label="Report Issue"
            >
              <Plus className="w-6 h-6" />
              <span className="font-bold text-sm hidden md:inline">Report Issue</span>
            </button>
          </main>
        )}
      </div>

      {/* Bottom Mobile Navigation */}
      <BottomNav
        currentTab={currentTab}
        userRole={userRole}
        onTabChange={(tab) => {
          if (tab === 'report') {
            requireAuth(
              () => {
                setSelectedIssue(null);
                setNavigatingIssue(null);
                setCurrentTab('report');
              },
              'citizen',
              'Please sign in or register to submit an infrastructure hazard report.'
            );
          } else if (tab === 'admin') {
            requireAuth(
              () => {
                setSelectedIssue(null);
                setNavigatingIssue(null);
                setCurrentTab('admin');
              },
              'admin',
              'Official Municipal Administrator credentials required to access Dispatch Operations.'
            );
          } else {
            setSelectedIssue(null);
            setNavigatingIssue(null);
            setCurrentTab(tab);
          }
        }}
      />

      {/* MODAL 1: Escalate / Reopen / Higher-Up Modal */}
      {escalateState.isOpen && escalateState.issue && (
        <EscalateModal
          issue={escalateState.issue}
          mode={escalateState.mode}
          onClose={() =>
            setEscalateState({ isOpen: false, issue: null, mode: 'reopen' })
          }
          onConfirmReopen={handleConfirmReopen}
          onConfirmAppointment={handleConfirmAppointmentModal}
          onConfirmHigherUpEscalation={handleCreateGrievance}
        />
      )}

      {/* MODAL 3: Appointment Booking Modal */}
      {showAppointmentModal && (
        <AppointmentBookingModal
          officials={officials}
          issues={issues}
          selectedOfficial={appointmentContext.official}
          relatedIssue={appointmentContext.issue}
          onClose={() => {
            setShowAppointmentModal(false);
            setAppointmentContext({});
          }}
          onConfirmBooking={(data) => {
            handleCreateAppointment(data);
            setShowAppointmentModal(false);
            setAppointmentContext({});
          }}
        />
      )}

      {/* MODAL 4: User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={activeUser}
          userRole={userRole}
          email={userEmail}
          district={userDistrict}
          isLoggedIn={isLoggedIn}
          onClose={() => setShowProfileModal(false)}
          onOpenAuthModal={(mode) => handleOpenAuthModal(mode)}
          onSignOut={handleSignOut}
          onUpdateAvatar={handleUpdateUserAvatar}
        />
      )}

      {/* MODAL 5: Login & Registration Interface */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            pendingAuthActionRef.current = null;
            setResetTokenParam(null);
            setResetEmailParam(null);
          }}
          onAuthSuccess={handleAuthSuccess}
          initialMode={authModalMode}
          initialRole={authInitialRole}
          resetToken={resetTokenParam || undefined}
          resetEmail={resetEmailParam || undefined}
        />
      )}

      {/* MODAL 6: Immediate Emergency Hotlines (911, 311, Gas Leak, Hazmat, EMS) */}
      {showEmergencyModal && (
        <EmergencyHotlinesModal
          onClose={() => setShowEmergencyModal(false)}
          onNavigateToMapWithPlace={handleNavigateToMapWithEmergencyPlace}
        />
      )}

      {/* MODAL 7: Printable Municipal Work Order & Public QR Flyer */}
      {workOrderIssue && (
        <PrintableWorkOrderModal
          issue={workOrderIssue}
          onClose={() => setWorkOrderIssue(null)}
        />
      )}

      {/* MODAL 8: Onboarding Gateway & Role Selection (Screens 1 & 2) */}
      {showOnboardingGateway && (
        <OnboardingGatewayModal
          onClose={() => setShowOnboardingGateway(false)}
          initialDeviceMode={onboardingDeviceMode}
          onSelectRole={(role) => {
            setUserRole(role);
            setShowOnboardingGateway(false);
            if (role === 'admin') {
              setCurrentTab('admin');
            } else {
              setCurrentTab('home');
            }
          }}
          onOpenAuth={(role) => {
            setShowOnboardingGateway(false);
            setAuthInitialRole(role);
            setAuthModalMode('login');
            setShowAuthModal(true);
          }}
        />
      )}

      {/* MODAL 10: PostgreSQL Cloud SQL & Express Backend Diagnostics Inspector */}
      {showDbDiagnosticsModal && (
        <DatabaseDiagnosticsModal
          isOpen={showDbDiagnosticsModal}
          onClose={() => setShowDbDiagnosticsModal(false)}
          onDataModified={handleReloadDbData}
          onOpenApiModal={() => setShowFreeApiModal(true)}
        />
      )}

      {/* MODAL 11: Free APIs & Third-Party Integration Directory */}
      <FreeApiIntegrationsModal
        isOpen={showFreeApiModal}
        onClose={() => setShowFreeApiModal(false)}
        isDarkMode={isDarkMode}
      />

      {/* PWA Mobile & Desktop Install Prompt Banner */}
      <PWAInstallBanner />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        issues={issues}
        onSelectIssue={(issue) => setSelectedIssue(issue)}
        onNavigateTab={(tab) => {
          if (tab === 'feed') setCurrentTab('portal');
          else if (tab === 'map') setCurrentTab('activity');
          else if (tab === 'report') setCurrentTab('report');
          else if (tab === 'leaderboard') setCurrentTab('ranks');
          else if (tab === 'admin') setCurrentTab('admin');
        }}
        onOpenHotlines={() => setShowEmergencyModal(true)}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        isDarkMode={isDarkMode}
        onOpenPrivacy={() => {
          setPrivacyTermsTab('privacy');
          setShowPrivacyTermsModal(true);
        }}
        onOpenTerms={() => {
          setPrivacyTermsTab('terms');
          setShowPrivacyTermsModal(true);
        }}
        onOpenFaq={() => {
          setPrivacyTermsTab('terms');
          setShowPrivacyTermsModal(true);
        }}
        onOpenApiModal={userRole === 'admin' ? () => setShowFreeApiModal(true) : undefined}
        userRole={userRole}
      />

      {/* Cookie & Privacy Consent Banner */}
      <CookieBanner
        onOpenPrivacy={() => {
          setPrivacyTermsTab('privacy');
          setShowPrivacyTermsModal(true);
        }}
      />

      {/* Municipal Privacy & Terms Modal */}
      <PrivacyTermsModal
        isOpen={showPrivacyTermsModal}
        onClose={() => setShowPrivacyTermsModal(false)}
        defaultTab={privacyTermsTab}
      />

      {/* Back to Top and 24/7 Citizen Support Floating Speed Dial */}
      <BackToTopAndSupport
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenHotlines={() => setShowEmergencyModal(true)}
        onOpenFaq={() => {
          setPrivacyTermsTab('terms');
          setShowPrivacyTermsModal(true);
        }}
      />

      {/* Toast Notification with Undo Action */}
      <UndoToast toast={undoToast} onDismiss={() => setUndoToast(null)} />
    </div>
  );
}
