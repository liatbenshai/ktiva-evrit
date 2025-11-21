'use client';

import React, { useState } from 'react';
import { Home, BarChart3, FileText, Loader2, Copy, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageHeader, { PageHeaderLink } from '@/components/layout/PageHeader';

interface TextAnalysis {
  statistics: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgSentenceLength: number;
    avgWordLength: number;
    readingTimeMinutes: number;
  };
  style: {
    formality: string;
    complexity: string;
    writingStyle: string;
    hebrewQuality?: string;
    styleDescription: string;
  };
  hebrewAnalysis?: {
    literalTranslations: string[];
    aiPatterns: string[];
    anglicisms: string[];
    qualityDescription: string;
  };
  tone: {
    overallTone: string;
    emotion: string;
    confidence: string;
    toneDescription: string;
  };
  content: {
    mainTopics: string[];
    keywords: string[];
    mainMessages: string[];
  };
  readability: {
    level: string;
    suitableAge: string;
    readingTimeMinutes: number;
  };
  recommendations: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  overallScore: number;
}

export default function TextAnalysisPage() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('נא להזין טקסט לניתוח');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/text-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בניתוח הטקסט');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'שגיאה בניתוח הטקסט');
      console.error('Error analyzing text:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFormalityLabel = (formality: string) => {
    const labels: Record<string, string> = {
      formal: 'פורמלי',
      'semi-formal': 'בינוני',
      informal: 'לא פורמלי',
    };
    return labels[formality] || formality;
  };

  const getComplexityLabel = (complexity: string) => {
    const labels: Record<string, string> = {
      simple: 'פשוט',
      moderate: 'בינוני',
      complex: 'מורכב',
    };
    return labels[complexity] || complexity;
  };

  const getToneLabel = (tone: string) => {
    const labels: Record<string, string> = {
      positive: 'חיובי',
      negative: 'שלילי',
      neutral: 'ניטרלי',
    };
    return labels[tone] || tone;
  };

  const getReadabilityLabel = (level: string) => {
    const labels: Record<string, string> = {
      easy: 'קל',
      moderate: 'בינוני',
      difficult: 'קשה',
    };
    return labels[level] || level;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <Minus className="h-5 w-5 text-yellow-600" />;
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <PageHeader
        icon={BarChart3}
        title="ניתוח טקסטים"
        description="הזיני טקסט והמערכת תנתח אותו - סגנון, טון, רגש, אורך, מורכבות וקריאות."
        actions={
          <PageHeaderLink
            href="/dashboard"
            label="חזרה לדשבורד"
            icon={Home}
            variant="outline"
            className="text-sm sm:text-base"
          />
        }
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* פאנל קלט */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">טקסט לניתוח</h2>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  הדבקי טקסט כאן
                </label>
                {text && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        הועתק
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        העתק
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="הדבקי כאן את הטקסט שברצונך לנתח..."
                className="h-96 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <p className="mt-2 text-xs text-gray-500">
                {text.length > 0 && `${text.split(/\s+/).length} מילים`}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מנתח טקסט...
                </>
              ) : (
                <>
                  <BarChart3 className="ml-2 h-4 w-4" />
                  נתח טקסט
                </>
              )}
            </Button>
          </Card>

          {/* פאנל תוצאות */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">תוצאות הניתוח</h2>
            </div>

            {!analysis && !isAnalyzing && (
              <div className="flex h-96 items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                  <p>התוצאות יופיעו כאן לאחר הניתוח</p>
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* ציון כללי */}
                <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getScoreIcon(analysis.overallScore)}
                      <span className="text-sm font-medium text-gray-700">ציון כללי</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}/100
                    </span>
                  </div>
                </div>

                {/* נתונים סטטיסטיים */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">נתונים סטטיסטיים</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">מילים</div>
                      <div className="text-lg font-semibold">{analysis.statistics.wordCount}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">משפטים</div>
                      <div className="text-lg font-semibold">{analysis.statistics.sentenceCount}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">פסקאות</div>
                      <div className="text-lg font-semibold">{analysis.statistics.paragraphCount}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">זמן קריאה</div>
                      <div className="text-lg font-semibold">{analysis.readability.readingTimeMinutes} דק'</div>
                    </div>
                  </div>
                </div>

                {/* ניתוח סגנון */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">ניתוח סגנון</h3>
                  <div className="space-y-2 rounded-lg bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">רמת פורמליות:</span>
                      <span className="text-sm font-medium">{getFormalityLabel(analysis.style.formality)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">רמת מורכבות:</span>
                      <span className="text-sm font-medium">{getComplexityLabel(analysis.style.complexity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">סגנון כתיבה:</span>
                      <span className="text-sm font-medium">{analysis.style.writingStyle}</span>
                    </div>
                    {analysis.style.hebrewQuality && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">איכות עברית:</span>
                        <span className="text-sm font-medium">
                          {analysis.style.hebrewQuality === 'excellent' ? 'מצוין' :
                           analysis.style.hebrewQuality === 'good' ? 'טוב' :
                           analysis.style.hebrewQuality === 'moderate' ? 'בינוני' :
                           analysis.style.hebrewQuality === 'poor' ? 'נמוך' : analysis.style.hebrewQuality}
                        </span>
                      </div>
                    )}
                    {analysis.style.styleDescription && (
                      <p className="mt-2 text-xs text-gray-600">{analysis.style.styleDescription}</p>
                    )}
                  </div>
                </div>

                {/* ניתוח טון */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">ניתוח טון</h3>
                  <div className="space-y-2 rounded-lg bg-purple-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">טון כללי:</span>
                      <span className="text-sm font-medium">{getToneLabel(analysis.tone.overallTone)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">רגש:</span>
                      <span className="text-sm font-medium">{analysis.tone.emotion}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">ביטחון:</span>
                      <span className="text-sm font-medium">{analysis.tone.confidence}</span>
                    </div>
                    {analysis.tone.toneDescription && (
                      <p className="mt-2 text-xs text-gray-600">{analysis.tone.toneDescription}</p>
                    )}
                  </div>
                </div>

                {/* ניתוח תוכן */}
                {analysis.content.mainTopics.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">נושאים מרכזיים</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.content.mainTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ניתוח קריאות */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">ניתוח קריאות</h3>
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">רמת קריאות:</span>
                      <span className="text-sm font-medium">{getReadabilityLabel(analysis.readability.level)}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      מתאים לגיל: {analysis.readability.suitableAge}
                    </div>
                  </div>
                </div>

                {/* ניתוח עברית תקנית */}
                {analysis.hebrewAnalysis && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">ניתוח עברית תקנית</h3>
                    <div className="space-y-3 rounded-lg bg-amber-50 p-4">
                      {analysis.hebrewAnalysis.qualityDescription && (
                        <p className="text-sm text-gray-700">{analysis.hebrewAnalysis.qualityDescription}</p>
                      )}
                      
                      {analysis.hebrewAnalysis.literalTranslations.length > 0 && (
                        <div>
                          <div className="mb-2 text-xs font-medium text-gray-700">תרגומים מילוליים:</div>
                          <ul className="space-y-1">
                            {analysis.hebrewAnalysis.literalTranslations.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="mt-1 text-orange-600">⚠</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.hebrewAnalysis.aiPatterns.length > 0 && (
                        <div>
                          <div className="mb-2 text-xs font-medium text-gray-700">ביטויי AI:</div>
                          <ul className="space-y-1">
                            {analysis.hebrewAnalysis.aiPatterns.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="mt-1 text-red-600">🤖</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.hebrewAnalysis.anglicisms.length > 0 && (
                        <div>
                          <div className="mb-2 text-xs font-medium text-gray-700">אנגליציזמים:</div>
                          <ul className="space-y-1">
                            {analysis.hebrewAnalysis.anglicisms.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="mt-1 text-blue-600">🔤</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* המלצות */}
                {analysis.recommendations.strengths.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">נקודות חוזק</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 text-green-600">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations.improvements.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">נקודות לשיפור</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 text-orange-600">→</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations.suggestions.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">המלצות</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 text-indigo-600">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

