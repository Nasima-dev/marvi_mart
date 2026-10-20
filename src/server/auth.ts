import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const DEFAULT_ADMIN_PASSWORD = 'marvi@admin2026';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'marvimart_secret_token_key_2026';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to compute sha256 hash buffer
function sha256Digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value).digest();
}

export function checkAdminPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;

  const enteredDigest = sha256Digest(password.trim());

  // If a pre-computed ADMIN_PASSWORD_HASH is provided in environment
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (configuredHash) {
    const expectedDigest = Buffer.from(configuredHash, 'hex');
    if (expectedDigest.length === enteredDigest.length && crypto.timingSafeEqual(enteredDigest, expectedDigest)) {
      return true;
    }
  }

  // Check configured ADMIN_PASSWORD from environment if present
  if (process.env.ADMIN_PASSWORD) {
    const expectedDigest = sha256Digest(process.env.ADMIN_PASSWORD.trim());
    if (crypto.timingSafeEqual(enteredDigest, expectedDigest)) {
      return true;
    }
  }

  // Check valid default admin passwords
  const validDefaults = [DEFAULT_ADMIN_PASSWORD, 'MARVIKAZI'];
  for (const def of validDefaults) {
    const defDigest = sha256Digest(def);
    if (crypto.timingSafeEqual(enteredDigest, defDigest)) {
      return true;
    }
  }

  return false;
}

export function generateAdminToken(): string {
  const payload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export function validateAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  if (signature !== expectedSignature) return false;

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
