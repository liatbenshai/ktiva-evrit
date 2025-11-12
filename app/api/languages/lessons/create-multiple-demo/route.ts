import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Lesson templates for different topics and levels
const LESSON_TEMPLATES: Record<string, Record<string, any>> = {
  BEGINNER: {
    היכרות: {
      title: 'היכרות בסיסית',
      description: 'ללמוד ברכות והצגה עצמית',
      vocabulary: [
        { hebrew: 'שלום', en: 'Hello', ro: 'Salut', it: 'Ciao', pronunciation: { en: 'heh-LOH', ro: 'sa-LOOT', it: 'CHAO' } },
        { hebrew: 'מה שלומך?', en: 'How are you?', ro: 'Ce mai faci?', it: 'Come stai?', pronunciation: { en: 'how ar YOO', ro: 'cheh mai FAH-chee', it: 'KOH-meh STAH-ee' } },
        { hebrew: 'תודה', en: 'Thank you', ro: 'Mulțumesc', it: 'Grazie', pronunciation: { en: 'THANK yoo', ro: 'mool-tsoo-MESK', it: 'GRAH-tsee-eh' } },
        { hebrew: 'בבקשה', en: 'Please', ro: 'Te rog', it: 'Per favore', pronunciation: { en: 'pleez', ro: 'teh ROHG', it: 'pehr fah-VOH-reh' } },
        { hebrew: 'סליחה', en: 'Sorry', ro: 'Scuze', it: 'Scusa', pronunciation: { en: 'SOR-ee', ro: 'SKOO-zeh', it: 'SKOO-zah' } },
      ],
    },
    אוכל: {
      title: 'אוכל ומסעדות',
      description: 'מילים שימושיות להזמנה במסעדה',
      vocabulary: [
        { hebrew: 'תפריט', en: 'Menu', ro: 'Meniu', it: 'Menu', pronunciation: { en: 'MEN-yoo', ro: 'meh-NEE-oo', it: 'MEH-noo' } },
        { hebrew: 'מים', en: 'Water', ro: 'Apă', it: 'Acqua', pronunciation: { en: 'WAH-ter', ro: 'AH-puh', it: 'AHK-kwah' } },
        { hebrew: 'לחם', en: 'Bread', ro: 'Pâine', it: 'Pane', pronunciation: { en: 'bred', ro: 'puh-EE-neh', it: 'PAH-neh' } },
        { hebrew: 'בקשה', en: 'Order', ro: 'Comandă', it: 'Ordine', pronunciation: { en: 'OR-der', ro: 'koh-MAHN-duh', it: 'OR-dee-neh' } },
        { hebrew: 'חשבון', en: 'Bill', ro: 'Notă', it: 'Conto', pronunciation: { en: 'bil', ro: 'NOH-tuh', it: 'KOHN-toh' } },
      ],
    },
    עבודה: {
      title: 'עבודה ועסקים',
      description: 'מילים שימושיות בסביבת עבודה',
      vocabulary: [
        { hebrew: 'פגישה', en: 'Meeting', ro: 'Întâlnire', it: 'Riunione', pronunciation: { en: 'MEE-ting', ro: 'uhn-tuh-lee-NEH-reh', it: 'ree-oo-NYOH-neh' } },
        { hebrew: 'פרויקט', en: 'Project', ro: 'Proiect', it: 'Progetto', pronunciation: { en: 'PROJ-ekt', ro: 'proh-YEKT', it: 'proh-JEHT-toh' } },
        { hebrew: 'דדליין', en: 'Deadline', ro: 'Termen limită', it: 'Scadenza', pronunciation: { en: 'DED-line', ro: 'TEHR-mehn LEE-mee-tuh', it: 'skah-DEHN-zah' } },
        { hebrew: 'עבודה', en: 'Work', ro: 'Muncă', it: 'Lavoro', pronunciation: { en: 'wurk', ro: 'MOON-kuh', it: 'lah-VOH-roh' } },
        { hebrew: 'לקוח', en: 'Client', ro: 'Client', it: 'Cliente', pronunciation: { en: 'KLY-ent', ro: 'klee-ENT', it: 'KLEE-ehn-teh' } },
      ],
    },
  },
  INTERMEDIATE: {
    נסיעות: {
      title: 'נסיעות ותיירות',
      description: 'מילים שימושיות לטיולים',
      vocabulary: [
        { hebrew: 'שדה תעופה', en: 'Airport', ro: 'Aeroport', it: 'Aeroporto', pronunciation: { en: 'AIR-port', ro: 'ah-eh-roh-PORT', it: 'ah-eh-roh-POR-toh' } },
        { hebrew: 'מלון', en: 'Hotel', ro: 'Hotel', it: 'Hotel', pronunciation: { en: 'hoh-TEL', ro: 'hoh-TEL', it: 'oh-TEL' } },
        { hebrew: 'כרטיס', en: 'Ticket', ro: 'Bilet', it: 'Biglietto', pronunciation: { en: 'TIK-et', ro: 'bee-LET', it: 'bee-LYET-toh' } },
        { hebrew: 'תיק', en: 'Suitcase', ro: 'Valiză', it: 'Valigia', pronunciation: { en: 'SOOT-kays', ro: 'vah-LEE-zuh', it: 'vah-LEE-jah' } },
        { hebrew: 'מפה', en: 'Map', ro: 'Hartă', it: 'Mappa', pronunciation: { en: 'map', ro: 'HAHR-tuh', it: 'MAHP-pah' } },
      ],
    },
    בית: {
      title: 'בית ומשפחה',
      description: 'מילים הקשורות לחיי בית',
      vocabulary: [
        { hebrew: 'סלון', en: 'Living room', ro: 'Sufragerie', it: 'Soggiorno', pronunciation: { en: 'LIV-ing room', ro: 'soo-frah-jeh-REE-eh', it: 'sohj-JOR-noh' } },
        { hebrew: 'מטבח', en: 'Kitchen', ro: 'Bucătărie', it: 'Cucina', pronunciation: { en: 'KICH-en', ro: 'boo-kuh-tuh-REE-eh', it: 'koo-CHEE-nah' } },
        { hebrew: 'שולחן', en: 'Table', ro: 'Masă', it: 'Tavolo', pronunciation: { en: 'TAY-bul', ro: 'MAH-suh', it: 'TAH-voh-loh' } },
        { hebrew: 'כיסא', en: 'Chair', ro: 'Scaun', it: 'Sedia', pronunciation: { en: 'chair', ro: 'skah-OON', it: 'SEH-dee-ah' } },
        { hebrew: 'חלון', en: 'Window', ro: 'Fereastră', it: 'Finestra', pronunciation: { en: 'WIN-doh', ro: 'feh-reh-AHS-truh', it: 'fee-NEHS-trah' } },
      ],
    },
  },
  ADVANCED: {
    משפחה: {
      title: 'משפחה ויחסים',
      description: 'דיבור על משפחה ויחסים',
      vocabulary: [
        { hebrew: 'משפחה', en: 'Family', ro: 'Familie', it: 'Famiglia', pronunciation: { en: 'FAM-uh-lee', ro: 'fah-MEE-lee-eh', it: 'fah-MEE-lyah' } },
        { hebrew: 'הורים', en: 'Parents', ro: 'Părinți', it: 'Genitori', pronunciation: { en: 'PAIR-ents', ro: 'puh-REEN-tsee', it: 'jeh-nee-TOH-ree' } },
        { hebrew: 'אח', en: 'Brother', ro: 'Frate', it: 'Fratello', pronunciation: { en: 'BRUTH-er', ro: 'FRAH-teh', it: 'frah-TEHL-loh' } },
        { hebrew: 'אחות', en: 'Sister', ro: 'Soră', it: 'Sorella', pronunciation: { en: 'SIS-ter', ro: 'SOH-ruh', it: 'soh-REHL-lah' } },
        { hebrew: 'סבים', en: 'Grandparents', ro: 'Bunici', it: 'Nonni', pronunciation: { en: 'GRAND-pair-ents', ro: 'BOO-nee-chee', it: 'NOHN-nee' } },
      ],
    },
  },
};

