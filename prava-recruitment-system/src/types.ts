export type ThemeId = 'prava-gold' | 'tactical-emerald' | 'cyber-navy' | 'crimson-vanguard';
export type DesignStyle = 'modern' | 'classic' | 'apex';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameAr: string;
  accentColor: string;
  badgeBg: string;
  primaryClass: string;
  borderClass: string;
  glowClass: string;
  buttonClass: string;
}

export interface SectorQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Sector {
  id: string;
  name: string;
  arabicName: string;
  subtitle: string;
  isOpen: boolean;
  badge?: string;
  discordRoomUrl?: string;
  webhookUrl?: string;
  discordChannelId?: string;
  minAge: number;
  rolesTemplate: string;
  unitPrefix?: string; // 4-letter unit prefix (e.g. 'SWAT', 'AMEN', 'BORD', 'CIDC')
  maxRecruitmentRankId?: string; // أقصى رتبة مسموح بها للتوظيف المباشر في هذا القطاع
  maxRecruitmentRankOrder?: number; // الترتيب الأقصى للرتبة للتوظيف
  autoAccept?: boolean; // نظام القبول التلقائي الفوري لأي شخص يقدم في هذا القطاع
  questions: SectorQuestion[];
}

export interface MilitaryRank {
  id: string;
  name: string; // e.g. 'جندي', 'عريف', 'ملازم'
  order: number; // 1, 2, 3...
  protocolPrefix?: string; // بادئة بروتوكول الرتبة e.g. 'M-1', 'M-2', 'I-1', 'I-2'
  rankType?: 'soldier' | 'officer'; // فئة الرتبة: أفراد (جنود) أو ضباط
  discordRoleId: string; // Discord Role ID (e.g. '1519090286670643250') - رول الديسكورد الأساسي (نشط حالياً)
  discordRoleMention?: string; // '<@&1519090286670643250>' - منشن الرول الأساسي
  secondaryRoleId?: string; // آيدي رول الديسكورد الثانوي (السيرفر العسكري)
  secondaryRoleMention?: string; // منشن رول الديسكورد الثانوي (السيرفر العسكري)
  sectorId?: string; // 'all' or specific sector ID
  description?: string;
  badge?: string; // '🎖️', '⭐', or image URL/path
}

export interface UnitRule {
  id: string;
  sectorId: string; // 'all' or specific sector ID (e.g. 'swat', 'public_security')
  rankName: string; // e.g. 'جندي', 'جندي أول', 'لواء'
  rankId?: string;
  prefix: string; // بادئة اليونت مثل 'M-', 'F-', 'I-', 'SWAT-'
  rangeStart: number; // بداية نطاق الأرقام مثل 1 أو 35
  rangeEnd: number; // نهاية نطاق الأرقام مثل 34 أو 50
  description?: string;
  badge?: string;
}

export type PersonnelRequestType = 'transfer' | 'discharge';
export type PersonnelRequestStatus = 'قيد المراجعة' | 'مقبول' | 'مرفوض';

export interface PersonnelRequest {
  id: string;
  type: PersonnelRequestType; // 'transfer' (طلب نقل) | 'discharge' (طلب فصل)
  applicantUsername: string;
  applicantDisplayName: string;
  applicantGameId?: string;
  applicantDiscord?: string;
  currentSectorId: string;
  currentSectorName: string;
  currentRank?: string;
  currentProtocol?: string; // e.g. 'M-1', 'M-2'
  currentUnit?: string;
  
  // In case of transfer:
  targetSectorId?: string;
  targetSectorName?: string;
  assignedNewRank?: string;
  assignedNewProtocol?: string; // e.g. 'I-2'
  assignedNewUnit?: string;
  
  reason: string;
  status: PersonnelRequestStatus;
  reviewedBy?: string;
  reviewerNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface MilitaryProtocol {
  id: string;
  title: string;
  category: 'recruitment' | 'operations' | 'radio' | 'conduct' | 'promotions' | 'general';
  categoryLabel?: string;
  content: string;
  sectorId?: string; // 'all' or specific sector
  isActive: boolean;
  updatedAt?: string;
}

export interface Application {
  id: string;
  sectorId: string;
  sectorName: string;
  playerName: string;
  fullName: string;
  discordId: string;
  gameId: string;
  age: number;
  militaryNo: string;
  gender: string;
  currentUnit: string;
  acceptanceOfficer?: string;
  rank?: string; // الرتبة المعينة عند القبول
  rankProtocol?: string; // بادئة بروتوكول الرتبة e.g. M-1, I-2
  rankRoleId?: string; // آيدي رول الرتبة في ديسكورد الأساسي
  secondaryRankRoleId?: string; // آيدي رول الرتبة في ديسكورد الثانوي (السيرفر العسكري)
  rankRoleMention?: string; // منشن الرتبة في ديسكورد الأساسي (<@&ID>)
  secondaryRankRoleMention?: string; // منشن الرتبة في ديسكورد الثانوي (السيرفر العسكري)
  serviceStatus?: 'active' | 'transferred' | 'discharged';
  transferNotes?: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  rolesProofImg?: string;
  uniformImg?: string;
  status: 'قيد المراجعة' | 'مقبول' | 'مرفوض';
  reviewerNotes?: string;
  createdAt: string;
}

export interface LoginLog {
  id: string;
  username: string;
  timestamp: string;
  createdAt?: string; // ISO format for 14-day calculation
  action?: 'login' | 'logout' | 'register' | 'application_submit' | 'user_approved' | string;
  deviceId?: string;
  deviceAccountsCount?: number;
  deviceApplicationsCount?: number;
  displayName?: string;
  roleTitle?: string;
  details?: string;
}

export type UserRole = 'owner' | 'leader' | 'officer' | 'applicant';
export type AccountStatus = 'active' | 'pending' | 'rejected';

export interface UserPermissions {
  // Applications Management
  canViewApps?: boolean;
  canAcceptApps?: boolean;
  canRejectApps?: boolean;
  canDeleteApps?: boolean;
  canExportApps?: boolean;
  canAddNotes?: boolean;

