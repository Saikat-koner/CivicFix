import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Landmark,
  Bell,
  Trophy,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  Gift,
  Radio,
  Trash2,
  ExternalLink,
  Building2,
  ShieldAlert,
  UserCheck,
  Calendar,
  Layers,
  CloudOff,
  RefreshCw,
  Database,
  KeyRound,
  Search,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal
} from 'lucide-react';
import { Contributor, AppNotification, UserRole, QueuedOfflineReport } from '../types';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';

interface HeaderProps {
  currentTab: 'home' | 'portal' | 'report' | 'activity' | 'ranks' | 'admin';
  onTabChange: (tab: 'home' | 'portal' | 'report' | 'activity' | 'ranks' | 'admin') => void;
  currentUser: Contributor;
  userRole: UserRole;
  isLoggedIn?: boolean;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onToggleUserRole: () => void;
  onOpenProfile: () => void;
  onOpenHigherUpsHub?: () => void;
  onOpenEmergencyModal?: () => void;
  onOpenDbDiagnostics?: () => void;
  onOpenApiModal?: () => void;
  onOpenCommandPalette?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  notifications: AppNotification[];
  onNotificationClick: (notif: AppNotification) => void;
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
  isOnline?: boolean;
  queuedReports?: QueuedOfflineReport[];
  isSyncing?: boolean;
  onSyncNow?: () => void;
  onToggleSimulateOffline?: () => void;
  isSimulatingOffline?: boolean;
  onRemoveQueuedReport?: (id: string) => void;
  onClearQueue?: () => void;
  onAddTestReport?: () => void;
  lastSyncTime?: Date;
  isLiveSyncing?: boolean;
  autoSyncEnabled?: boolean;
  autoSyncIntervalSec?: number;
  onToggleAutoSync?: () => void;
  onChangeSyncInterval?: (intervalSec: number) => void;
}

