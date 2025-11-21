import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST - המרת קול לטקסט באמצעות Whisper
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const language = (formData.get('language') as string) || 'auto'; // he, en, ru, auto

    if (!file) {
      return NextResponse.json(
        { error: 'נא להעלות קובץ קול' },
        { status: 400 }
      );
    }

    // בדוק אם זה קובץ קול נתמך
    const supportedExtensions = [
      'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac'
    ];

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    if (!supportedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `סוג קובץ לא נתמך. נא להעלות קובץ קול (${supportedExtensions.join(', ')})` },
        { status: 400 }
      );
    }

    // בדוק גודל קובץ (Whisper תומך עד 25MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 25) {
      return NextResponse.json(
        { error: 'קובץ גדול מדי. גודל מקסימלי: 25MB' },
        { status: 400 }
      );
    }

    // קבע את השפה לפי הבחירה
    let languageCode: string | undefined = undefined;
    if (language !== 'auto') {
      languageCode = language;
    }

    // המר את הקובץ ל-Blob עבור OpenAI SDK
    // OpenAI SDK ב-Node.js מצפה ל-File או Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || `audio/${fileExtension}` });
    
    // צור File object חדש עבור OpenAI SDK
    const audioFile = new File([blob], file.name, { type: blob.type });

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
      fileName: file.name,
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

