'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Code2,
  Upload,
  FileCode,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react';

interface CodeIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  location: string;
  description: string;
  code?: string;
  fix?: string;
  explanation?: string;
}

interface CodeAnalysis {
  hasIssues: boolean;
  summary: string;
  issues: CodeIssue[];
  recommendations: string[];
  overallScore: number;
  rawResponse?: string;
}

export default function CodeReviewPage() {
  const [code, setCode] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Record<number, boolean>>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setUploadedFile(file);
    setAnalysis(null);

    // קרא את הקובץ לתצוגה מקדימה
    try {
      const text = await file.text();
      setCode(text);
    } catch (err: any) {
      setError('שגיאה בקריאת הקובץ: ' + err.message);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim() && !uploadedFile) {
      setError('נא להזין קוד או להעלות קובץ');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      if (uploadedFile) {
        // אם יש קובץ מקורי, שלח אותו
        formData.append('file', uploadedFile);
      } else if (code.trim()) {
        // אחרת, שלח את הקוד כטקסט
        formData.append('code', code);
      }

      const response = await fetch('/api/code-review', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בניתוח הקוד');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'שגיאה בניתוח הקוד');
      console.error('Error analyzing code:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleIssue = (index: number) => {
    setExpandedIssues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critical: 'קריטי',
      high: 'גבוה',
      medium: 'בינוני',
      low: 'נמוך',
      info: 'מידע',
    };
    return labels[severity] || severity;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">חזרה לדשבורד</span>
            </Link>
            <div className="flex items-center gap-2 text-indigo-600">
              <Code2 className="h-5 w-5" />
              <span className="text-sm font-semibold sm:text-base">בדיקת קוד</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl">בדיקת קוד מקצועית</h1>
            <p className="text-sm text-white/90 sm:text-base">
              העלי קובץ קוד או הדבקי קוד ישירות. המערכת תנתח את הקוד, תזהה בעיות, ותציע תיקונים מקצועיים.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* פאנל קלט */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileCode className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">קוד לבדיקה</h2>
            </div>

            {/* העלאת קובץ */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                העלאת קובץ קוד
              </label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  בחרי קובץ
                  <input
                    type="file"
                    className="hidden"
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.kt,.html,.css,.scss,.json,.xml,.yaml,.yml,.md,.sql,.sh,.bash,.ps1,.vue,.svelte"
                    onChange={handleFileUpload}
                  />
                </label>
                {fileName && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{fileName}</span>
                    <button
                      onClick={() => {
                        setFileName('');
                        setUploadedFile(null);
                        setCode('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="נקה קובץ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* או */}
            <div className="mb-4 text-center text-sm text-gray-500">או</div>

            {/* הזנת קוד ישירות */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                הדבקי קוד ישירות
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="הדבקי כאן את הקוד שברצונך לבדוק..."
                className="h-96 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !code.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מנתח קוד...
                </>
              ) : (
                <>
                  <Code2 className="ml-2 h-4 w-4" />
                  בדוק קוד
                </>
              )}
            </Button>
          </Card>

          {/* פאנל תוצאות */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">תוצאות הניתוח</h2>
            </div>

            {!analysis && !isAnalyzing && (
              <div className="flex h-96 items-center justify-center text-gray-400">
                <div className="text-center">
                  <Code2 className="mx-auto mb-2 h-12 w-12" />
                  <p>התוצאות יופיעו כאן לאחר הניתוח</p>
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                {/* ציון כללי */}
                <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">ציון כללי</span>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}/100
                    </span>
                  </div>
                </div>

                {/* סיכום */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">סיכום</h3>
                  <p className="text-sm text-gray-700">{analysis.summary}</p>
                </div>

                {/* בעיות */}
                {analysis.issues && analysis.issues.length > 0 ? (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                      בעיות שזוהו ({analysis.issues.length})
                    </h3>
                    <div className="space-y-3">
                      {analysis.issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`rounded-lg border p-4 ${getSeverityColor(issue.severity)}`}
                        >
                          <div
                            className="flex cursor-pointer items-start justify-between"
                            onClick={() => toggleIssue(index)}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold">
                                    {getSeverityLabel(issue.severity)}
                                  </span>
                                  <span className="text-xs text-gray-600">•</span>
                                  <span className="text-xs text-gray-600">{issue.type}</span>
                                  {issue.location && (
                                    <>
                                      <span className="text-xs text-gray-600">•</span>
                                      <span className="text-xs text-gray-600">{issue.location}</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm font-medium">{issue.description}</p>
                              </div>
                            </div>
                            <button className="text-gray-500 hover:text-gray-700">
                              {expandedIssues[index] ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Info className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {expandedIssues[index] && (
                            <div className="mt-3 space-y-3 border-t pt-3">
                              {issue.explanation && (
                                <div>
                                  <p className="mb-1 text-xs font-semibold">הסבר:</p>
                                  <p className="text-xs text-gray-700">{issue.explanation}</p>
                                </div>
                              )}

                              {issue.code && (
                                <div>
                                  <div className="mb-1 flex items-center justify-between">
                                    <p className="text-xs font-semibold">קוד בעייתי:</p>
                                    <button
                                      onClick={() => handleCopy(issue.code || '')}
                                      className="text-xs text-indigo-600 hover:text-indigo-700"
                                    >
                                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                  </div>
                                  <pre className="rounded bg-gray-900 p-2 text-xs text-gray-100 overflow-x-auto">
                                    <code>{issue.code}</code>
                                  </pre>
                                </div>
                              )}

                              {issue.fix && (
                                <div>
                                  <div className="mb-1 flex items-center justify-between">
                                    <p className="text-xs font-semibold">תיקון מוצע:</p>
                                    <button
                                      onClick={() => handleCopy(issue.fix || '')}
                                      className="text-xs text-indigo-600 hover:text-indigo-700"
                                    >
                                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                  </div>
                                  <pre className="rounded bg-green-900 p-2 text-xs text-gray-100 overflow-x-auto">
                                    <code>{issue.fix}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                      לא נמצאו בעיות בקוד!
                    </p>
                  </div>
                )}

                {/* המלצות */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                      המלצות לשיפור
                    </h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 text-indigo-600">•</span>
                          <span>{rec}</span>
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

