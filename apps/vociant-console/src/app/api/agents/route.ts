import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createAgentSchema } from '@/lib/schemas/agent';
import { createRequestLogger } from '@/lib/logger';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const logger = createRequestLogger(requestId, { path: '/api/agents', method: 'GET' });

  try {
    logger.info('Fetching agents');
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
    
    logger.info({ count: agents.length }, 'Agents fetched successfully');
    return NextResponse.json({ agents });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch agents');
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const logger = createRequestLogger(requestId, { path: '/api/agents', method: 'POST' });

  try {
    const body = await request.json();
    
    // Validate input with Zod
    const result = createAgentSchema.safeParse(body);
    
    if (!result.success) {
      logger.warn({ error: result.error.flatten() }, 'Validation failed');
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() }, 
        { status: 400 }
      );
    }
    
    const data = result.data;

    // Generate slug from name if not provided or just auto-generate for uniqueness handling
    // We should probably rely on slug from schema if provided, else generate
    let slug = data.slug;
    if (!slug) {
        slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
    }
    
    // Ensure slug uniqueness (simple retry or suffix logic could be added, but for now basic)
    const existing = await db.agent.findUnique({ where: { slug } });
    if (existing) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    logger.info({ name: data.name, slug }, 'Creating agent');
    const agent = await db.agent.create({
      data: {
        name: data.name,
        slug: slug!,
        description: data.description,
        systemPrompt: data.systemPrompt || 'You are a helpful voice assistant.',
        ttsProvider: data.ttsProvider,
        sttProvider: data.sttProvider,
        llmProvider: data.llmProvider,
        llmModel: 'gpt-4-turbo-preview', // Default or from schema if we added it
        status: data.status,
        language: data.language,
        turnTimeoutSeconds: data.turnTimeoutSeconds,
      },
    });
    
    logger.info({ agentId: agent.id }, 'Agent created successfully');

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'Failed to create agent');
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
