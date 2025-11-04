import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - קבלת סטטיסטיקות על למידה והתקדמות
 */
export async function GET(req: NextRequest) {
  let prisma;
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma');
    prisma = prismaClient;
  } catch (importError: any) {
    console.error('Error importing Prisma:', importError);
    return NextResponse.json({
      success: true,
      stats: {
        totalPatterns: 0,
        highConfidencePatterns: 0,
        totalCorrections: 0,
        patternsAppliedCount: 0,
        estimatedTimeSaved: 0,
        categoriesBreakdown: {},
        recentActivity: [],
      },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';

    if (!prisma) {
      return NextResponse.json({
        success: true,
        stats: {
          totalPatterns: 0,
          highConfidencePatterns: 0,
          totalCorrections: 0,
          patternsAppliedCount: 0,
          estimatedTimeSaved: 0,
          categoriesBreakdown: {},
          recentActivity: [],
        },
      });
    }

    // ספירת דפוסים
    const totalPatterns = await prisma.translationPattern.count({
      where: { userId },
    });

    const highConfidencePatterns = await prisma.translationPattern.count({
      where: { 
        userId,
        confidence: { gte: 0.8 },
      },
    });

    // ספירת תיקונים
    const totalCorrections = await prisma.aICorrection.count({
      where: { userId },
    });

    // קבלת כל הדפוסים לחישובים נוספים
    const allPatterns = await prisma.translationPattern.findMany({
      where: { userId },
      select: {
        occurrences: true,
        confidence: true,
        patternType: true,
        context: true,
        createdAt: true,
        badPattern: true,
        goodPattern: true,
      },
    });

    // חישוב כמה פעמים דפוסים הוחלו (סכום של כל ה-occurrences)
    const patternsAppliedCount = allPatterns.reduce((sum, p) => sum + p.occurrences, 0);

    // הערכת זמן שנחסך (בהנחה שכל תיקון חוסך 30 שניות)
    const estimatedTimeSaved = patternsAppliedCount * 30; // בשניות

    // פילוח לפי קטגוריות
    const categoriesBreakdown: Record<string, number> = {};
    allPatterns.forEach(pattern => {
      const category = pattern.context || pattern.patternType || 'אחר';
      categoriesBreakdown[category] = (categoriesBreakdown[category] || 0) + 1;
    });

    // פעילות אחרונה - 10 הדפוסים האחרונים שנוצרו
    const recentActivity = allPatterns
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(p => ({
        badPattern: p.badPattern,
        goodPattern: p.goodPattern,
        occurrences: p.occurrences,
        confidence: p.confidence,
        createdAt: p.createdAt,
      }));

    // דפוסים הכי פופולריים (לפי occurrences)
    const topPatterns = allPatterns
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10)
      .map(p => ({
        badPattern: p.badPattern,
        goodPattern: p.goodPattern,
        occurrences: p.occurrences,
        confidence: p.confidence,
      }));

    // חישוב שיפור לאורך זמן (תיקונים לפי חודש)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCorrections = await prisma.aICorrection.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalPatterns,
        highConfidencePatterns,
        totalCorrections,
        patternsAppliedCount,
        estimatedTimeSaved, // בשניות
        estimatedTimeSavedMinutes: Math.floor(estimatedTimeSaved / 60),
        estimatedTimeSavedHours: Math.floor(estimatedTimeSaved / 3600),
        categoriesBreakdown,
        recentActivity,
        topPatterns,
        recentCorrections,
        averageConfidence: allPatterns.length > 0 
          ? allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length 
          : 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

