// KZ Café Lounge — menu source of truth.
// NOTE: item `name` must be UNIQUE across the whole menu. The cart keys lines by
// display name, so two items sharing a name (e.g. "Nutella" in several sections)
// would merge in the cart. That's why repeated names are prefixed by their section.

const MENU_DATA = [
  { category: "Petit Déjeuner", image: "", items: [
    { name: "Formule Classique", price: 9.5, desc: "Café au choix ou thé · Viennoiserie · Jus · Eau 0,5 L" },
    { name: "Formule Kids", price: 13, desc: "Chocolat au lait · Jus · Eau 0,5 L · Miel · Bol de céréales · Mini crêpe sucrée · Œuf brouillé" },
    { name: "Formule Healthy", price: 18, desc: "Café au choix · Detox · Cake healthy · 2 pains complets perdu avec œuf · Bol flocon d'avoine et graine de chia · Eau 0,5 L" },
    { name: "Douceur du Matin", price: 21, desc: "Café au choix ou thé · Viennoiserie · Jus · Yaourt maison · Eau 0,5 L · Mini crêpe au choix · Beurre & confiture · Miel · Chocolat · Charcuterie & fromage · Omelette au fromage · Corbeille de pain" },
    { name: "Formule El Bey", price: 38, desc: "À partager — 2 cafés/thé · 2 viennoiseries · 2 jus · Yaourt maison · Eau 1 L · Olives, piment, cornichons, câpres · Tapenade · Charcuterie & fromage · Dattes farcies · Chamia · Beurre · Confiture · Miel · Bsissa · Salade méchouia · Salade tunisienne · Ojja merguez · Massfouf · Corbeille de pain" },
    { name: "Formule Le Bon Goût", price: 43, desc: "À partager — 2 cafés/thés · 2 viennoiseries · 2 jus · Eau 1 L · Gaufres chocolat · Beurre, confiture, miel · Chameya · Charcuterie & fromage · 2 mini crêpes · 2 mini sandwichs poulet · Nuggets 3 sauces · 2 omelettes fromage · Corbeille de pain" },
    { name: "Formule Le Parisien", price: 42, desc: "À partager — 2 cafés/thés · 2 jus · Eau 1 L · 2 croissants marbrés chocolat + boule de glace · Charcuterie & fromage · 4 mini cheesecake · 2 gaufres chocolat · 4 pancakes fruits au miel · Œufs brouillés" }
  ]},

  { category: "Café", image: "", items: [
    { name: "Express", price: 4, desc: "" },
    { name: "Capucin", price: 4.5, desc: "" },
    { name: "Américain", price: 5, desc: "" },
    { name: "Café Crème", price: 5, desc: "" },
    { name: "Nescafé au lait", price: 5, desc: "" },
    { name: "Chocolat au lait", price: 5, desc: "" },
    { name: "Café Turc", price: 6, desc: "" },
    { name: "Cappuccino", price: 7, desc: "" },
    { name: "Supplément Arôme", price: 2.5, desc: "Supplément café" },
    { name: "Supplément Nestlé", price: 3, desc: "Supplément café" }
  ]},

  { category: "Thés", image: "", items: [
    { name: "Thé à la menthe", price: 4, desc: "" },
    { name: "Thé Infusion", price: 6, desc: "" },
    { name: "Thé aux amandes", price: 7.5, desc: "" },
    { name: "Ice Tea", price: 9, desc: "Arôme au choix" },
    { name: "Thé aux pignons", price: 11, desc: "" },
    { name: "Thé Baklawa", price: 15, desc: "" },
    { name: "Supplément Thé Amandes", price: 4.5, desc: "Supplément thé" },
    { name: "Supplément Thé Pignons", price: 8, desc: "Supplément thé" }
  ]},

  { category: "Boissons", image: "", items: [
    { name: "Eau plate ½ L", price: 2, desc: "" },
    { name: "Eau plate 1 L", price: 3, desc: "" },
    { name: "Eau gazéifiée", price: 4, desc: "" },
    { name: "Sodas", price: 5, desc: "" },
    { name: "Orangina", price: 6, desc: "" },
    { name: "Boisson Énergétique", price: 10, desc: "" }
  ]},

  { category: "Cocktail", image: "", items: [
    { name: "Pina Colada", price: 13, desc: "" },
    { name: "Fraisana", price: 13, desc: "Fraise, banane" },
    { name: "Kiwana", price: 13, desc: "Kiwi, banane" },
    { name: "Big Gym", price: 15, desc: "Banane, datte, fruit sec" },
    { name: "Trio Tropical", price: 15, desc: "Ananas, mangue, kiwi" },
    { name: "Kiwapple", price: 15, desc: "Banane, kiwi, pomme" }
  ]},

  { category: "Frappuccino", image: "", items: [
    { name: "Frappuccino Classique", price: 14, desc: "Noisette, caramel, vanille" },
    { name: "Frappuccino Nutella", price: 13, desc: "" },
    { name: "Frappuccino Oreo", price: 13, desc: "" },
    { name: "Frappuccino Sneakers", price: 13, desc: "" },
    { name: "Frappuccino Speculoos", price: 13, desc: "" },
    { name: "Frappuccino Ferrero", price: 13, desc: "" },
    { name: "Frappuccino Kinder", price: 13, desc: "" }
  ]},

  { category: "Smoothies", image: "", items: [
    { name: "Nice Dream", price: 14, desc: "Banane, fraise, fruits rouges" },
    { name: "Paradise Punch", price: 14, desc: "Ananas, mangue, noix de coco" },
    { name: "Green Power", price: 17, desc: "Banane, kiwi, mangue, fruits secs" }
  ]},

  { category: "Café Glacé", image: "", items: [
    { name: "Café Glacé Classique", price: 7, desc: "Vanille ou noisette / caramel" }
  ]},

  { category: "Jwajem", image: "", items: [
    { name: "Foundou", price: 16, desc: "" }
  ]},

  { category: "Chocolat", image: "", items: [
    { name: "Chocolat Classique", price: 11, desc: "Chaud ou glacé" },
    { name: "Chocolat Nutella", price: 13, desc: "Chaud ou glacé" },
    { name: "Chocolat Oreo", price: 13, desc: "Chaud ou glacé" },
    { name: "Chocolat Sneakers", price: 13, desc: "Chaud ou glacé" },
    { name: "Chocolat Speculoos", price: 13, desc: "Chaud ou glacé" },
    { name: "Chocolat Ferrero", price: 13, desc: "Chaud ou glacé" },
    { name: "Chocolat Kinder", price: 13, desc: "Chaud ou glacé" },
    { name: "Chocolat Storm", price: 16, desc: "Chaud ou glacé" }
  ]},

  { category: "Detox", image: "", items: [
    { name: "Detox Pink", price: 13, desc: "Pomme, carotte, gingembre" },
    { name: "Detox Rosso", price: 13, desc: "Betterave, fraise, citron" },
    { name: "Detox Verde", price: 15, desc: "Concombre, kiwi, menthe, citron" }
  ]},

  { category: "Jus", image: "", items: [
    { name: "Jus d'Orange", price: 8, desc: "" },
    { name: "Citronnade", price: 8, desc: "" },
    { name: "Citronnade à la menthe", price: 10, desc: "" },
    { name: "Citronnade aux amandes", price: 11, desc: "" },
    { name: "Jus de Fraise", price: 9, desc: "" },
    { name: "Jus Fruit de Saison", price: 11, desc: "" }
  ]},

  { category: "Mojitos", image: "", items: [
    { name: "Mojito Classique", price: 10, desc: "" },
    { name: "Mojito Blue", price: 12, desc: "" },
    { name: "Mojito Red", price: 12, desc: "" },
    { name: "Mojito Black", price: 14, desc: "Coca-cola, fruits rouges" },
    { name: "Mojito Exotique", price: 15, desc: "Fruit de la passion, ananas, kiwi" },
    { name: "Mojito Big Power", price: 17, desc: "Boisson énergétique" }
  ]},

  { category: "Milk Shake", image: "", items: [
    { name: "Milkshake Classique", price: 11, desc: "Fraise, chocolat, vanille" },
    { name: "Milkshake Nutella", price: 13, desc: "" },
    { name: "Milkshake Oreo", price: 13, desc: "" },
    { name: "Milkshake Speculoos", price: 13, desc: "" },
    { name: "Milkshake Sneakers", price: 13, desc: "" },
    { name: "Milkshake Ferrero", price: 13, desc: "" },
    { name: "Milkshake Kinder", price: 13, desc: "" },
    { name: "Milkshake Fantastique", price: 15, desc: "Fraise, chocolat blanc, fruit rouge" },
    { name: "Milkshake Amour", price: 15, desc: "Banane, pistache, chocolat blanc" }
  ]},

  { category: "Crêpes Sucrées", image: "", items: [
    { name: "Crêpe Nutella", price: 13, desc: "" },
    { name: "Crêpe Oréo", price: 13, desc: "" },
    { name: "Crêpe Spéculoos", price: 13, desc: "" },
    { name: "Crêpe Kinder", price: 13, desc: "" },
    { name: "Crêpe Ferrero", price: 13, desc: "" },
    { name: "Crêpe Tiramisu", price: 15, desc: "" },
    { name: "Crêpe Nutella Fruits Secs", price: 15, desc: "" },
    { name: "Crêpe Nutella Banane", price: 15, desc: "" },
    { name: "Crêpe Nutella Banane Fruits Secs", price: 17, desc: "" },
    { name: "Crêpe Pistache", price: 17, desc: "" },
    { name: "Crêpe Over Dose", price: 19, desc: "Nutella, oréo, banane, fruits secs" },
    { name: "Crêpe K Zed", price: 22, desc: "Tagliatelle nutella, spéculoos, ferrero, banane, boule de glace, fruits secs" }
  ]},

  { category: "Crêpes Salées", image: "", items: [
    { name: "Crêpe Thon Fromage", price: 10, desc: "" },
    { name: "Crêpe Jambon Fromage", price: 10, desc: "" },
    { name: "Crêpe Tunisienne", price: 13, desc: "" },
    { name: "Crêpe Poulet Champignon", price: 15, desc: "Poulet à la crème au champignon" },
    { name: "Crêpe Chef", price: 15, desc: "Tagliatelle, poulet, légumes, sauce fromagère" }
  ]},

  { category: "Omelette", image: "", items: [
    { name: "Omelette Fromage", price: 10, desc: "" },
    { name: "Omelette Végétarienne", price: 11, desc: "" },
    { name: "Omelette Thon Fromage", price: 12, desc: "" },
    { name: "Omelette Jambon Fromage", price: 12, desc: "" }
  ]},

  { category: "Gaufre & Pancake", image: "", items: [
    { name: "Gaufre Nutella", price: 14, desc: "" },
    { name: "Gaufre Oréo", price: 14, desc: "" },
    { name: "Gaufre Speculoos", price: 14, desc: "" },
    { name: "Gaufre Kinder", price: 14, desc: "" },
    { name: "Gaufre Ferrero", price: 14, desc: "" },
    { name: "Gaufre Nutella Fruits Secs", price: 16, desc: "" },
    { name: "Gaufre Nutella Banane", price: 16, desc: "" },
    { name: "Gaufre Nutella Banane Fruits Secs", price: 19, desc: "" },
    { name: "Gaufre Over Dose", price: 22, desc: "Nutella, oréo, banane, fruits secs" }
  ]},

  { category: "Gaufres Salées", image: "", items: [
    { name: "Gaufre Big Mama", price: 19, desc: "Poulet pané, fromage raclette, sauce cheddar" },
    { name: "Gaufre Mexicain", price: 21, desc: "Viande hachée, légumes, sauce cheddar" }
  ]},

  { category: "Burger", image: "", items: [
    { name: "Crispy Chicken Burger", desc: "Poulet pané, tomate, laitue, oignons caramélisés", variants: [ { label: "Simple", price: 12 }, { label: "Double", price: 15 } ] },
    { name: "Beef Cheese Burger", desc: "Viande hachée, crème, tomate, laitue, oignons caramélisés", variants: [ { label: "Simple", price: 14 }, { label: "Double", price: 18 } ] },
    { name: "Burger KZ", price: 19, desc: "Filet de bœuf, champignon, œuf, fromage, cheddar" }
  ]},

  { category: "Pizza", image: "", items: [
    { name: "Pizza Margherita", price: 13, desc: "" },
    { name: "Pizza Neptune", price: 17, desc: "" },
    { name: "Pizza 4 Saisons", price: 19, desc: "" },
    { name: "Pizza 5 Cheese", price: 22, desc: "" },
    { name: "Pizza Chicken", price: 22, desc: "Sauce au choix" },
    { name: "Pizza Gourmand", price: 24, desc: "Viande hachée et œuf" },
    { name: "Pizza Fruits de Mer", price: 27, desc: "" }
  ]},

  { category: "Maqloub", image: "", items: [
    { name: "Maqloub Thon", price: 10, desc: "" },
    { name: "Maqloub Jambon", price: 10, desc: "" },
    { name: "Maqloub Poulet Grillé", price: 12, desc: "" },
    { name: "Maqloub Poulet Pané", price: 13, desc: "" },
    { name: "Maqloub Berbère", price: 15, desc: "Viande hachée" }
  ]},

  { category: "Baguette Farcie", image: "", items: [
    { name: "Baguette Poulet Grillé", price: 12, desc: "" },
    { name: "Baguette Poulet Pané", price: 13, desc: "" },
    { name: "Baguette Viande Hachée", price: 15, desc: "" },
    { name: "Supplément Frites", price: 3.5, desc: "Supplément baguette" },
    { name: "Supplément Fromage", price: 5, desc: "Supplément baguette" },
    { name: "Supplément Thon / Jambon", price: 4.5, desc: "Supplément baguette" }
  ]},

  { category: "Salade", image: "", items: [
    { name: "Salade de César", price: 16, desc: "Cœur de laitue, tomate cerise, poulet, fromage, sauce césar" },
    { name: "Salade Caprice", price: 17, desc: "Tomate, cœur de laitue, noix, mozzarella, sauce pesto, parmesan" },
    { name: "Salade Healthy", price: 19, desc: "Cœur de laitue, légumes crudités, fruits de saison, poulet, sauce healthy" }
  ]},

  { category: "Nos Plats", image: "", items: [
    { name: "Plat Poulet Grillé", price: 20, desc: "Servi avec entrée + garniture riz ou pâtes" },
    { name: "Plat Poulet Pané", price: 21, desc: "Servi avec entrée + garniture riz ou pâtes" },
    { name: "Cordon Bleu", price: 22, desc: "Servi avec entrée + garniture riz ou pâtes" },
    { name: "Émincé de Poulet aux Champignons", price: 24, desc: "À la crème · Servi avec entrée + garniture riz ou pâtes" },
    { name: "Curry Ananas", price: 26, desc: "Fruits secs, curry · Servi avec entrée + garniture" },
    { name: "Poulet Pané aux Amandes", price: 26, desc: "Amandes effilées · Servi avec entrée + garniture" },
    { name: "Suprême aux Noix", price: 27, desc: "Sauce blanche, noix, légumes grillés, champignons, parmesan" },
    { name: "Émincé de Veau aux Champignons", price: 35, desc: "À la crème · Servi avec entrée + garniture" },
    { name: "Variété de Grillade", price: 49, desc: "Steak, merguez, poulet pané, poulet grillé, kebab, foie, 2 brochettes chiche taouk, légumes sautés, riz et frites" }
  ]},

  { category: "Pâtes Sauce Blanche", image: "", items: [
    { name: "Pâtes Carbonara", price: 17, desc: "Poulet, jambon, basilic, parmesan" },
    { name: "Pâtes Alfredo", price: 18, desc: "Poulet, champignons à la crème, basilic, parmesan" },
    { name: "Pâtes Pesto", price: 20, desc: "Poulet, sauce pesto, pignon, basilic, parmesan" },
    { name: "Pâtes Mari Monté", price: 21, desc: "Crevette, champignon à la crème, basilic, parmesan" },
    { name: "Best Pasta", price: 23, desc: "Crevette, noix, sauce blanche, basilic, parmesan" },
    { name: "Pâtes Fruits de Mer Blanche", price: 29, desc: "Crevette, noix, sauce blanche, basilic, parmesan" }
  ]},

  { category: "Pâtes Sauce Rouge", image: "", items: [
    { name: "Pâtes Puttanesca", price: 16, desc: "Thon, anchois, piment de cayenne, olive, basilic, parmesan" },
    { name: "Pâtes Bolognaise", price: 19, desc: "Sauce tomate, viande hachée, basilic, parmesan" },
    { name: "Pâtes Fruits de Mer Rouge", price: 27, desc: "Sauce tomate, crevette, crevette rose, poulpe, seiche, moule, basilic, parmesan" }
  ]},

  { category: "Risotto", image: "", items: [
    { name: "Risotto Poulet Champignons", price: 19, desc: "" },
    { name: "Risotto Poulet Pesto", price: 21, desc: "" },
    { name: "Risotto Fruits de Mer", price: 29, desc: "Crevettes, crevette rose, poulpe, seiche, moule" },
    { name: "Paëlla (2 pers.)", price: 48, desc: "Sauce rouge, crevette, crevette rose, poulpe, seiche, moule, poulet, merguez" }
  ]},

  { category: "Best of Sea", image: "", items: [
    { name: "Daurade", price: 23, desc: "" },
    { name: "Loup", price: 27, desc: "" },
    { name: "Délice de la Mer", price: 43, desc: "Crevettes, poulpe, seiche, moule, calamar, calamar doré, sauté à l'ail, rouget · Servi avec entrée, tastira et frites" },
    { name: "Perle de la Mer", price: 45, desc: "Crevettes, crevette rose, poulpe, seiche, moule, calamar, calamar doré à la crème, rouget · Servi avec entrée, riz, légumes sautés, frites" },
    { name: "Océan en Assiette", price: 57, desc: "Poisson du jour, crevettes, crevette rose, poulpe, calamar doré, calamar, moule, rouget · Servi avec ojja aux seiches et frites" },
    { name: "Spécial K-Zed", price: 68, desc: "Crevettes, chevrettes, poulpe, calamar doré, moules, seiche, calamar, rouget, steak, 4 merguez, foie, poulet grillé, poulet pané, kebab, frites, légumes sautés, salade tunisienne, salade méchouia, riz ou pâtes" }
  ]},

  { category: "Ojja", image: "", items: [
    { name: "Ojja Merguez", price: 17, desc: "" },
    { name: "Ojja Poulet", price: 19, desc: "" },
    { name: "Ojja Fruits de Mer", price: 27, desc: "" }
  ]},

  { category: "Gratin", image: "", items: [
    { name: "Gratin Lasagne", price: 19, desc: "" },
    { name: "Gratin Suprême Poulet", price: 21, desc: "À la crème aux champignons" },
    { name: "Gratin Fruits de Mer", price: 27, desc: "" }
  ]},

  { category: "Dessert", image: "", items: [
    { name: "Opera Noisette", price: 15, desc: "" },
    { name: "Russe Pistache", price: 15, desc: "" },
    { name: "Fondant au Chocolat 72%", price: 9, desc: "" },
    { name: "Gâteau du Chef", price: 13, desc: "" },
    { name: "Trompe-l'œil", price: 11, desc: "" },
    { name: "Cheese Cake", price: 11, desc: "" },
    { name: "Gâteau Anniversaire", price: 45, desc: "Sur commande" },
    { name: "Assiette de Fruits", desc: "", variants: [ { label: "Single", price: 14 }, { label: "Double", price: 24 } ] }
  ]},

  { category: "Chicha", image: "", items: [
    { name: "Chicha Fakher", price: 10, desc: "" },
    { name: "Chicha Adalya", price: 13, desc: "" },
    { name: "Chicha Orientale", price: 15, desc: "" }
  ]}
];

