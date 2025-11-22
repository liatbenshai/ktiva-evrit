import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * הנחיות שיפור לפי מקצוע
 */
function getProfessionGuidance(profession: string): string {
  const guidance: Record<string, string> = {
    'משפטים': 'השתמש בטרמינולוגיה משפטית מדויקת, סגנון פורמלי ומקצועי, מבנה לוגי ברור, והתייחסות לסעיפים וחוקים.',
    'רפואה': 'השתמש בטרמינולוגיה רפואית מדויקת, סגנון מקצועי וקליני, בהירות מקסימלית, והתייחסות לפרוצדורות ואבחונים.',
    'חינוך': 'השתמש בשפה ברורה ונגישה, סגנון מעודד ומסביר, מבנה הוראה לוגי, והתאמה לגיל היעד.',
    'טכנולוגיה': 'השתמש בטרמינולוגיה טכנית מדויקת, סגנון מקצועי וחד, הסברים ברורים, והתייחסות למושגים טכניים.',
    'שיווק': 'השתמש בשפה משכנעת ומעוררת עניין, סגנון דינמי, קריאות גבוהה, והדגשת יתרונות ותועלות.',
    'עסקים': 'השתמש בשפה עסקית מקצועית, סגנון פורמלי אך נגיש, מבנה לוגי, והתייחסות לנתונים ותוצאות.',
    'אקדמיה': 'השתמש בשפה אקדמית מדויקת, סגנון פורמלי ומחקרי, מבנה לוגי, והתייחסות למקורות וציטוטים.',
    'עיתונות': 'השתמש בשפה ברורה וחדה, סגנון עיתונאי, מבנה פירמידה הפוכה, והתייחסות לעובדות וציטוטים.',
    'תקשורת': 'השתמש בשפה ברורה ונגישה, סגנון מקצועי אך ידידותי, מבנה לוגי, והתאמה לקהל היעד.',
  };
  return guidance[profession] || 'השתמש בשפה מקצועית, ברורה ומתאימה למקצוע.';
}

/**
 * הנחיות שיפור לפי מטרה
 */
function getGoalGuidance(goal: string): string {
  const lowerGoal = goal.toLowerCase();
  if (lowerGoal.includes('שכנוע') || lowerGoal.includes('מכירה')) {
    return 'השתמש בשפה משכנעת, הדגש יתרונות, צור תחושת דחיפות, והשתמש בקריאות לפעולה ברורות.';
  }
  if (lowerGoal.includes('הסבר') || lowerGoal.includes('הדרכה')) {
    return 'השתמש בשפה ברורה ופשוטה, הסבר שלב אחר שלב, השתמש בדוגמאות, ובדוק שההסבר מובן.';
  }
  if (lowerGoal.includes('שיווק') || lowerGoal.includes('פרסום')) {
    return 'השתמש בשפה מעוררת עניין, הדגש יתרונות, צור עניין, והשתמש בשפה דינמית.';
  }
  if (lowerGoal.includes('רשמי') || lowerGoal.includes('מקצועי')) {
    return 'השתמש בשפה פורמלית ומקצועית, מבנה לוגי, וסגנון מקצועי.';
  }
  return 'התאם את הסגנון והטון למטרה שצוינה.';
}

/**
 * חיפוש מידע רלוונטי ברשת לפי מקצוע/מטרה
 */
