import React, { useState } from 'react';
import { Smartphone, Monitor, ChevronUp, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useViewMode } from '../context/ViewModeContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

export const FloatingDeviceSwitcher: React.FC = () => {
  const { viewMode, toggleViewMode, detectedMode, hasUserPreference, isSimulatedMobileOnDesktop } = useViewMode();
  const { theme } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  const isMobile = viewMode === 'mobile';

  return (
    <aside 
      aria-label="أداة تبديل وضع العرض"
      className="hidden sm:block fixed bottom-6 left-4 z-40 select-none animate-in fade-in"
    >
      <div className="relative group">
        <button
          type="button"
          onClick={toggleViewMode}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all cursor-pointer active:scale-95 duration-200 ${
            isMobile
              ? 'bg-[#101522]/90 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-[#151c2e]'
              : 'bg-[#0f172a]/90 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:bg-[#131f38]'
          }`}
          title="اضغط للتبديل بين وضع الجوال ووضع الكمبيوتر"
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
            isMobile 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
              : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
          }`}>
            {isMobile ? (
              <Smartphone className="w-4 h-4 animate-pulse" />
            ) : (
              <Monitor className="w-4 h-4" />
            )}
          </div>

          <div className="flex flex-col text-right leading-none">
            <span className="text-[10px] text-slate-400 font-medium">وضع العرض</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-black text-white">
                {isMobile ? 'الجوال 📱' : 'الكمبيوتر 💻'}
              </span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-slate-300 font-normal">
                تبديل
              </span>
            </div>
          </div>
        </button>

        {/* Hover / Hint Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 w-52 p-2.5 rounded-xl bg-[#090d14]/95 border border-white/15 text-right shadow-2xl text-[11px] text-slate-300 backdrop-blur-md pointer-events-none">
            <div className="flex items-center justify-between text-white font-bold mb-1">
              <span>{isMobile ? 'وضع الهواتف الذكية' : 'وضع سطح المكتب'}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {!hasUserPreference ? 'تلقائي' : 'مخصص'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isMobile
                ? 'اضغط للتحويل إلى وضع الكمبيوتر وعرض الشاشات العريضة.'
                : 'اضغط للتحويل إلى وضع الجوال المخصص للهواتف المحمولة.'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
