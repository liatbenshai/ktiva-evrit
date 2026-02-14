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
 * מאגר מילים וביטויים להימנעות - דפוסי AI נפוצים
 * מילים וביטויים שצריך להימנע מהם כי הם לא עברית טבעית
 */
export const FORBIDDEN_AI_PATTERNS = [
  // ביטויים מתורגמים מאנגלית
  { pattern: /\bלהביא בחשבון\b/g, suggestion: 'לקחת בחשבון', explanation: '"להביא בחשבון" הוא תרגום ישיר מאנגלית - השתמש ב"לקחת בחשבון"' },
  { pattern: /\bמהווה\b/g, suggestion: 'הוא/היא/זה', explanation: '"מהווה" הוא תרגום ישיר - נסה להימנע ממנו' },
  { pattern: /\bבמטרה\b/g, suggestion: 'כדי', explanation: '"במטרה" הוא פורמלי מדי - השתמש ב"כדי"' },
  { pattern: /\bבהתאם ל\b/g, suggestion: 'לפי', explanation: '"בהתאם ל" הוא פורמלי מדי - השתמש ב"לפי"' },
  { pattern: /\bעל מנת\b/g, suggestion: 'כדי', explanation: '"על מנת" הוא פורמלי מדי - השתמש ב"כדי"' },
  { pattern: /\bבסוף היום\b/g, suggestion: 'בסופו של דבר', explanation: '"בסוף היום" הוא תרגום ישיר מאנגלית' },
  { pattern: /\bבסוף של היום\b/g, suggestion: 'בסופו של דבר', explanation: '"בסוף של היום" הוא תרגום ישיר מאנגלית' },
  { pattern: /\bלקחת את זה לשלב הבא\b/g, suggestion: 'להתקדם/להמשיך', explanation: '"לקחת את זה לשלב הבא" הוא תרגום ישיר מאנגלית' },
  { pattern: /\bלעבור לשלב הבא\b/g, suggestion: 'להתקדם', explanation: '"לעבור לשלב הבא" הוא תרגום ישיר מאנגלית - השתמש ב"להתקדם"' },
  { pattern: /\bלתת ערך\b/g, suggestion: 'להעניק/להועיל', explanation: '"לתת ערך" הוא תרגום ישיר מאנגלית' },
  { pattern: /\bלהשפיע על\b\s+\w+\s+\bבאופן\b/g, suggestion: 'להשפיע על', explanation: '"באופן" הוא מיותר - פשוט "להשפיע על"' },
  { pattern: /\bמשמעותי\b/g, suggestion: 'חשוב', explanation: '"משמעותי" הוא פורמלי מדי - נסה "חשוב"' },
  { pattern: /\bבאופן\b/g, suggestion: 'כך/ככה', explanation: '"באופן" הוא פורמלי מדי - נסה "כך" או "ככה"' },
  { pattern: /\bבדרך\b\s+\w+\s+\bשל\b/g, suggestion: 'בצורה של', explanation: '"בדרך של" הוא לא טבעי - נסה "בצורה של"' },
  
  // ביטויי AI נפוצים
  { pattern: /\bאני רוצה להודות\b/g, suggestion: 'תודה', explanation: 'במקום "אני רוצה להודות" פשוט "תודה"' },
  { pattern: /\bאני רוצה להודות לך\b/g, suggestion: 'תודה', explanation: 'במקום "אני רוצה להודות לך" פשוט "תודה"' },
  { pattern: /\bאני מבקש ממך בבקשה\b/g, suggestion: 'אני מבקש', explanation: 'מיותר לכתוב "מבקש" ו"בקשה" יחד' },
  { pattern: /\bאני אשמח מאוד\b/g, suggestion: 'אשמח', explanation: '"מאוד" הוא מיותר כאן' },
  { pattern: /\bבהתאם לבקשתך\b/g, suggestion: 'כפי שביקשת', explanation: '"בהתאם לבקשתך" הוא פורמלי מדי' },
  { pattern: /\bאני פונה אליכם\b/g, suggestion: 'אני פונה אליך/אליך', explanation: '"אליכם" יכול להיות "אליך" אם מדובר באדם אחד' },
  
  // דפוסים חדשים מהטקסטים ששתמשת נתנה
  { pattern: /\bבמקום של\b/g, suggestion: 'במקום', explanation: '"במקום של" הוא תרגום ישיר מאנגלית - השתמש ב"במקום"' },
  { pattern: /\bזה חשוב מאוד מאוד מאוד\b/g, suggestion: 'זה חשוב מאוד', explanation: 'חזרה מיותרת על "מאוד" - מספיק פעם אחת' },
  { pattern: /\bזה חשוב מאוד מאוד\b/g, suggestion: 'זה חשוב מאוד', explanation: 'חזרה מיותרת על "מאוד" - מספיק פעם אחת' },
  { pattern: /\bאני אהבה\b/g, suggestion: 'אני אוהב/ת', explanation: '"אני אהבה" הוא שגיאת דקדוק - צריך "אני אוהב" או "אני אוהבת"' },
  { pattern: /\bבנוסף לכך, אני רוצה להוסיף\b/g, suggestion: 'בנוסף', explanation: '"בנוסף לכך, אני רוצה להוסיף" הוא מסורבל מדי - פשוט "בנוסף"' },
  { pattern: /\bזה טוב רעיון\b/g, suggestion: 'זה רעיון טוב', explanation: 'סדר מילים לא נכון - צריך "זה רעיון טוב"' },
  { pattern: /\bביחס ל-?\b/g, suggestion: 'לגבי', explanation: '"ביחס ל" הוא פורמלי מדי - נסה "לגבי"' },
  { pattern: /\bזה יכול להיות שזה\b/g, suggestion: 'זה יכול להיות', explanation: '"זה יכול להיות שזה" הוא מסורבל - פשוט "זה יכול להיות"' },
  { pattern: /\bאני רוצה לומר\b/g, suggestion: 'אני אומר', explanation: '"אני רוצה לומר" הוא מסורבל - פשוט "אני אומר"' },
  { pattern: /\bאני רוצה להוסיף\b/g, suggestion: 'אני מוסיף', explanation: '"אני רוצה להוסיף" הוא מסורבל - פשוט "אני מוסיף"' },
  { pattern: /\bהמטרה שלי היא לעשות\b/g, suggestion: 'אני רוצה לעשות', explanation: '"המטרה שלי היא לעשות" הוא מסורבל - פשוט "אני רוצה לעשות"' },
  { pattern: /\bאני מסכים איתך לגמרי על\b/g, suggestion: 'אני מסכים איתך על', explanation: '"לגמרי" הוא מיותר כאן' },
  { pattern: /\bאם זה אפשרי\b/g, suggestion: 'אם אפשר', explanation: '"אם זה אפשרי" הוא מסורבל - פשוט "אם אפשר"' },
  { pattern: /\bלפני שאני עושה החלטה\b/g, suggestion: 'לפני שאני מחליט', explanation: '"עושה החלטה" הוא לא נכון - צריך "מחליט"' },
  
  // אנגליציזמים
  { pattern: /\bאקטואלי\b/g, suggestion: 'נוכחי/עדכני', explanation: '"אקטואלי" הוא אנגליזם' },
  { pattern: /\bפוטנציאלי\b/g, suggestion: 'אפשרי/עתידי', explanation: '"פוטנציאלי" הוא אנגליזם' },
  { pattern: /\bקריטי\b/g, suggestion: 'חיוני/חשוב', explanation: '"קריטי" הוא אנגליזם' },
  { pattern: /\bאופטימלי\b/g, suggestion: 'מיטבי/מושלם', explanation: '"אופטימלי" הוא אנגליזם' },
  { pattern: /\bריאליסטי\b/g, suggestion: 'מציאותי', explanation: '"ריאליסטי" הוא אנגליזם' },
  { pattern: /\bפרקטי\b/g, suggestion: 'מעשי', explanation: '"פרקטי" הוא אנגליזם' },
  { pattern: /\bאופרטיבי\b/g, suggestion: 'מבצעי', explanation: '"אופרטיבי" הוא אנגליזם' },
  { pattern: /\bאפקטיבי\b/g, suggestion: 'יעיל', explanation: '"אפקטיבי" הוא אנגליזם' },
];

