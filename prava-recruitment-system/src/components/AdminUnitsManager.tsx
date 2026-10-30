import React, { useState, useMemo } from 'react';
import {
  Shield,
  Layers,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  User,
  Hash,
  Award,
  Sparkles,
  ExternalLink,
  Copy,
  Clock,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Info,
  Calendar,
  Gamepad2,
  MessageSquare,
  FileText,
  Eye,
  Download,
  Share2,
} from 'lucide-react';
import { Sector, Application, MilitaryRank, UnitRule, ServerSettings, UserAccount } from '../types.ts';
import { DEFAULT_UNIT_RULES } from '../data/defaultData.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { SmartBadge, getSafeBadgeEmoji } from './SmartBadge.tsx';
import { apiUrl } from '../utils/api.ts';

interface AdminUnitsManagerProps {
  unitRules: UnitRule[];
  onUpdateUnitRules: (updatedRules: UnitRule[]) => void;
  applications: Application[];
  onUpdateApplication?: (updatedApp: Application) => void;
  sectors: Sector[];
  ranks: MilitaryRank[];
  currentUser: UserAccount;
  onOpenAppDetail?: (app: Application) => void;
}

export const AdminUnitsManager: React.FC<AdminUnitsManagerProps> = ({
  unitRules = [],
  onUpdateUnitRules,
  applications = [],
  onUpdateApplication,
  sectors = [],
  ranks = [],
  currentUser,
  onOpenAppDetail,
}) => {
  const { theme } = useTheme();

  // Sub-tab: 'manifest' (كشف العساكر واليونتات) vs 'rules' (إدارة قواعد ونطاقات اليونتات)
  const [subTab, setSubTab] = useState<'manifest' | 'rules'>('manifest');

  // Dedicated Sector Screen State: null for overview hub, or specific sectorId ('swat', 'public_security', etc.)
  const [selectedSectorScreen, setSelectedSectorScreen] = useState<string | null>(null);

  // Filters for Manifest
  const [manifestSectorFilter, setManifestSectorFilter] = useState<string>('all');
  const [manifestRankFilter, setManifestRankFilter] = useState<string>('all');
  const [manifestStatusFilter, setManifestStatusFilter] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters for Unit Rules Table
  const [rulesSectorFilter, setRulesSectorFilter] = useState<string>('all');
  const [rulesSearchQuery, setRulesSearchQuery] = useState('');
  const [showSharedRulesInSector, setShowSharedRulesInSector] = useState(false);

  // In-app Delete & Restore Defaults modals (Never window.confirm)
  const [ruleToDelete, setRuleToDelete] = useState<UnitRule | null>(null);
  const [isDeletingRule, setIsDeletingRule] = useState(false);
  const [showRestoreRulesModal, setShowRestoreRulesModal] = useState(false);
  const [isRestoringRules, setIsRestoringRules] = useState(false);

  // Active Sector Object when in dedicated sector screen
  const activeSectorObj = useMemo(() => {
    return sectors.find((s) => s.id === selectedSectorScreen);
  }, [sectors, selectedSectorScreen]);

  // Selected Employee Modal for full details ('و اضغط عليه يفك لي معلوماته')
  const [selectedPersonnel, setSelectedPersonnel] = useState<{
    unitCode: string;
    rule: UnitRule;
    app?: Application;
    rankName: string;
    sectorName: string;
    isOccupied: boolean;
  } | null>(null);

  // Edit / Add Unit Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFormData, setRuleFormData] = useState<Partial<UnitRule>>({
    sectorId: 'all',
    rankName: 'جندي',
    prefix: 'M-',
    rangeStart: 1,
    rangeEnd: 34,
    description: '',
    badge: '🎖️',
  });

  // Edit Unit on a specific personnel modal
  const [editingUnitForApp, setEditingUnitForApp] = useState<Application | null>(null);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [hasCopiedText, setHasCopiedText] = useState(false);

  // Active unit rules with fallback
  const activeRules = useMemo(() => {
    return unitRules && unitRules.length > 0 ? unitRules : DEFAULT_UNIT_RULES;
  }, [unitRules]);

  // Map of accepted applicants indexed by assigned unit code (trimmed & upper/lower agnostic)
  const occupiedUnitsMap = useMemo(() => {
    const map = new Map<string, Application>();

    // We prioritize accepted applications or active personnel
    applications.forEach((app) => {
      // Clean candidate unit string: check currentUnit, rankProtocol, or militaryNo
      const u = (app.currentUnit || '').trim();
      if (u) {
        map.set(u.toLowerCase(), app);
      }
      // Also check if rankProtocol is specific (e.g. M-1)
      if (app.rankProtocol && !map.has(app.rankProtocol.trim().toLowerCase())) {
        map.set(app.rankProtocol.trim().toLowerCase(), app);
      }
    });

    return map;
  }, [applications]);

  // Generate all slotted units across active rules
  const manifestSlots = useMemo(() => {
    const slots: Array<{
      unitCode: string;
      unitNumber: number;
      rule: UnitRule;
      app?: Application;
      rankName: string;
      sectorName: string;
      isOccupied: boolean;
      sectorId: string;
    }> = [];

    activeRules.forEach((rule) => {
      const start = Math.max(1, rule.rangeStart || 1);
      const end = Math.max(start, rule.rangeEnd || start);
      const prefix = rule.prefix || 'M-';

      const matchedSector = sectors.find((s) => s.id === rule.sectorId);
      const sectorName = rule.sectorId === 'all' ? 'كافة القطاعات' : (matchedSector?.arabicName || matchedSector?.name || rule.sectorId);

      for (let num = start; num <= end; num++) {
        const unitCode = `${prefix}${num}`;
        const key = unitCode.toLowerCase();
        
        // Also check with leading zero format just in case (e.g. M-01)
        const paddedCode = `${prefix}${String(num).padStart(2, '0')}`;
        const app = occupiedUnitsMap.get(key) || occupiedUnitsMap.get(paddedCode.toLowerCase());

        slots.push({
          unitCode,
          unitNumber: num,
          rule,
          app,
          rankName: rule.rankName,
          sectorName,
          isOccupied: !!app,
          sectorId: rule.sectorId,
        });
      }
    });

    return slots;
  }, [activeRules, sectors, occupiedUnitsMap]);

  // Filtered manifest slots
  const filteredSlots = useMemo(() => {
    const effectiveSector = selectedSectorScreen || manifestSectorFilter;

    return manifestSlots.filter((slot) => {
      // Sector filter
      if (effectiveSector !== 'all') {
        if (slot.sectorId !== 'all' && slot.sectorId !== effectiveSector) {
          return false;
        }
        if (slot.app && slot.app.sectorId && slot.app.sectorId !== effectiveSector) {
          return false;
        }
      }

      // Rank filter
      if (manifestRankFilter !== 'all') {
        if (slot.rankName !== manifestRankFilter) return false;
      }

      // Status filter
      if (manifestStatusFilter === 'occupied' && !slot.isOccupied) return false;
      if (manifestStatusFilter === 'vacant' && slot.isOccupied) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const codeMatch = slot.unitCode.toLowerCase().includes(q);
        const rankMatch = slot.rankName.toLowerCase().includes(q);
        const nameMatch = slot.app?.fullName?.toLowerCase().includes(q) || slot.app?.playerName?.toLowerCase().includes(q);
        const gameIdMatch = slot.app?.gameId?.toLowerCase().includes(q);
        const milNoMatch = slot.app?.militaryNo?.toLowerCase().includes(q);
        const discordMatch = slot.app?.discordId?.toLowerCase().includes(q);

        if (!codeMatch && !rankMatch && !nameMatch && !gameIdMatch && !milNoMatch && !discordMatch) {
          return false;
        }
      }

      return true;
    });
  }, [manifestSlots, selectedSectorScreen, manifestSectorFilter, manifestRankFilter, manifestStatusFilter, searchQuery]);

  // Rules filtered by selected sector screen, dropdown filter, and search query
  const displayedRules = useMemo(() => {
    return activeRules.filter((r) => {
      // 1. Sector filter
      if (selectedSectorScreen) {
        if (rulesSectorFilter === 'all') {
          // If viewing all within this sector screen:
          // Show rules belonging to this sector; or if toggle enabled, also show shared ('all')
          if (r.sectorId !== selectedSectorScreen) {
            if (!showSharedRulesInSector || r.sectorId !== 'all') {
              return false;
            }
          }
        } else if (rulesSectorFilter === 'all_shared') {
          if (r.sectorId !== 'all') return false;
        } else {
          if (r.sectorId !== rulesSectorFilter) return false;
        }
      } else {
        // General Hub Screen
        if (rulesSectorFilter === 'all_shared') {
          if (r.sectorId !== 'all') return false;
        } else if (rulesSectorFilter !== 'all') {
          if (r.sectorId !== rulesSectorFilter) return false;
        }
      }

      // 2. Search query filter
      if (rulesSearchQuery.trim()) {
        const q = rulesSearchQuery.trim().toLowerCase();
        const matchesRank = (r.rankName || '').toLowerCase().includes(q);
        const matchesPrefix = (r.prefix || '').toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchesRank && !matchesPrefix && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [activeRules, selectedSectorScreen, rulesSectorFilter, showSharedRulesInSector, rulesSearchQuery]);

  // Stats calculation
  const totalSlotsCount = manifestSlots.length;
  const totalOccupiedCount = manifestSlots.filter((s) => s.isOccupied).length;
  const totalVacantCount = totalSlotsCount - totalOccupiedCount;
  const occupancyRate = totalSlotsCount > 0 ? Math.round((totalOccupiedCount / totalSlotsCount) * 100) : 0;

  // Dedicated Sector Stats when viewing a specific sector screen
  const currentSectorStats = useMemo(() => {
    if (!selectedSectorScreen) {
      return {
        total: totalSlotsCount,
        occupied: totalOccupiedCount,
        vacant: totalVacantCount,
        rate: occupancyRate,
      };
    }
    const secSlots = manifestSlots.filter(
      (s) => s.sectorId === selectedSectorScreen || (s.sectorId === 'all' && (!s.app || s.app.sectorId === selectedSectorScreen))
    );
    const secOccupied = secSlots.filter((s) => s.isOccupied).length;
    const secVacant = secSlots.length - secOccupied;
    const secRate = secSlots.length > 0 ? Math.round((secOccupied / secSlots.length) * 100) : 0;
    return {
      total: secSlots.length,
      occupied: secOccupied,
      vacant: secVacant,
      rate: secRate,
    };
  }, [manifestSlots, selectedSectorScreen, totalSlotsCount, totalOccupiedCount, totalVacantCount, occupancyRate]);

  // Open Add Rule Dialog
  const handleOpenAddRule = (customSectorId?: string) => {
    const secId = customSectorId || selectedSectorScreen || 'all';
    const targetSec = sectors.find((s) => s.id === secId);
    setEditingRuleId(null);
    setRuleFormData({
      sectorId: secId,
      rankName: ranks[0]?.name || 'جندي',
      prefix: targetSec?.unitPrefix ? `${targetSec.unitPrefix}-` : 'M-',
      rangeStart: 1,
      rangeEnd: 34,
      description: '',
      badge: ranks[0]?.badge || '🎖️',
    });
    setIsRuleModalOpen(true);
  };

  // Open Edit Rule Dialog
  const handleOpenEditRule = (rule: UnitRule) => {
    setEditingRuleId(rule.id);
    setRuleFormData({
      sectorId: rule.sectorId || 'all',
      rankName: rule.rankName || 'جندي',
      prefix: rule.prefix || 'M-',
      rangeStart: rule.rangeStart || 1,
      rangeEnd: rule.rangeEnd || 34,
      description: rule.description || '',
      badge: rule.badge || '🎖️',
    });
    setIsRuleModalOpen(true);
  };

  // Save Rule (Add or Edit) with backend synchronization
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const rankObj = ranks.find((r) => r.name === ruleFormData.rankName);

    const newRule: UnitRule = {
      id: editingRuleId || `ur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sectorId: ruleFormData.sectorId || 'all',
      rankName: ruleFormData.rankName || 'جندي',
      rankId: rankObj?.id,
      prefix: (ruleFormData.prefix || 'M-').trim(),
      rangeStart: Number(ruleFormData.rangeStart) || 1,
      rangeEnd: Number(ruleFormData.rangeEnd) || 34,
      description: ruleFormData.description || '',
      badge: ruleFormData.badge || rankObj?.badge || '🎖️',
    };

    let updatedList: UnitRule[] = [];
    if (editingRuleId) {
      updatedList = activeRules.map((r) => (r.id === editingRuleId ? newRule : r));
    } else {
      updatedList = [...activeRules, newRule];
    }

    // Optimistic UI update
    onUpdateUnitRules(updatedList);
    setIsRuleModalOpen(false);

    try {
      const res = await fetch(apiUrl('/api/unit-rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.unitRules)) {
          onUpdateUnitRules(data.unitRules);
        }
      }
      setSaveSuccessMsg(editingRuleId ? 'تم تحديث نطاق وقاعدة اليونت بنجاح!' : 'تم إضافة نطاق اليونتات الجديد بنجاح!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Failed to save rule on backend', err);
      setSaveSuccessMsg('تم حفظ قاعدة اليونتات بنجاح!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Confirm Delete Rule without native window.confirm
  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    setIsDeletingRule(true);
    const targetId = ruleToDelete.id;
    const updated = activeRules.filter((r) => r.id !== targetId);

    // Optimistic UI update
    onUpdateUnitRules(updated);

    try {
      const res = await fetch(apiUrl(`/api/unit-rules/${targetId}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.unitRules)) {
          onUpdateUnitRules(data.unitRules);
        }
      }
      setSaveSuccessMsg(`تم حذف نطاق اليونت (${ruleToDelete.prefix}${ruleToDelete.rangeStart} ➔ ${ruleToDelete.prefix}${ruleToDelete.rangeEnd}) بنجاح.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Failed to delete rule on backend', err);
      setSaveSuccessMsg('تم حذف نطاق اليونت محلياً بنجاح.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsDeletingRule(false);
      setRuleToDelete(null);
    }
  };

  // Confirm Restore Default Rules without native window.confirm
  const handleConfirmRestoreDefaults = async () => {
    setIsRestoringRules(true);
    // Optimistic UI update
    onUpdateUnitRules(DEFAULT_UNIT_RULES);

    try {
      const res = await fetch(apiUrl('/api/unit-rules/restore-defaults'), {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.unitRules)) {
          onUpdateUnitRules(data.unitRules);
        }
      }
      setSaveSuccessMsg('تمت استعادة نطاقات وقواعد اليونتات الموصى بها بنجاح لكافة القطاعات!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.warn('Failed to restore rules on backend', err);
      setSaveSuccessMsg('تمت استعادة النطاقات الافتراضية بنجاح!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } finally {
      setIsRestoringRules(false);
      setShowRestoreRulesModal(false);
    }
  };

  // Quick Preset Helper for Prefix & Range
  const handleApplyPreset = (preset: { rankName: string; prefix: string; start: number; end: number; badge: string }) => {
    setRuleFormData((prev) => ({
      ...prev,
      rankName: preset.rankName,
      prefix: preset.prefix,
      rangeStart: preset.start,
      rangeEnd: preset.end,
      badge: preset.badge,
    }));
  };

  // Copy Personnel Summary Card Text
  const handleCopyPersonnelInfo = (slot: typeof selectedPersonnel) => {
    if (!slot || !slot.app) return;
    const text = `🎖️ **[بيانات العسكري المعتمد]**
🔰 **رمز اليونت:** ${slot.unitCode}
🎖️ **الرتبة العسكرية:** ${slot.rankName}
🏢 **القطاع:** ${slot.app.sectorName || slot.sectorName}
👤 **الاسم داخل اللعبة:** ${slot.app.playerName}
📝 **الاسم الكامل:** ${slot.app.fullName}
🆔 **الآيدي في اللعبة:** ${slot.app.gameId || 'غير محدد'}
🎖️ **الرقم العسكري:** ${slot.app.militaryNo || 'غير محدد'}
💬 **الديسكورد:** <@${slot.app.discordId}>
👮‍♂️ **ضابط القبول:** ${slot.app.acceptanceOfficer || 'القيادة'}
📅 **تاريخ القبول:** ${slot.app.createdAt ? new Date(slot.app.createdAt).toLocaleDateString('ar-SA') : 'معتمد'}`;

    navigator.clipboard.writeText(text);
    setHasCopiedText(true);
    setTimeout(() => setHasCopiedText(false), 2500);
  };

  // Save manual unit update on an application
  const handleSaveAppUnit = async () => {
    if (!editingUnitForApp || !newUnitInput.trim()) return;
    const updated = {
      ...editingUnitForApp,
      currentUnit: newUnitInput.trim(),
      rankProtocol: newUnitInput.trim(),
    };

    if (onUpdateApplication) {
      onUpdateApplication(updated);
    }

    try {
      await fetch(`/api/applications/${editingUnitForApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // ignore
    }

    setEditingUnitForApp(null);
    setSaveSuccessMsg(`تم تحديث يونت العسكري (${updated.fullName}) إلى: ${newUnitInput.trim()}`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-36 sm:pb-44" dir="rtl">
      
      {/* Global Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTOR INDEPENDENT SCREENS HUB vs DEDICATED SECTOR VIEW       */}
      {/* ============================================================== */}
      {selectedSectorScreen ? (
        /* DEDICATED SECTOR VIEW: Independent isolated screen for the chosen sector */
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-950/40 via-[#0e131d] to-[#090b10] border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-amber-500/20 border-b">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/60 border-2 border-amber-500/40 p-1 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
                  <SmartBadge
                    badge={activeSectorObj?.badge}
                    defaultIcon="sector"
                    className="w-full h-full object-contain"
                    imgClassName="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-black">
                      شاشة القطاع المستقلة
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      بادئة اليونت: <strong className="text-amber-400 font-bold">{activeSectorObj?.unitPrefix || 'SWAT'}-</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeSectorObj?.isOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {activeSectorObj?.isOpen ? 'متاح للتقديم' : 'مغلق'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1 truncate">
                    إدارة وتوزيع يونتات: {activeSectorObj?.arabicName || activeSectorObj?.name}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSectorScreen(null);
                    setManifestSectorFilter('all');
                    setRulesSectorFilter('all');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                  title="العودة لشاشات كافة القطاعات"
                >
                  <span>العودة لكافة القطاعات</span>
                  <span>↩</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddRule(selectedSectorScreen)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة نطاق يونت لهذا القطاع</span>
                </button>
              </div>
            </div>

            {/* Quick Sector Switcher Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <span className="text-slate-400 font-bold shrink-0 ml-1">تبديل شاشة القطاع:</span>
              {sectors.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSectorScreen(s.id);
                    setManifestSectorFilter(s.id);
                    setRulesSectorFilter(s.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedSectorScreen === s.id
                      ? 'bg-amber-500 text-black font-black shadow-sm ring-1 ring-amber-300'
                      : 'bg-black/50 hover:bg-white/10 text-slate-300 border border-white/5'
                  }`}
                >
                  <SmartBadge badge={s.badge} defaultIcon="sector" className="w-4 h-4 rounded object-contain shrink-0" />
                  <span>{s.arabicName || s.name}</span>
                </button>
              ))}
            </div>

            {/* Sector Specific KPI Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-amber-500/15 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-slate-400 text-[11px] font-bold">سعة يونتات {activeSectorObj?.arabicName || 'القطاع'}</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{currentSectorStats.total} يونت</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>العساكر المأهولون بالقطاع</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">{currentSectorStats.occupied} عسكري</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-blue-400 text-[11px] font-bold">اليونتات الشاغرة المتاحة</div>
                <div className="text-xl sm:text-2xl font-black text-blue-300 font-mono mt-0.5">{currentSectorStats.vacant} شاغر</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-amber-400 text-[11px] font-bold">نسبة إشغال هذا القطاع</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">{currentSectorStats.rate}%</div>
              </div>
            </div>

            {/* Sub-tab switcher inside Sector View */}
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 self-start w-fit">
              <button
                type="button"
                onClick={() => setSubTab('manifest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'manifest'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>كشف عساكر {activeSectorObj?.arabicName || 'القطاع'} ({currentSectorStats.occupied})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('rules')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'rules'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>نطاقات وقواعد {activeSectorObj?.arabicName || 'القطاع'} ({displayedRules.length})</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* GENERAL HUB OVERVIEW */
        <>
          {/* Header Banner */}
          <div className="bg-[#090b10] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>إدارة اليونتات والكشف العسكري الميداني</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Unit Manifest System
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    توزيع نطاقات وبادئات اليونتات لكل رتبة وقطاع، مع استعراض كشف الموظفين مرتبين تفصيلياً حسب اليونت
                  </p>
                </div>
              </div>

              {/* Sub-tab Switcher Buttons */}
              <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSubTab('manifest')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    subTab === 'manifest'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>كشف اليونتات والعساكر 🎖️ ({totalOccupiedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTab('rules')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    subTab === 'rules'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>إعداد وتوزيع النطاقات ⚙️ ({activeRules.length})</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 relative z-10 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-slate-400 text-[11px] font-bold">إجمالي سعة اليونتات</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{totalSlotsCount} يونت</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>اليونتات المأهولة (الموظفين)</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">{totalOccupiedCount} موظف</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-blue-400 text-[11px] font-bold">اليونتات الشاغرة المتاحة</div>
                <div className="text-xl sm:text-2xl font-black text-blue-300 font-mono mt-0.5">{totalVacantCount} شاغر</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-amber-400 text-[11px] font-bold">نسبة الإشغال العام</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">{occupancyRate}%</div>
              </div>
            </div>
          </div>
      ) : (
        /* SECTOR INDEPENDENT SCREENS HUB / PORTALS */
        <div className="bg-[#090b10] border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="font-black text-white text-base">
                  شاشات القطاعات المستقلة (اختر قطاعاً لإدارته بشاشة مخصصة)
                </h4>
                <p className="text-xs text-slate-400">
                  فصل كل قطاع بشاشة مستقلة خاصة به لتعديل يونتاته، ورتبه، واستعراض كشف عساكره الميداني
                </p>
              </div>
            </div>
            <span className="text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
              {sectors.length} شاشات قطاعات
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sectors.map((sec) => {
              const secOccupied = applications.filter(
                (a) => a.sectorId === sec.id && (a.status === 'مقبول' || a.serviceStatus === 'active')
              ).length;

              return (
                <div
                  key={sec.id}
                  onClick={() => {
                    setSelectedSectorScreen(sec.id);
                    setManifestSectorFilter(sec.id);
                    setRulesSectorFilter(sec.id);
                  }}
                  className="bg-black/40 hover:bg-black/70 border border-white/10 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between gap-3 shadow-lg hover:shadow-amber-500/15"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <SmartBadge
                        badge={sec.badge}
                        defaultIcon="sector"
                        className="w-10 h-10 rounded-xl object-cover shrink-0 group-hover:scale-110 transition-transform"
                      />
                      <div>
                        <h5 className="font-black text-white text-sm group-hover:text-amber-300 transition-colors">
                          {sec.arabicName || sec.name}
                        </h5>
                        <span className="text-[11px] text-slate-400 font-mono">{sec.name}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sec.isOpen
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {sec.isOpen ? 'متاح للتقديم' : 'مغلق'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/60 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-slate-400 block text-[10px]">بادئة اليونت</span>
                      <span className="font-mono font-bold text-amber-400">{sec.unitPrefix || 'SWAT'}-</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">العساكر باليونتات</span>
                      <span className="font-mono font-bold text-emerald-400">{secOccupied} عسكري</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/15 group-hover:bg-amber-500 text-amber-300 group-hover:text-black font-black text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>دخول شاشة إدارة يونتات القطاع</span>
                    <span>➔</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 1: كشف اليونتات والعساكر (Roster Manifest)              */}
      {/* ============================================================== */}
      {subTab === 'manifest' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Filters & Search */}
          <div className="bg-[#090b10] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم اليونت (M-1)، اسم العسكري، الآيدي..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Sector Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold">القطاع:</span>
                <select
                  value={manifestSectorFilter}
                  onChange={(e) => setManifestSectorFilter(e.target.value)}
                  className="bg-black/60 border border-white/10 text-white text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">جميع القطاعات</option>
                  {sectors.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.arabicName || sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rank Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold">الرتبة:</span>
                <select
                  value={manifestRankFilter}
                  onChange={(e) => setManifestRankFilter(e.target.value)}
                  className="bg-black/60 border border-white/10 text-white text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">كافة الرتب</option>
                  {ranks.map((r) => (
                    <option key={r.id} value={r.name}>
                      {getSafeBadgeEmoji(r.badge, '🎖️')} {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setManifestStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    manifestStatusFilter === 'all' ? 'bg-amber-500 text-black font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل ({manifestSlots.length})
                </button>
                <button
                  type="button"
                  onClick={() => setManifestStatusFilter('occupied')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    manifestStatusFilter === 'occupied' ? 'bg-emerald-500 text-black font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  المأهولة فقط ({totalOccupiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setManifestStatusFilter('vacant')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    manifestStatusFilter === 'vacant' ? 'bg-blue-500 text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الشاغرة ({totalVacantCount})
                </button>
              </div>
            </div>

            {/* Quick Action: Add new Rule shortcut */}
            <button
              type="button"
              onClick={() => handleOpenAddRule(selectedSectorScreen || undefined)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة نطاق جديد</span>
            </button>
          </div>

          {/* Roster Manifest Cards Grid */}
          {filteredSlots.length === 0 ? (
            <div className="p-12 text-center bg-[#090b10] border border-white/10 rounded-2xl space-y-2">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-white font-bold text-sm">لا توجد يونتات مطابقة لمعايير البحث</div>
              <p className="text-xs text-slate-400">جرب تعديل خيارات التصفية أو مسح شريط البحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredSlots.map((slot) => {
                const isOccupied = slot.isOccupied;
                return (
                  <div
                    key={`${slot.unitCode}-${slot.sectorId}`}
                    onClick={() => setSelectedPersonnel(slot)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between gap-3 ${
                      isOccupied
                        ? 'bg-gradient-to-br from-[#0c131a] to-[#090d14] border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10'
                        : 'bg-[#090b10] border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Top Row: Unit Code Badge + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-sm tracking-wide border shadow-sm ${
                          isOccupied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}>
                          {slot.unitCode}
                        </span>
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          <SmartBadge badge={slot.rule.badge} defaultIcon="rank" className="w-3.5 h-3.5 inline-block shrink-0" />
                          <span>{slot.rankName}</span>
                        </span>
                      </div>

                      {isOccupied ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>مشغول</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                          شاغر
                        </span>
                      )}
                    </div>

                    {/* Middle: Personnel Details (if occupied) or Placeholder */}
                    {isOccupied && slot.app ? (
                      <div className="space-y-1.5 py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-white text-xs truncate">
                              {slot.app.fullName || slot.app.playerName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              @{slot.app.playerName}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-300 font-mono bg-black/40 p-2 rounded-lg border border-white/5 space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">القطاع:</span>
                            <span className="text-amber-300 font-bold truncate max-w-[140px]">
                              {slot.app.sectorName || slot.sectorName}
                            </span>
                          </div>
                          {slot.app.gameId && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">الآيدي:</span>
                              <span className="text-white font-bold">{slot.app.gameId}</span>
                            </div>
                          )}
                          {slot.app.militaryNo && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">الرقم العسكري:</span>
                              <span className="text-emerald-400 font-bold">{slot.app.militaryNo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-3 text-center space-y-1">
                        <div className="text-xs text-slate-500 font-semibold">متاح للتعيين في المنظومة</div>
                        <div className="text-[10px] text-slate-600 font-mono">
                          النطاق المخصص: {slot.rule.prefix}{slot.rule.rangeStart} - {slot.rule.prefix}{slot.rule.rangeEnd}
                        </div>
                      </div>
                    )}

                    {/* Bottom: Click CTA indicator */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 text-[10px] truncate max-w-[140px]">
                        {slot.sectorName}
                      </span>
                      <span className="text-amber-400 group-hover:text-amber-300 font-bold flex items-center gap-1 text-[10px]">
                        <span>عرض التفاصيل</span>
                        <Eye className="w-3 h-3" />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: إدارة وتوزيع نطاقات اليونتات (Unit Rules Management)   */}
      {/* ============================================================== */}
      {subTab === 'rules' && (
        <div className="bg-[#090b10] border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-0">
          
          {/* Top Bar: Title & Primary Actions */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0f16]">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>قواعد وبادئات ونطاقات الأرقام العسكرية لليونتات</span>
                </h4>
                {selectedSectorScreen && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                    قطاع: {activeSectorObj?.arabicName || selectedSectorScreen}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                توزيع مخصص لكل قطاع ورتبة عسكرية (بادئات، نطاقات الأرقام وسعتها، والوصف الميداني) مع إمكانية التعديل والحذف الفوري
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRestoreRulesModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="استعادة الإعدادات الافتراضية الموصى بها لكافة القطاعات"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>استعادة الافتراضي</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddRule(selectedSectorScreen || undefined)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة نطاق يونت جديد</span>
              </button>
            </div>
          </div>

          {/* Secondary Controls Bar: Filters & Search */}
          <div className="p-3.5 sm:p-4 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Sector filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold shrink-0">عرض قطاع:</span>
                <select
                  value={rulesSectorFilter}
                  onChange={(e) => setRulesSectorFilter(e.target.value)}
                  className="bg-black/70 border border-white/10 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{selectedSectorScreen ? `كافة قواعد قطاع (${activeSectorObj?.arabicName || 'المحدد'})` : 'جميع القطاعات والقواعد'}</option>
                  <option value="all_shared">القواعد العامة لكافة القطاعات (M-)</option>
                  {sectors.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.arabicName || sec.name} ({sec.unitPrefix || 'SWAT'}-)
                    </option>
                  ))}
                </select>
              </div>

              {/* In dedicated sector screen, toggle shared general rules */}
              {selectedSectorScreen && rulesSectorFilter === 'all' && (
                <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={showSharedRulesInSector}
                    onChange={(e) => setShowSharedRulesInSector(e.target.checked)}
                    className="accent-amber-500 rounded cursor-pointer"
                  />
                  <span>إظهار القواعد المشتركة العامة (M-)</span>
                </label>
              )}

              {/* Search */}
              <div className="relative min-w-[180px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={rulesSearchQuery}
                  onChange={(e) => setRulesSearchQuery(e.target.value)}
                  placeholder="ابحث بالرتبة، البادئة (SWAT-)..."
                  className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-black/70 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
              <span>القواعد المعروضة:</span>
              <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {displayedRules.length} قاعدة
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {displayedRules.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                <h5 className="font-bold text-white text-sm">لا توجد قواعد مطابقة للفلتر المحدد</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  يمكنك تعديل الفلتر أو إضافة نطاق يونت جديد مخصص لهذا القطاع بالضغط على زر الإضافة أعلاه.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddRule(selectedSectorScreen || undefined)}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-black cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة نطاق يونت لهذا القطاع</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-black/60 text-slate-400 font-bold border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">الرتبة العسكرية</th>
                    <th className="py-3 px-3 text-center">القطاع المخصص</th>
                    <th className="py-3 px-3 text-center">بادئة اليونت (Prefix)</th>
                    <th className="py-3 px-3 text-center">نطاق الأرقام (Range)</th>
                    <th className="py-3 px-3 text-center">نموذج اليونت الميداني</th>
                    <th className="py-3 px-3 text-center">السعة الإجمالية</th>
                    <th className="py-3 px-3">الوصف والملاحظات</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedRules.map((rule) => {
                    const capacity = Math.max(1, (rule.rangeEnd || 1) - (rule.rangeStart || 1) + 1);
                    const matchedSec = sectors.find((s) => s.id === rule.sectorId);
                    const secTitle = rule.sectorId === 'all' ? 'كافة القطاعات (عام)' : (matchedSec?.arabicName || rule.sectorId);
                    const isSectorSpecific = rule.sectorId !== 'all';

                    return (
                      <tr key={rule.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <SmartBadge badge={rule.badge} defaultIcon="rank" className="w-5 h-5 rounded object-cover shrink-0" />
                            <span className="font-black text-white text-sm">{rule.rankName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isSectorSpecific
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-white/5 text-slate-300 border-white/10'
                          }`}>
                            {secTitle}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded bg-black/60 border border-amber-500/40 text-amber-300 font-mono font-black text-xs">
                            {rule.prefix}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono font-bold text-white text-xs">
                          من <span className="text-amber-400">{rule.rangeStart}</span> إلى <span className="text-amber-400">{rule.rangeEnd}</span>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                            {rule.prefix}{rule.rangeStart} ➔ {rule.prefix}{rule.rangeEnd}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-300">
                          {capacity} يونت
                        </td>

                        <td className="py-3.5 px-3 text-slate-400 text-[11px] max-w-[200px] truncate">
                          {rule.description || 'توزيع ميداني نظامي'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRule(rule)}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer"
                              title="تعديل النطاق"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRuleToDelete(rule)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer"
                              title="حذف النطاق"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: بطاقة الملف العسكري للموظف ('و اضغط عليه يفك لي معلوماته') */}
      {/* ============================================================== */}
      {selectedPersonnel && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto"
          onClick={() => setSelectedPersonnel(null)}
        >
          <div
            className="relative w-full max-w-lg bg-[#0f1219] border border-amber-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 text-right my-auto safe-bottom space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedPersonnel(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-white/10 pl-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner overflow-hidden p-1.5">
                <SmartBadge badge={selectedPersonnel.rule.badge} defaultIcon="rank" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-black font-black font-mono text-sm shadow-sm">
                    {selectedPersonnel.unitCode}
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    {selectedPersonnel.rankName}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {selectedPersonnel.app ? (selectedPersonnel.app.fullName || selectedPersonnel.app.playerName) : 'يونت شاغر متاح للتعيين'}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPersonnel.app?.sectorName || selectedPersonnel.sectorName}
                </p>
              </div>
            </div>

            {/* Personnel Detailed Content */}
            {selectedPersonnel.app ? (
              <div className="space-y-4">
                
                {/* 2-Column Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-black/40 p-3.5 rounded-xl border border-white/5 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">اسم اللاعب (الاسم داخل اللعبة):</span>
                    <span className="font-bold text-white text-sm">{selectedPersonnel.app.playerName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">الرقم العسكري:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {selectedPersonnel.app.militaryNo || 'غير محدد'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">الآيدي في اللعبة (Game ID):</span>
                    <span className="font-bold text-amber-300">{selectedPersonnel.app.gameId || 'غير محدد'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">منشن الديسكورد:</span>
                    <span className="font-bold text-blue-300 truncate block">
                      &lt;@{selectedPersonnel.app.discordId}&gt;
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">ضابط الاعتماد والقبول:</span>
                    <span className="font-bold text-slate-200">
                      {selectedPersonnel.app.acceptanceOfficer || 'القيادة العامة'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">تاريخ القبول والمباشرة:</span>
                    <span className="font-bold text-slate-200">
                      {selectedPersonnel.app.createdAt ? new Date(selectedPersonnel.app.createdAt).toLocaleDateString('ar-SA') : 'معتمد'}
                    </span>
                  </div>

                  {selectedPersonnel.app.score !== undefined && (
                    <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">نتيجة اختبار القبول:</span>
                      <span className="font-bold text-purple-300">
                        {selectedPersonnel.app.score} / {selectedPersonnel.app.totalQuestions || 5} نقاط
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons for the selected personnel */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyPersonnelInfo(selectedPersonnel)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {hasCopiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{hasCopiedText ? 'تم نسخ البيانات بنجاح!' : 'نسخ بطاقة العسكري'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPersonnel.app) {
                        setEditingUnitForApp(selectedPersonnel.app);
                        setNewUnitInput(selectedPersonnel.unitCode);
                      }
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل رمز اليونت</span>
                  </button>

                  {onOpenAppDetail && selectedPersonnel.app && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAppDetail(selectedPersonnel.app!);
                        setSelectedPersonnel(null);
                      }}
                      className="py-2.5 px-3.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>عرض الطلب الأصلي</span>
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>هذا اليونت متاح وجاهز للتعيين الميداني</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    يمكنك إسناد هذا اليونت ({selectedPersonnel.unitCode}) لأي مستجد أو عسكري يتم قبوله في رتبة ({selectedPersonnel.rankName}) التابعة لقطاع ({selectedPersonnel.sectorName}).
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: إضافة أو تعديل نطاق يونتات (Add / Edit Unit Rule)         */}
      {/* ============================================================== */}
      {isRuleModalOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto"
          onClick={() => setIsRuleModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#0f1219] border border-amber-500/40 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 text-right my-auto safe-bottom space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-white/10 pl-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  {editingRuleId ? 'تعديل نطاق وقاعدة اليونت' : 'إضافة نطاق يونتات جديد'}
                </h4>
                <p className="text-xs text-slate-400">
                  تحديد الرتبة والبادئة ونطاق الأرقام من وإلى
                </p>
              </div>
            </div>

            {/* Quick Presets for common ranks */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                نماذج جاهزة سريعة للقطاع المحدد (اضغط للتطبيق الفوري):
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs max-h-28 overflow-y-auto p-1 bg-black/40 rounded-xl border border-white/5 scrollbar-thin">
                {(() => {
                  const chosenSector = sectors.find((s) => s.id === ruleFormData.sectorId);
                  const secPfx = chosenSector?.unitPrefix ? `${chosenSector.unitPrefix}-` : 'M-';
                  const officerPfx = chosenSector?.unitPrefix ? `${chosenSector.unitPrefix}-I-` : 'I-';
                  const commandPfx = chosenSector?.unitPrefix ? `${chosenSector.unitPrefix}-F-` : 'F-';

                  const presets = [
                    { rankName: 'جندي', prefix: secPfx, start: 1, end: 34, badge: '🎖️' },
                    { rankName: 'جندي أول', prefix: secPfx, start: 35, end: 50, badge: '🎖️' },
                    { rankName: 'عريف', prefix: secPfx, start: 51, end: 65, badge: '🎗️' },
                    { rankName: 'وكيل رقيب', prefix: secPfx, start: 66, end: 80, badge: '🎗️' },
                    { rankName: 'رقيب', prefix: secPfx, start: 81, end: 95, badge: '🛡️' },
                    { rankName: 'رئيس رقباء', prefix: secPfx, start: 96, end: 110, badge: '🛡️⭐' },
                    { rankName: 'ملازم', prefix: officerPfx, start: 1, end: 15, badge: '🌟' },
                    { rankName: 'نقيب', prefix: officerPfx, start: 16, end: 30, badge: '🌟⭐' },
                    { rankName: 'رائد', prefix: officerPfx, start: 31, end: 45, badge: '🌟⭐⭐' },
                    { rankName: 'عميد', prefix: commandPfx, start: 1, end: 10, badge: '🦅' },
                    { rankName: 'لواء', prefix: commandPfx, start: 11, end: 20, badge: '⚔️👑' },
                  ];

                  return presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {p.badge} {p.rankName} ({p.prefix}{p.start}-{p.prefix}{p.end})
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              
              {/* Sector & Rank */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">القطاع التابع له</label>
                  <select
                    value={ruleFormData.sectorId}
                    onChange={(e) => {
                      const newSecId = e.target.value;
                      const newSec = sectors.find((s) => s.id === newSecId);
                      setRuleFormData((prev) => ({
                        ...prev,
                        sectorId: newSecId,
                        prefix: newSec?.unitPrefix ? `${newSec.unitPrefix}-` : 'M-',
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">كافة القطاعات (عام)</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.arabicName || s.name} ({s.unitPrefix || 'SWAT'}-)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الرتبة العسكرية</label>
                  <select
                    value={ruleFormData.rankName}
                    onChange={(e) => {
                      const selectedRank = ranks.find((r) => r.name === e.target.value);
                      setRuleFormData({
                        ...ruleFormData,
                        rankName: e.target.value,
                        badge: selectedRank?.badge || ruleFormData.badge,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {ranks.map((r) => (
                      <option key={r.id} value={r.name}>
                        {getSafeBadgeEmoji(r.badge, '🎖️')} {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prefix & Range (Start -> End) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    بادئة اليونت (Prefix)
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.prefix}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, prefix: e.target.value })}
                    placeholder="مثال: M- أو F- أو I-"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300 font-mono font-bold text-center focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">مثل: M- أو F-</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    بداية النطاق (من)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={ruleFormData.rangeStart}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, rangeStart: Number(e.target.value) })}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono font-bold text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">مثال: 1 أو 35</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    نهاية النطاق (إلى)
                  </label>
                  <input
                    type="number"
                    min={ruleFormData.rangeStart || 1}
                    required
                    value={ruleFormData.rangeEnd}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, rangeEnd: Number(e.target.value) })}
                    placeholder="34"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono font-bold text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">مثال: 34 أو 50</span>
                </div>
              </div>

              {/* Live Preview of generated units */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[11px] block">معاينة تسلسل اليونتات الميداني:</span>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {ruleFormData.prefix || 'M-'}{ruleFormData.rangeStart || 1} ➔ {ruleFormData.prefix || 'M-'}{ruleFormData.rangeEnd || 34}
                  <span className="text-xs text-slate-400 font-normal mr-2">
                    (إجمالي: {Math.max(1, (Number(ruleFormData.rangeEnd) || 1) - (Number(ruleFormData.rangeStart) || 1) + 1)} يونت)
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">وصف النطاق أو الفئة (اختياري)</label>
                <input
                  type="text"
                  value={ruleFormData.description}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                  placeholder="مثال: يونتات الأفراد المستجدين"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${theme.buttonClass} shadow-md`}
                >
                  حفظ وتطبيق النطاق
                </button>
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: تعديل كود اليونت المخصص لعسكري محدد                    */}
      {/* ============================================================== */}
      {editingUnitForApp && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setEditingUnitForApp(null)}
        >
          <div
            className="relative w-full max-w-sm bg-[#0f1219] border border-amber-500/40 rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 text-right space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="font-black text-white text-sm">تعديل يونت العسكري</h4>
              <button
                type="button"
                onClick={() => setEditingUnitForApp(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              العسكري: <b className="text-white">{editingUnitForApp.fullName}</b> ({editingUnitForApp.rank || 'جندي'})
            </p>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1">رمز اليونت الجديد</label>
              <input
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="مثال: M-15 أو F-2"
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-amber-500/50 text-amber-300 font-mono font-black text-center text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveAppUnit}
                className={`flex-1 py-2 rounded-xl text-xs font-black cursor-pointer ${theme.buttonClass}`}
              >
                حفظ التغيير
              </button>
              <button
                type="button"
                onClick={() => setEditingUnitForApp(null)}
                className="px-3 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: تأكيد حذف نطاق اليونت (بدون استخدام window.confirm)   */}
      {/* ============================================================== */}
      {ruleToDelete && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => !isDeletingRule && setRuleToDelete(null)}
        >
          <div
            className="relative w-full max-w-md bg-[#0f1219] border border-red-500/40 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 text-right space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-red-500/20">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white text-base">تأكيد حذف نطاق اليونتات</h4>
                <p className="text-xs text-slate-400">سيتم حذف هذا النطاق نهائياً من قاعدة بيانات السيرفر</p>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">الرتبة العسكرية:</span>
                <span className="text-white font-black flex items-center gap-1.5">
                  <SmartBadge badge={ruleToDelete.badge} defaultIcon="rank" className="w-4 h-4 rounded object-cover inline" />
                  {ruleToDelete.rankName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">القطاع التابع له:</span>
                <span className="text-amber-300 font-bold">
                  {ruleToDelete.sectorId === 'all'
                    ? 'كافة القطاعات (عام)'
                    : (sectors.find((s) => s.id === ruleToDelete.sectorId)?.arabicName || ruleToDelete.sectorId)}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400 font-bold">النطاق والبادئة:</span>
                <span className="text-emerald-400 font-bold">
                  {ruleToDelete.prefix}{ruleToDelete.rangeStart} ➔ {ruleToDelete.prefix}{ruleToDelete.rangeEnd}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400 font-bold">السعة الإجمالية:</span>
                <span className="text-slate-300">
                  {Math.max(1, (ruleToDelete.rangeEnd || 1) - (ruleToDelete.rangeStart || 1) + 1)} يونت
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingRule}
                onClick={handleConfirmDeleteRule}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
              >
                {isDeletingRule ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeletingRule ? 'جاري الحذف من السيرفر...' : 'تأكيد الحذف نهائياً'}</span>
              </button>
              <button
                type="button"
                disabled={isDeletingRule}
                onClick={() => setRuleToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: تأكيد استعادة نطاقات اليونتات الافتراضية الموصى بها     */}
      {/* ============================================================== */}
      {showRestoreRulesModal && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => !isRestoringRules && setShowRestoreRulesModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0f1219] border border-amber-500/40 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 text-right space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white text-base">استعادة نطاقات وقواعد اليونتات الموصى بها</h4>
                <p className="text-xs text-slate-400">تطبيق القواعد المخصصة لكل قطاع ورتبة عسكرية</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/5">
              سيتم إعادة ضبط وتعيين كافة نطاقات وبادئات اليونتات الافتراضية المخصصة لكل قطاع (قوات التدخل السريع SWAT، الأمن العام SEC، البحث الجنائي CIA، حرس الحدود BG، المباحث العامة MABH) طبقاً للمعايير الرسمية لسيرفر PRAVA (السيرفر العسكري).
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isRestoringRules}
                onClick={handleConfirmRestoreDefaults}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                {isRestoringRules ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isRestoringRules ? 'جاري الاستعادة والتطبيق...' : 'تأكيد استعادة القواعد الافتراضية'}</span>
              </button>
              <button
                type="button"
                disabled={isRestoringRules}
                onClick={() => setShowRestoreRulesModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
