import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// בדיקה שהחיבור משתמש ב-Connection Pooling (חשוב ל-Vercel)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const isDirectConnection = dbUrl.includes(':5432') && dbUrl.includes('db.supabase.co');
  if (isDirectConnection && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using direct connection (port 5432) in production!');
    console.warn('   This may not work on Vercel. Consider using Connection Pooling (port 6543)');
  }
  
  const isPooling = dbUrl.includes('pooler.supabase.com') || dbUrl.includes(':6543');
  if (isPooling) {
    console.log('✅ Using Connection Pooling (recommended for Vercel)');
  }
} else {
  console.warn('⚠️  DATABASE_URL is not set!');
}

// יצירת Prisma Client עם הגדרות מותאמות
const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
};

// אם זה Connection Pooling, נוסיף הגדרות נוספות
if (dbUrl?.includes('pooler.supabase.com') || dbUrl?.includes(':6543')) {
  prismaClientOptions.datasources = {
    db: {
      url: dbUrl,
    },
  };
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

// טיפול נכון ב-disconnect
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // ב-production, נוודא שהחיבור נסגר נכון
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
