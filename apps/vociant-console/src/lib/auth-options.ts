import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { encryptSecret } from "@vociant/core";

// For demo purposes, we'll use a simple credentials provider.
// In production, you'd likely use OAuth (Google, GitHub) or a proper User table.
// Since we don't have a User model in the schema yet (Wait, do we?),
// we will assume a basic admin user for now or checking against an env var.

// Looking at schema.prisma, there is NO User model!
// So we should probably add one or use a hardcoded admin for now as a starter.
// Or we can add a User model in this feature? The prompt didn't explicitly ask for User model,
// just "API Authentication Middleware".
// I'll implement a simple env-based admin auth for "programmatic access" and "admin-only".

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const adminUser = process.env.ADMIN_USERNAME || "admin";
        const adminPass = process.env.ADMIN_PASSWORD || "admin";

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPass
        ) {
          return { id: "1", name: "Admin User", email: "admin@vociant.com", role: "admin" };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
};

