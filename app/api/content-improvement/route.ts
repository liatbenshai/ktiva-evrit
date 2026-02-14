import { NextRequest, NextResponse } from 'next/server';
import { generateText, HEBREW_SYSTEM_PROMPT_BASE } from '@/lib/ai/claude';
import { analyzeHebrewText } from '@/lib/ai/hebrew-analyzer';
import { getAntiPatternInstruction } from '@/prompts/hebrew-anti-patterns';

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
    'משפטים': 'שפה משפטית גבוהה. ביטויים: "לעניין זה יפים דבריו של בית המשפט", "למצער", "לדידי", "נוכח האמור לעיל", "בכפוף לאמור", "מבלי לגרוע מהאמור", "מהווה", "בהתאם ל", "על מנת", "הואיל ו", "לפיכך", "אשר על כן".',
    'רשמי': 'שפה רשמית מנומסת. ביטויים: "הנדון", "לכבוד", "בהמשך לפנייתך", "אבקש להבהיר", "בברכה", "בכבוד רב".',
    'רפואה': 'טרמינולוגיה רפואית מקצועית, סגנון קליני.',
    'חינוך': 'שפה ברורה ונגישה לגיל היעד.',
    'טכנולוגיה': 'טרמינולוגיה טכנית מדויקת.',
    'שיווק': 'שפה משכנעת ומעוררת עניין.',
    'עסקים': 'שפה עסקית מקצועית.',
    'אקדמיה': 'שפה אקדמית פורמלית.',
    'עיתונות': 'שפה ברורה וחדה.',
    'תקשורת': 'שפה ברורה ונגישה.',
    'יומיומי': 'שפה יומיומית פשוטה וזורמת. "כדי", "לפי", "הוא/זה", "אפשר", "רוצה".',
  };
  return guidance[profession] || 'התאם את רמת השפה להקשר.';
}

/**
 * הנחיות שיפור לפי מטרה
 */
