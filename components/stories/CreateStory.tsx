'use client';

import { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';
import { usePatternSaver, SavedPatternInfo } from '@/hooks/usePatternSaver';
import PatternSaverPanel from '@/components/shared/PatternSaverPanel';
import ContentFeatures from '@/components/shared/ContentFeatures';

export default function CreateStory() {
  const [genre, setGenre] = useState('');
  const [characters, setCharacters] = useState('');
  const [setting, setSetting] = useState('');
  const [plot, setPlot] = useState('');
  const [length, setLength] = useState('קצר (500-1000 מילים)');
  const [tone, setTone] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const applyPatternToText = (text: string, pattern: SavedPatternInfo) => {
    if (!text) return text;

    const { originalSelection, from, to } = pattern;

    if (originalSelection && text.includes(originalSelection)) {
      return text.replace(originalSelection, to);
    }

    if (from && text.includes(from)) {
      return text.replace(from, to);
    }

    return text;
  };

  const patternSaver = usePatternSaver({
    source: 'story',
    userId: 'default-user',
    onSuccess: (pattern) => {
      setResult((prev) => applyPatternToText(prev, pattern));
    },
  });

  const handleGenerate = async () => {
    if (!genre.trim() || !plot.trim()) {
      alert('נא למלא לפחות ז\'אנר ועלילה');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'story',
          data: {
            genre,
            characters,
            setting,
            plot,
            length,
            tone,
            additionalInstructions,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: generatedStory } = await response.json();
      setResult(generatedStory);
      patternSaver.resetPatternSaved();
    } catch (error) {
      alert('אירעה שגיאה ביצירת הסיפור');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-orange-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📖 פרטי הסיפור
        </h2>
        
        <div className="space-y-4">
          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ז'אנר *
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="למשל: מתח, רומנטי, מדע בדיוני, פנטזיה, אימה..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Characters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              דמויות עיקריות
            </label>
            <input
              type="text"
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              placeholder="למשל: יעל - עורכת דין צעירה, דני - בלש פרטי..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              רקע ומקום
            </label>
            <input
              type="text"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="למשל: תל אביב של ימינו, כפר קטן בהרים, חללית בעתיד..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Plot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              עלילה ורעיון מרכזי *
            </label>
            <textarea
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              placeholder="תאר את העלילה המרכזית, הקונפליקט והמסר..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אורך הסיפור
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option>קצר (500-1000 מילים)</option>
              <option>בינוני (1000-2000 מילים)</option>
              <option>ארוך (2000-3000 מילים)</option>
              <option>סיפור קצר מקצועי (3000+ מילים)</option>
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              טון וסגנון
            </label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="למשל: מתח מתמיד, קליל ומשעשע, רגשי ומרגש..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הוראות נוספות
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="כל פרט נוסף שיעזור ליצור סיפור טוב יותר..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              כותב את הסיפור...
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              כתוב סיפור
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <>
          <div className="bg-white rounded-xl shadow-sm border-2 border-green-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ✨ הסיפור שלך
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-serif leading-relaxed"
              onMouseUp={patternSaver.handleSelection}
              onKeyUp={patternSaver.handleSelection}
              onTouchEnd={patternSaver.handleSelection}
            />
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                📋 העתק
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([result], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'סיפור.txt';
                  a.click();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                💾 הורד
              </button>
            </div>
          </div>

          <PatternSaverPanel
            sourceLabel="סיפור"
            selectedText={patternSaver.selectedText}
            onSelectedTextChange={patternSaver.setSelectedText}
            patternCorrection={patternSaver.patternCorrection}
            onPatternCorrectionChange={patternSaver.setPatternCorrection}
            onSave={patternSaver.handleSavePattern}
            isSaving={patternSaver.isSavingPattern}
            patternSaved={patternSaver.patternSaved}
          />

          {/* Additional Improvements */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-purple-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 שיפורים נוספים
            </h3>
            <div className="space-y-4">
              <ImprovementButtons
                content={result}
                documentType="story"
                onImprove={(improved) => setResult(improved)}
              />
              <div className="flex justify-center">
                <SynonymButton
                  text={result}
                  context={`סיפור: ${genre || 'סיפור'}`}
                  category="stories"
                  userId="default-user"
                  onVersionSelect={(version) => setResult(version)}
                />
              </div>
            </div>
          </div>

          <ContentFeatures
            content={result}
            contentType="סיפור"
            enableWebSearch={true}
            enableURLs={true}
          />
        </>
      )}

      {/* בוט AI לעזרה */}
      <AIChatBot 
        text={result || ''}
        context={result ? `סיפור: ${genre || 'סיפור'}` : 'יצירת סיפור'}
        userId="default-user"
      />
    </div>
  );
}