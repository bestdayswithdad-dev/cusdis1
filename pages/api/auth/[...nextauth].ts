import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma, resolvedConfig } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

// Using Module Augmentation to ensure TypeScript recognizes the custom IDs
declare module "next-auth" {
  interface Session {
    uid: string
  }
  interface User {
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}

export default NextAuth({
  providers: authProviders,

  adapter: Adapters.Prisma.Adapter({ prisma: prisma }),

  session: {
    // Force JWT strategy to avoid database session lookup issues
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    // Fallback chain to ensure a secret is ALWAYS found
    secret: resolvedConfig.jwtSecret || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  },

  // Main secret for high-level NextAuth signing
  secret: resolvedConfig.jwtSecret || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,

  // Enable debug to see exact JWS/JWT failure reasons in Vercel logs
  debug: true,

  callbacks: {
    async jwt({ token, user }) {
      // Capture the user ID (DadAdmin) on initial sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }: any) {
      // Map the token ID to the session UID used by your dashboard
      const id = (token?.id || token?.sub || token?.uid) as string;
      
      if (id) {
        session.uid = id;
      }
      
      // Critical log to verify the identity chain in Vercel terminal
      console.log("NEXTAUTH DEBUG: Session UID for Dashboard:", session.uid);
      
      return session;
    },

    async signIn() {
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
