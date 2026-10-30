import React, { useState } from 'react';
import { X, Award, FileText, Search, ShieldCheck, Copy, Check, Radio, ChevronRight } from 'lucide-react';
import { MilitaryRank, MilitaryProtocol, ServerSettings } from '../types.ts';
import { DEFAULT_MILITARY_RANKS, DEFAULT_MILITARY_PROTOCOLS } from '../data/defaultData.ts';
import { SmartBadge } from './SmartBadge.tsx';

interface ProtocolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverSettings: ServerSettings;
}

export const ProtocolsModal: React.FC<ProtocolsModalProps> = ({
  isOpen,
  onClose,
  serverSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'protocols' | 'ranks'>('protocols');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const ranks: MilitaryRank[] = serverSettings.ranks && serverSettings.ranks.length > 0
    ? serverSettings.ranks
    : DEFAULT_MILITARY_RANKS;

  const protocols: MilitaryProtocol[] = serverSettings.protocols && serverSettings.protocols.length > 0
    ? serverSettings.protocols
    : DEFAULT_MILITARY_PROTOCOLS;

  const activeProtocols = protocols.filter((p) => p.isActive);

  const filteredProtocols = activeProtocols.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'كافة البروتوكولات' },
    { id: 'recruitment', label: 'التوظيف والمباشرة' },
    { id: 'radio', label: 'الراديو والعمليات' },
    { id: 'operations', label: 'قواعد الاشتباك (ROE)' },
    { id: 'conduct', label: 'الانضباط والمساءلة' },
    { id: 'promotions', label: 'الترقيات والمكافآت' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0f16] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:px-8 border-b border-white/10 flex items-center justify-between bg-[#090b10]">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h3 className="font-black text-lg text-white flex items-center gap-2 justify-end">
                <span>البروتوكولات العسكرية والرتب المعتمدة</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                اللوائح النظامية، قواعد الاشتباك، وهيكل الرتب العسكرية في {serverSettings.serverName || 'سيرفر PRAVA'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-5 sm:px-8 border-b border-white/10 bg-[#080a0f] flex items-center justify-start gap-2 py-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('protocols')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'protocols'
                ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>البروتوكولات واللوائح الميدانية ({activeProtocols.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ranks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ranks'
                ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>سلسلة الرتب العسكرية ({ranks.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {activeTab === 'protocols' && (
            <div className="space-y-5">
              {/* Search and Category filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090b10] p-3.5 rounded-xl border border-white/5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في نصوص البروتوكولات والقواعد العسكرية..."
                    className="w-full pr-10 pl-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryFilter(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        categoryFilter === c.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-black/30 text-slate-400 hover:text-white hover:bg-black/50 border border-white/5'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Protocols List */}
              {filteredProtocols.length === 0 ? (
                <div className="p-12 text-center bg-[#090b10] rounded-xl border border-white/5 text-slate-400 text-xs">
                  لا توجد بروتوكولات مطابقة لبحثك حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProtocols.map((proto) => (
                    <div
                      key={proto.id}
                      className="p-5 rounded-2xl bg-[#090b10] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-4 shadow-lg group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {proto.categoryLabel || proto.category}
                          </span>
                          <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                            {proto.title}
                          </h4>
                        </div>

                        <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-black/40 p-4 rounded-xl border border-white/5">
                          {proto.content}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-[10px]">نظام رسمي معتمد</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${proto.title}\n\n${proto.content}`, proto.id)}
                          className="flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
                        >
                          {copiedId === proto.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ البروتوكول</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ranks' && (
            <div className="space-y-4">
              {/* Informational banner about rank protocol prefixes */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#121622] to-black border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-white text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>سلسلة الرتب العسكرية وبادئات البروتوكول (M-1, M-2 للأفراد · I-1, I-2 للضباط)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    لكل رتبة بادئة بروتوكول معتمدة (مثل M-1 للجندي، M-2 للجندي الأول، I-1 للملازم، I-2 للملازم أول) تتصل مباشرة باليونت الميداني وقواعد العمليات.
                  </p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-amber-300 font-bold whitespace-nowrap self-start sm:self-auto">
                  {ranks.length} رتبة مسجلة
                </span>
              </div>

              {/* Ranks Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ranks.map((r, idx) => {
                  const isOfficer = r.rankType === 'officer' || (r.protocolPrefix && r.protocolPrefix.startsWith('I'));
                  const protocolTag = r.protocolPrefix || (isOfficer ? `I-${idx - 6 || 1}` : `M-${idx + 1}`);

                  return (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-[#090b10] border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 shadow group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden p-1">
                          <SmartBadge badge={r.badge} defaultIcon="rank" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-white text-sm">{r.name}</span>
                            
                            {/* Protocol Prefix Badge (M-1, M-2, I-2, etc.) */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${
                              isOfficer 
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`} title={`بادئة بروتوكول الرتبة: ${protocolTag}`}>
                              {protocolTag}
                            </span>
                            
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 text-slate-400">
                              #{r.order || idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-bold ${isOfficer ? 'text-cyan-400' : 'text-slate-400'}`}>
                              {isOfficer ? 'فئة الضباط' : 'فئة الأفراد'}
                            </span>
                            {r.description && (
                              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                · {r.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {r.discordRoleId ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(`<@&${r.discordRoleId}>`, r.id)}
                          className="px-2 py-1 rounded bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] hover:text-white border border-[#5865F2]/30 text-[10px] font-mono font-bold transition-colors cursor-pointer shrink-0"
                          title="نسخ منشن رول الديسكورد"
                        >
                          {copiedId === r.id ? 'تم!' : 'المنشن'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">بدون منشن</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-8 border-t border-white/10 bg-[#090b10] flex items-center justify-between text-xs text-slate-400">
          <span>اللوائح والبروتوكولات العسكرية الرسمية · {serverSettings.serverName || 'سيرفر PRAVA'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
