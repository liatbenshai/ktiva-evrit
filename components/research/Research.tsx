'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { Search, Loader2, ExternalLink, BookOpen, FileText, MessageSquare, Send, History, Trash2 } from 'lucide-react';

interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

interface ResearchData {
  question: string;
  summary: string;
  sources: ResearchSource[];
  detailedInfo: string;
  timestamp: string;
  sessionId?: string;
}

interface ResearchHistoryItem {
  question: string;
  answer: string;
  timestamp: string;
}

interface ResearchSession {
  id: string;
  initialQuestion: string;
  createdAt: string;
  questions: Array<{
    question: string;
    answer: string;
    detailedInfo?: string;
    order: number;
  }>;
}

export default function Research() {
  const [question, setQuestion] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [researchHistory, setResearchHistory] = useState<ResearchHistoryItem[]>([]);
  const [previousSessions, setPreviousSessions] = useState<ResearchSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxSources, setMaxSources] = useState(10);

  // Load previous research sessions
  useEffect(() => {
    loadPreviousSessions();
  }, []);

  const loadPreviousSessions = async () => {
    try {
      const response = await fetch('/api/research/sessions');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreviousSessions(data.sessions || []);
        }
      }
    } catch (error) {
      console.error('Error loading previous sessions:', error);
    }
  };

  const handleResearch = async () => {
    if (!question.trim()) {
      alert('אנא הכנס שאלת מחקר');
      return;
    }

    setIsResearching(true);
    setError(null);
    setResearchData(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          maxSources,
          language: 'hebrew',
          isNewSession: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בביצוע המחקר');
      }

      if (!data.success) {
        throw new Error(data.error || 'המחקר נכשל');
      }

      setResearchData(data.data);
      // Save session ID if provided
      if (data.data.sessionId) {
        setCurrentSessionId(data.data.sessionId);
      }
      // Add to history
      setResearchHistory([{
        question: question.trim(),
        answer: data.data.summary,
        timestamp: data.data.timestamp,
      }]);
      setQuestion(''); // Clear the question field
      // Reload sessions to show the new one
      loadPreviousSessions();
    } catch (error: any) {
      console.error('Research error:', error);
      setError(error.message || 'אירעה שגיאה בביצוע המחקר');
    } finally {
      setIsResearching(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim()) {
      alert('אנא הכנס שאלת המשך');
      return;
    }

    if (!researchData) {
      alert('יש לבצע מחקר ראשוני לפני שאילת שאלות המשך');
      return;
    }

    setIsAskingFollowUp(true);
    setError(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: followUpQuestion.trim(),
          maxSources,
          language: 'hebrew',
          history: researchHistory.map(item => ({
            question: item.question,
            answer: item.answer,
          })),
          context: researchData.summary,
          sessionId: currentSessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשאלת המשך');
      }

      if (!data.success) {
        throw new Error(data.error || 'שאלת המשך נכשלה');
      }

      // Update research data with follow-up answer
      const updatedHistory = [
        ...researchHistory,
        {
          question: followUpQuestion.trim(),
          answer: data.data.summary,
          timestamp: data.data.timestamp,
        },
      ];
      setResearchHistory(updatedHistory);
      
      // Save session ID if provided
      if (data.data.sessionId) {
        setCurrentSessionId(data.data.sessionId);
      }
      
      // Update the main research data to show the latest answer
      setResearchData({
        ...data.data,
        question: `${researchData.question} → ${followUpQuestion.trim()}`,
      });
      
      setFollowUpQuestion('');
      // Reload sessions
      loadPreviousSessions();
    } catch (error: any) {
      console.error('Follow-up error:', error);
      setError(error.message || 'אירעה שגיאה בשאלת המשך');
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleResearch();
    }
  };

  const loadSession = async (session: ResearchSession) => {
    if (session.questions.length === 0) return;
    
    const firstQuestion = session.questions[0];
    const history = session.questions.map((q, idx) => ({
      question: q.question,
      answer: q.answer,
      timestamp: session.createdAt,
    }));

    setResearchHistory(history);
    setCurrentSessionId(session.id);
    setResearchData({
      question: session.initialQuestion,
      summary: firstQuestion.answer,
      sources: [],
      detailedInfo: firstQuestion.detailedInfo || '',
      timestamp: session.createdAt,
      sessionId: session.id,
    });
    setShowHistory(false);
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק מחקר זה?')) return;
    
    try {
      const response = await fetch(`/api/research/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadPreviousSessions();
        if (currentSessionId === sessionId) {
          setResearchData(null);
          setResearchHistory([]);
          setCurrentSessionId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('שגיאה במחיקת המחקר');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900">מחקר מעמיק ברשת</h2>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <History className="w-5 h-5" />
          <span>מחקרים קודמים</span>
        </button>
      </div>

      {/* Previous Sessions List */}
      {showHistory && previousSessions.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">מחקרים קודמים</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {previousSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{session.initialQuestion}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString('he-IL')} • {session.questions.length} שאלות
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadSession(session)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    פתח
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!researchData ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שאלת המחקר <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="לדוגמה: מה ההשפעות של בינה מלאכותית על שוק העבודה?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-y"
              dir="rtl"
            />
            <p className="mt-2 text-sm text-gray-500">
              לחץ Ctrl+Enter לביצוע מחקר מהיר
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מספר מקורות מקסימלי
            </label>
            <input
              type="number"
              value={maxSources}
              onChange={(e) => setMaxSources(Math.max(1, Math.min(20, parseInt(e.target.value) || 10)))}
              min="1"
              max="20"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleResearch}
            disabled={isResearching || !question.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isResearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>מבצע מחקר...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>בצע מחקר</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">שאלת המחקר:</h3>
            <p className="text-blue-800">{researchData.question}</p>
          </div>

          {/* Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">סיכום המחקר</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div
                className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                dir="rtl"
              >
                {researchData.summary.split('\n').map((line, i, arr) => (
                  <React.Fragment key={`summary-${i}`}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          {researchData.detailedInfo && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">מידע מפורט</h3>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div
                  className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                  dir="rtl"
                >
                  {researchData.detailedInfo.split('\n').map((line, i, arr) => (
                    <React.Fragment key={`detailed-${i}`}>
                      {line}
                      {i < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sources */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              מקורות מידע ({researchData.sources.length})
            </h3>
            <div className="space-y-4">
              {researchData.sources.map((source, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">{source.title}</h4>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>פתח</span>
                    </a>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{source.snippet}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{source.url}</span>
                    <span className="text-xs text-gray-400">
                      רלוונטיות: {Math.round(source.relevance * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Question Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">שאלת המשך</h3>
            </div>
            <div className="space-y-3">
              <textarea
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleFollowUp();
                  }
                }}
                placeholder="שאל שאלה נוספת שמתבססת על המחקר הקודם..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-y"
                dir="rtl"
              />
              <p className="text-sm text-gray-500">
                לחץ Ctrl+Enter לשאילת שאלה מהירה
              </p>
              <button
                onClick={handleFollowUp}
                disabled={isAskingFollowUp || !followUpQuestion.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAskingFollowUp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>מעבד שאלה...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>שאל שאלת המשך</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Research History */}
          {researchHistory.length > 1 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית השאלות</h3>
              <div className="space-y-3">
                {researchHistory.map((item, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{item.question}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setResearchData(null);
                setQuestion('');
                setFollowUpQuestion('');
                setResearchHistory([]);
                setCurrentSessionId(null);
                setError(null);
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              מחקר חדש
            </button>
            <button
              onClick={() => {
                const content = `שאלת מחקר: ${researchData.question}\n\nסיכום:\n${researchData.summary}\n\nמידע מפורט:\n${researchData.detailedInfo}\n\nמקורות:\n${researchData.sources.map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n')}`;
                navigator.clipboard.writeText(content);
                alert('התוכן הועתק ללוח');
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              העתק תוכן
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

