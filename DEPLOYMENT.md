# הוראות פריסה ל-Vercel

## 1. הכנת מסד הנתונים

### אפשרות א': Vercel Postgres (מומלץ)
1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-Storage → Create Database → Postgres
4. העתק את ה-`DATABASE_URL`

### אפשרות ב': Neon (חינמי)
1. לך ל-[Neon Console](https://console.neon.tech/)
2. צור פרויקט חדש
3. העתק את ה-`DATABASE_URL`

## 2. הגדרת משתני סביבה

### מקומי (.env.local):

1. צור קובץ `.env.local` בשורש הפרויקט (אם עדיין לא קיים)
2. הוסף את המשתנים הבאים:

```env
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=JkJHfr7WnX4uAgkSM+07FrP4BBrtELpo5T1JwoeKN1c=
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

**⚠️ חשוב:** 
- השתמש ב-secret key שונה לכל סביבה (local ו-production)
- ליצירת secret חדש: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### ב-Vercel (Production):

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard) → הפרויקט שלך → Settings → Environment Variables
2. הוסף את המשתנים הבאים:

```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-production-secret-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

**⚠️ חשוב:** 
- ודא שה-`NEXTAUTH_SECRET` שונה מה-local (לא אותו secret!)
- בחר **Production**, **Preview**, ו-**Development** (כל שלושת האפשרויות)
- אחרי הוספת משתנים חדשים, צריך לבצע **Redeploy**

## 3. פריסה

```bash
# התקן Vercel CLI
npm i -g vercel

# התחבר לחשבון שלך
vercel login

# פרוס את הפרויקט
vercel --prod
```

## 4. יצירת משתמש Admin

לאחר הפריסה, צור משתמש admin:

```bash
# התחבר לפרויקט
vercel env pull .env.local

# צור משתמש admin
npm run create-admin
```

## 5. בדיקה

1. לך לכתובת הפרויקט ב-Vercel
2. נסה להתחבר עם:
   - Email: `admin@ktiva-evrit.com`
   - Password: `admin123`

## פתרון בעיות

### שגיאת DATABASE_URL
- ודא שה-`DATABASE_URL` מוגדר נכון ב-Vercel
- ודא שמסד הנתונים פעיל

### שגיאת JWT_SECRET
- ודא שה-`JWT_SECRET` מוגדר ב-Vercel
- השתמש במחרוזת אקראית חזקה

### שגיאת ANTHROPIC_API_KEY
- ודא שיש לך API key מ-[Anthropic Console](https://console.anthropic.com/)
- ודא שה-API key מוגדר ב-Vercel
