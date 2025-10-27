'use client'

import { useState, useEffect } from 'react'
import { Home, BookOpen, CheckCircle, XCircle, RefreshCw, Plus, Edit3, Trash2, Download, Upload } from 'lucide-react'
import Link from 'next/link'

interface Idiom {
  id: string
  english: string
  hebrew: string
  category: string
  learned: boolean
}

interface ImportFile {
  idioms: Idiom[]
}

export default function IdiomsPage() {
  const [currentIdiom, setCurrentIdiom] = useState<Idiom | null>(null)
  const [correctedText, setCorrectedText] = useState('')
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<Idiom[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newIdiom, setNewIdiom] = useState({ english: '', hebrew: '', category: 'ביטוי' })
  const [userIdioms, setUserIdioms] = useState<Idiom[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // Sample idioms database
  const idiomsDatabase: Idiom[] = [
    { id: '1', english: 'To take into account', hebrew: 'להביא בחשבון', category: 'ביטוי', learned: false },
    { id: '2', english: 'In the meantime', hebrew: 'בינתיים', category: 'זמן', learned: false },
    { id: '3', english: 'On the other hand', hebrew: 'מצד שני', category: 'ניגוד', learned: false },
    { id: '4', english: 'In other words', hebrew: 'במילים אחרות', category: 'הסבר', learned: false },
    { id: '5', english: 'As a matter of fact', hebrew: 'למעשה', category: 'עובדות', learned: false },
    { id: '6', english: 'All in all', hebrew: 'בסך הכל', category: 'סיכום', learned: false },
    { id: '7', english: 'As long as', hebrew: 'כל עוד', category: 'תנאי', learned: false },
    { id: '8', english: 'In order to', hebrew: 'על מנת', category: 'מטרה', learned: false },
    { id: '9', english: 'In addition', hebrew: 'בנוסף', category: 'הוספה', learned: false },
    { id: '10', english: 'On purpose', hebrew: 'במכוון', category: 'כוונה', learned: false },
  ]

  // Load user idioms from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user-idioms')
    if (saved) {
      setUserIdioms(JSON.parse(saved))
    }
  }, [])

  // Save user idioms to localStorage
  useEffect(() => {
    if (userIdioms.length > 0) {
      localStorage.setItem('user-idioms', JSON.stringify(userIdioms))
    }
  }, [userIdioms])

  const allIdioms = [...idiomsDatabase, ...userIdioms]

  const getRandomIdiom = () => {
    const unlearnedIdioms = allIdioms.filter(idiom => !learnedIds.has(idiom.id))
    if (unlearnedIdioms.length === 0) {
      setLearnedIds(new Set())
      return allIdioms[Math.floor(Math.random() * allIdioms.length)]
    }
    return unlearnedIdioms[Math.floor(Math.random() * unlearnedIdioms.length)]
  }

  const handleShowIdiom = () => {
    const idiom = getRandomIdiom()
    setCurrentIdiom(idiom)
    setCorrectedText('')
  }

  const handleLearned = () => {
    if (currentIdiom && correctedText.trim()) {
      // Save the corrected translation
      const correctedIdiom = {
        ...currentIdiom,
        hebrew: correctedText.trim(),
        learned: true
      }
      
      setLearnedIds(new Set([...learnedIds, currentIdiom.id]))
      setHistory([...history, correctedIdiom])
      setCurrentIdiom(null)
      setCorrectedText('')
    }
  }

  const handleNotLearned = () => {
    if (currentIdiom) {
      setHistory([...history, { ...currentIdiom, learned: false }])
      setCurrentIdiom(null)
      setCorrectedText('')
    }
  }

  const handleAddIdiom = () => {
    if (!newIdiom.english || !newIdiom.hebrew) {
      alert('נא למלא ביטוי באנגלית ובעברית')
      return
    }

    const idiom: Idiom = {
      id: Date.now().toString(),
      english: newIdiom.english,
      hebrew: newIdiom.hebrew,
      category: newIdiom.category,
      learned: false
    }

    setUserIdioms([...userIdioms, idiom])
    setShowAddForm(false)
    setNewIdiom({ english: '', hebrew: '', category: 'ביטוי' })
    setIsEditing(false)
  }

  const handleEditIdiom = (idiom: Idiom) => {
    setCurrentIdiom(idiom)
    setShowAddForm(true)
    setNewIdiom({
      english: idiom.english,
      hebrew: idiom.hebrew,
      category: idiom.category
    })
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!currentIdiom) return

    const updated = userIdioms.map(idiom =>
      idiom.id === currentIdiom.id
        ? { ...idiom, ...newIdiom }
        : idiom
    )
    setUserIdioms(updated)
    setShowAddForm(false)
    setCurrentIdiom(null)
    setIsEditing(false)
    setNewIdiom({ english: '', hebrew: '', category: 'ביטוי' })
  }

  const handleDeleteIdiom = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק?')) {
      setUserIdioms(userIdioms.filter(i => i.id !== id))
      // Also remove from learned
      setLearnedIds(new Set(Array.from(learnedIds).filter(i => i !== id)))
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(userIdioms, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `idioms-${new Date().toISOString().split('T')[0]}.json`
    
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
        
        let idiomsToImport: Idiom[] = []
        
        // Check if it's an array directly or an object with idioms property
        if (Array.isArray(imported)) {
          idiomsToImport = imported
        } else if (imported.idioms && Array.isArray(imported.idioms)) {
          idiomsToImport = imported.idioms
        } else {
          alert('קובץ לא תקין - צריך להיות מערך או אובייקט עם תכונת idioms')
          return
        }

        // Merge with existing idioms, adding proper IDs
        const merged = [...userIdioms, ...idiomsToImport.map((item: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          english: item.english || '',
          hebrew: item.hebrew || '',
          category: item.category || 'ביטוי',
          learned: false
        }))]
        
        setUserIdioms(merged)
        alert(`יובאו ${idiomsToImport.length} ביטויים בהצלחה!`)
      } catch (error) {
        console.error('Import error:', error)
        alert('שגיאה בייבוא הקובץ: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  const getProgress = () => {
    return Math.round((learnedIds.size / allIdioms.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🎓 למידת פתגמים ומטבעות לשון
              </h1>
              <p className="text-gray-600 mt-1">
                למד את המערכת לתרגום נכון של פתגמים באנגלית לעברית תקנית
              </p>
              <p className="text-sm text-blue-600 mt-1">
                💡 יבא קובץ JSON עם ביטויים - כל ביטוי יכלול: english, hebrew, category
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleExport}
                disabled={userIdioms.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                ייצא
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all cursor-pointer">
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
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                הוסף ביטוי
              </button>
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                חזרה לדשבורד
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'ערוך תרגום' : 'הוסף ביטוי חדש'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setIsEditing(false)
                  setNewIdiom({ english: '', hebrew: '', category: 'ביטוי' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ביטוי באנגלית *
                </label>
                <input
                  type="text"
                  value={newIdiom.english}
                  onChange={(e) => setNewIdiom({ ...newIdiom, english: e.target.value })}
                  placeholder="To take into account"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תרגום בעברית תקנית *
                </label>
                <input
                  type="text"
                  value={newIdiom.hebrew}
                  onChange={(e) => setNewIdiom({ ...newIdiom, hebrew: e.target.value })}
                  placeholder="להביא בחשבון"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קטגוריה
                </label>
                <select
                  value={newIdiom.category}
                  onChange={(e) => setNewIdiom({ ...newIdiom, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>ביטוי</option>
                  <option>זמן</option>
                  <option>ניגוד</option>
                  <option>הסבר</option>
                  <option>עובדות</option>
                  <option>סיכום</option>
                  <option>תנאי</option>
                  <option>מטרה</option>
                  <option>הוספה</option>
                  <option>כוונה</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={isEditing ? handleSaveEdit : handleAddIdiom}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {isEditing ? 'שמור שינויים' : 'הוסף'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setIsEditing(false)
                    setNewIdiom({ english: '', hebrew: '', category: 'ביטוי' })
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">התקדמות הלמידה</h2>
              <span className="text-2xl font-bold text-blue-600">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <p className="text-gray-600 mt-2">
              למדת {learnedIds.size} מתוך {allIdioms.length} פתגמים
            </p>
          </div>
        </div>

        {/* Current Idiom Card */}
        {!currentIdiom ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-8xl mb-6">📖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              מוכן להתחיל ללמד?
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              המערכת תציג לך ביטוי באנגלית, ואתה יכול ללמד את התרגום הנכון.
            </p>
            <button
              onClick={handleShowIdiom}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-lg"
            >
              <BookOpen className="w-6 h-6" />
              התחל ללמד
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Idiom Card */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-8">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                  {currentIdiom.category}
                </div>
                
                <h3 className="text-4xl font-bold text-gray-900 mb-8" dir="ltr">
                  {currentIdiom.english}
                </h3>
                
                <p className="text-gray-600 text-lg mb-6">
                  תרגם את הביטוי לעברית תקנית:
                </p>
                
                <input
                  type="text"
                  value={correctedText}
                  onChange={(e) => setCorrectedText(e.target.value)}
                  placeholder="הזן תרגום נכון..."
                  className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-2xl font-bold text-blue-700 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                  dir="rtl"
                  autoFocus
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleNotLearned}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-medium text-lg"
              >
                <XCircle className="w-6 h-6" />
                לא נכון - תקן את התרגום
              </button>
              <button
                onClick={handleLearned}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all font-medium text-lg"
              >
                <CheckCircle className="w-6 h-6" />
                נכון! למדתי
              </button>
              <button
                onClick={handleShowIdiom}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                דלג
              </button>
            </div>
          </div>
        )}

        {/* User Idіoms List */}
        {userIdioms.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">הביטויים שלך</h2>
            <div className="space-y-3">
              {userIdioms.map((idiom) => (
                <div key={idiom.id} className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900" dir="ltr">{idiom.english}</p>
                    <p className="text-gray-600" dir="rtl">{idiom.hebrew}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {idiom.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditIdiom(idiom)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ערוך"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteIdiom(idiom.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">היסטוריית למידה</h2>
            <div className="space-y-3">
              {history.slice(-10).reverse().map((idiom) => (
                <div 
                  key={idiom.id} 
                  className={`bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between ${
                    idiom.learned ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {idiom.learned ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900" dir="ltr">{idiom.english}</p>
                      <p className="text-gray-600" dir="rtl">{idiom.hebrew}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}