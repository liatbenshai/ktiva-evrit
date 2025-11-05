# תיקון שגיאת 404 ב-Vercel

## הבעיה
Vercel מחזיר שגיאת 404: `DEPLOYMENT_NOT_FOUND`

## פתרונות אפשריים

### פתרון 1: בדיקת Build Status ב-Vercel

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחרי את הפרויקט `ktiva-evrit`
3. לך ל-**Deployments**
4. בדקי את ה-deployment האחרון:
   - אם יש ❌ (כשל) - לחצי עליו כדי לראות את השגיאה
   - אם יש ✅ (הצלחה) - אבל עדיין יש 404, נסי פתרון 2

### פתרון 2: Redeploy ידני

1. ב-Vercel Dashboard → הפרויקט שלך → **Deployments**
2. לחצי על ה-3 נקודות (⋯) ליד ה-deployment האחרון
3. בחרי **"Redeploy"**
4. חכי שהבנייה תסתיים

### פתרון 3: בדיקת Build Logs

אם ה-build נכשל:

1. לך ל-**Deployments** → ה-deployment האחרון
2. לחצי עליו כדי לראות את ה-Build Logs
3. חפשי שגיאות כמו:
   - `Error: Command "npm install" exited with 1`
   - `Error: Command "npm run build" exited with 1`
   - `TypeError` או `SyntaxError`

### פתרון 4: דחיפת Commit חדש

אם יש בעיה עם ה-deployment, נסי לדחוף commit חדש:

```bash
git add .
git commit -m "Trigger new deployment"
git push origin master
```

זה יגרום ל-Vercel לבנות את הפרויקט מחדש.

### פתרון 5: בדיקת Environment Variables

ודאי שכל ה-Environment Variables מוגדרים:

1. ב-Vercel Dashboard → **Settings** → **Environment Variables**
2. ודאי שיש:
   - `DATABASE_URL` (עם Connection Pooling URL מ-Supabase)
   - `ANTHROPIC_API_KEY` (אם נדרש)

### פתרון 6: בדיקת Domain/URL

ודאי שאת ניגשת ל-URL הנכון:
- בדקי ב-Vercel Dashboard → **Settings** → **Domains** מה ה-URL של הפרויקט
- או לך ל-**Deployments** → ה-deployment האחרון → לחצי על "Visit"

## מה לבדוק עכשיו

1. **לכי ל-Vercel Dashboard** → **Deployments**
2. **בדקי את ה-deployment האחרון** - מה הסטטוס שלו?
3. **אם יש שגיאה** - שלחי את ה-Build Logs
4. **אם הכל בסדר** - נסי לעשות Redeploy

## אם עדיין לא עובד

אם אחרי כל הפתרונות עדיין יש 404:
1. שלחי את ה-Build Logs מה-deployment האחרון
2. שלחי את ה-URL שאת מנסה לגשת אליו
3. אבדוק מה הבעיה

