// Radical Accessibility: Real Web Speech Synthesis & Multilingual Engine

export type SupportedLanguage = 
  | 'en' // English
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'hi' // Hindi (हिन्दी)
  | 'ta' // Tamil (தமிழ்)
  | 'te' // Telugu (తెలుగు)
  | 'mr' // Marathi (मराठी)
  | 'bn' // Bengali (বাংলা)
  | 'es'; // Spanish

export interface LanguageDef {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  speechLangCode: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechLangCode: 'en-US', flag: '🇺🇸' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechLangCode: 'kn-IN', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLangCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechLangCode: 'ta-IN', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLangCode: 'te-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLangCode: 'mr-IN', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechLangCode: 'bn-IN', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechLangCode: 'es-ES', flag: '🇪🇸' },
];

export const TRANSLATION_DICTIONARY: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    welcomeTitle: 'CivicFix: Transform Your City in 3 Taps',
    citizenPortal: 'Citizen Discovery & Reporting',
    adminPortal: 'Municipal Command Operations',
    audibleModeOn: 'Audible Narration Active',
    audibleModeOff: 'Audible Mode Disabled',
    reportPothole: 'Report Pothole',
    reportHazard: 'Report Hazard',
    verifiedFix: 'Verified Fix Complete',
    duplicateWarning: 'Duplicate Detected: Nearby Active Report Within 50ft',
    creditsAwarded: 'Civic Credits Awarded',
    emergencySOS: 'Immediate Emergency Hotlines (112 / 911)',
    governorAward: 'Governor’s Civic Honor Progress',
  },
  kn: {
    welcomeTitle: 'ಸಿವಿಕ್‌ಫಿಕ್ಸ್: ನಿಮ್ಮ ನಗರವನ್ನು 3 ಟ್ಯಾಪ್‌ಗಳಲ್ಲಿ ಪರಿವರ್ತಿಸಿ',
    citizenPortal: 'ನಾಗರಿಕ ಸಮಸ್ಯೆ ವರದಿ ಮತ್ತು ಪರಿಶೀಲನೆ',
    adminPortal: 'ಪುರಸಭೆಯ ಆಡಳಿತ ಕೇಂದ್ರ',
    audibleModeOn: 'ಶ್ರವ್ಯ ವಿವರಣೆ ಸಕ್ರಿಯವಾಗಿದೆ',
    audibleModeOff: 'ಶ್ರವ್ಯ ಮೋಡ್ ಆಫ್ ಆಗಿದೆ',
    reportPothole: 'ರಸ್ತೆ ಗುಂಡಿ ವರದಿ ಮಾಡಿ',
    reportHazard: 'ಅಪಾಯಕಾರಿ ಸ್ಥಳ ವರದಿ',
    verifiedFix: 'ದೃಢೀಕರಿಸಿದ ದುರಸ್ತಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
    duplicateWarning: 'ಹತ್ತಿರದ ಸಕ್ರಿಯ ದೂರು ಪತ್ತೆಯಾಗಿದೆ (50 ಅಡಿ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ)',
    creditsAwarded: 'ಸಿವಿಕ್ ಕ್ರೆಡಿಟ್‌ಗಳು ನೀಡಲಾಗಿದೆ',
    emergencySOS: 'ತುರ್ತು ಸಹಾಯವಾಣಿ (112)',
    governorAward: 'ರಾಜ್ಯಪಾಲರ ನಾಗರಿಕ ಪ್ರಶಸ್ತಿ ಪ್ರಗತಿ',
  },
  hi: {
    welcomeTitle: 'सिविकफिक्स: अपने शहर को 3 टैप में बदलें',
    citizenPortal: 'नागरिक रिपोर्टिंग और निगरानी',
    adminPortal: 'नगर निगम कमान केंद्र',
    audibleModeOn: 'ध्वनि विवरण चालू है',
    audibleModeOff: 'ध्वनि मोड बंद है',
    reportPothole: 'सड़क गड्ढा रिपोर्ट करें',
    reportHazard: 'खतरे की सूचना दें',
    verifiedFix: 'सत्यापित मरम्मत पूर्ण',
    duplicateWarning: 'समीपवर्ती सक्रिय रिपोर्ट (50 फीट के भीतर)',
    creditsAwarded: 'सिविक क्रेडिट्स प्रदान किए गए',
    emergencySOS: 'आपातकालीन हेल्पलाइन (112)',
    governorAward: 'राज्यपाल नागरिक सम्मान प्रगति',
  },
  ta: {
    welcomeTitle: 'சிவிக்ஃபிக்ஸ்: 3 தட்டுகளில் உங்கள் நகரத்தை மாற்றவும்',
    citizenPortal: 'குடிமக்கள் புகார் மற்றும் கண்காணிப்பு',
    adminPortal: 'நகராட்சி கட்டுப்பாட்டு மையம்',
    audibleModeOn: 'குரல் வழிகாட்டல் இயங்குகிறது',
    audibleModeOff: 'குரல் முறை நிறுத்தப்பட்டது',
    reportPothole: 'குழி குறித்து புகார் செய்யவும்',
    reportHazard: 'ஆபத்து புகார்',
    verifiedFix: 'சரிபார்ப்பு நிறைவுற்றது',
    duplicateWarning: 'அருகிலுள்ள முந்தைய புகார் (50 அடிக்குள்)',
    creditsAwarded: 'சிவிக் புள்ளிகள் வழங்கப்பட்டன',
    emergencySOS: 'அவசர உதவி எண் (112)',
    governorAward: 'ஆளுநர் விருது முன்னேற்றம்',
  },
  te: {
    welcomeTitle: 'సివిక్‌ఫిక్స్: 3 ట్యాప్‌లలో మీ నగరాన్ని మెరుగుపరచండి',
    citizenPortal: 'పౌర సమస్యల నివేదన',
    adminPortal: 'మున్సిపల్ కమాండ్ సెంటర్',
    audibleModeOn: 'వాయిస్ గైడెన్స్ ఆన్‌లో ఉంది',
    audibleModeOff: 'వాయిస్ మోడ్ ఆఫ్ అయింది',
    reportPothole: 'రోడ్డు గుంత నివేదించండి',
    reportHazard: 'ప్రమాదకర ప్రదేశం నివేదిక',
    verifiedFix: 'పరిష్కరించబడింది',
    duplicateWarning: 'సమీపంలో ఉన్న మునుపటి నివేదిక (50 అడుగులు)',
    creditsAwarded: 'సివిక్ క్రెడిట్స్ లభించాయి',
    emergencySOS: 'అత్యవసర హెల్ప్‌లైన్ (112)',
    governorAward: 'గవర్నర్ పౌర పురస్కార పురోగతి',
  },
  mr: {
    welcomeTitle: 'सिविकफिक्स: 3 टॅप्समध्ये आपले शहर बदला',
    citizenPortal: 'नागरिक अहवाल आणि देखरेख',
    adminPortal: 'महानगरपालिका नियंत्रण कक्ष',
    audibleModeOn: 'ध्वनी मार्गदर्शन सुरू',
    audibleModeOff: 'ध्वनी मोड बंद',
    reportPothole: 'खड्डा नोंदवा',
    reportHazard: 'धोकादायक समस्या नोंदवा',
    verifiedFix: 'दुरुस्ती पूर्ण झाली',
    duplicateWarning: 'जवळपास सक्रिय तक्रार (50 फुटांच्या आत)',
    creditsAwarded: 'सिविक क्रेडिट्स मिळाले',
    emergencySOS: 'आपत्कालीन हेल्पलाइन (112)',
    governorAward: 'राज्यपाल नागरी पुरस्कार प्रगती',
  },
  bn: {
    welcomeTitle: 'সিভিকফিক্স: ৩টি ট্যাপে আপনার শহর বদলান',
    citizenPortal: 'নাগরিক সমস্যা রিপোর্ট ও ট্র্যাকিং',
    adminPortal: 'পৌর কমান্ড সেন্টার',
    audibleModeOn: 'ভয়েস গাইডেন্স চালু',
    audibleModeOff: 'ভয়েস মোড বন্ধ',
    reportPothole: 'রাস্তার গর্ত রিপোর্ট করুন',
    reportHazard: 'বিপদ রিপোর্ট করুন',
    verifiedFix: 'মেরামত নিশ্চিত হয়েছে',
    duplicateWarning: 'কাছাকাছি সক্রিয় অভিযোগ (৫০ ফুটের মধ্যে)',
    creditsAwarded: 'সিভিক ক্রেডিট পাওয়া গেছে',
    emergencySOS: 'জরুরী হেল্পলাইন (১১২)',
    governorAward: 'রাজ্যপাল নাগরিক পুরস্কার অগ্রগতি',
  },
  es: {
    welcomeTitle: 'CivicFix: Transforma tu ciudad en 3 toques',
    citizenPortal: 'Portal Ciudadano y Reportes',
    adminPortal: 'Centro de Mando Municipal',
    audibleModeOn: 'Narración de voz activada',
    audibleModeOff: 'Modo audible desactivado',
    reportPothole: 'Reportar bache',
    reportHazard: 'Reportar peligro vial',
    verifiedFix: 'Reparación verificada',
    duplicateWarning: 'Reporte cercano existente a menos de 15 metros',
    creditsAwarded: 'Créditos cívicos otorgados',
    emergencySOS: 'Línea de emergencia (112 / 911)',
    governorAward: 'Progreso del Premio del Gobernador',
  },
};

