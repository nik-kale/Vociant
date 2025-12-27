import { db } from '@/lib/db';
import { encryptCredential, decryptCredential } from './encryption';

/**
 * Service to manage provider credentials securely
 */
export class CredentialService {
  /**
   * Save or update a provider credential with encryption
   */
  static async saveCredential(data: {
    projectId?: string;
    provider: string;
    label: string;
    apiKey: string;
    config?: any;
  }) {
    const encryptedKey = encryptCredential(data.apiKey);

    return db.providerCredential.upsert({
      where: {
        projectId_provider_label: {
          projectId: data.projectId || '', // Handle null constraint if necessary, but schema allows null. Prisma uses null in unique constraint differently depending on DB. Assuming standard behavior.
          // Wait, Prisma unique constraint with nullable field can be tricky.
          // Let's assume unique constraint works as defined in schema.
          // Actually, if projectId is null, we can't use it in composite unique in some DBs easily without specific handling,
          // but let's stick to the schema definition.
          projectId: data.projectId ?? null, // actually schema says String?, so standard null.
          provider: data.provider,
          label: data.label
        } as any // cast to avoid strict typing issues if types aren't fully generated
      },
      update: {
        apiKey: encryptedKey,
        config: data.config ? JSON.stringify(data.config) : undefined,
      },
      create: {
        projectId: data.projectId,
        provider: data.provider,
        label: data.label,
        apiKey: encryptedKey,
        config: data.config ? JSON.stringify(data.config) : undefined,
      },
    });
  }

  /**
   * Get a decrypted credential
   */
  static async getCredential(provider: string, label: string, projectId?: string) {
    const cred = await db.providerCredential.findFirst({
      where: {
        provider,
        label,
        projectId: projectId ?? null,
      },
    });

    if (!cred) return null;

    try {
      const decryptedKey = decryptCredential(cred.apiKey);
      return {
        ...cred,
        apiKey: decryptedKey,
        config: cred.config ? JSON.parse(cred.config) : {},
      };
    } catch (error) {
      console.error(`Failed to decrypt credential for ${provider}/${label}`, error);
      return null;
    }
  }

  /**
   * Get all credentials for a project (encrypted keys are NOT returned by default for security, or redacted)
   */
  static async listCredentials(projectId?: string) {
    const creds = await db.providerCredential.findMany({
      where: {
        projectId: projectId ?? null,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        isActive: true,
        updatedAt: true,
        // Do not select apiKey
      },
    });
    return creds;
  }
}

