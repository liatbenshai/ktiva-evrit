'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, CheckCircle2, XCircle, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';

interface Option {
  id: string;
  title: string;
  description: string;
  example: string;
  pros: string[];
  cons: string[];
  recommended: boolean;
}

interface SuggestionsResponse {
  options: Option[];
  summary: string;
}

export default function WritingDecisionHelper() {
  const [dilemma, setDilemma] = useState('');
  const [context, setContext] = useState('');
  const [englishTerm, setEnglishTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!dilemma.trim()) {
      setError('נא להזין דילמה');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuggestions(null);

    try {
      const response = await fetch('/api/transcription/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dilemma, 
          context: context.trim() || undefined,
          englishTerm: englishTerm.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה ביצירת ההצעות');
      }

      if (data.success && data.data) {
        setSuggestions(data.data);
      } else {
        throw new Error('תשובה לא תקינה מהשרת');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'שגיאה ביצירת ההצעות');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-8 h-8" />
          <h1 className="text-3xl font-bold">💡 עוזר החלטות לניסוח וסימון</h1>
        </div>
        <p className="text-indigo-100 text-lg">
          עוזר להחלטות בניסוח וסימון - הציגי דילמה ואני אציע לך אפשרויות מעשיות
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div>
          <label htmlFor="dilemma" className="block text-sm font-semibold text-gray-700 mb-2">
            הדילמה שלי: *
          </label>
          <textarea
            id="dilemma"
            value={dilemma}
            onChange={(e) => setDilemma(e.target.value)}
            placeholder="לדוגמה: איך לסמן הערות של המתרגם בתמלול? איך לסמן כשמישהו נושם נשימה מהירה? איך לסמן חלקים לא ברורים בתמלול? איך לסמן שמות של אנשים? איך לסמן רעשי רקע?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="englishTerm" className="block text-sm font-semibold text-gray-700 mb-2">
            מילה/מונח באנגלית (אופציונלי):
          </label>
          <input
            id="englishTerm"
            type="text"
            value={englishTerm}
            onChange={(e) => setEnglishTerm(e.target.value)}
            placeholder="לדוגמה: gasping, stuttering, whispering, background noise..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            אם יש מילה באנגלית שמתארת במדויק את הפעולה או התופעה - זה יעזור להציע אפשרויות מדויקות יותר
          </p>
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-semibold text-gray-700 mb-2">
            פרטים נוספים שיכולים לעזור (אופציונלי):
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="לדוגמה: איזה סוג תמלול זה? (ראיונות, ישיבות, הרצאות...), איזה כלים אתן משתמשות? (Word, Google Docs...), איזה סגנון אתן מעדיפות? וכל מידע אחר שיכול לעזור להבין את ההקשר"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={3}
          />
          <p className="mt-1 text-xs text-gray-500">
            כל מידע נוסף שיכול לעזור להבין את ההקשר ולהציע אפשרויות מתאימות יותר
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !dilemma.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>יוצר אפשרויות...</span>
            </>
          ) : (
            <>
              <Lightbulb className="w-5 h-5" />
              <span>הציע אפשרויות</span>
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions && (
        <div className="space-y-6">
          {/* Summary */}
          {suggestions.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-blue-900 mb-2">📋 סיכום והמלצה:</h3>
              <p className="text-blue-800">{suggestions.summary}</p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            {suggestions.options.map((option, index) => (
              <div
                key={option.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  option.recommended
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        option.recommended
                          ? 'bg-green-500'
                          : 'bg-indigo-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {option.title}
                        {option.recommended && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            מומלץ
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{option.description}</p>
                </div>

                {/* Example */}
                {option.example && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-600">דוגמה:</span>
                      <button
                        onClick={() => copyToClipboard(option.example, `example-${option.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                      >
                        {copiedId === `example-${option.id}` ? (
                          <>
                            <Check className="w-4 h-4" />
                            הועתק
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            העתק
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-gray-800 font-mono text-sm whitespace-pre-wrap">
                      {option.example}
                    </p>
                  </div>
                )}

                {/* Pros and Cons */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Pros */}
                  {option.pros && option.pros.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-green-900">יתרונות:</h4>
                      </div>
                      <ul className="space-y-1">
                        {option.pros.map((pro, i) => (
                          <li key={i} className="text-green-800 text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-1">✓</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {option.cons && option.cons.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsDown className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-red-900">חסרונות:</h4>
                      </div>
                      <ul className="space-y-1">
                        {option.cons.map((con, i) => (
                          <li key={i} className="text-red-800 text-sm flex items-start gap-2">
                            <span className="text-red-600 mt-1">✗</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <div className="text-center pt-4">
            <button
              onClick={() => {
                setSuggestions(null);
                setDilemma('');
                setContext('');
                setEnglishTerm('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              התחל מחדש
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

