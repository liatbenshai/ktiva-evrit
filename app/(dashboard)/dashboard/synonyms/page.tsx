'use client'

import { useState, useEffect } from 'react'
import { Home, Plus, Search, Edit2, Trash2, Save, X, BookOpen, Download, Upload } from 'lucide-react'
import Link from 'next/link'

export default function SynonymsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [synonyms, setSynonyms] = useState<any[]>([])
  const [newSynonym, setNewSynonym] = useState({
    primary: '',
    alternatives: '',
    category: 'general' as 'formal' | 'informal' | 'academic' | 'business' | 'creative' | 'technical' | 'general',
    context: ''
  })

  // Load synonyms from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user-synonyms')
    if (saved) {
      setSynonyms(JSON.parse(saved))
    }
  }, [])

  // Save synonyms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('user-synonyms', JSON.stringify(synonyms))
  }, [synonyms])

  const categories = [
    { value: 'general', label: 'כללי' },
    { value: 'formal', label: 'פורמלי' },
    { value: 'business', label: 'עסקי' },
    { value: 'academic', label: 'אקדמי' },
    { value: 'creative', label: 'יצירתי' },
    { value: 'technical', label: 'טכני' },
    { value: 'informal', label: 'לא פורמלי' }
  ]

  const handleAddSynonym = () => {
    if (!newSynonym.primary || !newSynonym.alternatives) {
      alert('נא למלא מילה ראשית ומילים נרדפות')
      return
    }

    const alternatives = newSynonym.alternatives.split(',').map(a => a.trim()).filter(a => a)
    
    setSynonyms([...synonyms, {
      id: Date.now().toString(),
      ...newSynonym,
      alternatives,
      context: newSynonym.context.split(',').map(c => c.trim()).filter(c => c)
    }])

    setNewSynonym({
      primary: '',
      alternatives: '',
      category: 'general',
      context: ''
    })
    setIsAdding(false)
  }

  const handleDeleteSynonym = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק?')) {
      setSynonyms(synonyms.filter(s => s.id !== id))
    }
  }

  const handleEditSynonym = (synonym: any) => {
    setEditingId(synonym.id)
    setNewSynonym({
      primary: synonym.primary,
      alternatives: synonym.alternatives.join(', '),
      category: synonym.category,
      context: synonym.context.join(', ')
    })
  }

  const handleSaveEdit = () => {
    if (!newSynonym.primary || !newSynonym.alternatives) {
      alert('נא למלא מילה ראשית ומילים נרדפות')
      return
    }

    const alternatives = newSynonym.alternatives.split(',').map(a => a.trim()).filter(a => a)
    
    setSynonyms(synonyms.map(s => 
      s.id === editingId ? {
        id: s.id,
        primary: newSynonym.primary,
        alternatives,
        category: newSynonym.category,
        context: newSynonym.context.split(',').map(c => c.trim()).filter(c => c)
      } : s
    ))

    setEditingId(null)
    setNewSynonym({
      primary: '',
      alternatives: '',
      category: 'general',
      context: ''
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setNewSynonym({
      primary: '',
      alternatives: '',
      category: 'general',
      context: ''
    })
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(synonyms, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `synonyms-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const imported = JSON.parse(content)
        
        if (Array.isArray(imported)) {
          // Merge with existing synonyms
          const merged = [...synonyms, ...imported.map((item: any) => ({
            ...item,
            id: Date.now().toString() + Math.random()
          }))]
          setSynonyms(merged)
          alert('המידע יובא בהצלחה!')
        } else {
          alert('קובץ לא תקין')
        }
      } catch (error) {
        alert('שגיאה בייבוא הקובץ')
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  const filteredSynonyms = synonyms.filter(s => 
    s.primary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.alternatives.some((alt: string) => alt.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ניהול מילים נרדפות
                </h1>
                <p className="text-gray-600 mt-1">
                  הוסף, ערוך ומחק מילים נרדפות למילון
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              חזרה לדשבורד
            </Link>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חפש מילים נרדפות..."
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
              >
                <Download className="w-5 h-5" />
                ייצא
              </button>
              <label className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium cursor-pointer">
                <Upload className="w-5 h-5" />
                ייבוא
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                <Plus className="w-5 h-5" />
                הוסף
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'ערוך מילה נרדפת' : 'הוסף מילה נרדפת חדשה'}
              </h2>
              <button
                onClick={() => {
                  if (editingId) handleCancelEdit()
                  else setIsAdding(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מילה ראשית <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSynonym.primary}
                  onChange={(e) => setNewSynonym({ ...newSynonym, primary: e.target.value })}
                  placeholder="לדוגמה: חשוב"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מילים נרדפות (הפרד בפסיקים) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSynonym.alternatives}
                  onChange={(e) => setNewSynonym({ ...newSynonym, alternatives: e.target.value })}
                  placeholder="לדוגמה: משמעותי, עיקרי, מרכזי"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="rtl"
                />
                <p className="text-sm text-gray-500 mt-1">
                  הזן מילים נרדפות מופרדות בפסיקים
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קטגוריה
                </label>
                <select
                  value={newSynonym.category}
                  onChange={(e) => setNewSynonym({ ...newSynonym, category: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הקשרים (הפרד בפסיקים)
                </label>
                <input
                  type="text"
                  value={newSynonym.context}
                  onChange={(e) => setNewSynonym({ ...newSynonym, context: e.target.value })}
                  placeholder="לדוגמה: תיאורים, משמעות"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={editingId ? handleSaveEdit : handleAddSynonym}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'שמור שינויים' : 'הוסף'}
                </button>
                <button
                  onClick={() => {
                    if (editingId) handleCancelEdit()
                    else setIsAdding(false)
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Synonyms List */}
        <div className="space-y-4">
          {filteredSynonyms.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                אין מילים נרדפות
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'לא נמצאו תוצאות לחיפוש שלך' : 'התחל להוסיף מילים נרדפות למילון'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  הוסף מילה נרדפת ראשונה
                </button>
              )}
            </div>
          ) : (
            filteredSynonyms.map((synonym) => (
              <div key={synonym.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-blue-600">
                        {synonym.primary}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {categories.find(c => c.value === synonym.category)?.label}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {synonym.alternatives.map((alt: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm">
                          {alt}
                        </span>
                      ))}
                    </div>

                    {synonym.context && synonym.context.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {synonym.context.map((ctx: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {ctx}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSynonym(synonym)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ערוך"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSynonym(synonym.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
