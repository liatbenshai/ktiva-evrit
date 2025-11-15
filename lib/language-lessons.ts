/**
 * Static Language Lessons
 * All lessons are pre-built and loaded from templates
 * No database required - everything is in-memory
 */

import { generateGrammarNotes } from '@/lib/ai/claude';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type ExerciseType = 'MATCHING' | 'FILL_BLANK' | 'WORD_ORDER' | 'LISTENING';

interface VocabularyItem {
  id: string;
  hebrewTerm: string;
  translatedTerm: string;
  pronunciation?: string;
  usageExample?: { target: string; hebrew: string };
  notes?: string;
  difficulty: string;
  partOfSpeech: string;
  order: number;
  isSentence: boolean;
}

interface ExerciseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
  order: number;
}

interface Exercise {
  id: string;
  type: ExerciseType;
  title?: string;
  instructions: string;
  question: string;
  correctAnswer?: string;
  exerciseData?: string;
  points: number;
  order: number;
  options?: ExerciseOption[];
}

interface Lesson {
  id: string;
  targetLanguage: SupportedLanguageKey;
  level: LanguageLevel;
  topic: string;
  title: string;
  description?: string;
  grammarNotes?: string;
  culturalTips?: string;
  order: number;
  isPublished: boolean;
  duration: number;
  vocabulary: VocabularyItem[];
  exercises: Exercise[];
}

// Import templates from the create-multiple-demo route
// We'll copy the LESSON_TEMPLATES here or import them
// For now, let's create a helper function that builds lessons from templates

function getTranslation(term: any, lang: SupportedLanguageKey): string {
  return term[lang] || term.en || term.hebrew || '';
}

function getPronunciation(term: any, lang: SupportedLanguageKey): string | null {
  return term.pronunciation?.[lang] || null;
}

