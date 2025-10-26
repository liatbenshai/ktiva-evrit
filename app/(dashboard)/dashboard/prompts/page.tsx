'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Wand2, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function PromptsPage() {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!goal.trim() || !context.trim()) {
      alert('נא למלא מטרה והקשר');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'aiPrompt',
          data: {
            goal,
            context,
            outputFormat,
            additionalRequirements,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const { result } = await response.json();
      setGeneratedPrompt(result);
    } catch (error) {
      console.error('Error:', error);
      alert('אירעה שגיאה ביצירת ה-Prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowRight className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">כתיבת Prompts</h1>
              <p className="mt-2 text-gray-600">
                יצירת Prompts אפקטיביים למודלי AI
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              פרטי ה-Prompt
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מטרת ה-Prompt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="לדוגמה: לכתוב מאמר SEO, לסכם טקסט, ליצור קוד"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הקשר <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="תאר את ההקשר: למי מיועד, איזה תחום, מה המצב הנוכחי"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  פורמט הפלט הרצוי (אופציונלי)
                </label>
                <input
                  type="text"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="לדוגמה: JSON, Markdown, רשימה ממוספרת, טבלה"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  דרישות נוספות (אופציונלי)
                </label>
                <textarea
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="אורך, סגנון, טון, דוגמאות, אילוצים, וכו'"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  dir="rtl"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !goal.trim() || !context.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    יוצר Prompt...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    צור Prompt
                  </>
                )}
              </button>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <h3 className="font-semibold text-teal-900 mb-2">💡 טיפים</h3>
                <ul className="space-y-1 text-sm text-teal-800">
                  <li>• היה ספציפי ככל האפשר במטרה</li>
                  <li>• תן הקשר מפורט - זה עוזר ל-AI להבין טוב יותר</li>
                  <li>• ציין פורמט פלט אם חשוב לך</li>
                  <li>• ככל שתתן יותר פרטים, ה-Prompt יהיה טוב יותר</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                ה-Prompt שנוצר
              </h2>
              {generatedPrompt && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      הועתק!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      העתק
                    </>
                  )}
                </button>
              )}
            </div>
            {generatedPrompt ? (
              <div className="prose max-w-none" dir="rtl">
                <textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none font-mono text-sm bg-gray-50"
                  style={{ minHeight: '500px' }}
                  dir="ltr"
                />
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>איך להשתמש:</strong> העתק את ה-Prompt שנוצר והדבק אותו ל-ChatGPT, Claude, או כל מודל AI אחר. ניתן לערוך ולהתאים אותו לצרכים שלך.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                מלא את הפרטים ולחץ על &quot;צור Prompt&quot; כדי להתחיל
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}