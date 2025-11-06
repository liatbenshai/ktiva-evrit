import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { prisma } from '@/lib/prisma';

/**
 * POST - בוט AI שיעזור להסביר מה לתקן
 * המשתמש יכול לשאול שאלות על תיקונים, דפוסים, וכו'
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      question, 
      text, 
      userId = 'default-user',
      context = '' 
    } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'שאלה נדרשת' },
        { status: 400 }
      );
    }

    // קבלת דפוסים שנלמדו
    let learnedPatterns: Array<{
      badPattern: string;
      goodPattern: string;
      confidence: number;
      occurrences: number;
    }> = [];

    try {
      learnedPatterns = await prisma.translationPattern.findMany({
        where: { 
          userId,
          confidence: { gte: 0.7 },
        },
        orderBy: { confidence: 'desc' },
        take: 20,
      });
    } catch (dbError) {
      console.error('Error fetching learned patterns:', dbError);
    }

    // יצירת prompt לבוט
    const patternsList = learnedPatterns.length > 0
      ? learnedPatterns.map(p => `- "${p.badPattern}" → "${p.goodPattern}" (ביטחון: ${Math.round(p.confidence * 100)}%, הופיע ${p.occurrences} פעמים)`)
          .join('\n')
      : 'עדיין לא נלמדו דפוסים';

    const textContext = text ? `\n\n**הטקסט שהמשתמש עובד עליו:**\n${text}` : '';
    const contextInfo = context ? `\n\n**הקשר:** ${context}` : '';

    const systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. תפקידך לעזור למשתמשים להבין מה לתקן בטקסטים שלהם, איך להשתמש בדפוסים שנלמדו, ואיך לשפר את הכתיבה שלהם.

**דפוסים שנלמדו מהמשתמש:**
${patternsList}

**עקרונות חשובים:**
- תן תשובות ברורות, מקצועיות ומועילות
- הסבר למה צריך לתקן משהו
- תן דוגמאות קונקרטיות
- אם יש דפוס רלוונטי, הצע להשתמש בו
- תן טיפים מעשיים לשיפור

**חיזוק דפוסים:**
- כשהמערכת מזהה טעות נכון, תגיב בחיוב: "נכון! זה בדיוק הדפוס שלמדנו" או "מעולה, זיהית את השגיאה הזאת"
- כשאתה מוצא טעות חוזרת, הצע להוסיף דפוס חדש: "דפוס חדש: [טעות] → [תיקון]"

**הוספת דפוסים חדשים:**
- כשאתה מוצא טעות חוזרת, הצע להוסיף אותה לרשימת הדפוסים
- ציין את הדפוס בצורה: "דפוס חדש: [טעות] → [תיקון]"
- הסבר למה זה דפוס חשוב

**סגנון תשובה:**
- תשובות קצרות וממוקדות
- שימוש בדוגמאות
- הסבר ברור
- טון מקצועי אך ידידותי
- תמיד צרף את רשימת הדפוסים שנלמדו כשאתה עונה`;

    const userPrompt = `${question}${textContext}${contextInfo}

אם השאלה קשורה לטקסט מסוים, בדוק אותו וציין מה צריך לתקן. אם יש דפוס רלוונטי מהרשימה למעלה, הצע להשתמש בו.`;

    const response = await generateText({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      answer: response,
      relevantPatterns: learnedPatterns.filter(p => 
        text && (text.includes(p.badPattern) || question.includes(p.badPattern))
      ).slice(0, 3), // 3 דפוסים רלוונטיים ביותר
    });

  } catch (error: any) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({
      success: false,
      error: 'שגיאה בתשובת הבוט',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

