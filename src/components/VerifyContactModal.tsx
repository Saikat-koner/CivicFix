import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  X,
  Send,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audioFeedback';
import { CountryPhoneInput } from './CountryPhoneInput';
import { updateUserContactVerification } from '../utils/storage';
import { showBrowserNotification } from '../utils/freeNotifications';

export interface VerifyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contactData: { email: string; phone: string }) => void;
  initialEmail?: string;
  initialPhone?: string;
  userName?: string;
  userId?: string;
  reportTitle?: string;
  isFirstReport?: boolean;
}

export const VerifyContactModal: React.FC<VerifyContactModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
  initialPhone = '',
  userName = 'Resident',
  userId = '',
  reportTitle,
  isFirstReport = true,
}) => {
  const [step, setStep] = useState<'contact' | 'otp' | 'success'>('contact');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [dispatchStatus, setDispatchStatus] = useState<{
    emailStatus?: string;
    smsStatus?: string;
    demoCode?: string;
  }>({});

  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setPhone(initialPhone || '');
      setStep('contact');
      setGeneralError('');
      setOtpError('');
      setEmailError('');
      setPhoneError('');
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [isOpen, initialEmail, initialPhone]);

  // Resend cooldown timer
  useEffect(() => {
    if (step === 'otp' && resendCooldown > 0) {
      timerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, resendCooldown]);

  if (!isOpen) return null;

  const validateInputs = (): boolean => {
    let valid = true;
    setEmailError('');
    setPhoneError('');
    setGeneralError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Email address is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      setPhoneError('Mobile phone number is required.');
      valid = false;
    } else if (cleanPhoneDigits.length < 10) {
      setPhoneError('Please enter a valid mobile number (at least 10 digits).');
      valid = false;
    }

    return valid;
  };

  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateInputs()) {
      soundFX.playError();
      return;
    }

    setIsSendingOtp(true);
    setGeneralError('');
    soundFX.playClick();

    try {
      const response = await fetch('/api/communications/send-dual-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          citizenName: userName,
          purpose: 'first_report_verification',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setDispatchStatus({
        emailStatus: data.emailDispatch?.status || 'dispatched',
        smsStatus: data.smsDispatch?.status || 'dispatched',
        demoCode: data.code,
      });

      if (data.code) {
        showBrowserNotification({
          title: 'CivicFix 100% Free Verification Code',
          body: `Your 6-digit verification code is ${data.code}. Please enter this to complete contact verification.`,
        });
      }

      soundFX.playSuccess();
      setStep('otp');
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);

      // Auto-focus first digit input box after render
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      soundFX.playError();
      setGeneralError(err.message || 'Unable to dispatch verification code. Please check your network and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    // Only accept numeric digits
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Handle single character
    const char = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setOtpError('');

    // Advance to next box
    if (index < 5 && char) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are now filled, auto-verify
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerifyCode(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    setOtpError('');

    if (pasted.length === 6) {
      digitInputRefs.current[5]?.focus();
      handleVerifyCode(pasted);
    } else {
      digitInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      soundFX.playError();
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');
    soundFX.playClick();

    try {
      const response = await fetch('/api/communications/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          otpCode: code,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        throw new Error(data.error || 'Incorrect or expired verification code. Please check your messages and try again.');
      }

      // Verification successful!
      soundFX.playSuccess();
      confetti({
        particleCount: 110,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0050c8', '#10B981', '#f88400'],
      });

      // Update storage and persistence
      updateUserContactVerification(userId || email, {
        email: email.trim(),
        phone: phone.trim(),
        emailVerified: true,
        phoneVerified: true,
        contactVerified: true,
        firstReportSubmitted: true,
      });

      setStep('success');

      // Brief delay to showcase celebratory confirmation before proceeding
      setTimeout(() => {
        onSuccess({ email: email.trim(), phone: phone.trim() });
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      soundFX.playError();
      setOtpError(err.message || 'Incorrect verification code. Please check your email and phone.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div
      id="verify-contact-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="verify-contact-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#c2c6d7] relative overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0050c8] via-[#10B981] to-[#0050c8]" />

        {/* Close Button */}
        <button
          type="button"
          id="close-verify-contact-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDF4FF] border border-[#dae2ff] text-[11px] font-extrabold text-[#0050c8] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gov-Civic Verified Citizen Gate</span>
          </div>
          {isFirstReport && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              1st Report Submission
            </span>
          )}
        </div>

        {/* STEP 1: CONFIRM CONTACT DETAILS */}
        {step === 'contact' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-[#121c28] tracking-tight">
                Verify Contact Information
              </h2>
              <p className="text-xs sm:text-sm text-[#424655] mt-1.5 leading-relaxed">
                To prevent spam and allow municipal emergency dispatch crews to coordinate field repairs, please confirm your registered <strong>email address</strong> and <strong>mobile phone number</strong> using a 6-digit verification code.
              </p>
            </div>

            {reportTitle && (
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-blue-900 truncate">Pending Report Submission:</p>
                  <p className="text-blue-700 truncate font-semibold">{reportTitle}</p>
                </div>
              </div>
            )}

            {generalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSendVerificationCode} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="verify-contact-email-input"
                  className="block text-xs font-black uppercase tracking-wider text-[#121c28]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="verify-contact-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      emailError
                        ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500'
                        : 'border-[#c2c6d7] focus:border-[#0050c8] focus:ring-2 focus:ring-[#0050c8]/20'
                    }`}
                  />
                </div>
                {emailError && <p className="text-[11px] text-rose-600 font-semibold">{emailError}</p>}
              </div>

              {/* Phone Input with Country Code Selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="verify-contact-phone-input"
                  className="block text-xs font-black uppercase tracking-wider text-[#121c28]"
                >
                  Mobile Phone Number (SMS)
                </label>
                <CountryPhoneInput
                  id="verify-contact-phone-input"
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  placeholder="98765 43210"
                  required
                />
                {phoneError && <p className="text-[11px] text-rose-600 font-semibold">{phoneError}</p>}
                <p className="text-[11px] text-gray-400">
                  Select your country code and enter active mobile number to receive SMS.
                </p>
              </div>

              {/* Dual Broadcast Assurance Notice */}
              <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-1 text-xs text-[#56596e]">
                <div className="flex items-center gap-1.5 text-[#121c28] font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Simultaneous Multi-Factor Dispatch</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  A single 6-digit code is dispatched to both your email inbox and phone number via SMS concurrently. You can retrieve and enter the code from whichever channel arrives first.
                </p>
              </div>

              {/* Submit / Dispatch Button */}
              <button
                type="submit"
                id="send-contact-verification-code-btn"
                disabled={isSendingOtp}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0050c8] hover:bg-[#1d68f2] active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching 6-Digit Code...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send 6-Digit Verification Code</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: ENTER 6-DIGIT CODE */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#121c28] tracking-tight">
                  Enter 6-Digit Code
                </h2>
                <p className="text-xs text-[#424655] mt-1">
                  Check your email inbox and phone SMS messages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('contact')}
                className="text-xs font-bold text-[#0050c8] hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Contact</span>
              </button>
            </div>

            {/* Dispatched Channels Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0050c8] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Free Email Dispatched</p>
                  <p className="font-semibold text-[#121c28] truncate">{email}</p>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Free SMS Dispatched</p>
                  <p className="font-semibold text-[#121c28] truncate">{phone}</p>
                </div>
              </div>
            </div>

            {/* 100% Free Notice */}
            <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>100% Free Civic Gateway Delivery (Zero Telecom/SMS Charges)</span>
            </div>

            {/* Quick Channel Openers */}
            <div className="flex items-center gap-2 text-[11px]">
              <a
                href={`mailto:${email}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Email App</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
              <a
                href={`sms:${phone}`}
                className="flex-1 py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open Messages</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>

            {/* 6-Digit OTP Box Inputs */}
            <div className="space-y-3">
              <label
                htmlFor="verify-contact-otp-digit-0"
                className="block text-xs font-black uppercase tracking-wider text-center text-[#121c28]"
              >
                Enter 6-Digit Verification Code
              </label>
              <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`verify-contact-otp-digit-${idx}`}
                    ref={(el) => {
                      digitInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-mono font-black rounded-xl border-2 border-[#c2c6d7] focus:border-[#0050c8] focus:ring-2 focus:ring-[#0050c8]/20 bg-white text-[#121c28] shadow-xs transition-all"
                  />
                ))}
              </div>

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{otpError}</span>
                </div>
              )}
            </div>

            {/* Verification Button */}
            <button
              type="button"
              id="confirm-contact-verification-btn"
              disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
              onClick={() => handleVerifyCode()}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isVerifyingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code & Authorizing Report...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Contact & Submit Report</span>
                </>
              )}
            </button>

            {/* Resend Actions */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Didn't receive the code?</span>
              {resendCooldown > 0 ? (
                <span className="font-bold text-gray-400">
                  Resend code in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  id="resend-contact-otp-btn"
                  onClick={() => handleSendVerificationCode()}
                  disabled={isSendingOtp}
                  className="font-extrabold text-[#0050c8] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#121c28] tracking-tight">
                Contact Verified Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-[#424655] mt-1">
                Your email and mobile number have been authenticated. Submitting your civic report now...
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Civic Reporter Status Active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