// Helper function to generate exercises from template
function generateExercisesFromTemplate(
  template: any,
  lang: SupportedLanguageKey,
  lessonId: string
): Exercise[] {
  const exercises: Exercise[] = [];
  let exerciseOrder = 1;

  // Exercise 1: Matching - first word
  if (template.vocabulary && template.vocabulary.length > 0) {
    const firstVocab = template.vocabulary[0];
    exercises.push({
      id: `${lessonId}-ex-${exerciseOrder}`,
      type: 'MATCHING',
      title: 'התאמת מילים',
      instructions: `בחרי את התרגום הנכון למילה "${firstVocab.hebrew}"`,
      question: `מה התרגום של "${firstVocab.hebrew}"?`,
      correctAnswer: getTranslation(firstVocab, lang),
      points: 10,
      order: exerciseOrder++,
      options: [
        {
          id: `${lessonId}-ex-${exerciseOrder - 1}-opt-1`,
          text: getTranslation(firstVocab, lang),
          isCorrect: true,
          explanation: `נכון! "${firstVocab.hebrew}" מתרגם ל-${getTranslation(firstVocab, lang)}`,
          order: 1,
        },
        {
          id: `${lessonId}-ex-${exerciseOrder - 1}-opt-2`,
          text: getTranslation(template.vocabulary[1] || template.vocabulary[0], lang),
          isCorrect: false,
          explanation: 'זה לא התרגום הנכון',
          order: 2,
        },
        {
          id: `${lessonId}-ex-${exerciseOrder - 1}-opt-3`,
          text: getTranslation(template.vocabulary[2] || template.vocabulary[0], lang),
          isCorrect: false,
          explanation: 'זה לא התרגום הנכון',
          order: 3,
        },
        {
          id: `${lessonId}-ex-${exerciseOrder - 1}-opt-4`,
          text: getTranslation(template.vocabulary[3] || template.vocabulary[0], lang),
          isCorrect: false,
          explanation: 'זה לא התרגום הנכון',
          order: 4,
        },
      ],
    });
  }

  // Add sentence exercises if we have sentences
  if (template.sentences && template.sentences.length > 0) {
    const sentence = template.sentences[0];
    const sentenceTranslation = getTranslation(sentence, lang);
    const sentenceWords = sentenceTranslation.split(' ').filter(
      (w: string) => w.length > 1 && !['the', 'a', 'an', 'is', 'are', 'am', 'was', 'were'].includes(w.toLowerCase())
    );

    // WORD_ORDER exercise
    if (sentenceWords.length >= 2) {
      exercises.push({
        id: `${lessonId}-ex-${exerciseOrder}`,
        type: 'WORD_ORDER',
        title: 'הרכיבי משפט',
        instructions: 'סדרי את המילים בסדר הנכון כדי ליצור משפט',
        question: `הרכיבי משפט מהמילים הבאות: ${sentenceWords.join(', ')}`,
        correctAnswer: sentenceTranslation,
        exerciseData: JSON.stringify({
          words: sentenceWords,
          correctOrder: sentenceTranslation.split(' '),
          hebrewSentence: sentence.hebrew,
        }),
        points: 20,
        order: exerciseOrder++,
      });
    }

    // Translation exercise - word in target language → Hebrew
    const firstWord = sentenceTranslation.split(' ')[0];
    const firstWordHebrew = sentence.hebrew.split(' ')[0];

    exercises.push({
      id: `${lessonId}-ex-${exerciseOrder}`,
      type: 'FILL_BLANK',
      title: 'תרגום מילה',
      instructions: 'מה התרגום בעברית של המילה בשפה הנלמדת?',
      question: `מה התרגום בעברית של המילה "${firstWord}"?`,
      correctAnswer: firstWordHebrew,
      exerciseData: JSON.stringify({
        hebrewSentence: firstWordHebrew,
        targetWord: firstWord,
        targetLanguage: lang,
      }),
      points: 15,
      order: exerciseOrder++,
    });

    // Another matching exercise
    if (template.vocabulary && template.vocabulary.length >= 2) {
      const secondVocab = template.vocabulary[1];
      exercises.push({
        id: `${lessonId}-ex-${exerciseOrder}`,
        type: 'MATCHING',
        title: 'התאמת מילה נוספת',
        instructions: `בחרי את התרגום הנכון למילה "${secondVocab.hebrew}"`,
        question: `מה התרגום של "${secondVocab.hebrew}"?`,
        correctAnswer: getTranslation(secondVocab, lang),
        points: 10,
        order: exerciseOrder++,
        options: [
          {
            id: `${lessonId}-ex-${exerciseOrder - 1}-opt-1`,
            text: getTranslation(secondVocab, lang),
            isCorrect: true,
            explanation: `נכון! "${secondVocab.hebrew}" מתרגם ל-${getTranslation(secondVocab, lang)}`,
            order: 1,
          },
          {
            id: `${lessonId}-ex-${exerciseOrder - 1}-opt-2`,
            text: getTranslation(template.vocabulary[0], lang),
            isCorrect: false,
            explanation: 'זה לא התרגום הנכון',
            order: 2,
          },
          {
            id: `${lessonId}-ex-${exerciseOrder - 1}-opt-3`,
            text: getTranslation(template.vocabulary[2] || template.vocabulary[0], lang),
            isCorrect: false,
            explanation: 'זה לא התרגום הנכון',
            order: 3,
          },
          {
            id: `${lessonId}-ex-${exerciseOrder - 1}-opt-4`,
            text: getTranslation(template.vocabulary[3] || template.vocabulary[0], lang),
            isCorrect: false,
            explanation: 'זה לא התרגום הנכון',
            order: 4,
          },
        ],
      });
    }
  } else {
    // If no sentences, add more matching exercises
    if (template.vocabulary && template.vocabulary.length >= 2) {
      const secondVocab = template.vocabulary[1];
      exercises.push({
        id: `${lessonId}-ex-${exerciseOrder}`,
        type: 'MATCHING',
        title: 'התאמת מילה נוספת',
        instructions: `בחרי את התרגום הנכון למילה "${secondVocab.hebrew}"`,
        question: `מה התרגום של "${secondVocab.hebrew}"?`,
        correctAnswer: getTranslation(secondVocab, lang),
        points: 10,
        order: exerciseOrder++,
        options: [
          {
            id: `${lessonId}-ex-${exerciseOrder - 1}-opt-1`,
            text: getTranslation(secondVocab, lang),
            isCorrect: true,
            explanation: `נכון! "${secondVocab.hebrew}" מתרגם ל-${getTranslation(secondVocab, lang)}`,
            order: 1,
          },
          {
            id: `${lessonId}-ex-${exerciseOrder - 1}-opt-2`,
            text: getTranslation(template.vocabulary[0], lang),
            isCorrect: false,
            explanation: 'זה לא התרגום הנכון',
            order: 2,
          },
          {
            id: `${lessonId}-ex-${exerciseOrder - 1}-opt-3`,
            text: getTranslation(template.vocabulary[2] || template.vocabulary[0], lang),
            isCorrect: false,
            explanation: 'זה לא התרגום הנכון',
            order: 3,
          },
        ],
      });
    }
  }

  return exercises;
}

