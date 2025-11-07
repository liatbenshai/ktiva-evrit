import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/claude';
import { applyLearnedPatterns } from '@/lib/ai/hebrew-analyzer';
import {
  articlePrompt,
  emailPrompt,
  postPrompt,
  storyPrompt,
  summaryPrompt,
  protocolPrompt,
  scriptPrompt,
  aiPromptPrompt,
  worksheetPrompt,
} from '@/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    let prompt = '';
    let systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. תפקידך לעזור למשתמשים לכתוב טקסטים בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית.

**עקרונות חשובים:**
- כתוב בעברית טבעית וזורמת
- הימנע מתרגומים ישירים מאנגלית
- השתמש בביטויים עבריים מקוריים
- כתוב בצורה ברורה ומקצועית`;

    switch (type) {
      case 'article':
        prompt = articlePrompt(
          data.title, 
          data.keywords, 
          data.wordCount,
          data.additionalInstructions
        );
        systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. אתה כותב תוכן מומחה SEO עם ידע מעמיק בכללי Yoast ואופטימיזציה למנועי חיפוש.

**עקרונות כתיבה:**
- כתוב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית
- הימנע מביטויים כמו "בסוף היום", "לעבור לשלב הבא", "במקום של"
- השתמש בביטויים עבריים מקוריים וטבעיים
- כתוב בצורה מקצועית אך קריאה`;
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
        prompt = summaryPrompt(data.text, data.length, data.focusPoints);
        break;

      case 'protocol':
        prompt = protocolPrompt(data.transcript, data.includeDecisions);
        systemPrompt = 'אתה מומחה בכתיבת פרוטוקולים. חוק ברזל: כתוב את דברי הדוברים בגוף ראשון בלבד - "אני", "אנחנו", "לדעתי". לעולם אל תכתוב "הוא אמר", "היא הציעה", "הם דנו". כתוב כאילו הדובר עצמו כותב את הדברים שלו.';
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
        systemPrompt = `אתה תסריטאי מקצועי בעברית המשמש כעוזר כתיבה אישי.

**עקרונות חובה:**
- כתוב בעברית מדוברת, טבעית וזורמת שמתאימה לטלפרומפטר.
- שמור על קול נשי בגוף ראשון, עם פנייה ישירה לסטודנטים ("אתם", "בואו").
- שלב את הידע, ההנחיות והיעדים שהמשתמש סיפק בתוך הטקסט המדובר.
- כל הערת במה או פעולה ויזואלית חייבת להופיע בסוגריים מרובעים [כך] ואינה נקראת בקול.
- הימנע מביטויי תרגום מילולי ומבנים מאולצים; תעדף עברית טבעית.
- היה פתוח ללמוד מהמשוב והתאם את הסגנון בהתאם לידע שניתן.`;
        break;
      }

      case 'worksheet':
        prompt = worksheetPrompt(
          data.instruction,
          data.story,
          data.grade,
          data.subject
        );
        systemPrompt = 'אתה מורה מקצועי ומומחה בהכנת דפי עבודה וחומרי לימוד. אתה מכין דפי עבודה מקצועיים, מוכנים להדפסה, ומותאמים לרמת הכיתה. אתה כותב בעברית תקנית וקריאה - לא תרגום מילולי מאנגלית.';
        break;

      case 'aiPrompt':
        prompt = aiPromptPrompt(
          data.goal,
          data.context,
          data.outputFormat,
          data.additionalRequirements
        );
        systemPrompt = 'אתה מומחה בכתיבת Prompts אפקטיביים למודלי שפה גדולים (LLMs). אתה יודע איך לכתוב prompts ברורים, מדויקים ואפקטיביים. אתה כותב בעברית תקנית כשצריך, ובאנגלית כשה-prompt מיועד למודלים באנגלית. אתה פתוח ללמוד ולשפר מעריכות המשתמש.';
        break;

      case 'improve':
        prompt = `${data.instructions || 'שפר את הטקסט הבא לעברית תקנית וזורמת'}${data.keywords ? `\n\nמילות מפתח לשילוב: ${data.keywords}` : ''}:\n\n${data.text}`;
        systemPrompt = `אתה עוזר AI מקצועי לכתיבה בעברית. אתה כותב תוכן מומחה SEO עם ידע מעמיק בכללי Yoast ואופטימיזציה למנועי חיפוש.

**עקרונות שיפור:**
- כתוב בעברית תקנית, טבעית וזורמת - לא תרגום מילולי מאנגלית
- הימנע מביטויים כמו "לעבור לשלב הבא" (השתמש ב"להתקדם"), "במקום של" (השתמש ב"במקום")
- שמור על המסר המקורי אך שפר את הניסוח, הבהרה והמבנה
- הפוך את הטקסט לזורם וקריא יותר`;
        break;

      default:
        return NextResponse.json(
          { error: 'סוג לא נתמך' },
          { status: 400 }
        );
    }

    let result = await generateText({
      prompt,
      systemPrompt,
      maxTokens: type === 'article' ? 8192 : (data.maxTokens || 4096), // Double for articles
      temperature: data.temperature || 0.7,
    });

    // 🔥 החלת דפוסים שנלמדו על הטקסט שנוצר
    const userId = data.userId || 'default-user';
    let appliedPatterns: Array<{ from: string; to: string }> = [];
    
    try {
      const { prisma } = await import('@/lib/prisma');
      const learnedPatterns = await prisma.translationPattern.findMany({
        where: { 
          userId,
          confidence: { gte: 0.7 }, // רק דפוסים בטוחים
        },
        orderBy: { confidence: 'desc' },
        take: 50,
      });

      if (learnedPatterns.length > 0) {
        const patterns = learnedPatterns.map(p => ({
          from: p.badPattern,
          to: p.goodPattern,
          confidence: p.confidence,
        }));

        const patternResult = applyLearnedPatterns(result, patterns);
        result = patternResult.correctedText;
        appliedPatterns = patternResult.appliedPatterns;
        
        console.log(`✅ Applied ${appliedPatterns.length} learned patterns to ${type}:`, 
          appliedPatterns.map(p => `"${p.from}" → "${p.to}"`).join(', '));
      }
    } catch (dbError) {
      console.error('Error applying learned patterns:', dbError);
      // המשך בלי דפוסים במקום להיכשל
    }

    return NextResponse.json({ 
      result,
      appliedPatterns: appliedPatterns.length > 0 ? appliedPatterns : undefined,
    });
  } catch (error) {
    console.error('Error in Claude API:', error);
    
    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'שגיאה בהגדרת API key' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'חרגת ממגבלת השימוש. נסה שוב מאוחר יותר' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'שגיאה ביצירת הטקסט' },
      { status: 500 }
    );
  }
}