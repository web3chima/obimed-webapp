import type { Product } from '@/payload-types'

// Product catalog from the brochure ("Our ranges of raw materials") and the website content map.
// Descriptions for the six content-map products come from that document; the rest, plus
// formulas, CAS numbers and categories, are drafts for Obimed to verify in the admin.

export type ProductSeed = Pick<
  Product,
  | 'title'
  | 'slug'
  | 'category'
  | 'availability'
  | 'sortOrder'
  | 'shortDescription'
  | 'description'
  | 'formula'
  | 'casNumber'
  | 'grade'
  | 'packaging'
  | 'origin'
> & { applications?: { industry: string; use: string }[] }

export const obimedProducts: ProductSeed[] = [
  {
    title: 'Sodium Bicarbonate',
    slug: 'sodium-bicarbonate',
    category: 'excipient',
    availability: 'available',
    sortOrder: 10,
    formula: 'NaHCO₃',
    casNumber: '144-55-8',
    grade: 'Food grade',
    packaging: '25 kg bags',
    origin: 'China',
    shortDescription:
      'Baking soda: a white crystalline powder used as a leavening agent, antacid and pH regulator.',
    description:
      'White crystalline powder (NaHCO₃) widely used as a leavening agent in baking, a natural antacid for heartburn relief, a household cleaner, deodorizer and mild abrasive. Versatile, eco-friendly and food-grade.',
    applications: [
      {
        industry: 'Food & baking',
        use: 'Leavening agent in bread, cakes and biscuits, and pH control in bakery mixes and baking powders.',
      },
      {
        industry: 'Pharmaceuticals',
        use: 'Active ingredient in antacids and effervescent tablets, and in pH-balancing formulations.',
      },
      {
        industry: 'Personal care & cleaning',
        use: 'Used in toothpaste, soaps, deodorants and household cleaners for abrasion and odor control.',
      },
      {
        industry: 'Food & agriculture',
        use: 'pH regulation in animal feed and processing stability in breakfast cereals.',
      },
    ],
  },
  {
    title: 'Dextrose Monohydrate',
    slug: 'dextrose-monohydrate',
    category: 'excipient',
    availability: 'available',
    sortOrder: 20,
    formula: 'C₆H₁₂O₆·H₂O',
    casNumber: '14431-43-7',
    packaging: '25 kg bags',
    origin: 'China',
    shortDescription:
      'Purified glucose from corn starch: mildly sweet, highly soluble and a quick source of energy.',
    description:
      'White crystalline powder (C₆H₁₂O₆·H₂O), a purified form of glucose derived from corn starch. Mildly sweet (70–75% of sucrose), highly soluble, and provides quick energy. Ideal for baking, confectionery, beverages, sports drinks, and as a sweetener or bulking agent in food production.',
    applications: [
      {
        industry: 'Baking & confectionery',
        use: 'Sweetener and bulking agent in baked goods and sweets.',
      },
      {
        industry: 'Beverages',
        use: 'Quick-energy sugar in beverages and sports drinks.',
      },
      {
        industry: 'Food production',
        use: 'Highly soluble sweetener and bulking agent across processed foods.',
      },
    ],
  },
  {
    title: 'Dextrose Anhydrous',
    slug: 'dextrose-anhydrous',
    category: 'excipient',
    availability: 'available',
    sortOrder: 30,
    formula: 'C₆H₁₂O₆',
    casNumber: '50-99-7',
    packaging: '25 kg bags',
    shortDescription:
      'Pure crystalline D-glucose without water of crystallization, for low-moisture applications.',
    description:
      'Pure, crystalline form of D-glucose (C₆H₁₂O₆) without water of crystallization. White powder with mild sweetness, high solubility and rapid energy release. Used in food, beverages, sports nutrition, pharmaceuticals, and as a sweetener or fermentable sugar where low moisture content is required.',
    applications: [
      {
        industry: 'Pharmaceuticals',
        use: 'Used where low moisture content is required.',
      },
      {
        industry: 'Food & beverages',
        use: 'Sweetener with rapid energy release.',
      },
      {
        industry: 'Sports nutrition',
        use: 'Fast-acting carbohydrate in energy and recovery products.',
      },
      {
        industry: 'Fermentation',
        use: 'Fermentable sugar for industrial processes.',
      },
    ],
  },
  {
    title: 'Xanthan Gum',
    slug: 'xanthan-gum',
    category: 'food-grade',
    availability: 'available',
    sortOrder: 40,
    casNumber: '11138-66-2',
    grade: 'Food grade',
    packaging: '25 kg bags',
    origin: 'China',
    shortDescription:
      'Thickener, stabilizer and suspending agent for foods, pharmaceuticals and personal care products.',
    description:
      'A food-grade polysaccharide used to thicken, stabilize and suspend. It improves texture and elasticity in doughs, keeps sauces and beverages from separating, and suspends particles evenly in liquid medicines and cosmetics.',
    applications: [
      {
        industry: 'Food & baking',
        use: 'Thickener, stabilizer and binder in gluten-free flours, doughs and bakery mixes.',
      },
      {
        industry: 'Sauces & beverages',
        use: 'Keeps sauces, dressings and beverages smooth and prevents separation.',
      },
      {
        industry: 'Pharmaceuticals',
        use: 'Suspending agent in syrups and oral liquids; binder and thickener in tablets and suspensions.',
      },
      {
        industry: 'Personal care',
        use: 'Thickener and emulsion stabilizer in shampoos, lotions, toothpastes and soaps.',
      },
    ],
  },
  {
    title: 'Citric Acid Anhydrous',
    slug: 'citric-acid-anhydrous',
    category: 'food-grade',
    availability: 'available',
    sortOrder: 50,
    formula: 'C₆H₈O₇',
    casNumber: '77-92-9',
    grade: 'BP/USP/FCC',
    packaging: '25 kg bags',
    origin: 'China',
    shortDescription:
      'Water-free citric acid: a natural preservative, acidulant and pH regulator with a tart flavor.',
    description:
      'White crystalline powder, the water-free form of citric acid (C₆H₈O₇). Natural preservative and pH regulator with a strong tart flavor. Widely used in food & beverages, confectionery, cleaning products, cosmetics and pharmaceuticals as an acidulant, antioxidant and chelating agent.',
    applications: [
      {
        industry: 'Food & beverages',
        use: 'Acidulant, preservative and pH regulator.',
      },
      {
        industry: 'Confectionery',
        use: 'Tart flavor and acidity in sweets.',
      },
      {
        industry: 'Pharmaceuticals',
        use: 'Acidulant and antioxidant in formulations.',
      },
      {
        industry: 'Cosmetics & cleaning',
        use: 'Chelating agent in cleaning products and cosmetics.',
      },
    ],
  },
  {
    title: 'Monosodium Glutamate (MSG)',
    slug: 'monosodium-glutamate',
    category: 'food-grade',
    availability: 'available',
    sortOrder: 60,
    formula: 'C₅H₈NNaO₄·H₂O',
    casNumber: '6106-04-3',
    packaging: '25 kg bags',
    origin: 'China',
    shortDescription:
      'Flavor enhancer that gives processed foods, seasonings and snacks their savory umami taste.',
    description:
      'White crystalline powder, the sodium salt of glutamic acid. Powerful flavor enhancer that imparts umami (savory) taste. Commonly used in processed foods, seasonings, snacks, soups and sauces to intensify and balance flavors. Food-grade and widely accepted in culinary applications.',
    applications: [
      {
        industry: 'Food & seasoning',
        use: 'Primary ingredient in seasoning cubes, powders and spice blends.',
      },
      {
        industry: 'Food & beverages',
        use: 'Flavor enhancer in soups, stock cubes, noodles, dairy and instant foods.',
      },
      {
        industry: 'Snacks & baking',
        use: 'Adds flavor depth to snacks, biscuits and flour-based products.',
      },
      {
        industry: 'Food & agriculture',
        use: 'Improves palatability of animal feed and breakfast cereals.',
      },
    ],
  },
  {
    title: 'Maltodextrin',
    slug: 'maltodextrin',
    category: 'excipient',
    availability: 'available',
    sortOrder: 70,
    formula: '(C₆H₁₀O₅)n',
    casNumber: '9050-36-6',
    packaging: '25 kg bags',
    origin: 'China',
    shortDescription:
      'Starch-derived carbohydrate used as a filler, bulking agent and carrier in foods and tablets.',
  },
  {
    title: 'Corn Starch',
    slug: 'corn-starch',
    category: 'excipient',
    availability: 'available',
    sortOrder: 80,
    formula: '(C₆H₁₀O₅)n',
    casNumber: '9005-25-8',
    packaging: '25 kg bags',
    shortDescription:
      'Maize starch used as a thickener in foods and as a binder and disintegrant in tablets.',
  },
  {
    title: 'Trisodium Citrate',
    slug: 'trisodium-citrate',
    category: 'excipient',
    availability: 'available',
    sortOrder: 90,
    formula: 'Na₃C₆H₅O₇·2H₂O',
    casNumber: '6132-04-3',
    packaging: '25 kg bags',
    shortDescription:
      'Sodium salt of citric acid used as a buffering agent, emulsifying salt and acidity regulator.',
  },
  {
    title: 'Glycerol Monostearate',
    slug: 'glycerol-monostearate',
    category: 'food-grade',
    availability: 'available',
    sortOrder: 100,
    formula: 'C₂₁H₄₂O₄',
    casNumber: '31566-31-1',
    packaging: '25 kg bags',
    shortDescription:
      'Emulsifier and stabilizer used in bakery, dairy and confectionery products and in creams.',
  },
]
