'use client';

import { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import ArticleEditor from './ArticleEditor';

export default function CreateArticle() {
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [wordCount, setWordCount] = useState('800');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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

      const { result } = await response.json();
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        יצירת מאמר חדש
      </h2>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            כותרת המאמר <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: איך לכתוב מאמר SEO מנצח"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            dir="rtl"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מילות מפתח <span className="text-red-500">*</span>
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
            הזן מילות מפתח מרכזיות ומילות מפתח זנב ארוך
          </p>
        </div>

        {/* Word Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מספר מילים משוער
          </label>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הנחיות נוספות (אופציונלי)
          </label>
          <textarea
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="לדוגמה: התמקד בטיפים מעשיים, כתוב בטון ידידותי, כלול דוגמאות"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            dir="rtl"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !title.trim() || !keywords.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              יוצר מאמר...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              צור מאמר
            </>
          )}
        </button>

        {/* SEO Tips */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 טיפים ל-SEO</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• השתמש במילות מפתח ארוכות (3-4 מילים) לתוצאות טובות יותר</li>
            <li>• מאמרים ארוכים יותר (1000+ מילים) נוטים לדרג טוב יותר</li>
            <li>• כלול מילות מפתח בכותרת ובכותרות משנה</li>
            <li>• המערכת תשלב את מילות המפתח באופן טבעי בטקסט</li>
          </ul>
        </div>
      </div>
    </div>
  );
}