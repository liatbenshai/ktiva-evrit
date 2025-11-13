'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, BookOpen, CheckCircle, PlayCircle, CreditCard, HelpCircle } from 'lucide-react';
import LessonCard from './LessonCard';
import LessonView from './LessonView';
import Flashcards from './Flashcards';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const LEVEL_CONFIG: Record<LanguageLevel, { label: string; color: string; gradient: string }> = {
  BEGINNER: {
    label: 'מתחיל',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-green-500',
  },
  INTERMEDIATE: {
    label: 'בינוני',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-amber-500',
  },
  ADVANCED: {
    label: 'מתקדם',
    color: 'text-rose-600',
    gradient: 'from-rose-500 to-red-500',
  },
};

const TOPIC_ICONS: Record<string, string> = {
  היכרות: '👋',
  אוכל: '🍽️',
  עבודה: '💼',
  נסיעות: '✈️',
  בית: '🏠',
  משפחה: '👨‍👩‍👧‍👦',
  מספרים: '🔢',
  צבעים: '🎨',
  קניות: '🛒',
  בריאות: '🏥',
  עסקים: '💼',
  תרבות: '🎭',
  בעלי_חיים: '🐾',
  זמן: '⏰',
  תחבורה: '🚗',
  ספורט: '⚽',
  טכנולוגיה: '💻',
  רגשות: '😊',
  ימים_בשבוע: '📅',
  חלקי_גוף: '👤',
  בגדים: '👕',
  מזג_אוויר: '🌤️',
  פעלים: '🏃',
  לימודים: '📚',
  מקצועות: '💼',
  בישול: '👨‍🍳',
  מדע: '🔬',
  טבע: '🌳',
};

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  topic: string;
  level: LanguageLevel;
  targetLanguage: SupportedLanguageKey;
  vocabulary: any[];
  exercises: any[];
  grammarNotes?: string;
  culturalTips?: string;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  needsReviewLessons: number;
  averageScore: number;
  completionRate: number;
}

interface StructuredLessonsProps {
  targetLanguage: SupportedLanguageKey;
  onLanguageChange: (lang: SupportedLanguageKey) => void;
  speakText: (text: string, lang: string) => void;
}

