import React from 'react';
import { Smartphone, Monitor, RefreshCw, Check } from 'lucide-react';
import { useViewMode } from '../context/ViewModeContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

interface DeviceModeToggleProps {
  variant?: 'navbar' | 'floating' | 'banner' | 'pill';
  showLabel?: boolean;
  className?: string;
}

export const DeviceModeToggle: React.FC<DeviceModeToggleProps> = ({
  variant = 'navbar',
  showLabel = true,
  className = '',
}) => {
  const { viewMode, toggleViewMode, hasUserPreference, detectedMode, resetToAuto } = useViewMode();
  const { theme } = useTheme();

  const isMobile = viewMode === 'mobile';

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 ${className}`}>
        <button
          type="button"
          onClick={() => isMobile || toggleViewMode()}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isMobile
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="عرض شاشات الجوال والهواتف الذكية"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>جوال</span>
        </button>

        <button
          type="button"
          onClick={() => !isMobile || toggleViewMode()}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            !isMobile
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="عرض شاشات الكمبيوتر وسطح المكتب"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>كمبيوتر</span>
        </button>
      </div>
    );
  }

  // Navbar compact button ("زرار صغير")
  return (
    <button
      type="button"
      onClick={toggleViewMode}
      className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 text-xs font-bold shadow-sm ${
        isMobile
          ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 hover:border-amber-500/60'
          : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60'
      } ${className}`}
      title={
        isMobile
          ? 'أنت الآن في وضع الجوال 📱 - اضغط للتبديل إلى وضع الكمبيوتر 💻'
          : 'أنت الآن في وضع الكمبيوتر 💻 - اضغط للتبديل إلى وضع الجوال 📱'
      }
      aria-label="تبديل وضع العرض بين الجوال والكمبيوتر"
    >
      {/* Icon */}
      {isMobile ? (
        <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : (
        <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      )}

      {/* Label */}
      {showLabel && (
        <span className="font-extrabold text-[11px] whitespace-nowrap">
          {isMobile ? 'جوال' : 'كمبيوتر'}
        </span>
      )}

      {/* Tiny Switch Tag (visible on medium+ screens to keep mobile navbar clean) */}
      <span className="hidden sm:flex text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 group-hover:text-white group-hover:bg-white/20 transition-colors whitespace-nowrap items-center gap-0.5">
        <span>تبديل</span>
        <span className="opacity-60 text-[8px]">⇄</span>
      </span>

      {/* Pulsing indicator if auto-detected and not overridden yet */}
      {!hasUserPreference && (
        <span
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
            isMobile ? 'bg-amber-400' : 'bg-cyan-400'
          } animate-ping`}
        />
      )}
    </button>
  );
};
