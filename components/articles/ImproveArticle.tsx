'use client';

import { useState, useRef } from 'react';
import { Loader2, Wand2, Upload, Sparkles } from 'lucide-react';
import ArticleEditor from './ArticleEditor';
import { extractTextFromImageClient, processImagesFromBase64Legacy } from '@/lib/ocr-client';

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

        // If the document contains images, process them with OCR
        if (result.hasImages && result.images && result.images.length > 0) {
          alert(`נמצאו ${result.images.length} תמונות במסמך. מעבד תמונות... זה עלול לקחת זמן.`);
          try {
            const imagesText = await processImagesFromBase64Legacy(result.images);
            if (imagesText && imagesText.trim()) {
              text = text ? `${text}\n\n${imagesText}` : imagesText;
            }
          } catch (error) {
            console.error('Error processing images from DOCX:', error);
            // Continue with text even if image processing fails
          }
        }
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

  const wordCount = existingContent.trim() ? existingContent.trim().split(/\s+/).length : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/30 shadow-lg">
      <div className="p-6 sm:p-8">
        <h2 className="mb-6 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent">
          שיפור מאמר קיים
        </h2>

        <div className="space-y-5">
          {/* Existing Content */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              הדבק את המאמר הקיים <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={existingContent}
              onChange={(e) => setExistingContent(e.target.value)}
              placeholder="הדבק כאן את המאמר שברצונך לשפר..."
              rows={12}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-base"
              dir="rtl"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-all hover:border-sky-300 hover:bg-sky-100/60"
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
            {wordCount > 0 && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  {wordCount} מילים
                </span>
              </div>
            )}
          </div>

          {/* Keywords (optional for improvement) */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              מילות מפתח (אופציונלי)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="הפרד בפסיקים: SEO, קידום אתרים, כתיבת תוכן"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-base"
              dir="rtl"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              אם תוסיף מילות מפתח, המערכת תשלב אותן באופן טבעי במאמר
            </p>
          </div>

          {/* Improvement Instructions */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              הנחיות לשיפור (אופציונלי)
            </label>
            <textarea
              value={improveInstructions}
              onChange={(e) => setImproveInstructions(e.target.value)}
              placeholder="לדוגמה: התמקד בשיפור הניסוח, הוסף כותרות משנה, שפר את המבנה"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-base"
              dir="rtl"
            />
          </div>

          {/* Improve Button */}
          <button
            onClick={handleImprove}
            disabled={isImproving || !existingContent.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {isImproving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                משפר מאמר...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                שפר מאמר
              </>
            )}
          </button>

          {/* Improvement Info */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-900">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              מה המערכת תעשה?
            </h3>
            <ul className="space-y-1.5 text-sm text-emerald-800">
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
    </div>
  );
}
