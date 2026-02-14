import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('WARNING: ANTHROPIC_API_KEY is not set. AI features will not work.');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// Hebrew system prompt base - used across all AI features
export const HEBREW_SYSTEM_PROMPT_BASE = `**כלל ברזל:** התאם את רמת השפה להקשר שהמשתמש מבקש.

**רמות שפה בעברית:**

**🔷 שפה משפטית גבוהה** (כתבי בית דין, חוזים, מסמכים משפטיים, "כתוב כמו עורך דין"):
שפה משפטית פורמלית ומקצועית ברמה הגבוהה ביותר.
ביטויים אופייניים: "לעניין זה יפים דבריו של בית המשפט", "למצער", "לדידי", "לטעמי", "נוכח האמור לעיל", "בכפוף לאמור", "מבלי לגרוע מהאמור", "בשים לב ל", "יוער כי", "יובהר כי", "מהווה", "בהתאם ל", "על מנת", "הואיל ו", "לפיכך", "אשר על כן".
מבנה: משפטים ארוכים ומורכבים, פסקאות מובנות, התייחסות לסעיפים ופסיקה.

**🔷 שפה רשמית** (מכתבים רשמיים, פניות לרשויות, מסמכים עסקיים):
שפה מנומסת ומכובדת אך לא משפטית.
ביטויים אופייניים: "הנדון", "לכבוד", "בהמשך לפנייתך", "אבקש להבהיר", "אודה לך על", "בברכה", "בכבוד רב".
מבנה: משפטים ברורים ומסודרים, פורמט מכתב רשמי.

**🔷 שפה יומיומית** (הודעות, צ'אט, מיילים לחברים, תוכן קליל):
שפה פשוטה, טבעית וזורמת כמו שישראלים מדברים.
ביטויים אופייניים: "כדי" (לא "על מנת"), "לפי" (לא "בהתאם ל"), "הוא/זה" (לא "מהווה"), "אפשר" (לא "ניתן"), "רוצה" (לא "מבקש").
מבנה: משפטים קצרים וישירים, בלי סיבוכים.

**🔷 שפה מקצועית** (רפואה, אקדמיה, טכנולוגיה, מדע):
טרמינולוגיה מקצועית של התחום הספציפי, ברמת פורמליות בינונית-גבוהה.

**כללים:**
1. זהה את ההקשר מהבקשה: "כתוב כמו עורך דין" = שפה משפטית גבוהה
2. ברירת מחדל (אם לא צוין): שפה יומיומית
3. הימנע מאנגליציזמים כשיש חלופה עברית טובה
4. אל תמציא עובדות`;

export const DEFAULT_SYSTEM_PROMPT = `אתה עוזר כתיבה בעברית. כתוב עברית טבעית כמו ישראלי יליד.

${HEBREW_SYSTEM_PROMPT_BASE}`;

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: 'json_object' };
}

export async function generateText({
  prompt,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  maxTokens = 4096,
  temperature = 0.7,
  responseFormat,
}: GenerateTextOptions) {
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        ...(responseFormat ? { response_format: responseFormat } : {}),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // בדיקה שהתשובה לא ריקה
      if (!message.content || message.content.length === 0) {
        throw new Error('Empty response from Claude API');
      }

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      if ('json' in content) {
        return JSON.stringify((content as { json: unknown }).json);
      }

      throw new Error('Unexpected response type');
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.statusCode === 429;
      const isOverloaded = error?.status === 529 || error?.statusCode === 529;
      const isRetryable = isRateLimit || isOverloaded;

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt + 1) * 1000; // exponential backoff: 2s, 4s
        console.warn(`Claude API rate limited/overloaded (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error('Error generating text:', error);
      throw error;
    }
  }

  throw new Error('Max retries exceeded for Claude API');
}

export async function improveText(text: string, instructions?: string) {
  const prompt = instructions
    ? `שפר את הטקסט הבא לפי ההנחיות: ${instructions}\n\nטקסט:\n${text}`
    : `שפר את הטקסט הבא לעברית תקנית, ברורה ומקצועית יותר:\n\n${text}`;

  return generateText({ prompt });
}

export async function summarizeText(text: string, maxLength?: string) {
  const prompt = maxLength
    ? `סכם את הטקסט הבא ב-${maxLength}:\n\n${text}`
    : `סכם את הטקסט הבא בצורה תמציתית:\n\n${text}`;

  return generateText({ prompt });
}