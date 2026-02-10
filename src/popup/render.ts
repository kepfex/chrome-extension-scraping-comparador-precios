import type { Keyword, ScrapedProduct, ScrapeResultsStorage } from "../types";
import { listContainer, statsContent } from "./dom";

export const renderKeywords = (
    keywords: Keyword[],
    results?: ScrapeResultsStorage['results']
): void => {

    if (keywords.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <p class="text-slate-400 font-medium">No hay keywords registradas aún.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = keywords.map((kw) => {

        const keywordResults = results?.[kw.id];
        const falabella = keywordResults?.falabella || [];
        const ml = keywordResults?.mercadolibre || [];

        const hasProducts = falabella.length > 0 || ml.length > 0;
        const isRunning = kw.status === "Running";

        return `
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group">
            
            <button 
                data-action="delete" 
                data-id="${kw.id}"
                class="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Eliminar Keyword"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div class="flex items-center gap-3 mb-1">
                <h3 class="font-extrabold text-lg text-slate-800 truncate">${kw.text}</h3>
                <span class="status-badge status-${kw.status.toLowerCase()}">${kw.status}</span>
            </div>

            <div class="flex items-center justify-between gap-8">
                
                <div class="flex-1 min-w-0">
                <div class="flex items-center gap-4">
                    <span class="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <span class="text-blue-500">📦</span> ${kw.count} productos obtenidos
                    </span>
                </div>
                </div>

                <div class="flex flex-col gap-3 min-w-[300px]">
                <div class="flex items-stretch gap-3">
                    
                    <fieldset class="flex-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    <legend class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Start Scraping en:</legend>
                        <div class="flex gap-2"> 
                        <button 
                            class="flex-1 btn-action cursor-pointer bg-lime-500 hover:bg-lime-600 text-white border-none font-bold py-1 shadow-sm rounded-sm transition-all"
                            data-action="scrap" data-site="falabella" data-id="${kw.id}"
                        >
                            Falabella
                        </button>
                        <button 
                            class="flex-1 btn-action cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-slate-800 border-none font-bold py-1 shadow-sm rounded-sm transition-all"
                            data-action="scrap" data-site="mercadolibre" data-id="${kw.id}"
                        >
                            M. Libre
                        </button>
                        </div> 
                        <div>
                        ${hasProducts ? `
                            <button
                            data-action="toggle-products" 
                            data-id="${kw.id}"
                            class="w-full mt-2 text-xs hover:font-medium text-blue-500 hover:text-blue-600 underline cursor-pointer"
                            >
                            Ver productos
                            </button>
                            ` : ''}
                        </div>
                    </fieldset>

                    <div class="flex flex-col gap-2">
                    <button 
                        data-action="stats" data-id="${kw.id}"
                        class="w-24 btn-action cursor-pointer bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-1 shadow-sm rounded-sm"
                    >
                        <span class="text-lg">📊</span>
                        <span class="text-[10px] font-bold uppercase">Stats</span>
                    </button>
                    <button 
                        data-action="ai" data-id="${kw.id}"
                        class="w-24 btn-action cursor-pointer bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-1 shadow-sm rounded-sm"
                    >
                        <span class="text-lg">🤖</span>
                        <span class="text-[10px] font-bold uppercase">IA</span>
                    </button>
                    </div>
                </div>

                ${isRunning ? `
                    <button 
                        data-action="cancel"
                        data-id="${kw.id}"
                        class="w-full py-2 text-[11px] bg-red-200 text-white rounded-xl font-black uppercase tracking-wider hover:bg-red-700 transition-all shadow-md rounded-sm flex items-center justify-center gap-2"
                    >
                    <span class="animate-pulse">🛑</span> Detener Proceso
                    </button>
                ` : ''}
                </div>
            </div>
            
            <div 
                id="products-${kw.id}" 
                class="transition-all duration-300 overflow-hidden max-h-0"
            >
                <div class="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                    
                    <div>
                        <h4 class="text-xs font-bold mb-2 text-lime-600">Falabella</h4>
                        ${renderProductList(falabella)}
                    </div>

                    <div>
                        <h4 class="text-xs font-bold mb-2 text-yellow-600">Mercado Libre</h4>
                        ${renderProductList(ml)}
                    </div>

                </div>
            </div>

            </div>
        `;
    }).join("")
}

const renderProductList = (products: ScrapedProduct[]) => {
    if (!products.length) return '<p class="text-xs text-slate-400">Sin productos</p>'

    return products.map(p => `
        <div class="mb-2 p-2 border rounded-lg bg-slate-50 text-xs">
            <p class="font-semibold truncate">${p.titulo}</p>
            <p class="text-slate-500">${p.precio_visible}</p>
        </div>
    `).join("");
}

export function createAIModal() {
  const modal = document.createElement("div");
  modal.id = "aiModal";
  modal.className = `
    fixed inset-0 bg-black/40 backdrop-blur-sm 
    flex items-center justify-center z-50
  `;

  // prose prose-sm
  modal.innerHTML = `
    <div class="bg-white w-150 max-h-[80vh] rounded-2xl shadow-xl p-5 relative flex flex-col">
      
      <button id="closeAIModal"
        class="absolute top-3 right-3 text-slate-400 hover:text-red-500">
        ✕
      </button>

      <h2 class="text-lg font-extrabold text-purple-700 mb-4">
        🤖 Análisis Inteligente
      </h2>

      <div id="aiContent" 
          class="prose prose-sm max-w-none
            prose-headings:mb-0 prose-headings:mt-0
            prose-p:mb-0
            prose-ul:mb-0 prose-ul:mt-0
            prose-li:mb-0
            prose-hr:my-0
            leading-relaxed
            overflow-y-auto pr-2 flex-1">
        <p class="text-slate-400 animate-pulse">Generando análisis...</p>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeAIModal")!
    .addEventListener("click", () => modal.remove());
}

export const buildStatsHTML = (stats: any[]) => {
  if (!stats.length) {
    statsContent.innerHTML = `
      <div class="text-center py-8 text-slate-500 font-semibold">
            No hay estadísticas disponibles.
        <p class="font-normal">No se encontraron grupos similares.</p>
      </div>
    `;
    return;
  }

  statsContent.innerHTML = `
        <div class="space-y-4 pr-2">
            ${stats.map(group => `
                <div class="border rounded-xl p-3 bg-slate-50">
                    <h4 class="font-bold text-sm mb-2">
                        ${group.key}
                    </h4>

                    <div class="grid grid-cols-2 gap-3 text-xs">

                        <div>
                            <p><strong>Falabella:</strong> ${group.falabellaCount}</p>
                            <p><strong>M. Libre:</strong> ${group.mercadolibreCount}</p>
                        </div>

                        <div>
                            <p><strong>Mín:</strong> S/ ${group.minPrice.toFixed(2)}</p>
                            <p><strong>Máx:</strong> S/ ${group.maxPrice.toFixed(2)}</p>
                            <p><strong>Prom:</strong> S/ ${group.avgPrice.toFixed(2)}</p>
                        </div>

                    </div>

                    ${group.bestSite ? `
                        <div class="mt-2 p-2 rounded-lg text-xs font-semibold ${group.bestSite === "Falabella"
        ? "bg-lime-100 text-lime-700"
        : "bg-yellow-100 text-yellow-700"
      }">
                            🏷 Mejor precio en ${group.bestSite} <br>
                            💰 Ahorro: S/ ${group.savings?.toFixed(2)} 
                            (${group.savingsPercent?.toFixed(1)}%)
                        </div>
                    ` : `
                        <div class="mt-2 text-xs text-slate-400">
                            No comparable entre sitios
                        </div>
                    `}
                </div>
            `).join("")}
        </div>
    `;
}