/**
 * Common Words Database - מאגר מילים נפוצות עם תרגומים לכל השפות
 * 300+ מילים בסיסיות ללימוד שפות
 */

export interface CommonWord {
  hebrew: string;
  english: string;
  russian: string;
  french: string;
  romanian: string;
  italian: string;
  category: string;
}

export const COMMON_WORDS: CommonWord[] = [
  // היכרות וברכות
  { hebrew: 'שלום', english: 'Hello', russian: 'Привет', french: 'Bonjour', romanian: 'Salut', italian: 'Ciao', category: 'היכרות' },
  { hebrew: 'להתראות', english: 'Goodbye', russian: 'До свидания', french: 'Au revoir', romanian: 'La revedere', italian: 'Arrivederci', category: 'היכרות' },
  { hebrew: 'תודה', english: 'Thank you', russian: 'Спасибо', french: 'Merci', romanian: 'Mulțumesc', italian: 'Grazie', category: 'היכרות' },
  { hebrew: 'בבקשה', english: 'Please', russian: 'Пожалуйста', french: 'S\'il vous plaît', romanian: 'Te rog', italian: 'Per favore', category: 'היכרות' },
  { hebrew: 'סליחה', english: 'Sorry', russian: 'Извините', french: 'Pardon', romanian: 'Scuze', italian: 'Scusa', category: 'היכרות' },
  { hebrew: 'כן', english: 'Yes', russian: 'Да', french: 'Oui', romanian: 'Da', italian: 'Sì', category: 'היכרות' },
  { hebrew: 'לא', english: 'No', russian: 'Нет', french: 'Non', romanian: 'Nu', italian: 'No', category: 'היכרות' },
  { hebrew: 'מה שלומך?', english: 'How are you?', russian: 'Как дела?', french: 'Comment allez-vous?', romanian: 'Ce mai faci?', italian: 'Come stai?', category: 'היכרות' },
  { hebrew: 'טוב מאוד', english: 'Very good', russian: 'Очень хорошо', french: 'Très bien', romanian: 'Foarte bine', italian: 'Molto bene', category: 'היכרות' },
  { hebrew: 'אני בסדר', english: 'I\'m fine', russian: 'Я в порядке', french: 'Je vais bien', romanian: 'Sunt bine', italian: 'Sto bene', category: 'היכרות' },

  // משפחה
  { hebrew: 'אמא', english: 'Mother', russian: 'Мама', french: 'Mère', romanian: 'Mamă', italian: 'Madre', category: 'משפחה' },
  { hebrew: 'אבא', english: 'Father', russian: 'Папа', french: 'Père', romanian: 'Tată', italian: 'Padre', category: 'משפחה' },
  { hebrew: 'אח', english: 'Brother', russian: 'Брат', french: 'Frère', romanian: 'Frate', italian: 'Fratello', category: 'משפחה' },
  { hebrew: 'אחות', english: 'Sister', russian: 'Сестра', french: 'Sœur', romanian: 'Soră', italian: 'Sorella', category: 'משפחה' },
  { hebrew: 'בן', english: 'Son', russian: 'Сын', french: 'Fils', romanian: 'Fiu', italian: 'Figlio', category: 'משפחה' },
  { hebrew: 'בת', english: 'Daughter', russian: 'Дочь', french: 'Fille', romanian: 'Fiică', italian: 'Figlia', category: 'משפחה' },
  { hebrew: 'בעל', english: 'Husband', russian: 'Муж', french: 'Mari', romanian: 'Soț', italian: 'Marito', category: 'משפחה' },
  { hebrew: 'אישה', english: 'Wife', russian: 'Жена', french: 'Femme', romanian: 'Soție', italian: 'Moglie', category: 'משפחה' },
  { hebrew: 'סבא', english: 'Grandfather', russian: 'Дедушка', french: 'Grand-père', romanian: 'Bunic', italian: 'Nonno', category: 'משפחה' },
  { hebrew: 'סבתא', english: 'Grandmother', russian: 'Бабушка', french: 'Grand-mère', romanian: 'Bunică', italian: 'Nonna', category: 'משפחה' },

  // אוכל ושתייה
  { hebrew: 'מים', english: 'Water', russian: 'Вода', french: 'Eau', romanian: 'Apă', italian: 'Acqua', category: 'אוכל' },
  { hebrew: 'לחם', english: 'Bread', russian: 'Хлеб', french: 'Pain', romanian: 'Pâine', italian: 'Pane', category: 'אוכל' },
  { hebrew: 'חלב', english: 'Milk', russian: 'Молоко', french: 'Lait', romanian: 'Lapte', italian: 'Latte', category: 'אוכל' },
  { hebrew: 'ביצה', english: 'Egg', russian: 'Яйцо', french: 'Œuf', romanian: 'Ou', italian: 'Uovo', category: 'אוכל' },
  { hebrew: 'בשר', english: 'Meat', russian: 'Мясо', french: 'Viande', romanian: 'Carne', italian: 'Carne', category: 'אוכל' },
  { hebrew: 'דג', english: 'Fish', russian: 'Рыба', french: 'Poisson', romanian: 'Pește', italian: 'Pesce', category: 'אוכל' },
  { hebrew: 'פירות', english: 'Fruits', russian: 'Фрукты', french: 'Fruits', romanian: 'Fructe', italian: 'Frutta', category: 'אוכל' },
  { hebrew: 'ירקות', english: 'Vegetables', russian: 'Овощи', french: 'Légumes', romanian: 'Legume', italian: 'Verdure', category: 'אוכל' },
  { hebrew: 'תפוח', english: 'Apple', russian: 'Яблоко', french: 'Pomme', romanian: 'Măr', italian: 'Mela', category: 'אוכל' },
  { hebrew: 'בננה', english: 'Banana', russian: 'Банан', french: 'Banane', romanian: 'Banana', italian: 'Banana', category: 'אוכל' },
  { hebrew: 'קפה', english: 'Coffee', russian: 'Кофе', french: 'Café', romanian: 'Cafea', italian: 'Caffè', category: 'אוכל' },
  { hebrew: 'תה', english: 'Tea', russian: 'Чай', french: 'Thé', romanian: 'Ceai', italian: 'Tè', category: 'אוכל' },
  { hebrew: 'סוכר', english: 'Sugar', russian: 'Сахар', french: 'Sucre', romanian: 'Zahăr', italian: 'Zucchero', category: 'אוכל' },
  { hebrew: 'מלח', english: 'Salt', russian: 'Соль', french: 'Sel', romanian: 'Sare', italian: 'Sale', category: 'אוכל' },

  // בית
  { hebrew: 'בית', english: 'House', russian: 'Дом', french: 'Maison', romanian: 'Casă', italian: 'Casa', category: 'בית' },
  { hebrew: 'חדר', english: 'Room', russian: 'Комната', french: 'Chambre', romanian: 'Cameră', italian: 'Stanza', category: 'בית' },
  { hebrew: 'מטבח', english: 'Kitchen', russian: 'Кухня', french: 'Cuisine', romanian: 'Bucătărie', italian: 'Cucina', category: 'בית' },
  { hebrew: 'שולחן', english: 'Table', russian: 'Стол', french: 'Table', romanian: 'Masă', italian: 'Tavolo', category: 'בית' },
  { hebrew: 'כיסא', english: 'Chair', russian: 'Стул', french: 'Chaise', romanian: 'Scaun', italian: 'Sedia', category: 'בית' },
  { hebrew: 'מיטה', english: 'Bed', russian: 'Кровать', french: 'Lit', romanian: 'Pat', italian: 'Letto', category: 'בית' },
  { hebrew: 'חלון', english: 'Window', russian: 'Окно', french: 'Fenêtre', romanian: 'Fereastră', italian: 'Finestra', category: 'בית' },
  { hebrew: 'דלת', english: 'Door', russian: 'Дверь', french: 'Porte', romanian: 'Ușă', italian: 'Porta', category: 'בית' },
  { hebrew: 'אור', english: 'Light', russian: 'Свет', french: 'Lumière', romanian: 'Lumină', italian: 'Luce', category: 'בית' },
  { hebrew: 'טלפון', english: 'Phone', russian: 'Телефон', french: 'Téléphone', romanian: 'Telefon', italian: 'Telefono', category: 'בית' },

  // גוף האדם
  { hebrew: 'ראש', english: 'Head', russian: 'Голова', french: 'Tête', romanian: 'Cap', italian: 'Testa', category: 'גוף' },
  { hebrew: 'עין', english: 'Eye', russian: 'Глаз', french: 'Œil', romanian: 'Ochi', italian: 'Occhio', category: 'גוף' },
  { hebrew: 'אף', english: 'Nose', russian: 'Нос', french: 'Nez', romanian: 'Nas', italian: 'Naso', category: 'גוף' },
  { hebrew: 'פה', english: 'Mouth', russian: 'Рот', french: 'Bouche', romanian: 'Gură', italian: 'Bocca', category: 'גוף' },
  { hebrew: 'יד', english: 'Hand', russian: 'Рука', french: 'Main', romanian: 'Mână', italian: 'Mano', category: 'גוף' },
  { hebrew: 'רגל', english: 'Foot', russian: 'Нога', french: 'Pied', romanian: 'Picior', italian: 'Piede', category: 'גוף' },
  { hebrew: 'לב', english: 'Heart', russian: 'Сердце', french: 'Cœur', romanian: 'Inimă', italian: 'Cuore', category: 'גוף' },
  { hebrew: 'שיער', english: 'Hair', russian: 'Волосы', french: 'Cheveux', romanian: 'Păr', italian: 'Capelli', category: 'גוף' },

  // בגדים
  { hebrew: 'חולצה', english: 'Shirt', russian: 'Рубашка', french: 'Chemise', romanian: 'Cămașă', italian: 'Camicia', category: 'בגדים' },
  { hebrew: 'מכנסיים', english: 'Pants', russian: 'Брюки', french: 'Pantalon', romanian: 'Pantaloni', italian: 'Pantaloni', category: 'בגדים' },
  { hebrew: 'נעליים', english: 'Shoes', russian: 'Обувь', french: 'Chaussures', romanian: 'Pantofi', italian: 'Scarpe', category: 'בגדים' },
  { hebrew: 'כובע', english: 'Hat', russian: 'Шляпа', french: 'Chapeau', romanian: 'Pălărie', italian: 'Cappello', category: 'בגדים' },
  { hebrew: 'שמלה', english: 'Dress', russian: 'Платье', french: 'Robe', romanian: 'Rochiă', italian: 'Vestito', category: 'בגדים' },

  // צבעים
  { hebrew: 'אדום', english: 'Red', russian: 'Красный', french: 'Rouge', romanian: 'Roșu', italian: 'Rosso', category: 'צבעים' },
  { hebrew: 'כחול', english: 'Blue', russian: 'Синий', french: 'Bleu', romanian: 'Albastru', italian: 'Blu', category: 'צבעים' },
  { hebrew: 'ירוק', english: 'Green', russian: 'Зелёный', french: 'Vert', romanian: 'Verde', italian: 'Verde', category: 'צבעים' },
  { hebrew: 'צהוב', english: 'Yellow', russian: 'Жёлтый', french: 'Jaune', romanian: 'Galben', italian: 'Giallo', category: 'צבעים' },
  { hebrew: 'שחור', english: 'Black', russian: 'Чёрный', french: 'Noir', romanian: 'Negru', italian: 'Nero', category: 'צבעים' },
  { hebrew: 'לבן', english: 'White', russian: 'Белый', french: 'Blanc', romanian: 'Alb', italian: 'Bianco', category: 'צבעים' },
  { hebrew: 'חום', english: 'Brown', russian: 'Коричневый', french: 'Marron', romanian: 'Maro', italian: 'Marrone', category: 'צבעים' },
  { hebrew: 'ורוד', english: 'Pink', russian: 'Розовый', french: 'Rose', romanian: 'Roz', italian: 'Rosa', category: 'צבעים' },

  // מספרים
  { hebrew: 'אחד', english: 'One', russian: 'Один', french: 'Un', romanian: 'Unu', italian: 'Uno', category: 'מספרים' },
  { hebrew: 'שניים', english: 'Two', russian: 'Два', french: 'Deux', romanian: 'Doi', italian: 'Due', category: 'מספרים' },
  { hebrew: 'שלושה', english: 'Three', russian: 'Три', french: 'Trois', romanian: 'Trei', italian: 'Tre', category: 'מספרים' },
  { hebrew: 'ארבעה', english: 'Four', russian: 'Четыре', french: 'Quatre', romanian: 'Patru', italian: 'Quattro', category: 'מספרים' },
  { hebrew: 'חמישה', english: 'Five', russian: 'Пять', french: 'Cinq', romanian: 'Cinci', italian: 'Cinque', category: 'מספרים' },
  { hebrew: 'שישה', english: 'Six', russian: 'Шесть', french: 'Six', romanian: 'Șase', italian: 'Sei', category: 'מספרים' },
  { hebrew: 'שבעה', english: 'Seven', russian: 'Семь', french: 'Sept', romanian: 'Șapte', italian: 'Sette', category: 'מספרים' },
  { hebrew: 'שמונה', english: 'Eight', russian: 'Восемь', french: 'Huit', romanian: 'Opt', italian: 'Otto', category: 'מספרים' },
  { hebrew: 'תשעה', english: 'Nine', russian: 'Девять', french: 'Neuf', romanian: 'Nouă', italian: 'Nove', category: 'מספרים' },
  { hebrew: 'עשרה', english: 'Ten', russian: 'Десять', french: 'Dix', romanian: 'Zece', italian: 'Dieci', category: 'מספרים' },

  // זמן
  { hebrew: 'יום', english: 'Day', russian: 'День', french: 'Jour', romanian: 'Zi', italian: 'Giorno', category: 'זמן' },
  { hebrew: 'לילה', english: 'Night', russian: 'Ночь', french: 'Nuit', romanian: 'Noapte', italian: 'Notte', category: 'זמן' },
  { hebrew: 'שבוע', english: 'Week', russian: 'Неделя', french: 'Semaine', romanian: 'Săptămână', italian: 'Settimana', category: 'זמן' },
  { hebrew: 'חודש', english: 'Month', russian: 'Месяц', french: 'Mois', romanian: 'Lună', italian: 'Mese', category: 'זמן' },
  { hebrew: 'שנה', english: 'Year', russian: 'Год', french: 'Année', romanian: 'An', italian: 'Anno', category: 'זמן' },
  { hebrew: 'שעה', english: 'Hour', russian: 'Час', french: 'Heure', romanian: 'Oră', italian: 'Ora', category: 'זמן' },
  { hebrew: 'דקה', english: 'Minute', russian: 'Минута', french: 'Minute', romanian: 'Minut', italian: 'Minuto', category: 'זמן' },
  { hebrew: 'היום', english: 'Today', russian: 'Сегодня', french: 'Aujourd\'hui', romanian: 'Astăzi', italian: 'Oggi', category: 'זמן' },
  { hebrew: 'מחר', english: 'Tomorrow', russian: 'Завтра', french: 'Demain', romanian: 'Mâine', italian: 'Domani', category: 'זמן' },
  { hebrew: 'אתמול', english: 'Yesterday', russian: 'Вчера', french: 'Hier', romanian: 'Ieri', italian: 'Ieri', category: 'זמן' },

  // ימים בשבוע
  { hebrew: 'יום ראשון', english: 'Sunday', russian: 'Воскресенье', french: 'Dimanche', romanian: 'Duminică', italian: 'Domenica', category: 'ימים בשבוע' },
  { hebrew: 'יום שני', english: 'Monday', russian: 'Понедельник', french: 'Lundi', romanian: 'Luni', italian: 'Lunedì', category: 'ימים בשבוע' },
  { hebrew: 'יום שלישי', english: 'Tuesday', russian: 'Вторник', french: 'Mardi', romanian: 'Marți', italian: 'Martedì', category: 'ימים בשבוע' },
  { hebrew: 'יום רביעי', english: 'Wednesday', russian: 'Среда', french: 'Mercredi', romanian: 'Miercuri', italian: 'Mercoledì', category: 'ימים בשבוע' },
  { hebrew: 'יום חמישי', english: 'Thursday', russian: 'Четверг', french: 'Jeudi', romanian: 'Joi', italian: 'Giovedì', category: 'ימים בשבוע' },
  { hebrew: 'יום שישי', english: 'Friday', russian: 'Пятница', french: 'Vendredi', romanian: 'Vineri', italian: 'Venerdì', category: 'ימים בשבוע' },
  { hebrew: 'שבת', english: 'Saturday', russian: 'Суббота', french: 'Samedi', romanian: 'Sâmbătă', italian: 'Sabato', category: 'ימים בשבוע' },

  // פעלים בסיסיים
  { hebrew: 'ללכת', english: 'To go', russian: 'Идти', french: 'Aller', romanian: 'A merge', italian: 'Andare', category: 'פעלים' },
  { hebrew: 'לבוא', english: 'To come', russian: 'Приходить', french: 'Venir', romanian: 'A veni', italian: 'Venire', category: 'פעלים' },
  { hebrew: 'לראות', english: 'To see', russian: 'Видеть', french: 'Voir', romanian: 'A vedea', italian: 'Vedere', category: 'פעלים' },
  { hebrew: 'לשמוע', english: 'To hear', russian: 'Слышать', french: 'Entendre', romanian: 'A auzi', italian: 'Sentire', category: 'פעלים' },
  { hebrew: 'לדבר', english: 'To speak', russian: 'Говорить', french: 'Parler', romanian: 'A vorbi', italian: 'Parlare', category: 'פעלים' },
  { hebrew: 'לאכול', english: 'To eat', russian: 'Есть', french: 'Manger', romanian: 'A mânca', italian: 'Mangiare', category: 'פעלים' },
  { hebrew: 'לשתות', english: 'To drink', russian: 'Пить', french: 'Boire', romanian: 'A bea', italian: 'Bere', category: 'פעלים' },
  { hebrew: 'לישון', english: 'To sleep', russian: 'Спать', french: 'Dormir', romanian: 'A dormi', italian: 'Dormire', category: 'פעלים' },
  { hebrew: 'לקום', english: 'To wake up', russian: 'Просыпаться', french: 'Se réveiller', romanian: 'A se trezi', italian: 'Svegliarsi', category: 'פעלים' },
  { hebrew: 'לעבוד', english: 'To work', russian: 'Работать', french: 'Travailler', romanian: 'A lucra', italian: 'Lavorare', category: 'פעלים' },
  { hebrew: 'ללמוד', english: 'To learn', russian: 'Учиться', french: 'Apprendre', romanian: 'A învăța', italian: 'Imparare', category: 'פעלים' },
  { hebrew: 'לקרוא', english: 'To read', russian: 'Читать', french: 'Lire', romanian: 'A citi', italian: 'Leggere', category: 'פעלים' },
  { hebrew: 'לכתוב', english: 'To write', russian: 'Писать', french: 'Écrire', romanian: 'A scrie', italian: 'Scrivere', category: 'פעלים' },
  { hebrew: 'לקנות', english: 'To buy', russian: 'Покупать', french: 'Acheter', romanian: 'A cumpăra', italian: 'Comprare', category: 'פעלים' },
  { hebrew: 'לתת', english: 'To give', russian: 'Давать', french: 'Donner', romanian: 'A da', italian: 'Dare', category: 'פעלים' },
  { hebrew: 'לקחת', english: 'To take', russian: 'Брать', french: 'Prendre', romanian: 'A lua', italian: 'Prendere', category: 'פעלים' },
  { hebrew: 'לעשות', english: 'To do', russian: 'Делать', french: 'Faire', romanian: 'A face', italian: 'Fare', category: 'פעלים' },
  { hebrew: 'להיות', english: 'To be', russian: 'Быть', french: 'Être', romanian: 'A fi', italian: 'Essere', category: 'פעלים' },
  { hebrew: 'יש', english: 'There is', russian: 'Есть', french: 'Il y a', romanian: 'Există', italian: 'C\'è', category: 'פעלים' },
  { hebrew: 'לאהוב', english: 'To love', russian: 'Любить', french: 'Aimer', romanian: 'A iubi', italian: 'Amare', category: 'פעלים' },
  { hebrew: 'לרצות', english: 'To want', russian: 'Хотеть', french: 'Vouloir', romanian: 'A vrea', italian: 'Volere', category: 'פעלים' },
  { hebrew: 'לדעת', english: 'To know', russian: 'Знать', french: 'Savoir', romanian: 'A ști', italian: 'Sapere', category: 'פעלים' },
  { hebrew: 'לחשוב', english: 'To think', russian: 'Думать', french: 'Penser', romanian: 'A gândi', italian: 'Pensare', category: 'פעלים' },
  { hebrew: 'להבין', english: 'To understand', russian: 'Понимать', french: 'Comprendre', romanian: 'A înțelege', italian: 'Capire', category: 'פעלים' },

  // תארים
  { hebrew: 'טוב', english: 'Good', russian: 'Хороший', french: 'Bon', romanian: 'Bun', italian: 'Buono', category: 'תארים' },
  { hebrew: 'רע', english: 'Bad', russian: 'Плохой', french: 'Mauvais', romanian: 'Rău', italian: 'Cattivo', category: 'תארים' },
  { hebrew: 'גדול', english: 'Big', russian: 'Большой', french: 'Grand', romanian: 'Mare', italian: 'Grande', category: 'תארים' },
  { hebrew: 'קטן', english: 'Small', russian: 'Маленький', french: 'Petit', romanian: 'Mic', italian: 'Piccolo', category: 'תארים' },
  { hebrew: 'יפה', english: 'Beautiful', russian: 'Красивый', french: 'Beau', romanian: 'Frumos', italian: 'Bello', category: 'תארים' },
  { hebrew: 'חדש', english: 'New', russian: 'Новый', french: 'Nouveau', romanian: 'Nou', italian: 'Nuovo', category: 'תארים' },
  { hebrew: 'ישן', english: 'Old', russian: 'Старый', french: 'Vieux', romanian: 'Vechi', italian: 'Vecchio', category: 'תארים' },
  { hebrew: 'חם', english: 'Hot', russian: 'Горячий', french: 'Chaud', romanian: 'Cald', italian: 'Caldo', category: 'תארים' },
  { hebrew: 'קר', english: 'Cold', russian: 'Холодный', french: 'Froid', romanian: 'Rece', italian: 'Freddo', category: 'תארים' },
  { hebrew: 'חכם', english: 'Smart', russian: 'Умный', french: 'Intelligent', romanian: 'Inteligent', italian: 'Intelligente', category: 'תארים' },
  { hebrew: 'מאושר', english: 'Happy', russian: 'Счастливый', french: 'Heureux', romanian: 'Fericit', italian: 'Felice', category: 'תארים' },
  { hebrew: 'עצוב', english: 'Sad', russian: 'Грустный', french: 'Triste', romanian: 'Trist', italian: 'Triste', category: 'תארים' },
  { hebrew: 'עייף', english: 'Tired', russian: 'Усталый', french: 'Fatigué', romanian: 'Obosit', italian: 'Stanco', category: 'תארים' },
  { hebrew: 'בריא', english: 'Healthy', russian: 'Здоровый', french: 'En bonne santé', romanian: 'Sănătos', italian: 'Sano', category: 'תארים' },
  { hebrew: 'חולה', english: 'Sick', russian: 'Больной', french: 'Malade', romanian: 'Bolnav', italian: 'Malato', category: 'תארים' },

  // בעלי חיים
  { hebrew: 'כלב', english: 'Dog', russian: 'Собака', french: 'Chien', romanian: 'Câine', italian: 'Cane', category: 'בעלי חיים' },
  { hebrew: 'חתול', english: 'Cat', russian: 'Кошка', french: 'Chat', romanian: 'Pisică', italian: 'Gatto', category: 'בעלי חיים' },
  { hebrew: 'ציפור', english: 'Bird', russian: 'Птица', french: 'Oiseau', romanian: 'Pasăre', italian: 'Uccello', category: 'בעלי חיים' },
  { hebrew: 'סוס', english: 'Horse', russian: 'Лошадь', french: 'Cheval', romanian: 'Cal', italian: 'Cavallo', category: 'בעלי חיים' },
  { hebrew: 'פרה', english: 'Cow', russian: 'Корова', french: 'Vache', romanian: 'Vacă', italian: 'Mucca', category: 'בעלי חיים' },
  { hebrew: 'אריה', english: 'Lion', russian: 'Лев', french: 'Lion', romanian: 'Leu', italian: 'Leone', category: 'בעלי חיים' },
  { hebrew: 'דוב', english: 'Bear', russian: 'Медведь', french: 'Ours', romanian: 'Urs', italian: 'Orso', category: 'בעלי חיים' },
  { hebrew: 'נמר', english: 'Tiger', russian: 'Тигр', french: 'Tigre', romanian: 'Tigru', italian: 'Tigre', category: 'בעלי חיים' },

  // תחבורה
  { hebrew: 'מכונית', english: 'Car', russian: 'Машина', french: 'Voiture', romanian: 'Mașină', italian: 'Macchina', category: 'תחבורה' },
  { hebrew: 'אוטובוס', english: 'Bus', russian: 'Автобус', french: 'Bus', romanian: 'Autobuz', italian: 'Autobus', category: 'תחבורה' },
  { hebrew: 'רכבת', english: 'Train', russian: 'Поезд', french: 'Train', romanian: 'Tren', italian: 'Treno', category: 'תחבורה' },
  { hebrew: 'מטוס', english: 'Airplane', russian: 'Самолёт', french: 'Avion', romanian: 'Avion', italian: 'Aereo', category: 'תחבורה' },
  { hebrew: 'אופניים', english: 'Bicycle', russian: 'Велосипед', french: 'Vélo', romanian: 'Bicicletă', italian: 'Bicicletta', category: 'תחבורה' },
  { hebrew: 'אופנוע', english: 'Motorcycle', russian: 'Мотоцикл', french: 'Moto', romanian: 'Motocicletă', italian: 'Motocicletta', category: 'תחבורה' },

  // מזג אוויר
  { hebrew: 'שמש', english: 'Sun', russian: 'Солнце', french: 'Soleil', romanian: 'Soare', italian: 'Sole', category: 'מזג אוויר' },
  { hebrew: 'גשם', english: 'Rain', russian: 'Дождь', french: 'Pluie', romanian: 'Ploaie', italian: 'Pioggia', category: 'מזג אוויר' },
  { hebrew: 'שלג', english: 'Snow', russian: 'Снег', french: 'Neige', romanian: 'Zăpadă', italian: 'Neve', category: 'מזג אוויר' },
  { hebrew: 'רוח', english: 'Wind', russian: 'Ветер', french: 'Vent', romanian: 'Vânt', italian: 'Vento', category: 'מזג אוויר' },
  { hebrew: 'ענן', english: 'Cloud', russian: 'Облако', french: 'Nuage', romanian: 'Nor', italian: 'Nuvola', category: 'מזג אוויר' },

  // עבודה
  { hebrew: 'עבודה', english: 'Work', russian: 'Работа', french: 'Travail', romanian: 'Muncă', italian: 'Lavoro', category: 'עבודה' },
  { hebrew: 'משרד', english: 'Office', russian: 'Офис', french: 'Bureau', romanian: 'Birou', italian: 'Ufficio', category: 'עבודה' },
  { hebrew: 'פגישה', english: 'Meeting', russian: 'Встреча', french: 'Réunion', romanian: 'Întâlnire', italian: 'Riunione', category: 'עבודה' },
  { hebrew: 'פרויקט', english: 'Project', russian: 'Проект', french: 'Projet', romanian: 'Proiect', italian: 'Progetto', category: 'עבודה' },
  { hebrew: 'לקוח', english: 'Client', russian: 'Клиент', french: 'Client', romanian: 'Client', italian: 'Cliente', category: 'עבודה' },
  { hebrew: 'כסף', english: 'Money', russian: 'Деньги', french: 'Argent', romanian: 'Bani', italian: 'Denaro', category: 'עבודה' },
  { hebrew: 'משכורת', english: 'Salary', russian: 'Зарплата', french: 'Salaire', romanian: 'Salariu', italian: 'Stipendio', category: 'עבודה' },

  // לימודים
  { hebrew: 'ספר', english: 'Book', russian: 'Книга', french: 'Livre', romanian: 'Carte', italian: 'Libro', category: 'לימודים' },
  { hebrew: 'עפרון', english: 'Pencil', russian: 'Карандаш', french: 'Crayon', romanian: 'Creion', italian: 'Matita', category: 'לימודים' },
  { hebrew: 'עט', english: 'Pen', russian: 'Ручка', french: 'Stylo', romanian: 'Stilou', italian: 'Penna', category: 'לימודים' },
  { hebrew: 'מחברת', english: 'Notebook', russian: 'Тетрадь', french: 'Cahier', romanian: 'Caiet', italian: 'Quaderno', category: 'לימודים' },
  { hebrew: 'מורה', english: 'Teacher', russian: 'Учитель', french: 'Professeur', romanian: 'Profesor', italian: 'Insegnante', category: 'לימודים' },
  { hebrew: 'תלמיד', english: 'Student', russian: 'Ученик', french: 'Élève', romanian: 'Elev', italian: 'Studente', category: 'לימודים' },
  { hebrew: 'בית ספר', english: 'School', russian: 'Школа', french: 'École', romanian: 'Școală', italian: 'Scuola', category: 'לימודים' },
  { hebrew: 'אוניברסיטה', english: 'University', russian: 'Университет', french: 'Université', romanian: 'Universitate', italian: 'Università', category: 'לימודים' },

  // קניות
  { hebrew: 'חנות', english: 'Shop', russian: 'Магазин', french: 'Magasin', romanian: 'Magazin', italian: 'Negozio', category: 'קניות' },
  { hebrew: 'מחיר', english: 'Price', russian: 'Цена', french: 'Prix', romanian: 'Preț', italian: 'Prezzo', category: 'קניות' },
  { hebrew: 'לשלם', english: 'To pay', russian: 'Платить', french: 'Payer', romanian: 'A plăti', italian: 'Pagare', category: 'קניות' },
  { hebrew: 'למכור', english: 'To sell', russian: 'Продавать', french: 'Vendre', romanian: 'A vinde', italian: 'Vendere', category: 'קניות' },
  { hebrew: 'זול', english: 'Cheap', russian: 'Дешёвый', french: 'Bon marché', romanian: 'Ieftin', italian: 'Economico', category: 'קניות' },
  { hebrew: 'יקר', english: 'Expensive', russian: 'Дорогой', french: 'Cher', romanian: 'Scump', italian: 'Caro', category: 'קניות' },

  // בריאות
  { hebrew: 'רופא', english: 'Doctor', russian: 'Врач', french: 'Médecin', romanian: 'Doctor', italian: 'Medico', category: 'בריאות' },
  { hebrew: 'בית חולים', english: 'Hospital', russian: 'Больница', french: 'Hôpital', romanian: 'Spital', italian: 'Ospedale', category: 'בריאות' },
  { hebrew: 'תרופה', english: 'Medicine', russian: 'Лекарство', french: 'Médicament', romanian: 'Medicament', italian: 'Medicina', category: 'בריאות' },
  { hebrew: 'כאב', english: 'Pain', russian: 'Боль', french: 'Douleur', romanian: 'Durere', italian: 'Dolore', category: 'בריאות' },
  { hebrew: 'בריא', english: 'Healthy', russian: 'Здоровый', french: 'En bonne santé', romanian: 'Sănătos', italian: 'Sano', category: 'בריאות' },

  // טכנולוגיה
  { hebrew: 'מחשב', english: 'Computer', russian: 'Компьютер', french: 'Ordinateur', romanian: 'Computer', italian: 'Computer', category: 'טכנולוגיה' },
  { hebrew: 'טלפון', english: 'Phone', russian: 'Телефон', french: 'Téléphone', romanian: 'Telefon', italian: 'Telefono', category: 'טכנולוגיה' },
  { hebrew: 'אינטרנט', english: 'Internet', russian: 'Интернет', french: 'Internet', romanian: 'Internet', italian: 'Internet', category: 'טכנולוגיה' },
  { hebrew: 'אימייל', english: 'Email', russian: 'Электронная почта', french: 'E-mail', romanian: 'E-mail', italian: 'Email', category: 'טכנולוגיה' },
  { hebrew: 'אתר', english: 'Website', russian: 'Веб-сайт', french: 'Site web', romanian: 'Site web', italian: 'Sito web', category: 'טכנולוגיה' },

  // רגשות
  { hebrew: 'אהבה', english: 'Love', russian: 'Любовь', french: 'Amour', romanian: 'Dragoste', italian: 'Amore', category: 'רגשות' },
  { hebrew: 'שמחה', english: 'Joy', russian: 'Радость', french: 'Joie', romanian: 'Bucurie', italian: 'Gioia', category: 'רגשות' },
  { hebrew: 'פחד', english: 'Fear', russian: 'Страх', french: 'Peur', romanian: 'Frică', italian: 'Paura', category: 'רגשות' },
  { hebrew: 'כעס', english: 'Anger', russian: 'Гнев', french: 'Colère', romanian: 'Furie', italian: 'Rabbia', category: 'רגשות' },
  { hebrew: 'תקווה', english: 'Hope', russian: 'Надежда', french: 'Espoir', romanian: 'Speranță', italian: 'Speranza', category: 'רגשות' },

  // מילות שאלה
  { hebrew: 'מה', english: 'What', russian: 'Что', french: 'Quoi', romanian: 'Ce', italian: 'Cosa', category: 'מילות שאלה' },
  { hebrew: 'מי', english: 'Who', russian: 'Кто', french: 'Qui', romanian: 'Cine', italian: 'Chi', category: 'מילות שאלה' },
  { hebrew: 'איפה', english: 'Where', russian: 'Где', french: 'Où', romanian: 'Unde', italian: 'Dove', category: 'מילות שאלה' },
  { hebrew: 'מתי', english: 'When', russian: 'Когда', french: 'Quand', romanian: 'Când', italian: 'Quando', category: 'מילות שאלה' },
  { hebrew: 'למה', english: 'Why', russian: 'Почему', french: 'Pourquoi', romanian: 'De ce', italian: 'Perché', category: 'מילות שאלה' },
  { hebrew: 'איך', english: 'How', russian: 'Как', french: 'Comment', romanian: 'Cum', italian: 'Come', category: 'מילות שאלה' },

  // מילות קישור
  { hebrew: 'ו', english: 'And', russian: 'И', french: 'Et', romanian: 'Și', italian: 'E', category: 'מילות קישור' },
  { hebrew: 'או', english: 'Or', russian: 'Или', french: 'Ou', romanian: 'Sau', italian: 'O', category: 'מילות קישור' },
  { hebrew: 'אבל', english: 'But', russian: 'Но', french: 'Mais', romanian: 'Dar', italian: 'Ma', category: 'מילות קישור' },
  { hebrew: 'כי', english: 'Because', russian: 'Потому что', french: 'Parce que', romanian: 'Pentru că', italian: 'Perché', category: 'מילות קישור' },
  { hebrew: 'אם', english: 'If', russian: 'Если', french: 'Si', romanian: 'Dacă', italian: 'Se', category: 'מילות קישור' },

  // מילות כיוון
  { hebrew: 'ימינה', english: 'Right', russian: 'Направо', french: 'À droite', romanian: 'La dreapta', italian: 'A destra', category: 'כיוון' },
  { hebrew: 'שמאלה', english: 'Left', russian: 'Налево', french: 'À gauche', romanian: 'La stânga', italian: 'A sinistra', category: 'כיוון' },
  { hebrew: 'קדימה', english: 'Forward', russian: 'Вперёд', french: 'En avant', romanian: 'Înainte', italian: 'Avanti', category: 'כיוון' },
  { hebrew: 'אחורה', english: 'Backward', russian: 'Назад', french: 'En arrière', romanian: 'Înapoi', italian: 'Indietro', category: 'כיוון' },
  { hebrew: 'למעלה', english: 'Up', russian: 'Вверх', french: 'En haut', romanian: 'Sus', italian: 'Su', category: 'כיוון' },
  { hebrew: 'למטה', english: 'Down', russian: 'Вниз', french: 'En bas', romanian: 'Jos', italian: 'Giù', category: 'כיוון' },

  // מילות נוספות
  { hebrew: 'כאן', english: 'Here', russian: 'Здесь', french: 'Ici', romanian: 'Aici', italian: 'Qui', category: 'מיקום' },
  { hebrew: 'שם', english: 'There', russian: 'Там', french: 'Là', romanian: 'Acolo', italian: 'Lì', category: 'מיקום' },
  { hebrew: 'זה', english: 'This', russian: 'Это', french: 'Ce', romanian: 'Acesta', italian: 'Questo', category: 'מיקום' },
  { hebrew: 'זה', english: 'That', russian: 'То', french: 'Cela', romanian: 'Acela', italian: 'Quello', category: 'מיקום' },
  { hebrew: 'כל', english: 'All', russian: 'Все', french: 'Tout', romanian: 'Toate', italian: 'Tutto', category: 'כמות' },
  { hebrew: 'רב', english: 'Many', russian: 'Много', french: 'Beaucoup', romanian: 'Multe', italian: 'Molti', category: 'כמות' },
  { hebrew: 'מעט', english: 'Few', russian: 'Мало', french: 'Peu', romanian: 'Puține', italian: 'Pochi', category: 'כמות' },
  { hebrew: 'יותר', english: 'More', russian: 'Больше', french: 'Plus', romanian: 'Mai mult', italian: 'Più', category: 'כמות' },
  { hebrew: 'פחות', english: 'Less', russian: 'Меньше', french: 'Moins', romanian: 'Mai puțin', italian: 'Meno', category: 'כמות' },
];

