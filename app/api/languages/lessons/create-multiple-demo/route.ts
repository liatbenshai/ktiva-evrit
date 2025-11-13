import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';
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
        { hebrew: 'להתראות', en: 'Goodbye', ro: 'La revedere', it: 'Arrivederci', fr: 'Au revoir', pronunciation: { en: 'good-BYE', ro: 'lah reh-veh-DEH-reh', it: 'ah-ree-veh-DEHR-chee', fr: 'oh ruh-VWAHR' } },
        { hebrew: 'שמי', en: 'My name is', ro: 'Mă numesc', it: 'Mi chiamo', fr: 'Je m\'appelle', pronunciation: { en: 'my name iz', ro: 'muh noo-MESK', it: 'mee KYAH-moh', fr: 'zhuh mah-PEHL' } },
        { hebrew: 'אני מ', en: 'I am from', ro: 'Sunt din', it: 'Sono di', fr: 'Je suis de', pronunciation: { en: 'ay am from', ro: 'soont deen', it: 'SOH-noh dee', fr: 'zhuh swee duh' } },
        { hebrew: 'נעים להכיר', en: 'Nice to meet you', ro: 'Îmi pare bine', it: 'Piacere', fr: 'Enchanté', pronunciation: { en: 'nahys tu meet yoo', ro: 'uhm PAH-reh BEE-neh', it: 'pyah-CHEH-reh', fr: 'ahn-shahn-TAY' } },
        { hebrew: 'כן', en: 'Yes', ro: 'Da', it: 'Sì', fr: 'Oui', pronunciation: { en: 'yes', ro: 'dah', it: 'see', fr: 'wee' } },
        { hebrew: 'לא', en: 'No', ro: 'Nu', it: 'No', fr: 'Non', pronunciation: { en: 'noh', ro: 'noo', it: 'noh', fr: 'nohn' } },
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
        { hebrew: 'אוכל', en: 'Food', ro: 'Mâncare', it: 'Cibo', fr: 'Nourriture', pronunciation: { en: 'food', ro: 'muhn-KAH-reh', it: 'CHEE-boh', fr: 'noo-ree-TOOR' } },
        { hebrew: 'בשר', en: 'Meat', ro: 'Carne', it: 'Carne', fr: 'Viande', pronunciation: { en: 'meet', ro: 'KAHR-neh', it: 'KAHR-neh', fr: 'vyahnd' } },
        { hebrew: 'דג', en: 'Fish', ro: 'Pește', it: 'Pesce', fr: 'Poisson', pronunciation: { en: 'fish', ro: 'PEHSH-teh', it: 'PEH-sheh', fr: 'pwah-SOHN' } },
        { hebrew: 'ירקות', en: 'Vegetables', ro: 'Legume', it: 'Verdure', fr: 'Légumes', pronunciation: { en: 'VEJ-tuh-buls', ro: 'leh-GOO-meh', it: 'vehr-DOO-reh', fr: 'lay-GOOM' } },
        { hebrew: 'פירות', en: 'Fruits', ro: 'Fructe', it: 'Frutta', fr: 'Fruits', pronunciation: { en: 'froots', ro: 'FROOK-teh', it: 'FROOT-tah', fr: 'frwee' } },
        { hebrew: 'קפה', en: 'Coffee', ro: 'Cafea', it: 'Caffè', fr: 'Café', pronunciation: { en: 'KAH-fee', ro: 'kah-FEH-ah', it: 'kahf-FEH', fr: 'kah-FAY' } },
        { hebrew: 'תה', en: 'Tea', ro: 'Ceai', it: 'Tè', fr: 'Thé', pronunciation: { en: 'tee', ro: 'chay', it: 'teh', fr: 'tay' } },
        { hebrew: 'ביצה', en: 'Egg', ro: 'Ouă', it: 'Uovo', fr: 'Œuf', pronunciation: { en: 'eg', ro: 'WAH-uh', it: 'WAH-voh', fr: 'uhf' } },
        { hebrew: 'חלב', en: 'Milk', ro: 'Lapte', it: 'Latte', fr: 'Lait', pronunciation: { en: 'milk', ro: 'LAHP-teh', it: 'LAHT-teh', fr: 'lay' } },
        { hebrew: 'גבינה', en: 'Cheese', ro: 'Brânză', it: 'Formaggio', fr: 'Fromage', pronunciation: { en: 'cheez', ro: 'bruhn-ZUH', it: 'for-MAHJ-joh', fr: 'froh-MAHZH' } },
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
        { hebrew: 'שישה', en: 'Six', ro: 'Șase', it: 'Sei', fr: 'Six', pronunciation: { en: 'siks', ro: 'SHAH-seh', it: 'say', fr: 'sees' } },
        { hebrew: 'שבעה', en: 'Seven', ro: 'Șapte', it: 'Sette', fr: 'Sept', pronunciation: { en: 'SEV-en', ro: 'SHAHP-teh', it: 'SEHT-teh', fr: 'seht' } },
        { hebrew: 'שמונה', en: 'Eight', ro: 'Opt', it: 'Otto', fr: 'Huit', pronunciation: { en: 'ayt', ro: 'ohpt', it: 'OHT-toh', fr: 'weet' } },
        { hebrew: 'תשעה', en: 'Nine', ro: 'Nouă', it: 'Nove', fr: 'Neuf', pronunciation: { en: 'nahyn', ro: 'NOH-uh', it: 'NOH-veh', fr: 'nuhf' } },
        { hebrew: 'עשרה', en: 'Ten', ro: 'Zece', it: 'Dieci', fr: 'Dix', pronunciation: { en: 'ten', ro: 'ZEH-cheh', it: 'DYEH-chee', fr: 'dees' } },
        { hebrew: 'עשרים', en: 'Twenty', ro: 'Douăzeci', it: 'Venti', fr: 'Vingt', pronunciation: { en: 'TWEN-tee', ro: 'doh-uh-ZEH-chee', it: 'VEHN-tee', fr: 'van' } },
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
        { hebrew: 'לבן', en: 'White', ro: 'Alb', it: 'Bianco', fr: 'Blanc', pronunciation: { en: 'wahyt', ro: 'ahlb', it: 'BYAHN-koh', fr: 'blahn' } },
        { hebrew: 'ורוד', en: 'Pink', ro: 'Roz', it: 'Rosa', fr: 'Rose', pronunciation: { en: 'pink', ro: 'rohz', it: 'ROH-zah', fr: 'rohz' } },
        { hebrew: 'סגול', en: 'Purple', ro: 'Violet', it: 'Viola', fr: 'Violet', pronunciation: { en: 'PUR-pul', ro: 'vee-oh-LET', it: 'vee-OH-lah', fr: 'vee-oh-LAY' } },
        { hebrew: 'כתום', en: 'Orange', ro: 'Portocaliu', it: 'Arancione', fr: 'Orange', pronunciation: { en: 'OR-anj', ro: 'por-toh-KAH-lee-oo', it: 'ah-rahn-CHOH-neh', fr: 'oh-RAHNZH' } },
        { hebrew: 'חום', en: 'Brown', ro: 'Maro', it: 'Marrone', fr: 'Marron', pronunciation: { en: 'brown', ro: 'mah-ROH', it: 'mahr-ROH-neh', fr: 'mah-ROHN' } },
      ],
    },
    בעלי_חיים: {
      title: 'בעלי חיים',
      description: 'ללמוד שמות בעלי חיים',
      vocabulary: [
        { hebrew: 'כלב', en: 'Dog', ro: 'Câine', it: 'Cane', fr: 'Chien', pronunciation: { en: 'dawg', ro: 'kuh-EE-neh', it: 'KAH-neh', fr: 'shyan' } },
        { hebrew: 'חתול', en: 'Cat', ro: 'Pisică', it: 'Gatto', fr: 'Chat', pronunciation: { en: 'kat', ro: 'pee-SEE-kuh', it: 'GAHT-toh', fr: 'shah' } },
        { hebrew: 'ציפור', en: 'Bird', ro: 'Pasăre', it: 'Uccello', fr: 'Oiseau', pronunciation: { en: 'burd', ro: 'pah-SUH-reh', it: 'oot-CHEHL-loh', fr: 'wah-ZOH' } },
        { hebrew: 'סוס', en: 'Horse', ro: 'Cal', it: 'Cavallo', fr: 'Cheval', pronunciation: { en: 'hors', ro: 'kahl', it: 'kah-VAHL-loh', fr: 'shuh-VAHL' } },
        { hebrew: 'פרה', en: 'Cow', ro: 'Vacă', it: 'Mucca', fr: 'Vache', pronunciation: { en: 'kow', ro: 'VAH-kuh', it: 'MOOK-kah', fr: 'vahsh' } },
        { hebrew: 'חזיר', en: 'Pig', ro: 'Porc', it: 'Maiale', fr: 'Cochon', pronunciation: { en: 'pig', ro: 'pohrk', it: 'mah-YAH-leh', fr: 'koh-SHOHN' } },
        { hebrew: 'ארנב', en: 'Rabbit', ro: 'Iepure', it: 'Coniglio', fr: 'Lapin', pronunciation: { en: 'RAB-it', ro: 'yeh-POO-reh', it: 'koh-NEE-lyoh', fr: 'lah-PAN' } },
        { hebrew: 'דוב', en: 'Bear', ro: 'Urs', it: 'Orso', fr: 'Ours', pronunciation: { en: 'bair', ro: 'oors', it: 'OR-soh', fr: 'oors' } },
        { hebrew: 'אריה', en: 'Lion', ro: 'Leu', it: 'Leone', fr: 'Lion', pronunciation: { en: 'LY-un', ro: 'leh-oo', it: 'leh-OH-neh', fr: 'lee-OHN' } },
        { hebrew: 'פיל', en: 'Elephant', ro: 'Elefant', it: 'Elefante', fr: 'Éléphant', pronunciation: { en: 'EL-uh-fent', ro: 'eh-leh-FAHNT', it: 'eh-leh-FAHN-teh', fr: 'ay-lay-FAHN' } },
      ],
    },
    זמן: {
      title: 'זמן וימים',
      description: 'ללמוד מילים הקשורות לזמן',
      vocabulary: [
        { hebrew: 'יום', en: 'Day', ro: 'Zi', it: 'Giorno', fr: 'Jour', pronunciation: { en: 'day', ro: 'zee', it: 'JOR-noh', fr: 'zhoor' } },
        { hebrew: 'לילה', en: 'Night', ro: 'Noapte', it: 'Notte', fr: 'Nuit', pronunciation: { en: 'nahyt', ro: 'NWAHP-teh', it: 'NOHT-teh', fr: 'nwee' } },
        { hebrew: 'בוקר', en: 'Morning', ro: 'Dimineață', it: 'Mattina', fr: 'Matin', pronunciation: { en: 'MOR-ning', ro: 'dee-mee-NYAH-tsuh', it: 'maht-TEE-nah', fr: 'mah-TAN' } },
        { hebrew: 'צהריים', en: 'Noon', ro: 'Amiază', it: 'Mezzogiorno', fr: 'Midi', pronunciation: { en: 'noon', ro: 'ah-mee-AH-zuh', it: 'meht-tsoh-JOR-noh', fr: 'mee-DEE' } },
        { hebrew: 'ערב', en: 'Evening', ro: 'Seară', it: 'Sera', fr: 'Soir', pronunciation: { en: 'EEV-ning', ro: 'SEH-ah-ruh', it: 'SEH-rah', fr: 'swahr' } },
        { hebrew: 'שעה', en: 'Hour', ro: 'Oră', it: 'Ora', fr: 'Heure', pronunciation: { en: 'owr', ro: 'OH-ruh', it: 'OH-rah', fr: 'uhr' } },
        { hebrew: 'דקה', en: 'Minute', ro: 'Minut', it: 'Minuto', fr: 'Minute', pronunciation: { en: 'MIN-it', ro: 'mee-NOOT', it: 'mee-NOO-toh', fr: 'mee-NOOT' } },
        { hebrew: 'שבוע', en: 'Week', ro: 'Săptămână', it: 'Settimana', fr: 'Semaine', pronunciation: { en: 'week', ro: 'suhp-tuh-MUH-nuh', it: 'seht-tee-MAH-nah', fr: 'suh-MEHN' } },
        { hebrew: 'חודש', en: 'Month', ro: 'Lună', it: 'Mese', fr: 'Mois', pronunciation: { en: 'muhnth', ro: 'LOO-nuh', it: 'MEH-zeh', fr: 'mwah' } },
        { hebrew: 'שנה', en: 'Year', ro: 'An', it: 'Anno', fr: 'Année', pronunciation: { en: 'yeer', ro: 'ahn', it: 'AHN-noh', fr: 'ah-NAY' } },
      ],
    },
    ימים_בשבוע: {
      title: 'ימים בשבוע',
      description: 'ללמוד את שמות ימי השבוע',
      vocabulary: [
        { hebrew: 'יום ראשון', en: 'Sunday', ro: 'Duminică', it: 'Domenica', fr: 'Dimanche', pronunciation: { en: 'SUN-day', ro: 'doo-mee-NEE-kuh', it: 'doh-MEH-nee-kah', fr: 'dee-MAHNSH' } },
        { hebrew: 'יום שני', en: 'Monday', ro: 'Luni', it: 'Lunedì', fr: 'Lundi', pronunciation: { en: 'MUHN-day', ro: 'LOO-nee', it: 'loo-neh-DEE', fr: 'luhn-DEE' } },
        { hebrew: 'יום שלישי', en: 'Tuesday', ro: 'Marți', it: 'Martedì', fr: 'Mardi', pronunciation: { en: 'TOOZ-day', ro: 'MAHR-tsee', it: 'mahr-teh-DEE', fr: 'mahr-DEE' } },
        { hebrew: 'יום רביעי', en: 'Wednesday', ro: 'Miercuri', it: 'Mercoledì', fr: 'Mercredi', pronunciation: { en: 'WENZ-day', ro: 'myehr-KOO-ree', it: 'mehr-koh-leh-DEE', fr: 'mehr-kruh-DEE' } },
        { hebrew: 'יום חמישי', en: 'Thursday', ro: 'Joi', it: 'Giovedì', fr: 'Jeudi', pronunciation: { en: 'THURZ-day', ro: 'zhoy', it: 'joh-veh-DEE', fr: 'zhuh-DEE' } },
        { hebrew: 'יום שישי', en: 'Friday', ro: 'Vineri', it: 'Venerdì', fr: 'Vendredi', pronunciation: { en: 'FRAHY-day', ro: 'vee-NEH-ree', it: 'veh-nehr-DEE', fr: 'vahn-druh-DEE' } },
        { hebrew: 'יום שבת', en: 'Saturday', ro: 'Sâmbătă', it: 'Sabato', fr: 'Samedi', pronunciation: { en: 'SAT-er-day', ro: 'suhm-BUH-tuh', it: 'SAH-bah-toh', fr: 'sah-muh-DEE' } },
        { hebrew: 'היום', en: 'Today', ro: 'Astăzi', it: 'Oggi', fr: 'Aujourd\'hui', pronunciation: { en: 'tuh-DAY', ro: 'ahs-TUH-zee', it: 'OHJ-jee', fr: 'oh-zhoor-DWEE' } },
        { hebrew: 'מחר', en: 'Tomorrow', ro: 'Mâine', it: 'Domani', fr: 'Demain', pronunciation: { en: 'tuh-MOR-oh', ro: 'MUH-ee-neh', it: 'doh-MAH-nee', fr: 'duh-MAN' } },
        { hebrew: 'אתמול', en: 'Yesterday', ro: 'Ieri', it: 'Ieri', fr: 'Hier', pronunciation: { en: 'YES-ter-day', ro: 'YEH-ree', it: 'YEH-ree', fr: 'yehr' } },
      ],
    },
    חלקי_גוף: {
      title: 'חלקי גוף',
      description: 'ללמוד שמות חלקי הגוף',
      vocabulary: [
        { hebrew: 'ראש', en: 'Head', ro: 'Cap', it: 'Testa', fr: 'Tête', pronunciation: { en: 'hed', ro: 'kahp', it: 'TEHS-tah', fr: 'teht' } },
        { hebrew: 'עין', en: 'Eye', ro: 'Ochi', it: 'Occhio', fr: 'Œil', pronunciation: { en: 'ahy', ro: 'OH-kee', it: 'OHK-kyoh', fr: 'uhy' } },
        { hebrew: 'אוזן', en: 'Ear', ro: 'Ureche', it: 'Orecchio', fr: 'Oreille', pronunciation: { en: 'eer', ro: 'oo-REH-keh', it: 'oh-REHK-kyoh', fr: 'oh-RAY-yuh' } },
        { hebrew: 'אף', en: 'Nose', ro: 'Nas', it: 'Naso', fr: 'Nez', pronunciation: { en: 'nohz', ro: 'nahs', it: 'NAH-zoh', fr: 'nay' } },
        { hebrew: 'פה', en: 'Mouth', ro: 'Gură', it: 'Bocca', fr: 'Bouche', pronunciation: { en: 'mowth', ro: 'GOO-ruh', it: 'BOHK-kah', fr: 'boosh' } },
        { hebrew: 'יד', en: 'Hand', ro: 'Mână', it: 'Mano', fr: 'Main', pronunciation: { en: 'hand', ro: 'MUH-nuh', it: 'MAH-noh', fr: 'man' } },
        { hebrew: 'רגל', en: 'Leg', ro: 'Picior', it: 'Gamba', fr: 'Jambe', pronunciation: { en: 'leg', ro: 'pee-CHOHR', it: 'GAHM-bah', fr: 'zhahmb' } },
        { hebrew: 'ברך', en: 'Knee', ro: 'Genunchi', it: 'Ginocchio', fr: 'Genou', pronunciation: { en: 'nee', ro: 'jeh-NOON-kee', it: 'jee-NOHK-kyoh', fr: 'zhuh-NOO' } },
        { hebrew: 'כתף', en: 'Shoulder', ro: 'Umăr', it: 'Spalla', fr: 'Épaule', pronunciation: { en: 'SHOHL-der', ro: 'OO-muhr', it: 'SPAHL-lah', fr: 'ay-POHL' } },
        { hebrew: 'גב', en: 'Back', ro: 'Spate', it: 'Schiena', fr: 'Dos', pronunciation: { en: 'bak', ro: 'SPAH-teh', it: 'SKYEH-nah', fr: 'dohs' } },
        { hebrew: 'לב', en: 'Heart', ro: 'Inimă', it: 'Cuore', fr: 'Cœur', pronunciation: { en: 'hahrt', ro: 'ee-NEE-muh', it: 'KWOH-reh', fr: 'kuhr' } },
        { hebrew: 'שיער', en: 'Hair', ro: 'Păr', it: 'Capelli', fr: 'Cheveux', pronunciation: { en: 'hair', ro: 'puhr', it: 'kah-PEHL-lee', fr: 'shuh-VUH' } },
      ],
    },
    בגדים: {
      title: 'בגדים ואופנה',
      description: 'ללמוד שמות בגדים',
      vocabulary: [
        { hebrew: 'חולצה', en: 'Shirt', ro: 'Cămașă', it: 'Camicia', fr: 'Chemise', pronunciation: { en: 'shurt', ro: 'kuh-MAH-shuh', it: 'kah-MEE-chah', fr: 'shuh-MEEZ' } },
        { hebrew: 'מכנסיים', en: 'Pants', ro: 'Pantaloni', it: 'Pantaloni', fr: 'Pantalon', pronunciation: { en: 'pants', ro: 'pahn-tah-LOH-nee', it: 'pahn-tah-LOH-nee', fr: 'pahn-tah-LOHN' } },
        { hebrew: 'שמלה', en: 'Dress', ro: 'Rochiă', it: 'Vestito', fr: 'Robe', pronunciation: { en: 'dres', ro: 'ROH-kee-uh', it: 'vehs-TEE-toh', fr: 'rohb' } },
        { hebrew: 'נעליים', en: 'Shoes', ro: 'Pantofi', it: 'Scarpe', fr: 'Chaussures', pronunciation: { en: 'shooz', ro: 'pahn-TOH-fee', it: 'SKAHR-peh', fr: 'shoh-SOOR' } },
        { hebrew: 'כובע', en: 'Hat', ro: 'Pălărie', it: 'Cappello', fr: 'Chapeau', pronunciation: { en: 'hat', ro: 'puh-luh-REE-eh', it: 'kahp-PEHL-loh', fr: 'shah-POH' } },
        { hebrew: 'ג\'קט', en: 'Jacket', ro: 'Jachetă', it: 'Giacca', fr: 'Veste', pronunciation: { en: 'JAK-it', ro: 'zhah-KEH-tuh', it: 'JAHK-kah', fr: 'vehst' } },
        { hebrew: 'שעון', en: 'Watch', ro: 'Ceas', it: 'Orologio', fr: 'Montre', pronunciation: { en: 'woch', ro: 'chahs', it: 'oh-roh-LOH-joh', fr: 'mohntr' } },
        { hebrew: 'תיק', en: 'Bag', ro: 'Geantă', it: 'Borsa', fr: 'Sac', pronunciation: { en: 'bag', ro: 'zhahn-TUH', it: 'BOR-sah', fr: 'sahk' } },
        { hebrew: 'גרביים', en: 'Socks', ro: 'Ciorapi', it: 'Calzini', fr: 'Chaussettes', pronunciation: { en: 'soks', ro: 'choh-RAH-pee', it: 'kahl-TSEE-nee', fr: 'shoh-SEHT' } },
        { hebrew: 'עניבה', en: 'Tie', ro: 'Cravată', it: 'Cravatta', fr: 'Cravate', pronunciation: { en: 'tahy', ro: 'krah-VAH-tuh', it: 'krah-VAHT-tah', fr: 'krah-VAHT' } },
      ],
    },
    מזג_אוויר: {
      title: 'מזג אוויר',
      description: 'ללמוד מילים הקשורות למזג אוויר',
      vocabulary: [
        { hebrew: 'שמש', en: 'Sun', ro: 'Soare', it: 'Sole', fr: 'Soleil', pronunciation: { en: 'suhn', ro: 'SWAH-reh', it: 'SOH-leh', fr: 'soh-LAY' } },
        { hebrew: 'גשם', en: 'Rain', ro: 'Ploaie', it: 'Pioggia', fr: 'Pluie', pronunciation: { en: 'rayn', ro: 'PLOY-eh', it: 'PYOHJ-jah', fr: 'plwee' } },
        { hebrew: 'שלג', en: 'Snow', ro: 'Zăpadă', it: 'Neve', fr: 'Neige', pronunciation: { en: 'snoh', ro: 'zuh-PAH-duh', it: 'NEH-veh', fr: 'nehzh' } },
        { hebrew: 'רוח', en: 'Wind', ro: 'Vânt', it: 'Vento', fr: 'Vent', pronunciation: { en: 'wind', ro: 'vuhnt', it: 'VEHN-toh', fr: 'vahn' } },
        { hebrew: 'ענן', en: 'Cloud', ro: 'Nor', it: 'Nuvola', fr: 'Nuage', pronunciation: { en: 'klowd', ro: 'nohr', it: 'NOO-voh-lah', fr: 'nwahzh' } },
        { hebrew: 'חם', en: 'Hot', ro: 'Cald', it: 'Caldo', fr: 'Chaud', pronunciation: { en: 'hot', ro: 'kahld', it: 'KAHL-doh', fr: 'shoh' } },
        { hebrew: 'קר', en: 'Cold', ro: 'Rece', it: 'Freddo', fr: 'Froid', pronunciation: { en: 'kohld', ro: 'REH-cheh', it: 'FREHD-doh', fr: 'frwah' } },
        { hebrew: 'חמים', en: 'Warm', ro: 'Călduț', it: 'Caldo', fr: 'Chaud', pronunciation: { en: 'wawrm', ro: 'kuhl-DOOTS', it: 'KAHL-doh', fr: 'shoh' } },
        { hebrew: 'מעונן', en: 'Cloudy', ro: 'Înnorat', it: 'Nuvoloso', fr: 'Nuageux', pronunciation: { en: 'KLOW-dee', ro: 'uhn-noh-RAHT', it: 'noo-voh-LOH-soh', fr: 'nwah-ZHUH' } },
        { hebrew: 'בהיר', en: 'Bright', ro: 'Luminos', it: 'Luminoso', fr: 'Lumineux', pronunciation: { en: 'brahyt', ro: 'loo-mee-NOHS', it: 'loo-mee-NOH-soh', fr: 'loo-mee-NUH' } },
      ],
    },
    פעלים: {
      title: 'פעלים בסיסיים',
      description: 'ללמוד פעלים שימושיים',
      vocabulary: [
        { hebrew: 'ללכת', en: 'To walk', ro: 'A merge', it: 'Camminare', fr: 'Marcher', pronunciation: { en: 'tu wawk', ro: 'ah MEHR-jeh', it: 'kahm-mee-NAH-reh', fr: 'mahr-SHAY' } },
        { hebrew: 'לרוץ', en: 'To run', ro: 'A alerga', it: 'Correre', fr: 'Courir', pronunciation: { en: 'tu ruhn', ro: 'ah ah-lehr-GAH', it: 'kohr-REH-reh', fr: 'koo-REER' } },
        { hebrew: 'לאכול', en: 'To eat', ro: 'A mânca', it: 'Mangiare', fr: 'Manger', pronunciation: { en: 'tu eet', ro: 'ah muhn-KAH', it: 'mahn-JAH-reh', fr: 'mahn-ZHAY' } },
        { hebrew: 'לשתות', en: 'To drink', ro: 'A bea', it: 'Bere', fr: 'Boire', pronunciation: { en: 'tu drink', ro: 'ah BEH-ah', it: 'BEH-reh', fr: 'bwahr' } },
        { hebrew: 'לישון', en: 'To sleep', ro: 'A dormi', it: 'Dormire', fr: 'Dormir', pronunciation: { en: 'tu sleep', ro: 'ah dohr-MEE', it: 'dohr-MEE-reh', fr: 'dohr-MEER' } },
        { hebrew: 'לקרוא', en: 'To read', ro: 'A citi', it: 'Leggere', fr: 'Lire', pronunciation: { en: 'tu reed', ro: 'ah chee-TEE', it: 'LEHD-jeh-reh', fr: 'leer' } },
        { hebrew: 'לכתוב', en: 'To write', ro: 'A scrie', it: 'Scrivere', fr: 'Écrire', pronunciation: { en: 'tu rahyt', ro: 'ah SKREE-eh', it: 'SKREE-veh-reh', fr: 'ay-KREER' } },
        { hebrew: 'לדבר', en: 'To speak', ro: 'A vorbi', it: 'Parlare', fr: 'Parler', pronunciation: { en: 'tu speek', ro: 'ah vohr-BEE', it: 'pahr-LAH-reh', fr: 'pahr-LAY' } },
        { hebrew: 'לשמוע', en: 'To hear', ro: 'A auzi', it: 'Sentire', fr: 'Entendre', pronunciation: { en: 'tu heer', ro: 'ah ah-OO-zee', it: 'sehn-TEE-reh', fr: 'ahn-TAHN-druh' } },
        { hebrew: 'לראות', en: 'To see', ro: 'A vedea', it: 'Vedere', fr: 'Voir', pronunciation: { en: 'tu see', ro: 'ah veh-DEH-ah', it: 'veh-DEH-reh', fr: 'vwahr' } },
        { hebrew: 'לחשוב', en: 'To think', ro: 'A gândi', it: 'Pensare', fr: 'Penser', pronunciation: { en: 'tu thingk', ro: 'ah guhn-DEE', it: 'pehn-SAH-reh', fr: 'pahn-SAY' } },
        { hebrew: 'לאהוב', en: 'To love', ro: 'A iubi', it: 'Amare', fr: 'Aimer', pronunciation: { en: 'tu luhv', ro: 'ah yoo-BEE', it: 'ah-MAH-reh', fr: 'ay-MAY' } },
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
        { hebrew: 'דרכון', en: 'Passport', ro: 'Pașaport', it: 'Passaporto', fr: 'Passeport', pronunciation: { en: 'PAS-port', ro: 'pah-shah-PORT', it: 'pahs-sah-POR-toh', fr: 'pahs-POR' } },
        { hebrew: 'ויזה', en: 'Visa', ro: 'Viză', it: 'Visto', fr: 'Visa', pronunciation: { en: 'VEE-zuh', ro: 'VEE-zuh', it: 'VEE-stoh', fr: 'VEE-zah' } },
        { hebrew: 'תייר', en: 'Tourist', ro: 'Turist', it: 'Turista', fr: 'Touriste', pronunciation: { en: 'TOOR-ist', ro: 'too-REEST', it: 'too-REE-stah', fr: 'too-REEST' } },
        { hebrew: 'טיול', en: 'Trip', ro: 'Excursie', it: 'Gita', fr: 'Voyage', pronunciation: { en: 'trip', ro: 'ehk-SKOOR-see-eh', it: 'JEE-tah', fr: 'vwah-YAHZH' } },
        { hebrew: 'חופשה', en: 'Vacation', ro: 'Vacanță', it: 'Vacanza', fr: 'Vacances', pronunciation: { en: 'vay-KAY-shun', ro: 'vah-KAHN-tsuh', it: 'vah-KAHN-zah', fr: 'vah-KAHNS' } },
        { hebrew: 'חוף', en: 'Beach', ro: 'Plajă', it: 'Spiaggia', fr: 'Plage', pronunciation: { en: 'beech', ro: 'PLAH-zhuh', it: 'SPYAHJ-jah', fr: 'plahzh' } },
        { hebrew: 'מוזיאון', en: 'Museum', ro: 'Muzeu', it: 'Museo', fr: 'Musée', pronunciation: { en: 'myoo-ZEE-um', ro: 'moo-ZEH-oo', it: 'moo-ZEH-oh', fr: 'moo-ZAY' } },
        { hebrew: 'אטרקציה', en: 'Attraction', ro: 'Atracție', it: 'Attrazione', fr: 'Attraction', pronunciation: { en: 'uh-TRAK-shun', ro: 'ah-TRAHK-tsee-eh', it: 'aht-traht-TSYOH-neh', fr: 'ah-trahk-SYOHN' } },
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
        { hebrew: 'דלת', en: 'Door', ro: 'Ușă', it: 'Porta', fr: 'Porte', pronunciation: { en: 'dor', ro: 'OO-shuh', it: 'POR-tah', fr: 'port' } },
        { hebrew: 'מיטה', en: 'Bed', ro: 'Pat', it: 'Letto', fr: 'Lit', pronunciation: { en: 'bed', ro: 'paht', it: 'LEHT-toh', fr: 'lee' } },
        { hebrew: 'כרית', en: 'Pillow', ro: 'Pernă', it: 'Cuscino', fr: 'Oreiller', pronunciation: { en: 'PIL-oh', ro: 'PEHR-nuh', it: 'koo-SHEE-noh', fr: 'oh-ray-YAY' } },
        { hebrew: 'שמיכה', en: 'Blanket', ro: 'Pătură', it: 'Coperta', fr: 'Couverture', pronunciation: { en: 'BLANG-kit', ro: 'puh-TOO-ruh', it: 'koh-PEHR-tah', fr: 'koo-vehr-TOOR' } },
        { hebrew: 'מנורה', en: 'Lamp', ro: 'Lampă', it: 'Lampada', fr: 'Lampe', pronunciation: { en: 'lamp', ro: 'LAHM-puh', it: 'LAHM-pah-dah', fr: 'lahmp' } },
        { hebrew: 'טלוויזיה', en: 'Television', ro: 'Televizor', it: 'Televisore', fr: 'Télévision', pronunciation: { en: 'TEL-uh-vizh-un', ro: 'teh-leh-vee-ZOHR', it: 'teh-leh-vee-ZOH-reh', fr: 'tay-lay-vee-ZYOHN' } },
        { hebrew: 'מקרר', en: 'Refrigerator', ro: 'Frigider', it: 'Frigorifero', fr: 'Réfrigérateur', pronunciation: { en: 'ri-FRIJ-uh-rey-ter', ro: 'free-jee-DEHR', it: 'free-goh-REE-feh-roh', fr: 'ray-free-zhay-rah-TUHR' } },
        { hebrew: 'תנור', en: 'Oven', ro: 'Cuptor', it: 'Forno', fr: 'Four', pronunciation: { en: 'UHV-en', ro: 'koop-TOHR', it: 'FOR-noh', fr: 'foor' } },
        { hebrew: 'מכונת כביסה', en: 'Washing machine', ro: 'Mașină de spălat', it: 'Lavatrice', fr: 'Lave-linge', pronunciation: { en: 'WOSH-ing muh-SHEEN', ro: 'mah-SHEE-nuh deh spuh-LAHT', it: 'lah-vah-TREE-cheh', fr: 'lahv-LANZH' } },
        { hebrew: 'מגבת', en: 'Towel', ro: 'Prosop', it: 'Asciugamano', fr: 'Serviette', pronunciation: { en: 'TOW-ul', ro: 'proh-SOHP', it: 'ah-shoo-gah-MAH-noh', fr: 'sehr-VYET' } },
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
        { hebrew: 'מזומן', en: 'Cash', ro: 'Numerar', it: 'Contanti', fr: 'Espèces', pronunciation: { en: 'kash', ro: 'noo-meh-RAHR', it: 'kohn-TAHN-tee', fr: 'ehs-PEHS' } },
        { hebrew: 'כרטיס אשראי', en: 'Credit card', ro: 'Card de credit', it: 'Carta di credito', fr: 'Carte de crédit', pronunciation: { en: 'KRED-it kard', ro: 'kahrd deh KREH-deet', it: 'KAHR-tah dee KREH-dee-toh', fr: 'kahrt duh kray-DEE' } },
        { hebrew: 'עגלת קניות', en: 'Shopping cart', ro: 'Coș de cumpărături', it: 'Carrello', fr: 'Panier', pronunciation: { en: 'SHOP-ing kahrt', ro: 'kohsh deh koom-puh-ruh-TOO-ree', it: 'kahr-REHL-loh', fr: 'pah-NYAY' } },
        { hebrew: 'קופאית', en: 'Cashier', ro: 'Casier', it: 'Cassiere', fr: 'Caissier', pronunciation: { en: 'kash-EER', ro: 'kah-SYEHR', it: 'kahs-SYEH-reh', fr: 'kay-SYAY' } },
        { hebrew: 'קבלה', en: 'Receipt', ro: 'Bon', it: 'Scontrino', fr: 'Reçu', pronunciation: { en: 'ri-SEET', ro: 'bohn', it: 'skohn-TREE-noh', fr: 'ruh-SOO' } },
        { hebrew: 'שוק', en: 'Market', ro: 'Piață', it: 'Mercato', fr: 'Marché', pronunciation: { en: 'MAR-ket', ro: 'PYAH-tsuh', it: 'mehr-KAH-toh', fr: 'mahr-SHAY' } },
        { hebrew: 'סופרמרקט', en: 'Supermarket', ro: 'Supermarket', it: 'Supermercato', fr: 'Supermarché', pronunciation: { en: 'SOO-per-mar-ket', ro: 'soo-per-MAHR-ket', it: 'soo-per-mehr-KAH-toh', fr: 'soo-per-mahr-SHAY' } },
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
        { hebrew: 'חולה', en: 'Sick', ro: 'Bolnav', it: 'Malato', fr: 'Malade', pronunciation: { en: 'sik', ro: 'bohl-NAHV', it: 'mah-LAH-toh', fr: 'mah-LAHD' } },
        { hebrew: 'חום', en: 'Fever', ro: 'Febră', it: 'Febbre', fr: 'Fièvre', pronunciation: { en: 'FEE-ver', ro: 'FEH-bruh', it: 'FEHB-breh', fr: 'fee-EHV-ruh' } },
        { hebrew: 'טיפול', en: 'Treatment', ro: 'Tratament', it: 'Trattamento', fr: 'Traitement', pronunciation: { en: 'TREET-ment', ro: 'trah-tah-MENT', it: 'traht-tah-MEN-toh', fr: 'trayt-MAHN' } },
        { hebrew: 'בדיקה', en: 'Examination', ro: 'Examinare', it: 'Visita', fr: 'Examen', pronunciation: { en: 'ig-zam-uh-NAY-shun', ro: 'ehk-sah-mee-NAH-reh', it: 'vee-ZEE-tah', fr: 'ehg-zah-MAHN' } },
        { hebrew: 'אחות', en: 'Nurse', ro: 'Asistent medical', it: 'Infermiera', fr: 'Infirmière', pronunciation: { en: 'nurs', ro: 'ah-sees-TENT meh-dee-KAHL', it: 'een-fehr-MYEH-rah', fr: 'an-feer-MYEHR' } },
        { hebrew: 'רופא שיניים', en: 'Dentist', ro: 'Dentist', it: 'Dentista', fr: 'Dentiste', pronunciation: { en: 'DEN-tist', ro: 'dehn-TEEST', it: 'dehn-TEE-stah', fr: 'dahn-TEEST' } },
        { hebrew: 'תרופת שיעול', en: 'Cough medicine', ro: 'Medicament pentru tuse', it: 'Sciroppo per la tosse', fr: 'Médicament contre la toux', pronunciation: { en: 'kawf MED-i-sin', ro: 'meh-dee-kah-MENT pehn-troo TOO-seh', it: 'shy-ROHP-poh pehr lah TOHS-seh', fr: 'may-dee-kah-MAHN kohntr lah too' } },
        { hebrew: 'פלסטר', en: 'Bandage', ro: 'Bandaj', it: 'Benda', fr: 'Pansement', pronunciation: { en: 'BAN-dij', ro: 'bahn-DAHZH', it: 'BEHN-dah', fr: 'pahns-MAHN' } },
      ],
    },
    תחבורה: {
      title: 'תחבורה ונסיעות',
      description: 'מילים הקשורות לתחבורה',
      vocabulary: [
        { hebrew: 'מכונית', en: 'Car', ro: 'Mașină', it: 'Macchina', fr: 'Voiture', pronunciation: { en: 'kahr', ro: 'mah-SHEE-nuh', it: 'MAHK-kee-nah', fr: 'vwah-TOOR' } },
        { hebrew: 'אוטובוס', en: 'Bus', ro: 'Autobuz', it: 'Autobus', fr: 'Bus', pronunciation: { en: 'buhs', ro: 'ah-oo-toh-BOOZ', it: 'ah-oo-TOH-boos', fr: 'boos' } },
        { hebrew: 'רכבת', en: 'Train', ro: 'Tren', it: 'Treno', fr: 'Train', pronunciation: { en: 'trayn', ro: 'trehn', it: 'TREH-noh', fr: 'tran' } },
        { hebrew: 'מטוס', en: 'Airplane', ro: 'Avion', it: 'Aereo', fr: 'Avion', pronunciation: { en: 'AIR-playn', ro: 'ah-vee-OHN', it: 'ah-EH-reh-oh', fr: 'ah-vee-OHN' } },
        { hebrew: 'אופניים', en: 'Bicycle', ro: 'Bicicletă', it: 'Bicicletta', fr: 'Vélo', pronunciation: { en: 'BY-sik-ul', ro: 'bee-chee-KLEH-tuh', it: 'bee-chee-KLEHT-tah', fr: 'vay-LOH' } },
        { hebrew: 'חניה', en: 'Parking', ro: 'Parcare', it: 'Parcheggio', fr: 'Parking', pronunciation: { en: 'PAHR-king', ro: 'pahr-KAH-reh', it: 'pahr-KEHD-joh', fr: 'pahr-KEENG' } },
        { hebrew: 'דלק', en: 'Gas', ro: 'Benzină', it: 'Benzina', fr: 'Essence', pronunciation: { en: 'gas', ro: 'behn-ZEE-nuh', it: 'behn-ZEE-nah', fr: 'eh-SAHNS' } },
        { hebrew: 'כביש', en: 'Road', ro: 'Drum', it: 'Strada', fr: 'Route', pronunciation: { en: 'rohd', ro: 'droom', it: 'STRAH-dah', fr: 'root' } },
        { hebrew: 'גשר', en: 'Bridge', ro: 'Pod', it: 'Ponte', fr: 'Pont', pronunciation: { en: 'brij', ro: 'pohd', it: 'POHN-teh', fr: 'pohn' } },
        { hebrew: 'תחנה', en: 'Station', ro: 'Stație', it: 'Stazione', fr: 'Gare', pronunciation: { en: 'STAY-shun', ro: 'STAH-tsee-eh', it: 'stah-TSYOH-neh', fr: 'gahr' } },
      ],
    },
    ספורט: {
      title: 'ספורט ופעילות גופנית',
      description: 'מילים הקשורות לספורט',
      vocabulary: [
        { hebrew: 'כדורגל', en: 'Football', ro: 'Fotbal', it: 'Calcio', fr: 'Football', pronunciation: { en: 'FOOT-bawl', ro: 'foht-BAHL', it: 'KAHL-choh', fr: 'foot-BAHL' } },
        { hebrew: 'כדורסל', en: 'Basketball', ro: 'Baschet', it: 'Pallacanestro', fr: 'Basket-ball', pronunciation: { en: 'BAS-kit-bawl', ro: 'bahsh-KET', it: 'pahl-lah-kah-NEHS-troh', fr: 'bahs-ket-BAHL' } },
        { hebrew: 'שחייה', en: 'Swimming', ro: 'Înot', it: 'Nuoto', fr: 'Natation', pronunciation: { en: 'SWIM-ing', ro: 'uh-NOHT', it: 'NWAH-toh', fr: 'nah-tah-SYOHN' } },
        { hebrew: 'ריצה', en: 'Running', ro: 'Alergare', it: 'Corsa', fr: 'Course', pronunciation: { en: 'RUHN-ing', ro: 'ah-lehr-GAH-reh', it: 'KOR-sah', fr: 'koors' } },
        { hebrew: 'אימון', en: 'Training', ro: 'Antrenament', it: 'Allenamento', fr: 'Entraînement', pronunciation: { en: 'TRAYN-ing', ro: 'ahn-treh-nah-MENT', it: 'ahl-leh-nah-MEN-toh', fr: 'ahn-trayn-MAHN' } },
        { hebrew: 'משחק', en: 'Game', ro: 'Joc', it: 'Gioco', fr: 'Jeu', pronunciation: { en: 'gaym', ro: 'zhohk', it: 'JOH-koh', fr: 'zhuh' } },
        { hebrew: 'שחקן', en: 'Player', ro: 'Jucător', it: 'Giocatore', fr: 'Joueur', pronunciation: { en: 'PLAY-er', ro: 'zhoo-KUH-tohr', it: 'joh-kah-TOH-reh', fr: 'zhoo-UHR' } },
        { hebrew: 'קבוצה', en: 'Team', ro: 'Echipă', it: 'Squadra', fr: 'Équipe', pronunciation: { en: 'teem', ro: 'eh-KEE-puh', it: 'SKWAH-drah', fr: 'ay-KEEP' } },
        { hebrew: 'ניצחון', en: 'Victory', ro: 'Victorie', it: 'Vittoria', fr: 'Victoire', pronunciation: { en: 'VIK-tuh-ree', ro: 'veek-TOH-ree-eh', it: 'veet-TOH-ree-ah', fr: 'veek-TWAHR' } },
        { hebrew: 'הפסד', en: 'Defeat', ro: 'Înfrângere', it: 'Sconfitta', fr: 'Défaite', pronunciation: { en: 'di-FEET', ro: 'uhn-fruhn-JEH-reh', it: 'skohn-FEET-tah', fr: 'day-FEHT' } },
      ],
    },
    לימודים: {
      title: 'לימודים וחינוך',
      description: 'מילים הקשורות ללימודים',
      vocabulary: [
        { hebrew: 'בית ספר', en: 'School', ro: 'Școală', it: 'Scuola', fr: 'École', pronunciation: { en: 'skool', ro: 'shkoh-AH-luh', it: 'SKWOH-lah', fr: 'ay-KOHL' } },
        { hebrew: 'מורה', en: 'Teacher', ro: 'Profesor', it: 'Insegnante', fr: 'Professeur', pronunciation: { en: 'TEE-cher', ro: 'proh-feh-SOHR', it: 'een-sehn-YAHN-teh', fr: 'proh-feh-SUHR' } },
        { hebrew: 'תלמיד', en: 'Student', ro: 'Elev', it: 'Studente', fr: 'Étudiant', pronunciation: { en: 'STOO-dent', ro: 'eh-LEHV', it: 'stoo-DEHN-teh', fr: 'ay-too-DYAHN' } },
        { hebrew: 'כיתה', en: 'Classroom', ro: 'Sala de clasă', it: 'Aula', fr: 'Salle de classe', pronunciation: { en: 'KLAS-room', ro: 'SAH-lah deh KLAH-suh', it: 'AH-oo-lah', fr: 'sahl duh klahs' } },
        { hebrew: 'ספר', en: 'Book', ro: 'Carte', it: 'Libro', fr: 'Livre', pronunciation: { en: 'book', ro: 'KAHR-teh', it: 'LEE-broh', fr: 'leevr' } },
        { hebrew: 'עפרון', en: 'Pencil', ro: 'Cremalieră', it: 'Matita', fr: 'Crayon', pronunciation: { en: 'PEN-sul', ro: 'kreh-mah-LYEH-ruh', it: 'mah-TEE-tah', fr: 'kray-OHN' } },
        { hebrew: 'מחברת', en: 'Notebook', ro: 'Caiet', it: 'Quaderno', fr: 'Cahier', pronunciation: { en: 'NOHT-book', ro: 'kah-YET', it: 'kwah-DEHR-noh', fr: 'kah-YAY' } },
        { hebrew: 'מבחן', en: 'Exam', ro: 'Examen', it: 'Esame', fr: 'Examen', pronunciation: { en: 'ig-ZAM', ro: 'ehk-SAH-mehn', it: 'eh-SAH-meh', fr: 'ehg-zah-MAHN' } },
        { hebrew: 'שיעורי בית', en: 'Homework', ro: 'Temă', it: 'Compiti', fr: 'Devoirs', pronunciation: { en: 'HOHM-wurk', ro: 'TEH-muh', it: 'KOHM-pee-tee', fr: 'duh-VWAHR' } },
        { hebrew: 'אוניברסיטה', en: 'University', ro: 'Universitate', it: 'Università', fr: 'Université', pronunciation: { en: 'yoo-nuh-VUR-si-tee', ro: 'oo-nee-vehr-see-TAH-teh', it: 'oo-nee-vehr-see-TAH', fr: 'oo-nee-vehr-see-TAY' } },
        { hebrew: 'תואר', en: 'Degree', ro: 'Diplomă', it: 'Laurea', fr: 'Diplôme', pronunciation: { en: 'di-GREE', ro: 'dee-PLOH-muh', it: 'LAH-oo-reh-ah', fr: 'dee-PLOHM' } },
        { hebrew: 'שיעור', en: 'Lesson', ro: 'Lecție', it: 'Lezione', fr: 'Leçon', pronunciation: { en: 'LES-un', ro: 'LEHK-tsee-eh', it: 'leh-TSYOH-neh', fr: 'luh-SOHN' } },
      ],
    },
    מקצועות: {
      title: 'מקצועות ועבודה',
      description: 'ללמוד שמות מקצועות',
      vocabulary: [
        { hebrew: 'רופא', en: 'Doctor', ro: 'Doctor', it: 'Dottore', fr: 'Docteur', pronunciation: { en: 'DOK-ter', ro: 'dohk-TOHR', it: 'doht-TOH-reh', fr: 'dohk-TUHR' } },
        { hebrew: 'מורה', en: 'Teacher', ro: 'Profesor', it: 'Insegnante', fr: 'Professeur', pronunciation: { en: 'TEE-cher', ro: 'proh-feh-SOHR', it: 'een-sehn-YAHN-teh', fr: 'proh-feh-SUHR' } },
        { hebrew: 'מהנדס', en: 'Engineer', ro: 'Inginer', it: 'Ingegnere', fr: 'Ingénieur', pronunciation: { en: 'en-juh-NEER', ro: 'een-jee-NEHR', it: 'een-jehn-YEH-reh', fr: 'an-zhay-NYUHR' } },
        { hebrew: 'טבח', en: 'Chef', ro: 'Bucătar', it: 'Chef', fr: 'Chef', pronunciation: { en: 'shef', ro: 'boo-kuh-TAHR', it: 'shef', fr: 'shef' } },
        { hebrew: 'עורך דין', en: 'Lawyer', ro: 'Avocat', it: 'Avvocato', fr: 'Avocat', pronunciation: { en: 'LOY-er', ro: 'ah-voh-KAHT', it: 'ahv-voh-KAH-toh', fr: 'ah-voh-KAH' } },
        { hebrew: 'אדריכל', en: 'Architect', ro: 'Arhitect', it: 'Architetto', fr: 'Architecte', pronunciation: { en: 'AHR-ki-tekt', ro: 'ahr-hee-TEKT', it: 'ahr-kee-TEHT-toh', fr: 'ahr-shee-TEHT' } },
        { hebrew: 'חשבונאי', en: 'Accountant', ro: 'Contabil', it: 'Contabile', fr: 'Comptable', pronunciation: { en: 'uh-KOWN-tent', ro: 'kohn-TAH-beel', it: 'kohn-TAH-bee-leh', fr: 'kohn-TAH-bluh' } },
        { hebrew: 'פקח', en: 'Policeman', ro: 'Polițist', it: 'Poliziotto', fr: 'Policier', pronunciation: { en: 'puh-LEES-muhn', ro: 'poh-lee-TSEEST', it: 'poh-lee-TSYOHT-toh', fr: 'poh-lee-SYAY' } },
        { hebrew: 'כבאי', en: 'Firefighter', ro: 'Pompier', it: 'Vigile del fuoco', fr: 'Pompier', pronunciation: { en: 'FAHYR-fahy-ter', ro: 'pohm-PYEHR', it: 'VEE-jee-leh dehl FWOH-koh', fr: 'pohm-PYAY' } },
        { hebrew: 'אח', en: 'Nurse', ro: 'Asistent medical', it: 'Infermiere', fr: 'Infirmier', pronunciation: { en: 'nurs', ro: 'ah-sees-TENT meh-dee-KAHL', it: 'een-fehr-MYEH-reh', fr: 'an-feer-MYAY' } },
        { hebrew: 'ספר', en: 'Hairdresser', ro: 'Frizer', it: 'Parrucchiere', fr: 'Coiffeur', pronunciation: { en: 'HAIR-dres-er', ro: 'free-ZEHR', it: 'pahr-rook-KYEH-reh', fr: 'kwah-FUHR' } },
        { hebrew: 'נהג', en: 'Driver', ro: 'Șofer', it: 'Autista', fr: 'Chauffeur', pronunciation: { en: 'DRAHY-ver', ro: 'shoh-FEHR', it: 'ah-oo-TEE-stah', fr: 'shoh-FUHR' } },
      ],
    },
    בישול: {
      title: 'בישול ומטבח',
      description: 'מילים הקשורות לבישול',
      vocabulary: [
        { hebrew: 'לבשל', en: 'To cook', ro: 'A găti', it: 'Cucinare', fr: 'Cuire', pronunciation: { en: 'tu kook', ro: 'ah guh-TEE', it: 'koo-chee-NAH-reh', fr: 'kweer' } },
        { hebrew: 'לאפות', en: 'To bake', ro: 'A coace', it: 'Cuocere', fr: 'Cuire au four', pronunciation: { en: 'tu bayk', ro: 'ah KWAH-cheh', it: 'KWOH-cheh-reh', fr: 'kweer oh foor' } },
        { hebrew: 'לחתוך', en: 'To cut', ro: 'A tăia', it: 'Tagliare', fr: 'Couper', pronunciation: { en: 'tu kuht', ro: 'ah tuh-EE-ah', it: 'tah-LYAH-reh', fr: 'koo-PAY' } },
        { hebrew: 'לערבב', en: 'To mix', ro: 'A amesteca', it: 'Mescolare', fr: 'Mélanger', pronunciation: { en: 'tu miks', ro: 'ah ah-mehs-TEH-kah', it: 'mehs-koh-LAH-reh', fr: 'may-lahn-ZHAY' } },
        { hebrew: 'לטגן', en: 'To fry', ro: 'A prăji', it: 'Friggere', fr: 'Frire', pronunciation: { en: 'tu frahy', ro: 'ah pruh-ZHEE', it: 'FREE-jeh-reh', fr: 'freer' } },
        { hebrew: 'להרתיח', en: 'To boil', ro: 'A fierbe', it: 'Bollire', fr: 'Bouillir', pronunciation: { en: 'tu boyl', ro: 'ah FYEHR-beh', it: 'bohl-LEE-reh', fr: 'boo-YEER' } },
        { hebrew: 'מלח', en: 'Salt', ro: 'Sare', it: 'Sale', fr: 'Sel', pronunciation: { en: 'sawlt', ro: 'SAH-reh', it: 'SAH-leh', fr: 'sehl' } },
        { hebrew: 'פלפל', en: 'Pepper', ro: 'Piper', it: 'Pepe', fr: 'Poivre', pronunciation: { en: 'PEP-er', ro: 'pee-PEHR', it: 'PEH-peh', fr: 'pwavr' } },
        { hebrew: 'שמן', en: 'Oil', ro: 'Ulei', it: 'Olio', fr: 'Huile', pronunciation: { en: 'oyl', ro: 'oo-LAY', it: 'OH-lyoh', fr: 'weel' } },
        { hebrew: 'סוכר', en: 'Sugar', ro: 'Zahăr', it: 'Zucchero', fr: 'Sucre', pronunciation: { en: 'SHOOG-er', ro: 'ZAH-huhr', it: 'TSOOK-keh-roh', fr: 'sookr' } },
        { hebrew: 'תבלין', en: 'Spice', ro: 'Condiment', it: 'Spezia', fr: 'Épice', pronunciation: { en: 'spahys', ro: 'kohn-dee-MENT', it: 'SPEH-tsee-ah', fr: 'ay-PEES' } },
        { hebrew: 'תבנית', en: 'Pan', ro: 'Tigaie', it: 'Padella', fr: 'Poêle', pronunciation: { en: 'pan', ro: 'tee-GAH-yeh', it: 'pah-DEHL-lah', fr: 'pwahl' } },
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
        { hebrew: 'אב', en: 'Father', ro: 'Tată', it: 'Padre', fr: 'Père', pronunciation: { en: 'FAH-ther', ro: 'TAH-tuh', it: 'PAH-dreh', fr: 'pehr' } },
        { hebrew: 'אם', en: 'Mother', ro: 'Mamă', it: 'Madre', fr: 'Mère', pronunciation: { en: 'MUH-ther', ro: 'MAH-muh', it: 'MAH-dreh', fr: 'mehr' } },
        { hebrew: 'בן', en: 'Son', ro: 'Fiu', it: 'Figlio', fr: 'Fils', pronunciation: { en: 'suhn', ro: 'fee-OO', it: 'FEE-lyoh', fr: 'fees' } },
        { hebrew: 'בת', en: 'Daughter', ro: 'Fiică', it: 'Figlia', fr: 'Fille', pronunciation: { en: 'DAW-ter', ro: 'FEE-kuh', it: 'FEE-lyah', fr: 'feey' } },
        { hebrew: 'דוד', en: 'Uncle', ro: 'Unchi', it: 'Zio', fr: 'Oncle', pronunciation: { en: 'UHNG-kul', ro: 'OON-kee', it: 'TSEE-oh', fr: 'ohnkl' } },
        { hebrew: 'דודה', en: 'Aunt', ro: 'Mătușă', it: 'Zia', fr: 'Tante', pronunciation: { en: 'ant', ro: 'muh-TOO-shuh', it: 'TSEE-ah', fr: 'tahnt' } },
        { hebrew: 'בן דוד', en: 'Cousin', ro: 'Văr', it: 'Cugino', fr: 'Cousin', pronunciation: { en: 'KUHZ-in', ro: 'vuhr', it: 'koo-JEE-noh', fr: 'koo-ZAN' } },
        { hebrew: 'חתן', en: 'Son-in-law', ro: 'Ginere', it: 'Genero', fr: 'Beau-fils', pronunciation: { en: 'suhn in law', ro: 'jee-NEH-reh', it: 'jeh-NEH-roh', fr: 'boh fees' } },
        { hebrew: 'כלה', en: 'Daughter-in-law', ro: 'Nora', it: 'Nuora', fr: 'Belle-fille', pronunciation: { en: 'DAW-ter in law', ro: 'NOH-rah', it: 'NWOH-rah', fr: 'behl feey' } },
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
        { hebrew: 'חוזה', en: 'Contract', ro: 'Contract', it: 'Contratto', fr: 'Contrat', pronunciation: { en: 'KON-trakt', ro: 'kohn-TRAHKT', it: 'kohn-TRAHT-toh', fr: 'kohn-TRAH' } },
        { hebrew: 'מנהל', en: 'Manager', ro: 'Manager', it: 'Manager', fr: 'Gestionnaire', pronunciation: { en: 'MAN-ij-er', ro: 'MAH-nah-jehr', it: 'MAH-nah-jehr', fr: 'zhees-tee-oh-NAIR' } },
        { hebrew: 'מכירה', en: 'Sale', ro: 'Vânzare', it: 'Vendita', fr: 'Vente', pronunciation: { en: 'sayl', ro: 'vuhn-ZAH-reh', it: 'vehn-DEE-tah', fr: 'vahnt' } },
        { hebrew: 'קנייה', en: 'Purchase', ro: 'Cumpărare', it: 'Acquisto', fr: 'Achat', pronunciation: { en: 'PUR-chis', ro: 'koom-puh-RAH-reh', it: 'ah-KWEE-stoh', fr: 'ah-SHAH' } },
        { hebrew: 'חשבון בנק', en: 'Bank account', ro: 'Cont bancar', it: 'Conto bancario', fr: 'Compte bancaire', pronunciation: { en: 'bangk uh-KOWNT', ro: 'kohnt bahn-KAHR', it: 'KOHN-toh bahn-KAH-ree-oh', fr: 'kohnt bahn-KEHR' } },
        { hebrew: 'הלוואה', en: 'Loan', ro: 'Împrumut', it: 'Prestito', fr: 'Prêt', pronunciation: { en: 'lohn', ro: 'uhm-proo-MOOT', it: 'PREH-stee-toh', fr: 'pray' } },
        { hebrew: 'ריבית', en: 'Interest', ro: 'Dobândă', it: 'Interesse', fr: 'Intérêt', pronunciation: { en: 'IN-ter-ist', ro: 'doh-BUHN-duh', it: 'een-teh-REHS-seh', fr: 'an-tay-RAY' } },
        { hebrew: 'מס', en: 'Tax', ro: 'Impozit', it: 'Tassa', fr: 'Impôt', pronunciation: { en: 'taks', ro: 'eem-poh-ZEET', it: 'TAHS-sah', fr: 'an-POH' } },
        { hebrew: 'משכורת', en: 'Salary', ro: 'Salariu', it: 'Stipendio', fr: 'Salaire', pronunciation: { en: 'SAL-uh-ree', ro: 'sah-LAH-ree-oo', it: 'stee-PEHN-dyoh', fr: 'sah-LEHR' } },
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
        { hebrew: 'מוזיקה', en: 'Music', ro: 'Muzică', it: 'Musica', fr: 'Musique', pronunciation: { en: 'MYOO-zik', ro: 'moo-ZEE-kuh', it: 'MOO-zee-kah', fr: 'moo-ZEEK' } },
        { hebrew: 'שיר', en: 'Song', ro: 'Cântec', it: 'Canzone', fr: 'Chanson', pronunciation: { en: 'sawng', ro: 'kuhn-TEHK', it: 'kahn-ZOH-neh', fr: 'shahn-SOHN' } },
        { hebrew: 'ציור', en: 'Painting', ro: 'Pictură', it: 'Pittura', fr: 'Peinture', pronunciation: { en: 'PAYN-ting', ro: 'peek-TOO-ruh', it: 'peet-TOO-rah', fr: 'pan-TOOR' } },
        { hebrew: 'פסל', en: 'Sculpture', ro: 'Sculptură', it: 'Scultura', fr: 'Sculpture', pronunciation: { en: 'SKUHLP-chur', ro: 'skoolp-TOO-ruh', it: 'skool-TOO-rah', fr: 'skoolp-TOOR' } },
        { hebrew: 'פסטיבל', en: 'Festival', ro: 'Festival', it: 'Festival', fr: 'Festival', pronunciation: { en: 'FES-tuh-vul', ro: 'fehs-tee-VAHL', it: 'fehs-tee-VAHL', fr: 'fehs-tee-VAHL' } },
      ],
    },
    טכנולוגיה: {
      title: 'טכנולוגיה ומחשבים',
      description: 'מילים הקשורות לטכנולוגיה',
      vocabulary: [
        { hebrew: 'מחשב', en: 'Computer', ro: 'Computer', it: 'Computer', fr: 'Ordinateur', pronunciation: { en: 'kum-PYOO-ter', ro: 'kohm-POO-ter', it: 'kohm-POO-ter', fr: 'or-dee-nah-TUHR' } },
        { hebrew: 'טלפון', en: 'Phone', ro: 'Telefon', it: 'Telefono', fr: 'Téléphone', pronunciation: { en: 'fohn', ro: 'teh-leh-FOHN', it: 'teh-LEH-foh-noh', fr: 'tay-lay-FOHN' } },
        { hebrew: 'אינטרנט', en: 'Internet', ro: 'Internet', it: 'Internet', fr: 'Internet', pronunciation: { en: 'IN-ter-net', ro: 'een-ter-NET', it: 'een-ter-NET', fr: 'an-ter-NET' } },
        { hebrew: 'אימייל', en: 'Email', ro: 'Email', it: 'Email', fr: 'Email', pronunciation: { en: 'EE-mayl', ro: 'eh-MAIL', it: 'eh-MAIL', fr: 'eh-MAIL' } },
        { hebrew: 'אתר', en: 'Website', ro: 'Site', it: 'Sito', fr: 'Site web', pronunciation: { en: 'WEB-sahyt', ro: 'seet', it: 'SEE-toh', fr: 'seet web' } },
        { hebrew: 'תוכנה', en: 'Software', ro: 'Software', it: 'Software', fr: 'Logiciel', pronunciation: { en: 'SAWFT-wair', ro: 'SAWFT-wair', it: 'SAWFT-wair', fr: 'loh-zhee-SYEL' } },
        { hebrew: 'מצלמה', en: 'Camera', ro: 'Cameră', it: 'Fotocamera', fr: 'Appareil photo', pronunciation: { en: 'KAM-er-uh', ro: 'kah-MEH-ruh', it: 'foh-toh-KAH-meh-rah', fr: 'ah-pah-RAY foh-TOH' } },
        { hebrew: 'מקלדת', en: 'Keyboard', ro: 'Tastatură', it: 'Tastiera', fr: 'Clavier', pronunciation: { en: 'KEE-bord', ro: 'tahs-tah-TOO-ruh', it: 'tahs-TYEH-rah', fr: 'klah-VYAY' } },
        { hebrew: 'עכבר', en: 'Mouse', ro: 'Mouse', it: 'Mouse', fr: 'Souris', pronunciation: { en: 'mows', ro: 'mows', it: 'mows', fr: 'soo-REE' } },
        { hebrew: 'מסך', en: 'Screen', ro: 'Ecran', it: 'Schermo', fr: 'Écran', pronunciation: { en: 'skreen', ro: 'eh-KRAHN', it: 'SKEHR-moh', fr: 'ay-KRAHN' } },
      ],
    },
    רגשות: {
      title: 'רגשות ורגשות',
      description: 'ללמוד להביע רגשות',
      vocabulary: [
        { hebrew: 'שמח', en: 'Happy', ro: 'Fericit', it: 'Felice', fr: 'Heureux', pronunciation: { en: 'HAP-ee', ro: 'feh-ree-CHEET', it: 'feh-LEE-cheh', fr: 'uh-RUH' } },
        { hebrew: 'עצוב', en: 'Sad', ro: 'Trist', it: 'Triste', fr: 'Triste', pronunciation: { en: 'sad', ro: 'treest', it: 'TREES-teh', fr: 'treest' } },
        { hebrew: 'כועס', en: 'Angry', ro: 'Furios', it: 'Arrabbiato', fr: 'En colère', pronunciation: { en: 'ANG-gree', ro: 'foo-ree-OHS', it: 'ahr-rahb-BYAH-toh', fr: 'ahn koh-LEHR' } },
        { hebrew: 'מפחד', en: 'Afraid', ro: 'Înfricat', it: 'Pauroso', fr: 'Effrayé', pronunciation: { en: 'uh-FRAYD', ro: 'uhn-free-KAHT', it: 'pah-oo-ROH-soh', fr: 'eh-fray-AY' } },
        { hebrew: 'מופתע', en: 'Surprised', ro: 'Surprins', it: 'Sorpreso', fr: 'Surpris', pronunciation: { en: 'sur-PRAHYZD', ro: 'soor-PREENS', it: 'sor-PREH-zoh', fr: 'soor-PREE' } },
        { hebrew: 'נרגש', en: 'Excited', ro: 'Emoționat', it: 'Emozionato', fr: 'Excité', pronunciation: { en: 'ik-SAHY-ted', ro: 'eh-moh-tsee-oh-NAHT', it: 'eh-moh-tsee-oh-NAH-toh', fr: 'ehk-see-TAY' } },
        { hebrew: 'רגוע', en: 'Calm', ro: 'Calm', it: 'Calmo', fr: 'Calme', pronunciation: { en: 'kahm', ro: 'kahlm', it: 'KAHL-moh', fr: 'kahlm' } },
        { hebrew: 'עצבני', en: 'Nervous', ro: 'Nervos', it: 'Nervoso', fr: 'Nerveux', pronunciation: { en: 'NUR-vus', ro: 'nehr-VOHS', it: 'nehr-VOH-soh', fr: 'nehr-VUH' } },
        { hebrew: 'גאה', en: 'Proud', ro: 'Mândru', it: 'Orgoglioso', fr: 'Fier', pronunciation: { en: 'prowd', ro: 'MUHN-droo', it: 'or-goh-LYOH-soh', fr: 'fyehr' } },
        { hebrew: 'אהבה', en: 'Love', ro: 'Iubire', it: 'Amore', fr: 'Amour', pronunciation: { en: 'luhv', ro: 'yoo-BEE-reh', it: 'ah-MOH-reh', fr: 'ah-MOOR' } },
      ],
    },
    מדע: {
      title: 'מדע וטכנולוגיה',
      description: 'מילים הקשורות למדע',
      vocabulary: [
        { hebrew: 'מדע', en: 'Science', ro: 'Știință', it: 'Scienza', fr: 'Science', pronunciation: { en: 'SAHY-uhns', ro: 'shtee-EEN-tsuh', it: 'SHYEHN-zah', fr: 'syahns' } },
        { hebrew: 'ניסוי', en: 'Experiment', ro: 'Experiment', it: 'Esperimento', fr: 'Expérience', pronunciation: { en: 'ik-SPER-i-ment', ro: 'ehk-speh-ree-MENT', it: 'ehs-peh-ree-MEN-toh', fr: 'ehks-pay-ree-AHNS' } },
        { hebrew: 'מחקר', en: 'Research', ro: 'Cercetare', it: 'Ricerca', fr: 'Recherche', pronunciation: { en: 'ri-SURCH', ro: 'chehr-cheh-TAH-reh', it: 'ree-CHEHR-kah', fr: 'ruh-SHEHRSH' } },
        { hebrew: 'תגלית', en: 'Discovery', ro: 'Descoperire', it: 'Scoperta', fr: 'Découverte', pronunciation: { en: 'di-SKUHV-uh-ree', ro: 'dehs-koh-peh-REE-reh', it: 'skoh-PEHR-tah', fr: 'day-koo-VEHRT' } },
        { hebrew: 'כימיה', en: 'Chemistry', ro: 'Chimie', it: 'Chimica', fr: 'Chimie', pronunciation: { en: 'KEM-uh-stree', ro: 'kee-MEE-eh', it: 'KEE-mee-kah', fr: 'shee-MEE' } },
        { hebrew: 'פיזיקה', en: 'Physics', ro: 'Fizică', it: 'Fisica', fr: 'Physique', pronunciation: { en: 'FIZ-iks', ro: 'fee-ZEE-kuh', it: 'FEE-zee-kah', fr: 'fee-ZEEK' } },
        { hebrew: 'ביולוגיה', en: 'Biology', ro: 'Biologie', it: 'Biologia', fr: 'Biologie', pronunciation: { en: 'bahy-OL-uh-jee', ro: 'bee-oh-loh-JEE-eh', it: 'bee-oh-loh-JEE-ah', fr: 'bee-oh-loh-ZHEE' } },
        { hebrew: 'מתמטיקה', en: 'Mathematics', ro: 'Matematică', it: 'Matematica', fr: 'Mathématiques', pronunciation: { en: 'math-uh-MAT-iks', ro: 'mah-teh-MAH-tee-kuh', it: 'mah-teh-MAH-tee-kah', fr: 'mah-tay-mah-TEEK' } },
        { hebrew: 'אטום', en: 'Atom', ro: 'Atom', it: 'Atomo', fr: 'Atome', pronunciation: { en: 'AT-uhm', ro: 'ah-TOHM', it: 'AH-toh-moh', fr: 'ah-TOHM' } },
        { hebrew: 'אנרגיה', en: 'Energy', ro: 'Energie', it: 'Energia', fr: 'Énergie', pronunciation: { en: 'EN-er-jee', ro: 'eh-nehr-JEE-eh', it: 'eh-nehr-JEE-ah', fr: 'ay-nayr-ZHEE' } },
        { hebrew: 'כוח', en: 'Force', ro: 'Forță', it: 'Forza', fr: 'Force', pronunciation: { en: 'fors', ro: 'FOHR-tsuh', it: 'FOR-tsah', fr: 'fors' } },
        { hebrew: 'טמפרטורה', en: 'Temperature', ro: 'Temperatură', it: 'Temperatura', fr: 'Température', pronunciation: { en: 'TEM-per-uh-chur', ro: 'tehm-peh-rah-TOO-ruh', it: 'tehm-peh-rah-TOO-rah', fr: 'tahn-pay-rah-TOOR' } },
      ],
    },
    טבע: {
      title: 'טבע וסביבה',
      description: 'מילים הקשורות לטבע',
      vocabulary: [
        { hebrew: 'עץ', en: 'Tree', ro: 'Copac', it: 'Albero', fr: 'Arbre', pronunciation: { en: 'tree', ro: 'koh-PAHK', it: 'AHL-beh-roh', fr: 'ahrbr' } },
        { hebrew: 'פרח', en: 'Flower', ro: 'Floare', it: 'Fiore', fr: 'Fleur', pronunciation: { en: 'FLOW-er', ro: 'FLOH-ah-reh', it: 'FYOH-reh', fr: 'fluhr' } },
        { hebrew: 'עלה', en: 'Leaf', ro: 'Frunză', it: 'Foglia', fr: 'Feuille', pronunciation: { en: 'leef', ro: 'FROON-zuh', it: 'FOH-lyah', fr: 'fuhy' } },
        { hebrew: 'אדמה', en: 'Earth', ro: 'Pământ', it: 'Terra', fr: 'Terre', pronunciation: { en: 'urth', ro: 'puh-MUHNT', it: 'TEHR-rah', fr: 'tehr' } },
        { hebrew: 'מים', en: 'Water', ro: 'Apă', it: 'Acqua', fr: 'Eau', pronunciation: { en: 'WAW-ter', ro: 'AH-puh', it: 'AHK-kwah', fr: 'oh' } },
        { hebrew: 'אש', en: 'Fire', ro: 'Foc', it: 'Fuoco', fr: 'Feu', pronunciation: { en: 'fahyr', ro: 'fohk', it: 'FWOH-koh', fr: 'fuh' } },
        { hebrew: 'אוויר', en: 'Air', ro: 'Aer', it: 'Aria', fr: 'Air', pronunciation: { en: 'air', ro: 'ah-EHR', it: 'AH-ree-ah', fr: 'ehr' } },
        { hebrew: 'שמיים', en: 'Sky', ro: 'Cer', it: 'Cielo', fr: 'Ciel', pronunciation: { en: 'skahy', ro: 'chehr', it: 'CHYEH-loh', fr: 'syel' } },
        { hebrew: 'כוכב', en: 'Star', ro: 'Stea', it: 'Stella', fr: 'Étoile', pronunciation: { en: 'stahr', ro: 'steh-AH', it: 'STEHL-lah', fr: 'ay-TWAHL' } },
        { hebrew: 'ירח', en: 'Moon', ro: 'Lună', it: 'Luna', fr: 'Lune', pronunciation: { en: 'moon', ro: 'LOO-nuh', it: 'LOO-nah', fr: 'loon' } },
        { hebrew: 'שמש', en: 'Sun', ro: 'Soare', it: 'Sole', fr: 'Soleil', pronunciation: { en: 'suhn', ro: 'SWAH-reh', it: 'SOH-leh', fr: 'soh-LAY' } },
        { hebrew: 'נהר', en: 'River', ro: 'Râu', it: 'Fiume', fr: 'Rivière', pronunciation: { en: 'RIV-er', ro: 'ruh-OO', it: 'FYOO-meh', fr: 'ree-VYEHR' } },
        { hebrew: 'ים', en: 'Sea', ro: 'Mare', it: 'Mare', fr: 'Mer', pronunciation: { en: 'see', ro: 'MAH-reh', it: 'MAH-reh', fr: 'mehr' } },
        { hebrew: 'הר', en: 'Mountain', ro: 'Munte', it: 'Montagna', fr: 'Montagne', pronunciation: { en: 'MOWN-tin', ro: 'MOON-teh', it: 'mohn-TAHN-yah', fr: 'mohn-TAHN-yuh' } },
      ],
    },
  },
};

