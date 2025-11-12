import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;
    const level = searchParams.get('level') as LanguageLevel | null;
    const topic = searchParams.get('topic');
    const userId = searchParams.get('userId') || 'default-user';
    const includeProgress = searchParams.get('includeProgress') === 'true';

    const where: any = {
      isPublished: true,
    };

    if (targetLanguage) {
      where.targetLanguage = targetLanguage;
    }
    if (level) {
      where.level = level;
    }
    if (topic) {
      where.topic = topic;
    }

    // Try to fetch lessons with better error handling
    let lessons;
    try {
      lessons = await prisma.lesson.findMany({
        where,
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
          ...(includeProgress && {
            userProgress: {
              where: { userId },
            },
          }),
        },
        orderBy: [
          { topic: 'asc' },
          { order: 'asc' },
        ],
      });
    } catch (prismaError: any) {
      console.error('Prisma error details:', {
        code: prismaError.code,
        message: prismaError.message,
        meta: prismaError.meta,
      });
      throw prismaError;
    }

    // Group by topic for easier frontend consumption
    const groupedByTopic = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.topic]) {
        acc[lesson.topic] = [];
      }
      acc[lesson.topic].push(lesson);
      return acc;
    }, {} as Record<string, typeof lessons>);

    return NextResponse.json({
      success: true,
      lessons,
      groupedByTopic,
    });
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת השיעורים',
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

