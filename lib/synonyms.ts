/**
 * Hebrew Synonyms Dictionary for Writing Improvement
 * מילון מילים נרדפות לשיפור כתיבה עברית
 */

export interface SynonymGroup {
  primary: string
  alternatives: string[]
  category: 'formal' | 'informal' | 'academic' | 'business' | 'creative' | 'technical'
  context: string[]
}

export const HEBREW_SYNONYMS: SynonymGroup[] = [
  // Formal Writing
  {
    primary: 'אני מצהיר',
    alternatives: ['אני מכריז', 'אני מודיע', 'אני מבטיח', 'אני מתחייב'],
    category: 'formal',
    context: ['מסמכים רשמיים', 'הצהרות', 'התחייבויות']
  },
  {
    primary: 'בהתאם',
    alternatives: ['לפי', 'על פי', 'בהתבסס על', 'בהתאם ל'],
    category: 'formal',
    context: ['מסמכים משפטיים', 'הנחיות', 'תקנות']
  },
  {
    primary: 'לפיכך',
    alternatives: ['לכן', 'משום כך', 'על כן', 'בשל כך'],
    category: 'formal',
    context: ['מסקנות', 'נימוקים', 'הסברים']
  },
  {
    primary: 'בנוסף',
    alternatives: ['יתר על כן', 'מעבר לכך', 'גם כן', 'כמו כן'],
    category: 'formal',
    context: ['הוספות', 'הרחבות', 'פירוטים']
  },
  {
    primary: 'לבסוף',
    alternatives: ['לסיום', 'בסיכום', 'לסיכום', 'לבסוף'],
    category: 'formal',
    context: ['סיכומים', 'מסקנות', 'סיומים']
  },

  // Business Writing
  {
    primary: 'לקוח',
    alternatives: ['מזמין', 'נצרך', 'מקבל שירות', 'משתמש'],
    category: 'business',
    context: ['מסחר', 'שירותים', 'מכירות']
  },
  {
    primary: 'מוצר',
    alternatives: ['פריט', 'סחורה', 'שירות', 'פתרון'],
    category: 'business',
    context: ['מכירות', 'שיווק', 'פיתוח']
  },
  {
    primary: 'מחיר',
    alternatives: ['עלות', 'תשלום', 'שכר', 'תמורה'],
    category: 'business',
    context: ['מסחר', 'הצעות מחיר', 'חוזים']
  },
  {
    primary: 'איכות',
    alternatives: ['רמה', 'סטנדרט', 'רמת ביצוע', 'איכות ביצוע'],
    category: 'business',
    context: ['הערכות', 'ביקורות', 'מדידות']
  },

  // Academic Writing
  {
    primary: 'מחקר',
    alternatives: ['חקירה', 'בדיקה', 'ניתוח', 'סקירה'],
    category: 'academic',
    context: ['אקדמיה', 'מדע', 'ספרות מקצועית']
  },
  {
    primary: 'תוצאות',
    alternatives: ['ממצאים', 'השגים', 'הישגים', 'תוצאות'],
    category: 'academic',
    context: ['מחקרים', 'ניסויים', 'בדיקות']
  },
  {
    primary: 'השערה',
    alternatives: ['תיאוריה', 'הנחה', 'השערה', 'תחזית'],
    category: 'academic',
    context: ['מחקר', 'ניתוח', 'תיאוריה']
  },

  // Creative Writing
  {
    primary: 'יפה',
    alternatives: ['מקסים', 'נפלא', 'מרהיב', 'מעורר השראה'],
    category: 'creative',
    context: ['סיפורים', 'שירה', 'תיאורים']
  },
  {
    primary: 'גדול',
    alternatives: ['ענק', 'עצום', 'רב', 'נרחב'],
    category: 'creative',
    context: ['תיאורים', 'סיפורים', 'שירה']
  },
  {
    primary: 'קטן',
    alternatives: ['זעיר', 'מיניאטורי', 'קטנטן', 'זעיר'],
    category: 'creative',
    context: ['תיאורים', 'סיפורים', 'שירה']
  },

  // Technical Writing
  {
    primary: 'מערכת',
    alternatives: ['פלטפורמה', 'ממשק', 'תשתית', 'מבנה'],
    category: 'technical',
    context: ['טכנולוגיה', 'תכנות', 'הנדסה']
  },
  {
    primary: 'פונקציה',
    alternatives: ['תכונה', 'יכולת', 'פונקציונליות', 'שירות'],
    category: 'technical',
    context: ['תכנות', 'מערכות', 'תוכנות']
  },
  {
    primary: 'נתונים',
    alternatives: ['מידע', 'נתונים', 'מאגר מידע', 'בסיס נתונים'],
    category: 'technical',
    context: ['מחשבים', 'מערכות מידע', 'אנליטיקה']
  },

  // General Improvements
  {
    primary: 'אני חושב',
    alternatives: ['אני מאמין', 'אני סבור', 'אני מעריך', 'לדעתי'],
    category: 'informal',
    context: ['דעות', 'הערכות', 'מחשבות']
  },
  {
    primary: 'אני רוצה',
    alternatives: ['אני מעוניין', 'אני מבקש', 'אני מעדיף', 'אני שואף'],
    category: 'informal',
    context: ['בקשות', 'רצונות', 'מטרות']
  },
  {
    primary: 'טוב',
    alternatives: ['מעולה', 'נהדר', 'מצוין', 'מושלם'],
    category: 'informal',
    context: ['הערכות', 'תגובות', 'משוב']
  },
  {
    primary: 'רע',
    alternatives: ['גרוע', 'לא טוב', 'בעייתי', 'לא מתאים'],
    category: 'informal',
    context: ['הערכות', 'ביקורות', 'משוב']
  },

  // More common words
  {
    primary: 'כי',
    alternatives: ['משום ש', 'בגין', 'בשל', 'עקב כך'],
    category: 'general',
    context: ['הסברים', 'סיבות', 'נימוקים']
  },
  {
    primary: 'גם',
    alternatives: ['בנוסף', 'כמו כן', 'באותו אופן', 'יתר על כן'],
    category: 'general',
    context: ['הוספות', 'הרחבות']
  },
  {
    primary: 'אבל',
    alternatives: ['אולם', 'ברם', 'עם זאת', 'לעומת זאת'],
    category: 'general',
    context: ['ניגודים', 'הסתייגויות']
  },
  {
    primary: 'זה',
    alternatives: ['ההוא', 'הנ"ל', 'האמור לעיל', 'הנזכר'],
    category: 'general',
    context: ['התייחסויות', 'הפניות']
  },
  {
    primary: 'יש',
    alternatives: ['קיימים', 'נמצא', 'ישנם', 'קיים'],
    category: 'general',
    context: ['קיום', 'נוכחות']
  },
  {
    primary: 'תמיד',
    alternatives: ['בכל עת', 'בלא הפסקה', 'לעולם', 'בכל מקרה'],
    category: 'general',
    context: ['זמן', 'תדירות']
  },
  {
    primary: 'לעזור',
    alternatives: ['לתרום', 'לסייע', 'להועיל', 'לתמוך'],
    category: 'general',
    context: ['פעולות', 'שירות']
  },
  {
    primary: 'ליצור',
    alternatives: ['לבנות', 'לפתח', 'להקים', 'להקים'],
    category: 'general',
    context: ['יצירה', 'פיתוח']
  },
  {
    primary: 'להשתמש',
    alternatives: ['לנצל', 'להפעיל', 'להשתמש ב', 'לעשות שימוש'],
    category: 'general',
    context: ['פעולות', 'שימוש']
  },
  {
    primary: 'חדש',
    alternatives: ['מעודכן', 'מודרני', 'טרי', 'בלתי נדוש'],
    category: 'general',
    context: ['תיאורים', 'סטטוס']
  },
  {
    primary: 'טוב יותר',
    alternatives: ['משופר', 'נעלה', 'מצטיין יותר', 'איכותי יותר'],
    category: 'general',
    context: ['השוואות', 'שיפורים']
  },
  {
    primary: 'קצת',
    alternatives: ['במידה', 'בשלב מסוים', 'חלקא', 'קלות'],
    category: 'general',
    context: ['כמויות', 'מידות']
  },
  {
    primary: 'גדול מאוד',
    alternatives: ['ענקי', 'עצום', 'רחב ממדים', 'כביר'],
    category: 'general',
    context: ['תיאורים', 'גודל']
  },
  {
    primary: 'חשוב',
    alternatives: ['משמעותי', 'עיקרי', 'מרכזי', 'בעל חשיבות'],
    category: 'general',
    context: ['תיאורים', 'משמעות']
  },
  {
    primary: 'בעיה',
    alternatives: ['קושי', 'מצוקה', 'אתגר', 'מכשול'],
    category: 'general',
    context: ['תיאורים', 'אתגרים']
  },
  {
    primary: 'פתרון',
    alternatives: ['תרופה', 'מענה', 'היענות', 'תגובה'],
    category: 'general',
    context: ['תיאורים', 'מענה']
  },
  {
    primary: 'להתחיל',
    alternatives: ['לפתוח', 'לבצע', 'להתחיל ב', 'לצאת לדרך'],
    category: 'general',
    context: ['פעולות', 'התחלות']
  },
  {
    primary: 'לסיים',
    alternatives: ['להשלים', 'לסיים את', 'לחתום', 'להביא לסיום'],
    category: 'general',
    context: ['פעולות', 'סיומים']
  },
  {
    primary: 'מהר',
    alternatives: ['במהירות', 'מיידית', 'מיד', 'תכף'],
    category: 'general',
    context: ['זמן', 'מהירות']
  },
  {
    primary: 'לאט',
    alternatives: ['בהדרגה', 'באיטיות', 'בסבלנות', 'בצעד אט'],
    category: 'general',
    context: ['זמן', 'מהירות']
  }
]

