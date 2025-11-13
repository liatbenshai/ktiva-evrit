import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;
    const topic = searchParams.get('topic');
    const count = parseInt(searchParams.get('count') || '10');

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

    let allVocabulary: any[] = [];
    try {
      allVocabulary = await prisma.lessonVocabulary.findMany({
        where,
        include: {
          lesson: {
            select: {
              topic: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('LessonVocabulary table does not exist yet');
        allVocabulary = [];
      } else {
        throw error;
      }
    }

    // Also get from saved entries
    let savedEntries: any[] = [];
    try {
      savedEntries = await prisma.languageEntry.findMany({
        where: {
          userId,
          targetLanguage,
        },
      });
    } catch (error: any) {
      console.warn('Failed to load saved entries:', error);
    }

    // Combine all terms
    const allTerms = [
      ...allVocabulary.map((v) => ({
        hebrewTerm: v.hebrewTerm,
        translatedTerm: v.translatedTerm,
        topic: v.lesson.topic,
      })),
      ...savedEntries.map((e) => ({
        hebrewTerm: e.hebrewTerm,
        translatedTerm: e.translatedTerm,
        topic: 'saved',
      })),
    ];

    // Select random terms for quiz
    const selectedTerms = shuffleArray(allTerms).slice(0, Math.min(count, allTerms.length));

    // Create quiz questions
    const questions = selectedTerms.map((term, index) => {
      // Get wrong answers (distractors)
      const wrongAnswers = shuffleArray(
        allTerms
          .filter((t) => t.translatedTerm !== term.translatedTerm)
          .map((t) => t.translatedTerm)
      ).slice(0, 3);

      const options = shuffleArray([term.translatedTerm, ...wrongAnswers]);

      return {
        id: `q${index + 1}`,
        question: `מה התרגום של "${term.hebrewTerm}"?`,
        hebrewTerm: term.hebrewTerm,
        correctAnswer: term.translatedTerm,
        options,
        topic: term.topic,
      };
    });

    return NextResponse.json({
      success: true,
      questions,
      total: questions.length,
    });
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה ביצירת חידון',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, userId = 'default-user' } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: 'answers array is required' },
        { status: 400 }
      );
    }

    // Calculate results
    let correct = 0;
    const results = answers.map((answer: any) => {
      const isCorrect = answer.selected === answer.correct;
      if (isCorrect) correct++;
      return {
        ...answer,
        isCorrect,
      };
    });

    const score = Math.round((correct / answers.length) * 100);

    // Save quiz results (optional - could track in database)
    // For now, just return results

    return NextResponse.json({
      success: true,
      score,
      correct,
      total: answers.length,
      results,
    });
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בשליחת החידון',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

