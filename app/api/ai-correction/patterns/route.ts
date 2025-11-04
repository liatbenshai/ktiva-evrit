import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - קבלת כל הדפוסים שנלמדו
 */
export async function GET(req: NextRequest) {
  // נטפל בכל השגיאות, כולל אם Prisma לא מצליח להתחיל
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
  } catch (importError: any) {
    console.error('Error importing Prisma:', importError);
    return NextResponse.json({
      success: true,
      patterns: [],
      count: 0,
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
        count = await prisma.translationPattern.count({ where });
        console.log(`Found ${count} patterns matching filter`);
      } catch (countError: any) {
        console.error('Error counting patterns:', countError);
        // אם הטבלה לא קיימת, נחזיר רשימה ריקה
        if (countError.message?.includes('does not exist') || countError.message?.includes('no such table')) {
          console.log('TranslationPattern table does not exist yet, returning empty array');
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
