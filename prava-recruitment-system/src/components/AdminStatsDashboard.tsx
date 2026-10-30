import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Layers,
  Sparkles,
  Download,
  Filter,
  RefreshCw,
  Award,
  ArrowUpRight,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { Application, Sector, PersonnelRequest } from '../types.ts';

interface AdminStatsDashboardProps {
  applications: Application[];
  sectors: Sector[];
  personnelRequests?: PersonnelRequest[];
  onSelectSectorFilter?: (sectorId: string) => void;
  onRefreshData?: () => void;
}

// Color palette mapping per sector
const SECTOR_COLORS: Record<string, { main: string; light: string; border: string; bg: string }> = {
  swat: { main: '#f59e0b', light: '#fbbf24', border: '#b45309', bg: 'rgba(245, 158, 11, 0.15)' },
  public_security: { main: '#3b82f6', light: '#60a5fa', border: '#1d4ed8', bg: 'rgba(59, 130, 246, 0.15)' },
  cid: { main: '#a855f7', light: '#c084fc', border: '#7e22ce', bg: 'rgba(168, 85, 247, 0.15)' },
  gs: { main: '#ec4899', light: '#f472b6', border: '#be185d', bg: 'rgba(236, 72, 153, 0.15)' },
  border_guard: { main: '#10b981', light: '#34d399', border: '#047857', bg: 'rgba(16, 185, 129, 0.15)' },
};

const DEFAULT_PALETTE = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];

