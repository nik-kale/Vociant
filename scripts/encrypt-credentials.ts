import { PrismaClient } from '@prisma/client';
import { encryptSecret } from '@vociant/core';
import crypto from 'crypto';

const db = new PrismaClient();
const ENCRYPTION_KEY = process.env.SECRET_ENCRYPTION_KEY;

async function main() {
  if (!ENCRYPTION_KEY) {
    console.error('SECRET_ENCRYPTION_KEY is required');
    process.exit(1);
  }

  console.log('Starting credential encryption migration...');

  const credentials = await db.providerCredential.findMany();
  let updatedCount = 0;

  for (const cred of credentials) {
    // Check if already encrypted (contains 2 dots and iv/tag length looks right, or just simple heuristic)
    if (cred.apiKey.split('.').length === 3) {
      console.log(`Skipping likely encrypted credential: ${cred.label}`);
      continue;
    }

    console.log(`Encrypting credential: ${cred.label}`);

    // Encrypt
    const encrypted = encryptSecret(cred.apiKey, ENCRYPTION_KEY);

    // Update
    await db.providerCredential.update({
      where: { id: cred.id },
      data: { apiKey: encrypted },
    });

    updatedCount++;
  }

  console.log(`Migration complete. Encrypted ${updatedCount} credentials.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

