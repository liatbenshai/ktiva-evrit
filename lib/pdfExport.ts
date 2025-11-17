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
  
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i].trim();
    const nextLine = i < contentLines.length - 1 ? contentLines[i + 1].trim() : '';
    const prevLine = i > 0 ? contentLines[i - 1].trim() : '';
    
      if (!line) {
        if (inVerticalMath) {
          inVerticalMath = false;
          htmlParts.push(`<div class="answer-space" style="min-height: 80px; height: 80px; width: 100%; line-height: 2.5;"></div>`);
          htmlParts.push('</div>');
        }
        htmlParts.push('<div style="height: 3px;"></div>');
        continue;
      }
      
      // בדיקה אם זה "תשובה:" - נציג עם תיבה אחרי (בלי ::before כפול)
      if (/^תשובה:?\s*$/i.test(line) || /^Answer:?\s*$/i.test(line)) {
        htmlParts.push(`<div class="question-container" style="margin-bottom: 20px; direction: ${dir};">
          <div style="margin-bottom: 8px; font-size: 15px; font-weight: 600; text-align: ${isHebrew ? 'right' : 'left'}; color: #495057;">${isHebrew ? 'תשובה:' : 'Answer:'}</div>
          <div class="answer-space-no-label" style="text-align: ${isHebrew ? 'right' : 'left'}; min-height: 100px; height: 100px; width: 100%; line-height: 2.5; border: 2px solid #adb5bd; border-radius: 4px; padding: 12px; margin-top: 8px; box-sizing: border-box; background: white;"></div>
        </div>`);
        continue;
      }
    
    // בדיקה אם זה תרגיל מאונך - אם השורה היא מספר והשורה הקודמת לא הייתה חלק מתרגיל
    if (/^\d+$/.test(line) && !inVerticalMath) {
      // בדיקה אם השורה הבאה היא סימן + מספר או קו הפרדה
      if (/^[+\-×*÷xX]\s*\d+/.test(nextLine) || /^-{2,}/.test(nextLine)) {
        inVerticalMath = true;
        htmlParts.push(`<div class="vertical-math-container" style="margin-bottom: 16px; ${isHebrew ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'}">`);
      }
    }
    
    // אם זה מספור בשורה נפרדת כמו "(1)" או "(1) " - דילוג עליו
    if (/^\(?\d+\)?\s*$/.test(line)) {
      // דילוג על המספור - לא מציגים אותו
      // בדיקה אם השורה הבאה היא מספר - אז זה תרגיל מאונך
      if (/^\d+$/.test(nextLine)) {
        inVerticalMath = true;
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
    
    // בדיקה אם זה תרגיל כפל אופקי מסוג "______ ×1" או "____ 1x" או "___ × 2"
    const multiplicationMatch = line.match(/^(_+|[־_\s]+)\s*[×x]\s*(\d+)$/i) || 
                                line.match(/^(_+|[־_\s]+)\s*(\d+)\s*[×x]$/i);
    
    if (multiplicationMatch) {
      // זה תרגיל כפל - נציג אותו עם תיבת תשובה
      const underline = multiplicationMatch[1] || '______';
      const number = multiplicationMatch[2];
      
      // אם יש × בצורה "___ × 2" או "___ x 2"
      const hasXBefore = /[×x]\s*\d+$/i.test(line);
      const displayText = hasXBefore ? `${underline} ×${number}` : `${underline} ${number}×`;
      
      const escapedText = displayText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      
      // בדיקה אם השורה הבאה היא "תשובה:" - אם כן, נחבר אותן יחד
      const isNextLineAnswer = nextLine && (/^תשובה:?\s*$/i.test(nextLine) || /^Answer:?\s*$/i.test(nextLine));
      
      if (isNextLineAnswer) {
        // דילוג על השורה הבאה (תשובה:) ונציג הכל יחד
        i++; // Skip next line
        htmlParts.push(`<div class="question-container" style="margin-bottom: 24px; direction: ${dir}; border-bottom: 1px solid #dee2e6; padding-bottom: 16px;">
          <div style="margin-bottom: 12px; font-size: 18px; text-align: ${isHebrew ? 'right' : 'left'}; line-height: 1.8; font-weight: 500; font-family: 'Courier New', monospace;">${escapedText}</div>
          <div style="margin-bottom: 8px; font-size: 15px; font-weight: 600; text-align: ${isHebrew ? 'right' : 'left'}; color: #495057;">${isHebrew ? 'תשובה:' : 'Answer:'}</div>
          <div class="answer-space-no-label" style="text-align: ${isHebrew ? 'right' : 'left'}; min-height: 100px; height: 100px; width: 100%; line-height: 2.5; border: 2px solid #adb5bd; border-radius: 4px; padding: 12px; margin-top: 8px; box-sizing: border-box; background: white;"></div>
        </div>`);
      } else {
        // לא, נציג רק את התרגיל עם תיבה
        htmlParts.push(`<div class="question-container" style="margin-bottom: 24px; direction: ${dir}; border-bottom: 1px solid #dee2e6; padding-bottom: 16px;">
          <div style="margin-bottom: 12px; font-size: 18px; text-align: ${isHebrew ? 'right' : 'left'}; line-height: 1.8; font-weight: 500; font-family: 'Courier New', monospace;">${escapedText}</div>
          <div class="answer-space-no-label" style="text-align: ${isHebrew ? 'right' : 'left'}; min-height: 100px; height: 100px; width: 100%; line-height: 2.5; border: 2px solid #adb5bd; border-radius: 4px; padding: 12px; margin-top: 8px; box-sizing: border-box; background: white;"></div>
        </div>`);
      }
      continue;
    }
    
    // אם זה תרגיל/שאלה רגיל
    if (/^\d+[\.\)]\s/.test(line)) {
      const escapedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      
      htmlParts.push(`<div class="question-container" style="margin-bottom: 20px; direction: ${dir};">
        <div style="margin-bottom: 10px; font-size: 15px; text-align: ${isHebrew ? 'right' : 'left'}; line-height: 1.6;">${escapedLine}</div>
        <div class="answer-space" style="text-align: ${isHebrew ? 'right' : 'left'}; min-height: 80px; height: 80px; width: 100%; line-height: 2.5;"></div>
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
      
      htmlParts.push(`<div style="margin: 12px 0 6px 0; font-size: 18px; font-weight: bold; text-align: ${isHebrew ? 'right' : 'left'}; direction: ${dir};">${escapedLine}</div>`);
      continue;
    }
    
    // שורה רגילה
    const escapedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    
    htmlParts.push(`<div style="margin-bottom: 6px; line-height: 1.6; font-size: 15px; text-align: ${isHebrew ? 'right' : 'left'}; direction: ${dir};">${escapedLine}</div>`);
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
        <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Heebo:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: ${isHebrew ? "'Assistant', 'Heebo', 'Segoe UI', 'Arial Hebrew', 'David', 'Miriam', sans-serif" : "'Segoe UI', 'Arial', 'Helvetica', sans-serif"};
            font-size: 15px;
            line-height: 1.5;
            padding: 0;
            margin: 0;
            color: #2c3e50;
            background: #fff;
            direction: ${dir};
            text-align: ${isHebrew ? 'right' : 'left'};
            unicode-bidi: embed;
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
              min-height: 100px !important;
              height: 100px !important;
              border-bottom: 2px solid #adb5bd !important;
              width: 100% !important;
              box-sizing: border-box !important;
              line-height: 2.8 !important;
              padding: 12px !important;
              margin: 8px 0 !important;
            }
            .answer-space-no-label {
              page-break-inside: avoid;
              min-height: 100px !important;
              height: 100px !important;
              border: 2px solid #adb5bd !important;
              width: 100% !important;
              box-sizing: border-box !important;
              line-height: 2.8 !important;
              padding: 12px !important;
              margin: 8px 0 !important;
              background: white !important;
            }
            .question-container {
              page-break-inside: avoid;
              margin-bottom: 20px !important;
            }
            .vertical-math-container {
              page-break-inside: avoid;
              margin-bottom: 20px !important;
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
            direction: ${dir};
            text-align: ${isHebrew ? 'right' : 'left'};
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
            direction: ${dir};
          }
          .student-field {
            font-size: 15px;
            color: #212529;
            white-space: nowrap;
            font-weight: 500;
            direction: ${dir};
            text-align: ${isHebrew ? 'right' : 'left'};
          }
          .content {
            margin-top: 0;
            line-height: 1.6;
            padding: 0;
            direction: ${dir};
            text-align: ${isHebrew ? 'right' : 'left'};
          }
          .question-container {
            page-break-inside: avoid;
          }
          .vertical-math-container {
            page-break-inside: avoid;
            margin-bottom: 20px;
            display: inline-block;
            min-width: 150px;
          }
          .math-answer-space {
            page-break-inside: avoid;
            height: 40px;
            border-bottom: 2px solid #333;
            background: white;
            line-height: 2;
          }
          .answer-space {
            margin-top: 8px;
            min-height: 80px;
            border-bottom: 2px solid #adb5bd;
            padding: 12px;
            background: white;
            ${isHebrew ? 'margin-right: 0; margin-left: 0;' : 'margin-left: 0; margin-right: 0;'}
            line-height: 2.5;
            direction: ${dir};
            text-align: ${isHebrew ? 'right' : 'left'};
            width: 100%;
            box-sizing: border-box;
          }
          .answer-space::before {
            content: "${isHebrew ? 'תשובה:' : 'Answer:'}";
            color: #6c757d;
            font-size: 12px;
            margin-bottom: 8px;
            display: block;
            font-weight: 600;
            direction: ${dir};
            text-align: ${isHebrew ? 'right' : 'left'};
          }
          .answer-space-no-label {
            margin-top: 8px;
            min-height: 80px;
            border: 2px solid #adb5bd;
            padding: 12px;
            background: white;
            ${isHebrew ? 'margin-right: 0; margin-left: 0;' : 'margin-left: 0; margin-right: 0;'}
            line-height: 2.5;
            direction: ${dir};
            text-align: ${isHebrew ? 'right' : 'left'};
            width: 100%;
            box-sizing: border-box;
          }
          .answer-space-no-label::before {
            display: none;
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
          <div class="print-header" style="direction: ${dir};">
            <h1 style="direction: ${dir}; text-align: ${isHebrew ? 'right' : 'left'};">${escapedTitle}</h1>
            <div style="direction: ${dir}; text-align: ${isHebrew ? 'right' : 'left'}; font-size: 15px; white-space: nowrap;">${isHebrew ? 'שם: __________________' : 'Name: __________________'}</div>
          </div>
          <div class="student-info-box">
            <div class="student-field">${isHebrew ? 'שם התלמיד:' : 'Student Name:'} ________________________</div>
            <div class="student-field">${isHebrew ? 'כיתה:' : 'Class:'} ________</div>
            <div class="student-field">${isHebrew ? 'תאריך:' : 'Date:'} ________</div>
          </div>
          <div class="content" style="direction: ${dir}; text-align: ${isHebrew ? 'right' : 'left'};">
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