function getTranslation(term: any, lang: SupportedLanguageKey): string {
  return term[lang] || term.en;
}

function getPronunciation(term: any, lang: SupportedLanguageKey): string {
  return term.pronunciation?.[lang] || term.pronunciation?.en || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetLanguage = 'english', createAll = false } = body;

    const createdLessons: any[] = [];
    const errors: string[] = [];

    // If createAll, create lessons for all languages, levels and topics
    const languagesToCreate = createAll 
      ? (['english', 'romanian', 'italian'] as SupportedLanguageKey[])
      : ([targetLanguage] as SupportedLanguageKey[]);
    
    const levelsToCreate = createAll 
      ? (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as LanguageLevel[])
      : (['BEGINNER'] as LanguageLevel[]);

    console.log('Creating lessons for languages:', languagesToCreate);
    console.log('Creating lessons for levels:', levelsToCreate);
    console.log('createAll flag:', createAll);

    for (const lang of languagesToCreate) {
      console.log(`Processing language: ${lang}`);
      for (const level of levelsToCreate) {
        const topicsForLevel = LESSON_TEMPLATES[level] || {};
        
        for (const [topic, template] of Object.entries(topicsForLevel)) {
          try {
            // Check if lesson already exists
            const existing = await prisma.lesson.findFirst({
              where: {
                targetLanguage: lang,
                level,
                topic,
                title: template.title,
              },
            });

            if (existing) {
              errors.push(`שיעור "${template.title}" (${lang}) כבר קיים`);
              continue;
            }

            // Get the next order number for this topic/level/language
            const maxOrder = await prisma.lesson.findFirst({
              where: {
                targetLanguage: lang,
                level,
                topic,
              },
              orderBy: {
                order: 'desc',
              },
              select: {
                order: true,
              },
            });

            const nextOrder = (maxOrder?.order || 0) + 1;

            // Create lesson with vocabulary
            const vocabularyData = template.vocabulary.map((term: any, index: number) => ({
              hebrewTerm: term.hebrew,
              translatedTerm: getTranslation(term, lang),
              pronunciation: getPronunciation(term, lang),
              difficulty: 'EASY' as const,
              partOfSpeech: 'NOUN' as const,
              order: index + 1,
              usageExample: JSON.stringify({
                target: `${getTranslation(term, lang)} - ${term.hebrew}`,
                hebrew: term.hebrew,
              }),
            }));

            // Create exercises
            const exercisesData = [
              {
                type: 'MATCHING' as const,
                title: 'התאם את המילה',
                instructions: `בחרי את התרגום הנכון למילה "${template.vocabulary[0].hebrew}"`,
                question: `מה התרגום של "${template.vocabulary[0].hebrew}"?`,
                correctAnswer: getTranslation(template.vocabulary[0], lang),
                points: 10,
                order: 1,
                options: {
                  create: [
                    {
                      text: getTranslation(template.vocabulary[0], lang),
                      isCorrect: true,
                      explanation: `נכון! "${template.vocabulary[0].hebrew}" מתרגם ל-${getTranslation(template.vocabulary[0], lang)}`,
                      order: 1,
                    },
                    {
                      text: getTranslation(template.vocabulary[1] || template.vocabulary[0], lang),
                      isCorrect: false,
                      explanation: 'זה לא התרגום הנכון',
                      order: 2,
                    },
                    {
                      text: getTranslation(template.vocabulary[2] || template.vocabulary[0], lang),
                      isCorrect: false,
                      explanation: 'זה לא התרגום הנכון',
                      order: 3,
                    },
                  ],
                },
              },
              {
                type: 'FILL_BLANK' as const,
                title: 'השלמי את המשפט',
                instructions: 'השלמי את המילה החסרה',
                question: `The word "${getTranslation(template.vocabulary[1] || template.vocabulary[0], lang)}" means "[BLANK]" in Hebrew`,
                correctAnswer: template.vocabulary[1]?.hebrew || template.vocabulary[0].hebrew,
                points: 10,
                order: 2,
              },
            ];

            const lesson = await prisma.lesson.create({
              data: {
                targetLanguage: lang,
                level,
                topic,
                title: template.title,
                description: template.description,
                duration: 15,
                objectives: JSON.stringify(['ללמוד מילים בסיסיות', 'להבין שימוש במילים']),
                grammarNotes: `<p>בשיעור זה נלמד מילים הקשורות ל-${topic}.</p>`,
                culturalTips: `מילים אלה שימושיות מאוד ב-${lang === 'english' ? 'אנגלית' : lang === 'romanian' ? 'רומנית' : 'איטלקית'}.`,
                order: nextOrder,
                isPublished: true,
                vocabulary: {
                  create: vocabularyData,
                },
                exercises: {
                  create: exercisesData,
                },
              },
              include: {
                vocabulary: true,
                exercises: {
                  include: {
                    options: true,
                  },
                },
              },
            });

            createdLessons.push(lesson);
          } catch (error: any) {
            errors.push(`שגיאה ביצירת שיעור "${template.title}" (${lang}): ${error.message}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `נוצרו ${createdLessons.length} שיעורים`,
      created: createdLessons.length,
      errors: errors.length > 0 ? errors : undefined,
      lessons: createdLessons,
    });
  } catch (error: any) {
    console.error('Error creating demo lessons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה ביצירת שיעורים',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

