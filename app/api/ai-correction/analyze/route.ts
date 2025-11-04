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
      const issuesList = analysis.issues.length > 0 
        ? analysis.issues.map(issue => `- ${issue.original} → ${issue.suggestion} (${issue.explanation})`).join('\n')
        : 'לא זוהו בעיות ספציפיות - הטקסט דורש שיפור כללי בעברית טבעית ותקנית';
      
      const alternativesPrompt = `אתה מומחה בעברית תקנית וטבעית. המשימה: ליצור 4 גרסאות שונות של הטקסט הבא - גרסה ראשית + 3 גרסאות חלופיות שונות מאוד זו מזו.

<טקסט_מקורי>
${text}
</טקסט_מקורי>

<בעיות_שזוהו>
${issuesList}
</בעיות_שזוהו>

**חשוב מאוד:** כל גרסה חייבת להיות שונה לחלוטין מהאחרות! אל תחזיר אותו טקסט 4 פעמים.

צור:
1. **main** - התיקון הראשי המומלץ (תיקון בינוני, מאוזן, שומר על המשמעות המקורית)
2. **alternative1** - תיקון מינימלי בלבד - רק את הבעיות הקריטיות ביותר, שינוי מינימלי מהמקור
3. **alternative2** - תיקון בינוני-מתקדם - שיפור נרחב יותר, החלפת ביטויים AI בניסוחים עבריים טבעיים
4. **alternative3** - תיקון מקסימלי - שיפור מלא, כתיבה עברית טבעית לחלוטין, החלפת כל ביטוי AI אפשרי

**דרישות:**
- כל גרסה חייבת להיות שונה מהאחרות
- alternative1: מינימלי - רק תיקונים קריטיים
- alternative2: בינוני - שיפורים נרחבים יותר
- alternative3: מקסימלי - שיפור מלא
- שמור על המשמעות המקורית בכל הגרסאות

**חשוב מאוד:** החזר רק JSON תקין בלבד, ללא markdown, ללא הסברים נוספים, ללא backticks.

פורמט JSON:
{
  "main": "התיקון הראשי המומלץ - תיקון בינוני מאוזן",
  "alternatives": [
    {
      "text": "גרסה 1 - תיקון מינימלי בלבד (רק בעיות קריטיות)",
      "explanation": "תיקון מינימלי - רק את הבעיות הקריטיות ביותר",
      "context": "מינימלי"
    },
    {
      "text": "גרסה 2 - תיקון בינוני-מתקדם (שיפורים נרחבים)",
      "explanation": "שיפורים נרחבים יותר בביטויים וניסוחים",
      "context": "בינוני-מתקדם"
    },
    {
      "text": "גרסה 3 - תיקון מקסימלי (שיפור מלא)",
      "explanation": "שיפור מלא - עברית טבעית לחלוטין",
      "context": "מקסימלי"
    }
  ]
}`;

      const alternativesSystemPrompt = 'אתה מומחה בעברית תקנית וטבעית. אתה מספק תיקון ראשי מומלץ וגרסאות משופרות של טקסטים שנוצרו על ידי AI. **חשוב מאוד:** כל גרסה חייבת להיות שונה לחלוטין מהאחרות - לא לחזור על אותו טקסט. החזר תמיד JSON תקין בלבד, ללא markdown, ללא backticks, ללא טקסט נוסף.';

      const alternativesResponse = await generateText({
        prompt: alternativesPrompt,
        systemPrompt: alternativesSystemPrompt,
        maxTokens: 4096, // הגדלנו ל-4096 כדי שיהיה מספיק מקום
        temperature: 0.9, // הגדלנו ל-0.9 כדי לקבל גרסאות שונות יותר
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

