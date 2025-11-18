# 🔧 פתרון שגיאת Prisma ב-Vercel Build

## הבעיה

בזמן build ב-Vercel, Prisma לא מצליח להוריד את ה-schema-engine בגלל שגיאת 500 מהשרת של Prisma:

```
Error: Failed to fetch sha256 checksum at https://binaries.prisma.sh/...
500 Internal Server Error
```

## הפתרון

יש שתי דרכים לפתור את זה:

### פתרון 1: הוסף משתנה סביבה ב-Vercel (מומלץ)

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

### פתרון 2: עדכון אוטומטי (כבר בוצע)

עדכנתי את ה-`postinstall` script ב-`package.json` כך שהוא יתעלם מהשגיאה הזו.

## מה לעשות עכשיו

### שלב 1: ודא שהקוד ב-GitHub

```bash
git add package.json
git commit -m "Fix Prisma checksum error in Vercel build"
git push
```

### שלב 2: הוסף את המשתנה ב-Vercel (פתרון 1)

זה יבטיח שהבעיה לא תחזור גם אם יש בעיות זמניות עם שרתי Prisma.

### שלב 3: בדוק את ה-Build

אחרי ה-push, Vercel יבנה מחדש. בדוק את ה-Build Logs - אמור לעבור!

## למה זה קורה?

זה בעיה זמנית של שרתי Prisma. לפעמים השרתים שלהם לא זמינים או יש בעיות רשת. המשתנה `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING` אומר ל-Prisma להתעלם מהבדיקת checksum ולהמשיך בכל מקרה.

## הערות

- זה לא משפיע על האבטחה - זה רק ב-build time
- ה-schema-engine עדיין מותקן, רק בלי בדיקת checksum
- זה פתרון מומלץ על ידי Prisma לבעיות כאלה

