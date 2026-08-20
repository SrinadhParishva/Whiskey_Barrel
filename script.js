// Shopify Storefront API Configurations
const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STORE_PERMANENT_DOMAIN = "whiskey-barrel-brand-site-ctpoy-9auzbm15.myshopify.com";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = "48e9398fd769b012597a64af42d8f17d";

// Shopify GraphQL Queries & Mutations
const PRODUCT_FIELDS = `
  id
  title
  description
  handle
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 5) { edges { node { url altText } } }
  variants(first: 10) {
    edges {
      node {
        id
        title
        price { amount currencyCode }
        availableForSale
        selectedOptions { name value }
      }
    }
  }
  options { name values }
`;

const STOREFRONT_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges { node { ${PRODUCT_FIELDS} } }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) {
    productByHandle(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

const CART_QUERY = `
  query cart($id: ID!) {
    cart(id: $id) { id totalQuantity }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id }
      userErrors { field message }
    }
  }
`;

// Helper: Custom Toast System
const toast = {
  success(message, submessage = "") {
    this.show(message, submessage, "border-ember text-ember shadow-ember/30");
  },
  error(message, submessage = "") {
    this.show(message, submessage, "border-destructive text-destructive shadow-destructive/20");
  },
  show(message, submessage, classes) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = "fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none";
      document.body.appendChild(container);
    }
    const notification = document.createElement('div');
    notification.className = `bg-card border px-6 py-3 rounded-sm shadow-xl text-xs uppercase tracking-widest font-medium pointer-events-auto transition-all duration-300 opacity-0 translate-y-[-10px] ${classes}`;
    
    let html = `<div>${message}</div>`;
    if (submessage) {
      html += `<div class="text-[10px] text-muted-foreground mt-1 normal-case tracking-normal">${submessage}</div>`;
    }
    notification.innerHTML = html;
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('opacity-0', 'translate-y-[-10px]');
    }, 10);
    
    // Animate out & remove
    setTimeout(() => {
      notification.classList.add('opacity-0', 'translate-y-[-10px]');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
};

// Formatting money helper
function formatMoney(amount, currencyCode) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}

// Shopify API request
async function storefrontApiRequest(query, variables = {}) {
  try {
    const response = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (response.status === 402) {
      toast.error("Shopify: Payment required", "Shopify API access requires an active Shopify billing plan.");
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`Error calling Shopify: ${data.errors.map((e) => e.message).join(", ")}`);
    }
    return data;
  } catch (error) {
    console.error("Shopify Request Failed:", error);
    throw error;
  }
}

