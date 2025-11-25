'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, CheckCircle, XCircle, Edit3, DatabaseZap } from 'lucide-react'
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';

interface TextSample {
  id: string
  originalText: string
  category: string
  correctedText?: string
  suggestedText?: string
  confidence?: number
  occurrences?: number
  isLearned: boolean
}

interface LearnedPatternResponse {
  success: boolean
  patterns: Array<{
    id: string
    badPattern: string
    goodPattern: string
    patternType?: string
    confidence?: number
    occurrences?: number
    context?: string | null
  }>
  message?: string
}

export default function LearnPage() {
  const [currentText, setCurrentText] = useState<TextSample | null>(null)
  const [correctedText, setCorrectedText] = useState('')
  const [history, setHistory] = useState<TextSample[]>([])
  const [samples, setSamples] = useState<TextSample[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/ai-correction/patterns?userId=default-user&filter=ai-style', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('נכשלה טעינת הדפוסים. נסי שוב מאוחר יותר.')
        }

        const data: LearnedPatternResponse = await response.json()

        if (!data.patterns || data.patterns.length === 0) {
          setSamples([])
          setError('עדיין לא נלמדו דפוסים. התחילי בתיקון טקסטים במסך "תיקון כתיבת AI" כדי שהמערכת תדע מה ללמוד.')
          return
        }

        const parsedSamples = data.patterns.map((pattern) => ({
          id: pattern.id,
          originalText: pattern.badPattern,
          category: pattern.patternType || 'דפוס AI',
          correctedText: pattern.goodPattern,
          suggestedText: pattern.goodPattern,
          confidence: pattern.confidence,
          occurrences: pattern.occurrences,
          isLearned: false,
        }))

        setSamples(parsedSamples)
        setHistory([])
        setCurrentText(null)
        setCorrectedText('')
      } catch (err) {
        console.error('Failed to load patterns:', err)
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת דפוסים')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatterns()
  }, [])

  const remainingSamples = useMemo(() => {
    return samples.filter(sample => !history.find(h => h.id === sample.id && h.isLearned))
  }, [samples, history])

  const getRandomText = () => {
    if (remainingSamples.length === 0) {
      setHistory([])
      return samples[Math.floor(Math.random() * samples.length)]
    }

    return remainingSamples[Math.floor(Math.random() * remainingSamples.length)]
  }

  const handleStartLearning = () => {
    if (!samples.length) {
      return
    }

    const text = getRandomText()
    if (text) {
      setCurrentText(text)
      setCorrectedText(text.suggestedText || '')
    }
  }

  const handleSubmit = () => {
    if (!currentText || !correctedText.trim()) {
      alert('נא להזין טקסט מתוקן')
      return
    }

    const updatedText = {
      ...currentText,
      correctedText: correctedText.trim(),
      isLearned: true
    }

    setSamples((prev) => prev.map(sample => sample.id === updatedText.id ? { ...sample, isLearned: true } : sample))

    setHistory([...history, updatedText])
    setCurrentText(null)
    setCorrectedText('')
  }

  const handleSkip = () => {
    if (currentText) {
      setHistory([...history, { ...currentText, isLearned: false }])
      setCurrentText(null)
      setCorrectedText('')
    }
  }

  const getProgress = () => {
    if (!samples.length) return 0
    const learnedCount = history.filter(h => h.isLearned).length
    return Math.round((learnedCount / samples.length) * 100)
  }

  const getLearnedCount = () => {
    return history.filter(h => h.isLearned).length
  }

  return (
    <DashboardPageWrapper
      icon={DatabaseZap}
      title="למידת תיקון טקסטים"
      description="למד את המערכת לתקן טקסטים ולהפוך אותם לעברית תקנית"
      theme={getPageTheme('default')}
    >
        {/* Progress */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">התקדמות הלמידה</h2>
              <span className="text-2xl font-bold text-blue-600">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <p className="text-gray-600 mt-2">
              תיקנת {getLearnedCount()} מתוך {samples.length || 0} דפוסים שנלמדו
            </p>
          </div>
        </div>

        {/* Current Text Card */}
        {!samples.length && !isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-7xl mb-6">🤔</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">אין עדיין מה ללמד</h3>
            <p className="text-gray-600 text-lg mb-6 max-w-lg mx-auto">
              עדיין לא נשמרו דפוסים מהתיקונים שלך. כנסי למסך "תיקון כתיבת AI", אשרי או תקני טקסטים, ואז חזרי לכאן כדי לחזק אותם.
            </p>
            <Link
              href="/dashboard/ai-correction"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-lg"
            >
              <DatabaseZap className="w-6 h-6" />
              לתיקון טקסטים
            </Link>
          </div>
        ) : !currentText ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-8xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              מוכן להתחיל ללמד?
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              המערכת תציג לך דפוס אמיתי שנשמר מהתיקונים. אשרי או עדכני אותו כדי לחזק את הלמידה.
            </p>
            <button
              onClick={handleStartLearning}
              disabled={isLoading || !samples.length}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-lg disabled:opacity-50"
            >
              <RefreshCw className="w-6 h-6" />
              התחל ללמד
            </button>
            {error && (
              <p className="mt-6 text-sm text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Original Text Card */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {currentText.category}
                </span>
                <span className="text-sm text-gray-600">טקסט המקורי - צריך תיקון</span>
              </div>
              
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 min-h-[150px] flex items-center">
                <p className="text-2xl font-bold text-red-700 text-center w-full" dir="rtl">
                  {currentText.originalText}
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="text-6xl">⬇️</div>
            </div>

            {/* Corrected Text Input */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {currentText.category}
                </span>
                <span className="text-sm text-gray-600">הטקסט המתוקן שלך</span>
              </div>
              
              <textarea
                value={correctedText}
                onChange={(e) => setCorrectedText(e.target.value)}
                placeholder={currentText.suggestedText ? `המערכת למדה: "${currentText.suggestedText}"` : 'הזן כאן את הטקסט המתוקן...'}
                className="w-full bg-green-50 border-2 border-green-200 rounded-xl p-6 min-h-[150px] text-2xl font-bold text-green-700 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-400"
                dir="rtl"
              />
              {(currentText.confidence || currentText.occurrences) && (
                <p className="mt-3 text-sm text-green-700">
                  עוצמת הדפוס: {(currentText.confidence ? Math.round(currentText.confidence * 100) : 80)}% · הופיע {currentText.occurrences || 1} פעמים
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSkip}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-lg"
              >
                <RefreshCw className="w-6 h-6" />
                דלג
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium text-lg"
              >
                <CheckCircle className="w-6 h-6" />
                שלח תיקון
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">היסטוריית תיקונים</h2>
            <div className="space-y-4">
              {history.slice(-5).reverse().map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-r-2 border-gray-200 pr-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                          לפני
                        </span>
                      </div>
                      <p className="text-lg text-red-700 font-semibold" dir="rtl">
                        {item.originalText}
                      </p>
                    </div>
                    <div className="pl-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                          אחרי
                        </span>
                        {item.isLearned && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-lg text-green-700 font-semibold" dir="rtl">
                        {item.correctedText || item.suggestedText || 'לא תוקן'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </DashboardPageWrapper>
  )
}
