import React, { useState, useRef } from 'react';
import { 
  Lock, ArrowLeft, Shield, Eye, Compass, Fingerprint, Award, 
  MessageSquare, Sparkles, ChevronLeft, RefreshCw, ArrowDown, 
  CheckCircle2, Smartphone
} from 'lucide-react';
import { Sector } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { SmartBadge } from './SmartBadge.tsx';

interface SectorsGridProps {
  sectors: Sector[];
  onSelectSector: (sector: Sector) => void;
  onContactLeadership: () => void;
  onRefresh?: () => Promise<void> | void;
}

export const SectorsGrid: React.FC<SectorsGridProps> = ({
  sectors,
  onSelectSector,
  onContactLeadership,
  onRefresh,
}) => {
  const { theme, designStyle } = useTheme();
  const [filter, setFilter] = useState<'all' | 'open'>('all');

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  const PULL_THRESHOLD = 70; // px required to trigger refresh
  const MAX_PULL = 110; // maximum visual pull extension

  // Touch handlers for mobile Pull-to-Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 8) return;

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    hasTriggeredHapticRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || startYRef.current === 0) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 8 && !isPulling) return;

    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    if (diff > 0 && scrollTop <= 5) {
      // Damped natural spring curve
      const distance = Math.min(MAX_PULL, Math.pow(diff, 0.82) * 1.6);
      setPullY(distance);
      setIsPulling(true);

      // Light haptic feedback once threshold is crossed
      if (distance >= PULL_THRESHOLD && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(14); } catch {}
        }
      } else if (distance < PULL_THRESHOLD) {
        hasTriggeredHapticRef.current = false;
      }
    } else if (isPulling) {
      setPullY(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) return;
    const finalPull = pullY;
    startYRef.current = 0;
    currentYRef.current = 0;

    if (finalPull >= PULL_THRESHOLD && onRefresh) {
      setIsPulling(false);
      setIsRefreshing(true);
      setPullY(60);

      try {
        await onRefresh();
        setRefreshSuccess(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([15, 30, 15]); } catch {}
        }
        await new Promise((r) => setTimeout(r, 650));
      } catch (err) {
        console.error('Failed pull-to-refresh', err);
      } finally {
        setIsRefreshing(false);
        setRefreshSuccess(false);
        setPullY(0);
      }
    } else {
      setIsPulling(false);
      setPullY(0);
    }
  };

  const handleTouchCancel = () => {
    startYRef.current = 0;
    currentYRef.current = 0;
    setIsPulling(false);
    if (!isRefreshing) setPullY(0);
  };

  // Manual Refresh Handler (for button click on mobile/desktop)
  const handleManualRefresh = async () => {
    if (isRefreshing || !onRefresh) return;
    setIsRefreshing(true);
    setPullY(60);
    try {
      await onRefresh();
      setRefreshSuccess(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([15, 30, 15]); } catch {}
      }
      await new Promise((r) => setTimeout(r, 650));
    } catch (err) {
      console.error('Manual refresh failed', err);
    } finally {
      setIsRefreshing(false);
      setRefreshSuccess(false);
      setPullY(0);
    }
  };

  const filteredSectors = filter === 'open' 
    ? sectors.filter((s) => s.isOpen) 
    : sectors;

  // Icon mapping helper
  const getSectorIcon = (id: string) => {
    switch (id) {
      case 'swat':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'public_security':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'cid':
        return <Fingerprint className="w-5 h-5 text-emerald-400" />;
      case 'gs':
        return <Eye className="w-5 h-5 text-purple-400" />;
      case 'border_guard':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      default:
        return <Shield className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <section 
      id="sectors-section" 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative transition-transform duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Pull-To-Refresh Visual HUD Indicator */}
      <div 
        className="overflow-hidden transition-all duration-200 flex items-center justify-center pointer-events-none select-none -mt-2 mb-3"
        style={{
          height: isRefreshing ? 60 : pullY > 0 ? Math.min(80, pullY) : 0,
          opacity: isRefreshing || pullY > 10 ? Math.min(1, pullY / 25) : 0,
        }}
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0e121a]/95 border border-amber-500/30 backdrop-blur-xl shadow-2xl shadow-black/80 text-xs">
          {refreshSuccess ? (
            <>
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4 animate-in zoom-in" />
              </div>
              <span className="font-bold text-emerald-300">تم تحديث بيانات القطاعات بنجاح!</span>
            </>
          ) : isRefreshing ? (
            <>
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              </div>
              <div className="text-right">
                <span className="font-black text-white block">جاري تحديث بيانات القطاعات...</span>
                <span className="text-[10px] text-amber-400/80 font-mono">PRAVA SECTORS SYNC</span>
              </div>
            </>
          ) : (
            <>
              {/* Radial Progress Ring */}
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={pullY >= PULL_THRESHOLD ? 'text-emerald-400' : 'text-amber-400'}
                    strokeDasharray={`${Math.min(100, Math.round((pullY / PULL_THRESHOLD) * 100))}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <ArrowDown 
                  className={`w-3.5 h-3.5 absolute transition-transform duration-200 ${
                    pullY >= PULL_THRESHOLD ? 'rotate-180 text-emerald-400' : 'text-amber-400'
                  }`} 
                />
              </div>

              <div className="text-right">
                <span className={`font-bold block ${pullY >= PULL_THRESHOLD ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {pullY >= PULL_THRESHOLD ? 'أفلت للتحديث الفوري للقطاعات' : 'اسحب للأسفل للتحديث...'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {Math.min(100, Math.round((pullY / PULL_THRESHOLD) * 100))}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid Content with Spring Translation */}
      <div 
        style={{
          transform: pullY > 0 ? `translateY(${pullY * 0.35}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Section Header with Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-slate-400">
                قائمة القطاعات والتشكيلات
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              اختر قطاعك وانطلق في مسارك
            </h2>

            {/* Mobile Touch Refresh Hint */}
            <div className="flex sm:hidden items-center gap-1.5 text-[10px] text-amber-400/80 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 w-fit mt-2">
              <Smartphone className="w-3 h-3 text-amber-400" />
              <span>اسحب الشاشة للأسفل للتحديث الفوري</span>
            </div>
          </div>

          {/* Filter Segmented Control & Manual Refresh Button */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                جميع القطاعات <span className="text-[10px] opacity-75 font-mono">({sectors.length})</span>
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === 'open'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                المتاحة للتقديم <span className="text-[10px] opacity-75 font-mono">({sectors.filter(s => s.isOpen).length})</span>
              </button>
            </div>

            {/* Manual Refresh Button */}
            {onRefresh && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="تحديث قائمة القطاعات"
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isRefreshing
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-300'}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
            )}
          </div>
        </div>

      {/* Grid of Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Banner Card - "P. خطوتك القادمة تصنع الفرق" */}
        <div className={`p-7 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${
          designStyle === 'apex'
            ? 'apex-chamfer-card border-amber-500/40 hover:border-amber-400 shadow-xl shadow-amber-500/5'
            : `bg-gradient-to-br from-[#121622] via-[#0c0f16] to-[#080a0e] border border-amber-500/25 hover:border-amber-500/50 rounded-2xl hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/10 ${designStyle === 'modern' ? 'hud-corner-card' : ''}`
        }`}>
          {/* Subtle Golden Spotlight on Hover */}
          <div 
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
            style={{ backgroundColor: theme.accentColor }}
          />

          {/* Tactical Crosshair Notch in Corner - Modern & Apex */}
          {(designStyle === 'modern' || designStyle === 'apex') && (
            <div className="absolute top-4 left-4 text-[10px] font-mono text-amber-500/70 flex items-center gap-1.5 pointer-events-none">
              <span>[+]</span>
              <span>{designStyle === 'apex' ? 'APEX_TERMINAL' : 'SEC_COMMAND'}</span>
            </div>
          )}

          <div>
            <div className="text-4xl font-black text-amber-500 font-['Plus_Jakarta_Sans',sans-serif] mb-4 group-hover:scale-105 transition-transform origin-right">
              P.
            </div>
            <h3 className="text-2xl font-black text-white leading-tight mb-2.5">
              خطوتك القادمة<br />تصنع الفرق.
            </h3>
            <p className="text-xs text-slate-300/90 leading-relaxed font-normal">
              انضم لنخبة الضباط والكوادر القيادية في سيرفر PRAVA وكن جزءاً من منظومة الأمن والعمليات الخاصة الميدانية.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <button
              onClick={onContactLeadership}
              className={`w-full py-3 px-4 rounded-xl inline-flex items-center justify-between text-xs font-bold transition-all duration-300 cursor-pointer ${
                designStyle === 'apex'
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10'
              }`}
            >
              <span>تواصل مع رئاسة قطاعك</span>
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Sectors mapping */}
        {filteredSectors.map((sector) => {
          return (
            <div
              key={sector.id}
              className={`p-6 flex flex-col justify-between transition-all duration-300 relative border group ${
                designStyle === 'apex'
                  ? 'apex-chamfer-card'
                  : `rounded-2xl ${designStyle === 'modern' ? 'hud-corner-card' : ''}`
              } ${
                sector.isOpen
                  ? (designStyle === 'apex'
                      ? 'border-amber-500/30 hover:border-amber-400/80 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20'
                      : designStyle === 'modern'
                        ? 'bg-gradient-to-b from-[#0e121a]/95 to-[#090c12]/95 hover:from-[#131824] hover:to-[#0c1017] border-white/10 hover:border-amber-500/50 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-amber-500/15'
                        : 'bg-[#0c0f16] hover:bg-[#10141d] border-white/10 hover:border-white/25 hover:-translate-y-0.5 shadow-md')
                  : 'bg-[#090b0e]/90 border-white/5 opacity-75 hover:opacity-90 hover:border-white/10'
              }`}
            >
              {/* Top Accent Glow Line on Hover for Apex and Modern Mode */}
              {sector.isOpen && (
                <div className={`absolute top-0 inset-x-0 h-[2px] transition-opacity duration-500 ${
                  designStyle === 'apex'
                    ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 opacity-60 group-hover:opacity-100'
                    : designStyle === 'modern'
                      ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100'
                      : 'hidden'
                }`} />
              )}

              {/* Subtle ambient light gradient on card top */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/[0.02] to-transparent rounded-t-2xl pointer-events-none group-hover:from-amber-500/[0.05] transition-colors duration-300" />

              {/* Card Header */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 gap-2">
                  {/* Status Indicator */}
                  {sector.isOpen ? (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>متاح للتقديم الفوري</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-400 shrink-0">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>التقديم مغلق مؤقتاً</span>
                    </div>
                  )}

                  {/* Badge or Icon with Interactive Hover Micro-Animation */}
                  <SmartBadge
                    badge={sector.badge}
                    alt={sector.name}
                    defaultIcon="sector"
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/15 bg-black/60 shadow-lg group-hover:scale-110 group-hover:rotate-3 group-hover:border-amber-400/60 transition-all duration-300 shrink-0"
                  />
                </div>

                {/* Tag & Sector Name */}
                <div className="text-[10px] font-mono text-amber-500/80 tracking-wider mb-1 flex items-center gap-1.5">
                  <span>PRAVA</span>
                  <span className="text-slate-600">/</span>
                  <span className="uppercase">{sector.id}</span>
                </div>

                <h3 className="text-2xl font-black text-white mb-1.5 group-hover:text-amber-300 transition-colors duration-200">
                  {sector.name}
                </h3>

                <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed mb-4">
                  {sector.subtitle}
                </p>

                {/* Tactical Sector Details Tags (Unit, Age, Roles) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div className="px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5 text-slate-400 flex items-center justify-between">
                    <span>بادئة اليونت:</span>
                    <span className="font-mono font-bold text-amber-400">{sector.unitPrefix || 'M-'}</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5 text-slate-400 flex items-center justify-between">
                    <span>العمر الأدنى:</span>
                    <span className="font-mono font-bold text-white">{sector.minAge || 17}+</span>
                  </div>
                </div>
              </div>

              {/* Card Footer / Action */}
              <div className="pt-4 mt-4 border-t border-white/5 relative z-10">
                {sector.isOpen ? (
                  <button
                    onClick={() => onSelectSector(sector)}
                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all duration-300 cursor-pointer active:scale-[0.98] group/btn ${
                      designStyle === 'apex'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-black border border-amber-300/80 shadow-lg shadow-amber-500/25 shimmer-effect'
                        : `bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 hover:border-amber-500 shadow-md hover:shadow-lg hover:shadow-amber-500/20 ${designStyle === 'modern' ? 'shimmer-effect' : ''}`
                    }`}
                  >
                    <span>تقديم طلب الآن</span>
                    <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/btn:-translate-x-1.5 text-current" />
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 bg-white/[0.02] border border-white/5 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>التقديم مغلق حالياً</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
      </div>
    </section>
  );
};
