import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Ephemeral fallback key generated in memory ONLY for local development if ADMIN_TOKEN_SECRET is omitted.
// Never reused across process restarts. In production, an explicit ADMIN_TOKEN_SECRET is mandatory.
const devEphemeralTokenSecret = crypto.randomBytes(32).toString('hex');

// Helper to compute sha256 hash buffer
function sha256Digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value).digest();
}

/**
 * Checks whether required admin authentication environment variables are configured.
 */
export function isAdminAuthConfigured(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  const hasPassword = Boolean(
    (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()) ||
    (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD_HASH.trim())
  );
  const hasTokenSecret = Boolean(
    process.env.ADMIN_TOKEN_SECRET && process.env.ADMIN_TOKEN_SECRET.trim()
  );

  if (!hasPassword) missing.push('ADMIN_PASSWORD or ADMIN_PASSWORD_HASH');
  if (!hasTokenSecret) missing.push('ADMIN_TOKEN_SECRET');

  return {
    configured: missing.length === 0,
    missing,
  };
}

/**
 * Retrieves the cryptographic secret key used for HMAC session token signing.
 * In production, refuses operation if ADMIN_TOKEN_SECRET is not configured.
 */
export function getTokenSecret(): string {
  const envSecret = process.env.ADMIN_TOKEN_SECRET;
  if (envSecret && envSecret.trim()) {
    return envSecret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_TOKEN_SECRET must be configured in environment for production.');
  }

  return devEphemeralTokenSecret;
}

// ----------------------------------------------------------------------
// In-Memory Rate Limiting for Admin Login
// Defends against automated brute-force attacks by tracking failed attempts per IP.
// ----------------------------------------------------------------------

interface RateLimitEntry {
  failedAttempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const loginRateLimitMap = new Map<string, RateLimitEntry>();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Clean up stale rate-limit records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginRateLimitMap.entries()) {
    if (
      (entry.lockedUntil && entry.lockedUntil < now) ||
      now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS
    ) {
      loginRateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref();

export function checkAdminLoginRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = loginRateLimitMap.get(ip);
  if (!entry) return { allowed: true };

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordAdminLoginFailure(ip: string): {
  remainingAttempts: number;
  locked: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  let entry = loginRateLimitMap.get(ip);

  if (!entry || now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    entry = { failedAttempts: 1, firstAttemptAt: now };
    loginRateLimitMap.set(ip, entry);
    return { remainingAttempts: MAX_LOGIN_ATTEMPTS - 1, locked: false };
  }

  entry.failedAttempts += 1;

  if (entry.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    return {
      remainingAttempts: 0,
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  return {
    remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - entry.failedAttempts),
    locked: false,
  };
}

export function recordAdminLoginSuccess(ip: string): void {
  loginRateLimitMap.delete(ip);
}

// ----------------------------------------------------------------------
// Password & Token Verification
// ----------------------------------------------------------------------

/**
 * Constant-time verification of entered admin password against environment variables.
 * Contains ZERO hardcoded default passwords or fallback secrets.
 */
export function checkAdminPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;

  const enteredDigest = sha256Digest(password.trim());

  // 1. Check pre-computed ADMIN_PASSWORD_HASH if configured
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (configuredHash && configuredHash.trim()) {
    try {
      const expectedDigest = Buffer.from(configuredHash.trim(), 'hex');
      if (
        expectedDigest.length === enteredDigest.length &&
        crypto.timingSafeEqual(enteredDigest, expectedDigest)
      ) {
        return true;
      }
    } catch {
      // Ignore invalid hex format
    }
  }

  // 2. Check configured ADMIN_PASSWORD from environment
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (configuredPassword && configuredPassword.trim()) {
    const expectedDigest = sha256Digest(configuredPassword.trim());
    if (crypto.timingSafeEqual(enteredDigest, expectedDigest)) {
      return true;
    }
  }

  // All hardcoded fallback passwords removed. If unconfigured in env, return false.
  return false;
}

export function generateAdminToken(): string {
  const secret = getTokenSecret();
  const payload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export function validateAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;

  let secret: string;
  try {
    secret = getTokenSecret();
  } catch {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  // Constant-time signature verification
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return false;
    }
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }

  const token = authHeader.substring(7);
  if (!validateAdminToken(token)) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  next();
}
