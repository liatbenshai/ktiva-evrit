'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Save, X, Copy, Check, Loader2, Languages, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import AIChatBot from './AIChatBot';

interface TranslationIssue {
  type: string;
  original: string;
  suggestion: string;
  confidence: number;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

interface AnalysisResult {
  issues: TranslationIssue[];
  score: number;
  suggestions: string[];
}

interface Suggestion {
  text: string;
  explanation?: string;
  tone?: string;
  whenToUse?: string;
}

export default function AICorrector(): React.JSX.Element {
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 🆕 דפוסים שהוחלו אוטומטית
  const [appliedPatterns, setAppliedPatterns] = useState<Array<{ from: string; to: string }>>([]);
  
  // 🆕 בקרת למידה אוטומטית
  const [autoApplyPatterns, setAutoApplyPatterns] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // 🆕 Training Mode
  const [showTrainingMode, setShowTrainingMode] = useState(false);
  const [suggestedPatterns, setSuggestedPatterns] = useState<any[]>([]);
  const [isLoadingTraining, setIsLoadingTraining] = useState(false);
  
  // 🆕 Batch Learning
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [batchTexts, setBatchTexts] = useState('');
  const [batchResults, setBatchResults] = useState<any>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // הצעות לטקסט נבחר (בדיוק כמו בתכונת התרגום)
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionSuggestions, setSelectionSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSelectionSuggestions, setShowSelectionSuggestions] = useState(false);
  
  // אפשרויות חלופיות לטקסט המלא (כמו בתכונת התרגום)
  const [alternatives, setAlternatives] = useState<Array<{
    text: string;
    explanation?: string;
    context?: string;
  }>>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  // מילים נרדפות למילים בודדות (כמו בתכונת התרגום)
  const [wordAlternatives, setWordAlternatives] = useState<{ [key: string]: string[] }>({});
  const [showWordAlternatives, setShowWordAlternatives] = useState(false);

  // מצב הרחבה/צמצום של הגרסאות החלופיות
  const [expandedAlternatives, setExpandedAlternatives] = useState<{ [key: number]: boolean }>({});
  
  // טקסט נבחר מתוך גרסה חלופית (לשמירה חלקית)
  const [selectedAlternativeText, setSelectedAlternativeText] = useState<{ text: string; index: number } | null>(null);

