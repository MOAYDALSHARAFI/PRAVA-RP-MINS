import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, 
  ExternalLink, Upload, Image as ImageIcon, X, ShieldAlert, Award, 
  Lock, Unlock, Settings2, LogIn, UserPlus, Hash, Sparkles,
  MessageSquare, Shield, FileText, Camera, Printer, Share2,
  Download, CheckCheck, Smartphone, Eye, Clipboard, MousePointerClick
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Sector, Application, UserAccount, MilitaryRank, UnitRule } from '../types.ts';
import { DEFAULT_MILITARY_RANKS, DEFAULT_UNIT_RULES } from '../data/defaultData.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { apiUrl } from '../utils/api.ts';
import { SmartBadge, getSafeBadgeEmoji } from './SmartBadge.tsx';

interface ApplicationWizardProps {
  sector: Sector;
  currentUser: UserAccount | null;
  onBackToSectors: () => void;
  onSubmitSuccess: (newApp: Application) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  ranks?: MilitaryRank[];
  unitRules?: UnitRule[];
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  sector,
  currentUser,
  onBackToSectors,
  onSubmitSuccess,
  onOpenAuth,
  ranks,
  unitRules,
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [copiedRole, setCopiedRole] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<Application | null>(null);

  // Military College Dispatch Screen State (pre-success screen)
  const [showCollegeDispatch, setShowCollegeDispatch] = useState<boolean>(false);
  const [activeCollegeApp, setActiveCollegeApp] = useState<Application | null>(null);
  const [copiedCollegeText, setCopiedCollegeText] = useState<boolean>(false);
  const [isCopyingImage, setIsCopyingImage] = useState<boolean>(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState<boolean>(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);
  const [copyImageError, setCopyImageError] = useState<string | null>(null);
  const [mobilePreviewImage, setMobilePreviewImage] = useState<string | null>(null);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);

  const baseRanks = ranks && ranks.length > 0 ? ranks : DEFAULT_MILITARY_RANKS;
  const allUnitRules = unitRules && unitRules.length > 0 ? unitRules : DEFAULT_UNIT_RULES;

