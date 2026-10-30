import React from 'react';
import { Smartphone, Monitor, X, ArrowLeftRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useViewMode } from '../context/ViewModeContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

export const DeviceDetectionBanner: React.FC = () => {
  const { 
    viewMode, 
    detectedMode, 
    toggleViewMode, 
    showDetectionToast, 
    dismissDetectionToast, 
    hasUserPreference 
  } = useViewMode();
  const { theme } = useTheme();

  if (!showDetectionToast) return null;

  const isMobile = viewMode === 'mobile';

  return (
    <div className="fixed top-20 sm:top-24 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="relative bg-[#0d121c]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl text-right overflow-hidden ring-1 ring-white/10">
        
        {/* Glow ambient background */}
        <div 
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: isMobile ? '#f59e0b' : '#06b6d4' }}
        />

        {/* Close Button */}
        <button
          onClick={dismissDetectionToast}
          className="absolute top-3 left-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="إغلاق الإشعار"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pl-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isMobile 
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
              : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
          }`}>
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                تعرف ذكي تلقائي
              </span>
              <span className="text-xs font-black text-white">
                {isMobile ? 'تم التعرف على جهازك كـ (جوال)' : 'تم التعرف على جهازك كـ (كمبيوتر)'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              {isMobile
                ? 'تم تفعيل العرض السريع المخصص لشاشات الهواتف الذكية لتصفح مريح والتقديم بسهولة.'
                : 'تم تفعيل العرض الشامل المخصص لأجهزة الكمبيوتر وسطح المكتب مع لوحات التحكم العريضة.'}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toggleViewMode();
                  dismissDetectionToast();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                <span>التبديل إلى {isMobile ? 'الكمبيوتر 💻' : 'الجوال 📱'}</span>
              </button>

              <button
                onClick={dismissDetectionToast}
                className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                حسناً، متابعة
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
