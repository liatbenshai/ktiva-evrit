import { NextRequest, NextResponse } from 'next/server';
import { analyzeHebrewText, extractPatterns } from '@/lib/ai/hebrew-analyzer';

/**
 * POST - ניתוח batch של מספר טקסטים
 * Batch Learning - ניתוח מספר טקסטים בו-זמנית וחילוץ דפוסים
 */
export async function POST(req: NextRequest) {
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
  } catch (importError: any) {
    console.error('Error importing Prisma:', importError);
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { texts, userId = 'default-user', autoSavePatterns = false } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Array of texts is required' },
        { status: 400 }
      );
    }

    if (texts.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 texts at a time' },
        { status: 400 }
      );
    }

    const results = [];
    const allPatterns: Map<string, {
      badPattern: string;
      goodPattern: string;
      occurrences: number;
      confidence: number;
      patternType: string;
    }> = new Map();

    // ניתוח כל טקסט
    for (let i = 0; i < texts.length; i++) {
      const textData = texts[i];
      const originalText = textData.original || textData;
      const correctedText = textData.corrected;

      try {
        // ניתוח
        const analysis = analyzeHebrewText(originalText);

        // אם יש גרסה מתוקנת - חילוץ דפוסים
        if (correctedText && correctedText !== originalText) {
          const patterns = extractPatterns(originalText, correctedText);
          
          patterns.forEach(pattern => {
            const key = `${pattern.from}→${pattern.to}`;
            if (allPatterns.has(key)) {
              const existing = allPatterns.get(key)!;
              existing.occurrences++;
              existing.confidence = Math.max(existing.confidence, pattern.confidence);
            } else {
              allPatterns.set(key, {
                badPattern: pattern.from,
                goodPattern: pattern.to,
                occurrences: 1,
                confidence: pattern.confidence,
                patternType: pattern.type,
              });
            }
          });
        }

        results.push({
          index: i,
          originalText,
          correctedText,
          score: analysis.score,
          issuesCount: analysis.issues.length,
          suggestions: analysis.suggestions,
        });
      } catch (error) {
        console.error(`Error analyzing text ${i}:`, error);
        results.push({
          index: i,
          originalText,
          error: 'Failed to analyze',
        });
      }
    }

    // המרת Map למערך
    const extractedPatterns = Array.from(allPatterns.values())
      .sort((a, b) => b.occurrences - a.occurrences);

    // שמירה אוטומטית אם נדרש
    let savedCount = 0;
    if (autoSavePatterns && prisma && extractedPatterns.length > 0) {
      for (const pattern of extractedPatterns) {
        try {
          // בדיקה אם קיים
          const existing = await prisma.translationPattern.findFirst({
            where: {
              userId,
              badPattern: pattern.badPattern,
              goodPattern: pattern.goodPattern,
            },
          });

          if (existing) {
            // עדכון
            await prisma.translationPattern.update({
              where: { id: existing.id },
              data: {
                occurrences: existing.occurrences + pattern.occurrences,
                confidence: Math.max(existing.confidence, pattern.confidence),
              },
            });
          } else {
            // יצירה
            await prisma.translationPattern.create({
              data: {
                userId,
                badPattern: pattern.badPattern,
                goodPattern: pattern.goodPattern,
                patternType: 'ai-style',
                confidence: pattern.confidence,
                occurrences: pattern.occurrences,
              },
            });
            savedCount++;
          }
        } catch (error) {
          console.error('Error saving pattern:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      extractedPatterns,
      totalTexts: texts.length,
      averageScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length,
      totalPatternsFound: extractedPatterns.length,
      patternsSaved: savedCount,
    });
  } catch (error: any) {
    console.error('Error in batch analysis:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze texts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

