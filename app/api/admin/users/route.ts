import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Helper function to check if user is admin
function isAdminUser(email: string | null | undefined): boolean {
  return email === 'admin@ktiva-evrit.com';
}

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
    if (!isAdminUser(session.user.email)) {
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
      passwordHash: user.password ? `${user.password.substring(0, 10)}...` : null, // Show first 10 chars of hash (just for identification)
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isAdmin: isAdminUser(user.email),
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

export async function DELETE(req: NextRequest) {
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
    if (!isAdminUser(session.user.email)) {
      return NextResponse.json(
        { error: 'אין הרשאה - רק אדמין יכול למחוק משתמשים' },
        { status: 403 }
      );
    }

    // Get user ID from request body
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'נא לספק ID של משתמש למחיקה' },
        { status: 400 }
      );
    }

    // Get the user to be deleted
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'משתמש לא נמצא' },
        { status: 404 }
      );
    }

    // Prevent deleting admin user
    if (isAdminUser(userToDelete.email)) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק את משתמש האדמין' },
        { status: 403 }
      );
    }

    // Prevent deleting yourself
    if (userToDelete.email === session.user.email) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק את עצמך' },
        { status: 403 }
      );
    }

    // Delete user (cascade will delete related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: `משתמש ${userToDelete.email} נמחק בהצלחה`,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת משתמש: ' + error.message },
      { status: 500 }
    );
  }
}

