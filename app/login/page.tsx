'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // התחברות
        console.log('Attempting login with email:', email);
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        console.log('SignIn result:', result);

        if (result?.error) {
          console.error('Login error:', result.error);
          setError('אימייל או סיסמה שגויים');
          setLoading(false);
        } else if (result?.ok) {
          // התחברות מוצלחת
          console.log('Login successful, redirecting...');
          console.log('Full result:', JSON.stringify(result, null, 2));
          
          setLoading(false);
          
          // Use the callbackUrl from the URL, or default to /dashboard
          const redirectUrl = callbackUrl || '/dashboard';
          
          console.log('Redirecting to:', redirectUrl);
          
          // Use window.location.href for full page reload to ensure cookies are sent
          // This ensures the middleware can read the session cookie
          window.location.href = redirectUrl;
        } else {
          console.error('Unexpected login result:', result);
          console.error('Result details:', JSON.stringify(result, null, 2));
          setError('שגיאה בהתחברות. נסה שוב. בדוק את הקונסול לפרטים.');
          setLoading(false);
        }
      } else {
        // הרשמה
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'שגיאה ביצירת משתמש');
          setLoading(false);
        } else {
          // אחרי הרשמה מוצלחת, המתן רגע ואז התחבר אוטומטית
          // זה נותן למסד הנתונים זמן לשמור את המשתמש
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          });

          if (result?.error) {
            console.error('Sign in error after registration:', result.error);
            setError('המשתמש נוצר בהצלחה! אנא התחבר עם האימייל והסיסמה שלך.');
            setIsLogin(true); // מעבר למצב התחברות
            setLoading(false);
          } else if (result?.ok) {
            // התחברות מוצלחת - רענון מלא של הדף
            console.log('Auto-login after registration successful, redirecting...');
            setLoading(false);
            // Use window.location for full page reload to ensure session is loaded
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          } else {
            console.error('Unexpected auto-login result:', result);
            setError('המשתמש נוצר אבל לא ניתן להתחבר. נסה להתחבר ידנית.');
            setIsLogin(true); // מעבר למצב התחברות
            setLoading(false);
          }
        }
      }
    } catch (err: any) {
      console.error('Login/Register error:', err);
      setError('שגיאה: ' + (err.message || 'שגיאה לא צפויה'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-blue-50 px-4 py-8">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/50">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <span className="text-2xl sm:text-3xl">✍️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {isLogin ? 'התחברות' : 'הרשמה'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isLogin
              ? 'התחבר לחשבון שלך'
              : 'צור חשבון חדש כדי להתחיל'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                שם מלא
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                placeholder="הכנס שם מלא"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              אימייל
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
              placeholder="מינימום 6 תווים"
            />
          </div>

          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'מעבד...' : isLogin ? 'התחבר' : 'הירשם'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm sm:text-base transition-colors underline decoration-2 underline-offset-2"
          >
            {isLogin
              ? 'אין לך חשבון? הירשם כאן'
              : 'יש לך כבר חשבון? התחבר כאן'}
          </button>
        </div>

        <div className="mt-5 sm:mt-6 text-center space-y-2 pt-5 border-t border-gray-200">
          <Link
            href="/admin/create-admin"
            className="block text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm font-semibold transition-colors"
          >
            יצירת משתמש Admin
          </Link>
          <Link
            href="/"
            className="block text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <LoginForm />
    </Suspense>
  );
}