export const Header = ({
  currentTab,
  onTabChange,
  currentUser,
  userRole,
  isLoggedIn = true,
  onOpenAuthModal,
  onToggleUserRole,
  onOpenProfile,
  onOpenHigherUpsHub,
  onOpenEmergencyModal,
  onOpenDbDiagnostics,
  onOpenApiModal,
  onOpenCommandPalette,
  isDarkMode = false,
  onToggleTheme,
  notifications,
  onNotificationClick,
  onMarkAllRead,
  onClearNotifications,
  isOnline = true,
  queuedReports = [],
  isSyncing = false,
  onSyncNow = () => {},
  onToggleSimulateOffline = () => {},
  isSimulatingOffline = false,
  onRemoveQueuedReport,
  onClearQueue,
  onAddTestReport,
  lastSyncTime,
  isLiveSyncing = false,
  autoSyncEnabled = true,
  autoSyncIntervalSec = 12,
  onToggleAutoSync,
  onChangeSyncInterval,
}: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotifFilter, setActiveNotifFilter] = useState<'all' | 'unread' | 'rewards'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Horizontal movable scroll & drag state
  const scrollRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const [notifCoords, setNotifCoords] = useState({ top: 64, right: 16 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftPosRef = useRef(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 6;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll]);

  // Re-check scroll on tab changes or unread count updates
  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [currentTab, userRole, checkScroll]);

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('#header-user-avatar-btn')) {
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftPosRef.current = el.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPosRef.current - walk;
  };

  const onMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('#header-user-avatar-btn')) {
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX - el.offsetLeft;
    scrollLeftPosRef.current = el.scrollLeft;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPosRef.current - walk;
  };

  const onTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (scrollRef.current.scrollWidth > scrollRef.current.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications && notifButtonRef.current) {
      const rect = notifButtonRef.current.getBoundingClientRect();
      setNotifCoords({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    setShowNotifications((prev) => !prev);
  };

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e: MouseEvent) => {
      const pop = document.getElementById('notifications-panel-popover');
      if (
        pop &&
        !pop.contains(e.target as Node) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeNotifFilter === 'unread') return n.unread;
    if (activeNotifFilter === 'rewards') return n.type === 'reward';
    return true;
  });

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121620]/95 backdrop-blur-md border-b border-[#c2c6d7]/60 dark:border-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors">
      <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 h-16 flex items-center gap-1.5 sm:gap-2.5 min-w-0 relative">
        {/* Brand Logo (Pinned on Left) */}
        <div
          id="brand-logo-btn"
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0 pr-2 border-r border-gray-100 dark:border-gray-800 z-10"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0050c8] text-white flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-[#1d68f2] transition-all shrink-0">
            <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[18px] sm:text-[21px] tracking-tight text-[#0050c8]">
              Civic<span className="text-[#121c28] dark:text-white">Fix</span>
            </span>
            <span className="hidden 2xl:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-[#EDF4FF] dark:bg-blue-900/40 text-[#0050c8] dark:text-blue-300 rounded-full border border-[#dae2ff] dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
              Live Hub
            </span>
          </div>
        </div>

        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            id="header-scroll-left-btn"
            type="button"
            onClick={() => scrollByAmount(-240)}
            className="shrink-0 p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 hover:border-[#0050c8] text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-700 transition-all cursor-pointer z-20 animate-in fade-in"
            title="Move Header Left (←)"
            aria-label="Scroll header left"
          >
            <ChevronLeft className="w-4 h-4 text-[#0050c8]" />
          </button>
        )}

        {/* Movable & Draggable Header Content Track */}
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUpOrLeave}
          onMouseLeave={onMouseUpOrLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          className="flex-1 overflow-x-auto scrollbar-none flex items-center justify-between gap-2.5 sm:gap-4 min-w-0 select-none cursor-grab active:cursor-grabbing px-1 py-1 touch-pan-x"
        >
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-[#f8f9ff] dark:bg-gray-800/60 p-1 rounded-full border border-[#c2c6d7]/40 dark:border-gray-700 shadow-inner shrink-0">
          <button
            id="nav-home-btn"
            onClick={() => onTabChange('home')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'home'
                ? 'bg-[#1d68f2] text-white shadow-sm'
                : 'text-[#424655] dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-700'
            }`}
          >
            <span className="hidden xl:inline">City Radar</span>
            <span className="xl:hidden">Radar</span>
          </button>
          <button
            id="nav-portal-btn"
            onClick={() => onTabChange('portal')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              currentTab === 'portal'
                ? 'bg-[#1d68f2] text-white shadow-sm'
                : 'text-[#424655] dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">Citizen Portal</span>
            <span className="xl:hidden">Portal</span>
          </button>
          <button
            id="nav-report-btn"
            onClick={() => onTabChange('report')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              currentTab === 'report'
                ? 'bg-[#1d68f2] text-white shadow-sm'
                : 'text-[#424655] dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">Report Issue</span>
            <span className="xl:hidden">Report</span>
          </button>
          <button
            id="nav-activity-btn"
            onClick={() => onTabChange('activity')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'activity'
                ? 'bg-[#1d68f2] text-white shadow-sm'
                : 'text-[#424655] dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-700'
            }`}
          >
            Activity
          </button>
          <button
            id="nav-ranks-btn"
            onClick={() => onTabChange('ranks')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              currentTab === 'ranks'
                ? 'bg-[#1d68f2] text-white shadow-sm'
                : 'text-[#424655] dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-700'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden xl:inline">Leaderboard</span>
            <span className="xl:hidden">Ranks</span>
          </button>
          <button
            id="nav-admin-btn"
            onClick={() => onTabChange('admin')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              currentTab === 'admin'
                ? 'bg-[#003180] text-white shadow-sm'
                : 'text-[#003180] dark:text-blue-300 hover:bg-[#EDF4FF] dark:hover:bg-gray-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#0050c8] dark:text-blue-300 shrink-0" />
            <span className="hidden xl:inline">Admin Command</span>
            <span className="xl:hidden">Admin</span>
          </button>
        </nav>

        {/* Right Section: Role Switcher, Emergency Hotlines, Credits Pill, Notifications, User Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Connection Status & Offline Queued Reports Indicator */}
          <ConnectionStatusIndicator
            isOnline={isOnline}
            queuedReports={queuedReports}
            isSyncing={isSyncing}
            onSyncNow={onSyncNow}
            onToggleSimulateOffline={onToggleSimulateOffline}
            isSimulatingOffline={isSimulatingOffline}
            onRemoveQueuedReport={onRemoveQueuedReport}
            onClearQueue={onClearQueue}
            onAddTestReport={onAddTestReport}
            lastSyncTime={lastSyncTime}
            isLiveSyncing={isLiveSyncing}
            autoSyncEnabled={autoSyncEnabled}
            autoSyncIntervalSec={autoSyncIntervalSec}
            onToggleAutoSync={onToggleAutoSync}
            onChangeSyncInterval={onChangeSyncInterval}
          />

          {/* ⌘K Quick Search Palette Launcher Button */}
          {onOpenCommandPalette && (
            <button
              id="header-command-palette-btn"
              onClick={onOpenCommandPalette}
              className="p-1.5 sm:px-2.5 xl:px-3 sm:py-1.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-all cursor-pointer shadow-2xs group flex items-center gap-1.5 shrink-0"
              title="Open Command Palette (⌘K or Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 shrink-0" />
              <span className="hidden 2xl:inline">Search</span>
              <kbd className="hidden 2xl:inline text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 font-bold">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Dark Mode Toggle Button */}
          {onToggleTheme && (
            <button
              id="header-theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-800 transition-all cursor-pointer shrink-0"
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}

          {/* Fullscreen Mode Toggle Button */}
          <button
            id="header-fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-800 transition-all cursor-pointer hidden md:flex items-center justify-center shrink-0"
            title={isFullscreen ? 'Exit Full Screen Mode (F11 or Esc)' : 'Enter Full Screen Mode (F11)'}
            aria-label="Toggle full screen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[#0050c8]" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Emergency 911 / Hotlines Button */}
          {onOpenEmergencyModal && (
            <button
              id="header-emergency-hotlines-btn"
              onClick={onOpenEmergencyModal}
              className="px-2 sm:px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-black border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
              title="Immediate Emergency Hotlines (911, 311, Gas Leak, Hazmat)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
              <span className="hidden 2xl:inline">Emergency / 911</span>
              <span className="2xl:hidden font-black">911</span>
            </button>
          )}

          {/* Database & Backend Diagnostics Button - ONLY in Admin Portal / Admin Mode */}
          {userRole === 'admin' && onOpenDbDiagnostics && (
            <button
              id="header-db-diagnostics-btn"
              onClick={onOpenDbDiagnostics}
              className="p-1.5 sm:px-2.5 xl:px-3 sm:py-1.5 rounded-full text-xs font-bold border border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-slate-700 dark:text-gray-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="Inspect PostgreSQL Database, Cloud SQL status & Express Backend"
            >
              <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden 2xl:inline">DB Studio</span>
            </button>
          )}

          {/* Free APIs & Integrations Directory Button - ONLY in Admin Portal / Admin Mode */}
          {userRole === 'admin' && onOpenApiModal && (
            <button
              id="header-free-apis-btn"
              onClick={onOpenApiModal}
              className="p-1.5 sm:px-2.5 xl:px-3 sm:py-1.5 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#0050c8] dark:text-blue-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="Where to get Free API keys: Gemini AI, Free Email, Free SMS & Maps"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden xl:inline">Free APIs</span>
            </button>
          )}

          {/* Persona / Role Switcher Toggle */}
          <button
            id="role-switcher-toggle-btn"
            onClick={onToggleUserRole}
            className={`px-2 sm:px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 ${
              userRole === 'admin'
                ? 'bg-[#003180] text-white border-[#003180] hover:bg-[#002460]'
                : 'bg-white dark:bg-gray-800 text-[#424655] dark:text-gray-200 border-[#c2c6d7] dark:border-gray-700 hover:border-[#0050c8] hover:text-[#0050c8]'
            }`}
            title="Switch between Citizen and City Admin Persona"
          >
            {userRole === 'admin' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                <span className="hidden 2xl:inline">Admin Mode:</span>
                <span className="text-white font-extrabold">Commissioner</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#0050c8] shrink-0" />
                <span className="hidden 2xl:inline">Role:</span>
                <span className="text-[#0050c8] font-extrabold">Citizen</span>
              </>
            )}
          </button>

          {/* Civic Credits Pill */}
          <div
            id="header-credits-badge"
            onClick={() => onTabChange('ranks')}
            className="hidden sm:flex items-center gap-1 bg-[#EDF4FF] dark:bg-blue-950/40 hover:bg-[#dfe9fa] px-2 sm:px-2.5 py-1.5 rounded-full border border-[#dae2ff] dark:border-blue-900 cursor-pointer transition-colors shadow-xs group shrink-0"
            title="View Civic Credits & Perks"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0050c8] group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-bold text-xs text-[#0050c8] tracking-tight">
              {currentUser.civicCredits.toLocaleString()}
              <span className="font-normal text-[10px] text-[#424655] dark:text-gray-400 hidden xl:inline ml-0.5">CC</span>
            </span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              ref={notifButtonRef}
              id="header-notifications-btn"
              onClick={toggleNotifications}
              className={`relative p-2 rounded-full transition-colors cursor-pointer ${
                showNotifications ? 'bg-[#EDF4FF] dark:bg-gray-800 text-[#0050c8]' : 'text-[#424655] dark:text-gray-300 hover:text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-800'
              }`}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div
                id="notifications-panel-popover"
                style={{ top: `${notifCoords.top}px`, right: `${notifCoords.right}px` }}
                className="fixed w-84 sm:w-96 bg-white dark:bg-[#151c28] rounded-2xl shadow-2xl border border-[#c2c6d7] dark:border-gray-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#121c28]">
                      Civic Alerts
                    </h4>
                    {unreadCount > 0 && (
                      <span className="bg-[#1d68f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllRead}
                        className="text-[11px] text-[#0050c8] font-semibold hover:underline flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-[11px] text-[#737686] hover:text-[#ba1a1a] p-1 rounded transition-colors"
                        title="Clear all alerts"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 mb-2 bg-[#f8f9ff] p-1 rounded-lg border border-[#c2c6d7]/30">
                  <button
                    onClick={() => setActiveNotifFilter('all')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                      activeNotifFilter === 'all'
                        ? 'bg-white text-[#0050c8] shadow-xs'
                        : 'text-[#737686] hover:text-[#121c28]'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveNotifFilter('unread')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                      activeNotifFilter === 'unread'
                        ? 'bg-white text-[#0050c8] shadow-xs'
                        : 'text-[#737686] hover:text-[#121c28]'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    onClick={() => setActiveNotifFilter('rewards')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                      activeNotifFilter === 'rewards'
                        ? 'bg-white text-[#0050c8] shadow-xs'
                        : 'text-[#737686] hover:text-[#121c28]'
                    }`}
                  >
                    Rewards
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredNotifs.length === 0 ? (
                    <div className="text-center py-6 text-[#737686] text-xs">
                      No notifications to display
                    </div>
                  ) : (
                    filteredNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onNotificationClick(n);
                          setShowNotifications(false);
                        }}
                        className={`p-3 rounded-xl text-xs transition-all cursor-pointer border relative group ${
                          n.unread
                            ? 'bg-[#EDF4FF] border-[#dae2ff] hover:bg-[#dfe9fa]'
                            : 'bg-white border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-white border border-[#c2c6d7]/50 shadow-2xs flex-shrink-0 mt-0.5">
                            {n.type === 'reward' ? (
                              <Gift className="w-3.5 h-3.5 text-amber-500" />
                            ) : n.type === 'dispatch' ? (
                              <Radio className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-[#0050c8]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h5 className="font-bold text-[#121c28] text-xs leading-snug">
                                {n.title}
                              </h5>
                              <span className="text-[10px] text-[#737686] whitespace-nowrap ml-1">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-[#424655] text-[11px] mt-0.5 leading-relaxed">
                              {n.desc}
                            </p>
                          </div>
                        </div>

                        {n.issueId && (
                          <div className="mt-2 flex items-center justify-end text-[10px] font-bold text-[#0050c8] gap-1 group-hover:underline">
                            <span>Open Issue</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Auth Button & User Profile Avatar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isLoggedIn ? (
              <button
                id="header-auth-action-btn"
                onClick={() => onOpenAuthModal('login')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#EDF4FF] hover:bg-[#dfe9fa] text-[#0050c8] border border-[#dae2ff] transition-all cursor-pointer shadow-2xs shrink-0"
                title="Sign in or Register"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <button
                id="header-auth-action-btn"
                onClick={() => onOpenAuthModal('login')}
                className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-[#424655] dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Switch Account"
              >
                <UserCheck className="w-3 h-3 text-[#0050c8]" />
                <span>Switch</span>
              </button>
            )}

            <div
              id="header-user-avatar-btn"
              onClick={onOpenProfile}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-[#1d68f2] shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all ring-2 ring-[#EDF4FF] dark:ring-gray-700 shrink-0"
              title="Open Civic Profile & Settings"
            >
              <img
                src={currentUser.avatar}
                alt="User profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            id="header-scroll-right-btn"
            type="button"
            onClick={() => scrollByAmount(240)}
            className="shrink-0 p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 hover:border-[#0050c8] text-[#0050c8] hover:bg-[#EDF4FF] dark:hover:bg-gray-700 transition-all cursor-pointer z-20 animate-in fade-in"
            title="Move Header Right (→)"
            aria-label="Scroll header right"
          >
            <ChevronRight className="w-4 h-4 text-[#0050c8]" />
          </button>
        )}
      </div>

      {/* Persistent Offline Ribbon Notification */}
      {!isOnline && (
        <div
          id="persistent-offline-header-ribbon"
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white px-4 py-1.5 text-xs font-bold shadow-xs border-t border-amber-600/30 transition-all"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CloudOff className="w-3.5 h-3.5 text-amber-100 animate-pulse shrink-0" />
              <span className="leading-tight text-[11px] sm:text-xs">
                <span className="font-black uppercase tracking-wide text-amber-100 mr-1.5">Offline Mode:</span>
                You are working offline.
                {queuedReports.length > 0 ? (
                  <span className="ml-1 text-white font-black bg-amber-900/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    {queuedReports.length} report{queuedReports.length > 1 ? 's' : ''} queued locally on device
                  </span>
                ) : (
                  <span className="ml-1 text-amber-100 font-normal">
                    Reports and votes are saved safely in your encrypted device cache.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {queuedReports.length > 0 ? (
                <button
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="bg-[#0b1320] hover:bg-black text-white px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : `Sync ${queuedReports.length} to Cloud`}</span>
                </button>
              ) : (
                <button
                  onClick={onToggleSimulateOffline}
                  className="text-amber-100 hover:text-white underline text-[11px] font-bold cursor-pointer"
                >
                  {isSimulatingOffline ? 'Disable Offline Simulation' : 'Attempt Reconnect'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