/**
 * Get synonyms for a word based on context
 */
export function getSynonyms(word: string, context: string = '', category?: string): string[] {
  const groups = HEBREW_SYNONYMS.filter(group => {
    const matchesWord = group.primary === word || group.alternatives.includes(word)
    const matchesCategory = !category || group.category === category
    const matchesContext = !context || group.context.some(ctx => context.includes(ctx))
    
    return matchesWord && matchesCategory && matchesContext
  })
  
  if (groups.length === 0) return []
  
  // Return all synonyms from matching groups
  const allSynonyms = groups.flatMap(group => 
    [group.primary, ...group.alternatives]
  ).filter(synonym => synonym !== word)
  
  return Array.from(new Set(allSynonyms))
}

/**
 * Get all possible synonyms for a word
 */
export function getAllSynonyms(word: string): string[] {
  const synonyms = getSynonyms(word)
  const allSynonyms = new Set(synonyms)
  
  // Add synonyms of synonyms
  synonyms.forEach(synonym => {
    const subSynonyms = getSynonyms(synonym)
    subSynonyms.forEach(subSynonym => allSynonyms.add(subSynonym))
  })
  
  return Array.from(allSynonyms).filter(synonym => synonym !== word)
}

/**
 * Replace words in text with synonyms based on context
 */
