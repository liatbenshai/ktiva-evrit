'use client';

import { useState } from 'react';
import { Reply, Loader2 } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';

export default function ReplyEmail() {
  const [receivedEmail, setReceivedEmail] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('מקצועי');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!receivedEmail.trim()) {
      alert('נא להדביק את המייל שקיבלת');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          data: {
            context: `ענה למייל הבא:\n\n${receivedEmail}\n\nהנחיות למענה: ${instructions || 'מענה מקצועי ומנומס'}`,
            recipient: 'השולח',
            tone,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: generatedReply } = await response.json();
      setResult(generatedReply);
    } catch (error) {
      alert('אירעה שגיאה ביצירת המענה');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          המייל שקיבלתי
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הדבק את המייל שקיבלת *
            </label>
            <textarea
              value={receivedEmail}
              onChange={(e) => setReceivedEmail(e.target.value)}
              placeholder="הדבק כאן את המייל המלא שקיבלת..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הנחיות למענה (אופציונלי)
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="לדוגמה: 'אשר קבלה', 'סרב בנימוס', 'בקש פרטים נוספים'..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              טון
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="מקצועי">מקצועי</option>
              <option value="ידידותי">ידידותי</option>
              <option value="פורמלי">פורמלי</option>
              <option value="מנומס">מנומס</option>
              <option value="ישיר">ישיר</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !receivedEmail.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                יוצר מענה...
              </>
            ) : (
              <>
                <Reply className="w-5 h-5" />
                צור מענה
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
              המענה שנוצר
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 שיפור אוטומטי
            </h3>
            <div className="space-y-4">
              <ImprovementButtons
                content={result}
                documentType="email"
                onImprove={(improved) => setResult(improved)}
              />
              <div className="flex justify-center">
                <SynonymButton
                  text={result}
                  context={`מענה למייל ${tone}`}
                  category="emails"
                  userId="default-user"
                  onVersionSelect={(version) => setResult(version)}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן
            </p>
          </div>
        </>
      )}

      {/* בוט AI לעזרה */}
      <AIChatBot 
        text={result || ''}
        context={result ? 'מענה למייל' : 'יצירת מענה למייל'}
        userId="default-user"
      />
    </div>
  );
}