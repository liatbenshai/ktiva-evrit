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
        if (!selectedLevel) {
          // Only show error on main page
          if (lessonsForCurrentLanguage.length === 0) {
            setError('אין שיעורים זמינים לשפה זו כרגע.');
          } else if (fetchedLessons.length === 0) {
            setError('אין שיעורים זמינים כרגע.');
          } else {
            setError(null); // Clear error if lessons exist
          }
        } else {
          // Clear error when level is selected (we're in topic selection)
          setError(null);
        }
      } else {
        // Only set error on main page
        if (!selectedLevel) {
          setError(data.error || 'שגיאה בטעינת השיעורים');
        }
      }
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      // Only set error on main page
      if (!selectedLevel) {
        setError('שגיאה בטעינת השיעורים. נסי לרענן את הדף.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [targetLanguage, selectedLevel]);

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
      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        {error && (
          <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4 text-xs sm:text-sm text-amber-800">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center py-6 sm:py-8">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-indigo-600" />
          </div>
        )}
        <div className="rounded-2xl sm:rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-5 lg:p-6">
          <h2 className="mb-1.5 sm:mb-2 text-lg sm:text-xl font-semibold text-indigo-800">בחרי רמת למידה</h2>
          <p className="text-xs sm:text-sm text-indigo-600">איזו רמה מתאימה לך?</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          {(Object.keys(LEVEL_CONFIG) as LanguageLevel[]).map((level) => {
            const config = LEVEL_CONFIG[level];
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`group rounded-2xl sm:rounded-3xl border-2 border-transparent bg-gradient-to-br ${config.gradient} p-4 sm:p-5 lg:p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <h3 className="mb-1.5 sm:mb-2 text-xl sm:text-2xl font-bold">{config.label}</h3>
                <p className="text-xs sm:text-sm opacity-90">
                  {level === 'BEGINNER' && 'מתחיל ללמוד את השפה'}
                  {level === 'INTERMEDIATE' && 'יודע את הבסיס, רוצה להתקדם'}
                  {level === 'ADVANCED' && 'שולט בשפה, רוצה לשפר'}
                </p>
              </button>
            );
          })}
        </div>

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
      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        {success && (
          <div className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4 text-xs sm:text-sm text-emerald-800">
            {success}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setSelectedLevel(null)}
            className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
          >
            ← חזרה לרמות
          </button>
          <span className="rounded-full bg-indigo-50 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-indigo-600">
            {LEVEL_CONFIG[selectedLevel].label}
          </span>
        </div>

        {progressStats && (
          <div className="rounded-xl sm:rounded-2xl border border-indigo-100 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-700">התקדמות כללית</span>
              <span className="text-base sm:text-lg font-bold text-indigo-600">{progressStats.completionRate}%</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: `${progressStats.completionRate}%` }}
              />
            </div>
            <div className="mt-2 sm:mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-600">
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
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 mb-4 sm:mb-5 lg:mb-6">
          <button
            onClick={() => setPracticeMode('flashcards')}
            className="group rounded-xl sm:rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-5 lg:p-6 text-right transition hover:border-indigo-300 hover:shadow-lg"
          >
            <div className="mb-2 sm:mb-3 inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-indigo-100 p-2 sm:p-3 text-indigo-600">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-slate-900">כרטיסיות למידה</h3>
            <p className="text-xs sm:text-sm text-slate-600">תרגלי מילים עם כרטיסיות אינטראקטיביות</p>
          </button>
          <button
            onClick={() => {/* TODO: Add quiz component */}}
            className="group rounded-xl sm:rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 lg:p-6 text-right transition hover:border-emerald-300 hover:shadow-lg"
          >
            <div className="mb-2 sm:mb-3 inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 p-2 sm:p-3 text-emerald-600">
              <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-1.5 sm:mb-2 text-base sm:text-lg font-semibold text-slate-900">חידון</h3>
            <p className="text-xs sm:text-sm text-slate-600">בחני את עצמך עם חידונים</p>
          </button>
        </div>

        <div>
          <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-slate-900">בחרי נושא</h2>
          {isLoading ? (
            <div className="flex justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-indigo-600" />
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-center">
              <p className="text-xs sm:text-sm text-slate-600">אין נושאים זמינים ברמה זו כרגע.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
                  className="group rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-1.5 sm:mb-2 text-3xl sm:text-4xl">{TOPIC_ICONS[topic] || '📚'}</div>
                  <h3 className="mb-1 sm:mb-2 text-sm sm:text-base font-semibold text-slate-900 break-words">{topic}</h3>
                  <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs text-slate-500">{topicLessons.length} שיעורים</p>
                  <div className="h-1 sm:h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      className="h-1 sm:h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] sm:text-xs text-slate-400">{progressPercent}% הושלם</p>
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
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setSelectedTopic(null)}
          className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
        >
          ← חזרה לנושאים
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="rounded-full bg-indigo-50 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-indigo-600">
            {LEVEL_CONFIG[selectedLevel].label}
          </span>
          <span className="rounded-full bg-slate-100 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-slate-600 break-words">
            {selectedTopic}
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-slate-900 break-words">שיעורים בנושא {selectedTopic}</h2>
        {isLoading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-indigo-600" />
          </div>
        ) : topicLessons.length === 0 ? (
          <p className="text-center text-xs sm:text-sm text-slate-500 py-8 sm:py-12">אין שיעורים זמינים בנושא זה כרגע.</p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
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

