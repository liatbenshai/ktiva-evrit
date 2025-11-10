import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/claude'

const SUPPORTED_LANGUAGES = {
  english: { label: 'אנגלית', targetName: 'English' },
  romanian: { label: 'רומנית', targetName: 'Romanian' },
  italian: { label: 'איטלקית', targetName: 'Italian' },
} as const

type SupportedLanguageKey = keyof typeof SUPPORTED_LANGUAGES

const TOPIC_LIBRARY: Record<
  string,
  { label: string; description: string }
> = {
  'daily-conversation': {
    label: 'שיחה יומיומית',
    description: 'פתיחת שיחה, small talk, הבעת התעניינות ונימוס בסיסי',
  },
  'business-meeting': {
    label: 'פגישה עסקית',
    description: 'הצגת רעיון, התייעצות, תיאום ציפיות ובקשת משוב מקצועי',
  },
  travel: {
    label: 'טיול ונופש',
    description: 'שיחה במלון, במסעדה, בתחבורה ציבורית ובקבלת מידע בדרך',
  },
  family: {
    label: 'שיחה עם משפחה',
    description: 'שיתוף בתחושות, דאגה לקרובים, עידוד ושיחה על חיי היום-יום',
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      targetLanguage,
      topicId,
      topicLabel,
      topicDescription,
      customTopic,
    }: {
      targetLanguage?: SupportedLanguageKey
      topicId?: string
      topicLabel?: string
      topicDescription?: string
      customTopic?: string
    } = body

    const languageKey: SupportedLanguageKey = targetLanguage || 'english'

    if (!SUPPORTED_LANGUAGES[languageKey]) {
      return NextResponse.json(
        { success: false, error: 'השפה המבוקשת אינה נתמכת לערכת נושא' },
        { status: 400 }
      )
    }

    const topicInfo = (topicId && TOPIC_LIBRARY[topicId]) || null

    const displayLabel = customTopic?.trim() || topicLabel || topicInfo?.label || 'נושא מותאם אישית'
    const displayDescription = topicDescription || topicInfo?.description || ''
    const descriptionForPrompt = displayDescription || 'בחר מצבים יומיומיים רלוונטיים לנושא.'

    const languageMeta = SUPPORTED_LANGUAGES[languageKey]

    const prompt = `אתה מורה לשפות שמדבר עברית שוטפת ועוזר לדוברי עברית ללמוד ${languageMeta.label} בצורה טבעית ומדויקת.

המשימה: צור ערכת מילים בנושא "${displayLabel}" עבור ${languageMeta.label}.
הרחב בקצרה על הסיטואציות האפשריות בנושא זה: ${descriptionForPrompt}

החזר JSON תקין בלבד במבנה הבא:
{
  "summary": "...", // תיאור כללי בעברית על מתי משתמשים בביטויים
  "practiceTip": "...", // טיפ מעשי לעבודה או לתרגול
  "suggestions": [
    {
      "hebrewTerm": "...", // מילה או ביטוי בעברית
      "translatedTerm": "...", // התרגום הטבעי ל-${languageMeta.label}
      "pronunciation": "...", // הגייה באותיות לטיניות (לא חובה אם לא רלוונטי)
      "usageExample": {
        "target": "...", // משפט טבעי ב-${languageMeta.label}
        "hebrew": "..." // הסבר בעברית
      },
      "relatedWords": ["..."], // מונחים נוספים שכדאי להכיר
      "learningNote": "..." // הערת למידה קצרה בעברית
    }
  ]
}

דרישות:
- בחר לפחות 4 ולכל היותר 6 פריטים ברשימת "suggestions".
- ודא שהמשפטים ב-${languageMeta.label} נשמעים טבעיים ויומיומיים.
- הסבר בעברית קצר ופשוט.
- החזר JSON בלבד ללא טקסט נוסף.`

    const systemPrompt = `אתה יועץ לשפות שמכיר לעומק את התרבות הישראלית ואת שפת היעד ${languageMeta.label}.
הקפד לתת ביטויים שימושיים, להימנע מתרגום מילולי מדי, ולהסביר בעברית פשוטה איך ומתי להשתמש.`

    const aiResponse = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 1200,
      temperature: 0.75,
    })

    let parsed: any
    try {
      const trimmed = aiResponse.trim()
      const jsonStart = trimmed.indexOf('{')
      const jsonEnd = trimmed.lastIndexOf('}') + 1
      parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd))
    } catch (parseError) {
      console.error('Failed to parse topic vocabulary response:', aiResponse, parseError)
      return NextResponse.json(
        { success: false, error: 'לא הצלחתי לקרוא את ערכת הנושא. נסי שוב.' },
        { status: 500 }
      )
    }

    const suggestionsArray = Array.isArray(parsed?.suggestions) ? parsed.suggestions : []

    const sanitizedSuggestions = suggestionsArray
      .map((suggestion: any) => {
        if (!suggestion) return null
        const usageExample = suggestion.usageExample && typeof suggestion.usageExample === 'object'
          ? {
              target: suggestion.usageExample.target || '',
              hebrew: suggestion.usageExample.hebrew || '',
            }
          : undefined

        return {
          hebrewTerm: suggestion.hebrewTerm || '',
          translatedTerm: suggestion.translatedTerm || '',
          pronunciation: suggestion.pronunciation || '',
          usageExample,
          relatedWords: Array.isArray(suggestion.relatedWords) ? suggestion.relatedWords : [],
          learningNote: suggestion.learningNote || '',
        }
      })
      .filter((item: any) => item && item.hebrewTerm && item.translatedTerm)

    return NextResponse.json({
      success: true,
      data: {
        topicId: topicId || (customTopic ? 'custom' : 'unknown'),
        topicLabel: displayLabel,
        targetLanguage: languageKey,
        summary: parsed?.summary || '',
        practiceTip: parsed?.practiceTip || '',
        suggestions: sanitizedSuggestions,
      },
    })
  } catch (error) {
    console.error('Error generating topic vocabulary pack:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה ביצירת ערכת נושא. נסי שוב מאוחר יותר.' },
      { status: 500 }
    )
  }
}
