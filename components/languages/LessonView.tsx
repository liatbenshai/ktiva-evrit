'use client';

import { useState, useCallback } from 'react';
import { ArrowRight, Volume2, BookOpen, ListChecks, Trophy } from 'lucide-react';
import ExerciseMatching from './ExerciseMatching';
import ExerciseFillBlank from './ExerciseFillBlank';
import ExerciseWordOrder from './ExerciseWordOrder';
import ExerciseListening from './ExerciseListening';

interface VocabularyItem {
  id: string;
  hebrewTerm: string;
  translatedTerm: string;
  pronunciation?: string;
  usageExample?: { target: string; hebrew: string };
  notes?: string;
  isSentence?: boolean;
}

interface Exercise {
  id: string;
  type: 'MATCHING' | 'FILL_BLANK' | 'WORD_ORDER' | 'LISTENING';
  title?: string;
  instructions: string;
  question: string;
  correctAnswer?: string;
  exerciseData?: string;
  options?: Array<{ id: string; text: string; isCorrect: boolean; explanation?: string }>;
}

interface LessonViewProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    duration: number;
    grammarNotes?: string;
    culturalTips?: string;
    vocabulary: VocabularyItem[];
    exercises: Exercise[];
  };
  onBack: () => void;
  onProgressUpdate: (score: number) => void;
  speakText: (text: string, lang: string) => void;
  targetLanguage: string;
}

