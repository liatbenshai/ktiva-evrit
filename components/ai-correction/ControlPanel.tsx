'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { RevisionLevel, ContentStyle } from './types';
import { revisionLevelOptions, contentStyleOptions } from './constants';

interface ControlPanelProps {
  autoApplyPatterns: boolean;
  onAutoApplyChange: (value: boolean) => void;
  onImportPrebuiltPatterns: () => void;
  onShowStats: () => void;
  onStartTrainingMode: () => void;
  onShowBatchMode: () => void;
  onExportPatterns: () => void;
  onImportPatternsFromFile: () => void;
  revisionLevel: RevisionLevel;
  onRevisionLevelChange: (level: RevisionLevel) => void;
  contentStyle: ContentStyle;
  onContentStyleChange: (style: ContentStyle) => void;
  hasOriginalText: boolean;
}

export default function ControlPanel({
  autoApplyPatterns,
  onAutoApplyChange,
  onImportPrebuiltPatterns,
  onShowStats,
  onStartTrainingMode,
  onShowBatchMode,
  onExportPatterns,
  onImportPatternsFromFile,
  revisionLevel,
  onRevisionLevelChange,
  contentStyle,
  onContentStyleChange,
  hasOriginalText,
}: ControlPanelProps) {
  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Toggle להחלה אוטומטית */}
          <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-2 rounded-lg border border-indigo-200 w-full sm:w-auto">
            <input
              type="checkbox"
              id="autoApply"
              checked={autoApplyPatterns}
              onChange={(e) => onAutoApplyChange(e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <label htmlFor="autoApply" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
              {autoApplyPatterns ? '✅ החלה אוטומטית מופעלת' : '⏸️ החלה אוטומטית מושבתת'}
            </label>
          </div>

          {/* כפתור ייבוא דפוסים */}
          <button
            onClick={onImportPrebuiltPatterns}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm w-full sm:w-auto"
          >
            ⚡ ייבוא 50+ דפוסי AI נפוצים
          </button>

          {/* כפתור סטטיסטיקות */}
          <button
            onClick={onShowStats}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm w-full sm:w-auto"
          >
            📊 הצג סטטיסטיקות
          </button>

          {/* כפתור מצב אימון */}
          <button
            onClick={onStartTrainingMode}
            disabled={!hasOriginalText}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            🎓 מצב אימון
          </button>

          {/* כפתור Batch Learning */}
          <button
            onClick={onShowBatchMode}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm w-full sm:w-auto"
          >
            🔄 למידה קבוצתית
          </button>
        </div>

        {/* קישור לדפוסים */}
        <Link
          href="/dashboard/ai-correction/learned-patterns"
          className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm w-full sm:w-auto text-center"
        >
          📚 צפייה בכל הדפוסים
        </Link>
      </div>

      {/* שורה שנייה - ייצוא/ייבוא */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 mt-3 text-xs sm:text-sm">
        <span className="text-gray-600 font-medium w-full sm:w-auto">שיתוף דפוסים:</span>
        <button
          onClick={onExportPatterns}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs sm:text-sm"
        >
          💾 ייצא דפוסים (JSON)
        </button>
        <button
          onClick={onImportPatternsFromFile}
          className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs sm:text-sm"
        >
          📂 יבא דפוסים (JSON)
        </button>
      </div>

      {/* בחירת עומק התיקון */}
      <div className="mt-4 space-y-2">
        <p className="text-xs sm:text-sm text-gray-700 font-medium">עומק התיקון הרצוי:</p>
        <div className="flex flex-wrap items-center gap-2">
          {revisionLevelOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onRevisionLevelChange(option.value)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm transition-all ${
                revisionLevel === option.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-gray-700 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-semibold">{option.label}</span>
                <span className="text-[11px] sm:text-xs opacity-80">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* בחירת סוג התוכן */}
      <div className="mt-4 space-y-2">
        <p className="text-xs sm:text-sm text-gray-700 font-medium">סגנון / סוג תוכן:</p>
        <div className="flex flex-wrap items-center gap-2">
          {contentStyleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onContentStyleChange(option.value)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm transition-all ${
                contentStyle === option.value
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-gray-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-semibold">{option.label}</span>
                <span className="text-[11px] sm:text-xs opacity-80">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

