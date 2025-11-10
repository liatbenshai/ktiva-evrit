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
    <div className="space-y-10 rounded-3xl bg-gradient-to-br from-[#f7f4ff] via-white to-[#edf4ff] p-4 sm:p-6 lg:p-8 shadow-inner shadow-indigo-50">
      {/* Input Form */}
      <section className="rounded-3xl border border-indigo-100/60 bg-white/80 p-6 sm:p-8 shadow-xl shadow-indigo-100/50 backdrop-blur">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">הגדרת התסריט</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">בואי נבנה תסריט מצולם ב-3 דקות</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              מלאי את הפרטים החשובים – המערכת תייצר תסריט זורם, ותזכור את ההעדפות שלך גם לפעמים הבאות.
            </p>
          </div>
          <div className="hidden sm:block rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm font-medium text-indigo-600 shadow-inner shadow-indigo-100">
            ✨ ניתן לערוך ולשמור דפוסים בזמן אמת
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                נושא התסריט *
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='לדוגמה: "הקלדה עיוורת - מיקום האצבעות", "שורת הבית והאותיות הבסיסיות", "טכניקות להגברת מהירות"...'
                rows={3}
                className="w-full rounded-2xl border border-indigo-100 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  משך זמן
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                  className="w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                  className="w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                className="w-full rounded-2xl border border-indigo-100 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-700 shadow-inner shadow-indigo-100">
            <p>
              <span className="font-semibold text-indigo-600">טיפ:</span> ככל שתתני יותר הקשר – כך נוכל להתאים את התסריט למיתוג ולסגנון שלך. המערכת תזכור את ההעדפות לשימוש הבא.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300 transition-all hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
      </section>

      {/* Result */}
      {result && (
        <>
          <section className="rounded-3xl border border-slate-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-slate-100/60 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">התסריט שנוצר</h3>
                <p className="text-sm text-slate-500">אפשר לערוך כאן ישירות – כל שינוי ישפיע על הטקסט שבו נטפל בהמשך.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> טיול בזמן אמת
              </div>
            </div>

            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={20}
              className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-slate-800 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              dir="rtl"
              onMouseUp={patternSaver.handleSelection}
              onKeyUp={patternSaver.handleSelection}
              onTouchEnd={patternSaver.handleSelection}
            />
            <p className="mt-3 text-sm text-slate-500">
              ניתן לערוך את התסריט ישירות בשדה.
            </p>
          </section>

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

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 sm:p-8 shadow-lg shadow-slate-100/60">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                🤖 שיפור אוטומטי
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">התסריט לומד מזה</span>
              </h3>
              <div className="space-y-4">
                <ImprovementButtons
                  content={result}
                  documentType="script"
                  onImprove={(improved) => setResult(improved)}
                />
                <p className="text-sm text-slate-500">
                  המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 sm:p-8 shadow-lg shadow-slate-100/60">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">📝 גרסאות חלופיות</h3>
              <p className="text-sm text-slate-500">
                קבלי ניסוחים אחרים וחיזוקים לסגנון שלך דרך מילים נרדפות שמתאימות לתסריט הנוכחי.
              </p>
              <div className="mt-4 flex justify-center">
                <SynonymButton
                  text={result}
                  context={`תסריט: ${topic}`}
                  category="scripts"
                  userId="default-user"
                  onVersionSelect={(version) => setResult(version)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 sm:p-8 shadow-lg shadow-emerald-100/50">
            <h4 className="font-semibold text-emerald-800 mb-3">💡 טיפים לתסריט קורס</h4>
            <ul className="space-y-2 text-sm text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">•</span>
                <span>קראי את התסריט בקול – אם הוא זורם לך, הוא יישמע טבעי גם למאזינים.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">•</span>
                <span>הדגישי הערות בימוי [בסוגריים] – הן משפרות את החוויה בהקלטה.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">•</span>
                <span>צמדי כל רעיון לדוגמה מוחשית או סיפור קצר.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">•</span>
                <span>חתמי ב-2–3 נקודות עיקריות + קריאה לפעולה אם ישנה.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">•</span>
                <span>במידה והקצב חשוב – הוסיפי הערת זמן משוערת לכל חלק.</span>
              </li>
            </ul>
          </section>
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