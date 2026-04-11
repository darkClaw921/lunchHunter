/**
 * Keyword-словарь категоризации позиций чека.
 *
 * Используется для классификации позиций из OCR-данных чека
 * в обобщённые категории (beer, wine, food, coffee и т.д.).
 * Поддерживает русские и английские названия.
 */

export type ReceiptItemCategory =
  | "beer"
  | "wine"
  | "cocktail"
  | "spirits"
  | "soft_drink"
  | "coffee"
  | "tea"
  | "food"
  | "dessert"
  | "tips"
  | "hookah";

/**
 * Маппинг: keyword (lowercase) → категория.
 * Ключевые слова проверяются как подстроки в названии позиции.
 */
const KEYWORD_MAP: ReadonlyArray<[string[], ReceiptItemCategory]> = [
  // Beer
  [
    [
      "пиво",
      "ipa",
      "лагер",
      "lager",
      "ale",
      "эль",
      "стаут",
      "stout",
      "porter",
      "портер",
      "пилснер",
      "pilsner",
      "wheat",
      "пшеничное",
      "нефильтр",
      "крафт",
      "craft",
      "beer",
      "draft",
      "драфт",
      "хефевайцен",
      "hefeweizen",
      "weiss",
      "вайс",
      "сидр",
      "cider",
      "бланш",
      "blanche",
    ],
    "beer",
  ],

  // Wine
  [
    [
      "вино",
      "wine",
      "каберне",
      "cabernet",
      "мерло",
      "merlot",
      "шардоне",
      "chardonnay",
      "пино",
      "pinot",
      "совиньон",
      "sauvignon",
      "рислинг",
      "riesling",
      "просекко",
      "prosecco",
      "шампанское",
      "champagne",
      "игристое",
      "sparkling",
      "розе",
      "rosé",
      "rose",
      "мальбек",
      "malbec",
      "шираз",
      "shiraz",
      "гевюрц",
      "gewurz",
      "бокал",
      "графин",
    ],
    "wine",
  ],

  // Cocktails
  [
    [
      "коктейль",
      "cocktail",
      "мохито",
      "mojito",
      "маргарита",
      "margarita",
      "дайкири",
      "daiquiri",
      "негрони",
      "negroni",
      "апероль",
      "aperol",
      "спритц",
      "spritz",
      "мартини",
      "martini",
      "космополитен",
      "cosmopolitan",
      "пина колада",
      "pina colada",
      "лонг айленд",
      "long island",
      "old fashioned",
      "олд фэшн",
      "виски сауэр",
      "whiskey sour",
      "джин тоник",
      "gin tonic",
    ],
    "cocktail",
  ],

  // Spirits
  [
    [
      "виски",
      "whisky",
      "whiskey",
      "водка",
      "vodka",
      "ром",
      "rum",
      "текила",
      "tequila",
      "джин",
      "gin",
      "коньяк",
      "cognac",
      "бренди",
      "brandy",
      "абсент",
      "absinthe",
      "самбука",
      "sambuca",
      "ликёр",
      "ликер",
      "liqueur",
      "настойка",
      "шот",
      "shot",
      "граппа",
      "grappa",
      "кальвадос",
      "calvados",
      "бурбон",
      "bourbon",
      "скотч",
      "scotch",
    ],
    "spirits",
  ],

  // Soft drinks
  [
    [
      "кола",
      "cola",
      "pepsi",
      "пепси",
      "спрайт",
      "sprite",
      "фанта",
      "fanta",
      "лимонад",
      "lemonade",
      "сок",
      "juice",
      "морс",
      "компот",
      "вода",
      "water",
      "минералка",
      "газировка",
      "soda",
      "тоник",
      "tonic",
      "энергетик",
      "energy",
      "смузи",
      "smoothie",
      "фреш",
      "fresh",
      "милкшейк",
      "milkshake",
    ],
    "soft_drink",
  ],

  // Coffee
  [
    [
      "кофе",
      "coffee",
      "эспрессо",
      "espresso",
      "капучино",
      "cappuccino",
      "латте",
      "latte",
      "американо",
      "americano",
      "раф",
      "raf",
      "флэт уайт",
      "flat white",
      "моккачино",
      "mochaccino",
      "мокко",
      "mocha",
      "ристретто",
      "ristretto",
      "допио",
      "doppio",
      "макиато",
      "macchiato",
    ],
    "coffee",
  ],

  // Tea
  [
    [
      "чай",
      "tea",
      "матча",
      "matcha",
      "пуэр",
      "puer",
      "каркаде",
      "улун",
      "oolong",
      "сенча",
      "sencha",
      "ройбуш",
      "rooibos",
      "травяной",
      "herbal",
    ],
    "tea",
  ],

  // Hookah
  [
    [
      "кальян",
      "hookah",
      "shisha",
      "шиша",
      "табак",
    ],
    "hookah",
  ],

  // Tips / Service
  [
    [
      "чаевые",
      "tips",
      "tip",
      "сервис",
      "service",
      "обслуживание",
      "gratuity",
    ],
    "tips",
  ],

  // Dessert
  [
    [
      "десерт",
      "dessert",
      "торт",
      "cake",
      "пирожное",
      "чизкейк",
      "cheesecake",
      "тирамису",
      "tiramisu",
      "мороженое",
      "ice cream",
      "панна котта",
      "panna cotta",
      "брауни",
      "brownie",
      "маффин",
      "muffin",
      "круассан",
      "croissant",
      "эклер",
      "eclair",
      "макарон",
      "macaron",
      "штрудель",
      "strudel",
      "вафля",
      "waffle",
      "сорбет",
      "sorbet",
      "медовик",
      "наполеон",
    ],
    "dessert",
  ],

  // Food (generic — checked last as a catch-all for identifiable food items)
  [
    [
      "салат",
      "salad",
      "суп",
      "soup",
      "стейк",
      "steak",
      "бургер",
      "burger",
      "пицца",
      "pizza",
      "паста",
      "pasta",
      "ризотто",
      "risotto",
      "сэндвич",
      "sandwich",
      "роллы",
      "roll",
      "суши",
      "sushi",
      "гарнир",
      "хлеб",
      "bread",
      "закуска",
      "appetizer",
      "тартар",
      "tartare",
      "карпаччо",
      "carpaccio",
      "брускетта",
      "bruschetta",
      "фри",
      "fries",
      "крылышки",
      "wings",
      "наггетс",
      "nuggets",
      "шашлык",
      "kebab",
      "кебаб",
      "плов",
      "борщ",
      "окрошка",
      "пельмени",
      "вареники",
      "блины",
      "оладьи",
      "каша",
      "омлет",
      "omelette",
      "яичница",
      "тост",
      "toast",
      "гриль",
      "grill",
      "рыба",
      "fish",
      "лосось",
      "salmon",
      "тунец",
      "tuna",
      "креветки",
      "shrimp",
      "мидии",
      "mussels",
      "курица",
      "chicken",
      "свинина",
      "pork",
      "говядина",
      "beef",
      "утка",
      "duck",
      "ягнёнок",
      "lamb",
    ],
    "food",
  ],
];

/**
 * Категоризирует позицию чека по названию.
 *
 * @param name — название позиции из чека (OCR output)
 * @returns категория или null, если позиция не распознана
 */
export function categorizeItem(name: string): ReceiptItemCategory | null {
  const lower = name.toLowerCase().trim();
  if (!lower) return null;

  for (const [keywords, category] of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Все поддерживаемые категории с читабельными названиями (для UI).
 */
export const CATEGORY_LABELS: Record<ReceiptItemCategory, string> = {
  beer: "Пиво",
  wine: "Вино",
  cocktail: "Коктейли",
  spirits: "Крепкие напитки",
  soft_drink: "Безалкогольные",
  coffee: "Кофе",
  tea: "Чай",
  food: "Еда",
  dessert: "Десерты",
  tips: "Чаевые",
  hookah: "Кальян",
};
