import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface CityStatsBannerProps {
  targetRate?: number;
  avgResponseDays?: string;
  className?: string;
}

export const CityStatsBanner: React.FC<CityStatsBannerProps> = ({
  targetRate = 88.4,
  avgResponseDays = '2.4 days',
  className = '',
}) => {
  const [currentRate, setCurrentRate] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s smooth count-up

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Smooth ease-out cubic curve
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const calculatedValue = easedProgress * targetRate;

      setCurrentRate(calculatedValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentRate(targetRate);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetRate]);

  return (
    <motion.div
      id="home-city-stats-banner"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-[#121c28] text-white rounded-2xl p-5 shadow-md relative overflow-hidden ${className}`}
    >
      {/* Subtle ambient light glow in corner */}
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"
      />

      <div className="flex items-center justify-between gap-2 mb-1 relative z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-[#b2c5ff] uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>City Resolution Rate</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Live Metric
        </span>
      </div>

      <div className="flex items-baseline gap-2 mt-1 relative z-10">
        <p className="text-2xl font-extrabold text-white font-mono tracking-tight">
          {currentRate.toFixed(1)}%
        </p>
      </div>

      {/* Synchronized animated progress track */}
      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden relative z-10">
        <div
          className="h-full bg-gradient-to-r from-[#10B981] to-[#3B82F6] rounded-full transition-all duration-75"
          style={{ width: `${Math.min(100, Math.max(0, currentRate))}%` }}
        />
      </div>

      <p className="text-xs text-gray-300 mt-2.5 relative z-10">
        Average response time in Downtown: <span className="font-semibold text-white">{avgResponseDays}</span>
      </p>
    </motion.div>
  );
};
