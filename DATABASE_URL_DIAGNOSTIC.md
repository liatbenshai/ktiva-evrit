# 🔍 אבחון בעיות DATABASE_URL

## הבעיות הנפוצות

### 1. ❌ DATABASE_URL לא מוגדר
**תסמינים:**
- שגיאת "DATABASE_URL is not set"
- Prisma לא מצליח להתחבר

**פתרון:**
```bash
# מקומי - צור .env.local
cp env.example .env.local
# ערוך את .env.local והוסף את ה-DATABASE_URL
```

**ב-Vercel:**
1. לך ל-Vercel Dashboard → Settings → Environment Variables
2. הוסף `DATABASE_URL` עם הערך הנכון
3. **חשוב:** בצע Redeploy אחרי הוספת המשתנה!

---

### 2. ❌ שימוש ב-Direct Connection במקום Connection Pooling
**תסמינים:**
- שגיאת "Can't reach database server at `db.xxx.supabase.co:5432`"
- עובד מקומי אבל לא ב-Vercel production

**הבעיה:**
```
❌ URL שגוי (לא עובד ב-Vercel):
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

**הפתרון:**
```
✅ URL נכון (עובד ב-Vercel):
postgresql://postgres.xxx:password@aws-0-xxx.pooler.supabase.com:6543/postgres
```

**איך לתקן:**
1. לך ל-[Supabase Dashboard](https://app.supabase.com/)
2. בחר את הפרויקט → Settings → Database
3. גלול ל-**Connection Pooling** → **Session mode**
4. העתק את ה-Connection string (פורט 6543)
5. עדכן את `DATABASE_URL` ב-Vercel
6. **חשוב:** בצע Redeploy!

---

### 3. ❌ הטבלאות לא קיימות במסד הנתונים
**תסמינים:**
- שגיאת "Table does not exist" או "P2021"
- Prisma מתחבר אבל לא מוצא טבלאות

**פתרון מקומי:**
```bash
npm run db:push
```

**פתרון ב-Vercel:**
1. ודא שב-`package.json` יש:
   ```json
   "build": "prisma generate && prisma db push && next build"
   ```
2. או הוסף `postinstall`:
   ```json
   "postinstall": "prisma generate && prisma db push"
   ```

---

### 4. ❌ סיסמה שגויה או מסד נתונים לא פעיל
**תסמינים:**
- שגיאת "authentication failed"
- שגיאת "connection refused"

**פתרון:**
1. ודא שהסיסמה ב-DATABASE_URL נכונה
2. ודא שמסד הנתונים פעיל ב-Supabase Dashboard
3. בדוק את ה-IP allowlist ב-Supabase (אם יש)

---

## 🔧 כלי אבחון

הרץ את הסקריפט הבא לבדיקה מקיפה:

```bash
npx tsx scripts/check-database.ts
```

הסקריפט יבדוק:
- ✅ האם DATABASE_URL מוגדר
- ✅ איזה סוג חיבור (Pooling/Direct)
- ✅ האם החיבור עובד
- ✅ האם הטבלאות קיימות

---

## 📋 רשימת בדיקה מהירה

- [ ] DATABASE_URL מוגדר ב-`.env.local` (מקומי) או ב-Vercel (production)
- [ ] ה-URL משתמש ב-Connection Pooling (פורט 6543) ב-production
- [ ] הסיסמה נכונה
- [ ] מסד הנתונים פעיל ב-Supabase
- [ ] הטבלאות נוצרו (`npm run db:push`)
- [ ] בוצע Redeploy ב-Vercel אחרי עדכון DATABASE_URL

---

## 🆘 עדיין לא עובד?

1. **בדוק את ה-logs:**
   - מקומי: `npm run dev` - ראה את ה-console
   - Vercel: Dashboard → Deployments → Function Logs

2. **הרץ את סקריפט האבחון:**
   ```bash
   npx tsx scripts/check-database.ts
   ```

3. **בדוק את ה-DATABASE_URL:**
   - ודא שהוא מתחיל ב-`postgresql://`
   - ודא שהסיסמה לא מכילה תווים מיוחדים (אם כן, צריך ל-URL encode)
   - ודא שהפורט נכון (6543 ל-Pooling, 5432 ל-Direct)

4. **נסה חיבור ישיר:**
   ```bash
   # עם psql (אם מותקן)
   psql "DATABASE_URL"
   ```

---

## 📚 קישורים שימושיים

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

