import type { ScrapedProduct } from "../types";
import { scrollToBottom, waitSeconds } from "../utils/falabella.utils";

console.log('✔ Falabella content script inyectada')

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "scraping-channel") return;

    port.onMessage.addListener(async (msg) => {
        if (msg.action !== 'start') return;

        console.log("%c [Scraper] Señal recibida. Iniciando...", "color: #22c55e; font-weight: bold;");

        try {
            // Cambiar estado a progress inmediatamente
            port.postMessage({ action: 'progress', count: 0 })

            let allProducts: ScrapedProduct[] = [];
            const MIN_PRODUCTS = 60;
            let isCancelled = false;

            // Escuchar cancelación inmediata 
            port.onMessage.addListener((m) => { if (m.action === 'cancel') isCancelled = true; });

            while (allProducts.length < MIN_PRODUCTS && !isCancelled) {
                await scrollToBottom(document);
                await waitSeconds(4); // Esperar carga de imágenes/precios

                const cards = document.querySelectorAll('[data-testid=ssr-pod],[data-testid=csr-pod]');

                cards.forEach((card, index) => {

                    if (allProducts.length >= MIN_PRODUCTS || isCancelled) return;

                    // Extracción segura por selectores
                    const titleEl = card.querySelector('.pod-subTitle');
                    const priceEl = card.querySelector('.copy10.primary.high, .copy10.primary.medium'); // CMR o Normal
                    const linkEl = card.querySelector('a.pod-link') as HTMLAnchorElement;
                    const brandEl = card.querySelector('.pod-title');

                    if (titleEl && priceEl && linkEl) {
                        const rawPrice = priceEl.textContent || "";
                        // Limpieza de precio numérico (S/ 1,343.90 -> 1343.90)
                        const numericPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '').replace(',', ''));

                        const product: ScrapedProduct = {
                            site: 'falabella',
                            keyword: msg.keyword,
                            timestamp: new Date().toISOString(),
                            posicion: allProducts.length + 1,
                            titulo: titleEl.textContent?.trim() || null,
                            precio_visible: rawPrice.trim(),
                            precio_numérico: numericPrice || null,
                            url: linkEl.href,
                            marca: brandEl?.textContent?.trim() || null,
                            vendedor: card.querySelector('.pod-sellerText')?.textContent?.trim() || null
                        };

                        // Evitar duplicados por URL
                        if (!allProducts.find(p => p.url === product.url)) {
                            console.log(product);

                            allProducts.push(product);
                            // Notificar progreso al popup
                            port.postMessage({ action: 'progress', count: allProducts.length });
                        }
                    }
                });

                if (allProducts.length < MIN_PRODUCTS) {
                    const nextBtn = document.getElementById('testId-pagination-bottom-arrow-right') as HTMLButtonElement;
                    if (nextBtn && !nextBtn.disabled) {
                        nextBtn.click();
                        await waitSeconds(5);
                    } else {
                        break; // No hay más páginas
                    }
                }
            }

            if (isCancelled) {
                port.postMessage({ action: 'cancel' });
            } else {
                port.postMessage({ action: 'result', data: allProducts });
            }

        } catch (error) {
            port.postMessage({ action: 'error', message: String(error) });
        }
    });
});
