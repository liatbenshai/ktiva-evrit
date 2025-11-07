import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import {
  articlePrompt,
  emailPrompt,
  postPrompt,
  storyPrompt,
  summaryPrompt,
  protocolPrompt,
  scriptPrompt,
  aiPromptPrompt,
} from '@/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    let prompt = '';
    let systemPrompt = 'אתה עוזר כתיבה מקצועי בעברית. תפקידך לעזור למשתמשים לכתוב טקסטים בעברית תקנית, ברורה ומקצועית.';

      switch (type) {
        case 'article':
          prompt = articlePrompt(
            data.title,
            data.keywords,
            data.wordCount,
            data.additionalInstructions
          );
          systemPrompt =
            'אתה כותב תוכן מומחה SEO עם ידע מעמיק בכללי Yoast ואופטימיזציה למנועי חיפוש. אתה כותב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית.';
          break;

        case 'email':
          prompt = emailPrompt(data.context, data.recipient, data.tone);
          break;

        case 'post':
          prompt = postPrompt(data.topic, data.platform, data.length);
          break;

        case 'story':
          prompt = storyPrompt(
            data.genre,
            data.characters,
            data.setting,
            data.plot,
            data.length,
            data.tone,
            data.additionalInstructions
          );
          break;

        case 'summary':
          if (data.isUrl) {
            const urlToFetch = data.text;
            prompt = `אנא השתמש ב-web_fetch tool כדי למשוך את התוכן מהכתובת הבאה, ולאחר מכן סכם אותו בעברית תקנית.

כתובת: ${urlToFetch}

${data.focusPoints ? `נקודות מיקוד: ${data.focusPoints}` : ''}
אורך הסיכום: ${data.length}

אנא:
1. משוך את התוכן מה-URL באמצעות web_fetch
2. סכם את התוכן בעברית תקנית
3. התמקד בנקודות המרכזיות`;
          } else {
            prompt = summaryPrompt(data.text, data.length, data.focusPoints);
          }
          break;

        case 'protocol':
          prompt = protocolPrompt(data.transcript, data.includeDecisions);
          systemPrompt =
            'אתה מומחה בכתיבת פרוטוקולים. חוק ברזל: כתוב את דברי הדוברים בגוף ראשון בלבד - "אני", "אנחנו", "לדעתי". לעולם אל תכתוב "הוא אמר", "היא הציעה", "הם דנו". כתוב כאילו הדובר עצמו כותב את הדברים שלו.';
          break;

        case 'script': {
          prompt = scriptPrompt({
            topic: data.topic,
            duration: data.duration,
            audience: data.audience,
            style: data.style,
            additionalInstructions: data.additionalInstructions,
            moduleTitle: data.moduleTitle,
            learningObjectives: data.learningObjectives,
            workflowSteps: data.workflowSteps,
            keyTerminology: data.keyTerminology,
            referenceExamples: data.referenceExamples,
            practiceIdeas: data.practiceIdeas,
            studentPainPoints: data.studentPainPoints,
            callToAction: data.callToAction,
            knowledgePack: data.knowledgePack,
            teleprompterNotesLevel: data.teleprompterNotesLevel,
            voicePersona: data.voicePersona,
            successCriteria: data.successCriteria,
            referenceScript: data.referenceScript,
            examplesToCover: data.examplesToCover,
          });
          systemPrompt =
            'אתה תסריטאי מקצועי בעברית. כתוב תסריט לטלפרומפטר בשפה מדוברת, שלב את היעדים וההנחיות שהמשתמש מספק, שמור על קול נשי בגוף ראשון ופנייה ישירה, והצג הערות במה בסוגריים מרובעים בלבד.';
          break;
        }

        case 'aiPrompt':
          prompt = aiPromptPrompt(
            data.goal,
            data.context,
            data.outputFormat,
            data.additionalRequirements
          );
          systemPrompt =
            'אתה מומחה בכתיבת Prompts אפקטיביים למודלי שפה גדולים (LLMs). אתה יודע איך לכתוב prompts ברורים, מדויקים ואפקטיביים. אתה כותב בעברית תקנית כשצריך, ובאנגלית כשה-prompt מיועד למודלים באנגלית. אתה פתוח ללמוד ולשפר מעריכות המשתמש.';
          break;

        case 'improve':
          prompt = `${data.instructions || 'שפר את הטקסט הבא לעברית תקנית וזורמת'}${data.keywords ? `\n\nמילות מפתח לשילוב: ${data.keywords}` : ''}:\n\n${data.text}`;
          systemPrompt =
            'אתה כותב תוכן מומחה SEO עם ידע מעמיק בכללי Yoast ואופטימיזציה למנועי חיפוש. אתה כותב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית. שמור על המסר המקורי אך שפר את הניסוח, הבהרה והמבנה.';
          break;

        default:
          return NextResponse.json(
            { error: 'סוג לא נתמך' },
            { status: 400 }
          );
      }

    const result = await generateText({
      prompt,
      systemPrompt,
      maxTokens: type === 'article' ? 8192 : (data.maxTokens || 4096), // Double for articles
      temperature: data.temperature || 0.7,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in Claude API:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת הטקסט' },
      { status: 500 }
    );
  }
}