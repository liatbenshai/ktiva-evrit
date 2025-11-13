'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
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
  ListChecks,
  Trophy,
  GraduationCap,
} from 'lucide-react'
import StructuredLessons from '@/components/languages/StructuredLessons'

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian'

interface LanguageMeta {
  label: string
  description: string
}

const SUPPORTED_LANGUAGES: Record<SupportedLanguageKey, LanguageMeta> = {
  english: {
    label: 'אנגלית',
    description: 'דיבור יום-יומי, פגישות עסקיות ומיילים רשמיים',
  },
  romanian: {
    label: 'רומנית',
    description: 'שיחות יומיומיות, ביקור בארץ, דיבור עם משפחה',
  },
  italian: {
    label: 'איטלקית',
    description: 'שיחות יומיומיות, תרבות, לימודים ועבודה',
  },
  french: {
    label: 'צרפתית',
    description: 'שיחות יומיומיות, תרבות, עסקים ולימודים',
  },
  russian: {
    label: 'רוסית',
    description: 'שיחות יומיומיות, תרבות, עסקים ולימודים',
  },
}

const SPEECH_LANG_MAP: Record<SupportedLanguageKey, string> = {
  english: 'en-US',
  romanian: 'ro-RO',
  italian: 'it-IT',
  french: 'fr-FR',
  russian: 'ru-RU',
}

const FALLBACK_LANG_CODES = ['it', 'en', 'fr', 'es', 'ru']

interface UsageExample {
  target: string
  hebrew: string
}

interface LearnResult {
  hebrewTerm: string
  targetLanguage: SupportedLanguageKey
  translatedTerm: string
  pronunciation?: string
  usageExamples: UsageExample[]
  culturalNotes: string
  extraSuggestions: string[]
}

interface SavedEntry extends LearnResult {
  id: string
  createdAt: string
  updatedAt: string
}

interface QuizQuestion {
  hebrewTerm: string
  correctTranslation: string
  options: string[]
}

