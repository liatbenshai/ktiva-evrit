import { getAntiPatternInstruction } from './hebrew-anti-patterns';

// Article Prompt - with detailed SEO instructions
export const articlePrompt = (
  title: string,
  keywords: string,
  wordCount: number,
  additionalInstructions?: string
) => {
  const keywordsList = keywords.split(',').map(k => k.trim());
  const mainKeyword = keywordsList[0];
  const targetOccurrences = Math.floor(wordCount * 0.015); // 1.5% density

  return `אתה כותב תוכן מומחה עם התמחות ב-SEO. כתוב בעברית תקנית וטבעית - לא תרגום מאנגלית!

**פרטי המאמר:**
כותרת: "${title}"
אורך נדרש: לפחות ${wordCount} מילים
מילת מפתח ראשית: "${mainKeyword}"
מילות מפתח נוספות: ${keywordsList.slice(1).join(', ')}
${additionalInstructions ? `הנחיות: ${additionalInstructions}` : ''}

**חובות SEO (קריטי!):**

1. **מילת המפתח הראשית "${mainKeyword}":**
   - הופעה ראשונה בפסקה הראשונה (50 המילים הראשונות)
   - סה"כ ${targetOccurrences} הופעות לאורך המאמר
   - שלב באופן טבעי, לא מאולץ

2. **כותרות (H2, H3):**
   - לפחות 5 כותרות משנה (##)
   - כלול את מילת המפתח ב-2-3 כותרות
   - דוגמה:
     ## למה ${mainKeyword} כל כך חשוב?
     ## איך ${mainKeyword} משפיע על...
     ### טיפים ל${mainKeyword}

3. **מילות מפתח נוספות:**
   - שלב כל אחת 2-3 פעמים
   - השתמש בנרדפות וווריאציות

4. **מבנה:**
   - פסקת פתיחה (100 מילים) - הקשר + מילת מפתח
   - 3-5 חלקים עיקריים עם כותרות
   - סיכום (50 מילים)

5. **עברית תקנית וטבעית:**
${getAntiPatternInstruction()}

**פורמט הפלט:**

# ${title}

[פסקת פתיחה - 100 מילים, חייבת להכיל "${mainKeyword}"]

## כותרת ראשונה
[תוכן הסעיף - 150-200 מילים]

## כותרת שנייה
[תוכן...]

### כותרת משנה
[תוכן...]

## סיכום
[50 מילים]

כתוב מאמר מקצועי, שימושי, בעברית תקנית - עם שילוב טבעי של מילות המפתח!`;
};

// Email Prompt
export const emailPrompt = (context: string, recipient: string, tone: string) => `אתה מומחה בכתיבת מיילים מקצועיים בעברית.

**פרטי המייל:**
הקשר: ${context}
נמען: ${recipient}
טון: ${tone}

**מבנה המייל:**

1. **נושא (Subject):** קצר וברור, עד 50 תווים
2. **פתיחה:** ברכה מתאימה + הקשר קצר למה המייל נשלח
3. **גוף:** 2-3 פסקאות מקסימום. כל פסקה = נקודה אחת. שפה ברורה וקונקרטית.
4. **סיום:** קריאה לפעולה (אם נדרש) + ברכה + חתימה

${tone === 'מקצועי' ? `**טון מקצועי:**
שפה רשמית אך נגישה. "אני מבקש", "אשמח לקבל", "בהתאם לבקשתך". הימנעות מקיצורים וסלנג.` : ''}

${tone === 'ידידותי' ? `**טון ידידותי:**
שפה חמה אך מקצועית. "שלום", "תודה רבה", "אשמח לעזור". טון אישי אך מכבד.` : ''}

${tone === 'רשמי' ? `**טון רשמי:**
שפה רשמית מאוד. "אני פונה אליכם", "בהתאם להנחיות", "אני מבקש להודיע". מבנה משפטים מדויק, ללא קיצורים.` : ''}

${getAntiPatternInstruction(false)}

**פורמט הפלט:**

**נושא:** [נושא המייל]

[ברכה מתאימה],

[פסקת פתיחה - הצגה והקשר]

[גוף המייל - 1-2 פסקאות עם התוכן העיקרי]

[פסקת סיום - קריאה לפעולה/סיכום]

[ברכה מקצועית],
[שם]
[תפקיד]
[פרטי יצירת קשר]

כתוב מייל מקצועי, ברור ומדויק בעברית תקנית!`;

