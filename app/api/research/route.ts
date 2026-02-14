import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/get-user-id';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

interface ResearchResponse {
  question: string;
  summary: string;
  sources: ResearchSource[];
  detailedInfo: string;
  timestamp: string;
  sessionId?: string;
}

/**
 * POST - מחקר מעמיק ברשת
 * מקבל שאלה, מבצע חיפוש ברשת, אוסף מידע ממקורות שונים ומחזיר סיכום עם הפניות
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      question, 
      maxSources = 10, 
      language = 'hebrew',
      history = [],
      context = '',
    } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'שאלה נדרשת' },
        { status: 400 }
      );
    }

    const isFollowUp = history.length > 0 || context.length > 0;
    console.log(`🔍 Starting ${isFollowUp ? 'follow-up' : 'initial'} research for question: ${question}`);

    // Step 1: Perform multiple web searches with different query variations
    const searchQueries = [
      question,
      `${question} הסבר מפורט`,
      `${question} מקורות מידע`,
    ];

    const allSearchResults: SearchResult[] = [];
    
    // Perform searches (in a real implementation, you would use a web search API)
    // For now, we'll simulate this - in production you'd use Google Search API, Bing API, etc.
    for (const query of searchQueries.slice(0, 2)) { // Use at least 2 queries for better coverage
      try {
        // Note: In production, replace this with actual web search API calls
        // For example: Google Custom Search API, Bing Search API, SerpAPI, etc.
        console.log(`Searching for: ${query}`);
        
        // This is a placeholder - you'll need to implement actual web search
        // For now, we'll create a structure that can be filled with real search results
        const searchResults = await performWebSearch(query, maxSources);
        allSearchResults.push(...searchResults);
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = Array.from(
      new Map(allSearchResults.map(item => [item.url, item])).values()
    );

    // Step 2: Organize sources by relevance
    const sources: ResearchSource[] = uniqueResults
      .slice(0, maxSources)
      .map((result, index) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        relevance: 1 - (index / uniqueResults.length), // Higher relevance for earlier results
      }));

    // Step 3: Create comprehensive content from all sources
    const sourcesContent = sources
      .map((source, index) => {
        return `מקור ${index + 1}: ${source.title}
URL: ${source.url}
תוכן: ${source.snippet}
---`;
      })
      .join('\n\n');

    // Step 4: Generate comprehensive summary using AI
    const historyContext = history.length > 0 
      ? `\n\n**היסטוריית שאלות קודמות:**\n${history.map((item: any, idx: number) => 
          `שאלה ${idx + 1}: ${item.question}\nתשובה: ${item.answer}\n---`
        ).join('\n\n')}`
      : '';

    const contextInfo = context 
      ? `\n\n**הקשר מהמחקר הקודם:**\n${context}`
      : '';

    const researchPrompt = `אתה חוקר מקצועי. ${isFollowUp ? 'זו שאלת המשך שמתבססת על מחקר קודם.' : 'ערכת מחקר מעמיק על השאלה הבאה:'}

**שאלת המחקר:**
${question}
${historyContext}
${contextInfo}

**מידע שנאסף ממקורות שונים:**
${sourcesContent}

**בבקשה צור:**
1. סיכום מפורט ומעמיק של המידע שנמצא
2. ${isFollowUp ? 'קשר לשאלות הקודמות והתפתחות של הנושא' : 'ניתוח של המידע עם נקודות מרכזיות'}
3. מסקנות והמלצות
4. אזכור של המקורות הרלוונטיים ביותר
${isFollowUp ? '5. השוואה והרחבה ביחס למידע הקודם' : ''}

כתוב בעברית תקנית, מקצועית ומפורטת. כלול ציטוטים מהמקורות עם מספר המקור (מקור 1, מקור 2, וכו').`;

    const systemPrompt = `אתה חוקר מקצועי ומדעי. תפקידך לסכם מידע ממקורות שונים בצורה מדויקת, מאוזנת ומעמיקה.
- ציין תמיד את המקורות בפורמט: (שם המקור, תאריך)
- הבחן בין עובדות לדעות
- ציין אם יש מידע סותר
- כתוב בעברית מקצועית אבל טבעית — לא ארכאית ולא "מתורגמת"
- אל תשתמש ב"חשוב לציין", "ראוי להדגיש", "ניתן לראות כי" — פשוט לציין, להדגיש, ולהראות
${isFollowUp ? '- אם זו שאלת המשך, קשר את התשובה לשאלות הקודמות והרחב עליהן' : ''}`;

    console.log('🤖 Generating AI summary...');
    const summary = await generateText({
      prompt: researchPrompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.3, // Lower temperature for more factual responses
    });

    // Step 5: Generate detailed information section
    const detailedPrompt = `תבסס על המידע שנאסף, צור חלק מפורט יותר עם:
- פירוט של כל נקודה מרכזית
- דוגמאות קונקרטיות
- הקשרים בין נושאים שונים
- מידע נוסף רלוונטי

כתוב בעברית, בצורה מאורגנת עם כותרות משנה.`;

    const detailedInfo = await generateText({
      prompt: detailedPrompt,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.3,
    });

    const response: ResearchResponse = {
      question,
      summary,
      sources,
      detailedInfo,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Research completed. Found ${sources.length} sources.`);

    // Save to database (optional - don't fail if DB save fails)
    try {
      const userId = await getUserId();
      const { sessionId, isNewSession } = body;
      
      if (isNewSession !== false && !sessionId) {
        // Create new session
        const session = await prisma.researchSession.create({
          data: {
            userId,
            initialQuestion: question,
            questions: {
              create: {
                question,
                answer: summary,
                detailedInfo: detailedInfo || null,
                sources: sources ? JSON.stringify(sources) : null,
                order: 0,
              },
            },
          },
        });
        response.sessionId = session.id;
      } else if (sessionId) {
        // Add question to existing session
        const existingSession = await prisma.researchSession.findFirst({
          where: { id: sessionId, userId },
          include: { questions: true },
        });

        if (existingSession) {
          const nextOrder = existingSession.questions.length;
          await prisma.researchQuestion.create({
            data: {
              sessionId,
              question,
              answer: summary,
              detailedInfo: detailedInfo || null,
              sources: sources ? JSON.stringify(sources) : null,
              order: nextOrder,
            },
          });
          response.sessionId = sessionId;
        }
      }
    } catch (dbError) {
      console.warn('Failed to save research to database (non-critical):', dbError);
      // Continue without failing - the research was successful
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error in research API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בביצוע המחקר',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Perform web search using Tavily API or fallback methods
 */
async function performWebSearch(query: string, maxResults: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Try Tavily API first (if API key is available)
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

  // Fallback: Try Google Custom Search API (if configured)
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

  // If no search API is configured, return empty results with a warning
  if (results.length === 0) {
    console.warn('⚠️ No search API configured. Please set TAVILY_API_KEY or GOOGLE_SEARCH_API_KEY in environment variables.');
    console.warn('   You can get Tavily API key from: https://tavily.com');
    console.warn('   Or Google Custom Search API from: https://developers.google.com/custom-search');
  }

  return results;
}