/**
 * דפוסים נפוצים של עברית מתורגמת מאנגלית
 */
const COMMON_TRANSLATION_PATTERNS = [
  ...FORBIDDEN_AI_PATTERNS,
  
  // Unnatural constructions
  { pattern: /\bיש לי\s+\w+\s+(ש|ה|מ)\b/g, suggestion: 'אני...', explanation: 'במקום "יש לי X ש..." נסה "אני X..."' },
  { pattern: /\bזה\s+(הוא|היא)\s+/g, suggestion: 'זה/זו', explanation: 'במקום "זה הוא" פשוט "זה"' },
  { pattern: /\bאנחנו\s+צריכים\s+ל/g, suggestion: 'עלינו ל/צריך ל', explanation: 'נסה צורה יותר קצרה' },
];

/**
 * מילים שמעידות על תרגום מאנגלית או טקסט AI
 */
const ANGLICISM_INDICATORS = [
  'אקטואלי', 'קונקרטי', 'פוטנציאלי', 'קריטי', 'אופטימלי',
  'ריאליסטי', 'פרקטי', 'תיאורטי', 'אופרטיבי', 'אפקטיבי',
  'מהווה', 'בהתאם', 'במטרה', 'על מנת', 'באופן', 'בדרך',
  'משמעותי באופן', 'חשוב באופן', 'גדול באופן',
  'להביא בחשבון', 'בסוף היום', 'לתת ערך', 'לקחת לשלב הבא'
];

