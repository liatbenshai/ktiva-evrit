import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

/**
 * POST - העלאת קובץ קול ל-Vercel Blob Storage
 * זה מאפשר העלאת קבצים גדולים יותר (עד 20MB) ללא מגבלת 4.5MB של Vercel
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

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

    // בדוק גודל קובץ (Whisper תומך עד 25MB, אבל נגביל ל-20MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 20) {
      return NextResponse.json(
        { error: `קובץ גדול מדי (${fileSizeMB.toFixed(2)}MB). גודל מקסימלי: 20MB. נא לדחוס את הקובץ או לחתוך אותו לחלקים קטנים יותר.` },
        { status: 400 }
      );
    }

    // המר את הקובץ ל-ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // העלה ל-Vercel Blob Storage
    // put מקבל: string, Blob, ArrayBuffer, File, או ReadableStream
    const blob = await put(file.name, arrayBuffer, {
      access: 'public',
      contentType: file.type || `audio/${fileExtension}`,
    });

    // החזר את ה-URL של הקובץ
    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error uploading to Blob Storage:', error);
    
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { error: 'מפתח Blob Storage לא מוגדר. נא לבדוק את BLOB_READ_WRITE_TOKEN ב-Vercel Dashboard' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'שגיאה בהעלאת הקובץ' },
      { status: 500 }
    );
  }
}

