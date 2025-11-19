/**
 * Static Language Lessons
 * All lessons are pre-built and loaded from templates
 * No database required - everything is in-memory
 */

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

// Map from SupportedLanguageKey to template field names
const LANGUAGE_MAP: Record<SupportedLanguageKey, string> = {
  english: 'en',
  romanian: 'ro',
  italian: 'it',
  french: 'fr',
  russian: 'ru',
};

function getTranslation(term: any, lang: SupportedLanguageKey): string {
  if (!term || typeof term !== 'object') return '';
  const templateKey = LANGUAGE_MAP[lang];
  if (!templateKey) return term.en || term.hebrew || '';
  return term[templateKey] || term.en || term.hebrew || '';
}

function getPronunciation(term: any, lang: SupportedLanguageKey): string | null {
  if (!term || typeof term !== 'object' || !term.pronunciation) return null;
  const templateKey = LANGUAGE_MAP[lang];
  if (!templateKey) return null;
  return term.pronunciation[templateKey] || null;
}

// Helper function to create a matching exercise
function createMatchingExercise(
  vocab: any,
  template: any,
  lang: SupportedLanguageKey,
  lessonId: string,
  exerciseOrder: number,
  title: string = 'התאמת מילים'
): Exercise {
  const otherVocabs = template.vocabulary.filter((v: any) => v.hebrew !== vocab.hebrew);
  const wrongOptions = [
    otherVocabs[0] || template.vocabulary[0],
    otherVocabs[1] || template.vocabulary[0],
    otherVocabs[2] || template.vocabulary[0],
  ].filter(Boolean);

  return {
    id: `${lessonId}-ex-${exerciseOrder}`,
    type: 'MATCHING',
    title,
    instructions: `בחרי את התרגום הנכון למילה "${vocab.hebrew}"`,
    question: `מה התרגום של "${vocab.hebrew}"?`,
    correctAnswer: getTranslation(vocab, lang),
    points: 10,
    order: exerciseOrder,
    options: [
      {
        id: `${lessonId}-ex-${exerciseOrder}-opt-1`,
        text: getTranslation(vocab, lang),
        isCorrect: true,
        explanation: `נכון! "${vocab.hebrew}" מתרגם ל-${getTranslation(vocab, lang)}`,
        order: 1,
      },
      ...wrongOptions.slice(0, 3).map((wrongVocab: any, idx: number) => ({
        id: `${lessonId}-ex-${exerciseOrder}-opt-${idx + 2}`,
        text: getTranslation(wrongVocab, lang),
        isCorrect: false,
        explanation: 'זה לא התרגום הנכון',
        order: idx + 2,
      })),
    ],
  };
}

