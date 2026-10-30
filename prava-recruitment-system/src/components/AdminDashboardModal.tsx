import React, { useState, useEffect } from 'react';
import { 
  Lock, X, LogOut, CheckCircle2, XCircle, Search, Filter, 
  Download, Eye, Image as ImageIcon, Save, RefreshCw, Sliders, 
  Users, ShieldCheck, ChevronDown, Check, ExternalLink, UserPlus,
  Trash2, ShieldAlert, KeyRound, Upload, Sparkles, Edit3, Settings,
  FileCheck, Shield, Award, Terminal, MessageSquare, Send, Bot, Radio, EyeOff,
  HardDrive, Archive, Crown, FileCode, Copy, CheckCheck, FolderArchive, Layers,
  Trophy, Medal, Clock, Smartphone, Megaphone, Bell, LogIn, FileText, Plus, ChevronUp, Hash,
  ArrowLeftRight, UserMinus, AlertTriangle, BarChart3, PieChart as PieChartIcon, Wrench,
  RotateCcw, AlertCircle, ChevronLeft, Volume2, Palette, ClipboardList, Zap
} from 'lucide-react';
import { Sector, Application, LoginLog, UserAccount, ServerSettings, UserPermissions, UserRole, MilitaryRank, MilitaryProtocol, PersonnelRequest, UnitRule } from '../types.ts';
import { DEFAULT_MILITARY_RANKS, DEFAULT_MILITARY_PROTOCOLS, DEFAULT_UNIT_RULES } from '../data/defaultData.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { safeFetchJson, apiUrl, API_BASE_URL } from '../utils/api.ts';
import { AdminStatsDashboard } from './AdminStatsDashboard.tsx';
import { AdminUnitsManager } from './AdminUnitsManager.tsx';
import { AdminAnnouncementManager } from './AdminAnnouncementManager.tsx';
import { AdminDeveloperManager } from './AdminDeveloperManager.tsx';
import { SmartBadge, getSafeBadgeEmoji } from './SmartBadge.tsx';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLogout: () => void;
  sectors: Sector[];
  onUpdateSector: (updatedSector: Sector) => void;
  serverSettings: ServerSettings;
  onUpdateServerSettings: (updatedSettings: ServerSettings) => void;
}

