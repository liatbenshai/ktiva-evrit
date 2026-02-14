import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/get-user-id';

// Re-export the performWebSearch function from research route
async function performWebSearch(query: string, maxResults: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (process.env.TAVILY_API_KEY) {
    try {
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
    try {
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

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface LegalCaseSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  court?: string;
  date?: string;
}

interface LegalCaseResponse {
  topic: string;
  summary: string;
  cases: LegalCaseSource[];
  detailedAnalysis: string;
  timestamp: string;
  sessionId?: string;
  warning?: string; // Warning if insufficient sources
}

/**
 * POST - מציאת פסקי דין רלוונטיים
 * מקבל נושא, מבצע חיפוש ברשת אחר פסקי דין רלוונטיים ומחזיר סיכום עם הפניות
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      topic, 
      maxResults = 15, 
      language = 'hebrew',
      sessionId,
      isNewSession = false,
      context, // For follow-up questions - previous summary context
    } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'נושא נדרש' },
        { status: 400 }
      );
    }

    console.log(`⚖️ Searching for legal cases on topic: ${topic}`);

    // Step 1: Create search queries specifically for legal cases
    const searchQueries = [
      `פסק דין ${topic}`,
      `פסקי דין ${topic} ישראל`,
      `${topic} בית משפט`,
      `תקדין ${topic}`,
      `נבו ${topic}`,
    ];

    const allSearchResults: SearchResult[] = [];
    
    // Perform searches
    for (const query of searchQueries.slice(0, 3)) { // Use 3 queries for better legal coverage
      try {
        console.log(`Searching for: ${query}`);
        const searchResults = await performWebSearch(query, maxResults);
        allSearchResults.push(...searchResults);
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
      }
    }

    // Filter results to prioritize legal case websites
    const legalDomains = [
      'nevo.co.il',
      'takdin.co.il',
      'court.gov.il',
      'law.co.il',
      'psakdin.co.il',
      'din.co.il',
    ];

    // Prioritize legal case websites
    const prioritizedResults = [
      ...allSearchResults.filter(r => 
        legalDomains.some(domain => r.url.includes(domain))
      ),
      ...allSearchResults.filter(r => 
        !legalDomains.some(domain => r.url.includes(domain))
      ),
    ];

    // Remove duplicates based on URL
    const uniqueResults = Array.from(
      new Map(prioritizedResults.map(item => [item.url, item])).values()
    );

    // Validate that we have actual sources
    if (uniqueResults.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'לא נמצאו פסקי דין רלוונטיים. אנא נסי עם נושא אחר או בדקי את חיבור האינטרנט.',
          warning: 'לא נמצאו מקורות מידע אמיתיים',
        },
        { status: 404 }
      );
    }

    // Step 2: Organize sources and extract legal case information
    const cases: LegalCaseSource[] = uniqueResults
      .slice(0, maxResults)
      .map((result, index) => {
        // Try to extract court and date from title/snippet
        const courtMatch = result.title.match(/(בית משפט|בית דין|בית המשפט|בית הדין)[^,]*/i);
        const dateMatch = result.snippet.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
        
        return {
          title: result.title,
          url: result.url,
          snippet: result.snippet,
          relevance: 1 - (index / uniqueResults.length),
          court: courtMatch ? courtMatch[0] : undefined,
          date: dateMatch ? dateMatch[1] : undefined,
        };
      });

    // Validate minimum sources for reliable analysis
    const minSourcesRequired = 3;
    const hasInsufficientSources = cases.length < minSourcesRequired;

    // Step 3: Create comprehensive content from all cases
    const casesContent = cases
      .map((caseItem, index) => {
        return `פסק דין ${index + 1}: ${caseItem.title}
URL: ${caseItem.url}
${caseItem.court ? `בית משפט: ${caseItem.court}` : ''}
${caseItem.date ? `תאריך: ${caseItem.date}` : ''}
תוכן: ${caseItem.snippet}
---`;
      })
      .join('\n\n');

    // Step 4: Generate comprehensive summary using AI
    const contextInfo = context ? `\n\n**הקשר מחיפוש קודם:**
${context}

**הערה:** זהו חיפוש המשך. התייחס גם למידע מהחיפוש הקודם אם רלוונטי, אבל התמקד בפסקי הדין החדשים שנמצאו.` : '';

    const legalPrompt = `אתה מומחה משפטי. ערכת מחקר על פסקי דין בנושא הבא:

**נושא המחקר:**
${topic}
${contextInfo}

**פסקי דין שנמצאו (${cases.length} מקורות):**
${casesContent}

**הוראות קריטיות:**
⚠️ **אל תמציא שום מידע!** השתמש רק במידע שקיים במפורש במקורות שלמעלה.
⚠️ אם מידע לא מופיע במקורות - אל תכלול אותו בתשובה.
⚠️ אם יש מעט מקורות (פחות מ-3), ציין זאת במפורש והזהיר שהניתוח מוגבל.

**בבקשה צור:**
1. סיכום מפורט של פסקי הדין הרלוונטיים שנמצאו - **רק על בסיס המקורות למעלה**
2. ניתוח של הנושא המשפטי והגישות השונות - **רק מה שמופיע במקורות**
3. נקודות מרכזיות וחשובות מפסקי הדין - **עם ציטוטים מהמקורות**
4. השוואה בין פסקי דין שונים (אם יש) - **רק אם מופיע במקורות**
5. מסקנות והמלצות - **רק על בסיס המקורות, לא השערות**
6. אזכור של פסקי הדין הרלוונטיים ביותר עם מספרים (פסק דין 1, פסק דין 2, וכו')

**כל מידע חייב להיות מבוסס על המקורות למעלה בלבד. אם משהו לא מופיע במקורות - אל תכלול אותו.**

כתוב בעברית תקנית, מקצועית ומפורטת. השתמש בטרמינולוגיה משפטית מתאימה. כלול ציטוטים מפסקי הדין עם מספר המקור.`;

    const systemPrompt = `אתה מומחה משפטי מקצועי. תפקידך לסכם ולנתח פסקי דין בצורה מדויקת, מאוזנת ומעמיקה.

**כללים קריטיים:**
1. **אל תמציא שום מידע** - השתמש רק במידע שקיים במפורש במקורות שסופקו
2. **אם מידע לא מופיע במקורות** - אל תכלול אותו בתשובה, גם אם אתה חושב שהוא נכון
3. **ציין תמיד את המקורות** - כל טענה חייבת להיות מקושרת למקור ספציפי (פסק דין 1, פסק דין 2, וכו')
4. **אם יש מעט מקורות** - ציין זאת במפורש והזהיר שהניתוח מוגבל
5. **הבחן בין עובדות להלכות** - רק מה שמופיע במקורות
6. **ציין אם יש פסקי דין סותרים** - רק אם זה מופיע במקורות
7. **כתוב בעברית תקנית ומקצועית** - השתמש בטרמינולוגיה משפטית נכונה
8. **ציין את בתי המשפט והתאריכים** - רק אם הם מופיעים במקורות

**זכור: דיוק חשוב יותר מפירוט. עדיף תשובה קצרה ומדויקת מאשר תשובה מפורטת עם מידע מומצא.**`;

    console.log('🤖 Generating AI summary...');
    const summary = await generateText({
      prompt: legalPrompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.1, // Lower temperature for more factual, less creative responses
    });

    // Step 5: Generate detailed legal analysis
    const detailedPrompt = `תבסס **רק** על פסקי הדין שנמצאו למעלה, צור ניתוח משפטי מפורט עם:

⚠️ **חשוב: השתמש רק במידע מהמקורות למעלה. אל תמציא שום דבר.**

- פירוט של כל פסק דין מרכזי - **עם ציטוטים מהמקורות**
- ניתוח ההלכות והגישות המשפטיות - **רק מה שמופיע במקורות**
- השוואות בין פסקי דין שונים - **רק אם יש מספיק מקורות להשוואה**
- דוגמאות קונקרטיות מהפסקים - **עם הפניה למקור ספציפי**
- הקשרים בין הנושאים המשפטיים - **רק אם מופיע במקורות**
- מידע נוסף רלוונטי - **רק אם קיים במקורות**

${hasInsufficientSources ? `⚠️ **אזהרה:** נמצאו רק ${cases.length} מקורות, מה שעלול להגביל את הניתוח. ציין זאת במפורש.` : ''}

כתוב בעברית, בצורה מאורגנת עם כותרות משנה. השתמש בטרמינולוגיה משפטית מקצועית. כל טענה חייבת להיות מקושרת למקור ספציפי.`;

    const detailedAnalysis = await generateText({
      prompt: detailedPrompt,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.1, // Lower temperature for more factual responses
    });

    const response: LegalCaseResponse = {
      topic,
      summary,
      cases,
      detailedAnalysis,
      timestamp: new Date().toISOString(),
    };

    // Add warning if insufficient sources
    if (hasInsufficientSources) {
      const warning = `נמצאו רק ${cases.length} מקורות. הניתוח עלול להיות מוגבל. מומלץ לחפש עם מילות מפתח נוספות.`;
      response.warning = warning;
      console.warn(`⚠️ Only ${cases.length} sources found for topic "${topic}". Analysis may be limited.`);
    }

    // Add warning if insufficient sources
    if (hasInsufficientSources) {
      console.warn(`⚠️ Only ${cases.length} sources found for topic "${topic}". Analysis may be limited.`);
    }

    // Save to database (optional - don't fail if DB save fails)
    try {
      const userId = await getUserId();
      
      if (isNewSession === true || !sessionId) {
        // Create new session
        const session = await prisma.legalCaseSession.create({
          data: {
            userId,
            topic,
            cases: {
              create: {
                topic,
                summary,
                detailedAnalysis: detailedAnalysis || null,
                sources: cases ? JSON.stringify(cases) : null,
                order: 0,
              },
            },
          },
        });
        response.sessionId = session.id;
      } else if (sessionId) {
        // Add case to existing session
        const existingSession = await prisma.legalCaseSession.findFirst({
          where: { id: sessionId, userId },
          include: { cases: true },
        });

        if (existingSession) {
          const nextOrder = existingSession.cases.length;
          await prisma.legalCase.create({
            data: {
              sessionId,
              topic,
              summary,
              detailedAnalysis: detailedAnalysis || null,
              sources: cases ? JSON.stringify(cases) : null,
              order: nextOrder,
            },
          });
          response.sessionId = sessionId;
        }
      }
    } catch (dbError) {
      console.warn('Failed to save legal case session to database (non-critical):', dbError);
    }

    console.log(`✅ Legal case search completed. Found ${cases.length} cases.`);

    return NextResponse.json({
      success: true,
      data: response,
      ...(hasInsufficientSources && { warning: response.warning }),
    });
  } catch (error: any) {
    console.error('Error in legal cases API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בחיפוש פסקי דין',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


