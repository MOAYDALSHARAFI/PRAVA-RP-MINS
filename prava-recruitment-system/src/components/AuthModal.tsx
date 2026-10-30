import React, { useState, useEffect } from 'react';
import { 
  Lock, X, UserPlus, LogIn, Sparkles, AlertCircle, 
  Gamepad2, MessageSquare, User, KeyRound, CheckCircle2,
  Smartphone, Zap, ShieldCheck, RefreshCw, Trash2,
  Clock, Send, Copy, CheckCheck, ExternalLink, ShieldAlert,
  Eye, EyeOff
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { UserAccount, ServerSettings } from '../types.ts';
import { 
  getSavedDeviceProfile, 
  saveDeviceProfile, 
  clearDeviceProfile, 
  performDeviceLogin,
  DeviceProfile 
} from '../utils/deviceAuth.ts';
import { apiUrl } from '../utils/api.ts';
import { DEFAULT_USERS } from '../data/defaultData.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
  serverSettings?: ServerSettings;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'register',
  serverSettings,
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Remember this device preference
  const [rememberThisDevice, setRememberThisDevice] = useState(true);
  const [savedDevice, setSavedDevice] = useState<DeviceProfile | null>(null);

  // Register form fields
  const [gameId, setGameId] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login form fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeviceLoggingIn, setIsDeviceLoggingIn] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [pendingApprovalUser, setPendingApprovalUser] = useState<{
    username: string;
    displayName?: string;
    gameId?: string;
    discordUsername?: string;
    message?: string;
  } | null>(null);

  // Keep mode in sync whenever modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setShowPassword(false);
      const profile = getSavedDeviceProfile();
      setSavedDevice(profile);
      if (profile && profile.user && !loginUsername) {
        setLoginUsername(profile.user.username);
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // 1-Click instant login for recognized device
  const handleQuickDeviceLogin = async () => {
    if (!savedDevice?.user?.username) return;
    setError('');
    setIsDeviceLoggingIn(true);

    try {
      const res = await performDeviceLogin(savedDevice.user.username);
      if (res.success && res.user) {
        if (res.user.status === 'pending') {
          setPendingApprovalUser({
            username: res.user.username,
            displayName: res.user.displayName,
            gameId: res.user.gameId,
            discordUsername: res.user.discordUsername,
            message: 'حسابك بانتظار الاعتماد والتفعيل من قِبل الأونر أو مسؤول التوظيف.',
          });
          return;
        }
        onAuthSuccess(res.user);
        onClose();
      } else {
        if (res.isPending) {
          setPendingApprovalUser({
            username: savedDevice.user.username,
            displayName: savedDevice.user.displayName,
            message: res.error || 'حسابك بانتظار الاعتماد والتفعيل من قِبل الأونر.',
          });
          return;
        }
        setError(res.error || 'تعذر التعرف على الجهاز، يرجى كتابة كلمة المرور للدخول');
      }
    } catch {
      setError('خطأ في الاتصال، يرجى كتابة كلمة المرور لتسجيل الدخول يدوياً');
    } finally {
      setIsDeviceLoggingIn(false);
    }
  };

  // Remove saved device binding
  const handleForgetDevice = () => {
    clearDeviceProfile();
    setSavedDevice(null);
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId.trim(),
          discordUsername: discordUsername.trim(),
          username: regUsername.trim(),
          password: regPassword.trim(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'تعذر إنشاء الحساب');
          setIsLoading(false);
          return;
        }

        if (rememberThisDevice && data.user) {
          saveDeviceProfile(data.user, true);
        }

        if (data.isPending) {
          setPendingApprovalUser({
            username: data.user?.username || regUsername.trim(),
            displayName: data.user?.displayName || regUsername.trim(),
            gameId: data.user?.gameId || gameId.trim(),
            discordUsername: data.user?.discordUsername || discordUsername.trim(),
            message: data.message || 'تم تسجيل طلبك بنجاح! حسابك بانتظار الاعتماد والتفعيل من قِبل الأونر.',
          });
          setIsLoading(false);
          return;
        }

        onAuthSuccess(data.user);
        onClose();
        return;
      }

      throw new Error('Non-JSON response');
    } catch {
      // Fallback: Create pending user in localStorage
      const newUser: UserAccount = {
        id: `u-${Date.now().toString(36)}`,
        username: regUsername.trim(),
        displayName: regUsername.trim(),
        gameId: gameId.trim(),
        discordUsername: discordUsername.trim(),
        role: 'applicant',
        roleTitle: 'متقدم للتوظيف (بانتظار الاعتماد)',
        status: 'pending',
        permissions: {
          allowedSectors: [],
        },
        createdAt: new Date().toISOString(),
      };

      try {
        const stored = JSON.parse(localStorage.getItem('prava_users') || '[]');
        stored.push({ ...newUser, passwordHash: regPassword.trim() });
        localStorage.setItem('prava_users', JSON.stringify(stored));
      } catch {}

      setPendingApprovalUser({
        username: newUser.username,
        displayName: newUser.displayName,
        gameId: newUser.gameId,
        discordUsername: newUser.discordUsername,
        message: 'تم تسجيل طلبك بنجاح! انتظر مسؤولك أو الأونر يفعلك ويعطيك الرتب والصلاحيات.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          if (data.isPending) {
            setPendingApprovalUser({
              username: data.user?.username || loginUsername.trim(),
              displayName: data.user?.displayName || loginUsername.trim(),
              gameId: data.user?.gameId,
              discordUsername: data.user?.discordUsername,
              message: data.error || 'حسابك بانتظار الاعتماد والتفعيل من قِبل الأونر أو مسؤول التوظيف.',
            });
            setIsLoading(false);
            return;
          }
          setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
          setIsLoading(false);
          return;
        }

        if (data.user?.status === 'pending') {
          setPendingApprovalUser({
            username: data.user.username,
            displayName: data.user.displayName,
            gameId: data.user.gameId,
            discordUsername: data.user.discordUsername,
            message: 'حسابك بانتظار الاعتماد والتفعيل من قِبل الأونر أو مسؤول التوظيف.',
          });
          setIsLoading(false);
          return;
        }

        const authenticatedUser = {
          ...data.user,
          permissions: data.user.permissions || {
            allowedSectors: data.user.role === 'owner' ? ['*'] : ['swat'],
            canViewApps: data.user.role !== 'applicant',
          },
        };

        if (rememberThisDevice) {
          saveDeviceProfile(authenticatedUser, true);
        } else {
          clearDeviceProfile();
        }

        localStorage.setItem('prava_current_user', JSON.stringify(authenticatedUser));
        onAuthSuccess(authenticatedUser);
        onClose();
        return;
      }

      throw new Error('Non-JSON response');
    } catch {
      // Fallback: check local users and DEFAULT_USERS
      const trimmedU = loginUsername.trim().toLowerCase();
      const trimmedP = loginPassword.trim();

      let matchedUser: any = null;
      try {
        const stored = JSON.parse(localStorage.getItem('prava_users') || '[]');
        matchedUser = stored.find(
          (u: any) =>
            u.username?.toLowerCase() === trimmedU &&
            (u.passwordHash === trimmedP || u.password === trimmedP)
        );
      } catch {}

      if (!matchedUser) {
        matchedUser = DEFAULT_USERS.find(
          (u) => u.username.toLowerCase() === trimmedU && u.passwordHash === trimmedP
        );
      }

      if (matchedUser) {
        const { passwordHash, ...rawUser } = matchedUser;
        const safeUser = {
          ...rawUser,
          permissions: rawUser.permissions || {
            allowedSectors: rawUser.role === 'owner' ? ['*'] : ['swat'],
            canViewApps: rawUser.role !== 'applicant',
          },
        };
        if (rememberThisDevice) {
          saveDeviceProfile(safeUser, true);
        } else {
          clearDeviceProfile();
        }
        localStorage.setItem('prava_current_user', JSON.stringify(safeUser));
        onAuthSuccess(safeUser);
        onClose();
        return;
      }

      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0f121a] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl text-right my-auto safe-bottom animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close Button with big touch area */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 z-10"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pl-10">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            {mode === 'register' ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
              {mode === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {mode === 'register' 
                ? 'أنشئ حسابك وسيتعرف عليك جهازك للدخول التلقائي' 
                : 'ادخل بحسابك المعتمد أو بحساب الإدارة للمتابعة'}
            </p>
          </div>
        </div>

        {/* If user account is pending approval */}
        {pendingApprovalUser ? (
          <div className="space-y-4 py-2 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-500/10">
              <Clock className="w-7 h-7 animate-pulse text-amber-400" />
            </div>

            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>طلبك بانتظار الاعتماد والتفعيل</span>
              </span>
              <h3 className="text-lg font-black text-white">
                انتظر مسؤولك أو الأونر يفعلك
              </h3>
              <p className="text-[11px] text-amber-200/90 leading-relaxed font-semibold max-w-sm mx-auto">
                تم تسجيل طلب حسابك بنجاح! سيقوم الأونر أو مسؤول التوظيف بمراجعة طلبك وتفعيل صلاحياتك.
              </p>
            </div>

            {/* Applicant Details Card */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-slate-400">اسم المستخدم:</span>
                <span className="font-mono font-bold text-amber-300">@{pendingApprovalUser.username}</span>
              </div>
              {pendingApprovalUser.gameId && (
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-slate-400">الآيدي داخل اللعبة:</span>
                  <span className="font-mono text-white">{pendingApprovalUser.gameId}</span>
                </div>
              )}
              {pendingApprovalUser.discordUsername && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">حساب الديسكورد:</span>
                  <span className="font-mono text-slate-300">{pendingApprovalUser.discordUsername}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <a
                href={serverSettings?.ownerContactUrl || serverSettings?.discordRoomUrl || serverSettings?.discordUrl || 'https://discord.gg'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>تواصل مع الإدارة في ديسكورد لتسريع التفعيل 💬</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const text = `السلام عليكم، تم إنشاء حساب في منصة التوظيف وبانتظار التفعيل:\n- اسم المستخدم: @${pendingApprovalUser.username}\n- الآيدي داخل اللعبة: ${pendingApprovalUser.gameId || '-'}\n- الديسكورد: ${pendingApprovalUser.discordUsername || '-'}`;
                  navigator.clipboard.writeText(text);
                  setCopiedDetails(true);
                  setTimeout(() => setCopiedDetails(false), 2500);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedDetails ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">تم نسخ رسالة التفعيل بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>نسخ رسالة التفعيل لإرسالها بالديسكورد</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPendingApprovalUser(null);
                  setMode('login');
                  setLoginUsername(pendingApprovalUser.username);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                الرجوع لتسجيل الدخول بحساب آخر
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Toggle (تسجيل الدخول / إنشاء حساب) - Always easy to switch */}
            <div className="flex rounded-xl bg-white/5 p-1 mb-4 border border-white/10">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? `${theme.buttonClass} shadow-md`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? `${theme.buttonClass} shadow-md`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إنشاء حساب</span>
              </button>
            </div>

            {/* Error notification */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold mb-3 animate-in shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5 text-right">
                
                {/* 1-Click Quick Device Login Button (if device was recognized) */}
                {savedDevice?.user && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#161c28] to-[#0d1017] border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>جهازك محفوظ كـ ({savedDevice.user.displayName})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleForgetDevice}
                        className="text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                        title="إزالة حفظ الجهاز"
                      >
                        إزالة
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleQuickDeviceLogin}
                      disabled={isDeviceLoggingIn}
                      className={`w-full py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow flex items-center justify-center gap-1.5`}
                    >
                      {isDeviceLoggingIn ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري الدخول السريع...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>دخول فوري بضغطة زر ⚡</span>
                        </>
                      )}
                    </button>

                    <div className="text-[10px] text-slate-400 text-center">
                      أو اكتب بيانات الحساب أدناه لتسجيل الدخول:
                    </div>
                  </div>
                )}

                {/* Username Input - font size 16px to prevent iOS auto-zoom */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>اسم المستخدم (اليوزر)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left transition-colors"
                    dir="ltr"
                  />
                </div>

                {/* Password Input with Eye Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>كلمة السر (الباسورد)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full px-3.5 py-3 pl-11 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left transition-colors"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember device checkbox */}
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberThisDevice}
                    onChange={(e) => setRememberThisDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-black/40 border-white/20 accent-amber-500 cursor-pointer"
                  />
                  <div className="flex-1 text-right">
                    <span className="text-xs font-bold text-slate-200 block">
                      تذكر هذا الجهاز وتفعيل الدخول التلقائي 📱
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      دخول مباشر بدون كتابة الباسورد في الزيارات القادمة
                    </span>
                  </div>
                </label>

                {/* Login Submit Button - min height 48px */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow-lg flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التحقق والدخول...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </button>

              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>الآيدي في اللعبة (Game ID)</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    placeholder="مثال: 7421"
                    inputMode="numeric"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
                    <span>يوزرك في الديسكورد (Discord)</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="مثال: username#0000 أو 123456789"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>اسم المستخدم لتسجيل الدخول (اليوزر)</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="اسم المستخدم بالأحرف الإنجليزية"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>كلمة المرور (الباسورد)</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left"
                    dir="ltr"
                  />
                </div>

                {/* Remember device */}
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberThisDevice}
                    onChange={(e) => setRememberThisDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-black/40 border-white/20 accent-amber-500 cursor-pointer"
                  />
                  <div className="flex-1 text-right">
                    <span className="text-xs font-bold text-slate-200 block">
                      تذكر هذا الجهاز والدخول التلقائي 📱
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      حفظ الجهاز للتعرف عليك فوراً بدون كلمة السر
                    </span>
                  </div>
                </label>

                {/* Register Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow-lg flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الطلب...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>إنشاء الحساب والتقديم للتوظيف</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer visitor link */}
            <div className="mt-3 pt-2.5 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
              >
                المتابعة كزائر واستعراض القطاعات
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
