import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - קבלת כל הדפוסים שנלמדו
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const filter = searchParams.get('filter') || 'all';

    console.log('Fetching patterns with:', { userId, filter });

    const where: any = { userId };
    if (filter === 'ai-style') {
      where.patternType = 'ai-style';
    }

    // בדיקה אם Prisma מוכן
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json(
        { 
          error: 'Database connection not available',
          details: process.env.NODE_ENV === 'development' ? 'Prisma client not initialized' : 'Internal server error'
        },
        { status: 500 }
      );
    }

    // נסיון לבדוק אם הטבלה קיימת
    try {
      // בדיקה ראשונית - ננסה לספור את הרשומות
      const count = await prisma.translationPattern.count({ where });
      console.log(`Found ${count} patterns matching filter`);
      
      const patterns = await prisma.translationPattern.findMany({
        where,
        orderBy: [
          { confidence: 'desc' },
          { occurrences: 'desc' },
          { createdAt: 'desc' }
        ],
      });

      console.log(`Retrieved ${patterns.length} patterns`);

      return NextResponse.json({
        success: true,
        patterns,
        count: patterns.length,
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // אם זו שגיאת Prisma ספציפית, נחזיר מידע מפורט יותר
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { 
            error: 'Database constraint violation',
            details: process.env.NODE_ENV === 'development' ? dbError.message : 'Unique constraint violation'
          },
          { status: 400 }
        );
      }
      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { 
            error: 'Record not found',
            details: process.env.NODE_ENV === 'development' ? dbError.message : 'Requested pattern not found'
          },
          { status: 404 }
        );
      }
      // אם זו שגיאת חיבור למסד נתונים
      if (dbError.message?.includes('connect') || dbError.message?.includes('SQLite')) {
        return NextResponse.json(
          { 
            error: 'Database connection error',
            details: process.env.NODE_ENV === 'development' ? dbError.message : 'Unable to connect to database'
          },
          { status: 500 }
        );
      }
      throw dbError; // זרוק את השגיאה כדי שה-catch החיצוני יטען בה
    }
  } catch (error: any) {
    console.error('Error fetching patterns:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
        }
      : 'Failed to fetch patterns';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch patterns',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
