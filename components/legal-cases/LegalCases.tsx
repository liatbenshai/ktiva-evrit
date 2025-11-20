'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { Scale, Loader2, ExternalLink, BookOpen, FileText, MessageSquare, Send, History, Trash2, Gavel } from 'lucide-react';

interface LegalCaseSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  court?: string;
  date?: string;
}

interface LegalCaseData {
  topic: string;
  summary: string;
  cases: LegalCaseSource[];
  detailedAnalysis?: string;
  timestamp: string;
  sessionId?: string;
  warning?: string;
}

interface LegalCaseHistoryItem {
  topic: string;
  summary: string;
  timestamp: string;
}

interface LegalCaseSession {
  id: string;
  topic: string;
  createdAt: string;
  cases: Array<{
    topic: string;
    summary: string;
    detailedAnalysis?: string;
    order: number;
  }>;
}

export default function LegalCases() {
  const [topic, setTopic] = useState('');
  const [followUpTopic, setFollowUpTopic] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [caseData, setCaseData] = useState<LegalCaseData | null>(null);
  const [caseHistory, setCaseHistory] = useState<LegalCaseHistoryItem[]>([]);
  const [previousSessions, setPreviousSessions] = useState<LegalCaseSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxResults, setMaxResults] = useState(15);

  // Popular legal topics
  const popularTopics = [
    'תמלול',
    'צוואות',
    'גירושין',
    'נזיקין',
    'עבודה',
    'מקרקעין',
    'חוזים',
    'משפחה',
    'פלילי',
    'מיסים',
  ];

  // Load previous sessions
  useEffect(() => {
    loadPreviousSessions();
  }, []);

  const loadPreviousSessions = async () => {
    try {
      const response = await fetch('/api/legal-cases/sessions');
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

  const handleSearch = async () => {
    if (!topic.trim()) {
      alert('אנא הכנס נושא משפטי');
      return;
    }

    setIsSearching(true);
    setError(null);
    setCaseData(null);

    try {
      const response = await fetch('/api/legal-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          maxResults,
          language: 'hebrew',
          isNewSession: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בחיפוש פסקי דין');
      }

      if (!data.success) {
        throw new Error(data.error || 'החיפוש נכשל');
      }

      setCaseData({
        ...data.data,
        warning: data.warning || data.data.warning,
      });
      if (data.data.sessionId) {
        setCurrentSessionId(data.data.sessionId);
      }
      if (data.warning || data.data.warning) {
        // Show warning but don't block the response
        console.warn('Warning:', data.warning || data.data.warning);
      }
      setCaseHistory([{
        topic: topic.trim(),
        summary: data.data.summary,
        timestamp: data.data.timestamp,
      }]);
      setTopic('');
      loadPreviousSessions();
    } catch (error: any) {
      console.error('Legal case search error:', error);
      setError(error.message || 'אירעה שגיאה בחיפוש פסקי דין');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpTopic.trim()) {
      alert('אנא הכנס נושא משפטי נוסף');
      return;
    }

    if (!caseData) {
      alert('יש לבצע חיפוש ראשוני לפני חיפוש נושא נוסף');
      return;
    }

    setIsAskingFollowUp(true);
    setError(null);

    try {
      const response = await fetch('/api/legal-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: followUpTopic.trim(),
          maxResults,
          language: 'hebrew',
          sessionId: currentSessionId,
          context: caseData.summary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בחיפוש נוסף');
      }

      if (!data.success) {
        throw new Error(data.error || 'החיפוש הנוסף נכשל');
      }

      const updatedHistory = [
        ...caseHistory,
        {
          topic: followUpTopic.trim(),
          summary: data.data.summary,
          timestamp: data.data.timestamp,
        },
      ];
      setCaseHistory(updatedHistory);
      
      if (data.data.sessionId) {
        setCurrentSessionId(data.data.sessionId);
      }
      
      // Merge new cases with existing ones (don't replace, add to history)
      setCaseData({
        ...data.data,
        topic: `${caseData.topic} → ${followUpTopic.trim()}`,
        warning: data.warning || data.data.warning,
      });
      
      setFollowUpTopic('');
      loadPreviousSessions();
    } catch (error: any) {
      console.error('Follow-up error:', error);
      setError(error.message || 'אירעה שגיאה בחיפוש נוסף');
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSearch();
    }
  };

  const loadSession = async (session: LegalCaseSession) => {
    if (session.cases.length === 0) return;
    
    const firstCase = session.cases[0];
    const history = session.cases.map((c, idx) => ({
      topic: c.topic,
      summary: c.summary,
      timestamp: session.createdAt,
    }));

    setCaseHistory(history);
    setCurrentSessionId(session.id);
    setCaseData({
      topic: session.topic,
      summary: firstCase.summary,
      cases: [],
      detailedAnalysis: firstCase.detailedAnalysis || '',
      timestamp: session.createdAt,
      sessionId: session.id,
    });
    setShowHistory(false);
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק חיפוש זה?')) return;
    
    try {
      const response = await fetch(`/api/legal-cases/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadPreviousSessions();
        if (currentSessionId === sessionId) {
          setCaseData(null);
          setCaseHistory([]);
          setCurrentSessionId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('שגיאה במחיקת החיפוש');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Scale className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-semibold text-gray-900">חיפוש פסקי דין</h2>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <History className="w-5 h-5" />
          <span>חיפושים קודמים</span>
        </button>
      </div>

      {/* Previous Sessions List */}
      {showHistory && previousSessions.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">חיפושים קודמים</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {previousSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{session.topic}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString('he-IL')} • {session.cases.length} חיפושים
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadSession(session)}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
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

      {!caseData ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נושא משפטי <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="לדוגמה: תמלול, צוואות, גירושין"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              dir="rtl"
            />
            <p className="mt-2 text-sm text-gray-500">
              לחץ Ctrl+Enter לחיפוש מהיר
            </p>
          </div>

          {/* Popular Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נושאים פופולריים
            </label>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((popularTopic) => (
                <button
                  key={popularTopic}
                  onClick={() => setTopic(popularTopic)}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                >
                  {popularTopic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מספר תוצאות מקסימלי
            </label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(Math.max(5, Math.min(30, parseInt(e.target.value) || 15)))}
              min="5"
              max="30"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={isSearching || !topic.trim()}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>מחפש פסקי דין...</span>
              </>
            ) : (
              <>
                <Gavel className="w-5 h-5" />
                <span>חפש פסקי דין</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Topic */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">נושא החיפוש:</h3>
            <p className="text-purple-800">{caseData.topic}</p>
          </div>

          {/* Warning if insufficient sources */}
          {caseData.warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">אזהרה</h4>
                  <p className="text-yellow-800 text-sm">{caseData.warning}</p>
                </div>
              </div>
            </div>
          )}

          {/* Source count info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>מספר מקורות שנמצאו:</strong> {caseData.cases.length} פסקי דין
              {caseData.cases.length < 3 && (
                <span className="block mt-1 text-yellow-700">
                  ⚠️ מספר מקורות נמוך - הניתוח מבוסס על המקורות הקיימים בלבד
                </span>
              )}
            </p>
          </div>

          {/* Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">סיכום פסקי הדין</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div
                className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                dir="rtl"
              >
                {caseData.summary.split('\n').map((line, i, arr) => (
                  <React.Fragment key={`summary-${i}`}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          {caseData.detailedAnalysis && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">ניתוח משפטי מפורט</h3>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div
                  className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                  dir="rtl"
                >
                  {caseData.detailedAnalysis.split('\n').map((line, i, arr) => (
                    <React.Fragment key={`detailed-${i}`}>
                      {line}
                      {i < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legal Cases */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                פסקי דין שנמצאו ({caseData.cases.length})
              </h3>
              <button
                onClick={() => {
                  const allUrls = caseData.cases.map((c, i) => `${i + 1}. ${c.title}\n${c.url}`).join('\n\n');
                  navigator.clipboard.writeText(allUrls);
                  alert('כל הקישורים הועתקו ללוח');
                }}
                className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>העתק כל הקישורים</span>
              </button>
            </div>
            <div className="space-y-4">
              {caseData.cases.map((legalCase, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors bg-white"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <h4 className="font-medium text-gray-900">{legalCase.title}</h4>
                      </div>
                      {(legalCase.court || legalCase.date) && (
                        <div className="flex gap-3 text-sm text-gray-600 mb-2 mt-1">
                          {legalCase.court && <span className="flex items-center gap-1">🏛️ {legalCase.court}</span>}
                          {legalCase.date && <span className="flex items-center gap-1">📅 {legalCase.date}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={legalCase.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-sm px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>פתח</span>
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(legalCase.url);
                          alert('קישור הועתק ללוח');
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                        title="העתק קישור"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 pr-8">{legalCase.snippet}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={legalCase.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-800 truncate max-w-md"
                    >
                      {legalCase.url}
                    </a>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      רלוונטיות: {Math.round(legalCase.relevance * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Topic Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">חיפוש נושא נוסף</h3>
                <p className="text-sm text-gray-600 mt-1">
                  חפשי נושא משפטי נוסף - החיפוש ייקח בחשבון את החיפוש הקודם
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={followUpTopic}
                onChange={(e) => setFollowUpTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleFollowUp();
                  }
                }}
                placeholder="לדוגמה: תמלול, צוואות, גירושין..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                dir="rtl"
              />
              <p className="text-sm text-gray-500">
                💡 טיפ: לחצי Ctrl+Enter לחיפוש מהיר
              </p>
              <button
                onClick={handleFollowUp}
                disabled={isAskingFollowUp || !followUpTopic.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAskingFollowUp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>מחפש...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>חפש נושא נוסף</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Case History */}
          {caseHistory.length > 1 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית החיפושים</h3>
              <div className="space-y-3">
                {caseHistory.map((item, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{item.topic}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.summary}</p>
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
                setCaseData(null);
                setTopic('');
                setFollowUpTopic('');
                setCaseHistory([]);
                setCurrentSessionId(null);
                setError(null);
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              חיפוש חדש
            </button>
            <button
              onClick={() => {
                const content = `נושא: ${caseData.topic}\n\nסיכום:\n${caseData.summary}\n\nניתוח מפורט:\n${caseData.detailedAnalysis}\n\nפסקי דין:\n${caseData.cases.map((c, i) => `${i + 1}. ${c.title} - ${c.url}`).join('\n')}`;
                navigator.clipboard.writeText(content);
                alert('התוכן הועתק ללוח');
              }}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700"
            >
              העתק תוכן
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

