import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      history = [],
      originalCode,
      fileName,
      userId = 'default-user'
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'הודעה נדרשת' },
        { status: 400 }
      );
    }

    if (!originalCode) {
      return NextResponse.json(
        { error: 'קוד מקורי נדרש' },
        { status: 400 }
      );
    }

    // יצירת system prompt
    const systemPrompt = `אתה מומחה קוד מנוסה בעברית. תפקידך לעזור למשתמשים לתקן ולשפר קוד דרך דו-שיח.

**הנחיות חשובות:**
- ענה בעברית תקנית, טבעית וזורמת
- כשמבקשים ממך לתקן קוד, החזר את הקוד המתוקן המלא בתוך code block
- הסבר כל שינוי שעשית בקוד
- אם מבקשים שיפור או תיקון ספציפי, התייחס אליו ישירות
- אם אין צורך בתיקון, הסבר למה הקוד תקין
- שמור על הקשר של השיחה

**פורמט תשובה:**
- אם יש קוד מתוקן: החזר אותו ב-code block עם שפת הקוד המתאימה
- תמיד הסבר מה שונה ולמה
- אם נשאלת שאלה על הקוד, ענה בצורה מקצועית וברורה`;

    // בניית רשימת הודעות לשיחה
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // הודעה ראשונית עם הקוד המקורי
    if (history.length === 0) {
      messages.push({
        role: 'user',
        content: `הנה הקוד שלי${fileName ? ` (${fileName})` : ''}:\n\n\`\`\`\n${originalCode}\n\`\`\``,
      });
    } else {
      // הוספת היסטוריה קודמת
      messages.push(
        ...history.map((msg: Message) => ({
          role: msg.role,
          content: msg.content + (msg.code ? `\n\n\`\`\`\n${msg.code}\n\`\`\`` : ''),
        }))
      );
    }

    // הוספת ההודעה החדשה
    messages.push({
      role: 'user',
      content: message,
    });

    // קריאה ל-Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages as any,
    });

    let assistantMessage = '';
    let fixedCode = null;
    
    const content = response.content[0];
    if (content.type === 'text') {
      assistantMessage = content.text;
      
      // ניסיון לחלץ קוד מתוקן אם יש
      const codeBlockRegex = /```(?:[\w]+)?\n([\s\S]*?)```/g;
      const matches = [...assistantMessage.matchAll(codeBlockRegex)];
      
      if (matches.length > 0) {
        // לוקח את הקוד מהבלוק האחרון (הכי רלוונטי)
        fixedCode = matches[matches.length - 1][1].trim();
      }
    } else {
      assistantMessage = 'אירעה שגיאה בעיבוד התגובה';
    }

    return NextResponse.json({ 
      message: assistantMessage,
      fixedCode: fixedCode || undefined,
    });
  } catch (error) {
    console.error('Error in Code Review Chat API:', error);
    
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
