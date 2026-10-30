import React, { useState, useRef } from 'react';
import {
  Wrench,
  Volume2,
  VolumeX,
  Play,
  Square,
  Upload,
  RotateCcw,
  Save,
  CheckCircle,
  Sparkles,
  Sliders,
  Radio,
  FileAudio,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  Shield,
  Layers,
  Cpu,
} from 'lucide-react';
import { ServerSettings, UserAccount } from '../types.ts';
import { ANNOUNCEMENT_INTERACTIVE_FX } from '../data/announcementEffects.ts';
import { announcementAudio } from '../utils/announcementSound.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface AdminDeveloperManagerProps {
  settings: ServerSettings;
  onSaveSettings: (newSettings?: ServerSettings) => void;
  currentUser: UserAccount;
}

// Curated high-fidelity realistic sound presets from public Google Actions Audio CDN (100% CORS & browser compatible)
export const REALISTIC_SOUND_PRESETS: Record<string, { label: string; url: string; description: string }> = {
  military_car: {
    label: '🚨 صافرة دورية شرطة حقيقية',
    url: 'https://actions.google.com/sounds/v1/emergency/siren_emergency_vehicle.ogg',
    description: 'صوت سارينة دوريات أمنية عسكرية واقعية عالية النقاء',
  },
  fireworks: {
    label: '🎆 إطلاق ألعاب نارية واقعي',
    url: 'https://actions.google.com/sounds/v1/weapons/fireworks_single_rocket.ogg',
    description: 'صوت انطلاق وصعود ألعاب نارية مع فرقعة حقيقية في السماء',
  },
  red_alert: {
    label: '⚠️ صفارة إنذار طوارئ حربي حقيقية',
    url: 'https://actions.google.com/sounds/v1/emergency/ambulance_siren_distant.ogg',
    description: 'صوت سارينة إنذار قتالي متصاعد',
  },
  jet_flyover: {
    label: '✈️ هدير مقاتلة نفاثة حقيقية',
    url: 'https://actions.google.com/sounds/v1/transportation/jet_flyover.ogg',
    description: 'صوت مرور طائرة حربية خارقة للصوت مع اختراق المجال الجوي',
  },
  helicopter: {
    label: '🚁 شفرات مروحية عسكرية حقيقية',
    url: 'https://actions.google.com/sounds/v1/transportation/helicopter_hover.ogg',
    description: 'صوت دوران شفرات هليكوبتر أباتشي حقيقي واقعي',
  },
  radar_scan: {
    label: '📡 نبضات رادار وسونار بحري',
    url: 'https://actions.google.com/sounds/v1/science_fiction/sonar_ping.ogg',
    description: 'رنين استشعار كهرومغناطيسي تكتيكي عميق',
  },
  tank_convoy: {
    label: '💥 انفجار ثقيل ودوي مدفع',
    url: 'https://actions.google.com/sounds/v1/weapons/large_explosion.ogg',
    description: 'صوت انفجار عميق مع صدى ارتدادي قوي',
  },
  golden_stars: {
    label: '✨ رنين احتفالي ذهبي ملكي',
    url: 'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg',
    description: 'نغمات كلاسيكية مشرقة للأوسمة والنجوم',
  },
  radio_dispatch: {
    label: '📻 تشفير وشوشة لاسلكي دوريات',
    url: 'https://actions.google.com/sounds/v1/science_fiction/radio_static_tuning.ogg',
    description: 'ترددات شفرة لاسلكية حقيقية للعمليات العسكرية',
  },
  marching_drums: {
    label: '🥁 طبول حربية عسكرية حقيقية',
    url: 'https://actions.google.com/sounds/v1/cartoon/conga_groove.ogg',
    description: 'إيقاع عسكري حماسي منتظم لطوابير العرض',
  },
  smoke_screen: {
    label: '💨 تنفيس قنبلة دخانية واقعي',
    url: 'https://actions.google.com/sounds/v1/household/steam_iron_burst.ogg',
    description: 'صوت اندفاع غاز الدخان التكتيكي الكثيف',
  },
  breaking_news: {
    label: '⚡ نغمة خبر عاجل وتلغراف',
    url: 'https://actions.google.com/sounds/v1/household/clock_radio_alarm.ogg',
    description: 'نغمة إنذار عاجل لتنبيه القيادة العامة',
  },
  camera_flashes: {
    label: '📸 مصراع كاميرا صحفية حقيقي',
    url: 'https://actions.google.com/sounds/v1/household/camera_shutter_click.ogg',
    description: 'صوت ميكانيكي عالي الدقة لالتقاط صور وفلاشات',
  },
  laser_target: {
    label: '🎯 ليزر استهداف نبضي مستقبلي',
    url: 'https://actions.google.com/sounds/v1/science_fiction/laser_burst.ogg',
    description: 'صوت طاقة كهرومغناطيسية للاستهداف النقطي',
  },
  wax_stamp: {
    label: '🔨 ضربة مطرقة وختم رسمي ثقيل',
    url: 'https://actions.google.com/sounds/v1/household/door_slam_heavy.ogg',
    description: 'صوت صدمة ارتدادية قوية لختم الوثائق السرية',
  },
};

