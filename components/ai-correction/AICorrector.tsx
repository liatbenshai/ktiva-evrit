'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Save, X, Copy, Check, Loader2, Languages, ChevronDown, ChevronUp } from 'lucide-react';

// Import types
import {
  TranslationIssue,
  AnalysisResult,
  Suggestion,
  Alternative,
  AppliedPattern,
  SuggestedPattern,
  Stats,
  BatchResults,
  RevisionLevel,
  ContentStyle,
  IssueStatus,
} from './types';

// Import components
import ControlPanel from './ControlPanel';
import StatsModal from './StatsModal';
import TrainingModeModal from './TrainingModeModal';
import BatchLearningModal from './BatchLearningModal';
import IssuesPanel from './IssuesPanel';

export default function AICorrector(): React.JSX.Element {
  // State declarations
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // דפוסים שהוחלו אוטומטית
  const [appliedPatterns, setAppliedPatterns] = useState<AppliedPattern[]>([]);
  
  // בקרת למידה אוטומטית
  const [autoApplyPatterns, setAutoApplyPatterns] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Training Mode
  const [showTrainingMode, setShowTrainingMode] = useState(false);
  const [suggestedPatterns, setSuggestedPatterns] = useState<SuggestedPattern[]>([]);
  const [isLoadingTraining, setIsLoadingTraining] = useState(false);
  
  // Batch Learning
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [batchTexts, setBatchTexts] = useState('');
  const [batchResults, setBatchResults] = useState<BatchResults | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // הצעות לטקסט נבחר
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionSuggestions, setSelectionSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSelectionSuggestions, setShowSelectionSuggestions] = useState(false);
  
  // אפשרויות חלופיות לטקסט המלא
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  // מילים נרדפות למילים בודדות
  const [wordAlternatives, setWordAlternatives] = useState<{ [key: string]: string[] }>({});
  const [showWordAlternatives, setShowWordAlternatives] = useState(false);

  // מצב הרחבה/צמצום של הגרסאות החלופיות
  const [expandedAlternatives, setExpandedAlternatives] = useState<{ [key: number]: boolean }>({});

  // טקסט נבחר מתוך גרסה חלופית
  const [selectedAlternativeText, setSelectedAlternativeText] = useState<{ text: string; index: number } | null>(null);

  // החלטות על דפוסים (אישור/דחייה)
  const [issueStates, setIssueStates] = useState<Record<string, IssueStatus>>({});

  // שדות לתיקון ידני של דפוסים
  const [issueCustomInputs, setIssueCustomInputs] = useState<Record<string, string>>({});
  const [issueCustomActive, setIssueCustomActive] = useState<Record<string, boolean>>({});
  const [issueCustomApplied, setIssueCustomApplied] = useState<Record<string, string | undefined>>({});

  // רמת עומק התיקון
  const [revisionLevel, setRevisionLevel] = useState<RevisionLevel>('balanced');

  // סוג התוכן / הסגנון המבוקש
  const [contentStyle, setContentStyle] = useState<ContentStyle>('general');

  // Helper functions
  const getIssueKey = (issue: TranslationIssue, index: number) =>
    `${issue.startIndex}-${issue.endIndex}-${issue.original}-${index}`;

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
        await loadStats();
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing patterns:', error);
      alert('שגיאה בייבוא דפוסים: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // מחיקת דפוס מההצגה
  const removeAppliedPattern = async (pattern: AppliedPattern, index: number) => {
    const newPatterns = appliedPatterns.filter((_, i) => i !== index);
    setAppliedPatterns(newPatterns);

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
  const approvePattern = async (pattern: SuggestedPattern, index: number) => {
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
        await loadStats();
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
          applyPatterns: autoApplyPatterns,
          revisionLevel,
          contentStyle,
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
      setIssueStates({});
      setIssueCustomInputs({});
      setIssueCustomActive({});
      setIssueCustomApplied({});
      
      const patternsApplied = data.result?.appliedPatterns || [];
      setAppliedPatterns(patternsApplied);
      
      const receivedAlternatives = data.alternatives || [];
      setAlternatives(receivedAlternatives);
      
      const mainCorrectedText = data.result?.analyzedText || originalText;
      setCorrectedText(mainCorrectedText);
      setEditedText(mainCorrectedText);
      setSelectedAlternative(null);
      
      setWordAlternatives({});
      setShowWordAlternatives(true);
    } catch (error) {
      console.error('Error analyzing text:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בניתוח הטקסט: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // שמירה נקודתית אוטומטית
  const savePatternAutomatically = async (original: string, corrected: string) => {
    if (!original || !corrected || original.trim() === corrected.trim()) {
      return;
    }

    if (original.trim().length < 2 && corrected.trim().length < 2) {
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
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save pattern`);
      }

      const data = await response.json();
      
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving pattern automatically:', error);
    }
  };

  // Issue handlers
  const handleAcceptIssue = async (issue: TranslationIssue, index: number) => {
    const key = getIssueKey(issue, index);
    if (issueStates[key] === 'accepted') return;

    const currentText = editedText || correctedText || '';
    const escapedOriginal = issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceRegex = new RegExp(escapedOriginal);
    let newText = currentText;
    let textChanged = false;

    if (issue.original && replaceRegex.test(currentText)) {
      replaceRegex.lastIndex = 0;
      newText = currentText.replace(replaceRegex, issue.suggestion);
      textChanged = newText !== currentText;
    }

    if (textChanged) {
      setEditedText(newText);
      setCorrectedText(newText);
      setIsEditing(true);
    }

    await savePatternAutomatically(issue.original, issue.suggestion);

    setAppliedPatterns((prev) => {
      if (prev.some((p) => p.from === issue.original && p.to === issue.suggestion)) {
        return prev;
      }
      return [...prev, { from: issue.original, to: issue.suggestion }];
    });

    setIssueStates((prev) => ({ ...prev, [key]: 'accepted' }));
    setIssueCustomApplied((prev) => { const u = { ...prev }; delete u[key]; return u; });
    setIssueCustomInputs((prev) => { const u = { ...prev }; delete u[key]; return u; });
    setIssueCustomActive((prev) => { const u = { ...prev }; delete u[key]; return u; });
  };

  const handleDismissIssue = (issue: TranslationIssue, index: number) => {
    const key = getIssueKey(issue, index);
    if (issueStates[key] === 'dismissed') return;
    setIssueStates((prev) => ({ ...prev, [key]: 'dismissed' }));
  };

  const handleUndoIssueDecision = (issue: TranslationIssue, index: number) => {
    const key = getIssueKey(issue, index);
    const currentState = issueStates[key];
    if (!currentState) return;

    if (currentState === 'accepted') {
      const customAppliedText = issueCustomApplied[key];
      const currentText = editedText || correctedText || '';
      const originalSuggestion = customAppliedText || issue.suggestion;
      const escapedSuggestion = originalSuggestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const revertRegex = new RegExp(escapedSuggestion);

      if (revertRegex.test(currentText)) {
        revertRegex.lastIndex = 0;
        const revertedText = currentText.replace(revertRegex, issue.original);
        setEditedText(revertedText);
        setCorrectedText(revertedText);
        setIsEditing(true);
      }

      setAppliedPatterns((prev) =>
        prev.filter((pattern) => !(pattern.from === issue.original && pattern.to === originalSuggestion))
      );
    }

    setIssueStates((prev) => { const u = { ...prev }; delete u[key]; return u; });
    setIssueCustomApplied((prev) => { const u = { ...prev }; delete u[key]; return u; });
    setIssueCustomInputs((prev) => { const u = { ...prev }; delete u[key]; return u; });
    setIssueCustomActive((prev) => { const u = { ...prev }; delete u[key]; return u; });
  };

  const toggleCustomIssueInput = (issue: TranslationIssue, index: number) => {
    const key = getIssueKey(issue, index);
    const existingCustom = issueCustomApplied[key];
    setIssueCustomActive((prev) => ({ ...prev, [key]: !prev[key] }));
    setIssueCustomInputs((prev) => ({
      ...prev,
      [key]: prev[key] ?? existingCustom ?? issue.suggestion ?? '',
    }));
  };

  const handleCustomInputChange = (issue: TranslationIssue, index: number, value: string) => {
    const key = getIssueKey(issue, index);
    setIssueCustomInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyCustomIssue = async (issue: TranslationIssue, index: number) => {
    const key = getIssueKey(issue, index);
    const customText = issueCustomInputs[key]?.trim();

    if (!customText) {
      alert('אנא כתבי את התיקון הרצוי לפני אישור.');
      return;
    }

    const currentText = editedText || correctedText || '';
    const escapedOriginal = issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceRegex = new RegExp(escapedOriginal);
    let newText = currentText;

    if (issue.original && replaceRegex.test(currentText)) {
      replaceRegex.lastIndex = 0;
      newText = currentText.replace(replaceRegex, customText);
    } else if (issue.original && currentText.includes(issue.original)) {
      newText = currentText.replace(issue.original, customText);
    }

    if (newText !== currentText) {
      setEditedText(newText);
      setCorrectedText(newText);
      setIsEditing(true);
    }

    await savePatternAutomatically(issue.original, customText);

    setAppliedPatterns((prev) => {
      if (prev.some((p) => p.from === issue.original && p.to === customText)) return prev;
      return [...prev, { from: issue.original, to: customText }];
    });

    setIssueStates((prev) => ({ ...prev, [key]: 'accepted' }));
    setIssueCustomApplied((prev) => ({ ...prev, [key]: customText }));
    setIssueCustomActive((prev) => ({ ...prev, [key]: false }));
    setIssueCustomInputs((prev) => ({ ...prev, [key]: customText }));
  };

  const handleCancelCustomIssue = (issue: TranslationIssue, index: number) => {
    const key = getIssueKey(issue, index);
    setIssueCustomActive((prev) => ({ ...prev, [key]: false }));
  };

  // בחירת טקסט
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
      if (!isEditing) {
        await handleGetSuggestions(selected);
      }
    } else {
      setSelectedText('');
      setShowSelectionSuggestions(false);
    }
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
        throw new Error(errorData.error || `שגיאת שרת: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'הבקשה להצעות נכשלה');
      }
      
      setSelectionSuggestions(data.suggestions || []);
      setWordAlternatives(data.wordAlternatives || {});
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      alert(`שגיאה בקבלת הצעות: ${error.message}`);
      setSelectionSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // בחירת מילה נרדפת
  const handleSelectWordAlternative = (originalWord: string, alternativeWord: string) => {
    const currentText = editedText || correctedText;
    const escapedWord = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    const newTranslation = currentText.replace(regex, (match, offset) => {
      if (offset === currentText.toLowerCase().search(new RegExp(`\\b${escapedWord}\\b`, 'gi'))) {
        return alternativeWord;
      }
      return match;
    });
    setEditedText(newTranslation);
    setCorrectedText(newTranslation);
    setIsEditing(true);
    savePatternAutomatically(originalWord, alternativeWord);
  };

  // בחירת הצעה לטקסט נבחר
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

    if (selectedText.trim() !== suggestionText.trim()) {
      await savePatternAutomatically(selectedText.trim(), suggestionText);
    }
  };

  // בחירת אפשרות חלופית לטקסט המלא
  const handleSelectAlternative = async (alternativeText: string) => {
    const previousText = correctedText || originalText;
    
    setEditedText(alternativeText);
    setCorrectedText(alternativeText);
    setSelectedAlternative(alternativeText);
    setIsEditing(true);
    
    if (previousText !== alternativeText && previousText.length > 0) {
      await savePatternAutomatically(previousText, alternativeText);
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

  // Clear all
  const handleClear = () => {
    setOriginalText('');
    setCorrectedText('');
    setEditedText('');
    setAnalysis(null);
    setIsEditing(false);
    setSelectedText('');
    setSelectionSuggestions([]);
    setShowSelectionSuggestions(false);
    setAppliedPatterns([]);
    setIssueStates({});
    setIssueCustomInputs({});
    setIssueCustomActive({});
    setIssueCustomApplied({});
    setAlternatives([]);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* פאנל בקרה עליון */}
      <ControlPanel
        autoApplyPatterns={autoApplyPatterns}
        onAutoApplyChange={setAutoApplyPatterns}
        onImportPrebuiltPatterns={importPrebuiltPatterns}
        onShowStats={() => { loadStats(); setShowStatsModal(true); }}
        onStartTrainingMode={startTrainingMode}
        onShowBatchMode={() => setShowBatchMode(true)}
        onExportPatterns={exportPatterns}
        onImportPatternsFromFile={importPatternsFromFile}
        revisionLevel={revisionLevel}
        onRevisionLevelChange={setRevisionLevel}
        contentStyle={contentStyle}
        onContentStyleChange={setContentStyle}
        hasOriginalText={!!originalText.trim()}
      />

      {/* Modals */}
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        isLoading={isLoadingStats}
        stats={stats}
      />

      <TrainingModeModal
        isOpen={showTrainingMode}
        onClose={() => setShowTrainingMode(false)}
        isLoading={isLoadingTraining}
        suggestedPatterns={suggestedPatterns}
        onApprovePattern={approvePattern}
        onRejectPattern={rejectPattern}
      />

      <BatchLearningModal
        isOpen={showBatchMode}
        onClose={() => setShowBatchMode(false)}
        batchTexts={batchTexts}
        onBatchTextsChange={setBatchTexts}
        isProcessing={isProcessingBatch}
        onProcess={processBatchTexts}
        results={batchResults}
      />

      {/* הוראות שימוש */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-bold mb-3">📖 איך זה עובד?</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>הדבק טקסט שנוצר על ידי AI בתיבה &quot;טקסט מקורי מ-AI&quot;</li>
          <li>לחץ על &quot;🔍 נתח טקסט&quot; - <strong className="text-green-600">המערכת תחיל אוטומטית דפוסים שנלמדו!</strong></li>
          <li>המערכת תזהה דפוסי AI נוספים ותתן ציון + גרסאות חלופיות</li>
          <li><strong>סמני מילה או משפט</strong> בטקסט המתוקן (עם העכבר) כדי לקבל 5-7 הצעות חלופיות</li>
          <li>לחצי על הצעה כדי להחליף אותה - <strong>השינוי נשמר אוטומטית</strong></li>
          <li>ערוכי את הטקסט ידנית במידת הצורך</li>
        </ol>
      </Card>
      
      {/* הצגת דפוסים שהוחלו אוטומטית */}
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
                <span className="text-sm font-medium text-red-600 line-through">&quot;{pattern.from}&quot;</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm font-medium text-green-600">&quot;{pattern.to}&quot;</span>
                <span className="mr-auto"></span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">✓ הוחל</span>
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
              <Button onClick={handleClear} variant="outline" className="px-4" title="נקה הכל">
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
                <Button onClick={handleStartEdit} variant="outline" size="sm" className="flex items-center gap-1">
                  <Edit2 className="w-4 h-4" />
                  ערוך
                </Button>
              )}
              {correctedText && (
                <Button onClick={handleCopy} variant="outline" size="sm" className="flex items-center gap-1">
                  {copied ? <><Check className="w-4 h-4" />הועתק!</> : <><Copy className="w-4 h-4" />העתק</>}
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
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    onMouseUp={handleTextSelection}
                    className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    dir="rtl"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      ביטול
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[300px]">
                    <p
                      className="whitespace-pre-wrap select-text text-base"
                      dir="rtl"
                      onMouseUp={handleTextSelection}
                    >
                      {correctedText}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleStartEdit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    ערוך את התיקון
                  </button>
                </>
              )}

              {/* אפשרויות חלופיות לטקסט המלא */}
              {alternatives.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
                    <Languages className="w-5 h-5" />
                    אפשרויות חלופיות ({alternatives.length} גרסאות)
                  </h3>
                  <div className="space-y-3">
                    {alternatives.map((alt, index) => {
                      const isExpanded = expandedAlternatives[index] ?? false;
                      const isSelected = selectedAlternative === alt.text;
                      const displayText = isExpanded ? alt.text : alt.text.substring(0, 150) + (alt.text.length > 150 ? '...' : '');
                      
                      return (
                        <div
                          key={index}
                          className={`p-3 bg-white rounded-lg border-2 transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-blue-200 hover:border-blue-300'
                          }`}
                        >
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
                            <button
                              onClick={() => setExpandedAlternatives(prev => ({ ...prev, [index]: !prev[index] }))}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className={`font-medium mb-1 ${isExpanded ? '' : 'line-clamp-2'}`} dir="rtl">
                            {displayText}
                          </p>
                          {alt.explanation && (
                            <p className="text-xs text-gray-600 mb-2">{alt.explanation}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSelectAlternative(alt.text)}
                              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {isSelected ? '✓ נבחרה' : 'אשר גרסה זו'}
                            </button>
                            <button
                              onClick={() => { navigator.clipboard.writeText(alt.text); alert('הגרסה הועתקה'); }}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                            >
                              העתק
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* הצעות לטקסט נבחר */}
              {showSelectionSuggestions && selectedText && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                      <Languages className="w-5 h-5" />
                      הצעות ל-&quot;{selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}&quot;
                    </h3>
                    <button
                      onClick={() => { setShowSelectionSuggestions(false); setSelectedText(''); window.getSelection()?.removeAllRanges(); }}
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
                          <p className="font-medium mb-2 text-lg" dir="rtl">{suggestion.text}</p>
                          {suggestion.explanation && (
                            <p className="text-sm text-gray-600 mb-1">{suggestion.explanation}</p>
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
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-orange-700 text-center py-4">
                      לא נמצאו הצעות. נסי לסמן טקסט אחר.
                    </p>
                  )}

                  {/* מילים נרדפות */}
                  {Object.keys(wordAlternatives).length > 0 && (
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                          <Languages className="w-5 h-5" />
                          מילים נרדפות
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
                          {Object.entries(wordAlternatives).map(([word, alts]) => (
                            <div key={word} className="p-3 bg-white rounded-lg border border-purple-200">
                              <p className="font-medium text-purple-900 mb-2">&quot;{word}&quot; →</p>
                              <div className="flex flex-wrap gap-2">
                                {alts.map((alt, idx) => (
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

      {/* ניתוח ובעיות */}
      {analysis && analysis.issues.length > 0 && (
        <IssuesPanel
          issues={analysis.issues}
          issueStates={issueStates}
          issueCustomInputs={issueCustomInputs}
          issueCustomActive={issueCustomActive}
          issueCustomApplied={issueCustomApplied}
          onAcceptIssue={handleAcceptIssue}
          onDismissIssue={handleDismissIssue}
          onUndoDecision={handleUndoIssueDecision}
          onToggleCustomInput={toggleCustomIssueInput}
          onCustomInputChange={handleCustomInputChange}
          onApplyCustom={handleApplyCustomIssue}
          onCancelCustom={handleCancelCustomIssue}
        />
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
