'use client';

import { useState } from 'react';
import { FileText, Upload, Loader2 } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';

type InputMode = 'text' | 'file';

export default function CreateSummary() {
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const [length, setLength] = useState('בינוני');
  const [focusPoints, setFocusPoints] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔵 handleFileUpload called!');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('🔴 No file selected');
      return;
    }

    console.log('🟢 File selected:', file.name, file.type, file.size);

    // Check file type
    if (!file.name.match(/\.(txt|docx)$/i)) {
      alert('נא להעלות קובץ מסוג: TXT או DOCX');
      return;
    }

    console.log('🟢 File type valid, sending to server...');

    try {
      // Send file to server for processing
      const formData = new FormData();
      formData.append('file', file);

      console.log('🟡 Calling /api/upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('🟡 Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      console.log('🟢 Response data:', result);

      const { text: extractedText } = result;
      setText(extractedText);
      alert('הקובץ נקרא בהצלחה!');
    } catch (error) {
      console.error('🔴 Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      alert('נא להזין טקסט לסיכום');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          data: { 
            text: text, 
            length, 
            focusPoints,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: summary } = await response.json();
      setResult(summary);
    } catch (error) {
      alert('אירעה שגיאה ביצירת הסיכום');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Mode Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          בחר מקור
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('text')}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              mode === 'text'
                ? 'bg-blue-600 text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className="w-8 h-8" />
            <span>טקסט</span>
          </button>
          
          <button
            onClick={() => setMode('file')}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              mode === 'file'
                ? 'bg-blue-600 text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className="w-8 h-8" />
            <span>קובץ</span>
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          תוכן לסיכום
        </h2>
        
        <div className="space-y-4">
          {mode === 'text' && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="הדבק כאן את הטקסט שברצונך לסכם..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          )}

          {mode === 'file' && (
            <div>
              <label className="block w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <span className="text-gray-600">לחץ להעלאת קובץ</span>
                <p className="text-sm text-gray-500 mt-1">
                  TXT, DOCX
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".txt,.docx"
                  className="hidden"
                />
              </label>
              {text && (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נקודות מיקוד (אופציונלי)
            </label>
            <input
              type="text"
              value={focusPoints}
              onChange={(e) => setFocusPoints(e.target.value)}
              placeholder="על מה להתמקד בסיכום?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אורך הסיכום
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="קצר">קצר (נקודות עיקריות)</option>
              <option value="בינוני">בינוני (פסקה מפורטת)</option>
              <option value="ארוך">ארוך (סיכום מקיף)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                מסכם...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                צור סיכום
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
              הסיכום
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 שיפור אוטומטי
            </h3>
            <div className="space-y-4">
              <ImprovementButtons
                content={result}
                documentType="summary"
                onImprove={(improved) => setResult(improved)}
              />
              <div className="flex justify-center">
                <SynonymButton
                  text={result}
                  context="סיכום"
                  category="summaries"
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
        text={result || text || ''}
        context={result ? 'סיכום' : 'יצירת סיכום'}
        userId="default-user"
      />
    </div>
  );
}