'use client';

import { useState } from 'react';
import { Wand2, CheckCircle, Target, Lightbulb, Loader2, MessageSquare } from 'lucide-react';

interface ImprovementButtonsProps {
  content: string;
  documentType: string;
  onImprove: (improvedText: string, improveType: string) => void;
}

export default function ImprovementButtons({
  content,
  documentType,
  onImprove,
}: ImprovementButtonsProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  const handleImprove = async (type: 'improve' | 'fix' | 'refine' | 'suggest' | 'custom', customText?: string) => {
    if (!content.trim()) return;

    setIsImproving(true);
    setActiveType(type);

    try {
      let instructions = '';
      
      if (type === 'custom' && customText) {
        instructions = customText;
      } else {
        switch (type) {
          case 'improve':
            instructions = 'שפר את הטקסט הזה - הפוך אותו לזורם יותר, ברור יותר, ומקצועי יותר. שמור על המסר המקורי.';
            break;
          case 'fix':
            instructions = 'תקן שגיאות דקדוק, כתיב, וניסוח בטקסט הזה. אל תשנה את המסר, רק תקן טעויות.';
            break;
          case 'refine':
            instructions = 'דייק את הטקסט - הפוך משפטים מעורפלים לברורים, הוסף דוגמאות אם חסר, הסר מילות מילוי מיותרות.';
            break;
          case 'suggest':
            instructions = 'הצע 3 גרסאות משופרות של הטקסט, כל אחת עם גישה שונה. סמן כל גרסה בבירור.';
            break;
        }
      }

      const response = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'improve',
          data: {
            text: content,
            instructions,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed');

      const { result } = await response.json();
      
      // שמירה ללמידה
      await fetch('/api/learning/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          originalText: content,
          editedText: result,
          editType: type,
        }),
      });

      onImprove(result, type);
      
      // Clear custom instructions after use
      if (type === 'custom') {
        setCustomInstructions('');
        setShowCustom(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('אירעה שגיאה בשיפור הטקסט');
    } finally {
      setIsImproving(false);
      setActiveType(null);
    }
  };

  const buttons = [
    {
      type: 'improve' as const,
      icon: Wand2,
      label: 'שפר',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'שיפור כללי',
    },
    {
      type: 'fix' as const,
      icon: CheckCircle,
      label: 'תקן',
      color: 'bg-green-600 hover:bg-green-700',
      description: 'תיקון שגיאות',
    },
    {
      type: 'refine' as const,
      icon: Target,
      label: 'דייק',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'דיוק והבהרה',
    },
    {
      type: 'suggest' as const,
      icon: Lightbulb,
      label: 'הצע',
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'הצעות לשיפור',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Standard Buttons */}
      <div className="flex flex-wrap gap-3">
        {buttons.map((button) => {
          const Icon = button.icon;
          const isActive = activeType === button.type;
          
          return (
            <button
              key={button.type}
              onClick={() => handleImprove(button.type)}
              disabled={isImproving || !content.trim()}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                isActive ? 'ring-2 ring-offset-2 ring-blue-500' : button.color
              }`}
              title={button.description}
            >
              {isActive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              {button.label}
            </button>
          );
        })}

        {/* Custom Instructions Button */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          disabled={isImproving || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          title="הוראות מותאמות אישית"
        >
          <MessageSquare className="w-4 h-4" />
          הסבר מה לשפר
        </button>
      </div>

      {/* Custom Instructions Panel */}
      {showCustom && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הסבר בדיוק מה לשפר ואיך:
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder='לדוגמה: "הפוך את הטקסט ליותר פורמלי", "קצר את המשפטים", "הוסף דוגמאות קונקרטיות", "שנה את הטון להיות יותר ידידותי"...'
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleImprove('custom', customInstructions)}
              disabled={isImproving || !customInstructions.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {activeType === 'custom' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  משפר...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  שפר לפי ההוראות
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowCustom(false);
                setCustomInstructions('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}