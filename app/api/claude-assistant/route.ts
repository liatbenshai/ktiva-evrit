import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { applyLearnedPatterns } from '@/lib/ai/hebrew-analyzer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      history = [],
      userId = 'default-user'
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'הודעה נדרשת' },
        { status: 400 }
      );
    }

    // קבלת דפוסים שנלמדו (אופציונלי)
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
      // המשך בלי דפוסים
    }

    // יצירת system prompt
    const systemPrompt = `אתה עוזר AI מקצועי בעברית. אתה יכול לענות על כל שאלה ולכתוב כל סוג של תוכן בעברית תקנית, טבעית וזורמת.

**🔥 כלל ברזל - עברית תקנית (חשוב ביותר!):**
- כתוב תמיד בעברית תקנית, טבעית וזורמת - לעולם לא תרגום מילולי מאנגלית
- חשוב על המחשבה בעברית, לא באנגלית שתורגמה - כאילו עברית היא השפה הראשונה שלך
- הימנע לחלוטין מתרגומים ישירים וביטויים שמשקפים מבנה אנגלי
- אל תמציא מילים חדשות או תרגום מילולי - השתמש במילים עבריות קיימות
- אל תכתוב "בסוף היום" - כתוב "לסיכום" או "לבסוף"
- אל תכתוב "לעבור לשלב הבא" - כתוב "להתקדם לשלב הבא" או "לעבור אל"
- אל תכתוב "במקום של" - כתוב "במקום" או "תחת"
- השתמש בביטויים עבריים מקוריים וטבעיים - כאילו גדלת עם עברית משפת האם שלך
- אם יש לך ספק אם ניסוח נשמע כמו תרגום - שנה אותו לעברית טבעית יותר

**⚠️ כלל ברזל - לא לנחש (חשוב ביותר!):**
- לעולם אל תמציא עובדות, תאריכים, נתונים או פרטים שאינך יודע בביטחון מלא
- לעולם אל תנחש - אם אינך יודע משהו בוודאות, אמור זאת בגילוי לב
- אם אינך יודע משהו בוודאות, אמור בבירור: "אני לא יודע בוודאות..." או "אין לי מידע מדויק על..." או "אני לא בטוח בזה, אבל..."
- אל תנסה להשלים מידע חסר או לנחש פרטים - עדיף לומר שאינך יודע
- אל תמציא תאריכים, מספרים, שמות, או כל מידע ספציפי שאינך יודע
- אם נשאלת שאלה ספציפית על מידע שאינך יודע, אמור זאת בבירור במקום לנחש
- רק ענה על מה שאתה יודע בביטחון - עדיף תשובה קצרה ונכונה או "אני לא יודע" מאשר תשובה מפורטת ומפוברקת
- אם יש לך מידע חלקי - ציין זאת: "אני יודע ש... אבל אינני בטוח ב..."

**כיצד לענות:**
- על שאלות כלליות - ענה בעברית תקנית, ציין אם אינך בטוח במשהו
- על בקשות לכתיבת תוכן - כתוב ישירות את התוכן המבוקש
- אם המשתמש מבקש עבודה או תוכן עבור ילד/ילדה - התאם את השפה, האורך והתוכן לגיל שצוין
- התייחס לפרטים ספציפיים שהמשתמש מזכיר (כמו מקרים שקרו, הקשר מיוחד, וכו')
- ענה לשאלות המשך בהתאם להקשר של השיחה
- אם יש צורך בהבהרה, שאל שאלות ממוקדות
- שמור על עקביות בסגנון הכתיבה לאורך השיחה

**דוגמאות למה לא לעשות - עברית:**
- ❌ "בסוף היום, זה חשוב" → ✅ "לסיכום, זה חשוב"
- ❌ "לעבור לשלב הבא" → ✅ "להתקדם לשלב הבא"
- ❌ "במקום של לכתוב" → ✅ "במקום לכתוב"
- ❌ תרגום מילולי מאנגלית → ✅ עברית טבעית ומקורית

**דוגמאות למה לא לעשות - ניחוש:**
- ❌ "האירוע קרה בשנת 2020" (אם אינך יודע) → ✅ "אני לא יודע את השנה המדויקת של האירוע"
- ❌ "התאריך המדויק הוא..." (אם אינך בטוח) → ✅ "אין לי מידע מדויק על התאריך"
- ❌ "יש כ-1000 אנשים" (אם אינך יודע) → ✅ "אני לא יודע את המספר המדויק"
- ❌ ניחוש עובדות, תאריכים או פרטים → ✅ "אני לא יודע בוודאות" או "אין לי מידע מדויק על זה" או פשוט "אני לא יודע"`;

    // בניית רשימת הודעות לשיחה
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...history.map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
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
    const content = response.content[0];
    if (content.type === 'text') {
      assistantMessage = content.text;
    } else {
      assistantMessage = 'אירעה שגיאה בעיבוד התגובה';
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
