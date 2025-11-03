import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - קבלת דפוסי תרגום שנלמדו
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.5');
    const limit = parseInt(searchParams.get('limit') || '100');

    // קבלת דפוסים
    const patterns = await prisma.translationPattern.findMany({
      where: {
        userId,
        confidence: { gte: minConfidence },
      },
      orderBy: [
        { confidence: 'desc' },
        { occurrences: 'desc' },
      ],
      take: limit,
    });

    // קיבוץ לפי סוג
    const patternsByType = patterns.reduce((acc, pattern) => {
      const type = pattern.patternType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push({
        from: pattern.badPattern,
        to: pattern.goodPattern,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences,
      });
      return acc;
    }, {} as Record<string, Array<{from: string; to: string; confidence: number; occurrences: number}>>);

    // חישוב סטטיסטיקות
    const stats = {
      totalPatterns: patterns.length,
      averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0,
      totalOccurrences: patterns.reduce((sum, p) => sum + p.occurrences, 0),
      byType: Object.entries(patternsByType).map(([type, items]) => ({
        type,
        count: items.length,
        avgConfidence: items.reduce((sum, i) => sum + i.confidence, 0) / items.length,
      })),
    };

    return NextResponse.json({
      patterns: patternsByType,
      stats,
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}

