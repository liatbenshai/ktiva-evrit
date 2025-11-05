# הוראות להגדרת DATABASE_URL מקומית

## שלב 1: קבלת DATABASE_URL מ-Supabase

1. לך ל-[Supabase Dashboard](https://app.supabase.com/)
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Database**
4. גלול למטה עד **"Connection string"**
5. בחר **"URI"** מהתפריט
6. העתק את ה-URL - הוא נראה כך:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.kpplrkgkhkhgrnjwgfpb.supabase.co:5432/postgres
   ```
7. **החלף את `[YOUR-PASSWORD]`** בסיסמה שבחרת כשצרת את הפרויקט

## שלב 2: יצירת/עדכון .env.local

1. פתח את הקובץ `.env.local` בתיקיית הפרויקט (אם הוא לא קיים, צור אותו)

2. הוסף או עדכן את השורה הבאה:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR-PASSWORD-HERE@db.kpplrkgkhkhgrnjwgfpb.supabase.co:5432/postgres
   ```
   (החלף את `YOUR-PASSWORD-HERE` בסיסמה האמיתית)

3. שמור את הקובץ

## שלב 3: הרצת prisma db push

הרץ את הפקודה הבאה בטרמינל:
```bash
npm run db:push
```

אם הכל עובד, תראה:
```
✅ Database is now in sync with your Prisma schema
```

## דוגמה לקובץ .env.local מלא

```env
# Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Supabase Database URL
DATABASE_URL=postgresql://postgres:your_password_here@db.kpplrkgkhkhgrnjwgfpb.supabase.co:5432/postgres

# JWT Secret (אופציונלי)
JWT_SECRET=your_jwt_secret_here
```

## פתרון בעיות

### שגיאה: "the URL must start with the protocol `postgresql://`"
**פתרון**: ודא שה-`DATABASE_URL` ב-`.env.local` מתחיל ב-`postgresql://` ולא `file://` או משהו אחר.

### שגיאה: "Can't reach database server"
**פתרון**: 
- ודא שהסיסמה נכונה
- ודא שהפרויקט Supabase פעיל
- ודא שהחיבור לרשת מאפשר חיבורים ל-Supabase

