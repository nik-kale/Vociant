import { NextRequest, NextResponse } from 'next/server';

export async function getSession(request: NextRequest) {
  // Mock session retrieval or integration with NextAuth/Clerk
  // For now, check for a simulation header or cookie
  const authHeader = request.headers.get('authorization');
  const cookie = request.cookies.get('session_token');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { user: { id: 'user_1', role: 'admin' } };
  }

  if (cookie) {
    return { user: { id: 'user_1', role: 'admin' } };
  }

  return null;
}

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(request, session);
}

