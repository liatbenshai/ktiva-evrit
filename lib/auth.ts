import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// Validate NEXTAUTH_SECRET
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️ CRITICAL: NEXTAUTH_SECRET is not set in production!');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // חשוב ל-NextAuth v5
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
  basePath: '/api/auth', // Explicit base path for NextAuth
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.session-token' 
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('Authorize called with email:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log('Looking up user in database...');
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log('User not found in database');
            return null;
          }

          if (!user.password) {
            console.log('User found but has no password');
            return null;
          }

          console.log('Comparing password...');
          const isValid = await bcrypt.compare(password, user.password);

          if (!isValid) {
            console.log('Password comparison failed');
            return null;
          }

          console.log('Authorization successful for user:', user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
});

