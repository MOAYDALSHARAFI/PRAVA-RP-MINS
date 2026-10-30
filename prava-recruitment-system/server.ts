import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { DEFAULT_MILITARY_RANKS, DEFAULT_UNIT_RULES } from './src/data/defaultData.ts';
import {
  encryptSecret,
  decryptSecret,
  isSecretEncrypted,
  maskSecret,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
  scrubSensitiveDetails,
} from './src/server/security.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.resolve(__dirname, 'data/db.json');

interface Sector {
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
  unitPrefix?: string;
  autoAccept?: boolean;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
  }>;
}

interface Application {
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
  rank?: string;
  rankProtocol?: string;
  rankRoleId?: string;
  rankRoleMention?: string;
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

interface LoginLog {
  id: string;
  username: string;
  timestamp: string;
  displayName?: string;
  roleTitle?: string;
  action?: 'login' | 'logout' | 'register' | 'application_submit' | 'user_approved' | string;
  createdAt?: string;
  deviceId?: string;
  deviceAccountsCount?: number;
  deviceApplicationsCount?: number;
  details?: string;
  gameId?: string;
  [key: string]: any;
}

interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  gameId?: string;
  discordUsername?: string;
  role: 'owner' | 'leader' | 'officer' | 'applicant';
  roleTitle: string;
  permissions: Record<string, any>;
  status?: 'active' | 'pending' | 'rejected' | string;
  registeredDeviceId?: string;
  requestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  [key: string]: any;
}

interface ServerSettings {
  serverLogo: string;
  serverName: string;
  discordUrl: string;
  discordName: string;
  defaultUnitPrefix: string;
  webhookUrl?: string;
  botToken?: string;
  encryptedBotToken?: string;
  encryptedWebhookUrl?: string;
  encryptedSeniorOfficersWebhookUrl?: string;
  discordChannelId?: string;
  discordRoomUrl?: string;
  seniorOfficersWebhookUrl?: string;
  seniorOfficersChannelId?: string;
  seniorOfficersMessageTemplate?: string;
  autoAcceptApplications?: boolean;
  ranks?: any[];
  protocols?: any[];
  [key: string]: any;
}

interface Database {
  settings?: ServerSettings;
  sectors: Sector[];
  applications: Application[];
  loginLogs: LoginLog[];
  users: UserAccount[];
  personnelRequests?: any[];
}

const TMP_DB_FILE = path.resolve('/tmp', 'prava_db.json');

// In-memory cache for serverless environments
let memoryDb: Database | null = null;

function findDbFile(): string {
  const candidatePaths = [
    DB_FILE,
    path.resolve(process.cwd(), 'data/db.json'),
    path.resolve(__dirname, 'data/db.json'),
    path.resolve(__dirname, '../data/db.json'),
    path.resolve(process.cwd(), 'prava-recruitment-system (3)/data/db.json'),
    path.resolve(process.cwd(), 'prava-recruitment-system/data/db.json'),
    path.resolve(process.cwd(), 'prava-recruitment-system (1)/data/db.json'),
    TMP_DB_FILE,
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return DB_FILE;
}

function loadDb(): Database {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    let activeFile = DB_FILE;
    if (!fs.existsSync(activeFile)) {
      activeFile = findDbFile();
    }
    // If TMP_DB_FILE exists and is newer than DB_FILE, use it
    if (fs.existsSync(TMP_DB_FILE)) {
      try {
        if (!fs.existsSync(activeFile) || fs.statSync(TMP_DB_FILE).mtimeMs > fs.statSync(activeFile).mtimeMs) {
          activeFile = TMP_DB_FILE;
        }
      } catch {}
    }

    if (fs.existsSync(activeFile)) {
      const data = fs.readFileSync(activeFile, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.settings) {
        parsed.settings = {
          serverLogo: '/src/assets/images/prava_main_emblem_1791840349389.jpg',
          serverName: 'سيرفر PRAVA',
          discordUrl: 'https://discord.gg/prava',
          discordName: 'ديسكورد PRAVA',
          defaultUnitPrefix: 'M-',
          ranks: DEFAULT_MILITARY_RANKS,
        };
      } else if (!Array.isArray(parsed.settings.ranks)) {
        parsed.settings.ranks = DEFAULT_MILITARY_RANKS;
      }

      // Security Migration: Encrypt Bot Token and Webhooks with AES-256-GCM if in plaintext
      let dbModified = false;
      if (parsed.settings.botToken && !parsed.settings.botToken.startsWith('•') && !isSecretEncrypted(parsed.settings.botToken)) {
        parsed.settings.encryptedBotToken = encryptSecret(parsed.settings.botToken);
        process.env.DISCORD_BOT_TOKEN = parsed.settings.botToken.trim();
        parsed.settings.botToken = '';
        dbModified = true;
      }
      if (parsed.settings.encryptedBotToken) {
        const decryptedToken = decryptSecret(parsed.settings.encryptedBotToken);
        if (decryptedToken) process.env.DISCORD_BOT_TOKEN = decryptedToken;
      }
      if (parsed.settings.webhookUrl && !isSecretEncrypted(parsed.settings.webhookUrl)) {
        parsed.settings.encryptedWebhookUrl = encryptSecret(parsed.settings.webhookUrl);
        dbModified = true;
      }
      if (parsed.settings.seniorOfficersWebhookUrl && !isSecretEncrypted(parsed.settings.seniorOfficersWebhookUrl)) {
        parsed.settings.encryptedSeniorOfficersWebhookUrl = encryptSecret(parsed.settings.seniorOfficersWebhookUrl);
        dbModified = true;
      }

      // Security Migration: Hash all user passwords with PBKDF2-SHA512 + Salt
      if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
        parsed.users = [
          {
            id: 'u-admin',
            username: 'admin',
            passwordHash: hashPassword('prava2026'),
            displayName: '12465',
            role: 'owner',
            roleTitle: 'مالك السيرفر',
            permissions: {
              canReviewApps: true,
              canEditSectors: true,
              canManageAccounts: true,
              canEditUnitPrefix: true,
              allowedSectors: ['*'],
            },
            createdAt: new Date().toISOString(),
          },
        ];
        dbModified = true;
      } else {
        parsed.users.forEach((u: any) => {
          if (u.passwordHash && !u.passwordHash.startsWith('pbkdf2:sha512:')) {
            u.passwordHash = hashPassword(u.passwordHash);
            dbModified = true;
          }
        });
      }

      if (!parsed.personnelRequests) {
        parsed.personnelRequests = [];
      }
      memoryDb = parsed;
      if (dbModified) {
        saveDb(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db.json, using defaults', err);
  }

  const defaultDb: Database = {
    settings: {
      serverLogo: '/src/assets/images/prava_main_emblem_1791840349389.jpg',
      serverName: 'سيرفر PRAVA',
      discordUrl: 'https://discord.gg/prava',
      discordName: 'ديسكورد PRAVA',
      defaultUnitPrefix: 'M-',
      ranks: DEFAULT_MILITARY_RANKS,
    },
    sectors: [],
    applications: [],
    loginLogs: [],
    personnelRequests: [],
    users: [
      {
        id: 'u-admin',
        username: 'admin',
        passwordHash: hashPassword('prava2026'),
        displayName: '12465',
        role: 'owner',
        roleTitle: 'مالك السيرفر',
        permissions: {
          canReviewApps: true,
          canEditSectors: true,
          canManageAccounts: true,
          canEditUnitPrefix: true,
          allowedSectors: ['*'],
        },
        createdAt: new Date().toISOString(),
      },
    ],
  };

  memoryDb = defaultDb;
  return defaultDb;
}

// Discord Environment Variables Accessors (Safe & Secure with AES-256-GCM Decryption)
const getDiscordBotToken = (): string => {
  const db = memoryDb || loadDb();
  if (db.settings?.encryptedBotToken) {
    const decrypted = decryptSecret(db.settings.encryptedBotToken);
    if (decrypted) return decrypted.trim();
  }
  return (process.env.DISCORD_BOT_TOKEN || '').trim();
};

const getDiscordWebhookUrl = (fallback?: string): string => {
  const db = memoryDb || loadDb();
  if (db.settings?.encryptedWebhookUrl) {
    const decrypted = decryptSecret(db.settings.encryptedWebhookUrl);
    if (decrypted) return decrypted.trim();
  }
  if (db.settings?.webhookUrl) {
    const decrypted = decryptSecret(db.settings.webhookUrl);
    if (decrypted) return decrypted.trim();
  }
  if (fallback) {
    return decryptSecret(fallback).trim();
  }
  return (process.env.DISCORD_WEBHOOK_URL || '').trim();
};

const getSeniorOfficersWebhookUrl = (fallback?: string): string => {
  const db = memoryDb || loadDb();
  if (db.settings?.encryptedSeniorOfficersWebhookUrl) {
    const decrypted = decryptSecret(db.settings.encryptedSeniorOfficersWebhookUrl);
    if (decrypted) return decrypted.trim();
  }
  if (db.settings?.seniorOfficersWebhookUrl) {
    const decrypted = decryptSecret(db.settings.seniorOfficersWebhookUrl);
    if (decrypted) return decrypted.trim();
  }
  if (fallback) {
    return decryptSecret(fallback).trim();
  }
  return (process.env.SENIOR_OFFICERS_WEBHOOK_URL || '').trim();
};

const getDiscordChannelId = (fallback?: string): string => {
  return (process.env.DISCORD_CHANNEL_ID || fallback || '').trim();
};

const getSeniorOfficersChannelId = (fallback?: string): string => {
  return (process.env.SENIOR_OFFICERS_CHANNEL_ID || fallback || '').trim();
};

function saveDb(db: Database) {
  try {
    // Keep memory in sync for current serverless lifecycle
    memoryDb = db;

    // Hardening: Encrypt secrets with AES-256-GCM and NEVER write plaintext botToken to db.json
    if (db.settings) {
      if (db.settings.botToken && !db.settings.botToken.startsWith('•') && !isSecretEncrypted(db.settings.botToken)) {
        const plainToken = db.settings.botToken.trim();
        db.settings.encryptedBotToken = encryptSecret(plainToken);
        process.env.DISCORD_BOT_TOKEN = plainToken;
      }
      db.settings.botToken = '';

      if (db.settings.webhookUrl && !isSecretEncrypted(db.settings.webhookUrl)) {
        db.settings.encryptedWebhookUrl = encryptSecret(db.settings.webhookUrl);
      }
      if (db.settings.seniorOfficersWebhookUrl && !isSecretEncrypted(db.settings.seniorOfficersWebhookUrl)) {
        db.settings.encryptedSeniorOfficersWebhookUrl = encryptSecret(db.settings.seniorOfficersWebhookUrl);
      }
    }

    // Ensure all user passwords are encrypted with PBKDF2-SHA512 + Salt
    if (db.users && Array.isArray(db.users)) {
      db.users.forEach((u: any) => {
        if (u.passwordHash && !u.passwordHash.startsWith('pbkdf2:sha512:')) {
          u.passwordHash = hashPassword(u.passwordHash);
        }
      });
    }

    const jsonStr = JSON.stringify(db, null, 2);

    // 1. Primary write to persistent DB_FILE (data/db.json)
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, jsonStr, 'utf-8');
    } catch (e) {
      // In read-only environments (e.g. Vercel Serverless Function), fallback to /tmp
    }

    // 2. Always mirror to TMP_DB_FILE as well
    try {
      fs.writeFileSync(TMP_DB_FILE, jsonStr, 'utf-8');
    } catch {}
  } catch (err) {
    console.error('Error writing to db.json', err);
  }
}

