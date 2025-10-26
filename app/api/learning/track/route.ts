import { NextRequest, NextResponse } from 'next/server';

// בינתיים נשמור במשתנה גלובלי (בעתיד נעביר ל-DB)
let userEdits: Array<{
  documentType: string;
  originalText: string;
  editedText: string;
  editType: string;
  timestamp: Date;
}> = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentType, originalText, editedText, editType } = body;

    // שמירת העריכה
    userEdits.push({
      documentType,
      originalText,
      editedText,
      editType: editType || 'manual',
      timestamp: new Date(),
    });

    // ניתוח והחזרת תובנות
    const insights = analyzeUserEdits();

    return NextResponse.json({
      success: true,
      insights,
      totalEdits: userEdits.length,
    });
  } catch (error) {
    console.error('Error saving edit:', error);
    return NextResponse.json(
      { error: 'שגיאה בשמירת העריכה' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // החזרת כל הלמידה שנצברה
  const insights = analyzeUserEdits();
  
  return NextResponse.json({
    totalEdits: userEdits.length,
    insights,
    recentEdits: userEdits.slice(-10), // 10 אחרונות
  });
}

function analyzeUserEdits() {
  if (userEdits.length === 0) {
    return {
      forbiddenWords: [],
      preferredReplacements: {},
      patterns: [],
    };
  }

  // ניתוח פשוט של דפוסים
  const wordChanges: { [key: string]: { [key: string]: number } } = {};
  
  userEdits.forEach(edit => {
    const originalWords = edit.originalText.split(/\s+/);
    const editedWords = edit.editedText.split(/\s+/);
    
    for (let i = 0; i < Math.min(originalWords.length, editedWords.length); i++) {
      if (originalWords[i] !== editedWords[i]) {
        const from = originalWords[i].toLowerCase();
        const to = editedWords[i].toLowerCase();
        
        if (!wordChanges[from]) {
          wordChanges[from] = {};
        }
        wordChanges[from][to] = (wordChanges[from][to] || 0) + 1;
      }
    }
  });

  // מילים אסורות (שהוחלפו 3+ פעמים)
  const forbiddenWords: string[] = [];
  const preferredReplacements: { [key: string]: string } = {};
  
  Object.entries(wordChanges).forEach(([from, tos]) => {
    const totalChanges = Object.values(tos).reduce((a, b) => a + b, 0);
    
    if (totalChanges >= 3) {
      forbiddenWords.push(from);
      
      // מצא את התחליף הנפוץ ביותר
      const mostCommon = Object.entries(tos).reduce((a, b) => 
        b[1] > a[1] ? b : a
      );
      preferredReplacements[from] = mostCommon[0];
    }
  });

  return {
    forbiddenWords,
    preferredReplacements,
    patterns: [
      {
        description: `זוהו ${forbiddenWords.length} מילים שהמשתמש מעדיף להימנע מהן`,
        confidence: forbiddenWords.length > 0 ? 0.8 : 0,
      },
    ],
  };
}