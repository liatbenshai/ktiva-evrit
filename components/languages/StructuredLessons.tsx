'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, BookOpen, CheckCircle, PlayCircle } from 'lucide-react';
import LessonCard from './LessonCard';
import LessonView from './LessonView';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian';
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

  const [error, setError] = useState<string | null>(null);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

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
        setLessons(data.lessons || []);
        const uniqueTopics = Array.from(new Set((data.lessons || []).map((l: Lesson) => l.topic)));
        setTopics(uniqueTopics as string[]);
        if ((data.lessons || []).length === 0) {
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
    };
    return map[lang];
  };

  const handleCreateDemo = async () => {
    setIsCreatingDemo(true);
    setError(null);
    try {
      const response = await fetch('/api/languages/lessons/create-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage,
          level: selectedLevel || 'BEGINNER',
          topic: 'היכרות',
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchLessons(selectedLevel || undefined);
        setError(null);
      } else {
        setError(data.error || 'שגיאה ביצירת שיעור דוגמה');
      }
    } catch (error: any) {
      console.error('Error creating demo lesson:', error);
      setError('שגיאה ביצירת שיעור דוגמה');
    } finally {
      setIsCreatingDemo(false);
    }
  };

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
            {error.includes('אין שיעורים') && (
              <button
                onClick={handleCreateDemo}
                disabled={isCreatingDemo}
                className="mt-3 block w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingDemo ? 'יוצר שיעור דוגמה...' : 'צרי שיעור דוגמה'}
              </button>
            )}
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

        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">בחרי נושא</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="mb-4 text-slate-600">אין נושאים זמינים ברמה זו כרגע.</p>
              <button
                onClick={handleCreateDemo}
                disabled={isCreatingDemo}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingDemo ? 'יוצר שיעור דוגמה...' : 'צרי שיעור דוגמה'}
              </button>
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

