'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">דף בדיקת אימות</h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="font-bold mb-2">מצב Session:</h2>
            <p>Status: <code>{status}</code></p>
            {session ? (
              <div className="mt-2">
                <p>User ID: {session.user?.id}</p>
                <p>Email: {session.user?.email}</p>
                <p>Name: {session.user?.name || 'ללא שם'}</p>
              </div>
            ) : (
              <p className="text-red-600">לא מחובר</p>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="font-bold mb-2">בדיקת יצירת משתמש:</h2>
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'בודק...' : 'בדוק יצירת משתמש'}
            </button>
            {testResult && (
              <pre className="mt-2 bg-white p-2 rounded text-xs overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h2 className="font-bold mb-2">פרטי התחברות לבדיקה:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>אימייל: <code>admin@ktiva-evrit.com</code></li>
              <li>סיסמה: <code>admin123</code></li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">
              ודאי שיצרת את המשתמש דרך /admin/create-admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

