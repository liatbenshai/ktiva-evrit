'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';

export default function ImproveScript() {
  const [originalScript, setOriginalScript] = useState('');
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImprove = async () => {
    if (!originalScript.trim()) {
      alert('נא להדביק את התסריט שברצונך לשפר');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'improve',
          data: {
            text: originalScript,
            instructions: instructions || 'שפר את התסריט - הפוך אותו לזורם יותר, מעניין יותר ומקצועי יותר בעברית תקנית',
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: improvedScript } = await response.json();
      setResult(improvedScript);
    } catch (error) {
      alert('אירעה שגיאה בשיפור התסריט');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-cyan-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📋 התסריט המקורי
        </h2>
        
        <textarea
          value={originalScript}
          onChange={(e) => setOriginalScript(e.target.value)}
          placeholder="הדבק כאן את התסריט שברצונך לשפר..."
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
        />

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הנחיות לשיפור (אופציונלי)
          </label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="למשל: הפוך למשעשע יותר, הוסף הומור, קצר יותר..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleImprove}
          disabled={isGenerating}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              משפר את התסריט...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              שפר תסריט
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <>
          <div className="bg-white rounded-xl shadow-sm border-2 border-green-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ✨ התסריט המשופר
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                📋 העתק
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([result], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'תסריט-משופר.txt';
                  a.click();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                💾 הורד
              </button>
            </div>
          </div>

          {/* Additional Improvements */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-purple-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 שיפורים נוספים
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
                  context="שיפור תסריט"
                  category="scripts"
                  userId="default-user"
                  onVersionSelect={(version) => setResult(version)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* בוט AI לעזרה */}
      <AIChatBot 
        text={result || originalScript || ''}
        context={result ? 'שיפור תסריט' : 'יצירת תסריט'}
        userId="default-user"
      />
    </div>
  );
}