// Post Prompt
export const postPrompt = (topic: string, platform: string, length: string) => `אתה מומחה בכתיבת תוכן לרשתות חברתיות בעברית.

**פרטי הפוסט:**
נושא: ${topic}
פלטפורמה: ${platform}
אורך: ${length}

**הנחיות לפי פלטפורמה:**

${platform.toLowerCase().includes('linkedin') ? `**LinkedIn:**
- טון מקצועי ומשכנע
- פתיחה עם שורה שמושכת תשומת לב (hook)
- שורות קצרות עם רווחים ביניהן
- סיום עם שאלה או קריאה לפעולה
- האשטגים: 3-5 בסוף הפוסט, מקצועיים` : ''}

${platform.toLowerCase().includes('facebook') || platform.toLowerCase().includes('פייסבוק') ? `**Facebook:**
- טון שיחתי וחם
- פתיחה אישית שמזמינה שיתוף
- אפשר להשתמש באימוג'ים במידה
- סיום עם שאלה שמזמינה תגובות
- האשטגים: 1-3 בלבד` : ''}

${platform.toLowerCase().includes('instagram') || platform.toLowerCase().includes('אינסטגרם') ? `**Instagram:**
- טון קליל ויצירתי
- שימוש חופשי באימוג'ים
- פתיחה מושכת (שורה ראשונה קריטית)
- סיפור אישי או רגשי
- האשטגים: 10-20 בסוף, בשפות שונות` : ''}

${platform.toLowerCase().includes('twitter') || platform.toLowerCase().includes('טוויטר') || platform.toLowerCase().includes('x') ? `**Twitter/X:**
- תמציתי וחד
- כל מילה חשובה — אין מקום למילוי
- סיום עם שאלה או עמדה חדה
- האשטגים: 1-2 מקסימום, משולבים בטקסט` : ''}

**עקרונות כתיבה:**
- כתוב כמו בן אדם שמדבר, לא כמו מאמר
- פתיחה חזקה — אם השורה הראשונה לא מושכת, אף אחד לא ימשיך לקרוא
- משפטים קצרים. שורות קצרות. רווחים.
- הימנע משפה ארגונית/שיווקית מנופחת
- האשטגים בעברית: ללא רווחים, מילה אחת או צירוף מילים דבוקות (#כתיבהבעברית)

${getAntiPatternInstruction(false)}

**פורמט הפלט:**

[הפוסט המלא, מוכן להעתקה ופרסום]

[האשטגים]

כתוב פוסט שנשמע כמו בן אדם אמיתי, לא כמו AI!`;

// Story Prompt
export const storyPrompt = (
  genre: string,
  characters: string,
  setting: string,
  plot: string,
  length: string,
  tone?: string,
  additionalInstructions?: string
) => `אתה סופר מוכשר בעברית. כתוב סיפור מרתק, מקורי ומלא רגש בעברית תקנית וזורמת.

**פרטי הסיפור:**
ז'אנר: ${genre}
${characters ? `דמויות עיקריות: ${characters}` : ''}
${setting ? `רקע ומקום: ${setting}` : ''}
עלילה ורעיון מרכזי: ${plot}
אורך: ${length}
${tone ? `טון וסגנון: ${tone}` : ''}
${additionalInstructions ? `הנחיות נוספות: ${additionalInstructions}` : ''}

**דרישות כתיבה:**

1. **מבנה הסיפור:**
   - התחלה מושכת שמעוררת סקרנות
   - פיתוח עלילה עם עליות ומורדות
   - שיא מרגש
   - סוף מספק (לא בהכרח שמח)

2. **דמויות:**
   - דמויות משכנעות ותלת-מימדיות
   - דיאלוגים טבעיים ואמיתיים
   - התפתחות הדמויות לאורך הסיפור

3. **שפה וסגנון:**
   - עברית עשירה וזורמת
   - תיאורים חיים שמעוררים את החושים
   - משפטים מגוונים באורך
   - שימוש בדימויים ובהשוואות
   - כתוב עברית עכשווית, לא ספרותית-ארכאית. אל תשתמש ב'הלוא', 'אף על פי כן', 'הנה כי כן'
   - דיאלוג: השתמש במקף (–) לסימון דיבור, לא בגרשיים. דוגמה:
     – מה שלומך? שאל דני.
     – בסדר, ענתה מיכל.

4. **אווירה ומתח:**
   - בנה מתח הדרגתי
   - צור אווירה המתאימה לז'אנר
   - שלב רגשות אמיתיים

5. **פיסקאות:**
   - פיסקאות קצרות-בינוניות לקריאה נעימה
   - מעברים חלקים בין סצנות

${getAntiPatternInstruction(false)}

**פורמט הפלט:**

[כותרת מושכת לסיפור]

[הסיפור המלא - מפורט, עם דיאלוגים, תיאורים ורגש]

כתוב סיפור מקצועי שיסחוף את הקורא!`;


// Summary Prompt
export const summaryPrompt = (text: string, length: string, focusPoints?: string) => `אתה מומחה בסיכום טקסטים בעברית.

**המשימה:** סכם את הטקסט הבא.

**הנחיות:**
- סכם את העיקר, לא את הפרטים
- אל תוסיף מידע שלא קיים בטקסט המקורי
- שמור על הטון המקורי — טקסט אקדמי יסוכם בשפה אקדמית, טקסט קליל בסגנון קליל
- הימנע מ'הטקסט דן ב...', 'המאמר עוסק ב...' — פשוט סכם את התוכן ישירות
- אל תתחיל ב'הטקסט מציג...' — תתחיל ישר עם התוכן

${getAntiPatternInstruction(false)}

${focusPoints ? `**נקודות מיקוד:** ${focusPoints}` : ''}
**אורך הסיכום:** ${length}

**טקסט לסיכום:**
${text}

כתוב סיכום תמציתי, ברור ומדויק.`;

