# כתיבה עברית - עוזר כתיבה AI

אפליקציית Next.js לעוזר כתיבה בעברית עם בינה מלאכותית (Claude AI).

## תכונות

- ✍️ יצירת מאמרים בעברית
- 📧 כתיבת אימיילים מקצועיים
- 📱 יצירת פוסטים לרשתות חברתיות
- 📝 כתיבת פרוטוקולים
- 🎬 יצירת תסריטים
- 💰 הצעות מחיר
- 📖 סיכומים
- 🎭 סיפורים
- 🔧 שיפור טקסטים קיימים

## התקנה מקומית

1. שכפל את הפרויקט:
```bash
git clone https://github.com/liatbenshai/ktiva-evrit.git
cd ktiva-evrit
```

2. התקן dependencies:
```bash
npm install
```

3. צור קובץ `.env.local` והגדר את משתני הסביבה:
```bash
cp env.example .env.local
```

4. הוסף את מפתח ה-API של Anthropic:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

5. הפעל את השרת:
```bash
npm run dev
```

6. פתח [http://localhost:3002](http://localhost:3002) בדפדפן

## משתני סביבה

- `ANTHROPIC_API_KEY` - מפתח API של Anthropic (Claude AI)
- `DATABASE_URL` - חיבור למסד נתונים PostgreSQL

## הגדרת מסד נתונים

1. **הגדר את `DATABASE_URL`** ב-Environment Variables
2. **הרץ את הפקודות הבאות:**
```bash
npm run db:generate
npm run db:push
```

## גישה לאפליקציה

האפליקציה פתוחה לכולם ללא צורך בהתחברות. פשוט פתח את הדפדפן וגש ל-[http://localhost:3002](http://localhost:3002) כדי להתחיל לכתוב.

## הערות Deployment

- הפרויקט מוגדר לעבוד עם Vercel
- Prisma Client נוצר אוטומטית ב-build
- מסד הנתונים מחובר דרך Vercel Postgres
- Prisma Client נוצר ב-`node_modules/.prisma/client` (תוקן!)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Force Vercel Update
