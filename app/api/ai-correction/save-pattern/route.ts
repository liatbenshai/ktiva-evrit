import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - שמירה נקודתית של דפוס תיקון אחד
 * זה נקרא כשמשנים דבר אחד (מילה, ביטוי) ולא כל הטקסט
 */
export async function POST(req: NextRequest) {
  // בדיקה ראשונית - האם DATABASE_URL מוגדר?
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set!');
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL not configured',
      message: 'DATABASE_URL לא מוגדר. נא להגדיר אותו ב-Vercel Environment Variables.',
      details: {
        suggestion: 'Go to Vercel Dashboard → Settings → Environment Variables → Add DATABASE_URL',
        environment: process.env.NODE_ENV,
      }
    });
  }

  console.log('🔍 DATABASE_URL is set:', dbUrl.substring(0, 30) + '...');
  
  // נטפל בכל השגיאות, כולל אם Prisma לא מצליח להתחיל
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
    
    // בדיקה שהמסד נתונים זמין - ננסה לספור דפוסים
    try {
      await prisma.$connect();
      console.log('✅ Prisma client connected');
      
      await prisma.translationPattern.count();
      console.log('✅ Database connection successful - table exists');
    } catch (dbCheckError: any) {
      console.error('❌ Database check failed:', {
        message: dbCheckError.message,
        code: dbCheckError.code,
        meta: dbCheckError.meta,
      });
      
      // אם הטבלה לא קיימת, נחזיר שגיאה ברורה
      if (dbCheckError.message?.includes('does not exist') || 
          dbCheckError.message?.includes('no such table') ||
          dbCheckError.code === 'P2021') {
        return NextResponse.json({
          success: false,
          error: 'Table does not exist',
          message: 'טבלת הדפוסים לא קיימת במסד הנתונים. Vercel צריך להריץ "prisma db push" בזמן ה-build.',
          details: {
            error: dbCheckError.message,
            code: dbCheckError.code,
            suggestion: 'Check Vercel build logs - should see "prisma db push" running. If not, tables were not created.',
            checkBuildLogs: true,
          }
        });
      }
      
      // אם זו שגיאת חיבור
      if (dbCheckError.message?.includes('connect') || 
          dbCheckError.message?.includes('connection') ||
          dbCheckError.code === 'P1001') {
        return NextResponse.json({
          success: false,
          error: 'Connection failed',
          message: 'לא ניתן להתחבר למסד הנתונים. נא לבדוק את ה-DATABASE_URL ב-Vercel.',
          details: {
            error: dbCheckError.message,
            code: dbCheckError.code,
            suggestion: '1. Check DATABASE_URL in Vercel Environment Variables\n2. Verify Supabase project is active\n3. Check if password is correct',
            databaseUrlPreview: dbUrl.substring(0, 30) + '...',
          }
        });
      }
      
      throw dbCheckError;
    }
  } catch (importError: any) {
    console.error('❌ Error importing Prisma:', importError);
    const dbUrl = process.env.DATABASE_URL;
    const hasDbUrl = !!dbUrl;
    const dbUrlPreview = hasDbUrl && dbUrl
      ? dbUrl.substring(0, 30) + '...' 
      : 'NOT SET';
    
    return NextResponse.json({
      success: false,
      error: 'Database not available',
      message: 'לא ניתן להתחבר למסד הנתונים',
      details: {
        hasDatabaseUrl: hasDbUrl,
        databaseUrlPreview: dbUrlPreview,
        error: importError.message,
        suggestion: hasDbUrl 
          ? 'DATABASE_URL is set but connection failed. Check if the URL is correct and Supabase is accessible.'
          : 'DATABASE_URL is not set. Please add it to Vercel Environment Variables.',
        environment: process.env.NODE_ENV,
      }
    });
  }

  try {
    const body = await req.json();
    const {
      originalText,
      correctedText,
      userId = 'default-user',
      source,
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
            context: source
              ? JSON.stringify(
                  Array.from(
                    new Set([
                      ...(existingPattern.context ? JSON.parse(existingPattern.context) : []),
                      source,
                    ])
                  )
                )
              : existingPattern.context,
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
            context: source ? JSON.stringify([source]) : undefined,
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
    console.error('❌ Error saving pattern:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name,
    });
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    // נחזיר תשובה עם success: false כדי שהקוד בצד הלקוח יידע שהשמירה נכשלה
    // אבל נחזיר status 200 כדי שהקוד בצד הלקוח יוכל לקרוא את ה-response
    return NextResponse.json({
      success: false,
      error: 'Failed to save pattern',
      message: 'הדפוס לא נשמר במסד הנתונים - יש בעיה עם החיבור למסד הנתונים',
      details: {
        hasDatabaseUrl: hasDbUrl,
        error: errorMessage,
        code: error.code,
        suggestion: hasDbUrl 
          ? 'DATABASE_URL is set but save failed. Check Vercel function logs for more details.'
          : 'DATABASE_URL is not set. Please add it to Vercel Environment Variables.',
        environment: process.env.NODE_ENV,
      }
    }, { status: 200 }); // נחזיר 200 במקום 500 כדי שהקוד בצד הלקוח יוכל לקרוא את ה-response
  }
}

