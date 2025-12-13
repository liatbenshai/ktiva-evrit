import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';

interface AdvancedQuestion {
  id: string;
  type: 'translation' | 'open_translation' | 'fill_blank' | 'sentence_building' | 'comprehension';
  question: string;
  hebrewTerm?: string;
  correctAnswer: string;
  options?: string[];
  context?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;
    const difficulty = searchParams.get('difficulty') as 'EASY' | 'MEDIUM' | 'HARD' || 'MEDIUM';
    const count = parseInt(searchParams.get('count') || '10');

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'targetLanguage is required' },
        { status: 400 }
      );
    }

    // Get saved entries
    let savedEntries: any[] = [];
    try {
      savedEntries = await prisma.languageEntry.findMany({
        where: {
          userId,
          targetLanguage,
        },
        take: 100,
      });
    } catch (error: any) {
      console.warn('Failed to load saved entries:', error);
    }

    if (savedEntries.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'כדי להתחיל תרגול מתקדם, צריך לפחות 3 מונחים שמורים. שמרי מילים קודם.',
        },
        { status: 400 }
      );
    }

    // Generate diverse questions using AI
    const questions: AdvancedQuestion[] = [];
    const shuffledEntries = shuffleArray(savedEntries).slice(0, Math.min(count, savedEntries.length));

    for (let i = 0; i < shuffledEntries.length; i++) {
      const entry = shuffledEntries[i];
      const questionType = getQuestionType(i, shuffledEntries.length);

      if (questionType === 'open_translation') {
        // שאלה פתוחה - כתיבת תרגום
        questions.push({
          id: `q${i + 1}`,
          type: 'open_translation',
          question: `כתבי את התרגום של "${entry.hebrewTerm}" ב-${getLanguageLabel(targetLanguage)}:`,
          hebrewTerm: entry.hebrewTerm,
          correctAnswer: entry.translatedTerm,
          difficulty: difficulty,
          explanation: entry.culturalNotes || undefined,
        });
      } else if (questionType === 'fill_blank') {
        // שאלת השלמה
        const example = entry.usageExamples && Array.isArray(entry.usageExamples) && entry.usageExamples.length > 0
          ? JSON.parse(entry.usageExamples as any)[0]
          : null;
        
        if (example && example.target) {
          const sentence = example.target;
          const blanked = sentence.replace(new RegExp(entry.translatedTerm, 'gi'), '______');
          
          questions.push({
            id: `q${i + 1}`,
            type: 'fill_blank',
            question: `השלימי את המילה החסרה במשפט: "${blanked}"`,
            context: example.hebrew || entry.hebrewTerm,
            correctAnswer: entry.translatedTerm,
            difficulty: difficulty,
            explanation: `המשפט המלא: "${sentence}"`,
          });
        }
      } else if (questionType === 'sentence_building') {
        // בניית משפט
        const example = entry.usageExamples && Array.isArray(entry.usageExamples) && entry.usageExamples.length > 0
          ? JSON.parse(entry.usageExamples as any)[0]
          : null;
        
        if (example) {
          questions.push({
            id: `q${i + 1}`,
            type: 'sentence_building',
            question: `בני משפט ב-${getLanguageLabel(targetLanguage)} שמשתמש במילה "${entry.translatedTerm}"`,
            context: example.hebrew || entry.hebrewTerm,
            correctAnswer: example.target || entry.translatedTerm,
            difficulty: difficulty,
            explanation: `דוגמה: "${example.target || entry.translatedTerm}"`,
          });
        }
      } else {
        // שאלת multiple choice רגילה (אבל עם תשובות טובות יותר)
        const wrongAnswers = getBetterDistractors(entry, savedEntries, targetLanguage);
        const options = shuffleArray([entry.translatedTerm, ...wrongAnswers]);

        questions.push({
          id: `q${i + 1}`,
          type: 'translation',
          question: `מה התרגום של "${entry.hebrewTerm}"?`,
          hebrewTerm: entry.hebrewTerm,
          correctAnswer: entry.translatedTerm,
          options,
          difficulty: difficulty,
          explanation: entry.culturalNotes || undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      questions,
      total: questions.length,
    });
  } catch (error: any) {
    console.error('Error creating advanced quiz:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה ביצירת תרגול מתקדם',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, userId = 'default-user', questions } = body;

    if (!answers || !Array.isArray(answers) || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: 'answers and questions arrays are required' },
        { status: 400 }
      );
    }

    // Evaluate answers with AI for open-ended questions
    const results = await Promise.all(
      answers.map(async (answer: any, index: number) => {
        const question = questions[index];
        let isCorrect = false;
        let feedback = '';

        if (question.type === 'open_translation' || question.type === 'sentence_building') {
          // Use AI to check open-ended answers
          const evaluation = await evaluateAnswer(
            answer.userAnswer || '',
            question.correctAnswer,
            question.hebrewTerm || '',
            question.type
          );
          isCorrect = evaluation.isCorrect;
          feedback = evaluation.feedback;
        } else {
          // Simple comparison for multiple choice and fill blank
          const userAnswer = (answer.userAnswer || '').trim().toLowerCase();
          const correctAnswer = question.correctAnswer.trim().toLowerCase();
          isCorrect = userAnswer === correctAnswer || 
                     userAnswer.includes(correctAnswer) || 
                     correctAnswer.includes(userAnswer);
        }

        return {
          questionId: answer.questionId,
          userAnswer: answer.userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          feedback: feedback || (isCorrect ? 'נכון! כל הכבוד!' : `לא נכון. התשובה הנכונה: ${question.correctAnswer}`),
          explanation: question.explanation,
        };
      })
    );

    const correct = results.filter((r) => r.isCorrect).length;
    const score = Math.round((correct / results.length) * 100);

    return NextResponse.json({
      success: true,
      score,
      correct,
      total: results.length,
      results,
      feedback: getOverallFeedback(score),
    });
  } catch (error: any) {
    console.error('Error evaluating quiz:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בבדיקת התשובות',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

async function evaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  context: string,
  questionType: string
): Promise<{ isCorrect: boolean; feedback: string }> {
  try {
    const prompt = `אתה בודק תשובות של תלמיד שמתרגל שפה.

השאלה: ${context}
התשובה הנכונה: ${correctAnswer}
התשובה של התלמיד: ${userAnswer}

בדוק אם התשובה של התלמיד נכונה או קרובה מספיק. תן ציון "נכון" אם:
1. התשובה זהה או כמעט זהה
2. התשובה נכונה דקדוקית גם אם יש שינוי קל בניסוח
3. התשובה מכילה את המילה/ביטוי הנכון גם אם יש מילים נוספות

החזר JSON בלבד:
{
  "isCorrect": true/false,
  "feedback": "משוב קצר בעברית - אם נכון: שבח, אם לא: הסבר מה היה צריך להיות"
}`;

    const response = await generateText({
      prompt,
      systemPrompt: 'אתה מורה לשפות שבודק תשובות בצורה הוגנת ומעודדת.',
      maxTokens: 200,
      temperature: 0.3,
    });

    const trimmed = response.trim();
    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}') + 1;
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd));

    return {
      isCorrect: parsed.isCorrect === true,
      feedback: parsed.feedback || '',
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    // Fallback to simple comparison
    const userLower = userAnswer.trim().toLowerCase();
    const correctLower = correctAnswer.trim().toLowerCase();
    return {
      isCorrect: userLower === correctLower || userLower.includes(correctLower),
      feedback: userLower === correctLower ? 'נכון! כל הכבוד!' : `לא נכון. התשובה הנכונה: ${correctAnswer}`,
    };
  }
}

