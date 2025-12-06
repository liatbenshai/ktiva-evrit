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
    const systemPrompt = `אתה עוזר כתיבה בעברית בשם "ליאת". התאם את רמת השפה להקשר.

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
4. אל תמציא עובדות`;

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
