'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Save, X, Copy, Check, Loader2, Languages, ChevronDown, ChevronUp } from 'lucide-react';

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

export default function AICorrector() {
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
          applyPatterns: false, // לא נחיל תיקונים אוטומטיים
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
      
      // אפשרויות חלופיות לטקסט המלא - לוודא שיש לפחות 3 גרסאות
      const receivedAlternatives = data.alternatives || [];
      if (receivedAlternatives.length === 0) {
        console.warn('No alternatives received from API');
      }
      setAlternatives(receivedAlternatives);
      
      // הטקסט המתוקן מתחיל עם התיקון הראשי המומלץ (כמו בתכונת התרגום)
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
    try {
      const response = await fetch('/api/ai-correction/save-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: original,
          correctedText: corrected,
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
      const response = await fetch('/api/ai-correction/save-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: selectedText,
          correctedText: suggestionText,
          userId: 'default-user',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Pattern saved automatically:', data.message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving pattern automatically:', error);
      // לא נכשיל את התהליך אם השמירה נכשלה
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

        if (response.ok) {
          console.log('Alternative pattern saved automatically');
          // לא נציג הודעה כי זה יכול להיות מפריע אם יש הרבה שינויים
        }
      } catch (error) {
        console.error('Error saving alternative pattern:', error);
        // לא נכשיל את התהליך אם השמירה נכשלה
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

  // שמירת התיקון המלא (אופציונלי - לא חובה)
  const saveCorrection = async () => {
    const textToSave = editedText || correctedText;
    
    if (!originalText.trim() || !textToSave.trim()) {
      alert('אנא וודא שיש טקסט מקורי וטקסט מתוקן');
      return;
    }

    if (originalText === textToSave) {
      alert('הטקסט המתוקן זהה למקורי - אין תיקון לשמור');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/ai-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText,
          correctedText: textToSave,
          category: 'general',
          userId: 'default-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `שגיאת שרת: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'השמירה נכשלה');
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // עדכון הטקסט המתוקן
      setCorrectedText(textToSave);
      setEditedText(textToSave);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving correction:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בשמירת התיקון: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* הוראות שימוש */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-bold mb-3">📖 איך זה עובד?</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>הדבק טקסט שנוצר על ידי AI בתיבה "טקסט מקורי מ-AI"</li>
          <li>לחץ על "🔍 נתח טקסט" כדי לקבל ניתוח מפורט - המערכת תזהה דפוסי AI ותתן ציון</li>
          <li><strong>סמני מילה או משפט</strong> בטקסט המתוקן (עם העכבר) כדי לקבל 5-7 הצעות חלופיות</li>
          <li>לחצי על הצעה כדי להחליף אותה - <strong>השינוי נשמר אוטומטית</strong> (שמירה נקודתית)</li>
          <li>ערוכי את הטקסט ידנית במידת הצורך</li>
          <li>לחצי על "💾 שמור תיקון מלא" רק אם רוצה לשמור את כל התיקון (אופציונלי)</li>
        </ol>
      </Card>

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
                      onClick={saveCorrection}
                      disabled={isSaving || originalText === editedText}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          שומר...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          שמור תיקון מלא (אופציונלי)
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
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
                                          
                                          if (originalPart !== selectedPart) {
                                            await savePatternAutomatically(originalPart, selectedPart);
                                            alert(`החלק נשמר: "${originalPart}" → "${selectedPart}"`);
                                          } else {
                                            alert('החלק שנבחר זהה למקור');
                                          }
                                        } else {
                                          // חלק חדש לחלוטין
                                          await savePatternAutomatically('', selectedPart);
                                          alert(`החלק החדש נשמר: "${selectedPart}"`);
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
