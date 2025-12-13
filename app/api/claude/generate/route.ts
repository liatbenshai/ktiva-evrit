import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { applyLearnedPatterns } from '@/lib/ai/hebrew-analyzer';
import {
  articlePrompt,
  emailPrompt,
  postPrompt,
  storyPrompt,
  summaryPrompt,
  protocolPrompt,
  scriptPrompt,
  aiPromptPrompt,
  worksheetPrompt,
} from '@/prompts';

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
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000);
    
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
    const { type, data } = body;
    
    // Extract URLs and check if web search is needed
    const urls: string[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Check in various data fields for URLs
    const allText = [
      data.title,
      data.keywords,
      data.additionalInstructions,
      data.context,
      data.topic,
      data.text,
      data.transcript,
      data.instruction,
      data.story,
    ].filter(Boolean).join(' ');
    
    const foundUrls = allText.match(urlRegex) || [];
    urls.push(...foundUrls);
    
    // Check if web search is needed (for articles, posts, etc.)
    const needsWebSearch = data.needsWebSearch || 
      (type === 'article' && data.keywords) ||
      (type === 'post' && data.topic) ||
      (type === 'script' && data.topic);

    // Collect additional context from URLs and web search
    let additionalContext = '';
    const sources: Array<{ title: string; url: string }> = [];

    // 1. Process URLs
    if (urls.length > 0) {
      console.log(`📎 Processing ${urls.length} URL(s) for ${type}`);
      const urlContents = await Promise.all(
        urls.map(async (url: string) => {
          const content = await fetchURLContent(url);
          sources.push({ title: url, url });
          return `**תוכן מ-${url}:**\n${content}\n\n`;
        })
      );
      additionalContext += urlContents.join('\n');
    }

    // 2. Perform web search if needed
    if (needsWebSearch) {
      const searchQuery = type === 'article' 
        ? `${data.title} ${data.keywords}`
        : type === 'post'
        ? data.topic
        : type === 'script'
        ? data.topic
        : '';
      
      if (searchQuery) {
        console.log(`🔍 Performing web search for ${type}: ${searchQuery}`);
        const searchResults = await performWebSearch(searchQuery, 5);
        
        if (searchResults.length > 0) {
          additionalContext += '\n**מידע עדכני מהרשת:**\n';
          searchResults.forEach((result, idx) => {
            additionalContext += `${idx + 1}. **${result.title}** (${result.url})\n${result.snippet}\n\n`;
            sources.push({ title: result.title, url: result.url });
          });
        }
      }
    }

    let prompt = '';
    let systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. תפקידך לעזור למשתמשים לכתוב טקסטים בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית.

**עקרונות חשובים:**
- כתוב בעברית טבעית וזורמת
- הימנע מתרגומים ישירים מאנגלית
- השתמש בביטויים עבריים מקוריים
- כתוב בצורה ברורה ומקצועית
${additionalContext ? '- השתמש במידע מהרשת ומ-URLs שסופקו כדי להעשיר את התוכן' : ''}`;

    switch (type) {
      case 'article':
        let articlePromptText = articlePrompt(
          data.title, 
          data.keywords, 
          data.wordCount,
          data.additionalInstructions
        );
        
        if (additionalContext) {
          articlePromptText += `\n\n${additionalContext}`;
        }
        
        prompt = articlePromptText;
        systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. אתה כותב תוכן מומחה SEO עם ידע מעמיק בכללי Yoast ואופטימיזציה למנועי חיפוש.

**עקרונות כתיבה:**
- כתוב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית
- הימנע מביטויים כמו "בסוף היום", "לעבור לשלב הבא", "במקום של"
- השתמש בביטויים עבריים מקוריים וטבעיים
- כתוב בצורה מקצועית אך קריאה
${additionalContext ? '- השתמש במידע מהרשת ומ-URLs כדי להעשיר את המאמר עם עובדות עדכניות ומקורות' : ''}`;
        break;

      case 'email':
        let emailPromptText = emailPrompt(data.context, data.recipient, data.tone);
        if (additionalContext) {
          emailPromptText += `\n\n${additionalContext}`;
        }
        prompt = emailPromptText;
        break;

      case 'post':
        let postPromptText = postPrompt(data.topic, data.platform, data.length);
        if (additionalContext) {
          postPromptText += `\n\n${additionalContext}`;
        }
        prompt = postPromptText;
        break;

      case 'story':
        prompt = storyPrompt(
          data.genre, 
          data.characters, 
          data.setting, 
          data.plot, 
          data.length,
          data.tone,
          data.additionalInstructions
        );
        break;

      case 'summary':
        if (data.followUpQuestion && data.previousSummary) {
          // Follow-up question
          const historyContext = data.history && data.history.length > 0
            ? `\n\n**היסטוריית שאלות קודמות:**\n${data.history.map((h: any, i: number) => `${i + 1}. ${h.question}: ${h.answer.substring(0, 200)}...`).join('\n')}`
            : '';
          
          prompt = `זהו שאלת המשך על הסיכום הקודם.

**הסיכום המקורי:**
${data.previousSummary}
${historyContext}

**שאלת המשך:**
${data.followUpQuestion}

**הטקסט המקורי לסיכום:**
${data.text}

אנא ענה על שאלת המשך בהתבסס על הסיכום המקורי והטקסט המקורי. תן תשובה מפורטת ומדויקת בעברית תקנית.`;
          
          systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. אתה עונה על שאלות המשך על סיכומים בצורה מדויקת ומפורטת.
          
**עקרונות:**
- ענה על השאלה בהתבסס על הסיכום המקורי והטקסט המקורי
- אם זו שאלת המשך, קשר את התשובה למידע הקודם
- כתוב בעברית תקנית, טבעית וזורמת
- תן תשובה מפורטת ומדויקת`;
        } else {
          // Initial summary
          prompt = summaryPrompt(data.text, data.length, data.focusPoints);
        }
        break;

      case 'protocol':
        prompt = protocolPrompt(data.transcript, data.includeDecisions);
        systemPrompt = 'אתה מומחה בכתיבת פרוטוקולים. חוק ברזל: כתוב את דברי הדוברים בגוף ראשון בלבד - "אני", "אנחנו", "לדעתי". לעולם אל תכתוב "הוא אמר", "היא הציעה", "הם דנו". כתוב כאילו הדובר עצמו כותב את הדברים שלו.';
        break;

      case 'script':
        let scriptPromptText = scriptPrompt(
          data.topic,
          data.duration,
          data.audience,
          data.style,
          data.additionalInstructions
        );
        if (additionalContext) {
          scriptPromptText += `\n\n${additionalContext}`;
        }
        prompt = scriptPromptText;
        systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. אתה תסריטאי מקצועי עם ניסיון רב בכתיבת תסריטים.

**עקרונות כתיבה:**
- כתוב בעברית מדוברת, טבעית וזורמת - לא תרגום מילולי מאנגלית
- הימנע מביטויים כמו "לעבור לשלב הבא" (השתמש ב"להתקדם"), "במקום של" (השתמש ב"במקום")
- כתוב בצורה זורמת וקולחת
- אתה פתוח ללמוד ולשפר מעריכות המשתמש ומשוב שלו
${additionalContext ? '- השתמש במידע מהרשת ומ-URLs כדי להעשיר את התסריט עם עובדות עדכניות' : ''}`;
        break;

      case 'worksheet':
        prompt = worksheetPrompt(
          data.instruction,
          data.story,
          data.grade,
          data.subject
        );
        systemPrompt = 'אתה מורה מקצועי ומומחה בהכנת דפי עבודה וחומרי לימוד. אתה מכין דפי עבודה מקצועיים, מוכנים להדפסה, ומותאמים לרמת הכיתה. אתה כותב בעברית תקנית וקריאה - לא תרגום מילולי מאנגלית.';
        break;

      case 'aiPrompt':
        prompt = aiPromptPrompt(
          data.goal,
          data.context,
          data.outputFormat,
          data.additionalRequirements
        );
        systemPrompt = 'אתה מומחה בכתיבת Prompts אפקטיביים למודלי שפה גדולים (LLMs). אתה יודע איך לכתוב prompts ברורים, מדויקים ואפקטיביים. אתה כותב בעברית תקנית כשצריך, ובאנגלית כשה-prompt מיועד למודלים באנגלית. אתה פתוח ללמוד ולשפר מעריכות המשתמש.';
        break;

      case 'improve':
        prompt = `${data.instructions || 'שפר את הטקסט הבא לעברית תקנית וזורמת'}${data.keywords ? `\n\nמילות מפתח לשילוב: ${data.keywords}` : ''}:\n\n${data.text}`;
        systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. אתה כותב תוכן מומחה SEO עם ידע מעמיק בכללי Yoast ואופטימיזציה למנועי חיפוש.

**עקרונות שיפור:**
- כתוב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית
- הימנע מביטויים כמו "לעבור לשלב הבא" (השתמש ב"להתקדם"), "במקום של" (השתמש ב"במקום")
- שמור על המסר המקורי אך שפר את הניסוח, הבהרה והמבנה
- הפוך את הטקסט לזורם וקריא יותר`;
        break;

      default:
        return NextResponse.json(
          { error: 'סוג לא נתמך' },
          { status: 400 }
        );
    }

    let result = await generateText({
      prompt,
      systemPrompt,
      maxTokens: type === 'article' ? 8192 : (data.maxTokens || 4096), // Double for articles
      temperature: data.temperature || 0.7,
    });

    // 🔥 החלת דפוסים שנלמדו על הטקסט שנוצר
    const userId = data.userId || 'default-user';
    let appliedPatterns: Array<{ from: string; to: string }> = [];
    
    try {
      const { prisma } = await import('@/lib/prisma');
      const learnedPatterns = await prisma.translationPattern.findMany({
        where: { 
          userId,
          confidence: { gte: 0.7 }, // רק דפוסים בטוחים
        },
        orderBy: { confidence: 'desc' },
        take: 50,
      });

      if (learnedPatterns.length > 0) {
        const patterns = learnedPatterns.map(p => ({
          from: p.badPattern,
          to: p.goodPattern,
          confidence: p.confidence,
        }));

        const patternResult = applyLearnedPatterns(result, patterns);
        result = patternResult.correctedText;
        appliedPatterns = patternResult.appliedPatterns;
        
        console.log(`✅ Applied ${appliedPatterns.length} learned patterns to ${type}:`, 
          appliedPatterns.map(p => `"${p.from}" → "${p.to}"`).join(', '));
      }
    } catch (dbError) {
      console.error('Error applying learned patterns:', dbError);
      // המשך בלי דפוסים במקום להיכשל
    }

    return NextResponse.json({ 
      result,
      appliedPatterns: appliedPatterns.length > 0 ? appliedPatterns : undefined,
      sources: sources.length > 0 ? sources : undefined,
    });
  } catch (error) {
    console.error('Error in Claude API:', error);
    
    // Handle specific API errors
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
      { error: 'שגיאה ביצירת הטקסט' },
      { status: 500 }
    );
  }
}