import { NextRequest, NextResponse } from 'next/server';
import { CredentialService } from '@/lib/credentials';
import { z } from 'zod';

const createCredentialSchema = z.object({
  provider: z.string(),
  label: z.string(),
  apiKey: z.string().min(1),
  config: z.record(z.any()).optional(),
  projectId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createCredentialSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 });
    }

    const { provider, label, apiKey, config, projectId } = result.data;

    const credential = await CredentialService.saveCredential({
      provider,
      label,
      apiKey,
      config,
      projectId,
    });

    return NextResponse.json({
      success: true,
      id: credential.id,
      message: 'Credential saved and encrypted'
    });

  } catch (error) {
    console.error('Failed to save credential:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;

    const credentials = await CredentialService.listCredentials(projectId);

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('Failed to list credentials:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

