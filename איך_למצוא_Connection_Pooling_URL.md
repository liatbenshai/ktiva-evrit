# 📖 איך למצוא את Connection Pooling URL ב-Supabase - מדריך מפורט

## שלב 1: התחברות ל-Supabase

1. פתחי את הדפדפן
2. לך לכתובת: **https://app.supabase.com/**
3. התחברי לחשבון שלך (אם את לא מחוברת)

---

## שלב 2: בחירת הפרויקט

1. אחרי ההתחברות, תראי רשימה של פרויקטים
2. **לחצי על הפרויקט שלך** (הפרויקט עם ה-DATABASE_URL שכרגע לא עובד)
   - אם יש לך רק פרויקט אחד, פשוט לחצי עליו
   - אם יש לך כמה, חפשי את הפרויקט עם ה-URL: `db.kpplrkgkhkhgrnjwgfpb.supabase.co`

---

## שלב 3: מעבר ל-Settings

1. בתפריט השמאלי (Sidebar), תראי רשימת אפשרויות:
   - Table Editor
   - SQL Editor
   - Authentication
   - Storage
   - **Settings** ⚙️ ← **לחצי על זה!**

2. אם את לא רואה את התפריט השמאלי:
   - לחצי על התפריט (☰) בפינה השמאלית העליונה
   - או לחצי על האייקון של הגלגל ⚙️

---

## שלב 4: בחירת Database

1. אחרי שלחצת על **Settings**, תראי רשימת קטגוריות:
   - General
   - **Database** ← **לחצי על זה!**
   - API
   - Auth
   - Storage
   - ועוד...

2. לחצי על **"Database"**

---

## שלב 5: גלילה ל-Connection Pooling

1. אחרי שלחצת על **Database**, תראי דף עם הרבה אפשרויות
2. **גללי למטה** (Scroll down) - זה חשוב!
3. תמשיכי לגלול עד שתמצאי את הכותרת:
   ```
   Connection Pooling
   ```
   
   או בעברית:
   ```
   חיבור מאוחד
   ```

4. תחת הכותרת הזו, תראי כמה אפשרויות:
   - **Session mode**
   - **Transaction mode**
   - **Statement mode**

---

## שלב 6: בחירת Connection String

1. תחת **"Connection Pooling"**, תראי את **"Session mode"**
2. ליד **"Session mode"**, תראי כפתור או קישור:
   - **"Connection string"** ← **לחצי על זה!**
   - או **"Copy"** (אם יש כפתור העתקה)
   - או **"Show connection string"**

3. אחרי הלחיצה, יופיע לך טקסט שנראה כך:
   ```
   postgresql://postgres.kpplrkgkhkhgrnjwgfpb:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

---

## שלב 7: העתקת ה-URL

1. **העתקי את כל הטקסט** (הכל מההתחלה עד הסוף)
2. **חשוב:** החלפי את `[YOUR-PASSWORD]` בסיסמה האמיתית שלך
   - אם הסיסמה מופיעה כבר ב-URL, מצוין!
   - אם כתוב `[YOUR-PASSWORD]`, צריך להחליף את זה בסיסמה

---

## שלב 8: עדכון ה-DATABASE_URL

### אם את עובדת מקומית:

1. פתחי את הקובץ `.env.local` (אם הוא לא קיים, צרי אותו)
2. מצאי את השורה:
   ```
   DATABASE_URL=postgresql://postgres:...@db.kpplrkgkhkhgrnjwgfpb.supabase.co:5432/postgres
   ```
3. **החלפי את כל השורה** ב-URL החדש שהעתקת:
   ```
   DATABASE_URL=postgresql://postgres.kpplrkgkhkhgrnjwgfpb:YOUR-PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
   ```
4. שמרי את הקובץ

### אם את עובדת ב-Vercel:

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחרי את הפרויקט `ktiva-evrit`
3. לך ל-**Settings** → **Environment Variables**
4. מצאי את `DATABASE_URL` ולחצי **Edit**
5. **החלפי את כל הערך** ב-URL החדש
6. לחצי **Save**
7. **חשוב:** לך ל-**Deployments** → לחצי על ה-3 נקודות → **Redeploy**

---

## 🔍 איך לדעת שזה נכון?

ה-URL הנכון צריך להכיל:
- ✅ `pooler.supabase.com` (לא `db.supabase.co`)
- ✅ פורט `6543` (לא `5432`)
- ✅ `postgres.xxx` (לא רק `postgres:`)

**דוגמה ל-URL נכון:**
```
postgresql://postgres.kpplrkgkhkhgrnjwgfpb:password123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

**דוגמה ל-URL שגוי (לא עובד):**
```
postgresql://postgres:password123@db.kpplrkgkhkhgrnjwgfpb.supabase.co:5432/postgres
```

---

## 🆘 אם את לא מוצאת את Connection Pooling

אם אחרי שגללת למטה את לא מוצאת את "Connection Pooling", זה יכול להיות כי:

1. **הפרויקט שלך לא תומך ב-Connection Pooling** (נדיר)
   - פתרון: נסי את ה-URL הישן עם שינוי קטן:
   ```
   postgresql://postgres:YOUR-PASSWORD@db.kpplrkgkhkhgrnjwgfpb.supabase.co:6543/postgres?pgbouncer=true
   ```
   (שימי לב: שיניתי את הפורט ל-6543 והוספתי `?pgbouncer=true`)

2. **את לא במסך הנכון**
   - ודאי שאת ב-**Settings** → **Database**
   - ודאי שגללת מספיק למטה

3. **הממשק השתנה**
   - נסי לחפש "Pooling" או "Connection" בחיפוש
   - או נסי לחפש ב-Google: "Supabase Connection Pooling URL"

---

## ✅ אחרי העדכון - בדיקה

הרצי את הפקודה:
```bash
npm run db:check
```

אמור לראות:
```
✅ DATABASE_URL מוגדר
✅ Connection Pooling (מומלץ ל-Vercel)
📍 פורט: 6543
✅ חיבור הצליח!
```

אם את עדיין רואה שגיאה, שלחי לי את הפלט ואני אעזור!

