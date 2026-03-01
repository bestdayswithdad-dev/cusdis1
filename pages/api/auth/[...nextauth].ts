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
    async jwt(token, user) {
      // Positional arguments: token is first, user is second
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session(session, userOrToken) {
      // In v3, the second argument is the user (for DB sessions) or token (for JWT)
      // We check both to ensure the UID is set
      const id = userOrToken?.id || userOrToken?.sub;
      
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
