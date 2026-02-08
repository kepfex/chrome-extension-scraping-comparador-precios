export type SiteName = "Falabella" | "MercadoLibre";

export interface Keyword {
    id: string
    text: string
    status: 'Idle' | 'Running' | 'Done' | 'Error' | 'Cancelled'
    count: number
}

export type  KeywordStorage = {
    keywords?: Keyword[]
}

export interface ScrapedProduct {
    site: string;
    keyword: string;
    timestamp: string;
    posicion: number;
    titulo: string;
    precio_visible: string;
    precio_numérico: number | null;
    url: string;
    marca: string | null;
    vendedor: string | null;
}

export interface ScrapeResultsStorage {
  results?: {
    [keywordId: string]: {
      falabella: ScrapedProduct[];
      mercadolibre: ScrapedProduct[];
    }
  }
}

export interface PrepareScrapingMessage {
  action: "prepare_scraping";
  url: string;
  keyword: string;
  id: string;
  site: 'falabella' | 'mercadolibre';
}

export type ProductGroup = {
  key: string;
  products: ScrapedProduct[];
  falabellaCount: number;
  mercadolibreCount: number;
};
// export type ProductGroupStats = ProductGroup & {
//   minPrice: number;
//   maxPrice: number;
//   avgPrice: number;
//   priceDifference: number | null;
// };

export type ProductGroupStats = {
  key: string;

  falabellaCount: number;
  mercadolibreCount: number;

  minPrice: number;
  maxPrice: number;
  avgPrice: number;

  bestSite: "Falabella" | "MercadoLibre" | null;

  savings: number | null;
  savingsPercent: number | null;
};

