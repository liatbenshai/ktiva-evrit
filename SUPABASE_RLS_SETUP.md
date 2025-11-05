# הגדרת Row-Level Security (RLS) ב-Supabase

## מה זה RLS?

Row-Level Security (RLS) הוא מנגנון אבטחה של PostgreSQL שמאפשר לשלוט בגישה לנתונים ברמת השורות. זה חשוב כי Supabase חושף את הנתונים דרך API.

## למה זה חשוב?

- **אבטחה**: מונע גישה לא מורשית לנתונים דרך Supabase API
- **Prisma**: Prisma מתחבר ישירות למסד הנתונים, אז RLS לא אמור להשפיע עליו
- **מומלץ**: Supabase ממליץ להפעיל RLS על כל הטבלאות

## איך להפעיל RLS?

### אופציה 1: דרך Supabase Dashboard (פשוט יותר)

1. לך ל-[Supabase Dashboard](https://app.supabase.com/)
2. בחר את הפרויקט שלך
3. לך ל-**Authentication** → **Policies** (או **Table Editor** → בחר טבלה → **RLS**)
4. לכל טבלה:
   - לחץ על הטבלה (למשל `TranslationPattern`)
   - לחץ על **"Enable RLS"**
   - זה יאפשר גישה רק דרך Prisma (חיבור ישיר)

### אופציה 2: דרך SQL Editor (מדויק יותר)

1. לך ל-Supabase Dashboard → **SQL Editor**
2. הרץ את השאילתות הבאות:

```sql
-- הפעלת RLS על כל הטבלאות
ALTER TABLE "TranslationPattern" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AICorrection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Synonym" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LearningData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GeneratedContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Idiom" ENABLE ROW LEVEL SECURITY;
```

## האם זה ישפיע על Prisma?

**לא!** Prisma מתחבר ישירות למסד הנתונים (לא דרך Supabase API), אז RLS לא חוסם אותו.

**אבל:** אם את משתמשת ב-Supabase API ישירות (לא דרך Prisma), תצטרכי להגדיר Policies.

## מה לעשות אם את משתמשת ב-Supabase API?

אם את משתמשת ב-Supabase API ישירות (לא רק Prisma), תצטרכי להגדיר Policies:

```sql
-- דוגמה: Policy שמאפשר גישה לקריאה לכל המשתמשים
CREATE POLICY "Allow public read access" ON "TranslationPattern"
FOR SELECT USING (true);

-- דוגמה: Policy שמאפשר כתיבה רק למשתמשים מסוימים
CREATE POLICY "Allow authenticated users to insert" ON "TranslationPattern"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**אבל:** אם את משתמשת רק ב-Prisma (כמו ברוב המקרים), לא צריך להגדיר Policies - Prisma יעבור ישירות.

## המלצה

**למערכת שלך (שתמשת רק ב-Prisma):**

1. הפעילי RLS על כל הטבלאות (כמו בשאילתות למעלה)
2. **לא צריך** להגדיר Policies - Prisma יעבוד כרגיל
3. זה יגן על הנתונים מפני גישה דרך Supabase API

## בדיקה

אחרי הפעלת RLS:
1. נסי לגשת לדף "דפוסים שנלמדו" - אמור לעבוד כרגיל
2. אם יש בעיה - כנראה הגדרת Policies שלא מאפשרות גישה
3. במקרה כזה, תצטרכי להסיר את ה-Policies או לשנות אותם

## סיכום

- **הפעלת RLS = טוב לאבטחה** ✅
- **Prisma יעבוד כרגיל** (לא משפיע) ✅
- **לא צריך Policies** אם משתמשים רק ב-Prisma ✅

