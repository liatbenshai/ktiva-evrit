'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function ClearSynonymsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleClear = async () => {
    if (!confirm('⚠️ האם את בטוחה? זה ימחק את כל המילים הנרדפות מהדאטאבייס!')) return;

    setLoading(true);
    setResult('');
    try {
      const response = await fetch('/api/synonyms/clear', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear');
      }

      const data = await response.json();
      setResult(`✅ הצלחה! נמחקו ${data.count} מילים נרדפות מהדאטאבייס`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`❌ שגיאה במחיקה: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ניקוי מילים נרדפות</h1>
              <p className="text-red-600 font-medium mt-1">⚠️ פעולה זו אינה הפיכה!</p>
            </div>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-red-900 mb-2">אזהרה!</h2>
            <ul className="text-red-800 space-y-1 text-sm">
              <li>• פעולה זו תמחק את כל המילים הנרדפות מהדאטאבייס</li>
              <li>• לא ניתן לשחזר את המידע לאחר המחיקה</li>
              <li>• ודאי שיש לך גיבוי לפני שתמשיכי</li>
            </ul>
          </div>

          <button
            onClick={handleClear}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Trash2 className="w-6 h-6" />
            {loading ? 'מוחק...' : 'מחק את כל המילים הנרדפות'}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-xl ${
              result.includes('✅') 
                ? 'bg-green-50 border-2 border-green-200 text-green-800' 
                : 'bg-red-50 border-2 border-red-200 text-red-800'
            }`}>
              <p className="font-medium">{result}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-gray-200">
            
              href="/dashboard/synonyms"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              ← חזרה לדף מילים נרדפות
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
