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
    
    // Extract text from PDF
    let text = '';
    if (fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfParse = await getPdfParser();
      const { text: pdfText } = await pdfParse(Buffer.from(arrayBuffer));
      text = pdfText;
    } else if (fileName.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or DOCX' },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from file. The file might be empty or contain only images.' },
        { status: 400 }
      );
    }

    // Flip the text (reverse each line)
    const flippedText = flipHebrewText(text);

    // Create Word document
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    
    const paragraphs = flippedText.split('\n').map((line) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        return new Paragraph({
          children: [new TextRun('')],
          spacing: { after: 120 },
        });
      }
      
      // Check if line looks like a heading (short and might be bold)
      const isHeading = trimmedLine.length < 100 && trimmedLine.length > 0;
      
      return new Paragraph({
        children: [new TextRun(trimmedLine)],
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        spacing: { after: 200 },
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Return as blob
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, '')}_flipped.docx"`,
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

