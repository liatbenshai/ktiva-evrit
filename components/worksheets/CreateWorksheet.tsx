'use client';

import { useState } from 'react';
import { FileText, Loader2, Printer, Copy, Check } from 'lucide-react';

export default function CreateWorksheet() {
  const [instruction, setInstruction] = useState('');
  const [story, setStory] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      alert('נא להזין הוראה ליצירת דף העבודה');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'worksheet',
          data: {
            instruction,
            story: story.trim() || undefined,
            grade: grade.trim() || undefined,
            subject: subject.trim() || undefined,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: generatedWorksheet } = await response.json();
      setResult(generatedWorksheet);
    } catch (error) {
      alert('אירעה שגיאה ביצירת דף העבודה');
    } finally {
      setIsGenerating(false);
    }
  };

  // פונקציה להמרת markdown בסיסי לטקסט נקי
  const cleanMarkdown = (text: string): string => {
    return text
      // הסרת ** (bold markdown)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      // הסרת * (italic markdown)  
      .replace(/\*(.+?)\*/g, '$1')
      // הסרת # (headers)
      .replace(/^#{1,6}\s+/gm, '')
      // הסרת --- (horizontal rules)
      .replace(/^---+/gm, '')
      // הסרת []() (links) - נשאיר רק הטקסט
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // ניקוי רווחים כפולים
      .replace(/\n{3,}/g, '\n\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanMarkdown(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // ניקוי markdown ואז escape ל-HTML
      const cleanedResult = cleanMarkdown(result);
      const escapedResult = cleanedResult
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>דף עבודה</title>
            <style>
              @media print {
                @page {
                  margin: 2cm;
                }
              }
              body {
                font-family: 'Arial', 'Helvetica', sans-serif;
                font-size: 16px;
                line-height: 1.8;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                color: #000;
              }
              h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 28px;
                font-weight: bold;
              }
              .student-name {
                margin-bottom: 30px;
                padding: 10px;
                border-bottom: 2px solid #333;
                font-size: 16px;
              }
              .question {
                margin: 25px 0;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #f9f9f9;
              }
              .answer-space {
                margin-top: 15px;
                min-height: 50px;
                border-bottom: 1px dashed #999;
                padding: 10px;
              }
            </style>
          </head>
          <body>
            ${escapedResult}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-yellow-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-yellow-600" />
            יצירת דף עבודה ללימודים
          </h2>
          <p className="text-gray-600">
            צרי דף עבודה מותאם אישית - לפי הוראה או על בסיס סיפור
          </p>
        </div>

        <div className="space-y-6">
          {/* הוראה */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הוראה * <span className="text-gray-500">(חובה)</span>
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="לדוגמה: הכן לי דפי עבודה לילד בכיתה ו' שלומד משוואות עם נעלם אחד, או כתוב שאלות ברמת כיתה ג'"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              dir="rtl"
            />
          </div>

          {/* סיפור (אופציונלי) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיפור (אופציונלי)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              אם תרצי ליצור שאלות על בסיס סיפור - הדביקי כאן את הסיפור
            </p>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="הדביקי כאן סיפור בעברית או באנגלית..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              dir={story && /^[\u0590-\u05FF\s]+$/.test(story.split('\n')[0]) ? 'rtl' : 'ltr'}
            />
          </div>

          {/* כיתה ומקצוע */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                רמת כיתה (אופציונלי)
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="למשל: כיתה ו', כיתה ג', גן"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מקצוע/נושא (אופציונלי)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="למשל: מתמטיקה, לשון, מדעים"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                dir="rtl"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !instruction.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                יוצר דף עבודה...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                צור דף עבודה
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-600" />
              דף העבודה שנוצר
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    העתק
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                הדפס
              </button>
            </div>
          </div>

          <div className="prose max-w-none">
            <div
              className="bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap text-base leading-relaxed"
              dir="rtl"
            >
              {cleanMarkdown(result).split('\n').map((line, index) => (
                <div key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>טיפ:</strong> לחצי על "הדפס" כדי להדפיס את דף העבודה בצורה מקצועית
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

