'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Languages as LanguagesIcon,
  Sparkles,
  Loader2,
  BookmarkCheck,
  RefreshCw,
  BookOpen,
  Globe2,
  Home,
} from 'lucide-react'

type SupportedLanguageKey = 'english' | 'romanian' | 'italian'

const SUPPORTED_LANGUAGES: Record<SupportedLanguageKey, { label: string; description: string }> = {
  english: { label: 'אנגלית', description: 'שימוש יומיומי, שפה עסקית וחברתית' },
  romanian: { label: 'רומנית', description: 'לימוד ביטויים יומיומיים וקשר עם קהילה דוברת רומנית' },
  italian: { label: 'איטלקית', description: 'שפה עשירה לביטויים תרבותיים ואוהבי קולינריה' },
}

const SPEECH_LANG_MAP: Record<SupportedLanguageKey, string> = {
  english: 'en-US',
  romanian: 'ro-RO',
  italian: 'it-IT',
}

interface UsageExample {
  target: string
  hebrew: string
}

interface LearnResult {
  hebrewTerm: string
  targetLanguage: SupportedLanguageKey
  translatedTerm: string
  pronunciation: string
  usageExamples: UsageExample[]
  culturalNotes: string
  extraSuggestions: string[]
}

interface SavedEntry extends LearnResult {
  id: string
  createdAt: string
  updatedAt: string
}

