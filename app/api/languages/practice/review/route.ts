import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';

// Spaced repetition algorithm - words that need review based on last review time and score
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'targetLanguage is required' },
        { status: 400 }
      );
    }

    // Get user progress for lessons
    let progressItems: any[] = [];
    try {
      progressItems = await prisma.userLessonProgress.findMany({
        where: {
          userId,
          lesson: {
            targetLanguage,
            isPublished: true,
          },
          OR: [
            { needsReview: true },
            { status: 'IN_PROGRESS' },
            { score: { lt: 80 } },
          ],
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              topic: true,
              level: true,
            },
          },
        },
        orderBy: [
          { lastReviewedAt: 'asc' },
          { updatedAt: 'asc' },
        ],
        take: 10,
      });
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('UserLessonProgress table does not exist yet');
        progressItems = [];
      } else {
        throw error;
      }
    }

    // Get vocabulary from lessons that need review
    const lessonIds = progressItems.map((p: any) => p.lessonId);
    let vocabularyToReview: any[] = [];
    
    if (lessonIds.length > 0) {
      try {
        vocabularyToReview = await prisma.lessonVocabulary.findMany({
          where: {
            lessonId: { in: lessonIds },
          },
          include: {
            lesson: {
              select: {
                topic: true,
                level: true,
              },
            },
          },
        });
      } catch (error: any) {
        console.warn('Failed to load vocabulary for review:', error);
      }
    }

    // Get saved entries that might need review (older entries)
    let savedEntriesToReview: any[] = [];
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      savedEntriesToReview = await prisma.languageEntry.findMany({
        where: {
          userId,
          targetLanguage,
          updatedAt: { lte: thirtyDaysAgo },
        },
        take: 20,
        orderBy: {
          updatedAt: 'asc',
        },
      });
    } catch (error: any) {
      console.warn('Failed to load saved entries for review:', error);
    }

    // Combine and format review items
    const reviewItems = [
      ...vocabularyToReview.map((vocab) => ({
        id: vocab.id,
        type: 'vocabulary' as const,
        hebrewTerm: vocab.hebrewTerm,
        translatedTerm: vocab.translatedTerm,
        pronunciation: vocab.pronunciation,
        usageExample: vocab.usageExample ? JSON.parse(vocab.usageExample) : null,
        topic: vocab.lesson.topic,
        level: vocab.lesson.level,
        priority: 'high' as const,
      })),
      ...savedEntriesToReview.map((entry) => ({
        id: entry.id,
        type: 'saved' as const,
        hebrewTerm: entry.hebrewTerm,
        translatedTerm: entry.translatedTerm,
        pronunciation: entry.pronunciation,
        usageExample: entry.usageExamples ? JSON.parse(entry.usageExamples)[0] : null,
        topic: 'saved',
        level: 'BEGINNER' as const,
        priority: 'medium' as const,
      })),
    ];

    return NextResponse.json({
      success: true,
      reviewItems: reviewItems.slice(0, 30),
      total: reviewItems.length,
      lessonsNeedingReview: progressItems.map((p) => ({
        id: p.lesson.id,
        title: p.lesson.title,
        topic: p.lesson.topic,
        score: p.score,
        lastReviewedAt: p.lastReviewedAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching review items:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת מילים לחזרה',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, itemType, isCorrect, userId = 'default-user' } = body;

    // Update review status
    if (itemType === 'saved') {
      try {
        await prisma.languageEntry.update({
          where: { id: itemId },
          data: {
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.warn('Failed to update saved entry:', error);
      }
    }

    // Could also track review history in a separate table
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'סטטוס החזרה עודכן',
    });
  } catch (error: any) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בעדכון סטטוס החזרה',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