const CATEGORY_PLACEHOLDERS = {
  "Petit Déjeuner": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80",
  "Café": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
  "Thés": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80",
  "Boissons": "https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=800&q=80",
  "Cocktail": "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=800&q=80",
  "Frappuccino": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80",
  "Smoothies": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80",
  "Café Glacé": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80",
  "Jwajem": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
  "Chocolat": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&q=80",
  "Detox": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&q=80",
  "Jus": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80",
  "Mojitos": "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80",
  "Milk Shake": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
  "Crêpes Sucrées": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=80",
  "Crêpes Salées": "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80",
  "Omelette": "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&q=80",
  "Gaufre & Pancake": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80",
  "Gaufres Salées": "https://images.unsplash.com/photo-1639667851659-86b9c6b7f9d9?w=800&q=80",
  "Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  "Pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
  "Maqloub": "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=800&q=80",
  "Baguette Farcie": "https://images.unsplash.com/photo-1559054663-e8d23213f55c?w=800&q=80",
  "Salade": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  "Nos Plats": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  "Pâtes Sauce Blanche": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  "Pâtes Sauce Rouge": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80",
  "Risotto": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
  "Best of Sea": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80",
  "Ojja": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80",
  "Gratin": "https://images.unsplash.com/photo-1621510456681-2330135e5871?w=800&q=80",
  "Dessert": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80",
  "Chicha": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"
};

function formatPrice(price) {
  return `${Number(price).toFixed(2)} DT`;
}

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function baseName(name) {
  return String(name).replace(/\s*\([^()]*\)\s*$/, "").trim();
}

function itemCategory(name) {
  const base = baseName(name);
  for (const block of MENU_DATA) {
    if (block.items.some(it => it.name === name || it.name === base)) {
      return block.category;
    }
  }
  return "";
}

function flatMenuItems() {
  const out = [];
  for (const block of MENU_DATA) {
    for (const it of block.items) {
      if (it.variants && it.variants.length) {
        it.variants.forEach(v => out.push({
          category: block.category,
          name: `${it.name} (${v.label})`,
          baseName: it.name,
          price: v.price
        }));
      } else {
        out.push({ category: block.category, name: it.name, baseName: it.name, price: it.price });
      }
    }
  }
  return out;
}
