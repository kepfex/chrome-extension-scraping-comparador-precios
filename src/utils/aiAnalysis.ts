import type { ScrapeResultsStorage } from "../types";

export async function analyzeKeywordWithAI(keywordId: string) {

    const OPENROUTER_API_KEY = "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";

    const data = await chrome.storage.local.get("results") as ScrapeResultsStorage;
    const results = data.results || {};
    const keywordResults = results[keywordId];

    if (!keywordResults) {
        return "No hay datos suficientes para analizar.";
    }

    const falabella = keywordResults.falabella || [];
    const mercadolibre = keywordResults.mercadolibre || [];

    const prompt = `
        Analiza estos productos comparados entre Falabella y MercadoLibre:

        Falabella:
        ${JSON.stringify(falabella, null, 2)}

        MercadoLibre:
        ${JSON.stringify(mercadolibre, null, 2)}

        Para cada grupo realiza:
        1) Dinos si los productos son equivalentes.
        2) Calcula y muestra por tienda:
        - Precio mínimo
        - Precio máximo
        - Precio promedio
        3) Indica cuál tienda ofrece el mejor precio promedio y cuál sería la mejor opción de compra.
        4) Agrega una recomendación clara para el usuario (por qué elegir una sobre otra).
        5) Si no puedes comparar productos porque faltan datos, indícalo.

        Devuelve la respuesta estructurada en texto claro.
        `;
    

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
                { role: "system", content: "Eres un analista experto en precios e-commerce." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2
        })
    });

    const json = await res.json();

    return json.choices?.[0]?.message?.content || "Sin respuesta.";
}


export function createAIModal() {
    const modal = document.createElement("div");
    modal.id = "aiModal";
    modal.className = `
    fixed inset-0 bg-black/40 backdrop-blur-sm 
    flex items-center justify-center z-50
  `;

    modal.innerHTML = `
    <div class="bg-white w-[600px] max-h-[80vh] rounded-2xl shadow-xl p-5 relative flex flex-col">
      
      <button id="closeAIModal"
        class="absolute top-3 right-3 text-slate-400 hover:text-red-500">
        ✕
      </button>

      <h2 class="text-lg font-extrabold text-purple-700 mb-4">
        🤖 Análisis Inteligente
      </h2>

      <div id="aiContent" class="text-sm overflow-y-auto pr-2 flex-1">
        <p class="text-slate-400 animate-pulse">Generando análisis...</p>
      </div>

    </div>
  `;

    document.body.appendChild(modal);

    document.getElementById("closeAIModal")!
        .addEventListener("click", () => modal.remove());
}
