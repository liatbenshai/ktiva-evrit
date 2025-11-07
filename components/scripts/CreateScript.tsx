'use client';

import { useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
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
  const [useTranscriptionKnowledge, setUseTranscriptionKnowledge] = useState(true);
  const [voicePersona, setVoicePersona] = useState('ליאת, מרצה לקורס תמלול מקוון');
  const [moduleTitle, setModuleTitle] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [workflowSteps, setWorkflowSteps] = useState('');
  const [keyTerminology, setKeyTerminology] = useState('');
  const [referenceExamples, setReferenceExamples] = useState('');
  const [practiceIdeas, setPracticeIdeas] = useState('');
  const [studentPainPoints, setStudentPainPoints] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [teleprompterNotesLevel, setTeleprompterNotesLevel] = useState<'basic' | 'detailed'>('detailed');
  const [referenceScript, setReferenceScript] = useState('');

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
            voicePersona,
            moduleTitle,
            learningObjectives,
            workflowSteps,
            keyTerminology,
            referenceExamples,
            practiceIdeas,
            studentPainPoints,
            callToAction,
            successCriteria,
            knowledgePack: useTranscriptionKnowledge ? 'transcriptionCourse' : 'general',
            teleprompterNotesLevel,
            referenceScript,
            userId: 'default-user',
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

            <div className="border-t border-gray-200 pt-6 mt-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">התאמת הקורס והתסריט</h3>
                  <p className="text-sm text-gray-600">
                    שיתופי פעולה עם חבילת הידע של הקורס ישמרו על קול אחיד, תהליך עבודה ברור ודגשים מקצועיים מתקדמים לתמלול.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={useTranscriptionKnowledge}
                    onChange={(e) => setUseTranscriptionKnowledge(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  השתמש בחבילת הידע של קורס התמלול
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    פרסונה / קול הדיבור
                  </label>
                  <input
                    type="text"
                    value={voicePersona}
                    onChange={(e) => setVoicePersona(e.target.value)}
                    placeholder='לדוגמה: "ליאת, מרצה מקוונת לתמלול – חמה, מקצועית ומשתפת תהליך"'
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מודול / שם השיעור
                  </label>
                  <input
                    type="text"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder='לדוגמה: "שיעור 4: סימני פיסוק וטעויות נפוצות"'
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    רמת פירוט הערות טלפרומפטר
                  </label>
                  <select
                    value={teleprompterNotesLevel}
                    onChange={(e) => setTeleprompterNotesLevel(e.target.value as 'basic' | 'detailed')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="detailed">פירוט מלא (הערות במה לכל קטע)</option>
                    <option value="basic">תמציתי (רק הערות חובה)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קריאה לפעולה בסיום (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    placeholder='לדוגמה: "שתפו את התמלול שלכם בקבוצת הקורס עד יום רביעי"'
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    יעדי למידה לשילוב בדיבור
                  </label>
                  <textarea
                    value={learningObjectives}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    placeholder="הפרידי בשורות: לדוגמה&#10;- להבין מתי מוסיפים טיים-קוד&#10;- לזהות מילים שאין צורך לתמלל"
                    rows={4}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שלבי עבודה / תהליך חובה
                  </label>
                  <textarea
                    value={workflowSteps}
                    onChange={(e) => setWorkflowSteps(e.target.value)}
                    placeholder="לדוגמה:&#10;- האזנה ראשונית מלאה&#10;- חלוקה לקטעים של 45 שניות&#10;- תיעוד טעויות נפוצות לתיקון בסוף"
                    rows={4}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מושגים / מונחים שחובה להזכיר
                  </label>
                  <textarea
                    value={keyTerminology}
                    onChange={(e) => setKeyTerminology(e.target.value)}
                    placeholder='לדוגמה: "טיים-קוד", "תמלול מילולי", "סימני פיסוק", "בקרת איכות"'
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    דוגמאות / קבצים להדגמה
                  </label>
                  <textarea
                    value={referenceExamples}
                    onChange={(e) => setReferenceExamples(e.target.value)}
                    placeholder='לדוגמה: "[מציגים על המסך: קובץ תמלול עם טעויות סימני פיסוק]"'
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תרגולים מודרכים בשידור
                  </label>
                  <textarea
                    value={practiceIdeas}
                    onChange={(e) => setPracticeIdeas(e.target.value)}
                    placeholder="לדוגמה: תרגול משותף על קטע שמע של 30 שניות, סימון מילים להדגשה"
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אתגרים של הסטודנטים שכדאי לענות עליהם
                  </label>
                  <textarea
                    value={studentPainPoints}
                    onChange={(e) => setStudentPainPoints(e.target.value)}
                    placeholder="לדוגמה: התמודדות עם דיבור מהיר, זיהוי דוברים חדשים, שמירה על אנרגיה לאורך ההקלדה"
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קריטריוני הצלחה לשיעור (אופציונלי)
                  </label>
                  <textarea
                    value={successCriteria}
                    onChange={(e) => setSuccessCriteria(e.target.value)}
                    placeholder='לדוגמה: "הסטודנט יודע להוסיף טיים-קוד בסימונים חשובים ולהבחין בין תמלול מילולי לערוך"'
                    rows={2}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תסריט קיים להשראה (לא יועתק)
                  </label>
                  <textarea
                    value={referenceScript}
                    onChange={(e) => setReferenceScript(e.target.value)}
                    placeholder="הדביקי כאן קטע קצר מהתסריט שלך כדי ללמד את המערכת את הקול והקצב (אופציונלי)"
                    rows={4}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                </div>
              </div>
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
            />
            <p className="mt-2 text-sm text-gray-500">
              ניתן לערוך את התסריט ישירות בשדה
            </p>
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