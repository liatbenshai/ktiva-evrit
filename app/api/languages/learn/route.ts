import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/claude'

const SUPPORTED_LANGUAGES = {
  english: { label: 'אנגלית', targetName: 'English' },
  romanian: { label: 'רומנית', targetName: 'Romanian' },
  italian: { label: 'איטלקית', targetName: 'Italian' },
  french: { label: 'צרפתית', targetName: 'French' },
  russian: { label: 'רוסית', targetName: 'Russian' },
} as const

type SupportedLanguageKey = keyof typeof SUPPORTED_LANGUAGES

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      hebrewTerm,
      targetLanguage,
      contentType = 'word',
      userId = 'default-user',
    }: {
      hebrewTerm?: string
      targetLanguage?: SupportedLanguageKey
      contentType?: 'word' | 'sentence' | 'linking_word'
      userId?: string
    } = body

    if (!hebrewTerm || !hebrewTerm.trim()) {
      return NextResponse.json(
        { success: false, error: 'נא להזין מילה או ביטוי בעברית' },
        { status: 400 }
      )
    }

    const languageKey: SupportedLanguageKey = targetLanguage || 'english'

    if (!SUPPORTED_LANGUAGES[languageKey]) {
      return NextResponse.json(
        { success: false, error: 'השפה המבוקשת אינה נתמכת' },
        { status: 400 }
      )
    }

    const languageMeta = SUPPORTED_LANGUAGES[languageKey]

    let prompt = ''
    let systemPrompt = ''

    if (contentType === 'sentence') {
      prompt = `אתה מומחה לשפות שמדבר עברית שוטפת ועוזר לדוברי עברית ללמוד משפטים שלמים בשפה ${languageMeta.label}.

המשימה שלך: עבור המשפט הבא בעברית: "${hebrewTerm.trim()}" – תן הסבר מפורט ב-${languageMeta.targetName}, כולל:
- תרגום מדויק של המשפט
- פירוט המבנה הדקדוקי (נושא, נשוא, מושא)
- הסבר על סדר המילים והדקדוק
- דוגמאות למשפטים דומים עם מבנה זהה
- טיפים לשימוש במבנה הזה

בבקשה החזר JSON תקין בלבד במבנה הבא:
{
  "translatedTerm": "...", // תרגום מדויק של המשפט בשפה ${languageMeta.label}
  "pronunciation": "...", // הגייה של המשפט (אופציונלי)
  "usageExamples": [
    {
      "target": "...", // משפט דומה בשפה ${languageMeta.label}
      "hebrew": "..." // תרגום חופשי לעברית
    }
  ],
  "culturalNotes": "...", // הסבר על המבנה הדקדוקי, סדר המילים, וטיפים לשימוש (בעברית)
  "extraSuggestions": [
    "..." // משפטים נוספים עם מבנה דומה או מילות קישור רלוונטיות
  ]
}

הקפד שהמשפטים יהיו טבעיים ומציאותיים. צרף לפחות שלושה משפטי דוגמה עם מבנה דומה.`

      systemPrompt = `אתה מורה לשפות שמדבר עברית ומלמד דוברי עברית כיצד לבנות משפטים שלמים בשפה זרה בצורה טבעית. הקפד להסביר את המבנה הדקדוקי בעברית ברורה ופשוטה.`
    } else if (contentType === 'linking_word') {
      prompt = `אתה מומחה לשפות שמדבר עברית שוטפת ועוזר לדוברי עברית ללמוד מילות קישור בשפה ${languageMeta.label}.

המשימה שלך: עבור מילת הקישור הבאה בעברית: "${hebrewTerm.trim()}" – תן הסבר מפורט ב-${languageMeta.targetName}, כולל:
- תרגום מדויק של מילת הקישור
- הסבר על השימוש (מתי משתמשים בה)
- מילות קישור דומות או חלופיות
- דוגמאות שימוש במשפטים שלמים

בבקשה החזר JSON תקין בלבד במבנה הבא:
{
  "translatedTerm": "...", // תרגום מדויק של מילת הקישור בשפה ${languageMeta.label}
  "pronunciation": "...", // הגייה (אופציונלי)
  "usageExamples": [
    {
      "target": "...", // משפט עם מילת הקישור בשפה ${languageMeta.label}
      "hebrew": "..." // תרגום חופשי לעברית
    }
  ],
  "culturalNotes": "...", // הסבר מתי משתמשים במילת הקישור, מה ההבדל בינה לבין מילים דומות, וטיפים לשימוש (בעברית)
  "extraSuggestions": [
    "..." // מילות קישור דומות או חלופיות
  ]
}

הקפד שהמשפטים יהיו טבעיים ומציאותיים. צרף לפחות ארבעה משפטי דוגמה שמראים את השימוש במילת הקישור.`

      systemPrompt = `אתה מורה לשפות שמדבר עברית ומלמד דוברי עברית כיצד להשתמש במילות קישור בשפה זרה בצורה טבעית. הקפד להסביר מתי משתמשים בכל מילת קישור ומה ההבדל בינה לבין מילים דומות.`
    } else {
      // Default: word/phrase
      prompt = `אתה מומחה לשפות שמדבר עברית שוטפת ועוזר לדוברי עברית ללמוד מילים בשפה ${languageMeta.label}.

המשימה שלך: עבור המילה או הביטוי הבא בעברית: "${hebrewTerm.trim()}" – תן הסבר מפורט ב-${languageMeta.targetName}, כולל תרגום, הגייה, דוגמאות שימוש והסברים בעברית.

בבקשה החזר JSON תקין בלבד במבנה הבא, בלי טקסט מיותר ובלי מרכאות כפולות מיותרות:
{
  "translatedTerm": "...", // תרגום מדויק בשפה ${languageMeta.label}
  "pronunciation": "...", // הגייה בשפה ${languageMeta.label} באותיות לטיניות
  "usageExamples": [
    {
      "target": "...", // משפט בשפה ${languageMeta.label}
      "hebrew": "..." // תרגום חופשי לעברית
    }
  ],
  "culturalNotes": "...", // הערות תרבותיות/הבדלי שימוש (בעברית)
  "extraSuggestions": [
    "..." // הצעות נוספות לביטויים קשורים או מילים דומות
  ]
}

הקפד שהמשפטים יהיו טבעיים ומציאותיים. צרף לפחות שני משפטי דוגמה. אם יש ביטויים שכדאי להימנע מהם, ציין זאת בהערות.`

      systemPrompt = `אתה מורה לשפות שמדבר עברית ומלמד דוברי עברית כיצד להשתמש במילים ובביטויים בשפה זרה בצורה טבעית. הקפד להסביר בעברית ברורה ופשוטה.`
    }

    const aiResponse = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.7,
    })

    let parsed: any
    try {
      const trimmed = aiResponse.trim()
      const jsonStart = trimmed.indexOf('{')
      const jsonEnd = trimmed.lastIndexOf('}') + 1
      parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd))
    } catch (parseError) {
      console.error('Failed to parse language learn response:', aiResponse, parseError)
      return NextResponse.json(
        { success: false, error: 'נכשלה קריאת התשובה מהמודל. נסי שוב.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        hebrewTerm: hebrewTerm.trim(),
        targetLanguage: languageKey,
        translatedTerm: parsed.translatedTerm || '',
        pronunciation: parsed.pronunciation || '',
        usageExamples: Array.isArray(parsed.usageExamples) ? parsed.usageExamples : [],
        culturalNotes: parsed.culturalNotes || '',
        extraSuggestions: Array.isArray(parsed.extraSuggestions)
          ? parsed.extraSuggestions
          : parsed.extraSuggestions
          ? [parsed.extraSuggestions]
          : [],
        contentType: contentType,
        userId,
      },
    })
  } catch (error) {
    console.error('Error learning language term:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בלימוד המונח. נסי שוב מאוחר יותר.' },
      { status: 500 }
    )
  }
}
