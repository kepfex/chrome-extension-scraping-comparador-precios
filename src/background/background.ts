import type { KeywordStorage, PrepareScrapingMessage, ScrapedProduct, ScrapeResultsStorage } from "../types";

console.log('Extension background service worker running')

// Example: listen to installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed')
})

let activePort: chrome.runtime.Port | null = null;
let activeTabId: number | null = null;

let sessionProducts: ScrapedProduct[] = [];
let currentKeywordId: string | null = null;
let currentKeywordText: string = "";
let currentSite: 'falabella' | 'mercadolibre' = 'mercadolibre';

let currentPage = 1;

let isCancelled = false;

const MIN_PRODUCTS = {
    falabella: 60,
    mercadolibre: 100
};

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "prepare_scraping") {
        startScraping(request);
    }

    if (request.action === "cancel_scraping") {
        isCancelled = true;

        // Cerramos el tab si es Cancelado por el usuario
        if (activeTabId) {
            chrome.tabs.remove(activeTabId);
        }
    }
});

async function startScraping({ url, keyword, id, site }: PrepareScrapingMessage) {
    console.log("🚀 START SCRAPING");
    console.log({ url, keyword, id, site });

    // 🔥 RESET ABSOLUTO DEL ESTADO
    sessionProducts = [];
    currentKeywordId = id;
    currentKeywordText = keyword;
    currentSite = site;
    currentPage = 1;
    isCancelled = false;

    //   Nuevo
    activePort?.disconnect();
    activePort = null;
    activeTabId = null;

    chrome.tabs.create({ url }, (tab) => {
        activeTabId = tab.id!;
        console.log("📂 Tab creada:", activeTabId);
    });
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
    if (!currentKeywordId) return; // Para evitar ejecuciones fantasmas.

    console.log("🔄 onUpdated:", { tabId, infoStatus: info.status });

    if (tabId !== activeTabId || info.status !== "complete") return;

    console.log("✅ Página lista, conectando...");
    connectAndScrape(tabId);
});

function connectAndScrape(tabId: number) {
    console.log("🔌 Conectando al tab:", tabId);
    activePort = chrome.tabs.connect(tabId, { name: "scraping-channel" });

    activePort.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            console.log("⚠ Port cerrado por navegación (normal)");
        } else {
            console.log("⚠ Port desconectado manualmente");
        }
    });

    activePort.onMessage.addListener(async (msg) => {

        if (msg.action === "page_result") {

            console.log("📦 Página recibida");
            console.log("Productos nuevos:", msg.data.length);
            console.log("Total acumulado:", sessionProducts.length);
            console.log("CurrentPage:", currentPage);


            if (isCancelled) {
                activePort?.postMessage({ action: "stop" });
                finalize("Cancelled");
                return;
            }

            const newProducts = msg.data as ScrapedProduct[];

            const limit = MIN_PRODUCTS[currentSite];
            const remaining = limit - sessionProducts.length;

            console.log("Productos nuevos:", newProducts.length);
            console.log("Faltan por completar:", remaining);

            if (remaining > 0) {
                const productsToAdd = newProducts.slice(0, remaining);

                productsToAdd.forEach(p => {
                    if (!sessionProducts.some(e => e.url === p.url)) {
                        p.posicion = sessionProducts.length + 1;
                        sessionProducts.push(p);
                    }
                });
            }

            await updateProgress();

            if (sessionProducts.length >= limit || !msg.hasNext) {
                finalize("Done");
            } else {
                goToNextPage();
            }
        }
    });

    if (!activePort) return;  // Agregado último

    activePort.postMessage({
        action: "scrape_page",
        keyword: currentKeywordText,
        site: currentSite
    });
}

function goToNextPage() {
    if (!activeTabId) return;

    currentPage++;

    if (currentSite === "mercadolibre") {
        const offset = (currentPage - 1) * 48 + 1;

        console.log("➡ Navegando a página:", currentPage);
        console.log("Offset calculado:", offset);

        const nextUrl =
            currentPage === 1
                ? `https://listado.mercadolibre.com.pe/${encodeURIComponent(currentKeywordText)}`
                : `https://listado.mercadolibre.com.pe/${encodeURIComponent(currentKeywordText)}_Desde_${offset}_NoIndex_True`;

        chrome.tabs.update(activeTabId, { url: nextUrl });
    } else if (currentSite === "falabella") {
        console.log("➡ Navegando a página:", currentPage);
        const currentUrl = new URL(
            `https://www.falabella.com.pe/falabella-pe/search?Ntt=${encodeURIComponent(currentKeywordText)}`
        );

        currentUrl.searchParams.set("page", currentPage.toString());

        console.log("➡ Falabella página:", currentPage);

        chrome.tabs.update(activeTabId, { url: currentUrl.toString() });
    }
}

async function updateProgress() {
    const data = await chrome.storage.local.get("keywords") as KeywordStorage;
    const keywords = data.keywords || [];

    const index = keywords.findIndex(k => k.id === currentKeywordId);

    if (index !== -1) {
        keywords[index].count = sessionProducts.length;
        keywords[index].status = "Running";
        await chrome.storage.local.set({ keywords });
    }
}

async function finalize(status: 'Done' | 'Cancelled') {
    if (!currentKeywordId) return;

    console.log("🏁 FINALIZANDO:", status);
    console.log("Total productos:", sessionProducts.length);

    const dataK = await chrome.storage.local.get("keywords") as KeywordStorage;
    const dataR = await chrome.storage.local.get("results") as ScrapeResultsStorage;

    const keywords = dataK.keywords || [];
    const results = dataR.results || {};

    // Si no existe la keyword en results, inicializarla
    if (!results[currentKeywordId]) {
        results[currentKeywordId] = {
            falabella: [],
            mercadolibre: []
        };
    }

    // Guardar por sitio
    results[currentKeywordId][currentSite] = sessionProducts;

    const index = keywords.findIndex(k => k.id === currentKeywordId);
    if (index !== -1) {
        keywords[index].status = status;
        keywords[index].count = sessionProducts.length;
    }

    await chrome.storage.local.set({ keywords, results });

    // activePort?.disconnect();
    if (activePort) {
        try {
            activePort.disconnect();
        } catch (err) {
            console.log("Port ya estaba desconectado");
        }
        activePort = null;
    }

    // 🔥 RESET GLOBAL COMPLETO
    activePort = null;
    activeTabId = null;
    currentKeywordId = null;
    currentKeywordText = "";
    currentPage = 1;
    isCancelled = false;
    sessionProducts = [];

    console.log("🧹 Estado reseteado correctamente");
}
