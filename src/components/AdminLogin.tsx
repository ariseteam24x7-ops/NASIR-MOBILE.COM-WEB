import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Lock, Mail, ArrowLeft, ShieldAlert, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (token: string, user: { email: string; role: string }) => void;
  onBackToStore: () => void;
}

type Mode = 'login' | 'forgot' | 'reset';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToStore }) => {
  const { language } = useLanguage();
  const resetToken = new URLSearchParams(window.location.search).get('token') || '';
  const [mode, setMode] = useState<Mode>(resetToken ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isArabic = language === 'ar';

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('nm_admin_token', data.token);
      localStorage.setItem('nm_admin_user', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not request a reset link.');
      setNotice(data.message || 'If that admin account exists, a reset link has been sent.');
    } catch (err: any) {
      setError(err.message || 'Email service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('The reset link is missing or invalid.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed.');
      setNotice('Password updated successfully. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
      window.history.replaceState(null, '', '/admin');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'forgot'
    ? (isArabic ? 'استعادة كلمة المرور' : 'Forgot Password')
    : mode === 'reset'
      ? (isArabic ? 'تعيين كلمة مرور جديدة' : 'Reset Password')
      : (isArabic ? 'لوحة إدارة المتجر' : 'Store Admin Portal');

  return (
    <div className="min-h-screen bg-[#151419] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#922CB5]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <button
          onClick={mode === 'login' ? onBackToStore : () => {
            setMode('login');
            setError(null);
            setNotice(null);
            window.history.replaceState(null, '', '/admin');
          }}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{mode === 'login'
            ? (isArabic ? 'العودة إلى الكتالوج' : 'Back to Store Catalogue')
            : (isArabic ? 'العودة لتسجيل الدخول' : 'Back to Sign In')}</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-black text-white uppercase tracking-tight">{title}</h2>
          <p className="mt-1 text-xs text-zinc-400">
            {mode === 'login'
              ? (isArabic ? 'الوصول مقتصر على فريق الإدارة المصرح له' : 'Authorized team access only')
              : mode === 'forgot'
                ? 'Enter your admin email to receive a secure reset link.'
                : 'Choose a new password. The reset link can only be used once.'}
          </p>
        </div>

        <div className="mt-8 bg-[#242129] border border-white/10 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 flex items-start gap-3 text-red-200 text-xs">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}
          {notice && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed">
              {notice}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Admin Email</label>
                <div className="relative">
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@nasirmobile.com"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]" />
                  <Mail className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input required type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••••••"
                    className="w-full bg-[#151419] border border-white/10 rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button type="button" onClick={() => { setMode('forgot'); setError(null); setNotice(null); }}
                  className="text-xs text-purple-300 hover:text-white underline">
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50">
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Admin Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="shazzzbusiness@gmail.com"
                className="w-full bg-[#151419] border border-white/10 rounded-xl py-3 px-3.5 text-sm text-white focus:outline-none focus:border-[#922CB5]" />
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-bold text-xs uppercase disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">New Password</label>
                <input required minLength={12} maxLength={72} type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-3 px-3.5 text-sm text-white focus:outline-none focus:border-[#922CB5]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input required minLength={12} maxLength={72} type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-3 px-3.5 text-sm text-white focus:outline-none focus:border-[#922CB5]" />
              </div>
              <p className="text-[11px] text-zinc-400">Use 12–72 bytes. Choose a unique password.</p>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-[#922CB5] hover:bg-[#8023a0] text-white font-bold text-xs uppercase disabled:opacity-50">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-[11px] text-zinc-500">Restricted administrative access.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