// Whiskey Category Uploaded Products
const WHISKEY_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-macallan-25",
      title: "The Macallan 25 Fine Oak",
      handle: "macallan-25-fine-oak",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Malted Barley, Sherry & Bourbon Casks",
      type: "🥃 Single Malt Scotch Whisky",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "RP", score: "98" }],
      description: "Single Malt aged for 25 years in three exceptional oak cask types. Rich notes of citrus, cinnamon, and toasted wood.",
      priceRange: { minVariantPrice: { amount: "1850.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/premium_single_malt_whiskey_bottle_with_a_clean_circular_design_and_a_brushed.png", altText: "The Macallan 25 Fine Oak Single Malt" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/m25", title: "700ml Decanter", price: { amount: "1850.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-copper-cask-12",
      title: "The Copper Cask 12 Year",
      handle: "copper-cask-12-year",
      category: "WHISKEY",
      country: "🇺🇸 United States (Kentucky)",
      composition: "🌽 Yellow Corn, Rye, Charred Oak",
      type: "🥃 Kentucky Straight Bourbon",
      badges: [{ label: "WE", score: "94" }, { label: "AGED", score: "12 YRS" }],
      description: "Small Batch Kentucky Straight Bourbon Whiskey aged 12 years. Deep caramel, vanilla, and charred oak profile.",
      priceRange: { minVariantPrice: { amount: "85.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/classic_square_shaped_premium_whiskey_bottle_with_a_vintage_inspired_embossed.png", altText: "The Copper Cask 12 Year Bourbon" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cc12", title: "700ml Bottle", price: { amount: "85.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-serpentine-cask",
      title: "The Serpentine Cask",
      handle: "the-serpentine-cask",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland (Highland)",
      composition: "🌾 Malted Barley, Peat Smoke, Ancient Oak Cask",
      type: "🥃 Rare Highland Single Malt",
      badges: [{ label: "LIMITED", score: "1/578" }, { label: "RP", score: "99" }],
      description: "Rare Highland Single Malt Scotch Whisky, aged 70 years. Limited edition 1 of 578 with elegant smoke and dried fruit.",
      priceRange: { minVariantPrice: { amount: "320.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/minimalist_premium_whiskey_bottle_with_a_sleek_tall_silhouette_and_a_textured.png", altText: "The Serpentine Cask Single Malt" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/sc70", title: "750ml Bottle", price: { amount: "320.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-macallan-30",
      title: "The Macallan 30 Fine & Rare",
      handle: "macallan-30-fine-rare",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Hand-Picked Malted Barley, First-Fill Sherry Cask",
      type: "🥃 Single Malt Decanter",
      badges: [{ label: "VIVINO", score: "5.0" }, { label: "WE", score: "99" }],
      description: "30 Years Old Single Malt Scotch Whisky in a luxury crystal decanter. Intense dark chocolate and wood spice.",
      priceRange: { minVariantPrice: { amount: "3500.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/bold_heavy_set_whiskey_bottle_with_a_wide_base_and_a_black_wax_sealed_top..png", altText: "The Macallan 30 Fine & Rare Decanter" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/m30", title: "700ml Crystal Decanter", price: { amount: "3500.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-baxter-reserve-15",
      title: "The Baxter Reserve 15 Year",
      handle: "baxter-reserve-15-year",
      category: "WHISKEY",
      country: "🇺🇸 United States",
      composition: "🌽 Heritage Grain Corn & Toasted Barley",
      type: "🥃 Small Batch Bourbon",
      badges: [{ label: "RP", score: "93" }, { label: "AGED", score: "15 YRS" }],
      description: "Heritage Small Batch Bourbon Whiskey Aged 15 Years. Distilled in Kentucky with smooth honeycomb and baking spice.",
      priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/minimalist_premium_whiskey_bottle_with_a_sleek_tall_silhouette_and_a_textured.png", altText: "The Baxter Reserve 15 Year Bourbon" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/br15", title: "700ml Bottle", price: { amount: "120.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

// Rum Category Uploaded Products
const RUM_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-scotchman-18",
      title: "The Scotchman Reserve 18 Year Rum",
      handle: "the-scotchman-18-year-rum",
      category: "RUM",
      country: "🇯🇲 Jamaica & Barbados",
      composition: "🍯 Sugar Cane Molasses, Oak Cask Aged",
      type: "🍹 Dark Reserve Rum",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "18 YRS" }],
      description: "Handcrafted Small Batch Reserve Rum aged 18 years in oak casks. Deep caramel, dark molasses, and oak spice.",
      priceRange: { minVariantPrice: { amount: "145.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/the-scotchman-18.jpg", altText: "The Scotchman Reserve 18 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/s18", title: "700ml Bottle", price: { amount: "145.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-elite-monogram-25",
      title: "Elite Monogram Reserve 25 Year Rum",
      handle: "elite-monogram-25-year-rum",
      category: "RUM",
      country: "🇨🇺 Cuba",
      composition: "🍯 Virgin Sugar Cane Honey, Charred French Oak",
      type: "🍹 Prestige Dark Rum",
      badges: [{ label: "RP", score: "97" }, { label: "AGED", score: "25 YRS" }],
      description: "Small Batch Dark Reserve Rum, aged 25 years. Notes of roasted cocoa, dried fruit, vanilla bean, and toasted oak.",
      priceRange: { minVariantPrice: { amount: "380.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/elite-monogram-25.jpg", altText: "Elite Monogram Reserve 25 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/em25", title: "750ml Bottle", price: { amount: "380.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-forge-distillery-8",
      title: "Forge Distillery Hand-Blown 8 Year Rum",
      handle: "forge-distillery-8-year-rum",
      category: "RUM",
      country: "🇹🇹 Trinidad & Tobago",
      composition: "🍯 Amber Cane Molasses, Bourbon Barrel Cask",
      type: "🍹 Hand-Blown Glass Reserve",
      badges: [{ label: "WE", score: "91" }, { label: "AGED", score: "8 YRS" }],
      description: "Small Batch Batch No. 4 Aged 8 Years Rum in hand-blown artisan glass. Vibrant amber tone with golden honey and citrus peel.",
      priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/forge-distillery-8.jpg", altText: "Forge Distillery Hand-Blown 8 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/fd8", title: "700ml Bottle", price: { amount: "75.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-terra-vita-18",
      title: "Terra Vita Explorer's Reserve 18 Year Rum",
      handle: "terra-vita-18-year-rum",
      category: "RUM",
      country: "🇬🇺 Guyana",
      composition: "🍯 Demerara Cane Molasses, Topographical Relief Cask",
      type: "🍹 Explorer's Edition Rum",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "RP", score: "95" }],
      description: "Topographical Edition Aged 18 Years Rum. Intricately carved relief bottle boasting dark brown sugar, clove, and toasted coconut.",
      priceRange: { minVariantPrice: { amount: "190.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/terra-vita-18.jpg", altText: "Terra Vita Explorer's Reserve 18 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tv18", title: "700ml Bottle", price: { amount: "190.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-highland-distillery-18",
      title: "Highland Estate 18 Year Small Batch Rum",
      handle: "highland-estate-18-year-rum",
      category: "RUM",
      country: "🇧🇧 Barbados",
      composition: "🍯 Copper Pot Stilled Molasses & Oak Spice",
      type: "🍹 Small Batch Decanter Rum",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "18 YRS" }],
      description: "Handcrafted 18 Year Aged Rum in a classic round decanter. Smooth finish with butterscotch, nutmeg, and warm charred wood.",
      priceRange: { minVariantPrice: { amount: "110.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/highland-distillery-18.jpg", altText: "Highland Estate 18 Year Small Batch Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/he18", title: "700ml Decanter", price: { amount: "110.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

// Beer Category Uploaded Products
const BEER_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-abbaye-saint-feuillien",
      title: "Abbaye Saint-Feuillien Grand Cru",
      handle: "abbaye-saint-feuillien-grand-cru",
      category: "BEER",
      country: "🇧🇪 Belgium",
      composition: "🌾 Pilsner Malts, Champagne Yeast, Saaz Hops",
      type: "🍺 Belgian Abbey Ale Grand Cru",
      badges: [{ label: "VIVINO", score: "4.6" }, { label: "RATEBEER", score: "98" }],
      description: "Extraordinary Belgian Abbey Ale Grand Cru. Fermented with Champagne yeast for a creamy head, fruity aromas, and dry finish.",
      priceRange: { minVariantPrice: { amount: "28.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/abbaye-saint-feuillien.jpg", altText: "Abbaye Saint-Feuillien Grand Cru Belgian Ale" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/asf", title: "750ml Bottle", price: { amount: "28.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cosmic-haze-ipa",
      title: "Cosmic Haze Hazy IPA",
      handle: "cosmic-haze-hazy-ipa",
      category: "BEER",
      country: "🇺🇸 United States (Colorado)",
      composition: "🌾 Citra & Mosaic Hops, Flaked Oats & Wheat",
      type: "🍺 Hazy India Pale Ale (7.2% ABV)",
      badges: [{ label: "UNTAPPD", score: "4.5" }, { label: "FRESH", score: "2026" }],
      description: "7.2% ABV Hazy India Pale Ale brewed & canned in Denver, CO. Packed with Citra and Mosaic hops for tropical citrus punch.",
      priceRange: { minVariantPrice: { amount: "18.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cosmic-haze-ipa.jpg", altText: "Orbital Brewing Co. Cosmic Haze Hazy IPA" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/chipa", title: "4-Pack (16oz Cans)", price: { amount: "18.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-citrus-wheat-ale",
      title: "Sunburst Citrus Wheat Ale",
      handle: "sunburst-citrus-wheat-ale",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Unfiltered Wheat, Valencia Orange Peel & Coriander",
      type: "🍺 Craft Witbier Ale",
      badges: [{ label: "REFRESH", score: "4.7" }, { label: "CRAFT", score: "ALE" }],
      description: "Craft unfiltered wheat ale brewed with valencia orange peel and coriander. Refreshing, crisp, and golden sunburst pour.",
      priceRange: { minVariantPrice: { amount: "16.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/citrus-wheat-ale.jpg", altText: "Sunburst Citrus Wheat Ale Pint" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/scwa", title: "6-Pack (12oz Bottles)", price: { amount: "16.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

// Wine Category Uploaded Products
const WINE_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-pinot-noir-etoiles",
      title: "Domaines des Étoiles Pinot Noir 2021",
      handle: "domaines-des-etoiles-pinot-noir",
      category: "WINE",
      country: "🇺🇸 United States (Willamette Valley)",
      composition: "🍇 Pinot Noir",
      type: "🍷 Red Wine",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "RP", score: "95" }],
      description: "2021 Willamette Valley Reserve Pinot Noir. Elegant notes of dark cherry, forest floor, subtle French oak, and silky tannins.",
      priceRange: { minVariantPrice: { amount: "135.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/pinot-noir-etoiles.jpg", altText: "Domaines des Étoiles Pinot Noir 2021" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/pne", title: "750ml Bottle", price: { amount: "135.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-chateau-margaux",
      title: "Château Margaux Cabernet Sauvignon 2016",
      handle: "chateau-margaux-cabernet-sauvignon",
      category: "WINE",
      country: "🇫🇷 France (Bordeaux)",
      composition: "🍇 Cabernet Sauvignon, Merlot, Petit Verdot",
      type: "🍷 Red Wine (Grand Vin)",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "RP", score: "99" }],
      description: "2016 Grand Vin de Bordeaux. World-renowned vintage with cassis, cedarwood, crushed violets, and refined structure.",
      priceRange: { minVariantPrice: { amount: "890.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/chateau-margaux.jpg", altText: "Château Margaux Cabernet Sauvignon" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cmcs", title: "750ml Bottle", price: { amount: "890.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-veuve-clicquot-champagne",
      title: "Veuve Clicquot La Grande Dame",
      handle: "veuve-clicquot-la-grande-dame",
      category: "WINE",
      country: "🇫🇷 France (Champagne)",
      composition: "🍇 Pinot Noir, Chardonnay",
      type: "🍾 Sparkling Champagne",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "WE", score: "97" }],
      description: "Prestige Cuvée Brut Champagne. Effervescent notes of candied citrus, almond, brioche, and golden apple.",
      priceRange: { minVariantPrice: { amount: "240.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/veuve-clicquot-champagne.jpg", altText: "Veuve Clicquot La Grande Dame Champagne" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vclgd", title: "750ml Bottle", price: { amount: "240.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-miraval-rose",
      title: "Château Miraval Côtes de Provence Rosé",
      handle: "chateau-miraval-rose",
      category: "WINE",
      country: "🇫🇷 France (Provence)",
      composition: "🍇 Cinsault, Grenache, Syrah, Rolle",
      type: "🍷 Rosé Wine",
      badges: [{ label: "VIVINO", score: "4.5" }, { label: "WE", score: "92" }],
      description: "Chilled Provence Rosé with delicate aromas of fresh red berries, wild strawberries, white peach, and crisp saline finish.",
      priceRange: { minVariantPrice: { amount: "38.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/miraval-rose.jpg", altText: "Château Miraval Côtes de Provence Rosé" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cmr", title: "750ml Bottle", price: { amount: "38.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-domaine-chardonnay",
      title: "Domaine de la Mer Chardonnay Reserve",
      handle: "domaine-de-la-mer-chardonnay",
      category: "WINE",
      country: "🇫🇷 France (Mediterranean)",
      composition: "🍇 Chardonnay",
      type: "🍷 White Wine",
      badges: [{ label: "VIVINO", score: "4.6" }, { label: "WE", score: "93" }],
      description: "2023 Mediterranean Coast Reserve. Crisp green apple, white peach, toasted brioche, and vibrant coastal minerality.",
      priceRange: { minVariantPrice: { amount: "42.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/domaine-chardonnay.jpg", altText: "Domaine de la Mer Chardonnay Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/dmc", title: "750ml Bottle", price: { amount: "42.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

// Vodka Category Uploaded Products
const VODKA_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-1",
      title: "Artisanal Hand-Blown Reserve Vodka",
      handle: "artisanal-hand-blown-reserve-vodka",
      category: "VODKA",
      country: "🇵🇱 Poland",
      composition: "🌾 Organic Rye & Distilled Spring Water",
      type: "🍸 Ultra-Premium Vodka",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "PURITY", score: "100%" }],
      description: "Triple-distilled ultra-premium vodka presented in a unique hand-blown glass decanter with pristine clarity and smooth silk finish.",
      priceRange: { minVariantPrice: { amount: "88.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-decant-studio.jpg", altText: "Artisanal Hand-Blown Reserve Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/v1", title: "750ml Bottle", price: { amount: "88.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-2",
      title: "Contemporary Craft Distilled Vodka",
      handle: "contemporary-craft-distilled-vodka",
      category: "VODKA",
      country: "🇸🇪 Sweden",
      composition: "🌾 Organic Winter Wheat",
      type: "🍸 Small-Batch Craft Vodka",
      badges: [{ label: "WE", score: "93" }, { label: "CRAFT", score: "ORGANIC" }],
      description: "Artisanal small-batch craft vodka distilled from organic winter wheat. Crisp minerality with subtle vanilla undertones.",
      priceRange: { minVariantPrice: { amount: "65.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-decant-studio.jpg", altText: "Contemporary Craft Distilled Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/v2", title: "700ml Bottle", price: { amount: "65.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-3",
      title: "Diamond Cut Crystal Vodka",
      handle: "diamond-cut-crystal-vodka",
      category: "VODKA",
      country: "🇫🇮 Finland",
      composition: "🌾 Glacial Spring Water & Birch Charcoal Filtered Grain",
      type: "🍸 Crystal Decanter Vodka",
      badges: [{ label: "RP", score: "96" }, { label: "CRYSTAL", score: "CUT" }],
      description: "Prestige edition vodka housed in an intricate diamond-cut crystal bottle. Filtered through birch charcoal for ultimate purity.",
      priceRange: { minVariantPrice: { amount: "160.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-crystal-studio.jpg", altText: "Diamond Cut Crystal Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/v3", title: "750ml Crystal Decanter", price: { amount: "160.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-4",
      title: "Nordic Glacier Ultra-Premium Vodka",
      handle: "nordic-glacier-ultra-premium-vodka",
      category: "VODKA",
      country: "🇳🇴 Norway",
      composition: "🌾 Pure Glacial Water & Golden Barley",
      type: "🍸 Nordic Glacier Spirit",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "GLACIER", score: "PURE" }],
      description: "Minimalist tall-silhouette vodka crafted with pure glacial water. Exceptionally light, clean, and velvety texture.",
      priceRange: { minVariantPrice: { amount: "115.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-decant-studio.jpg", altText: "Nordic Glacier Ultra-Premium Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/v4", title: "750ml Bottle", price: { amount: "115.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

// Gin Category Uploaded Products
const GIN_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-nocturne-gin",
      title: "Nocturne Handcrafted Botanical Gin",
      handle: "nocturne-handcrafted-botanical-gin",
      category: "GIN",
      country: "🇬🇧 United Kingdom",
      composition: "🫐 Mountain Juniper, Wild Lavender, Citrus Peel, Cardamom",
      type: "🍸 Craft Botanical Gin",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "WE", score: "96" }],
      description: "Distilled with rare mountain juniper, citrus peel, wild lavender, and cardamon in an amber glass decanter.",
      priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Nocturne Handcrafted Botanical Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin1", title: "700ml Decanter", price: { amount: "95.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

// Cigar Category Uploaded Products
const CIGAR_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-aurum-cigar-box",
      title: "Aurum Artisanal Reserve Cigars",
      handle: "aurum-artisanal-reserve-cigars",
      category: "CIGAR",
      country: "🇳🇮 Nicaragua (Estelí)",
      composition: "🍃 Hand-Rolled Long-Filler Tobacco Leaf, Habano Wrapper",
      type: "🚬 Premium Artisanal Cigar",
      badges: [{ label: "CIGAR AFICIONADO", score: "95" }, { label: "HANDMADE", score: "BOX OF 10" }],
      description: "Hand-rolled Nicaraguan long-filler tobacco presented in an engraved solid mahogany humidor box.",
      priceRange: { minVariantPrice: { amount: "210.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Aurum Artisanal Reserve Cigars" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar1", title: "Box of 10", price: { amount: "210.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

async function fetchProducts(first = 24) {
  let shopifyProducts = [];
  try {
    const data = await storefrontApiRequest(STOREFRONT_QUERY, { first });
    if (data?.data?.products?.edges) {
      shopifyProducts = data.data.products.edges;
    }
  } catch (error) {
    console.warn("Shopify fetch failed, using local products catalog:", error);
  }
  return [...WHISKEY_PRODUCTS, ...RUM_PRODUCTS, ...BEER_PRODUCTS, ...WINE_PRODUCTS, ...VODKA_PRODUCTS, ...GIN_PRODUCTS, ...CIGAR_PRODUCTS, ...shopifyProducts];
}

async function fetchProductByHandle(handle) {
  const localMatch = [...WHISKEY_PRODUCTS, ...RUM_PRODUCTS, ...BEER_PRODUCTS, ...WINE_PRODUCTS, ...VODKA_PRODUCTS, ...GIN_PRODUCTS, ...CIGAR_PRODUCTS].find((p) => p.node.handle === handle);
  if (localMatch) {
    return localMatch;
  }
  try {
    const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
    const node = data?.data?.productByHandle;
    return node ? { node } : null;
  } catch {
    return null;
  }
}

// Shopping Cart Core
const Cart = {
  items: [],
  cartId: null,
  checkoutUrl: null,
  isLoading: false,
  isSyncing: false,

  init() {
    this.load();
    this.setupEventListeners();
    this.syncCart();
    this.render();
  },

  load() {
    try {
      const stored = localStorage.getItem("shopify-cart-vanilla");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.items = parsed.items || [];
        this.cartId = parsed.cartId || null;
        this.checkoutUrl = parsed.checkoutUrl || null;
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
    }
  },

  save() {
    try {
      localStorage.setItem("shopify-cart-vanilla", JSON.stringify({
        items: this.items,
        cartId: this.cartId,
        checkoutUrl: this.checkoutUrl
      }));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  },

  setLoading(val) {
    this.isLoading = val;
    this.updateCheckoutButtonState();
  },

  formatCheckoutUrl(checkoutUrl) {
    try {
      const url = new URL(checkoutUrl);
      url.searchParams.set("channel", "online_store");
      return url.toString();
    } catch {
      return checkoutUrl;
    }
  },

  isCartNotFoundError(userErrors) {
    return (userErrors || []).some(
      (e) =>
        e.message.toLowerCase().includes("cart not found") ||
        e.message.toLowerCase().includes("does not exist")
    );
  },

  async addItem(item) {
    const existingItem = this.items.find((i) => i.variantId === item.variantId);
    this.setLoading(true);
    
    try {
      if (!this.cartId) {
        // Create a new cart
        const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
          input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] },
        });

        if (data?.data?.cartCreate?.userErrors?.length > 0) {
          console.error("Cart creation failed:", data.data.cartCreate.userErrors);
          toast.error("Add item failed", data.data.cartCreate.userErrors[0].message);
          return;
        }

        const cart = data?.data?.cartCreate?.cart;
        if (cart?.checkoutUrl) {
          this.cartId = cart.id;
          this.checkoutUrl = this.formatCheckoutUrl(cart.checkoutUrl);
          const lineId = cart.lines.edges[0]?.node?.id;
          this.items = [{ ...item, lineId }];
          this.save();
          toast.success(`${item.product.node.title} added to cart`);
        }
      } else if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + item.quantity;
        if (!existingItem.lineId) {
          console.error("Cannot update quantity for item without lineId:", existingItem);
          return;
        }
        
        const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
          cartId: this.cartId,
          lines: [{ id: existingItem.lineId, quantity: newQuantity }],
        });

        const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];
        if (this.isCartNotFoundError(userErrors)) {
          this.clearCart();
          await this.addItem(item); // retry
          return;
        }

        if (userErrors.length > 0) {
          console.error("Update line failed:", userErrors);
          toast.error("Add item failed", userErrors[0].message);
          return;
        }

        existingItem.quantity = newQuantity;
        this.save();
        toast.success(`${item.product.node.title} added to cart`);
      } else {
        // Add new line
        const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
          cartId: this.cartId,
          lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
        });

        const userErrors = data?.data?.cartLinesAdd?.userErrors || [];
        if (this.isCartNotFoundError(userErrors)) {
          this.clearCart();
          await this.addItem(item); // retry
          return;
        }

        if (userErrors.length > 0) {
          console.error("Add line failed:", userErrors);
          toast.error("Add item failed", userErrors[0].message);
          return;
        }

        const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
        const newLine = lines.find((l) => l.node.merchandise.id === item.variantId);
        this.items.push({ ...item, lineId: newLine?.node?.id ?? null });
        this.save();
        toast.success(`${item.product.node.title} added to cart`);
      }
      this.render();
      this.openDrawer();
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error("Add item failed");
    } finally {
      this.setLoading(false);
    }
  },

  async updateQuantity(variantId, quantity) {
    if (quantity <= 0) {
      await this.removeItem(variantId);
      return;
    }

    const item = this.items.find((i) => i.variantId === variantId);
    if (!item?.lineId || !this.cartId) return;

    this.setLoading(true);
    try {
      const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
        cartId: this.cartId,
        lines: [{ id: item.lineId, quantity }],
      });

      const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];
      if (this.isCartNotFoundError(userErrors)) {
        this.clearCart();
        this.render();
        return;
      }

      if (userErrors.length > 0) {
        console.error("Update line failed:", userErrors);
        toast.error("Update quantity failed");
        return;
      }

      item.quantity = quantity;
      this.save();
      this.render();
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      this.setLoading(false);
    }
  },

  async removeItem(variantId) {
    const item = this.items.find((i) => i.variantId === variantId);
    if (!item?.lineId || !this.cartId) return;

    this.setLoading(true);
    try {
      const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
        cartId: this.cartId,
        lineIds: [item.lineId],
      });

      const userErrors = data?.data?.cartLinesRemove?.userErrors || [];
      if (this.isCartNotFoundError(userErrors)) {
        this.clearCart();
        this.render();
        return;
      }

      if (userErrors.length > 0) {
        console.error("Remove line failed:", userErrors);
        toast.error("Remove item failed");
        return;
      }

      this.items = this.items.filter((i) => i.variantId !== variantId);
      if (this.items.length === 0) {
        this.clearCart();
      } else {
        this.save();
      }
      this.render();
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      this.setLoading(false);
    }
  },

  clearCart() {
    this.items = [];
    this.cartId = null;
    this.checkoutUrl = null;
    this.save();
  },

  async syncCart() {
    if (!this.cartId || this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      const data = await storefrontApiRequest(CART_QUERY, { id: this.cartId });
      if (data) {
        const cart = data?.data?.cart;
        if (!cart || cart.totalQuantity === 0) {
          this.clearCart();
          this.render();
        }
      }
    } catch (error) {
      console.error("Failed to sync cart with Shopify:", error);
    } finally {
      this.isSyncing = false;
    }
  },

  getCheckoutUrl() {
    return this.checkoutUrl;
  },

  render() {
    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = this.items.reduce(
      (sum, item) => sum + parseFloat(item.price.amount) * item.quantity,
      0
    );
    const currency = this.items[0]?.price.currencyCode ?? "USD";

    // Update badges
    const badge = document.getElementById("cart-badge");
    if (badge) {
      if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }

    // Update drawer description
    const desc = document.getElementById("cart-description");
    if (desc) {
      desc.textContent = totalItems === 0
        ? "Your cart is empty"
        : `${totalItems} bottle${totalItems !== 1 ? "s" : ""} reserved`;
    }

    // Update empty state vs list
    const emptyState = document.getElementById("cart-empty-state");
    const itemsContainer = document.getElementById("cart-items-container");
    const footer = document.getElementById("cart-footer");

    if (this.items.length === 0) {
      emptyState?.classList.remove("hidden");
      emptyState?.classList.add("flex");
      itemsContainer?.classList.add("hidden");
      footer?.classList.add("hidden");
    } else {
      emptyState?.classList.add("hidden");
      emptyState?.classList.remove("flex");
      itemsContainer?.classList.remove("hidden");
      footer?.classList.remove("hidden");

      // Update total price
      const totalPriceEl = document.getElementById("cart-total-price");
      if (totalPriceEl) {
        totalPriceEl.textContent = formatMoney(totalPrice, currency);
      }

      // Render items
      if (itemsContainer) {
        itemsContainer.innerHTML = this.items.map((item) => {
          const imgUrl = item.product.node.images?.edges?.[0]?.node?.url || "";
          const optionsStr = item.selectedOptions.map((o) => o.value).join(" • ");
          const itemPriceFormatted = formatMoney(parseFloat(item.price.amount), item.price.currencyCode);

          return `
            <div class="flex gap-4 rounded-sm border border-border p-3 transition-colors duration-500 hover:border-ember/50">
              <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-secondary">
                ${imgUrl ? `<img src="${imgUrl}" alt="${item.product.node.title}" class="h-full w-full object-cover">` : ""}
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="truncate font-medium text-sm text-foreground">${item.product.node.title}</h4>
                <p class="text-[10px] text-muted-foreground mt-0.5">${optionsStr}</p>
                <p class="mt-1 font-semibold text-ember text-sm">${itemPriceFormatted}</p>
              </div>
              <div class="flex flex-shrink-0 flex-col items-end gap-2">
                <button type="button" aria-label="Remove item" onclick="Cart.removeItem('${item.variantId}')" class="text-muted-foreground transition-colors duration-300 hover:text-destructive p-1">
                  <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                </button>
                <div class="flex items-center gap-1">
                  <button type="button" aria-label="Decrease quantity" onclick="Cart.updateQuantity('${item.variantId}', ${item.quantity - 1})" class="rounded-sm border border-border p-1 transition-colors duration-300 hover:border-ember hover:text-ember">
                    <i data-lucide="minus" class="h-2.5 w-2.5"></i>
                  </button>
                  <span class="w-7 text-center text-xs">${item.quantity}</span>
                  <button type="button" aria-label="Increase quantity" onclick="Cart.updateQuantity('${item.variantId}', ${item.quantity + 1})" class="rounded-sm border border-border p-1 transition-colors duration-300 hover:border-ember hover:text-ember">
                    <i data-lucide="plus" class="h-2.5 w-2.5"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("");

        // Re-trigger lucide icons rendering inside cart drawer items
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    }
  },

  updateCheckoutButtonState() {
    const btn = document.getElementById("cart-checkout-btn");
    if (btn) {
      if (this.isLoading || this.isSyncing) {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>`;
      } else {
        btn.disabled = this.items.length === 0;
        btn.innerHTML = `<i data-lucide="external-link" class="h-4 w-4"></i> Checkout with Shopify`;
      }
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  },

  openDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-drawer-overlay");
    if (drawer && overlay) {
      drawer.classList.remove("translate-x-full");
      drawer.classList.add("translate-x-0");
      overlay.classList.remove("opacity-0", "pointer-events-none");
      overlay.classList.add("opacity-100", "pointer-events-auto");
    }
    this.syncCart();
  },

  closeDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-drawer-overlay");
    if (drawer && overlay) {
      drawer.classList.remove("translate-x-0");
      drawer.classList.add("translate-x-full");
      overlay.classList.remove("opacity-100", "pointer-events-auto");
      overlay.classList.add("opacity-0", "pointer-events-none");
    }
  },

  setupEventListeners() {
    // Cart open
    const trigger = document.getElementById("cart-trigger-btn");
    if (trigger) {
      trigger.addEventListener("click", () => this.openDrawer());
    }

    // Cart close
    const closeBtn = document.getElementById("cart-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeDrawer());
    }

    // Overlay click close
    const overlay = document.getElementById("cart-drawer-overlay");
    if (overlay) {
      overlay.addEventListener("click", () => this.closeDrawer());
    }

    // Escape key close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeDrawer();
      }
    });

    // Checkout redirect
    const checkoutBtn = document.getElementById("cart-checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        const url = this.getCheckoutUrl();
        if (url) {
          window.open(url, "_blank");
          this.closeDrawer();
        }
      });
    }

    // Sync on page focus/visible
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.syncCart();
      }
    });
  }
};

// Reveal Animations using IntersectionObserver
function initRevealAnimations() {
  const revealElements = document.querySelectorAll('[data-reveal]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.getAttribute('data-delay') || 0;
        
        el.style.transitionDelay = `${delay}ms`;
        // Apply end state classes
        el.classList.add('opacity-100', 'translate-x-0', 'translate-y-0', 'scale-100');
        // Remove start state classes
        el.classList.remove('opacity-0', 'translate-y-10', '-translate-x-12', 'translate-x-12', 'scale-95');
        
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach((el) => {
    const type = el.getAttribute('data-reveal') || 'up';
    
    // Set base setup
    el.classList.add('transition-all', 'duration-[900ms]', 'ease-[cubic-bezier(0.16,1,0.3,1)]', 'will-change-transform', 'opacity-0');
    
    // Set starting transforms
    if (type === 'up') el.classList.add('translate-y-10');
    else if (type === 'left') el.classList.add('-translate-x-12');
    else if (type === 'right') el.classList.add('translate-x-12');
    else if (type === 'scale') el.classList.add('scale-95');
    
    observer.observe(el);
  });
}

// Global Quantity Counter & Add To Cart Handlers
window.increaseQty = function(handle) {
  const input = document.getElementById(`qty-${handle}`);
  if (input) {
    let val = parseInt(input.value, 10) || 1;
    input.value = val + 1;
  }
};

window.decreaseQty = function(handle) {
  const input = document.getElementById(`qty-${handle}`);
  if (input) {
    let val = parseInt(input.value, 10) || 1;
    if (val > 1) {
      input.value = val - 1;
    }
  }
};

window.handleAddToCart = function(handle, variantId) {
  const input = document.getElementById(`qty-${handle}`);
  const quantity = input ? (parseInt(input.value, 10) || 1) : 1;
  
  const allProducts = [
    ...WHISKEY_PRODUCTS,
    ...RUM_PRODUCTS,
    ...BEER_PRODUCTS,
    ...VODKA_PRODUCTS,
    ...WINE_PRODUCTS,
    ...GIN_PRODUCTS,
    ...CIGAR_PRODUCTS
  ];
  const found = allProducts.find(p => p.node.handle === handle);
  
  if (found) {
    const p = found.node;
    const vId = variantId || p.variants.edges[0]?.node?.id;
    Cart.addItem({
      product: found,
      variantId: vId,
      selectedOptions: p.variants.edges[0]?.node?.selectedOptions || [],
      quantity: quantity
    });
    toast.success("Added to Cart", `${quantity}x ${p.title} added to cart.`);
  }
};

// Helper to get Flag SVG/Graphic based on country text
function getCountryFlagSVG(countryStr) {
  const str = (countryStr || "").toLowerCase();
  
  if (str.includes("scotland")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="60" height="40" fill="#0065BD"/>
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#FFFFFF" stroke-width="8"/>
    </svg>`;
  }
  if (str.includes("united states") || str.includes("usa") || str.includes("kentucky")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="60" height="40" fill="#B22234"/>
      <path d="M0 6h60M0 12h60M0 18h60M0 24h60M0 30h60M0 36h60" stroke="#FFFFFF" stroke-width="3"/>
      <rect width="24" height="21" fill="#3C3B6E"/>
    </svg>`;
  }
  if (str.includes("france")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="20" height="40" fill="#002395"/>
      <rect x="20" width="20" height="40" fill="#FFFFFF"/>
      <rect x="40" width="20" height="40" fill="#ED2939"/>
    </svg>`;
  }
  if (str.includes("south africa")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="60" height="20" fill="#E03C31"/>
      <rect y="20" width="60" height="20" fill="#001489"/>
      <path d="M0 0 L30 20 L0 40 Z" fill="#000000"/>
      <path d="M0 0 L30 20 L0 40" stroke="#FFB81C" stroke-width="4" fill="none"/>
      <path d="M0 5 L22.5 20 L0 35" stroke="#FFFFFF" stroke-width="3" fill="none"/>
      <path d="M0 20 H60 M22.5 20 H60" stroke="#007A3D" stroke-width="8"/>
      <path d="M22.5 20 H60" stroke="#FFFFFF" stroke-width="12" fill="none"/>
      <path d="M25 20 H60" stroke="#007A3D" stroke-width="8"/>
    </svg>`;
  }
  if (str.includes("cuba")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="60" height="40" fill="#002A8F"/>
      <path d="M0 8h60M0 24h60" stroke="#FFFFFF" stroke-width="8"/>
      <path d="M0 0 L28 20 L0 40 Z" fill="#CF142B"/>
      <polygon points="9,20 12,11 19,16 11,16 16,11" fill="#FFFFFF"/>
    </svg>`;
  }
  if (str.includes("jamaica")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="60" height="40" fill="#009B3A"/>
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#FED100" stroke-width="8"/>
      <polygon points="0,0 30,20 0,40" fill="#000000"/>
      <polygon points="60,0 30,20 60,40" fill="#000000"/>
    </svg>`;
  }
  if (str.includes("ireland")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="20" height="40" fill="#169B62"/>
      <rect x="20" width="20" height="40" fill="#FFFFFF"/>
      <rect x="40" width="20" height="40" fill="#FF883E"/>
    </svg>`;
  }
  if (str.includes("japan")) {
    return `<svg class="w-6 h-4 rounded-xs shadow-2xs overflow-hidden flex-shrink-0 inline-block align-middle" viewBox="0 0 60 40">
      <rect width="60" height="40" fill="#FFFFFF"/>
      <circle cx="30" cy="20" r="12" fill="#BC002D"/>
    </svg>`;
  }
  
  return `<svg class="w-5 h-5 text-slate-500 flex-shrink-0 inline-block align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`;
}

// Helper to get Grape/Grain SVG Icon matching reference image
function getGrainsGrapesSVG() {
  return `<svg class="w-5 h-5 flex-shrink-0 inline-block align-middle" viewBox="0 0 32 32">
    <path fill="#65a30d" d="M14 3c-3 0-6 2.5-7 5.5 3 0 6-1.5 7-5.5z"/>
    <path fill="#84cc16" d="M14 3c2 0 4.5 1.5 5.5 4-2.5 0-4.5-1.5-5.5-4z"/>
    <circle cx="16" cy="11" r="3.2" fill="#8b5cf6"/>
    <circle cx="11.5" cy="13.5" r="3.2" fill="#7c3aed"/>
    <circle cx="20.5" cy="13.5" r="3.2" fill="#7c3aed"/>
    <circle cx="13.8" cy="19" r="3.2" fill="#6d28d9"/>
    <circle cx="18.2" cy="19" r="3.2" fill="#6d28d9"/>
    <circle cx="16" cy="24.5" r="2.8" fill="#5b21b6"/>
  </svg>`;
}

// Helper to get Glass SVG Icon matching reference image
function getGlassIconSVG(typeStr) {
  const str = (typeStr || "").toLowerCase();
  const isWine = str.includes("wine") || str.includes("rose") || str.includes("champagne");
  const color = isWine ? "#be185d" : "#d97706";
  
  return `<svg class="w-5 h-5 flex-shrink-0 inline-block align-middle" viewBox="0 0 32 32">
    <path d="M10 5h12v7c0 3.3-2.7 6-6 6s-6-2.7-6-6V5z" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1.8"/>
    <path d="M10.8 11h10.4v2c0 2.2-1.8 4-4 4s-4-1.8-4-4v-2z" fill="${color}"/>
    <path d="M16 18v8M11 26h10" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

// Reusable Exact Reference Product Item Row Renderer (Dark Luxury Website Theme)
function createProductCardHTML(product) {
  const p = product.node;
  const priceStr = formatMoney(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode);
  const image = p.images.edges[0]?.node;

  // Clean raw strings from emoji characters for crisp layout
  const cleanCountry = (p.country || "").replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|🏴󠁧󠁢󠁳󠁣󠁴󠁿/gu, "").trim();
  const cleanComposition = (p.composition || "").replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
  const cleanType = (p.type || "").replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
  const description = p.description || "";

  return `
    <article class="product-item-row flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 py-8 px-6 sm:px-10 bg-[#161311] border-b border-white/10 text-[#f4f4f5] w-full">
      <!-- 1. Left Column: Big Standing Bottle Image (Taller than details) -->
      <div class="product-item-img-box flex-shrink-0 flex items-center justify-center">
        <a href="product.html?handle=${p.handle}" class="block h-full w-full flex items-center justify-center">
          ${image ? `
            <img
              src="${image.url}"
              alt="${image.altText ?? p.title}"
              loading="lazy"
              class="max-h-full max-w-full object-contain mx-auto"
            >
          ` : `
            <div class="flex h-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          `}
        </a>
      </div>

      <!-- 2. Right Column: Details Container (Next to image, height less than bottle image) -->
      <div class="product-item-info flex-1 min-w-0 text-left w-full flex flex-col justify-center">
        
        <!-- Header: Title, Badges & MRP -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <a href="product.html?handle=${p.handle}" class="block">
              <h3 class="font-display font-bold text-lg sm:text-xl text-foreground hover:text-ember transition-colors leading-snug tracking-tight">
                ${p.title}
              </h3>
            </a>

            <!-- Rating Badges -->
            ${p.badges ? `
              <div class="flex flex-wrap items-center gap-2 mt-2">
                ${p.badges.map(b => `
                  <div class="badge-pill-container inline-flex items-center">
                    <span class="badge-pill-label">${b.label}</span>
                    <span class="badge-pill-score">${b.score}</span>
                  </div>
                `).join("")}
              </div>
            ` : ''}
          </div>

          <!-- MRP Display -->
          <div class="flex-shrink-0 text-left sm:text-right">
            <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">MRP</span>
            <span class="font-display font-bold text-xl sm:text-2xl text-ember">
              ${priceStr}
            </span>
          </div>
        </div>

        <!-- Meta Details List (Country, Composition/Grains, Type) -->
        <div class="product-item-details-list py-2.5 text-xs text-slate-300 font-medium">
          ${cleanCountry ? `
            <div class="flex items-center gap-3">
              ${getCountryFlagSVG(p.country)}
              <span class="text-[#f4f4f5] font-semibold tracking-wide">${cleanCountry}</span>
            </div>
          ` : ''}

          ${cleanComposition ? `
            <div class="flex items-start gap-3 text-slate-300">
              <span class="mt-0.5 flex-shrink-0">${getGrainsGrapesSVG()}</span>
              <span class="text-slate-300 leading-normal">${cleanComposition}</span>
            </div>
          ` : ''}

          ${cleanType ? `
            <div class="flex items-center gap-3 text-ember font-semibold">
              ${getGlassIconSVG(p.type)}
              <span class="tracking-wide">${cleanType}</span>
            </div>
          ` : ''}
        </div>

        <!-- Tasting Notes Description & Quantity Counter -->
        <div class="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          ${description ? `
            <p class="product-item-description text-xs text-[#a1a1aa] leading-relaxed font-body flex-1 pr-2">
              ${description}
            </p>
          ` : ''}

          <div class="qty-counter-box inline-flex items-center flex-shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onclick="decreaseQty('${p.handle}')"
              class="qty-counter-btn"
              aria-label="Decrease quantity"
            >-</button>
            <input
              type="number"
              id="qty-${p.handle}"
              value="1"
              min="1"
              max="99"
              class="qty-counter-input"
              readonly
            >
            <button
              type="button"
              onclick="increaseQty('${p.handle}')"
              class="qty-counter-btn"
              aria-label="Increase quantity"
            >+</button>
          </div>
        </div>

      </div>
    </article>
  `;
}

// Page Specific Route Logics
async function handleIndexPage() {
  const productsLoading = document.getElementById("products-loading");
  const productsEmpty = document.getElementById("products-empty");
  const productsGrid = document.getElementById("products-grid");

  try {
    const products = await fetchProducts(24);
    
    if (productsLoading) productsLoading.classList.add("hidden");

    if (products.length === 0) {
      productsEmpty?.classList.remove("hidden");
      return;
    }

    const renderProductList = (productList) => {
      if (!productsGrid) return;
      if (productList.length === 0) {
        productsGrid.classList.add("hidden");
        if (productsEmpty) {
          productsEmpty.classList.remove("hidden");
          const emptyTitle = document.getElementById("products-empty-title");
          const emptyDesc = document.getElementById("products-empty-desc");
          if (activeCategory) {
            if (emptyTitle) emptyTitle.textContent = `No items found in ${activeCategory}`;
            if (emptyDesc) emptyDesc.textContent = `Check back soon for new additions to our ${activeCategory} collection.`;
          } else {
            if (emptyTitle) emptyTitle.textContent = `Select a Category`;
            if (emptyDesc) emptyDesc.textContent = `Click any category button above to view dedicated images and products.`;
          }
        }
        return;
      }
      productsEmpty?.classList.add("hidden");
      productsGrid.classList.remove("hidden");
      
      productsGrid.innerHTML = productList.map((product) => createProductCardHTML(product)).join("");
    };

    // Dynamic Breadcrumb Category Updater & Strict Category Routing
    const breadcrumbCategoryEl = document.getElementById("breadcrumb-current-category");

    const updateBreadcrumb = (categoryLabel) => {
      if (breadcrumbCategoryEl) {
        const formatted = categoryLabel ? (categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1).toLowerCase()) : "Expressions";
        breadcrumbCategoryEl.textContent = formatted;
      }
    };

    const selectCategory = (categoryKey, categoryLabel, updateUrl = false) => {
      // Toggle off if clicking active category tab
      if (updateUrl && activeCategory === categoryKey) {
        activeCategory = null;
        categoryTabs.forEach((t) => t.classList.remove("active-tab"));
        updateBreadcrumb("Expressions");
        history.pushState({}, "", window.location.pathname);
        renderProductList([]);
        return;
      }

      activeCategory = categoryKey;
      categoryTabs.forEach((t) => {
        if (categoryKey && t.getAttribute("data-category") === categoryKey) {
          t.classList.add("active-tab");
        } else {
          t.classList.remove("active-tab");
        }
      });

      if (!categoryKey) {
        updateBreadcrumb("Expressions");
        if (updateUrl) history.pushState({}, "", window.location.pathname);
        renderProductList([]);
      } else if (categoryKey === "WHISKEY") {
        updateBreadcrumb(categoryLabel || "Whiskey");
        if (updateUrl) history.pushState({ category: "WHISKEY" }, "", "#whiskey");
        renderProductList(WHISKEY_PRODUCTS);
      } else if (categoryKey === "RUM") {
        updateBreadcrumb(categoryLabel || "Rum");
        if (updateUrl) history.pushState({ category: "RUM" }, "", "#rum");
        renderProductList(RUM_PRODUCTS);
      } else if (categoryKey === "BEER") {
        updateBreadcrumb(categoryLabel || "Beer");
        if (updateUrl) history.pushState({ category: "BEER" }, "", "#beer");
        renderProductList(BEER_PRODUCTS);
      } else if (categoryKey === "WINE") {
        updateBreadcrumb(categoryLabel || "Wine");
        if (updateUrl) history.pushState({ category: "WINE" }, "", "#wine");
        renderProductList(WINE_PRODUCTS);
      } else if (categoryKey === "VODKA") {
        updateBreadcrumb(categoryLabel || "Vodka");
        if (updateUrl) history.pushState({ category: "VODKA" }, "", "#vodka");
        renderProductList(VODKA_PRODUCTS);
      } else if (categoryKey === "GIN") {
        updateBreadcrumb(categoryLabel || "Gin");
        if (updateUrl) history.pushState({ category: "GIN" }, "", "#gin");
        renderProductList(GIN_PRODUCTS);
      } else if (categoryKey === "CIGAR") {
        updateBreadcrumb(categoryLabel || "Cigar");
        if (updateUrl) history.pushState({ category: "CIGAR" }, "", "#cigar");
        renderProductList(CIGAR_PRODUCTS);
      }

      // Smooth scroll to expressions grid when user clicks a category tab
      if (updateUrl) {
        document.getElementById("expressions")?.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Bind Category Filter Tabs & Chamfer Cards to redirect to category.html
    const categoryTabs = document.querySelectorAll(".category-tab");
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cat = tab.getAttribute("data-category");
        window.location.href = `category.html?category=${cat}`;
      });
    });

    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cat = card.getAttribute("data-category-card");
        window.location.href = `category.html?category=${cat}`;
      });
    });
  } catch (error) {
    console.error("Failed to load products grid:", error);
    if (productsLoading) productsLoading.classList.add("hidden");
    productsEmpty?.classList.remove("hidden");
  }

  // Intercept reservation form submit
  const visitForm = document.getElementById("visit-form");
  if (visitForm) {
    visitForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = visitForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        toast.success("Reservation Request Sent", `We've saved ${emailInput.value} for the next cellar session.`);
        emailInput.value = "";
      }
    });
  }
}

// Dedicated Category Page Logic
async function handleCategoryPage() {
  const productsLoading = document.getElementById("products-loading");
  const productsEmpty = document.getElementById("products-empty");
  const productsGrid = document.getElementById("products-grid");
  const heroTitle = document.getElementById("category-hero-title");
  const heroSubtitle = document.getElementById("category-hero-subtitle");
  const breadcrumbCategoryEl = document.getElementById("breadcrumb-current-category");

  const CATEGORY_META = {
    WHISKEY: {
      title: "Whiskey Collection",
      subtitle: "Explore our hand-selected single malts and small-batch reserve bourbons aged in charred oak.",
      products: WHISKEY_PRODUCTS
    },
    RUM: {
      title: "Rum Collection",
      subtitle: "Discover our rare small-batch aged rums with rich caramel, molasses, and oak spice notes.",
      products: RUM_PRODUCTS
    },
    BEER: {
      title: "Craft Beer Collection",
      subtitle: "Taste our artisanal belgian abbey ales, hazy IPAs, and oak barrel aged reserve stouts.",
      products: BEER_PRODUCTS
    },
    VODKA: {
      title: "Ultra-Premium Vodka",
      subtitle: "Savour our triple-distilled, hand-blown decanter and crystal filtered reserve vodkas.",
      products: VODKA_PRODUCTS
    },
    WINE: {
      title: "Fine Wine Collection",
      subtitle: "Experience vintage Cabernet Sauvignon, Pinot Noir, prestige Champagne, and chilled Provence Rosé.",
      products: WINE_PRODUCTS
    },
    GIN: {
      title: "Botanical Gin Collection",
      subtitle: "Handcrafted small-batch gin distilled with rare mountain juniper, citrus peel, and wild lavender.",
      products: GIN_PRODUCTS
    },
    CIGAR: {
      title: "Artisanal Cigar Collection",
      subtitle: "Hand-rolled Nicaraguan long-filler cigars presented in engraved solid mahogany humidor boxes.",
      products: CIGAR_PRODUCTS
    }
  };

  const renderCategory = (catKey, updateUrl = false) => {
    const key = (catKey || "WHISKEY").toUpperCase();
    const meta = CATEGORY_META[key] || CATEGORY_META.WHISKEY;

    // Update active tab buttons & category cards
    const categoryTabs = document.querySelectorAll(".category-tab");
    categoryTabs.forEach((t) => {
      if (t.getAttribute("data-category") === key) {
        t.classList.add("active-tab");
      } else {
        t.classList.remove("active-tab");
      }
    });

    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach((c) => {
      if (c.getAttribute("data-category-card") === key) {
        c.classList.add("active-card");
      } else {
        c.classList.remove("active-card");
      }
    });

    // Update Title, Subtitle, Breadcrumbs, Page Title
    document.title = `${meta.title} — Whiskey Barrel`;
    if (heroTitle) heroTitle.textContent = meta.title;
    if (heroSubtitle) heroSubtitle.textContent = meta.subtitle;
    if (breadcrumbCategoryEl) {
      breadcrumbCategoryEl.textContent = key.charAt(0) + key.slice(1).toLowerCase();
    }

    if (updateUrl) {
      history.pushState({ category: key }, "", `category.html?category=${key}`);
    }

    if (productsLoading) productsLoading.classList.add("hidden");

    const productList = meta.products || [];
    if (productList.length === 0) {
      productsGrid?.classList.add("hidden");
      if (productsEmpty) {
        productsEmpty.classList.remove("hidden");
        const emptyTitle = document.getElementById("products-empty-title");
        const emptyDesc = document.getElementById("products-empty-desc");
        if (emptyTitle) emptyTitle.textContent = `No items found in ${key}`;
        if (emptyDesc) emptyDesc.textContent = `Check back soon for new additions.`;
      }
      return;
    }

    productsEmpty?.classList.add("hidden");
    productsGrid?.classList.remove("hidden");

    productsGrid.innerHTML = productList.map((product) => createProductCardHTML(product)).join("");
  };

  // Bind category button & card clicks on category.html
  const categoryTabs = document.querySelectorAll(".category-tab");
  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const cat = tab.getAttribute("data-category");
      renderCategory(cat, true);
    });
  });

  const categoryCards = document.querySelectorAll(".category-card");
  categoryCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const cat = card.getAttribute("data-category-card");
      renderCategory(cat, true);
    });
  });

  // Get initial category from query parameter or hash
  const getInitialCategory = () => {
    const params = new URLSearchParams(window.location.search);
    let cat = params.get("category");
    if (!cat) {
      cat = window.location.hash.replace("#", "");
    }
    return cat ? cat.toUpperCase() : "WHISKEY";
  };

  renderCategory(getInitialCategory(), false);

  window.addEventListener("popstate", () => {
    renderCategory(getInitialCategory(), false);
  });
}

