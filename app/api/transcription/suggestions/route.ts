import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { dilemma, context, englishTerm } = await req.json();

    if (!dilemma || !dilemma.trim()) {
      return NextResponse.json(
        { error: 'נא להזין דילמה' },
        { status: 400 }
      );
    }

    const systemPrompt = `אתה מומחה בעברית, תמלול, וסימון טקסטים. אתה עוזר ליצור תקנים ברורים לסימון דברים, הערות, והנחיות בקורס תמלול מקוון.

**עקרונות חשובים:**
- הצע אפשרויות בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית
- כל אפשרות צריכה להיות מעשית וברורה
- תן דוגמאות קונקרטיות
- הסבר יתרונות וחסרונות של כל אפשרות
- הצע המלצה ברורה
- אם ניתנה מילה באנגלית, השתמש בה כדי להבין בדיוק מה הכוונה ולהציע אפשרויות מדויקות יותר
- חשוב שהאפשרויות יהיו מעשיות וברורות לשימוש בתקן תמלול

**פורמט התשובה:**
החזר JSON עם 3-5 אפשרויות. כל אפשרות צריכה לכלול:
- כותרת ברורה
- הסבר מפורט
- דוגמה קונקרטית
- יתרונות
- חסרונות
- המלצה (true/false) - האם זו ההמלצה שלך`;

    const prompt = `אני עובדת על קורס תמלול מקוון ואני צריכה ליצור תקן ברור לסימון דברים, הערות והנחיות.

**הדילמה שלי:**
${dilemma}

${englishTerm ? `**מילה/מונח באנגלית שמתאר את זה:**\n${englishTerm}\n\nזה יעזור לך להבין בדיוק מה הכוונה - השתמש במונח הזה כדי להציע אפשרויות מדויקות יותר.\n` : ''}

${context ? `**ההקשר:**\n${context}\n` : ''}

**בבקשה:**
1. הצע 3-5 אפשרויות שונות להתמודדות עם הדילמה הזו
2. כל אפשרות צריכה להיות מעשית, ברורה, ובעברית תקנית
3. תן דוגמאות קונקרטיות לכל אפשרות
4. הסבר את היתרונות והחסרונות של כל אפשרות
5. הצע איזו אפשרות אתה ממליץ (רק אחת)
6. כל אפשרות צריכה להיות בעברית טבעית - לא תרגום מאנגלית

**חשוב מאוד:** החזר רק את אובייקט ה-JSON בלבד, ללא markdown, ללא backticks, ללא טקסט הסבר.
התשובה שלך צריכה להתחיל ב-{ ולהסתיים ב-}

פורמט JSON מדויק:
{
  "options": [
    {
      "id": "opt1",
      "title": "כותרת האפשרות",
      "description": "הסבר מפורט של האפשרות",
      "example": "דוגמה קונקרטית איך זה נראה בפועל",
      "pros": ["יתרון 1", "יתרון 2"],
      "cons": ["חסרון 1", "חסרון 2"],
      "recommended": false
    },
    {
      "id": "opt2",
      "title": "כותרת נוספת",
      "description": "הסבר...",
      "example": "דוגמה...",
      "pros": ["יתרון..."],
      "cons": ["חסרון..."],
      "recommended": true
    }
  ],
  "summary": "סיכום קצר של כל האפשרויות וההמלצה הסופית"
}`;

    console.log('🤖 Calling Claude API for transcription suggestions...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.8, // קצת יותר יצירתי כדי לתת אפשרויות מגוונות
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    console.log('✅ Claude API response received');

    // Parse JSON response
    let result;
    let cleanedText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Find JSON object
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    try {
      result = JSON.parse(cleanedText);
      console.log('✅ JSON parsed successfully');
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('Raw response (first 500 chars):', cleanedText.substring(0, 500));
      
      // Try to fix common issues
      try {
        // Remove any trailing commas
        cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
        result = JSON.parse(cleanedText);
        console.log('✅ JSON parsed after cleanup');
      } catch (secondError) {
        return NextResponse.json(
          { 
            error: 'שגיאה בפענוח התשובה מהמערכת',
            details: parseError.message,
            rawResponse: cleanedText.substring(0, 200)
          },
          { status: 500 }
        );
      }
    }

    // Validate structure
    if (!result.options || !Array.isArray(result.options) || result.options.length === 0) {
      return NextResponse.json(
        { error: 'התשובה לא מכילה אפשרויות תקינות' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת ההצעות: ' + error.message },
      { status: 500 }
    );
  }
}

