'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Volume2, Check, X } from 'lucide-react';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french';

interface Flashcard {
  id: string;
  hebrewTerm: string;
  translatedTerm: string;
  pronunciation?: string;
  usageExample?: { target: string; hebrew: string };
  notes?: string;
  topic: string;
  level: string;
  source: 'lesson' | 'saved';
}

interface FlashcardsProps {
  targetLanguage: SupportedLanguageKey;
  onBack: () => void;
  speakText: (text: string, lang: string) => void;
}

export default function Flashcards({ targetLanguage, onBack, speakText }: FlashcardsProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<string>>(new Set());

  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/languages/practice/flashcards?targetLanguage=${targetLanguage}&limit=30&userId=default-user`
      );
      const data = await response.json();
      if (data.success) {
        setFlashcards(data.flashcards);
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetLanguage]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    if (currentCard) {
      setKnownCards((prev) => new Set(prev).add(currentCard.id));
      setReviewCards((prev) => {
        const next = new Set(prev);
        next.delete(currentCard.id);
        return next;
      });
      setTimeout(handleNext, 300);
    }
  };

  const handleReview = () => {
    if (currentCard) {
      setReviewCards((prev) => new Set(prev).add(currentCard.id));
      setKnownCards((prev) => {
        const next = new Set(prev);
        next.delete(currentCard.id);
        return next;
      });
      setTimeout(handleNext, 300);
    }
  };

  const handleReset = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setKnownCards(new Set());
    setReviewCards(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">טוען כרטיסיות...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">אין כרטיסיות זמינות כרגע</p>
        <button
          onClick={onBack}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition"
        >
          חזרה
        </button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const knownCount = knownCards.size;
  const reviewCount = reviewCards.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה
        </button>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">
            {currentIndex + 1} / {flashcards.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✓ {knownCount}</span>
            <span className="text-orange-600">↻ {reviewCount}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      {currentCard && (
        <div className="relative">
          <div
            className="relative w-full h-[400px] cursor-pointer"
            onClick={handleFlip}
            style={{ perspective: '1000px' }}
          >
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-500"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front */}
              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 h-full flex flex-col items-center justify-center shadow-lg">
                  <p className="text-xs text-indigo-600 mb-4 uppercase tracking-wide">{currentCard.topic}</p>
                  <h2 className="text-4xl font-bold text-slate-900 mb-4" dir="rtl">
                    {currentCard.hebrewTerm}
                  </h2>
                  {currentCard.pronunciation && (
                    <p className="text-sm text-slate-500 mb-4">{currentCard.pronunciation}</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(currentCard.translatedTerm, targetLanguage);
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-indigo-600 hover:bg-indigo-200 transition"
                  >
                    <Volume2 className="h-4 w-4" />
                    האזן
                  </button>
                  <p className="text-xs text-slate-400 mt-6">לחצי כדי לראות את התשובה</p>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 h-full flex flex-col items-center justify-center shadow-lg">
                  <p className="text-xs text-emerald-600 mb-4 uppercase tracking-wide">תרגום</p>
                  <h2 className="text-4xl font-bold text-slate-900 mb-4" dir="ltr">
                    {currentCard.translatedTerm}
                  </h2>
                  {currentCard.usageExample && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-100">
                      <p className="text-sm text-slate-700 mb-1" dir="ltr">
                        {currentCard.usageExample.target}
                      </p>
                      <p className="text-xs text-slate-500" dir="rtl">
                        {currentCard.usageExample.hebrew}
                      </p>
                    </div>
                  )}
                  {currentCard.notes && (
                    <p className="text-sm text-slate-600 mt-4 text-center">{currentCard.notes}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-6">לחצי כדי לחזור</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleReview}
              className="flex items-center gap-2 rounded-xl border-2 border-orange-200 bg-orange-50 px-6 py-3 text-orange-700 font-semibold hover:bg-orange-100 transition"
            >
              <RotateCcw className="h-4 w-4" />
              חזור על זה
            </button>
            <button
              onClick={handleKnown}
              className="flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-6 py-3 text-emerald-700 font-semibold hover:bg-emerald-100 transition"
            >
              <Check className="h-4 w-4" />
              אני יודע/ת
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={flashcards.length === 0}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
        </button>
        <button
          onClick={handleReset}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 transition"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={flashcards.length === 0}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

