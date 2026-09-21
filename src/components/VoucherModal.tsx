import React, { useState } from 'react';
import { RedeemedPerkVoucher } from '../types';
import {
  X,
  QrCode,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  Ticket,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoucherModalProps {
  voucher: RedeemedPerkVoucher;
  onClose: () => void;
  onMarkUsed?: (voucherId: string) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  voucher,
  onClose,
  onMarkUsed,
}) => {
  const [copied, setCopied] = useState(false);
  const [isUsed, setIsUsed] = useState(voucher.status === 'used');

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(voucher.voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUseToggle = () => {
    setIsUsed(true);
    if (onMarkUsed) {
      onMarkUsed(voucher.id);
    }
    confetti({ particleCount: 40, spread: 60 });
  };

  return (
    <div
      id="voucher-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="voucher-modal-card"
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#c2c6d7] relative my-6 animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Strip */}
        <div className="bg-gradient-to-r from-[#003180] via-[#0050c8] to-[#1d68f2] text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Official Municipal Pass
              </span>
            </div>

            <button
              id="close-voucher-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors print:hidden cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="mt-4 relative z-10">
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              {voucher.perkName}
            </h2>
            <p className="text-xs text-white/80 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Bangalore Metropolitan Civic Credit Authority</span>
            </p>
          </div>
        </div>

        {/* Voucher Pass Body */}
        <div className="p-6 space-y-6">
          {/* Barcode & Serial Section */}
          <div className="bg-[#f8f9ff] border-2 border-dashed border-[#c2c6d7] rounded-2xl p-5 text-center relative">
            <div className="flex items-center justify-center mb-3">
              {/* Simulated high-density QR Code graphic */}
              <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-200 inline-block">
                <div className="w-32 h-32 flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-2">
                  <QrCode className="w-24 h-24 text-[#003180]" />
                  <span className="text-[8px] font-mono text-gray-400 mt-1 uppercase tracking-widest">
                    Scan At Gate / Terminal
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#737686]">
                Municipal Serial Passcode
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-lg font-black tracking-wider text-[#0050c8] bg-white px-3 py-1 rounded-lg border border-[#dae2ff] shadow-xs">
                  {voucher.voucherCode}
                </span>
                <button
                  id="copy-voucher-code-btn"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-white border border-[#c2c6d7] text-[#424655] hover:bg-gray-100 transition-colors cursor-pointer print:hidden"
                  title="Copy Code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Simulated Cut Line Notches */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-r border-[#c2c6d7]" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-l border-[#c2c6d7]" />
          </div>

          {/* Key Meta Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-[#737686] block">
                Issued To Citizen
              </span>
              <span className="font-bold text-[#121c28] mt-0.5 block truncate">
                {voucher.recipientName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-[#737686] block flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Valid Until
              </span>
              <span className="font-bold text-[#121c28] mt-0.5 block">
                {voucher.validUntil}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-[#737686] block">
                Credits Exchanged
              </span>
              <span className="font-extrabold text-[#0050c8] mt-0.5 block">
                {voucher.costCC.toLocaleString()} CC
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-[#737686] block">
                Voucher Status
              </span>
              <span
                className={`font-extrabold mt-0.5 inline-block px-2 py-0.5 rounded text-[11px] ${
                  isUsed
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-[#dcfce7] text-[#15803d]'
                }`}
              >
                {isUsed ? 'REDEEMED' : 'ACTIVE & READY'}
              </span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-[#fff7ed] border border-[#fed7aa] p-3.5 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#ea580c]">
              <AlertCircle className="w-4 h-4" />
              <span>Redemption Instructions:</span>
            </div>
            <p className="text-[#9a3412] text-[11px] leading-relaxed">
              {voucher.instructions}
            </p>
          </div>

          {/* Digital Signature & Verification Guarantee */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-[#737686]">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Signed by Municipal IT Authority</span>
            </div>
            <span className="font-mono">ID: {voucher.id}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 print:hidden">
            <button
              id="print-voucher-btn"
              onClick={handlePrint}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-[#c2c6d7] text-[#121c28] hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-[#0050c8]" />
              <span>Print / Save Pass</span>
            </button>

            {!isUsed ? (
              <button
                id="mark-voucher-used-btn"
                onClick={handleUseToggle}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Mark as Presented</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Presented to Officer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
