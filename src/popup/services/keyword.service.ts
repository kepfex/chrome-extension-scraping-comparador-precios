import type { Keyword, KeywordStorage, ScrapeResultsStorage } from "../../types";
import { renderKeywords } from "../render";

export const loadAndRenderKeywords = async () => {
    const dataKeywords = await chrome.storage.local.get('keywords') as KeywordStorage;
    const dataResults = await chrome.storage.local.get('results') as ScrapeResultsStorage;

    const keywords = dataKeywords.keywords || [];
    const results = dataResults.results || {}

    renderKeywords(keywords, results);
}

export const addKeyword = async (text: string) : Promise<Keyword[]> => {
    const newKeyword: Keyword = {
        id: crypto.randomUUID(),
        text,
        status: 'Idle',
        count: 0
    }

    const data = await chrome.storage.local.get('keywords') as KeywordStorage;

    // Aseguramos que current sea un array vacío si no existe nada aún
    const current = data.keywords || [];

    const updated = [newKeyword, ...current];

    await chrome.storage.local.set({ keywords: updated })

    return updated;
}

export  const deleteKeyword = async (id: string) : Promise<void> => {
  console.log('delete desde la funcion deletekeuword');
  
  const dataK = await chrome.storage.local.get("keywords") as KeywordStorage;
  const dataR = await chrome.storage.local.get("results") as ScrapeResultsStorage;

  const keywords = dataK.keywords || [];
  const updatedKeywords = keywords.filter(k => k.id !== id);
  
  const results = dataR.results || {};
  delete results[id];

  await chrome.storage.local.set({
    keywords: updatedKeywords,
    results
  });

  renderKeywords(updatedKeywords, results);
}

export const updateKeywordStatus = async (id: string, updates: Partial<Keyword>) => {
  const data = await chrome.storage.local.get("keywords") as KeywordStorage;
  const keywords = data.keywords || [];

  const index = keywords.findIndex(k => k.id === id);
  
  if (index !== -1) {
    keywords[index] = { ...keywords[index], ...updates };
    await chrome.storage.local.set({ keywords });
    renderKeywords(keywords); // Refrescar la lista visualmente
  }
}