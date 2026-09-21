import React, { useState } from 'react';
import { CivicIssue } from '../types';
import {
  X,
  Printer,
  Share2,
  QrCode,
  FileText,
  Check,
  Copy,
  Download,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';

interface PrintableWorkOrderModalProps {
  issue: CivicIssue;
  onClose: () => void;
}

export const PrintableWorkOrderModal: React.FC<PrintableWorkOrderModalProps> = ({
  issue,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'work_order' | 'neighborhood_flyer'>('work_order');

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?issue=${issue.id}` : `https://civicfix.app?issue=${issue.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`;

  const handlePrint = () => {
    soundFX.playClick();
    window.print();
  };

  const handleCopyLink = () => {
    soundFX.playSuccess();
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    soundFX.playClick();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Civic Hazard: ${issue.title}`,
          text: `Community action needed for ${issue.title} at ${issue.address}. Track repair status on CivicFix.`,
          url: shareUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header - Screen only */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDF4FF] text-[#0050c8] flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#121c28]">Export & Physical Dispatch</h2>
              <p className="text-xs text-[#56596e]">Print official municipal ticket or generate neighborhood flyer</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-gray-100 text-[#737686] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs - Screen only */}
        <div className="flex gap-2 my-3 print:hidden">
          <button
            onClick={() => {
              soundFX.playClick();
              setActiveView('work_order');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeView === 'work_order'
                ? 'bg-[#0050c8] text-white shadow-xs'
                : 'bg-gray-100 text-[#424655] hover:bg-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official Work Order</span>
          </button>
          <button
            onClick={() => {
              soundFX.playClick();
              setActiveView('neighborhood_flyer');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeView === 'neighborhood_flyer'
                ? 'bg-[#0050c8] text-white shadow-xs'
                : 'bg-gray-100 text-[#424655] hover:bg-gray-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Neighborhood Poster & QR Flyer</span>
          </button>
        </div>

        {/* PRINTABLE CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto pr-1 my-2 bg-white rounded-2xl border border-gray-200 p-5 md:p-6 print:border-none print:p-0">
          {activeView === 'work_order' ? (
            <div className="space-y-4 text-[#121c28]">
              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-black pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-[#0050c8]" />
                    <span className="text-xl font-black tracking-tight uppercase">MUNICIPAL RAPID WORKS DISPATCH</span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">CivicFix Public Infrastructure Redressal System</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black font-mono bg-black text-white px-2.5 py-1 rounded">
                    {issue.code}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Grid Data */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase block mb-1">HAZARD CATEGORY & PRIORITY</span>
                  <div className="font-bold text-sm">{issue.category} • <span className="text-red-600 uppercase font-black">{issue.severity} Priority</span></div>
                  <div className="text-gray-600 mt-1 capitalize">Status: <strong>{issue.status}</strong></div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase block mb-1">LOCATION & SECTOR</span>
                  <div className="font-bold text-xs leading-snug">{issue.address}</div>
                  <div className="font-mono text-[10px] text-gray-500 mt-1">
                    GPS: {issue.location.lat.toFixed(5)}, {issue.location.lng.toFixed(5)} ({issue.district})
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-extrabold">{issue.title}</h3>
                <p className="text-xs text-gray-700 mt-1.5 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                  {issue.description}
                </p>
              </div>

              {/* Photo & QR Verification Block */}
              <div className="flex gap-4 items-center pt-2">
                <div className="w-1/2 h-36 rounded-xl overflow-hidden border border-gray-300">
                  <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                </div>
                <div className="w-1/2 flex items-center gap-3 bg-[#f8f9ff] p-3 rounded-xl border border-[#dae2ff]">
                  <img src={qrCodeUrl} alt="Scan QR" className="w-20 h-20 rounded-lg border border-gray-300" />
                  <div className="text-xs">
                    <div className="font-bold text-[#0050c8]">Scan to Verify</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Scan with phone camera to view repair milestones or add crew updates.</div>
                  </div>
                </div>
              </div>

              {/* Signatures Field for Field Inspectors */}
              <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-6 text-xs text-gray-600">
                <div>
                  <div className="h-10 border-b border-gray-400"></div>
                  <p className="text-[10px] mt-1 font-bold">Field Engineer / Inspector Signature</p>
                </div>
                <div>
                  <div className="h-10 border-b border-gray-400"></div>
                  <p className="text-[10px] mt-1 font-bold">Municipal Operations Clearance Date</p>
                </div>
              </div>
            </div>
          ) : (
            /* NEIGHBORHOOD ALERT POSTER VIEW */
            <div className="text-center space-y-4 text-[#121c28] p-2">
              <div className="bg-amber-500 text-white font-black text-xl md:text-2xl py-2 px-4 rounded-xl uppercase tracking-wider">
                ⚠️ COMMUNITY HAZARD ALERT
              </div>

              <h2 className="text-lg md:text-xl font-black leading-tight mt-3">
                {issue.title}
              </h2>

              <p className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>{issue.address}</span>
              </p>

              <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border-2 border-black shadow-md flex items-center justify-center">
                <img src={qrCodeUrl} alt="Scan QR Code" className="w-full h-full object-contain" />
              </div>

              <div className="max-w-md mx-auto bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed font-medium">
                <strong>Neighbors:</strong> Scan this QR Code with your mobile phone camera to upvote this issue and petition City Hall for immediate rapid repair.
              </div>

              <p className="text-[11px] font-mono text-gray-500">
                Ticket Ref: {issue.code} • Powered by CivicFix Citizen Platform
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Screen only */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 print:hidden flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleNativeShare}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EDF4FF] text-[#0050c8] hover:bg-[#dfe9fa] flex items-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy URL'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl text-xs font-black bg-[#1d68f2] text-white hover:bg-[#0050c8] flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
