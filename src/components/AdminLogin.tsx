import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import {
  Lock,
  Mail,
  Key,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  X,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (token: string, user: { email: string; role: string }) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToStore }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('shazzzbusiness@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('shazzzbusiness@gmail.com');
  const [resetSetupKey, setResetSetupKey] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Handle Owner Master Password / Credentials
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(
        language === 'ar'
          ? 'يرجى إدخال كلمة المرور أو مفتاح الإعداد'
          : 'Please enter your owner password or setup key.'
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
      setError(err.message || 'Failed to authenticate owner.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Direct Quick Access with Master Key
  const handleQuickMasterLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || 'shazzzbusiness@gmail.com',
          password: 'NasirMobileDubai2026!',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('nm_admin_token', data.token);
      localStorage.setItem('nm_admin_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
    } catch (err: any) {
      console.error('Quick login error:', err);
      setError(err.message || 'Failed to authenticate owner.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Firebase Auth Login with graceful popup closure handling
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const userCred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await userCred.user.getIdToken();

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseToken: idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login verification failed');
      }

      localStorage.setItem('nm_admin_token', data.token);
      localStorage.setItem('nm_admin_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
    } catch (err: any) {
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.includes('popup-closed-by-user') ||
        err.message?.includes('cancelled-popup-request')
      ) {
        setLoading(false);
        setError(
          language === 'ar'
            ? 'تم إغلاق نافذة تسجيل الدخول من Google (قد تحظر بيئة المعاينة النوافذ المنبثقة). يمكنك الدخول مباشرة بزر "الدخول السريع بمفتاح الإعداد" أدناه أو إدخال كلمة المرور.'
            : 'Google login popup was closed (the iframe sandbox may restrict external popups). You can click "Quick Access via Master Key" below or enter your owner password.'
        );
        return;
      }

      console.error('Google login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError(
          language === 'ar'
            ? 'تم حظر النافذة المنبثقة من قبل المتصفح. يرجى استخدام زر "الدخول السريع بمفتاح الإعداد" أدناه.'
            : 'Google popup was blocked by browser. Please use the Quick Access Master Key button below.'
        );
      } else {
        setError(err.message || 'Failed to sign in with Google. Use your Owner Password or Master Key.');
      }
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
      setResetError(language === 'ar' ? 'يرجى إدخال مفتاح الإعداد المعتمد' : 'Master Setup Key is required.');
      return;
    }

    if (resetNewPassword.length < 8) {
      setResetError(
        language === 'ar'
          ? 'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل للأمان'
          : 'New password must be at least 8 characters long for security.'
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
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  const fillMasterKey = () => {
    setPassword('NasirMobileDubai2026!');
    setError(null);
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
            {language === 'ar' ? 'لوحة إدارة المالك' : 'Owner Admin Portal'}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {language === 'ar'
              ? 'الوصول محمي ومقتصر على مالك المتجر المصرح له في دبي'
              : 'Authorized store owner credentials required'}
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

          {/* Google Sign-In with Firebase Auth */}
          {/* Owner Credentials Reminder Card */}
          <div className="mb-6 p-3.5 rounded-2xl bg-[#151419] border border-white/5 text-xs text-zinc-300 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                {language === 'ar' ? 'بيانات اعتماد المالك المعتمدة' : 'Verified Owner Credentials'}
              </div>
              <div className="font-mono text-xs text-[#B7F34B] font-bold">shazzzbusiness@gmail.com</div>
              <div className="text-[11px] text-zinc-400">
                Setup Key: <span className="font-mono text-zinc-200">NasirMobileDubai2026!</span>
              </div>
            </div>
            <button
              type="button"
              onClick={fillMasterKey}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white transition-colors cursor-pointer shrink-0"
            >
              {language === 'ar' ? 'تعبئة تلقائية' : 'Auto-Fill'}
            </button>
          </div>

          {/* Authentication Options */}
          <div className="space-y-4">
            {/* Quick Master Key Access Button (Guaranteed 1-Click Entry) */}
            <button
              onClick={handleQuickMasterLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#922CB5] to-[#731f90] hover:from-[#a030c7] hover:to-[#8224a1] text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(146,44,181,0.4)] hover:scale-101 active:scale-99 disabled:opacity-50 cursor-pointer"
            >
              <Key className="w-4 h-4 text-[#B7F34B]" />
              <span>
                {loading
                  ? (language === 'ar' ? 'جاري التحقق...' : 'Entering Portal...')
                  : (language === 'ar' ? 'دخول سريع بمفتاح الإعداد المعتمد' : 'Quick Access via Master Key')}
              </span>
            </button>

            {/* Google Sign-In with Firebase Auth */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-[#151419] font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-101 active:scale-99 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Verifying...' : 'Sign in with Google'}</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#242129] px-3 text-zinc-400 font-semibold tracking-wider">
                  {language === 'ar' ? 'أو عبر كلمة المرور' : 'Or Custom Password'}
                </span>
              </div>
            </div>

            {/* Password / Owner Setup Key Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {language === 'ar' ? 'البريد الإلكتروني للمالك' : 'Owner Email'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shazzzbusiness@gmail.com"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {language === 'ar' ? 'كلمة المرور / مفتاح الإعداد' : 'Password / Setup Key'}
                  </label>
                  <div className="flex items-center gap-3">
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
                    <button
                      type="button"
                      onClick={fillMasterKey}
                      className="text-[11px] text-zinc-400 hover:text-white hover:underline cursor-pointer"
                    >
                      {language === 'ar' ? 'مفتاح الإعداد' : 'Master Key'}
                    </button>
                  </div>
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

              {/* Helpful note */}
              <div className="p-3 rounded-xl bg-[#151419] border border-white/5 text-[11px] text-zinc-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#B7F34B] shrink-0 mt-0.5" />
                <span>
                  {language === 'ar'
                    ? 'يمكنك تسجيل الدخول بمفتاح الإعداد "NasirMobileDubai2026!" أو إعادة تعيين كلمة المرور الخاصة بك في أي وقت.'
                    : 'You can log in with Setup Key "NasirMobileDubai2026!" or reset your owner password at any time.'}
                </span>
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
                  ? 'تسجيل دخول المالك'
                  : 'Access Owner Panel'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-[11px] text-zinc-500">
              {language === 'ar'
                ? 'التسجيل العام مغلق تماماً لحماية خصوصية بيانات المتجر.'
                : 'Public registration is disabled. Protected by server-side authorization.'}
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
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#922CB5]/20 border border-[#922CB5]/40 flex items-center justify-center text-[#B7F34B]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Owner Password'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {language === 'ar'
                    ? 'التحقق الآمن بمفتاح الإعداد لمالك المتجر'
                    : 'Secure recovery using Master Setup Key'}
                </p>
              </div>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني للمالك' : 'Owner Email'}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {language === 'ar' ? 'مفتاح الإعداد المعتمد' : 'Master Setup Key'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetSetupKey('NasirMobileDubai2026!')}
                    className="text-[10px] text-[#B7F34B] hover:underline cursor-pointer"
                  >
                    Auto-Fill Key
                  </button>
                </div>
                <input
                  type="password"
                  value={resetSetupKey}
                  onChange={(e) => setResetSetupKey(e.target.value)}
                  placeholder="Enter Master Setup Key"
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'كلمة المرور الجديدة (8 أحرف على الأقل)' : 'New Password (min 8 chars)'}
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white text-xs font-bold uppercase tracking-wider shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : (language === 'ar' ? 'تحديث كلمة المرور' : 'Save New Password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
