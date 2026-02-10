import type { ScrapeResultsStorage } from "../../types";
import { calculateStats, groupProducts } from "../../utils/similarity";
import { statsContent, statsModal } from "../dom";
import { buildStatsHTML } from "../render";

export async function openStatsModal(keywordId: string) {

  const data = await chrome.storage.local.get("results") as ScrapeResultsStorage;
  const results = data.results || {};
  const keywordResults = results[keywordId];

  if (!keywordResults) {
    statsContent.innerHTML = "<p>No hay datos.</p>";
    statsModal.classList.remove("hidden");
    statsModal.classList.add("flex")
    return;
  }

  const allProducts = [
    ...(keywordResults.falabella || []),
    ...(keywordResults.mercadolibre || [])
  ];

  if (!allProducts.length) {
    statsContent.innerHTML = "<p>No hay productos.</p>";
    statsModal.classList.remove("hidden");
    statsModal.classList.add("flex")
    return;
  }

  const groups = groupProducts(allProducts);
  const stats = calculateStats(groups);

  // Ordenar por mayor oportunidad de ahorro
    const sorted = stats.sort((a, b) => {
      if (!a.savings) return 1;
      if (!b.savings) return -1;
      return b.savings - a.savings;
    });

  buildStatsHTML(sorted)

  // statsContent.innerHTML = JSON.stringify(stats, null, 2);
  statsModal.classList.remove("hidden");
  statsModal.classList.add("flex")
}