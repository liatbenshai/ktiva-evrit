'use client';

import { BookmarkPlus, Check, Info, Loader2, Sparkles } from 'lucide-react';
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
        'rounded-2xl border border-indigo-100/60 bg-gradient-to-br from-white via-indigo-50 to-purple-50 p-6 sm:p-7 shadow-lg shadow-indigo-100/40 space-y-5 transition-all duration-200',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-inner shadow-indigo-100">
            <BookmarkPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">
              שמירת דפוס מתוך {sourceLabel}
            </p>
            <h3 className="text-lg font-semibold text-gray-900">
              הפכי תובנות לתיקונים אוטומטיים
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm text-indigo-600 shadow-sm shadow-indigo-100">
          <Sparkles className="h-4 w-4" />
          <span>הטקסט יתעדכן מיד</span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white/80 p-4 text-sm text-indigo-700 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">איך זה עובד?</p>
          <p className="leading-6">
            {instructions ||
              'סמני בבטחון ניסוח בעייתי (או הדביקי אותו כאן), הזיני את הגרסה הטובה יותר ולחצי על "שמרי דפוס". אנו נעדכן את הטקסט הנוכחי ונזכור את ההעדפה שלך להבא.'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            הניסוח שסימנת
          </label>
          <textarea
            value={selectedText}
            onChange={(e) => onSelectedTextChange(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-gray-800 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="לדוגמה: קיבלתי החלטה"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            הניסוח הרצוי (המתוקן)
          </label>
          <textarea
            value={patternCorrection}
            onChange={(e) => onPatternCorrectionChange(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-white/60 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="לדוגמה: החלטתי"
            dir="rtl"
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !selectedText.trim() || !patternCorrection.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm leading-6 text-emerald-700 shadow-sm">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>
              הדפוס נשמר והחיל את התיקון על הטקסט הנוכחי. מהיום, נימנע מהניסוח שסימנת בכל יצירה עתידית.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
