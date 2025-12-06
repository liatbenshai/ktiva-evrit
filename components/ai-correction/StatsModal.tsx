'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Stats } from './types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  stats: Stats | null;
}

export default function StatsModal({ isOpen, onClose, isLoading, stats }: StatsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📊 סטטיסטיקות למידה</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="mr-3 text-gray-600">טוען סטטיסטיקות...</span>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* מספרים עיקריים */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{stats.totalPatterns}</div>
                <div className="text-sm text-blue-800">דפוסים שנלמדו</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">{stats.patternsAppliedCount}</div>
                <div className="text-sm text-green-800">תיקונים שהוחלו</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{stats.estimatedTimeSavedMinutes}</div>
                <div className="text-sm text-purple-800">דקות שנחסכו ⏱️</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{Math.round(stats.averageConfidence * 100)}%</div>
                <div className="text-sm text-orange-800">ביטחון ממוצע</div>
              </div>
            </div>

            {/* הדפוסים הפופולריים ביותר */}
            {stats.topPatterns && stats.topPatterns.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">🏆 הדפוסים הכי שימושיים</h3>
                <div className="space-y-2">
                  {stats.topPatterns.slice(0, 5).map((pattern, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center gap-3">
                      <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}</span>
                      <span className="text-sm font-medium text-red-600 line-through">&quot;{pattern.badPattern}&quot;</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium text-green-600">&quot;{pattern.goodPattern}&quot;</span>
                      <span className="mr-auto"></span>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                        {pattern.occurrences} פעמים
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* פילוח לפי קטגוריות */}
            {stats.categoriesBreakdown && Object.keys(stats.categoriesBreakdown).length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">📂 פילוח לפי קטגוריות</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(stats.categoriesBreakdown).map(([category, count]) => (
                    <div key={category} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="text-xl font-bold text-indigo-600">{count as number}</div>
                      <div className="text-sm text-indigo-800">{category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו סטטיסטיקות
          </div>
        )}
      </Card>
    </div>
  );
}