// Protocol Prompt
export const protocolPrompt = (transcript: string, includeDecisions: boolean) => `אתה מומחה בכתיבת פרוטוקולים בעברית.

**המשימה:** צור פרוטוקול מקוצר מהתמלול הבא.

**פורמט הפרוטוקול (תקן ישראלי):**

1. **תאריך ושעה:** [חלץ מהתמלול אם אפשר]
2. **משתתפים:** [רשימת המשתתפים שהוזכרו]
3. **נושאים שנדונו:** [כותרות קצרות]
4. **נקודות מרכזיות:**
   - נקודה אחת לכל נושא
   - משפט אחד לכל נקודה — תמציתי
${includeDecisions ? `5. **החלטות:**
   - כל החלטה בנפרד, בניסוח ברור
6. **משימות:**
   - מי, מה, עד מתי` : ''}

**הנחיות כתיבה:**
- כתוב בזמן עבר: 'הוחלט', 'סוכם', 'נדון', 'הוצג'
- כתוב בתמציתיות — משפט אחד לכל נקודה
- אל תוסיף מידע שלא הוזכר בתמלול

${getAntiPatternInstruction(false)}

**התמלול:**
${transcript}

כתוב פרוטוקול מקצועי, תמציתי ומסודר.`;

// Script Prompt
export const scriptPrompt = (
  topic: string,
  duration: string,
  audience: string,
  style: string,
  additionalInstructions?: string
) => {
  // Determine script type based on style and audience
  const isEducational = style.includes('חינוכי') || style.includes('מרצה') || audience.includes('סטודנטים') || audience.includes('תלמידים');
  const isMarketing = style.includes('שיווקי') || style.includes('פרסומי') || audience.includes('לקוחות');
  const isExplanatory = style.includes('הסברתי') || style.includes('הדרכה') || style.includes('טוטוריאל');
  const isPresentation = style.includes('פרזנטציה') || style.includes('הרצאה') || audience.includes('מנהלים');
  const isCourse = style.includes('קורס') || style.includes('תמלול');

  // Special guidelines for different script types
  const getStyleGuidelines = () => {
    if (isCourse) {
      return `
**הנחיות למרצה מקצועית (ליאת) - קורס תמלול בעברית:**
- שפה מדוברת טבעית שזורמת כשקוראים מטלפרומפטר
- דיבור ישיר לסטודנטים: "אתם", "תוכלו", "נלמד ביחד"
- הסברים ברורים עם דוגמאות קונקרטיות משולבות מתמלול
- עידוד מתמיד: "מצוין", "נהדר", "אתם מתקדמים יפה"
- שפה מקצועית אך נגישה
- טון: מרצה מנוסה, חמה, סבלנית ומעודדת
- **נושאים אפשריים:** כללי תמלול, סימני פיסוק, הבדל בין תמלול מילולי למשפטי, תמלול של דיבור מהיר, טיפול בהפסקות ובמילות מילוי, תמלול של שמות ומונחים מקצועיים`;
    }

    if (isEducational) {
      return `
**הנחיות לתסריט חינוכי:**
- שפה ברורה ונגישה לקהל היעד
- הסברים מפורטים עם דוגמאות קונקרטיות
- מבנה לוגי: מושג → הסבר → דוגמה → תרגול
- טון: מקצועי, סבלני ומעודד
- שימוש בדוגמאות מהחיים האמיתיים
- חזרה על נקודות חשובות`;
    }

    if (isMarketing) {
      return `
**הנחיות לתסריט שיווקי:**
- פתיחה מושכת שתפסיק את תשומת הלב
- הדגשת יתרונות ויתרונות ייחודיים
- קריאה לפעולה ברורה וחזקה
- טון: אנרגטי, משכנע, אמין
- שימוש בסיפורים ורגשות
- סיום עם קריאה לפעולה`;
    }

    if (isExplanatory) {
      return `
**הנחיות לתסריט הסברתי:**
- הסבר ברור ופשוט של הנושא
- שלבים לוגיים וקלים לעקיבה
- דוגמאות ויזואליות ברורות
- טון: מקצועי, ברור, לא מורכב
- שימוש במטאפורות ודימויים
- סיכום של הנקודות העיקריות`;
    }

    if (isPresentation) {
      return `
**הנחיות לתסריט פרזנטציה:**
- פתיחה חזקה שתפסיק את תשומת הלב
- מבנה ברור עם נקודות מרכזיות
- נתונים ועובדות תומכות
- טון: מקצועי, סמכותי, משכנע
- שימוש בגרפים ונתונים ויזואליים
- סיום עם מסקנות ברורות`;
    }

    return `
**הנחיות כלליות לתסריט:**
- שפה ברורה ונגישה לקהל היעד
- מבנה לוגי וקל לעקיבה
- טון מקצועי ומתאים לנושא
- שימוש בדוגמאות רלוונטיות
- סיום ברור עם מסקנות`;
  };

  const getStructureGuidelines = () => {
    if (isCourse) {
      return `
**מבנה קבוע לסרטוני הקורס:**
1. פתיח קצר - הצגת הנושא והמטרה
2. הסבר משולב עם דוגמאות - הדגמות מעשיות תוך כדי הסבר
3. סיכום - חזרה קצרה על הנקודות העיקריות`;
    }

    if (isMarketing) {
      return `
**מבנה תסריט שיווקי:**
1. פתיחה מושכת (Hook) - 5-10 שניות
2. הצגת הבעיה - מה הבעיה שהמוצר פותר
3. הצגת הפתרון - איך המוצר פותר את הבעיה
4. הוכחות - עדויות, נתונים, המלצות
5. קריאה לפעולה - מה הצופה צריך לעשות`;
    }

    if (isEducational || isExplanatory) {
      return `
**מבנה תסריט חינוכי/הסברתי:**
1. פתיחה - הצגת הנושא והמטרה
2. הסבר עיקרי - 2-3 נקודות מרכזיות
3. דוגמאות - הדגמות מעשיות
4. סיכום - חזרה על הנקודות העיקריות`;
    }

    if (isPresentation) {
      return `
**מבנה תסריט פרזנטציה:**
1. פתיחה חזקה - הצגת הנושא והמטרה
2. נקודות מרכזיות - 3-5 נקודות עיקריות
3. נתונים ועובדות - תמיכה בנקודות
4. מסקנות - סיכום והמלצות`;
    }

    return `
**מבנה תסריט כללי:**
1. פתיחה - הצגת הנושא
2. תוכן עיקרי - 2-4 נקודות מרכזיות
3. דוגמאות - הדגמות מעשיות
4. סיכום - חזרה על הנקודות העיקריות`;
  };

  return `אתה תסריטאי מקצועי עם ניסיון רב בכתיבת תסריטים לסרטונים.
כתוב תסריט **שנועד להיקרא מטלפרומפטר** - הטקסט חייב לזרום טבעית כשקוראים אותו בקול רם.
כתוב בעברית מדוברת טבעית - לא תרגום מילולי מאנגלית.

**פרטי התסריט:**
נושא: ${topic}
משך: ${duration}
קהל יעד: ${audience}
סגנון: ${style}
${additionalInstructions ? `הנחיות נוספות: ${additionalInstructions}` : ''}

${getStyleGuidelines()}

${getStructureGuidelines()}

**עקרונות כתיבה חשובים (קריטי!):**

- כתוב משפטים שזורמים טבעית כשקוראים אותם בקול רם
- המשפטים צריכים להישמע כאילו מדברים ספונטנית, לא קוראים
- אין צורך בסימוני נשימה או הנהון - רק הטקסט עצמו
- 10-15 מילים למשפט (נוח לקריאה, לא קצוץ מדי)
- משפט אחד = רעיון אחד. הימנע ממשפטי ענק שקשה לקרוא
- "בואו נראה" / "עכשיו נבחן" (סגנון דיבור)
- השתמש בביטויים מדוברים: "אז מה יש לנו פה", "הנה מה שקורה"
- כתוב כמו שמדברים, לא כמו שכותבים
- 130-150 מילים לדקה. קצב משתנה: מהיר בחלקים קלים, איטי בחלקים מורכבים
- "אתם", "תוכלו", "תראו" (לא "הצופים", "אנשים") — פנייה ישירה יוצרת קשר
- הערות ויזואליות בסוגריים מרובעים: [מציגים על המסך: דוגמה], [זום על הטקסט] — הן להפקה בלבד, לא נקראות
- **שילוב הסבר ודוגמה** — לא מפרידים! "זה עובד כך... בואו נראה דוגמה"
- **חזרה על מושגי מפתח** — לפחות 2-3 פעמים בניסוחים שונים
- **דוגמאות רלוונטיות** — משפטים מדוברים, מקרים מהחיים
- **איזון מילולי-ויזואלי** — אל תסביר במילים מה שאפשר להראות על המסך

${getAntiPatternInstruction(false)}

**פורמט פלט מלא:**

📌 **כותרת מוצעת:** [כותרת קצרה ומושכת לשיעור]

---

🎬 **פתיח קצר (0:00-0:15)**
[הערות טכניות לעריכה]

[הטקסט המדויק שיוקרא - בעברית מדוברת טבעית]

---

📚 **הסבר משולב עם דוגמאות (0:15-[X]:XX)**

**נקודה #1 - [שם הנקודה]**
[הערות טכניות - למשל: מציגים על המסך, זום על...]

[הטקסט שיוקרא - הסבר + מעבר טבעי לדוגמה + הדגמה]

**נקודה #2 - [שם הנקודה]**
[הערות טכניות]

[הטקסט שיוקרא]

**נקודה #3 - [שם הנקודה]** (אם רלוונטי)
[הערות טכניות]

[הטקסט שיוקרא]

---

✨ **סיכום ([X]:XX-[X]:XX)**
[הערות טכניות]

[הטקסט שיוקרא - חזרה על הנקודות + עידוד + קריאה לפעולה]

---

📊 **סיכום טכני:**
- מספר מילים: [X]
- זמן משוער: [X] דקות ([X] מילים ÷ 140 מילים/דקה)
- קצב ממוצע: [X] מילים/דקה
- מספר נקודות עיקריות: [X]
- מספר דוגמאות: [X]

כתוב תסריט מקצועי, ברור, מעניין שזורם טבעית כשקוראים אותו בקול רם!`;
};

