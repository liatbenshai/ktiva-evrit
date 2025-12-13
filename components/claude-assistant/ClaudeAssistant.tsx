'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Trash2, Copy, Check, Upload, Download, FileText, Sparkles, Globe, Search, Lightbulb, BookOpen, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { extractTextFromImageClient, processImagesFromBase64 } from '@/lib/ocr-client';
import { exportToTXT, exportToWord, exportToPDF } from '@/lib/export-utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
}

export default function ClaudeAssistant() {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = session?.user?.email || 'default-user';

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  // התאמת גובה של textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // זיהוי URL בטקסט
  const extractURLs = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    const urls = extractURLs(userMessage);
    setMessage('');
    setError(null);
    setShowExamples(false);

    // הוספת הודעת המשתמש להיסטוריה
    const updatedHistory: Message[] = [...history, { role: 'user' as const, content: userMessage }];
    setHistory(updatedHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/claude-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history,
          userId,
          urls: urls.length > 0 ? urls : undefined,
          needsWebSearch: !urls.length && (userMessage.includes('?') || userMessage.includes('מה') || userMessage.includes('איך') || userMessage.includes('למה')),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשליחת ההודעה');
      }

      const data = await response.json();
      
      // הוספת תגובת העוזר להיסטוריה
      setHistory([...updatedHistory, { 
        role: 'assistant' as const, 
        content: data.message,
        sources: data.sources,
      }]);
      
      // הצגת הודעה אם הוחלו דפוסים
      if (data.appliedPatterns && data.appliedPatterns.length > 0) {
        console.log(`✅ הוחלו ${data.appliedPatterns.length} דפוסים שנלמדו על התגובה`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'אירעה שגיאה. נסה שוב מאוחר יותר.');
      // הסרת הודעת המשתמש מההיסטוריה אם הייתה שגיאה
      setHistory(history);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל השיחה?')) {
      setHistory([]);
      setError(null);
      setShowExamples(true);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExport = async (text: string, format: 'txt' | 'docx' | 'pdf') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `liatAI-${timestamp}`;
      
      if (format === 'txt') {
        exportToTXT(text, filename);
      } else if (format === 'docx') {
        await exportToWord(text, filename);
      } else if (format === 'pdf') {
        await exportToPDF(text, filename);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert(`שגיאה בייצוא: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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

    // Check file size (4.5MB limit)
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB
    if (file.size > maxSize) {
      alert(`הקובץ גדול מדי (${(file.size / 1024 / 1024).toFixed(1)}MB). מקסימום: 4.5MB.\nנסי להקטין את התמונה או להשתמש בקובץ קטן יותר.`);
      return;
    }

    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|tiff|tif)$/i.test(file.name);
    
    try {
      let text = '';
      
      if (isImage) {
        // Process images on client side with OCR
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        if (file.size > 2 * 1024 * 1024) {
          alert(`מעבד תמונה גדולה (${sizeMB}MB)... זה עלול לקחת 30-60 שניות. אנא המתיני בסבלנות.`);
        } else {
          alert('מעבד תמונה... זה עלול לקחת כמה שניות.');
        }
        
        text = await extractTextFromImageClient(file);
      } else {
        // Process other files on server
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to process file');
        }

        const result = await response.json();
        text = result.text;
        
        // If the document contains images, process them with OCR and replace placeholders
        if (result.hasImages && result.images && result.images.length > 0) {
          alert(`נמצאו ${result.images.length} תמונות במסמך. מעבד תמונות... זה עלול לקחת זמן.`);
          try {
            const imageResults = await processImagesFromBase64(result.images);
            
            // Replace image placeholders in the text with OCR results
            imageResults.forEach((result, idx) => {
              const placeholder = `[תמונה ${idx + 1}]`;
              const placeholderRegex = new RegExp(`\\[תמונה ${idx + 1}\\]`, 'g');
              
              if (text.includes(placeholder)) {
                if (result.text && result.text.trim()) {
                  text = text.replace(placeholderRegex, result.text);
                } else {
                  text = text.replace(placeholderRegex, `[שגיאה בעיבוד תמונה: ${result.error || 'לא נמצא טקסט'}]`);
                }
              }
            });
          } catch (error) {
            console.error('Error processing images from DOCX:', error);
          }
        }
      }
      
      if (!text || text.trim().length === 0) {
        alert('לא נמצא טקסט בקובץ. אם זו תמונה, ייתכן שהתמונה לא מכילה טקסט ברור.');
        return;
      }
      
      // הוספת הטקסט להודעה הנוכחית
      setMessage((prev) => (prev ? `${prev}\n\n${text}` : text));
      
      alert(`הקובץ נקרא בהצלחה! נמצאו ${text.length} תווים. הטקסט נוסף להודעה.`);
    } catch (error) {
      console.error('Error reading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בקריאת הקובץ';
      alert(`שגיאה בקריאת הקובץ: ${errorMessage}`);
    }
  };

  const exampleQuestions = [
    {
      icon: Search,
      title: 'חיפוש ברשת',
      examples: [
        'מה זה בינה מלאכותית?',
        'איך עובד ChatGPT?',
        'מה ההבדל בין React ל-Vue?',
      ],
    },
    {
      icon: Globe,
      title: 'שאלות על URL',
      examples: [
        'https://example.com מה כתוב בדף הזה?',
        'סכם לי את המאמר הזה: https://example.com/article',
      ],
    },
    {
      icon: BookOpen,
      title: 'כתיבה ועריכה',
      examples: [
        'כתוב לי מאמר על נושא X',
        'שפר את הטקסט הזה...',
        'תרגם את זה לעברית',
      ],
    },
    {
      icon: Lightbulb,
      title: 'ייעוץ ועזרה',
      examples: [
        'איך אני יכול לשפר את הכתיבה שלי?',
        'תן לי טיפים לכתיבת מייל מקצועי',
        'מה הדרך הטובה ביותר ללמוד עברית?',
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
      {/* כותרת משופרת */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-5 lg:p-6 border-b border-white/20">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">liatAI</h2>
                <p className="text-xs sm:text-sm text-white/90 mt-0.5 sm:mt-1">
                  העוזר החכם שלך - חיפוש ברשת, עיבוד קבצים, כתיבה ועוד
                </p>
              </div>
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white hover:bg-white/20 rounded-lg sm:rounded-xl transition-all border border-white/30 hover:scale-105 flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">נקה שיחה</span>
              <span className="sm:hidden">נקה</span>
            </button>
          )}
        </div>
      </div>

      {/* אזור ההודעות */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6 space-y-4 sm:space-y-5 lg:space-y-6">
        {history.length === 0 && showExamples && (
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl mb-3 sm:mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 px-2">
                בואי נתחיל
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 max-w-md mx-auto px-2">
                שאלי כל שאלה, הדביקי URL, העלי קבצים או בקשי עזרה בכתיבה. אני כאן לעזור!
              </p>
            </div>

            {/* דוגמאות */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {exampleQuestions.map((category, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-white/50 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] sm:hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <category.icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">{category.title}</h4>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {category.examples.map((example, exIdx) => (
                      <button
                        key={exIdx}
                        onClick={() => {
                          setMessage(example);
                          setShowExamples(false);
                          textareaRef.current?.focus();
                        }}
                        className="w-full text-right text-xs sm:text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* יכולות */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-indigo-200/50">
              <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                מה אני יכול לעשות?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>חיפוש ברשת - מציאת מידע עדכני מ-Google ומקורות נוספים</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>עיבוד URLs - קריאת תוכן מדפי אינטרנט ושאלות עליהם</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>עיבוד קבצים - PDF, DOCX, תמונות עם OCR</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>כתיבה ועריכה - מאמרים, מיילים, תרגומים</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>ייעוץ ועזרה - טיפים, הסברים, המלצות</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>שיחות המשך - שאלות המשך על תשובות קודמות</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {history.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl px-3 sm:px-4 lg:px-5 py-3 sm:py-4 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.content}</div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">מקורות:</p>
                  <div className="space-y-1">
                    {msg.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-indigo-600 hover:text-indigo-800 hover:underline truncate"
                      >
                        {source.title || source.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {msg.role === 'assistant' && (
                <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 flex-wrap pt-2 sm:pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleCopy(msg.content, index)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors px-1 py-0.5"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-3 h-3" />
                        הועתק!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        העתק
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-1 sm:gap-1.5 border-r border-gray-300 pr-2 sm:pr-3">
                    <button
                      onClick={() => handleExport(msg.content, 'txt')}
                      className="flex items-center gap-0.5 sm:gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-1 py-0.5"
                      title="ייצא ל-TXT"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="hidden sm:inline">TXT</span>
                    </button>
                    <button
                      onClick={() => handleExport(msg.content, 'docx')}
                      className="flex items-center gap-0.5 sm:gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-1 py-0.5"
                      title="ייצא ל-Word"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="hidden sm:inline">DOCX</span>
                    </button>
                    <button
                      onClick={() => handleExport(msg.content, 'pdf')}
                      className="flex items-center gap-0.5 sm:gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-1 py-0.5"
                      title="ייצא ל-PDF"
                    >
                      <Download className="w-3 h-3" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-gray-200 rounded-3xl px-5 py-4 shadow-lg">
              <div className="flex items-center gap-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="font-medium">מחפש מידע ומכין תשובה...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 text-red-700">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* אזור הקלט משופר */}
      <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm p-3 sm:p-4 lg:p-5">
        <div className="flex gap-2 sm:gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="שאלי שאלה, הדביקי URL, או כתבי מה את צריכה..."
            rows={1}
            dir="rtl"
            className="flex-1 resize-none rounded-xl sm:rounded-2xl border-2 border-gray-200 px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex-shrink-0"
            title="העלה קובץ"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-sm sm:text-base flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">שלח</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 text-right px-1">
          <span className="hidden sm:inline">לחצי Enter לשליחה, Shift+Enter לשורה חדשה • </span>ניתן להעלות קבצי PDF, DOCX, TXT או תמונות<span className="hidden sm:inline"> • הדביקי URL לשאלות על דפי אינטרנט</span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
