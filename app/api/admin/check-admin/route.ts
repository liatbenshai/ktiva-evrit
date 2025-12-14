import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const email = 'admin@ktiva-evrit.com';
    const password = 'admin123';

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
      },
    });

    if (!adminUser) {
      return NextResponse.json({
        exists: false,
        canLogin: false,
        error: 'משתמש Admin לא קיים במסד הנתונים',
      });
    }

    // Check if password is set and valid
    if (!adminUser.password) {
      return NextResponse.json({
        exists: true,
        canLogin: false,
        error: 'למשתמש Admin אין סיסמה מוגדרת',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password);

    if (!isValidPassword) {
      return NextResponse.json({
        exists: true,
        canLogin: false,
        error: 'סיסמת Admin לא תואמת (אולי שונתה ידנית)',
      });
    }

    return NextResponse.json({
      exists: true,
      canLogin: true,
      email: adminUser.email,
      name: adminUser.name,
      message: 'משתמש Admin קיים ומוכן להתחברות',
    });
  } catch (error: any) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      {
        exists: false,
        canLogin: false,
        error: 'שגיאה בבדיקה: ' + error.message,
      },
      { status: 500 }
    );
  }
}

