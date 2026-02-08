import type { ScrapedProduct } from "../types";

console.log('✔ Mercado Libre content script inyectada')

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "scraping-channel") return;

  port.onMessage.addListener((msg) => {
    if (msg.action !== "scrape_page") return;

    const cards = document.querySelectorAll(".poly-card");
    const products: ScrapedProduct[] = [];

    cards.forEach((card) => {
      const title = card.querySelector(".poly-component__title")?.textContent?.trim() || null;
      const link = (card.querySelector("a") as HTMLAnchorElement)?.href;
      const fraction = card.querySelector(".andes-money-amount__fraction")?.textContent || "";
      const cents = card.querySelector(".andes-money-amount__cents")?.textContent || "";
      const currency = card.querySelector(".andes-money-amount__currency-symbol")?.textContent || "";

      if (!title || !link) return;

      const rawPrice = `${currency} ${fraction}.${cents}`;
      const numeric = parseFloat(fraction.replace(/\./g, "") + "." + cents);

      products.push({
        site: "mercadolibre",
        keyword: msg.keyword,
        timestamp: new Date().toISOString(),
        posicion: 0,
        titulo: title,
        precio_visible: rawPrice,
        precio_numérico: numeric || null,
        url: link,
        marca: null,
        vendedor: null
      });
    });

    const nextBtn = document.querySelector('[data-andes-pagination-control="next"]');
    const hasNext = !!nextBtn && !nextBtn.getAttribute("aria-disabled");

    port.postMessage({
      action: "page_result",
      data: products,
      hasNext
    });
  });
});
