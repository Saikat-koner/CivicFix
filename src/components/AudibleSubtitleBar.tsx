import React, { useState, useEffect } from 'react';
import { audibleNarrator, SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/audibleNarrator';
import { Volume2, VolumeX, Globe, X, Pause, Play, Sparkles, Square } from 'lucide-react';

export const AudibleSubtitleBar: React.FC = () => {
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [translationText, setTranslationText] = useState<string | undefined>('');
  const [isAudible, setIsAudible] = useState<boolean>(false);
  const [isSpeakingState, setIsSpeakingState] = useState<boolean>(audibleNarrator.getIsSpeaking());
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState<boolean>(false);

  useEffect(() => {
    setIsAudible(audibleNarrator.isAudibleEnabled());
    setCurrentLang(audibleNarrator.getLanguage());

    const unsubscribeSub = audibleNarrator.onSubtitle((text, translation) => {
      setSubtitleText(text);
      setTranslationText(translation);
    });

    const unsubscribeSpeaking = audibleNarrator.onSpeakingChange((speaking) => {
      setIsSpeakingState(speaking);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && audibleNarrator.getIsSpeaking()) {
        audibleNarrator.stop();
        setSubtitleText('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeSub();
      unsubscribeSpeaking();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleAudible = () => {
    const nextState = audibleNarrator.toggleAudibleMode();
    setIsAudible(nextState);
  };

  const handleStopAudio = () => {
    audibleNarrator.stop();
    setSubtitleText('');
  };

  const handleSelectLang = (code: SupportedLanguage) => {
    audibleNarrator.setLanguage(code);
    setCurrentLang(code);
    setShowLanguagePicker(false);
  };

  if (!subtitleText && !isAudible && !isSpeakingState) return null;

  return (
    <div
      id="accessibility-subtitle-pill"
      className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-[#121c28]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* Speaker Icon / Audible Toggle */}
      <button
        onClick={handleToggleAudible}
        className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
          isAudible
            ? 'bg-[#1d68f2] text-white shadow-xs'
            : 'bg-white/10 text-white/70 hover:text-white'
        }`}
        title={isAudible ? 'Audible Mode Active (Click to mute)' : 'Enable Audible Mode'}
      >
        {isAudible ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Direct Stop Audio / Stop Summary Button */}
      {isSpeakingState && (
        <button
          id="stop-audio-summary-global-btn"
          type="button"
          onClick={handleStopAudio}
          className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 animate-pulse hover:animate-none ring-2 ring-rose-400"
          title="Stop reading aloud / Stop Audio Summary (Esc)"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Stop Audio</span>
        </button>
      )}

      {/* Subtitles text stream */}
      <div className="min-w-0 flex-1">
        {subtitleText ? (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-white/95 leading-tight truncate">
              {subtitleText}
            </p>
            {translationText && translationText !== subtitleText && (
              <p className="text-[11px] text-amber-300 font-medium leading-tight truncate">
                {translationText}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white/80">
              Audible Assist Mode Active • Reading screen updates
            </span>
          </div>
        )}
      </div>

      {/* Language Selector Pill */}
      <div className="relative">
        <button
          onClick={() => setShowLanguagePicker(!showLanguagePicker)}
          className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer border border-white/10"
          title="Switch narration language"
        >
          <Globe className="w-3.5 h-3.5 text-blue-300" />
          <span>{SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.nativeName}</span>
        </button>

        {showLanguagePicker && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1a2332] rounded-2xl shadow-2xl border border-white/20 p-2 space-y-1 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white/60">
              Select Language (100+ Ready)
            </div>
            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLang(lang.code)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentLang === lang.code
                      ? 'bg-[#1d68f2] text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </span>
                  <span className="text-[10px] opacity-70">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => {
          audibleNarrator.stop();
          setSubtitleText('');
        }}
        className="text-white/50 hover:text-white p-1 rounded cursor-pointer"
        title="Stop and hide"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