type SubtitleListener = (text: string, translation?: string, lang?: string) => void;
type SpeakingListener = (isSpeaking: boolean) => void;

class AudibleNarratorService {
  private currentLanguage: SupportedLanguage = 'en';
  private audibleModeEnabled: boolean = false;
  private isSpeaking: boolean = false;
  private listeners: SubtitleListener[] = [];
  private speakingListeners: SpeakingListener[] = [];
  private speechRate: number = 1.0;
  private speechUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedLang = localStorage.getItem('civicfix_lang') as SupportedLanguage;
        if (savedLang && TRANSLATION_DICTIONARY[savedLang]) {
          this.currentLanguage = savedLang;
        }
        const savedAudible = localStorage.getItem('civicfix_audible_mode');
        if (savedAudible === 'true') {
          this.audibleModeEnabled = true;
        }
      } catch {
        // Fallback safely
      }
    }
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
    try {
      localStorage.setItem('civicfix_lang', lang);
    } catch {
      // ignore
    }
    // Do not automatically speak aloud on language switch - user did not request speech
  }

  public isAudibleEnabled(): boolean {
    return this.audibleModeEnabled;
  }

  public toggleAudibleMode(): boolean {
    this.audibleModeEnabled = !this.audibleModeEnabled;
    try {
      localStorage.setItem('civicfix_audible_mode', String(this.audibleModeEnabled));
    } catch {
      // ignore
    }

    if (this.audibleModeEnabled) {
      // Provide visual subtitle indicator only; do not start speaking audio until requested
      this.notifySubtitles(
        'Audible accessibility mode enabled. Press Listen on any card or button to hear voice summary.',
        this.t('audibleModeOn')
      );
      setTimeout(() => this.notifySubtitles(''), 3000);
    } else {
      this.stop();
      this.notifySubtitles(this.t('audibleModeOff'));
      setTimeout(() => this.notifySubtitles(''), 2500);
    }

    return this.audibleModeEnabled;
  }

  public onSubtitle(cb: SubtitleListener): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public onSpeakingChange(cb: SpeakingListener): () => void {
    this.speakingListeners.push(cb);
    try {
      cb(this.isSpeaking);
    } catch {
      // ignore
    }
    return () => {
      this.speakingListeners = this.speakingListeners.filter((l) => l !== cb);
    };
  }

  private setSpeakingState(speaking: boolean) {
    this.isSpeaking = speaking;
    this.speakingListeners.forEach((cb) => {
      try {
        cb(speaking);
      } catch (err) {
        console.warn('[TTS Engine] speaking listener error:', err);
      }
    });
  }

  private notifySubtitles(text: string, translation?: string) {
    this.listeners.forEach((cb) => cb(text, translation, this.currentLanguage));
  }

  public t(key: string): string {
    const langDict = TRANSLATION_DICTIONARY[this.currentLanguage] || TRANSLATION_DICTIONARY.en;
    return langDict[key] || TRANSLATION_DICTIONARY.en[key] || key;
  }

  public speakIssue(issue: { title: string; category?: string; address?: string; status?: string; upvotes?: number }) {
    const text = `Civic report: ${issue.title}. Category: ${issue.category || 'General'}. Located at ${issue.address || 'nearby location'}. Status is ${issue.status || 'open'} with ${issue.upvotes || 0} citizen endorsements.`;
    this.speak(text, undefined, true);
  }

  public speak(englishText: string, localizedText?: string, force = true) {
    if (!this.audibleModeEnabled && !force) {
      this.notifySubtitles(englishText, localizedText);
      return;
    }

    const textToSpeak = this.currentLanguage === 'en' ? englishText : (localizedText || englishText);

    if (typeof window === 'undefined') {
      return;
    }

    // Always show subtitle immediately
    this.notifySubtitles(englishText, localizedText);

    if (!window.speechSynthesis) {
      console.warn('[TTS Engine] window.speechSynthesis is unavailable in this environment.');
      return;
    }

    try {
      // Unlock audio context and cancel any stuck speech
      window.speechSynthesis.cancel();
      this.setSpeakingState(false);

      const langDef = SUPPORTED_LANGUAGES.find((l) => l.code === this.currentLanguage);
      const targetLang = langDef?.speechLangCode || 'en-US';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      utterance.lang = targetLang;
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(
          (v) => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.startsWith(targetLang.split('-')[0])
        ) || voices.find((v) => v.lang.includes('en') || v.default);
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onstart = () => {
        this.setSpeakingState(true);
        this.notifySubtitles(englishText, localizedText);
      };

      utterance.onend = () => {
        this.setSpeakingState(false);
        setTimeout(() => {
          if (!this.isSpeaking) {
            this.notifySubtitles('');
          }
        }, 1800);
      };

      utterance.onerror = (ev) => {
        console.warn('[TTS Engine] Speech synthesis utterance error:', ev);
        this.setSpeakingState(false);
      };

      this.speechUtterance = utterance;

      // Ensure speech synthesis is resumed if paused by browser
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      this.setSpeakingState(true);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[TTS Engine] Speech synthesis execution failed:', err);
      this.setSpeakingState(false);
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.speechUtterance = null;
    this.setSpeakingState(false);
    this.notifySubtitles('');
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public setSpeed(rate: number) {
    this.speechRate = Math.max(0.75, Math.min(1.5, rate));
  }

  public getSpeed(): number {
    return this.speechRate;
  }
}

export const audibleNarrator = new AudibleNarratorService();