interface QuizState {
  questions: QuizQuestion[]
  currentIndex: number
  score: number
  finished: boolean
  answers: Array<{ selected: string; correct: string; wasCorrect: boolean }>
  selectedOption: string | null
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

type TabType = 'free' | 'structured';

export default function LanguagesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('free');
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
  const [voiceOverrides, setVoiceOverrides] = useState<Partial<Record<SupportedLanguageKey, string>>>({})
  const [quizTargetLanguage, setQuizTargetLanguage] = useState<SupportedLanguageKey>('english')
  const [quizState, setQuizState] = useState<QuizState | null>(null)

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

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/languages/entries', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('נכשלה טעינת המונחים שנשמרו')
      }
      const data = await response.json()
      if (data.entries) {
        setHistory(data.entries)
        const hasCurrentLanguage = data.entries.some(
          (entry: SavedEntry) => entry.targetLanguage === quizTargetLanguage
        )
        if (!hasCurrentLanguage && data.entries.length > 0) {
          setQuizTargetLanguage(data.entries[0].targetLanguage)
        }
      }
    } catch (error) {
      console.error('Failed to fetch language entries', error)
    }
  }, [quizTargetLanguage])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

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
      await fetchHistory()
    } catch (error) {
      console.error('Failed to save language entry', error)
      setFeedback(error instanceof Error ? error.message : 'שגיאה בשמירת המונח')
    } finally {
      setIsSaving(false)
    }
  }

  const buildQuizQuestions = useCallback((entries: SavedEntry[]) => {
    const pool = shuffleArray(entries)
    const questionCount = Math.min(5, pool.length)
    return pool.slice(0, questionCount).map((entry) => {
      const distractors = shuffleArray(entries.filter((candidate) => candidate.id !== entry.id)).slice(0, 2)
      const options = shuffleArray([
        entry.translatedTerm,
        ...distractors.map((candidate) => candidate.translatedTerm),
      ])
      return {
        hebrewTerm: entry.hebrewTerm,
        correctTranslation: entry.translatedTerm,
        options,
      }
    })
  }, [])

  const startQuiz = useCallback(() => {
    const eligible = history.filter((entry) => entry.targetLanguage === quizTargetLanguage)
    if (eligible.length < 3) {
      setFeedback('כדי להתחיל בוחן מהיר צריך לפחות 3 מונחים שמורים בשפה הזו.')
      return
    }
    const questions = buildQuizQuestions(eligible)
    if (questions.length === 0) {
      setFeedback('אין מספיק מונחים עבור השפה שנבחרה כדי לייצר בוחן.')
      return
    }
    setQuizState({
      questions,
      currentIndex: 0,
      score: 0,
      finished: false,
      answers: [],
      selectedOption: null,
    })
  }, [buildQuizQuestions, history, quizTargetLanguage])

  const selectQuizOption = useCallback((option: string) => {
    setQuizState((prev) => {
      if (!prev || prev.finished) {
        return prev
      }
      return { ...prev, selectedOption: option }
    })
  }, [])

  const submitQuizAnswer = useCallback(() => {
    setQuizState((prev) => {
      if (!prev || prev.finished || !prev.selectedOption) {
        return prev
      }
      const question = prev.questions[prev.currentIndex]
      const wasCorrect = prev.selectedOption === question.correctTranslation
      const updatedAnswers = [
        ...prev.answers,
        {
          selected: prev.selectedOption,
          correct: question.correctTranslation,
          wasCorrect,
        },
      ]
      const isLastQuestion = prev.currentIndex >= prev.questions.length - 1
      return {
        questions: prev.questions,
        currentIndex: isLastQuestion ? prev.currentIndex : prev.currentIndex + 1,
        score: prev.score + (wasCorrect ? 1 : 0),
        finished: isLastQuestion,
        answers: updatedAnswers,
        selectedOption: null,
      }
    })
  }, [])

  const resetQuiz = useCallback(() => {
    setQuizState(null)
  }, [])

  const getCurrentLanguageMeta = SUPPORTED_LANGUAGES[targetLanguage]
  const availableQuizLanguages = useMemo<SupportedLanguageKey[]>(() => {
    const unique = new Set<SupportedLanguageKey>()
    history.forEach((entry) => unique.add(entry.targetLanguage))
    return Array.from(unique)
  }, [history])

  useEffect(() => {
    if (availableQuizLanguages.includes(targetLanguage)) {
      setQuizTargetLanguage(targetLanguage)
    }
  }, [availableQuizLanguages, targetLanguage])

  const activeQuizQuestion = useMemo(() => {
    if (!quizState || quizState.finished) {
      return null
    }
    return quizState.questions[quizState.currentIndex]
  }, [quizState])

  const quizProgress = useMemo(() => {
    if (!quizState) return 0
    if (quizState.questions.length === 0) return 0
    return Math.round((quizState.answers.length / quizState.questions.length) * 100)
  }, [quizState])

  const findBestVoice = useCallback(
    (lang: SupportedLanguageKey) => {
      if (!voices.length) return null

      const langCode = SPEECH_LANG_MAP[lang]
      const shortCode = langCode.split('-')[0]

      const exactMatch = voices.find((voice) => voice.lang === langCode)
      if (exactMatch) return exactMatch

      const partialMatch = voices.find((voice) => voice.lang.startsWith(shortCode))
      if (partialMatch) return partialMatch

      const fallbackMatch = voices.find((voice) =>
        FALLBACK_LANG_CODES.some((code) => voice.lang.toLowerCase().startsWith(code))
      )

      return fallbackMatch || voices[0]
    },
    [voices]
  )

  const getVoiceForLanguage = useCallback(
    (lang: SupportedLanguageKey) => {
      if (!voices.length) return null

      const overrideName = voiceOverrides[lang]
      if (overrideName) {
        const overrideVoice = voices.find((voice) => voice.name === overrideName)
        if (overrideVoice) {
          return overrideVoice
        }
      }

      return findBestVoice(lang)
    },
    [findBestVoice, voiceOverrides, voices]
  )

  useEffect(() => {
    if (!voices.length) return

    setVoiceOverrides((prev) => {
      const updated = { ...prev }
      let changed = false

      ;(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguageKey[]).forEach((lang) => {
        if (!updated[lang]) {
          const best = findBestVoice(lang)
          if (best) {
            updated[lang] = best.name
            changed = true
          }
        }
      })

      return changed ? updated : prev
    })
  }, [findBestVoice, voices])

  const sortedVoices = useMemo(() => {
    if (!voices.length) return []

    const targetCode = SPEECH_LANG_MAP[targetLanguage]
    const targetShort = targetCode.split('-')[0]

    const rank = (voice: SpeechSynthesisVoice) => {
      const voiceLang = voice.lang.toLowerCase()
      if (voiceLang === targetCode.toLowerCase()) return 0
      if (voiceLang.startsWith(targetShort)) return 1
      const fallbackIndex = FALLBACK_LANG_CODES.findIndex((code) => voiceLang.startsWith(code))
      if (fallbackIndex !== -1) return 2 + fallbackIndex
      return 10
    }

    return [...voices].sort((a, b) => {
      const rankDiff = rank(a) - rank(b)
      if (rankDiff !== 0) return rankDiff
      return a.name.localeCompare(b.name)
    })
  }, [targetLanguage, voices])

  const handleVoiceOverrideChange = useCallback((lang: SupportedLanguageKey, voiceName: string) => {
    setVoiceOverrides((prev) => {
      const next = { ...prev }
      if (!voiceName) {
        delete next[lang]
      } else {
        next[lang] = voiceName
      }
      return next
    })
  }, [])

  const speak = (text: string, lang: SupportedLanguageKey) => {
    if (!isSpeechSupported || !text.trim()) return

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
      setFeedback('לא נמצא קול מתאים לשפה הזו. ניתן לבחור קול חלופי מהרשימה או להוסיף שפה במערכת ההפעלה.')
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
              גשר בין עברית לאנגלית, רומנית, איטלקית, צרפתית ורוסית
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

      {/* Tab Navigation */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <div className="flex gap-2 border-b border-indigo-100">
          <button
            onClick={() => setActiveTab('free')}
            className={`inline-flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
              activeTab === 'free'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            תרגום חופשי
          </button>
          <button
            onClick={() => setActiveTab('structured')}
            className={`inline-flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
              activeTab === 'structured'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            שיעורים מובנים
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        {activeTab === 'structured' ? (
          <StructuredLessons
            targetLanguage={targetLanguage}
            onLanguageChange={setTargetLanguage}
            speakText={(text: string, lang: string) => {
              const langKey = Object.keys(SPEECH_LANG_MAP).find(
                (key) => SPEECH_LANG_MAP[key as SupportedLanguageKey] === lang
              ) as SupportedLanguageKey | undefined;
              if (langKey) {
                speak(text, langKey);
              }
            }}
          />
        ) : (
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

          {isSpeechSupported && voices.length > 0 && (
            <div className="mt-6 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-700">בחירת קול להשמעה</p>
                  <p className="text-xs text-indigo-600/90">
                    בחרי קול שיזכיר לך את הצליל הכי קרוב לשפה {getCurrentLanguageMeta.label}. אם אין קול רשמי, אפשר לבחור קול חלופי (למשל איטלקי או אנגלי).
                  </p>
                </div>
                <select
                  value={voiceOverrides[targetLanguage] ?? ''}
                  onChange={(event) => handleVoiceOverrideChange(targetLanguage, event.target.value)}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-[260px]"
                >
                  {sortedVoices.map((voice) => (
                    <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
              {(() => {
                const currentVoice = getVoiceForLanguage(targetLanguage)
                if (!currentVoice) return null

                const targetCode = SPEECH_LANG_MAP[targetLanguage]
                const isFallbackVoice = !currentVoice.lang.toLowerCase().startsWith(targetCode.split('-')[0].toLowerCase())

                return (
                  <p className="text-xs text-indigo-700">
                    {isFallbackVoice
                      ? `נבחר קול חלופי (${currentVoice.name}). כדי לקבל קול מקורי לשפה ${getCurrentLanguageMeta.label}, ניתן להוסיף חבילת דיבור במערכת.`
                      : `נבחר קול מקורי לשפה ${getCurrentLanguageMeta.label} (${currentVoice.name}).`}
                  </p>
                )
              })()}
            </div>
          )}

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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-700">
                  <BookmarkCheck className="h-5 w-5" /> מונחים שנשמרו
                </h3>
                <p className="text-xs text-slate-500">המערכת לומדת מהדוגמאות שלך ומשתמשת בהן בכל כלי הכתיבה.</p>
              </div>
              {availableQuizLanguages.length > 0 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-xs text-indigo-600 sm:flex-row sm:items-center">
                  <span className="font-semibold text-indigo-700">בוחן מהיר לפי שפה:</span>
                  <select
                    value={quizTargetLanguage}
                    onChange={(event) => setQuizTargetLanguage(event.target.value as SupportedLanguageKey)}
                    className="rounded-xl border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {availableQuizLanguages.map((langKey) => (
                      <option key={langKey} value={langKey}>
                        {SUPPORTED_LANGUAGES[langKey].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {history.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                        <span>{SUPPORTED_LANGUAGES[entry.targetLanguage].label}</span>
                        <span>{new Date(entry.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600" dir="rtl">{entry.hebrewTerm}</div>
                      <div className="text-lg font-semibold text-slate-900" dir="ltr">{entry.translatedTerm}</div>
                      {entry.pronunciation && (
                        <p className="text-xs text-slate-500">הגייה: {entry.pronunciation}</p>
                      )}
                    </div>
                  ))}
                </div>
                {history.length > 6 && (
                  <p className="mt-3 text-xs text-slate-400">מוצגות 6 הדוגמאות האחרונות. תוכלי לראות את כולן במסך "לימוד שפות" בהמשך.</p>
                )}
              </div>

              <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                <div>
                  <h4 className="flex items-center gap-2 text-base font-semibold text-indigo-800">
                    <ListChecks className="h-4 w-4" /> בוחן מהיר
                  </h4>
                  <p className="mt-1 text-xs text-indigo-600">בדקי את עצמך עם תרגול קצר של המילים ששמרת.</p>
                </div>

                {quizState && quizState.finished ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                      <p className="text-sm font-semibold">סיימת! ציון: {quizState.score}/{quizState.questions.length}</p>
                      <p className="text-xs">{quizProgress}% הצלחה. המשיכי לשמור מילים חדשות כדי לשפר את הבוחנים הבאים.</p>
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-indigo-100 bg-white/80 p-3 text-xs text-indigo-700">
                      <p className="mb-2 font-semibold">פירוט תשובות:</p>
                      <ul className="space-y-1">
                        {quizState.answers.map((answer, index) => (
                          <li key={`${answer.correct}-${index}`} className="flex items-center justify-between gap-2">
                            <span dir="rtl" className="truncate text-slate-600">
                              {quizState.questions[index]?.hebrewTerm}
                            </span>
                            <span className={`text-[11px] font-semibold ${answer.wasCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {answer.wasCorrect ? 'נכון' : 'טעית'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={startQuiz}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <RefreshCw className="h-4 w-4" /> התחילי בוחן חדש
                      </button>
                      <button
                        onClick={resetQuiz}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300"
                      >
                        אפס תוצאות
                      </button>
                    </div>
                  </div>
                ) : activeQuizQuestion ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between text-xs text-indigo-600">
                      <span>
                        שאלה {quizState!.currentIndex + 1} מתוך {quizState!.questions.length}
                      </span>
                      <span>{quizProgress}% התקדמות</span>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-white/90 px-4 py-3 text-sm font-semibold text-indigo-900" dir="rtl">
                      {activeQuizQuestion.hebrewTerm}
                    </div>
                    <div className="space-y-2">
                      {activeQuizQuestion.options.map((option) => {
                        const isSelected = quizState!.selectedOption === option
                        return (
                          <button
                            key={option}
                            onClick={() => selectQuizOption(option)}
                            className={`w-full rounded-xl border px-4 py-2 text-sm transition ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                                : 'border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300'
                            }`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={submitQuizAnswer}
                      disabled={!quizState!.selectedOption}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trophy className="h-4 w-4" /> בדקי תשובה
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <p className="text-xs text-indigo-600">יש לך {history.filter((entry) => entry.targetLanguage === quizTargetLanguage).length} מונחים בשפה הזו. לחיצה על "התחילי בתרגול" תערבב אותם לכמה שאלות קצרות.</p>
                    <button
                      onClick={startQuiz}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <ListChecks className="h-4 w-4" /> התחילי בתרגול
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
          )}
        </section>
        )}
      </main>
    </div>
  )
}
