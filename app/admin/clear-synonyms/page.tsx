'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function ClearSynonymsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleClear = async () => {
    if (!confirm('האם את בטוחה? זה ימחק את כל המילים הנרדפות!')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/synonyms/clear', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to clear');

      const data = await response.json();
      setResult(`✅ נמחקו ${data.count} מילים נרדפות`);
    } catch (error) {
      setResult('❌ שגיאה במחיקה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">ניקוי מילים נרדפות</h1>
        
        <button
          onClick={handleClear}
          disabled={loading}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          {loading ? 'מוחק...' : 'מחק את כל המילים הנרדפות'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
