import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/ai/claude';

type SupportedLanguageKey = 'english' | 'romanian' | 'italian' | 'french' | 'russian';
type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Lesson templates for different topics and levels
export const LESSON_TEMPLATES: Record<string, Record<string, any>> = {
  BEGINNER: {
    היכרות: {
      title: 'היכרות בסיסית',
      description: 'ללמוד ברכות והצגה עצמית',
      vocabulary: [
        { hebrew: 'שלום', en: 'Hello', ro: 'Salut', it: 'Ciao', fr: 'Bonjour', ru: 'Привет', pronunciation: { en: 'heh-LOH', ro: 'sa-LOOT', it: 'CHAO', fr: 'bon-ZHOOR', ru: 'pree-VYET' } },
        { hebrew: 'מה שלומך?', en: 'How are you?', ro: 'Ce mai faci?', it: 'Come stai?', fr: 'Comment allez-vous?', ru: 'Как дела?', pronunciation: { en: 'how ar YOO', ro: 'cheh mai FAH-chee', it: 'KOH-meh STAH-ee', fr: 'koh-MAHN tah-LAY voo', ru: 'kak dee-LAH' } },
        { hebrew: 'תודה', en: 'Thank you', ro: 'Mulțumesc', it: 'Grazie', fr: 'Merci', ru: 'Спасибо', pronunciation: { en: 'THANK yoo', ro: 'mool-tsoo-MESK', it: 'GRAH-tsee-eh', fr: 'mehr-SEE', ru: 'spah-SEE-bah' } },
        { hebrew: 'בבקשה', en: 'Please', ro: 'Te rog', it: 'Per favore', fr: 'S\'il vous plaît', ru: 'Пожалуйста', pronunciation: { en: 'pleez', ro: 'teh ROHG', it: 'pehr fah-VOH-reh', fr: 'seel voo PLAY', ru: 'pah-ZHAH-loo-stah' } },
        { hebrew: 'סליחה', en: 'Sorry', ro: 'Scuze', it: 'Scusa', fr: 'Désolé', ru: 'Извините', pronunciation: { en: 'SOR-ee', ro: 'SKOO-zeh', it: 'SKOO-zah', fr: 'day-zoh-LAY', ru: 'eez-vee-NEE-teh' } },
        { hebrew: 'להתראות', en: 'Goodbye', ro: 'La revedere', it: 'Arrivederci', fr: 'Au revoir', ru: 'До свидания', pronunciation: { en: 'good-BYE', ro: 'lah reh-veh-DEH-reh', it: 'ah-ree-veh-DEHR-chee', fr: 'oh ruh-VWAHR', ru: 'dah svee-DAH-nee-yah' } },
        { hebrew: 'שמי', en: 'My name is', ro: 'Mă numesc', it: 'Mi chiamo', fr: 'Je m\'appelle', ru: 'Меня зовут', pronunciation: { en: 'my name iz', ro: 'muh noo-MESK', it: 'mee KYAH-moh', fr: 'zhuh mah-PEHL', ru: 'mee-NYAH zoo-VOOT' } },
        { hebrew: 'אני מ', en: 'I am from', ro: 'Sunt din', it: 'Sono di', fr: 'Je suis de', ru: 'Я из', pronunciation: { en: 'ay am from', ro: 'soont deen', it: 'SOH-noh dee', fr: 'zhuh swee duh', ru: 'yah eez' } },
        { hebrew: 'נעים להכיר', en: 'Nice to meet you', ro: 'Îmi pare bine', it: 'Piacere', fr: 'Enchanté', ru: 'Приятно познакомиться', pronunciation: { en: 'nahys tu meet yoo', ro: 'uhm PAH-reh BEE-neh', it: 'pyah-CHEH-reh', fr: 'ahn-shahn-TAY', ru: 'pree-YAHT-nah pah-znah-KOH-meets-yah' } },
        { hebrew: 'כן', en: 'Yes', ro: 'Da', it: 'Sì', fr: 'Oui', ru: 'Да', pronunciation: { en: 'yes', ro: 'dah', it: 'see', fr: 'wee', ru: 'dah' } },
        { hebrew: 'לא', en: 'No', ro: 'Nu', it: 'No', fr: 'Non', ru: 'Нет', pronunciation: { en: 'noh', ro: 'noo', it: 'noh', fr: 'nohn', ru: 'nyet' } },
        { hebrew: 'בוקר טוב', en: 'Good morning', ro: 'Bună dimineața', it: 'Buongiorno', fr: 'Bonjour', ru: 'Доброе утро', pronunciation: { en: 'good MOR-ning', ro: 'BOO-nuh dee-mee-NYAH-tsuh', it: 'bwohn-JOR-noh', fr: 'bon-ZHOOR', ru: 'DAH-brah-yeh OO-trah' } },
        { hebrew: 'ערב טוב', en: 'Good evening', ro: 'Bună seara', it: 'Buonasera', fr: 'Bonsoir', ru: 'Добрый вечер', pronunciation: { en: 'good EE-ven-ing', ro: 'BOO-nuh seh-AH-rah', it: 'bwoh-nah-SEH-rah', fr: 'bohn-SWAHR', ru: 'DAH-bry VEH-cher' } },
        { hebrew: 'לילה טוב', en: 'Good night', ro: 'Noapte bună', it: 'Buonanotte', fr: 'Bonne nuit', ru: 'Спокойной ночи', pronunciation: { en: 'good nahyt', ro: 'NWAHP-teh BOO-nuh', it: 'bwoh-nah-NOHT-teh', fr: 'bohn nwee', ru: 'spah-KOY-noy NOH-chee' } },
        { hebrew: 'מה קורה?', en: 'What\'s happening?', ro: 'Ce se întâmplă?', it: 'Cosa succede?', fr: 'Qu\'est-ce qui se passe?', ru: 'Что происходит?', pronunciation: { en: 'wots HAP-en-ing', ro: 'cheh seh uhn-TUHM-pluh', it: 'KOH-sah soot-CHEH-deh', fr: 'kehs kee suh pahs', ru: 'shtoh prah-ee-SKHO-deet' } },
        { hebrew: 'מה חדש?', en: 'What\'s new?', ro: 'Ce mai e nou?', it: 'Cosa c\'è di nuovo?', fr: 'Quoi de neuf?', ru: 'Что нового?', pronunciation: { en: 'wots noo', ro: 'cheh mai eh noh-OO', it: 'KOH-sah cheh dee NWOH-voh', fr: 'kwah duh nuhf', ru: 'shtoh NOH-vah-vah' } },
        { hebrew: 'איך היה היום?', en: 'How was your day?', ro: 'Cum a fost ziua?', it: 'Com\'è andata la giornata?', fr: 'Comment s\'est passée ta journée?', ru: 'Как прошёл день?', pronunciation: { en: 'how wuz yor day', ro: 'koom ah fohst ZEE-oo-ah', it: 'kohm-EH ahn-DAH-tah lah jor-NAH-tah', fr: 'koh-MAHN say pah-SAY tah zhoor-NAY', ru: 'kak prah-SHYOL dyen' } },
        { hebrew: 'מה אתה עושה?', en: 'What are you doing?', ro: 'Ce faci?', it: 'Cosa stai facendo?', fr: 'Que fais-tu?', ru: 'Что ты делаешь?', pronunciation: { en: 'wot ar yoo DOO-ing', ro: 'cheh FAH-chee', it: 'KOH-sah STAH-ee fah-CHEHN-doh', fr: 'kuh fay-TOO', ru: 'shtoh ty DYEH-lah-esh' } },
        { hebrew: 'איפה אתה?', en: 'Where are you?', ro: 'Unde ești?', it: 'Dove sei?', fr: 'Où es-tu?', ru: 'Где ты?', pronunciation: { en: 'wair ar yoo', ro: 'OON-deh EHSHT', it: 'DOH-veh SAY-ee', fr: 'oo eh-TOO', ru: 'gdyeh ty' } },
        { hebrew: 'מתי?', en: 'When?', ro: 'Când?', it: 'Quando?', fr: 'Quand?', ru: 'Когда?', pronunciation: { en: 'wen', ro: 'kuhnd', it: 'KWAHN-doh', fr: 'kahn', ru: 'kahg-DAH' } },
        { hebrew: 'למה?', en: 'Why?', ro: 'De ce?', it: 'Perché?', fr: 'Pourquoi?', ru: 'Почему?', pronunciation: { en: 'wahy', ro: 'deh cheh', it: 'pehr-KEH', fr: 'poor-KWAH', ru: 'pah-cheh-MOO' } },
        { hebrew: 'איך?', en: 'How?', ro: 'Cum?', it: 'Come?', fr: 'Comment?', ru: 'Как?', pronunciation: { en: 'how', ro: 'koom', it: 'KOH-meh', fr: 'koh-MAHN', ru: 'kak' } },
        { hebrew: 'מה השעה?', en: 'What time is it?', ro: 'Ce oră e?', it: 'Che ora è?', fr: 'Quelle heure est-il?', ru: 'Который час?', pronunciation: { en: 'wot tahym iz it', ro: 'cheh OH-ruh eh', it: 'keh OH-rah EH', fr: 'kehl uhr eh-TEEL', ru: 'kah-TOH-ry chahs' } },
        { hebrew: 'איפה אתה גר?', en: 'Where do you live?', ro: 'Unde locuiești?', it: 'Dove vivi?', fr: 'Où habites-tu?', ru: 'Где ты живёшь?', pronunciation: { en: 'wair doo yoo liv', ro: 'OON-deh loh-koo-YEHSHT', it: 'DOH-veh VEE-vee', fr: 'oo ah-BEET-TOO', ru: 'gdyeh ty zhee-VYOSH' } },
        { hebrew: 'מה אתה עובד?', en: 'What do you do for work?', ro: 'La ce lucrezi?', it: 'Cosa fai di lavoro?', fr: 'Que fais-tu comme travail?', ru: 'Кем ты работаешь?', pronunciation: { en: 'wot doo yoo doo for wurk', ro: 'lah cheh loo-KREH-zee', it: 'KOH-sah FAH-ee dee lah-VOH-roh', fr: 'kuh fay-TOO kohm trah-VAHY', ru: 'kyem ty rah-BAH-tah-esh' } },
        { hebrew: 'מה אתה אוהב?', en: 'What do you like?', ro: 'Ce îți place?', it: 'Cosa ti piace?', fr: 'Qu\'est-ce que tu aimes?', ru: 'Что тебе нравится?', pronunciation: { en: 'wot doo yoo lahyk', ro: 'cheh uhts PLAH-cheh', it: 'KOH-sah tee PYAH-cheh', fr: 'kehs kuh too ehm', ru: 'shtoh teh-BEH NRAH-veets-yah' } },
        { hebrew: 'איך אתה מרגיש?', en: 'How do you feel?', ro: 'Cum te simți?', it: 'Come ti senti?', fr: 'Comment te sens-tu?', ru: 'Как ты себя чувствуешь?', pronunciation: { en: 'how doo yoo feel', ro: 'koom teh SEEMT', it: 'KOH-meh tee SEHN-tee', fr: 'koh-MAHN tuh sahn-TOO', ru: 'kak ty seh-BYAH CHOOS-tvoo-esh' } },
        { hebrew: 'מה אתה חושב?', en: 'What do you think?', ro: 'Ce crezi?', it: 'Cosa pensi?', fr: 'Qu\'en penses-tu?', ru: 'Что ты думаешь?', pronunciation: { en: 'wot doo yoo thingk', ro: 'cheh KREH-zee', it: 'KOH-sah PEHN-see', fr: 'kahn pahns-TOO', ru: 'shtoh ty DOO-mah-esh' } },
        { hebrew: 'תודה רבה', en: 'Thank you very much', ro: 'Mulțumesc mult', it: 'Grazie mille', fr: 'Merci beaucoup', ru: 'Большое спасибо', pronunciation: { en: 'THANK yoo VER-ee much', ro: 'mool-tsoo-MESK moolt', it: 'GRAH-tsee-eh MEEL-leh', fr: 'mehr-SEE boh-KOO', ru: 'bahl-SHOH-yeh spah-SEE-bah' } },
        { hebrew: 'אין בעיה', en: 'No problem', ro: 'Nicio problemă', it: 'Nessun problema', fr: 'Pas de problème', ru: 'Нет проблем', pronunciation: { en: 'noh PROB-lem', ro: 'NEE-choh proh-BLEH-muh', it: 'nehs-SOON proh-BLEH-mah', fr: 'pah duh proh-BLEHM', ru: 'nyet prah-BLYEM' } },
        { hebrew: 'בהצלחה', en: 'Good luck', ro: 'Mult succes', it: 'Buona fortuna', fr: 'Bonne chance', ru: 'Удачи', pronunciation: { en: 'good luhk', ro: 'moolt sook-CHEHS', it: 'BWOH-nah for-TOO-nah', fr: 'bohn shahns', ru: 'oo-DAH-chee' } },
        { hebrew: 'תיהנה', en: 'Enjoy', ro: 'Bucură-te', it: 'Divertiti', fr: 'Amuse-toi', ru: 'Наслаждайся', pronunciation: { en: 'en-JOY', ro: 'boo-KOO-ruh-teh', it: 'dee-vehr-TEE-tee', fr: 'ah-moo-ZUH-TWAH', ru: 'nahs-lahzh-DAIS-yah' } },
        { hebrew: 'זה בסדר', en: 'It\'s okay', ro: 'E în regulă', it: 'Va bene', fr: 'C\'est bon', ru: 'Всё в порядке', pronunciation: { en: 'its oh-KAY', ro: 'eh uhn reh-GOO-luh', it: 'vah BEH-neh', fr: 'say bohn', ru: 'vsyoh v pah-RYAHD-keh' } },
      ],
      sentences: [
        { hebrew: 'שלום, שמי שרה ואני מישראל', en: 'Hello, my name is Sarah and I am from Israel', ro: 'Salut, mă numesc Sarah și sunt din Israel', it: 'Ciao, mi chiamo Sarah e sono di Israele', fr: 'Bonjour, je m\'appelle Sarah et je suis d\'Israël', ru: 'Привет, меня зовут Сара и я из Израиля', isSentence: true },
        { hebrew: 'נעים להכיר אותך, מה שלומך?', en: 'Nice to meet you, how are you?', ro: 'Îmi pare bine să te cunosc, ce mai faci?', it: 'Piacere di conoscerti, come stai?', fr: 'Enchanté de te rencontrer, comment vas-tu?', ru: 'Приятно познакомиться, как дела?', isSentence: true },
        { hebrew: 'תודה רבה, אני מרגיש מצוין היום', en: 'Thank you very much, I feel great today', ro: 'Mulțumesc mult, mă simt minunat astăzi', it: 'Grazie mille, mi sento benissimo oggi', fr: 'Merci beaucoup, je me sens très bien aujourd\'hui', ru: 'Большое спасибо, я чувствую себя отлично сегодня', isSentence: true },
        { hebrew: 'איפה אתה גר ומה אתה עובד?', en: 'Where do you live and what do you do for work?', ro: 'Unde locuiești și la ce lucrezi?', it: 'Dove vivi e cosa fai di lavoro?', fr: 'Où habites-tu et que fais-tu comme travail?', ru: 'Где ты живёшь и кем ты работаешь?', isSentence: true },
      ],
    },
    אוכל: {
      title: 'אוכל ומסעדות',
      description: 'מילים שימושיות להזמנה במסעדה',
      vocabulary: [
        { hebrew: 'תפריט', en: 'Menu', ro: 'Meniu', it: 'Menu', fr: 'Menu', ru: 'Меню', pronunciation: { en: 'MEN-yoo', ro: 'meh-NEE-oo', it: 'MEH-noo', fr: 'meh-NOO', ru: 'mee-NYOO' } },
        { hebrew: 'מים', en: 'Water', ro: 'Apă', it: 'Acqua', fr: 'Eau', ru: 'Вода', pronunciation: { en: 'WAH-ter', ro: 'AH-puh', it: 'AHK-kwah', fr: 'oh', ru: 'vah-DAH' } },
        { hebrew: 'לחם', en: 'Bread', ro: 'Pâine', it: 'Pane', fr: 'Pain', ru: 'Хлеб', pronunciation: { en: 'bred', ro: 'puh-EE-neh', it: 'PAH-neh', fr: 'pan', ru: 'khlyeb' } },
        { hebrew: 'בקשה', en: 'Order', ro: 'Comandă', it: 'Ordine', fr: 'Commande', ru: 'Заказ', pronunciation: { en: 'OR-der', ro: 'koh-MAHN-duh', it: 'OR-dee-neh', fr: 'koh-MAHND', ru: 'zah-KAHZ' } },
        { hebrew: 'חשבון', en: 'Bill', ro: 'Notă', it: 'Conto', fr: 'Addition', ru: 'Счёт', pronunciation: { en: 'bil', ro: 'NOH-tuh', it: 'KOHN-toh', fr: 'ah-dee-SYOHN', ru: 'schyot' } },
        { hebrew: 'אוכל', en: 'Food', ro: 'Mâncare', it: 'Cibo', fr: 'Nourriture', ru: 'Еда', pronunciation: { en: 'food', ro: 'muhn-KAH-reh', it: 'CHEE-boh', fr: 'noo-ree-TOOR', ru: 'ee-DAH' } },
        { hebrew: 'בשר', en: 'Meat', ro: 'Carne', it: 'Carne', fr: 'Viande', ru: 'Мясо', pronunciation: { en: 'meet', ro: 'KAHR-neh', it: 'KAHR-neh', fr: 'vyahnd', ru: 'myah-SOH' } },
        { hebrew: 'דג', en: 'Fish', ro: 'Pește', it: 'Pesce', fr: 'Poisson', ru: 'Рыба', pronunciation: { en: 'fish', ro: 'PEHSH-teh', it: 'PEH-sheh', fr: 'pwah-SOHN', ru: 'RY-bah' } },
        { hebrew: 'ירקות', en: 'Vegetables', ro: 'Legume', it: 'Verdure', fr: 'Légumes', ru: 'Овощи', pronunciation: { en: 'VEJ-tuh-buls', ro: 'leh-GOO-meh', it: 'vehr-DOO-reh', fr: 'lay-GOOM', ru: 'ah-VOH-schee' } },
        { hebrew: 'פירות', en: 'Fruits', ro: 'Fructe', it: 'Frutta', fr: 'Fruits', ru: 'Фрукты', pronunciation: { en: 'froots', ro: 'FROOK-teh', it: 'FROOT-tah', fr: 'frwee', ru: 'frook-TY' } },
        { hebrew: 'קפה', en: 'Coffee', ro: 'Cafea', it: 'Caffè', fr: 'Café', ru: 'Кофе', pronunciation: { en: 'KAH-fee', ro: 'kah-FEH-ah', it: 'kahf-FEH', fr: 'kah-FAY', ru: 'KOH-fee' } },
        { hebrew: 'תה', en: 'Tea', ro: 'Ceai', it: 'Tè', fr: 'Thé', ru: 'Чай', pronunciation: { en: 'tee', ro: 'chay', it: 'teh', fr: 'tay', ru: 'chai' } },
        { hebrew: 'ביצה', en: 'Egg', ro: 'Ouă', it: 'Uovo', fr: 'Œuf', ru: 'Яйцо', pronunciation: { en: 'eg', ro: 'WAH-uh', it: 'WAH-voh', fr: 'uhf', ru: 'yai-TSOH' } },
        { hebrew: 'חלב', en: 'Milk', ro: 'Lapte', it: 'Latte', fr: 'Lait', ru: 'Молоко', pronunciation: { en: 'milk', ro: 'LAHP-teh', it: 'LAHT-teh', fr: 'lay', ru: 'mah-lah-KOH' } },
        { hebrew: 'גבינה', en: 'Cheese', ro: 'Brânză', it: 'Formaggio', fr: 'Fromage', ru: 'Сыр', pronunciation: { en: 'cheez', ro: 'bruhn-ZUH', it: 'for-MAHJ-joh', fr: 'froh-MAHZH', ru: 'syr' } },
        { hebrew: 'תפוח', en: 'Apple', ro: 'Măr', it: 'Mela', fr: 'Pomme', ru: 'Яблоко', pronunciation: { en: 'AP-ul', ro: 'muhr', it: 'MEH-lah', fr: 'pohm', ru: 'YAH-blah-kah' } },
        { hebrew: 'בננה', en: 'Banana', ro: 'Banana', it: 'Banana', fr: 'Banane', ru: 'Банан', pronunciation: { en: 'buh-NAH-nuh', ro: 'bah-NAH-nah', it: 'bah-NAH-nah', fr: 'bah-NAHN', ru: 'bah-NAHN' } },
        { hebrew: 'עגבניה', en: 'Tomato', ro: 'Roșie', it: 'Pomodoro', fr: 'Tomate', ru: 'Помидор', pronunciation: { en: 'tuh-MAY-toh', ro: 'ROH-shee-eh', it: 'poh-moh-DOH-roh', fr: 'toh-MAHT', ru: 'pah-mee-DOR' } },
        { hebrew: 'מלפפון', en: 'Cucumber', ro: 'Castravete', it: 'Cetriolo', fr: 'Concombre', ru: 'Огурец', pronunciation: { en: 'KYOO-kum-ber', ro: 'kahs-trah-VEH-teh', it: 'cheh-tree-OH-loh', fr: 'kohn-kohmbr', ru: 'ah-goo-REHTS' } },
        { hebrew: 'אורז', en: 'Rice', ro: 'Orez', it: 'Riso', fr: 'Riz', ru: 'Рис', pronunciation: { en: 'rahys', ro: 'oh-REHZ', it: 'REE-zoh', fr: 'ree', ru: 'rees' } },
        { hebrew: 'פסטה', en: 'Pasta', ro: 'Paste', it: 'Pasta', fr: 'Pâtes', ru: 'Макароны', pronunciation: { en: 'PAH-stuh', ro: 'PAHS-teh', it: 'PAH-stah', fr: 'paht', ru: 'mah-kah-ROH-ny' } },
        { hebrew: 'עוף', en: 'Chicken', ro: 'Pui', it: 'Pollo', fr: 'Poulet', ru: 'Курица', pronunciation: { en: 'CHIK-en', ro: 'poo-ee', it: 'POHL-loh', fr: 'poo-LAY', ru: 'KOO-ree-tsah' } },
        { hebrew: 'מסעדה', en: 'Restaurant', ro: 'Restaurant', it: 'Ristorante', fr: 'Restaurant', ru: 'Ресторан', pronunciation: { en: 'RES-tuh-rahnt', ro: 'rehs-tah-OO-rahnt', it: 'ree-stoh-RAHN-teh', fr: 'rehs-toh-RAHN', ru: 'rehs-tah-RAHN' } },
        { hebrew: 'מלצר', en: 'Waiter', ro: 'Chelner', it: 'Cameriere', fr: 'Serveur', ru: 'Официант', pronunciation: { en: 'WAY-ter', ro: 'KEHL-nehr', it: 'kah-meh-RYEH-reh', fr: 'sehr-VUHR', ru: 'ah-fee-TSYAHNT' } },
      ],
    },
    עבודה: {
      title: 'עבודה ועסקים',
      description: 'מילים שימושיות בסביבת עבודה',
      vocabulary: [
        { hebrew: 'פגישה', en: 'Meeting', ro: 'Întâlnire', it: 'Riunione', fr: 'Réunion', ru: 'Встреча', pronunciation: { en: 'MEE-ting', ro: 'uhn-tuh-lee-NEH-reh', it: 'ree-oo-NYOH-neh', fr: 'ray-oo-NYOHN', ru: 'vstree-CHAH' } },
        { hebrew: 'פרויקט', en: 'Project', ro: 'Proiect', it: 'Progetto', fr: 'Projet', ru: 'Проект', pronunciation: { en: 'PROJ-ekt', ro: 'proh-YEKT', it: 'proh-JEHT-toh', fr: 'proh-ZHEH', ru: 'prah-YEKT' } },
        { hebrew: 'דדליין', en: 'Deadline', ro: 'Termen limită', it: 'Scadenza', fr: 'Date limite', ru: 'Крайний срок', pronunciation: { en: 'DED-line', ro: 'TEHR-mehn LEE-mee-tuh', it: 'skah-DEHN-zah', fr: 'daht lee-MEET', ru: 'KRAH-ee-nee srok' } },
        { hebrew: 'עבודה', en: 'Work', ro: 'Muncă', it: 'Lavoro', fr: 'Travail', ru: 'Работа', pronunciation: { en: 'wurk', ro: 'MOON-kuh', it: 'lah-VOH-roh', fr: 'trah-VAHY', ru: 'rah-BOH-tah' } },
        { hebrew: 'לקוח', en: 'Client', ro: 'Client', it: 'Cliente', fr: 'Client', ru: 'Клиент', pronunciation: { en: 'KLY-ent', ro: 'klee-ENT', it: 'KLEE-ehn-teh', fr: 'klee-AHN', ru: 'klee-ENT' } },
        { hebrew: 'משרד', en: 'Office', ro: 'Birou', it: 'Ufficio', fr: 'Bureau', ru: 'Офис', pronunciation: { en: 'OF-is', ro: 'bee-ROO', it: 'oof-FEE-choh', fr: 'byoo-ROH', ru: 'OH-fees' } },
        { hebrew: 'כסף', en: 'Money', ro: 'Bani', it: 'Denaro', fr: 'Argent', ru: 'Деньги', pronunciation: { en: 'MUH-nee', ro: 'BAH-nee', it: 'deh-NAH-roh', fr: 'ahr-ZHAHN', ru: 'DYEN-gee' } },
        { hebrew: 'משכורת', en: 'Salary', ro: 'Salariu', it: 'Stipendio', fr: 'Salaire', ru: 'Зарплата', pronunciation: { en: 'SAL-uh-ree', ro: 'sah-LAH-ree-oo', it: 'stee-PEHN-dyoh', fr: 'sah-LEHR', ru: 'zahr-PLAH-tah' } },
        { hebrew: 'מזכירה', en: 'Secretary', ro: 'Secretară', it: 'Segretaria', fr: 'Secrétaire', ru: 'Секретарь', pronunciation: { en: 'SEK-ruh-ter-ee', ro: 'seh-kreh-TAH-ruh', it: 'seh-greh-TAH-ree-ah', fr: 'seh-kray-TEHR', ru: 'seh-kreh-TAHR' } },
        { hebrew: 'מנהל', en: 'Manager', ro: 'Manager', it: 'Manager', fr: 'Gestionnaire', ru: 'Менеджер', pronunciation: { en: 'MAN-ij-er', ro: 'MAH-nah-jehr', it: 'MAH-nah-jehr', fr: 'zhees-tee-oh-NAIR', ru: 'meh-nehd-ZHEHR' } },
      ],
      sentences: [
        { hebrew: 'יש לי פגישה חשובה מחר בבוקר', en: 'I have an important meeting tomorrow morning', ro: 'Am o întâlnire importantă mâine dimineață', it: 'Ho un incontro importante domani mattina', fr: 'J\'ai une réunion importante demain matin', ru: 'У меня важная встреча завтра утром', isSentence: true },
        { hebrew: 'הפרויקט צריך להיות מוכן עד סוף השבוע', en: 'The project needs to be ready by the end of the week', ro: 'Proiectul trebuie să fie gata până la sfârșitul săptămânii', it: 'Il progetto deve essere pronto entro la fine della settimana', fr: 'Le projet doit être prêt avant la fin de la semaine', ru: 'Проект должен быть готов к концу недели', isSentence: true },
        { hebrew: 'אני עובד במשרד במרכז העיר', en: 'I work in an office in the city center', ro: 'Lucrez într-un birou în centrul orașului', it: 'Lavoro in un ufficio nel centro della città', fr: 'Je travaille dans un bureau au centre-ville', ru: 'Я работаю в офисе в центре города', isSentence: true },
        { hebrew: 'הלקוח ביקש פגישה דחופה', en: 'The client requested an urgent meeting', ro: 'Clientul a solicitat o întâlnire urgentă', it: 'Il cliente ha richiesto un incontro urgente', fr: 'Le client a demandé une réunion urgente', ru: 'Клиент попросил срочную встречу', isSentence: true },
      ],
    },
    מספרים: {
      title: 'מספרים בסיסיים',
      description: 'ללמוד לספור מ-1 עד 20',
      vocabulary: [
        { hebrew: 'אחד', en: 'One', ro: 'Unu', it: 'Uno', fr: 'Un', ru: 'Один', pronunciation: { en: 'wun', ro: 'OO-noo', it: 'OO-noh', fr: 'uhn', ru: 'ah-DEEN' } },
        { hebrew: 'שניים', en: 'Two', ro: 'Doi', it: 'Due', fr: 'Deux', ru: 'Два', pronunciation: { en: 'too', ro: 'doy', it: 'DOO-eh', fr: 'duh', ru: 'dvah' } },
        { hebrew: 'שלושה', en: 'Three', ro: 'Trei', it: 'Tre', fr: 'Trois', ru: 'Три', pronunciation: { en: 'three', ro: 'tray', it: 'TREH', fr: 'trwah', ru: 'tree' } },
        { hebrew: 'ארבעה', en: 'Four', ro: 'Patru', it: 'Quattro', fr: 'Quatre', ru: 'Четыре', pronunciation: { en: 'for', ro: 'PAH-troo', it: 'KWAHT-troh', fr: 'kahtr', ru: 'cheh-TY-reh' } },
        { hebrew: 'חמישה', en: 'Five', ro: 'Cinci', it: 'Cinque', fr: 'Cinq', ru: 'Пять', pronunciation: { en: 'fahyv', ro: 'cheench', it: 'CHEEN-kweh', fr: 'sank', ru: 'pyat' } },
        { hebrew: 'שישה', en: 'Six', ro: 'Șase', it: 'Sei', fr: 'Six', ru: 'Шесть', pronunciation: { en: 'siks', ro: 'SHAH-seh', it: 'say', fr: 'sees', ru: 'shest' } },
        { hebrew: 'שבעה', en: 'Seven', ro: 'Șapte', it: 'Sette', fr: 'Sept', ru: 'Семь', pronunciation: { en: 'SEV-en', ro: 'SHAHP-teh', it: 'SEHT-teh', fr: 'seht', ru: 'syem' } },
        { hebrew: 'שמונה', en: 'Eight', ro: 'Opt', it: 'Otto', fr: 'Huit', ru: 'Восемь', pronunciation: { en: 'ayt', ro: 'ohpt', it: 'OHT-toh', fr: 'weet', ru: 'VOH-syem' } },
        { hebrew: 'תשעה', en: 'Nine', ro: 'Nouă', it: 'Nove', fr: 'Neuf', ru: 'Девять', pronunciation: { en: 'nahyn', ro: 'NOH-uh', it: 'NOH-veh', fr: 'nuhf', ru: 'DYEH-vyat' } },
        { hebrew: 'עשרה', en: 'Ten', ro: 'Zece', it: 'Dieci', fr: 'Dix', ru: 'Десять', pronunciation: { en: 'ten', ro: 'ZEH-cheh', it: 'DYEH-chee', fr: 'dees', ru: 'DYEH-syat' } },
        { hebrew: 'עשרים', en: 'Twenty', ro: 'Douăzeci', it: 'Venti', fr: 'Vingt', ru: 'Двадцать', pronunciation: { en: 'TWEN-tee', ro: 'doh-uh-ZEH-chee', it: 'VEHN-tee', fr: 'van', ru: 'DVAH-tsat' } },
      ],
      sentences: [
        { hebrew: 'יש לי שלושה אחים ואחת אחת', en: 'I have three brothers and one sister', ro: 'Am trei frați și o soră', it: 'Ho tre fratelli e una sorella', fr: 'J\'ai trois frères et une sœur', ru: 'У меня три брата и одна сестра', isSentence: true },
        { hebrew: 'אני צריך לקנות חמישה תפוחים ושני לחמים', en: 'I need to buy five apples and two breads', ro: 'Trebuie să cumpăr cinci mere și două pâini', it: 'Devo comprare cinque mele e due pani', fr: 'Je dois acheter cinq pommes et deux pains', ru: 'Мне нужно купить пять яблок и два хлеба', isSentence: true },
        { hebrew: 'הפגישה תתחיל בשעה עשר בבוקר', en: 'The meeting will start at ten in the morning', ro: 'Întâlnirea va începe la ora zece dimineața', it: 'L\'incontro inizierà alle dieci del mattino', fr: 'La réunion commencera à dix heures du matin', ru: 'Встреча начнётся в десять утра', isSentence: true },
        { hebrew: 'יש לנו עשרים תלמידים בכיתה', en: 'We have twenty students in the class', ro: 'Avem douăzeci de elevi în clasă', it: 'Abbiamo venti studenti in classe', fr: 'Nous avons vingt élèves dans la classe', ru: 'У нас двадцать учеников в классе', isSentence: true },
      ],
    },
    צבעים: {
      title: 'צבעים בסיסיים',
      description: 'ללמוד שמות צבעים',
      vocabulary: [
        { hebrew: 'אדום', en: 'Red', ro: 'Roșu', it: 'Rosso', fr: 'Rouge', ru: 'Красный', pronunciation: { en: 'red', ro: 'ROH-shoo', it: 'ROHS-soh', fr: 'roozh', ru: 'KRAH-sny' } },
        { hebrew: 'כחול', en: 'Blue', ro: 'Albastru', it: 'Blu', fr: 'Bleu', ru: 'Синий', pronunciation: { en: 'bloo', ro: 'ahl-BAHS-troo', it: 'bloo', fr: 'bluh', ru: 'SEE-nee' } },
        { hebrew: 'ירוק', en: 'Green', ro: 'Verde', it: 'Verde', fr: 'Vert', ru: 'Зелёный', pronunciation: { en: 'green', ro: 'VEHR-deh', it: 'VEHR-deh', fr: 'vehr', ru: 'zeh-LYOH-ny' } },
        { hebrew: 'צהוב', en: 'Yellow', ro: 'Galben', it: 'Giallo', fr: 'Jaune', ru: 'Жёлтый', pronunciation: { en: 'YEL-oh', ro: 'GAHL-ben', it: 'JAHL-loh', fr: 'zhohn', ru: 'ZHYOL-ty' } },
        { hebrew: 'שחור', en: 'Black', ro: 'Negru', it: 'Nero', fr: 'Noir', ru: 'Чёрный', pronunciation: { en: 'blak', ro: 'NEH-groo', it: 'NEH-roh', fr: 'nwahr', ru: 'CHYOR-ny' } },
        { hebrew: 'לבן', en: 'White', ro: 'Alb', it: 'Bianco', fr: 'Blanc', ru: 'Белый', pronunciation: { en: 'wahyt', ro: 'ahlb', it: 'BYAHN-koh', fr: 'blahn', ru: 'BYEH-ly' } },
        { hebrew: 'ורוד', en: 'Pink', ro: 'Roz', it: 'Rosa', fr: 'Rose', ru: 'Розовый', pronunciation: { en: 'pink', ro: 'rohz', it: 'ROH-zah', fr: 'rohz', ru: 'rah-ZOH-vy' } },
        { hebrew: 'סגול', en: 'Purple', ro: 'Violet', it: 'Viola', fr: 'Violet', ru: 'Фиолетовый', pronunciation: { en: 'PUR-pul', ro: 'vee-oh-LET', it: 'vee-OH-lah', fr: 'vee-oh-LAY', ru: 'fee-ah-LEH-tah-vy' } },
        { hebrew: 'כתום', en: 'Orange', ro: 'Portocaliu', it: 'Arancione', fr: 'Orange', ru: 'Оранжевый', pronunciation: { en: 'OR-anj', ro: 'por-toh-KAH-lee-oo', it: 'ah-rahn-CHOH-neh', fr: 'oh-RAHNZH', ru: 'ah-RAHN-zheh-vy' } },
        { hebrew: 'חום', en: 'Brown', ro: 'Maro', it: 'Marrone', fr: 'Marron', ru: 'Коричневый', pronunciation: { en: 'brown', ro: 'mah-ROH', it: 'mahr-ROH-neh', fr: 'mah-ROHN', ru: 'kah-REECH-nyeh-vy' } },
      ],
      sentences: [
        { hebrew: 'השמיים כחולים והים כחול גם כן', en: 'The sky is blue and the sea is also blue', ro: 'Cerul este albastru și marea este de asemenea albastră', it: 'Il cielo è blu e il mare è anche blu', fr: 'Le ciel est bleu et la mer est aussi bleue', ru: 'Небо синее и море тоже синее', isSentence: true },
        { hebrew: 'אני אוהבת את הצבע הירוק של הטבע', en: 'I love the green color of nature', ro: 'Îmi place culoarea verde a naturii', it: 'Amo il colore verde della natura', fr: 'J\'aime la couleur verte de la nature', ru: 'Я люблю зелёный цвет природы', isSentence: true },
        { hebrew: 'השמלה האדומה נראית יפה מאוד', en: 'The red dress looks very beautiful', ro: 'Rochia roșie arată foarte frumos', it: 'Il vestito rosso sembra molto bello', fr: 'La robe rouge a l\'air très belle', ru: 'Красное платье выглядит очень красиво', isSentence: true },
        { hebrew: 'השמש הצהובה זורחת בשמיים', en: 'The yellow sun shines in the sky', ro: 'Soarele galben strălucește pe cer', it: 'Il sole giallo splende nel cielo', fr: 'Le soleil jaune brille dans le ciel', ru: 'Жёлтое солнце светит в небе', isSentence: true },
      ],
    },
    בעלי_חיים: {
      title: 'בעלי חיים',
      description: 'ללמוד שמות בעלי חיים',
      vocabulary: [
        { hebrew: 'כלב', en: 'Dog', ro: 'Câine', it: 'Cane', fr: 'Chien', ru: 'Собака', pronunciation: { en: 'dawg', ro: 'kuh-EE-neh', it: 'KAH-neh', fr: 'shyan', ru: 'sah-BAH-kah' } },
        { hebrew: 'חתול', en: 'Cat', ro: 'Pisică', it: 'Gatto', fr: 'Chat', ru: 'Кошка', pronunciation: { en: 'kat', ro: 'pee-SEE-kuh', it: 'GAHT-toh', fr: 'shah', ru: 'KOSH-kah' } },
        { hebrew: 'ציפור', en: 'Bird', ro: 'Pasăre', it: 'Uccello', fr: 'Oiseau', ru: 'Птица', pronunciation: { en: 'burd', ro: 'pah-SUH-reh', it: 'oot-CHEHL-loh', fr: 'wah-ZOH', ru: 'PTEE-tsah' } },
        { hebrew: 'סוס', en: 'Horse', ro: 'Cal', it: 'Cavallo', fr: 'Cheval', ru: 'Лошадь', pronunciation: { en: 'hors', ro: 'kahl', it: 'kah-VAHL-loh', fr: 'shuh-VAHL', ru: 'LOH-shad' } },
        { hebrew: 'פרה', en: 'Cow', ro: 'Vacă', it: 'Mucca', fr: 'Vache', ru: 'Корова', pronunciation: { en: 'kow', ro: 'VAH-kuh', it: 'MOOK-kah', fr: 'vahsh', ru: 'kah-ROH-vah' } },
        { hebrew: 'חזיר', en: 'Pig', ro: 'Porc', it: 'Maiale', fr: 'Cochon', ru: 'Свинья', pronunciation: { en: 'pig', ro: 'pohrk', it: 'mah-YAH-leh', fr: 'koh-SHOHN', ru: 'sveen-YAH' } },
        { hebrew: 'ארנב', en: 'Rabbit', ro: 'Iepure', it: 'Coniglio', fr: 'Lapin', ru: 'Кролик', pronunciation: { en: 'RAB-it', ro: 'yeh-POO-reh', it: 'koh-NEE-lyoh', fr: 'lah-PAN', ru: 'KROH-leek' } },
        { hebrew: 'דוב', en: 'Bear', ro: 'Urs', it: 'Orso', fr: 'Ours', ru: 'Медведь', pronunciation: { en: 'bair', ro: 'oors', it: 'OR-soh', fr: 'oors', ru: 'meed-VYED' } },
        { hebrew: 'אריה', en: 'Lion', ro: 'Leu', it: 'Leone', fr: 'Lion', ru: 'Лев', pronunciation: { en: 'LY-un', ro: 'leh-oo', it: 'leh-OH-neh', fr: 'lee-OHN', ru: 'lyev' } },
        { hebrew: 'פיל', en: 'Elephant', ro: 'Elefant', it: 'Elefante', fr: 'Éléphant', ru: 'Слон', pronunciation: { en: 'EL-uh-fent', ro: 'eh-leh-FAHNT', it: 'eh-leh-FAHN-teh', fr: 'ay-lay-FAHN', ru: 'slon' } },
        { hebrew: 'נמר', en: 'Tiger', ro: 'Tigru', it: 'Tigre', fr: 'Tigre', ru: 'Тигр', pronunciation: { en: 'TY-ger', ro: 'TEE-groo', it: 'TEE-greh', fr: 'teegr', ru: 'teegr' } },
        { hebrew: 'זאב', en: 'Wolf', ro: 'Lup', it: 'Lupo', fr: 'Loup', ru: 'Волк', pronunciation: { en: 'woolf', ro: 'loop', it: 'LOO-poh', fr: 'loo', ru: 'volk' } },
        { hebrew: 'שועל', en: 'Fox', ro: 'Vulpe', it: 'Volpe', fr: 'Renard', ru: 'Лиса', pronunciation: { en: 'foks', ro: 'VOOL-peh', it: 'VOHL-peh', fr: 'ruh-NAHR', ru: 'lee-SAH' } },
        { hebrew: 'צב', en: 'Turtle', ro: 'Țestoasă', it: 'Tartaruga', fr: 'Tortue', ru: 'Черепаха', pronunciation: { en: 'TUR-tul', ro: 'tehs-TOH-ah-suh', it: 'tahr-tah-ROO-gah', fr: 'tor-TOO', ru: 'cheh-reh-PAH-khah' } },
        { hebrew: 'דג', en: 'Fish', ro: 'Pește', it: 'Pesce', fr: 'Poisson', ru: 'Рыба', pronunciation: { en: 'fish', ro: 'PEHSH-teh', it: 'PEH-sheh', fr: 'pwah-SOHN', ru: 'RY-bah' } },
        { hebrew: 'כריש', en: 'Shark', ro: 'Rechin', it: 'Squalo', fr: 'Requin', ru: 'Акула', pronunciation: { en: 'shahrk', ro: 'reh-KEEN', it: 'SKWAH-loh', fr: 'ruh-KAN', ru: 'ah-KOO-lah' } },
        { hebrew: 'לווייתן', en: 'Whale', ro: 'Balena', it: 'Balena', fr: 'Baleine', ru: 'Кит', pronunciation: { en: 'wayl', ro: 'bah-LEH-nah', it: 'bah-LEH-nah', fr: 'bah-LEHN', ru: 'keet' } },
      ],
      sentences: [
        { hebrew: 'הכלב שלי אוהב לשחק בפארק', en: 'My dog loves to play in the park', ro: 'Câinele meu îi place să se joace în parc', it: 'Il mio cane ama giocare nel parco', fr: 'Mon chien adore jouer dans le parc', ru: 'Моя собака любит играть в парке', isSentence: true },
        { hebrew: 'החתול ישן על המיטה כל היום', en: 'The cat sleeps on the bed all day', ro: 'Pisica doarme pe pat toată ziua', it: 'Il gatto dorme sul letto tutto il giorno', fr: 'Le chat dort sur le lit toute la journée', ru: 'Кошка спит на кровати весь день', isSentence: true },
        { hebrew: 'ראיתי אריה בגן החיות אתמול', en: 'I saw a lion at the zoo yesterday', ro: 'Am văzut un leu la grădina zoologică ieri', it: 'Ho visto un leone allo zoo ieri', fr: 'J\'ai vu un lion au zoo hier', ru: 'Вчера я видел льва в зоопарке', isSentence: true },
        { hebrew: 'הפיל הוא החיה הגדולה ביותר', en: 'The elephant is the largest animal', ro: 'Elefantul este cel mai mare animal', it: 'L\'elefante è l\'animale più grande', fr: 'L\'éléphant est le plus grand animal', ru: 'Слон - самое большое животное', isSentence: true },
      ],
    },
    זמן: {
      title: 'זמן וימים',
      description: 'ללמוד מילים הקשורות לזמן',
      vocabulary: [
        { hebrew: 'יום', en: 'Day', ro: 'Zi', it: 'Giorno', fr: 'Jour', ru: 'День', pronunciation: { en: 'day', ro: 'zee', it: 'JOR-noh', fr: 'zhoor', ru: 'dyen' } },
        { hebrew: 'לילה', en: 'Night', ro: 'Noapte', it: 'Notte', fr: 'Nuit', ru: 'Ночь', pronunciation: { en: 'nahyt', ro: 'NWAHP-teh', it: 'NOHT-teh', fr: 'nwee', ru: 'noch' } },
        { hebrew: 'בוקר', en: 'Morning', ro: 'Dimineață', it: 'Mattina', fr: 'Matin', ru: 'Утро', pronunciation: { en: 'MOR-ning', ro: 'dee-mee-NYAH-tsuh', it: 'maht-TEE-nah', fr: 'mah-TAN', ru: 'OOT-roh' } },
        { hebrew: 'צהריים', en: 'Noon', ro: 'Amiază', it: 'Mezzogiorno', fr: 'Midi', ru: 'Полдень', pronunciation: { en: 'noon', ro: 'ah-mee-AH-zuh', it: 'meht-tsoh-JOR-noh', fr: 'mee-DEE', ru: 'POHL-dyen' } },
        { hebrew: 'ערב', en: 'Evening', ro: 'Seară', it: 'Sera', fr: 'Soir', ru: 'Вечер', pronunciation: { en: 'EEV-ning', ro: 'SEH-ah-ruh', it: 'SEH-rah', fr: 'swahr', ru: 'VYEH-cher' } },
        { hebrew: 'שעה', en: 'Hour', ro: 'Oră', it: 'Ora', fr: 'Heure', ru: 'Час', pronunciation: { en: 'owr', ro: 'OH-ruh', it: 'OH-rah', fr: 'uhr', ru: 'chas' } },
        { hebrew: 'דקה', en: 'Minute', ro: 'Minut', it: 'Minuto', fr: 'Minute', ru: 'Минута', pronunciation: { en: 'MIN-it', ro: 'mee-NOOT', it: 'mee-NOO-toh', fr: 'mee-NOOT', ru: 'mee-NOO-tah' } },
        { hebrew: 'שבוע', en: 'Week', ro: 'Săptămână', it: 'Settimana', fr: 'Semaine', ru: 'Неделя', pronunciation: { en: 'week', ro: 'suhp-tuh-MUH-nuh', it: 'seht-tee-MAH-nah', fr: 'suh-MEHN', ru: 'neh-DYEH-lyah' } },
        { hebrew: 'חודש', en: 'Month', ro: 'Lună', it: 'Mese', fr: 'Mois', ru: 'Месяц', pronunciation: { en: 'muhnth', ro: 'LOO-nuh', it: 'MEH-zeh', fr: 'mwah', ru: 'MYEH-syats' } },
        { hebrew: 'שנה', en: 'Year', ro: 'An', it: 'Anno', fr: 'Année', ru: 'Год', pronunciation: { en: 'yeer', ro: 'ahn', it: 'AHN-noh', fr: 'ah-NAY', ru: 'got' } },
      ],
      sentences: [
        { hebrew: 'אני מתעורר כל בוקר בשעה שבע', en: 'I wake up every morning at seven', ro: 'Mă trezesc în fiecare dimineață la ora șapte', it: 'Mi sveglio ogni mattina alle sette', fr: 'Je me réveille tous les matins à sept heures', ru: 'Я просыпаюсь каждое утро в семь часов', isSentence: true },
        { hebrew: 'הפגישה תתקיים מחר בערב', en: 'The meeting will take place tomorrow evening', ro: 'Întâlnirea va avea loc mâine seara', it: 'L\'incontro si terrà domani sera', fr: 'La réunion aura lieu demain soir', ru: 'Встреча состоится завтра вечером', isSentence: true },
        { hebrew: 'אני עובד שמונה שעות ביום', en: 'I work eight hours a day', ro: 'Lucrez opt ore pe zi', it: 'Lavoro otto ore al giorno', fr: 'Je travaille huit heures par jour', ru: 'Я работаю восемь часов в день', isSentence: true },
        { hebrew: 'השבוע עבר מהר מאוד', en: 'The week passed very quickly', ro: 'Săptămâna a trecut foarte repede', it: 'La settimana è passata molto velocemente', fr: 'La semaine est passée très vite', ru: 'Неделя прошла очень быстро', isSentence: true },
      ],
    },
    ימים_בשבוע: {
      title: 'ימים בשבוע',
      description: 'ללמוד את שמות ימי השבוע',
      vocabulary: [
        { hebrew: 'יום ראשון', en: 'Sunday', ro: 'Duminică', it: 'Domenica', fr: 'Dimanche', ru: 'Воскресенье', pronunciation: { en: 'SUN-day', ro: 'doo-mee-NEE-kuh', it: 'doh-MEH-nee-kah', fr: 'dee-MAHNSH', ru: 'vahs-kreh-SYEH-nyeh' } },
        { hebrew: 'יום שני', en: 'Monday', ro: 'Luni', it: 'Lunedì', fr: 'Lundi', ru: 'Понедельник', pronunciation: { en: 'MUHN-day', ro: 'LOO-nee', it: 'loo-neh-DEE', fr: 'luhn-DEE', ru: 'pah-neh-DYEL-neek' } },
        { hebrew: 'יום שלישי', en: 'Tuesday', ro: 'Marți', it: 'Martedì', fr: 'Mardi', ru: 'Вторник', pronunciation: { en: 'TOOZ-day', ro: 'MAHR-tsee', it: 'mahr-teh-DEE', fr: 'mahr-DEE', ru: 'FTOR-neek' } },
        { hebrew: 'יום רביעי', en: 'Wednesday', ro: 'Miercuri', it: 'Mercoledì', fr: 'Mercredi', ru: 'Среда', pronunciation: { en: 'WENZ-day', ro: 'myehr-KOO-ree', it: 'mehr-koh-leh-DEE', fr: 'mehr-kruh-DEE', ru: 'sreh-DAH' } },
        { hebrew: 'יום חמישי', en: 'Thursday', ro: 'Joi', it: 'Giovedì', fr: 'Jeudi', ru: 'Четверг', pronunciation: { en: 'THURZ-day', ro: 'zhoy', it: 'joh-veh-DEE', fr: 'zhuh-DEE', ru: 'chet-VYERG' } },
        { hebrew: 'יום שישי', en: 'Friday', ro: 'Vineri', it: 'Venerdì', fr: 'Vendredi', ru: 'Пятница', pronunciation: { en: 'FRAHY-day', ro: 'vee-NEH-ree', it: 'veh-nehr-DEE', fr: 'vahn-druh-DEE', ru: 'PYAT-nee-tsah' } },
        { hebrew: 'יום שבת', en: 'Saturday', ro: 'Sâmbătă', it: 'Sabato', fr: 'Samedi', ru: 'Суббота', pronunciation: { en: 'SAT-er-day', ro: 'suhm-BUH-tuh', it: 'SAH-bah-toh', fr: 'sah-muh-DEE', ru: 'soo-BOH-tah' } },
        { hebrew: 'היום', en: 'Today', ro: 'Astăzi', it: 'Oggi', fr: 'Aujourd\'hui', ru: 'Сегодня', pronunciation: { en: 'tuh-DAY', ro: 'ahs-TUH-zee', it: 'OHJ-jee', fr: 'oh-zhoor-DWEE', ru: 'seh-VOHD-nyah' } },
        { hebrew: 'מחר', en: 'Tomorrow', ro: 'Mâine', it: 'Domani', fr: 'Demain', ru: 'Завтра', pronunciation: { en: 'tuh-MOR-oh', ro: 'MUH-ee-neh', it: 'doh-MAH-nee', fr: 'duh-MAN', ru: 'ZAHV-trah' } },
        { hebrew: 'אתמול', en: 'Yesterday', ro: 'Ieri', it: 'Ieri', fr: 'Hier', ru: 'Вчера', pronunciation: { en: 'YES-ter-day', ro: 'YEH-ree', it: 'YEH-ree', fr: 'yehr', ru: 'VCHYEH-rah' } },
      ],
      sentences: [
        { hebrew: 'ביום ראשון אני נח ולא עובד', en: 'On Sunday I rest and don\'t work', ro: 'Duminică mă odihnesc și nu lucrez', it: 'Domenica mi riposo e non lavoro', fr: 'Le dimanche je me repose et ne travaille pas', ru: 'В воскресенье я отдыхаю и не работаю', isSentence: true },
        { hebrew: 'ביום שני מתחילה השבוע החדש', en: 'On Monday the new week begins', ro: 'Luni începe săptămâna nouă', it: 'Lunedì inizia la nuova settimana', fr: 'Le lundi commence la nouvelle semaine', ru: 'В понедельник начинается новая неделя', isSentence: true },
        { hebrew: 'מחר יהיה יום רביעי', en: 'Tomorrow will be Wednesday', ro: 'Mâine va fi miercuri', it: 'Domani sarà mercoledì', fr: 'Demain ce sera mercredi', ru: 'Завтра будет среда', isSentence: true },
        { hebrew: 'אני אוהבת את סוף השבוע כי אני יכולה לנוח', en: 'I love the weekend because I can rest', ro: 'Îmi place weekend-ul pentru că pot să mă odihnesc', it: 'Amo il fine settimana perché posso riposare', fr: 'J\'aime le week-end car je peux me reposer', ru: 'Я люблю выходные, потому что могу отдохнуть', isSentence: true },
      ],
    },
    חלקי_גוף: {
      title: 'חלקי גוף',
      description: 'ללמוד שמות חלקי הגוף',
      vocabulary: [
        { hebrew: 'ראש', en: 'Head', ro: 'Cap', it: 'Testa', fr: 'Tête', ru: 'Голова', pronunciation: { en: 'hed', ro: 'kahp', it: 'TEHS-tah', fr: 'teht', ru: 'gah-LOH-vah' } },
        { hebrew: 'עין', en: 'Eye', ro: 'Ochi', it: 'Occhio', fr: 'Œil', ru: 'Глаз', pronunciation: { en: 'ahy', ro: 'OH-kee', it: 'OHK-kyoh', fr: 'uhy', ru: 'glaz' } },
        { hebrew: 'אוזן', en: 'Ear', ro: 'Ureche', it: 'Orecchio', fr: 'Oreille', ru: 'Ухо', pronunciation: { en: 'eer', ro: 'oo-REH-keh', it: 'oh-REHK-kyoh', fr: 'oh-RAY-yuh', ru: 'OO-khah' } },
        { hebrew: 'אף', en: 'Nose', ro: 'Nas', it: 'Naso', fr: 'Nez', ru: 'Нос', pronunciation: { en: 'nohz', ro: 'nahs', it: 'NAH-zoh', fr: 'nay', ru: 'nos' } },
        { hebrew: 'פה', en: 'Mouth', ro: 'Gură', it: 'Bocca', fr: 'Bouche', ru: 'Рот', pronunciation: { en: 'mowth', ro: 'GOO-ruh', it: 'BOHK-kah', fr: 'boosh', ru: 'rot' } },
        { hebrew: 'יד', en: 'Hand', ro: 'Mână', it: 'Mano', fr: 'Main', ru: 'Рука', pronunciation: { en: 'hand', ro: 'MUH-nuh', it: 'MAH-noh', fr: 'man', ru: 'roo-KAH' } },
        { hebrew: 'רגל', en: 'Leg', ro: 'Picior', it: 'Gamba', fr: 'Jambe', ru: 'Нога', pronunciation: { en: 'leg', ro: 'pee-CHOHR', it: 'GAHM-bah', fr: 'zhahmb', ru: 'nah-GAH' } },
        { hebrew: 'ברך', en: 'Knee', ro: 'Genunchi', it: 'Ginocchio', fr: 'Genou', ru: 'Колено', pronunciation: { en: 'nee', ro: 'jeh-NOON-kee', it: 'jee-NOHK-kyoh', fr: 'zhuh-NOO', ru: 'kah-LEH-nah' } },
        { hebrew: 'כתף', en: 'Shoulder', ro: 'Umăr', it: 'Spalla', fr: 'Épaule', ru: 'Плечо', pronunciation: { en: 'SHOHL-der', ro: 'OO-muhr', it: 'SPAHL-lah', fr: 'ay-POHL', ru: 'PLYEH-chah' } },
        { hebrew: 'גב', en: 'Back', ro: 'Spate', it: 'Schiena', fr: 'Dos', ru: 'Спина', pronunciation: { en: 'bak', ro: 'SPAH-teh', it: 'SKYEH-nah', fr: 'dohs', ru: 'spee-NAH' } },
        { hebrew: 'לב', en: 'Heart', ro: 'Inimă', it: 'Cuore', fr: 'Cœur', ru: 'Сердце', pronunciation: { en: 'hahrt', ro: 'ee-NEE-muh', it: 'KWOH-reh', fr: 'kuhr', ru: 'SERD-tseh' } },
        { hebrew: 'שיער', en: 'Hair', ro: 'Păr', it: 'Capelli', fr: 'Cheveux', ru: 'Волосы', pronunciation: { en: 'hair', ro: 'puhr', it: 'kah-PEHL-lee', fr: 'shuh-VUH', ru: 'VOH-lah-sy' } },
        { hebrew: 'אצבע', en: 'Finger', ro: 'Deget', it: 'Dito', fr: 'Doigt', ru: 'Палец', pronunciation: { en: 'FING-ger', ro: 'DEH-jeht', it: 'DEE-toh', fr: 'dwah', ru: 'PAH-lehts' } },
        { hebrew: 'צוואר', en: 'Neck', ro: 'Gât', it: 'Collo', fr: 'Cou', ru: 'Шея', pronunciation: { en: 'nek', ro: 'guht', it: 'KOHL-loh', fr: 'koo', ru: 'SHEH-yah' } },
        { hebrew: 'בטן', en: 'Stomach', ro: 'Burtă', it: 'Stomaco', fr: 'Estomac', ru: 'Живот', pronunciation: { en: 'STUH-muk', ro: 'BOOR-tuh', it: 'STOH-mah-koh', fr: 'ehs-toh-MAHK', ru: 'zhee-VOHT' } },
        { hebrew: 'חזה', en: 'Chest', ro: 'Piept', it: 'Petto', fr: 'Poitrine', ru: 'Грудь', pronunciation: { en: 'chest', ro: 'pyehpt', it: 'PEHT-toh', fr: 'pwah-TREEN', ru: 'grood' } },
        { hebrew: 'ברך', en: 'Elbow', ro: 'Cot', it: 'Gomito', fr: 'Coude', ru: 'Локоть', pronunciation: { en: 'EL-boh', ro: 'koht', it: 'GOH-mee-toh', fr: 'kood', ru: 'LOH-kaht' } },
      ],
      sentences: [
        { hebrew: 'יש לי כאב ראש ואני צריך לנוח', en: 'I have a headache and I need to rest', ro: 'Am dureri de cap și trebuie să mă odihnesc', it: 'Ho mal di testa e devo riposare', fr: 'J\'ai mal à la tête et je dois me reposer', ru: 'У меня болит голова и мне нужно отдохнуть', isSentence: true },
        { hebrew: 'העיניים שלי עייפות אחרי יום ארוך', en: 'My eyes are tired after a long day', ro: 'Ochii mei sunt obosiți după o zi lungă', it: 'I miei occhi sono stanchi dopo una lunga giornata', fr: 'Mes yeux sont fatigués après une longue journée', ru: 'Мои глаза устали после долгого дня', isSentence: true },
        { hebrew: 'אני משתמש בידיים שלי לעבוד', en: 'I use my hands to work', ro: 'Folosesc mâinile mele pentru a lucra', it: 'Uso le mie mani per lavorare', fr: 'J\'utilise mes mains pour travailler', ru: 'Я использую свои руки для работы', isSentence: true },
        { hebrew: 'הלב שלי פועם מהר כשאני מתרגש', en: 'My heart beats fast when I am excited', ro: 'Inima mea bate repede când sunt emoționat', it: 'Il mio cuore batte veloce quando sono emozionato', fr: 'Mon cœur bat vite quand je suis excité', ru: 'Моё сердце бьётся быстро, когда я взволнован', isSentence: true },
      ],
    },
    בגדים: {
      title: 'בגדים ואופנה',
      description: 'ללמוד שמות בגדים',
      vocabulary: [
        { hebrew: 'חולצה', en: 'Shirt', ro: 'Cămașă', it: 'Camicia', fr: 'Chemise', ru: 'Рубашка', pronunciation: { en: 'shurt', ro: 'kuh-MAH-shuh', it: 'kah-MEE-chah', fr: 'shuh-MEEZ', ru: 'roo-BAHSH-kah' } },
        { hebrew: 'מכנסיים', en: 'Pants', ro: 'Pantaloni', it: 'Pantaloni', fr: 'Pantalon', ru: 'Брюки', pronunciation: { en: 'pants', ro: 'pahn-tah-LOH-nee', it: 'pahn-tah-LOH-nee', fr: 'pahn-tah-LOHN', ru: 'BRYOO-kee' } },
        { hebrew: 'שמלה', en: 'Dress', ro: 'Rochiă', it: 'Vestito', fr: 'Robe', ru: 'Платье', pronunciation: { en: 'dres', ro: 'ROH-kee-uh', it: 'vehs-TEE-toh', fr: 'rohb', ru: 'PLAHT-yeh' } },
        { hebrew: 'נעליים', en: 'Shoes', ro: 'Pantofi', it: 'Scarpe', fr: 'Chaussures', ru: 'Обувь', pronunciation: { en: 'shooz', ro: 'pahn-TOH-fee', it: 'SKAHR-peh', fr: 'shoh-SOOR', ru: 'OH-boov' } },
        { hebrew: 'כובע', en: 'Hat', ro: 'Pălărie', it: 'Cappello', fr: 'Chapeau', ru: 'Шляпа', pronunciation: { en: 'hat', ro: 'puh-luh-REE-eh', it: 'kahp-PEHL-loh', fr: 'shah-POH', ru: 'SHLYAH-pah' } },
        { hebrew: 'ג\'קט', en: 'Jacket', ro: 'Jachetă', it: 'Giacca', fr: 'Veste', ru: 'Пиджак', pronunciation: { en: 'JAK-it', ro: 'zhah-KEH-tuh', it: 'JAHK-kah', fr: 'vehst', ru: 'peed-ZHAHK' } },
        { hebrew: 'שעון', en: 'Watch', ro: 'Ceas', it: 'Orologio', fr: 'Montre', ru: 'Часы', pronunciation: { en: 'woch', ro: 'chahs', it: 'oh-roh-LOH-joh', fr: 'mohntr', ru: 'chah-SY' } },
        { hebrew: 'תיק', en: 'Bag', ro: 'Geantă', it: 'Borsa', fr: 'Sac', ru: 'Сумка', pronunciation: { en: 'bag', ro: 'zhahn-TUH', it: 'BOR-sah', fr: 'sahk', ru: 'SOOM-kah' } },
        { hebrew: 'גרביים', en: 'Socks', ro: 'Ciorapi', it: 'Calzini', fr: 'Chaussettes', ru: 'Носки', pronunciation: { en: 'soks', ro: 'choh-RAH-pee', it: 'kahl-TSEE-nee', fr: 'shoh-SEHT', ru: 'nahs-KEE' } },
        { hebrew: 'עניבה', en: 'Tie', ro: 'Cravată', it: 'Cravatta', fr: 'Cravate', ru: 'Галстук', pronunciation: { en: 'tahy', ro: 'krah-VAH-tuh', it: 'krah-VAHT-tah', fr: 'krah-VAHT', ru: 'GAHL-stook' } },
        { hebrew: 'מעיל', en: 'Coat', ro: 'Haină', it: 'Cappotto', fr: 'Manteau', ru: 'Пальто', pronunciation: { en: 'koht', ro: 'HAH-ee-nuh', it: 'kahp-POHT-toh', fr: 'mahn-TOH', ru: 'pahl-TOH' } },
        { hebrew: 'חולצת טריקו', en: 'T-shirt', ro: 'Tricou', it: 'Maglietta', fr: 'T-shirt', ru: 'Футболка', pronunciation: { en: 'TEE-shurt', ro: 'tree-KOH', it: 'mah-LYET-tah', fr: 'tee-shurt', ru: 'foot-BOL-kah' } },
        { hebrew: 'שמלה קצרה', en: 'Skirt', ro: 'Fustă', it: 'Gonna', fr: 'Robe', ru: 'Юбка', pronunciation: { en: 'skurt', ro: 'FOOS-tuh', it: 'GOHN-nah', fr: 'rohb', ru: 'YOOP-kah' } },
        { hebrew: 'נעלי ספורט', en: 'Sneakers', ro: 'Adidași', it: 'Scarpe da ginnastica', fr: 'Baskets', ru: 'Кроссовки', pronunciation: { en: 'SNEE-kerz', ro: 'ah-dee-DAHSH', it: 'SKAHR-peh dah jeen-NAH-stee-kah', fr: 'bahs-KAY', ru: 'krah-SOHV-kee' } },
        { hebrew: 'תחתונים', en: 'Underwear', ro: 'Chiloti', it: 'Biancheria intima', fr: 'Sous-vêtements', ru: 'Нижнее бельё', pronunciation: { en: 'UHN-der-wair', ro: 'kee-LOH-tee', it: 'byahn-keh-REE-ah EEN-tee-mah', fr: 'soo-vayt-MAHN', ru: 'NEEZH-nyeh behl-YOH' } },
      ],
      sentences: [
        { hebrew: 'אני לובשת שמלה כחולה למסיבה', en: 'I am wearing a blue dress to the party', ro: 'Port o rochie albastră la petrecere', it: 'Indosso un vestito blu alla festa', fr: 'Je porte une robe bleue à la fête', ru: 'Я надеваю синее платье на вечеринку', isSentence: true },
        { hebrew: 'החולצה הזו נראית יפה עליך', en: 'This shirt looks good on you', ro: 'Această cămașă ți se potrivește', it: 'Questa camicia ti sta bene', fr: 'Cette chemise te va bien', ru: 'Эта рубашка тебе идёт', isSentence: true },
        { hebrew: 'אני צריך נעליים חדשות כי הישנות קטנות', en: 'I need new shoes because the old ones are small', ro: 'Am nevoie de pantofi noi pentru că cei vechi sunt mici', it: 'Ho bisogno di scarpe nuove perché quelle vecchie sono piccole', fr: 'J\'ai besoin de nouvelles chaussures car les anciennes sont petites', ru: 'Мне нужна новая обувь, потому что старая мала', isSentence: true },
        { hebrew: 'המעיל הזה חם מאוד לחורף', en: 'This coat is very warm for winter', ro: 'Acest palton este foarte cald pentru iarnă', it: 'Questo cappotto è molto caldo per l\'inverno', fr: 'Ce manteau est très chaud pour l\'hiver', ru: 'Это пальто очень тёплое для зимы', isSentence: true },
      ],
    },
    מזג_אוויר: {
      title: 'מזג אוויר',
      description: 'ללמוד מילים הקשורות למזג אוויר',
      vocabulary: [
        { hebrew: 'שמש', en: 'Sun', ro: 'Soare', it: 'Sole', fr: 'Soleil', ru: 'Солнце', pronunciation: { en: 'suhn', ro: 'SWAH-reh', it: 'SOH-leh', fr: 'soh-LAY', ru: 'SOHN-tseh' } },
        { hebrew: 'גשם', en: 'Rain', ro: 'Ploaie', it: 'Pioggia', fr: 'Pluie', ru: 'Дождь', pronunciation: { en: 'rayn', ro: 'PLOY-eh', it: 'PYOHJ-jah', fr: 'plwee', ru: 'dohzhd' } },
        { hebrew: 'שלג', en: 'Snow', ro: 'Zăpadă', it: 'Neve', fr: 'Neige', ru: 'Снег', pronunciation: { en: 'snoh', ro: 'zuh-PAH-duh', it: 'NEH-veh', fr: 'nehzh', ru: 'snyek' } },
        { hebrew: 'רוח', en: 'Wind', ro: 'Vânt', it: 'Vento', fr: 'Vent', ru: 'Ветер', pronunciation: { en: 'wind', ro: 'vuhnt', it: 'VEHN-toh', fr: 'vahn', ru: 'VYEH-ter' } },
        { hebrew: 'ענן', en: 'Cloud', ro: 'Nor', it: 'Nuvola', fr: 'Nuage', ru: 'Облако', pronunciation: { en: 'klowd', ro: 'nohr', it: 'NOO-voh-lah', fr: 'nwahzh', ru: 'OH-blah-kah' } },
        { hebrew: 'חם', en: 'Hot', ro: 'Cald', it: 'Caldo', fr: 'Chaud', ru: 'Жарко', pronunciation: { en: 'hot', ro: 'kahld', it: 'KAHL-doh', fr: 'shoh', ru: 'ZHAR-kah' } },
        { hebrew: 'קר', en: 'Cold', ro: 'Rece', it: 'Freddo', fr: 'Froid', ru: 'Холодно', pronunciation: { en: 'kohld', ro: 'REH-cheh', it: 'FREHD-doh', fr: 'frwah', ru: 'khah-LOHD-nah' } },
        { hebrew: 'חמים', en: 'Warm', ro: 'Călduț', it: 'Caldo', fr: 'Chaud', ru: 'Тепло', pronunciation: { en: 'wawrm', ro: 'kuhl-DOOTS', it: 'KAHL-doh', fr: 'shoh', ru: 'teh-PLOH' } },
        { hebrew: 'מעונן', en: 'Cloudy', ro: 'Înnorat', it: 'Nuvoloso', fr: 'Nuageux', ru: 'Облачно', pronunciation: { en: 'KLOW-dee', ro: 'uhn-noh-RAHT', it: 'noo-voh-LOH-soh', fr: 'nwah-ZHUH', ru: 'ahb-LAHTCH-nah' } },
        { hebrew: 'בהיר', en: 'Bright', ro: 'Luminos', it: 'Luminoso', fr: 'Lumineux', ru: 'Яркий', pronunciation: { en: 'brahyt', ro: 'loo-mee-NOHS', it: 'loo-mee-NOH-soh', fr: 'loo-mee-NUH', ru: 'YAR-kee' } },
        { hebrew: 'ברק', en: 'Lightning', ro: 'Fulger', it: 'Fulmine', fr: 'Éclair', ru: 'Молния', pronunciation: { en: 'LAHYT-ning', ro: 'FOOL-jehr', it: 'FOOL-mee-neh', fr: 'ay-KLEHR', ru: 'MOHL-nyah' } },
        { hebrew: 'רעמים', en: 'Thunder', ro: 'Tunet', it: 'Tuono', fr: 'Tonnerre', ru: 'Гром', pronunciation: { en: 'THUHN-der', ro: 'TOO-neht', it: 'TWOH-noh', fr: 'toh-NEHR', ru: 'grom' } },
        { hebrew: 'ערפל', en: 'Fog', ro: 'Ceață', it: 'Nebbia', fr: 'Brouillard', ru: 'Туман', pronunciation: { en: 'fawg', ro: 'CHAH-tsuh', it: 'NEHB-byah', fr: 'broo-ee-YAHR', ru: 'too-MAHN' } },
        { hebrew: 'קרח', en: 'Ice', ro: 'Gheață', it: 'Ghiaccio', fr: 'Glace', ru: 'Лёд', pronunciation: { en: 'ahys', ro: 'GYAH-tsuh', it: 'GYAHT-choh', fr: 'glahs', ru: 'lyod' } },
        { hebrew: 'טמפרטורה', en: 'Temperature', ro: 'Temperatură', it: 'Temperatura', fr: 'Température', ru: 'Температура', pronunciation: { en: 'TEM-per-uh-chur', ro: 'tehm-peh-rah-TOO-ruh', it: 'tehm-peh-rah-TOO-rah', fr: 'tahn-pay-rah-TOOR', ru: 'tehm-peh-rah-TOO-rah' } },
        { hebrew: 'לחות', en: 'Humidity', ro: 'Umiditate', it: 'Umidità', fr: 'Humidité', ru: 'Влажность', pronunciation: { en: 'hyoo-MID-i-tee', ro: 'oo-mee-dee-TAH-teh', it: 'oo-mee-dee-TAH', fr: 'oo-mee-dee-TAY', ru: 'vlahzh-NOST' } },
        { hebrew: 'רוח חזקה', en: 'Strong wind', ro: 'Vânt puternic', it: 'Vento forte', fr: 'Vent fort', ru: 'Сильный ветер', pronunciation: { en: 'strong wind', ro: 'vuhnt poo-TEHR-neek', it: 'VEHN-toh FOR-teh', fr: 'vahn for', ru: 'SEEL-ny veh-TEHR' } },
        { hebrew: 'סופה', en: 'Storm', ro: 'Furtună', it: 'Tempesta', fr: 'Tempête', ru: 'Буря', pronunciation: { en: 'stawrm', ro: 'foor-TOO-nuh', it: 'tehm-PEHS-tah', fr: 'tahn-PEHT', ru: 'BOO-ryah' } },
        { hebrew: 'טיפות גשם', en: 'Raindrops', ro: 'Picături de ploaie', it: 'Gocce di pioggia', fr: 'Gouttes de pluie', ru: 'Капли дождя', pronunciation: { en: 'RAYN-drops', ro: 'pee-kuh-TOO-ree deh PLOY-eh', it: 'GOH-cheh dee PYOHJ-jah', fr: 'goot duh plwee', ru: 'KAH-plee dahzh-DYAH' } },
      ],
      sentences: [
        { hebrew: 'היום מזג האוויר יפה והשמש זורחת', en: 'Today the weather is nice and the sun is shining', ro: 'Astăzi vremea este frumoasă și soarele strălucește', it: 'Oggi il tempo è bello e il sole splende', fr: 'Aujourd\'hui il fait beau et le soleil brille', ru: 'Сегодня хорошая погода и светит солнце', isSentence: true },
        { hebrew: 'יורד גשם חזק ואני צריך מטריה', en: 'It\'s raining heavily and I need an umbrella', ro: 'Plouă tare și am nevoie de umbrelă', it: 'Piove forte e ho bisogno di un ombrello', fr: 'Il pleut beaucoup et j\'ai besoin d\'un parapluie', ru: 'Идёт сильный дождь и мне нужен зонт', isSentence: true },
        { hebrew: 'הטמפרטורה היום גבוהה מאוד', en: 'The temperature today is very high', ro: 'Temperatura astăzi este foarte ridicată', it: 'La temperatura oggi è molto alta', fr: 'La température aujourd\'hui est très élevée', ru: 'Температура сегодня очень высокая', isSentence: true },
        { hebrew: 'בחורף יורד שלג והכל לבן', en: 'In winter it snows and everything is white', ro: 'Iarna ninge și totul este alb', it: 'In inverno nevica e tutto è bianco', fr: 'En hiver il neige et tout est blanc', ru: 'Зимой идёт снег и всё белое', isSentence: true },
      ],
    },
    פעלים: {
      title: 'פעלים בסיסיים',
      description: 'ללמוד פעלים שימושיים',
      vocabulary: [
        { hebrew: 'ללכת', en: 'To walk', ro: 'A merge', it: 'Camminare', fr: 'Marcher', ru: 'Идти', pronunciation: { en: 'tu wawk', ro: 'ah MEHR-jeh', it: 'kahm-mee-NAH-reh', fr: 'mahr-SHAY', ru: 'eed-TEE' } },
        { hebrew: 'לרוץ', en: 'To run', ro: 'A alerga', it: 'Correre', fr: 'Courir', ru: 'Бежать', pronunciation: { en: 'tu ruhn', ro: 'ah ah-lehr-GAH', it: 'kohr-REH-reh', fr: 'koo-REER', ru: 'beh-ZHAHT' } },
        { hebrew: 'לאכול', en: 'To eat', ro: 'A mânca', it: 'Mangiare', fr: 'Manger', ru: 'Есть', pronunciation: { en: 'tu eet', ro: 'ah muhn-KAH', it: 'mahn-JAH-reh', fr: 'mahn-ZHAY', ru: 'yest' } },
        { hebrew: 'לשתות', en: 'To drink', ro: 'A bea', it: 'Bere', fr: 'Boire', ru: 'Пить', pronunciation: { en: 'tu drink', ro: 'ah BEH-ah', it: 'BEH-reh', fr: 'bwahr', ru: 'peet' } },
        { hebrew: 'לישון', en: 'To sleep', ro: 'A dormi', it: 'Dormire', fr: 'Dormir', ru: 'Спать', pronunciation: { en: 'tu sleep', ro: 'ah dohr-MEE', it: 'dohr-MEE-reh', fr: 'dohr-MEER', ru: 'spat' } },
        { hebrew: 'לקרוא', en: 'To read', ro: 'A citi', it: 'Leggere', fr: 'Lire', ru: 'Читать', pronunciation: { en: 'tu reed', ro: 'ah chee-TEE', it: 'LEHD-jeh-reh', fr: 'leer', ru: 'chee-TAHT' } },
        { hebrew: 'לכתוב', en: 'To write', ro: 'A scrie', it: 'Scrivere', fr: 'Écrire', ru: 'Писать', pronunciation: { en: 'tu rahyt', ro: 'ah SKREE-eh', it: 'SKREE-veh-reh', fr: 'ay-KREER', ru: 'pee-SAHT' } },
        { hebrew: 'לדבר', en: 'To speak', ro: 'A vorbi', it: 'Parlare', fr: 'Parler', ru: 'Говорить', pronunciation: { en: 'tu speek', ro: 'ah vohr-BEE', it: 'pahr-LAH-reh', fr: 'pahr-LAY', ru: 'gah-vah-REET' } },
        { hebrew: 'לשמוע', en: 'To hear', ro: 'A auzi', it: 'Sentire', fr: 'Entendre', ru: 'Слышать', pronunciation: { en: 'tu heer', ro: 'ah ah-OO-zee', it: 'sehn-TEE-reh', fr: 'ahn-TAHN-druh', ru: 'SLY-shuht' } },
        { hebrew: 'לראות', en: 'To see', ro: 'A vedea', it: 'Vedere', fr: 'Voir', ru: 'Видеть', pronunciation: { en: 'tu see', ro: 'ah veh-DEH-ah', it: 'veh-DEH-reh', fr: 'vwahr', ru: 'VEE-deht' } },
        { hebrew: 'לחשוב', en: 'To think', ro: 'A gândi', it: 'Pensare', fr: 'Penser', ru: 'Думать', pronunciation: { en: 'tu thingk', ro: 'ah guhn-DEE', it: 'pehn-SAH-reh', fr: 'pahn-SAY', ru: 'DOO-maht' } },
        { hebrew: 'לאהוב', en: 'To love', ro: 'A iubi', it: 'Amare', fr: 'Aimer', ru: 'Любить', pronunciation: { en: 'tu luhv', ro: 'ah yoo-BEE', it: 'ah-MAH-reh', fr: 'ay-MAY', ru: 'lyoo-BEET' } },
        { hebrew: 'ללמוד', en: 'To learn', ro: 'A învăța', it: 'Imparare', fr: 'Apprendre', ru: 'Учиться', pronunciation: { en: 'tu lern', ro: 'ah uhn-vuh-TSAH', it: 'eem-pah-RAH-reh', fr: 'ah-PRAHNDR', ru: 'oo-CHEET-syah' } },
        { hebrew: 'לעבוד', en: 'To work', ro: 'A lucra', it: 'Lavorare', fr: 'Travailler', ru: 'Работать', pronunciation: { en: 'tu wurk', ro: 'ah loo-KRAH', it: 'lah-voh-RAH-reh', fr: 'trah-vah-YAY', ru: 'rah-bah-TAHT' } },
        { hebrew: 'לקנות', en: 'To buy', ro: 'A cumpăra', it: 'Comprare', fr: 'Acheter', ru: 'Покупать', pronunciation: { en: 'tu bahy', ro: 'ah koom-puh-RAH', it: 'kohm-PRAH-reh', fr: 'ah-shuh-TAY', ru: 'pah-koo-PAHT' } },
        { hebrew: 'למכור', en: 'To sell', ro: 'A vinde', it: 'Vendere', fr: 'Vendre', ru: 'Продавать', pronunciation: { en: 'tu sel', ro: 'ah VEEN-deh', it: 'vehn-DEH-reh', fr: 'vahndr', ru: 'prah-dah-VAHT' } },
        { hebrew: 'לשחק', en: 'To play', ro: 'A juca', it: 'Giocare', fr: 'Jouer', ru: 'Играть', pronunciation: { en: 'tu play', ro: 'ah zhoo-KAH', it: 'joh-KAH-reh', fr: 'zhoo-AY', ru: 'ee-GRAHT' } },
        { hebrew: 'לשיר', en: 'To sing', ro: 'A cânta', it: 'Cantare', fr: 'Chanter', ru: 'Петь', pronunciation: { en: 'tu sing', ro: 'ah kuhn-TAH', it: 'kahn-TAH-reh', fr: 'shahn-TAY', ru: 'pyet' } },
        { hebrew: 'לרקוד', en: 'To dance', ro: 'A dansa', it: 'Ballare', fr: 'Danser', ru: 'Танцевать', pronunciation: { en: 'tu dans', ro: 'ah dahn-SAH', it: 'bahl-LAH-reh', fr: 'dahn-SAY', ru: 'tahn-tseh-VAHT' } },
        { hebrew: 'לצחוק', en: 'To laugh', ro: 'A râde', it: 'Ridere', fr: 'Rire', ru: 'Смеяться', pronunciation: { en: 'tu laf', ro: 'ah RUH-deh', it: 'REE-deh-reh', fr: 'reer', ru: 'smeh-YAHT-syah' } },
        { hebrew: 'לבכות', en: 'To cry', ro: 'A plânge', it: 'Piangere', fr: 'Pleurer', ru: 'Плакать', pronunciation: { en: 'tu krahy', ro: 'ah PLUHN-jeh', it: 'pyahn-JEH-reh', fr: 'pluh-RAY', ru: 'PLAH-kaht' } },
        { hebrew: 'לחייך', en: 'To smile', ro: 'A zâmbi', it: 'Sorridere', fr: 'Sourire', ru: 'Улыбаться', pronunciation: { en: 'tu smahyl', ro: 'ah ZUHM-bee', it: 'sohr-REE-deh-reh', fr: 'soo-REER', ru: 'oo-ly-BAHT-syah' } },
        { hebrew: 'להבין', en: 'To understand', ro: 'A înțelege', it: 'Capire', fr: 'Comprendre', ru: 'Понимать', pronunciation: { en: 'tu uhn-der-STAND', ro: 'ah uhn-tseh-LEH-jeh', it: 'kah-PEE-reh', fr: 'kohm-PRAHNDR', ru: 'pah-nee-MAHT' } },
        { hebrew: 'לשכוח', en: 'To forget', ro: 'A uita', it: 'Dimenticare', fr: 'Oublier', ru: 'Забывать', pronunciation: { en: 'tu fer-GET', ro: 'ah oo-EE-tah', it: 'dee-mehn-tee-KAH-reh', fr: 'oo-blee-AY', ru: 'zah-by-VAHT' } },
        { hebrew: 'לזכור', en: 'To remember', ro: 'A-și aminti', it: 'Ricordare', fr: 'Se souvenir', ru: 'Помнить', pronunciation: { en: 'tu ri-MEM-ber', ro: 'ah shee ah-meen-TEE', it: 'ree-kohr-DAH-reh', fr: 'suh soo-vuh-NEER', ru: 'POHM-neet' } },
        { hebrew: 'להתחיל', en: 'To start', ro: 'A începe', it: 'Iniziare', fr: 'Commencer', ru: 'Начинать', pronunciation: { en: 'tu stahrt', ro: 'ah uhn-CHEH-peh', it: 'ee-nee-TSYAH-reh', fr: 'koh-mahn-SAY', ru: 'nah-chee-NAHT' } },
        { hebrew: 'לסיים', en: 'To finish', ro: 'A termina', it: 'Finire', fr: 'Finir', ru: 'Заканчивать', pronunciation: { en: 'tu FIN-ish', ro: 'ah tehr-mee-NAH', it: 'fee-NEE-reh', fr: 'fee-NEER', ru: 'zah-KAHN-chee-vaht' } },
        { hebrew: 'להפסיק', en: 'To stop', ro: 'A opri', it: 'Fermare', fr: 'Arrêter', ru: 'Останавливать', pronunciation: { en: 'tu stop', ro: 'ah oh-PREE', it: 'fehr-MAH-reh', fr: 'ah-RAY-tay', ru: 'ah-stah-NAV-lee-vaht' } },
        { hebrew: 'להמשיך', en: 'To continue', ro: 'A continua', it: 'Continuare', fr: 'Continuer', ru: 'Продолжать', pronunciation: { en: 'tu kun-TIN-yoo', ro: 'ah kohn-tee-NOO-ah', it: 'kohn-tee-NOO-ah-reh', fr: 'kohn-tee-NOO-ay', ru: 'prah-dahl-ZHAHT' } },
      ],
      sentences: [
        { hebrew: 'אני הולך לעבודה כל בוקר בשמונה', en: 'I go to work every morning at eight', ro: 'Merg la muncă în fiecare dimineață la opt', it: 'Vado al lavoro ogni mattina alle otto', fr: 'Je vais au travail tous les matins à huit heures', ru: 'Я иду на работу каждое утро в восемь', isSentence: true },
        { hebrew: 'הוא אוהב לקרוא ספרים בערב', en: 'He likes to read books in the evening', ro: 'Îi place să citească cărți seara', it: 'Gli piace leggere libri la sera', fr: 'Il aime lire des livres le soir', ru: 'Он любит читать книги вечером', isSentence: true },
        { hebrew: 'אנחנו לומדים שפה חדשה ביחד', en: 'We are learning a new language together', ro: 'Învățăm o limbă nouă împreună', it: 'Stiamo imparando una nuova lingua insieme', fr: 'Nous apprenons une nouvelle langue ensemble', ru: 'Мы изучаем новый язык вместе', isSentence: true },
        { hebrew: 'היא רוצה לקנות בית חדש', en: 'She wants to buy a new house', ro: 'Vrea să cumpere o casă nouă', it: 'Vuole comprare una casa nuova', fr: 'Elle veut acheter une nouvelle maison', ru: 'Она хочет купить новый дом', isSentence: true },
      ],
    },
    נסיעות: {
      title: 'נסיעות ותיירות',
      description: 'מילים שימושיות לנסיעות',
      vocabulary: [
        { hebrew: 'נסיעה', en: 'Trip', ro: 'Călătorie', it: 'Viaggio', fr: 'Voyage', ru: 'Поездка', pronunciation: { en: 'trip', ro: 'kuh-luh-TOH-ree-eh', it: 'VYAHJ-joh', fr: 'vwah-YAHZH', ru: 'pah-YEZD-kah' } },
        { hebrew: 'מלון', en: 'Hotel', ro: 'Hotel', it: 'Hotel', fr: 'Hôtel', ru: 'Отель', pronunciation: { en: 'hoh-TEL', ro: 'hoh-TEHL', it: 'oh-TEHL', fr: 'oh-TEHL', ru: 'ah-TEHL' } },
        { hebrew: 'תעודת זהות', en: 'ID card', ro: 'Carte de identitate', it: 'Carta d\'identità', fr: 'Carte d\'identité', ru: 'Удостоверение личности', pronunciation: { en: 'ahy dee kard', ro: 'KAHR-teh deh ee-dehn-tee-TAH-teh', it: 'KAHR-tah dee-dehn-tee-TAH', fr: 'kahrt dee-dehn-tee-TAY', ru: 'oo-dah-stah-veh-REH-nyeh leech-NOHS-tee' } },
        { hebrew: 'דרכון', en: 'Passport', ro: 'Pașaport', it: 'Passaporto', fr: 'Passeport', ru: 'Паспорт', pronunciation: { en: 'PAS-port', ro: 'pah-shah-POHRT', it: 'pahs-sah-POR-toh', fr: 'pahs-POR', ru: 'pahs-PORT' } },
        { hebrew: 'כרטיס טיסה', en: 'Flight ticket', ro: 'Bilet de avion', it: 'Biglietto aereo', fr: 'Billet d\'avion', ru: 'Авиабилет', pronunciation: { en: 'flahyt TIK-it', ro: 'bee-LEHT deh ah-vee-OHN', it: 'bee-LYEHT-toh ah-EH-reh-oh', fr: 'bee-YAY dee-ah-VYOHN', ru: 'ah-vee-ah-bee-LYET' } },
        { hebrew: 'תיק נסיעות', en: 'Suitcase', ro: 'Valiză', it: 'Valigia', fr: 'Valise', ru: 'Чемодан', pronunciation: { en: 'SOOT-kays', ro: 'vah-LEE-zuh', it: 'vah-LEE-jah', fr: 'vah-LEEZ', ru: 'cheh-mah-DAHN' } },
        { hebrew: 'מפה', en: 'Map', ro: 'Hartă', it: 'Mappa', fr: 'Carte', ru: 'Карта', pronunciation: { en: 'map', ro: 'HAHR-tuh', it: 'MAHP-pah', fr: 'kahrt', ru: 'KAHR-tah' } },
        { hebrew: 'מדריך', en: 'Guide', ro: 'Ghid', it: 'Guida', fr: 'Guide', ru: 'Гид', pronunciation: { en: 'gahyd', ro: 'geed', it: 'GWEE-dah', fr: 'geed', ru: 'geed' } },
        { hebrew: 'אתר תיירות', en: 'Tourist attraction', ro: 'Atracție turistică', it: 'Attrazione turistica', fr: 'Attraction touristique', ru: 'Туристическая достопримечательность', pronunciation: { en: 'TOOR-ist uh-TRAK-shun', ro: 'ah-TRAHK-tsee-eh too-REES-tee-kuh', it: 'aht-trah-TSYOH-neh too-REES-tee-kah', fr: 'ah-trahk-SYOHN too-REES-teek', ru: 'too-REES-tee-cheh-skah-yah dah-stah-pree-meh-CHAH-tehl-NOST' } },
        { hebrew: 'צילום', en: 'Photo', ro: 'Fotografie', it: 'Foto', fr: 'Photo', ru: 'Фото', pronunciation: { en: 'FOH-toh', ro: 'foh-toh-grah-FEE-eh', it: 'FOH-toh', fr: 'foh-TOH', ru: 'foh-TOH' } },
      ],
      sentences: [
        { hebrew: 'אני צריך להזמין חדר במלון לשלושה לילות', en: 'I need to book a hotel room for three nights', ro: 'Trebuie să rezerv o cameră de hotel pentru trei nopți', it: 'Devo prenotare una camera d\'hotel per tre notti', fr: 'Je dois réserver une chambre d\'hôtel pour trois nuits', ru: 'Мне нужно забронировать номер в отеле на три ночи', isSentence: true },
        { hebrew: 'איפה אפשר לקנות כרטיס טיסה?', en: 'Where can I buy a flight ticket?', ro: 'Unde pot cumpăra un bilet de avion?', it: 'Dove posso comprare un biglietto aereo?', fr: 'Où puis-je acheter un billet d\'avion?', ru: 'Где я могу купить авиабилет?', isSentence: true },
        { hebrew: 'המדריך הסביר לנו על ההיסטוריה של המקום', en: 'The guide explained to us about the history of the place', ro: 'Ghidul ne-a explicat despre istoria locului', it: 'La guida ci ha spiegato la storia del luogo', fr: 'Le guide nous a expliqué l\'histoire du lieu', ru: 'Гид объяснил нам историю этого места', isSentence: true },
        { hebrew: 'אנחנו רוצים לצלם הרבה תמונות במהלך הנסיעה', en: 'We want to take many photos during the trip', ro: 'Vrem să facem multe fotografii în timpul călătoriei', it: 'Vogliamo fare molte foto durante il viaggio', fr: 'Nous voulons prendre beaucoup de photos pendant le voyage', ru: 'Мы хотим сделать много фотографий во время поездки', isSentence: true },
      ],
    },
    בית: {
      title: 'בית ומשפחה',
      description: 'מילים הקשורות לבית ולמשפחה',
      vocabulary: [
        { hebrew: 'דירה', en: 'Apartment', ro: 'Apartament', it: 'Appartamento', fr: 'Appartement', ru: 'Квартира', pronunciation: { en: 'uh-PAHRT-ment', ro: 'ah-pahr-tah-MENT', it: 'ahp-pahr-tah-MEHN-toh', fr: 'ah-pahr-tuh-MAHN', ru: 'kvahr-TEE-rah' } },
        { hebrew: 'חדר', en: 'Room', ro: 'Cameră', it: 'Stanza', fr: 'Chambre', ru: 'Комната', pronunciation: { en: 'room', ro: 'kah-MEH-ruh', it: 'STAHN-zah', fr: 'shahmbr', ru: 'KOHM-nah-tah' } },
        { hebrew: 'מטבח', en: 'Kitchen', ro: 'Bucătărie', it: 'Cucina', fr: 'Cuisine', ru: 'Кухня', pronunciation: { en: 'KICH-en', ro: 'boo-kuh-tuh-REE-eh', it: 'koo-CHEE-nah', fr: 'kwee-ZEEN', ru: 'KOOKH-nyah' } },
        { hebrew: 'סלון', en: 'Living room', ro: 'Sufragerie', it: 'Salotto', fr: 'Salon', ru: 'Гостиная', pronunciation: { en: 'LIV-ing room', ro: 'soo-frah-jeh-REE-eh', it: 'sah-LOHT-toh', fr: 'sah-LOHN', ru: 'gah-STEE-nah-yah' } },
        { hebrew: 'שולחן', en: 'Table', ro: 'Masă', it: 'Tavolo', fr: 'Table', ru: 'Стол', pronunciation: { en: 'TAY-bul', ro: 'MAH-suh', it: 'TAH-voh-loh', fr: 'tahbl', ru: 'stol' } },
        { hebrew: 'כיסא', en: 'Chair', ro: 'Scaun', it: 'Sedia', fr: 'Chaise', ru: 'Стул', pronunciation: { en: 'chair', ro: 'skah-OON', it: 'SEH-dyah', fr: 'shehz', ru: 'stool' } },
        { hebrew: 'מיטה', en: 'Bed', ro: 'Pat', it: 'Letto', fr: 'Lit', ru: 'Кровать', pronunciation: { en: 'bed', ro: 'paht', it: 'LEHT-toh', fr: 'lee', ru: 'krah-VAHT' } },
        { hebrew: 'חלון', en: 'Window', ro: 'Fereastră', it: 'Finestra', fr: 'Fenêtre', ru: 'Окно', pronunciation: { en: 'WIN-doh', ro: 'feh-reh-AHS-truh', it: 'fee-NEHS-trah', fr: 'fuh-NEHTR', ru: 'ahk-NOH' } },
        { hebrew: 'דלת', en: 'Door', ro: 'Ușă', it: 'Porta', fr: 'Porte', ru: 'Дверь', pronunciation: { en: 'dor', ro: 'OO-shuh', it: 'POR-tah', fr: 'port', ru: 'dvyer' } },
        { hebrew: 'משפחה', en: 'Family', ro: 'Familie', it: 'Famiglia', fr: 'Famille', ru: 'Семья', pronunciation: { en: 'FAM-uh-lee', ro: 'fah-MEE-lee-eh', it: 'fah-MEE-lyah', fr: 'fah-MEE-yuh', ru: 'seh-MYAH' } },
        { hebrew: 'אבא', en: 'Father', ro: 'Tată', it: 'Padre', fr: 'Père', ru: 'Отец', pronunciation: { en: 'FAH-ther', ro: 'TAH-tuh', it: 'PAH-dreh', fr: 'pehr', ru: 'ah-TYETS' } },
        { hebrew: 'אמא', en: 'Mother', ro: 'Mamă', it: 'Madre', fr: 'Mère', ru: 'Мать', pronunciation: { en: 'MUH-ther', ro: 'MAH-muh', it: 'MAH-dreh', fr: 'mehr', ru: 'maht' } },
        { hebrew: 'אח', en: 'Brother', ro: 'Frate', it: 'Fratello', fr: 'Frère', ru: 'Брат', pronunciation: { en: 'BRUH-ther', ro: 'FRAH-teh', it: 'frah-TEHL-loh', fr: 'frehr', ru: 'braht' } },
        { hebrew: 'אחות', en: 'Sister', ro: 'Soră', it: 'Sorella', fr: 'Sœur', ru: 'Сестра', pronunciation: { en: 'SIS-ter', ro: 'SOH-ruh', it: 'soh-REHL-lah', fr: 'suhr', ru: 'seh-STRAH' } },
      ],
      sentences: [
        { hebrew: 'הבית שלנו גדול ויש בו שלושה חדרים', en: 'Our house is big and has three rooms', ro: 'Casa noastră este mare și are trei camere', it: 'La nostra casa è grande e ha tre stanze', fr: 'Notre maison est grande et a trois chambres', ru: 'Наш дом большой и в нём три комнаты', isSentence: true },
        { hebrew: 'אני אוהב לבלות זמן עם המשפחה שלי', en: 'I love spending time with my family', ro: 'Îmi place să petrec timp cu familia mea', it: 'Mi piace passare il tempo con la mia famiglia', fr: 'J\'aime passer du temps avec ma famille', ru: 'Я люблю проводить время с семьёй', isSentence: true },
        { hebrew: 'המטבח הוא המקום הכי נעים בבית', en: 'The kitchen is the most pleasant place in the house', ro: 'Bucătăria este locul cel mai plăcut din casă', it: 'La cucina è il posto più piacevole della casa', fr: 'La cuisine est l\'endroit le plus agréable de la maison', ru: 'Кухня - самое приятное место в доме', isSentence: true },
        { hebrew: 'אחי ואני גרים באותה דירה', en: 'My brother and I live in the same apartment', ro: 'Fratele meu și eu locuim în același apartament', it: 'Mio fratello e io viviamo nello stesso appartamento', fr: 'Mon frère et moi vivons dans le même appartement', ru: 'Мой брат и я живём в одной квартире', isSentence: true },
      ],
    },
  },
  INTERMEDIATE: {
    נסיעות: {
      title: 'נסיעות ותיירות',
      description: 'מילים שימושיות לטיולים',
      vocabulary: [
        { hebrew: 'שדה תעופה', en: 'Airport', ro: 'Aeroport', it: 'Aeroporto', fr: 'Aéroport', ru: 'Аэропорт', pronunciation: { en: 'AIR-port', ro: 'ah-eh-roh-PORT', it: 'ah-eh-roh-POR-toh', fr: 'ah-ay-roh-POR', ru: 'ah-eh-rah-PORT' } },
        { hebrew: 'מלון', en: 'Hotel', ro: 'Hotel', it: 'Hotel', fr: 'Hôtel', ru: 'Отель', pronunciation: { en: 'hoh-TEL', ro: 'hoh-TEL', it: 'oh-TEL', fr: 'oh-TEL', ru: 'ah-TEL' } },
        { hebrew: 'כרטיס', en: 'Ticket', ro: 'Bilet', it: 'Biglietto', fr: 'Billet', ru: 'Билет', pronunciation: { en: 'TIK-et', ro: 'bee-LET', it: 'bee-LYET-toh', fr: 'bee-YAY', ru: 'bee-LYET' } },
        { hebrew: 'תיק', en: 'Suitcase', ro: 'Valiză', it: 'Valigia', fr: 'Valise', ru: 'Чемодан', pronunciation: { en: 'SOOT-kays', ro: 'vah-LEE-zuh', it: 'vah-LEE-jah', fr: 'vah-LEEZ', ru: 'cheh-mah-DAHN' }, alternatives: { ru: ['Сумка', 'Рюкзак'] } },
        { hebrew: 'מפה', en: 'Map', ro: 'Hartă', it: 'Mappa', fr: 'Carte', ru: 'Карта', pronunciation: { en: 'map', ro: 'HAHR-tuh', it: 'MAHP-pah', fr: 'kahrt', ru: 'KAR-tah' }, alternatives: { ru: ['План'] } },
        { hebrew: 'דרכון', en: 'Passport', ro: 'Pașaport', it: 'Passaporto', fr: 'Passeport', ru: 'Паспорт', pronunciation: { en: 'PAS-port', ro: 'pah-shah-PORT', it: 'pahs-sah-POR-toh', fr: 'pahs-POR', ru: 'pahs-PORT' } },
        { hebrew: 'ויזה', en: 'Visa', ro: 'Viză', it: 'Visto', fr: 'Visa', ru: 'Виза', pronunciation: { en: 'VEE-zuh', ro: 'VEE-zuh', it: 'VEE-stoh', fr: 'VEE-zah', ru: 'VEE-zah' } },
        { hebrew: 'תייר', en: 'Tourist', ro: 'Turist', it: 'Turista', fr: 'Touriste', ru: 'Турист', pronunciation: { en: 'TOOR-ist', ro: 'too-REEST', it: 'too-REE-stah', fr: 'too-REEST', ru: 'too-REEST' } },
        { hebrew: 'טיול', en: 'Trip', ro: 'Excursie', it: 'Gita', fr: 'Voyage', ru: 'Поездка', pronunciation: { en: 'trip', ro: 'ehk-SKOOR-see-eh', it: 'JEE-tah', fr: 'vwah-YAHZH', ru: 'pah-YEZD-kah' } },
        { hebrew: 'חופשה', en: 'Vacation', ro: 'Vacanță', it: 'Vacanza', fr: 'Vacances', ru: 'Отпуск', pronunciation: { en: 'vay-KAY-shun', ro: 'vah-KAHN-tsuh', it: 'vah-KAHN-zah', fr: 'vah-KAHNS', ru: 'OHT-poosk' } },
        { hebrew: 'חוף', en: 'Beach', ro: 'Plajă', it: 'Spiaggia', fr: 'Plage', ru: 'Пляж', pronunciation: { en: 'beech', ro: 'PLAH-zhuh', it: 'SPYAHJ-jah', fr: 'plahzh', ru: 'plyazh' } },
        { hebrew: 'מוזיאון', en: 'Museum', ro: 'Muzeu', it: 'Museo', fr: 'Musée', ru: 'Музей', pronunciation: { en: 'myoo-ZEE-um', ro: 'moo-ZEH-oo', it: 'moo-ZEH-oh', fr: 'moo-ZAY', ru: 'moo-ZAY' } },
        { hebrew: 'אטרקציה', en: 'Attraction', ro: 'Atracție', it: 'Attrazione', fr: 'Attraction', ru: 'Достопримечательность', pronunciation: { en: 'uh-TRAK-shun', ro: 'ah-TRAHK-tsee-eh', it: 'aht-traht-TSYOH-neh', fr: 'ah-trahk-SYOHN', ru: 'dahs-tah-pree-meh-CHAH-teel-nahst' } },
      ],
    },
    בית: {
      title: 'בית ומשפחה',
      description: 'מילים הקשורות לחיי בית',
      vocabulary: [
        { hebrew: 'סלון', en: 'Living room', ro: 'Sufragerie', it: 'Soggiorno', fr: 'Salon', ru: 'Гостиная', pronunciation: { en: 'LIV-ing room', ro: 'soo-frah-jeh-REE-eh', it: 'sohj-JOR-noh', fr: 'sah-LOHN', ru: 'gahs-tee-NAH-yah' } },
        { hebrew: 'מטבח', en: 'Kitchen', ro: 'Bucătărie', it: 'Cucina', fr: 'Cuisine', ru: 'Кухня', pronunciation: { en: 'KICH-en', ro: 'boo-kuh-tuh-REE-eh', it: 'koo-CHEE-nah', fr: 'kwee-ZEEN', ru: 'KOOKH-nyah' } },
        { hebrew: 'שולחן', en: 'Table', ro: 'Masă', it: 'Tavolo', fr: 'Table', ru: 'Стол', pronunciation: { en: 'TAY-bul', ro: 'MAH-suh', it: 'TAH-voh-loh', fr: 'TAH-bluh', ru: 'stol' } },
        { hebrew: 'כיסא', en: 'Chair', ro: 'Scaun', it: 'Sedia', fr: 'Chaise', ru: 'Стул', pronunciation: { en: 'chair', ro: 'skah-OON', it: 'SEH-dee-ah', fr: 'shehz', ru: 'stool' } },
        { hebrew: 'חלון', en: 'Window', ro: 'Fereastră', it: 'Finestra', fr: 'Fenêtre', ru: 'Окно', pronunciation: { en: 'WIN-doh', ro: 'feh-reh-AHS-truh', it: 'fee-NEHS-trah', fr: 'fuh-NEH-truh', ru: 'ahk-NOH' } },
        { hebrew: 'דלת', en: 'Door', ro: 'Ușă', it: 'Porta', fr: 'Porte', ru: 'Дверь', pronunciation: { en: 'dor', ro: 'OO-shuh', it: 'POR-tah', fr: 'port', ru: 'dvyer' } },
        { hebrew: 'מיטה', en: 'Bed', ro: 'Pat', it: 'Letto', fr: 'Lit', ru: 'Кровать', pronunciation: { en: 'bed', ro: 'paht', it: 'LEHT-toh', fr: 'lee', ru: 'krah-VAHT' } },
        { hebrew: 'כרית', en: 'Pillow', ro: 'Pernă', it: 'Cuscino', fr: 'Oreiller', ru: 'Подушка', pronunciation: { en: 'PIL-oh', ro: 'PEHR-nuh', it: 'koo-SHEE-noh', fr: 'oh-ray-YAY', ru: 'pah-DOOSH-kah' } },
        { hebrew: 'שמיכה', en: 'Blanket', ro: 'Pătură', it: 'Coperta', fr: 'Couverture', ru: 'Одеяло', pronunciation: { en: 'BLANG-kit', ro: 'puh-TOO-ruh', it: 'koh-PEHR-tah', fr: 'koo-vehr-TOOR', ru: 'ah-deh-YAH-lah' } },
        { hebrew: 'מנורה', en: 'Lamp', ro: 'Lampă', it: 'Lampada', fr: 'Lampe', ru: 'Лампа', pronunciation: { en: 'lamp', ro: 'LAHM-puh', it: 'LAHM-pah-dah', fr: 'lahmp', ru: 'LAHM-pah' } },
        { hebrew: 'טלוויזיה', en: 'Television', ro: 'Televizor', it: 'Televisore', fr: 'Télévision', ru: 'Телевизор', pronunciation: { en: 'TEL-uh-vizh-un', ro: 'teh-leh-vee-ZOHR', it: 'teh-leh-vee-ZOH-reh', fr: 'tay-lay-vee-ZYOHN', ru: 'teh-leh-VEE-zahr' } },
        { hebrew: 'מקרר', en: 'Refrigerator', ro: 'Frigider', it: 'Frigorifero', fr: 'Réfrigérateur', ru: 'Холодильник', pronunciation: { en: 'ri-FRIJ-uh-rey-ter', ro: 'free-jee-DEHR', it: 'free-goh-REE-feh-roh', fr: 'ray-free-zhay-rah-TUHR', ru: 'khah-lah-DEEL-neek' } },
        { hebrew: 'תנור', en: 'Oven', ro: 'Cuptor', it: 'Forno', fr: 'Four', ru: 'Духовка', pronunciation: { en: 'UHV-en', ro: 'koop-TOHR', it: 'FOR-noh', fr: 'foor', ru: 'doo-KHOV-kah' } },
        { hebrew: 'מכונת כביסה', en: 'Washing machine', ro: 'Mașină de spălat', it: 'Lavatrice', fr: 'Lave-linge', ru: 'Стиральная машина', pronunciation: { en: 'WOSH-ing muh-SHEEN', ro: 'mah-SHEE-nuh deh spuh-LAHT', it: 'lah-vah-TREE-cheh', fr: 'lahv-LANZH', ru: 'stee-RAHL-nah-yah mah-SHEE-nah' } },
        { hebrew: 'מגבת', en: 'Towel', ro: 'Prosop', it: 'Asciugamano', fr: 'Serviette', ru: 'Полотенце', pronunciation: { en: 'TOW-ul', ro: 'proh-SOHP', it: 'ah-shoo-gah-MAH-noh', fr: 'sehr-VYET', ru: 'pah-lah-TYEN-tseh' } },
      ],
    },
    קניות: {
      title: 'קניות ושווקים',
      description: 'מילים שימושיות לקניות',
      vocabulary: [
        { hebrew: 'חנות', en: 'Shop', ro: 'Magazin', it: 'Negozio', fr: 'Magasin', ru: 'Магазин', pronunciation: { en: 'shop', ro: 'mah-gah-ZEEN', it: 'neh-GOH-tsee-oh', fr: 'mah-gah-ZAN', ru: 'mah-gah-ZEEN' } },
        { hebrew: 'כמה זה עולה?', en: 'How much does it cost?', ro: 'Cât costă?', it: 'Quanto costa?', fr: 'Combien ça coûte?', ru: 'Сколько это стоит?', pronunciation: { en: 'how much', ro: 'kuht KOHS-tuh', it: 'KWAHN-toh KOHS-tah', fr: 'kohm-BYAN sah koot', ru: 'SKOL-kah eh-TAH STOH-eet' } },
        { hebrew: 'תשלום', en: 'Payment', ro: 'Plată', it: 'Pagamento', fr: 'Paiement', ru: 'Оплата', pronunciation: { en: 'PAY-ment', ro: 'PLAH-tuh', it: 'pah-gah-MEN-toh', fr: 'pay-MAHN', ru: 'ah-PLAH-tah' } },
        { hebrew: 'מחיר', en: 'Price', ro: 'Preț', it: 'Prezzo', fr: 'Prix', ru: 'Цена', pronunciation: { en: 'prahys', ro: 'prehts', it: 'PREHT-tsoh', fr: 'pree', ru: 'tseh-NAH' } },
        { hebrew: 'הנחה', en: 'Discount', ro: 'Reducere', it: 'Sconto', fr: 'Réduction', ru: 'Скидка', pronunciation: { en: 'DIS-kount', ro: 'reh-doo-CHEH-reh', it: 'SKOHN-toh', fr: 'ray-dook-SYOHN', ru: 'SKEED-kah' } },
        { hebrew: 'מזומן', en: 'Cash', ro: 'Numerar', it: 'Contanti', fr: 'Espèces', ru: 'Наличные', pronunciation: { en: 'kash', ro: 'noo-meh-RAHR', it: 'kohn-TAHN-tee', fr: 'ehs-PEHS', ru: 'nah-LEECH-nyeh' } },
        { hebrew: 'כרטיס אשראי', en: 'Credit card', ro: 'Card de credit', it: 'Carta di credito', fr: 'Carte de crédit', ru: 'Кредитная карта', pronunciation: { en: 'KRED-it kard', ro: 'kahrd deh KREH-deet', it: 'KAHR-tah dee KREH-dee-toh', fr: 'kahrt duh kray-DEE', ru: 'kreh-DEET-nah-yah KAR-tah' } },
        { hebrew: 'עגלת קניות', en: 'Shopping cart', ro: 'Coș de cumpărături', it: 'Carrello', fr: 'Panier', ru: 'Тележка', pronunciation: { en: 'SHOP-ing kahrt', ro: 'kohsh deh koom-puh-ruh-TOO-ree', it: 'kahr-REHL-loh', fr: 'pah-NYAY', ru: 'teh-LEHZH-kah' } },
        { hebrew: 'קופאית', en: 'Cashier', ro: 'Casier', it: 'Cassiere', fr: 'Caissier', ru: 'Кассир', pronunciation: { en: 'kash-EER', ro: 'kah-SYEHR', it: 'kahs-SYEH-reh', fr: 'kay-SYAY', ru: 'kah-SEER' } },
        { hebrew: 'קבלה', en: 'Receipt', ro: 'Bon', it: 'Scontrino', fr: 'Reçu', ru: 'Чек', pronunciation: { en: 'ri-SEET', ro: 'bohn', it: 'skohn-TREE-noh', fr: 'ruh-SOO', ru: 'chek' } },
        { hebrew: 'שוק', en: 'Market', ro: 'Piață', it: 'Mercato', fr: 'Marché', ru: 'Рынок', pronunciation: { en: 'MAR-ket', ro: 'PYAH-tsuh', it: 'mehr-KAH-toh', fr: 'mahr-SHAY', ru: 'RY-nahk' } },
        { hebrew: 'סופרמרקט', en: 'Supermarket', ro: 'Supermarket', it: 'Supermercato', fr: 'Supermarché', ru: 'Супермаркет', pronunciation: { en: 'SOO-per-mar-ket', ro: 'soo-per-MAHR-ket', it: 'soo-per-mehr-KAH-toh', fr: 'soo-per-mahr-SHAY', ru: 'soo-per-mahr-KET' } },
      ],
    },
    בריאות: {
      title: 'בריאות ורפואה',
      description: 'מילים שימושיות בבריאות',
      vocabulary: [
        { hebrew: 'רופא', en: 'Doctor', ro: 'Doctor', it: 'Dottore', fr: 'Docteur', ru: 'Врач', pronunciation: { en: 'DOK-ter', ro: 'dohk-TOHR', it: 'doht-TOH-reh', fr: 'dohk-TUHR', ru: 'vrach' } },
        { hebrew: 'בית חולים', en: 'Hospital', ro: 'Spital', it: 'Ospedale', fr: 'Hôpital', ru: 'Больница', pronunciation: { en: 'HOS-pi-tal', ro: 'spee-TAHL', it: 'oh-speh-DAH-leh', fr: 'oh-pee-TAHL', ru: 'bahl-NEE-tsah' } },
        { hebrew: 'תרופה', en: 'Medicine', ro: 'Medicament', it: 'Medicina', fr: 'Médicament', ru: 'Лекарство', pronunciation: { en: 'MED-i-sin', ro: 'meh-dee-kah-MENT', it: 'meh-dee-CHEE-nah', fr: 'may-dee-kah-MAHN', ru: 'leh-KAHR-stvah' } },
        { hebrew: 'כאב', en: 'Pain', ro: 'Durere', it: 'Dolore', fr: 'Douleur', ru: 'Боль', pronunciation: { en: 'payn', ro: 'doo-REH-reh', it: 'doh-LOH-reh', fr: 'doo-LUHR', ru: 'bol' } },
        { hebrew: 'בריא', en: 'Healthy', ro: 'Sănătos', it: 'Sano', fr: 'Sain', ru: 'Здоровый', pronunciation: { en: 'HEL-thee', ro: 'suh-nuh-TOHS', it: 'SAH-noh', fr: 'san', ru: 'zdah-ROH-vy' } },
        { hebrew: 'חולה', en: 'Sick', ro: 'Bolnav', it: 'Malato', fr: 'Malade', ru: 'Больной', pronunciation: { en: 'sik', ro: 'bohl-NAHV', it: 'mah-LAH-toh', fr: 'mah-LAHD', ru: 'bahl-NOY' } },
        { hebrew: 'חום', en: 'Fever', ro: 'Febră', it: 'Febbre', fr: 'Fièvre', ru: 'Лихорадка', pronunciation: { en: 'FEE-ver', ro: 'FEH-bruh', it: 'FEHB-breh', fr: 'fee-EHV-ruh', ru: 'lee-khah-RAHD-kah' } },
        { hebrew: 'טיפול', en: 'Treatment', ro: 'Tratament', it: 'Trattamento', fr: 'Traitement', ru: 'Лечение', pronunciation: { en: 'TREET-ment', ro: 'trah-tah-MENT', it: 'traht-tah-MEN-toh', fr: 'trayt-MAHN', ru: 'leh-CHEH-nyeh' } },
        { hebrew: 'בדיקה', en: 'Examination', ro: 'Examinare', it: 'Visita', fr: 'Examen', ru: 'Обследование', pronunciation: { en: 'ig-zam-uh-NAY-shun', ro: 'ehk-sah-mee-NAH-reh', it: 'vee-ZEE-tah', fr: 'ehg-zah-MAHN', ru: 'ahb-sleh-DOH-vah-nyeh' } },
        { hebrew: 'אחות', en: 'Nurse', ro: 'Asistent medical', it: 'Infermiera', fr: 'Infirmière', ru: 'Медсестра', pronunciation: { en: 'nurs', ro: 'ah-sees-TENT meh-dee-KAHL', it: 'een-fehr-MYEH-rah', fr: 'an-feer-MYEHR', ru: 'meed-SEHS-trah' } },
        { hebrew: 'רופא שיניים', en: 'Dentist', ro: 'Dentist', it: 'Dentista', fr: 'Dentiste', ru: 'Стоматолог', pronunciation: { en: 'DEN-tist', ro: 'dehn-TEEST', it: 'dehn-TEE-stah', fr: 'dahn-TEEST', ru: 'stah-mah-TOH-lahg' } },
        { hebrew: 'תרופת שיעול', en: 'Cough medicine', ro: 'Medicament pentru tuse', it: 'Sciroppo per la tosse', fr: 'Médicament contre la toux', ru: 'Лекарство от кашля', pronunciation: { en: 'kawf MED-i-sin', ro: 'meh-dee-kah-MENT pehn-troo TOO-seh', it: 'shy-ROHP-poh pehr lah TOHS-seh', fr: 'may-dee-kah-MAHN kohntr lah too', ru: 'leh-KAHR-stvah aht KASH-lyah' } },
        { hebrew: 'פלסטר', en: 'Bandage', ro: 'Bandaj', it: 'Benda', fr: 'Pansement', ru: 'Повязка', pronunciation: { en: 'BAN-dij', ro: 'bahn-DAHZH', it: 'BEHN-dah', fr: 'pahns-MAHN', ru: 'pah-VYAZ-kah' } },
      ],
    },
    תחבורה: {
      title: 'תחבורה ונסיעות',
      description: 'מילים הקשורות לתחבורה',
      vocabulary: [
        { hebrew: 'מכונית', en: 'Car', ro: 'Mașină', it: 'Macchina', fr: 'Voiture', ru: 'Машина', pronunciation: { en: 'kahr', ro: 'mah-SHEE-nuh', it: 'MAHK-kee-nah', fr: 'vwah-TOOR', ru: 'mah-SHEE-nah' } },
        { hebrew: 'אוטובוס', en: 'Bus', ro: 'Autobuz', it: 'Autobus', fr: 'Bus', ru: 'Автобус', pronunciation: { en: 'buhs', ro: 'ah-oo-toh-BOOZ', it: 'ah-oo-TOH-boos', fr: 'boos', ru: 'ahv-tah-BOOS' } },
        { hebrew: 'רכבת', en: 'Train', ro: 'Tren', it: 'Treno', fr: 'Train', ru: 'Поезд', pronunciation: { en: 'trayn', ro: 'trehn', it: 'TREH-noh', fr: 'tran', ru: 'PAH-yezd' } },
        { hebrew: 'מטוס', en: 'Airplane', ro: 'Avion', it: 'Aereo', fr: 'Avion', ru: 'Самолёт', pronunciation: { en: 'AIR-playn', ro: 'ah-vee-OHN', it: 'ah-EH-reh-oh', fr: 'ah-vee-OHN', ru: 'sah-mah-LYOT' } },
        { hebrew: 'אופניים', en: 'Bicycle', ro: 'Bicicletă', it: 'Bicicletta', fr: 'Vélo', ru: 'Велосипед', pronunciation: { en: 'BY-sik-ul', ro: 'bee-chee-KLEH-tuh', it: 'bee-chee-KLEHT-tah', fr: 'vay-LOH', ru: 'veh-lah-see-PYED' } },
        { hebrew: 'חניה', en: 'Parking', ro: 'Parcare', it: 'Parcheggio', fr: 'Parking', ru: 'Парковка', pronunciation: { en: 'PAHR-king', ro: 'pahr-KAH-reh', it: 'pahr-KEHD-joh', fr: 'pahr-KEENG', ru: 'pahr-KOHV-kah' } },
        { hebrew: 'דלק', en: 'Gas', ro: 'Benzină', it: 'Benzina', fr: 'Essence', ru: 'Бензин', pronunciation: { en: 'gas', ro: 'behn-ZEE-nuh', it: 'behn-ZEE-nah', fr: 'eh-SAHNS', ru: 'ben-ZEEN' } },
        { hebrew: 'כביש', en: 'Road', ro: 'Drum', it: 'Strada', fr: 'Route', ru: 'Дорога', pronunciation: { en: 'rohd', ro: 'droom', it: 'STRAH-dah', fr: 'root', ru: 'dah-ROH-gah' } },
        { hebrew: 'גשר', en: 'Bridge', ro: 'Pod', it: 'Ponte', fr: 'Pont', ru: 'Мост', pronunciation: { en: 'brij', ro: 'pohd', it: 'POHN-teh', fr: 'pohn', ru: 'most' } },
        { hebrew: 'תחנה', en: 'Station', ro: 'Stație', it: 'Stazione', fr: 'Gare', ru: 'Станция', pronunciation: { en: 'STAY-shun', ro: 'STAH-tsee-eh', it: 'stah-TSYOH-neh', fr: 'gahr', ru: 'STAHN-tsee-yah' } },
        { hebrew: 'מונית', en: 'Taxi', ro: 'Taxi', it: 'Taxi', fr: 'Taxi', ru: 'Такси', pronunciation: { en: 'TAK-see', ro: 'TAHK-see', it: 'TAHK-see', fr: 'tahk-SEE', ru: 'TAHK-see' } },
        { hebrew: 'מטרו', en: 'Metro', ro: 'Metrou', it: 'Metro', fr: 'Métro', ru: 'Метро', pronunciation: { en: 'MET-roh', ro: 'meh-TROH', it: 'MEH-troh', fr: 'may-TROH', ru: 'meht-ROH' } },
        { hebrew: 'טרמפ', en: 'Hitchhike', ro: 'Autostop', it: 'Autostop', fr: 'Auto-stop', ru: 'Автостоп', pronunciation: { en: 'HICH-hahyk', ro: 'ah-oo-toh-STOHP', it: 'ah-oo-toh-STOHP', fr: 'oh-toh-STOHP', ru: 'ahv-tah-STOHP' } },
        { hebrew: 'רישיון נהיגה', en: 'Driver\'s license', ro: 'Permis de conducere', it: 'Patente', fr: 'Permis de conduire', ru: 'Водительские права', pronunciation: { en: 'DRAHY-verz LAHY-suhns', ro: 'pehr-MEES deh kohn-doo-CHEH-reh', it: 'pah-TEHN-teh', fr: 'pehr-MEE duh kohn-DWEER', ru: 'vah-DEE-teel-skee-yeh PRAH-vah' } },
        { hebrew: 'תאונה', en: 'Accident', ro: 'Accident', it: 'Incidente', fr: 'Accident', ru: 'Авария', pronunciation: { en: 'AK-si-dent', ro: 'ahk-chee-DENT', it: 'een-chee-DEHN-teh', fr: 'ahk-see-DAHN', ru: 'ah-VAH-ree-yah' } },
        { hebrew: 'רמזור', en: 'Traffic light', ro: 'Semafor', it: 'Semaforo', fr: 'Feu de circulation', ru: 'Светофор', pronunciation: { en: 'TRAF-ik lahyts', ro: 'seh-mah-FOHR', it: 'seh-mah-FOH-roh', fr: 'fuh duh seer-koo-lah-SYOHN', ru: 'sveh-tah-FOR' } },
        { hebrew: 'חנייה', en: 'Parking', ro: 'Parcare', it: 'Parcheggio', fr: 'Stationnement', ru: 'Парковка', pronunciation: { en: 'PAHR-king', ro: 'pahr-KAH-reh', it: 'pahr-KEHD-joh', fr: 'stah-syohn-MAHN', ru: 'pahr-KOHV-kah' } },
      ],
    },
    ספורט: {
      title: 'ספורט ופעילות גופנית',
      description: 'מילים הקשורות לספורט',
      vocabulary: [
        { hebrew: 'כדורגל', en: 'Football', ro: 'Fotbal', it: 'Calcio', fr: 'Football', ru: 'Футбол', pronunciation: { en: 'FOOT-bawl', ro: 'foht-BAHL', it: 'KAHL-choh', fr: 'foot-BAHL', ru: 'foot-BOL' } },
        { hebrew: 'כדורסל', en: 'Basketball', ro: 'Baschet', it: 'Pallacanestro', fr: 'Basket-ball', ru: 'Баскетбол', pronunciation: { en: 'BAS-kit-bawl', ro: 'bahsh-KET', it: 'pahl-lah-kah-NEHS-troh', fr: 'bahs-ket-BAHL', ru: 'bahs-keht-BOL' } },
        { hebrew: 'שחייה', en: 'Swimming', ro: 'Înot', it: 'Nuoto', fr: 'Natation', ru: 'Плавание', pronunciation: { en: 'SWIM-ing', ro: 'uh-NOHT', it: 'NWAH-toh', fr: 'nah-tah-SYOHN', ru: 'PLAH-vah-nyeh' } },
        { hebrew: 'ריצה', en: 'Running', ro: 'Alergare', it: 'Corsa', fr: 'Course', ru: 'Бег', pronunciation: { en: 'RUHN-ing', ro: 'ah-lehr-GAH-reh', it: 'KOR-sah', fr: 'koors', ru: 'byek' } },
        { hebrew: 'אימון', en: 'Training', ro: 'Antrenament', it: 'Allenamento', fr: 'Entraînement', ru: 'Тренировка', pronunciation: { en: 'TRAYN-ing', ro: 'ahn-treh-nah-MENT', it: 'ahl-leh-nah-MEN-toh', fr: 'ahn-trayn-MAHN', ru: 'treh-nee-ROHF-kah' } },
        { hebrew: 'משחק', en: 'Game', ro: 'Joc', it: 'Gioco', fr: 'Jeu', ru: 'Игра', pronunciation: { en: 'gaym', ro: 'zhohk', it: 'JOH-koh', fr: 'zhuh', ru: 'ee-GRAH' } },
        { hebrew: 'שחקן', en: 'Player', ro: 'Jucător', it: 'Giocatore', fr: 'Joueur', ru: 'Игрок', pronunciation: { en: 'PLAY-er', ro: 'zhoo-KUH-tohr', it: 'joh-kah-TOH-reh', fr: 'zhoo-UHR', ru: 'ee-GROHK' } },
        { hebrew: 'קבוצה', en: 'Team', ro: 'Echipă', it: 'Squadra', fr: 'Équipe', ru: 'Команда', pronunciation: { en: 'teem', ro: 'eh-KEE-puh', it: 'SKWAH-drah', fr: 'ay-KEEP', ru: 'kah-MAHN-dah' } },
        { hebrew: 'ניצחון', en: 'Victory', ro: 'Victorie', it: 'Vittoria', fr: 'Victoire', ru: 'Победа', pronunciation: { en: 'VIK-tuh-ree', ro: 'veek-TOH-ree-eh', it: 'veet-TOH-ree-ah', fr: 'veek-TWAHR', ru: 'pah-BYEH-dah' } },
        { hebrew: 'הפסד', en: 'Defeat', ro: 'Înfrângere', it: 'Sconfitta', fr: 'Défaite', ru: 'Поражение', pronunciation: { en: 'di-FEET', ro: 'uhn-fruhn-JEH-reh', it: 'skohn-FEET-tah', fr: 'day-FEHT', ru: 'pah-rah-ZHEH-nyeh' } },
        { hebrew: 'כדור', en: 'Ball', ro: 'Mingea', it: 'Palla', fr: 'Balle', ru: 'Мяч', pronunciation: { en: 'bawl', ro: 'MEEN-jeh-ah', it: 'PAHL-lah', fr: 'bahl', ru: 'myach' } },
        { hebrew: 'שדה', en: 'Field', ro: 'Teren', it: 'Campo', fr: 'Terrain', ru: 'Поле', pronunciation: { en: 'feeld', ro: 'teh-REHN', it: 'KAHM-poh', fr: 'teh-RAN', ru: 'POH-leh' } },
        { hebrew: 'איצטדיון', en: 'Stadium', ro: 'Stadion', it: 'Stadio', fr: 'Stade', ru: 'Стадион', pronunciation: { en: 'STAY-dee-um', ro: 'stah-DEE-ohn', it: 'STAH-dyoh', fr: 'stahd', ru: 'stah-DEE-ohn' } },
        { hebrew: 'אליפות', en: 'Championship', ro: 'Campionat', it: 'Campionato', fr: 'Championnat', ru: 'Чемпионат', pronunciation: { en: 'CHAM-pee-uhn-ship', ro: 'kahm-pee-oh-NAHT', it: 'kahm-pee-oh-NAH-toh', fr: 'shahm-pee-oh-NAH', ru: 'chehm-pee-oh-NAHT' } },
        { hebrew: 'מגרש', en: 'Court', ro: 'Teren', it: 'Campo', fr: 'Terrain', ru: 'Корт', pronunciation: { en: 'kort', ro: 'teh-REHN', it: 'KAHM-poh', fr: 'teh-RAN', ru: 'kort' } },
        { hebrew: 'שער', en: 'Goal', ro: 'Gol', it: 'Gol', fr: 'But', ru: 'Гол', pronunciation: { en: 'gohl', ro: 'gohl', it: 'gohl', fr: 'boot', ru: 'gol' } },
        { hebrew: 'שופט', en: 'Referee', ro: 'Arbitru', it: 'Arbitro', fr: 'Arbitre', ru: 'Судья', pronunciation: { en: 'REF-uh-ree', ro: 'ahr-BEE-troo', it: 'ahr-BEE-troh', fr: 'ahr-BEETR', ru: 'soo-DYAH' } },
        { hebrew: 'אימון', en: 'Practice', ro: 'Antrenament', it: 'Allenamento', fr: 'Entraînement', ru: 'Тренировка', pronunciation: { en: 'PRAK-tis', ro: 'ahn-treh-nah-MENT', it: 'ahl-leh-nah-MEN-toh', fr: 'ahn-trayn-MAHN', ru: 'treh-nee-ROHF-kah' } },
        { hebrew: 'תחרות', en: 'Competition', ro: 'Competiție', it: 'Competizione', fr: 'Compétition', ru: 'Соревнование', pronunciation: { en: 'kom-pi-TISH-un', ro: 'kohm-peh-TEE-tsee-eh', it: 'kohm-peh-tee-TSYOH-neh', fr: 'kohm-pay-tee-SYOHN', ru: 'sah-rehv-nah-VAH-nyeh' } },
      ],
    },
    לימודים: {
      title: 'לימודים וחינוך',
      description: 'מילים הקשורות ללימודים',
      vocabulary: [
        { hebrew: 'בית ספר', en: 'School', ro: 'Școală', it: 'Scuola', fr: 'École', ru: 'Школа', pronunciation: { en: 'skool', ro: 'shkoh-AH-luh', it: 'SKWOH-lah', fr: 'ay-KOHL', ru: 'SHKOH-lah' } },
        { hebrew: 'מורה', en: 'Teacher', ro: 'Profesor', it: 'Insegnante', fr: 'Professeur', ru: 'Учитель', pronunciation: { en: 'TEE-cher', ro: 'proh-feh-SOHR', it: 'een-sehn-YAHN-teh', fr: 'proh-feh-SUHR', ru: 'oo-CHEE-teel' } },
        { hebrew: 'תלמיד', en: 'Student', ro: 'Elev', it: 'Studente', fr: 'Étudiant', ru: 'Ученик', pronunciation: { en: 'STOO-dent', ro: 'eh-LEHV', it: 'stoo-DEHN-teh', fr: 'ay-too-DYAHN', ru: 'oo-cheh-NEEK' } },
        { hebrew: 'כיתה', en: 'Classroom', ro: 'Sala de clasă', it: 'Aula', fr: 'Salle de classe', ru: 'Класс', pronunciation: { en: 'KLAS-room', ro: 'SAH-lah deh KLAH-suh', it: 'AH-oo-lah', fr: 'sahl duh klahs', ru: 'klahs' } },
        { hebrew: 'ספר', en: 'Book', ro: 'Carte', it: 'Libro', fr: 'Livre', ru: 'Книга', pronunciation: { en: 'book', ro: 'KAHR-teh', it: 'LEE-broh', fr: 'leevr', ru: 'KNEE-gah' } },
        { hebrew: 'עפרון', en: 'Pencil', ro: 'Cremalieră', it: 'Matita', fr: 'Crayon', ru: 'Карандаш', pronunciation: { en: 'PEN-sul', ro: 'kreh-mah-LYEH-ruh', it: 'mah-TEE-tah', fr: 'kray-OHN', ru: 'kah-rahn-DAHSH' } },
        { hebrew: 'מחברת', en: 'Notebook', ro: 'Caiet', it: 'Quaderno', fr: 'Cahier', ru: 'Тетрадь', pronunciation: { en: 'NOHT-book', ro: 'kah-YET', it: 'kwah-DEHR-noh', fr: 'kah-YAY', ru: 'teh-TRAHD' } },
        { hebrew: 'מבחן', en: 'Exam', ro: 'Examen', it: 'Esame', fr: 'Examen', ru: 'Экзамен', pronunciation: { en: 'ig-ZAM', ro: 'ehk-SAH-mehn', it: 'eh-SAH-meh', fr: 'ehg-zah-MAHN', ru: 'ehk-zah-MYEN' } },
        { hebrew: 'שיעורי בית', en: 'Homework', ro: 'Temă', it: 'Compiti', fr: 'Devoirs', ru: 'Домашнее задание', pronunciation: { en: 'HOHM-wurk', ro: 'TEH-muh', it: 'KOHM-pee-tee', fr: 'duh-VWAHR', ru: 'dah-MAHSH-nyeh zah-DAH-nyeh' } },
        { hebrew: 'אוניברסיטה', en: 'University', ro: 'Universitate', it: 'Università', fr: 'Université', ru: 'Университет', pronunciation: { en: 'yoo-nuh-VUR-si-tee', ro: 'oo-nee-vehr-see-TAH-teh', it: 'oo-nee-vehr-see-TAH', fr: 'oo-nee-vehr-see-TAY', ru: 'oo-nee-vehr-see-TYET' } },
        { hebrew: 'תואר', en: 'Degree', ro: 'Diplomă', it: 'Laurea', fr: 'Diplôme', ru: 'Степень', pronunciation: { en: 'di-GREE', ro: 'dee-PLOH-muh', it: 'LAH-oo-reh-ah', fr: 'dee-PLOHM', ru: 'STEH-pehn' } },
        { hebrew: 'שיעור', en: 'Lesson', ro: 'Lecție', it: 'Lezione', fr: 'Leçon', ru: 'Урок', pronunciation: { en: 'LES-un', ro: 'LEHK-tsee-eh', it: 'leh-TSYOH-neh', fr: 'luh-SOHN', ru: 'oo-ROHK' } },
        { hebrew: 'לוח', en: 'Board', ro: 'Tabla', it: 'Lavagna', fr: 'Tableau', ru: 'Доска', pronunciation: { en: 'bord', ro: 'TAH-blah', it: 'lah-VAHN-yah', fr: 'tah-BLOH', ru: 'dahs-KAH' } },
        { hebrew: 'מחק', en: 'Eraser', ro: 'Radieră', it: 'Gomma', fr: 'Gomme', ru: 'Ластик', pronunciation: { en: 'i-RAY-ser', ro: 'rah-DYEH-ruh', it: 'GOHM-mah', fr: 'gohm', ru: 'LAHS-teek' } },
        { hebrew: 'סרגל', en: 'Ruler', ro: 'Riglă', it: 'Righello', fr: 'Règle', ru: 'Линейка', pronunciation: { en: 'ROO-ler', ro: 'REE-gluh', it: 'ree-GEHL-loh', fr: 'rehgl', ru: 'lee-NYAY-kah' } },
        { hebrew: 'תיק בית ספר', en: 'Backpack', ro: 'Rucsac', it: 'Zaino', fr: 'Sac à dos', ru: 'Рюкзак', pronunciation: { en: 'BAK-pak', ro: 'rook-SAHK', it: 'TSAH-ee-noh', fr: 'sahk ah dohs', ru: 'ryook-ZAHK' } },
        { hebrew: 'מילון', en: 'Dictionary', ro: 'Dicționar', it: 'Dizionario', fr: 'Dictionnaire', ru: 'Словарь', pronunciation: { en: 'DIK-shuh-ner-ee', ro: 'deek-tsee-oh-NAHR', it: 'dee-tsee-oh-NAH-ree-oh', fr: 'deek-see-oh-NAIR', ru: 'slah-VAHR' } },
        { hebrew: 'ספרייה', en: 'Library', ro: 'Bibliotecă', it: 'Biblioteca', fr: 'Bibliothèque', ru: 'Библиотека', pronunciation: { en: 'LAHY-brer-ee', ro: 'bee-blee-oh-TEH-kuh', it: 'bee-blee-oh-TEH-kah', fr: 'bee-blee-oh-TEHK', ru: 'bee-blee-ah-TEH-kah' } },
        { hebrew: 'מעבדה', en: 'Laboratory', ro: 'Laborator', it: 'Laboratorio', fr: 'Laboratoire', ru: 'Лаборатория', pronunciation: { en: 'LAB-ruh-tor-ee', ro: 'lah-boh-rah-TOHR', it: 'lah-boh-rah-TOH-ree-oh', fr: 'lah-boh-rah-TWAHR', ru: 'lah-bah-rah-TOH-ree-yah' } },
        { hebrew: 'תעודה', en: 'Certificate', ro: 'Certificat', it: 'Certificato', fr: 'Certificat', ru: 'Сертификат', pronunciation: { en: 'ser-TIF-i-kit', ro: 'chehr-tee-fee-KAHT', it: 'chehr-tee-fee-KAH-toh', fr: 'sehr-tee-fee-KAH', ru: 'sehr-tee-fee-KAHT' } },
        { hebrew: 'תואר ראשון', en: 'Bachelor\'s degree', ro: 'Licență', it: 'Laurea', fr: 'Licence', ru: 'Степень бакалавра', pronunciation: { en: 'BACH-uh-lerz di-GREE', ro: 'lee-CHEHN-tsuh', it: 'LAH-oo-reh-ah', fr: 'lee-SAHNS', ru: 'STEH-pehn bah-kah-LAHV-rah' } },
      ],
    },
    מקצועות: {
      title: 'מקצועות ועבודה',
      description: 'ללמוד שמות מקצועות',
      vocabulary: [
        { hebrew: 'רופא', en: 'Doctor', ro: 'Doctor', it: 'Dottore', fr: 'Docteur', ru: 'Врач', pronunciation: { en: 'DOK-ter', ro: 'dohk-TOHR', it: 'doht-TOH-reh', fr: 'dohk-TUHR', ru: 'vrach' } },
        { hebrew: 'מורה', en: 'Teacher', ro: 'Profesor', it: 'Insegnante', fr: 'Professeur', ru: 'Учитель', pronunciation: { en: 'TEE-cher', ro: 'proh-feh-SOHR', it: 'een-sehn-YAHN-teh', fr: 'proh-feh-SUHR', ru: 'oo-CHEE-teel' } },
        { hebrew: 'מהנדס', en: 'Engineer', ro: 'Inginer', it: 'Ingegnere', fr: 'Ingénieur', ru: 'Инженер', pronunciation: { en: 'en-juh-NEER', ro: 'een-jee-NEHR', it: 'een-jehn-YEH-reh', fr: 'an-zhay-NYUHR', ru: 'een-zheh-NYER' } },
        { hebrew: 'טבח', en: 'Chef', ro: 'Bucătar', it: 'Chef', fr: 'Chef', ru: 'Повар', pronunciation: { en: 'shef', ro: 'boo-kuh-TAHR', it: 'shef', fr: 'shef', ru: 'POH-var' } },
        { hebrew: 'עורך דין', en: 'Lawyer', ro: 'Avocat', it: 'Avvocato', fr: 'Avocat', ru: 'Адвокат', pronunciation: { en: 'LOY-er', ro: 'ah-voh-KAHT', it: 'ahv-voh-KAH-toh', fr: 'ah-voh-KAH', ru: 'ahd-vah-KAHT' } },
        { hebrew: 'אדריכל', en: 'Architect', ro: 'Arhitect', it: 'Architetto', fr: 'Architecte', ru: 'Архитектор', pronunciation: { en: 'AHR-ki-tekt', ro: 'ahr-hee-TEKT', it: 'ahr-kee-TEHT-toh', fr: 'ahr-shee-TEHT', ru: 'ahr-khee-TEHK-tahr' } },
        { hebrew: 'חשבונאי', en: 'Accountant', ro: 'Contabil', it: 'Contabile', fr: 'Comptable', ru: 'Бухгалтер', pronunciation: { en: 'uh-KOWN-tent', ro: 'kohn-TAH-beel', it: 'kohn-TAH-bee-leh', fr: 'kohn-TAH-bluh', ru: 'bookh-GAHL-ter' } },
        { hebrew: 'פקח', en: 'Policeman', ro: 'Polițist', it: 'Poliziotto', fr: 'Policier', ru: 'Полицейский', pronunciation: { en: 'puh-LEES-muhn', ro: 'poh-lee-TSEEST', it: 'poh-lee-TSYOHT-toh', fr: 'poh-lee-SYAY', ru: 'pah-lee-TSYAY-skee' } },
        { hebrew: 'כבאי', en: 'Firefighter', ro: 'Pompier', it: 'Vigile del fuoco', fr: 'Pompier', ru: 'Пожарный', pronunciation: { en: 'FAHYR-fahy-ter', ro: 'pohm-PYEHR', it: 'VEE-jee-leh dehl FWOH-koh', fr: 'pohm-PYAY', ru: 'pah-ZHAHR-ny' } },
        { hebrew: 'אח', en: 'Nurse', ro: 'Asistent medical', it: 'Infermiere', fr: 'Infirmier', ru: 'Медсестра', pronunciation: { en: 'nurs', ro: 'ah-sees-TENT meh-dee-KAHL', it: 'een-fehr-MYEH-reh', fr: 'an-feer-MYAY', ru: 'meed-SEHS-trah' } },
        { hebrew: 'ספר', en: 'Hairdresser', ro: 'Frizer', it: 'Parrucchiere', fr: 'Coiffeur', ru: 'Парикмахер', pronunciation: { en: 'HAIR-dres-er', ro: 'free-ZEHR', it: 'pahr-rook-KYEH-reh', fr: 'kwah-FUHR', ru: 'pah-reek-MAH-kher' } },
        { hebrew: 'נהג', en: 'Driver', ro: 'Șofer', it: 'Autista', fr: 'Chauffeur', ru: 'Водитель', pronunciation: { en: 'DRAHY-ver', ro: 'shoh-FEHR', it: 'ah-oo-TEE-stah', fr: 'shoh-FUHR', ru: 'vah-DEE-teel' } },
        { hebrew: 'ספר', en: 'Barber', ro: 'Frizer', it: 'Barbiere', fr: 'Barbier', ru: 'Парикмахер', pronunciation: { en: 'BAHR-ber', ro: 'free-ZEHR', it: 'bahr-BYEH-reh', fr: 'bahr-BYAY', ru: 'pah-reek-MAH-kher' } },
        { hebrew: 'חשמלאי', en: 'Electrician', ro: 'Electrician', it: 'Elettricista', fr: 'Électricien', ru: 'Электрик', pronunciation: { en: 'i-lek-TRISH-un', ro: 'eh-lehk-tree-CHAHN', it: 'eh-leht-tree-CHEE-stah', fr: 'ay-lehk-tree-SYAN', ru: 'eh-lehk-TREEK' } },
        { hebrew: 'שרברב', en: 'Plumber', ro: 'Instalator', it: 'Idraulico', fr: 'Plombier', ru: 'Сантехник', pronunciation: { en: 'PLUHM-ber', ro: 'een-stah-lah-TOHR', it: 'ee-DRAH-oo-lee-koh', fr: 'plohm-BYAY', ru: 'sahn-TEHK-neek' } },
        { hebrew: 'נגר', en: 'Carpenter', ro: 'Tâmplar', it: 'Falegname', fr: 'Menuisier', ru: 'Плотник', pronunciation: { en: 'KAHR-pen-ter', ro: 'TUHM-plahr', it: 'fah-lehn-YAH-meh', fr: 'muh-nwee-ZYAY', ru: 'PLOHT-neek' } },
        { hebrew: 'צייר', en: 'Painter', ro: 'Pictor', it: 'Pittore', fr: 'Peintre', ru: 'Художник', pronunciation: { en: 'PAYN-ter', ro: 'peek-TOHR', it: 'peet-TOH-reh', fr: 'pan-tr', ru: 'khoo-DOZH-neek' } },
        { hebrew: 'מוזיקאי', en: 'Musician', ro: 'Muzician', it: 'Musicista', fr: 'Musicien', ru: 'Музыкант', pronunciation: { en: 'myoo-ZISH-un', ro: 'moo-zee-CHAHN', it: 'moo-zee-CHEE-stah', fr: 'moo-zee-SYAN', ru: 'moo-zy-KAHNT' } },
        { hebrew: 'שחקן', en: 'Actor', ro: 'Actor', it: 'Attore', fr: 'Acteur', ru: 'Актер', pronunciation: { en: 'AK-ter', ro: 'ahk-TOHR', it: 'aht-TOH-reh', fr: 'ahk-TUHR', ru: 'AHK-ter' } },
        { hebrew: 'כתב', en: 'Journalist', ro: 'Jurnalist', it: 'Giornalista', fr: 'Journaliste', ru: 'Журналист', pronunciation: { en: 'JUR-nuh-list', ro: 'zhoor-nah-LEEST', it: 'johr-nah-LEE-stah', fr: 'zhoor-nah-LEEST', ru: 'zhoor-nah-LEEST' } },
        { hebrew: 'צלם', en: 'Photographer', ro: 'Fotograf', it: 'Fotografo', fr: 'Photographe', ru: 'Фотограф', pronunciation: { en: 'fuh-TOG-ruh-fer', ro: 'foh-toh-GRAHF', it: 'foh-toh-GRAH-foh', fr: 'foh-toh-GRAHF', ru: 'fah-TOH-grahf' } },
        { hebrew: 'טבח', en: 'Cook', ro: 'Bucătar', it: 'Cuoco', fr: 'Cuisinier', ru: 'Повар', pronunciation: { en: 'kook', ro: 'boo-kuh-TAHR', it: 'KWOH-koh', fr: 'kwee-zee-NYAY', ru: 'POH-var' } },
        { hebrew: 'מלצר', en: 'Waiter', ro: 'Chelner', it: 'Cameriere', fr: 'Serveur', ru: 'Официант', pronunciation: { en: 'WAY-ter', ro: 'KEHL-nehr', it: 'kah-meh-RYEH-reh', fr: 'sehr-VUHR', ru: 'ah-fee-TSYAHNT' } },
      ],
    },
    בישול: {
      title: 'בישול ומטבח',
      description: 'מילים הקשורות לבישול',
      vocabulary: [
        { hebrew: 'לבשל', en: 'To cook', ro: 'A găti', it: 'Cucinare', fr: 'Cuire', ru: 'Готовить', pronunciation: { en: 'tu kook', ro: 'ah guh-TEE', it: 'koo-chee-NAH-reh', fr: 'kweer', ru: 'gah-TOH-veet' } },
        { hebrew: 'לאפות', en: 'To bake', ro: 'A coace', it: 'Cuocere', fr: 'Cuire au four', ru: 'Печь', pronunciation: { en: 'tu bayk', ro: 'ah KWAH-cheh', it: 'KWOH-cheh-reh', fr: 'kweer oh foor', ru: 'pech' } },
        { hebrew: 'לחתוך', en: 'To cut', ro: 'A tăia', it: 'Tagliare', fr: 'Couper', ru: 'Резать', pronunciation: { en: 'tu kuht', ro: 'ah tuh-EE-ah', it: 'tah-LYAH-reh', fr: 'koo-PAY', ru: 'REH-zaht' } },
        { hebrew: 'לערבב', en: 'To mix', ro: 'A amesteca', it: 'Mescolare', fr: 'Mélanger', ru: 'Смешивать', pronunciation: { en: 'tu miks', ro: 'ah ah-mehs-TEH-kah', it: 'mehs-koh-LAH-reh', fr: 'may-lahn-ZHAY', ru: 'smeh-SHEE-vaht' } },
        { hebrew: 'לטגן', en: 'To fry', ro: 'A prăji', it: 'Friggere', fr: 'Frire', ru: 'Жарить', pronunciation: { en: 'tu frahy', ro: 'ah pruh-ZHEE', it: 'FREE-jeh-reh', fr: 'freer', ru: 'ZHAH-reet' } },
        { hebrew: 'להרתיח', en: 'To boil', ro: 'A fierbe', it: 'Bollire', fr: 'Bouillir', ru: 'Кипятить', pronunciation: { en: 'tu boyl', ro: 'ah FYEHR-beh', it: 'bohl-LEE-reh', fr: 'boo-YEER', ru: 'keep-YAH-teet' } },
        { hebrew: 'מלח', en: 'Salt', ro: 'Sare', it: 'Sale', fr: 'Sel', ru: 'Соль', pronunciation: { en: 'sawlt', ro: 'SAH-reh', it: 'SAH-leh', fr: 'sehl', ru: 'sol' } },
        { hebrew: 'פלפל', en: 'Pepper', ro: 'Piper', it: 'Pepe', fr: 'Poivre', ru: 'Перец', pronunciation: { en: 'PEP-er', ro: 'pee-PEHR', it: 'PEH-peh', fr: 'pwavr', ru: 'PEH-rehts' } },
        { hebrew: 'שמן', en: 'Oil', ro: 'Ulei', it: 'Olio', fr: 'Huile', ru: 'Масло', pronunciation: { en: 'oyl', ro: 'oo-LAY', it: 'OH-lyoh', fr: 'weel', ru: 'MAHS-lah' } },
        { hebrew: 'סוכר', en: 'Sugar', ro: 'Zahăr', it: 'Zucchero', fr: 'Sucre', ru: 'Сахар', pronunciation: { en: 'SHOOG-er', ro: 'ZAH-huhr', it: 'TSOOK-keh-roh', fr: 'sookr', ru: 'SAH-khar' } },
        { hebrew: 'תבלין', en: 'Spice', ro: 'Condiment', it: 'Spezia', fr: 'Épice', ru: 'Специя', pronunciation: { en: 'spahys', ro: 'kohn-dee-MENT', it: 'SPEH-tsee-ah', fr: 'ay-PEES', ru: 'SPEH-tsee-yah' } },
        { hebrew: 'תבנית', en: 'Pan', ro: 'Tigaie', it: 'Padella', fr: 'Poêle', ru: 'Сковорода', pronunciation: { en: 'pan', ro: 'tee-GAH-yeh', it: 'pah-DEHL-lah', fr: 'pwahl', ru: 'skah-vah-ROH-dah' } },
        { hebrew: 'סכין', en: 'Knife', ro: 'Cuțit', it: 'Coltello', fr: 'Couteau', ru: 'Нож', pronunciation: { en: 'nahyf', ro: 'koo-TSEET', it: 'kohl-TEHL-loh', fr: 'koo-TOH', ru: 'nozh' } },
        { hebrew: 'מזלג', en: 'Fork', ro: 'Furculiță', it: 'Forchetta', fr: 'Fourchette', ru: 'Вилка', pronunciation: { en: 'fawk', ro: 'foor-koo-LEE-tsuh', it: 'for-KEHT-tah', fr: 'foor-SHEHT', ru: 'VEEL-kah' } },
        { hebrew: 'כף', en: 'Spoon', ro: 'Lingură', it: 'Cucchiaio', fr: 'Cuillère', ru: 'Ложка', pronunciation: { en: 'spoon', ro: 'leen-GOO-ruh', it: 'kook-KYAH-yoh', fr: 'kwee-YEHR', ru: 'LOHSH-kah' } },
        { hebrew: 'צלחת', en: 'Plate', ro: 'Farfurie', it: 'Piatto', fr: 'Assiette', ru: 'Тарелка', pronunciation: { en: 'playt', ro: 'fahr-foo-REE-eh', it: 'PYAHT-toh', fr: 'ah-SYEHT', ru: 'tah-REHL-kah' } },
        { hebrew: 'כוס', en: 'Glass', ro: 'Pahar', it: 'Bicchiere', fr: 'Verre', ru: 'Стакан', pronunciation: { en: 'glas', ro: 'pah-HAHR', it: 'beek-KYEH-reh', fr: 'vehr', ru: 'stah-KAHN' } },
        { hebrew: 'קערה', en: 'Bowl', ro: 'Bol', it: 'Ciotola', fr: 'Bol', ru: 'Миска', pronunciation: { en: 'bohl', ro: 'bohl', it: 'CHOH-toh-lah', fr: 'bohl', ru: 'MEES-kah' } },
        { hebrew: 'מגש', en: 'Tray', ro: 'Tavă', it: 'Vassoio', fr: 'Plateau', ru: 'Поднос', pronunciation: { en: 'tray', ro: 'TAH-vuh', it: 'vahs-SOH-yoh', fr: 'plah-TOH', ru: 'pahd-NOHS' } },
        { hebrew: 'קרש חיתוך', en: 'Cutting board', ro: 'Tăietor', it: 'Tagliere', fr: 'Planche à découper', ru: 'Разделочная доска', pronunciation: { en: 'KUHT-ing bord', ro: 'tuh-ee-eh-TOHR', it: 'tah-LYEH-reh', fr: 'plahnsh ah day-koo-PAY', ru: 'rahz-DYEH-lahch-nah-yah dahs-KAH' } },
        { hebrew: 'פותחן', en: 'Opener', ro: 'Deschizător', it: 'Apriporta', fr: 'Ouvre-boîte', ru: 'Открывалка', pronunciation: { en: 'OH-pen-er', ro: 'dehs-kee-zuh-TOHR', it: 'ah-pree-POR-tah', fr: 'oo-vruh-BWAHT', ru: 'aht-kry-VAHL-kah' } },
        { hebrew: 'מסננת', en: 'Strainer', ro: 'Strecurătoare', it: 'Colino', fr: 'Passoire', ru: 'Дуршлаг', pronunciation: { en: 'STRAYN-er', ro: 'streh-koo-ruh-TOH-reh', it: 'koh-LEE-noh', fr: 'pah-SWAHR', ru: 'door-SHLAHG' } },
        { hebrew: 'מערוך', en: 'Rolling pin', ro: 'Răzătoare', it: 'Mattarello', fr: 'Rouleau à pâtisserie', ru: 'Скалка', pronunciation: { en: 'ROH-ling pin', ro: 'ruh-zuh-TOH-reh', it: 'maht-tah-REHL-loh', fr: 'roo-LOH ah pah-tee-SREE', ru: 'SKAHL-kah' } },
      ],
    },
  },
  ADVANCED: {
    משפחה: {
      title: 'משפחה ויחסים',
      description: 'דיבור על משפחה ויחסים',
      vocabulary: [
        { hebrew: 'משפחה', en: 'Family', ro: 'Familie', it: 'Famiglia', fr: 'Famille', ru: 'Семья', pronunciation: { en: 'FAM-uh-lee', ro: 'fah-MEE-lee-eh', it: 'fah-MEE-lyah', fr: 'fah-MEE-yuh', ru: 'seh-MYAH' } },
        { hebrew: 'הורים', en: 'Parents', ro: 'Părinți', it: 'Genitori', fr: 'Parents', ru: 'Родители', pronunciation: { en: 'PAIR-ents', ro: 'puh-REEN-tsee', it: 'jeh-nee-TOH-ree', fr: 'pah-RAHN', ru: 'rah-DEE-teh-lee' } },
        { hebrew: 'אח', en: 'Brother', ro: 'Frate', it: 'Fratello', fr: 'Frère', ru: 'Брат', pronunciation: { en: 'BRUTH-er', ro: 'FRAH-teh', it: 'frah-TEHL-loh', fr: 'frehr', ru: 'brat' } },
        { hebrew: 'אחות', en: 'Sister', ro: 'Soră', it: 'Sorella', fr: 'Sœur', ru: 'Сестра', pronunciation: { en: 'SIS-ter', ro: 'SOH-ruh', it: 'soh-REHL-lah', fr: 'suhr', ru: 'sehs-TRAH' } },
        { hebrew: 'סבים', en: 'Grandparents', ro: 'Bunici', it: 'Nonni', fr: 'Grands-parents', ru: 'Бабушка и дедушка', pronunciation: { en: 'GRAND-pair-ents', ro: 'BOO-nee-chee', it: 'NOHN-nee', fr: 'grahn pah-RAHN', ru: 'BAH-boosh-kah eed deh-DOOSH-kah' } },
        { hebrew: 'אב', en: 'Father', ro: 'Tată', it: 'Padre', fr: 'Père', ru: 'Отец', pronunciation: { en: 'FAH-ther', ro: 'TAH-tuh', it: 'PAH-dreh', fr: 'pehr', ru: 'ah-TYETS' } },
        { hebrew: 'אם', en: 'Mother', ro: 'Mamă', it: 'Madre', fr: 'Mère', ru: 'Мать', pronunciation: { en: 'MUH-ther', ro: 'MAH-muh', it: 'MAH-dreh', fr: 'mehr', ru: 'mat' } },
        { hebrew: 'אבא', en: 'Dad', ro: 'Tată', it: 'Papà', fr: 'Papa', ru: 'Папа', pronunciation: { en: 'dad', ro: 'TAH-tuh', it: 'pah-PAH', fr: 'pah-PAH', ru: 'PAH-pah' } },
        { hebrew: 'אמא', en: 'Mom', ro: 'Mamă', it: 'Mamma', fr: 'Maman', ru: 'Мама', pronunciation: { en: 'mom', ro: 'MAH-muh', it: 'MAHM-mah', fr: 'mah-MAHN', ru: 'MAH-mah' } },
        { hebrew: 'בעלי', en: 'My husband', ro: 'Soțul meu', it: 'Mio marito', fr: 'Mon mari', ru: 'Мой муж', pronunciation: { en: 'my HUZ-bund', ro: 'SOHT-sool meh-OO', it: 'MEE-oh mah-REE-toh', fr: 'mohn mah-REE', ru: 'moy moozh' } },
        { hebrew: 'מה שלומך, אמא?', en: 'How are you, Mom?', ro: 'Ce mai faci, mamă?', it: 'Come stai, mamma?', fr: 'Comment vas-tu, maman?', ru: 'Как дела, мама?', pronunciation: { en: 'how ar yoo mom', ro: 'cheh mai FAH-chee MAH-muh', it: 'KOH-meh STAH-ee MAHM-mah', fr: 'koh-MAHN vah-TOO mah-MAHN', ru: 'kak dee-LAH MAH-mah' }, isSentence: true },
        { hebrew: 'אני רוצה לאכול חביתה בלחמניה', en: 'I want to eat an omelet in a bun', ro: 'Vreau să mănânc o omletă într-o chiflă', it: 'Voglio mangiare una frittata in un panino', fr: 'Je veux manger une omelette dans un petit pain', ru: 'Я хочу съесть омлет в булочке', pronunciation: { en: 'ay want tu eet an OM-let in a bun', ro: 'vreh-OO suh muh-NUHNK oh ohm-LEH-tuh uhn-TROH KEE-fluh', it: 'VOH-lyoh mahn-JAH-reh OO-nah free-TAH-tah een oon pah-NEE-noh', fr: 'zhuh vuh mah-ZHAY oon oh-meh-LEHT dahnz uhn puh-TEE pan', ru: 'yah kho-CHOO s-YEST ohm-LYET v boo-LOCH-keh' }, isSentence: true },
        { hebrew: 'בן', en: 'Son', ro: 'Fiu', it: 'Figlio', fr: 'Fils', ru: 'Сын', pronunciation: { en: 'suhn', ro: 'fee-OO', it: 'FEE-lyoh', fr: 'fees', ru: 'syn' } },
        { hebrew: 'בת', en: 'Daughter', ro: 'Fiică', it: 'Figlia', fr: 'Fille', ru: 'Дочь', pronunciation: { en: 'DAW-ter', ro: 'FEE-kuh', it: 'FEE-lyah', fr: 'feey', ru: 'doch' } },
        { hebrew: 'דוד', en: 'Uncle', ro: 'Unchi', it: 'Zio', fr: 'Oncle', ru: 'Дядя', pronunciation: { en: 'UHNG-kul', ro: 'OON-kee', it: 'TSEE-oh', fr: 'ohnkl', ru: 'DYAH-dyah' } },
        { hebrew: 'דודה', en: 'Aunt', ro: 'Mătușă', it: 'Zia', fr: 'Tante', ru: 'Тётя', pronunciation: { en: 'ant', ro: 'muh-TOO-shuh', it: 'TSEE-ah', fr: 'tahnt', ru: 'TYOH-tyah' } },
        { hebrew: 'בן דוד', en: 'Cousin', ro: 'Văr', it: 'Cugino', fr: 'Cousin', ru: 'Двоюродный брат', pronunciation: { en: 'KUHZ-in', ro: 'vuhr', it: 'koo-JEE-noh', fr: 'koo-ZAN', ru: 'dvah-YOO-rahd-ny brat' } },
        { hebrew: 'חתן', en: 'Son-in-law', ro: 'Ginere', it: 'Genero', fr: 'Beau-fils', ru: 'Зять', pronunciation: { en: 'suhn in law', ro: 'jee-NEH-reh', it: 'jeh-NEH-roh', fr: 'boh fees', ru: 'zyat' } },
        { hebrew: 'כלה', en: 'Daughter-in-law', ro: 'Nora', it: 'Nuora', fr: 'Belle-fille', ru: 'Невестка', pronunciation: { en: 'DAW-ter in law', ro: 'NOH-rah', it: 'NWOH-rah', fr: 'behl feey', ru: 'neh-VYEST-kah' } },
        { hebrew: 'סבא', en: 'Grandfather', ro: 'Bunic', it: 'Nonno', fr: 'Grand-père', ru: 'Дедушка', pronunciation: { en: 'GRAND-fah-ther', ro: 'BOO-neek', it: 'NOHN-noh', fr: 'grahn pehr', ru: 'deh-DOOSH-kah' } },
        { hebrew: 'סבתא', en: 'Grandmother', ro: 'Bunică', it: 'Nonna', fr: 'Grand-mère', ru: 'Бабушка', pronunciation: { en: 'GRAND-muh-ther', ro: 'BOO-nee-kuh', it: 'NOHN-nah', fr: 'grahn mehr', ru: 'BAH-boosh-kah' } },
        { hebrew: 'נכד', en: 'Grandson', ro: 'Nepot', it: 'Nipote', fr: 'Petit-fils', ru: 'Внук', pronunciation: { en: 'GRAND-suhn', ro: 'neh-POHT', it: 'nee-POH-teh', fr: 'puh-TEE fees', ru: 'vnook' } },
        { hebrew: 'נכדה', en: 'Granddaughter', ro: 'Nepoată', it: 'Nipote', fr: 'Petite-fille', ru: 'Внучка', pronunciation: { en: 'GRAND-daw-ter', ro: 'neh-PWAH-tuh', it: 'nee-POH-teh', fr: 'puh-TEET feey', ru: 'vnooch-KAH' } },
        { hebrew: 'גיס', en: 'Brother-in-law', ro: 'Cumnat', it: 'Cognato', fr: 'Beau-frère', ru: 'Шурин', pronunciation: { en: 'BRUTH-er in law', ro: 'koom-NAHT', it: 'kohn-YAH-toh', fr: 'boh frehr', ru: 'SHOO-reen' } },
        { hebrew: 'גיסה', en: 'Sister-in-law', ro: 'Cumnată', it: 'Cognata', fr: 'Belle-sœur', ru: 'Невестка', pronunciation: { en: 'SIS-ter in law', ro: 'koom-NAH-tuh', it: 'kohn-YAH-tah', fr: 'behl suhr', ru: 'neh-VYEST-kah' } },
        { hebrew: 'חם', en: 'Father-in-law', ro: 'Socru', it: 'Suocero', fr: 'Beau-père', ru: 'Свёкор', pronunciation: { en: 'FAH-ther in law', ro: 'SOH-kroo', it: 'SWOH-cheh-roh', fr: 'boh pehr', ru: 'svyoh-KOR' } },
        { hebrew: 'חמות', en: 'Mother-in-law', ro: 'Soacră', it: 'Suocera', fr: 'Belle-mère', ru: 'Свекровь', pronunciation: { en: 'MUH-ther in law', ro: 'SWAH-kruh', it: 'SWOH-cheh-rah', fr: 'behl mehr', ru: 'sveh-KROV' } },
        { hebrew: 'תאומים', en: 'Twins', ro: 'Gemeni', it: 'Gemelli', fr: 'Jumeaux', ru: 'Близнецы', pronunciation: { en: 'twinz', ro: 'jeh-MEH-nee', it: 'jeh-MEHL-lee', fr: 'zhoo-MOH', ru: 'bleez-NYEH-tsy' } },
        { hebrew: 'אחיין', en: 'Nephew', ro: 'Nepot', it: 'Nipote', fr: 'Neveu', ru: 'Племянник', pronunciation: { en: 'NEF-yoo', ro: 'neh-POHT', it: 'nee-POH-teh', fr: 'nuh-VUH', ru: 'pleh-MYAHN-neek' } },
        { hebrew: 'אחיינית', en: 'Niece', ro: 'Nepoată', it: 'Nipote', fr: 'Nièce', ru: 'Племянница', pronunciation: { en: 'nees', ro: 'neh-PWAH-tuh', it: 'nee-POH-teh', fr: 'nyehs', ru: 'pleh-MYAHN-nee-tsah' } },
        { hebrew: 'חתונה', en: 'Wedding', ro: 'Nuntă', it: 'Matrimonio', fr: 'Mariage', ru: 'Свадьба', pronunciation: { en: 'WED-ing', ro: 'NOON-tuh', it: 'mah-tree-MOH-nyoh', fr: 'mah-ree-AHZH', ru: 'SVAHD-bah' } },
        { hebrew: 'אירוסין', en: 'Engagement', ro: 'Logodnă', it: 'Fidanzamento', fr: 'Fiançailles', ru: 'Помолвка', pronunciation: { en: 'en-GAYJ-ment', ro: 'loh-gohd-NUH', it: 'fee-dahn-zah-MEN-toh', fr: 'fee-ahn-SAHY', ru: 'pah-MOHLV-kah' } },
        { hebrew: 'גרוש', en: 'Divorced', ro: 'Divorțat', it: 'Divorziato', fr: 'Divorcé', ru: 'Разведённый', pronunciation: { en: 'di-VORST', ro: 'dee-vohr-TSAHT', it: 'dee-vohr-TSYAH-toh', fr: 'dee-vohr-SAY', ru: 'rahz-veh-DYON-ny' } },
      ],
    },
    עסקים: {
      title: 'עסקים וכלכלה',
      description: 'מילים מתקדמות בעסקים',
      vocabulary: [
        { hebrew: 'חברה', en: 'Company', ro: 'Companie', it: 'Azienda', fr: 'Entreprise', ru: 'Компания', pronunciation: { en: 'KUM-puh-nee', ro: 'kohm-pah-NEE-eh', it: 'ah-TSYEHN-dah', fr: 'ahn-truh-PREEZ', ru: 'kahm-PAH-nee-yah' } },
        { hebrew: 'השקעה', en: 'Investment', ro: 'Investiție', it: 'Investimento', fr: 'Investissement', ru: 'Инвестиция', pronunciation: { en: 'in-VEST-ment', ro: 'een-veh-STEE-tsee-eh', it: 'een-veh-STEE-men-toh', fr: 'an-veh-stees-MAHN', ru: 'een-veh-STEE-tsee-yah' } },
        { hebrew: 'רווח', en: 'Profit', ro: 'Profit', it: 'Profitto', fr: 'Profit', ru: 'Прибыль', pronunciation: { en: 'PROF-it', ro: 'proh-FEET', it: 'proh-FEET-toh', fr: 'proh-FEE', ru: 'PREE-byl' } },
        { hebrew: 'שוק', en: 'Market', ro: 'Piață', it: 'Mercato', fr: 'Marché', ru: 'Рынок', pronunciation: { en: 'MAR-ket', ro: 'PYAH-tsuh', it: 'mehr-KAH-toh', fr: 'mahr-SHAY', ru: 'RY-nahk' } },
        { hebrew: 'משא ומתן', en: 'Negotiation', ro: 'Negociere', it: 'Negoziazione', fr: 'Négociation', ru: 'Переговоры', pronunciation: { en: 'ni-goh-shee-AY-shun', ro: 'neh-goh-chee-EH-reh', it: 'neh-goh-tsee-ah-TSYOH-neh', fr: 'nay-goh-see-ah-SYOHN', ru: 'peh-reh-gah-VOH-ry' } },
        { hebrew: 'חוזה', en: 'Contract', ro: 'Contract', it: 'Contratto', fr: 'Contrat', ru: 'Контракт', pronunciation: { en: 'KON-trakt', ro: 'kohn-TRAHKT', it: 'kohn-TRAHT-toh', fr: 'kohn-TRAH', ru: 'kahn-TRAHKT' } },
        { hebrew: 'מנהל', en: 'Manager', ro: 'Manager', it: 'Manager', fr: 'Gestionnaire', ru: 'Менеджер', pronunciation: { en: 'MAN-ij-er', ro: 'MAH-nah-jehr', it: 'MAH-nah-jehr', fr: 'zhees-tee-oh-NAIR', ru: 'meh-nehd-ZHEHR' } },
        { hebrew: 'מכירה', en: 'Sale', ro: 'Vânzare', it: 'Vendita', fr: 'Vente', ru: 'Продажа', pronunciation: { en: 'sayl', ro: 'vuhn-ZAH-reh', it: 'vehn-DEE-tah', fr: 'vahnt', ru: 'prah-DAH-zhah' } },
        { hebrew: 'קנייה', en: 'Purchase', ro: 'Cumpărare', it: 'Acquisto', fr: 'Achat', ru: 'Покупка', pronunciation: { en: 'PUR-chis', ro: 'koom-puh-RAH-reh', it: 'ah-KWEE-stoh', fr: 'ah-SHAH', ru: 'pah-KOOP-kah' } },
        { hebrew: 'חשבון בנק', en: 'Bank account', ro: 'Cont bancar', it: 'Conto bancario', fr: 'Compte bancaire', ru: 'Банковский счёт', pronunciation: { en: 'bangk uh-KOWNT', ro: 'kohnt bahn-KAHR', it: 'KOHN-toh bahn-KAH-ree-oh', fr: 'kohnt bahn-KEHR', ru: 'bahn-KOHV-skee schyot' } },
        { hebrew: 'הלוואה', en: 'Loan', ro: 'Împrumut', it: 'Prestito', fr: 'Prêt', ru: 'Займ', pronunciation: { en: 'lohn', ro: 'uhm-proo-MOOT', it: 'PREH-stee-toh', fr: 'pray', ru: 'zaim' } },
        { hebrew: 'ריבית', en: 'Interest', ro: 'Dobândă', it: 'Interesse', fr: 'Intérêt', ru: 'Процент', pronunciation: { en: 'IN-ter-ist', ro: 'doh-BUHN-duh', it: 'een-teh-REHS-seh', fr: 'an-tay-RAY', ru: 'prah-TSEHNT' } },
        { hebrew: 'מס', en: 'Tax', ro: 'Impozit', it: 'Tassa', fr: 'Impôt', ru: 'Налог', pronunciation: { en: 'taks', ro: 'eem-poh-ZEET', it: 'TAHS-sah', fr: 'an-POH', ru: 'nah-LOHG' } },
        { hebrew: 'משכורת', en: 'Salary', ro: 'Salariu', it: 'Stipendio', fr: 'Salaire', ru: 'Зарплата', pronunciation: { en: 'SAL-uh-ree', ro: 'sah-LAH-ree-oo', it: 'stee-PEHN-dyoh', fr: 'sah-LEHR', ru: 'zahr-PLAH-tah' } },
      ],
    },
    תרבות: {
      title: 'תרבות ואמנות',
      description: 'מילים הקשורות לתרבות',
      vocabulary: [
        { hebrew: 'תרבות', en: 'Culture', ro: 'Cultură', it: 'Cultura', fr: 'Culture', ru: 'Культура', pronunciation: { en: 'KUL-chur', ro: 'kool-TOO-ruh', it: 'kool-TOO-rah', fr: 'kool-TOOR', ru: 'kool-TOO-rah' } },
        { hebrew: 'אמנות', en: 'Art', ro: 'Artă', it: 'Arte', fr: 'Art', ru: 'Искусство', pronunciation: { en: 'ahrt', ro: 'AHR-tuh', it: 'AHR-teh', fr: 'ahr', ru: 'ees-KOOS-stvah' } },
        { hebrew: 'מוזיאון', en: 'Museum', ro: 'Muzeu', it: 'Museo', fr: 'Musée', ru: 'Музей', pronunciation: { en: 'myoo-ZEE-um', ro: 'moo-ZEH-oo', it: 'moo-ZEH-oh', fr: 'moo-ZAY', ru: 'moo-ZAY' } },
        { hebrew: 'תיאטרון', en: 'Theater', ro: 'Teatru', it: 'Teatro', fr: 'Théâtre', ru: 'Театр', pronunciation: { en: 'THEE-uh-ter', ro: 'teh-AH-troo', it: 'teh-AH-troh', fr: 'tay-AH-truh', ru: 'teh-AHTR' } },
        { hebrew: 'ספרות', en: 'Literature', ro: 'Literatură', it: 'Letteratura', fr: 'Littérature', ru: 'Литература', pronunciation: { en: 'LIT-er-uh-chur', ro: 'lee-teh-rah-TOO-ruh', it: 'leht-teh-rah-TOO-rah', fr: 'lee-tay-rah-TOOR', ru: 'lee-teh-rah-TOO-rah' } },
        { hebrew: 'מוזיקה', en: 'Music', ro: 'Muzică', it: 'Musica', fr: 'Musique', ru: 'Музыка', pronunciation: { en: 'MYOO-zik', ro: 'moo-ZEE-kuh', it: 'MOO-zee-kah', fr: 'moo-ZEEK', ru: 'MOO-zy-kah' } },
        { hebrew: 'שיר', en: 'Song', ro: 'Cântec', it: 'Canzone', fr: 'Chanson', ru: 'Песня', pronunciation: { en: 'sawng', ro: 'kuhn-TEHK', it: 'kahn-ZOH-neh', fr: 'shahn-SOHN', ru: 'PYEHS-nyah' } },
        { hebrew: 'ציור', en: 'Painting', ro: 'Pictură', it: 'Pittura', fr: 'Peinture', ru: 'Картина', pronunciation: { en: 'PAYN-ting', ro: 'peek-TOO-ruh', it: 'peet-TOO-rah', fr: 'pan-TOOR', ru: 'kar-TEE-nah' } },
        { hebrew: 'פסל', en: 'Sculpture', ro: 'Sculptură', it: 'Scultura', fr: 'Sculpture', ru: 'Скульптура', pronunciation: { en: 'SKUHLP-chur', ro: 'skoolp-TOO-ruh', it: 'skool-TOO-rah', fr: 'skoolp-TOOR', ru: 'skoolp-TOO-rah' } },
        { hebrew: 'פסטיבל', en: 'Festival', ro: 'Festival', it: 'Festival', fr: 'Festival', ru: 'Фестиваль', pronunciation: { en: 'FES-tuh-vul', ro: 'fehs-tee-VAHL', it: 'fehs-tee-VAHL', fr: 'fehs-tee-VAHL', ru: 'fehs-tee-VAHL' } },
      ],
    },
    טכנולוגיה: {
      title: 'טכנולוגיה ומחשבים',
      description: 'מילים הקשורות לטכנולוגיה',
      vocabulary: [
        { hebrew: 'מחשב', en: 'Computer', ro: 'Computer', it: 'Computer', fr: 'Ordinateur', ru: 'Компьютер', pronunciation: { en: 'kum-PYOO-ter', ro: 'kohm-POO-ter', it: 'kohm-POO-ter', fr: 'or-dee-nah-TUHR', ru: 'kahm-PYOO-ter' } },
        { hebrew: 'טלפון', en: 'Phone', ro: 'Telefon', it: 'Telefono', fr: 'Téléphone', ru: 'Телефон', pronunciation: { en: 'fohn', ro: 'teh-leh-FOHN', it: 'teh-LEH-foh-noh', fr: 'tay-lay-FOHN', ru: 'teh-leh-FOHN' } },
        { hebrew: 'אינטרנט', en: 'Internet', ro: 'Internet', it: 'Internet', fr: 'Internet', ru: 'Интернет', pronunciation: { en: 'IN-ter-net', ro: 'een-ter-NET', it: 'een-ter-NET', fr: 'an-ter-NET', ru: 'een-ter-NET' } },
        { hebrew: 'אימייל', en: 'Email', ro: 'Email', it: 'Email', fr: 'Email', ru: 'Электронная почта', pronunciation: { en: 'EE-mayl', ro: 'eh-MAIL', it: 'eh-MAIL', fr: 'eh-MAIL', ru: 'eh-lehk-TROH-nah-yah POCH-tah' } },
        { hebrew: 'אתר', en: 'Website', ro: 'Site', it: 'Sito', fr: 'Site web', ru: 'Веб-сайт', pronunciation: { en: 'WEB-sahyt', ro: 'seet', it: 'SEE-toh', fr: 'seet web', ru: 'vehb-sah-EET' } },
        { hebrew: 'תוכנה', en: 'Software', ro: 'Software', it: 'Software', fr: 'Logiciel', ru: 'Программное обеспечение', pronunciation: { en: 'SAWFT-wair', ro: 'SAWFT-wair', it: 'SAWFT-wair', fr: 'loh-zhee-SYEL', ru: 'prah-GRAHM-nah-yeh ah-beh-SPEH-cheh-nyeh' } },
        { hebrew: 'מצלמה', en: 'Camera', ro: 'Cameră', it: 'Fotocamera', fr: 'Appareil photo', ru: 'Камера', pronunciation: { en: 'KAM-er-uh', ro: 'kah-MEH-ruh', it: 'foh-toh-KAH-meh-rah', fr: 'ah-pah-RAY foh-TOH', ru: 'KAH-meh-rah' } },
        { hebrew: 'מקלדת', en: 'Keyboard', ro: 'Tastatură', it: 'Tastiera', fr: 'Clavier', ru: 'Клавиатура', pronunciation: { en: 'KEE-bord', ro: 'tahs-tah-TOO-ruh', it: 'tahs-TYEH-rah', fr: 'klah-VYAY', ru: 'klah-vee-ah-TOO-rah' } },
        { hebrew: 'עכבר', en: 'Mouse', ro: 'Mouse', it: 'Mouse', fr: 'Souris', ru: 'Мышь', pronunciation: { en: 'mows', ro: 'mows', it: 'mows', fr: 'soo-REE', ru: 'mysh' } },
        { hebrew: 'מסך', en: 'Screen', ro: 'Ecran', it: 'Schermo', fr: 'Écran', ru: 'Экран', pronunciation: { en: 'skreen', ro: 'eh-KRAHN', it: 'SKEHR-moh', fr: 'ay-KRAHN', ru: 'eh-KRAHN' } },
        { hebrew: 'טאבלט', en: 'Tablet', ro: 'Tabletă', it: 'Tablet', fr: 'Tablette', ru: 'Планшет', pronunciation: { en: 'TAB-lit', ro: 'tah-BLEH-tuh', it: 'TAH-bleht', fr: 'tah-BLEHT', ru: 'plahn-SHEHT' } },
        { hebrew: 'סמארטפון', en: 'Smartphone', ro: 'Smartphone', it: 'Smartphone', fr: 'Smartphone', ru: 'Смартфон', pronunciation: { en: 'SMAHRT-fohn', ro: 'SMAHRT-fohn', it: 'SMAHRT-fohn', fr: 'smahrt-FOHN', ru: 'smahrt-FOHN' } },
        { hebrew: 'מצלמה דיגיטלית', en: 'Digital camera', ro: 'Cameră digitală', it: 'Fotocamera digitale', fr: 'Appareil photo numérique', ru: 'Цифровая камера', pronunciation: { en: 'DIJ-i-tul KAM-er-uh', ro: 'kah-MEH-ruh dee-jee-TAH-luh', it: 'foh-toh-KAH-meh-rah dee-jee-TAH-leh', fr: 'ah-pah-RAY foh-TOH noo-may-REEK', ru: 'tsee-FROH-vah-yah KAH-meh-rah' } },
        { hebrew: 'מדפסת', en: 'Printer', ro: 'Imprimantă', it: 'Stampante', fr: 'Imprimante', ru: 'Принтер', pronunciation: { en: 'PRIN-ter', ro: 'eem-pree-MAHN-tuh', it: 'stahm-PAHN-teh', fr: 'an-pree-MAHNT', ru: 'PREEN-ter' } },
        { hebrew: 'סורק', en: 'Scanner', ro: 'Scaner', it: 'Scanner', fr: 'Scanner', ru: 'Сканер', pronunciation: { en: 'SKAN-er', ro: 'SKAH-nehr', it: 'SKAH-nehr', fr: 'skah-NAYR', ru: 'SKAH-ner' } },
        { hebrew: 'רשת', en: 'Network', ro: 'Rețea', it: 'Rete', fr: 'Réseau', ru: 'Сеть', pronunciation: { en: 'NET-wurk', ro: 'REH-tseh-ah', it: 'REH-teh', fr: 'ray-ZOH', ru: 'syet' } },
        { hebrew: 'Wi-Fi', en: 'Wi-Fi', ro: 'Wi-Fi', it: 'Wi-Fi', fr: 'Wi-Fi', ru: 'Wi-Fi', pronunciation: { en: 'WAHY-fahy', ro: 'WAHY-fahy', it: 'WAHY-fahy', fr: 'wee-FEE', ru: 'wee-FEE' } },
        { hebrew: 'סיסמה', en: 'Password', ro: 'Parolă', it: 'Password', fr: 'Mot de passe', ru: 'Пароль', pronunciation: { en: 'PAS-wurd', ro: 'pah-ROH-luh', it: 'PAHS-wurd', fr: 'moh duh pahs', ru: 'pah-ROHL' } },
        { hebrew: 'תוכנית', en: 'Program', ro: 'Program', it: 'Programma', fr: 'Programme', ru: 'Программа', pronunciation: { en: 'PROH-gram', ro: 'proh-GRAHM', it: 'proh-GRAHM-mah', fr: 'proh-GRAHM', ru: 'prah-GRAHM-mah' } },
      ],
      sentences: [
        { hebrew: 'אני משתמש במחשב כל יום לעבודה', en: 'I use the computer every day for work', ro: 'Folosesc computerul în fiecare zi pentru muncă', it: 'Uso il computer ogni giorno per lavoro', fr: 'J\'utilise l\'ordinateur tous les jours pour le travail', ru: 'Я использую компьютер каждый день для работы', isSentence: true },
        { hebrew: 'הטלפון שלי לא עובד ואני צריך לתקן אותו', en: 'My phone is not working and I need to fix it', ro: 'Telefonul meu nu funcționează și trebuie să-l repar', it: 'Il mio telefono non funziona e devo ripararlo', fr: 'Mon téléphone ne fonctionne pas et je dois le réparer', ru: 'Мой телефон не работает и мне нужно его починить', isSentence: true },
        { hebrew: 'אני שולח אימייל ללקוח כל בוקר', en: 'I send an email to the client every morning', ro: 'Trimit un email clientului în fiecare dimineață', it: 'Invio un\'email al cliente ogni mattina', fr: 'J\'envoie un email au client tous les matins', ru: 'Я отправляю электронное письмо клиенту каждое утро', isSentence: true },
        { hebrew: 'האינטרנט בבית שלי מהיר מאוד', en: 'The internet at my house is very fast', ro: 'Internetul de la mine acasă este foarte rapid', it: 'L\'internet a casa mia è molto veloce', fr: 'L\'internet chez moi est très rapide', ru: 'Интернет у меня дома очень быстрый', isSentence: true },
      ],
    },
    רגשות: {
      title: 'רגשות ורגשות',
      description: 'ללמוד להביע רגשות',
      vocabulary: [
        { hebrew: 'שמח', en: 'Happy', ro: 'Fericit', it: 'Felice', fr: 'Heureux', ru: 'Счастливый', pronunciation: { en: 'HAP-ee', ro: 'feh-ree-CHEET', it: 'feh-LEE-cheh', fr: 'uh-RUH', ru: 'SHCHAS-lee-vy' } },
        { hebrew: 'עצוב', en: 'Sad', ro: 'Trist', it: 'Triste', fr: 'Triste', ru: 'Грустный', pronunciation: { en: 'sad', ro: 'treest', it: 'TREES-teh', fr: 'treest', ru: 'GROOS-ny' } },
        { hebrew: 'כועס', en: 'Angry', ro: 'Furios', it: 'Arrabbiato', fr: 'En colère', ru: 'Злой', pronunciation: { en: 'ANG-gree', ro: 'foo-ree-OHS', it: 'ahr-rahb-BYAH-toh', fr: 'ahn koh-LEHR', ru: 'zloy' } },
        { hebrew: 'מפחד', en: 'Afraid', ro: 'Înfricat', it: 'Pauroso', fr: 'Effrayé', ru: 'Испуганный', pronunciation: { en: 'uh-FRAYD', ro: 'uhn-free-KAHT', it: 'pah-oo-ROH-soh', fr: 'eh-fray-AY', ru: 'ees-POO-gahn-ny' } },
        { hebrew: 'מופתע', en: 'Surprised', ro: 'Surprins', it: 'Sorpreso', fr: 'Surpris', ru: 'Удивлённый', pronunciation: { en: 'sur-PRAHYZD', ro: 'soor-PREENS', it: 'sor-PREH-zoh', fr: 'soor-PREE', ru: 'oo-deev-LYON-ny' } },
        { hebrew: 'נרגש', en: 'Excited', ro: 'Emoționat', it: 'Emozionato', fr: 'Excité', ru: 'Взволнованный', pronunciation: { en: 'ik-SAHY-ted', ro: 'eh-moh-tsee-oh-NAHT', it: 'eh-moh-tsee-oh-NAH-toh', fr: 'ehk-see-TAY', ru: 'vz-vahl-NOH-vahn-ny' } },
        { hebrew: 'רגוע', en: 'Calm', ro: 'Calm', it: 'Calmo', fr: 'Calme', ru: 'Спокойный', pronunciation: { en: 'kahm', ro: 'kahlm', it: 'KAHL-moh', fr: 'kahlm', ru: 'spah-KOY-ny' } },
        { hebrew: 'עצבני', en: 'Nervous', ro: 'Nervos', it: 'Nervoso', fr: 'Nerveux', ru: 'Нервный', pronunciation: { en: 'NUR-vus', ro: 'nehr-VOHS', it: 'nehr-VOH-soh', fr: 'nehr-VUH', ru: 'NYER-vny' } },
        { hebrew: 'גאה', en: 'Proud', ro: 'Mândru', it: 'Orgoglioso', fr: 'Fier', ru: 'Гордый', pronunciation: { en: 'prowd', ro: 'MUHN-droo', it: 'or-goh-LYOH-soh', fr: 'fyehr', ru: 'GOR-dy' } },
        { hebrew: 'אהבה', en: 'Love', ro: 'Iubire', it: 'Amore', fr: 'Amour', ru: 'Любовь', pronunciation: { en: 'luhv', ro: 'yoo-BEE-reh', it: 'ah-MOH-reh', fr: 'ah-MOOR', ru: 'lyoo-BOV' } },
        { hebrew: 'שנאה', en: 'Hate', ro: 'Ura', it: 'Odio', fr: 'Haine', ru: 'Ненависть', pronunciation: { en: 'hayt', ro: 'OO-rah', it: 'OH-dyoh', fr: 'ehn', ru: 'neh-NAH-veest' } },
        { hebrew: 'פחד', en: 'Fear', ro: 'Frică', it: 'Paura', fr: 'Peur', ru: 'Страх', pronunciation: { en: 'feer', ro: 'FREE-kuh', it: 'PAH-oo-rah', fr: 'puhr', ru: 'strakh' } },
        { hebrew: 'שמחה', en: 'Joy', ro: 'Bucurie', it: 'Gioia', fr: 'Joie', ru: 'Радость', pronunciation: { en: 'joy', ro: 'boo-KOO-ree-eh', it: 'JOH-yah', fr: 'zhwah', ru: 'RAH-dahst' } },
        { hebrew: 'כעס', en: 'Anger', ro: 'Furie', it: 'Rabbia', fr: 'Colère', ru: 'Гнев', pronunciation: { en: 'ANG-ger', ro: 'foo-REE-eh', it: 'RAHB-byah', fr: 'koh-LEHR', ru: 'gnyev' } },
        { hebrew: 'אכזבה', en: 'Disappointment', ro: 'Decepție', it: 'Delusione', fr: 'Déception', ru: 'Разочарование', pronunciation: { en: 'dis-uh-POINT-ment', ro: 'deh-CHEHP-tsee-eh', it: 'deh-loo-ZYOH-neh', fr: 'day-sehp-SYOHN', ru: 'rah-zah-chah-ROH-vah-nyeh' } },
        { hebrew: 'תקווה', en: 'Hope', ro: 'Speranță', it: 'Speranza', fr: 'Espoir', ru: 'Надежда', pronunciation: { en: 'hohp', ro: 'speh-RAHN-tsuh', it: 'speh-RAHN-zah', fr: 'ehs-PWAHR', ru: 'nah-DYEZH-dah' } },
        { hebrew: 'ייאוש', en: 'Despair', ro: 'Deznădejde', it: 'Disperazione', fr: 'Désespoir', ru: 'Отчаяние', pronunciation: { en: 'di-SPAIR', ro: 'dehz-nuh-DEZH-deh', it: 'dee-speh-rah-TSYOH-neh', fr: 'day-zeh-PWAHR', ru: 'aht-chah-YAH-nyeh' } },
        { hebrew: 'התרגשות', en: 'Excitement', ro: 'Emoție', it: 'Eccitazione', fr: 'Excitation', ru: 'Волнение', pronunciation: { en: 'ik-SAHYT-ment', ro: 'eh-MOH-tsee-eh', it: 'eh-chee-tah-TSYOH-neh', fr: 'ehk-see-tah-SYOHN', ru: 'vahl-NYEH-nyeh' } },
        { hebrew: 'שלווה', en: 'Peace', ro: 'Pace', it: 'Pace', fr: 'Paix', ru: 'Покой', pronunciation: { en: 'pees', ro: 'PAH-cheh', it: 'PAH-cheh', fr: 'pay', ru: 'pah-KOY' } },
      ],
      sentences: [
        { hebrew: 'אני מאוד שמח לראות אותך היום', en: 'I am very happy to see you today', ro: 'Sunt foarte fericit să te văd astăzi', it: 'Sono molto felice di vederti oggi', fr: 'Je suis très heureux de te voir aujourd\'hui', ru: 'Я очень рад видеть тебя сегодня', isSentence: true },
        { hebrew: 'הוא עצוב כי הוא איבד את הארנק שלו', en: 'He is sad because he lost his wallet', ro: 'Este trist pentru că și-a pierdut portofelul', it: 'È triste perché ha perso il portafoglio', fr: 'Il est triste car il a perdu son portefeuille', ru: 'Он грустный, потому что потерял кошелёк', isSentence: true },
        { hebrew: 'אני נרגש מאוד מהנסיעה הקרובה', en: 'I am very excited about the upcoming trip', ro: 'Sunt foarte emoționat de călătoria viitoare', it: 'Sono molto emozionato per il viaggio imminente', fr: 'Je suis très excité par le voyage à venir', ru: 'Я очень взволнован предстоящей поездкой', isSentence: true },
        { hebrew: 'יש לי תקווה שהכל יהיה טוב', en: 'I have hope that everything will be good', ro: 'Am speranță că totul va fi bine', it: 'Ho speranza che tutto andrà bene', fr: 'J\'ai l\'espoir que tout ira bien', ru: 'Я надеюсь, что всё будет хорошо', isSentence: true },
      ],
    },
    מדע: {
      title: 'מדע וטכנולוגיה',
      description: 'מילים הקשורות למדע',
      vocabulary: [
        { hebrew: 'מדע', en: 'Science', ro: 'Știință', it: 'Scienza', fr: 'Science', ru: 'Наука', pronunciation: { en: 'SAHY-uhns', ro: 'shtee-EEN-tsuh', it: 'SHYEHN-zah', fr: 'syahns', ru: 'nah-OO-kah' } },
        { hebrew: 'ניסוי', en: 'Experiment', ro: 'Experiment', it: 'Esperimento', fr: 'Expérience', ru: 'Эксперимент', pronunciation: { en: 'ik-SPER-i-ment', ro: 'ehk-speh-ree-MENT', it: 'ehs-peh-ree-MEN-toh', fr: 'ehks-pay-ree-AHNS', ru: 'ehk-speh-ree-MYENT' } },
        { hebrew: 'מחקר', en: 'Research', ro: 'Cercetare', it: 'Ricerca', fr: 'Recherche', ru: 'Исследование', pronunciation: { en: 'ri-SURCH', ro: 'chehr-cheh-TAH-reh', it: 'ree-CHEHR-kah', fr: 'ruh-SHEHRSH', ru: 'ees-sleh-DOH-vah-nyeh' } },
        { hebrew: 'תגלית', en: 'Discovery', ro: 'Descoperire', it: 'Scoperta', fr: 'Découverte', ru: 'Открытие', pronunciation: { en: 'di-SKUHV-uh-ree', ro: 'dehs-koh-peh-REE-reh', it: 'skoh-PEHR-tah', fr: 'day-koo-VEHRT', ru: 'aht-KRY-tee-yeh' } },
        { hebrew: 'כימיה', en: 'Chemistry', ro: 'Chimie', it: 'Chimica', fr: 'Chimie', ru: 'Химия', pronunciation: { en: 'KEM-uh-stree', ro: 'kee-MEE-eh', it: 'KEE-mee-kah', fr: 'shee-MEE', ru: 'KHEE-mee-yah' } },
        { hebrew: 'פיזיקה', en: 'Physics', ro: 'Fizică', it: 'Fisica', fr: 'Physique', ru: 'Физика', pronunciation: { en: 'FIZ-iks', ro: 'fee-ZEE-kuh', it: 'FEE-zee-kah', fr: 'fee-ZEEK', ru: 'FEE-zee-kah' } },
        { hebrew: 'ביולוגיה', en: 'Biology', ro: 'Biologie', it: 'Biologia', fr: 'Biologie', ru: 'Биология', pronunciation: { en: 'bahy-OL-uh-jee', ro: 'bee-oh-loh-JEE-eh', it: 'bee-oh-loh-JEE-ah', fr: 'bee-oh-loh-ZHEE', ru: 'bee-ah-LOH-gee-yah' } },
        { hebrew: 'מתמטיקה', en: 'Mathematics', ro: 'Matematică', it: 'Matematica', fr: 'Mathématiques', ru: 'Математика', pronunciation: { en: 'math-uh-MAT-iks', ro: 'mah-teh-MAH-tee-kuh', it: 'mah-teh-MAH-tee-kah', fr: 'mah-tay-mah-TEEK', ru: 'mah-teh-MAH-tee-kah' } },
        { hebrew: 'אטום', en: 'Atom', ro: 'Atom', it: 'Atomo', fr: 'Atome', ru: 'Атом', pronunciation: { en: 'AT-uhm', ro: 'ah-TOHM', it: 'AH-toh-moh', fr: 'ah-TOHM', ru: 'AH-tahm' } },
        { hebrew: 'אנרגיה', en: 'Energy', ro: 'Energie', it: 'Energia', fr: 'Énergie', ru: 'Энергия', pronunciation: { en: 'EN-er-jee', ro: 'eh-nehr-JEE-eh', it: 'eh-nehr-JEE-ah', fr: 'ay-nayr-ZHEE', ru: 'eh-NYER-gee-yah' } },
        { hebrew: 'כוח', en: 'Force', ro: 'Forță', it: 'Forza', fr: 'Force', ru: 'Сила', pronunciation: { en: 'fors', ro: 'FOHR-tsuh', it: 'FOR-tsah', fr: 'fors', ru: 'SEE-lah' } },
        { hebrew: 'טמפרטורה', en: 'Temperature', ro: 'Temperatură', it: 'Temperatura', fr: 'Température', ru: 'Температура', pronunciation: { en: 'TEM-per-uh-chur', ro: 'tehm-peh-rah-TOO-ruh', it: 'tehm-peh-rah-TOO-rah', fr: 'tahn-pay-rah-TOOR', ru: 'tehm-peh-rah-TOO-rah' } },
        { hebrew: 'מולקולה', en: 'Molecule', ro: 'Moleculă', it: 'Molecola', fr: 'Molécule', ru: 'Молекула', pronunciation: { en: 'MOL-uh-kyool', ro: 'moh-LEH-koo-luh', it: 'moh-LEH-koh-lah', fr: 'moh-lay-KOOL', ru: 'mah-LEH-koo-lah' } },
        { hebrew: 'גן', en: 'Gene', ro: 'Gen', it: 'Gene', fr: 'Gène', ru: 'Ген', pronunciation: { en: 'jeen', ro: 'jehn', it: 'JEH-neh', fr: 'zhehn', ru: 'gyen' } },
        { hebrew: 'DNA', en: 'DNA', ro: 'ADN', it: 'DNA', fr: 'ADN', ru: 'ДНК', pronunciation: { en: 'DEE-en-AY', ro: 'ah-deh-ehn', it: 'dee-ehn-AH', fr: 'ah-deh-ehn', ru: 'deh-ehn-kah' } },
        { hebrew: 'מיקרוסקופ', en: 'Microscope', ro: 'Microscop', it: 'Microscopio', fr: 'Microscope', ru: 'Микроскоп', pronunciation: { en: 'MAHY-kruh-skohp', ro: 'mee-kroh-SKOHP', it: 'mee-kroh-SKOH-pyoh', fr: 'mee-kroh-SKOHP', ru: 'meek-rah-SKOHP' } },
        { hebrew: 'מעבדה', en: 'Laboratory', ro: 'Laborator', it: 'Laboratorio', fr: 'Laboratoire', ru: 'Лаборатория', pronunciation: { en: 'LAB-ruh-tor-ee', ro: 'lah-boh-rah-TOHR', it: 'lah-boh-rah-TOH-ree-oh', fr: 'lah-boh-rah-TWAHR', ru: 'lah-bah-rah-TOH-ree-yah' } },
        { hebrew: 'תאוריה', en: 'Theory', ro: 'Teorie', it: 'Teoria', fr: 'Théorie', ru: 'Теория', pronunciation: { en: 'THEE-uh-ree', ro: 'teh-oh-REE-eh', it: 'teh-oh-REE-ah', fr: 'tay-oh-REE', ru: 'teh-oh-REE-yah' } },
        { hebrew: 'ניסוי', en: 'Test', ro: 'Test', it: 'Test', fr: 'Test', ru: 'Тест', pronunciation: { en: 'test', ro: 'tehst', it: 'tehst', fr: 'tehst', ru: 'tehst' } },
        { hebrew: 'תוצאה', en: 'Result', ro: 'Rezultat', it: 'Risultato', fr: 'Résultat', ru: 'Результат', pronunciation: { en: 'ri-ZUHLT', ro: 'reh-zool-TAHT', it: 'ree-zool-TAH-toh', fr: 'ray-zool-TAH', ru: 'reh-zool-TAHT' } },
        { hebrew: 'ניתוח', en: 'Analysis', ro: 'Analiză', it: 'Analisi', fr: 'Analyse', ru: 'Анализ', pronunciation: { en: 'uh-NAL-uh-sis', ro: 'ah-nah-LEE-zuh', it: 'ah-NAH-lee-see', fr: 'ah-nah-LEEZ', ru: 'ah-NAH-leez' } },
      ],
    },
    טבע: {
      title: 'טבע וסביבה',
      description: 'מילים הקשורות לטבע',
      vocabulary: [
        { hebrew: 'עץ', en: 'Tree', ro: 'Copac', it: 'Albero', fr: 'Arbre', ru: 'Дерево', pronunciation: { en: 'tree', ro: 'koh-PAHK', it: 'AHL-beh-roh', fr: 'ahrbr', ru: 'DYEH-reh-vah' } },
        { hebrew: 'פרח', en: 'Flower', ro: 'Floare', it: 'Fiore', fr: 'Fleur', ru: 'Цветок', pronunciation: { en: 'FLOW-er', ro: 'FLOH-ah-reh', it: 'FYOH-reh', fr: 'fluhr', ru: 'tseh-VTOHK' } },
        { hebrew: 'עלה', en: 'Leaf', ro: 'Frunză', it: 'Foglia', fr: 'Feuille', ru: 'Лист', pronunciation: { en: 'leef', ro: 'FROON-zuh', it: 'FOH-lyah', fr: 'fuhy', ru: 'leest' } },
        { hebrew: 'אדמה', en: 'Earth', ro: 'Pământ', it: 'Terra', fr: 'Terre', ru: 'Земля', pronunciation: { en: 'urth', ro: 'puh-MUHNT', it: 'TEHR-rah', fr: 'tehr', ru: 'zeh-MLYAH' } },
        { hebrew: 'מים', en: 'Water', ro: 'Apă', it: 'Acqua', fr: 'Eau', ru: 'Вода', pronunciation: { en: 'WAW-ter', ro: 'AH-puh', it: 'AHK-kwah', fr: 'oh', ru: 'vah-DAH' } },
        { hebrew: 'אש', en: 'Fire', ro: 'Foc', it: 'Fuoco', fr: 'Feu', ru: 'Огонь', pronunciation: { en: 'fahyr', ro: 'fohk', it: 'FWOH-koh', fr: 'fuh', ru: 'ah-GOHN' } },
        { hebrew: 'אוויר', en: 'Air', ro: 'Aer', it: 'Aria', fr: 'Air', ru: 'Воздух', pronunciation: { en: 'air', ro: 'ah-EHR', it: 'AH-ree-ah', fr: 'ehr', ru: 'VOZ-dookh' } },
        { hebrew: 'שמיים', en: 'Sky', ro: 'Cer', it: 'Cielo', fr: 'Ciel', ru: 'Небо', pronunciation: { en: 'skahy', ro: 'chehr', it: 'CHYEH-loh', fr: 'syel', ru: 'NYEH-bah' } },
        { hebrew: 'כוכב', en: 'Star', ro: 'Stea', it: 'Stella', fr: 'Étoile', ru: 'Звезда', pronunciation: { en: 'stahr', ro: 'steh-AH', it: 'STEHL-lah', fr: 'ay-TWAHL', ru: 'zvehz-DAH' } },
        { hebrew: 'ירח', en: 'Moon', ro: 'Lună', it: 'Luna', fr: 'Lune', ru: 'Луна', pronunciation: { en: 'moon', ro: 'LOO-nuh', it: 'LOO-nah', fr: 'loon', ru: 'loo-NAH' } },
        { hebrew: 'שמש', en: 'Sun', ro: 'Soare', it: 'Sole', fr: 'Soleil', ru: 'Солнце', pronunciation: { en: 'suhn', ro: 'SWAH-reh', it: 'SOH-leh', fr: 'soh-LAY', ru: 'SOHN-tseh' } },
        { hebrew: 'נהר', en: 'River', ro: 'Râu', it: 'Fiume', fr: 'Rivière', ru: 'Река', pronunciation: { en: 'RIV-er', ro: 'ruh-OO', it: 'FYOO-meh', fr: 'ree-VYEHR', ru: 'reh-KAH' } },
        { hebrew: 'ים', en: 'Sea', ro: 'Mare', it: 'Mare', fr: 'Mer', ru: 'Море', pronunciation: { en: 'see', ro: 'MAH-reh', it: 'MAH-reh', fr: 'mehr', ru: 'mah-REH' } },
        { hebrew: 'הר', en: 'Mountain', ro: 'Munte', it: 'Montagna', fr: 'Montagne', ru: 'Гора', pronunciation: { en: 'MOWN-tin', ro: 'MOON-teh', it: 'mohn-TAHN-yah', fr: 'mohn-TAHN-yuh', ru: 'gah-RAH' } },
        { hebrew: 'יער', en: 'Forest', ro: 'Pădure', it: 'Foresta', fr: 'Forêt', ru: 'Лес', pronunciation: { en: 'FOR-ist', ro: 'puh-DOO-reh', it: 'foh-REHS-tah', fr: 'foh-RAY', ru: 'lyes' } },
        { hebrew: 'מדבר', en: 'Desert', ro: 'Deșert', it: 'Deserto', fr: 'Désert', ru: 'Пустыня', pronunciation: { en: 'DEZ-ert', ro: 'deh-SHEHRT', it: 'deh-ZEHR-toh', fr: 'day-ZEHR', ru: 'poo-STY-nyah' } },
        { hebrew: 'חוף', en: 'Coast', ro: 'Coastă', it: 'Costa', fr: 'Côte', ru: 'Побережье', pronunciation: { en: 'kohst', ro: 'KWAH-stuh', it: 'KOHS-tah', fr: 'koht', ru: 'pah-beh-REHZH-yeh' } },
        { hebrew: 'אי', en: 'Island', ro: 'Insulă', it: 'Isola', fr: 'Île', ru: 'Остров', pronunciation: { en: 'AHY-lund', ro: 'een-SOO-luh', it: 'EE-zoh-lah', fr: 'eel', ru: 'OHS-trahv' } },
        { hebrew: 'אגם', en: 'Lake', ro: 'Lac', it: 'Lago', fr: 'Lac', ru: 'Озеро', pronunciation: { en: 'layk', ro: 'lahk', it: 'LAH-goh', fr: 'lahk', ru: 'ah-ZEH-rah' } },
        { hebrew: 'מפל', en: 'Waterfall', ro: 'Cascadă', it: 'Cascata', fr: 'Cascade', ru: 'Водопад', pronunciation: { en: 'WAW-ter-fawl', ro: 'kahs-KAH-duh', it: 'kahs-KAH-tah', fr: 'kahs-KAHD', ru: 'vah-dah-PAHD' } },
        { hebrew: 'עמק', en: 'Valley', ro: 'Vale', it: 'Valle', fr: 'Vallée', ru: 'Долина', pronunciation: { en: 'VAL-ee', ro: 'VAH-leh', it: 'VAHL-leh', fr: 'vah-LAY', ru: 'dah-LEE-nah' } },
        { hebrew: 'מערה', en: 'Cave', ro: 'Peșteră', it: 'Grotta', fr: 'Grotte', ru: 'Пещера', pronunciation: { en: 'kayv', ro: 'PEHSH-teh-ruh', it: 'GROHT-tah', fr: 'groht', ru: 'peh-SHCHYEH-rah' } },
        { hebrew: 'חול', en: 'Sand', ro: 'Nisip', it: 'Sabbia', fr: 'Sable', ru: 'Песок', pronunciation: { en: 'sand', ro: 'nee-SEEP', it: 'SAHB-byah', fr: 'sahbl', ru: 'peh-SOHK' } },
      ],
      sentences: [
        { hebrew: 'אנחנו הולכים לטייל ביער בסוף השבוע', en: 'We are going hiking in the forest this weekend', ro: 'Mergem să facem drumeții în pădure în weekend', it: 'Andiamo a fare escursioni nella foresta questo fine settimana', fr: 'Nous allons faire de la randonnée dans la forêt ce week-end', ru: 'Мы идём в поход в лес в эти выходные', isSentence: true },
        { hebrew: 'ההר הזה הוא הגבוה ביותר באזור', en: 'This mountain is the highest in the area', ro: 'Acest munte este cel mai înalt din zonă', it: 'Questa montagna è la più alta della zona', fr: 'Cette montagne est la plus haute de la région', ru: 'Эта гора самая высокая в этом районе', isSentence: true },
        { hebrew: 'הים נראה כל כך כחול ויפה היום', en: 'The sea looks so blue and beautiful today', ro: 'Marea arată atât de albastră și frumoasă astăzi', it: 'Il mare sembra così blu e bello oggi', fr: 'La mer a l\'air si bleue et belle aujourd\'hui', ru: 'Море сегодня выглядит таким синим и красивым', isSentence: true },
        { hebrew: 'הפרחים בפארק פורחים באביב', en: 'The flowers in the park bloom in spring', ro: 'Florile din parc înfloresc primăvara', it: 'I fiori nel parco fioriscono in primavera', fr: 'Les fleurs du parc fleurissent au printemps', ru: 'Цветы в парке цветут весной', isSentence: true },
      ],
    },
    בריאות: {
      title: 'בריאות ורפואה',
      description: 'מילים שימושיות בבריאות ורפואה',
      vocabulary: [
        { hebrew: 'רופא', en: 'Doctor', ro: 'Doctor', it: 'Dottore', fr: 'Médecin', ru: 'Врач', pronunciation: { en: 'DOK-ter', ro: 'dohk-TOHR', it: 'doht-TOH-reh', fr: 'may-SAN', ru: 'vrahch' } },
        { hebrew: 'אחות', en: 'Nurse', ro: 'Asistentă medicală', it: 'Infermiera', fr: 'Infirmière', ru: 'Медсестра', pronunciation: { en: 'nurs', ro: 'ah-sees-TEHN-tuh meh-dee-KAH-luh', it: 'een-fehr-MYEH-rah', fr: 'an-feer-MYEHR', ru: 'mehd-seh-STRAH' } },
        { hebrew: 'בית חולים', en: 'Hospital', ro: 'Spital', it: 'Ospedale', fr: 'Hôpital', ru: 'Больница', pronunciation: { en: 'HOS-pi-tul', ro: 'spee-TAHL', it: 'ohs-peh-DAH-leh', fr: 'oh-pee-TAHL', ru: 'bahl-NEE-tsah' } },
        { hebrew: 'תרופה', en: 'Medicine', ro: 'Medicament', it: 'Medicina', fr: 'Médicament', ru: 'Лекарство', pronunciation: { en: 'MED-i-sin', ro: 'meh-dee-kah-MENT', it: 'meh-dee-CHEE-nah', fr: 'may-dee-kah-MAHN', ru: 'leh-KAHR-stvah' } },
        { hebrew: 'כאב', en: 'Pain', ro: 'Durere', it: 'Dolore', fr: 'Douleur', ru: 'Боль', pronunciation: { en: 'payn', ro: 'doo-REH-reh', it: 'doh-LOH-reh', fr: 'doo-LUHR', ru: 'bol' } },
        { hebrew: 'חום', en: 'Fever', ro: 'Febră', it: 'Febbre', fr: 'Fièvre', ru: 'Лихорадка', pronunciation: { en: 'FEE-ver', ro: 'FEH-bruh', it: 'FEHB-breh', fr: 'fyehv', ru: 'lee-khah-RAHD-kah' } },
        { hebrew: 'תסמין', en: 'Symptom', ro: 'Simptom', it: 'Sintomo', fr: 'Symptôme', ru: 'Симптом', pronunciation: { en: 'SIMP-tum', ro: 'seemp-TOHM', it: 'SEEN-toh-moh', fr: 'samp-TOHM', ru: 'seem-TOHM' } },
        { hebrew: 'בדיקה', en: 'Examination', ro: 'Examinare', it: 'Visita', fr: 'Examen', ru: 'Обследование', pronunciation: { en: 'ig-zam-uh-NEY-shun', ro: 'ehk-sah-mee-NAH-reh', it: 'VEE-zee-tah', fr: 'ehg-zah-MAHN', ru: 'ahb-sleh-DOH-vah-nyeh' } },
        { hebrew: 'טיפול', en: 'Treatment', ro: 'Tratament', it: 'Trattamento', fr: 'Traitement', ru: 'Лечение', pronunciation: { en: 'TREET-ment', ro: 'trah-tah-MENT', it: 'traht-tah-MEHN-toh', fr: 'trayt-MAHN', ru: 'leh-CHEH-nyeh' } },
        { hebrew: 'ניתוח', en: 'Surgery', ro: 'Chirurgie', it: 'Chirurgia', fr: 'Chirurgie', ru: 'Хирургия', pronunciation: { en: 'SUR-jer-ee', ro: 'kee-roor-JEE-eh', it: 'kee-roor-JEE-ah', fr: 'shee-roor-ZHEE', ru: 'khee-roor-GEE-yah' } },
        { hebrew: 'מרשם', en: 'Prescription', ro: 'Prescripție', it: 'Ricetta', fr: 'Ordonnance', ru: 'Рецепт', pronunciation: { en: 'pri-SKRIP-shun', ro: 'prehs-kreep-TSEE-eh', it: 'ree-CHEHT-tah', fr: 'or-doh-NAHNS', ru: 'reh-TSEHPT' } },
        { hebrew: 'חיסון', en: 'Vaccine', ro: 'Vaccin', it: 'Vaccino', fr: 'Vaccin', ru: 'Вакцина', pronunciation: { en: 'vak-SEEN', ro: 'vahk-CHEEN', it: 'vahk-CHEE-noh', fr: 'vahk-SAN', ru: 'vahk-TSEE-nah' } },
        { hebrew: 'בריא', en: 'Healthy', ro: 'Sănătos', it: 'Sano', fr: 'En bonne santé', ru: 'Здоровый', pronunciation: { en: 'HEL-thee', ro: 'suh-nuh-TOHS', it: 'SAH-noh', fr: 'ahn bohn sah-TAY', ru: 'zdah-ROH-vy' } },
        { hebrew: 'חולה', en: 'Sick', ro: 'Bolnav', it: 'Malato', fr: 'Malade', ru: 'Больной', pronunciation: { en: 'sik', ro: 'bohl-NAHV', it: 'mah-LAH-toh', fr: 'mah-LAHD', ru: 'bahl-NOY' } },
        { hebrew: 'תרגיל', en: 'Exercise', ro: 'Exercițiu', it: 'Esercizio', fr: 'Exercice', ru: 'Упражнение', pronunciation: { en: 'EK-ser-sahyz', ro: 'ehk-sehr-CHEE-tsee-oo', it: 'eh-sehr-CHEE-tsee-oh', fr: 'ehg-sehr-SEES', ru: 'oo-prahzh-NYEH-nyeh' } },
      ],
      sentences: [
        { hebrew: 'אני צריך ללכת לרופא כי יש לי כאב ראש', en: 'I need to go to the doctor because I have a headache', ro: 'Trebuie să merg la doctor pentru că am dureri de cap', it: 'Devo andare dal dottore perché ho mal di testa', fr: 'Je dois aller chez le médecin car j\'ai mal à la tête', ru: 'Мне нужно пойти к врачу, потому что у меня болит голова', isSentence: true },
        { hebrew: 'האחות נתנה לי תרופה לכאב', en: 'The nurse gave me medicine for the pain', ro: 'Asistenta medicală mi-a dat medicament pentru durere', it: 'L\'infermiera mi ha dato la medicina per il dolore', fr: 'L\'infirmière m\'a donné un médicament pour la douleur', ru: 'Медсестра дала мне лекарство от боли', isSentence: true },
        { hebrew: 'אני מרגיש בריא אחרי הטיפול', en: 'I feel healthy after the treatment', ro: 'Mă simt sănătos după tratament', it: 'Mi sento sano dopo il trattamento', fr: 'Je me sens en bonne santé après le traitement', ru: 'Я чувствую себя здоровым после лечения', isSentence: true },
        { hebrew: 'הרופא המליץ לי לעשות תרגילים כל יום', en: 'The doctor recommended that I exercise every day', ro: 'Doctorul mi-a recomandat să fac exerciții în fiecare zi', it: 'Il dottore mi ha raccomandato di fare esercizi ogni giorno', fr: 'Le médecin m\'a recommandé de faire de l\'exercice tous les jours', ru: 'Врач рекомендовал мне делать упражнения каждый день', isSentence: true },
      ],
    },
    ספורט: {
      title: 'ספורט וכושר',
      description: 'מילים הקשורות לספורט',
      vocabulary: [
        { hebrew: 'כדורגל', en: 'Football', ro: 'Fotbal', it: 'Calcio', fr: 'Football', ru: 'Футбол', pronunciation: { en: 'FOOT-bawl', ro: 'foht-BAHL', it: 'KAHL-choh', fr: 'foot-BAHL', ru: 'foot-BOL' } },
        { hebrew: 'כדורסל', en: 'Basketball', ro: 'Baschet', it: 'Pallacanestro', fr: 'Basketball', ru: 'Баскетбол', pronunciation: { en: 'BAS-kit-bawl', ro: 'bahs-KEHT', it: 'pahl-lah-kah-NEHS-troh', fr: 'bahs-kayt-BAHL', ru: 'bahs-keht-BOL' } },
        { hebrew: 'טניס', en: 'Tennis', ro: 'Tenis', it: 'Tennis', fr: 'Tennis', ru: 'Теннис', pronunciation: { en: 'TEN-is', ro: 'TEH-nees', it: 'TEHN-nees', fr: 'teh-NEES', ru: 'TEHN-nees' } },
        { hebrew: 'שחייה', en: 'Swimming', ro: 'Înot', it: 'Nuoto', fr: 'Natation', ru: 'Плавание', pronunciation: { en: 'SWIM-ing', ro: 'UHN-oht', it: 'NWOH-toh', fr: 'nah-tah-SYOHN', ru: 'PLAH-vah-nyeh' } },
        { hebrew: 'ריצה', en: 'Running', ro: 'Alergare', it: 'Corsa', fr: 'Course', ru: 'Бег', pronunciation: { en: 'RUHN-ing', ro: 'ah-lehr-GAH-reh', it: 'KOR-sah', fr: 'koors', ru: 'byek' } },
        { hebrew: 'אופניים', en: 'Bicycle', ro: 'Bicicletă', it: 'Bicicletta', fr: 'Vélo', ru: 'Велосипед', pronunciation: { en: 'BAHY-si-kul', ro: 'bee-chee-KLEH-tuh', it: 'bee-chee-KLEHT-tah', fr: 'vay-LOH', ru: 'veh-lah-SEE-pehd' } },
        { hebrew: 'מגרש', en: 'Field', ro: 'Teren', it: 'Campo', fr: 'Terrain', ru: 'Поле', pronunciation: { en: 'feeld', ro: 'TEH-rehn', it: 'KAHM-poh', fr: 'teh-RAN', ru: 'poh-LEH' } },
        { hebrew: 'שחקן', en: 'Player', ro: 'Jucător', it: 'Giocatore', fr: 'Joueur', ru: 'Игрок', pronunciation: { en: 'PLAY-er', ro: 'zhoo-kuh-TOHR', it: 'joh-kah-TOH-reh', fr: 'zhoo-UHR', ru: 'ee-GROHK' } },
        { hebrew: 'קבוצה', en: 'Team', ro: 'Echipă', it: 'Squadra', fr: 'Équipe', ru: 'Команда', pronunciation: { en: 'teem', ro: 'eh-KEE-puh', it: 'SKWAH-drah', fr: 'ay-KEEP', ru: 'kah-MAHN-dah' } },
        { hebrew: 'משחק', en: 'Game', ro: 'Joc', it: 'Partita', fr: 'Match', ru: 'Игра', pronunciation: { en: 'gaym', ro: 'zhohk', it: 'pahr-TEE-tah', fr: 'mahch', ru: 'ee-GRAH' } },
        { hebrew: 'ניצחון', en: 'Victory', ro: 'Victorie', it: 'Vittoria', fr: 'Victoire', ru: 'Победа', pronunciation: { en: 'VIK-tuh-ree', ro: 'veek-toh-REE-eh', it: 'veet-TOH-ree-ah', fr: 'veek-TWAHR', ru: 'pah-BEH-dah' } },
        { hebrew: 'הפסד', en: 'Defeat', ro: 'Înfrângere', it: 'Sconfitta', fr: 'Défaite', ru: 'Поражение', pronunciation: { en: 'di-FEET', ro: 'uhn-FRUHN-jeh-reh', it: 'skohn-FEET-tah', fr: 'day-FEHT', ru: 'pah-rah-ZHEH-nyeh' } },
        { hebrew: 'אימון', en: 'Training', ro: 'Antrenament', it: 'Allenamento', fr: 'Entraînement', ru: 'Тренировка', pronunciation: { en: 'TRAYN-ing', ro: 'ahn-treh-nah-MENT', it: 'ahl-leh-nah-MEHN-toh', fr: 'ahn-tray-NAH-MAHN', ru: 'treh-nee-ROV-kah' } },
        { hebrew: 'מאמן', en: 'Coach', ro: 'Antrenor', it: 'Allenatore', fr: 'Entraîneur', ru: 'Тренер', pronunciation: { en: 'kohch', ro: 'ahn-treh-NOHR', it: 'ahl-leh-nah-TOH-reh', fr: 'ahn-tray-NUHR', ru: 'treh-NYER' } },
        { hebrew: 'תחרות', en: 'Competition', ro: 'Competiție', it: 'Competizione', fr: 'Compétition', ru: 'Соревнование', pronunciation: { en: 'kom-pi-TISH-un', ro: 'kohm-peh-TEE-tsee-eh', it: 'kohm-peh-tee-TSYOH-neh', fr: 'kohm-pay-tee-SYOHN', ru: 'sah-rehv-nah-VAH-nyeh' } },
      ],
      sentences: [
        { hebrew: 'אני משחק כדורגל כל שבוע עם החברים שלי', en: 'I play football every week with my friends', ro: 'Joc fotbal în fiecare săptămână cu prietenii mei', it: 'Gioco a calcio ogni settimana con i miei amici', fr: 'Je joue au football chaque semaine avec mes amis', ru: 'Я играю в футбол каждую неделю с друзьями', isSentence: true },
        { hebrew: 'הקבוצה שלנו ניצחה במשחק אתמול', en: 'Our team won the game yesterday', ro: 'Echipa noastră a câștigat meciul ieri', it: 'La nostra squadra ha vinto la partita ieri', fr: 'Notre équipe a gagné le match hier', ru: 'Наша команда выиграла игру вчера', isSentence: true },
        { hebrew: 'אני הולך לאימון כל יום שני', en: 'I go to training every Monday', ro: 'Merg la antrenament în fiecare luni', it: 'Vado all\'allenamento ogni lunedì', fr: 'Je vais à l\'entraînement tous les lundis', ru: 'Я хожу на тренировку каждый понедельник', isSentence: true },
        { hebrew: 'המאמן שלנו מעולה ומלמד אותנו טוב', en: 'Our coach is excellent and teaches us well', ro: 'Antrenorul nostru este excelent și ne învață bine', it: 'Il nostro allenatore è eccellente e ci insegna bene', fr: 'Notre entraîneur est excellent et nous enseigne bien', ru: 'Наш тренер отличный и хорошо нас учит', isSentence: true },
      ],
    },
    מוזיקה: {
      title: 'מוזיקה ובידור',
      description: 'מילים הקשורות למוזיקה ובידור',
      vocabulary: [
        { hebrew: 'מוזיקה', en: 'Music', ro: 'Muzică', it: 'Musica', fr: 'Musique', ru: 'Музыка', pronunciation: { en: 'MYOO-zik', ro: 'moo-ZEE-kuh', it: 'MOO-zee-kah', fr: 'moo-ZEEK', ru: 'MOO-zy-kah' } },
        { hebrew: 'שיר', en: 'Song', ro: 'Cântec', it: 'Canzone', fr: 'Chanson', ru: 'Песня', pronunciation: { en: 'sawng', ro: 'kuhn-TEHK', it: 'kahn-TSOH-neh', fr: 'shahn-SOHN', ru: 'PYEH-snyah' } },
        { hebrew: 'זמר', en: 'Singer', ro: 'Cântăreț', it: 'Cantante', fr: 'Chanteur', ru: 'Певец', pronunciation: { en: 'SING-er', ro: 'kuhn-tuh-REHTS', it: 'kahn-TAHN-teh', fr: 'shahn-TUHR', ru: 'PYEH-vehts' } },
        { hebrew: 'כלי נגינה', en: 'Musical instrument', ro: 'Instrument muzical', it: 'Strumento musicale', fr: 'Instrument de musique', ru: 'Музыкальный инструмент', pronunciation: { en: 'MYOO-zi-kul IN-struh-ment', ro: 'een-stroo-MENT moo-ZEE-kahl', it: 'stroo-MEHN-toh moo-zee-KAH-leh', fr: 'an-stroo-MAHN duh moo-ZEEK', ru: 'moo-ZY-kahl-ny een-stroo-MYENT' } },
        { hebrew: 'פסנתר', en: 'Piano', ro: 'Pian', it: 'Pianoforte', fr: 'Piano', ru: 'Пианино', pronunciation: { en: 'pee-AN-oh', ro: 'pyahn', it: 'pyah-noh-FOR-teh', fr: 'pyah-NOH', ru: 'pee-ah-NEE-nah' } },
        { hebrew: 'גיטרה', en: 'Guitar', ro: 'Chitară', it: 'Chitarra', fr: 'Guitare', ru: 'Гитара', pronunciation: { en: 'gi-TAHR', ro: 'kee-TAH-ruh', it: 'kee-TAHR-rah', fr: 'gee-TAHR', ru: 'gee-TAH-rah' } },
        { hebrew: 'תזמורת', en: 'Orchestra', ro: 'Orchestră', it: 'Orchestra', fr: 'Orchestre', ru: 'Оркестр', pronunciation: { en: 'OR-ki-struh', ro: 'or-KEHS-truh', it: 'or-KEHS-trah', fr: 'or-KEHSTR', ru: 'or-KEHSTR' } },
        { hebrew: 'קונצרט', en: 'Concert', ro: 'Concert', it: 'Concerto', fr: 'Concert', ru: 'Концерт', pronunciation: { en: 'KON-sert', ro: 'kohn-CHEHRT', it: 'kohn-CHEHR-toh', fr: 'kohn-SEHR', ru: 'kahn-TSEHRT' } },
        { hebrew: 'תיאטרון', en: 'Theater', ro: 'Teatru', it: 'Teatro', fr: 'Théâtre', ru: 'Театр', pronunciation: { en: 'THEE-uh-ter', ro: 'teh-AH-troo', it: 'teh-AH-troh', fr: 'tay-AH-truh', ru: 'teh-AHTR' } },
        { hebrew: 'סרט', en: 'Movie', ro: 'Film', it: 'Film', fr: 'Film', ru: 'Фильм', pronunciation: { en: 'MOO-vee', ro: 'feelm', it: 'feelm', fr: 'feelm', ru: 'feelm' } },
        { hebrew: 'ספר', en: 'Book', ro: 'Carte', it: 'Libro', fr: 'Livre', ru: 'Книга', pronunciation: { en: 'book', ro: 'KAHR-teh', it: 'LEE-broh', fr: 'leevr', ru: 'KNEE-gah' } },
        { hebrew: 'ריקוד', en: 'Dance', ro: 'Dans', it: 'Danza', fr: 'Danse', ru: 'Танец', pronunciation: { en: 'dans', ro: 'dahns', it: 'DAHN-zah', fr: 'dahns', ru: 'tah-NYETS' } },
        { hebrew: 'מחולל', en: 'DJ', ro: 'DJ', it: 'DJ', fr: 'DJ', ru: 'Диджей', pronunciation: { en: 'DEE-jay', ro: 'dee-jay', it: 'dee-jay', fr: 'dee-jay', ru: 'deed-ZHEY' } },
        { hebrew: 'מיקרופון', en: 'Microphone', ro: 'Microfon', it: 'Microfono', fr: 'Microphone', ru: 'Микрофон', pronunciation: { en: 'MAHY-kruh-fohn', ro: 'mee-kroh-FOHN', it: 'mee-KROH-foh-noh', fr: 'mee-kroh-FOHN', ru: 'meek-rah-FOHN' } },
        { hebrew: 'אלבום', en: 'Album', ro: 'Album', it: 'Album', fr: 'Album', ru: 'Альбом', pronunciation: { en: 'AL-buhm', ro: 'AHL-boohm', it: 'AHL-boohm', fr: 'ahl-BOOM', ru: 'ahl-BOM' } },
      ],
      sentences: [
        { hebrew: 'אני אוהב לשמוע מוזיקה כשהוא עובד', en: 'I love listening to music while I work', ro: 'Îmi place să ascult muzică în timp ce lucrez', it: 'Amo ascoltare musica mentre lavoro', fr: 'J\'aime écouter de la musique pendant que je travaille', ru: 'Я люблю слушать музыку, пока работаю', isSentence: true },
        { hebrew: 'הזמר הזה שר שירים יפים מאוד', en: 'This singer sings very beautiful songs', ro: 'Acest cântăreț cântă cântece foarte frumoase', it: 'Questo cantante canta canzoni molto belle', fr: 'Ce chanteur chante de très belles chansons', ru: 'Этот певец поёт очень красивые песни', isSentence: true },
        { hebrew: 'אנחנו הולכים לקונצרט מחר בערב', en: 'We are going to a concert tomorrow evening', ro: 'Mergem la un concert mâine seara', it: 'Andiamo a un concerto domani sera', fr: 'Nous allons à un concert demain soir', ru: 'Мы идём на концерт завтра вечером', isSentence: true },
        { hebrew: 'הסרט הזה הוא הטוב ביותר שראיתי', en: 'This movie is the best I have seen', ro: 'Acest film este cel mai bun pe care l-am văzut', it: 'Questo film è il migliore che abbia mai visto', fr: 'Ce film est le meilleur que j\'ai vu', ru: 'Этот фильм - лучший, который я видел', isSentence: true },
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

async function generateGrammarNotes(
  topic: string,
  level: LanguageLevel,
  targetLanguage: SupportedLanguageKey,
  vocabulary: any[],
  sentences: any[]
): Promise<string> {
  const languageNames: Record<SupportedLanguageKey, string> = {
    english: 'אנגלית',
    romanian: 'רומנית',
    italian: 'איטלקית',
    french: 'צרפתית',
    russian: 'רוסית',
  };

  const levelNames: Record<LanguageLevel, string> = {
    BEGINNER: 'מתחיל',
    INTERMEDIATE: 'בינוני',
    ADVANCED: 'מתקדם',
  };

  const langName = languageNames[targetLanguage];
  const levelName = levelNames[level];

  // Extract key vocabulary terms for context
  const vocabTerms = vocabulary.slice(0, 10).map((v: any) => v.hebrew).join(', ');
  const sentenceExamples = sentences.slice(0, 3).map((s: any) => s.hebrew).join('; ');

  const prompt = `אתה מורה מקצועי לשפות שמלמד דוברי עברית את השפה ${langName}.

הנושא של השיעור: ${topic}
רמת הלימוד: ${levelName}
השפה הנלמדת: ${langName}

מילים מרכזיות בשיעור: ${vocabTerms}
${sentenceExamples ? `דוגמאות משפטים: ${sentenceExamples}` : ''}

צור הסבר דקדוקי מפורט ומעשי בעברית לשיעור זה. ההסבר צריך להיות ברור, קונקרטי ומעשי.

**ההסבר חייב לכלול:**

1. **כללי דקדוק ספציפיים** - לא רק "יש מילות יחס", אלא הסבר מפורט:
   - איך משתמשים בכלל הזה בפועל?
   - מה המבנה המדויק של המשפט?
   - איך מטים פעלים/שמות עצם/תארים?
   - איפה מניחים את המילה במשפט?

2. **דוגמאות קונקרטיות מהשיעור** - לכל כלל דקדוק, תן דוגמה מהמילים/משפטים בשיעור:
   - "במשפט '${sentenceExamples.split(';')[0] || 'דוגמה'}' אנו רואים ש..."
   - "המילה '${vocabTerms.split(',')[0] || 'דוגמה'}' משתמשת בכלל..."

3. **הבדלים קריטיים בין עברית ל-${langName}**:
   - מה שונה בסדר המילים?
   - מה שונה בהטיות?
   - מה שונה בשימוש במילות יחס?
   - תן דוגמאות ספציפיות!

4. **שגיאות נפוצות של דוברי עברית**:
   - מה דוברי עברית עושים לא נכון?
   - איך להימנע מהשגיאה?
   - תן דוגמה של שגיאה נפוצה + התיקון הנכון

5. **טיפים מעשיים לשימוש**:
   - איך לזכור את הכלל?
   - מתי להשתמש בו?
   - מה הדרך הקלה ביותר ליישם אותו?

**חשוב מאוד:**
- אל תכתוב הסברים כלליים כמו "בשיעור זה נלמד מילים הקשורות ל-${topic}"
- תן הסברים ספציפיים עם דוגמאות מהשיעור
- השתמש במילים ובמשפטים מהשיעור כדוגמאות
- הסבר בעברית, ברור ומובן
- השתמש ב-HTML בסיסי לפורמט (p, strong, ul, li, h3, h4)

**דוגמה להסבר טוב:**
במקום: "בשיעור זה נלמד על מילות יחס"
כתוב: "במשפט '${sentenceExamples.split(';')[0] || 'דוגמה'}' המילה 'X' היא מילת יחס. ב-${langName}, מילות יחס מופיעות לפני שם העצם (בניגוד לעברית שבה הן יכולות להופיע אחרי). למשל: 'אני הולך אל הבית' ב-${langName} אומרים 'I go TO the house' ולא 'I go the house TO'."`;

  const systemPrompt = `אתה מורה מקצועי לשפות שמסביר דקדוק בצורה ברורה ומובנת לדוברי עברית. אתה יוצר הסברים מפורטים עם דוגמאות מעשיות.`;

  try {
    const grammarNotes = await generateText({
      prompt,
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.7,
    });

    // Ensure it's valid HTML
    if (!grammarNotes.trim().startsWith('<')) {
      return `<p>${grammarNotes}</p>`;
    }

    return grammarNotes;
  } catch (error) {
    console.error('Error generating grammar notes:', error);
    // Fallback to basic explanation
    return `<p>בשיעור זה נלמד מילים ומשפטים הקשורים ל-${topic} בשפה ${langName}. נדגיש כללי דקדוק חשובים ונעסוק בשימוש מעשי במילים.</p>`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetLanguage, createAll = false, overwrite = false } = body;

    // REQUIRE targetLanguage - only allow updating one language at a time
    if (!targetLanguage) {
      return NextResponse.json({
        success: false,
        error: 'targetLanguage is required. Only one language can be updated at a time.',
      }, { status: 400 });
    }

    const createdLessons: any[] = [];
    const updatedLessons: any[] = [];
    const errors: string[] = [];

    // Only create/update for the specified targetLanguage
    const languagesToCreate = [targetLanguage] as SupportedLanguageKey[];
    
    // If createAll is true, update all levels, otherwise only BEGINNER
    const levelsToCreate = createAll 
      ? (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as LanguageLevel[])
      : (['BEGINNER'] as LanguageLevel[]);

    console.log('Creating lessons for languages:', languagesToCreate);
    console.log('Creating lessons for levels:', levelsToCreate);
    console.log('createAll flag:', createAll);
    console.log('overwrite flag:', overwrite);

    // Calculate total number of lessons to process
    let totalLessons = 0;
    for (const level of levelsToCreate) {
      const topicsForLevel = LESSON_TEMPLATES[level] || {};
      totalLessons += Object.keys(topicsForLevel).length;
    }
    console.log(`📊 Total lessons to process: ${totalLessons} (estimated time: ${Math.ceil(totalLessons * 0.5)}-${Math.ceil(totalLessons * 0.8)} minutes)`);

    let processedLessons = 0;
    const startTime = Date.now();

    for (const lang of languagesToCreate) {
      console.log(`Processing language: ${lang}`);
      for (const level of levelsToCreate) {
        const topicsForLevel = LESSON_TEMPLATES[level] || {};
        
        for (const [topic, template] of Object.entries(topicsForLevel)) {
          processedLessons++;
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const avgTimePerLesson = processedLessons > 0 ? elapsed / processedLessons : 0;
          const remainingLessons = totalLessons - processedLessons;
          const estimatedRemaining = Math.ceil(remainingLessons * avgTimePerLesson);
          console.log(`📈 Progress: ${processedLessons}/${totalLessons} lessons (${Math.round(processedLessons / totalLessons * 100)}%) - Elapsed: ${elapsed}s - Estimated remaining: ~${estimatedRemaining}s`);
          try {
            // Check if lesson already exists (by title, language, level, topic)
            // Don't include vocabulary/exercises to avoid loading fields that might not exist yet (like isSentence)
            const existing = await prisma.lesson.findFirst({
              where: {
                targetLanguage: lang,
                level,
                topic,
                title: template.title,
              },
            });

            console.log(`Checking lesson: ${template.title} (${lang}, ${level}, ${topic}) - exists: ${!!existing}, overwrite: ${overwrite}`);

            if (existing) {
              // Always update existing lessons (both overwrite and auto-update modes)
              console.log(`🔄 Updating existing lesson: ${template.title} (${lang}, ${level}, ${topic}) - ID: ${existing.id}`);
              
              // Delete existing vocabulary and exercises
              console.log(`  Deleting old vocabulary and exercises for lesson ${existing.id}...`);
              const deletedVocab = await prisma.lessonVocabulary.deleteMany({
                where: { lessonId: existing.id },
              });
              const deletedExercises = await prisma.lessonExercise.deleteMany({
                where: { lessonId: existing.id },
              });
              console.log(`  ✅ Deleted ${deletedVocab.count} vocabulary items and ${deletedExercises.count} exercises`);
                
                // Prepare new vocabulary data
                const vocabularyData = template.vocabulary.map((term: any, index: number) => {
                  const mainTranslation = getTranslation(term, lang);
                  const alternatives = term.alternatives?.[lang] || [];
                  const notesContent = alternatives.length > 0 
                    ? `תרגומים חלופיים: ${alternatives.join(', ')}`
                    : null;
                  const isSentence = term.isSentence || false;
                  
                  // Build vocabulary data - conditionally include isSentence if it exists in schema
                  const vocabData: any = {
                    hebrewTerm: term.hebrew,
                    translatedTerm: mainTranslation,
                    pronunciation: getPronunciation(term, lang),
                    difficulty: 'EASY' as const,
                    partOfSpeech: 'NOUN' as const,
                    order: index + 1,
                    usageExample: JSON.stringify({
                      target: `${mainTranslation} - ${term.hebrew}`,
                      hebrew: term.hebrew,
                    }),
                    notes: notesContent,
                  };
                  
                  if (isSentence) {
                    vocabData.isSentence = true;
                  }
                  
                  return vocabData;
                });

                // Add sentences if they exist
                const sentences = template.sentences || [];
                const sentencesData = sentences.map((sentence: any, index: number) => {
                  const mainTranslation = getTranslation(sentence, lang);
                  return {
                    hebrewTerm: sentence.hebrew,
                    translatedTerm: mainTranslation,
                    pronunciation: getPronunciation(sentence, lang) || '',
                    difficulty: 'MEDIUM' as const,
                    partOfSpeech: 'OTHER' as const,
                    order: vocabularyData.length + index + 1,
                    usageExample: JSON.stringify({
                      target: mainTranslation,
                      hebrew: sentence.hebrew,
                    }),
                    notes: 'משפט שלם',
                    isSentence: true,
                  };
                });

                const allVocabularyData = [...vocabularyData, ...sentencesData];

                // Create exercises - more complex and interesting exercises
                const exercisesData: any[] = [];

                // Exercise 1: Matching - match multiple words (always create if we have vocabulary)
                if (template.vocabulary.length > 0) {
                  exercisesData.push({
                    type: 'MATCHING' as const,
                    title: 'התאמת מילים',
                    instructions: `בחרי את התרגום הנכון למילה "${template.vocabulary[0]?.hebrew}"`,
                    question: `מה התרגום של "${template.vocabulary[0]?.hebrew}"?`,
                    correctAnswer: getTranslation(template.vocabulary[0], lang),
                    points: 10,
                    order: 1,
                    options: {
                      create: [
                        {
                          text: getTranslation(template.vocabulary[0], lang),
                          isCorrect: true,
                          explanation: `נכון! "${template.vocabulary[0]?.hebrew}" מתרגם ל-${getTranslation(template.vocabulary[0], lang)}`,
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
                        {
                          text: getTranslation(template.vocabulary[3] || template.vocabulary[0], lang),
                          isCorrect: false,
                          explanation: 'זה לא התרגום הנכון',
                          order: 4,
                        },
                      ],
                    },
                  });
                }

                // Add sentence building exercise if we have sentences
                if (template.sentences && template.sentences.length > 0) {
                  const sentence = template.sentences[0];
                  const sentenceTranslation = getTranslation(sentence, lang);
                  const sentenceWords = sentenceTranslation.split(' ').filter(w => w.length > 1 && !['the', 'a', 'an', 'is', 'are', 'am', 'was', 'were'].includes(w.toLowerCase()));
                  
                  // Create WORD_ORDER exercise if we have at least 2 words (reduced from 3)
                  if (sentenceWords.length >= 2) {
                    exercisesData.push({
                      type: 'WORD_ORDER' as const,
                      title: 'הרכיבי משפט',
                      instructions: 'סדרי את המילים בסדר הנכון כדי ליצור משפט',
                      question: `הרכיבי משפט מהמילים הבאות: ${sentenceWords.join(', ')}`,
                      correctAnswer: sentenceTranslation,
                      exerciseData: JSON.stringify({
                        words: sentenceWords,
                        correctOrder: sentenceTranslation.split(' '),
                        hebrewSentence: sentence.hebrew,
                      }),
                      points: 20,
                      order: exercisesData.length + 1,
                    });
                  }

                  // Translation exercise - word in target language → Hebrew
                  // Use first word from the sentence translation
                  const firstWord = sentenceTranslation.split(' ')[0];
                  const firstWordHebrew = sentence.hebrew.split(' ')[0];
                  
                  exercisesData.push({
                    type: 'FILL_BLANK' as const,
                    title: 'תרגום מילה',
                    instructions: 'מה התרגום בעברית של המילה בשפה הנלמדת?',
                    question: `מה התרגום בעברית של המילה "${firstWord}"?`,
                    correctAnswer: firstWordHebrew,
                    exerciseData: JSON.stringify({
                      hebrewSentence: firstWordHebrew,
                      targetWord: firstWord,
                      targetLanguage: lang,
                    }),
                    points: 15,
                    order: exercisesData.length + 1,
                  });

                  // Add another matching with a different word
                  if (template.vocabulary.length >= 2) {
                    exercisesData.push({
                      type: 'MATCHING' as const,
                      title: 'התאמת מילה נוספת',
                      instructions: `בחרי את התרגום הנכון למילה "${template.vocabulary[1].hebrew}"`,
                      question: `מה התרגום של "${template.vocabulary[1].hebrew}"?`,
                      correctAnswer: getTranslation(template.vocabulary[1], lang),
                      points: 10,
                      order: exercisesData.length + 1,
                      options: {
                        create: [
                          {
                            text: getTranslation(template.vocabulary[1], lang),
                            isCorrect: true,
                            explanation: `נכון! "${template.vocabulary[1].hebrew}" מתרגם ל-${getTranslation(template.vocabulary[1], lang)}`,
                            order: 1,
                          },
                          {
                            text: getTranslation(template.vocabulary[0], lang),
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
                          {
                            text: getTranslation(template.vocabulary[3] || template.vocabulary[0], lang),
                            isCorrect: false,
                            explanation: 'זה לא התרגום הנכון',
                            order: 4,
                          },
                        ],
                      },
                    });
                  }
                } else {
                  // If no sentences, add more matching exercises
                  if (template.vocabulary.length >= 2) {
                    exercisesData.push({
                      type: 'MATCHING' as const,
                      title: 'התאמת מילה נוספת',
                      instructions: `בחרי את התרגום הנכון למילה "${template.vocabulary[1].hebrew}"`,
                      question: `מה התרגום של "${template.vocabulary[1].hebrew}"?`,
                      correctAnswer: getTranslation(template.vocabulary[1], lang),
                      points: 10,
                      order: exercisesData.length + 1,
                      options: {
                        create: [
                          {
                            text: getTranslation(template.vocabulary[1], lang),
                            isCorrect: true,
                            explanation: `נכון! "${template.vocabulary[1].hebrew}" מתרגם ל-${getTranslation(template.vocabulary[1], lang)}`,
                            order: 1,
                          },
                          {
                            text: getTranslation(template.vocabulary[0], lang),
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
                    });
                  }
                }

                console.log(`  📊 Total exercises created: ${exercisesData.length} (vocabulary: ${template.vocabulary.length}, sentences: ${template.sentences?.length || 0})`);

                // Generate detailed grammar notes using AI (with timeout)
                let grammarNotes: string;
                try {
                  // Set a timeout for grammar generation (30 seconds)
                  const grammarPromise = generateGrammarNotes(
                    topic,
                    level,
                    lang,
                    template.vocabulary || [],
                    template.sentences || []
                  );
                  const timeoutPromise = new Promise<string>((_, reject) => 
                    setTimeout(() => reject(new Error('Grammar generation timeout')), 30000)
                  );
                  grammarNotes = await Promise.race([grammarPromise, timeoutPromise]);
                } catch (error) {
                  console.error(`Error generating grammar notes for ${template.title} (${lang}):`, error);
                  grammarNotes = `<p>בשיעור זה נלמד מילים ומשפטים הקשורים ל-${topic} בשפה ${lang === 'english' ? 'אנגלית' : lang === 'romanian' ? 'רומנית' : lang === 'italian' ? 'איטלקית' : lang === 'french' ? 'צרפתית' : 'רוסית'}. נדגיש כללי דקדוק חשובים ונעסוק בשימוש מעשי במילים.</p>`;
                }

                // Update the lesson
                console.log(`  📝 Creating ${exercisesData.length} exercises and ${allVocabularyData.length} vocabulary items...`);
                const updatedLesson = await prisma.lesson.update({
                  where: { id: existing.id },
                  data: {
                    description: template.description,
                    grammarNotes: grammarNotes,
                    culturalTips: `מילים אלה שימושיות מאוד ב-${lang === 'english' ? 'אנגלית' : lang === 'romanian' ? 'רומנית' : lang === 'italian' ? 'איטלקית' : lang === 'french' ? 'צרפתית' : lang === 'russian' ? 'רוסית' : lang}.`,
                    vocabulary: {
                      create: allVocabularyData,
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

                updatedLessons.push(updatedLesson);
                console.log(`✅ Successfully updated lesson: ${template.title} (${lang}) - ${updatedLesson.exercises.length} exercises, ${updatedLesson.vocabulary.length} vocabulary items`);
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
            const vocabularyData = template.vocabulary.map((term: any, index: number) => {
              const mainTranslation = getTranslation(term, lang);
              const alternatives = term.alternatives?.[lang] || [];
              const notesContent = alternatives.length > 0 
                ? `תרגומים חלופיים: ${alternatives.join(', ')}`
                : null;
              const isSentence = term.isSentence || false;
              
              // Build vocabulary data - conditionally include isSentence if it exists in schema
              const vocabData: any = {
                hebrewTerm: term.hebrew,
                translatedTerm: mainTranslation,
                pronunciation: getPronunciation(term, lang),
                difficulty: 'EASY' as const,
                partOfSpeech: 'NOUN' as const,
                order: index + 1,
                usageExample: JSON.stringify({
                  target: `${mainTranslation} - ${term.hebrew}`,
                  hebrew: term.hebrew,
                }),
                notes: notesContent,
              };
              
              // Include isSentence field
              if (isSentence) {
                vocabData.isSentence = true;
              }
              
              return vocabData;
            });

            // Add sentences if they exist
            const sentences = template.sentences || [];
            const sentencesData = sentences.map((sentence: any, index: number) => {
              const mainTranslation = getTranslation(sentence, lang);
              return {
                hebrewTerm: sentence.hebrew,
                translatedTerm: mainTranslation,
                pronunciation: getPronunciation(sentence, lang) || '',
                difficulty: 'MEDIUM' as const,
                partOfSpeech: 'OTHER' as const,
                order: vocabularyData.length + index + 1,
                usageExample: JSON.stringify({
                  target: mainTranslation,
                  hebrew: sentence.hebrew,
                }),
                notes: 'משפט שלם',
                isSentence: true,
              };
            });

            const allVocabularyData = [...vocabularyData, ...sentencesData];

            // Generate detailed grammar notes using AI
            let grammarNotes: string;
            try {
              grammarNotes = await generateGrammarNotes(
                topic,
                level,
                lang,
                template.vocabulary || [],
                template.sentences || []
              );
            } catch (error) {
              console.error(`Error generating grammar notes for ${template.title} (${lang}):`, error);
              // Fallback to basic explanation
              grammarNotes = `<p>בשיעור זה נלמד מילים ומשפטים הקשורים ל-${topic}.</p>`;
            }

            // Create exercises - more complex and interesting exercises
            const exercisesData: any[] = [];

            // Exercise 1: Matching - match multiple words (always create if we have vocabulary)
            if (template.vocabulary.length > 0) {
              exercisesData.push({
                type: 'MATCHING' as const,
                title: 'התאמת מילים',
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
                    {
                      text: getTranslation(template.vocabulary[3] || template.vocabulary[0], lang),
                      isCorrect: false,
                      explanation: 'זה לא התרגום הנכון',
                      order: 4,
                    },
                  ],
                },
              });
            }

            // Exercise 2: Sentence building - if we have sentences
            if (template.sentences && template.sentences.length > 0) {
              const sentence = template.sentences[0];
              const sentenceTranslation = getTranslation(sentence, lang);
              
              // Extract words from the sentence for word order exercise
              const sentenceWords = sentenceTranslation.split(' ').filter(w => w.length > 1 && !['the', 'a', 'an', 'is', 'are', 'am', 'was', 'were'].includes(w.toLowerCase()));
              
              if (sentenceWords.length >= 3) {
                exercisesData.push({
                  type: 'WORD_ORDER' as const,
                  title: 'הרכיבי משפט',
                  instructions: 'סדרי את המילים בסדר הנכון כדי ליצור משפט',
                  question: `הרכיבי משפט מהמילים הבאות: ${sentenceWords.join(', ')}`,
                  correctAnswer: sentenceTranslation,
                  exerciseData: JSON.stringify({
                    words: sentenceWords,
                    correctOrder: sentenceTranslation.split(' '),
                    hebrewSentence: sentence.hebrew,
                  }),
                  points: 20,
                  order: exercisesData.length + 1,
                });
              }

              // Exercise 3: Translation - translate sentence from Hebrew
              exercisesData.push({
                type: 'FILL_BLANK' as const,
                title: 'תרגומי משפט',
                instructions: 'תרגמי את המשפט הבא מעברית',
                question: `תרגמי את המשפט: "${sentence.hebrew}"`,
                correctAnswer: sentenceTranslation,
                exerciseData: JSON.stringify({
                  hebrewSentence: sentence.hebrew,
                  targetLanguage: lang,
                }),
                points: 25,
                order: exercisesData.length + 1,
              });

              // Exercise 4: Another matching with a different word
              if (template.vocabulary.length >= 2) {
                exercisesData.push({
                  type: 'MATCHING' as const,
                  title: 'התאמת מילה נוספת',
                  instructions: `בחרי את התרגום הנכון למילה "${template.vocabulary[1].hebrew}"`,
                  question: `מה התרגום של "${template.vocabulary[1].hebrew}"?`,
                  correctAnswer: getTranslation(template.vocabulary[1], lang),
                  points: 10,
                  order: exercisesData.length + 1,
                  options: {
                    create: [
                      {
                        text: getTranslation(template.vocabulary[1], lang),
                        isCorrect: true,
                        explanation: `נכון! "${template.vocabulary[1].hebrew}" מתרגם ל-${getTranslation(template.vocabulary[1], lang)}`,
                        order: 1,
                      },
                      {
                        text: getTranslation(template.vocabulary[0], lang),
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
                      {
                        text: getTranslation(template.vocabulary[3] || template.vocabulary[0], lang),
                        isCorrect: false,
                        explanation: 'זה לא התרגום הנכון',
                        order: 4,
                      },
                    ],
                  },
                });
              }
            } else {
              // If no sentences, add more matching exercises
              if (template.vocabulary.length >= 2) {
                exercisesData.push({
                  type: 'MATCHING' as const,
                  title: 'התאמת מילה נוספת',
                  instructions: `בחרי את התרגום הנכון למילה "${template.vocabulary[1].hebrew}"`,
                  question: `מה התרגום של "${template.vocabulary[1].hebrew}"?`,
                  correctAnswer: getTranslation(template.vocabulary[1], lang),
                  points: 10,
                  order: exercisesData.length + 1,
                  options: {
                    create: [
                      {
                        text: getTranslation(template.vocabulary[1], lang),
                        isCorrect: true,
                        explanation: `נכון! "${template.vocabulary[1].hebrew}" מתרגם ל-${getTranslation(template.vocabulary[1], lang)}`,
                        order: 1,
                      },
                      {
                        text: getTranslation(template.vocabulary[0], lang),
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
                });
              }
            }

            const lesson = await prisma.lesson.create({
              data: {
                targetLanguage: lang,
                level,
                topic,
                title: template.title,
                description: template.description,
                duration: 15,
                objectives: JSON.stringify(['ללמוד מילים בסיסיות', 'להבין שימוש במילים', 'ללמוד כללי דקדוק חשובים']),
                grammarNotes: grammarNotes,
                culturalTips: `מילים אלה שימושיות מאוד ב-${lang === 'english' ? 'אנגלית' : lang === 'romanian' ? 'רומנית' : lang === 'italian' ? 'איטלקית' : lang === 'french' ? 'צרפתית' : lang === 'russian' ? 'רוסית' : lang}.`,
                order: nextOrder,
                isPublished: true,
                vocabulary: {
                  create: allVocabularyData,
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

    console.log(`Total created: ${createdLessons.length}, Updated: ${updatedLessons.length}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      message: `נוצרו ${createdLessons.length} שיעורים${updatedLessons.length > 0 ? ` ועודכנו ${updatedLessons.length} שיעורים` : ''}`,
      created: createdLessons.length,
      updated: updatedLessons.length,
      errors: errors.length > 0 ? errors : undefined,
      lessons: [...createdLessons, ...updatedLessons],
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

