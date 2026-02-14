'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  Save,
  Download,
  ChevronDown,
  Ban,
  Sparkles,
  BookOpen,
  Clock,
  Hash,
  Type,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import { SynonymButton } from '@/components/SynonymButton';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { usePatternSaver, SavedPatternInfo } from '@/hooks/usePatternSaver';
import PatternSaverPanel from '@/components/shared/PatternSaverPanel';
import { exportToTXT, exportToWord, exportToPDF } from '@/lib/export-utils';

interface ArticleEditorProps {
  initialContent: string;
  title: string;
  keywords: string[];
  onBack: () => void;
}

interface Statistics {
  wordCount: number;
  headingCount: number;
  keywordDensity: { keyword: string; count: number; density: string; densityNum: number }[];
  longTailKeywords: { keyword: string; count: number }[];
  readingTime: number;
}

type EditorTab = 'stats' | 'improve' | 'forbidden' | 'pattern';

/**
 * Count occurrences of a Hebrew keyword in text using boundary detection.
 * JavaScript's \b regex word boundary doesn't work with Hebrew characters,
 * so we use a custom approach checking for whitespace/punctuation boundaries.
 */
const countHebrewKeyword = (text: string, keyword: string): number => {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase().trim();
  if (!normalizedKeyword) return 0;

  let count = 0;
  let pos = 0;
  const boundary = /[\s.,;:!?\-()[\]{}"'\/\\<>\u200B-\u200F\u0591-\u05C7]/;

  while (pos < normalizedText.length) {
    const idx = normalizedText.indexOf(normalizedKeyword, pos);
    if (idx === -1) break;

    const charBefore = idx === 0 ? ' ' : normalizedText[idx - 1];
    const endPos = idx + normalizedKeyword.length;
    const charAfter = endPos >= normalizedText.length ? ' ' : normalizedText[endPos];

    if (boundary.test(charBefore) && boundary.test(charAfter)) {
      count++;
    }
    pos = idx + 1;
  }
  return count;
};

export default function ArticleEditor({
  initialContent,
  title,
  keywords,
  onBack,
}: ArticleEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);
  const [newForbiddenWord, setNewForbiddenWord] = useState('');
  const [activeTab, setActiveTab] = useState<EditorTab>('stats');
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
    source: 'article',
    userId: 'default-user',
    onSuccess: (pattern) => {
      setContent((prev) => applyPatternToText(prev, pattern));
    },
  });

  // Calculate statistics using Hebrew-aware keyword counting
  const statistics = useMemo(() => {
    const stats: Statistics = {
      wordCount: 0,
      headingCount: 0,
      keywordDensity: [],
      longTailKeywords: [],
      readingTime: 0,
    };

    if (!content) return stats;

    // Word count
    const words = content.trim().split(/\s+/);
    stats.wordCount = words.length;

    // Reading time (~200 words/min for Hebrew)
    stats.readingTime = Math.max(1, Math.ceil(stats.wordCount / 200));

    // Heading count
    const headings = content.match(/^#+\s+.+$/gm) || [];
    stats.headingCount = headings.length;

    // Keyword density - using Hebrew-aware counting
    keywords.forEach(keyword => {
      const count = countHebrewKeyword(content, keyword);
      const densityNum = stats.wordCount > 0 ? (count / stats.wordCount) * 100 : 0;
      const density = densityNum.toFixed(2);

      stats.keywordDensity.push({
        keyword,
        count,
        density: `${density}%`,
        densityNum,
      });
    });

    // Long-tail keywords (3+ words) - also using Hebrew-aware counting
    keywords.forEach(keyword => {
      if (keyword.split(' ').length >= 3) {
        const count = countHebrewKeyword(content, keyword);
        if (count > 0) {
          stats.longTailKeywords.push({ keyword, count });
        }
      }
    });

    return stats;
  }, [content, keywords]);

  // Count forbidden word occurrences in content
  const forbiddenWordCounts = useMemo(() => {
    if (!content || forbiddenWords.length === 0) return {};
    const counts: Record<string, number> = {};
    forbiddenWords.forEach(word => {
      counts[word] = countHebrewKeyword(content, word);
    });
    return counts;
  }, [content, forbiddenWords]);

  const handleAddForbiddenWord = () => {
    if (newForbiddenWord.trim() && !forbiddenWords.includes(newForbiddenWord.trim())) {
      setForbiddenWords([...forbiddenWords, newForbiddenWord.trim()]);
      setNewForbiddenWord('');
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title,
          keywords,
          contentType: 'article',
          userId: 'default-user',
        }),
      });
      if (response.ok) {
        alert('המאמר נשמר בהצלחה!');
      } else {
        alert('שגיאה בשמירת המאמר');
      }
    } catch {
      alert('שגיאה בשמירת המאמר');
    }
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    if (!content) {
      alert('אין תוכן לייצוא');
      return;
    }
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `מאמר-${timestamp}`;
      if (format === 'txt') exportToTXT(content, filename);
      else if (format === 'docx') await exportToWord(content, filename);
      else if (format === 'pdf') await exportToPDF(content, filename);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting:', error);
      alert(`שגיאה בייצוא: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getDensityColor = (densityNum: number) => {
    if (densityNum >= 1 && densityNum <= 2) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'from-emerald-400 to-emerald-600', label: 'אופטימלי' };
    if (densityNum > 0 && densityNum < 1) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'from-amber-400 to-amber-600', label: 'נמוך' };
    if (densityNum > 2 && densityNum <= 3) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'from-amber-400 to-amber-600', label: 'גבוה' };
    if (densityNum > 3) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'from-rose-400 to-rose-600', label: 'גבוה מדי' };
    return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', bar: 'from-gray-300 to-gray-400', label: 'לא נמצא' };
  };

  const tabs: { key: EditorTab; label: string; icon: React.ReactNode }[] = [
    { key: 'stats', label: 'סטטיסטיקות SEO', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'improve', label: 'שיפור אוטומטי', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'forbidden', label: 'מילים להימנעות', icon: <Ban className="w-4 h-4" /> },
    { key: 'pattern', label: 'שמירת דפוסים', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════════ */}
      {/* Sticky Header Toolbar */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
              ✍️ {title}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              {statistics.wordCount} מילים · {statistics.headingCount} כותרות · {statistics.readingTime} דק' קריאה
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Save */}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:px-4"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">שמור</span>
            </button>

            {/* Synonyms */}
            <SynonymButton
              text={content}
              context={`מאמר: ${title}`}
              category="articles"
              userId="default-user"
              onVersionSelect={(version) => setContent(version)}
            />

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-700 shadow-sm transition-all hover:bg-sky-50 sm:px-4"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">ייצוא</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showExportMenu && (
                <div className="absolute left-0 right-auto top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-xl sm:left-auto sm:right-0">
                  <button onClick={() => handleExport('txt')} className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-gray-700 transition hover:bg-sky-50">
                    ייצוא ל-TXT
                  </button>
                  <button onClick={() => handleExport('docx')} className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-gray-700 transition hover:bg-sky-50">
                    ייצוא ל-Word
                  </button>
                  <button onClick={() => handleExport('pdf')} className="flex w-full items-center gap-2 px-4 py-2.5 text-right text-sm text-gray-700 transition hover:bg-sky-50">
                    ייצוא ל-PDF
                  </button>
                </div>
              )}
            </div>

            {/* Back */}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 sm:px-4"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">חזרה</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* Main Writing Area */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border-2 border-sky-100 bg-white shadow-lg">
        {/* Subtle gradient header */}
        <div className="bg-gradient-to-b from-sky-50/60 to-white px-5 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-700">
              <Type className="mb-0.5 ml-1.5 inline-block h-4 w-4" />
              משטח כתיבה
            </span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 ring-1 ring-sky-200">
              {statistics.wordCount} מילים
            </span>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none border-0 px-5 py-4 text-base leading-relaxed text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 sm:px-6 sm:text-lg"
          style={{ minHeight: '500px', direction: 'rtl' }}
          dir="rtl"
          placeholder="התחל לכתוב את המאמר שלך כאן..."
          onMouseUp={patternSaver.handleSelection}
          onKeyUp={patternSaver.handleSelection}
          onTouchEnd={patternSaver.handleSelection}
        />

        {/* Bottom info bar */}
        <div className="flex items-center justify-between border-t border-sky-100 bg-sky-50/30 px-5 py-2 text-xs text-gray-500 sm:px-6">
          <span>{statistics.wordCount} מילים · {statistics.headingCount} כותרות</span>
          <span>{statistics.readingTime} דקות קריאה</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* Tabbed Tools Panel */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-all sm:px-5 sm:py-3.5 ${
                activeTab === tab.key
                  ? 'border-sky-500 bg-sky-50/60 text-sky-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-100/60 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* ─── Tab: Statistics ─── */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 text-center">
                  <Hash className="mx-auto mb-1 h-5 w-5 text-sky-500" />
                  <p className="text-2xl font-bold text-sky-700">{statistics.wordCount}</p>
                  <p className="text-xs text-gray-500">מילים</p>
                </div>
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 text-center">
                  <Type className="mx-auto mb-1 h-5 w-5 text-indigo-500" />
                  <p className="text-2xl font-bold text-indigo-700">{statistics.headingCount}</p>
                  <p className="text-xs text-gray-500">כותרות</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 text-center">
                  <TrendingUp className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
                  <p className="text-2xl font-bold text-emerald-700">{statistics.keywordDensity.filter(k => k.count > 0).length}</p>
                  <p className="text-xs text-gray-500">מילות מפתח</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 text-center">
                  <Clock className="mx-auto mb-1 h-5 w-5 text-amber-500" />
                  <p className="text-2xl font-bold text-amber-700">{statistics.readingTime}</p>
                  <p className="text-xs text-gray-500">דקות קריאה</p>
                </div>
              </div>

              {/* Keyword Density Table */}
              {statistics.keywordDensity.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-800">🎯 צפיפות מילות מפתח</h4>
                  <div className="space-y-2">
                    {statistics.keywordDensity.map((item, index) => {
                      const colors = getDensityColor(item.densityNum);
                      return (
                        <div key={index} className={`rounded-xl border p-3 ${colors.border} ${colors.bg}`}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{item.keyword}</span>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors.text} ${colors.bg} ring-1 ${colors.border}`}>
                                {colors.label}
                              </span>
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {item.count}× ({item.density})
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r transition-all duration-500 ${colors.bar}`}
                              style={{ width: `${Math.min(item.densityNum * 33, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs text-gray-600">
                    <span className="font-medium">מקרא:</span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 1-2% אופטימלי
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> מתחת ל-1% או מעל 2%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" /> מעל 3% (מוגזם)
                    </span>
                  </div>
                </div>
              )}

              {/* Long-tail Keywords */}
              {statistics.longTailKeywords.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-800">🔍 מילות מפתח זנב ארוך</h4>
                  <div className="flex flex-wrap gap-2">
                    {statistics.longTailKeywords.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700"
                      >
                        {item.keyword}
                        <span className="rounded-full bg-purple-200 px-1.5 py-0.5 text-xs font-bold text-purple-800">
                          {item.count}×
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab: Improvement ─── */}
          {activeTab === 'improve' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h4 className="text-sm font-semibold text-gray-800">🤖 שיפור אוטומטי</h4>
                <p className="mt-1 text-xs text-gray-500">
                  המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן
                </p>
              </div>
              <ImprovementButtons
                content={content}
                documentType="article"
                onImprove={(improved) => setContent(improved)}
              />
            </div>
          )}

          {/* ─── Tab: Forbidden Words ─── */}
          {activeTab === 'forbidden' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">🚫 מילים להימנעות</h4>
                <p className="mt-1 text-xs text-gray-500">
                  הוסיפי מילים שברצונך להימנע מהשימוש בהן במאמר
                </p>
              </div>

              {/* Add Word */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newForbiddenWord}
                  onChange={(e) => setNewForbiddenWord(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddForbiddenWord()}
                  placeholder="הוסיפי מילה להימנעות"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  dir="rtl"
                />
                <button
                  onClick={handleAddForbiddenWord}
                  disabled={!newForbiddenWord.trim()}
                  className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  הוסף
                </button>
              </div>

              {/* Word Tags with occurrence counts */}
              {forbiddenWords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {forbiddenWords.map((word, index) => {
                    const occurrences = forbiddenWordCounts[word] || 0;
                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                          occurrences > 0
                            ? 'border border-rose-200 bg-rose-50 text-rose-800'
                            : 'border border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      >
                        {word}
                        {occurrences > 0 && (
                          <span className="flex items-center gap-0.5 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {occurrences}×
                          </span>
                        )}
                        <button
                          onClick={() => setForbiddenWords(forbiddenWords.filter((_, i) => i !== index))}
                          className="mr-1 text-gray-400 transition hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">
                  לא נבחרו מילים להימנעות
                </p>
              )}
            </div>
          )}

          {/* ─── Tab: Pattern Saver ─── */}
          {activeTab === 'pattern' && (
            <PatternSaverPanel
              sourceLabel="מאמר"
              selectedText={patternSaver.selectedText}
              onSelectedTextChange={patternSaver.setSelectedText}
              patternCorrection={patternSaver.patternCorrection}
              onPatternCorrectionChange={patternSaver.setPatternCorrection}
              onSave={patternSaver.handleSavePattern}
              isSaving={patternSaver.isSavingPattern}
              patternSaved={patternSaver.patternSaved}
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* AI Chat Bot */}
      {/* ═══════════════════════════════════════════════ */}
      <AIChatBot
        text={content}
        context={`מאמר: ${title}`}
        userId="default-user"
      />
    </div>
  );
}
