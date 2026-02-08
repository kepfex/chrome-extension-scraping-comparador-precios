import type { ProductGroup, ScrapedProduct } from "../types";


const STOPWORDS = [
  "de", "la", "el", "los", "las",
  "con", "sin", "para", "por",
  "unidad", "original", "producto",
  "nuevo", "oficial"
];

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD") // separa tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/[^a-z0-9\s]/g, "") // elimina símbolos
    .split(" ")
    .filter(word =>
      word.length > 2 && !STOPWORDS.includes(word)
    )
    .slice(0, 6) // primeras 6 palabras clave
    .join(" ");
}

// Agrupar productos
export function groupProducts(products: ScrapedProduct[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>();

  for (const product of products) {
    const key = normalizeTitle(product.titulo);

    if (!map.has(key)) {
      map.set(key, {
        key,
        products: [],
        falabellaCount: 0,
        mercadolibreCount: 0
      });
    }

    const group = map.get(key)!;
    group.products.push(product);

    if (product.site === "falabella") {
      group.falabellaCount++;
    } else {
      group.mercadolibreCount++;
    }
  }

  return Array.from(map.values());
}

// Calcular estadisticas -> añadimos métricas
export type ProductGroupStats = ProductGroup & {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceDifference: number | null;
};

export function calculateStats(groups: ProductGroup[]): ProductGroupStats[] {
  return groups.map(group => {
    const prices = group.products
      .map(p => p.precio_numérico)
      .filter((p): p is number => p !== null);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice =
      prices.reduce((a, b) => a + b, 0) / prices.length;

    const falabellaPrices = group.products
      .filter(p => p.site === "falabella")
      .map(p => p.precio_numérico)
      .filter((p): p is number => p !== null);

    const mlPrices = group.products
      .filter(p => p.site === "mercadolibre")
      .map(p => p.precio_numérico)
      .filter((p): p is number => p !== null);

    let priceDifference: number | null = null;

    if (falabellaPrices.length && mlPrices.length) {
      priceDifference =
        Math.min(...falabellaPrices) - Math.min(...mlPrices);
    }

    return {
      ...group,
      minPrice,
      maxPrice,
      avgPrice,
      priceDifference
    };
  });
}

// Agrupa productos similares
// Cuenta por sitio
// Calcula mínimo, máximo, promedio
// Calcula diferencia entre sitios
// Ordena por oportunidad