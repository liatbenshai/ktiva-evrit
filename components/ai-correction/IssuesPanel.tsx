'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { TranslationIssue, IssueStatus } from './types';

interface IssuesPanelProps {
  issues: TranslationIssue[];
  issueStates: Record<string, IssueStatus>;
  issueCustomInputs: Record<string, string>;
  issueCustomActive: Record<string, boolean>;
  issueCustomApplied: Record<string, string | undefined>;
  onAcceptIssue: (issue: TranslationIssue, index: number) => void;
  onDismissIssue: (issue: TranslationIssue, index: number) => void;
  onUndoDecision: (issue: TranslationIssue, index: number) => void;
  onToggleCustomInput: (issue: TranslationIssue, index: number) => void;
  onCustomInputChange: (issue: TranslationIssue, index: number, value: string) => void;
  onApplyCustom: (issue: TranslationIssue, index: number) => void;
  onCancelCustom: (issue: TranslationIssue, index: number) => void;
}

export default function IssuesPanel({
  issues,
  issueStates,
  issueCustomInputs,
  issueCustomActive,
  issueCustomApplied,
  onAcceptIssue,
  onDismissIssue,
  onUndoDecision,
  onToggleCustomInput,
  onCustomInputChange,
  onApplyCustom,
  onCancelCustom,
}: IssuesPanelProps) {
  const getIssueKey = (issue: TranslationIssue, index: number) =>
    `${issue.startIndex}-${issue.endIndex}-${issue.original}-${index}`;

  const getIssueStatus = (issue: TranslationIssue, index: number): IssueStatus => {
    const state = issueStates[getIssueKey(issue, index)];
    return state ?? 'pending';
  };

  const acceptedIssuesCount = issues.reduce(
    (count, issue, index) => (getIssueStatus(issue, index) === 'accepted' ? count + 1 : count),
    0
  );
  const dismissedIssuesCount = issues.reduce(
    (count, issue, index) => (getIssueStatus(issue, index) === 'dismissed' ? count + 1 : count),
    0
  );
  const pendingIssuesCount = issues.length - acceptedIssuesCount - dismissedIssuesCount;

  if (issues.length === 0) return null;

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">⚠️ בעיות שזוהו ({issues.length})</h3>
          <p className="text-sm text-gray-600 mt-1">
            לכל דפוס תוכלי לאשר את ההצעה, לדחות אותה או להזין תיקון משלך כדי ללמד את המערכת כיצד לנסח בעתיד.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg">
            ממתין: {pendingIssuesCount}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg">
            אושרו: {acceptedIssuesCount}
          </span>
          <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg">
            נדחו: {dismissedIssuesCount}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {issues.map((issue, idx) => {
          const status = getIssueStatus(issue, idx);
          const key = getIssueKey(issue, idx);
          const customAppliedText = issueCustomApplied[key];
          const containerClasses =
            status === 'accepted'
              ? 'border-green-400 bg-green-50'
              : status === 'dismissed'
                ? 'border-gray-300 bg-gray-50'
                : 'border-yellow-400 bg-yellow-50';
          const statusLabel =
            status === 'accepted'
              ? customAppliedText
                ? 'אושר (תיקון שלך)'
                : 'אושר'
              : status === 'dismissed'
                ? 'נדחה'
                : 'ממתין להחלטה';
          const statusBadgeClasses =
            status === 'accepted'
              ? 'bg-green-200 text-green-800'
              : status === 'dismissed'
                ? 'bg-gray-300 text-gray-700'
                : 'bg-yellow-200 text-yellow-800';

          return (
            <div key={idx} className={`p-4 border-r-4 rounded transition-colors ${containerClasses}`}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                    {issue.type}
                  </span>
                  <span className="text-sm text-gray-600">
                    ביטחון: {Math.round(issue.confidence * 100)}%
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusBadgeClasses}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{issue.explanation}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-red-600 font-medium line-through">
                    &quot;{issue.original}&quot;
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600 font-medium">
                    &quot;{issue.suggestion}&quot;
                  </span>
                </div>
                {customAppliedText && status === 'accepted' && (
                  <p className="text-xs text-purple-700 mt-1">
                    התיקון שבחרת: &quot;{customAppliedText}&quot;
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onAcceptIssue(issue, idx)}
                    disabled={status === 'accepted'}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      status === 'accepted'
                        ? 'bg-green-200 text-green-700 cursor-not-allowed opacity-80'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    אשרי והחל
                  </button>
                  <button
                    onClick={() => onDismissIssue(issue, idx)}
                    disabled={status === 'dismissed'}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      status === 'dismissed'
                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed opacity-80'
                        : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    דחי
                  </button>
                  <button
                    onClick={() => onToggleCustomInput(issue, idx)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      issueCustomActive[key]
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    ✎ תיקון שלי
                  </button>
                  {status !== 'pending' && (
                    <button
                      onClick={() => onUndoDecision(issue, idx)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      בטלי החלטה
                    </button>
                  )}
                </div>
                {issueCustomActive[key] && (
                  <div className="mt-3 space-y-2 w-full">
                    <textarea
                      value={issueCustomInputs[key] ?? issue.suggestion}
                      onChange={(e) => onCustomInputChange(issue, idx, e.target.value)}
                      className="w-full border border-purple-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      rows={3}
                      placeholder="כתבי כאן את התיקון שאת מעדיפה..."
                      dir="rtl"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onApplyCustom(issue, idx)}
                        className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors"
                      >
                        אשרי את התיקון שלי
                      </button>
                      <button
                        onClick={() => onCancelCustom(issue, idx)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded hover:bg-gray-300 transition-colors"
                      >
                        בטלי
                      </button>
                    </div>
                  </div>
                )}
                {status === 'pending' && (
                  <p className="text-xs text-blue-600">
                    אפשר גם לסמן את הביטוי בטקסט המתוקן כדי לקבל הצעות נוספות.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

