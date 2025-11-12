'use client';

import { useState } from 'react';
import { Check, X, Volume2 } from 'lucide-react';

interface MatchingOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface ExerciseMatchingProps {
  question: string;
  hebrewTerm: string;
  options: MatchingOption[];
  onAnswer: (isCorrect: boolean, explanation?: string) => void;
  speakText?: (text: string, lang: string) => void;
  targetLanguage: string;
}

export default function ExerciseMatching({
  question,
  hebrewTerm,
  options,
  onAnswer,
  speakText,
  targetLanguage,
}: ExerciseMatchingProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);

  const handleSelect = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOptionId) return;

    const selectedOption = options.find((opt) => opt.id === selectedOptionId);
    if (selectedOption) {
      setIsSubmitted(true);
      const resultData = {
        isCorrect: selectedOption.isCorrect,
        explanation: selectedOption.explanation,
      };
      setResult(resultData);
      onAnswer(selectedOption.isCorrect, selectedOption.explanation);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-medium text-indigo-700 mb-2">{question}</p>
        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-lg font-semibold text-indigo-900" dir="rtl">{hebrewTerm}</p>
          {speakText && (
            <button
              type="button"
              onClick={() => speakText(hebrewTerm, 'he-IL')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition hover:bg-indigo-200"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const showResult = isSubmitted && isSelected;
          const isCorrect = showResult && option.isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={isSubmitted}
              className={`w-full rounded-xl border px-4 py-3 text-right transition ${
                isSelected
                  ? isSubmitted
                    ? isCorrect
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-indigo-400 bg-indigo-100 text-indigo-700'
                  : 'border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300'
              } disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <span>{option.text}</span>
                {showResult && (
                  <span className="text-lg">
                    {isCorrect ? <Check className="h-5 w-5 text-emerald-600" /> : <X className="h-5 w-5 text-rose-600" />}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!isSubmitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedOptionId}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          בדוק תשובה
        </button>
      ) : (
        result && (
          <div className={`rounded-xl border p-4 ${result.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <p className={`text-sm font-semibold ${result.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
              {result.isCorrect ? '✓ נכון! כל הכבוד!' : '✗ לא נכון. נסי שוב בפעם הבאה.'}
            </p>
            {result.explanation && (
              <p className="mt-2 text-xs text-slate-600">{result.explanation}</p>
            )}
          </div>
        )
      )}
    </div>
  );
}