// Worksheet Prompt - דפי עבודה ללימודים
export const worksheetPrompt = (
  instruction: string,
  story?: string,
  grade?: string,
  subject?: string
) => {
  const hasStory = story && story.trim().length > 0;

  const getVerticalMathInstructions = () => `**חשוב מאוד - פורמט תרגילי חשבון:**
- אם ההוראה כוללת תרגילי חשבון (חיבור, חיסור, כפל, חילוק), כתוב אותם בפורמט מאונך (vertical)!
- **אל תכלול מספור (1), (2) וכו' - התרגילים ללא מספור!**
- **חשוב מאוד: המספרים חייבים להיות מיושרים זה מעל זה - המספר הראשון (כמו 23) והמספר השני (כמו 15) צריכים להתחיל באותה הזחה!**
- **חשוב מאוד: הסימן (+ או -) צריך להיות משמאל למספר השני, כך שהמספרים עצמם מתיישרים זה מעל זה!**
- דוגמה לפורמט מאונך נכון:
   23
  +15
  ---
  תשובה: _______

או:
   56
  -32
  ---
  תשובה: _______

- **שימו לב: המספר 23 והמספר 15 מיושרים זה מעל זה! הסימן + נמצא משמאל ל-15, כך ש-15 מתחיל באותה הזחה כמו 23!**
- אל תכתוב תרגילים בפורמט אופקי כמו "23 + 14 = ___" או "56 - 32 = ___"
- סדר: שורה 1 - המספר הראשון מיושר ימינה, שורה 2 - סימן + והמספר השני מיושר כך שהמספרים מתיישרים, שורה 3 - קו הפרדה (---), שורה 4 - תשובה
- **אל תכלול מספור בשורות או לפני המספרים!**`;

  const getTextFormatInstructions = () => `**חשוב מאוד - פורמט טקסט:**
- כתוב טקסט רגיל בלבד, ללא סימני markdown (ללא כוכביות כפולות, ללא backticks, ללא גרשיים משולשים, ללא סימן hash)
- אל תכתוב קוד או code blocks
- כתוב טקסט נקי ופשוט
- כל שורה היא שורה רגילה של דף עבודה`;

  if (hasStory) {
    // מקרה 1: שאלות על בסיס סיפור
    return `אתה מורה מקצועי ומומחה בהכנת דפי עבודה וחומרי לימוד.
תפקידך להכין דף עבודה עם שאלות על בסיס הסיפור הנתון.

**הסיפור:**
${story}

**ההוראה:**
${instruction}

${grade ? `**רמת כיתה:** ${grade}` : ''}
${subject ? `**נושא/מקצוע:** ${subject}` : ''}

**דרישות לדף העבודה:**

✅ **פורמט להדפסה:**
- דף עבודה מקצועי ומוכן להדפסה
- כותרת ברורה ומזמינה
- רווחים מספקים לכתיבה
- גופן גדול וקריא (מותאם לילדים)

✅ **סוגי שאלות (בהתאם לרמת הכיתה):**
${grade?.includes('א') || grade?.includes('ב') || grade?.includes('ג') ? `
- שאלות הבנת הנקרא בסיסיות (מי? מה? איפה? מתי?)
- שאלות סגורות (כן/לא, בחירה מרובה)
- השלמת משפטים
- ציור/הדגשה` : ''}
${grade?.includes('ד') || grade?.includes('ה') || grade?.includes('ו') ? `
- שאלות הבנת הנקרא מתקדמות יותר
- שאלות פתוחות קצרות
- שאלות חשיבה (למה? כיצד?)
- שאלות שדורשות הסקת מסקנות` : ''}
${grade?.includes('ז') || grade?.includes('ח') || grade?.includes('ט') ? `
- שאלות הבנה מעמיקות
- שאלות ניתוח ופרשנות
- שאלות השוואה והבעת דעה
- שאלות יצירתיות` : ''}

✅ **תוכן:**
- בין 5-10 שאלות (בהתאם לרמת הכיתה והסיפור)
- שאלות מגוונות (הבנה, חשיבה, יצירתיות)
- התאמה מדויקת לרמת הכיתה
- שימוש במילים ובביטויים מהסיפור

✅ **עיצוב:**
- מספור ברור
- הוראות קצרות ומובנות
- מקום לכתיבת שם התלמיד
- **חשוב מאוד: רווחים גדולים ומספקים לכתיבת תשובות - כל שאלה חייבת להיות עם מקום נרחב לכתיבה (לפחות 5-7 שורות)**
- **פורמט מאונך (vertical): בתרגילי חשבון, כתוב את המספרים זה מעל זה, לא בשורה אחת!**
- אפשרות לציורים/איורים (אם מתאים)

**פורמט הפלט - חשוב מאוד:**
הכן דף עבודה מוכן להדפסה בפורמט הבא:

כותרת: [כותרת מתאימה]

[מספר] שאלות עם מקום לכתיבה

בסוף הדף אפשר להוסיף "עבודת בית" או "תרגול נוסף" אם מתאים.

${getVerticalMathInstructions()}

${getTextFormatInstructions()}

כתוב דף עבודה מקצועי, מתאים לרמת הכיתה, ומוכן להדפסה!`;
  } else {
    // מקרה 2: דף עבודה לפי הוראה (מתמטיקה, לשון, וכו')
    return `אתה מורה מקצועי ומומחה בהכנת דפי עבודה וחומרי לימוד.
תפקידך להכין דף עבודה עם תרגילים בהתאם להוראה הנתונה.

**ההוראה:**
${instruction}

${grade ? `**רמת כיתה:** ${grade}` : ''}
${subject ? `**מקצוע/נושא:** ${subject}` : ''}

**דרישות לדף העבודה:**

✅ **פורמט להדפסה:**
- דף עבודה מקצועי ומוכן להדפסה
- כותרת ברורה ומזמינה
- רווחים מספקים לפתרון
- גופן גדול וקריא (מותאם לילדים)

✅ **תרגילים:**
- בין 8-15 תרגילים (בהתאם לסוג הנושא)
- רמת קושי מתאימה לכיתה
- מגוון סוגי תרגילים (קלים, בינוניים, מאתגרים)
- סידור מהקל לקשה

✅ **דוגמאות לפי נושא:**
- **מתמטיקה:** משוואות, חיבור/חיסור, כפל/חילוק, בעיות מילוליות
- **לשון:** הבנת הנקרא, דקדוק, כתיבה יצירתית
- **מדעים:** שאלות ידע, ניסויים, תצפיות
- **היסטוריה/גיאוגרפיה:** שאלות הבנה, מפות, זמנים

✅ **עיצוב:**
- מספור ברור
- הוראות קצרות ומובנות
- מקום לכתיבת שם התלמיד
- **חשוב מאוד: רווחים גדולים ומספקים לכתיבת תשובות - כל תרגיל/שאלה חייבת להיות עם מקום נרחב לכתיבה (לפחות 5-7 שורות)**
- טבלאות/תרשים אם נדרש

**פורמט הפלט - חשוב מאוד:**
הכן דף עבודה מוכן להדפסה בפורמט הבא:

כותרת: [כותרת מתאימה - למשל: "דף עבודה - משוואות עם נעלם אחד"]

[מספר] תרגילים עם מקום לפתרון

בסוף הדף אפשר להוסיף "תרגול נוסף" או "אתגר" אם מתאים.

${getVerticalMathInstructions()}

${getTextFormatInstructions()}

כתוב דף עבודה מקצועי, מתאים לרמת הכיתה, ומוכן להדפסה!`;
  }
};

