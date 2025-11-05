# תיקון בעיית החיבור ל-Supabase ב-Vercel

## הבעיה
Vercel לא יכול להתחבר ל-Supabase דרך פורט 5432 (Direct connection).

## הפתרון
צריך להשתמש ב-**Connection Pooling** של Supabase (פורט 6543).

## שלב 1: קבלת Connection Pooling URL מ-Supabase

1. לך ל-[Supabase Dashboard](https://app.supabase.com/)
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Database**
4. גלול למטה עד **"Connection Pooling"**
5. יש כאן 3 מצבים:
   - **Session mode** (מומלץ לרוב המקרים)
   - **Transaction mode**
   - **Statement mode**

6. לחץ על **"Connection string"** ליד **"Session mode"**
7. העתק את ה-URL - הוא נראה כך:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   או:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

## שלב 2: עדכון DATABASE_URL ב-Vercel

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט `ktiva-evrit`
3. לך ל-**Settings** → **Environment Variables**
4. מצא את `DATABASE_URL` (או הוסף אותו אם אין)
5. עדכן את הערך ל-URL מ-Connection Pooling (העתקת בשלב 1)
6. ודא שהסיסמה נכונה
7. לחץ **"Save"**

## שלב 3: Redeploy ב-Vercel

1. לך ל-**Deployments**
2. לחץ על ה-3 נקודות (⋯) ליד ה-deployment האחרון
3. בחר **"Redeploy"**
4. או פשוט דחוף commit חדש ל-GitHub

## שלב 4: בדיקה

אחרי שהבנייה מסתיימת:
1. נסי לשמור דפוס חדש באתר
2. לך לדף "דפוסים שנלמדו"
3. הדפוס אמור להופיע!

## מה ההבדל?

- **פורט 5432** (Direct): חיבור ישיר - לא עובד ב-Vercel production
- **פורט 6543** (Pooling): חיבור דרך Connection Pooler - עובד ב-Vercel ✅

## הערה

גם אם יש לך את ה-URL הישן, אפשר לנסות לשנות אותו:
- החלף את הפורט מ-`5432` ל-`6543`
- החלף את ה-host ל-`aws-0-[REGION].pooler.supabase.com` (תצטרך לראות את ה-REGION מ-Supabase Dashboard)
- או פשוט השתמש ב-URL מ-Connection Pooling section

