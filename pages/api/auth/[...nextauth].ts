import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma, resolvedConfig } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

// Using Module Augmentation
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
    jwt: !!resolvedConfig.useLocalAuth,
  },

  jwt: {
    secret: resolvedConfig.jwtSecret,
  },

 callbacks: {
    async jwt({ token, user }) {
      // If we just signed in, the 'user' object exists. Capture its ID.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Use the ID we saved in the JWT token to set the session UID
      if (token?.id) {
        session.uid = token.id as string;
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
