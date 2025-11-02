import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { translationPrompt } from '@/prompts';
import { prisma } from '@/lib/prisma';
import { learningSystem } from '@/lib/learning-system';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      fromLang,
      toLang,
      context,
      userId = 'default-user',
      trackCorrections = true,
    } = body;

    if (!text || !fromLang || !toLang) {
      return NextResponse.json(
        { error: 'text, fromLang, and toLang are required' },
        { status: 400 }
      );
    }

    if (
      (fromLang !== 'hebrew' && fromLang !== 'english' && fromLang !== 'russian') ||
      (toLang !== 'hebrew' && toLang !== 'english' && toLang !== 'russian') ||
      fromLang === toLang
    ) {
      return NextResponse.json(
        { error: 'Invalid language combination' },
        { status: 400 }
      );
    }

    // טעינת idioms מהמאגר
    const idioms = await prisma.idiom.findMany({
      where: { learned: true },
      select: {
        english: true,
        hebrew: true,
      },
    });

    // טעינת העדפות המשתמש ממערכת הלמידה
    let userPreferences: {
      forbiddenWords?: string[];
      preferredWords?: { [key: string]: string };
      stylePreferences?: {
        formality?: 'formal' | 'casual' | 'professional';
        tone?: string;
      };
    } = {};

    try {
      const userStats =
        typeof learningSystem.getUserStats === 'function'
          ? await Promise.resolve(learningSystem.getUserStats(userId))
          : null;

      const writingSuggestions =
        typeof learningSystem.getWritingSuggestions === 'function'
          ? await Promise.resolve(
              learningSystem.getWritingSuggestions(userId, 'translation')
            )
          : null;

      if (writingSuggestions) {
        // מילים להימנעות
        userPreferences.forbiddenWords = writingSuggestions.commonMistakes
          .filter((m) => m.frequency >= 2)
          .map((m) => m.mistake);

        // תחליפים מועדפים
        if (userStats && userStats.preferences) {
          userPreferences.preferredWords = userStats.preferences.preferredWords || {};
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // ממשיכים בלי העדפות אם יש שגיאה
    }

    // בניית ה-prompt המתוחכם
    const prompt = translationPrompt(
      text,
      fromLang as 'hebrew' | 'english',
      toLang as 'hebrew' | 'english',
      idioms,
      userPreferences,
      context
    );

    const getSystemPrompt = () => {
      if (toLang === 'hebrew') {
        return 'אתה מתרגם מקצועי ומומחה בתרגום לעברית. אתה כותב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי. אתה פתוח ללמוד ולשפר מעריכות המשתמש ומשוב שלו. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף, ללא הסברים, ללא markdown code blocks.';
      } else if (toLang === 'english') {
        return 'אתה מתרגם מקצועי ומומחה בתרגום לאנגלית. אתה כותב אנגלית תקנית, טבעית וזורמת - לא תרגום מילולי. אתה פתוח ללמוד ולשפר מעריכות המשתמש ומשוב שלו. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף, ללא הסברים, ללא markdown code blocks.';
      } else if (toLang === 'russian') {
        return 'אתה מתרגם מקצועי ומומחה בתרגום לרוסית. אתה כותב רוסית תקנית, טבעית וזורמת - לא תרגום מילולי. אתה פתוח ללמוד ולשפר מעריכות המשתמש ומשוב שלו. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף, ללא הסברים, ללא markdown code blocks.';
      }
      return 'אתה מתרגם מקצועי. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.';
    };
    
    const systemPrompt = getSystemPrompt();

    // ביצוע התרגום עם אפשרויות חלופיות
    const translationResponse = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 4096, // יותר tokens לאפשרויות חלופיות
      temperature: 0.5, // טמפרטורה קצת גבוהה יותר כדי לקבל וריאציות
    });

    // ניסיון לפרש את התשובה כ-JSON
    let translationData: {
      main: string;
      alternatives?: Array<{
        text: string;
        explanation?: string;
        context?: string;
      }>;
      wordAlternatives?: { [key: string]: string[] };
    };

    try {
      // ניקוי של markdown code blocks אם יש
      let cleanedResponse = translationResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      translationData = JSON.parse(cleanedResponse);
    } catch (error) {
      // אם לא הצלחנו לפרש כ-JSON, נשתמש בתשובה כטקסט רגיל
      console.warn('Failed to parse translation as JSON, using as plain text:', error);
      translationData = {
        main: translationResponse.trim(),
        alternatives: [],
        wordAlternatives: {},
      };
    }

    // שמירת התרגום המקורי למעקב (אם המשתמש יתקן אותו)
    const translationRecord = {
      originalText: text,
      translatedText: translationData.main,
      fromLang,
      toLang,
      context: context || '',
      userId,
      timestamp: new Date(),
    };

    return NextResponse.json({
      success: true,
      result: translationData.main,
      alternatives: translationData.alternatives || [],
      wordAlternatives: translationData.wordAlternatives || {},
      original: text,
      fromLang,
      toLang,
      translationId: `translation_${Date.now()}`, // מזהה זמני למעקב אחר תיקונים
      trackCorrections,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - לקבלת היסטוריית תרגומים (אם נדרש בעתיד)
export async function GET() {
  return NextResponse.json({
    message: 'Translation API - Use POST to translate text',
  });
}

