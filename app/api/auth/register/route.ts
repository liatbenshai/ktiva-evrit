import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    // בדיקה אם המשתמש כבר קיים
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'משתמש עם אימייל זה כבר קיים' },
        { status: 400 }
      );
    }

    // הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(password, 10);

    // יצירת משתמש חדש
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      message: 'המשתמש נוצר בהצלחה',
    });
  } catch (error: any) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה ביצירת משתמש: ' + error.message },
      { status: 500 }
    );
  }
}