export default function StructuredLessons({
  targetLanguage,
  onLanguageChange,
  speakText,
}: StructuredLessonsProps) {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [practiceMode, setPracticeMode] = useState<'lessons' | 'flashcards' | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLessons = useCallback(async (level?: LanguageLevel) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        targetLanguage,
        includeProgress: 'true',
        userId: 'default-user',
      });
      if (level) {
        params.append('level', level);
      }

      const response = await fetch(`/api/languages/lessons?${params}`);
      const data = await response.json();

      if (data.success) {
        const fetchedLessons = data.lessons || [];
        setLessons(fetchedLessons);
        const uniqueTopics = Array.from(new Set(fetchedLessons.map((l: Lesson) => l.topic)));
        setTopics(uniqueTopics as string[]);
        
        // Check if we have lessons for the current target language
        const lessonsForCurrentLanguage = fetchedLessons.filter((l: Lesson) => l.targetLanguage === targetLanguage);
        if (lessonsForCurrentLanguage.length === 0) {
          setError('אין שיעורים זמינים לשפה זו כרגע. לחצי על הכפתור למטה כדי ליצור שיעורים.');
        } else if (fetchedLessons.length === 0) {
          setError('אין שיעורים זמינים כרגע. שיעורים יופיעו כאן ברגע שייווצרו.');
        }
      } else {
        setError(data.error || 'שגיאה בטעינת השיעורים');
      }
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      setError('שגיאה בטעינת השיעורים. נסי לרענן את הדף.');
    } finally {
      setIsLoading(false);
    }
  }, [targetLanguage]);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/languages/progress?targetLanguage=${targetLanguage}&userId=default-user`);
      const data = await response.json();
      if (data.success) {
        setProgressStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  }, [targetLanguage]);

  useEffect(() => {
    fetchLessons();
    fetchProgress();
  }, [fetchLessons, fetchProgress]);

  useEffect(() => {
    if (selectedLevel) {
      fetchLessons(selectedLevel);
    }
  }, [selectedLevel, fetchLessons]);

  const handleLessonClick = async (lessonId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/languages/lessons/${lessonId}?userId=default-user`);
      const data = await response.json();
      if (data.success) {
        setSelectedLesson(data.lesson);
      }
    } catch (error) {
      console.error('Error fetching lesson details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (score: number) => {
    if (!selectedLesson) return;

    const status = score >= 80 ? 'MASTERED' : score >= 60 ? 'COMPLETED' : 'IN_PROGRESS';
    const needsReview = score < 60;

    try {
      await fetch(`/api/languages/lessons/${selectedLesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          status,
          score,
          needsReview,
        }),
      });
      await fetchProgress();
      await fetchLessons(selectedLevel || undefined);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getLanguageCode = (lang: SupportedLanguageKey) => {
    const map: Record<SupportedLanguageKey, string> = {
      english: 'en-US',
      romanian: 'ro-RO',
      italian: 'it-IT',
      french: 'fr-FR',
      russian: 'ru-RU',
    };
    return map[lang];
  };

  const handleDeleteAll = async () => {
    if (!confirm('האם את בטוחה שברצונך למחוק את כל השיעורים? פעולה זו לא ניתנת לביטול.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch('/api/languages/lessons/delete-all', {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`נמחקו ${data.deletedCount} שיעורים בהצלחה`);
        setLessons([]); // Clear lessons immediately
        setTopics([]); // Clear topics
        await fetchLessons(selectedLevel || undefined);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'שגיאה במחיקת שיעורים');
      }
    } catch (error: any) {
      console.error('Error deleting lessons:', error);
      setError('שגיאה במחיקת שיעורים');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDemo = async (createAll = false, overwrite = false) => {
    setIsCreatingDemo(true);
    setError(null);
    try {
      const response = await fetch('/api/languages/lessons/create-multiple-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage,
          createAll,
          overwrite,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchLessons(selectedLevel || undefined);
        setError(null);
        if (data.created > 0 || data.updated > 0) {
          const messages = [];
          if (data.created > 0) messages.push(`נוצרו ${data.created} שיעורים`);
          if (data.updated > 0) messages.push(`עודכנו ${data.updated} שיעורים`);
          setSuccess(`${messages.join(' ו-')} בהצלחה!`);
          setTimeout(() => setSuccess(null), 5000);
        }
        if (data.errors && data.errors.length > 0) {
          setError(`${data.message}. שגיאות: ${data.errors.join(', ')}`);
        }
      } else {
        setError(data.error || 'שגיאה ביצירת שיעורים');
      }
    } catch (error: any) {
      console.error('Error creating demo lessons:', error);
      setError('שגיאה ביצירת שיעורים');
    } finally {
      setIsCreatingDemo(false);
    }
  };

  // If viewing flashcards
  if (practiceMode === 'flashcards') {
    return (
      <Flashcards
        targetLanguage={targetLanguage}
        onBack={() => setPracticeMode(null)}
        speakText={speakText}
      />
    );
  }

  // If viewing a lesson
  if (selectedLesson) {
    return (
      <LessonView
        lesson={selectedLesson}
        onBack={() => setSelectedLesson(null)}
        onProgressUpdate={handleProgressUpdate}
        speakText={speakText}
        targetLanguage={getLanguageCode(targetLanguage)}
      />
    );
  }

  // Level selection
  if (!selectedLevel) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
            {(error.includes('אין שיעורים') || error.includes('לחצי על הכפתור')) && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => handleCreateDemo(false)}
                  disabled={isCreatingDemo}
                  className="block w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingDemo ? 'יוצר שיעור דוגמה...' : 'צרי שיעור דוגמה אחד'}
                </button>
                <button
                  onClick={() => handleCreateDemo(true)}
                  disabled={isCreatingDemo}
                  className="block w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingDemo ? 'יוצר שיעורים...' : 'צרי כל השיעורים (כל הרמות והנושאים - לכל השפות)'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Always show create buttons if no lessons for current language */}
        {!error && lessons.filter((l: Lesson) => l.targetLanguage === targetLanguage).length === 0 && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
            <p className="mb-3">אין שיעורים זמינים לשפה {targetLanguage === 'english' ? 'אנגלית' : targetLanguage === 'romanian' ? 'רומנית' : targetLanguage === 'italian' ? 'איטלקית' : targetLanguage === 'french' ? 'צרפתית' : 'רוסית'} כרגע.</p>
            <div className="space-y-2">
              <button
                onClick={() => handleCreateDemo(false)}
                disabled={isCreatingDemo}
                className="block w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingDemo ? 'יוצר שיעור דוגמה...' : 'צרי שיעור דוגמה אחד'}
              </button>
              <button
                onClick={() => handleCreateDemo(true)}
                disabled={isCreatingDemo}
                className="block w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingDemo ? 'יוצר שיעורים...' : 'צרי כל השיעורים (כל הרמות והנושאים - לכל השפות)'}
              </button>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-indigo-800">בחרי רמת למידה</h2>
          <p className="text-sm text-indigo-600">איזו רמה מתאימה לך?</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(Object.keys(LEVEL_CONFIG) as LanguageLevel[]).map((level) => {
            const config = LEVEL_CONFIG[level];
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`group rounded-3xl border-2 border-transparent bg-gradient-to-br ${config.gradient} p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <h3 className="mb-2 text-2xl font-bold">{config.label}</h3>
                <p className="text-sm opacity-90">
                  {level === 'BEGINNER' && 'מתחיל ללמוד את השפה'}
                  {level === 'INTERMEDIATE' && 'יודע את הבסיס, רוצה להתקדם'}
                  {level === 'ADVANCED' && 'שולט בשפה, רוצה לשפר'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Update or Delete existing lessons - moved to bottom */}
        {lessons.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="mb-3 text-slate-700">ניהול שיעורים:</p>
            <div className="space-y-2">
              <button
                onClick={() => handleCreateDemo(true, true)}
                disabled={isCreatingDemo}
                className="block w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingDemo ? 'מעדכן שיעורים...' : 'עדכני את כל השיעורים הקיימים'}
              </button>
              <p className="text-xs text-slate-600 mt-1">פעולה זו תעדכן את השיעורים הקיימים עם התרגומים החדשים (כולל רוסית) מבלי למחוק אותם</p>
              
              <div className="border-t border-slate-300 pt-3 mt-3">
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="block w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? 'מוחק שיעורים...' : 'מחקי את כל השיעורים הקיימים'}
                </button>
                <p className="text-xs text-red-600 mt-1">לאחר המחיקה, לחצי על "צרי כל השיעורים" כדי ליצור שיעורים חדשים</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Topic selection
  if (!selectedTopic) {
    const lessonsByTopic = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.topic]) {
        acc[lesson.topic] = [];
      }
      acc[lesson.topic].push(lesson);
      return acc;
    }, {} as Record<string, Lesson[]>);

    return (
      <div className="space-y-6">
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedLevel(null)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← חזרה לרמות
          </button>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600">
            {LEVEL_CONFIG[selectedLevel].label}
          </span>
        </div>

        {progressStats && (
          <div className="rounded-2xl border border-indigo-100 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">התקדמות כללית</span>
              <span className="text-lg font-bold text-indigo-600">{progressStats.completionRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: `${progressStats.completionRate}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div>
                <span className="font-semibold">{progressStats.completedLessons}</span> הושלמו
              </div>
              <div>
                <span className="font-semibold">{progressStats.inProgressLessons}</span> בתהליך
              </div>
              <div>
                <span className="font-semibold">{progressStats.averageScore}%</span> ממוצע
              </div>
            </div>
          </div>
        )}

        {/* Practice Options */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
          <button
            onClick={() => setPracticeMode('flashcards')}
            className="group rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 text-left transition hover:border-indigo-300 hover:shadow-lg"
          >
            <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">כרטיסיות למידה</h3>
            <p className="text-sm text-slate-600">תרגלי מילים עם כרטיסיות אינטראקטיביות</p>
          </button>
          <button
            onClick={() => {/* TODO: Add quiz component */}}
            className="group rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-left transition hover:border-emerald-300 hover:shadow-lg"
          >
            <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">חידון</h3>
            <p className="text-sm text-slate-600">בחני את עצמך עם חידונים</p>
          </button>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">בחרי נושא</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="mb-4 text-slate-600">אין נושאים זמינים ברמה זו כרגע.</p>
              <div className="space-y-2">
                <button
                  onClick={() => handleCreateDemo(false)}
                  disabled={isCreatingDemo}
                  className="block w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingDemo ? 'יוצר שיעור דוגמה...' : 'צרי שיעור דוגמה אחד'}
                </button>
                <button
                  onClick={() => handleCreateDemo(true)}
                  disabled={isCreatingDemo}
                  className="block w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingDemo ? 'יוצר שיעורים...' : 'צרי כל השיעורים לרמה זו'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {topics.map((topic) => {
              const topicLessons = lessonsByTopic[topic] || [];
              const completedCount = topicLessons.filter((l) => {
                // This would need to check user progress
                return false; // Placeholder
              }).length;
              const progressPercent = topicLessons.length > 0 ? Math.round((completedCount / topicLessons.length) * 100) : 0;

              return (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-2 text-4xl">{TOPIC_ICONS[topic] || '📚'}</div>
                  <h3 className="mb-2 font-semibold text-slate-900">{topic}</h3>
                  <p className="mb-2 text-xs text-slate-500">{topicLessons.length} שיעורים</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{progressPercent}% הושלם</p>
                </button>
              );
            })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lesson list for selected topic
  const topicLessons = lessons.filter((l) => l.topic === selectedTopic && l.level === selectedLevel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedTopic(null)}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← חזרה לנושאים
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600">
            {LEVEL_CONFIG[selectedLevel].label}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {selectedTopic}
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">שיעורים בנושא {selectedTopic}</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : topicLessons.length === 0 ? (
          <p className="text-center text-slate-500 py-12">אין שיעורים זמינים בנושא זה כרגע.</p>
        ) : (
          <div className="space-y-3">
            {topicLessons.map((lesson) => {
              // Get user progress for this lesson
              const progress = (lesson as any).userProgress?.[0];
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson.id)}
                  className="cursor-pointer"
                >
                  <LessonCard
                    id={lesson.id}
                    title={lesson.title}
                    description={lesson.description}
                    duration={lesson.duration}
                    topic={lesson.topic}
                    status={progress?.status || 'NOT_STARTED'}
                    score={progress?.score || null}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

