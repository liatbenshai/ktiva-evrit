'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, BookOpen, Sparkles } from 'lucide-react';

interface Idiom {
  id: string;
  hebrew: string;
  createdAt: string;
}

export default function IdiomsPage() {
  const [idioms, setIdioms] = useState<Idiom[]>([]);
  const [newHebrew, setNewHebrew] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
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
    if (!newHebrew.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/idioms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hebrew: newHebrew
        }),
      });

      if (!response.ok) throw new Error('Failed to create');
      
      await fetchIdioms();
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
    setEditText(idiom.hebrew);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    
    try {
      const response = await fetch(`/api/idioms/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hebrew: editText
        }),
      });

      if (!response.ok) throw new Error('Failed to update');
      
      await fetchIdioms();
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating idiom:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ניהול ביטויים
              </h1>
              <p className="text-gray-600 mt-1">מאגר ביטויים בעברית</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add New Idiom Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-cyan-500" />
            <h2 className="text-2xl font-bold text-gray-800">הוסיפי ביטוי חדש</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ביטוי בעברית
              </label>
              <input
                type="text"
                value={newHebrew}
                onChange={(e) => setNewHebrew(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="הזיני ביטוי בעברית..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {loading ? 'מוסיפה...' : 'הוסיפי ביטוי'}
            </button>
          </form>
        </div>

        {/* Idioms List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">רשימת ביטויים</h2>
          
          {idioms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">אין עדיין ביטויים במאגר</p>
              <p className="text-gray-400 mt-2">הוסיפי את הביטוי הראשון שלך למעלה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {idioms.map((idiom) => (
                <div
                  key={idiom.id}
                  className="group bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                >
                  {editingId === idiom.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
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
                        <p className="text-lg font-medium text-gray-800">{idiom.hebrew}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          נוצר: {new Date(idiom.createdAt).toLocaleDateString('he-IL')}
                        </p>
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
