'use client';

import React, { useState } from 'react';
import { Home, Sparkles, Copy, Check, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageHeader, { PageHeaderLink } from '@/components/layout/PageHeader';

interface ContentChange {
  type: 'style' | 'tone' | 'clarity' | 'grammar' | 'terminology' | 'other';
  description: string;
  original?: string;
  improved?: string;
}

interface ContentSource {
  title: string;
  url: string;
}

interface ContentImprovement {
  improvedText: string;
  changes: ContentChange[];
  explanation: string;
  additionalRecommendations: string[];
  overallScore: number;
}

const PROFESSIONS = [
  'כללי',
  'משפטים',
  'רפואה',
  'חינוך',
  'טכנולוגיה',
  'שיווק',
  'עסקים',
  'אקדמיה',
  'עיתונות',
  'תקשורת',
  'אחר',
];

export default function ContentImprovementPage() {
  const [text, setText] = useState('');
  const [profession, setProfession] = useState('כללי');
  const [customProfession, setCustomProfession] = useState('');
  const [goal, setGoal] = useState('');
  const [improvement, setImprovement] = useState<ContentImprovement | null>(null);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImprove = async () => {
    if (!text.trim()) {
      setError('נא להזין טקסט לשיפור');
      return;
    }

    if (profession === 'אחר' && !customProfession.trim() && !goal.trim()) {
      setError('נא להזין מקצוע או מטרה');
      return;
    }

    setIsImproving(true);
    setError(null);
    setImprovement(null);
    setSources([]);
    setCopied(false);

    try {
      const selectedProfession = profession === 'אחר' ? customProfession : profession;
      const response = await fetch('/api/content-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          profession: selectedProfession !== 'כללי' ? selectedProfession : undefined,
          goal: goal || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשיפור התוכן');
      }

      const data = await response.json();
      setImprovement(data.improvement);
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err.message || 'שגיאה בשיפור התוכן');
      console.error('Error improving content:', err);
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopy = async () => {
    if (!improvement) return;
    try {
      await navigator.clipboard.writeText(improvement.improvedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      style: 'סגנון',
      tone: 'טון',
      clarity: 'בהירות',
      grammar: 'דקדוק',
      terminology: 'טרמינולוגיה',
      other: 'אחר',
    };
    return labels[type] || type;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <PageHeader
        icon={Sparkles}
        title="שיפור תוכן"
        description="הזיני טקסט ובחרי מקצוע או מטרה, והמערכת תשפר את התוכן בהתאם."
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
          {/* Input Panel */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">הזנת תוכן</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="text" className="mb-2 block text-sm font-medium text-gray-700">
                  הטקסט לשיפור
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="הזיני את הטקסט שברצונך לשפר..."
                  className="min-h-[200px] w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  dir="rtl"
                />
              </div>

              <div>
                <label htmlFor="profession" className="mb-2 block text-sm font-medium text-gray-700">
                  מקצוע
                </label>
                <select
                  id="profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {PROFESSIONS.map((prof) => (
                    <option key={prof} value={prof}>
                      {prof}
                    </option>
                  ))}
                </select>
              </div>

              {profession === 'אחר' && (
                <div>
                  <label htmlFor="customProfession" className="mb-2 block text-sm font-medium text-gray-700">
                    הזני מקצוע מותאם
                  </label>
                  <input
                    id="customProfession"
                    type="text"
                    value={customProfession}
                    onChange={(e) => setCustomProfession(e.target.value)}
                    placeholder="לדוגמה: אדריכלות, פסיכולוגיה..."
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    dir="rtl"
                  />
                </div>
              )}

              <div>
                <label htmlFor="goal" className="mb-2 block text-sm font-medium text-gray-700">
                  מטרה (אופציונלי)
                </label>
                <input
                  id="goal"
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="לדוגמה: שכנוע לקוחות, הסבר טכני, תוכן שיווקי..."
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  dir="rtl"
                />
              </div>

              <Button
                onClick={handleImprove}
                disabled={isImproving || !text.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isImproving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    משפר...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-4 w-4" />
                    שפר תוכן
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </Card>

          {/* Results Panel */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">תוצאות שיפור</h2>

            {!improvement && (
              <div className="flex min-h-[300px] items-center justify-center text-gray-400">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">התוצאות יופיעו כאן לאחר השיפור</p>
                </div>
              </div>
            )}

            {improvement && (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="rounded-lg bg-indigo-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">ציון איכות:</span>
                    <span className={`text-lg font-bold ${getScoreColor(improvement.overallScore)}`}>
                      {improvement.overallScore}/100
                    </span>
                  </div>
                </div>

                {/* Improved Text */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">הטקסט המשופר</h3>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="ml-1 h-3 w-3" />
                          הועתק
                        </>
                      ) : (
                        <>
                          <Copy className="ml-1 h-3 w-3" />
                          העתק
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="min-h-[150px] rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                    {improvement.improvedText}
                  </div>
                </div>

                {/* Explanation */}
                {improvement.explanation && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">הסבר על השיפורים</h3>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
                      {improvement.explanation}
                    </div>
                  </div>
                )}

                {/* Changes */}
                {improvement.changes && improvement.changes.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">רשימת שינויים</h3>
                    <div className="space-y-2">
                      {improvement.changes.map((change, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {getChangeTypeLabel(change.type)}
                            </span>
                          </div>
                          <p className="text-gray-700">{change.description}</p>
                          {change.original && change.improved && (
                            <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                              <div>
                                <span className="text-xs font-medium text-red-600">לפני:</span>
                                <p className="text-xs text-gray-600">{change.original}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-green-600">אחרי:</span>
                                <p className="text-xs text-gray-600">{change.improved}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Recommendations */}
                {improvement.additionalRecommendations && improvement.additionalRecommendations.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">המלצות נוספות</h3>
                    <ul className="list-disc space-y-1 pr-5 text-sm text-gray-700">
                      {improvement.additionalRecommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {sources && sources.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">מקורות מידע שנמצאו</h3>
                    <div className="space-y-2 rounded-lg bg-blue-50 p-3">
                      {sources.map((source, idx) => (
                        <div key={idx} className="text-sm">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {source.title}
                          </a>
                        </div>
                      ))}
                    </div>
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

