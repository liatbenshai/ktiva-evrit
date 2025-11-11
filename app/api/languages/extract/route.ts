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
      text,
      targetLanguage,
      maxTerms = 5,
    }: {
      text?: string
      targetLanguage?: SupportedLanguageKey
      maxTerms?: number
    } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'נא לספק טקסט בעברית שממנו אפשר ללמוד' },
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
    const sanitizedText = text.trim().slice(0, 3000)
    const limitedTerms = Math.min(Math.max(3, Math.floor(maxTerms)), 7)

    const prompt = `אתה מורה לשפות שמדבר עברית ועוזר לדוברי עברית ללמוד ${languageMeta.label}.

הטקסט המקורי בעברית:
"""
${sanitizedText}
"""

משימה: הפק עד ${limitedTerms} ביטויים או מילים חשובות מתוך הטקסט הזה. חפש מילים שמסייעות להבנה, ביטויים נפוצים, שאלות שימושיות או תגובות.

החזר JSON תקין בלבד במבנה הבא:
{
  "summary": "...", // סיכום קצר בעברית של התוכן המרכזי והדגשים
  "practiceTip": "...", // טיפ תרגול קצר בעברית
  "suggestions": [
    {
      "hebrewTerm": "...", // המילה או הביטוי בעברית כפי שמופיע בטקסט
      "translatedTerm": "...", // תרגום טבעי לשפה ${languageMeta.label}
      "pronunciation": "...", // הגייה באותיות לטיניות (אם רלוונטי)
      "usageExample": {
        "target": "...", // משפט ב-${languageMeta.label} שמשתמש במילה או בביטוי
        "hebrew": "..." // הסבר/תרגום חופשי לעברית
      },
      "relatedWords": ["..."], // מילים קשורות באותה שפה (עד 4)
      "learningNote": "..." // הערת למידה בעברית (מתי ומדוע משתמשים)
    }
  ]
}

הקפד שהמשפטים ב-${languageMeta.label} יהיו טבעיים ובגובה העיניים. הקפד להחזיר JSON בלבד.`

    const systemPrompt = `אתה מורה לשפות שמזהה במהירות ביטויים חשובים מתוך טקסטים בעברית ומסביר כיצד לתרגל אותם בשפה ${languageMeta.label}.`

    const aiResponse = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 1200,
      temperature: 0.7,
    })

    let parsed: any
    try {
      const trimmed = aiResponse.trim()
      const jsonStart = trimmed.indexOf('{')
      const jsonEnd = trimmed.lastIndexOf('}') + 1
      parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd))
    } catch (parseError) {
      console.error('Failed to parse extracted vocabulary response:', aiResponse, parseError)
      return NextResponse.json(
        { success: false, error: 'לא הצלחתי לקרוא את תוצאות ההפקה. נסי שוב.' },
        { status: 500 }
      )
    }

    const ensureString = (value: unknown) => (typeof value === 'string' ? value : '')

    const suggestionsArray = Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
      : Array.isArray(parsed)
      ? parsed
      : []

    const sanitizedSuggestions = suggestionsArray
      .map((suggestion: any) => {
        if (!suggestion || typeof suggestion !== 'object') return null

        const hebrewTerm = ensureString(
          suggestion.hebrewTerm || suggestion.source || suggestion.original || suggestion.badPattern
        )

        const translatedTerm = ensureString(
          suggestion.translatedTerm ||
            suggestion.translation ||
            suggestion.target ||
            suggestion.goodPattern ||
            suggestion.term
        )

        const pronunciation = ensureString(suggestion.pronunciation || suggestion.pronounce)

        const usageExampleRaw = suggestion.usageExample || suggestion.example || suggestion.examples?.[0]
        const usageExample =
          usageExampleRaw && typeof usageExampleRaw === 'object'
            ? {
                target: ensureString(usageExampleRaw.target || usageExampleRaw.targetLanguage || usageExampleRaw.translation),
                hebrew: ensureString(usageExampleRaw.hebrew || usageExampleRaw.explanation || usageExampleRaw.comment),
              }
            : undefined

        const relatedSource = suggestion.relatedWords || suggestion.related || suggestion.alternatives
        const relatedWords = Array.isArray(relatedSource)
          ? relatedSource.map((item) => ensureString(item)).filter(Boolean)
          : []

        const learningNote = ensureString(
          suggestion.learningNote || suggestion.note || suggestion.tips || suggestion.context
        )

        if (!hebrewTerm || !translatedTerm) {
          return null
        }

        return {
          hebrewTerm,
          translatedTerm,
          pronunciation,
          usageExample,
          relatedWords,
          learningNote,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        topicId: 'from-text',
        topicLabel: 'לימוד מתוך טקסט קיים',
        targetLanguage: languageKey,
        summary: parsed?.summary || '',
        practiceTip: parsed?.practiceTip || '',
        suggestions: sanitizedSuggestions,
      },
    })
  } catch (error) {
    console.error('Error extracting vocabulary from text:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בהפקת המילים מהטקסט. נסי שוב מאוחר יותר.' },
      { status: 500 }
    )
  }
}
