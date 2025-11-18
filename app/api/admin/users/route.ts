import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'לא מאומת' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = session.user.email === 'admin@ktiva-evrit.com';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'אין הרשאה - רק אדמין יכול לראות משתמשים' },
        { status: 403 }
      );
    }

    // Get all users with full details (including password hash for admin)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true, // Include password hash for admin
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format users with additional info
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordHash: user.password ? `${user.password.substring(0, 20)}...` : null, // Show first 20 chars of hash
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isAdmin: user.email === 'admin@ktiva-evrit.com',
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת משתמשים: ' + error.message },
      { status: 500 }
    );
  }
}

