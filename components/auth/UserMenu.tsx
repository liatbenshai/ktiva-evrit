'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'

interface UserData {
  id: string
  name: string | null
  email: string
}

export default function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
      >
        <User className="w-4 h-4" />
        <span className="text-sm font-medium">התחבר</span>
      </a>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.name || user.email}
        </span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name || 'משתמש'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </button>
          </div>
        </>
      )}
    </div>
  )
}

