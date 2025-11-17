import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { encryptSecret } from '@vociant/core';
import crypto from 'crypto';

// Get encryption key from environment (should be 32 bytes hex)
const ENCRYPTION_KEY =
  process.env.SECRET_ENCRYPTION_KEY ||
  crypto.randomBytes(32).toString('hex'); // Generate for dev

/**
 * GET /api/secrets - List all secrets (names only, not values)
 */
export async function GET(request: NextRequest) {
  try {
    const secrets = await db.secret.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ secrets });
  } catch (error) {
    console.error('Failed to fetch secrets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch secrets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/secrets - Create a new secret
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type = 'generic', value, metadata } = body;

    if (!name || !value) {
      return NextResponse.json(
        { error: 'Name and value are required' },
        { status: 400 }
      );
    }

    // Encrypt the secret value
    const encryptedValue = encryptSecret(value, ENCRYPTION_KEY);

    const secret = await db.secret.create({
      data: {
        name,
        description,
        type,
        encryptedValue,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ secret }, { status: 201 });
  } catch (error) {
    console.error('Failed to create secret:', error);
    return NextResponse.json(
      { error: 'Failed to create secret' },
      { status: 500 }
    );
  }
}
