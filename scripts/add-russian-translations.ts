/**
 * Script to add Russian translations to LESSON_TEMPLATES
 * This script uses COMMON_WORDS database to find Russian translations
 */

import { COMMON_WORDS } from '../lib/common-words-database';

// Create a map for quick lookup
const wordMap = new Map<string, { russian: string; pronunciation?: string }>();

COMMON_WORDS.forEach(word => {
  wordMap.set(word.hebrew, {
    russian: word.russian,
    // We'll need to add pronunciation separately
  });
});

// Helper function to find Russian translation
export function findRussianTranslation(hebrew: string): string | undefined {
  return wordMap.get(hebrew)?.russian;
}

// Helper function to generate pronunciation guide for Russian
export function generateRussianPronunciation(russian: string): string {
  // Basic pronunciation guide - this is a simplified version
  // In a real scenario, you'd want more accurate phonetic transcription
  return russian.toLowerCase()
    .replace(/а/g, 'ah')
    .replace(/б/g, 'b')
    .replace(/в/g, 'v')
    .replace(/г/g, 'g')
    .replace(/д/g, 'd')
    .replace(/е/g, 'yeh')
    .replace(/ё/g, 'yoh')
    .replace(/ж/g, 'zh')
    .replace(/з/g, 'z')
    .replace(/и/g, 'ee')
    .replace(/й/g, 'y')
    .replace(/к/g, 'k')
    .replace(/л/g, 'l')
    .replace(/м/g, 'm')
    .replace(/н/g, 'n')
    .replace(/о/g, 'oh')
    .replace(/п/g, 'p')
    .replace(/р/g, 'r')
    .replace(/с/g, 's')
    .replace(/т/g, 't')
    .replace(/у/g, 'oo')
    .replace(/ф/g, 'f')
    .replace(/х/g, 'kh')
    .replace(/ц/g, 'ts')
    .replace(/ч/g, 'ch')
    .replace(/ш/g, 'sh')
    .replace(/щ/g, 'shch')
    .replace(/ъ/g, '')
    .replace(/ы/g, 'y')
    .replace(/ь/g, '')
    .replace(/э/g, 'eh')
    .replace(/ю/g, 'yoo')
    .replace(/я/g, 'yah');
}

