import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from './auth';
import crypto from 'crypto';

describe('auth utils', () => {
  const TEST_KEY = crypto.randomBytes(32).toString('hex');

  describe('encryptSecret', () => {
    it('should encrypt a string', () => {
      const plaintext = 'test-secret';
      const encrypted = encryptSecret(plaintext, TEST_KEY);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split('.')).toHaveLength(3); // iv.authTag.ciphertext
    });

    it('should be deterministic for same IV (but IV is random inside)', () => {
      // Since IV is random inside encryptSecret, output should differ
      const plaintext = 'test-secret';
      const encrypted1 = encryptSecret(plaintext, TEST_KEY);
      const encrypted2 = encryptSecret(plaintext, TEST_KEY);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decryptSecret', () => {
    it('should decrypt a valid encrypted string', () => {
      const plaintext = 'test-secret';
      const encrypted = encryptSecret(plaintext, TEST_KEY);
      const decrypted = decryptSecret(encrypted, TEST_KEY);

      expect(decrypted).toBe(plaintext);
    });

    it('should fail with wrong key', () => {
      const plaintext = 'test-secret';
      const encrypted = encryptSecret(plaintext, TEST_KEY);
      const wrongKey = crypto.randomBytes(32).toString('hex');

      expect(() => decryptSecret(encrypted, wrongKey)).toThrow();
    });
  });
});

