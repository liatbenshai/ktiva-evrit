# איך להריץ Migration להוספת שדה isSentence

## שלב 1: וודאי שיש לך DATABASE_URL

צריך קובץ `.env` עם משתנה `DATABASE_URL`. אם אין לך:

1. **אם את משתמשת ב-Vercel:**
   - לכי ל-Vercel Dashboard → Project → Settings → Environment Variables
   - העתיקי את ה-`DATABASE_URL` משם
   - צרי קובץ `.env` בשורש הפרויקט והוסיפי:
     ```
     DATABASE_URL=your_database_url_here
     ```

2. **אם את משתמשת ב-Supabase:**
   - לכי ל-Supabase Dashboard → Project Settings → Database
   - העתיקי את ה-Connection String
   - צרי קובץ `.env` והוסיפי:
     ```
     DATABASE_URL=postgresql://user:password@host:port/database
     ```

## שלב 2: הרצת Migration

פתחי Terminal בשורש הפרויקט והרצי:

```bash
npx prisma migrate dev --name add_is_sentence
```

או אם את משתמשת ב-scripts מה-package.json:

```bash
npm run db:migrate -- --name add_is_sentence
```

## שלב 3: עדכון Prisma Client

לאחר ה-migration, Prisma Client יתעדכן אוטומטית. אם לא, הרצי:

```bash
npx prisma generate
```

## שיטה חלופית: db push (לפיתוח בלבד)

אם את בפיתוח ולא רוצה ליצור migration רשמי, אפשר להשתמש ב:

```bash
npx prisma db push
```

**⚠️ שימי לב:** `db push` לא יוצר קובץ migration, רק מעדכן את המסד ישירות. זה טוב לפיתוח אבל לא מומלץ לייצור.

## איך לבדוק שהכל עבד

לאחר ה-migration, תוכלי לבדוק שהשדה נוסף:

```bash
npx prisma studio
```

זה יפתח ממשק גרפי שבו תוכלי לראות את הטבלאות והשדות.

## פתרון בעיות

**שגיאה: "Environment variable not found: DATABASE_URL"**
- וודאי שיש קובץ `.env` בשורש הפרויקט
- וודאי שה-`DATABASE_URL` מוגדר בקובץ

**שגיאה: "Can't reach database server"**
- בדקי שה-`DATABASE_URL` נכון
- בדקי שיש חיבור לאינטרנט
- אם את משתמשת ב-Vercel Postgres, וודאי שה-Connection Pooling URL נכון

**שגיאה: "Migration failed"**
- בדקי את הלוגים לראות מה השגיאה המדויקת
- אולי יש conflict עם migration קודם

