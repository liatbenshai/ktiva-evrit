#!/usr/bin/env tsx
/**
 * סקריפט לבדיקת חיבור למסד הנתונים
 * הרץ: npx tsx scripts/check-database.ts
 */

import { PrismaClient } from '@prisma/client';

async function checkDatabase() {
  console.log('🔍 בודק חיבור למסד הנתונים...\n');

  // בדיקה 1: האם DATABASE_URL מוגדר?
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL לא מוגדר!');
    console.log('\n📝 פתרונות:');
    console.log('1. צור קובץ .env.local עם DATABASE_URL');
    console.log('2. או הגדר DATABASE_URL ב-Vercel Environment Variables');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL מוגדר');
  
  // בדיקה 2: איזה סוג חיבור?
  const isPooling = dbUrl.includes('pooler.supabase.com') || dbUrl.includes(':6543');
  const isDirect = dbUrl.includes('db.supabase.co') || dbUrl.includes(':5432');
  
  console.log(`\n🔗 סוג חיבור:`);
  if (isPooling) {
    console.log('  ✅ Connection Pooling (מומלץ ל-Vercel)');
    console.log('  📍 פורט: 6543');
  } else if (isDirect) {
    console.log('  ⚠️  Direct Connection (לא עובד ב-Vercel production!)');
    console.log('  📍 פורט: 5432');
    console.log('  💡 צריך להשתמש ב-Connection Pooling (פורט 6543)');
  } else {
    console.log('  ❓ לא מזוהה - בדוק את ה-URL');
  }

  // בדיקה 3: ניסיון התחברות
  console.log('\n🔌 מנסה להתחבר למסד הנתונים...');
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // בדיקת חיבור
    await prisma.$connect();
    console.log('✅ חיבור הצליח!');

    // בדיקת טבלאות
    console.log('\n📊 בודק טבלאות...');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`  ✅ User: ${userCount} רשומות`);
    } catch (e: any) {
      console.log(`  ⚠️  User: ${e.message}`);
    }

    try {
      const patternCount = await prisma.translationPattern.count();
      console.log(`  ✅ TranslationPattern: ${patternCount} רשומות`);
    } catch (e: any) {
      console.log(`  ⚠️  TranslationPattern: ${e.message}`);
    }

    try {
      const idiomCount = await prisma.idiom.count();
      console.log(`  ✅ Idiom: ${idiomCount} רשומות`);
    } catch (e: any) {
      console.log(`  ⚠️  Idiom: ${e.message}`);
    }

    try {
      const synonymCount = await prisma.synonym.count();
      console.log(`  ✅ Synonym: ${synonymCount} רשומות`);
    } catch (e: any) {
      console.log(`  ⚠️  Synonym: ${e.message}`);
    }

    console.log('\n✅ כל הבדיקות הושלמו בהצלחה!');
    
  } catch (error: any) {
    console.error('\n❌ שגיאת חיבור:');
    console.error(`  הודעה: ${error.message}`);
    console.error(`  קוד: ${error.code || 'N/A'}`);
    
    if (error.code === 'P1001') {
      console.error('\n💡 זה נראה כמו בעיית חיבור:');
      console.error('  1. ודא שמסד הנתונים פעיל');
      console.error('  2. ודא שה-DATABASE_URL נכון');
      console.error('  3. אם זה ב-Vercel, ודא שאתה משתמש ב-Connection Pooling (פורט 6543)');
    } else if (error.code === 'P2021') {
      console.error('\n💡 הטבלה לא קיימת:');
      console.error('  הרץ: npm run db:push');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch(console.error);

