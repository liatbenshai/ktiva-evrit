/**
 * מערכת לניתוח ו זיהוי עברית מתורגמת
 * Hebrew Translation Pattern Analyzer
 */

export interface TranslationIssue {
  type: 'word-order' | 'literal-translation' | 'anglicism' | 'grammar' | 'unnatural-phrasing';
  original: string;
  suggestion: string;
  confidence: number;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

export interface AnalysisResult {
  issues: TranslationIssue[];
  score: number; // 0-100, 100 = perfect Hebrew
  suggestions: string[];
}

/**
 * דפוסים נפוצים של עברית מתורגמת מאנגלית
 */
const COMMON_TRANSLATION_PATTERNS = [
  // Literal translations
  { pattern: /\bמהווה\b/g, suggestion: 'הוא/היא', explanation: 'שימוש מיותר במילה "מהווה"' },
  { pattern: /\bבמטרה\b/g, suggestion: 'כדי', explanation: 'במקום "במטרה" השתמש ב"כדי"' },
  { pattern: /\bבהתאם ל\b/g, suggestion: 'לפי', explanation: 'במקום "בהתאם ל" השתמש ב"לפי"' },
  { pattern: /\bמשמעותי\b/g, suggestion: 'חשוב/משמעותי', explanation: 'שימוש יתר במילה "משמעותי"' },
  { pattern: /\bעל מנת\b/g, suggestion: 'כדי', explanation: 'במקום "על מנת" השתמש ב"כדי"' },
  
  // Anglicisms
  { pattern: /\bאקטואלי\b/g, suggestion: 'נוכחי/עדכני', explanation: 'אקטואלי הוא אנגליזם' },
  { pattern: /\bרלוונטי\b/g, suggestion: 'רלוונטי/משמעותי', explanation: 'רלוונטי בסדר, אבל נסה גם חלופות' },
  { pattern: /\bפוטנציאלי\b/g, suggestion: 'אפשרי/עתידי', explanation: 'נסה להשתמש במילים עבריות' },
  { pattern: /\bקריטי\b/g, suggestion: 'חיוני/חשוב', explanation: 'קריטי הוא אנגליזם' },
  
  // Unnatural constructions
  { pattern: /\bיש לי\s+\w+\s+(ש|ה|מ)\b/g, suggestion: 'אני...', explanation: 'במקום "יש לי X ש..." נסה "אני X..."' },
  { pattern: /\bזה\s+(הוא|היא)\s+/g, suggestion: 'זה/זו', explanation: 'במקום "זה הוא" פשוט "זה"' },
  { pattern: /\bאנחנו\s+צריכים\s+ל/g, suggestion: 'עלינו ל/צריך ל', explanation: 'נסה צורה יותר קצרה' },
];

/**
 * מילים שמעידות על תרגום מאנגלית
 */
const ANGLICISM_INDICATORS = [
  'אקטואלי', 'קונקרטי', 'פוטנציאלי', 'קריטי', 'אופטימלי',
  'ריאליסטי', 'פרקטי', 'תיאורטי', 'אופרטיבי', 'אפקטיבי',
  'מהווה', 'בהתאם', 'במטרה', 'על מנת', 'באופן', 'בדרך',
  'משמעותי באופן', 'חשוב באופן', 'גדול באופן'
];

/**
 * ניתוח טקסט לזיהוי עברית מתורגמת
 */
export function analyzeHebrewText(text: string): AnalysisResult {
  const issues: TranslationIssue[] = [];
  let score = 100;

  // בדיקת דפוסים נפוצים
  for (const pattern of COMMON_TRANSLATION_PATTERNS) {
    let match;
    while ((match = pattern.pattern.exec(text)) !== null) {
      issues.push({
        type: 'literal-translation',
        original: match[0],
        suggestion: pattern.suggestion,
        confidence: 0.8,
        explanation: pattern.explanation,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
      score -= 5;
    }
  }

  // בדיקת אנגליציזמים
  const words = text.split(/\s+/);
  words.forEach((word, index) => {
    if (ANGLICISM_INDICATORS.some(indicator => word.includes(indicator))) {
      issues.push({
        type: 'anglicism',
        original: word,
        suggestion: 'נסה להשתמש במילה עברית יותר טבעית',
        confidence: 0.6,
        explanation: `המילה "${word}" היא אנגליציזם או מילה פורמלית מדי`,
        startIndex: text.indexOf(word),
        endIndex: text.indexOf(word) + word.length
      });
      score -= 3;
    }
  });

  // בדיקת סדר מילים לא טבעי
  const unnaturalPatterns = [
    /זה\s+הוא\s+/g,
    /זאת\s+היא\s+/g,
    /אלה\s+הם\s+/g,
  ];

  for (const pattern of unnaturalPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        type: 'word-order',
        original: match[0],
        suggestion: match[0].replace(/(הוא|היא|הם)\s+/, ''),
        confidence: 0.9,
        explanation: 'סדר מילים לא טבעי - מיותר להוסיף את המילה הנוספת',
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
      score -= 4;
    }
  }

  // חישוב ציון סופי
  score = Math.max(0, Math.min(100, score));

  // יצירת הצעות כלליות
  const suggestions = generateSuggestions(issues);

  return {
    issues,
    score,
    suggestions
  };
}

/**
 * יצירת הצעות שיפור כלליות
 */
function generateSuggestions(issues: TranslationIssue[]): string[] {
  const suggestions: string[] = [];
  
  const issueTypes = new Map<string, number>();
  issues.forEach(issue => {
    issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
  });

  if (issueTypes.get('anglicism') && issueTypes.get('anglicism')! > 2) {
    suggestions.push('📝 יש שימוש רב באנגליציזמים - נסה להחליף במילים עבריות טבעיות יותר');
  }

  if (issueTypes.get('literal-translation') && issueTypes.get('literal-translation')! > 2) {
    suggestions.push('🔄 הטקסט נראה כמו תרגום ישיר - נסה לכתוב בעברית טבעית יותר');
  }

  if (issueTypes.get('word-order') && issueTypes.get('word-order')! > 1) {
    suggestions.push('📐 סדר המילים לא טבעי - בעברית משתמשים בצורה יותר תמציתית');
  }

  if (suggestions.length === 0 && issues.length > 0) {
    suggestions.push('✅ הטקסט טוב, אבל אפשר לשפר כמה ביטויים');
  }

  if (issues.length === 0) {
    suggestions.push('🎉 מצוין! הטקסט בעברית טבעית ותקנית');
  }

  return suggestions;
}

/**
 * מציאת דפוסים בין טקסט מקורי למתוקן
 */
export function extractPatterns(original: string, corrected: string): Array<{
  from: string;
  to: string;
  type: string;
  confidence: number;
}> {
  const patterns: Array<{
    from: string;
    to: string;
    type: string;
    confidence: number;
  }> = [];

  // פיצול למילים
  const originalWords = original.split(/\s+/);
  const correctedWords = corrected.split(/\s+/);

  // זיהוי שינויים מילה-במילה
  const maxLength = Math.min(originalWords.length, correctedWords.length);
  for (let i = 0; i < maxLength; i++) {
    if (originalWords[i] !== correctedWords[i]) {
      patterns.push({
        from: originalWords[i],
        to: correctedWords[i],
        type: 'word-replacement',
        confidence: 0.8
      });
    }
  }

  // זיהוי דפוסי ביטויים (2-3 מילים)
  for (let i = 0; i < originalWords.length - 1; i++) {
    const twoWordPhrase = `${originalWords[i]} ${originalWords[i + 1]}`;
    const correctedPhrase = `${correctedWords[i]} ${correctedWords[i + 1]}`;
    
    if (twoWordPhrase !== correctedPhrase && correctedWords[i] && correctedWords[i + 1]) {
      patterns.push({
        from: twoWordPhrase,
        to: correctedPhrase,
        type: 'phrase-replacement',
        confidence: 0.9
      });
    }
  }

  return patterns;
}

/**
 * החלת תיקונים אוטומטיים על בסיס דפוסים שנלמדו
 */
export function applyLearnedPatterns(
  text: string, 
  learnedPatterns: Array<{ from: string; to: string; confidence: number }>
): { correctedText: string; appliedPatterns: Array<{ from: string; to: string }> } {
  let correctedText = text;
  const appliedPatterns: Array<{ from: string; to: string }> = [];

  // מיון לפי confidence ו-length (ארוכים יותר קודם)
  const sortedPatterns = learnedPatterns
    .filter(p => p.confidence >= 0.7) // רק דפוסים בטוחים
    .sort((a, b) => {
      const confDiff = b.confidence - a.confidence;
      if (Math.abs(confDiff) > 0.1) return confDiff;
      return b.from.length - a.from.length;
    });

  for (const pattern of sortedPatterns) {
    // בדיקה אם הדפוס קיים בטקסט
    if (correctedText.includes(pattern.from)) {
      correctedText = correctedText.replace(
        new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        pattern.to
      );
      appliedPatterns.push({
        from: pattern.from,
        to: pattern.to
      });
    }
  }

  return {
    correctedText,
    appliedPatterns
  };
}

