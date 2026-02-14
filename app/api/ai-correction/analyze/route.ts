import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeHebrewText, applyLearnedPatterns } from '@/lib/ai/hebrew-analyzer';
import { generateText } from '@/lib/ai/claude';
import { getAntiPatternInstruction } from '@/prompts/hebrew-anti-patterns';

/**
 * POST - ניתוח טקסט והחלת תיקונים אוטומטיים
 */
export async function POST(req: NextRequest) {
  let body: any = {};
  let text = '';
  
  try {
    body = await req.json();
    text = body.text || '';
    const {
      userId = 'default-user',
      applyPatterns = true,
      revisionLevel = 'balanced',
      contentStyle = 'general',
    } = body;

    const revisionConfigMap = {
      minimal: {
        temperature: 0.55,
        instruction: 'בצע שינויים מינימליים בלבד. שמור על רוב הניסוח המקורי של המשתמש, ותקן רק ביטויים שברור שהם תרגום או שגיאה קשה. אל תכתוב מחדש פסקאות שלמות אם אין צורך.',
        mainDescription: 'התיקון הראשי המומלץ - שמרני מאוד, תקן רק את מה שחייב תיקון.',
      },
      balanced: {
        temperature: 0.75,
        instruction: 'בצע שיפור מאוזן שמרגיש טבעי בעברית אך עדיין משמר את המבנה והטון המקוריים. החלף ביטויי AI נפוצים בניסוחים טבעיים יותר.',
        mainDescription: 'התיקון הראשי המומלץ - שיפור עברי טבעי ושוטף, תוך שמירה על הסגנון המקורי.',
      },
      deep: {
        temperature: 0.95,
        instruction: 'הפוך את הטקסט לעברית טבעית לחלוטין. אל תהסס לשכתב משפטים ופסקאות כדי שיישמעו כמו דובר עברית מקצועי. שמור על המשמעות אך לא על הניסוח.',
        mainDescription: 'התיקון הראשי המומלץ - כתיבה עברית טבעית לחלוטין עם שכתוב חופשי של הטקסט.',
      },
    } as const;

    const revisionConfig =
      revisionConfigMap[revisionLevel as keyof typeof revisionConfigMap] ?? revisionConfigMap.balanced;

    const contentStyleConfigMap = {
      general: {
        promptInstruction: 'שמור על סגנון עברי תקני ומקצועי, מתאים לרוב סוגי התוכן הכלליים.',
        systemTone: 'סגנון עברי תקני, מקצועי וקריא לכל קהל.',
        label: 'כללי',
      },
      legal: {
        promptInstruction: `ניסוח משפטי רשמי בעברית תקנית כאילו נכתב על ידי עורך דין מוסמך בישראל. השתמש במונחים משפטיים מקובלים במשפט הישראלי כגון "למען הסר ספק", "האמור לעיל אינו גורע", "בהתאם להוראות סעיף", "כפוף לאמור", "מוסכם ומוצהר", "החייב". לכלול הפניות לחוקים, תקנות ופסיקה רלוונטיים (למשל "חוק החוזים (חלק כללי), התשל"ג-1973", "תקנות סדר הדין האזרחי, התשע"ט-2018", "ע\"א 1234/56"). העדף משפטים מורכבים ומדורגים, סעיפים ממוספרים (1., 1.1, 1.1.1) והגדרות. שמור על טון ענייני ומקצועי לחלוטין, ללא פנייה בלשון אישית או סלנג. השתמש בזמן עתיד משפטי ("יתחייב", "ישלם", "יודיע") ובגוף שלישי.`,
        systemTone: 'סגנון חוזי/חקיקתי רשמי של עורך דין בישראל, כולל אזכור חוקים, תקנות ופסיקה רלוונטיים בשפה משפטית מדויקת.',
        label: 'משפטי',
      },
      academic: {
        promptInstruction: `סגנון אקדמי מחקרי. כתוב בלשון רשמית ומדויקת, עם טיעון לוגי, שימוש בציטוטים או הפניות (למשל "ראו: ..."), והימנע מנימה אישית. הקפד על מבנה פסקאות ברור וסיכום ביניים לכל פרק.`,
        systemTone: 'סגנון אקדמי רשמי, כמו מאמרים מדעיים, עבודות סמינריוניות וכתיבה מחקרית.',
        label: 'אקדמי',
      },
      marketing: {
        promptInstruction: `סגנון שיווקי משכנע, אנרגטי ומניע לפעולה. השתמש במסרים רגשיים, בטון חיובי ובקריאות לפעולה (CTA). הדגש יתרונות, ערך ללקוח וסיפורי הצלחה. הימנע מלשון יבשה מדי.`,
        systemTone: 'סגנון שיווקי מודגש, כמו עמודי מכירה, דפי נחיתה וקמפיינים פרסומיים.',
        label: 'שיווקי',
      },
      friendly: {
        promptInstruction: `סגנון ידידותי ושיחתי. כתוב בלשון קרובה, טבעית וקלילה כאילו מדובר בשיחה עם חבר. אפשר להשתמש בשאלות רטוריות, דוגמאות יומיומיות ואמפתיה. הימנע מרשמיות יתר.`,
        systemTone: 'סגנון אישי ונגיש, כמו פוסטים ברשתות חברתיות, ניוזלטרים קלילים או מענה אישי.',
        label: 'ידידותי',
      },
    } as const;

    const contentStyleConfig =
      contentStyleConfigMap[contentStyle as keyof typeof contentStyleConfigMap] ?? contentStyleConfigMap.general;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // הגבלת אורך טקסט - מניעת עלויות API מוגזמות
    const MAX_TEXT_LENGTH = 50000;
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `הטקסט ארוך מדי (${text.length} תווים). המקסימום הוא ${MAX_TEXT_LENGTH} תווים.` },
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

    // 🔥 החלת דפוסים שנלמדו על הטקסט - זה הפיצ'ר החסר!
    let textAfterPatterns = text;
    let appliedPatterns: Array<{ from: string; to: string }> = [];
    
    if (applyPatterns && patterns.length > 0) {
      const patternResult = applyLearnedPatterns(text, patterns);
      textAfterPatterns = patternResult.correctedText;
      appliedPatterns = patternResult.appliedPatterns;
      
      console.log(`✅ Applied ${appliedPatterns.length} learned patterns automatically:`, 
        appliedPatterns.map(p => `"${p.from}" → "${p.to}"`).join(', '));
    }

    // יצירת תיקון ראשי ואפשרויות חלופיות (כמו בתכונת התרגום)
    // נשתמש בטקסט אחרי החלת הדפוסים כנקודת התחלה
    let mainCorrectedText = textAfterPatterns; // ברירת מחדל - הטקסט אחרי החלת דפוסים
    let alternatives: Array<{ text: string; explanation?: string; context?: string }> = [];
    
    try {
      // יצירת תיקון ראשי + 3 גרסאות נוספות
      const issuesList = analysis.issues.length > 0 
        ? analysis.issues.map(issue => `- ${issue.original} → ${issue.suggestion} (${issue.explanation})`).join('\n')
        : 'לא זוהו בעיות ספציפיות - הטקסט דורש שיפור כללי בעברית טבעית ותקנית';
      
      const appliedPatternsNote = appliedPatterns.length > 0 
        ? `\n<דפוסים_שכבר_הוחלו>
המערכת כבר החילה ${appliedPatterns.length} דפוסי תיקון שנלמדו:
${appliedPatterns.map(p => `- "${p.from}" → "${p.to}"`).join('\n')}
</דפוסים_שכבר_הוחלו>\n`
        : '';

      const mainLine = revisionLevel === 'minimal'
        ? '1. **main** - התיקון הראשי המומלץ (מינימלי מאוד, שומר על רוב הניסוח המקורי)'
        : revisionLevel === 'deep'
          ? '1. **main** - התיקון הראשי המומלץ (שכתוב מקיף בעברית טבעית לחלוטין)'
          : '1. **main** - התיקון הראשי המומלץ (שיפור עברי טבעי ומאוזן)';

      const alternativesPrompt = `שפר את הטקסט הבא לעברית טבעית. צור גרסה ראשית מתוקנת + 3 חלופות ברמות שונות.

טקסט לתיקון:
${textAfterPatterns}

בעיות שזוהו:
${issuesList}

הנחיות: ${revisionConfig.instruction}
סגנון: ${contentStyleConfig.promptInstruction}

צור JSON עם:
- main: ${revisionConfig.mainDescription}
- alternative1: תיקון מינימלי - רק שגיאות קריטיות
- alternative2: תיקון בינוני - שיפור ביטויים ושטף
- alternative3: תיקון מקסימלי - שכתוב בעברית טבעית לחלוטין

שמור על המשמעות המקורית. כל גרסה חייבת להיות שונה.

פורמט (JSON בלבד, ללא markdown):
{
  "main": "טקסט מתוקן",
  "alternatives": [
    { "text": "גרסה מינימלית", "explanation": "הסבר קצר", "context": "מינימלי" },
    { "text": "גרסה בינונית", "explanation": "הסבר קצר", "context": "בינוני" },
    { "text": "גרסה מקסימלית", "explanation": "הסבר קצר", "context": "מקסימלי" }
  ]
}`;

      const alternativesSystemPrompt = `אתה מומחה בעברית תקנית וטבעית. אתה מספק תיקון ראשי מומלץ וגרסאות משופרות של טקסטים.

**חשוב מאוד:**
- כל גרסה חייבת להיות שונה לחלוטין מהאחרות
- כל גרסה חייבת להישמע טבעית — כמו שישראלי שפת אם היה כותב, לא כמו AI
- שמור על הסגנון: ${contentStyleConfig.systemTone}

${getAntiPatternInstruction(false)}

החזר תמיד JSON תקין בלבד, ללא markdown, ללא backticks, ללא טקסט נוסף.`;

      const alternativesResponse = await generateText({
        prompt: alternativesPrompt,
        systemPrompt: alternativesSystemPrompt,
        maxTokens: 4096, // הגדלנו ל-4096 כדי שיהיה מספיק מקום
        temperature: revisionConfig.temperature,
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
      analyzedText: mainCorrectedText, // התיקון הראשי המומלץ (כולל דפוסים שהוחלו)
      textAfterPatterns: textAfterPatterns, // הטקסט אחרי החלת דפוסים בלבד (לפני Claude)
      appliedPatterns: appliedPatterns, // דפוסים שהוחלו אוטומטית ✅
      availablePatterns: patterns.map(p => ({
        from: p.from,
        to: p.to,
        confidence: p.confidence,
      })), // כל הדפוסים הזמינים (למידע בלבד)
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
      revisionLevel,
      contentStyle,
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

