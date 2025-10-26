import { NextRequest, NextResponse } from 'next/server';
import { learningSystem } from '@/lib/learning-system';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      documentType, 
      originalText, 
      editedText, 
      editType,
      userId = 'default-user',
      context = '',
      confidence = 1.0
    } = body;

    // Validation
    if (!documentType || !originalText || !editedText) {
      return NextResponse.json(
        { error: 'חסרים שדות נדרשים: documentType, originalText, editedText' },
        { status: 400 }
      );
    }

    // Record the correction in the advanced learning system
    learningSystem.recordCorrection({
      originalText,
      correctedText: editedText,
      correctionType: editType || 'manual',
      context,
      category: documentType,
      userId,
      confidence
    });

    // Get insights from the learning system
    const insights = learningSystem.analyzeTextForImprovements(
      editedText, 
      userId, 
      context, 
      documentType
    );

    const userStats = learningSystem.getUserStats(userId);
    const writingSuggestions = learningSystem.getWritingSuggestions(userId, documentType);

    return NextResponse.json({
      success: true,
      insights,
      userStats,
      writingSuggestions,
      message: 'תיקון נרשם בהצלחה במערכת הלמידה המתקדמת'
    });
  } catch (error) {
    console.error('Error saving edit:', error);
    return NextResponse.json(
      { error: 'שגיאה בשמירת העריכה' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const category = searchParams.get('category') || '';

    // Get user statistics
    const userStats = learningSystem.getUserStats(userId);
    
    // Get writing suggestions
    const writingSuggestions = learningSystem.getWritingSuggestions(userId, category);
    
    // Get recent corrections (if we had a database)
    const recentCorrections = []; // TODO: Implement database storage

    return NextResponse.json({
      userStats,
      writingSuggestions,
      recentCorrections,
      message: 'נתוני הלמידה נטענו בהצלחה'
    });
  } catch (error) {
    console.error('Error fetching learning data:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת נתוני הלמידה' },
      { status: 500 }
    );
  }
}
