'use client';

import { useRef, useState } from 'react';
import { Check, Copy, Download, FileText, Loader2, Printer, Upload } from 'lucide-react';
import { exportWorksheetToPDF } from '@/lib/pdfExport';
import { usePatternSaver, SavedPatternInfo } from '@/hooks/usePatternSaver';
import PatternSaverPanel from '@/components/shared/PatternSaverPanel';

export default function CreateWorksheet() {
  const [instruction, setInstruction] = useState('');
  const [story, setStory] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const instructionFileInputRef = useRef<HTMLInputElement | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);
  const applyPatternToText = (text: string, pattern: SavedPatternInfo) => {
    if (!text) return text;

    const { originalSelection, from, to } = pattern;

    if (originalSelection && text.includes(originalSelection)) {
      return text.replace(originalSelection, to);
    }

    if (from && text.includes(from)) {
      return text.replace(from, to);
    }

    return text;
  };

  const patternSaver = usePatternSaver({
    source: 'worksheet',
    userId: 'default-user',
    onSuccess: (pattern) => {
      setResult((prev) => applyPatternToText(prev, pattern));
    },
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'instruction' | 'story'
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.match(/\.(pdf|docx|txt)$/i)) {
      alert('נא להעלות קובץ מסוג: PDF, DOCX או TXT');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      const { text } = await response.json();

      if (target === 'instruction') {
        setInstruction(text);
      } else {
        setStory(text);
      }

      alert('הקובץ נקרא בהצלחה! הטקסט הועתק לשדה המתאים.');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

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
      patternSaver.resetPatternSaved();
      setCopied(false);
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
      let inVerticalMath = false; // האם אנחנו בתרגיל חשבון מאונך
      let exerciseStartIndex = -1; // איפה התחיל התרגיל
      
      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i].trim();
        const nextLine = i < contentLines.length - 1 ? contentLines[i + 1].trim() : '';
        
        if (!line) {
          // שורה ריקה - סיום תרגיל מאונך אם היה
          if (inVerticalMath) {
            inVerticalMath = false;
            htmlParts.push(`<div class="math-answer-space" style="margin-top: 4px; min-height: 40px; border-bottom: 2px solid #333; width: 120px; direction: ltr; ${isHebrew ? 'margin-right: 20px;' : 'margin-left: 20px;'}"></div>`);
            htmlParts.push('</div>');
          }
          htmlParts.push('<div style="height: 3px;"></div>');
          continue;
        }

        if (/^[_־\s]+$/.test(line)) {
          continue;
        }
        
        // בדיקה אם זה תרגיל מאונך - אם השורה היא מספר והשורה הקודמת לא הייתה חלק מתרגיל
        if (/^\d+$/.test(line) && !inVerticalMath) {
        // בדיקה אם השורה הבאה היא סימן + מספר או קו הפרדה
        if (/^[+\-×*÷xX]\s*\d+/.test(nextLine) || /^-{2,}/.test(nextLine)) {
          inVerticalMath = true;
          exerciseStartIndex = i;
          htmlParts.push(`<div class="vertical-math-container" style="margin-bottom: 16px; ${isHebrew ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'}">`);
          // המשך לטפל בשורה זו כמספר ראשון
        }
        }
        
        // אם זה מספור בשורה נפרדת כמו "(1)" או "(1) " - דילוג עליו
        if (/^\(?\d+\)?\s*$/.test(line)) {
          // דילוג על המספור - לא מציגים אותו
          // בדיקה אם השורה הבאה היא מספר - אז זה תרגיל מאונך
          if (/^\d+$/.test(nextLine)) {
            inVerticalMath = true;
            exerciseStartIndex = i;
            htmlParts.push(`<div class="vertical-math-container" style="margin-bottom: 16px; ${isHebrew ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'}">`);
          }
          continue;
        }
        
        // אם זה חלק מתרגיל מאונך
        if (inVerticalMath) {
          const escapedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          
          // אם זה מספר (שורה ראשונה של התרגיל) - מיושר ימינה
          if (/^\d+$/.test(line)) {
            htmlParts.push(`<div style="margin-bottom: 1px; font-size: 16px; direction: ltr; text-align: right; font-family: 'Courier New', monospace; letter-spacing: 1px; ${isHebrew ? 'padding-right: 20px;' : 'padding-left: 20px;'}">${escapedLine}</div>`);
            continue;
          }
          
          // אם זה סימן + מספר (שורה שנייה) - צריך ליישר עם המספר הראשון
          const signMatch = line.match(/^([+\-×*÷xX])\s*(\d+)$/);
          if (signMatch) {
            const sign = signMatch[1] === 'x' || signMatch[1] === 'X' ? '×' : signMatch[1];
            const number = signMatch[2];
            htmlParts.push(`<div style="margin-bottom: 1px; font-size: 16px; direction: ltr; text-align: right; font-family: 'Courier New', monospace; letter-spacing: 1px; ${isHebrew ? 'padding-right: 20px;' : 'padding-left: 20px;'}"><span style="margin-right: 4px;">${sign}</span><span>${number}</span></div>`);
            continue;
          }
          
          // אם זה קו הפרדה - מיושר כמו המספרים
          if (/^-{2,}/.test(line)) {
            const lineLength = line.length;
            htmlParts.push(`<div style="margin-bottom: 4px; border-bottom: 1px solid #333; width: ${Math.min(lineLength * 8, 100)}px; direction: ltr; ${isHebrew ? 'margin-right: 20px;' : 'margin-left: 20px;'}"></div>`);
            continue;
          }
          
          // אם זה "תשובה:" - סיום התרגיל
          if (/תשובה:/.test(line) || /Answer:/.test(line)) {
            inVerticalMath = false;
            htmlParts.push(`<div class="math-answer-space" style="margin-top: 4px; min-height: 40px; border-bottom: 2px solid #333; width: 120px; direction: ltr; ${isHebrew ? 'margin-right: 20px;' : 'margin-left: 20px;'}"></div>`);
            htmlParts.push('</div>');
            continue;
          }
          
          // אם השורה הבאה לא חלק מהתרגיל - סיום
          if (!/^\d+$/.test(nextLine) && !/^[+\-×*÷xX]\s*\d+/.test(nextLine) && !/^-{2,}/.test(nextLine) && nextLine && !/^\(?\d+\)?\s*$/.test(nextLine)) {
            inVerticalMath = false;
            htmlParts.push(`<div class="math-answer-space" style="margin-top: 4px; min-height: 40px; border-bottom: 2px solid #333; width: 120px; direction: ltr; ${isHebrew ? 'margin-right: 20px;' : 'margin-left: 20px;'}"></div>`);
            htmlParts.push('</div>');
          }
        }
        
        // אם זה תרגיל/שאלה רגיל (מתחיל במספר עם נקודה או סוגריים)
        if (/^\d+[\.\)]\s/.test(line)) {
          const escapedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          
          htmlParts.push(`<div style="margin-bottom: 12px;">
            <div style="margin-bottom: 6px; font-size: 15px;">${escapedLine}</div>
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
                padding: 0;
                max-width: 100%;
                margin: 0;
                color: #2c3e50;
                background: #fff;
              }
              
              @page {
                margin: 10mm 5mm;
                size: A4;
              }
              
              body {
                counter-reset: page-number 0;
              }
              
              .worksheet-wrapper {
                position: relative;
              }
              
              @media print {
                @page {
                  margin: 10mm 5mm;
                  size: A4;
                }
                
                body {
                  padding: 0;
                  margin: 0;
                }
                
                .worksheet-wrapper {
                  padding: 0;
                  margin: 0;
                }
                
                .print-header {
                  display: block !important;
                  position: relative;
                  margin: 0 0 18px 0 !important;
                  padding: 18px 20px !important;
                  page-break-after: avoid;
                  page-break-inside: avoid;
                }
                
                .print-footer {
                  display: none;
                }
                
                .content {
                  padding: 0;
                  margin-top: 0;
                }
                
                .content > div:first-child {
                  page-break-before: avoid;
                }
                
                .answer-space {
                  min-height: 100px !important;
                  height: 100px !important;
                  border-bottom: 2px solid #adb5bd !important;
                  border: 2px solid #adb5bd !important;
                  width: 100% !important;
                  box-sizing: border-box !important;
                  line-height: 2.8 !important;
                  padding: 12px !important;
                  margin: 8px 0 !important;
                }
                
                .vertical-math-container {
                  margin-bottom: 20px !important;
                  page-break-inside: avoid !important;
                }
                
                .math-answer-space {
                  min-height: 40px !important;
                  height: 40px !important;
                  border-bottom: 2px solid #333 !important;
                  width: 120px !important;
                }
              }
              
              .print-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 18px 20px;
                text-align: center;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 0 0 20px 0;
              }
              
              .print-header h1 {
                margin: 0;
                font-size: 22px;
                font-weight: bold;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
                letter-spacing: 0.5px;
                flex: 1;
              }
              
              .print-header .student-name-header {
                font-size: 15px;
                ${isHebrew ? 'margin-left: 25px;' : 'margin-right: 25px;'}
                padding: 8px 16px;
                background: rgba(255,255,255,0.3);
                border: 2px solid rgba(255,255,255,0.4);
                border-radius: 6px;
                white-space: nowrap;
                backdrop-filter: blur(10px);
                font-weight: 500;
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
                margin-top: 8px;
                min-height: 100px;
                border: 2px solid #adb5bd;
                padding: 12px;
                background: white;
                margin: 0;
                line-height: 2.8;
                border-radius: 0;
                width: 100%;
                box-sizing: border-box;
              }
              
              .answer-space::before {
                content: "${isHebrew ? 'תשובה:' : 'Answer:'}";
                color: #6c757d;
                font-size: 12px;
                margin-bottom: 4px;
                display: block;
                font-weight: 500;
              }
              
              .vertical-math-container {
                margin-bottom: 20px;
                display: inline-block;
                min-width: 150px;
              }
              
              .math-answer-space {
                height: 40px;
                border-bottom: 2px solid #333;
                background: white;
                line-height: 2;
              }
              
              
              @media print {
                * {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                .print-header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                  color: white !important;
                  display: block !important;
                  position: relative !important;
                }
                
                .print-header h1 {
                  color: white !important;
                }
                
                body {
                  background: white !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="worksheet-wrapper">
              <div class="print-header">
                <h1>${escapedTitle}</h1>
                <div class="student-name-header">${isHebrew ? 'שם: __________________' : 'Name: __________________'}</div>
              </div>
              
              <div class="content">
              ${escapedContent}
              </div>
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

  const handleExportPDF = async () => {
    if (!result) {
      alert('אין דף עבודה לייצוא');
      return;
    }

    try {
      // ניקוי markdown מהתוצאה
      const cleanedResult = cleanMarkdown(result);
      
      // יצירת PDF
      await exportWorksheetToPDF(cleanedResult);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('אירעה שגיאה ביצירת הקובץ PDF');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-2 sm:px-0">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 sm:mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900 sm:text-xl">
            <FileText className="h-5 w-5 text-yellow-600 sm:h-6 sm:w-6" />
            יצירת דף עבודה ללימודים
          </h2>
          <p className="text-sm text-gray-600 sm:text-base">
            צרי דף עבודה מותאם אישית לפי הנחיות, כיתה וסיפור בסיסי, והורידי אותו להדפסה.
          </p>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 sm:mb-2">
              הוראה * <span className="text-gray-500">(חובה)</span>
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="לדוגמה: הכן דף עבודה על משוואות עם נעלם אחד לכיתה ו'."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 sm:px-4 sm:py-3 sm:text-base"
              dir="rtl"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
              <button
                type="button"
                onClick={() => instructionFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 px-3 py-1.5 text-sm font-medium text-yellow-700 transition hover:border-yellow-400 hover:bg-yellow-50"
              >
                <Upload className="h-4 w-4" />
                העלי קובץ (PDF / DOCX / TXT)
              </button>
              <span>נייבא את הטקסט לשדה ההוראות.</span>
            </div>
            <input
              ref={instructionFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => handleFileUpload(event, 'instruction')}
              className="hidden"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 sm:mb-2">
              סיפור (אופציונלי)
            </label>
            <p className="mb-2 text-xs text-gray-500 sm:text-sm">
              אם תרצי לבנות שאלות על בסיס סיפור קיים, הדביקי אותו כאן או העלי קובץ ונייצר שאלות סביבו.
            </p>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="הדביקי כאן סיפור בעברית או באנגלית..."
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 sm:px-4 sm:py-3 sm:text-base"
              dir={story && /^[\u0590-\u05FF\s]+$/.test(story.split('\n')[0]) ? 'rtl' : 'ltr'}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
              <button
                type="button"
                onClick={() => storyFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 px-3 py-1.5 text-sm font-medium text-yellow-700 transition hover:border-yellow-400 hover:bg-yellow-50"
              >
                <Upload className="h-4 w-4" />
                העלי קובץ (PDF / DOCX / TXT)
              </button>
              <span>הטקסט ייכנס לשדה הסיפור.</span>
            </div>
            <input
              ref={storyFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => handleFileUpload(event, 'story')}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 sm:mb-2">
                רמת כיתה (אופציונלי)
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="למשל: כיתה ו', כיתה ג', גן"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 sm:px-4 sm:py-2.5 sm:text-base"
                dir="rtl"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 sm:mb-2">
                מקצוע/נושא (אופציונלי)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="למשל: מתמטיקה, לשון, מדעים"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 sm:px-4 sm:py-2.5 sm:text-base"
                dir="rtl"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !instruction.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                יוצר דף עבודה...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                צור דף עבודה
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 sm:text-xl">
              <FileText className="h-5 w-5 text-yellow-600" />
              דף העבודה שנוצר
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    העתק
                  </>
                )}
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
              >
                <Download className="h-4 w-4" />
                ייצא PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg bg-yellow-500 px-3 py-2 text-sm text-white transition-colors hover:bg-yellow-600"
              >
                <Printer className="h-4 w-4" />
                הדפס
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed sm:p-5 sm:text-base">
            <div
              dir={isResultHebrew ? 'rtl' : 'ltr'}
              lang={detectedLanguage}
              onMouseUp={patternSaver.handleSelection}
              onKeyUp={patternSaver.handleSelection}
              onTouchEnd={patternSaver.handleSelection}
            >
              {cleanMarkdown(result).split('\n').map((line, index) => (
                <div key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          </div>

          <PatternSaverPanel
            sourceLabel="דף עבודה"
            selectedText={patternSaver.selectedText}
            onSelectedTextChange={patternSaver.setSelectedText}
            patternCorrection={patternSaver.patternCorrection}
            onPatternCorrectionChange={patternSaver.setPatternCorrection}
            onSave={patternSaver.handleSavePattern}
            isSaving={patternSaver.isSavingPattern}
            patternSaved={patternSaver.patternSaved}
            instructions="סמני קטע בעייתי מתוך דף העבודה שנוצר (אפשר גם להדביק אותו בשדה), הזיני ניסוח מוצלח יותר ולחצי 'שמרי דפוס'."
          />

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800 sm:text-base">
              💡 <strong>טיפ:</strong> השתמשי באפשרות “הדפס” כדי לקבל פריסה נוחה להדפסת דף העבודה.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