export default function LanguagesPage() {
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguageKey>('english')
  const [hebrewTerm, setHebrewTerm] = useState('')
  const [result, setResult] = useState<LearnResult | null>(null)
  const [history, setHistory] = useState<SavedEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [spokenText, setSpokenText] = useState<string | null>(null)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)

  const disableActions = useMemo(() => !hebrewTerm.trim() || isLoading, [hebrewTerm, isLoading])

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSpeechSupported(true)
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        if (availableVoices.length > 0) {
          setVoices(availableVoices)
        }
      }

      loadVoices()
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/languages/entries', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('נכשלה טעינת המונחים שנשמרו')
        }
        const data = await response.json()
        if (data.entries) {
          setHistory(data.entries)
        }
      } catch (error) {
        console.error('Failed to fetch language entries', error)
      }
    }

    fetchHistory()
  }, [])

  const handleLearn = async () => {
    if (!hebrewTerm.trim()) return

    try {
      setIsLoading(true)
      setResult(null)
      setFeedback(null)

      const response = await fetch('/api/languages/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hebrewTerm, targetLanguage }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'נכשלה למידת המונח')
      }

      setResult(data.data as LearnResult)
    } catch (error) {
      console.error('Failed to learn language term', error)
      setFeedback(error instanceof Error ? error.message : 'שגיאה בלמידת המונח')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result) return

    try {
      setIsSaving(true)
      setFeedback(null)

      const response = await fetch('/api/languages/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hebrewTerm: result.hebrewTerm,
          targetLanguage: result.targetLanguage,
          translatedTerm: result.translatedTerm,
          pronunciation: result.pronunciation,
          usageExamples: result.usageExamples,
          culturalNotes: result.culturalNotes,
          extraSuggestions: result.extraSuggestions,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'שגיאה בשמירת המונח')
      }

      setFeedback('המונח נוסף ללמידה שלך 💜')
      setHistory((prev) => [{ ...result, id: data.entry.id, createdAt: data.entry.createdAt, updatedAt: data.entry.updatedAt }, ...prev])
    } catch (error) {
      console.error('Failed to save language entry', error)
      setFeedback(error instanceof Error ? error.message : 'שגיאה בשמירת המונח')
    } finally {
      setIsSaving(false)
    }
  }

  const getCurrentLanguageMeta = SUPPORTED_LANGUAGES[targetLanguage]

  const getVoiceForLanguage = (lang: SupportedLanguageKey) => {
    if (!voices.length) return null
    const langCode = SPEECH_LANG_MAP[lang]
    return (
      voices.find((voice) => voice.lang === langCode) ||
      voices.find((voice) => voice.lang.startsWith(langCode.split('-')[0])) ||
      null
    )
  }

  const speak = (text: string, lang: SupportedLanguageKey) => {
    const trimmedText = text.trim()
    if (!trimmedText) return

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      if (spokenText === trimmedText) {
        setSpokenText(null)
        return
      }
    }

    const voice = getVoiceForLanguage(lang)
    if (!voice) {
      setFeedback('הדפדפן לא מצא קול מתאים לשפה הזו. נסי להגדיר חבילת שפה במערכת ההפעלה שלך.')
      return
    }

    const utterance = new SpeechSynthesisUtterance(trimmedText)
    utterance.voice = voice
    utterance.lang = voice.lang
    utterance.onend = () => setSpokenText(null)
    utterance.onerror = () => setSpokenText(null)

    setSpokenText(trimmedText)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50" dir="rtl">
      <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 sm:text-sm">
              <Sparkles className="h-4 w-4" /> לימוד שפות מותאם לדוברי עברית
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              גשר בין עברית לאנגלית, רומנית ואיטלקית
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              הזיני ביטוי בעברית, בחרי שפה רצויה וקבלי תרגום טבעי, הגייה ודוגמאות שימוש. את המונחים שתשמרי נגיש לך בכל כלי הכתיבה.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Home className="h-4 w-4" /> דשבורד הבית
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-indigo-700">
                <LanguagesIcon className="h-5 w-5" />
                בחרי שפה ללמידה
              </h2>
              <p className="text-sm text-slate-600">בחרי אחת מהשפות הנתמכות והזיני מונח בעברית שתרצי ללמוד. המערכת תציע ניסוח טבעי ודוגמאות.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600">
              <Globe2 className="h-4 w-4" /> שפת הבסיס: עברית
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguageKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setTargetLanguage(key)}
                className={`rounded-2xl border px-4 py-4 text-right transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  targetLanguage === key
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                <div className="text-sm font-semibold">{SUPPORTED_LANGUAGES[key].label}</div>
                <p className="mt-1 text-xs text-slate-500">{SUPPORTED_LANGUAGES[key].description}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-slate-700">ביטוי בעברית שתרצי ללמוד בשפה {getCurrentLanguageMeta.label}</label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={hebrewTerm}
                onChange={(e) => setHebrewTerm(e.target.value)}
                placeholder="לדוגמה: מה שלומך?"
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={handleLearn}
                disabled={disableActions}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                למד מונח
              </button>
            </div>
            <p className="text-xs text-slate-500">טיפ: אפשר להזין גם ביטויים שלמים או משפטי פתיחה/סיום.</p>
          </div>

          {feedback && (
            <div className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-600">{feedback}</div>
          )}
        </section>

        {result && (
          <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-indigo-700">התרגום שלך</h3>
                  <p className="text-sm text-slate-500">עברית → {getCurrentLanguageMeta.label}</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkCheck className="h-4 w-4" />}
                  שמרי ללמידה
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-700">
                  <div className="text-xs uppercase text-indigo-400">ביטוי בעברית</div>
                  <div className="text-lg font-semibold">{result.hebrewTerm}</div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-inner">
                  <div className="text-xs uppercase text-slate-400">תרגום</div>
                  <div className="text-xl font-bold text-slate-900">{result.translatedTerm}</div>
                  {result.pronunciation && (
                    <p className="mt-1 text-sm text-slate-500">הגייה: {result.pronunciation}</p>
                  )}
                  {isSpeechSupported && (
                    <button
                      onClick={() => speak(result.translatedTerm, result.targetLanguage)}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      {spokenText === result.translatedTerm ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LanguagesIcon className="h-3.5 w-3.5" />}
                      השמעה
                    </button>
                  )}
                </div>
                {result.culturalNotes && (
                  <div className="rounded-2xl bg-purple-50 px-4 py-3 text-sm text-purple-600">
                    <strong className="block text-purple-500">הערות שימוש</strong>
                    {result.culturalNotes}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
              <h4 className="flex items-center gap-2 text-base font-semibold text-indigo-700">
                <BookOpen className="h-4 w-4" /> דוגמאות שימוש
              </h4>
              <div className="mt-4 space-y-3 text-sm">
                {result.usageExamples.map((example, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <p className="font-semibold text-slate-700" dir="ltr">{example.target}</p>
                    <p className="mt-1 text-xs text-slate-500">{example.hebrew}</p>
                    {isSpeechSupported && (
                      <button
                        onClick={() => speak(example.target, result.targetLanguage)}
                        className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 px-2.5 py-1 text-[11px] font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <LanguagesIcon className="h-3 w-3" />
                        השמע
                      </button>
                    )}
                  </div>
                ))}
                {result.extraSuggestions.length > 0 && (
                  <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-600">
                    <strong className="block text-indigo-500">עוד מילים שכדאי להכיר:</strong>
                    <ul className="mt-1 list-disc pl-5 text-xs">
                      {result.extraSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-indigo-700">מונחים שנשמרו</h3>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {history.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between text-xs uppercase text-slate-400">
                    <span>{SUPPORTED_LANGUAGES[entry.targetLanguage].label}</span>
                    <span>{new Date(entry.updatedAt).toLocaleDateString('he-IL')}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{entry.hebrewTerm}</div>
                  <div className="text-lg font-semibold text-slate-900" dir="ltr">{entry.translatedTerm}</div>
                  {entry.pronunciation && (
                    <p className="text-xs text-slate-500">הגייה: {entry.pronunciation}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
