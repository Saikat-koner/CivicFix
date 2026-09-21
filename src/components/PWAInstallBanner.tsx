import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Smartphone, Share, CheckCircle2, GripVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  // Movable / Draggable State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startPosX: number; startPosY: number } | null>(null);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isAppStandalone);

    // Check if user previously dismissed today
    const dismissedTimestamp = localStorage.getItem('civicfix_pwa_dismissed');
    if (dismissedTimestamp) {
      const hoursSince = (Date.now() - Number(dismissedTimestamp)) / (1000 * 60 * 60);
      if (hoursSince < 48) {
        setDismissed(true);
      }
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
      setTimeout(() => setDismissed(true), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback: show instructions or prompt
      setShowIOSInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccessfully(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('civicfix_pwa_dismissed', Date.now().toString());
  };

  // Pointer event handlers for moving/dragging the banner
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent drag when clicking on interactive controls
    if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) {
      return;
    }
    if (!bannerRef.current) return;

    const rect = bannerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
    };
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !bannerRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    const rect = bannerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Constrain inside viewport so it never goes off-screen
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
      dragStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Do not render if standalone already or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  // Positioning style: custom dragged position or responsive default
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
    <div
      ref={bannerRef}
      id="pwa-install-banner"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={style}
      className={`fixed ${
        !position ? 'bottom-20 sm:bottom-6 left-3 sm:left-6 max-w-[calc(100vw-24px)] sm:max-w-md z-30' : ''
      } bg-slate-900/95 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md select-none transition-shadow duration-150 ${
        isDragging
          ? 'cursor-grabbing scale-[1.02] shadow-blue-500/20 ring-2 ring-blue-500/60'
          : 'cursor-grab hover:border-slate-600'
      } animate-in slide-in-from-bottom-3 duration-300`}
      title="Click and drag anywhere to move"
    >
      {installedSuccessfully ? (
        <div className="flex items-center justify-between gap-3 text-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">CivicFix Installed!</span> App is now accessible directly from your home screen.
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Remove banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : showIOSInstructions ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-400">
              <Smartphone className="w-4 h-4" />
              <span>Add CivicFix to Home Screen</span>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Close guide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            1. Tap the <span className="inline-flex items-center gap-0.5 font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded"><Share className="w-3 h-3 text-blue-400" /> Share</span> button in Safari browser.<br />
            2. Scroll down and tap <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">Add to Home Screen</span>.<br />
            3. Tap <span className="font-bold text-blue-400">Add</span> in the top-right corner.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Drag Grip & App Icon */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5 rounded"
              title="Drag to reposition banner"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            <div className="min-w-0 pr-1">
              <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                <span className="truncate">Install CivicFix App</span>
                <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded font-bold border border-blue-400/20 shrink-0">
                  Fast & Offline
                </span>
              </div>
              <p className="text-[10.5px] sm:text-[11px] text-slate-300 truncate">
                Get native home screen access & offline radar
              </p>
            </div>
          </div>

          {/* Action Buttons: Install + Clear Remove/Dismiss */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="pwa-install-action-btn"
              onClick={handleInstallClick}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              type="button"
              id="pwa-banner-dismiss-btn"
              onClick={handleDismiss}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Remove / Dismiss banner"
              aria-label="Remove banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
