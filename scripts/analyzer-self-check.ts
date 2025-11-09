import { analyzeHebrewText } from '../lib/ai/hebrew-analyzer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const aiStyleSample = `
אני רוצה להודות לך על העזרה שלך בנושא זה שאנחנו מדברים עליו היום. זה חשוב מאוד מאוד שנבין את הנושא הזה לפני שנמשיך הלאה עם התהליך.
אני אהבה לעבוד יחד כי זה יכול להיות שזה יעבוד ממש טוב עבורנו.
בנוסף לכך, אני רוצה להוסיף שהמטרה שלי היא לעשות את הדבר הזה בצורה הכי טובה שאפשר להשיג.
`;

const naturalHebrewSample = `
תודה שעזרת לי היום. חשוב שנבין את הנושא לפני שאנחנו ממשיכים בתהליך.
אני אוהבת לעבוד ביחד כי זה יכול להצליח לנו מצוין.
בנוסף, אני רוצה לעשות את זה בצורה הכי טובה שאפשר.
`;

const aiResult = analyzeHebrewText(aiStyleSample);
const naturalResult = analyzeHebrewText(naturalHebrewSample);

console.log('🧪 בדיקת Hebrew Analyzer');
console.log(`• טקסט AI: נמצאו ${aiResult.issues.length} בעיות, ציון ${aiResult.score}`);
console.log(`• טקסט טבעי: נמצאו ${naturalResult.issues.length} בעיות, ציון ${naturalResult.score}`);

assert(
  aiResult.issues.length >= 3,
  'הטקסט האנגלי-מתורגם לא זוהה כבעייתי מספיק (פחות מ-3 בעיות)'
);

assert(
  naturalResult.score > aiResult.score,
  'הציון של טקסט טבעי אינו גבוה יותר מציון של טקסט AI'
);

console.log('✅ Hebrew Analyzer עבר את בדיקות התקינות הבסיסיות');

