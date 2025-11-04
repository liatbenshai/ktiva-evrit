import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeHebrewText, extractPatterns } from '@/lib/ai/hebrew-analyzer';

/**
 * GET - קבלת כל התיקונים של המשתמש
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const limit = parseInt(searchParams.get('limit') || '50');

    const corrections = await prisma.aICorrection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // חישוב סטטיסטיקות
    const stats = {
      totalCorrections: corrections.length,
      averageConfidence: corrections.reduce((sum, c) => sum + c.confidence, 0) / corrections.length || 0,
    };

    return NextResponse.json({
      corrections,
      stats,
    });
  } catch (error) {
    console.error('Error fetching AI corrections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch corrections' },
      { status: 500 }
    );
  }
}

/**
 * POST - שמירת תיקון חדש
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      originalText,
      correctedText,
      category,
      userId = 'default-user',
    } = body;

    if (!originalText || !correctedText) {
      return NextResponse.json(
        { error: 'originalText and correctedText are required' },
        { status: 400 }
      );
    }

    // ניתוח הטקסט המקורי
    let analysis;
    try {
      analysis = analyzeHebrewText(originalText);
    } catch (analysisError: any) {
      console.error('Error analyzing text:', analysisError);
      // ניצור ניתוח בסיסי במקום להיכשל
      analysis = {
        issues: [],
        score: 50,
        suggestions: ['הניתוח נכשל - התיקון נשמר בכל זאת']
      };
    }

    // חילוץ דפוסים מהתיקון
    let patterns: Array<{
      from: string;
      to: string;
      type: string;
      confidence: number;
    }> = [];
    try {
      patterns = extractPatterns(originalText, correctedText);
    } catch (patternError: any) {
      console.error('Error extracting patterns:', patternError);
      // נמשיך בלי דפוסים במקום להיכשל
      patterns = [];
    }

    // שמירת התיקון
    const correction = await prisma.aICorrection.create({
      data: {
        userId,
        originalText,
        correctedText,
        category: category || 'general',
        patterns: JSON.stringify(patterns),
        correctionType: 'manual',
        confidence: 1.0,
      },
    });

    // עדכון או יצירת דפוסי תרגום / AI להימנעות
    try {
      for (const pattern of patterns) {
        if (pattern.type === 'word-replacement' || pattern.type === 'phrase-replacement') {
          try {
            // בדיקה אם הדפוס כבר קיים
            const existingPattern = await prisma.translationPattern.findFirst({
              where: {
                userId,
                badPattern: pattern.from,
                goodPattern: pattern.to,
              },
            });

            if (existingPattern) {
              // עדכון דפוס קיים
              await prisma.translationPattern.update({
                where: { id: existingPattern.id },
                data: {
                  occurrences: existingPattern.occurrences + 1,
                  confidence: Math.min(1.0, existingPattern.confidence + 0.1),
                  updatedAt: new Date(),
                },
              });
            } else {
              // יצירת דפוס חדש - סימון כ-ai-style כדי שהמערכת תימנע מניסוחי AI
              await prisma.translationPattern.create({
                data: {
                  userId,
                  badPattern: pattern.from,
                  goodPattern: pattern.to,
                  patternType: 'ai-style', // דפוסים ספציפיים לניסוחי AI
                  occurrences: 1,
                  confidence: pattern.confidence || 0.5,
                },
              });
            }
          } catch (patternError: any) {
            console.error('Error saving pattern:', patternError);
            // נמשיך עם הדפוס הבא במקום להיכשל
          }
        }
      }
    } catch (patternsError: any) {
      console.error('Error processing patterns:', patternsError);
      // נמשיך בלי שמירת דפוסים - התיקון נשמר בכל זאת
    }

    // קבלת דפוסים מעודכנים
    const learnedPatterns = await prisma.translationPattern.findMany({
      where: { userId },
      orderBy: { confidence: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      correction,
      analysis: {
        originalScore: analysis.score,
        issuesFound: analysis.issues.length,
        suggestions: analysis.suggestions,
      },
      learnedPatterns: learnedPatterns.map(p => ({
        from: p.badPattern,
        to: p.goodPattern,
        confidence: p.confidence,
        occurrences: p.occurrences,
      })),
    });
  } catch (error: any) {
    console.error('Error saving AI correction:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          type: error?.constructor?.name
        }
      : 'An error occurred while saving the correction';
    
    return NextResponse.json(
      { 
        error: 'Failed to save correction',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - מחיקת תיקון
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Correction ID is required' },
        { status: 400 }
      );
    }

    await prisma.aICorrection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Correction deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting AI correction:', error);
    return NextResponse.json(
      { error: 'Failed to delete correction' },
      { status: 500 }
    );
  }
}

