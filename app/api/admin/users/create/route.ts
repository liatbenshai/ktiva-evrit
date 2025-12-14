import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Helper function to check if user is admin
function isAdminUser(email: string | null | undefined): boolean {
  return email === 'admin@ktiva-evrit.com';
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'לא מאומת' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!isAdminUser(session.user.email)) {
      return NextResponse.json(
        { success: false, error: 'אין הרשאה - רק אדמין יכול ליצור משתמשים' },
        { status: 403 }
      );
    }

    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'פורמט אימייל לא תקין' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'סיסמה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'משתמש עם אימייל זה כבר קיים' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
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
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה ביצירת משתמש: ' + error.message },
      { status: 500 }
    );
  }
}

