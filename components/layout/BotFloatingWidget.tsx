'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import ClaudeAssistant from '@/components/claude-assistant/ClaudeAssistant';
import { PageColorTheme } from './DashboardPageWrapper';

interface BotFloatingWidgetProps {
  theme: PageColorTheme;
}

export default function BotFloatingWidget({ theme }: BotFloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // כפתור צף קטן למובייל
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r ${theme.buttonFrom} ${theme.buttonTo} px-4 py-3 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 lg:hidden`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-medium">liatAI</span>
      </button>
    );
  }

  return (
    <>
      {/* חלון מלא במסכים גדולים */}
      <div className={`fixed bottom-4 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] hidden lg:block`}>
        <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden max-h-[600px] flex flex-col">
          <div className={`bg-gradient-to-r ${theme.buttonFrom} ${theme.buttonTo} text-white px-4 py-2 font-semibold text-sm`}>
            liatAI
          </div>
          <div className="flex-1 overflow-hidden" style={{ maxHeight: '550px' }}>
            <ClaudeAssistant />
          </div>
        </div>
      </div>

      {/* חלון מלא במסכים קטנים */}
      <div className={`fixed inset-0 z-50 bg-black/50 lg:hidden`} onClick={() => setIsOpen(false)}>
        <div 
          className="absolute bottom-0 left-0 right-0 top-auto h-[80vh] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`bg-gradient-to-r ${theme.buttonFrom} ${theme.buttonTo} text-white px-4 py-3 flex items-center justify-between`}>
            <span className="font-semibold">liatAI</span>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ClaudeAssistant />
          </div>
        </div>
      </div>
    </>
  );
}