/**
 * ניקוי טקסט עבור התאמת דפוסים תוך שמירת מיפוי לאינדקסים המקוריים
 */
const HEBREW_NIKKUD_REGEX = /[\u0591-\u05C7]/;
const PUNCTUATION_TO_SPACE_REGEX = /[.,!?;:"“”'׳״()\[\]{}<>/\\\-–—]/;

interface NormalizedText {
  normalized: string;
  map: number[];
}

function normalizeTextForAnalysis(text: string): NormalizedText {
  const intermediateChars: string[] = [];
  const intermediateMap: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (HEBREW_NIKKUD_REGEX.test(char)) {
      continue;
    }

    let normalizedChar = char;

    if (/\s/.test(char)) {
      normalizedChar = ' ';
    } else if (PUNCTUATION_TO_SPACE_REGEX.test(char)) {
      normalizedChar = ' ';
    }

    // אין לנו אותיות גדולות בעברית, אבל נשמור על אחידות באותיות לטיניות שנשארו
    normalizedChar = normalizedChar.toLowerCase();

    intermediateChars.push(normalizedChar);
    intermediateMap.push(i);
  }

  // איחוד רווחים רצופים כדי לשמור על התאמות מדויקות
  const normalizedChars: string[] = [];
  const normalizedMap: number[] = [];
  let lastWasSpace = false;

  intermediateChars.forEach((char, index) => {
    if (char === ' ') {
      if (lastWasSpace) {
        return;
      }
      lastWasSpace = true;
    } else {
      lastWasSpace = false;
    }

    normalizedChars.push(char);
    normalizedMap.push(intermediateMap[index]);
  });

  return {
    normalized: normalizedChars.join(''),
    map: normalizedMap,
  };
}

/**
 * יצירת regex עם דגל global בטוח לשימוש בלולאות
 */
function createGlobalRegex(pattern: RegExp): RegExp {
  let flags = pattern.flags;
  if (!flags.includes('g')) {
    flags += 'g';
  }
  if (!flags.includes('u')) {
    flags += 'u';
  }
  const boundarySnippet = '(?:(?<=^|[^\\p{L}\\p{N}_])(?=[\\p{L}\\p{N}_])|(?<=[\\p{L}\\p{N}_])(?=$|[^\\p{L}\\p{N}_]))';
  const source = pattern.source.replace(/\\b/g, boundarySnippet);
  return new RegExp(source, flags);
}

/**
 * רישום issue תוך מניעת כפילויות
 */
