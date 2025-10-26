import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

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

    // Check file type
    const fileName = file.name.toLowerCase();
    let text = '';

    if (fileName.endsWith('.docx')) {
      // Extract text from DOCX
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      text = result.value;
    } else if (fileName.endsWith('.txt')) {
      // Read TXT file
      text = await file.text();
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload TXT or DOCX' },
        { status: 400 }
      );
    }

    // Clean up the text - remove extra whitespace
    text = text.trim().replace(/\n{3,}/g, '\n\n');

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}