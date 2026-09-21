import React, { useState } from 'react';
import { CivicNewsItem, CIVIC_NEWS_ITEMS } from '../data/cityNewsData';
import {
  X,
  Newspaper,
  ThumbsUp,
  MapPin,
  Calendar,
  Share2,
  ExternalLink,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';

interface CityNewsFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReportModal?: (prefillCategory?: string) => void;
}

export const CityNewsFeedModal: React.FC<CityNewsFeedModalProps> = ({
  isOpen,
  onClose,
  onOpenReportModal,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [upvotesState, setUpvotesState] = useState<Record<string, number>>({});
  const [userUpvoted, setUserUpvoted] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const cities = ['All Cities', 'Bengaluru', 'New Delhi'];
  const categories = [
    { id: 'all', label: 'All News' },
    { id: 'infrastructure', label: 'Roads & Works' },
    { id: 'sanitation', label: 'Sanitation & Waste' },
    { id: 'water_supply', label: 'Water Supply' },
    { id: 'transport', label: 'Streetlights & Traffic' },
    { id: 'community_redressal', label: 'Grievance Resolved' },
  ];

  const handleUpvote = (id: string, currentCount: number) => {
    soundFX.playClick();
    const already = userUpvoted[id];
    setUserUpvoted({ ...userUpvoted, [id]: !already });
    setUpvotesState({
      ...upvotesState,
      [id]: already ? (upvotesState[id] || currentCount) - 1 : (upvotesState[id] || currentCount) + 1,
    });
  };

  const filteredNews = CIVIC_NEWS_ITEMS.filter((item) => {
    const matchesCity = selectedCity === 'All Cities' || item.city === selectedCity;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCity && matchesCategory && matchesSearch;
  });

  return (
    <div
      id="city-news-modal-overlay"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="city-news-modal-container"
        className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-auto text-gray-900 dark:text-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner shrink-0">
              📰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">City Civic News & Area Updates</h3>
                <span className="text-[10px] font-black px-2 py-0.5 bg-white/25 rounded-full uppercase tracking-wider">
                  Live Wire
                </span>
              </div>
              <p className="text-xs text-white/90 font-medium">
                Real-time updates on municipal repairs, resolved citizen problems, and neighborhood works.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search civic headlines, areas (e.g. Indiranagar, Rohini)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* City Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCity}
                onChange={(e) => {
                  soundFX.playClick();
                  setSelectedCity(e.target.value);
                }}
                className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {onOpenReportModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onOpenReportModal();
                    onClose();
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Report Problem</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundFX.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* News List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Newspaper className="w-12 h-12 text-gray-400 mx-auto" />
              <h4 className="text-base font-bold text-gray-700 dark:text-gray-300">
                No civic news found matching your filter.
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Try searching for a different area or reset the category filter.
              </p>
            </div>
          ) : (
            filteredNews.map((item) => {
              const currentUpvotes = upvotesState[item.id] !== undefined ? upvotesState[item.id] : item.upvotes;
              const hasUpvoted = userUpvoted[item.id] || false;

              return (
                <article
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-3"
                >
                  {/* Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {item.area}, {item.city}
                        </span>
                      </span>
                    </div>

                    <div className="text-gray-400 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 leading-snug">
                    {item.headline}
                  </h4>

                  {/* Summary */}
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Related Grievance & Official Action Taken */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Official Municipal Action:</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full">
                        {item.relatedIssueCount} Related Issues Tracked
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11.5px] leading-relaxed">
                      {item.officialActionTaken}
                    </p>
                  </div>

                  {/* Tags & Action Bar */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 rounded-md text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpvote(item.id, item.upvotes)}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                          hasUpvoted
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                        title="Upvote importance of this civic report"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{currentUpvotes} Impact Votes</span>
                      </button>

                      {onOpenReportModal && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playClick();
                            onOpenReportModal(item.relatedGrievanceCategory);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1 text-xs transition-colors cursor-pointer"
                          title="Report a similar problem in your neighborhood"
                        >
                          <span>Report Nearby</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Source: Municipal Information Desks & Resident Associations</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
