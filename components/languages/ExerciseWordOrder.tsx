'use client';

import { useState } from 'react';
import { Check, X, GripVertical } from 'lucide-react';

interface ExerciseWordOrderProps {
  question: string;
  words: string[]; // Words to arrange
  correctOrder: string[]; // Correct order (array of word IDs or indices)
  onAnswer: (isCorrect: boolean) => void;
}

export default function ExerciseWordOrder({
  question,
  words,
  correctOrder,
  onAnswer,
}: ExerciseWordOrderProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(words);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleWordClick = (word: string, fromSelected: boolean) => {
    if (isSubmitted) return;

    if (fromSelected) {
      setSelectedWords((prev) => prev.filter((w) => w !== word));
      setAvailableWords((prev) => [...prev, word].sort());
    } else {
      setAvailableWords((prev) => prev.filter((w) => w !== word));
      setSelectedWords((prev) => [...prev, word]);
    }
  };

  const handleSubmit = () => {
    if (selectedWords.length !== words.length) return;

    const userOrder = selectedWords;
    const correct = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswer(correct);
  };

  const handleReset = () => {
    setSelectedWords([]);
    setAvailableWords([...words].sort());
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-indigo-700 mb-4">{question}</p>

      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2">לחצי על המילים לפי הסדר הנכון:</p>
        <div className="min-h-[100px] rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4">
          {selectedWords.length === 0 ? (
            <p className="text-center text-sm text-slate-400">המילים שתבחרי יופיעו כאן</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedWords.map((word, index) => (
                <button
                  key={`${word}-${index}`}
                  type="button"
                  onClick={() => handleWordClick(word, true)}
                  disabled={isSubmitted}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed"
                >
                  <GripVertical className="h-4 w-4 text-indigo-400" />
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2">מילים זמינות:</p>
        <div className="flex flex-wrap gap-2">
          {availableWords.map((word, index) => (
            <button
              key={`${word}-${index}`}
              type="button"
              onClick={() => handleWordClick(word, false)}
              disabled={isSubmitted}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {!isSubmitted ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedWords.length !== words.length}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            בדוק תשובה
          </button>
          {selectedWords.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              איפוס
            </button>
          )}
        </div>
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
                <p className="text-sm font-semibold text-rose-700">✗ לא נכון. נסי שוב!</p>
              </>
            )}
          </div>
          {!isCorrect && (
            <p className="text-xs text-slate-600">
              הסדר הנכון: <span className="font-semibold">{correctOrder.join(' ')}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