// Helper function to generate exercises from template
function generateExercisesFromTemplate(
  template: any,
  lang: SupportedLanguageKey,
  lessonId: string
): Exercise[] {
  const exercises: Exercise[] = [];
  let exerciseOrder = 1;

  const vocabList = template.vocabulary || [];
  const sentences = template.sentences || [];

  // Create matching exercises for multiple vocabulary words (up to 6-8 words)
  const vocabToPractice = vocabList.slice(0, Math.min(8, vocabList.length));
  vocabToPractice.forEach((vocab: any, index: number) => {
    exercises.push(createMatchingExercise(
      vocab,
      template,
      lang,
      lessonId,
      exerciseOrder++,
      index === 0 ? 'התאמת מילים' : `התאמת מילה ${index + 1}`
    ));
  });

  // Add sentence exercises if we have sentences
  if (sentences.length > 0) {
    sentences.forEach((sentence: any, sentenceIndex: number) => {
      const sentenceTranslation = getTranslation(sentence, lang);
      const sentenceWords = sentenceTranslation.split(' ').filter(
        (w: string) => w.length > 1 && !['the', 'a', 'an', 'is', 'are', 'am', 'was', 'were', 'le', 'la', 'les', 'un', 'une', 'il', 'elle', 'nous', 'vous', 'ils', 'elles'].includes(w.toLowerCase())
      );

      // WORD_ORDER exercise for each sentence
      if (sentenceWords.length >= 3) {
        exercises.push({
          id: `${lessonId}-ex-${exerciseOrder}`,
          type: 'WORD_ORDER',
          title: sentenceIndex === 0 ? 'הרכיבי משפט' : `הרכיבי משפט ${sentenceIndex + 1}`,
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

      // FILL_BLANK exercises - translate words from target language to Hebrew
      const importantWords = sentenceTranslation.split(' ').filter(
        (w: string) => w.length > 2 && !['the', 'a', 'an', 'is', 'are', 'am', 'was', 'were', 'and', 'or', 'but'].includes(w.toLowerCase())
      ).slice(0, 2);

      importantWords.forEach((targetWord: string, wordIndex: number) => {
        const hebrewWords = sentence.hebrew.split(' ');
        const correspondingHebrew = hebrewWords[wordIndex] || hebrewWords[0];
        
        exercises.push({
          id: `${lessonId}-ex-${exerciseOrder}`,
          type: 'FILL_BLANK',
          title: wordIndex === 0 ? 'תרגום מילה' : `תרגום מילה ${wordIndex + 1}`,
          instructions: 'מה התרגום בעברית של המילה בשפה הנלמדת?',
          question: `מה התרגום בעברית של המילה "${targetWord}"?`,
          correctAnswer: correspondingHebrew,
          exerciseData: JSON.stringify({
            hebrewSentence: correspondingHebrew,
            targetWord: targetWord,
            targetLanguage: lang,
          }),
          points: 15,
          order: exerciseOrder++,
        });
      });

      // LISTENING exercise for sentences
      exercises.push({
        id: `${lessonId}-ex-${exerciseOrder}`,
        type: 'LISTENING',
        title: sentenceIndex === 0 ? 'האזנה וזיהוי' : `האזנה וזיהוי ${sentenceIndex + 1}`,
        instructions: 'האזיני למילה/משפט ובחרי את התרגום הנכון בעברית',
        question: `מה התרגום בעברית של "${sentenceTranslation}"?`,
        correctAnswer: sentence.hebrew,
        points: 15,
        order: exerciseOrder++,
      });
    });
  }

  // Add more FILL_BLANK exercises for vocabulary words (reverse translation)
  vocabToPractice.slice(0, 4).forEach((vocab: any, index: number) => {
    exercises.push({
      id: `${lessonId}-ex-${exerciseOrder}`,
      type: 'FILL_BLANK',
      title: index === 0 ? 'תרגום הפוך' : `תרגום הפוך ${index + 1}`,
      instructions: 'מה התרגום בעברית של המילה בשפה הנלמדת?',
      question: `מה התרגום בעברית של "${getTranslation(vocab, lang)}"?`,
      correctAnswer: vocab.hebrew,
      exerciseData: JSON.stringify({
        hebrewSentence: vocab.hebrew,
        targetWord: getTranslation(vocab, lang),
        targetLanguage: lang,
      }),
      points: 12,
      order: exerciseOrder++,
    });
  });

  // Add sentence building exercises with linking words
  if (sentences.length > 0) {
    // Find linking words in vocabulary
    const linkingWords = vocabList.filter((v: any) => v.contentType === 'linking_word' || ['ו', 'אבל', 'או', 'כי', 'אם', 'כאשר', 'לכן', 'אז', 'אחרי', 'לפני'].includes(v.hebrew));
    
    if (linkingWords.length > 0 && sentences.length > 0) {
      // Create sentence building exercises that include linking words
      sentences.slice(0, 2).forEach((sentence: any, sentenceIndex: number) => {
        const sentenceTranslation = getTranslation(sentence, lang);
        // Split sentence into parts and include linking words
        const allWords = sentenceTranslation.split(' ').filter((w: string) => w.length > 0);
        
        // Create a more complex word order exercise that includes linking words
        if (allWords.length >= 4) {
          exercises.push({
            id: `${lessonId}-ex-${exerciseOrder}`,
            type: 'WORD_ORDER',
            title: sentenceIndex === 0 ? 'הרכיבי משפט עם מילות קישור' : `הרכיבי משפט עם מילות קישור ${sentenceIndex + 1}`,
            instructions: 'הרכיבי משפט שלם מהמילים הבאות, כולל מילות הקישור',
            question: `הרכיבי משפט מהמילים הבאות: ${allWords.join(', ')}`,
            correctAnswer: sentenceTranslation,
            exerciseData: JSON.stringify({
              words: allWords,
              correctOrder: allWords,
              hebrewSentence: sentence.hebrew,
              includeLinkingWords: true,
            }),
            points: 25,
            order: exerciseOrder++,
          });
        }
      });
    }
  }

  // Add exercises specifically for linking words
  const linkingWords = vocabList.filter((v: any) => v.contentType === 'linking_word' || ['ו', 'אבל', 'או', 'כי', 'אם', 'כאשר', 'לכן', 'אז', 'אחרי', 'לפני'].includes(v.hebrew));
  if (linkingWords.length > 0) {
    linkingWords.slice(0, 5).forEach((linkingWord: any, index: number) => {
      exercises.push(createMatchingExercise(
        linkingWord,
        template,
        lang,
        lessonId,
        exerciseOrder++,
        `מילת קישור ${index + 1}`
      ));
    });
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

