# 🔧 פתרון שגיאת Prisma ב-Vercel Build

## הבעיה

בזמן build ב-Vercel, Prisma לא מצליח להוריד את ה-schema-engine בגלל שגיאת 500 מהשרת של Prisma:

```
Error: Failed to fetch sha256 checksum at https://binaries.prisma.sh/...
500 Internal Server Error
```

## הפתרון

**הדרך היחידה לפתור את זה היא להוסיף משתנה סביבה ב-Vercel:**

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Environment Variables**
4. לחץ על **"Add New"**
5. הוסף:
   - **Name**: `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING`
   - **Value**: `1`
   - **Environment**: בחר **Production**, **Preview**, ו-**Development**
6. לחץ **"Save"**
7. **חשוב:** בצע **Redeploy** אחרי הוספת המשתנה!

## מה לעשות עכשיו

### שלב 1: הוסף את המשתנה ב-Vercel (חובה!)

זה יבטיח שהבעיה לא תחזור גם אם יש בעיות זמניות עם שרתי Prisma.

### שלב 2: דחוף את הקוד ל-GitHub (אם עוד לא)

```bash
git push
```

### שלב 3: בדוק את ה-Build

אחרי ה-push, Vercel יבנה מחדש. בדוק את ה-Build Logs - אמור לעבור!

## למה זה קורה?

זה בעיה זמנית של שרתי Prisma. לפעמים השרתים שלהם לא זמינים או יש בעיות רשת. המשתנה `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING` אומר ל-Prisma להתעלם מהבדיקת checksum ולהמשיך בכל מקרה.

## הערות

- זה לא משפיע על האבטחה - זה רק ב-build time
- ה-schema-engine עדיין מותקן, רק בלי בדיקת checksum
- זה פתרון מומלץ על ידי Prisma לבעיות כאלה

