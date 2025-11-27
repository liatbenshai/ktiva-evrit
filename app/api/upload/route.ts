import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

let cachedPdfParse: ((data: Buffer) => Promise<{ text: string }>) | null = null;
async function getPdfParser() {
  if (!cachedPdfParse) {
    const pdfModule = await import('pdf-parse');
    cachedPdfParse = (pdfModule.default ?? pdfModule) as (data: Buffer) => Promise<{ text: string }>;
  }
  return cachedPdfParse;
}

async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  let worker;
  try {
    console.log('Starting OCR worker...');
    worker = await createWorker('heb+eng');
    console.log('OCR worker created, recognizing text...');
    const { data: { text } } = await worker.recognize(imageBuffer);
    console.log('OCR completed, extracted text length:', text.length);
    return text || '';
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`שגיאה בחילוץ טקסט מהתמונה: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (worker) {
      await worker.terminate();
      console.log('OCR worker terminated');
    }
  }
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
    let text = '';

    // Check if it's an image file
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];
    const isImage = imageExtensions.some(ext => fileName.endsWith(ext));

    if (isImage) {
      console.log('Processing image file:', fileName);
      const arrayBuffer = await file.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      console.log('Image buffer size:', imageBuffer.length);
      text = await extractTextFromImage(imageBuffer);
      console.log('Extracted text from image:', text.substring(0, 100));
    } else if (fileName.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      text = result.value;
    } else if (fileName.endsWith('.txt')) {
      text = await file.text();
    } else if (fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfParse = await getPdfParser();
      const { text: pdfText } = await pdfParse(Buffer.from(arrayBuffer));
      text = pdfText;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload TXT, DOCX, PDF, or image files (JPG, PNG, etc.)' },
        { status: 400 }
      );
    }

    text = text.trim().replace(/\n{3,}/g, '\n\n');

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Error processing file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}