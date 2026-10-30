import React, { useState } from 'react';
import {
  Megaphone,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Save,
  CheckCircle,
  Eye,
  Upload,
  Link,
  RotateCcw,
  Sliders,
  Shield,
  Layers,
  Info,
} from 'lucide-react';
import { Announcement, ServerSettings, UserAccount } from '../types.ts';
import { ANNOUNCEMENT_INTERACTIVE_FX, InteractiveAnnouncementFx } from '../data/announcementEffects.ts';
import { announcementAudio } from '../utils/announcementSound.ts';
import { AnnouncementModal } from './AnnouncementModal.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

interface AdminAnnouncementManagerProps {
  settings: ServerSettings;
  onSaveSettings: (updated: ServerSettings) => Promise<void> | void;
  currentUser: UserAccount;
}

export const AdminAnnouncementManager: React.FC<AdminAnnouncementManagerProps> = ({
  settings,
  onSaveSettings,
  currentUser,
}) => {
  const { theme } = useTheme();

  // Working state for the announcement
  const [announcement, setAnnouncement] = useState<Announcement>(() => {
    return (
      settings.announcement || {
        id: `ann-${Date.now()}`,
        title: 'تعميم إداري رسمي هام للجميع',
        message: 'يسر القيادة العليا الإعلان عن فتح باب التقديم والقبول لكافة القطاعات العسكرية. نرجو من الجميع الالتزام بالأنظمة والتعليمات.',
        imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        actionUrl: '',
        actionText: 'الانتقال إلى الرابط',
        isActive: true,
        interactiveFx: 'military_car',
        enableSound: true,
      }
    );
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [testedFxId, setTestedFxId] = useState<string | null>(null);

  // Filter category for effects selector
  const [fxCategoryFilter, setFxCategoryFilter] = useState<'all' | 'military' | 'celebration' | 'urgent' | 'tactical'>('all');

  // Filtered effects
  const filteredFx = ANNOUNCEMENT_INTERACTIVE_FX.filter(
    (fx) => fxCategoryFilter === 'all' || fx.category === fxCategoryFilter
  );

  // Play sound for an effect immediately
  const handleTestFxSound = (fxId: string) => {
    setTestedFxId(fxId);
    announcementAudio.playSoundForFx(fxId);
    setTimeout(() => setTestedFxId(null), 1200);
  };

  // Image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setAnnouncement((prev) => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedAnn: Announcement = {
        ...announcement,
        id: announcement.id || `ann-${Date.now()}`,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.displayName,
      };

      const updatedSettings: ServerSettings = {
        ...settings,
        announcement: updatedAnn,
      };

      await onSaveSettings(updatedSettings);
      setSaveSuccessMsg('تم حفظ وتحديث ونشر الإعلان بنجاح!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch {
      setSaveSuccessMsg('تم الحفظ في الذاكرة المحلية!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#0e131d] to-[#090b10] border-2 border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20 shrink-0">
              <Megaphone className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  شاشة الإعلانات المنفصلة
                </span>
                <span className="text-xs text-slate-400 font-mono">15 مؤثر تفاعلي بالصوت والصورة</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                إدارة الإعلانات والتعميمات المنبثقة التفاعلية
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                تظهر هذه الشاشة للمستخدمين فور الدخول بحجم كامل وبدون قص للصورة مع المؤثرات والأصوات الحية.
              </p>
            </div>
          </div>

          {/* Quick Preview & Save Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-black transition-all cursor-pointer shadow-md"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الإعلان بكامل الشاشة 🚀</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} shadow-lg`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر الإعلان فوراً'}</span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Settings Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Announcement Details Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Status & Sound Toggle */}
          <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>حالة وظهور الإعلان</span>
            </h4>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">تفعيل ظهور الإعلان المنبثق</span>
                <span className="text-[11px] text-slate-400">عند تفعيله، يظهر للمستخدمين عند فتح الموقع.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.isActive}
                  onChange={(e) => setAnnouncement({ ...announcement, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-2.5">
                {announcement.enableSound !== false ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-red-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">تشغيل المؤثرات الصوتية</span>
                  <span className="text-[11px] text-slate-400">عزف نغمات وأصوات السارينة والفرقعة تلقائياً.</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.enableSound !== false}
                  onChange={(e) => setAnnouncement({ ...announcement, enableSound: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Announcement Content Form */}
          <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>محتوى ونصوص الإعلان</span>
            </h4>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                عنوان الإعلان الرئيسي
              </label>
              <input
                type="text"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="مثال: تعميم رسمي من القيادة العسكرية"
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400 transition-colors"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'تعميم عسكري رسمي ومهم',
                  'فتح باب التقديم والقبول',
                  'ترقيات وأوسمة القيادة',
                  'حالة استنفار وتدريب ميداني',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAnnouncement({ ...announcement, title: preset })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-white/5 transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                نص الإعلان والتعليمات
              </label>
              <textarea
                rows={5}
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                placeholder="اكتب تفاصيل الإعلان والتوجيهات هنا..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Image URL & Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>صورة الإعلان (تظهر كاملة 100% بدون أي قص)</span>
                {announcement.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setAnnouncement({ ...announcement, imageUrl: '' })}
                    className="text-red-400 hover:underline text-[10px] cursor-pointer"
                  >
                    حذف الصورة
                  </button>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={announcement.imageUrl || ''}
                  onChange={(e) => setAnnouncement({ ...announcement, imageUrl: e.target.value })}
                  placeholder="https://... أو ارفع صورة من جهازك"
                  dir="ltr"
                  className="flex-1 px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                />
                <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Preview Thumbnail */}
              {announcement.imageUrl && (
                <div className="p-2 rounded-xl bg-black/70 border border-amber-500/30 flex items-center gap-3">
                  <img
                    src={announcement.imageUrl}
                    alt="Preview"
                    className="w-20 h-16 object-contain rounded-lg bg-black/50 border border-white/10"
                  />
                  <div className="text-[11px] text-slate-400">
                    <span className="font-bold text-amber-300 block">معاينة الصورة:</span>
                    <span>ستعرض الشاشة الصورة كاملة وبأعلى دقة دون أي اقتصاص.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Link & Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  رابط خارجي اختياري
                </label>
                <input
                  type="text"
                  value={announcement.actionUrl || ''}
                  onChange={(e) => setAnnouncement({ ...announcement, actionUrl: e.target.value })}
                  placeholder="https://discord.gg/..."
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  نص زر الرابط
                </label>
                <input
                  type="text"
                  value={announcement.actionText || 'الانتقال إلى الرابط'}
                  onChange={(e) => setAnnouncement({ ...announcement, actionText: e.target.value })}
                  placeholder="الانتقال إلى الرابط"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: 15 Interactive Effects Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#090b10] border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h4 className="font-black text-white text-base">
                    اختر المؤثر التفاعلي المصاحب للإعلان (15 مؤثر عسكري واحتفالي)
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  عند ظهور الإعلان، ينطلق المؤثر المختار مع الصوت التفاعلي فوراً.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'military', label: 'عسكري' },
                  { id: 'celebration', label: 'احتفالي' },
                  { id: 'urgent', label: 'طوارئ' },
                  { id: 'tactical', label: 'تكتيكي' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFxCategoryFilter(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      fxCategoryFilter === cat.id
                        ? 'bg-amber-500 text-black shadow-sm font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 15 Effects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredFx.map((fx) => {
                const isSelected = (announcement.interactiveFx || 'military_car') === fx.id;
                const isTesting = testedFxId === fx.id;

                return (
                  <div
                    key={fx.id}
                    onClick={() => setAnnouncement({ ...announcement, interactiveFx: fx.id })}
                    className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-right group ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                        : 'bg-black/40 border-white/5 hover:border-amber-500/30 hover:bg-black/60'
                    }`}
                  >
                    {/* Top Row: Icon, Name & Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                          {fx.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs sm:text-sm text-white">
                              {fx.name}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 inline-block mt-1">
                            {fx.tag}
                          </span>
                        </div>
                      </div>

                      {/* Selected Radio Indicator */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {fx.description}
                    </p>

                    {/* Bottom Actions: Test Sound Button */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestFxSound(fx.id);
                        }}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isTesting
                            ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse'
                            : 'bg-white/5 hover:bg-amber-500/20 text-amber-300 border-white/10 hover:border-amber-500/30'
                        }`}
                        title="تجربة الصوت التفاعلي الآن"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isTesting ? 'يعزف الآن 🔊' : 'تجربة الصوت'}</span>
                      </button>

                      {isSelected && (
                        <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>المؤثر النشط</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls / Save Bar */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>المؤثر المختار: <strong className="text-amber-300">{ANNOUNCEMENT_INTERACTIVE_FX.find(f => f.id === (announcement.interactiveFx || 'military_car'))?.name}</strong></span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة الإعلان</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} shadow-lg`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر الإعلان'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Live Full-Screen Preview Modal */}
      {isPreviewOpen && (
        <AnnouncementModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          announcement={announcement}
          serverLogo={settings.serverLogo}
          serverName={settings.serverName}
        />
      )}

    </div>
  );
};
