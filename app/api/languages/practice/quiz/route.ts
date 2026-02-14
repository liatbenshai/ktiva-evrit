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

    // Create quiz questions with better distractors
    const questions = selectedTerms.map((term, index) => {
      // Get better distractors - similar length and from same language
      const similarTerms = allTerms
        .filter((t) => 
          t.translatedTerm !== term.translatedTerm &&
          t.translatedTerm.length > 0 &&
          Math.abs(t.translatedTerm.length - term.translatedTerm.length) <= 5
        )
        .map((t) => t.translatedTerm);
      
      const wrongAnswers = shuffleArray(similarTerms).slice(0, 3);
      
      // If we don't have enough similar terms, fill with any terms
      if (wrongAnswers.length < 3) {
        const additional = shuffleArray(
          allTerms
            .filter((t) => t.translatedTerm !== term.translatedTerm && !wrongAnswers.includes(t.translatedTerm))
            .map((t) => t.translatedTerm)
        ).slice(0, 3 - wrongAnswers.length);
        wrongAnswers.push(...additional);
      }

      const options = shuffleArray([term.translatedTerm, ...wrongAnswers.slice(0, 3)]);

      return {
        id: `q${index + 1}`,
        question: `מה התרגום של "${term.hebrewTerm}"?`,
        hebrewTerm: term.hebrewTerm,
        correctAnswer: term.translatedTerm,
        options: options.length >= 4 ? options : [...options, 'לא יודע'],
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

    // Calculate results with better validation
    let correctCount = 0;
    const results = answers.map((answer: any) => {
      // Normalize answers for comparison (trim, lowercase, remove extra spaces)
      const selected = (answer.selected || '').trim().toLowerCase();
      const correctAnswer = (answer.correct || '').trim().toLowerCase();
      
      // תיקון: השוואה מדויקת בלבד - includes גרם לfalse positives (למשל "hell" ⊆ "hello")
      const isCorrect = selected === correctAnswer;
      
      if (isCorrect) correctCount++;
      return {
        ...answer,
        isCorrect,
        feedback: isCorrect 
          ? 'נכון! כל הכבוד!' 
          : `לא נכון. התשובה הנכונה: ${answer.correct}`,
      };
    });

    const score = Math.round((correctCount / answers.length) * 100);

    // Provide feedback based on score
    let feedback = '';
    if (score >= 90) {
      feedback = 'מצוין! יש לך שליטה טובה בחומר.';
    } else if (score >= 80) {
      feedback = 'טוב מאוד! יש לך הבנה טובה, אבל כדאי לחזור על הנקודות החלשות.';
    } else if (score >= 70) {
      feedback = 'טוב. נסי לחזור על המילים הקשות ולשפר.';
    } else if (score >= 60) {
      feedback = 'מספיק. מומלץ לחזור על החומר ולשמור יותר מילים.';
    } else {
      feedback = 'צריך שיפור. מומלץ לחזור על השיעורים הבסיסיים ולשמור יותר מילים.';
    }

    return NextResponse.json({
      success: true,
      score,
      correct: correctCount,
      total: answers.length,
      results,
      feedback,
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

