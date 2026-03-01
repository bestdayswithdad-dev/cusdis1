import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma, resolvedConfig } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

/**
 * 1. DYNAMIC URL INJECTION (NextAuth v3 Fix)
 * NextAuth v3 doesn't have a 'baseUrl' config property. 
 * We must manually set process.env.NEXTAUTH_URL before the export 
 * so the library knows which 'handshake' to use for CSRF.
 */
const dynamicUrl = (() => {
  // If you manually set it in Vercel, use that
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  // If on Vercel Preview/Production, use the system variable
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Local fallback
  return "https://cusdis-jet-one.vercel.app";
})();

process.env.NEXTAUTH_URL = dynamicUrl;

/**
 * 2. MODULE AUGMENTATION
 * Ensures TypeScript knows about our 'uid' for DadAdmin
 */
declare module "next-auth" {
  interface Session {
    uid: string
  }
  interface User {
    id: string
  }
}

/**
 * 3. NEXTAUTH CONFIGURATION
 */
export default NextAuth({
  providers: authProviders,

  adapter: Adapters.Prisma.Adapter({ prisma: prisma }),

  session: {
    // NextAuth v3 syntax to force JWT-based sessions
    jwt: true,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    // This stops the "Secret is very wrong" / Autogeneration issue
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || resolvedConfig.jwtSecret || 'c420d92ac78e5a0d8395920b9c425055ae911fe78b1fa97fc567dc6b4ec81b8f',
  },

  // Top-level secret is required in v3 to sign the CSRF tokens
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || resolvedConfig.jwtSecret || 'c420d92ac78e5a0d8395920b9c425055ae911fe78b1fa97fc567dc6b4ec81b8f',

  debug: true,

  callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session(session, userOrToken: any) {
      // Map 'id' to 'uid' so the dashboard ownership check passes
      const id = (userOrToken?.id || userOrToken?.sub || userOrToken?.uid) as string;
      
      if (id) {
        session.uid = id;
      }
      
      console.log("NEXTAUTH DEBUG: Session UID set to:", session.uid);
      return session;
    },

    signIn() {
      statService.capture('signIn');
      return true;
    }
  },

  events: {
    async error(message) {
      console.error("NEXTAUTH ERROR EVENT:", message);
    },
  },
});
