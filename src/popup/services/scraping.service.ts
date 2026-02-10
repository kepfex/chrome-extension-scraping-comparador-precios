import type { KeywordStorage } from "../../types";
import { updateKeywordStatus } from "./keyword.service";

export const startScraping = async (id: string, site: 'falabella' | 'mercadolibre') => {
    // En el Storage obtener la lista actual para buscar el texto de la keyword
    const data = await chrome.storage.local.get('keywords') as KeywordStorage;
    const currentKeywords = data.keywords || [];
    const keywordObj = currentKeywords.find(k => k.id === id);

    if (!keywordObj) return;

    // Marcar como Running en la UI y Storage inmediatamente
    await updateKeywordStatus(id, { status: "Running" });

    // Construir la URL de búsqueda según el sitio
    const searchUrl = site === 'falabella'
        ? `https://www.falabella.com.pe/falabella-pe/search?Ntt=${encodeURIComponent(keywordObj.text)}`
        : `https://listado.mercadolibre.com.pe/${encodeURIComponent(keywordObj.text)}`;

    // Avisar al background que inicie el proceso
    chrome.runtime.sendMessage({
        action: "prepare_scraping",
        url: searchUrl,
        keyword: keywordObj.text,
        id: keywordObj.id,
        site
    });
}