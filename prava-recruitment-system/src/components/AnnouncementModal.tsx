import React, { useEffect, useState, useRef } from 'react';
import {
  Megaphone,
  X,
  ExternalLink,
  CheckCircle,
  Bell,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { Announcement, ServerSettings } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { AnnouncementEffectsRenderer } from './AnnouncementEffectsRenderer.tsx';
import { announcementAudio } from '../utils/announcementSound.ts';
import { ANNOUNCEMENT_INTERACTIVE_FX } from '../data/announcementEffects.ts';

interface AnnouncementModalProps {
  announcement?: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
  serverLogo?: string;
  serverName?: string;
  serverSettings?: ServerSettings;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  isOpen,
  onClose,
  serverLogo,
  serverName,
  serverSettings,
}) => {
  const { theme } = useTheme();
  const [triggerKey, setTriggerKey] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Active effect configuration
  const currentFxId = announcement?.interactiveFx || 'military_car';
  const currentFxMeta = ANNOUNCEMENT_INTERACTIVE_FX.find((fx) => fx.id === currentFxId) || ANNOUNCEMENT_INTERACTIVE_FX[0];

  // Resolve custom sound (per-announcement override, per-fx override in developer settings, or global sound)
  const resolvedCustomAudioUrl = 
    announcement?.customSoundUrl || 
    serverSettings?.customFxSounds?.[currentFxId] || 
    serverSettings?.customAnnouncementSoundUrl;

  const currentVolume = serverSettings?.soundVolume ?? 0.85;

  // Play effect and sound upon opening
  useEffect(() => {
    if (isOpen && announcement?.isActive) {
      setTriggerKey((prev) => prev + 1);
      if (!isMuted && announcement.enableSound !== false) {
        // Small delay so user audio context is ready
        const timer = setTimeout(() => {
          announcementAudio.playSoundForFx(currentFxId, resolvedCustomAudioUrl, currentVolume);
        }, 150);
        return () => {
          clearTimeout(timer);
          announcementAudio.stop();
        };
      }
    } else {
      hasTriggeredRef.current = false;
      announcementAudio.stop();
    }
  }, [isOpen, announcement?.id, announcement?.isActive, currentFxId, isMuted, announcement?.enableSound, resolvedCustomAudioUrl, currentVolume]);

  // Replay effect & audio handler
  const handleReplayFx = () => {
    setTriggerKey((prev) => prev + 1);
    if (!isMuted && announcement?.enableSound !== false) {
      announcementAudio.playSoundForFx(currentFxId, resolvedCustomAudioUrl, currentVolume);
    }
  };

  const handleClose = () => {
    announcementAudio.stop();
    onClose();
  };

  if (!isOpen || !announcement || !announcement.isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-5 md:p-8 bg-black/92 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Main Full-Screen Overlay Card */}
      <div 
        className="relative w-full max-w-5xl max-h-[96vh] flex flex-col bg-[#0b0e14]/95 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden text-right z-[120]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow corner accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-20">
          
          {/* Controls: Close, Mute, Replay */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all cursor-pointer"
              title="إغلاق الإعلان"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                  : 'bg-white/5 text-amber-400 hover:bg-amber-500/10 border-white/5 hover:border-amber-500/30'
              }`}
              title={isMuted ? 'إلغاء كتم الصوت' : 'كتم المؤثر الصوتي'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
            </button>

            <button
              onClick={handleReplayFx}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="إعادة تشغيل حركة ومؤثر الإعلان"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة تشغيل المؤثر</span>
            </button>
          </div>

          {/* Title & Server Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] sm:text-xs font-black text-amber-300 flex items-center gap-1 shadow-sm">
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>تعميم رسمي معتمد</span>
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {serverName || 'سيرفر PRAVA'}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white mt-0.5">
                {announcement.title || 'إعلان إداري هام للجميع'}
              </h2>
            </div>

            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              {serverLogo ? (
                <img src={serverLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              ) : (
                <Megaphone className="w-6 h-6 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">


          {/* High-Resolution Full-View Image Showcase (100% Complete, ZERO cropping) */}
          {announcement.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-black/80 flex items-center justify-center p-2 sm:p-3 group shadow-2xl">
              
              {/* Fullscreen Zoom Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFullscreenImage(!isFullscreenImage)}
                className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
                title="عرض الصورة كاملة بدون إطارات"
              >
                {isFullscreenImage ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreenImage ? 'تصغير' : 'تكبير الصورة'}</span>
              </button>

              {/* The Image itself: object-contain guarantees 100% full image is visible with no cuts */}
              <img 
                src={announcement.imageUrl} 
                alt={announcement.title} 
                className={`w-auto max-w-full transition-all duration-300 object-contain rounded-xl ${
                  isFullscreenImage ? 'max-h-[82vh]' : 'max-h-[50vh] sm:max-h-[58vh]'
                }`}
                loading="eager"
              />
            </div>
          )}

          {/* Announcement Message Body */}
          {announcement.message && announcement.message.trim() ? (
            <div className="p-4 sm:p-6 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium shadow-inner">
              {announcement.message}
            </div>
          ) : (
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 border border-amber-500/20 text-center space-y-2 shadow-inner">
              <p className="text-sm sm:text-base font-bold text-amber-300">
                {announcement.title}
              </p>
              <p className="text-xs text-slate-400">
                يرجى من جميع المتقدمين والضباط الكرام الاطلاع والتقيد بالتعليمات الصادرة من القيادة.
              </p>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="p-3.5 sm:p-5 border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20">
          
          <div className="text-[11px] text-slate-400 font-mono text-center sm:text-right">
            نشر بواسطة القيادة • {announcement.updatedBy ? `المسؤول: ${announcement.updatedBy}` : 'إشعار فوري'}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {announcement.actionUrl && (
              <a
                href={announcement.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{announcement.actionText || 'الانتقال إلى الرابط المرفق'}</span>
              </a>
            )}

            <button
              onClick={handleClose}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>فهمت التعميم والمتابعة</span>
            </button>
          </div>

        </div>

      </div>

      {/* 15 Interactive Visual Effects Layer - Rendered directly OVER the announcement card */}
      <AnnouncementEffectsRenderer fxType={currentFxId} triggerKey={triggerKey} />
    </div>
  );
};
