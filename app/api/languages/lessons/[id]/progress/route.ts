import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = new URL(req.url).searchParams.get('userId') || 'default-user';
    const lessonId = params.id;

    const progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      progress: progress || null,
    });
  } catch (error: any) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת ההתקדמות',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await req.json();
    const {
      userId = 'default-user',
      status,
      score,
      needsReview,
    } = body;

    const lessonId = params.id;

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'שיעור לא נמצא' },
        { status: 404 }
      );
    }

    // Update or create progress
    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status: status || undefined,
        score: score !== undefined ? score : undefined,
        attempts: { increment: 1 },
        completedAt: status === 'COMPLETED' || status === 'MASTERED' ? new Date() : undefined,
        lastReviewedAt: new Date(),
        needsReview: needsReview !== undefined ? needsReview : undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        status: status || 'IN_PROGRESS',
        score: score !== undefined ? score : undefined,
        attempts: 1,
        completedAt: status === 'COMPLETED' || status === 'MASTERED' ? new Date() : undefined,
        lastReviewedAt: new Date(),
        needsReview: needsReview !== undefined ? needsReview : false,
      },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error: any) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בעדכון ההתקדמות',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

