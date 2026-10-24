import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicVisitorStats } from '../types/index.ts';
import { Users, Eye, Activity, Globe2, ShieldCheck } from 'lucide-react';

export const VisitorCounter: React.FC = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<PublicVisitorStats>({
    isEnabled: true,
    displayMode: 'both',
    todayVisitors: 0,
    totalVisitors: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Generate or retrieve persistent first-party anonymous visitor ID
    let visitorId = '';
    try {
      visitorId = localStorage.getItem('nm_visitor_id') || '';
      if (!visitorId) {
        visitorId = 'nm_vis_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        localStorage.setItem('nm_visitor_id', visitorId);
      }
    } catch {
      visitorId = 'anon_' + Math.random().toString(36).substring(2, 10);
    }

    // Register visit (deduplicated server-side for today)
    const trackVisit = async () => {
      try {
        const res = await fetch('/api/visitors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            path: typeof window !== 'undefined' ? window.location.pathname : '/',
          }),
        });
        if (res.ok) {
          const data: PublicVisitorStats = await res.json();
          setStats(data);
        }
      } catch (err) {
        // Safe fallback in offline mode
      } finally {
        setLoaded(true);
      }
    };

    trackVisit();
  }, []);

  if (!loaded || !stats.isEnabled) {
    return null;
  }

  const showToday = stats.displayMode === 'both' || stats.displayMode === 'today';
  const showTotal = stats.displayMode === 'both' || stats.displayMode === 'total';

  if (!showToday && !showTotal) {
    return null;
  }

  return (
    <section className="py-8 bg-[#111015] border-y border-white/5 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-32 bg-[#922CB5]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 sm:p-6 rounded-3xl bg-[#1b1920]/80 border border-white/10 backdrop-blur-md shadow-xl">
          {/* Left: Branding & Real-time Indicator */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#242129] border border-white/10 text-[#B7F34B] shadow-inner shrink-0">
              <Activity className="w-5 h-5 text-[#B7F34B]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B7F34B] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B7F34B]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {language === 'ar' ? 'تواجد المتجر المباشر' : 'Live Store Presence'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#B7F34B]/10 text-[#B7F34B] border border-[#B7F34B]/20">
                  {language === 'ar' ? 'مباشر' : 'Live'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'ar'
                  ? 'إحصائيات الزوار المعتمدة لمتجر ناصر موبايل دبي'
                  : 'Verified unique visitors across UAE & GCC'}
              </p>
            </div>
          </div>

          {/* Right: Counter Stats Cards */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
            {showToday && (
              <div className="flex-1 sm:flex-initial min-w-[140px] px-5 py-3 rounded-2xl bg-[#151419] border border-white/10 flex items-center gap-3.5 shadow-lg group hover:border-[#B7F34B]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#242129] flex items-center justify-center text-[#B7F34B] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-none">
                    {stats.todayVisitors.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    {language === 'ar' ? 'زوار اليوم' : "Today's Visitors"}
                  </div>
                </div>
              </div>
            )}

            {showTotal && (
              <div className="flex-1 sm:flex-initial min-w-[140px] px-5 py-3 rounded-2xl bg-[#151419] border border-white/10 flex items-center gap-3.5 shadow-lg group hover:border-[#922CB5]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#242129] flex items-center justify-center text-[#922CB5] shrink-0">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-none">
                    {stats.totalVisitors.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    {language === 'ar' ? 'إجمالي الزوار' : 'Total Visitors'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
