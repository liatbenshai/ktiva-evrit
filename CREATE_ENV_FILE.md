# איך ליצור קובץ .env.local

## שלב 1: מצאי את ה-DATABASE_URL

יש לך שתי אפשרויות:

### אפשרות א': מ-Vercel (אם הפרויקט מועלה ל-Vercel)

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחרי את הפרויקט `ktiva-evrit`
3. לך ל-**Settings** → **Environment Variables**
4. מצאי את `DATABASE_URL` והעתיקי אותו

### אפשרות ב': מ-Supabase (אם את משתמשת ב-Supabase)

1. לך ל-[Supabase Dashboard](https://app.supabase.com/)
2. בחרי את הפרויקט שלך
3. לך ל-**Settings** → **Database**
4. גללי למטה עד **"Connection Pooling"**
5. תחת **"Session mode"**, לחצי על **"Connection string"**
6. העתיקי את ה-URL - הוא נראה כך:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   **שים לב:**
   - ✅ פורט **6543** (לא 5432!)
   - ✅ `pooler.supabase.com` (לא `db.supabase.co`!)
   - ✅ החלפי `[YOUR-PASSWORD]` בסיסמה האמיתית

## שלב 2: צרי קובץ .env.local

1. צרי קובץ חדש בשם `.env.local` בשורש הפרויקט (באותו מקום כמו `package.json`)

2. הוסיפי את התוכן הבא:

```env
# Database URL
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Anthropic API Key (אם יש לך)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# JWT Secret (אופציונלי)
JWT_SECRET=your_jwt_secret_here
```

3. **החלפי:**
   - `[PROJECT-REF]` - מזהה הפרויקט מ-Supabase
   - `[YOUR-PASSWORD]` - הסיסמה של מסד הנתונים
   - `[REGION]` - האזור (למשל: `us-east-1`)

4. שמרי את הקובץ

## שלב 3: הרצי את ה-Migration

לאחר שיצרת את הקובץ `.env.local`, הרצי:

```bash
npx prisma migrate dev --name add_is_sentence
```

או:

```bash
npx prisma db push
```

## הערות חשובות

- ✅ קובץ `.env.local` לא נשמר ב-Git (זה בטוח!)
- ✅ Next.js קורא אוטומטית את `.env.local`
- ✅ אם את משתמשת ב-Vercel, ה-DATABASE_URL כבר מוגדר שם - רק צריך אותו מקומית

