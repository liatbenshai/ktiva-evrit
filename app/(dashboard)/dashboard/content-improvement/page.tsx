'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, Copy, Check, Loader2, Edit2, X, Languages, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { extractTextFromImageClient, processImagesFromBase64Legacy } from '@/lib/ocr-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';

interface ContentChange {
  type: 'style' | 'tone' | 'clarity' | 'grammar' | 'terminology' | 'other';
  description: string;
  original?: string;
  improved?: string;
}

interface ContentSource {
  title: string;
  url: string;
}

interface ContentImprovement {
  improvedText: string;
  changes: ContentChange[];
  explanation: string;
  additionalRecommendations: string[];
  overallScore: number;
}

interface Suggestion {
  text: string;
  explanation?: string;
  tone?: string;
  whenToUse?: string;
}

interface Alternative {
  text: string;
  explanation?: string;
  context?: string;
}

const PROFESSIONS = [
  'כללי',
  'משפטים',
  'רפואה',
  'חינוך',
  'טכנולוגיה',
  'שיווק',
  'עסקים',
  'אקדמיה',
  'עיתונות',
  'תקשורת',
  'אחר',
];

export default function ContentImprovementPage() {
  const [text, setText] = useState('');
  const [profession, setProfession] = useState('כללי');
  const [customProfession, setCustomProfession] = useState('');
  const [goal, setGoal] = useState('');
  const [improvement, setImprovement] = useState<ContentImprovement | null>(null);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // עריכה והצעות
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [expandedAlternatives, setExpandedAlternatives] = useState<{ [key: number]: boolean }>({});
  
  // הצעות לטקסט נבחר
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionSuggestions, setSelectionSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSelectionSuggestions, setShowSelectionSuggestions] = useState(false);
  const [wordAlternatives, setWordAlternatives] = useState<{ [key: string]: string[] }>({});
  const [showWordAlternatives, setShowWordAlternatives] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.match(/\.(pdf|docx|txt|jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i)) {
      alert('נא להעלות קובץ מסוג: PDF, DOCX, TXT או תמונה (JPG, PNG וכו\')');
      return;
    }

    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i.test(file.name);

    try {
      let text = '';
      
      if (isImage) {
        alert('מעבד תמונה... זה עלול לקחת כמה שניות.');
        text = await extractTextFromImageClient(file);
      } else {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to process file');
        }

        const result = await response.json();
        text = result.text;
        
        // If the document contains images, process them with OCR
        if (result.hasImages && result.images && result.images.length > 0) {
          alert(`נמצאו ${result.images.length} תמונות במסמך. מעבד תמונות... זה עלול לקחת זמן.`);
          try {
            const imagesText = await processImagesFromBase64Legacy(result.images);
            if (imagesText && imagesText.trim()) {
              text = text ? `${text}\n\n${imagesText}` : imagesText;
            }
          } catch (error) {
            console.error('Error processing images from DOCX:', error);
            // Continue with text even if image processing fails
          }
        }
      }

      setText(text);
      alert('הקובץ נקרא בהצלחה! הטקסט הועתק לשדה התוכן.');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

  const handleImprove = async () => {
    if (!text.trim()) {
      setError('נא להזין טקסט לשיפור');
      return;
    }

    if (profession === 'אחר' && !customProfession.trim() && !goal.trim()) {
      setError('נא להזין מקצוע או מטרה');
      return;
    }

    setIsImproving(true);
    setError(null);
    setImprovement(null);
    setSources([]);
    setCopied(false);

    try {
      const selectedProfession = profession === 'אחר' ? customProfession : profession;
      const response = await fetch('/api/content-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          profession: selectedProfession !== 'כללי' ? selectedProfession : undefined,
          goal: goal || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשיפור התוכן');
      }

      const data = await response.json();
      setImprovement(data.improvement);
      setSources(data.sources || []);
      setAlternatives(data.alternatives || []);
      setEditedText(data.improvement.improvedText);
      setIsEditing(false);
      setSelectedAlternative(null);
    } catch (err: any) {
      setError(err.message || 'שגיאה בשיפור התוכן');
      console.error('Error improving content:', err);
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopy = async () => {
    if (!improvement) return;
    try {
      const textToCopy = isEditing ? editedText : improvement.improvedText;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // התחלת עריכה
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedText(improvement?.improvedText || '');
  };

  // ביטול עריכה
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(improvement?.improvedText || '');
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
    if (!text || !improvement) return;

    setIsLoadingSuggestions(true);
    setShowSelectionSuggestions(true);
    try {
      const response = await fetch('/api/ai-correction/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText: text,
          fullText: editedText || improvement.improvedText,
          context: 'שיפור תוכן',
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
      setWordAlternatives(data.wordAlternatives || {});
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בקבלת הצעות: ${errorMessage}`);
      setSelectionSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // בחירת הצעה לטקסט נבחר
  const handleSelectSuggestion = (suggestionText: string) => {
    if (!improvement || !selectedText) return;

    const currentText = editedText || improvement.improvedText;
    const index = currentText.indexOf(selectedText);
    if (index === -1) return;

    const newText = 
      currentText.substring(0, index) + 
      suggestionText + 
      currentText.substring(index + selectedText.length);
    
    setEditedText(newText);
    setSelectedText('');
    setSelectionSuggestions([]);
    setShowSelectionSuggestions(false);
    setIsEditing(true);
    
    window.getSelection()?.removeAllRanges();
  };

  // בחירת מילה נרדפת
  const handleSelectWordAlternative = (originalWord: string, alternativeWord: string) => {
    const currentText = editedText || improvement?.improvedText || '';
    const escapedWord = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    const newText = currentText.replace(regex, (match, offset) => {
      if (offset === currentText.toLowerCase().search(new RegExp(`\\b${escapedWord}\\b`, 'gi'))) {
        return alternativeWord;
      }
      return match;
    });
    setEditedText(newText);
    setIsEditing(true);
  };

  // בחירת אפשרות חלופית לטקסט המלא
  const handleSelectAlternative = (alternativeText: string) => {
    setEditedText(alternativeText);
    setSelectedAlternative(alternativeText);
    setIsEditing(true);
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      style: 'סגנון',
      tone: 'טון',
      clarity: 'בהירות',
      grammar: 'דקדוק',
      terminology: 'טרמינולוגיה',
      other: 'אחר',
    };
    return labels[type] || type;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const theme = getPageTheme('content-improvement');

  return (
    <DashboardPageWrapper
      icon={Sparkles}
      title="שיפור תוכן"
      description="הזיני טקסט ובחרי מקצוע או מטרה, והמערכת תשפר את התוכן בהתאם."
      theme={theme}
    >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Panel */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">הזנת תוכן</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="text" className="mb-2 block text-sm font-medium text-gray-700">
                  הטקסט לשיפור
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="הזיני את הטקסט שברצונך לשפר..."
                  className="min-h-[200px] w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  dir="rtl"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <Upload className="h-4 w-4" />
                    העלה קובץ (PDF / DOCX / TXT / תמונות)
                  </button>
                  <span className="text-xs text-gray-500">הטקסט ייכנס לשדה התוכן</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label htmlFor="profession" className="mb-2 block text-sm font-medium text-gray-700">
                  מקצוע
                </label>
                <select
                  id="profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {PROFESSIONS.map((prof) => (
                    <option key={prof} value={prof}>
                      {prof}
                    </option>
                  ))}
                </select>
              </div>

              {profession === 'אחר' && (
                <div>
                  <label htmlFor="customProfession" className="mb-2 block text-sm font-medium text-gray-700">
                    הזני מקצוע מותאם
                  </label>
                  <input
                    id="customProfession"
                    type="text"
                    value={customProfession}
                    onChange={(e) => setCustomProfession(e.target.value)}
                    placeholder="לדוגמה: אדריכלות, פסיכולוגיה..."
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    dir="rtl"
                  />
                </div>
              )}

              <div>
                <label htmlFor="goal" className="mb-2 block text-sm font-medium text-gray-700">
                  מטרה (אופציונלי)
                </label>
                <input
                  id="goal"
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="לדוגמה: שכנוע לקוחות, הסבר טכני, תוכן שיווקי..."
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  dir="rtl"
                />
              </div>

              <Button
                onClick={handleImprove}
                disabled={isImproving || !text.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isImproving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    משפר...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-4 w-4" />
                    שפר תוכן
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </Card>

          {/* Results Panel */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">תוצאות שיפור</h2>

            {!improvement && (
              <div className="flex min-h-[300px] items-center justify-center text-gray-400">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">התוצאות יופיעו כאן לאחר השיפור</p>
                </div>
              </div>
            )}

            {improvement && (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="rounded-lg bg-indigo-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">ציון איכות:</span>
                    <span className={`text-lg font-bold ${getScoreColor(improvement.overallScore)}`}>
                      {improvement.overallScore}/100
                    </span>
                  </div>
                </div>

                {/* Improved Text */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">הטקסט המשופר</h3>
                    <div className="flex gap-2">
                      {!isEditing && (
                        <Button
                          onClick={handleStartEdit}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <Edit2 className="ml-1 h-3 w-3" />
                          ערוך
                        </Button>
                      )}
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        {copied ? (
                          <>
                            <Check className="ml-1 h-3 w-3" />
                            הועתק
                          </>
                        ) : (
                          <>
                            <Copy className="ml-1 h-3 w-3" />
                            העתק
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        onMouseUp={handleTextSelection}
                        onTouchEnd={handleTextSelection}
                        className="min-h-[200px] w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                        dir="rtl"
                      />
                      {selectedText && (
                        <div className="relative">
                          <div className="absolute top-2 right-2 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg z-10">
                            <span>טקסט נבחר: "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"</span>
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
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <X className="ml-1 h-3 w-3" />
                          ביטול
                        </Button>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          💡 <strong>טיפ:</strong> סמני מילה או משפט בטקסט כדי לקבל הצעות חלופיות
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="min-h-[150px] rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap select-text relative"
                      onMouseUp={handleTextSelection}
                      onTouchEnd={handleTextSelection}
                    >
                      {improvement.improvedText}
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
                  )}
                </div>

                {/* Explanation */}
                {improvement.explanation && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">הסבר על השיפורים</h3>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
                      {improvement.explanation}
                    </div>
                  </div>
                )}

                {/* Changes */}
                {improvement.changes && improvement.changes.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">רשימת שינויים</h3>
                    <div className="space-y-2">
                      {improvement.changes.map((change, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {getChangeTypeLabel(change.type)}
                            </span>
                          </div>
                          <p className="text-gray-700">{change.description}</p>
                          {change.original && change.improved && (
                            <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                              <div>
                                <span className="text-xs font-medium text-red-600">לפני:</span>
                                <p className="text-xs text-gray-600">{change.original}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-green-600">אחרי:</span>
                                <p className="text-xs text-gray-600">{change.improved}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Recommendations */}
                {improvement.additionalRecommendations && improvement.additionalRecommendations.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">המלצות נוספות</h3>
                    <ul className="list-disc space-y-1 pr-5 text-sm text-gray-700">
                      {improvement.additionalRecommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {sources && sources.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">מקורות מידע שנמצאו</h3>
                    <div className="space-y-2 rounded-lg bg-blue-50 p-3">
                      {sources.map((source, idx) => (
                        <div key={idx} className="text-sm">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {source.title}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* אפשרויות חלופיות לטקסט המלא */}
                {alternatives.length > 0 && (
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
                                onClick={() => {
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

                            <p
                              className={`font-medium mb-1 cursor-pointer select-text ${isExpanded ? '' : 'line-clamp-2'}`}
                              dir="rtl"
                            >
                              {displayText}
                            </p>

                            {alt.explanation && (
                              <p className="text-xs text-gray-600 mb-2 mt-1">
                                {alt.explanation}
                              </p>
                            )}

                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSelectAlternative(alt.text)}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {isSelected ? '✓ נבחרה' : 'אשר גרסה זו'}
                              </button>
                              <button
                                onClick={() => {
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
                )}

                {/* הצעות לטקסט נבחר */}
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
            )}
          </Card>
        </div>
    </DashboardPageWrapper>
  );
}

