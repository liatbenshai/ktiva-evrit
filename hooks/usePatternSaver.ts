'use client';

import { useCallback, useState } from 'react';

interface UsePatternSaverOptions {
  source: string;
  userId?: string;
  onSuccess?: (pattern: {
    from: string;
    to: string;
    confidence: number;
    occurrences: number;
  }) => void;
}

export function usePatternSaver({
  source,
  userId = 'default-user',
  onSuccess,
}: UsePatternSaverOptions) {
  const [selectedText, setSelectedText] = useState('');
  const [patternCorrection, setPatternCorrection] = useState('');
  const [isSavingPattern, setIsSavingPattern] = useState(false);
  const [patternSaved, setPatternSaved] = useState(false);

  const handleSelection = useCallback(
    (event: React.SyntheticEvent<HTMLElement>) => {
      let selection = '';
      const target = event.currentTarget as
        | HTMLTextAreaElement
        | HTMLInputElement
        | HTMLElement;

      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        if (start !== end) {
          selection = target.value.substring(start, end);
        }
      }

      if (!selection.trim() && typeof window !== 'undefined') {
        const globalSelection = window.getSelection();
        if (globalSelection) {
          selection = globalSelection.toString();
        }
      }

      selection = selection.trim();
      if (!selection) {
        return;
      }

      setSelectedText(selection);
      setPatternCorrection(selection);
      setPatternSaved(false);
    },
    [],
  );

  const resetPatternSaved = useCallback(() => {
    setPatternSaved(false);
  }, []);

  const handleSavePattern = useCallback(async () => {
    const original = selectedText.trim();
    const corrected = patternCorrection.trim();

    if (!original || !corrected) {
      alert('אנא סמני ניסוח בעייתי והזיני את הניסוח הרצוי.');
      return;
    }

    setIsSavingPattern(true);
    setPatternSaved(false);

    try {
      const response = await fetch('/api/ai-correction/save-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: original,
          correctedText: corrected,
          userId,
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save pattern');
      }

      setPatternSaved(true);
      setSelectedText('');
      setPatternCorrection('');

      if (typeof onSuccess === 'function') {
        onSuccess(data.pattern);
      }

      alert('✅ הדפוס נשמר! התכנים הבאים ילמדו מהעדפה הזאת.');
    } catch (error) {
      console.error('Error saving pattern:', error);
      const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בשמירת הדפוס: ${message}`);
    } finally {
      setIsSavingPattern(false);
    }
  }, [selectedText, patternCorrection, source, userId, onSuccess]);

  return {
    selectedText,
    setSelectedText,
    patternCorrection,
    setPatternCorrection,
    isSavingPattern,
    patternSaved,
    handleSelection,
    handleSavePattern,
    resetPatternSaved,
  };
}

export type UsePatternSaverReturn = ReturnType<typeof usePatternSaver>;
