import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';

interface CaptchaBoxProps {
  onValidate: (isValid: boolean) => void;
  userInput: string;
  onChangeInput: (value: string) => void;
  idPrefix?: string;
  required?: boolean;
}

export const CaptchaBox: React.FC<CaptchaBoxProps> = ({
  onValidate,
  userInput,
  onChangeInput,
  idPrefix = 'auth-captcha',
  required = true,
}) => {
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate a random 5-character alphanumeric string (excluding confusing characters like 0, O, I, 1)
  const generateCaptchaText = (): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  };

  // Draw the captcha on canvas with security noise, strike-through lines, and rotation
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f1f5f9');
    gradient.addColorStop(0.5, '#e2e8f0');
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Security background noise lines
    const lineColors = ['#94a3b8', '#cbd5e1', '#64748b', '#3b82f6', '#f59e0b'];
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = lineColors[i % lineColors.length];
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.stroke();
    }

    // Security noise dots
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = lineColors[Math.floor(Math.random() * lineColors.length)];
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw each character with distinct angle and font styling
    const charSpacing = width / (text.length + 1);
    const textColors = ['#0f172a', '#1e3a8a', '#1d4ed8', '#047857', '#b91c1c', '#6b21a8'];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      ctx.save();
      const x = charSpacing * (i + 1) + (Math.random() * 4 - 2);
      const y = height / 2 + 7 + (Math.random() * 6 - 3);
      const angle = (Math.random() - 0.5) * 0.45; // -12 to +12 degrees

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = `bold ${22 + Math.floor(Math.random() * 4)}px 'Courier New', Courier, monospace`;
      ctx.fillStyle = textColors[i % textColors.length];
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 2;
      ctx.fillText(char, -8, 0);
      ctx.restore();
    }

    // Additional cross-through wavy line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, height / 2 + (Math.random() * 10 - 5));
    ctx.lineTo(width - 10, height / 2 + (Math.random() * 10 - 5));
    ctx.stroke();
  };

  const refreshCaptcha = () => {
    soundFX.playClick();
    const newText = generateCaptchaText();
    setCaptchaCode(newText);
    onChangeInput('');
    onValidate(false);
    setTimeout(() => drawCaptcha(newText), 10);
  };

  // Initial draw
  useEffect(() => {
    const text = generateCaptchaText();
    setCaptchaCode(text);
    setTimeout(() => drawCaptcha(text), 20);
  }, []);

  // Validate on input change
  useEffect(() => {
    if (!captchaCode) return;
    const isValid = userInput.trim() === captchaCode;
    onValidate(isValid);
  }, [userInput, captchaCode]);

  // Audio Speech Readout for Accessibility
  const speakCaptcha = () => {
    soundFX.playClick();
    if ('speechSynthesis' in window && captchaCode) {
      window.speechSynthesis.cancel();
      // Read each character spaced out clearly
      const spokenText = captchaCode
        .split('')
        .map((c) => (c === c.toUpperCase() ? `capital ${c}` : `small ${c}`))
        .join(', ');
      const utterance = new SpeechSynthesisUtterance(`Security code is: ${spokenText}`);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isMatched = userInput.trim() === captchaCode && captchaCode.length > 0;
  const isFailed = hasInteracted && userInput.trim().length >= 4 && !isMatched;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-input`}
          className="text-[11px] font-extrabold text-[#121c28] uppercase tracking-wider flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#0050c8]" />
          <span>Compulsory Security CAPTCHA</span>
          {required && <span className="text-red-500 font-black">*</span>}
        </label>
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          Anti-Bot Verification
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Visual Canvas Display */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-300 dark:border-gray-700 shrink-0">
          <canvas
            ref={canvasRef}
            width={140}
            height={38}
            className="rounded-lg shadow-inner bg-slate-100 cursor-pointer"
            onClick={refreshCaptcha}
            title="Click to refresh CAPTCHA code"
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={refreshCaptcha}
              className="p-1 rounded-md text-gray-600 hover:text-blue-600 hover:bg-white dark:text-gray-300 dark:hover:text-blue-400 transition-colors cursor-pointer"
              title="Generate new CAPTCHA"
              aria-label="Refresh CAPTCHA"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={speakCaptcha}
              className="p-1 rounded-md text-gray-600 hover:text-blue-600 hover:bg-white dark:text-gray-300 dark:hover:text-blue-400 transition-colors cursor-pointer"
              title="Listen to CAPTCHA code audio"
              aria-label="Audio readout of CAPTCHA"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* User Input Field */}
        <div className="flex-1 relative">
          <input
            id={`${idPrefix}-input`}
            type="text"
            required={required}
            maxLength={6}
            value={userInput}
            onChange={(e) => {
              setHasInteracted(true);
              onChangeInput(e.target.value.trim());
            }}
            placeholder="Type characters"
            autoComplete="off"
            spellCheck="false"
            className={`w-full px-3 py-2 rounded-xl border text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 transition-all ${
              isMatched
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-400'
                : isFailed
                ? 'border-red-400 text-red-600 focus:ring-red-300'
                : 'border-[#c2c6d7] dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-[#1d68f2]'
            }`}
          />
          {isMatched && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 flex items-center gap-1">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {isFailed && (
        <div className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Characters do not match. Codes are case-sensitive.</span>
        </div>
      )}
    </div>
  );
};
