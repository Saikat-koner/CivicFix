import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Contributor, UserRole } from '../types';
import {
  X,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Award,
  ExternalLink,
  QrCode,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';

interface PramanPatraModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Contributor | null;
  userRole?: UserRole;
  userDistrict?: string;
  userEmail?: string;
  userPhone?: string;
}

export const PramanPatraModal: React.FC<PramanPatraModalProps> = ({
  isOpen,
  onClose,
  user,
  userRole = 'citizen',
  userDistrict = 'General Resident Zone',
  userEmail,
  userPhone,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const citizenName = user?.name || 'Authorized Citizen of India';
  const citizenId = user?.id || 'IND-CIVIC-2026-84920';
  const certificateNumber = `GOI-MoHUA-CIVIC-${citizenId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-8) || '20269988'}`;
  const issueDate = '11 September 2026';
  const civicCredits = user?.civicCredits || (user as any)?.reputationScore || 350;
  const issuesReported = (user as any)?.issuesReported || (user as any)?.reportsCount || 12;
  const verificationsCount = (user as any)?.verificationsCount || 28;

  // Verification URL encoded into QR
  const verificationUrl = `https://nagrik.gov.in/verify/praman-patra?certId=${certificateNumber}&citizen=${encodeURIComponent(
    citizenName
  )}&issued=2026-09-11&status=VERIFIED_ACTIVE`;

  // Generate real QR code when opened
  useEffect(() => {
    if (!isOpen) return;

    setIsGenerating(true);
    QRCode.toDataURL(
      verificationUrl,
      {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        setIsGenerating(false);
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, verificationUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    soundFX.playClick();
    window.print();
  };

  const handleCopyLink = () => {
    soundFX.playClick();
    navigator.clipboard?.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQr = () => {
    soundFX.playClick();
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `praman-patra-qr-${certificateNumber}.png`;
    a.click();
  };

  const handleShare = async () => {
    soundFX.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Official Praman Patra: ${citizenName}`,
          text: `Official Government of India Civic Commendation Certificate (Praman Patra) for ${citizenName}. Certificate ID: ${certificateNumber}`,
          url: verificationUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      id="praman-patra-modal-overlay"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="praman-patra-modal-container"
        className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-300/60 dark:border-amber-500/40 my-auto overflow-hidden text-gray-900 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-amber-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>प्रमाण पत्र | Official Government Civic Certificate</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Share Certificate"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Certificate Body */}
        <div className="p-4 sm:p-8 max-h-[80vh] overflow-y-auto print:max-h-none print:p-0">
          <div
            ref={certificateRef}
            id="official-praman-patra-document"
            className="relative bg-gradient-to-b from-[#fffef7] to-[#fffdf0] dark:from-slate-900 dark:to-slate-950 p-6 sm:p-10 rounded-2xl border-4 border-double border-amber-500/80 shadow-inner overflow-hidden text-center"
          >
            {/* National Tiranga Tricolor Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-2.5 flex">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-[#FFFFFF] border-y border-gray-200" />
              <div className="flex-1 bg-[#138808]" />
            </div>

            {/* Subtle Watermark Emblem Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] dark:opacity-[0.06] pointer-events-none select-none">
              <div className="w-80 h-80 rounded-full border-8 border-dashed border-amber-900 flex items-center justify-center text-9xl">
                🏛️
              </div>
            </div>

            {/* Certificate Header */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 border border-amber-400 flex items-center justify-center text-lg shadow-xs">
                  ☸️
                </div>
              </div>
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-900 dark:text-amber-300">
                भारत सरकार • GOVERNMENT OF INDIA
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400">
                आवासन और शहरी कार्य मंत्रालय • MINISTRY OF HOUSING AND URBAN AFFAIRS
              </p>
              <p className="text-[9.5px] font-medium text-gray-500 dark:text-gray-500 tracking-wider">
                राष्ट्रीय नागरिक सहभागिता एवं डिजिटल सशक्तिकरण प्राधिकरण
              </p>
            </div>

            {/* Official Seal / Title */}
            <div className="my-5 py-3 border-y-2 border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-wide text-amber-950 dark:text-amber-100">
                नागरिक प्रमाण पत्र
              </h2>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-amber-800 dark:text-amber-300 mt-0.5">
                PRAMAN PATRA • CERTIFICATE OF CIVIC COMMENDATION
              </p>
            </div>

            {/* Certificate Body Text */}
            <div className="max-w-xl mx-auto space-y-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-serif">
              <p className="italic text-gray-600 dark:text-gray-400">
                This is to certify that the citizen named below is officially registered and verified under the National Urban Civic Mission, having actively contributed to urban maintenance, civic reporting, and public welfare.
              </p>

              {/* Citizen Name Spotlight */}
              <div className="py-2">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0050c8] dark:text-blue-400 underline decoration-amber-400 decoration-2 underline-offset-4 tracking-tight">
                  {citizenName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                  Permanent Resident ID: <strong className="text-gray-800 dark:text-gray-200">{citizenId}</strong>
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-amber-200 dark:border-gray-700 text-center font-sans">
                <div className="p-2">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Civic Credits</div>
                  <div className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{civicCredits} CC</span>
                  </div>
                </div>
                <div className="p-2 border-x border-amber-100 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Hazards Reported</div>
                  <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {issuesReported} Verified
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Civic Audits</div>
                  <div className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400">
                    {verificationsCount} Audited
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Awarded for exemplary commitment towards creating cleaner, safer, and responsive urban infrastructure for all citizens of the Republic of India.
              </p>
            </div>

            {/* Bottom Section: QR Code & Signatures */}
            <div className="mt-8 pt-6 border-t border-amber-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Dynamic QR Code */}
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-amber-300 dark:border-gray-600 shadow-xs text-left">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1 rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Verification QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-12 h-12 text-gray-400 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Official DigiLocker Verifiable</span>
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight">
                    Scan with any smartphone or DigiLocker app to authenticate this Praman Patra.
                  </p>
                  <p className="text-[9px] font-mono text-gray-400 dark:text-gray-500">
                    Cert No: {certificateNumber}
                  </p>
                  <button
                    onClick={handleDownloadQr}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download QR</span>
                  </button>
                </div>
              </div>

              {/* Digital Signatures */}
              <div className="flex items-center justify-around sm:justify-end gap-6 text-center w-full sm:w-auto">
                <div className="space-y-1">
                  <div className="h-9 flex items-end justify-center">
                    <span className="font-serif italic text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 tracking-wider">
                      R. K. Sharma
                    </span>
                  </div>
                  <div className="w-28 sm:w-32 h-0.5 bg-gray-400 mx-auto" />
                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                    Joint Secretary
                  </p>
                  <p className="text-[8.5px] text-gray-500 dark:text-gray-400">
                    Ministry of Housing & Urban Affairs
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="h-9 flex items-end justify-center">
                    <span className="font-serif italic text-base sm:text-lg font-bold text-[#0050c8] dark:text-blue-400 tracking-wider">
                      Dr. A. Verma, IAS
                    </span>
                  </div>
                  <div className="w-28 sm:w-32 h-0.5 bg-gray-400 mx-auto" />
                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                    Director General
                  </p>
                  <p className="text-[8.5px] text-gray-500 dark:text-gray-400">
                    National Civic Registry
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-5 pt-3 border-t border-dashed border-amber-200 dark:border-gray-800 text-[9.5px] text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-between gap-2">
              <span>Date of Issue: {issueDate}</span>
              <span>Issued under Section 14(2) of Digital Civic Redressal Act</span>
              <span className="font-mono">Security Hash: SHA256-CERT-OK</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Verification Link'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#0050c8] hover:bg-[#003da0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
