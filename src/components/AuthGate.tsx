import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Logo } from './Logo.tsx';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AuthGateProps {
  onOpenSupabaseModal: () => void;
  onNavigateToAdmin: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onOpenSupabaseModal,
  onNavigateToAdmin,
}) => {
  const { language } = useLanguage();
  const {
    signIn,
    signUp,
    resetPassword,
    signInDemoUser,
    isConfigured,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Secret admin click counter on logo
  const [secretClickCount, setSecretClickCount] = useState(0);

  const handleLogoClick = () => {
    const next = secretClickCount + 1;
    setSecretClickCount(next);
    if (next >= 3) {
      setSecretClickCount(0);
      onNavigateToAdmin();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          setErrorMsg('Please enter both email and password.');
          setLoading(false);
          return;
        }

        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid credentials. Please verify your email and password.');
        }
      } else if (mode === 'signup') {
        if (!email.trim() || !password) {
          setErrorMsg('Please fill in all required fields.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('Password should be at least 6 characters.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setLoading(false);
          return;
        }

        const res = await signUp(email, password, {
          fullName: fullName.trim() || email.split('@')[0],
          phone: phone.trim(),
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        } else if (res.message) {
          setSuccessMsg(res.message);
          if (res.message.includes('confirm your account')) {
            // keep message visible
          }
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('Please enter your account email.');
          setLoading(false);
          return;
        }

        const res = await resetPassword(email);
        if (res.success) {
          setSuccessMsg(res.message || 'Password reset link sent to your email.');
        } else {
          setErrorMsg(res.error || 'Failed to send reset link.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151419] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#922CB5]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#B7F34B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Supabase Status & Details button */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 z-10">
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#242129] border border-white/10 hover:border-[#B7F34B]/50 transition-all text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer shadow-sm group"
          title="Supabase Backend Details & Configuration"
        >
          <Database className="w-3.5 h-3.5 text-[#B7F34B] group-hover:scale-110 transition-transform" />
          <span>Supabase Backend:</span>
          {isConfigured ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Setup Details
            </span>
          )}
        </button>

        {/* Quick Demo Preview trigger for evaluation */}
        <button
          onClick={signInDemoUser}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Bypass login instantly for demonstration"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B7F34B]" />
          <span>Guest Preview</span>
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#1d1b22] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            onClick={handleLogoClick}
            className="inline-block cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Nasir Mobile Dubai"
          >
            <Logo size="lg" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#B7F34B]" />
            <span className="text-[10px] uppercase font-black tracking-widest text-[#B7F34B]">
              Member Portal Access
            </span>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#B7F34B]" />
          </div>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            {mode === 'signin' && 'Sign in to access real-time device prices, stock levels & WhatsApp booking.'}
            {mode === 'signup' && 'Create your VIP membership account to browse Dubai’s flagship inventory.'}
            {mode === 'forgot' && 'Enter your email to receive a secure password recovery link.'}
          </p>
        </div>

        {/* Auth Mode Tabs (Sign In vs Sign Up) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-[#151419] rounded-2xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-[#922CB5] to-[#792296] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#922CB5] to-[#792296] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign Up extra fields: Name & Phone */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#B7F34B]" />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Al Nuaimi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B] text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#B7F34B]" />
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#151419] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B] text-sm transition-all"
                />
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#B7F34B]" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#151419] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B] text-sm transition-all"
            />
          </div>

          {/* Password (for signin & signup) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#B7F34B]" />
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-[#B7F34B] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B] text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (for signup) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B7F34B]" />
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#151419] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B] text-sm transition-all"
              />
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#B7F34B] to-[#9ad638] text-black font-black text-xs uppercase tracking-wider transition-all hover:brightness-105 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(183,243,75,0.3)]"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In to Showroom</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Create Account & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Send Password Reset Link</span>
                <Mail className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to sign in if in forgot mode */}
        {mode === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              &larr; Back to Sign In
            </button>
          </div>
        )}

        {/* Bottom helper info */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-[11px] text-zinc-400">
            Backed by <strong className="text-zinc-300">Supabase Authentication</strong>. Protected with SSL encryption & Row Level Security.
          </p>
        </div>
      </div>

      {/* Discrete Owner Entrance hint */}
      <div className="mt-6 text-center text-xs text-zinc-400 z-10 flex items-center gap-3">
        <span>Store Owner?</span>
        <button
          onClick={onNavigateToAdmin}
          className="text-zinc-400 hover:text-zinc-200 underline text-xs transition-colors"
        >
          Staff / Management Login
        </button>
      </div>
    </div>
  );
};
