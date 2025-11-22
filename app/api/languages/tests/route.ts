import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface TestQuestion {
  id: string;
  question: string;
  hebrewTerm: string;
  correctAnswer: string;
  options: string[];
  type: 'translation' | 'fill_blank' | 'sentence_order' | 'listening';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
}

/**
 * GET - קבלת מבחן מובנה לפי רמה
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;
    const level = searchParams.get('level') as LanguageLevel | null;
    const topic = searchParams.get('topic');
    const count = parseInt(searchParams.get('count') || '20');

    if (!targetLanguage || !level) {
      return NextResponse.json(
        { success: false, error: 'targetLanguage and level are required' },
        { status: 400 }
      );
    }

    // קביעת רמת קושי לפי רמת הלימוד
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
    if (level === 'INTERMEDIATE') {
      difficulty = 'MEDIUM';
    } else if (level === 'ADVANCED') {
      difficulty = 'HARD';
    }

    // קביעת נושאים לפי רמה
    const topicsByLevel: Record<LanguageLevel, string[]> = {
      BEGINNER: ['היכרות', 'אוכל', 'בית', 'משפחה', 'צבעים', 'מספרים'],
      INTERMEDIATE: ['עבודה', 'נסיעות', 'בריאות', 'פעלים', 'תארים', 'רגשות'],
      ADVANCED: ['מדע', 'טבע', 'טכנולוגיה', 'תרבות', 'פוליטיקה', 'כלכלה'],
    };

    const relevantTopics = topic ? [topic] : topicsByLevel[level];

    // קבלת אוצר מילים מהשיעורים
    const where: any = {
      lesson: {
        targetLanguage,
        level,
        isPublished: true,
        ...(topic ? { topic } : { topic: { in: relevantTopics } }),
      },
    };

    let allVocabulary: any[] = [];
    try {
      allVocabulary = await prisma.lessonVocabulary.findMany({
        where,
        include: {
          lesson: {
            select: {
              topic: true,
              level: true,
            },
          },
        },
        take: 100, // הגבלה למניעת עומס
      });
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('LessonVocabulary table does not exist yet');
        allVocabulary = [];
      } else {
        throw error;
      }
    }

    // גם מקבלים מילים שנשמרו
    let savedEntries: any[] = [];
    try {
      savedEntries = await prisma.languageEntry.findMany({
        where: {
          userId,
          targetLanguage,
        },
        take: 50,
      });
    } catch (error: any) {
      console.warn('Failed to load saved entries:', error);
    }

    // שילוב כל המילים
    const allTerms = [
      ...allVocabulary.map((v) => ({
        hebrewTerm: v.hebrewTerm,
        translatedTerm: v.translatedTerm,
        topic: v.lesson.topic,
        difficulty: v.difficulty,
        isSentence: v.isSentence || false,
      })),
      ...savedEntries.map((e) => ({
        hebrewTerm: e.hebrewTerm,
        translatedTerm: e.translatedTerm,
        topic: 'saved',
        difficulty: 'EASY' as const,
        isSentence: false,
      })),
    ];

    if (allTerms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'לא נמצאו מילים למבחן. נא להוסיף שיעורים או מילים קודם.',
        },
        { status: 404 }
      );
    }

    // יצירת שאלות למבחן
    const questions: TestQuestion[] = [];
    const selectedTerms = allTerms.slice(0, Math.min(count, allTerms.length));

    for (let i = 0; i < selectedTerms.length; i++) {
      const term = selectedTerms[i];

      // קבלת תשובות שגויות (distractors)
      const wrongAnswers = allTerms
        .filter((t) => t.translatedTerm !== term.translatedTerm)
        .map((t) => t.translatedTerm)
        .slice(0, 3);

      const options = shuffleArray([term.translatedTerm, ...wrongAnswers]);

      questions.push({
        id: `q${i + 1}`,
        question: `מה התרגום של "${term.hebrewTerm}"?`,
        hebrewTerm: term.hebrewTerm,
        correctAnswer: term.translatedTerm,
        options,
        type: 'translation',
        difficulty: term.difficulty || difficulty,
        topic: term.topic,
      });
    }

    return NextResponse.json({
      success: true,
      test: {
        level,
        targetLanguage,
        topic: topic || 'כללי',
        totalQuestions: questions.length,
        questions,
        estimatedTime: Math.ceil(questions.length * 0.5), // דקה וחצי לשאלה
      },
    });
  } catch (error: any) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה ביצירת מבחן',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - שליחת תשובות למבחן
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, userId = 'default-user', level, targetLanguage } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: 'answers array is required' },
        { status: 400 }
      );
    }

    // חישוב תוצאות
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
    const grade = getGrade(score);

    // שמירת תוצאות (אופציונלי - ניתן להוסיף טבלה במסד הנתונים)

    return NextResponse.json({
      success: true,
      score,
      correct,
      total: answers.length,
      grade,
      percentage: score,
      results,
      feedback: getFeedback(score, level),
    });
  } catch (error: any) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בשליחת המבחן',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getGrade(score: number): string {
  if (score >= 90) return 'מצוין';
  if (score >= 80) return 'טוב מאוד';
  if (score >= 70) return 'טוב';
  if (score >= 60) return 'מספיק';
  return 'נדרש שיפור';
}

function getFeedback(score: number, level?: string): string {
  if (score >= 90) {
    return `כל הכבוד! ציון מצוין. אתה מוכן לעבור לרמה הבאה.`;
  }
  if (score >= 80) {
    return `ציון טוב מאוד! יש לך הבנה טובה של החומר.`;
  }
  if (score >= 70) {
    return `ציון טוב. נסה לחזור על החומר ולשפר את הנקודות החלשות.`;
  }
  if (score >= 60) {
    return `ציון מספיק. מומלץ לחזור על השיעורים ולעבוד על החומר.`;
  }
  return `ציון נמוך. מומלץ לחזור על השיעורים הבסיסיים ולשפר את הידע.`;
}

