import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE - מחיקת דפוס ספציפי
 */
export async function DELETE(req: NextRequest) {
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
  } catch (importError: any) {
    console.error('Error importing Prisma:', importError);
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const patternId = searchParams.get('id');
    const userId = searchParams.get('userId') || 'default-user';

    if (!patternId) {
      return NextResponse.json(
        { success: false, error: 'Pattern ID is required' },
        { status: 400 }
      );
    }

    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database not available'
      }, { status: 500 });
    }

    // מחיקת הדפוס
    await prisma.translationPattern.delete({
      where: { 
        id: patternId,
        userId, // וידוא שרק המשתמש יכול למחוק את הדפוסים שלו
      },
    });

    return NextResponse.json({
      success: true,
      message: 'הדפוס נמחק בהצלחה',
    });
  } catch (error: any) {
    console.error('Error deleting pattern:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete pattern',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * PATCH - עדכון confidence או patternType של דפוס
 */
export async function PATCH(req: NextRequest) {
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
  } catch (importError: any) {
    console.error('Error importing Prisma:', importError);
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { patternId, confidence, patternType, userId = 'default-user' } = body;

    if (!patternId) {
      return NextResponse.json(
        { success: false, error: 'Pattern ID is required' },
        { status: 400 }
      );
    }

    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database not available'
      }, { status: 500 });
    }

    const updateData: any = {};
    if (confidence !== undefined) updateData.confidence = confidence;
    if (patternType !== undefined) updateData.patternType = patternType;

    const updated = await prisma.translationPattern.update({
      where: { 
        id: patternId,
        userId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      pattern: updated,
      message: 'הדפוס עודכן בהצלחה',
    });
  } catch (error: any) {
    console.error('Error updating pattern:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update pattern',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * POST - ייבוא המוני (bulk import) של דפוסים
 */
export async function POST(req: NextRequest) {
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
  } catch (importError: any) {
    console.error('Error importing Prisma:', importError);
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { patterns, userId = 'default-user' } = body;

    if (!patterns || !Array.isArray(patterns)) {
      return NextResponse.json(
        { success: false, error: 'Patterns array is required' },
        { status: 400 }
      );
    }

    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'Database not available'
      }, { status: 500 });
    }

    // ייבוא כל הדפוסים
    const imported = [];
    const skipped = [];
    
    for (const pattern of patterns) {
      try {
        // בדיקה אם הדפוס כבר קיים
        const existing = await prisma.translationPattern.findFirst({
          where: {
            userId,
            badPattern: pattern.badPattern,
            goodPattern: pattern.goodPattern,
          },
        });

        if (existing) {
          // עדכון דפוס קיים
          await prisma.translationPattern.update({
            where: { id: existing.id },
            data: {
              confidence: Math.max(existing.confidence, pattern.confidence || 0.8),
              occurrences: existing.occurrences + 1,
            },
          });
          skipped.push(pattern);
        } else {
          // יצירת דפוס חדש
          const created = await prisma.translationPattern.create({
            data: {
              userId,
              badPattern: pattern.badPattern,
              goodPattern: pattern.goodPattern,
              patternType: pattern.patternType || 'ai-style',
              confidence: pattern.confidence || 0.8,
              occurrences: 1,
              context: pattern.context,
              examples: pattern.examples,
            },
          });
          imported.push(created);
        }
      } catch (error) {
        console.error('Error importing pattern:', pattern, error);
        skipped.push(pattern);
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      total: patterns.length,
      message: `יובאו ${imported.length} דפוסים חדשים, ${skipped.length} דפוסים כבר קיימים`,
    });
  } catch (error: any) {
    console.error('Error bulk importing patterns:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to import patterns',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * GET - קבלת כל הדפוסים שנלמדו
 */
export async function GET(req: NextRequest) {
  // בדיקה ראשונית - האם DATABASE_URL מוגדר?
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in Vercel Environment Variables!');
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL not configured',
      patterns: [],
      count: 0,
      message: 'DATABASE_URL לא מוגדר ב-Vercel. נא להגדיר אותו ב-Environment Variables.',
    });
  }

  console.log('🔍 DATABASE_URL is set:', dbUrl.substring(0, 50) + '...');
  console.log('🔍 Using Connection Pooling:', dbUrl.includes('6543') || dbUrl.includes('pooler'));
  
  // נטפל בכל השגיאות, כולל אם Prisma לא מצליח להתחיל
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
    console.log('✅ Prisma client imported successfully');
  } catch (importError: any) {
    console.error('❌ Error importing Prisma:', importError);
    return NextResponse.json({
      success: false,
      error: 'Failed to import Prisma',
      patterns: [],
      count: 0,
      details: {
        error: importError.message,
        suggestion: 'Check if DATABASE_URL is correct in Vercel Environment Variables'
      }
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const filter = searchParams.get('filter') || 'all';

    console.log('Fetching patterns with:', { userId, filter });

    // בדיקה אם Prisma מוכן
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json({
        success: true,
        patterns: [],
        count: 0,
      });
    }

    const where: any = { userId };
    if (filter === 'ai-style') {
      where.patternType = 'ai-style';
    }

    // נסיון לבדוק אם הטבלה קיימת
    try {
      // בדיקה ראשונית - ננסה לספור את הרשומות
      let count = 0;
      let patterns: any[] = [];
      
      try {
        // בדיקה שהחיבור עובד
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        count = await prisma.translationPattern.count({ where });
        console.log(`✅ Found ${count} patterns matching filter`);
      } catch (countError: any) {
        console.error('❌ Error counting patterns:', {
          message: countError.message,
          code: countError.code,
          meta: countError.meta,
        });
        
        // אם זו שגיאת חיבור
        if (countError.message?.includes('Can\'t reach database server') || 
            countError.message?.includes('connect') ||
            countError.code === 'P1001') {
          console.error('❌ Cannot connect to Supabase!');
          return NextResponse.json({
            success: false,
            error: 'Connection failed',
            patterns: [],
            count: 0,
            message: 'לא ניתן להתחבר ל-Supabase. נא לבדוק את ה-DATABASE_URL ב-Vercel - צריך להשתמש ב-Connection Pooling (פורט 6543).',
            details: {
              error: countError.message,
              code: countError.code,
              suggestion: 'Use Connection Pooling URL from Supabase (port 6543) instead of direct connection (port 5432)',
              databaseUrlPreview: dbUrl.substring(0, 50) + '...',
            }
          });
        }
        
        // אם הטבלה לא קיימת, נחזיר רשימה ריקה
        if (countError.message?.includes('does not exist') || countError.message?.includes('no such table')) {
          console.log('⚠️ TranslationPattern table does not exist yet, returning empty array');
          return NextResponse.json({
            success: true,
            patterns: [],
            count: 0,
          });
        }
        throw countError;
      }
      
      try {
        patterns = await prisma.translationPattern.findMany({
          where,
          orderBy: [
            { confidence: 'desc' },
            { occurrences: 'desc' },
            { createdAt: 'desc' }
          ],
        });
        console.log(`Retrieved ${patterns.length} patterns`);
      } catch (findError: any) {
        console.error('Error finding patterns:', findError);
        // אם יש שגיאה, נחזיר רשימה ריקה במקום להיכשל
        if (findError.message?.includes('does not exist') || findError.message?.includes('no such table')) {
          console.log('TranslationPattern table does not exist, returning empty array');
          return NextResponse.json({
            success: true,
            patterns: [],
            count: 0,
          });
        }
        throw findError;
      }

      return NextResponse.json({
        success: true,
        patterns,
        count: patterns.length,
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // במקום להחזיר שגיאות שונות, נחזיר תמיד רשימה ריקה
      // כדי לא לשבור את ה-UI
      console.error('Database error, returning empty array:', {
        code: dbError.code,
        message: dbError.message || dbError,
        stack: dbError.stack
      });
      return NextResponse.json({
        success: true,
        patterns: [],
        count: 0,
      });
    }
  } catch (error: any) {
    console.error('Error fetching patterns:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // במקום להחזיר שגיאה 500, נחזיר רשימה ריקה כדי לא לשבור את ה-UI
    // אבל נשמור את השגיאה ללוגים
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return NextResponse.json({
      success: true,
      patterns: [],
      count: 0,
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
