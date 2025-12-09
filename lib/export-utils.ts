'use client';

/**
 * Helper function to clean markdown from text
 */
function cleanMarkdown(text: string): string {
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
}

/**
 * Export text to TXT file
 */
export function exportToTXT(text: string, filename: string = 'document') {
  const cleanedText = cleanMarkdown(text);
  // Add BOM for proper Hebrew display in text editors
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + cleanedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export text to Word (DOCX) file
 */
export async function exportToWord(text: string, filename: string = 'document') {
  try {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');

    // Clean markdown before export
    const cleanedText = cleanMarkdown(text);

    // Split text into paragraphs
    const paragraphs = cleanedText.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed) {
        return new Paragraph({
          children: [new TextRun(trimmed)],
          spacing: { after: 120 },
        });
      } else {
        return new Paragraph({
          children: [new TextRun('')],
          spacing: { after: 120 },
        });
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    // Convert Buffer to Uint8Array for Blob constructor
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw new Error('שגיאה ביצירת קובץ Word');
  }
}

/**
 * Export text to PDF using jsPDF
 */
export async function exportToPDF(text: string, filename: string = 'document') {
  try {
    const { jsPDF } = await import('jspdf');

    // Clean markdown before export
    const cleanedText = cleanMarkdown(text);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font for Hebrew support
    doc.setFont('helvetica');

    // Split text into lines that fit the page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    const lineHeight = 7;
    let y = margin;

    // Split text into paragraphs
    const paragraphs = cleanedText.split('\n');
    
    for (const paragraph of paragraphs) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      if (paragraph.trim()) {
        // Split long lines
        const lines = doc.splitTextToSize(paragraph, maxWidth);
        for (const line of lines) {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        }
        y += lineHeight * 0.5; // Space between paragraphs
      } else {
        y += lineHeight; // Empty line
      }
    }

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('שגיאה ביצירת קובץ PDF');
  }
}

