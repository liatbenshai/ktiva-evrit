import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, count = 3, context = '', category = 'general', userId = 'default-user' } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('📝 Generating synonym versions for text:', text.substring(0, 100) + '...');

    // Fetch all synonyms from database
    const synonyms = await prisma.synonym.findMany({
      where: category !== 'general' ? { category } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📚 Found ${synonyms.length} synonyms in database`);

    // Parse synonyms
    const parsedSynonyms = synonyms.map(syn => ({
      primary: syn.primary,
      alternatives: JSON.parse(syn.alternatives),
      context: syn.context ? JSON.parse(syn.context) : []
    }));

    // Create synonyms dictionary for Claude
    const synonymsDict = parsedSynonyms.map(s => 
      `"${s.primary}" (מועדף) ← [${s.alternatives.join(', ')}]`
    ).join('\n');

    // Build prompt for Claude
    const prompt = `אתה עוזר לשיפור טקסטים בעברית. יש לך מילון של מילים נרדפות שבו המילה המועדפת (התקנית) מופיעה ראשונה, ואחריה חלופות פחות מומלצות.

<מילון_מילים_נרדפות>
${synonymsDict}
</מילון_מילים_נרדפות>

<טקסט_מקורי>
${text}
</טקסט_מקורי>

משימה: צור 3 גרסאות שונות של הטקסט, כאשר בכל גרסה תחליף מילים לא מומלצות במילים המועדפות ממילון המילים הנרדפות.

דרישות:
1. כל גרסה צריכה להיות שונה - להתמקד בהיבטים שונים של השיפור
2. גרסה 1: החלפה מינימלית - רק את המקרים הבולטים ביותר
3. גרסה 2: החלפה בינונית - שילוב מאוזן
4. גרסה 3: החלפה מקסימלית - כל מקום שניתן לשפר
5. שמור על המשמעות והסגנון המקורי
6. הסבר בדיוק מה הוחלף ולמה

**חשוב מאוד:** החזר רק את אובייקט ה-JSON בלבד, ללא markdown, ללא backticks, ללא טקסט הסבר. 
התשובה שלך צריכה להתחיל ב-{ ולהסתיים ב-}

פורמט JSON מדויק:
{
  "versions": [
    {
      "id": "v1",
      "title": "שיפור מינימלי",
      "content": "הטקסט המשופר...",
      "improvements": [
        {
          "original": "מילה מקורית",
          "replacement": "מילה מועדפת",
          "reason": "הסבר קצר למה זה שיפור"
        }
      ]
    },
    {
      "id": "v2",
      "title": "שיפור בינוני",
      "content": "הטקסט המשופר...",
      "improvements": [...]
    },
    {
      "id": "v3",
      "title": "שיפור מקסימלי",
      "content": "הטקסט המשופר...",
      "improvements": [...]
    }
  ],
  "qualityAnalysis": {
    "score": 75,
    "suggestions": [
      {
        "word": "מילה בעייתית",
        "suggestion": "מילה מומלצת",
        "reason": "הסבר"
      }
    ]
  }
}

זכור: 
- אל תשתמש במילים מהמילון אם הן לא מתאימות להקשר
- אל תעטוף את ה-JSON בסימני קוד או בכל דבר אחר
- החזר רק JSON תקין וטהור`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API with JSON mode
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log('✅ Claude API response received');

    // Extract text from response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    console.log('📄 Response text:', responseText.substring(0, 200) + '...');

    // Parse JSON response
    let result;
    let cleanedText = responseText.trim(); // Define here so it's available in catch block
    
    try {
      console.log('🔍 Raw response (first 300 chars):', cleanedText.substring(0, 300));
      
      // Remove markdown code blocks in various formats
      // Case 1: ```json\n{...}\n```
      if (cleanedText.includes('```json')) {
        const start = cleanedText.indexOf('```json') + 7; // length of '```json'
        const end = cleanedText.lastIndexOf('```');
        if (end > start) {
          cleanedText = cleanedText.substring(start, end).trim();
        }
      }
      // Case 2: ```\n{...}\n```
      else if (cleanedText.startsWith('```')) {
        const start = cleanedText.indexOf('\n') + 1;
        const end = cleanedText.lastIndexOf('```');
        if (end > start) {
          cleanedText = cleanedText.substring(start, end).trim();
        }
      }
      
      // Remove any remaining backticks at start/end
      cleanedText = cleanedText.replace(/^`+/, '').replace(/`+$/, '').trim();
      
      console.log('🧹 Cleaned text (first 300 chars):', cleanedText.substring(0, 300));
      
      // Try to parse
      result = JSON.parse(cleanedText);
      
      console.log('✅ Successfully parsed JSON response');
      console.log('📊 Generated versions:', result.versions?.length || 0);
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response:', parseError);
      console.error('❌ Cleaned text was:', cleanedText.substring(0, 1000));
      
      // Try one more time - extract anything between first { and last }
      try {
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const extracted = responseText.substring(firstBrace, lastBrace + 1);
          console.log('🔄 Trying to parse extracted JSON...');
          result = JSON.parse(extracted);
          console.log('✅ Successfully parsed extracted JSON');
        } else {
          throw parseError;
        }
      } catch (secondError) {
        console.error('❌ Second parse attempt also failed');
        return NextResponse.json(
          { 
            error: 'Failed to parse AI response',
            details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
            sample: responseText.substring(0, 500)
          },
          { status: 500 }
        );
      }
    }

    // Validate response structure
    if (!result.versions || !Array.isArray(result.versions)) {
      console.error('❌ Invalid response structure:', result);
      return NextResponse.json(
        { error: 'Invalid response structure from AI' },
        { status: 500 }
      );
    }

    console.log(`✅ Generated ${result.versions.length} versions successfully`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error generating synonym versions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate synonym versions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
