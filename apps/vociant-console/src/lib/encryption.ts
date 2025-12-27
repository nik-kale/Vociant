import { encryptSecret, decryptSecret } from '@vociant/core';
import crypto from 'crypto';

// Ensure we have a valid key for encryption
const ENCRYPTION_KEY = process.env.SECRET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Encrypt a sensitive value using the application's secret key
 */
export function encryptCredential(value: string): string {
  if (!process.env.SECRET_ENCRYPTION_KEY) {
    console.warn('WARNING: SECRET_ENCRYPTION_KEY is not set. Using random key (data will be lost on restart).');
  }
  return encryptSecret(value, ENCRYPTION_KEY);
}

/**
 * Decrypt a sensitive value using the application's secret key
 */
export function decryptCredential(encryptedValue: string): string {
  if (!process.env.SECRET_ENCRYPTION_KEY) {
    console.warn('WARNING: SECRET_ENCRYPTION_KEY is not set. Using random key (decryption may fail).');
  }
  return decryptSecret(encryptedValue, ENCRYPTION_KEY);
}

