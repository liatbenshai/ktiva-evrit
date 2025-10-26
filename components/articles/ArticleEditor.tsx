'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Save, 
  Download,
  RefreshCw,
  Ban
} from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import { SynonymButton } from '@/components/SynonymButton';

interface ArticleEditorProps {
  initialContent: string;
  title: string;
  keywords: string[];
  onBack: () => void;
}

interface Statistics {
  wordCount: number;
  headingCount: number;
  keywordDensity: { keyword: string; count: number; density: string }[];
  longTailKeywords: { keyword: string; count: number }[];
}

export default function ArticleEditor({
  initialContent,
  title,
  keywords,
  onBack,
}: ArticleEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);
  const [newForbiddenWord, setNewForbiddenWord] = useState('');
  const [showStats, setShowStats] = useState(true);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats: Statistics = {
      wordCount: 0,
      headingCount: 0,
      keywordDensity: [],
      longTailKeywords: [],
    };

    if (!content) return stats;

    // Word count
    const words = content.trim().split(/\s+/);
    stats.wordCount = words.length;

    // Heading count (assuming headings start with # or are in <h> tags)
    const headings = content.match(/^#+\s+.+$/gm) || [];
    stats.headingCount = headings.length;

    // Keyword density
    const lowerContent = content.toLowerCase();
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const matches = content.match(regex) || [];
      const count = matches.length;
      const density = ((count / stats.wordCount) * 100).toFixed(2);
      
      stats.keywordDensity.push({
        keyword,
        count,
        density: `${density}%`,
      });
    });

    // Long-tail keywords (3+ words)
    const longTailMatches: { [key: string]: number } = {};
    keywords.forEach(keyword => {
      if (keyword.split(' ').length >= 3) {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = content.match(regex) || [];
        if (matches.length > 0) {
          longTailMatches[keyword] = matches.length;
        }
      }
    });

    stats.longTailKeywords = Object.entries(longTailMatches).map(([keyword, count]) => ({
      keyword,
      count,
    }));

    return stats;
  }, [content, keywords]);

  const handleAddForbiddenWord = () => {
    if (newForbiddenWord.trim() && !forbiddenWords.includes(newForbiddenWord.trim())) {
      setForbiddenWords([...forbiddenWords, newForbiddenWord.trim()]);
      setNewForbiddenWord('');
    }
  };

  const handleSave = () => {
    // TODO: Implement save to database with user edits for learning
    alert('המאמר נשמר בהצלחה!');
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-blue-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ✍️ עריכת המאמר
            </h2>
            <p className="text-gray-600 mt-1 text-sm">
              {title}
            </p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
              showStats
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-orange-200 hover:bg-orange-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {showStats ? 'הסתר' : 'הצג'} סטטיסטיקות
          </button>
          <SynonymButton
            text={content}
            context={`מאמר: ${title}`}
            category="articles"
            userId="default-user"
            onVersionSelect={(version) => setContent(version)}
          />
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            שמור
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            הורד
          </button>
        </div>
      </div>

      {/* Improvement Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🤖 שיפור אוטומטי
        </h3>
        <ImprovementButtons
          content={content}
          documentType="article"
          onImprove={(improved) => setContent(improved)}
        />
        <p className="mt-3 text-sm text-gray-500">
          המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {title}
            </h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans"
              style={{ minHeight: '600px', direction: 'rtl' }}
              dir="rtl"
            />
          </div>

          {/* Forbidden Words */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5" />
              מילים להימנעות
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newForbiddenWord}
                onChange={(e) => setNewForbiddenWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddForbiddenWord()}
                placeholder="הוסף מילה להימנעות"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="rtl"
              />
              <button
                onClick={handleAddForbiddenWord}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                הוסף
              </button>
            </div>
            {forbiddenWords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {forbiddenWords.map((word, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {word}
                    <button
                      onClick={() => setForbiddenWords(forbiddenWords.filter((_, i) => i !== index))}
                      className="hover:text-red-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="space-y-4">
            {/* Basic Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm border-2 border-blue-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📊 סטטיסטיקות בסיסיות
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700 font-medium">מספר מילים:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {statistics.wordCount}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700 font-medium">כותרות:</span>
                  <span className="font-bold text-cyan-600 text-lg">
                    {statistics.headingCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Keyword Density */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border-2 border-green-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                🎯 צפיפות מילות מפתח
              </h3>
              <div className="space-y-3">
                {statistics.keywordDensity.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.keyword}</span>
                      <span className="text-sm font-bold text-green-600">
                        {item.count} פעמים ({item.density})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-emerald-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: item.density }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  💡 <span className="font-medium">צפיפות אופטימלית: 1-2%</span>
                </p>
              </div>
            </div>

            {/* Long-tail Keywords */}
            {statistics.longTailKeywords.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border-2 border-purple-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔍 מילות מפתח זנב ארוך
                </h3>
                <div className="space-y-2">
                  {statistics.longTailKeywords.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">{item.keyword}</span>
                      <span className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                        {item.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
