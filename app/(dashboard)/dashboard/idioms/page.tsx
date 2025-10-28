'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, BookOpen, Sparkles, Upload, Download, Check } from 'lucide-react';

interface Idiom {
  id: string;
  english: string;
  hebrew: string;
  category?: string;
  learned?: boolean;
  createdAt: string;
}

export default function IdiomsPage() {
  const [idioms, setIdioms] = useState<Idiom[]>([]);
  const [newEnglish, setNewEnglish] = useState('');
  const [newHebrew, setNewHebrew] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editHebrew, setEditHebrew] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIdioms();
  }, []);

  const fetchIdioms = async () => {
    try {
      const response = await fetch('/api/idioms');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setIdioms(data);
    } catch (error) {
      console.error('Error fetching idioms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnglish.trim() || !newHebrew.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/idioms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          english: newEnglish,
          hebrew: newHebrew,
          category: 'ביטוי',
          learned: false
        }),
      });

      if (!response.ok) throw new Error('Failed to create');
      
      await fetchIdioms();
      setNewEnglish('');
      setNewHebrew('');
    } catch (error) {
      console.error('Error creating idiom:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם את בטוחה שברצונך למחוק את הביטוי הזה?')) return;

    try {
      const response = await fetch(`/api/idioms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      await fetchIdioms();
    } catch (error) {
      console.error('Error deleting idiom:', error);
    }
  };

  const startEdit = (idiom: Idiom) => {
    setEditingId(idiom.id);
    setEditEnglish(idiom.english);
    setEditHebrew(idiom.hebrew);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEnglish('');
    setEditHebrew('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editEnglish.trim() || !editHebrew.trim()) return;
    
    try {
      const response = await fetch(`/api/idioms/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          english: editEnglish,
          hebrew: editHebrew
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      await fetchIdioms();
      setEditingId(null);
      setEditEnglish('');
      setEditHebrew('');
    } catch (error) {
      console.error('Error updating idiom:', error);
    }
  };

  const toggleLearned = async (idiom: Idiom) => {
    try {
      const response = await fetch(`/api/idioms/${idiom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          learned: !idiom.learned
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      await fetchIdioms();
    } catch (error) {
      console.error('Error updating learned status:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('הקובץ חייב להכיל מערך של ביטויים');
      }

      let successCount = 0;
      for (const item of data) {
        if (item.english && item.hebrew) {
          const response = await fetch('/api/idioms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              english: item.english,
              hebrew: item.hebrew,
              category: item.category || 'ביטוי',
              learned: item.learned || false
            }),
          });
          if (response.ok) successCount++;
        }
      }
      
      await fetchIdioms();
      alert(`${successCount} ביטויים נטענו בהצלחה!`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('שגיאה בטעינת הקובץ. וודאי שהפורמט נכון');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleExport = () => {
    const exportData = idioms.map(({ createdAt, ...rest }) => rest);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `idioms-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                תיקון ביטויים מאנגלית לעברית
              </h1>
              <p className="text-gray-600 mt-1">מאגר תרגומים נכונים מאנגלית לעברית תקנית</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <h2 className="text-2xl font-bold text-gray-800">הוסיפי תרגום חדש</h2>
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
                disabled={idioms.length === 0}
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
                ביטוי באנגלית
              </label>
              <input
                type="text"
                value={newEnglish}
                onChange={(e) => setNewEnglish(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="e.g., take into account"
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תרגום נכון לעברית
              </label>
              <input
                type="text"
                value={newHebrew}
                onChange={(e) => setNewHebrew(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="לקחת בחשבון"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {loading ? 'מוסיפה...' : 'הוסיפי תרגום'}
            </button>
          </form>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">רשימת תרגומים ({idioms.length})</h2>
            <div className="text-sm text-gray-600">
              נלמדו: {idioms.filter(i => i.learned).length} | לא נלמדו: {idioms.filter(i => !i.learned).length}
            </div>
          </div>
          
          {idioms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">אין עדיין תרגומים במאגר</p>
              <p className="text-gray-400 mt-2">הוסיפי את התרגום הראשון או ייבאי קובץ JSON</p>
            </div>
          ) : (
            <div className="space-y-4">
              {idioms.map((idiom) => (
                <div
                  key={idiom.id}
                  className={`group border rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${
                    idiom.learned 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                  }`}
                >
                  {editingId === idiom.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editEnglish}
                        onChange={(e) => setEditEnglish(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="English"
                        dir="ltr"
                      />
                      <input
                        type="text"
                        value={editHebrew}
                        onChange={(e) => setEditHebrew(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="עברית"
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
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full">EN</span>
                          <p className="text-lg font-medium text-gray-700" dir="ltr">{idiom.english}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">HE</span>
                          <p className="text-lg font-bold text-blue-600">{idiom.hebrew}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => toggleLearned(idiom)}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                              idiom.learned
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {idiom.learned ? '✓ נלמד' : 'סמן כנלמד'}
                          </button>
                          <span className="text-xs text-gray-400">
                            {new Date(idiom.createdAt).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(idiom)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          title="ערוך"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(idiom.id)}
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
