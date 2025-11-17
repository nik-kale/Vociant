import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateSignedToken } from '@vociant/core';
import crypto from 'crypto';

/**
 * POST /api/auth/signed-url
 *
 * Generate a signed URL for WebSocket authentication
 * Client-side apps should call this from their backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, expiryMinutes = 15 } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Fetch agent
    const agent = await db.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        requireSignedUrls: true,
        signedUrlSecret: true,
        domainAllowlist: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if signed URLs are required
    if (!agent.requireSignedUrls) {
      return NextResponse.json(
        { error: 'Signed URLs not enabled for this agent' },
        { status: 400 }
      );
    }

    // Validate origin against allowlist (if configured)
    const origin = request.headers.get('origin');
    if (agent.domainAllowlist) {
      const allowlist = JSON.parse(agent.domainAllowlist);
      const { isOriginAllowed } = await import('@vociant/core');

      if (origin && !isOriginAllowed(origin, allowlist)) {
        return NextResponse.json(
          { error: 'Origin not allowed' },
          { status: 403 }
        );
      }
    }

    // Generate or create secret if not exists
    let secret = agent.signedUrlSecret;
    if (!secret) {
      secret = crypto.randomBytes(32).toString('hex');
      await db.agent.update({
        where: { id: agentId },
        data: { signedUrlSecret: secret },
      });
    }

    // Generate signed token
    const token = generateSignedToken(agentId, secret, expiryMinutes);

    // Build WebSocket URL
    const wsProtocol = request.url.startsWith('https') ? 'wss' : 'ws';
    const host = request.headers.get('host');
    const wsUrl = `${wsProtocol}://${host}/api/voice/${agentId}?token=${token}`;

    return NextResponse.json({
      token,
      wsUrl,
      expiresIn: expiryMinutes * 60, // seconds
    });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
