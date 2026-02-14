'use client';

import { useState, useRef } from 'react';
import { Loader2, Wand2, Upload, Lightbulb } from 'lucide-react';
import ArticleEditor from './ArticleEditor';
import { extractTextFromImageClient, processImagesFromBase64Legacy } from '@/lib/ocr-client';

export default function CreateArticle() {
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [wordCount, setWordCount] = useState('800');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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

      setAdditionalInstructions((prev) => (prev ? `${prev}\n\n${text}` : text));
      alert('הקובץ נקרא בהצלחה! הטקסט נוסף להנחיות הנוספות.');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !keywords.trim()) {
      alert('נא למלא כותרת ומילות מפתח');
      return;
    }

    const wordCountNum = parseInt(wordCount);

    // Warning for very long articles
    if (wordCountNum > 2000) {
      const confirmed = confirm(
        `שים לב: ביקשת מאמר של ${wordCountNum} מילים.\n\n` +
        `מאמרים מעל 2000 מילים עלולים להיחתך באמצע.\n` +
        `מומלץ לחלק למספר מאמרים קצרים יותר.\n\n` +
        `האם להמשיך בכל זאת?`
      );
      if (!confirmed) return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'article',
          data: {
            title,
            keywords,
            wordCount: wordCountNum,
            additionalInstructions,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const { result, appliedPatterns } = await response.json();

      // הצגת הודעה אם הוחלו דפוסים
      if (appliedPatterns && appliedPatterns.length > 0) {
        console.log(`✅ הוחלו ${appliedPatterns.length} דפוסים שנלמדו על המאמר`);
      }

      setGeneratedContent(result);
    } catch (error) {
      console.error('Error:', error);
      alert('אירעה שגיאה ביצירת המאמר');
    } finally {
      setIsGenerating(false);
    }
  };

  if (generatedContent) {
    return (
      <ArticleEditor
        initialContent={generatedContent}
        title={title}
        keywords={keywords.split(',').map(k => k.trim())}
        onBack={() => setGeneratedContent('')}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/30 shadow-lg">
      <div className="p-6 sm:p-8">
        <h2 className="mb-6 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent">
          יצירת מאמר חדש
        </h2>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              כותרת המאמר <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: איך לכתוב מאמר SEO מנצח"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-base"
              dir="rtl"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              מילות מפתח <span className="text-rose-500">*</span>
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
              הזן מילות מפתח מרכזיות ומילות מפתח זנב ארוך
            </p>
          </div>

          {/* Word Count */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              מספר מילים משוער
            </label>
            <select
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-base"
              dir="rtl"
            >
              <option value="300">300 מילים (קצר)</option>
              <option value="500">500 מילים</option>
              <option value="800">800 מילים (אמצעי)</option>
              <option value="1000">1000 מילים</option>
              <option value="1500">1500 מילים (ארוך)</option>
              <option value="2000">2000+ מילים (מקיף)</option>
            </select>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              הנחיות נוספות (אופציונלי)
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="לדוגמה: התמקד בטיפים מעשיים, כתוב בטון ידידותי, כלול דוגמאות"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-base"
              dir="rtl"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-all hover:border-sky-300 hover:bg-sky-100/60"
              >
                <Upload className="h-4 w-4" />
                העלה קובץ (PDF / DOCX / TXT / תמונות)
              </button>
              <span className="text-xs text-gray-500">הטקסט ייכנס להנחיות הנוספות</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !title.trim() || !keywords.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                יוצר מאמר...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                צור מאמר
              </>
            )}
          </button>

          {/* SEO Tips */}
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-sky-900">
              <Lightbulb className="h-5 w-5 text-sky-600" />
              טיפים ל-SEO
            </h3>
            <ul className="space-y-1.5 text-sm text-sky-800">
              <li>• השתמש במילות מפתח ארוכות (3-4 מילים) לתוצאות טובות יותר</li>
              <li>• מאמרים ארוכים יותר (1000+ מילים) נוטים לדרג טוב יותר</li>
              <li>• כלול מילות מפתח בכותרת ובכותרות משנה</li>
              <li>• המערכת תשלב את מילות המפתח באופן טבעי בטקסט</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
