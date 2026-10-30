import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  UserMinus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Award, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Sparkles,
  Info,
  Check,
  Lock
} from 'lucide-react';
import { UserAccount, Sector, PersonnelRequest, ServerSettings, Application } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { apiUrl, safeFetchJson } from '../utils/api.ts';

interface PersonnelPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  sectors: Sector[];
  serverSettings: ServerSettings;
}

export const PersonnelPortalModal: React.FC<PersonnelPortalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sectors,
  serverSettings,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'request_transfer' | 'request_discharge' | 'my_requests'>('request_transfer');
  
  // Service status state
  const [currentSectorId, setCurrentSectorId] = useState<string>('');
  const [currentSectorName, setCurrentSectorName] = useState<string>('');
  const [currentRank, setCurrentRank] = useState<string>('');
  const [currentProtocol, setCurrentProtocol] = useState<string>('');
  const [currentUnit, setCurrentUnit] = useState<string>('');
  const [serviceStatus, setServiceStatus] = useState<'active' | 'transferred' | 'discharged'>('active');

  // Form states
  const [targetSectorId, setTargetSectorId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User's requests history
  const [userRequests, setUserRequests] = useState<PersonnelRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Load user's latest service details from applications & profile
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const loadServiceInfo = async () => {
      // 1. Initial values from user account
      let sId = currentUser.activeSectorId || '';
      let sName = currentUser.activeSectorName || '';
      let rank = currentUser.activeRank || '';
      let protocol = currentUser.activeRankProtocol || '';
      let unit = currentUser.activeUnit || '';
      let status = currentUser.serviceStatus || 'active';

      // 2. Query user's applications to get verified sector, rank, unit
      try {
        const apps = await safeFetchJson<Application[]>('/api/applications');
        if (apps && Array.isArray(apps)) {
          const userApp = apps.find(
            (a) =>
              (currentUser.gameId && a.gameId === currentUser.gameId) ||
              a.playerName?.toLowerCase() === currentUser.username.toLowerCase() ||
              a.fullName?.toLowerCase() === currentUser.displayName.toLowerCase()
          );

          if (userApp) {
            sId = userApp.sectorId || sId;
            sName = userApp.sectorName || sName;
            rank = userApp.rank || rank || 'جندي';
            protocol = userApp.rankProtocol || protocol || 'M-1';
            unit = userApp.currentUnit || unit || (userApp.militaryNo ? `${sName || 'UNIT'}-${userApp.militaryNo}` : '');
            if (userApp.serviceStatus) status = userApp.serviceStatus;
          }
        }
      } catch (err) {
        console.warn('Failed to load apps for service info', err);
      }

      // Default fallback if empty
      if (!sId && sectors.length > 0) {
        sId = sectors[0].id;
        sName = sectors[0].name;
      }
      if (!rank) rank = 'جندي';
      if (!protocol) protocol = 'M-1';

      setCurrentSectorId(sId);
      setCurrentSectorName(sName);
      setCurrentRank(rank);
      setCurrentProtocol(protocol);
      setCurrentUnit(unit);
      setServiceStatus(status);

      // Default target sector (different from current)
      const availableTarget = sectors.find((s) => s.id !== sId);
      if (availableTarget) setTargetSectorId(availableTarget.id);
    };

    loadServiceInfo();
    fetchUserRequests();
  }, [isOpen, currentUser]);

  const fetchUserRequests = async () => {
    if (!currentUser) return;
    setIsLoadingRequests(true);
    try {
      const res = await safeFetchJson<PersonnelRequest[]>(`/api/personnel-requests?username=${encodeURIComponent(currentUser.username)}`);
      if (res && Array.isArray(res)) {
        setUserRequests(res);
      }
    } catch (e) {
      console.warn('Failed to fetch personnel requests', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSectorId) {
      setErrorMessage('يرجى اختيار القطاع المطلوب الانتقال إليه');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('يرجى توضيح سبب طلب النقل');
      return;
    }

    const targetSec = sectors.find((s) => s.id === targetSectorId);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        type: 'transfer',
        applicantUsername: currentUser.username,
        applicantDisplayName: currentUser.displayName,
        applicantGameId: currentUser.gameId || '',
        applicantDiscord: currentUser.discordUsername || '',
        currentSectorId,
        currentSectorName: currentSectorName || currentSectorId,
        currentRank,
        currentProtocol,
        currentUnit,
        targetSectorId,
        targetSectorName: targetSec?.arabicName || targetSec?.name || targetSectorId,
        reason: reason.trim(),
      };

      const res = await fetch(apiUrl('/api/personnel-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذر إرسال الطلب');
      }

      setSuccessMessage('تم إرسال طلب النقل إلى قيادة القطاع بنجاح! سيتم مراجعة طلبك وإشعارك بالقرار.');
      setReason('');
      setActiveTab('my_requests');
      fetchUserRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال طلب النقل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('يرجى توضيح سبب طلب الفصل / إنهاء الخدمة');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        type: 'discharge',
        applicantUsername: currentUser.username,
        applicantDisplayName: currentUser.displayName,
        applicantGameId: currentUser.gameId || '',
        applicantDiscord: currentUser.discordUsername || '',
        currentSectorId,
        currentSectorName: currentSectorName || currentSectorId,
        currentRank,
        currentProtocol,
        currentUnit,
        reason: reason.trim(),
      };

      const res = await fetch(apiUrl('/api/personnel-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذر إرسال الطلب');
      }

      setSuccessMessage('تم إرسال طلب إنهاء الخدمة والفصل إلى الإدارة بنجاح وسيتم اعتماده قريباً.');
      setReason('');
      setActiveTab('my_requests');
      fetchUserRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال طلب الفصل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetSecObj = sectors.find((s) => s.id === targetSectorId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0c0f16] border border-white/10 rounded-2xl shadow-2xl flex flex-col text-right my-auto safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:px-7 border-b border-white/10 flex items-center justify-between bg-[#090b10]">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2 justify-end">
                <span>بوابة شؤون الأفراد (طلبات النقل والفصل)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                خدمة ذاتية للعسكريين لتقديم طلب نقل لقطاع آخر أو إنهاء الخدمة العسكرية
              </p>
            </div>
          </div>
        </div>

        {/* Current Soldier Service Card */}
        <div className="p-4 sm:p-6 border-b border-white/5 bg-gradient-to-r from-amber-500/10 via-[#121622] to-black">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>بيانات الخدمة الميدانية الحالية:</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
              serviceStatus === 'active' 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : serviceStatus === 'transferred'
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>
              {serviceStatus === 'active' ? '🟢 على رأس العمل' : serviceStatus === 'transferred' ? '🔄 تم النقل' : '🔴 مفصول من الخدمة'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-black/40 p-3.5 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 block">العسكري:</span>
              <span className="font-bold text-white truncate block">{currentUser.displayName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">القطاع الحالي:</span>
              <span className="font-bold text-amber-300 truncate block">{currentSectorName || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">الرتبة والبروتوكول:</span>
              <span className="font-bold text-white flex items-center gap-1">
                {currentProtocol && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                    {currentProtocol}
                  </span>
                )}
                <span>{currentRank || 'جندي'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">اليونت الميداني:</span>
              <span className="font-mono font-bold text-slate-200">{currentUnit || '-'}</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Locked View */}
        <div className="p-6 sm:p-10 text-center space-y-5 flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
            <span>قريباً 🔒</span>
            <span className="text-slate-500">•</span>
            <span>مغلق حالياً للتطوير</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              بوابة النقل والفصل العسكري
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              بناءً على التوجيهات القيادية في السيرفر العسكري PRAVA، تم إيقاف وقفل تقديم طلبات النقل بين القطاعات أو إنهاء الخدمة العسكرية مؤقتاً للتعديل والتطوير عليها لاحقاً.
            </p>
          </div>

          {/* Planned Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-2 text-right">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">نظام النقل بين القطاعات</span>
                <span className="text-[11px] text-slate-400">نقل العسكريين مع حفظ الأقدمية وتحديث الرتبة والبروتوكول (قيد التجهيز)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                <UserMinus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">إجراءات الفصل وإخلاء الطرف</span>
                <span className="text-[11px] text-slate-400">إنهاء الخدمة وتوثيق السجل العسكري وإسقاط الرتب (قيد التجهيز)</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>

        {false && (
        <>
        <div className="px-4 sm:px-6 border-b border-white/10 bg-[#080a0f] flex items-center gap-2 py-2.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('request_transfer'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'request_transfer'
                ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>طلب نقل لقطاع آخر</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('request_discharge'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'request_discharge'
                ? 'bg-red-500/90 text-white font-black shadow-lg shadow-red-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>طلب فصل / إنهاء خدمة</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('my_requests'); setErrorMessage(null); setSuccessMessage(null); fetchUserRequests(); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'my_requests'
                ? 'bg-blue-500 text-white font-black shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>طلباتي السابقة ({userRequests.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-4 flex-1">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Transfer Request */}
          {activeTab === 'request_transfer' && (
            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>آلية النقل العسكري بين القطاعات:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  عند تقديم طلب النقل، يذهب الطلب لقيادة القطاع الجديد وصاحب الصلاحية. عند قبولك، يتم تعيين رتبتك وبروتوكولك الجديد في القطاع الجديد، وتُحذف رتبتك تلقائياً من قطاعك السابق.
                </p>
              </div>

              {/* Target Sector Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>القطاع المطلوب الانتقال إليه *</span>
                </label>
                <select
                  value={targetSectorId}
                  onChange={(e) => setTargetSectorId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#080a0f] border border-white/15 text-white text-base sm:text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="" disabled>اختر القطاع المراد النقل إليه</option>
                  {sectors
                    .filter((s) => s.id !== currentSectorId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.arabicName || s.name} ({s.subtitle || s.name})
                      </option>
                    ))}
                </select>
                {targetSecObj && (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    بادئة اليونت لقطاع {targetSecObj?.arabicName || targetSecObj?.name}: <b className="text-amber-300 font-mono">{targetSecObj?.unitPrefix || 'UNIT'}-</b>
                  </span>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  سبب طلب النقل *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اكتب أسباب رغبتك بالانتقال للقطاع الآخر، والخبرات أو التخصصات الميدانية..."
                  className="w-full px-4 py-3 rounded-xl bg-[#080a0f] border border-white/15 text-white text-base sm:text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow-lg flex items-center justify-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال طلب النقل للقيادة</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Discharge / Resignation Request */}
          {activeTab === 'request_discharge' && (
            <form onSubmit={handleSubmitDischarge} className="space-y-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>تنبيه إنهاء الخدمة العسكرية (فصل):</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تقديم هذا الطلب يعني إنهاء ارتباطك الميداني بالقطاع الحالي. عند اعتماد الطلب من المسؤول، ستُسقط رتبتك العسكرية واليونت المخصص لك نهائياً.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  سبب طلب الفصل / الاستقالة من الخدمة *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="يرجى ذكر سبب طلب إنهاء الخدمة العسكرية بالتفصيل..."
                  className="w-full px-4 py-3 rounded-xl bg-[#080a0f] border border-white/15 text-white text-base sm:text-xs focus:outline-none focus:border-red-400 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-red-600 hover:bg-red-500 text-white active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>تأكيد إرسال طلب الفصل العسكري</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: User's Requests History */}
          {activeTab === 'my_requests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">سجل طلباتك المرفوعة:</span>
                <button
                  type="button"
                  onClick={fetchUserRequests}
                  disabled={isLoadingRequests}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                  <span>تحديث</span>
                </button>
              </div>

              {userRequests.length === 0 ? (
                <div className="p-8 text-center bg-black/40 rounded-xl border border-white/5 text-slate-400 text-xs">
                  لم تقم برفع أي طلبات نقل أو فصل حتى الآن.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userRequests.map((req) => {
                    const isTransfer = req.type === 'transfer';
                    const isApproved = req.status === 'مقبول';
                    const isRejected = req.status === 'مرفوض';

                    return (
                      <div 
                        key={req.id}
                        className={`p-4 rounded-xl border transition-all text-xs ${
                          isApproved
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : isRejected
                            ? 'bg-red-500/5 border-red-500/30'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isTransfer 
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                                : 'bg-red-500/15 text-red-300 border border-red-500/30'
                            }`}>
                              {isTransfer ? 'طلب نقل قطاع ⇄' : 'طلب فصل / إنهاء خدمة 🛑'}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isRejected
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="pt-2 space-y-1.5">
                          {isTransfer && (
                            <div className="flex items-center gap-2 text-slate-300">
                              <span className="text-slate-400">مسار النقل:</span>
                              <span className="text-white font-bold">{req.currentSectorName}</span>
                              <span className="text-amber-400 font-black">➔</span>
                              <span className="text-amber-300 font-bold">{req.targetSectorName}</span>
                            </div>
                          )}

                          <div className="text-slate-300">
                            <span className="text-slate-400">السبب المكتوب: </span>
                            <span className="text-slate-200">{req.reason}</span>
                          </div>

                          {/* Approval Details (New Rank & Protocol) */}
                          {isApproved && isTransfer && req.assignedNewRank && (
                            <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>تم اعتمادك ونقلك بنجاح إلى قطاع {req.targetSectorName}!</span>
                              </div>
                              <div className="text-[11px] text-slate-200 flex flex-wrap gap-2">
                                <span>الرتبة الجديدة: <b className="text-white">{req.assignedNewRank}</b></span>
                                {req.assignedNewProtocol && (
                                  <span>البروتوكول الجديد: <b className="text-amber-300 font-mono">[{req.assignedNewProtocol}]</b></span>
                                )}
                                {req.assignedNewUnit && (
                                  <span>اليونت: <b className="text-slate-200 font-mono">{req.assignedNewUnit}</b></span>
                                )}
                              </div>
                            </div>
                          )}

                          {req.reviewerNotes && (
                            <div className="text-[11px] text-slate-400 pt-1">
                              ملاحظات القيادة: {req.reviewerNotes} ({req.reviewedBy || 'المسؤول'})
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}

        {/* Footer */}
        <div className="p-4 sm:px-7 border-t border-white/10 bg-[#090b10] flex items-center justify-between text-xs text-slate-400">
          <span>المنظومة المركزية لشؤون الأفراد والخدمة العسكرية</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