  // טעינת סטטיסטיקות
  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/ai-correction/stats?userId=default-user');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // ייבוא דפוסים מוכנים
  const importPrebuiltPatterns = async () => {
    if (!confirm('האם ליבא 50+ דפוסי AI נפוצים למערכת? (דפוסים קיימים לא יוחלפו)')) {
      return;
    }

    try {
      // ייבוא הדפוסים מהקובץ
      const { convertToDBFormat } = await import('@/lib/common-ai-patterns');
      const patterns = convertToDBFormat('default-user');

      const response = await fetch('/api/ai-correction/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patterns,
          userId: 'default-user',
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}\n\nיובאו ${data.imported} דפוסים חדשים!`);
        await loadStats(); // רענון סטטיסטיקות
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing patterns:', error);
      alert('שגיאה בייבוא דפוסים: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // מחיקת דפוס מההצגה
  const removeAppliedPattern = async (pattern: { from: string; to: string }, index: number) => {
    // הסרה מהרשימה המקומית
    const newPatterns = appliedPatterns.filter((_, i) => i !== index);
    setAppliedPatterns(newPatterns);

    // החזרת הטקסט לפני החלת הדפוס הזה
    const newText = editedText.replace(
      new RegExp(pattern.to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      pattern.from
    );
    setEditedText(newText);
    setCorrectedText(newText);
  };

  // מצב אימון - הצעת דפוסים
  const startTrainingMode = async () => {
    if (!originalText.trim()) {
      alert('אנא הכנס טקסט תחילה');
      return;
    }

    setIsLoadingTraining(true);
    setShowTrainingMode(true);
    
    try {
      const response = await fetch('/api/ai-correction/suggest-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          userId: 'default-user',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuggestedPatterns(data.suggestedPatterns || []);
      } else {
        throw new Error(data.error || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Error in training mode:', error);
      alert('שגיאה בטעינת הצעות דפוסים');
    } finally {
      setIsLoadingTraining(false);
    }
  };

  // אישור דפוס (Training Mode)
  const approvePattern = async (pattern: any, index: number) => {
    try {
      const response = await fetch('/api/ai-correction/save-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: pattern.badPattern,
          correctedText: pattern.goodPattern,
          userId: 'default-user',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // הסרה מהרשימה
        setSuggestedPatterns(prev => prev.filter((_, i) => i !== index));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error approving pattern:', error);
    }
  };

  // דחיית דפוס (Training Mode)
  const rejectPattern = (index: number) => {
    setSuggestedPatterns(prev => prev.filter((_, i) => i !== index));
  };

  // ייצוא דפוסים
  const exportPatterns = async () => {
    try {
      const response = await fetch('/api/ai-correction/patterns?userId=default-user');
      const data = await response.json();
      
      if (data.success && data.patterns) {
        const exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          patterns: data.patterns.map((p: any) => ({
            badPattern: p.badPattern,
            goodPattern: p.goodPattern,
            patternType: p.patternType,
            confidence: p.confidence,
            context: p.context,
          })),
        };

        // יצירת קובץ JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hebrew-patterns-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        alert(`✅ יוצאו ${exportData.patterns.length} דפוסים בהצלחה!`);
      }
    } catch (error) {
      console.error('Error exporting patterns:', error);
      alert('שגיאה בייצוא דפוסים');
    }
  };

  // ייבוא דפוסים מקובץ
  const importPatternsFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      try {
        const file = e.target?.files?.[0];
        if (!file) return;

        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.patterns || !Array.isArray(importData.patterns)) {
          throw new Error('Invalid file format');
        }

        const response = await fetch('/api/ai-correction/patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patterns: importData.patterns,
            userId: 'default-user',
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert(`✅ ${data.message}`);
          await loadStats();
        }
      } catch (error) {
        console.error('Error importing patterns:', error);
        alert('שגיאה בקריאת הקובץ - וודא שזה קובץ JSON תקין');
      }
    };
    input.click();
  };

  // Batch Learning
  const processBatchTexts = async () => {
    if (!batchTexts.trim()) {
      alert('אנא הכנס טקסטים לניתוח (אחד בכל שורה)');
      return;
    }

    const lines = batchTexts.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      alert('לא נמצאו טקסטים לניתוח');
      return;
    }

    setIsProcessingBatch(true);
    
    try {
      const response = await fetch('/api/ai-correction/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: lines.map(line => ({ original: line })),
          userId: 'default-user',
          autoSavePatterns: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBatchResults(data);
        alert(`✅ ניתוח הושלם!\n\n` +
          `טקסטים: ${data.totalTexts}\n` +
          `דפוסים שנמצאו: ${data.totalPatternsFound}\n` +
          `דפוסים שנשמרו: ${data.patternsSaved}\n` +
          `ציון ממוצע: ${Math.round(data.averageScore)}/100`
        );
        await loadStats(); // רענון סטטיסטיקות
      } else {
        throw new Error(data.error || 'Batch analysis failed');
      }
    } catch (error) {
      console.error('Error in batch learning:', error);
      alert('שגיאה בניתוח batch: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // ניתוח הטקסט
  const analyzeText = async () => {
    if (!originalText.trim()) {
      alert('אנא הכנס טקסט לניתוח');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai-correction/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          userId: 'default-user',
          applyPatterns: autoApplyPatterns, // 🆕 שימוש בהגדרת toggle
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || `שגיאת שרת: ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'הניתוח נכשל');
      }
      
      setAnalysis(data.analysis);
      
      // 🆕 דפוסים שהוחלו אוטומטית
      const patternsApplied = data.result?.appliedPatterns || [];
      setAppliedPatterns(patternsApplied);
      console.log(`✅ ${patternsApplied.length} patterns were applied automatically`, patternsApplied);
      
      // אפשרויות חלופיות לטקסט המלא - לוודא שיש לפחות 3 גרסאות
      const receivedAlternatives = data.alternatives || [];
      if (receivedAlternatives.length === 0) {
        console.warn('No alternatives received from API');
      }
      setAlternatives(receivedAlternatives);
      
      // הטקסט המתוקן מתחיל עם התיקון הראשי המומלץ (כולל דפוסים שהוחלו)
      const mainCorrectedText = data.result?.analyzedText || originalText;
      setCorrectedText(mainCorrectedText);
      setEditedText(mainCorrectedText);
      setSelectedAlternative(null);
      
