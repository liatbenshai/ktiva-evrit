import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { analyzeHebrewText } from '@/lib/ai/hebrew-analyzer';

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
 * כולל חיפוש דוגמאות של כתיבה בעברית תקנית
 */
async function searchRelevantInfo(profession?: string, goal?: string, text?: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  // בנה שאילתות חיפוש לפי המקצוע/מטרה
  const searchQueries: string[] = [];
  
  // חיפוש דוגמאות של כתיבה בעברית תקנית - חשוב מאוד!
  searchQueries.push(
    'עברית תקנית כתיבה מקצועית',
    'דוגמאות כתיבה בעברית תקנית',
    'עברית טבעית לא תרגום',
    'כתיבה בעברית ילידית'
  );
  
  if (profession && profession !== 'כללי') {
    searchQueries.push(
      `${profession} כתיבה מקצועית בעברית תקנית`,
      `${profession} סגנון כתיבה עברית`,
      `${profession} טרמינולוגיה עברית`,
      `דוגמאות ${profession} בעברית`
    );
  }
  
  if (goal) {
    searchQueries.push(
      `${goal} כתיבה בעברית תקנית`,
      `${goal} סגנון עברית`,
      `דוגמאות ${goal} בעברית`
    );
  }
  
  // אם יש טקסט, נסה למצוא מידע על הנושא
  if (text && text.length > 20) {
    // חלץ מילות מפתח מהטקסט
    const words = text.split(/\s+/).slice(0, 5).join(' ');
    if (words) {
      searchQueries.push(
        `${words} כתיבה מקצועית בעברית`,
        `דוגמאות ${words} בעברית תקנית`
      );
    }
  }
  
  // בצע חיפוש לכל שאילתה (מוגבל ל-4 שאילתות כדי לא לעשות יותר מדי קריאות)
  for (const query of searchQueries.slice(0, 4)) {
    try {
      const searchResults = await performWebSearch(query, 5);
      results.push(...searchResults);
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }
  
  // הסר כפילויות לפי URL
  const uniqueResults = Array.from(
    new Map(results.map(r => [r.url, r])).values()
  );
  
  return uniqueResults.slice(0, 8); // הגבל ל-8 תוצאות (יותר דוגמאות)
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

    const systemPrompt = `אתה מומחה לשיפור תוכן בעברית תקנית וטבעית. אתה דובר עברית יליד עם גישה לכל מקורות המידע - גוגל, מאגרי מידע, וטקסטים בעברית תקנית. תפקידך לשפר טקסטים כך שיהיו בעברית אמיתית, לא תרגום מילולי מאנגלית.

**חשוב מאוד - זה לא ניתוח, זה שיפור בפועל:**
1. אתה חייב להחזיר טקסט משופר בפועל בשדה "improvedText" - לא רק תובנות או ניתוח
2. הטקסט המשופר חייב להיות טקסט מלא, מוכן לשימוש, עם כל השיפורים שביצעת
3. **הכי חשוב: כתוב בעברית טבעית, לא תרגום מילולי מאנגלית!**
4. שפר את הטקסט המקורי - שנה מילים, שפר משפטים, התאם סגנון, תיקון דקדוק
5. שמור על המסר המקורי אבל שפר את הביטוי, הסגנון והבהירות
6. השתמש בעברית תקנית וטבעית - כאילו כתב דובר עברית יליד
7. התאם את הסגנון והטון למקצוע או המטרה שצוינה
8. הסבר את השינויים שביצעת ברשימת changes
9. שמור על אורך דומה לטקסט המקורי (אלא אם נדרש שינוי)

**דוגמאות לתרגומים מילוליים שצריך להימנע מהם:**
❌ "לעשות החלטה" → ✅ "לקבל החלטה" / "להחליט"
❌ "להביא בחשבון" → ✅ "לקחת בחשבון"
❌ "מהווה" → ✅ "הוא/היא/זה"
❌ "במטרה" / "על מנת" → ✅ "כדי"
❌ "בהתאם ל" → ✅ "לפי"
❌ "באופן" → ✅ "כך" / "ככה" / "בצורה"
❌ "בסוף היום" → ✅ "בסופו של דבר"
❌ "לתת ערך" → ✅ "להועיל" / "להעניק"
❌ "לקחת לשלב הבא" → ✅ "להתקדם"
❌ "אני רוצה להודות" → ✅ "תודה"
❌ "אני רוצה לומר" → ✅ "אני אומר"
❌ "אני רוצה להוסיף" → ✅ "אני מוסיף"
❌ "אם זה אפשרי" → ✅ "אם אפשר"
❌ "זה חשוב מאוד מאוד" → ✅ "זה חשוב מאוד"
❌ "בנוסף לכך, אני רוצה להוסיף" → ✅ "בנוסף"
❌ "ביחס ל" → ✅ "לגבי"
❌ "אקטואלי" → ✅ "נוכחי" / "עדכני"
❌ "פוטנציאלי" → ✅ "אפשרי" / "עתידי"
❌ "קריטי" → ✅ "חיוני" / "חשוב"
❌ "אפקטיבי" → ✅ "יעיל"
❌ "פרקטי" → ✅ "מעשי"

**עקרונות כתיבה בעברית טבעית:**
- הימנע מתרגום מילה-במילה מאנגלית
- חפש את המשמעות מאחורי המילים והביטויים
- השתמש בביטויים עבריים טבעיים
- הימנע מביטויי AI נפוצים
- כתוב כאילו אתה דובר עברית יליד, לא מתרגם
- השתמש בדוגמאות מהרשת כהנחיה לסגנון כתיבה בעברית תקנית
- אם מצאת דוגמאות בעברית תקנית בחיפוש - השתמש באותו סגנון!

**אתה מחובר לכל מקורות המידע - גוגל, מאגרי מידע, וטקסטים בעברית תקנית.**
**השתמש בידע הזה כדי לכתוב בעברית תקנית וטבעית, כמו שכותבים בעברית אמיתית!**`;

    const contextInfo = effectiveProfession 
      ? `מקצוע: ${effectiveProfession}`
      : `מטרה: ${goal}`;

    const professionGuidance = effectiveProfession && effectiveProfession !== 'כללי' ? getProfessionGuidance(effectiveProfession) : '';
    const goalGuidance = goal ? getGoalGuidance(goal) : '';

    // ניתוח הטקסט לזיהוי תרגומים מילוליים
    let hebrewAnalysis = '';
    try {
      const analysis = analyzeHebrewText(text);
      if (analysis.issues.length > 0) {
        const issuesList = analysis.issues
          .slice(0, 10) // הגבל ל-10 בעיות
          .map((issue, idx) => `${idx + 1}. "${issue.original}" → "${issue.suggestion}" (${issue.explanation})`)
          .join('\n');
        hebrewAnalysis = `\n\n**בעיות בעברית שזוהו בטקסט המקורי (חשוב לתקן!):**\n${issuesList}`;
        console.log(`🔍 Found ${analysis.issues.length} Hebrew issues in text`);
      }
    } catch (error) {
      console.warn('Error analyzing Hebrew text (non-critical):', error);
    }

    // חיפוש מידע רלוונטי ברשת
    let relevantInfo: SearchResult[] = [];
    let relevantInfoText = '';
    
    try {
      console.log(`🔍 Searching for relevant information for: ${contextInfo}`);
      relevantInfo = await searchRelevantInfo(effectiveProfession, goal, text);
      
      if (relevantInfo.length > 0) {
        // חלץ דוגמאות של כתיבה בעברית תקנית מהתוצאות
        const examples = relevantInfo
          .filter(r => r.snippet && r.snippet.length > 50)
          .map(r => r.snippet.substring(0, 300))
          .slice(0, 5);
        
        relevantInfoText = `\n\n**מידע רלוונטי שנמצא ברשת - דוגמאות של כתיבה בעברית תקנית:**
${relevantInfo.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet.substring(0, 250)}...`).join('\n')}

**דוגמאות של כתיבה בעברית תקנית מהרשת (השתמש בסגנון הזה!):**
${examples.map((ex, i) => `דוגמה ${i + 1}: "${ex}"`).join('\n')}

**חשוב:** השתמש בדוגמאות האלה כהנחיה לסגנון כתיבה בעברית תקנית וטבעית. כתוב באותו סגנון!`;
        console.log(`✅ Found ${relevantInfo.length} relevant sources with Hebrew examples`);
      } else {
        console.log('⚠️ No relevant sources found, continuing without external info');
      }
    } catch (error) {
      console.warn('Error searching for relevant info (non-critical):', error);
      // ממשיכים גם אם החיפוש נכשל
    }

    const prompt = `**משימה: שפר את הטקסט הבא בפועל - כתוב בעברית טבעית, לא תרגום מילולי מאנגלית!**

**אתה מחובר לכל מקורות המידע - גוגל, מאגרי מידע, וטקסטים בעברית תקנית.**
**השתמש בידע הזה כדי לכתוב בעברית תקנית וטבעית, כמו שכותבים בעברית אמיתית!**

הקשר: ${contextInfo}
${professionGuidance ? `\n${professionGuidance}` : ''}
${goalGuidance ? `\n${goalGuidance}` : ''}${hebrewAnalysis}${relevantInfoText}

**הטקסט המקורי לשיפור:**
${text}

**הוראות שיפור (חשוב מאוד!):**
1. **כתוב את הטקסט המשופר המלא בשדה "improvedText" - זה חייב להיות טקסט מוכן לשימוש, לא רק תובנות**
2. **הכי חשוב: כתוב בעברית טבעית, כאילו כתב דובר עברית יליד - לא תרגום מילולי מאנגלית!**
3. **זהה ותקן תרגומים מילוליים (חובה!):**
   - "לעשות החלטה" → "לקבל החלטה" / "להחליט"
   - "מהווה" → "הוא/היא/זה"
   - "במטרה" / "על מנת" → "כדי"
   - "באופן" → "כך" / "בצורה" / "ככה"
   - "בהתאם ל" → "לפי"
   - "אני רוצה לומר" → "אני אומר"
   - "אני רוצה להוסיף" → "אני מוסיף"
   - "אם זה אפשרי" → "אם אפשר"
   - "בסוף היום" → "בסופו של דבר"
   - "לתת ערך" → "להועיל" / "להעניק"
   - "להביא בחשבון" → "לקחת בחשבון"
   - הימנע מאנגליציזמים: "אקטואלי"→"נוכחי", "פוטנציאלי"→"אפשרי", "קריטי"→"חיוני", "אפקטיבי"→"יעיל", "פרקטי"→"מעשי"
   - הימנע מביטויי AI: "אני רוצה להודות"→"תודה", "בנוסף לכך, אני רוצה להוסיף"→"בנוסף"
4. **כתוב משפטים בעברית טבעית:**
   - במקום: "זה מהווה בעיה" → כתוב: "זו בעיה" / "זה בעייתי"
   - במקום: "אני רוצה לעשות החלטה" → כתוב: "אני רוצה להחליט" / "אני מעוניין לקבל החלטה"
   - במקום: "בהתאם לבקשתך" → כתוב: "כפי שביקשת"
   - במקום: "באופן משמעותי" → כתוב: "משמעותית" / "בצורה משמעותית"
5. שפר בפועל: שנה מילים, שפר משפטים, תיקון דקדוק, התאם סגנון
6. התאם את הסגנון והטון ל-${contextInfo}
7. שפר את הבהירות והדיוק
8. השתמש בעברית תקנית וטבעית - כאילו כתב דובר עברית יליד
9. שמור על המסר המקורי אבל שפר את הביטוי
10. רשום את כל השינויים שביצעת ברשימת changes עם דוגמאות לפני/אחרי
11. **ודא שהטקסט המשופר נשמע כמו עברית אמיתית, לא תרגום!**

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

    // יצירת גרסאות חלופיות
    let alternatives: Array<{ text: string; explanation?: string; context?: string }> = [];
    try {
      const alternativesPrompt = `אתה מומחה בעברית תקנית וטבעית. המשימה: ליצור 3 גרסאות חלופיות שונות של הטקסט המשופר הבא - כל גרסה חייבת להיות שונה לחלוטין מהאחרות.

<טקסט_מקורי>
${text}
</טקסט_מקורי>

<טקסט_משופר_ראשי>
${improvement.improvedText}
</טקסט_משופר_ראשי>

הקשר: ${contextInfo}
${professionGuidance ? `\n${professionGuidance}` : ''}
${goalGuidance ? `\n${goalGuidance}` : ''}

**חשוב מאוד:** כל גרסה חייבת להיות שונה לחלוטין מהאחרות! אל תחזיר אותו טקסט 3 פעמים.

צור:
1. **alternative1** - תיקון מינימלי בלבד - רק את הבעיות הקריטיות ביותר, שינוי מינימלי מהטקסט המקורי
2. **alternative2** - תיקון בינוני-מתקדם - שיפור נרחב יותר, החלפת ביטויים AI בניסוחים עבריים טבעיים
3. **alternative3** - תיקון מקסימלי - שיפור מלא, כתיבה עברית טבעית לחלוטין, החלפת כל ביטוי AI אפשרי

**דרישות:**
- כל גרסה חייבת להיות שונה מהאחרות
- alternative1: מינימלי - רק תיקונים קריטיים
- alternative2: בינוני - שיפורים נרחבים יותר
- alternative3: מקסימלי - שיפור מלא
- שמור על המשמעות המקורית בכל הגרסאות

**חשוב מאוד:** החזר רק JSON תקין בלבד, ללא markdown, ללא הסברים נוספים, ללא backticks.

פורמט JSON:
{
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

      const alternativesSystemPrompt = `אתה מומחה בעברית תקנית וטבעית. אתה מספק גרסאות משופרות של טקסטים. **חשוב מאוד:** כל גרסה חייבת להיות שונה לחלוטין מהאחרות - לא לחזור על אותו טקסט. החזר תמיד JSON תקין בלבד, ללא markdown, ללא backticks, ללא טקסט נוסף.`;

      const alternativesResponse = await generateText({
        prompt: alternativesPrompt,
        systemPrompt: alternativesSystemPrompt,
        maxTokens: 4096,
        temperature: 0.5,
      });

      let cleanedAlternatives = alternativesResponse.trim();
      if (cleanedAlternatives.includes('```json')) {
        const start = cleanedAlternatives.indexOf('```json') + 7;
        const end = cleanedAlternatives.lastIndexOf('```');
        if (end > start) {
          cleanedAlternatives = cleanedAlternatives.substring(start, end).trim();
        }
      } else if (cleanedAlternatives.startsWith('```')) {
        const start = cleanedAlternatives.indexOf('\n') + 1;
        const end = cleanedAlternatives.lastIndexOf('```');
        if (end > start) {
          cleanedAlternatives = cleanedAlternatives.substring(start, end).trim();
        }
      }
      const jsonStart = cleanedAlternatives.indexOf('{');
      const jsonEnd = cleanedAlternatives.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedAlternatives = cleanedAlternatives.substring(jsonStart, jsonEnd + 1);
      }
      
      const alternativesData = JSON.parse(cleanedAlternatives);
      alternatives = alternativesData.alternatives || [];
    } catch (altError) {
      console.warn('Failed to generate alternatives (non-critical):', altError);
      // ממשיכים בלי alternatives - לא קריטי
    }

    return NextResponse.json({
      success: true,
      improvement,
      alternatives,
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

