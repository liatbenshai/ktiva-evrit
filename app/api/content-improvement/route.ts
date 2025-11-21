import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';

/**
 * POST - שיפור תוכן בהתאם למקצוע או מטרה
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, profession, goal } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'נא להזין טקסט לשיפור' },
        { status: 400 }
      );
    }

    if (!profession && !goal) {
      return NextResponse.json(
        { error: 'נא לבחור מקצוע או להזין מטרה' },
        { status: 400 }
      );
    }

    const systemPrompt = `אתה מומחה לשיפור תוכן בעברית תקנית. תפקידך לשפר טקסטים בהתאם למקצוע או מטרה ספציפית.

הנחיות חשובות:
1. שפר את הטקסט בהתאם למקצוע או המטרה שצוינה
2. שמור על המסר המקורי של הטקסט
3. השתמש בעברית תקנית וטבעית
4. התאם את הסגנון והטון למקצוע או המטרה
5. הסבר את השינויים שביצעת
6. הצע שיפורים נוספים אם נדרש
7. שמור על אורך דומה לטקסט המקורי (אלא אם נדרש שינוי)

פורמט התשובה:
- טקסט משופר
- הסבר על השינויים שבוצעו
- המלצות נוספות לשיפור`;

    const contextInfo = profession 
      ? `מקצוע: ${profession}`
      : `מטרה: ${goal}`;

    const prompt = `נא לשפר את הטקסט הבא בהתאם ל-${contextInfo}:

${text}

בצע שיפור מקצועי של הטקסט:
1. התאם את הסגנון והטון ל-${contextInfo}
2. שפר את הבהירות והדיוק
3. השתמש בעברית תקנית וטבעית
4. שמור על המסר המקורי
5. הסבר את השינויים שביצעת
6. הצע שיפורים נוספים אם נדרש

השתמש בפורמט JSON:
{
  "improvedText": "הטקסט המשופר",
  "changes": [
    {
      "type": "style" | "tone" | "clarity" | "grammar" | "terminology" | "other",
      "description": "תיאור השינוי",
      "original": "הטקסט המקורי (אם רלוונטי)",
      "improved": "הטקסט המשופר (אם רלוונטי)"
    }
  ],
  "explanation": "הסבר כללי על השיפורים שבוצעו",
  "additionalRecommendations": ["המלצה 1", "המלצה 2"],
  "overallScore": number (0-100) - ציון איכות הטקסט המשופר
}

**חשוב מאוד:** החזר רק את אובייקט ה-JSON בלבד, ללא markdown, ללא backticks, ללא טקסט הסבר. 
התשובה שלך צריכה להתחיל ב-{ ולהסתיים ב-}`;

    const improvedText = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    });

    let improvement;
    try {
      let cleanedText = improvedText.trim();
      if (cleanedText.startsWith('```')) {
        const lines = cleanedText.split('\n');
        const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
        const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().startsWith('```'));
        if (startIndex !== -1 && endIndex !== -1) {
          cleanedText = lines.slice(startIndex + 1, endIndex).join('\n');
        }
      }
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }
      improvement = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse JSON response, using text format', parseError);
      // Fallback - אם לא הצליח לפרסר JSON, נשתמש בטקסט ישירות
      improvement = {
        improvedText: improvedText,
        changes: [],
        explanation: 'הטקסט שופר בהתאם למקצוע/מטרה. לא ניתן לפרסר את הפרטים המלאים.',
        additionalRecommendations: [],
        overallScore: 70,
      };
    }

    return NextResponse.json({
      success: true,
      improvement,
    });
  } catch (error: any) {
    console.error('Error improving content:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בשיפור התוכן' },
      { status: 500 }
    );
  }
}

