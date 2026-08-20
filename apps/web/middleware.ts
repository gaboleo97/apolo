import NextAuth from "next-auth";
import { authConfig } from "@apolo/auth";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*"],
};
