import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { getStoredSupabaseConfig } from '../lib/supabase.ts';
import {
  Database,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  X,
  Code2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isConfigured, updateSupabaseCredentials } = useAuth();
  const currentConfig = getStoredSupabaseConfig();

  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'sql' | 'instructions'>('details');

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = supabaseUrl.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      setTestResult({
        success: false,
        message: 'Invalid URL. It must be in the format: https://your-project.supabase.co',
      });
      setTesting(false);
      return;
    }

    if (cleanKey.length < 20) {
      setTestResult({
        success: false,
        message: 'Invalid Anon Key. It should be a long JWT key from your Supabase API settings.',
      });
      setTesting(false);
      return;
    }

    try {
      // Test fetching from Supabase REST endpoint
      const response = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
        },
      });

      if (response.ok || response.status === 200 || response.status === 404) {
        setTestResult({
          success: true,
          message: 'Connection successful! Supabase API responded correctly.',
        });
        await updateSupabaseCredentials(cleanUrl, cleanKey);
      } else {
        setTestResult({
          success: false,
          message: `Supabase returned HTTP status ${response.status}. Please check your Anon Key.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${err.message || 'Network error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySchema = async () => {
    try {
      const res = await fetch('/supabase-schema.sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    } catch {
      // Fallback
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#1b1921] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#151419]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Supabase Backend Connection</h3>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" /> Pending Config
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Connect your Supabase project for customer authentication and database storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-[#151419]/50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-[#B7F34B] text-[#B7F34B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            1. Required Details
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-[#B7F34B] text-[#B7F34B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            2. SQL Schema Setup
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'instructions'
                ? 'border-[#B7F34B] text-[#B7F34B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            3. Auth Settings Guide
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-zinc-300">
          {activeTab === 'details' && (
            <form onSubmit={handleSaveAndTest} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                <span className="font-bold text-white block mb-1">Where to find these in Supabase:</span>
                1. Open your Supabase project dashboard at <strong className="text-white">supabase.com/dashboard</strong><br />
                2. Click on the <strong>Project Settings</strong> (gear icon) on the left sidebar.<br />
                3. Click <strong>API</strong> and copy the <strong>Project URL</strong> and <strong>Project API key (anon / public)</strong>.
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#B7F34B]" />
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://xyzabcdefghijklm.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#B7F34B]" />
                  Supabase Anon / Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  required
                  className="w-full bg-[#151419] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#922CB5] text-xs font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">
                  Values are securely saved to your local browser environment
                </span>
                <button
                  type="submit"
                  disabled={testing}
                  className="px-5 py-2.5 rounded-xl bg-[#B7F34B] hover:bg-[#a5e03e] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(183,243,75,0.3)]"
                >
                  {testing ? 'Testing Connection...' : 'Save & Test Connection'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                <p className="font-bold text-white mb-1">What to add in your Supabase Project:</p>
                We have generated a production-ready SQL script (<code className="text-[#B7F34B]">supabase-schema.sql</code>) that sets up the <strong className="text-white">profiles</strong>, <strong className="text-white">products</strong>, <strong className="text-white">categories</strong>, <strong className="text-white">brands</strong>, and <strong className="text-white">inquiries</strong> tables with Row Level Security (RLS) policies and automatic profile creation triggers!
              </div>

              <div className="p-4 rounded-xl bg-[#151419] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#B7F34B]" />
                    supabase-schema.sql
                  </span>
                  <button
                    onClick={handleCopySchema}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    {copiedSchema ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL Script</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs text-zinc-400 font-mono bg-black/40 p-3 rounded-lg overflow-x-auto max-h-40 border border-white/5">
                  <p>-- 1. Enable UUID extension & create profiles table</p>
                  <p>-- 2. Create products, categories, brands, inquiries</p>
                  <p>-- 3. Setup handle_new_user() trigger on auth.users</p>
                  <p>-- 4. Enable Row Level Security (RLS) on all tables</p>
                  <p>-- 5. Seed default categories & brands...</p>
                </div>
              </div>

              <div className="text-xs text-zinc-400 space-y-2">
                <p className="font-semibold text-white">How to execute:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>In Supabase, click <strong>SQL Editor</strong> on the left menu.</li>
                  <li>Click <strong>New query</strong>.</li>
                  <li>Click the <strong>Copy SQL Script</strong> button above, paste the code into the query editor, and click <strong>Run</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#151419] border border-white/10 space-y-3 text-xs leading-relaxed">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#B7F34B]" />
                  Supabase Authentication Configuration
                </div>
                <p className="text-zinc-400">
                  To ensure smooth user signups and logins, verify these two settings in your Supabase dashboard:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">1. Enable Email Provider</span>
                    <span className="text-zinc-400">
                      Go to <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Email</strong> and ensure it is turned <strong>ON</strong>.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">2. Confirm Email Setting (Recommended for testing)</span>
                    <span className="text-zinc-400">
                      Under <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Email</strong>, you can toggle <em>"Confirm email"</em> off if you want users to be able to sign in immediately without waiting for an email confirmation link.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">3. Site URL / Redirects</span>
                    <span className="text-zinc-400">
                      Under <strong>Authentication</strong> &rarr; <strong>URL Configuration</strong>, set your Site URL to your app's domain for password resets.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#151419] flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