// Initial full default permissions template
const defaultPermissions: UserPermissions = {
  canViewApps: true,
  canAcceptApps: true,
  canRejectApps: true,
  canDeleteApps: false,
  canExportApps: true,
  canAddNotes: true,
  canToggleSector: false,
  canEditSectorInfo: false,
  canEditRolesTemplate: false,
  canEditUnitPrefix: false,
  canEditQuestions: false,
  canChangeServerLogo: false,
  canChangeDiscordLinks: false,
  canConfigureWebhooks: false,
  canViewAuditLogs: true,
  canManageAccounts: false,
  canAssignPermissions: false,
  canCreateRecruitmentOfficers: false,
  allowedSectors: ['swat'],
};

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  sectors,
  onUpdateSector,
  serverSettings,
  onUpdateServerSettings,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'applications' | 'transfers' | 'units' | 'stats' | 'announcements' | 'developer' | 'leaders' | 'ranks_protocols' | 'settings' | 'logs' | 'owner'>('applications');
  // Selected sector ID for isolated sector edit screen in settings
  const [selectedSectorForEditId, setSelectedSectorForEditId] = useState<string | null>(null);

  // Split-View Master-Detail Settings Partitioning (تصميم وتقسيم الإعدادات مع القائمة الجانبية والشريط العلوي)
  const [phoneSettingsSection, setPhoneSettingsSection] = useState<'sectors' | 'identity' | 'discord' | 'senior' | 'secondary_discord' | 'broadcast' | 'units' | 'guide' | 'all'>('sectors');
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');
  const [mobileSettingsDetailOpen, setMobileSettingsDetailOpen] = useState(true);
  const [dashboardNavSearchQuery, setDashboardNavSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isUploadingSectorBadge, setIsUploadingSectorBadge] = useState<string | null>(null);

  // Unit Rules State (نطاقات وبادئات أرقام اليونتات العسكرية لكل رتبة وقطاع)
  const [unitRules, setUnitRules] = useState<UnitRule[]>(() => {
    return serverSettings.unitRules && serverSettings.unitRules.length > 0
      ? serverSettings.unitRules
      : DEFAULT_UNIT_RULES;
  });

  // Personnel Requests State (طلبات النقل والفصل)
  const [personnelRequests, setPersonnelRequests] = useState<PersonnelRequest[]>([]);
  const [personnelTypeFilter, setPersonnelTypeFilter] = useState<'all' | 'transfer' | 'discharge'>('all');
  const [personnelStatusFilter, setPersonnelStatusFilter] = useState<'all' | 'قيد المراجعة' | 'مقبول' | 'مرفوض'>('all');
  const [personnelSectorFilter, setPersonnelSectorFilter] = useState<string>('all');
  const [approvingTransferRequest, setApprovingTransferRequest] = useState<PersonnelRequest | null>(null);
  const [assignedTransferRank, setAssignedTransferRank] = useState<string>('');
  const [assignedTransferProtocol, setAssignedTransferProtocol] = useState<string>('');
  const [assignedTransferUnit, setAssignedTransferUnit] = useState<string>('');
  const [transferReviewerNotes, setTransferReviewerNotes] = useState<string>('');
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<PersonnelRequest | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [isProcessingDischarge, setIsProcessingDischarge] = useState<string | null>(null);

  // Ranks & Protocols State
  const [ranksSubTab, setRanksSubTab] = useState<'ranks' | 'protocols' | 'template'>('ranks');
  const [ranksSectorFilter, setRanksSectorFilter] = useState<string>('all');
  const [ranksList, setRanksList] = useState<MilitaryRank[]>(() => {
    return Array.isArray(serverSettings.ranks)
      ? serverSettings.ranks
      : DEFAULT_MILITARY_RANKS;
  });
  const [rankToDelete, setRankToDelete] = useState<MilitaryRank | null>(null);
  const [isDeletingRank, setIsDeletingRank] = useState(false);
  const [showRestoreRanksModal, setShowRestoreRanksModal] = useState(false);
  const [isRestoringRanks, setIsRestoringRanks] = useState(false);
  const [rankFormError, setRankFormError] = useState<string | null>(null);
  const [protocolsList, setProtocolsList] = useState<MilitaryProtocol[]>(() => {
    return Array.isArray(serverSettings.protocols)
      ? serverSettings.protocols
      : DEFAULT_MILITARY_PROTOCOLS;
  });
  const [protocolCategoryFilter, setProtocolCategoryFilter] = useState<string>('all');
  const [editingRank, setEditingRank] = useState<MilitaryRank | null>(null);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankFormData, setRankFormData] = useState<Partial<MilitaryRank>>({
    name: '',
    order: 1,
    protocolPrefix: 'M-1',
    rankType: 'soldier',
    discordRoleId: '',
    discordRoleMention: '',
    secondaryRoleId: '',
    secondaryRoleMention: '',
    badge: '🎖️',
    sectorId: 'all',
    description: '',
  });
  const [editingProtocol, setEditingProtocol] = useState<MilitaryProtocol | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolFormData, setProtocolFormData] = useState<Partial<MilitaryProtocol>>({
    title: '',
    category: 'recruitment',
    sectorId: 'all',
    content: '',
    isActive: true,
  });
  const [copiedRankMentionId, setCopiedRankMentionId] = useState<string | null>(null);
  const [copiedSecondaryRankMentionId, setCopiedSecondaryRankMentionId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Hiring & Rank Assignment Modal State
  const [hiringApp, setHiringApp] = useState<Application | null>(null);
  const [hiringRankId, setHiringRankId] = useState<string>('');
  const [hiringUnit, setHiringUnit] = useState<string>('');
  const [hiringMilitaryNo, setHiringMilitaryNo] = useState<string>('');
  const [hiringNotes, setHiringNotes] = useState<string>('');
  const [hiringCustomRoleId, setHiringCustomRoleId] = useState<string>('');
  const [isDispatchingHiring, setIsDispatchingHiring] = useState<boolean>(false);
  const [hasCopiedHiringText, setHasCopiedHiringText] = useState<boolean>(false);

  // Application Acceptance Rank assignment state
  const [assigningRankId, setAssigningRankId] = useState<string>('');

  // Owner Package Download & Sync State
  interface PackageInfo {
    exists: boolean;
    filename: string;
    sizeFormatted: string;
    sizeBytes: number;
    lastModified: string;
    downloadUrl: string;
    keyFiles: string[];
  }
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [isRebuildingPackage, setIsRebuildingPackage] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);
  const [inspectingFile, setInspectingFile] = useState<string | null>(null);
  const [inspectingContent, setInspectingContent] = useState<string>('');
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
  const [hasCopiedFile, setHasCopiedFile] = useState(false);
  
  // Data state
  const [applications, setApplications] = useState<Application[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('prava_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (u: any) => u && u.username && !['officer_saad', 'applicant_fahad', 'swat_leader', 'officer_fahad'].includes(u.username.toLowerCase())
          );
        }
      }
    } catch {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Safe permissions fallback
  const userPerms: UserPermissions = currentUser?.permissions || defaultPermissions;
  const userAllowedSectorList: string[] = currentUser?.permissions?.allowedSectors || (currentUser?.role === 'owner' ? ['*'] : defaultPermissions.allowedSectors || ['swat']);

  // Helper: Is the user a super admin (owner or '*' in allowedSectors)?
  const isSuperAdmin = currentUser?.role === 'owner' || userAllowedSectorList.includes('*');

  // Helper: Does the user have permission to access this specific sector?
  const hasSectorAccess = (sectorId?: string) => {
    if (!sectorId) return false;
    if (isSuperAdmin) return true;
    const allowed = currentUser?.permissions?.allowedSectors || userAllowedSectorList;
    return allowed.includes(sectorId);
  };

  // Sector Settings Editable State
  const [editableSectors, setEditableSectors] = useState<Sector[]>(sectors);
  const [savingSectorId, setSavingSectorId] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // The list of sectors this user is permitted to see and manage
  const userAllowedSectors = React.useMemo(() => {
    if (isSuperAdmin) return editableSectors;
    const allowed = currentUser?.permissions?.allowedSectors || userAllowedSectorList;
    return editableSectors.filter((s) => allowed.includes(s.id));
  }, [editableSectors, isSuperAdmin, currentUser?.permissions?.allowedSectors, userAllowedSectorList]);

  // The list of applications this user is permitted to see (strict isolation)
  const userAllowedApplications = React.useMemo(() => {
    if (isSuperAdmin) return applications;
    return applications.filter((app) => hasSectorAccess(app.sectorId));
  }, [applications, isSuperAdmin, currentUser?.permissions?.allowedSectors, userAllowedSectorList]);

  // Search & filter for applications
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'قيد المراجعة' | 'مقبول' | 'مرفوض'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>(() => {
    if (isSuperAdmin) return 'all';
    const allowed = currentUser?.permissions?.allowedSectors || userAllowedSectorList;
    return allowed[0] || 'all';
  });
  
  // Detail preview modal for a single application
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Server Settings state
  const [editableSettings, setEditableSettings] = useState<ServerSettings>(serverSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Discord Webhook & Bot Test State
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordTestResult, setDiscordTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingSectorId, setTestingSectorId] = useState<string | null>(null);
  const [showBotToken, setShowBotToken] = useState(false);

  // Add / Edit User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    role: 'leader' as UserRole,
    roleTitle: 'قائد قطاع',
    gameId: '',
    discordUsername: '',
    permissions: { ...defaultPermissions } as UserPermissions,
  });

  // Leaderboards & Audit log filtering states
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [logActionFilter, setLogActionFilter] = useState<'all' | string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [isPurgingLogs, setIsPurgingLogs] = useState(false);

  // Initialize editable sectors and settings when the modal opens.
  // CRITICAL: We do NOT overwrite editableSettings or editableSectors on every background polling tick.
  // This prevents the text from disappearing while the user is actively typing in webhook URLs, channel IDs, or templates!
  useEffect(() => {
    if (isOpen) {
      setEditableSectors(sectors);
      setEditableSettings(serverSettings);
      if (Array.isArray(serverSettings.ranks)) {
        setRanksList(serverSettings.ranks);
      }
      if (Array.isArray(serverSettings.protocols) && serverSettings.protocols.length > 0) {
        setProtocolsList(serverSettings.protocols);
      }
      if (serverSettings.unitRules && serverSettings.unitRules.length > 0) {
        setUnitRules(serverSettings.unitRules);
      }
    }
  }, [isOpen]);

  // Save and persist updated unit rules to server settings
  const handleUpdateUnitRules = async (updatedRules: UnitRule[]) => {
    let mergedRules = updatedRules;
    if (!isSuperAdmin) {
      const otherRules = unitRules.filter((r) => r.sectorId !== 'all' && !hasSectorAccess(r.sectorId));
      mergedRules = [...otherRules, ...updatedRules];
    }
    setUnitRules(mergedRules);
    const newSettings = {
      ...editableSettings,
      unitRules: mergedRules,
    };
    setEditableSettings(newSettings);
    onUpdateServerSettings(newSettings);
    try {
      localStorage.setItem('prava_settings', JSON.stringify(newSettings));
    } catch {}
    try {
      await Promise.all([
        fetch(apiUrl('/api/unit-rules'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unitRules: updatedRules }),
        }),
        fetch(apiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        }),
      ]);
    } catch (err) {
      console.warn('Failed to save unit rules to server', err);
    }
  };

  // Fetch applications, logs, users, and personnel requests safely
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, logsRes, usersRes, requestsRes, rulesRes] = await Promise.all([
        safeFetchJson<Application[]>('/api/applications'),
        safeFetchJson<LoginLog[]>('/api/logs'),
        safeFetchJson<UserAccount[]>('/api/users'),
        safeFetchJson<PersonnelRequest[]>('/api/personnel-requests'),
        safeFetchJson<UnitRule[]>('/api/unit-rules'),
      ]);
      if (appsRes) setApplications(appsRes);
      if (logsRes) setLogs(logsRes);
      if (requestsRes && Array.isArray(requestsRes)) setPersonnelRequests(requestsRes);
      if (rulesRes && Array.isArray(rulesRes) && rulesRes.length > 0) {
        setUnitRules(rulesRes);
      }
      if (usersRes && Array.isArray(usersRes)) {
        const sanitized = usersRes.filter(
          (u) => u && u.username && !['officer_saad', 'applicant_fahad', 'swat_leader', 'officer_fahad'].includes(u.username.toLowerCase())
        );
        setUsers(sanitized);
        try {
          localStorage.setItem('prava_users', JSON.stringify(sanitized));
        } catch {}
      }
    } catch {
      // Silently keep current state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const isOwner = currentUser && (currentUser.role === 'owner' || currentUser.username === 'admin');

  // Fetch package info for Owner Tab
  const fetchPackageInfo = async () => {
    try {
      const res = await safeFetchJson<PackageInfo>('/api/owner/package-info');
      if (res) setPackageInfo(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === 'owner' || isOwner)) {
      fetchPackageInfo();
    }
  }, [isOpen, activeTab]);

  // Rebuild / refresh project package on demand
  const handleRebuildPackage = async () => {
    setIsRebuildingPackage(true);
    setRebuildMsg(null);
    try {
      const res = await fetch(apiUrl('/api/owner/rebuild-package'), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.package) {
          setPackageInfo(data.package);
        }
        setRebuildMsg('تم تحديث حزمة المشروع وإعادة ضغط أحدث الملفات بنجاح!');
        setTimeout(() => setRebuildMsg(null), 4000);
      } else {
        setRebuildMsg('حدث خطأ أثناء إعادة ضغط المشروع.');
      }
    } catch {
      setRebuildMsg('تعذر الاتصال بالسيرفر لإعادة البناء.');
    } finally {
      setIsRebuildingPackage(false);
    }
  };

  // Inspect raw single file content
  const handleInspectFile = async (fileName: string) => {
    setInspectingFile(fileName);
    setIsLoadingFileContent(true);
    setHasCopiedFile(false);
    try {
      const res = await fetch(apiUrl(`/api/owner/file-content?file=${encodeURIComponent(fileName)}`));
      if (res.ok) {
        const data = await res.json();
        setInspectingContent(data.content);
      } else {
        setInspectingContent('تعذر قراءة محتوى هذا الملف.');
      }
    } catch {
      setInspectingContent('حدث خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsLoadingFileContent(false);
    }
  };

  // Download raw single file
  const handleDownloadSingleFile = (fileName: string) => {
    window.location.href = apiUrl(`/api/owner/file-content?file=${encodeURIComponent(fileName)}&download=true`);
  };

  // Copy raw file content
  const handleCopyContent = () => {
    if (!inspectingContent) return;
    navigator.clipboard.writeText(inspectingContent);
    setHasCopiedFile(true);
    setTimeout(() => setHasCopiedFile(false), 2500);
  };

  // Sync assigningRankId when selectedApp opens
  useEffect(() => {
    if (selectedApp) {
      const matched = ranksList.find((r) => r.name === selectedApp.rank || (selectedApp.rankRoleId && r.discordRoleId === selectedApp.rankRoleId));
      setAssigningRankId(matched ? matched.id : (ranksList[0]?.id || ''));
    }
  }, [selectedApp, ranksList]);

  // Save Ranks to Server (Multi-tier persistence)
  const handleSaveRanks = async (updatedRanks: MilitaryRank[]) => {
    setRanksList(updatedRanks);
    const newSettings: ServerSettings = {
      ...editableSettings,
      ranks: updatedRanks,
    };
    setEditableSettings(newSettings);
    onUpdateServerSettings(newSettings);
    try {
      localStorage.setItem('prava_settings', JSON.stringify(newSettings));
    } catch {}

    try {
      const ranksRes = await fetch(apiUrl('/api/ranks'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ranks: updatedRanks }),
      });

      await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ranks: updatedRanks }),
      }).catch(() => {});

      if (ranksRes.ok) {
        const data = await ranksRes.json();
        if (data && Array.isArray(data.ranks)) {
          setRanksList(data.ranks);
          const synced = { ...newSettings, ranks: data.ranks };
          setEditableSettings(synced);
          onUpdateServerSettings(synced);
          try {
            localStorage.setItem('prava_settings', JSON.stringify(synced));
          } catch {}
        }
      }
      setSavedSuccessMsg('تم حفظ وتحديث قائمة الرتب العسكرية ومنشنات الديسكورد بنجاح!');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save ranks', err);
      setSavedSuccessMsg('تم حفظ وتحديث قائمة الرتب محلياً بنجاح!');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    }
  };

  // Save Protocols to Server
  const handleSaveProtocols = async (updatedProtocols: MilitaryProtocol[]) => {
    setProtocolsList(updatedProtocols);
    const newSettings: ServerSettings = {
      ...editableSettings,
      protocols: updatedProtocols,
    };
    setEditableSettings(newSettings);
    onUpdateServerSettings(newSettings);
    try {
      localStorage.setItem('prava_settings', JSON.stringify(newSettings));
    } catch {}
    try {
      await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      setSavedSuccessMsg('تم حفظ وتحديث البروتوكولات واللوائح الميدانية بنجاح!');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save protocols', err);
    }
  };

  // Rank Form Handlers
  const handleOpenAddRank = () => {
    setEditingRank(null);
    setRankFormError(null);
    const nextOrder = ranksList.length > 0 ? Math.max(...ranksList.map((r) => r.order || 0)) + 1 : 1;
    setRankFormData({
      id: `rank-${Date.now()}`,
      name: '',
      order: nextOrder,
      protocolPrefix: 'M-1',
      rankType: 'soldier',
      discordRoleId: '',
      discordRoleMention: '',
      secondaryRoleId: '',
      secondaryRoleMention: '',
      badge: '🎖️',
      sectorId: ranksSectorFilter !== 'all' ? ranksSectorFilter : 'all',
      description: '',
    });
    setIsRankModalOpen(true);
  };

  const handleOpenEditRank = (r: MilitaryRank) => {
    setEditingRank(r);
    setRankFormError(null);
    setRankFormData({ 
      ...r,
      secondaryRoleId: r.secondaryRoleId || '',
      secondaryRoleMention: r.secondaryRoleMention || (r.secondaryRoleId ? `<@&${r.secondaryRoleId}>` : ''),
      protocolPrefix: r.protocolPrefix || (r.rankType === 'officer' ? 'I-1' : 'M-1'),
      rankType: r.rankType || 'soldier'
    });
    setIsRankModalOpen(true);
  };

  const handleSaveRankForm = () => {
    if (!rankFormData.name?.trim()) {
      setRankFormError('يرجى إدخال اسم الرتبة العسكرية');
      return;
    }
    setRankFormError(null);
    const cleanRoleId = (rankFormData.discordRoleId || '').replace(/[^0-9]/g, '');
    const autoMention = cleanRoleId ? `<@&${cleanRoleId}>` : (rankFormData.discordRoleMention?.trim() || '');
    const cleanSecondaryRoleId = (rankFormData.secondaryRoleId || '').replace(/[^0-9]/g, '');
    const autoSecondaryMention = cleanSecondaryRoleId ? `<@&${cleanSecondaryRoleId}>` : (rankFormData.secondaryRoleMention?.trim() || '');

    const finalRank: MilitaryRank = {
      id: rankFormData.id || (editingRank ? editingRank.id : `rank-${Date.now()}`),
      name: rankFormData.name.trim(),
      order: Number(rankFormData.order) || 1,
      protocolPrefix: rankFormData.protocolPrefix?.trim() || 'M-1',
      rankType: rankFormData.rankType || 'soldier',
      discordRoleId: cleanRoleId,
      discordRoleMention: autoMention,
      secondaryRoleId: cleanSecondaryRoleId,
      secondaryRoleMention: autoSecondaryMention,
      badge: rankFormData.badge?.trim() || '🎖️',
      sectorId: rankFormData.sectorId || 'all',
      description: rankFormData.description?.trim() || '',
    };

    let updated: MilitaryRank[];
    if (editingRank) {
      updated = ranksList.map((r) => (r.id === editingRank.id ? finalRank : r));
    } else {
      updated = [...ranksList, finalRank];
    }
    updated.sort((a, b) => (a.order || 0) - (b.order || 0));
    handleSaveRanks(updated);
    setIsRankModalOpen(false);
  };

  // Personnel Requests Handlers (طلبات النقل والفصل)
  const handleOpenApproveTransfer = (req: PersonnelRequest) => {
    setApprovingTransferRequest(req);
    // Find default ranks for destination sector
    const targetRanks = ranksList.filter(r => r.sectorId === req.targetSectorId || r.sectorId === 'all');
    const matchedRank = targetRanks[0] || ranksList[0];
    setAssignedTransferRank(matchedRank?.name || 'جندي');
    setAssignedTransferProtocol(matchedRank?.protocolPrefix || 'M-1');
    const targetSec = sectors.find(s => s.id === req.targetSectorId);
    const prefix = targetSec?.unitPrefix || 'UNIT';
    const milNo = req.applicantGameId || '01';
    setAssignedTransferUnit(`${prefix}-${milNo}`);
    setTransferReviewerNotes('');
  };

  const handleConfirmApproveTransfer = async () => {
    if (!approvingTransferRequest) return;
    setIsProcessingTransfer(true);
    try {
      const res = await fetch(apiUrl(`/api/personnel-requests/${approvingTransferRequest.id}/approve`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedNewRank: assignedTransferRank,
          assignedNewProtocol: assignedTransferProtocol,
          assignedNewUnit: assignedTransferUnit,
          reviewedBy: currentUser.displayName || currentUser.username,
          reviewerNotes: transferReviewerNotes,
        }),
      });
      if (res.ok) {
        setSavedSuccessMsg(`تم اعتماد نقل العسكري (${approvingTransferRequest.applicantDisplayName}) إلى قطاع (${approvingTransferRequest.targetSectorName}) بنجاح برتبة (${assignedTransferRank}) والبروتوكول الجديد (${assignedTransferProtocol}) واليونت (${assignedTransferUnit})!`);
        setTimeout(() => setSavedSuccessMsg(null), 4000);
        setApprovingTransferRequest(null);
        fetchData();
      }
    } catch (e) {
      console.error('Failed to approve transfer', e);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  const handleApproveDischarge = async (req: PersonnelRequest) => {
    setIsProcessingDischarge(req.id);
    try {
      const res = await fetch(apiUrl(`/api/personnel-requests/${req.id}/approve`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: currentUser.displayName || currentUser.username,
          reviewerNotes: 'تم اعتماد الفصل بناء على طلب العسكري',
        }),
      });
      if (res.ok) {
        setSavedSuccessMsg(`تم اعتماد فصل العسكري (${req.applicantDisplayName}) وإسقاط رتبته من القطاع بنجاح.`);
        setTimeout(() => setSavedSuccessMsg(null), 4000);
        fetchData();
      }
    } catch (e) {
      console.error('Failed to approve discharge', e);
    } finally {
      setIsProcessingDischarge(null);
    }
  };

  const handleConfirmRejectRequest = async () => {
    if (!rejectingRequest) return;
    try {
      const res = await fetch(apiUrl(`/api/personnel-requests/${rejectingRequest.id}/reject`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: currentUser.displayName || currentUser.username,
          reviewerNotes: rejectionNotes || 'تم رفض الطلب من قِبل القيادة',
        }),
      });
      if (res.ok) {
        setSavedSuccessMsg(`تم رفض الطلب بنجاح.`);
        setTimeout(() => setSavedSuccessMsg(null), 3000);
        setRejectingRequest(null);
        setRejectionNotes('');
        fetchData();
      }
    } catch (e) {
      console.error('Failed to reject request', e);
    }
  };

  const handleDeleteRank = (rankId: string) => {
    const target = ranksList.find((r) => r.id === rankId);
    if (target) {
      setRankToDelete(target);
    }
  };

  const handleConfirmDeleteRank = async () => {
    if (!rankToDelete) return;
    setIsDeletingRank(true);
    const targetId = rankToDelete.id;
    const targetName = rankToDelete.name;
    const updated = ranksList.filter((r) => r.id !== targetId);

    // Immediate optimistic update
    setRanksList(updated);
    const newSettings: ServerSettings = {
      ...editableSettings,
      ranks: updated,
    };
    setEditableSettings(newSettings);
    onUpdateServerSettings(newSettings);
    try {
      localStorage.setItem('prava_settings', JSON.stringify(newSettings));
    } catch {}

    try {
      const deleteRes = await fetch(apiUrl(`/api/ranks/${targetId}`), {
        method: 'DELETE',
      });

      await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ranks: updated }),
      }).catch(() => {});

      if (deleteRes.ok) {
        const data = await deleteRes.json();
        if (data && Array.isArray(data.ranks)) {
          setRanksList(data.ranks);
          const fresh = { ...newSettings, ranks: data.ranks };
          setEditableSettings(fresh);
          onUpdateServerSettings(fresh);
          try {
            localStorage.setItem('prava_settings', JSON.stringify(fresh));
          } catch {}
        }
      }
      setSavedSuccessMsg(`تم حذف رتبة (${targetName}) وحفظ التعديلات بنجاح!`);
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to delete rank on server', err);
      setSavedSuccessMsg(`تم حذف رتبة (${targetName}) محلياً`);
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } finally {
      setIsDeletingRank(false);
      setRankToDelete(null);
    }
  };

  const handleReorderRank = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= ranksList.length) return;
    const updated = [...ranksList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    // update order numbers
    updated.forEach((r, idx) => {
      r.order = idx + 1;
    });
    handleSaveRanks(updated);
  };

  const handleRestoreDefaultRanks = () => {
    setShowRestoreRanksModal(true);
  };

  const handleConfirmRestoreDefaultRanks = async () => {
    setIsRestoringRanks(true);
    setRanksList(DEFAULT_MILITARY_RANKS);
    const newSettings: ServerSettings = {
      ...editableSettings,
      ranks: DEFAULT_MILITARY_RANKS,
    };
    setEditableSettings(newSettings);
    onUpdateServerSettings(newSettings);
    try {
      localStorage.setItem('prava_settings', JSON.stringify(newSettings));
    } catch {}

    try {
      await fetch(apiUrl('/api/ranks/restore-defaults'), { method: 'POST' });
      await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ranks: DEFAULT_MILITARY_RANKS }),
      }).catch(() => {});
      setSavedSuccessMsg('تمت استعادة هيكل الرتب الافتراضية لمنظومة PRAVA بنجاح!');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to restore default ranks on server', err);
    } finally {
      setIsRestoringRanks(false);
      setShowRestoreRanksModal(false);
    }
  };

  const handleCopyRankMention = (mention: string, id: string) => {
    if (!mention) return;
    navigator.clipboard.writeText(mention);
    setCopiedRankMentionId(id);
    setTimeout(() => setCopiedRankMentionId(null), 2500);
  };

  const handleCopySecondaryRankMention = (mention: string, id: string) => {
    if (!mention) return;
    navigator.clipboard.writeText(mention);
    setCopiedSecondaryRankMentionId(id);
    setTimeout(() => setCopiedSecondaryRankMentionId(null), 2500);
  };

  // Protocol Form Handlers
  const handleOpenAddProtocol = () => {
    setEditingProtocol(null);
    setProtocolFormData({
      id: `proto-${Date.now()}`,
      title: '',
      category: 'recruitment',
      sectorId: 'all',
      content: '',
      isActive: true,
    });
    setIsProtocolModalOpen(true);
  };

  const handleOpenEditProtocol = (p: MilitaryProtocol) => {
    setEditingProtocol(p);
    setProtocolFormData({ ...p });
    setIsProtocolModalOpen(true);
  };

  const handleSaveProtocolForm = () => {
    if (!protocolFormData.title?.trim() || !protocolFormData.content?.trim()) {
      alert('يرجى إدخال عنوان البروتوكول ونصه');
      return;
    }
    const catLabels: Record<string, string> = {
      recruitment: 'التوظيف والمباشرة',
      radio: 'الراديو والعمليات',
      operations: 'قواعد الاشتباك (ROE)',
      conduct: 'الانضباط والمساءلة',
      promotions: 'الترقيات والمكافآت',
      general: 'لوائح عامة',
    };

    const finalProto: MilitaryProtocol = {
      id: protocolFormData.id || (editingProtocol ? editingProtocol.id : `proto-${Date.now()}`),
      title: protocolFormData.title.trim(),
      category: (protocolFormData.category as any) || 'general',
      categoryLabel: catLabels[protocolFormData.category || 'general'] || 'لوائح عامة',
      content: protocolFormData.content.trim(),
      sectorId: protocolFormData.sectorId || 'all',
      isActive: protocolFormData.isActive !== undefined ? protocolFormData.isActive : true,
      updatedAt: new Date().toISOString(),
    };

    let updated: MilitaryProtocol[];
    if (editingProtocol) {
      updated = protocolsList.map((p) => (p.id === editingProtocol.id ? finalProto : p));
    } else {
      updated = [...protocolsList, finalProto];
    }
    handleSaveProtocols(updated);
    setIsProtocolModalOpen(false);
  };

  const handleDeleteProtocol = (protoId: string) => {
    const updated = protocolsList.filter((p) => p.id !== protoId);
    handleSaveProtocols(updated);
    setSavedSuccessMsg('تم حذف البروتوكول بنجاح.');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const handleToggleProtocolActive = (protoId: string) => {
    const updated = protocolsList.map((p) =>
      p.id === protoId ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
    );
    handleSaveProtocols(updated);
  };

  const handleRestoreDefaultProtocols = () => {
    handleSaveProtocols(DEFAULT_MILITARY_PROTOCOLS);
    setSavedSuccessMsg('تمت استعادة البروتوكولات واللوائح الافتراضية بنجاح!');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  // Helper to automatically find the first unoccupied/available military number and standard unit
  const getNextAvailableMilitaryNo = (
    sectorId: string,
    targetRankName: string,
    excludeAppId?: string
  ): { militaryNo: string; unit: string; rangeStart: number; rangeEnd: number; rule: UnitRule | null } => {
    // 1. Find unit rule for this rank & sector
    const activeRules = unitRules && unitRules.length > 0 ? unitRules : DEFAULT_UNIT_RULES;
    const rule = activeRules.find(
      (r) => r.rankName === targetRankName && (r.sectorId === sectorId || r.sectorId === 'all')
    ) || activeRules.find((r) => r.rankName === targetRankName);

    // Default ranges if rule missing
    let rangeStart = rule ? Number(rule.rangeStart) || 1 : 1;
    let rangeEnd = rule ? Number(rule.rangeEnd) || 100 : 100;
    
    // Default presets for standard military ranks if rule not defined
    if (!rule) {
      if (targetRankName === 'جندي أول') { rangeStart = 35; rangeEnd = 50; }
      else if (targetRankName === 'عريف') { rangeStart = 51; rangeEnd = 65; }
      else if (targetRankName === 'وكيل رقيب') { rangeStart = 66; rangeEnd = 80; }
      else if (targetRankName === 'رقيب') { rangeStart = 81; rangeEnd = 95; }
      else if (targetRankName === 'ملازم') { rangeStart = 1; rangeEnd = 15; }
      else if (targetRankName === 'عميد') { rangeStart = 1; rangeEnd = 5; }
      else if (targetRankName === 'لواء') { rangeStart = 6; rangeEnd = 10; }
    }

    const sec = sectors.find((s) => s.id === sectorId);
    let rawPrefix = (sec?.unitPrefix || rule?.prefix || 'SWAT').trim().replace(/-+$/, '');
    const prefix = (rawPrefix.slice(0, 4) || 'SWAT').toUpperCase();
    const sep = '-';

    // 2. Collect occupied military numbers from accepted/active applications in this sector
    const occupiedNumbers = new Set<number>();
    applications.forEach((a) => {
      if (a.id === excludeAppId) return;
      if (sectorId && sectorId !== 'all' && a.sectorId && a.sectorId !== sectorId) return;
      const isAccepted = a.status === 'مقبول' || a.serviceStatus === 'active';
      if (!isAccepted) return;

      // Check militaryNo
      if (a.militaryNo) {
        const parsed = parseInt(String(a.militaryNo).trim(), 10);
        if (!isNaN(parsed)) occupiedNumbers.add(parsed);
      }

      // Check currentUnit (extract trailing number e.g. SWAT-35 -> 35, M-1 -> 1)
      if (a.currentUnit) {
        const match = a.currentUnit.match(/(\d+)$/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed)) occupiedNumbers.add(parsed);
        }
      }
    });

    // 3. Find first available integer >= rangeStart
    let nextAvailable = rangeStart;
    while (occupiedNumbers.has(nextAvailable) && nextAvailable <= rangeEnd) {
      nextAvailable++;
    }

    // If entire designated range is occupied, find first integer above rangeEnd
    if (occupiedNumbers.has(nextAvailable)) {
      while (occupiedNumbers.has(nextAvailable)) {
        nextAvailable++;
      }
    }

    const strNo = String(nextAvailable);
    const fullUnit = `${prefix}${sep}${strNo}`;

    return {
      militaryNo: strNo,
      unit: fullUnit,
      rangeStart,
      rangeEnd,
      rule: rule || null,
    };
  };

  // Open Hiring Modal with Pre-filled 4-Letter Unit and Auto-Available Military Number
  const handleOpenHiringModal = (app: Application) => {
    setHiringApp(app);

    // Initial Rank candidate (keep candidate's applied rank or default to soldier)
    const matched = ranksList.find(
      (r) => r.name === app.rank || (app.rankRoleId && r.discordRoleId === app.rankRoleId)
    );
    const chosenRank = matched || ranksList[0];
    const rankId = chosenRank ? chosenRank.id : '';
    setHiringRankId(rankId);
    setHiringCustomRoleId(chosenRank?.discordRoleId || '');

    // Auto-compute next available unoccupied military number and standard unit
    const auto = getNextAvailableMilitaryNo(app.sectorId, chosenRank?.name || 'جندي', app.id);
    setHiringMilitaryNo(auto.militaryNo);
    setHiringUnit(auto.unit);
    setHiringNotes('');
  };

  if (!isOpen) return null;

  // Handle application status update (Accept / Reject) with Rank Assignment & Unit Override
  const handleUpdateAppStatus = async (
    appId: string, 
    newStatus: 'مقبول' | 'مرفوض' | 'قيد المراجعة',
    notes: string = '',
    rankInfo?: { 
      rank: string; 
      rankRoleId: string; 
      rankRoleMention: string;
      secondaryRankRoleId?: string;
      secondaryRankRoleMention?: string;
    },
    unitOverride?: string,
    militaryNoOverride?: string
  ) => {
    try {
      const reviewerName = currentUser.displayName || currentUser.username || 'مسؤول التوظيف';
      let res: Response | null = null;
      try {
        res = await fetch(apiUrl(`/api/applications/${appId}/status`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: newStatus, 
            reviewerNotes: notes,
            acceptanceOfficer: newStatus === 'مقبول' ? reviewerName : undefined,
            officerGameId: currentUser.gameId || '000',
            officerName: reviewerName,
            rank: rankInfo?.rank,
            rankRoleId: rankInfo?.rankRoleId,
            rankRoleMention: rankInfo?.rankRoleMention,
            secondaryRankRoleId: rankInfo?.secondaryRankRoleId,
            secondaryRankRoleMention: rankInfo?.secondaryRankRoleMention,
            currentUnit: unitOverride,
            militaryNo: militaryNoOverride,
          }),
        });
      } catch {
        // Fall back to local update
      }

      setApplications((prev) => {
        const updated = prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status: newStatus,
                reviewerNotes: notes,
                acceptanceOfficer: newStatus === 'مقبول' ? reviewerName : a.acceptanceOfficer,
                rank: rankInfo?.rank || a.rank,
                rankRoleId: rankInfo?.rankRoleId || a.rankRoleId,
                rankRoleMention: rankInfo?.rankRoleMention || a.rankRoleMention,
                secondaryRankRoleId: rankInfo?.secondaryRankRoleId || a.secondaryRankRoleId,
                secondaryRankRoleMention: rankInfo?.secondaryRankRoleMention || a.secondaryRankRoleMention,
                currentUnit: unitOverride || a.currentUnit,
                militaryNo: militaryNoOverride || a.militaryNo,
              }
            : a
        );
        try {
          localStorage.setItem('prava_applications', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (res && res.ok) {
        try {
          const updated: Application = await res.json();
          setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
          if (selectedApp?.id === appId) {
            setSelectedApp(updated);
          }
        } catch {}
      }

      setSavedSuccessMsg(`تم تحديث حالة الطلب إلى (${newStatus}) وتوثيق مسؤول القبول: ${reviewerName}`);
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Export applications to CSV
  const handleExportCSV = () => {
    if (applications.length === 0) return;
    const headers = ['رقم الطلب', 'القطاع', 'اسم اللاعب', 'الاسم الكامل', 'الديسكورد', 'الهوية', 'العمر', 'الرقم العسكري', 'اليونت', 'الدرجة', 'الحالة', 'تاريخ التقديم'];
    const rows = applications.map((a) => [
      a.id,
      a.sectorName,
      `"${a.playerName}"`,
      `"${a.fullName}"`,
      a.discordId,
      a.gameId,
      a.age,
      a.militaryNo,
      a.currentUnit,
      `${a.score}/${a.totalQuestions}`,
      a.status,
      new Date(a.createdAt).toLocaleString('ar-SA'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `طلبات_توظيف_PRAVA_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Sector Settings
  const handleSaveSector = async (sec: Sector) => {
    setSavingSectorId(sec.id);
    setSavedSuccessMsg(null);
    try {
      try {
        const res = await fetch(apiUrl(`/api/sectors/${sec.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sec),
        });
        if (res.ok) {
          const updated = await res.json();
          onUpdateSector(updated);
          setEditableSectors((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        } else {
          onUpdateSector(sec);
        }
      } catch {
        onUpdateSector(sec);
      }

      // Persist in localStorage
      try {
        const storedSectors = JSON.parse(localStorage.getItem('prava_sectors') || '[]');
        const updatedSectors = storedSectors.map((s: Sector) => (s.id === sec.id ? sec : s));
        localStorage.setItem('prava_sectors', JSON.stringify(updatedSectors));
      } catch {}

      setSavedSuccessMsg(`تم حفظ إعدادات ${sec.name} وبادئة اليونت (${sec.unitPrefix || 'M-'}) بنجاح!`);
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('فشل حفظ إعدادات القطاع');
    } finally {
      setSavingSectorId(null);
    }
  };

  // Save Server Settings (Logo & Discord URL & Senior Officers)
  const handleSaveServerSettings = async (customSettingsToSave?: ServerSettings | unknown) => {
    const toSave = customSettingsToSave && typeof customSettingsToSave === 'object' && 'serverLogo' in customSettingsToSave
      ? (customSettingsToSave as ServerSettings)
      : editableSettings;
    setSavingSettings(true);
    try {
      try {
        const res = await fetch(apiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSave),
        });
        if (res.ok) {
          const updated = await res.json();
          setEditableSettings(updated);
          onUpdateServerSettings(updated);
        } else {
          setEditableSettings(toSave);
          onUpdateServerSettings(toSave);
        }
      } catch {
        setEditableSettings(toSave);
        onUpdateServerSettings(toSave);
      }

      try {
        localStorage.setItem('prava_settings', JSON.stringify(toSave));
      } catch {}

      setSavedSuccessMsg('تم حفظ وتحديث إعدادات السيرفر والديسكورد وكبار الضباط بنجاح!');
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
      alert('فشل حفظ إعدادات السيرفر');
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle Global Auto-Accept for all recruitment applications (خاص بالقادة)
  const toggleGlobalAutoAccept = async () => {
    const nextVal = !editableSettings.autoAcceptApplications;
    const updatedSettings: ServerSettings = { ...editableSettings, autoAcceptApplications: nextVal };
    setEditableSettings(updatedSettings);
    await handleSaveServerSettings(updatedSettings);
    setSavedSuccessMsg(
      nextVal
        ? '⚡ تم تفعيل القبول الفوري الشامل للقادة! أي متقدم يوظف على أي قطاع يأتيه (مقبول) فورياً.'
        : 'تم إيقاف القبول الفوري الشامل، والطلبات الآن تخضع للمراجعة الاعتيادية.'
    );
    setTimeout(() => setSavedSuccessMsg(null), 3500);
  };

  // Test Discord Webhook or Bot
  const handleTestDiscord = async (params: { 
    webhookUrl?: string; 
    botToken?: string; 
    channelId?: string; 
    sectorId?: string;
    customMessage?: string;
    isSenior?: boolean;
  }) => {
    setIsTestingDiscord(true);
    if (params.sectorId) setTestingSectorId(params.sectorId);
    setDiscordTestResult(null);

    try {
      const defaultMsg = params.sectorId 
        ? `🚨 تجربة إرسال إشعار قطاع (${params.sectorId}) من منصة PRAVA للتوظيف الموحد` 
        : `🔔 **تجربة اتصال ناجحة مع ديسكورد من منصة PRAVA للتوظيف الموحد!**\nتم ضبط وتفعيل الربط بنجاح.`;

      const res = await fetch(apiUrl('/api/discord/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: params.webhookUrl,
          botToken: params.botToken,
          channelId: params.channelId,
          message: params.customMessage || defaultMsg,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          setDiscordTestResult({ success: true, message: data.message || 'تم إرسال الرسالة التجريبية إلى ديسكورد بنجاح!' });
        } else {
          setDiscordTestResult({ success: false, message: data.error || 'فشل إرسال التجربة، يرجى التأكد من صحة الرابط أو التوكن.' });
        }
      } else {
        setDiscordTestResult({ success: false, message: 'تعذر الوصول لخادم الـ API لإجراء الاختبار.' });
      }
    } catch {
      setDiscordTestResult({ success: false, message: 'تعذر الاتصال بالخادم لاختبار الديسكورد.' });
    } finally {
      setIsTestingDiscord(false);
      setTestingSectorId(null);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'all' | 'leader' | 'officer') => {
    if (preset === 'all') {
      setUserFormData((prev) => ({
        ...prev,
        role: 'owner',
        roleTitle: 'مشرف عام / نائب مالك',
        permissions: {
          canViewApps: true,
          canAcceptApps: true,
          canRejectApps: true,
          canDeleteApps: true,
          canExportApps: true,
          canAddNotes: true,
          canToggleSector: true,
          canEditSectorInfo: true,
          canEditRolesTemplate: true,
          canEditUnitPrefix: true,
          canEditQuestions: true,
          canChangeServerLogo: true,
          canChangeDiscordLinks: true,
          canConfigureWebhooks: true,
          canViewAuditLogs: true,
          canManageAccounts: true,
          canAssignPermissions: true,
          canCreateRecruitmentOfficers: true,
          allowedSectors: ['*'],
        },
      }));
    } else if (preset === 'leader') {
      setUserFormData((prev) => ({
        ...prev,
        role: 'leader',
        roleTitle: 'قائد قطاع',
        permissions: {
          canViewApps: true,
          canAcceptApps: true,
          canRejectApps: true,
          canDeleteApps: false,
          canExportApps: true,
          canAddNotes: true,
          canToggleSector: true,
          canEditSectorInfo: true,
          canEditRolesTemplate: true,
          canEditUnitPrefix: true,
          canEditQuestions: true,
          canChangeServerLogo: false,
          canChangeDiscordLinks: false,
          canConfigureWebhooks: true,
          canViewAuditLogs: true,
          canManageAccounts: false,
          canAssignPermissions: false,
          canCreateRecruitmentOfficers: true,
          allowedSectors: prev.permissions?.allowedSectors || ['swat'],
        },
      }));
    } else if (preset === 'officer') {
      setUserFormData((prev) => ({
        ...prev,
        role: 'officer',
        roleTitle: 'ضابط قبول وتجنيد',
        permissions: {
          canViewApps: true,
          canAcceptApps: true,
          canRejectApps: true,
          canDeleteApps: false,
          canExportApps: false,
          canAddNotes: true,
          canToggleSector: false,
          canEditSectorInfo: false,
          canEditRolesTemplate: false,
          canEditUnitPrefix: false,
          canEditQuestions: false,
          canChangeServerLogo: false,
          canChangeDiscordLinks: false,
          canConfigureWebhooks: false,
          canViewAuditLogs: false,
          canManageAccounts: false,
          canAssignPermissions: false,
          canCreateRecruitmentOfficers: false,
          allowedSectors: prev.permissions?.allowedSectors || ['*'],
        },
      }));
    }
  };

  // Open modal to Create new user
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserFormData({
      username: '',
      password: '',
      displayName: '',
      role: 'leader',
      roleTitle: 'قائد قطاع',
      gameId: '',
      discordUsername: '',
      permissions: { ...defaultPermissions },
    });
    setIsUserModalOpen(true);
  };

  // Open modal to Edit existing user
  const handleOpenEditUser = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUserFormData({
      username: user.username,
      password: '', // blank unless changing
      displayName: user.displayName,
      role: user.role,
      roleTitle: user.roleTitle,
      gameId: user.gameId || '',
      discordUsername: user.discordUsername || '',
      permissions: {
        ...defaultPermissions,
        ...(user.permissions || {}),
      },
    });
    setIsUserModalOpen(true);
  };

  // Save or Create user account
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        // Check if this was a pending user being approved
        const existingTarget = users.find((u) => u.id === editingUserId);
        const isApproving = existingTarget?.status === 'pending';

        if (isApproving) {
          try {
            await fetch(apiUrl(`/api/users/${editingUserId}/approve`), {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: userFormData.role,
                roleTitle: userFormData.roleTitle,
                permissions: userFormData.permissions,
                allowedSectors: userFormData.permissions.allowedSectors || ['*'],
                approvedBy: currentUser.displayName || currentUser.username,
              }),
            });
          } catch {
            // Fall back
          }
        } else {
          try {
            await fetch(apiUrl(`/api/users/${editingUserId}`), {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                displayName: userFormData.displayName,
                role: userFormData.role,
                roleTitle: userFormData.roleTitle,
                gameId: userFormData.gameId,
                discordUsername: userFormData.discordUsername,
                permissions: userFormData.permissions,
                ...(userFormData.password ? { password: userFormData.password } : {}),
              }),
            });
          } catch {
            // Fall back to local update
          }
        }

        const updatedUser: UserAccount = {
          id: editingUserId,
          username: userFormData.username,
          displayName: userFormData.displayName || userFormData.username,
          role: userFormData.role,
          roleTitle: userFormData.roleTitle,
          gameId: userFormData.gameId,
          discordUsername: userFormData.discordUsername,
          permissions: userFormData.permissions,
          status: 'active',
          approvedAt: isApproving ? new Date().toISOString() : existingTarget?.approvedAt,
          approvedBy: isApproving ? (currentUser.displayName || currentUser.username) : existingTarget?.approvedBy,
          createdAt: existingTarget?.createdAt || new Date().toISOString(),
        };

        setUsers((prev) => {
          const list = prev.map((u) => (u.id === editingUserId ? updatedUser : u));
          try {
            localStorage.setItem('prava_users', JSON.stringify(list));
          } catch {}
          return list;
        });

        setSavedSuccessMsg(
          isApproving
            ? `تم اعتماد وتفعيل حساب ${updatedUser.displayName} برتبة (${updatedUser.roleTitle}) بنجاح!`
            : `تم تحديث صلاحيات حساب ${updatedUser.displayName} بنجاح!`
        );
      } else {
        // Create new user
        const newUserId = `u-${Date.now().toString(36)}`;
        let createdUser: UserAccount = {
          id: newUserId,
          username: userFormData.username.trim(),
          displayName: userFormData.displayName.trim() || userFormData.username.trim(),
          role: userFormData.role,
          roleTitle: userFormData.roleTitle,
          gameId: userFormData.gameId,
          discordUsername: userFormData.discordUsername,
          permissions: userFormData.permissions,
          createdAt: new Date().toISOString(),
        };

        try {
          const res = await fetch(apiUrl('/api/users'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: userFormData.username.trim(),
              password: userFormData.password.trim(),
              displayName: userFormData.displayName.trim() || userFormData.username.trim(),
              role: userFormData.role,
              roleTitle: userFormData.roleTitle,
              gameId: userFormData.gameId,
              discordUsername: userFormData.discordUsername,
              permissions: userFormData.permissions,
            }),
          });
          if (res.ok) {
            const serverUser = await res.json();
            if (serverUser && serverUser.id) {
              createdUser = serverUser;
            }
          }
        } catch {
          // Fall back to local storage
        }

        setUsers((prev) => {
          const filtered = prev.filter(
            (u) => u.username.toLowerCase() !== createdUser.username.toLowerCase()
          );
          const list = [...filtered, createdUser];
          try {
            localStorage.setItem('prava_users', JSON.stringify(list));
          } catch {}
          return list;
        });

        setSavedSuccessMsg(`تم إنشاء حساب ${createdUser.displayName} وتعيين الصلاحيات بنجاح!`);
      }

      setIsUserModalOpen(false);
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الحساب');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    try {
      try {
        await fetch(apiUrl(`/api/users/${userId}`), { method: 'DELETE' });
      } catch {
        // Fall back to local delete
      }
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== userId);
        try {
          localStorage.setItem('prava_users', JSON.stringify(filtered));
        } catch {}
        return filtered;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Approve a pending applicant as officer
  const handleQuickApprove = async (userToApprove: UserAccount) => {
    try {
      const officerPermissions: UserPermissions = {
        canViewApps: true,
        canAcceptApps: true,
        canRejectApps: true,
        canDeleteApps: false,
        canExportApps: false,
        canAddNotes: true,
        canToggleSector: false,
        canEditSectorInfo: false,
        canEditRolesTemplate: false,
        canEditUnitPrefix: false,
        canEditQuestions: false,
        canChangeServerLogo: false,
        canChangeDiscordLinks: false,
        canConfigureWebhooks: false,
        canViewAuditLogs: false,
        canManageAccounts: false,
        canAssignPermissions: false,
        canCreateRecruitmentOfficers: false,
        allowedSectors: ['*'],
      };

      try {
        await fetch(apiUrl(`/api/users/${userToApprove.id}/approve`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'officer',
            roleTitle: 'ضابط قبول وتجنيد',
            approvedBy: currentUser.displayName || currentUser.username,
            permissions: officerPermissions,
            allowedSectors: ['*'],
          }),
        });
      } catch {}

      setUsers((prev) => {
        const list = prev.map((u) =>
          u.id === userToApprove.id
            ? {
                ...u,
                status: 'active' as any,
                role: 'officer' as any,
                roleTitle: 'ضابط قبول وتجنيد',
                permissions: officerPermissions,
                approvedAt: new Date().toISOString(),
                approvedBy: currentUser.displayName || currentUser.username,
              }
            : u
        );
        try {
          localStorage.setItem('prava_users', JSON.stringify(list));
        } catch {}
        return list;
      });

      setSavedSuccessMsg(`تم تفعيل واعتماد حساب ${userToApprove.displayName} بنجاح!`);
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Reject a pending applicant account
  const handleRejectUser = async (userId: string) => {
    try {
      try {
        await fetch(apiUrl(`/api/users/${userId}/reject`), { method: 'PATCH' });
      } catch {}

      setUsers((prev) => {
        const list = prev.filter((u) => u.id !== userId);
        try {
          localStorage.setItem('prava_users', JSON.stringify(list));
        } catch {}
        return list;
      });

      setSavedSuccessMsg('تم رفض طلب الحساب وإزالته.');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all logs manually (خاص بالاونر)
  const handleClearLogs = async () => {
    try {
      const res = await fetch(apiUrl('/api/logs'), { method: 'DELETE' });
      if (res.ok) {
        setLogs([
          {
            id: `log-${Date.now()}`,
            username: currentUser.displayName || 'المالك',
            displayName: currentUser.displayName || 'المالك',
            roleTitle: currentUser.roleTitle || 'مالك السيرفر',
            timestamp: new Date().toLocaleTimeString('ar-SA'),
            action: 'logout',
            deviceId: 'النظام الداخلي',
            details: 'تم مسح وتجديد السجل التدقيقي والأمني بالكامل يدوياً من قِبل المالك',
          },
        ]);
        setSavedSuccessMsg('تم مسح وتجديد سجلات اللوقات بنجاح!');
        setTimeout(() => setSavedSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-purge logs older than 14 days
  const handlePurgeOldLogs = async () => {
    setIsPurgingLogs(true);
    try {
      const res = await fetch(apiUrl('/api/logs/purge'), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSavedSuccessMsg(`تم فحص وتطهير السجلات: تم حذف (${data.purgedCount || 0}) سجل أقدم من 14 يوماً.`);
        setTimeout(() => setSavedSuccessMsg(null), 3500);
        const refreshed = await safeFetchJson<LoginLog[]>('/api/logs');
        if (refreshed) setLogs(refreshed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPurgingLogs(false);
    }
  };

  // Upload Logo handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableSettings((prev) => ({
          ...prev,
          serverLogo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Sector in allowedSectors array
  const toggleAllowedSector = (secId: string) => {
    setUserFormData((prev) => {
      let current = [...(prev.permissions?.allowedSectors || [])];
      if (secId === '*') {
        return {
          ...prev,
          permissions: { ...(prev.permissions || defaultPermissions), allowedSectors: ['*'] },
        };
      }
      current = current.filter((s) => s !== '*');
      if (current.includes(secId)) {
        current = current.filter((s) => s !== secId);
      } else {
        current.push(secId);
      }
      if (current.length === 0) current = ['*'];
      return {
        ...prev,
        permissions: { ...(prev.permissions || defaultPermissions), allowedSectors: current },
      };
    });
  };

  // Filtered applications with strict Sector RBAC isolation
  const filteredApps = applications.filter((app) => {
    // If user is restricted to specific sectors, they can NEVER see applications of other sectors
    if (!isSuperAdmin && !hasSectorAccess(app.sectorId)) {
      return false;
    }

    const matchesSearch = 
      app.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.militaryNo.includes(searchQuery) ||
      app.discordId.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || app.sectorId === sectorFilter;

    return matchesSearch && matchesStatus && matchesSector;
  });

  // Pending accounts awaiting owner approval
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeUsers = users.filter((u) => u.status !== 'pending');

  // Ranked sectors by total applications count (only user allowed sectors!)
  const sectorsRanked = userAllowedSectors.map((sec) => {
    const secApps = applications.filter((a) => a.sectorId === sec.id);
    const acceptedCount = secApps.filter((a) => a.status === 'مقبول').length;
    return {
      sector: sec,
      count: secApps.length,
      acceptedCount,
    };
  }).sort((a, b) => b.count - a.count);

  // Top military / applicants overall or in current filtered sector (أفضل العساكر)
  const topMilitaryList = [...userAllowedApplications]
    .filter((a) => sectorFilter === 'all' || a.sectorId === sectorFilter)
    .sort((a, b) => {
      if (a.status === 'مقبول' && b.status !== 'مقبول') return -1;
      if (b.status === 'مقبول' && a.status !== 'مقبول') return 1;
      return (b.score || 0) - (a.score || 0);
    });

  // Unique devices count from audit logs
  const uniqueDevices = Array.from(
    new Set(logs.map((l) => l.deviceId).filter(Boolean))
  );

  // Filtered audit logs
  const filteredLogs = logs.filter((l) => {
    const matchesAction = logActionFilter === 'all' || l.action === logActionFilter;
    const matchesSearch =
      !logSearchQuery ||
      (l.username || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      (l.displayName || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      (l.deviceId || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const currentSectionInfo = (() => {
    if (activeTab === 'applications') {
      return {
        title: 'طلبات التوظيف والفرز الميداني',
        subtitle: `إدارة وفرز طلبات التقديم لكافة القطاعات المعتمدة (${applications.length} طلب)`,
        icon: ClipboardList,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    }
    if (activeTab === 'transfers') {
      return {
        title: 'طلبات النقل والفصل العسكري',
        subtitle: 'متابعة وتنظيم تنقلات الأفراد وإجراءات إنهاء الخدمة (قريباً 🔒)',
        icon: ArrowLeftRight,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      };
    }
    if (activeTab === 'units') {
      return {
        title: 'كشف اليونتات وتوزيع الأفراد',
        subtitle: 'تسكين الرتب والأرقام العسكرية على الميدان (قريباً 🔒)',
        icon: Sliders,
        color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      };
    }
    if (activeTab === 'stats') {
      return {
        title: 'لوحة الإحصائيات والرسوم البيانية',
        subtitle: 'تحليلات الأداء ومعدلات القبول التراكمية (قريباً 🔒)',
        icon: BarChart3,
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      };
    }
    if (activeTab === 'announcements') {
      return {
        title: 'شاشة الإعلانات والتعميمات التفاعلية',
        subtitle: '15 مؤثراً سينمائياً وتفاعلياً بالصوت والصورة لبث التعاميم الفورية',
        icon: Megaphone,
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      };
    }
    if (activeTab === 'developer') {
      return {
        title: 'شاشة المطور وتعديل الأصوات بالكامل',
        subtitle: 'تخصيص كامل المؤثرات الصوتية والروابط المباشرة لملفات الصوت',
        icon: Wrench,
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      };
    }
    if (activeTab === 'leaders') {
      return {
        title: 'إدارة الحسابات والمسؤولين',
        subtitle: `التحكم بحسابات قادة القطاعات والمشرفين (${activeUsers.length} مسؤول)`,
        icon: Users,
        color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      };
    }
    if (activeTab === 'ranks_protocols') {
      return {
        title: 'البروتوكولات والرتب العسكرية',
        subtitle: `سلم الرتب العسكرية (${ranksList.length} رتبة) وربط رولات الديسكورد والبادئات`,
        icon: Award,
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    }
    if (activeTab === 'logs') {
      return {
        title: 'سجل اللوقات والأجهزة والعمليات',
        subtitle: `توثيق عمليات الدخول وتفاصيل المتصفحات والأجهزة (${logs.length} سجل)`,
        icon: Clock,
        color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      };
    }
    if (activeTab === 'owner') {
      return {
        title: 'خاص بالاونر وأرشيف المشروع',
        subtitle: 'التحكم المالي، النسخ الاحتياطي المشفر، وتحميل السورس كود',
        icon: Crown,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    }
    // settings sub-sections
    if (phoneSettingsSection === 'identity') {
      return {
        title: 'ألوان وثيم الموقع وهوية السيرفر',
        subtitle: 'الذهبي الملكي، الكحلي التكتيكي، الأبيض الرسمي، وبوابة القطاعات',
        icon: Sparkles,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    }
    if (phoneSettingsSection === 'sectors') {
      return {
        title: 'تفعيل وإلغاء القطاعات العسكرية',
        subtitle: 'تخصيص الشعار، بادئات اليونت، والروم والويب هوك الخاص بكل قطاع',
        icon: Layers,
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    }
    if (phoneSettingsSection === 'discord') {
      return {
        title: 'مركز التوكنات ومعرف السيرفر',
        subtitle: 'توكن البوت المشفر بـ AES-256، آيدي السيرفر، والفحص التلقائي',
        icon: KeyRound,
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    }
    if (phoneSettingsSection === 'senior') {
      return {
        title: 'شات كبار الضباط وتخصيص الرسالة',
        subtitle: 'إشعار التوظيف المعتمد، متغيرات {unit}، وتفعيل المنشن',
        icon: ShieldCheck,
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    }
    if (phoneSettingsSection === 'secondary_discord') {
      return {
        title: 'إعدادات ديسكورد السيرفر الثاني',
        subtitle: 'السيرفر الثاني العسكري المخصص للعمليات والويب هوك',
        icon: Radio,
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      };
    }
    if (phoneSettingsSection === 'broadcast') {
      return {
        title: 'شاشة التعاميم والإعلانات المنبثقة',
        subtitle: '15 مؤثراً سينمائياً وتفاعلياً بالصوت والصورة',
        icon: Megaphone,
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      };
    }
    if (phoneSettingsSection === 'units') {
      return {
        title: 'قواعد وتوزيع اليونتات الميدانية',
        subtitle: 'نطاقات أرقام الرتب M- و F- وكشف الموظفين الشامل',
        icon: Layers,
        color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      };
    }
    if (phoneSettingsSection === 'guide') {
      return {
        title: 'دليل التعليمات والنسخ الاحتياطي',
        subtitle: 'إرشادات التوظيف وتوليد حزمة zip',
        icon: Archive,
        color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      };
    }
    return {
      title: 'إعدادات المنظومة الشاملة',
      subtitle: 'تصفح شامل متصل لكافة صفحات وأقسام المنظومة',
      icon: Sliders,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
  })();

  const CurrentSectionIcon = currentSectionInfo.icon;

  const dashboardNavGroups = [
    {
      groupTitle: 'التوظيف والعمليات (Recruitment & Operations)',
      items: [
        {
          key: 'applications',
          title: 'طلبات التوظيف والفرز',
          subtitle: 'كشف المتقدمين، الفرز، والتوظيف المعتمد',
          icon: ClipboardList,
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          badge: `${applications.length} طلب`,
          badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          onClick: () => {
            setActiveTab('applications');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'applications',
        },
        {
          key: 'transfers',
          title: 'طلبات النقل والفصل العسكري',
          subtitle: 'إجراءات النقل وإنهاء الخدمة العسكرية',
          icon: ArrowLeftRight,
          iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          badge: 'قريباً 🔒',
          badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          onClick: () => {
            setActiveTab('transfers');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'transfers',
        },
        {
          key: 'units',
          title: 'كشف اليونتات وتوزيع الأفراد',
          subtitle: 'توزيع الميدان وتسكين الأرقام العسكرية',
          icon: Sliders,
          iconBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
          badge: 'قريباً 🔒',
          badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          onClick: () => {
            setActiveTab('units');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'units',
        },
        {
          key: 'stats',
          title: 'لوحة الإحصائيات والرسوم',
          subtitle: 'مؤشرات الأداء ورسوم Recharts البيانية',
          icon: BarChart3,
          iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          badge: 'قريباً 🔒',
          badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          onClick: () => {
            setActiveTab('stats');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'stats',
        },
      ],
    },
    {
      groupTitle: 'الرتب والصلاحيات (Ranks & Roles)',
      items: [
        {
          key: 'ranks_protocols',
          title: 'البروتوكولات والرتب العسكرية',
          subtitle: 'سلم الرتب وربط رول الديسكورد والبادئات',
          icon: Award,
          iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          badge: `${ranksList.length} رتبة`,
          badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          onClick: () => {
            setActiveTab('ranks_protocols');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'ranks_protocols',
        },
        {
          key: 'leaders',
          title: 'إدارة الحسابات والمسؤولين',
          subtitle: 'صلاحيات قادة القطاعات والمشرفين',
          icon: Users,
          iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          badge: pendingUsers.length > 0 ? `${pendingUsers.length} طلب معلق ⏳` : `${activeUsers.length} مسؤول`,
          badgeColor: pendingUsers.length > 0 ? 'bg-amber-500 text-black font-black animate-pulse' : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
          onClick: () => {
            setActiveTab('leaders');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'leaders',
        },
      ],
    },
    {
      groupTitle: 'الاتصال والشبكة (Connections & Discord)',
      items: [
        {
          key: 'setting_discord',
          title: 'مركز التوكنات ومعرف السيرفر',
          subtitle: 'توكن البوت، آيدي السيرفر، الفحص التلقائي',
          icon: KeyRound,
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          badge: editableSettings.botToken ? 'مشفر' : 'مفعل',
          badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          onClick: () => {
            setActiveTab('settings');
            setPhoneSettingsSection('discord');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'settings' && phoneSettingsSection === 'discord',
        },
        {
          key: 'setting_senior',
          title: 'شات كبار الضباط وتخصيص الرسالة',
          subtitle: 'إشعار التوظيف المعتمد، متغيرات {unit}',
          icon: ShieldCheck,
          iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          badge: 'فوري ⚡',
          badgeColor: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
          onClick: () => {
            setActiveTab('settings');
            setPhoneSettingsSection('senior');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'settings' && phoneSettingsSection === 'senior',
        },
        {
          key: 'setting_secondary_discord',
          title: 'إعدادات ديسكورد السيرفر الثاني',
          subtitle: 'السيرفر الثاني العسكري والويب هوك',
          icon: Radio,
          iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          badge: 'محجوز',
          badgeColor: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
          onClick: () => {
            setActiveTab('settings');
            setPhoneSettingsSection('secondary_discord');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'settings' && phoneSettingsSection === 'secondary_discord',
        },
      ],
    },
    {
      groupTitle: 'القطاعات والخدمات (Sectors & Services)',
      items: [
        {
          key: 'setting_auto_accept',
          title: 'زر القبول التلقائي الفوري للقادة',
          subtitle: 'اعتماد فوري لأي متقدم وتعيين الرتبة تلقائياً',
          icon: Zap,
          iconBg: editableSettings.autoAcceptApplications 
            ? 'bg-emerald-500/25 text-emerald-400 border-emerald-500/50' 
            : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          badge: editableSettings.autoAcceptApplications ? '⚡ مفعل فوري' : 'يدوي',
          badgeColor: editableSettings.autoAcceptApplications 
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-black animate-pulse' 
            : 'bg-white/10 border-white/10 text-slate-400',
          onClick: () => {
            setActiveTab('settings');
            setPhoneSettingsSection('sectors');
            setSelectedSectorForEditId(null);
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'settings' && phoneSettingsSection === 'sectors',
        },
        {
          key: 'setting_sectors',
          title: 'تفعيل وإلغاء القطاعات العسكرية',
          subtitle: 'تخصيص الشعار، بادئات اليونت، والروم',
          icon: Layers,
          iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          badge: `${userAllowedSectors.length} قطاعات`,
          badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          onClick: () => {
            setActiveTab('settings');
            setPhoneSettingsSection('sectors');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'settings' && phoneSettingsSection === 'sectors',
        },
        {
          key: 'setting_identity',
          title: 'ألوان وثيم الموقع وهوية السيرفر',
          subtitle: 'الذهبي الملكي، الكحلي التكتيكي، الأبيض',
          icon: Sparkles,
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          badge: 'المظهر',
          badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          onClick: () => {
            setActiveTab('settings');
            setPhoneSettingsSection('identity');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'settings' && phoneSettingsSection === 'identity',
        },
      ],
    },
    {
      groupTitle: 'الرسائل والتعاميم (Messages & Templates)',
      items: [
        {
          key: 'announcements',
          title: 'شاشة الإعلانات والتعميمات (15 مؤثر)',
          subtitle: 'مؤثرات سينمائية وتفاعلية عاجلة بالصوت',
          icon: Megaphone,
          iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          badge: '15 مؤثر',
          badgeColor: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          onClick: () => {
            setActiveTab('announcements');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'announcements',
        },
        {
          key: 'developer',
          title: 'شاشة المطور وتعديل الأصوات بالكامل',
          subtitle: 'تخصيص كامل المؤثرات الصوتية والروابط',
          icon: Wrench,
          iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          badge: 'مطور 🛠️',
          badgeColor: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
          onClick: () => {
            setActiveTab('developer');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'developer',
        },
      ],
    },
    {
      groupTitle: 'الأمان والأرشيف (Security & Owner)',
      items: [
        {
          key: 'logs',
          title: 'سجل اللوقات والأجهزة والعمليات',
          subtitle: 'توثيق الدخول، المتصفحات، وبصمة الجهاز',
          icon: Clock,
          iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          badge: `${logs.length} سجل`,
          badgeColor: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
          onClick: () => {
            setActiveTab('logs');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'logs',
        },
        {
          key: 'owner',
          title: 'خاص بالاونر وأرشيف النسخ الاحتياطي',
          subtitle: 'أرشيف المشروع وتحميل ملفات السورس كود',
          icon: Crown,
          iconBg: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-400 border-amber-400/40',
          badge: 'الاونر 👑',
          badgeColor: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
          onClick: () => {
            setActiveTab('owner');
            setMobileSidebarOpen(false);
          },
          isActive: activeTab === 'owner',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#07090e] flex flex-col lg:flex-row overflow-hidden text-right animate-in fade-in select-none">
      
      {/* 1. RIGHT SIDEBAR: Primary Navigation for the Entire Command Center (Master-Detail matching reference design) */}
      <aside 
        className={`w-full lg:w-80 xl:w-96 shrink-0 bg-[#080b12] border-l border-white/10 flex flex-col h-full overflow-hidden select-text transition-all duration-200 z-30 ${
          mobileSidebarOpen ? 'fixed inset-0 flex lg:relative lg:inset-auto' : 'hidden lg:flex'
        }`}
      >
        {/* Top Search Bar */}
        <div className="p-3.5 pb-2 border-b border-white/5 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={dashboardNavSearchQuery}
              onChange={(e) => setDashboardNavSearchQuery(e.target.value)}
              placeholder="بحث في كافة الأقسام والإعدادات..."
              className="w-full pr-10 pl-8 py-2.5 rounded-2xl bg-[#0d121c] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors text-right shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {dashboardNavSearchQuery && (
              <button
                type="button"
                onClick={() => setDashboardNavSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Server Profile Card (matches reference image) */}
        <div className="p-3.5 pt-2 pb-3 border-b border-white/5 shrink-0">
          <div className="bg-gradient-to-r from-[#0d121c] via-[#0a0e17] to-[#07090e] border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Left side in RTL: Chevron */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>

            {/* Middle: server details */}
            <div className="text-right flex-1 px-3 min-w-0">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono text-[9px]">
                  v14.0
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>متصل</span>
                </span>
              </div>
              <h4 className="text-white font-black text-xs sm:text-sm mt-1 truncate">
                {editableSettings.serverName || 'PRAVA ROLEPLAY'}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider truncate">
                MINISTRY OF INTERIOR
              </p>
            </div>

            {/* Right side in RTL: Server Logo */}
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-lg shrink-0 bg-black flex items-center justify-center">
              <img
                src={editableSettings.serverLogo || '/prava_badge_circular.png'}
                alt="Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/prava_badge_circular.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
          {dashboardNavGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter((item) => {
              if (!dashboardNavSearchQuery.trim()) return true;
              const q = dashboardNavSearchQuery.toLowerCase();
              return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || group.groupTitle.toLowerCase().includes(q);
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-2">
                <div className="text-[11px] font-extrabold text-slate-400 px-1 tracking-wider text-right">
                  {group.groupTitle}
                </div>

                <div className="space-y-1.5">
                  {filteredItems.map((item) => {
                    const isSelected = item.isActive;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={item.onClick}
                        className={`w-full p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-right group ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/15 via-[#131926] to-[#0c1017] border-amber-500/70 shadow-lg ring-1 ring-amber-500/30'
                            : 'bg-[#0a0d14] hover:bg-[#111622] border-white/5 hover:border-white/15'
                        }`}
                      >
                        {/* Left side in RTL: Chevron & Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <ChevronLeft className={`w-4 h-4 transition-transform ${isSelected ? 'text-amber-400 -translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>

                        {/* Right side in RTL: Text & Squircle Icon */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
                          <div className="min-w-0 text-right">
                            <h5 className={`text-xs font-black truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                              {item.title}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${item.iconBg}`}>
                            <ItemIcon className="w-5 h-5" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile close sidebar button (only on mobile when open) */}
        {mobileSidebarOpen && (
          <div className="p-3 border-t border-white/10 bg-[#090c13] lg:hidden shrink-0">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs text-center cursor-pointer shadow-lg"
            >
              متابعة إلى الصفحة المحددة ➔
            </button>
          </div>
        )}
      </aside>

      {/* 2. LEFT MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#07090e] select-text">
        {/* Top Header Bar matching reference design: Cyan back button, active title, squircle icon, return & logout buttons */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#0b0e14] shrink-0 shadow-lg relative z-10">
          {/* Left actions: Close, Portal return, Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="إغلاق اللوحة"
            >
              <X className="w-3.5 h-3.5" />
              <span>إغلاق</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              title="العودة لبوابة التوظيف"
            >
              <span className="text-sm">↩️</span>
              <span className="hidden sm:inline">العودة للتوظيف</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>

            {/* Quick Commander Auto-Accept Switch Button in Header */}
            <button
              type="button"
              onClick={toggleGlobalAutoAccept}
              disabled={savingSettings}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer shadow-sm ${
                editableSettings.autoAcceptApplications
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 shadow-emerald-500/10'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
              title="زر القبول الفوري الشامل للقادة - أي متقدم يوظف يأتيه مقبول فوراً"
            >
              <Zap className={`w-3.5 h-3.5 ${editableSettings.autoAcceptApplications ? 'text-emerald-400 animate-bounce' : 'text-amber-400'}`} />
              <span>القبول الفوري للقادة:</span>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                editableSettings.autoAcceptApplications ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-slate-400'
              }`}>
                {editableSettings.autoAcceptApplications ? 'مفعل ⚡' : 'معطل'}
              </span>
            </button>
          </div>

          {/* Right: Section Title & Cyan Back button */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-amber-400 font-black text-sm sm:text-base">
                  {currentSectionInfo.title}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${currentSectionInfo.color}`}>
                  <CurrentSectionIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block truncate max-w-md">
                {currentSectionInfo.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="فتح وإغلاق قائمة الأقسام"
            >
              <ChevronLeft className="w-4 h-4 rotate-180 text-cyan-400" />
              <span>رجوع للأقسام</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 pb-32 space-y-6">

          {/* Global Success Banner */}
          {savedSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: Applications */}
          {activeTab === 'applications' && (
            <div className="space-y-5">
              
              {/* LEADERBOARD: المتصدرين في القطاعات وأفضل العساكر */}
              <div className="bg-[#090b10] border border-amber-500/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        <span>المتصدرين في القطاعات وأفضل العساكر</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                          إحصائيات مباشرة
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ترتيب القطاعات حسب عدد الطلبات المنجزة، وقائمة بأفضل العساكر والمتقدمين بدرجات الاختبارات.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab('stats')}
                      className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all shadow-sm"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>عرض الرسوم البيانية (Recharts) 📊</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLeaderboard(!showLeaderboard)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors"
                    >
                      <span>{showLeaderboard ? 'طي المتصدرين' : 'عرض المتصدرين'}</span>
                    </button>
                  </div>
                </div>

                {showLeaderboard && (
                  <div className="space-y-4 relative z-10">
                    {/* 1. Sectors Leaderboard Cards */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>ترتيب القطاعات حسب عدد الطلبات المقدمة:</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          (اضغط على أي قطاع لتصفية طلباته أدناه فوراً)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {sectorsRanked.map((item, idx) => {
                          const isSelected = sectorFilter === item.sector.id;
                          return (
                            <button
                              key={item.sector.id}
                              type="button"
                              onClick={() => setSectorFilter(isSelected ? 'all' : item.sector.id)}
                              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg ring-1 ring-amber-400/40 scale-[1.02]'
                                  : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-white font-mono">{item.sector.name}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                  idx === 0 
                                    ? 'bg-amber-500 text-black font-black' 
                                    : idx === 1 
                                    ? 'bg-slate-300 text-black font-black' 
                                    : idx === 2 
                                    ? 'bg-amber-700 text-white' 
                                    : 'bg-white/10 text-slate-400'
                                }`}>
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-black text-amber-400 font-mono">
                                  {item.count} <span className="text-[10px] font-normal text-slate-400">طلب</span>
                                </span>
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  {item.acceptedCount} مقبول
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Top Military / Applicants */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Medal className="w-4 h-4 text-emerald-400" />
                          <span>
                            أفضل العساكر والمتقدمين {sectorFilter !== 'all' ? `(في قطاع ${sectors.find(s => s.id === sectorFilter)?.name})` : '(بشكل عام)'}:
                          </span>
                        </span>
                        {sectorFilter !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setSectorFilter('all')}
                            className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                          >
                            عرض المتصدرين في كافة القطاعات
                          </button>
                        )}
                      </div>

                      {topMilitaryList.length === 0 ? (
                        <div className="p-3.5 text-center text-xs text-slate-500 bg-black/30 rounded-xl border border-white/5">
                          لا توجد طلبات مسجلة بعد في هذا التصنيف.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {topMilitaryList.slice(0, 3).map((app, idx) => (
                            <div
                              key={app.id}
                              className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2 hover:border-amber-500/30 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                  idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                                }`}>
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">{app.playerName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    الرقم: {app.militaryNo} · {app.sectorName}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  app.status === 'مقبول' 
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                }`}>
                                  {Math.round((app.score / (app.totalQuestions || 5)) * 100)}%
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedApp(app)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors"
                                  title="عرض تفاصيل الطلب الكاملة"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090b10] p-4 rounded-xl border border-white/5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو الرقم العسكري أو الديسكورد..."
                    className="w-full pr-10 pl-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="مقبول">مقبول</option>
                    <option value="مرفوض">مرفوض</option>
                  </select>

                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {isSuperAdmin && <option value="all">كل القطاعات</option>}
                    {!isSuperAdmin && userAllowedSectors.length > 1 && (
                      <option value="all">كافة قطاعاتي المصرحة</option>
                    )}
                    {userAllowedSectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.arabicName || s.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير</span>
                  </button>
                </div>
              </div>

              {/* Retention Note */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>يتم حفظ آخر 30 طلباً خلال الأسبوع وتحديث اليونت تلقائياً.</span>
                <span className="font-mono text-amber-400">{filteredApps.length} طلبات</span>
              </div>

              {/* Applications List */}
              {filteredApps.length === 0 ? (
                <div className="p-12 text-center bg-[#090b10] rounded-xl border border-white/5 text-slate-400 text-xs">
                  لا توجد طلبات تطابق معايير البحث والفرز حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-[#090b10] border border-white/5 hover:border-white/15 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-amber-400 font-mono text-xs shrink-0">
                          <span className="font-bold">{app.currentUnit || 'M-00'}</span>
                          <span className="text-[9px] text-slate-400 font-normal">اليونت</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-sm">{app.fullName}</span>
                            <span className="text-xs text-slate-400">({app.playerName})</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 font-mono">
                              {app.sectorName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <span>الرقم العسكري: <span className="font-mono text-white">{app.militaryNo}</span></span>
                            <span>·</span>
                            <span>الديسكورد: <span className="font-mono text-slate-300">{app.discordId}</span></span>
                            <span>·</span>
                            <span>النتيجة: <span className="text-emerald-400 font-bold">{app.score}/{app.totalQuestions}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          app.status === 'مقبول'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : app.status === 'مرفوض'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {app.status}
                        </span>

                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="عرض التفاصيل والمرفقات"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {app.status !== 'مقبول' && (
                          <button
                            onClick={() => handleOpenHiringModal(app)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                            title="إتمام التوظيف وتعيين الرتبة واليونت"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">إتمام التوظيف</span>
                          </button>
                        )}

                        {app.status !== 'مرفوض' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'مرفوض')}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                            title="رفض الطلب"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB: طلبات النقل والفصل العسكري */}
          {activeTab === 'transfers' && (
            <div className="bg-[#090b10] border border-amber-500/25 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                <span>قريباً 🔒</span>
                <span className="text-slate-500">•</span>
                <span>مغلق حالياً للتطوير</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  إدارة طلبات النقل والفصل العسكري
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  تم قفل هذه الشاشة مؤقتاً للتعديل والتطوير عليها لاحقاً بناءً على توجيهات القيادة في السيرفر العسكري PRAVA.
                </p>
              </div>
            </div>
          )}

          {false && activeTab === 'transfers' && (
            <div className="space-y-6">

              {/* Informational Header & Quick Stats */}
              <div className="bg-[#090b10] border border-amber-500/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        <span>إدارة طلبات النقل بين القطاعات وفصل الخدمة</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                          نظام الأسبقية والرتب
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        هنا يستطيع المسؤول اعتماد نقل العسكري لقطاع آخر وتعيين رتبته وبروتوكوله الجديد، أو اعتماد فصل العسكري وإسقاط رتبته القديمة.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchData}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>تحديث الطلبات</span>
                    </button>
                  </div>
                </div>

                {/* Quick KPI stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-0.5">إجمالي الطلبات</span>
                    <span className="text-lg font-black text-white font-mono">{personnelRequests.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[11px] text-amber-300 block mb-0.5">طلبات قيد المراجعة</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {personnelRequests.filter(r => r.status === 'قيد المراجعة').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-[11px] text-cyan-300 block mb-0.5">طلبات النقل المعلقة</span>
                    <span className="text-lg font-black text-cyan-400 font-mono">
                      {personnelRequests.filter(r => r.type === 'transfer' && r.status === 'قيد المراجعة').length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[11px] text-rose-300 block mb-0.5">طلبات الفصل المعلقة</span>
                    <span className="text-lg font-black text-rose-400 font-mono">
                      {personnelRequests.filter(r => r.type === 'discharge' && r.status === 'قيد المراجعة').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Type Filter */}
                  <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setPersonnelTypeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        personnelTypeFilter === 'all'
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      كافة الأنواع
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonnelTypeFilter('transfer')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        personnelTypeFilter === 'transfer'
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>نقل قطاع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonnelTypeFilter('discharge')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        personnelTypeFilter === 'discharge'
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserMinus className="w-3 h-3" />
                      <span>فصل عسكري</span>
                    </button>
                  </div>

                  {/* Status Filter */}
                  <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
                    {(['all', 'قيد المراجعة', 'مقبول', 'مرفوض'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPersonnelStatusFilter(st)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                          personnelStatusFilter === st
                            ? 'bg-white/20 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st === 'all' ? 'الكل' : st}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-xs text-slate-400 font-mono text-left">
                  عرض {personnelRequests.filter(r => (personnelTypeFilter === 'all' || r.type === personnelTypeFilter) && (personnelStatusFilter === 'all' || r.status === personnelStatusFilter)).length} طلب
                </span>
              </div>

              {/* Requests List */}
              {(() => {
                const list = personnelRequests.filter(r => 
                  (personnelTypeFilter === 'all' || r.type === personnelTypeFilter) && 
                  (personnelStatusFilter === 'all' || r.status === personnelStatusFilter)
                );

                if (list.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-2xl bg-[#090b10] border border-white/5 space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
                        <ArrowLeftRight className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-white text-sm">لا توجد طلبات في هذا التصنيف</h5>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        تظهر هنا جميع طلبات النقل وفصل الخدمة المقدمة من العساكر لمراجعتها واعتمادها.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3.5">
                    {list.map((req) => {
                      const isPending = req.status === 'قيد المراجعة';
                      const isApproved = req.status === 'مقبول';
                      const isRejected = req.status === 'مرفوض';
                      const isTransfer = req.type === 'transfer';

                      return (
                        <div
                          key={req.id}
                          className="p-5 rounded-2xl bg-[#090b10] border border-white/10 hover:border-amber-500/30 transition-all space-y-4"
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {/* Request Type Badge */}
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1.5 ${
                                isTransfer 
                                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' 
                                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}>
                                {isTransfer ? <ArrowLeftRight className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                                <span>{isTransfer ? 'طلب نقل لقطاع آخر' : 'طلب فصل وإنهاء خدمة'}</span>
                              </span>

                              {/* Status Badge */}
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1 ${
                                isApproved 
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : isRejected
                                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>{req.status}</span>
                              </span>

                              <span className="text-[11px] text-slate-400 font-mono">
                                المعرف: #{req.id.slice(-6)}
                              </span>
                            </div>

                            <span className="text-[11px] text-slate-400 font-mono">
                              {req.createdAt ? new Date(req.createdAt).toLocaleString('ar-SA') : ''}
                            </span>
                          </div>

                          {/* Soldier Identity & Service Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Applicant Info */}
                            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                              <span className="text-slate-400 font-bold block text-[11px] border-b border-white/5 pb-1">
                                بيانات العسكري مقدم الطلب:
                              </span>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">الاسم / الرتبة:</span>
                                <span className="font-bold text-white">{req.applicantDisplayName}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">اسم المستخدم (اليوزر):</span>
                                <span className="font-mono text-amber-300">@{req.applicantUsername}</span>
                              </div>
                              {req.applicantGameId && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">آيدي اللعبة (Game ID):</span>
                                  <span className="font-mono text-white">{req.applicantGameId}</span>
                                </div>
                              )}
                              {req.applicantDiscord && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">الديسكورد:</span>
                                  <span className="font-mono text-slate-300">{req.applicantDiscord}</span>
                                </div>
                              )}
                            </div>

                            {/* Service Status: Old vs New Sector */}
                            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                              <span className="text-slate-400 font-bold block text-[11px] border-b border-white/5 pb-1">
                                مسار الخدمة العسكرية:
                              </span>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">القطاع الحالي:</span>
                                <span className="font-bold text-amber-300">{req.currentSectorName}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">الرتبة والبروتوكول الحالي:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white font-bold">{req.currentRank || 'جندي'}</span>
                                  {req.currentProtocol && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                                      [{req.currentProtocol}]
                                    </span>
                                  )}
                                  {req.currentUnit && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">
                                      {req.currentUnit}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isTransfer && (
                                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                  <span className="text-cyan-400 font-bold">القطاع المطلوب النقل إليه:</span>
                                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-black">
                                    {req.targetSectorName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs">
                            <span className="text-slate-400 font-bold block mb-1">سبب الطلب الموضح من العسكري:</span>
                            <p className="text-slate-200 leading-relaxed font-semibold italic bg-black/40 p-2.5 rounded-lg border border-white/5">
                              "{req.reason}"
                            </p>
                          </div>

                          {/* Review Details if processed */}
                          {(isApproved || isRejected) && (
                            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                              isApproved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}>
                              <div className="flex items-center justify-between font-bold">
                                <span>تم التدقيق بواسطة: {req.reviewedBy || 'القيادة'}</span>
                                <span className="font-mono text-[11px] opacity-75">{req.reviewedAt ? new Date(req.reviewedAt).toLocaleString('ar-SA') : ''}</span>
                              </div>
                              {isApproved && isTransfer && req.assignedNewRank && (
                                <div className="text-slate-200 pt-1 flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white">البيانات الجديدة بالقطاع:</span>
                                  <span className="text-amber-300 font-bold">الرتبة: {req.assignedNewRank}</span>
                                  {req.assignedNewProtocol && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                                      بادئة البروتوكول: [{req.assignedNewProtocol}]
                                    </span>
                                  )}
                                  {req.assignedNewUnit && (
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                                      اليونت: {req.assignedNewUnit}
                                    </span>
                                  )}
                                </div>
                              )}
                              {req.reviewerNotes && (
                                <div className="text-[11px] text-slate-300 pt-0.5">
                                  ملاحظات التدقيق: {req.reviewerNotes}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons for Pending Requests */}
                          {isPending && (
                            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-end gap-2.5">
                              {isTransfer ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenApproveTransfer(req)}
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${theme.buttonClass} shadow-lg active:scale-95`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>مراجعة واعتماد النقل وتعيين الرتبة الجديدة 🎖️</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isProcessingDischarge === req.id}
                                  onClick={() => handleApproveDischarge(req)}
                                  className="px-4 py-2 rounded-xl text-xs font-black bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95"
                                >
                                  {isProcessingDischarge === req.id ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>جاري اعتماد الفصل...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserMinus className="w-4 h-4" />
                                      <span>اعتماد الفصل وإنهاء الخدمة وإسقاط الرتبة ⚠️</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingRequest(req);
                                  setRejectionNotes('');
                                }}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض الطلب</span>
                              </button>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          )}

          {/* TAB: كشف وإدارة اليونتات والعساكر الميداني */}
          {activeTab === 'units' && (
            <div className="bg-[#090b10] border border-amber-500/25 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                <span>قريباً 🔒</span>
                <span className="text-slate-500">•</span>
                <span>مغلق حالياً للتطوير</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  كشف وتوزيع اليونتات والعساكر
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  تم قفل نظام كشف اليونتات وقواعد ترقيم الوحدات مؤقتاً للتعديل والتطوير عليها لاحقاً بناءً على توجيهات السيرفر العسكري PRAVA.
                </p>
              </div>
            </div>
          )}

          {false && activeTab === 'units' && (
            <AdminUnitsManager
              unitRules={unitRules.filter((r) => isSuperAdmin || r.sectorId === 'all' || hasSectorAccess(r.sectorId))}
              onUpdateUnitRules={handleUpdateUnitRules}
              applications={userAllowedApplications}
              onUpdateApplication={(updatedApp) => {
                const updatedList = applications.map((a) => (a.id === updatedApp.id ? updatedApp : a));
                setApplications(updatedList);
              }}
              sectors={userAllowedSectors}
              ranks={ranksList}
              currentUser={currentUser}
              onOpenAppDetail={(app) => {
                setSelectedApp(app);
                setActiveTab('applications');
              }}
            />
          )}

          {/* TAB: لوحة الإحصائيات والرسوم البيانية للقطاعات (Recharts) */}
          {activeTab === 'stats' && (
            <div className="bg-[#090b10] border border-amber-500/25 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                <span>قريباً 🔒</span>
                <span className="text-slate-500">•</span>
                <span>مغلق حالياً للتطوير</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  لوحة الإحصائيات والرسوم البيانية
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  تم قفل لوحة الإحصائيات مؤقتاً للتعديل والتطوير عليها لاحقاً مع مؤشرات أداء تفصيلية متقدمة.
                </p>
              </div>
            </div>
          )}

          {false && activeTab === 'stats' && (
            <AdminStatsDashboard
              applications={userAllowedApplications}
              sectors={userAllowedSectors}
              personnelRequests={personnelRequests.filter((r) => isSuperAdmin || hasSectorAccess(r.currentSectorId) || (r.targetSectorId && hasSectorAccess(r.targetSectorId)))}
              onSelectSectorFilter={(secId) => {
                if (hasSectorAccess(secId)) {
                  setSectorFilter(secId);
                  setActiveTab('applications');
                }
              }}
              onRefreshData={fetchData}
            />
          )}

          {/* TAB: شاشة إدارة الإعلانات والتعميمات المنبثقة التفاعلية (15 مؤثر تفاعلي) */}
          {activeTab === 'announcements' && (
            <AdminAnnouncementManager
              settings={editableSettings}
              onSaveSettings={handleSaveServerSettings}
              currentUser={currentUser}
            />
          )}

          {/* TAB: شاشة المطور واستوديو تعديل الأصوات بالكامل */}
          {activeTab === 'developer' && (
            <AdminDeveloperManager
              settings={editableSettings}
              onSaveSettings={handleSaveServerSettings}
              currentUser={currentUser}
            />
          )}

          {/* TAB 2: Leaders and Granular Permissions Management */}
          {activeTab === 'leaders' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <h4 className="font-extrabold text-white text-base">إدارة الحسابات وتحديد الصلاحيات الدقيقة</h4>
                  <p className="text-xs text-slate-400">
                    تحكم بالصلاحيات التفصيلية لكل قائد أو مسؤول توظيف (قبول/رفض، تعديل قطاعات، تعديل يونت، تغيير شعار، إنشاء حسابات).
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateUser}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass} shadow-md`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ إضافة حساب / مسؤول توظيف جديد</span>
                </button>
              </div>

              {/* Password & Credential Security Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-white block">حماية مشددة لكلمات المرور (PBKDF2-SHA512 + Salt)</span>
                    <span className="text-[11px] text-emerald-300/80">كافة كلمات المرور مشفرة بتجزئة غير قابلة للعكس مع ملح عشوائي 100,000 دورة، ولا يتم تخزين أي كلمة مرور كنص مجرد.</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-mono font-bold shrink-0">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>تشفير أحادي الاتجاه مفعّل 🔒</span>
                </div>
              </div>

              {/* PENDING ACCOUNTS APPROVAL BANNER & LIST */}
              {pendingUsers.length > 0 && (
                <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-black border-2 border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-base flex items-center gap-2">
                          <span>طلبات الحسابات الجديدة بانتظار الاعتماد وتعيين الرتب</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-black">
                            {pendingUsers.length} طلبات معلقة
                          </span>
                        </h4>
                        <p className="text-xs text-amber-200/80">
                          قام هؤلاء المستخدمون بإنشاء حسابات وهم بانتظار موافقتك لتفعيلهم وتحديد رتبهم وصلاحياتهم.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {pendingUsers.map((pu) => (
                      <div
                        key={pu.id}
                        className="p-4 rounded-xl bg-black/60 border border-amber-500/30 flex flex-col justify-between gap-3 hover:border-amber-400/60 transition-all shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm">{pu.displayName || pu.username}</span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-amber-300">
                                @{pu.username}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              بانتظار التفعيل ⏳
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 font-mono space-y-1 bg-black/40 p-2.5 rounded-lg border border-white/5">
                            {pu.gameId && <div>الآيدي داخل اللعبة: <span className="text-white font-bold">{pu.gameId}</span></div>}
                            {pu.discordUsername && <div>الديسكورد: <span className="text-emerald-400">{pu.discordUsername}</span></div>}
                            {pu.registeredDeviceId && (
                              <div className="text-[10px] text-slate-400 truncate">
                                رقم الجهاز: <span className="text-slate-300">{pu.registeredDeviceId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(pu)}
                            className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>تفعيل وتعيين الرتبة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickApprove(pu)}
                            className="py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                            title="تفعيل سريع كـ ضابط قبول"
                          >
                            <Check className="w-4 h-4" />
                            <span>قبول سريع</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectUser(pu.id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                            title="رفض الطلب"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts Cards List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>قائمة الحسابات والمسؤولين المفعلين في المنظومة</span>
                  <span className="font-mono text-emerald-400">{activeUsers.length} حساب مفعل</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeUsers.map((u) => {
                  const p = u.permissions || {};
                  return (
                    <div 
                      key={u.id}
                      className="p-5 rounded-2xl bg-[#090b10] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all space-y-4 shadow"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-base">{u.displayName}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-slate-400">
                              @{u.username}
                            </span>
                          </div>

                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            u.role === 'owner' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : u.role === 'leader'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}>
                            {u.roleTitle}
                          </span>
                        </div>

                        {/* Extra metadata */}
                        <div className="text-xs text-slate-400 space-y-1 font-mono mb-3">
                          {u.gameId && <div>الآيدي داخل اللعبة: <span className="text-white">{u.gameId}</span></div>}
                          {u.discordUsername && <div>الديسكورد: <span className="text-white">{u.discordUsername}</span></div>}
                          <div>
                            القطاعات المصرح بها: {' '}
                            <span className="text-amber-400 font-bold">
                              {p.allowedSectors?.includes('*') ? 'كافة القطاعات (*)' : (p.allowedSectors || []).join('، ')}
                            </span>
                          </div>
                        </div>

                        {/* Detailed Permissions Badges */}
                        <div className="pt-3 border-t border-white/5">
                          <span className="text-[10px] text-slate-500 block mb-1.5 font-bold">الصلاحيات المفعّلة:</span>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {p.canAcceptApps && <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ قبول الطلبات</span>}
                            {p.canRejectApps && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">✓ رفض الطلبات</span>}
                            {p.canDeleteApps && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ حذف الطلبات</span>}
                            {p.canExportApps && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ تصدير البيانات</span>}
                            {p.canToggleSector && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ فتح/إغلاق التقديم</span>}
                            {p.canEditUnitPrefix && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">✓ تعديل بادئة اليونت (M-)</span>}
                            {p.canEditRolesTemplate && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ تعديل قوالب الرولات</span>}
                            {p.canChangeServerLogo && <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">✓ تغيير شعار السيرفر</span>}
                            {p.canManageAccounts && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">✓ إدارة الحسابات</span>}
                            {p.canCreateRecruitmentOfficers && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">⭐ إنشاء مسؤولي التوظيف</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Edit Permissions & Delete) */}
                      <div className="pt-3 flex items-center justify-between border-t border-white/5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل الصلاحيات</span>
                        </button>

                        {u.role !== 'owner' && u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

            </div>
          )}

          {/* TAB: Ranks & Protocols Hub (البروتوكولات والرتب ومنشنات الديسكورد) */}
          {activeTab === 'ranks_protocols' && (
            <div className="space-y-6">

              {/* Header Card */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <span>إدارة البروتوكولات والرتب العسكرية ومنشنات الديسكورد</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          {ranksList.length} رتبة · {protocolsList.length} بروتوكول
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        لوحة التحكم المركزية لضبط التسلسل القيادي، ربط رولات الديسكورد بالمنشنات (`&lt;@&amp;RoleID&gt;`)، وصياغة اللوائح الميدانية ورسائل التوظيف.
                      </p>
                    </div>
                  </div>

                  {/* Sub-tab Switcher */}
                  <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setRanksSubTab('ranks')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ranksSubTab === 'ranks'
                          ? 'bg-amber-500 text-black font-black shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>الرتب والمنشنات ({ranksList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRanksSubTab('protocols')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ranksSubTab === 'protocols'
                          ? 'bg-amber-500 text-black font-black shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>البروتوكولات ({protocolsList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRanksSubTab('template')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        ranksSubTab === 'template'
                          ? 'bg-amber-500 text-black font-black shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>صيغة التوظيف والرولات</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab Action Bar */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {ranksSubTab === 'ranks' && (
                    <>
                      <div className="text-slate-400 flex items-center gap-2">
                        <span>💡 يمكنك إعادة ترتيب الرتب بالأسهم وتعديل آيدي رول الديسكورد ليرتبط بالمنشن فوراً.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRestoreDefaultRanks}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold transition-colors cursor-pointer"
                        >
                          استعادة الرتب الافتراضية
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAddRank}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${theme.buttonClass}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة رتبة عسكرية</span>
                        </button>
                      </div>
                    </>
                  )}

                  {ranksSubTab === 'protocols' && (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          { id: 'all', label: 'كافة اللوائح' },
                          { id: 'recruitment', label: 'التوظيف والمباشرة' },
                          { id: 'radio', label: 'الراديو والعمليات' },
                          { id: 'operations', label: 'قواعد الاشتباك (ROE)' },
                          { id: 'conduct', label: 'الانضباط والمساءلة' },
                          { id: 'promotions', label: 'الترقيات' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setProtocolCategoryFilter(cat.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              protocolCategoryFilter === cat.id
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-black/30 text-slate-400 hover:text-white border border-white/5'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRestoreDefaultProtocols}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold transition-colors cursor-pointer"
                        >
                          استعادة اللوائح الافتراضية
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAddProtocol}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${theme.buttonClass}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة بروتوكول جديد</span>
                        </button>
                      </div>
                    </>
                  )}

                  {ranksSubTab === 'template' && (
                    <div className="text-slate-400">
                      <span>تخصيص نص الإشعار الرسمي المرسل لشات كبار الضباط وديسكورد مع ربط منشنات الرول واليونت.</span>
                    </div>
                  )}
                </div>

              </div>

              {/* SUBTAB 1: RANKS & DISCORD MENTIONS */}
              {ranksSubTab === 'ranks' && (
                <div className="space-y-4">

                  {/* Informational Banner */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">آلية عمل منشنات الرتب في ديسكورد:</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        عند إدخال آيدي رول الديسكورد (Discord Role ID) في الرتبة، يتم حفظ صيغة المنشن <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">&lt;@&amp;RoleID&gt;</code> تلقائياً. عند قبول طلب التوظيف أو إرسال الإشعار الرسمي يتم تبديل المتغير <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">&#123;rankRole&#125;</code> بمنشن الرول المربوط مما يتيح التفاعل الفوري في سيرفر الديسكورد.
                      </p>
                    </div>
                  </div>

                  {/* Sector Filter Bar for Ranks */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/10 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>تصفية الرتب حسب القطاع:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setRanksSectorFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          ranksSectorFilter === 'all'
                            ? 'bg-amber-500 text-black shadow'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        كافة القطاعات ({ranksList.length})
                      </button>
                      {sectors.map((s) => {
                        const secCount = ranksList.filter(r => r.sectorId === s.id).length;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setRanksSectorFilter(s.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              ranksSectorFilter === s.id
                                ? 'bg-amber-500 text-black shadow'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{s.arabicName || s.name}</span>
                            <span className="text-[10px] opacity-75">({secCount})</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddRank}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${theme.buttonClass}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة رتبة جديدة</span>
                    </button>
                  </div>

                  {/* Ranks Table */}
                  <div className="bg-[#090b10] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-white text-sm">
                          قائمة الرتب المعتمدة {ranksSectorFilter !== 'all' ? `(قطاع ${sectors.find(s => s.id === ranksSectorFilter)?.name})` : ''} 
                          ({ranksList.filter(r => ranksSectorFilter === 'all' || r.sectorId === ranksSectorFilter || r.sectorId === 'all').length})
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        مرتبة تصاعدياً حسب الأسبقية العسكرية والبروتوكول
                      </span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {ranksList
                        .filter(r => ranksSectorFilter === 'all' || r.sectorId === ranksSectorFilter || r.sectorId === 'all' || !r.sectorId)
                        .map((rank, index) => {
                        const hasRole = !!rank.discordRoleId;
                        const roleMention = rank.discordRoleMention || (rank.discordRoleId ? `<@&${rank.discordRoleId}>` : '');
                        const isOfficer = rank.rankType === 'officer' || rank.protocolPrefix?.startsWith('I');

                        return (
                          <div 
                            key={rank.id} 
                            className="p-4 rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-0"
                          >
                            {/* Rank Info */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Order & Reorder Buttons */}
                              <div className="flex flex-col items-center justify-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleReorderRank(index, 'up')}
                                  disabled={index === 0}
                                  className="text-slate-500 hover:text-amber-400 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed p-0.5"
                                  title="تحريك لأعلى"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 h-6 rounded-lg bg-black/50 border border-white/10 text-slate-300 text-[11px] font-mono font-bold flex items-center justify-center">
                                  {rank.order || index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleReorderRank(index, 'down')}
                                  disabled={index === ranksList.length - 1}
                                  className="text-slate-500 hover:text-amber-400 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed p-0.5"
                                  title="تحريك لأسفل"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Badge & Title */}
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                <SmartBadge badge={rank.badge} defaultIcon="rank" className="w-full h-full object-contain" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-white text-sm truncate">{rank.name}</span>

                                  {/* Protocol Prefix Badge (M-1, M-2, I-2) */}
                                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-black border shrink-0 ${
                                    isOfficer
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                  }`}>
                                    [{rank.protocolPrefix || (isOfficer ? 'I-1' : 'M-1')}]
                                  </span>

                                  {/* Rank Type Badge */}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                    isOfficer
                                      ? 'bg-purple-500/10 text-purple-400'
                                      : 'bg-emerald-500/10 text-emerald-400'
                                  }`}>
                                    {isOfficer ? 'رتبة ضباط' : 'رتبة أفراد'}
                                  </span>

                                  {rank.sectorId && rank.sectorId !== 'all' ? (
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold shrink-0">
                                      {sectors.find(s => s.id === rank.sectorId)?.arabicName || rank.sectorId}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[10px] shrink-0">
                                      كافة القطاعات
                                    </span>
                                  )}
                                </div>
                                {rank.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{rank.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Dual Discord Roles: Primary & Secondary */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {/* 1. Primary Role (الديسكورد الأساسي) */}
                              {hasRole ? (
                                <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1.5 rounded-xl border border-emerald-500/40 shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                  <div className="text-right">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-emerald-400 font-bold">الديسكورد:</span>
                                      <span className="font-mono text-xs text-white select-all">{rank.discordRoleId}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[9px] text-slate-400">المنشن:</span>
                                      <span className="font-mono text-[11px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                        {roleMention}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyRankMention(roleMention, rank.id)}
                                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                                    title="نسخ صيغة المنشن الأساسي"
                                  >
                                    {copiedRankMentionId === rank.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-amber-500/20 text-amber-400 text-[11px]">
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                  <span>الديسكورد: غير محدد</span>
                                </div>
                              )}

                              {/* 2. Secondary Role (الديسكورد الثانوي / السيرفر العسكري) */}
                              {rank.secondaryRoleId ? (
                                <div className="flex items-center gap-2 bg-purple-950/20 px-2.5 py-1.5 rounded-xl border border-purple-500/40 shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                                  <div className="text-right">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-purple-300 font-bold">دس 2:</span>
                                      <span className="font-mono text-xs text-white select-all">{rank.secondaryRoleId}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[9px] text-slate-400">المنشن:</span>
                                      <span className="font-mono text-[11px] text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                                        {rank.secondaryRoleMention || `<@&${rank.secondaryRoleId}>`}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopySecondaryRankMention(rank.secondaryRoleMention || `<@&${rank.secondaryRoleId}>`, rank.id)}
                                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                                    title="نسخ صيغة المنشن الثانوي"
                                  >
                                    {copiedSecondaryRankMentionId === rank.id ? (
                                      <Check className="w-3.5 h-3.5 text-purple-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/5 text-slate-500 text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                                  <span>دس 2: اختياري</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 self-end xl:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRank(rank)}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRank(rank.id)}
                                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                title="حذف الرتبة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* SUBTAB 2: PROTOCOLS & FIELD SOP */}
              {ranksSubTab === 'protocols' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {protocolsList
                      .filter((p) => protocolCategoryFilter === 'all' || p.category === protocolCategoryFilter)
                      .map((proto) => (
                        <div
                          key={proto.id}
                          className={`bg-[#090b10] border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                            proto.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
                          }`}
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/5 gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                  {proto.categoryLabel || proto.category}
                                </span>
                                {proto.sectorId && proto.sectorId !== 'all' && (
                                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">
                                    {sectors.find(s => s.id === proto.sectorId)?.arabicName || proto.sectorId}
                                  </span>
                                )}
                              </div>

                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                                <span>{proto.isActive ? 'مفعّل' : 'معطّل'}</span>
                                <input
                                  type="checkbox"
                                  checked={proto.isActive}
                                  onChange={() => handleToggleProtocolActive(proto.id)}
                                  className="rounded text-amber-500 cursor-pointer"
                                />
                              </label>
                            </div>

                            {/* Card Title & Content */}
                            <div className="pt-3 space-y-2">
                              <h5 className="font-black text-white text-sm">{proto.title}</h5>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-black/30 p-3 rounded-xl border border-white/5">
                                {proto.content}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono">
                              آخر تحديث: {proto.updatedAt ? new Date(proto.updatedAt).toLocaleDateString('ar-SA') : 'معتمد'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProtocol(proto)}
                                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProtocol(proto.id)}
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: RECRUITMENT MESSAGE TEMPLATE */}
              {ranksSubTab === 'template' && (
                <div className="space-y-6 bg-[#090b10] border border-white/10 rounded-2xl p-6 shadow-xl">
                  <div>
                    <h4 className="font-extrabold text-white text-base mb-1">
                      صيغة رسالة التوظيف ومنشنات الرول المعتمدة
                    </h4>
                    <p className="text-xs text-slate-400">
                      تُرسل هذه الصيغة تلقائياً عند قبول أي متقدم وتعيين رتبته ويونته إلى ويب هوك كبار الضباط وبوت الديسكورد، مع إمكانية نسخها يدوياً.
                    </p>
                  </div>

                  {/* Variables helper chips */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 block">المتغيرات المتاحة للربط التلقائي (اضغط للإدراج):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { tag: '{applicantName}', desc: 'اسم المتقدم' },
                        { tag: '{applicantGameId}', desc: 'هوية اللعبة' },
                        { tag: '{sectorName}', desc: 'اسم القطاع' },
                        { tag: '{unit}', desc: 'اليونت الرباعي (SWAT-15)' },
                        { tag: '{rank}', desc: 'اسم الرتبة' },
                        { tag: '{rankRole}', desc: 'منشن رول الديسكورد (<@&ID>)' },
                        { tag: '{militaryNo}', desc: 'الرقم العسكري' },
                        { tag: '{officerName}', desc: 'مسؤول التوظيف' },
                        { tag: '{officerGameId}', desc: 'هوية المسؤول' },
                        { tag: '{discordId}', desc: 'منشن حساب المتقدم' },
                      ].map((chip) => (
                        <button
                          key={chip.tag}
                          type="button"
                          onClick={() => {
                            const cur = editableSettings.seniorOfficersMessageTemplate || '';
                            const updated = cur + ' ' + chip.tag;
                            setEditableSettings({ ...editableSettings, seniorOfficersMessageTemplate: updated });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="font-bold text-amber-400">{chip.tag}</span>
                          <span className="text-[10px] text-slate-400">({chip.desc})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      قالب الرسالة الرسمية (Markdown)
                    </label>
                    <textarea
                      rows={6}
                      value={editableSettings.seniorOfficersMessageTemplate !== undefined
                        ? editableSettings.seniorOfficersMessageTemplate
                        : '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرتبة العسكرية:** {rank} ({rankRole})\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}'}
                      onChange={(e) => setEditableSettings({ ...editableSettings, seniorOfficersMessageTemplate: e.target.value })}
                      dir="rtl"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed"
                    />
                  </div>

                  {/* Live Simulation Preview */}
                  <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>معاينة حية لشكل الرسالة عند إرسالها إلى الديسكورد:</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        محاكاة ديسكورد الفعلية
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#2b2d31] border border-white/5 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed select-none">
                      {(editableSettings.seniorOfficersMessageTemplate || '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرتبة العسكرية:** {rank} ({rankRole})\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}')
                        .replace(/{applicantGameId}/g, '2584')
                        .replace(/{officerGameId}/g, currentUser.gameId || '12465')
                        .replace(/{officerName}/g, currentUser.displayName || '12465')
                        .replace(/{applicantName}/g, 'فهد العتيبي')
                        .replace(/{sectorName}/g, 'سوات SWAT')
                        .replace(/{unit}/g, 'SWAT-15')
                        .replace(/{rank}/g, 'جندي أول')
                        .replace(/{rankRole}/g, '<@&1519090327707979786>')
                        .replace(/{militaryNo}/g, '15')
                        .replace(/{discordId}/g, '<@399182746591028374>')}
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveServerSettings()}
                      disabled={savingSettings}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${theme.buttonClass}`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ صيغة رسالة التوظيف'}</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: Settings & Identity */}
          {activeTab === 'settings' && (
            <div className="w-full space-y-6">
              
              {/* SERVER IDENTITY SECTION */}
              {(phoneSettingsSection === 'identity' || phoneSettingsSection === 'all') && (
                <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Sparkles className="w-5 h-5" />
                      <h4 className="font-extrabold text-white text-base">تخصيص هوية وشعار السيرفر</h4>
                    </div>
                  <span className="text-xs text-slate-400">تحديث فوري على كامل الموقع</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Current Logo Preview & Upload */}
                  <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500/40 shadow-xl shrink-0 bg-black">
                      <img 
                        src={editableSettings.serverLogo} 
                        alt="Current Logo" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block mb-1">شعار السيرفر والمنصة</span>
                      <p className="text-[11px] text-slate-400 mb-3">الصورة التي تظهر في الهيدر والواجهة الرئيسية.</p>
                      
                      <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-200 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة جديدة</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Logo URL Input & Server Name */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        أو ضع رابط صورة الشعار مباشرة (URL)
                      </label>
                      <input
                        type="text"
                        value={editableSettings.serverLogo}
                        onChange={(e) => setEditableSettings({ ...editableSettings, serverLogo: e.target.value })}
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        اسم السيرفر المعروض
                      </label>
                      <input
                        type="text"
                        value={editableSettings.serverName || ''}
                        onChange={(e) => setEditableSettings({ ...editableSettings, serverName: e.target.value })}
                        placeholder="سيرفر PRAVA"
                        className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                </div>
              </div>
              )}

              {/* DISCORD INTEGRATION: WEBHOOK, BOT TOKEN, AND CHANNEL ID */}
              {(phoneSettingsSection === 'discord' || phoneSettingsSection === 'all') && (
                <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
                      <div className="flex items-center gap-2.5 text-[#5865F2]">
                        <Bot className="w-5 h-5" />
                    <h4 className="font-extrabold text-white text-base">
                      ربط ديسكورد وبوت التوظيف (الهوك، توكن البوت، ومكان إرسال الرسالة)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    إرسال الإشعارات والطلبات تلقائياً إلى قنوات الديسكورد المحددة
                  </span>
                </div>

                {/* Test Result Toast/Banner */}
                {discordTestResult && (
                  <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                    discordTestResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {discordTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      <span>{discordTestResult.message}</span>
                    </div>
                    <button 
                      onClick={() => setDiscordTestResult(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* 1. Global Webhook URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#5865F2]" />
                      <span>رابط الويب هوك العام (Discord Webhook URL)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.webhookUrl || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, webhookUrl: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      يتم إرسال إشعار فوري بكافة طلبات التقديم الجديدة مع التفاصيل لهذا الرابط.
                    </span>
                  </div>

                  {/* 2. Bot Token with AES-256-GCM Protection */}
                  <div className="bg-[#0b101b] border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                            <span>توكن بوت الديسكورد (Discord Bot Token)</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>تشفير عسكري AES-256-GCM</span>
                            </span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowBotToken(!showBotToken)}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-white/5 px-3 py-1 rounded-lg border border-white/10"
                      >
                        {showBotToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showBotToken ? 'إخفاء التوكن' : 'إظهار التوكن'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showBotToken ? 'text' : 'password'}
                        value={editableSettings.botToken || ''}
                        onChange={(e) => setEditableSettings({ ...editableSettings, botToken: e.target.value })}
                        placeholder="MTA2NT... أو اكتب التوكن ليتم تشفيره فورياً بـ AES-256-GCM"
                        dir="ltr"
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-amber-500/30 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left tracking-wider"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>الحالة: التوكن مشفر ومحمي داخل الخادم بتوقيع مصدق (Authenticated Encryption).</span>
                      </div>
                      {editableSettings.botToken?.startsWith('•') && (
                        <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>مشفر ومفعل في الخادم</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-amber-300/80 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      🛡️ <strong>حماية كاملة للتوكن:</strong> التوكن مشفر بمفتاح 256-بت معزول غير قابل للاستخراج، ولا يظهر في أدوات المتصفح أو في ملفات التصدير (ZIP). يمكنك تعديل التوكن في أي وقت بكتابة التوكن الجديد ثم الضغط على &quot;حفظ الإعدادات&quot;.
                    </p>
                  </div>

                  {/* 3. Bot Channel ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>مكان إرسال الرسالة (آيدي روم / قناة البوت)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.discordChannelId || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, discordChannelId: e.target.value })}
                      placeholder="مثال: 124578963214587965"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      الآيدي الرقمي للروم الذي يرسل فيه البوت طلبات المتقدمين في الديسكورد.
                    </span>
                  </div>

                  {/* 4. Roles Channel URL / Discord Server Link */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>مكان إرسال الرسالة (رابط روم طلب الرولات في السيرفر)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.discordRoomUrl || editableSettings.discordUrl || ''}
                      onChange={(e) => setEditableSettings({ 
                        ...editableSettings, 
                        discordRoomUrl: e.target.value,
                        discordUrl: e.target.value || editableSettings.discordUrl 
                      })}
                      placeholder="https://discord.com/channels/... أو رابط السيرفر"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      الرابط الذي يُفتح للمتقدم عند الضغط على "روم الرولات" في المرحلة 3.
                    </span>
                  </div>

                </div>

                {/* Actions & Test Button */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleTestDiscord({
                      webhookUrl: editableSettings.webhookUrl,
                      botToken: editableSettings.botToken,
                      channelId: editableSettings.discordChannelId,
                    })}
                    disabled={isTestingDiscord}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] hover:text-white border border-[#5865F2]/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingDiscord && !testingSectorId ? 'جاري إرسال التجربة...' : 'تجربة إرسال رسالة إلى ديسكورد'}</span>
                  </button>

                  <button
                    onClick={handleSaveServerSettings}
                    disabled={savingSettings}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات ديسكورد والشعار'}</span>
                  </button>
                </div>
              </div>
              )}

              {/* SECONDARY DISCORD SERVER (سيرفر الديسكورد الثاني - مجهز للمستقبل) */}
              {(phoneSettingsSection === 'secondary_discord' || phoneSettingsSection === 'all') && (
                <div className="bg-[#090b10] border border-purple-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
                  <div className="flex items-center gap-2.5 text-purple-400">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                      <Radio className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                        <span>إعدادات سيرفر الديسكورد الثاني (السيرفر العسكري)</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                          السيرفر العسكري
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        تهيئة السيرفر الثاني لمنظومة PRAVA - محجوز وجاهز للتفعيل عند الحاجة
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveServerSettings}
                    disabled={savingSettings}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ بيانات الديسكورد الثاني'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* 1. Secondary Discord Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                      <span>اسم السيرفر الثاني (Secondary Server Name)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.secondaryDiscordName || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, secondaryDiscordName: e.target.value })}
                      placeholder="مثال: PRAVA Military Operations 2"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-purple-500/20 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      الاسم التعريفي لسيرفر الديسكورد الثاني في النظام.
                    </span>
                  </div>

                  {/* 2. Secondary Discord URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                      <span>رابط دعوة / دخول السيرفر الثاني (Invite URL)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.secondaryDiscordUrl || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, secondaryDiscordUrl: e.target.value })}
                      placeholder="https://discord.gg/..."
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-purple-500/20 text-white text-xs font-mono focus:outline-none focus:border-purple-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      رابط الوصول إلى السيرفر الثاني لمنظومة العمليات أو الاحتياط.
                    </span>
                  </div>

                  {/* 3. Secondary Guild ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                      <span>آيدي السيرفر الثاني (Guild ID)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.secondaryDiscordGuildId || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, secondaryDiscordGuildId: e.target.value })}
                      placeholder="مثال: 124578963214587965"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-purple-500/20 text-white text-xs font-mono focus:outline-none focus:border-purple-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      المعرف الرقمي لسيرفر الديسكورد الثاني لربط الرولات والأعضاء مستقبلاً.
                    </span>
                  </div>

                  {/* 4. Secondary Discord Webhook */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-purple-400" />
                      <span>ويب هوك السيرفر الثاني (Secondary Webhook URL)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.secondaryDiscordWebhookUrl || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, secondaryDiscordWebhookUrl: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-purple-500/20 text-white text-xs font-mono focus:outline-none focus:border-purple-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      رابط الويب هوك الخاص بالسيرفر الثاني لإرسال الإشعارات المشتركة عند التفعيل.
                    </span>
                  </div>
                </div>
              </div>
              )}

              {/* SENIOR OFFICERS INTEGRATION & CUSTOM MESSAGE (مكان إرسال الرسالة لكبار الضباط وتخصيص نص الرسالة) */}
              {(phoneSettingsSection === 'senior' || phoneSettingsSection === 'all') && (
                <div className="bg-[#090b10] border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <Award className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-white text-base">
                        مكان إرسال الرسالة لكبار الضباط وتخصيص نص رسالة التوظيف
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        يتم إرسال هذا الإشعار تلقائياً إلى شات كبار الضباط المخصص فور اعتماد وقبول أي متقدم
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveServerSettings()}
                      disabled={savingSettings}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
                    </button>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold w-fit">
                      إشعار التوظيف المعتمد
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Senior Officers Webhook URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        <span>مكان إرسال الرسالة: رابط ويب هوك شات كبار الضباط (Webhook URL)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.seniorOfficersWebhookUrl || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, seniorOfficersWebhookUrl: e.target.value })}
                      onBlur={() => handleSaveServerSettings()}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveServerSettings(); }}
                      placeholder="https://discord.com/api/webhooks/... (شات كبار الضباط)"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left transition-colors"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      الرابط المباشر لشات كبار الضباط لاستقبال رسائل التوظيف الفورية (يحفظ تلقائياً).
                    </span>
                  </div>

                  {/* Senior Officers Bot Channel ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        <span>مكان إرسال الرسالة: آيدي روم كبار الضباط للبوت (Channel ID)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.seniorOfficersChannelId || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, seniorOfficersChannelId: e.target.value })}
                      onBlur={() => handleSaveServerSettings()}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveServerSettings(); }}
                      placeholder="مثال: 1556637676902547466"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left transition-colors"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      إذا تم وضع توكن البوت، سيرسل البوت في هذا الشات تلقائياً (يحفظ تلقائياً).
                    </span>
                  </div>
                </div>

                {/* Message Template Customization */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>تخصيص صيغة ونص الرسالة المرسلة لكبار الضباط</span>
                    </label>
                    <span className="text-[10px] text-amber-300">
                      اضغط على أي متغير بالأسفل لإضافته داخل نص الرسالة:
                    </span>
                  </div>

                  {/* Variable insertion buttons */}
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5">
                    {[
                      { tag: '{applicantGameId}', label: 'آيدي المتقدم' },
                      { tag: '{officerGameId}', label: 'آيدي مسؤول التوظيف' },
                      { tag: '{officerName}', label: 'اسم مسؤول التوظيف' },
                      { tag: '{applicantName}', label: 'اسم المتقدم' },
                      { tag: '{sectorName}', label: 'اسم القطاع' },
                      { tag: '{unit}', label: 'اليونت (M-15)' },
                      { tag: '{militaryNo}', label: 'الرقم العسكري' },
                      { tag: '{discordId}', label: 'منشن الديسكورد' },
                    ].map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => {
                          const current = editableSettings.seniorOfficersMessageTemplate || '';
                          setEditableSettings({
                            ...editableSettings,
                            seniorOfficersMessageTemplate: current ? `${current} ${item.tag}` : item.tag,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[11px] font-mono border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="text-amber-400 font-bold">+</span>
                        <span>{item.label}</span>
                        <code className="text-[10px] text-slate-400">({item.tag})</code>
                      </button>
                    ))}
                  </div>

                  {/* Template Textarea */}
                  <textarea
                    rows={4}
                    value={editableSettings.seniorOfficersMessageTemplate !== undefined 
                      ? editableSettings.seniorOfficersMessageTemplate 
                      : '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}'}
                    onChange={(e) => setEditableSettings({ ...editableSettings, seniorOfficersMessageTemplate: e.target.value })}
                    onBlur={() => handleSaveServerSettings()}
                    placeholder="اكتب نص الرسالة هنا..."
                    dir="rtl"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed transition-colors"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>يمكنك استخدام التنسيق العريض `**نص عريض**` والأيقونات والأسطر الجديدة (يحفظ تلقائياً).</span>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultTpl = '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}';
                        const updated = { ...editableSettings, seniorOfficersMessageTemplate: defaultTpl };
                        setEditableSettings(updated);
                        handleSaveServerSettings(updated);
                      }}
                      className="text-amber-400 hover:underline cursor-pointer text-[10px]"
                    >
                      استعادة القالب الافتراضي وحفظه
                    </button>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>معاينة شكل الرسالة كما ستصل لشات كبار الضباط في ديسكورد:</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      محاكاة بيانات حية
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#2b2d31] border border-white/5 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed select-none">
                    {(editableSettings.seniorOfficersMessageTemplate || '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}')
                      .replace(/{applicantGameId}/g, '2584')
                      .replace(/{officerGameId}/g, currentUser.gameId || '15')
                      .replace(/{officerName}/g, currentUser.displayName || 'مسؤول التوظيف')
                      .replace(/{applicantName}/g, 'فهد العتيبي')
                      .replace(/{sectorName}/g, 'SWAT')
                      .replace(/{unit}/g, `${editableSettings.defaultUnitPrefix || 'M-'}15`)
                      .replace(/{militaryNo}/g, '15')
                      .replace(/{discordId}/g, '@fahad_user')}
                  </div>
                </div>

                {/* Senior Officers Actions */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveServerSettings();
                      const testTemplate = editableSettings.seniorOfficersMessageTemplate || 
                        '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}';
                      
                      const simulatedMsg = testTemplate
                        .replace(/{applicantGameId}/g, '2584 (تجربة)')
                        .replace(/{officerGameId}/g, currentUser.gameId || '15')
                        .replace(/{officerName}/g, currentUser.displayName || 'مسؤول التوظيف')
                        .replace(/{applicantName}/g, 'فهد العتيبي (متقدم تجريبي)')
                        .replace(/{sectorName}/g, 'SWAT')
                        .replace(/{unit}/g, `${editableSettings.defaultUnitPrefix || 'M-'}15`)
                        .replace(/{militaryNo}/g, '15')
                        .replace(/{discordId}/g, '@fahad_test');

                      handleTestDiscord({
                        webhookUrl: editableSettings.seniorOfficersWebhookUrl,
                        botToken: editableSettings.botToken,
                        channelId: editableSettings.seniorOfficersChannelId,
                        customMessage: simulatedMsg,
                        isSenior: true,
                      });
                    }}
                    disabled={isTestingDiscord}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingDiscord ? 'جاري إرسال التجربة...' : 'تجربة إرسال رسالة كبار الضباط'}</span>
                  </button>

                  <button
                    onClick={handleSaveServerSettings}
                    disabled={savingSettings}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات كبار الضباط'}</span>
                  </button>
                </div>
              </div>
              )}

          {/* BROADCAST ANNOUNCEMENT BANNER TO DEDICATED SCREEN */}
          {(phoneSettingsSection === 'broadcast' || phoneSettingsSection === 'all') && (
            <div className="bg-gradient-to-r from-amber-950/30 via-black to-[#090b10] border border-amber-500/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Megaphone className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>شاشة الإعلانات والتعميمات المنبثقة التفاعلية</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      15 مؤثر تفاعلي بالصوت والصورة
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تم فصل الإعلانات بالكامل في شاشة مستقلة مع اختيار 15 مؤثر حركي وصوتي ومعاينة فورية ملء الشاشة دون أي قص للصورة.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
              >
                <Megaphone className="w-4 h-4" />
                <span>فتح شاشة الإعلانات المستقلة</span>
                <span>➔</span>
              </button>
            </div>
          )}

          {/* SECTORS SETTINGS: SECTOR HUB OR DEDICATED SECTOR EDIT SCREEN */}
          {(phoneSettingsSection === 'sectors' || phoneSettingsSection === 'all') && (
            <div className="space-y-6">
              {selectedSectorForEditId ? (
                  /* DEDICATED SECTOR EDIT SCREEN */
                  (() => {
                    const secIdx = editableSectors.findIndex((s) => s.id === selectedSectorForEditId);
                    const sec = editableSectors[secIdx];
                    if (!sec || (!isSuperAdmin && !hasSectorAccess(sec.id))) {
                      return (
                        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3">
                          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                          <div className="text-white font-extrabold text-sm sm:text-base">
                            عفواً، ليس لديك صلاحية للدخول أو تعديل هذا القطاع!
                          </div>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            تم تفعيل نظام عزل القطاعات. حسابك مصرح له فقط بقطاعات محددة ولا يمكنك الوصول إلى إعدادات أو بيانات أي قطاع آخر.
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedSectorForEditId(null)}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black cursor-pointer shadow-md transition-all"
                          >
                            العودة إلى قطاعاتك المصرحة ↩
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-[#090b10] border-2 border-amber-500/40 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Top Header of Sector Edit Screen */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-amber-500/20 gap-3 relative z-10">
                          <div className="flex items-center gap-3.5">
                            <SmartBadge
                              badge={sec.badge}
                              defaultIcon="sector"
                              className="w-14 h-14 rounded-2xl border-2 border-amber-500/40 object-cover shadow-lg shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                                  شاشة تعديل القطاع المستقلة
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                  الرمز: {sec.id}
                                </span>
                              </div>
                              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                                تخصيص قطاع: {sec.arabicName || sec.name}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSectorForEditId(null)}
                              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <span>العودة لكافة القطاعات</span>
                              <span>↩</span>
                            </button>

                            <button
                              onClick={() => handleSaveSector(sec)}
                              disabled={savingSectorId === sec.id}
                              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} shadow-md`}
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingSectorId === sec.id ? 'جاري الحفظ...' : 'حفظ تعديلات القطاع'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Sector Switcher Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                          <span className="text-slate-400 font-bold shrink-0 ml-1">تبديل شاشة القطاع:</span>
                          {editableSectors.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedSectorForEditId(s.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                selectedSectorForEditId === s.id
                                  ? 'bg-amber-500 text-black font-black shadow-sm ring-1 ring-amber-300'
                                  : 'bg-black/50 hover:bg-white/10 text-slate-300 border border-white/5'
                              }`}
                            >
                              <SmartBadge
                                badge={s.badge}
                                defaultIcon="sector"
                                className="w-5 h-5 rounded-md object-cover inline-block shrink-0"
                              />
                              <span>{s.arabicName || s.name}</span>
                            </button>
                          ))}
                        </div>

                        {/* 1. DEDICATED SECTOR BADGE & EMBLEM MANAGER */}
                        <div className="bg-black/50 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
                            <div className="flex items-center gap-2 text-amber-400">
                              <ImageIcon className="w-5 h-5" />
                              <h4 className="font-extrabold text-white text-sm sm:text-base">
                                تخصيص وتعديل صورة وشعار القطاع الرسمية
                              </h4>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              يتم حفظها كصورة دائمة على السيرفر وفي قاعدة البيانات فوراً دون أن ترجع
                            </span>
                          </div>

                          <div className="flex flex-col md:flex-row items-center gap-5">
                            {/* Live Badge Preview Card */}
                            <div className="relative group shrink-0">
                              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-black p-1.5 flex items-center justify-center">
                                <SmartBadge
                                  badge={sec.badge}
                                  defaultIcon="sector"
                                  className="w-full h-full object-contain rounded-xl"
                                />
                              </div>
                              <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] shadow-md">
                                المعاينة المباشرة
                              </span>
                            </div>

                            {/* Controls: File Upload & URL Input & Presets */}
                            <div className="flex-1 w-full space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer shadow-lg transition-all active:scale-95 ${
                                  isUploadingSectorBadge === sec.id
                                    ? 'bg-slate-700 text-slate-300 pointer-events-none'
                                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20'
                                }`}>
                                  <Upload className="w-4 h-4" />
                                  <span>{isUploadingSectorBadge === sec.id ? 'جاري رفع وحفظ الصورة...' : '📷 رفع صورة جديدة من جهازك / الجوال'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={isUploadingSectorBadge === sec.id}
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setIsUploadingSectorBadge(sec.id);
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                          const base64Data = reader.result as string;
                                          try {
                                            // 1. Upload to universal endpoint to write real static file on disk
                                            const uploadRes = await fetch(apiUrl('/api/upload'), {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                image: base64Data,
                                                type: 'sector',
                                                filename: `sector_${sec.id}`,
                                              }),
                                            });
                                            let finalBadgeUrl = base64Data;
                                            if (uploadRes.ok) {
                                              const data = await uploadRes.json();
                                              if (data.url) finalBadgeUrl = data.url;
                                            }

                                            // 2. Update React State
                                            const updatedSectorObj = { ...sec, badge: finalBadgeUrl };
                                            const updated = [...editableSectors];
                                            updated[secIdx] = updatedSectorObj;
                                            setEditableSectors(updated);

                                            // 3. Immediately save to Sector backend API & disk
                                            await handleSaveSector(updatedSectorObj);
                                            setSavedSuccessMsg(`تم حفظ وتثبيت صورة قطاع (${sec.arabicName || sec.name}) بنجاح!`);
                                            setTimeout(() => setSavedSuccessMsg(null), 3500);
                                          } catch (err) {
                                            console.error('Failed to upload sector badge', err);
                                          } finally {
                                            setIsUploadingSectorBadge(null);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>

                                {sec.badge && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const updatedSectorObj = { ...sec, badge: '' };
                                      const updated = [...editableSectors];
                                      updated[secIdx] = updatedSectorObj;
                                      setEditableSectors(updated);
                                      await handleSaveSector(updatedSectorObj);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    إزالة الصورة
                                  </button>
                                )}
                              </div>

                              {/* URL Input */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                  أو مسار الصورة المباشر (Direct Image URL / Path):
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={sec.badge || ''}
                                    onChange={(e) => {
                                      const updated = [...editableSectors];
                                      updated[secIdx] = { ...sec, badge: e.target.value };
                                      setEditableSectors(updated);
                                    }}
                                    placeholder="مثال: /swat_round_badge_1791840366509.jpg أو رابط خارجي https://..."
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 text-left"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSector(sec)}
                                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                                  >
                                    تثبيت الرابط
                                  </button>
                                </div>
                              </div>

                              {/* Official Presets */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <span className="text-[10px] text-slate-400 font-bold">شارات وشعارات PRAVA المتوفرة:</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const updatedSectorObj = { ...sec, badge: '/swat_round_badge_1791840366509.jpg' };
                                    const updated = [...editableSectors];
                                    updated[secIdx] = updatedSectorObj;
                                    setEditableSectors(updated);
                                    await handleSaveSector(updatedSectorObj);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/20 transition-colors cursor-pointer"
                                >
                                  شعار سوات الدائري 🛡️
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const updatedSectorObj = { ...sec, badge: '/prava_main_emblem_1791840349389.jpg' };
                                    const updated = [...editableSectors];
                                    updated[secIdx] = updatedSectorObj;
                                    setEditableSectors(updated);
                                    await handleSaveSector(updatedSectorObj);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/20 transition-colors cursor-pointer"
                                >
                                  شعار PRAVA الرئيسي ⭐
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const updatedSectorObj = { ...sec, badge: '/server_logo.png' };
                                    const updated = [...editableSectors];
                                    updated[secIdx] = updatedSectorObj;
                                    setEditableSectors(updated);
                                    await handleSaveSector(updatedSectorObj);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                                >
                                  شعار السيرفر الحالي 🎖️
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle & Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم القطاع (إنجليزي / كود)</label>
                            <input
                              type="text"
                              value={sec.name}
                              onChange={(e) => {
                                const updated = [...editableSectors];
                                updated[secIdx] = { ...sec, name: e.target.value };
                                setEditableSectors(updated);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم القطاع بالعربي</label>
                            <input
                              type="text"
                              value={sec.arabicName || ''}
                              onChange={(e) => {
                                const updated = [...editableSectors];
                                updated[secIdx] = { ...sec, arabicName: e.target.value };
                                setEditableSectors(updated);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">بادئة اليونت الميداني (4 أحرف كابيتال)</span>
                            </label>
                            <input
                              type="text"
                              maxLength={4}
                              value={sec.unitPrefix || 'SWAT'}
                              onChange={(e) => {
                                const updated = [...editableSectors];
                                updated[secIdx] = { ...sec, unitPrefix: e.target.value.toUpperCase().slice(0, 4) };
                                setEditableSectors(updated);
                              }}
                              placeholder="SWAT"
                              dir="ltr"
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-amber-500/40 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400 font-bold uppercase text-left"
                            />
                            <span className="text-[10px] text-slate-400 block mt-1">
                              صيغة اليونت الميداني: {(sec.unitPrefix || 'SWAT').slice(0, 4)}-15
                            </span>
                          </div>
                        </div>

                        {/* Subtitle & Open/Closed Switch */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف القطاع</label>
                            <input
                              type="text"
                              value={sec.subtitle}
                              onChange={(e) => {
                                const updated = [...editableSectors];
                                updated[secIdx] = { ...sec, subtitle: e.target.value };
                                setEditableSectors(updated);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white block">حالة التقديم</span>
                              <span className="text-[11px] text-slate-400">
                                {sec.isOpen ? 'متاح للتقديم حالياً' : 'التقديم مغلق حالياً'}
                              </span>
                            </div>

                            <div 
                              onClick={() => {
                                const updated = [...editableSectors];
                                updated[secIdx] = { ...sec, isOpen: !sec.isOpen };
                                setEditableSectors(updated);
                              }}
                              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                                sec.isOpen ? 'bg-amber-500' : 'bg-slate-700'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full bg-black transition-transform absolute top-0.5 ${
                                sec.isOpen ? 'left-0.5' : 'right-0.5'
                              }`} />
                            </div>
                          </div>
                        </div>

                        {/* Leader Instant Auto-Accept Feature Box (خاص بالقادة: زر القبول التلقائي الفوري) */}
                        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          sec.autoAccept || editableSettings.autoAcceptApplications
                            ? 'bg-gradient-to-r from-emerald-950/40 via-black to-[#090b10] border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                            : 'bg-black/40 border-white/10'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                                sec.autoAccept || editableSettings.autoAcceptApplications
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                  : 'bg-white/5 text-slate-400 border-white/10'
                              }`}>
                                <CheckCircle2 className={`w-6 h-6 ${sec.autoAccept || editableSettings.autoAcceptApplications ? 'animate-pulse text-emerald-400' : ''}`} />
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-white text-sm sm:text-base">
                                    زر القبول التلقائي الفوري للقادة (Auto-Accept)
                                  </h4>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                    sec.autoAccept || editableSettings.autoAcceptApplications
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                      : 'bg-slate-700/40 text-slate-400 border-slate-600/30'
                                  }`}>
                                    {sec.autoAccept || editableSettings.autoAcceptApplications ? '⚡ مفعل فوري' : 'معطل'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                  عند تفعيل هذا الخيار: أي شخص يوظف أو يقدم على قطاع <b className="text-amber-300">{sec.arabicName || sec.name}</b> يأتيه فورياً <b className="text-emerald-400">(مقبول)</b> وتُعتمد وثيقته العسكرية ويونته وتصل إشعارات الاعتماد في الديسكورد دون انتظار المراجعة اليدوية!
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = [...editableSectors];
                                  const nextVal = !sec.autoAccept;
                                  updated[secIdx] = { ...sec, autoAccept: nextVal };
                                  setEditableSectors(updated);
                                  await handleSaveSector(updated[secIdx]);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                                  sec.autoAccept
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${sec.autoAccept ? 'bg-black animate-ping' : 'bg-slate-500'}`} />
                                <span>{sec.autoAccept ? 'القبول الفوري مفعل لهذا القطاع ✓' : '⚡ تفعيل القبول الفوري لهذا القطاع'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Max Recruitment Rank & Age Setting (تحديد أقصى رتبة في التوظيف بواسطة قائد القطاع) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-black/40 p-3.5 rounded-xl border border-amber-500/20">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" />
                                <span>أقصى رتبة عسكرية متاحة للتوظيف في {sec.name}</span>
                              </label>
                                <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                                {(() => {
                                  const activeRanks = ranksList.length > 0 ? ranksList : (serverSettings.ranks || DEFAULT_MILITARY_RANKS);
                                  const r = activeRanks.find(
                                    (x) => x.id === (sec.maxRecruitmentRankId || 'rank-3')
                                  );
                                  return r ? r.name : 'عريف';
                                })()}
                              </span>
                            </div>
                            <select
                              value={sec.maxRecruitmentRankId || 'rank-3'}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const activeRanks = ranksList.length > 0 ? ranksList : (serverSettings.ranks || DEFAULT_MILITARY_RANKS);
                                const rankObj = activeRanks.find((r) => r.id === selectedId);
                                const updated = [...editableSectors];
                                updated[secIdx] = {
                                  ...sec,
                                  maxRecruitmentRankId: selectedId,
                                  maxRecruitmentRankOrder: rankObj ? rankObj.order : 3,
                                };
                                setEditableSectors(updated);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-[#090b10] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                            >
                              {(ranksList.length > 0 ? ranksList : (serverSettings.ranks || DEFAULT_MILITARY_RANKS)).map((rank) => (
                                <option key={rank.id} value={rank.id} className="bg-[#0f131a] text-white">
                                  {getSafeBadgeEmoji(rank.badge, '🎖️')} {rank.name} ({rank.protocolPrefix || `ترتيب ${rank.order}`})
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-400 block mt-1.5 leading-relaxed">
                              يحدد قائد القطاع هنا أعلى رتبة يمكن للمتقدمين ومسؤولي التوظيف اختيارها عند فتح باب القبول والتسجيل.
                            </span>
                          </div>

                          <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>الحد الأدنى لسن القبول (العمر)</span>
                            </label>
                            <input
                              type="number"
                              min="14"
                              max="70"
                              value={sec.minAge || 17}
                              onChange={(e) => {
                                const updated = [...editableSectors];
                                updated[secIdx] = { ...sec, minAge: Number(e.target.value) || 17 };
                                setEditableSectors(updated);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-[#090b10] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[10px] text-slate-400 block mt-1.5 leading-relaxed">
                              السن النظامي الأدنى المسموح به للقبول الميداني في استمارة التقديم.
                            </span>
                          </div>
                        </div>

                        {/* Roles Template */}
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">نص الرسالة وقالب الرولات للقطاع</label>
                          <textarea
                            rows={3}
                            value={sec.rolesTemplate}
                            onChange={(e) => {
                              const updated = [...editableSectors];
                              updated[secIdx] = { ...sec, rolesTemplate: e.target.value };
                              setEditableSectors(updated);
                            }}
                            dir="ltr"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Sector Discord Webhook & Room Configuration */}
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                          <span className="text-xs font-bold text-amber-400 block flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5" />
                            <span>إعدادات ديسكورد ومكان إرسال الرسالة لقطاع {sec.name}</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                رابط الويب هوك الخاص بالقطاع
                              </label>
                              <input
                                type="text"
                                value={sec.webhookUrl || ''}
                                onChange={(e) => {
                                  const updated = [...editableSectors];
                                  updated[secIdx] = { ...sec, webhookUrl: e.target.value };
                                  setEditableSectors(updated);
                                }}
                                placeholder="https://discord.com/api/webhooks/..."
                                dir="ltr"
                                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-amber-400 text-left"
                              />
                              <span className="text-[9px] text-slate-500 block mt-0.5">اتركه فارغاً لاستخدام الهوك العام.</span>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                مكان إرسال الرسالة (روم رولات قطاع {sec.name})
                              </label>
                              <input
                                type="text"
                                value={sec.discordRoomUrl || ''}
                                onChange={(e) => {
                                  const updated = [...editableSectors];
                                  updated[secIdx] = { ...sec, discordRoomUrl: e.target.value };
                                  setEditableSectors(updated);
                                }}
                                placeholder="https://discord.com/channels/..."
                                dir="ltr"
                                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-amber-400 text-left"
                              />
                              <span className="text-[9px] text-slate-500 block mt-0.5">الرابط المباشر للروم في الديسكورد.</span>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                مكان إرسال الرسالة (آيدي قناة البوت للقطاع)
                              </label>
                              <input
                                type="text"
                                value={sec.discordChannelId || ''}
                                onChange={(e) => {
                                  const updated = [...editableSectors];
                                  updated[secIdx] = { ...sec, discordChannelId: e.target.value };
                                  setEditableSectors(updated);
                                }}
                                placeholder="مثال: 124578963214587965"
                                dir="ltr"
                                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-amber-400 text-left"
                              />
                              <span className="text-[9px] text-slate-500 block mt-0.5">آيدي روم إرسال الإشعار بالبوت.</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleTestDiscord({
                              webhookUrl: sec.webhookUrl || editableSettings.webhookUrl,
                              botToken: editableSettings.botToken,
                              channelId: sec.discordChannelId || editableSettings.discordChannelId,
                              sectorId: sec.name,
                            })}
                            disabled={isTestingDiscord}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] hover:text-white border border-[#5865F2]/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {isTestingDiscord && testingSectorId === sec.name ? 'جاري إرسال التجربة...' : `تجربة إرسال إشعار قطاع ${sec.name}`}
                            </span>
                          </button>

                          <button
                            onClick={() => handleSaveSector(sec)}
                            disabled={savingSectorId === sec.id}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingSectorId === sec.id ? 'جاري الحفظ...' : 'حفظ تعديلات القطاع والبادئة'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* SECTOR SELECTION HUB (قائمة وشاشات القطاعات المستقلة) */
                  <div className="bg-[#090b10] border border-amber-500/30 rounded-2xl p-6 space-y-5 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-5 h-5 text-amber-400" />
                        <div>
                          <h4 className="font-extrabold text-white text-base">
                            شاشات القطاعات وبادئة اليونت المخصصة (اختر قطاعاً للتعديل)
                          </h4>
                          <p className="text-xs text-slate-400">
                            فصل كل قطاع بشاشة مستقلة لتعديل بياناته، قنوات الديسكورد، وبادئة اليونت الخاصة به
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                        {userAllowedSectors.length} قطاعات مصرحة لحسابك
                      </span>
                    </div>

                    {/* COMMANDER AUTO-ACCEPT MASTER BANNER (زر القبول التلقائي الفوري الشامل للقادة) */}
                    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      editableSettings.autoAcceptApplications
                        ? 'bg-gradient-to-r from-emerald-950/60 via-[#0a1812] to-black border-emerald-500/50 shadow-xl shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                        : 'bg-gradient-to-r from-[#121620] via-black to-[#090b10] border-amber-500/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                            editableSettings.autoAcceptApplications
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-inner'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            <Zap className={`w-6 h-6 ${editableSettings.autoAcceptApplications ? 'animate-bounce text-emerald-400' : ''}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-white text-sm sm:text-base">
                                زر القبول التلقائي الفوري للقادة (Auto-Accept Master)
                              </h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                editableSettings.autoAcceptApplications
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                                  : 'bg-white/5 text-slate-400 border-white/10'
                              }`}>
                                {editableSettings.autoAcceptApplications ? '⚡ مفعل لكافة القطاعات' : 'معطل (مراجعة يدوية)'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              عند تفعيل هذا الزر، أي شخص يقدم أو يوظف في أي قطاع يأتيه فورياً <b className="text-emerald-400">(مقبول)</b> وتُعتمد وثيقته العسكرية ويونته وتصل إشعارات الديسكورد دون انتظار مراجعة يدوية!
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={toggleGlobalAutoAccept}
                          disabled={savingSettings}
                          className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2.5 shrink-0 shadow-lg ${
                            editableSettings.autoAcceptApplications
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30 hover:scale-[1.02]'
                              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 hover:scale-[1.02]'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${editableSettings.autoAcceptApplications ? 'bg-black animate-ping' : 'bg-black'}`} />
                          <span>
                            {editableSettings.autoAcceptApplications
                              ? 'إيقاف القبول الفوري الشامل'
                              : '⚡ تفعيل القبول الفوري لجميع القطاعات'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userAllowedSectors.map((sec) => {
                        const idx = editableSectors.findIndex((s) => s.id === sec.id);
                        return (
                        <div
                          key={sec.id}
                          className="bg-black/40 hover:bg-black/70 border border-white/10 hover:border-amber-500/50 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between gap-4 shadow-lg group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <SmartBadge
                                badge={sec.badge}
                                defaultIcon="sector"
                                className="w-12 h-12 rounded-xl border border-white/10 group-hover:border-amber-400/50 group-hover:scale-110 transition-all duration-300 object-cover shrink-0"
                              />
                              <div>
                                <h5 className="font-black text-white text-base group-hover:text-amber-300 transition-colors">
                                  {sec.arabicName || sec.name}
                                </h5>
                                <span className="text-xs text-slate-400 font-mono">{sec.name}</span>
                              </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.isOpen}
                                onChange={() => {
                                  const updated = [...editableSectors];
                                  updated[idx] = { ...sec, isOpen: !sec.isOpen };
                                  setEditableSectors(updated);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                            </label>
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2">
                            {sec.subtitle || 'لا يوجد وصف محدد للقطاع'}
                          </p>

                          <div className="bg-black/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                            <span className="text-slate-400">بادئة اليونت:</span>
                            <span className="font-mono font-bold text-amber-400">{sec.unitPrefix || 'SWAT'}-</span>
                          </div>

                          {/* Quick Auto-Accept Toggle for this Sector */}
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                            sec.autoAccept || editableSettings.autoAcceptApplications
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-black/60 border-white/5 text-slate-400'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold">
                              <Zap className={`w-3.5 h-3.5 ${sec.autoAccept || editableSettings.autoAcceptApplications ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                              <span>القبول الفوري:</span>
                            </div>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const updated = [...editableSectors];
                                const nextVal = !sec.autoAccept;
                                updated[idx] = { ...sec, autoAccept: nextVal };
                                setEditableSectors(updated);
                                await handleSaveSector(updated[idx]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                                sec.autoAccept
                                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                                  : editableSettings.autoAcceptApplications
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                              }`}
                              title={editableSettings.autoAcceptApplications ? 'مفعل لكافة القطاعات عبر ماستر القادة' : 'تبديل القبول التلقائي الفوري لهذا القطاع'}
                            >
                              {sec.autoAccept ? 'مفعل للقطاع ✓' : editableSettings.autoAcceptApplications ? 'مفعل شامل ⚡' : 'يدوي (معطل)'}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedSectorForEditId(sec.id)}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 group-hover:bg-amber-500 text-amber-300 group-hover:text-black font-black text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>فتح شاشة تعديل هذا القطاع</span>
                            <span>➔</span>
                          </button>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* SECTION: UNIT RULES & MILITARY ROSTER IN SETTINGS */}
              {(phoneSettingsSection === 'units' || phoneSettingsSection === 'all') && (
                <div className="bg-[#090b10] border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                        <span>قسم إدارة وتوزيع اليونتات ونطاقات الأرقام لكل رتبة وقطاع</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 font-mono">
                          M- / F- / I-
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        حدد لكل رتبة أو قطاع بادئتها (مثل M-1 إلى M-34 للجندي، و M-35 إلى M-50 لجندي أول، و F- للواء) مع كشف شامل لترتيب الموظفين
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('units')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Layers className="w-4 h-4" />
                    <span>فتح الكشف الميداني الشامل للموظفين 🎖️</span>
                  </button>
                </div>

                <AdminUnitsManager
                  unitRules={unitRules.filter((r) => isSuperAdmin || r.sectorId === 'all' || hasSectorAccess(r.sectorId))}
                  onUpdateUnitRules={handleUpdateUnitRules}
                  applications={userAllowedApplications}
                  onUpdateApplication={(updatedApp) => {
                    const updatedList = applications.map((a) => (a.id === updatedApp.id ? updatedApp : a));
                    setApplications(updatedList);
                  }}
                  sectors={userAllowedSectors}
                  ranks={ranksList}
                  currentUser={currentUser}
                  onOpenAppDetail={(app) => {
                    setSelectedApp(app);
                    setActiveTab('applications');
                  }}
                />
              </div>
              )}

              {/* SECTION: Quick Admin Guide & Instructions (شرح مختصر للتعليمات) */}
              {(phoneSettingsSection === 'guide' || phoneSettingsSection === 'all') && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-b from-[#121622] to-[#0a0d14] border border-amber-500/30 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                      <span>دليل التعليمات والإرشادات السريعة</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-normal">
                        دليل القيادة والتوظيف
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      شرح عملي ومختصر لكيفية تعديل الرسائل وقوالب الرولات، خطوات التوظيف، وإسناد الصلاحيات.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: How to edit messages */}
                  <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                        <Terminal className="w-4 h-4 shrink-0" />
                        <span>1. تعديل رسائل الرولات</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                        يمكنك تعديل نص طلب الرول لكل قطاع في بطاقات القطاعات أعلاه:
                      </p>
                      
                      <div className="bg-black/50 p-2 rounded-lg border border-white/5 space-y-0.5 text-[10px] font-mono text-slate-300">
                        <div><code className="text-amber-300">{"{militaryNo}"}</code>: الرقم العسكري</div>
                        <div><code className="text-amber-300">{"{unit}"}</code>: رمز اليونت (M-15)</div>
                        <div><code className="text-amber-300">{"{playerName}"}</code>: اسم اللاعب</div>
                        <div><code className="text-amber-300">{"{gameId}"}</code>: آيدي اللعبة</div>
                        <div><code className="text-amber-300">{"{discord}"}</code>: منشن الديسكورد</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      💡 اضغط <b className="text-amber-300">"حفظ تعديلات القطاع"</b> بعد التعديل لتطبيقها فوراً.
                    </div>
                  </div>

                  {/* Card 2: Recruitment workflow */}
                  <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                        <FileCheck className="w-4 h-4 shrink-0" />
                        <span>2. خطوات التوظيف والاعتماد</span>
                      </div>
                      <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>
                          <span className="text-white font-semibold">دخول المتقدم:</span> يسجل حسابه ويختار القطاع.
                        </li>
                        <li>
                          <span className="text-white font-semibold">توليد اليونت:</span> يدخل رقمه العسكري ويظهر اليونت آلياً.
                        </li>
                        <li>
                          <span className="text-white font-semibold">إرسال الرول:</span> ينسخ الرسالة لروم الديسكورد ويرفق الصور.
                        </li>
                        <li>
                          <span className="text-white font-semibold">الاعتماد:</span> يدخل المسؤول لتبويب <b className="text-white">"الطلبات"</b> ويضغط <b className="text-emerald-400">"قبول"</b>.
                        </li>
                      </ol>
                    </div>

                    <div className="text-[10px] text-emerald-400/90 pt-2 border-t border-white/5 font-semibold">
                      ✓ يوثق اسم مسؤول القبول بالطلب فوراً!
                    </div>
                  </div>

                  {/* Card 3: Creating Recruiter Accounts */}
                  <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>3. إنشاء حسابات المسؤولين</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                        لإنشاء حساب مسؤول توظيف جديد:
                      </p>
                      
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div>• توجه لتبويب <b>"قادة القطاعات / مسؤولو التوظيف"</b>.</div>
                        <div>• اضغط <b>"+ إضافة حساب / مسؤول توظيف جديد"</b>.</div>
                        <div>• اختر قالب <b>"ضابط قبول"</b> أو حدد الصلاحيات.</div>
                        <div>• فعّل: <b>صلاحية إنشاء وتعيين حساب مسؤول التوظيف</b> إذا رغبت.</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      🔑 يدخل المسؤول بحسابه مباشرة ويبدأ باستقبال الطلبات.
                    </div>
                  </div>

                  {/* Card 4: Senior Officers Messaging & Real-Time Sync */}
                  <div className="bg-[#090b10] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>4. رسائل كبار الضباط والتزامن</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                        مكان إرسال الرسالة لكبار الضباط وتحديث الموقع:
                      </p>
                      
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div>• <b>شات كبار الضباط:</b> يُرسل إليه إشعار التوظيف فور قبول الطلب بصيغة مخصصة.</div>
                        <div>• <b>التزامن المباشر:</b> أي تعديل (فتح/إغلاق قطاع، هوك، رسائل) يُحفظ في الخادم ويتغير عند <b>جميع المستخدمين فوراً</b>.</div>
                        <div>• <b>خصوصية الحسابات:</b> لا يظهر حسابك لأي زائر غريب، فكل زائر له جلسته الخاصة.</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-amber-300 pt-2 border-t border-white/5 font-semibold">
                      ⚡ جميع التعديلات حية وفورية لكافة الأجهزة.
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 5: System Operational Backup Archive - Owner Only */}
              {isOwner && (
                <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                      <HardDrive className="w-5 h-5 text-amber-400" />
                      <span>النسخ الاحتياطي وأرشفة بيانات المنظومة (System Operational Archive)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                      مشفر وآمن 🔒
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    توليد وحفظ حزمة النسخة الاحتياطية المشفرة للنظام محلياً (<code className="text-amber-400">prava-system-backup.zip</code>) لحماية قاعدة البيانات الميدانية، إعدادات السيرفر، وسجلات العمليات، وضمان استمرارية التشغيل ومزامنة المنظومة في حالات الطوارئ.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="text-[11px] text-slate-400">
                      💡 يشمل حفظ الإعدادات وقواعد البيانات وملفات التشغيل الكاملة في حزمة محلية مضغوطة.
                    </div>

                    <a
                      href={`/api/system-backup?key=${encodeURIComponent(currentUser?.username || 'admin')}`}
                      download="prava-system-backup.zip"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 hover:border-amber-500/40 transition-all shadow-sm cursor-pointer"
                    >
                      <Archive className="w-4 h-4 text-amber-400" />
                      <span>تصدير حزمة الأرشيف الاحتياطي (System Archive)</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

          {/* TAB 4: Comprehensive Security & Device Tracking Audit Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Header Overview & Stats */}
              <div className="bg-[#090b10] border border-amber-500/25 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                        <span>سجل اللوقات التدقيقية وبصمة الأجهزة</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                          تجدد كل أسبوعين ⏳
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        توثيق عمليات الدخول والخروج وبصمات الأجهزة لمعرفة كم حساب مرتبط بكل جهاز وكم طلب توظيف أرسله.
                      </p>
                    </div>
                  </div>

                  {/* Actions for log purge and reset */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePurgeOldLogs}
                      disabled={isPurgingLogs}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPurgingLogs ? 'animate-spin text-amber-400' : ''}`} />
                      <span>{isPurgingLogs ? 'جاري الفحص...' : 'فحص وحذف الأقدم من 14 يوماً'}</span>
                    </button>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={handleClearLogs}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>مسح وتجديد السجل يدوياً (المالك)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] text-slate-400 block">إجمالي السجلات والعمليات</span>
                    <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">{logs.length}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] text-slate-400 block">عدد الأجهزة المرصودة</span>
                    <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">{uniqueDevices.length} جهاز</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] text-slate-400 block">صلاحية حفظ السجل</span>
                    <span className="text-xs font-bold text-white mt-1 block">14 يوماً (أسبوعين)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] text-slate-400 block">حالة التجديد الآلي</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>مفعّل ومراقب تلقائياً</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090b10] p-4 rounded-xl border border-white/5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المستخدم، أو رقم الجهاز (DEV-...)، أو تفاصيل العملية..."
                    className="w-full pr-10 pl-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">كافة العمليات</option>
                    <option value="login">تسجيل دخول</option>
                    <option value="logout">تسجيل خروج</option>
                    <option value="register">طلب حساب جديد</option>
                    <option value="application_submit">تقديم طلب توظيف</option>
                    <option value="user_approved">اعتماد وتفعيل حساب</option>
                  </select>
                </div>
              </div>

              {/* Logs Entries List */}
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center bg-[#090b10] rounded-xl border border-white/5 text-slate-400 text-xs">
                  لا توجد سجلات مطابقة للبحث حالياً.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredLogs.map((log) => {
                    const isLogin = log.action === 'login';
                    const isLogout = log.action === 'logout';
                    const isRegister = log.action === 'register';
                    const isAppSubmit = log.action === 'application_submit';
                    const isApproved = log.action === 'user_approved';

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl bg-[#090b10] border border-white/5 hover:border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isLogin
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isLogout
                              ? 'bg-slate-700/30 text-slate-400 border border-slate-700/40'
                              : isRegister
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : isApproved
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}>
                            {isLogin ? <LogIn className="w-4 h-4" /> :
                             isLogout ? <LogOut className="w-4 h-4" /> :
                             isRegister ? <UserPlus className="w-4 h-4" /> :
                             isApproved ? <CheckCircle2 className="w-4 h-4" /> :
                             <FileCheck className="w-4 h-4" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-white text-xs">
                                {log.displayName || log.username}
                              </span>
                              {log.roleTitle && (
                                <span className="text-[10px] px-2 py-0.2 rounded bg-white/5 text-slate-300 border border-white/10 font-bold">
                                  {log.roleTitle}
                                </span>
                              )}
                              <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                                isLogin ? 'bg-emerald-500/10 text-emerald-400' :
                                isLogout ? 'bg-white/5 text-slate-400' :
                                isRegister ? 'bg-amber-500/10 text-amber-300' :
                                isApproved ? 'bg-purple-500/10 text-purple-300' :
                                'bg-blue-500/10 text-blue-300'
                              }`}>
                                {isLogin ? 'تسجيل دخول' :
                                 isLogout ? 'تسجيل خروج' :
                                 isRegister ? 'طلب حساب جديد' :
                                 isApproved ? 'اعتماد حساب' :
                                 'تقديم طلب توظيف'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {log.details || `تمت العملية بواسطة ${log.username}`}
                            </p>

                            {/* Device & Account Stats Pill */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono">
                              {log.deviceId && (
                                <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-amber-300 flex items-center gap-1">
                                  <Smartphone className="w-3 h-3 text-amber-400" />
                                  <span>الجهاز: {log.deviceId}</span>
                                </span>
                              )}
                              {log.deviceAccountsCount !== undefined && (
                                <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-slate-300">
                                  الحسابات المرتبطة بالجهاز: <b className="text-white">{log.deviceAccountsCount}</b>
                                </span>
                              )}
                              {log.deviceApplicationsCount !== undefined && (
                                <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-slate-300">
                                  الطلبات المرسلة من الجهاز: <b className="text-emerald-400">{log.deviceApplicationsCount}</b>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0 font-mono text-[11px] text-slate-400 self-start md:self-center">
                          {log.timestamp}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 5: Owner Exclusive (خاص بالاونر) */}
          {activeTab === 'owner' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Rebuild success message */}
              {rebuildMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{rebuildMsg}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2.5 py-1 rounded text-emerald-300 font-mono">
                    تم التحديث بنجاح
                  </span>
                </div>
              )}

              {/* Owner Command Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-black border border-amber-500/30 p-6 sm:p-7 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 shrink-0">
                      <Crown className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-black text-white">بوابة القيادة العليا — خاص بالاونر</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 tracking-wider">
                          EXCLUSIVE OWNER ACCESS
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        هذه الشاشة مخصصة لمالك المشروع حصرياً. يمكنك من هنا تحميل كامل ملفات المشروع ومجلداته في حزمة مضغوطة جاهزة للرفع إلى Vercel أو الاستضافة، بالإضافة إلى إمكانية إعادة ضغط وتحديث الحزمة فورياً مع كل تعديل يطرأ على النظام.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto bg-black/60 border border-white/10 px-3.5 py-2 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-mono text-slate-300">
                      الحالة: <span className="text-emerald-400 font-bold">متصل ومزامن</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Package Status & Live Rebuild Actions Card */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-4">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-amber-400" />
                      <span>حزمة المشروع الجاهزة للنشر والتشغيل</span>
                    </h4>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      الملف يحتوي على كل الأكواد، الخادم (Express/Vite)، قاعدة البيانات (db.json)، الإعدادات (vercel.json)، والأصول والصور.
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono">
                      الحجم: <span className="text-amber-400 font-bold">{packageInfo?.sizeFormatted || '4.9 MB'}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                      جاهز 100%
                    </div>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Download Button */}
                  <a
                    href={apiUrl('/api/download')}
                    download="prava-recruitment-system.zip"
                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center group"
                  >
                    <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>تحميل ملف المشروع بالكامل (ZIP)</span>
                  </a>

                  {/* Rebuild & Live Sync Button */}
                  <button
                    onClick={handleRebuildPackage}
                    disabled={isRebuildingPackage}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/30 hover:border-amber-500 text-amber-300 hover:text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRebuildingPackage ? 'animate-spin text-amber-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>{isRebuildingPackage ? 'جاري تجميع الملفات وإعادة الضغط...' : 'تحديث الحزمة وإعادة الضغط الآن (Live Rebuild)'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>اسم الملف المصدّر: <code className="text-slate-200 font-mono">prava-recruitment-system.zip</code></span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    آخر تحديث: {packageInfo?.lastModified ? new Date(packageInfo.lastModified).toLocaleTimeString('ar-SA') : 'الآن'}
                  </span>
                </div>
              </div>

              {/* Troubleshooting / Single Files Viewer (حل مشكلة "ما أقدر أفكه") */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-black text-white">
                        حل بديل: تحميل أو استعراض ونسخ الملفات الفردية مباشرة (بدون فك ضغط)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      إذا واجهت أي صعوبة في فك ضغط ملف الـ ZIP على هاتفك أو حاسوبك، يمكنك تحميل كل ملف رئيسي منفصلاً أو نسخ كوده بنقرة واحدة:
                    </p>
                  </div>
                </div>

                {/* Key Files Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'api/index.ts', desc: 'دالة Vercel Serverless لمعالجة تسجيل الدخول وحفظ البيانات أونلاين', badge: 'Serverless API' },
                    { name: 'api/[...path].ts', desc: 'دالة التوجيه الشامل لـ Vercel Serverless لدعم كافة مسارات /api/* تلقائياً', badge: 'Catch-All API' },
                    { name: 'src/utils/api.ts', desc: 'إعدادات الاتصال الذكي بالسيرفر السحابي وحذف أي ارتباط بـ localhost', badge: 'API Utility' },
                    { name: 'src/components/AdminLoginModal.tsx', desc: 'كود تسجيل دخول الإدارة المحدث مع نظام الحماية ضد أخطاء السيرفر', badge: 'Login Modal' },
                    { name: 'vercel.json', desc: 'إعدادات النشر وتوجيه مسارات /api/* إلى Serverless Functions', badge: 'Vercel Config' },
                    { name: 'package.json', desc: 'إصدارات المكتبات والسكربتات الصحيحة', badge: 'Dependencies' },
                    { name: '.env.example', desc: 'نموذج المتغيرات البيئية وتوكن البوت ورابط السيرفر الخارجي', badge: 'Security Env' },
                    { name: '.gitignore', desc: 'قواعد منع رفع الأسرار وملف .env لـ GitHub', badge: 'Git Security' },
                    { name: 'data/db.json', desc: 'قاعدة البيانات (المستخدمين والإعدادات والقطاعات)', badge: 'Database' },
                    { name: 'server.ts', desc: 'خادم Express والواجهات البرمجية الآمنة المتوافقة سحابياً', badge: 'Backend' },
                    { name: 'index.html', desc: 'واجهة الدخول وملف HTML الرئيسي', badge: 'HTML Entry' },
                    { name: 'vite.config.ts', desc: 'إعدادات بيئة العمل وبناء Vite', badge: 'Build Config' },
                  ].map((file) => (
                    <div
                      key={file.name}
                      className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-amber-300">{file.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            {file.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{file.desc}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleFile(file.name)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>تحميل الملف</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectFile(file.name)}
                          className="py-1.5 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-blue-500/20"
                        >
                          <Eye className="w-3 h-3" />
                          <span>استعراض</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inspecting File Drawer / Modal Box */}
                {inspectingFile && (
                  <div className="mt-4 p-4 rounded-xl bg-black/80 border border-blue-500/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span className="font-mono text-xs font-bold text-white">{inspectingFile}</span>
                        {isLoadingFileContent && (
                          <span className="text-[10px] text-slate-400 animate-pulse">جاري التحميل...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyContent}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold cursor-pointer transition-colors"
                        >
                          {hasCopiedFile ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ الكود بالكامل</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setInspectingFile(null)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <pre className="p-3 bg-[#0c0f16] rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-60 border border-white/5 whitespace-pre">
                      {inspectingContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* Extraction & Deployment Help Guide */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>دليل فك الضغط وتشغيل المشروع على Vercel أو الحاسوب</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <span className="font-bold text-amber-300 block">💡 كيف تفتح وتفك ضغط الملف بسهولة؟</span>
                    <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px] leading-relaxed">
                      <li><strong>على الكمبيوتر (Windows/Mac):</strong> انقر بزر الفأرة الأيمن على الملف ثم اختر "Extract All" أو استعمل برنامج <span className="text-white">WinRAR / 7-Zip</span>.</li>
                      <li><strong>على الهاتف (iPhone):</strong> افتح تطبيق "الملفات" (Files) واضغط على الملف ضغطة واحدة ليتم فكه مباشرة في مجلد.</li>
                      <li><strong>على الهاتف (Android):</strong> استخدم تطبيق "ملفاتي" أو حمّل تطبيق <span className="text-white">ZArchiver</span> المجاني من متجر التطبيقات.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <span className="font-bold text-emerald-300 block">🚀 حل مشكلة Vercel وخطوات النشر الصحيحة:</span>
                    <ol className="space-y-1.5 text-slate-400 list-decimal list-inside text-[11px] leading-relaxed">
                      <li><strong>مجلد Root Directory:</strong> إذا كان مستودع GitHub يحتوي على مجلد فرعي مثل <code className="text-white">prava-recruitment-system (3)</code>، ادخل إعدادات مشروع Vercel ➔ <b>Settings ➔ General ➔ Root Directory</b> واكتب اسم المجلد هناك.</li>
                      <li><strong>مجلد api/:</strong> تأكد من وجود مجلد <code className="text-amber-300">api/index.ts</code> في المستودع ليعمل نظام Serverless Functions لمعالجة الـ API وتحديث البيانات.</li>
                      <li><strong>بدون أي سيرفر خارجي (Serverless مدمج):</strong> الموقع مجهز بدوال Serverless Functions مدمجة تلقائياً داخل مجلد <code className="text-amber-300">api/</code> لتعمل على Vercel مباشرة دون الحاجة لأي خادم خارجي أو ضبط متغير <code className="text-emerald-300">VITE_API_BASE_URL</code>.</li>
                      <li><strong>حماية تسجيل الدخول:</strong> تم تزويد النظام بـ (Zero-Fail Auth) بحيث يدخل الأدمن دائماً فورياً دون أن تظهر رسالة تعذر الاتصال بالخادم.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 sm:px-8 border-t border-white/10 bg-[#090b10] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            PRAVA Central Management · Granular Permissions Matrix
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

      </main>

      {/* CREATE / EDIT ACCOUNT & GRANULAR PERMISSIONS MODAL */}
      {isUserModalOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[92vh] bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-7 overflow-y-auto text-right shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-white">
                {editingUserId ? 'تعديل الحساب وتخصيص الصلاحيات الدقيقة' : 'إضافة حساب قيادي جديد وتعيين الصلاحيات'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                حدد بدقة ما يُسمح به لهذا العضو على المنصة مع إمكانية استخدام القوالب السريعة أو التخصيص اليدوي.
              </p>
            </div>

            {/* Quick Presets Bar */}
            <div className="bg-[#090b10] p-3 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">قوالب الصلاحيات السريعة:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="py-2 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>مشرف عام (كامل)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('leader')}
                  className="py-2 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>قائد قطاع</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('officer')}
                  className="py-2 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>ضابط قبول</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-5">
              
              {/* Account Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم المستخدم (اليوزر) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUserId}
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono text-left focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {editingUserId ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور (الباسورد) *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    placeholder={editingUserId ? 'اتركه فارغاً للإبقاء عليها' : ''}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono text-left focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الاسم المعروض</label>
                  <input
                    type="text"
                    value={userFormData.displayName}
                    onChange={(e) => setUserFormData({ ...userFormData, displayName: e.target.value })}
                    placeholder="مثال: النقيب فهد"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المسمى / الرتبة</label>
                  <input
                    type="text"
                    value={userFormData.roleTitle}
                    onChange={(e) => setUserFormData({ ...userFormData, roleTitle: e.target.value })}
                    placeholder="مثال: قائد قطاع SWAT"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Scoped Sectors Multi-Selection with Strict Isolation Notice */}
              <div className="bg-[#090b10] p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white block">
                    القطاعات المصرح للمسؤول بالوصول إليها وإدارتها (نظام عزل القطاعات):
                  </span>
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                    حماية وعزل صارم
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  المسؤول المحدد له قطاع (مثل SWAT فقط) لن يتمكن نهائياً من رؤية طلبات توظيف، أو يونتات، أو إحصائيات، أو إعدادات أي قطاع آخر.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleAllowedSector('*')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userFormData.permissions.allowedSectors?.includes('*')
                        ? 'bg-amber-500 text-black shadow'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    كافة القطاعات (*)
                  </button>

                  {sectors.map((s) => {
                    const isSelected = userFormData.permissions.allowedSectors?.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleAllowedSector(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-black shadow'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {s.name} ({s.arabicName})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GRANULAR PERMISSIONS CATEGORIES */}
              <div className="space-y-4">
                
                {/* 1. Applications Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pb-1.5 border-b border-white/5">
                    <FileCheck className="w-4 h-4" />
                    <span>صلاحيات طلبات التوظيف (Applications)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canViewApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canViewApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>مشاهدة واستعراض الطلبات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canAcceptApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canAcceptApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>قبول الطلبات رسمياً</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canRejectApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canRejectApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>رفض الطلبات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canAddNotes}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canAddNotes: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>كتابة ملاحظات التدقيق والتقييم</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canExportApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canExportApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تصدير بيانات المتقدمين (CSV)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canDeleteApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canDeleteApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>حذف وأرشفة الطلبات</span>
                    </label>
                  </div>
                </div>

                {/* 2. Sector & Unit Prefix Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pb-1.5 border-b border-white/5">
                    <Sliders className="w-4 h-4" />
                    <span>صلاحيات القطاعات واليونت (Sectors & Units)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canToggleSector}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canToggleSector: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>فتح وإغلاق التقديم (متاح / مغلق)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditUnitPrefix}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditUnitPrefix: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span className="text-amber-300 font-bold">تعديل بادئة اليونت (M- أو I-)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditSectorInfo}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditSectorInfo: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل اسم ووصف القطاع</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditRolesTemplate}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditRolesTemplate: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل قوالب ونصوص الرولات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditQuestions}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditQuestions: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل وإضافة أسئلة تقييم القبول</span>
                    </label>
                  </div>
                </div>

                {/* 3. Server Identity & Webhooks Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 pb-1.5 border-b border-white/5">
                    <Sparkles className="w-4 h-4" />
                    <span>صلاحيات الهوية والسيرفر (Server & Discord)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canChangeServerLogo}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canChangeServerLogo: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تغيير شعار السيرفر وصورة PRAVA</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canChangeDiscordLinks}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canChangeDiscordLinks: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل روابط رومات ودعوات الديسكورد</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canConfigureWebhooks}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canConfigureWebhooks: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل روابط ويب هوك الإشعارات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canViewAuditLogs}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canViewAuditLogs: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>مشاهدة سجلات الدخول التدقيقية</span>
                    </label>
                  </div>
                </div>

                {/* 4. Accounts & Staff Management Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 pb-1.5 border-b border-white/5">
                    <Users className="w-4 h-4" />
                    <span>صلاحيات إدارة الحسابات والرتب (Staff Management)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canManageAccounts}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canManageAccounts: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>إنشاء وحذف حسابات القادة والضباط</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canAssignPermissions}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canAssignPermissions: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>ترقية وتعديل مصفوفة الصلاحيات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canCreateRecruitmentOfficers}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canCreateRecruitmentOfficers: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span className="text-amber-300 font-bold">صلاحية إنشاء وتعيين حساب مسؤول التوظيف والقبول</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-7 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} shadow-lg`}
                >
                  {editingUserId ? 'حفظ التعديلات وتحديث الصلاحيات' : 'إنشاء الحساب وتفعيل الصلاحيات'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAIL APPLICATION MODAL */}
      {selectedApp && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedApp(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#0f141d] border border-white/10 rounded-2xl p-6 overflow-y-auto text-right shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-1">
              تفاصيل طلب التقديم: {selectedApp.fullName}
            </h3>
            <span className="text-xs text-amber-400 font-mono block mb-4">
              رقم الطلب: {selectedApp.id} · قطاع {selectedApp.sectorName}
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6 bg-[#090b10] p-4 rounded-xl border border-white/5">
              <div><span className="text-slate-400">الاسم داخل اللعبة:</span> <span className="font-bold text-white">{selectedApp.playerName}</span></div>
              <div><span className="text-slate-400">الديسكورد:</span> <span className="font-mono text-white">{selectedApp.discordId}</span></div>
              <div><span className="text-slate-400">الهوية الرقمية:</span> <span className="font-mono text-white">{selectedApp.gameId}</span></div>
              <div><span className="text-slate-400">الرقم العسكري:</span> <span className="font-mono text-white">{selectedApp.militaryNo}</span></div>
              <div><span className="text-slate-400">اليونت الآلي:</span> <span className="font-mono text-amber-400 font-bold">{selectedApp.currentUnit}</span></div>
              <div><span className="text-slate-400">العمر:</span> <span className="text-white">{selectedApp.age} سنة</span></div>
              <div><span className="text-slate-400">مسؤول القبول:</span> <span className="text-white">{selectedApp.acceptanceOfficer || 'لا يوجد'}</span></div>
              <div><span className="text-slate-400">درجة التقييم:</span> <span className="font-bold text-emerald-400">{selectedApp.score}/{selectedApp.totalQuestions}</span></div>
            </div>

            {/* Images with Error Handling and Zoom Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">إثبات إعطاء الرولات</span>
                {selectedApp.rolesProofImg ? (
                  <div 
                    className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 hover:border-amber-400 transition-colors"
                    onClick={() => setZoomedImage({ url: selectedApp.rolesProofImg!, title: 'إثبات إعطاء الرولات' })}
                  >
                    <img 
                      src={selectedApp.rolesProofImg} 
                      alt="Proof" 
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-44 rounded-xl bg-[#090b10] border border-white/5 flex flex-col items-center justify-center text-xs text-amber-400/80 p-3 text-center';
                          fallback.innerText = '⚠️ تعذر تحميل صورة إثبات الرولات';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-white font-bold transition-opacity">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>تكبير الصورة</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl bg-[#090b10] border border-white/5 flex items-center justify-center text-xs text-slate-500">
                    لم يتم إرفاق صورة
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">صورة الزي الرسمي</span>
                {selectedApp.uniformImg ? (
                  <div 
                    className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 hover:border-amber-400 transition-colors"
                    onClick={() => setZoomedImage({ url: selectedApp.uniformImg!, title: 'صورة الزي الرسمي' })}
                  >
                    <img 
                      src={selectedApp.uniformImg} 
                      alt="Uniform" 
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-44 rounded-xl bg-[#090b10] border border-white/5 flex flex-col items-center justify-center text-xs text-amber-400/80 p-3 text-center';
                          fallback.innerText = '⚠️ تعذر تحميل صورة الزي الرسمي';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-white font-bold transition-opacity">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>تكبير الصورة</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl bg-[#090b10] border border-white/5 flex items-center justify-center text-xs text-slate-500">
                    لم يتم إرفاق صورة
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleUpdateAppStatus(selectedApp.id, 'مرفوض');
                  setSelectedApp(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 cursor-pointer"
              >
                رفض الطلب
              </button>
              <button
                onClick={() => {
                  const target = selectedApp;
                  setSelectedApp(null);
                  handleOpenHiringModal(target);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إتمام التوظيف وتعيين الرتبة واليونت</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 1. RANK CREATION / EDITING MODAL */}
      {isRankModalOpen && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsRankModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#0c0f16] border border-white/10 rounded-2xl p-6 overflow-y-auto text-right shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => setIsRankModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <h4 className="font-black text-white text-base">
                  {editingRank ? 'تعديل بيانات الرتبة ومنشن الديسكورد' : 'إضافة رتبة عسكرية جديدة'}
                </h4>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>

            {rankFormError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{rankFormError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Rank Name & Badge */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم الرتبة العسكرية *</label>
                  <input
                    type="text"
                    value={rankFormData.name || ''}
                    onChange={(e) => setRankFormData({ ...rankFormData, name: e.target.value })}
                    placeholder="مثال: جندي، عريف، ملازم..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الشارة / الأيقونة</label>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-inner">
                      <SmartBadge badge={rankFormData.badge} defaultIcon="rank" className="w-full h-full object-contain" />
                    </div>
                    <input
                      type="text"
                      value={rankFormData.badge || '🎖️'}
                      onChange={(e) => setRankFormData({ ...rankFormData, badge: e.target.value })}
                      placeholder="🎖️ أو رابط"
                      className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Order & Sector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الترتيب والأسبقية (Order)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={rankFormData.order || 1}
                    onChange={(e) => setRankFormData({ ...rankFormData, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">القطاع المخصص</label>
                  <select
                    value={rankFormData.sectorId || 'all'}
                    onChange={(e) => setRankFormData({ ...rankFormData, sectorId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">كافة القطاعات (عام)</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.arabicName || s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Protocol Prefix (M-1, M-2, I-1, I-2) & Rank Type */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-black/40 to-black/40 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>بادئة البروتوكول العسكري (Protocol Prefix) *</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    مثل: M-1 للأفراد أو I-2 للضباط
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={rankFormData.protocolPrefix || 'M-1'}
                      onChange={(e) => setRankFormData({ ...rankFormData, protocolPrefix: e.target.value.toUpperCase() })}
                      placeholder="M-1 أو I-2"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-center"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <select
                      value={rankFormData.rankType || 'soldier'}
                      onChange={(e) => {
                        const val = e.target.value as 'soldier' | 'officer';
                        setRankFormData({
                          ...rankFormData,
                          rankType: val,
                          protocolPrefix: val === 'officer' 
                            ? (rankFormData.protocolPrefix?.startsWith('I') ? rankFormData.protocolPrefix : 'I-1') 
                            : (rankFormData.protocolPrefix?.startsWith('M') ? rankFormData.protocolPrefix : 'M-1')
                        });
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="soldier">🎖️ رتبة أفراد / جنود (M-)</option>
                      <option value="officer">⭐ رتبة ضباط وقيادة (I-)</option>
                    </select>
                  </div>
                </div>

                {/* Quick Protocol Presets Buttons */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">اختيار سريع لبادئة البروتوكول المعتادة:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['M-1', 'M-2', 'M-3', 'M-4', 'M-5', 'I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setRankFormData({ ...rankFormData, protocolPrefix: p, rankType: p.startsWith('I') ? 'officer' : 'soldier' })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                          rankFormData.protocolPrefix === p
                            ? 'bg-amber-500 text-black shadow'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dual Discord Roles: Primary & Secondary */}
              <div className="space-y-3">
                {/* 1. Primary Discord Role (الديسكورد الأساسي) */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/30 space-y-2">
                  <label className="block text-xs font-bold text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>رول الديسكورد الأساسي (Primary Discord Role ID) *</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                      الديسكورد الأساسي - نشط الآن
                    </span>
                  </label>
                  <input
                    type="text"
                    value={rankFormData.discordRoleId || ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = raw.replace(/[^0-9]/g, '');
                      setRankFormData({
                        ...rankFormData,
                        discordRoleId: digits,
                        discordRoleMention: digits ? `<@&${digits}>` : '',
                      });
                    }}
                    placeholder="مثال: 1519090286670643250"
                    dir="ltr"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-emerald-500/40 text-white text-xs font-mono focus:outline-none focus:border-emerald-400 text-left"
                  />

                  {/* Primary Auto Mention Preview */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">منشن الديسكورد الأساسي:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rankFormData.discordRoleId ? `<@&${rankFormData.discordRoleId}>` : 'لم يتم تحديد رول'}
                      </span>
                      {rankFormData.discordRoleId && (
                        <button
                          type="button"
                          onClick={() => handleCopyRankMention(`<@&${rankFormData.discordRoleId}>`, 'primary-preview')}
                          className="text-slate-400 hover:text-white cursor-pointer"
                          title="نسخ"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Secondary Discord Role (الديسكورد الثاني / السيرفر العسكري) */}
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <label className="block text-xs font-bold text-purple-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-purple-400" />
                      <span>رول الديسكورد الثاني (Secondary Discord Role ID)</span>
                    </span>
                    <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                      دس 2 - السيرفر العسكري
                    </span>
                  </label>
                  <input
                    type="text"
                    value={rankFormData.secondaryRoleId || ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = raw.replace(/[^0-9]/g, '');
                      setRankFormData({
                        ...rankFormData,
                        secondaryRoleId: digits,
                        secondaryRoleMention: digits ? `<@&${digits}>` : '',
                      });
                    }}
                    placeholder="آيدي رول السيرفر الثاني (السيرفر العسكري)"
                    dir="ltr"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-purple-500/40 text-white text-xs font-mono focus:outline-none focus:border-purple-400 text-left"
                  />

                  {/* Secondary Auto Mention Preview */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">منشن الديسكورد الثاني:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {rankFormData.secondaryRoleId ? `<@&${rankFormData.secondaryRoleId}>` : 'لم يتم تحديد رول ثاني'}
                      </span>
                      {rankFormData.secondaryRoleId && (
                        <button
                          type="button"
                          onClick={() => handleCopySecondaryRankMention(`<@&${rankFormData.secondaryRoleId}>`, 'sec-preview')}
                          className="text-slate-400 hover:text-white cursor-pointer"
                          title="نسخ"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">وصف المهام والصلاحيات الميدانية</label>
                <textarea
                  rows={2}
                  value={rankFormData.description || ''}
                  onChange={(e) => setRankFormData({ ...rankFormData, description: e.target.value })}
                  placeholder="وصف مختصر للرتبة ومسؤولياتها الميدانية..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsRankModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveRankForm}
                className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer ${theme.buttonClass}`}
              >
                {editingRank ? 'حفظ التعديلات' : 'إضافة الرتبة واعتماد المنشن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE RANK MODAL */}
      {rankToDelete && (
        <div 
          className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => { if (!isDeletingRank) setRankToDelete(null); }}
        >
          <div 
            className="relative w-full max-w-md bg-[#0f131a] border border-red-500/40 rounded-2xl p-6 text-right shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">حذف الرتبة العسكرية نهائياً</h3>
                <p className="text-xs text-slate-400">تأكيد إزالة الرتبة من المنظومة وقاعدة البيانات</p>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">الرتبة المطلوب حذفها:</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm">{rankToDelete.name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    [{rankToDelete.protocolPrefix || 'M-1'}]
                  </span>
                </div>
              </div>
              <p className="text-xs text-red-300/90 leading-relaxed border-t border-white/5 pt-2">
                ⚠️ هل أنت متأكد من حذف هذه الرتبة؟ سيتم حذفها بشكل فوري ودائم وحفظ التغييرات في المنظومة.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRankToDelete(null)}
                disabled={isDeletingRank}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRank}
                disabled={isDeletingRank}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/30"
              >
                {isDeletingRank ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>نعم، حذف الرتبة نهائياً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESTORE DEFAULT RANKS MODAL */}
      {showRestoreRanksModal && (
        <div 
          className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => { if (!isRestoringRanks) setShowRestoreRanksModal(false); }}
        >
          <div 
            className="relative w-full max-w-md bg-[#0f131a] border border-amber-500/40 rounded-2xl p-6 text-right shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">استعادة الرتب الافتراضية</h3>
                <p className="text-xs text-slate-400">إعادة تعيين هيكل رتب منظومة PRAVA الرسمية</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/50 p-3.5 rounded-xl border border-white/5">
              سيتم استعادة قائمة الـ 15 رتبة عسكرية الافتراضية المعتمدة (من رتبة جندي حتى رتبة لواء) مع رموزها وبروتوكولاتها ومنشناتها الرسمية وحفظها في قاعدة البيانات.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreRanksModal(false)}
                disabled={isRestoringRanks}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreDefaultRanks}
                disabled={isRestoringRanks}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                {isRestoringRanks ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الاستعادة...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الرتب الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROTOCOL CREATION / EDITING MODAL */}
      {isProtocolModalOpen && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsProtocolModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#0c0f16] border border-white/10 rounded-2xl p-6 overflow-y-auto text-right shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => setIsProtocolModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <h4 className="font-black text-white text-base">
                  {editingProtocol ? 'تعديل اللائحة والبروتوكول الميداني' : 'إضافة بروتوكول ميداني جديد'}
                </h4>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان البروتوكول *</label>
                <input
                  type="text"
                  value={protocolFormData.title || ''}
                  onChange={(e) => setProtocolFormData({ ...protocolFormData, title: e.target.value })}
                  placeholder="مثال: بروتوكول تسيير الدوريات والتعامل مع البلاغات"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">التصنيف</label>
                  <select
                    value={protocolFormData.category || 'general'}
                    onChange={(e) => setProtocolFormData({ ...protocolFormData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="recruitment">التوظيف والمباشرة</option>
                    <option value="radio">الراديو والعمليات</option>
                    <option value="operations">قواعد الاشتباك (ROE)</option>
                    <option value="conduct">الانضباط والمساءلة</option>
                    <option value="promotions">الترقيات والمكافآت</option>
                    <option value="general">لوائح عامة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">القطاع المخصص</label>
                  <select
                    value={protocolFormData.sectorId || 'all'}
                    onChange={(e) => setProtocolFormData({ ...protocolFormData, sectorId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">كافة القطاعات</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.arabicName || s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">بنود ومحتوى البروتوكول (نقطة لكل سطر)</label>
                <textarea
                  rows={5}
                  value={protocolFormData.content || ''}
                  onChange={(e) => setProtocolFormData({ ...protocolFormData, content: e.target.value })}
                  placeholder="1. الالتزام بالتعليمات الميدانية...\n2. يمنع مباشرة الدورية بدون زي رسمي..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-black/30 p-2.5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  checked={protocolFormData.isActive !== undefined ? protocolFormData.isActive : true}
                  onChange={(e) => setProtocolFormData({ ...protocolFormData, isActive: e.target.checked })}
                  className="rounded text-amber-500 cursor-pointer"
                />
                <span>تفعيل هذا البروتوكول وعرضه في نافذة البروتوكولات الرسمية</span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsProtocolModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveProtocolForm}
                className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer ${theme.buttonClass}`}
              >
                {editingProtocol ? 'حفظ التعديلات' : 'إضافة البروتوكول'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPREHENSIVE HIRING & RANK/UNIT/MENTION ASSIGNMENT MODAL */}
      {hiringApp && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setHiringApp(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[92vh] bg-[#0c0f16] border border-amber-500/30 rounded-2xl p-6 overflow-y-auto text-right shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <button
                type="button"
                onClick={() => setHiringApp(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="font-black text-white text-base flex items-center gap-2 justify-end">
                    <span>إتمام التوظيف وتعيين الرتبة واليونت العسكري</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    المرشح: {hiringApp.fullName} ({hiringApp.playerName}) · قطاع {hiringApp.sectorName}
                  </p>
                </div>
              </div>
            </div>

            {/* Candidate Summary Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/40 p-3.5 rounded-xl border border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">الهوية الرقمية:</span>
                <span className="font-mono font-bold text-white">{hiringApp.gameId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">الرقم العسكري الشاغر المعتمد:</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span>#{hiringMilitaryNo || hiringApp.militaryNo || '35'}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-bold">شاغر ومتاح</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">حساب الديسكورد:</span>
                <span className="font-mono text-slate-300 truncate block">{hiringApp.discordId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">النتيجة في الاختبار:</span>
                <span className="font-bold text-emerald-400">{hiringApp.score}/{hiringApp.totalQuestions}</span>
              </div>
            </div>

            {/* Inputs: Rank Selection, Auto-Available Military No, and 4-Letter Unit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* 1. Military Rank Selection */}
              <div className="bg-[#090b10] p-3.5 rounded-xl border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>اختيار الرتبة العسكرية المعينة *</span>
                </label>
                <select
                  value={hiringRankId}
                  onChange={(e) => {
                    const newRankId = e.target.value;
                    setHiringRankId(newRankId);
                    const selected = ranksList.find((r) => r.id === newRankId);
                    if (selected) {
                      setHiringCustomRoleId(selected.discordRoleId || '');
                      // Automatically calculate and set the first unoccupied military number and standard unit for this rank!
                      const auto = getNextAvailableMilitaryNo(hiringApp.sectorId, selected.name, hiringApp.id);
                      setHiringMilitaryNo(auto.militaryNo);
                      setHiringUnit(auto.unit);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {ranksList.map((rank) => {
                    const displayEmoji = getSafeBadgeEmoji(rank.badge, '🎖️');
                    return (
                      <option key={rank.id} value={rank.id}>
                        {displayEmoji} {rank.name} (أسبقية #{rank.order}) {rank.discordRoleId ? `· [دس 1]` : ''} {rank.secondaryRoleId ? `· [دس 2]` : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Linked Mention Display for both roles */}
                {(() => {
                  const chosen = ranksList.find((r) => r.id === hiringRankId) || ranksList[0];
                  const effRoleId = (hiringCustomRoleId || chosen?.discordRoleId || '').replace(/[^0-9]/g, '');
                  const mentionStr = effRoleId ? `<@&${effRoleId}>` : '';
                  const secRoleId = (chosen?.secondaryRoleId || '').replace(/[^0-9]/g, '');
                  const secMentionStr = secRoleId ? `<@&${secRoleId}>` : '';

                  return (
                    <div className="space-y-1 pt-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">الرول الأساسي:</span>
                        {effRoleId ? (
                          <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {mentionStr}
                          </span>
                        ) : (
                          <span className="text-amber-400">لا يوجد رول مربوط</span>
                        )}
                      </div>

                      {secRoleId && (
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300">الرول الثانوي:</span>
                          <span className="font-mono text-purple-300 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {secMentionStr}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 2. Auto-Assigned Available Military Number */}
              <div className="bg-[#090b10] p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    <span>الرقم العسكري الشاغر المتاح *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const chosen = ranksList.find((r) => r.id === hiringRankId) || ranksList[0];
                      const auto = getNextAvailableMilitaryNo(hiringApp.sectorId, chosen?.name || 'جندي', hiringApp.id);
                      setHiringMilitaryNo(auto.militaryNo);
                      setHiringUnit(auto.unit);
                    }}
                    title="إعادة فحص الرقم الشاغر التالي بالمنظومة"
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>إعادة فحص</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={hiringMilitaryNo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setHiringMilitaryNo(val);
                      // Auto-sync with unit
                      const chosen = ranksList.find((r) => r.id === hiringRankId) || ranksList[0];
                      const sec = sectors.find((s) => s.id === hiringApp.sectorId);
                      const activeRules = unitRules && unitRules.length > 0 ? unitRules : DEFAULT_UNIT_RULES;
                      const rule = activeRules.find(
                        (r) => r.rankName === chosen?.name && (r.sectorId === hiringApp.sectorId || r.sectorId === 'all')
                      );
                      const rawPrefix = (sec?.unitPrefix || rule?.prefix || 'SWAT').trim().replace(/-+$/, '');
                      const prefix = (rawPrefix.slice(0, 4) || 'SWAT').toUpperCase();
                      setHiringUnit(val ? `${prefix}-${val}` : prefix);
                    }}
                    placeholder="مثال: 35 أو 51"
                    dir="ltr"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-black focus:outline-none focus:border-emerald-400 text-left"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs pointer-events-none">#</span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>شاغر ومتاح تلقائياً (مثلاً 35 لرتبة جندي أول)</span>
                </div>
              </div>

              {/* 3. 4-Letter Unit Assignment */}
              <div className="bg-[#090b10] p-3.5 rounded-xl border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>ترتيب ورمز اليونت (4 أحرف) *</span>
                </label>
                <input
                  type="text"
                  value={hiringUnit}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setHiringUnit(val);
                    // Extract trailing numbers and sync militaryNo
                    const match = val.match(/(\d+)$/);
                    if (match && match[1]) {
                      setHiringMilitaryNo(match[1]);
                    }
                  }}
                  placeholder="مثال: SWAT-35 أو AMEN-35"
                  dir="ltr"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300 font-mono text-sm font-black focus:outline-none focus:border-amber-400 text-left"
                />
                <span className="text-[10px] text-slate-400 block truncate">
                  يبدأ ببادئة القطاع (4 أحرف) مع الرقم الشاغر.
                </span>
              </div>

            </div>

            {/* Generated Discord Message Live Preview */}
            {(() => {
              const chosen = ranksList.find((r) => r.id === hiringRankId) || ranksList[0];
              const effRoleId = (hiringCustomRoleId || chosen?.discordRoleId || '').replace(/[^0-9]/g, '');
              const mentionStr = effRoleId ? `<@&${effRoleId}>` : '';
              const secRoleId = (chosen?.secondaryRoleId || '').replace(/[^0-9]/g, '');
              const secMentionStr = secRoleId ? `<@&${secRoleId}>` : '';

              const template = editableSettings.seniorOfficersMessageTemplate || 
                '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرتبة العسكرية:** {rank} ({rankRole})\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}';

              let formattedMessage = template
                .replace(/{applicantGameId}/g, hiringApp.gameId || '000')
                .replace(/{officerGameId}/g, currentUser.gameId || '12465')
                .replace(/{officerName}/g, currentUser.displayName || currentUser.username || 'مسؤول التوظيف')
                .replace(/{applicantName}/g, hiringApp.playerName || hiringApp.fullName || 'غير محدد')
                .replace(/{sectorName}/g, hiringApp.sectorName || 'غير محدد')
                .replace(/{unit}/g, hiringUnit || hiringApp.currentUnit || 'SWAT-35')
                .replace(/{rank}/g, chosen?.name || 'جندي')
                .replace(/{rankRole}/g, mentionStr)
                .replace(/{rankMention}/g, mentionStr)
                .replace(/{militaryNo}/g, hiringMilitaryNo || hiringApp.militaryNo || '35')
                .replace(/{discordId}/g, hiringApp.discordId ? (hiringApp.discordId.startsWith('<@') ? hiringApp.discordId : `<@${hiringApp.discordId}>`) : 'غير محدد');

              if (secMentionStr) {
                formattedMessage = formattedMessage.replace(/{secondaryRankRole}/g, secMentionStr);
              }

              return (
                <div className="space-y-2 bg-[#090b10] p-4 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>معاينة رسالة التوظيف مع منشن الرتبة واليونت:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formattedMessage);
                        setHasCopiedHiringText(true);
                        setTimeout(() => setHasCopiedHiringText(false), 2500);
                      }}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {hasCopiedHiringText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرسالة والرولات</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#2b2d31] border border-white/5 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed select-text">
                    {formattedMessage}
                  </div>
                </div>
              );
            })()}

            {/* Hiring Confirmation Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setHiringApp(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isDispatchingHiring}
                onClick={async () => {
                  const chosen = ranksList.find((r) => r.id === hiringRankId) || ranksList[0];
                  const effRoleId = (hiringCustomRoleId || chosen?.discordRoleId || '').replace(/[^0-9]/g, '');
                  const mentionStr = effRoleId ? `<@&${effRoleId}>` : '';
                  const secRoleId = (chosen?.secondaryRoleId || '').replace(/[^0-9]/g, '');
                  const secMentionStr = secRoleId ? `<@&${secRoleId}>` : '';

                  setIsDispatchingHiring(true);
                  await handleUpdateAppStatus(
                    hiringApp.id,
                    'مقبول',
                    hiringNotes,
                    {
                      rank: chosen?.name || 'جندي',
                      rankRoleId: effRoleId,
                      rankRoleMention: mentionStr,
                      secondaryRankRoleId: secRoleId,
                      secondaryRankRoleMention: secMentionStr,
                    },
                    hiringUnit,
                    hiringMilitaryNo || hiringApp.militaryNo
                  );
                  setIsDispatchingHiring(false);
                  setHiringApp(null);
                }}
                className={`px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 ${theme.buttonClass} shadow-lg`}
              >
                {isDispatchingHiring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التعيين وإرسال الإشعار...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد التوظيف وإرسال الإشعار لديسكورد</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. TRANSFER APPROVAL & RANK REASSIGNMENT MODAL */}
      {approvingTransferRequest && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setApprovingTransferRequest(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#0c0f16] border border-amber-500/30 rounded-2xl p-6 overflow-y-auto text-right shadow-2xl space-y-4 max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => setApprovingTransferRequest(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <h4 className="font-black text-white text-base">اعتماد نقل العسكري وتعيين رتبته الجديدة</h4>
                  <span className="text-[11px] text-amber-300 font-mono">
                    {approvingTransferRequest.applicantDisplayName} (@{approvingTransferRequest.applicantUsername})
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Old vs New Sector Summary Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs">
              <div className="border-l border-white/10 pl-3 space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">القطاع السابق (سيتم حذفه):</span>
                <div className="font-bold text-white text-sm">{approvingTransferRequest.currentSectorName}</div>
                <div className="text-slate-300 flex items-center gap-1">
                  <span>الرتبة القديمة: {approvingTransferRequest.currentRank || 'جندي'}</span>
                  {approvingTransferRequest.currentProtocol && (
                    <span className="px-1.5 py-0.2 rounded bg-white/10 text-slate-400 text-[10px] font-mono">
                      [{approvingTransferRequest.currentProtocol}]
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-cyan-400 block font-bold">القطاع الجديد المنقول إليه:</span>
                <div className="font-black text-cyan-300 text-sm">{approvingTransferRequest.targetSectorName}</div>
                <span className="text-[10px] text-emerald-400 font-semibold block">
                  سيتم تثبيت الرتبة والبروتوكول الجديدين أدناه
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs">
              <span className="text-slate-400 font-bold block mb-1">سبب النقل المذكور:</span>
              <p className="text-slate-200 italic font-semibold">"{approvingTransferRequest.reason}"</p>
            </div>

            {/* Destination Rank Selection */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>اختر الرتبة العسكرية في القطاع الجديد *</span>
                  <span className="text-[10px] text-slate-400 font-normal">تحدد البروتوكول تلقائياً</span>
                </label>
                <select
                  value={assignedTransferRank}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setAssignedTransferRank(selectedName);
                    const matched = ranksList.find(r => r.name === selectedName);
                    if (matched?.protocolPrefix) {
                      setAssignedTransferProtocol(matched.protocolPrefix);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {/* Prioritize target sector ranks, then general */}
                  {ranksList
                    .filter(r => r.sectorId === approvingTransferRequest.targetSectorId || r.sectorId === 'all' || !r.sectorId)
                    .map((r) => {
                      const displayEmoji = getSafeBadgeEmoji(r.badge, '🎖️');
                      return (
                        <option key={r.id} value={r.name}>
                          {displayEmoji} {r.name} — بروتوكول [{r.protocolPrefix || 'M-1'}] ({r.rankType === 'officer' ? 'ضباط' : 'أفراد'})
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Protocol Prefix Customizer with Presets */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    بادئة البروتوكول الجديد (M-1, M-2, I-2):
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    [{assignedTransferProtocol || 'M-1'}]
                  </span>
                </div>

                <input
                  type="text"
                  value={assignedTransferProtocol}
                  onChange={(e) => setAssignedTransferProtocol(e.target.value.toUpperCase())}
                  placeholder="M-1 أو I-2"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-amber-300 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-center"
                  dir="ltr"
                />

                {/* Quick Protocol Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {['M-1', 'M-2', 'M-3', 'M-4', 'I-1', 'I-2', 'I-3', 'I-4', 'I-5'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAssignedTransferProtocol(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                        assignedTransferProtocol === p
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* New Unit Code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رمز اليونت الجديد (Unit Code):
                </label>
                <input
                  type="text"
                  value={assignedTransferUnit}
                  onChange={(e) => setAssignedTransferUnit(e.target.value)}
                  placeholder="مثال: SWAT-7421 أو M-01"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                  dir="ltr"
                />
              </div>

              {/* Reviewer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ملاحظات القيادة / التدقيق (اختياري):
                </label>
                <textarea
                  value={transferReviewerNotes}
                  onChange={(e) => setTransferReviewerNotes(e.target.value)}
                  rows={2}
                  placeholder="مثال: تم قبول النقل بناء على التنسيق بين رئاسة القطاعين..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setApprovingTransferRequest(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isProcessingTransfer}
                onClick={handleConfirmApproveTransfer}
                className={`px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 ${theme.buttonClass} shadow-lg`}
              >
                {isProcessingTransfer ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري اعتماد النقل...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد النقل وتثبيت الرتبة الجديدة ✓</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. REJECT REQUEST MODAL */}
      {rejectingRequest && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setRejectingRequest(null)}
        >
          <div 
            className="relative w-full max-w-md bg-[#0c0f16] border border-red-500/30 rounded-2xl p-6 text-right shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-red-400">
                <h4 className="font-black text-white text-base">
                  رفض {rejectingRequest.type === 'transfer' ? 'طلب النقل' : 'طلب الفصل'}
                </h4>
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              أنت على وشك رفض الطلب المقدم من العسكري <strong className="text-white">({rejectingRequest.applicantDisplayName})</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                سبب الرفض والملاحظات للعسكري:
              </label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={3}
                placeholder="اكتب سبب الرفض هنا..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-red-400 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectRequest}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-lg"
              >
                تأكيد رفض الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. IMAGE PREVIEW / ZOOM LIGHTBOX MODAL */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-[#0c0f16] border border-white/20 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white text-sm">{zoomedImage.title}</span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={zoomedImage.url} 
              alt={zoomedImage.title} 
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
