'use client';

import { useState } from 'react';
import { FileText, Users, ListChecks, Loader2 } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';

type ProtocolType = 'summary' | 'topical';

export default function CreateProtocol() {
  const [protocolType, setProtocolType] = useState<ProtocolType>('summary');
  const [transcript, setTranscript] = useState('');
  const [includeDecisions, setIncludeDecisions] = useState(true);
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      alert('נא להדביק תמלול');
      return;
    }

    setIsGenerating(true);
    try {
      let instructions = '';
      
      if (protocolType === 'summary') {
        instructions = `צור פרוטוקול מסכם מהתמלול הבא.

⚠️ **חוק זהב - אל תשכח!**
כתוב את הדברים בדיוק כפי שהדובר אמר אותם - בגוף ראשון!

❌ **לעולם לא לכתוב כך:**
ד"ר ויל: שאל שאלות על הנושא
שרה: הציעה לדון בתקציב
יוסי: אמר שהוא מסכים

✅ **תמיד לכתוב כך:**
ד"ר ויל: אני רוצה לשאול כמה שאלות על הנושא
שרה: אני מציעה לדון בתקציב
יוסי: אני מסכים

**הוראות מפורשות:**

1. **שמור על גוף ראשון (אני, אנחנו):**
   - אל תתרגם לגוף שלישי!
   - כתוב כאילו הדובר עצמו כותב את הדברים
   - השתמש ב: "אני", "אנחנו", "לדעתי", "אני חושב/ת"

2. **דוגמאות להמרה נכונה:**
   
   אם בתמלול:
   "ירון: אני חושב שצריך להגדיל את התקציב ב-20%"
   
   כתוב בפרוטוקול:
   ירון: אני חושב שצריך להגדיל את התקציב ב-20%
   
   ---
   
   אם בתמלול:
   "שלומית: אנחנו צריכים לשקול את ההצעה בזהירות"
   
   כתוב בפרוטוקול:
   שלומית: אנחנו צריכים לשקול את ההצעה בזהירות

3. **מותר לקצר אבל:**
   - לא לשנות מגוף ראשון לגוף שלישי
   - דוגמה:
     תמלול: "אני רוצה להגיד שאני חושב שזה רעיון מצוין ואני תומך בו לגמרי"
     פרוטוקול: ✅ "אני חושב שזה רעיון מצוין ואני תומך בו"
     פרוטוקול: ❌ "הוא חושב שזה רעיון מצוין"

4. **מבנה הפרוטוקול:**

**נושאים שנדונו:**
1. [נושא ראשון]
2. [נושא שני]

---

**1. [שם הנושא]**

[שם דובר]: [מה שהוא אמר בגוף ראשון]

[שם דובר]: [מה שהוא אמר בגוף ראשון]

${includeDecisions ? 'החלטה: [פירוט ההחלטה]' : ''}

**2. [שם הנושא השני]**

[שם דובר]: [מה שהוא אמר בגוף ראשון]

---

${includeDecisions ? '**סיכום החלטות:**\n1. [החלטה ראשונה]\n2. [החלטה שנייה]\n' : ''}

**התמלול המלא לעיבוד:**

${transcript}

זכור: גוף ראשון בלבד! "אני", "אנחנו", "לדעתי" - לא "הוא אמר", "היא הציעה"!`;
      } else {
        instructions = `צור פרוטוקול נושאי מהתמלול הבא:

הנחיות:
- סדר לפי נושאים שנדונו
- עבור כל נושא, סכם מה שנאמר על ידי כל הדוברים
- אל תציין שמות דוברים - כתוב בצורה כללית
- כלול החלטות רלוונטיות ומשימות לכל נושא

דוגמה לפורמט:
1. דיון בנושא המלצות ועדת ביקורת
הדירקטוריון דן בהצעות ועדת הביקורת והחליט לקבלן. נושאים שהועלו על ידי חלק מהדירקטורים התייחסו לנקודות הבאות: שיפור התהליך, העלאת מודעות...

תמלול:
${transcript}`;
      }

      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'protocol',
          data: {
            transcript: instructions,
            includeDecisions,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: protocol } = await response.json();
      setResult(protocol);
    } catch (error) {
      alert('אירעה שגיאה ביצירת הפרוטוקול');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Protocol Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          סוג פרוטוקול
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setProtocolType('summary')}
            className={`flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all text-right ${
              protocolType === 'summary'
                ? 'bg-blue-600 text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="font-bold text-lg">פרוטוקול מסכם</span>
            </div>
            <p className={`text-sm ${protocolType === 'summary' ? 'text-white/90' : 'text-gray-600'}`}>
              סיכום עיקרי הדברים מסודר לפי נושאים. כולל נקודות מרכזיות, החלטות ומשימות.
              <strong> כתוב בשם אומרם</strong> אך מקוצר.
            </p>
          </button>

          <button
            onClick={() => setProtocolType('topical')}
            className={`flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all text-right ${
              protocolType === 'topical'
                ? 'bg-green-600 text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ListChecks className="w-6 h-6" />
              <span className="font-bold text-lg">פרוטוקול נושאי</span>
            </div>
            <p className={`text-sm ${protocolType === 'topical' ? 'text-white/90' : 'text-gray-600'}`}>
              מסודר לפי נושאים עם סיכום מה שנאמר בכל נושא. כולל החלטות ומשימות.
              <strong> ללא ציון שמות</strong> דוברים.
            </p>
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          תמלול הישיבה
        </h2>
        
        <div className="space-y-4">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="הדבק כאן את התמלול המלא של הישיבה..."
            rows={15}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeDecisions"
              checked={includeDecisions}
              onChange={(e) => setIncludeDecisions(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeDecisions" className="text-sm text-gray-700">
              כלול החלטות שהתקבלו
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !transcript.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                יוצר פרוטוקול...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                צור פרוטוקול
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
              {protocolType === 'summary' ? 'פרוטוקול מסכם' : 'פרוטוקול נושאי'}
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 שיפור אוטומטי
            </h3>
            <ImprovementButtons
              content={result}
              documentType="protocol"
              onImprove={(improved) => setResult(improved)}
            />
            <p className="mt-3 text-sm text-gray-500">
              המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן
            </p>
          </div>
        </>
      )}
    </div>
  );
}