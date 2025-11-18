# 🔧 פתרון בעיית Redirect אחרי התחברות

## הבעיה

אחרי התחברות מוצלחת, המשתמש מועבר חזרה ל-`/login` במקום ל-`/dashboard`. זה קורה כי ה-middleware לא מזהה את ה-session cookie.

## מה תיקנתי

### 1. הגדרות Cookies מפורשות ב-NextAuth

הוספתי הגדרות cookies מפורשות ב-`lib/auth.ts`:
- ב-production: `__Secure-authjs.session-token` עם `secure: true`
- ב-development: `authjs.session-token` ללא secure
- `sameSite: 'lax'` - מאפשר שליחת cookies ב-redirects

### 2. שיפור ה-Redirect

שיניתי את ה-redirect ב-`app/login/page.tsx`:
- הסרתי את ה-timeout וה-`router.refresh()`
- משתמש ב-`window.location.href` ל-reload מלא של הדף
- זה מבטיח שה-cookies נשלחים נכון

### 3. שיפור ה-Middleware

שיפרתי את ה-middleware:
- הוספתי `cookieName` מפורש ל-`getToken`
- הוספתי לוגים מפורטים לבדיקת cookies

## מה לבדוק ב-Vercel

### 1. ודא ש-NEXTAUTH_SECRET מוגדר

1. לך ל-Vercel Dashboard → Settings → Environment Variables
2. ודא ש-`NEXTAUTH_SECRET` מוגדר
3. **חשוב:** ודא שהוא זהה בכל הסביבות (Production, Preview, Development)

### 2. בדוק את ה-Cookies

פתח את Developer Tools (F12) → Application → Cookies ובדוק:
- האם יש cookie בשם `__Secure-authjs.session-token` או `authjs.session-token`?
- האם ה-cookie נשלח עם כל הבקשות?

### 3. בדוק את ה-Logs ב-Vercel

לך ל-Vercel Dashboard → Deployments → Function Logs וחפש:
- `[Middleware] Dashboard route - token exists: true/false`
- `[Middleware] Available cookies: ...`

## אם זה עדיין לא עובד

### אפשרות 1: NEXTAUTH_SECRET לא תואם

אם שינית את ה-`NEXTAUTH_SECRET` ב-Vercel, צריך:
1. למחוק את כל ה-cookies בדפדפן
2. להתחבר מחדש

### אפשרות 2: בעיה עם Domain

ב-Vercel, ה-cookies צריכים להיות על ה-domain הנכון. ודא ש:
- ה-cookie לא מוגבל ל-domain ספציפי
- `sameSite: 'lax'` מוגדר נכון

### אפשרות 3: בדוק את ה-Session

לך ל-`/admin/debug-auth` ובדוק:
- האם יש session?
- מה ה-status?
- האם יש cookies?

## הערות

- ב-production, ה-cookie צריך להיות `Secure` (HTTPS only)
- `sameSite: 'lax'` מאפשר שליחת cookies ב-redirects
- `window.location.href` מבצע reload מלא, מה שמבטיח שה-cookies נשלחים

