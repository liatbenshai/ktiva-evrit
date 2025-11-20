import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/get-user-id';

/**
 * GET - קבלת כל חיפושי פסקי הדין של המשתמש
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    
    const sessions = await prisma.legalCaseSession.findMany({
      where: { userId },
      include: {
        cases: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    console.error('Error fetching legal case sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת חיפושים',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - יצירת חיפוש חדש או עדכון חיפוש קיים
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { sessionId, topic, summary, detailedAnalysis, sources, isNewSession = false } = body;

    if (!topic || !summary) {
      return NextResponse.json(
        { error: 'נושא וסיכום נדרשים' },
        { status: 400 }
      );
    }

    let session;
    
    if (isNewSession || !sessionId) {
      session = await prisma.legalCaseSession.create({
        data: {
          userId,
          topic,
          cases: {
            create: {
              topic,
              summary,
              detailedAnalysis: detailedAnalysis || null,
              sources: sources ? JSON.stringify(sources) : null,
              order: 0,
            },
          },
        },
        include: {
          cases: {
            orderBy: { order: 'asc' },
          },
        },
      });
    } else {
      const existingSession = await prisma.legalCaseSession.findFirst({
        where: { id: sessionId, userId },
        include: { cases: true },
      });

      if (!existingSession) {
        return NextResponse.json(
          { error: 'חיפוש לא נמצא' },
          { status: 404 }
        );
      }

      const nextOrder = existingSession.cases.length;

      await prisma.legalCase.create({
        data: {
          sessionId,
          topic,
          summary,
          detailedAnalysis: detailedAnalysis || null,
          sources: sources ? JSON.stringify(sources) : null,
          order: nextOrder,
        },
      });

      session = await prisma.legalCaseSession.findUnique({
        where: { id: sessionId },
        include: {
          cases: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Error saving legal case session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בשמירת חיפוש',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - מחיקת חיפוש
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId נדרש' },
        { status: 400 }
      );
    }

    const session = await prisma.legalCaseSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'חיפוש לא נמצא' },
        { status: 404 }
      );
    }

    await prisma.legalCaseSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'חיפוש נמחק בהצלחה',
    });
  } catch (error: any) {
    console.error('Error deleting legal case session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה במחיקת חיפוש',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

