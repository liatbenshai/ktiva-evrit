import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@ktiva-evrit.com';
    const password = 'admin123';
    const name = 'מנהל מערכת';

    console.log('🔐 יוצר משתמש admin...');

    // בדיקה אם המשתמש כבר קיים
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  המשתמש כבר קיים. מעדכן סיסמה...');
      
      // עדכון סיסמה
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name,
        },
      });
      
      console.log('✅ משתמש admin עודכן בהצלחה!');
      console.log(`📧 אימייל: ${email}`);
      console.log(`🔑 סיסמה: ${password}`);
    } else {
      // יצירת משתמש חדש
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      console.log('✅ משתמש admin נוצר בהצלחה!');
      console.log(`📧 אימייל: ${email}`);
      console.log(`🔑 סיסמה: ${password}`);
      console.log(`🆔 ID: ${user.id}`);
    }
  } catch (error) {
    console.error('❌ שגיאה ביצירת משתמש admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

