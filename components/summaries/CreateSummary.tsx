'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Loader2, MessageSquare, Download, ChevronDown } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';
import { usePatternSaver, SavedPatternInfo } from '@/hooks/usePatternSaver';
import PatternSaverPanel from '@/components/shared/PatternSaverPanel';
import { processImagesFromBase64Legacy } from '@/lib/ocr-client';
import { exportToTXT, exportToWord, exportToPDF } from '@/lib/export-utils';

type InputMode = 'text' | 'file';

export default function CreateSummary() {
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const [length, setLength] = useState('בינוני');
  const [focusPoints, setFocusPoints] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

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
    source: 'summary',
    userId: 'default-user',
    onSuccess: (pattern) => {
      setResult((prev) => applyPatternToText(prev, pattern));
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.match(/\.(txt|docx|pdf)$/i)) {
      alert('נא להעלות קובץ מסוג: PDF, TXT או DOCX');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      let extractedText = result.text;
      
      // If the document contains images, process them with OCR
      if (result.hasImages && result.images && result.images.length > 0) {
        alert(`נמצאו ${result.images.length} תמונות במסמך. מעבד תמונות... זה עלול לקחת זמן.`);
        try {
          const imagesText = await processImagesFromBase64Legacy(result.images);
          if (imagesText && imagesText.trim()) {
            extractedText = extractedText ? `${extractedText}\n\n${imagesText}` : imagesText;
          }
        } catch (error) {
          console.error('Error processing images from DOCX:', error);
          // Continue with text even if image processing fails
        }
      }
      
      setText(extractedText);
      alert('הקובץ נקרא בהצלחה!');
    } catch (error) {
      console.error('Error reading file:', error);
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
      setSummaryHistory([{ question: 'סיכום ראשוני', answer: summary }]);
      patternSaver.resetPatternSaved();
    } catch (error) {
      alert('אירעה שגיאה ביצירת הסיכום');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim()) {
      alert('אנא הכנס שאלת המשך');
      return;
    }

    if (!result) {
      alert('יש ליצור סיכום ראשוני לפני שאילת שאלות המשך');
      return;
    }

    setIsAskingFollowUp(true);
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
            followUpQuestion: followUpQuestion.trim(),
            previousSummary: result,
            history: summaryHistory,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: answer } = await response.json();
      
      // Update history
      const updatedHistory = [
        ...summaryHistory,
        { question: followUpQuestion.trim(), answer },
      ];
      setSummaryHistory(updatedHistory);
      
      // Append the answer to the result
      setResult((prev) => `${prev}\n\n**${followUpQuestion.trim()}**\n\n${answer}`);
      setFollowUpQuestion('');
      patternSaver.resetPatternSaved();
    } catch (error) {
      alert('אירעה שגיאה בשאלת המשך');
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    if (!result) {
      alert('אין תוכן לייצוא');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `סיכום-${timestamp}`;
      
      if (format === 'txt') {
        exportToTXT(result, filename);
      } else if (format === 'docx') {
        await exportToWord(result, filename);
      } else if (format === 'pdf') {
        await exportToPDF(result, filename);
      }
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting:', error);
      alert(`שגיאה בייצוא: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                  PDF, DOCX, TXT
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                הסיכום
              </h3>
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>ייצוא</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => handleExport('txt')}
                      className="w-full text-right px-4 py-2 hover:bg-gray-100 transition-colors rounded-t-lg"
                    >
                      ייצוא ל-TXT
                    </button>
                    <button
                      onClick={() => handleExport('docx')}
                      className="w-full text-right px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      ייצוא ל-Word
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-right px-4 py-2 hover:bg-gray-100 transition-colors rounded-b-lg"
                    >
                      ייצוא ל-PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              onMouseUp={patternSaver.handleSelection}
              onKeyUp={patternSaver.handleSelection}
              onTouchEnd={patternSaver.handleSelection}
            />
          </div>

          {/* Follow-up Questions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              שאלות המשך
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFollowUp();
                    }
                  }}
                  placeholder="שאלי שאלה נוספת על הסיכום..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isAskingFollowUp}
                />
                <button
                  onClick={handleFollowUp}
                  disabled={isAskingFollowUp || !followUpQuestion.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAskingFollowUp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      שואל...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      שאל
                    </>
                  )}
                </button>
              </div>
              {summaryHistory.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">היסטוריית שאלות:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {summaryHistory.slice(1).map((item, index) => (
                      <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                        <p className="font-medium text-gray-700">שאלה: {item.question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <PatternSaverPanel
            sourceLabel="סיכום"
            selectedText={patternSaver.selectedText}
            onSelectedTextChange={patternSaver.setSelectedText}
            patternCorrection={patternSaver.patternCorrection}
            onPatternCorrectionChange={patternSaver.setPatternCorrection}
            onSave={patternSaver.handleSavePattern}
            isSaving={patternSaver.isSavingPattern}
            patternSaved={patternSaver.patternSaved}
          />

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