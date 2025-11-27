'use client';

import { useState, useRef } from 'react';
import { Loader2, Wand2, Upload } from 'lucide-react';
import ArticleEditor from './ArticleEditor';
import { extractTextFromImageClient } from '@/lib/ocr-client';

export default function ImproveArticle() {
  const [existingContent, setExistingContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [improveInstructions, setImproveInstructions] = useState('');
  const [improvedContent, setImprovedContent] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.match(/\.(pdf|docx|txt|jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i)) {
      alert('נא להעלות קובץ מסוג: PDF, DOCX, TXT או תמונה (JPG, PNG וכו\')');
      return;
    }

    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i.test(file.name);

    try {
      let text = '';
      
      if (isImage) {
        alert('מעבד תמונה... זה עלול לקחת כמה שניות.');
        text = await extractTextFromImageClient(file);
      } else {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to process file');
        }

        const result = await response.json();
        text = result.text;
      }

      setExistingContent(text);
      alert('הקובץ נקרא בהצלחה! הטקסט הועתק לשדה המאמר.');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

  const handleImprove = async () => {
    if (!existingContent.trim()) {
      alert('נא להדביק טקסט לשיפור');
      return;
    }

    setIsImproving(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'improve',
          data: {
            text: existingContent,
            instructions: improveInstructions || 'שפר את המאמר לעברית תקנית וזורמת, התאם ל-SEO בסטנדרטים של Yoast, שמור על המסר המקורי אך שפר את הניסוח, הבהרה והמבנה',
            keywords,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to improve');

      const { result } = await response.json();
      setImprovedContent(result);
    } catch (error) {
      console.error('Error:', error);
      alert('אירעה שגיאה בשיפור המאמר');
    } finally {
      setIsImproving(false);
    }
  };

  if (improvedContent) {
    return (
      <ArticleEditor
        initialContent={improvedContent}
        title="מאמר משופר"
        keywords={keywords ? keywords.split(',').map(k => k.trim()) : []}
        onBack={() => setImprovedContent('')}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        שיפור מאמר קיים
      </h2>

      <div className="space-y-6">
        {/* Existing Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הדבק את המאמר הקיים <span className="text-red-500">*</span>
          </label>
          <textarea
            value={existingContent}
            onChange={(e) => setExistingContent(e.target.value)}
            placeholder="הדבק כאן את המאמר שברצונך לשפר..."
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            dir="rtl"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-50"
            >
              <Upload className="h-4 w-4" />
              העלה קובץ (PDF / DOCX / TXT / תמונות)
            </button>
            <span className="text-xs text-gray-500">הטקסט ייכנס לשדה המאמר</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="mt-1 text-sm text-gray-500">
            {existingContent.trim().split(/\s+/).length} מילים
          </p>
        </div>

        {/* Keywords (optional for improvement) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מילות מפתח (אופציונלי)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="הפרד בפסיקים: SEO, קידום אתרים, כתיבת תוכן"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            dir="rtl"
          />
          <p className="mt-1 text-sm text-gray-500">
            אם תוסיף מילות מפתח, המערכת תשלב אותן באופן טבעי במאמר
          </p>
        </div>

        {/* Improvement Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הנחיות לשיפור (אופציונלי)
          </label>
          <textarea
            value={improveInstructions}
            onChange={(e) => setImproveInstructions(e.target.value)}
            placeholder="לדוגמה: התמקד בשיפור הניסוח, הוסף כותרות משנה, שפר את המבנה"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            dir="rtl"
          />
        </div>

        {/* Improve Button */}
        <button
          onClick={handleImprove}
          disabled={isImproving || !existingContent.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          {isImproving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              משפר מאמר...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              שפר מאמר
            </>
          )}
        </button>

        {/* Improvement Info */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">✨ מה המערכת תעשה?</h3>
          <ul className="space-y-1 text-sm text-green-800">
            <li>• תתקן שגיאות דקדוק וכתיב</li>
            <li>• תשפר את הניסוח לעברית תקנית וזורמת</li>
            <li>• תמנע מתרגום מילולי מאנגלית</li>
            <li>• תשפר את המבנה וההבהרה</li>
            <li>• תתאים את המאמר לסטנדרטים של SEO ו-Yoast</li>
            <li>• תשלב מילות מפתח באופן טבעי (אם הוספת)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}