'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Calendar, User as UserIcon, Shield, Lock, Unlock, Copy, Check, Trash2, AlertTriangle, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  hasPassword: boolean;
  passwordHash: string | null;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          throw new Error('אין הרשאה - רק אדמין יכול לראות משתמשים');
        }
        throw new Error(data.error || 'שגיאה בטעינת משתמשים');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${userEmail}?\n\nפעולה זו לא ניתנת לביטול וכל הנתונים הקשורים למשתמש יימחקו.`)) {
      return;
    }

    setDeletingUserId(userId);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה במחיקת משתמש');
      }

      // Remove user from list
      setUsers(users.filter(user => user.id !== userId));
      alert(`משתמש ${userEmail} נמחק בהצלחה`);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'שגיאה במחיקת משתמש');
      alert(`שגיאה במחיקת משתמש: ${err.message}`);
    } finally {
      setDeletingUserId(null);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשים</h1>
                <p className="text-gray-600 mt-1">רשימת כל המשתמשים הרשומים במערכת</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/users/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                צור משתמש חדש
              </Link>
              <Link
                href="/dashboard"
                className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
              >
                ← חזרה לדשבורד
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">טוען משתמשים...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                נסה שוב
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
                <p className="text-indigo-900 font-medium">
                  סה"כ משתמשים: <span className="text-2xl font-bold">{users.length}</span>
                </p>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">אין משתמשים רשומים במערכת</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">שם</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">אימייל</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">סטטוס</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">סיסמה</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">תאריך הרשמה</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">עדכון אחרון</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            user.isAdmin ? 'bg-purple-50' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-5 h-5 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {user.name || 'ללא שם'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-700">{user.email}</span>
                              <button
                                onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="העתק אימייל"
                              >
                                {copiedId === `email-${user.id}` ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {user.isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                <Shield className="w-3 h-3" />
                                אדמין
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm">משתמש רגיל</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {user.hasPassword ? (
                                <>
                                  <Lock className="w-4 h-4 text-green-600" />
                                  <span className="text-gray-600 text-xs font-mono">
                                    {user.passwordHash}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(user.passwordHash || '', `hash-${user.id}`)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                    title="העתק hash"
                                  >
                                    {copiedId === `hash-${user.id}` ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-400 text-xs">ללא סיסמה</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-600 text-sm">
                                {formatDate(user.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-600 text-sm">
                              {formatDate(user.updatedAt)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {!user.isAdmin && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                disabled={deletingUserId === user.id}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="מחק משתמש"
                              >
                                {deletingUserId === user.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    מוחק...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4" />
                                    מחק
                                  </>
                                )}
                              </button>
                            )}
                            {user.isAdmin && (
                              <span className="text-gray-400 text-xs">לא ניתן למחוק</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

