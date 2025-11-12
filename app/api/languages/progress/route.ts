import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const targetLanguage = searchParams.get('targetLanguage');

    const where: any = { userId };
    if (targetLanguage) {
      where.lesson = {
        targetLanguage,
      };
    }

    const allProgress = await prisma.userLessonProgress.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            topic: true,
            level: true,
            targetLanguage: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalLessons = await prisma.lesson.count({
      where: {
        isPublished: true,
        ...(targetLanguage ? { targetLanguage } : {}),
      },
    });

    const completedLessons = allProgress.filter((p) => p.status === 'COMPLETED' || p.status === 'MASTERED').length;
    const inProgressLessons = allProgress.filter((p) => p.status === 'IN_PROGRESS').length;
    const needsReviewLessons = allProgress.filter((p) => p.needsReview).length;

    const averageScore = allProgress.length > 0
      ? Math.round(
          allProgress
            .filter((p) => p.score !== null)
            .reduce((sum, p) => sum + (p.score || 0), 0) /
            allProgress.filter((p) => p.score !== null).length
        )
      : 0;

    // Group by topic
    const progressByTopic = allProgress.reduce((acc, p) => {
      const topic = p.lesson.topic;
      if (!acc[topic]) {
        acc[topic] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          averageScore: 0,
        };
      }
      acc[topic].total += 1;
      if (p.status === 'COMPLETED' || p.status === 'MASTERED') {
        acc[topic].completed += 1;
      }
      if (p.status === 'IN_PROGRESS') {
        acc[topic].inProgress += 1;
      }
      if (p.score !== null) {
        acc[topic].averageScore = Math.round(
          (acc[topic].averageScore * (acc[topic].total - 1) + p.score) / acc[topic].total
        );
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number; inProgress: number; averageScore: number }>);

    // Lessons that need review
    const reviewLessons = allProgress
      .filter((p) => p.needsReview)
      .map((p) => ({
        id: p.lesson.id,
        title: p.lesson.title,
        topic: p.lesson.topic,
        score: p.score,
        lastReviewedAt: p.lastReviewedAt,
      }))
      .sort((a, b) => (a.lastReviewedAt?.getTime() || 0) - (b.lastReviewedAt?.getTime() || 0));

    return NextResponse.json({
      success: true,
      statistics: {
        totalLessons,
        completedLessons,
        inProgressLessons,
        needsReviewLessons,
        averageScore,
        completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
      progressByTopic,
      reviewLessons,
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת ההתקדמות',
        details: error.message || 'Unknown error',
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          meta: error.meta,
        }),
      },
      { status: 500 }
    );
  }
}

