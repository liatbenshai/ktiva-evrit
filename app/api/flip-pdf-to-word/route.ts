import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

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

// Helper function to extract and flip text from HTML while preserving structure
function extractAndFlipText(html: string): string {
  // Remove HTML tags and preserve newlines, then flip
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  
  // Flip Hebrew text line by line
  return flipHebrewText(text);
}

// Helper function to flip text in HTML while preserving structure (for nested content)
function flipTextInHtml(html: string): string {
  // More sophisticated: preserve HTML structure but flip text nodes
  // Split by tags and process text content separately
  const parts: string[] = [];
  const tagRegex = /<[^>]+>/g;
  let tagMatch;
  
  // Find all tags
  const tags: Array<{ index: number; content: string }> = [];
  while ((tagMatch = tagRegex.exec(html)) !== null) {
    tags.push({
      index: tagMatch.index,
      content: tagMatch[0],
    });
  }
  
  // Process content between tags
  let currentIndex = 0;
  for (const tag of tags) {
    // Add text before tag (flip it)
    if (tag.index > currentIndex) {
      const text = html.substring(currentIndex, tag.index);
      const hasHebrew = /[\u0590-\u05FF]/.test(text);
      parts.push(hasHebrew ? flipHebrewText(text) : text);
    }
    
    // Add tag as-is
    parts.push(tag.content);
    currentIndex = tag.index + tag.content.length;
  }
  
  // Add remaining text
  if (currentIndex < html.length) {
    const text = html.substring(currentIndex);
    const hasHebrew = /[\u0590-\u05FF]/.test(text);
    parts.push(hasHebrew ? flipHebrewText(text) : text);
  }
  
  return parts.join('');
}

// Parse HTML and convert to docx elements using cheerio
async function parseHtmlToDocx(html: string) {
  const { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = await import('docx');
  const elements: any[] = [];
  
  // Load HTML with cheerio
  const $ = cheerio.load(html);
  
  // Process body content in order
  const body = $('body').length > 0 ? $('body') : $.root();
  
  // Process each child element in order
  body.contents().each((_, node) => {
    if (node.type === 'tag' && 'name' in node) {
      const tagName = (node as any).name;
      
      if (tagName === 'table') {
        // Process table
        const table = $(node);
        const rows: any[] = [];
        
        // Find all rows (including in tbody, thead, tfoot)
        table.find('tr').each((_, trNode) => {
          const row = $(trNode);
          const cells: any[] = [];
          
          // Find all cells
          row.find('td, th').each((_, cellNode) => {
            const cell = $(cellNode);
            const cellText = extractAndFlipText(cell.html() || '').trim();
            
            // Split by newlines to preserve paragraph structure
            const cellLines = cellText.split('\n').filter(l => l.trim());
            const cellParagraphs = cellLines.length > 0 
              ? cellLines.map(line => new Paragraph({ children: [new TextRun(line.trim())] }))
              : [new Paragraph({ children: [new TextRun('')] })];
            
            cells.push(
              new TableCell({
                children: cellParagraphs,
              })
            );
          });
          
          if (cells.length > 0) {
            rows.push(new TableRow({ children: cells }));
          }
        });
        
        if (rows.length > 0) {
          // Calculate column count from first row
          const numColumns = rows[0]?.children.length || 1;
          elements.push(new Table({ 
            rows,
            columnWidths: Array(numColumns).fill(100 / numColumns)
          }));
        }
      } else if (tagName?.match(/^h[1-6]$/)) {
        // Process heading
        const heading = $(node);
        const level = parseInt(tagName[1]);
        const text = extractAndFlipText(heading.html() || '').trim();
        
        if (text) {
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
        }
      } else if (['p', 'div', 'li'].includes(tagName || '')) {
        // Process paragraph/div/list item
        const para = $(node);
        const text = extractAndFlipText(para.html() || '').trim();
        
        if (text) {
          // Split by newlines if needed
          const lines = text.split('\n').filter(l => l.trim());
          for (const line of lines) {
            elements.push(
              new Paragraph({
                children: [new TextRun(line.trim())],
                spacing: { after: 120 },
              })
            );
          }
        } else {
          elements.push(
            new Paragraph({
              children: [new TextRun('')],
              spacing: { after: 120 },
            })
          );
        }
      } else if (tagName === 'br') {
        // Line break
        elements.push(
          new Paragraph({
            children: [new TextRun('')],
            spacing: { after: 120 },
          })
        );
      }
    } else if (node.type === 'text') {
      // Process text nodes directly
      const text = $(node).text().trim();
      if (text) {
        const flipped = extractAndFlipText(text);
        const lines = flipped.split('\n').filter(l => l.trim());
        for (const line of lines) {
          elements.push(
            new Paragraph({
              children: [new TextRun(line.trim())],
              spacing: { after: 120 },
            })
          );
        }
      }
    }
  });
  
  // If no elements found, process entire HTML as plain text
  if (elements.length === 0) {
    const plainText = extractAndFlipText(html).trim();
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

