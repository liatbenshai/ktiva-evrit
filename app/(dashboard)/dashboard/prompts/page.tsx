'use client';

import { useState, useRef } from 'react';
import { Loader2, Languages, Copy, Check, RotateCcw, Edit2, Save, X, Upload } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import { extractTextFromImageClient, processImagesFromBase64 } from '@/lib/ocr-client';

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [fromLang, setFromLang] = useState<'hebrew' | 'english' | 'russian'>('english');
  const [toLang, setToLang] = useState<'hebrew' | 'english' | 'russian'>('hebrew');
  const [context, setContext] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [alternatives, setAlternatives] = useState<Array<{
    text: string;
    explanation?: string;
    context?: string;
  }>>([]);
  const [wordAlternatives, setWordAlternatives] = useState<{ [key: string]: string[] }>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState('');
  const [translationId, setTranslationId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [showWordAlternatives, setShowWordAlternatives] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionSuggestions, setSelectionSuggestions] = useState<Array<{
    text: string;
    explanation?: string;
    tone?: string;
    whenToUse?: string;
  }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSelectionSuggestions, setShowSelectionSuggestions] = useState(false);
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
            const imagesText = await processImagesFromBase64(result.images);
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
      alert('הקובץ נקרא בהצלחה! הטקסט הועתק לשדה התרגום.');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

  const handleTranslate = async () => {
    if (!text.trim()) {
      alert('נא להזין טקסט לתרגום');
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          fromLang,
          toLang,
          context: context || undefined,
          trackCorrections: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to translate');
      }

      const data = await response.json();
      setTranslatedText(data.result);
      setEditedTranslation(data.result);
      setAlternatives(data.alternatives || []);
      setWordAlternatives(data.wordAlternatives || {});
      setTranslationId(data.translationId);
      setIsEditing(false);
      setSelectedAlternative(null);
    } catch (error: any) {
      console.error('Error:', error);
      alert(`אירעה שגיאה בתרגום: ${error.message || 'Unknown error'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    // אם יש תרגום, נעשה swap גם לו
    if (translatedText) {
      const tempText = text;
      setText(translatedText);
      setTranslatedText(tempText);
      setEditedTranslation(tempText);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedTranslation || translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCorrection = async () => {
    if (!translationId || !translatedText || !editedTranslation) {
      return;
    }

    try {
      const response = await fetch('/api/translate/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: text,
          translatedText: translatedText,
          correctedText: editedTranslation,
          fromLang,
          toLang,
          context: context || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to save correction');

      setShowSuccess(true);
      setIsEditing(false);
      setTranslatedText(editedTranslation);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving correction:', error);
      alert('אירעה שגיאה בשמירת התיקון');
    }
  };

  const handleStartEdit = () => {
    setEditedTranslation(translatedText);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedTranslation(translatedText);
    setIsEditing(false);
  };

  const handleSelectAlternative = (alternativeText: string) => {
    setEditedTranslation(alternativeText);
    setSelectedAlternative(alternativeText);
    setIsEditing(true);
  };

  const handleSelectWordAlternative = (originalWord: string, alternativeWord: string) => {
    // החלפת המילה בתרגום
    const currentText = editedTranslation || translatedText;
    // החלפה של המילה הראשונה בלבד
    const escapedWord = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    const newTranslation = currentText.replace(regex, (match, offset) => {
      // החלף רק את ההופעה הראשונה
      if (offset === currentText.toLowerCase().search(new RegExp(`\\b${escapedWord}\\b`, 'gi'))) {
        return alternativeWord;
      }
      return match;
    });
    setEditedTranslation(newTranslation);
    setIsEditing(true);
  };

  const handleTextSelection = async () => {
    // רק אם לא בעריכה
    if (isEditing) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const selectedTextValue = selection.toString().trim();
    if (selectedTextValue.length < 2) {
      // ביטול בחירה אם הטקסט קצר מדי
      if (selectedText) {
        setSelectedText('');
        setShowSelectionSuggestions(false);
      }
      return;
    }

    // בדיקה שהבחירה בתוך התרגום ולא מחוץ לו
    const range = selection.getRangeAt(0);
    const textElement = range.commonAncestorContainer;
    if (!textElement || !textElement.textContent?.includes(selectedTextValue)) {
      return;
    }

    setSelectedText(selectedTextValue);
    setIsLoadingSuggestions(true);
    setShowSelectionSuggestions(true);

    try {
      const response = await fetch('/api/translate/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText: selectedTextValue,
          fullText: translatedText,
          fromLang: fromLang, // השפה המקורית - כדי להבין את ההקשר
          toLang: toLang, // השפה של התרגום - הצעות באותה שפה
          context: context || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      setSelectionSuggestions(data.suggestions || []);
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      alert(`אירעה שגיאה בהשגת הצעות: ${error.message || 'Unknown error'}`);
      setSelectionSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestionText: string) => {
    if (!translatedText || !selectedText) return;

    // החלפת הטקסט הנבחר בהצעה (רק התרחשות ראשונה)
    const index = translatedText.indexOf(selectedText);
    if (index === -1) return;

    const newTranslation = 
      translatedText.substring(0, index) + 
      suggestionText + 
      translatedText.substring(index + selectedText.length);
    
    setEditedTranslation(newTranslation);
    setTranslatedText(newTranslation);
    setSelectedText('');
    setSelectionSuggestions([]);
    setShowSelectionSuggestions(false);
    setIsEditing(true);
    
    // ביטול הבחירה
    window.getSelection()?.removeAllRanges();
  };

  const theme = getPageTheme('prompts');

  return (
    <DashboardPageWrapper
      icon={Languages}
      title="תרגום מתוחכם"
      description="תרגום אוטומטי מאנגלית לעברית ומעברית לאנגלית עם למידה מתיקונים"
      theme={theme}
    >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              טקסט לתרגום
            </h2>

            <div className="space-y-6">
              {/* Language Selection */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    משפה
                  </label>
                  <select
                    value={fromLang}
                    onChange={(e) => setFromLang(e.target.value as 'hebrew' | 'english' | 'russian')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="english">אנגלית</option>
                    <option value="hebrew">עברית</option>
                    <option value="russian">רוסית</option>
                  </select>
                </div>

                <button
                  onClick={handleSwapLanguages}
                  className="mt-6 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="החלף שפות"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    לשפה
                  </label>
                  <select
                    value={toLang}
                    onChange={(e) => setToLang(e.target.value as 'hebrew' | 'english' | 'russian')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="hebrew">עברית</option>
                    <option value="english">אנגלית</option>
                    <option value="russian">רוסית</option>
                  </select>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הטקסט לתרגום
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    fromLang === 'english' ? 'Enter text in English...' :
                    fromLang === 'hebrew' ? 'הזיני טקסט בעברית...' :
                    'Введите текст на русском...'
                  }
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      dir={fromLang === 'english' || fromLang === 'russian' ? 'ltr' : 'rtl'}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-teal-300 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:border-teal-400 hover:bg-teal-50"
                  >
                    <Upload className="h-4 w-4" />
                    העלה קובץ (PDF / DOCX / TXT / תמונות)
                  </button>
                  <span className="text-xs text-gray-500">הטקסט ייכנס לשדה התרגום</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Context (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הקשר (אופציונלי)
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="למשל: מייל עסקי, מאמר טכני, שיחה רשמית"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <button
                onClick={handleTranslate}
                disabled={isTranslating || !text.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg font-medium"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    מתרגם...
                  </>
                ) : (
                  <>
                    <Languages className="w-5 h-5" />
                    תרגם
                  </>
                )}
              </button>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <h3 className="font-semibold text-teal-900 mb-2">💡 מידע</h3>
                <ul className="space-y-1 text-sm text-teal-800">
                  <li>• התרגום משתמש במילון התרגומים שלך</li>
                  <li>• המערכת לומדת מתיקונים שלך</li>
                  <li>• ניתן לשמור תיקונים כדי לשפר תרגומים עתידיים</li>
                  <li>• הוסף הקשר לקבלת תרגום מדויק יותר</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                התרגום
              </h2>
              <div className="flex gap-2">
                {translatedText && !isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="ערוך תרגום"
                  >
                    <Edit2 className="w-4 h-4" />
                    ערוך
                  </button>
                )}
                {translatedText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
                  </button>
                )}
              </div>
            </div>

            {showSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ התיקון נשמר! המערכת תלמד מהתיקון שלך.
                </p>
              </div>
            )}

            {translatedText ? (
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <textarea
                      value={editedTranslation}
                      onChange={(e) => setEditedTranslation(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none font-mono text-sm bg-gray-50"
                      style={{ minHeight: '300px' }}
                      dir={toLang === 'english' || toLang === 'russian' ? 'ltr' : 'rtl'}
                      rows={12}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCorrection}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        שמור תיקון וללמד מהמערכת
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        ביטול
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      כשאת שומרת תיקון, המערכת תלמד ממנו ותשפר את התרגומים הבאים
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[300px] relative">
                      <p
                        className="whitespace-pre-wrap select-text"
                        dir={toLang === 'english' || toLang === 'russian' ? 'ltr' : 'rtl'}
                        onMouseUp={handleTextSelection}
                      >
                        {translatedText}
                      </p>
                      {selectedText && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 shadow-lg">
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
                      ערוך תרגום ושמור כדי ללמד את המערכת
                    </button>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        💡 <strong>טיפ:</strong> סמני מילה או משפט בתרגום כדי לקבל הצעות חלופיות ספציפיות
                      </p>
                    </div>
                  </>
                )}

                {/* אפשרויות חלופיות לתרגום המלא */}
                {alternatives.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Languages className="w-5 h-5" />
                      אפשרויות חלופיות לתרגום המלא
                    </h3>
                    <div className="space-y-3">
                      {alternatives.map((alt, index) => (
                        <div
                          key={index}
                          className={`p-3 bg-white rounded-lg border-2 transition-all cursor-pointer ${
                            selectedAlternative === alt.text
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-blue-200 hover:border-blue-300'
                          }`}
                          onClick={() => handleSelectAlternative(alt.text)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p
                                className="font-medium mb-1"
                                dir={toLang === 'english' || toLang === 'russian' ? 'ltr' : 'rtl'}
                              >
                                {alt.text}
                              </p>
                              {alt.explanation && (
                                <p className="text-xs text-gray-600 mb-1">
                                  {alt.explanation}
                                </p>
                              )}
                              {alt.context && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  {alt.context}
                                </span>
                              )}
                            </div>
                            {selectedAlternative === alt.text && (
                              <div className="text-blue-600">
                                <Check className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
                                  dir={toLang === 'english' || toLang === 'russian' ? 'ltr' : 'rtl'}
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
                  </div>
                )}

                {/* אפשרויות חלופיות למילים */}
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
                              "{word}" →
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
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                הזיני טקסט ולחצי על &quot;תרגם&quot; כדי להתחיל
              </div>
            )}
          </div>
        </div>
    </DashboardPageWrapper>
  );
}