// AI Prompt Creator
export const aiPromptPrompt = (
  goal: string,
  context: string,
  outputFormat: string,
  additionalRequirements?: string
) => `אתה מומחה בכתיבת Prompts למודלי AI, עם התמחות בפרומפטים בעברית.

**המשימה:** צור Prompt אפקטיבי ומדויק.

**פרטים:**
מטרה: ${goal}
הקשר: ${context}
פורמט פלט רצוי: ${outputFormat}
${additionalRequirements ? `דרישות נוספות: ${additionalRequirements}` : ''}

**עקרונות Prompt Engineering:**

1. **הגדרת תפקיד (Role):** התחל עם הגדרת תפקיד ברורה — "אתה מומחה ב..."
2. **משימה (Task):** הגדר בדיוק מה המודל צריך לעשות
3. **הקשר (Context):** ספק רקע רלוונטי — למי זה מיועד, מה המטרה
4. **אילוצים (Constraints):** מה לעשות ומה לא לעשות
5. **פורמט פלט (Output Format):** הגדר בדיוק איך התוצאה צריכה להיראות

**הנחיות נוספות:**
- אם הפרומפט בעברית, ודא שהניסוח טבעי — לא תרגום מאנגלית
- כלול דוגמאות קונקרטיות בתוך הפרומפט (few-shot)
- היה ספציפי — פרומפט מעורפל מייצר תוצאה מעורפלת
- הגדר את אורך הפלט הרצוי
- הוסף "כללי ברזל" למקרים שחשוב שהמודל לא יסטה מהם

${getAntiPatternInstruction(false)}

**פורמט הפלט:**

[הפרומפט המלא, מוכן להעתקה ושימוש]

כתוב Prompt מקצועי, ברור ומדויק!`;

