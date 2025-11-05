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
    
    // בדיקה שהמסד נתונים זמין - ננסה לספור דפוסים
    try {
      await prisma.translationPattern.count();
      console.log('✅ Database connection successful');
    } catch (dbCheckError: any) {
      console.error('❌ Database check failed:', dbCheckError);
      // אם הטבלה לא קיימת, ננסה ליצור אותה
      if (dbCheckError.message?.includes('does not exist') || dbCheckError.message?.includes('no such table')) {
        console.log('⚠️ TranslationPattern table does not exist, attempting to create it...');
        try {
          // ננסה ליצור רשומה ריקה ואז למחוק אותה כדי לוודא שהטבלה קיימת
          // אבל זה לא יעבוד, אז פשוט נחזיר שגיאה ברורה
          return NextResponse.json({
            success: false,
            error: 'Table does not exist',
            message: 'טבלת הדפוסים לא קיימת במסד הנתונים. נא להריץ: npx prisma db push',
            details: process.env.NODE_ENV === 'development' ? {
              error: dbCheckError.message,
              suggestion: 'Run: npx prisma db push'
            } : undefined
          });
        } catch (createTableError) {
          return NextResponse.json({
            success: false,
            error: 'Database table missing',
            message: 'טבלת הדפוסים לא קיימת במסד הנתונים',
            details: process.env.NODE_ENV === 'development' ? {
              error: dbCheckError.message,
              suggestion: 'Run: npx prisma db push'
            } : undefined
          });
        }
      }
      throw dbCheckError;
    }
  } catch (importError: any) {
    console.error('❌ Error importing Prisma:', importError);
    return NextResponse.json({
      success: false,
      error: 'Database not available',
      message: 'לא ניתן להתחבר למסד הנתונים',
      details: process.env.NODE_ENV === 'development' ? {
        error: importError.message,
        suggestion: 'Check DATABASE_URL in .env.local'
      } : undefined
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
      console.log('Checking for existing pattern:', {
        userId,
        badPattern: originalText.substring(0, 50),
        goodPattern: correctedText.substring(0, 50),
      });
      
      existingPattern = await prisma.translationPattern.findFirst({
        where: {
          userId,
          badPattern: originalText,
          goodPattern: correctedText,
        },
      });
      
      if (existingPattern) {
        console.log('Found existing pattern:', existingPattern.id);
      } else {
        console.log('No existing pattern found, will create new one');
      }
    } catch (findError: any) {
      console.error('❌ Error finding existing pattern:', {
        error: findError.message,
        code: findError.code,
        meta: findError.meta,
      });
      
      // אם הטבלה לא קיימת, נשמור דפוס חדש
      if (findError.message?.includes('does not exist') || findError.message?.includes('no such table')) {
        console.warn('⚠️ TranslationPattern table does not exist, will try to create it');
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
        console.log('Attempting to create new pattern:', {
          userId,
          badPattern: originalText.substring(0, 50),
          goodPattern: correctedText.substring(0, 50),
        });
        
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

        console.log('Pattern created successfully:', {
          id: newPattern.id,
          badPattern: newPattern.badPattern.substring(0, 50),
          goodPattern: newPattern.goodPattern.substring(0, 50),
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
        console.error('❌ Error creating pattern:', {
          error: createError.message,
          code: createError.code,
          meta: createError.meta,
          stack: createError.stack,
        });
        
        // אם הטבלה לא קיימת או יש בעיה אחרת, נחזיר תשובה עם success: false
        // כדי שהקוד בצד הלקוח יידע שהשמירה נכשלה
        return NextResponse.json({
          success: false,
          error: 'Failed to save pattern',
          message: 'הדפוס לא נשמר במסד הנתונים - יש בעיה עם החיבור למסד הנתונים',
          details: process.env.NODE_ENV === 'development' ? {
            message: createError.message,
            code: createError.code,
            meta: createError.meta,
          } : undefined
        });
      }
    }
  } catch (error: any) {
    console.error('Error saving pattern:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // נחזיר תשובה עם success: false כדי שהקוד בצד הלקוח יידע שהשמירה נכשלה
    return NextResponse.json({
      success: false,
      error: 'Failed to save pattern',
      message: 'הדפוס לא נשמר במסד הנתונים - יש בעיה עם החיבור למסד הנתונים',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

