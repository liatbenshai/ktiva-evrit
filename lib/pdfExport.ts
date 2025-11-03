'use client';

/**
 * פונקציה לייצוא דף עבודה ל-PDF עם תמיכה בעברית
 * @param {string} worksheetText - טקסט מלא של דף העבודה
 */
export async function exportWorksheetToPDF(worksheetText: string) {
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

  // ניקוי markdown
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/'''[\s\S]*?'''/g, '')
      .replace(/'''+/g, '')
      .replace(/```+/g, '')
      .replace(/`+/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^---+/gm, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+$/gm, '')
      .trim();
  };

  const cleanedResult = cleanMarkdown(worksheetText);
  
  // זיהוי שפה
  const language = detectLanguage(cleanedResult);
  const isHebrew = language === 'he';
  const dir = isHebrew ? 'rtl' : 'ltr';
  
  // חילוץ כותרת
  const resultLines = cleanedResult.split('\n').filter(line => line.trim());
  let title = isHebrew ? 'דף עבודה' : 'Worksheet';
  let content = cleanedResult;
  
  if (resultLines.length > 0) {
    const firstLine = resultLines[0].trim();
    if (firstLine.length < 60 && !firstLine.includes('?') && !firstLine.includes(':')) {
      title = firstLine;
      content = resultLines.slice(1).join('\n');
    }
  }
  
  // ניקוי תגי HTML מהתוכן
  const cleanedContent = content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  
  // פיצול לשורות
  const contentLines = cleanedContent.split('\n');
  
  // בניית HTML
  let htmlParts: string[] = [];
  let inVerticalMath = false;
  let exerciseNumber = '';
  
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i].trim();
    const nextLine = i < contentLines.length - 1 ? contentLines[i + 1].trim() : '';
    
    if (!line) {
      if (inVerticalMath) {
        inVerticalMath = false;
        htmlParts.push(`<div class="answer-space"></div>`);
      }
      htmlParts.push('<div style="height: 3px;"></div>');
      continue;
    }
    
    // בדיקה אם זה תרגיל מאונך - אם השורה היא מספר והשורה הקודמת לא הייתה חלק מתרגיל
    if (/^\d+$/.test(line) && !inVerticalMath) {
      // בדיקה אם השורה הבאה היא סימן + מספר או קו הפרדה
      if (/^[+\-×*÷]\s*\d+/.test(nextLine) || /^-{2,}/.test(nextLine)) {
        inVerticalMath = true;
      }
    }
    
    // אם זה מספור בשורה נפרדת כמו "(1)" או "(1) " - דילוג עליו
    if (/^\(?\d+\)?\s*$/.test(line)) {
      // דילוג על המספור - לא מציגים אותו
      // בדיקה אם השורה הבאה היא מספר - אז זה תרגיל מאונך
      if (/^\d+$/.test(nextLine)) {
        inVerticalMath = true;
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
      
      // אם זה מספר (שורה ראשונה של התרגיל) - מיושר ימינה (או שמאלה בעברית)
      if (/^\d+$/.test(line)) {
        htmlParts.push(`<div style="margin-bottom: 2px; font-size: 15px; text-align: ${isHebrew ? 'right' : 'left'}; padding-${isHebrew ? 'right' : 'left'}: 40px;">${escapedLine}</div>`);
        continue;
      }
      
      // אם זה סימן + מספר (שורה שנייה) - צריך ליישר עם המספר הראשון
      const signMatch = line.match(/^([+\-×*÷])\s*(\d+)$/);
      if (signMatch) {
        const sign = signMatch[1];
        const number = signMatch[2];
        htmlParts.push(`<div style="margin-bottom: 2px; font-size: 15px; text-align: ${isHebrew ? 'right' : 'left'}; padding-${isHebrew ? 'right' : 'left'}: 40px;"><span style="display: inline-block; ${isHebrew ? 'margin-left' : 'margin-right'}: 5px;">${sign}</span><span>${number}</span></div>`);
        continue;
      }
      
      // אם זה קו הפרדה - מיושר כמו המספרים
      if (/^-{2,}/.test(line)) {
        htmlParts.push(`<div style="margin-bottom: 2px; font-size: 15px; border-bottom: 1px solid #333; width: 80px; ${isHebrew ? 'margin-right' : 'margin-left'}: 40px;"></div>`);
        continue;
      }
      
      // אם זה "תשובה:" - סיום התרגיל
      if (/תשובה:/.test(line) || /Answer:/.test(line)) {
        inVerticalMath = false;
        htmlParts.push(`<div class="answer-space"></div>`);
        continue;
      }
      
      // אם השורה הבאה לא חלק מהתרגיל - סיום
      if (!/^\d+$/.test(nextLine) && !/^[+\-×*÷]\s*\d+/.test(nextLine) && !/^-{2,}/.test(nextLine) && nextLine && !/^\(?\d+\)?\s*$/.test(nextLine)) {
        inVerticalMath = false;
        htmlParts.push(`<div class="answer-space"></div>`);
      }
    }
    
    // אם זה תרגיל/שאלה רגיל
    if (/^\d+[\.\)]\s/.test(line)) {
      const escapedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      
      htmlParts.push(`<div class="question-container" style="margin-bottom: 8px;">
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
  
  // יצירת HTML מלא
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <title>${escapedTitle}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
            font-size: 15px;
            line-height: 1.3;
            padding: 0;
            margin: 0;
            color: #2c3e50;
            background: #fff;
          }
          @page {
            margin: 10mm 5mm;
            size: A4;
          }
          .worksheet-wrapper { position: relative; }
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
            .student-info-box {
              display: flex !important;
              page-break-after: avoid;
              page-break-inside: avoid;
              margin: 0 0 20px 0 !important;
              padding: 15px 20px !important;
            }
            .content {
              padding: 0;
              margin-top: 0;
            }
            .answer-space {
              page-break-inside: avoid;
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
          .student-info-box {
            background: #ffffff;
            border: 1px solid #ced4da;
            border-radius: 6px;
            padding: 15px 20px;
            margin: 0 0 25px 0;
            display: flex;
            ${isHebrew ? 'flex-direction: row-reverse;' : 'flex-direction: row;'}
            justify-content: flex-start;
            align-items: center;
            gap: 30px;
          }
          .student-field {
            font-size: 15px;
            color: #212529;
            white-space: nowrap;
            font-weight: 500;
          }
          .content {
            margin-top: 0;
            line-height: 1.4;
            padding: 0;
          }
          .question-container {
            page-break-inside: avoid;
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
            <div>${isHebrew ? 'שם: __________________' : 'Name: __________________'}</div>
          </div>
          <div class="student-info-box">
            <div class="student-field">${isHebrew ? 'שם התלמיד:' : 'Student Name:'} ________________________</div>
            <div class="student-field">${isHebrew ? 'כיתה:' : 'Class:'} ________</div>
            <div class="student-field">${isHebrew ? 'תאריך:' : 'Date:'} ________</div>
          </div>
          <div class="content">
            ${escapedContent}
          </div>
        </div>
      </body>
    </html>
  `;
  
  // יצירת חלון להדפסה
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}