      // איפוס מילים נרדפות - נטען מחדש כשמסמנים טקסט
      setWordAlternatives({});
      setShowWordAlternatives(true); // הצג מיד כשהן זמינות
    } catch (error) {
      console.error('Error analyzing text:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בניתוח הטקסט: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // בחירת טקסט (בדיוק כמו בתכונת התרגום)
  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSelectedText('');
      setShowSelectionSuggestions(false);
      return;
    }

    const selected = selection.toString().trim();
    if (selected.length > 0 && selected.length < 500) {
      setSelectedText(selected);
      
      // אם בעריכה - לא נביא הצעות, רק נשמור את הטקסט המסומן
      if (isEditing) {
        return; // נציג אפשרות לשמור שינוי נקודתי
      } else {
        // נקבל הצעות אוטומטית
        await handleGetSuggestions(selected);
      }
    } else {
      setSelectedText('');
      setShowSelectionSuggestions(false);
    }
  };
  
  // שמירה נקודתית של שינוי מסומן בעריכה
  const handleSaveSelectedChange = async () => {
    if (!selectedText || !isEditing) return;
    
    // נמצא את הטקסט המסומן בטקסט המקורי
    const originalIndex = originalText.indexOf(selectedText);
    if (originalIndex === -1) {
      // אם הטקסט המסומן לא קיים במקור, זה שינוי חדש
      alert('הטקסט המסומן לא נמצא בטקסט המקורי - זה שינוי חדש. השתמשי במילים נרדפות או הצעות.');
      return;
    }
    
    // נמצא את הטקסט החדש במיקום הזה בטקסט המעודכן
    const editedIndex = editedText.indexOf(selectedText);
    if (editedIndex === -1) {
      // הטקסט המסומן שונה - נמצא את המיקום בטקסט המעודכן
      const textBefore = editedText.substring(0, originalIndex);
      const textAfter = editedText.substring(originalIndex + selectedText.length);
      // ננסה למצוא את הטקסט החדש
      const words = editedText.split(/\s+/);
      const originalWords = originalText.split(/\s+/);
      
      // נשמור את השינוי בין הטקסט המקורי לטקסט המעודכן
      const originalTextSelected = selectedText;
      const correctedTextSelected = editedText.substring(
        Math.max(0, originalIndex - 10),
        Math.min(editedText.length, originalIndex + selectedText.length + 10)
      );
      
      // נשמור רק את החלק ששונה
      await savePatternAutomatically(originalTextSelected, selectedText);
    } else {
      // הטקסט לא השתנה - אין מה לשמור
      alert('הטקסט המסומן לא השתנה. סמני טקסט ששונה כדי לשמור אותו.');
    }
  };
  
  // שמירה נקודתית של שינוי בין מקור לתיקון
  const handleSavePointChange = async (originalPart: string, correctedPart: string) => {
    if (!originalPart || !correctedPart || originalPart === correctedPart) {
      return;
    }
    
    await savePatternAutomatically(originalPart, correctedPart);
  };

  // קבלת הצעות לטקסט נבחר
  const handleGetSuggestions = async (text: string = selectedText) => {
    if (!text || !correctedText) return;

    setIsLoadingSuggestions(true);
    setShowSelectionSuggestions(true);
    try {
      const response = await fetch('/api/ai-correction/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText: text,
          fullText: correctedText,
          context: 'תיקון טקסט AI',
          userId: 'default-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `שגיאת שרת: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'הבקשה להצעות נכשלה');
      }
      
      setSelectionSuggestions(data.suggestions || []);
      setWordAlternatives(data.wordAlternatives || {}); // מילים נרדפות
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      console.error('Error details:', errorMessage);
      
      // הצגת הודעת שגיאה למשתמש
      alert(`שגיאה בקבלת הצעות: ${errorMessage}`);
      setSelectionSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // בחירת מילה נרדפת (כמו בתכונת התרגום)
  const handleSelectWordAlternative = (originalWord: string, alternativeWord: string) => {
    const currentText = editedText || correctedText;
    // החלפת המילה הראשונה בלבד
    const escapedWord = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    const newTranslation = currentText.replace(regex, (match, offset) => {
      // החלף רק את ההופעה הראשונה
      if (offset === currentText.toLowerCase().search(new RegExp(`\\b${escapedWord}\\b`, 'gi'))) {
        return alternativeWord;
      }
      return match;
    });
    setEditedText(newTranslation);
    setCorrectedText(newTranslation);
    setIsEditing(true);
    
    // שמירה נקודתית אוטומטית
    savePatternAutomatically(originalWord, alternativeWord);
  };

  // שמירה נקודתית אוטומטית (helper function)
  const savePatternAutomatically = async (original: string, corrected: string) => {
    // בדיקה בסיסית - אם אין שינוי, לא שומרים
    if (!original || !corrected || original.trim() === corrected.trim()) {
      console.warn('No change to save:', { original, corrected });
      return;
    }

    // בדיקה שהטקסט לא ריק מדי
    if (original.trim().length < 2 && corrected.trim().length < 2) {
      console.warn('Text too short to save as pattern');
      return;
    }

    try {
      const response = await fetch('/api/ai-correction/save-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: original.trim(),
          correctedText: corrected.trim(),
          userId: 'default-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save pattern:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save pattern`);
      }

      const data = await response.json();
      
      console.log('Save pattern response:', {
        success: data.success,
        message: data.message,
        error: data.error,
        details: data.details,
      });
      
      if (data.success) {
        console.log('✅ Pattern saved successfully:', data);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        console.error('❌ Pattern save failed:', data);
        const errorMsg = data.message || data.error || 'שגיאה לא ידועה';
        const details = data.details ? `\n\nפרטים: ${JSON.stringify(data.details)}` : '';
        alert(`❌ שגיאה בשמירת הדפוס:\n${errorMsg}${details}\n\nבדקי את הקונסולה (F12) לפרטים נוספים.`);
      }
    } catch (error) {
      console.error('Error saving pattern automatically:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בשמירת הדפוס: ${errorMessage}`);
    }
  };

  // בחירת הצעה לטקסט נבחר - עם שמירה נקודתית אוטומטית
  const handleSelectSuggestion = async (suggestionText: string) => {
    if (!correctedText || !selectedText) return;

    const index = correctedText.indexOf(selectedText);
    if (index === -1) return;

    const newText = 
      correctedText.substring(0, index) + 
      suggestionText + 
      correctedText.substring(index + selectedText.length);
    
    setEditedText(newText);
    setCorrectedText(newText);
    setSelectedText('');
    setSelectionSuggestions([]);
    setShowSelectionSuggestions(false);
    setIsEditing(true);
    
    window.getSelection()?.removeAllRanges();

    // שמירה נקודתית אוטומטית של השינוי הזה
    try {
      if (!selectedText || !suggestionText || selectedText.trim() === suggestionText.trim()) {
        return; // אין שינוי לשמור
      }

      const response = await fetch('/api/ai-correction/save-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: selectedText.trim(),
          correctedText: suggestionText,
          userId: 'default-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save pattern:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save pattern`);
      }

      const data = await response.json();
      console.log('Pattern saved automatically:', data.message);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving pattern automatically:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בשמירת הדפוס: ${errorMessage}`);
    }
  };

  // בחירת אפשרות חלופית לטקסט המלא - שומרים אוטומטית את ההחלפה
  const handleSelectAlternative = async (alternativeText: string) => {
    const previousText = correctedText || originalText;
    
    setEditedText(alternativeText);
    setCorrectedText(alternativeText);
    setSelectedAlternative(alternativeText);
    setIsEditing(true);
    
    // שמירה אוטומטית של השינוי - אם יש שינוי משמעותי
    if (previousText !== alternativeText && previousText.length > 0) {
      // שמירת הדפוס בין הגרסה הקודמת לנוכחית
      try {
        const response = await fetch('/api/ai-correction/save-pattern', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalText: previousText,
            correctedText: alternativeText,
            userId: 'default-user',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to save alternative pattern:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to save pattern`);
        }

        const data = await response.json();
        console.log('Alternative pattern saved automatically:', data.message);
        // לא נציג הודעה כי זה יכול להיות מפריע אם יש הרבה שינויים
      } catch (error) {
        console.error('Error saving alternative pattern:', error);
        const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
        // לא נציג alert כאן כי זה יכול להיות מפריע אם יש הרבה שינויים
        // אבל נרשם בקונסולה
      }
    }
  };

  // התחלת עריכה
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedText(correctedText);
  };

  // ביטול עריכה
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(correctedText);
    setShowSuccess(false);
  };

  // העתקה
  const handleCopy = () => {
    navigator.clipboard.writeText(editedText || correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="space-y-6" dir="rtl">
      {/* פאנל בקרה עליון */}
      <Card className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Toggle להחלה אוטומטית */}
            <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-2 rounded-lg border border-indigo-200 w-full sm:w-auto">
              <input
                type="checkbox"
                id="autoApply"
                checked={autoApplyPatterns}
                onChange={(e) => setAutoApplyPatterns(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label htmlFor="autoApply" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                {autoApplyPatterns ? '✅ החלה אוטומטית מופעלת' : '⏸️ החלה אוטומטית מושבתת'}
              </label>
            </div>

            {/* כפתור ייבוא דפוסים */}
            <button
              onClick={importPrebuiltPatterns}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm w-full sm:w-auto"
            >
              ⚡ ייבוא 50+ דפוסי AI נפוצים
            </button>

            {/* כפתור סטטיסטיקות */}
            <button
              onClick={() => {
                loadStats();
                setShowStatsModal(true);
              }}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm w-full sm:w-auto"
            >
              📊 הצג סטטיסטיקות
            </button>

            {/* כפתור מצב אימון */}
            <button
              onClick={startTrainingMode}
              disabled={!originalText.trim()}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              🎓 מצב אימון
            </button>

            {/* כפתור Batch Learning */}
            <button
              onClick={() => setShowBatchMode(true)}
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
            onClick={exportPatterns}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs sm:text-sm"
          >
            💾 ייצא דפוסים (JSON)
          </button>
          <button
            onClick={importPatternsFromFile}
            className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            📂 יבא דפוסים (JSON)
          </button>
        </div>
      </Card>
      
      {/* מודל סטטיסטיקות */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">📊 סטטיסטיקות למידה</h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {isLoadingStats ? (
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
                      {stats.topPatterns.slice(0, 5).map((pattern: any, idx: number) => (
                        <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center gap-3">
                          <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}</span>
                          <span className="text-sm font-medium text-red-600 line-through">"{pattern.badPattern}"</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm font-medium text-green-600">"{pattern.goodPattern}"</span>
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
      )}

      {/* 🎓 מודל מצב אימון (Training Mode) */}
      {showTrainingMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">🎓 מצב אימון - אישור דפוסים</h2>
              <button
                onClick={() => setShowTrainingMode(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              המערכת מצאה {suggestedPatterns.length} דפוסים אפשריים בטקסט. אשר או דחה כל דפוס:
            </p>

            {isLoadingTraining ? (
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
                          <span className="text-sm font-medium text-red-600 line-through">"{pattern.badPattern}"</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm font-medium text-green-600">"{pattern.goodPattern}"</span>
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
                        onClick={() => approvePattern(pattern, idx)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✓ אשר ושמור
                      </button>
                      <button
                        onClick={() => rejectPattern(idx)}
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
      )}

      {/* 🔄 מודל למידה קבוצתית (Batch Learning) */}
      {showBatchMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">🔄 למידה קבוצתית</h2>
              <button
                onClick={() => setShowBatchMode(false)}
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
              onChange={(e) => setBatchTexts(e.target.value)}
              placeholder="הדבק טקסטים כאן... (אחד בכל שורה, עד 50 טקסטים)"
              className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm mb-4"
              dir="rtl"
            />

            <div className="flex gap-2">
              <Button
                onClick={processBatchTexts}
                disabled={isProcessingBatch || !batchTexts.trim()}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {isProcessingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    מעבד...
                  </>
                ) : (
                  '🚀 נתח והפק דפוסים'
                )}
              </Button>
            </div>

            {batchResults && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-800 mb-2">✅ תוצאות</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>טקסטים שנותחו: <strong>{batchResults.totalTexts}</strong></div>
                  <div>דפוסים שנמצאו: <strong>{batchResults.totalPatternsFound}</strong></div>
                  <div>דפוסים שנשמרו: <strong>{batchResults.patternsSaved}</strong></div>
                  <div>ציון ממוצע: <strong>{Math.round(batchResults.averageScore)}/100</strong></div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* הוראות שימוש */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-bold mb-3">📖 איך זה עובד?</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>הדבק טקסט שנוצר על ידי AI בתיבה "טקסט מקורי מ-AI"</li>
          <li>לחץ על "🔍 נתח טקסט" - <strong className="text-green-600">המערכת תחיל אוטומטית דפוסים שנלמדו!</strong></li>
          <li>המערכת תזהה דפוסי AI נוספים ותתן ציון + גרסאות חלופיות</li>
          <li><strong>סמני מילה או משפט</strong> בטקסט המתוקן (עם העכבר) כדי לקבל 5-7 הצעות חלופיות</li>
          <li>לחצי על הצעה כדי להחליף אותה - <strong>השינוי נשמר אוטומטית</strong> (שמירה נקודתית)</li>
          <li>ערוכי את הטקסט ידנית במידת הצורך</li>
        </ol>
      </Card>
      
      {/* 🆕 הצגת דפוסים שהוחלו אוטומטית */}
      {appliedPatterns.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
          <h3 className="text-lg font-bold mb-3 text-green-800">
            ✨ הוחלו {appliedPatterns.length} דפוסי תיקון אוטומטית!
          </h3>
          <p className="text-sm text-green-700 mb-3">
            המערכת למדה מהתיקונים הקודמים שלך והחילה אותם אוטומטית על הטקסט:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {appliedPatterns.map((pattern, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-green-200 flex items-center gap-3">
                <span className="text-sm font-medium text-red-600 line-through">"{pattern.from}"</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm font-medium text-green-600">"{pattern.to}"</span>
                <span className="mr-auto"></span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✓ הוחל
                </span>
                {/* כפתור ביטול */}
                <button
                  onClick={() => removeAppliedPattern(pattern, idx)}
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                  title="בטל תיקון זה"
                >
                  ✕ בטל
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-600 mt-3">
            💡 <strong>טיפ:</strong> לחץ על "✕ בטל" כדי לבטל תיקון ספציפי ולהחזיר את הטקסט המקורי
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* טקסט מקורי */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">📝 טקסט מקורי מ-AI</h2>
            {analysis && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">ציון:</span>
                <span className={`text-2xl font-bold ${
                  analysis.score >= 80 ? 'text-green-600' : 
                  analysis.score >= 60 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {analysis.score}
                </span>
              </div>
            )}
          </div>
          
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="הדבק כאן טקסט שנוצר על ידי AI..."
            className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            dir="rtl"
          />

          <div className="flex gap-2">
          <Button
            onClick={analyzeText}
            disabled={isAnalyzing || !originalText.trim()}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  מנתח...
                </>
              ) : (
                '🔍 נתח טקסט'
              )}
            </Button>
            {originalText && (
              <Button
                onClick={() => {
                  setOriginalText('');
                  setCorrectedText('');
                  setEditedText('');
                  setAnalysis(null);
                  setIsEditing(false);
                  setSelectedText('');
                  setSelectionSuggestions([]);
                  setShowSelectionSuggestions(false);
                  setAppliedPatterns([]);
                }}
                variant="outline"
                className="px-4"
                title="נקה הכל"
              >
                🗑️ נקה
          </Button>
            )}
          </div>
        </Card>

        {/* טקסט מתוקן */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">✅ טקסט מתוקן</h2>
            <div className="flex gap-2">
              {correctedText && !isEditing && (
                <Button
                  onClick={handleStartEdit}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  ערוך
                </Button>
              )}
              {correctedText && (
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      הועתק!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      העתק
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {showSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ התיקון נשמר! המערכת תלמד מהתיקון ותימנע מניסוחי AI דומים בעתיד.
              </p>
            </div>
          )}
          
          {correctedText ? (
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="relative">
          <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      onMouseUp={handleTextSelection}
                      className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            dir="rtl"
          />
                    {selectedText && isEditing && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg z-10">
                        <span>טקסט נבחר: "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"</span>
                        <button
                          onClick={async () => {
                            // הטקסט המסומן הוא מהטקסט המעודכן
                            const selectedInEdited = selectedText;
                            
                            // נמצא את המיקום בטקסט המעודכן
                            const editedIndex = editedText.indexOf(selectedInEdited);
                            if (editedIndex === -1) {
                              alert('לא ניתן למצוא את הטקסט במיקום הצפוי');
                              return;
                            }
                            
                            // נמצא את החלק המתאים בטקסט המקורי
                            // ננסה למצוא את הטקסט המקורי באותו אזור
                            const wordsBefore = editedText.substring(0, editedIndex).split(/\s+/).length;
                            const wordsAfter = editedText.substring(editedIndex + selectedInEdited.length).split(/\s+/).length;
                            
                            const originalWords = originalText.split(/\s+/);
                            const editedWords = editedText.split(/\s+/);
                            
                            // נמצא את המילה/ביטוי המקורי במיקום הזה
                            let originalPart = '';
                            if (wordsBefore < originalWords.length) {
                              const startWord = Math.max(0, wordsBefore);
                              const endWord = Math.min(originalWords.length, wordsBefore + selectedInEdited.split(/\s+/).length);
                              originalPart = originalWords.slice(startWord, endWord).join(' ');
                            } else {
                              // אם זה טקסט חדש, נשמור את הטקסט המסומן כשינוי
                              originalPart = '';
                            }
                            
                            // אם הטקסט המקורי והמעודכן שונים, נשמור את השינוי
                            if (originalPart !== selectedInEdited && originalPart.length > 0) {
                              await savePatternAutomatically(originalPart, selectedInEdited);
                              alert(`השינוי נשמר: "${originalPart}" → "${selectedInEdited}"`);
                            } else if (originalPart.length === 0) {
                              // טקסט חדש - נשמור רק את הטקסט החדש
                              await savePatternAutomatically(selectedInEdited, selectedInEdited);
                              alert(`הטקסט החדש נשמר: "${selectedInEdited}"`);
                            } else {
                              alert('הטקסט המסומן לא השתנה מהמקור');
                            }
                            
                            setSelectedText('');
                            window.getSelection()?.removeAllRanges();
                          }}
                          className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs font-medium"
                        >
                          שמור שינוי זה
                        </button>
                        <button
                          onClick={() => {
                            setSelectedText('');
                            window.getSelection()?.removeAllRanges();
                          }}
                          className="hover:bg-purple-600 rounded px-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      ביטול
                    </Button>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>טיפ:</strong> סמני מילה או ביטוי בעריכה ולחצי על "שמור שינוי זה" כדי לשמור רק את השינוי המסומן, בלי לשמור את כל העריכה.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[300px] relative">
                    <p
                      className="whitespace-pre-wrap select-text text-base"
                      dir="rtl"
                      onMouseUp={handleTextSelection}
                    >
                      {correctedText}
                    </p>
                    {selectedText && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 shadow-lg z-10">
                        <span>טקסט נבחר: "{selectedText.substring(0, 20)}{selectedText.length > 20 ? '...' : ''}"</span>
                        <button
                          onClick={() => {
                            setSelectedText('');
                            setShowSelectionSuggestions(false);
                            window.getSelection()?.removeAllRanges();
                          }}
                          className="hover:bg-blue-600 rounded px-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleStartEdit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    ערוך את התיקון (כל שינוי נקודתי נשמר אוטומטית)
                  </button>
                  
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      💡 <strong>טיפ:</strong> סמני מילה או משפט בטקסט כדי לקבל הצעות חלופיות ספציפיות
                    </p>
                  </div>
                </>
              )}

              {/* אפשרויות חלופיות לטקסט המלא - 3 גרסאות שונות */}
              {alternatives.length > 0 ? (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Languages className="w-5 h-5" />
                      אפשרויות חלופיות לטקסט המלא ({alternatives.length} גרסאות)
                    </h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    בחרי אחת מהגרסאות הבאות לשיפור הטקסט:
                  </p>
                  <div className="space-y-3">
                    {alternatives.map((alt, index) => {
                      const isExpanded = expandedAlternatives[index] ?? false;
                      const isSelected = selectedAlternative === alt.text;
                      const displayText = isExpanded ? alt.text : alt.text.substring(0, 150) + (alt.text.length > 150 ? '...' : '');
                      
                      return (
                        <div
                          key={index}
                          className={`p-3 bg-white rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-blue-200 hover:border-blue-300'
                          }`}
                        >
                          {/* כותרת הגרסה עם כפתורי הרחבה/צמצם */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                גרסה {index + 1}
                              </span>
                              {alt.context && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {alt.context}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedAlternatives(prev => ({
                                    ...prev,
                                    [index]: !prev[index]
                                  }));
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title={isExpanded ? 'צמצם' : 'הרחב'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* טקסט הגרסה */}
                          <div 
                            className="relative"
                            onMouseUp={(e) => {
                              // רק אם לא לוחצים על כפתור
                              if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                              
                              const selection = window.getSelection();
                              if (selection && selection.toString().trim().length > 0) {
                                const selected = selection.toString().trim();
                                if (selected.length > 0 && selected.length < alt.text.length) {
                                  setSelectedAlternativeText({ text: selected, index });
                                }
                              }
                            }}
                          >
                            <p
                              className={`font-medium mb-1 cursor-pointer select-text ${isExpanded ? '' : 'line-clamp-2'}`}
                              dir="rtl"
                            >
                              {displayText}
                            </p>
                            
                            {/* תיבה לשמירה חלקית */}
                            {selectedAlternativeText && selectedAlternativeText.index === index && (
                              <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg z-20">
                                <span>טקסט נבחר: "{selectedAlternativeText.text.substring(0, 30)}{selectedAlternativeText.text.length > 30 ? '...' : ''}"</span>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const selectedPart = selectedAlternativeText.text;
                                    
                                    // נמצא את הטקסט המקורי במיקום הזה - נחפש את החלק הזה בטקסט המקורי
                                    const originalIndex = originalText.indexOf(selectedPart);
                                    
                                    if (originalIndex === -1) {
                                      // הטקסט לא קיים במקור - זה חלק חדש מהגרסה החלופית
                                      // נשמור את החלק הזה כשינוי חדש
                                      // ננסה למצוא את החלק הקרוב ביותר בטקסט המקורי
                                      const words = selectedPart.split(/\s+/);
                                      if (words.length > 0) {
                                        // נחפש את המילה הראשונה בטקסט המקורי
                                        const firstWord = words[0];
                                        const originalFirstWordIndex = originalText.indexOf(firstWord);
                                        if (originalFirstWordIndex !== -1) {
                                          // נמצא את החלק המקורי המתאים
                                          const originalWords = originalText.split(/\s+/);
                                          const selectedWords = selectedPart.split(/\s+/);
                                          const startIndex = originalText.substring(0, originalFirstWordIndex).split(/\s+/).length;
                                          const originalPart = originalWords.slice(startIndex, startIndex + selectedWords.length).join(' ');
                                          
                                          if (originalPart !== selectedPart && originalPart.trim().length > 0) {
                                            try {
                                              await savePatternAutomatically(originalPart, selectedPart);
                                              alert(`החלק נשמר: "${originalPart}" → "${selectedPart}"`);
                                            } catch (error) {
                                              console.error('Error saving pattern part:', error);
                                              // השגיאה כבר מוצגת ב-savePatternAutomatically
                                            }
                                          } else if (originalPart.trim().length === 0) {
                                            // חלק חדש לחלוטין - לא נשמור דפוס עבור טקסט חדש
                                            alert('זה טקסט חדש - לא נשמר כדפוס');
                                          } else {
                                            alert('החלק שנבחר זהה למקור');
                                          }
                                        }
                                      }
                                    } else {
                                      // הטקסט קיים במקור - אין שינוי
                                      alert('החלק שנבחר זהה למקור - אין שינוי לשמור');
                                    }
                                    
                                    setSelectedAlternativeText(null);
                                    window.getSelection()?.removeAllRanges();
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
                                >
                                  שמור חלק זה
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAlternativeText(null);
                                    window.getSelection()?.removeAllRanges();
                                  }}
                                  className="hover:bg-purple-600 rounded px-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
      </div>

                          {alt.explanation && (
                            <p className="text-xs text-gray-600 mb-2 mt-1">
                              {alt.explanation}
                            </p>
                          )}

                          {/* כפתורי פעולה */}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAlternative(alt.text);
                              }}
                              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {isSelected ? '✓ נבחרה' : 'אשר גרסה זו'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // העתקה ללוח
                                navigator.clipboard.writeText(alt.text);
                                alert('הגרסה הועתקה ללוח');
                              }}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                            >
                              העתק
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⏳ המערכת עדיין יוצרת גרסאות חלופיות... אם זה לוקח זמן רב, נסי לסמן טקסט ספציפי כדי לקבל הצעות.
                  </p>
                </div>
              )}

              {/* הצעות לטקסט נבחר (בדיוק כמו בתכונת התרגום) */}
              {showSelectionSuggestions && selectedText && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                      <Languages className="w-5 h-5" />
                      הצעות חלופיות ל-"{selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}"
                    </h3>
                    <button
                      onClick={() => {
                        setShowSelectionSuggestions(false);
                        setSelectedText('');
                        window.getSelection()?.removeAllRanges();
                      }}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                      <span className="mr-2 text-orange-700">מביא הצעות...</span>
                    </div>
                  ) : selectionSuggestions.length > 0 ? (
                    <div className="space-y-3">
                      {selectionSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all cursor-pointer"
                          onClick={() => handleSelectSuggestion(suggestion.text)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p
                                className="font-medium mb-2 text-lg"
                                dir="rtl"
                              >
                                {suggestion.text}
                              </p>
                              {suggestion.explanation && (
                                <p className="text-sm text-gray-600 mb-1">
                                  {suggestion.explanation}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {suggestion.tone && (
                                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                    טון: {suggestion.tone}
                                  </span>
                                )}
                                {suggestion.whenToUse && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    {suggestion.whenToUse}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-orange-600">
                              <Check className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-orange-700 text-center py-4">
                      לא נמצאו הצעות. נסי לסמן טקסט אחר.
                    </p>
                  )}

                  {/* אפשרויות חלופיות למילים בודדות (מילים נרדפות) */}
                  {Object.keys(wordAlternatives).length > 0 && (
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                          <Languages className="w-5 h-5" />
                          אפשרויות חלופיות למילים בודדות
                        </h3>
                        <button
                          onClick={() => setShowWordAlternatives(!showWordAlternatives)}
                          className="text-sm text-purple-600 hover:text-purple-800"
                        >
                          {showWordAlternatives ? 'הסתר' : 'הצג'}
                        </button>
                      </div>
                      {showWordAlternatives && (
                        <div className="space-y-3">
                          {Object.entries(wordAlternatives).map(([word, alternatives]) => (
                            <div key={word} className="p-3 bg-white rounded-lg border border-purple-200">
                              <p className="font-medium text-purple-900 mb-2">
                                &quot;{word}&quot; →
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {alternatives.map((alt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSelectWordAlternative(word, alt)}
                                    className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm transition-colors"
                                  >
                                    {alt}
                                  </button>
                                ))}
                              </div>
              </div>
            ))}
          </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 p-4 border rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
              הניתוח יופיע כאן...
            </div>
          )}
        </Card>
      </div>

      {/* ניתוח ובעיות - רק הצגה, לא החלה אוטומטית */}
      {analysis && analysis.issues.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold">⚠️ בעיות שזוהו ({analysis.issues.length}):</h3>
          <p className="text-sm text-gray-600 mb-3">
            הבעיות הבאות זוהו בטקסט. סמני את הטקסט הבעייתי בטקסט המתוקן כדי לקבל הצעות חלופיות.
          </p>
          <div className="space-y-3">
            {analysis.issues.map((issue, idx) => (
              <div key={idx} className="p-4 bg-yellow-50 border-r-4 border-yellow-400 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                        {issue.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        ביטחון: {Math.round(issue.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm mb-2">{issue.explanation}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-600 font-medium line-through">"{issue.original}"</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-medium">"{issue.suggestion}"</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={async () => {
                          // החלפת הבעיה בטקסט
                          if (correctedText.includes(issue.original)) {
                            const index = correctedText.indexOf(issue.original);
                            const newText = 
                              correctedText.substring(0, index) + 
                              issue.suggestion + 
                              correctedText.substring(index + issue.original.length);
                            setEditedText(newText);
                            setCorrectedText(newText);
                            setIsEditing(true);

                            // שמירה נקודתית אוטומטית
                            try {
                              const response = await fetch('/api/ai-correction/save-pattern', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  originalText: issue.original,
                                  correctedText: issue.suggestion,
                                  userId: 'default-user',
                                }),
                              });

                              if (response.ok) {
                                setShowSuccess(true);
                                setTimeout(() => setShowSuccess(false), 3000);
                              }
                            } catch (error) {
                              console.error('Error saving pattern automatically:', error);
                            }
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        ✓ החל תיקון ושמור
                      </button>
                      <span className="text-xs text-blue-600">
                        או סמני את הטקסט בטקסט המתוקן כדי לקבל הצעות נוספות
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* הצעות שיפור כלליות */}
      {analysis && analysis.suggestions.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold">💡 הצעות שיפור כלליות:</h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

    </div>
  );
}
