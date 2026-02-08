import type { ScrapedProduct } from "../types";

console.log("✔ Falabella content script inyectada");

function scrollToBottom(): Promise<void> {
    return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        
        const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if (totalHeight >= document.body.scrollHeight) {
                clearInterval(timer);
                setTimeout(resolve, 1500); // esperar lazy load final
            }
        }, 400);
    });
}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "scraping-channel") return;
    
console.log("%c [Scraper] Señal recibida. Iniciando...", "color: #22c55e; font-weight: bold;");
  port.onMessage.addListener(async (msg) => {
    if (msg.action !== "scrape_page") return;

    console.log("📜 Haciendo scroll Falabella...");
    await scrollToBottom();

    const cards = document.querySelectorAll('[data-testid=ssr-pod],[data-testid=csr-pod]');
    const products: ScrapedProduct[] = [];

    cards.forEach((card, index) => {
      const titleEl = card.querySelector(".pod-subTitle");
      const priceEl = card.querySelector(".copy10.primary.high, .copy10.primary.medium");
      const linkEl = card.querySelector("a.pod-link") as HTMLAnchorElement;

      if (!titleEl || !priceEl || !linkEl) return;

      const rawPrice = priceEl.textContent || "";
      const numericPrice = parseFloat(
        rawPrice.replace(/[^0-9.,]/g, "").replace(",", "")
      );

      products.push({
        site: "falabella",
        keyword: msg.keyword,
        timestamp: new Date().toISOString(),
        // posicion: index + 1,
        posicion: 0,
        titulo: titleEl.textContent?.trim() || null,
        precio_visible: rawPrice.trim(),
        precio_numérico: numericPrice || null,
        url: linkEl.href,
        marca: card.querySelector(".pod-title")?.textContent?.trim() || null,
        vendedor: card.querySelector(".pod-sellerText")?.textContent?.trim() || null
      });
    });

    const nextBtn = document.getElementById("testId-pagination-bottom-arrow-right") as HTMLButtonElement;
    const hasNext = nextBtn && !nextBtn.disabled;

    console.log("📦 Productos Falabella:", products.length);

    port.postMessage({
      action: "page_result",
      data: products,
      hasNext
    });
  });
});
