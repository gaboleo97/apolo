import type { NextAuthConfig } from "next-auth";

type SessionToken = {
  id?: string;
  tenantId?: string;
  role?: string;
  modules?: string[];
};

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const t = token as SessionToken;
        const u = user as { id?: string } & SessionToken;
        t.id = u.id;
        t.tenantId = u.tenantId;
        t.role = u.role;
        t.modules = u.modules;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as SessionToken;
      if (session.user) {
        session.user.id = t.id ?? "";
        session.user.tenantId = t.tenantId ?? "";
        session.user.role = t.role ?? "viewer";
        session.user.modules = t.modules ?? [];
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
