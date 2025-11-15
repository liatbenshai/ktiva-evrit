'use client';

import { useState } from 'react';
import { ArrowLeftRight, Upload, Copy, Download, RotateCcw, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function FlipDocumentPage() {
  const [inputText, setInputText] = useState('');
  const [flippedText, setFlippedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Function to flip Hebrew text (reverse each line)
  const flipHebrewText = (text: string): string => {
    const lines = text.split('\n');
    return lines
      .map((line) => {
        // Trim the line to preserve spacing
        const trimmedLine = line.trimEnd();
        // Reverse the line character by character
        const flippedLine = trimmedLine.split('').reverse().join('');
        // Preserve trailing spaces
        const trailingSpaces = line.slice(trimmedLine.length);
        return flippedLine + trailingSpaces;
      })
      .join('\n');
  };

  const handleFlip = () => {
    if (!inputText.trim()) {
      return;
    }
    const flipped = flipHebrewText(inputText);
    setFlippedText(flipped);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setUploadedFileName(file.name);

    const fileName = file.name.toLowerCase();
    
    // If PDF or DOCX, use the API to convert to Word
    if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/flip-pdf-to-word', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to process file');
        }

        // Download the Word file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.[^/.]+$/, '') + '_flipped.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Also extract text for preview
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const { text } = await uploadResponse.json();
          setInputText(text);
          const flipped = flipHebrewText(text);
          setFlippedText(flipped);
        }
      } catch (error: any) {
        setFileError(error.message || 'שגיאה בעיבוד הקובץ');
        console.error('Error processing file:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // For TXT files, read directly
      try {
        const text = await file.text();
        setInputText(text);
        // Auto-flip after loading
        setTimeout(() => {
          const flipped = flipHebrewText(text);
          setFlippedText(flipped);
        }, 100);
      } catch (error) {
        setFileError('שגיאה בקריאת הקובץ. נסי להעלות קובץ טקסט (.txt)');
        console.error('Error reading file:', error);
      }
    }
  };

  const handleCopy = async () => {
    if (!flippedText) return;
    try {
      await navigator.clipboard.writeText(flippedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = async () => {
    if (!flippedText) return;

    // If we have an uploaded PDF/DOCX, create Word file
    if (uploadedFileName && (uploadedFileName.toLowerCase().endsWith('.pdf') || uploadedFileName.toLowerCase().endsWith('.docx'))) {
      try {
        setIsProcessing(true);
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
        
        const paragraphs = flippedText.split('\n').map((line) => {
          const trimmedLine = line.trim();
          
          if (trimmedLine === '') {
            return new Paragraph({
              children: [new TextRun('')],
              spacing: { after: 120 },
            });
          }
          
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

        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (uploadedFileName.replace(/\.[^/.]+$/, '') || 'document') + '_flipped.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating Word file:', error);
        setFileError('שגיאה ביצירת קובץ Word');
        // Fallback to TXT
        const blob = new Blob([flippedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document-flipped.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // For TXT files, download as TXT
      const blob = new Blob([flippedText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document-flipped.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setInputText('');
    setFlippedText('');
    setFileError(null);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeftRight className="h-5 w-5 rotate-90" />
            <span className="text-sm font-semibold">חזרה לדשבורד</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">היפוך מסמך עברי</h1>
          <p className="text-slate-600">
            הופך מסמך עברית שנסרק הפוך - הופך כל שורה בנפרד. מעולה למסמכים שנסרקו בכיוון הלא נכון.
          </p>
          <p className="text-sm text-indigo-600 mt-2 font-medium">
            ✨ תומך בהעלאת PDF ו-DOCX - יומר אוטומטית ל-Word!
          </p>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">העלאת קובץ</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
                <div className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium transition ${
                  isProcessing
                    ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed'
                    : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>מעבד קובץ...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>בחרי קובץ (PDF / DOCX / TXT)</span>
                    </>
                  )}
                </div>
              </label>
            </div>
            {uploadedFileName && !isProcessing && (
              <p className="mt-2 text-sm text-slate-600">
                ✓ קובץ נבחר: <span className="font-medium">{uploadedFileName}</span>
                {uploadedFileName.toLowerCase().endsWith('.pdf') || uploadedFileName.toLowerCase().endsWith('.docx') 
                  ? ' - יומר ל-Word אוטומטית' 
                  : ''}
              </p>
            )}
            {fileError && (
              <p className="mt-2 text-sm text-red-600">{fileError}</p>
            )}
          </div>

          {/* Input Text */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-700">טקסט מקורי (הפוך)</label>
              {inputText && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                >
                  <RotateCcw className="h-3 w-3" />
                  איפוס
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="הדבקי או הקלידי טקסט עברי שנסרק הפוך כאן..."
              className="w-full h-64 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-mono text-right focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleFlip}
                disabled={!inputText.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeftRight className="h-4 w-4" />
                הפוך טקסט
              </button>
            </div>
          </div>

          {/* Output Text */}
          {flippedText && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-slate-700">טקסט מופוך (תקין)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? 'הועתק!' : 'העתק'}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        מעבד...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3" />
                        {uploadedFileName && (uploadedFileName.toLowerCase().endsWith('.pdf') || uploadedFileName.toLowerCase().endsWith('.docx'))
                          ? 'הורד Word'
                          : 'הורד'}
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-mono text-right whitespace-pre-wrap max-h-96 overflow-y-auto">
                {flippedText}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">איך להשתמש:</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>העלי קובץ PDF, DOCX או TXT - קבצי PDF ו-DOCX יומרו אוטומטית ל-Word</li>
              <li>או הדבקי טקסט עברי שנסרק הפוך בשדה הטקסט</li>
              <li>לחצי על "הפוך טקסט" - הטקסט יהפך שורה אחר שורה</li>
              <li>השתמשי בכפתור "העתק" כדי להעתיק את הטקסט המופוך</li>
              <li>או לחצי על "הורד" כדי להוריד את הטקסט כקובץ Word או TXT</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

