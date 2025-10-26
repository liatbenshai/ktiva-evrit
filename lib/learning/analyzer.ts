// lib/learning/analyzer.ts

export function analyzeEdits(original: string, edited: string) {
    // פונקציה לניתוח ההבדלים בין הטקסט המקורי לערוך
    
    const originalWords = original.split(/\s+/);
    const editedWords = edited.split(/\s+/);
    
    const changes: { from: string; to: string }[] = [];
    
    // זיהוי פשוט של שינויים (בעתיד נשפר עם diff אלגוריתם)
    for (let i = 0; i < Math.min(originalWords.length, editedWords.length); i++) {
      if (originalWords[i] !== editedWords[i]) {
        changes.push({
          from: originalWords[i],
          to: editedWords[i],
        });
      }
    }
    
    return changes;
  }
  
  export function extractForbiddenWords(userEdits: Array<{ original: string; edited: string }>) {
    // זיהוי מילים שהמשתמש מוחק או מחליף באופן עקבי
    const wordReplacements: { [key: string]: string[] } = {};
    
    userEdits.forEach(edit => {
      const changes = analyzeEdits(edit.original, edit.edited);
      changes.forEach(change => {
        if (!wordReplacements[change.from]) {
          wordReplacements[change.from] = [];
        }
        wordReplacements[change.from].push(change.to);
      });
    });
    
    // מילים שהוחלפו 3+ פעמים נחשבות כ"אסורות"
    const forbidden: string[] = [];
    Object.entries(wordReplacements).forEach(([word, replacements]) => {
      if (replacements.length >= 3) {
        forbidden.push(word);
      }
    });
    
    return forbidden;
  }
  
  export function buildPreferredReplacements(userEdits: Array<{ original: string; edited: string }>) {
    // בניית מפת תחליפים מועדפים
    const replacements: { [key: string]: { word: string; count: number } } = {};
    
    userEdits.forEach(edit => {
      const changes = analyzeEdits(edit.original, edit.edited);
      changes.forEach(change => {
        const key = change.from.toLowerCase();
        if (!replacements[key]) {
          replacements[key] = { word: change.to, count: 0 };
        }
        replacements[key].count++;
      });
    });
    
    // רק תחליפים שחזרו 2+ פעמים
    const preferred: { [key: string]: string } = {};
    Object.entries(replacements).forEach(([from, data]) => {
      if (data.count >= 2) {
        preferred[from] = data.word;
      }
    });
    
    return preferred;
  }