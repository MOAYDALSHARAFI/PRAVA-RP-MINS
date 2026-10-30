export interface InteractiveAnnouncementFx {
  id: string;
  name: string;
  description: string;
  icon: string;
  tag: string;
  category: 'celebration' | 'military' | 'urgent' | 'tactical';
}

export const ANNOUNCEMENT_INTERACTIVE_FX: InteractiveAnnouncementFx[] = [
  {
    id: 'military_car',
    name: 'دورية وسيارات عسكرية متحركة 🚔',
    description: 'سيارة دورية تكتيكية تعبر الشاشة مع وميض أضواء الطوارئ وصوت السارينة الميدانية الحقيقية',
    icon: '🚔',
    tag: 'موصى به',
    category: 'military',
  },
  {
    id: 'fireworks',
    name: 'ألعاب نارية واحتفالات كبرى 🎆',
    description: 'انفجار قذائف الألعاب النارية وقصاصات الاحتفال في كامل أرجاء الشاشة مع أصوات فرقعة عالية',
    icon: '🎆',
    tag: 'احتفالي',
    category: 'celebration',
  },
  {
    id: 'helicopter',
    name: 'طائرة هليكوبتر أباتشي 🚁',
    description: 'مروحية حربية تحلق في سماء الإعلان مع دوران شفرات المروحية وصوت المحرك التكتيكي',
    icon: '🚁',
    tag: 'عمليات جوية',
    category: 'military',
  },
  {
    id: 'radar_scan',
    name: 'رادار مسح تكتيكي متطور 📡',
    description: 'حزمة رادار خضراء تلف 360 درجة مع نبضات الرصد التكتيكية وصوت بيب السونار',
    icon: '📡',
    tag: 'استخبارات',
    category: 'tactical',
  },
  {
    id: 'jet_flyover',
    name: 'مقاتلة حربية نفاثة فائقة السرعة ✈️',
    description: 'طائرة حربية تخترق الشاشة بسرعة الصاروخ مع هدير المحركات النفاثة واختراق الصوت',
    icon: '✈️',
    tag: 'سرعة فائقة',
    category: 'military',
  },
  {
    id: 'red_alert',
    name: 'إنذار طوارئ أمني أحمر 🚨',
    description: 'فلاشات أمنية حمراء تحيط بالشاشة مع صفارة إنذار الطوارئ والجاهزية القصوى',
    icon: '🚨',
    tag: 'استنفار',
    category: 'urgent',
  },
  {
    id: 'tank_convoy',
    name: 'موكب دبابات ومدرعات ثقيلة 🛡️',
    description: 'رتل مدرعات ودبابات عسكرية تعبر أسفل الشاشة مع صوت هدير المحركات والجنزير',
    icon: '🛡️',
    tag: 'قوة ميدانية',
    category: 'military',
  },
  {
    id: 'golden_stars',
    name: 'أمطار النجوم الذهبية والأوسمة ⭐',
    description: 'شلال متلألئ من النجوم ورتب الفخامة يتساقط بنعومة مع رنين الأجراس الكريستالية',
    icon: '⭐',
    tag: 'فخامة وترقيات',
    category: 'celebration',
  },
  {
    id: 'radio_dispatch',
    name: 'نداء اللاسلكي العسكري (10-Codes) 📻',
    description: 'موجة تردد إذاعية مع صوت تشويش اللاسلكي ونغمة الـ Roger Beep الميدانية المعتمدة',
    icon: '📻',
    tag: 'عمليات وراديو',
    category: 'tactical',
  },
  {
    id: 'marching_drums',
    name: 'طبول واستعراض المشاة العسكري 🥁',
    description: 'مارش عسكري حماسي مع إيقاع طبول استعراضية ووقع أقدام طوابير القوات العسكرية',
    icon: '🥁',
    tag: 'حماسي ورسمي',
    category: 'military',
  },
  {
    id: 'smoke_screen',
    name: 'قنبلة دخان وساتر تكتيكي 💨',
    description: 'سحب دخان تكتيكي ملون تتصاعد لتغطية الخلفية مع صوت تنفيس قنبلة الدخان',
    icon: '💨',
    tag: 'تكتيكي',
    category: 'tactical',
  },
  {
    id: 'breaking_news',
    name: 'شريط الأخبار العاجلة العسكرية 🔴',
    description: 'شريط عاجل أحمر وامض يتحرك أسفل الشاشة مع صوت البرقية وتكتكة البث العاجل',
    icon: '🔴',
    tag: 'خبر عاجل',
    category: 'urgent',
  },
  {
    id: 'camera_flashes',
    name: 'أضواء وعدسات الصحافة الميدانية 📸',
    description: 'وميض عدسات التصوير والأضواء الكاشفة في كل الزوايا مع صوت نقرات الشتر الاحترافية',
    icon: '📸',
    tag: 'إعلامي',
    category: 'celebration',
  },
  {
    id: 'laser_target',
    name: 'شبكة استشعار وتصويب ليزري 🎯',
    description: 'خطوط ليزرية تتقاطع على الإعلان لتأكيد الهدف التكتيكي مع صوت القفل الإلكتروني Lock-on',
    icon: '🎯',
    tag: 'دقة وتصويب',
    category: 'tactical',
  },
  {
    id: 'wax_stamp',
    name: 'ختم القيادة العسكرية الرسمي 🏛️',
    description: 'ختم ذهبي وفولاذي ملكي ينطبع بقوة على الشاشة مع اهتزاز الشاشة وصوت ضربة الختم الفخمة',
    icon: '🏛️',
    tag: 'اعتماد رسمي',
    category: 'military',
  },
];