async function searchRelevantInfo(profession?: string, goal?: string, text?: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  // בנה שאילתות חיפוש לפי המקצוע/מטרה
  const searchQueries: string[] = [];
  
  if (profession && profession !== 'כללי') {
    searchQueries.push(
      `${profession} כתיבה מקצועית`,
      `${profession} סגנון כתיבה`,
      `${profession} טרמינולוגיה`
    );
  }
  
  if (goal) {
    searchQueries.push(
      `${goal} כתיבה`,
      `${goal} סגנון`
    );
  }
  
  // אם יש טקסט, נסה למצוא מידע על הנושא
  if (text && text.length > 20) {
    // חלץ מילות מפתח מהטקסט (פשוט - המילים הראשונות)
    const words = text.split(/\s+/).slice(0, 5).join(' ');
    if (words) {
      searchQueries.push(`${words} כתיבה מקצועית`);
    }
  }
  
  // בצע חיפוש לכל שאילתה (מוגבל ל-2 שאילתות כדי לא לעשות יותר מדי קריאות)
  for (const query of searchQueries.slice(0, 2)) {
    try {
      const searchResults = await performWebSearch(query, 3);
      results.push(...searchResults);
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }
  
  // הסר כפילויות לפי URL
  const uniqueResults = Array.from(
    new Map(results.map(r => [r.url, r])).values()
  );
  
  return uniqueResults.slice(0, 5); // הגבל ל-5 תוצאות
}

/**
 * ביצוע חיפוש ברשת באמצעות Tavily API או Google Custom Search API
 */
async function performWebSearch(query: string, maxResults: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // נסה Tavily API תחילה
  if (process.env.TAVILY_API_KEY) {
    try {
      console.log(`🔍 Searching with Tavily API: ${query}`);
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          search_depth: 'basic',
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false,
        }),
      });

      if (tavilyResponse.ok) {
        const data = await tavilyResponse.json();
        if (data.results && Array.isArray(data.results)) {
          return data.results.map((result: any) => ({
            title: result.title || 'ללא כותרת',
            snippet: result.content || result.snippet || '',
            url: result.url || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error with Tavily API:', error);
    }
  }

  // Fallback: נסה Google Custom Search API
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
    try {
      console.log(`🔍 Searching with Google Custom Search: ${query}`);
      const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${maxResults}`;
      
      const googleResponse = await fetch(googleUrl);
      if (googleResponse.ok) {
        const data = await googleResponse.json();
        if (data.items && Array.isArray(data.items)) {
          return data.items.map((item: any) => ({
            title: item.title || 'ללא כותרת',
            snippet: item.snippet || '',
            url: item.link || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error with Google Custom Search:', error);
    }
  }

  return results;
}

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

    // אם המקצוע הוא "כללי" ואין מטרה, נשתמש ב"כללי" כמקצוע
    const effectiveProfession = profession === 'כללי' && !goal ? 'כללי' : (profession && profession !== 'כללי' ? profession : undefined);
    
    if (!effectiveProfession && !goal) {
      return NextResponse.json(
        { error: 'נא לבחור מקצוע או להזין מטרה' },
        { status: 400 }
      );
    }

    const systemPrompt = `אתה מומחה לשיפור תוכן בעברית תקנית. תפקידך לשפר טקסטים בהתאם למקצוע או מטרה ספציפית.

**חשוב מאוד - זה לא ניתוח, זה שיפור בפועל:**
1. אתה חייב להחזיר טקסט משופר בפועל בשדה "improvedText" - לא רק תובנות או ניתוח
2. הטקסט המשופר חייב להיות טקסט מלא, מוכן לשימוש, עם כל השיפורים שביצעת
3. שפר את הטקסט המקורי - שנה מילים, שפר משפטים, התאם סגנון, תיקון דקדוק
4. שמור על המסר המקורי אבל שפר את הביטוי, הסגנון והבהירות
5. השתמש בעברית תקנית וטבעית
6. התאם את הסגנון והטון למקצוע או המטרה שצוינה
7. הסבר את השינויים שביצעת ברשימת changes
8. שמור על אורך דומה לטקסט המקורי (אלא אם נדרש שינוי)

**דוגמה:**
אם הטקסט המקורי הוא: "אני רוצה לעשות החלטה"
הטקסט המשופר צריך להיות: "אני רוצה לקבל החלטה" או "אני מעוניין לקבל החלטה"
לא רק: "יש לשנות 'לעשות החלטה' ל'לקבל החלטה'"`;

    const contextInfo = effectiveProfession 
      ? `מקצוע: ${effectiveProfession}`
      : `מטרה: ${goal}`;

    const professionGuidance = effectiveProfession && effectiveProfession !== 'כללי' ? getProfessionGuidance(effectiveProfession) : '';
    const goalGuidance = goal ? getGoalGuidance(goal) : '';

    // חיפוש מידע רלוונטי ברשת
    let relevantInfo: SearchResult[] = [];
    let relevantInfoText = '';
    
    try {
      console.log(`🔍 Searching for relevant information for: ${contextInfo}`);
      relevantInfo = await searchRelevantInfo(effectiveProfession, goal, text);
      
      if (relevantInfo.length > 0) {
        relevantInfoText = `\n\n**מידע רלוונטי שנמצא ברשת (לשימוש כהנחיה בלבד):**\n${relevantInfo.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet.substring(0, 200)}...`).join('\n')}`;
        console.log(`✅ Found ${relevantInfo.length} relevant sources`);
      } else {
        console.log('⚠️ No relevant sources found, continuing without external info');
      }
    } catch (error) {
      console.warn('Error searching for relevant info (non-critical):', error);
      // ממשיכים גם אם החיפוש נכשל
    }

    const prompt = `**משימה: שפר את הטקסט הבא בפועל - לא רק ניתוח, אלא טקסט משופר מוכן לשימוש**

הקשר: ${contextInfo}
${professionGuidance ? `\n${professionGuidance}` : ''}
${goalGuidance ? `\n${goalGuidance}` : ''}${relevantInfoText}

**הטקסט המקורי לשיפור:**
${text}

**הוראות שיפור:**
1. כתוב את הטקסט המשופר המלא בשדה "improvedText" - זה חייב להיות טקסט מוכן לשימוש, לא רק תובנות
2. שפר בפועל: שנה מילים, שפר משפטים, תיקון דקדוק, התאם סגנון
3. התאם את הסגנון והטון ל-${contextInfo}
4. שפר את הבהירות והדיוק
5. השתמש בעברית תקנית וטבעית
6. שמור על המסר המקורי אבל שפר את הביטוי
7. רשום את כל השינויים שביצעת ברשימת changes עם דוגמאות לפני/אחרי

**פורמט JSON (חובה):**
{
  "improvedText": "הטקסט המשופר המלא כאן - זה חייב להיות טקסט מוכן לשימוש, לא רק תובנות",
  "changes": [
    {
      "type": "style" | "tone" | "clarity" | "grammar" | "terminology" | "other",
      "description": "תיאור השינוי",
      "original": "הטקסט המקורי ששונה",
      "improved": "הטקסט המשופר"
    }
  ],
  "explanation": "הסבר כללי על השיפורים שבוצעו",
  "additionalRecommendations": ["המלצה 1", "המלצה 2"],
  "overallScore": number (0-100)
}

**חשוב מאוד:** 
- השדה "improvedText" חייב להכיל את הטקסט המשופר המלא, מוכן לשימוש
- החזר רק את אובייקט ה-JSON בלבד, ללא markdown, ללא backticks, ללא טקסט הסבר
- התשובה שלך צריכה להתחיל ב-{ ולהסתיים ב-}`;

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
      sources: relevantInfo.length > 0 ? relevantInfo.map(r => ({
        title: r.title,
        url: r.url,
      })) : undefined,
    });
  } catch (error: any) {
    console.error('Error improving content:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בשיפור התוכן' },
      { status: 500 }
    );
  }
}

