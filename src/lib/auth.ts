import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// =============================================
// NextAuth Configuration
// =============================================

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("الإيميل وكلمة المرور مطلوبين");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.isActive) {
          throw new Error("الإيميل أو كلمة المرور غير صحيحة");
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          throw new Error("الإيميل أو كلمة المرور غير صحيحة");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 يوم
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;

        // جلب المتاجر المربوطة بالمستخدم
        const storeUsers = await prisma.storeUser.findMany({
          where: { userId: token.id as string },
          include: { store: { select: { id: true, name: true, platform: true } } },
        });

        session.user.stores = storeUsers.map((su) => ({
          id: su.store.id,
          name: su.store.name,
          platform: su.store.platform,
          role: su.role,
        }));

        // المتجر النشط (أول متجر افتراضياً)
        if (storeUsers.length > 0) {
          session.user.activeStoreId = storeUsers[0].store.id;
        }
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// =============================================
// أنواع NextAuth المخصصة
// =============================================

declare module "next-auth" {
  interface User {
    id: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      stores: Array<{
        id: string;
        name: string;
        platform: string;
        role: string;
      }>;
      activeStoreId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
