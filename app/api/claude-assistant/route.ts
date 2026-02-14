import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import { applyLearnedPatterns } from '@/lib/ai/hebrew-analyzer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Fetch content from a URL
 */
async function fetchURLContent(url: string): Promise<string> {
  try {
    console.log(`🌐 Fetching content from URL: ${url}`);
    
    // Use a simple fetch - in production you might want to use a service like Puppeteer or Playwright
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Use cheerio for proper HTML parsing
    const $ = cheerio.load(html);
    // Remove non-content elements
    $('script, style, nav, header, footer, iframe, noscript').remove();
    // Extract main content (prefer article/main, fallback to body)
    const mainContent = $('article').text() || $('main').text() || $('body').text();
    const text = mainContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Limit to 10k characters
    
    return text || 'לא ניתן לקרוא תוכן מהדף';
  } catch (error) {
    console.error(`Error fetching URL ${url}:`, error);
    return `שגיאה בקבלת תוכן מה-URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Perform web search using Tavily API or Google Custom Search
 */
async function performWebSearch(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Try Tavily API first
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
          search_depth: 'advanced',
          max_results: maxResults,
          include_answer: false,
          include_raw_content: true,
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

  // Fallback: Try Google Custom Search API
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      history = [],
      userId = 'default-user',
      urls = [],
      needsWebSearch = false,
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'הודעה נדרשת' },
        { status: 400 }
      );
    }

    // קבלת דפוסים שנלמדו
    let learnedPatterns: Array<{
      badPattern: string;
      goodPattern: string;
      confidence: number;
    }> = [];

    try {
      const { prisma } = await import('@/lib/prisma');
      learnedPatterns = await prisma.translationPattern.findMany({
        where: { 
          userId,
          confidence: { gte: 0.7 },
        },
        orderBy: { confidence: 'desc' },
        take: 50,
      });
    } catch (dbError) {
      console.error('Error fetching learned patterns:', dbError);
    }

    // איסוף מידע נוסף
    let additionalContext = '';
    const sources: Array<{ title: string; url: string }> = [];

    // 1. טיפול ב-URLs
    if (urls && urls.length > 0) {
      console.log(`📎 Processing ${urls.length} URL(s)`);
      const urlContents = await Promise.all(
        urls.map(async (url: string) => {
          const content = await fetchURLContent(url);
          sources.push({ title: url, url });
          return `**תוכן מ-${url}:**\n${content}\n\n`;
        })
      );
      additionalContext += urlContents.join('\n');
    }

    // 2. חיפוש ברשת אם צריך
    if (needsWebSearch || (!urls || urls.length === 0)) {
      // בדיקה אם השאלה דורשת חיפוש ברשת
      const searchKeywords = ['מה', 'איך', 'למה', 'מתי', 'איפה', 'מי', '?'];
      const needsSearch = searchKeywords.some(keyword => message.includes(keyword)) || 
                         message.length > 50; // שאלות ארוכות יותר

      if (needsSearch) {
        console.log(`🔍 Performing web search for: ${message}`);
        const searchResults = await performWebSearch(message, 5);
        
        if (searchResults.length > 0) {
          additionalContext += '\n**מידע שנמצא ברשת:**\n';
          searchResults.forEach((result, idx) => {
            additionalContext += `${idx + 1}. **${result.title}** (${result.url})\n${result.snippet}\n\n`;
            sources.push({ title: result.title, url: result.url });
          });
        }
      }
    }

    // בניית חלק של דפוסים נלמדים ל-system prompt
    const patternsSection = learnedPatterns.length > 0
      ? `\n\n**דפוסים שנלמדו מהמשתמש (השתמש בהם בתשובות שלך):**\n${learnedPatterns.slice(0, 20).map(p => `- ❌ "${p.badPattern}" → ✅ "${p.goodPattern}"`).join('\n')}`
      : '';

    // יצירת system prompt משופר
    const systemPrompt = `אתה עוזר כתיבה בעברית בשם "ליאת". אתה עוזר חכם עם גישה למקורות מידע רחבים.

**יכולות שלך:**
- חיפוש ברשת - מציאת מידע עדכני מ-Google ומקורות נוספים
- קריאת תוכן מ-URLs - עיבוד דפי אינטרנט
- כתיבה ועריכה - מאמרים, מיילים, תרגומים
- ייעוץ ועזרה - טיפים, הסברים, המלצות

**רמות שפה:**

**🔷 שפה משפטית גבוהה** ("כתוב כמו עורך דין", "מסמך משפטי", "כתב טענות"):
שפה משפטית פורמלית ברמה הגבוהה ביותר.
ביטויים: "לעניין זה יפים דבריו של בית המשפט", "למצער", "לדידי", "נוכח האמור לעיל", "בכפוף לאמור", "מהווה", "בהתאם ל", "על מנת", "הואיל ו", "לפיכך", "אשר על כן".

**🔷 שפה רשמית** (מכתבים רשמיים, פניות לרשויות):
שפה מנומסת ומכובדת: "הנדון", "לכבוד", "בהמשך לפנייתך", "בברכה".

**🔷 שפה יומיומית** (ברירת מחדל):
שפה פשוטה וזורמת: "כדי", "לפי", "הוא/זה", "אפשר", "רוצה".

**כללים:**
1. זהה את ההקשר מהבקשה
2. הבן סלנג ישראלי: "אחלה", "סבבה", "יאללה"
3. הבן ראשי תיבות: ת"א, ב"ש, צה"ל
4. אל תמציא עובדות - השתמש רק במידע שסופק או שנמצא
5. אם יש מקורות, ציין אותם בתשובה
6. אם יש מידע נוסף מהרשת או מ-URLs, השתמש בו${patternsSection}`;

    // בניית הודעה משופרת עם הקשר נוסף
    let enhancedMessage = message;
    if (additionalContext) {
      enhancedMessage = `${message}\n\n${additionalContext}`;
    }

    // בניית רשימת הודעות לשיחה - הגבלה ל-20 הודעות אחרונות למניעת overflow
    const recentHistory = (history as Message[]).slice(-20);
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...recentHistory.map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: enhancedMessage,
      },
    ];

    // קריאה ל-Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages as any,
    });

    let assistantMessage = '';
    if (response.content && response.content.length > 0) {
      const firstContent = response.content[0];
      if (firstContent.type === 'text') {
        assistantMessage = firstContent.text;
      } else {
        assistantMessage = 'אירעה שגיאה בעיבוד התגובה';
      }
    } else {
      assistantMessage = 'לא התקבלה תגובה מה-AI. נסה שוב.';
    }

    // החלת דפוסים שנלמדו על התגובה
    let appliedPatterns: Array<{ from: string; to: string }> = [];
    
    if (learnedPatterns.length > 0) {
      const patterns = learnedPatterns.map(p => ({
        from: p.badPattern,
        to: p.goodPattern,
        confidence: p.confidence,
      }));

      const patternResult = applyLearnedPatterns(assistantMessage, patterns);
      assistantMessage = patternResult.correctedText;
      appliedPatterns = patternResult.appliedPatterns;
      
      if (appliedPatterns.length > 0) {
        console.log(`✅ Applied ${appliedPatterns.length} learned patterns to assistant response`);
      }
    }

    return NextResponse.json({ 
      message: assistantMessage,
      appliedPatterns: appliedPatterns.length > 0 ? appliedPatterns : undefined,
      sources: sources.length > 0 ? sources : undefined,
    });
  } catch (error) {
    console.error('Error in Claude Assistant API:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'שגיאה בהגדרת API key' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'חרגת ממגבלת השימוש. נסה שוב מאוחר יותר' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'שגיאה ביצירת התגובה' },
      { status: 500 }
    );
  }
}