  // Max recruitment rank allowed by sector leader (default order 3: عريف)
  const maxOrder = sector.maxRecruitmentRankOrder || 3;
  const allowedRanks = useMemo(() => {
    return baseRanks
      .filter((r) => {
        const sectorMatch = !r.sectorId || r.sectorId === 'all' || r.sectorId === sector.id;
        const rankOrder = r.order ?? 1;
        return sectorMatch && rankOrder <= maxOrder;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [baseRanks, sector.maxRecruitmentRankOrder, sector.id, maxOrder]);

  const maxAllowedRankObj = baseRanks.find((r) => r.order === maxOrder) || allowedRanks[allowedRanks.length - 1];
  const maxAllowedRankName = maxAllowedRankObj?.name || 'عريف';

  const [occupiedNumbers, setOccupiedNumbers] = useState<Set<number>>(new Set());

  // Helper to resolve auto military number and prefix for a selected rank:
  const getAutoMilitaryNoAndPrefix = (rankName: string, customOcc?: Set<number>) => {
    const matchedRule = allUnitRules.find(
      (r) => r.rankName === rankName && (r.sectorId === sector.id || r.sectorId === 'all')
    ) || allUnitRules.find((r) => r.rankName === rankName);

    let start = matchedRule ? Number(matchedRule.rangeStart) || 1 : 1;
    let end = matchedRule ? Number(matchedRule.rangeEnd) || 100 : 100;

    if (!matchedRule) {
      if (rankName === 'جندي أول') { start = 35; end = 50; }
      else if (rankName === 'عريف') { start = 51; end = 65; }
      else if (rankName === 'وكيل رقيب') { start = 66; end = 80; }
      else if (rankName === 'رقيب') { start = 81; end = 95; }
      else if (rankName === 'ملازم') { start = 1; end = 15; }
    }

    const set = customOcc || occupiedNumbers;
    let nextNum = start;
    if (set && set.size > 0) {
      while (set.has(nextNum) && nextNum <= end) {
        nextNum++;
      }
      if (set.has(nextNum)) {
        while (set.has(nextNum)) nextNum++;
      }
    }

    // Authoritative sector prefix from settings (e.g. 'M', 'M-', 'SWAT')
    const cleanSecPrefix = sector.unitPrefix ? sector.unitPrefix.trim().replace(/-+$/, '') : 'M';

    // Determine prefix honoring sector.unitPrefix as the master sector prefix:
    let prefix = `${cleanSecPrefix}-`;
    if (matchedRule?.prefix) {
      const cleanRule = matchedRule.prefix.trim().replace(/-+$/, '');
      if (cleanRule.endsWith('I') || cleanRule.includes('-I') || cleanRule === 'I') {
        prefix = `${cleanSecPrefix}-I-`;
      } else if (cleanRule.endsWith('F') || cleanRule.includes('-F') || cleanRule === 'F') {
        prefix = `${cleanSecPrefix}-F-`;
      } else if (matchedRule.sectorId && matchedRule.sectorId !== sector.id && matchedRule.sectorId !== 'all') {
        prefix = `${cleanRule}-`;
      }
    }

    return {
      autoMilitaryNo: String(nextNum),
      prefix,
      rule: matchedRule || null,
    };
  };

  const initialRank = allowedRanks[0]?.name || 'جندي';
  const initialRankObj = allowedRanks[0];
  const initialAuto = getAutoMilitaryNoAndPrefix(initialRank);

  // Unit Prefix state
  const [unitPrefix, setUnitPrefix] = useState<string>(initialAuto.prefix);
  const canCustomizePrefix = currentUser?.permissions?.canEditUnitPrefix || currentUser?.role === 'owner';
  const [isUnitUnlocked, setIsUnitUnlocked] = useState<boolean>(false);

  // Form State: Applicant fields
  const [formData, setFormData] = useState({
    discordId: '',
    playerName: '',
    fullName: '',
    gameId: '',
    militaryNo: initialAuto.autoMilitaryNo,
    selectedRank: initialRank,
    selectedRankId: initialRankObj?.id || '',
    age: '',
    gender: 'ذكر',
    acceptanceOfficer: (currentUser && (currentUser.role === 'officer' || currentUser.role === 'leader'))
      ? currentUser.displayName
      : '',
    currentUnit: `${initialAuto.prefix}${initialAuto.prefix.endsWith('-') ? '' : '-'}${initialAuto.autoMilitaryNo}`,
  });

  // Re-sync unit prefix and military number when sector or its unitPrefix changes in settings
  useEffect(() => {
    const auto = getAutoMilitaryNoAndPrefix(formData.selectedRank);
    setUnitPrefix(auto.prefix);
    const sep = auto.prefix.endsWith('-') ? '' : '-';
    const milNo = formData.militaryNo || auto.autoMilitaryNo;
    setFormData((prev) => ({
      ...prev,
      militaryNo: milNo,
      currentUnit: `${auto.prefix}${sep}${milNo}`,
    }));
  }, [sector.unitPrefix, sector.id]);

  // Handle Rank Change: updates rank, auto military number, unit prefix, and unit code
  const handleRankChange = (newRankName: string) => {
    const matchedRank = allowedRanks.find((r) => r.name === newRankName);
    const { autoMilitaryNo, prefix } = getAutoMilitaryNoAndPrefix(newRankName);
    setUnitPrefix(prefix);
    const sep = prefix.endsWith('-') ? '' : '-';
    setFormData((prev) => ({
      ...prev,
      selectedRank: newRankName,
      selectedRankId: matchedRank?.id || '',
      militaryNo: autoMilitaryNo,
      currentUnit: `${prefix}${sep}${autoMilitaryNo}`,
    }));
  };

  // Fetch existing applications to dynamically resolve unoccupied military numbers in this sector
  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl('/api/applications'))
      .then((res) => (res.ok ? res.json() : []))
      .then((apps: Application[]) => {
        if (!isMounted || !Array.isArray(apps)) return;
        const occ = new Set<number>();
        apps.forEach((a) => {
          if (a.sectorId && a.sectorId !== sector.id) return;
          const isAccepted = a.status === 'مقبول' || a.serviceStatus === 'active';
          if (!isAccepted) return;
          if (a.militaryNo) {
            const p = parseInt(String(a.militaryNo).trim(), 10);
            if (!isNaN(p)) occ.add(p);
          }
          if (a.currentUnit) {
            const m = a.currentUnit.match(/(\d+)$/);
            if (m) {
              const p = parseInt(m[1], 10);
              if (!isNaN(p)) occ.add(p);
            }
          }
        });
        setOccupiedNumbers(occ);
        // Automatically assign available number for current rank if occupied
        setFormData((prev) => {
          const currentNum = parseInt(prev.militaryNo, 10);
          if (occ.has(currentNum)) {
            const resolved = getAutoMilitaryNoAndPrefix(prev.selectedRank, occ);
            const sep = resolved.prefix.endsWith('-') ? '' : '-';
            return {
              ...prev,
              militaryNo: resolved.autoMilitaryNo,
              currentUnit: `${resolved.prefix}${sep}${resolved.autoMilitaryNo}`,
            };
          }
          return prev;
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [sector.id]);

  // Re-sync unit on military number change or manual edit
  useEffect(() => {
    if (!isUnitUnlocked) {
      const sep = unitPrefix.endsWith('-') ? '' : '-';
      const no = formData.militaryNo.trim() || '00';
      setFormData((prev) => ({
        ...prev,
        currentUnit: `${unitPrefix}${sep}${no}`,
      }));
    }
  }, [formData.militaryNo, unitPrefix, isUnitUnlocked]);

  // Quiz Answers (index per question)
  const [quizAnswers, setQuizAnswers] = useState<number[]>(
    new Array(sector.questions.length).fill(-1)
  );

  // Attachments (Base64 or image previews)
  const [rolesProofImg, setRolesProofImg] = useState<string>('');
  const [uniformImg, setUniformImg] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active target for mouse selection & clipboard paste ('roles' | 'uniform' | null)
  const [selectedUploadTarget, setSelectedUploadTarget] = useState<'roles' | 'uniform' | null>(null);
  const [pasteToast, setPasteToast] = useState<string | null>(null);

  // Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Process image file with size check & base64
  const processImageFile = (
    file: File,
    setImage: (data: string) => void,
    labelName: string
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setPasteToast(`تم إدراج ${labelName} بنجاح! 📋`);
        setTimeout(() => setPasteToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Image Upload
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (data: string) => void,
    labelName: string = 'الصورة'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, setImage, labelName);
    }
  };

  // Handle direct clipboard paste into a dropzone box
  const handleBoxPaste = (
    e: React.ClipboardEvent,
    setImage: (data: string) => void,
    labelName: string
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          processImageFile(file, setImage, labelName);
          return;
        }
      }
    }
  };

  // Handle clipboard paste via button click
  const handlePasteFromClipboardApi = async (
    setImage: (data: string) => void,
    labelName: string
  ) => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'pasted-image.png', { type: imageType });
            processImageFile(file, setImage, labelName);
            return;
          }
        }
      }
      setPasteToast('لم يتم العثور على صورة في الحافظة. انسخ صورة أولاً ثم اضغط Ctrl + V');
      setTimeout(() => setPasteToast(null), 3500);
    } catch {
      setPasteToast('انقر على المربع بالماوس ثم اضغط Ctrl + V للصق الصورة مباشرة');
      setTimeout(() => setPasteToast(null), 3500);
    }
  };

  // Global window paste listener: when a box is selected by mouse, Ctrl+V anywhere pastes into it
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (!selectedUploadTarget) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            if (selectedUploadTarget === 'roles') {
              processImageFile(file, setRolesProofImg, 'صورة إثبات الرولات');
            } else if (selectedUploadTarget === 'uniform') {
              processImageFile(file, setUniformImg, 'صورة الزي العسكري');
            }
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedUploadTarget]);

  // Validation
  const ageNum = Number(formData.age);
  const isAgeValid = formData.age.trim().length > 0 && !isNaN(ageNum) && ageNum >= (sector.minAge || 17);
  const isStep1Valid = 
    formData.discordId.trim().length > 0 &&
    formData.playerName.trim().length > 0 &&
    formData.fullName.trim().length > 0 &&
    formData.gameId.trim().length > 0 &&
    formData.militaryNo.trim().length > 0 &&
    formData.gender.trim().length > 0 &&
    formData.selectedRank.trim().length > 0 &&
    isAgeValid;

  const answeredCount = quizAnswers.filter((a) => a !== -1).length;
  const isStep2Valid = answeredCount === sector.questions.length;

  // Calculate Quiz Score
  const calculateScore = () => {
    let score = 0;
    sector.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  // Generate Discord Role Request text
  const generateRoleText = () => {
    let template = sector.rolesTemplate || '';
    const unitCode = formData.currentUnit || `${unitPrefix}${formData.militaryNo || '00'}`;
    const rankObj = allowedRanks.find((r) => r.name === formData.selectedRank);
    template = template
      .replace(/M-{militaryNo}/g, unitCode)
      .replace(/{militaryNo}/g, formData.militaryNo || '0000')
      .replace(/{currentUnit}/g, unitCode)
      .replace(/{unit}/g, unitCode)
      .replace(/{gameId}/g, formData.gameId || '000')
      .replace(/{playerName}/g, formData.playerName || 'اسم اللاعب')
      .replace(/{name}/g, formData.fullName || 'الاسم الكامل')
      .replace(/{rank}/g, formData.selectedRank || 'جندي')
      .replace(/{rankMention}/g, rankObj?.discordRoleMention || rankObj?.name || 'جندي')
      .replace(/{rankProtocol}/g, rankObj?.protocolPrefix || '')
      .replace(/{discord}/g, formData.discordId || '000000000000000000');
    return template;
  };

  const copyRoleRequest = () => {
    navigator.clipboard.writeText(generateRoleText());
    setCopiedRole(true);
    setTimeout(() => setCopiedRole(false), 2500);
  };

  // Helper to calculate the next unit code (e.g. [M-80] -> [M-81])
  const calculateNextUnit = (unitStr: string): string => {
    if (!unitStr) return '[M-02]';
    const clean = unitStr.replace(/[\[\]]/g, '').trim();
    const match = clean.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      const nextNum = num + 1;
      const padded = match[2].length > 1 && String(nextNum).length < match[2].length
        ? String(nextNum).padStart(match[2].length, '0')
        : String(nextNum);
      return `[${prefix}${padded}]`;
    }
    return `[${clean}-02]`;
  };

  // Generate Discord message formatted for Military College (matching user's reference)
  const generateMilitaryCollegeText = (app: Application): string => {
    const rawUnit = (app.currentUnit || 'M-01').replace(/[\[\]]/g, '').trim();
    const currentUnitFormatted = `[${rawUnit}]`;
    const nextUnitFormatted = calculateNextUnit(rawUnit);

    // Discord mention for user
    const discordUser = app.discordId && app.discordId.trim()
      ? (/^\d+$/.test(app.discordId.trim()) ? `<@${app.discordId.trim()}>` : `@${app.discordId.replace(/^@/, '')}`)
      : `@${app.playerName}`;

    // Rank mention
    const rankMention = app.rankRoleMention || (app.rankRoleId ? `<@&${app.rankRoleId}>` : `@${app.rank || 'جندي'}`);

    const collegeAr = sector.arabicName ? `الكلية العسكرية ${sector.arabicName}` : `الكلية العسكرية ${sector.name}`;
    const collegeEn = `${sector.name} Military College`;

    return `- } ⚔️ ${collegeAr} { -
- { ⚔️ ${collegeEn} } -

تم توظيف العسكري: ${discordUser}
FY ⚔️ ${currentUnitFormatted} ${app.playerName} ${app.gameId}
الجنس: ${app.gender || 'ذكر'}

الرتبة: ${rankMention}
الهوية: ${app.gameId}
درجة الاختبار: (${app.score}/${app.totalQuestions})

اليونت الحالي : ${currentUnitFormatted}

مسؤول القبول : ${app.acceptanceOfficer || (currentUser?.displayName || 'قيادة القبول')}

اليونت القادم : ${nextUnitFormatted}`;
  };

  const copyCollegeText = (app: Application) => {
    navigator.clipboard.writeText(generateMilitaryCollegeText(app));
    setCopiedCollegeText(true);
    setTimeout(() => setCopiedCollegeText(false), 2500);
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return (
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
    );
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    // Do NOT immediately revoke on mobile; keep active for 2 minutes
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {}
    }, 120000);
  };

  // Helper to convert base64 / dataUrl to Blob safely
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Robust function to generate document image with html-to-image (supports Tailwind v4 and modern CSS)
  const generateCollegeImage = async (): Promise<{ dataUrl: string; blob: Blob } | null> => {
    const docElement = document.getElementById('prava-military-college-doc');
    if (!docElement) return null;

    // Ensure all images inside are loaded
    const imgElements = Array.from(docElement.getElementsByTagName('img'));
    await Promise.all(
      imgElements.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
      })
    );

    // Render using native browser foreignObject via html-to-image (skipFonts prevents CORS errors on Google Fonts!)
    let dataUrl: string;
    try {
      dataUrl = await htmlToImage.toPng(docElement, {
        quality: 0.95,
        backgroundColor: '#070b14',
        pixelRatio: 2,
        cacheBust: false,
        skipFonts: true,
      });
    } catch {
      // Fallback with pixelRatio 1 if device memory or high DPI is constrained
      dataUrl = await htmlToImage.toPng(docElement, {
        quality: 0.90,
        backgroundColor: '#070b14',
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: true,
      });
    }

    const blob = dataUrlToBlob(dataUrl);
    return { dataUrl, blob };
  };

  // Primary Copy / Save Action (Full Support for Mobile iOS/Android & Desktop)
  const handleCopyDocumentAsImage = async () => {
    const docElement = document.getElementById('prava-military-college-doc');
    if (!docElement) return;

    setIsCopyingImage(true);
    setCopyImageError(null);
    try {
      const result = await generateCollegeImage();
      if (!result) {
        setIsCopyingImage(false);
        setCopyImageError('تعذر تحديد وثيقة الكلية العسكرية لتصويرها');
        return;
      }

      const { dataUrl, blob } = result;
      setMobilePreviewImage(dataUrl);

      const fileName = `وثيقة_الكلية_العسكرية_${activeCollegeApp?.playerName || 'مجند'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Mobile device flow (iOS Safari / Android)
      if (isMobileDevice()) {
        // Check if native Share Sheet is supported with files
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'وثيقة الكلية العسكرية A4',
              text: `وثيقة تعيين العسكري ${activeCollegeApp?.playerName || ''} [${activeCollegeApp?.currentUnit || ''}]`,
              files: [file],
            });
            setCopiedImageSuccess(true);
            setTimeout(() => setCopiedImageSuccess(false), 4500);
            setIsCopyingImage(false);
            return;
          } catch (shareErr: any) {
            if (shareErr?.name !== 'AbortError') {
              console.warn('Native share failed:', shareErr);
            }
          }
        }

        // If native share was dismissed or unsupported, open the Mobile Save/Copy modal
        setShowMobileModal(true);
        setCopiedImageSuccess(true);
        setTimeout(() => setCopiedImageSuccess(false), 4500);
        setIsCopyingImage(false);
        return;
      }

      // Desktop flow: try clipboard.write
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedImageSuccess(true);
          setTimeout(() => setCopiedImageSuccess(false), 4500);
        } else {
          downloadBlob(blob, fileName);
          setCopiedImageSuccess(true);
          setTimeout(() => setCopiedImageSuccess(false), 4500);
        }
      } catch {
        // Desktop clipboard write failed, trigger download and show modal
        downloadBlob(blob, fileName);
        setShowMobileModal(true);
      } finally {
        setIsCopyingImage(false);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setIsCopyingImage(false);
      setShowMobileModal(true);
      setCopyImageError('تعذر تصوير الوثيقة تلقائياً. تم فتح نافذة الحفظ المباشر.');
    }
  };

  const handleDownloadDocumentImage = async () => {
    setIsDownloadingImage(true);
    try {
      const result = await generateCollegeImage();
      if (!result) {
        setIsDownloadingImage(false);
        return;
      }

      const { dataUrl, blob } = result;
      setMobilePreviewImage(dataUrl);

      const fileName = `وثيقة_الكلية_العسكرية_${activeCollegeApp?.playerName || 'مجند'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // On mobile, native share provides "Save Image" to Photos app
      if (isMobileDevice() && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          title: 'وثيقة الكلية العسكرية',
          files: [file],
        }).catch(() => {
          setShowMobileModal(true);
        });
      } else if (isMobileDevice()) {
        setShowMobileModal(true);
      } else {
        downloadBlob(blob, fileName);
      }
      setIsDownloadingImage(false);
    } catch {
      setIsDownloadingImage(false);
      setShowMobileModal(true);
    }
  };

  // Final Submit
  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    try {
      const score = calculateScore();
      const matchedRank = allowedRanks.find((r) => r.name === formData.selectedRank);
      const payload = {
        sectorId: sector.id,
        sectorName: sector.name,
        playerName: formData.playerName,
        fullName: formData.fullName,
        discordId: formData.discordId,
        gameId: formData.gameId,
        age: Number(formData.age),
        militaryNo: formData.militaryNo,
        gender: formData.gender,
        rank: formData.selectedRank,
        rankProtocol: matchedRank?.protocolPrefix || '',
        rankRoleId: matchedRank?.discordRoleId || '',
        rankRoleMention: matchedRank?.discordRoleMention || '',
        currentUnit: formData.currentUnit,
        acceptanceOfficer: formData.acceptanceOfficer,
        answers: quizAnswers,
        score,
        totalQuestions: sector.questions.length,
        rolesProofImg,
        uniformImg,
      };

      try {
        const res = await fetch(apiUrl('/api/applications'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data: Application = await res.json();
          setActiveCollegeApp(data);
          setShowCollegeDispatch(true);
          onSubmitSuccess(data);
          return;
        }
      } catch {
        // Fall back to client storage
      }

      // Offline / Local Storage fallback for applications
      const isAutoAccepted = Boolean(sector.autoAccept);
      const localApp: Application = {
        id: `APP-${Date.now().toString(36).toUpperCase()}`,
        ...payload,
        status: isAutoAccepted ? 'مقبول' : 'قيد المراجعة',
        acceptanceOfficer: isAutoAccepted
          ? (payload.acceptanceOfficer || `القبول التلقائي للقادة (${sector.arabicName || sector.name})`)
          : payload.acceptanceOfficer,
        reviewerNotes: isAutoAccepted ? 'تم القبول والاعتماد الفوري تلقائياً بنظام القادة' : '',
        createdAt: new Date().toISOString(),
      };

      try {
        const savedApps = JSON.parse(localStorage.getItem('prava_applications') || '[]');
        savedApps.unshift(localApp);
        localStorage.setItem('prava_applications', JSON.stringify(savedApps.slice(0, 30)));
      } catch {}

      setActiveCollegeApp(localApp);
      setShowCollegeDispatch(true);
      onSubmitSuccess(localApp);
    } catch {
      setSubmitError('حدث خطأ أثناء إرسال الطلب، يرجى التحقق من اتصالك وإعادة المحاولة.');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Screen: Military College Dispatch Screen (Before Final Confirmation)
  if (showCollegeDispatch && activeCollegeApp) {
    const rawUnit = (activeCollegeApp.currentUnit || 'M-01').replace(/[\[\]]/g, '').trim();
    const unitBracket = `[${rawUnit}]`;
    const nextUnitBracket = calculateNextUnit(rawUnit);
    const collegeText = generateMilitaryCollegeText(activeCollegeApp);
    const issueDateStr = activeCollegeApp.createdAt 
      ? new Date(activeCollegeApp.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const collegeDiscordUrl = sector.discordRoomUrl || 'https://discord.gg/prava';

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in space-y-8">
        {/* Clean Consolidated Action Bar Above Document */}
        <div className="bg-[#0f141d] border border-blue-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base">وثيقة الكلية العسكرية المعتمدة</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">مقاس A4</span>
              </div>
              <span className="text-[11px] text-slate-400">
                جاهزة للنسخ والحفظ بجودة فائقة لإرسالها في الديسكورد
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Copy / Save Document as Image */}
            <button
              onClick={handleCopyDocumentAsImage}
              disabled={isCopyingImage}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isCopyingImage ? 'جاري التجهيز...' : copiedImageSuccess ? '✓ تم تجهيز الصورة' : '📱 حفظ / نسخ كصورة A4'}</span>
            </button>

            {/* Download A4 Image */}
            <button
              onClick={handleDownloadDocumentImage}
              disabled={isDownloadingImage}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل A4</span>
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            {/* Discord College Room */}
            <a
              href={collegeDiscordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center gap-1.5 transition-all shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>روم الكلية</span>
            </a>

            {/* Proceed to Final Screen */}
            <button
              onClick={() => {
                setSubmittedApp(activeCollegeApp);
                setShowCollegeDispatch(false);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black ${theme.buttonClass} transition-all cursor-pointer shadow-md flex items-center gap-1.5`}
            >
              <span>متابعة ➔ إتمام الطلب</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Copy Notification Toast / Banner */}
        {copiedImageSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم تجهيز وثيقة A4! لمستخدمي الجوال: يمكنك الضغط على "معاينة وحفظ بالجوال" للضغط المطول وحفظها في الصور مباشرة.</span>
            </div>
            <button
              onClick={() => setShowMobileModal(true)}
              className="px-3 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة وحفظ بالجوال</span>
            </button>
          </div>
        )}

        {copyImageError && (
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{copyImageError}</span>
            </div>
            <button
              onClick={() => setShowMobileModal(true)}
              className="px-3 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>فتح نافذة الحفظ للجوال</span>
            </button>
          </div>
        )}

        {/* 
          OFFICIAL MILITARY RECRUITMENT AUTHORIZATION DOCUMENT
          Exact 1:1 match with user reference (image0_8be3a0d2.jpeg)
          Compact, non-stretched, beautifully proportioned
        */}
        <div className="w-full flex justify-center overflow-x-auto pb-4">
          <div 
            id="prava-military-college-doc" 
            className="w-full max-w-[860px] bg-[#070b15] border-2 border-blue-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl text-white font-sans select-none"
          >
            {/* Left Vertical Ribbon */}
            <div className="absolute left-2.5 top-0 bottom-0 flex items-center justify-center pointer-events-none z-10 w-6">
              <span className="text-[9px] font-mono tracking-[0.3em] text-blue-500/40 uppercase -rotate-90 origin-center whitespace-nowrap">
                RECRUITMENT AUTHORIZATION DOCUMENT
              </span>
            </div>

            {/* SECTION 1: HEADER & IDENTITY */}
            <div className="pl-6 pb-5">
              <div className="flex items-start justify-between gap-4">
                {/* Titles */}
                <div className="space-y-1 text-right sm:text-left">
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/40 text-blue-400 text-[10px] tracking-wider uppercase font-mono font-bold mb-1">
                    RECRUITMENT AUTHORIZATION DOCUMENT
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
                    {sector.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-400 font-semibold tracking-wide">
                    {sector.arabicName ? `${sector.arabicName} · ` : ''}Military College
                  </p>
                </div>

                {/* Sector Crest Emblem */}
                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-950/80 to-slate-900 border-2 border-blue-500/40 flex items-center justify-center p-3 shadow-inner relative">
                  <SmartBadge
                    badge={sector.badge}
                    alt={sector.name}
                    defaultIcon="sector"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain text-3xl"
                  />
                </div>
              </div>

              {/* Metadata Identity Bar */}
              <div className="mt-4 bg-[#0d1527] border border-blue-500/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
                <div className="text-right sm:text-left text-xs font-mono text-slate-400 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-500 block uppercase">ISSUED</span>
                  <span className="font-bold text-white">{issueDateStr}</span>
                </div>

                <div className="flex items-center justify-around sm:justify-end gap-6 sm:gap-12 w-full sm:w-auto">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">الهوية</span>
                    <span className="text-base sm:text-lg font-mono font-black text-white">{activeCollegeApp.gameId}</span>
                  </div>

                  {/* Golden Serial Pill */}
                  <div className="bg-[#d9a84e] text-slate-950 font-black py-1.5 px-6 rounded-xl shadow-lg border border-amber-300 text-center">
                    <span className="text-[9px] block uppercase tracking-wider text-slate-900 font-bold">الرقم التسلسلي</span>
                    <span className="text-base sm:text-lg font-mono font-extrabold tracking-wider">{unitBracket}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">الاسم</span>
                    <span className="text-base sm:text-lg font-bold text-white truncate max-w-[150px] block">{activeCollegeApp.playerName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: TOP CAPTURE - UNIFORM & UNIT CHANGE (FULL WIDTH) */}
            <div className="pl-6 mb-4">
              <div className="bg-[#0c1424] border border-blue-500/20 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-mono tracking-wider">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>• VERIFIED CAPTURE</span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                    صورة اللبس العسكري وإثبات تغيير اليونت
                  </span>
                </div>

                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/80 border border-blue-500/30 flex items-center justify-center">
                  {/* Yellow Tactical Corner Brackets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400 pointer-events-none z-10" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400 pointer-events-none z-10" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400 pointer-events-none z-10" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400 pointer-events-none z-10" />

                  {activeCollegeApp.uniformImg || uniformImg ? (
                    <img 
                      src={activeCollegeApp.uniformImg || uniformImg} 
                      alt="صورة اللبس العسكري وإثبات تغيير اليونت"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                      <Camera className="w-8 h-8 text-blue-400/40" />
                      <span>صورة اللبس العسكري وإثبات تغيير اليونت</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: BOTTOM ROW (ROLES CAPTURE ON LEFT + APPLICANT TABLE ON RIGHT) */}
            <div className="pl-6 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
              {/* Left Column: Roles Proof */}
              <div className="bg-[#0c1424] border border-blue-500/20 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-mono tracking-wider">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>• VERIFIED CAPTURE</span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                    إثبات إعطاء الرولات
                  </span>
                </div>

                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/80 border border-blue-500/30 flex items-center justify-center flex-1">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400 pointer-events-none z-10" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400 pointer-events-none z-10" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400 pointer-events-none z-10" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400 pointer-events-none z-10" />

                  {activeCollegeApp.rolesProofImg || rolesProofImg ? (
                    <img 
                      src={activeCollegeApp.rolesProofImg || rolesProofImg} 
                      alt="إثبات إعطاء الرولات"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                      <Camera className="w-8 h-8 text-blue-400/40" />
                      <span>إثبات إعطاء الرولات</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Applicant Table & Score Circle */}
              <div className="bg-[#0c1424] border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  {/* Score Circle Badge on Left */}
                  <div className="w-14 h-14 rounded-full border-4 border-amber-400 bg-black/50 flex flex-col items-center justify-center text-center shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    <span className="text-base font-black text-white font-mono leading-tight">{activeCollegeApp.score}/{activeCollegeApp.totalQuestions}</span>
                    <span className="text-[7px] font-bold text-amber-400 leading-tight">درجة الاختبار</span>
                  </div>

                  <h3 className="text-base font-black text-white">بيانات المتقدم</h3>
                </div>

                {/* 4 Stacked Rows with Blue Right Accent */}
                <div className="space-y-2 text-right">
                  <div className="bg-[#101828] p-2.5 rounded-xl border-r-4 border-blue-500 flex items-center justify-between px-3">
                    <span className="font-bold text-white text-xs sm:text-sm">{activeCollegeApp.playerName}</span>
                    <span className="text-slate-400 text-xs font-semibold">الاسم</span>
                  </div>

                  <div className="bg-[#101828] p-2.5 rounded-xl border-r-4 border-blue-500 flex items-center justify-between px-3">
                    <span className="font-mono font-bold text-white text-xs sm:text-sm">{activeCollegeApp.gameId}</span>
                    <span className="text-slate-400 text-xs font-semibold">هوية اللعبة</span>
                  </div>

                  <div className="bg-[#101828] p-2.5 rounded-xl border-r-4 border-blue-500 flex items-center justify-between px-3">
                    <span className="font-mono font-bold text-white text-xs sm:text-sm">{activeCollegeApp.age}</span>
                    <span className="text-slate-400 text-xs font-semibold">العمر</span>
                  </div>

                  <div className="bg-[#101828] p-2.5 rounded-xl border-r-4 border-blue-500 flex items-center justify-between px-3">
                    <span className="font-bold text-white text-xs sm:text-sm">{activeCollegeApp.gender || 'ذكر'}</span>
                    <span className="text-slate-400 text-xs font-semibold">الجنس</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: FOOTER (STAMP + CERTIFICATION + BARCODE) */}
            <div className="pl-6 pt-3 border-t border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left: Stamp */}
              <div className="flex flex-col items-center sm:items-start gap-0.5">
                <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-amber-400/10 flex flex-col items-center justify-center p-1 text-center shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <span className="text-[10px] font-black text-amber-300 leading-tight">معتمد</span>
                  <span className="text-[7px] font-mono font-bold tracking-widest text-amber-400 uppercase">APPROVED</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">By @{activeCollegeApp.acceptanceOfficer || 'xi.v'}</span>
              </div>

              {/* Center: Certification Info */}
              <div className="text-center space-y-0.5">
                <h4 className="text-sm font-black text-white">وثيقة قبول معتمدة</h4>
                <span className="text-xs font-bold text-blue-400 block">{sector.name}</span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  Issue Date: {issueDateStr} · 10:57 PM Riyadh [GMT+3]
                </span>
              </div>

              {/* Right: Barcode Graphic & Unit Code */}
              <div className="flex flex-col items-center sm:items-end space-y-0.5">
                <div className="flex items-center gap-[2.5px] h-8 px-2 bg-white/5 rounded p-1">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2].map((w, i) => (
                    <div 
                      key={i} 
                      className="bg-white/90 h-full rounded-[0.5px]" 
                      style={{ width: `${w * 1.5}px` }} 
                    />
                  ))}
                </div>
                <span className="text-xs font-mono font-black text-white tracking-widest">
                  {unitBracket}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Discord Dispatch Format Box (Styled matching user's reference) */}
        <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-[#2b2d31]/80 px-5 py-3 border-b border-[#1e1f22] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-300 text-xs font-mono">
              <MessageSquare className="w-4 h-4 text-[#5865F2]" />
              <span className="font-bold text-white">صيغة روم الكلية العسكرية (Discord Dispatch)</span>
              <span className="text-slate-500 text-[10px]"># الكلية-العسكرية</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={collegeDiscordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8ea1e1] border border-[#5865F2]/30 flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>فتح الروم في ديسكورد</span>
              </a>
              <button
                onClick={() => copyCollegeText(activeCollegeApp)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCollegeText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCollegeText ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>
          </div>

          <div className="p-5 font-mono text-xs sm:text-sm text-[#dbdee1] leading-relaxed whitespace-pre-wrap select-all bg-[#1e1f22] text-right" dir="rtl">
            {collegeText}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
          <button
            onClick={() => {
              setShowCollegeDispatch(false);
              setCurrentStep(4);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            العودة لمراجعة الطلب
          </button>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
            {/* Primary Action Button */}
            <button
              onClick={handleCopyDocumentAsImage}
              disabled={isCopyingImage}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isCopyingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري النسخ...</span>
                </>
              ) : copiedImageSuccess ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-950" />
                  <span>تم تجهيز صورة A4!</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>📱 حفظ / نسخ كصورة A4</span>
                </>
              )}
            </button>

            <a
              href={collegeDiscordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>التوجه للكلية العسكرية</span>
            </a>

            <button
              onClick={() => {
                setSubmittedApp(activeCollegeApp);
                setShowCollegeDispatch(false);
              }}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs font-black ${theme.buttonClass} transition-all cursor-pointer shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2`}
            >
              <span>متابعة ➔ إتمام الطلب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 
          MODAL: Direct Save / Copy for Mobile (iOS Safari & Android) & Desktop
          Allows tap-and-hold (Long Press) to save image to Photos album,
          direct share via Web Share API, and fullscreen view.
        */}
        {showMobileModal && mobilePreviewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0e1626] border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] flex flex-col shadow-2xl relative">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-right">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-black text-white">
                    حفظ ونسخ وثيقة الكلية العسكرية (للجوال)
                  </h3>
                </div>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Instructions Box for Mobile */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 text-right space-y-1.5">
                <div className="flex items-center gap-2 font-black text-amber-300 text-xs sm:text-sm">
                  <span>📱 لمستخدمي الجوال (آيفون وأندرويد):</span>
                </div>
                <ol className="list-decimal list-inside text-slate-300 text-xs sm:text-[13px] leading-relaxed space-y-1 pr-1 font-medium">
                  <li><strong>اضغط مطولاً بإصبعك</strong> على الصورة أدناه.</li>
                  <li>اختر <strong>"حفظ في الصور" (Save to Photos)</strong> أو <strong>"نسخ" (Copy)</strong>.</li>
                  <li>افتح تطبيق الديسكورد والصق الصورة فوراً في روم الكلية العسكرية!</li>
                </ol>
              </div>

              {/* High-res Image Preview */}
              <div className="overflow-y-auto flex-1 rounded-2xl border border-white/10 bg-black/70 p-2 sm:p-4 flex items-center justify-center text-center">
                <img
                  src={mobilePreviewImage}
                  alt="وثيقة الكلية العسكرية A4"
                  className="max-w-full max-h-[55vh] h-auto rounded-xl shadow-2xl mx-auto block select-auto touch-auto"
                  style={{ WebkitTouchCallout: 'default' }}
                />
              </div>

              {/* Modal Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10">
                {/* Native Share button */}
                <button
                  onClick={async () => {
                    if (!mobilePreviewImage) return;
                    try {
                      const res = await fetch(mobilePreviewImage);
                      const blob = await res.blob();
                      const file = new File([blob], `وثيقة_الكلية_العسكرية_${activeCollegeApp?.playerName || 'مجند'}.png`, { type: 'image/png' });
                      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          title: 'وثيقة الكلية العسكرية',
                          text: `وثيقة تعيين العسكري ${activeCollegeApp?.playerName || ''} [${activeCollegeApp?.currentUnit || ''}]`,
                          files: [file],
                        });
                      } else {
                        window.open(mobilePreviewImage, '_blank');
                      }
                    } catch {
                      window.open(mobilePreviewImage, '_blank');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة / حفظ في الصور 📱</span>
                </button>

                {/* Open in Fullscreen / New Tab */}
                <button
                  onClick={() => {
                    if (mobilePreviewImage) {
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<title>وثيقة الكلية العسكرية</title><body style="margin:0;background:#070b14;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${mobilePreviewImage}" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 0 20px rgba(0,0,0,0.8);" /></body>`);
                      }
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح الصورة بالحجم الكامل</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تم الحفظ / إغلاق</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Success view
  if (submittedApp) {
    const isAccepted = submittedApp.status === 'مقبول';
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-in fade-in zoom-in-95">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isAccepted 
            ? 'bg-emerald-500/25 border-2 border-emerald-400 text-emerald-400 shadow-xl shadow-emerald-500/20' 
            : 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
        }`}>
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2">
          {isAccepted ? '🎉 تهانينا! تم قبول طلبك واعتمادك فورياً!' : 'تم إرسال طلبك بنجاح!'}
        </h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
          {isAccepted 
            ? `تم اعتماد وقبول توظيفك رسمياً بنظام القادة في قطاع ${sector.arabicName || sector.name} برقمك العسكري ويونتك المعتمد.`
            : `تم تسجيل طلبك في منظومة PRAVA للتوظيف الموحد وتم إدراجه للمراجعة والتدقيق لدى قيادة قطاع ${sector.name}.`}
        </p>

        <div className={`bg-[#10141d] rounded-2xl p-6 text-right max-w-lg mx-auto mb-8 shadow-2xl border ${
          isAccepted ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/10'
        }`}>
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">رقم الطلب المرجعي:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-400">{submittedApp.id}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(submittedApp.id);
                  setPasteToast('تم نسخ رقم الطلب المرجعي بنجاح! 📋');
                  setTimeout(() => setPasteToast(null), 3000);
                }}
                className="p-1 px-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                title="نسخ رقم الطلب"
              >
                <Copy className="w-3 h-3 text-amber-400" />
                <span>نسخ</span>
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">القطاع المستهدف:</span>
            <span className="font-bold text-white">{sector.name} ({sector.arabicName})</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">اليونت المعتمد:</span>
            <span className="font-mono font-bold text-amber-400">{submittedApp.currentUnit}</span>
          </div>
          {submittedApp.rank && (
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
              <span className="text-slate-400">الرتبة المعينة:</span>
              <span className="font-bold text-amber-300">{submittedApp.rank} {submittedApp.rankProtocol ? `(${submittedApp.rankProtocol})` : ''}</span>
            </div>
          )}
          {submittedApp.acceptanceOfficer && (
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
              <span className="text-slate-400">مسؤول القبول:</span>
              <span className="font-bold text-white">{submittedApp.acceptanceOfficer}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">نتيجة التقييم:</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {submittedApp.score} من {submittedApp.totalQuestions} إجابات صحيحة
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">حالة الطلب:</span>
            <span className={`px-2.5 py-1 rounded-full font-black text-xs border ${
              isAccepted 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm animate-pulse flex items-center gap-1.5'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              {isAccepted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isAccepted ? 'مقبول ومعتمد فورياً ✓' : submittedApp.status}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setActiveCollegeApp(submittedApp);
              setShowCollegeDispatch(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Shield className="w-4 h-4" />
            <span>عرض وثيقة وبيانات الكلية العسكرية ⚔️</span>
          </button>

          <button
            onClick={onBackToSectors}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold ${theme.buttonClass} transition-all cursor-pointer`}
          >
            العودة للقطاعات الرئيسية
          </button>

          {sector.discordRoomUrl && (
            <a
              href={sector.discordRoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>التوجه لروم ديسكورد</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={onBackToSectors}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <span>القطاعات</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {!currentUser ? (
            <span className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>تقديم فوري كزائر (بدون تسجيل) 🟢</span>
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5">
              <span>المتقدم: {currentUser.displayName}</span>
            </span>
          )}
          <span className="text-xs font-mono font-bold tracking-wider text-slate-400">
            {sector.name}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 pb-4 border-b border-white/5">
        
        {/* Step 1 */}
        <div 
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
            currentStep === 1
              ? `bg-white/10 ${theme.borderClass} text-white`
              : isStep1Valid
              ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              : 'bg-white/5 border-white/5 text-slate-400 opacity-80'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 1 ? 'bg-amber-500 text-black' : isStep1Valid ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {isStep1Valid && currentStep > 1 ? <Check className="w-4 h-4" /> : '01'}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">الملف الشخصي</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 1 ? 'قيد التعبئة' : isStep1Valid ? 'مكتمل' : 'بانتظار الإكمال'}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div 
          onClick={() => isStep1Valid && setCurrentStep(2)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            isStep1Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${
            currentStep === 2
              ? `bg-white/10 ${theme.borderClass} text-white`
              : isStep2Valid
              ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 2 ? 'bg-amber-500 text-black' : isStep2Valid ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {isStep2Valid && currentStep > 2 ? <Check className="w-4 h-4" /> : '02'}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">التقييم</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 2 ? 'قيد التعبئة' : isStep2Valid ? 'مكتمل' : 'بانتظار المرحلة السابقة'}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div 
          onClick={() => isStep1Valid && isStep2Valid && setCurrentStep(3)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            isStep1Valid && isStep2Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${
            currentStep === 3
              ? `bg-white/10 ${theme.borderClass} text-white`
              : rolesProofImg && uniformImg
              ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 3 ? 'bg-amber-500 text-black' : rolesProofImg && uniformImg ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {rolesProofImg && uniformImg && currentStep > 3 ? <Check className="w-4 h-4" /> : '03'}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">المرفقات والأدوار</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 3 ? 'قيد التعبئة' : rolesProofImg && uniformImg ? 'مكتمل' : 'بانتظار المرحلة السابقة'}
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div 
          onClick={() => isStep1Valid && isStep2Valid && setCurrentStep(4)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            isStep1Valid && isStep2Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${
            currentStep === 4
              ? `bg-white/10 ${theme.borderClass} text-white`
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 4 ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            04
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">مراجعة الطلب</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 4 ? 'قيد التعبئة' : 'بانتظار المرحلة السابقة'}
            </div>
          </div>
        </div>

      </div>

      {/* STEP 1: Personal Profile */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Requirements Card on Left */}
          <div className="lg:col-span-4 bg-[#0f141d] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4 pb-3 border-b border-white/5">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-extrabold text-white text-base">شروط التوظيف</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>أن لا يقل العمر عن {sector.minAge || 17} سنة</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>حسن السيرة والسلوك والانضباط الميداني</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>مايك جيد وواضح وتواصل مستمر</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>الأهلية التامة للانضمام إلى قطاع {sector.name}</span>
              </div>
            </div>

            {/* Validation Indicator */}
            <div className="mt-8 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={`w-2 h-2 rounded-full ${isStep1Valid ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className={isStep1Valid ? 'text-emerald-400' : 'text-amber-400'}>
                  {isStep1Valid ? 'بيانات المتقدم مكتملة وجاهزة' : 'بيانات المتقدم غير مكتملة'}
                </span>
              </div>
            </div>

            {/* Auto Unit Info Box */}
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block mb-1">نظام توليد اليونت الآلي:</span>
              يتم إنشاء رمز اليونت تلقائياً بالبادئة المعتمدة للقطاع (<code className="text-amber-400 font-bold">{unitPrefix}</code>) متبوعة بالرقم العسكري مباشرة.
            </div>
          </div>

          {/* Form Fields on Right */}
          <div className="lg:col-span-8 bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  المرحلة 01 / 04
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  الملف الشخصي للمتقدم
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Discord ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Discord ID أو المنشن <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="discordId"
                  value={formData.discordId}
                  onChange={handleInputChange}
                  placeholder="123456789012345678"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
                />
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  اسم اللاعب <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="playerName"
                  value={formData.playerName}
                  onChange={handleInputChange}
                  placeholder="اسمك داخل اللعبة"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  اسم المتقدم <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="الاسم الكامل"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Game ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  هوية المتقدم داخل اللعبة (Game ID) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="gameId"
                  value={formData.gameId}
                  onChange={handleInputChange}
                  placeholder="الهوية الرقمية"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>

              {/* Age */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    العمر <span className="text-amber-400">*</span>
                  </label>
                  {formData.age && !isAgeValid && (
                    <span className="text-[10px] text-red-400 font-bold">
                      الحد الأدنى للعمر {sector.minAge || 17}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="17"
                  min="14"
                  max="70"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#090b10] border text-white focus:outline-none text-xs font-mono ${
                    formData.age && !isAgeValid ? 'border-red-500' : 'border-white/10 focus:border-amber-400'
                  }`}
                />
              </div>

              {/* Military Rank (الرتبة العسكرية) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>الرتبة العسكرية</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    أقصى رتبة: {maxAllowedRankName}
                  </span>
                </div>
                <div className="relative">
                  <select
                    name="selectedRank"
                    value={formData.selectedRank}
                    onChange={(e) => handleRankChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white focus:outline-none focus:border-amber-400 text-xs cursor-pointer appearance-none"
                  >
                    {allowedRanks.map((r) => (
                      <option key={r.id} value={r.name} className="bg-[#0f131a] text-white">
                        {getSafeBadgeEmoji(r.badge, '🎖️')} {r.name} {r.protocolPrefix ? `(${r.protocolPrefix})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  تغيير الرتبة يحدث بادئة اليونت ونطاق الرقم العسكري تلقائياً
                </p>
              </div>

              {/* Military Number */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>الرقم العسكري</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    توليد تلقائي (قابل للتعديل)
                  </span>
                </div>
                <input
                  type="text"
                  name="militaryNo"
                  value={formData.militaryNo}
                  onChange={handleInputChange}
                  placeholder="مثال: 15"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  محدد تلقائياً حسب رتبة المتقدم، ويمكن لمسؤول التوظيف أو المتقدم تعديله
                </p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  الجنس <span className="text-amber-400">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white focus:outline-none focus:border-amber-400 text-xs cursor-pointer"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              {/* Acceptance Officer (The only field coming from account if officer, or filled by applicant) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  مسؤول القبول (اختياري)
                </label>
                <input
                  type="text"
                  name="acceptanceOfficer"
                  value={formData.acceptanceOfficer}
                  onChange={handleInputChange}
                  placeholder="اسم مسؤول القبول إن وجد"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Current Unit (Automatic Generation: M-15) */}
              <div className="sm:col-span-2 bg-[#090b10] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span>اليونت (يتولد تلقائياً:</span>
                    <span dir="ltr" className="font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {unitPrefix}
                    </span>
                    <span>+ الرقم العسكري)</span>
                    <span className="text-amber-400">*</span>
                  </label>

                  {/* Prefix Customizer for Authorized Leaders / Admins */}
                  {canCustomizePrefix && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">تعديل البادئة (صلاحية خاصة):</span>
                      <input
                        type="text"
                        value={unitPrefix}
                        onChange={(e) => setUnitPrefix(e.target.value)}
                        placeholder="M-"
                        dir="ltr"
                        className="w-16 px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-amber-300 font-mono text-xs text-center focus:outline-none"
                        title="تغيير البادئة المعتمدة لليونت"
                      />
                      <button
                        type="button"
                        onClick={() => setIsUnitUnlocked(!isUnitUnlocked)}
                        className="p-1 rounded bg-white/5 text-slate-400 hover:text-white"
                        title={isUnitUnlocked ? "قفل التوليد الآلي" : "فتح التعديل اليدوي"}
                      >
                        {isUnitUnlocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    name="currentUnit"
                    value={formData.currentUnit}
                    readOnly={!canCustomizePrefix && !isUnitUnlocked}
                    onChange={handleInputChange}
                    placeholder="M-15"
                    dir="ltr"
                    className={`w-full px-4 py-2.5 rounded-xl font-mono text-xs border text-left text-white ${
                      !canCustomizePrefix && !isUnitUnlocked
                        ? 'bg-black/50 border-white/5 text-amber-300 font-bold cursor-not-allowed'
                        : 'bg-black border-amber-500/40 text-white focus:outline-none'
                    }`}
                  />
                  {!canCustomizePrefix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[11px] text-slate-500 pointer-events-none">
                      <Lock className="w-3 h-3" />
                      <span>توليد آلي محمي</span>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  مثال: بمجرد كتابة الرقم العسكري <span className="text-amber-400 font-mono">15</span> يظهر اليونت تلقائياً كـ <span dir="ltr" className="text-amber-400 font-mono inline-block font-bold">{unitPrefix}15</span> (الصلاحية تقتصر على القادة لتعديل البادئة).
                </div>
              </div>

            </div>

            {/* Step 1 Actions */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                جميع الحقول مطلوبة ما عدا مسؤول القبول
              </span>
              <button
                disabled={!isStep1Valid}
                onClick={() => setCurrentStep(2)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isStep1Valid
                    ? theme.buttonClass
                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* STEP 2: Acceptance Quiz Test */}
      {currentStep === 2 && (
        <div className="max-w-4xl mx-auto bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pb-5 border-b border-white/5">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1">
                المرحلة 02 / 04
              </span>
              <h3 className="text-2xl font-black text-white">
                تقييم القبول
              </h3>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>تمت الإجابة عن {answeredCount} من {sector.questions.length} أسئلة</span>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {sector.questions.map((q, idx) => {
              const selectedOption = quizAnswers[idx];
              return (
                <div 
                  key={q.id}
                  className="bg-[#090b10] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                    <span className="text-amber-400 font-mono">0{idx + 1}</span>
                    <span>{q.question}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedOption === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            const newAnswers = [...quizAnswers];
                            newAnswers[idx] = optIdx;
                            setQuizAnswers(newAnswers);
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all text-right cursor-pointer ${
                            isChosen
                              ? `bg-amber-500/10 ${theme.borderClass} text-white`
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChosen ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                          }`}>
                            {isChosen && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 2 Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              disabled={!isStep2Valid}
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isStep2Valid
                  ? theme.buttonClass
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: Attachments & Discord Roles */}
      {currentStep === 3 && (
        <div className="max-w-5xl mx-auto bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          <div className="mb-6 pb-4 border-b border-white/5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              المرحلة 03 / 04
            </span>
            <h3 className="text-2xl font-black text-white">
              المرفقات وطلب الرولات
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Image Uploads */}
            <div className="space-y-6">
              
              {/* Proof of Roles Upload */}
              <div
                tabIndex={0}
                onClick={() => setSelectedUploadTarget('roles')}
                onFocus={() => setSelectedUploadTarget('roles')}
                onPaste={(e) => handleBoxPaste(e, setRolesProofImg, 'صورة إثبات الرولات')}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    processImageFile(file, setRolesProofImg, 'صورة إثبات الرولات');
                  }
                }}
                className={`relative rounded-2xl border-2 transition-all outline-none p-4 cursor-pointer ${
                  selectedUploadTarget === 'roles'
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40'
                    : 'border-white/10 bg-[#090b10] hover:border-amber-400/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>إثبات إعطاء الرولات</span>
                    <span className="text-amber-400">*</span>
                  </label>

                  {selectedUploadTarget === 'roles' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 animate-pulse">
                      <MousePointerClick className="w-3 h-3" />
                      <span>محدد بالماوس · اضغط Ctrl+V للصق فوراً</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                      <MousePointerClick className="w-3 h-3 text-slate-400" />
                      <span>انقر بالماوس للصق (Ctrl+V)</span>
                    </span>
                  )}
                </div>

                {rolesProofImg ? (
                  <div className="relative rounded-xl border border-white/15 overflow-hidden group">
                    <img 
                      src={rolesProofImg} 
                      alt="Proof" 
                      className="w-full h-44 object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePasteFromClipboardApi(setRolesProofImg, 'صورة إثبات الرولات');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>لصق صورة بديلة (Ctrl+V)</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRolesProofImg('');
                        }}
                        className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                        title="حذف الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/15 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-black/40 hover:bg-black/60 transition-all">
                    <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 text-amber-400">
                      <Clipboard className="w-5 h-5" />
                    </div>

                    <span className="text-xs font-bold text-white mb-1">
                      حدد المربع بالماوس واضغط <span className="text-amber-400 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">Ctrl + V</span> للصق الصورة
                    </span>
                    <span className="text-[11px] text-slate-400 mb-3">
                      أو انسخ لقطة الشاشة ثم اضغط زر اللصق أدناه
                    </span>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUploadTarget('roles');
                          handlePasteFromClipboardApi(setRolesProofImg, 'صورة إثبات الرولات');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>📋 لصق من الحافظة</span>
                      </button>

                      <label 
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-white/10"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>اختيار ملف</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, setRolesProofImg, 'صورة إثبات الرولات')}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Uniform Photo Upload */}
              <div
                tabIndex={0}
                onClick={() => setSelectedUploadTarget('uniform')}
                onFocus={() => setSelectedUploadTarget('uniform')}
                onPaste={(e) => handleBoxPaste(e, setUniformImg, 'صورة الزي العسكري')}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    processImageFile(file, setUniformImg, 'صورة الزي العسكري');
                  }
                }}
                className={`relative rounded-2xl border-2 transition-all outline-none p-4 cursor-pointer ${
                  selectedUploadTarget === 'uniform'
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40'
                    : 'border-white/10 bg-[#090b10] hover:border-amber-400/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>صورة الزي العسكري وإثبات تغيير اليونت</span>
                    <span className="text-amber-400">*</span>
                  </label>

                  {selectedUploadTarget === 'uniform' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 animate-pulse">
                      <MousePointerClick className="w-3 h-3" />
                      <span>محدد بالماوس · اضغط Ctrl+V للصق فوراً</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                      <MousePointerClick className="w-3 h-3 text-slate-400" />
                      <span>انقر بالماوس للصق (Ctrl+V)</span>
                    </span>
                  )}
                </div>

                {uniformImg ? (
                  <div className="relative rounded-xl border border-white/15 overflow-hidden group">
                    <img 
                      src={uniformImg} 
                      alt="Uniform" 
                      className="w-full h-44 object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePasteFromClipboardApi(setUniformImg, 'صورة الزي العسكري');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>لصق صورة بديلة (Ctrl+V)</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUniformImg('');
                        }}
                        className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                        title="حذف الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/15 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-black/40 hover:bg-black/60 transition-all">
                    <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 text-amber-400">
                      <Clipboard className="w-5 h-5" />
                    </div>

                    <span className="text-xs font-bold text-white mb-1">
                      حدد المربع بالماوس واضغط <span className="text-amber-400 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">Ctrl + V</span> للصق الصورة
                    </span>
                    <span className="text-[11px] text-slate-400 mb-3">
                      أو انسخ لقطة الشاشة ثم اضغط زر اللصق أدناه
                    </span>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUploadTarget('uniform');
                          handlePasteFromClipboardApi(setUniformImg, 'صورة الزي العسكري');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>📋 لصق من الحافظة</span>
                      </button>

                      <label 
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-white/10"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>اختيار ملف</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, setUniformImg, 'صورة الزي العسكري')}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400">
                ملاحظة: يمكنك إكمال الطلب ورفعه حتى لو لم ترفق الصور الآن إذا لم تتوفر لديك مؤقتاً.
              </div>

            </div>

            {/* Right Column: Discord Roles Box */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">طلب الرولات المنسق</span>
                <span className="text-[10px] text-slate-400">جاهز للنسخ والإرسال</span>
              </div>

              <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed min-h-[190px] whitespace-pre-wrap select-all mb-4" dir="ltr">
                {generateRoleText()}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={copyRoleRequest}
                  className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    copiedRole
                      ? 'bg-emerald-500 text-black'
                      : theme.buttonClass
                  }`}
                >
                  {copiedRole ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تم نسخ الطلب!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الطلب</span>
                    </>
                  )}
                </button>

                <a
                  href={sector.discordRoomUrl || "https://discord.gg/prava"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-white border border-[#5865F2]/40 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-[#5865F2]" />
                  <span>مكان إرسال الرسالة (روم الرولات)</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                الإرسال يتم يدوياً في ديسكورد. إرفاق الصور هنا لا يرسلها إلى مسؤول القبول مباشرة ما لم تقم بنسخ نص الطلب وإرساله في الروم المخصص.
              </p>
            </div>

          </div>

          {/* Step 3 Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
            >
              <span>التالي لمراجعة الطلب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {currentStep === 4 && (
        <div className="max-w-4xl mx-auto bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          <div className="mb-6 pb-4 border-b border-white/5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              المرحلة 04 / 04
            </span>
            <h3 className="text-2xl font-black text-white">
              مراجعة وتأكيد إرسال الطلب
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-xs">
            
            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">القطاع:</span>
              <span className="font-bold text-white text-sm">{sector.name} ({sector.arabicName})</span>
            </div>

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">اسم اللاعب / الهوية الرقمية:</span>
              <span className="font-bold text-white text-sm">{formData.playerName} (ID: {formData.gameId})</span>
            </div>

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">الاسم الكامل / العمر:</span>
              <span className="font-bold text-white text-sm">{formData.fullName} - {formData.age} سنة</span>
            </div>

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">الرقم العسكري / اليونت الآلي:</span>
              <span className="font-bold text-amber-400 text-sm font-mono">{formData.militaryNo} | اليونت: {formData.currentUnit}</span>
            </div>

            {formData.acceptanceOfficer && (
              <div className="bg-[#090b10] p-4 rounded-xl border border-white/5 sm:col-span-2">
                <span className="text-slate-400 block mb-1">مسؤول القبول:</span>
                <span className="font-bold text-white text-sm">{formData.acceptanceOfficer}</span>
              </div>
            )}

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5 sm:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block mb-1">نتيجة اختبار القبول التلقائي:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {calculateScore()} من {sector.questions.length} إجابات صحيحة
                </span>
              </div>
              <Award className="w-6 h-6 text-amber-400" />
            </div>

          </div>

          {submitError && (
            <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold text-center">
              {submitError}
            </div>
          )}

          {/* Step 4 Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              disabled={isSubmitting}
              onClick={handleSubmitApplication}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95`}
            >
              {isSubmitting ? (
                <span>جاري إرسال الطلب...</span>
              ) : (
                <>
                  <span>إرسال الطلب نهائياً</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* Paste Notification Toast */}
      {pasteToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 border border-amber-300">
          <Check className="w-4 h-4 text-slate-950" />
          <span>{pasteToast}</span>
        </div>
      )}

    </div>
  );
};
