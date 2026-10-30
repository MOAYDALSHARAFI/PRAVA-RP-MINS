import { Sector, ServerSettings, UserAccount, MilitaryRank, MilitaryProtocol, UnitRule } from '../types.ts';

export const DEFAULT_MILITARY_RANKS: MilitaryRank[] = [
  { id: 'rank-1', name: 'جندي', order: 1, protocolPrefix: 'M-1', rankType: 'soldier', discordRoleId: '1519090286670643250', discordRoleMention: '<@&1519090286670643250>', badge: '🎖️', sectorId: 'all', description: 'رتبة البداية للمستجدين والمقبولين الجدد' },
  { id: 'rank-2', name: 'جندي أول', order: 2, protocolPrefix: 'M-2', rankType: 'soldier', discordRoleId: '1519090327707979786', discordRoleMention: '<@&1519090327707979786>', badge: '🎖️', sectorId: 'all', description: 'رتبة ميدانية معتمدة بعد فترة التجربة' },
  { id: 'rank-3', name: 'عريف', order: 3, protocolPrefix: 'M-3', rankType: 'soldier', discordRoleId: '1519090347529994240', discordRoleMention: '<@&1519090347529994240>', badge: '🎗️', sectorId: 'all', description: 'مسؤول دورية ومساعد في قيادة المجموعات' },
  { id: 'rank-4', name: 'وكيل رقيب', order: 4, protocolPrefix: 'M-4', rankType: 'soldier', discordRoleId: '1519090401598902334', discordRoleMention: '<@&1519090401598902334>', badge: '🎗️', sectorId: 'all', description: 'مساعد قائد ميداني ومسؤول توجيه الأفراد' },
  { id: 'rank-5', name: 'رقيب', order: 5, protocolPrefix: 'M-5', rankType: 'soldier', discordRoleId: '1519090405986275518', discordRoleMention: '<@&1519090405986275518>', badge: '⭐', sectorId: 'all', description: 'قائد فرقة عمليات ميدانية' },
  { id: 'rank-6', name: 'رقيب أول', order: 6, protocolPrefix: 'M-6', rankType: 'soldier', discordRoleId: '', discordRoleMention: '', badge: '⭐', sectorId: 'all', description: 'مشرف على تدريب الصفوف وتوزيع المهام' },
  { id: 'rank-7', name: 'رئيس رقباء', order: 7, protocolPrefix: 'M-7', rankType: 'soldier', discordRoleId: '', discordRoleMention: '', badge: '⭐⭐', sectorId: 'all', description: 'أعلى رتبة في ضباط الصف' },
  { id: 'rank-8', name: 'ملازم', order: 8, protocolPrefix: 'I-1', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '🌟', sectorId: 'all', description: 'ضابط تحقيق وقائد قطاع ميداني' },
  { id: 'rank-9', name: 'ملازم أول', order: 9, protocolPrefix: 'I-2', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '🌟🌟', sectorId: 'all', description: 'ضابط عمليات ميدانية' },
  { id: 'rank-10', name: 'نقيب', order: 10, protocolPrefix: 'I-3', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '🌟🌟🌟', sectorId: 'all', description: 'قائد غرفة العمليات والتنسيق' },
  { id: 'rank-11', name: 'رائد', order: 11, protocolPrefix: 'I-4', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '👑', sectorId: 'all', description: 'نائب قائد قطاع' },
  { id: 'rank-12', name: 'مقدم', order: 12, protocolPrefix: 'I-5', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '👑🌟', sectorId: 'all', description: 'قائد قطاع تنفيذي' },
  { id: 'rank-13', name: 'عقيد', order: 13, protocolPrefix: 'I-6', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '👑🌟🌟', sectorId: 'all', description: 'رئاسة هيئة العمليات' },
  { id: 'rank-14', name: 'عميد', order: 14, protocolPrefix: 'I-7', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '🦅', sectorId: 'all', description: 'القيادة العامة' },
  { id: 'rank-15', name: 'لواء', order: 15, protocolPrefix: 'I-8', rankType: 'officer', discordRoleId: '', discordRoleMention: '', badge: '⚔️👑', sectorId: 'all', description: 'القيادة العليا المباشرة' },
];

