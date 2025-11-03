import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeHebrewText, applyLearnedPatterns } from '@/lib/ai/hebrew-analyzer';

/**
 * POST - ניתוח טקסט והחלת תיקונים אוטומטיים
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, userId = 'default-user', applyPatterns = true } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // ניתוח הטקסט
    const analysis = analyzeHebrewText(text);

    // קבלת דפוסים שנלמדו מהמשתמש
    const learnedPatterns = await prisma.translationPattern.findMany({
      where: { 
        userId,
        confidence: { gte: 0.7 }, // רק דפוסים בטוחים
      },
      orderBy: { confidence: 'desc' },
      take: 50,
    });

    // המרה לפורמט המתאים
    const patterns = learnedPatterns.map(p => ({
      from: p.badPattern,
      to: p.goodPattern,
      confidence: p.confidence,
    }));

    // החלת דפוסים על הטקסט (אם מבוקש)
    let result = {
      originalText: text,
      analyzedText: text,
      appliedPatterns: [] as Array<{ from: string; to: string }>,
    };

    if (applyPatterns && patterns.length > 0) {
      const { correctedText, appliedPatterns } = applyLearnedPatterns(text, patterns);
      result = {
        originalText: text,
        analyzedText: correctedText,
        appliedPatterns,
      };
    }

    // חישוב שיפור (אם הוחלו דפוסים)
    const improvedAnalysis = result.appliedPatterns.length > 0 
      ? analyzeHebrewText(result.analyzedText)
      : null;

    return NextResponse.json({
      success: true,
      analysis: {
        score: analysis.score,
        issues: analysis.issues,
        suggestions: analysis.suggestions,
      },
      result,
      improvement: improvedAnalysis ? {
        scoreImprovement: improvedAnalysis.score - analysis.score,
        newScore: improvedAnalysis.score,
        issuesFixed: analysis.issues.length - improvedAnalysis.issues.length,
      } : null,
      learnedPatterns: patterns.slice(0, 10), // החזרת 10 הדפוסים החזקים ביותר
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text', details: String(error) },
      { status: 500 }
    );
  }
}

