'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TranslationIssue {
  type: string;
  original: string;
  suggestion: string;
  confidence: number;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

interface AnalysisResult {
  issues: TranslationIssue[];
  score: number;
  suggestions: string[];
}

export default function AICorrector() {
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [learnedPatterns, setLearnedPatterns] = useState<Array<{
    from: string;
    to: string;
    confidence: number;
    occurrences?: number;
  }>>([]);
  const [autoSuggestions, setAutoSuggestions] = useState<{
    analyzedText: string;
    appliedPatterns: Array<{ from: string; to: string }>;
  } | null>(null);

  // ניתוח הטקסט
  const analyzeText = async () => {
    if (!originalText.trim()) {
      alert('אנא הכנס טקסט לניתוח');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai-correction/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          userId: 'default-user',
          applyPatterns: true,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || `שגיאת שרת: ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'הניתוח נכשל');
      }
      
      setAnalysis(data.analysis);
      setLearnedPatterns(data.learnedPatterns || []);
      
      if (data.result?.appliedPatterns?.length > 0) {
        setAutoSuggestions(data.result);
        setCorrectedText(data.result.analyzedText);
      } else {
        setCorrectedText(originalText);
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בניתוח הטקסט: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // שמירת התיקון
  const saveCorrection = async () => {
    if (!originalText.trim() || !correctedText.trim()) {
      alert('אנא וודא שיש טקסט מקורי וטקסט מתוקן');
      return;
    }

    if (originalText === correctedText) {
      alert('הטקסט המתוקן זהה למקורי - אין תיקון לשמור');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/ai-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText,
          correctedText,
          category: 'general',
          userId: 'default-user',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save correction');
      }

      const data = await response.json();
      alert('התיקון נשמר בהצלחה! המערכת למדה מהתיקון שלך.');
      
      if (data.learnedPatterns) {
        setLearnedPatterns(data.learnedPatterns);
      }

      // אין צורך לאפס - המשתמש יכול להמשיך לעבוד עם הטקסט הנוכחי או להכניס טקסט חדש
    } catch (error) {
      console.error('Error saving correction:', error);
      alert('שגיאה בשמירת התיקון');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* הוראות שימוש */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-bold mb-3">📖 איך זה עובד?</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>הדבק טקסט שנוצר על ידי AI בתיבה "טקסט מקורי מ-AI"</li>
          <li>לחץ על "🔍 נתח טקסט" כדי לקבל ניתוח מפורט</li>
          <li>המערכת תזהה בעיות ותחיל תיקונים אוטומטיים (אם יש דפוסים שנלמדו)</li>
          <li>ערוך את הטקסט בתיבה "טקסט מתוקן" אם צריך</li>
          <li>לחץ על "💾 שמור תיקון ולמד" כדי שהמערכת תלמד מהתיקון שלך</li>
        </ol>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* טקסט מקורי */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">📝 טקסט מקורי מ-AI</h2>
            {analysis && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">ציון:</span>
                <span className={`text-2xl font-bold ${
                  analysis.score >= 80 ? 'text-green-600' : 
                  analysis.score >= 60 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {analysis.score}
                </span>
              </div>
            )}
          </div>
          
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="הדבק כאן טקסט שנוצר על ידי AI...&#10;&#10;לדוגמה:&#10;זה מהווה את אחד הנושאים המשמעותיים ביותר בהתאם לנושא הזה."
            className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            dir="rtl"
          />

          <div className="flex gap-2">
            <Button
              onClick={analyzeText}
              disabled={isAnalyzing || !originalText.trim()}
              className="flex-1"
            >
              {isAnalyzing ? '🔍 מנתח...' : '🔍 נתח טקסט'}
            </Button>
            {originalText && (
              <Button
                onClick={() => {
                  setOriginalText('');
                  setCorrectedText('');
                  setAnalysis(null);
                  setAutoSuggestions(null);
                }}
                variant="outline"
                className="px-4"
                title="נקה הכל"
              >
                🗑️ נקה
              </Button>
            )}
          </div>
        </Card>

        {/* טקסט מתוקן */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">✅ טקסט מתוקן</h2>
            {autoSuggestions && autoSuggestions.appliedPatterns.length > 0 && (
              <span className="text-sm text-green-600 font-medium">
                {autoSuggestions.appliedPatterns.length} תיקונים אוטומטיים הוחלו
              </span>
            )}
          </div>
          
          <textarea
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
            placeholder="ערוך ותקן את הטקסט כאן..."
            className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            dir="rtl"
          />

          <Button
            onClick={saveCorrection}
            disabled={isSaving || !correctedText.trim() || originalText === correctedText}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSaving ? '💾 שומר...' : '💾 שמור תיקון ולמד'}
          </Button>
        </Card>
      </div>

      {/* תיקונים אוטומטיים שהוחלו */}
      {autoSuggestions && autoSuggestions.appliedPatterns.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold">🔄 תיקונים אוטומטיים שהוחלו (לפי למידה קודמת):</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {autoSuggestions.appliedPatterns.map((pattern, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-red-600 line-through">{pattern.from}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600 font-medium">{pattern.to}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ניתוח ובעיות */}
      {analysis && analysis.issues.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold">⚠️ בעיות שזוהו ({analysis.issues.length}):</h3>
          <div className="space-y-3">
            {analysis.issues.map((issue, idx) => (
              <div key={idx} className="p-4 bg-yellow-50 border-r-4 border-yellow-400 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                        {issue.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        ביטחון: {Math.round(issue.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm mb-2">{issue.explanation}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-600 font-medium">"{issue.original}"</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-medium">"{issue.suggestion}"</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* הצעות שיפור כלליות */}
      {analysis && analysis.suggestions.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold">💡 הצעות שיפור כלליות:</h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* דפוסים שנלמדו */}
      {learnedPatterns.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold">🧠 דפוסים שהמערכת למדה מהתיקונים שלך:</h3>
          <p className="text-sm text-gray-600">
            דפוסים אלו יוחלו אוטומטית בטקסטים עתידיים
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {learnedPatterns.slice(0, 9).map((pattern, idx) => (
              <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-purple-600 font-medium">
                    ביטחון: {Math.round(pattern.confidence * 100)}%
                  </span>
                  {pattern.occurrences && (
                    <span className="text-xs text-gray-500">
                      {pattern.occurrences}× שימוש
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-600">{pattern.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600 font-medium">{pattern.to}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

