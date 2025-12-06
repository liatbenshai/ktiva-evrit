'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SuggestedPattern } from './types';

interface TrainingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  suggestedPatterns: SuggestedPattern[];
  onApprovePattern: (pattern: SuggestedPattern, index: number) => void;
  onRejectPattern: (index: number) => void;
}

export default function TrainingModeModal({
  isOpen,
  onClose,
  isLoading,
  suggestedPatterns,
  onApprovePattern,
  onRejectPattern,
}: TrainingModeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🎓 מצב אימון - אישור דפוסים</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          המערכת מצאה {suggestedPatterns.length} דפוסים אפשריים בטקסט. אשר או דחה כל דפוס:
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="mr-3 text-gray-600">מחפש דפוסים...</span>
          </div>
        ) : suggestedPatterns.length > 0 ? (
          <div className="space-y-3">
            {suggestedPatterns.map((pattern, idx) => (
              <div key={idx} className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-red-600 line-through">&quot;{pattern.badPattern}&quot;</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium text-green-600">&quot;{pattern.goodPattern}&quot;</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{pattern.explanation}</p>
                    <div className="flex gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {pattern.context}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        ביטחון: {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprovePattern(pattern, idx)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✓ אשר ושמור
                  </button>
                  <button
                    onClick={() => onRejectPattern(idx)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ✕ דחה
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו דפוסים חדשים להצעה 🎉
          </div>
        )}
      </Card>
    </div>
  );
}

