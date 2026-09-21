import React, { useState, useEffect, useRef } from 'react';
import { CivicIssue } from '../types';
import { AlertTriangle, Lightbulb, Trees, Droplets, ShieldAlert, Sparkles, Navigation, CheckCircle2, ThumbsUp, CloudOff } from 'lucide-react';

interface IssueCardProps {
  issue: CivicIssue;
  onSelect: (issue: CivicIssue) => void;
  onUpvote?: (issueId: string) => void;
  onNavigate?: (issue: CivicIssue) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onSelect,
  onUpvote,
  onNavigate,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<'up' | 'down'>('up');
  const [showFloatBadge, setShowFloatBadge] = useState(false);
  const prevUpvotesRef = useRef(issue.upvotes);

  // Trigger subtle counter animation whenever upvote count changes
  useEffect(() => {
    if (issue.upvotes !== prevUpvotesRef.current) {
      const isIncrease = issue.upvotes > prevUpvotesRef.current;
      setAnimationType(isIncrease ? 'up' : 'down');
      setIsAnimating(true);
      setShowFloatBadge(true);
      prevUpvotesRef.current = issue.upvotes;

      const animTimer = setTimeout(() => setIsAnimating(false), 500);
      const badgeTimer = setTimeout(() => setShowFloatBadge(false), 750);
      return () => {
        clearTimeout(animTimer);
        clearTimeout(badgeTimer);
      };
    }
  }, [issue.upvotes]);

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpvote) {
      const nextType = issue.hasUpvoted ? 'down' : 'up';
      setAnimationType(nextType);
      setIsAnimating(true);
      setShowFloatBadge(true);
      setTimeout(() => setIsAnimating(false), 500);
      setTimeout(() => setShowFloatBadge(false), 750);
      onUpvote(issue.id);
    }
  };

  // Category Icon & Color Mapping
  const getCategoryIcon = () => {
    switch (issue.category) {
      case 'Roads':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      case 'Utilities':
        return <Lightbulb className="w-5 h-5 text-white" />;
      case 'Parks':
        return <Trees className="w-5 h-5 text-white" />;
      case 'Sanitation':
      case 'Traffic':
      default:
        return issue.title.toLowerCase().includes('water') ? (
          <Droplets className="w-5 h-5 text-white" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-white" />
        );
    }
  };

  const getIconBg = () => {
    if (issue.status === 'fixed') return 'bg-[#10B981]';
    if (issue.status === 'investigating') return 'bg-[#f88400]';
    return 'bg-[#1d68f2]';
  };

  const getStatusBadge = () => {
    if (issue.isOfflineQueued) {
      return (
        <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs animate-pulse">
          <CloudOff className="w-3.5 h-3.5 text-amber-700" />
          <span>Offline Queued</span>
        </span>
      );
    }

    switch (issue.status) {
      case 'open':
        return (
          <span className="bg-[#dfe9fa] text-[#0050c8] px-3 py-1 rounded-full text-xs font-semibold border border-[#0050c8]/20 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0050c8]" />
            Open
          </span>
        );
      case 'investigating':
        return (
          <span className="bg-[#ffdcc4] text-[#924c00] px-3 py-1 rounded-full text-xs font-semibold border border-[#f88400]/20 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f88400] animate-pulse" />
            Investigating
          </span>
        );
      case 'fixed':
        return (
          <span className="bg-[#83fc8e]/30 text-[#004c17] px-3 py-1 rounded-full text-xs font-semibold border border-[#10B981]/30 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Fixed
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(issue)}
      className="bg-white rounded-xl border border-[#c2c6d7] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#1d68f2]/60 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top row: Icon, Title, Date, Status */}
      <div>
        <div className="flex justify-between items-start mb-2.5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${getIconBg()} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0`}>
              {getCategoryIcon()}
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#121c28] group-hover:text-[#0050c8] transition-colors leading-tight">
                {issue.title}
              </h3>
              <p className="text-xs text-[#737686] font-medium mt-0.5">
                {issue.reportedDaysAgo} • <span className="font-semibold text-[#424655]">{issue.address}</span>
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-[#424655] mb-3 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>
      </div>

      {/* Footer tags and interactive buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 bg-[#d9e3f4]/60 text-[#424655] rounded-md text-xs font-medium">
            {issue.category}
          </span>
          <span className="px-2.5 py-0.5 bg-[#d9e3f4]/60 text-[#424655] rounded-md text-xs font-medium">
            {issue.district}
          </span>
          {issue.mergedReportsCount > 1 && (
            <span className="px-2 py-0.5 bg-[#EDF4FF] text-[#0050c8] rounded-md text-[11px] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {issue.mergedReportsCount} merged
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onUpvote && (
            <div className="relative flex items-center">
              <button
                id={`issue-card-upvote-${issue.id}`}
                onClick={handleUpvoteClick}
                className={`relative overflow-visible px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none cursor-pointer active:scale-95 ${
                  isAnimating ? 'animate-upvote-ripple' : ''
                } ${
                  issue.hasUpvoted
                    ? 'bg-[#EDF4FF] text-[#0050c8] border border-[#1d68f2] shadow-2xs font-bold'
                    : 'bg-gray-50 hover:bg-[#EDF4FF] text-[#737686] hover:text-[#0050c8] border border-gray-200'
                }`}
                title="Confirm issue exists (+10 Civic Credits)"
              >
                <ThumbsUp
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    issue.hasUpvoted ? 'fill-[#0050c8] text-[#0050c8]' : ''
                  } ${isAnimating && animationType === 'up' ? 'animate-upvote-icon' : ''}`}
                />
                <span
                  key={`upvote-num-${issue.id}-${issue.upvotes}`}
                  id={`issue-card-upvote-count-${issue.id}`}
                  className={`tabular-nums transition-colors duration-150 ${
                    isAnimating
                      ? animationType === 'up'
                        ? 'animate-upvote-counter-up text-[#0050c8]'
                        : 'animate-upvote-counter-down text-gray-500'
                      : ''
                  }`}
                >
                  {issue.upvotes}
                </span>

                {/* Subtle floating +1 / -1 feedback indicator */}
                {showFloatBadge && (
                  <span
                    className={`absolute -top-3.5 right-1.5 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs pointer-events-none animate-upvote-float z-10 ${
                      animationType === 'up'
                        ? 'bg-[#0050c8] text-white'
                        : 'bg-gray-600 text-white'
                    }`}
                  >
                    {animationType === 'up' ? '+1' : '-1'}
                  </span>
                )}
              </button>
            </div>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate(issue)}
              className="px-2.5 py-1 bg-[#1d68f2] hover:bg-[#0050c8] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              title="Navigate to issue location"
            >
              <Navigation className="w-3 h-3" />
              <span className="hidden sm:inline">Navigate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