  // Sector Settings & Unit Prefix
  canToggleSector?: boolean;
  canEditSectorInfo?: boolean;
  canEditRolesTemplate?: boolean;
  canEditUnitPrefix?: boolean;
  canEditQuestions?: boolean;

  // Server Identity & Webhooks
  canChangeServerLogo?: boolean;
  canChangeDiscordLinks?: boolean;
  canConfigureWebhooks?: boolean;
  canViewAuditLogs?: boolean;

  // Staff & Accounts
  canManageAccounts?: boolean;
  canAssignPermissions?: boolean;
  canCreateRecruitmentOfficers?: boolean;
  canApproveAccounts?: boolean; // صلاحية تفعيل واعتماد الحسابات المعلقة

  // Broadcast & Announcements
  canManageAnnouncements?: boolean; // صلاحية إضافة وتعديل الإعلانات المنبثقة

  // Protocols & Military Ranks
  canManageRanks?: boolean; // صلاحية إدارة الرتب العسكرية ومنشنات الديسكورد
  canManageProtocols?: boolean; // صلاحية تعديل وإدارة البروتوكولات العسكرية
  canManageTransfers?: boolean; // صلاحية اعتماد وإدارة طلبات النقل والفصل

  // Scoped Sectors
  allowedSectors: string[]; // ['*'] for all, or ['swat', 'cid', etc.]
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  gameId?: string;
  discordUsername?: string;
  role: UserRole;
  roleTitle: string;
  status?: AccountStatus; // 'active' | 'pending' | 'rejected'
  activeSectorId?: string;
  activeSectorName?: string;
  activeRank?: string;
  activeRankProtocol?: string; // بادئة بروتوكول الرتبة (مثل M-1 أو I-2)
  activeUnit?: string;
  serviceStatus?: 'active' | 'transferred' | 'discharged';
  registeredDeviceId?: string;
  requestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  permissions: UserPermissions;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
  interactiveFx?: string; // نوع المؤثر التفاعلي المصاحب للإعلان (15 خيار تفاعلي)
  enableSound?: boolean; // تفعيل المؤثرات الصوتية المصاحبة
  customSoundUrl?: string; // رابط أو ملف صوت مخصص لهذا الإعلان
}

export interface ServerSettings {
  serverLogo: string;
  serverName: string;
  discordUrl: string;
  discordName: string;
  secondaryDiscordUrl?: string; // رابط سيرفر الديسكورد الثاني (السيرفر العسكري)
  secondaryDiscordName?: string; // اسم سيرفر الديسكورد الثاني (السيرفر العسكري)
  secondaryDiscordGuildId?: string; // آيدي سيرفر الديسكورد الثانوي
  secondaryDiscordWebhookUrl?: string; // ويب هوك سيرفر الديسكورد الثانوي (اختياري)
  defaultUnitPrefix: string;
  ownerContactUrl?: string; // رابط التواصل المباشر مع الأونر للتفعيل السريع
  announcement?: Announcement; // الإعلان المنبثق
  customFxSounds?: Record<string, string>; // أصوات المؤثرات المخصصة للمطور (fxId -> URL or base64)
  customAnnouncementSoundUrl?: string; // صوت الإعلانات الموحد العام
  soundVolume?: number; // مستوى الصوت الافتراضي (0 - 1)
  webhookUrl?: string; // رابط الويب هوك للديسكورد
  botToken?: string; // توكن بوت الديسكورد
  discordChannelId?: string; // آيدي روم / قناة إرسال الرسائل
  discordRoomUrl?: string; // رابط روم إرسال الطلبات
  seniorOfficersWebhookUrl?: string; // رابط ويب هوك شات كبار الضباط
  seniorOfficersChannelId?: string; // آيدي روم كبار الضباط
  seniorOfficersMessageTemplate?: string; // صيغة رسالة التوظيف المرسلة لكبار الضباط
  ranks?: MilitaryRank[]; // قائمة الرتب العسكرية مع بادئات البروتوكول ومنشنات الديسكورد
  protocols?: MilitaryProtocol[]; // البروتوكولات واللوائح الميدانية
  personnelRequests?: PersonnelRequest[]; // طلبات النقل والفصل
  unitRules?: UnitRule[]; // قواعد ونطاقات اليونتات العسكرية لكل رتبة وقطاع
  autoAcceptApplications?: boolean; // زر القبول الفوري التلقائي العام للقادة في الإعدادات
}
