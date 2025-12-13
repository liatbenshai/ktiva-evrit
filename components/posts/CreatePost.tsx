'use client';

import { useState } from 'react';
import { Send, Loader2, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';
import { SynonymButton } from '@/components/SynonymButton';
import { usePatternSaver, SavedPatternInfo } from '@/hooks/usePatternSaver';
import PatternSaverPanel from '@/components/shared/PatternSaverPanel';
import ContentFeatures from '@/components/shared/ContentFeatures';

type Platform = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

const platformInfo = {
  facebook: {
    name: 'פייסבוק',
    icon: Facebook,
    color: 'bg-blue-600',
    maxLength: 63206,
    style: 'אישי וידידותי, מתאים לסיפורים ותוכן ארוך',
  },
  instagram: {
    name: 'אינסטגרם',
    icon: Instagram,
    color: 'bg-pink-600',
    maxLength: 2200,
    style: 'ויזואלי וקצר, מתמקד בתמונות ווידאו',
  },
  linkedin: {
    name: 'לינקדאין',
    icon: Linkedin,
    color: 'bg-blue-700',
    maxLength: 3000,
    style: 'מקצועי ועסקי, מתאים לתובנות וחדשות תעשייתיות',
  },
  twitter: {
    name: 'טוויטר / X',
    icon: Twitter,
    color: 'bg-black',
    maxLength: 280,
    style: 'תמציתי וישיר, מסרים קצרים ומדויקים',
  },
};

export default function CreatePost() {
  const [platform, setPlatform] = useState<Platform>('facebook');
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState('בינוני');
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
    source: 'post',
    userId: 'default-user',
    onSuccess: (pattern) => {
      setResult((prev) => applyPatternToText(prev, pattern));
    },
  });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('נא להזין נושא לפוסט');
      return;
    }

    setIsGenerating(true);
    try {
      const platformData = platformInfo[platform];
      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'post',
          data: {
            topic,
            platform: `${platformData.name} - ${platformData.style}`,
            length,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');
      const { result: generatedPost } = await response.json();
      setResult(generatedPost);
      patternSaver.resetPatternSaved();
    } catch (error) {
      alert('אירעה שגיאה ביצירת הפוסט');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentPlatform = platformInfo[platform];
  const Icon = currentPlatform.icon;

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          בחר פלטפורמה
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(platformInfo).map(([key, info]) => {
            const PlatformIcon = info.icon;
            return (
              <button
                key={key}
                onClick={() => setPlatform(key as Platform)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  platform === key
                    ? `${info.color} text-white border-transparent`
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <PlatformIcon className="w-8 h-8" />
                <span className="font-medium">{info.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>סגנון:</strong> {currentPlatform.style}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <strong>אורך מקסימלי:</strong> {currentPlatform.maxLength.toLocaleString()} תווים
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          פרטי הפוסט
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נושא הפוסט *
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="על מה הפוסט? לדוגמה: 'הכרזה על מוצר חדש', 'טיפים לניהול זמן', 'סיפור הצלחה'..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אורך
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="קצר">קצר (1-2 משפטים)</option>
              <option value="בינוני">בינוני (פסקה)</option>
              <option value="ארוך">ארוך (מספר פסקאות)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 ${currentPlatform.color} text-white rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                יוצר פוסט...
              </>
            ) : (
              <>
                <Icon className="w-5 h-5" />
                צור פוסט ל{currentPlatform.name}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon className={`w-6 h-6 ${currentPlatform.color} text-white p-1 rounded`} />
              <h3 className="text-lg font-semibold text-gray-900">
                הפוסט ל{currentPlatform.name}
              </h3>
            </div>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              onMouseUp={patternSaver.handleSelection}
              onKeyUp={patternSaver.handleSelection}
              onTouchEnd={patternSaver.handleSelection}
            />
            <p className="mt-2 text-sm text-gray-500">
              {result.length} / {currentPlatform.maxLength.toLocaleString()} תווים
            </p>
          </div>

          <PatternSaverPanel
            sourceLabel={`פוסט (${currentPlatform.name})`}
            selectedText={patternSaver.selectedText}
            onSelectedTextChange={patternSaver.setSelectedText}
            patternCorrection={patternSaver.patternCorrection}
            onPatternCorrectionChange={patternSaver.setPatternCorrection}
            onSave={patternSaver.handleSavePattern}
            isSaving={patternSaver.isSavingPattern}
            patternSaved={patternSaver.patternSaved}
          />

          <ContentFeatures
            content={result}
            contentType="פוסט"
            enableWebSearch={true}
            enableURLs={true}
          />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤖 שיפור אוטומטי
            </h3>
            <div className="space-y-4">
              <ImprovementButtons
                content={result}
                documentType="post"
                onImprove={(improved) => setResult(improved)}
              />
              <div className="flex justify-center">
                <SynonymButton
                  text={result}
                  context={`פוסט ל-${platformInfo[platform].name}`}
                  category="posts"
                  userId="default-user"
                  onVersionSelect={(version) => setResult(version)}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              המערכת לומדת מהשיפורים שלך ומשתפרת עם הזמן
            </p>
          </div>
        </>
      )}

      {/* בוט AI לעזרה */}
      <AIChatBot 
        text={result || ''}
        context={result ? `פוסט ל-${platformInfo[platform].name}` : 'יצירת פוסט'}
        userId="default-user"
      />
    </div>
  );
}