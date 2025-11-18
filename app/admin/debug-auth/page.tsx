'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DebugAuthPage() {
  const { data: session, status, update } = useSession();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cookies, setCookies] = useState<string[]>([]);
  const [envCheck, setEnvCheck] = useState<any>(null);

  useEffect(() => {
    // בדיקת cookies
    const allCookies = document.cookie.split(';').map(c => c.trim());
    setCookies(allCookies);

    // בדיקת משתני סביבה (רק מה שאפשר לראות בצד הלקוח)
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setEnvCheck({
          sessionEndpoint: 'עובד',
          hasSession: !!data?.user,
        });
      })
      .catch(err => {
        setEnvCheck({
          sessionEndpoint: 'שגיאה',
          error: err.message,
        });
      });
  }, []);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test123',
          name: 'Test User',
        }),
      });
      const data = await response.json();
      setTestResult({ type: 'register', data });
    } catch (error: any) {
      setTestResult({ type: 'register', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setTestResult({ type: 'session', data });
    } catch (error: any) {
      setTestResult({ type: 'session', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      await update();
      setTestResult({ type: 'refresh', message: 'Session עודכן' });
    } catch (error: any) {
      setTestResult({ type: 'refresh', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const authCookies = cookies.filter((c: string) => 
    c.includes('authjs') || c.includes('next-auth')
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">🔍 דף בדיקת אימות - אבחון מקיף</h1>
        
        <div className="space-y-4">
          {/* מצב Session */}
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h2 className="font-bold mb-2 text-lg">מצב Session:</h2>
            <div className="space-y-2">
              <p>
                <strong>Status:</strong> <code className="bg-white px-2 py-1 rounded">{status}</code>
              </p>
              {session ? (
                <div className="mt-2 bg-white p-3 rounded">
                  <p><strong>User ID:</strong> {session.user?.id}</p>
                  <p><strong>Email:</strong> {session.user?.email}</p>
                  <p><strong>Name:</strong> {session.user?.name || 'ללא שם'}</p>
                </div>
              ) : (
                <p className="text-red-600 font-semibold">❌ לא מחובר</p>
              )}
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-purple-50 p-4 rounded border border-purple-200">
            <h2 className="font-bold mb-2 text-lg">Cookies:</h2>
            {authCookies.length > 0 ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ נמצאו {authCookies.length} cookies של אימות:</p>
                <ul className="list-disc list-inside bg-white p-3 rounded space-y-1">
                  {authCookies.map((cookie: string, idx: number) => (
                    <li key={idx} className="text-xs font-mono break-all">
                      {cookie.split('=')[0]}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-red-600">❌ לא נמצאו cookies של אימות</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              💡 אם אין cookies, הבעיה היא ב-NEXTAUTH_SECRET או ב-cookie settings
            </p>
          </div>

          {/* בדיקת API */}
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <h2 className="font-bold mb-2 text-lg">בדיקות API:</h2>
            <div className="space-y-2">
              <button
                onClick={testSession}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mr-2"
              >
                {loading ? 'בודק...' : 'בדוק Session API'}
              </button>
              <button
                onClick={refreshSession}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 mr-2"
              >
                {loading ? 'מעדכן...' : 'רענן Session'}
              </button>
              <button
                onClick={testLogin}
                disabled={loading}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'בודק...' : 'בדוק יצירת משתמש'}
              </button>
            </div>
            {testResult && (
              <pre className="mt-2 bg-white p-2 rounded text-xs overflow-auto border">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
            {envCheck && (
              <div className="mt-2 bg-white p-2 rounded">
                <p><strong>Session Endpoint:</strong> {envCheck.sessionEndpoint}</p>
                {envCheck.error && (
                  <p className="text-red-600 text-sm">שגיאה: {envCheck.error}</p>
                )}
              </div>
            )}
          </div>

          {/* הוראות */}
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h2 className="font-bold mb-2 text-lg">פתרון בעיות:</h2>
            <div className="space-y-2 text-sm">
              <p><strong>אם אין Session:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mr-4">
                <li>ודא ש-NEXTAUTH_SECRET מוגדר ב-.env.local</li>
                <li>הרץ: <code className="bg-white px-1 rounded">npm run diagnose:auth</code></li>
                <li>נקה cookies ונסה להתחבר מחדש</li>
                <li>ודא שהמשתמש קיים במסד הנתונים</li>
              </ol>
              <p className="mt-3"><strong>אם יש Session אבל לא נשמר:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mr-4">
                <li>ודא ש-NEXTAUTH_SECRET תואם בין כל הסביבות</li>
                <li>ב-production, ודא ש-NEXTAUTH_URL מוגדר</li>
                <li>בדוק את ה-logs ב-Vercel (Function Logs)</li>
              </ol>
            </div>
          </div>

          {/* קישורים שימושיים */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h2 className="font-bold mb-2 text-lg">קישורים שימושיים:</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><a href="/login" className="text-blue-600 hover:underline">דף התחברות</a></li>
              <li><a href="/admin/create-admin" className="text-blue-600 hover:underline">יצירת Admin</a></li>
              <li className="text-gray-600">הרץ: <code>npm run diagnose:auth</code> לאבחון אוטומטי</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

