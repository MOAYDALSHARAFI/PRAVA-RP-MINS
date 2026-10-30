import React, { useState } from 'react';
import { Lock, X, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { apiUrl } from '../utils/api.ts';
import { DEFAULT_USERS } from '../data/defaultData.ts';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userDisplayName: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Local credential check if server is in standalone / serverless / offline mode
  const checkLocalCredentials = (u: string, p: string) => {
    const trimmedU = u.trim().toLowerCase();
    const trimmedP = p.trim();

    // Check localStorage cached users first
    try {
      const savedUsersStr = localStorage.getItem('prava_users');
      if (savedUsersStr) {
        const parsed = JSON.parse(savedUsersStr);
        if (Array.isArray(parsed)) {
          const matched = parsed.find(
            (user: any) =>
              user.username?.toLowerCase() === trimmedU &&
              (user.passwordHash === trimmedP || user.password === trimmedP)
          );
          if (matched) return matched;
        }
      }
    } catch {}

    // Check DEFAULT_USERS
    const matched = DEFAULT_USERS.find(
      (user) => user.username.toLowerCase() === trimmedU && user.passwordHash === trimmedP
    );
    return matched || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
          setIsLoading(false);
          return;
        }

        if (data.user) {
          localStorage.setItem('prava_current_user', JSON.stringify(data.user));
          onLoginSuccess(data.user.displayName || data.user.username || '12465');
        } else {
          localStorage.setItem('prava_current_user', JSON.stringify(data));
          onLoginSuccess(data.displayName || data.username || '12465');
        }
        onClose();
        return;
      }

      // If server returned HTML (e.g. Vercel SPA rewrite fallback), authenticate via verified fallback
      throw new Error('Non-JSON response (SPA Fallback)');
    } catch {
      // Fallback: Verify credentials directly
      const localMatched = checkLocalCredentials(username, password);
      if (localMatched) {
        const { passwordHash, ...safeUser } = localMatched as any;
        localStorage.setItem('prava_current_user', JSON.stringify(safeUser));
        onLoginSuccess(safeUser.displayName || '12465');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0f1219] border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 text-right my-auto safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button with comfortable touch area */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pl-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">دخول الإدارة</h3>
            <p className="text-xs text-slate-400 mt-0.5">ادخل باسم المستخدم وكلمة السر للوصول للوحة التحكم</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4 animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>اسم المستخدم (اليوزر)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              className="w-full px-4 py-3 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left transition-colors"
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>كلمة السر (الباسورد)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pl-11 rounded-xl bg-[#080a0f] border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-base sm:text-sm font-mono text-left transition-colors"
                dir="ltr"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} mt-3 active:scale-95 shadow-lg flex items-center justify-center gap-2`}
          >
            {isLoading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-5 pt-3 border-t border-white/5 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
          <span>بوابة تسجيل دخول آمنة ومحمية</span>
        </div>

      </div>
    </div>
  );
};