function registerIssue(
  issues: TranslationIssue[],
  seenIssues: Set<string>,
  issue: TranslationIssue
): boolean {
  const key = `${issue.startIndex}-${issue.endIndex}-${issue.original.toLowerCase()}`;
  if (seenIssues.has(key)) {
    return false;
  }
  seenIssues.add(key);
  issues.push(issue);
  return true;
}

/**
 * ניתוח טקסט לזיהוי עברית מתורגמת
 */
export function analyzeHebrewText(text: string): AnalysisResult {
  const issues: TranslationIssue[] = [];
  let score = 100;
  let aiPatternCount = 0; // ספירת דפוסי AI
  const seenIssues = new Set<string>();
  const normalizedText = normalizeTextForAnalysis(text);

  // בדיקת דפוסים נפוצים (כולל דפוסי AI)
  for (const pattern of COMMON_TRANSLATION_PATTERNS) {
    const originalRegex = createGlobalRegex(pattern.pattern);
    let match: RegExpExecArray | null;

    while ((match = originalRegex.exec(text)) !== null) {
      const didRegister = registerIssue(issues, seenIssues, {
        type: 'literal-translation',
        original: match[0],
        suggestion: pattern.suggestion,
        confidence: 0.8,
        explanation: pattern.explanation,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });

      if (didRegister) {
        score -= 8;
        aiPatternCount++;
      }
    }

    // ניסיון נוסף על טקסט מנורמל כדי לתפוס וריאציות עם פיסוק/ניקוד
    const normalizedRegex = createGlobalRegex(pattern.pattern);
    while ((match = normalizedRegex.exec(normalizedText.normalized)) !== null) {
      const normalizedStart = normalizedText.map[match.index];
      const normalizedEndIndex = normalizedText.map[match.index + match[0].length - 1];

      if (normalizedStart === undefined || normalizedEndIndex === undefined) {
        continue;
      }

      const startIndex = normalizedStart;
      const endIndex = normalizedEndIndex + 1;

      const didRegister = registerIssue(issues, seenIssues, {
        type: 'literal-translation',
        original: text.slice(startIndex, endIndex),
        suggestion: pattern.suggestion,
        confidence: 0.75,
        explanation: pattern.explanation,
        startIndex,
        endIndex
      });

      if (didRegister) {
        score -= 7;
        aiPatternCount++;
      }
    }
  }
  
  // אם יש יותר מ-3 דפוסי AI - זה טקסט AI מובהק
  if (aiPatternCount >= 3) {
    score -= 20; // הורדה נוספת משמעותית
    issues.push({
      type: 'unnatural-phrasing',
      original: '',
      suggestion: 'הטקסט מכיל דפוסי AI רבים - נדרש שיפור משמעותי',
      confidence: 0.9,
      explanation: `זוהו ${aiPatternCount} דפוסי AI בטקסט - הטקסט נראה כמו תרגום או כתיבה של AI`,
      startIndex: 0,
      endIndex: 0
    });
  }

  // בדיקת אנגליציזמים
  const normalizedWordRegex = /\S+/g;
  let normalizedWordMatch: RegExpExecArray | null;
  while ((normalizedWordMatch = normalizedWordRegex.exec(normalizedText.normalized)) !== null) {
    const word = normalizedWordMatch[0];

    // תיקון: בדיקה מדויקת - המילה חייבת להיות שווה לאינדיקטור, לא רק להכיל אותו
    if (!ANGLICISM_INDICATORS.some(indicator => word === indicator || (indicator.includes(' ') && normalizedText.normalized.substring(normalizedWordMatch!.index).startsWith(indicator)))) {
      continue;
    }

    const normalizedIndex = normalizedWordMatch.index;
    const startIndex = normalizedText.map[normalizedIndex];
    const endIndexCandidate = normalizedText.map[normalizedIndex + word.length - 1];

    if (startIndex === undefined || endIndexCandidate === undefined) {
      continue;
    }

    const endIndex = endIndexCandidate + 1;

    const didRegister = registerIssue(issues, seenIssues, {
      type: 'anglicism',
      original: text.slice(startIndex, endIndex),
      suggestion: 'נסה להשתמש במילה עברית יותר טבעית',
      confidence: 0.6,
      explanation: `המילה "${word}" היא אנגליציזם או מילה פורמלית מדי`,
      startIndex,
      endIndex
    });
    if (didRegister) {
      score -= 3;
    }
  }

  // בדיקת סדר מילים לא טבעי
  const unnaturalPatterns = [
    /זה\s+הוא\s+/g,
    /זאת\s+היא\s+/g,
    /אלה\s+הם\s+/g,
  ];

  for (const pattern of unnaturalPatterns) {
    let match;
    const regex = createGlobalRegex(pattern);
    while ((match = regex.exec(text)) !== null) {
      const didRegister = registerIssue(issues, seenIssues, {
        type: 'word-order',
        original: match[0],
        suggestion: match[0].replace(/(הוא|היא|הם)\s+/, ''),
        confidence: 0.9,
        explanation: 'סדר מילים לא טבעי - מיותר להוסיף את המילה הנוספת',
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
      if (didRegister) {
        score -= 4;
      }
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
 * משתמש באלגוריתם diff פשוט שמזהה גם ביטויים של מספר מילים
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
  const seen = new Set<string>();

  const originalWords = original.split(/\s+/).filter(w => w.length > 0);
  const correctedWords = corrected.split(/\s+/).filter(w => w.length > 0);

  // זיהוי שינויים מילה-במילה
  const maxLength = Math.min(originalWords.length, correctedWords.length);
  for (let i = 0; i < maxLength; i++) {
    if (originalWords[i] !== correctedWords[i]) {
      const key = `${originalWords[i]}→${correctedWords[i]}`;
      if (!seen.has(key)) {
        seen.add(key);
        patterns.push({
          from: originalWords[i],
          to: correctedWords[i],
          type: 'word-replacement',
          confidence: 0.8
        });
      }
    }
  }

  // זיהוי דפוסי ביטויים (2 מילים)
  for (let i = 0; i < maxLength - 1; i++) {
    if (correctedWords[i] === undefined || correctedWords[i + 1] === undefined) continue;
    const twoWordOriginal = `${originalWords[i]} ${originalWords[i + 1]}`;
    const twoWordCorrected = `${correctedWords[i]} ${correctedWords[i + 1]}`;

    if (twoWordOriginal !== twoWordCorrected) {
      const key = `${twoWordOriginal}→${twoWordCorrected}`;
      if (!seen.has(key)) {
        seen.add(key);
        patterns.push({
          from: twoWordOriginal,
          to: twoWordCorrected,
          type: 'phrase-replacement',
          confidence: 0.85
        });
      }
    }
  }

  // זיהוי דפוסי ביטויים (3 מילים)
  for (let i = 0; i < maxLength - 2; i++) {
    if (correctedWords[i] === undefined || correctedWords[i + 1] === undefined || correctedWords[i + 2] === undefined) continue;
    const threeWordOriginal = `${originalWords[i]} ${originalWords[i + 1]} ${originalWords[i + 2]}`;
    const threeWordCorrected = `${correctedWords[i]} ${correctedWords[i + 1]} ${correctedWords[i + 2]}`;

    if (threeWordOriginal !== threeWordCorrected) {
      const key = `${threeWordOriginal}→${threeWordCorrected}`;
      if (!seen.has(key)) {
        seen.add(key);
        patterns.push({
          from: threeWordOriginal,
          to: threeWordCorrected,
          type: 'phrase-replacement',
          confidence: 0.9
        });
      }
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

  // מיון: ארוכים קודם (כדי שלא יוחלפו חלקי ביטויים), אז לפי confidence
  const sortedPatterns = learnedPatterns
    .filter(p => p.confidence >= 0.7 && p.from !== p.to) // רק דפוסים בטוחים, ולא דפוסים שזהים לעצמם
    .sort((a, b) => {
      const lenDiff = b.from.length - a.from.length;
      if (lenDiff !== 0) return lenDiff; // ארוכים קודם - קריטי
      return b.confidence - a.confidence;
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

