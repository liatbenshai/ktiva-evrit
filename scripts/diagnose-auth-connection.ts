#!/usr/bin/env tsx
/**
 * כלי אבחון מקיף לבעיות התחברות
 * בודק את כל הבעיות הנפוצות ומציע פתרונות
 * הרץ: npx tsx scripts/diagnose-auth-connection.ts
 */

import * as crypto from 'crypto';

// Try to import Prisma, but handle if it's not generated yet
let PrismaClient: any;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  console.warn('⚠️  Prisma Client לא מותקן - הרץ: npm run db:generate');
  PrismaClient = null;
}

interface DiagnosticResult {
  check: string;
  status: '✅' | '❌' | '⚠️' | 'ℹ️';
  message: string;
  solution?: string;
}

const results: DiagnosticResult[] = [];

function addResult(check: string, status: '✅' | '❌' | '⚠️' | 'ℹ️', message: string, solution?: string) {
  results.push({ check, status, message, solution });
}

async function diagnose() {
  console.log('🔍 אבחון בעיות התחברות למערכת\n');
  console.log('=' .repeat(50) + '\n');

  // בדיקה 1: NEXTAUTH_SECRET
  console.log('1️⃣ בודק NEXTAUTH_SECRET...');
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextAuthSecret) {
    addResult(
      'NEXTAUTH_SECRET',
      '❌',
      'NEXTAUTH_SECRET לא מוגדר!',
      `הרץ: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"\n   הוסף את התוצאה ל-.env.local כ-NEXTAUTH_SECRET=...`
    );
  } else if (nextAuthSecret === 'your-secret-key-change-in-production' || nextAuthSecret.length < 32) {
    addResult(
      'NEXTAUTH_SECRET',
      '⚠️',
      'NEXTAUTH_SECRET לא מאובטח (קצר מדי או ערך ברירת מחדל)',
      'צור secret חדש: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  } else {
    addResult('NEXTAUTH_SECRET', '✅', `מוגדר (אורך: ${nextAuthSecret.length} תווים)`);
  }

  // בדיקה 2: DATABASE_URL
  console.log('2️⃣ בודק DATABASE_URL...');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    addResult(
      'DATABASE_URL',
      '❌',
      'DATABASE_URL לא מוגדר!',
      'הוסף DATABASE_URL ל-.env.local או ל-Vercel Environment Variables'
    );
  } else {
    // בדיקת סוג החיבור
    const isPooling = dbUrl.includes('pooler.supabase.com') || dbUrl.includes(':6543');
    const isDirect = dbUrl.includes('db.supabase.co') || dbUrl.includes(':5432');
    
    if (isPooling) {
      addResult('DATABASE_URL', '✅', 'משתמש ב-Connection Pooling (מומלץ)');
    } else if (isDirect) {
      addResult(
        'DATABASE_URL',
        '⚠️',
        'משתמש ב-Direct Connection (לא עובד ב-Vercel!)',
        'עבור ל-Connection Pooling: לך ל-Supabase Dashboard → Settings → Database → Connection Pooling → העתק את ה-URL (פורט 6543)'
      );
    } else {
      addResult('DATABASE_URL', '✅', 'מוגדר (לא מזוהה סוג חיבור)');
    }
  }

  // בדיקה 3: חיבור למסד הנתונים
  console.log('3️⃣ בודק חיבור למסד הנתונים...');
  if (dbUrl && PrismaClient) {
    const prisma = new PrismaClient({
      log: ['error'],
    });

    try {
      await prisma.$connect();
      addResult('Database Connection', '✅', 'חיבור למסד הנתונים הצליח');

      // בדיקת טבלת User
      try {
        const userCount = await prisma.user.count();
        addResult('User Table', '✅', `טבלת User קיימת (${userCount} משתמשים)`);
      } catch (e: any) {
        addResult(
          'User Table',
          '❌',
          `טבלת User לא קיימת: ${e.message}`,
          'הרץ: npm run db:push'
        );
      }
    } catch (error: any) {
      addResult(
        'Database Connection',
        '❌',
        `שגיאת חיבור: ${error.message}`,
        error.code === 'P1001'
          ? '1. ודא שמסד הנתונים פעיל\n2. ודא שה-DATABASE_URL נכון\n3. אם זה ב-Vercel, השתמש ב-Connection Pooling'
          : error.code === 'P2021'
          ? 'הרץ: npm run db:push'
          : 'בדוק את ה-DATABASE_URL והסיסמה'
      );
    } finally {
      await prisma.$disconnect();
    }
  } else if (!dbUrl) {
    addResult('Database Connection', '⚠️', 'לא ניתן לבדוק - DATABASE_URL לא מוגדר');
  } else if (!PrismaClient) {
    addResult('Database Connection', '⚠️', 'לא ניתן לבדוק - Prisma Client לא מותקן', 'הרץ: npm run db:generate');
  }

  // בדיקה 4: משתני סביבה נוספים
  console.log('4️⃣ בודק משתני סביבה נוספים...');
  const isVercel = !!process.env.VERCEL;
  const hasNextAuthUrl = !!(process.env.NEXTAUTH_URL || process.env.VERCEL_URL);
  
  if (isVercel) {
    // ב-Vercel, NEXTAUTH_URL מוגדר אוטומטית
    addResult('Environment Variables', '✅', 'ב-Vercel - NEXTAUTH_URL מוגדר אוטומטית');
  } else if (hasNextAuthUrl) {
    addResult('Environment Variables', '✅', 'NEXTAUTH_URL מוגדר');
  } else {
    // מקומית, זה לא קריטי אבל יכול לעזור
    addResult(
      'Environment Variables',
      'ℹ️',
      'NEXTAUTH_URL לא מוגדר מקומית (לא חובה)',
      'ב-Vercel זה מוגדר אוטומטית. מקומית אפשר להוסיף ל-.env.local (לדוגמה: http://localhost:3002) אבל זה לא חובה'
    );
  }

  // סיכום
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 סיכום תוצאות:\n');

  results.forEach((result, index) => {
    const statusIcon = result.status === 'ℹ️' ? 'ℹ️' : result.status;
    console.log(`${index + 1}. ${statusIcon} ${result.check}`);
    console.log(`   ${result.message}`);
    if (result.solution) {
      console.log(`   💡 ${result.status === 'ℹ️' ? 'הערה' : 'פתרון'}:`);
      console.log(`   ${result.solution.split('\n').join('\n   ')}`);
    }
    console.log('');
  });

  const errors = results.filter(r => r.status === '❌');
  const warnings = results.filter(r => r.status === '⚠️');
  const info = results.filter(r => r.status === 'ℹ️');

  if (errors.length > 0) {
    console.log('❌ נמצאו שגיאות קריטיות שצריך לתקן!');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️ נמצאו אזהרות - מומלץ לתקן');
    process.exit(0);
  } else {
    if (info.length > 0) {
      console.log('ℹ️ יש הערות (לא קריטיות)');
    }
    console.log('✅ כל הבדיקות הקריטיות עברו בהצלחה!');
    process.exit(0);
  }
}

diagnose().catch(console.error);

