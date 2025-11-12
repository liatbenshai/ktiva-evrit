import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Lesson templates for different topics and levels
const LESSON_TEMPLATES: Record<string, Record<string, any>> = {
  BEGINNER: {
    היכרות: {
      title: 'היכרות בסיסית',
      description: 'ללמוד ברכות והצגה עצמית',
      vocabulary: [
        { hebrew: 'שלום', en: 'Hello', ro: 'Salut', it: 'Ciao', fr: 'Bonjour', pronunciation: { en: 'heh-LOH', ro: 'sa-LOOT', it: 'CHAO', fr: 'bon-ZHOOR' } },
        { hebrew: 'מה שלומך?', en: 'How are you?', ro: 'Ce mai faci?', it: 'Come stai?', fr: 'Comment allez-vous?', pronunciation: { en: 'how ar YOO', ro: 'cheh mai FAH-chee', it: 'KOH-meh STAH-ee', fr: 'koh-MAHN tah-LAY voo' } },
        { hebrew: 'תודה', en: 'Thank you', ro: 'Mulțumesc', it: 'Grazie', fr: 'Merci', pronunciation: { en: 'THANK yoo', ro: 'mool-tsoo-MESK', it: 'GRAH-tsee-eh', fr: 'mehr-SEE' } },
        { hebrew: 'בבקשה', en: 'Please', ro: 'Te rog', it: 'Per favore', fr: 'S\'il vous plaît', pronunciation: { en: 'pleez', ro: 'teh ROHG', it: 'pehr fah-VOH-reh', fr: 'seel voo PLAY' } },
        { hebrew: 'סליחה', en: 'Sorry', ro: 'Scuze', it: 'Scusa', fr: 'Désolé', pronunciation: { en: 'SOR-ee', ro: 'SKOO-zeh', it: 'SKOO-zah', fr: 'day-zoh-LAY' } },
      ],
    },
    אוכל: {
      title: 'אוכל ומסעדות',
      description: 'מילים שימושיות להזמנה במסעדה',
      vocabulary: [
        { hebrew: 'תפריט', en: 'Menu', ro: 'Meniu', it: 'Menu', fr: 'Menu', pronunciation: { en: 'MEN-yoo', ro: 'meh-NEE-oo', it: 'MEH-noo', fr: 'meh-NOO' } },
        { hebrew: 'מים', en: 'Water', ro: 'Apă', it: 'Acqua', fr: 'Eau', pronunciation: { en: 'WAH-ter', ro: 'AH-puh', it: 'AHK-kwah', fr: 'oh' } },
        { hebrew: 'לחם', en: 'Bread', ro: 'Pâine', it: 'Pane', fr: 'Pain', pronunciation: { en: 'bred', ro: 'puh-EE-neh', it: 'PAH-neh', fr: 'pan' } },
        { hebrew: 'בקשה', en: 'Order', ro: 'Comandă', it: 'Ordine', fr: 'Commande', pronunciation: { en: 'OR-der', ro: 'koh-MAHN-duh', it: 'OR-dee-neh', fr: 'koh-MAHND' } },
        { hebrew: 'חשבון', en: 'Bill', ro: 'Notă', it: 'Conto', fr: 'Addition', pronunciation: { en: 'bil', ro: 'NOH-tuh', it: 'KOHN-toh', fr: 'ah-dee-SYOHN' } },
      ],
    },
    עבודה: {
      title: 'עבודה ועסקים',
      description: 'מילים שימושיות בסביבת עבודה',
      vocabulary: [
        { hebrew: 'פגישה', en: 'Meeting', ro: 'Întâlnire', it: 'Riunione', fr: 'Réunion', pronunciation: { en: 'MEE-ting', ro: 'uhn-tuh-lee-NEH-reh', it: 'ree-oo-NYOH-neh', fr: 'ray-oo-NYOHN' } },
        { hebrew: 'פרויקט', en: 'Project', ro: 'Proiect', it: 'Progetto', fr: 'Projet', pronunciation: { en: 'PROJ-ekt', ro: 'proh-YEKT', it: 'proh-JEHT-toh', fr: 'proh-ZHEH' } },
        { hebrew: 'דדליין', en: 'Deadline', ro: 'Termen limită', it: 'Scadenza', fr: 'Date limite', pronunciation: { en: 'DED-line', ro: 'TEHR-mehn LEE-mee-tuh', it: 'skah-DEHN-zah', fr: 'daht lee-MEET' } },
        { hebrew: 'עבודה', en: 'Work', ro: 'Muncă', it: 'Lavoro', fr: 'Travail', pronunciation: { en: 'wurk', ro: 'MOON-kuh', it: 'lah-VOH-roh', fr: 'trah-VAHY' } },
        { hebrew: 'לקוח', en: 'Client', ro: 'Client', it: 'Cliente', fr: 'Client', pronunciation: { en: 'KLY-ent', ro: 'klee-ENT', it: 'KLEE-ehn-teh', fr: 'klee-AHN' } },
      ],
    },
    מספרים: {
      title: 'מספרים בסיסיים',
      description: 'ללמוד לספור מ-1 עד 20',
      vocabulary: [
        { hebrew: 'אחד', en: 'One', ro: 'Unu', it: 'Uno', fr: 'Un', pronunciation: { en: 'wun', ro: 'OO-noo', it: 'OO-noh', fr: 'uhn' } },
        { hebrew: 'שניים', en: 'Two', ro: 'Doi', it: 'Due', fr: 'Deux', pronunciation: { en: 'too', ro: 'doy', it: 'DOO-eh', fr: 'duh' } },
        { hebrew: 'שלושה', en: 'Three', ro: 'Trei', it: 'Tre', fr: 'Trois', pronunciation: { en: 'three', ro: 'tray', it: 'TREH', fr: 'trwah' } },
        { hebrew: 'ארבעה', en: 'Four', ro: 'Patru', it: 'Quattro', fr: 'Quatre', pronunciation: { en: 'for', ro: 'PAH-troo', it: 'KWAHT-troh', fr: 'kahtr' } },
        { hebrew: 'חמישה', en: 'Five', ro: 'Cinci', it: 'Cinque', fr: 'Cinq', pronunciation: { en: 'fahyv', ro: 'cheench', it: 'CHEEN-kweh', fr: 'sank' } },
      ],
    },
    צבעים: {
      title: 'צבעים בסיסיים',
      description: 'ללמוד שמות צבעים',
      vocabulary: [
        { hebrew: 'אדום', en: 'Red', ro: 'Roșu', it: 'Rosso', fr: 'Rouge', pronunciation: { en: 'red', ro: 'ROH-shoo', it: 'ROHS-soh', fr: 'roozh' } },
        { hebrew: 'כחול', en: 'Blue', ro: 'Albastru', it: 'Blu', fr: 'Bleu', pronunciation: { en: 'bloo', ro: 'ahl-BAHS-troo', it: 'bloo', fr: 'bluh' } },
        { hebrew: 'ירוק', en: 'Green', ro: 'Verde', it: 'Verde', fr: 'Vert', pronunciation: { en: 'green', ro: 'VEHR-deh', it: 'VEHR-deh', fr: 'vehr' } },
        { hebrew: 'צהוב', en: 'Yellow', ro: 'Galben', it: 'Giallo', fr: 'Jaune', pronunciation: { en: 'YEL-oh', ro: 'GAHL-ben', it: 'JAHL-loh', fr: 'zhohn' } },
        { hebrew: 'שחור', en: 'Black', ro: 'Negru', it: 'Nero', fr: 'Noir', pronunciation: { en: 'blak', ro: 'NEH-groo', it: 'NEH-roh', fr: 'nwahr' } },
      ],
    },
  },
  INTERMEDIATE: {
    נסיעות: {
      title: 'נסיעות ותיירות',
      description: 'מילים שימושיות לטיולים',
      vocabulary: [
        { hebrew: 'שדה תעופה', en: 'Airport', ro: 'Aeroport', it: 'Aeroporto', fr: 'Aéroport', pronunciation: { en: 'AIR-port', ro: 'ah-eh-roh-PORT', it: 'ah-eh-roh-POR-toh', fr: 'ah-ay-roh-POR' } },
        { hebrew: 'מלון', en: 'Hotel', ro: 'Hotel', it: 'Hotel', fr: 'Hôtel', pronunciation: { en: 'hoh-TEL', ro: 'hoh-TEL', it: 'oh-TEL', fr: 'oh-TEL' } },
        { hebrew: 'כרטיס', en: 'Ticket', ro: 'Bilet', it: 'Biglietto', fr: 'Billet', pronunciation: { en: 'TIK-et', ro: 'bee-LET', it: 'bee-LYET-toh', fr: 'bee-YAY' } },
        { hebrew: 'תיק', en: 'Suitcase', ro: 'Valiză', it: 'Valigia', fr: 'Valise', pronunciation: { en: 'SOOT-kays', ro: 'vah-LEE-zuh', it: 'vah-LEE-jah', fr: 'vah-LEEZ' } },
        { hebrew: 'מפה', en: 'Map', ro: 'Hartă', it: 'Mappa', fr: 'Carte', pronunciation: { en: 'map', ro: 'HAHR-tuh', it: 'MAHP-pah', fr: 'kahrt' } },
      ],
    },
    בית: {
      title: 'בית ומשפחה',
      description: 'מילים הקשורות לחיי בית',
      vocabulary: [
        { hebrew: 'סלון', en: 'Living room', ro: 'Sufragerie', it: 'Soggiorno', fr: 'Salon', pronunciation: { en: 'LIV-ing room', ro: 'soo-frah-jeh-REE-eh', it: 'sohj-JOR-noh', fr: 'sah-LOHN' } },
        { hebrew: 'מטבח', en: 'Kitchen', ro: 'Bucătărie', it: 'Cucina', fr: 'Cuisine', pronunciation: { en: 'KICH-en', ro: 'boo-kuh-tuh-REE-eh', it: 'koo-CHEE-nah', fr: 'kwee-ZEEN' } },
        { hebrew: 'שולחן', en: 'Table', ro: 'Masă', it: 'Tavolo', fr: 'Table', pronunciation: { en: 'TAY-bul', ro: 'MAH-suh', it: 'TAH-voh-loh', fr: 'TAH-bluh' } },
        { hebrew: 'כיסא', en: 'Chair', ro: 'Scaun', it: 'Sedia', fr: 'Chaise', pronunciation: { en: 'chair', ro: 'skah-OON', it: 'SEH-dee-ah', fr: 'shehz' } },
        { hebrew: 'חלון', en: 'Window', ro: 'Fereastră', it: 'Finestra', fr: 'Fenêtre', pronunciation: { en: 'WIN-doh', ro: 'feh-reh-AHS-truh', it: 'fee-NEHS-trah', fr: 'fuh-NEH-truh' } },
      ],
    },
    קניות: {
      title: 'קניות ושווקים',
      description: 'מילים שימושיות לקניות',
      vocabulary: [
        { hebrew: 'חנות', en: 'Shop', ro: 'Magazin', it: 'Negozio', fr: 'Magasin', pronunciation: { en: 'shop', ro: 'mah-gah-ZEEN', it: 'neh-GOH-tsee-oh', fr: 'mah-gah-ZAN' } },
        { hebrew: 'כמה זה עולה?', en: 'How much does it cost?', ro: 'Cât costă?', it: 'Quanto costa?', fr: 'Combien ça coûte?', pronunciation: { en: 'how much', ro: 'kuht KOHS-tuh', it: 'KWAHN-toh KOHS-tah', fr: 'kohm-BYAN sah koot' } },
        { hebrew: 'תשלום', en: 'Payment', ro: 'Plată', it: 'Pagamento', fr: 'Paiement', pronunciation: { en: 'PAY-ment', ro: 'PLAH-tuh', it: 'pah-gah-MEN-toh', fr: 'pay-MAHN' } },
        { hebrew: 'מחיר', en: 'Price', ro: 'Preț', it: 'Prezzo', fr: 'Prix', pronunciation: { en: 'prahys', ro: 'prehts', it: 'PREHT-tsoh', fr: 'pree' } },
        { hebrew: 'הנחה', en: 'Discount', ro: 'Reducere', it: 'Sconto', fr: 'Réduction', pronunciation: { en: 'DIS-kount', ro: 'reh-doo-CHEH-reh', it: 'SKOHN-toh', fr: 'ray-dook-SYOHN' } },
      ],
    },
    בריאות: {
      title: 'בריאות ורפואה',
      description: 'מילים שימושיות בבריאות',
      vocabulary: [
        { hebrew: 'רופא', en: 'Doctor', ro: 'Doctor', it: 'Dottore', fr: 'Docteur', pronunciation: { en: 'DOK-ter', ro: 'dohk-TOHR', it: 'doht-TOH-reh', fr: 'dohk-TUHR' } },
        { hebrew: 'בית חולים', en: 'Hospital', ro: 'Spital', it: 'Ospedale', fr: 'Hôpital', pronunciation: { en: 'HOS-pi-tal', ro: 'spee-TAHL', it: 'oh-speh-DAH-leh', fr: 'oh-pee-TAHL' } },
        { hebrew: 'תרופה', en: 'Medicine', ro: 'Medicament', it: 'Medicina', fr: 'Médicament', pronunciation: { en: 'MED-i-sin', ro: 'meh-dee-kah-MENT', it: 'meh-dee-CHEE-nah', fr: 'may-dee-kah-MAHN' } },
        { hebrew: 'כאב', en: 'Pain', ro: 'Durere', it: 'Dolore', fr: 'Douleur', pronunciation: { en: 'payn', ro: 'doo-REH-reh', it: 'doh-LOH-reh', fr: 'doo-LUHR' } },
        { hebrew: 'בריא', en: 'Healthy', ro: 'Sănătos', it: 'Sano', fr: 'Sain', pronunciation: { en: 'HEL-thee', ro: 'suh-nuh-TOHS', it: 'SAH-noh', fr: 'san' } },
      ],
    },
  },
  ADVANCED: {
    משפחה: {
      title: 'משפחה ויחסים',
      description: 'דיבור על משפחה ויחסים',
      vocabulary: [
        { hebrew: 'משפחה', en: 'Family', ro: 'Familie', it: 'Famiglia', fr: 'Famille', pronunciation: { en: 'FAM-uh-lee', ro: 'fah-MEE-lee-eh', it: 'fah-MEE-lyah', fr: 'fah-MEE-yuh' } },
        { hebrew: 'הורים', en: 'Parents', ro: 'Părinți', it: 'Genitori', fr: 'Parents', pronunciation: { en: 'PAIR-ents', ro: 'puh-REEN-tsee', it: 'jeh-nee-TOH-ree', fr: 'pah-RAHN' } },
        { hebrew: 'אח', en: 'Brother', ro: 'Frate', it: 'Fratello', fr: 'Frère', pronunciation: { en: 'BRUTH-er', ro: 'FRAH-teh', it: 'frah-TEHL-loh', fr: 'frehr' } },
        { hebrew: 'אחות', en: 'Sister', ro: 'Soră', it: 'Sorella', fr: 'Sœur', pronunciation: { en: 'SIS-ter', ro: 'SOH-ruh', it: 'soh-REHL-lah', fr: 'suhr' } },
        { hebrew: 'סבים', en: 'Grandparents', ro: 'Bunici', it: 'Nonni', fr: 'Grands-parents', pronunciation: { en: 'GRAND-pair-ents', ro: 'BOO-nee-chee', it: 'NOHN-nee', fr: 'grahn pah-RAHN' } },
      ],
    },
    עסקים: {
      title: 'עסקים וכלכלה',
      description: 'מילים מתקדמות בעסקים',
      vocabulary: [
        { hebrew: 'חברה', en: 'Company', ro: 'Companie', it: 'Azienda', fr: 'Entreprise', pronunciation: { en: 'KUM-puh-nee', ro: 'kohm-pah-NEE-eh', it: 'ah-TSYEHN-dah', fr: 'ahn-truh-PREEZ' } },
        { hebrew: 'השקעה', en: 'Investment', ro: 'Investiție', it: 'Investimento', fr: 'Investissement', pronunciation: { en: 'in-VEST-ment', ro: 'een-veh-STEE-tsee-eh', it: 'een-veh-STEE-men-toh', fr: 'an-veh-stees-MAHN' } },
        { hebrew: 'רווח', en: 'Profit', ro: 'Profit', it: 'Profitto', fr: 'Profit', pronunciation: { en: 'PROF-it', ro: 'proh-FEET', it: 'proh-FEET-toh', fr: 'proh-FEE' } },
        { hebrew: 'שוק', en: 'Market', ro: 'Piață', it: 'Mercato', fr: 'Marché', pronunciation: { en: 'MAR-ket', ro: 'PYAH-tsuh', it: 'mehr-KAH-toh', fr: 'mahr-SHAY' } },
        { hebrew: 'משא ומתן', en: 'Negotiation', ro: 'Negociere', it: 'Negoziazione', fr: 'Négociation', pronunciation: { en: 'ni-goh-shee-AY-shun', ro: 'neh-goh-chee-EH-reh', it: 'neh-goh-tsee-ah-TSYOH-neh', fr: 'nay-goh-see-ah-SYOHN' } },
      ],
    },
    תרבות: {
      title: 'תרבות ואמנות',
      description: 'מילים הקשורות לתרבות',
      vocabulary: [
        { hebrew: 'תרבות', en: 'Culture', ro: 'Cultură', it: 'Cultura', fr: 'Culture', pronunciation: { en: 'KUL-chur', ro: 'kool-TOO-ruh', it: 'kool-TOO-rah', fr: 'kool-TOOR' } },
        { hebrew: 'אמנות', en: 'Art', ro: 'Artă', it: 'Arte', fr: 'Art', pronunciation: { en: 'ahrt', ro: 'AHR-tuh', it: 'AHR-teh', fr: 'ahr' } },
        { hebrew: 'מוזיאון', en: 'Museum', ro: 'Muzeu', it: 'Museo', fr: 'Musée', pronunciation: { en: 'myoo-ZEE-um', ro: 'moo-ZEH-oo', it: 'moo-ZEH-oh', fr: 'moo-ZAY' } },
        { hebrew: 'תיאטרון', en: 'Theater', ro: 'Teatru', it: 'Teatro', fr: 'Théâtre', pronunciation: { en: 'THEE-uh-ter', ro: 'teh-AH-troo', it: 'teh-AH-troh', fr: 'tay-AH-truh' } },
        { hebrew: 'ספרות', en: 'Literature', ro: 'Literatură', it: 'Letteratura', fr: 'Littérature', pronunciation: { en: 'LIT-er-uh-chur', ro: 'lee-teh-rah-TOO-ruh', it: 'leht-teh-rah-TOO-rah', fr: 'lee-tay-rah-TOOR' } },
      ],
    },
  },
};

