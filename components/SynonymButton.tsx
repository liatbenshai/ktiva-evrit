'use client'

import { useState } from 'react'
import { RefreshCw, Loader2, Lightbulb, TrendingUp, X } from 'lucide-react'

interface SynonymButtonProps {
  text: string
  context?: string
  category?: string
  userId?: string
  onVersionSelect?: (version: string) => void
}

export function SynonymButton({ 
  text, 
  context = '', 
  category = 'general', 
  userId = 'default-user',
  onVersionSelect 
}: SynonymButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVersions, setGeneratedVersions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [qualityAnalysis, setQualityAnalysis] = useState<any>(null)

  const handleGenerateSynonyms = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const response = await fetch('/api/synonyms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          count: 3,
          context,
          category,
          userId
        })
      })

      if (!response.ok) {
        throw new Error('שגיאה ביצירת גרסאות עם מילים נרדפות')
      }

      const data = await response.json()
      setGeneratedVersions(data.versions)
      setQualityAnalysis(data.qualityAnalysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVersionSelect = (version: any) => {
    if (onVersionSelect) {
      onVersionSelect(version.content)
    }
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
      >
        <RefreshCw className="w-4 h-4" />
        מילים נרדפות
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">יצירת גרסאות עם מילים נרדפות</h2>
              <p className="text-gray-600 mt-1">המערכת תיצור גרסאות שונות של הטקסט עם מילים נרדפות</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Quality Analysis */}
            {qualityAnalysis && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold">ניתוח איכות הטקסט</h3>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl font-bold">
                    {qualityAnalysis.score}/100
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${qualityAnalysis.score}%` }}
                      />
                    </div>
                  </div>
                </div>
                {qualityAnalysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">הצעות לשיפור:</h4>
                    {qualityAnalysis.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-white border border-gray-300 rounded text-sm">
                          {suggestion.word}
                        </span>
                        <span>→</span>
                        <span className="px-2 py-1 bg-gray-200 rounded text-sm">
                          {suggestion.suggestion}
                        </span>
                        <span className="text-gray-600">{suggestion.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!generatedVersions.length && !isGenerating && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-12">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">יצירת גרסאות עם מילים נרדפות</h3>
                  <p className="text-gray-600 mb-4">
                    המערכת תיצור 3 גרסאות שונות של הטקסט עם מילים נרדפות
                  </p>
                  <button 
                    onClick={handleGenerateSynonyms} 
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        יוצר גרסאות...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        צור גרסאות
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold mb-2">יוצר גרסאות...</h3>
                  <p className="text-gray-600">
                    המערכת מעבדת את הטקסט ויוצרת גרסאות עם מילים נרדפות
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="text-center text-red-600">
                  <h3 className="font-semibold mb-2">שגיאה</h3>
                  <p>{error}</p>
                  <button 
                    onClick={handleGenerateSynonyms}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    נסה שוב
                  </button>
                </div>
              </div>
            )}

            {generatedVersions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    גרסאות שנוצרו ({generatedVersions.length})
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    מוכן לשימוש
                  </span>
                </div>
                
                <div className="space-y-4">
                  {generatedVersions.map((version, index) => (
                    <div key={version.id} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{version.title}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          גרסה {index + 1}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="prose prose-sm max-w-none max-h-32 overflow-y-auto bg-gray-50 p-4 rounded border">
                          <p>{version.content}</p>
                        </div>
                        
                        {version.improvements && version.improvements.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-yellow-600" />
                              שיפורים בגרסה זו:
                            </h4>
                            {version.improvements.map((improvement: any, idx: number) => (
                              <div key={idx} className="text-xs text-gray-600">
                                • {improvement.reason}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleVersionSelect(version)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            בחר גרסה זו
                          </button>
                          <button 
                            onClick={() => navigator.clipboard.writeText(version.content)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            העתק
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}