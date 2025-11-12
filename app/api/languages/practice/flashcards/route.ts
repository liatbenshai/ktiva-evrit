import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;
    const topic = searchParams.get('topic');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'targetLanguage is required' },
        { status: 400 }
      );
    }

    // Get vocabulary from lessons
    const where: any = {
      lesson: {
        targetLanguage,
        isPublished: true,
      },
    };

    if (topic) {
      where.lesson.topic = topic;
    }

    let vocabulary = [];
    try {
      vocabulary = await prisma.lessonVocabulary.findMany({
        where,
        include: {
          lesson: {
            select: {
              topic: true,
              level: true,
            },
          },
        },
        take: limit,
        orderBy: {
          order: 'asc',
        },
      });
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('LessonVocabulary table does not exist yet');
        vocabulary = [];
      } else {
        throw error;
      }
    }

    // Also get from saved language entries
    let savedEntries = [];
    try {
      savedEntries = await prisma.languageEntry.findMany({
        where: {
          userId,
          targetLanguage,
        },
        take: limit,
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error: any) {
      console.warn('Failed to load saved entries:', error);
    }

    // Combine and format flashcards
    const flashcards = [
      ...vocabulary.map((vocab) => ({
        id: vocab.id,
        hebrewTerm: vocab.hebrewTerm,
        translatedTerm: vocab.translatedTerm,
        pronunciation: vocab.pronunciation,
        usageExample: vocab.usageExample ? JSON.parse(vocab.usageExample) : null,
        notes: vocab.notes,
        topic: vocab.lesson.topic,
        level: vocab.lesson.level,
        source: 'lesson' as const,
      })),
      ...savedEntries.map((entry) => ({
        id: entry.id,
        hebrewTerm: entry.hebrewTerm,
        translatedTerm: entry.translatedTerm,
        pronunciation: entry.pronunciation,
        usageExample: entry.usageExamples ? JSON.parse(entry.usageExamples)[0] : null,
        notes: entry.notes,
        topic: 'saved',
        level: 'BEGINNER' as const,
        source: 'saved' as const,
      })),
    ];

    // Shuffle flashcards
    const shuffled = flashcards.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      flashcards: shuffled.slice(0, limit),
      total: shuffled.length,
    });
  } catch (error: any) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת כרטיסיות',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

