import { NextRequest, NextResponse } from 'next/server';
import { analyzeHebrewText } from '@/lib/ai/hebrew-analyzer';

/**
 * POST - הצעת דפוסים אוטומטית על בסיס טקסט
 * Training mode - ניתוח טקסט והצעת דפוסים שכדאי לשמור
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, userId = 'default-user' } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // ניתוח הטקסט
    const analysis = analyzeHebrewText(text);

    // המרת הבעיות לדפוסים מוצעים
    const suggestedPatterns = analysis.issues
      .filter(issue => issue.confidence >= 0.7) // רק הצעות בטוחות
      .map(issue => ({
        badPattern: issue.original,
        goodPattern: issue.suggestion,
        patternType: issue.type === 'literal-translation' ? 'ai-style' : 
                     issue.type === 'grammar' ? 'grammar' : 
                     issue.type === 'anglicism' ? 'ai-style' : 'style',
        confidence: issue.confidence,
        explanation: issue.explanation,
        context: issue.type,
      }));

    // מיון לפי confidence
    suggestedPatterns.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      success: true,
      suggestedPatterns,
      totalSuggestions: suggestedPatterns.length,
      analysisScore: analysis.score,
    });
  } catch (error: any) {
    console.error('Error suggesting patterns:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to suggest patterns',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

