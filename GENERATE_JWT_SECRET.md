# יצירת JWT_SECRET

## מה זה JWT_SECRET?

`JWT_SECRET` הוא מפתח סודי שמשמש להצפנת ה-tokens של המשתמשים במערכת האימות. זה כמו "מפתח" שמאפשר למערכת לזהות אם token הוא אמיתי או מזויף.

## למה זה חשוב?

- **אבטחה**: מונע מאנשים אחרים ליצור tokens מזויפים
- **זיהוי משתמשים**: מאפשר למערכת לזהות מי המשתמש המחובר
- **Session Management**: שומר על המשתמש מחובר בין בקשות

## איך ליצור מפתח חדש?

### אפשרות 1: באמצעות Node.js (מומלץ)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

זה ייצור מפתח אקראי של 64 תווים (32 bytes ב-hex).

### אפשרות 2: באמצעות OpenSSL

```bash
openssl rand -hex 32
```

### אפשרות 3: מפתח ידני

כתבי מחרוזת אקראית של לפחות 32 תווים, למשל:
```
my-super-secret-jwt-key-2024-ktiva-evrit-production
```

**⚠️ חשוב**: המפתח צריך להיות:
- ארוך (לפחות 32 תווים)
- אקראי (לא משהו שניתן לנחש)
- ייחודי (לא להשתמש באותו מפתח בפרויקטים שונים)

## איפה להוסיף את המפתח?

### 1. ב-Vercel (Production)

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחרי את הפרויקט `ktiva-evrit`
3. לך ל-**Settings** → **Environment Variables**
4. לחצי **Add New**
5. שם: `JWT_SECRET`
6. ערך: המפתח שיצרת (למשל: `33afb330bd199c63363578acb1804a3d6685132ceb2700ca7229ecaf80d4832d`)
7. בחרי את כל הסביבות: ✅ Production, ✅ Preview, ✅ Development
8. לחצי **Save**

### 2. מקומית (Development)

צרי קובץ `.env.local` בשורש הפרויקט והוסף:

```env
JWT_SECRET=your-generated-secret-key-here
```

**⚠️ חשוב**: הקובץ `.env.local` כבר נמצא ב-`.gitignore`, אז הוא לא יועלה ל-GitHub.

## בדיקה שהכל עובד

לאחר שהוספת את `JWT_SECRET` ב-Vercel:

1. **Redeploy** את הפרויקט (או חכי ל-deployment הבא)
2. נסי להתחבר/להירשם
3. אם הכל עובד - המערכת תשתמש במפתח החדש

## מה קורה אם לא מוגדר JWT_SECRET?

אם `JWT_SECRET` לא מוגדר, המערכת תשתמש במפתח ברירת מחדל:
```
your-secret-key-change-in-production
```

**⚠️ זה לא בטוח ל-Production!** תמיד הגדירי מפתח ייחודי ב-Vercel.

## האם המפתח נדחף ל-GitHub?

**לא!** המפתח הוא סוד ולא צריך להיות ב-GitHub. הקוד משתמש ב-`process.env.JWT_SECRET` שקורא את הערך מ-Environment Variables, לא מהקוד עצמו.

