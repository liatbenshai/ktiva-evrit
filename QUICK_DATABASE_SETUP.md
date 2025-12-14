# ⚡ הגדרת מסד נתונים מהירה

## מה השתנה?
שיניתי את ה-schema מ-SQLite ל-PostgreSQL כדי שיעבוד גם ב-production (Vercel).

## מה לעשות עכשיו?

### אם יש לך כבר מסד נתונים ב-Vercel/Supabase:

1. **קבלי את ה-DATABASE_URL:**
   - **Vercel**: Vercel Dashboard → הפרויקט → Settings → Environment Variables → העתקי את `DATABASE_URL`
   - **Supabase**: Supabase Dashboard → הפרויקט → Settings → Database → Connection string → העתקי את ה-URL

2. **עדכני את .env.local:**
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

3. **צרי את הטבלאות:**
   ```bash
   npx prisma db push
   ```

4. **צרי משתמש admin:**
   ```bash
   npm run create-admin
   ```

---

### אם אין לך מסד נתונים:

**אפשרות מהירה (5 דקות):**

1. **לך ל-[Neon Console](https://console.neon.tech/)**
2. לחצי על **"Sign Up"** (או התחברי)
3. לחצי על **"Create a project"**
4. העתקי את ה-Connection String
5. עדכני את `.env.local`:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxxxx.neon.tech/neondb
   ```
6. הרצי:
   ```bash
   npx prisma db push
   npm run create-admin
   ```

**זה הכל!** 🎉

---

## הערות חשובות

- **ב-production (Vercel)**: ודאי שה-`DATABASE_URL` ב-Vercel Environment Variables מוגדר נכון
- **Connection Pooling**: ב-production, השתמשי ב-Connection Pooling URL (פורט 6543) אם את משתמשת ב-Supabase
- **סיסמאות**: אל תשתפי את הסיסמאות ב-Git!

---

## אם את מעדיפה להישאר עם SQLite מקומית

אם את רוצה להשתמש ב-SQLite מקומית ו-PostgreSQL ב-production, זה דורש הגדרה מורכבת יותר. אני ממליץ להשתמש ב-PostgreSQL גם מקומית כי זה פשוט יותר.

אבל אם את רוצה, אני יכול לעזור להגדיר את זה.

