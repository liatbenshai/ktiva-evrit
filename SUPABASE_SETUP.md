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

### חשוב: Vercel לא יכול להריץ `prisma db push` בזמן ה-build!

**צריך להריץ `prisma db push` פעם אחת מקומית** כדי ליצור את הטבלאות ב-Supabase.

### איך לעשות את זה:

1. **ודאי שיש לך `.env.local` עם ה-DATABASE_URL מ-Supabase:**
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

2. **הרצי את הפקודה הבאה מקומית:**
   ```bash
   npm run db:push
   ```

3. **אם הכל עובד, תראי:**
   ```
   ✅ Database is now in sync with your Prisma schema
   ```

**למה זה לא קורה אוטומטית?** Vercel build environment לא יכול להתחבר למסד נתונים חיצוני (Supabase) מסיבות אבטחה. צריך להריץ את זה פעם אחת מקומית, ואחרי זה הטבלאות כבר קיימות ב-Supabase.

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
- ודאי שהרצת `npm run db:push` מקומית (פעם אחת) כדי ליצור את הטבלאות
- ודאי שה-`DATABASE_URL` מוגדר ב-Vercel Environment Variables
- ודאי שביצעת Redeploy אחרי הוספת `DATABASE_URL`

### שגיאה: "Can't reach database server" ב-Vercel build
**פתרון**: 
- זה נורמלי! Vercel לא יכול להתחבר ל-Supabase בזמן ה-build
- ה-`postinstall` script כבר עודכן כדי לא להריץ `prisma db push` ב-build
- פשוט הרצי `npm run db:push` מקומית פעם אחת כדי ליצור את הטבלאות

### שגיאה: "connection refused"
**פתרון**: 
- ודאי שה-`DATABASE_URL` נכון
- ודאי שהסיסמה נכונה
- ודאי שה-IP של Supabase מאפשר חיבורים (ב-Supabase: Settings → Database → Connection Pooling)

### שגיאה: "Can't reach database server" ב-Vercel production
**פתרון**: 
- Vercel צריך להשתמש ב-**Connection Pooling** של Supabase (פורט 6543) במקום פורט 5432
- לך ל-Supabase Dashboard → Settings → Database → Connection Pooling
- העתקי את ה-URL מ-**"Connection string"** → **"Session mode"** או **"Transaction mode"**
- זה נראה כך:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  ```
- או אם יש לך את ה-URL הישן, החלפי:
  - פורט `5432` → `6543`
  - הוסף `?pgbouncer=true` בסוף
  - החלף את ה-host ל-`aws-0-[REGION].pooler.supabase.com` (אם יש)

### שגיאה: "too many connections"
**פתרון**: 
- Supabase חינמי מוגבל ל-60 חיבורים
- השתמשי ב-Connection Pooling (פורט 6543) - זה עוזר למנוע בעיות

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

