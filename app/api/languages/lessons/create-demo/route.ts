import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Creates a demo lesson for testing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetLanguage = 'english', level = 'BEGINNER', topic = 'היכרות' } = body;

    // Check if demo lesson already exists
    const existing = await prisma.lesson.findFirst({
      where: {
        targetLanguage,
        level,
        topic,
        title: { contains: 'דוגמה' },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'שיעור דוגמה כבר קיים',
        lesson: existing,
      });
    }

    // Create demo lesson
    const lesson = await prisma.lesson.create({
      data: {
        targetLanguage,
        level,
        topic,
        title: 'שיעור דוגמה - היכרות בסיסית',
        description: 'שיעור זה נוצר כדוגמה. תוכלי ללמוד מילים בסיסיות להכרות.',
        duration: 15,
        objectives: JSON.stringify(['ללמוד ברכות בסיסיות', 'להבין איך להציג את עצמך']),
        grammarNotes: '<p>בשיעור זה נלמד ברכות בסיסיות והצגה עצמית.</p>',
        culturalTips: 'בתרבויות שונות, ברכות יכולות להיות שונות. חשוב לכבד את המנהגים המקומיים.',
        order: 1,
        isPublished: true,
        vocabulary: {
          create: [
            {
              hebrewTerm: 'שלום',
              translatedTerm: targetLanguage === 'english' ? 'Hello' : targetLanguage === 'romanian' ? 'Salut' : 'Ciao',
              pronunciation: targetLanguage === 'english' ? 'heh-LOH' : targetLanguage === 'romanian' ? 'sa-LOOT' : 'CHAO',
              difficulty: 'EASY',
              partOfSpeech: 'NOUN',
              order: 1,
              usageExample: JSON.stringify({
                target: targetLanguage === 'english' ? 'Hello, how are you?' : targetLanguage === 'romanian' ? 'Salut, ce mai faci?' : 'Ciao, come stai?',
                hebrew: 'שלום, מה שלומך?',
              }),
            },
            {
              hebrewTerm: 'מה שלומך?',
              translatedTerm: targetLanguage === 'english' ? 'How are you?' : targetLanguage === 'romanian' ? 'Ce mai faci?' : 'Come stai?',
              pronunciation: targetLanguage === 'english' ? 'how ar YOO' : targetLanguage === 'romanian' ? 'cheh mai FAH-chee' : 'KOH-meh STAH-ee',
              difficulty: 'EASY',
              partOfSpeech: 'OTHER',
              order: 2,
              usageExample: JSON.stringify({
                target: targetLanguage === 'english' ? 'Hello, how are you today?' : targetLanguage === 'romanian' ? 'Salut, ce mai faci astăzi?' : 'Ciao, come stai oggi?',
                hebrew: 'שלום, מה שלומך היום?',
              }),
            },
            {
              hebrewTerm: 'תודה',
              translatedTerm: targetLanguage === 'english' ? 'Thank you' : targetLanguage === 'romanian' ? 'Mulțumesc' : 'Grazie',
              pronunciation: targetLanguage === 'english' ? 'THANK yoo' : targetLanguage === 'romanian' ? 'mool-tsoo-MESK' : 'GRAH-tsee-eh',
              difficulty: 'EASY',
              partOfSpeech: 'OTHER',
              order: 3,
            },
          ],
        },
        exercises: {
          create: [
            {
              type: 'MATCHING',
              title: 'התאם את המילה',
              instructions: 'בחרי את התרגום הנכון למילה "שלום"',
              question: 'מה התרגום של "שלום"?',
              correctAnswer: targetLanguage === 'english' ? 'Hello' : targetLanguage === 'romanian' ? 'Salut' : 'Ciao',
              points: 10,
              order: 1,
              options: {
                create: [
                  {
                    text: targetLanguage === 'english' ? 'Hello' : targetLanguage === 'romanian' ? 'Salut' : 'Ciao',
                    isCorrect: true,
                    explanation: 'נכון! "שלום" מתרגם ל-' + (targetLanguage === 'english' ? 'Hello' : targetLanguage === 'romanian' ? 'Salut' : 'Ciao'),
                    order: 1,
                  },
                  {
                    text: targetLanguage === 'english' ? 'Goodbye' : targetLanguage === 'romanian' ? 'La revedere' : 'Arrivederci',
                    isCorrect: false,
                    explanation: 'זה אומר "להתראות", לא "שלום"',
                    order: 2,
                  },
                  {
                    text: targetLanguage === 'english' ? 'Please' : targetLanguage === 'romanian' ? 'Te rog' : 'Per favore',
                    isCorrect: false,
                    explanation: 'זה אומר "בבקשה", לא "שלום"',
                    order: 3,
                  },
                ],
              },
            },
            {
              type: 'FILL_BLANK',
              title: 'השלמי את המשפט',
              instructions: 'השלמי את המשפט הנכון',
              question: `When meeting someone, you say "[BLANK]"`,
              correctAnswer: targetLanguage === 'english' ? 'Hello' : targetLanguage === 'romanian' ? 'Salut' : 'Ciao',
              points: 10,
              order: 2,
            },
          ],
        },
      },
      include: {
        vocabulary: true,
        exercises: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'שיעור דוגמה נוצר בהצלחה',
      lesson,
    });
  } catch (error: any) {
    console.error('Error creating demo lesson:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה ביצירת שיעור דוגמה',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

