const BACKEND_BASE_URL = String(window.__EE_CONFIG__?.BACKEND_BASE_URL || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://eternal-essence-backend-production.up.railway.app')).trim().replace(/\/+$/, '');
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
const products = [
{
id: 1,
name: "Purple OUD",
description: "A deep, luxurious oud blended with warm amber and exotic spices.",
type: "Perfume",
inspiredBy: "Purple Oud (Dior)",
gender: "Unisex",
season: "Autumn-Winter",
time: "Day/Night",
family: "Amber Woody",
accords: ["Woody", "Spicy", "Citrus", "Oud"],
top: "Mandarin Orange",
mid: "Pink Pepper, Saffron",
base: "Oud (Agarwood)",
price: 499,
image: "purple_oud.webp",
images: [
"purple_oud.webp",
"purple_oud1.webp",
"purple_oud2.webp",
"purple_oud3.webp",
"purple_oud4.webp",
"purple_oud5.webp",
"purple_oud6.webp",
"purple_oud7.webp",
"purple_oud100.webp"
]
},
{
id: 2,
name: "Pulse Royale",
description: "Fresh aromatic notes with a smooth woody and masculine finish.",
type: "Perfume",
inspiredBy: "CR-7",
gender: "Unisex",
season: "All Season",
time: "Day",
family: "Aromatic Fougère",
accords: ["Aromatic", "Woody", "Powdery", "Warm Spicy"],
top: "Lavender, Cardamom, Artemisia, Bergamot",
mid: "Tobacco, Cinnamon, Cedar, Iris",
base: "Vanilla, Musk, Sandalwood, Amber",
price: 499,
image: "pulse_royale.webp",
images: [
"pulse_royale.webp",
"pulse_royale1.webp",
"pulse_royale2.webp",
"pulse_royale3.webp",
"pulse_royale4.webp",
"pulse_royale5.webp",
"pulse_royale6.webp",
"pulse_royale7.webp",
"pulse_royale100.webp"
]
},
{
id: 3,
name: "Aqua Wave",
description: "A fresh aquatic fragrance with citrus and marine notes. Clean, crisp and refreshing.",
type: "Perfume",
inspiredBy: "Acqua Di Gio",
gender: "Male",
season: "Spring-Summer",
time: "Day/Night",
family: "Aromatic Aquatic",
accords: ["Citrus", "Aromatic", "Marine", "Fresh Spicy"],
top: "Lime, Lemon, Bergamot, Jasmine, Orange, Mandarin",
mid: "Sea Notes, Jasmine, Calone, Peach, Freesia",
base: "White Musk, Cedar, Oakmoss, Patchouli, Amber",
price: 499,
image: "aqua_wave.webp",
images: [
"aqua_wave.webp",
"aqua_wave1.webp",
"aqua_wave2.webp",
"aqua_wave3.webp",
"aqua_wave4.webp",
"aqua_wave5.webp",
"aqua_wave6.webp",
"aqua_wave7.webp",
"aqua_wave100.webp"
]
},
{
id: 4,
name: "Eternal Elixir",
description: "An intense spicy aromatic scent with powerful depth. Perfect for bold evenings.",
type: "Perfume",
inspiredBy: "Dior Sauvage Elixir",
gender: "Male",
season: "All Season",
time: "Night",
family: "Aromatic Spicy",
accords: ["Warm Spicy", "Fresh Spicy", "Woody", "Aromatic"],
top: "Nutmeg, Cinnamon, Cardamom, Grapefruit",
mid: "Lavender",
base: "Licorice, Sandalwood, Amber, Patchouli, Vetiver",
price: 499,
image: "eternal_elixir.webp",
images: [
"eternal_elixir.webp",
"eternal_elixir1.webp",
"eternal_elixir2.webp",
"eternal_elixir3.webp",
"eternal_elixir4.webp",
"eternal_elixir5.webp",
"eternal_elixir6.webp",
"eternal_elixir7.webp",
"eternal_elixir100.webp"
]
},
{
id: 5,
name: "Golden Blush",
description: "Soft florals with creamy vanilla and almond sweetness. Elegant and feminine.",
type: "Perfume",
inspiredBy: "Good Girl Blush",
gender: "Female",
season: "All Season",
time: "Day",
family: "Chypre Floral",
accords: ["Floral", "Vanilla", "Citrus", "Powdery", "Almond"],
top: "Bergamot, Bitter Almond",
mid: "Peony, Ylang-Ylang",
base: "Vanilla, Coumarin (Tonka)",
price: 499,
image: "golden_blush.webp",
images: [
"golden_blush.webp",
"golden_blush1.webp",
"golden_blush2.webp",
"golden_blush3.webp",
"golden_blush4.webp",
"golden_blush5.webp",
"golden_blush6.webp",
"golden_blush7.webp",
"golden_blush100.webp"
]
},
{
id: 6,
name: "Intense Suede",
description: "Warm spicy sweetness with smooth suede and vanilla. Sensual and addictive.",
type: "Perfume",
inspiredBy: "Stronger With You Intensely",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Fougère",
accords: ["Warm Spicy", "Amber", "Vanilla", "Sweet"],
top: "Pink Pepper, Juniper, Violet",
mid: "Toffee, Cinnamon, Lavender, Sage",
base: "Vanilla, Tonka Bean, Amber, Suede",
price: 499,
image: "intense_suede.webp",
images: [
"intense_suede.webp",
"intense_suede1.webp",
"intense_suede2.webp",
"intense_suede3.webp",
"intense_suede4.webp",
"intense_suede5.webp",
"intense_suede6.webp",
"intense_suede7.webp",
"intense_suede100.webp"
]
},
{
id: 7,
name: "Cool Essence",
description: "Crisp green freshness with citrus and woods. Sporty, clean and refreshing.",
type: "Perfume",
inspiredBy: "Polo Sport",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Aromatic Green",
accords: ["Aromatic", "Fresh Spicy", "Green", "Citrus"],
top: "Mint, Aldehydes, Lavender, Bergamot, Mandarin, Lemon",
mid: "Seagrass, Ginger, Jasmine, Geranium, Rosewood",
base: "Musk, Sandalwood, Cedar, Guaiac Wood, Amber",
price: 499,
image: "cool_essence.webp",
images: [
"cool_essence.webp",
"cool_essence1.webp",
"cool_essence2.webp",
"cool_essence3.webp",
"cool_essence4.webp",
"cool_essence5.webp",
"cool_essence6.webp",
"cool_essence7.webp",
"cool_essence100.webp"
]
},
{
id: 8,
name: "Divine Essence",
description: "A luxurious vanilla-forward fragrance with aromatic warmth. Comforting yet powerful.",
type: "Perfume",
inspiredBy: "Burberry Goddess",
gender: "Female",
season: "All Season",
time: "Day/Night",
family: "Aromatic Gourmand",
accords: ["Vanilla", "Aromatic", "Sweet", "Lavender"],
top: "Vanilla Infusion, Lavender, Cacao, Ginger",
mid: "Vanilla Caviar",
base: "Vanilla Absolute",
price: 499,
image: "divine_essence.webp",
images: [
"divine_essence.webp",
"divine_essence1.webp",
"divine_essence2.webp",
"divine_essence3.webp",
"divine_essence4.webp",
"divine_essence5.webp",
"divine_essence6.webp",
"divine_essence7.webp",
"divine_essence100.webp"
]
},
{
id: 9,
name: "Vanilla Blossom",
description: "Sweet vanilla blended with florals and amber. Cozy, warm and irresistible.",
type: "Perfume",
inspiredBy: "Kayali Vanilla 28",
gender: "Female",
season: "Autumn-Winter",
time: "Night",
family: "Amber Vanilla",
accords: ["Vanilla", "Sweet", "Amber", "Powdery", "Floral"],
top: "Vanilla Orchid, Jasmine",
mid: "Brown Sugar, Tonka Bean",
base: "Amber, Amberwood, Musk, Patchouli",
price: 499,
image: "vanilla_blossom.webp",
images: [
"vanilla_blossom.webp",
"vanilla_blossom1.webp",
"vanilla_blossom2.webp",
"vanilla_blossom3.webp",
"vanilla_blossom4.webp",
"vanilla_blossom5.webp",
"vanilla_blossom6.webp",
"vanilla_blossom7.webp",
"vanilla_blossom100.webp"
]
},
{
id: 10,
name: "Eternal Sauvage",
description: "Fresh spicy citrus with aromatic woods. Powerful, masculine and long-lasting.",
type: "Perfume",
inspiredBy: "Dior Sauvage (EDT)",
gender: "Male",
season: "All Season",
time: "Day/Night",
family: "Aromatic Fougère",
accords: ["Fresh Spicy", "Amber", "Citrus", "Aromatic"],
top: "Calabrian Bergamot, Pepper",
mid: "Sichuan Pepper, Lavender, Pink Pepper, Vetiver, Patchouli",
base: "Ambroxan, Cedar, Labdanum",
price: 499,
image: "eternal_sauvage.webp",
images: [
"eternal_sauvage.webp",
"eternal_sauvage1.webp",
"eternal_sauvage2.webp",
"eternal_sauvage3.webp",
"eternal_sauvage4.webp",
"eternal_sauvage5.webp",
"eternal_sauvage6.webp",
"eternal_sauvage7.webp",
"eternal_sauvage100.webp"
]
},
{
id: 11,
name: "Invictus",
description: "Fresh aquatic scent with salty marine notes. Energetic, youthful and bold.",
type: "Perfume",
inspiredBy: "Invictus Aqua",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Woody Aquatic",
accords: ["Citrus", "Marine", "Aquatic", "Salty"],
top: "Yuzu, Grapefruit, Pink Pepper",
mid: "Sea Water, Violet Leaf",
base: "Ambergris, Amberwood, Guaiac Wood",
price: 499,
image: "invictus.webp",
images: [
"invictus.webp",
"invictus1.webp",
"invictus2.webp",
"invictus3.webp",
"invictus4.webp",
"invictus5.webp",
"invictus6.webp",
"invictus7.webp",
"invictus100.webp"
]
},
{
id: 12,
name: "Bleu Voyage",
description: "Citrus freshness balanced with woody incense notes. Sophisticated and timeless.",
type: "Perfume",
inspiredBy: "Bleu de Chanel",
gender: "Male",
season: "All Season",
time: "Day/Night",
family: "Woody Aromatic",
accords: ["Citrus", "Woody", "Warm Spicy", "Aromatic"],
top: "Grapefruit, Lemon, Mint, Pink Pepper",
mid: "Ginger, Nutmeg, Jasmine, Iso E Super",
base: "Incense, Vetiver, Cedar, Sandalwood, Patchouli",
price: 599,
image: "bleu_voyage.webp",
images: [
"bleu_voyage.webp",
"bleu_voyage1.webp",
"bleu_voyage2.webp",
"bleu_voyage3.webp",
"bleu_voyage4.webp",
"bleu_voyage5.webp",
"bleu_voyage6.webp",
"bleu_voyage7.webp",
"bleu_voyage100.webp"
]
},
{
id: 13,
name: "Aventus",
description: "Iconic fruity-smoky fragrance with woods and musk. Confident and commanding.",
type: "Perfume",
inspiredBy: "Creed Aventus",
gender: "Male",
season: "All Season",
time: "Day/Night",
family: "Chypre Fruity",
accords: ["Fruity", "Sweet", "Leather", "Woody", "Smoky"],
top: "Pineapple, Bergamot, Black Currant, Apple",
mid: "Birch, Patchouli, Moroccan Jasmine, Rose",
base: "Musk, Oakmoss, Ambergris, Vanilla",
price: 499,
image: "aventus.webp",
images: [
"aventus.webp",
"aventus1.webp",
"aventus2.webp",
"aventus3.webp",
"aventus4.webp",
"aventus5.webp",
"aventus6.webp",
"aventus7.webp",
"aventus100.webp"
]
},
{
id: 14,
name: "Golden Flora",
description: "Bright floral bouquet with fruity sweetness. Soft, joyful and elegant.",
type: "Perfume",
inspiredBy: "Gucci Flora Gorgeous Gardenia",
gender: "Female",
season: "Spring-Summer",
time: "Day",
family: "Floral",
accords: ["White Floral", "Sweet", "Fruity", "Floral"],
top: "Pear Blossom, Red Berries, Italian Mandarin",
mid: "Gardenia, Jasmine, Frangipani",
base: "Brown Sugar, Patchouli",
price: 499,
image: "golden_flora.webp",
images: [
"golden_flora.webp",
"golden_flora1.webp",
"golden_flora2.webp",
"golden_flora3.webp",
"golden_flora4.webp",
"golden_flora5.webp",
"golden_flora6.webp",
"golden_flora7.webp",
"golden_flora100.webp"
]
},
{
id: 15,
name: "Fresh Impact",
description: "Sparkling citrus with aromatic spice and woods. Clean, uplifting and modern.",
type: "Perfume",
inspiredBy: "Louis Vuitton Imagination",
gender: "Unisex",
season: "Spring-Summer",
time: "Day",
family: "Citrus Aromatic",
accords: ["Citrus", "Aromatic", "Fresh Spicy", "Woody"],
top: "Citron, Calabrian Bergamot, Sicilian Orange",
mid: "Tunisian Neroli, Nigerian Ginger, Ceylon Cinnamon",
base: "Chinese Black Tea, Ambroxan, Guaiac Wood, Olibanum",
price: 499,
image: "fresh_impact.webp",
images: [
"fresh_impact.webp",
"fresh_impact1.webp",
"fresh_impact2.webp",
"fresh_impact3.webp",
"fresh_impact4.webp",
"fresh_impact5.webp",
"fresh_impact6.webp",
"fresh_impact7.webp",
"fresh_impact100.webp"
]
},
{
id: 15,
name: "Chocolate Musk",
image: "sweet chocolate gourmond.webp",
images: ["sweet chocolate gourmond.webp", "chocolatem1.webp", "chocolatem2.webp", "info.webpa"],
description: "A rich gourmand attar blending creamy chocolate with soft musk and powdery warmth, creating a comforting and addictive aroma.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Gourmand",
accords: ["Gourmand", "Musky", "Powdery"],
top: "Milk Chocolate, Cinnamon, Vanilla",
mid: "Spicy Notes, Rose",
base: "White Musk, Sandalwood, Myrrh, Amber",
price: 49
},
{
id: 17,
name: "Iceberg",
image: "fresh_auqatic.webp",
images: ["fresh_auqatic.webp", "iceberga1.webp", "iceberga2.webp", "infoa.webp"],
description: "A concentrated attar version of a fresh citrus floral fragrance, offering enhanced longevity and smooth clarity.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Spring-Summer",
time: "Day",
family: "Fresh Citrus",
accords: ["Citrus", "Fresh", "Floral"],
top: "Galbanum, Bergamot, Basil, Orange Blossom, Lemon, Peach",
mid: "Lily, Lily-of-the-Valley, Jasmine, Orris Root, Rose, Ylang-Ylang",
base: "Oakmoss, Cedar, Vetiver, Sandalwood, Musk, Amber",
price: 49
},
{
id: 18,
name: "Dubai Gold",
image: "sweet gourmond.webp",
images: ["sweet gourmond.webp", "dubaig1.webp", "dubaig2.webp", "infoa.webp"],
description: "A luxurious Middle Eastern attar where rich oud meets warm amber and exotic spices, ideal for bold evening wear.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental",
accords: ["Oud", "Amber", "Spicy"],
top: "Saffron, Bitter Orange, Brandy",
mid: "Cedarwood, Guaiac Wood, Juniper",
base: "Patchouli, Sandalwood, Musk, Amber",
price: 59
},
{
id: 20,
name: "Cool Tide",
image: "fresh marine.webp",
images: ["fresh marine.webp", "coolta1.webp", "coolta2.webp", "infoa.webp"],
description: "A long-lasting attar interpretation of a classic aquatic fragrance with cooling freshness and floral depth.",
type: "Attar",
inspiredBy: "Davidoff CoolWater",
gender: "Unisex",
season: "Spring-Summer",
time: "Day",
family: "Aquatic Fresh",
accords: ["Fresh", "Floral", "Aquatic"],
top: "Melon, Lotus, Lemon, Pineapple, Quince, Calone, Lily",
mid: "Lotus, Water Lily, Lily-of-the-Valley, Jasmine, Honey, Hawthorn, Rose",
base: "Musk, Vetiver, Raspberry, Blackberry, Violet Root, Peach, Sandalwood",
price: 69
},
{
id: 21,
name: "Red Musk",
image: "alln.webp",
images: ["alln.webp", "redma1.webp", "redma2.webp", "infoa.webp"],
description: "A deep and sensual musky attar accented with warm spices and tobacco nuances for evening wear.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Musky",
accords: ["Musky", "Spicy"],
top: "Pepper",
mid: "Cinnamon",
base: "Tobacco, Musk",
price: 69
},
{
id: 23,
name: "Chrome Breeze",
image: "breeze.webp",
images: ["breeze.webp", "chromeba1.webp", "chromeba2.webp", "infoa.webp"],
description: "A concentrated attar version of a fresh woody citrus fragrance with enhanced smoothness and longevity.",
type: "Attar",
inspiredBy: "Azzaro Chrome",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Woody",
accords: ["Fresh", "Woody", "Citrus"],
top: "Lemon, Rosemary, Bergamot, Neroli, Pineapple",
mid: "Jasmine, Cyclamen, Oakmoss, Coriander",
base: "Musk, Cedar, Oakmoss, Sandalwood, Cardamom, Tonka Bean, Rosewood",
price: 59
},
{
id: 24,
name: "Luminous Veil",
image: "luminous_veil.webp",
images: [
"luminous_veil.webp",
"luminous_veil1.webp",
"luminous_veil2.webp",
"luminous_veil3.webp",
"luminous_veil4.webp",
"luminous_veil5.webp",
"luminous_veil6.webp",
"luminous_veil7.webp",
"luminous_veil100.webp"
],
description: "A luminous floral-fruity perfume with soft powdery tones, expressing elegance, femininity, and charm.",
type: "Perfume",
inspiredBy: "Dior J'adore",
gender: "Female",
season: "Spring-Summer",
time: "Day",
family: "Floral",
accords: ["Floral", "Fruity", "Powdery"],
top: "Pear, Melon, Magnolia, Peach, Mandarin Orange, Bergamot",
mid: "Jasmine, Lily-of-the-Valley, Tuberose, Freesia, Rose, Orchid, Plum, Violet",
base: "Musk, Vanilla, Blackberry, Cedar",
price: 499
},
{
id: 25,
name: "Luminous Veil",
image: "norm1.webp",
images: ["norm1.webp", "luminousva1.webp", "luminousva2.webp", "infoa.webp"],
description: "A refined attar rendition of a floral bouquet enriched with fruity sweetness and powdery elegance.",
type: "Attar",
inspiredBy: "Dior J'adore",
gender: "Female",
season: "Spring-Summer",
time: "Day",
family: "Floral",
accords: ["Floral", "Fruity", "Powdery"],
top: "Pear, Melon, Magnolia, Peach, Mandarin Orange, Bergamot",
mid: "Jasmine, Lily-of-the-Valley, Tuberose, Freesia, Rose, Orchid, Plum, Violet",
base: "Musk, Vanilla, Blackberry, Cedar",
price: 89
},
{
id: 26,
name: "Golden Flora",
image: "female floral.webp",
images: ["female floral.webp", "goldenfa1.webp", "goldenfa2.webp", "infoa.webp"],
description: "A bright and elegant floral-fruity attar with fresh citrus nuances, radiating youthful femininity and charm.",
type: "Attar",
inspiredBy: "Gucci Flora",
gender: "Female",
season: "Spring-Summer",
time: "Day",
family: "Floral",
accords: ["Floral", "Fruity", "Citrus"],
top: "Peony, Citrus Fruits, Mandarin Orange",
mid: "Osmanthus, Rose",
base: "Sandalwood, Patchouli, Pink Pepper",
price: 69
},
{
id: 27,
name: "Cool Essence",
image: "coolea.webp",
images: ["coolea.webp", "coolea1.webp", "coolea2.webp", "infoa.webp"],
description: "A sporty and energetic fresh aromatic fragrance inspired by outdoor vitality and aquatic freshness.",
type: "Attar",
inspiredBy: "Polo Sports",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Aromatic",
accords: ["Fresh", "Aromatic", "Citrus"],
top: "Mint, Aldehydes, Lavender, Bergamot, Mandarin Orange, Lemon, Artemisia, Neroli",
mid: "Seagrass, Jasmine, Ginger, Geranium, Rose, Cyclamen, Brazilian Rosewood",
base: "Musk, Sandalwood, Cedar, Guaiac Wood, Amber",
price: 89
},
{
id: 28,
name: "Majmua",
image: "norm2.webp",
images: ["norm2.webp", "majmuaa1.webp", "majmuaa2.webp", "infoa.webp"],
description: "A classic traditional attar blending floral, herbal, and musky tones, deeply rooted in Indo-Arabic perfumery.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day/Night",
family: "Oriental Floral",
accords: ["Floral", "Herbal", "Musky"],
top: "Kewda (Screw Pine), Green Notes",
mid: "Rose (Ruh Gulab), Hina (Henna)",
base: "Vetiver (Khus), Sandalwood",
price: 69
},
{
id: 29,
name: "Majmua Premium",
image: "prem5.webp",
images: ["prem5.webp", "majmuapap1.webp", "majmuapap2.webp", "infoa.webp"],
description: "A richer and more refined version of Majmua with enhanced depth, smoothness, and lasting power.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day/Night",
family: "Oriental Floral",
accords: ["Floral", "Herbal", "Musky"],
top: "Kewda (Screw Pine), Green Notes",
mid: "Rose (Ruh Gulab), Hina (Henna)",
base: "Vetiver (Khus), Sandalwood",
price: 999
},
{
id: 30,
name: "Mukhallat",
image: "smoky, oudy, spicy.webp",
images: ["smoky, oudy, spicy.webp", "mukhallata1.webp", "mukhallata2.webp", "infoa.webp"],
description: "A bold oriental attar combining oud, amber, and spices for a warm and luxurious evening presence.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental",
accords: ["Oriental", "Amber", "Spicy"],
top: "Oud (Agarwood)",
mid: "Saffron",
base: "Musk, Amber, Woody Notes",
price: 69
},
{
id: 31,
name: "Mukhallat Premium",
image: "all.webp",
images: ["all.webp", "mukhallatpa1.webp", "mukhallatpa2.webp", "infoa.webp"],
description: "A premium interpretation of Mukhallat offering deeper oud richness and smoother amber warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental",
accords: ["Oriental", "Amber", "Spicy"],
top: "Oud (Agarwood)",
mid: "Saffron",
base: "Musk, Amber, Woody Notes",
price: 999
},
{
id: 32,
name: "Ameer Al OUD",
image: "smoky, oudy, spicy.webp",
images: ["smoky, oudy, spicy.webp", "ameeraa1.webp", "ameeraa2.webp", "infoa.webp"],
description: "A sweet woody oud fragrance with vanilla warmth, balancing richness and smooth gourmand undertones.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Sweet", "Amber"],
top: "Oud, Woody Notes",
mid: "Vanilla, Sugar",
base: "Agarwood (Oud), Sandalwood, Herbal Notes",
price: 89
},
{
id: 33,
name: "Ameer Al OUD Premium",
image: "oudyspicyfresh.webp",
images: ["oudyspicyfresh.webp", "ameerapa1.webp", "ameerapa2.webp", "infoa.webp"],
description: "A premium and smoother oud blend with intensified sweetness and long-lasting woody depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Sweet", "Amber"],
top: "Oud, Woody Notes",
mid: "Vanilla, Sugar",
base: "Agarwood (Oud), Sandalwood, Herbal Notes",
price: 249
},
{
id: 34,
name: "Shay Oud",
image: "smoky.webp",
images: ["smoky.webp", "shayoa1.webp", "shayoa2.webp", "infoa.webp"],
description: "A warm oriental oud fragrance enriched with honeyed sweetness and smoky incense accents.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Woody",
accords: ["Woody", "Oriental", "Honey"],
top: "Frankincense (Luban)",
mid: "Honey",
base: "Agarwood (Oud), Musk",
price: 99
},
{
id: 35,
name: "Shay Oud Premium",
image: "oudshay.webp",
images: ["oudshay.webp", "shayopa1.webp", "shayopa2.webp", "infoa.webp"],
description: "A deeper and more refined version of Shay Oud with enhanced honeyed warmth and resinous oud.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Woody",
accords: ["Woody", "Oriental", "Honey"],
top: "Frankincense (Luban)",
mid: "Honey",
base: "Agarwood (Oud), Musk",
price: 239
},
{
id: 36,
name: "Jannatul Ferdous",
image: "norm7.webp",
images: ["norm7.webp", "jannatulfa1.webp", "jannatulfa2.webp", "infoa.webp"],
description: "A fresh herbal-floral attar with green and spicy undertones, traditionally worn for daytime serenity.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Spring-Summer",
time: "Day",
family: "Herbal Floral",
accords: ["Herbal", "Floral", "Spicy"],
top: "Lotus, Gardenia, Green Notes",
mid: "Rose, Grass",
base: "Herbal Notes, Woody Notes",
price: 69
},
{
id: 37,
name: "Zam Zam",
image: "breeze.webp",
images: ["breeze.webp", "zamza1.webp", "zamza2.webp", "infoa.webp"],
description: "A clean and uplifting fresh aromatic attar with watery florals and gentle musky warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Spring-Summer",
time: "Day",
family: "Fresh Aromatic",
accords: ["Fresh", "Aromatic"],
top: "Bergamot, Mint, Watercress",
mid: "Lilies, Iris, Jasmine",
base: "Woody Notes, Musk, Apricot",
price: 69
},
{
id: 38,
name: "Magnet",
image: "smoky.webp",
images: ["smoky.webp", "magneta1.webp", "magneta2.webp", "infoa.webp"],
description: "A complex floral-woody fragrance with fruity sweetness and resinous warmth, bold yet elegant.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day/Night",
family: "Woody Floral",
accords: ["Floral", "Woody", "Mossy"],
top: "Red Berries, Black Currant, Cassia, Litchi, Pineapple, Melon",
mid: "Green Leaves, Basil, Almond Blossom, Iris, Freesia, Jasmine, Rose",
base: "Caramel, Vanilla, Patchouli, Benzoin, Musk, Sandalwood, Amber, Vetiver",
price: 49
},
{
id: 39,
name: "Aqua Wave",
image: "aqua fresh.webp",
images: ["aqua fresh.webp", "aquawa1.webp", "aquawa2.webp", "infoa.webp"],
description: "A marine-fresh fragrance inspired by ocean air, blending citrus brightness with salty aquatic notes.",
type: "Attar",
inspiredBy: "Aqua De Gio",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Marine Fresh",
accords: ["Fresh", "Marine", "Citrus"],
top: "Lime, Lemon, Bergamot, Jasmine, Orange, Mandarin Orange, Neroli",
mid: "Sea Notes, Jasmine, Calone, Rosemary, Peach, Freesia, Cyclamen",
base: "White Musk, Cedar, Oakmoss, Patchouli, Amber",
price: 69
},
{
id: 40,
name: "Blue Wave",
image: "fresh_auqatic.webp",
images: ["fresh_auqatic.webp", "bluewa1.webp", "bluewa2.webp", "infoa.webp"],
description: "A light and refreshing citrus-aquatic attar designed for everyday summer freshness.",
type: "Attar",
inspiredBy: "",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Citrus",
accords: ["Fresh", "Citrus", "Fruity"],
top: "Bergamot, Mandarin Orange",
mid: "Aquatic Accords, Lavender",
base: "Amber, Woody Notes, Musk",
price: 69
},
{
id: 41,
name: "Blue Water",
image: "norm6.webp",
images: ["norm6.webp", "bluewa1.webp", "bluewa2.webp", "infoa.webp"],
description: "A clean and refreshing aromatic aquatic attar with marine freshness and woody undertones.",
type: "Attar",
inspiredBy: "",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Aromatic",
accords: ["Fresh", "Aromatic"],
top: "Sea Water, Citrus, Green Notes",
mid: "Neroli, Geranium",
base: "Oakmoss, Cedar",
price: 69
},
{
id: 42,
name: "Velour Si",
image: "female floral.webp",
images: ["female floral.webp", "veloursa1.webp", "veloursa2.webp", "infoa.webp"],
description: "A sophisticated fruity-floral fragrance with warm vanilla undertones, elegant and feminine.",
type: "Attar",
inspiredBy: "Armani Si",
gender: "Female",
season: "Autumn-Winter",
time: "Night",
family: "Floral Fruity",
accords: ["Floral", "Fruity", "Warm"],
top: "Cassis (Blackcurrant Syrup)",
mid: "May Rose, Freesia",
base: "Vanilla, Patchouli, Ambroxan, Woody Notes",
price: 69
},
{
id: 44,
name: "Captain’s Ember",
image: "norm5.webp",
images: ["norm5.webp", "captainsea1.webp", "captainsea2.webp", "infoa.webp"],
description: "A concentrated attar version delivering warm amber sweetness and woody sensuality.",
type: "Attar",
inspiredBy: "Le Male Elixir",
gender: "Male",
season: "Autumn-Winter",
time: "Night",
family: "Amber Woody",
accords: ["Sweet", "Amber", "Woody"],
top: "Lavender, Mint",
mid: "Vanilla, Benzoin",
base: "Honey, Tonka Bean, Tobacco",
price: 69
},
{
id: 45,
name: "Sabaya",
image: "sabaya.webp",
images: ["sabaya.webp", "sabyaa1.webp", "sabyaa2.webp", "infoa.webp"],
description: "A light and airy floral attar with herbal freshness, ideal for warm daytime wear.",
type: "Attar",
inspiredBy: "",
gender: "Female",
season: "Spring-Summer",
time: "Day",
family: "Floral",
accords: ["Floral", "Herbal"],
top: "Citrus",
mid: "Green Notes",
base: "Rose",
price: 59
},
{
id: 46,
name: "Purple OUD",
image: "norm4.webp",
images: ["norm4.webp", "purpleoa1.webp", "purpleoa2.webp", "infoa.webp"],
description: "A spicy oriental oud fragrance with saffron warmth and woody depth for night-time wear.",
type: "Attar",
inspiredBy: "Dior Purple Oud",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Woody",
accords: ["Oriental", "Woody", "Spicy"],
top: "Pink Pepper, Orange",
mid: "Saffron",
base: "Agarwood (Oud)",
price: 79
},
{
id: 47,
name: "Pulse Royale",
image: "norm6.webp",
images: ["norm6.webp", "pulsera1.webp", "pulsera2.webp", "infoa.webp"],
description: "A modern marine-sweet fragrance with spicy tobacco undertones, energetic and youthful.",
type: "Attar",
inspiredBy: "CR-7",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Aromatic Sweet",
accords: ["Sweet", "Marine", "Sweet"],
top: "Lavender, Cardamom, Artemisia, Bergamot",
mid: "Tobacco, Cinnamon, Cedar, Iris",
base: "Vanilla, Musk, Sandalwood, Amber",
price: 69
},
{
id: 48,
name: "Invictus",
image: "fresh marine.webp",
images: ["fresh marine.webp", "invictusa1.webp", "invictusa2.webp", "infoa.webp"],
description: "A powerful fresh-marine fragrance with citrus brightness and woody amber depth.",
type: "Attar",
inspiredBy: "Paco Rabanne Invictus",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Marine Fresh",
accords: ["Citrus", "Marine", "Aromatic"],
top: "Sea Notes, Grapefruit, Mandarin Orange",
mid: "Bay Leaf, Jasmine",
base: "Ambergris, Guaiac Wood, Oakmoss, Patchouli",
price: 69
},
{
id: 49,
name: "Aseel",
image: "norm1.webp",
images: ["norm1.webp", "aseela1.webp", "aseela2.webp", "infoa.webp"],
description: "A balanced woody-floral attar with herbal nuances and soft musky depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day/Night",
family: "Woody Floral",
accords: ["Woody", "Floral", "Herbal"],
top: "Red Rose, Saffron",
mid: "Sandalwood, Mint",
base: "Agarwood (Oud), Musk",
price: 69
},
{
id: 50,
name: "Fasli Gulab",
image: "fasli gulab.webp",
images: ["fasli gulab.webp", "fasliga1.webp", "fasliga2.webp", "infoa.webp"],
description: "A soft and powdery rose attar capturing the freshness of blooming garden roses.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Spring-Summer",
time: "Day",
family: "Floral",
accords: ["Floral", "Powdery"],
top: "Rose",
mid: "",
base: "",
price: 69
},
{
id: 51,
name: "Aventus",
image: "creed aventus.webp",
images: ["creed aventus.webp", "aventusa1.webp", "aventusa2.webp", "infoa.webp"],
description: "A bold fruity-chypre fragrance with smoky woods and fresh pineapple character.",
type: "Attar",
inspiredBy: "Creed Aventus",
gender: "Male",
season: "All seasons",
time: "Day/Night",
family: "Chypre Fruity",
accords: ["Fruity-Chypre", "Woody"],
top: "Pineapple, Bergamot, Blackcurrant, Apple",
mid: "Birch, Patchouli, Moroccan Jasmine, Rose",
base: "Musk, Oakmoss, Ambergris, Vanille",
price: 85
},
{
id: 52,
name: "Golden Blush",
image: "female floral.webp",
images: ["female floral.webp", "goldenba1.webp", "goldenba2.webp", "infoa.webp"],
description: "A delicate floral gourmand fragrance with creamy sweetness and soft freshness.",
type: "Attar",
inspiredBy: "Carolina Herrrera Good Girl Blush",
gender: "Female",
season: "Spring-Summer",
time: "Day",
family: "Floral Gourmand",
accords: ["Floral", "Gourmand", "Fresh"],
top: "Bergamot, Bitter Almond",
mid: "Peony, Ylang-Ylang",
base: "Vanilla, Coumarin",
price: 69
},
{
id: 54,
name: "Fresh Horizon",
image: "fresh eros.webp",
images: ["fresh eros.webp", "freshha1.webp", "freshha2.webp", "infoa.webp"],
description: "A long-lasting attar version delivering sweet woody warmth with fresh aromatic highlights.",
type: "Attar",
inspiredBy: "Versace Eros",
gender: "Male",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Woody",
accords: ["Woody", "Oriental", "Sweet"],
top: "Mint, Green Apple, Lemon",
mid: "Tonka Bean, Ambroxan, Geranium",
base: "Vanilla, Cedar, Vetiver, Oakmoss",
price: 69
},
{
id: 56,
name: "Velvet Night",
image: "sweet gourmond.webp",
images: ["sweet gourmond.webp", "velvetna1.webp", "velvetna2.webp", "infoa.webp"],
description: "A concentrated attar version of a rich gourmand-oriental scent with coffee sweetness and creamy vanilla depth.",
type: "Attar",
inspiredBy: "YSL Black Opium",
gender: "Female",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Gourmand",
accords: ["Gourmand", "Oriental", "Sweet"],
top: "Pear, Pink Pepper, Orange Blossom",
mid: "Coffee, Jasmine, Bitter Almond, Licorice",
base: "Vanilla, Patchouli, Cedar, Cashmere Wood",
price: 69
},
{
id: 57,
name: "Titanium",
image: "titanium.webp",
images: [
"titanium.webp",
"titanium1.webp",
"titanium2.webp",
"titanium3.webp",
"titanium4.webp",
"titanium5.webp",
"titanium6.webp",
"titanium7.webp",
"titanium100.webp"
],
description: "A fresh aromatic-fruity fragrance offering a clean, energetic profile suitable for everyday wear.",
type: "Perfume",
inspiredBy: "",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Aromatic Fresh",
accords: ["Aromatic","Marine", "Aquatic"],
top: "Pineapple,Mandrin orange",
mid: "Marine note, Patchouli & Dry Amber",
base: "Oakmoss & Musk ",
price: 499
},
{
id: 58,
name: "Titanium",
image: "fresh marine.webp",
images: ["fresh marine.webp", "titaniuma1.webp", "titaniuma2.webp", "infoa.webp"],
description: "A long-lasting attar version of a crisp aromatic fragrance with fruity freshness and woody warmth.",
type: "Attar",
inspiredBy: "Titanium Ajmal",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Aromatic Fresh",
accords: ["Aromatic", "Fruity"],
top: "Citrus, Fruity Notes",
mid: "Fresh Spicy Notes",
base: "Woody Notes, Musk",
price: 89
},
{
id: 59,
name: "White OUD",
image: "norm2.webp",
images: ["norm2.webp", "whiteoa1.webp", "whiteoa2.webp", "infoa.webp"],
description: "A refined oud fragrance softened by fresh florals and subtle tobacco warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Floral",
accords: ["Fresh", "Floral"],
top: "Artemisia, Lemon, Orange",
mid: "Freesia, Patchouli, Black Currant",
base: "Tobacco, Amber, Musk",
price: 79
},
{
id: 61,
name: "Most Wanted",
image: "norm2.webp",
images: ["norm2.webp", "mostwa1.webp", "mostwa2.webp", "infoa.webp"],
description: "A concentrated attar interpretation delivering intense sweetness and woody amber richness.",
type: "Attar",
inspiredBy: "AZ The Most Wanted",
gender: "Male",
season: "Autumn-Winter",
time: "Night",
family: "Amber Woody",
accords: ["Amber", "Woody", "Sweet"],
top: "Cardamom",
mid: "Toffee",
base: "Amberwood",
price: 79
},
{
id: 63,
name: "BLU Ember",
image: "fresh_auqatic.webp",
images: ["fresh_auqatic.webp", "bluea1.webp", "bluea2.webp", "infoa.webp"],
description: "A long-lasting attar version offering aquatic freshness balanced with aromatic warmth.",
type: "Attar",
inspiredBy: "Ajmal BLU",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Aquatic",
accords: ["Fresh", "Aquatic", "Aromatic"],
top: "Watermelon, Bergamot, Lavender",
mid: "Lotus, Jasmine",
base: "Musk, Amber, Sandalwood",
price: 69
},
{
id: 65,
name: "Caramel OUD",
image: "sweet chocolate gourmond.webp",
images: ["sweet chocolate gourmond.webp", "carameloa1.webp", "carameloa2.webp", "infoa.webp"],
description: "A rich attar version offering intense caramel sweetness balanced with smoky oud depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Gourmand Woody",
accords: ["Gourmand", "Woody"],
top: "Chocolate, Honey",
mid: "Rose, Oud, Amber",
base: "Vanilla, Powdery Notes",
price: 69
},
{
id: 66,
name: "Shanaya",
image: "norm4.webp",
images: ["norm4.webp", "shanaya1.webp", "shanaya2.webp", "info.webp"],
description: "A graceful woody-floral fragrance accented with amber warmth and soft sweetness.",
type: "Attar",
inspiredBy: "",
gender: "Female",
season: "All seasons",
time: "Day/Night",
family: "Woody Floral",
accords: ["Woody", "Floral", "Amber"],
top: "Rose, Saffron, Pimento",
mid: "Agarwood (Oud), Caramel, Floral Notes",
base: "Resins, Amber, Musk",
price: 89
},
{
id: 67,
name: "Fresh Impact",
image: "fresh marine.webp",
images: ["fresh marine.webp", "freshia1.webp", "freshia2.webp", "infoa.webp"],
description: "A vibrant citrus-spicy fragrance with green freshness and refined woody depth.",
type: "Attar",
inspiredBy: "LV Imagination",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Spicy",
accords: ["Citrus", "Fresh-Spicy", "Green"],
top: "Citron, Calabrian Bergamot, Orange",
mid: "Ginger, Tunisian Neroli, Cinnamon",
base: "Tea, Ambroxan, Guaiac Wood, Olibanum",
price: 69
},
{
id: 70,
name: "br 540",
image: "br 540.webp",
images: [
"br 540.webp",
"br 5401.webp",
"br 5402.webp",
"br 5403.webp",
"br 5404.webp",
"br 5405.webp",
"br 5406.webp",
"br 5407.webp",
"br 540100.webp"
],
description: "A luxurious ambery fragrance with saffron warmth, airy sweetness, and radiant depth.",
type: "Perfume",
inspiredBy: "MFK Baccarat Rouge 540",
gender: "Unisex",
season: "All seasons",
time: "Day/Night",
family: "Amber Woody",
accords: ["Amber", "Sweet", "Woody"],
top: "Saffron, Jasmine",
mid: "Amberwood, Ambergris",
base: "Fir Resin, Cedar",
price: 499
},
{
id: 71,
name: "BR 540",
image: "smoky.webp",
images: ["smoky.webp", "br540a1.webp", "br540a2.webp", "infoa.webp"],
description: "A concentrated attar version of a radiant ambery fragrance with airy sweetness and luxurious warmth.",
type: "Attar",
inspiredBy: "MFK Baccarat Rouge 540",
gender: "Unisex",
season: "All seasons",
time: "Day/Night",
family: "Amber Woody",
accords: ["Amber", "Sweet", "Woody"],
top: "Saffron, Jasmine",
mid: "Amberwood, Ambergris",
base: "Fir Resin, Cedar",
price: 89
},
{
id: 73,
name: "Qahwa",
image: "sweet gourmond.webp",
images: ["sweet gourmond.webp", "qahwaa1.webp", "qahwaa2.webp", "infoa.webp"],
description: "A long-lasting attar rendition delivering bold coffee warmth blended with sweet spices.",
type: "Attar",
inspiredBy: "Khamra Qahwa",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Gourmand",
accords: ["Spicy", "Coffee", "Sweet"],
top: "Ginger, Cinnamon, Cardamom",
mid: "Praline, Candied Fruits",
base: "Coffee, Tonka Bean, Vanilla",
price: 89
},
{
id: 75,
name: "Obsidian OUD",
image: "smoky.webp",
images: ["smoky.webp", "obsidianoa1.webp", "obsidianoa2.webp", "infoa.webp"],
description: "A concentrated attar version offering intense fruity sweetness layered over smoky oud.",
type: "Attar",
inspiredBy: "Oud maracuja",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Fruity Woody",
accords: ["Fruity-Chypre", "Woody"],
top: "Passionfruit, Saffron, Turkish Rose",
mid: "Oud, Patchouli, Benzoin",
base: "Leather, Amber, Vanilla",
price: 79
},
{
id: 76,
name: "Dark Rebel",
image: "smoky.webp",
images: ["dark rebel.webp", "darkra1.webp", "darkra2.webp", "infoa.webp"],
description: "A dark woody-spicy fragrance with smoky oud and warm amber undertones.",
type: "Attar",
inspiredBy: "TF OUD wood",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Spicy",
accords: ["Woody", "Spicy", "Oriental"],
top: "Cardamom, Sichuan Pepper",
mid: "Vanilla",
base: "Tonka Bean, Oud, Vetiver, Amber",
price: 89
},
{
id: 77,
name: "Woody OUD",
image: "woodyoudp.webp",
images: ["woodyoudp.webp", "woodyoa1.webp", "woodyoa2.webp", "infoa.webp"],
description: "A powerful woody-oriental attar with spicy warmth and deep resinous oud character.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Spicy", "Oriental"],
top: "Cardamom, Sichuan Pepper",
mid: "Vanilla",
base: "Tonka Bean, Oud, Vetiver, Amber",
price: 279
},
{
id: 78,
name: "Musk Abiyad",
image: "norm1.webp",
images: ["norm1.webp", "muskaa1.webp", "muskaa2.webp", "infoa.webp"],
description: "A soft and clean white musk fragrance with powdery floral nuances for everyday wear.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Musky",
accords: ["Musky", "Powdery", "Floral"],
top: "Rose, White Musk",
mid: "Balsamic, Powdery Notes",
base: "Musk, Sandalwood",
price: 89
},
{
id: 79,
name: "Midnight",
image: "smoky, oudy, spicy.webp",
images: ["smoky, oudy, spicy.webp", "midnighta1.webp", "midnighta2.webp", "infoa.webp"],
description: "A fresh spicy-woody fragrance with citrus brightness and aromatic warmth for evening wear.",
type: "Attar",
inspiredBy: "",
gender: "Male",
season: "Autumn-Winter",
time: "Night",
family: "Woody Spicy",
accords: ["Woody", "Fresh Spicy", "Citrus"],
top: "Bergamot, Lavender",
mid: "Geranium, Orange Blossom",
base: "Patchouli, Woody Notes",
price: 89
},
{
id: 80,
name: "Musk Safi",
image: "musk.webp",
images: ["musk.webp", "musksa1.webp", "musksa2.webp", "infoa.webp"],
description: "A clean musky fragrance balanced with soft florals and smooth woody undertones.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Musky Floral",
accords: ["Musky", "Woody", "Floral"],
top: "Lily of the Valley",
mid: "White Musk",
base: "Sandalwood, Amber",
price: 89
},
{
id: 81,
name: "Eternal Sauvage",
image: "dior sauvage.webp",
images: ["dior sauvage.webp", "eternalsa1.webp", "eternalsa2.webp", "infoa.webp"],
description: "A fresh spicy fragrance with aromatic herbs and ambroxan depth, powerful and versatile.",
type: "Attar",
inspiredBy: "Dior Sauvage",
gender: "Male",
season: "All seasons",
time: "Day/Night",
family: "Fresh Spicy",
accords: ["Fresh", "Spicy-Oriental"],
top: "Calabrian Bergamot, Pepper",
mid: "Sichuan Pepper, Lavender, Vetiver",
base: "Ambroxan, Cedar, Labdanum",
price: 69
},
{
id: 82,
name: "Dahnal OUD",
image: "dahnaloud.webp",
images: ["dahnaloud.webp", "dahnaloa1.webp", "dahnaloa2.webp", "infoa.webp"],
description: "A raw and powerful oud attar with honeyed warmth and deep woody intensity.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Honey", "Spicy"],
top: "Oud",
mid: "",
base: "",
price: 99
},
{
id: 83,
name: "Eternal White",
image: "eternal white.webp",
images: [
"eternal white.webp",
"eternal white1.webp",
"eternal white2.webp",
"eternal white3.webp",
"eternal white4.webp",
"eternal white5.webp",
"eternal white6.webp",
"eternal_white7.webp",
"eternal white100.webp"
],
description: "A clean citrus-woody fragrance with aromatic freshness and smooth leather undertones.",
type: "Perfume",
inspiredBy: "Lacoste White",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Woody",
accords: ["Citrus", "Woody", "Aromatic"],
top: "Grapefruit, Rosemary, Cardamom",
mid: "Ylang-Ylang, Tuberose",
base: "Suede, Cedar, Leather, Vetiver",
price: 499
},
{
id: 84,
name: "Eternal White",
image: "lacoste w.webp",
images: ["lacoste w.webp", "eternalwa1.webp", "eternalwa2.webp", "infoa.webp"],
description: "A long-lasting attar version delivering crisp citrus freshness and woody elegance.",
type: "Attar",
inspiredBy: "Lacoste White",
gender: "Male",
season: "Spring-Summer",
time: "Day",
family: "Fresh Woody",
accords: ["Citrus", "Woody", "Aromatic"],
top: "Grapefruit, Rosemary, Cardamom",
mid: "Ylang-Ylang, Tuberose",
base: "Suede, Cedar, Leather, Vetiver",
price: 99
},
{
id: 87,
name: "Intense Suede",
image: "spicy.webp",
images: ["spicy.webp", "intensesa1.webp", "intensesa2.webp", "infoa.webp"],
description: "A rich vanilla-amber fragrance with suede softness and warm spicy accents for intense evening wear.",
type: "Attar",
inspiredBy: "Armani SWY intensely",
gender: "Male",
season: "Autumn-Winter",
time: "Night",
family: "Amber Vanilla",
accords: ["Vanilla", "Sweet", "Amber"],
top: "Pink Pepper, Juniper, Violet",
mid: "Toffee, Cinnamon, Lavender, Sage",
base: "Vanilla, Amber, Tonka Bean, Suede",
price: 79
},
{
id: 89,
name: "Aurum",
image: "aurum.webp",
images: ["aurum.webp", "auruma1.webp", "auruma2.webp", "infoa.webp"],
description: "A concentrated attar version offering creamy white florals with soft fruity sweetness.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day/Night",
family: "Floral, Fresh",
accords: ["White Floral", "Fruity", "Powdery"],
top: "Raspberry, Lemon",
mid: "Orange Blossom, Gardenia, Jasmine",
base: "Vanilla, Amber, Musk",
price: 129
},
{
id: 90,
name: "Blue OUD",
image: "blue oud.webp",
images: [
"blue_oud.webp",
"blue_oud1.webp",
"blue_oud2.webp",
"blue_oud3.webp",
"blue_oud4.webp",
"blue_oud5.webp",
"blue_oud6.webp",
"blue_oud7.webp",
"blue_oud100.webp"
],
description: "A bold oud-leather fragrance with smoky depth and earthy patchouli richness.",
type: "Perfume",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Leather Woody",
accords: ["Oud", "Leather", "Patchouli"],
top: "Blue Lily, Oud",
mid: "Patchouli, Leather",
base: "Amber, Tobacco",
price: 699
},
{
id: 91,
name: "Blue OUD",
image: "blueoud.webp",
images: ["blueoud.webp", "blueoa1.webp", "blueoa2.webp", "infoa.webp"],
description: "A concentrated attar delivering intense oud-leather richness with smoky warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Leather Woody",
accords: ["Oud", "Leather", "Patchouli"],
top: "Blue Lily, Oud",
mid: "Patchouli, Leather",
base: "Amber, Tobacco",
price: 175
},
{
id: 92,
name: "Musk Rijali",
image: "muskrijali.webp",
images: ["muskrijali.webp", "muskr1.webp", "muskr2.webp", "info.webp"],
description: "A refined musky fragrance with subtle sweetness and gentle floral warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Musky",
accords: ["Musky", "Subtle Sweet", "Floral"],
top: "Musk, Bergamot",
mid: "Jasmine, Saffron",
base: "Oud, Amber, Vanilla",
price: 115
},
{
id: 93,
name: "Musk Rijali Premium",
image: "muskrijp.webp",
images: ["muskrijp.webp", "muskrpa1.webp", "muskrpa2.webp", "infoa.webp"],
description: "A premium musky attar with enhanced smoothness, sweetness, and long-lasting warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Musky",
accords: ["Musky", "Subtle Sweet", "Floral"],
top: "Musk, Bergamot",
mid: "Jasmine, Saffron",
base: "Oud, Amber, Vanilla",
price: 199
},
{
id: 94,
name: "OUD Al Shams",
image: "ouodalshams.webp",
images: ["ouodalshams.webp", "oudasa1.webp", "oudasa2.webp", "infoa.webp"],
description: "A warm spicy-vanilla oud fragrance with amber richness and smooth woody depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Spicy",
accords: ["Spicy", "Vanilla", "Amber"],
top: "Rosemary, Spicy Notes",
mid: "Amber, Blackberry",
base: "Cashmere Wood, Vanilla",
price: 199
},
{
id: 97,
name: "Black OUD",
image: "black.webp",
images: ["black.webp", "blackoa1.webp", "blackoa2.webp", "infoa.webp"],
description: "A smoky woody oud fragrance with leathery depth and earthy warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Smoky",
accords: ["Woody", "Smoky"],
top: "Lemon, Mandarin, Oud, Saffron",
mid: "Rose, Patchouli",
base: "Leather, Sandalwood, White Musk, Guaiacwood",
price: 149
},
{
id: 98,
name: "Mukhallat OUD",
image: "prem7.webp",
images: ["prem7.webp", "mukhallatoa1.webp", "mukhallatoa2.webp", "infoa.webp"],
description: "A floral-woody oud blend with spicy warmth and smooth musky undertones.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Floral",
accords: ["Floral", "Woody", "Spicy"],
top: "Floral Notes, Spicy Notes",
mid: "Fruity Notes, Musk",
base: "Musk, Woody Notes",
price: 249
},
{
id: 99,
name: "Mukhallat Rashid",
image: "prem1.webp",
images: ["prem1.webp", "mukhallatra1.webp", "mukhallatra2.webp", "infoa.webp"],
description: "A complex leathery-woody fragrance with floral spices and earthy depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Leather Woody",
accords: ["Leathery", "Woody", "Spicy Floral"],
top: "Saffron, Clove, Sage",
mid: "Rose, Geranium, Henna",
base: "Oud, Vetiver, Soil Tincture, Patchouli",
price: 249
},
{
id: 102,
name: "Mukhallat Maliky",
image: "oudshay.webp",
images: ["oudshay.webp", "mukhallatma1.webp", "mukhallatma2.webp", "infoa.webp"],
description: "A warm woody-amber fragrance enriched with spices and smooth oriental depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Amber",
accords: ["Woody", "Warm Spicy", "Amber"],
top: "Warm Spices, Soft Florals",
mid: "Oud, Amber, Floral Accords",
base: "Musk, Woods, Resinous Warmth",
price: 249
},
{
id: 103,
name: "Musk Tahara",
image: "musktahara.webp",
images: ["musktahara.webp", "muskt1.webp", "muskt2.webp", "info.webp"],
description: "A pure and clean white musk fragrance with soft powdery freshness, ideal for daily wear.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Musky Clean",
accords: ["Fresh", "Musky", "Powdery"],
top: "White Musk",
mid: "",
base: "",
price: 99
},
{
id: 106,
name: "Kuwaiti OUD",
image: "kuwaitioud.webp",
images: ["kuwaitioud.webp", "kuwaitioa1.webp", "kuwaitioa2.webp", "infoa.webp"],
description: "A rich and spicy oud fragrance with earthy warmth and smooth vanilla undertones.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Spicy",
accords: ["Woody", "Spicy", "Earthy"],
top: "Rosemary, Cardamom, Ginger",
mid: "Saffron, Jasmine, Tonka Bean",
base: "Amber, Sandalwood, Vanilla, Oud, Patchouli, Musk",
price: 149
},
{
id: 107,
name: "Kuwaiti OUD Premium",
image: "kuwatioudp.webp",
images: ["kuwatioudp.webp", "kuwaitiopa1.webp", "kuwaitiopa2.webp", "infoa.webp"],
description: "A premium and more intense interpretation of Kuwaiti Oud with enhanced depth and longevity.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Spicy",
accords: ["Woody", "Spicy", "Earthy"],
top: "Rosemary, Cardamom, Ginger",
mid: "Saffron, Jasmine, Tonka Bean",
base: "Amber, Sandalwood, Vanilla, Oud, Patchouli, Musk",
price: 279
},
{
id: 108,
name: "Mysore Sandal",
image: "mysandalp.webp",
images: ["mysandalp.webp", "mysorea1.webp", "mysorea2.webp", "infoa.webp"],
description: "A pure and creamy sandalwood fragrance sourced from Mysore, smooth, meditative, and timeless.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Woody",
accords: ["Woody", "Vanilla", "Musky"],
top: "Sandalwood from Mysore",
mid: "",
base: "",
price: 279
},
{
id: 109,
name: "Seufi OUD",
image: "seufioudp.webp",
images: ["seufioudp.webp", "seufioa1.webp", "seufioa2.webp", "infoa.webp"],
description: "A floral-woody oriental fragrance with musky softness and rich Indian oud depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Woody",
accords: ["Floral", "Woody", "Oriental"],
top: "Mitti",
mid: "Musk",
base: "Agarwood (Indian Oud)",
price: 299
},
{
id: 110,
name: "Indian OUD",
image: "oudindiap.webp",
images: ["oudindiap.webp", "indianoa1.webp", "indianoa2.webp", "infoa.webp"],
description: "A raw and intense Indian oud fragrance with smoky depth and earthy richness.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Smoky",
accords: ["Woody", "Oriental", "Smoky"],
top: "Agarwood (Indian Oud)",
mid: "",
base: "",
price: 599
},
{
id: 111,
name: "Thailand OUD",
image: "oudthaip.webp",
images: ["oudthaip.webp", "thailandoa1.webp", "thailandoa2.webp", "infoa.webp"],
description: "A refined Thai oud fragrance with spicy warmth and subtle sweetness.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Oriental Spicy", "Subtle Sweet"],
top: "Agarwood (Thailand Oud)",
mid: "",
base: "",
price: 599
},
{
id: 112,
name: "Cambodian OUD",
image: "oudcombodip.webp",
images: ["oudcombodip.webp", "cambodianoa1.webp", "cambodianoa2.webp", "infoa.webp"],
description: "A smooth Cambodian oud with mossy undertones and rich oriental warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Oriental", "Mossy"],
top: "Agarwood (Cambodian Oud)",
mid: "",
base: "",
price: 599
},
{
id: 114,
name: "Sandaliya",
image: "sandaliyap.webp",
images: ["sandaliyap.webp", "sandaliyaa1.webp", "sandaliyaa2.webp", "infoa.webp"],
description: "A deep sandalwood-centric fragrance with earthy spice and woody warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Woody Earthy",
accords: ["Citrus Spicy", "Earthy", "Woody"],
top: "Sandalwood",
mid: "",
base: "",
price: 999
},
{
id: 115,
name: "Dehnal OUD Combodi Qadim",
image: "daocombodip.webp",
images: ["daocombodip.webp", "dehnalca1.webp", "dehnalca2.webp", "infoa.webp"],
description: "An aged Cambodian oud attar offering deep honeyed richness and elegant woody warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Honey", "Spicy", "Elegant"],
top: "Aged Cambodian Oud",
mid: "",
base: "",
price: 999
},
{
id: 116,
name: "Dahnal OUD Hindi Qadim",
image: "daoindianp.webp",
images: ["daoindianp.webp", "dehnalha1.webp", "dehnalha2.webp", "infoa.webp"],
description: "An aged Indian oud fragrance showcasing deep woody intensity with honeyed warmth and natural spice.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Oriental",
accords: ["Woody", "Honey", "Spicy"],
top: "Aged Indian Oud",
mid: "",
base: "",
price: 999
},
{
id: 117,
name: "Fire OUD",
image: "fire oud.webp",
images: [
"fire_oud.webp",
"fire_oud1.webp",
"fire_oud2.webp",
"fire_oud3.webp",
"fire_oud4.webp",
"fire_oud5.webp",
"fire_oud6.webp",
"fire_oud7.webp",
"fire_oud100.webp"
],
description: "A bold woody-leather fragrance with aromatic freshness and smoky warmth.",
type: "Perfume",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Leather Woody",
accords: ["Woody", "Leather", "Aromatic"],
top: "Geranium, Leather",
mid: "Cedar, Patchouli",
base: "Moss, Musk, Amber",
price: 699
},
{
id: 118,
name: "Fire OUD",
image: "fireoud.webp",
images: ["fireoud.webp", "fireoa1.webp", "fireoa2.webp", "infoa.webp"],
description: "A concentrated attar version delivering intense leather-woody richness with smoky depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Leather Woody",
accords: ["Woody", "Leather", "Aromatic"],
top: "Geranium, Leather",
mid: "Cedar, Patchouli",
base: "Moss, Musk, Amber",
price: 149
},
{
id: 119,
name: "Ruh Khus",
image: "ruhkhusp.webp",
images: ["ruhkhusp.webp", "ruhkhusa1.webp", "ruhkhusa2.webp", "infoa.webp"],
description: "A pure vetiver fragrance offering earthy freshness, green herbal tones, and cooling depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Summer",
time: "Day",
family: "Green Earthy",
accords: ["Fresh", "Green Herbal", "Earthy"],
top: "Vetiver (Khus)",
mid: "",
base: "",
price: 699
},
{
id: 120,
name: "Fume Vanille",
image: "fume vanille.webp",
images: [
"fume vanille.webp",
"fume vanille1.webp",
"fume vanille2.webp",
"fume vanille3.webp",
"fume vanille4.webp",
"fume vanille5.webp",
"fume vanille6.webp",
"fume_vanille7.webp",
"fume vanille100.webp"
],
description: "A warm oriental gourmand fragrance blending tobacco spice with creamy vanilla sweetness.",
type: "Perfume",
inspiredBy: "Tobacco Vanille",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Gourmand",
accords: ["Oriental", "Gourmand", "Smoky"],
top: "Tobacco Leaf, Spicy Notes",
mid: "Vanilla, Cacao, Tonka Bean, Tobacco Blossom",
base: "Dried Fruits, Woody Notes",
price: 499
},
{
id: 121,
name: "Fume Vanille",
image: "smokysweet.webp",
images: ["smokysweet.webp", "fumeva1.webp", "fumeva2.webp", "infoa.webp"],
description: "A rich attar version delivering deep vanilla sweetness and smoky tobacco warmth.",
type: "Attar",
inspiredBy: "Tobacco Vanille",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Gourmand",
accords: ["Oriental", "Gourmand", "Smoky"],
top: "Tobacco Leaf, Spicy Notes",
mid: "Vanilla, Cacao, Tonka Bean, Tobacco Blossom",
base: "Dried Fruits, Woody Notes",
price: 99
},
{
id: 122,
name: "Al Dahab",
image: "aldahab.webp",
images: ["aldahab.webp", "aldahaba1.webp", "aldahaba2.webp", "infoa.webp"],
description: "A luxurious fruity-floral fragrance with woody sweetness and golden warmth.",
type: "Attar",
inspiredBy: "Wisal Dahab",
gender: "Female",
season: "Autumn-Winter",
time: "Night",
family: "Floral Woody",
accords: ["Dark Wood", "Sweet", "Floral"],
top: "Pear, Apple, Peach, Grapefruit, Mandarin Orange",
mid: "Rose, Orchid, Jasmine, Geranium",
base: "Sandalwood, Musk, Cedar, Patchouli",
price: 129
},
{
id: 123,
name: "Eternal Elixir",
image: "spicy.webp",
images: ["spicy.webp", "eternalela1.webp", "eternalela2.webp", "infoa.webp"],
description: "A bold spicy-woody fragrance with aromatic lavender and rich resinous warmth.",
type: "Attar",
inspiredBy: "Sauvage Elixir",
gender: "Male",
season: "Autumn-Winter",
time: "Night",
family: "Woody Spicy",
accords: ["Woody", "Floral", "Spicy"],
top: "Nutmeg, Cinnamon, Cardamom, Grapefruit",
mid: "Lavender",
base: "Licorice, Sandalwood, Amber, Patchouli, Haitian Vetiver",
price: 89
},
{
id: 127,
name: "Rose OUD",
image: "roseoud.webp",
images: ["roseoud.webp", "roseouda1.webp", "roseouda2.webp", "infoa.webp"],
description: "A concentrated attar version highlighting the richness of rose layered over oud.",
type: "Attar",
inspiredBy: "OUD And Roses",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Floral",
accords: ["Woody", "Oriental", "Citrus"],
top: "Rose",
mid: "Rose",
base: "Agarwood (Oud)",
price: 99
},
{
id: 128,
name: "Mafia Oud",
image: "blueoud.webp",
images: ["blueoud.webp", "mafiaouda1.webp", "mafiaouda2.webp", "infoa.webp"],
description: "A dark smoky oud fragrance with earthy woods and subtle fruity undertones.",
type: "Attar",
inspiredBy: "Mafia OUD",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Smoky",
accords: ["Woody", "Oriental", "Smoky"],
top: "Oud, Musk, Patchouli",
mid: "Sandalwood, Vetiver, Vanilla",
base: "Woody, Smoky, Fruity, Earthy",
price: 149
},
{
id: 129,
name: "Badee Al OUD",
image: "all.webp",
images: ["all.webp", "badeeoa1.webp", "badeeoa2.webp", "infoa.webp"],
description: "A modern spicy-oud fragrance blending aromatic freshness with warm woody richness.",
type: "Attar",
inspiredBy: "Badee Al OUD",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Spicy",
accords: ["Woody", "Warm Spicy", "Fresh Spicy"],
top: "Saffron, Nutmeg, Lavender",
mid: "Oud, Patchouli",
base: "Oud, Patchouli, Musk",
price: 99
},
{
id: 130,
name: "Arabian Tonka",
image: "oudriz.webp",
images: ["oudriz.webp", "arabiantonka1.webp", "arabiantonka2.webp", "infoa.webp"],
description: "A rich gourmand-oriental fragrance with sweet tonka bean and warm amber depth.",
type: "Attar",
inspiredBy: "Arabian Tonka",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Gourmand",
accords: ["Oriental", "Gourmand", "Woody"],
top: "Saffron, Bergamot",
mid: "Oud, Bulgarian Rose",
base: "Tonka Bean, Sugar Cane, Amber, White Musk, Oakmoss",
price: 99
},
{
id: 131,
name: "Musk Rose",
image: "muskrose.webp",
images: ["muskrose.webp", "muskrosea1.webp", "muskrosea2.webp", "infoa.webp"],
description: "A romantic floral-musky fragrance where fresh roses blend with soft spices and creamy woods.",
type: "Attar",
inspiredBy: "Musk Rose",
gender: "Unisex",
season: "All seasons",
time: "Day",
family: "Floral Musky",
accords: ["Floral", "Spicy", "Musky"],
top: "Bergamot, Peach, Apple, Pear",
mid: "Cyclamen, Freesia, Rose",
base: "Sandalwood, Cedarwood, Vanilla, Amber, Musk",
price: 99
},
{
id: 133,
name: "Al Lail",
image: "prem9.webp",
images: ["prem9.webp", "allaila1.webp", "allaila2.webp", "infoa.webp"],
description: "A sensual fruity-floral fragrance with oud richness and incense warmth, elegant and mysterious.",
type: "Attar",
inspiredBy: "Wisal Lail",
gender: "Female",
season: "Autumn-Winter",
time: "Night",
family: "Floral Woody",
accords: ["Fruity", "Floral", "Woody"],
top: "Blackcurrant, Apricot, Freesia",
mid: "Rose, Patchouli, Osmanthus",
base: "Musk, Oud, Frankincense",
price: 129
},
{
id: 134,
name: "Rooh Gulab",
image: "rooh gulab.webp",
images: ["rooh gulab.webp", "roohgula1.webp", "roohgula2.webp", "infoa.webp"],
description: "A pure and natural rose distillation capturing the essence of fresh blooming roses.",
type: "Attar",
inspiredBy: "Rooh Gulab",
gender: "Unisex",
season: "Spring-Summer",
time: "Day",
family: "Floral",
accords: ["Rose Floral"],
top: "Rose",
mid: "",
base: "",
price: 129
},
{
id: 135,
name: "Tobacco OUD",
image: "black.webp",
images: ["black.webp", "tobaccoouda1.webp", "tobaccoouda2.webp", "infoa.webp"],
description: "A dark and intense blend of tobacco smoke and oud with spicy warmth and resinous sweetness.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Smoky",
accords: ["Woody", "Leathery", "Tobacco"],
top: "Whiskey",
mid: "Spicy Notes, Cinnamon, Coriander",
base: "Tobacco, Oud, Incense, Sandalwood, Patchouli, Benzoin, Vanilla, Cedar",
price: 129
},
{
id: 136,
name: "Arabian OUD",
image: "prem1.webp",
images: ["prem1.webp", "arabianouda1.webp", "arabianouda2.webp", "infoa.webp"],
description: "A smooth and powdery oud fragrance with warm spices and oriental depth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Woody",
accords: ["Woody", "Powdery", "Warm Spicy"],
top: "",
mid: "",
base: "",
price: 129
},
{
id: 137,
name: "Bin Sheikh",
image: "prem8.webp",
images: ["prem8.webp", "binsheikha1.webp", "binsheikha2.webp", "infoa.webp"],
description: "A rich amber-oud fragrance with floral sweetness and smoky oriental warmth.",
type: "Attar",
inspiredBy: "AM BIN SHEIKH",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Amber Oriental",
accords: ["Amber", "Oud", "Sweet"],
top: "Saffron, Rose, Oakmoss, Lavender, Citruses",
mid: "Sugar, Bakhoor, Jasmine, Orchid, Violet",
base: "Oud, Amber, Ambroxan, Patchouli, White Musk",
price: 129
},
{
id: 140,
name: "Silk Oud",
image: "silkoud.webp",
images: ["silkoud.webp", "silkouda1.webp", "silkouda2.webp", "infoa.webp"],
description: "A refined floral-woody oud fragrance with herbal softness and smooth resinous depth.",
type: "Attar",
inspiredBy: "MFK Silk OUD",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Woody Floral",
accords: ["Herbal", "Woody", "Floral"],
top: "Bulgarian Rose, Chamomile, Bergamot",
mid: "Guaiac Wood, Hedione",
base: "Oud, Papyrus",
price: 99
},
{
id: 141,
name: "Shamama",
image: "prem9.webp",
images: ["prem9.webp", "shamamaa1.webp", "shamamaa2.webp", "infoa.webp"],
description: "A traditional complex attar blending woods, florals, and powdery warmth with deep heritage character.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Woody",
accords: ["Woody", "Floral", "Powdery"],
top: "Grass, Mint",
mid: "Floral notes, Honey, Sea notes",
base: "Smoke, Sandalwood",
price: 249
},
{
id: 142,
name: "Al Wadi",
image: "prem6.webp",
images: ["prem6.webp", "ruhalwadia1.webp", "ruhalwadia2.webp", "infoa.webp"],
description: "A powerful aromatic-leather fragrance with oud richness and spicy freshness.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Leather Aromatic",
accords: ["Woody", "Aromatic", "Leather"],
top: "Sicilian Bergamot, Pink Pepper, Davana",
mid: "Oud, White Amber, Rosemary",
base: "Leather, Musk, Haitian Vetiver",
price: 129
},
{
id: 144,
name: "Ombre",
image: "blueoud.webp",
images: ["blueoud.webp", "ombrea1.webp", "ombrea2.webp", "infoa.webp"],
description: "A deep and intense attar version with smoky oud, amber richness, and spicy warmth.",
type: "Attar",
inspiredBy: "",
gender: "Unisex",
season: "All seasons",
time: "Night",
family: "Leathry Spicy",
accords: ["Leather", "Warm spicy", "Floral"],
top: "Cardamom",
mid: "Leather, Jasmine",
base: "Amber, Moss, Patchouli",
price: 139
},
{
id: 146,
name: "Satin OUD",
image: "prem7.webp",
images: ["prem7.webp", "satinoa1.webp", "satinoa2.webp", "infoa.webp"],
description: "A concentrated attar version of a luxurious rose-oud composition with creamy vanilla and amber warmth.",
type: "Attar",
inspiredBy: "MFK oud Satin Mood",
gender: "Unisex",
season: "Autumn-Winter",
time: "Night",
family: "Oriental Floral",
accords: ["Rose", "Floral", "Oud", "Amber", "Vanilla", "Powdery"],
top: "Bulgarian Rose, Violet, Strawberry",
mid: "Turkish Rose",
base: "Oud (Agarwood), Vanilla, Amber, Benzoin, Caramel, Cedar",
price: 89
},
// Frontend-only catalogue: product images are intentionally local files in this folder.
...[
['Afternoon Dive','LV Afternoon Swim','Unisex','Spring-Summer','Day','Fresh|Citrus|Aquatic','Mandarin Orange, Sicilian Orange, Bergamot.','Ginger.','Ambergris.',599,['afternoon_dive8.webp','afternoon_dive20.webp','afternoon_dive3.webp']],['Al Wadi','Imperial Valley Gissah','Unisex','Autumn-Winter','Night','Woody|Spicy|Amber','Pink Pepper, Bergamot, Davana.','Leather, White Amber, Rosemary.','Oud, Musk, Vetiver.',599,['al_wadi8.webp','al_wadi20.webp','al_wadi3.webp']],['Alpha Blue','YSL Y Le Parfum','Male','Autumn-Winter','Night','Aromatic|Woody|Spicy','Grapefruit, Apple, Ginger.','Lavender, Sage, Geranium.','Tonka Bean, Cedar, Patchouli, Olibanum.',499,['alpha_blue8.webp','alpha_blue20.webp','alpha_blue3.webp']],['Azure Tide','Kaaf Ahmed Al Maghribi','Unisex','Spring-Summer','Day','Fresh|Aquatic|Fruity','Watermelon, Red Fruits, Lavender.','Jasmine, Lotus, Marine Notes.','White Musk, Sandalwood, Ambroxan.',499,['azure_tide8.webp','azure_tide20.webp','azure_tide3.webp']],['Caramel OUD','Caramel OUD','Unisex','Autumn-Winter','Night','Sweet|Oud|Amber','Caramel, Saffron.','Rose, Amber, Praline.','Oud, Vanilla, Musk.',499,['caramel_oud8.webp','caramel_oud20.webp','caramel_oud3.webp']],['Dark Rebel','LV Myriad','Unisex','Autumn-Winter','Night','Oud|Floral|Spicy','Saffron.','Bulgarian Rose, Grasse Rose.','Assam Oud, Cacao, Ambrette, White Musk.',699,['dark_rebel5.webp','dark_rebel3.webp','dark_rebel1.webp']],['Ember','','Unisex','All seasons','Day/Night','Fruity|Musky|Woody','mandarin orange, grapefruit, bergamot, apple, blue orchids','jasmine, lily of the valley, white orchid, pineapple','sandalwood, amber, musk, and vanilla',699,['ember.webp']],['Golden Aura','Ajmal Aurum','Unisex','Spring-Summer','Day/Night','Fruity|Floral|Sweet','Lemon, Raspberry, Fruity Notes.','Gardenia, Jasmine, Orange Blossom.','Vanilla, Amber, Musk, Woody Notes.',599,['golden_aura8.webp','golden_aura20.webp','golden_aura3.webp']],['Intus',"Terre D'Hermes",'Male','Spring-Autumn','Day','Woody|Citrus|Spicy','Orange, Grapefruit.','Pepper, Geranium.','Vetiver, Cedar, Patchouli, Benzoin.',499,['intus.webp']],['Melior','Xerjoff Naxos','Unisex','Autumn-Winter','Night','Sweet|Tobacco|Aromatic','Lavender, Bergamot, Lemon.','Honey, Cinnamon, Cashmeran, Jasmine Sambac.','Tobacco Leaf, Vanilla, Tonka Bean.',599,['melior.webp']],['Million','Paco Rabanne 1 Million','Male','Autumn-Winter','Night','Spicy|Citrus|Leather','Blood Mandarin, Grapefruit, Mint.','Cinnamon, Spicy Notes, Rose.','Amber, Leather, Woody Notes, Patchouli.',499,['million8.webp','million20.webp','million3.webp']],['Mukhallat','','Unisex','Autumn-Winter','Night','Woody|Amber|Spicy','Bergamot, Cardamom, Cinnamon, Fruity Notes.','Lavender, Tobacco, Rose, Spicy Notes.','Amber, Vanilla, Musk, Sandalwood, Oud.',499,['mukhallat8.webp','mukhallat20.webp','mukhallat3.webp']],['Noble','Initio Oud for Greatness','Unisex','Autumn-Winter','Night','Oud|Spicy|Aromatic','Saffron, Nutmeg, Lavender.','Oud.','Patchouli, Musk.',799,['noble.webp']],['Ombre','','Unisex','All Seasons','Night','Leather|Smoky|Floral','Cardamom.','Leather, Jasmine Sambac.','Amber, Moss, Patchouli.',499,['ombre.webp']],['Pink Vanilla','Kayali Vanilla Candy Rock Sugar','Female','Spring-Autumn','Day/Night','Sweet|Vanilla|Fruity','Candied Pear, Bubble Gum, Vanilla, Violet Leaf.','Caramel, Jasmine, Tonka Bean, Ylang-Ylang, Labdanum.','Rock Sugar, Patchouli, Sandalwood, Cashmere Wood.',499,['pink_vanilla8.webp','pink_vanilla20.webp','pink_vanilla3.webp']],['Qahwa','Lattafa Khamrah Qahwa','Unisex','Autumn-Winter','Night','Spicy|Coffee|Sweet','Cinnamon, Cardamom, Ginger.','Praline, Candied Fruits, White Flowers.','Coffee, Vanilla, Tonka Bean, Benzoin, Musk.',499,['qahwa8.webp','qahwa20.webp','qahwa3.webp']],['Tao Mist','Diptyque Tam Dao','Unisex','Spring-Autumn','Day/Night','Woody|Aromatic|Powdery','Rose, Myrtle, Italian Cypress.','Sandalwood, Cedar.','Spices, Amber, White Musk, Brazilian Rosewood.',499,['tao_mist8.webp','tao_mist20.webp','tao_mist3.webp']],['Urban Icon','Dunhill Icon','Male','Spring-Summer','Day','Fresh|Citrus|Woody','Neroli, Bergamot, Black Pepper, Petitgrain.','Lavender, Cardamom, Juniper Berries, Sage.','Vetiver, Oakmoss, Leather, Oud, Iris.',499,['urban_icon8.webp','urban_icon20.webp','urban_icon3.webp']],['Vanaffe','','Female','Autumn-Winter','Night','Sweet|Coffee|Vanilla','Candied Pear, Bubble Gum, Coffee, Vanilla.','Caramel, Jasmine, Tonka Bean, Coffee Blossom.','Rock Sugar, Vanilla, Sandalwood, Patchouli, Musk.',499,['vanaffe8.webp','Vanaffe20.webp','vanaffe3.webp']],['White OUD','White Oud','Unisex','Autumn-Winter','Night','Oud|Woody|Musky','Bergamot, Saffron, White Pepper.','Rose, Jasmine, White Woods.','White Oud, Musk, Amber, Sandalwood.',499,['white_oud8.webp','white_oud20.webp','white_oud3.webp']],['Symphoria','LV Symphony','Unisex','Spring-Summer','Day','Citrus|Fresh|Fruity','Grapefruit, Bergamot, Orange.','Ginger, Fresh Spices.','Amber, Musk.',799,['symphoria.webp']]
].map(([name, inspiredBy, gender, season, time, accords, top, mid, base, price, comboImages], index) => {
/*
IMAGE LOGIC
=========================================================
Example: "Afternoon Dive"
DEFAULT THUMBNAIL / 30 ML PREMIUM GIFT:
afternoon_dive.webp
REGULAR PERFUME BOTTLES:
8 ml   → afternoon_dive1.webp
20 ml  → afternoon_dive2.webp
30 ml  → afternoon_dive3.webp
50 ml  → afternoon_dive4.webp
100 ml → afternoon_dive5.webp
PREMIUM GIFT PERFUMES:
30 ml  → afternoon_dive.webp
50 ml  → afternoon_dive7.webp
100 ml → afternoon_dive100.webp
TRANSPARENT COMBO-SET OVERLAYS:
8 ml   → afternoon_dive8.webp
20 ml  → afternoon_dive20.webp
*/
// Convert product name into filename-safe base:
// "Afternoon Dive" → "afternoon_dive"
// "Golden Aura"    → "golden_aura"
// "White OUD"      → "white_oud"
const imageBase = name
.trim()
.toLowerCase()
.replace(/[^a-z0-9]+/g, '_')
.replace(/^_+|_+$/g, '');
// Main/default thumbnail.
// Also represents the 30 ml premium gift perfume.
const defaultImage = `${imageBase}.webp`;
/*
Standard product image array.
IMPORTANT:
These indexes match your existing PERFUME_VARIANT_INDEX:
0 = default thumbnail
1 = 8 ml
2 = 20 ml
3 = 30 ml
4 = 50 ml
5 = 100 ml
6 = 30 ml premium gift
7 = 50 ml premium gift
8 = 100 ml premium gift
*/
const variants = [
defaultImage,                 // [0] Default thumbnail
`${imageBase}1.webp`,          // [1] 8 ml
`${imageBase}2.webp`,          // [2] 20 ml
`${imageBase}3.webp`,          // [3] 30 ml
`${imageBase}4.webp`,          // [4] 50 ml
`${imageBase}5.webp`,          // [5] 100 ml
defaultImage,                 // [6] 30 ml premium gift = default image
`${imageBase}7.webp`,          // [7] 50 ml premium gift
`${imageBase}100.webp`         // [8] 100 ml premium gift
];
/*
Transparent PNGs used ONLY for overlapping bottles
inside the Custom Combo Set box.
The existing compact array already provides these:
comboImages[0] = 8 ml transparent PNG
comboImages[1] = 20 ml transparent PNG
Example:
afternoon_dive8.webp
afternoon_dive20.webp
*/
const comboOverlayImages = {
8: comboImages?.[0] || `${imageBase}8.webp`,
20: comboImages?.[1] || `${imageBase}20.webp`
};
return {
id: `frontend_${index + 1}`,
name,
type: 'Perfume',
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
// Used by product grid thumbnail
image: defaultImage,
// Used by regular perfume size and premium gift variants
images: variants,
// Used only for transparent overlapping bottles in Custom Set
comboOverlayImages,
description: `${accords.replaceAll('|', ', ')} fragrance inspired by ${inspiredBy}.`
};
})
];
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
const pricing = getPricing(product.price,1);
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
s.priceMultiplier
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
// `image` is the established 30 ml gift-pack/default thumbnail asset for both
// older JPG products and newer PNG products. Do not depend on image6 existing.
return normalizeImageUrl(product?.image || product?.images?.[0] || `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`);
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
if (src.startsWith('http') || src.startsWith('/') || src.includes('?')) return [];
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
return [
...explicit,
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
mergeProducts();
return;
try {
const res = await fetch(`${BACKEND_BASE_URL}/api/products`);
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
const key = cat.toLowerCase().replace(/\s+/g, '');
return map[key] || 'Perfume';
}
backendProducts = data.products.map(p => ({
id: 'db_' + p._id,
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
image: resolveMergeImage(p.images?.[0]),
images: (p.images || []).map(resolveMergeImage),
source: 'backend'
}));
mergeProducts();
} catch (err) {
console.error('Failed to load backend products', err);
mergeProducts();
}
}
function mergeProducts() {
allProducts = [
...products.map(p => ({ ...p, source: 'frontend' }))
];
renderProducts(allProducts);
renderBundleBuilder();
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
if (currentUser && authToken) {
if (welcome) { welcome.classList.remove('hidden'); if (welcomeEmail) welcomeEmail.textContent = currentUser.email || ''; }
if (navUserIcon) { navUserIcon.classList.remove('text-gray-300'); navUserIcon.classList.add('text-yellow-400'); }
if (checkoutEmail) { checkoutEmail.value = currentUser.email || ''; checkoutEmail.readOnly = true; }
renderSavedAddressControls();
if (signupCard) signupCard.classList.add('hidden');
if (loginCard) loginCard.classList.add('hidden');
if (navAccountLink) {
navAccountLink.textContent = 'Profile';
navAccountLink.onclick = () => switchPage('profile');
}
populateProfile();
} else {
if (welcome) welcome.classList.add('hidden');
if (navUserIcon) { navUserIcon.classList.add('text-gray-300'); navUserIcon.classList.remove('text-yellow-400'); }
if (checkoutEmail) { checkoutEmail.readOnly = false; }
if (savedAddressBtn) savedAddressBtn.classList.add('hidden');
if (signupCard) signupCard.classList.remove('hidden');
if (loginCard) loginCard.classList.remove('hidden');
if (navAccountLink) {
navAccountLink.textContent = 'Account';
navAccountLink.onclick = () => switchPage('profile');
}
}
}
function switchPage(pageId) {
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
const pricing = getPricing(product.price, 1);
const imageUrl = getDefaultProductImage(product);
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
<div class="absolute top-2 left-2 z-10 flex flex-col gap-1">
<span class="badge gender ${genderClass}">
${product.gender || 'Unisex'}
</span>
${product.time ? `
<span class="badge time ${timeClass}">
${product.time}
</span>` : ''}
${product.season ? `
<span class="badge season ${seasonClass}">
${product.season}
</span>` : ''}
<span class="badge category ${typeClass}">
${product.type || product.category}
</span>
</div>
<img
${imageWithFallback(imageUrl, `${window.__EE_IMAGE_BASE__ || '/products/'}placeholder.webp`)}
alt="${product.name}"
class="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
loading="lazy"
/>
</div>
<div class="product-details px-4 pb-5 pt-4 text-center">
${product.family ? `
<p class="text-xs text-gray-500 uppercase tracking-wide">
${product.family}
</p>` : ''}
<h3 class="brand-font text-lg font-bold mt-1 text-gray-900">
${product.name}
</h3>
<p class="text-xs text-gray-500 mt-1 line-clamp-2">
${product.description || ''}
</p>
<div class="mt-3 flex flex-col items-center">
<div class="inline-flex rounded-full bg-black px-4 py-1 text-lg font-bold text-yellow-400 shadow-sm">
₹${pricing.sellingPrice.toLocaleString("en-IN")}
</div>
<div class="flex items-center gap-2 mt-2">
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
const sizes = getSizesByCategory(product.type || product.category);
const size = sizes.find(s => Number(s.value) === Number(sizeMl) && String(s.unit).toLowerCase() === 'ml');
return Math.ceil(Number(product.price || 0) * (size?.priceMultiplier || 1));
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
function getPricing(basePrice, multiplier = 1) {
const sellingPrice = Math.ceil(basePrice * multiplier);
const mrp = roundTo99(sellingPrice * 1.35);
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
function removeFromCart(i){ cart.splice(i,1); updateCartCount(); renderCart(); saveCartToStorage(); }
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
if (!item || !isQuantityCartItem(item)) return;
const next = cartItemQty(item) + Number(delta || 0);
if (next <= 0) cart.splice(index, 1);
else item.quantity = next;
updateCartCount(); renderCart(); saveCartToStorage();
window.dispatchEvent(new Event('ee:cart-updated'));
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
const quantityControls = canChangeQty
? `<div class="ee-cart-qty" aria-label="Change quantity">
<button type="button" onclick="changeCartQuantity(${idx}, -1)" title="Decrease quantity">-</button>
<b>${qty}</b>
<button type="button" onclick="changeCartQuantity(${idx}, 1)" title="Increase quantity">+</button>
</div>`
: `<span class="text-xs text-gray-500">${item.itemType === 'perfume_card' ? `Qty ${item.cardMeta?.qty || 1}` : 'Set item'}</span>`;
tr.innerHTML = `
<td class="ee-cart-product p-4 flex items-center gap-4 pr-14 md:pr-4 cursor-pointer" onclick="editCartItem(${idx})" title="Open product options">
${itemVisual}
<div class="ee-cart-product-copy"><p class="font-bold text-sm">${item.name}</p>${bundleDetails}</div>
</td>
<td class="ee-cart-size block md:table-cell px-4 pb-2 md:p-4 text-sm text-gray-600"><span class="md:hidden font-bold text-gray-500 mr-2">Size:</span>${item.selectedSize}</td>
<td class="ee-cart-quantity block md:table-cell px-4 pb-4 md:p-4 text-sm"><span class="ee-cart-mobile-label md:hidden">Quantity</span>${quantityControls}</td>
<td class="ee-cart-price block md:table-cell px-4 pb-4 md:p-4 text-sm font-bold"><span class="md:hidden font-bold text-gray-500 mr-2">Price:</span>₹${linePrice.toLocaleString('en-IN')}${canChangeQty && qty > 1 ? `<small class="block text-[11px] font-normal text-gray-500">₹${unitPrice.toLocaleString('en-IN')} each</small>` : ''}</td>
<td class="ee-cart-actions absolute top-4 right-4 md:static md:table-cell p-0 md:p-4 md:text-right">
<div class="flex items-center justify-end gap-2">
<button onclick="editCartItem(${idx})" class="w-9 h-9 rounded-full border border-yellow-200 text-yellow-700 hover:bg-yellow-50" title="Edit item"><i class="fas fa-pen"></i></button>
<button onclick="removeFromCart(${idx})" class="w-9 h-9 rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700" title="Remove item"><i class="fas fa-trash"></i></button>
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
const seenOrders = new Set();
const orders = fetchedOrders.filter(order => {
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
const canRetry = ['PAYMENT_FAILED', 'FAILED', 'PENDING_PAYMENT'].includes(statusVal);
const canCancel = ['PAID', 'ORDER_PLACED', 'PROCESSING', 'Processing', 'PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(statusVal);
tr.innerHTML = `
<td class="p-3 text-sm font-semibold">${orderId}</td>
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
${canRetry ? `<button class="retry-btn px-2 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded">Retry</button>` : ''}
${canCancel ? `<button class="cancel-btn px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded">Cancel</button>` : ''}
</td>
`;
tr.addEventListener('click', () => openOrderDetails(order));
if (canRetry) {
tr.querySelector('.retry-btn').addEventListener('click', e => {
e.stopPropagation();
retryPayment(order._id);
});
}
if (canCancel) {
tr.querySelector('.cancel-btn').addEventListener('click', e => {
e.stopPropagation();
cancelOrder(order._id);
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
const options = {
key: d.keyId,
amount: d.amount,
currency: 'INR',
name: 'Eternal Essence',
description: `Order ${d.orderId}`,
image: 'ee.webp',
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
cart.length = 0; updateCartCount(); renderCart(); saveCartToStorage(); renderOrders(); showDeliveryEstimateModal(verifyData.deliveryEstimate);
} catch (err) {
console.error('Verification error', err); alert(err.message || 'Payment captured but verification failed. Contact support.');
}
},
modal: {
ondismiss: async function () {
try {
await fetch(`${BACKEND_BASE_URL}/api/orders/payment-failed`, {
method: 'POST',
headers,
body: JSON.stringify({
razorpayOrderId: d.razorpayOrderId,
reason: 'User closed Razorpay popup'
})
});
} catch (err) {
console.warn('Failed to mark payment failed');
}
}
}
};
const rzp = new Razorpay(options); rzp.open();
rzp.on('payment.failed', async function (response) {
try {
await fetch(`${BACKEND_BASE_URL}/api/orders/payment-failed`, {
method: 'POST',
headers,
body: JSON.stringify({
razorpayOrderId: d.razorpayOrderId,
reason: response.error?.description || 'Payment failed'
})
});
} catch (err) {
console.warn('Failed to mark payment failed');
}
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
function retryPayment(orderId) {
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
.then(data => {
if (!data.success) {
alert(data.error || 'Retry not allowed');
return;
}
const options = {
key: data.keyId,
amount: data.amount,
currency: 'INR',
name: 'Eternal Essence',
order_id: data.razorpayOrderId,
handler: function (response) {
alert('Payment successful. Please refresh orders.');
}
};
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
let activeCategory = 'all';
function setCategory(cat, skipURL = false){
if (normalize(cat) === 'combo') {
history.replaceState({}, "", "#custom-set");
switchPage('custom-set');
return;
}
activeCategory = cat;
document.querySelectorAll(".cat-btn").forEach(btn=>{
btn.classList.toggle("active", btn.dataset.cat === cat);
});
applyFilters();
if(!skipURL){
history.pushState({}, "", `#home?cat=${encodeURIComponent(cat)}`);
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
const pricing = getPricing(product.price, 1);
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
const res = await fetch(`${BACKEND_BASE_URL}/api/products/bundle-rules`);
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
el.innerHTML = "";
el.innerHTML += `
<div onclick="goToCategory('Attar')"
class="px-4 py-2 bg-yellow-500 text-black font-bold cursor-pointer text-center">
All Attars
</div>
`;
for(const facet in attarFacets){
el.innerHTML += `
<div class="px-4 py-2 text-yellow-500 font-bold cursor-pointer"
onclick="this.nextElementSibling.classList.toggle('hidden')">
${facet}
</div>
<div class="hidden">
${Object.keys(attarFacets[facet]).map(key => `
<div class="px-6 py-2 text-gray-300 font-semibold cursor-pointer"
onclick="this.nextElementSibling.classList.toggle('hidden')">
${key}
</div>
<div class="hidden">
${attarFacets[facet][key].map(p => `
<div class="px-8 py-2 hover:bg-yellow-500 hover:text-black cursor-pointer"
onmouseenter="showAttarPreview(event, ${p.id})"
onmousemove="moveAttarPreview(event)"
onmouseleave="hideAttarPreview()"
onclick="event.stopPropagation(); openProduct(${p.id})"
>
${p.name} — ₹${p.price}
</div>
`).join("")}
</div>
`).join("")}
</div>
`;
}
for(const series in attarGroups){
el.innerHTML += `
<div class="px-4 py-2 text-yellow-500 font-bold cursor-pointer"
onclick="this.nextElementSibling.classList.toggle('hidden')">
${series}
</div>
<div class="hidden">
${attarGroups[series].map(p => `
<div class="px-6 py-2 hover:bg-yellow-500 hover:text-black cursor-pointer"
onmouseenter="showAttarPreview(event, ${p.id})"
onmousemove="moveAttarPreview(event)"
onmouseleave="hideAttarPreview()"
onclick="event.stopPropagation(); openProduct(${p.id})"
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
const p = products.find(x => x.id === id);
if(!p) return;
document.getElementById("attar-preview-img").src = p.image;
document.getElementById("attar-preview-name").textContent = p.name;
document.getElementById("attar-preview-family").textContent = p.family || "";
document.getElementById("attar-preview-gender").textContent = p.gender || "";
document.getElementById("attar-preview-season").textContent = p.season || "";
document.getElementById("attar-preview-time").textContent = p.time || "";
document.getElementById("attar-preview-price").textContent = "₹" + p.price;
const box = document.getElementById("attar-preview");
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
el.innerHTML = "";
el.innerHTML += `
<div onclick="goToCategory('Perfume')"
class="px-4 py-2 bg-yellow-500 text-black font-bold cursor-pointer text-center">
All Perfumes
</div>
`;
for(const facet in perfumeFacets){
el.innerHTML += `
<div class="px-4 py-2 text-yellow-500 font-bold cursor-pointer"
onclick="this.nextElementSibling.classList.toggle('hidden')">
${facet}
</div>
<div class="hidden">
${Object.keys(perfumeFacets[facet]).map(key => `
<div class="px-6 py-2 text-gray-300 font-semibold cursor-pointer"
onclick="this.nextElementSibling.classList.toggle('hidden')">
${key}
</div>
<div class="hidden">
${perfumeFacets[facet][key].map(p => `
<div
class="px-8 py-2 hover:bg-yellow-500 hover:text-black cursor-pointer"
onmouseenter="showAttarPreview(event, ${p.id})"
onmousemove="moveAttarPreview(event)"
onmouseleave="hideAttarPreview()"
onclick="event.stopPropagation(); openProduct(${p.id})">
${p.name} — ₹${p.price}
</div>
`).join("")}
</div>
`).join("")}
</div>
`;
}
}
buildMenu("attarMenu");
buildMenu("attarMenuMobile");
buildPerfumeMenu("perfumeMenu");
buildPerfumeMenu("perfumeMenuMobile");
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
function openMobileMenu(e) {
e?.stopPropagation();
showMenu(document.getElementById("mobile-menu"));
}
function isMenuOpen(el) {
return !!el && !el.classList.contains("hidden") && !el.classList.contains("menu-hidden");
}
function closeCollectionSubmenus(exceptId = '') {
["attarMenu", "perfumeMenu", "attarMenuMobile", "perfumeMenuMobile"].forEach(id => {
if (id !== exceptId) hideMenu(document.getElementById(id));
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
if (/gift/i.test(normalized)) {
const match = normalized.match(/[\d.]+/);
if (match) {
return `${match[0]} ml Gift`;
}
return normalized;
}
const match = normalized.match(/[\d.]+/);
if (match) {
return `${match[0]} ml`;
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
const wishlistPrice =
Number(wid.price) ||
product.price;
const safeProductId = String(
wid.productId ||
product.id ||
product._id ||
''
);
container.innerHTML += `
<div
class="product-card cursor-pointer border p-3 hover:shadow-lg"
onclick="openWishlistProduct(
'${escapeHtml(safeProductId)}',
'${escapeHtml(savedSize)}',
'${escapeHtml(wishlistName)}'
)"
>
<img
src="${escapeHtml(normalizedWishlistImage)}"
onerror="
this.onerror=null;
this.src='${escapeHtml(normalizedWishlistFallback)}';
"
class="w-full h-40 object-contain mb-3"
alt="${escapeHtml(wishlistName)}"
>
<h4 class="font-bold text-sm">
${escapeHtml(wishlistName)}
</h4>
<p class="text-xs text-gray-500 mt-1">
${escapeHtml(savedSize)}
</p>
<p class="text-yellow-600 font-semibold mt-1">
₹${Number(wishlistPrice).toLocaleString('en-IN')}
</p>
</div>
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
await loadBundleRules();
await loadBackendProducts();
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