function getQuestionType(index: number, total: number): string {
  const types = ['translation', 'open_translation', 'fill_blank', 'sentence_building'];
  // Distribute question types evenly
  const typeIndex = Math.floor((index / total) * types.length);
  return types[typeIndex] || 'translation';
}

function getBetterDistractors(
  entry: any,
  allEntries: any[],
  targetLanguage: SupportedLanguageKey
): string[] {
  // Get distractors that are similar but not the same
  const similarEntries = allEntries
    .filter((e) => e.id !== entry.id && e.translatedTerm !== entry.translatedTerm)
    .map((e) => e.translatedTerm)
    .filter((term) => term && term.length > 0);

  // Try to get terms that start with the same letter or have similar length
  const similarLength = similarEntries.filter(
    (term) => Math.abs(term.length - entry.translatedTerm.length) <= 3
  );

  const shuffled = shuffleArray(similarLength.length > 0 ? similarLength : similarEntries);
  return shuffled.slice(0, 3);
}

function getLanguageLabel(lang: SupportedLanguageKey): string {
  const labels: Record<SupportedLanguageKey, string> = {
    english: 'אנגלית',
    romanian: 'רומנית',
    italian: 'איטלקית',
    french: 'צרפתית',
    russian: 'רוסית',
  };
  return labels[lang] || lang;
}

function getOverallFeedback(score: number): string {
  if (score >= 90) return 'מצוין! יש לך שליטה טובה בחומר.';
  if (score >= 80) return 'טוב מאוד! יש לך הבנה טובה, אבל כדאי לחזור על הנקודות החלשות.';
  if (score >= 70) return 'טוב. נסי לחזור על המילים הקשות ולשפר.';
  if (score >= 60) return 'מספיק. מומלץ לחזור על החומר ולשמור יותר מילים.';
  return 'צריך שיפור. מומלץ לחזור על השיעורים הבסיסיים ולשמור יותר מילים.';
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

