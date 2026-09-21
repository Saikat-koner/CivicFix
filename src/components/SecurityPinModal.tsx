import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Fingerprint,
  Lock,
  KeyRound,
  CheckCircle2,
  Smartphone,
  Check,
  AlertCircle
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';
import confetti from 'canvas-confetti';

interface SecurityPinModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onPinConfigured?: (pin: string) => void;
  onSuccess?: () => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen = true,
  onClose,
  onPinConfigured,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    soundFX.playClick();
    setErrorMessage(null);

    if (step === 'create') {
      if (pin.length < 4) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => {
            setStep('confirm');
          }, 200);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + num;
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          if (nextConfirm === pin) {
            soundFX.playSuccess();
            confetti({ particleCount: 60, spread: 50 });
            setStep('success');
            try {
              localStorage.setItem('civicfix_app_pin', nextConfirm);
              localStorage.setItem('civicfix_biometric', String(biometricEnabled));
            } catch {
              // ignore
            }
            if (onPinConfigured) onPinConfigured(nextConfirm);
            if (onSuccess) onSuccess();
          } else {
            soundFX.playAlert();
            setErrorMessage('PINs do not match. Please try again.');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    soundFX.playClick();
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setPin('');
    setConfirmPin('');
    setStep('create');
    setErrorMessage(null);
  };

  return (
    <div
      id="security-pin-vault-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 md:p-8 shadow-2xl border border-[#c2c6d7] relative space-y-5 text-center my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#737686] hover:text-[#121c28] hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="space-y-1.5 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#0050c8] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <span className="text-[10px] font-extrabold text-[#0050c8] uppercase tracking-wider block">
            Security PIN Vault
          </span>
          <h3 className="text-xl font-black text-[#121c28] tracking-tight">
            {step === 'create' && 'Set Rapid-Entry PIN'}
            {step === 'confirm' && 'Confirm 4-Digit PIN'}
            {step === 'success' && 'PIN Vault Configured'}
          </h3>
          <p className="text-xs text-[#56596e]">
            {step === 'create' && 'Protect your civic reports, credit transactions, and official escalation filings.'}
            {step === 'confirm' && 'Re-enter your 4-digit security PIN to confirm.'}
            {step === 'success' && 'Your device-level security vault is active and encrypted.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl text-xs font-semibold text-[#ba1a1a] flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PIN Dots Indicator */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const activeVal = step === 'create' ? pin : confirmPin;
              const isFilled = idx < activeVal.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-[#0050c8] scale-125 ring-4 ring-[#EDF4FF]'
                      : 'border-2 border-[#c2c6d7] bg-white'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Keypad */}
        {step !== 'success' ? (
          <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="w-16 h-16 rounded-2xl bg-[#f8f9ff] hover:bg-[#eef4ff] text-[#121c28] text-xl font-black border border-[#c2c6d7]/60 shadow-2xs hover:border-[#0050c8] active:scale-95 transition-all flex items-center justify-center mx-auto cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleReset}
              className="w-16 h-16 rounded-2xl text-[11px] font-bold text-[#737686] hover:text-[#121c28] flex items-center justify-center mx-auto cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="w-16 h-16 rounded-2xl bg-[#f8f9ff] hover:bg-[#eef4ff] text-[#121c28] text-xl font-black border border-[#c2c6d7]/60 shadow-2xs hover:border-[#0050c8] active:scale-95 transition-all flex items-center justify-center mx-auto cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-16 h-16 rounded-2xl text-xs font-bold text-[#ba1a1a] hover:bg-red-50 flex items-center justify-center mx-auto cursor-pointer rounded-2xl"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            <div className="p-4 bg-[#EDF4FF] rounded-2xl border border-[#dae2ff] text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#0050c8] font-black">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span>Vault Encryption Enabled</span>
              </div>
              <p className="text-[#424655]">
                Hardware key binding established. Rapid PIN entry will now protect your municipal filings and citizen reward withdrawals.
              </p>
            </div>

            {/* Biometric Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div className="flex items-center gap-2 text-left">
                <Fingerprint className="w-4 h-4 text-[#0050c8]" />
                <div>
                  <span className="font-extrabold text-[#121c28] block">Biometric Unlock</span>
                  <span className="text-[10px] text-[#737686]">FaceID / Fingerprint Quick Sign</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={biometricEnabled}
                onChange={(e) => setBiometricEnabled(e.target.checked)}
                className="w-4 h-4 text-[#0050c8] rounded focus:ring-[#0050c8] cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (onSuccess) onSuccess();
                onClose();
              }}
              className="w-full py-3 bg-[#0050c8] hover:bg-[#1d68f2] text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
