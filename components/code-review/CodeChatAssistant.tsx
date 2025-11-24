'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, MessageSquare, X, Copy, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string; // קוד מתוקן אם יש
}

interface CodeChatAssistantProps {
  originalCode: string;
  fileName?: string;
  onCodeGenerated?: (fixedCode: string) => void;
}

export default function CodeChatAssistant({
  originalCode,
  fileName,
  onCodeGenerated,
}: CodeChatAssistantProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userId = session?.user?.email || 'default-user';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

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

    const updatedHistory: Message[] = [...history, { role: 'user' as const, content: userMessage }];
    setHistory(updatedHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/code-review/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history,
          originalCode,
          fileName,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשליחת ההודעה');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        code: data.fixedCode,
      };
      
      setHistory([...updatedHistory, assistantMessage]);
      
      // אם יש קוד מתוקן, העבר אותו למעלה
      if (data.fixedCode && onCodeGenerated) {
        onCodeGenerated(data.fixedCode);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'אירעה שגיאה. נסה שוב מאוחר יותר.');
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

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-medium">דו-שיח לתיקון קוד</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] bg-white rounded-xl shadow-2xl border-2 border-gray-200 flex flex-col overflow-hidden">
      {/* כותרת */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-semibold">דו-שיח לתיקון קוד</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* הודעות */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {history.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-8">
            <p className="mb-2">דברי איתי על הקוד</p>
            <p className="text-xs">אפשר לבקש תיקונים, שיפורים, או הסברים</p>
          </div>
        )}

        {history.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap break-words text-sm">{msg.content}</div>
              
              {msg.code && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-semibold mb-1">קוד מתוקן:</p>
                  <pre className="bg-gray-900 text-white text-xs p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                    <code>{msg.code}</code>
                  </pre>
                  <button
                    onClick={() => {
                      if (msg.code && onCodeGenerated) {
                        onCodeGenerated(msg.code);
                      }
                      handleCopy(msg.code || '', index);
                    }}
                    className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-3 h-3" />
                        הועתק והוחל!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        העתק והחל קוד
                      </>
                    )}
                  </button>
                </div>
              )}

              {msg.role === 'assistant' && !msg.code && (
                <button
                  onClick={() => handleCopy(msg.content, index)}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>חושב...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* קלט */}
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="כתבי מה צריך לתקן או לשפר..."
            rows={1}
            dir="rtl"
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
