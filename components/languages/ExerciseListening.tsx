'use client';

import { useState } from 'react';
import { Check, X, Volume2, Loader2 } from 'lucide-react';

interface ExerciseListeningProps {
  question: string;
  audioText: string; // Text to be spoken
  correctAnswer: string;
  onAnswer: (isCorrect: boolean) => void;
  speakText: (text: string, lang: string) => void;
  targetLanguage: string;
}

export default function ExerciseListening({
  question,
  audioText,
  correctAnswer,
  onAnswer,
  speakText,
  targetLanguage,
}: ExerciseListeningProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    speakText(audioText, targetLanguage);
    // Reset playing state after a delay (you might want to use actual speech synthesis events)
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    const correct = normalizedUser === normalizedCorrect;

    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswer(correct);
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-indigo-700 mb-4">{question}</p>

      <div className="mb-4 flex items-center justify-center">
        <button
          type="button"
          onClick={handlePlay}
          disabled={isPlaying}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPlaying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>משמיע...</span>
            </>
          ) : (
            <>
              <Volume2 className="h-5 w-5" />
              <span>הקשיבי וכתבי מה ששמעת</span>
            </>
          )}
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-2">מה ששמעת:</label>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={isSubmitted}
          className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-center text-lg focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50"
          placeholder="הזיני את מה ששמעת..."
          dir="ltr"
        />
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

