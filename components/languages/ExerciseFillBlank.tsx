'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface ExerciseFillBlankProps {
  question: string;
  sentence: string; // Sentence with [BLANK] placeholder
  correctAnswer: string;
  onAnswer: (isCorrect: boolean) => void;
}

export default function ExerciseFillBlank({
  question,
  sentence,
  correctAnswer,
  onAnswer,
}: ExerciseFillBlankProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    const correct = normalizedUser === normalizedCorrect;

    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswer(correct);
  };

  const sentenceParts = sentence.split('[BLANK]');

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-indigo-700 mb-4">{question}</p>

      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex flex-wrap items-center gap-2 text-lg" dir="ltr">
          {sentenceParts[0]}
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isSubmitted}
            className="min-w-[120px] rounded-lg border border-indigo-200 bg-white px-3 py-2 text-center font-semibold focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50"
            placeholder="הזיני תשובה"
          />
          {sentenceParts[1]}
        </div>
      </div>

      {!isSubmitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          בדוק תשובה
        </button>
      ) : (
        <div className={`rounded-xl border p-4 ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <Check className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">✓ נכון! כל הכבוד!</p>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-rose-600" />
                <p className="text-sm font-semibold text-rose-700">✗ לא נכון</p>
              </>
            )}
          </div>
          {!isCorrect && (
            <p className="text-xs text-slate-600">
              התשובה הנכונה: <span className="font-semibold">{correctAnswer}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

