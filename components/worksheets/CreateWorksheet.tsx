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
          // שורה ריקה - הפרדה
          htmlParts.push('<div style="height: 12px;"></div>');
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
          
          htmlParts.push(`<div style="margin-bottom: 25px;">
            <div style="margin-bottom: 15px; font-size: 18px; font-weight: 500; line-height: 1.6;">${escapedLine}</div>
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
          
          htmlParts.push(`<div style="margin: 25px 0 15px 0; font-size: 20px; font-weight: bold; color: #667eea;">${escapedLine}</div>`);
          continue;
        }
        
        // שורה רגילה
        const escapedLine = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
        
        htmlParts.push(`<div style="margin-bottom: 12px; line-height: 1.8; font-size: 16px;">${escapedLine}</div>`);
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
                font-size: 16px;
                line-height: 1.8;
                padding: 30px;
                max-width: 850px;
                margin: 0 auto;
                color: #2c3e50;
                background: #fff;
              }
              
              @page {
                margin: 80px 0 50px 0;
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
                  counter-increment: page-number;
                  margin: 80px 0 50px 0;
                }
                
                @page:first {
                  margin-top: 0;
                  counter-reset: page-number 0;
                }
                
                body {
                  counter-reset: page-number 0;
                }
                
                .print-header,
                .print-footer {
                  position: fixed;
                  left: 0;
                  right: 0;
                  z-index: 1000;
                }
                
                .print-header {
                  top: 0;
                  height: 80px;
                }
                
                .print-footer {
                  bottom: 0;
                  height: 50px;
                }
                
                body {
                  padding-top: 0;
                  padding-bottom: 0;
                }
                
                .content {
                  padding: 20px 30px;
                }
                
                .print-footer .page-counter::after {
                  content: counter(page-number);
                  display: inline;
                }
              }
              
              .print-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 3px solid #ffd700;
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
                padding: 8px 15px;
                background: rgba(255,255,255,0.2);
                border-radius: 8px;
                white-space: nowrap;
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
              
              .print-footer {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 10px 30px;
                text-align: center;
                border-top: 2px solid #bdc3c7;
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: #7f8c8d;
                font-size: 14px;
              }
              
              .print-footer .page-number {
                font-weight: bold;
              }
              
              .content {
                margin-top: 30px;
              }
              
              .question, .exercise {
                margin: 25px 0;
                padding: 20px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-right: 4px solid #667eea;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                position: relative;
              }
              
              /* הפרדה טובה יותר בין שורות */
              .content {
                line-height: 2;
              }
              
              .content div[style*="margin-bottom"] {
                display: block;
              }
              
              /* הפרדה בין תרגילים/שאלות */
              .content > div {
                margin-bottom: 15px;
              }
              
              .question-number, .exercise-number {
                display: inline-block;
                width: 35px;
                height: 35px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 50%;
                text-align: center;
                line-height: 35px;
                font-weight: bold;
                font-size: 18px;
                margin-left: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              
              .answer-space {
                margin-top: 20px;
                min-height: 120px;
                border-bottom: 2px dashed #95a5a6;
                padding: 20px;
                background: white;
                border-radius: 5px;
                margin-right: 10px;
                line-height: 2;
              }
              
              .answer-space::before {
                content: "${isHebrew ? 'תשובה:' : 'Answer:'}";
                color: #7f8c8d;
                font-size: 14px;
                margin-bottom: 10px;
                display: block;
                font-weight: bold;
              }
              
              
              @media print {
                .print-header {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                  color: white !important;
                }
                .print-footer {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
                }
                .student-info {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%) !important;
                }
                .question, .exercise {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
                }
                .question-number, .exercise-number {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                  color: white !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${escapedTitle}</h1>
              <div class="student-name">${isHebrew ? 'שם: __________________' : 'Name: __________________'}</div>
            </div>
            
            <div class="print-footer">
              <div>${isHebrew ? 'תאריך: _______________' : 'Date: _______________'}</div>
              <div class="page-number">${isHebrew ? 'עמוד ' : 'Page '}<span class="page-counter"></span></div>
              <div>${isHebrew ? 'בהצלחה! 🌟' : 'Good luck! 🌟'}</div>
            </div>
            
            <div class="content">
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

