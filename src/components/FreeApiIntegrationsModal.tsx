import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ExternalLink,
  Sparkles,
  Mail,
  Smartphone,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  X,
  Zap,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { apiClient } from '../services/api';

interface FreeApiIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface ApiStatusPayload {
  status: string;
  geminiAi?: {
    configured: boolean;
    provider: string;
    freeTierUrl: string;
    freeTierQuota: string;
    features: string[];
  };
  emailApis?: {
    brevoConfigured: boolean;
    resendConfigured: boolean;
    sendgridConfigured?: boolean;
    providers: Array<{
      name: string;
      configured: boolean;
      freeTierUrl: string;
      freeQuota: string;
      keyName: string;
      notes: string;
    }>;
  };
  smsApis?: {
    textbeltKeyProvided: boolean;
    textbeltFreeActive: boolean;
    fast2smsConfigured: boolean;
    providers: Array<{
      name: string;
      configured: boolean;
      freeTierUrl: string;
      freeQuota: string;
      keyName: string;
      notes: string;
    }>;
  };
  emailVerification?: {
    zeroBounceConfigured: boolean;
    abstractConfigured: boolean;
    builtInDnsMxActive: boolean;
    providers: Array<{
      name: string;
      configured: boolean;
      freeTierUrl: string;
      freeQuota: string;
      keyName: string;
      notes: string;
    }>;
  };
  mapsAndGeo?: {
    openStreetMapNominatim?: {
      name: string;
      configured: boolean;
      freeTierUrl: string;
      freeQuota: string;
      notes: string;
    };
  };
}

