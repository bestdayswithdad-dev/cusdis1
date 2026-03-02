import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

/**
 * 1. EMERGENCY URL INJECTION
 * We manually override the environment variable BEFORE NextAuth loads.
 * This prevents the "Unexpected token <" error and the CSRF handshake loop.
 */
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://cusdis-jet-one.vercel.app";
};

process.env.NEXTAUTH_URL = getBaseUrl();

/**
 * 2. NEXTAUTH CONFIGURATION (v3.29.10)
 */
export default NextAuth({
  providers: authProviders,

  adapter: Adapters.Prisma.Adapter({ prisma: prisma }),

  session: {
    // NextAuth v3 legacy syntax
    jwt: true,
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    // We bypass 'resolvedConfig' and use the raw Vercel variable or a hardcoded fallback.
    // This is the ONLY way to stop Vercel from autogenerating a random key.
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'c420d92ac78e5a0d8395920b9c425055ae911fe78b1fa97fc567dc6b4ec81b8f',
  },

  // This top-level secret is critical for signing the CSRF cookies.
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'c420d92ac78e5a0d8395920b9c425055ae911fe78b1fa97fc567dc6b4ec81b8f',

  debug: true,

  callbacks: {
    async jwt(token, user) {
      if (user) {
        // This ensures the ID from the database is carried into the JWT
        token.id = user.id;
      }
      return token;
    },
    
    async session(session, userOrToken: any) {
      // Robustly extract the ID to ensure session.uid becomes "DadAdmin"
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
