import { createApp } from '../server.ts';

let cachedApp: any = null;

/**
 * Vercel Serverless Function entry point:
 * Handles all /api/* requests on Vercel without requiring a separate server.
 */
export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      cachedApp = await createApp();
    }
    return cachedApp(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Function Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'تعذر تشغيل الخادم السحابي',
        message: err?.message || 'Serverless Execution Error',
      });
    }
  }
}
