'use client';

/**
 * Extract text from image using OCR on the client side
 * Uses tesseract.js for browser-based OCR
 */
export async function extractTextFromImageClient(file: File): Promise<string> {
  try {
    // Dynamic import to reduce initial bundle size
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('heb+eng');
    try {
      const { data: { text } } = await worker.recognize(file);
      return text || '';
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`שגיאה בחילוץ טקסט מהתמונה: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

