import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

let cachedPdfParse: ((data: Buffer) => Promise<{ text: string }>) | null = null;
async function getPdfParser() {
  if (!cachedPdfParse) {
    const pdfModule = await import('pdf-parse');
    cachedPdfParse = (pdfModule.default ?? pdfModule) as (data: Buffer) => Promise<{ text: string }>;
  }
  return cachedPdfParse;
}

// Function to flip Hebrew text (reverse each line)
function flipHebrewText(text: string): string {
  const lines = text.split('\n');
  return lines
    .map((line) => {
      const trimmedLine = line.trimEnd();
      const flippedLine = trimmedLine.split('').reverse().join('');
      const trailingSpaces = line.slice(trimmedLine.length);
      return flippedLine + trailingSpaces;
    })
    .join('\n');
}

// Helper function to flip text in HTML while preserving structure
function flipTextInHtml(html: string): string {
  // Simple approach: flip text content between HTML tags
  // This preserves the structure (tables, headings, etc.)
  return html.replace(/>([^<]+)</g, (match, text) => {
    const trimmed = text.trim();
    if (!trimmed) return match;
    
    // Only flip if contains Hebrew characters
    const hasHebrew = /[\u0590-\u05FF]/.test(trimmed);
    if (hasHebrew) {
      const flipped = flipHebrewText(trimmed);
      return `>${flipped}<`;
    }
    return match;
  });
}

// Parse HTML and convert to docx elements
async function parseHtmlToDocx(html: string) {
  const { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = await import('docx');
  const elements: any[] = [];
  
  // Simple HTML parser for basic structure
  // Remove style tags and comments
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // Split HTML into segments (tables and other content) while preserving order
  const segments: Array<{ type: 'table' | 'content'; html: string; index: number }> = [];
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  let tableMatch;
  
  // Extract all tables with their positions
  const tables: Array<{ html: string; index: number }> = [];
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    tables.push({
      html: tableMatch[0],
      index: tableMatch.index,
    });
  }
  
  // Process HTML in order: content, table, content, table, etc.
  let currentIndex = 0;
  for (const table of tables) {
    // Add content before table
    if (table.index > currentIndex) {
      segments.push({
        type: 'content',
        html: html.substring(currentIndex, table.index),
        index: currentIndex,
      });
    }
    
    // Add table
    segments.push({
      type: 'table',
      html: table.html,
      index: table.index,
    });
    
    currentIndex = table.index + table.html.length;
  }
  
  // Add remaining content
  if (currentIndex < html.length) {
    segments.push({
      type: 'content',
      html: html.substring(currentIndex),
      index: currentIndex,
    });
  }
  
  // If no tables found, process entire HTML as content
  if (segments.length === 0) {
    segments.push({
      type: 'content',
      html: html,
      index: 0,
    });
  }
  
  // Process each segment in order
  for (const segment of segments) {
    if (segment.type === 'table') {
      // Process table
      const tableHtml = segment.html.replace(/<\/?table[^>]*>/gi, '');
      const rows: TableRow[] = [];
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      
      // Determine number of columns from first row
      let numColumns = 0;
      const firstRowMatch = rowRegex.exec(tableHtml);
      if (firstRowMatch) {
        numColumns = (firstRowMatch[1].match(/<t[dh][^>]*>/gi) || []).length;
      }
      rowRegex.lastIndex = 0; // Reset regex
      
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];
        const cells: TableCell[] = [];
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          const cellContent = cellMatch[1];
          const cellText = flipTextInHtml(cellContent).replace(/<[^>]+>/g, ' ').trim();
          
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: cellText ? [new TextRun(cellText)] : [new TextRun('')],
                }),
              ],
              width: numColumns > 0 ? { size: 100 / numColumns, type: WidthType.PERCENTAGE } : undefined,
            })
          );
        }
        
        if (cells.length > 0) {
          rows.push(new TableRow({ children: cells }));
        }
      }
      
      if (rows.length > 0) {
        elements.push(new Table({ rows }));
      }
    } else {
      // Process content (headings, paragraphs, etc.)
      const contentToProcess = segment.html;
      
      // Split by block elements
      const blockRegex = /<(h[1-6]|p|div|li|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
      let blockMatch;
      let foundBlocks = false;
      
      while ((blockMatch = blockRegex.exec(contentToProcess)) !== null) {
        foundBlocks = true;
        const tagName = blockMatch[1];
        const content = blockMatch[2];
        const text = flipTextInHtml(content).replace(/<[^>]+>/g, ' ').trim();
        
        if (!text) continue;
        
        if (tagName.match(/^h[1-6]$/)) {
          const level = parseInt(tagName[1]);
          const headingLevels = [
            HeadingLevel.HEADING_1,
            HeadingLevel.HEADING_2,
            HeadingLevel.HEADING_3,
            HeadingLevel.HEADING_4,
            HeadingLevel.HEADING_5,
            HeadingLevel.HEADING_6,
          ];
          
          elements.push(
            new Paragraph({
              children: [new TextRun(text)],
              heading: headingLevels[Math.min(level - 1, 5)],
              spacing: { after: 240 },
            })
          );
        } else {
          elements.push(
            new Paragraph({
              children: [new TextRun(text)],
              spacing: { after: 120 },
            })
          );
        }
      }
      
      // If no block elements found, process as plain text
      if (!foundBlocks) {
        const plainText = flipTextInHtml(contentToProcess).replace(/<[^>]+>/g, ' ').trim();
        if (plainText) {
          const lines = plainText.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              elements.push(
                new Paragraph({
                  children: [new TextRun(trimmed)],
                  spacing: { after: 120 },
                })
              );
            }
          }
        }
      }
    }
  }
  
  return elements;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const { Document, Packer } = await import('docx');
    let docChildren: any[] = [];
    
    if (fileName.endsWith('.docx')) {
      // For DOCX: Use mammoth.convertToHtml to preserve structure
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) });
      const html = result.value;
      
      if (!html || !html.trim()) {
        return NextResponse.json(
          { error: 'Could not extract content from file. The file might be empty or contain only images.' },
          { status: 400 }
        );
      }
      
      // Parse HTML and convert to docx elements
      docChildren = await parseHtmlToDocx(html);
      
      if (docChildren.length === 0) {
        return NextResponse.json(
          { error: 'Could not extract structured content from file.' },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith('.pdf')) {
      // For PDF: Extract text (limited structure support)
      const arrayBuffer = await file.arrayBuffer();
      const pdfParse = await getPdfParser();
      const { text: pdfText } = await pdfParse(Buffer.from(arrayBuffer));
      
      if (!pdfText || !pdfText.trim()) {
        return NextResponse.json(
          { error: 'Could not extract text from PDF. The file might be empty or contain only images.' },
          { status: 400 }
        );
      }
      
      // Flip text and create simple paragraphs
      const flippedText = flipHebrewText(pdfText);
      const { Paragraph, TextRun } = await import('docx');
      
      const lines = flippedText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun(trimmed)],
              spacing: { after: 120 },
            })
          );
        } else {
          docChildren.push(
            new Paragraph({
              children: [new TextRun('')],
              spacing: { after: 120 },
            })
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or DOCX' },
        { status: 400 }
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Generate safe filename (ASCII only) for Content-Disposition header
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeFilename = originalName
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      || 'document'; // Fallback if name becomes empty
    const filename = `${safeFilename}_flipped.docx`;
    const encodedFilename = encodeURIComponent(originalName + '_flipped.docx');

    // Return as blob - convert Buffer to Uint8Array for NextResponse
    // Use RFC 5987 encoding for non-ASCII characters
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error: any) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}

