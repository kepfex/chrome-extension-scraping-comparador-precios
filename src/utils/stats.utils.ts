import type { ScrapedProduct } from "../types";

// Stopwords
const STOPWORDS = [
  "original",
  "producto",
  "modelo",
  "caja",
  "unidad",
  "nuevo",
  "nueva",
  "con",
  "sin",
  "para",
  "the",
  "and",
  "of"
];

// Normalización
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z0-9\s]/g, "")     // quitar símbolos
    .trim();
}

// Generador de clave
export function generateGroupKey(title: string): string {
  const normalized = normalizeText(title);

  const tokens = normalized
    .split(" ")
    .filter(word => word.length > 3)
    .filter(word => !STOPWORDS.includes(word));

  const uniqueTokens = Array.from(new Set(tokens));

  uniqueTokens.sort();

  return uniqueTokens.slice(0, 3).join("-");
}

// Agrupar productos
export function groupProducts(products: ScrapedProduct[]) {
  const groups: Record<string, ScrapedProduct[]> = {};

  for (const product of products) {
    const key = generateGroupKey(product.titulo);

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(product);
  }

  return groups;
}


