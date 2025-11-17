import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Check if user has a password (for users created before password system)
    if (!user.password) {
      return NextResponse.json(
        { error: 'למשתמש זה אין סיסמה. אנא צור סיסמה חדשה' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Set auth cookie
    await setAuthCookie({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}

