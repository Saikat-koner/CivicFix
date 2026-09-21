import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  HelpCircle,
  PhoneCall,
  Search,
  MessageSquare,
  ShieldCheck,
  X,
  Sparkles,
  Activity,
  GripVertical,
  EyeOff
} from 'lucide-react';

interface BackToTopAndSupportProps {
  onOpenCommandPalette: () => void;
  onOpenHotlines: () => void;
  onOpenFaq: () => void;
  onOpenTelemetry?: () => void;
}

export const BackToTopAndSupport: React.FC<BackToTopAndSupportProps> = ({
  onOpenCommandPalette,
  onOpenHotlines,
  onOpenFaq,
}) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSupportMenuOpen, setIsSupportMenuOpen] = useState(false);
  const [telemetryEvents, setTelemetryEvents] = useState(42);

  // Removable state
  const [isDismissed, setIsDismissed] = useState(false);

  // Movable / Draggable state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startPosX: number; startPosY: number; hasMoved: boolean } | null>(null);

  useEffect(() => {
    const hidden = localStorage.getItem('civicfix_support_fab_hidden');
    if (hidden === 'true') {
      setIsDismissed(true);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        setScrollProgress(progress);
      }
      setShowBackToTop(scrollY > 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDismissWidget = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem('civicfix_support_fab_hidden', 'true');
  };

  // Pointer event handlers for moving/dragging the support widget
  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking menu buttons or links, let click handle it
    if ((e.target as HTMLElement).closest('button:not(#citizen-support-fab), a, input')) {
      return;
    }
    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
      hasMoved: false,
    };
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !widgetRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStartRef.current.hasMoved = true;
    }

    const rect = widgetRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Constrain inside viewport
    const minX = 8;
    const maxX = Math.max(minX, window.innerWidth - width - 8);
    const minY = 8;
    const maxY = Math.max(minY, window.innerHeight - height - 8);

    const newX = Math.max(minX, Math.min(maxX, dragStartRef.current.startPosX + deltaX));
    const newY = Math.max(minY, Math.min(maxY, dragStartRef.current.startPosY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleFabClick = (e: React.MouseEvent) => {
    // If user dragged more than a few pixels, do not toggle menu
    if (dragStartRef.current?.hasMoved) {
      dragStartRef.current = null;
      return;
    }
    setIsSupportMenuOpen(!isSupportMenuOpen);
  };

  if (isDismissed) {
    return null;
  }

  // Positioning style
  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        bottom: 'auto',
        zIndex: 50,
      }
    : {};

  return (
    <>
      {/* 1. TOP-OF-PAGE SCROLL PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. FLOATING CITIZEN SUPPORT WIDGET & BACK TO TOP BUTTONS */}
      <div
        ref={widgetRef}
        id="citizen-support-floating-wrapper"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={style}
        className={`fixed ${
          !position ? 'bottom-20 sm:bottom-6 right-4 sm:right-6 z-40' : ''
        } flex flex-col items-end gap-2.5 select-none pointer-events-auto group ${
          isDragging ? 'cursor-grabbing scale-105 transition-none' : 'cursor-grab'
        }`}
        title="Drag anywhere to move"
      >
        {/* Support Speed Dial Sub-menu */}
        {isSupportMenuOpen && (
          <div className="bg-white dark:bg-[#1e2330] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-2.5 space-y-1.5 w-60 animate-in slide-in-from-bottom-3 duration-200 text-xs">
            <div className="px-2 py-1 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-[#121c28] dark:text-gray-100 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0050c8]" />
                <span>24/7 Citizen Redressal</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Online
                </span>
                <button
                  type="button"
                  onClick={handleDismissWidget}
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Remove / Hide support button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSupportMenuOpen(false);
                onOpenCommandPalette();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                <Search className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[11px]">⌘K Quick Search</div>
                <div className="text-[10px] text-gray-400">Search commands &amp; issues</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSupportMenuOpen(false);
                onOpenHotlines();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[11px]">Emergency 112 Dial</div>
                <div className="text-[10px] text-red-400">Direct police, fire &amp; ambulance</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSupportMenuOpen(false);
                onOpenFaq();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[11px]">Civic FAQs &amp; Redressal</div>
                <div className="text-[10px] text-gray-400">Resolution SLAs &amp; escalations</div>
              </div>
            </button>

            {/* Remove / Hide Button in Menu */}
            <button
              type="button"
              onClick={handleDismissWidget}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <EyeOff className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[11px]">Hide Support Widget</div>
                <div className="text-[9.5px] text-gray-400">Remove from screen</div>
              </div>
            </button>

            <div className="px-2 pt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span>Telemetry: Active</span>
              </span>
              <span>v2.4 Production</span>
            </div>
          </div>
        )}

        {/* Support Toggle Button and Quick Remove Badge */}
        <div className="relative flex items-center gap-1">
          {/* Quick Remove Button on hover */}
          <button
            type="button"
            onClick={handleDismissWidget}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-800/80 hover:bg-red-600 text-white shadow-md transition-all cursor-pointer"
            title="Remove / Hide widget"
            aria-label="Remove widget"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Support Toggle Button */}
          <button
            id="citizen-support-fab"
            type="button"
            onClick={handleFabClick}
            className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-grab active:cursor-grabbing ${
              isSupportMenuOpen
                ? 'bg-gray-900 text-white rotate-90'
                : 'bg-[#0050c8] hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
            }`}
            title="24/7 Citizen Support Speed Dial (drag to move)"
            aria-label="24/7 Citizen Support Speed Dial"
          >
            {isSupportMenuOpen ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </button>
        </div>

        {/* Back To Top Button */}
        {showBackToTop && (
          <button
            id="back-to-top-button"
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e2330] text-[#0050c8] dark:text-blue-400 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg hover:bg-blue-50 dark:hover:bg-gray-800 flex items-center justify-center transition-all animate-in fade-in duration-200 cursor-pointer"
            title="Back to Top"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
};
