import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: 'json_object' };
}

export async function generateText({
  prompt,
  systemPrompt = 'אתה עוזר כתיבה מקצועי בעברית. תפקידך לעזור למשתמשים לכתוב טקסטים בעברית תקנית, ברורה ומקצועית.',
  maxTokens = 4096,
  temperature = 0.7,
  responseFormat,
}: GenerateTextOptions) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    if (content.type === 'json') {
      return JSON.stringify(content.json);
    }

    throw new Error('Unexpected response type');
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
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