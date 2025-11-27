'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Trash2, Copy, Check, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ClaudeAssistant() {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setError(null);

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשליחת ההודעה');
      }

      const data = await response.json();
      
      // הוספת תגובת העוזר להיסטוריה
      setHistory([...updatedHistory, { role: 'assistant' as const, content: data.message }]);
      
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

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      const { text } = await response.json();
      
      // הוספת הטקסט להודעה הנוכחית
      setMessage((prev) => (prev ? `${prev}\n\n${text}` : text));
      
      alert('הקובץ נקרא בהצלחה! הטקסט נוסף להודעה.');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-xl shadow-xl border-2 border-gray-300 overflow-hidden">
      {/* כותרת */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          <div>
            <h2 className="text-2xl font-bold text-white">liatAI</h2>
            <p className="text-sm text-white/90 mt-1">
              שאלי כל שאלה או כתבי מה את צריכה, ואני אענה בעברית תקנית. אפשר לשאול שאלות המשך.
            </p>
          </div>
          {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 rounded-lg transition-colors border border-white/30"
          >
            <Trash2 className="w-4 h-4" />
            נקה שיחה
          </button>
        )}
      </div>

      {/* אזור ההודעות */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-gray-50">
        {history.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                בואי נתחיל
              </h3>
              <p className="text-gray-600">
                שאלי כל שאלה או כתבי מה את צריכה, ואני אענה בעברית תקנית וזורמת.
              </p>
            </div>
          </div>
        )}

        {history.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(msg.content, index)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
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
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>כותב...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* אזור הקלט */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="כתבי מה את צריכה..."
            rows={1}
            dir="rtl"
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
            title="העלה קובץ"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                שלח
              </>
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif"
          onChange={handleFileUpload}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2 text-right">
          לחצי Enter לשליחה, Shift+Enter לשורה חדשה • ניתן להעלות קבצי PDF, DOCX, TXT או תמונות
        </p>
      </div>
    </div>
  );
}
