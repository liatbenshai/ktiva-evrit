'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BatchResults } from './types';

interface BatchLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchTexts: string;
  onBatchTextsChange: (value: string) => void;
  isProcessing: boolean;
  onProcess: () => void;
  results: BatchResults | null;
}

export default function BatchLearningModal({
  isOpen,
  onClose,
  batchTexts,
  onBatchTextsChange,
  isProcessing,
  onProcess,
  results,
}: BatchLearningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🔄 למידה קבוצתית</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          הדבק מספר טקסטים (אחד בכל שורה) - המערכת תנתח את כולם ותחלץ דפוסים משותפים.
        </p>

        <textarea
          value={batchTexts}
          onChange={(e) => onBatchTextsChange(e.target.value)}
          placeholder="הדבק טקסטים כאן... (אחד בכל שורה, עד 50 טקסטים)"
          className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm mb-4"
          dir="rtl"
        />

        <div className="flex gap-2">
          <Button
            onClick={onProcess}
            disabled={isProcessing || !batchTexts.trim()}
            className="flex-1 bg-pink-600 hover:bg-pink-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                מעבד...
              </>
            ) : (
              '🚀 נתח והפק דפוסים'
            )}
          </Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">✅ תוצאות</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>טקסטים שנותחו: <strong>{results.totalTexts}</strong></div>
              <div>דפוסים שנמצאו: <strong>{results.totalPatternsFound}</strong></div>
              <div>דפוסים שנשמרו: <strong>{results.patternsSaved}</strong></div>
              <div>ציון ממוצע: <strong>{Math.round(results.averageScore)}/100</strong></div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

