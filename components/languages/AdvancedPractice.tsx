'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, BookOpen, PenTool, FileText, MessageSquare } from 'lucide-react';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';

interface AdvancedQuestion {
  id: string;
  type: 'translation' | 'open_translation' | 'fill_blank' | 'sentence_building' | 'comprehension';
  question: string;
  hebrewTerm?: string;
  correctAnswer: string;
  options?: string[];
  context?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation?: string;
}

interface QuizState {
  questions: AdvancedQuestion[];
  currentIndex: number;
  answers: Array<{ questionId: string; userAnswer: string }>;
  finished: boolean;
  results?: any;
}

interface AdvancedPracticeProps {
  targetLanguage: SupportedLanguageKey;
  userId?: string;
}

export default function AdvancedPractice({ targetLanguage, userId = 'default-user' }: AdvancedPracticeProps) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  const startQuiz = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/languages/practice/advanced-quiz?targetLanguage=${targetLanguage}&difficulty=${difficulty}&count=10&userId=${userId}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'שגיאה ביצירת תרגול');
      }

      setQuizState({
        questions: data.questions,
        currentIndex: 0,
        answers: [],
        finished: false,
      });
      setCurrentAnswer('');
      setSelectedOption(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת תרגול');
    } finally {
      setIsLoading(false);
    }
  }, [targetLanguage, difficulty, userId]);

  const submitAnswer = useCallback(async () => {
    if (!quizState) return;

    const question = quizState.questions[quizState.currentIndex];
    const answer = question.type === 'translation' || question.type === 'fill_blank'
      ? selectedOption || ''
      : currentAnswer.trim();

    if (!answer) {
      setError('נא להזין תשובה');
      return;
    }

    const newAnswers = [
      ...quizState.answers,
      { questionId: question.id, userAnswer: answer },
    ];

    const isLastQuestion = quizState.currentIndex >= quizState.questions.length - 1;

    if (isLastQuestion) {
      // Submit all answers
      setIsLoading(true);
      try {
        const response = await fetch('/api/languages/practice/advanced-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: newAnswers,
            questions: quizState.questions,
            userId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'שגיאה בבדיקת התשובות');
        }

        setQuizState({
          ...quizState,
          answers: newAnswers,
          finished: true,
          results: data,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בבדיקת התשובות');
      } finally {
        setIsLoading(false);
      }
    } else {
      setQuizState({
        ...quizState,
        answers: newAnswers,
        currentIndex: quizState.currentIndex + 1,
      });
      setCurrentAnswer('');
      setSelectedOption(null);
      setError(null);
    }
  }, [quizState, currentAnswer, selectedOption, userId]);

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'open_translation':
      case 'sentence_building':
        return <PenTool className="w-5 h-5" />;
      case 'fill_blank':
        return <FileText className="w-5 h-5" />;
      case 'comprehension':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const currentQuestion = quizState?.questions[quizState.currentIndex];

  if (!quizState) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-4 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">תרגול מתקדם</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              תרגול מגוון עם שאלות פתוחות, השלמה, בניית משפטים ועוד. זה יעזור לך ללמוד באמת ולא רק לזכור תשובות.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">רמת קושי</label>
              <div className="flex gap-2">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      difficulty === level
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    {level === 'EASY' ? 'קל' : level === 'MEDIUM' ? 'בינוני' : 'קשה'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  יוצר תרגול...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  התחילי תרגול מתקדם
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (quizState.finished && quizState.results) {
    const { score, correct, total, results, feedback } = quizState.results;
    return (
      <div className="rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center space-y-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
            score >= 80 ? 'bg-emerald-100' : score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {score >= 80 ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              סיימת! ציון: {score}%
            </h3>
            <p className="text-gray-600">
              {correct} מתוך {total} תשובות נכונות
            </p>
            <p className="mt-2 text-sm text-gray-500">{feedback}</p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3 text-right">
            {results.map((result: any, index: number) => {
              const question = quizState.questions[index];
              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 ${
                    result.isCorrect
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{question.question}</p>
                      {question.hebrewTerm && (
                        <p className="text-sm text-gray-600 mt-1">{question.hebrewTerm}</p>
                      )}
                    </div>
                    {result.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium text-gray-700">תשובתך:</span>{' '}
                      <span className={result.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                        {result.userAnswer}
                      </span>
                    </p>
                    {!result.isCorrect && (
                      <p>
                        <span className="font-medium text-gray-700">תשובה נכונה:</span>{' '}
                        <span className="text-emerald-700">{result.correctAnswer}</span>
                      </p>
                    )}
                    {result.feedback && (
                      <p className="text-gray-600 mt-1">{result.feedback}</p>
                    )}
                    {result.explanation && (
                      <p className="text-xs text-gray-500 mt-1">{result.explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={startQuiz}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              תרגול חדש
            </button>
            <button
              onClick={() => setQuizState(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
            >
              חזרה
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progress = ((quizState.currentIndex + 1) / quizState.questions.length) * 100;

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              שאלה {quizState.currentIndex + 1} מתוך {quizState.questions.length}
            </span>
            <span className="text-sm font-medium text-indigo-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            {getQuestionIcon(currentQuestion.type)}
            <div>
              <h4 className="font-semibold text-gray-900">
                {currentQuestion.type === 'open_translation' && 'תרגום פתוח'}
                {currentQuestion.type === 'fill_blank' && 'השלמה'}
                {currentQuestion.type === 'sentence_building' && 'בניית משפט'}
                {currentQuestion.type === 'translation' && 'בחירה מרובה'}
              </h4>
              <p className="text-xs text-gray-500">
                {currentQuestion.difficulty === 'EASY' ? 'קל' : currentQuestion.difficulty === 'MEDIUM' ? 'בינוני' : 'קשה'}
              </p>
            </div>
          </div>

          <p className="text-lg font-semibold text-gray-900 mb-4" dir="rtl">
            {currentQuestion.question}
          </p>

          {currentQuestion.context && (
            <p className="text-sm text-gray-600 mb-4" dir="rtl">
              הקשר: {currentQuestion.context}
          </p>
          )}

          {currentQuestion.type === 'translation' || currentQuestion.type === 'fill_blank' ? (
            <div className="space-y-2">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full text-right rounded-xl border px-4 py-3 text-sm transition ${
                    selectedOption === option
                      ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="כתבי את התשובה שלך כאן..."
              rows={3}
              dir="ltr"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={submitAnswer}
          disabled={isLoading || (!selectedOption && !currentAnswer.trim())}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              בודק תשובה...
            </>
          ) : quizState.currentIndex >= quizState.questions.length - 1 ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              סיים תרגול
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              המשך לשאלה הבאה
            </>
          )}
        </button>
      </div>
    </div>
  );
}

