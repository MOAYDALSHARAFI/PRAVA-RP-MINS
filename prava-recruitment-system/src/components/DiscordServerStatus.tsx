import React, { useState, useEffect } from 'react';
import { Radio, Users, Shield, ExternalLink, MessageSquare, CheckCircle2 } from 'lucide-react';
import { ServerSettings } from '../types.ts';
import { apiUrl, safeFetchJson } from '../utils/api.ts';

interface DiscordServerStatusProps {
  serverSettings: ServerSettings;
}

interface DiscordLiveStats {
  success: boolean;
  isLive: boolean;
  memberCount: number;
  onlineCount: number;
  guildName: string;
  guildIcon: string | null;
  instantInvite: string;
}

export const DiscordServerStatus: React.FC<DiscordServerStatusProps> = ({ serverSettings }) => {
  const [stats, setStats] = useState<DiscordLiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveDiscordStats = async () => {
      try {
        const res = await safeFetchJson<DiscordLiveStats>('/api/discord-stats');
        if (isMounted && res) {
          setStats(res);
        }
      } catch {
        // Fallback to static props
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLiveDiscordStats();
    // Refresh real counts every 60 seconds
    const interval = setInterval(fetchLiveDiscordStats, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const discordUrl = stats?.instantInvite || serverSettings.discordUrl || 'https://discord.gg/dkUjf2bpy';
  const serverName = stats?.guildName || serverSettings.discordName || serverSettings.serverName || 'سيرفر PRAVA';
  const onlineMembers = stats?.onlineCount ?? 0;
  const totalMembers = stats?.memberCount ?? 0;

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1017] via-[#0f141f] to-[#0a0d14] border border-amber-500/20 hover:border-amber-500/40 p-5 sm:p-6 shadow-xl transition-all duration-300 group">
        
        {/* Subtle Ambient Backlight */}
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Line */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#5865F2] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 tracking-wider">
                  ديسكورد المنظومة الرسمي
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ربط حقيقي مباشر</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {serverName} · الرابط المعتمد لاستقبال المقابلات وتفعيل الرتب العسكرية
              </p>
            </div>
          </div>

          {/* Discord CTA Button */}
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2] border border-[#5865F2]/40 hover:border-[#5865F2] text-[#9ba5ff] hover:text-white text-xs font-bold transition-all duration-300 shadow-md group/btn active:scale-95"
          >
            <svg className="w-4 h-4 fill-current transition-transform group-hover/btn:scale-110" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>انضمام لسيرفر PRAVA</span>
            <ExternalLink className="w-3.5 h-3.5 text-current opacity-70" />
          </a>
        </div>

        {/* Real Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Real Metric 1: Live Online Members */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                المتواجدين الآن
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {isLoading ? '...' : onlineMembers > 0 ? onlineMembers : 'متصل'}
              </span>
              {onlineMembers > 0 && <span className="text-[10px] text-slate-400">عضو متصل</span>}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              بيانات حية من خوادم ديسكورد
            </div>
          </div>

          {/* Real Metric 2: Total Guild Members */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                إجمالي الأعضاء
              </span>
              <span className="text-[9px] font-mono text-amber-400/80 font-bold">DISCORD</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                {isLoading ? '...' : totalMembers > 0 ? totalMembers : 'رسمي'}
              </span>
              {totalMembers > 0 && <span className="text-[10px] text-slate-400">عضو</span>}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              قاعدة مجتمع سيرفر PRAVA
            </div>
          </div>

          {/* Real Metric 3: Application Integration */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                تكامل الإشعارات
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm sm:text-base font-black text-cyan-300">
                ويب هوك وبوت
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              إشعار فوري عند إرسال أي طلب
            </div>
          </div>

          {/* Real Metric 4: Interview & Roles */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                رومات الرولات
              </span>
              <span className="text-[9px] font-mono text-purple-400 font-bold">مفعل</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm sm:text-base font-black text-white">
                إسناد الرتب آلياً
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              ربط الرتب العسكرية بالأرقام المعتمدة
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
