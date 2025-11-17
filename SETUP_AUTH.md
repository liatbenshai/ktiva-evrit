# הגדרת מערכת משתמשים

## שלב 1: יצירת NEXTAUTH_SECRET

### מקומי (Local Development):

1. פתחי PowerShell או Terminal
2. הרצי את הפקודה הבאה:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
3. העתיקי את התוצאה (זה ה-secret key שלך)

### או עם OpenSSL (אם מותקן):
```bash
openssl rand -base64 32
```

## שלב 2: הוספת NEXTAUTH_SECRET ל-.env.local

1. פתחי את הקובץ `.env.local` (אם אין, צרי אותו בשורש הפרויקט)
2. הוסיפי את השורה הבאה:
   ```env
   NEXTAUTH_SECRET=התוצאה_שלך_מהפקודה_למעלה
   ```
   
   לדוגמה:
   ```env
   NEXTAUTH_SECRET=JkJHfr7WnX4uAgkSM+07FrP4BBrtELpo5T1JwoeKN1c=
   ```

3. שמרי את הקובץ

## שלב 3: הפעלה מחדש של השרת

אחרי הוספת `NEXTAUTH_SECRET`:
1. עצרי את השרת (Ctrl+C)
2. הפעילי מחדש:
   ```bash
   npm run dev
   ```

## שלב 4: יצירת משתמש ראשון

1. לך ל-`http://localhost:3002/login`
2. לחצי על "אין לך חשבון? הירשם כאן"
3. מלאי:
   - שם מלא (אופציונלי)
   - אימייל
   - סיסמה (מינימום 6 תווים)
4. לחצי "הירשם"
5. אחרי ההרשמה, תועברי אוטומטית ל-dashboard

## שלב 5: הגדרת NEXTAUTH_SECRET ב-Vercel (Production)

**⚠️ חשוב:** צריך secret key **שונה** ל-production!

1. צרי secret key חדש (עם אותה פקודה):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
3. בחרי את הפרויקט שלך
4. לך ל-**Settings** → **Environment Variables**
5. לחצי **"Add New"**
6. מלאי:
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: ה-secret key החדש שיצרת (שונה מה-local!)
   - **Environment**: בחרי **Production**, **Preview**, ו-**Development**
7. לחצי **"Save"**

8. **חשוב:** אחרי הוספת משתנה חדש, צריך לבצע **Redeploy**:
   - לך ל-**Deployments**
   - לחצי על ה-3 נקודות (⋯) ליד ה-deployment האחרון
   - בחרי **"Redeploy"**
   - או פשוט דחופי commit חדש ל-GitHub

## פתרון בעיות

### שגיאה: "NEXTAUTH_SECRET is not set"
- ודאי שה-`.env.local` קיים ובתוכו `NEXTAUTH_SECRET=...`
- ודאי שהשרת הופעל מחדש אחרי הוספת המשתנה

### שגיאה: "Invalid credentials"
- ודאי שהאימייל והסיסמה נכונים
- אם שכחת סיסמה, צריך ליצור משתמש חדש (עדיין אין password reset)

### שגיאה: "User already exists"
- המשתמש כבר קיים - נסי להתחבר במקום להרשם

## אבטחה

- **אל תשתפי** את ה-`NEXTAUTH_SECRET` עם אף אחד
- **אל תעלי** את `.env.local` ל-GitHub (הוא כבר ב-.gitignore)
- השתמשי ב-secret **שונה** לכל סביבה (local, preview, production)

