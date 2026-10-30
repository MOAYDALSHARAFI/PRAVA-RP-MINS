import React, { useState, useEffect } from 'react';
import { 
  Shield, X, ArrowLeftRight, UserX, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, Award, Zap, FileText, Send, 
  Smartphone, User, Check, RefreshCw
} from 'lucide-react';
import { Sector, UserAccount, PersonnelRequest, MilitaryRank, Application } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { apiUrl, safeFetchJson } from '../utils/api.ts';

interface MilitaryDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  sectors: Sector[];
  onRefreshData?: () => void;
  showToast?: (msg: string) => void;
}

export const MilitaryDossierModal: React.FC<MilitaryDossierModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sectors,
  onRefreshData,
  showToast,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'transfer' | 'discharge' | 'requests'>('profile');
  
  // Soldier military record info
  const [soldierApp, setSoldierApp] = useState<Application | null>(null);
  const [requests, setRequests] = useState<PersonnelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Transfer Form State
  const [targetSectorId, setTargetSectorId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Discharge Form State
  const [dischargeReason, setDischargeReason] = useState<string>('');
  const [confirmDischarge, setConfirmDischarge] = useState(false);
  const [isSubmittingDischarge, setIsSubmittingDischarge] = useState(false);

  // Error / Success message
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load soldier's application and personnel requests
  const loadSoldierData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user's application
      const apps = await safeFetchJson<Application[]>('/api/applications');
      if (Array.isArray(apps)) {
        const found = apps.find(
          (a) =>
            (currentUser.gameId && a.gameId === currentUser.gameId) ||
            a.playerName.toLowerCase() === currentUser.username.toLowerCase() ||
            a.fullName.toLowerCase() === currentUser.username.toLowerCase() ||
            (currentUser.displayName && a.playerName.toLowerCase() === currentUser.displayName.toLowerCase())
        );
        if (found) {
          setSoldierApp(found);
        }
      }

      // 2. Fetch user's personnel requests
      const reqs = await safeFetchJson<PersonnelRequest[]>(
        `/api/personnel-requests?username=${encodeURIComponent(currentUser.username)}`
      );
      if (Array.isArray(reqs)) {
        setRequests(reqs);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSoldierData();
      setFormMsg(null);
      setTransferReason('');
      setDischargeReason('');
      setConfirmDischarge(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Derive current military details
  const currentSectorId = soldierApp?.sectorId || currentUser.activeSectorId || 'swat';
  const currentSectorObj = sectors.find((s) => s.id === currentSectorId) || sectors[0];
  const currentSectorName = soldierApp?.sectorName || currentSectorObj?.name || 'قوات الطوارئ الخاصة (SWAT)';
  const currentRank = soldierApp?.rank || currentUser.activeRank || (currentUser.role === 'owner' ? 'القيادة العامة' : 'جندي أول');
  const currentProtocol = soldierApp?.rankProtocol || currentUser.activeRankProtocol || (currentRank.includes('ملازم') || currentRank.includes('نقيب') ? 'I-2' : 'M-2');
  const currentUnit = soldierApp?.currentUnit || currentUser.activeUnit || `${currentSectorObj?.unitPrefix || 'SWAT'}-01`;
  const isDischarged = soldierApp?.serviceStatus === 'discharged' || currentUser.serviceStatus === 'discharged';

  // Available sectors for transfer (exclude current sector)
  const availableTargetSectors = sectors.filter((s) => s.id !== currentSectorId);

  // Submit Transfer Request
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSectorId) {
      setFormMsg({ type: 'error', text: 'يرجى اختيار القطاع المراد النقل إليه' });
      return;
    }
    if (!transferReason.trim()) {
      setFormMsg({ type: 'error', text: 'يرجى كتابة سبب طلب النقل' });
      return;
    }

    setIsSubmittingTransfer(true);
    setFormMsg(null);

    const targetSec = sectors.find((s) => s.id === targetSectorId);

    try {
      const res = await fetch(apiUrl('/api/personnel-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'transfer',
          applicantUsername: currentUser.username,
          applicantDisplayName: currentUser.displayName,
          applicantGameId: currentUser.gameId || soldierApp?.gameId || '',
          applicantDiscord: currentUser.discordUsername || soldierApp?.discordId || '',
          currentSectorId,
          currentSectorName,
          currentRank,
          currentProtocol,
          currentUnit,
          targetSectorId,
          targetSectorName: targetSec?.name || targetSectorId,
          reason: transferReason.trim(),
        }),
      });

      if (res.ok) {
        setFormMsg({ 
          type: 'success', 
          text: `تم رفع طلب النقل إلى قطاع (${targetSec?.name}) بنجاح! سينتقل ملفك إلى قيادة القطاع الجديد للموافقة وتعيين الرتبة والبروتوكول الجديد.` 
        });
        setTransferReason('');
        loadSoldierData();
        if (showToast) showToast('تم إرسال طلب النقل للقيادة بنجاح 📋');
        setTimeout(() => setActiveTab('requests'), 1500);
      } else {
        const err = await res.json();
        setFormMsg({ type: 'error', text: err.error || 'فشل إرسال طلب النقل' });
      }
    } catch {
      setFormMsg({ type: 'error', text: 'خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً' });
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Submit Discharge Request
  const handleSubmitDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeReason.trim()) {
      setFormMsg({ type: 'error', text: 'يرجى كتابة سبب طلب الفصل / إنهاء الخدمة' });
      return;
    }
    if (!confirmDischarge) {
      setFormMsg({ type: 'error', text: 'يرجى تأكيد رغبتك في إنهاء الخدمة العسكرية' });
      return;
    }

    setIsSubmittingDischarge(true);
    setFormMsg(null);

    try {
      const res = await fetch(apiUrl('/api/personnel-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'discharge',
          applicantUsername: currentUser.username,
          applicantDisplayName: currentUser.displayName,
          applicantGameId: currentUser.gameId || soldierApp?.gameId || '',
          applicantDiscord: currentUser.discordUsername || soldierApp?.discordId || '',
          currentSectorId,
          currentSectorName,
          currentRank,
          currentProtocol,
          currentUnit,
          reason: dischargeReason.trim(),
        }),
      });

      if (res.ok) {
        setFormMsg({ 
          type: 'success', 
          text: 'تم رفع طلب الفصل وإنهاء الخدمة بنجاح، وهو الآن بانتظار مراجعة واعتماد القيادة.' 
        });
        setDischargeReason('');
        loadSoldierData();
        if (showToast) showToast('تم رفع طلب إنهاء الخدمة بنجاح ⚠️');
        setTimeout(() => setActiveTab('requests'), 1500);
      } else {
        const err = await res.json();
        setFormMsg({ type: 'error', text: err.error || 'فشل إرسال طلب الفصل' });
      }
    } catch {
      setFormMsg({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    } finally {
      setIsSubmittingDischarge(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center sm:text-right"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-[#0d1017] border border-amber-500/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-7 shadow-2xl text-right max-h-[92vh] sm:max-h-[90vh] overflow-y-auto my-0 sm:my-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pl-10 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                الملف العسكري والخدمات الذاتية
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {isDischarged ? 'منتهي الخدمة' : 'على رأس العمل 🟢'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              بياناتك الميدانية، بروتوكول الرتبة، وتقديم طلبات النقل والفصل
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-5 border border-white/10 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setFormMsg(null); }}
            className={`flex-1 min-w-[90px] py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? `${theme.buttonClass} shadow-md`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>بياناتي والرتبة</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('transfer'); setFormMsg(null); }}
            className={`flex-1 min-w-[90px] py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'transfer'
                ? `${theme.buttonClass} shadow-md`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>طلب نقل قطاع</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('discharge'); setFormMsg(null); }}
            className={`flex-1 min-w-[90px] py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'discharge'
                ? 'bg-red-500/30 text-red-200 border border-red-500/50 shadow-md'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>طلب فصل</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('requests'); setFormMsg(null); }}
            className={`flex-1 min-w-[90px] py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'requests'
                ? `${theme.buttonClass} shadow-md`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>الطلبات ({requests.length})</span>
            {requests.some((r) => r.status === 'قيد المراجعة') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 left-1.5" />
            )}
          </button>
        </div>

        {/* Global Feedback Message */}
        {formMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold mb-4 animate-in fade-in ${
            formMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}>
            {formMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{formMsg.text}</span>
          </div>
        )}

        {/* 1. TAB: PROFILE / MILITARY DOSSIER */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            
            {/* Tactical Military ID Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121622] via-[#0d1017] to-black border border-amber-500/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs text-amber-400 font-bold">MILITARY DOSSIER // PRAVA</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                  {currentUser.roleTitle}
                </span>
              </div>

              {/* Soldier Header Info */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xl shadow-lg shrink-0">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{currentUser.displayName}</h4>
                  <div className="text-xs text-amber-400 font-mono mt-0.5">
                    @{currentUser.username} {currentUser.gameId ? `· ID: ${currentUser.gameId}` : ''}
                  </div>
                  {currentUser.discordUsername && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      Discord: {currentUser.discordUsername}
                    </div>
                  )}
                </div>
              </div>

              {/* Military Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-right">
                
                {/* Sector */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-0.5">القطاع العسكري</span>
                  <span className="text-xs font-bold text-white block truncate">{currentSectorName}</span>
                </div>

                {/* Military Rank */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-0.5">الرتبة العسكرية</span>
                  <span className="text-xs font-black text-amber-300 block flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentRank}</span>
                  </span>
                </div>

                {/* Protocol Prefix (M-1, M-2, I-2, etc.) */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 font-bold block mb-0.5">بادئة البروتوكول الميداني</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black font-mono text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      {currentProtocol}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {currentProtocol.startsWith('M-') ? '(أفراد/جنود)' : '(ضباط)'}
                    </span>
                  </div>
                </div>

                {/* Unit */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-0.5">رمز اليونت الميداني</span>
                  <span className="text-xs font-black font-mono text-white block">{currentUnit}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('transfer')}
                className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <span>طلب نقل لقطاع آخر</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('discharge')}
                className="py-3 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <UserX className="w-4 h-4 text-red-400" />
                <span>طلب فصل عسكري</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. TAB: TRANSFER REQUEST (طلب نقل قطاع) */}
        {activeTab === 'transfer' && (
          <form onSubmit={handleSubmitTransfer} className="space-y-4 text-right">
            
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              💡 <strong>نظام النقل بين القطاعات:</strong> عند موافقة قيادة القطاع المنقول إليه على طلبك، سيتم سحب رتبتك الحالية وتعيين رتبتك الجديدة مع بروتوكول البادئة الخاص بالقطاع الجديد ونقل ملفك بالكامل.
            </div>

            {/* Current vs Target */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-slate-400">قطاعك الحالي:</span>
                <span className="font-bold text-white">{currentSectorName} ({currentProtocol})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">رتبتك الحالية:</span>
                <span className="font-bold text-amber-300">{currentRank}</span>
              </div>
            </div>

            {/* Target Sector Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>اختر القطاع المراد النقل إليه</span>
                <span className="text-amber-400">*</span>
              </label>
              <select
                required
                value={targetSectorId}
                onChange={(e) => setTargetSectorId(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-[#080a0f] border border-white/15 text-white focus:outline-none focus:border-amber-400 text-base sm:text-sm font-bold"
              >
                <option value="">-- اضغط لاختيار القطاع المستهدف --</option>
                {availableTargetSectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.arabicName}) - بادئة: {s.unitPrefix || 'UNIT'}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>سبب طلب النقل والمبررات</span>
                <span className="text-amber-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="اكتب أسباب رغبتك في النقل إلى هذا القطاع..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmittingTransfer}
              className={`w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow-lg flex items-center justify-center gap-2`}
            >
              {isSubmittingTransfer ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>رفع طلب النقل لقيادة القطاع الجديد</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. TAB: DISCHARGE REQUEST (طلب فصل عسكري) */}
        {activeTab === 'discharge' && (
          <form onSubmit={handleSubmitDischarge} className="space-y-4 text-right">
            
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 leading-relaxed">
              ⚠️ <strong>تنبيه إنهاء الخدمة العسكرية:</strong> هذا الإجراء رسمي لطلب الفصل أو الاستقالة من الخدمة العسكرية في قطاع {currentSectorName}. بعد الموافقة، سيتم إلغاء رتبتك وسحب صلاحياتك الميدانية.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-400" />
                <span>سبب طلب الفصل / الاستقالة</span>
                <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={dischargeReason}
                onChange={(e) => setDischargeReason(e.target.value)}
                placeholder="اكتب سبب طلب إنهاء الخدمة أو الاستقالة..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 text-base sm:text-sm"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={confirmDischarge}
                onChange={(e) => setConfirmDischarge(e.target.checked)}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-400 accent-red-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-red-300">
                أقر برغبتي الأكيدة في إنهاء خدمتي العسكرية في هذا القطاع
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmittingDischarge}
              className="w-full py-3.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmittingDischarge ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4" />
                  <span>تأكيد وإرسال طلب الفصل للقيادة</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 4. TAB: REQUESTS HISTORY (سجل الطلبات السابقة) */}
        {activeTab === 'requests' && (
          <div className="space-y-3 text-right">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">جاري تحميل طلباتك...</div>
            ) : requests.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p>لا توجد طلبات نقل أو فصل مسجلة لك حالياً</p>
              </div>
            ) : (
              requests.map((r) => {
                const isTransfer = r.type === 'transfer';
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          isTransfer ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {isTransfer ? '🔄 طلب نقل قطاع' : '⚠️ طلب فصل عسكري'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(r.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'مقبول'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : r.status === 'مرفوض'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    {isTransfer ? (
                      <div className="space-y-1">
                        <div className="text-slate-300">
                          من: <span className="font-bold text-white">{r.currentSectorName}</span> ➔ إلى: <span className="font-bold text-amber-300">{r.targetSectorName}</span>
                        </div>
                        {r.status === 'مقبول' && r.assignedNewRank && (
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                            ✅ تم النقل وتعيين الرتبة الجديدة ({r.assignedNewRank}) بالبروتوكول الجديد ({r.assignedNewProtocol || 'M-1'}) واليونت ({r.assignedNewUnit || 'UNIT'})
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-300">
                        طلب إنهاء الخدمة من قطاع: <span className="font-bold text-white">{r.currentSectorName}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">
                      السبب: <span className="text-slate-200">{r.reason}</span>
                    </div>

                    {r.reviewerNotes && (
                      <div className="text-[10px] text-amber-300/90 pt-1 border-t border-white/5">
                        ملاحظة القيادة ({r.reviewedBy || 'المسؤول'}): {r.reviewerNotes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};
