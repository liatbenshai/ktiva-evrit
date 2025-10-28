import { NextRequest, NextResponse } from 'next/server';
import { learningSystem } from '@/lib/learning-system';

type RequestBody = {
  documentType?: string;
  originalText?: string;
  editedText?: string;
  editType?: string;
  userId?: string;
  context?: string;
  confidence?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const {
      documentType = 'general',
      originalText,
      editedText,
      editType = 'manual',
      userId = 'default-user',
      context = '',
      confidence = 1.0,
    } = body;

    // Validation
    if (!originalText || !editedText) {
      return NextResponse.json(
        { error: 'originalText and editedText are required' },
        { status: 400 }
      );
    }

    // Record the correction in the advanced learning system
    if (typeof learningSystem.recordCorrection === 'function') {
      try {
        await Promise.resolve(
          learningSystem.recordCorrection({
            originalText,
            correctedText: editedText,
            correctionType: editType,
            context,
            category: documentType as any,
            userId,
            confidence,
          })
        );
      } catch (recErr) {
        console.error('learningSystem.recordCorrection failed:', recErr);
      }
    }

    // Get insights and stats (support sync or async implementations)
    const insights =
      typeof learningSystem.analyzeTextForImprovements === 'function'
        ? await Promise.resolve(
            learningSystem.analyzeTextForImprovements(
              editedText,
              userId,
              context,
              documentType
            )
          )
        : null;

    const userStats =
      typeof learningSystem.getUserStats === 'function'
        ? await Promise.resolve(learningSystem.getUserStats(userId))
        : null;

    const writingSuggestions =
      typeof learningSystem.getWritingSuggestions === 'function'
        ? await Promise.resolve(
            learningSystem.getWritingSuggestions(userId, documentType)
          )
        : null;

    return NextResponse.json({
      success: true,
      insights,
      userStats,
      writingSuggestions,
      message: 'תיקון נרשם בהצלחה במערכת הלמידה המתקדמת',
    });
  } catch (error) {
    console.error('Error in POST /api/learning/track:', error);
    return NextResponse.json(
      { error: 'שגיאה בשמירת העריכה' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = (req as any).nextUrl instanceof URL ? (req as any).nextUrl : new URL(req.url);
    const userId = url.searchParams.get('userId') || 'default-user';
    const category = url.searchParams.get('category') || '';

    const userStats =
      typeof learningSystem.getUserStats === 'function'
        ? await Promise.resolve(learningSystem.getUserStats(userId))
        : null;

    const writingSuggestions =
      typeof learningSystem.getWritingSuggestions === 'function'
        ? await Promise.resolve(learningSystem.getWritingSuggestions(userId, category))
        : null;

    const recentCorrections: unknown[] = [];

    return NextResponse.json({
      userStats,
      writingSuggestions,
      recentCorrections,
      message: 'נתוני הלמידה נטענו בהצלחה',
    });
  } catch (error) {
    console.error('Error fetching learning data:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת נתוני הלמידה' },
      { status: 500 }
    );
  }
}