// Helper function to generate vocabulary from template
function generateVocabularyFromTemplate(
  template: any,
  lang: SupportedLanguageKey,
  lessonId: string
): VocabularyItem[] {
  const vocabulary: VocabularyItem[] = [];
  let vocabOrder = 1;

  // Add regular vocabulary
  if (template.vocabulary) {
    template.vocabulary.forEach((term: any) => {
      const mainTranslation = getTranslation(term, lang);
      const alternatives = term.alternatives?.[lang] || [];
      const notesContent = alternatives.length > 0
        ? `תרגומים חלופיים: ${alternatives.join(', ')}`
        : null;

      vocabulary.push({
        id: `${lessonId}-vocab-${vocabOrder}`,
        hebrewTerm: term.hebrew,
        translatedTerm: mainTranslation,
        pronunciation: getPronunciation(term, lang) || undefined,
        usageExample: {
          target: `${mainTranslation} - ${term.hebrew}`,
          hebrew: term.hebrew,
        },
        notes: notesContent || undefined,
        difficulty: 'EASY',
        partOfSpeech: 'NOUN',
        order: vocabOrder++,
        isSentence: false,
      });
    });
  }

  // Add sentences
  if (template.sentences) {
    template.sentences.forEach((sentence: any) => {
      const mainTranslation = getTranslation(sentence, lang);
      vocabulary.push({
        id: `${lessonId}-vocab-${vocabOrder}`,
        hebrewTerm: sentence.hebrew,
        translatedTerm: mainTranslation,
        pronunciation: getPronunciation(sentence, lang) || undefined,
        usageExample: {
          target: mainTranslation,
          hebrew: sentence.hebrew,
        },
        notes: 'משפט שלם',
        difficulty: 'MEDIUM',
        partOfSpeech: 'OTHER',
        order: vocabOrder++,
        isSentence: true,
      });
    });
  }

  return vocabulary;
}

// Cache for built lessons
let lessonsCache: Map<string, Lesson[]> | null = null;

/**
 * Build all lessons from templates
 * This function is called once and caches the results
 */
export async function buildAllLessons(): Promise<Lesson[]> {
  if (lessonsCache) {
    return Array.from(lessonsCache.values()).flat();
  }

  // Import LESSON_TEMPLATES
  // Note: We need to import this at build time, so we'll copy the templates here
  // For now, let's import from the route file
  const templatesModule = await import('@/app/api/languages/lessons/create-multiple-demo/route');
  const LESSON_TEMPLATES = templatesModule.LESSON_TEMPLATES;
  
  const allLessons: Lesson[] = [];
  const languages: SupportedLanguageKey[] = ['english', 'romanian', 'italian', 'french', 'russian'];
  const levels: LanguageLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  for (const lang of languages) {
    for (const level of levels) {
      const topicsForLevel = LESSON_TEMPLATES[level] || {};
      let topicOrder = 1;

      for (const [topic, template] of Object.entries(topicsForLevel)) {
        const lessonId = `${lang}-${level}-${topic}-${topicOrder}`;
        
        // Generate vocabulary
        const vocabulary = generateVocabularyFromTemplate(template, lang, lessonId);
        
        // Generate exercises
        const exercises = generateExercisesFromTemplate(template, lang, lessonId);

        // Generate grammar notes (synchronous fallback for now)
        // In production, these should be pre-generated
        let grammarNotes = `<p>בשיעור זה נלמד מילים ומשפטים הקשורים ל-${topic} בשפה ${lang === 'english' ? 'אנגלית' : lang === 'romanian' ? 'רומנית' : lang === 'italian' ? 'איטלקית' : lang === 'french' ? 'צרפתית' : 'רוסית'}. נדגיש כללי דקדוק חשובים ונעסוק בשימוש מעשי במילים.</p>`;

        const lesson: Lesson = {
          id: lessonId,
          targetLanguage: lang,
          level,
          topic,
          title: template.title,
          description: template.description,
          grammarNotes,
          culturalTips: `מילים אלה שימושיות מאוד ב-${lang === 'english' ? 'אנגלית' : lang === 'romanian' ? 'רומנית' : lang === 'italian' ? 'איטלקית' : lang === 'french' ? 'צרפתית' : 'רוסית'}.`,
          order: topicOrder++,
          isPublished: true,
          duration: 10,
          vocabulary,
          exercises,
        };

        allLessons.push(lesson);
      }
    }
  }

  // Cache the results
  lessonsCache = new Map();
  allLessons.forEach(lesson => {
    const key = `${lesson.targetLanguage}-${lesson.level}-${lesson.topic}`;
    if (!lessonsCache!.has(key)) {
      lessonsCache!.set(key, []);
    }
    lessonsCache!.get(key)!.push(lesson);
  });

  return allLessons;
}

/**
 * Get lessons filtered by language, level, and topic
 */
export async function getLessons(filters: {
  targetLanguage?: SupportedLanguageKey;
  level?: LanguageLevel;
  topic?: string;
}): Promise<Lesson[]> {
  const allLessons = await buildAllLessons();
  
  return allLessons.filter(lesson => {
    if (filters.targetLanguage && lesson.targetLanguage !== filters.targetLanguage) return false;
    if (filters.level && lesson.level !== filters.level) return false;
    if (filters.topic && lesson.topic !== filters.topic) return false;
    return true;
  });
}

/**
 * Get a single lesson by ID
 */
export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const allLessons = await buildAllLessons();
  return allLessons.find(lesson => lesson.id === lessonId) || null;
}

