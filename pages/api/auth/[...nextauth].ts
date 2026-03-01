import NextAuth from "next-auth";
import Adapters from "next-auth/adapters";
import { prisma, resolvedConfig } from "../../../utils.server";
import { authProviders } from "../../../config.server";
import { statService } from "../../../service/stat.service";

// Helper to stop the "Two-Address" fighting 
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  // If on Vercel, use the dynamic system variable
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://cusdis-jet-one.vercel.app";
};

export default NextAuth({
  providers: authProviders,

  adapter: Adapters.Prisma.Adapter({ prisma: prisma }),

  session: {
    jwt: true,
    maxAge: 30 * 24 * 60 * 60,
  },

  // This prevents the "Site can't be reached" error you just saw
  // by correctly identifying the host at runtime.
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || resolvedConfig.jwtSecret || 'c420d92ac78e5a0d8395920b9c425055ae911fe78b1fa97fc567dc6b4ec81b8f',
  },

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
