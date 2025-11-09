'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import { SynonymButton } from '@/components/SynonymButton';
import { usePatternSaver } from '@/hooks/usePatternSaver';
import PatternSaverPanel from '@/components/shared/PatternSaverPanel';

export default function CreateQuote() {
  const [clientName, setClientName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [services, setServices] = useState('');
  const [budget, setBudget] = useState('');
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const patternSaver = usePatternSaver({ source: 'quote', userId: 'default-user' });

  const handleGenerate = async () => {
    if (!clientName.trim() || !projectDescription.trim() || !services.trim()) {
      alert('נא למלא את כל השדות החובה');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote',
          data: {
            clientName,
            projectDescription,
            services,
            budget,
            additionalTerms,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: generatedQuote } = await response.json();
      setResult(generatedQuote);
      patternSaver.resetPatternSaved();
    } catch (error) {
      alert('אירעה שגיאה ביצירת הצעת המחיר');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          פרטי הצעת המחיר
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם הלקוח *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="שם החברה או שם פרטי"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תיאור הפרויקט *
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="תאר את הפרויקט: מה המטרה? מה הצרכים? מה היקף העבודה?"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שירותים מבוקשים *
            </label>
            <textarea
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="פרט את השירותים, לדוגמה: &#10;- פיתוח אתר &#10;- עיצוב גרפי &#10;- ייעוץ שיווקי"
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תקציב משוער (אופציונלי)
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="לדוגמה: 50,000 ₪ או טווח: 30,000-50,000 ₪"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תנאים נוספים (אופציונלי)
            </label>
            <textarea
              value={additionalTerms}
              onChange={(e) => setAdditionalTerms(e.target.value)}
              placeholder="לדוגמה: תנאי תשלום, לוחות זמנים, אחריות, תמיכה..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !clientName.trim() || !projectDescription.trim() || !services.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                יוצר הצעת מחיר...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                צור הצעת מחיר
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              הצעת המחיר שנוצרה
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              dir="rtl"
              onMouseUp={patternSaver.handleSelection}
              onKeyUp={patternSaver.handleSelection}
              onTouchEnd={patternSaver.handleSelection}
            />
            <p className="mt-2 text-sm text-gray-500">
              ניתן לערוך את הצעת המחיר ישירות בשדה
            </p>
          </div>

          <PatternSaverPanel
            sourceLabel="הצעת מחיר"
            selectedText={patternSaver.selectedText}
            onSelectedTextChange={patternSaver.setSelectedText}
            patternCorrection={patternSaver.patternCorrection}
            onPatternCorrectionChange={patternSaver.setPatternCorrection}
            onSave={patternSaver.handleSavePattern}
            isSaving={patternSaver.isSavingPattern}
            patternSaved={patternSaver.patternSaved}
          />

          {/* Improvement Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 שיפור אוטומטי
            </h3>
            <div className="space-y-4">
              <ImprovementButtons
                content={result}
                documentType="quote"
                onImprove={(improved) => setResult(improved)}
              />
              <div className="flex justify-center">
                <SynonymButton
                  text={result}
                  context={`הצעת מחיר ל-${clientName}`}
                  category="quotes"
                  userId="default-user"
                  onVersionSelect={(version) => setResult(version)}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן
            </p>
          </div>

          {/* Tips */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-900 mb-3">💡 טיפים להצעת מחיר מנצחת:</h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>הדגש את הערך המוסף - לא רק את המחיר</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>פרט כל שירות בנפרד - שקיפות בונה אמון</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>הוסף תנאי תשלום ברורים ולוח זמנים מפורט</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>כלול אפשרויות/חבילות - תן ללקוח לבחור</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>ציין תוקף ההצעה (בדרך כלל 30 יום)</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}