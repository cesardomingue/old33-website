// Server-side canonical price catalog — mirrors cart.js / menu.html exactly.
// Update this whenever you change prices on the menu.

export const TAX_RATE = 0.123; // Elkton VA meals tax
export const MEMBER_DISCOUNT = 0.10; // 33 Club: 10% off

// Base item prices (by exact item name)
export const BASE_PRICES: Record<string, number> = {
  // Burgers
  'Classic Cheeseburger': 10.90,
  'Rodeo Burger': 13.00,
  'Tex Mex': 13.00,
  'Shenandoah': 13.00,
  'Route 33': 14.00,
  'Rockingham': 13.00,
  'The Valley': 14.00,
  'Vegan Burger': 13.00,
  'The Meat Lover': 15.00,
  'Country Road': 13.00,
  'Hawaiian Burger': 13.00,
  'Brisket Burger': 15.00,
  // Build Your Own
  'MYOB Beef Patty': 7.50,
  'MYOB Chicken Patty': 7.50,
  'MYOB Veggie Patty': 7.50,
  // Wings
  'Traditional Wings (Small 6pc)': 9.30,
  'Traditional Wings (Large 12pc)': 15.30,
  'Boneless Wings (Small)': 9.30,
  'Boneless Wings (Large)': 15.30,
  'Kids Four Piece Boneless Wings': 7.85,
  // Chicken / Baskets
  'Chicken Tender Basket': 10.40,
  'Loaded Cheeseburger Fries': 10.40,
  'Fried Shrimp': 10.20,
  'Fried Mozzarella Sticks': 10.20,
  'Basket of Onion Rings': 7.65,
  'Basket of French Fries': 7.10,
  'Basket of Curly Fries': 7.10,
  'Basket of Sweet Potato Fries': 7.10,
  'Copper Head Jalapeño Bites': 9.85,
  'Fried Pickle Spears': 7.00,
  'Soft Baked Pretzel': 8.45,
  'Chili Bean Soup': 7.25,
  'Hush Puppies': 7.25,
  // Wraps
  'Buffalo Chicken Wrap': 10.50,
  'Grilled Chicken Wrap': 10.50,
  // Salads
  'Old 33 House Salad': 11.00,
  'Old 33 House Salad — Ranch': 11.00,
  'Old 33 House Salad — Bleu Cheese': 11.00,
  'Old 33 House Salad — Honey Mustard': 11.00,
  'Old 33 House Salad — Italian': 11.00,
  'Old 33 House Salad — Thousand Island': 11.00,
  'Old 33 House Salad — Raspberry Vinaigrette': 11.00,
  'Caesar Salad': 9.90,
  // Sides / Fries
  'Large Fries Basket — Regular French Fries': 7.99,
  'Large Fries Basket — Seasoned Curly Fries': 7.99,
  'Large Fries Basket — Sweet Potato Waffle Fries': 7.99,
  'Side of French Fries': 4.90,
  'Side of Curly Fries': 4.90,
  'Side of Sweet Potato Fries': 4.90,
  'Side of Cheese Fries': 6.40,
  'Side of Bacon Cheese Fries': 7.40,
  'Side Salad': 5.00,
  'Side of Mac & Cheese': 4.25,
  'Side of Onion Rings': 4.95,
  'Side of Coleslaw': 2.90,
  'Side of Potato Salad': 3.00,
  // Smoked
  'Smoked Brisket Platter': 15.00,
  // Kids
  'Kids Hot Dog': 8.00,
  'Kids Three Piece Chicken Tenders': 8.00,
  'Kids Grilled Cheese': 7.85,
  'Kids Mac & Cheese': 7.85,
  // Desserts
  'Baked Apple Tart': 8.50,
  'Blueberry Cobbler Cheesecake': 8.00,
  'Chocolate Lava Cake': 8.50,
  'Banana Milkshake': 7.25,
  'Chocolate Milkshake': 7.25,
  'Strawberry Milkshake': 7.25,
  'Vanilla Milkshake': 7.25,
  'Nutella Milkshake': 7.25,
  'Scoop of Ice Cream': 1.50,
  'Fruit Cup': 1.50,
  // Drinks
  'Soft Drink': 3.35,
  'Hot Coffee': 2.50,
  'Chocolate Milk': 2.50,
  'Milk': 2.00,
  'Juice': 3.25,
};

