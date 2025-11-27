'use client';

/**
 * Preprocess image to improve OCR accuracy
 * Resizes large images and enhances quality
 */
async function preprocessImage(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('לא ניתן ליצור canvas'));
      return;
    }

    // Create object URL for the image
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // Calculate optimal size (max 2000px on longest side for better OCR)
        const maxDimension = 2000;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image with better quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with high quality
        canvas.toBlob(
          (blob) => {
            // Clean up object URL
            URL.revokeObjectURL(url);
            
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('שגיאה בעיבוד התמונה'));
            }
          },
          'image/png',
          0.95 // High quality
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('שגיאה בטעינת התמונה'));
    };
    
    img.src = url;
  });
}

/**
 * Extract text from image using OCR on the client side
 * Uses tesseract.js for browser-based OCR with improved configuration
 */
export async function extractTextFromImageClient(
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  let worker: any = null;
  
  try {
    // Dynamic import to reduce initial bundle size
    const { createWorker } = await import('tesseract.js');
    
    // Show progress for worker initialization
    if (onProgress) onProgress(0.1);
    
    // Create worker with Hebrew and English languages
    worker = await createWorker('heb+eng', 1, {
      logger: (m: any) => {
        // Report progress if callback provided
        if (onProgress && m.status === 'recognizing text') {
          onProgress(0.3 + (m.progress || 0) * 0.6);
        }
      },
    });
    
    // Configure worker for better Hebrew recognition
    await worker.setParameters({
      tessedit_pageseg_mode: '1', // Automatic page segmentation
      tessedit_char_whitelist: '', // Allow all characters
      preserve_interword_spaces: '1', // Preserve spaces
    });
    
    if (onProgress) onProgress(0.2);
    
    // Preprocess image for better OCR results
    let imageToProcess: File | Blob = file;
    try {
      if (file instanceof File || file instanceof Blob) {
        imageToProcess = await preprocessImage(file);
        if (onProgress) onProgress(0.3);
      }
    } catch (preprocessError) {
      console.warn('Image preprocessing failed, using original:', preprocessError);
      // Continue with original image if preprocessing fails
    }
    
    // Perform OCR recognition
    const { data } = await worker.recognize(imageToProcess);
    
    if (onProgress) onProgress(0.95);
    
    // Clean up preprocessed blob if it was created
    if (imageToProcess !== file && imageToProcess instanceof Blob) {
      // Blob will be garbage collected automatically
    }
    
    const text = data.text || '';
    
    if (onProgress) onProgress(1.0);
    
    // Return text even if empty - let the caller decide what to do
    return text.trim();
  } catch (error) {
    console.error('OCR Error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('שגיאת רשת. בדקי את החיבור לאינטרנט ונסי שוב.');
      }
      if (error.message.includes('language') || error.message.includes('model')) {
        throw new Error('שגיאה בטעינת מודל השפה. נסי לרענן את הדף.');
      }
      throw new Error(`שגיאה בחילוץ טקסט מהתמונה: ${error.message}`);
    }
    
    throw new Error('שגיאה לא ידועה בעיבוד התמונה. נסי תמונה אחרת.');
  } finally {
    // Always terminate worker
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.warn('Error terminating worker:', terminateError);
      }
    }
  }
}

/**
 * Convert base64 image data to Blob for OCR processing
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Process multiple images from base64 data
 */
export async function processImagesFromBase64(
  images: Array<{ data: string; mimeType: string; name: string }>,
  onProgress?: (current: number, total: number, imageName: string) => void
): Promise<string> {
  const texts: string[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    
    if (onProgress) {
      onProgress(i + 1, images.length, img.name);
    }
    
    try {
      const blob = base64ToBlob(img.data, img.mimeType);
      
      // Process with progress callback
      const progressCallback = onProgress 
        ? (progress: number) => {
            // Calculate overall progress across all images
            const overallProgress = (i + progress) / images.length;
            // Progress callback is called, but we can't update the image name here
          }
        : undefined;
      
      const text = await extractTextFromImageClient(blob, progressCallback);
      
      if (text && text.trim()) {
        texts.push(`[תמונה ${i + 1}: ${img.name}]\n${text.trim()}`);
      } else {
        errors.push(`תמונה ${i + 1} (${img.name}): לא נמצא טקסט`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      console.error(`Error processing image ${img.name}:`, error);
      errors.push(`תמונה ${i + 1} (${img.name}): ${errorMsg}`);
      // Continue with other images even if one fails
    }
  }
  
  // Add error summary if there were errors
  if (errors.length > 0 && texts.length > 0) {
    texts.push(`\n[הערות: ${errors.length} תמונות לא עובדו בהצלחה]\n${errors.join('\n')}`);
  }
  
  if (texts.length === 0 && errors.length > 0) {
    throw new Error(`כל התמונות נכשלו בעיבוד:\n${errors.join('\n')}`);
  }
  
  return texts.join('\n\n');
}

