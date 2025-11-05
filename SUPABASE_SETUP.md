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

### ל-Vercel (אוטומטי):
**לא צריך לעשות כלום!** Vercel יבנה את הטבלאות אוטומטית בזמן ה-build דרך ה-`postinstall` script.

### למקומי (אופציונלי):
אם את רוצה לבדוק מקומית, הרצי:
```bash
npm run db:push
```

**לא צריך להריץ `npm run db:generate`** - זה קורה אוטומטית ב-`postinstall` וב-`build`.

## שלב 5: הגדרת DATABASE_URL ב-Vercel (חשוב מאוד!)

**זה השלב החשוב ביותר!** בלי זה, Vercel לא יוכל להתחבר למסד הנתונים.

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחרי את הפרויקט `ktiva-evrit`
3. לך ל-**Settings** → **Environment Variables**
4. לחצי על **"Add New"**
5. הוסיפי:
   - **Name**: `DATABASE_URL`
   - **Value**: העתקי את ה-`DATABASE_URL` מ-Supabase (החלפי `[YOUR-PASSWORD]` בסיסמה)
   - **Environment**: בחרי **Production**, **Preview**, ו-**Development** (כל שלושת האפשרויות!)
6. לחצי על **"Save"**

**⚠️ חשוב:** אחרי שהוספת את `DATABASE_URL`, צריך לבצע **Redeploy**:
- לך ל-**Deployments**
- לחצי על ה-3 נקודות (⋯) ליד ה-deployment האחרון
- בחרי **"Redeploy"**
- או פשוט דחופי commit חדש ל-GitHub

## שלב 6: דחיפת השינויים ל-GitHub ו-Vercel

1. דחופי את השינויים ל-GitHub:
   ```bash
   git add .
   git commit -m "Switch to Supabase PostgreSQL"
   git push origin master
   ```
2. Vercel יבנה את הפרויקט אוטומטית
3. בדקי את ה-build logs ב-Vercel - אמור לראות:
   ```
   Running "prisma generate"
   Running "prisma db push"
   ✅ Database is now in sync with your Prisma schema
   ```

## שלב 7: בדיקה

### בדיקה ב-Vercel (Production):
1. אחרי שהבנייה מסתיימת, לך לאתר ב-Vercel
2. נסי לשמור דפוס חדש (מהדף "תיקון AI")
3. לך לדף "דפוסים שנלמדו" - אמור להופיע הדפוס
4. אם הדפוס מופיע, הכל עובד! 🎉

### בדיקה מקומית (אופציונלי):
אם את רוצה לבדוק מקומית גם:
1. עדכני את `.env.local` עם ה-`DATABASE_URL` מ-Supabase
2. הפעילי את השרת: `npm run dev`
3. נסי לשמור דפוס חדש
4. לך לדף "דפוסים שנלמדו" - אמור להופיע הדפוס

## פתרון בעיות

### שגיאה: "relation does not exist" ב-Vercel
**פתרון**: 
- ודאי שה-`DATABASE_URL` מוגדר ב-Vercel Environment Variables
- ודאי שביצעת Redeploy אחרי הוספת `DATABASE_URL`
- בדקי את ה-build logs - אמור לראות "prisma db push" רץ בהצלחה

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

