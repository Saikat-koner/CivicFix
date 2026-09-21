import React, { useState } from 'react';
import {
  PRESET_FACE_AVATARS,
  PRESET_FACE_ICONS,
  FaceAvatarOption,
  FaceIconOption,
} from '../data/avatars';
import {
  Smile,
  ShieldCheck,
  Sparkles,
  Wrench,
  Heart,
  Zap,
  Check,
  Image as ImageIcon,
  User,
  Sparkle,
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';

interface AvatarPickerProps {
  selectedAvatarUrl: string;
  onSelectAvatar: (url: string) => void;
  userRole?: 'citizen' | 'admin';
  userName?: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatarUrl,
  onSelectAvatar,
  userRole = 'citizen',
  userName = 'Citizen Contributor',
}) => {
  const [activeTab, setActiveTab] = useState<'faces' | 'icons' | 'custom'>('faces');
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const handlePickFace = (url: string) => {
    onSelectAvatar(url);
    soundFX.playClick();
  };

  const handleApplyCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customInputUrl.trim();
    if (!clean) {
      setCustomError('Please enter a valid image URL');
      return;
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:image/')) {
      setCustomError('URL must start with https:// or http://');
      return;
    }
    setCustomError(null);
    onSelectAvatar(clean);
    soundFX.playClick();
  };

  // Convert SVG icon to a stable inline SVG data URI so it works anywhere an avatar URL is expected
  const handlePickIcon = (icon: FaceIconOption) => {
    const iconColors: Record<string, { bg1: string; bg2: string; stroke: string }> = {
      smile: { bg1: '#f59e0b', bg2: '#ea580c', stroke: '#ffffff' },
      shield: { bg1: '#2563eb', bg2: '#1d4ed8', stroke: '#ffffff' },
      sparkles: { bg1: '#9333ea', bg2: '#db2777', stroke: '#ffffff' },
      wrench: { bg1: '#059669', bg2: '#0f766e', stroke: '#ffffff' },
      heart: { bg1: '#e11d48', bg2: '#be123c', stroke: '#ffffff' },
      zap: { bg1: '#d97706', bg2: '#b45309', stroke: '#ffffff' },
    };

    const cfg = iconColors[icon.iconName] || { bg1: '#2563eb', bg2: '#1d4ed8', stroke: '#ffffff' };
    
    // Lucide SVG paths
    const iconPaths: Record<string, string> = {
      smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
      sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
      wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
      heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
      zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    };

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${cfg.bg1}" />
          <stop offset="100%" stop-color="${cfg.bg2}" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="12" fill="url(#grad)" />
      <g fill="none" stroke="${cfg.stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(4,4) scale(0.666)">
        ${iconPaths[icon.iconName]}
      </g>
    </svg>`;

    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    onSelectAvatar(dataUri);
    soundFX.playClick();
  };

  const renderIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'smile': return <Smile className="w-5 h-5" />;
      case 'shield': return <ShieldCheck className="w-5 h-5" />;
      case 'sparkles': return <Sparkles className="w-5 h-5" />;
      case 'wrench': return <Wrench className="w-5 h-5" />;
      case 'heart': return <Heart className="w-5 h-5" />;
      case 'zap': return <Zap className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <div id="avatar-picker-container" className="space-y-4">
      {/* Live Preview Card */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-purple-50 p-3.5 rounded-2xl border border-blue-100 flex items-center gap-3.5 shadow-2xs">
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-600 shadow-md ring-4 ring-white bg-white">
            <img
              src={selectedAvatarUrl}
              alt="Selected Avatar Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Graceful fallback
                (e.target as HTMLImageElement).src = PRESET_FACE_AVATARS[0].imageUrl;
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full ring-2 ring-white">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-gray-900 truncate">
              {userName || 'Citizen Contributor'}
            </span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              userRole === 'admin'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {userRole === 'admin' ? 'City Official' : 'Citizen'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
            <Sparkle className="w-3 h-3 text-blue-500 shrink-0" />
            <span>Select your face avatar or icon badge below</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('faces')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'faces'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Citizen Faces ({PRESET_FACE_AVATARS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('icons')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'icons'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Face Icons & Badges
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Custom URL
        </button>
      </div>

      {/* Faces Grid */}
      {activeTab === 'faces' && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto pr-1 py-1">
          {PRESET_FACE_AVATARS.map((face) => {
            const isSelected = selectedAvatarUrl === face.imageUrl;
            return (
              <button
                key={face.id}
                type="button"
                onClick={() => handlePickFace(face.imageUrl)}
                title={`${face.name} - ${face.roleDescription}`}
                className={`group relative flex flex-col items-center p-1 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-600 bg-blue-50/60 scale-105'
                    : 'hover:bg-gray-50 hover:scale-102 active:scale-95'
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shadow-2xs group-hover:shadow-sm">
                  <img
                    src={face.imageUrl}
                    alt={face.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-full p-0.5 ring-2 ring-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <span className="text-[10px] font-semibold text-gray-700 truncate w-full text-center mt-1">
                  {face.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Icons Grid */}
      {activeTab === 'icons' && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 py-1">
          {PRESET_FACE_ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              onClick={() => handlePickIcon(icon)}
              className="flex flex-col items-center p-2 rounded-2xl hover:bg-gray-50 border border-gray-100 transition-all cursor-pointer active:scale-95 text-center group"
            >
              <div
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${icon.gradient} ${icon.textColor} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
              >
                {renderIconComponent(icon.iconName)}
              </div>
              <span className="text-[10px] font-bold text-gray-700 mt-1.5 leading-tight truncate w-full">
                {icon.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Custom URL Input */}
      {activeTab === 'custom' && (
        <div className="space-y-2 py-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="url"
                value={customInputUrl}
                onChange={(e) => setCustomInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCustomUrl();
                  }
                }}
                placeholder="https://example.com/avatar.jpg"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => handleApplyCustomUrl()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Apply
            </button>
          </div>
          {customError && (
            <p className="text-[11px] text-red-600 font-medium">{customError}</p>
          )}
          <p className="text-[11px] text-gray-500">
            Paste any direct image link (.jpg, .png, or public profile photo URL).
          </p>
        </div>
      )}
    </div>
  );
};
