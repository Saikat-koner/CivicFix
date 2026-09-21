import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  KeyRound,
  Fingerprint,
  UserPlus,
  Landmark,
  Radio,
  Clock,
  Award,
  LocateFixed,
  Loader2,
} from 'lucide-react';
import { UserRole, Contributor } from '../types';
import {
  authenticateUser,
  registerNewUser,
  DEDICATED_ADMIN_ACCOUNT,
  UserSessionData,
} from '../utils/storage';
import { PRESET_FACE_AVATARS, DEFAULT_CITIZEN_AVATAR } from '../data/avatars';
import { AvatarPicker } from './AvatarPicker';
import { CountryPhoneInput } from './CountryPhoneInput';
import { CaptchaBox } from './CaptchaBox';
import { soundFX } from '../utils/audioFeedback';
import confetti from 'canvas-confetti';
import { getCurrentLivePosition } from '../utils/liveLocation';
import { reverseGeocodeWardAndDistrict } from '../utils/geocoding';

interface AuthGateProps {
  onAuthSuccess: (session: UserSessionData) => void;
  defaultRole?: UserRole;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onAuthSuccess,
  defaultRole = 'citizen',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected Face Avatar
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_CITIZEN_AVATAR);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCaptchaInput, setLoginCaptchaInput] = useState('');
  const [isLoginCaptchaValid, setIsLoginCaptchaValid] = useState(false);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCaptchaInput, setRegCaptchaInput] = useState('');
  const [isRegCaptchaValid, setIsRegCaptchaValid] = useState(false);
  const [regDistrict, setRegDistrict] = useState('New Delhi / NDMC Central Ward');
  const [isLocatingWard, setIsLocatingWard] = useState(false);
  const [wardSourceNotice, setWardSourceNotice] = useState<string | null>(null);

  const autoFetchResidentWard = async () => {
    setIsLocatingWard(true);
    try {
      const pos = await getCurrentLivePosition();
      const wardResult = await reverseGeocodeWardAndDistrict(pos.lat, pos.lng);
      const resolved = wardResult.ward || `${wardResult.city || 'City'}, ${wardResult.state || 'India'}`;
      setRegDistrict(resolved);
      const src = pos.source === 'device-satellite' ? 'Satellite GPS' : 'IP Network';
      setWardSourceNotice(`Auto-Detected (${src}): ±${pos.accuracy}m`);
    } catch (e) {
      console.warn('Auto ward detection fallback:', e);
      setRegDistrict('New Delhi / NDMC Central Ward');
    } finally {
      setIsLocatingWard(false);
    }
  };

  useEffect(() => {
    if (tab === 'register') {
      autoFetchResidentWard();
    }
  }, [tab]);

  const [regPledge, setRegPledge] = useState(true);

  // 1-Click Fast Demo Login
  const handleQuickDemoLogin = (demoType: 'citizen' | 'admin') => {
    setIsLoading(true);
    setErrorMessage(null);
    soundFX.playClick();

    setTimeout(() => {
      if (demoType === 'admin') {
        const res = authenticateUser(
          DEDICATED_ADMIN_ACCOUNT.email,
          DEDICATED_ADMIN_ACCOUNT.password,
          'admin'
        );
        if (res.success && res.session) {
          soundFX.playSuccess();
          try {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          } catch {}
          onAuthSuccess(res.session);
        } else {
          setErrorMessage(res.error || 'Admin login failed');
          setIsLoading(false);
        }
      } else {
        // Quick demo citizen login
        const demoEmail = 'citizen.demo@civicfix.org';
        const res = authenticateUser(demoEmail, 'citizen123', 'citizen');
        if (res.success && res.session) {
          soundFX.playSuccess();
          try {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          } catch {}
          onAuthSuccess(res.session);
        } else {
          // Register demo citizen if not already existing
          const regRes = registerNewUser({
            name: 'Priya Sharma',
            email: demoEmail,
            password: 'citizen123',
            phone: '+91 98450 11223',
            district: 'Indiranagar (Ward 112)',
            role: 'citizen',
            avatar: PRESET_FACE_AVATARS[1].imageUrl,
          });
          if (regRes.success && regRes.session) {
            soundFX.playSuccess();
            try {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            } catch {}
            onAuthSuccess(regRes.session);
          } else {
            setErrorMessage(regRes.error || 'Demo login failed');
            setIsLoading(false);
          }
        }
      }
    }, 450);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoginCaptchaValid) {
      setErrorMessage('Compulsory CAPTCHA verification required. Please solve the security code.');
      soundFX.playNotification();
      return;
    }
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both your email/username and password.');
      soundFX.playNotification();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    soundFX.playClick();

    setTimeout(() => {
      const res = authenticateUser(loginEmail.trim(), loginPassword, role);
      if (res.success && res.session) {
        soundFX.playSuccess();
        try {
          localStorage.setItem('civic_remembered_identity', loginEmail.trim());
          if (res.session.user?.name) {
            localStorage.setItem('civic_remembered_name', res.session.user.name);
          }
          localStorage.setItem('civic_has_pin', 'true');
        } catch {}
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch {}
        onAuthSuccess(res.session);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
        soundFX.playNotification();
        setIsLoading(false);
      }
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegCaptchaValid) {
      setErrorMessage('Compulsory CAPTCHA verification required. Please solve the security code.');
      soundFX.playNotification();
      return;
    }
    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      soundFX.playNotification();
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      soundFX.playNotification();
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      soundFX.playNotification();
      return;
    }
    if (!regPledge) {
      setErrorMessage('Please accept the Citizen Verifier Code of Integrity.');
      soundFX.playNotification();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    soundFX.playClick();

    setTimeout(() => {
      const res = registerNewUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        district: regDistrict,
        role: role,
        avatar: selectedAvatar,
      });

      if (res.success && res.session) {
        soundFX.playSuccess();
        try {
          confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
        } catch {}
        setSuccessMessage(`Account created! Permanent ID: ${res.permanentUserId}`);
        setTimeout(() => {
          if (res.session) {
            onAuthSuccess(res.session);
          }
        }, 600);
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
        soundFX.playNotification();
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div
      id="auth-gate-wrapper"
      className="min-h-screen w-full bg-gradient-to-br from-[#0b1320] via-[#121c28] to-[#1a2636] text-gray-900 flex flex-col justify-between relative overflow-x-hidden selection:bg-blue-600 selection:text-white"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Top Brand Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight">CivicFix</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                Official Grid
              </span>
            </div>
            <p className="text-xs text-gray-400">Municipal Citizen Incident & Redressal Terminal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud SQL PostgreSQL Active</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100/80 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 md:p-8 pb-4 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  {tab === 'login' ? 'Sign In to CivicFix' : 'Create Citizen Account'}
                </h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {tab === 'login'
                    ? 'Access your ward reports, GPS live radar, and official redressal guaranteed by city charter.'
                    : 'Register your permanent Citizen ID to report issues, verify road repairs, and earn Civic Credits.'}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                {tab === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
            </div>

            {/* Role Toggle */}
            <div className="flex p-1 bg-gray-100/90 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setRole('citizen');
                  soundFX.playClick();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  role === 'citizen'
                    ? 'bg-white text-blue-700 shadow-xs border border-gray-200/60'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Citizen Contributor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  soundFX.playClick();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-[#121c28] text-amber-400 shadow-xs border border-[#243346]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>City Official / Admin</span>
              </button>
            </div>

            {/* Quick 1-Click Demo Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen')}
                disabled={isLoading}
                className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Log in immediately as a verified Citizen"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Demo Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                disabled={isLoading}
                className="flex-1 py-1.5 px-3 bg-gray-900 hover:bg-black text-amber-300 border border-gray-800 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Log in as Chief Municipal Commissioner"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Demo Admin</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 md:p-8 space-y-5">
            {/* Tabs: Login vs Register */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                  soundFX.playClick();
                }}
                className={`pb-3 text-sm font-black transition-all relative cursor-pointer mr-6 ${
                  tab === 'login' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Sign In
                {tab === 'login' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage(null);
                  soundFX.playClick();
                }}
                className={`pb-3 text-sm font-black transition-all relative cursor-pointer ${
                  tab === 'register' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Register New Account
                {tab === 'register' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: LOGIN FORM */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {role === 'admin' ? (
                  <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Official Municipal Administration Portal</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Log in with your official municipal credentials or click <strong>1-Click Demo Admin</strong> above to test Commissioner tools.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Email / ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>Email Address or Citizen ID</span>
                  </label>
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={role === 'admin' ? 'official@city.gov' : 'citizen@example.org or CFX-CID-...'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Password</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-300 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Compulsory CAPTCHA Verification */}
                <CaptchaBox
                  onValidate={setIsLoginCaptchaValid}
                  userInput={loginCaptchaInput}
                  onChangeInput={setLoginCaptchaInput}
                  idPrefix="authgate-login-captcha"
                  required={true}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isLoginCaptchaValid}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter CivicFix Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER FORM WITH AVATAR PICKER */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* 1. Interactive Avatar & Face Icon Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Choose Your Avatar or Face Icon</span>
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold">18+ Presets Available</span>
                  </label>
                  <AvatarPicker
                    selectedAvatarUrl={selectedAvatar}
                    onSelectAvatar={(url) => setSelectedAvatar(url)}
                    userRole={role}
                    userName={regName || 'New Citizen'}
                  />
                </div>

                {/* 2. Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Full Legal Name</span>
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Priya Sharma or Aarav Patel"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* 3. Email & Phone (Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>Email</span>
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="citizen@example.org"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>Mobile (SMS Alerts)</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">All Countries Supported</span>
                    </label>
                    <CountryPhoneInput
                      value={regPhone}
                      onChange={setRegPhone}
                      placeholder="98450 12345"
                      defaultCountryCode="IN"
                    />
                  </div>
                </div>

                {/* 4. Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Create Security Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-300 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Citizen Pledge */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <input
                    type="checkbox"
                    id="pledge-chk"
                    checked={regPledge}
                    onChange={(e) => setRegPledge(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="pledge-chk" className="text-[11px] text-gray-600 leading-tight cursor-pointer">
                    I agree to the <strong>Citizen Redressal Charter</strong>. I will submit truthful, GPS-verified photos of civic hazards and help verify municipal repair completions in my neighborhood.
                  </label>
                </div>

                {/* Compulsory CAPTCHA Verification for Registration */}
                <CaptchaBox
                  onValidate={setIsRegCaptchaValid}
                  userInput={regCaptchaInput}
                  onChangeInput={setRegCaptchaInput}
                  idPrefix="authgate-reg-captcha"
                  required={true}
                />

                {/* Submit Register */}
                <button
                  type="submit"
                  disabled={isLoading || !isRegCaptchaValid}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration & Generate Citizen ID</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer Highlights */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-around text-center text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Tamper-Proof ID</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>+200 Welcome Bonus CC</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-gray-400">
        CivicFix Municipal Platform • Unified Citizen Redressal & Live Infrastructure Monitoring
      </footer>
    </div>
  );
};