export default function LessonView({
  lesson,
  onBack,
  onProgressUpdate,
  speakText,
  targetLanguage,
}: LessonViewProps) {
  const [currentSection, setCurrentSection] = useState<'vocabulary' | 'grammar' | 'exercises' | 'summary'>('vocabulary');
  const [exerciseResults, setExerciseResults] = useState<Record<string, boolean>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const handleExerciseAnswer = useCallback((exerciseId: string, isCorrect: boolean, points: number) => {
    setExerciseResults((prev) => ({ ...prev, [exerciseId]: isCorrect }));
    setTotalScore((prev) => prev + (isCorrect ? points : 0));
    setMaxScore((prev) => prev + points);
  }, []);

  const handleFinish = () => {
    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    onProgressUpdate(finalScore);
    setCurrentSection('summary');
  };

  const completedExercises = Object.keys(exerciseResults).length;
  const allExercisesCompleted = completedExercises === lesson.exercises.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          חזרה לשיעורים
        </button>
        <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600">
          <Trophy className="h-4 w-4" />
          {totalScore}/{maxScore} נקודות
        </div>
      </div>

      {/* Lesson Title */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{lesson.title}</h1>
        {lesson.description && <p className="text-slate-600">{lesson.description}</p>}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'vocabulary', label: 'אוצר מילים', icon: BookOpen },
          { id: 'grammar', label: 'דקדוק', icon: BookOpen },
          { id: 'exercises', label: 'תרגילים', icon: ListChecks },
          { id: 'summary', label: 'סיכום', icon: Trophy },
        ].map((tab) => {
          const isActive = currentSection === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentSection(tab.id as any)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Vocabulary Section */}
      {currentSection === 'vocabulary' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">אוצר מילים</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {lesson.vocabulary.map((vocab) => (
              <div 
                key={vocab.id} 
                className={`rounded-2xl border p-4 ${
                  vocab.isSentence 
                    ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                {vocab.isSentence && (
                  <div className="mb-2 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    משפט שלם
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-semibold text-slate-900 ${vocab.isSentence ? 'text-lg' : 'text-lg'}`} dir="rtl">{vocab.hebrewTerm}</p>
                  <button
                    type="button"
                    onClick={() => speakText(vocab.translatedTerm, targetLanguage)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                      vocab.isSentence 
                        ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                        : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                    }`}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <p className={`text-base ${vocab.isSentence ? 'text-emerald-700' : 'text-indigo-700'}`} dir="ltr">{vocab.translatedTerm}</p>
                {vocab.pronunciation && (
                  <p className="mt-1 text-xs text-slate-500">{vocab.pronunciation}</p>
                )}
                {vocab.usageExample && (
                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                    <p dir="ltr">{vocab.usageExample.target}</p>
                    <p className="mt-1 text-xs text-slate-500" dir="rtl">{vocab.usageExample.hebrew}</p>
                  </div>
                )}
                {vocab.notes && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    {vocab.notes.startsWith('תרגומים חלופיים:') ? (
                      <div>
                        <p className="text-xs font-semibold text-amber-800 mb-1">תרגומים חלופיים:</p>
                        <div className="flex flex-wrap gap-2">
                          {vocab.notes.replace('תרגומים חלופיים: ', '').split(', ').map((alt: string, idx: number) => (
                            <span key={idx} className="inline-block rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900" dir="ltr">
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">{vocab.notes}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar Section */}
      {currentSection === 'grammar' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">הסבר דקדוקי</h2>
          {lesson.grammarNotes ? (
            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-6">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lesson.grammarNotes }} />
            </div>
          ) : (
            <p className="text-slate-500">אין הסבר דקדוקי לשיעור זה.</p>
          )}
          {lesson.culturalTips && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
              <h3 className="mb-2 font-semibold text-indigo-800">טיפים תרבותיים</h3>
              <p className="text-sm text-indigo-700">{lesson.culturalTips}</p>
            </div>
          )}
        </div>
      )}

      {/* Exercises Section */}
      {currentSection === 'exercises' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">תרגילים</h2>
            <span className="text-sm text-slate-500">
              {completedExercises} מתוך {lesson.exercises.length} הושלמו
            </span>
          </div>
          {lesson.exercises.map((exercise, index) => {
            const exercisePoints = 10; // Default points, could come from exercise.points
            return (
              <div key={exercise.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                    {index + 1}
                  </span>
                  {exercise.title && <h3 className="font-semibold text-slate-900">{exercise.title}</h3>}
                </div>
                <p className="mb-3 text-sm text-slate-600">{exercise.instructions}</p>
                {exercise.type === 'MATCHING' && exercise.options && (
                  <ExerciseMatching
                    question={exercise.question}
                    hebrewTerm={exercise.question} // This might need adjustment
                    options={exercise.options}
                    onAnswer={(isCorrect) => handleExerciseAnswer(exercise.id, isCorrect, exercisePoints)}
                    speakText={speakText}
                    targetLanguage={targetLanguage}
                  />
                )}
                {exercise.type === 'FILL_BLANK' && exercise.correctAnswer && (
                  <ExerciseFillBlank
                    question={exercise.question}
                    sentence={exercise.question} // This might need adjustment
                    correctAnswer={exercise.correctAnswer}
                    onAnswer={(isCorrect) => handleExerciseAnswer(exercise.id, isCorrect, exercisePoints)}
                  />
                )}
                {exercise.type === 'WORD_ORDER' && exercise.exerciseData && (
                  <ExerciseWordOrder
                    question={exercise.question}
                    words={JSON.parse(exercise.exerciseData)}
                    correctOrder={exercise.correctAnswer ? JSON.parse(exercise.correctAnswer) : []}
                    onAnswer={(isCorrect) => handleExerciseAnswer(exercise.id, isCorrect, exercisePoints)}
                  />
                )}
                {exercise.type === 'LISTENING' && exercise.correctAnswer && (
                  <ExerciseListening
                    question={exercise.question}
                    audioText={exercise.question} // This might need adjustment
                    correctAnswer={exercise.correctAnswer}
                    onAnswer={(isCorrect) => handleExerciseAnswer(exercise.id, isCorrect, exercisePoints)}
                    speakText={speakText}
                    targetLanguage={targetLanguage}
                  />
                )}
              </div>
            );
          })}
          {allExercisesCompleted && (
            <button
              onClick={handleFinish}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Trophy className="mr-2 inline h-5 w-5" />
              סיימתי את השיעור!
            </button>
          )}
        </div>
      )}

      {/* Summary Section */}
      {currentSection === 'summary' && (
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
          <h2 className="mb-2 text-2xl font-bold text-emerald-900">כל הכבוד!</h2>
          <p className="mb-4 text-emerald-700">סיימת את השיעור בהצלחה</p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-2xl font-bold text-emerald-600 shadow-md">
            {maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%
          </div>
          <button
            onClick={onBack}
            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            חזרה לשיעורים
          </button>
        </div>
      )}
    </div>
  );
}

