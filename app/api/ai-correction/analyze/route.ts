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
        maxTokens: 4096, // הגדלנו ל-4096 כדי שיהיה מספיק מקום
        temperature: 0.7,
      });

      console.log('Alternatives response received, length:', alternativesResponse.length);
      console.log('First 500 chars:', alternativesResponse.substring(0, 500));

      let cleanedResponse = alternativesResponse.trim();
      
      // ניקוי markdown code blocks
      if (cleanedResponse.includes('```json')) {
        const start = cleanedResponse.indexOf('```json') + 7;
        const end = cleanedResponse.lastIndexOf('```');
        if (end > start) {
          cleanedResponse = cleanedResponse.substring(start, end).trim();
        }
      } else if (cleanedResponse.startsWith('```')) {
        const start = cleanedResponse.indexOf('\n') + 1;
        const end = cleanedResponse.lastIndexOf('```');
        if (end > start) {
          cleanedResponse = cleanedResponse.substring(start, end).trim();
        }
      }

      // ניקוי backticks נוספים
      cleanedResponse = cleanedResponse.replace(/^`+/, '').replace(/`+$/, '').trim();

      console.log('Cleaned response length:', cleanedResponse.length);
      console.log('First 300 chars of cleaned:', cleanedResponse.substring(0, 300));

      // ניסיון לפרש JSON
      let alternativesData;
      try {
        alternativesData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // אם לא הצלחנו, ננסה למצוא את ה-JSON בתוך הטקסט
        const firstBrace = cleanedResponse.indexOf('{');
        const lastBrace = cleanedResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const extracted = cleanedResponse.substring(firstBrace, lastBrace + 1);
          console.log('Trying to parse extracted JSON:', extracted.substring(0, 200));
          alternativesData = JSON.parse(extracted);
        } else {
          throw parseError;
        }
      }

      console.log('Parsed alternatives data:', {
        hasMain: !!alternativesData.main,
        alternativesCount: alternativesData.alternatives?.length || 0
      });

      mainCorrectedText = alternativesData.main || text; // התיקון הראשי
      alternatives = alternativesData.alternatives || [];
      
      // אם אין alternatives אבל יש main, ניצור גרסה אחת מהתיקון הראשי
      if (alternatives.length === 0 && mainCorrectedText !== text) {
        alternatives = [{
          text: mainCorrectedText,
          explanation: 'התיקון הראשי המומלץ',
          context: 'בינוני'
        }];
      }
    } catch (altError) {
      console.error('Error generating alternatives:', altError);
      console.error('Error details:', altError instanceof Error ? altError.message : String(altError));
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

