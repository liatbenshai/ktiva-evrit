import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';

let cachedPdfParse: ((data: Buffer) => Promise<{ text: string }>) | null = null;
async function getPdfParser() {
  if (!cachedPdfParse) {
    const pdfModule = await import('pdf-parse');
    cachedPdfParse = (pdfModule.default ?? pdfModule) as (data: Buffer) => Promise<{ text: string }>;
  }
  return cachedPdfParse;
}

/**
 * Extract images from DOCX file
 * DOCX files are ZIP archives, images are stored in word/media/
 */
function extractImagesFromDocx(buffer: Buffer): Array<{ data: Buffer; name: string; mimeType: string }> {
  const images: Array<{ data: Buffer; name: string; mimeType: string }> = [];
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    for (const entry of zipEntries) {
      // Images in DOCX are stored in word/media/
      if (entry.entryName.startsWith('word/media/') && !entry.isDirectory) {
        const entryData = entry.getData();
        const fileName = entry.entryName.split('/').pop() || '';
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        
        // Determine MIME type
        let mimeType = 'image/png';
        if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
        else if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'bmp') mimeType = 'image/bmp';
        else if (extension === 'webp') mimeType = 'image/webp';
        
        images.push({
          data: entryData,
          name: fileName,
          mimeType
        });
      }
    }
  } catch (error) {
    console.error('Error extracting images from DOCX:', error);
  }
  
  return images;
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

    // Check file size (Vercel has 4.5MB limit for Hobby, 50MB for Pro)
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `הקובץ גדול מדי (${(file.size / 1024 / 1024).toFixed(1)}MB). מקסימום: 4.5MB. נסי להקטין את התמונה או להשתמש בקובץ קטן יותר.` },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    let text = '';

    // Check if it's an image file - images should be processed on client side
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];
    const isImage = imageExtensions.some(ext => fileName.endsWith(ext));

    if (isImage) {
      // Images should be processed on client side to avoid timeout issues
      return NextResponse.json(
        { error: 'תמונות מעובדות בצד הלקוח. אנא השתמשי בפונקציית העלאת התמונה בקומפוננטה.' },
        { status: 400 }
      );
    } else if (fileName.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Extract text from document
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      
      // Extract images from document
      const images = extractImagesFromDocx(buffer);
      
      // Convert images to base64 for client-side OCR processing
      const imageData = images.map(img => ({
        data: img.data.toString('base64'),
        mimeType: img.mimeType,
        name: img.name
      }));
      
      // Normalize text (trim and consolidate excessive newlines)
      text = text.trim().replace(/\n{3,}/g, '\n\n');
      
      // If there are images, include them in the response
      if (imageData.length > 0) {
        return NextResponse.json({ 
          text,
          images: imageData,
          hasImages: true
        });
      }
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