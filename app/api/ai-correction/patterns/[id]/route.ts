import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * DELETE - מחיקת דפוס שנלמד
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.translationPattern.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'דפוס נמחק בהצלחה',
    });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    return NextResponse.json(
      { error: 'Failed to delete pattern' },
      { status: 500 }
    );
  }
}

