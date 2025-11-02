import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { prisma } from '@/lib/prisma';
import { learningSystem } from '@/lib/learning-system';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      selectedText,
      fullText,
      fromLang,
      toLang,
      context,
      userId = 'default-user',
    } = body;

    if (
      !selectedText || !fullText || !fromLang || !toLang ||
      (fromLang !== 'hebrew' && fromLang !== 'english' && fromLang !== 'russian') ||
      (toLang !== 'hebrew' && toLang !== 'english' && toLang !== 'russian')
    ) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // טעינת idioms מהמאגר
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
      console.error('Error loading idioms:', dbError);
      // נמשיך בלי idioms אם יש בעיה
      idioms = [];
    }

    // טעינת העדפות המשתמש
    let userPreferences: {
      forbiddenWords?: string[];
      preferredWords?: { [key: string]: string };
    } = {};

    try {
      if (typeof learningSystem.getWritingSuggestions === 'function') {
        try {
          const writingSuggestions = await Promise.resolve(
            learningSystem.getWritingSuggestions(userId, 'translation')
          );

          if (writingSuggestions && writingSuggestions.commonMistakes) {
            userPreferences.forbiddenWords = writingSuggestions.commonMistakes
              .filter((m: any) => m && m.frequency >= 2)
              .map((m: any) => m.mistake);
          }
        } catch (learnError) {
          console.warn('Error loading learning system suggestions:', learnError);
          // נמשיך בלי העדפות אם יש בעיה
        }
      }
    } catch (error) {
      console.warn('Error loading user preferences:', error);
      // נמשיך בלי העדפות
    }

    // בניית prompt להצעות חלופיות
    // הצעות הן חלופות באותה שפה של התרגום (toLang)
    // אבל אנחנו צריכים לדעת מה היה המקור כדי לתת הצעות טובות
    
    const idiomsSection = idioms && idioms.length > 0 ? `
**מילון תרגומים מועדפים:**
${idioms.map(idiom => {
  return `- "${idiom.english || ''}" → "${idiom.hebrew || ''}"`;
}).filter(line => line && !line.includes('""')).join('\n')}` : '';

    const prompt = `אתה מתרגם מקצועי. אני מבקש הצעות חלופיות לניסוח של טקסט ספציפי בתרגום.

**הטקסט המלא:**
${fullText}

**הטקסט הנבחר (שצריך הצעות חלופיות):**
"${selectedText}"

${idiomsSection}

${userPreferences.forbiddenWords && userPreferences.forbiddenWords.length > 0 ? `
**מילים להימנעות:**
${userPreferences.forbiddenWords.map(word => `- ❌ "${word}"`).join('\n')}` : ''}

${context ? `**הקשר:** ${context}` : ''}

**כיוון התרגום המקורי:** ${fromLang} → ${toLang}

**בקשה:**
צור 5-7 אפשרויות ניסוח חלופיות לטקסט הנבחר "${selectedText}" בשפה ${toLang === 'hebrew' ? 'עברית' : 'אנגלית'}. כל אפשרות צריכה להיות:
- טבעית ונשמעת טוב
- שונה מהאחרות (גישות שונות לתרגום)
- מתאימה להקשר של הטקסט המלא
- מתאימה למילון התרגומים המועדפים

**פורמט הפלט - JSON בלבד:**
{
  "suggestions": [
    {
      "text": "אפשרות תרגום 1",
      "explanation": "הסבר קצר למה אפשרות זו מתאימה",
      "tone": "רשמי / לא פורמלי / מקצועי / וכו",
      "whenToUse": "מתי להשתמש באפשרות זו"
    },
    {
      "text": "אפשרות תרגום 2",
      "explanation": "הסבר קצר",
      "tone": "...",
      "whenToUse": "..."
    }
  ]
}

**חשוב מאוד:** החזר רק JSON תקין, ללא markdown, ללא הסברים נוספים.`;

    const getSystemPrompt = () => {
      if (toLang === 'hebrew') {
        return 'אתה מומחה בעברית תקנית וטבעית. אתה מספק הצעות חלופיות לניסוח בעברית שמשפרות את התרגום. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.';
      } else if (toLang === 'english') {
        return 'אתה מומחה באנגלית תקנית וטבעית. אתה מספק הצעות חלופיות לניסוח באנגלית שמשפרות את התרגום. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.';
      } else if (toLang === 'russian') {
        return 'אתה מומחה ברוסית תקנית וטבעית. אתה מספק הצעות חלופיות לניסוח ברוסית שמשפרות את התרגום. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.';
      }
      return 'אתה מומחה בתרגום. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.';
    };
    
    const systemPrompt = getSystemPrompt();

    // ביצוע הבקשה
    let response: string;
    try {
      console.log('Calling generateText for suggestions...');
      console.log('Selected text:', selectedText.substring(0, 50) + '...');
      console.log('From lang:', fromLang, 'To lang:', toLang);
      
      response = await generateText({
        prompt,
        systemPrompt,
        maxTokens: 2048,
        temperature: 0.7, // טמפרטורה גבוהה יותר לווריאציות
      });
      
      console.log('Received response, length:', response?.length || 0);
    } catch (apiError: any) {
      console.error('Error calling generateText:', apiError);
      console.error('Error details:', {
        message: apiError?.message,
        status: apiError?.status,
        statusCode: apiError?.statusCode,
        stack: apiError?.stack?.substring(0, 500)
      });
      
      // טיפול בשגיאות ספציפיות
      if (apiError?.message?.includes('apiKey') || apiError?.message?.includes('authentication') || apiError?.message?.includes('auth')) {
        return NextResponse.json(
          { 
            error: 'API key not configured',
            details: process.env.NODE_ENV === 'development' ? String(apiError) : 'Please configure ANTHROPIC_API_KEY'
          },
          { status: 500 }
        );
      }
      
      if (apiError?.status === 429 || apiError?.statusCode === 429 || apiError?.message?.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      const errorDetails = process.env.NODE_ENV === 'development' 
        ? {
            message: apiError?.message || 'Unknown error',
            status: apiError?.status || apiError?.statusCode,
            type: apiError?.constructor?.name
          }
        : 'An error occurred while generating suggestions';
      
      return NextResponse.json(
        { 
          error: 'Failed to generate suggestions',
          details: errorDetails
        },
        { status: 500 }
      );
    }

    // ניסיון לפרש את התשובה כ-JSON
    let suggestionsData: {
      suggestions: Array<{
        text: string;
        explanation?: string;
        tone?: string;
        whenToUse?: string;
      }>;
    };

    try {
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      suggestionsData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.warn('Failed to parse suggestions as JSON:', parseError);
      console.warn('Response was:', response.substring(0, 200));
      // אם לא הצלחנו לפרש, נחזיר רשימה ריקה
      suggestionsData = { suggestions: [] };
    }

    return NextResponse.json({
      success: true,
      selectedText,
      suggestions: suggestionsData.suggestions || [],
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to get suggestions',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

