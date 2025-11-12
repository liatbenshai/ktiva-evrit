import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = new URL(req.url).searchParams.get('userId') || 'default-user';
    const lessonId = params.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        vocabulary: {
          orderBy: { order: 'asc' },
        },
        exercises: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        prerequisites: {
          select: {
            id: true,
            title: true,
            topic: true,
            level: true,
          },
        },
        userProgress: {
          where: { userId },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'שיעור לא נמצא' },
        { status: 404 }
      );
    }

    if (!lesson.isPublished) {
      return NextResponse.json(
        { success: false, error: 'שיעור זה עדיין לא זמין' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      lesson,
    });
  } catch (error: any) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת השיעור',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

