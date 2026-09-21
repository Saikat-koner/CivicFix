import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X, AlertCircle } from 'lucide-react';

export interface UndoToastItem {
  id: string;
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

interface UndoToastProps {
  toast: UndoToastItem | null;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.durationMs || 5000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      id="undo-toast-notification"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-[#121c28] dark:bg-gray-900 text-white rounded-2xl shadow-2xl p-3.5 border border-gray-700 flex items-center justify-between gap-3 overflow-hidden relative">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium truncate">{toast.message}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              toast.onUndo();
              onDismiss();
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
