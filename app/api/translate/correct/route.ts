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

    // שמירת תיקון כ-TranslationPattern ל-DB - כדי שנלמד ממנו בתרגומים הבאים
    try {
      if (translatedText.trim() !== correctedText.trim()) {
        const existing = await prisma.translationPattern.findFirst({
          where: {
            userId,
            badPattern: translatedText.trim().substring(0, 200),
            goodPattern: correctedText.trim().substring(0, 200),
          },
        });

        if (existing) {
          await prisma.translationPattern.update({
            where: { id: existing.id },
            data: {
              occurrences: existing.occurrences + 1,
              confidence: Math.min(1.0, existing.confidence + 0.05),
            },
          });
        } else {
          await prisma.translationPattern.create({
            data: {
              userId,
              badPattern: translatedText.trim().substring(0, 200),
              goodPattern: correctedText.trim().substring(0, 200),
              patternType: 'translation',
              confidence: 0.8,
              occurrences: 1,
              context: `${fromLang}→${toLang}`,
            },
          });
        }
      }
    } catch (dbError) {
      console.error('Error saving translation correction to DB:', dbError);
      // ממשיכים - השמירה לא קריטית
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