// Modifier prices (bun upgrades, paid sides, toppings, extras)
// These match cart.js exactly
export const MOD_PRICES: Record<string, number> = {
  // Buns — only Gluten Free costs extra
  'Gluten Free': 2.00,
  // Paid sides
  'Hush Puppies': 1.50,
  'Fried Pickles as Side': 2.00,
  'Cheese Fries': 1.00,
  'Bacon Cheese Fries': 2.00,
  'Loaded Fries': 3.00,
  // Veggie toppings
  'Lettuce': 0.40,
  'Tomato': 0.40,
  'Raw Onion': 0.40,
  'Grilled Onions': 1.20,
  'Onion Straws': 1.20,
  'Grilled Mushroom': 0.70,
  'Pickles': 0.40,
  'Jalapeno': 0.70,
  'Avocado': 1.20,
  'Grilled Pineapple': 0.70,
  'Pickled Red Onions': 0.70,
  'Spinach': 0.70,
  'Cucumber': 0.70,
  'Coleslaw': 1.20,
  // Cheese
  'American Cheese': 1.20,
  'Cheddar Cheese': 1.20,
  'Pepper Jack': 1.20,
  'Blue Cheese': 1.20,
  'Swiss Cheese': 1.20,
  // Proteins & specials
  'Bacon': 1.20,
  'Mac & Cheese on Burger': 1.20,
  'Chili on Burger': 1.20,
  'Fried Egg': 2.30,
  'Chorizo': 2.30,
  'Copperhead Bites on Burger': 5.50,
  'Beef Patty': 4.50,
  'Grilled Chicken': 4.50,
  'Veggie Patty': 5.50,
  'Brisket': 4.00,
  // Xtras (MYOB / wing extras)
  'Xtra Cheese': 1.00,
  'Xtra Bacon': 1.00,
  'Xtra Lettuce': 0.25,
  'Xtra Tomato': 0.25,
  'Xtra Pickles': 0.25,
  'Xtra Jalapeno': 0.50,
  'Xtra Avocado': 1.00,
  'Xtra Fried Egg': 2.00,
  'Xtra Spinach': 0.50,
  'Xtra Mushrooms': 0.25,
  'Xtra Grilled Pineapple': 0.25,
  'Xtra Mac & Cheese': 2.00,
  'Xtra Coleslaw': 2.00,
  'Xtra Beef Patty': 4.00,
  'Xtra Chorizo': 3.00,
  // Salad extras
  'Extra Pecans': 0.70,
  'Croutons': 0.50,
  'Extra Dressing': 0.50,
  'Hard Boiled Egg': 0.70,
};

export interface OrderItem {
  name: string;
  qty: number;
  bun?: string;
  side?: string;
  extras?: { name: string }[];
}

export interface PricedItem {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  mods: string[];
}

export interface CartTotals {
  items: PricedItem[];
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  isMember: boolean;
}

export function priceCart(
  rawItems: OrderItem[],
  tipAmount: number,
  isMember: boolean,
): CartTotals | { error: string } {
  const items: PricedItem[] = [];

  for (const item of rawItems) {
    const base = BASE_PRICES[item.name];
    if (base === undefined) {
      return { error: `Unknown item: "${item.name}"` };
    }
    const qty = Math.max(1, Math.floor(item.qty || 1));

    let modTotal = 0;
    const mods: string[] = [];

    // Bun upgrade
    if (item.bun && MOD_PRICES[item.bun] !== undefined) {
      modTotal += MOD_PRICES[item.bun];
      if (MOD_PRICES[item.bun] > 0) mods.push(item.bun + ' bun (+$' + MOD_PRICES[item.bun].toFixed(2) + ')');
      else mods.push(item.bun + ' bun');
    } else if (item.bun) {
      mods.push(item.bun + ' bun');
    }

    // Paid side
    if (item.side && MOD_PRICES[item.side] !== undefined) {
      modTotal += MOD_PRICES[item.side];
      if (MOD_PRICES[item.side] > 0) mods.push('Side: ' + item.side + ' (+$' + MOD_PRICES[item.side].toFixed(2) + ')');
      else mods.push('Side: ' + item.side);
    } else if (item.side) {
      mods.push('Side: ' + item.side);
    }

    // Extras / toppings
    for (const extra of item.extras || []) {
      const ep = MOD_PRICES[extra.name] ?? 0;
      modTotal += ep;
      if (ep > 0) mods.push(extra.name + ' (+$' + ep.toFixed(2) + ')');
      else mods.push(extra.name);
    }

    const unitPrice = base + modTotal;
    items.push({ name: item.name, qty, unitPrice, lineTotal: unitPrice * qty, mods });
  }

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const tip = Math.max(0, tipAmount || 0);
  const discount = isMember ? subtotal * MEMBER_DISCOUNT : 0;
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * TAX_RATE * 100) / 100;
  const total = taxable + tax + tip;

  return { items, subtotal, tax, tip, discount, total, isMember };
}
