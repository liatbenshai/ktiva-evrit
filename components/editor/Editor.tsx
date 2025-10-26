'use client';

import { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';

interface EditorProps {
  initialValue?: string;
  placeholder?: string;
  onGenerate?: (text: string) => Promise<string>;
  minHeight?: string;
}

export default function Editor({
  initialValue = '',
  placeholder = 'התחל לכתוב כאן...',
  onGenerate,
  minHeight = '400px',
}: EditorProps) {
  const [content, setContent] = useState(initialValue);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImprove = async () => {
    if (!content.trim() || !onGenerate) return;

    setIsGenerating(true);
    try {
      const improved = await onGenerate(content);
      setContent(improved);
    } catch (error) {
      console.error('Error improving text:', error);
      alert('אירעה שגיאה בשיפור הטקסט');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {onGenerate && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          <button
            onClick={handleImprove}
            disabled={isGenerating || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                משפר...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                שפר טקסט
              </>
            )}
          </button>
          <div className="text-sm text-gray-600">
            {content.length} תווים
          </div>
        </div>
      )}

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans"
        style={{ minHeight, direction: 'rtl' }}
        dir="rtl"
      />
    </div>
  );
}