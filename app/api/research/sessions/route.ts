import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/get-user-id';

/**
 * GET - קבלת כל מחקרי המשתמש
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    
    const sessions = await prisma.researchSession.findMany({
      where: { userId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 sessions
    });

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    console.error('Error fetching research sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בטעינת מחקרים',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - יצירת מחקר חדש או עדכון מחקר קיים
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { sessionId, question, answer, detailedInfo, sources, isNewSession = false } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'שאלה ותשובה נדרשות' },
        { status: 400 }
      );
    }

    let session;
    
    if (isNewSession || !sessionId) {
      // Create new session
      session = await prisma.researchSession.create({
        data: {
          userId,
          initialQuestion: question,
          questions: {
            create: {
              question,
              answer,
              detailedInfo: detailedInfo || null,
              sources: sources ? JSON.stringify(sources) : null,
              order: 0,
            },
          },
        },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });
    } else {
      // Add question to existing session
      const existingSession = await prisma.researchSession.findFirst({
        where: { id: sessionId, userId },
        include: { questions: true },
      });

      if (!existingSession) {
        return NextResponse.json(
          { error: 'מחקר לא נמצא' },
          { status: 404 }
        );
      }

      const nextOrder = existingSession.questions.length;

      await prisma.researchQuestion.create({
        data: {
          sessionId,
          question,
          answer,
          detailedInfo: detailedInfo || null,
          sources: sources ? JSON.stringify(sources) : null,
          order: nextOrder,
        },
      });

      session = await prisma.researchSession.findUnique({
        where: { id: sessionId },
        include: {
          questions: {
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
    console.error('Error saving research session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בשמירת מחקר',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - מחיקת מחקר
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

    // Verify ownership
    const session = await prisma.researchSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'מחקר לא נמצא' },
        { status: 404 }
      );
    }

    await prisma.researchSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'מחקר נמחק בהצלחה',
    });
  } catch (error: any) {
    console.error('Error deleting research session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה במחיקת מחקר',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

