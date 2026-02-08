import type { Keyword, KeywordStorage, ScrapedProduct, ScrapeResultsStorage } from "../types";

const input = document.getElementById('keywordInput') as HTMLInputElement
const addBtn = document.getElementById('addBtn') as HTMLButtonElement
const listContainer = document.getElementById('keywordList') as HTMLElement

// Cargar datos al abrir el popup
document.addEventListener('DOMContentLoaded', async () => {
  const dataKeywords = await chrome.storage.local.get('keywords') as KeywordStorage;
  const dataResults = await chrome.storage.local.get('results') as ScrapeResultsStorage;

  const keywords: Keyword[] = dataKeywords.keywords || [];
  const results = dataResults.results || {}
  renderKeywords(keywords, results);
})

// Agregar una nueva Keyword
addBtn.addEventListener('click', async () => {
  const text = input.value.trim();
  if (!text) return;

  const newKeyword: Keyword = {
    id: crypto.randomUUID(),
    text,
    status: 'Idle',
    count: 0
  }

  const data = await chrome.storage.local.get('keywords') as KeywordStorage;

  // Aseguramos que current sea un array vacío si no existe nada aún
  const currentKeywords: Keyword[] = data.keywords || [];

  const updatedKeywords = [newKeyword, ...currentKeywords];

  await chrome.storage.local.set({ keywords: updatedKeywords });

  input.value = '';
  renderKeywords(updatedKeywords)
})

// Renderizar los cards Keywords
function renderKeywords(keywords: Keyword[], results?: ScrapeResultsStorage["results"]) {
  if (keywords.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
        <p class="text-slate-400 font-medium">No hay keywords registradas aún.</p>
      </div>`;
    return;
  }

  listContainer.innerHTML = keywords.map(kw => {
    const isRunning = kw.status === 'Running';
    const keywordResults = results?.[kw.id];
    const hasProducts = keywordResults && ((keywordResults.falabella?.length || 0) || (keywordResults.mercadolibre?.length || 0) > 0)

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

            <button 
                data-action="stats" data-id="${kw.id}"
                class="w-24 btn-action cursor-pointer bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex flex-col items-center justify-center gap-1 shadow-sm rounded-sm"
            >
              <span class="text-lg">📊</span>
              <span class="text-[10px] font-bold uppercase">Estadística</span>
            </button>
          </div>

          ${isRunning ? `
            <button 
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
                  ${renderProductList(keywordResults?.falabella || [])}
              </div>

              <div>
                  <h4 class="text-xs font-bold mb-2 text-yellow-600">Mercado Libre</h4>
                  ${renderProductList(keywordResults?.mercadolibre || [])}
              </div>

          </div>
      </div>

    </div>
    `;
  }).join('');
}

// Escuchador global para la lista (Event Delegation)
listContainer.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  const button = target.closest('button'); // Busca el botón más cercano al clic

  if (!button) return;

  const action = button.getAttribute('data-action');
  const id = button.getAttribute('data-id');
  const site = button.getAttribute('data-site') as 'falabella' | 'mercadolibre';

  if (action === 'delete' && id) {
    await deleteKeyword(id);
  } else if (action === 'scrap' && id && site) {
    // En el Storage obtener la lista actual para buscar el texto de la keyword
    const data = await chrome.storage.local.get('keywords') as KeywordStorage;
    const currentKeywords = data.keywords || [];
    const keywordObj = currentKeywords.find(k => k.id === id);

    if (keywordObj) {
      console.log(`Iniciando scraping para ${keywordObj.text} en ${site}`);
      startScraping(keywordObj, site);
    }
  } else if (action === 'toggle-products' && id) { // Modo plegable | Toggle
    const panel = document.getElementById(`products-${id}`);
    if (!panel) return;

    // panel.classList.toggle('hidden');

    // button.textContent = panel.classList.contains('hidden')
    //   ? 'Ver productos'
    //   : 'Ocultar productos';

    if (panel.style.maxHeight) {
      panel.style.maxHeight = '';
      button.textContent = 'Ver productos'
      panel.classList.remove('mt-4', 'border-t', 'border-slate-200', 'pt-4')
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
      button.textContent = 'Ocultar productos'
      panel.classList.add('mt-4', 'border-t', 'border-slate-200', 'pt-4')
    }
  }
});


function renderProductList(products: ScrapedProduct[]) {
  if (!products.length) {
    return `<p class="text-xs text-slate-400">Sin productos</p>`;
  }

  return products.map(p => `
        <div class="mb-2 p-2 border rounded-lg bg-slate-50 text-xs">
            <p class="font-semibold truncate">${p.titulo}</p>
            <p class="text-slate-500">${p.precio_visible}</p>
        </div>
    `).join('');
}


// (fn): Elimina una keyword y sus datos asociados del storage
const deleteKeyword = async (id: string) => {
  // Obtener los datos actuales del storage 
  const dataKeywordsStorage = await chrome.storage.local.get(["keywords"]) as KeywordStorage;
  const dataResultsStorage = await chrome.storage.local.get(["results"]) as ScrapeResultsStorage;

  const currentKeywords: Keyword[] = dataKeywordsStorage.keywords || [];
  const currentResults = dataResultsStorage.results || {};

  // Filtrar la lista para remover la keyword seleccionada
  const updatedKeywords = currentKeywords.filter(k => k.id !== id);

  // Eliminar también los productos scrapeados de esa keyword
  if (currentResults[id]) {
    delete currentResults[id];
  }

  // Guardar los cambios de vuelta en el storage 
  await chrome.storage.local.set({
    keywords: updatedKeywords,
    results: currentResults
  });

  // Volver a renderizar la UI para reflejar el cambio
  renderKeywords(updatedKeywords);
};

// Función para actualizar el estado de una keyword en el storage y UI
async function updateKeywordStatus(id: string, updates: Partial<Keyword>) {
  const data = await chrome.storage.local.get("keywords") as KeywordStorage;
  const keywords = data.keywords || [];

  const index = keywords.findIndex(k => k.id === id);
  if (index !== -1) {
    keywords[index] = { ...keywords[index], ...updates };
    await chrome.storage.local.set({ keywords });
    renderKeywords(keywords); // Refrescar la lista visualmente
  }
}

async function startScraping(keywordObj: Keyword, site: 'falabella' | 'mercadolibre') {
  // Marcar como Running en la UI y Storage inmediatamente
  await updateKeywordStatus(keywordObj.id, { status: 'Running' });

  // 1. Construir la URL de búsqueda según el sitio
  const searchUrl = site === 'falabella'
    ? `https://www.falabella.com.pe/falabella-pe/search?Ntt=${encodeURIComponent(keywordObj.text)}`
    : `https://listado.mercadolibre.com.pe/${encodeURIComponent(keywordObj.text)}`;

  // Avisar al background que inicie el proceso
  chrome.runtime.sendMessage({
    action: "prepare_scraping",
    url: searchUrl,
    keyword: keywordObj.text,
    id: keywordObj.id,
    site: site
  });

}