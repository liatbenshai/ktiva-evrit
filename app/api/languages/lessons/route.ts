import { NextRequest, NextResponse } from 'next/server';
import { getLessons } from '@/lib/language-lessons';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;
    const level = searchParams.get('level') as LanguageLevel | null;
    const topic = searchParams.get('topic');
    const userId = searchParams.get('userId') || 'default-user';
    const includeProgress = searchParams.get('includeProgress') === 'true';

    // Get lessons from static data (no database needed)
    const lessons = await getLessons({
      targetLanguage: targetLanguage || undefined,
      level: level || undefined,
      topic: topic || undefined,
    });

    // Add progress if requested (still from database)
    let lessonsWithProgress = lessons;
    if (includeProgress) {
      try {
        const progressMap = new Map();
        const lessonIds = lessons.map(l => l.id);
        
        if (lessonIds.length > 0) {
          const progressRecords = await prisma.userLessonProgress.findMany({
            where: {
              userId,
              lessonId: { in: lessonIds },
            },
          });
          
          progressRecords.forEach(progress => {
            progressMap.set(progress.lessonId, progress);
          });
        }

        lessonsWithProgress = lessons.map(lesson => ({
          ...lesson,
          userProgress: progressMap.has(lesson.id) ? [progressMap.get(lesson.id)] : [],
        }));
      } catch (error) {
        // If progress fetch fails, just return lessons without progress
        console.warn('Failed to fetch progress, returning lessons without progress:', error);
        lessonsWithProgress = lessons.map(lesson => ({
          ...lesson,
          userProgress: [],
        }));
      }
    } else {
      lessonsWithProgress = lessons.map(lesson => ({
        ...lesson,
        userProgress: [],
      }));
    }

    // Group by topic for easier frontend consumption
    const groupedByTopic = lessonsWithProgress.reduce((acc, lesson) => {
      if (!acc[lesson.topic]) {
        acc[lesson.topic] = [];
      }
      acc[lesson.topic].push(lesson);
      return acc;
    }, {} as Record<string, typeof lessonsWithProgress>);

    return NextResponse.json({
      success: true,
      lessons: lessonsWithProgress,
      groupedByTopic,
    });
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת השיעורים',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

