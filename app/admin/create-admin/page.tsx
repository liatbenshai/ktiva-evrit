'use client';

import { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    email?: string;
    password?: string;
  } | null>(null);

  const handleCreateAdmin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          email: data.email,
          password: data.password,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'שגיאה ביצירת משתמש admin',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'שגיאה: ' + (error.message || 'שגיאה לא צפויה'),
      });
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-3xl font-bold text-gray-900">יצירת משתמש Admin</h1>
              <p className="text-gray-600 mt-1">צור משתמש מנהל למערכת</p>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-blue-900 mb-2">פרטי התחברות:</h2>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• אימייל: <code className="bg-blue-100 px-2 py-1 rounded">admin@ktiva-evrit.com</code></li>
              <li>• סיסמה: <code className="bg-blue-100 px-2 py-1 rounded">admin123</code></li>
            </ul>
          </div>

          <button
            onClick={handleCreateAdmin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <UserPlus className="w-6 h-6" />
            {loading ? 'יוצר...' : 'צור משתמש Admin'}
          </button>

          {result && (
            <div className={`mt-6 p-6 rounded-xl border-2 ${
              result.success
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                  {result.success && result.email && result.password && (
                    <div className="mt-4 space-y-2">
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">פרטי התחברות:</p>
                        <p className="text-gray-900 font-mono text-sm">
                          <strong>אימייל:</strong> {result.email}
                        </p>
                        <p className="text-gray-900 font-mono text-sm">
                          <strong>סיסמה:</strong> {result.password}
                        </p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800">
                          ⚠️ שמרי את הפרטים האלה במקום בטוח!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
            <Link
              href="/login"
              className="block text-center text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
            >
              ← חזרה לדף התחברות
            </Link>
            <Link
              href="/admin/users"
              className="block text-center text-gray-600 hover:text-gray-700 font-medium hover:underline"
            >
              צפייה בכל המשתמשים
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

