import { NextRequest, NextResponse } from 'next/server';
import { getLessonById } from '@/lib/language-lessons';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = new URL(req.url).searchParams.get('userId') || 'default-user';
    const lessonId = params.id;

    // Get lesson from static data
    const lesson = await getLessonById(lessonId);

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

    // Add progress if available (still from database)
    let lessonWithProgress = lesson;
    try {
      const progress = await prisma.userLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: lesson.id,
          },
        },
      });

      lessonWithProgress = {
        ...lesson,
        userProgress: progress ? [progress] : [],
        prerequisites: [], // No prerequisites in static lessons for now
      };
    } catch (error) {
      // If progress fetch fails, just return lesson without progress
      console.warn('Failed to fetch progress:', error);
      lessonWithProgress = {
        ...lesson,
        userProgress: [],
        prerequisites: [],
      };
    }

    return NextResponse.json({
      success: true,
      lesson: lessonWithProgress,
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

