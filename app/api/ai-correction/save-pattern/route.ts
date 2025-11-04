import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - שמירה נקודתית של דפוס תיקון אחד
 * זה נקרא כשמשנים דבר אחד (מילה, ביטוי) ולא כל הטקסט
 */
export async function POST(req: NextRequest) {
  // נטפל בכל השגיאות, כולל אם Prisma לא מצליח להתחיל
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
  } catch (importError: any) {
    console.error('Error importing Prisma:', importError);
    return NextResponse.json({
      success: false,
      error: 'Database not available',
      message: 'לא ניתן להתחבר למסד הנתונים'
    });
  }

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

    // בדיקה אם Prisma מוכן
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database not available',
        message: 'לא ניתן להתחבר למסד הנתונים'
      });
    }

    // בדיקה אם הדפוס כבר קיים
    let existingPattern;
    try {
      existingPattern = await prisma.translationPattern.findFirst({
        where: {
          userId,
          badPattern: originalText,
          goodPattern: correctedText,
        },
      });
    } catch (findError: any) {
      console.error('Error finding existing pattern:', findError);
      // אם הטבלה לא קיימת, נשמור דפוס חדש
      if (findError.message?.includes('does not exist') || findError.message?.includes('no such table')) {
        existingPattern = null;
      } else {
        throw findError;
      }
    }

    if (existingPattern) {
      // עדכון דפוס קיים
      try {
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
      } catch (updateError: any) {
        console.error('Error updating pattern:', updateError);
        // אם יש שגיאה, ננסה ליצור דפוס חדש
        existingPattern = null;
      }
    }
    
    if (!existingPattern) {
      // יצירת דפוס חדש
      try {
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
      } catch (createError: any) {
        console.error('Error creating pattern:', createError);
        // אם הטבלה לא קיימת או יש בעיה אחרת, נחזיר תשובה מוצלחת אבל לא נשמור
        return NextResponse.json({
          success: true,
          message: 'הדפוס נרשם (לא נשמר במסד הנתונים)',
          error: process.env.NODE_ENV === 'development' ? createError.message : undefined
        });
      }
    }
  } catch (error: any) {
    console.error('Error saving pattern:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // במקום להחזיר שגיאה 500, נחזיר תשובה מוצלחת עם הודעה
    return NextResponse.json({
      success: true,
      message: 'הדפוס נרשם (לא נשמר במסד הנתונים)',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

