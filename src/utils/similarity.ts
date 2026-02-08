import type { ProductGroup, ProductGroupStats, ScrapedProduct } from "../types";


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

export function calculateStats(groups: ProductGroup[]): ProductGroupStats[] {
  return groups.map(group => {
    const prices = group.products
      .map(p => p.precio_numérico)
      .filter((p): p is number => p !== null);

    if (prices.length === 0) {
      return {
        key: group.key,
        falabellaCount: 0,
        mercadolibreCount: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        bestSite: null,
        savings: null,
        savingsPercent: null
      };
    }
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice =
      prices.reduce((a, b) => a + b, 0) / prices.length;

    const falabellaPrices = group.products
      .filter(p => p.site === "falabella" && p.precio_numérico !== null)
      .map(p => p.precio_numérico as number);

    const mlPrices = group.products
      .filter(p => p.site === "mercadolibre" && p.precio_numérico !== null)
      .map(p => p.precio_numérico as number);

    let bestSite: "Falabella" | "MercadoLibre" | null = null;
    let savings: number | null = null;
    let savingsPercent: number | null = null;

    if (falabellaPrices.length && mlPrices.length) {
      const minFalabella = Math.min(...falabellaPrices);
      const minML = Math.min(...mlPrices);

      if (minFalabella < minML) {
        bestSite = "Falabella";
        savings = minML - minFalabella;
        savingsPercent = (savings / minML) * 100;
      } else if (minML < minFalabella) {
        bestSite = "MercadoLibre";
        savings = minFalabella - minML;
        savingsPercent = (savings / minFalabella) * 100;
      }
    }

    return {
      key: group.key,
      falabellaCount: falabellaPrices.length,
      mercadolibreCount: mlPrices.length,
      minPrice,
      maxPrice,
      avgPrice,
      bestSite,
      savings,
      savingsPercent
    };
  });
}

// Agrupa productos similares
// Cuenta por sitio
// Calcula mínimo, máximo, promedio
// Calcula diferencia entre sitios
// Ordena por oportunidad