import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/get-user-id';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      title,
      keywords = [],
      contentType = 'article',
      userId: bodyUserId,
    } = body;

    if (!content || !title) {
      return NextResponse.json(
        { error: 'content and title are required' },
        { status: 400 }
      );
    }

    let userId = bodyUserId || 'default-user';
    try {
      userId = await getUserId();
    } catch {
      // Use default if auth fails
    }

    const saved = await prisma.generatedContent.create({
      data: {
        userId,
        type: contentType,
        title,
        content,
        prompt: `User saved ${contentType}: ${title}`,
        wordCount: content.split(/\s+/).length,
        tags: keywords.length > 0 ? JSON.stringify(keywords) : null,
      },
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      message: 'התוכן נשמר בהצלחה',
    });
  } catch (error: any) {
    console.error('Error saving content:', error);
    return NextResponse.json(
      {
        error: 'שגיאה בשמירת התוכן',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
