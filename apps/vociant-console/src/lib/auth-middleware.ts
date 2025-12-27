import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth-options";

type RouteHandler = (
  req: NextRequest,
  context: any,
  session: any
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler) {
  return async (request: NextRequest, context: any) => {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(request, context, session);
  };
}

export async function isAuthenticated(request: NextRequest) {
    const session = await getServerSession(authOptions);
    return !!session;
}