export const FreeApiIntegrationsModal: React.FC<FreeApiIntegrationsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const [apiData, setApiData] = useState<ApiStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'email' | 'sms' | 'verify' | 'maps'>('all');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getApiStatus();
      if (data) {
        setApiData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch api status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {}
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envSnippet = `# CivicFix 100% Free API Keys Configuration
# Get your free Gemini API key: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your_free_gemini_api_key"

# Free Email Delivery: Brevo (300 free emails/day) https://app.brevo.com/
BREVO_API_KEY="your_free_brevo_key"

# Alternative Free Email: Resend (100 free emails/day) https://resend.com/api-keys
RESEND_API_KEY="your_free_resend_key"

# Free SMS: Textbelt pre-configured with key="textbelt" (1 free SMS/day)
TEXTBELT_KEY="textbelt"

# Fast2SMS: Free signup credits https://www.fast2sms.com/
FAST2SMS_API_KEY="your_free_fast2sms_key"

# Real-time Email Verification: Abstract API https://www.abstractapi.com/
ABSTRACT_EMAIL_API_KEY="your_free_abstract_key"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="free-api-integrations-modal"
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border transition-all ${
          isDarkMode
            ? 'bg-[#131b26] border-gray-800 text-gray-100'
            : 'bg-white border-[#dae2ff] text-[#121c28]'
        } overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-6 border-b flex items-center justify-between ${
            isDarkMode ? 'border-gray-800 bg-[#0e1522]' : 'border-[#dae2ff] bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Free API Keys & Providers Directory
                </h2>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  100% Free Tiers Available
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Direct links to get free API keys with no credit card required, plus zero-key offline fallbacks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
              }`}
              title="Refresh API connection status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex items-center gap-1.5 p-2 sm:px-6 border-b overflow-x-auto ${
            isDarkMode ? 'border-gray-800 bg-[#0e1522]' : 'border-gray-100 bg-gray-50/50'
          }`}
        >
          {[
            { id: 'all', label: 'All Services', icon: Globe },
            { id: 'ai', label: 'Gemini AI Vision', icon: Sparkles },
            { id: 'email', label: 'Free Email OTP', icon: Mail },
            { id: 'sms', label: 'Free Mobile SMS', icon: Smartphone },
            { id: 'verify', label: 'Email Verifier', icon: ShieldCheck },
            { id: 'maps', label: 'Maps & GIS (0 Keys)', icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#0050c8] text-white shadow-xs'
                    : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-[#0050c8] hover:bg-blue-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Quick Notice Banner */}
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
              isDarkMode
                ? 'bg-blue-950/30 border-blue-800/40 text-blue-200'
                : 'bg-blue-50/70 border-blue-200 text-blue-900'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Where to place your API keys in this environment:
              </p>
              <p className="leading-relaxed opacity-90">
                In Google AI Studio, configure keys under <strong>Settings &rarr; Secrets</strong> or add them into your <strong>.env</strong> file. CivicFix automatically detects them on next server request. If you have no keys, CivicFix uses built-in free engines!
              </p>
            </div>
          </div>

          {/* 1. GEMINI AI VISION & TRIAGE */}
          {(activeTab === 'all' || activeTab === 'ai') && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDarkMode ? 'bg-[#0e1522] border-gray-800' : 'bg-slate-50 border-gray-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                      Google Gemini AI (Vision, Scanner & Assistant)
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Variable: <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">GEMINI_API_KEY</code>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      apiData?.geminiAi?.configured
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {apiData?.geminiAi?.configured ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Key Detected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Using Offline Visual Taxonomy
                      </>
                    )}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Powers real photo camera scanning for potholes, water leaks, streetlights, and garbage dumps, plus automatic department routing and civic triage.
              </p>

              {/* Provider Card */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">Google AI Studio</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      100% Free Tier (No Billing Required)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Free quota: 15 Requests/Min &bull; 1,000,000 Tokens/Min &bull; 1,500 Requests/Day
                  </p>
                </div>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0050c8] hover:bg-[#003da0] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <span>Get Free Key at Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* 2. FREE EMAIL DELIVERY (BREVO, RESEND, SENDGRID) */}
          {(activeTab === 'all' || activeTab === 'email') && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDarkMode ? 'bg-[#0e1522] border-gray-800' : 'bg-slate-50 border-gray-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                      Free Email Delivery APIs (OTP & Work Orders)
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Choose any free provider below &bull; Zero credit card needed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Free Email Gateway Active
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Dispatches simultaneous 6-digit registration codes, password reset links, and defect updates to citizen emails.
              </p>

              <div className="space-y-2.5">
                {/* Brevo */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">Brevo (Formerly Sendinblue)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Recommended: 300 free emails/day (9,000/mo)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Key variable: <code className="font-mono text-blue-600 dark:text-blue-400 font-bold">BREVO_API_KEY</code> &bull; Instant signup
                    </p>
                  </div>
                  <a
                    href="https://app.brevo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Get Free Key (Brevo)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Resend */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">Resend Developer Email</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        100 free emails/day (3,000/mo)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Key variable: <code className="font-mono text-blue-600 dark:text-blue-400 font-bold">RESEND_API_KEY</code> &bull; Generates API key in 10 seconds
                    </p>
                  </div>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Get Free Key (Resend)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* SendGrid */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">SendGrid Free Tier</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        100 free emails/day
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Key variable: <code className="font-mono text-blue-600 dark:text-blue-400 font-bold">SENDGRID_API_KEY</code>
                    </p>
                  </div>
                  <a
                    href="https://app.sendgrid.com/settings/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Get Free Key (SendGrid)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 3. FREE MOBILE SMS & OTP APIS */}
          {(activeTab === 'all' || activeTab === 'sms') && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDarkMode ? 'bg-[#0e1522] border-gray-800' : 'bg-slate-50 border-gray-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                      Free Mobile SMS & OTP Delivery
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      No expensive US/Twilio phone number rental needed
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  SMS Gateway Ready
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Textbelt Free Tier */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">Textbelt (Zero Setup Pre-configured)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        1 free SMS/day per IP (key="textbelt")
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Key variable: <code className="font-mono text-teal-600 dark:text-teal-400 font-bold">TEXTBELT_KEY="textbelt"</code> &bull; Built right into CivicFix
                    </p>
                  </div>
                  <a
                    href="https://textbelt.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>View Textbelt</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Fast2SMS */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">Fast2SMS Quick SMS Gateway</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Free Signup Wallet Credits
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Key variable: <code className="font-mono text-teal-600 dark:text-teal-400 font-bold">FAST2SMS_API_KEY</code> &bull; Instant OTP to any mobile phone
                    </p>
                  </div>
                  <a
                    href="https://www.fast2sms.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Get Free Key (Fast2SMS)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 4. REAL-TIME EMAIL VERIFICATION (PREVENT FAKE EMAILS) */}
          {(activeTab === 'all' || activeTab === 'verify') && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDarkMode ? 'bg-[#0e1522] border-gray-800' : 'bg-slate-50 border-gray-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                      Email Verification & Deliverability Checkers
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Blocks throwaway/disposable and misspelled emails before OTP
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  DNS MX Resolver Online
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Built-in DNS MX Resolver */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">Built-in DNS MX & RFC Syntax Engine</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        100% Free Forever &bull; Zero Keys Needed
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Directly queries domain MX records and blocks 150+ disposable email domains natively.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                    Always Active
                  </span>
                </div>

                {/* Abstract API */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">Abstract Email Validation API</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        100 free requests/month
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Key variable: <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">ABSTRACT_EMAIL_API_KEY</code>
                    </p>
                  </div>
                  <a
                    href="https://www.abstractapi.com/api/email-verification-validation-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Get Free Key (Abstract)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* ZeroBounce */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">ZeroBounce Email Verification</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        100 free validations/month
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Key variable: <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">ZEROBOUNCE_API_KEY</code>
                    </p>
                  </div>
                  <a
                    href="https://www.zerobounce.net/members/api-keys/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Get Free Key (ZeroBounce)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 5. OPENSTREETMAP & GIS (ZERO KEYS NEEDED) */}
          {(activeTab === 'all' || activeTab === 'maps') && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDarkMode ? 'bg-[#0e1522] border-gray-800' : 'bg-slate-50 border-gray-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                      OpenStreetMap & Open GIS Geocoding
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      100% Free Open Community Infrastructure &bull; No API Keys Required!
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  100% Free / Zero Setup
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                CivicFix uses <strong>OpenStreetMap Nominatim</strong> and Leaflet tile servers directly. Unlike Google Maps or Mapbox, it requires <strong>NO API key, no billing account, and no credit card</strong>.
              </p>

              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#131b26] border-gray-800' : 'bg-white border-gray-200'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs">OpenStreetMap Community Foundation</span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Provides live street address lookups, coordinate pinning, and dark/satellite tile layers.
                  </p>
                </div>
                <a
                  href="https://nominatim.openstreetmap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span>Explore OpenStreetMap</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Quick Copy .env template */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDarkMode ? 'bg-[#0b0f17] border-gray-800' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Quick Copy .env Template with Free Endpoints</span>
              </span>
              <button
                onClick={() => handleCopy(envSnippet, 'env')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-[#0050c8] text-white hover:bg-blue-700 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                {copiedKey === 'env' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy .env Template</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono p-3 rounded-xl bg-black/40 text-emerald-400 overflow-x-auto">
              {envSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDarkMode ? 'border-gray-800 bg-[#0e1522]' : 'border-[#dae2ff] bg-slate-50'
          }`}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Need assistance? CivicFix works 100% offline and in zero-key fallback mode for all features.
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0050c8] hover:bg-[#003da0] text-white transition-colors cursor-pointer shadow-xs"
          >
            Done &bull; Return to App
          </button>
        </div>
      </div>
    </div>
  );
};
