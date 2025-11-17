import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const agents = await db.agent.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            sessions: true,
            agentTools: true,
            agentKnowledgeBases: true,
          },
        },
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const agent = await db.agent.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        systemPrompt: body.systemPrompt || 'You are a helpful voice assistant.',
        ttsProvider: body.ttsProvider || 'mock',
        sttProvider: body.sttProvider || 'mock',
        llmProvider: body.llmProvider || 'openai',
        llmModel: body.llmModel || 'gpt-4-turbo-preview',
        status: body.status || 'draft',
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
