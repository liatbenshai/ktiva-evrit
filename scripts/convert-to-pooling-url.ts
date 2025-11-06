#!/usr/bin/env tsx
/**
 * סקריפט להמרת URL רגיל ל-Connection Pooling URL
 * הרץ: npx tsx scripts/convert-to-pooling-url.ts
 */

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL לא מוגדר!');
  console.log('הגדרי את DATABASE_URL ב-.env.local');
  process.exit(1);
}

console.log('🔍 ה-URL הקיים:');
console.log(dbUrl.substring(0, 50) + '...\n');

// בדיקה אם זה כבר Connection Pooling
if (dbUrl.includes('pooler.supabase.com') || dbUrl.includes(':6543')) {
  console.log('✅ ה-URL כבר משתמש ב-Connection Pooling!');
  process.exit(0);
}

// חילוץ חלקי ה-URL
const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!urlMatch) {
  console.error('❌ לא הצלחתי לפרש את ה-URL');
  console.log('ה-URL צריך להיות בפורמט: postgresql://user:password@host:port/database');
  process.exit(1);
}

const [, username, password, host, port, database] = urlMatch;

console.log('📋 פרטי ה-URL:');
console.log(`  Username: ${username}`);
console.log(`  Host: ${host}`);
console.log(`  Port: ${port}`);
console.log(`  Database: ${database}\n`);

// חילוץ project reference מה-host
const projectRefMatch = host.match(/db\.([^.]+)\.supabase\.co/);
if (!projectRefMatch) {
  console.error('❌ לא הצלחתי לזהות את project reference מה-URL');
  console.log('ה-URL צריך להיות מ-Supabase עם פורמט: db.[PROJECT-REF].supabase.co');
  process.exit(1);
}

const projectRef = projectRefMatch[1];
console.log(`✅ Project Reference: ${projectRef}\n`);

// יצירת Connection Pooling URLs עם כל ה-Regions האפשריים
const regions = [
  { name: 'אירופה מערב', code: 'eu-west-1' },
  { name: 'אירופה מרכז', code: 'eu-central-1' },
  { name: 'ארה"ב מזרח', code: 'us-east-1' },
  { name: 'ארה"ב מערב', code: 'us-west-1' },
  { name: 'אסיה דרום-מזרח', code: 'ap-southeast-1' },
  { name: 'אסיה דרום', code: 'ap-south-1' },
];

console.log('🔗 Connection Pooling URLs אפשריים:\n');

regions.forEach((region, index) => {
  const poolingUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-${region.code}.pooler.supabase.com:6543/${database}`;
  console.log(`${index + 1}. ${region.name} (${region.code}):`);
  console.log(`   ${poolingUrl}\n`);
});

console.log('📝 הוראות:');
console.log('1. בחרי את ה-URL שמתאים ל-Region שלך');
console.log('2. אם את לא יודעת מה ה-Region, נסי קודם את אירופה מערב (eu-west-1)');
console.log('3. עדכני את .env.local עם ה-URL שבחרת');
console.log('4. הרצי: npm run db:check\n');

console.log('💡 טיפ:');
console.log('כדי למצוא את ה-Region המדויק:');
console.log('- לך ל-Supabase Dashboard → Settings → General');
console.log('- חפשי "Region" או "Database Region"');

