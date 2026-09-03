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

// Uploaded & Curated 15 Products per Category
const WHISKEY_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-1",
      title: "The Macallan 25 Fine Oak",
      handle: "macallan-25-fine-oak",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Malted Barley, Sherry Casks",
      type: "🥃 Single Malt Scotch",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Single Malt aged 25 years in three oak cask types. Rich notes of citrus, cinnamon, and toasted wood.",
      priceRange: { minVariantPrice: { amount: "1850.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/premium_single_malt_whiskey_bottle_with_a_clean_circular_design_and_a_brushed.png", altText: "The Macallan 25 Fine Oak" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey1", title: "700ml Bottle", price: { amount: "1850.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-2",
      title: "The Copper Cask 12 Year",
      handle: "copper-cask-12-year",
      category: "WHISKEY",
      country: "🇺🇸 United States",
      composition: "🌽 Yellow Corn, Rye, Oak",
      type: "🥃 Kentucky Straight Bourbon",
      badges: [{ label: "WE", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Small Batch Kentucky Straight Bourbon aged 12 years with caramel, vanilla, and charred oak.",
      priceRange: { minVariantPrice: { amount: "85.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/classic_square_shaped_premium_whiskey_bottle_with_a_vintage_inspired_embossed.png", altText: "The Copper Cask 12 Year" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey2", title: "700ml Bottle", price: { amount: "85.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-3",
      title: "The Serpentine Cask 70 Year",
      handle: "the-serpentine-cask",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Malted Barley, Peat Smoke",
      type: "🥃 Rare Highland Malt",
      badges: [{ label: "RP", score: "99" }, { label: "AGED", score: "RESERVE" }],
      description: "Rare Highland Single Malt Scotch Whisky aged 70 years. Limited edition 1 of 578 with elegant smoke.",
      priceRange: { minVariantPrice: { amount: "320.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/minimalist_premium_whiskey_bottle_with_a_sleek_tall_silhouette_and_a_textured.png", altText: "The Serpentine Cask 70 Year" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey3", title: "700ml Bottle", price: { amount: "320.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-4",
      title: "The Macallan 30 Fine & Rare",
      handle: "macallan-30-fine-rare",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Hand-Picked Barley",
      type: "🥃 Single Malt Decanter",
      badges: [{ label: "VIVINO", score: "5.0" }, { label: "AGED", score: "RESERVE" }],
      description: "30 Years Old Single Malt in luxury crystal decanter. Dark chocolate, wood spice, and long finish.",
      priceRange: { minVariantPrice: { amount: "3500.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/bold_heavy_set_whiskey_bottle_with_a_wide_base_and_a_black_wax_sealed_top..png", altText: "The Macallan 30 Fine & Rare" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey4", title: "700ml Bottle", price: { amount: "3500.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-5",
      title: "The Baxter Reserve 15 Year",
      handle: "baxter-reserve-15-year",
      category: "WHISKEY",
      country: "🇺🇸 United States",
      composition: "🌽 Heritage Corn & Barley",
      type: "🥃 Small Batch Bourbon",
      badges: [{ label: "RP", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Heritage Small Batch Bourbon Whiskey Aged 15 Years. Distilled in Kentucky with smooth honeycomb.",
      priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/baxter-reserve-15.jpg", altText: "The Baxter Reserve 15 Year" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey5", title: "700ml Bottle", price: { amount: "120.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-6",
      title: "Highland Decanter Cask 21",
      handle: "highland-decanter-cask-21",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Sherry Cask Aged Malt",
      type: "🥃 Highland Single Malt",
      badges: [{ label: "WE", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 21 years in seasoned Oloroso sherry casks. Dried fruit, dark chocolate, and nutmeg aroma.",
      priceRange: { minVariantPrice: { amount: "240.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_luxury_decanter_style_whiskey_bottle_with_a_heavy_base_and_a_geometric_glass.png", altText: "Highland Decanter Cask 21" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey6", title: "700ml Bottle", price: { amount: "240.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-7",
      title: "Hand-Blown Artisan Malt",
      handle: "hand-blown-artisan-malt",
      category: "WHISKEY",
      country: "🇯🇵 Japan",
      composition: "🌾 Japanese Malted Barley",
      type: "🥃 Artisan Japanese Malt",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "Artisanal hand-blown glass decanter malt whisky. Delicately balanced with mizunara oak and blossom.",
      priceRange: { minVariantPrice: { amount: "210.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/contemporary_artisanal_whiskey_bottle_with_a_unique_hand_blown_glass.png", altText: "Hand-Blown Artisan Malt" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey7", title: "700ml Bottle", price: { amount: "210.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-8",
      title: "Topographical Map Edition",
      handle: "topographical-map-edition",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Ancient Peated Malt",
      type: "🥃 Islay Single Malt",
      badges: [{ label: "RP", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Exotic bottle featuring etched topographical maps in the glass. Intense peat smoke, sea salt, and cocoa.",
      priceRange: { minVariantPrice: { amount: "290.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/exotic_whiskey_bottle_with_an_etched_topographical_map_design_in_the_glass..png", altText: "Topographical Map Edition" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey8", title: "700ml Bottle", price: { amount: "290.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-9",
      title: "Organic Flowing Glass Reserve",
      handle: "organic-flowing-glass-reserve",
      category: "WHISKEY",
      country: "🇮🇪 Ireland",
      composition: "🌾 Triple Distilled Malt",
      type: "🥃 Irish Single Pot Still",
      badges: [{ label: "WE", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Organic flowing glass bottle edition. Smooth velvety honey, green apple, toasted almonds, and vanilla.",
      priceRange: { minVariantPrice: { amount: "175.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/rare_limited_edition_whiskey_bottle_with_an_organic_flowing_glass_shape._deep.png", altText: "Organic Flowing Glass Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey9", title: "700ml Bottle", price: { amount: "175.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-10",
      title: "Studio Crystal Reserve 18",
      handle: "studio-crystal-reserve-18",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Double Wood Cask",
      type: "🥃 Speyside Single Malt",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "High-end crystal glass studio release aged 18 years. Warm apple pie, clove, and rich toasted oak.",
      priceRange: { minVariantPrice: { amount: "195.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/studio_photography_of_a_premium_high_end_whiskey_bottle._elegant_crystal_glass.png", altText: "Studio Crystal Reserve 18" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey10", title: "700ml Bottle", price: { amount: "195.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-11",
      title: "Tapered Silver Crest Bourbon",
      handle: "tapered-silver-crest-bourbon",
      category: "WHISKEY",
      country: "🇺🇸 United States",
      composition: "🌽 High Rye Corn Blend",
      type: "🥃 Straight Rye Whiskey",
      badges: [{ label: "RP", score: "92" }, { label: "AGED", score: "RESERVE" }],
      description: "Ultra-premium sleek tapered bottle with silver crest. Spicy rye peppercorn, dark cherry, and maple syrup.",
      priceRange: { minVariantPrice: { amount: "110.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/ultra_premium_whiskey_bottle_featuring_a_sleek_tapered_neck_and_a_silver.png", altText: "Tapered Silver Crest Bourbon" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey11", title: "700ml Bottle", price: { amount: "110.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-12",
      title: "Charred American Cask 10",
      handle: "charred-american-cask-10",
      category: "WHISKEY",
      country: "🇺🇸 United States",
      composition: "🌽 Kentucky Yellow Corn",
      type: "🥃 Straight Bourbon",
      badges: [{ label: "WE", score: "91" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged in deep heavy charred Alligator oak barrels. Sweet campfire smoke, molasses, and toasted pecan.",
      priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cask-12.jpg", altText: "Charred American Cask 10" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey12", title: "700ml Bottle", price: { amount: "75.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-13",
      title: "The Reserve Barrel Proof",
      handle: "the-reserve-barrel-proof",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Un-chillfiltered Malt",
      type: "🥃 Barrel Proof Malt",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Raw uncut cask strength single malt whisky. Bold 58.4% ABV with rich espresso, leather, and dark plum.",
      priceRange: { minVariantPrice: { amount: "165.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/the-reserve.jpg", altText: "The Reserve Barrel Proof" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey13", title: "700ml Bottle", price: { amount: "165.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-14",
      title: "Vintage Cask Collection 1998",
      handle: "vintage-cask-collection-1998",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 First-Fill Bourbon Cask",
      type: "🥃 Vintage Scotch Malt",
      badges: [{ label: "RP", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled in 1998 and bottled at peak maturity. Golden amber tone, honeysuckle, and candied citrus.",
      priceRange: { minVariantPrice: { amount: "380.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/bottle.jpg", altText: "Vintage Cask Collection 1998" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey14", title: "700ml Bottle", price: { amount: "380.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-15",
      title: "Heritage Barrel House Malt",
      handle: "heritage-barrel-house-malt",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Charred Oak & Barley",
      type: "🥃 Heritage Reserve",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Distillery exclusive small batch malt aged in toasted virgin oak. Creamy vanilla bean, butterscotch, and cedar.",
      priceRange: { minVariantPrice: { amount: "135.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-whiskey.jpg", altText: "Heritage Barrel House Malt" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey15", title: "700ml Bottle", price: { amount: "135.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-whiskey-16",
      title: "Solera Cask Reserve 20 Year",
      handle: "solera-cask-reserve-20-year",
      category: "WHISKEY",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🌾 Oloroso Sherry & American Oak",
      type: "🥃 Speyside Single Malt",
      badges: [{ label: "WE", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 20 years in a continuous Solera vat system. Warm fig, dark chocolate, clove, and silky toasted oak finish.",
      priceRange: { minVariantPrice: { amount: "220.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_luxury_decanter_style_whiskey_bottle_with_a_heavy_base_and_a_geometric_glass.png", altText: "Solera Cask Reserve 20 Year" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/whiskey16", title: "700ml Bottle", price: { amount: "220.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

const RUM_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-rum-1",
      title: "The Scotchman Reserve 18 Year Rum",
      handle: "the-scotchman-18-year-rum",
      category: "RUM",
      country: "🇯🇲 Jamaica",
      composition: "🍯 Sugar Cane Molasses",
      type: "🍹 Dark Reserve Rum",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Handcrafted Small Batch Reserve Rum aged 18 years in oak casks. Deep caramel, dark molasses, and oak spice.",
      priceRange: { minVariantPrice: { amount: "145.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/the-scotchman-18.jpg", altText: "The Scotchman Reserve 18 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum1", title: "700ml Bottle", price: { amount: "145.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-2",
      title: "Elite Monogram Reserve 25 Year Rum",
      handle: "elite-monogram-25-year-rum",
      category: "RUM",
      country: "🇨🇺 Cuba",
      composition: "🍯 Virgin Cane Honey",
      type: "🍹 Prestige Dark Rum",
      badges: [{ label: "RP", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Small Batch Dark Reserve Rum aged 25 years. Notes of roasted cocoa, dried fruit, vanilla bean, and toasted oak.",
      priceRange: { minVariantPrice: { amount: "380.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/elite-monogram-25.jpg", altText: "Elite Monogram Reserve 25 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum2", title: "700ml Bottle", price: { amount: "380.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-3",
      title: "Forge Distillery 8 Year Rum",
      handle: "forge-distillery-8-year-rum",
      category: "RUM",
      country: "🇹🇹 Trinidad",
      composition: "🍯 Amber Cane Molasses",
      type: "🍹 Hand-Blown Reserve",
      badges: [{ label: "WE", score: "91" }, { label: "AGED", score: "RESERVE" }],
      description: "Small Batch Aged 8 Years Rum in hand-blown artisan glass. Vibrant amber tone with golden honey and citrus peel.",
      priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/forge-distillery-8.jpg", altText: "Forge Distillery 8 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum3", title: "700ml Bottle", price: { amount: "75.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-4",
      title: "Terra Vita Explorer's 18 Year Rum",
      handle: "terra-vita-18-year-rum",
      category: "RUM",
      country: "🇬🇺 Guyana",
      composition: "🍯 Demerara Cane Molasses",
      type: "🍹 Explorer's Edition Rum",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "Topographical Edition Aged 18 Years Rum. Intricately carved relief bottle boasting dark brown sugar and coconut.",
      priceRange: { minVariantPrice: { amount: "190.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/terra-vita-18.jpg", altText: "Terra Vita Explorer's 18 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum4", title: "700ml Bottle", price: { amount: "190.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-5",
      title: "Highland Estate 18 Year Rum",
      handle: "highland-estate-18-year-rum",
      category: "RUM",
      country: "🇧🇧 Barbados",
      composition: "🍯 Pot Stilled Molasses",
      type: "🍹 Small Batch Decanter",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Handcrafted 18 Year Aged Rum in a classic round decanter. Smooth finish with butterscotch, nutmeg, and wood.",
      priceRange: { minVariantPrice: { amount: "110.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/highland-distillery-18.jpg", altText: "Highland Estate 18 Year Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum5", title: "700ml Bottle", price: { amount: "110.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-6",
      title: "Caribbean Sol Cask 12 Rum",
      handle: "caribbean-sol-cask-12-rum",
      category: "RUM",
      country: "🇧🇧 Barbados",
      composition: "🍯 Fresh Cane Juice",
      type: "🍹 Solera Aged Amber Rum",
      badges: [{ label: "VIVINO", score: "4.6" }, { label: "AGED", score: "RESERVE" }],
      description: "Solera aged 12 years in French oak barrels. Warm toasted coconut, tropical papaya, and honeyed oak finish.",
      priceRange: { minVariantPrice: { amount: "85.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-rum.jpg", altText: "Caribbean Sol Cask 12 Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum6", title: "700ml Bottle", price: { amount: "85.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-7",
      title: "Havana Gold Solera 15",
      handle: "havana-gold-solera-15",
      category: "RUM",
      country: "🇨🇺 Cuba",
      composition: "🍯 Molasses & Oak Cask",
      type: "🍹 Añejo Dark Rum",
      badges: [{ label: "RP", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Rich Cuban style dark rum aged in charred white oak. Notes of dark chocolate, espresso bean, and cinnamon.",
      priceRange: { minVariantPrice: { amount: "125.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/the-scotchman-18.jpg", altText: "Havana Gold Solera 15" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum7", title: "700ml Bottle", price: { amount: "125.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-8",
      title: "Demerara Overproof Black Rum",
      handle: "demerara-overproof-black-rum",
      category: "RUM",
      country: "🇬🇺 Guyana",
      composition: "🍯 Dark Demerara Sugar",
      type: "🍹 Heavy Black Rum",
      badges: [{ label: "WE", score: "90" }, { label: "AGED", score: "RESERVE" }],
      description: "Bold overproof Navy rum with intense toasted caramel, dark treacle, pipe tobacco, and aromatic spice.",
      priceRange: { minVariantPrice: { amount: "65.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/elite-monogram-25.jpg", altText: "Demerara Overproof Black Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum8", title: "700ml Bottle", price: { amount: "65.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-9",
      title: "Barbados Reserve Cask 20",
      handle: "barbados-reserve-cask-20",
      category: "RUM",
      country: "🇧🇧 Barbados",
      composition: "🍯 Single Estate Cane",
      type: "🍹 Extra Añejo Rum",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Prestige 20 year aged Barbados rum. Silky smooth palate of candied ginger, orange peel, and toasted oak.",
      priceRange: { minVariantPrice: { amount: "220.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/forge-distillery-8.jpg", altText: "Barbados Reserve Cask 20" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum9", title: "700ml Bottle", price: { amount: "220.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-10",
      title: "Artisan Cane Batch 10 Rum",
      handle: "artisan-cane-batch-10-rum",
      category: "RUM",
      country: "🇯🇲 Jamaica",
      composition: "🍯 Pot Still Cane Juice",
      type: "🍹 Artisan Craft Rum",
      badges: [{ label: "RP", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Funky ester-heavy Jamaican pot still rum. Explosive notes of ripe banana, roasted pineapple, and clove.",
      priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/terra-vita-18.jpg", altText: "Artisan Cane Batch 10 Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum10", title: "700ml Bottle", price: { amount: "95.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-11",
      title: "Royal Mahogany Cask Rum",
      handle: "royal-mahogany-cask-rum",
      category: "RUM",
      country: "🇵🇷 Puerto Rico",
      composition: "🍯 Virgin Sugarcane Honey",
      type: "🍹 Mahogany Cask Rum",
      badges: [{ label: "WE", score: "92" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged in rare mahogany and bourbon casks. Velvety mouthfeel with crushed vanilla bean, hazelnut, and cocoa.",
      priceRange: { minVariantPrice: { amount: "140.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/highland-distillery-18.jpg", altText: "Royal Mahogany Cask Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum11", title: "700ml Bottle", price: { amount: "140.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-12",
      title: "Port Cask Finish Dark Rum",
      handle: "port-cask-finish-dark-rum",
      category: "RUM",
      country: "🇲🇶 Martinique",
      composition: "🍯 Fresh Sugarcane Juice",
      type: "🍹 Rhum Agricole Vieux",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Finished in Tawny Port casks for 24 months. Deep ruby tone, stewed plums, dark cherry, and French oak spice.",
      priceRange: { minVariantPrice: { amount: "160.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-rum.jpg", altText: "Port Cask Finish Dark Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum12", title: "700ml Bottle", price: { amount: "160.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-13",
      title: "Kingston Cask Strength 14",
      handle: "kingston-cask-strength-14",
      category: "RUM",
      country: "🇯🇲 Jamaica",
      composition: "🍯 High-Ester Molasses",
      type: "🍹 Cask Strength Rum",
      badges: [{ label: "RP", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Raw cask strength 56.5% ABV Jamaican rum. Unfiltered intensity with scorched brown sugar and grilled peach.",
      priceRange: { minVariantPrice: { amount: "130.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/the-scotchman-18.jpg", altText: "Kingston Cask Strength 14" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum13", title: "700ml Bottle", price: { amount: "130.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-14",
      title: "Island Heritage White Rum",
      handle: "island-heritage-white-rum",
      category: "RUM",
      country: "🇹🇹 Trinidad",
      composition: "🍯 Filtered Cane Spirit",
      type: "🍹 Artisanal White Rum",
      badges: [{ label: "WE", score: "89" }, { label: "AGED", score: "RESERVE" }],
      description: "Charcoal filtered crystal white rum. Crisp lime zest, fresh lemongrass, green apple, and smooth finish.",
      priceRange: { minVariantPrice: { amount: "45.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/forge-distillery-8.jpg", altText: "Island Heritage White Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum14", title: "700ml Bottle", price: { amount: "45.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-15",
      title: "Admiral's Cellar Reserve 30",
      handle: "admirals-cellar-reserve-30",
      category: "RUM",
      country: "🇧🇧 Barbados",
      composition: "🍯 Ancient Reserve Honey",
      type: "🍹 Ultra-Añejo Rum",
      badges: [{ label: "VIVINO", score: "5.0" }, { label: "AGED", score: "RESERVE" }],
      description: "Master blender's crowning 30-year reserve rum. Extremely limited release with roasted pecan and dark cocoa.",
      priceRange: { minVariantPrice: { amount: "490.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/elite-monogram-25.jpg", altText: "Admiral's Cellar Reserve 30" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum15", title: "700ml Bottle", price: { amount: "490.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-rum-16",
      title: "Royal Navy Overproof Cask Rum",
      handle: "royal-navy-overproof-cask-rum",
      category: "RUM",
      country: "🇬🇾 Guyana",
      composition: "🍯 Demerara Sugar Molasses",
      type: "🍹 Overproof Navy Rum",
      badges: [{ label: "RP", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Traditional wooden pot still distillation at 57% ABV. Intense notes of Demerara sugar, charred oak, and dark espresso.",
      priceRange: { minVariantPrice: { amount: "155.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-rum.jpg", altText: "Royal Navy Overproof Cask Rum" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/rum16", title: "700ml Bottle", price: { amount: "155.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

const BEER_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-beer-1",
      title: "Abbaye Saint-Feuillien Grand Cru",
      handle: "abbaye-saint-feuillien-grand-cru",
      category: "BEER",
      country: "🇧🇪 Belgium",
      composition: "🌾 Pilsner Malts & Hops",
      type: "🍺 Belgian Abbey Ale",
      badges: [{ label: "VIVINO", score: "4.6" }, { label: "AGED", score: "RESERVE" }],
      description: "Extraordinary Belgian Abbey Ale Grand Cru. Fermented with Champagne yeast for a creamy head and fruity aroma.",
      priceRange: { minVariantPrice: { amount: "28.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/abbaye-saint-feuillien.jpg", altText: "Abbaye Saint-Feuillien Grand Cru" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer1", title: "700ml Bottle", price: { amount: "28.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-2",
      title: "Cosmic Haze Hazy IPA",
      handle: "cosmic-haze-hazy-ipa",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Citra & Mosaic Hops",
      type: "🍺 Hazy India Pale Ale",
      badges: [{ label: "UNTAPPD", score: "4.5" }, { label: "AGED", score: "RESERVE" }],
      description: "7.2% ABV Hazy India Pale Ale brewed in Denver, CO. Packed with Citra and Mosaic hops for tropical citrus punch.",
      priceRange: { minVariantPrice: { amount: "18.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cosmic-haze-ipa.jpg", altText: "Cosmic Haze Hazy IPA" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer2", title: "700ml Bottle", price: { amount: "18.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-3",
      title: "Sunburst Citrus Wheat Ale",
      handle: "sunburst-citrus-wheat-ale",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Unfiltered Wheat & Orange",
      type: "🍺 Craft Witbier Ale",
      badges: [{ label: "REFRESH", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Craft unfiltered wheat ale brewed with Valencia orange peel and coriander. Refreshing, crisp, and golden pour.",
      priceRange: { minVariantPrice: { amount: "16.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/citrus-wheat-ale.jpg", altText: "Sunburst Citrus Wheat Ale" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer3", title: "700ml Bottle", price: { amount: "16.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-4",
      title: "Rustic Forge Imperial Stout",
      handle: "rustic-forge-imperial-stout",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Roasted Barley & Chocolate",
      type: "🍺 Imperial Stout (10.5%)",
      badges: [{ label: "RATEBEER", score: "99" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged in charred bourbon barrels for 12 months. Thick velvety pour with dark espresso, fudge, and oak vanilla.",
      priceRange: { minVariantPrice: { amount: "24.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/rustic-forge-stout.jpg", altText: "Rustic Forge Imperial Stout" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer4", title: "700ml Bottle", price: { amount: "24.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-5",
      title: "Traditional Cork Belgian Ale",
      handle: "traditional-cork-belgian-ale",
      category: "BEER",
      country: "🇧🇪 Belgium",
      composition: "🌾 Abbey Malt & Saaz Hops",
      type: "🍺 Belgian Strong Ale",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Hand-corked 750ml Belgian strong blonde ale. Effervescent carbonation with stone fruit, banana, and clove.",
      priceRange: { minVariantPrice: { amount: "22.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_classic_brown_bottle_of_belgian_ale_with_a_traditional_cork_and_wire_closure..png", altText: "Traditional Cork Belgian Ale" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer5", title: "700ml Bottle", price: { amount: "22.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-6",
      title: "Dark Craft Barrel Stout",
      handle: "dark-craft-barrel-stout",
      category: "BEER",
      country: "🇮🇪 Ireland",
      composition: "🌾 Roasted Black Malt & Oats",
      type: "🍺 Barrel-Aged Stout",
      badges: [{ label: "RATEBEER", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "Decadent dark stout aged on cocoa nibs and bourbon barrel oak planks. Rich coffee bean and dark chocolate.",
      priceRange: { minVariantPrice: { amount: "26.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_heavy_set_bottle_of_dark_craft_stout_on_a_rustic_wooden_bar._low_key_lighting.png", altText: "Dark Craft Barrel Stout" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer6", title: "700ml Bottle", price: { amount: "26.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-7",
      title: "Geometric Can Hazy Double IPA",
      handle: "geometric-can-hazy-double-ipa",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Galaxy & Nelson Hops",
      type: "🍺 Double Hazy IPA (8.5%)",
      badges: [{ label: "UNTAPPD", score: "4.6" }, { label: "AGED", score: "RESERVE" }],
      description: "Freshly canned craft double hazy IPA. Bursting with passionfruit, guava, ripe mango, and pillowy mouthfeel.",
      priceRange: { minVariantPrice: { amount: "20.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_modern_can_of_craft_ipa_with_a_colorful_artistic_geometric_label._chilled.png", altText: "Geometric Can Hazy Double IPA" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer7", title: "700ml Bottle", price: { amount: "20.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-8",
      title: "Sunlit Golden Witbier Pint",
      handle: "sunlit-golden-witbier-pint",
      category: "BEER",
      country: "🇩🇪 Germany",
      composition: "🌾 Malted Wheat & Hallertau",
      type: "🍺 Bavarian Hefeweizen",
      badges: [{ label: "REFRESH", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "Traditional German cloudy wheat beer served with orange garnish. Notes of banana bread, clove, and crisp grain.",
      priceRange: { minVariantPrice: { amount: "14.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_refreshing_glass_of_wheat_beer_with_an_orange_slice_garnish._bright_airy.png", altText: "Sunlit Golden Witbier Pint" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer8", title: "700ml Bottle", price: { amount: "14.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-9",
      title: "Oak Barrel Vintage Farmhouse",
      handle: "oak-barrel-vintage-farmhouse",
      category: "BEER",
      country: "🇫🇷 France",
      composition: "🌾 Wild Yeast & French Hops",
      type: "🍺 Farmhouse Saison",
      badges: [{ label: "VIVINO", score: "4.5" }, { label: "AGED", score: "RESERVE" }],
      description: "Saison fermented in French oak foeders. Crisp rustic funk, lemon verbena, white pepper, and dry finish.",
      priceRange: { minVariantPrice: { amount: "25.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-beer.jpg", altText: "Oak Barrel Vintage Farmhouse" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer9", title: "700ml Bottle", price: { amount: "25.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-10",
      title: "Summit Ridge West Coast IPA",
      handle: "summit-ridge-west-coast-ipa",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Simcoe & Centennial Hops",
      type: "🍺 West Coast IPA (7.0%)",
      badges: [{ label: "UNTAPPD", score: "4.4" }, { label: "AGED", score: "RESERVE" }],
      description: "Classic piney and resinous West Coast IPA. Bright grapefruit bitterness with clean crisp malt backbone.",
      priceRange: { minVariantPrice: { amount: "17.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cosmic-haze-ipa.jpg", altText: "Summit Ridge West Coast IPA" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer10", title: "700ml Bottle", price: { amount: "17.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-11",
      title: "Trappist Reserve Quad 11",
      handle: "trappist-reserve-quad-11",
      category: "BEER",
      country: "🇧🇪 Belgium",
      composition: "🌾 Dark Candied Sugar & Malt",
      type: "🍺 Belgian Quadrupel (11%)",
      badges: [{ label: "RATEBEER", score: "100" }, { label: "AGED", score: "RESERVE" }],
      description: "Authentic Trappist monastic Quadrupel. Deep mahogany with dark fig, raisin, plum, and warming alcohol.",
      priceRange: { minVariantPrice: { amount: "32.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/abbaye-saint-feuillien.jpg", altText: "Trappist Reserve Quad 11" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer11", title: "700ml Bottle", price: { amount: "32.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-12",
      title: "Blood Orange Session Wheat",
      handle: "blood-orange-session-wheat",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Wheat & Sicilian Orange",
      type: "🍺 Fruit Wheat Beer",
      badges: [{ label: "REFRESH", score: "4.6" }, { label: "AGED", score: "RESERVE" }],
      description: "Easy-drinking 4.8% ABV wheat beer infused with sweet Sicilian blood orange puree. Bright tart finish.",
      priceRange: { minVariantPrice: { amount: "15.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/citrus-wheat-ale.jpg", altText: "Blood Orange Session Wheat" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer12", title: "700ml Bottle", price: { amount: "15.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-13",
      title: "Ironworks Midnight Porter",
      handle: "ironworks-midnight-porter",
      category: "BEER",
      country: "🇬🇧 United Kingdom",
      composition: "🌾 Chocolate & Caramel Malt",
      type: "🍺 English Baltic Porter",
      badges: [{ label: "RATEBEER", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Traditional London Baltic porter. Smooth milk chocolate, toasted hazelnut, and dark roasted malt aroma.",
      priceRange: { minVariantPrice: { amount: "19.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/rustic-forge-stout.jpg", altText: "Ironworks Midnight Porter" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer13", title: "700ml Bottle", price: { amount: "19.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-14",
      title: "Bavarian Keller Pilsner",
      handle: "bavarian-keller-pilsner",
      category: "BEER",
      country: "🇩🇪 Germany",
      composition: "🌾 Unfiltered Pilsner Malt",
      type: "🍺 German Kellerbier",
      badges: [{ label: "REFRESH", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Unfiltered crispy German pilsner poured straight from the lager tank. Noble hop floral aroma and biscuity malt.",
      priceRange: { minVariantPrice: { amount: "16.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_classic_brown_bottle_of_belgian_ale_with_a_traditional_cork_and_wire_closure..png", altText: "Bavarian Keller Pilsner" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer14", title: "700ml Bottle", price: { amount: "16.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-15",
      title: "Bourbon Vanilla Bean Stout",
      handle: "bourbon-vanilla-bean-stout",
      category: "BEER",
      country: "🇺🇸 United States",
      composition: "🌾 Madagascar Vanilla & Barrel",
      type: "🍺 Pastry Stout (12%)",
      badges: [{ label: "RATEBEER", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "Luxurious pastry stout aged 18 months in bourbon casks with fresh Madagascar vanilla beans. Melted dark fudge.",
      priceRange: { minVariantPrice: { amount: "35.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_heavy_set_bottle_of_dark_craft_stout_on_a_rustic_wooden_bar._low_key_lighting.png", altText: "Bourbon Vanilla Bean Stout" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer15", title: "700ml Bottle", price: { amount: "35.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-beer-16",
      title: "Trappist Oak Quad 2021",
      handle: "trappist-oak-quad-2021",
      category: "BEER",
      country: "🇧🇪 Belgium",
      composition: "🌾 Dark Candied Sugar & Wheat",
      type: "🍺 Abbey Quad (11.5%)",
      badges: [{ label: "RATEBEER", score: "99" }, { label: "AGED", score: "RESERVE" }],
      description: "Belgian abbey quadrupel matured in French oak wine casks. Rich plum, raisin, dark caramel, and warming alcohol finish.",
      priceRange: { minVariantPrice: { amount: "28.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/citrus-wheat-ale.jpg", altText: "Trappist Oak Quad 2021" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/beer16", title: "700ml Bottle", price: { amount: "28.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

const VODKA_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-1",
      title: "Artisanal Hand-Blown Reserve",
      handle: "artisanal-hand-blown-reserve-vodka",
      category: "VODKA",
      country: "🇵🇱 Poland",
      composition: "🌾 Organic Dankowskie Rye",
      type: "🍸 Ultra-Premium Vodka",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "Triple-distilled ultra-premium vodka in a hand-blown glass decanter with pristine clarity and smooth finish.",
      priceRange: { minVariantPrice: { amount: "88.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-decant-studio.jpg", altText: "Artisanal Hand-Blown Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka1", title: "700ml Bottle", price: { amount: "88.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-2",
      title: "Contemporary Craft Vodka",
      handle: "contemporary-craft-distilled-vodka",
      category: "VODKA",
      country: "🇸🇪 Sweden",
      composition: "🌾 Winter Wheat & Spring Water",
      type: "🍸 Craft Small-Batch Vodka",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Small-batch craft vodka distilled from organic winter wheat. Crisp minerality with subtle vanilla undertones.",
      priceRange: { minVariantPrice: { amount: "65.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/contemporary_artisanal_vodka_bottle_with_a_unique_hand_blown_glass_appearance.png", altText: "Contemporary Craft Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka2", title: "700ml Bottle", price: { amount: "65.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-3",
      title: "Diamond Cut Crystal Vodka",
      handle: "diamond-cut-crystal-vodka",
      category: "VODKA",
      country: "🇫🇮 Finland",
      composition: "🌾 Glacial Spring Water",
      type: "🍸 Crystal Decanter Vodka",
      badges: [{ label: "RP", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Prestige edition vodka housed in an intricate diamond-cut crystal bottle. Birch charcoal filtered.",
      priceRange: { minVariantPrice: { amount: "160.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/luxury_vodka_bottle_with_an_intricate_diamond_cut_crystal_texture_in_the_glass..png", altText: "Diamond Cut Crystal Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka3", title: "700ml Bottle", price: { amount: "160.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-4",
      title: "Nordic Glacier Ultra-Premium",
      handle: "nordic-glacier-ultra-premium-vodka",
      category: "VODKA",
      country: "🇳🇴 Norway",
      composition: "🌾 Glacial Water & Golden Barley",
      type: "🍸 Nordic Glacier Spirit",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Minimalist tall-silhouette vodka crafted with pure glacial water. Exceptionally light, clean, and velvety.",
      priceRange: { minVariantPrice: { amount: "115.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/ultra_premium_minimalist_vodka_bottle_with_a_sleek_tall_silhouette_and_a.png", altText: "Nordic Glacier Ultra-Premium" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka4", title: "700ml Bottle", price: { amount: "115.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-5",
      title: "Studio Decanter Pristine Vodka",
      handle: "studio-decanter-pristine-vodka",
      category: "VODKA",
      country: "🇵🇱 Poland",
      composition: "🌾 100% Rye Grain",
      type: "🍸 Decanter Reserve Vodka",
      badges: [{ label: "WE", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "High-end studio photography decanter vodka. 5x distilled for supreme silkiness and zero burn finish.",
      priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-crystal-studio.jpg", altText: "Studio Decanter Pristine Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka5", title: "700ml Bottle", price: { amount: "95.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-6",
      title: "Baltic Birch Filtered Reserve",
      handle: "baltic-birch-filtered-reserve",
      category: "VODKA",
      country: "🇪🇪 Estonia",
      composition: "🌾 Organic Spelt Grain",
      type: "🍸 Birch Filtered Spirit",
      badges: [{ label: "VIVINO", score: "4.6" }, { label: "AGED", score: "RESERVE" }],
      description: "Filtered through silver birch charcoal and quartz crystal. Pristine clarity with subtle black pepper spice.",
      priceRange: { minVariantPrice: { amount: "78.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-vodka.jpg", altText: "Baltic Birch Filtered Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka6", title: "700ml Bottle", price: { amount: "78.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-7",
      title: "Imperial Platinum Rye 10x",
      handle: "imperial-platinum-rye-10x",
      category: "VODKA",
      country: "🇵🇱 Poland",
      composition: "🌾 Selected Heritage Rye",
      type: "🍸 Platinum Edition Vodka",
      badges: [{ label: "RP", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled 10 times in copper columns. Housed in a frosted platinum bottle with rich creaminess.",
      priceRange: { minVariantPrice: { amount: "140.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/luxury_vodka_bottle_with_an_intricate_diamond_cut_crystal_texture_in_the_glass..png", altText: "Imperial Platinum Rye 10x" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka7", title: "700ml Bottle", price: { amount: "140.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-8",
      title: "Glacial Peak Single Estate",
      handle: "glacial-peak-single-estate",
      category: "VODKA",
      country: "🇮🇸 Iceland",
      composition: "🌾 Volcanic Water & Barley",
      type: "🍸 Icelandic Single Estate",
      badges: [{ label: "WE", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Crafted with 4,000-year-old Icelandic volcanic lava field water. Unmatched purity and crisp clean palate.",
      priceRange: { minVariantPrice: { amount: "105.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/ultra_premium_minimalist_vodka_bottle_with_a_sleek_tall_silhouette_and_a.png", altText: "Glacial Peak Single Estate" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka8", title: "700ml Bottle", price: { amount: "105.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-9",
      title: "Artisan Wheat Handcrafted",
      handle: "artisan-wheat-handcrafted",
      category: "VODKA",
      country: "🇫🇷 France",
      composition: "🌾 French Winter Wheat",
      type: "🍸 French Craft Spirit",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled in the Cognac region of France using copper pot stills. Subtle citrus, almond blossom, and butter.",
      priceRange: { minVariantPrice: { amount: "82.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/contemporary_artisanal_vodka_bottle_with_a_unique_hand_blown_glass_appearance.png", altText: "Artisan Wheat Handcrafted" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka9", title: "700ml Bottle", price: { amount: "82.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-10",
      title: "Sapphire Ice Pristine Edition",
      handle: "sapphire-ice-pristine-edition",
      category: "VODKA",
      country: "🇳🇴 Norway",
      composition: "🌾 Arctic Spring Water",
      type: "🍸 Sapphire Edition Vodka",
      badges: [{ label: "RP", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Bottled at the Arctic edge. Micro-filtered through active coconut husk for an ultra-smooth finish.",
      priceRange: { minVariantPrice: { amount: "90.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-decant-studio.jpg", altText: "Sapphire Ice Pristine Edition" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka10", title: "700ml Bottle", price: { amount: "90.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-11",
      title: "Gold Leaf Heritage Vodka",
      handle: "gold-leaf-heritage-vodka",
      category: "VODKA",
      country: "🇵🇱 Poland",
      composition: "🌾 Gold Rye & Pure Water",
      type: "🍸 Luxury Gold Leaf Vodka",
      badges: [{ label: "WE", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Infused with floating 23-karat edible gold leaf flakes. Housed in a hand-carved crystal carafe.",
      priceRange: { minVariantPrice: { amount: "185.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/luxury_vodka_bottle_with_an_intricate_diamond_cut_crystal_texture_in_the_glass..png", altText: "Gold Leaf Heritage Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka11", title: "700ml Bottle", price: { amount: "185.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-12",
      title: "Nordic Winter Organic Wheat",
      handle: "nordic-winter-organic-wheat",
      category: "VODKA",
      country: "🇸🇪 Sweden",
      composition: "🌾 Certified Organic Wheat",
      type: "🍸 Organic Scandinavian Vodka",
      badges: [{ label: "VIVINO", score: "4.5" }, { label: "AGED", score: "RESERVE" }],
      description: "100% certified organic Scandinavian grain vodka. Clean, crisp, neutral profile perfect for luxury martinis.",
      priceRange: { minVariantPrice: { amount: "70.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/ultra_premium_minimalist_vodka_bottle_with_a_sleek_tall_silhouette_and_a.png", altText: "Nordic Winter Organic Wheat" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka12", title: "700ml Bottle", price: { amount: "70.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-13",
      title: "Royal Polish Rye Reserve",
      handle: "royal-polish-rye-reserve",
      category: "VODKA",
      country: "🇵🇱 Poland",
      composition: "🌾 Estate Dankowskie Rye",
      type: "🍸 Royal Reserve Vodka",
      badges: [{ label: "RP", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "Historic recipe aged in oak vats for 60 days. Delicate hints of vanilla, white pepper, and toasted rye.",
      priceRange: { minVariantPrice: { amount: "130.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/contemporary_artisanal_vodka_bottle_with_a_unique_hand_blown_glass_appearance.png", altText: "Royal Polish Rye Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka13", title: "700ml Bottle", price: { amount: "130.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-14",
      title: "Alpine Spring Crystal Vodka",
      handle: "alpine-spring-crystal-vodka",
      category: "VODKA",
      country: "🇦🇹 Austria",
      composition: "🌾 Alpine Glacier Water",
      type: "🍸 Alpine Spring Vodka",
      badges: [{ label: "WE", score: "92" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled using pristine Austrian alpine water. Smooth mineral finish with a touch of sweet grain.",
      priceRange: { minVariantPrice: { amount: "72.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/vodka-crystal-studio.jpg", altText: "Alpine Spring Crystal Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka14", title: "700ml Bottle", price: { amount: "72.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-15",
      title: "Black Diamond Truffle Vodka",
      handle: "black-diamond-truffle-vodka",
      category: "VODKA",
      country: "🇫🇷 France",
      composition: "🌾 Winter Wheat & Truffle",
      type: "🍸 Infused Prestige Vodka",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Limited batch vodka delicately steeped with black Perigord truffles. Earthy, savory, and ultra-luxurious.",
      priceRange: { minVariantPrice: { amount: "210.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-vodka.jpg", altText: "Black Diamond Truffle Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka15", title: "700ml Bottle", price: { amount: "210.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-vodka-16",
      title: "Imperial Nordic Platinum Vodka",
      handle: "imperial-nordic-platinum-vodka",
      category: "VODKA",
      country: "🇸🇪 Sweden",
      composition: "🌾 Organic Winter Rye",
      type: "🍸 Platinum Filtered Vodka",
      badges: [{ label: "WE", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Filtered through platinum-coated birch charcoal. Exceptionally smooth, crisp, and pure with subtle cracked pepper notes.",
      priceRange: { minVariantPrice: { amount: "125.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/ultra_premium_minimalist_vodka_bottle_with_a_sleek_tall_silhouette_and_a.png", altText: "Imperial Nordic Platinum Vodka" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/vodka16", title: "700ml Bottle", price: { amount: "125.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

const WINE_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-wine-1",
      title: "Domaines des Étoiles Pinot Noir",
      handle: "domaines-des-etoiles-pinot-noir",
      category: "WINE",
      country: "🇺🇸 United States",
      composition: "🍇 Pinot Noir Grapes",
      type: "🍷 Red Wine (Willamette)",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "2021 Willamette Valley Reserve Pinot Noir. Dark cherry, forest floor, French oak, and silky tannins.",
      priceRange: { minVariantPrice: { amount: "135.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/pinot-noir-etoiles.jpg", altText: "Domaines des Étoiles Pinot Noir" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine1", title: "700ml Bottle", price: { amount: "135.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-2",
      title: "Château Margaux Cabernet 2016",
      handle: "chateau-margaux-cabernet-sauvignon",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Cabernet Sauvignon Blend",
      type: "🍷 Red Wine (Bordeaux Grand Vin)",
      badges: [{ label: "RP", score: "99" }, { label: "AGED", score: "RESERVE" }],
      description: "2016 Grand Vin de Bordeaux. World-renowned vintage with cassis, cedarwood, crushed violets, and refined structure.",
      priceRange: { minVariantPrice: { amount: "890.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/chateau-margaux.jpg", altText: "Château Margaux Cabernet 2016" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine2", title: "700ml Bottle", price: { amount: "890.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-3",
      title: "Veuve Clicquot La Grande Dame",
      handle: "veuve-clicquot-la-grande-dame",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Pinot Noir & Chardonnay",
      type: "🍾 Sparkling Champagne",
      badges: [{ label: "WE", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Prestige Cuvée Brut Champagne. Effervescent notes of candied citrus, almond, brioche, and golden apple.",
      priceRange: { minVariantPrice: { amount: "240.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/veuve-clicquot-champagne.jpg", altText: "Veuve Clicquot La Grande Dame" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine3", title: "700ml Bottle", price: { amount: "240.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-4",
      title: "Château Miraval Côtes Rosé",
      handle: "chateau-miraval-rose",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Grenache & Cinsault",
      type: "🍷 Rosé Wine (Provence)",
      badges: [{ label: "VIVINO", score: "4.5" }, { label: "AGED", score: "RESERVE" }],
      description: "Chilled Provence Rosé with delicate fresh red berries, wild strawberries, white peach, and saline finish.",
      priceRange: { minVariantPrice: { amount: "38.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/miraval-rose.jpg", altText: "Château Miraval Côtes Rosé" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine4", title: "700ml Bottle", price: { amount: "38.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-5",
      title: "Domaine de la Mer Chardonnay",
      handle: "domaine-de-la-mer-chardonnay",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Chardonnay Grapes",
      type: "🍷 White Wine (Reserve)",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "2023 Mediterranean Coast Reserve. Crisp green apple, white peach, toasted brioche, and coastal minerality.",
      priceRange: { minVariantPrice: { amount: "42.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/domaine-chardonnay.jpg", altText: "Domaine de la Mer Chardonnay" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine5", title: "700ml Bottle", price: { amount: "42.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-6",
      title: "Sun-Drenched Marble Chardonnay",
      handle: "sun-drenched-marble-chardonnay",
      category: "WINE",
      country: "🇺🇸 United States",
      composition: "🍇 Napa Valley Chardonnay",
      type: "🍷 White Wine (Napa Valley)",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Napa Valley sun-drenched reserve Chardonnay. Creamy lemon curd, toasted macadamia, and vanilla bean oak.",
      priceRange: { minVariantPrice: { amount: "88.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_crisp_bottle_of_chilled_white_chardonnay_on_a_bright_sun_drenched_marble.png", altText: "Sun-Drenched Marble Chardonnay" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine6", title: "700ml Bottle", price: { amount: "88.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-7",
      title: "Mahogany Table Cabernet 2018",
      handle: "mahogany-table-cabernet-2018",
      category: "WINE",
      country: "🇺🇸 United States",
      composition: "🍇 Cabernet Sauvignon",
      type: "🍷 Red Wine (Oakville)",
      badges: [{ label: "RP", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Oakville Napa Valley Cabernet. Intense blackberry liqueur, dark espresso, tobacco leaf, and structured tannins.",
      priceRange: { minVariantPrice: { amount: "160.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_luxury_bottle_of_deep_red_cabernet_sauvignon_on_a_dark_mahogany_table._soft.png", altText: "Mahogany Table Cabernet 2018" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine7", title: "700ml Bottle", price: { amount: "160.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-8",
      title: "Textured Label Pinot Noir",
      handle: "textured-label-pinot-noir",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Burgundy Pinot Noir",
      type: "🍷 Red Wine (Burgundy)",
      badges: [{ label: "WE", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "French Burgundy Premier Cru Pinot Noir. Elegant wild raspberry, damp earth, truffle, and velvet finish.",
      priceRange: { minVariantPrice: { amount: "145.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_minimalist_bottle_of_pinot_noir_with_a_textured_cream_label._dramatic_side.png", altText: "Textured Label Pinot Noir" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine8", title: "700ml Bottle", price: { amount: "145.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-9",
      title: "Gold Foil Vintage Champagne 2012",
      handle: "gold-foil-vintage-champagne-2012",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Vintage Chardonnay",
      type: "🍾 Prestige Champagne",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "2012 Vintage Gold Foil Brut Champagne. Fine micro-bubbles with roasted hazelnut, Meyer lemon, and toast.",
      priceRange: { minVariantPrice: { amount: "290.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_vintage_style_bottle_of_premium_champagne_with_a_gold_foil_top._dark.png", altText: "Gold Foil Vintage Champagne 2012" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine9", title: "700ml Bottle", price: { amount: "290.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-10",
      title: "Silver Bucket Provence Rosé",
      handle: "silver-bucket-provence-rose",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Grenache & Syrah",
      type: "🍷 Rosé Wine (Prestige)",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Iconic silver ice bucket edition Rosé. Crisp watermelon, white flowers, lemon zest, and mineral purity.",
      priceRange: { minVariantPrice: { amount: "55.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/an_elegant_bottle_of_ros_wine_in_a_modern_silver_ice_bucket._bright_outdoor.png", altText: "Silver Bucket Provence Rosé" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine10", title: "700ml Bottle", price: { amount: "55.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-11",
      title: "Grand Cru Bordeaux Reserve 2015",
      handle: "grand-cru-bordeaux-reserve-2015",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Cabernet & Merlot",
      type: "🍷 Red Wine (Bordeaux)",
      badges: [{ label: "RP", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "2015 Saint-Julien Grand Cru Classé. Opulent black currant, graphite, cigar box, and velvety long finish.",
      priceRange: { minVariantPrice: { amount: "340.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-wine.jpg", altText: "Grand Cru Bordeaux Reserve 2015" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine11", title: "700ml Bottle", price: { amount: "340.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-12",
      title: "Tuscan Reserve Sangiovese 2019",
      handle: "tuscan-reserve-sangiovese-2019",
      category: "WINE",
      country: "🇮🇹 Italy",
      composition: "🍇 Sangiovese Grosso",
      type: "🍷 Red Wine (Brunello)",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "2019 Brunello di Montalcino. Ripe red cherry, leather, dried oregano, sandalwood, and firm structure.",
      priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/chateau-margaux.jpg", altText: "Tuscan Reserve Sangiovese 2019" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine12", title: "700ml Bottle", price: { amount: "120.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-13",
      title: "Barossa Valley Shiraz Reserve",
      handle: "barossa-valley-shiraz-reserve",
      category: "WINE",
      country: "🇦🇺 Australia",
      composition: "🍇 Old Vine Shiraz",
      type: "🍷 Red Wine (Barossa)",
      badges: [{ label: "RP", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "2018 Old Vine Barossa Shiraz. Full-bodied black plum, dark chocolate, black pepper, and smoky oak.",
      priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/pinot-noir-etoiles.jpg", altText: "Barossa Valley Shiraz Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine13", title: "700ml Bottle", price: { amount: "95.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-14",
      title: "Mendoza Malbec Gran Reserva",
      handle: "mendoza-malbec-gran-reserva",
      category: "WINE",
      country: "🇦🇷 Argentina",
      composition: "🍇 Malbec Grapes",
      type: "🍷 Red Wine (Uco Valley)",
      badges: [{ label: "WE", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "2020 High-altitude Uco Valley Malbec. Intense violet aromas, blackberry compote, mocha, and plush tannins.",
      priceRange: { minVariantPrice: { amount: "68.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/chateau-margaux.jpg", altText: "Mendoza Malbec Gran Reserva" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine14", title: "700ml Bottle", price: { amount: "68.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-15",
      title: "Sancerre Blanc Les Monts 2022",
      handle: "sancerre-blanc-les-monts-2022",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Sauvignon Blanc",
      type: "🍷 White Wine (Loire)",
      badges: [{ label: "VIVINO", score: "4.6" }, { label: "AGED", score: "RESERVE" }],
      description: "2022 Loire Valley Sancerre. Electric acidity, flinty minerality, green apple, lime blossom, and grapefruit.",
      priceRange: { minVariantPrice: { amount: "62.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/domaine-chardonnay.jpg", altText: "Sancerre Blanc Les Monts 2022" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine15", title: "700ml Bottle", price: { amount: "62.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-wine-16",
      title: "Château Prestige Pauillac 2018",
      handle: "chateau-prestige-pauillac-2018",
      category: "WINE",
      country: "🇫🇷 France",
      composition: "🍇 Cabernet Sauvignon & Merlot",
      type: "🍷 Red Wine (Bordeaux Grand Cru)",
      badges: [{ label: "RP", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "2018 Pauillac Grand Cru Classé. Complex graphite, cassis, tobacco leaf, and refined structured oak tannins.",
      priceRange: { minVariantPrice: { amount: "310.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/a_luxury_bottle_of_deep_red_cabernet_sauvignon_on_a_dark_mahogany_table._soft.png", altText: "Château Prestige Pauillac 2018" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/wine16", title: "700ml Bottle", price: { amount: "310.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

const GIN_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-gin-1",
      title: "Nocturne Handcrafted Gin",
      handle: "nocturne-handcrafted-botanical-gin",
      category: "GIN",
      country: "🇬🇧 United Kingdom",
      composition: "🫐 Juniper & Wild Lavender",
      type: "🍸 Craft Botanical Gin",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled with rare mountain juniper, citrus peel, wild lavender, and cardamom in an amber glass decanter.",
      priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Nocturne Handcrafted Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin1", title: "700ml Bottle", price: { amount: "95.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-2",
      title: "Highland Mountain Juniper Gin",
      handle: "highland-mountain-juniper-gin",
      category: "GIN",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🫐 Highland Botanicals",
      type: "🍸 Scottish Dry Gin",
      badges: [{ label: "WE", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Crafted in the Scottish Highlands with hand-foraged heather, juniper berries, and pine needles.",
      priceRange: { minVariantPrice: { amount: "78.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "Highland Mountain Juniper Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin2", title: "700ml Bottle", price: { amount: "78.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-3",
      title: "Empress Sapphire Floral Gin",
      handle: "empress-sapphire-floral-gin",
      category: "GIN",
      country: "🇨🇦 Canada",
      composition: "🫐 Butterfly Pea Blossom",
      type: "🍸 Indigo Botanical Gin",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Infused with butterfly pea blossom for a natural indigo shade that shifts to rose when tonic is added.",
      priceRange: { minVariantPrice: { amount: "68.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Empress Sapphire Floral Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin3", title: "700ml Bottle", price: { amount: "68.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-4",
      title: "Artisanal Citrus Peel Dry Gin",
      handle: "artisanal-citrus-peel-dry-gin",
      category: "GIN",
      country: "🇪🇸 Spain",
      composition: "🫐 Mediterranean Citrus",
      type: "🍸 Spanish Style Gin",
      badges: [{ label: "RP", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled with Valencia orange peel, lemons, rosemary, and thyme. Vibrant, aromatic, and refreshing.",
      priceRange: { minVariantPrice: { amount: "60.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "Artisanal Citrus Peel Dry Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin4", title: "700ml Bottle", price: { amount: "60.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-5",
      title: "Wild Lavender Craft Gin",
      handle: "wild-lavender-craft-gin",
      category: "GIN",
      country: "🇫🇷 France",
      composition: "🫐 Provence Lavender",
      type: "🍸 French Botanical Gin",
      badges: [{ label: "WE", score: "92" }, { label: "AGED", score: "RESERVE" }],
      description: "Small-batch French gin distilled in copper pots with Provence lavender, lemon verbena, and angelica root.",
      priceRange: { minVariantPrice: { amount: "72.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Wild Lavender Craft Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin5", title: "700ml Bottle", price: { amount: "72.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-6",
      title: "Olive & Rosemary Mediterranean",
      handle: "olive-rosemary-mediterranean-gin",
      category: "GIN",
      country: "🇮🇹 Italy",
      composition: "🫐 Tuscans Olives & Herbs",
      type: "🍸 Mediterranean Gin",
      badges: [{ label: "VIVINO", score: "4.6" }, { label: "AGED", score: "RESERVE" }],
      description: "Savory Tuscan style gin infused with Arbequina olives, fresh rosemary, basil, and Italian juniper.",
      priceRange: { minVariantPrice: { amount: "82.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "Olive & Rosemary Mediterranean" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin6", title: "700ml Bottle", price: { amount: "82.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-7",
      title: "Royal Navy Strength Dry Gin",
      handle: "royal-navy-strength-dry-gin",
      category: "GIN",
      country: "🇬🇧 United Kingdom",
      composition: "🫐 57% ABV Juniper & Spice",
      type: "🍸 Navy Strength Gin",
      badges: [{ label: "RP", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Overproof 57% ABV Navy strength gin. Intense juniper punch, coriander seed, grains of paradise, and lime peel.",
      priceRange: { minVariantPrice: { amount: "88.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Royal Navy Strength Dry Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin7", title: "700ml Bottle", price: { amount: "88.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-8",
      title: "Pink Grapefruit & Elderflower",
      handle: "pink-grapefruit-elderflower-gin",
      category: "GIN",
      country: "🇬🇧 United Kingdom",
      composition: "🫐 Grapefruit & Elderflower",
      type: "🍸 Pink Botanical Gin",
      badges: [{ label: "REFRESH", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Naturally distilled with ruby red grapefruit and hand-picked English elderflowers. Crisp citrus sweetness.",
      priceRange: { minVariantPrice: { amount: "55.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "Pink Grapefruit & Elderflower" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin8", title: "700ml Bottle", price: { amount: "55.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-9",
      title: "Copper Still Small Batch 10",
      handle: "copper-still-small-batch-10",
      category: "GIN",
      country: "🇺🇸 United States",
      composition: "🫐 Oregon Hops & Orris",
      type: "🍸 American Craft Gin",
      badges: [{ label: "WE", score: "91" }, { label: "AGED", score: "RESERVE" }],
      description: "Batch No. 10 American dry gin distilled with Cascade hops, chamomile, and fresh grapefruit rind.",
      priceRange: { minVariantPrice: { amount: "65.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Copper Still Small Batch 10" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin9", title: "700ml Bottle", price: { amount: "65.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-10",
      title: "London Dry Heritage Edition",
      handle: "london-dry-heritage-edition",
      category: "GIN",
      country: "🇬🇧 United Kingdom",
      composition: "🫐 Classic 9 Botanicals",
      type: "🍸 London Dry Gin",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "Traditional 18th-century recipe with 9 wild botanicals including cassia bark, liquorice, and coriander.",
      priceRange: { minVariantPrice: { amount: "52.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "London Dry Heritage Edition" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin10", title: "700ml Bottle", price: { amount: "52.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-11",
      title: "Black Forest Monkey 47 Reserve",
      handle: "black-forest-monkey-47-reserve",
      category: "GIN",
      country: "🇩🇪 Germany",
      composition: "🫐 47 Black Forest Botanicals",
      type: "🍸 German Reserve Gin",
      badges: [{ label: "RP", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "Iconic German gin boasting 47 hand-picked Black Forest botanicals and cranberries. Unrivaled complexity.",
      priceRange: { minVariantPrice: { amount: "110.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Black Forest Monkey 47 Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin11", title: "700ml Bottle", price: { amount: "110.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-12",
      title: "Botanical Garden Cucumber Gin",
      handle: "botanical-garden-cucumber-gin",
      category: "GIN",
      country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
      composition: "🫐 Cucumber & Rose Petal",
      type: "🍸 Cucumber Infused Gin",
      badges: [{ label: "WE", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled with fresh Bulgarian rose petals and crisp English cucumbers. Delightfully refreshing profile.",
      priceRange: { minVariantPrice: { amount: "70.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "Botanical Garden Cucumber Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin12", title: "700ml Bottle", price: { amount: "70.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-13",
      title: "Spiced Cardamom Artisanal Gin",
      handle: "spiced-cardamom-artisanal-gin",
      category: "GIN",
      country: "🇮🇳 India",
      composition: "🫐 Green Cardamom & Pepper",
      type: "🍸 Spiced Botanical Gin",
      badges: [{ label: "VIVINO", score: "4.7" }, { label: "AGED", score: "RESERVE" }],
      description: "Crafted in Goa, India with green cardamom, Malabar black pepper, cinnamon, and wild juniper.",
      priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Spiced Cardamom Artisanal Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin13", title: "700ml Bottle", price: { amount: "75.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-14",
      title: "Old Tom Barrel-Aged Gin",
      handle: "old-tom-barrel-aged-gin",
      category: "GIN",
      country: "🇺🇸 United States",
      composition: "🫐 Toasted Oak & Botanicals",
      type: "🍺 Barrel-Aged Gin",
      badges: [{ label: "RP", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 12 months in charred bourbon barrels. Amber hue with vanilla oak notes complementing crisp juniper.",
      priceRange: { minVariantPrice: { amount: "85.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "Old Tom Barrel-Aged Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin14", title: "700ml Bottle", price: { amount: "85.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-15",
      title: "Crystal Decanter Botanical Gin",
      handle: "crystal-decanter-botanical-gin",
      category: "GIN",
      country: "🇬🇧 United Kingdom",
      composition: "🫐 Rare Alpine Botanicals",
      type: "🍸 Luxury Decanter Gin",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Presented in a hand-cut crystal decanter. Infused with rare alpine Edelweiss and wild mountain herbs.",
      priceRange: { minVariantPrice: { amount: "160.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/gin-reserve.jpg", altText: "Crystal Decanter Botanical Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin15", title: "700ml Bottle", price: { amount: "160.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-gin-16",
      title: "Black Forest Sloe & Elderflower Gin",
      handle: "black-forest-sloe-elderflower-gin",
      category: "GIN",
      country: "🇩🇪 Germany",
      composition: "🫐 Wild Sloe Berries & Elderflower",
      type: "🍸 Artisanal Reserve Gin",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Hand-harvested Black Forest sloe berries macerated with elderflower and juniper. Rich ruby hue with tart plum notes.",
      priceRange: { minVariantPrice: { amount: "78.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-gin.jpg", altText: "Black Forest Sloe & Elderflower Gin" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/gin16", title: "700ml Bottle", price: { amount: "78.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

const CIGAR_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-1",
      title: "Aurum Artisanal Reserve Cigars",
      handle: "aurum-artisanal-reserve-cigars",
      category: "CIGAR",
      country: "🇳🇮 Nicaragua",
      composition: "🍃 Long-Filler Tobacco",
      type: "🚬 Premium Artisanal Cigar",
      badges: [{ label: "AFICIONADO", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Hand-rolled Nicaraguan long-filler tobacco presented in an engraved solid mahogany humidor box.",
      priceRange: { minVariantPrice: { amount: "210.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Aurum Artisanal Reserve Cigars" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar1", title: "700ml Bottle", price: { amount: "210.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-2",
      title: "Habano Wrapper Robusto Box",
      handle: "habano-wrapper-robusto-box",
      category: "CIGAR",
      country: "🇨🇺 Cuba",
      composition: "🍃 Cuban Seed Tobacco",
      type: "🚬 Habano Robusto (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged Cuban-seed Habano wrapper with cedarwood, dark cocoa, roasted espresso, and leather notes.",
      priceRange: { minVariantPrice: { amount: "240.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-cigar.jpg", altText: "Habano Wrapper Robusto Box" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar2", title: "700ml Bottle", price: { amount: "240.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-3",
      title: "Mahogany Engraved Torpedo",
      handle: "mahogany-engraved-torpedo",
      category: "CIGAR",
      country: "🇩🇴 Dominican",
      composition: "🍃 Aged Piloto Cubano",
      type: "🚬 Torpedo Box of 10",
      badges: [{ label: "AFICIONADO", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Hand-crafted Torpedo cigars aged 5 years. Presented in a solid mahogany box with gold brass hinges.",
      priceRange: { minVariantPrice: { amount: "195.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Mahogany Engraved Torpedo" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar3", title: "700ml Bottle", price: { amount: "195.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-4",
      title: "Estelí Long-Filler Churchill",
      handle: "esteli-long-filler-churchill",
      category: "CIGAR",
      country: "🇳🇮 Nicaragua",
      composition: "🍃 Estelí Valley Leaf",
      type: "🚬 Churchill (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "7x48 Churchill format with rich Nicaraguan binder and wrapper. Earthy pepper, nutmeg, and dark cocoa.",
      priceRange: { minVariantPrice: { amount: "180.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-cigar.jpg", altText: "Estelí Long-Filler Churchill" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar4", title: "700ml Bottle", price: { amount: "180.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-5",
      title: "Maduro Vintage Reserve Toro",
      handle: "maduro-vintage-reserve-toro",
      category: "CIGAR",
      country: "🇲🇽 Mexico",
      composition: "🍃 San Andrés Maduro",
      type: "🚬 Toro Vintage (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Oily San Andrés Maduro wrapper over Nicaraguan long-fillers. Sweet dark chocolate, black pepper, and cream.",
      priceRange: { minVariantPrice: { amount: "225.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Maduro Vintage Reserve Toro" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar5", title: "700ml Bottle", price: { amount: "225.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-6",
      title: "Hand-Rolled Corona Gorda",
      handle: "hand-rolled-corona-gorda",
      category: "CIGAR",
      country: "🇨🇺 Cuba",
      composition: "🍃 Vuelta Abajo Tobacco",
      type: "🚬 Corona Gorda (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Authentic Cuban leaf Corona Gorda. Medium to full-bodied profile with toasted almonds and white pepper.",
      priceRange: { minVariantPrice: { amount: "310.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-cigar.jpg", altText: "Hand-Rolled Corona Gorda" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar6", title: "700ml Bottle", price: { amount: "310.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-7",
      title: "Cuban Heritage Aniversario",
      handle: "cuban-heritage-aniversario",
      category: "CIGAR",
      country: "🇨🇺 Cuba",
      composition: "🍃 Vintage 2015 Crop Leaf",
      type: "🚬 Limited Edition Aniversario",
      badges: [{ label: "AFICIONADO", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "Limited edition 10th anniversary release. Aged 8 years for ultimate smoothness with roasted coffee and cedar.",
      priceRange: { minVariantPrice: { amount: "380.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Cuban Heritage Aniversario" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar7", title: "700ml Bottle", price: { amount: "380.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-8",
      title: "Nicaragua Dark Wrapper Toro",
      handle: "nicaragua-dark-wrapper-toro",
      category: "CIGAR",
      country: "🇳🇮 Nicaragua",
      composition: "🍃 Sun-Grown Dark Leaf",
      type: "🚬 Dark Toro (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "92" }, { label: "AGED", score: "RESERVE" }],
      description: "Sun-grown dark Nicaraguan wrapper. Rich spice, charred oak wood, dark cocoa, and smooth cream finish.",
      priceRange: { minVariantPrice: { amount: "170.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-cigar.jpg", altText: "Nicaragua Dark Wrapper Toro" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar8", title: "700ml Bottle", price: { amount: "170.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-9",
      title: "Royal Selection Pirámide Box",
      handle: "royal-selection-piramide-box",
      category: "CIGAR",
      country: "🇩🇴 Dominican",
      composition: "🍃 Connecticut Broadleaf",
      type: "🚬 Pirámide (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Tapered Pirámide shape allowing concentrated flavor delivery. Creamy cedar, caramel, and baking spices.",
      priceRange: { minVariantPrice: { amount: "215.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Royal Selection Pirámide Box" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar9", title: "700ml Bottle", price: { amount: "215.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-10",
      title: "Master Blender Reserve Lancero",
      handle: "master-blender-reserve-lancero",
      category: "CIGAR",
      country: "🇳🇮 Nicaragua",
      composition: "🍃 Rare Jalapa Valley Leaf",
      type: "🚬 Lancero (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Slim 7.5x38 Lancero format for wrapper flavor intensity. Complex cinnamon, leather, and dark berry note.",
      priceRange: { minVariantPrice: { amount: "250.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-cigar.jpg", altText: "Master Blender Reserve Lancero" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar10", title: "700ml Bottle", price: { amount: "250.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-11",
      title: "Gran Reserva Vintage 2015",
      handle: "gran-reserva-vintage-2015",
      category: "CIGAR",
      country: "🇭🇳 Honduras",
      composition: "🍃 Jamastran Valley Leaf",
      type: "🚬 Gran Reserva (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "95" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 10 years in cedar vault rooms. Smooth oaky smoke with toasted walnuts, cocoa bean, and sweet spice.",
      priceRange: { minVariantPrice: { amount: "290.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Gran Reserva Vintage 2015" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar11", title: "700ml Bottle", price: { amount: "290.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-12",
      title: "Gold Band Belicoso Selection",
      handle: "gold-band-belicoso-selection",
      category: "CIGAR",
      country: "🇩🇴 Dominican",
      composition: "🍃 Dominican Olor Leaf",
      type: "🚬 Belicoso (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Classic Belicoso shape with golden foil band. Smooth almond, honeyed toast, and subtle floral cedar.",
      priceRange: { minVariantPrice: { amount: "190.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-cigar.jpg", altText: "Gold Band Belicoso Selection" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar12", title: "700ml Bottle", price: { amount: "190.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-13",
      title: "Dominican Sungrown Robusto",
      handle: "dominican-sungrown-robusto",
      category: "CIGAR",
      country: "🇩🇴 Dominican",
      composition: "🍃 Chateau Sungrown Leaf",
      type: "🚬 Sungrown Robusto (10-Pack)",
      badges: [{ label: "AFICIONADO", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Sun-drenched Dominican wrapper. Rich cinnamon, white pepper, cedarwood, and natural tobacco sweetness.",
      priceRange: { minVariantPrice: { amount: "205.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Dominican Sungrown Robusto" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar13", title: "700ml Bottle", price: { amount: "205.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-14",
      title: "Emperor Mahogany Humidor",
      handle: "emperor-mahogany-humidor",
      category: "CIGAR",
      country: "🇳🇮 Nicaragua",
      composition: "🍃 Ligero Long-Filler Leaf",
      type: "🚬 Humidor Set (Box of 15)",
      badges: [{ label: "AFICIONADO", score: "99" }, { label: "AGED", score: "RESERVE" }],
      description: "Prestige 15-cigar humidor collection crafted in solid mahogany. Premium full-bodied Nicaraguan reserve.",
      priceRange: { minVariantPrice: { amount: "450.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Emperor Mahogany Humidor" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar14", title: "700ml Bottle", price: { amount: "450.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-15",
      title: "Small Batch Vintage 10-Pack",
      handle: "small-batch-vintage-10-pack",
      category: "CIGAR",
      country: "🇨🇺 Cuba",
      composition: "🍃 Hand-Selected Cuban Leaf",
      type: "🚬 Vintage Small Batch",
      badges: [{ label: "AFICIONADO", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Rare small batch release hand-rolled by master torcedores. Delicate spice, roasted espresso, and velvet finish.",
      priceRange: { minVariantPrice: { amount: "280.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-cigar.jpg", altText: "Small Batch Vintage 10-Pack" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar15", title: "700ml Bottle", price: { amount: "280.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-cigar-16",
      title: "Grand Aniversario Double Corona",
      handle: "grand-aniversario-double-corona",
      category: "CIGAR",
      country: "🇩🇴 Dominican Republic",
      composition: "🍃 Aged Habano 2000 Wrapper",
      type: "🚬 Double Corona (Box of 10)",
      badges: [{ label: "AFICIONADO", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 10-year Dominican binder and filler with silky Habano wrapper. Rich leather, cedar, cinnamon, and cream.",
      priceRange: { minVariantPrice: { amount: "320.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cigar-reserve.jpg", altText: "Grand Aniversario Double Corona" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/cigar16", title: "700ml Bottle", price: { amount: "320.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  }
];

const TEQUILA_PRODUCTS = [
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-1",
      title: "Clase Azul Reposado Agave",
      handle: "clase-azul-reposado-agave",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 100% Blue Weber Agave",
      type: "🥃 Reposado Tequila",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Masterfully aged in American oak barrels for 8 months. Iconic hand-painted ceramic decanter with vanilla, hazelnut, and agave nectar notes.",
      priceRange: { minVariantPrice: { amount: "195.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-clase-azul-reposado.jpg", altText: "Clase Azul Reposado Agave" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila1", title: "700ml Bottle", price: { amount: "195.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-2",
      title: "Don Julio 1942 Extra Añejo",
      handle: "don-julio-1942-extra-anejo",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Highland Blue Agave",
      type: "🥃 Extra Añejo Tequila",
      badges: [{ label: "WE", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "Handcrafted in small batches and aged for a minimum of two and a half years in charred American white oak casks. Rich caramel and chocolate finish.",
      priceRange: { minVariantPrice: { amount: "220.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-don-julio-1942.jpg", altText: "Don Julio 1942 Extra Añejo" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila2", title: "700ml Bottle", price: { amount: "220.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-3",
      title: "Fortaleza Blanco Still Strength",
      handle: "fortaleza-blanco-still-strength",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Stone Tahona Crushed Agave",
      type: "🍸 Still Strength Blanco",
      badges: [{ label: "RP", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Unfiltered 46% ABV artisanal blanco with explosive citrus, green olive, earthy minerals, and sweet slow-roasted agave profile.",
      priceRange: { minVariantPrice: { amount: "95.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-fortaleza-blanco.jpg", altText: "Fortaleza Blanco Still Strength" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila3", title: "700ml Bottle", price: { amount: "95.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-4",
      title: "Herradura Selección Suprema",
      handle: "herradura-seleccion-suprema",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 100% Blue Agave, Oak Cask",
      type: "🥃 Ultra Extra Añejo",
      badges: [{ label: "VIVINO", score: "5.0" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged for 49 months in American white oak barrels. Mahogany color with deep aromas of dried fruit, cinnamon, rose petals, and spicy cedar.",
      priceRange: { minVariantPrice: { amount: "380.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-herradura-suprema.jpg", altText: "Herradura Selección Suprema" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila4", title: "700ml Bottle", price: { amount: "380.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-5",
      title: "Casamigos Añejo Highland Reserve",
      handle: "casamigos-anejo-highland-reserve",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Slow-Cooked Blue Agave",
      type: "🥃 Highland Añejo",
      badges: [{ label: "WE", score: "92" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 14 months in premium oak barrels. Soft caramel, toasted vanilla, cocoa, and subtle spice with an exceptionally velvety lingering finish.",
      priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-casamigos-anejo.jpg", altText: "Casamigos Añejo Highland Reserve" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila5", title: "700ml Bottle", price: { amount: "75.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-6",
      title: "Tequila Ocho Single Estate Plata",
      handle: "tequila-ocho-single-estate-plata",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Single Terroir Agave",
      type: "🍸 Single Estate Plata",
      badges: [{ label: "RP", score: "94" }, { label: "AGED", score: "RESERVE" }],
      description: "Harvested from a single highland field estate. Unmatched purity, white pepper, fresh lime zest, and sweet roasted agave heart notes.",
      priceRange: { minVariantPrice: { amount: "62.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-ocho-plata.jpg", altText: "Tequila Ocho Single Estate Plata" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila6", title: "700ml Bottle", price: { amount: "62.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-7",
      title: "Gran Patrón Piedra Extra Añejo",
      handle: "gran-patron-piedra-extra-anejo",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Tahona-Crafted Agave",
      type: "🥃 Prestige Decanter Tequila",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged for more than three years in new American and French oak barrels. Presented in an elegant crystal decanter with toasted oak and vanilla notes.",
      priceRange: { minVariantPrice: { amount: "420.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-gran-patron-piedra.jpg", altText: "Gran Patrón Piedra Extra Añejo" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila7", title: "700ml Bottle", price: { amount: "420.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-8",
      title: "El Tesoro Paradiso Cognac Cask",
      handle: "el-tesoro-paradiso-cognac-cask",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 100% Estate Agave",
      type: "🥃 Cognac Cask Añejo",
      badges: [{ label: "WE", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Created in collaboration with Alain Royer of A. de Fussigny Cognac. Aged 5 years in French oak ex-cognac casks for complex stone fruit finish.",
      priceRange: { minVariantPrice: { amount: "185.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-el-tesoro-paradiso.jpg", altText: "El Tesoro Paradiso Cognac Cask" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila8", title: "700ml Bottle", price: { amount: "185.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-9",
      title: "Don José Luis Reserva Especial",
      handle: "don-jose-luis-reserva-especial",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 100% Blue Weber Agave",
      type: "🥃 Extra Añejo Crystal",
      badges: [{ label: "VIVINO", score: "4.9" }, { label: "AGED", score: "RESERVE" }],
      description: "Artisanal luxury decanter tequila aged 36 months in charred white oak casks with hints of golden honey, toasted almond, and smoked vanilla.",
      priceRange: { minVariantPrice: { amount: "260.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/cat-tequila.jpg", altText: "Don José Luis Reserva Especial" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila9", title: "700ml Bottle", price: { amount: "260.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-10",
      title: "1800 Cristalino Añejo Diamond",
      handle: "1800-cristalino-anejo-diamond",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Port Cask Finished Agave",
      type: "🍸 Cristalino Añejo",
      badges: [{ label: "WE", score: "93" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged in French and American oak, finished in port wine casks, then filtered to crystal clarity. Notes of roasted nuts and silky dark berries.",
      priceRange: { minVariantPrice: { amount: "80.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-1800-cristalino.jpg", altText: "1800 Cristalino Añejo Diamond" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila10", title: "700ml Bottle", price: { amount: "80.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-11",
      title: "Siete Leguas D'Antaño Extra Añejo",
      handle: "siete-leguas-d-antano-extra-anejo",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Mule-Driven Tahona Agave",
      type: "🥃 Rare Extra Añejo",
      badges: [{ label: "RP", score: "98" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 5 years in historic cellars. Rich amber tone with aromas of dried fig, pipe tobacco, toasted oak, dark chocolate, and candied orange peel.",
      priceRange: { minVariantPrice: { amount: "295.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-siete-leguas.jpg", altText: "Siete Leguas D'Antaño Extra Añejo" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila11", title: "700ml Bottle", price: { amount: "295.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-12",
      title: "Clase Azul Gold Edition",
      handle: "clase-azul-gold-edition",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Plata & 8-Year Extra Añejo",
      type: "🥃 Joven Prestige Decanter",
      badges: [{ label: "VIVINO", score: "5.0" }, { label: "AGED", score: "RESERVE" }],
      description: "An exceptional joven blend combining Clase Azul Plata with special 8-year extra añejo aged in French oak casks and finished in sherry barrels.",
      priceRange: { minVariantPrice: { amount: "360.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-clase-azul-gold.jpg", altText: "Clase Azul Gold Edition" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila12", title: "700ml Bottle", price: { amount: "360.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-13",
      title: "Código 1530 Origen Extra Añejo",
      handle: "codigo-1530-origen-extra-anejo",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Napa Cabernet French White Oak",
      type: "🥃 6-Year Reserve Añejo",
      badges: [{ label: "WE", score: "96" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 6 years in Napa Valley Cabernet French White Oak barrels. Complex notes of dried fruit, cinnamon, and caramel with exceptional smoothness.",
      priceRange: { minVariantPrice: { amount: "330.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-codigo-1530.jpg", altText: "Código 1530 Origen Extra Añejo" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila13", title: "700ml Bottle", price: { amount: "330.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-14",
      title: "Rey Sol Extra Añejo Handcrafted",
      handle: "rey-sol-extra-anejo-handcrafted",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Highland Blue Weber Agave",
      type: "🥃 Sun Decanter Extra Añejo",
      badges: [{ label: "RP", score: "97" }, { label: "AGED", score: "RESERVE" }],
      description: "Aged 6 years in French oak barrels. Housed in a sun-shaped bottle designed by artist Sergio Bustamante with vanilla, oak, and warm cinnamon notes.",
      priceRange: { minVariantPrice: { amount: "310.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-don-jose-luis-decanter.jpg", altText: "Rey Sol Extra Añejo Handcrafted" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila14", title: "700ml Bottle", price: { amount: "310.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-15",
      title: "Montelobos Mezcal Artesanal Tobalá",
      handle: "montelobos-mezcal-artesanal-tobala",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Wild Agave Potatorum (Tobalá)",
      type: "🍸 Artisanal Smoky Mezcal",
      badges: [{ label: "VIVINO", score: "4.8" }, { label: "AGED", score: "RESERVE" }],
      description: "Distilled from rare wild Tobalá agave in copper pot stills. Subtle smoke with aromas of roasted macadamia, green pepper, nutmeg, and damp earth.",
      priceRange: { minVariantPrice: { amount: "125.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-siete-leguas.jpg", altText: "Montelobos Mezcal Artesanal Tobalá" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila15", title: "700ml Bottle", price: { amount: "125.00", currencyCode: "USD" }, availableForSale: true } }] }
    }
  },
  {
    node: {
      id: "gid://shopify/Product/custom-tequila-16",
      title: "Del Maguey Single Village Pechuga",
      handle: "del-maguey-single-village-pechuga",
      category: "TEQUILA",
      country: "🇲🇽 Mexico",
      composition: "🌵 Santa Catarina Minas Agave",
      type: "🍸 Traditional Village Mezcal",
      badges: [{ label: "WE", score: "99" }, { label: "AGED", score: "RESERVE" }],
      description: "Third distillation with wild mountain apples, plums, plantains, almonds, and raw chicken breast suspended in the still. Pure artisanal masterpiece.",
      priceRange: { minVariantPrice: { amount: "240.00", currencyCode: "USD" } },
      images: { edges: [{ node: { url: "assets/tequila-fortaleza-blanco.jpg", altText: "Del Maguey Single Village Pechuga" } }] },
      variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/tequila16", title: "700ml Bottle", price: { amount: "240.00", currencyCode: "USD" }, availableForSale: true } }] }
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
  return [...WHISKEY_PRODUCTS, ...RUM_PRODUCTS, ...BEER_PRODUCTS, ...WINE_PRODUCTS, ...VODKA_PRODUCTS, ...GIN_PRODUCTS, ...TEQUILA_PRODUCTS, ...CIGAR_PRODUCTS, ...shopifyProducts];
}

async function fetchProductByHandle(handle) {
  const localMatch = [...WHISKEY_PRODUCTS, ...RUM_PRODUCTS, ...BEER_PRODUCTS, ...WINE_PRODUCTS, ...VODKA_PRODUCTS, ...GIN_PRODUCTS, ...TEQUILA_PRODUCTS, ...CIGAR_PRODUCTS].find((p) => p.node.handle === handle);
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
    ...TEQUILA_PRODUCTS,
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

// Reusable Wine Category Product Grid Card Renderer (Light Cream Theme)
function createWineProductCardHTML(p, priceStr, image, ratingBadge, customTags) {
  const wineTitlesMap = {
    "domaines-des-etoiles-pinot-noir": "Domaines des Étoiles Pinot Noir<br>2021",
    "chateau-margaux-cabernet-sauvignon": "Château Margaux Cabernet<br>Sauvignon 2016",
    "veuve-clicquot-la-grande-dame": "Veuve Clicquot La Grande Dame",
    "chateau-miraval-rose": "Château Miraval Côtes Rosé",
    "domaine-de-la-mer-chardonnay": "Domaine de la Mer Chardonnay",
    "sun-drenched-marble-chardonnay": "Sun-Drenched Marble Chardonnay",
    "mahogany-table-cabernet-2018": "Mahogany Table Cabernet 2018",
    "textured-label-pinot-noir": "Textured Label Pinot Noir",
    "gold-foil-vintage-champagne-2012": "Gold Foil Vintage Champagne 2012",
    "silver-bucket-provence-rose": "Silver Bucket Provence Rosé",
    "grand-cru-bordeaux-reserve-2015": "Grand Cru Bordeaux Reserve 2015",
    "tuscan-reserve-sangiovese-2019": "Tuscan Reserve Sangiovese 2019",
    "barossa-valley-shiraz-reserve": "Barossa Valley Shiraz Reserve",
    "mendoza-malbec-gran-reserva": "Mendoza Malbec Gran Reserva",
    "sancerre-blanc-les-monts-2022": "Sancerre Blanc Les Monts 2022",
    "chateau-prestige-pauillac-2018": "Château Prestige Pauillac 2018"
  };

  const wineTagsMap = {
    "domaines-des-etoiles-pinot-noir": ["RED", "WINE", "UNITED STATES", "WILLAMETTE VALLEY"],
    "chateau-margaux-cabernet-sauvignon": ["RED WINE", "(GRAND VIN)", "FRANCE", "BORDEAUX"],
    "veuve-clicquot-la-grande-dame": ["SPARKLING", "CHAMPAGNE", "FRANCE", "CHAMPAGNE"],
    "chateau-miraval-rose": ["ROSÉ WINE", "WINE", "FRANCE", "PROVENCE"],
    "domaine-de-la-mer-chardonnay": ["WHITE WINE", "RESERVE", "FRANCE", "MEDITERRANEAN"],
    "sun-drenched-marble-chardonnay": ["WHITE WINE", "NAPA VALLEY", "UNITED STATES", "CHARDONNAY"],
    "mahogany-table-cabernet-2018": ["RED WINE", "OAKVILLE", "UNITED STATES", "CABERNET"],
    "textured-label-pinot-noir": ["RED WINE", "BURGUNDY", "FRANCE", "PINOT NOIR"],
    "gold-foil-vintage-champagne-2012": ["PRESTIGE", "CHAMPAGNE", "FRANCE", "VINTAGE"],
    "silver-bucket-provence-rose": ["ROSÉ WINE", "PRESTIGE", "FRANCE", "PROVENCE"],
    "grand-cru-bordeaux-reserve-2015": ["RED WINE", "BORDEAUX", "FRANCE", "GRAND CRU"],
    "tuscan-reserve-sangiovese-2019": ["RED WINE", "BRUNELLO", "ITALY", "SANGIOVESE"],
    "barossa-valley-shiraz-reserve": ["RED WINE", "BAROSSA VALLEY", "AUSTRALIA", "SHIRAZ"],
    "mendoza-malbec-gran-reserva": ["RED WINE", "UCO VALLEY", "ARGENTINA", "MALBEC"],
    "sancerre-blanc-les-monts-2022": ["WHITE WINE", "LOIRE VALLEY", "FRANCE", "SANCERRE"],
    "chateau-prestige-pauillac-2018": ["RED WINE", "BORDEAUX", "FRANCE", "PAUILLAC"]
  };

  const titleHtml = wineTitlesMap[p.handle] || p.title;
  const displayedTags = customTags || wineTagsMap[p.handle] || [p.category];

  // Determine if transparent bottle or lifestyle background image is used
  const isTransparentBottle = 
    p.handle === "domaines-des-etoiles-pinot-noir" || 
    p.handle === "chateau-margaux-cabernet-sauvignon" ||
    p.handle === "tuscan-reserve-sangiovese-2019" ||
    p.handle === "barossa-valley-shiraz-reserve" ||
    p.handle === "mendoza-malbec-gran-reserva";

  return `
    <article class="product-grid-card wine-card">
      
      <!-- Backdrop decorator for lifestyle photos -->
      ${!isTransparentBottle ? `<div class="wine-decor-backdrop"></div>` : ""}

      <!-- Top Arched Image Container -->
      <div class="product-card-arch wine-card-arch">
        
        <!-- Base decorator for transparent bottles -->
        ${isTransparentBottle ? `<div class="wine-decor-base"></div>` : ""}

        <a href="product.html?handle=${p.handle}" class="h-full w-full flex items-center justify-center relative z-10${isTransparentBottle ? ' wine-card-link-multiply' : ''}">
          ${image ? `
            <img
              src="${image.url}"
              alt="${image.altText ?? p.title}"
              class="wine-card-img${!isTransparentBottle ? ' wine-card-img-lifestyle' : ''}"
              loading="lazy"
            >
          ` : `
            <div class="flex h-full items-center justify-center text-xs text-[#78716c]">
              No image
            </div>
          `}
        </a>

        <!-- Floating Wishlist Heart Button -->
        <button
          type="button"
          onclick="handleAddToCart('${p.handle}')"
          class="product-card-heart-btn wine-card-heart-btn"
          title="Add to Cart"
          aria-label="Add to cart"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <!-- Middle Content: Centered Serif Title & Soft Lavender Pill Badges -->
      <div class="flex flex-col items-center text-center relative z-10">
        <a href="product.html?handle=${p.handle}" class="hover:opacity-80 transition-opacity">
          <h3 class="product-card-title wine-card-title">
            ${titleHtml}
          </h3>
        </a>

        <!-- Soft Lavender Pills -->
        <div class="flex flex-wrap items-center justify-center gap-4 mt-2 mb-3">
          ${displayedTags.map(tag => `
            <span class="product-card-pill wine-card-pill">
              ${tag}
            </span>
          `).join("")}
        </div>
      </div>

      <!-- Bottom Bar: MRP Price & Dark Rating Badge Pill -->
      <div class="product-card-footer wine-card-footer">
        <div class="flex items-baseline">
          <span class="product-card-mrp-label wine-card-mrp-label">MRP</span>
          <span class="product-card-mrp-price wine-card-mrp-price">
            ${priceStr}
          </span>
        </div>

        <div class="product-card-rating-badge wine-card-rating-badge">
          ${ratingBadge}
        </div>
      </div>

    </article>
  `;
}

// Reusable Exact Reference Product Item Row Renderer (Dark Luxury Website Theme)
// Reusable Product Grid Card Renderer (Exact Match to Reference Image)
function createProductCardHTML(product) {
  const p = product.node;
  const priceStr = formatMoney(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode);
  const image = p.images.edges[0]?.node;

  // Clean raw strings from emoji characters
  const cleanCountry = (p.country || "").replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|🏴󠁧󠁢󠁳󠁣󠁴󠁿/gu, "").trim();
  const cleanType = (p.type || "").replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
  
  // Rating badge (e.g. 4.8 VIVINO)
  const ratingBadge = p.badges && p.badges[0] ? `${p.badges[0].score} ${p.badges[0].label}` : "4.8 VIVINO";

  // Build pill tags
  const tags = [];
  if (cleanType) {
    cleanType.split(" ").forEach(t => {
      const clean = t.replace(/[^a-zA-Z]/g, "").toUpperCase();
      if (clean && clean.length > 1 && !tags.includes(clean)) tags.push(clean);
    });
  } else {
    tags.push(p.category);
  }

  if (cleanCountry) {
    cleanCountry.replace(/[()]/g, "").split(" ").forEach(c => {
      const clean = c.replace(/[^a-zA-Z]/g, "").toUpperCase();
      if (clean && clean.length > 2 && !tags.includes(clean)) tags.push(clean);
    });
  }

  const displayedTags = tags.slice(0, 4);

  // Return wine-styled card for all categories to maintain consistency
  return createWineProductCardHTML(p, priceStr, image, ratingBadge, displayedTags);
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
      categoryCards.forEach((c) => {
        if (categoryKey && c.getAttribute("data-category-card") === categoryKey) {
          c.classList.add("active-card");
        } else {
          c.classList.remove("active-card");
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
      } else if (categoryKey === "TEQUILA") {
        updateBreadcrumb(categoryLabel || "Tequila");
        if (updateUrl) history.pushState({ category: "TEQUILA" }, "", "#tequila");
        renderProductList(TEQUILA_PRODUCTS);
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

    let activeCategory = "WHISKEY";

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
    console.error("Failed to bind category cards:", error);
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
    TEQUILA: {
      title: "Tequila & Mezcal Collection",
      subtitle: "Handcrafted 100% blue agave highland tequilas and artisanal smoky mezcals aged in charred white oak.",
      products: TEQUILA_PRODUCTS
    },
    CIGAR: {
      title: "Artisanal Cigar Collection",
      subtitle: "Hand-rolled Nicaraguan long-filler cigars presented in engraved solid mahogany humidor boxes.",
      products: CIGAR_PRODUCTS
    }
  };

  let currentCategoryProducts = [];

  const filterAndRenderProducts = (filteredList) => {
    if (!productsGrid) return;
    if (productsLoading) productsLoading.classList.add("hidden");

    if (!filteredList || filteredList.length === 0) {
      productsGrid.classList.add("hidden");
      if (productsEmpty) {
        productsEmpty.classList.remove("hidden");
        const emptyTitle = document.getElementById("products-empty-title");
        const emptyDesc = document.getElementById("products-empty-desc");
        if (emptyTitle) emptyTitle.textContent = "No Products Found";
        if (emptyDesc) emptyDesc.textContent = "No items match your selected price filter. Try selecting another filter option.";
      }
      return;
    }

    productsEmpty?.classList.add("hidden");
    productsGrid.classList.remove("hidden");
    productsGrid.innerHTML = filteredList.map((product) => createProductCardHTML(product)).join("");
  };

  const renderCategory = (catKey, updateUrl = false) => {
    const key = (catKey || "WHISKEY").toUpperCase();
    const meta = CATEGORY_META[key] || CATEGORY_META.WHISKEY;

    // Ensure category cards grid (category pile) is hidden on category page
    const categoryCardsGrid = document.getElementById("category-cards-grid");
    if (categoryCardsGrid) {
      categoryCardsGrid.style.display = "none";
    }

    // Update Title, Subtitle, Breadcrumbs, Page Title
    document.title = `${meta.title} — Whiskey Barrel`;
    if (heroTitle) heroTitle.textContent = meta.title;
    if (heroSubtitle) heroSubtitle.textContent = meta.subtitle;
    if (breadcrumbCategoryEl) {
      breadcrumbCategoryEl.textContent = key.charAt(0) + key.slice(1).toLowerCase();
    }

    if (updateUrl) {
      const url = new URL(window.location);
      url.searchParams.set("category", key);
      history.pushState({ category: key }, "", url);
    }

    currentCategoryProducts = meta.products || [];
    filterAndRenderProducts(currentCategoryProducts);
  };

  // Bind Category Page Filter Bar options
  const staffPickBtn = document.getElementById("filter-staff-pick");
  const newArrivalsBtn = document.getElementById("filter-new-arrivals");
  const onSaleBtn = document.getElementById("filter-on-sale");
  const priceFilterBtn = document.getElementById("price-filter-btn");
  const priceDropdown = document.getElementById("price-dropdown");
  const priceChevron = document.getElementById("price-chevron");
  const priceFilterLabel = document.getElementById("price-filter-label");
  const priceItems = document.querySelectorAll("#price-dropdown .price-dropdown-item");

  const applyPriceRangeFilter = (range, labelText) => {
    // Update button text & active item class
    if (priceFilterLabel) {
      priceFilterLabel.textContent = !range || range === "all" ? "PRICE RANGE" : (labelText || range.toUpperCase());
    }

    priceItems.forEach((item) => {
      const itemRange = item.getAttribute("data-price-range");
      if (itemRange === range) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    let filtered = currentCategoryProducts;
    if (range === "under-50") {
      filtered = currentCategoryProducts.filter((p) => parseFloat(p.node?.priceRange?.minVariantPrice?.amount || 0) < 50);
    } else if (range === "50-100") {
      filtered = currentCategoryProducts.filter((p) => {
        const amt = parseFloat(p.node?.priceRange?.minVariantPrice?.amount || 0);
        return amt >= 50 && amt <= 100;
      });
    } else if (range === "100-200") {
      filtered = currentCategoryProducts.filter((p) => {
        const amt = parseFloat(p.node?.priceRange?.minVariantPrice?.amount || 0);
        return amt >= 100 && amt <= 200;
      });
    } else if (range === "200-500") {
      filtered = currentCategoryProducts.filter((p) => {
        const amt = parseFloat(p.node?.priceRange?.minVariantPrice?.amount || 0);
        return amt >= 200 && amt <= 500;
      });
    } else if (range === "above-500") {
      filtered = currentCategoryProducts.filter((p) => parseFloat(p.node?.priceRange?.minVariantPrice?.amount || 0) > 500);
    }

    filterAndRenderProducts(filtered);
  };

  priceItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const range = item.getAttribute("data-price-range");
      const labelText = item.textContent.trim();
      priceDropdown?.classList.add("hidden");
      if (priceChevron) priceChevron.textContent = "▼";
      applyPriceRangeFilter(range, labelText);
    });
  });

  if (staffPickBtn) {
    staffPickBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const filtered = currentCategoryProducts.filter((p) => p.node?.badges?.some((b) => b.label === "VIVINO" || b.label === "WE" || parseFloat(b.score) >= 90));
      filterAndRenderProducts(filtered.length ? filtered : currentCategoryProducts);
    });
  }

  if (newArrivalsBtn) {
    newArrivalsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      filterAndRenderProducts([...currentCategoryProducts].reverse());
    });
  }

  if (onSaleBtn) {
    onSaleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const filtered = currentCategoryProducts.filter((p) => p.node?.badges?.some((b) => b.label === "AGED" || b.label === "LIMITED" || b.label === "RESERVE"));
      filterAndRenderProducts(filtered.length ? filtered : currentCategoryProducts);
    });
  }

  // Get initial category from query parameter or hash
  const getInitialCategory = () => {
    const params = new URLSearchParams(window.location.search);
    let cat = params.get("category");
    if (!cat) {
      cat = window.location.hash.replace("#", "");
    }
    return cat ? cat.toUpperCase() : "WHISKEY";
  };

  const applyInitialFiltersFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const initialPrice = params.get("price");
    const initialFilter = params.get("filter");

    if (initialPrice) {
      const matchingItem = Array.from(priceItems).find((i) => i.getAttribute("data-price-range") === initialPrice);
      const label = matchingItem ? matchingItem.textContent.trim() : (initialPrice === "all" ? "ALL PRICES" : initialPrice.toUpperCase());
      applyPriceRangeFilter(initialPrice, label);
    } else if (initialFilter === "staff-pick") {
      staffPickBtn?.click();
    } else if (initialFilter === "new-arrivals") {
      newArrivalsBtn?.click();
    } else if (initialFilter === "on-sale") {
      onSaleBtn?.click();
    }
  };

  renderCategory(getInitialCategory(), false);
  applyInitialFiltersFromUrl();

  window.addEventListener("popstate", () => {
    renderCategory(getInitialCategory(), false);
    applyInitialFiltersFromUrl();
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

// Price Range filter dropdown toggle
function initPriceFilterDropdown() {
  const priceFilterBtn = document.getElementById("price-filter-btn");
  const priceDropdown = document.getElementById("price-dropdown");
  const priceChevron = document.getElementById("price-chevron");

  if (priceFilterBtn && priceDropdown) {
    priceFilterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = priceDropdown.classList.contains("hidden");
      if (isHidden) {
        priceDropdown.classList.remove("hidden");
        if (priceChevron) {
          priceChevron.textContent = "▲";
        }
      } else {
        priceDropdown.classList.add("hidden");
        if (priceChevron) {
          priceChevron.textContent = "▼";
        }
      }
    });

    // Close the dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!priceDropdown.classList.contains("hidden") && !priceDropdown.contains(e.target) && !priceFilterBtn.contains(e.target)) {
        priceDropdown.classList.add("hidden");
        if (priceChevron) {
          priceChevron.textContent = "▼";
        }
      }
    });
  }
}

// Binds redirect logic to filter bar options on index/home page
function initFilterRedirections() {
  const isCategoryPage = window.location.pathname.includes("category.html") || window.location.pathname.includes("/category");
  if (isCategoryPage) return; // category page manages its own interactive category products filtering

  const staffPickBtn = document.getElementById("filter-staff-pick");
  const newArrivalsBtn = document.getElementById("filter-new-arrivals");
  const onSaleBtn = document.getElementById("filter-on-sale");
  const dropdownItems = document.querySelectorAll(".price-dropdown-item");

  if (staffPickBtn) {
    staffPickBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "category.html?filter=staff-pick";
    });
  }

  if (newArrivalsBtn) {
    newArrivalsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "category.html?filter=new-arrivals";
    });
  }

  if (onSaleBtn) {
    onSaleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "category.html?filter=on-sale";
    });
  }

  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const range = item.getAttribute("data-price-range") || "all";
      window.location.href = `category.html?price=${range}`;
    });
  });
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Cart
  Cart.init();

  // 2. Initialize Reveal Animations
  initRevealAnimations();

  // 3. Initialize About Toggle
  initAboutToggle();

  // 3b. Initialize Price Filter Dropdown
  initPriceFilterDropdown();

  // 3c. Initialize Filter Redirections
  initFilterRedirections();

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