async function handleProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const handle = urlParams.get("handle");

  const productLoading = document.getElementById("product-loading");
  const productNotFound = document.getElementById("product-not-found");
  const productDetails = document.getElementById("product-details");

  if (!handle) {
    if (productLoading) productLoading.classList.add("hidden");
    productNotFound?.classList.remove("hidden");
    return;
  }

  try {
    const product = await fetchProductByHandle(handle);
    if (productLoading) productLoading.classList.add("hidden");

    if (!product || !product.node) {
      productNotFound?.classList.remove("hidden");
      return;
    }

    const p = product.node;
    productDetails?.classList.remove("hidden");

    // Renders the details DOM elements
    document.title = `${p.title} — Whiskey Barrel`;
    
    // Set dynamic meta tags (title / description)
    document.querySelector('meta[name="description"]')?.setAttribute("content", `Buy ${p.title} from Whiskey Barrel, small-batch single malt aged in charred American oak.`);

    const imgContainer = document.getElementById("product-image-container");
    const image = p.images.edges[0]?.node;
    if (imgContainer) {
      if (image) {
        imgContainer.innerHTML = `
          <img
            src="${image.url}"
            alt="${image.altText ?? p.title}"
            class="h-[560px] w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
          >
        `;
      } else {
        imgContainer.innerHTML = `<div class="flex h-[560px] items-center justify-center text-muted-foreground">No image</div>`;
      }
    }

    const titleEl = document.getElementById("product-title");
    if (titleEl) titleEl.textContent = p.title;

    const badgesContainer = document.getElementById("product-badges-container");
    if (badgesContainer && p.badges) {
      badgesContainer.innerHTML = p.badges.map(b => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wider rounded border border-ember/50 text-ember bg-ember/10">
          <span class="text-[#a1a1aa] font-medium">${b.label}</span>
          <span class="font-bold text-[#ffffff]">${b.score}</span>
        </span>
      `).join("");
    }

    const countryEl = document.getElementById("product-country");
    if (countryEl && p.country) countryEl.textContent = p.country;

    const compositionEl = document.getElementById("product-composition");
    if (compositionEl && p.composition) compositionEl.textContent = p.composition;

    const typeEl = document.getElementById("product-type");
    if (typeEl && p.type) typeEl.textContent = p.type;

    const descriptionEl = document.getElementById("product-description");
    if (descriptionEl) descriptionEl.textContent = p.description;

    const priceEl = document.getElementById("product-price");
    const optionsContainer = document.getElementById("product-variants-container");
    const optionsButtons = document.getElementById("product-variants-buttons");

    let activeVariantIndex = 0;

    const updateSelectedVariantUI = () => {
      const variant = p.variants.edges[activeVariantIndex]?.node;
      
      // Update Price
      if (priceEl) {
        if (variant) {
          priceEl.textContent = formatMoney(variant.price.amount, variant.price.currencyCode);
        } else {
          priceEl.textContent = formatMoney(
            p.priceRange.minVariantPrice.amount,
            p.priceRange.minVariantPrice.currencyCode
          );
        }
      }

      // Update buttons selected classes
      if (optionsButtons) {
        const buttons = optionsButtons.querySelectorAll("button");
        buttons.forEach((btn, idx) => {
          if (idx === activeVariantIndex) {
            btn.className = "rounded-sm border px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition-all duration-500 border-ember text-ember";
          } else {
            btn.className = "rounded-sm border px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition-all duration-500 border-border text-muted-foreground hover:border-ember/60";
          }
        });
      }
    };

    // Render option buttons if multiple variants exist
    if (p.variants.edges.length > 1) {
      optionsContainer?.classList.remove("hidden");
      if (optionsButtons) {
        optionsButtons.innerHTML = p.variants.edges.map((v, i) => {
          return `
            <button type="button" data-index="${i}">
              ${v.node.title}
            </button>
          `;
        }).join("");

        // Bind clicks on option buttons
        optionsButtons.querySelectorAll("button").forEach((btn) => {
          btn.addEventListener("click", () => {
            activeVariantIndex = parseInt(btn.getAttribute("data-index"));
            updateSelectedVariantUI();
          });
        });
      }
    }

    // Set initial display
    updateSelectedVariantUI();

    // Trigger reveal animations on details load
    initRevealAnimations();
  } catch (error) {
    console.error("Failed to load product page details:", error);
    if (productLoading) productLoading.classList.add("hidden");
    productNotFound?.classList.remove("hidden");
  }
}

// About section expand/collapse toggle
function initAboutToggle() {
  const toggleBtn = document.getElementById("about-toggle-btn");
  const expandedContent = document.getElementById("about-expanded-content");
  
  if (toggleBtn && expandedContent) {
    toggleBtn.addEventListener("click", () => {
      const isHidden = expandedContent.classList.contains("hidden");
      if (isHidden) {
        expandedContent.classList.remove("hidden");
        toggleBtn.textContent = "Read Less";
      } else {
        expandedContent.classList.add("hidden");
        toggleBtn.textContent = "Read More";
      }
    });
  }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Cart
  Cart.init();

  // 2. Initialize Reveal Animations
  initRevealAnimations();

  // 3. Initialize About Toggle
  initAboutToggle();

  // 4. Render Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 5. Run page-specific logic
  const isCategoryPage = window.location.pathname.includes("category.html") || window.location.pathname.includes("/category");
  const isProductPage = window.location.pathname.includes("product.html") || window.location.pathname.includes("/product");
  const isVisitPage = window.location.pathname.includes("visit.html") || window.location.pathname.includes("/visit");

  if (isCategoryPage) {
    handleCategoryPage();
  } else if (isProductPage) {
    handleProductPage();
  } else if (!isVisitPage) {
    // default to index
    handleIndexPage();
  }
});
