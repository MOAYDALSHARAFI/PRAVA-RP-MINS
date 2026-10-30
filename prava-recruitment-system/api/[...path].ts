import handler from './index.ts';

/**
 * Vercel Serverless Catch-All Route:
 * Automatically matches all /api/* routes (e.g., /api/auth/login, /api/sectors, etc.)
 * natively in Vercel even without custom rewrite rules.
 */
export default handler;