export function replaceWithSynonyms(
  text: string, 
  replacementRate: number = 0.3,
  context: string = '',
  category?: string
): string {
  const words = text.split(/(\s+|[.,!?;:])/)
  const result: string[] = []
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    
    // Skip if it's punctuation or whitespace
    if (/^\s*$|[.,!?;:]/.test(word)) {
      result.push(word)
      continue
    }
    
    // Skip if random chance doesn't meet replacement rate
    if (Math.random() > replacementRate) {
      result.push(word)
      continue
    }
    
    const synonyms = getSynonyms(word, context, category)
    if (synonyms.length > 0) {
      const randomSynonym = synonyms[Math.floor(Math.random() * synonyms.length)]
      result.push(randomSynonym)
    } else {
      result.push(word)
    }
  }
  
  return result.join('')
}

/**
 * Generate multiple versions of text with different synonyms
 */
export function generateSynonymVersions(
  text: string, 
  count: number = 3,
  context: string = '',
  category?: string
): string[] {
  const versions: Set<string> = new Set()
  
  // Try to generate unique versions
  let attempts = 0
  const maxAttempts = count * 10 // Try up to 10 times per version
  
  while (versions.size < count && attempts < maxAttempts) {
    attempts++
    const replacementRate = 0.3 + (Math.random() * 0.3) // Varying replacement rates between 0.3-0.6
    const version = replaceWithSynonyms(text, replacementRate, context, category)
    
    // Only add if different from original and not already in versions
    if (version !== text && !versions.has(version)) {
      versions.add(version)
    }
  }
  
  // If we couldn't generate enough unique versions, add some even if duplicates
  const results = Array.from(versions)
  while (results.length < count) {
    const replacementRate = 0.3 + (Math.random() * 0.3)
    const version = replaceWithSynonyms(text, replacementRate, context, category)
    results.push(version)
  }
  
  return results.slice(0, count)
}

/**
 * Analyze text quality and suggest improvements
 */
export function analyzeTextQuality(text: string, context: string = ''): {
  score: number
  suggestions: Array<{
    word: string
    suggestion: string
    reason: string
  }>
} {
  const suggestions: Array<{
    word: string
    suggestion: string
    reason: string
  }> = []
  
  let score = 100
  
  // Check for repetitive words
  const words = text.split(/\s+/)
  const wordCount = new Map<string, number>()
  
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  })
  
  // Find repetitive words and suggest synonyms
  wordCount.forEach((count, word) => {
    if (count > 2 && word.length > 3) {
      const synonyms = getSynonyms(word, context)
      if (synonyms.length > 0) {
        suggestions.push({
          word,
          suggestion: synonyms[0],
          reason: `המילה "${word}" חוזרת ${count} פעמים`
        })
        score -= 5
      }
    }
  })
  
  // Check for informal words in formal context
  if (context.includes('רשמי') || context.includes('משפטי')) {
    const informalWords = ['טוב', 'רע', 'אני חושב', 'אני רוצה']
    informalWords.forEach(word => {
      if (text.includes(word)) {
        const synonyms = getSynonyms(word, context, 'formal')
        if (synonyms.length > 0) {
          suggestions.push({
            word,
            suggestion: synonyms[0],
            reason: 'מילה לא פורמלית בהקשר רשמי'
          })
          score -= 10
        }
      }
    })
  }
  
  return { score: Math.max(0, score), suggestions }
}
