import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma, resolvedConfig, singletonSync } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

// Using Module Augmentation
// https://next-auth.js.org/getting-started/typescript

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
  // Configure one or more authentication providers
  providers: authProviders,

  adapter: Adapters.Prisma.Adapter({ prisma: prisma }),

  session: {
    jwt: !!resolvedConfig.useLocalAuth,
  },

  jwt: {
    secret: resolvedConfig.jwtSecret,
  },

  callbacks: {
    session(session, user) {
      session.uid = user.id
      return session
    },
    jwt(token, user) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    signIn() {
      statService.capture('signIn')
      return true
    }
  },

  events: {
    async error(message) {
      console.log(message)
    },
  },
  callbacks: {
    session(session, user) {
      // --- EMERGENCY LOG ---
      console.log("CRITICAL DEBUG: User ID from database:", user.id);
      console.log("CRITICAL DEBUG: Session UID being set:", session.uid);
      // --- END LOG ---
      session.uid = user.id
      return session
    },
})
