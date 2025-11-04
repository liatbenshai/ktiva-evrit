import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST - שמירה נקודתית של דפוס תיקון אחד
 * זה נקרא כשמשנים דבר אחד (מילה, ביטוי) ולא כל הטקסט
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      originalText,
      correctedText,
      userId = 'default-user',
    } = body;

    if (!originalText || !correctedText) {
      return NextResponse.json(
        { error: 'originalText and correctedText are required' },
        { status: 400 }
      );
    }

    if (originalText === correctedText) {
      return NextResponse.json(
        { error: 'No change detected' },
        { status: 400 }
      );
    }

    // בדיקה אם הדפוס כבר קיים
    const existingPattern = await prisma.translationPattern.findFirst({
      where: {
        userId,
        badPattern: originalText,
        goodPattern: correctedText,
      },
    });

    if (existingPattern) {
      // עדכון דפוס קיים
      const updated = await prisma.translationPattern.update({
        where: { id: existingPattern.id },
        data: {
          occurrences: existingPattern.occurrences + 1,
          confidence: Math.min(1.0, existingPattern.confidence + 0.1),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        pattern: {
          from: updated.badPattern,
          to: updated.goodPattern,
          confidence: updated.confidence,
          occurrences: updated.occurrences,
        },
        message: 'דפוס עודכן בהצלחה',
      });
    } else {
      // יצירת דפוס חדש
      const newPattern = await prisma.translationPattern.create({
        data: {
          userId,
          badPattern: originalText,
          goodPattern: correctedText,
          patternType: 'ai-style', // דפוסים ספציפיים לניסוחי AI
          occurrences: 1,
          confidence: 0.8, // ביטחון התחלתי גבוה כי המשתמש בחר את זה במפורש
        },
      });

      return NextResponse.json({
        success: true,
        pattern: {
          from: newPattern.badPattern,
          to: newPattern.goodPattern,
          confidence: newPattern.confidence,
          occurrences: newPattern.occurrences,
        },
        message: 'דפוס נשמר בהצלחה',
      });
    }
  } catch (error: any) {
    console.error('Error saving pattern:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        }
      : 'An error occurred while saving the pattern';
    
    return NextResponse.json(
      { 
        error: 'Failed to save pattern',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