function getTranslation(term: any, lang: SupportedLanguageKey): string {
  // Try direct key first (french, romanian, italian, english)
  if (term[lang]) return term[lang];
  // Try short codes
  const langMap: Record<SupportedLanguageKey, string> = {
    french: 'fr',
    romanian: 'ro',
    italian: 'it',
    english: 'en',
  };
  const shortCode = langMap[lang];
  if (term[shortCode]) return term[shortCode];
  // Fallback to English
  return term.en || '';
}

function getPronunciation(term: any, lang: SupportedLanguageKey): string {
  return term.pronunciation?.[lang] || term.pronunciation?.fr || term.pronunciation?.en || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetLanguage = 'english', createAll = false } = body;

    const createdLessons: any[] = [];
    const errors: string[] = [];

    // If createAll, create lessons for all languages, levels and topics
    const languagesToCreate = createAll 
      ? (['english', 'romanian', 'italian', 'french'] as SupportedLanguageKey[])
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
            // Check if lesson already exists (by title, language, level, topic)
            const existing = await prisma.lesson.findFirst({
              where: {
                targetLanguage: lang,
                level,
                topic,
                title: template.title,
              },
            });

            if (existing) {
              console.log(`Skipping existing lesson: ${template.title} (${lang}, ${level}, ${topic})`);
              errors.push(`שיעור "${template.title}" (${lang}) כבר קיים`);
              continue;
            }

            console.log(`Creating lesson: ${template.title} for ${lang}, ${level}, ${topic}`);

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
                culturalTips: `מילים אלה שימושיות מאוד ב-${lang === 'english' ? 'אנגלית' : lang === 'romanian' ? 'רומנית' : lang === 'italian' ? 'איטלקית' : 'צרפתית'}.`,
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
            console.log(`Successfully created lesson: ${template.title} (${lang})`);
          } catch (error: any) {
            console.error(`Error creating lesson "${template.title}" (${lang}):`, error);
            errors.push(`שגיאה ביצירת שיעור "${template.title}" (${lang}): ${error.message}`);
          }
        }
      }
      console.log(`Finished processing language: ${lang}. Created: ${createdLessons.filter(l => l.targetLanguage === lang).length}`);
    }

    console.log(`Total created: ${createdLessons.length}, Errors: ${errors.length}`);

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

