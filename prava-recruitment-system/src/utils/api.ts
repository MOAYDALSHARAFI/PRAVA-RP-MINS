/**
 * API Base URL resolution:
 * Uses import.meta.env.VITE_API_BASE_URL if configured (e.g. Render / Railway / Cloud Run),
 * otherwise falls back to relative path for same-origin and Vercel Serverless routes.
 */
const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
export const API_BASE_URL = RAW_API_BASE;

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return cleanPath;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Safe fetch JSON helper that avoids "SyntaxError: Unexpected token '<'"
 * when an API route returns HTML (such as 404/500/SPA fallback) or network fails.
 */
export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const fullUrl = apiUrl(url);
    const res = await fetch(fullUrl, options);
    if (!res.ok) {
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
