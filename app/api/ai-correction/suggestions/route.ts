import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { prisma } from '@/lib/prisma';
import { learningSystem } from '@/lib/learning-system';
import { getSynonyms } from '@/lib/synonyms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      selectedText,
      fullText,
      context,
      userId = 'default-user',
    } = body;

    if (!selectedText || !fullText) {
      return NextResponse.json(
        { error: 'selectedText and fullText are required' },
        { status: 400 }
      );
    }

    // טעינת דפוסי AI להימנעות מהמאגר
    let forbiddenPatterns: Array<{ badPattern: string; goodPattern: string }> = [];
    try {
      const patterns = await prisma.translationPattern.findMany({
        where: { 
          userId,
          patternType: 'ai-style', // דפוסים ספציפיים ל-AI
        },
        orderBy: { confidence: 'desc' },
        take: 20,
      });
      forbiddenPatterns = patterns.map(p => ({
        badPattern: p.badPattern,
        goodPattern: p.goodPattern,
      }));
    } catch (dbError: any) {
      console.error('Error loading forbidden patterns:', dbError);
      // המשך בלי דפוסים - לא קריטי
      forbiddenPatterns = [];
    }

    // טעינת העדפות המשתמש מהמערכת
    let userPreferences: {
      forbiddenWords?: string[];
      preferredWords?: { [key: string]: string };
    } = {};

    try {
      // נסה לטעון העדפות רק אם learningSystem קיים וזמין
      if (learningSystem && typeof learningSystem.getWritingSuggestions === 'function') {
        try {
          const writingSuggestions = await Promise.resolve(
            learningSystem.getWritingSuggestions(userId, 'general')
          );

          if (writingSuggestions && writingSuggestions.commonMistakes && Array.isArray(writingSuggestions.commonMistakes)) {
            userPreferences.forbiddenWords = writingSuggestions.commonMistakes
              .filter((m: any) => m && m.frequency >= 2)
              .map((m: any) => m.mistake);
          }
        } catch (learnError: any) {
          console.warn('Error loading learning system suggestions:', learnError);
          // המשך בלי העדפות - לא קריטי
        }
      }
    } catch (error: any) {
      console.warn('Error loading user preferences:', error);
      // המשך בלי העדפות - לא קריטי
    }

    // טעינת מילים נרדפות מהמאגר
    let synonymsDict = '';
    let wordAlternatives: { [key: string]: string[] } = {};
    try {
      const synonyms = await prisma.synonym.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100, // נטען עד 100 קבוצות מילים נרדפות
      });

      const parsedSynonyms = synonyms.map(syn => ({
        primary: syn.primary,
        alternatives: JSON.parse(syn.alternatives),
        context: syn.context ? JSON.parse(syn.context) : []
      }));

      // יצירת מילון מילים נרדפות
      synonymsDict = parsedSynonyms.map(s => 
        `"${s.primary}" (מועדף) ← [${s.alternatives.join(', ')}]`
      ).join('\n');

      // יצירת wordAlternatives - מילים מהטקסט עם חלופות
      const words = selectedText.split(/\s+/).filter(w => w.length > 2);
      words.forEach(word => {
        const cleanWord = word.replace(/[.,!?;:]/g, '');
        const synonyms = getSynonyms(cleanWord);
        if (synonyms.length > 0) {
          wordAlternatives[cleanWord] = synonyms.slice(0, 5); // עד 5 חלופות
        }
      });
    } catch (synError: any) {
      console.error('Error loading synonyms:', synError);
      // המשך בלי מילים נרדפות - לא קריטי
    }

    // בניית prompt להצעות חלופיות
    const forbiddenSection = forbiddenPatterns.length > 0 ? `
**ניסוחי AI להימנעות (למדתי מהתיקונים שלך):**
${forbiddenPatterns.map(p => {
  return `- ❌ "${p.badPattern}" → ✅ "${p.goodPattern}"`;
}).join('\n')}` : '';

    const synonymsSection = synonymsDict ? `
**מילון מילים נרדפות (המילה המועדפת ראשונה, אחריה חלופות):**
${synonymsDict}

**חשוב:** אם הטקסט הנבחר מכיל מילים מהמילון, השתמש במילה המועדפת (הראשונה) במקום חלופות.` : '';

    const prompt = `אתה עוזר לשיפור טקסטים בעברית שנוצרו על ידי AI. אני מבקש הצעות חלופיות לניסוח של טקסט ספציפי.

**הטקסט המלא:**
${fullText}

**הטקסט הנבחר (שצריך הצעות חלופיות):**
"${selectedText}"

${forbiddenSection}

${synonymsSection}

${userPreferences.forbiddenWords && userPreferences.forbiddenWords.length > 0 ? `
**מילים להימנעות:**
${userPreferences.forbiddenWords.map(word => `- ❌ "${word}"`).join('\n')}` : ''}

${context ? `**הקשר:** ${context}` : ''}

**בקשה:**
צור 5-7 אפשרויות ניסוח חלופיות לטקסט הנבחר "${selectedText}" בעברית. כל אפשרות צריכה להיות:
- טבעית ונשמעת כמו עברית אמיתית (לא תרגום מ-AI)
- שונה מהאחרות (גישות שונות לניסוח)
- מתאימה להקשר של הטקסט המלא
- נמנעת מניסוחי AI מוכרים (כמו "מהווה", "בהתאם ל", "במטרה", וכו')
- עברית תקנית וזורמת

**פורמט הפלט - JSON בלבד:**
{
  "suggestions": [
    {
      "text": "אפשרות ניסוח 1",
      "explanation": "הסבר קצר למה אפשרות זו מתאימה",
      "tone": "רשמי / לא פורמלי / מקצועי / וכו",
      "whenToUse": "מתי להשתמש באפשרות זו"
    },
    {
      "text": "אפשרות ניסוח 2",
      "explanation": "הסבר קצר",
      "tone": "...",
      "whenToUse": "..."
    }
  ]
}

**חשוב מאוד:** החזר רק JSON תקין, ללא markdown, ללא הסברים נוספים.`;

    const systemPrompt = 'אתה מומחה בעברית תקנית וטבעית. אתה מספק הצעות חלופיות לניסוח בעברית שמשפרות טקסטים שנוצרו על ידי AI והופכות אותם לעברית טבעית. **חשוב מאוד:** החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.';

    // ביצוע הבקשה
    let response: string;
    try {
      console.log('Calling generateText for AI correction suggestions...');
      console.log('Selected text:', selectedText.substring(0, 50) + '...');
      
      response = await generateText({
        prompt,
        systemPrompt,
        maxTokens: 2048,
        temperature: 0.7,
      });
      
      console.log('Received response, length:', response?.length || 0);
    } catch (apiError: any) {
      console.error('Error calling generateText:', apiError);
      
      if (apiError?.message?.includes('apiKey') || apiError?.message?.includes('authentication')) {
        return NextResponse.json(
          { 
            error: 'API key not configured',
            details: process.env.NODE_ENV === 'development' ? String(apiError) : 'Please configure ANTHROPIC_API_KEY'
          },
          { status: 500 }
        );
      }
      
      if (apiError?.status === 429 || apiError?.statusCode === 429) {
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
      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response from AI');
      }

      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      suggestionsData = JSON.parse(cleanedResponse);
      
      // בדיקה שהנתונים תקינים
      if (!suggestionsData.suggestions || !Array.isArray(suggestionsData.suggestions)) {
        suggestionsData = { suggestions: [] };
      }
    } catch (parseError: any) {
      console.error('Failed to parse suggestions as JSON:', parseError);
      console.error('Response was:', response?.substring?.(0, 500) || 'No response');
      
      // נסה להחזיר רשימה ריקה במקום להיכשל
      suggestionsData = { suggestions: [] };
    }

    return NextResponse.json({
      success: true,
      selectedText,
      suggestions: suggestionsData.suggestions || [],
      wordAlternatives, // מילים נרדפות למילים בודדות בטקסט הנבחר
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

