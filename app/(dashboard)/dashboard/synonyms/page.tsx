'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, BookOpen, Sparkles, Upload, Download } from 'lucide-react';

interface Synonym {
  id: string;
  primary: string;
  alternatives: string[];
  category?: string;
  context?: string[];
  createdAt: string;
}

export default function SynonymsPage() {
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);
  const [newPrimary, setNewPrimary] = useState('');
  const [newAlternatives, setNewAlternatives] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrimary, setEditPrimary] = useState('');
  const [editAlternatives, setEditAlternatives] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSynonyms();
  }, []);

  const fetchSynonyms = async () => {
    try {
      const response = await fetch('/api/synonyms');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSynonyms(data);
    } catch (error) {
      console.error('Error fetching synonyms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrimary.trim() || !newAlternatives.trim()) return;

    setLoading(true);
    try {
      const alternativesArray = newAlternatives
        .split(',')
        .map(alt => alt.trim())
        .filter(alt => alt.length > 0);

      const response = await fetch('/api/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          primary: newPrimary,
          alternatives: alternativesArray,
          category: 'general',
          context: []
        }),
      });

      if (!response.ok) throw new Error('Failed to create');
      
      await fetchSynonyms();
      setNewPrimary('');
      setNewAlternatives('');
    } catch (error) {
      console.error('Error creating synonym:', error);
      alert('שגיאה ביצירת מילים נרדפות');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק את קבוצת המילים הנרדפות הזו?')) return;

    try {
      const response = await fetch(`/api/synonyms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      await fetchSynonyms();
    } catch (error) {
      console.error('Error deleting synonym:', error);
      alert('שגיאה במחיקת מילים נרדפות');
    }
  };

  const startEdit = (synonym: Synonym) => {
    setEditingId(synonym.id);
    setEditPrimary(synonym.primary);
    setEditAlternatives(synonym.alternatives.join(', '));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrimary('');
    setEditAlternatives('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editPrimary.trim() || !editAlternatives.trim()) return;
    
    try {
      const alternativesArray = editAlternatives
        .split(',')
        .map(alt => alt.trim())
        .filter(alt => alt.length > 0);

      const response = await fetch(`/api/synonyms/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          primary: editPrimary,
          alternatives: alternativesArray
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      await fetchSynonyms();
      setEditingId(null);
      setEditPrimary('');
      setEditAlternatives('');
    } catch (error) {
      console.error('Error updating synonym:', error);
      alert('שגיאה בעדכון מילים נרדפות');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // בדיקת סוג קובץ
    if (!file.name.endsWith('.json')) {
      alert('ניתן להעלות רק קבצי JSON (.json)');
      event.target.value = '';
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`שגיאה בפענוח JSON: ${parseError instanceof Error ? parseError.message : 'שגיאה לא ידועה'}`);
      }
      
      if (!Array.isArray(data)) {
        throw new Error('הקובץ חייב להכיל מערך של מילים נרדפות. הפורמט הנדרש: [{"primary": "...", "alternatives": ["...", "..."], "category": "..."}]');
      }
      
      if (data.length === 0) {
        throw new Error('הקובץ ריק - אין מילים נרדפות להעלות');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of data) {
        try {
          // Normalize alternatives - handle both string and array
          let alternativesArray: string[];
          
          if (typeof item.alternatives === 'string') {
            // If it's a string, try to parse it as JSON
            try {
              alternativesArray = JSON.parse(item.alternatives);
            } catch {
              // If parsing fails, split by comma
              alternativesArray = item.alternatives.split(',').map((s: string) => s.trim());
            }
          } else if (Array.isArray(item.alternatives)) {
            alternativesArray = item.alternatives;
          } else {
            console.warn('Invalid alternatives format:', item);
            errorCount++;
            continue;
          }

          // Normalize context - handle both string and array
          let contextArray: string[] = [];
          
          if (item.context) {
            if (typeof item.context === 'string') {
              try {
                contextArray = JSON.parse(item.context);
              } catch {
                contextArray = [item.context];
              }
            } else if (Array.isArray(item.context)) {
              contextArray = item.context;
            }
          }

          if (!item.primary || typeof item.primary !== 'string' || item.primary.trim().length === 0) {
            console.warn('Missing or invalid primary:', item);
            errorCount++;
            continue;
          }

          if (alternativesArray.length === 0) {
            console.warn('No alternatives for item:', item);
            errorCount++;
            continue;
          }

          const response = await fetch('/api/synonyms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              primary: item.primary.trim(),
              alternatives: alternativesArray,
              category: item.category || 'general',
              context: contextArray
            }),
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorText = await response.text();
            console.error(`Failed to create synonym "${item.primary}":`, errorText);
            try {
              const errorData = JSON.parse(errorText);
              console.error('Error details:', errorData);
            } catch {
              // אם לא ניתן לפרש את השגיאה, נמשיך
            }
          }
        } catch (itemError) {
          console.error('Error processing item:', itemError);
          errorCount++;
        }
      }
      
      await fetchSynonyms();
      
      if (errorCount > 0) {
        const message = `הושלם עם שגיאות:\n✓ ${successCount} נוצרו בהצלחה\n✗ ${errorCount} נכשלו\n\nפרטי השגיאות מופיעים בקונסולה (F12)`;
        alert(message);
      } else {
        alert(`✅ ${successCount} קבוצות מילים נרדפות נטענו בהצלחה!`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      alert(`❌ שגיאה בטעינת הקובץ:\n\n${errorMessage}\n\nאנא ודאי שהקובץ בפורמט JSON תקין וכולל מערך של אובייקטים עם השדות: primary, alternatives`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleExport = () => {
    const exportData = synonyms.map(({ createdAt, ...rest }) => rest);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synonyms-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                מילים נרדפות
              </h1>
              <p className="text-gray-600 mt-1">מאגר מילים נרדפות בעברית - צורה מועדפת וחלופות</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-500" />
              <h2 className="text-2xl font-bold text-gray-800">הוסיפי קבוצת מילים נרדפות</h2>
            </div>
            
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-5 h-5" />
                ייבוא
              </label>
              
              <button
                onClick={handleExport}
                disabled={synonyms.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                ייצוא
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                צורה מועדפת (נכונה)
              </label>
              <input
                type="text"
                value={newPrimary}
                onChange={(e) => setNewPrimary(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="לקחת בחשבון"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                צורות חלופיות (מופרדות בפסיקים)
              </label>
              <input
                type="text"
                value={newAlternatives}
                onChange={(e) => setNewAlternatives(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="להביא בחשבון, לשים לב"
                required
              />
              <p className="text-xs text-gray-500 mt-1">הפרידי בין המילים הנרדפות בפסיק</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {loading ? 'מוסיפה...' : 'הוסיפי קבוצה'}
            </button>
          </form>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">רשימת מילים נרדפות ({synonyms.length})</h2>
          
          {synonyms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">אין עדיין מילים נרדפות במאגר</p>
              <p className="text-gray-400 mt-2">הוסיפי את הקבוצה הראשונה או ייבאי קובץ JSON</p>
            </div>
          ) : (
            <div className="space-y-4">
              {synonyms.map((synonym) => (
                <div
                  key={synonym.id}
                  className="group bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                >
                  {editingId === synonym.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editPrimary}
                        onChange={(e) => setEditPrimary(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="צורה מועדפת"
                      />
                      <input
                        type="text"
                        value={editAlternatives}
                        onChange={(e) => setEditAlternatives(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="חלופות (מופרדות בפסיקים)"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          שמירה
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3">
                          <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">✓ מועדף</span>
                          <p className="text-xl font-bold text-purple-600 mt-2">{synonym.primary}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">חלופות</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {synonym.alternatives.map((alt, index) => (
                              <span 
                                key={index}
                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm"
                              >
                                {alt}
                              </span>
                            ))}
                          </div>
                        </div>
                        {synonym.context && synonym.context.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">הקשר: {synonym.context.join(', ')}</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-400 mt-3">
                          {new Date(synonym.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(synonym)}
                          className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                          title="ערוך"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(synonym.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