// Translation Prompt - refactored with maps
export const translationPrompt = (
  text: string,
  fromLang: 'hebrew' | 'english' | 'russian' | 'french' | 'romanian' | 'italian',
  toLang: 'hebrew' | 'english' | 'russian' | 'french' | 'romanian' | 'italian',
  preferredTranslations?: Array<{ english?: string; hebrew: string; target?: string }>,
  userPreferences?: {
    forbiddenWords?: string[];
    preferredWords?: { [key: string]: string };
    stylePreferences?: {
      formality?: 'formal' | 'casual' | 'professional';
      tone?: string;
    };
  },
  context?: string
) => {
  // Language display names (in Hebrew, since the app is Hebrew)
  const LANGUAGE_NAMES: Record<string, string> = {
    hebrew: 'עברית',
    english: 'אנגלית',
    russian: 'רוסית',
    french: 'צרפתית',
    romanian: 'רומנית',
    italian: 'איטלקית',
  };

  // Translation examples per language pair
  const TRANSLATION_EXAMPLES: Record<string, string> = {
    'english-hebrew': `- "take into account" → "לקחת בחשבון" (לא "לקחת לתוך חשבון")
- "make sure" → "לוודא" (לא "לעשות בטוח")
- "in order to" → "כדי" / "על מנת" (לא "בסדר ל")`,
    'hebrew-english': `- "לקחת בחשבון" → "take into account" (לא "take to account")
- "לוודא" → "make sure" / "ensure" (לא "to make certain")
- "כדי" → "in order to" / "to" (לא "for to")`,
    'russian-hebrew': `- "принять во внимание" → "לקחת בחשבון" (לא "לקבל למחשבה")
- "убедиться" → "לוודא" (לא "להתאמת")
- "для того чтобы" → "כדי" / "על מנת" (לא "בשביל ל")`,
    'hebrew-russian': `- "לקחת בחשבון" → "принять во внимание" (לא "взять в расчет")
- "לוודא" → "убедиться" / "проверить" (לא "сделать уверенным")
- "כדי" → "для того чтобы" / "чтобы" (לא "для")`,
    'french-hebrew': `- "prendre en compte" → "לקחת בחשבון" (לא "לקחת למחשבה")
- "s'assurer" → "לוודא" (לא "להתאמת")
- "pour" → "כדי" / "על מנת" (לא "בשביל ל")`,
    'hebrew-french': `- "לקחת בחשבון" → "prendre en compte" (לא "prendre dans compte")
- "לוודא" → "s'assurer" / "vérifier" (לא "faire sûr")
- "כדי" → "pour" / "afin de" (לא "pour à")`,
    'romanian-hebrew': `- "a lua în considerare" → "לקחת בחשבון" (לא "לקבל למחשבה")
- "a se asigura" → "לוודא" (לא "להתאמת")
- "pentru" → "כדי" / "על מנת" (לא "בשביל ל")`,
    'hebrew-romanian': `- "לקחת בחשבון" → "a lua în considerare" (לא "a lua în calcul")
- "לוודא" → "a se asigura" / "a verifica" (לא "a face sigur")
- "כדי" → "pentru" / "ca să" (לא "pentru la")`,
    'italian-hebrew': `- "prendere in considerazione" → "לקחת בחשבון" (לא "לקבל למחשבה")
- "assicurarsi" → "לוודא" (לא "להתאמת")
- "per" → "כדי" / "על מנת" (לא "בשביל ל")`,
    'hebrew-italian': `- "לקחת בחשבון" → "prendere in considerazione" (לא "prendere in conto")
- "לוודא" → "assicurarsi" / "verificare" (לא "fare sicuro")
- "כדי" → "per" / "al fine di" (לא "per a")`,
    'english-russian': `- "take into account" → "принять во внимание" (לא "взять в учет")
- "make sure" → "убедиться" (לא "сделать уверенным")
- "in order to" → "для того чтобы" / "чтобы" (לא "в порядке к")`,
    'russian-english': `- "принять во внимание" → "take into account" (לא "accept in view")
- "убедиться" → "make sure" / "ensure" (לא "to make certain")
- "для того чтобы" → "in order to" / "to" (לא "for that to")`,
    'english-french': `- "take into account" → "prendre en compte" (לא "prendre dans compte")
- "make sure" → "s'assurer" / "vérifier" (לא "faire sûr")
- "in order to" → "pour" / "afin de" (לא "pour à")`,
    'french-english': `- "prendre en compte" → "take into account" (לא "take in account")
- "s'assurer" → "make sure" / "ensure" (לא "assure oneself")
- "afin de" → "in order to" / "to" (לא "for to")`,
    'english-romanian': `- "take into account" → "a lua în considerare" (לא "a lua în cont")
- "make sure" → "a se asigura" (לא "a face sigur")
- "in order to" → "pentru" / "ca să" (לא "în ordine la")`,
    'romanian-english': `- "a lua în considerare" → "take into account" (לא "take in consideration")
- "a se asigura" → "make sure" / "ensure" (לא "assure oneself")
- "pentru" → "in order to" / "to" (לא "for to")`,
    'english-italian': `- "take into account" → "prendere in considerazione" (לא "prendere in conto")
- "make sure" → "assicurarsi" / "verificare" (לא "fare sicuro")
- "in order to" → "per" / "al fine di" (לא "in ordine a")`,
    'italian-english': `- "prendere in considerazione" → "take into account" (לא "take in consideration")
- "assicurarsi" → "make sure" / "ensure" (לא "assure oneself")
- "al fine di" → "in order to" / "to" (לא "at the end of")`,
  };

  // Grammar notes per target language
  const GRAMMAR_NOTES: Record<string, string> = {
    hebrew: `- כתוב עברית טבעית, לא תרגום מילולי
- שימוש נכון בפיסוק עברי
- התאם מבנה משפט לעברית (לא העתקה ממבנה השפה המקורית)`,
    english: `- שימוש נכון ב-articles (a, an, the)
- מבנה זמנים נכון (present, past, future)
- שימוש נכון ב-prepositions`,
    russian: `- שימוש נכון ב-падежи (cases)
- מבנה זמנים נכון (настоящее, прошедшее, будущее)
- שימוש נכון ב-предлоги (prepositions)`,
    french: `- שימוש נכון ב-articles (le, la, les, un, une, des)
- מבנה זמנים נכון (présent, passé, futur)
- שימוש נכון ב-prépositions`,
    romanian: `- שימוש נכון ב-articles (un, o, niște)
- מבנה זמנים נכון (prezent, trecut, viitor)
- שימוש נכון ב-prepoziții`,
    italian: `- שימוש נכון ב-articles (il, la, gli, le, un, una)
- מבנה זמנים נכון (presente, passato, futuro)
- שימוש נכון ב-preposizioni`,
  };

  const fromName = LANGUAGE_NAMES[fromLang] || fromLang;
  const toName = LANGUAGE_NAMES[toLang] || toLang;

  // Build idioms section
  const idiomsSection = preferredTranslations && preferredTranslations.length > 0 ? `
**מילון תרגומים מועדפים (חשוב מאוד!):**
${preferredTranslations.map(item => {
  if (item.english) {
    // Old format: idioms with english + hebrew
    if (fromLang === 'english' || (fromLang !== 'hebrew' && toLang === 'hebrew')) {
      return `- "${item.english}" → "${item.hebrew}"`;
    } else if (fromLang === 'hebrew') {
      return `- "${item.hebrew}" → "${item.english}"`;
    } else {
      return `- "${item.english}" → "${item.hebrew}"`;
    }
  } else if (item.target) {
    // New format: savedLanguageEntries with hebrew + target
    if (fromLang === 'hebrew') {
      return `- "${item.hebrew}" → "${item.target}"`;
    } else if (toLang === 'hebrew') {
      return `- "${item.target}" → "${item.hebrew}"`;
    } else {
      return `- "${item.hebrew}" → "${item.target}"`;
    }
  }
  return '';
}).filter(line => line).join('\n')}

**חוק ברזל:** כאשר אתה נתקל בביטוי או מילה מהמילון לעיל, חובה להשתמש בתרגום מהמילון. אל תמציא תרגום חדש!
` : '';

  // Build preferences section
  const preferencesSection = userPreferences ? `
**העדפות המשתמש (חשוב מאוד!):**

${userPreferences.forbiddenWords && userPreferences.forbiddenWords.length > 0 ? `
**מילים להימנעות:**
${userPreferences.forbiddenWords.map(word => `- "${word}"`).join('\n')}
אל תשתמש במילים האלה!` : ''}

${userPreferences.preferredWords && Object.keys(userPreferences.preferredWords).length > 0 ? `
**תחליפים מועדפים:**
${Object.entries(userPreferences.preferredWords).map(([from, to]) => `- "${from}" → "${to}"`).join('\n')}
השתמש בתחליפים האלה במקום המילים המקוריות!` : ''}

${userPreferences.stylePreferences ? `
**העדפות סגנון:**
${userPreferences.stylePreferences.formality ? `- רמת פורמליות: ${userPreferences.stylePreferences.formality === 'formal' ? 'רשמית מאוד' : userPreferences.stylePreferences.formality === 'casual' ? 'לא פורמלית' : 'מקצועית'}` : ''}
${userPreferences.stylePreferences.tone ? `- טון: ${userPreferences.stylePreferences.tone}` : ''}` : ''}
` : '';

  // Build context section
  const contextSection = context ? `
**הקשר:**
${context}

השתמש בהקשר הזה כדי להתאים את התרגום - שפה עסקית, טכנית, ספרותית, וכו'.` : '';

  // Get examples for this pair, with fallback
  const pairKey = `${fromLang}-${toLang}`;
  const examples = TRANSLATION_EXAMPLES[pairKey] || '';

  // Get grammar notes for target language
  const grammarNotes = GRAMMAR_NOTES[toLang] || '';

  // Anti-pattern instruction only when translating TO Hebrew
  const hebrewAntiPatterns = toLang === 'hebrew' ? `\n${getAntiPatternInstruction(false)}` : '';

  return `אתה מתרגם מקצועי ומומחה בתרגום מ${fromName} ל${toName} תקנית וזורמת.
תפקידך לתרגם טקסט מ${fromName} ל${toName} בצורה טבעית, מדויקת ומקצועית.

**הטקסט לתרגום:**
${text}

${idiomsSection}
${preferencesSection}
${contextSection}

**עקרונות תרגום מ${fromName} ל${toName}:**

**תרגום טבעי, לא מילולי:**
${examples || `- תרגם את המשמעות, לא מילה-במילה
- חפש ביטויים מקבילים בשפת היעד
- התאם את מבנה המשפט לשפת היעד`}

**שפה טבעית:**
- הימנע מתרגום מילה-במילה
- חפש את המשמעות מאחורי המילים
- התאם את השפה להקשר (עסקי, טכני, ספרותי)

**דקדוק ${toName}:**
${grammarNotes}
${hebrewAntiPatterns}

**פורמט הפלט - JSON עם אפשרויות חלופיות:**
חזור JSON עם הפורמט הבא (חשוב מאוד - רק JSON, ללא טקסט נוסף):

{
  "main": "התרגום הראשי והמומלץ",
  "alternatives": [
    {
      "text": "אפשרות חלופית 1",
      "explanation": "הסבר קצר למה אפשרות זו שונה",
      "context": "מתי להשתמש (למשל: רשמי, לא פורמלי, טכני)"
    },
    {
      "text": "אפשרות חלופית 2",
      "explanation": "הסבר קצר",
      "context": "מתי להשתמש"
    },
    {
      "text": "אפשרות חלופית 3",
      "explanation": "הסבר קצר",
      "context": "מתי להשתמש"
    }
  ],
  "wordAlternatives": {
    "מילה_חשובה_בטקסט": [
      "תרגום מומלץ",
      "תרגום חלופי 1",
      "תרגום חלופי 2"
    ]
  }
}

כתוב תרגום מקצועי, טבעי ומדויק עם אפשרויות חלופיות!`;
};