function getGoalGuidance(goal: string): string {
  const lowerGoal = goal.toLowerCase();
  if (lowerGoal.includes('משפטי') || lowerGoal.includes('חוזה') || lowerGoal.includes('עורך דין') || lowerGoal.includes('בית משפט') || lowerGoal.includes('כתב טענות')) {
    return 'שפה משפטית גבוהה. ביטויים: "לעניין זה יפים דבריו של בית המשפט", "למצער", "לדידי", "נוכח האמור לעיל", "בכפוף לאמור", "מהווה", "בהתאם ל", "על מנת", "הואיל ו", "לפיכך", "אשר על כן".';
  }
  if (lowerGoal.includes('רשמי') || lowerGoal.includes('מכתב רשמי') || lowerGoal.includes('פנייה')) {
    return 'שפה רשמית מנומסת. ביטויים: "הנדון", "לכבוד", "בהמשך לפנייתך", "בברכה", "בכבוד רב".';
  }
  if (lowerGoal.includes('יומיומי') || lowerGoal.includes('פשוט') || lowerGoal.includes('קליל') || lowerGoal.includes('חבר')) {
    return 'שפה יומיומית פשוטה וזורמת. "כדי", "לפי", "הוא/זה", "אפשר".';
  }
  if (lowerGoal.includes('שכנוע') || lowerGoal.includes('מכירה')) {
    return 'שפה משכנעת, הדגשת יתרונות.';
  }
  if (lowerGoal.includes('הסבר') || lowerGoal.includes('הדרכה')) {
    return 'שפה ברורה ופשוטה.';
  }
  if (lowerGoal.includes('שיווק') || lowerGoal.includes('פרסום')) {
    return 'שפה מעוררת עניין.';
  }
  return 'התאם את רמת השפה להקשר.';
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

    const systemPrompt = `אתה עורך טקסטים מקצועי. התאם את רמת השפה להקשר.

**רמות שפה:**

**🔷 שפה משפטית גבוהה** (עורכי דין, מסמכים משפטיים, כתבי טענות):
שפה משפטית פורמלית ברמה הגבוהה ביותר.
ביטויים: "לעניין זה יפים דבריו של בית המשפט", "למצער", "לדידי", "נוכח האמור לעיל", "בכפוף לאמור", "מבלי לגרוע מהאמור", "מהווה", "בהתאם ל", "על מנת", "הואיל ו", "לפיכך".

**🔷 שפה רשמית** (מכתבים רשמיים, פניות לרשויות, מסמכים עסקיים):
שפה מנומסת ומכובדת: "הנדון", "לכבוד", "בהמשך לפנייתך", "בברכה".

**🔷 שפה יומיומית** (הודעות, מיילים רגילים, צ'אט):
שפה פשוטה וזורמת: "כדי", "לפי", "הוא/זה", "אפשר".

**🔷 שפה מקצועית** (רפואה, אקדמיה, טכנולוגיה):
טרמינולוגיה מקצועית של התחום.

**הוראות:**
1. זהה את ההקשר מהמקצוע שצוין
2. תקן את הטקסט - אל תנתח אותו
3. שמור על המשמעות המקורית

${getAntiPatternInstruction(false)}`;

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

    const prompt = `תקן את הטקסט הבא לעברית תקנית וטבעית.

**הקשר:** ${contextInfo}
${goal ? `**מטרה:** ${goal}` : ''}
${hebrewAnalysis}

**טקסט לתיקון:**
${text}

**הוראות:**
1. כתוב את הטקסט המתוקן בשדה "improvedText"
2. כתוב עברית טבעית - כמו שישראלי יליד היה כותב
3. הסר ביטויים ארכאיים ופורמליים מוגזמים
4. שמור על המשמעות המקורית

**דוגמאות לתיקון לפי סגנון:**

**משפטי:** "מתכבדים בזאת" → "מוגש/ת בזאת", "באמצעות בא כוחם" → "על ידי עורך דינם"
**שיווקי:** "פתרון כולל" → "מענה מלא", "חוויית משתמש" → "חווית שימוש", "לתת ערך" → "להועיל"
**אקדמי:** "מחקרים מראים כי" → "מחקרים מצאו ש", "ניתן להניח כי" → "סביר להניח ש"
**ידידותי:** "אני מבקש" → "אני רוצה", "בהמשך לפנייתך" → "אחרי שפנית"
**כללי:** "בהתאם ל" → "לפי", "על מנת" → "כדי", "מהווה" → "הוא/זה", "באופן משמעותי" → "מאוד"

**פורמט JSON:**
{
  "improvedText": "הטקסט המתוקן המלא",
  "changes": [{"type": "style|grammar|terminology|clarity", "description": "תיאור", "original": "מקור", "improved": "תיקון"}],
  "explanation": "הסבר קצר",
  "additionalRecommendations": ["המלצה"],
  "overallScore": 85
}

החזר JSON בלבד, ללא markdown.`;

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
      const alternativesPrompt = `צור 3 גרסאות שונות של הטקסט הבא בעברית טבעית.

**טקסט מקורי:**
${text}

**הקשר:** ${contextInfo}

**צור:**
1. גרסה מינימלית - תיקון שגיאות בלבד
2. גרסה בינונית - עברית משופרת
3. גרסה מקסימלית - עברית טבעית לחלוטין, ללא ביטויים ארכאיים

**דוגמה לגרסה מקסימלית (למשפטים):**
במקום: "מתכבדים בזאת המתנגדים, באמצעות בא כוחם, להגיש התנגדותם לבקשה לקיום צוואתו של אביהם, המנוח מר שמואל ז"ל, אשר הלך לבית עולמו ביום..."
כתוב: "מוגשת בזאת התנגדות לבקשה לקיום צוואת המנוח שמואל ז"ל (להלן - המנוח), שנפטר ביום..."

**פורמט JSON:**
{
  "alternatives": [
    {"text": "גרסה מינימלית", "explanation": "תיקון שגיאות בלבד", "context": "מינימלי"},
    {"text": "גרסה בינונית", "explanation": "עברית משופרת", "context": "בינוני-מתקדם"},
    {"text": "גרסה מקסימלית", "explanation": "עברית טבעית", "context": "מקסימלי"}
  ]
}

החזר JSON בלבד.`;

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

