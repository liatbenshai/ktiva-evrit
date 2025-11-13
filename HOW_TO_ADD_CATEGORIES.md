# איך להוסיף קטגוריות חדשות לשיעורים

## הוספת קטגוריה חדשה

1. **פתחי את הקובץ:** `app/api/languages/lessons/create-multiple-demo/route.ts`

2. **מצי את ה-LESSON_TEMPLATES** - זה אובייקט גדול שמכיל את כל השיעורים, מסודר לפי רמות:
   - `BEGINNER` - מתחיל
   - `INTERMEDIATE` - בינוני  
   - `ADVANCED` - מתקדם

3. **הוסיפי קטגוריה חדשה** - בחרי רמה (למשל `BEGINNER`) והוסיפי נושא חדש:

```typescript
BEGINNER: {
  // ... נושאים קיימים ...
  
  נושא_חדש: {
    title: 'כותרת השיעור',
    description: 'תיאור קצר של השיעור',
    vocabulary: [
      { 
        hebrew: 'מילה בעברית', 
        en: 'English', 
        ro: 'Romanian', 
        it: 'Italian', 
        fr: 'French', 
        ru: 'Russian', 
        pronunciation: { 
          en: 'pronunciation', 
          ro: 'pronunciation', 
          it: 'pronunciation', 
          fr: 'pronunciation', 
          ru: 'pronunciation' 
        } 
      },
      // ... עוד מילים ...
    ],
  },
}
```

## הוספת משפטים שלמים

כדי להוסיף משפט שלם (לא רק מילה), הוסיפי את השדה `isSentence: true`:

```typescript
{ 
  hebrew: 'מה שלומך, אמא?', 
  en: 'How are you, Mom?', 
  ro: 'Ce mai faci, mamă?', 
  // ... תרגומים נוספים ...
  pronunciation: { /* ... */ },
  isSentence: true  // ← זה מסמן שזה משפט שלם
}
```

## דוגמה מלאה

```typescript
BEGINNER: {
  בישול_ביתי: {
    title: 'בישול ביתי',
    description: 'מילים שימושיות לבישול בבית',
    vocabulary: [
      { 
        hebrew: 'מטבח', 
        en: 'Kitchen', 
        ro: 'Bucătărie', 
        it: 'Cucina', 
        fr: 'Cuisine', 
        ru: 'Кухня', 
        pronunciation: { 
          en: 'KICH-en', 
          ro: 'boo-kuh-tuh-REE-eh', 
          it: 'koo-CHEE-nah', 
          fr: 'kwee-ZEEN', 
          ru: 'KOOKH-nyah' 
        } 
      },
      { 
        hebrew: 'אני מבשלת ארוחת ערב', 
        en: 'I am cooking dinner', 
        ro: 'Gătesc cina', 
        it: 'Sto cucinando la cena', 
        fr: 'Je prépare le dîner', 
        ru: 'Я готовлю ужин', 
        pronunciation: { 
          en: 'ay am KOOK-ing DIN-ner', 
          ro: 'guh-TESK CHEE-nah', 
          it: 'stoh koo-chee-NAHN-doh lah CHEH-nah', 
          fr: 'zhuh pray-PAHR luh dee-NAY', 
          ru: 'yah gah-TOV-lyoo OO-zheen' 
        },
        isSentence: true  // ← משפט שלם
      },
    ],
  },
}
```

## עדכון השיעורים

לאחר הוספת קטגוריה חדשה:

1. לכי לדף השיעורים
2. לחצי על "עדכני את כל השיעורים הקיימים" (כפתור צהוב למטה)
3. השיעורים החדשים יופיעו בקטגוריה החדשה

## טיפים

- **שם הקטגוריה** - השתמשי בעברית (למשל: `בישול_ביתי`, `ספורט`, `מוזיקה`)
- **אייקון** - אם תרצי להוסיף אייקון לקטגוריה, עדכני את `TOPIC_ICONS` ב-`components/languages/StructuredLessons.tsx`
- **תרגומים חלופיים** - אפשר להוסיף תרגומים חלופיים עם שדה `alternatives`:
  ```typescript
  alternatives: { 
    ru: ['תרגום1', 'תרגום2'],  // לרוסית
    en: ['translation1'],        // לאנגלית
  }
  ```

