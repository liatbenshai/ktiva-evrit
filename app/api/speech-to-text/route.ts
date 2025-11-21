import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// הגדר את המגבלה גם ב-runtime config
export const config = {
  maxDuration: 300, // 5 דקות (לקבצים גדולים)
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST - המרת קול לטקסט באמצעות Whisper
 * תומך בשני מצבים:
 * 1. קובץ ישיר (עד 4MB) - דרך formData
 * 2. URL מ-Blob Storage (עד 20MB) - דרך blobUrl parameter
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const blobUrl = formData.get('blobUrl') as string | null;
    const language = (formData.get('language') as string) || 'auto'; // he, en, ru, auto

    let audioFile: File;
    let fileName: string;

    // אם יש blobUrl, נשתמש בו (לקבצים גדולים)
    if (blobUrl) {
      try {
        // הורד את הקובץ מה-Blob Storage
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file from Blob Storage');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: response.headers.get('content-type') || 'audio/mpeg' });
        
        // חלץ את שם הקובץ מה-URL
        const urlParts = blobUrl.split('/');
        fileName = urlParts[urlParts.length - 1] || 'audio.mp3';
        
        audioFile = new File([blob], fileName, { type: blob.type });
      } catch (error: any) {
        return NextResponse.json(
          { error: `שגיאה בטעינת הקובץ מ-Blob Storage: ${error.message}` },
          { status: 500 }
        );
      }
    } else if (file) {
      // אם יש קובץ ישיר, נשתמש בו (לקבצים קטנים)
      audioFile = file;
      fileName = file.name;
    } else {
      return NextResponse.json(
        { error: 'נא להעלות קובץ קול או לספק blobUrl' },
        { status: 400 }
      );
    }

    // בדוק אם זה קובץ קול נתמך
    const supportedExtensions = [
      'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac'
    ];

    const fileNameLower = fileName.toLowerCase();
    const fileExtension = fileNameLower.split('.').pop()?.toLowerCase() || '';

    if (!supportedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `סוג קובץ לא נתמך. נא להעלות קובץ קול (${supportedExtensions.join(', ')})` },
        { status: 400 }
      );
    }

    // בדוק גודל קובץ (Whisper תומך עד 25MB)
    const fileSizeMB = audioFile.size / (1024 * 1024);
    if (fileSizeMB > 20) {
      return NextResponse.json(
        { error: `קובץ גדול מדי (${fileSizeMB.toFixed(2)}MB). גודל מקסימלי: 20MB. נא לדחוס את הקובץ או לחתוך אותו לחלקים קטנים יותר.` },
        { status: 400 }
      );
    }

    // קבע את השפה לפי הבחירה
    let languageCode: string | undefined = undefined;
    if (language !== 'auto') {
      languageCode = language;
    }

    // קריאה ל-Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: languageCode,
      response_format: 'verbose_json', // לקבל מידע נוסף כמו segments
    });

    // החזר את הטקסט והמידע הנוסף
    return NextResponse.json({
      success: true,
      text: transcription.text,
      language: transcription.language || language,
      duration: transcription.duration,
      segments: transcription.segments || [],
      fileName: fileName,
    });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    
    // טיפול בשגיאות ספציפיות
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'מפתח API לא תקין או חסר. נא לבדוק את OPENAI_API_KEY' },
        { status: 401 }
      );
    }
    
    if (error.status === 413) {
      return NextResponse.json(
        { error: 'קובץ גדול מדי. גודל מקסימלי: 25MB' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'שגיאה בהמרת הקול לטקסט' },
      { status: 500 }
    );
  }
}

