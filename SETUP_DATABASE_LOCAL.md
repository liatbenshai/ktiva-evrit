# הגדרת מסד נתונים מקומי עם PostgreSQL

## אפשרות 1: Supabase (חינמי, מומלץ)

### שלב 1: יצירת פרויקט ב-Supabase
1. לך ל-[Supabase Dashboard](https://app.supabase.com/)
2. לחץ על **"New Project"**
3. מלא את הפרטים:
   - **Name**: `ktiva-evrit-local` (או כל שם אחר)
   - **Database Password**: בחרי סיסמה חזקה (שמרי אותה!)
   - **Region**: בחרי את האזור הקרוב אלייך
4. לחצי על **"Create new project"**
5. חכי 2-3 דקות עד שהפרויקט מוכן

### שלב 2: קבלת Connection String
1. בפרויקט החדש, לך ל-**Settings** → **Database**
2. גלול למטה עד **"Connection string"**
3. בחר **"URI"** (לא "Session mode")
4. העתקי את ה-URL - הוא נראה כך:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. החלפי את `[YOUR-PASSWORD]` בסיסמה שבחרת

### שלב 3: עדכון .env.local
1. פתחי את `.env.local`
2. עדכני את `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
3. שמרי את הקובץ

### שלב 4: יצירת הטבלאות
```bash
npx prisma db push
```

---

## אפשרות 2: Neon (חינמי, מהיר)

### שלב 1: יצירת פרויקט ב-Neon
1. לך ל-[Neon Console](https://console.neon.tech/)
2. לחצי על **"Sign Up"** (או התחברי אם יש לך חשבון)
3. לחצי על **"Create a project"**
4. מלאי את הפרטים:
   - **Name**: `ktiva-evrit-local`
   - **Region**: בחרי את האזור הקרוב אלייך
5. לחצי על **"Create project"**

### שלב 2: קבלת Connection String
1. אחרי יצירת הפרויקט, תראי את ה-Connection String ישירות
2. לחצי על **"Copy"** ליד ה-Connection String
3. ה-URL נראה כך:
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb
   ```

### שלב 3: עדכון .env.local
1. פתחי את `.env.local`
2. עדכני את `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb
   ```
3. שמרי את הקובץ

### שלב 4: יצירת הטבלאות
```bash
npx prisma db push
```

---

## אפשרות 3: Docker PostgreSQL (מקומי לחלוטין)

אם את רוצה להריץ PostgreSQL מקומית על המחשב שלך:

### שלב 1: התקנת Docker
1. הורידי והתקיני [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. הפעילי את Docker Desktop

### שלב 2: הרצת PostgreSQL
```bash
docker run --name ktiva-postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=ktiva_evrit -p 5432:5432 -d postgres:15
```

### שלב 3: עדכון .env.local
```env
DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/ktiva_evrit
```

### שלב 4: יצירת הטבלאות
```bash
npx prisma db push
```

---

## בדיקה

אחרי שהגדרת את מסד הנתונים:

```bash
# בדוק את החיבור
npm run db:check

# צור משתמש admin
npm run create-admin
```

---

## הערות חשובות

1. **ב-production (Vercel)**: ודאי שה-`DATABASE_URL` ב-Vercel Environment Variables מוגדר נכון
2. **Connection Pooling**: ב-production, השתמשי ב-Connection Pooling URL (פורט 6543) ולא Direct connection (פורט 5432)
3. **סיסמאות**: אל תשתפי את הסיסמאות ב-Git! הן רק ב-`.env.local` (שמופיע ב-.gitignore)

---

## איזו אפשרות לבחור?

- **Supabase**: הכי קל, חינמי, עובד מצוין
- **Neon**: מהיר, חינמי, טוב לפיתוח
- **Docker**: מקומי לחלוטין, לא תלוי בשירותים חיצוניים

**המלצה**: Supabase או Neon - הכי פשוט ומהיר להתחיל!

