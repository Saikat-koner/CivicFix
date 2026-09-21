import React from 'react';
import { Contributor } from '../types';
import {
  X,
  Printer,
  ShieldCheck,
  Building2,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Share2
} from 'lucide-react';

interface CivicCertificateModalProps {
  citizen: Contributor;
  onClose: () => void;
}

export const CivicCertificateModal: React.FC<CivicCertificateModalProps> = ({
  citizen,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const certificateId = `CERT-CFX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const verificationHash = 'SHA256: 8f4e2b19c67a4d9e03f15b82c7a9e4d1';

  return (
    <div
      id="certificate-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="certificate-modal-card"
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border-4 border-double border-amber-300 relative my-6 animate-in zoom-in-95 duration-200 print:shadow-none print:border-2 print:border-black print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-[#121c28] text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Official Municipal Civic Distinction Certificate
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Frame Interior */}
        <div className="p-8 sm:p-12 text-center relative bg-[radial-gradient(#f8fafc_1px,transparent_1px)] [background-size:16px_16px]">
          {/* Subtle Watermark Badge */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Building2 className="w-80 h-80 text-[#003180]" />
          </div>

          {/* Municipal Header Emblem */}
          <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-black flex items-center justify-center shadow-lg border-2 border-white">
              <Award className="w-9 h-9 text-[#0b1320]" />
            </div>
            
            <div className="space-y-0.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#003180]">
                Metropolitan Municipal Corporation & Public Works Department
              </p>
              <p className="text-xs font-serif italic text-[#737686]">
                Office of the Municipal Commissioner & Civic Infrastructure Council
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="my-6 space-y-1 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#121c28] tracking-tight">
              Certificate of Civic Merit
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2" />
          </div>

          {/* Recipient Name */}
          <div className="space-y-3 relative z-10 my-4">
            <p className="text-xs uppercase tracking-widest text-[#737686] font-sans font-bold">
              This Official Municipal Distinction is Proudly Bestowed Upon
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0050c8] font-serif border-b-2 border-[#dae2ff] pb-2 inline-block px-8">
              {citizen.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#424655] max-w-lg mx-auto leading-relaxed pt-2">
              in formal recognition of outstanding neighborhood vigilance, accurate hazard reporting, and citizen verification efforts that have directly contributed to public safety and infrastructure integrity.
            </p>
          </div>

          {/* Merit Accomplishments Box */}
          <div className="grid grid-cols-3 gap-3 my-6 max-w-md mx-auto relative z-10">
            <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#dae2ff]">
              <span className="text-lg font-black text-[#0050c8] font-mono block">
                {citizen.issuesResolved}
              </span>
              <span className="text-[10px] font-bold text-[#737686] uppercase">
                Verified Fixes
              </span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-lg font-black text-amber-700 font-mono block">
                {citizen.civicCredits.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-amber-800 uppercase">
                Civic Credits
              </span>
            </div>

            <div className="p-3 bg-[#dcfce7] rounded-xl border border-[#bbf7d0]">
              <span className="text-lg font-black text-[#15803d] font-mono block">
                #{citizen.rank}
              </span>
              <span className="text-[10px] font-bold text-[#15803d] uppercase">
                City Rank
              </span>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-gray-200 relative z-10 max-w-lg mx-auto text-left">
            <div>
              <div className="font-serif italic text-base font-bold text-[#121c28]">
                Er. Rameshwar Prasad, IAS
              </div>
              <p className="text-[10px] uppercase font-bold text-[#737686]">
                Municipal Commissioner & Administrator
              </p>
              <div className="flex items-center gap-1 text-[9px] text-[#10B981] font-mono mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Digitally Certified</span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-serif italic text-base font-bold text-[#121c28]">
                Smt. K. Vani Reddy
              </div>
              <p className="text-[10px] uppercase font-bold text-[#737686]">
                Ward 112 Standing Committee Chairperson
              </p>
              <div className="flex items-center justify-end gap-1 text-[9px] text-[#10B981] font-mono mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Standing Council Approved</span>
              </div>
            </div>
          </div>

          {/* Verification Hash & Security Strip */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#737686] relative z-10 gap-2">
            <span className="font-mono">{certificateId}</span>
            <span className="font-mono text-[9px] truncate max-w-xs">{verificationHash}</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-bold">
              VERIFIED AUTHENTIC
            </span>
          </div>
        </div>

        {/* Print & Share CTA (hidden in print) */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <span className="text-xs text-[#737686]">
            This certificate is registered on the Municipal Blockchain Registry.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#0050c8] hover:bg-[#1d68f2] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#c2c6d7] text-[#121c28] hover:bg-gray-100 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
