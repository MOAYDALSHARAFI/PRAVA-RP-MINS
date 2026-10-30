import React from 'react';
import { Home, Shield, User, Lock, Sparkles, Smartphone, Monitor, ArrowLeftRight, Megaphone } from 'lucide-react';
import { useViewMode } from '../context/ViewModeContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { UserAccount } from '../types.ts';

interface MobileBottomNavProps {
  onGoHome: () => void;
  onOpenSectors: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenPersonnelPortal?: () => void;
  onOpenChangelog: () => void;
  onOpenAnnouncement?: () => void;
  hasActiveAnnouncement?: boolean;
  currentUser: UserAccount | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onGoHome,
  onOpenSectors,
  onOpenAuth,
  onOpenAdmin,
  onOpenPersonnelPortal,
  onOpenChangelog,
  onOpenAnnouncement,
  hasActiveAnnouncement,
  currentUser,
}) => {
  const { viewMode, toggleViewMode, isMobile } = useViewMode();
  const { theme } = useTheme();

  // Show bottom nav if mobile mode is active
  if (!isMobile) return null;

  const isStaff = currentUser && currentUser.role !== 'applicant';

  return (
    <nav 
      aria-label="شريط التنقل السريع للجوال"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#090c13]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] flex items-center justify-around safe-bottom"
    >
      {/* 1. Home Button */}
      <button
        onClick={onGoHome}
        className="flex flex-col items-center justify-center p-1.5 text-slate-300 hover:text-amber-400 transition-colors active:scale-95 cursor-pointer flex-1"
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">الرئيسية</span>
      </button>

      {/* 2. Sectors Button */}
      <button
        onClick={onOpenSectors}
        className="flex flex-col items-center justify-center p-1.5 text-slate-300 hover:text-amber-400 transition-colors active:scale-95 cursor-pointer flex-1"
      >
        <Shield className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">القطاعات</span>
      </button>

      {/* 3. Central Switcher (زرار صغير للتبديل بين كمبيوتر وجوال) */}
      <button
        onClick={toggleViewMode}
        className="flex flex-col items-center justify-center p-1.5 transition-transform active:scale-90 cursor-pointer flex-1 group"
        title="التبديل إلى وضع الكمبيوتر (سطح المكتب)"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform">
          <Monitor className="w-4 h-4 text-cyan-400" />
        </div>
        <span className="text-[9px] font-black text-amber-300 mt-0.5 flex items-center gap-0.5">
          <span>كمبيوتر</span>
          <span className="text-[8px] opacity-75">⇄</span>
        </span>
      </button>

      {/* 4. Personnel Portal for Soldiers (نقل / فصل) or Announcement / Updates */}
      {currentUser && onOpenPersonnelPortal ? (
        <button
          onClick={onOpenPersonnelPortal}
          className="flex flex-col items-center justify-center p-1.5 text-cyan-300 hover:text-cyan-200 transition-colors active:scale-95 cursor-pointer flex-1 relative"
          title="بوابة النقل لقطاع آخر أو فصل الخدمة"
        >
          <div className="relative">
            <ArrowLeftRight className="w-5 h-5 mb-0.5 text-cyan-400" />
            <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-amber-500 text-black text-[8px] font-black leading-tight">
              قريباً
            </span>
          </div>
          <span className="text-[10px] font-bold">نقل/فصل</span>
        </button>
      ) : hasActiveAnnouncement && onOpenAnnouncement ? (
        <button
          onClick={onOpenAnnouncement}
          className="flex flex-col items-center justify-center p-1.5 text-amber-300 hover:text-amber-200 transition-colors active:scale-95 cursor-pointer flex-1"
          title="عرض الإعلان الرسمي"
        >
          <div className="relative">
            <Megaphone className="w-5 h-5 mb-0.5 text-amber-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <span className="text-[10px] font-bold text-amber-300">التعميم</span>
        </button>
      ) : (
        <button
          onClick={onOpenChangelog}
          className="flex flex-col items-center justify-center p-1.5 text-slate-300 hover:text-amber-400 transition-colors active:scale-95 cursor-pointer flex-1"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold">التحديثات</span>
        </button>
      )}

      {/* 5. Account or Admin Dashboard */}
      {isStaff ? (
        <button
          onClick={onOpenAdmin}
          className="flex flex-col items-center justify-center p-1.5 text-amber-400 hover:text-amber-300 transition-colors active:scale-95 cursor-pointer flex-1"
        >
          <Lock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">الإدارة</span>
        </button>
      ) : (
        <button
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center p-1.5 text-slate-300 hover:text-amber-400 transition-colors active:scale-95 cursor-pointer flex-1"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">{currentUser ? 'حسابي' : 'دخول'}</span>
        </button>
      )}
    </nav>
  );
};
