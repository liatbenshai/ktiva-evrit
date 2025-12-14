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
  ListChecks,
  Trophy,
  GraduationCap,
} from 'lucide-react'
import StructuredLessons from '@/components/languages/StructuredLessons'
import AdvancedPractice from '@/components/languages/AdvancedPractice'
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import { useSession } from 'next-auth/react';

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
  contentType?: string
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

type TabType = 'free' | 'structured' | 'advanced';
type ContentType = 'word' | 'sentence' | 'linking_word';

export default function LanguagesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('free');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguageKey>('english')
  const [hebrewTerm, setHebrewTerm] = useState('')
  const [contentType, setContentType] = useState<ContentType>('word')
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
        body: JSON.stringify({ hebrewTerm, targetLanguage, contentType }),
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
          contentType: contentType,
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

  const theme = getPageTheme('languages');

  return (
    <DashboardPageWrapper
      icon={LanguagesIcon}
      title="לימוד שפות"
      description="גשר בין עברית לאנגלית, רומנית, איטלקית, צרפתית ורוסית. הזיני ביטוי בעברית, בחרי שפה רצויה וקבלי תרגום טבעי, הגייה ודוגמאות שימוש."
      theme={theme}
    >

      {/* Tab Navigation */}
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-4 pt-4 sm:pt-6">
        <div className="flex gap-1 sm:gap-2 border-b border-indigo-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('free')}
            className={`inline-flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap flex-shrink-0 ${
              activeTab === 'free'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">תרגום חופשי</span>
            <span className="sm:hidden">חופשי</span>
          </button>
          <button
            onClick={() => setActiveTab('structured')}
            className={`inline-flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap flex-shrink-0 ${
              activeTab === 'structured'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">שיעורים מובנים</span>
            <span className="sm:hidden">שיעורים</span>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`inline-flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap flex-shrink-0 ${
              activeTab === 'advanced'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">תרגול מתקדם</span>
            <span className="sm:hidden">מתקדם</span>
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
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
        ) : activeTab === 'advanced' ? (
          <AdvancedPractice targetLanguage={targetLanguage} userId={session?.user?.email || 'default-user'} />
        ) : activeTab === 'free' ? (
          <section className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 shadow-xl">
          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-semibold text-indigo-700">
                <LanguagesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                בחרי שפה ללמידה
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">בחרי אחת מהשפות הנתמכות והזיני מונח בעברית שתרצי ללמוד. המערכת תציע ניסוח טבעי ודוגמאות.</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-indigo-600">
              <Globe2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
              <span className="hidden sm:inline">שפת הבסיס: עברית</span>
              <span className="sm:hidden">עברית</span>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguageKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setTargetLanguage(key)}
                className={`rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-3 sm:py-4 text-right transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  targetLanguage === key
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                <div className="text-xs sm:text-sm font-semibold">{SUPPORTED_LANGUAGES[key].label}</div>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500">{SUPPORTED_LANGUAGES[key].description}</p>
              </button>
            ))}
          </div>

          {isSpeechSupported && voices.length > 0 && (
            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 rounded-xl sm:rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-indigo-700">בחירת קול להשמעה</p>
                  <p className="text-[10px] sm:text-xs text-indigo-600/90 mt-0.5">
                    בחרי קול שיזכיר לך את הצליל הכי קרוב לשפה {getCurrentLanguageMeta.label}. אם אין קול רשמי, אפשר לבחור קול חלופי (למשל איטלקי או אנגלי).
                  </p>
                </div>
                <select
                  value={voiceOverrides[targetLanguage] ?? ''}
                  onChange={(event) => handleVoiceOverrideChange(targetLanguage, event.target.value)}
                  className="w-full sm:w-auto min-w-[200px] rounded-lg sm:rounded-xl border border-indigo-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 mt-2 sm:mt-0"
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
                  <p className="text-[10px] sm:text-xs text-indigo-700 break-words">
                    {isFallbackVoice
                      ? `נבחר קול חלופי (${currentVoice.name}). כדי לקבל קול מקורי לשפה ${getCurrentLanguageMeta.label}, ניתן להוסיף חבילת דיבור במערכת.`
                      : `נבחר קול מקורי לשפה ${getCurrentLanguageMeta.label} (${currentVoice.name}).`}
                  </p>
                )
              })()}
            </div>
          )}

          <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-700">סוג תוכן</label>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setContentType('word')}
                  className={`flex-1 rounded-lg sm:rounded-xl border px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition ${
                    contentType === 'word'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  מילה/ביטוי
                </button>
                <button
                  onClick={() => setContentType('sentence')}
                  className={`flex-1 rounded-lg sm:rounded-xl border px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition ${
                    contentType === 'sentence'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  משפט שלם
                </button>
                <button
                  onClick={() => setContentType('linking_word')}
                  className={`flex-1 rounded-lg sm:rounded-xl border px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition ${
                    contentType === 'linking_word'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  מילת קישור
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 break-words">
                {contentType === 'word' && 'מילה או ביטוי בעברית שתרצי ללמוד בשפה ' + getCurrentLanguageMeta.label}
                {contentType === 'sentence' && 'משפט שלם בעברית שתרצי ללמוד בשפה ' + getCurrentLanguageMeta.label}
                {contentType === 'linking_word' && 'מילת קישור בעברית שתרצי ללמוד בשפה ' + getCurrentLanguageMeta.label}
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={hebrewTerm}
                  onChange={(e) => setHebrewTerm(e.target.value)}
                  placeholder={
                    contentType === 'word'
                      ? 'לדוגמה: מה שלומך?'
                      : contentType === 'sentence'
                      ? 'לדוגמה: אני רוצה ללמוד שפות חדשות'
                      : 'לדוגמה: אבל, אולם, בנוסף'
                  }
                  className="flex-1 rounded-xl sm:rounded-2xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={handleLearn}
                  disabled={disableActions}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  למד
                </button>
              </div>
              <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500">
                {contentType === 'word' && 'טיפ: אפשר להזין מילים בודדות או ביטויים קצרים.'}
                {contentType === 'sentence' && 'טיפ: הזיני משפט שלם בעברית כדי ללמוד איך לבנות משפטים דומים בשפה הזרה.'}
                {contentType === 'linking_word' && 'טיפ: מילות קישור כמו "אבל", "אולם", "בנוסף", "לכן" עוזרות לחבר רעיונות.'}
              </p>
            </div>
          </div>

          {feedback && (
            <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl bg-indigo-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-indigo-600">{feedback}</div>
          )}

          {result && (
          <section className="mt-6 sm:mt-8 lg:mt-10 grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-3">
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-md lg:col-span-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-indigo-700">התרגום שלך</h3>
                  <p className="text-xs sm:text-sm text-slate-500">עברית → {getCurrentLanguageMeta.label}</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  שמרי ללמידה
                </button>
              </div>

              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                <div className="rounded-xl sm:rounded-2xl bg-indigo-50 px-3 sm:px-4 py-2 sm:py-3 text-indigo-700">
                  <div className="text-[10px] sm:text-xs uppercase text-indigo-400">ביטוי בעברית</div>
                  <div className="text-base sm:text-lg font-semibold break-words">{result.hebrewTerm}</div>
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-white px-3 sm:px-4 py-2 sm:py-3 shadow-inner">
                  <div className="text-[10px] sm:text-xs uppercase text-slate-400">תרגום</div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 break-words" dir="ltr">{result.translatedTerm}</div>
                  {result.pronunciation && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">הגייה: {result.pronunciation}</p>
                  )}
                  {isSpeechSupported && (
                    <button
                      onClick={() => speak(result.translatedTerm, result.targetLanguage)}
                      className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-indigo-200 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      {spokenText === result.translatedTerm ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <LanguagesIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      השמעה
                    </button>
                  )}
                </div>
                {result.culturalNotes && (
                  <div className="rounded-xl sm:rounded-2xl bg-purple-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-purple-600">
                    <strong className="block text-purple-500 text-xs sm:text-sm">הערות שימוש</strong>
                    <p className="break-words">{result.culturalNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-md">
              <h4 className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold text-indigo-700">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> דוגמאות שימוש
              </h4>
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                {result.usageExamples.map((example, index) => (
                  <div key={index} className="rounded-xl sm:rounded-2xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3">
                    <p className="font-semibold text-slate-700 break-words" dir="ltr">{example.target}</p>
                    <p className="mt-1 text-[10px] sm:text-xs text-slate-500 break-words">{example.hebrew}</p>
                    {isSpeechSupported && (
                      <button
                        onClick={() => speak(example.target, result.targetLanguage)}
                        className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-indigo-200 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <LanguagesIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        השמע
                      </button>
                    )}
                  </div>
                ))}
                {result.extraSuggestions.length > 0 && (
                  <div className="rounded-xl sm:rounded-2xl bg-indigo-50 px-3 sm:px-4 py-2 sm:py-3 text-indigo-600">
                    <strong className="block text-indigo-500 text-xs sm:text-sm">עוד מילים שכדאי להכיר:</strong>
                    <ul className="mt-1 list-disc pl-4 sm:pl-5 text-[10px] sm:text-xs">
                      {result.extraSuggestions.map((suggestion, index) => (
                        <li key={index} className="break-words">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {history.length > 0 && (
          <section className="mt-6 sm:mt-8 lg:mt-12 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6 shadow-md">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-semibold text-indigo-700">
                  <BookmarkCheck className="h-4 w-4 sm:h-5 sm:w-5" /> מונחים שנשמרו
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">המערכת לומדת מהדוגמאות שלך ומשתמשת בהן בכל כלי הכתיבה.</p>
              </div>
              {availableQuizLanguages.length > 0 && (
                <div className="flex flex-col gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-indigo-100 bg-indigo-50/80 px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs text-indigo-600 sm:flex-row sm:items-center mt-2 lg:mt-0">
                  <span className="font-semibold text-indigo-700">בוחן מהיר לפי שפה:</span>
                  <select
                    value={quizTargetLanguage}
                    onChange={(event) => setQuizTargetLanguage(event.target.value as SupportedLanguageKey)}
                    className="rounded-lg sm:rounded-xl border border-indigo-200 bg-white px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-indigo-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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

            <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {history.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-400">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="truncate">{SUPPORTED_LANGUAGES[entry.targetLanguage].label}</span>
                          {entry.contentType && (
                            <span className="rounded-full bg-indigo-100 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] text-indigo-600 flex-shrink-0">
                              {entry.contentType === 'sentence' ? 'משפט' : entry.contentType === 'linking_word' ? 'קישור' : 'מילה'}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] flex-shrink-0">{new Date(entry.updatedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 break-words" dir="rtl">{entry.hebrewTerm}</div>
                      <div className="text-base sm:text-lg font-semibold text-slate-900 break-words" dir="ltr">{entry.translatedTerm}</div>
                      {entry.pronunciation && (
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">הגייה: {entry.pronunciation}</p>
                      )}
                    </div>
                  ))}
                </div>
                {history.length > 6 && (
                  <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-slate-400">מוצגות 6 הדוגמאות האחרונות. תוכלי לראות את כולן במסך "לימוד שפות" בהמשך.</p>
                )}
              </div>

              <div className="flex h-full flex-col justify-between rounded-xl sm:rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
                <div>
                  <h4 className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold text-indigo-800">
                    <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> בוחן מהיר
                  </h4>
                  <p className="mt-1 text-[10px] sm:text-xs text-indigo-600">בדקי את עצמך עם תרגול קצר של המילים ששמרת.</p>
                </div>

                {quizState && quizState.finished ? (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                    <div className="rounded-lg sm:rounded-xl border border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-2 sm:py-3 text-emerald-700">
                      <p className="text-xs sm:text-sm font-semibold">סיימת! ציון: {quizState.score}/{quizState.questions.length}</p>
                      <p className="text-[10px] sm:text-xs mt-0.5">{quizProgress}% הצלחה. המשיכי לשמור מילים חדשות כדי לשפר את הבוחנים הבאים.</p>
                    </div>
                    <div className="max-h-32 sm:max-h-40 overflow-y-auto rounded-lg sm:rounded-xl border border-indigo-100 bg-white/80 p-2 sm:p-3 text-[10px] sm:text-xs text-indigo-700">
                      <p className="mb-1.5 sm:mb-2 font-semibold">פירוט תשובות:</p>
                      <ul className="space-y-1">
                        {quizState.answers.map((answer, index) => (
                          <li key={`${answer.correct}-${index}`} className="flex items-center justify-between gap-1.5 sm:gap-2">
                            <span dir="rtl" className="truncate text-slate-600 text-[9px] sm:text-[10px]">
                              {quizState.questions[index]?.hebrewTerm}
                            </span>
                            <span className={`text-[9px] sm:text-[11px] font-semibold flex-shrink-0 ${answer.wasCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {answer.wasCorrect ? 'נכון' : 'טעית'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <button
                        onClick={startQuiz}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                        <span className="hidden sm:inline">התחילי בוחן חדש</span>
                        <span className="sm:hidden">בוחן חדש</span>
                      </button>
                      <button
                        onClick={resetQuiz}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-indigo-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-indigo-600 transition hover:border-indigo-300"
                      >
                        אפס תוצאות
                      </button>
                    </div>
                  </div>
                ) : activeQuizQuestion ? (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-indigo-600">
                      <span>
                        שאלה {quizState!.currentIndex + 1} מתוך {quizState!.questions.length}
                      </span>
                      <span>{quizProgress}% התקדמות</span>
                    </div>
                    <div className="rounded-lg sm:rounded-xl border border-indigo-100 bg-white/90 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-indigo-900 break-words" dir="rtl">
                      {activeQuizQuestion.hebrewTerm}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {activeQuizQuestion.options.map((option) => {
                        const isSelected = quizState!.selectedOption === option
                        return (
                          <button
                            key={option}
                            onClick={() => selectQuizOption(option)}
                            className={`w-full rounded-lg sm:rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition break-words ${
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
                      className="inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                      <span className="hidden sm:inline">בדקי תשובה</span>
                      <span className="sm:hidden">בדקי</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                    <p className="text-[10px] sm:text-xs text-indigo-600 break-words">יש לך {history.filter((entry) => entry.targetLanguage === quizTargetLanguage).length} מונחים בשפה הזו. לחיצה על "התחילי בתרגול" תערבב אותם לכמה שאלות קצרות.</p>
                    <button
                      onClick={startQuiz}
                      className="inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                      <span className="hidden sm:inline">התחילי בתרגול</span>
                      <span className="sm:hidden">תרגול</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </DashboardPageWrapper>
  )
}
