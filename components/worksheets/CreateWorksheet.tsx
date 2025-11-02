'use client';

import { useState } from 'react';
import { FileText, Loader2, Printer, Copy, Check } from 'lucide-react';

export default function CreateWorksheet() {
  const [instruction, setInstruction] = useState('');
  const [story, setStory] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      alert('נא להזין הוראה ליצירת דף העבודה');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'worksheet',
          data: {
            instruction,
            story: story.trim() || undefined,
            grade: grade.trim() || undefined,
            subject: subject.trim() || undefined,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: generatedWorksheet } = await response.json();
      setResult(generatedWorksheet);
    } catch (error) {
      alert('אירעה שגיאה ביצירת דף העבודה');
    } finally {
      setIsGenerating(false);
    }
  };

  // פונקציה להמרת markdown בסיסי לטקסט נקי
  const cleanMarkdown = (text: string): string => {
    return text
      // הסרת תגי HTML - קודם כל!
      .replace(/<[^>]+>/g, '')
      // הסרת code blocks (``` או ''')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/'''[\s\S]*?'''/g, '')
      // הסרת גרשיים בודדים (''' או ```) - לפני/אחרי תרגילים
      .replace(/'''+/g, '')
      .replace(/```+/g, '')
      // הסרת backticks בודדים
      .replace(/`+/g, '')
      // הסרת ** (bold markdown)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      // הסרת * (italic markdown)  
      .replace(/\*(.+?)\*/g, '$1')
      // הסרת # (headers)
      .replace(/^#{1,6}\s+/gm, '')
      // הסרת --- (horizontal rules)
      .replace(/^---+/gm, '')
      // הסרת []() (links) - נשאיר רק הטקסט
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // ניקוי רווחים כפולים
      .replace(/\n{3,}/g, '\n\n')
      // הסרת שורות ריקות מיותרות
      .replace(/^\s+$/gm, '')
      .trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanMarkdown(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // פונקציה לזיהוי שפה - בודקת אם הטקסט בעברית או באנגלית
  const detectLanguage = (text: string): 'he' | 'en' => {
    const hebrewChars = /[\u0590-\u05FF]/;
    const englishChars = /[a-zA-Z]/;
    
    let hebrewCount = 0;
    let englishCount = 0;
    
    for (let i = 0; i < Math.min(text.length, 500); i++) {
      if (hebrewChars.test(text[i])) hebrewCount++;
      if (englishChars.test(text[i])) englishCount++;
    }
    
    return hebrewCount > englishCount ? 'he' : 'en';
  };

  // זיהוי שפה מתוצאה (אם קיימת)
  const detectedLanguage = result ? detectLanguage(result) : 'he';
  const isResultHebrew = detectedLanguage === 'he';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // ניקוי markdown ואז escape ל-HTML
      const cleanedResult = cleanMarkdown(result);
      
      // זיהוי שפה
      const language = detectLanguage(cleanedResult);
      const isHebrew = language === 'he';
      const dir = isHebrew ? 'rtl' : 'ltr';
      
      // חילוץ כותרת (שורה ראשונה או שורה שמתחילה במילים מסוימות)
      const resultLines = cleanedResult.split('\n').filter(line => line.trim());
      let title = isHebrew ? 'דף עבודה' : 'Worksheet';
      let content = cleanedResult;
      
      // ננסה למצוא כותרת
      if (resultLines.length > 0) {
        const firstLine = resultLines[0].trim();
        if (firstLine.length < 60 && !firstLine.includes('?') && !firstLine.includes(':')) {
          title = firstLine;
          content = resultLines.slice(1).join('\n');
        }
      }
      
      // ניקוי תגי HTML מהתוכן
      const cleanedContent = content
        .replace(/<[^>]+>/g, '') // הסרת כל תגי HTML
        .replace(/&nbsp;/g, ' ') // המרת &nbsp; לרווח
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      
      // פיצול לשורות
      const contentLines = cleanedContent.split('\n');
      
      // בניית HTML בצורה פשוטה - כל שורה בנפרד
      let htmlParts: string[] = [];
      
      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i].trim();
        
        if (!line) {
          // שורה ריקה - הפרדה קטנה מאוד
          htmlParts.push('<div style="height: 3px;"></div>');
          continue;
        }
        
        // אם זה תרגיל/שאלה (מתחיל במספר)
        if (/^\d+[\.\)]\s/.test(line)) {
          // Escape הטקסט
          const escapedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          
          htmlParts.push(`<div style="margin-bottom: 8px;">
            <div style="margin-bottom: 4px; font-size: 15px;">${escapedLine}</div>
            <div class="answer-space"></div>
          </div>`);
          continue;
        }
        
        // אם זה כותרת קצרה
        if (line.length < 60 && !line.includes('=') && !line.includes('?') && !line.includes(':')) {
          const escapedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          
          htmlParts.push(`<div style="margin: 8px 0 4px 0; font-size: 17px; font-weight: bold;">${escapedLine}</div>`);
          continue;
        }
        
        // שורה רגילה
        const escapedLine = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
        
        htmlParts.push(`<div style="margin-bottom: 4px; line-height: 1.3; font-size: 15px;">${escapedLine}</div>`);
      }
      
      const escapedContent = htmlParts.join('');
      
      const escapedTitle = title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      // יצירת HTML בצורה בטוחה
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="${dir}" lang="${language}">
          <head>
            <meta charset="UTF-8">
            <title>${escapedTitle}</title>
            <style>
              * {
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
                font-size: 15px;
                line-height: 1.3;
                padding: 20px 30px;
                max-width: 850px;
                margin: 0 auto;
                color: #2c3e50;
                background: #fff;
              }
              
              @page {
                margin: 100px 0 60px 0;
                size: A4;
              }
              
              @page:first {
                margin-top: 0;
              }
              
              body {
                counter-reset: page-number 0;
              }
              
              @media print {
                @page {
                  margin: 15mm 10mm;
                }
                
                @page:first {
                  margin-top: 15mm;
                }
                
                body {
                  padding: 0;
                }
                
                .print-header {
                  display: block;
                  position: relative;
                  margin: 0 0 25px 0;
                  page-break-after: avoid;
                }
                
                /* הסתרת כותרת מעמודים שניים ומעלה */
                body > .print-header {
                  display: block;
                }
                
                /* בהדפסה, הכותרת תופיע רק כשהיא בתוך העמוד הראשון */
                @page {
                  @top-center {
                    content: none;
                  }
                }
                
                .print-footer {
                  display: none;
                }
                
                .content {
                  padding: 0;
                  margin-top: 0;
                }
              }
              
              .print-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 18px 25px;
                text-align: center;
                border-radius: 10px;
                box-shadow: 0 3px 5px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 0 0 20px 0;
              }
              
              .print-header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                letter-spacing: 0.5px;
                flex: 1;
              }
              
              .print-header .student-name {
                font-size: 16px;
                ${isHebrew ? 'margin-left: 20px;' : 'margin-right: 20px;'}
                padding: 10px 18px;
                background: rgba(255,255,255,0.25);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                white-space: nowrap;
                backdrop-filter: blur(10px);
              }
              
              body[dir="ltr"] .question, 
              body[dir="ltr"] .exercise {
                border-right: none;
                border-left: 4px solid #667eea;
              }
              
              body[dir="ltr"] .question-number,
              body[dir="ltr"] .exercise-number {
                margin-left: 0;
                margin-right: 10px;
              }
              
              body[dir="ltr"] .answer-space {
                margin-right: 0;
                margin-left: 10px;
              }
              
              
              .content {
                margin-top: 0;
                line-height: 1.4;
                padding: 0;
              }
              
              .question, .exercise {
                margin: 0;
                padding: 0;
                background: transparent;
                border: none;
                border-radius: 0;
                box-shadow: none;
                position: relative;
              }
              
              .content div[style*="margin-bottom"] {
                display: block;
              }
              
              .content > div {
                margin-bottom: 4px;
              }
              
              .question-number, .exercise-number {
                display: inline-block;
                margin: 0 5px 0 0;
                font-weight: 600;
              }
              
              .answer-space {
                margin-top: 4px;
                min-height: 50px;
                border-bottom: 1px solid #adb5bd;
                padding: 6px;
                background: white;
                margin-right: 10px;
                line-height: 1.3;
              }
              
              .answer-space::before {
                content: "${isHebrew ? 'תשובה:' : 'Answer:'}";
                color: #6c757d;
                font-size: 12px;
                margin-bottom: 4px;
                display: block;
                font-weight: 500;
              }
              
              
              @media print {
                .print-header {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                  color: white !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-header" style="display: block;">
              <h1>${escapedTitle}</h1>
              <div class="student-name">${isHebrew ? 'שם: __________________' : 'Name: __________________'}</div>
            </div>
            
            <div class="content" style="page-break-before: avoid;">
            ${escapedContent}
            </div>
            
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-yellow-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-yellow-600" />
            יצירת דף עבודה ללימודים
          </h2>
          <p className="text-gray-600">
            צרי דף עבודה מותאם אישית - לפי הוראה או על בסיס סיפור
          </p>
        </div>

        <div className="space-y-6">
          {/* הוראה */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הוראה * <span className="text-gray-500">(חובה)</span>
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="לדוגמה: הכן לי דפי עבודה לילד בכיתה ו' שלומד משוואות עם נעלם אחד, או כתוב שאלות ברמת כיתה ג'"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              dir="rtl"
            />
          </div>

          {/* סיפור (אופציונלי) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיפור (אופציונלי)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              אם תרצי ליצור שאלות על בסיס סיפור - הדביקי כאן את הסיפור
            </p>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="הדביקי כאן סיפור בעברית או באנגלית..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              dir={story && /^[\u0590-\u05FF\s]+$/.test(story.split('\n')[0]) ? 'rtl' : 'ltr'}
            />
          </div>

          {/* כיתה ומקצוע */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                רמת כיתה (אופציונלי)
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="למשל: כיתה ו', כיתה ג', גן"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מקצוע/נושא (אופציונלי)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="למשל: מתמטיקה, לשון, מדעים"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                dir="rtl"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !instruction.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                יוצר דף עבודה...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                צור דף עבודה
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-600" />
              דף העבודה שנוצר
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    העתק
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                הדפס
              </button>
            </div>
          </div>

          <div className="prose max-w-none">
            <div
              className="bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap text-base leading-relaxed"
              dir={isResultHebrew ? 'rtl' : 'ltr'}
              lang={detectedLanguage}
            >
              {cleanMarkdown(result).split('\n').map((line, index) => (
                <div key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>טיפ:</strong> לחצי על "הדפס" כדי להדפיס את דף העבודה בצורה מקצועית
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

