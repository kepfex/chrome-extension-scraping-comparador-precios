interface Keyword {
    id: string
    text: string
    status: 'Idle' | 'Running' | 'Done' | 'Error' | 'Cancelled'
    count: number
}

interface KeywordStorage {
    keywords?: Keyword[]
}

const input = document.getElementById('keywordInput') as HTMLInputElement
const addBtn = document.getElementById('addBtn') as HTMLButtonElement
const listContainer = document.getElementById('keywordList') as HTMLElement

// Cargar datos al abrir el popup
document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get('keywords') as KeywordStorage;
    const keywords: Keyword[] = data.keywords || [];
    renderKeywords(keywords);
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
function renderKeywords(keywords: Keyword[]) {
    if (keywords.length === 0) {
        listContainer.innerHTML = `
      <div class="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
        <p class="text-slate-400 font-medium">No hay keywords registradas aún.</p>
      </div>`;
        return;
    }

    listContainer.innerHTML = keywords.map(kw => {
        const isRunning = kw.status === 'Running';

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
            
            <fieldset class="flex-1 border border-slate-100 rounded-xl p-2 flex gap-2 bg-slate-50/50">
              <legend class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Start Scraping en:</legend>
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
                class="w-full py-2 text-[11px] bg-red-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-red-700 transition-all shadow-md rounded-sm flex items-center justify-center gap-2"
            >
              <span class="animate-pulse">🛑</span> Detener Proceso
            </button>
          ` : ''}
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
  const site = button.getAttribute('data-site');

  if (action === 'delete' && id) {
    await deleteKeyword(id);
  } else if (action === 'scrap' && id && site) {
    // Aquí llamar a la función de scraping
    console.log(`Iniciando scraping para ${id} en ${site}`);
  }
});

// (fn): Elimina una keyword y sus datos asociados del storage
const deleteKeyword = async (id: string) => {
  // Obtener los datos actuales del storage 
  const dataKeywordsStorage = await chrome.storage.local.get(["keywords"]) as KeywordStorage;
//   const dataResultsStorage = await chrome.storage.local.get(["results"]);

  const currentKeywords: Keyword[] = dataKeywordsStorage.keywords || [];
//   const currentResults = dataResultsStorage.results || {};

  // Filtrar la lista para remover la keyword seleccionada
  const updatedKeywords = currentKeywords.filter(k => k.id !== id);

  // (Opcional) Eliminar también los productos scrapeados de esa keyword
//   if (currentResults[id]) {
//     delete currentResults[id];
//   }

  // Guardar los cambios de vuelta en el storage 
  await chrome.storage.local.set({ 
    keywords: updatedKeywords,
    // results: currentResults 
  });

  // Volver a renderizar la UI para reflejar el cambio
  renderKeywords(updatedKeywords);
};