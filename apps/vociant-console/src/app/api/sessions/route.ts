import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/sessions - List all sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    const sessions = await db.session.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        agent: true,
        turns: {
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const session = await db.session.create({
      data: {
        agentId: body.agentId,
        channelType: body.channelType || 'web',
        status: 'active',
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
