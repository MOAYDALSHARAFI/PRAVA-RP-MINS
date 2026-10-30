import { UserAccount } from '../types.ts';
import { apiUrl } from './api.ts';

export interface DeviceProfile {
  deviceId: string;
  rememberDevice: boolean;
  autoLogin: boolean;
  lastLoginAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    role: string;
    roleTitle: string;
    gameId?: string;
    discordUsername?: string;
  };
}

const DEVICE_ID_KEY = 'prava_device_id';
const DEVICE_PROFILE_KEY = 'prava_device_profile';

// Get or generate a persistent device fingerprint ID
export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev_fallback_' + Date.now();
  }
}

// Retrieve the remembered profile on this device
export function getSavedDeviceProfile(): DeviceProfile | null {
  try {
    const raw = localStorage.getItem(DEVICE_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save or update device profile
export function saveDeviceProfile(user: UserAccount, autoLogin: boolean = true) {
  try {
    const deviceId = getOrCreateDeviceId();
    const profile: DeviceProfile = {
      deviceId,
      rememberDevice: true,
      autoLogin,
      lastLoginAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        roleTitle: user.roleTitle,
        gameId: user.gameId,
        discordUsername: user.discordUsername,
      },
    };
    localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving device profile', err);
  }
}

// Clear or unbind device profile
export function clearDeviceProfile() {
  try {
    localStorage.removeItem(DEVICE_PROFILE_KEY);
  } catch (err) {
    console.error('Error clearing device profile', err);
  }
}

// Perform instant device login
export async function performDeviceLogin(username?: string): Promise<{ success: boolean; user?: UserAccount; error?: string; isPending?: boolean }> {
  try {
    const profile = getSavedDeviceProfile();
    const targetUsername = username || profile?.user?.username;
    const deviceId = profile?.deviceId || getOrCreateDeviceId();

    if (!targetUsername) {
      return { success: false, error: 'لا يوجد حساب محفوظ على هذا الجهاز' };
    }

    try {
      const res = await fetch(apiUrl('/api/auth/device-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          username: targetUsername,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.isPending || data.user?.status === 'pending') {
          return { success: false, isPending: true, error: data.error || data.message || 'حسابك بانتظار الاعتماد من قِبل الإدارة' };
        }
        if (res.ok && data.success && data.user) {
          saveDeviceProfile(data.user, profile?.autoLogin ?? true);
          localStorage.setItem('prava_current_user', JSON.stringify(data.user));
          return { success: true, user: data.user };
        }
        if (!res.ok) {
          return { success: false, error: data.error || 'فشل تسجيل الدخول عبر الجهاز' };
        }
      }
    } catch {
      // Server unreachable, fall back to locally saved profile
    }

    // Offline / Standalone Fallback: Recognized device profile
    if (profile && profile.user && profile.user.username.toLowerCase() === targetUsername.toLowerCase()) {
      localStorage.setItem('prava_current_user', JSON.stringify(profile.user));
      return { success: true, user: profile.user as any };
    }

    return { success: false, error: 'تعذر التحقق من الجهاز حالياً' };
  } catch (err: any) {
    return { success: false, error: 'خطأ في الاتصال: ' + (err.message || '') };
  }
}
