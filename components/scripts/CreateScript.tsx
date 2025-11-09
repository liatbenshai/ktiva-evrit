'use client';

import { useState } from 'react';
import { Film, Loader2, BookmarkPlus, Check } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';

export default function CreateScript() {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('2-3 דקות');
  const [audience, setAudience] = useState('סטודנטים בקורס מקוון');
  const [style, setStyle] = useState('מרצה מקצועי');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [patternCorrection, setPatternCorrection] = useState('');
  const [isSavingPattern, setIsSavingPattern] = useState(false);
  const [patternSaved, setPatternSaved] = useState(false);

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
      setPatternSaved(false);
    } catch (error) {
      alert('אירעה שגיאה ביצירת התסריט');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScriptSelection = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;
    const selection = textarea.value.substring(start, end).trim();
    if (selection.length === 0) return;
    setSelectedText(selection);
    setPatternCorrection(selection);
    setPatternSaved(false);
  };

  const handleSavePattern = async () => {
    if (!selectedText.trim()) {
      alert('סמני בתסריט את הביטוי הבעייתי כדי שנדע מה לשפר');
      return;
    }
    if (!patternCorrection.trim()) {
      alert('הזיני את הניסוח המתוקן');
      return;
    }

    setIsSavingPattern(true);
    try {
      const response = await fetch('/api/ai-correction/save-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: selectedText.trim(),
          correctedText: patternCorrection.trim(),
          userId: 'default-user',
          source: 'script',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save pattern');
      }

      setPatternSaved(true);
      alert('✅ הדפוס נשמר! התסריטים הבאים ילמדו מהעדפה הזאת.');
    } catch (error) {
      console.error('Error saving script pattern:', error);
      const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בשמירת הדפוס: ${message}`);
    } finally {
      setIsSavingPattern(false);
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
              onMouseUp={handleScriptSelection}
              onKeyUp={handleScriptSelection}
              onTouchEnd={handleScriptSelection}
            />
            <p className="mt-2 text-sm text-gray-500">
              ניתן לערוך את התסריט ישירות בשדה
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5 text-blue-600" />
              שמירת דפוס שנלמד מתסריט זה
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              סמני בתסריט למעלה ניסוח בעייתי, הזיני את הניסוח המתוקן ולחצי על "שמרי דפוס". הדפוס ישמש גם בתסריטים, מאמרים ותכנים אחרים.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הניסוח שסימנת</label>
                <textarea
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="לדוגמה: קיבלתי החלטה"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הניסוח הרצוי (המתוקן)</label>
                <textarea
                  value={patternCorrection}
                  onChange={(e) => setPatternCorrection(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="לדוגמה: החלטתי"
                  dir="rtl"
                />
              </div>

              <button
                type="button"
                onClick={handleSavePattern}
                disabled={isSavingPattern || !selectedText.trim() || !patternCorrection.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingPattern ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    שומרת דפוס...
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    שמרי דפוס
                  </>
                )}
              </button>

              {patternSaved && (
                <p className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  הדפוס נשמר בהצלחה! תוכן עתידי יימנע מהניסוח שסימנת.
                </p>
              )}
            </div>
          </div>

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