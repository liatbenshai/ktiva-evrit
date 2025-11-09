'use client';

import { BookmarkPlus, Check, Info, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface PatternSaverPanelProps {
  sourceLabel: string;
  selectedText: string;
  onSelectedTextChange: (value: string) => void;
  patternCorrection: string;
  onPatternCorrectionChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  patternSaved: boolean;
  className?: string;
  instructions?: string;
}

export default function PatternSaverPanel({
  sourceLabel,
  selectedText,
  onSelectedTextChange,
  patternCorrection,
  onPatternCorrectionChange,
  onSave,
  isSaving,
  patternSaved,
  className,
  instructions,
}: PatternSaverPanelProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <BookmarkPlus className="w-5 h-5 text-blue-600" />
        שמירת דפוס מתוך {sourceLabel}
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800">
        <Info className="w-4 h-4 mt-0.5" />
        <p>
          {instructions ||
            'סמני טקסט בעייתי (או הדביקי אותו כאן), הזיני את הניסוח המתוקן ולחצי על "שמרי דפוס". הדפוס יוחל אוטומטית בכל התכנים הבאים.'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            הניסוח שסימנת
          </label>
          <textarea
            value={selectedText}
            onChange={(e) => onSelectedTextChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="לדוגמה: קיבלתי החלטה"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            הניסוח הרצוי (המתוקן)
          </label>
          <textarea
            value={patternCorrection}
            onChange={(e) => onPatternCorrectionChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            placeholder="לדוגמה: החלטתי"
            dir="rtl"
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !selectedText.trim() || !patternCorrection.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              שומרת דפוס...
            </>
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4" />
              שמרי דפוס
            </>
          )}
        </button>

        {patternSaved && (
          <p className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            הדפוס נשמר בהצלחה! תוכן עתידי יימנע מהניסוח שסימנת.
          </p>
        )}
      </div>
    </div>
  );
}