function getTranslation(term: any, lang: SupportedLanguageKey): string {
  // Map language keys to template keys
  const langMap: Record<SupportedLanguageKey, string> = {
    french: 'fr',
    romanian: 'ro',
    italian: 'it',
    english: 'en',
    russian: 'ru',
  };
  
  // Try short code first (en, ro, it, fr) - this is what's in the templates
  const templateKey = langMap[lang];
  if (term[templateKey]) return term[templateKey];
  
  // Try full language name (french, romanian, italian, english) - fallback
  if (term[lang]) return term[lang];
  
  // Fallback to English
  return term.en || '';
}

function getPronunciation(term: any, lang: SupportedLanguageKey): string {
  // Map language keys to template keys
  const langMap: Record<SupportedLanguageKey, string> = {
    french: 'fr',
    romanian: 'ro',
    italian: 'it',
    english: 'en',
    russian: 'ru',
  };
  const templateKey = langMap[lang];
  
  // Try pronunciation with template key first (en, ro, it, fr)
  if (term.pronunciation?.[templateKey]) return term.pronunciation[templateKey];
  
  // Try full language name as fallback
  if (term.pronunciation?.[lang]) return term.pronunciation[lang];
  
  // Fallback to English
  return term.pronunciation?.en || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetLanguage = 'english', createAll = false } = body;

    const createdLessons: any[] = [];
    const errors: string[] = [];

    // If createAll, create lessons for all languages, levels and topics
    const languagesToCreate = createAll 
      ? (['english', 'romanian', 'italian', 'french', 'russian'] as SupportedLanguageKey[])
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

