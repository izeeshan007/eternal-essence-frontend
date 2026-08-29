const BACKEND_BASE_URL = String(
  window.__EE_CONFIG__?.BACKEND_BASE_URL ||
  (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : 'https://eternal-essence-backend.onrender.com'
  )
).trim().replace(/\/+$/, '');
async function fetchWithTimeout(input, init = {}, timeoutMs = 3500) {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
try {
return await fetch(input, { ...init, signal: init.signal || controller.signal });
} finally {
clearTimeout(timer);
}
}
function escapeHtml(value) {
if (!value && value !== 0) return '';
return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const CART_STORAGE_KEY = 'ee_cart_v1';
const CART_DISCOUNT_KEY = 'ee_discount_v1';
const CART_COUPON_KEY = 'ee_coupon_v1';
const AUTH_TOKEN_KEY = 'ee_auth_token_v1';
const AUTH_USER_KEY = 'ee_auth_user_v1';
const CATEGORY_STORAGE_KEY = 'ee_active_category';
let wishlistIds = [];
let wishlistReady = false;
let wishlistLoaded = false;
// ================ PRODUCTS (all included) ================
// The compact array keeps the same order as data/current-catalog.json. These
// are the only rows that are perfumes; every other row is an attar.
const PERFUME_CATALOG_POSITIONS = new Set([
1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,22,52,60,71,75,95,98,
117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137
]);
const products = [
["Purple OUD","Purple Oud (Dior)","Unisex","Autumn-Winter","Day/Night","Woody|Spicy|Citrus|Oud","Mandarin Orange","Pink Pepper, Saffron","Oud (Agarwood)",499,["purple_oud8.webp","purple_oud20.webp","purple_oud3.webp"]],
["Pulse Royale","CR-7","Unisex","All Season","Day","Aromatic|Woody|Powdery|Warm Spicy","Lavender, Cardamom, Artemisia, Bergamot","Tobacco, Cinnamon, Cedar, Iris","Vanilla, Musk, Sandalwood, Amber",499,["pulse_royale8.webp","pulse_royale20.webp","pulse_royale3.webp"]],
["Aqua Wave","Acqua Di Gio","Male","Spring-Summer","Day/Night","Citrus|Aromatic|Marine|Fresh Spicy","Lime, Lemon, Bergamot, Jasmine, Orange, Mandarin","Sea Notes, Jasmine, Calone, Peach, Freesia","White Musk, Cedar, Oakmoss, Patchouli, Amber",499,["aqua_wave8.webp","aqua_wave20.webp","aqua_wave3.webp"]],
["Eternal Elixir","Dior Sauvage Elixir","Male","All Season","Night","Warm Spicy|Fresh Spicy|Woody|Aromatic","Nutmeg, Cinnamon, Cardamom, Grapefruit","Lavender","Licorice, Sandalwood, Amber, Patchouli, Vetiver",499,["eternal_elixir8.webp","eternal_elixir20.webp","eternal_elixir3.webp"]],
["Golden Blush","Good Girl Blush","Female","All Season","Day","Floral|Vanilla|Citrus|Powdery|Almond","Bergamot, Bitter Almond","Peony, Ylang-Ylang","Vanilla, Coumarin (Tonka)",499,["golden_blush8.webp","golden_blush20.webp","golden_blush3.webp"]],
["Intense Suede","Stronger With You Intensely","Unisex","Autumn-Winter","Night","Warm Spicy|Amber|Vanilla|Sweet","Pink Pepper, Juniper, Violet","Toffee, Cinnamon, Lavender, Sage","Vanilla, Tonka Bean, Amber, Suede",499,["intense_suede8.webp","intense_suede20.webp","intense_suede3.webp"]],
["Cool Essence","Polo Sport","Male","Spring-Summer","Day","Aromatic|Fresh Spicy|Green|Citrus","Mint, Aldehydes, Lavender, Bergamot, Mandarin, Lemon","Seagrass, Ginger, Jasmine, Geranium, Rosewood","Musk, Sandalwood, Cedar, Guaiac Wood, Amber",499,["cool_essence8.webp","cool_essence20.webp","cool_essence3.webp"]],
["Divine Essence","Burberry Goddess","Female","All Season","Day/Night","Vanilla|Aromatic|Sweet|Lavender","Vanilla Infusion, Lavender, Cacao, Ginger","Vanilla Caviar","Vanilla Absolute",499,["divine_essence8.webp","divine_essence20.webp","divine_essence3.webp"]],
["Vanilla Blossom","Kayali Vanilla 28","Female","Autumn-Winter","Night","Vanilla|Sweet|Amber|Powdery|Floral","Vanilla Orchid, Jasmine","Brown Sugar, Tonka Bean","Amber, Amberwood, Musk, Patchouli",499,["vanilla_blossom8.webp","vanilla_blossom20.webp","vanilla_blossom3.webp"]],
["Eternal Sauvage","Dior Sauvage (EDT)","Male","All Season","Day/Night","Fresh Spicy|Amber|Citrus|Aromatic","Calabrian Bergamot, Pepper","Sichuan Pepper, Lavender, Pink Pepper, Vetiver, Patchouli","Ambroxan, Cedar, Labdanum",499,["eternal_sauvage8.webp","eternal_sauvage20.webp","eternal_sauvage3.webp"]],
["Invictus","Invictus Aqua","Male","Spring-Summer","Day","Citrus|Marine|Aquatic|Salty","Yuzu, Grapefruit, Pink Pepper","Sea Water, Violet Leaf","Ambergris, Amberwood, Guaiac Wood",499,["invictus8.webp","invictus20.webp","invictus3.webp"]],
["Bleu Voyage","Bleu de Chanel","Male","All Season","Day/Night","Citrus|Woody|Warm Spicy|Aromatic","Grapefruit, Lemon, Mint, Pink Pepper","Ginger, Nutmeg, Jasmine, Iso E Super","Incense, Vetiver, Cedar, Sandalwood, Patchouli",599,["bleu_voyage8.webp","bleu_voyage20.webp","bleu_voyage3.webp"]],
["Aventus","Creed Aventus","Male","All Season","Day/Night","Fruity|Sweet|Leather|Woody|Smoky","Pineapple, Bergamot, Black Currant, Apple","Birch, Patchouli, Moroccan Jasmine, Rose","Musk, Oakmoss, Ambergris, Vanilla",499,["aventus8.webp","aventus20.webp","aventus3.webp"]],
["Golden Flora","Gucci Flora Gorgeous Gardenia","Female","Spring-Summer","Day","White Floral|Sweet|Fruity|Floral","Pear Blossom, Red Berries, Italian Mandarin","Gardenia, Jasmine, Frangipani","Brown Sugar, Patchouli",499,["golden_flora8.webp","golden_flora20.webp","golden_flora3.webp"]],
["Fresh Impact","Louis Vuitton Imagination","Unisex","Spring-Summer","Day","Citrus|Aromatic|Fresh Spicy|Woody","Citron, Calabrian Bergamot, Sicilian Orange","Tunisian Neroli, Nigerian Ginger, Ceylon Cinnamon","Chinese Black Tea, Ambroxan, Guaiac Wood, Olibanum",499,["fresh_impact8.webp","fresh_impact20.webp","fresh_impact3.webp"]],
["Chocolate Musk","","Unisex","Autumn-Winter","Night","Gourmand|Musky|Powdery","Milk Chocolate, Cinnamon, Vanilla","Spicy Notes, Rose","White Musk, Sandalwood, Myrrh, Amber",49,["chocolate_musk8.webp","chocolate_musk20.webp","chocolate_musk3.webp"]],
["Iceberg","","Unisex","Spring-Summer","Day","Citrus|Fresh|Floral","Galbanum, Bergamot, Basil, Orange Blossom, Lemon, Peach","Lily, Lily-of-the-Valley, Jasmine, Orris Root, Rose, Ylang-Ylang","Oakmoss, Cedar, Vetiver, Sandalwood, Musk, Amber",49,["iceberg8.webp","iceberg20.webp","iceberg3.webp"]],
["Dubai Gold","","Unisex","Autumn-Winter","Night","Oud|Amber|Spicy","Saffron, Bitter Orange, Brandy","Cedarwood, Guaiac Wood, Juniper","Patchouli, Sandalwood, Musk, Amber",59,["dubai_gold8.webp","dubai_gold20.webp","dubai_gold3.webp"]],
["Cool Tide","Davidoff CoolWater","Unisex","Spring-Summer","Day","Fresh|Floral|Aquatic","Melon, Lotus, Lemon, Pineapple, Quince, Calone, Lily","Lotus, Water Lily, Lily-of-the-Valley, Jasmine, Honey, Hawthorn, Rose","Musk, Vetiver, Raspberry, Blackberry, Violet Root, Peach, Sandalwood",69,["cool_tide8.webp","cool_tide20.webp","cool_tide3.webp"]],
["Red Musk","","Unisex","Autumn-Winter","Night","Musky|Spicy","Pepper","Cinnamon","Tobacco, Musk",69,["red_musk8.webp","red_musk20.webp","red_musk3.webp"]],
["Chrome Breeze","Azzaro Chrome","Male","Spring-Summer","Day","Fresh|Woody|Citrus","Lemon, Rosemary, Bergamot, Neroli, Pineapple","Jasmine, Cyclamen, Oakmoss, Coriander","Musk, Cedar, Oakmoss, Sandalwood, Cardamom, Tonka Bean, Rosewood",59,["chrome_breeze8.webp","chrome_breeze20.webp","chrome_breeze3.webp"]],
["Luminous Veil","Dior J'adore","Female","Spring-Summer","Day","Floral|Fruity|Powdery","Pear, Melon, Magnolia, Peach, Mandarin Orange, Bergamot","Jasmine, Lily-of-the-Valley, Tuberose, Freesia, Rose, Orchid, Plum, Violet","Musk, Vanilla, Blackberry, Cedar",499,["luminous_veil8.webp","luminous_veil20.webp","luminous_veil3.webp"]],
["Luminous Veil","Dior J'adore","Female","Spring-Summer","Day","Floral|Fruity|Powdery","Pear, Melon, Magnolia, Peach, Mandarin Orange, Bergamot","Jasmine, Lily-of-the-Valley, Tuberose, Freesia, Rose, Orchid, Plum, Violet","Musk, Vanilla, Blackberry, Cedar",89,["luminous_veil8.webp","luminous_veil20.webp","luminous_veil3.webp"]],
["Golden Flora","Gucci Flora","Female","Spring-Summer","Day","Floral|Fruity|Citrus","Peony, Citrus Fruits, Mandarin Orange","Osmanthus, Rose","Sandalwood, Patchouli, Pink Pepper",69,["golden_flora8.webp","golden_flora20.webp","golden_flora3.webp"]],
["Cool Essence","Polo Sports","Male","Spring-Summer","Day","Fresh|Aromatic|Citrus","Mint, Aldehydes, Lavender, Bergamot, Mandarin Orange, Lemon, Artemisia, Neroli","Seagrass, Jasmine, Ginger, Geranium, Rose, Cyclamen, Brazilian Rosewood","Musk, Sandalwood, Cedar, Guaiac Wood, Amber",89,["cool_essence8.webp","cool_essence20.webp","cool_essence3.webp"]],
["Majmua","","Unisex","All seasons","Day/Night","Floral|Herbal|Musky","Kewda (Screw Pine), Green Notes","Rose (Ruh Gulab), Hina (Henna)","Vetiver (Khus), Sandalwood",69,["majmua8.webp","majmua20.webp","majmua3.webp"]],
["Majmua Premium","","Unisex","All seasons","Day/Night","Floral|Herbal|Musky","Kewda (Screw Pine), Green Notes","Rose (Ruh Gulab), Hina (Henna)","Vetiver (Khus), Sandalwood",999,["majmua_premium8.webp","majmua_premium20.webp","majmua_premium3.webp"]],
["Mukhallat","","Unisex","Autumn-Winter","Night","Oriental|Amber|Spicy","Oud (Agarwood)","Saffron","Musk, Amber, Woody Notes",69,["mukhallat8.webp","mukhallat20.webp","mukhallat3.webp"]],
["Mukhallat Premium","","Unisex","Autumn-Winter","Night","Oriental|Amber|Spicy","Oud (Agarwood)","Saffron","Musk, Amber, Woody Notes",999,["mukhallat_premium8.webp","mukhallat_premium20.webp","mukhallat_premium3.webp"]],
["Ameer Al OUD","","Unisex","Autumn-Winter","Night","Woody|Sweet|Amber","Oud, Woody Notes","Vanilla, Sugar","Agarwood (Oud), Sandalwood, Herbal Notes",89,["ameer_al_oud8.webp","ameer_al_oud20.webp","ameer_al_oud3.webp"]],
["Ameer Al OUD Premium","","Unisex","Autumn-Winter","Night","Woody|Sweet|Amber","Oud, Woody Notes","Vanilla, Sugar","Agarwood (Oud), Sandalwood, Herbal Notes",249,["ameer_al_oud_premium8.webp","ameer_al_oud_premium20.webp","ameer_al_oud_premium3.webp"]],
["Shay Oud","","Unisex","Autumn-Winter","Night","Woody|Oriental|Honey","Frankincense (Luban)","Honey","Agarwood (Oud), Musk",99,["shay_oud8.webp","shay_oud20.webp","shay_oud3.webp"]],
["Shay Oud Premium","","Unisex","Autumn-Winter","Night","Woody|Oriental|Honey","Frankincense (Luban)","Honey","Agarwood (Oud), Musk",239,["shay_oud_premium8.webp","shay_oud_premium20.webp","shay_oud_premium3.webp"]],
["Jannatul Ferdous","","Unisex","Spring-Summer","Day","Herbal|Floral|Spicy","Lotus, Gardenia, Green Notes","Rose, Grass","Herbal Notes, Woody Notes",69,["jannatul_ferdous8.webp","jannatul_ferdous20.webp","jannatul_ferdous3.webp"]],
["Zam Zam","","Unisex","Spring-Summer","Day","Fresh|Aromatic","Bergamot, Mint, Watercress","Lilies, Iris, Jasmine","Woody Notes, Musk, Apricot",69,["zam_zam8.webp","zam_zam20.webp","zam_zam3.webp"]],
["Magnet","","Unisex","All seasons","Day/Night","Floral|Woody|Mossy","Red Berries, Black Currant, Cassia, Litchi, Pineapple, Melon","Green Leaves, Basil, Almond Blossom, Iris, Freesia, Jasmine, Rose","Caramel, Vanilla, Patchouli, Benzoin, Musk, Sandalwood, Amber, Vetiver",49,["magnet8.webp","magnet20.webp","magnet3.webp"]],
["Aqua Wave","Aqua De Gio","Male","Spring-Summer","Day","Fresh|Marine|Citrus","Lime, Lemon, Bergamot, Jasmine, Orange, Mandarin Orange, Neroli","Sea Notes, Jasmine, Calone, Rosemary, Peach, Freesia, Cyclamen","White Musk, Cedar, Oakmoss, Patchouli, Amber",69,["aqua_wave8.webp","aqua_wave20.webp","aqua_wave3.webp"]],
["Blue Wave","","Male","Spring-Summer","Day","Fresh|Citrus|Fruity","Bergamot, Mandarin Orange","Aquatic Accords, Lavender","Amber, Woody Notes, Musk",69,["blue_wave8.webp","blue_wave20.webp","blue_wave3.webp"]],
["Blue Water","","Male","Spring-Summer","Day","Fresh|Aromatic","Sea Water, Citrus, Green Notes","Neroli, Geranium","Oakmoss, Cedar",69,["blue_water8.webp","blue_water20.webp","blue_water3.webp"]],
["Velour Si","Armani Si","Female","Autumn-Winter","Night","Floral|Fruity|Warm","Cassis (Blackcurrant Syrup)","May Rose, Freesia","Vanilla, Patchouli, Ambroxan, Woody Notes",69,["velour_si8.webp","velour_si20.webp","velour_si3.webp"]],
["Captain’s Ember","Le Male Elixir","Male","Autumn-Winter","Night","Sweet|Amber|Woody","Lavender, Mint","Vanilla, Benzoin","Honey, Tonka Bean, Tobacco",69,["captain_s_ember8.webp","captain_s_ember20.webp","captain_s_ember3.webp"]],
["Sabaya","","Female","Spring-Summer","Day","Floral|Herbal","Citrus","Green Notes","Rose",59,["sabaya8.webp","sabaya20.webp","sabaya3.webp"]],
["Purple OUD","Dior Purple Oud","Unisex","Autumn-Winter","Night","Oriental|Woody|Spicy","Pink Pepper, Orange","Saffron","Agarwood (Oud)",79,["purple_oud8.webp","purple_oud20.webp","purple_oud3.webp"]],
["Pulse Royale","CR-7","Male","Spring-Summer","Day","Sweet|Marine|Sweet","Lavender, Cardamom, Artemisia, Bergamot","Tobacco, Cinnamon, Cedar, Iris","Vanilla, Musk, Sandalwood, Amber",69,["pulse_royale8.webp","pulse_royale20.webp","pulse_royale3.webp"]],
["Invictus","Paco Rabanne Invictus","Male","Spring-Summer","Day","Citrus|Marine|Aromatic","Sea Notes, Grapefruit, Mandarin Orange","Bay Leaf, Jasmine","Ambergris, Guaiac Wood, Oakmoss, Patchouli",69,["invictus8.webp","invictus20.webp","invictus3.webp"]],
["Aseel","","Unisex","All seasons","Day/Night","Woody|Floral|Herbal","Red Rose, Saffron","Sandalwood, Mint","Agarwood (Oud), Musk",69,["aseel8.webp","aseel20.webp","aseel3.webp"]],
["Fasli Gulab","","Unisex","Spring-Summer","Day","Floral|Powdery","Rose","","",69,["fasli_gulab8.webp","fasli_gulab20.webp","fasli_gulab3.webp"]],
["Aventus","Creed Aventus","Male","All seasons","Day/Night","Fruity-Chypre|Woody","Pineapple, Bergamot, Blackcurrant, Apple","Birch, Patchouli, Moroccan Jasmine, Rose","Musk, Oakmoss, Ambergris, Vanille",85,["aventus8.webp","aventus20.webp","aventus3.webp"]],
["Golden Blush","Carolina Herrrera Good Girl Blush","Female","Spring-Summer","Day","Floral|Gourmand|Fresh","Bergamot, Bitter Almond","Peony, Ylang-Ylang","Vanilla, Coumarin",69,["golden_blush8.webp","golden_blush20.webp","golden_blush3.webp"]],
["Fresh Horizon","Versace Eros","Male","Autumn-Winter","Night","Woody|Oriental|Sweet","Mint, Green Apple, Lemon","Tonka Bean, Ambroxan, Geranium","Vanilla, Cedar, Vetiver, Oakmoss",69,["fresh_horizon8.webp","fresh_horizon20.webp","fresh_horizon3.webp"]],
["Velvet Night","YSL Black Opium","Female","Autumn-Winter","Night","Gourmand|Oriental|Sweet","Pear, Pink Pepper, Orange Blossom","Coffee, Jasmine, Bitter Almond, Licorice","Vanilla, Patchouli, Cedar, Cashmere Wood",69,["velvet_night8.webp","velvet_night20.webp","velvet_night3.webp"]],
["Titanium","","Male","Spring-Summer","Day","Aromatic|Marine|Aquatic","Pineapple,Mandrin orange","Marine note, Patchouli & Dry Amber","Oakmoss & Musk ",499,["titanium8.webp","titanium20.webp","titanium3.webp"]],
["Titanium","Titanium Ajmal","Male","Spring-Summer","Day","Aromatic|Fruity","Citrus, Fruity Notes","Fresh Spicy Notes","Woody Notes, Musk",89,["titanium8.webp","titanium20.webp","titanium3.webp"]],
["White OUD","","Unisex","Autumn-Winter","Night","Fresh|Floral","Artemisia, Lemon, Orange","Freesia, Patchouli, Black Currant","Tobacco, Amber, Musk",79,["white_oud8.webp","white_oud20.webp","white_oud3.webp"]],
["Most Wanted","AZ The Most Wanted","Male","Autumn-Winter","Night","Amber|Woody|Sweet","Cardamom","Toffee","Amberwood",79,["most_wanted8.webp","most_wanted20.webp","most_wanted3.webp"]],
["BLU Ember","Ajmal BLU","Male","Spring-Summer","Day","Fresh|Aquatic|Aromatic","Watermelon, Bergamot, Lavender","Lotus, Jasmine","Musk, Amber, Sandalwood",69,["blu_ember8.webp","blu_ember20.webp","blu_ember3.webp"]],
["Caramel OUD","","Unisex","Autumn-Winter","Night","Gourmand|Woody","Chocolate, Honey","Rose, Oud, Amber","Vanilla, Powdery Notes",69,["caramel_oud8.webp","caramel_oud20.webp","caramel_oud3.webp"]],
["Shanaya","","Female","All seasons","Day/Night","Woody|Floral|Amber","Rose, Saffron, Pimento","Agarwood (Oud), Caramel, Floral Notes","Resins, Amber, Musk",89,["shanaya8.webp","shanaya20.webp","shanaya3.webp"]],
["Fresh Impact","LV Imagination","Male","Spring-Summer","Day","Citrus|Fresh-Spicy|Green","Citron, Calabrian Bergamot, Orange","Ginger, Tunisian Neroli, Cinnamon","Tea, Ambroxan, Guaiac Wood, Olibanum",69,["fresh_impact8.webp","fresh_impact20.webp","fresh_impact3.webp"]],
["br 540","MFK Baccarat Rouge 540","Unisex","All seasons","Day/Night","Amber|Sweet|Woody","Saffron, Jasmine","Amberwood, Ambergris","Fir Resin, Cedar",499,["br_5408.webp","br_54020.webp","br_5403.webp"]],
["BR 540","MFK Baccarat Rouge 540","Unisex","All seasons","Day/Night","Amber|Sweet|Woody","Saffron, Jasmine","Amberwood, Ambergris","Fir Resin, Cedar",89,["br_5408.webp","br_54020.webp","br_5403.webp"]],
["Qahwa","Khamra Qahwa","Unisex","Autumn-Winter","Night","Spicy|Coffee|Sweet","Ginger, Cinnamon, Cardamom","Praline, Candied Fruits","Coffee, Tonka Bean, Vanilla",89,["qahwa8.webp","qahwa20.webp","qahwa3.webp"]],
["Obsidian OUD","Oud maracuja","Unisex","Autumn-Winter","Night","Fruity-Chypre|Woody","Passionfruit, Saffron, Turkish Rose","Oud, Patchouli, Benzoin","Leather, Amber, Vanilla",79,["obsidian_oud8.webp","obsidian_oud20.webp","obsidian_oud3.webp"]],
["Dark Rebel","TF OUD wood","Unisex","Autumn-Winter","Night","Woody|Spicy|Oriental","Cardamom, Sichuan Pepper","Vanilla","Tonka Bean, Oud, Vetiver, Amber",89,["dark_rebel8.webp","dark_rebel20.webp","dark_rebel3.webp"]],
["Woody OUD","","Unisex","Autumn-Winter","Night","Woody|Spicy|Oriental","Cardamom, Sichuan Pepper","Vanilla","Tonka Bean, Oud, Vetiver, Amber",279,["woody_oud8.webp","woody_oud20.webp","woody_oud3.webp"]],
["Musk Abiyad","","Unisex","All seasons","Day","Musky|Powdery|Floral","Rose, White Musk","Balsamic, Powdery Notes","Musk, Sandalwood",89,["musk_abiyad8.webp","musk_abiyad20.webp","musk_abiyad3.webp"]],
["Midnight","","Male","Autumn-Winter","Night","Woody|Fresh Spicy|Citrus","Bergamot, Lavender","Geranium, Orange Blossom","Patchouli, Woody Notes",89,["midnight8.webp","midnight20.webp","midnight3.webp"]],
["Musk Safi","","Unisex","All seasons","Day","Musky|Woody|Floral","Lily of the Valley","White Musk","Sandalwood, Amber",89,["musk_safi8.webp","musk_safi20.webp","musk_safi3.webp"]],
["Eternal Sauvage","Dior Sauvage","Male","All seasons","Day/Night","Fresh|Spicy-Oriental","Calabrian Bergamot, Pepper","Sichuan Pepper, Lavender, Vetiver","Ambroxan, Cedar, Labdanum",69,["eternal_sauvage8.webp","eternal_sauvage20.webp","eternal_sauvage3.webp"]],
["Dahnal OUD","","Unisex","Autumn-Winter","Night","Woody|Honey|Spicy","Oud","","",99,["dahnal_oud8.webp","dahnal_oud20.webp","dahnal_oud3.webp"]],
["Eternal White","Lacoste White","Male","Spring-Summer","Day","Citrus|Woody|Aromatic","Grapefruit, Rosemary, Cardamom","Ylang-Ylang, Tuberose","Suede, Cedar, Leather, Vetiver",499,["eternal_white8.webp","eternal_white20.webp","eternal_white3.webp"]],
["Eternal White","Lacoste White","Male","Spring-Summer","Day","Citrus|Woody|Aromatic","Grapefruit, Rosemary, Cardamom","Ylang-Ylang, Tuberose","Suede, Cedar, Leather, Vetiver",99,["eternal_white8.webp","eternal_white20.webp","eternal_white3.webp"]],
["Intense Suede","Armani SWY intensely","Male","Autumn-Winter","Night","Vanilla|Sweet|Amber","Pink Pepper, Juniper, Violet","Toffee, Cinnamon, Lavender, Sage","Vanilla, Amber, Tonka Bean, Suede",79,["intense_suede8.webp","intense_suede20.webp","intense_suede3.webp"]],
["Aurum","","Unisex","All seasons","Day/Night","White Floral|Fruity|Powdery","Raspberry, Lemon","Orange Blossom, Gardenia, Jasmine","Vanilla, Amber, Musk",129,["aurum8.webp","aurum20.webp","aurum3.webp"]],
["Blue OUD","","Unisex","Autumn-Winter","Night","Oud|Leather|Patchouli","Blue Lily, Oud","Patchouli, Leather","Amber, Tobacco",699,["blue_oud8.webp","blue_oud20.webp","blue_oud3.webp"]],
["Blue OUD","","Unisex","Autumn-Winter","Night","Oud|Leather|Patchouli","Blue Lily, Oud","Patchouli, Leather","Amber, Tobacco",175,["blue_oud8.webp","blue_oud20.webp","blue_oud3.webp"]],
["Musk Rijali","","Unisex","All seasons","Day","Musky|Subtle Sweet|Floral","Musk, Bergamot","Jasmine, Saffron","Oud, Amber, Vanilla",115,["musk_rijali8.webp","musk_rijali20.webp","musk_rijali3.webp"]],
["Musk Rijali Premium","","Unisex","All seasons","Day","Musky|Subtle Sweet|Floral","Musk, Bergamot","Jasmine, Saffron","Oud, Amber, Vanilla",199,["musk_rijali_premium8.webp","musk_rijali_premium20.webp","musk_rijali_premium3.webp"]],
["OUD Al Shams","","Unisex","Autumn-Winter","Night","Spicy|Vanilla|Amber","Rosemary, Spicy Notes","Amber, Blackberry","Cashmere Wood, Vanilla",199,["oud_al_shams8.webp","oud_al_shams20.webp","oud_al_shams3.webp"]],
["Black OUD","","Unisex","Autumn-Winter","Night","Woody|Smoky","Lemon, Mandarin, Oud, Saffron","Rose, Patchouli","Leather, Sandalwood, White Musk, Guaiacwood",149,["black_oud8.webp","black_oud20.webp","black_oud3.webp"]],
["Mukhallat OUD","","Unisex","Autumn-Winter","Night","Floral|Woody|Spicy","Floral Notes, Spicy Notes","Fruity Notes, Musk","Musk, Woody Notes",249,["mukhallat_oud8.webp","mukhallat_oud20.webp","mukhallat_oud3.webp"]],
["Mukhallat Rashid","","Unisex","Autumn-Winter","Night","Leathery|Woody|Spicy Floral","Saffron, Clove, Sage","Rose, Geranium, Henna","Oud, Vetiver, Soil Tincture, Patchouli",249,["mukhallat_rashid8.webp","mukhallat_rashid20.webp","mukhallat_rashid3.webp"]],
["Mukhallat Maliky","","Unisex","Autumn-Winter","Night","Woody|Warm Spicy|Amber","Warm Spices, Soft Florals","Oud, Amber, Floral Accords","Musk, Woods, Resinous Warmth",249,["mukhallat_maliky8.webp","mukhallat_maliky20.webp","mukhallat_maliky3.webp"]],
["Musk Tahara","","Unisex","All seasons","Day","Fresh|Musky|Powdery","White Musk","","",99,["musk_tahara8.webp","musk_tahara20.webp","musk_tahara3.webp"]],
["Kuwaiti OUD","","Unisex","Autumn-Winter","Night","Woody|Spicy|Earthy","Rosemary, Cardamom, Ginger","Saffron, Jasmine, Tonka Bean","Amber, Sandalwood, Vanilla, Oud, Patchouli, Musk",149,["kuwaiti_oud8.webp","kuwaiti_oud20.webp","kuwaiti_oud3.webp"]],
["Kuwaiti OUD Premium","","Unisex","Autumn-Winter","Night","Woody|Spicy|Earthy","Rosemary, Cardamom, Ginger","Saffron, Jasmine, Tonka Bean","Amber, Sandalwood, Vanilla, Oud, Patchouli, Musk",279,["kuwaiti_oud_premium8.webp","kuwaiti_oud_premium20.webp","kuwaiti_oud_premium3.webp"]],
["Mysore Sandal","","Unisex","All seasons","Day","Woody|Vanilla|Musky","Sandalwood from Mysore","","",279,["mysore_sandal8.webp","mysore_sandal20.webp","mysore_sandal3.webp"]],
["Seufi OUD","","Unisex","Autumn-Winter","Night","Floral|Woody|Oriental","Mitti","Musk","Agarwood (Indian Oud)",299,["seufi_oud8.webp","seufi_oud20.webp","seufi_oud3.webp"]],
["Indian OUD","","Unisex","Autumn-Winter","Night","Woody|Oriental|Smoky","Agarwood (Indian Oud)","","",599,["indian_oud8.webp","indian_oud20.webp","indian_oud3.webp"]],
["Thailand OUD","","Unisex","Autumn-Winter","Night","Woody|Oriental Spicy|Subtle Sweet","Agarwood (Thailand Oud)","","",599,["thailand_oud8.webp","thailand_oud20.webp","thailand_oud3.webp"]],
["Cambodian OUD","","Unisex","Autumn-Winter","Night","Woody|Oriental|Mossy","Agarwood (Cambodian Oud)","","",599,["cambodian_oud8.webp","cambodian_oud20.webp","cambodian_oud3.webp"]],
["Sandaliya","","Unisex","All seasons","Day","Citrus Spicy|Earthy|Woody","Sandalwood","","",999,["sandaliya8.webp","sandaliya20.webp","sandaliya3.webp"]],
["Dehnal OUD Combodi Qadim","","Unisex","Autumn-Winter","Night","Woody|Honey|Spicy|Elegant","Aged Cambodian Oud","","",999,["dehnal_oud_combodi_qadim8.webp","dehnal_oud_combodi_qadim20.webp","dehnal_oud_combodi_qadim3.webp"]],
["Dahnal OUD Hindi Qadim","","Unisex","Autumn-Winter","Night","Woody|Honey|Spicy","Aged Indian Oud","","",999,["dahnal_oud_hindi_qadim8.webp","dahnal_oud_hindi_qadim20.webp","dahnal_oud_hindi_qadim3.webp"]],
["Fire OUD","","Unisex","Autumn-Winter","Night","Woody|Leather|Aromatic","Geranium, Leather","Cedar, Patchouli","Moss, Musk, Amber",699,["fire_oud8.webp","fire_oud20.webp","fire_oud3.webp"]],
["Fire OUD","","Unisex","Autumn-Winter","Night","Woody|Leather|Aromatic","Geranium, Leather","Cedar, Patchouli","Moss, Musk, Amber",149,["fire_oud8.webp","fire_oud20.webp","fire_oud3.webp"]],
["Ruh Khus","","Unisex","Summer","Day","Fresh|Green Herbal|Earthy","Vetiver (Khus)","","",699,["ruh_khus8.webp","ruh_khus20.webp","ruh_khus3.webp"]],
["Fume Vanille","Tobacco Vanille","Unisex","Autumn-Winter","Night","Oriental|Gourmand|Smoky","Tobacco Leaf, Spicy Notes","Vanilla, Cacao, Tonka Bean, Tobacco Blossom","Dried Fruits, Woody Notes",499,["fume_vanille8.webp","fume_vanille20.webp","fume_vanille3.webp"]],
["Fume Vanille","Tobacco Vanille","Unisex","Autumn-Winter","Night","Oriental|Gourmand|Smoky","Tobacco Leaf, Spicy Notes","Vanilla, Cacao, Tonka Bean, Tobacco Blossom","Dried Fruits, Woody Notes",99,["fume_vanille8.webp","fume_vanille20.webp","fume_vanille3.webp"]],
["Al Dahab","Wisal Dahab","Female","Autumn-Winter","Night","Dark Wood|Sweet|Floral","Pear, Apple, Peach, Grapefruit, Mandarin Orange","Rose, Orchid, Jasmine, Geranium","Sandalwood, Musk, Cedar, Patchouli",129,["al_dahab8.webp","al_dahab20.webp","al_dahab3.webp"]],
["Eternal Elixir","Sauvage Elixir","Male","Autumn-Winter","Night","Woody|Floral|Spicy","Nutmeg, Cinnamon, Cardamom, Grapefruit","Lavender","Licorice, Sandalwood, Amber, Patchouli, Haitian Vetiver",89,["eternal_elixir8.webp","eternal_elixir20.webp","eternal_elixir3.webp"]],
["Rose OUD","OUD And Roses","Unisex","Autumn-Winter","Night","Woody|Oriental|Citrus","Rose","Rose","Agarwood (Oud)",99,["rose_oud8.webp","rose_oud20.webp","rose_oud3.webp"]],
["Mafia Oud","Mafia OUD","Unisex","Autumn-Winter","Night","Woody|Oriental|Smoky","Oud, Musk, Patchouli","Sandalwood, Vetiver, Vanilla","Woody, Smoky, Fruity, Earthy",149,["mafia_oud8.webp","mafia_oud20.webp","mafia_oud3.webp"]],
["Badee Al OUD","Badee Al OUD","Unisex","Autumn-Winter","Night","Woody|Warm Spicy|Fresh Spicy","Saffron, Nutmeg, Lavender","Oud, Patchouli","Oud, Patchouli, Musk",99,["badee_al_oud8.webp","badee_al_oud20.webp","badee_al_oud3.webp"]],
["Arabian Tonka","Arabian Tonka","Unisex","Autumn-Winter","Night","Oriental|Gourmand|Woody","Saffron, Bergamot","Oud, Bulgarian Rose","Tonka Bean, Sugar Cane, Amber, White Musk, Oakmoss",99,["arabian_tonka8.webp","arabian_tonka20.webp","arabian_tonka3.webp"]],
["Musk Rose","Musk Rose","Unisex","All seasons","Day","Floral|Spicy|Musky","Bergamot, Peach, Apple, Pear","Cyclamen, Freesia, Rose","Sandalwood, Cedarwood, Vanilla, Amber, Musk",99,["musk_rose8.webp","musk_rose20.webp","musk_rose3.webp"]],
["Al Lail","Wisal Lail","Female","Autumn-Winter","Night","Fruity|Floral|Woody","Blackcurrant, Apricot, Freesia","Rose, Patchouli, Osmanthus","Musk, Oud, Frankincense",129,["al_lail8.webp","al_lail20.webp","al_lail3.webp"]],
["Rooh Gulab","Rooh Gulab","Unisex","Spring-Summer","Day","Rose Floral","Rose","","",129,["rooh_gulab8.webp","rooh_gulab20.webp","rooh_gulab3.webp"]],
["Tobacco OUD","","Unisex","Autumn-Winter","Night","Woody|Leathery|Tobacco","Whiskey","Spicy Notes, Cinnamon, Coriander","Tobacco, Oud, Incense, Sandalwood, Patchouli, Benzoin, Vanilla, Cedar",129,["tobacco_oud8.webp","tobacco_oud20.webp","tobacco_oud3.webp"]],
["Arabian OUD","","Unisex","Autumn-Winter","Night","Woody|Powdery|Warm Spicy","","","",129,["arabian_oud8.webp","arabian_oud20.webp","arabian_oud3.webp"]],
["Bin Sheikh","AM BIN SHEIKH","Unisex","Autumn-Winter","Night","Amber|Oud|Sweet","Saffron, Rose, Oakmoss, Lavender, Citruses","Sugar, Bakhoor, Jasmine, Orchid, Violet","Oud, Amber, Ambroxan, Patchouli, White Musk",129,["bin_sheikh8.webp","bin_sheikh20.webp","bin_sheikh3.webp"]],
["Silk Oud","MFK Silk OUD","Unisex","Autumn-Winter","Night","Herbal|Woody|Floral","Bulgarian Rose, Chamomile, Bergamot","Guaiac Wood, Hedione","Oud, Papyrus",99,["silk_oud8.webp","silk_oud20.webp","silk_oud3.webp"]],
["Shamama","","Unisex","Autumn-Winter","Night","Woody|Floral|Powdery","Grass, Mint","Floral notes, Honey, Sea notes","Smoke, Sandalwood",249,["shamama8.webp","shamama20.webp","shamama3.webp"]],
["Al Wadi","","Unisex","Autumn-Winter","Night","Woody|Aromatic|Leather","Sicilian Bergamot, Pink Pepper, Davana","Oud, White Amber, Rosemary","Leather, Musk, Haitian Vetiver",129,["al_wadi8.webp","al_wadi20.webp","al_wadi3.webp"]],
["Ombre","","Unisex","All seasons","Night","Leather|Warm spicy|Floral","Cardamom","Leather, Jasmine","Amber, Moss, Patchouli",139,["ombre8.webp","ombre20.webp","ombre3.webp"]],
["Satin OUD","MFK oud Satin Mood","Unisex","Autumn-Winter","Night","Rose|Floral|Oud|Amber|Vanilla|Powdery","Bulgarian Rose, Violet, Strawberry","Turkish Rose","Oud (Agarwood), Vanilla, Amber, Benzoin, Caramel, Cedar",89,["satin_oud8.webp","satin_oud20.webp","satin_oud3.webp"]],
["Afternoon Dive","LV Afternoon Swim","Unisex","Spring-Summer","Day","Fresh|Citrus|Aquatic","Mandarin Orange, Sicilian Orange, Bergamot.","Ginger.","Ambergris.",599,["afternoon_dive8.webp","afternoon_dive20.webp","afternoon_dive3.webp"]],
["Al Wadi","Imperial Valley Gissah","Unisex","Autumn-Winter","Night","Woody|Spicy|Amber","Pink Pepper, Bergamot, Davana.","Leather, White Amber, Rosemary.","Oud, Musk, Vetiver.",599,["al_wadi8.webp","al_wadi20.webp","al_wadi3.webp"]],
["Alpha Blue","YSL Y Le Parfum","Male","Autumn-Winter","Night","Aromatic|Woody|Spicy","Grapefruit, Apple, Ginger.","Lavender, Sage, Geranium.","Tonka Bean, Cedar, Patchouli, Olibanum.",499,["alpha_blue8.webp","alpha_blue20.webp","alpha_blue3.webp"]],
["Azure Tide","Kaaf Ahmed Al Maghribi","Unisex","Spring-Summer","Day","Fresh|Aquatic|Fruity","Watermelon, Red Fruits, Lavender.","Jasmine, Lotus, Marine Notes.","White Musk, Sandalwood, Ambroxan.",499,["azure_tide8.webp","azure_tide20.webp","azure_tide3.webp"]],
["Caramel OUD","Caramel OUD","Unisex","Autumn-Winter","Night","Sweet|Oud|Amber","Caramel, Saffron.","Rose, Amber, Praline.","Oud, Vanilla, Musk.",499,["caramel_oud8.webp","caramel_oud20.webp","caramel_oud3.webp"]],
["Dark Rebel","LV Myriad","Unisex","Autumn-Winter","Night","Oud|Floral|Spicy","Saffron.","Bulgarian Rose, Grasse Rose.","Assam Oud, Cacao, Ambrette, White Musk.",699,["dark_rebel5.webp","dark_rebel3.webp","dark_rebel1.webp"]],
["Ember","","Unisex","All seasons","Day/Night","Fruity|Musky|Woody","mandarin orange, grapefruit, bergamot, apple, blue orchids","jasmine, lily of the valley, white orchid, pineapple","sandalwood, amber, musk, and vanilla",699,["ember.webp"]],
["Golden Aura","Ajmal Aurum","Unisex","Spring-Summer","Day/Night","Fruity|Floral|Sweet","Lemon, Raspberry, Fruity Notes.","Gardenia, Jasmine, Orange Blossom.","Vanilla, Amber, Musk, Woody Notes.",599,["golden_aura8.webp","golden_aura20.webp","golden_aura3.webp"]],
["Intus","Terre D'Hermes","Male","Spring-Autumn","Day","Woody|Citrus|Spicy","Orange, Grapefruit.","Pepper, Geranium.","Vetiver, Cedar, Patchouli, Benzoin.",499,["intus.webp"]],
["Melior","Xerjoff Naxos","Unisex","Autumn-Winter","Night","Sweet|Tobacco|Aromatic","Lavender, Bergamot, Lemon.","Honey, Cinnamon, Cashmeran, Jasmine Sambac.","Tobacco Leaf, Vanilla, Tonka Bean.",599,["melior.webp"]],
["Million","Paco Rabanne 1 Million","Male","Autumn-Winter","Night","Spicy|Citrus|Leather","Blood Mandarin, Grapefruit, Mint.","Cinnamon, Spicy Notes, Rose.","Amber, Leather, Woody Notes, Patchouli.",499,["million8.webp","million20.webp","million3.webp"]],
["Mukhallat","","Unisex","Autumn-Winter","Night","Woody|Amber|Spicy","Bergamot, Cardamom, Cinnamon, Fruity Notes.","Lavender, Tobacco, Rose, Spicy Notes.","Amber, Vanilla, Musk, Sandalwood, Oud.",499,["mukhallat8.webp","mukhallat20.webp","mukhallat3.webp"]],
["Noble","Initio Oud for Greatness","Unisex","Autumn-Winter","Night","Oud|Spicy|Aromatic","Saffron, Nutmeg, Lavender.","Oud.","Patchouli, Musk.",799,["noble.webp"]],
["Ombre","","Unisex","All Seasons","Night","Leather|Smoky|Floral","Cardamom.","Leather, Jasmine Sambac.","Amber, Moss, Patchouli.",499,["ombre.webp"]],
["Pink Vanilla","Kayali Vanilla Candy Rock Sugar","Female","Spring-Autumn","Day/Night","Sweet|Vanilla|Fruity","Candied Pear, Bubble Gum, Vanilla, Violet Leaf.","Caramel, Jasmine, Tonka Bean, Ylang-Ylang, Labdanum.","Rock Sugar, Patchouli, Sandalwood, Cashmere Wood.",499,["pink_vanilla8.webp","pink_vanilla20.webp","pink_vanilla3.webp"]],
["Qahwa","Lattafa Khamrah Qahwa","Unisex","Autumn-Winter","Night","Spicy|Coffee|Sweet","Cinnamon, Cardamom, Ginger.","Praline, Candied Fruits, White Flowers.","Coffee, Vanilla, Tonka Bean, Benzoin, Musk.",499,["qahwa8.webp","qahwa20.webp","qahwa3.webp"]],
["Tao Mist","Diptyque Tam Dao","Unisex","Spring-Autumn","Day/Night","Woody|Aromatic|Powdery","Rose, Myrtle, Italian Cypress.","Sandalwood, Cedar.","Spices, Amber, White Musk, Brazilian Rosewood.",499,["tao_mist8.webp","tao_mist20.webp","tao_mist3.webp"]],
["Urban Icon","Dunhill Icon","Male","Spring-Summer","Day","Fresh|Citrus|Woody","Neroli, Bergamot, Black Pepper, Petitgrain.","Lavender, Cardamom, Juniper Berries, Sage.","Vetiver, Oakmoss, Leather, Oud, Iris.",499,["urban_icon8.webp","urban_icon20.webp","urban_icon3.webp"]],
["Vanaffe","","Female","Autumn-Winter","Night","Sweet|Coffee|Vanilla","Candied Pear, Bubble Gum, Coffee, Vanilla.","Caramel, Jasmine, Tonka Bean, Coffee Blossom.","Rock Sugar, Vanilla, Sandalwood, Patchouli, Musk.",499,["vanaffe8.webp","Vanaffe20.webp","vanaffe3.webp"]],
["White OUD","White Oud","Unisex","Autumn-Winter","Night","Oud|Woody|Musky","Bergamot, Saffron, White Pepper.","Rose, Jasmine, White Woods.","White Oud, Musk, Amber, Sandalwood.",499,["white_oud8.webp","white_oud20.webp","white_oud3.webp"]],
 ["Symphoria","LV Symphony","Unisex","Spring-Summer","Day","Citrus|Fresh|Fruity","Grapefruit, Bergamot, Orange.","Ginger, Fresh Spices.","Amber, Musk.",799,["symphoria.webp"]],
  ["Bakhoor Al Wadi","Al Wadi","Unisex","All Season","Day/Night","Woody|Amber|Smoky","Warm woods","Amber and resins","Soft smoke",450,["bakhoor_al_wadi.webp"],"Bakhoor",[{value:25,unit:"gm",priceMultiplier:1},{value:12.5,unit:"gm",priceMultiplier:0.5555555556}]],
  ["Bakhoor Al Arab","Al Arab","Unisex","All Season","Day/Night","Oriental|Woody|Warm Spicy","Aromatic woods","Spices and resins","Warm amber",300,["bakhoor_al_arab.webp"],"Bakhoor",[{value:25,unit:"gm",priceMultiplier:1},{value:12.5,unit:"gm",priceMultiplier:0.6}]],
  ["Regular Bakhoor Burner","","Unisex","All Season","Day/Night","Bakhoor Accessory","","","",375,["regular_bakhoor_burner.webp"],"Bakhoor",[],499],
  ["Automatic Bakhoor Burner with Timer","","Unisex","All Season","Day/Night","Bakhoor Accessory|Timer","","","",850,["automatic_bakhoor_burner_with_timer.webp"],"Bakhoor",[],1199]
].map(([name, inspiredBy, gender, season, time, accords, top, mid, base, price, comboImages, category, sizeDefinitions, mrp], index) => {

    const imageBase = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const defaultImage = `${imageBase}.webp`;

    const variants = [
        defaultImage,
        `${imageBase}1.webp`,
        `${imageBase}2.webp`,
        `${imageBase}3.webp`,
        `${imageBase}4.webp`,
        `${imageBase}5.webp`,
        defaultImage,
        `${imageBase}7.webp`,
        `${imageBase}100.webp`
    ];

    const explicitSizeImage = size => (comboImages || []).find(image =>
        new RegExp(`${size}(?:\\.[a-z0-9]+)?$`, 'i').test(String(image || ''))
    );
    const comboOverlayImages = {
        // A one-image gallery such as ["ember.webp"] is the product card,
        // not its 8 ml bottle. Use it only when the filename names the size.
        8: explicitSizeImage(8) || `${imageBase}8.webp`,
        20: explicitSizeImage(20) || `${imageBase}20.webp`
    };

    const catalogueItem = Array.isArray(window.__EE_LOCAL_CATALOG__) ? window.__EE_LOCAL_CATALOG__[index] : null;
    const catalogueImages = Array.isArray(catalogueItem?.images) ? catalogueItem.images.filter(Boolean) : [];
    const effectiveCategory = catalogueItem?.category || category || (PERFUME_CATALOG_POSITIONS.has(index + 1) ? 'Perfume' : 'Attar');
    const isFragrance = ['perfume', 'attar'].includes(String(effectiveCategory).toLowerCase());
    const primaryImage = !isFragrance && comboImages?.[0]
        ? comboImages[0]
        : defaultImage;
    const isAttar = String(effectiveCategory).toLowerCase() === 'attar';
    const displayImage = isAttar && catalogueImages[0] ? catalogueImages[0] : primaryImage;
    return {
        id: `frontend_${index + 1}`,
        name,
        type: effectiveCategory,
        inspiredBy,
        gender,
        season,
        time,
        family: accords.split('|')[0],
        accords: accords.split('|'),
        top,
        mid,
        base,
        price,
        mrp,
        sizes: sizeDefinitions || [],
        image: displayImage,
        images: isAttar && catalogueImages.length ? catalogueImages : (!isFragrance ? [primaryImage] : variants),
        comboOverlayImages,
        description: catalogueItem?.description || `${accords.replaceAll('|', ', ')} fragrance inspired by ${inspiredBy}.`
    };
});

function getAttarSeries(price) {
if (price <= 65) return "Essential Series";
if (price <= 100) return "Signature Series";
if (price <= 250) return "Prestige Series";
if (price <= 450) return "Noble Collection";
return "Alcheme Collection";
}
const attars = products.filter(p => p.type === "Attar");
const attarGroups = {};
attars.forEach(p => {
const series = getAttarSeries(p.price);
if (!attarGroups[series]) attarGroups[series] = [];
attarGroups[series].push(p);
});
const attarFacets = {
"By Gender": {
"For Him": attars.filter(p => p.gender === "Male"),
"For Her": attars.filter(p => p.gender === "Female"),
"Unisex": attars.filter(p => p.gender === "Unisex")
},
"By Season": {
"Summer": attars.filter(p => p.season?.includes("Summer")),
"Winter": attars.filter(p => p.season?.includes("Winter")),
"All Season": attars.filter(p => p.season === "All Season")
},
"By Time": {
"Day": attars.filter(p => p.time === "Day"),
"Night": attars.filter(p => p.time === "Night"),
"Day / Night": attars.filter(p => p.time === "Day/Night")
}
};
function getSizesByCategory(category) {
if (category === 'Perfume') {
return [
{ value: 8,   unit: 'ml', priceMultiplier: 0.2985971943887776 }, // 0.12 / 0.12
{ value: 20,  unit: 'ml', priceMultiplier: 0.6993987 }, // 0.32 / 0.12
{ value: 30,  unit: 'ml', priceMultiplier: 1 }, // 0.47 / 0.12
{ value: 50,  unit: 'ml', priceMultiplier: 1.4008 }, // 0.62 / 0.12
{ value: 100, unit: 'ml', priceMultiplier: 2.4028 },  // 1 / 0.12
{ value: 30, unit: 'ml Gift', priceMultiplier: 1.2 },
{ value: 50, unit: 'ml Gift', priceMultiplier: 1.601 },
{ value: 100, unit: 'ml Gift', priceMultiplier: 2.6032 }  // 1 / 0.12
];
}
if (category === 'Attar') {
return [
{ value: 3,  unit: 'ml', priceMultiplier: 1.00 },
{ value: 6,  unit: 'ml', priceMultiplier: 1.85 },
{ value: 8,  unit: 'ml', priceMultiplier: 2.3 },
{ value: 12, unit: 'ml', priceMultiplier: 3.2 },
];
}
return []; // Combo
}
function renderSizeButtons(product) {
const sizeContainer = document.getElementById('size-selector-container');
const sizeButtons = document.getElementById('size-buttons');
sizeButtons.innerHTML = '';
/* ================= FIX: AUTO-GENERATE SIZES ================= */
if (!product.sizes) {
product.sizes = getSizesByCategory(product.type);
}
/* ================= COMBO / NO SIZE ================= */
if (!product.sizes || product.sizes.length === 0) {
sizeContainer.classList.add('hidden');
const pricing = getPricing(product.price,1,product.mrp);
currentPrice = pricing.sellingPrice;
updatePriceDisplay(
pricing.sellingPrice,
pricing.mrp,
pricing.discount
);
selectedSize = 'Set';
return;
}
sizeContainer.classList.remove('hidden');
product.sizes.forEach((s, index) => {
const btn = document.createElement('button');
btn.className =
'size-btn px-3 py-2 border border-gray-300 rounded text-sm hover:border-yellow-400 transition';
btn.textContent = `${s.value}${s.unit}`;
btn.onclick = () => {
selectedSize = `${s.value}${s.unit}`;
const pricing = getPricing(
product.price,
s.priceMultiplier,
product.mrp
);
currentPrice = pricing.sellingPrice;
updatePriceDisplay(
pricing.sellingPrice,
pricing.mrp,
pricing.discount
);
currentImageIndex = getPerfumeVariantIndex(selectedSize);
updateGalleryImage();
document.querySelectorAll('.size-btn').forEach(b =>
b.classList.remove(
'bg-black',
'text-yellow-500',
'border-black'
)
);
btn.classList.add(
'bg-black',
'text-yellow-500',
'border-black'
);
};
sizeButtons.appendChild(btn);
// auto-select last (largest) size
// auto-select FIRST (smallest) size
if (index === 0) {
setTimeout(() => btn.click(), 50);
}
});
}
//DOM content
document.addEventListener('DOMContentLoaded',()=>{try{localStorage.removeItem('openProductId')}catch(e){}});
function resolveMergeImage(img) {
if (!img) return '';
if (img.startsWith('http')) return img;
return `${window.__EE_IMAGE_BASE__ || '/products/'}${String(img).split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp')}`;
}
const PERFUME_VARIANT_INDEX = {
'8ml': 1,
'20ml': 2,
'30ml': 3,
'50ml': 4,
'100ml': 5,
'30mlgift': 6,
'50mlgift': 7,
'100mlgift': 8
};
function normalizeImageUrl(img) {
if (!img) return '';
const value = String(img);
if (value.startsWith('http')) return value;
const clean = value.split('/').pop();
return `${window.__EE_IMAGE_BASE__ || '/products/'}${clean.replace(/\.(png|jpe?g)$/i,'.webp')}`;
}
function getDefaultProductImage(product) {
// Perfumes use the full product artwork; Attars use their concentrated-oil
// bottle asset so an Attar collection never presents perfume packaging.
const category = normalize(product?.type || product?.category);
const image = category === 'attar'
? product?.images?.[0] || product?.comboOverlayImages?.[8] || product?.image
: product?.collectionImage || product?.image || product?.images?.[0];
return normalizeImageUrl(image || `${window.__EE_IMAGE_BASE__ || '/products/'}ee-brand-20260819.webp`);
}
function getPerfumeVariantIndex(sizeLabel) {
if (typeof sizeLabel === 'number') return sizeLabel;
const key = String(sizeLabel || '').toLowerCase().replace(/\s+/g, '');
return PERFUME_VARIANT_INDEX[key] || 0;
}
function getCommonPerfumeImage(index, product = null) {
if (Number(index) === 6) return getDefaultProductImage(product);
return index > 0 ? `common${index}.webp` : '';
}
function derivePerfumeVariantImage(product, index) {
const explicitImage = product?.images?.[index];
if (explicitImage) return explicitImage;
const defaultImage = product?.images?.[0] || product?.image || '';
if (!defaultImage || index === 0 || index === 6) return defaultImage;
const src = String(defaultImage);
if (src.startsWith('http') || src.startsWith('/') || src.includes('?')) return '';
const slashIndex = Math.max(src.lastIndexOf('/'), src.lastIndexOf('\\'));
const folder = slashIndex >= 0 ? src.slice(0, slashIndex + 1) : '';
const filename = slashIndex >= 0 ? src.slice(slashIndex + 1) : src;
const dotIndex = filename.lastIndexOf('.');
if (dotIndex <= 0) return '';
const name = filename.slice(0, dotIndex).replace(/\(\d+\)$/, '');
const ext = filename.slice(dotIndex);
return `${folder}${name}(${index})${ext}`;
}
function getVariantFallbackImage(product, sizeLabel) {
if (!product) return `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`;
const type = product.type || product.category;
if (type !== 'Perfume') return getDefaultProductImage(product);
const index = getPerfumeVariantIndex(sizeLabel);
return normalizeImageUrl(getCommonPerfumeImage(index, product) || getDefaultProductImage(product));
}
function getVariantImage(product, sizeLabel) {
if (!product) return '';
const type = product.type || product.category;
if (type !== 'Perfume') return getDefaultProductImage(product);
const index = getPerfumeVariantIndex(sizeLabel);
return normalizeImageUrl(derivePerfumeVariantImage(product, index) || getVariantFallbackImage(product, index));
}
function escapeImageAttr(value) {
return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function imageWithFallback(src, fallback, finalFallback) {
const finalSrc = escapeImageAttr(finalFallback || `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`);
const fallbackSrc = escapeImageAttr(fallback || finalSrc);
const primarySrc = escapeImageAttr(src || fallback || finalFallback || `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`);
if (primarySrc === fallbackSrc) {
return `src="${primarySrc}" onerror="this.onerror=null;this.src='${finalSrc}'"`;
}
return `src="${primarySrc}" onerror="this.onerror=function(){this.onerror=null;this.src='${finalSrc}'};this.src='${fallbackSrc}'"`;
}
function imageWithFallbacks(sources = []) {
const cleaned = sources.filter(Boolean).map(src => escapeImageAttr(src));
const finalSrc = cleaned[cleaned.length - 1] || `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`;
const queue = cleaned.slice(1);
return `src="${cleaned[0] || finalSrc}" data-fallbacks='${JSON.stringify(queue)}' onerror="const next=JSON.parse(this.dataset.fallbacks||'[]');if(next.length){this.dataset.fallbacks=JSON.stringify(next.slice(1));this.src=next[0];}else{this.onerror=null;this.src='${escapeImageAttr(finalSrc)}';}"`;
}
function deriveTransparentBottleImages(product, sizeMl) {
const index = Number(sizeMl) === 20 ? 2 : 1;
const sizeSuffix = Number(sizeMl) === 20 ? '20' : '8';
const base = product?.images?.[0] || product?.image || '';
if (!base) return [];
const src = String(base);
if (src.startsWith('http') || src.includes('?')) return [];
const slashIndex = Math.max(src.lastIndexOf('/'), src.lastIndexOf('\\'));
const folder = slashIndex >= 0 ? src.slice(0, slashIndex + 1) : '';
const filename = slashIndex >= 0 ? src.slice(slashIndex + 1) : src;
const dotIndex = filename.lastIndexOf('.');
if (dotIndex <= 0) return [];
const name = filename.slice(0, dotIndex).replace(/\(\d+\)$/, '');
return [
`${folder}${name}${sizeSuffix}.webp`,
`${folder}${name}(${index}).webp`
];
}
function deriveTransparentBottleImage(product, sizeMl) {
return deriveTransparentBottleImages(product, sizeMl)[0] || '';
}
function normalizeBundleAsset(src) {
if (!src) return '';
const value = String(src);
if (/^(https?:|data:|\/)/i.test(value)) return value;
return `${window.__EE_IMAGE_BASE__ || '/products/'}${value.split('/').pop()}`;
}
function getCommonBundleBottleImage(sizeMl) {
return normalizeBundleAsset(Number(sizeMl) === 20 ? 'common20.webp' : 'common8.webp');
}
function getBundleBottleImage(product, sizeMl) {
if (product?.bottleImage) return normalizeBundleAsset(product.bottleImage);
return normalizeBundleAsset(deriveTransparentBottleImage(product, sizeMl)) || getCommonBundleBottleImage(sizeMl);
}
function getBundleBottleImageCandidates(product, sizeMl) {
const explicit = product?.bottleImage ? [normalizeBundleAsset(product.bottleImage)] : [];
const catalogueSizeImage = product?.comboOverlayImages?.[Number(sizeMl)];
return [
...explicit,
normalizeBundleAsset(catalogueSizeImage),
...deriveTransparentBottleImages(product, sizeMl).map(normalizeBundleAsset),
getCommonBundleBottleImage(sizeMl),
// The product thumbnail is deliberately last: it is a safe fallback, never
// the first choice for the transparent bottle preview.
getDefaultProductImage(product)
];
}
function getBundleBoxImage(sizeMl) {
return Number(sizeMl) === 20 ? 'setbox20.webp' : 'setbox8.webp';
}
const TRANSPARENT_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
function expandBundleProducts(selectedProducts = []) {
const expanded = [];
selectedProducts.forEach(({ product, qty }) => {
for (let i = 0; i < Number(qty || 0); i += 1) expanded.push(product);
});
return expanded;
}
function renderCustomSetVisual(selectedProducts = [], sizeMl = 8, compact = false) {
const products = expandBundleProducts(selectedProducts).slice(0, Number(bundleState?.setQty || selectedProducts.length || 6));
const count = Math.max(products.length, 1);
const width = Math.min(18, Math.max(12, 78 / Math.max(count, 4)));
const step = count > 1 ? (78 - width) / (count - 1) : 0;
const boxImage = getBundleBoxImage(sizeMl);
const bottles = products.map((product, index) => {
const left = count === 1 ? 41 : 10 + (step * index);
return `<img ${imageWithFallbacks(getBundleBottleImageCandidates(product, sizeMl))} alt="${product.name || 'Selected perfume'}" class="custom-set-bottle" style="left:${left}%; width:${width}%;">`;
}).join('');
return `
<div class="custom-set-visual ${compact ? 'compact' : ''}">
<img ${imageWithFallback(boxImage, TRANSPARENT_IMAGE, TRANSPARENT_IMAGE)} alt="Custom perfume set box" class="custom-set-box-img">
${bottles}
</div>
`;
}
const CARD_ASSET_BASE = `${window.__EE_CARD_BASE__ || '/card/'}`;
const CARD_PRODUCT_PROFILES = {
attar_2ml: {
img: 'card2a.webp',
label: '2 ml Attar Card',
price: 40,
width: '17mm',
height: '45mm'
},
attar_3ml: {
img: 'card3a.webp',
label: '3 ml Attar Card',
price: 55,
width: '17mm',
height: '55mm'
},
perfume_8ml: {
img: 'card8p.webp',
label: '8 ml Perfume Card',
price: 120,
width: '20mm',
height: '90mm'
}
};
function getPerfumeCardDiscount(qty) {
qty = Number(qty) || 0;
if (qty >= 500) return 0.40;
if (qty >= 200) return 0.30;
if (qty >= 100) return 0.25;
if (qty > 50)   return 0.10;
return 0;
}
const CARD_OCCASION_LABELS = {
nikah_mubarak: 'Nikah Mubarak',
nikah_ceremony: 'Nikah Ceremony',
wedding: 'Wedding Celebration',
mehndi: 'Mehndi Ceremony',
birthday: 'Birthday Invitation'
};
function cardAsset(file) {
return `${CARD_ASSET_BASE}${file}`;
}
function getPerfumeCardMetaFromForm() {
const occasion =
document.getElementById('card-occasion')?.value || 'wedding';
const productType =
document.getElementById('card-product-type')?.value || 'attar_3ml';
const qty = Math.max(
10,
Number(document.getElementById('card-qty')?.value || 10)
);
const profile =
CARD_PRODUCT_PROFILES[productType] ||
CARD_PRODUCT_PROFILES.attar_3ml;
const rawTotal = profile.price * qty;
const discountRate = getPerfumeCardDiscount(qty);
const discountAmount = Math.round(rawTotal * discountRate);
const total = rawTotal - discountAmount;
const effectiveUnitPrice = total / qty;
return {
occasion,
occasionLabel:
CARD_OCCASION_LABELS[occasion] || occasion,
design:
document.getElementById('card-design')?.value ||
`${occasion}_bg1`,
productType,
productLabel: profile.label,
productImage: profile.img,
mehndiStyle:
document.getElementById('card-mehndi-style')?.value || 'hindi',
brideName:
document.getElementById('card-bride-name')?.value || '',
groomName:
document.getElementById('card-groom-name')?.value || '',
personName:
document.getElementById('card-person-name')?.value || '',
age:
document.getElementById('card-age')?.value || '',
eventDate:
document.getElementById('card-event-date')?.value || '',
location:
document.getElementById('card-location')?.value || '',
message:
document.getElementById('card-message')?.value || '',
qty,
unitPrice: profile.price,
rawTotal,
discountRate,
discountPercent: Math.round(discountRate * 100),
discountAmount,
effectiveUnitPrice,
total
};
}
function renderPerfumeCardVisual(meta, compact = false) {
if (compact) return renderPerfumeCardCombinedVisual(meta, true);
return renderPerfumeCardTypographyVisual(meta);
}
function getPerfumeCardDisplay(meta) {
const occasion = meta.occasion || 'wedding';
const titleMap = {
nikah_mubarak: 'Nikah Mubarak',
nikah_ceremony: 'Nikah',
wedding: 'Wedding',
mehndi: '',
birthday: 'Happy Birthday'
};
const subtitleMap = {
nikah_mubarak: 'With Blessings',
nikah_ceremony: 'Ceremony',
wedding: 'Celebration',
mehndi: 'Mehndi',
birthday: meta.age ? `${meta.age} Celebration` : 'Invitation'
};
const mehndiName = (meta.mehndiStyle || 'hindi') === 'english'
? `${meta.brideName || 'Bride'}'s`
: `${meta.brideName || 'Bride'} Ki`;
const names = occasion === 'birthday'
? `${meta.personName || 'Name'}`
: occasion === 'mehndi'
? mehndiName
: `${meta.brideName || 'Bride'} & ${meta.groomName || 'Groom'}`;
const title = Object.prototype.hasOwnProperty.call(titleMap, occasion) ? titleMap[occasion] : (meta.occasionLabel || '');
return { title, subtitle: subtitleMap[occasion] || '', names };
}
function renderPerfumeCardProductFrame(profile) {
return `
<div class="perfume-card-product-frame" style="width:${profile.width}; height:${profile.height};">
<img ${imageWithFallback(cardAsset(profile.img), '', '')} class="perfume-card-product" alt="${profile.label}">
<span class="perfume-card-product-label">${profile.label}</span>
</div>
`;
}
function renderPerfumeCardBrandFooter() {
return `
<div class="perfume-card-footer-brand">
<span>Crafted With Love by</span>
<img src="/products/ee-brand-20260819.webp" alt="Eternal Essence" onerror="this.onerror=null;this.src='/products/ee.webp';">
</div>
`;
}
function renderPerfumeCardTemplateVisual(meta) {
return `
<div class="perfume-card-preview">
<img src="${cardAsset(meta.design + '.webp')}" class="perfume-card-bg" onerror="this.style.display='none'">
</div>
`;
}
function renderPerfumeCardTypographyVisual(meta) {
const profile = CARD_PRODUCT_PROFILES[meta.productType] || CARD_PRODUCT_PROFILES.attar_3ml;
const display = getPerfumeCardDisplay(meta);
const eventDate = meta.eventDate ? new Date(meta.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
return `
<div class="perfume-card-preview">
<div class="perfume-card-content card-font-mont">
<div class="card-font-cinzel text-yellow-700 text-xl font-bold uppercase tracking-[0.18em]">${display.title}</div>
<div class="card-font-vibes text-yellow-700 text-4xl mt-2">${display.subtitle}</div>
<div class="card-font-cinzel text-gray-900 text-lg font-bold mt-5 leading-tight">${display.names}</div>
<div class="text-[10px] uppercase tracking-[0.24em] text-gray-500 mt-4">${eventDate}</div>
<div class="text-[10px] text-gray-500 mt-1">${meta.location || ''}</div>
<p class="text-[10px] text-gray-700 mt-4 leading-relaxed max-w-[80%]">${meta.message || ''}</p>
</div>
${renderPerfumeCardProductFrame(profile)}
${renderPerfumeCardBrandFooter()}
</div>
`;
}
function renderPerfumeCardCombinedVisual(meta, compact = false) {
const profile = CARD_PRODUCT_PROFILES[meta.productType] || CARD_PRODUCT_PROFILES.attar_3ml;
const display = getPerfumeCardDisplay(meta);
return `
<div class="perfume-card-preview ${compact ? 'compact' : ''}">
<img src="${cardAsset(meta.design + '.webp')}" class="perfume-card-bg" onerror="this.style.display='none'">
<div class="perfume-card-content">
<div class="card-font-cinzel text-yellow-700 ${compact ? 'text-[7px]' : 'text-xl'} font-bold uppercase">${display.title}</div>
<div class="card-font-vibes ${compact ? 'text-[12px]' : 'text-4xl'} text-yellow-700 mt-1">${display.subtitle}</div>
<div class="card-font-cinzel ${compact ? 'text-[7px]' : 'text-lg'} font-bold mt-2">${display.names}</div>
</div>
${renderPerfumeCardProductFrame(profile)}
${renderPerfumeCardBrandFooter()}
</div>
`;
}
function handlePerfumeCardOccasion() {
const occasion = document.getElementById('card-occasion')?.value || 'wedding';
const designSelect = document.getElementById('card-design');
if (!designSelect) return;
designSelect.innerHTML = Array.from({ length: 6 }, (_, i) => {
const value = `${occasion}_bg${i + 1}`;
return `<option value="${value}">Option ${i + 1}</option>`;
}).join('');
document.getElementById('card-couple-fields')?.classList.toggle('hidden', occasion === 'birthday');
document.getElementById('card-birthday-fields')?.classList.toggle('hidden', occasion !== 'birthday');
document.getElementById('card-groom-name')?.classList.toggle('hidden', occasion === 'mehndi');
document.getElementById('card-mehndi-options')?.classList.toggle('hidden', occasion !== 'mehndi');
updatePerfumeCardPreview();
}
function updatePerfumeCardPreview() {
const templateBox = document.getElementById('perfume-card-template-preview');
const typographyBox = document.getElementById('perfume-card-typography-preview');
if (!templateBox || !typographyBox) return;
const meta = getPerfumeCardMetaFromForm();
templateBox.innerHTML = renderPerfumeCardTemplateVisual(meta);
typographyBox.innerHTML = renderPerfumeCardTypographyVisual(meta);
const price = document.getElementById('card-price');
if (price) {
price.textContent = `₹${meta.total.toLocaleString('en-IN')}`;
}
const discountInfo = document.getElementById('card-discount-info');
if (discountInfo) {
if (meta.discountPercent > 0) {
discountInfo.textContent =
`${meta.discountPercent}% bulk discount • ` +
`You save ₹${meta.discountAmount.toLocaleString('en-IN')}`;
discountInfo.classList.remove('hidden');
} else {
discountInfo.textContent = '';
discountInfo.classList.add('hidden');
}
}
}
function addPerfumeCardToCart() {
const qtyInput = document.getElementById('card-qty');
const enteredQty = Number(qtyInput?.value || 0);
if (enteredQty < 10) {
alert('Minimum order quantity for perfume cards is 10.');
if (qtyInput) {
qtyInput.value = 10;
}
updatePerfumeCardPreview();
return;
}
const meta = getPerfumeCardMetaFromForm();
const cartItem = {
id: `perfume_card_${Date.now()}`,
itemType: 'perfume_card',
name: `${meta.occasionLabel} - ${meta.productLabel}`,
selectedSize: meta.productLabel,
finalPrice: meta.total,
image: cardAsset(meta.design + '.webp'),
imageFallback: cardAsset(meta.productImage),
cardMeta: meta
};
if (editingCartIndex !== null && cart[editingCartIndex]) {
cart[editingCartIndex] = { ...cart[editingCartIndex], ...cartItem, id: cart[editingCartIndex].id };
editingCartIndex = null;
} else {
cart.push(cartItem);
}
updateCartCount();
saveCartToStorage();
renderCart();
showToast(`${meta.qty} perfume cards ${editingCartIndex === null ? 'saved' : 'added to cart'} for ₹${meta.total.toLocaleString('en-IN')}.`);
switchPage('cart');
}
let backendProducts = [];
let allProducts = [];
let activeCategory = 'all';
let bundleRules = [];
function getCustomSetProducts() {
return allProducts.filter(product =>
String(product.type || '').trim().toLowerCase() === 'perfume'
);
}
const CUSTOM_SET_PRODUCT_OVERRIDES = {
};
const BUNDLE_PREFERENCES = [
{ key: 'fresh', label: 'Fresh', terms: ['fresh', 'aquatic', 'marine', 'citrus', 'bergamot', 'lemon', 'mint'] },
{ key: 'vanilla', label: 'Vanilla', terms: ['vanilla', 'tonka', 'creamy'] },
{ key: 'floral', label: 'Floral', terms: ['floral', 'rose', 'jasmine', 'peony', 'ylang', 'flower'] },
{ key: 'oud', label: 'Oriental / Oud', terms: ['oud', 'agarwood', 'oriental', 'amber', 'woody'] },
{ key: 'gourmand', label: 'Sweet Gourmand', terms: ['sweet', 'gourmand', 'chocolate', 'toffee', 'cacao', 'honey', 'almond'] },
{ key: 'spicy', label: 'Spicy', terms: ['spicy', 'pepper', 'saffron', 'cardamom', 'cinnamon', 'nutmeg'] },
{ key: 'musk', label: 'Musk', terms: ['musk', 'powdery', 'clean'] }
];
const DEFAULT_BUNDLE_RULES = [
{ sizeMl: 8, setQty: 4, label: '4 x 8 ml Discovery Set', discountType: 'percentage', discountValue: 10, freeGiftEnabled: false, isActive: true },
{ sizeMl: 8, setQty: 6, label: '6 x 8 ml Discovery Set', discountType: 'percentage', discountValue: 15, freeGiftEnabled: true, freeGiftName: 'Surprise Perfume', freeGiftSize: '8 ml', isActive: true },
{ sizeMl: 20, setQty: 2, label: '2 x 20 ml Travel Set', discountType: 'percentage', discountValue: 10, freeGiftEnabled: false, isActive: true },
{ sizeMl: 20, setQty: 4, label: '4 x 20 ml Gift Set', discountType: 'percentage', discountValue: 20, freeGiftEnabled: false, isActive: true }
];
let bundleState = { sizeMl: 8, setQty: 4, selections: {}, preference: '' };
async function loadBackendProducts() {
try {
const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/products`);
const text = await res.text();
if (text.startsWith('<')) {
console.warn('Backend returned HTML instead of JSON');
mergeProducts();
return;
}
const data = JSON.parse(text);
if (!data.success || !Array.isArray(data.products)) {
mergeProducts();
return;
}
function normalizeCategory(cat) {
if (!cat) return 'Perfume';
const label = String(cat).trim();
const key = label.toLowerCase().replace(/\s+/g, '');
return ({perfume:'Perfume',attar:'Attar',solidperfume:'Solid Perfume',combo:'Combo'})[key] || label;
}
backendProducts = data.products.slice().sort((a,b) => Number(a.catalogOrder ?? 999999) - Number(b.catalogOrder ?? 999999)).map(p => ({
id: 'db_' + p._id,
catalogOrder: Number(p.catalogOrder),
name: p.name,
type: normalizeCategory(p.category),
inspiredBy: p.inspiredBy || '',
gender: p.gender || 'Unisex',
description: p.description || '',
season: p.season || 'All Season',
time: p.time || 'Day/Night',
family: p.family || '',
accords: p.accords || [],
top: p.notes?.top || '',
mid: p.notes?.mid || '',
base: p.notes?.base || '',
price: p.price,
mrp: p.mrp,
sizes: Array.isArray(p.sizes) ? p.sizes : [],
image: resolveMergeImage(p.images?.[6] || p.images?.[0]),
images: (p.images || []).map(resolveMergeImage),
source: 'backend'
}));
mergeProducts();
} catch (err) {
console.warn('Backend catalogue is unavailable; using the bundled local catalogue.', err?.message || err);
mergeProducts();
}
}
function mergeProducts() {
const frontendProducts = products.map(p => ({ ...p, source: 'frontend' }));
const matchedFrontendIds = new Set();
const correctedAsset = value => {
const source = String(value || '');
const filename = source.split('/').pop().toLowerCase();
const corrected = {
'dark rebel.webp': 'dark_rebel.webp',
'blue_oud.webp': 'blueoud.webp',
'fire_oud.webp': 'fire oud.webp',
'eternal_white.webp': 'eternal white.webp',
'placeholder.webp': 'ee-brand-20260819.webp'
}[filename];
return corrected ? source.replace(/[^/\\]+$/, corrected) : source;
};
const mergedBackendProducts = backendProducts.map(serverProduct => {
const order = Number(serverProduct.catalogOrder);
const serverName = normalize(serverProduct.name);
const orderCandidate = Number.isInteger(order) && order >= 0 && order < frontendProducts.length
? frontendProducts[order]
: null;
const nameCandidates = frontendProducts.filter(product => normalize(product.name) === serverName);
// catalogOrder is the primary identity. Category and price disambiguate the
// handful of perfume/attar products that intentionally share a name.
const canonical = (orderCandidate && normalize(orderCandidate.name) === serverName ? orderCandidate : null)
|| nameCandidates.find(product => normalize(product.type) === normalize(serverProduct.type) && Number(product.price) === Number(serverProduct.price))
|| nameCandidates.find(product => Number(product.price) === Number(serverProduct.price))
|| nameCandidates.find(product => normalize(product.type) === normalize(serverProduct.type))
|| nameCandidates[0]
|| orderCandidate;
if (!canonical) return serverProduct;
matchedFrontendIds.add(canonical.id);
return {
...canonical,
...serverProduct,
// Keep live database metadata while protecting the canonical category from
// the older import that marked every item as Perfume. Correct the three known
// stale primary filenames without discarding Admin-managed image galleries.
// The canonical image is the same full-pack artwork used on the product page;
// backend gallery order is intentionally retained for size selection.
type: canonical.type,
image: correctedAsset(canonical.image || serverProduct.image),
images: (serverProduct.images || []).map(correctedAsset),
source: 'backend'
};
});
// A deployed database may lag behind the array/current-catalog source. Keep
// array-defined products visible immediately and avoid duplicating rows once
// the database has been synchronized.
const frontendOnly = frontendProducts.filter(product => !matchedFrontendIds.has(product.id));
allProducts = backendProducts.length ? [...mergedBackendProducts, ...frontendOnly] : frontendProducts;
renderCategoryTabs();
renderProducts(allProducts);
renderBundleBuilder();
buildCollectionMenus();
}
function categoryLabel(category){
return String(category || 'Product').trim() || 'Product';
}
function categoryList(){
const seen = new Set(), result = [];
['Perfume','Attar'].forEach(category => { seen.add(normalize(category)); result.push(category); });
allProducts.forEach(product => {
const category = categoryLabel(product.type || product.category);
const key = normalize(category);
if (!key || key === 'combo' || seen.has(key)) return;
seen.add(key); result.push(category);
});
return result;
}
function renderCategoryTabs(){
const host = document.querySelector('#filter-bar .cat-btn')?.parentElement;
if (!host) return;
const current = normalize(activeCategory);
host.innerHTML = '';
const all = document.createElement('button');
all.className = 'cat-btn'; all.dataset.cat = 'all'; all.textContent = 'All';
all.onclick = () => setCategory('all'); host.appendChild(all);
categoryList().forEach(category => {
const button = document.createElement('button');
button.className = 'cat-btn'; button.dataset.cat = category; button.textContent = category;
button.onclick = () => setCategory(category); host.appendChild(button);
});
const selected = [...host.querySelectorAll('.cat-btn')].find(button => normalize(button.dataset.cat) === current) || all;
selected.classList.add('active');
}
function renderDynamicCategoryLinks(){
const extras = categoryList().filter(category => !['perfume','attar'].includes(normalize(category)));
['collectionMenu','mobile-menu'].forEach(id => {
const menu = document.getElementById(id);
if (!menu) return;
let box = menu.querySelector('[data-ee-extra-categories]');
if (!box) { box = document.createElement('div'); box.dataset.eeExtraCategories = '1'; menu.appendChild(box); }
if (id === 'mobile-menu') {
const giftHeading = [...menu.children].find(child => normalize(child.textContent) === 'giftoptions');
if (giftHeading) menu.insertBefore(box, giftHeading);
}
const itemClass = id === 'mobile-menu'
? 'block w-full py-2 text-left text-yellow-500 hover:text-yellow-300 cursor-pointer'
: 'px-5 py-3 hover:bg-yellow-500 hover:text-black cursor-pointer';
box.innerHTML = extras.map(category => `<button type="button" class="${itemClass}" data-ee-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
box.querySelectorAll('[data-ee-category]').forEach(item => item.onclick = event => { event.stopPropagation(); window.goToCategory?.(item.dataset.eeCategory); closeMenus(); });
box.classList.toggle('hidden', !extras.length);
});
}
function placeProductFilters() {
const filterBar = document.getElementById('filter-bar');
const grid = document.getElementById('product-grid');
if (filterBar && grid && filterBar.parentElement !== grid.parentElement) grid.parentElement.insertBefore(filterBar, grid);
}
function openFloatingFilters() {
const filterBar = document.getElementById('filter-bar');
if (!filterBar) return;
placeProductFilters();
filterBar.classList.add('ring-2', 'ring-yellow-400', 'rounded-xl', 'shadow-lg');
filterBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
setTimeout(() => filterBar.classList.remove('ring-2', 'ring-yellow-400', 'rounded-xl', 'shadow-lg'), 1600);
}
const cart = [];
let discountAmount = 0;
let appliedCoupon = null;
const COD_CHARGE = 19;
let editingCartIndex = null;
let editingCartRowIndex = null;
let ordersRenderSeq = 0;
let currentProduct = null;
let selectedSize = 100;
let currentPrice = 0;
let currentImageIndex = 0;
let currentGallery = [];
let pendingCartQty = 1;
let authToken = localStorage.getItem("token");
let currentUser = null;
(function patchFetchForAuth() {
const _orig = window.fetch.bind(window);
window.fetch = async function(input, init = {}) {
try {
init.headers = init.headers || {};
if (authToken && !init.headers.Authorization && !init.headers.authorization) {
init.headers['Authorization'] = `Bearer ${authToken}`;
}
const res = await _orig(input, init);
if (res && res.status === 401) {
clearAuth();
try { if (!document.hidden) alert('Session expired or unauthorized. You have been logged out.'); } catch(e){}
}
return res;
} catch (err) {
throw err;
}
};
})();
function saveCartToStorage() {
try {
localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
localStorage.setItem(CART_DISCOUNT_KEY, JSON.stringify(discountAmount));
localStorage.setItem(CART_COUPON_KEY, appliedCoupon || '');
} catch (e) { console.warn('saveCart err', e); }
}
function loadCartFromStorage() {
try {
const raw = localStorage.getItem(CART_STORAGE_KEY);
if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) { cart.length = 0; parsed.forEach(i=>cart.push(i)); } }
const d = localStorage.getItem(CART_DISCOUNT_KEY); if (d) discountAmount = Number(JSON.parse(d))||0;
const c = localStorage.getItem(CART_COUPON_KEY); if (c) appliedCoupon = c || null;
} catch (e) { console.warn('loadCart err', e); }
updateCartCount();
}
function saveAuthToStorage() {
try {
if (authToken && currentUser) {
localStorage.setItem(AUTH_TOKEN_KEY, authToken);
localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
} else {
localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);
}
} catch (e) { console.warn('saveAuth err', e); }
}
function loadAuthFromStorage() {
try {
const t = localStorage.getItem(AUTH_TOKEN_KEY);
const u = localStorage.getItem(AUTH_USER_KEY);
if (t && u) { authToken = t; currentUser = JSON.parse(u); } else { authToken = null; currentUser = null; }
} catch (e) { console.warn('loadAuth err', e); authToken = null; currentUser = null; }
updateAuthUI();
}
function clearAuth() { authToken = null; currentUser = null; saveAuthToStorage(); updateAuthUI(); }
function updateAuthUI() {
const welcome = document.getElementById('account-welcome');
const welcomeEmail = document.getElementById('welcome-email');
const navUserIcon = document.getElementById('nav-user-icon');
const checkoutEmail = document.getElementById('checkout-email');
const savedAddressBtn = document.getElementById('use-saved-address-btn');
const signupCard = document.getElementById('signup-card');
const loginCard = document.getElementById('login-card');
const navAccountLink = document.getElementById('nav-account-link');
const navAccountLinks = [...new Set([navAccountLink, ...document.querySelectorAll('a[href="#account"]')].filter(Boolean))];
if (currentUser && authToken) {
if (welcome) { welcome.classList.remove('hidden'); if (welcomeEmail) welcomeEmail.textContent = currentUser.email || ''; }
if (navUserIcon) { navUserIcon.classList.remove('text-gray-300'); navUserIcon.classList.add('text-yellow-400'); }
if (checkoutEmail) { checkoutEmail.value = currentUser.email || ''; checkoutEmail.readOnly = true; }
renderSavedAddressControls();
if (signupCard) signupCard.classList.add('hidden');
if (loginCard) loginCard.classList.add('hidden');
navAccountLinks.forEach(link => {
link.textContent = 'Profile';
link.onclick = event => { event.preventDefault(); switchPage('profile'); closeMenus(); };
});
populateProfile();
} else {
if (welcome) welcome.classList.add('hidden');
if (navUserIcon) { navUserIcon.classList.add('text-gray-300'); navUserIcon.classList.remove('text-yellow-400'); }
if (checkoutEmail) { checkoutEmail.readOnly = false; }
if (savedAddressBtn) savedAddressBtn.classList.add('hidden');
if (signupCard) signupCard.classList.remove('hidden');
if (loginCard) loginCard.classList.remove('hidden');
navAccountLinks.forEach(link => {
link.textContent = 'Account';
link.onclick = event => { event.preventDefault(); switchPage('account'); closeMenus(); };
});
}
}
function switchPage(pageId) {
if (pageId === 'profile' && (!currentUser || !authToken)) pageId = 'account';
if (pageId === 'account' && currentUser && authToken) pageId = 'profile';
document.body.style.overflow = "auto";
['home','custom-set','perfume-card','about','contact','cart','orders','account','profile'].forEach(id => {
const el = document.getElementById('page-'+id);
if (el) el.classList.add('hidden');
});
const pageEl = document.getElementById('page-'+pageId);
if (pageEl) pageEl.classList.remove('hidden');
updateActiveNav(pageId);
window.scrollTo(0,0);
if (pageId === 'cart') { renderSavedAddressControls(); renderCart(); }
if (pageId === 'orders') renderOrders();
if (pageId === 'profile') populateProfile();
if (pageId === 'custom-set') renderBundleBuilder();
if (pageId === 'perfume-card') handlePerfumeCardOccasion();
if (pageId === "profile") {
if (!wishlistReady) {
fetchWishlist().then(renderWishlist);
} else {
renderWishlist();
}
}
}
const _originalSwitchPage = window.switchPage || switchPage;
window.switchPage = function(pageId){
_originalSwitchPage(pageId);
if (pageId === 'orders') { startOrdersPoller(); }
else { stopOrdersPoller(); }
};
function getProductImage(product) {
if (product.images && product.images.length > 0) {
return `${window.__EE_IMAGE_BASE__ || '/products/'}${product.images[0]}`;
}
if (product.image) {
return product.image.startsWith('http')
? product.image
: product.image;
}
return `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`;
}
function renderProducts(list = allProducts) {
const grid = document.getElementById('product-grid');
grid.innerHTML = '';
list = list.filter(product => normalize(product.type || product.category) !== 'combo');
if (!list.length) {
grid.innerHTML = `
<p class="col-span-full text-center text-gray-500">
No products found.
</p>`;
return;
}
list.forEach(product => {
const pricing = getPricing(product.price, 1, product.mrp);
const imageUrl = getDefaultProductImage(product);
const imageFallbacks = [
imageUrl,
normalizeImageUrl(product.comboOverlayImages?.[8]),
normalizeImageUrl(product.images?.[2]),
normalizeImageUrl(product.images?.[1]),
normalizeImageUrl(product.images?.[7]),
normalizeImageUrl(product.images?.[0]),
`${window.__EE_IMAGE_BASE__ || '/products/'}ee-brand-20260819.webp`
];
const genderClass = (product.gender || 'Unisex').replace(/[^a-zA-Z]/g, '');
const timeClass   = (product.time || '').replace(/[^a-zA-Z]/g, '');
const seasonClass = (product.season || '').replace(/[^a-zA-Z]/g, '');
const typeClass   = (product.type || product.category || '')
.replace(/[^a-zA-Z]/g, '');
const card = document.createElement('div');
card.className = 'product-card bg-white relative group cursor-pointer';
card.onclick = () => openModal(product);
card.innerHTML = `
<div class="product-image-wrap relative aspect-[4/5] overflow-hidden">
<img
${imageWithFallbacks(imageFallbacks)}
alt="${product.name}"
class="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
loading="lazy"
/>
</div>
<div class="product-details">
<div class="product-card-copy">
${product.family ? `<p class="product-family">${product.family}</p>` : ''}
<h3 class="brand-font">${product.name}</h3>
<p class="product-description">${product.description || ''}</p>
</div>
<div class="product-card-meta" aria-label="Fragrance details">
<span class="badge gender ${genderClass}">${product.gender || 'Unisex'}</span>
${product.time ? `<span class="badge time ${timeClass}">${product.time}</span>` : ''}
${product.season ? `<span class="badge season ${seasonClass}">${product.season}</span>` : ''}
<span class="badge category ${typeClass}">${product.type || product.category}</span>
</div>
<div class="product-price-row">
<del>₹${pricing.mrp.toLocaleString("en-IN")}</del>
<strong>₹${pricing.sellingPrice.toLocaleString("en-IN")}</strong>
<span>${pricing.discount}% OFF</span>
</div>
</div>
`;
grid.appendChild(card);
});
}
function resolveImage(img) {
if (!img) return '';
if (img.startsWith('http')) return img;
return `${window.__EE_IMAGE_BASE__ || '/products/'}${String(img).split('/').pop().replace(/\.(png|jpe?g)$/i,'.webp')}`;
}
function updateActiveNav(page) {
document.querySelectorAll('.nav-item').forEach(item => {
item.classList.remove('active');
});
document.querySelectorAll('.nav-item').forEach(item => {
if (
item.getAttribute('href') === `#${page}`
) {
item.classList.add('active');
}
});
}
function filterProducts(criteria, evt) {
document.querySelectorAll('.filter-btn').forEach(btn => { btn.classList.remove('bg-black','text-yellow-500'); btn.classList.add('text-gray-600'); });
if (evt && evt.currentTarget) {
evt.currentTarget.classList.remove('text-gray-600');
evt.currentTarget.classList.add('bg-black','text-yellow-500');
}
renderProducts(criteria);
}
function openModal(product){
if (!product) return;
const pid = String(product.id || product._id || '').replace(/^db_/,'');
if (window.eeNavigateToProduct) { window.eeNavigateToProduct(product); return; }
}
function updateWishlistIcon(productId) {
const icon = document.getElementById("wishlist-icon");
if (!icon) return;
const pid = Number(productId);
if (wishlistIds.some(item => String(item.productId) === String(pid) && String(item.size || '') === `${selectedSize} ml`)) {
icon.className = "fas fa-heart text-red-500";
} else {
icon.className = "far fa-heart";
}
}
function syncWishlistHeart(productId = null) {
const icon = document.getElementById('wishlist-icon');
if (!icon) return;
const pid = String(
productId ||
currentProduct?.id ||
currentProduct?._id ||
''
);
const size = normalizeWishlistSize(selectedSize);
const isSaved = isWishlistItemSaved(pid, size);
if (isSaved) {
icon.classList.remove('far');
icon.classList.add('fas', 'text-red-500');
} else {
icon.classList.remove('fas', 'text-red-500');
icon.classList.add('far');
}
}
function openWishlistProduct(productId, savedSize, savedName = '') {
const product = allProducts.find(item => savedName && normalize(item.name) === normalize(savedName)) || findProductByAnyId(productId);
if (!product) {
showToast('This saved fragrance is no longer available.', 'error');
return;
}
const normalizedSavedSize = normalizeWishlistSize(savedSize);
if (window.eeNavigateToProduct) {
window.eeNavigateToProduct(product, { size: normalizedSavedSize, name: product.name });
return;
}
openModal(product);
setTimeout(() => {
const sizeButtons = document.querySelectorAll(
'#size-buttons .size-btn'
);
let matchedButton = null;
sizeButtons.forEach(btn => {
const buttonSize = normalizeWishlistSize(btn.textContent);
if (buttonSize === normalizedSavedSize) {
matchedButton = btn;
}
});
if (matchedButton) {
matchedButton.click();
} else {
selectedSize = normalizedSavedSize;
currentImageIndex = getPerfumeVariantIndex(
getWishlistVariantKey(normalizedSavedSize)
);
updateGalleryImage();
syncWishlistHeart(
String(product.id || product._id)
);
}
}, 100);
}
function renderSimilarProducts(product) {
const box = document.getElementById('similar-products');
if (!box) return;
const related = allProducts.filter(p =>
(p.id !== product.id && p._id !== product._id) &&
(p.type === product.type || p.family === product.family)
).slice(0, 8);
if (related.length === 0) {
box.innerHTML = '<p class="text-gray-400 text-xs italic">No similar fragrances found.</p>';
return;
}
box.innerHTML = related.map(p => {
const imgUrl = p.images?.length ? p.images[0] : p.image;
return `
<div class="min-w-[160px] max-w-[160px] group cursor-pointer bg-white border border-gray-100 rounded-xl p-2 hover:shadow-md transition-all"
onclick="openModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
<div class="h-32 w-full overflow-hidden rounded-lg bg-gray-50 mb-2">
<img src="${imgUrl}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
</div>
<div class="text-[11px] font-bold text-gray-800 truncate">${p.name}</div>
<div class="text-[10px] text-yellow-600 font-bold">₹${p.price}</div>
</div>
`;
}).join('');
}
function scrollSimilar(dir){
const el = document.getElementById("similar-products");
el.scrollBy({ left: dir * 300, behavior: "smooth" });
}
function getProductKey(product) {
return String(product.id || product._id || '').replace(/^db_/, '');
}
function getBundleRule(sizeMl = bundleState.sizeMl, setQty = bundleState.setQty) {
return (bundleRules || []).find(rule =>
Number(rule.sizeMl) === Number(sizeMl) &&
Number(rule.setQty) === Number(setQty) &&
rule.isActive !== false
) || DEFAULT_BUNDLE_RULES.find(rule => Number(rule.sizeMl) === Number(sizeMl) && Number(rule.setQty) === Number(setQty));
}
function getBundleQtyOptions(sizeMl) {
return Number(sizeMl) === 8 ? [4, 6] : [2, 4];
}
function getSizePrice(product, sizeMl) {
const sizes = Array.isArray(product.sizes) && product.sizes.length
? product.sizes
: getSizesByCategory(product.type || product.category);
const size = sizes.find(s => Number(s.value) === Number(sizeMl) && String(s.unit).toLowerCase() === 'ml');
return Math.round(Number(product.price || 0) * (size?.priceMultiplier || 1));
}
function getBundleEligibleProducts() {
const perfumes = allProducts.filter(
p => normalize(p.type || p.category) === 'perfume'
);
return perfumes.map(product => ({
...product,
image:
CUSTOM_SET_PRODUCT_OVERRIDES[getProductKey(product)]?.image ||
product.image
}));
}
function setBundleSize(sizeMl) {
bundleState.sizeMl = Number(sizeMl);
const qtyOptions = getBundleQtyOptions(bundleState.sizeMl);
bundleState.setQty = qtyOptions[0];
bundleState.selections = {};
renderBundleBuilder();
}
function setBundleQty(setQty) {
bundleState.setQty = Number(setQty);
trimBundleSelectionsToLimit();
renderBundleBuilder();
}
function getBundleSelectedCount() {
return Object.values(bundleState.selections).reduce((sum, qty) => sum + Number(qty || 0), 0);
}
function trimBundleSelectionsToLimit() {
let total = getBundleSelectedCount();
const keys = Object.keys(bundleState.selections).reverse();
keys.forEach(key => {
while (total > bundleState.setQty && bundleState.selections[key] > 0) {
bundleState.selections[key] -= 1;
total -= 1;
}
if (!bundleState.selections[key]) delete bundleState.selections[key];
});
}
function changeBundleQty(productId, delta) {
const id = String(productId);
const current = Number(bundleState.selections[id] || 0);
const total = getBundleSelectedCount();
if (delta > 0 && current >= 2) {
showToast('You can add maximum 2 of the same perfume in one set.', 'error');
return;
}
if (delta > 0 && total >= bundleState.setQty) {
showToast(`Your set already has ${bundleState.setQty} perfumes.`, 'error');
return;
}
const next = Math.max(0, current + delta);
if (next) bundleState.selections[id] = next;
else delete bundleState.selections[id];
renderBundleBuilder();
}
function toggleBundleProduct(productId) {
const id = String(productId);
changeBundleQty(id, bundleState.selections[id] ? -bundleState.selections[id] : 1);
}
function setBundlePreference(key) {
bundleState.preference = bundleState.preference === key ? '' : key;
renderBundleBuilder();
}
function productMatchesPreference(product, pref) {
if (!pref) return true;
const profile = BUNDLE_PREFERENCES.find(p => p.key === pref);
if (!profile) return true;
const haystack = [
product.name,
product.description,
product.family,
product.inspiredBy,
product.top,
product.mid,
product.base,
...(product.accords || [])
].join(' ').toLowerCase();
return profile.terms.some(term => haystack.includes(term));
}
function clearBundleFilters() {
bundleState.preference = '';
const search = document.getElementById('bundle-search');
const gender = document.getElementById('bundle-gender-filter');
const season = document.getElementById('bundle-season-filter');
if (search) search.value = '';
if (gender) gender.value = '';
if (season) season.value = '';
renderBundleBuilder();
}
function calculateBundleTotals() {
const selectedProducts = Object.entries(bundleState.selections)
.map(([id, qty]) => ({ product: getBundleEligibleProducts().find(p => getProductKey(p) === id), qty }))
.filter(item => item.product);
const rawTotal = selectedProducts.reduce((sum, item) => sum + getSizePrice(item.product, bundleState.sizeMl) * Number(item.qty || 0), 0);
const rule = getBundleRule();
let saving = 0;
if (rule?.discountType === 'percentage') saving = Math.round(rawTotal * (Number(rule.discountValue || 0) / 100));
if (rule?.discountType === 'fixed') saving = Math.min(Number(rule.discountValue || 0), rawTotal);
return { selectedProducts, rawTotal, saving, finalTotal: Math.max(0, rawTotal - saving), rule };
}
function formatBundleRule(rule) {
if (!rule || rule.discountType === 'none' || !Number(rule.discountValue)) return 'Curated set pricing';
return rule.discountType === 'percentage'
? `${rule.discountValue}% set saving`
: `₹${Number(rule.discountValue).toLocaleString('en-IN')} set saving`;
}
function formatGift(rule) {
if (!rule?.freeGiftEnabled) return null;
return {
productId: rule.freeGiftProductId || '',
name: rule.freeGiftName || 'Surprise perfume',
size: rule.freeGiftSize || '',
type: rule.freeGiftType || '',
image: rule.freeGiftImage || ''
};
}
function getCartValueGift(subtotalAfterDiscount) {
return (bundleRules || [])
.filter(rule => rule.isActive !== false && rule.freeGiftEnabled && Number(rule.minCartValue || 0) > 0 && subtotalAfterDiscount >= Number(rule.minCartValue))
.sort((a, b) => Number(b.minCartValue || 0) - Number(a.minCartValue || 0))[0] || null;
}
function renderBundleBuilder() {
const qtyBox = document.getElementById('bundle-qty-options');
const grid = document.getElementById('bundle-products');
if (!qtyBox || !grid) return;
document.querySelectorAll('.bundle-chip[data-size]').forEach(btn => {
btn.classList.toggle('active', Number(btn.dataset.size) === Number(bundleState.sizeMl));
});
qtyBox.innerHTML = getBundleQtyOptions(bundleState.sizeMl).map(q => {
const rule = getBundleRule(bundleState.sizeMl, q);
return `
<button type="button" onclick="setBundleQty(${q})"
class="bundle-chip border px-4 py-3 rounded text-sm font-bold ${Number(bundleState.setQty) === q ? 'active' : ''}">
Set of ${q}<br><span class="text-[10px] font-normal">${formatBundleRule(rule)}</span>
</button>`;
}).join('');
const prefBox = document.getElementById('bundle-preference-buttons');
if (prefBox) {
prefBox.innerHTML = BUNDLE_PREFERENCES.map(pref => `
<button type="button" onclick="setBundlePreference('${pref.key}')"
class="bundle-chip border border-yellow-500/50 px-3 py-2 rounded-full text-xs font-bold ${bundleState.preference === pref.key ? 'active' : 'text-yellow-400'}">
${pref.label}
</button>
`).join('');
}
const q = (document.getElementById('bundle-search')?.value || '').trim().toLowerCase();
const gender = document.getElementById('bundle-gender-filter')?.value || '';
const season = document.getElementById('bundle-season-filter')?.value || '';
const eligible = getBundleEligibleProducts().filter(product =>
(!q ||
product.name.toLowerCase().includes(q) ||
(product.family || '').toLowerCase().includes(q) ||
(product.inspiredBy || '').toLowerCase().includes(q)) &&
(!gender || product.gender === gender) &&
(!season || normalize(product.season) === normalize(season)) &&
productMatchesPreference(product, bundleState.preference)
);
grid.innerHTML = eligible.map((product, index) => {
const id = getProductKey(product);
const qty = Number(bundleState.selections[id] || 0);
const selected = qty > 0;
const price = getSizePrice(product, bundleState.sizeMl);
const sizeLabel = `${bundleState.sizeMl}ml`;
const img = getVariantImage(product, sizeLabel);
const fallback = getVariantFallbackImage(product, sizeLabel);
return `
<div class="bundle-product-card ${selected ? 'selected' : ''} reveal-up text-left bg-white text-black border rounded-lg overflow-hidden"
style="animation-delay:${Math.min(index * 25, 250)}ms">
<button type="button" onclick="toggleBundleProduct('${id}')" class="w-full text-left">
<div class="aspect-[4/5] bg-gray-100 overflow-hidden">
<img ${imageWithFallback(img, fallback, getDefaultProductImage(product))} alt="${product.name}" class="w-full h-full object-cover">
</div>
<div class="p-3">
<div class="flex items-start justify-between gap-2">
<h4 class="font-bold text-sm leading-tight">${product.name}</h4>
<span class="text-[10px] px-2 py-1 rounded-full ${selected ? 'bg-black text-yellow-400' : 'bg-gray-100 text-gray-600'}">${selected ? `Qty ${qty}` : 'Add'}</span>
</div>
<p class="text-[11px] text-gray-500 mt-1">${product.family || product.inspiredBy || 'Perfume'}</p>
<p class="text-yellow-600 font-bold mt-2">₹${price.toLocaleString('en-IN')} <span class="text-[10px] text-gray-500 font-normal">/ ${bundleState.sizeMl} ml</span></p>
</div>
</button>
<div class="flex items-center justify-between gap-2 border-t p-2">
<button type="button" onclick="changeBundleQty('${id}', -1)" class="w-9 h-8 border rounded font-bold ${qty ? 'text-black' : 'text-gray-300'}">-</button>
<span class="text-xs font-bold">${qty} selected</span>
<button type="button" onclick="changeBundleQty('${id}', 1)" class="w-9 h-8 border rounded font-bold">+</button>
</div>
</div>`;
}).join('') || '<p class="col-span-full text-gray-300">No eligible perfumes found.</p>';
updateBundleSummary();
}
function updateBundleSummary() {
const { rawTotal, saving, finalTotal, rule } = calculateBundleTotals();
const count = getBundleSelectedCount();
const complete = count === Number(bundleState.setQty);
document.getElementById('bundle-selected-count').textContent = `${count} / ${bundleState.setQty}`;
document.getElementById('bundle-raw-total').textContent = `₹${rawTotal.toLocaleString('en-IN')}`;
document.getElementById('bundle-saving').textContent = saving > 0 ? `-₹${saving.toLocaleString('en-IN')}` : '₹0';
document.getElementById('bundle-final-total').textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
const gift = document.getElementById('bundle-gift');
const ruleGift = formatGift(rule);
if (ruleGift) {
gift.classList.remove('hidden');
gift.innerHTML = `Free gift: ${ruleGift.name} ${ruleGift.size || ''}`;
} else {
gift.classList.add('hidden');
}
const btn = document.getElementById('bundle-add-btn');
btn.disabled = !complete;
btn.textContent = complete ? 'Add Custom Set To Cart' : `Select ${bundleState.setQty - count} more perfume${bundleState.setQty - count === 1 ? '' : 's'}`;
btn.className = complete
? 'mt-5 w-full bg-black text-yellow-400 py-3 rounded font-bold uppercase tracking-widest transition hover:bg-yellow-500 hover:text-black'
: 'mt-5 w-full bg-gray-300 text-gray-500 py-3 rounded font-bold uppercase tracking-widest transition';
renderBundlePreview();
}
function renderBundlePreview() {
const box = document.getElementById('bundle-preview');
if (!box) return;
const { selectedProducts } = calculateBundleTotals();
if (!selectedProducts.length) {
box.innerHTML = '<div class="border border-dashed border-gray-300 rounded-lg p-5 text-sm text-gray-500">Your selected perfumes will appear here.</div>';
return;
}
const visual = renderCustomSetVisual(selectedProducts, bundleState.sizeMl);
const list = selectedProducts.map(({ product, qty }) => {
const sizeLabel = `${bundleState.sizeMl}ml`;
const img = getVariantImage(product, sizeLabel);
const fallback = getVariantFallbackImage(product, sizeLabel);
return `
<div class="flex gap-3 border rounded-lg p-3 bg-gray-50">
<img ${imageWithFallback(img, fallback, getDefaultProductImage(product))} class="w-20 h-24 object-cover rounded border bg-white">
<div class="flex-1">
<div class="flex justify-between gap-2">
<div>
<h4 class="font-bold text-sm">${product.name}</h4>
<p class="text-xs text-gray-500">${bundleState.sizeMl} ml x ${qty}</p>
</div>
<strong class="text-yellow-600">₹${(getSizePrice(product, bundleState.sizeMl) * qty).toLocaleString('en-IN')}</strong>
</div>
<div class="flex gap-2 mt-3">
<button onclick="changeBundleQty('${getProductKey(product)}', -1)" class="px-3 py-1 border rounded text-xs font-bold">Remove</button>
<button onclick="changeBundleQty('${getProductKey(product)}', 1)" class="px-3 py-1 bg-black text-white rounded text-xs font-bold">Add one</button>
</div>
</div>
</div>`;
}).join('');
box.innerHTML = `${visual}<div class="space-y-3 mt-3">${list}</div>`;
}
function addBundleToCart() {
const { selectedProducts, rawTotal, saving, finalTotal, rule } = calculateBundleTotals();
if (selectedProducts.length !== Number(bundleState.setQty)) {
showToast('Complete your custom set first.', 'error');
return;
}
const bundleName = rule?.label || `${bundleState.setQty} x ${bundleState.sizeMl} ml Custom Perfume Set`;
const firstBundleProduct = selectedProducts[0]?.product || selectedProducts[0];
const bundleSizeLabel = `${bundleState.sizeMl}ml`;
const cartItem = {
id: `bundle_${Date.now()}`,
itemType: 'bundle',
name: bundleName,
family: 'Custom perfume set',
selectedSize: `${bundleState.setQty} x ${bundleState.sizeMl} ml`,
finalPrice: finalTotal,
image: getVariantImage(firstBundleProduct, bundleSizeLabel),
imageFallback: getVariantFallbackImage(firstBundleProduct, bundleSizeLabel),
setImage: getBundleBoxImage(bundleState.sizeMl),
setImageFallback: `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`,
bundleMeta: {
sizeMl: bundleState.sizeMl,
setQty: bundleState.setQty,
rawTotal,
saving,
ruleId: rule?._id || null,
freeGift: formatGift(rule),
previewSizeMl: bundleState.sizeMl,
items: selectedProducts.map(({ product, qty }) => ({
productId: getProductKey(product),
name: product.name,
size: `${bundleState.sizeMl} ml`,
qty,
price: getSizePrice(product, bundleState.sizeMl),
image: getVariantImage(product, bundleSizeLabel),
imageFallback: getVariantFallbackImage(product, bundleSizeLabel),
bottleImage: getBundleBottleImage(product, bundleState.sizeMl),
bottleFallback: getCommonBundleBottleImage(bundleState.sizeMl)
}))
}
};
if (editingCartIndex !== null && cart[editingCartIndex]) {
cart[editingCartIndex] = { ...cartItem, id: cart[editingCartIndex].id };
editingCartIndex = null;
} else {
cart.push(cartItem);
}
bundleState.selections = {};
updateCartCount();
renderCart();
saveCartToStorage();
renderBundleBuilder();
showToast(`${bundleName} added to your cart.`);
}
document.getElementById('nav-profile-btn').addEventListener('click', () => {
if (currentUser) {
location.hash = '#profile';
} else {
location.hash = '#account';
}
});
document.getElementById("collectionBtn").onclick = () => {
document.getElementById("collectionMenu").classList.toggle("hidden");
};
let currentSlide = 0;
function setHeroSlide(index) {
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');
if(!slides.length) return;
slides.forEach((s, i) => {
s.style.opacity = i === index ? '1' : '0';
s.style.zIndex = i === index ? '10' : '0';
});
dots.forEach((d, i) => d.style.background = i === index ? '#FFD700' : 'rgba(255,255,255,0.5)');
currentSlide = index;
}
function startHeroAutoSlide() {
setInterval(() => {
let next = (currentSlide + 1) % document.querySelectorAll('.hero-slide').length;
setHeroSlide(next);
}, 5000);
}
startHeroAutoSlide();
document.getElementById("collectionMenu").addEventListener("click", function(e){
e.stopPropagation();
});
document.getElementById("mobile-menu").addEventListener("click", function(e){
e.stopPropagation();
});
function updateGalleryImage() {
const img = currentProduct
? getVariantImage(currentProduct, currentImageIndex)
: currentGallery[currentImageIndex];
const fallback = currentProduct ? getVariantFallbackImage(currentProduct, currentImageIndex) : `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`;
const finalFallback = currentProduct ? getDefaultProductImage(currentProduct) : `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`;
const container = document.getElementById('modal-img-container');
container.style.opacity = 0;
setTimeout(()=> {
container.innerHTML = `<img ${imageWithFallback(img, fallback, finalFallback)} class="max-h-full max-w-full object-contain drop-shadow-2xl">`;
container.style.opacity = 1;
}, 120);
container.style.transition = 'opacity .12s ease-in-out';
}
function nextImage(){ currentImageIndex = (currentImageIndex+1)%currentGallery.length; updateGalleryImage(); }
function prevImage(){ currentImageIndex = (currentImageIndex-1+currentGallery.length)%currentGallery.length; updateGalleryImage(); }
function roundTo99(price){
return Math.ceil(price/100)*100-1;
}
function getPricing(basePrice, multiplier = 1, explicitMrp = 0) {
const sellingPrice = Math.ceil(basePrice * multiplier);
const mrp = Number(explicitMrp) > 0 && Number(multiplier) === 1 ? Number(explicitMrp) : roundTo99(sellingPrice * 1.35);
const discount = Math.round(
((mrp - sellingPrice) / mrp) * 100
);
return {
sellingPrice,
mrp,
discount
};
}
function updatePriceDisplay(price, mrp, discount) {
document.getElementById("modal-price").innerHTML = `
<div class="flex items-center gap-3 flex-wrap">
<span class="text-3xl font-bold text-black">
₹${Number(price).toLocaleString("en-IN")}
</span>
<span class="text-lg text-gray-400 line-through">
₹${Number(mrp).toLocaleString("en-IN")}
</span>
<span class="bg-green-600 text-white text-xs px-2 py-1 rounded">
${discount}% OFF
</span>
</div>
`;
}
function closeModal() {
document.getElementById("product-modal").classList.add("hidden");
document.body.style.overflow = "auto";
localStorage.removeItem("openProductId");
}
function addItemToCart() {
const sizeLabel = currentProduct.type === 'Combo' ? 'Set' : selectedSize || 'Default';
const final = currentPrice || currentProduct.price || 0;
const quantity = Math.max(1, Math.floor(Number(pendingCartQty) || 1));
const cartItem = {
...currentProduct,
selectedSize: sizeLabel,
finalPrice: final,
quantity,
image: getVariantImage(currentProduct, sizeLabel),
imageFallback: getVariantFallbackImage(currentProduct, sizeLabel)
};
pendingCartQty = 1;
if (editingCartIndex !== null && cart[editingCartIndex]) {
cart[editingCartIndex] = cartItem;
editingCartIndex = null;
} else {
cart.push(cartItem);
}
updateCartCount(); renderCart(); saveCartToStorage(); closeModal();
showToast(`${currentProduct.name} added to your cart.`);
const btn = document.querySelector('button[onclick="switchPage(\'cart\')"] i');
if (btn) { btn.classList.add('text-yellow-400','scale-125'); setTimeout(()=>btn.classList.remove('text-yellow-400','scale-125'), 300); }
}
function updateCartCount(){
const badge = document.getElementById('cart-count-badge');
if (badge) badge.textContent = cart.reduce((sum,item)=>sum+cartItemQty(item),0);
}
function removeFromCart(i){ cart.splice(i,1); editingCartRowIndex=null; updateCartCount(); renderCart(); saveCartToStorage(); window.dispatchEvent(new Event('ee:cart-updated')); }
function isQuantityCartItem(item) {
return !item || (!item.itemType || item.itemType === 'product');
}
function cartItemQty(item) {
return isQuantityCartItem(item) ? Math.max(1, Math.floor(Number(item.quantity) || 1)) : 1;
}
function cartItemLineTotal(item) {
return Number(item.finalPrice || 0) * cartItemQty(item);
}
function changeCartQuantity(index, delta) {
const item = cart[index];
if (!item || !isQuantityCartItem(item) || editingCartRowIndex !== index) return;
const next = cartItemQty(item) + Number(delta || 0);
if (next <= 0) cart.splice(index, 1);
else item.quantity = next;
updateCartCount(); renderCart(); saveCartToStorage();
window.dispatchEvent(new Event('ee:cart-updated'));
}
function toggleCartItemEditing(index) {
editingCartRowIndex = editingCartRowIndex === index ? null : index;
renderCart();
}
function viewCartItem(index) {
const item = cart[index];
if (!item) return;
editingCartIndex = null;
if (item.itemType === 'bundle') { switchPage('custom-set'); return; }
if (item.itemType === 'perfume_card') { switchPage('perfume-card'); return; }
const productId = String(item.id || item.productId || '').replace(/^db_/, '');
const product = allProducts.find(p => p.name === item.name && String(p.id || p._id || '').replace(/^db_/, '') === productId) || allProducts.find(p => p.name === item.name) || findProductByAnyId(productId);
if (!product) { showToast('This product is not available right now.', 'error'); return; }
if (window.eeNavigateToProduct) {
window.eeNavigateToProduct(product, { size: item.selectedSize, name: item.name, quantity: 1 });
return;
}
openModal(product);
}
function continueShopping() {
if (window.eeNavigateCollection) window.eeNavigateCollection('all');
else goToCategory('all');
}
function editCartItem(index) {
const item = cart[index];
if (!item) return;
editingCartIndex = index;
if (item.itemType === 'bundle' && item.bundleMeta) {
bundleState.sizeMl = Number(item.bundleMeta.sizeMl || 8);
bundleState.setQty = Number(item.bundleMeta.setQty || (item.bundleMeta.items || []).length || 4);
bundleState.selections = {};
(item.bundleMeta.items || []).forEach(bundleItem => {
if (bundleItem.productId) bundleState.selections[String(bundleItem.productId)] = Number(bundleItem.qty || 1);
});
switchPage('custom-set');
renderBundleBuilder();
showToast('Custom set loaded for editing.');
return;
}
if (item.itemType === 'perfume_card' && item.cardMeta) {
const meta = item.cardMeta;
switchPage('perfume-card');
setTimeout(() => {
const setValue = (id, value) => { const el = document.getElementById(id); if (el && typeof value !== 'undefined') el.value = value; };
setValue('card-occasion', meta.occasion);
handlePerfumeCardOccasion();
setValue('card-design', meta.design);
setValue('card-product-type', meta.productType);
setValue('card-qty', meta.qty);
setValue('card-mehndi-style', meta.mehndiStyle);
setValue('card-bride-name', meta.brideName);
setValue('card-groom-name', meta.groomName);
setValue('card-person-name', meta.personName);
setValue('card-age', meta.age);
setValue('card-event-date', meta.eventDate);
setValue('card-location', meta.location);
setValue('card-message', meta.message);
updatePerfumeCardPreview();
}, 50);
showToast('Perfume card loaded for editing.');
return;
}
const productId = String(item.id || item.productId || '').replace(/^db_/, '');
const product = allProducts.find(p => p.name === item.name && String(p.id || p._id || '').replace(/^db_/, '') === productId) || allProducts.find(p => p.name === item.name) || findProductByAnyId(productId);
if (!product) {
showToast('This item cannot be edited right now.', 'error');
editingCartIndex = null;
return;
}
if (window.eeNavigateToProduct) {
    window.eeNavigateToProduct(product, { size: item.selectedSize, cartIndex: index, quantity: cartItemQty(item), name: item.name });
showToast('Product loaded for editing.');
return;
}
openModal(product);
setTimeout(() => {
const match = [...document.querySelectorAll('.size-btn')].find(btn => normalize(btn.textContent) === normalize(item.selectedSize));
if (match) match.click();
}, 100);
}
function computeShipping(subtotalAfterDiscount) {
if (subtotalAfterDiscount >= 600) return 0;
if (subtotalAfterDiscount >= 250) return 79;
if (subtotalAfterDiscount >= 100) return 99;
return 149;
}
function isCodSelected() {
return getSelectedPaymentMethod() === 'Cash on Delivery';
}
function calculateTotals(){
const subtotal = cart.reduce((s,it)=>s + cartItemLineTotal(it),0);
const effectiveDiscount = Math.max(0, Number(discountAmount||0));
const subtotalAfterDiscount = Math.max(0, subtotal - effectiveDiscount);
const shipping = computeShipping(subtotalAfterDiscount);
const codFee = isCodSelected() ? COD_CHARGE : 0;
let total = subtotalAfterDiscount + shipping + codFee;
if (total < 0) total = 0;
return { subtotal, discount: effectiveDiscount, shipping, codFee, total, subtotalAfterDiscount, cartValueGift: getCartValueGift(subtotalAfterDiscount) };
}
function cartHasPerfumeCard() {
return cart.some(item => item.itemType === 'perfume_card');
}
function isMumbaiCheckoutCity() {
return normalize(document.getElementById('ship-city')?.value || '') === 'mumbai';
}
function updatePaymentMethodAvailability() {
const codRow = document.getElementById('cod-payment-row');
const onlineRow = document.getElementById('online-payment-row');
const online = document.querySelector('input[name="payment-method"][value="Razorpay Online Payment"]');
const cod = document.querySelector('input[name="payment-method"][value="Cash on Delivery"]');
if (!codRow || !online || !cod) return;
const canUseCod = isMumbaiCheckoutCity() && !cartHasPerfumeCard();
codRow.classList.toggle('hidden', !canUseCod);
codRow.classList.toggle('flex', canUseCod);
if (onlineRow) onlineRow.classList.remove('hidden');
if (!canUseCod && cod.checked) online.checked = true;
}
function renderCart(){
const container = document.getElementById('cart-items-container');
const empty = document.getElementById('cart-empty-msg');
const content = document.getElementById('cart-content');
if (!container || !empty || !content) return;
container.innerHTML = '';
if (cart.length === 0) {
empty.classList.remove('hidden'); content.classList.add('hidden');
discountAmount = 0; appliedCoupon = null;
if (document.getElementById('cart-subtotal')) document.getElementById('cart-subtotal').textContent = '₹0';
if (document.getElementById('cart-discount')) document.getElementById('cart-discount').textContent = '₹0';
if (document.getElementById('cart-shipping')) document.getElementById('cart-shipping').textContent = 'Free';
if (document.getElementById('cart-cod-fee-row')) document.getElementById('cart-cod-fee-row').classList.add('hidden');
if (document.getElementById('cart-total')) document.getElementById('cart-total').textContent = '₹0';
if (document.getElementById('free-delivery-msg')) document.getElementById('free-delivery-msg').classList.add('hidden');
return;
}
empty.classList.add('hidden'); content.classList.remove('hidden');
cart.forEach((item, idx)=>{
const tr = document.createElement('tr'); tr.className = "ee-cart-item block md:table-row border-b border-gray-100 hover:bg-gray-50 relative";
const itemImage = normalizeImageUrl(item.image) || getDefaultProductImage(item);
const itemFallback = normalizeImageUrl(item.imageFallback) || getDefaultProductImage(item);
const bundleDetails = item.itemType === 'bundle' && item.bundleMeta
? `<p class="text-[11px] text-gray-500 mt-1">${(item.bundleMeta.items || []).map(p => p.name).join(', ')}</p>
${item.bundleMeta.freeGift ? `<p class="text-[11px] text-green-700 mt-1">Free gift: ${item.bundleMeta.freeGift.name} ${item.bundleMeta.freeGift.size || ''}</p>` : ''}
${item.bundleMeta.saving ? `<p class="text-[11px] text-yellow-700 mt-1">Set saving: ₹${Number(item.bundleMeta.saving).toLocaleString('en-IN')}</p>` : ''}`
: `<p class="text-xs text-gray-500">${item.family || ''}</p>`;
const itemVisual = item.itemType === 'bundle' && item.bundleMeta
? renderCustomSetVisual((item.bundleMeta.items || []).map(p => ({
product: { ...p, image: p.image, images: [p.image], name: p.name, bottleImage: p.bottleImage },
qty: p.qty
})), item.bundleMeta.previewSizeMl || item.bundleMeta.sizeMl || 8, true)
: item.itemType === 'perfume_card' && item.cardMeta
? renderPerfumeCardVisual(item.cardMeta, true)
: `<img ${imageWithFallback(itemImage, itemFallback, getDefaultProductImage(item))} class="w-16 h-16 object-cover rounded border">`;
const qty = cartItemQty(item);
const canChangeQty = isQuantityCartItem(item);
const unitPrice = Number(item.finalPrice || 0);
const linePrice = cartItemLineTotal(item);
const isEditingRow = editingCartRowIndex === idx;
const quantityControls = canChangeQty
? isEditingRow ? `<div class="ee-cart-qty" aria-label="Change quantity">
<button type="button" onclick="changeCartQuantity(${idx}, -1)" title="Decrease quantity">-</button>
<b>${qty}</b>
<button type="button" onclick="changeCartQuantity(${idx}, 1)" title="Increase quantity">+</button>
</div><button type="button" class="ee-cart-options" onclick="editCartItem(${idx})">Change size or options</button>`
: `<span class="ee-cart-qty-readonly" aria-label="Quantity ${qty}">${qty}</span>`
: `<span class="text-xs text-gray-500">${item.itemType === 'perfume_card' ? `Qty ${item.cardMeta?.qty || 1}` : 'Set item'}</span>`;
tr.innerHTML = `
<td class="ee-cart-product p-4 flex items-center gap-4 pr-14 md:pr-4 cursor-pointer" onclick="viewCartItem(${idx})" title="View product details">
${itemVisual}
<div class="ee-cart-product-copy"><p class="font-bold text-sm">${item.name}</p>${bundleDetails}</div>
</td>
<td class="ee-cart-size block md:table-cell px-4 pb-2 md:p-4 text-sm text-gray-600"><span class="md:hidden font-bold text-gray-500 mr-2">Size:</span>${item.selectedSize}</td>
<td class="ee-cart-quantity block md:table-cell px-4 pb-4 md:p-4 text-sm"><span class="ee-cart-mobile-label md:hidden">Quantity</span>${quantityControls}</td>
<td class="ee-cart-price block md:table-cell px-4 pb-4 md:p-4 text-sm font-bold"><span class="md:hidden font-bold text-gray-500 mr-2">Price:</span>₹${linePrice.toLocaleString('en-IN')}${canChangeQty && qty > 1 ? `<small class="block text-[11px] font-normal text-gray-500">₹${unitPrice.toLocaleString('en-IN')} each</small>` : ''}</td>
<td class="ee-cart-actions absolute top-4 right-4 md:static md:table-cell p-0 md:p-4 md:text-right">
<div class="flex items-center justify-end gap-2">
<button onclick="toggleCartItemEditing(${idx})" class="w-9 h-9 rounded-full border border-yellow-200 text-yellow-700 hover:bg-yellow-50 ${isEditingRow?'ee-cart-edit-active':''}" title="${isEditingRow?'Finish editing':'Edit item'}" aria-label="${isEditingRow?'Finish editing':'Edit item'}"><i class="fas ${isEditingRow?'fa-check':'fa-pen'}"></i></button>
${isEditingRow?`<button onclick="removeFromCart(${idx})" class="w-9 h-9 rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700" title="Remove item" aria-label="Remove item"><i class="fas fa-trash"></i></button>`:''}
</div>
</td>
`;
container.appendChild(tr);
});
const totals = calculateTotals();
updatePaymentMethodAvailability();
document.getElementById('cart-subtotal').textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
document.getElementById('cart-discount').textContent = totals.discount>0?`-₹${totals.discount.toLocaleString('en-IN')}`:'₹0';
document.getElementById('cart-shipping').textContent = totals.shipping>0?`₹${totals.shipping.toLocaleString('en-IN')}`:'Free';
const codFeeRow = document.getElementById('cart-cod-fee-row');
if (codFeeRow) {
codFeeRow.classList.toggle('hidden', totals.codFee <= 0);
codFeeRow.classList.toggle('flex', totals.codFee > 0);
document.getElementById('cart-cod-fee').textContent = `₹${totals.codFee.toLocaleString('en-IN')}`;
}
document.getElementById('cart-total').textContent = `₹${totals.total.toLocaleString('en-IN')}`;
const freeMsg = document.getElementById('free-delivery-msg');
const amountForFree = Math.max(0, 600 - totals.subtotalAfterDiscount);
if (amountForFree > 0) {
freeMsg.classList.remove('hidden');
freeMsg.innerHTML = `Add <strong>₹${amountForFree.toLocaleString('en-IN')}</strong> more to get <strong>Free Delivery</strong>.`;
} else {
const cartGift = formatGift(totals.cartValueGift);
if (cartGift) {
freeMsg.classList.remove('hidden');
freeMsg.innerHTML = `<strong>Free gift unlocked:</strong> ${cartGift.name} ${cartGift.size || ''}`;
} else {
freeMsg.classList.add('hidden');
}
}
scheduleCouponSuggestions();
}
function getSelectedPaymentMethod(){
let val = ''; document.querySelectorAll('input[name="payment-method"]').forEach(r => { if (r.checked) val = r.value; }); return val;
}
async function handleSignupSendOtp() {
const name = (document.getElementById('signup-name')?.value || '').trim();
const phone = (document.getElementById('signup-phone')?.value || '').trim();
const email = (document.getElementById('signup-email')?.value || '').trim().toLowerCase();
const password = (document.getElementById('signup-password')?.value || '').trim();
const msgEl = document.getElementById('signup-message');
const otpSection = document.getElementById('signup-otp-section');
const btn = document.getElementById('btn-send-otp');
if (!email || !password) { msgEl.textContent = 'Email and password are required.'; msgEl.className='text-xs mt-2 text-red-600'; return; }
try {
btn.disabled = true; btn.textContent = 'Sending OTP...'; msgEl.textContent = ''; msgEl.className = 'text-xs mt-2 text-gray-600';
let res = await fetch(`${BACKEND_BASE_URL}/api/auth/register`, {
method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, phone, email, password })
});
const data = await res.json().catch(()=> ({}));
if (!res.ok || !data.success) {
if (res.status === 409 && data.error) { throw new Error(data.error); }
const fallback = await fetch(`${BACKEND_BASE_URL}/api/auth/send-otp`, {
method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, phone, purpose: 'signup' })
});
const fb = await fallback.json().catch(()=>({}));
if (!fallback.ok || !fb.success) throw new Error(fb.error || data.error || 'Could not send OTP.');
msgEl.textContent = fb.message || 'OTP sent to your email.';
msgEl.className = 'text-xs mt-2 text-green-600';
otpSection.classList.remove('hidden');
} else {
msgEl.textContent = data.message || 'OTP sent to your email.';
msgEl.className = 'text-xs mt-2 text-green-600';
otpSection.classList.remove('hidden');
}
} catch (err) {
console.error('Signup send otp err', err);
msgEl.textContent = err.message || 'Could not send OTP.';
msgEl.className = 'text-xs mt-2 text-red-600';
} finally {
btn.disabled = false; btn.textContent = 'Sign Up & Get OTP';
}
}
async function resendSignupOtp(){
const email = (document.getElementById('signup-email')?.value || '').trim().toLowerCase();
if (!email) { document.getElementById('signup-message').textContent = 'Enter email to resend OTP.'; document.getElementById('signup-message').className='text-xs mt-2 text-red-600'; return; }
try {
document.getElementById('signup-message').textContent = 'Resending OTP...'; document.getElementById('signup-message').className='text-xs mt-2 text-gray-600';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/send-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, purpose: 'signup' }) });
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || 'Could not resend OTP.');
document.getElementById('signup-message').textContent = d.message || 'OTP resent.';
document.getElementById('signup-message').className='text-xs mt-2 text-green-600';
} catch (err) {
console.error('resend signup otp', err);
document.getElementById('signup-message').textContent = err.message || 'Resend failed.';
document.getElementById('signup-message').className='text-xs mt-2 text-red-600';
}
}
async function handleVerifyOtp() {
const email = (document.getElementById('signup-email')?.value || '').trim().toLowerCase();
const otp = (document.getElementById('signup-otp')?.value || '').trim();
const msgEl = document.getElementById('signup-message');
if (!email || !otp) { msgEl.textContent = 'Email and OTP are required.'; msgEl.className='text-xs mt-2 text-red-600'; return; }
try {
msgEl.textContent = 'Verifying OTP...'; msgEl.className='text-xs mt-2 text-gray-600';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, otp }) });
const data = await res.json().catch(()=> ({}));
if (!res.ok || !data.success || !data.token) throw new Error(data.error || 'Failed to verify OTP.');
authToken = data.token; currentUser = data.user || { email }; saveAuthToStorage(); updateAuthUI();
msgEl.textContent = 'Account verified & created. You are logged in.'; msgEl.className='text-xs mt-2 text-green-600';
document.getElementById('signup-otp').value = ''; document.getElementById('signup-otp-section').classList.add('hidden');
document.getElementById('checkout-email').value = currentUser.email || ''; document.getElementById('checkout-email').readOnly = true;
switchPage('profile');
} catch (err) {
console.error('verify otp', err); msgEl.textContent = err.message || 'OTP verify failed.'; msgEl.className='text-xs mt-2 text-red-600';
}
}
async function handleLogin(){
const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
const password = (document.getElementById('login-password')?.value || '').trim();
const msg = document.getElementById('login-message');
if (!email || !password) { msg.textContent = 'Email and password are required.'; msg.className='text-xs mt-2 text-red-600'; return; }
try {
msg.textContent = 'Logging in...'; msg.className='text-xs mt-2 text-gray-600';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success || !d.token) throw new Error(d.error || 'Login failed.');
authToken = d.token; currentUser = d.user || { email }; saveAuthToStorage(); updateAuthUI();
msg.textContent = 'Login successful.'; msg.className='text-xs mt-2 text-green-600';
document.getElementById('login-email').value = ''; document.getElementById('login-password').value = '';
switchPage('profile');
} catch (err) {
console.error('login err', err); msg.textContent = err.message || 'Login failed.'; msg.className='text-xs mt-2 text-red-600';
}
}
document.addEventListener('keydown', event => {
if (event.key !== 'Enter' || !['login-email','login-password'].includes(event.target?.id)) return;
event.preventDefault();
handleLogin();
});
function handleLogout(){
stopOrdersPoller?.();
clearAuth();
currentUser = null;
authToken = '';
try {
localStorage.removeItem(AUTH_TOKEN_KEY);
localStorage.removeItem(AUTH_USER_KEY);
sessionStorage.removeItem(AUTH_TOKEN_KEY);
sessionStorage.removeItem(AUTH_USER_KEY);
} catch(e) {}
['profile-name-text','profile-email-text','profile-phone-text'].forEach(id => {
const el = document.getElementById(id); if (el) el.textContent = '—';
});
['checkout-email','ship-name','ship-phone','ship-address','ship-city','ship-pincode','ship-state'].forEach(id => {
const el = document.getElementById(id); if (el) { el.value = ''; el.readOnly = false; }
});
const addressList = document.getElementById('profile-address-list');
if (addressList) addressList.innerHTML = '<p class="text-xs text-gray-500">Login to view saved addresses.</p>';
const profileForm = document.getElementById('profile-address-form');
if (profileForm) profileForm.classList.add('hidden');
const ordersList = document.getElementById('orders-list');
if (ordersList) ordersList.innerHTML = '';
if (typeof updateAuthUI === 'function') updateAuthUI();
if (typeof renderOrders === 'function') renderOrders();
const lm = document.getElementById('login-message');
if (lm) {
lm.textContent = 'You have been logged out.';
lm.className = 'text-xs mt-2 text-gray-600';
}
history.replaceState({}, '', '#account');
switchPage('account');
}
function openForgotModal() {
document.getElementById('forgot-password-modal').classList.remove('hidden');
document.getElementById('fp-step-1').classList.remove('hidden');
document.getElementById('fp-step-2').classList.add('hidden');
document.getElementById('fp-msg-1').textContent = '';
document.getElementById('fp-msg-2').textContent = '';
}
function closeForgotModal() {
document.getElementById('forgot-password-modal').classList.add('hidden');
document.getElementById('fp-email').value = '';
document.getElementById('fp-otp').value = '';
document.getElementById('fp-newpass').value = '';
document.getElementById('fp-newpass2').value = '';
}
document.getElementById('fp-send-otp').onclick = async function() {
const email = (document.getElementById('fp-email').value || '').trim().toLowerCase();
const msg = document.getElementById('fp-msg-1');
if (!email) { msg.textContent = 'Enter email'; msg.style.color = 'red'; return; }
try {
this.disabled = true; this.textContent = 'Sending...'; msg.textContent = ''; msg.style.color = '';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/send-otp`, {
method: 'POST',
headers: {'Content-Type':'application/json'},
body: JSON.stringify({ email, purpose: 'reset' })
});
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || d.message || 'Could not send OTP');
msg.textContent = d.message || 'OTP sent to email';
msg.style.color = 'green';
document.getElementById('fp-step-1').classList.add('hidden');
document.getElementById('fp-step-2').classList.remove('hidden');
} catch (err) {
console.error('fp send otp', err);
msg.textContent = err.message || 'Failed to send OTP';
msg.style.color = 'red';
} finally {
this.disabled = false; this.textContent = 'Send OTP';
}
};
document.getElementById('fp-verify-reset').onclick = async function() {
const email = (document.getElementById('fp-email').value || '').trim().toLowerCase();
const otp = (document.getElementById('fp-otp').value || '').trim();
const newPass = (document.getElementById('fp-newpass').value || '').trim();
const newPass2 = (document.getElementById('fp-newpass2').value || '').trim();
const msg = document.getElementById('fp-msg-2');
if (!email || !otp) { msg.textContent = 'Email and OTP required'; msg.style.color = 'red'; return; }
if (!newPass || newPass.length < 6) { msg.textContent = 'Choose a stronger password (>=6 chars)'; msg.style.color = 'red'; return; }
if (newPass !== newPass2) { msg.textContent = 'Passwords do not match'; msg.style.color = 'red'; return; }
try {
this.disabled = true; this.textContent = 'Verifying...'; msg.textContent = ''; msg.style.color = '';
const vres = await fetch(`${BACKEND_BASE_URL}/api/auth/verify-otp`, {
method: 'POST', headers: {'Content-Type':'application/json'},
body: JSON.stringify({ email, otp, purpose: 'reset' })
});
const vd = await vres.json().catch(()=>({}));
if (!vres.ok || !vd.success || !vd.resetToken) throw new Error(vd.error || 'OTP verify failed');
const resetToken = vd.resetToken;
const rres = await fetch(`${BACKEND_BASE_URL}/api/auth/reset-password`, {
method: 'POST', headers: {'Content-Type':'application/json'},
body: JSON.stringify({ email, resetToken, newPassword: newPass })
});
const rd = await rres.json().catch(()=>({}));
if (!rres.ok || !rd.success) throw new Error(rd.error || rd.message || 'Reset failed');
msg.textContent = rd.message || 'Password updated. You can now login.';
msg.style.color = 'green';
setTimeout(() => closeForgotModal(), 1200);
} catch (err) {
console.error('fp verify/reset', err);
msg.textContent = err.message || 'Reset failed';
msg.style.color = 'red';
} finally {
this.disabled = false; this.textContent = 'Verify & Reset';
}
};
function showToast(message, type = 'success') {
let container = document.getElementById('toast-container');
if (!container) {
container = document.createElement('div');
container.id = 'toast-container';
container.className = 'fixed bottom-5 right-5 flex flex-col gap-3 pointer-events-none';
document.body.appendChild(container);
}
const toast = document.createElement('div');
const icon = type === 'success' ? '<i class="fas fa-check-circle text-green-400"></i>' : '<i class="fas fa-exclamation-circle text-red-400"></i>';
toast.className = `shopify-toast bg-gray-900 text-white px-5 py-4 rounded-lg shadow-2xl flex items-center gap-3 text-sm font-semibold border-l-4 ${type === 'success' ? 'border-green-400' : 'border-red-400'}`;
toast.innerHTML = `${icon} <span>${message}</span>`;
container.appendChild(toast);
setTimeout(() => toast.remove(), 3500);
}
async function applyCoupon() {
const input = document.getElementById('coupon-code');
const msg = document.getElementById('coupon-message');
if (!input || !msg) return;
const code = input.value.trim().toUpperCase();
const subtotal = cart.reduce((s,it)=>s + cartItemLineTotal(it),0);
discountAmount = 0; appliedCoupon = null;
msg.classList.remove('hidden', 'text-green-600', 'text-red-600');
if (!code) { msg.textContent = 'Please enter a coupon code.'; msg.classList.add('text-red-600'); renderCart(); return; }
if (subtotal === 0) { msg.textContent = 'Add items to cart first.'; msg.classList.add('text-red-600'); return; }
try {
const res = await fetch(`${BACKEND_BASE_URL}/api/orders/validate-coupon`, {
method: 'POST', headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
body: JSON.stringify({ code, cart: commerceCartPayload(), phone: document.getElementById('ship-phone')?.value || currentUser?.phone || '' })
});
const data = await res.json();
if (data.success) {
discountAmount = data.discountAmount;
appliedCoupon = data.code;
msg.textContent = `Coupon applied! You saved ₹${discountAmount}.`;
msg.classList.add('text-green-600');
} else {
msg.textContent = data.error || 'Invalid or expired coupon.';
msg.classList.add('text-red-600');
if(data.phoneVerificationRequired) openPhoneVerification();
}
} catch (err) {
msg.textContent = 'Error verifying coupon.';
msg.classList.add('text-red-600');
}
renderCart(); saveCartToStorage();
}

function commerceCartPayload() {
return cart.map(item => ({
productId: item.id || item.productId,
name: item.name,
size: item.selectedSize || item.size,
price: item.finalPrice || item.price,
qty: cartItemQty(item),
image: item.image,
itemType: item.itemType || 'product',
bundleMeta: item.bundleMeta || null,
cardMeta: item.cardMeta || null
}));
}
let couponSuggestionTimer = null;
let appliedCouponRefreshTimer = null;
function ensureCouponSuggestionsUI() {
if(document.getElementById('coupon-suggestions')) return;
const message=document.getElementById('coupon-message');
const host=message?.parentElement;
if(!host) return;
const section=document.createElement('section');
section.id='coupon-suggestions';
section.className='ee-coupon-suggestions';
section.innerHTML='<div class="ee-coupon-suggestion-head"><div><b>AVAILABLE SAVINGS</b><span>Best valid coupons for this cart</span></div><button type="button" id="coupon-suggestions-toggle" class="hidden" onclick="toggleAllCouponSuggestions()">View all coupons <span>⌄</span></button></div><div id="coupon-suggestion-list"></div><div id="phone-offer-banner" class="ee-phone-offer hidden"></div>';
host.appendChild(section);
}
function scheduleCouponSuggestions(){
clearTimeout(couponSuggestionTimer);
couponSuggestionTimer=setTimeout(loadCouponSuggestions,180);
clearTimeout(appliedCouponRefreshTimer);
if(appliedCoupon)appliedCouponRefreshTimer=setTimeout(refreshAppliedCoupon,220);
}
async function refreshAppliedCoupon(){
if(!appliedCoupon||!cart.length)return;
try{const res=await fetch(`${BACKEND_BASE_URL}/api/orders/validate-coupon`,{method:'POST',headers:{'Content-Type':'application/json',...(authToken?{Authorization:`Bearer ${authToken}`}:{})},body:JSON.stringify({code:appliedCoupon,cart:commerceCartPayload(),phone:document.getElementById('ship-phone')?.value||currentUser?.phone||''})});const data=await res.json();if(!res.ok||!data.success){appliedCoupon=null;discountAmount=0;saveCartToStorage();const message=document.getElementById('coupon-message');if(message){message.textContent=data.error||'This coupon no longer applies to the cart.';message.className='text-sm mt-2 text-red-600';}renderCart();return;}const nextDiscount=Number(data.discountAmount||0);if(nextDiscount!==discountAmount){discountAmount=nextDiscount;saveCartToStorage();renderCart();}}catch{}
}
async function loadCouponSuggestions(){
ensureCouponSuggestionsUI();
const list=document.getElementById('coupon-suggestion-list');
if(!list||!cart.length)return;
try{
const res=await fetch(`${BACKEND_BASE_URL}/api/orders/coupon-suggestions`,{method:'POST',headers:{'Content-Type':'application/json',...(authToken?{Authorization:`Bearer ${authToken}`}:{})},body:JSON.stringify({cart:commerceCartPayload(),phone:document.getElementById('ship-phone')?.value||currentUser?.phone||''})});
const data=await res.json();
if(!res.ok||!data.success)throw new Error(data.error||'Could not load coupons');
const coupons=data.coupons||[];
list.dataset.expanded='false';
list.innerHTML=coupons.map((coupon,index)=>`<article class="ee-coupon-card ${coupon.eligible?'':'locked'} ${index>1?'ee-extra-coupon hidden':''}"><div><code>${escapeHtml(coupon.code)}</code><b>${escapeHtml(coupon.description||`${coupon.discountValue}${coupon.discountType==='percentage'?'%':' rupees'} off`)}</b><span>${coupon.eligible?`You save approximately ₹${Number(coupon.savings||0).toLocaleString('en-IN')}`:escapeHtml(coupon.reason||'Not applicable')}</span>${coupon.minOrderValue?`<small>Minimum cart ₹${Number(coupon.minOrderValue).toLocaleString('en-IN')}</small>`:''}${coupon.endAt?`<small>Expires ${new Date(coupon.endAt).toLocaleDateString('en-IN')}</small>`:''}</div><button type="button" ${coupon.eligible?'':'disabled'} onclick="applySuggestedCoupon('${escapeHtml(coupon.code)}')">${appliedCoupon===coupon.code?'APPLIED':'APPLY'}</button></article>`).join('')||'<p class="ee-no-coupons">No suggested coupons apply to this cart right now.</p>';
const toggle=document.getElementById('coupon-suggestions-toggle');
toggle?.classList.toggle('hidden',coupons.length<=2);
const needsPhone=coupons.some(c=>c.phoneVerificationRequired);
const banner=document.getElementById('phone-offer-banner');
if(banner){banner.classList.toggle('hidden',!needsPhone||data.phoneVerified);banner.innerHTML=needsPhone&&!data.phoneVerified?'<div><b>Unlock 25% off your first order</b><span>Verify your mobile number once to use FIRST25.</span></div><button type="button" onclick="openPhoneVerification()">VERIFY MOBILE</button>':'';}
}catch(err){list.innerHTML='<p class="ee-no-coupons">Coupon suggestions are temporarily unavailable.</p>';}
}
function toggleAllCouponSuggestions(){
const list=document.getElementById('coupon-suggestion-list');if(!list)return;
const expanded=list.dataset.expanded!=='true';list.dataset.expanded=String(expanded);
list.querySelectorAll('.ee-extra-coupon').forEach(node=>node.classList.toggle('hidden',!expanded));
const button=document.getElementById('coupon-suggestions-toggle');if(button)button.innerHTML=expanded?'Show fewer <span>⌃</span>':'View all coupons <span>⌄</span>';
}
function applySuggestedCoupon(code){const input=document.getElementById('coupon-code');if(input)input.value=code;applyCoupon();}
function ensurePhoneVerificationModal(){
if(document.getElementById('phone-verification-modal'))return;
const modal=document.createElement('div');modal.id='phone-verification-modal';modal.className='fixed inset-0 bg-black/70 hidden z-[100001] items-center justify-center p-4';
modal.innerHTML='<div class="ee-phone-verify"><button type="button" class="close" onclick="closePhoneVerification()">×</button><span>FIRST ORDER BENEFIT</span><h3>Verify your mobile</h3><p>One verified mobile number can use the 25% first-order coupon once.</p><input id="verify-phone-number" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile number"><div class="ee-phone-code-row hidden" id="verify-phone-code-row"><input id="verify-phone-code" inputmode="numeric" autocomplete="one-time-code" placeholder="OTP"><button type="button" onclick="verifyPhoneCode()">VERIFY</button></div><button id="send-phone-code" type="button" onclick="sendPhoneCode()">SEND VERIFICATION CODE</button><small id="phone-verification-message"></small></div>';
document.body.appendChild(modal);
}
function openPhoneVerification(){if(!authToken){showToast('Please sign in before verifying your mobile.','error');window.eeNavigatePage?.('account');return;}ensurePhoneVerificationModal();const modal=document.getElementById('phone-verification-modal');modal.classList.remove('hidden');modal.classList.add('flex');document.getElementById('verify-phone-number').value=currentUser?.verifiedPhone||currentUser?.phone||document.getElementById('ship-phone')?.value||'';}
function closePhoneVerification(){const modal=document.getElementById('phone-verification-modal');modal?.classList.add('hidden');modal?.classList.remove('flex');}
async function sendPhoneCode(){const msg=document.getElementById('phone-verification-message');try{const phone=document.getElementById('verify-phone-number').value;const res=await fetch(`${BACKEND_BASE_URL}/api/auth/phone/send-otp`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${authToken}`},body:JSON.stringify({phone})});const data=await res.json();if(!res.ok)throw new Error(data.error);msg.textContent=data.message;msg.className='success';document.getElementById('verify-phone-code-row').classList.remove('hidden');document.getElementById('send-phone-code').classList.add('hidden');}catch(err){msg.textContent=err.message||'Could not send code';msg.className='error';}}
async function verifyPhoneCode(){const msg=document.getElementById('phone-verification-message');try{const res=await fetch(`${BACKEND_BASE_URL}/api/auth/phone/verify-otp`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${authToken}`},body:JSON.stringify({phone:document.getElementById('verify-phone-number').value,code:document.getElementById('verify-phone-code').value})});const data=await res.json();if(!res.ok)throw new Error(data.error);currentUser=data.user;saveAuthToStorage();msg.textContent='Mobile verified. FIRST25 is now available.';msg.className='success';setTimeout(()=>{closePhoneVerification();loadCouponSuggestions();},700);}catch(err){msg.textContent=err.message||'Verification failed';msg.className='error';}}
function showOrdersLoginRequired(){
document.getElementById('orders-login-required').classList.remove('hidden');
document.getElementById('orders-empty-msg').classList.add('hidden');
document.getElementById('orders-error-msg').classList.add('hidden');
document.getElementById('orders-list-container').classList.add('hidden');
document.getElementById('orders-loading').classList.add('hidden');
}
async function fetchMyOrders() {
if (!currentUser || !currentUser.email) throw new Error('No user email available.');
const url = `${BACKEND_BASE_URL}/api/orders/my?email=${encodeURIComponent(currentUser.email)}`;
const res = await fetch(url, { headers: { 'Authorization': authToken ? `Bearer ${authToken}` : '' } });
const data = await res.json().catch(()=>({}));
if (!res.ok || !data.success) throw new Error(data.error || 'Could not fetch orders.');
return data.orders || [];
}
const PENDING_PAYMENT_STORAGE_KEY = 'ee_pending_payment_attempts_v1';
function readPendingPaymentAttempts(){try{const value=JSON.parse(localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return[];}}
function writePendingPaymentAttempts(attempts){try{localStorage.setItem(PENDING_PAYMENT_STORAGE_KEY,JSON.stringify(attempts.slice(-5)));}catch{}}
function rememberPendingPayment(payload, quote, razorpayOrderId, reason='Payment was cancelled'){
const attempt={localId:`pending-${globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}`,createdAt:new Date().toISOString(),status:'PAYMENT_CANCELLED',paymentMethod:'Razorpay',total:Number(quote?.total||payload?.total||0),items:quote?.items||[],quote,payload:{...payload,clientReference:payload.clientReference},razorpayOrderId,reason};
const attempts=readPendingPaymentAttempts().filter(item=>item.localId!==attempt.localId);attempts.push(attempt);writePendingPaymentAttempts(attempts);return attempt.localId;
}
function removePendingPayment(localId){writePendingPaymentAttempts(readPendingPaymentAttempts().filter(item=>item.localId!==localId));}
async function notifyPaymentInterrupted(razorpayOrderId, reason, localId){
try{await fetch(`${BACKEND_BASE_URL}/api/orders/payment-failed`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:authToken?`Bearer ${authToken}`:''},body:JSON.stringify({razorpayOrderId,reason})});}catch{}
if(localId){const attempts=readPendingPaymentAttempts();const index=attempts.findIndex(item=>item.localId===localId);if(index>=0){attempts[index].reason=reason;attempts[index].status=reason==='User closed Razorpay popup'?'PAYMENT_CANCELLED':'PAYMENT_FAILED';attempts[index].updatedAt=new Date().toISOString();writePendingPaymentAttempts(attempts);}}
renderOrders();
if(typeof switchPage==='function') switchPage('orders');
}
async function renderOrders() {
const renderId = ++ordersRenderSeq;
const loginReq = document.getElementById('orders-login-required'),
emptyMsg = document.getElementById('orders-empty-msg'),
errorMsg = document.getElementById('orders-error-msg'),
loadingEl = document.getElementById('orders-loading'),
listContainer = document.getElementById('orders-list-container'),
tbody = document.getElementById('orders-list');
if (!loginReq || !emptyMsg || !errorMsg || !loadingEl || !listContainer || !tbody) return;
if (!currentUser || !authToken) {
showOrdersLoginRequired();
return;
}
loginReq.classList.add('hidden');
emptyMsg.classList.add('hidden');
errorMsg.classList.add('hidden');
listContainer.classList.add('hidden');
loadingEl.classList.remove('hidden');
tbody.innerHTML = '';
try {
const fetchedOrders = await fetchMyOrders();
if (renderId !== ordersRenderSeq) return;
const pendingOrders = readPendingPaymentAttempts().map(attempt=>({...attempt,localPending:true,orderId:'',_id:attempt.localId}));
const seenOrders = new Set();
const orders = [...pendingOrders,...fetchedOrders].filter(order => {
const key = String(order._id || order.orderId || order.razorpay_order_id || JSON.stringify(order));
if (seenOrders.has(key)) return false;
seenOrders.add(key);
return true;
});
loadingEl.classList.add('hidden');
if (!orders || orders.length === 0) {
emptyMsg.classList.remove('hidden');
return;
}
listContainer.classList.remove('hidden');
orders.sort(
(a, b) =>
new Date(b.createdAt || b.date || 0) -
new Date(a.createdAt || a.date || 0)
);
const fragment = document.createDocumentFragment();
orders.forEach(order => {
const tr = document.createElement('tr');
tr.className = 'border-b border-gray-100 hover:bg-gray-50 cursor-pointer';
const dateVal = order.createdAt || order.date || new Date().toISOString();
const totalVal = order.total || 0;
const statusVal = order.status || 'Pending';
const paymentVal = order.paymentMethod || 'N/A';
const orderId = order.orderId || order._id || order.id || '—';
const dateStr = new Date(dateVal).toLocaleString('en-IN', {
dateStyle: 'medium',
timeStyle: 'short'
});
const canRetry = order.localPending || ['PAYMENT_FAILED', 'FAILED', 'PENDING_PAYMENT'].includes(statusVal);
const canCancel = order.localPending || ['PAID', 'ORDER_PLACED', 'PROCESSING', 'Processing', 'PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(statusVal);
tr.innerHTML = `
<td class="p-3 text-sm font-semibold">${order.localPending ? '<span class="text-gray-400">Not generated</span>' : orderId}</td>
<td class="p-3 text-xs text-gray-600">${dateStr}</td>
<td class="p-3 text-sm font-bold">₹${Number(totalVal).toLocaleString('en-IN')}</td>
<td class="p-3 text-xs text-gray-700">${paymentVal}</td>
<td class="p-3 text-xs">
<span
class="inline-flex px-2 py-1 rounded-full text-[10px] font-bold
${statusVal.includes('DELIVERED') ? 'bg-green-100 text-green-700' :
statusVal.includes('FAILED') ? 'bg-red-100 text-red-700' :
statusVal.includes('PENDING') ? 'bg-yellow-100 text-yellow-700' :
'bg-gray-100 text-gray-700'}">
${statusVal}
</span>
</td>
<td class="p-3 text-xs space-x-2">
${canRetry ? `<button class="retry-btn px-2 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded">Retry Payment</button>` : ''}
${canCancel ? `<button class="cancel-btn px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded">${order.localPending?'Remove':'Cancel'}</button>` : ''}
</td>
`;
if (!order.localPending) tr.addEventListener('click', () => openOrderDetails(order));
if (canRetry) {
tr.querySelector('.retry-btn').addEventListener('click', e => {
e.stopPropagation();
retryPayment(order);
});
}
if (canCancel) {
tr.querySelector('.cancel-btn').addEventListener('click', e => {
e.stopPropagation();
if(order.localPending){removePendingPayment(order.localId);renderOrders();}else cancelOrder(order._id);
});
}
fragment.appendChild(tr);
});
if (renderId !== ordersRenderSeq) return;
tbody.innerHTML = '';
tbody.appendChild(fragment);
} catch (err) {
if (renderId !== ordersRenderSeq) return;
console.error('Orders load error', err);
loadingEl.classList.add('hidden');
errorMsg.textContent = err.message || 'Could not load orders.';
errorMsg.classList.remove('hidden');
}
}
function openGuestOtpModal() {
document.getElementById('guest-otp-modal').classList.remove('hidden');
document.getElementById('guest-step-1').classList.remove('hidden'); document.getElementById('guest-step-2').classList.add('hidden');
document.getElementById('guest-send-msg').textContent = ''; document.getElementById('guest-verify-msg').textContent = '';
}
function closeGuestOtpModal() {
document.getElementById('guest-otp-modal').classList.add('hidden');
document.getElementById('guest-email').value = ''; document.getElementById('guest-phone').value = ''; document.getElementById('guest-otp').value = '';
}
async function guestSendOtp() {
const email = (document.getElementById('guest-email')?.value || '').trim().toLowerCase();
const phone = (document.getElementById('guest-phone')?.value || '').trim();
const msg = document.getElementById('guest-send-msg'); const btn = document.getElementById('btn-guest-send-otp');
if (!email) { msg.textContent = 'Please enter an email.'; msg.className = 'text-xs text-red-600'; return; }
try {
btn.disabled = true; btn.textContent = 'Sending...'; msg.textContent = ''; msg.className='';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/send-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, phone, purpose:'guest' }) });
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || 'Could not send OTP.');
msg.textContent = d.message || 'OTP sent to email.'; msg.className = 'text-xs text-green-600';
document.getElementById('guest-step-1').classList.add('hidden'); document.getElementById('guest-step-2').classList.remove('hidden');
} catch (err) {
console.error('guest send otp', err); msg.textContent = err.message || 'Failed to send OTP.'; msg.className='text-xs text-red-600';
} finally { btn.disabled = false; btn.textContent = 'Send OTP'; }
}
async function guestResendOtp() {
const email = (document.getElementById('guest-email')?.value || '').trim().toLowerCase();
if (!email) { document.getElementById('guest-verify-msg').textContent = 'Missing email.'; document.getElementById('guest-verify-msg').className='text-xs text-red-600'; return; }
try {
document.getElementById('guest-verify-msg').textContent = 'Resending...'; document.getElementById('guest-verify-msg').className='text-xs text-gray-600';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/send-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, purpose:'guest' }) });
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || 'Could not resend OTP.');
document.getElementById('guest-verify-msg').textContent = d.message || 'OTP resent.'; document.getElementById('guest-verify-msg').className='text-xs text-green-600';
} catch (err) {
console.error('guest resend', err); document.getElementById('guest-verify-msg').textContent = err.message || 'Resend failed.'; document.getElementById('guest-verify-msg').className='text-xs text-red-600';
}
}
async function guestVerifyOtp() {
const email = (document.getElementById('guest-email')?.value || '').trim().toLowerCase();
const otp = (document.getElementById('guest-otp')?.value || '').trim();
const msg = document.getElementById('guest-verify-msg');
if (!email || !otp) { msg.textContent = 'Email and OTP required.'; msg.className='text-xs text-red-600'; return; }
try {
msg.textContent = 'Verifying...'; msg.className='text-xs text-gray-600';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, otp, purpose:'guest' }) });
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || 'OTP verification failed.');
authToken = d.token || null;
currentUser = d.user || { email };
saveAuthToStorage(); updateAuthUI();
msg.textContent = 'Verified. You can now continue checkout.'; msg.className='text-xs text-green-600';
setTimeout(()=>{ closeGuestOtpModal(); switchPage('cart'); },800);
} catch (err) {
console.error('guest verify', err); msg.textContent = err.message || 'OTP verify failed.'; msg.className='text-xs text-red-600';
}
}
function confirmCodOrder(quote) {
return new Promise(resolve => {
const existing = document.getElementById('cod-confirm-modal');
if (existing) existing.remove();
const items = (quote?.items || []).map(item => `<li class="flex justify-between gap-3 py-2 border-b"><span>${escapeHtml(item.name || 'Product')} <small class="text-gray-500">${escapeHtml(item.size || '')} × ${Number(item.qty || 1)}</small></span><b>₹${(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString('en-IN')}</b></li>`).join('');
const modal = document.createElement('div');
modal.id = 'cod-confirm-modal';
modal.className = 'fixed inset-0 z-[10001] bg-black/70 flex items-center justify-center p-4';
modal.innerHTML = `<div class="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"><div class="flex items-start justify-between gap-4"><div><p class="text-xs uppercase tracking-widest text-yellow-700 font-bold">Confirm COD order</p><h3 class="text-2xl font-bold mt-1">Ready to place this order?</h3></div><button type="button" class="text-2xl text-gray-500" data-cod-cancel aria-label="Close">×</button></div><ul class="mt-5">${items || '<li>No products selected.</li>'}</ul><div class="mt-4 rounded-lg bg-gray-50 border p-4 space-y-2 text-sm"><div class="flex justify-between"><span>Subtotal</span><b>₹${Number(quote?.subtotal || 0).toLocaleString('en-IN')}</b></div><div class="flex justify-between"><span>Discount</span><b>- ₹${Number(quote?.discount || 0).toLocaleString('en-IN')}</b></div><div class="flex justify-between"><span>Shipping + COD fee</span><b>₹${(Number(quote?.shipping || 0) + Number(quote?.codFee || 0)).toLocaleString('en-IN')}</b></div><div class="flex justify-between border-t pt-2 text-lg"><span>Total payable on delivery</span><b>₹${Number(quote?.total || 0).toLocaleString('en-IN')}</b></div></div><p class="text-xs text-gray-500 mt-4">You will pay this amount when the order is delivered. Please confirm that your shipping details and products are correct.</p><div class="flex gap-3 mt-5"><button type="button" data-cod-cancel class="flex-1 border rounded-lg py-3 font-bold">Go back</button><button type="button" data-cod-confirm class="flex-1 bg-black text-yellow-400 rounded-lg py-3 font-bold">Confirm COD order</button></div></div>`;
document.body.appendChild(modal);
const finish = value => { modal.remove(); resolve(value); };
modal.querySelectorAll('[data-cod-cancel]').forEach(button => button.onclick = () => finish(false));
modal.querySelector('[data-cod-confirm]').onclick = () => finish(true);
modal.addEventListener('click', event => { if (event.target === modal) finish(false); });
});
}
async function handleCheckout(){
if (!currentUser || !authToken) {
const che = document.getElementById('checkout-email')?.value?.trim().toLowerCase();
const phone = document.getElementById('ship-phone')?.value?.trim();
document.getElementById('guest-email').value = che || '';
document.getElementById('guest-phone').value = phone || '';
openGuestOtpModal();
return;
}
const buyerEmail = (document.getElementById('checkout-email')?.value || (currentUser && currentUser.email) || '').trim().toLowerCase();
if (!buyerEmail || !/^\S+@\S+\.\S+$/.test(buyerEmail)) { alert('Please enter a valid email.'); return; }
if (cart.length === 0) { alert('Your cart is empty.'); return; }
const name = (document.getElementById('ship-name')?.value || '').trim();
const phone = (document.getElementById('ship-phone')?.value || '').trim();
const address = (document.getElementById('ship-address')?.value || '').trim();
const city = (document.getElementById('ship-city')?.value || '').trim();
const pincode = (document.getElementById('ship-pincode')?.value || '').trim();
const state = (document.getElementById('ship-state')?.value || '').trim();
if (!name || !phone || !address || !city || !pincode || !state) { alert('Please fill in all shipping details.'); return; }
const { cartValueGift } = calculateTotals();
const shippingAddress = `${address}\n${city} - ${pincode}, ${state}`;
if (authToken && currentUser) {
const checkoutAddress = { label: 'Checkout', name, phone, addressLine: address, city, pincode, state, isDefault: true };
const addresses = [checkoutAddress, ...getSavedAddresses().filter(addr => addr.addressLine !== address)].map((addr, index) => ({ ...addr, isDefault: index === 0 }));
currentUser = {
...currentUser,
name,
phone,
address: checkoutAddress,
addresses
};
saveAuthToStorage();
fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
body: JSON.stringify({ name, phone, address: currentUser.address, addresses })
}).catch(err => console.warn('Could not save checkout address', err));
}
const paymentMethod = getSelectedPaymentMethod() || 'Not Selected';
const btn = document.getElementById('checkout-btn'); const originalText = btn.textContent;
const payload = {
clientReference: (globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`),
cart: commerceCartPayload(),
freeGift: formatGift(cartValueGift),
customer: { email: buyerEmail, name, phone, address: shippingAddress },
couponCode: appliedCoupon || null,
orderType: cartHasPerfumeCard() ? 'perfume_card' : 'standard',
cardMeta: cart.find(item => item.itemType === 'perfume_card')?.cardMeta || null,
paymentMethod
};
const headers = { 'Content-Type':'application/json' }; if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
try {
btn.disabled = true; btn.textContent = 'Processing...';
if (paymentMethod === 'Cash on Delivery') {
if (cartHasPerfumeCard()) throw new Error('COD is not available for custom perfume cards.');
if (!isMumbaiCheckoutCity()) throw new Error('COD is available only for Mumbai delivery addresses.');
const quoteRes = await fetch(`${BACKEND_BASE_URL}/api/orders/quote`, { method:'POST', headers, body: JSON.stringify(payload) });
const quoteData = await quoteRes.json().catch(()=>({}));
if (!quoteRes.ok || !quoteData.success) throw new Error(quoteData.error || 'Could not calculate the order total.');
Object.assign(payload, quoteData.quote);
if (payload.total <= 0) throw new Error('Invalid total amount.');
if (!await confirmCodOrder(quoteData.quote)) return;
const res = await fetch(`${BACKEND_BASE_URL}/api/orders/cod`, { method:'POST', headers, body: JSON.stringify(payload) });
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || 'Could not place COD order.');
cart.length = 0; updateCartCount(); renderCart(); saveCartToStorage(); renderOrders(); showDeliveryEstimateModal(d.deliveryEstimate); return;
}
const quoteRes = await fetch(`${BACKEND_BASE_URL}/api/orders/quote`, { method:'POST', headers, body: JSON.stringify(payload) });
const quoteData = await quoteRes.json().catch(()=>({}));
if (!quoteRes.ok || !quoteData.success) throw new Error(quoteData.error || 'Could not calculate the order total.');
Object.assign(payload, quoteData.quote);
if (payload.total <= 0) throw new Error('Invalid total amount.');
const res = await fetch(`${BACKEND_BASE_URL}/api/orders/create-razorpay-order`, { method:'POST', headers, body: JSON.stringify(payload) });
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success || !d.razorpayOrderId) throw new Error(d.error || 'Could not start online payment.');
const pendingAttemptId=rememberPendingPayment(payload,d.quote||quoteData.quote,d.razorpayOrderId,'Payment started');
const options = {
key: d.keyId,
amount: d.amount,
currency: 'INR',
name: 'Eternal Essence',
description: 'Eternal Essence order',
image: 'https://eternalessence.in/products/ee-brand-20260819.webp',
order_id: d.razorpayOrderId,
prefill: { name, email: buyerEmail, contact: phone },
theme: { color: '#FFD700' },
handler: async function(response) {
try {
const verifyRes = await fetch(`${BACKEND_BASE_URL}/api/orders/verify-razorpay`, { method:'POST', headers, body: JSON.stringify({
razorpay_order_id: response.razorpay_order_id,
razorpay_payment_id: response.razorpay_payment_id,
razorpay_signature: response.razorpay_signature
})});
const verifyData = await verifyRes.json().catch(()=>({}));
if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error || 'Payment verification failed.');
removePendingPayment(pendingAttemptId);
cart.length = 0; updateCartCount(); renderCart(); saveCartToStorage(); renderOrders(); showDeliveryEstimateModal(verifyData.deliveryEstimate);
} catch (err) {
console.error('Verification error', err); alert(err.message || 'Payment captured but verification failed. Contact support.');
}
},
modal: {
ondismiss: async function () {
await notifyPaymentInterrupted(d.razorpayOrderId,'User closed Razorpay popup',pendingAttemptId);
}
}
};
await window.eeLoadRazorpay?.();
if (!window.Razorpay) throw new Error('Payment widget is unavailable. Please try again.');
const rzp = new Razorpay(options); rzp.open();
rzp.on('payment.failed', async function (response) {
await notifyPaymentInterrupted(d.razorpayOrderId,response.error?.description || 'Payment failed',pendingAttemptId);
alert('Payment failed. You can retry from My Orders.');
});
} catch (err) {
console.error('Checkout err', err); alert(err.message || 'Unable to start payment. Please try again.');
} finally { btn.disabled = false; btn.textContent = originalText; }
}
function getSavedAddresses() {
if (!currentUser) return [];
const list = Array.isArray(currentUser.addresses) ? currentUser.addresses.filter(addr => addr && addr.addressLine) : [];
if (list.length) return list;
return currentUser.address?.addressLine ? [{ ...currentUser.address, label: 'Home', isDefault: true }] : [];
}
function applyAddressToCheckout(address = {}) {
const set = (id, value) => {
const el = document.getElementById(id);
if (el && value) el.value = value;
};
set('ship-name', address.name || currentUser?.name);
set('ship-phone', address.phone || currentUser?.phone);
set('ship-address', address.addressLine);
set('ship-city', address.city);
set('ship-pincode', address.pincode);
set('ship-state', address.state);
updatePaymentMethodAvailability();
renderCart();
}
function fillCheckoutFromProfile() {
if (!currentUser) return;
const addresses = getSavedAddresses();
applyAddressToCheckout(addresses.find(addr => addr.isDefault) || addresses[0] || currentUser.address || {});
}
function fillCheckoutFromSavedAddress(index) {
const address = getSavedAddresses()[Number(index)];
if (address) applyAddressToCheckout(address);
}
function renderSavedAddressControls() {
const addresses = getSavedAddresses();
const savedAddressBtn = document.getElementById('use-saved-address-btn');
if (savedAddressBtn) savedAddressBtn.classList.toggle('hidden', !addresses.length);
const addressEmpty = !document.getElementById('ship-address')?.value?.trim();
if (addresses.length && addressEmpty) {
fillCheckoutFromProfile();
}
}
function populateProfile() {
if (!currentUser) return;
document.getElementById('profile-name-text').textContent = currentUser.name || '—';
document.getElementById('profile-email-text').textContent = currentUser.email || '—';
document.getElementById('profile-phone-text').textContent = currentUser.phone || '—';
const profileActions = document.getElementById('profile-name-text')?.closest('.bg-white')?.querySelector('.mt-4.space-y-2');
if (profileActions && !document.getElementById('profile-logout-btn')) {
const logoutButton = document.createElement('button');
logoutButton.id = 'profile-logout-btn';
logoutButton.type = 'button';
logoutButton.className = 'w-full border border-red-500 text-red-600 py-2 text-sm font-bold uppercase hover:bg-red-600 hover:text-white transition';
logoutButton.innerHTML = '<i class="fas fa-right-from-bracket mr-2"></i>Log Out';
logoutButton.onclick = handleLogout;
profileActions.appendChild(logoutButton);
}
renderSavedAddressControls();
renderProfileAddressList();
}
function openEditProfileModal(){
if (!currentUser) return switchPage('account');
document.getElementById('modal-profile-name').value = currentUser.name || '';
document.getElementById('modal-profile-phone').value = currentUser.phone || '';
document.getElementById('modal-profile-email').value = currentUser.email || '';
document.getElementById('modal-profile-msg').textContent = '';
document.getElementById('edit-profile-modal').classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
function closeEditProfileModal(){
document.getElementById('edit-profile-modal').classList.add('hidden');
document.body.style.overflow = 'auto';
}
function openPasswordFromProfile() {
closeEditProfileModal();
document.getElementById('fp-email').value = currentUser?.email || '';
openForgotModal();
}
async function saveProfileDetails(){
const name = document.getElementById('modal-profile-name').value.trim();
const phone = document.getElementById('modal-profile-phone').value.trim();
const msg = document.getElementById('modal-profile-msg');
try {
msg.textContent = 'Saving...';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
body: JSON.stringify({ name, phone, address: currentUser.address || {}, addresses: getSavedAddresses() })
});
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || 'Could not save');
currentUser = d.user || currentUser;
saveAuthToStorage();
populateProfile();
msg.textContent = 'Saved';
msg.className = 'text-xs text-green-700';
setTimeout(closeEditProfileModal, 500);
} catch (err) {
msg.textContent = err.message || 'Save failed';
msg.className = 'text-xs text-red-600';
}
}
function openAddressForm(addressIndex = null) {
if (!currentUser) { switchPage('account'); return; }
const address = addressIndex === null ? {} : getSavedAddresses()[Number(addressIndex)] || {};
const form = document.getElementById('profile-address-form');
const modal = document.getElementById('profile-address-modal');
const host = document.getElementById('profile-address-modal-fields');
if (!form || !modal || !host) return;
form.dataset.editIndex = addressIndex === null ? '' : String(addressIndex);
document.getElementById('profile-address-modal-title').textContent = addressIndex === null ? 'Add New Address' : 'Edit Address';
host.appendChild(form);
form.classList.remove('hidden');
document.getElementById('profile-address-label').value = address.label || 'Home';
document.getElementById('profile-address-name').value = address.name || currentUser?.name || '';
document.getElementById('profile-address-phone').value = address.phone || currentUser?.phone || '';
document.getElementById('profile-address-line').value = address.addressLine || '';
document.getElementById('profile-city').value = address.city || '';
document.getElementById('profile-pincode').value = address.pincode || '';
document.getElementById('profile-state').value = address.state || '';
const msg = document.getElementById('profile-save-msg');
if (msg) msg.textContent = '';
modal.classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
function closeAddressForm() {
const modal = document.getElementById('profile-address-modal');
const form = document.getElementById('profile-address-form');
if (modal) modal.classList.add('hidden');
if (form) form.classList.add('hidden');
document.body.style.overflow = '';
}
async function saveProfile(){
return saveProfileDetails();
}
async function saveProfileAddress() {
const editIndexRaw = document.getElementById('profile-address-form')?.dataset?.editIndex || '';
const address = {
label: document.getElementById('profile-address-label').value || 'Home',
name: document.getElementById('profile-address-name').value.trim() || currentUser?.name || '',
phone: document.getElementById('profile-address-phone').value.trim() || currentUser?.phone || '',
addressLine: document.getElementById('profile-address-line').value.trim(),
city: document.getElementById('profile-city').value.trim(),
pincode: document.getElementById('profile-pincode').value.trim(),
state: document.getElementById('profile-state').value.trim(),
isDefault: !getSavedAddresses().length
};
if (!address.addressLine || !address.city || !address.pincode || !address.state) {
document.getElementById('profile-save-msg').textContent = 'Complete address fields first';
document.getElementById('profile-save-msg').className = 'text-xs text-red-600';
return;
}
const addresses = getSavedAddresses();
if (editIndexRaw !== '') addresses[Number(editIndexRaw)] = { ...addresses[Number(editIndexRaw)], ...address };
else addresses.push(address);
await saveAddressList(addresses);
closeAddressForm();
}
async function saveAddressList(addresses) {
const msg = document.getElementById('profile-save-msg');
const selectedDefault = addresses.find(addr => addr.isDefault) || addresses[0];
addresses.forEach(addr => { addr.isDefault = addr === selectedDefault; });
try {
msg.textContent = 'Saving addresses...';
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/me`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
body: JSON.stringify({
name: currentUser?.name || '',
phone: currentUser?.phone || '',
address: selectedDefault,
addresses
})
});
const d = await res.json().catch(()=>({}));
if (!res.ok || !d.success) throw new Error(d.error || 'Could not save addresses');
currentUser = d.user || currentUser;
saveAuthToStorage();
populateProfile();
msg.textContent = 'Address saved';
msg.className = 'text-sm ml-2 text-green-700';
} catch (err) {
msg.textContent = err.message || 'Address save failed';
msg.className = 'text-xs text-red-600';
}
}
function renderProfileAddressList() {
const box = document.getElementById('profile-address-list');
if (!box) return;
const addresses = getSavedAddresses();
box.innerHTML = addresses.length ? addresses.map((addr, index) => `
<div class="border rounded p-3 text-sm flex items-start justify-between gap-3">
<div>
<div class="font-bold">${escapeHtml(addr.label || `Address ${index + 1}`)} ${addr.isDefault ? '<span class="text-[10px] text-green-700">(Default)</span>' : ''}</div>
<div class="text-gray-600">${escapeHtml([addr.addressLine, addr.city, addr.pincode, addr.state].filter(Boolean).join(', '))}</div>
</div>
<div class="flex gap-2">
<button onclick="openAddressForm(${index})" class="text-xs border px-2 py-1 rounded">Edit</button>
<button onclick="setDefaultAddress(${index})" class="text-xs border px-2 py-1 rounded">Default</button>
<button onclick="removeSavedAddress(${index})" class="text-xs border border-red-200 text-red-600 px-2 py-1 rounded">Remove</button>
</div>
</div>
`).join('') : '<p class="text-xs text-gray-500">No saved addresses yet.</p>';
}
function setDefaultAddress(index) {
const addresses = getSavedAddresses().map((addr, i) => ({ ...addr, isDefault: i === index }));
saveAddressList(addresses);
}
function removeSavedAddress(index) {
const addresses = getSavedAddresses().filter((_, i) => i !== index);
if (addresses.length && !addresses.some(addr => addr.isDefault)) addresses[0].isDefault = true;
saveAddressList(addresses);
}
function openAddressSelectModal() {
const addresses = getSavedAddresses();
const box = document.getElementById('checkout-address-options');
if (!addresses.length) return;
box.innerHTML = addresses.map((addr, index) => `
<button onclick="selectCheckoutAddress(${index})" class="w-full text-left border rounded p-3 hover:border-yellow-500 ${addr.isDefault ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}">
<div class="flex items-center justify-between gap-3">
<strong>${escapeHtml(addr.label || `Address ${index + 1}`)}</strong>
${addr.isDefault ? '<span class="text-[10px] text-green-700 font-bold">Default</span>' : ''}
</div>
<div class="text-xs text-gray-600 mt-1">${escapeHtml(addr.name || '')} ${addr.phone ? `- ${escapeHtml(addr.phone)}` : ''}</div>
<div class="text-sm text-gray-700 mt-1">${escapeHtml([addr.addressLine, addr.city, addr.pincode, addr.state].filter(Boolean).join(', '))}</div>
</button>
`).join('');
document.getElementById('address-select-modal').classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
function closeAddressSelectModal() {
document.getElementById('address-select-modal').classList.add('hidden');
document.body.style.overflow = 'auto';
}
function selectCheckoutAddress(index) {
fillCheckoutFromSavedAddress(index);
closeAddressSelectModal();
}
function showDeliveryEstimateModal(deliveryEstimate) {
const msg = deliveryEstimate?.message || 'Your order has been confirmed. You will receive updates by email.';
document.getElementById('delivery-estimate-text').textContent = msg;
document.getElementById('delivery-estimate-modal').classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
function closeDeliveryEstimateModal() {
document.getElementById('delivery-estimate-modal').classList.add('hidden');
document.body.style.overflow = 'auto';
switchPage('orders');
}
function changePassword(){ openEditProfileModal(); }
function cancelChangePassword(){ closeEditProfileModal(); }
async function fetchPincodeDetails(pin, context='checkout') {
if (!pin || pin.length < 6) return;
try {
const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`);
const data = await res.json();
if (!Array.isArray(data) || data.length === 0) return;
const item = data[0];
if (item.Status !== 'Success' || !item.PostOffice || item.PostOffice.length === 0) return;
const po = item.PostOffice[0];
const city = po.District || '';
const state = po.State || '';
if (context === 'checkout') {
document.getElementById('ship-city').value = city;
document.getElementById('ship-state').value = state;
updatePaymentMethodAvailability();
renderCart();
} else if (context === 'profile') {
document.getElementById('profile-city').value = city;
document.getElementById('profile-state').value = state;
}
} catch (err) {
console.warn('pincode fetch err', err);
}
}
function setupPincodeListeners(){
const shipPin = document.getElementById('ship-pincode');
if (shipPin) {
shipPin.addEventListener('blur', ()=>fetchPincodeDetails(shipPin.value.trim(), 'checkout'));
shipPin.addEventListener('input', ()=>{ if (shipPin.value.trim().length===6) fetchPincodeDetails(shipPin.value.trim(), 'checkout'); });
}
const shipCity = document.getElementById('ship-city');
if (shipCity) {
shipCity.addEventListener('input', () => { updatePaymentMethodAvailability(); renderCart(); });
shipCity.addEventListener('blur', () => { updatePaymentMethodAvailability(); renderCart(); });
}
document.querySelectorAll('input[name="payment-method"]').forEach(input => input.addEventListener('change', renderCart));
const profilePin = document.getElementById('profile-pincode');
if (profilePin) {
profilePin.addEventListener('blur', ()=>fetchPincodeDetails(profilePin.value.trim(), 'profile'));
profilePin.addEventListener('input', ()=>{ if (profilePin.value.trim().length===6) fetchPincodeDetails(profilePin.value.trim(), 'profile'); });
}
}
const _orderStatusSnapshot = new Map();
let _ordersPollerInterval = null;
async function fetchOrdersForChanges() {
if (!currentUser || !authToken) return;
if (document.getElementById('page-orders').classList.contains('hidden')) return;
try {
const url = `${BACKEND_BASE_URL}/api/orders/my?email=${encodeURIComponent(currentUser.email)}`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
const data = await res.json().catch(()=>({}));
if (!res.ok || !data.success) return;
const orders = data.orders || [];
const changed = [];
orders.forEach(o => {
const id = o._id || o.orderId;
const newStatus = (o.status || 'Pending').toString();
const oldStatus = _orderStatusSnapshot.get(id);
if (oldStatus && oldStatus !== newStatus) {
changed.push({ id, oldStatus, newStatus, order: o });
}
_orderStatusSnapshot.set(id, newStatus);
});
orders.forEach(o => {
const id = o._id || o.orderId || o.id;
const span = document.getElementById(`order-status-${id}`);
if (span) {
span.textContent = o.status || 'Pending';
span.className = 'inline-flex px-2 py-1 rounded-full text-[10px] font-bold ' +
((o.status||'').toLowerCase().includes('success') ? 'bg-green-100 text-green-700' :
(o.status||'').toLowerCase().includes('pending') ? 'bg-yellow-100 text-yellow-700' :
(o.status||'').toLowerCase().includes('cancel') ? 'bg-red-100 text-red-700' :
'bg-gray-100 text-gray-700');
}
});
if (changed.length > 0) {
const notif = document.createElement('div');
notif.className = 'fixed bottom-6 right-6 bg-yellow-500 text-black px-4 py-2 rounded shadow-lg z-60';
const list = changed.map(c => `Order ${c.id}: ${c.oldStatus} → ${c.newStatus}`).join('<br>');
notif.innerHTML = `<strong>Order update</strong><div class="text-sm mt-1">${list}</div>`;
document.body.appendChild(notif);
setTimeout(()=>{ notif.remove(); }, 7000);
renderOrders();
}
} catch (err) {
}
}
function startOrdersPoller(){
if (_ordersPollerInterval) return;
_ordersPollerInterval = setInterval(fetchOrdersForChanges, 18000);
setTimeout(fetchOrdersForChanges, 500);
}
function stopOrdersPoller(){
if (_ordersPollerInterval) { clearInterval(_ordersPollerInterval); _ordersPollerInterval = null; }
}
document.getElementById('contact-form')?.addEventListener('submit', async function (e) {
e.preventDefault();
const name = document.getElementById('contact-name').value.trim();
const email = document.getElementById('contact-email').value.trim();
const message = document.getElementById('contact-message').value.trim();
const msgEl = document.getElementById('contact-msg');
msgEl.textContent = '';
msgEl.className = 'text-sm mt-2';
if (!name || !email || !message) {
msgEl.textContent = 'Please fill in all fields.';
msgEl.classList.add('text-red-600');
return;
}
try {
msgEl.textContent = 'Sending message...';
msgEl.classList.add('text-gray-500');
const res = await fetch(`${BACKEND_BASE_URL}/api/contact`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name, email, message })
});
const data = await res.json().catch(() => ({}));
if (!res.ok || !data.success) {
throw new Error(data.error || 'Failed to send message');
}
msgEl.textContent = data.message || 'Message sent successfully.';
msgEl.className = 'text-sm mt-2 text-green-600';
document.getElementById('contact-name').value = '';
document.getElementById('contact-email').value = '';
document.getElementById('contact-message').value = '';
} catch (err) {
console.error('contact submit error', err);
msgEl.textContent = err.message || 'Could not send message.';
msgEl.className = 'text-sm mt-2 text-red-600';
}
});
async function retryPayment(orderOrId) {
if (orderOrId?.localPending) {
const pending=orderOrId;
const payload={...(pending.payload||{}),clientReference:(globalThis.crypto?.randomUUID?.()||`checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`)};
try {
removePendingPayment(pending.localId);
const res=await fetch(`${BACKEND_BASE_URL}/api/orders/create-razorpay-order`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:authToken?`Bearer ${authToken}`:''},body:JSON.stringify(payload)});
const data=await res.json().catch(()=>({}));
if(!res.ok||!data.success||!data.razorpayOrderId)throw new Error(data.error||'Retry failed');
const attemptId=rememberPendingPayment(payload,data.quote||pending.quote,data.razorpayOrderId,'Retry payment started');
const options={key:data.keyId,amount:data.amount,currency:'INR',name:'Eternal Essence',description:'Eternal Essence order',image:'https://eternalessence.in/products/ee-brand-20260819.webp',order_id:data.razorpayOrderId,prefill:{name:payload.customer?.name,email:payload.customer?.email,contact:payload.customer?.phone},theme:{color:'#FFD700'},handler:async response=>{try{const verifyRes=await fetch(`${BACKEND_BASE_URL}/api/orders/verify-razorpay`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:authToken?`Bearer ${authToken}`:''},body:JSON.stringify({razorpay_order_id:response.razorpay_order_id,razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature})});const verify=await verifyRes.json().catch(()=>({}));if(!verifyRes.ok||!verify.success)throw new Error(verify.error||'Payment verification failed');removePendingPayment(attemptId);renderOrders();showDeliveryEstimateModal(verify.deliveryEstimate);}catch(error){alert(error.message||'Payment verification failed.');}},modal:{ondismiss:()=>notifyPaymentInterrupted(data.razorpayOrderId,'User closed Razorpay popup',attemptId)}};
await window.eeLoadRazorpay?.();
if(!window.Razorpay)throw new Error('Payment widget is unavailable. Please try again.');
const rzp=new Razorpay(options);rzp.open();rzp.on('payment.failed',response=>{notifyPaymentInterrupted(data.razorpayOrderId,response.error?.description||'Payment failed',attemptId);alert('Payment failed. You can retry again from My Orders.');});
} catch(err){writePendingPaymentAttempts([...readPendingPaymentAttempts(),pending]);alert(err.message||'Unable to retry payment right now.');}
return;
}
const orderId=orderOrId?._id||orderOrId;
fetch(`${BACKEND_BASE_URL}/api/orders/retry/${orderId}`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': authToken ? `Bearer ${authToken}` : ''
}
})
.then(res => {
if (!res.ok) throw new Error('Retry failed');
return res.json();
})
.then(async data => {
if (!data.success) {
alert(data.error || 'Retry not allowed');
return;
}
const options = {
key: data.keyId,
amount: data.amount,
currency: 'INR',
name: 'Eternal Essence',
image: 'https://eternalessence.in/products/ee-brand-20260819.webp',
order_id: data.razorpayOrderId,
handler: function (response) {
alert('Payment successful. Please refresh orders.');
}
};
await window.eeLoadRazorpay?.();
if(!window.Razorpay)throw new Error('Payment widget is unavailable. Please try again.');
const rzp = new Razorpay(options);
rzp.open();
})
.catch(err => {
console.error(err);
alert('Unable to retry payment right now.');
});
}
async function cancelOrder(orderId) {
if (!confirm('Are you sure you want to cancel this order?')) return;
try {
const res = await fetch(`${BACKEND_BASE_URL}/api/orders/cancel/${orderId}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': authToken ? `Bearer ${authToken}` : '' }
});
const d = await res.json();
if (!d.success) throw new Error(d.error);
alert('Order cancelled');
renderOrders();
} catch (err) {
alert(err.message || 'Cancel failed');
}
}
function cleanCollectionPath(cat){
const value = String(cat || 'all').trim();
const key = normalize(value);
if (!value || key === 'all') return '/collections';
if (key.includes('attar')) return '/collections/attars';
if (key.includes('perfume')) return '/collections/perfumes';
let slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (slug && !slug.endsWith('s')) slug += 's';
return `/collections/${slug}`;
}
function setCategory(cat, skipURL = false){
if (normalize(cat) === 'combo') {
history.replaceState({}, "", "#custom-set");
switchPage('custom-set');
return;
}
activeCategory = cat;
document.querySelectorAll(".cat-btn").forEach(btn=>{
btn.classList.toggle("active", normalize(btn.dataset.cat) === normalize(cat));
});
applyFilters();
if(!skipURL){
history.pushState({}, "", cleanCollectionPath(cat));
window.dispatchEvent(new CustomEvent('ee:route',{detail:{path:location.pathname}}));
}
}
const ALLOWED_PAGES = ['home','custom-set','perfume-card','about','contact','cart','orders','account','profile'];
const PRIVATE_PAGES = ['cart','orders','profile','account'];
const isFreshSession = !sessionStorage.getItem('ee_loaded');
sessionStorage.setItem('ee_loaded', '1');
function getPage(){
return location.hash.split("?")[0].replace("#","") || "home";
}
function router(){
const page = getPage();
switchPage(page);
if(page === "home"){
setTimeout(restoreCategoryFromURL, 50);
}
}
window.addEventListener("hashchange", ()=>{
const { page } = getHashRoute();
switchPage(page);
restoreCategoryFromURL();
});
window.addEventListener("popstate", () => {
const { page } = getHashRoute();
switchPage(page);
});
window.addEventListener("load", ()=>{
const { page } = getHashRoute();
switchPage(page);
restoreCategoryFromURL();
});
router();
function resetFilters() {
const searchInput = document.getElementById('search-input');
const genderFilter = document.getElementById('gender-filter');
const seasonFilter = document.getElementById('season-filter');
const timeFilter = document.getElementById('time-filter');
const sortFilter = document.getElementById('sort-filter');
if (searchInput) searchInput.value = '';
if (genderFilter) genderFilter.value = '';
if (seasonFilter) seasonFilter.value = '';
if (timeFilter) timeFilter.value = '';
if (sortFilter) sortFilter.value = '';
activeCategory = 'all';
localStorage.removeItem(CATEGORY_STORAGE_KEY);
document.querySelectorAll('.cat-btn').forEach(b =>
b.classList.remove('active')
);
document.querySelector('.cat-btn')?.classList.add('active');
applyFilters();
}
let isSyncingFromURL = false;
function restoreCategoryFromURL(){
if(isSyncingFromURL) return;
const { page, query } = getHashRoute();
if(page !== "home") return;
const params = new URLSearchParams(query);
const cat = params.get("cat");
if(cat){
isSyncingFromURL = true;
setCategory(cat, true);
isSyncingFromURL = false;
}
}
function restoreCategoryIfAny(){
restoreCategoryFromURL();
}
function normalize(val){
return (val || '').toLowerCase().replace(/\s+/g,'');
}
function applyFilters() {
let filtered = [...allProducts];
if (activeCategory !== 'all') {
const cat = normalize(activeCategory);
filtered = filtered.filter(p =>
normalize(p.type || p.category) === cat
);
}
const gender = document.getElementById('gender-filter')?.value || '';
if (gender) filtered = filtered.filter(p => p.gender === gender);
const season = document.getElementById('season-filter')?.value || '';
if (season) {
filtered = filtered.filter(p =>
normalize(p.season) === normalize(season)
);
}
const time = document.getElementById('time-filter')?.value || '';
if (time) {
filtered = filtered.filter(p =>
normalize(p.time) === normalize(time)
);
}
const q = (document.getElementById('search-input')?.value || '').toLowerCase();
if (q) {
filtered = filtered.filter(p =>
p.name.toLowerCase().includes(q) ||
(p.inspiredBy || '').toLowerCase().includes(q) ||
(p.family || '').toLowerCase().includes(q)
);
}
const sort = document.getElementById('sort-filter')?.value || '';
if (sort === 'price-asc') filtered.sort((a,b)=>a.price-b.price);
if (sort === 'price-desc') filtered.sort((a,b)=>b.price-a.price);
if (sort === 'name-asc') filtered.sort((a,b)=>a.name.localeCompare(b.name));
renderProducts(filtered);
}
function renderFilteredProducts(list) {
const grid = document.getElementById('product-grid');
grid.innerHTML = '';
if (!list.length) {
grid.innerHTML = `<p class="col-span-full text-center text-gray-500">No products found.</p>`;
return;
}
list.forEach(product => {
const pricing = getPricing(product.price, 1, product.mrp);
const card = document.createElement('div');
card.className = 'product-card bg-white cursor-pointer';
card.onclick = () => openModal(product);
card.innerHTML = `
<div class="aspect-[4/5] bg-gray-100">
<img src="${product.image}" class="w-full h-full object-cover">
</div>
<div class="p-4 text-center">
<p class="text-xs text-gray-500">${product.type}</p>
<h3 class="brand-font font-bold">${product.name}</h3>
<div class="mt-2">
<div class="text-xl font-bold text-yellow-600">
₹${pricing.sellingPrice.toLocaleString("en-IN")}
</div>
<div class="flex justify-center items-center gap-2 mt-1">
<span class="text-gray-400 line-through text-sm">
₹${pricing.mrp.toLocaleString("en-IN")}
</span>
<span class="bg-green-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">
${pricing.discount}% OFF
</span>
</div>
</div>
</div>
`;
grid.appendChild(card);
});
}
function goToCategory(cat){
closeMenus();
history.pushState({}, "", `#home?cat=${encodeURIComponent(cat)}`);
switchPage("home");
restoreCategoryFromURL();
}
let selectedRating = 0;
function renderStarSelector() {
const container = document.getElementById('review-stars');
if (!container) return;
container.innerHTML = '';
for (let i = 1; i <= 5; i++) {
const star = document.createElement('i');
star.className = 'fas fa-star review-star';
star.setAttribute('role', 'button');
star.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
star.onmouseenter = () => paintReviewStars(i, true);
star.onmouseleave = () => paintReviewStars(selectedRating || 5, false);
star.onclick = () => {
selectedRating = i;
document.getElementById('review-rating').value = String(i);
paintReviewStars(i, false);
};
container.appendChild(star);
}
paintReviewStars(selectedRating || 5, false);
}
function paintReviewStars(count, hover = false) {
const container = document.getElementById('review-stars');
if (!container) return;
[...container.children].forEach((star, idx) => {
star.classList.toggle('active', idx < count);
star.classList.toggle('hovered', hover && idx < count);
});
}
async function submitReview() {
if (!reviewProductId) {
alert('Invalid product');
return;
}
const rating = Number(document.getElementById('review-rating').value || selectedRating || 5);
const comment = document.getElementById('review-comment').value.trim();
const msg = document.getElementById('review-msg');
try {
const res = await fetch(
`${BACKEND_BASE_URL}/api/reviews/${reviewProductId}`,
{
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${authToken}`
},
body: JSON.stringify({ rating, comment })
}
);
const data = await res.json();
if (!res.ok || !data.success) {
throw new Error(data.error || 'Failed to add review');
}
msg.textContent = 'Review submitted';
msg.className = 'text-green-600 text-xs';
setTimeout(closeReviewModal, 800);
} catch (err) {
msg.textContent = err.message;
msg.className = 'text-red-500 text-xs';
}
}
function getHashRoute(){
const hash = location.hash.substring(1);
const [page, query] = hash.split("?");
return { page: page || "home", query: query || "" };
}
async function loadBundleRules() {
try {
const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/products/bundle-rules`);
const data = await res.json().catch(() => ({}));
bundleRules = data.success && Array.isArray(data.rules) && data.rules.length
? data.rules
: DEFAULT_BUNDLE_RULES;
} catch (err) {
bundleRules = DEFAULT_BUNDLE_RULES;
}
}
function getProductIdFromURL() {
const searchParams = new URLSearchParams(window.location.search);
const searchProduct = searchParams.get("product");
if (searchProduct) return searchProduct;
const { query } = getHashRoute();
const hashParams = new URLSearchParams(query);
return hashParams.get("product");
}
function findProductByAnyId(id) {
const requested = String(id || '');
const cleanRequested = requested.replace(/^db_/, '');
return allProducts.find(p => {
const possibleIds = [
p.id,
p._id,
String(p.id || '').replace(/^db_/, ''),
String(p._id || '').replace(/^db_/, '')
].map(String);
return possibleIds.includes(requested) || possibleIds.includes(cleanRequested);
});
}
function renderReviews(reviews) {
const box = document.getElementById('reviews-container');
if (!reviews.length) {
box.innerHTML = `<p class="text-sm text-gray-500">No reviews yet.</p>`;
return;
}
box.innerHTML = reviews.map(r => `
<div class="border-b py-3">
<div class="flex items-center gap-2">
${'â˜…'.repeat(r.rating)}${'â˜†'.repeat(5 - r.rating)}
<span class="text-xs text-gray-500">${r.userEmail}</span>
</div>
<p class="text-sm mt-1">${r.comment || ''}</p>
</div>
`).join('');
}
async function loadReviews(productId) {
const list = document.getElementById('reviews-list');
if (!list) return;
list.innerHTML = '<div class="text-gray-400 py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading reviews...</div>';
try {
const cleanId = String(productId).replace('db_', '');
const res = await fetch(`${BACKEND_BASE_URL}/api/reviews/${cleanId}`);
const data = await res.json();
if (!data.success || !data.reviews || data.reviews.length === 0) {
list.innerHTML = '<p class="text-gray-400 italic py-4 border-t border-gray-100">No reviews yet for this fragrance. Be the first to review!</p>';
return;
}
const avg = data.reviews.reduce((a, r) => a + r.rating, 0) / data.reviews.length;
let reviewsHtml = `
<div class="flex items-center gap-4 mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
<div class="text-3xl font-bold text-yellow-600">${avg.toFixed(1)}</div>
<div>
<div class="text-yellow-500 text-sm">${'★'.repeat(Math.round(avg))}</div>
<div class="text-xs text-gray-500">Based on ${data.reviews.length} reviews</div>
</div>
</div>
`;
reviewsHtml += data.reviews.map(r => `
<div class="border-b border-gray-100 pb-4 mb-4">
<div class="flex justify-between items-center mb-1">
<span class="font-bold text-gray-800 text-sm">${r.userEmail.split('@')[0]}</span>
<span class="text-[10px] text-gray-400">${new Date(r.createdAt).toLocaleDateString()}</span>
</div>
<div class="text-yellow-500 text-[10px] mb-2">${'★'.repeat(r.rating)}</div>
<p class="text-gray-600 leading-relaxed">${r.comment}</p>
</div>
`).join('');
list.innerHTML = reviewsHtml;
} catch (err) {
list.innerHTML = '<p class="text-red-400">Unable to load reviews at this moment.</p>';
}
}
function displayOrderStatus(status) {
return ({ PENDING_PAYMENT: 'Payment Pending', PAYMENT_FAILED: 'Payment Failed', ORDER_PLACED: 'Order Placed', PROCESSING: 'Processing', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', PAID: 'Order Placed', Shipped: 'Dispatched', Delivered: 'Delivered', Cancelled: 'Cancelled', Processing: 'Processing' })[status] || status || 'Payment Pending';
}
function orderStage(status) {
return ({ PENDING_PAYMENT: 0, PAYMENT_FAILED: 0, PAID: 2, ORDER_PLACED: 2, Processing: 3, PROCESSING: 3, Shipped: 4, DISPATCHED: 4, Delivered: 5, DELIVERED: 5 })[status] || 0;
}
function orderFlowHtml(order) {
if (['CANCELLED', 'REJECTED'].includes(String(order.status || '').toUpperCase())) return `<div class="mb-5 rounded border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">${String(order.status).toUpperCase() === 'REJECTED' ? `Order Rejected${order.rejectionReason ? `: ${escapeHtml(order.rejectionReason)}` : ''}` : 'Order Cancelled'}</div>`;
const stage = orderStage(order.status);
const steps = [order.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'Payment Done', 'Order Placed', 'Processing', 'Dispatched', 'Delivered'];
return `<div class="mb-5 overflow-x-auto"><div class="flex min-w-[540px] items-center">${steps.map((step, index) => `<div class="flex flex-1 items-center last:flex-none"><div class="text-center"><div class="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index + 1 <= stage ? 'bg-yellow-500 text-black' : 'bg-gray-200 text-gray-500'}">${index + 1 <= stage ? '✓' : index + 1}</div><div class="mt-1 whitespace-nowrap text-[10px] font-bold ${index + 1 <= stage ? 'text-gray-800' : 'text-gray-400'}">${step}</div></div>${index < steps.length - 1 ? `<div class="mx-2 h-1 flex-1 ${index + 1 < stage ? 'bg-yellow-500' : 'bg-gray-200'}"></div>` : ''}</div>`).join('')}</div></div>`;
}
function cleanShippingAddress(order) {
const lines = String(order.shippingAddress || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
if (lines[0] === String(order.name || '').trim()) lines.shift();
if (/^phone\s*:/i.test(lines[0] || '') || lines[0] === String(order.phone || '').trim()) lines.shift();
return lines.join('\n');
}
function openOrderDetails(order) {
const modal = document.getElementById('order-details-modal');
const body = document.getElementById('order-details-body');
if (!modal || !body) {
console.error('Order modal HTML missing');
return;
}
const isDelivered =
String(order.status).toUpperCase().includes('DELIVERED');
const detailStatus = String(order.status || '').toUpperCase();
const canRetryPayment = ['PAYMENT_FAILED', 'FAILED', 'PENDING_PAYMENT'].includes(detailStatus);
const canCancelOrder = ['PAID', 'ORDER_PLACED', 'PROCESSING', 'PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(detailStatus);
const trackingHtml = (order.deliveryPartner || order.awb || order.trackingOrderId) ? `
<div class="bg-gray-50 border rounded p-3 text-sm mb-4">
<div class="font-bold mb-1">Courier Details</div>
${order.trackingOrderId ? `<div>Courier Order ID: <strong>${escapeHtml(order.trackingOrderId)}</strong></div>` : ''}
${order.deliveryPartner ? `<div>Delivery Partner: <strong>${escapeHtml(order.deliveryPartner)}</strong></div>` : ''}
${order.awb ? `<div>AWB: <strong>${escapeHtml(order.awb)}</strong></div>` : ''}
</div>` : '';
const supportHtml = (order.supportRequests || []).length
? `<div class="mb-4 text-xs bg-yellow-50 border border-yellow-200 rounded p-3"><div class="font-bold mb-1">Your support queries</div>${order.supportRequests.map(r => `<div class="mb-2 border-b border-yellow-200 pb-2">${escapeHtml(r.message || '')} <span class="text-gray-500">(${escapeHtml(r.status || 'Open')})</span>${r.reply ? `<div class="mt-1 rounded bg-white p-2"><strong>Admin reply:</strong> ${escapeHtml(r.reply)}</div>` : ''}</div>`).join('')}</div>`
: '';
body.innerHTML = `
<h3 class="text-lg font-bold mb-2">
Order ${order.orderId || order._id}
</h3>
${orderFlowHtml(order)}
<p class="text-sm mb-4">Current status: <span class="font-bold ${isDelivered ? 'text-green-600' : 'text-gray-600'}">${displayOrderStatus(order.status)}</span></p>
<p class="text-xs mb-4 rounded border border-red-100 bg-red-50 p-2 text-red-700 font-semibold">Cancellation is available only before dispatch/shipping.</p>
${trackingHtml}
${supportHtml}
<div class="flex flex-wrap gap-2 mb-4">
${canRetryPayment ? `<button onclick="retryPayment('${order._id}')" class="px-3 py-2 bg-yellow-500 text-black text-xs font-bold rounded hover:bg-black hover:text-yellow-500">Retry Payment</button>` : ''}
${canCancelOrder ? `<button onclick="cancelOrder('${order._id}')" class="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">Cancel Order</button>` : ''}
<button onclick='openSupportModal(${JSON.stringify(order.orderId || order._id)}, ${JSON.stringify((order.items || []).map(item => item.name).filter(Boolean).join(', '))})' class="px-3 py-2 border border-yellow-500 text-yellow-700 text-xs font-bold rounded hover:bg-yellow-500 hover:text-black">Support Query</button>
${isDelivered ? `<button onclick="downloadOrderInvoice('${order._id || order.orderId}')" class="px-3 py-2 bg-black text-white text-xs font-bold rounded hover:bg-yellow-500 hover:text-black">Download Invoice</button>` : ''}
</div>
<div class="space-y-4">
${(order.items || []).map(item => `
<div class="flex gap-4 border p-3 rounded">
${item.itemType === 'perfume_card' && item.cardMeta
? renderPerfumeCardVisual(item.cardMeta, true)
: item.itemType === 'bundle' && item.bundleMeta
? renderCustomSetVisual((item.bundleMeta.items || []).map(p => ({ product: { ...p, image: p.image, images: [p.image], name: p.name, bottleImage: p.bottleImage }, qty: p.qty })), item.bundleMeta.previewSizeMl || item.bundleMeta.sizeMl || 8, true)
: `<img src="${item.image}" class="w-16 h-16 object-cover rounded">`}
<div class="flex-1">
<p class="font-semibold">${item.name}</p>
<p class="text-xs text-gray-500">${item.size || ''}</p>
${
isDelivered
? `
<button
class="mt-2 px-3 py-1 bg-black text-white text-xs rounded"
onclick="openReviewModal('${item.productId}')">
Write Review
</button>`
: `
<p class="mt-2 text-[11px] text-gray-400">
Review available after delivery
</p>`
}
</div>
</div>
`).join('')}
</div>
`;
modal.classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
function openSupportModal(orderId, productNames = '') {
document.getElementById('support-order-id').value = orderId;
document.getElementById('support-product-names').value = productNames;
document.getElementById('support-query-text').value = '';
document.getElementById('support-topic').value = '';
document.getElementById('support-quick-answer').classList.add('hidden');
document.getElementById('support-image-enabled').checked = false;
document.getElementById('support-query-image').value = '';
document.getElementById('support-query-image').classList.add('hidden');
document.getElementById('support-image-preview').classList.add('hidden');
updateSupportEmailLink();
document.getElementById('support-query-msg').textContent = '';
document.getElementById('support-query-modal').classList.remove('hidden');
}
function toggleSupportImageInput() {
document.getElementById('support-query-image').classList.toggle('hidden', !document.getElementById('support-image-enabled').checked);
}
function previewSupportImage() {
const file = document.getElementById('support-query-image').files?.[0];
if (!file) return;
if (file.size > 2 * 1024 * 1024) { alert('Please choose an image smaller than 2 MB.'); document.getElementById('support-query-image').value = ''; return; }
const reader = new FileReader();
reader.onload = () => { const preview = document.getElementById('support-image-preview'); preview.src = reader.result; preview.classList.remove('hidden'); };
reader.readAsDataURL(file);
}
function updateSupportEmailLink() {
const orderId = document.getElementById('support-order-id').value || 'your order';
const productNames = document.getElementById('support-product-names').value || 'Not available';
const topic = document.getElementById('support-topic').value || 'Support query';
const body = `Order ID: ${orderId}\nProducts: ${productNames}\nQuery: ${topic}\n\nPlease describe how we can help:`;
document.getElementById('support-email-link').href = `mailto:eternalessencefragrances@gmail.com?subject=${encodeURIComponent(`Support request for ${orderId}`)}&body=${encodeURIComponent(body)}`;
}
function showSupportAnswer() {
const topic = document.getElementById('support-topic').value;
const answers = {
'Where is my order?': 'Open this order to see its live progress. Once dispatched, the delivery partner and AWB are shown here.',
'When will my order be delivered?': 'Your delivery estimate is confirmed after the order is dispatched. You can follow the status flow on this order.',
'How do I track my dispatched order?': 'When your order is dispatched, its delivery partner and AWB appear in the Courier Details section of this order.',
'How do I cancel my order?': 'You can cancel from My Orders until the order is dispatched. After dispatch, please contact support for help.',
'My payment failed. How do I retry?': 'Open My Orders and use Retry next to the failed or pending payment to securely try again.',
'I received a damaged or incorrect item.': 'Please submit this query with a short description and photos if possible. Our support team will help you.'
};
const answer = document.getElementById('support-quick-answer');
answer.textContent = answers[topic] || '';
answer.classList.toggle('hidden', !answers[topic]);
if (topic && !document.getElementById('support-query-text').value.trim()) document.getElementById('support-query-text').value = topic;
updateSupportEmailLink();
}
function closeSupportModal() {
document.getElementById('support-query-modal').classList.add('hidden');
}
async function submitSupportQuery() {
const orderId = document.getElementById('support-order-id').value;
const message = document.getElementById('support-query-text').value.trim() || document.getElementById('support-topic').value;
const msg = document.getElementById('support-query-msg');
if (!message) {
msg.textContent = 'Please write your query first.';
msg.className = 'text-xs mt-2 text-red-600';
return;
}
try {
const file = document.getElementById('support-query-image').files?.[0];
const imageData = file ? await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }) : '';
const res = await fetch(`${BACKEND_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/support`, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
body: JSON.stringify({ message, imageData, imageName: file?.name || '' })
});
const data = await res.json().catch(()=>({}));
if (!res.ok || !data.success) throw new Error(data.error || 'Could not submit query');
msg.textContent = 'Support query submitted.';
msg.className = 'text-xs mt-2 text-green-700';
showToast('Support query submitted.');
setTimeout(closeSupportModal, 500);
closeOrderModal();
renderOrders();
} catch (err) {
msg.textContent = err.message || 'Could not submit support query.';
msg.className = 'text-xs mt-2 text-red-600';
}
}
async function downloadOrderInvoice(orderId) {
try {
const orders = await fetchMyOrders();
const order = orders.find(o => String(o._id) === String(orderId) || String(o.orderId) === String(orderId));
if (!order) throw new Error('Order not found');
await generateOrderInvoicePDF(order);
} catch (err) {
alert(err.message || 'Could not generate invoice.');
}
}
async function generateOrderInvoicePDF(order) {
await window.eeLoadPdfEngine?.();
if (!window.jspdf?.jsPDF) throw new Error('Invoice generator is still loading. Try again in a moment.');
const doc = new window.jspdf.jsPDF();
const pageWidth = doc.internal.pageSize.getWidth();
const gold = [212, 175, 55];
const textDark = [50, 50, 50];
doc.setFont('times', 'bold');
doc.setFontSize(26);
doc.setTextColor(...gold);
doc.text('ETERNAL ESSENCE', 15, 24);
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(100, 100, 100);
doc.text('Mumbai, Maharashtra 400011', 15, 36);
doc.text('Phone: +91 7303862657 | Insta: @eternal_essense', 15, 42);
doc.setFontSize(22);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...gold);
doc.text('INVOICE', pageWidth - 14, 26, { align: 'right' });
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...textDark);
doc.text(`No: ${order.orderId || order._id}`, pageWidth - 14, 34, { align: 'right' });
doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}`, pageWidth - 14, 40, { align: 'right' });
doc.setDrawColor(...gold);
doc.line(14, 48, pageWidth - 14, 48);
doc.setFont('helvetica', 'bold');
doc.text('BILLED TO:', 14, 58);
doc.setFont('helvetica', 'normal');
doc.text(order.name || 'Customer', 14, 64);
doc.text(order.phone ? `Ph: ${order.phone}` : '', 14, 70);
doc.text(doc.splitTextToSize(cleanShippingAddress(order), 90), 14, 76);
const rows = (order.items || []).map((item, index) => [
index + 1,
`${item.name || 'Item'} ${item.size || ''}`,
item.itemType === 'perfume_card' ? 'Perfume Card' : (item.itemType === 'bundle' ? 'Custom Set' : 'Product'),
item.cardMeta?.qty || 1,
`Rs ${Number(item.price || 0).toFixed(2)}`
]);
doc.autoTable({
startY: 96,
head: [['#', 'Item Description', 'Type', 'Qty', 'Gross Total']],
body: rows,
theme: 'plain',
headStyles: { fillColor: [250,250,250], textColor: gold, fontStyle: 'bold' },
margin: { left: 14, right: 14 }
});
const finalY = doc.lastAutoTable.finalY || 120;
const rightX = pageWidth - 14;
let y = finalY + 12;
doc.text('Subtotal:', pageWidth - 90, y); doc.text(`Rs ${Number(order.subtotal || 0).toFixed(2)}`, rightX, y, { align: 'right' }); y += 6;
if (Number(order.discount || 0) > 0) { doc.text('Discount:', pageWidth - 90, y); doc.text(`- Rs ${Number(order.discount).toFixed(2)}`, rightX, y, { align: 'right' }); y += 6; }
doc.text('Shipping:', pageWidth - 90, y); doc.text(`Rs ${Number(order.shipping || 0).toFixed(2)}`, rightX, y, { align: 'right' }); y += 8;
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text('Grand Total:', pageWidth - 90, y);
doc.text(`Rs ${Number(order.total || 0).toFixed(2)}`, rightX, y, { align: 'right' });
doc.setFont('times', 'italic');
doc.setFontSize(11);
doc.setTextColor(100);
doc.text('Thank you for being our valuable customer!', pageWidth / 2, 285, { align: 'center' });
doc.save(`Invoice_${order.orderId || order._id}.pdf`);
}
function closeOrderModal() {
document.getElementById('order-details-modal').classList.add('hidden');
}
let reviewProductId = null;
function openReviewModal(productId, productName = '') {
if (!productId) {
alert('Invalid product');
return;
}
reviewProductId = productId;
document.getElementById('review-product-name').textContent =
productName || 'this product';
document.getElementById('review-comment').value = '';
selectedRating = 5;
document.getElementById('review-rating').value = '5';
document.getElementById('review-msg').textContent = '';
renderStarSelector();
document.getElementById('review-modal').classList.remove('hidden');
}
function closeReviewModal() {
document.getElementById('review-modal').classList.add('hidden');
}
function openOrderModal(order) {
const modal = document.getElementById('order-modal');
const itemsContainer = document.getElementById('order-items');
let itemsHtml = '';
order.items.forEach(item => {
itemsHtml += `
<div class="flex justify-between items-center border-b py-2">
<div>
<div class="font-semibold">${item.name}</div>
<div class="text-xs text-gray-500">${item.size}</div>
</div>
${
order.status === 'Delivered'
? `<button
class="text-xs bg-black text-white px-3 py-1 rounded"
onclick="openReviewModal(${item.productId}, '${item.name}')">
Write Review
</button>`
: ''
}
</div>
`;
});
}
function getSeries(price){
if(price <= 65) return "Essential Series";
if(price <= 100) return "Signature Series";
if(price <= 250) return "Prestige Series";
if(price <= 450) return "Noble Collection";
return "AlchemÃ© Collection";
}
const groups = {};
attars.forEach(p => {
const s = getSeries(p.price);
if(!groups[s]) groups[s] = [];
groups[s].push(p);
});
function buildMenu(id){
const el = document.getElementById(id);
if (!el) return;
const liveAttars = allProducts.filter(p => normalize(p.type || p.category) === 'attar');
const liveGroups = {};
liveAttars.forEach(p => {
const series = getSeries(Number(p.price || 0));
(liveGroups[series] ||= []).push(p);
});
const liveFacets = {
"By Gender": { "For Him": liveAttars.filter(p=>p.gender==='Male'), "For Her": liveAttars.filter(p=>p.gender==='Female'), "Unisex": liveAttars.filter(p=>p.gender==='Unisex') },
"By Season": { "Summer": liveAttars.filter(p=>p.season?.includes('Summer')), "Winter": liveAttars.filter(p=>p.season?.includes('Winter')), "All Season": liveAttars.filter(p=>normalize(p.season).includes('allseason')) },
"By Time": { "Day": liveAttars.filter(p=>p.time==='Day'), "Night": liveAttars.filter(p=>p.time==='Night'), "Day / Night": liveAttars.filter(p=>p.time==='Day/Night') }
};
el.innerHTML = "";
el.innerHTML += `
<div onclick="goToCategory('Attar')"
class="px-4 py-2 bg-yellow-500 text-black font-bold cursor-pointer text-center">
All Attars
</div>
`;
for(const facet in liveFacets){
el.innerHTML += `
<div class="px-4 py-2 text-yellow-500 font-bold cursor-pointer"
onmouseenter="showNestedMenu(this)" onmouseleave="scheduleNestedMenuClose(this)" onclick="showNestedMenu(this)">
${facet}
</div>
<div class="hidden">
${Object.keys(liveFacets[facet]).map(key => `
<div class="px-6 py-2 text-gray-300 font-semibold cursor-pointer"
onmouseenter="showNestedMenu(this)" onmouseleave="scheduleNestedMenuClose(this)" onclick="showNestedMenu(this)">
${key}
</div>
<div class="hidden">
${liveFacets[facet][key].map(p => `
<div class="px-8 py-2 hover:bg-yellow-500 hover:text-black cursor-pointer"
onmouseenter='showAttarPreview(event, ${JSON.stringify(String(p.id || p._id))})'
onmousemove="moveAttarPreview(event)"
onmouseleave="hideAttarPreview()"
onclick='event.stopPropagation(); openProduct(${JSON.stringify(String(p.id || p._id))})'
>
${p.name} — ₹${p.price}
</div>
`).join("")}
</div>
`).join("")}
</div>
`;
}
for(const series in liveGroups){
el.innerHTML += `
<div class="px-4 py-2 text-yellow-500 font-bold cursor-pointer"
onmouseenter="showNestedMenu(this)" onmouseleave="scheduleNestedMenuClose(this)" onclick="showNestedMenu(this)">
${series}
</div>
<div class="hidden">
${liveGroups[series].map(p => `
<div class="px-6 py-2 hover:bg-yellow-500 hover:text-black cursor-pointer"
onmouseenter='showAttarPreview(event, ${JSON.stringify(String(p.id || p._id))})'
onmousemove="moveAttarPreview(event)"
onmouseleave="hideAttarPreview()"
onclick='event.stopPropagation(); openProduct(${JSON.stringify(String(p.id || p._id))})'
>
${p.name} — ₹${p.price}
</div>
`).join("")}
</div>
`;
}
}
function goToAttarFacet(facet, value){
closeMenus();
switchPage("home");
document.getElementById("gender-filter").value = "";
document.getElementById("season-filter").value = "";
document.getElementById("time-filter").value = "";
if(facet === "By Gender"){
document.getElementById("gender-filter").value =
value === "For Him" ? "Male" : value === "For Her" ? "Female" : "Unisex";
}
if(facet === "By Season"){
document.getElementById("season-filter").value = value;
}
if(facet === "By Time"){
document.getElementById("time-filter").value = value;
}
goToCategory("Attar");
}
function goToPerfumeFacet(facet, value){
closeMenus();
switchPage("home");
document.getElementById("gender-filter").value = "";
document.getElementById("season-filter").value = "";
document.getElementById("time-filter").value = "";
if(facet==="By Gender"){
document.getElementById("gender-filter").value =
value==="For Him"?"Male":value==="For Her"?"Female":"Unisex";
}
if(facet==="By Season"){
document.getElementById("season-filter").value = value;
}
if(facet==="By Time"){
document.getElementById("time-filter").value = value;
}
goToCategory("Perfume");
}
function showAttarPreview(e, id){
const p = findProductByAnyId(id);
if(!p) return;
document.getElementById("attar-preview-img").src = getDefaultProductImage(p);
document.getElementById("attar-preview-name").textContent = p.name;
document.getElementById("attar-preview-family").textContent = p.family || "";
document.getElementById("attar-preview-gender").textContent = p.gender || "";
document.getElementById("attar-preview-season").textContent = p.season || "";
document.getElementById("attar-preview-time").textContent = p.time || "";
document.getElementById("attar-preview-price").textContent = "₹" + p.price;
const box = document.getElementById("attar-preview");
let detail = document.getElementById('attar-preview-detail');
if (!detail) {
detail = document.createElement('div');
detail.id = 'attar-preview-detail';
detail.className = 'mt-2 border-t border-white/10 pt-2 text-[11px] text-gray-300';
box.appendChild(detail);
}
detail.innerHTML = `${escapeHtml(p.description || '')}${p.accords?.length ? `<div class="mt-1 text-yellow-500">${p.accords.slice(0,4).map(escapeHtml).join(' · ')}</div>` : ''}`;
box.classList.remove("hidden");
moveAttarPreview(e);
}
function moveAttarPreview(e){
const box = document.getElementById("attar-preview");
box.style.top = e.clientY + 15 + "px";
box.style.left = e.clientX + 15 + "px";
}
function hideAttarPreview(){
document.getElementById("attar-preview").classList.add("hidden");
}
const perfumes = products.filter(p => p.type === "Perfume");
const perfumeFacets = {
"By Gender": {
"For Him": perfumes.filter(p => p.gender==="Male"),
"For Her": perfumes.filter(p => p.gender==="Female"),
"Unisex": perfumes.filter(p => p.gender==="Unisex")
},
"By Season": {
"Summer": perfumes.filter(p => p.season?.includes("Summer")),
"Winter": perfumes.filter(p => p.season?.includes("Winter")),
"All Season": perfumes.filter(p => p.season==="All Season")
},
"By Time": {
"Day": perfumes.filter(p => p.time==="Day"),
"Night": perfumes.filter(p => p.time==="Night"),
"Day / Night": perfumes.filter(p => p.time==="Day/Night")
}
};
function buildPerfumeMenu(id){
const el = document.getElementById(id);
if (!el) return;
const livePerfumes = allProducts.filter(p => normalize(p.type || p.category) === 'perfume');
const liveFacets = {
"By Gender": { "For Him": livePerfumes.filter(p=>p.gender==='Male'), "For Her": livePerfumes.filter(p=>p.gender==='Female'), "Unisex": livePerfumes.filter(p=>p.gender==='Unisex') },
"By Season": { "Summer": livePerfumes.filter(p=>p.season?.includes('Summer')), "Winter": livePerfumes.filter(p=>p.season?.includes('Winter')), "All Season": livePerfumes.filter(p=>normalize(p.season).includes('allseason')) },
"By Time": { "Day": livePerfumes.filter(p=>p.time==='Day'), "Night": livePerfumes.filter(p=>p.time==='Night'), "Day / Night": livePerfumes.filter(p=>p.time==='Day/Night') }
};
el.innerHTML = "";
el.innerHTML += `
<div onclick="goToCategory('Perfume')"
class="px-4 py-2 bg-yellow-500 text-black font-bold cursor-pointer text-center">
All Perfumes
</div>
`;
for(const facet in liveFacets){
el.innerHTML += `
<div class="px-4 py-2 text-yellow-500 font-bold cursor-pointer"
onmouseenter="showNestedMenu(this)" onmouseleave="scheduleNestedMenuClose(this)" onclick="showNestedMenu(this)">
${facet}
</div>
<div class="hidden">
${Object.keys(liveFacets[facet]).map(key => `
<div class="px-6 py-2 text-gray-300 font-semibold cursor-pointer"
onmouseenter="showNestedMenu(this)" onmouseleave="scheduleNestedMenuClose(this)" onclick="showNestedMenu(this)">
${key}
</div>
<div class="hidden">
${liveFacets[facet][key].map(p => `
<div
class="px-8 py-2 hover:bg-yellow-500 hover:text-black cursor-pointer"
onmouseenter='showAttarPreview(event, ${JSON.stringify(String(p.id || p._id))})'
onmousemove="moveAttarPreview(event)"
onmouseleave="hideAttarPreview()"
onclick='event.stopPropagation(); openProduct(${JSON.stringify(String(p.id || p._id))})'>
${p.name} — ₹${p.price}
</div>
`).join("")}
</div>
`).join("")}
</div>
`;
}
}
function setupMobileCollectionRows(){
[
{ menuId: 'perfumeMenuMobile', category: 'Perfume', label: 'Perfumes' },
{ menuId: 'attarMenuMobile', category: 'Attar', label: 'Attars' }
].forEach(({ menuId, category, label }) => {
const submenu = document.getElementById(menuId);
const trigger = submenu?.previousElementSibling;
if (!submenu || !trigger || trigger.dataset.eeTapRow) return;
trigger.removeAttribute('onclick');
trigger.className = 'py-1 flex items-center justify-between gap-2 text-yellow-500';
trigger.innerHTML = '';
const categoryButton = document.createElement('button');
categoryButton.type = 'button';
categoryButton.className = 'flex-1 py-2 text-left hover:text-yellow-300';
categoryButton.textContent = label;
categoryButton.onclick = event => {
event.stopPropagation();
window.goToCategory?.(category);
closeMenus();
};
const expandButton = document.createElement('button');
expandButton.type = 'button';
expandButton.className = 'px-3 py-2 text-yellow-500 hover:text-white';
expandButton.setAttribute('aria-label', `Expand ${label}`);
expandButton.setAttribute('aria-controls', menuId);
expandButton.setAttribute('aria-expanded', 'false');
expandButton.textContent = '▸';
expandButton.onclick = event => {
event.stopPropagation();
event.preventDefault();
const opening = submenu.classList.contains('hidden') || submenu.classList.contains('menu-hidden');
if (opening) {
closeCollectionSubmenus(menuId);
showMenu(submenu);
} else {
hideMenu(submenu);
}
expandButton.textContent = opening ? '▾' : '▸';
expandButton.setAttribute('aria-expanded', String(opening));
};
trigger.append(categoryButton, expandButton);
trigger.dataset.eeTapRow = '1';
});
}
function buildCollectionMenus(){
buildMenu("attarMenu");
buildMenu("attarMenuMobile");
buildPerfumeMenu("perfumeMenu");
buildPerfumeMenu("perfumeMenuMobile");
renderDynamicCategoryLinks();
setupMobileCollectionRows();
}
buildCollectionMenus();
bindCollectionCategoryHover();
function showMenu(el){
if(!el) return;
el.classList.remove("hidden");
el.classList.remove("menu-hidden");
el.classList.add("menu-visible");
}
function hideMenu(el){
if(!el) return;
el.classList.add("hidden");
el.classList.remove("menu-visible");
el.classList.add("menu-hidden");
}
function toggleMenu(el){
if(!el) return;
if(el.classList.contains("menu-hidden") || el.classList.contains("hidden")) showMenu(el);
else hideMenu(el);
}
let nestedCollectionCloseTimer = null;
function showNestedMenu(trigger){
const child = trigger?.nextElementSibling;
if(!child) return;
clearTimeout(nestedCollectionCloseTimer);
child.classList.remove('hidden','menu-hidden');
child.classList.add('menu-visible');
if (!child.dataset.eeHoverBound) {
child.addEventListener('mouseenter', () => clearTimeout(nestedCollectionCloseTimer));
child.addEventListener('mouseleave', () => scheduleNestedMenuClose(trigger));
child.dataset.eeHoverBound = '1';
}
}
function scheduleNestedMenuClose(trigger){
const child = trigger?.nextElementSibling;
if(!child) return;
clearTimeout(nestedCollectionCloseTimer);
nestedCollectionCloseTimer = setTimeout(() => hideMenu(child), 180);
}
function bindCollectionCategoryHover(){
const collection = document.getElementById('collectionMenu');
if(!collection || collection.dataset.eeNestedHoverBound) return;
collection.querySelectorAll(':scope > .relative').forEach(wrapper => {
const trigger = wrapper.firstElementChild;
const submenu = wrapper.querySelector(':scope > [id$="Menu"]');
if(!trigger || !submenu) return;
trigger.addEventListener('mouseenter', () => { clearTimeout(collectionHoverCloseTimer); showMenu(submenu); });
wrapper.addEventListener('mouseenter', () => { clearTimeout(collectionHoverCloseTimer); showMenu(submenu); });
wrapper.addEventListener('mouseleave', () => { clearTimeout(nestedCollectionCloseTimer); nestedCollectionCloseTimer = setTimeout(() => hideMenu(submenu), 180); });
});
collection.dataset.eeNestedHoverBound = '1';
}
function openMobileMenu(e) {
e?.stopPropagation();
showMenu(document.getElementById("mobile-menu"));
}
function isMenuOpen(el) {
return !!el && !el.classList.contains("hidden") && !el.classList.contains("menu-hidden");
}
function closeCollectionSubmenus(exceptId = '') {
["attarMenu", "perfumeMenu", "attarMenuMobile", "perfumeMenuMobile"].forEach(id => {
if (id !== exceptId) {
hideMenu(document.getElementById(id));
const arrow = document.querySelector(`#mobile-menu button[aria-controls="${id}"]`);
if (arrow) {
arrow.textContent = '▸';
arrow.setAttribute('aria-expanded', 'false');
}
}
});
}
function togglePerfumeMenu(e){
e?.stopPropagation();
const desktop = document.getElementById("perfumeMenu");
const mobile = document.getElementById("perfumeMenuMobile");
closeCollectionSubmenus(window.innerWidth < 768 ? "perfumeMenuMobile" : "perfumeMenu");
if(window.innerWidth < 768) toggleMenu(mobile);
else toggleMenu(desktop);
}
function closeMenus(){
hideMenu(document.getElementById("mobile-menu"));
hideMenu(document.getElementById("collectionMenu"));
closeCollectionSubmenus();
hideAttarPreview();
}
document.getElementById("collectionBtn").onclick = (e) => {
e.stopPropagation();
const menu = document.getElementById("collectionMenu");
closeCollectionSubmenus();
toggleMenu(menu);
};
let collectionHoverCloseTimer = null;
const collectionHoverWrap = document.getElementById("collectionMenu")?.parentElement;
if (collectionHoverWrap) {
collectionHoverWrap.addEventListener("mouseenter", () => {
if (window.innerWidth < 768) return;
clearTimeout(collectionHoverCloseTimer);
showMenu(document.getElementById("collectionMenu"));
});
collectionHoverWrap.addEventListener("mouseleave", () => {
if (window.innerWidth < 768) return;
clearTimeout(collectionHoverCloseTimer);
collectionHoverCloseTimer = setTimeout(() => {
hideMenu(document.getElementById("collectionMenu"));
closeCollectionSubmenus();
hideAttarPreview();
}, 180);
});
}
function toggleAttarMenu(e){
if(e) e.stopPropagation();
const desktop = document.getElementById("attarMenu");
const mobile = document.getElementById("attarMenuMobile");
closeCollectionSubmenus(window.innerWidth < 768 ? "attarMenuMobile" : "attarMenu");
if(window.innerWidth < 768) toggleMenu(mobile);
else toggleMenu(desktop);
}
document.addEventListener("click", (e) => {
const collectionWrap = document.getElementById("collectionMenu")?.parentElement;
const mobileMenu = document.getElementById("mobile-menu");
if (collectionWrap && !collectionWrap.contains(e.target) && mobileMenu && !mobileMenu.contains(e.target)) closeMenus();
});
document.addEventListener("keydown", (e) => {
if (e.key === "Escape") closeMenus();
});
function openProduct(id){
const product = findProductByAnyId(id);
if(product){
const pid=String(product.id||product._id||'').replace(/^db_/,'');
if(window.eeNavigateToProduct){ window.eeNavigateToProduct(pid); return; }
}
}
function shareProduct() {
if(!currentProduct) return;
const productId = String(currentProduct.id || currentProduct._id || '').replace(/^db_/, '');
const shared = new URL(`${window.location.origin}/product/${encodeURIComponent(productId)}`);
if(selectedSize) shared.searchParams.set('size', normalizeWishlistSize(selectedSize));
const url = shared.toString();
const text = `Check out ${currentProduct.name} from Eternal Essence`;
if(navigator.share) {
navigator.share({ title: currentProduct.name, text, url });
} else {
navigator.clipboard.writeText(url);
showToast("Product link copied to clipboard!");
}
}
function getWishlistPricing(product, savedSize, storedPrice = 0, storedMrp = 0) {
const sizes = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : getSizesByCategory(product?.type || product?.category);
const normalizedSize = normalizeWishlistSize(savedSize);
const size = sizes.find(item => normalizeWishlistSize(`${item.value} ${item.unit}`) === normalizedSize);
const computed = getPricing(Number(product?.price || storedPrice || 0), Number(size?.priceMultiplier || 1), Number(product?.mrp || 0));
const sellingPrice = Number(storedPrice || computed.sellingPrice || product?.price || 0);
const mrp = Math.max(sellingPrice, Number(storedMrp || computed.mrp || product?.mrp || sellingPrice));
const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
return { sellingPrice, mrp, discount };
}
function adaptWishlistImage(image) {
if (!image?.naturalWidth || !image?.naturalHeight) return;
const frame = image.closest('.ee-wishlist-media');
if (!frame) return;
const ratio = image.naturalWidth / image.naturalHeight;
const source = String(image.currentSrc || image.src || '').replace(/"/g, '%22');
frame.style.backgroundImage = `linear-gradient(rgba(247,244,235,.72),rgba(247,244,235,.72)),url("${source}")`;
frame.classList.toggle('is-portrait', ratio < .82);
frame.classList.toggle('is-wide', ratio > 1.65);
}
async function toggleWishlist() {
if (!authToken || !currentProduct) return;
const pid = String(currentProduct.id || currentProduct._id);
const size = normalizeWishlistSize(selectedSize);
const variantKey = getWishlistVariantKey(size);
const variantImage =
getVariantImage(currentProduct, variantKey) ||
currentProduct.image ||
'';
const isSaved = isWishlistItemSaved(pid, size);
const endpoint = isSaved ? 'remove' : 'add';
const wishlistPricing = getWishlistPricing(currentProduct, size, currentPrice);
try {
const res = await fetch(
`${BACKEND_BASE_URL}/api/auth/wishlist/${endpoint}`,
{
method: 'POST',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${authToken}`
},
body: JSON.stringify({
productId: pid,
size: size,
name: currentProduct.name,
price: currentPrice,
mrp: wishlistPricing.mrp,
discount: wishlistPricing.discount,
image: variantImage
})
}
);
const data = await res.json();
if (!res.ok || !data.success) {
console.error('Wishlist update failed:', data);
return;
}
if (isSaved) {
wishlistIds = wishlistIds.filter(item =>
!(
String(item.productId || '') === pid &&
normalizeWishlistSize(item.size) === size
)
);
} else {
wishlistIds.push({
productId: pid,
size: size,
name: currentProduct.name,
price: currentPrice,
mrp: wishlistPricing.mrp,
discount: wishlistPricing.discount,
image: variantImage
});
}
syncWishlistHeart(pid);
renderWishlist();
} catch (err) {
console.error('Wishlist update error:', err);
}
}
function normalizeWishlistSize(size) {
if (size === null || size === undefined) return '';
const raw = String(size).trim();
if (!raw) return '';
const normalized = raw
.replace(/\s+/g, ' ')
.trim();
const match = normalized.match(/[\d.]+/);
if (match) {
const unit = /\bkg\b/i.test(normalized) ? 'kg'
: /\b(?:gm|g|gram|grams)\b/i.test(normalized) ? 'gm'
: /\b(?:pc|piece|pieces)\b/i.test(normalized) ? 'pc'
: 'ml';
return `${match[0]} ${unit}${/gift/i.test(normalized) ? ' Gift' : ''}`;
}
return normalized;
}
function getWishlistVariantKey(size) {
if (size === null || size === undefined) return '';
return String(size)
.trim()
.toLowerCase()
.replace(/\s+/g, '');
}
function getWishlistVariantImage(product, savedSize) {
if (!product) return '';
const normalized = String(savedSize || '')
.trim()
.toLowerCase()
.replace(/\s+/g, '');
let imageIndex = 0;
if (normalized.includes('100ml') && normalized.includes('gift')) {
imageIndex = 8;
}
else if (normalized.includes('50ml') && normalized.includes('gift')) {
imageIndex = 7;
}
else if (normalized.includes('30ml') && normalized.includes('gift')) {
imageIndex = 6;
}
else if (normalized.includes('100ml')) {
imageIndex = 5;
}
else if (normalized.includes('50ml')) {
imageIndex = 4;
}
else if (normalized.includes('30ml')) {
imageIndex = 3;
}
else if (normalized.includes('20ml')) {
imageIndex = 2;
}
else if (normalized.includes('8ml')) {
imageIndex = 1;
}
return (
product.images?.[imageIndex] ||
product.image ||
product.images?.[0] ||
''
);
}
async function fetchWishlist() {
if (!authToken) {
wishlistIds = [];
wishlistLoaded = true;
wishlistReady = true;
return;
}
try {
const res = await fetch(`${BACKEND_BASE_URL}/api/auth/wishlist`, {
headers: {
Authorization: `Bearer ${authToken}`
}
});
const data = await res.json();
wishlistIds = (data.wishlist || []).map(item => {
if (typeof item !== 'object' || item === null) {
return {
productId: String(item),
size: '',
image: '',
price: 0,
name: ''
};
}
return {
...item,
productId: String(item.productId || ''),
size: normalizeWishlistSize(item.size),
image: item.image || '',
price: Number(item.price || 0),
mrp: Number(item.mrp || 0),
discount: Number(item.discount || 0),
name: item.name || ''
};
});
wishlistLoaded = true;
wishlistReady = true;
} catch (err) {
console.error('Could not fetch wishlist:', err);
wishlistIds = [];
wishlistLoaded = true;
wishlistReady = true;
}
}
function isWishlistItemSaved(productId, size) {
const pid = String(productId || '');
const normalizedSize = normalizeWishlistSize(size);
return wishlistIds.some(item =>
String(item.productId || '') === pid &&
normalizeWishlistSize(item.size) === normalizedSize
);
}
function loadWishlist() {
const container = document.getElementById("wishlist-container");
container.innerHTML = "";
if (!wishlistIds.length) {
container.innerHTML = `
<p class="text-gray-500 col-span-full">
Your wishlist is empty.
</p>`;
return;
}
wishlistIds.forEach(id => {
const p = products.find(x => Number(x.id) === Number(id));
if (!p) return;
container.innerHTML += `
<div class="product-card cursor-pointer border p-3"
onclick='openModal(${JSON.stringify(p).replace(/"/g, "&quot;")})'>
<img src="${p.image}"
class="w-full h-40 object-contain mb-3">
<h4 class="font-bold text-sm">${p.name}</h4>
<p class="text-yellow-600 font-semibold mt-1">
₹${p.price}
</p>
</div>
`;
});
}
function renderWishlist() {
const container = document.getElementById('wishlist-container');
if (!container) return;
container.innerHTML = '';
if (!wishlistLoaded || !wishlistIds.length) {
container.innerHTML = `
<p class="text-gray-500 text-sm col-span-full">
Your wishlist is empty.
</p>
`;
return;
}
wishlistIds.forEach(wid => {
const product = allProducts.find(item => wid.name && normalize(item.name) === normalize(wid.name)) || findProductByAnyId(wid.productId) || { ...wid, id: wid.productId, images: [] };
const savedSize = normalizeWishlistSize(wid.size);
const exactVariantImage = getWishlistVariantImage(
product,
savedSize
);
const wishlistImage =
wid.image ||
exactVariantImage ||
product.image ||
'';
const normalizedWishlistImage = normalizeImageUrl(wishlistImage || getDefaultProductImage(product));
const normalizedWishlistFallback = normalizeImageUrl(
exactVariantImage || product.image || product.images?.[0] || getDefaultProductImage(product)
);
const wishlistName =
wid.name ||
product.name;
const wishlistPricing = getWishlistPricing(product, savedSize, Number(wid.price), Number(wid.mrp));
const safeProductId = String(
wid.productId ||
product.id ||
product._id ||
''
);
container.innerHTML += `
<article
class="ee-wishlist-card"
onclick="openWishlistProduct(
'${escapeHtml(safeProductId)}',
'${escapeHtml(savedSize)}',
'${escapeHtml(wishlistName)}'
)"
onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"
role="button"
tabindex="0"
>
<div class="ee-wishlist-media">
<img
src="${escapeHtml(normalizedWishlistImage)}"
onerror="
this.onerror=null;
this.src='${escapeHtml(normalizedWishlistFallback)}';
"
onload="adaptWishlistImage(this)"
alt="${escapeHtml(wishlistName)}"
>
<span>${escapeHtml(savedSize || 'Standard')}</span>
</div>
<div class="ee-wishlist-copy">
<small>${escapeHtml(product.family || product.type || 'Eternal Essence')}</small>
<h4>${escapeHtml(wishlistName)}</h4>
<p>Selected size <b>${escapeHtml(savedSize || 'Standard')}</b></p>
<div class="ee-wishlist-price"><del>₹${wishlistPricing.mrp.toLocaleString('en-IN')}</del><strong>₹${wishlistPricing.sellingPrice.toLocaleString('en-IN')}</strong>${wishlistPricing.discount>0?`<em>${wishlistPricing.discount}% OFF</em>`:''}</div>
<span class="ee-wishlist-view">VIEW PRODUCT <i>→</i></span>
</div>
</article>
`;
});
}
function openModalById(id){
const product = findProductByAnyId(id);
if(product){
const pid=String(product.id||product._id||'').replace(/^db_/,'');
if(window.eeNavigateToProduct){ window.eeNavigateToProduct(product); return; }
}
}
async function initStore() {
placeProductFilters();
mergeProducts();
await Promise.all([loadBundleRules(), loadBackendProducts()]);
renderProducts(allProducts);
renderBundleBuilder();
restoreCategoryIfAny();
if (typeof renderBestSellers === 'function') renderBestSellers();
const sharedId = null;
}
window.__EE_CONFIG__ = window.__EE_CONFIG__ || {};
async function bootEternalEssence(){
try { await initStore(); } catch (e) { console.error('Eternal Essence bootstrap failed', e); }
loadCartFromStorage();
loadAuthFromStorage();
setTimeout(()=>{ try { setupPincodeListeners(); } catch(e){} }, 300);
if (document.getElementById('page-orders') && !document.getElementById('page-orders').classList.contains('hidden')) startOrdersPoller();
window.EE = {
  getProducts: () => allProducts || [],
  findProduct: (id) => findProductByAnyId(id),
  getPricing: (base,m=1) => getPricing(base,m),
  getSizes: (type) => getSizesByCategory(type),
  getBackendBase: () => BACKEND_BASE_URL,
  getCart: () => cart,
  getAuth: () => ({ token: authToken, user: currentUser }),
  getWishlist: () => wishlistIds || [],
  setSelection: (product,size,price,imageIndex=0) => { currentProduct=product; selectedSize=size; currentPrice=price; currentImageIndex=imageIndex; currentGallery=product?.images?.length?product.images:[product?.image].filter(Boolean); },
  addToCart: (product,size,price,qty=1) => { currentProduct=product; selectedSize=size; currentPrice=price; pendingCartQty=Math.max(1,Math.floor(Number(qty)||1)); currentImageIndex=0; currentGallery=product?.images?.length?product.images:[product?.image].filter(Boolean); addItemToCart(); window.dispatchEvent(new Event('ee:cart-updated')); },
  toggleWishlist: () => toggleWishlist(),
  isWishlistSaved: (pid,size) => isWishlistItemSaved(pid,size),
  activateOfferAndGoCart: async (code) => { switchPage('cart'); await new Promise(resolve=>setTimeout(resolve,50)); const input=document.getElementById('coupon-code'); if(input) input.value=String(code||'').toUpperCase(); await applyCoupon(); },
  switchPage: (id) => switchPage(id),
  showToast: (msg) => showToast(msg),
  getReviews: async (pid) => { const r=await fetch(`${BACKEND_BASE_URL}/api/reviews/${encodeURIComponent(String(pid).replace(/^db_/,''))}`); return r.json(); }
};
window.dispatchEvent(new CustomEvent('ee:ready'));
}
bootEternalEssence();
