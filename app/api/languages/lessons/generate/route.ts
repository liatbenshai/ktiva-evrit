import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/ai/claude';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface GeneratedVocabulary {
  hebrew: string;
  translated: string;
  pronunciation?: string;
  usageExample?: string;
  isSentence?: boolean;
}

interface GeneratedLesson {
  title: string;
  description: string;
  vocabulary: GeneratedVocabulary[];
  sentences?: GeneratedVocabulary[];
  grammarNotes?: string;
  culturalTips?: string;
}

/**
 * POST - יצירת שיעור חדש אוטומטית באמצעות AI
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetLanguage,
      level,
      topic,
      userId = 'default-user',
      vocabularyCount = 15,
      includeSentences = true,
    } = body;

    if (!targetLanguage || !level || !topic) {
      return NextResponse.json(
        { success: false, error: 'targetLanguage, level, and topic are required' },
        { status: 400 }
      );
    }

    const supportedLanguages: SupportedLanguageKey[] = ['english', 'romanian', 'italian', 'french', 'russian'];
    const supportedLevels: LanguageLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

    if (!supportedLanguages.includes(targetLanguage as SupportedLanguageKey)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported target language' },
        { status: 400 }
      );
    }

    if (!supportedLevels.includes(level as LanguageLevel)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported level' },
        { status: 400 }
      );
    }

    // בדיקה אם שיעור דומה כבר קיים
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        targetLanguage,
        level,
        topic,
        isPublished: true,
      },
    });

    if (existingLesson) {
      return NextResponse.json(
        {
          success: false,
          error: 'שיעור דומה כבר קיים. נא לבחור נושא אחר או רמה אחרת.',
          existingLessonId: existingLesson.id,
        },
        { status: 409 }
      );
    }

    // קביעת שמות השפות
    const languageNames: Record<SupportedLanguageKey, string> = {
      english: 'אנגלית',
      romanian: 'רומנית',
      italian: 'איטלקית',
      french: 'צרפתית',
      russian: 'רוסית',
    };

    const levelNames: Record<LanguageLevel, string> = {
      BEGINNER: 'מתחיל',
      INTERMEDIATE: 'בינוני',
      ADVANCED: 'מתקדם',
    };

    // יצירת שיעור באמצעות AI
    const systemPrompt = `אתה מורה מקצועי לשפות. תפקידך ליצור שיעורי שפה מקצועיים ומפורטים.

הנחיות חשובות:
1. צור שיעור מותאם לרמה שצוינה
2. כלול אוצר מילים רלוונטי לנושא
3. הוסף משפטים לדוגמה
4. כלול הערות דקדוקיות אם רלוונטי
5. הוסף טיפים תרבותיים
6. ודא שהתרגומים מדויקים
7. הוסף הגייה (phonetic) לכל מילה

פורמט התשובה חייב להיות JSON בלבד.`;

    const prompt = `צור שיעור לימוד שפה מקצועי עם הפרטים הבאים:

שפה: ${languageNames[targetLanguage as SupportedLanguageKey]} (${targetLanguage})
רמה: ${levelNames[level as LanguageLevel]} (${level})
נושא: ${topic}
מספר מילים: ${vocabularyCount}

צור שיעור מלא עם:
1. כותרת מתאימה
2. תיאור קצר
3. אוצר מילים (${vocabularyCount} מילים) - כל מילה עם:
   - המילה בעברית
   - התרגום בשפה המטרה
   - הגייה (phonetic)
   - דוגמת שימוש (אופציונלי)
4. משפטים לדוגמה (3-5 משפטים) - כל משפט עם:
   - המשפט בעברית
   - התרגום בשפה המטרה
5. הערות דקדוקיות (אם רלוונטי)
6. טיפים תרבותיים (אם רלוונטי)

השתמש בפורמט JSON הבא:
{
  "title": "כותרת השיעור",
  "description": "תיאור קצר של השיעור",
  "vocabulary": [
    {
      "hebrew": "מילה בעברית",
      "translated": "תרגום בשפה המטרה",
      "pronunciation": "הגייה (phonetic)",
      "usageExample": "דוגמת שימוש (אופציונלי)"
    }
  ],
  "sentences": [
    {
      "hebrew": "משפט בעברית",
      "translated": "תרגום בשפה המטרה",
      "isSentence": true
    }
  ],
  "grammarNotes": "הערות דקדוקיות (אופציונלי)",
  "culturalTips": "טיפים תרבותיים (אופציונלי)"
}

**חשוב מאוד:** החזר רק את אובייקט ה-JSON בלבד, ללא markdown, ללא backticks, ללא טקסט הסבר. 
התשובה שלך צריכה להתחיל ב-{ ולהסתיים ב-}`;

    console.log(`🤖 Generating lesson for ${targetLanguage}, level ${level}, topic: ${topic}`);

    const aiResponse = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
    });

    // פרסור התשובה
    let lessonData: GeneratedLesson;
    try {
      let cleanedText = aiResponse.trim();
      if (cleanedText.startsWith('```')) {
        const lines = cleanedText.split('\n');
        const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
        const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().startsWith('```'));
        if (startIndex !== -1 && endIndex !== -1) {
          cleanedText = lines.slice(startIndex + 1, endIndex).join('\n');
        }
      }
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }
      lessonData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        {
          success: false,
          error: 'שגיאה בפרסור התשובה מה-AI. נסה שוב.',
          details: process.env.NODE_ENV === 'development' ? (parseError as Error).message : undefined,
        },
        { status: 500 }
      );
    }

    // יצירת השיעור במסד הנתונים
    const lesson = await prisma.lesson.create({
      data: {
        targetLanguage,
        level,
        topic,
        title: lessonData.title,
        description: lessonData.description || '',
        duration: Math.ceil((lessonData.vocabulary.length * 1 + (lessonData.sentences?.length || 0) * 1.5) + 5), // 1 דקה למילה, 1.5 למשפט, +5 דקות בסיס
        grammarNotes: lessonData.grammarNotes || null,
        culturalTips: lessonData.culturalTips || null,
        order: 1, // ניתן לשפר - לבדוק מה הסדר האחרון
        isPublished: true,
      },
    });

    // הוספת אוצר מילים
    let vocabOrder = 1;
    for (const vocab of lessonData.vocabulary) {
      await prisma.lessonVocabulary.create({
        data: {
          lessonId: lesson.id,
          hebrewTerm: vocab.hebrew,
          translatedTerm: vocab.translated,
          pronunciation: vocab.pronunciation || null,
          usageExample: vocab.usageExample ? JSON.stringify({ hebrew: vocab.usageExample, target: vocab.translated }) : null,
          difficulty: level === 'BEGINNER' ? 'EASY' : level === 'INTERMEDIATE' ? 'MEDIUM' : 'HARD',
          order: vocabOrder++,
          isSentence: false,
        },
      });
    }

    // הוספת משפטים
    if (includeSentences && lessonData.sentences) {
      for (const sentence of lessonData.sentences) {
        await prisma.lessonVocabulary.create({
          data: {
            lessonId: lesson.id,
            hebrewTerm: sentence.hebrew,
            translatedTerm: sentence.translated,
            pronunciation: null,
            usageExample: JSON.stringify({ hebrew: sentence.hebrew, target: sentence.translated }),
            difficulty: level === 'BEGINNER' ? 'EASY' : level === 'INTERMEDIATE' ? 'MEDIUM' : 'HARD',
            order: vocabOrder++,
            isSentence: true,
          },
        });
      }
    }

    // יצירת תרגילים בסיסיים (אופציונלי - ניתן להרחיב)
    // TODO: ניתן להוסיף יצירת תרגילים אוטומטית

    console.log(`✅ Lesson created successfully: ${lesson.id}`);

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        topic: lesson.topic,
        level: lesson.level,
        targetLanguage: lesson.targetLanguage,
        vocabularyCount: lessonData.vocabulary.length,
        sentencesCount: lessonData.sentences?.length || 0,
        duration: lesson.duration,
      },
      message: `שיעור "${lesson.title}" נוצר בהצלחה!`,
    });
  } catch (error: any) {
    console.error('Error generating lesson:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה ביצירת השיעור',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - רשימת נושאים מומלצים ליצירת שיעורים
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetLanguage = searchParams.get('targetLanguage') as SupportedLanguageKey | null;
    const level = searchParams.get('level') as LanguageLevel | null;

    // נושאים מומלצים לפי רמה
    const topicsByLevel: Record<LanguageLevel, string[]> = {
      BEGINNER: [
        'היכרות',
        'אוכל',
        'בית',
        'משפחה',
        'צבעים',
        'מספרים',
        'ימים בשבוע',
        'חיות',
        'בגדים',
        'גוף האדם',
      ],
      INTERMEDIATE: [
        'עבודה',
        'נסיעות',
        'בריאות',
        'פעלים',
        'תארים',
        'רגשות',
        'קניות',
        'בישול',
        'ספורט',
        'תחבורה',
      ],
      ADVANCED: [
        'מדע',
        'טבע',
        'טכנולוגיה',
        'תרבות',
        'פוליטיקה',
        'כלכלה',
        'אמנות',
        'ספרות',
        'פילוסופיה',
        'היסטוריה',
      ],
    };

    // נושאים שכבר קיימים
    let existingTopics: string[] = [];
    if (targetLanguage && level) {
      const existingLessons = await prisma.lesson.findMany({
        where: {
          targetLanguage,
          level,
          isPublished: true,
        },
        select: {
          topic: true,
        },
        distinct: ['topic'],
      });
      existingTopics = existingLessons.map((l) => l.topic);
    }

    const recommendedTopics = level
      ? topicsByLevel[level].filter((topic) => !existingTopics.includes(topic))
      : Object.values(topicsByLevel).flat();

    return NextResponse.json({
      success: true,
      recommendedTopics,
      existingTopics,
      topicsByLevel,
    });
  } catch (error: any) {
    console.error('Error getting recommended topics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בקבלת נושאים מומלצים',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

