'use client';

import { useState, useEffect } from 'react';
import { Home, Trash2, TrendingUp, BookOpen, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface LearnedPattern {
  id: string;
  badPattern: string;
  goodPattern: string;
  confidence: number;
  occurrences: number;
  patternType: string;
  createdAt: string;
  updatedAt: string;
}

export default function LearnedPatternsPage() {
  const [patterns, setPatterns] = useState<LearnedPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ai-style'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBadPattern, setNewBadPattern] = useState('');
  const [newGoodPattern, setNewGoodPattern] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPatterns();
  }, [filter]);

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai-correction/patterns?filter=${filter}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.details || errorData.error || `HTTP ${response.status}`;
        console.error('Error fetching patterns:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch patterns');
      }
      
      setPatterns(data.patterns || []);
      
      // אם אין דפוסים, נציג הודעה ברורה
      if (!data.patterns || data.patterns.length === 0) {
        console.warn('⚠️ לא נמצאו דפוסים במסד הנתונים');
        console.warn('אפשרויות:');
        console.warn('1. עדיין לא שמרת דפוסים - נסי לבחור הצעה או לשנות טקסט');
        console.warn('2. בעיה עם מסד הנתונים - SQLite לא מתאים ל-Vercel production');
        console.warn('3. בדקי את הקונסולה של השרת (Vercel logs) לראות שגיאות');
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`שגיאה בטעינת הדפוסים: ${errorMessage}`);
      // במקרה של שגיאה, נציג רשימה ריקה כדי שלא נשבור את ה-UI
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק את הדפוס הזה?')) return;

    try {
      const response = await fetch(`/api/ai-correction/patterns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      await fetchPatterns();
    } catch (error) {
      console.error('Error deleting pattern:', error);
      alert('שגיאה במחיקת הדפוס');
    }
  };

  const stats = {
    total: patterns.length,
    aiStyle: patterns.filter(p => p.patternType === 'ai-style').length,
    highConfidence: patterns.filter(p => p.confidence >= 0.8).length,
    totalOccurrences: patterns.reduce((sum, p) => sum + p.occurrences, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                📚 דפוסים שנלמדו
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                כל השינויים הנקודתיים ששמרת - המערכת משתמשת בהם כדי לשפר את התיקונים
              </p>
            </div>
            <Link
              href="/dashboard/ai-correction"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              חזרה לתיקון AI
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">סה"כ דפוסים</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">דפוסי AI</p>
                <p className="text-2xl font-bold text-purple-600">{stats.aiStyle}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ביטחון גבוה</p>
                <p className="text-2xl font-bold text-green-600">{stats.highConfidence}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">שימושים כולל</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalOccurrences}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* פילטר והוספת דפוס */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilter('ai-style')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ai-style'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              רק דפוסי AI
            </button>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            {showAddForm ? 'ביטול' : 'הוסף דפוס חדש'}
          </button>
        </div>

        {/* טופס הוספת דפוס */}
        {showAddForm && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-900">📝 הוסף דפוס חדש</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-purple-100 rounded"
              >
                <X className="w-5 h-5 text-purple-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  דפוס בעייתי (AI-style) - מה שאת רוצה להימנע:
                </label>
                <textarea
                  value={newBadPattern}
                  onChange={(e) => setNewBadPattern(e.target.value)}
                  placeholder="לדוגמה: להביא בחשבון, מהווה, בסוף היום..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  דפוס נכון (עברית תקנית) - מה שאת רוצה במקום:
                </label>
                <textarea
                  value={newGoodPattern}
                  onChange={(e) => setNewGoodPattern(e.target.value)}
                  placeholder="לדוגמה: לקחת בחשבון, הוא, בסופו של דבר..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAddPattern}
                  disabled={isSaving || !newBadPattern.trim() || !newGoodPattern.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'שומר...' : 'שמור דפוס'}
                </button>
                <button
                  onClick={() => {
                    setNewBadPattern('');
                    setNewGoodPattern('');
                    setShowAddForm(false);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                >
                  ביטול
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* רשימת דפוסים */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">טוען דפוסים...</p>
          </div>
        ) : patterns.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">אין עדיין דפוסים שנשמרו</p>
            <p className="text-gray-400 mt-2">
              כשתשמרי תיקונים נקודתיים, הם יופיעו כאן
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <Card key={pattern.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pattern.patternType === 'ai-style'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {pattern.patternType === 'ai-style' ? 'דפוס AI' : pattern.patternType}
                      </span>
                      <span className="text-sm text-gray-500">
                        ביטחון: {Math.round(pattern.confidence * 100)}%
                      </span>
                      <span className="text-sm text-gray-500">
                        שימושים: {pattern.occurrences}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-lg">
                      <span className="text-red-600 font-medium line-through px-3 py-2 bg-red-50 rounded-lg">
                        {pattern.badPattern}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-medium px-3 py-2 bg-green-50 rounded-lg">
                        {pattern.goodPattern}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      נוצר: {new Date(pattern.createdAt).toLocaleDateString('he-IL')}
                      {pattern.updatedAt !== pattern.createdAt && (
                        <span> • עודכן: {new Date(pattern.updatedAt).toLocaleDateString('he-IL')}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(pattern.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="מחק דפוס"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* הסבר */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-lg font-bold mb-3">📖 איך זה עובד?</h3>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>איפה נשמרים השינויים?</strong><br />
              כל תיקון נקודתי שאת שומרת נשמר ב-<code className="bg-gray-200 px-2 py-1 rounded">TranslationPattern</code> במסד הנתונים עם סוג <code className="bg-gray-200 px-2 py-1 rounded">ai-style</code>.
            </p>
            <p>
              <strong>איך המערכת משתמשת בהם?</strong><br />
              כשמנתחים טקסט חדש, המערכת טוענת את כל הדפוסים שנשמרו (עם ביטחון ≥70%) ומשתמשת בהם כדי:
            </p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>לזהות ביטויי AI דומים בטקסט חדש</li>
              <li>להציע תיקונים מבוססי דפוסים שלמדה</li>
              <li>להוריד ציון לטקסטים עם ביטויי AI מוכרים</li>
              <li>להציע חלופות עבריות טובות יותר</li>
            </ul>
            <p>
              <strong>הערה:</strong> השינויים נשמרים ב-<code className="bg-gray-200 px-2 py-1 rounded">TranslationPattern</code> ולא ב-<code className="bg-gray-200 px-2 py-1 rounded">Synonym</code>. 
              זה מאפשר למערכת ללמוד דפוסים ספציפיים של תיקונים ולא רק מילים נרדפות כלליות.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