export const AdminStatsDashboard: React.FC<AdminStatsDashboardProps> = ({
  applications,
  sectors,
  personnelRequests = [],
  onSelectSectorFilter,
  onRefreshData,
}) => {
  // Filters & display modes
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'مقبول' | 'قيد المراجعة' | 'مرفوض'>('all');
  const [barChartMode, setBarChartMode] = useState<'grouped' | 'stacked'>('grouped');
  const [selectedSectorDrilldown, setSelectedSectorDrilldown] = useState<string>('all');
  const [activeVisualView, setActiveVisualView] = useState<'overview' | 'comparison' | 'timeline' | 'radar'>('overview');

  // Filter applications based on time and status
  const filteredApps = useMemo(() => {
    let result = [...applications];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((app) => app.status === statusFilter);
    }

    // Time filter
    if (timeRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeRange === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeRange === '7days') {
        cutoff.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        cutoff.setDate(now.getDate() - 30);
      }

      result = result.filter((app) => {
        if (!app.createdAt) return true;
        const appDate = new Date(app.createdAt);
        return appDate >= cutoff;
      });
    }

    // Sector drilldown
    if (selectedSectorDrilldown !== 'all') {
      result = result.filter((app) => app.sectorId === selectedSectorDrilldown);
    }

    return result;
  }, [applications, timeRange, statusFilter, selectedSectorDrilldown]);

  // Aggregate stats per sector
  const sectorStatsData = useMemo(() => {
    return sectors.map((sector, index) => {
      const sectorApps = filteredApps.filter((a) => a.sectorId === sector.id);
      const total = sectorApps.length;
      const accepted = sectorApps.filter((a) => a.status === 'مقبول').length;
      const pending = sectorApps.filter((a) => a.status === 'قيد المراجعة').length;
      const rejected = sectorApps.filter((a) => a.status === 'مرفوض').length;
      
      const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
      const totalScores = sectorApps.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const avgScore = total > 0 ? Number((totalScores / total).toFixed(1)) : 0;

      // Color mapping
      const colors = SECTOR_COLORS[sector.id] || {
        main: DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
        light: DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
        border: DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
        bg: 'rgba(255, 255, 255, 0.1)',
      };

      return {
        id: sector.id,
        name: sector.arabicName || sector.name,
        shortName: sector.name,
        unitPrefix: sector.unitPrefix || 'MIL',
        isOpen: sector.isOpen,
        total,
        accepted,
        pending,
        rejected,
        acceptanceRate,
        avgScore,
        color: colors.main,
      };
    });
  }, [sectors, filteredApps]);

  // Donut/Pie Data: percentage per sector
  const sectorPieData = useMemo(() => {
    return sectorStatsData
      .filter((s) => s.total > 0)
      .map((s) => ({
        name: s.name,
        value: s.total,
        color: s.color,
      }));
  }, [sectorStatsData]);

  // Status Pie Data: All applications status distribution
  const statusPieData = useMemo(() => {
    const accepted = filteredApps.filter((a) => a.status === 'مقبول').length;
    const pending = filteredApps.filter((a) => a.status === 'قيد المراجعة').length;
    const rejected = filteredApps.filter((a) => a.status === 'مرفوض').length;

    return [
      { name: 'مقبول', value: accepted, color: '#10b981' },
      { name: 'قيد المراجعة', value: pending, color: '#f59e0b' },
      { name: 'مرفوض', value: rejected, color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [filteredApps]);

  // Timeline Trend Data (Submissions per day)
  const timelineData = useMemo(() => {
    const dateMap: Record<string, { date: string; displayDate: string; total: number; accepted: number; pending: number; rejected: number }> = {};

    filteredApps.forEach((app) => {
      const d = app.createdAt ? new Date(app.createdAt) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

      if (!dateMap[key]) {
        dateMap[key] = { date: key, displayDate, total: 0, accepted: 0, pending: 0, rejected: 0 };
      }

      dateMap[key].total += 1;
      if (app.status === 'مقبول') dateMap[key].accepted += 1;
      else if (app.status === 'قيد المراجعة') dateMap[key].pending += 1;
      else if (app.status === 'مرفوض') dateMap[key].rejected += 1;
    });

    const sorted = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-14); // show last 14 active days
  }, [filteredApps]);

  // Radar Data: comparing sectors along performance dimensions
  const radarData = useMemo(() => {
    return sectorStatsData.map((s) => {
      // Scale total volume relative to max for radar readability
      const maxTotal = Math.max(...sectorStatsData.map((x) => x.total), 1);
      const volumeNorm = Math.round((s.total / maxTotal) * 100);
      return {
        sector: s.name,
        'نسبة القبول': s.acceptanceRate,
        'متوسط الدرجة %': Math.round((s.avgScore / 5) * 100),
        'كثافة الطلبات': volumeNorm,
      };
    });
  }, [sectorStatsData]);

  // Personnel Requests by Sector (Transfers & Discharges)
  const personnelBySectorData = useMemo(() => {
    return sectors.map((sec) => {
      const fromSector = personnelRequests.filter((r) => r.currentSectorId === sec.id);
      const toSector = personnelRequests.filter((r) => r.targetSectorId === sec.id);
      const discharges = fromSector.filter((r) => r.type === 'discharge').length;
      const transferOut = fromSector.filter((r) => r.type === 'transfer').length;
      const transferIn = toSector.filter((r) => r.type === 'transfer').length;

      return {
        name: sec.arabicName || sec.name,
        'نقل إلى القطاع': transferIn,
        'نقل خارج القطاع': transferOut,
        'طلبات فصل': discharges,
      };
    });
  }, [sectors, personnelRequests]);

  // Overall KPIs
  const totalAppsCount = filteredApps.length;
  const totalAccepted = filteredApps.filter((a) => a.status === 'مقبول').length;
  const totalPending = filteredApps.filter((a) => a.status === 'قيد المراجعة').length;
  const totalRejected = filteredApps.filter((a) => a.status === 'مرفوض').length;
  const overallAcceptanceRate = totalAppsCount > 0 ? Math.round((totalAccepted / totalAppsCount) * 100) : 0;
  
  // Top Sector by application count
  const topSector = useMemo(() => {
    if (sectorStatsData.length === 0) return null;
    const sorted = [...sectorStatsData].sort((a, b) => b.total - a.total);
    return sorted[0].total > 0 ? sorted[0] : null;
  }, [sectorStatsData]);

  // Average overall test score
  const averageScore = useMemo(() => {
    if (totalAppsCount === 0) return 0;
    const sum = filteredApps.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Number((sum / totalAppsCount).toFixed(1));
  }, [filteredApps, totalAppsCount]);

  // Export summary report
  const handleExportSummary = () => {
    const csvRows = [
      ['القطاع', 'بادئة اليونت', 'إجمالي الطلبات', 'مقبول', 'قيد المراجعة', 'مرفوض', 'نسبة القبول %', 'متوسط الدرجة'],
      ...sectorStatsData.map((s) => [
        s.name,
        s.unitPrefix,
        s.total,
        s.accepted,
        s.pending,
        s.rejected,
        `${s.acceptanceRate}%`,
        `${s.avgScore} / 5`,
      ]),
    ];

    const csvContent = '\uFEFF' + csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prava-recruitment-stats-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      
      {/* 1. Header Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-[#0c0f17] via-[#121622] to-[#0a0d14] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>لوحة الإحصائيات والتحليلات البيانية للقطاعات</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    Recharts Pro
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  رصد مباشر لعدد وتوزيع طلبات التقديم، مؤشرات القبول والرفض، ومقارنة أداء القطاعات العسكرية
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportSummary}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="تصدير جدول الإحصائيات بتنسيق CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير التقرير (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold flex items-center gap-1 ml-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>الفترة:</span>
            </span>
            {[
              { id: 'all', label: 'كافة الأوقات' },
              { id: 'today', label: 'اليوم' },
              { id: '7days', label: 'آخر 7 أيام' },
              { id: '30days', label: 'آخر 30 يوماً' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold flex items-center gap-1 ml-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              <span>الحالة:</span>
            </span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'مقبول', label: 'مقبول' },
              { id: 'قيد المراجعة', label: 'معلق' },
              { id: 'مرفوض', label: 'مرفوض' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sector Drilldown Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">تصفية قطاع:</span>
            <select
              value={selectedSectorDrilldown}
              onChange={(e) => setSelectedSectorDrilldown(e.target.value)}
              className="bg-black/60 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">جميع القطاعات ({sectors.length})</option>
              {sectors.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.arabicName || sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {totalAppsCount === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-amber-300">
            لا توجد طلبات تقديم مسجلة في النظام حتى الآن. ستظهر الرسوم البيانية والإحصائيات تلقائياً بمجرد إرسال المتقدمين طلباتهم عبر بوابة التوظيف.
          </p>
        </div>
      )}

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Total Applications */}
        <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-amber-500/40 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي الطلبات</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalAppsCount}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>عبر {sectors.length} قطاعات معتمدة</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Top Sector */}
        <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-blue-500/40 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">القطاع الأكثر إقبالاً</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-amber-400 truncate">
              {topSector ? topSector.name : 'لا يوجد بيانات'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
              {topSector ? (
                <span>
                  {topSector.total} طلب ({Math.round((topSector.total / (totalAppsCount || 1)) * 100)}%)
                </span>
              ) : (
                <span>--</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 3: Accepted Count & Rate */}
        <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-emerald-500/40 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">المقبولون ونسبة القبول</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{totalAccepted}</span>
              <span className="text-xs font-bold text-emerald-300/80 font-mono">({overallAcceptanceRate}%)</span>
            </div>
            <div className="w-full bg-emerald-950/60 h-1.5 rounded-full mt-2 overflow-hidden border border-emerald-500/20">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallAcceptanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4: Under Review (Pending) */}
        <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-yellow-500/40 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">طلبات معلقة للمراجعة</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono">{totalPending}</div>
            <div className="text-[11px] text-yellow-300/70 mt-1 flex items-center gap-1">
              <span>{totalPending > 0 ? 'بانتظار قرار الضابط ⏳' : 'تم مراجعة الجميع ✨'}</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Average Test Score */}
        <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-purple-500/40 transition-all relative overflow-hidden group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">متوسط درجات الاختبار</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl sm:text-3xl font-black text-purple-300">{averageScore}</span>
              <span className="text-xs text-slate-400">/ 5</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span>معدل اجتياز الاختبارات العامة</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Visual View Tabs (Overview / Comparison / Timeline / Radar) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveVisualView('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeVisualView === 'overview'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>المخطط الشريطي للقطاعات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveVisualView('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeVisualView === 'comparison'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          <span>التوزيع النسبي والحصص</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveVisualView('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeVisualView === 'timeline'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>مسار التقديم الزمني</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveVisualView('radar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeVisualView === 'radar'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>مخطط الكفاءة والجاهزية</span>
        </button>
      </div>

      {/* 4. MAIN CHARTS CONTAINER */}

      {/* VIEW A: PRIMARY SECTOR BAR CHART */}
      {activeVisualView === 'overview' && (
        <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>توزيع عدد الطلبات لكل قطاع عسكري (Applications per Sector)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">
                  {filteredApps.length} طلب إجمالي
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                يوضح الرسم البياني حجم التقديم الفعلي لكل قطاع مصنفاً حسب حالات القبول، التعليق، والرفض
              </p>
            </div>

            {/* Bar Mode Selector (Grouped vs Stacked) */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setBarChartMode('grouped')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  barChartMode === 'grouped' ? 'bg-amber-500 text-black font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                شريطي منفصل (Grouped)
              </button>
              <button
                type="button"
                onClick={() => setBarChartMode('stacked')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  barChartMode === 'stacked' ? 'bg-amber-500 text-black font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                شريطي مكدس (Stacked)
              </button>
            </div>
          </div>

          {/* Recharts BarChart */}
          <div className="w-full h-[360px] pt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectorStatsData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="totalBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="acceptedBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="pendingBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="rejectedBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0b0e14]/95 border border-indigo-500/40 p-4 rounded-xl shadow-2xl text-right font-sans min-w-[220px] space-y-2.5 backdrop-blur-md">
                          <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <span className="font-black text-white text-sm">{label}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                              {data.unitPrefix}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-indigo-300 font-semibold">
                              <span>إجمالي الطلبات:</span>
                              <span className="font-black text-white font-mono">{data.total}</span>
                            </div>
                            <div className="flex items-center justify-between text-emerald-400">
                              <span>المقبولون:</span>
                              <span className="font-bold font-mono">{data.accepted} ({data.acceptanceRate}%)</span>
                            </div>
                            <div className="flex items-center justify-between text-amber-400">
                              <span>قيد المراجعة:</span>
                              <span className="font-bold font-mono">{data.pending}</span>
                            </div>
                            <div className="flex items-center justify-between text-rose-400">
                              <span>المرفوضون:</span>
                              <span className="font-bold font-mono">{data.rejected}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-slate-300">
                              <span>متوسط درجات الاختبار:</span>
                              <span className="font-bold font-mono text-amber-300">{data.avgScore} / 5</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value) => {
                    const labels: Record<string, { text: string; color: string }> = {
                      total: { text: 'إجمالي الطلبات', color: 'text-indigo-400' },
                      accepted: { text: 'مقبول 🟢', color: 'text-emerald-400' },
                      pending: { text: 'قيد المراجعة ⏳', color: 'text-amber-400' },
                      rejected: { text: 'مرفوض 🔴', color: 'text-rose-400' },
                    };
                    const item = labels[value];
                    return (
                      <span className={`text-xs font-bold ${item?.color || 'text-slate-300'} mx-2`}>
                        {item?.text || value}
                      </span>
                    );
                  }}
                />
                {barChartMode === 'grouped' ? (
                  <>
                    <Bar dataKey="total" fill="url(#totalBarGrad)" name="total" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="accepted" fill="url(#acceptedBarGrad)" name="accepted" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="pending" fill="url(#pendingBarGrad)" name="pending" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="rejected" fill="url(#rejectedBarGrad)" name="rejected" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="accepted" stackId="a" fill="url(#acceptedBarGrad)" name="accepted" radius={[0, 0, 0, 0]} maxBarSize={48} />
                    <Bar dataKey="pending" stackId="a" fill="url(#pendingBarGrad)" name="pending" radius={[0, 0, 0, 0]} maxBarSize={48} />
                    <Bar dataKey="rejected" stackId="a" fill="url(#rejectedBarGrad)" name="rejected" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW B: PIE & DONUT COMPARISONS */}
      {activeVisualView === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Donut 1: Sector Shares */}
          <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-400" />
                <span>الحصة النسبية للقطاعات من إجمالي الطلبات</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                توزيع نسبة إقبال المتقدمين على مختلف القطاعات
              </p>
            </div>

            <div className="w-full h-[300px] flex items-center justify-center" dir="ltr">
              {sectorPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={55}
                      paddingAngle={3}
                      label={({ name, percent }: any) => `${name || ''} (${(((percent ?? 0) as number) * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                    >
                      {sectorPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#090b10" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const percent = ((Number(data.value) / (totalAppsCount || 1)) * 100).toFixed(1);
                          return (
                            <div className="bg-[#0f131c] border border-amber-500/40 p-2.5 rounded-xl shadow-xl text-right text-xs space-y-1">
                              <div className="font-bold text-white">{data.name}</div>
                              <div className="text-amber-400 font-mono">
                                {data.value} طلب ({percent}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500 text-xs py-10">لا تتوفر طلبات كافية للرسم الدائري</div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-white/5 text-xs">
              {sectorStatsData.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300">{s.name}:</span>
                  <span className="text-white font-mono">{s.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut 2: Status Breakdown */}
          <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>حالات القرارات والفرز (مقبول / معلق / مرفوض)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                معدلات الفصل الإداري وحالة الفرز الإجمالية
              </p>
            </div>

            <div className="w-full h-[300px] flex items-center justify-center" dir="ltr">
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={55}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name || ''} (${(((percent ?? 0) as number) * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.color} stroke="#090b10" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const percent = ((Number(data.value) / (totalAppsCount || 1)) * 100).toFixed(1);
                          return (
                            <div className="bg-[#0f131c] border border-amber-500/40 p-2.5 rounded-xl shadow-xl text-right text-xs space-y-1">
                              <div className="font-bold text-white">{data.name}</div>
                              <div className="font-mono text-white">
                                {data.value} طلب ({percent}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500 text-xs py-10">لا توجد بيانات حالات كافية</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-slate-400">مقبول</div>
                <div className="text-base font-black text-emerald-400 font-mono">{totalAccepted}</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-slate-400">معلق</div>
                <div className="text-base font-black text-amber-400 font-mono">{totalPending}</div>
              </div>
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-slate-400">مرفوض</div>
                <div className="text-base font-black text-red-400 font-mono">{totalRejected}</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW C: TIMELINE & SUBMISSION TREND */}
      {activeVisualView === 'timeline' && (
        <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>مسار وموجات تقديم الطلبات عبر الوقت (Timeline Trend)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                تتبع وتيرة وصول الطلبات اليومية ومعدل النشاط الإجمالي
              </p>
            </div>
          </div>

          <div className="w-full h-[340px] pt-4" dir="ltr">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="acceptedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0f131c] border border-amber-500/40 p-3 rounded-xl shadow-2xl text-right text-xs space-y-1.5">
                            <div className="font-bold text-amber-400 border-b border-white/10 pb-1">
                              التاريخ: {data.date}
                            </div>
                            <div className="text-white flex justify-between gap-4">
                              <span>إجمالي الطلبات:</span>
                              <span className="font-bold font-mono">{data.total}</span>
                            </div>
                            <div className="text-emerald-400 flex justify-between gap-4">
                              <span>مقبول:</span>
                              <span className="font-bold font-mono">{data.accepted}</span>
                            </div>
                            <div className="text-amber-400 flex justify-between gap-4">
                              <span>قيد المراجعة:</span>
                              <span className="font-bold font-mono">{data.pending}</span>
                            </div>
                            <div className="text-red-400 flex justify-between gap-4">
                              <span>مرفوض:</span>
                              <span className="font-bold font-mono">{data.rejected}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(val) => {
                      const labels: Record<string, string> = {
                        total: 'إجمالي الطلبات',
                        accepted: 'الطلبات المقبولة',
                      };
                      return <span className="text-xs font-bold text-slate-300 mx-2">{labels[val] || val}</span>;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#totalGrad)"
                    name="total"
                  />
                  <Area
                    type="monotone"
                    dataKey="accepted"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#acceptedGrad)"
                    name="accepted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs py-16">لا توجد بيانات زمنية كافية حالياً</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW D: RADAR CHART (SECTOR READINESS & PERFORMANCE) */}
      {activeVisualView === 'radar' && (
        <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>مخطط الكفاءة ومقارنة معايير القطاعات (Radar Matrix)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                مقارنة متعددة المحاور بين القطاعات: نسبة القبول، متوسط درجات الاختبار، وكثافة الإقبال
              </p>
            </div>
          </div>

          <div className="w-full h-[360px] pt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={110}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis dataKey="sector" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <PolarRadiusAxis stroke="#94a3b8" angle={30} domain={[0, 100]} />
                <Radar name="نسبة القبول %" dataKey="نسبة القبول" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                <Radar name="متوسط الاختبار %" dataKey="متوسط الدرجة %" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Radar name="كثافة الطلبات %" dataKey="كثافة الطلبات" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(val) => <span className="text-xs font-bold text-slate-300 mx-2">{val}</span>}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0f131c] border border-amber-500/40 p-3 rounded-xl shadow-2xl text-right text-xs space-y-1">
                          <div className="font-bold text-white border-b border-white/10 pb-1">
                            {payload[0].payload.sector}
                          </div>
                          {payload.map((entry, idx) => (
                            <div key={idx} className="flex justify-between gap-3" style={{ color: entry.color }}>
                              <span>{entry.name}:</span>
                              <span className="font-mono font-bold">{entry.value}%</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. PERSONNEL REQUESTS BY SECTOR (If transfers exist) */}
      {personnelRequests.length > 0 && (
        <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>إحصائيات حركة النقل والفصل بين القطاعات</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">
                  {personnelRequests.length} طلب نقل وفصل
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                توزيع طلبات النقل الواردة والصادرة وحالات إنهاء الخدمة لكل قطاع
              </p>
            </div>
          </div>

          <div className="w-full h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personnelBySectorData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f131c', borderColor: '#f59e0b40', borderRadius: '12px' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(val) => <span className="text-xs font-bold text-slate-300 mx-2">{val}</span>}
                />
                <Bar dataKey="نقل إلى القطاع" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="نقل خارج القطاع" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="طلبات فصل" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6. DETAILED SECTOR STATS TABLE */}
      <div className="bg-[#090b10] border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-0">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0f16]">
          <div>
            <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>جدول البيانات التحليلي الشامل لكافة القطاعات</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              تفاصيل الأعداد والنسب ومعدلات القبول مع إمكانية التصفية المباشرة
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {sectors.length} قطاعات مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/60 text-slate-400 font-bold border-b border-white/5">
              <tr>
                <th className="py-3 px-4">القطاع العسكري</th>
                <th className="py-3 px-3 text-center">بادئة اليونت</th>
                <th className="py-3 px-3 text-center">حالة التقديم</th>
                <th className="py-3 px-3 text-center">إجمالي الطلبات</th>
                <th className="py-3 px-3 text-center">المقبولون</th>
                <th className="py-3 px-3 text-center">المعلقون</th>
                <th className="py-3 px-3 text-center">المرفوضون</th>
                <th className="py-3 px-3 text-center">نسبة القبول</th>
                <th className="py-3 px-3 text-center">متوسط الاختبار</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sectorStatsData.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                      <div>
                        <div className="font-black text-white text-sm">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.shortName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 font-mono font-bold text-amber-300 text-xs">
                      {s.unitPrefix}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.isOpen
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {s.isOpen ? 'مفتوح 🟢' : 'مغلق 🔴'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-black text-white text-sm">
                    {s.total}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-400">
                    {s.accepted}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-yellow-400">
                    {s.pending}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-red-400">
                    {s.rejected}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono font-bold text-slate-200">{s.acceptanceRate}%</span>
                      <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${s.acceptanceRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-purple-300 font-bold">
                    {s.avgScore} <span className="text-[10px] text-slate-400 font-normal">/ 5</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {onSelectSectorFilter && (
                      <button
                        type="button"
                        onClick={() => onSelectSectorFilter(s.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                        title="عرض وإدارة طلبات هذا القطاع"
                      >
                        <Eye className="w-3 h-3" />
                        <span>عرض الطلبات</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
