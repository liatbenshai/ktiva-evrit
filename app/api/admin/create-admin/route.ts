import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
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
      
      return NextResponse.json({
        success: true,
        message: 'משתמש admin עודכן בהצלחה!',
        email,
        password,
      });
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

      return NextResponse.json({
        success: true,
        message: 'משתמש admin נוצר בהצלחה!',
        email,
        password,
        userId: user.id,
      });
    }
  } catch (error: any) {
    console.error('❌ שגיאה ביצירת משתמש admin:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'שגיאה ביצירת משתמש admin: ' + error.message 
      },
      { status: 500 }
    );
  }
}