export const DEFAULT_MILITARY_PROTOCOLS: MilitaryProtocol[] = [
  {
    id: 'proto-1',
    title: 'بروتوكول التوظيف ومباشرة العمليات الميدانية',
    category: 'recruitment',
    categoryLabel: 'التوظيف والمباشرة',
    content: '1. الالتزام بالسن النظامي والرقم العسكري الصادر من المنظومة.\n2. يُمنع مباشرة أي دورية دون ارتداء الزي الرسمي المعتمد للقطاع.\n3. تفعيل المنشن العسكري في ديسكورد واستلام الرتبة المعتمدة فور صدور قرار التعيين.\n4. التقيد ببادئة اليونت المكونة من 4 أحرف المخصصة للقطاع وعدم تغييرها دون إذن رسمي.',
    sectorId: 'all',
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proto-2',
    title: 'بروتوكول الاتصالات والنداءات اللاسلكية والراديو (10-Codes)',
    category: 'radio',
    categoryLabel: 'الراديو والعمليات',
    content: '1. استخدام الراديو الميداني مقتصر على البلاغات العسكرية والعمليات.\n2. نداء كود 10-99 يُعطى أولوية قصوى لكافة الوحدات الميدانية لتقديم الدعم الفوري.\n3. ذكر رمز اليونت الرباعي (مثال: SWAT-15 أو AMEN-22) واسم الضابط عند بدء أي نداء.\n4. يُمنع منعاً باتاً المزاح أو الكلام الجانبي على التردد الرئيسي.',
    sectorId: 'all',
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proto-3',
    title: 'بروتوكول قواعد الاشتباك واستخدام السلاح (ROE)',
    category: 'operations',
    categoryLabel: 'قواعد الاشتباك (ROE)',
    content: '1. التدرج في القوة: التحذير الشفهي، الصاعق الكهربائي (Taser)، ثم السلاح الناري.\n2. إطلاق النار مقتصر حصراً على حالات الدفاع عن النفس وحماية أرواح المدنيين من خطر وشيك.\n3. يُمنع إطلاق النار العشوائي أو إطلاق النار على مركبات هاربة ما لم تشكل تهديداً مميتاً.\n4. توثيق أي واقعة إطلاق نار ورفع تقرير فوري لقيادة العمليات.',
    sectorId: 'all',
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proto-4',
    title: 'بروتوكول الدوريات وتسيير اليونت الرباعي',
    category: 'operations',
    categoryLabel: 'الدوريات الميدانية',
    content: '1. كل دورية يجب أن تحمل كود يونت نظامي مكون من 4 أحرف ورقم عسكري (مثل SWAT-15 أو BORD-08).\n2. إبلاغ العمليات عند الخروج في دورية، تغيير الموقع، أو بدء استيقاف أمني.\n3. الالتزام بمسافة الأمان عند الاستيقاف وتأمين ظهر الدورية ومحيط الموقع.\n4. التنسيق الفوري مع القطاعات الشقيقة في حالات المطاردة العابرة للحدود.',
    sectorId: 'all',
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proto-5',
    title: 'مدونة السلوك والانضباط العسكري والمساءلة',
    category: 'conduct',
    categoryLabel: 'الانضباط والمساءلة',
    content: '1. احترام التسلسل القيادي والالتزام بأوامر الرتب الأعلى الميدانية.\n2. المعاملة الحسنة والاحترافية الكاملة مع جميع المواطنين في السيرفر.\n3. يُمنع استغلال الصلاحيات أو المركبات العسكرية في غير أوقات العمل.\n4. أي مخالفة جسيمة تُحال مباشرة للمحاكمة العسكرية وإلغاء الرتبة.',
    sectorId: 'all',
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proto-6',
    title: 'بروتوكول استحقاق الرتب والترقيات التراكمية',
    category: 'promotions',
    categoryLabel: 'الترقيات والمكافآت',
    content: '1. الترقيات تعتمد على الانضباط الميداني، عدد الساعات، وتقارير الإنجاز.\n2. لا تتم ترقية أي فرد إلا بقرار رسمي معتمد من صاحب الصلاحية في لوحة الإدارة.\n3. ترتبط الترقية بتحديث رول الديسكورد المربوط بها تلقائياً.\n4. يمكن منح ترقيات استثنائية لمن يظهر شجاعة وكفاءة منقطعة النظير في العمليات الكبرى.',
    sectorId: 'all',
    isActive: true,
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  serverLogo: '/server_logo.png',
  serverName: 'سيرفر PRAVA',
  discordUrl: 'https://discord.gg/dkUjf2bpy',
  discordName: 'ديسكورد PRAVA الأساسي',
  secondaryDiscordUrl: '',
  secondaryDiscordName: 'ديسكورد PRAVA (السيرفر العسكري)',
  secondaryDiscordGuildId: '',
  secondaryDiscordWebhookUrl: '',
  defaultUnitPrefix: 'SWAT',
  ownerContactUrl: 'https://discord.gg/dkUjf2bpy',
  announcement: {
    id: 'ann-1',
    title: 'مرحباً بكم في منظومة توظيف PRAVA المركزية',
    message: 'نظام التوظيف الموحد لقطاعات PRAVA يعمل الآن بكامل طاقته التشغيلية. يرجى من جميع الضباط الالتزام بمعايير القبول المعتمدة.',
    imageUrl: '',
    actionUrl: 'https://discord.gg/dkUjf2bpy',
    actionText: 'سيرفر الديسكورد الرسمي',
    isActive: true,
    updatedAt: new Date().toISOString(),
    updatedBy: '12465 (مالك السيرفر)',
  },
  webhookUrl: '',
  botToken: '',
  discordChannelId: '1556637676902547466',
  seniorOfficersWebhookUrl: '',
  seniorOfficersChannelId: '',
  seniorOfficersMessageTemplate:
    '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرتبة العسكرية:** {rank} ({rankRole})\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}',
  ranks: DEFAULT_MILITARY_RANKS,
  protocols: DEFAULT_MILITARY_PROTOCOLS,
};

export const DEFAULT_SECTORS: Sector[] = [
  {
    id: 'swat',
    name: 'SWAT',
    arabicName: 'سوات',
    subtitle: 'Special Weapons and Tactics',
    isOpen: true,
    badge: '/src/assets/images/swat_round_badge_1791840366509.jpg',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 17,
    unitPrefix: 'M-',
    maxRecruitmentRankId: 'rank-3',
    maxRecruitmentRankOrder: 3,
    rolesTemplate:
      'PRAVA ⚔️ [{unit}] | {gameId} | {playerName}\n🎖️ **الرتبة:** {rank}\n<@{discord}>\n{rankRole}\n<@&1519090286670643250>\n<@&1519090327707979786>',
    questions: [
      {
        id: 1,
        question: 'السوات تابع لأي وزارة؟',
        options: ['وزارة الداخلية', 'وزارة الدفاع'],
        correctIndex: 0,
      },
      {
        id: 2,
        question: 'متى يُسمح لك باستخدام السلاح الناري؟',
        options: ['في أي تهديد', 'عند الخطر المباشر فقط'],
        correctIndex: 1,
      },
      {
        id: 3,
        question: 'ما أول إجراء عند دخول موقع عملية؟',
        options: ['الاقتحام فوراً', 'تأمين المحيط والتنسيق مع القائد'],
        correctIndex: 1,
      },
      {
        id: 4,
        question: 'هل يجوز مخالفة أوامر القائد الميداني؟',
        options: ['نعم إذا كانت خاطئة', 'لا، التنفيذ ثم الاعتراض لاحقاً'],
        correctIndex: 1,
      },
      {
        id: 5,
        question: 'ما واجبك تجاه المدنيين أثناء العمليات؟',
        options: ['حمايتهم أولاً', 'إبعادهم عن الطريق فقط'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'public_security',
    name: 'Public Security',
    arabicName: 'الأمن العام',
    subtitle: 'المديرية العامة للأمن العام',
    isOpen: true,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 17,
    unitPrefix: 'AMEN',
    maxRecruitmentRankId: 'rank-3',
    maxRecruitmentRankOrder: 3,
    rolesTemplate:
      'PRAVA 🛡️ [{unit}] | {gameId} | {playerName}\n🎖️ **الرتبة:** {rank}\n<@{discord}>\n{rankRole}\n<@&1519090286670643250>',
    questions: [
      {
        id: 1,
        question: 'ما هي الأولوية القصوى لرجل الأمن العام؟',
        options: ['حفظ الأمن والنظام العام', 'المطاردة المباشرة دون إذن'],
        correctIndex: 0,
      },
      {
        id: 2,
        question: 'كيف يتم التعامل مع البلاغات الطارئة؟',
        options: ['إبلاغ العمليات فوراً والتوجه للموقع', 'الانتظار حتى انتهاء الدورية'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'cid',
    name: 'CID',
    arabicName: 'وكالة الاستخبارات المركزية',
    subtitle: 'وكالة الاستخبارات المركزية',
    isOpen: false,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 18,
    unitPrefix: 'CIDC',
    maxRecruitmentRankId: 'rank-3',
    maxRecruitmentRankOrder: 3,
    rolesTemplate:
      'PRAVA 🔍 [{unit}] | {gameId} | {playerName}\n🎖️ **الرتبة:** {rank}\n<@{discord}>\n{rankRole}\n<@&1519090286670643250>',
    questions: [
      {
        id: 1,
        question: 'ما هو المبدأ الأساسي في جمع المعلومات الاستخباراتية؟',
        options: ['السرية التامة والدقة المتناهية', 'النشر الفوري على الأجهزة اللاسلكية'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'gs',
    name: 'GS',
    arabicName: 'المباحث العامة',
    subtitle: 'المباحث العامة',
    isOpen: false,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 18,
    unitPrefix: 'MABH',
    maxRecruitmentRankId: 'rank-3',
    maxRecruitmentRankOrder: 3,
    rolesTemplate:
      'PRAVA ⚔️ [{unit}] | {gameId} | {playerName}\n🎖️ **الرتبة:** {rank}\n<@{discord}>\n{rankRole}\n<@&1519090286670643250>',
    questions: [
      {
        id: 1,
        question: 'متى يتم الشروع في عملية المداهمة الاستقصائية؟',
        options: ['بعد صدور إذن قضائي وأمر قائد المباحث', 'بشكل عفوي عند الشك الشخصي'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'border_guard',
    name: 'Border Guard',
    arabicName: 'مديرية حرس الحدود',
    subtitle: 'مديرية حرس الحدود',
    isOpen: true,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 17,
    unitPrefix: 'BORD',
    maxRecruitmentRankId: 'rank-3',
    maxRecruitmentRankOrder: 3,
    rolesTemplate:
      'PRAVA 🧭 [{unit}] | {gameId} | {playerName}\n🎖️ **الرتبة:** {rank}\n<@{discord}>\n{rankRole}\n<@&1519090286670643250>',
    questions: [
      {
        id: 1,
        question: 'ما هو الإجراء عند رصد اختراق للحدود الإقليمية؟',
        options: ['التعامل التكتيكي وفق قواعد الاشتباك المعتمدة', 'المغادرة دون بلاغ'],
        correctIndex: 0,
      },
    ],
  },
];

export interface FallbackUser extends UserAccount {
  passwordHash: string;
}

export const DEFAULT_USERS: FallbackUser[] = [
  {
    id: 'u-admin',
    username: 'admin',
    passwordHash: 'prava2026',
    displayName: '12465',
    gameId: '12465',
    discordUsername: 'PRAVA_Owner',
    role: 'owner',
    roleTitle: 'مالك السيرفر',
    status: 'active',
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
      canApproveAccounts: true,
      canManageAnnouncements: true,
      canManageRanks: true,
      canManageProtocols: true,
      allowedSectors: ['*'],
    },
    createdAt: '2026-10-10T00:00:00.000Z',
  },
];

export const DEFAULT_UNIT_RULES: UnitRule[] = [
  // ==========================================
  // 1. قطاع سوات (SWAT) - توزيع ونطاقات مخصصة
  // ==========================================
  { id: 'ur-swat-1', sectorId: 'swat', rankName: 'جندي', prefix: 'M-', rangeStart: 1, rangeEnd: 30, description: 'يونتات سوات - أفراد الاقتحام والتدخل السريع (M-1 إلى M-30)', badge: '🎖️' },
  { id: 'ur-swat-2', sectorId: 'swat', rankName: 'جندي أول', prefix: 'M-', rangeStart: 31, rangeEnd: 50, description: 'يونتات سوات - أفراد الميدان المتقدمين (M-31 إلى M-50)', badge: '🎖️' },
  { id: 'ur-swat-3', sectorId: 'swat', rankName: 'عريف', prefix: 'M-', rangeStart: 51, rangeEnd: 65, description: 'يونتات سوات - مسؤولي فرق الاقتحام (M-51 إلى M-65)', badge: '🎗️' },
  { id: 'ur-swat-4', sectorId: 'swat', rankName: 'وكيل رقيب', prefix: 'M-', rangeStart: 66, rangeEnd: 80, description: 'يونتات سوات - مساعدي قادة المجموعات (M-66 إلى M-80)', badge: '🎗️' },
  { id: 'ur-swat-5', sectorId: 'swat', rankName: 'رقيب', prefix: 'M-', rangeStart: 81, rangeEnd: 95, description: 'يونتات سوات - قادة الفرق الميدانية (M-81 إلى M-95)', badge: '⭐' },
  { id: 'ur-swat-6', sectorId: 'swat', rankName: 'رقيب أول', prefix: 'M-', rangeStart: 96, rangeEnd: 110, description: 'يونتات سوات - مسؤولي التكتيك والعمليات (M-96 إلى M-110)', badge: '⭐' },
  { id: 'ur-swat-7', sectorId: 'swat', rankName: 'رئيس رقباء', prefix: 'M-', rangeStart: 111, rangeEnd: 125, description: 'يونتات سوات - كبار ضباط الصف (M-111 إلى M-125)', badge: '⭐⭐' },
  { id: 'ur-swat-8', sectorId: 'swat', rankName: 'ملازم', prefix: 'M-I-', rangeStart: 1, rangeEnd: 15, description: 'يونتات سوات - ضباط العمليات الخاصة (M-I-1 إلى M-I-15)', badge: '🌟' },
  { id: 'ur-swat-9', sectorId: 'swat', rankName: 'ملازم أول', prefix: 'M-I-', rangeStart: 16, rangeEnd: 30, description: 'يونتات سوات - ضباط التخطيط الميداني (M-I-16 إلى M-I-30)', badge: '🌟🌟' },
  { id: 'ur-swat-10', sectorId: 'swat', rankName: 'نقيب', prefix: 'M-I-', rangeStart: 31, rangeEnd: 45, description: 'يونتات سوات - قادة العمليات التكتيكية (M-I-31 إلى M-I-45)', badge: '🌟🌟🌟' },
  { id: 'ur-swat-11', sectorId: 'swat', rankName: 'رائد', prefix: 'M-I-', rangeStart: 46, rangeEnd: 60, description: 'يونتات سوات - نواب قيادة السوات (M-I-46 إلى M-I-60)', badge: '👑' },
  { id: 'ur-swat-12', sectorId: 'swat', rankName: 'مقدم', prefix: 'M-I-', rangeStart: 61, rangeEnd: 75, description: 'يونتات سوات - قادة قطاع السوات (M-I-61 إلى M-I-75)', badge: '👑🌟' },
  { id: 'ur-swat-13', sectorId: 'swat', rankName: 'عقيد', prefix: 'M-I-', rangeStart: 76, rangeEnd: 90, description: 'يونتات سوات - ركن هيئة التدخل السريع (M-I-76 إلى M-I-90)', badge: '👑🌟🌟' },
  { id: 'ur-swat-14', sectorId: 'swat', rankName: 'عميد', prefix: 'M-F-', rangeStart: 1, rangeEnd: 5, description: 'يونتات سوات - القيادة الاستراتيجية العليا (M-F-1 إلى M-F-5)', badge: '🦅' },
  { id: 'ur-swat-15', sectorId: 'swat', rankName: 'لواء', prefix: 'M-F-', rangeStart: 6, rangeEnd: 10, description: 'يونتات سوات - القائد العام لقوات السوات (M-F-6 إلى M-F-10)', badge: '⚔️👑' },

  // ==========================================
  // 2. قطاع الأمن العام (Public Security)
  // ==========================================
  { id: 'ur-sec-1', sectorId: 'public_security', rankName: 'جندي', prefix: 'SEC-', rangeStart: 1, rangeEnd: 30, description: 'يونتات الأمن العام - دوريات الميدان والحراسات (SEC-1 إلى SEC-30)', badge: '🎖️' },
  { id: 'ur-sec-2', sectorId: 'public_security', rankName: 'جندي أول', prefix: 'SEC-', rangeStart: 31, rangeEnd: 50, description: 'يونتات الأمن العام - الدوريات الأمنية المعتمدة (SEC-31 إلى SEC-50)', badge: '🎖️' },
  { id: 'ur-sec-3', sectorId: 'public_security', rankName: 'عريف', prefix: 'SEC-', rangeStart: 51, rangeEnd: 65, description: 'يونتات الأمن العام - مسؤولي الدوريات ونقاط التفتيش (SEC-51 إلى SEC-65)', badge: '🎗️' },
  { id: 'ur-sec-4', sectorId: 'public_security', rankName: 'وكيل رقيب', prefix: 'SEC-', rangeStart: 66, rangeEnd: 80, description: 'يونتات الأمن العام - قادة الفرق الأمنية الميدانية', badge: '🎗️' },
  { id: 'ur-sec-5', sectorId: 'public_security', rankName: 'رقيب', prefix: 'SEC-', rangeStart: 81, rangeEnd: 95, description: 'يونتات الأمن العام - مشرفي القطاعات الأمنية', badge: '⭐' },
  { id: 'ur-sec-6', sectorId: 'public_security', rankName: 'رقيب أول', prefix: 'SEC-', rangeStart: 96, rangeEnd: 110, description: 'يونتات الأمن العام - مسؤولي العمليات والمتابعة', badge: '⭐' },
  { id: 'ur-sec-7', sectorId: 'public_security', rankName: 'رئيس رقباء', prefix: 'SEC-', rangeStart: 111, rangeEnd: 125, description: 'يونتات الأمن العام - كبار ضباط صف الأمن العام', badge: '⭐⭐' },
  { id: 'ur-sec-8', sectorId: 'public_security', rankName: 'ملازم', prefix: 'SEC-I-', rangeStart: 1, rangeEnd: 15, description: 'يونتات الأمن العام - ضباط الميدان والتحقيق (SEC-I-1 إلى SEC-I-15)', badge: '🌟' },
  { id: 'ur-sec-9', sectorId: 'public_security', rankName: 'ملازم أول', prefix: 'SEC-I-', rangeStart: 16, rangeEnd: 30, description: 'يونتات الأمن العام - ضباط العمليات (SEC-I-16 إلى SEC-I-30)', badge: '🌟🌟' },
  { id: 'ur-sec-10', sectorId: 'public_security', rankName: 'نقيب', prefix: 'SEC-I-', rangeStart: 31, rangeEnd: 45, description: 'يونتات الأمن العام - قادة المراكز الأمنية (SEC-I-31 إلى SEC-I-45)', badge: '🌟🌟🌟' },
  { id: 'ur-sec-11', sectorId: 'public_security', rankName: 'رائد', prefix: 'SEC-I-', rangeStart: 46, rangeEnd: 60, description: 'يونتات الأمن العام - مساعدي مدراء الأمن العام', badge: '👑' },
  { id: 'ur-sec-12', sectorId: 'public_security', rankName: 'مقدم', prefix: 'SEC-I-', rangeStart: 61, rangeEnd: 75, description: 'يونتات الأمن العام - مدراء شؤون الأمن العام', badge: '👑🌟' },
  { id: 'ur-sec-13', sectorId: 'public_security', rankName: 'عقيد', prefix: 'SEC-I-', rangeStart: 76, rangeEnd: 90, description: 'يونتات الأمن العام - قيادة هيئة الأمن العام', badge: '👑🌟🌟' },
  { id: 'ur-sec-14', sectorId: 'public_security', rankName: 'عميد', prefix: 'SEC-F-', rangeStart: 1, rangeEnd: 5, description: 'يونتات الأمن العام - نائب مدير الأمن العام', badge: '🦅' },
  { id: 'ur-sec-15', sectorId: 'public_security', rankName: 'لواء', prefix: 'SEC-F-', rangeStart: 6, rangeEnd: 10, description: 'يونتات الأمن العام - مدير الأمن العام العام', badge: '⚔️👑' },

  // ==========================================
  // 3. وكالة الاستخبارات المركزية (CID)
  // ==========================================
  { id: 'ur-cid-1', sectorId: 'cid', rankName: 'جندي', prefix: 'CIA-', rangeStart: 1, rangeEnd: 25, description: 'يونتات الاستخبارات - عملاء الرصد الميداني (CIA-1 إلى CIA-25)', badge: '🎖️' },
  { id: 'ur-cid-2', sectorId: 'cid', rankName: 'جندي أول', prefix: 'CIA-', rangeStart: 26, rangeEnd: 45, description: 'يونتات الاستخبارات - عملاء المتابعة والتحري (CIA-26 إلى CIA-45)', badge: '🎖️' },
  { id: 'ur-cid-3', sectorId: 'cid', rankName: 'عريف', prefix: 'CIA-', rangeStart: 46, rangeEnd: 60, description: 'يونتات الاستخبارات - مسؤولي فرق المراقبة', badge: '🎗️' },
  { id: 'ur-cid-4', sectorId: 'cid', rankName: 'وكيل رقيب', prefix: 'CIA-', rangeStart: 61, rangeEnd: 75, description: 'يونتات الاستخبارات - مساعدي قادة الخلايا الاستخباراتية', badge: '🎗️' },
  { id: 'ur-cid-5', sectorId: 'cid', rankName: 'رقيب', prefix: 'CIA-', rangeStart: 76, rangeEnd: 90, description: 'يونتات الاستخبارات - قادة خلايا جمع المعلومات', badge: '⭐' },
  { id: 'ur-cid-6', sectorId: 'cid', rankName: 'ملازم', prefix: 'CIA-I-', rangeStart: 1, rangeEnd: 15, description: 'يونتات الاستخبارات - ضباط التحقيق السري (CIA-I-1 إلى CIA-I-15)', badge: '🌟' },
  { id: 'ur-cid-7', sectorId: 'cid', rankName: 'نقيب', prefix: 'CIA-I-', rangeStart: 16, rangeEnd: 30, description: 'يونتات الاستخبارات - قادة الأقسام الاستخباراتية', badge: '🌟🌟🌟' },
  { id: 'ur-cid-8', sectorId: 'cid', rankName: 'عقيد', prefix: 'CIA-I-', rangeStart: 31, rangeEnd: 45, description: 'يونتات الاستخبارات - إدارة العمليات الاستخبارية', badge: '👑🌟🌟' },
  { id: 'ur-cid-9', sectorId: 'cid', rankName: 'لواء', prefix: 'CIA-F-', rangeStart: 1, rangeEnd: 5, description: 'يونتات الاستخبارات - رئيس جهاز الاستخبارات المركزية', badge: '⚔️👑' },

  // ==========================================
  // 4. المباحث العامة (GS)
  // ==========================================
  { id: 'ur-gs-1', sectorId: 'gs', rankName: 'جندي', prefix: 'MABH-', rangeStart: 1, rangeEnd: 25, description: 'يونتات المباحث - محققي الميدان والمستجدين (MABH-1 إلى MABH-25)', badge: '🎖️' },
  { id: 'ur-gs-2', sectorId: 'gs', rankName: 'جندي أول', prefix: 'MABH-', rangeStart: 26, rangeEnd: 45, description: 'يونتات المباحث - محققي القضايا المعتمدين', badge: '🎖️' },
  { id: 'ur-gs-3', sectorId: 'gs', rankName: 'عريف', prefix: 'MABH-', rangeStart: 46, rangeEnd: 60, description: 'يونتات المباحث - مسؤولي فرق الضبط الجنائي', badge: '🎗️' },
  { id: 'ur-gs-4', sectorId: 'gs', rankName: 'رقيب', prefix: 'MABH-', rangeStart: 61, rangeEnd: 75, description: 'يونتات المباحث - قادة فرق التفتيش والمداهمات', badge: '⭐' },
  { id: 'ur-gs-5', sectorId: 'gs', rankName: 'ملازم', prefix: 'MABH-I-', rangeStart: 1, rangeEnd: 15, description: 'يونتات المباحث - ضباط التحقيق الجنائي الميداني', badge: '🌟' },
  { id: 'ur-gs-6', sectorId: 'gs', rankName: 'نقيب', prefix: 'MABH-I-', rangeStart: 16, rangeEnd: 30, description: 'يونتات المباحث - قادة مكاتب المباحث', badge: '🌟🌟🌟' },
  { id: 'ur-gs-7', sectorId: 'gs', rankName: 'عقيد', prefix: 'MABH-I-', rangeStart: 31, rangeEnd: 45, description: 'يونتات المباحث - مدراء شؤون المباحث العامة', badge: '👑🌟🌟' },
  { id: 'ur-gs-8', sectorId: 'gs', rankName: 'لواء', prefix: 'MABH-F-', rangeStart: 1, rangeEnd: 5, description: 'يونتات المباحث - مدير عام المباحث العامة', badge: '⚔️👑' },

  // ==========================================
  // 5. مديرية حرس الحدود (Border Guard)
  // ==========================================
  { id: 'ur-bg-1', sectorId: 'border_guard', rankName: 'جندي', prefix: 'BG-', rangeStart: 1, rangeEnd: 30, description: 'يونتات حرس الحدود - دوريات الحدود الساحلية والبرية (BG-1 إلى BG-30)', badge: '🎖️' },
  { id: 'ur-bg-2', sectorId: 'border_guard', rankName: 'جندي أول', prefix: 'BG-', rangeStart: 31, rangeEnd: 50, description: 'يونتات حرس الحدود - دوريات المراقبة الميدانية', badge: '🎖️' },
  { id: 'ur-bg-3', sectorId: 'border_guard', rankName: 'عريف', prefix: 'BG-', rangeStart: 51, rangeEnd: 65, description: 'يونتات حرس الحدود - مسؤولي أبراج المراقبة والكمائن', badge: '🎗️' },
  { id: 'ur-bg-4', sectorId: 'border_guard', rankName: 'رقيب', prefix: 'BG-', rangeStart: 66, rangeEnd: 80, description: 'يونتات حرس الحدود - قادة الدوريات الحدودية', badge: '⭐' },
  { id: 'ur-bg-5', sectorId: 'border_guard', rankName: 'ملازم', prefix: 'BG-I-', rangeStart: 1, rangeEnd: 15, description: 'يونتات حرس الحدود - ضباط قطاعات الحدود', badge: '🌟' },
  { id: 'ur-bg-6', sectorId: 'border_guard', rankName: 'نقيب', prefix: 'BG-I-', rangeStart: 16, rangeEnd: 30, description: 'يونتات حرس الحدود - قادة المراكز الحدودية', badge: '🌟🌟🌟' },
  { id: 'ur-bg-7', sectorId: 'border_guard', rankName: 'لواء', prefix: 'BG-F-', rangeStart: 1, rangeEnd: 5, description: 'يونتات حرس الحدود - قائد عام حرس الحدود', badge: '⚔️👑' },

  // ==========================================
  // 6. قواعد ونطاقات عامة (لكافة القطاعات)
  // ==========================================
  { id: 'ur-1', sectorId: 'all', rankName: 'جندي', prefix: 'M-', rangeStart: 1, rangeEnd: 34, description: 'يونتات الأفراد والمستجدين الجدد (M-1 إلى M-34)', badge: '🎖️' },
  { id: 'ur-2', sectorId: 'all', rankName: 'جندي أول', prefix: 'M-', rangeStart: 35, rangeEnd: 50, description: 'يونتات أفراد الميدان المعتمدين (M-35 إلى M-50)', badge: '🎖️' },
  { id: 'ur-3', sectorId: 'all', rankName: 'عريف', prefix: 'M-', rangeStart: 51, rangeEnd: 65, description: 'يونتات مسؤولي الدوريات والمجموعات (M-51 إلى M-65)', badge: '🎗️' },
  { id: 'ur-4', sectorId: 'all', rankName: 'وكيل رقيب', prefix: 'M-', rangeStart: 66, rangeEnd: 80, description: 'يونتات مساعدي القادة الميدانيين (M-66 إلى M-80)', badge: '🎗️' },
  { id: 'ur-5', sectorId: 'all', rankName: 'رقيب', prefix: 'M-', rangeStart: 81, rangeEnd: 95, description: 'يونتات قادة الفرق الميدانية (M-81 إلى M-95)', badge: '⭐' },
  { id: 'ur-6', sectorId: 'all', rankName: 'رقيب أول', prefix: 'M-', rangeStart: 96, rangeEnd: 110, description: 'يونتات مشرفي التدريب والعمليات (M-96 إلى M-110)', badge: '⭐' },
  { id: 'ur-7', sectorId: 'all', rankName: 'رئيس رقباء', prefix: 'M-', rangeStart: 111, rangeEnd: 125, description: 'يونتات كبار ضباط الصف (M-111 إلى M-125)', badge: '⭐⭐' },
  { id: 'ur-8', sectorId: 'all', rankName: 'ملازم', prefix: 'I-', rangeStart: 1, rangeEnd: 15, description: 'يونتات الضباط المحققين (I-1 إلى I-15)', badge: '🌟' },
  { id: 'ur-9', sectorId: 'all', rankName: 'ملازم أول', prefix: 'I-', rangeStart: 16, rangeEnd: 30, description: 'يونتات ضباط العمليات الميدانية (I-16 إلى I-30)', badge: '🌟🌟' },
  { id: 'ur-10', sectorId: 'all', rankName: 'نقيب', prefix: 'I-', rangeStart: 31, rangeEnd: 45, description: 'يونتات قادة غرف العمليات والتنسيق (I-31 إلى I-45)', badge: '🌟🌟🌟' },
  { id: 'ur-11', sectorId: 'all', rankName: 'رائد', prefix: 'I-', rangeStart: 46, rangeEnd: 60, description: 'يونتات نواب قادة القطاعات (I-46 إلى I-60)', badge: '👑' },
  { id: 'ur-12', sectorId: 'all', rankName: 'مقدم', prefix: 'I-', rangeStart: 61, rangeEnd: 75, description: 'يونتات قادة القطاعات التنفيذية (I-61 إلى I-75)', badge: '👑🌟' },
  { id: 'ur-13', sectorId: 'all', rankName: 'عقيد', prefix: 'I-', rangeStart: 76, rangeEnd: 90, description: 'يونتات رئاسة هيئة العمليات (I-76 إلى I-90)', badge: '👑🌟🌟' },
  { id: 'ur-14', sectorId: 'all', rankName: 'عميد', prefix: 'F-', rangeStart: 1, rangeEnd: 5, description: 'يونتات القيادة العامة العليا (F-1 إلى F-5)', badge: '🦅' },
  { id: 'ur-15', sectorId: 'all', rankName: 'لواء', prefix: 'F-', rangeStart: 6, rangeEnd: 10, description: 'يونتات القيادة العسكرية العليا المباشرة (F-6 إلى F-10)', badge: '⚔️👑' },
];

