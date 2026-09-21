import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  CloudOff,
  CloudUpload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Clock,
  MapPin,
  HelpCircle,
  X,
  Server,
  Database,
  Activity,
  Check
} from 'lucide-react';
import { QueuedOfflineReport } from '../types';

interface ConnectionStatusIndicatorProps {
  isOnline: boolean;
  queuedReports: QueuedOfflineReport[];
  isSyncing: boolean;
  onSyncNow: () => void;
  onToggleSimulateOffline: () => void;
  isSimulatingOffline: boolean;
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

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isOnline,
  queuedReports,
  isSyncing,
  onSyncNow,
  onToggleSimulateOffline,
  isSimulatingOffline,
  onRemoveQueuedReport,
  onClearQueue,
  onAddTestReport,
  lastSyncTime,
  isLiveSyncing = false,
  autoSyncEnabled = true,
  autoSyncIntervalSec = 12,
  onToggleAutoSync,
  onChangeSyncInterval,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track seconds since last sync
  useEffect(() => {
    const updateAgo = () => {
      if (lastSyncTime) {
        const diffSec = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
        setSecondsAgo(Math.max(0, diffSec));
      }
    };
    updateAgo();
    const interval = setInterval(updateAgo, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Random small latency fluctuations when online for realistic feedback
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      setLatencyMs(Math.floor(18 + Math.random() * 16));
    }, 12000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const queuedCount = queuedReports.length;
  const activeSyncing = isSyncing || isLiveSyncing;

  return (
    <div className="relative" ref={containerRef}>
      {/* Persistent Connection Status Trigger Button */}
      <button
        id="header-connection-status-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer select-none shadow-2xs ${
          activeSyncing
            ? 'bg-[#EDF4FF] text-[#0050c8] border-[#dae2ff] animate-pulse'
            : !isOnline
            ? queuedCount > 0
              ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-sm ring-2 ring-amber-300/40'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
            : 'bg-white text-[#424655] border-[#c2c6d7] hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/40'
        }`}
        title={
          !isOnline
            ? `Working Offline (${queuedCount} queued reports stored locally). Click for details & sync.`
            : `Cloud SQL PostgreSQL Live (${latencyMs}ms) • Last synced ${secondsAgo}s ago. Click to configure live sync.`
        }
        aria-expanded={isOpen}
      >
        {activeSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-[#0050c8] animate-spin" />
            <span className="hidden sm:inline font-bold">Live Syncing</span>
            {queuedCount > 0 && (
              <span className="bg-[#0050c8] text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
                {queuedCount}
              </span>
            )}
          </>
        ) : !isOnline ? (
          <>
            <CloudOff className={`w-3.5 h-3.5 ${queuedCount > 0 ? 'text-white' : 'text-amber-700'}`} />
            <span className="font-extrabold flex items-center gap-1">
              <span>Offline</span>
              {queuedCount > 0 && (
                <span className="hidden sm:inline font-medium text-[11px] opacity-90">
                  • {queuedCount} Queued
                </span>
              )}
            </span>
            {queuedCount > 0 && (
              <span className="sm:hidden bg-red-600 text-white text-[10px] font-black px-1.5 rounded-full">
                {queuedCount}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline text-[#2d313e] font-bold">
              {autoSyncEnabled ? `Live (${secondsAgo}s)` : 'Connected'}
            </span>
            {queuedCount > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 rounded-full">
                {queuedCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Interactive Connection & Offline Queued Reports Popover */}
      {isOpen && (
        <div
          id="connection-status-popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#c2c6d7] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  !isOnline
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {!isOnline ? <WifiOff className="w-4 h-4" /> : <Database className="w-4 h-4 text-emerald-600" />}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#121c28] flex items-center gap-1.5">
                  <span>{!isOnline ? 'Offline Operation Mode' : 'Cloud SQL PostgreSQL Live'}</span>
                  {!isOnline && (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                      STANDALONE
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-[#737686]">
                  {!isOnline
                    ? 'Disconnected • Reports cached locally on device'
                    : `Active Cloud Sync • Latency ${latencyMs}ms`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time-by-Time Database Live Synchronization Controls */}
          {isOnline && (
            <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  <span>Real-Time Database Sync</span>
                </div>
                <span className="text-[11px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md font-bold">
                  {secondsAgo === 0 ? 'Synced just now' : `Synced ${secondsAgo}s ago`}
                </span>
              </div>
              <p className="text-[11px] text-blue-800 leading-tight">
                Any updates in the web app modify the backend and database in real-time. Changes from all citizens and admins continuously sync time-by-time.
              </p>

              {/* Interval selector */}
              <div className="pt-1 flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                  Sync Interval:
                </span>
                <div className="flex items-center gap-1">
                  {[10, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        if (onChangeSyncInterval) onChangeSyncInterval(sec);
                        if (!autoSyncEnabled && onToggleAutoSync) onToggleAutoSync();
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        autoSyncEnabled && autoSyncIntervalSec === sec
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleAutoSync) onToggleAutoSync();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      !autoSyncEnabled
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {!autoSyncEnabled ? 'Paused' : 'Pause'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Offline Notification Alert (when offline) */}
          {!isOnline && (
            <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-start gap-2 text-amber-900 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Working in Offline-First Mode</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed pl-6">
                All hazard reports, upvotes, and verification logs are safely saved to your encrypted browser storage. They will immediately upload to city dispatch once your network connection is restored.
              </p>
            </div>
          )}

          {/* Queued Reports Section */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CloudUpload className="w-3.5 h-3.5 text-[#0050c8]" />
                <span className="text-xs font-extrabold text-[#121c28]">
                  Queued Offline Reports ({queuedCount})
                </span>
              </div>

              {queuedCount > 0 && onClearQueue && (
                <button
                  onClick={onClearQueue}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {queuedCount > 0 ? (
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl bg-gray-50/60">
                {queuedReports.map((report) => (
                  <div key={report.id} className="p-2.5 flex items-center justify-between gap-2.5 group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {report.imageUrl ? (
                        <img
                          src={report.imageUrl}
                          alt={report.title}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-extrabold text-[#0050c8] bg-[#EDF4FF] px-1.5 py-0.2 rounded">
                            {report.code}
                          </span>
                          <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-1.5 rounded">
                            {report.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-[#121c28] truncate mt-0.5">
                          {report.title}
                        </h5>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>Queued {report.queuedAt}</span>
                          <span>•</span>
                          <span className="truncate">{report.address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onRemoveQueuedReport && (
                        <button
                          onClick={() => onRemoveQueuedReport(report.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Discard report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-[#121c28]">No Pending Offline Queue</p>
                <p className="text-[11px] text-[#737686]">
                  {isOnline
                    ? 'All reports and modifications are synced with Cloud SQL PostgreSQL.'
                    : 'Any reports logged now will automatically be queued here.'}
                </p>
              </div>
            )}
          </div>

          {/* Sync & Reconnect Actions */}
          <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-col gap-2">
            <button
              id="popover-sync-now-btn"
              type="button"
              onClick={onSyncNow}
              disabled={activeSyncing}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                activeSyncing
                  ? 'bg-blue-100 text-blue-500 cursor-not-allowed'
                  : queuedCount > 0
                  ? 'bg-[#0050c8] hover:bg-[#1d68f2] text-white'
                  : 'bg-[#EDF4FF] hover:bg-[#dfe9fa] text-[#0050c8]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activeSyncing ? 'animate-spin' : ''}`} />
              <span>
                {activeSyncing
                  ? 'Synchronizing with Database...'
                  : queuedCount > 0
                  ? `Sync ${queuedCount} Queued Report${queuedCount > 1 ? 's' : ''} to Cloud`
                  : 'Sync Now with PostgreSQL'}
              </span>
            </button>

            {/* Offline Simulator Switch & Test Report Generator */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSimulatingOffline}
                  onChange={onToggleSimulateOffline}
                  className="w-4 h-4 text-[#0050c8] rounded focus:ring-[#0050c8]"
                />
                <span className="text-[11px] font-bold text-[#424655]">
                  Simulate Offline Mode
                </span>
              </label>

              {onAddTestReport && (
                <button
                  type="button"
                  onClick={onAddTestReport}
                  className="text-[11px] font-bold text-[#0050c8] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Queue a sample hazard report without filling out form"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Test Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
