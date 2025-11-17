/**
 * Authentication & Security Utilities
 *
 * Handles signed URLs, HMAC signatures, and authentication
 */

import crypto from 'crypto';

/**
 * Generate a signed URL for WebSocket authentication
 *
 * @param agentId - Agent identifier
 * @param secret - Secret key for signing
 * @param expiryMinutes - Minutes until URL expires (default: 15)
 * @returns Signed token
 */
export function generateSignedToken(
  agentId: string,
  secret: string,
  expiryMinutes = 15
): string {
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
  const payload = JSON.stringify({ agentId, expiresAt });

  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Encode as base64
  const token = Buffer.from(`${payload}.${signature}`).toString('base64url');

  return token;
}

/**
 * Verify a signed token
 *
 * @param token - Signed token to verify
 * @param secret - Secret key for verification
 * @returns Payload if valid, null if invalid or expired
 */
export function verifySignedToken(
  token: string,
  secret: string
): { agentId: string; expiresAt: number } | null {
  try {
    // Decode from base64
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [payloadStr, signature] = decoded.split('.');

    if (!payloadStr || !signature) return null;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');

    if (signature !== expectedSignature) return null;

    // Parse payload
    const payload = JSON.parse(payloadStr);

    // Check expiry
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate HMAC signature for webhook validation
 *
 * @param payload - Webhook payload (stringified JSON)
 * @param secret - Shared secret
 * @returns Hex-encoded SHA256 HMAC signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook HMAC signature
 *
 * @param payload - Webhook payload (stringified JSON)
 * @param signature - Signature from request header
 * @param secret - Shared secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Check if origin is in allowlist
 *
 * @param origin - Request origin (e.g., "https://example.com")
 * @param allowlist - Array of allowed origins or patterns
 * @returns True if origin is allowed
 */
export function isOriginAllowed(origin: string, allowlist: string[]): boolean {
  if (!origin) return false;

  for (const allowed of allowlist) {
    // Exact match
    if (allowed === origin) return true;

    // Wildcard subdomain match (e.g., "*.example.com")
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      if (origin.endsWith(domain) || origin.endsWith(`.${domain}`)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Encrypt a secret value using AES-256-GCM
 *
 * @param plaintext - Value to encrypt
 * @param encryptionKey - 32-byte encryption key (hex or base64)
 * @returns Encrypted value with IV and auth tag
 */
export function encryptSecret(plaintext: string, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return format: iv.authTag.ciphertext
  return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted}`;
}

/**
 * Decrypt a secret value
 *
 * @param ciphertext - Encrypted value (iv.authTag.ciphertext format)
 * @param encryptionKey - 32-byte encryption key (hex or base64)
 * @returns Decrypted plaintext
 */
export function decryptSecret(ciphertext: string, encryptionKey: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split('.');
  const key = Buffer.from(encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
