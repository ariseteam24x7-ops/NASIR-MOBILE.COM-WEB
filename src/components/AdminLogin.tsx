import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  Lock,
  Mail,
  Key,
  ArrowLeft,
  ShieldAlert,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (token: string, user: { email: string; role: string }) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToStore }) => {
  const { language } = useLanguage();
  const [loginMode, setLoginMode] = useState<'master' | 'credentials'>('master');
  const [masterKey, setMasterKey] = useState('');
  const [showMasterKey, setShowMasterKey] = useState(false);

  // Email / Password mode state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSetupKey, setResetSetupKey] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Master Key Reset Modal State
  const [resetMasterModalOpen, setResetMasterModalOpen] = useState(false);
  const [resetMasterOwnerEmail, setResetMasterOwnerEmail] = useState('shazzzbusiness@gmail.com');
  const [resetMasterOwnerPassword, setResetMasterOwnerPassword] = useState('');
  const [resetMasterToDefault, setResetMasterToDefault] = useState(false);
  const [resetMasterNewKey, setResetMasterNewKey] = useState('');
  const [resetMasterConfirmKey, setResetMasterConfirmKey] = useState('');
  const [resetMasterLoading, setResetMasterLoading] = useState(false);
  const [resetMasterError, setResetMasterError] = useState<string | null>(null);
  const [resetMasterSuccess, setResetMasterSuccess] = useState<string | null>(null);

  // Handle Master Key Reset Request
  const handleResetMasterKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMasterError(null);
    setResetMasterSuccess(null);

    if (!resetMasterOwnerEmail.trim() || !resetMasterOwnerPassword) {
      setResetMasterError(
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة مرور حساب المالك'
          : 'Owner email and account password are required.'
      );
      return;
    }

    if (!resetMasterToDefault) {
      if (!resetMasterNewKey.trim() || resetMasterNewKey.length < 6) {
        setResetMasterError(
          language === 'ar'
            ? 'يجب أن يتكون المفتاح الجديد من 6 أحرف على الأقل'
            : 'New Master Key must be at least 6 characters long.'
        );
        return;
      }
      if (resetMasterNewKey !== resetMasterConfirmKey) {
        setResetMasterError(
          language === 'ar'
            ? 'المفتاح وتأكيده غير متطابقين'
            : 'Master Keys do not match. Please re-enter.'
        );
        return;
      }
    }

    setResetMasterLoading(true);
    try {
      const res = await fetch('/api/admin/public-reset-master-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: resetMasterOwnerEmail.trim(),
          ownerPassword: resetMasterOwnerPassword,
          newMasterKey: resetMasterToDefault ? undefined : resetMasterNewKey.trim(),
          resetToDefault: resetMasterToDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset Master Key');

      setResetMasterSuccess(data.message || 'Master Key successfully reset!');
      const newKeyUsed = resetMasterToDefault ? 'NasirMobileDubai2026!' : resetMasterNewKey.trim();
      setMasterKey(newKeyUsed);
      setTimeout(() => {
        setResetMasterModalOpen(false);
        setResetMasterSuccess(null);
        setResetMasterOwnerPassword('');
        setResetMasterNewKey('');
        setResetMasterConfirmKey('');
      }, 1600);
    } catch (err: any) {
      setResetMasterError(err.message || 'Failed to reset Master Key');
    } finally {
      setResetMasterLoading(false);
    }
  };

  // 1. Direct Master Key Login (Only master key required)
  const handleDirectMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey.trim()) {
      setError(
        language === 'ar'
          ? 'يرجى إدخال مفتاح الإدارة للمتابعة'
          : 'Please enter the Master Key to continue.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('nm_admin_token', data.token);
      localStorage.setItem('nm_admin_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
    } catch (err: any) {
      console.error('Master key login error:', err);
      setError(err.message || 'Invalid Master Key. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter both email and password.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('nm_admin_token', data.token);
      localStorage.setItem('nm_admin_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Secure Password Reset Request
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetSetupKey.trim()) {
      setResetError(language === 'ar' ? 'يرجى إدخال مفتاح الإدارة المعتمد' : 'Master Key is required.');
      return;
    }

    if (resetNewPassword.length < 8) {
      setResetError(
        language === 'ar'
          ? 'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل'
          : 'New password must be at least 8 characters long.'
      );
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError(
        language === 'ar'
          ? 'كلمتا المرور غير متطابقتين'
          : 'Passwords do not match. Please re-enter.'
      );
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          setupKey: resetSetupKey.trim(),
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess(
        language === 'ar'
          ? 'تم تعيين كلمة المرور الجديدة بنجاح! يمكنك الآن تسجيل الدخول بها.'
          : 'Password has been securely reset! You can now log in.'
      );
      setPassword(resetNewPassword);
      setEmail(resetEmail);
      setTimeout(() => {
        setResetModalOpen(false);
        setResetSuccess(null);
        setLoginMode('credentials');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151419] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#922CB5]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back to store */}
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'ar' ? 'العودة إلى الكتالوج' : 'Back to Store Catalogue'}</span>
        </button>

        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-black text-white uppercase tracking-tight">
            {language === 'ar' ? 'لوحة إدارة المتجر' : 'Store Admin Portal'}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {language === 'ar'
              ? 'الوصول محمي ومقتصر على فريق الإدارة المصرح له'
              : 'Authorized team access only'}
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-8 bg-[#242129] border border-white/10 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 flex items-start gap-3 text-red-200 text-xs">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-[#151419] border border-white/5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMode('master');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                loginMode === 'master'
                  ? 'bg-gradient-to-r from-[#922CB5] to-[#731f90] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-[#B7F34B]" />
              <span>{language === 'ar' ? 'دخول مباشر بالمفتاح' : 'Master Key Only'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                loginMode === 'credentials'
                  ? 'bg-[#242129] text-white border border-white/10 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === 'ar' ? 'البريد وكلمة المرور' : 'Email & Password'}</span>
            </button>
          </div>

          {/* Direct Master Key Form */}
          {loginMode === 'master' && (
            <form onSubmit={handleDirectMasterLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  {language === 'ar' ? 'مفتاح الإدارة المعتمد' : 'Master Key'}
                </label>
                <div className="relative">
                  <input
                    type={showMasterKey ? 'text' : 'password'}
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="••••••••••••"
                    autoFocus
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-3 pl-4 pr-11 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B] tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterKey(!showMasterKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showMasterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#922CB5] to-[#731f90] hover:from-[#a030c7] hover:to-[#8224a1] text-white font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(146,44,181,0.4)] hover:scale-101 active:scale-99 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#B7F34B]" />
                <span>
                  {loading
                    ? language === 'ar'
                      ? 'جاري التحقق...'
                      : 'Authenticating...'
                    : language === 'ar'
                    ? 'دخول لوحة التحكم'
                    : 'Authorize & Enter'}
                </span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setResetMasterModalOpen(true);
                    setResetMasterError(null);
                    setResetMasterSuccess(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-[#B7F34B] transition-colors underline cursor-pointer"
                >
                  {language === 'ar' ? 'إعادة تعيين مفتاح الإدارة؟' : 'Reset Master Key?'}
                </button>
              </div>
            </form>
          )}

          {/* Email & Password Form */}
          {loginMode === 'credentials' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Admin Email'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nasirmobile.com"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalOpen(true);
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="text-[11px] text-[#B7F34B] hover:underline font-semibold cursor-pointer"
                  >
                    {language === 'ar' ? 'إعادة تعيين؟' : 'Reset?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(146,44,181,0.4)] disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? language === 'ar'
                    ? 'جاري التحقق...'
                    : 'Authenticating...'
                  : language === 'ar'
                  ? 'تسجيل الدخول'
                  : 'Sign In'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-[11px] text-zinc-500">
              {language === 'ar'
                ? 'التسجيل العام مغلق تماماً لحماية سرية بيانات المتجر.'
                : 'Restricted administrative access.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECURE PASSWORD RESET MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#242129] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setResetModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              {language === 'ar'
                ? 'أدخل مفتاح الإدارة للتحقق وتعيين كلمة مرور جديدة.'
                : 'Enter your Master Key to authorize and set a new password.'}
            </p>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@nasirmobile.com"
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'مفتاح الإدارة المعتمد' : 'Master Key'}
                </label>
                <input
                  type="password"
                  value={resetSetupKey}
                  onChange={(e) => setResetSetupKey(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-bold text-xs uppercase transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading
                    ? language === 'ar'
                      ? 'جاري التحديث...'
                      : 'Updating...'
                    : language === 'ar'
                    ? 'تأكيد التغيير'
                    : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURE MASTER KEY RESET MODAL */}
      {resetMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#242129] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setResetMasterModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B7F34B] animate-pulse" />
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {language === 'ar' ? 'إعادة تعيين مفتاح الإدارة' : 'Reset Master Key'}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              {language === 'ar'
                ? 'يرجى تأكيد هويتك كمالك للمتجر باستخدام بريدك الإلكتروني وكلمة المرور لإعادة تعيين مفتاح الإدارة.'
                : 'Authorize using your verified store Owner Email & Password to reset or change the Master Key.'}
            </p>

            {resetMasterError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs">
                {resetMasterError}
              </div>
            )}

            {resetMasterSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetMasterSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetMasterKeySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني للمالك' : 'Owner Email Address'}
                </label>
                <input
                  type="email"
                  value={resetMasterOwnerEmail}
                  onChange={(e) => setResetMasterOwnerEmail(e.target.value)}
                  placeholder="shazzzbusiness@gmail.com"
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'كلمة مرور حساب المالك' : 'Owner Account Password'}
                </label>
                <input
                  type="password"
                  value={resetMasterOwnerPassword}
                  onChange={(e) => setResetMasterOwnerPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#151419] border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetMasterToDefault}
                    onChange={(e) => setResetMasterToDefault(e.target.checked)}
                    className="w-4 h-4 accent-[#922CB5] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {language === 'ar' ? 'إعادة التعيين إلى المفتاح الافتراضي' : 'Reset to Factory Default Key'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {language === 'ar' ? 'يستعيد المفتاح الأصلي المعتمد للنظام' : 'Restores system default master key'}
                    </span>
                  </div>
                </label>
              </div>

              {!resetMasterToDefault && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      {language === 'ar' ? 'مفتاح الإدارة الجديد (6 أحرف كحد أدنى)' : 'New Master Key (Min 6 Characters)'}
                    </label>
                    <input
                      type="password"
                      value={resetMasterNewKey}
                      onChange={(e) => setResetMasterNewKey(e.target.value)}
                      placeholder="••••••••••••"
                      required={!resetMasterToDefault}
                      minLength={6}
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      {language === 'ar' ? 'تأكيد المفتاح الجديد' : 'Confirm New Master Key'}
                    </label>
                    <input
                      type="password"
                      value={resetMasterConfirmKey}
                      onChange={(e) => setResetMasterConfirmKey(e.target.value)}
                      placeholder="••••••••••••"
                      required={!resetMasterToDefault}
                      minLength={6}
                      className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B]"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setResetMasterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={resetMasterLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#922CB5] to-[#731f90] hover:from-[#a030c7] hover:to-[#8224a1] text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {resetMasterLoading
                    ? language === 'ar'
                      ? 'جاري التعيين...'
                      : 'Resetting...'
                    : language === 'ar'
                    ? 'تأكيد إعادة التعيين'
                    : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