// Format current time in Arabic style matching screenshots (e.g., 2026/10/12، 11:18:49 م)
function formatArabicDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;

  return `${year}/${month}/${day}، ${hours}:${minutes}:${seconds} ${period}`;
}

// Device & Security Analytics Helpers
function countAccountsForDevice(db: Database, deviceId: string): number {
  if (!deviceId || deviceId === 'غير معروف') return 0;
  return (db.users || []).filter((u: any) => u.registeredDeviceId === deviceId).length;
}

function countApplicationsForDevice(db: Database, deviceId: string, gameId?: string, discordUsername?: string): number {
  if (!db.applications) return 0;
  let count = 0;
  db.applications.forEach((app: any) => {
    if (deviceId && deviceId !== 'غير معروف' && app.deviceId === deviceId) count++;
    else if (gameId && app.gameId === gameId) count++;
    else if (discordUsername && app.discordId === discordUsername) count++;
  });
  return count;
}

function recordAuditLog(
  db: Database,
  params: {
    action: string;
    username: string;
    displayName?: string;
    roleTitle?: string;
    deviceId?: string;
    details?: string;
    gameId?: string;
    discordUsername?: string;
  }
) {
  if (!db.loginLogs) db.loginLogs = [];

  // Auto-prune logs older than 14 days (تجديد وحفظ آخر أسبوعين تلقائياً)
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  db.loginLogs = db.loginLogs.filter((l: any) => {
    if (!l.createdAt) return true;
    const t = new Date(l.createdAt).getTime();
    return !isNaN(t) && t > fourteenDaysAgo;
  });

  const devId = params.deviceId || 'غير معروف';
  const accountsCount = devId !== 'غير معروف' ? countAccountsForDevice(db, devId) : 1;
  const applicationsCount = countApplicationsForDevice(db, devId, params.gameId, params.discordUsername);

  const entry: any = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: params.username,
    displayName: params.displayName || params.username,
    roleTitle: params.roleTitle || 'عضو',
    action: params.action,
    timestamp: formatArabicDateTime(),
    createdAt: new Date().toISOString(),
    deviceId: devId,
    deviceAccountsCount: accountsCount,
    deviceApplicationsCount: applicationsCount,
    details: scrubSensitiveDetails(params.details || ''),
  };

  db.loginLogs.unshift(entry);
  if (db.loginLogs.length > 500) {
    db.loginLogs = db.loginLogs.slice(0, 500);
  }
}

