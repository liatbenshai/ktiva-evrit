import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    // Delete all lessons (cascade will delete vocabulary and exercises)
    const deletedCount = await prisma.lesson.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `נמחקו ${deletedCount.count} שיעורים בהצלחה`,
      deletedCount: deletedCount.count,
    });
  } catch (error: any) {
    console.error('Error deleting lessons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה במחיקת השיעורים',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

