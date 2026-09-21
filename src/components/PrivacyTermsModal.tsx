import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  Check,
  Copy,
  X,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  ChevronDown
} from 'lucide-react';
import { CIVIC_FAQ_ITEMS } from '../data/faq';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'contact' | 'notfound' | 'faq';
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'contact' | 'notfound' | 'faq'>(defaultTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [openModalFaq, setOpenModalFaq] = useState<number | null>(0);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {}
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      id="privacy-terms-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="privacy-terms-modal"
        className="w-full max-w-3xl bg-white dark:bg-[#1e2330] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-[#121c28] dark:text-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-[#1e2330] dark:to-[#1e2330]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-[#0050c8] dark:text-blue-400 flex items-center justify-center">
              {activeTab === 'privacy' && <Shield className="w-5 h-5" />}
              {activeTab === 'terms' && <FileText className="w-5 h-5" />}
              {activeTab === 'contact' && <Building2 className="w-5 h-5" />}
              {activeTab === 'faq' && <HelpCircle className="w-5 h-5" />}
              {activeTab === 'notfound' && <AlertCircle className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h3 className="text-base font-black">
                {activeTab === 'privacy' && 'Citizen Privacy & Data Protection Policy'}
                {activeTab === 'terms' && 'Civic Platform Terms of Service'}
                {activeTab === 'contact' && 'Official City Hall Contact & Nodal Office'}
                {activeTab === 'faq' && 'Civic FAQs & Direct Redressal'}
                {activeTab === 'notfound' && '404 - Municipal Resource Not Found'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CivicFix Public Municipal Infrastructure &bull; Official Guidelines 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-5 gap-2 bg-gray-50/70 dark:bg-gray-900/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-[#0050c8] text-[#0050c8] dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Civic FAQs
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-[#0050c8] text-[#0050c8] dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Official City Hall Contact
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#0050c8] text-[#0050c8] dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#0050c8] text-[#0050c8] dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('notfound')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notfound'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Custom 404
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs md:text-sm leading-relaxed text-[#424655] dark:text-gray-300 flex-1">
          {activeTab === 'faq' && (
            <div className="space-y-4 relative">
              <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0050c8] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#121c28] dark:text-white">
                    Frequently Asked Questions by Residents
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Official municipal guidance for submitting civic hazard reports, tracking repair SLAs, and accessing community perks.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {CIVIC_FAQ_ITEMS.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenModalFaq(openModalFaq === idx ? null : idx)}
                      className="w-full p-3.5 md:p-4 text-left flex items-center justify-between gap-3 font-bold text-xs md:text-sm text-[#121c28] dark:text-gray-100 hover:text-[#0050c8] dark:hover:text-blue-400 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 flex-wrap">
                        {faq.category && (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0050c8] dark:text-blue-300">
                            {faq.category}
                          </span>
                        )}
                        <span>{faq.q}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                          openModalFaq === idx ? 'rotate-180 text-[#0050c8] dark:text-blue-400' : ''
                        }`}
                      />
                    </button>
                    {openModalFaq === idx && (
                      <div className="px-4 pb-4 pt-1 text-xs text-[#424655] dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700/50 animate-in fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Floating 'Ask the City' Button within the FAQ section */}
              <div className="sticky bottom-0 pt-4 pb-2 z-10 flex justify-center bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#1e2330] dark:via-[#1e2330]/95 pointer-events-none">
                <button
                  type="button"
                  id="modal-ask-the-city-btn"
                  onClick={() => setActiveTab('contact')}
                  className="pointer-events-auto inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0050c8] to-[#1d68f2] hover:from-[#003da1] hover:to-[#0050c8] active:scale-95 text-white font-bold text-xs shadow-lg hover:shadow-xl shadow-blue-500/25 border border-blue-400/30 transition-all cursor-pointer group"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <MessageCircle className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                  <span>Ask the City</span>
                  <span className="text-blue-100 text-[11px] font-normal border-l border-blue-300/30 pl-2">
                    Open Municipal Contact &rarr;
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <p className="font-bold text-[#0050c8] dark:text-blue-300">
                  Summary: Your privacy is respected by design.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  We only request your geolocation and photos when you explicitly file or view a civic defect. No personal surveillance or commercial marketing data is sold.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  1. Information We Collect
                </h4>
                <p>
                  When reporting a municipal issue, we collect the geographic coordinates (latitude and longitude) of the defect, user-provided photographic evidence, timestamps, and your chosen citizen handle.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  2. AI Image Vision &amp; Anonymization
                </h4>
                <p>
                  Defect photos submitted to the civic portal are analyzed by on-device and server-side machine vision for pothole depth and defect classification. Any incidental human faces or vehicle license plates are processed with blur protection before public municipal map display.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  3. Offline Storage &amp; IndexedDB
                </h4>
                <p>
                  To ensure uninterrupted functionality during poor network reception in under-construction roads or storm drains, reports are cached locally in your browser's encrypted IndexedDB storage until internet connectivity is restored.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  4. Data Retention &amp; Government Audits
                </h4>
                <p>
                  Resolved civic reports are retained in municipal public audit archives for a period of 36 months to verify contractor repair warranties and public infrastructure spending.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <p className="font-bold text-emerald-800 dark:text-emerald-300">
                  Citizen Charter &amp; Responsible Reporting
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  CivicFix is a civic empowerment utility. Honest, high-accuracy reporting ensures swift road repairs, reliable streetlights, and prompt garbage clearance.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  1. Acceptance of Municipal Service Terms
                </h4>
                <p>
                  By accessing or registering with the CivicFix platform, you agree to comply with city municipal bylaws and refrain from submitting fraudulent, abusive, or copyrighted imagery.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  2. Civic Credits &amp; Community Rewards
                </h4>
                <p>
                  Civic credits earned from reporting confirmed defects, upvoting neighborhood repairs, and verifying contractor resolutions have no direct cash redemption value but can be converted into local municipal utility vouchers, transit passes, or botanical garden entries.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  3. Response Times &amp; Service Level Agreements (SLA)
                </h4>
                <p>
                  Emergency hazards (fallen electrical cables, ruptured water mains, sinkholes) are prioritized with a 2-4 hour field response target. General street maintenance issues are dispatched within 24-72 hours based on municipal crew availability.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#121c28] dark:text-white mb-1">
                  4. Disclaimers &amp; Safety First
                </h4>
                <p>
                  Do not place yourself or others in physical danger to capture defect photographs. Always document defects from a safe sidewalk or pedestrian vantage point.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-5">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-[#0050c8]" />
                  <div>
                    <h5 className="font-bold text-sm text-[#121c28] dark:text-white">
                      BBMP Head Office &bull; Central Control Room
                    </h5>
                    <p className="text-xs text-gray-500">
                      Corporation Circle, Hudson Circle, Bengaluru, Karnataka 560002
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'BBMP Head Office, Corporation Circle, Hudson Circle, Bengaluru, Karnataka 560002',
                      'address'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-bold flex items-center gap-1.5 hover:bg-white dark:hover:bg-gray-700 cursor-pointer shadow-2xs"
                >
                  {copiedField === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{copiedField === 'address' ? 'Address Copied' : 'Copy Address'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      <span>Civic Helpline (24x7)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('080-22221188', 'phone1')}
                      className="text-[11px] text-[#0050c8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'phone1' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#121c28] dark:text-white">080-22221188</p>
                  <a
                    href="tel:08022221188"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0050c8] dark:text-blue-400 hover:underline pt-1"
                  >
                    <span>Direct Call Helpline &rarr;</span>
                  </a>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Grievance Redressal Desk</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('grievances@civicfix.gov.in', 'email1')}
                      className="text-[11px] text-[#0050c8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'email1' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#121c28] dark:text-white">
                    grievances@civicfix.gov.in
                  </p>
                  <a
                    href="mailto:grievances@civicfix.gov.in?subject=Civic%20Inquiry%20-%20Ward%20Resident%20Assistance"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0050c8] dark:text-blue-400 hover:underline pt-1"
                  >
                    <span>Send Resident Inquiry &rarr;</span>
                  </a>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <h5 className="font-bold text-xs text-amber-900 dark:text-amber-300">
                    Public Grievance Hearing Hours
                  </h5>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-400/90">
                  Every Working Day: 10:30 AM to 1:30 PM &bull; Zonal Joint Commissioner Chambers (Wards 1–198). Online video appointments can also be scheduled via the Appointment Booking portal.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notfound' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black text-[#121c28] dark:text-white">
                  404 - Page or Report Not Found
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  The requested civic grievance reference or municipal route could not be located in our active ward ledger.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#0050c8] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Return to Civic Feed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Registered Municipal Service &bull; Certified Public Trust
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
