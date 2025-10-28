'use client'

import { useState } from 'react'
import { RefreshCw, Loader2, Lightbulb, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

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
      
      const response = await fetch('/api/synonyms/generate', {
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'שגיאה ביצירת גרסאות עם מילים נרדפות')
      }

      const data = await response.json()
      setGeneratedVersions(data.versions)
      setQualityAnalysis(data.qualityAnalysis)
    } catch (err) {
      console.error('Error generating synonyms:', err)
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="ml-2 h-4 w-4" />
          מילים נרדפות
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>יצירת גרסאות עם מילים נרדפות</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quality Analysis */}
          {qualityAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ניתוח איכות הטקסט
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl font-bold">
                    {qualityAnalysis.score}/100
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${qualityAnalysis.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                {qualityAnalysis.suggestions && qualityAnalysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">הצעות לשיפור:</h4>
                    {qualityAnalysis.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{suggestion.word}</Badge>
                        <span>→</span>
                        <Badge variant="secondary">{suggestion.suggestion}</Badge>
                        <span className="text-gray-600">{suggestion.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!generatedVersions.length && !isGenerating && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">יצירת גרסאות עם מילים נרדפות</h3>
                  <p className="text-gray-600 mb-4">
                    המערכת תיצור 3 גרסאות שונות של הטקסט עם מילים נרדפות
                  </p>
                  <Button onClick={handleGenerateSynonyms} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        יוצר גרסאות...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="ml-2 h-4 w-4" />
                        צור גרסאות
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isGenerating && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold mb-2">יוצר גרסאות...</h3>
                  <p className="text-gray-600">
                    המערכת מעבדת את הטקסט ויוצרת גרסאות עם מילים נרדפות
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200">
              <CardContent className="py-4">
                <div className="text-center text-red-600">
                  <h3 className="font-semibold mb-2">שגיאה</h3>
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateSynonyms}
                    className="mt-2"
                  >
                    נסה שוב
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedVersions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  גרסאות שנוצרו ({generatedVersions.length})
                </h3>
                <Badge variant="secondary">
                  מוכן לשימוש
                </Badge>
              </div>
              
              <div className="space-y-4">
                {generatedVersions.map((version, index) => (
                  <Card key={version.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{version.title}</CardTitle>
                        <Badge variant="outline">
                          גרסה {index + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-4 rounded max-h-32 overflow-y-auto">
                          <p className="whitespace-pre-wrap">{version.content}</p>
                        </div>
                        
                        {version.improvements && version.improvements.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              שיפורים בגרסה זו:
                            </h4>
                            <div className="space-y-1">
                              {version.improvements.map((improvement: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                  <Badge variant="outline" className="shrink-0">
                                    {improvement.original}
                                  </Badge>
                                  <span className="text-gray-400">→</span>
                                  <Badge variant="secondary" className="shrink-0">
                                    {improvement.replacement}
                                  </Badge>
                                  <span className="text-gray-600">
                                    {improvement.reason}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleVersionSelect(version)}
                            className="flex-1"
                          >
                            בחר גרסה זו
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(version.content)
                              // Optional: show toast notification
                            }}
                          >
                            העתק
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
