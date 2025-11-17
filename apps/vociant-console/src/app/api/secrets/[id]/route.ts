import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/secrets/:id - Delete a secret
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if secret is in use
    const secret = await db.secret.findUnique({
      where: { id: params.id },
      include: {
        tools: true,
        webhooks: true,
      },
    });

    if (!secret) {
      return NextResponse.json(
        { error: 'Secret not found' },
        { status: 404 }
      );
    }

    if (secret.tools.length > 0 || secret.webhooks.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete secret in use',
          usedBy: {
            tools: secret.tools.length,
            webhooks: secret.webhooks.length,
          },
        },
        { status: 400 }
      );
    }

    await db.secret.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete secret:', error);
    return NextResponse.json(
      { error: 'Failed to delete secret' },
      { status: 500 }
    );
  }
}
