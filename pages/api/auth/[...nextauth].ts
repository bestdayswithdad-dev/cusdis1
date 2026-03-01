import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma, resolvedConfig } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

export default NextAuth({
  providers: authProviders,

  adapter: Adapters.Prisma.Adapter({ prisma: prisma }),

  // Force JWT strategy if you are using local auth or a custom provider
  session: {
    jwt: true, 
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // This is the CRITICAL fix for the JWS Verification error.
  // We use a fallback to process.env to ensure Vercel sees the secret.
  jwt: {
    secret: resolvedConfig.jwtSecret || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  },
  
  // Use the same secret for the main NextAuth configuration
  secret: resolvedConfig.jwtSecret || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,

  // Set debug to true to see the exact reason for any future "Forbidden" errors
  debug: true, 

  callbacks: {
    async jwt(token, user) {
      // If this is the first time logging in, 'user' will exist
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session(session, userOrToken: any) {
      // Robustly extract the ID (which should be 'DadAdmin')
      const id = (userOrToken?.id || userOrToken?.sub || userOrToken?.uid) as string;
      
      if (id) {
        session.uid = id;
      }
      
      // Verification log for Vercel terminal
      console.log("NEXTAUTH DEBUG: Session ID set to:", session.uid);
      
      return session;
    },
    signIn() {
      statService.capture('signIn');
      return true;
    }
  },

  events: {
    async error(message) {
      console.error("NEXTAUTH EVENT ERROR:", message);
    },
  },
});
  jwt: {
    secret: resolvedConfig.jwtSecret,
  },

callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session(session, userOrToken: any) {
      // Force 'id' to be treated as a string to satisfy the compiler
      const id = (userOrToken?.id || userOrToken?.sub || userOrToken?.uid) as string;
      
      if (id) {
        session.uid = id;
      }
      
      // --- EMERGENCY LOGS ---
      console.log("CRITICAL DEBUG: Final Session UID:", session.uid);
      // --- END LOGS ---
      
      return session;
    },
    signIn() {
      statService.capture('signIn');
      return true;
    }
  },

  events: {
    async error(message) {
      console.log(message);
    },
  },
});
