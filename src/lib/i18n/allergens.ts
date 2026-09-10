import type { TKey } from ".";

/**
 * EU 1169/2011 Annex II allergen id → translated label.
 *
 * The ids come from `EU_ALLERGENS` in lib/constants (which only carries the
 * English labels). Both the guest menu and the Menu Builder picker render names
 * from here so an allergen reads the same Swedish everywhere in the product —
 * a guest has to be able to read their own allergen, and staff have to be able
 * to tag it in their own language.
 */
export const ALLERGEN_KEY: Record<string, TKey> = {
  gluten: "allergen.gluten",
  crustaceans: "allergen.crustaceans",
  eggs: "allergen.eggs",
  fish: "allergen.fish",
  peanuts: "allergen.peanuts",
  soybeans: "allergen.soybeans",
  milk: "allergen.milk",
  nuts: "allergen.nuts",
  celery: "allergen.celery",
  mustard: "allergen.mustard",
  sesame: "allergen.sesame",
  sulphites: "allergen.sulphites",
  lupin: "allergen.lupin",
  molluscs: "allergen.molluscs",
};
