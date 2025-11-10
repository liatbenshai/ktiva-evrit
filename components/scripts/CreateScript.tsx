'use client';

import { useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';
import { usePatternSaver, SavedPatternInfo } from '@/hooks/usePatternSaver';
import PatternSaverPanel from '@/components/shared/PatternSaverPanel';

export default function CreateScript() {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('2-3 דקות');
  const [audience, setAudience] = useState('סטודנטים בקורס מקוון');
  const [style, setStyle] = useState('מרצה מקצועי');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const applyPatternToText = (text: string, pattern: SavedPatternInfo) => {
    if (!text) return text;

    const { originalSelection, from, to } = pattern;

    if (originalSelection && text.includes(originalSelection)) {
      return text.replace(originalSelection, to);
    }

    if (from && text.includes(from)) {
      return text.replace(from, to);
    }

    return text;
  };

  const patternSaver = usePatternSaver({
    source: 'script',
    userId: 'default-user',
    onSuccess: (pattern) => {
      setResult((prev) => applyPatternToText(prev, pattern));
    },
  });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('נא להזין נושא לתסריט');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'script',
          data: {
            topic,
            duration,
            audience,
            style,
            additionalInstructions,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: generatedScript, appliedPatterns } = await response.json();
      
      // הצגת הודעה אם הוחלו דפוסים
      if (appliedPatterns && appliedPatterns.length > 0) {
        console.log(`✅ הוחלו ${appliedPatterns.length} דפוסים שנלמדו על התסריט`);
      }
      
      setResult(generatedScript);
      patternSaver.resetPatternSaved();
    } catch (error) {
      alert('אירעה שגיאה ביצירת התסריט');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          פרטי התסריט
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נושא התסריט *
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='לדוגמה: "הקלדה עיוורת - מיקום האצבעות", "שורת הבית והאותיות הבסיסיות", "טכניקות להגברת מהירות"...'
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                משך זמן
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="30 שניות">30 שניות</option>
                <option value="1 דקה">1 דקה</option>
                <option value="2-3 דקות">2-3 דקות</option>
                <option value="5 דקות">5 דקות</option>
                <option value="10 דקות">10 דקות</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קהל יעד
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="סטודנטים בקורס מקוון">סטודנטים בקורס מקוון</option>
                <option value="קהל רחב">קהל רחב</option>
                <option value="מקצועי">מקצועי</option>
                <option value="צעירים">צעירים (18-30)</option>
                <option value="מבוגרים">מבוגרים (40+)</option>
                <option value="עסקי">עסקי / B2B</option>
                <option value="לקוחות">לקוחות / B2C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סגנון
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="מרצה מקצועי">מרצה מקצועי (שפה מדוברת גבוהה וברורה)</option>
                <option value="מקצועי">מקצועי</option>
                <option value="ידידותי">ידידותי</option>
                <option value="משעשע">משעשע</option>
                <option value="דרמטי">דרמטי</option>
                <option value="חינוכי">חינוכי</option>
                <option value="מעורר השראה">מעורר השראה</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הנחיות נוספות (אופציונלי)
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder='דוגמאות: "כלול מונחים מקצועיים", "הוסף הומור קל", "התמקדי בשגיאות נפוצות", "הדגימי טכניקה איטית ומהירה"...'
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                יוצרת תסריט...
              </>
            ) : (
              <>
                <Film className="w-5 h-5" />
                צרי תסריט
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
              התסריט שנוצר
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              dir="rtl"
              onMouseUp={patternSaver.handleSelection}
              onKeyUp={patternSaver.handleSelection}
              onTouchEnd={patternSaver.handleSelection}
            />
            <p className="mt-2 text-sm text-gray-500">
              ניתן לערוך את התסריט ישירות בשדה
            </p>
          </div>

          <PatternSaverPanel
            sourceLabel="תסריט"
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
                documentType="script"
                onImprove={(improved) => setResult(improved)}
              />
              <div className="flex justify-center">
                <SynonymButton
                  text={result}
                  context={`תסריט: ${topic}`}
                  category="scripts"
                  userId="default-user"
                  onVersionSelect={(version) => setResult(version)}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן
            </p>
          </div>

          {/* Script Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">💡 טיפים לתסריט קורס:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>קראי את התסריט בקול רם - וודאי שהוא זורם טבעית וברור</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>שימי לב להערות הויזואליות [בסוגריים] - הן חשובות לעריכה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>וודאי שכל הסבר מלווה מיד בדוגמה או הדגמה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>הסיכום צריך להיות קצר וחוזר על 2-3 הנקודות העיקריות</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>זכרי: פתיח קצר → הסבר + דוגמאות → סיכום</span>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* בוט AI לעזרה */}
      <AIChatBot 
        text={result || ''}
        context={result ? `תסריט: ${topic}` : 'יצירת תסריט'}
        userId="default-user"
      />
    </div>
  );
}