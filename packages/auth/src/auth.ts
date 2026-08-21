import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@apolo/database";
import { users, tenants } from "@apolo/database";
import { getEffectiveModules } from "@apolo/core";
import { authConfig } from "./auth.config";
import { getIp, rateLimit } from "./rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const allowed = await rateLimit("login", getIp(request), 5, "1 m");
        if (!allowed) return null;

        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        if (!user || !user.isActive) return null;

        const tenant = await db.query.tenants.findFirst({
          where: (tenants, { eq }) => eq(tenants.id, user.tenantId),
        });
        if (!tenant || !tenant.isActive) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          tenantId: user.tenantId,
          role: user.role,
          modules: getEffectiveModules(user.role ?? "viewer", user.modules),
        };
      },
    }),
  ],
});
