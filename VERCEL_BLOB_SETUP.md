# הוראות הגדרת Vercel Blob Storage

## למה צריך את זה?

Vercel מגביל את גודל הבקשות ל-4.5MB. כדי לתמוך בקבצי קול גדולים יותר (עד 20MB), אנו משתמשים ב-Vercel Blob Storage.

## שלב 1: יצירת Blob Store ב-Vercel

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**Storage** → **Create Database** → **Blob**
4. בחר שם ל-Blob Store (למשל: `ktiva-evrit-blob`)
5. לחץ על **Create**

## שלב 2: קבלת BLOB_READ_WRITE_TOKEN

לאחר יצירת ה-Blob Store, Vercel יוסיף אוטומטית את המשתנה `BLOB_READ_WRITE_TOKEN` למשתני הסביבה של הפרויקט.

**איך לבדוק:**
1. לך ל-**Settings** → **Environment Variables**
2. חפש את `BLOB_READ_WRITE_TOKEN`
3. אם הוא לא קיים, לחץ על **Add** והוסף אותו ידנית (המפתח יופיע בדף ה-Blob Store)

## שלב 3: הגדרה מקומית (.env.local)

הוסף את המשתנה הבא ל-`.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**איך למצוא את המפתח:**
1. לך ל-Vercel Dashboard → הפרויקט שלך → **Storage**
2. לחץ על ה-Blob Store שיצרת
3. העתק את ה-`BLOB_READ_WRITE_TOKEN` מהדף

## שלב 4: בדיקה

לאחר ההגדרה:
- קבצים קטנים מ-4MB יעבדו ישירות (ללא Blob Storage)
- קבצים גדולים מ-4MB יעלו אוטומטית ל-Blob Storage ואז יומרו

## פתרון בעיות

### שגיאה: "BLOB_READ_WRITE_TOKEN is not defined"
**פתרון:** ודא שהוספת את המשתנה ל-`.env.local` וב-Vercel Dashboard

### שגיאה: "Failed to upload to Blob Storage"
**פתרון:** 
- ודא שה-Blob Store נוצר ב-Vercel
- ודא שה-`BLOB_READ_WRITE_TOKEN` נכון
- נסה ליצור Blob Store חדש

### קבצים עדיין נכשלים ב-413
**פתרון:** ודא שהקוד עודכן והשרת הופעל מחדש

## הערות

- Blob Storage הוא שירות בתשלום של Vercel (יש תוכנית חינמית עם מגבלות)
- קבצים נשמרים ב-Blob Storage וניתן למחוק אותם לאחר השימוש
- לפרטים נוספים: [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)

