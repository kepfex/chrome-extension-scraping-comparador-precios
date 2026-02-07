import type { KeywordStorage, ScrapedProduct, ScrapeResultsStorage } from "../types";

console.log('Extension background service worker running')

// Example: listen to installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed')
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "prepare_scraping") {
        const { url, keyword, id, site } = request;

        chrome.tabs.create({ url }, (tab) => {
            // Listener para esperar a que la página cargue
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);

                    // Conexión persistente desde el Background (No se cierra)
                    const port = chrome.tabs.connect(tabId, { name: "scraping-channel" });
                    
                    port.postMessage({ action: 'start', keyword, id, site });

                    port.onMessage.addListener((msg) => {
                        // Reenviar progreso al storage para que el popup lo vea al abrirse
                        if (msg.action === 'progress') {
                            updateKeywordProgress(id, msg.count);
                        }
                        if (msg.action === 'result') {
                            saveResults(id, msg.data);
                            console.log("Scraping finalizado y datos guardados.");
                        }
                    });
                }
            });
        });
    }
});

async function updateKeywordProgress(id: string, count: number) {
    const data = await chrome.storage.local.get("keywords") as KeywordStorage;
    const keywords = data.keywords || [];
    const index = keywords.findIndex((k: any) => k.id === id);
    if (index !== -1) {
        keywords[index].count = count;
        keywords[index].status = 'Running';
        await chrome.storage.local.set({ keywords });
    }
}

async function saveResults(id: string, products: ScrapedProduct[]) {
    const dataK = await chrome.storage.local.get(["keywords"]) as KeywordStorage;
    const dataR = await chrome.storage.local.get(["results"]) as ScrapeResultsStorage;
    const results = dataR.results || {};
    const keywords = dataK.keywords || [];

    results[id] = products;
    
    const index = keywords.findIndex((k) => k.id === id);
    if (index !== -1) {
        keywords[index].status = 'Done';
        keywords[index].count = products.length;
    }

    await chrome.storage.local.set({ results, keywords });
}

