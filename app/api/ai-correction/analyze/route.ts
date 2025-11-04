import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeHebrewText, applyLearnedPatterns } from '@/lib/ai/hebrew-analyzer';
import { generateText } from '@/lib/ai/claude';

/**
 * POST - ניתוח טקסט והחלת תיקונים אוטומטיים
 */
export async function POST(req: NextRequest) {
  let body: any = {};
  let text = '';
  
  try {
    body = await req.json();
    text = body.text || '';
    const { userId = 'default-user', applyPatterns = true } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // ניתוח הטקסט
    let analysis;
    try {
      analysis = analyzeHebrewText(text);
    } catch (error) {
      console.error('Error in analyzeHebrewText:', error);
      throw new Error(`Failed to analyze text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // קבלת דפוסים שנלמדו מהמשתמש (כולל דפוסי AI להימנעות)
    let learnedPatterns: Array<{
      id: string;
      userId: string;
      badPattern: string;
      goodPattern: string;
      confidence: number;
      occurrences: number;
    }> = [];
    try {
      learnedPatterns = await prisma.translationPattern.findMany({
        where: { 
          userId,
          confidence: { gte: 0.7 }, // רק דפוסים בטוחים
          // כולל גם דפוסי AI וגם דפוסי תרגום רגילים
        },
        orderBy: { confidence: 'desc' },
        take: 50,
      });
    } catch (dbError) {
      console.error('Error fetching learned patterns from database:', dbError);
      // המשך בלי דפוסים במקום להיכשל
      learnedPatterns = [];
    }

    // המרה לפורמט המתאים
    const patterns = learnedPatterns.map(p => ({
      from: p.badPattern,
      to: p.goodPattern,
      confidence: p.confidence,
    }));

    // יצירת תיקון ראשי ואפשרויות חלופיות (כמו בתכונת התרגום)
    let mainCorrectedText = text; // ברירת מחדל - הטקסט המקורי
    let alternatives: Array<{ text: string; explanation?: string; context?: string }> = [];
    
    try {
      // יצירת תיקון ראשי + 3 גרסאות נוספות
      const alternativesPrompt = `אתה עוזר לשיפור טקסטים בעברית שנוצרו על ידי AI.

<טקסט_מקורי>
${text}
</טקסט_מקורי>

<בעיות_שזוהו>
${analysis.issues.map(issue => `- ${issue.original} → ${issue.suggestion} (${issue.explanation})`).join('\n')}
</בעיות_שזוהו>

צור תיקון ראשי מומלץ + 3 גרסאות חלופיות של הטקסט המשופר:
- **main**: התיקון הראשי המומלץ (תיקון בינוני - שילוב מאוזן של כל הבעיות)
- **alternative1**: תיקון מינימלי - רק את הבעיות הבולטות ביותר
- **alternative2**: תיקון בינוני - שילוב מאוזן (דומה ל-main אבל עם גישה מעט שונה)
- **alternative3**: תיקון מקסימלי - כל מה שניתן לשפר

**חשוב מאוד:** החזר רק JSON תקין בלבד, ללא markdown, ללא הסברים נוספים.

פורמט JSON:
{
  "main": "התיקון הראשי המומלץ - תיקון בינוני מאוזן",
  "alternatives": [
    {
      "text": "גרסה משופרת 1 - תיקון מינימלי",
      "explanation": "הסבר קצר למה גרסה זו מתאימה",
      "context": "מינימלי"
    },
    {
      "text": "גרסה משופרת 2 - תיקון בינוני",
      "explanation": "הסבר קצר",
      "context": "בינוני"
    },
    {
      "text": "גרסה משופרת 3 - תיקון מקסימלי",
      "explanation": "הסבר קצר",
      "context": "מקסימלי"
    }
  ]
}`;

      const alternativesSystemPrompt = 'אתה מומחה בעברית תקנית וטבעית. אתה מספק תיקון ראשי מומלץ וגרסאות משופרות של טקסטים שנוצרו על ידי AI. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.';

      const alternativesResponse = await generateText({
        prompt: alternativesPrompt,
        systemPrompt: alternativesSystemPrompt,
        maxTokens: 2048,
        temperature: 0.7,
      });

      let cleanedResponse = alternativesResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const alternativesData = JSON.parse(cleanedResponse);
      mainCorrectedText = alternativesData.main || text; // התיקון הראשי
      alternatives = alternativesData.alternatives || [];
    } catch (altError) {
      console.error('Error generating alternatives:', altError);
      // נמשיך עם הטקסט המקורי אם יש בעיה
      mainCorrectedText = text;
      alternatives = [];
    }

    // התיקון הראשי יוצג מלכתחילה (כמו בתכונת התרגום)
    const result = {
      originalText: text,
      analyzedText: mainCorrectedText, // התיקון הראשי המומלץ
      appliedPatterns: [] as Array<{ from: string; to: string }>,
      availablePatterns: patterns.map(p => ({
        from: p.from,
        to: p.to,
        confidence: p.confidence,
      })), // דפוסים זמינים להחלה ידנית
    };

    return NextResponse.json({
      success: true,
      analysis: {
        score: analysis.score,
        issues: analysis.issues,
        suggestions: analysis.suggestions,
      },
      result,
      alternatives, // אפשרויות חלופיות לטקסט המלא
      learnedPatterns: patterns.slice(0, 20), // החזרת 20 הדפוסים החזקים ביותר (כהצעות בלבד)
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    const errorDetails = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Full error:', error);
    console.error('Error stack:', errorStack);
    
    // במקרה של שגיאה - נסה להחזיר ניתוח בסיסי
    try {
      const textToAnalyze = text || body?.text || '';
      if (!textToAnalyze.trim()) {
        throw new Error('No text provided');
      }
      const basicAnalysis = analyzeHebrewText(textToAnalyze);
      return NextResponse.json({
        success: true,
        analysis: {
          score: basicAnalysis.score,
          issues: basicAnalysis.issues,
          suggestions: basicAnalysis.suggestions,
        },
        result: {
          originalText: textToAnalyze,
          analyzedText: textToAnalyze,
          appliedPatterns: [],
        },
        learnedPatterns: [],
        warning: 'הניתוח בוצע ללא דפוסי למידה בשל שגיאת מסד נתונים',
        error: errorDetails,
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to analyze text', 
          details: errorDetails,
          stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
        },
        { status: 500 }
      );
    }
  }
}

