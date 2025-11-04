/**
 * דפוסי AI נפוצים - רשימה מוכנה מראש לייבוא מהיר
 * Common AI Patterns - Pre-built list for quick import
 */

export interface PrebuiltPattern {
  badPattern: string;
  goodPattern: string;
  patternType: 'ai-style' | 'grammar' | 'style' | 'formality';
  confidence: number;
  category: string;
  explanation: string;
  examples?: string;
}

/**
 * 🤖 דפוסי AI נפוצים - ביטויים שנפוצים בטקסטים שנוצרו ע"י AI
 */
export const COMMON_AI_PATTERNS: PrebuiltPattern[] = [
  // ביטויים פורמליים מדי
  {
    badPattern: 'על מנת',
    goodPattern: 'כדי',
    patternType: 'ai-style',
    confidence: 0.95,
    category: 'פורמליות יתר',
    explanation: 'AI נוטה להשתמש בביטויים פורמליים מדי'
  },
  {
    badPattern: 'בהתאם ל',
    goodPattern: 'לפי',
    patternType: 'ai-style',
    confidence: 0.9,
    category: 'פורמליות יתר',
    explanation: '"בהתאם ל" הוא פורמלי מדי לעברית יומיומית'
  },
  {
    badPattern: 'במטרה',
    goodPattern: 'כדי',
    patternType: 'ai-style',
    confidence: 0.9,
    category: 'פורמליות יתר',
    explanation: '"במטרה" הוא ביטוי AI אופייני'
  },
  {
    badPattern: 'באופן',
    goodPattern: '',
    patternType: 'ai-style',
    confidence: 0.85,
    category: 'מילים מיותרות',
    explanation: '"באופן" לרוב מיותר - "באופן משמעותי" → "משמעותית"'
  },
  {
    badPattern: 'בדרך כלל',
    goodPattern: 'לרוב',
    patternType: 'ai-style',
    confidence: 0.8,
    category: 'פורמליות יתר',
    explanation: '"בדרך כלל" ארוך מדי - "לרוב" יותר טבעי'
  },
  
  // אנגליציזמים
  {
    badPattern: 'אקטואלי',
    goodPattern: 'עדכני',
    patternType: 'ai-style',
    confidence: 0.95,
    category: 'אנגליציזמים',
    explanation: '"אקטואלי" הוא אנגליציזם - נכון יותר "עדכני" או "נוכחי"'
  },
  {
    badPattern: 'פוטנציאלי',
    goodPattern: 'אפשרי',
    patternType: 'ai-style',
    confidence: 0.9,
    category: 'אנגליציזמים',
    explanation: 'השתמש ב"אפשרי" או "עתידי" במקום "פוטנציאלי"'
  },
  {
    badPattern: 'קריטי',
    goodPattern: 'חיוני',
    patternType: 'ai-style',
    confidence: 0.9,
    category: 'אנגליציזמים',
    explanation: '"קריטי" הוא אנגליציזם - נכון יותר "חיוני" או "קריטיקאי"'
  },
  {
    badPattern: 'אופטימלי',
    goodPattern: 'מיטבי',
    patternType: 'ai-style',
    confidence: 0.9,
    category: 'אנגליציזמים',
    explanation: 'השתמש ב"מיטבי" או "מושלם" במקום "אופטימלי"'
  },
  {
    badPattern: 'ריאליסטי',
    goodPattern: 'מציאותי',
    patternType: 'ai-style',
    confidence: 0.95,
    category: 'אנגליציזמים',
    explanation: 'המילה העברית הנכונה היא "מציאותי"'
  },
  {
    badPattern: 'פרקטי',
    goodPattern: 'מעשי',
    patternType: 'ai-style',
    confidence: 0.95,
    category: 'אנגליציזמים',
    explanation: 'השתמש ב"מעשי" במקום "פרקטי"'
  },
  {
    badPattern: 'אפקטיבי',
    goodPattern: 'יעיל',
    patternType: 'ai-style',
    confidence: 0.95,
    category: 'אנגליציזמים',
    explanation: 'המילה העברית היא "יעיל"'
  },
  
  // ביטויים מתורגמים מאנגלית
  {
    badPattern: 'להביא בחשבון',
    goodPattern: 'לקחת בחשבון',
    patternType: 'ai-style',
    confidence: 0.95,
    category: 'תרגום ישיר',
    explanation: 'בעברית אומרים "לקחת בחשבון" ולא "להביא"'
  },
  {
    badPattern: 'מהווה',
    goodPattern: 'הוא',
    patternType: 'ai-style',
    confidence: 0.85,
    category: 'תרגום ישיר',
    explanation: '"מהווה" הוא תרגום ישיר - "זה מהווה" → "זה הוא"'
  },
  {
    badPattern: 'בסוף היום',
    goodPattern: 'בסופו של דבר',
    patternType: 'ai-style',
    confidence: 0.95,
    category: 'תרגום ישיר',
    explanation: 'תרגום ישיר של "at the end of the day"'
  },
  {
    badPattern: 'לקחת את זה לשלב הבא',
    goodPattern: 'להתקדם',
    patternType: 'ai-style',
    confidence: 0.9,
    category: 'תרגום ישיר',
    explanation: 'ביטוי AI אופייני - נכון יותר "להתקדם" או "להמשיך"'
  },
  {
    badPattern: 'לתת ערך',
    goodPattern: 'להועיל',
    patternType: 'ai-style',
    confidence: 0.85,
    category: 'תרגום ישיר',
    explanation: '"לתת ערך" הוא תרגום ישיר - "להועיל" או "לתרום"'
  },
  
  // סדר מילים לא טבעי
  {
    badPattern: 'זה הוא',
    goodPattern: 'זה',
    patternType: 'grammar',
    confidence: 0.9,
    category: 'סדר מילים',
    explanation: 'מיותר להוסיף "הוא" - "זה הוא X" → "זה X"'
  },
  {
    badPattern: 'זאת היא',
    goodPattern: 'זאת',
    patternType: 'grammar',
    confidence: 0.9,
    category: 'סדר מילים',
    explanation: 'מיותר להוסיף "היא"'
  },
  {
    badPattern: 'אלה הם',
    goodPattern: 'אלה',
    patternType: 'grammar',
    confidence: 0.9,
    category: 'סדר מילים',
    explanation: 'מיותר להוסיף "הם"'
  },
  
  // ביטויי AI אופייניים
  {
    badPattern: 'אני רוצה להודות',
    goodPattern: 'תודה',
    patternType: 'ai-style',
    confidence: 0.85,
    category: 'ביטויי AI',
    explanation: 'AI נוטה לנפח - פשוט "תודה"'
  },
  {
    badPattern: 'אני מבקש ממך בבקשה',
    goodPattern: 'אני מבקש',
    patternType: 'ai-style',
    confidence: 0.9,
    category: 'ביטויי AI',
    explanation: 'כפילות מיותרת של "מבקש" ו"בקשה"'
  },
  {
    badPattern: 'אני אשמח מאוד',
    goodPattern: 'אשמח',
    patternType: 'ai-style',
    confidence: 0.8,
    category: 'ביטויי AI',
    explanation: '"מאוד" מיותר כאן'
  },
  {
    badPattern: 'בהתאם לבקשתך',
    goodPattern: 'כפי שביקשת',
    patternType: 'ai-style',
    confidence: 0.85,
    category: 'ביטויי AI',
    explanation: 'ביטוי פורמלי מדי - "כפי שביקשת" יותר טבעי'
  },
  {
    badPattern: 'אני פונה אליכם',
    goodPattern: 'אני פונה אליך',
    patternType: 'ai-style',
    confidence: 0.75,
    category: 'ביטויי AI',
    explanation: 'בהקשר אישי - "אליך" יותר מתאים'
  },
  
  // מילים מיותרות
  {
    badPattern: 'משמעותי באופן',
    goodPattern: 'משמעותית',
    patternType: 'style',
    confidence: 0.9,
    category: 'מילים מיותרות',
    explanation: '"באופן" מיותר - "משמעותי באופן X" → "משמעותית"'
  },
  {
    badPattern: 'חשוב באופן',
    goodPattern: 'חשוב מאוד',
    patternType: 'style',
    confidence: 0.85,
    category: 'מילים מיותרות',
    explanation: '"באופן" מיותר'
  },
  {
    badPattern: 'גדול באופן',
    goodPattern: 'גדול מאוד',
    patternType: 'style',
    confidence: 0.85,
    category: 'מילים מיותרות',
    explanation: '"באופן" מיותר'
  },
  
  // ביטויים נוספים
  {
    badPattern: 'יש לי',
    goodPattern: 'אני',
    patternType: 'style',
    confidence: 0.7,
    category: 'סגנון',
    explanation: 'לעתים "יש לי X" יכול להיות "אני X" - תלוי בהקשר'
  },
  {
    badPattern: 'אנחנו צריכים ל',
    goodPattern: 'עלינו ל',
    patternType: 'style',
    confidence: 0.7,
    category: 'סגנון',
    explanation: '"עלינו ל" יותר תמציתי'
  },
  {
    badPattern: 'להשפיע על באופן',
    goodPattern: 'להשפיע על',
    patternType: 'style',
    confidence: 0.85,
    category: 'מילים מיותרות',
    explanation: '"באופן" מיותר'
  },
  
  // ביטויים עסקיים AI
  {
    badPattern: 'לשפר את החוויה',
    goodPattern: 'לשפר את החוויה',
    patternType: 'ai-style',
    confidence: 0.6,
    category: 'ביטויי שיווק AI',
    explanation: 'ביטוי שיווקי - כדאי לבדוק אם הוא מתאים'
  },
  {
    badPattern: 'לספק פתרון',
    goodPattern: 'לפתור',
    patternType: 'ai-style',
    confidence: 0.75,
    category: 'ביטויי שיווק AI',
    explanation: '"לפתור" יותר ישיר - "לספק פתרון" → "לפתור"'
  },
  {
    badPattern: 'לקדם את',
    goodPattern: 'להתקדם ב',
    patternType: 'ai-style',
    confidence: 0.7,
    category: 'ביטויי שיווק AI',
    explanation: 'תלוי בהקשר - בדוק אם מתאים'
  },
  
  // כפילויות
  {
    badPattern: 'מאוד מאוד',
    goodPattern: 'מאוד',
    patternType: 'style',
    confidence: 0.95,
    category: 'כפילויות',
    explanation: 'AI לפעמים חוזר על מילים - מספיק "מאוד" אחת'
  },
  {
    badPattern: 'גם כן',
    goodPattern: 'גם',
    patternType: 'style',
    confidence: 0.85,
    category: 'כפילויות',
    explanation: 'בדרך כלל "גם" מספיק'
  },
  
  // דפוסי דקדוק
  {
    badPattern: 'אני אהבה',
    goodPattern: 'אני אוהב/ת',
    patternType: 'grammar',
    confidence: 0.95,
    category: 'דקדוק',
    explanation: 'טעות דקדוקית נפוצה ב-AI - "אהבה" היא שם עצם'
  },
  {
    badPattern: 'הוא צריכה',
    goodPattern: 'הוא צריך',
    patternType: 'grammar',
    confidence: 0.95,
    category: 'דקדוק',
    explanation: 'בעיה בהתאמת מגדר'
  },
  {
    badPattern: 'היא צריך',
    goodPattern: 'היא צריכה',
    patternType: 'grammar',
    confidence: 0.95,
    category: 'דקדוק',
    explanation: 'בעיה בהתאמת מגדר'
  },
  
  // דפוסים נוספים
  {
    badPattern: 'בצורה משמעותית',
    goodPattern: 'משמעותית',
    patternType: 'style',
    confidence: 0.8,
    category: 'מילים מיותרות',
    explanation: '"בצורה" מיותר'
  },
  {
    badPattern: 'בצורה יעילה',
    goodPattern: 'ביעילות',
    patternType: 'style',
    confidence: 0.8,
    category: 'מילים מיותרות',
    explanation: 'יותר תמציתי: "ביעילות"'
  },
  {
    badPattern: 'בצורה מהירה',
    goodPattern: 'במהירות',
    patternType: 'style',
    confidence: 0.8,
    category: 'מילים מיותרות',
    explanation: 'יותר תמציתי: "במהירות"'
  },
  {
    badPattern: 'להיות מסוגל',
    goodPattern: 'יכול',
    patternType: 'style',
    confidence: 0.85,
    category: 'פורמליות יתר',
    explanation: '"יכול" יותר טבעי - "להיות מסוגל" → "יכול"'
  },
  {
    badPattern: 'לבצע פעולה',
    goodPattern: 'לפעול',
    patternType: 'style',
    confidence: 0.8,
    category: 'פורמליות יתר',
    explanation: '"לפעול" יותר תמציתי'
  },
  
  // ביטויים פורמליים נוספים
  {
    badPattern: 'במידה ו',
    goodPattern: 'אם',
    patternType: 'formality',
    confidence: 0.9,
    category: 'פורמליות יתר',
    explanation: '"אם" יותר פשוט וישיר'
  },
  {
    badPattern: 'ככל ש',
    goodPattern: 'ככל ש',
    patternType: 'formality',
    confidence: 0.6,
    category: 'פורמליות',
    explanation: 'ביטוי תקני - כדאי לבדוק אם מתאים להקשר'
  },
  {
    badPattern: 'בעקבות',
    goodPattern: 'בגלל',
    patternType: 'formality',
    confidence: 0.75,
    category: 'פורמליות יתר',
    explanation: 'תלוי בהקשר - "בגלל" יותר פשוט'
  },
  {
    badPattern: 'לאור העובדה',
    goodPattern: 'מכיוון ש',
    patternType: 'formality',
    confidence: 0.85,
    category: 'פורמליות יתר',
    explanation: '"מכיוון ש" פשוט יותר'
  },
  {
    badPattern: 'בנוסף לכך',
    goodPattern: 'בנוסף',
    patternType: 'style',
    confidence: 0.8,
    category: 'מילים מיותרות',
    explanation: '"לכך" מיותר - "בנוסף" מספיק'
  },
  {
    badPattern: 'יתרה מכך',
    goodPattern: 'יתר על כן',
    patternType: 'style',
    confidence: 0.75,
    category: 'ביטויים',
    explanation: 'הביטוי הנכון הוא "יתר על כן" או "יתרה מזאת"'
  }
];

