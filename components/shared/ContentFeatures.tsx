'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Download, ChevronDown, Loader2, Search, Globe } from 'lucide-react';
import { exportToTXT, exportToWord, exportToPDF } from '@/lib/export-utils';

interface ContentFeaturesProps {
  content: string;
  contentType: string;
  onFollowUp?: (question: string) => Promise<string>;
  enableWebSearch?: boolean;
  enableURLs?: boolean;
}

export default function ContentFeatures({
  content,
  contentType,
  onFollowUp,
  enableWebSearch = true,
  enableURLs = true,
}: ContentFeaturesProps) {
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim()) {
      alert('אנא הכנס שאלת המשך');
      return;
    }

    if (!content) {
      alert('יש ליצור תוכן ראשוני לפני שאילת שאלות המשך');
      return;
    }

    if (!onFollowUp) {
      // Fallback to API call
      setIsAskingFollowUp(true);
      try {
        const response = await fetch('/api/claude-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `${followUpQuestion.trim()}\n\nתבסס על התוכן הבא:\n${content}`,
            history: [],
            userId: 'default-user',
            needsWebSearch: enableWebSearch,
          }),
        });

        if (!response.ok) throw new Error('Failed');
        const { message: answer } = await response.json();
        
        setFollowUpHistory((prev) => [
          ...prev,
          { question: followUpQuestion.trim(), answer },
        ]);
        setFollowUpQuestion('');
      } catch (error) {
        alert('אירעה שגיאה בשאלת המשך');
      } finally {
        setIsAskingFollowUp(false);
      }
      return;
    }

    setIsAskingFollowUp(true);
    try {
      const answer = await onFollowUp(followUpQuestion.trim());
      setFollowUpHistory((prev) => [
        ...prev,
        { question: followUpQuestion.trim(), answer },
      ]);
      setFollowUpQuestion('');
    } catch (error) {
      alert('אירעה שגיאה בשאלת המשך');
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    if (!content) {
      alert('אין תוכן לייצוא');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${contentType}-${timestamp}`;
      
      if (format === 'txt') {
        exportToTXT(content, filename);
      } else if (format === 'docx') {
        await exportToWord(content, filename);
      } else if (format === 'pdf') {
        await exportToPDF(content, filename);
      }
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting:', error);
      alert(`שגיאה בייצוא: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!content) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Export Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">פעולות</h3>
          <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              <span>ייצוא</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showExportMenu && (
              <div className="absolute left-0 sm:left-auto right-0 sm:right-0 mt-2 w-full sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full text-right px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-100 transition-colors rounded-t-lg text-sm sm:text-base"
                >
                  ייצוא ל-TXT
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full text-right px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  ייצוא ל-Word
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-right px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-100 transition-colors rounded-b-lg text-sm sm:text-base"
                >
                  ייצוא ל-PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Questions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          שאלות המשך
        </h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <input
              type="text"
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFollowUp();
                }
              }}
              placeholder="שאלי שאלה נוספת על התוכן..."
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isAskingFollowUp}
            />
            <button
              onClick={handleFollowUp}
              disabled={isAskingFollowUp || !followUpQuestion.trim()}
              className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              {isAskingFollowUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">שואל...</span>
                  <span className="sm:hidden">שואל</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  שאל
                </>
              )}
            </button>
          </div>
          {followUpHistory.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">היסטוריית שאלות:</p>
              <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                {followUpHistory.map((item, index) => (
                  <div key={index} className="text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <p className="font-medium text-gray-700 mb-1">שאלה: {item.question}</p>
                    <p className="text-gray-600 text-xs">{item.answer.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Web Search Info */}
      {(enableWebSearch || enableURLs) && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0">
              {enableWebSearch && <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
              {enableURLs && <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">גישה למקורות מידע</h4>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                {enableWebSearch && (
                  <p>• חיפוש ברשת - המערכת יכולה לחפש מידע עדכני מ-Google ומקורות נוספים</p>
                )}
                {enableURLs && (
                  <p>• עיבוד URLs - ניתן להדביק כתובת אינטרנט ולשאול שאלות על התוכן</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

