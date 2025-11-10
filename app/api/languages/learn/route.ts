import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/claude'

const SUPPORTED_LANGUAGES = {
  english: { label: 'אנגלית', targetName: 'English' },
  romanian: { label: 'רומנית', targetName: 'Romanian' },
  italian: { label: 'איטלקית', targetName: 'Italian' },
} as const

type SupportedLanguageKey = keyof typeof SUPPORTED_LANGUAGES

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      hebrewTerm,
      targetLanguage,
      userId = 'default-user',
    }: {
      hebrewTerm?: string
      targetLanguage?: SupportedLanguageKey
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

    const prompt = `אתה מומחה לשפות שמדבר עברית שוטפת ועוזר לדוברי עברית ללמוד מילים בשפה ${languageMeta.label}.

המשימה שלך: עבור המילה או הביטוי הבא בעברית: "${hebrewTerm.trim()}" – תן הסבר מפורט באנגלית ${languageMeta.targetName}, כולל תרגום, הגייה, דוגמאות שימוש והסברים בעברית.

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

    const systemPrompt = `אתה מורה לשפות שמדבר עברית ומלמד דוברי עברית כיצד להשתמש במילים ובביטויים בשפה זרה בצורה טבעית. הקפד להסביר בעברית ברורה ופשוטה.`

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
