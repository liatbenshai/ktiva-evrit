'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function CheckAdminPage() {
  const { data: session, status } = useSession();
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<{
    adminExists: boolean | null;
    canLogin: boolean | null;
    sessionEmail: string | null;
    error: string | null;
  } | null>(null);

  const checkAdminStatus = async () => {
    setChecking(true);
    setResults(null);

    try {
      // Check if admin user exists
      const adminCheck = await fetch('/api/admin/check-admin', {
        method: 'GET',
      });

      const adminData = await adminCheck.json();

      // Check current session
      const sessionEmail = session?.user?.email || null;

      setResults({
        adminExists: adminData.exists || false,
        canLogin: adminData.canLogin || false,
        sessionEmail,
        error: adminData.error || null,
      });
    } catch (error: any) {
      setResults({
        adminExists: null,
        canLogin: null,
        sessionEmail: null,
        error: error.message || 'שגיאה בבדיקה',
      });
    } finally {
      setChecking(false);
    }
  };

  const createAdmin = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}\n\nאימייל: ${data.email}\nסיסמה: ${data.password}`);
        await checkAdminStatus();
      } else {
        alert(`❌ שגיאה: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ שגיאה: ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  const isCurrentUserAdmin = session?.user?.email === 'admin@ktiva-evrit.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <AlertCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">בדיקת משתמש Admin</h1>
              <p className="text-gray-600 mt-1">אבחון בעיות התחברות כאדמין</p>
            </div>
          </div>

          {/* מצב Session נוכחי */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-blue-900 mb-3 text-lg">מצב התחברות נוכחי:</h2>
            <div className="space-y-2">
              <p>
                <strong>סטטוס:</strong>{' '}
                <span className={`px-2 py-1 rounded ${
                  status === 'authenticated' ? 'bg-green-100 text-green-800' : 
                  status === 'loading' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {status === 'authenticated' ? 'מחובר' : 
                   status === 'loading' ? 'טוען...' : 
                   'לא מחובר'}
                </span>
              </p>
              {session?.user && (
                <>
                  <p><strong>אימייל:</strong> {session.user.email}</p>
                  <p><strong>שם:</strong> {session.user.name || 'ללא שם'}</p>
                  <p>
                    <strong>זה אדמין:</strong>{' '}
                    {isCurrentUserAdmin ? (
                      <span className="text-green-600 font-bold">✅ כן</span>
                    ) : (
                      <span className="text-red-600 font-bold">❌ לא</span>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="space-y-4 mb-6">
            <button
              onClick={checkAdminStatus}
              disabled={checking}
              className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className={`w-6 h-6 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'בודק...' : 'בדוק מצב Admin'}
            </button>

            {results && (
              <div className={`p-6 rounded-xl border-2 ${
                results.adminExists && results.canLogin
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="font-bold mb-3 text-lg">תוצאות הבדיקה:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {results.adminExists ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>
                      <strong>משתמש Admin קיים:</strong>{' '}
                      {results.adminExists ? '✅ כן' : '❌ לא'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {results.canLogin ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>
                      <strong>ניתן להתחבר:</strong>{' '}
                      {results.canLogin ? '✅ כן' : '❌ לא'}
                    </span>
                  </div>
                  {results.sessionEmail && (
                    <p><strong>אימייל ב-Session:</strong> {results.sessionEmail}</p>
                  )}
                  {results.error && (
                    <p className="text-red-600"><strong>שגיאה:</strong> {results.error}</p>
                  )}
                </div>

                {!results.adminExists && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-bold text-yellow-900 mb-2">פתרון:</p>
                    <button
                      onClick={createAdmin}
                      disabled={checking}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      צור משתמש Admin עכשיו
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* פרטי התחברות */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-3 text-lg">פרטי התחברות Admin:</h2>
            <div className="space-y-2 font-mono text-sm">
              <p><strong>אימייל:</strong> <code className="bg-white px-2 py-1 rounded">admin@ktiva-evrit.com</code></p>
              <p><strong>סיסמה:</strong> <code className="bg-white px-2 py-1 rounded">admin123</code></p>
            </div>
          </div>

          {/* הוראות פתרון בעיות */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-purple-900 mb-3 text-lg">פתרון בעיות:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm mr-4">
              <li>ודאי שמשתמש Admin קיים - לחצי על "בדוק מצב Admin"</li>
              <li>אם המשתמש לא קיים, לחצי על "צור משתמש Admin עכשיו"</li>
              <li>נסי להתחבר עם האימייל והסיסמה: <code>admin@ktiva-evrit.com</code> / <code>admin123</code></li>
              <li>אם עדיין לא עובד, נסי לנקות cookies ולהתחבר מחדש</li>
              <li>ודאי ש-NEXTAUTH_SECRET מוגדר ב-.env.local</li>
            </ol>
          </div>

          {/* קישורים */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <Link
              href="/login"
              className="block text-center text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
            >
              ← חזרה לדף התחברות
            </Link>
            <Link
              href="/admin/create-admin"
              className="block text-center text-gray-600 hover:text-gray-700 font-medium hover:underline"
            >
              יצירת משתמש Admin (דרך אחרת)
            </Link>
            <Link
              href="/admin/debug-auth"
              className="block text-center text-gray-600 hover:text-gray-700 font-medium hover:underline"
            >
              דף אבחון אימות מתקדם
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

