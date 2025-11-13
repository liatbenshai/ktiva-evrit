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

    const supportedLanguages = ['hebrew', 'english', 'russian', 'french', 'romanian', 'italian'];
    if (
      !supportedLanguages.includes(fromLang) ||
      !supportedLanguages.includes(toLang) ||
      fromLang === toLang
    ) {
      return NextResponse.json(
        { error: 'Invalid language combination' },
        { status: 400 }
      );
    }

    // טעינת idioms מהמאגר (עם טיפול בשגיאות)
    let idioms: Array<{ english: string; hebrew: string }> = [];
    try {
      idioms = await prisma.idiom.findMany({
        where: { learned: true },
        select: {
          english: true,
          hebrew: true,
        },
      });
    } catch (dbError) {
      console.warn('Failed to load idioms from database, continuing without idioms:', dbError);
      // ממשיכים בלי idioms אם יש בעיה במסד הנתונים
      idioms = [];
    }

    // טעינת מילים שנשמרו בלימוד שפות (LanguageEntry)
    // המילים האלה ישמשו כמילון תרגומים מועדף
    let savedLanguageEntries: Array<{ hebrew: string; target: string }> = [];
    try {
      // קביעת השפה הרלוונטית לפי כיוון התרגום
      let relevantTargetLanguage: string | undefined;
      
      if (fromLang === 'hebrew') {
        // מתרגמים מעברית - השפה היא toLang
        relevantTargetLanguage = toLang === 'english' ? 'english' :
                                 toLang === 'russian' ? 'russian' :
                                 toLang === 'french' ? 'french' :
                                 toLang === 'romanian' ? 'romanian' :
                                 toLang === 'italian' ? 'italian' : undefined;
      } else if (toLang === 'hebrew') {
        // מתרגמים לעברית - השפה היא fromLang
        relevantTargetLanguage = fromLang === 'english' ? 'english' :
                                 fromLang === 'russian' ? 'russian' :
                                 fromLang === 'french' ? 'french' :
                                 fromLang === 'romanian' ? 'romanian' :
                                 fromLang === 'italian' ? 'italian' : undefined;
      } else {
        // תרגום בין שתי שפות זרות - לא רלוונטי כרגע
        relevantTargetLanguage = undefined;
      }

      if (relevantTargetLanguage) {
        const entries = await prisma.languageEntry.findMany({
          where: {
            userId,
            targetLanguage: relevantTargetLanguage,
          },
          select: {
            hebrewTerm: true,
            translatedTerm: true,
          },
          take: 100, // מגבילים ל-100 מילים כדי לא להכביד על ה-prompt
        });

        // המרה לפורמט של idioms
        savedLanguageEntries = entries.map(entry => ({
          hebrew: entry.hebrewTerm,
          target: entry.translatedTerm,
        }));
      }
    } catch (dbError) {
      console.warn('Failed to load saved language entries, continuing without them:', dbError);
      savedLanguageEntries = [];
    }

    // שילוב idioms עם המילים שנשמרו בלימוד שפות
    // פורמט אחיד: { hebrew, target } או { english, hebrew }
    const allPreferredTranslations = [
      ...idioms.map(id => ({ english: id.english, hebrew: id.hebrew })),
      ...savedLanguageEntries.map(entry => ({ hebrew: entry.hebrew, target: entry.target })),
    ];

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
      }

      // תחליפים מועדפים - ניתן להוסיף בעתיד מתוך userProfile
      // כרגע נשאיר את זה ריק עד שנוסיף פונקציה לקבלת userProfile
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // ממשיכים בלי העדפות אם יש שגיאה
    }

    // בניית ה-prompt המתוחכם
    // משתמשים ב-allPreferredTranslations במקום idioms בלבד
    const prompt = translationPrompt(
      text,
      fromLang as 'hebrew' | 'english' | 'russian' | 'french' | 'romanian' | 'italian',
      toLang as 'hebrew' | 'english' | 'russian' | 'french' | 'romanian' | 'italian',
      allPreferredTranslations,
      userPreferences,
      context
    );

    const getSystemPrompt = () => {
      const languageNames: Record<string, string> = {
        hebrew: 'עברית',
        english: 'אנגלית',
        russian: 'רוסית',
        french: 'צרפתית',
        romanian: 'רומנית',
        italian: 'איטלקית',
      };
      
      const targetLanguageName = languageNames[toLang] || toLang;
      
      if (toLang === 'hebrew') {
        return 'אתה מתרגם מקצועי ומומחה בתרגום לעברית. אתה כותב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי. אתה פתוח ללמוד ולשפר מעריכות המשתמש ומשוב שלו. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף, ללא הסברים, ללא markdown code blocks.';
      } else {
        return `אתה מתרגם מקצועי ומומחה בתרגום ל${targetLanguageName}. אתה כותב ${targetLanguageName} תקנית, טבעית וזורמת - לא תרגום מילולי. אתה פתוח ללמוד ולשפר מעריכות המשתמש ומשוב שלו. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף, ללא הסברים, ללא markdown code blocks.`;
      }
    };
    
    const systemPrompt = getSystemPrompt();

    // ביצוע התרגום עם אפשרויות חלופיות
    let translationResponse: string;
    try {
      translationResponse = await generateText({
        prompt,
        systemPrompt,
        maxTokens: 4096, // יותר tokens לאפשרויות חלופיות
        temperature: 0.5, // טמפרטורה קצת גבוהה יותר כדי לקבל וריאציות
      });
    } catch (apiError) {
      console.error('Anthropic API error:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      
      // בדיקת סוגי שגיאות נפוצות
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        return NextResponse.json(
          { 
            error: 'Translation failed', 
            details: 'API key configuration issue. Please check your ANTHROPIC_API_KEY environment variable.',
            code: 'API_KEY_ERROR'
          },
          { status: 500 }
        );
      }
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return NextResponse.json(
          { 
            error: 'Translation failed', 
            details: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_ERROR'
          },
          { status: 429 }
        );
      }
      
      throw apiError; // זורקים הלאה אם זה לא שגיאה מוכרת
    }

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
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // לוג מפורט יותר ל-production debugging
    console.error('Translation error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { 
        error: 'Translation failed', 
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred during translation. Please try again.',
        code: 'TRANSLATION_ERROR'
      },
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

