import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';

/**
 * POST - ניתוח קוד והצעת תיקונים
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const code = formData.get('code') as string | null;

    let codeContent = '';
    let fileName = '';
    let fileExtension = '';

    // אם יש קובץ, קרא אותו
    if (file) {
      fileName = file.name;
      fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      
      // בדוק אם זה סוג קובץ קוד נתמך
      const supportedExtensions = [
        'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs',
        'php', 'rb', 'swift', 'kt', 'html', 'css', 'scss', 'json', 'xml',
        'yaml', 'yml', 'md', 'sql', 'sh', 'bash', 'ps1', 'vue', 'svelte'
      ];

      if (!supportedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { error: `סוג קובץ לא נתמך. נא להעלות קובץ קוד (${supportedExtensions.join(', ')})` },
          { status: 400 }
        );
      }

      // קרא את תוכן הקובץ
      codeContent = await file.text();
    } else if (code) {
      // אם יש קוד ישירות, השתמש בו
      codeContent = code;
      fileName = 'code.txt';
    } else {
      return NextResponse.json(
        { error: 'נא להעלות קובץ קוד או להזין קוד ישירות' },
        { status: 400 }
      );
    }

    if (!codeContent || !codeContent.trim()) {
      return NextResponse.json(
        { error: 'הקוד ריק או לא תקין' },
        { status: 400 }
      );
    }

    // הגדר system prompt מקצועי לניתוח קוד
    const systemPrompt = `אתה מומחה קוד מנוסה. תפקידך לנתח קוד, לזהות בעיות, ולהציע תיקונים מקצועיים.

הנחיות חשובות:
1. זהה בעיות אמיתיות בלבד - אל תמציא בעיות שלא קיימות
2. התמקד בבעיות משמעותיות: באגים, בעיות ביצועים, בעיות אבטחה, best practices
3. הצע תיקונים מעשיים ומדויקים
4. הסבר כל בעיה בצורה ברורה
5. דרג בעיות לפי חומרה (קריטי, גבוה, בינוני, נמוך)
6. אם הקוד תקין, ציין זאת בבירור

פורמט התשובה:
- רשימת בעיות עם הסבר, מיקום בקוד, חומרה, ותיקון מוצע
- סיכום כללי
- המלצות לשיפור`;

    // בנה prompt לניתוח
    const languageName = getLanguageName(fileExtension);
    const prompt = `נא לנתח את הקוד הבא (${languageName}${fileName ? ` - ${fileName}` : ''}):

\`\`\`${fileExtension}
${codeContent}
\`\`\`

בצע ניתוח מקצועי:
1. זהה בעיות אמיתיות (באגים, בעיות ביצועים, אבטחה, best practices)
2. לכל בעיה - ציין מיקום בקוד (שורה/פונקציה), חומרה, הסבר, ותיקון מוצע
3. אם הקוד תקין - ציין זאת בבירור
4. תן סיכום כללי והמלצות לשיפור

**חשוב מאוד:** החזר רק את אובייקט ה-JSON בלבד, ללא markdown, ללא backticks, ללא טקסט הסבר. 
התשובה שלך צריכה להתחיל ב-{ ולהסתיים ב-}

פורמט JSON מדויק:
{
  "hasIssues": true,
  "summary": "סיכום כללי",
  "issues": [
    {
      "severity": "critical",
      "type": "bug",
      "location": "שורה 5, פונקציה calculateSum",
      "description": "תיאור הבעיה",
      "code": "הקוד הבעייתי",
      "fix": "הקוד המתוקן",
      "explanation": "הסבר מפורט"
    }
  ],
  "recommendations": ["המלצה 1", "המלצה 2"],
  "overallScore": 75
}

זכור: 
- החזר רק JSON תקין וטהור
- אל תעטוף את ה-JSON בסימני קוד או בכל דבר אחר
- אם אין בעיות, hasIssues צריך להיות false ו-issues צריך להיות רשימה ריקה`;

    // קריאה ל-Claude AI
    const analysisText = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 8192,
      temperature: 0.3, // טמפרטורה נמוכה לניתוח מדויק
    });

    // נסה לפרסר את התשובה כ-JSON
    let analysis;
    try {
      // נקה את התשובה מ-markdown code blocks אם יש
      let cleanedText = analysisText.trim();
      
      // הסר markdown code blocks אם יש
      if (cleanedText.startsWith('```')) {
        const lines = cleanedText.split('\n');
        const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
        const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().startsWith('```'));
        if (startIndex !== -1 && endIndex !== -1) {
          cleanedText = lines.slice(startIndex + 1, endIndex).join('\n');
        }
      }
      
      // מצא את ה-JSON (מתחיל ב-{ ומסתיים ב-})
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }
      
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      // אם לא JSON, נסה לחלץ מידע מהטקסט
      console.warn('Failed to parse JSON response:', parseError);
      console.warn('Raw response:', analysisText.substring(0, 500));
      analysis = {
        hasIssues: true,
        summary: analysisText.substring(0, 500) + (analysisText.length > 500 ? '...' : ''),
        issues: [],
        recommendations: [],
        overallScore: 50,
        rawResponse: analysisText,
      };
    }

    return NextResponse.json({
      success: true,
      fileName: fileName || 'code',
      language: languageName,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing code:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בניתוח הקוד' },
      { status: 500 }
    );
  }
}

/**
 * מחזיר שם שפה לפי extension
 */
function getLanguageName(extension: string): string {
  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'JavaScript (React)',
    'ts': 'TypeScript',
    'tsx': 'TypeScript (React)',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'go': 'Go',
    'rs': 'Rust',
    'php': 'PHP',
    'rb': 'Ruby',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'md': 'Markdown',
    'sql': 'SQL',
    'sh': 'Shell Script',
    'bash': 'Bash',
    'ps1': 'PowerShell',
    'vue': 'Vue',
    'svelte': 'Svelte',
  };

  return languageMap[extension] || extension.toUpperCase();
}

