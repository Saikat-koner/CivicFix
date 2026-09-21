import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  FileText,
  AlertTriangle,
  Award,
  PhoneCall,
  Moon,
  Sun,
  X,
  ExternalLink,
  Shield,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { CivicIssue } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onNavigateTab: (tab: 'feed' | 'map' | 'report' | 'leaderboard' | 'admin') => void;
  onOpenHotlines: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenFaq: () => void;
  onOpenApiModal?: () => void;
  userRole?: 'citizen' | 'admin';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  issues,
  onSelectIssue,
  onNavigateTab,
  onOpenHotlines,
  onToggleTheme,
  isDarkMode,
  onOpenPrivacy,
  onOpenTerms,
  onOpenFaq,
  onOpenApiModal,
  userRole = 'citizen',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // System actions
  const systemActions = [
    {
      id: 'action-report',
      title: 'Report New Civic Issue',
      subtitle: 'Spot a pothole, broken streetlight, or garbage dump',
      category: 'Actions',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      action: () => {
        onNavigateTab('report');
        onClose();
      },
    },
    {
      id: 'action-map',
      title: 'Explore Live Ward Map',
      subtitle: 'View active GPS issues and municipal zones',
      category: 'Navigation',
      icon: MapPin,
      iconColor: 'text-blue-500',
      action: () => {
        onNavigateTab('map');
        onClose();
      },
    },
    {
      id: 'action-leaderboard',
      title: 'Citizen Leaderboard & Rewards',
      subtitle: 'View top contributors and redeem reward vouchers',
      category: 'Navigation',
      icon: Award,
      iconColor: 'text-yellow-500',
      action: () => {
        onNavigateTab('leaderboard');
        onClose();
      },
    },
    {
      id: 'action-hotlines',
      title: 'Emergency 112 & Municipal Hotlines',
      subtitle: 'Direct dial BBMP, Police, Fire, Ambulance, BESCOM',
      category: 'Emergency',
      icon: PhoneCall,
      iconColor: 'text-red-500',
      action: () => {
        onOpenHotlines();
        onClose();
      },
    },
    {
      id: 'action-theme',
      title: isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: 'Toggle application contrast mode',
      category: 'Preferences',
      icon: isDarkMode ? Sun : Moon,
      iconColor: isDarkMode ? 'text-amber-400' : 'text-indigo-500',
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'action-faq',
      title: 'Civic Help & FAQs',
      subtitle: 'Learn response SLAs, rewards, and grievance escalations',
      category: 'Help',
      icon: HelpCircle,
      iconColor: 'text-emerald-500',
      action: () => {
        onOpenFaq();
        onClose();
      },
    },
    {
      id: 'action-privacy',
      title: 'Privacy Policy & GPS Anonymization',
      subtitle: 'How citizen telemetry and photos are protected',
      category: 'Legal',
      icon: Shield,
      iconColor: 'text-gray-500',
      action: () => {
        onOpenPrivacy();
        onClose();
      },
    },
    ...(userRole === 'admin'
      ? [
          {
            id: 'action-admin-portal',
            title: 'Municipal Dispatch & Admin Portal',
            subtitle: 'Manage field crews, review appointments, and inspect Cloud SQL PostgreSQL',
            category: 'Administration',
            icon: ShieldCheck,
            iconColor: 'text-indigo-600',
            action: () => {
              onNavigateTab('admin');
              onClose();
            },
          },
        ]
      : []),
    ...(userRole === 'admin' && onOpenApiModal
      ? [
          {
            id: 'action-api-keys',
            title: 'Where to Get Free API Keys & Integrations',
            subtitle: 'Gemini AI, Brevo 300 free emails/day, Resend, Textbelt SMS, and OSM Maps',
            category: 'Developer & APIs',
            icon: KeyRound,
            iconColor: 'text-blue-500',
            action: () => {
              onOpenApiModal();
              onClose();
            },
          },
          {
            id: 'action-gemini-key',
            title: 'Get Free Gemini AI Key (Google AI Studio)',
            subtitle: 'Open Google AI Studio free tier key generator in new tab',
            category: 'Developer & APIs',
            icon: Sparkles,
            iconColor: 'text-purple-500',
            action: () => {
              window.open('https://aistudio.google.com/app/apikey', '_blank');
              onClose();
            },
          },
        ]
      : []),
  ];

  // Filtered issues
  const filteredIssues = query.trim()
    ? issues.filter(
        (iss) =>
          iss.title.toLowerCase().includes(query.toLowerCase()) ||
          iss.address.toLowerCase().includes(query.toLowerCase()) ||
          iss.code.toLowerCase().includes(query.toLowerCase()) ||
          iss.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredActions = systemActions.filter(
    (act) =>
      act.title.toLowerCase().includes(query.toLowerCase()) ||
      act.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      act.category.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [
    ...filteredActions.map((a) => ({ type: 'action' as const, data: a })),
    ...filteredIssues.map((i) => ({ type: 'issue' as const, data: i })),
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected) {
          if (selected.type === 'action') {
            selected.data.action();
          } else {
            onSelectIssue(selected.data);
            onClose();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems, onClose, onSelectIssue]);

  if (!isOpen) return null;

  return (
    <div
      id="command-palette-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="command-palette-modal"
        className="w-full max-w-2xl bg-white dark:bg-[#1e2330] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-[#121c28] dark:text-gray-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 gap-3">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search issues (e.g., 'pothole', 'report', 'map', 'emergency')..."
            className="w-full bg-transparent text-sm md:text-base outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-gray-50 dark:divide-gray-800/50">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
              <p className="font-semibold">No commands or issues match "{query}"</p>
              <p className="text-[11px] mt-1 text-gray-400">Try searching for 'report', 'map', 'hotline', or a street name.</p>
            </div>
          ) : (
            <>
              {filteredActions.length > 0 && (
                <div className="pt-1 pb-1">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Quick Commands & Navigation
                  </div>
                  {filteredActions.map((action, idx) => {
                    const isSelected = selectedIndex === idx;
                    const IconComp = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-100 dark:bg-blue-800/40' : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 ${action.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm font-bold truncate flex items-center gap-2">
                            <span>{action.title}</span>
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                              {action.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {action.subtitle}
                          </div>
                        </div>
                        <kbd className="hidden sm:inline-block text-[10px] text-gray-400 font-mono">↵</kbd>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredIssues.length > 0 && (
                <div className="pt-2 pb-1">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Matching Civic Issues ({filteredIssues.length})
                  </div>
                  {filteredIssues.map((issue, idx) => {
                    const overallIndex = filteredActions.length + idx;
                    const isSelected = selectedIndex === overallIndex;
                    return (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => {
                          onSelectIssue(issue);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(overallIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <img
                          src={issue.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=150&q=80'}
                          alt={issue.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm font-bold truncate flex items-center gap-2">
                            <span>{issue.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-[#0050c8] dark:text-blue-300">
                              {issue.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{issue.address}</span>
                            <span>&bull;</span>
                            <span className="capitalize">{issue.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <kbd className="hidden sm:inline-block text-[10px] text-gray-400 font-mono">↵</kbd>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px] font-mono">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px] font-mono">↵</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px] font-mono">esc</kbd>
              <span>Close</span>
            </span>
          </div>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            ⌘K Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};
