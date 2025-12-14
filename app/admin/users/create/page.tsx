'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [createdUser, setCreatedUser] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'שגיאה ביצירת משתמש');
        setLoading(false);
      } else {
        setSuccess(true);
        setCreatedUser({
          email: data.user.email,
          password: formData.password, // שמירת הסיסמה המקורית להצגה
          name: data.user.name || '',
        });
        setFormData({ email: '', password: '', name: '' });
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError('שגיאה: ' + (err.message || 'שגיאה לא צפויה'));
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <UserPlus className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">יצירת משתמש חדש</h1>
              <p className="text-gray-600 mt-1">הוסיפי משתמש חדש למערכת</p>
            </div>
          </div>

          {success && createdUser && (
            <div className="mb-6 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-green-900 mb-2">✅ המשתמש נוצר בהצלחה!</p>
                  <div className="bg-white p-4 rounded-lg border border-green-200 space-y-2">
                    <p className="text-sm text-gray-600 mb-2">פרטי המשתמש:</p>
                    <p className="text-gray-900 font-mono text-sm">
                      <strong>אימייל:</strong> {createdUser.email}
                    </p>
                    {createdUser.name && (
                      <p className="text-gray-900 font-mono text-sm">
                        <strong>שם:</strong> {createdUser.name}
                      </p>
                    )}
                    <p className="text-gray-900 font-mono text-sm">
                      <strong>סיסמה:</strong> {createdUser.password}
                    </p>
                  </div>
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ שמרי את הפרטים האלה במקום בטוח! המשתמש יוכל להתחבר עם האימייל והסיסמה האלה.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                שם מלא (אופציונלי)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="הכנס שם מלא"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                אימייל <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="מינימום 6 תווים"
              />
              <p className="mt-1 text-xs text-gray-500">הסיסמה תוצג לך פעם אחת אחרי יצירת המשתמש</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'יוצר...' : 'צור משתמש'}
              </button>
              <Link
                href="/admin/users"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                ביטול
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
            <Link
              href="/admin/users"
              className="block text-center text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימת המשתמשים
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