/**
 * קטגוריות דפוסים לסינון והצגה
 */
export const PATTERN_CATEGORIES = [
  'פורמליות יתר',
  'אנגליציזמים',
  'תרגום ישיר',
  'סדר מילים',
  'ביטויי AI',
  'מילים מיותרות',
  'סגנון',
  'ביטויי שיווק AI',
  'כפילויות',
  'דקדוק',
  'פורמליות',
  'ביטויים'
] as const;

/**
 * ספירת דפוסים לפי קטגוריה
 */
export function getPatternsByCategory() {
  const byCategory: Record<string, PrebuiltPattern[]> = {};
  
  COMMON_AI_PATTERNS.forEach(pattern => {
    if (!byCategory[pattern.category]) {
      byCategory[pattern.category] = [];
    }
    byCategory[pattern.category].push(pattern);
  });
  
  return byCategory;
}

/**
 * קבלת דפוסים בעלי confidence גבוה
 */
export function getHighConfidencePatterns(minConfidence = 0.85) {
  return COMMON_AI_PATTERNS.filter(p => p.confidence >= minConfidence);
}

/**
 * המרה לפורמט שמתאים למסד הנתונים
 */
export function convertToDBFormat(userId: string = 'default-user') {
  return COMMON_AI_PATTERNS.map(pattern => ({
    userId,
    badPattern: pattern.badPattern,
    goodPattern: pattern.goodPattern,
    patternType: pattern.patternType,
    confidence: pattern.confidence,
    occurrences: 1,
    context: pattern.category,
    examples: JSON.stringify([{
      explanation: pattern.explanation
    }])
  }));
}

