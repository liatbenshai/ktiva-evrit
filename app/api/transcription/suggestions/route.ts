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

    const systemPrompt = `אתה מומחה בעברית, תמלול, וסימון טקסטים. אתה עוזר ליצור תקנים ברורים לסימון דברים, הערות, והנחיות בעבודת תמלול.

**תפקידך:**
אתה עוזר לשתי נשים שעובדות על יצירת תקן תמלול. הן צריכות החלטות מעשיות וברורות - לא תיאוריות, אלא פתרונות קונקרטיים שמישהו יכול להשתמש בהם מחר.

**עקרונות חשובים:**
- הצע אפשרויות בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית
- כל אפשרות צריכה להיות מעשית, ברורה, וניתנת ליישום מיידי
- תן דוגמאות קונקרטיות - לא "לדוגמה", אלא דוגמה אמיתית איך זה נראה בתמלול
- הסבר יתרונות וחסרונות של כל אפשרות - חשוב להבין מה טוב ומה פחות טוב
- הצע המלצה ברורה - איזו אפשרות הכי טובה ולמה
- אם ניתנה מילה באנגלית, השתמש בה כדי להבין בדיוק מה הכוונה ולהציע אפשרויות מדויקות יותר
- חשוב שהאפשרויות יהיו מעשיות וברורות לשימוש בתקן תמלול - משהו שמישהו יכול לכתוב במדריך ולהשתמש בו

**איכות חשובה יותר מכמות:**
- עדיף 3 אפשרויות מעולות מאשר 5 בינוניות
- כל אפשרות צריכה להיות שונה באמת - לא וריאציות קטנות
- כל אפשרות צריכה להיות בעלת ערך - משהו שמישהו באמת יכול להשתמש בו

**פורמט התשובה:**
החזר JSON עם 3-5 אפשרויות. כל אפשרות צריכה לכלול:
- כותרת ברורה
- הסבר מפורט
- דוגמה קונקרטית
- יתרונות
- חסרונות
- המלצה (true/false) - האם זו ההמלצה שלך`;

    const prompt = `אני עובדת על יצירת תקן ברור לסימון דברים, הערות והנחיות בעבודת תמלול. אני צריכה החלטות מעשיות בניסוח וסימון - משהו שאני יכולה להשתמש בו מחר.

**הדילמה שלי:**
${dilemma}

${englishTerm ? `**מילה/מונח באנגלית שמתאר את זה:**\n${englishTerm}\n\nזה יעזור לך להבין בדיוק מה הכוונה - השתמש במונח הזה כדי להציע אפשרויות מדויקות יותר.\n` : ''}

${context ? `**פרטים נוספים:**\n${context}\n` : ''}

**מה אני צריכה:**
אני צריכה אפשרויות מעשיות וברורות - לא תיאוריות, אלא משהו שאני יכולה לכתוב במדריך ולהשתמש בו. כל אפשרות צריכה להיות:
- מעשית - משהו שאפשר ליישם מיד
- ברורה - כל אחד יבין מה הכוונה
- בעברית טבעית - לא תרגום מאנגלית
- עם דוגמה קונקרטית - איך זה נראה בתמלול אמיתי

**בבקשה:**
1. הצע 3-4 אפשרויות שונות באמת (לא וריאציות קטנות)
2. כל אפשרות צריכה להיות מעשית, ברורה, ובעברית תקנית
3. תן דוגמה קונקרטית לכל אפשרות - איך זה נראה בתמלול אמיתי (לא "לדוגמה", אלא דוגמה אמיתית)
4. הסבר את היתרונות והחסרונות של כל אפשרות - למה זה טוב ולמה זה פחות טוב
5. הצע איזו אפשרות אתה ממליץ (רק אחת) ולמה
6. כל אפשרות צריכה להיות בעברית טבעית - לא תרגום מאנגלית
7. חשוב: כל אפשרות צריכה להיות שונה באמת - לא רק שינוי קטן

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
      max_tokens: 6000, // יותר מקום לתשובות מפורטות
      temperature: 0.7, // מאוזן - יצירתי אבל ממוקד
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