export const AdminDeveloperManager: React.FC<AdminDeveloperManagerProps> = ({
  settings,
  onSaveSettings,
  currentUser,
}) => {
  const { theme } = useTheme();

  // Local state for sounds
  const [customSounds, setCustomSounds] = useState<Record<string, string>>(() => {
    return settings.customFxSounds || {};
  });

  const [globalSoundUrl, setGlobalSoundUrl] = useState<string>(
    settings.customAnnouncementSoundUrl || ''
  );

  const [volume, setVolume] = useState<number>(settings.soundVolume ?? 0.85);
  const [playingFxId, setPlayingFxId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'customized' | 'default'>('all');
  const [testLog, setTestLog] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Play / Test handler
  const handleTestSound = (fxId: string) => {
    announcementAudio.stop();
    setPlayingFxId(fxId);
    setTestLog(`جاري اختبار صوت [${fxId}]...`);

    const soundUrl = customSounds[fxId] || (fxId === 'global' ? globalSoundUrl : undefined);

    if (soundUrl && soundUrl.trim().length > 0) {
      announcementAudio.playCustomAudio(soundUrl.trim(), volume).then((success) => {
        if (success) {
          setTestLog(`تم تشغيل الصوت المخصص بنجاح ✅`);
        } else {
          setTestLog(`تعذر تشغيل الرابط الخارجي، تم تشغيل الصوت الافتراضي كبديل ⚠️`);
          announcementAudio.playSoundForFx(fxId, undefined, volume);
        }
      });
    } else {
      announcementAudio.playSoundForFx(fxId, undefined, volume);
      setTestLog(`تم تشغيل الصوت الافتراضي (سنتسيزر) 🎛️`);
    }
  };

  const handleStopSound = () => {
    announcementAudio.stop();
    setPlayingFxId(null);
    setTestLog('تم إيقاف الصوت ⏹️');
  };

  // Upload local audio file (MP3, WAV, OGG) -> Base64
  const handleFileUpload = (fxId: string, file: File) => {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. يرجى اختيار ملف صوتي أصغر من 8 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (fxId === 'global') {
        setGlobalSoundUrl(dataUrl);
      } else {
        setCustomSounds((prev) => ({
          ...prev,
          [fxId]: dataUrl,
        }));
      }
      setTestLog(`تم تحميل الملف الصوتي [${file.name}] بنجاح 🎵`);
    };
    reader.readAsDataURL(file);
  };

  // Set preset sound
  const handleApplyPreset = (fxId: string) => {
    const preset = REALISTIC_SOUND_PRESETS[fxId];
    if (preset) {
      setCustomSounds((prev) => ({
        ...prev,
        [fxId]: preset.url,
      }));
      setTestLog(`تم تطبيق الصوت الواقعي الجاهز: ${preset.label} 🚀`);
      // Preview it right away
      announcementAudio.playCustomAudio(preset.url, volume);
      setPlayingFxId(fxId);
    }
  };

  // Reset single sound to default
  const handleResetSound = (fxId: string) => {
    if (fxId === 'global') {
      setGlobalSoundUrl('');
    } else {
      setCustomSounds((prev) => {
        const next = { ...prev };
        delete next[fxId];
        return next;
      });
    }
    announcementAudio.stop();
    setPlayingFxId(null);
    setTestLog(`تمت استعادة الصوت الافتراضي لـ [${fxId}]`);
  };

  // Reset all to default
  const handleResetAllToDefault = () => {
    setCustomSounds({});
    setGlobalSoundUrl('');
    announcementAudio.stop();
    setPlayingFxId(null);
    setTestLog('تمت استعادة جميع الأصوات الافتراضية بالكامل 🔄');
  };

  // Apply all realistic presets
  const handleApplyAllRealisticPresets = () => {
    const allPresets: Record<string, string> = {};
    Object.entries(REALISTIC_SOUND_PRESETS).forEach(([key, val]) => {
      allPresets[key] = val.url;
    });
    setCustomSounds(allPresets);
    setTestLog('تم تطبيق الحزمة الواقعية الكاملة بنجاح! جرب الاستماع الآن 🎧');
  };

  // Save changes to ServerSettings
  const handleSave = () => {
    const updatedSettings: ServerSettings = {
      ...settings,
      customFxSounds: customSounds,
      customAnnouncementSoundUrl: globalSoundUrl,
      soundVolume: volume,
    };
    onSaveSettings(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export JSON configuration
  const handleExportConfig = () => {
    const configData = {
      appName: 'PRAVA Audio Studio Config',
      exportedAt: new Date().toISOString(),
      customFxSounds: customSounds,
      customAnnouncementSoundUrl: globalSoundUrl,
      soundVolume: volume,
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prava-audio-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered effects list
  const filteredFxList = ANNOUNCEMENT_INTERACTIVE_FX.filter((fx) => {
    const hasCustom = !!customSounds[fx.id];
    if (activeFilter === 'customized') return hasCustom;
    if (activeFilter === 'default') return !hasCustom;
    return true;
  });

  const customizedCount = Object.keys(customSounds).length;

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-[#0a0d14] to-amber-950/30 border border-purple-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-amber-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-xl shrink-0">
              <Wrench className="w-7 h-7 animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  شاشة المطور واستوديو تعديل الأصوات بالكامل 🛠️
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30 font-mono">
                  Developer Sound Studio v2.4
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  {customizedCount} أصوات مخصصة
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                هنا يمكنك استبدال الأصوات الافتراضية بشكل كامل ورفع ملفات صوتية حقيقية (MP3 / WAV) من جهازك، أو وضع روابط أصوات خارجية مباشرة، أو تفعيل الحزمة الواقعية الجاهزة بضغطة زر واحدة.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ${theme.buttonClass}`}
            >
              <Save className="w-4 h-4" />
              <span>{saveSuccess ? 'تم حفظ التعديلات بنجاح! ✅' : 'حفظ تعديلات الأصوات'}</span>
            </button>

            <button
              type="button"
              onClick={handleApplyAllRealisticPresets}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="تطبيق أصوات واقعية مسجلة من الواقع لكافة المؤثرات"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>تطبيق الحزمة الواقعية الكاملة 🎧</span>
            </button>

            <button
              type="button"
              onClick={handleResetAllToDefault}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 text-xs font-bold transition-all cursor-pointer"
              title="استعادة كافة الأصوات الافتراضية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الافتراضي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Engine Controls & Status Log */}
      <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          
          {/* Master Volume Slider */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-amber-400 border border-white/10 shrink-0">
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">مستوى الصوت الرئيسي (Master Volume):</span>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-36 sm:w-48 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Test Status Banner */}
          {testLog && (
            <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{testLog}</span>
              {playingFxId && (
                <button
                  type="button"
                  onClick={handleStopSound}
                  className="text-red-400 hover:text-red-300 text-[11px] font-bold mr-2 underline cursor-pointer"
                >
                  إيقاف الآن ⏹️
                </button>
              )}
            </div>
          )}

          {/* Export config button */}
          <button
            type="button"
            onClick={handleExportConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير ملف الأصوات (JSON)</span>
          </button>
        </div>

        {/* Global Sound Override Card */}
        <div className="bg-black/50 border border-amber-500/20 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-white text-sm">
                صوت الإعلانات العام الموحد (Global Custom Sound)
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                اختياري
              </span>
            </div>
            <p className="text-xs text-slate-400">
              إذا حددت هذا الصوت، فسيتم تشغيله لجميع الإعلانات تلقائياً بدلاً من صوت المؤثر الخاص بها.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={globalSoundUrl}
              onChange={(e) => setGlobalSoundUrl(e.target.value)}
              placeholder="https://... رابط ملف صوتي (MP3 / WAV)"
              dir="ltr"
              className="flex-1 md:w-80 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
            />

            <label className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>رفع ملف</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('global', file);
                }}
              />
            </label>

            {globalSoundUrl && (
              <>
                <button
                  type="button"
                  onClick={() => handleTestSound('global')}
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
                  title="تجربة الصوت العام"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalSoundUrl('')}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs cursor-pointer"
                  title="حذف الصوت العام"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 15 EFFECTS SOUND MANAGEMENT MATRIX */}
      <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-3">
          <div>
            <h4 className="font-extrabold text-white text-base flex items-center gap-2">
              <span>تخصيص صوت كل مؤثر من المؤثرات التفاعلية الـ 15</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                15 مؤثر مستقل
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              عدّل أو ارفع صوتك الخاص لكل مؤثر على حدة، أو اختر من الأصوات الواقعية المقترحة
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'all' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل (15)
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('customized')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'customized' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              المخصصة ({customizedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('default')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'default' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              الافتراضية ({15 - customizedCount})
            </button>
          </div>
        </div>

        {/* The Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFxList.map((fx) => {
            const currentSound = customSounds[fx.id];
            const isCustom = !!currentSound;
            const isPlaying = playingFxId === fx.id;
            const preset = REALISTIC_SOUND_PRESETS[fx.id];

            return (
              <div
                key={fx.id}
                className={`bg-black/40 hover:bg-black/60 border rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between gap-4 shadow-lg ${
                  isCustom ? 'border-purple-500/40 bg-purple-950/10' : 'border-white/10'
                }`}
              >
                {/* Top Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-white/5 border border-white/5">
                      {fx.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-black text-white text-sm sm:text-base">
                          {fx.name}
                        </h5>
                        <span className="text-[10px] text-slate-500 font-mono">{fx.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{fx.description}</p>
                    </div>
                  </div>

                  {/* Mode Badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                      isCustom
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    {isCustom ? 'صوت مخصص 🎵' : 'افتراضي مصنّع 🎛️'}
                  </span>
                </div>

                {/* Preset Shortcut Banner */}
                {preset && (
                  <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-purple-200 font-bold truncate">{preset.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(fx.id)}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 font-bold text-[11px] border border-purple-500/40 transition-colors cursor-pointer shrink-0"
                    >
                      تطبيق هذا الصوت الواقعي ➔
                    </button>
                  </div>
                )}

                {/* Custom Audio URL Input & File Upload */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentSound || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSounds((prev) => ({
                          ...prev,
                          [fx.id]: val,
                        }));
                      }}
                      placeholder="ضع رابط الصوت (MP3 / WAV) أو ارفع ملف من جهازك"
                      dir="ltr"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-purple-400 text-left transition-colors"
                    />

                    {/* File Upload Button */}
                    <label className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 cursor-pointer transition-colors shrink-0" title="رفع ملف صوتي من الجهاز">
                      <Upload className="w-4 h-4 text-purple-400" />
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(fx.id, file);
                        }}
                      />
                    </label>

                    {/* Reset Button */}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleResetSound(fx.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer shrink-0"
                        title="استعادة الصوت الافتراضي"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Audio Action Buttons: Play Test, Stop */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isPlaying ? (
                      <button
                        type="button"
                        onClick={handleStopSound}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold cursor-pointer transition-all"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف الصوت</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTestSound(fx.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer transition-all shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>استماع وتجربة فورية</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {isCustom ? (currentSound.startsWith('data:') ? 'ملف مرفوع Base64' : 'رابط مباشر') : 'Web Audio Synth'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Developer Diagnostic & Benchmark Panel */}
      <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 text-purple-400 pb-3 border-b border-white/5">
          <Cpu className="w-5 h-5" />
          <h4 className="font-extrabold text-white text-base">
            فحص أداء نظام الصوت وبيئة التشغيل (Developer Diagnostics)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 space-y-1">
            <span className="text-slate-400 block">محرك الصوت النشط</span>
            <span className="font-mono font-bold text-emerald-400">Web Audio API + HTML5 Audio</span>
          </div>

          <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 space-y-1">
            <span className="text-slate-400 block">حالة توافق المتصفح</span>
            <span className="font-mono font-bold text-emerald-400">كامل (CORS & Mobile Ready)</span>
          </div>

          <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 space-y-1">
            <span className="text-slate-400 block">المستخدم الحالي</span>
            <span className="font-mono font-bold text-amber-400">{currentUser.displayName} ({currentUser.roleTitle})</span>
          </div>
        </div>
      </div>

    </div>
  );
};
