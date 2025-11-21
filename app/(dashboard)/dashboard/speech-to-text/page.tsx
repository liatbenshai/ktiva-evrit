'use client';

import React, { useState } from 'react';
import { Home, Mic, Upload, FileAudio, Loader2, Copy, Check, X, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageHeader, { PageHeaderLink } from '@/components/layout/PageHeader';

interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
}

export default function SpeechToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('auto');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSegments, setShowSegments] = useState(false);

  const supportedFormats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    
    if (!supportedFormats.includes(fileExtension)) {
      setError(`סוג קובץ לא נתמך. נא להעלות קובץ קול (${supportedFormats.join(', ')})`);
      setFile(null);
      return;
    }

    // בדוק גודל קובץ (Whisper תומך עד 25MB, אבל נגביל ל-20MB)
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 20) {
      setError(`קובץ גדול מדי (${fileSizeMB.toFixed(2)}MB). גודל מקסימלי: 20MB. נסי לדחוס את הקובץ או לחתוך אותו לחלקים קטנים יותר.`);
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    setTranscription(null);
  };

  const handleTranscribe = async () => {
    if (!file) {
      setError('נא לבחור קובץ קול');
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setTranscription(null);

    try {
      const fileSizeMB = file.size / (1024 * 1024);
      let blobUrl: string | null = null;

      // אם הקובץ גדול מ-4MB, העלה אותו ל-Blob Storage קודם
      if (fileSizeMB > 4) {
        // העלה ל-Blob Storage
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch('/api/speech-to-text/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'שגיאה בהעלאת הקובץ ל-Blob Storage');
        }

        const uploadData = await uploadResponse.json();
        blobUrl = uploadData.url;
      }

      // כעת שלח ל-API להמרה
      const formData = new FormData();
      if (blobUrl) {
        // אם יש blobUrl, שלח אותו
        formData.append('blobUrl', blobUrl);
      } else {
        // אחרת, שלח את הקובץ ישירות
        formData.append('file', file);
      }
      formData.append('language', language);

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // טיפול בשגיאת 413 (קובץ גדול מדי)
        if (response.status === 413) {
          const fileSizeMB = file.size / (1024 * 1024);
          throw new Error(`קובץ גדול מדי (${fileSizeMB.toFixed(2)}MB). גודל מקסימלי: 20MB. נסי לדחוס את הקובץ או לחתוך אותו לחלקים קטנים יותר.`);
        }
        
        // נסה לפרסר JSON, אבל אם זה לא JSON, תן הודעה כללית
        let errorMessage = 'שגיאה בהמרת הקול לטקסט';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // אם התשובה לא JSON, נסה לקרוא כטקסט
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text.length > 200 ? text.substring(0, 200) + '...' : text;
            }
          } catch (textError) {
            // אם גם זה נכשל, השתמש בהודעה כללית
            errorMessage = `שגיאה ${response.status}: ${response.statusText || 'שגיאה בהמרת הקול לטקסט'}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTranscription({
        text: data.text,
        language: data.language,
        duration: data.duration,
        segments: data.segments || [],
      });
    } catch (err: any) {
      setError(err.message || 'שגיאה בהמרת הקול לטקסט');
      console.error('Error transcribing:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (transcription?.text) {
      navigator.clipboard.writeText(transcription.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (transcription?.text) {
      const blob = new Blob([transcription.text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file ? `${file.name.replace(/\.[^/.]+$/, '')}_transcription.txt` : 'transcription.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'לא זמין';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <PageHeader
        icon={Mic}
        title="המרת קול לטקסט"
        description="העלי קובץ קול והמערכת תמיר אותו לטקסט כתוב. תמיכה בעברית, אנגלית ורוסית."
        actions={
          <PageHeaderLink
            href="/dashboard"
            label="חזרה לדשבורד"
            icon={Home}
            variant="outline"
            className="text-sm sm:text-base"
          />
        }
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-5 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* פאנל העלאה */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileAudio className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold">העלאת קובץ קול</h2>
            </div>

            {/* בחירת שפה */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                שפה (אופציונלי - השאר "זיהוי אוטומטי" לזיהוי אוטומטי)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="auto">זיהוי אוטומטי</option>
                <option value="he">עברית</option>
                <option value="en">אנגלית</option>
                <option value="ru">רוסית</option>
              </select>
            </div>

            {/* העלאת קובץ */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                בחרי קובץ קול
              </label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  בחרי קובץ
                  <input
                    type="file"
                    className="hidden"
                    accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,.ogg,.flac,audio/*"
                    onChange={handleFileSelect}
                  />
                </label>
                {file && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      onClick={() => {
                        setFile(null);
                        setTranscription(null);
                        setError(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="נקה קובץ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                פורמטים נתמכים: {supportedFormats.join(', ')} | גודל מקסימלי: 20MB (קבצים מעל 4MB יעלו אוטומטית ל-Blob Storage)
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              onClick={handleTranscribe}
              disabled={isTranscribing || !file}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ממיר קול לטקסט...
                </>
              ) : (
                <>
                  <Mic className="ml-2 h-4 w-4" />
                  המר לטקסט
                </>
              )}
            </Button>
          </Card>

          {/* פאנל תוצאות */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">תוצאות</h2>
              </div>
              {transcription && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    {copied ? (
                      <>
                        <Check className="ml-1 h-3 w-3" />
                        הועתק
                      </>
                    ) : (
                      <>
                        <Copy className="ml-1 h-3 w-3" />
                        העתק
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    <Download className="ml-1 h-3 w-3" />
                    הורד
                  </Button>
                </div>
              )}
            </div>

            {!transcription && !isTranscribing && (
              <div className="flex h-96 items-center justify-center text-gray-400">
                <div className="text-center">
                  <Mic className="mx-auto mb-2 h-12 w-12" />
                  <p>הטקסט המומר יופיע כאן</p>
                </div>
              </div>
            )}

            {transcription && (
              <div className="space-y-4">
                {/* מידע על הקובץ */}
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-gray-700">שפה:</span>{' '}
                      <span className="text-gray-600">
                        {transcription.language === 'he' ? 'עברית' :
                         transcription.language === 'en' ? 'אנגלית' :
                         transcription.language === 'ru' ? 'רוסית' :
                         transcription.language || 'לא זוהה'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">אורך:</span>{' '}
                      <span className="text-gray-600">{formatDuration(transcription.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* הטקסט המומר */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">טקסט מומר:</h3>
                    {transcription.segments && transcription.segments.length > 0 && (
                      <button
                        onClick={() => setShowSegments(!showSegments)}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        {showSegments ? 'הסתר' : 'הצג'} מקטעים ({transcription.segments.length})
                      </button>
                    )}
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                      {transcription.text}
                    </p>
                  </div>
                </div>

                {/* מקטעים מפורטים */}
                {showSegments && transcription.segments && transcription.segments.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">מקטעים מפורטים:</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {transcription.segments.map((segment, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
                        >
                          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {formatDuration(segment.start)} - {formatDuration(segment.end)}
                            </span>
                            <span>ביטחון: {(segment.avg_logprob * 100).toFixed(1)}%</span>
                          </div>
                          <p className="text-gray-900">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

