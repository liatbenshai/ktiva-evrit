# הגדרת Supabase - מדריך מפורט

## שלב 1: יצירת פרויקט ב-Supabase

1. לך ל-[Supabase Dashboard](https://app.supabase.com/)
2. לחץ על **"New Project"**
3. מלא את הפרטים:
   - **Name**: `ktiva-evrit` (או כל שם שאת רוצה)
   - **Database Password**: בחרי סיסמה חזקה (שמור אותה!)
   - **Region**: בחרי את האזור הקרוב אליך (למשל: `West Europe`)
4. לחצי על **"Create new project"**
5. חכי כמה דקות עד שהפרויקט ייווצר

## שלב 2: קבלת ה-DATABASE_URL

1. בתוך הפרויקט שלך, לך ל-**Settings** (הגלגל ⚙️ בתפריט השמאלי)
2. לחצי על **"Database"**
3. גללי למטה עד ל-**"Connection string"**
4. בחרי **"URI"** מהתפריט הנפתח
5. העתקי את ה-`DATABASE_URL` - הוא נראה כך:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
6. **החלפי את `[YOUR-PASSWORD]`** בסיסמה שבחרת בשלב 1

## שלב 3: הגדרת DATABASE_URL מקומית

1. פתחי את הקובץ `.env.local` (אם הוא לא קיים, צרי אותו)
2. הוסיפי או עדכני את השורה:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
   (החלפי את `[YOUR-PASSWORD]` ו-`[PROJECT-REF]` בערכים האמיתיים מ-Supabase)

## שלב 4: יצירת הטבלאות במסד הנתונים

הרצי את הפקודות הבאות בטרמינל:

```bash
# 1. יצירת Prisma Client עם PostgreSQL
npm run db:generate

# 2. העלאת הטבלאות למסד הנתונים
npm run db:push
```

אם הכל עובד, תראי הודעה:
```
✅ Database is now in sync with your Prisma schema
```

## שלב 5: הגדרת DATABASE_URL ב-Vercel

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחרי את הפרויקט `ktiva-evrit`
3. לך ל-**Settings** → **Environment Variables**
4. לחצי על **"Add New"**
5. הוסיפי:
   - **Name**: `DATABASE_URL`
   - **Value**: אותו `DATABASE_URL` מה-`.env.local`
   - **Environment**: בחרי **Production**, **Preview**, ו-**Development**
6. לחצי על **"Save"**

## שלב 6: בדיקה

### בדיקה מקומית:
1. הפעילי את השרת: `npm run dev`
2. נסי לשמור דפוס חדש
3. לך לדף "דפוסים שנלמדו" - אמור להופיע הדפוס

### בדיקה ב-Vercel:
1. דחוף את השינויים ל-GitHub:
   ```bash
   git add .
   git commit -m "Switch to Supabase PostgreSQL"
   git push origin master
   ```
2. Vercel יבנה את הפרויקט אוטומטית
3. אחרי שהבנייה מסתיימת, נסי לשמור דפוס באתר
4. לך לדף "דפוסים שנלמדו" - אמור להופיע הדפוס

## פתרון בעיות

### שגיאה: "relation does not exist"
**פתרון**: הרצי `npm run db:push` שוב

### שגיאה: "connection refused"
**פתרון**: 
- ודאי שה-`DATABASE_URL` נכון
- ודאי שהסיסמה נכונה
- ודאי שה-IP של Supabase מאפשר חיבורים (ב-Supabase: Settings → Database → Connection Pooling)

### שגיאה: "too many connections"
**פתרון**: 
- Supabase חינמי מוגבל ל-60 חיבורים
- השתמשי ב-Connection Pooling: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true`

## טיפים

1. **Connection Pooling**: Supabase מציע Connection Pooling (פורט 6543 במקום 5432) - זה עוזר למנוע בעיות של "too many connections". אם את רוצה להשתמש בזה, החלפי את ה-URL כך:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
   ```

2. **Backup**: Supabase עושה backup אוטומטי כל יום - זה חשוב!

3. **Monitoring**: ב-Supabase Dashboard תוכלי לראות:
   - כמה queries רצות
   - כמה storage משתמש
   - כמה bandwidth

## סיכום

עכשיו המערכת אמורה לעבוד גם מקומית וגם ב-Vercel עם Supabase! 🎉

כל הדפוסים שתשמרי יישמרו במסד הנתונים של Supabase ויופיעו בכל מקום.

