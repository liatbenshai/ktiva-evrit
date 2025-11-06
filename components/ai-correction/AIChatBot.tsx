'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Loader2, Bot, X } from 'lucide-react';

interface AIChatBotProps {
  text?: string;
  context?: string;
  userId?: string;
}

export default function AIChatBot({ text, context, userId = 'default-user' }: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; patterns?: Array<{ from: string; to: string }> }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!question.trim() || isLoading) return;

    const userQuestion = question;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-correction/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,
          text,
          context,
          userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to get answer');

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        patterns: data.relevantPatterns,
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'אירעה שגיאה. נסי שוב מאוחר יותר.' 
      }]);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-[9999]"
        title="פתח בוט AI לעזרה"
        aria-label="פתח בוט AI לעזרה"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">בוט AI לעזרה</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>שלום! אני כאן לעזור לך.</p>
            <p className="mt-2">את יכולה לשאול אותי:</p>
            <ul className="mt-2 text-right list-disc list-inside space-y-1">
              <li>מה צריך לתקן בטקסט?</li>
              <li>איך להשתמש בדפוסים שנלמדו?</li>
              <li>מה הבעיה עם ביטוי מסוים?</li>
              <li>איך לשפר את הכתיבה?</li>
            </ul>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              
              {msg.patterns && msg.patterns.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold mb-1">דפוסים רלוונטיים:</p>
                  {msg.patterns.map((pattern, pIdx) => (
                    <div key={pIdx} className="text-xs bg-gray-100 rounded px-2 py-1 mb-1">
                      <span className="line-through text-red-600">"{pattern.from}"</span>
                      {' → '}
                      <span className="text-green-600">"{pattern.to}"</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="שאלי אותי כל שאלה..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            rows={2}
            dir="rtl"
          />
          <Button
            onClick={handleSend}
            disabled={!question.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 שאלי על תיקונים, דפוסים, או כל דבר אחר
        </p>
      </div>
    </div>
  );
}

