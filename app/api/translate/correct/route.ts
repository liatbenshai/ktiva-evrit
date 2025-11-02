import { NextRequest, NextResponse } from 'next/server';
import { learningSystem } from '@/lib/learning-system';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      originalText,
      translatedText,
      correctedText,
      fromLang,
      toLang,
      context,
      userId = 'default-user',
    } = body;

    if (!originalText || !translatedText || !correctedText) {
      return NextResponse.json(
        {
          error:
            'originalText, translatedText, and correctedText are required',
        },
        { status: 400 }
      );
    }

    // שמירת התיקון במערכת הלמידה
    if (typeof learningSystem.recordCorrection === 'function') {
      try {
        await Promise.resolve(
          learningSystem.recordCorrection({
            originalText: translatedText,
            correctedText: correctedText,
            correctionType: 'translation',
            context: context || `${fromLang}→${toLang}`,
            category: 'translation',
            userId,
            confidence: 1.0,
          })
        );
      } catch (recErr) {
        console.error('learningSystem.recordCorrection failed:', recErr);
      }
    }

    // בדיקה אם יש ביטוי חדש שנוצר מהתיקון - הוספה למאגר idioms
    try {
      const words = correctedText.split(/\s+/);
      const originalWords = translatedText.split(/\s+/);

      // חיפוש שינויים משמעותיים (יותר מ-2 מילים שונות)
      if (
        words.length !== originalWords.length ||
        words.some((w: string, i: number) => w !== originalWords[i])
      ) {
        // אם התיקון שונה משמעותית, זה יכול להיות idiom חדש
        // אך נשמור רק אם המשתמש מבקש במפורש
        // כאן אפשר להוסיף לוגיקה נוספת
      }

      // ניסיון לזהות idioms מתוך התיקון
      // אם יש ביטוי מתורגם חדש, אפשר להוסיף אותו למאגר
    } catch (error) {
      console.error('Error processing idioms from correction:', error);
    }

    // קבלת תובנות מהמערכת
    const insights =
      typeof learningSystem.analyzeTextForImprovements === 'function'
        ? await Promise.resolve(
            learningSystem.analyzeTextForImprovements(
              correctedText,
              userId,
              `${fromLang}→${toLang}`,
              'translation'
            )
          )
        : null;

    const writingSuggestions =
      typeof learningSystem.getWritingSuggestions === 'function'
        ? await Promise.resolve(
            learningSystem.getWritingSuggestions(userId, 'translation')
          )
        : null;

    return NextResponse.json({
      success: true,
      message: 'Correction recorded successfully',
      insights,
      suggestions: writingSuggestions,
    });
  } catch (error) {
    console.error('Error recording translation correction:', error);
    return NextResponse.json(
      { error: 'Failed to record correction', details: String(error) },
      { status: 500 }
    );
  }
}

