import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';

/**
 * POST - ניתוח טקסט מקצועי
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'נא להזין טקסט לניתוח' },
        { status: 400 }
      );
    }

    const systemPrompt = `אתה מומחה לניתוח טקסטים בעברית תקנית. תפקידך לנתח טקסטים בעברית ולספק ניתוח מקצועי ומפורט.

הנחיות חשובות:
1. זהה את המאפיינים האמיתיים של הטקסט - אל תמציא דברים
2. תן ניתוח מדויק ומקצועי המתמחה בעברית תקנית
3. השתמש בנתונים אמיתיים (מספר מילים, משפטים, פסקאות)
4. זהה את הסגנון, הטון, והרגש בצורה מדויקת בהתאם לעברית תקנית
5. תן המלצות מעשיות לשיפור בעברית תקנית
6. זהה בעיות בעברית - תרגומים מילוליים, ביטויי AI, אנגליציזמים
7. הערך את רמת העברית התקנית של הטקסט

פורמט התשובה:
- ניתוח מפורט של הטקסט בעברית תקנית
- המלצות לשיפור בעברית תקנית
- נתונים סטטיסטיים`;

    const prompt = `נא לנתח את הטקסט הבא בצורה מקצועית ומפורטת:

${text}

בצע ניתוח מקצועי של הטקסט בעברית תקנית:
1. **נתונים סטטיסטיים:**
   - מספר מילים
   - מספר משפטים
   - מספר פסקאות
   - אורך ממוצע של משפט
   - אורך ממוצע של מילה

2. **ניתוח סגנון בעברית:**
   - רמת פורמליות (פורמלי/בינוני/לא פורמלי)
   - רמת מורכבות (פשוט/בינוני/מורכב)
   - סגנון כתיבה (אקדמי/עסקי/יצירתי/עיתונאי/אחר)
   - רמת עברית תקנית (תקנית/בינונית/לא תקנית)

3. **ניתוח טון:**
   - טון כללי (חיובי/שלילי/ניטרלי)
   - רגש (שמח/עצוב/כועס/נייטרלי/אחר)
   - מידת ביטחון (בטוח/ספקני/מהסס)

4. **ניתוח תוכן:**
   - נושאים מרכזיים
   - מילות מפתח
   - מסרים עיקריים

5. **ניתוח קריאות בעברית:**
   - רמת קריאות (קל/בינוני/קשה)
   - הערכת גיל קורא מתאים
   - הערכת זמן קריאה

6. **ניתוח עברית תקנית:**
   - זיהוי תרגומים מילוליים
   - זיהוי ביטויי AI
   - זיהוי אנגליציזמים
   - הערכת איכות העברית

7. **המלצות לשיפור בעברית תקנית:**
   - נקודות חוזק
   - נקודות לשיפור בעברית
   - הצעות ספציפיות לעברית תקנית

**חשוב מאוד:** החזר רק את אובייקט ה-JSON בלבד, ללא markdown, ללא backticks, ללא טקסט הסבר. 
התשובה שלך צריכה להתחיל ב-{ ולהסתיים ב-}

פורמט JSON מדויק:
{
  "statistics": {
    "wordCount": number,
    "sentenceCount": number,
    "paragraphCount": number,
    "avgSentenceLength": number,
    "avgWordLength": number,
    "readingTimeMinutes": number
  },
  "style": {
    "formality": "formal" | "semi-formal" | "informal",
    "complexity": "simple" | "moderate" | "complex",
    "writingStyle": "academic" | "business" | "creative" | "journalistic" | "other",
    "hebrewQuality": "excellent" | "good" | "moderate" | "poor",
    "styleDescription": "תיאור מפורט של הסגנון בעברית תקנית"
  },
  "tone": {
    "overallTone": "positive" | "negative" | "neutral",
    "emotion": "happy" | "sad" | "angry" | "neutral" | "other",
    "confidence": "confident" | "uncertain" | "hesitant",
    "toneDescription": "תיאור מפורט של הטון"
  },
  "content": {
    "mainTopics": ["נושא 1", "נושא 2"],
    "keywords": ["מילה 1", "מילה 2"],
    "mainMessages": ["מסר 1", "מסר 2"]
  },
  "readability": {
    "level": "easy" | "moderate" | "difficult",
    "suitableAge": "גיל מתאים",
    "readingTimeMinutes": number
  },
  "hebrewAnalysis": {
    "literalTranslations": ["תרגום מילולי 1", "תרגום מילולי 2"],
    "aiPatterns": ["ביטוי AI 1", "ביטוי AI 2"],
    "anglicisms": ["אנגליציזם 1", "אנגליציזם 2"],
    "qualityDescription": "תיאור איכות העברית"
  },
  "recommendations": {
    "strengths": ["חוזק 1", "חוזק 2"],
    "improvements": ["שיפור 1", "שיפור 2"],
    "suggestions": ["הצעה 1", "הצעה 2"]
  },
  "overallScore": number (0-100)
}`;

    const analysisText = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    });

    // נסה לפרסר את התשובה כ-JSON
    let analysis;
    try {
      // נקה את התשובה מ-markdown code blocks אם יש
      let cleanedText = analysisText.trim();
      
      // הסר markdown code blocks אם יש
      if (cleanedText.startsWith('```')) {
        const lines = cleanedText.split('\n');
        const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
        const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().startsWith('```'));
        if (startIndex !== -1 && endIndex !== -1) {
          cleanedText = lines.slice(startIndex + 1, endIndex).join('\n');
        }
      }
      
      // מצא את ה-JSON (מתחיל ב-{ ומסתיים ב-})
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }
      
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn('Failed to parse JSON response:', parseError);
      console.warn('Raw response:', analysisText.substring(0, 500));
      analysis = {
        statistics: {
          wordCount: text.split(/\s+/).length,
          sentenceCount: text.split(/[.!?]+/).filter(s => s.trim()).length,
          paragraphCount: text.split(/\n\n+/).filter(p => p.trim()).length,
          avgSentenceLength: 0,
          avgWordLength: 0,
          readingTimeMinutes: Math.ceil(text.split(/\s+/).length / 200),
        },
        style: {
          formality: 'unknown',
          complexity: 'unknown',
          writingStyle: 'unknown',
          hebrewQuality: 'unknown',
          styleDescription: analysisText.substring(0, 200),
        },
        hebrewAnalysis: {
          literalTranslations: [],
          aiPatterns: [],
          anglicisms: [],
          qualityDescription: 'לא ניתן לנתח',
        },
        tone: {
          overallTone: 'neutral',
          emotion: 'neutral',
          confidence: 'unknown',
          toneDescription: 'לא ניתן לנתח',
        },
        content: {
          mainTopics: [],
          keywords: [],
          mainMessages: [],
        },
        readability: {
          level: 'moderate',
          suitableAge: 'לא זמין',
          readingTimeMinutes: Math.ceil(text.split(/\s+/).length / 200),
        },
        recommendations: {
          strengths: [],
          improvements: [],
          suggestions: [],
        },
        overallScore: 50,
        rawResponse: analysisText,
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing text:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בניתוח הטקסט' },
      { status: 500 }
    );
  }
}

