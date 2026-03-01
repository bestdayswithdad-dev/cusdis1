import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma, resolvedConfig } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

export default NextAuth({
  providers: authProviders,

  adapter: Adapters.Prisma.Adapter({ prisma: prisma }),

  session: {
    // Fixed for NextAuth v3 compatibility
    jwt: true,
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    secret: resolvedConfig.jwtSecret || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  },

  secret: resolvedConfig.jwtSecret || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,

  debug: true,

  callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session(session, userOrToken: any) {
      // Robustly extract the ID for DadAdmin
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
      console.error("NEXTAUTH ERROR:", message);
    },
  },
});