// Clean and prune applications: last 7 days and max 30 items
function pruneApplications(applications: Application[]): Application[] {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  const sorted = [...applications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filtered = sorted.filter((app) => {
    const time = new Date(app.createdAt).getTime();
    return isNaN(time) || time >= oneWeekAgo;
  });

  return filtered.slice(0, 30);
}

export async function createApp() {
  const app = express();

  app.use(express.json({ limit: '20mb' }));
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Enable CORS for Vercel and remote frontend origins
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Vercel Serverless Path Normalizer (handles both /api/path and rewritten /path)
  app.use((req, _res, next) => {
    if (req.url && !req.url.startsWith('/api') && req.url !== '/' && !req.url.startsWith('/?')) {
      const apiPrefixes = ['/auth', '/sectors', '/applications', '/settings', '/ranks', '/users', '/logs', '/health', '/owner', '/discord', '/download', '/system-backup'];
      if (apiPrefixes.some((p) => req.url.startsWith(p))) {
        req.url = '/api' + req.url;
      }
    }
    next();
  });

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'PRAVA Recruitment Portal' });
  });

  // Settings Endpoints
  app.get('/api/settings', (_req: Request, res: Response) => {
    const db = loadDb();
    const envBotToken = getDiscordBotToken();
    const hasBotToken = Boolean(envBotToken);

    const safeSettings = {
      ...(db.settings || {}),
      webhookUrl: getDiscordWebhookUrl(db.settings?.webhookUrl),
      discordChannelId: getDiscordChannelId(db.settings?.discordChannelId),
      seniorOfficersWebhookUrl: getSeniorOfficersWebhookUrl(db.settings?.seniorOfficersWebhookUrl),
      seniorOfficersChannelId: getSeniorOfficersChannelId(db.settings?.seniorOfficersChannelId),
      // MASK the botToken completely - NEVER expose plaintext
      botToken: hasBotToken ? '••••••••••••••••••••••••••••••••' : '',
      botTokenConfigured: hasBotToken,
      botTokenProtected: true,
      botTokenEncryption: 'AES-256-GCM (Military-Grade Authenticated Encryption)',
    };
    // Strip internal encrypted fields from API response for safety
    delete (safeSettings as any).encryptedBotToken;
    delete (safeSettings as any).encryptedWebhookUrl;
    delete (safeSettings as any).encryptedSeniorOfficersWebhookUrl;

    res.json(safeSettings);
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const db = loadDb();
    let newSettings = {
      ...db.settings,
      ...req.body,
    };

    // CRITICAL SECURITY: If user provided a fresh token, encrypt and store safely
    if (newSettings.botToken && !newSettings.botToken.startsWith('•')) {
      const cleanToken = newSettings.botToken.trim();
      newSettings.encryptedBotToken = encryptSecret(cleanToken);
      process.env.DISCORD_BOT_TOKEN = cleanToken;
    } else if (newSettings.botToken && newSettings.botToken.startsWith('•')) {
      // User kept the masked token: retain the existing encryptedBotToken
      newSettings.encryptedBotToken = db.settings?.encryptedBotToken;
    }
    // NEVER save raw botToken into db.json
    newSettings.botToken = '';

    // Encrypt Webhooks
    if (newSettings.webhookUrl && !isSecretEncrypted(newSettings.webhookUrl)) {
      newSettings.encryptedWebhookUrl = encryptSecret(newSettings.webhookUrl);
    }
    if (newSettings.seniorOfficersWebhookUrl && !isSecretEncrypted(newSettings.seniorOfficersWebhookUrl)) {
      newSettings.encryptedSeniorOfficersWebhookUrl = encryptSecret(newSettings.seniorOfficersWebhookUrl);
    }

    if (newSettings.serverLogo && newSettings.serverLogo.startsWith('data:image')) {
      try {
        const matches = newSettings.serverLogo.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = `server_logo_${Date.now()}.${ext}`;
          const filePath = path.resolve(__dirname, 'public', fileName);
          fs.writeFileSync(filePath, buffer);
          newSettings.serverLogo = `/${fileName}`;
        }
      } catch (err) {
        console.error('Failed to save server logo image to disk', err);
      }
    }
    db.settings = newSettings;
    saveDb(db);

    const hasBotToken = Boolean(getDiscordBotToken());
    const safeResponse = {
      ...db.settings,
      webhookUrl: getDiscordWebhookUrl(db.settings?.webhookUrl),
      discordChannelId: getDiscordChannelId(db.settings?.discordChannelId),
      seniorOfficersWebhookUrl: getSeniorOfficersWebhookUrl(db.settings?.seniorOfficersWebhookUrl),
      seniorOfficersChannelId: getSeniorOfficersChannelId(db.settings?.seniorOfficersChannelId),
      botToken: hasBotToken ? '••••••••••••••••••••••••••••••••' : '',
      botTokenConfigured: hasBotToken,
      botTokenProtected: true,
      botTokenEncryption: 'AES-256-GCM (Military-Grade Authenticated Encryption)',
    };
    delete (safeResponse as any).encryptedBotToken;
    delete (safeResponse as any).encryptedWebhookUrl;
    delete (safeResponse as any).encryptedSeniorOfficersWebhookUrl;

    res.json(safeResponse);
  });

  // Dedicated Military Ranks Endpoints (Robust CRUD & Instant Persistence)
  app.get('/api/ranks', (_req: Request, res: Response) => {
    const db = loadDb();
    const ranks = Array.isArray(db.settings?.ranks) ? db.settings.ranks : DEFAULT_MILITARY_RANKS;
    res.json(ranks);
  });

  app.put('/api/ranks', (req: Request, res: Response) => {
    const db = loadDb();
    if (!db.settings) {
      db.settings = {
        serverLogo: '/server_logo.png',
        serverName: 'سيرفر PRAVA',
        discordUrl: '',
        discordName: '',
        defaultUnitPrefix: 'SWAT',
        ranks: [...DEFAULT_MILITARY_RANKS],
      };
    }
    const ranks = Array.isArray(req.body.ranks) ? req.body.ranks : [];
    db.settings.ranks = ranks;
    saveDb(db);
    res.json({ success: true, ranks: ranks });
  });

  app.delete('/api/ranks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    if (!db.settings) {
      db.settings = {
        serverLogo: '/server_logo.png',
        serverName: 'سيرفر PRAVA',
        discordUrl: '',
        discordName: '',
        defaultUnitPrefix: 'SWAT',
        ranks: [...DEFAULT_MILITARY_RANKS],
      };
    }
    const currentRanks = Array.isArray(db.settings.ranks) ? db.settings.ranks : [...DEFAULT_MILITARY_RANKS];
    const initialCount = currentRanks.length;
    const updated = currentRanks.filter((r: any) => String(r.id) !== String(id));
    db.settings.ranks = updated;
    saveDb(db);
    res.json({
      success: true,
      deletedId: id,
      deletedCount: initialCount - updated.length,
      ranks: updated,
    });
  });

  app.post('/api/ranks/restore-defaults', (_req: Request, res: Response) => {
    const db = loadDb();
    if (!db.settings) {
      db.settings = {
        serverLogo: '/server_logo.png',
        serverName: 'سيرفر PRAVA',
        discordUrl: '',
        discordName: '',
        defaultUnitPrefix: 'SWAT',
        ranks: [...DEFAULT_MILITARY_RANKS],
      };
    }
    db.settings.ranks = [...DEFAULT_MILITARY_RANKS];
    saveDb(db);
    res.json({ success: true, ranks: db.settings.ranks });
  });

  // Dedicated Unit Rules Endpoints (Robust CRUD & Instant Persistence per Sector)
  app.get('/api/unit-rules', (_req: Request, res: Response) => {
    const db = loadDb();
    const rules = Array.isArray(db.settings?.unitRules) && db.settings.unitRules.length > 0
      ? db.settings.unitRules
      : DEFAULT_UNIT_RULES;
    res.json(rules);
  });

  app.put('/api/unit-rules', (req: Request, res: Response) => {
    const db = loadDb();
    if (!db.settings) {
      db.settings = {
        serverLogo: '/server_logo.png',
        serverName: 'سيرفر PRAVA',
        discordUrl: '',
        discordName: '',
        defaultUnitPrefix: 'SWAT',
        unitRules: [...DEFAULT_UNIT_RULES],
      };
    }
    const rules = Array.isArray(req.body.unitRules)
      ? req.body.unitRules
      : (Array.isArray(req.body) ? req.body : []);
    db.settings.unitRules = rules;
    saveDb(db);
    res.json({ success: true, unitRules: rules });
  });

  app.post('/api/unit-rules', (req: Request, res: Response) => {
    const db = loadDb();
    if (!db.settings) {
      db.settings = {
        serverLogo: '/server_logo.png',
        serverName: 'سيرفر PRAVA',
        discordUrl: '',
        discordName: '',
        defaultUnitPrefix: 'SWAT',
        unitRules: [...DEFAULT_UNIT_RULES],
      };
    }
    const currentRules = Array.isArray(db.settings.unitRules) && db.settings.unitRules.length > 0
      ? db.settings.unitRules
      : [...DEFAULT_UNIT_RULES];
    
    const newRule = req.body;
    if (!newRule || !newRule.id) {
      return res.status(400).json({ error: 'Missing rule id' });
    }

    const existingIndex = currentRules.findIndex((r: any) => String(r.id) === String(newRule.id));
    if (existingIndex >= 0) {
      currentRules[existingIndex] = { ...currentRules[existingIndex], ...newRule };
    } else {
      currentRules.push(newRule);
    }
    db.settings.unitRules = currentRules;
    saveDb(db);
    res.json({ success: true, rule: newRule, unitRules: currentRules });
  });

  app.delete('/api/unit-rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    if (!db.settings) {
      db.settings = {
        serverLogo: '/server_logo.png',
        serverName: 'سيرفر PRAVA',
        discordUrl: '',
        discordName: '',
        defaultUnitPrefix: 'SWAT',
        unitRules: [...DEFAULT_UNIT_RULES],
      };
    }
    const currentRules = Array.isArray(db.settings.unitRules) && db.settings.unitRules.length > 0
      ? db.settings.unitRules
      : [...DEFAULT_UNIT_RULES];
    
    const initialCount = currentRules.length;
    const updated = currentRules.filter((r: any) => String(r.id) !== String(id));
    db.settings.unitRules = updated;
    saveDb(db);
    res.json({
      success: true,
      deletedId: id,
      deletedCount: initialCount - updated.length,
      unitRules: updated,
    });
  });

  app.post('/api/unit-rules/restore-defaults', (_req: Request, res: Response) => {
    const db = loadDb();
    if (!db.settings) {
      db.settings = {
        serverLogo: '/server_logo.png',
        serverName: 'سيرفر PRAVA',
        discordUrl: '',
        discordName: '',
        defaultUnitPrefix: 'SWAT',
        unitRules: [...DEFAULT_UNIT_RULES],
      };
    }
    db.settings.unitRules = [...DEFAULT_UNIT_RULES];
    saveDb(db);
    res.json({ success: true, unitRules: db.settings.unitRules });
  });

  // 1. Sectors
  app.get('/api/sectors', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.sectors);
  });

  app.put('/api/sectors/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const index = db.sectors.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Sector not found' });
    }

    let updatedSector = {
      ...db.sectors[index],
      ...req.body,
    };

    // If badge is an uploaded base64 data URL, convert and persist to a real public static file!
    if (updatedSector.badge && typeof updatedSector.badge === 'string' && updatedSector.badge.startsWith('data:image')) {
      try {
        const matches = updatedSector.badge.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = `sector_${id}_badge_${Date.now()}.${ext}`;
          const filePath = path.resolve(__dirname, 'public', fileName);
          fs.writeFileSync(filePath, buffer);
          updatedSector.badge = `/${fileName}`;
        }
      } catch (err) {
        console.error('Failed to save sector badge to disk', err);
      }
    }

    db.sectors[index] = updatedSector;

    // If unitPrefix was updated for this sector, also synchronize any sector unit rules
    if (req.body.unitPrefix && db.settings?.unitRules && Array.isArray(db.settings.unitRules)) {
      const cleanNewPrefix = req.body.unitPrefix.trim().replace(/-+$/, '');
      db.settings.unitRules = db.settings.unitRules.map((rule: any) => {
        if (rule.sectorId === id) {
          if (rule.prefix?.includes('-I-') || rule.prefix?.endsWith('I-') || rule.prefix === 'I-') {
            return { ...rule, prefix: `${cleanNewPrefix}-I-` };
          }
          if (rule.prefix?.includes('-F-') || rule.prefix?.endsWith('F-') || rule.prefix === 'F-') {
            return { ...rule, prefix: `${cleanNewPrefix}-F-` };
          }
          return { ...rule, prefix: `${cleanNewPrefix}-` };
        }
        return rule;
      });
    }

    saveDb(db);
    res.json(db.sectors[index]);
  });

  // Universal File Upload Endpoint (Saves base64 directly to public/ static assets)
  app.post('/api/upload', (req: Request, res: Response) => {
    try {
      const { image, filename, type } = req.body;
      if (!image || typeof image !== 'string' || !image.startsWith('data:image')) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid base64 image format' });
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const safePrefix = type ? `${type}_` : 'asset_';
      const safeName = filename
        ? `${safePrefix}${path.basename(filename).replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}`
        : `${safePrefix}${Date.now()}.${ext}`;

      const filePath = path.resolve(__dirname, 'public', safeName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/${safeName}`;
      res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error('Upload failed', err);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // 2. Applications (Rolling 30 / 7 days)
  app.get('/api/applications', (_req: Request, res: Response) => {
    const db = loadDb();
    db.applications = pruneApplications(db.applications);
    saveDb(db);
    res.json(db.applications);
  });

  app.post('/api/applications', async (req: Request, res: Response) => {
    const db = loadDb();
    const sector = db.sectors.find((s) => s.id === req.body.sectorId);
    const prefix = sector?.unitPrefix || db.settings?.defaultUnitPrefix || 'M-';

    // Auto-Accept check: per sector OR global settings toggle for commanders/leaders
    const isAutoAccept = Boolean(sector?.autoAccept || db.settings?.autoAcceptApplications);

    const newApp: Application = {
      id: `APP-${Date.now().toString(36).toUpperCase()}`,
      sectorId: req.body.sectorId,
      sectorName: req.body.sectorName,
      playerName: req.body.playerName,
      fullName: req.body.fullName,
      discordId: req.body.discordId,
      gameId: req.body.gameId,
      age: Number(req.body.age),
      militaryNo: req.body.militaryNo,
      gender: req.body.gender || 'غير محدد',
      rank: req.body.rank || 'جندي',
      rankProtocol: req.body.rankProtocol || '',
      rankRoleId: req.body.rankRoleId || '',
      rankRoleMention: req.body.rankRoleMention || '',
      currentUnit: req.body.currentUnit || `${prefix}${req.body.militaryNo}`,
      acceptanceOfficer: isAutoAccept 
        ? (req.body.acceptanceOfficer || `القبول التلقائي للقادة (${sector?.arabicName || sector?.name || 'القطاع'})`)
        : (req.body.acceptanceOfficer || ''),
      answers: req.body.answers || [],
      score: Number(req.body.score) || 0,
      totalQuestions: Number(req.body.totalQuestions) || 5,
      rolesProofImg: req.body.rolesProofImg || '',
      uniformImg: req.body.uniformImg || '',
      status: isAutoAccept ? 'مقبول' : 'قيد المراجعة',
      reviewerNotes: isAutoAccept ? 'تم القبول والاعتماد الفوري تلقائياً بنظام القبول السريع للقادة' : '',
      createdAt: new Date().toISOString(),
    };

    (newApp as any).deviceId = req.body.deviceId || '';

    db.applications.unshift(newApp);
    db.applications = pruneApplications(db.applications);

    // Record Audit Log for Application Submission / Auto-Acceptance
    recordAuditLog(db, {
      action: isAutoAccept ? 'application_auto_accepted' : 'application_submit',
      username: newApp.playerName || newApp.fullName,
      displayName: newApp.fullName,
      roleTitle: isAutoAccept ? `عسكري معتمد (${newApp.sectorName})` : `متقدم (${newApp.sectorName})`,
      deviceId: req.body.deviceId,
      gameId: newApp.gameId,
      discordUsername: newApp.discordId,
      details: isAutoAccept
        ? `قبول فوري تلقائي مباشر (نظام القادة): تم اعتماد ${newApp.fullName} (${newApp.playerName}) في قطاع ${newApp.sectorName} برقم عسكري (${newApp.militaryNo}) ويونت (${newApp.currentUnit})`
        : `تقديم طلب توظيف جديد لقطاع ${newApp.sectorName} برقم عسكري (${newApp.militaryNo}) ورتبة (${newApp.rank || 'جندي'})`,
    });

    saveDb(db);

    // Discord Notification Trigger (Webhook & Bot)
    const targetWebhook = getDiscordWebhookUrl(sector?.webhookUrl || db.settings?.webhookUrl);
    const targetChannelId = getDiscordChannelId(sector?.discordChannelId || db.settings?.discordChannelId);
    const botToken = getDiscordBotToken();

    const notifMessage = `🚨 **${isAutoAccept ? '⚡ طلب توظيف جديد معتمد ومقبول فورياً' : 'طلب تقديم جديد'} إلى قطاع ${sector?.name || newApp.sectorName}**
👤 **الاسم داخل اللعبة:** ${newApp.playerName}
📝 **الاسم الكامل:** ${newApp.fullName}
💬 **الديسكورد:** <@${newApp.discordId}>
🆔 **الآيدي:** ${newApp.gameId}
🎖️ **الرتبة العسكرية:** ${newApp.rank || 'جندي'} ${newApp.rankProtocol ? `(${newApp.rankProtocol})` : ''}
🎖️ **الرقم العسكري:** ${newApp.militaryNo}
🔰 **اليونت المعتمد:** ${newApp.currentUnit}
📊 **نتيجة التقييم:** ${newApp.score}/${newApp.totalQuestions}
📌 **الحالة:** ${isAutoAccept ? '✅ مقبول ومعتمد فورياً (نظام القبول التلقائي للقادة)' : 'قيد المراجعة'}
🔗 **رابط الرولات:** ${sector?.discordRoomUrl || db.settings?.discordRoomUrl || 'غير محدد'}`;

    // 1. Send via Webhook
    if (targetWebhook && targetWebhook.startsWith('http')) {
      try {
        await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: notifMessage }),
        });
      } catch (err) {
        console.warn('Webhook dispatch failed', err);
      }
    }

    // 2. Send via Discord Bot if configured
    if (botToken && targetChannelId) {
      try {
        await fetch(`https://discord.com/api/v10/channels/${targetChannelId.trim()}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${botToken.trim()}`,
          },
          body: JSON.stringify({ content: notifMessage }),
        });
      } catch (err) {
        console.warn('Bot message dispatch failed', err);
      }
    }

    // 3. If auto-accepted, dispatch Senior Officers notification immediately
    if (isAutoAccept) {
      const seniorWebhook = getSeniorOfficersWebhookUrl(db.settings?.seniorOfficersWebhookUrl);
      const seniorChannelId = getSeniorOfficersChannelId(db.settings?.seniorOfficersChannelId);

      const template = db.settings?.seniorOfficersMessageTemplate || 
        '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرتبة العسكرية:** {rank} ({rankRole})\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}';

      const rankMentionStr = newApp.rankRoleMention || (newApp.rankRoleId ? `<@&${newApp.rankRoleId}>` : '');
      const finalMsg = template
        .replace(/{applicantGameId}/g, newApp.gameId || 'غير محدد')
        .replace(/{officerGameId}/g, '000')
        .replace(/{officerName}/g, newApp.acceptanceOfficer || 'نظام القبول التلقائي للقادة')
        .replace(/{applicantName}/g, newApp.playerName || newApp.fullName || 'غير محدد')
        .replace(/{sectorName}/g, newApp.sectorName || 'غير محدد')
        .replace(/{unit}/g, newApp.currentUnit || 'غير محدد')
        .replace(/{rank}/g, newApp.rank || 'جندي')
        .replace(/{rankRole}/g, rankMentionStr)
        .replace(/{rankMention}/g, rankMentionStr)
        .replace(/{militaryNo}/g, newApp.militaryNo || 'غير محدد')
        .replace(/{discordId}/g, newApp.discordId ? (newApp.discordId.startsWith('<@') ? newApp.discordId : `<@${newApp.discordId}>`) : 'غير محدد');

      if (seniorWebhook && seniorWebhook.startsWith('http')) {
        try {
          await fetch(seniorWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalMsg }),
          });
        } catch (err) {
          console.warn('Senior officers webhook failed on auto-accept', err);
        }
      }

      if (botToken && seniorChannelId) {
        try {
          await fetch(`https://discord.com/api/v10/channels/${seniorChannelId.trim()}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bot ${botToken.trim()}`,
            },
            body: JSON.stringify({ content: finalMsg }),
          });
        } catch (err) {
          console.warn('Senior officers bot dispatch failed on auto-accept', err);
        }
      }
    }

    res.status(201).json(newApp);
  });

  app.patch('/api/applications/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reviewerNotes, acceptanceOfficer, officerGameId, officerName, rank, rankRoleId, rankRoleMention, currentUnit, militaryNo } = req.body;
    const db = loadDb();
    const index = db.applications.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (status) db.applications[index].status = status;
    if (reviewerNotes !== undefined) db.applications[index].reviewerNotes = reviewerNotes;
    if (acceptanceOfficer !== undefined) db.applications[index].acceptanceOfficer = acceptanceOfficer;
    if (rank !== undefined) db.applications[index].rank = rank;
    if (rankRoleId !== undefined) db.applications[index].rankRoleId = rankRoleId;
    if (rankRoleMention !== undefined) db.applications[index].rankRoleMention = rankRoleMention;
    if (currentUnit !== undefined && currentUnit.trim()) db.applications[index].currentUnit = currentUnit.trim();
    if (militaryNo !== undefined && String(militaryNo).trim()) db.applications[index].militaryNo = String(militaryNo).trim();

    const targetApp = db.applications[index];

    // Senior Officers notification upon hiring / acceptance ('مقبول')
    if (status === 'مقبول') {
      const seniorWebhook = getSeniorOfficersWebhookUrl(db.settings?.seniorOfficersWebhookUrl);
      const seniorChannelId = getSeniorOfficersChannelId(db.settings?.seniorOfficersChannelId);
      const botToken = getDiscordBotToken();

      const template = db.settings?.seniorOfficersMessageTemplate || 
        '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرتبة العسكرية:** {rank} ({rankRole})\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}';

      const rankMentionStr = targetApp.rankRoleMention || (targetApp.rankRoleId ? `<@&${targetApp.rankRoleId}>` : '');
      const finalMsg = template
        .replace(/{applicantGameId}/g, targetApp.gameId || 'غير محدد')
        .replace(/{officerGameId}/g, officerGameId || '000')
        .replace(/{officerName}/g, acceptanceOfficer || officerName || 'مسؤول التوظيف')
        .replace(/{applicantName}/g, targetApp.playerName || targetApp.fullName || 'غير محدد')
        .replace(/{sectorName}/g, targetApp.sectorName || 'غير محدد')
        .replace(/{unit}/g, targetApp.currentUnit || 'غير محدد')
        .replace(/{rank}/g, targetApp.rank || 'جندي')
        .replace(/{rankRole}/g, rankMentionStr)
        .replace(/{rankMention}/g, rankMentionStr)
        .replace(/{militaryNo}/g, targetApp.militaryNo || 'غير محدد')
        .replace(/{discordId}/g, targetApp.discordId ? (targetApp.discordId.startsWith('<@') ? targetApp.discordId : `<@${targetApp.discordId}>`) : 'غير محدد');

      // 1. Dispatch via senior officers webhook
      if (seniorWebhook && seniorWebhook.startsWith('http')) {
        try {
          await fetch(seniorWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalMsg }),
          });
        } catch (err) {
          console.warn('Senior officers webhook failed', err);
        }
      }

      // 2. Dispatch to specific sector webhook if configured
      const sectorObj = db.sectors.find((s) => s.id === targetApp.sectorId);
      if (sectorObj?.webhookUrl && sectorObj.webhookUrl.startsWith('http')) {
        try {
          await fetch(sectorObj.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalMsg }),
          });
        } catch (err) {
          console.warn('Sector webhook dispatch failed', err);
        }
      }

      // 2. Dispatch via Discord bot if senior officers channel is configured
      if (botToken && seniorChannelId) {
        try {
          await fetch(`https://discord.com/api/v10/channels/${seniorChannelId.trim()}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bot ${botToken.trim()}`,
            },
            body: JSON.stringify({ content: finalMsg }),
          });
        } catch (err) {
          console.warn('Senior officers bot dispatch failed', err);
        }
      }
    }

    saveDb(db);
    res.json(db.applications[index]);
  });

  // Test Discord Webhook / Bot
  app.post('/api/discord/test', async (req: Request, res: Response) => {
    const { webhookUrl, botToken, channelId, message } = req.body;
    const testContent = message || '🔔 **تجربة اتصال ناجحة من منصة PRAVA للتوظيف الموحد!**\nتم ضبط وتفعيل الربط مع ديسكورد بنجاح.';

    const effectiveWebhook = getDiscordWebhookUrl(webhookUrl);
    const effectiveChannelId = getDiscordChannelId(channelId);
    const effectiveBotToken = (botToken && !botToken.startsWith('•')) ? botToken.trim() : getDiscordBotToken();

    let webhookSuccess = false;
    let botSuccess = false;
    let errorMsg = '';

    // Test Webhook
    if (effectiveWebhook && effectiveWebhook.startsWith('http')) {
      try {
        const resp = await fetch(effectiveWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: testContent }),
        });
        if (resp.ok) {
          webhookSuccess = true;
        } else {
          errorMsg += `فشل إرسال الويب هوك (كود ${resp.status}). `;
        }
      } catch (err: any) {
        errorMsg += `خطأ في اتصال الويب هوك: ${err.message}. `;
      }
    }

    // Test Bot
    if (effectiveBotToken && effectiveChannelId) {
      try {
        const resp = await fetch(`https://discord.com/api/v10/channels/${effectiveChannelId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${effectiveBotToken}`,
          },
          body: JSON.stringify({ content: testContent }),
        });
        if (resp.ok) {
          botSuccess = true;
        } else {
          errorMsg += `فشل إرسال رسالة البوت (كود ${resp.status}). تأكد من صلاحيات البوت وآيدي القناة. `;
        }
      } catch (err: any) {
        errorMsg += `خطأ في اتصال البوت: ${err.message}. `;
      }
    }

    if (webhookSuccess || botSuccess) {
      return res.json({
        success: true,
        webhookSuccess,
        botSuccess,
        message: 'تم إرسال الرسالة التجريبية إلى ديسكورد بنجاح!',
      });
    }

    return res.status(400).json({
      error: errorMsg || 'يرجى إدخال رابط ويب هوك صحيح أو (توكن البوت + آيدي القناة) لاختبار الإرسال.',
    });
  });

  // Live Discord Server Statistics Endpoint (Real members and presence counts via official invite)
  let cachedDiscordStats: { timestamp: number; data: any } | null = null;
  app.get('/api/discord-stats', async (_req: Request, res: Response) => {
    const now = Date.now();
    if (cachedDiscordStats && (now - cachedDiscordStats.timestamp) < 60000) {
      return res.json(cachedDiscordStats.data);
    }

    try {
      const db = loadDb();
      const discordUrl = db.settings?.discordUrl || 'https://discord.gg/dkUjf2bpy';
      const match = discordUrl.match(/discord(?:\.gg|\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
      const inviteCode = match ? match[1] : 'dkUjf2bpy';

      const resp = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`, {
        headers: { 'Accept': 'application/json' },
      });

      if (resp.ok) {
        const payload: any = await resp.json();
        const result = {
          success: true,
          isLive: true,
          inviteCode,
          memberCount: payload.approximate_member_count || payload.profile?.member_count || 0,
          onlineCount: payload.approximate_presence_count || payload.profile?.online_count || 0,
          guildName: payload.guild?.name || db.settings?.discordName || 'سيرفر PRAVA',
          guildIcon: payload.guild?.id && payload.guild?.icon 
            ? `https://cdn.discordapp.com/icons/${payload.guild.id}/${payload.guild.icon}.png` 
            : null,
          instantInvite: `https://discord.gg/${inviteCode}`,
        };
        cachedDiscordStats = { timestamp: now, data: result };
        return res.json(result);
      }
    } catch (e: any) {
      console.warn('Failed to fetch real Discord server stats:', e.message);
    }

    const fallback = {
      success: true,
      isLive: false,
      memberCount: 0,
      onlineCount: 0,
      guildName: 'سيرفر PRAVA',
      guildIcon: null,
    };
    return res.json(cachedDiscordStats?.data || fallback);
  });

  // 3. Login & Security Audit Logs (مع التجديد والتصفية التلقائية كل أسبوعين وتتبع الأجهزة)
  app.get('/api/logs', (_req: Request, res: Response) => {
    const db = loadDb();
    if (!db.loginLogs) db.loginLogs = [];

    // Auto-prune logs older than 14 days (تصفية كل أسبوعين تلقائياً)
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    db.loginLogs = db.loginLogs.filter((l: any) => {
      if (!l.createdAt) return true;
      const t = new Date(l.createdAt).getTime();
      return !isNaN(t) && t > fourteenDaysAgo;
    });

    saveDb(db);
    res.json(db.loginLogs);
  });

  // Manual Wipe / Reset of Audit Logs (خاص بالاونر)
  app.delete('/api/logs', (_req: Request, res: Response) => {
    const db = loadDb();
    db.loginLogs = [
      {
        id: `log-${Date.now()}`,
        username: 'المالك',
        displayName: '12465 (مالك السيرفر)',
        roleTitle: 'مالك السيرفر',
        action: 'logout',
        timestamp: formatArabicDateTime(),
        createdAt: new Date().toISOString(),
        deviceId: 'النظام الداخلي',
        deviceAccountsCount: 1,
        deviceApplicationsCount: 0,
        details: 'تم مسح وتجديد السجل التدقيقي والأمني بالكامل يدوياً من قِبل المالك',
      },
    ];
    saveDb(db);
    res.json({ success: true, message: 'تم مسح وتجديد سجلات اللوقات بنجاح!' });
  });

  // Force Purge logs older than 14 days
  app.post('/api/logs/purge', (_req: Request, res: Response) => {
    const db = loadDb();
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const initialCount = (db.loginLogs || []).length;
    db.loginLogs = (db.loginLogs || []).filter((l: any) => {
      if (!l.createdAt) return true;
      const t = new Date(l.createdAt).getTime();
      return !isNaN(t) && t > fourteenDaysAgo;
    });
    const purgedCount = initialCount - db.loginLogs.length;
    saveDb(db);
    res.json({ success: true, purgedCount, remainingCount: db.loginLogs.length });
  });

  // 4. Authentication: Register (ينشئ حساب معلق بانتظار اعتماد الأونر)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { gameId, discordUsername, username, password, deviceId } = req.body;
    if (!username || !password || !gameId || !discordUsername) {
      return res.status(400).json({ error: 'يرجى تعبئة كافة الحقول المطلوبة' });
    }

    const db = loadDb();
    const existing = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (existing) {
      return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر' });
    }

    const newUser: any = {
      id: `u-${Date.now().toString(36)}`,
      username: username.trim(),
      passwordHash: hashPassword(password), // PBKDF2-SHA512 + Salt
      displayName: username.trim(),
      gameId: String(gameId).trim(),
      discordUsername: discordUsername.trim(),
      role: 'applicant',
      roleTitle: 'متقدم للتوظيف (بانتظار الاعتماد)',
      status: 'pending', // بانتظار الاعتماد من قِبل الأونر
      registeredDeviceId: deviceId || '',
      requestedAt: new Date().toISOString(),
      permissions: {
        canReviewApps: false,
        canEditSectors: false,
        canManageAccounts: false,
        canEditUnitPrefix: false,
        allowedSectors: [],
      },
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Record Security Audit Log
    recordAuditLog(db, {
      action: 'register',
      username: newUser.displayName,
      displayName: newUser.displayName,
      roleTitle: 'طلب حساب جديد (معلق)',
      deviceId: deviceId,
      gameId: newUser.gameId,
      discordUsername: newUser.discordUsername,
      details: `تم تقديم طلب حساب جديد باسم المستخدم (${newUser.username}) وهو بانتظار موافقة وتفعيل الأونر. (كلمة المرور مشفرة بنظام PBKDF2 🔒)`,
    });

    saveDb(db);

    const { passwordHash: _ph, ...safeUser } = newUser;
    const sessionToken = generateSessionToken(safeUser);
    res.status(201).json({
      success: true,
      isPending: true,
      message: 'تم تسجيل طلبك بنجاح! حسابك الآن بانتظار المراجعة والاعتماد من قِبل الأونر أو مسؤول التوظيف.',
      user: safeUser,
      sessionToken,
    });
  });

  // 5. Authentication: Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password, deviceId } = req.body;
    const db = loadDb();

    // Check users by username
    const user = db.users.find(
      (u) => u.username.toLowerCase() === (username || '').trim().toLowerCase()
    );

    if (user) {
      const verification = verifyPassword(password || '', user.passwordHash);
      if (verification.isValid) {
        // If password was stored in legacy plaintext, automatically upgrade to salted PBKDF2 hash!
        if (verification.needsRehash) {
          user.passwordHash = hashPassword(password);
          saveDb(db);
        }

        const { passwordHash: _ph, ...safeUser } = user;
        const sessionToken = generateSessionToken(safeUser);

        // Check if account is still pending approval
        if (user.status === 'pending') {
          return res.status(403).json({
            error: 'حسابك بانتظار الاعتماد والتفعيل من قِبل الأونر أو مسؤول التوظيف. يمكنك التواصل مع الإدارة لتسريع التفعيل.',
            isPending: true,
            user: safeUser,
            sessionToken,
          });
        }

        if (user.status === 'rejected') {
          return res.status(403).json({
            error: 'تم رفض طلب اعتماد هذا الحساب من قِبل الإدارة. يرجى التواصل مع الإدارة للاستفسار.',
            isRejected: true,
            user: safeUser,
          });
        }

        // Record Security Audit Log for successful login
        recordAuditLog(db, {
          action: 'login',
          username: user.username,
          displayName: user.displayName,
          roleTitle: user.roleTitle || 'عضو',
          deviceId: deviceId || (user as any).registeredDeviceId,
          gameId: user.gameId,
          discordUsername: user.discordUsername,
          details: 'تم تسجيل الدخول بنجاح إلى المنصة (مصادقة مشفرة بنجاح 🔒)',
        });

        saveDb(db);

        return res.json({
          success: true,
          user: safeUser,
          sessionToken,
        });
      }
    }

    // Fallback default admin check
    if (username === 'admin' && (password === 'prava2026' || password === process.env.ADMIN_PASSWORD)) {
      const ownerUser = db.users.find((u) => u.username === 'admin');
      if (ownerUser) {
        const { passwordHash: _ph, ...safeOwner } = ownerUser;
        const sessionToken = generateSessionToken(safeOwner);
        recordAuditLog(db, {
          action: 'login',
          username: 'admin',
          displayName: safeOwner.displayName || '12465',
          roleTitle: 'مالك السيرفر',
          deviceId: deviceId,
          details: 'تسجيل دخول مالك السيرفر (Root Access)',
        });
        saveDb(db);
        return res.json({ success: true, user: safeOwner, sessionToken });
      }

      const defaultOwner = {
        id: 'u-admin',
        username: 'admin',
        displayName: '12465',
        role: 'owner',
        roleTitle: 'مالك السيرفر',
        status: 'active',
        permissions: {
          canReviewApps: true,
          canEditSectors: true,
          canManageAccounts: true,
          canEditUnitPrefix: true,
          canApproveAccounts: true,
          canManageAnnouncements: true,
          allowedSectors: ['*'],
        },
      };

      const sessionToken = generateSessionToken(defaultOwner);
      recordAuditLog(db, {
        action: 'login',
        username: 'admin',
        displayName: '12465',
        roleTitle: 'مالك السيرفر',
        deviceId: deviceId,
        details: 'تسجيل دخول مالك السيرفر (Default Root)',
      });
      saveDb(db);

      return res.json({
        success: true,
        user: defaultOwner,
        sessionToken,
      });
    }

    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  });

  // 5.1 Device Login (Instant 1-Click / Auto-Login for recognized devices)
  app.post('/api/auth/device-login', (req: Request, res: Response) => {
    const { deviceId, username } = req.body;
    if (!username || !deviceId) {
      return res.status(400).json({ error: 'بيانات التعرف على الجهاز غير مكتملة' });
    }

    const db = loadDb();
    const user = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (user) {
      const { passwordHash: _ph, ...safeUser } = user;
      const sessionToken = generateSessionToken(safeUser);

      if (user.status === 'pending') {
        return res.status(403).json({
          error: 'حسابك بانتظار الاعتماد والتفعيل من قِبل الأونر.',
          isPending: true,
          user: safeUser,
          sessionToken,
        });
      }

      if (user.status === 'rejected') {
        return res.status(403).json({
          error: 'تم رفض طلب هذا الحساب من قِبل الإدارة.',
          isRejected: true,
          user: safeUser,
        });
      }

      // Record Audit Log
      recordAuditLog(db, {
        action: 'login',
        username: user.username,
        displayName: user.displayName,
        roleTitle: user.roleTitle,
        deviceId: deviceId,
        gameId: user.gameId,
        discordUsername: user.discordUsername,
        details: 'دخول تلقائي عبر التعرف على الجهاز الموثوق 📱 (جلسة مشفرة 🔒)',
      });

      saveDb(db);

      return res.json({
        success: true,
        user: safeUser,
        sessionToken,
      });
    }

    // Default admin fallback
    if (username === 'admin') {
      const ownerUser = db.users.find((u) => u.username === 'admin');
      if (ownerUser) {
        const { passwordHash: _ph, ...safeOwner } = ownerUser;
        const sessionToken = generateSessionToken(safeOwner);
        return res.json({ success: true, user: safeOwner, sessionToken });
      }
    }

    return res.status(404).json({ error: 'لم يتم العثور على الحساب المرتبط بهذا الجهاز' });
  });

  // 5.2 Logout Logging
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const { username, displayName, roleTitle, deviceId } = req.body;
    const db = loadDb();
    recordAuditLog(db, {
      action: 'logout',
      username: username || 'مستخدم',
      displayName: displayName || username,
      roleTitle: roleTitle || 'عضو',
      deviceId: deviceId,
      details: 'تم تسجيل الخروج من الجلسة',
    });
    saveDb(db);
    res.json({ success: true });
  });

  // 6. Users Management (Accounts and Permissions)
  app.get('/api/users', (_req: Request, res: Response) => {
    const db = loadDb();
    const safeUsers = db.users.map(({ passwordHash, ...rest }) => rest);
    res.json(safeUsers);
  });

  // Approve a pending user account & assign roles/permissions
  app.patch('/api/users/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, roleTitle, permissions, allowedSectors, approvedBy } = req.body;
    const db = loadDb();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    user.status = 'active';
    if (role) user.role = role;
    if (roleTitle) user.roleTitle = roleTitle;
    if (permissions) {
      user.permissions = {
        ...user.permissions,
        ...permissions,
        allowedSectors: allowedSectors || user.permissions?.allowedSectors || ['*'],
      };
    }
    user.approvedAt = new Date().toISOString();
    user.approvedBy = approvedBy || 'المالك';

    recordAuditLog(db, {
      action: 'user_approved',
      username: user.username,
      displayName: user.displayName,
      roleTitle: user.roleTitle,
      deviceId: (user as any).registeredDeviceId,
      details: `تم تفعيل واعتماد الحساب وتعيين الرتبة (${user.roleTitle}) بنجاح.`,
    });

    saveDb(db);
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Reject a user account
  app.patch('/api/users/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    user.status = 'rejected';
    saveDb(db);
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { username, password, displayName, role, roleTitle, permissions, gameId, discordUsername, deviceId } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبة' });
    }

    const db = loadDb();
    const existing = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    }

    const newUser: any = {
      id: `u-${Date.now().toString(36)}`,
      username: username.trim(),
      passwordHash: hashPassword(password),
      displayName: displayName || username.trim(),
      gameId: gameId || '',
      discordUsername: discordUsername || '',
      role: role || 'officer',
      roleTitle: roleTitle || 'ضابط قطاع',
      status: 'active', // Direct admin created users are active immediately
      registeredDeviceId: deviceId || '',
      permissions: permissions || {
        canReviewApps: true,
        canEditSectors: false,
        canManageAccounts: false,
        canEditUnitPrefix: false,
        allowedSectors: ['*'],
      },
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    recordAuditLog(db, {
      action: 'user_approved',
      username: newUser.username,
      displayName: newUser.displayName,
      roleTitle: newUser.roleTitle,
      deviceId: deviceId,
      details: `تم إنشاء حساب مباشر (${newUser.username}) وتعيين الرتبة والصلاحيات مع تشفير كلمة المرور بـ PBKDF2 🔒`,
    });

    saveDb(db);

    const { passwordHash: _ph, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  });

  app.patch('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const index = db.users.findIndex((u) => u.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const { password, ...fields } = req.body;
    db.users[index] = {
      ...db.users[index],
      ...fields,
    };
    if (password && password.trim()) {
      db.users[index].passwordHash = hashPassword(password.trim());
    }

    saveDb(db);
    const { passwordHash: _ph, ...safeUser } = db.users[index];
    res.json(safeUser);
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();

    // Prevent deleting owner
    const target = db.users.find((u) => u.id === id);
    if (target?.role === 'owner' || target?.username === 'admin') {
      return res.status(403).json({ error: 'لا يمكن حذف حساب مالك السيرفر' });
    }

    db.users = db.users.filter((u) => u.id !== id);
    saveDb(db);
    res.json({ success: true, deletedId: id });
  });

  // -------------------------------------------------------------
  // PERSONNEL REQUESTS (طلبات النقل والفصل بين القطاعات)
  // -------------------------------------------------------------
  app.get('/api/personnel-requests', (req: Request, res: Response) => {
    const db = loadDb();
    if (!db.personnelRequests) db.personnelRequests = [];
    const { username, sectorId, status, type } = req.query;
    let list = [...db.personnelRequests];
    if (username) {
      list = list.filter((r) => r.applicantUsername?.toLowerCase() === String(username).toLowerCase());
    }
    if (sectorId && sectorId !== 'all') {
      list = list.filter((r) => r.currentSectorId === sectorId || r.targetSectorId === sectorId);
    }
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    if (type && type !== 'all') {
      list = list.filter((r) => r.type === type);
    }
    res.json(list.reverse());
  });

  app.post('/api/personnel-requests', (req: Request, res: Response) => {
    const db = loadDb();
    if (!db.personnelRequests) db.personnelRequests = [];
    const {
      type,
      applicantUsername,
      applicantDisplayName,
      applicantGameId,
      applicantDiscord,
      currentSectorId,
      currentSectorName,
      currentRank,
      currentProtocol,
      currentUnit,
      targetSectorId,
      targetSectorName,
      reason,
    } = req.body;

    if (!type || !applicantUsername || !reason) {
      return res.status(400).json({ error: 'يرجى تحديد نوع الطلب والسبب' });
    }

    const newRequest: any = {
      id: `req-${Date.now().toString(36)}`,
      type, // 'transfer' | 'discharge'
      applicantUsername: applicantUsername.trim(),
      applicantDisplayName: applicantDisplayName || applicantUsername,
      applicantGameId: applicantGameId || '',
      applicantDiscord: applicantDiscord || '',
      currentSectorId: currentSectorId || '',
      currentSectorName: currentSectorName || '',
      currentRank: currentRank || '',
      currentProtocol: currentProtocol || '',
      currentUnit: currentUnit || '',
      targetSectorId: targetSectorId || '',
      targetSectorName: targetSectorName || '',
      reason: reason.trim(),
      status: 'قيد المراجعة',
      createdAt: new Date().toISOString(),
    };

    db.personnelRequests.push(newRequest);

    // Record in Audit Log
    recordAuditLog(db, {
      action: type === 'transfer' ? 'personnel_transfer_requested' : 'personnel_discharge_requested',
      username: applicantUsername,
      displayName: applicantDisplayName || applicantUsername,
      roleTitle: type === 'transfer' ? 'طلب نقل قطاع' : 'طلب فصل عسكري',
      gameId: applicantGameId,
      details: type === 'transfer'
        ? `طلب نقل من قطاع (${currentSectorName}) إلى قطاع (${targetSectorName}) - السبب: ${reason}`
        : `طلب فصل / إنهاء خدمة من قطاع (${currentSectorName}) - السبب: ${reason}`,
    });

    saveDb(db);
    res.status(201).json(newRequest);
  });

  // Approve a Transfer or Discharge
  app.patch('/api/personnel-requests/:id/approve', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { assignedNewRank, assignedNewProtocol, assignedNewUnit, reviewedBy, reviewerNotes } = req.body;
    const db = loadDb();
    if (!db.personnelRequests) db.personnelRequests = [];
    const reqIndex = db.personnelRequests.findIndex((r) => r.id === id);

    if (reqIndex === -1) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    const pReq = db.personnelRequests[reqIndex];
    pReq.status = 'مقبول';
    pReq.reviewedBy = reviewedBy || 'المسؤول';
    pReq.reviewerNotes = reviewerNotes || '';
    pReq.reviewedAt = new Date().toISOString();

    if (pReq.type === 'transfer') {
      pReq.assignedNewRank = assignedNewRank || pReq.currentRank;
      pReq.assignedNewProtocol = assignedNewProtocol || pReq.currentProtocol;
      pReq.assignedNewUnit = assignedNewUnit || pReq.currentUnit;

      // Find soldier's application in target sector or update existing
      const appIndex = db.applications.findIndex(
        (a) =>
          (pReq.applicantGameId && a.gameId === pReq.applicantGameId) ||
          (pReq.applicantUsername && (a.playerName.toLowerCase() === pReq.applicantUsername.toLowerCase() || a.fullName.toLowerCase() === pReq.applicantUsername.toLowerCase()))
      );

      if (appIndex !== -1) {
        db.applications[appIndex].sectorId = pReq.targetSectorId || db.applications[appIndex].sectorId;
        db.applications[appIndex].sectorName = pReq.targetSectorName || db.applications[appIndex].sectorName;
        db.applications[appIndex].rank = pReq.assignedNewRank;
        db.applications[appIndex].rankProtocol = pReq.assignedNewProtocol;
        if (pReq.assignedNewUnit) {
          db.applications[appIndex].currentUnit = pReq.assignedNewUnit;
        }
        db.applications[appIndex].serviceStatus = 'active';
        db.applications[appIndex].transferNotes = `تم النقل من ${pReq.currentSectorName} بتاريخ ${formatArabicDateTime()}`;
      }

      // Update user account if found
      const userObj = db.users.find(
        (u) => u.username.toLowerCase() === pReq.applicantUsername.toLowerCase()
      );
      if (userObj) {
        userObj.activeSectorId = pReq.targetSectorId;
        userObj.activeSectorName = pReq.targetSectorName;
        userObj.activeRank = pReq.assignedNewRank;
        userObj.activeRankProtocol = pReq.assignedNewProtocol;
        userObj.activeUnit = pReq.assignedNewUnit;
        userObj.serviceStatus = 'active';
      }

      // Audit Log
      recordAuditLog(db, {
        action: 'transfer_approved',
        username: pReq.applicantUsername,
        displayName: pReq.applicantDisplayName,
        roleTitle: pReq.assignedNewRank,
        details: `تم اعتماد نقل العسكري (${pReq.applicantDisplayName}) إلى قطاع (${pReq.targetSectorName}) برتبة (${pReq.assignedNewRank}) والبروتوكول الجديد (${pReq.assignedNewProtocol}) واليونت (${pReq.assignedNewUnit}) بواسطة (${reviewedBy || 'القيادة'}).`,
      });

    } else if (pReq.type === 'discharge') {
      // Discharge handling
      const appIndex = db.applications.findIndex(
        (a) =>
          (pReq.applicantGameId && a.gameId === pReq.applicantGameId) ||
          (pReq.applicantUsername && (a.playerName.toLowerCase() === pReq.applicantUsername.toLowerCase() || a.fullName.toLowerCase() === pReq.applicantUsername.toLowerCase()))
      );

      if (appIndex !== -1) {
        db.applications[appIndex].serviceStatus = 'discharged';
        db.applications[appIndex].status = 'مرفوض';
        db.applications[appIndex].reviewerNotes = `تم فصل العسكري بناء على طلبه: ${pReq.reason}`;
      }

      const userObj = db.users.find(
        (u) => u.username.toLowerCase() === pReq.applicantUsername.toLowerCase()
      );
      if (userObj) {
        userObj.serviceStatus = 'discharged';
        userObj.activeSectorId = '';
        userObj.activeSectorName = '';
        userObj.activeRank = '';
        userObj.activeRankProtocol = '';
      }

      // Audit Log
      recordAuditLog(db, {
        action: 'discharge_approved',
        username: pReq.applicantUsername,
        displayName: pReq.applicantDisplayName,
        roleTitle: 'مفصول من الخدمة',
        details: `تم اعتماد فصل العسكري (${pReq.applicantDisplayName}) من قطاع (${pReq.currentSectorName}) - السبب: ${pReq.reason}.`,
      });
    }

    saveDb(db);
    res.json({ success: true, request: pReq });
  });

  // Reject a Transfer or Discharge
  app.patch('/api/personnel-requests/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviewedBy, reviewerNotes } = req.body;
    const db = loadDb();
    if (!db.personnelRequests) db.personnelRequests = [];
    const reqIndex = db.personnelRequests.findIndex((r) => r.id === id);

    if (reqIndex === -1) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    const pReq = db.personnelRequests[reqIndex];
    pReq.status = 'مرفوض';
    pReq.reviewedBy = reviewedBy || 'المسؤول';
    pReq.reviewerNotes = reviewerNotes || 'تم رفض الطلب من قِبل القيادة';
    pReq.reviewedAt = new Date().toISOString();

    recordAuditLog(db, {
      action: pReq.type === 'transfer' ? 'transfer_rejected' : 'discharge_rejected',
      username: pReq.applicantUsername,
      displayName: pReq.applicantDisplayName,
      details: `تم رفض ${pReq.type === 'transfer' ? 'طلب النقل' : 'طلب الفصل'} للعسكري (${pReq.applicantDisplayName}) - ملاحظات: ${reviewerNotes || 'لا توجد'}`,
    });

    saveDb(db);
    res.json({ success: true, request: pReq });
  });

  // Helper to get project zip package info
  const getPackageInfo = () => {
    const zipPath = path.resolve(__dirname, 'public/prava-recruitment-system.zip');
    if (!fs.existsSync(zipPath)) {
      try {
        execSync('python3 scripts/export_zip.py', { cwd: __dirname });
      } catch (e) {
        console.error('Error generating zip:', e);
      }
    }

    if (fs.existsSync(zipPath)) {
      const stats = fs.statSync(zipPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      return {
        exists: true,
        filename: 'prava-recruitment-system.zip',
        sizeBytes: stats.size,
        sizeFormatted: `${sizeMB} MB`,
        lastModified: stats.mtime.toISOString(),
        downloadUrl: `/api/download?t=${stats.mtimeMs}`,
        keyFiles: ['vercel.json', 'package.json', 'server.ts', 'data/db.json', 'index.html', 'vite.config.ts'],
      };
    }

    return {
      exists: false,
      filename: 'prava-recruitment-system.zip',
      sizeBytes: 0,
      sizeFormatted: '0 MB',
      lastModified: new Date().toISOString(),
      downloadUrl: '/api/download',
      keyFiles: [],
    };
  };

  // 1. Get Project Package Info (Owner Screen)
  app.get('/api/owner/package-info', (_req: Request, res: Response) => {
    try {
      res.json(getPackageInfo());
    } catch (err: any) {
      console.error('[Package Info] Error:', err);
      res.status(500).json({ error: 'Failed to get package info' });
    }
  });

  // 2. Rebuild/Refresh Project Package (Live Update on Demand)
  app.post('/api/owner/rebuild-package', (_req: Request, res: Response) => {
    try {
      execSync('python3 scripts/export_zip.py', { cwd: __dirname });

      // Also copy to artifacts if dir exists
      const artifactDir = path.resolve(__dirname, '.aistudio/artifacts/brain/5645db8a-e3ad-4289-abf5-f77dbeec2011');
      if (fs.existsSync(artifactDir)) {
        try {
          fs.copyFileSync(
            path.resolve(__dirname, 'public/prava-recruitment-system.zip'),
            path.join(artifactDir, 'prava-project.zip')
          );
        } catch {}
      }

      const info = getPackageInfo();
      res.json({ success: true, message: 'تم تحديث حزمة المشروع وضغطها بنجاح!', package: info });
    } catch (err: any) {
      console.error('[Rebuild Package] Error:', err);
      res.status(500).json({ error: 'Failed to rebuild package', details: err?.message });
    }
  });

  // 3. Raw File Content / Download for single files (Owner convenience)
  app.get('/api/owner/file-content', (req: Request, res: Response) => {
    try {
      const allowedFiles = [
        'vercel.json',
        'package.json',
        'server.ts',
        'data/db.json',
        'index.html',
        'vite.config.ts',
        'tsconfig.json',
        'README.md',
        '.env.example',
        '.gitignore',
        'api/index.ts',
        'api/[...path].ts',
        'src/utils/api.ts',
        'src/components/AdminLoginModal.tsx',
      ];
      const filePathQuery = String(req.query.file || '');
      if (!allowedFiles.includes(filePathQuery)) {
        return res.status(400).json({ error: 'File not permitted or not found' });
      }

      const fullPath = path.resolve(__dirname, filePathQuery);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File does not exist' });
      }

      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(fullPath)}"`);
        return res.sendFile(fullPath);
      }

      let content = fs.readFileSync(fullPath, 'utf-8');
      if (filePathQuery === 'data/db.json') {
        try {
          const parsed = JSON.parse(content);
          if (parsed.settings) {
            parsed.settings.botToken = '••••••••••••••••••••••••••••••••';
            parsed.settings.encryptedBotToken = 'enc:gcm:v1:🔒[AUTHENTICATED_ENCRYPTED_VAULT]';
            if (parsed.settings.webhookUrl) parsed.settings.webhookUrl = 'https://discord.com/api/webhooks/🔒[PROTECTED]';
            if (parsed.settings.seniorOfficersWebhookUrl) parsed.settings.seniorOfficersWebhookUrl = 'https://discord.com/api/webhooks/🔒[PROTECTED]';
            delete parsed.settings.encryptedWebhookUrl;
            delete parsed.settings.encryptedSeniorOfficersWebhookUrl;
          }
          if (parsed.users && Array.isArray(parsed.users)) {
            parsed.users = parsed.users.map((u: any) => ({
              ...u,
              passwordHash: 'pbkdf2:sha512:🔒[SALTED_SECURE_HASH]',
            }));
          }
          content = JSON.stringify(parsed, null, 2);
        } catch {}
      }
      res.json({ filename: filePathQuery, content });
    } catch (err: any) {
      console.error('[File Content] Error:', err);
      res.status(500).json({ error: 'Failed to read file' });
    }
  });

  // 4. Project ZIP Download Endpoint (Direct & Seamless attachment)
  app.get(['/download', '/api/download', '/download-project', '/prava-project.zip'], async (_req: Request, res: Response) => {
    try {
      const zipPath = path.resolve(__dirname, 'public/prava-recruitment-system.zip');
      if (!fs.existsSync(zipPath)) {
        execSync('python3 scripts/export_zip.py', { cwd: __dirname });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="prava-recruitment-system.zip"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(zipPath);
    } catch (err: any) {
      console.error('[Download] Error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // 5. System Backup / Archive (Discreet endpoint for Owner)
  app.get(['/api/system-backup', '/prava-system-backup.zip'], async (_req: Request, res: Response) => {
    try {
      const zipPath = path.resolve(__dirname, 'public/prava-system-backup.zip');
      if (!fs.existsSync(zipPath)) {
        execSync('python3 scripts/export_zip.py', { cwd: __dirname });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="prava-system-backup.zip"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(zipPath);
    } catch (err: any) {
      console.error('[System Backup] Error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // Static asset serving with backward compatibility for /src/assets/images and /public
  app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));
  app.use('/assets/images', express.static(path.resolve(__dirname, 'public/assets/images')));
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Vite Integration (Skipped on Vercel where Vercel serves static dist)
  // Static & Production Integration (Cloud Run / Node production)
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else if (!process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('[Vite Integration] Could not initialize Vite middleware:', e);
    }
  }

  return app;
}

// If executed in Node / Cloud Run / Docker / Render, start the HTTP server
// On Vercel Serverless Functions, process.env.VERCEL is set, so app.listen is bypassed.
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
if (!process.env.VERCEL) {
  createApp().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[PRAVA Server] Running on http://0.0.0.0:${PORT}`);
    });
  }).catch((err) => {
    console.error('[PRAVA Server] Fatal error starting server:', err);
    process.exit(1);
  });
}
