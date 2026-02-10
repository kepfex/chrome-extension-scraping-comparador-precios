import type { ScrapeResultsStorage } from "../types";

export async function analyzeKeywordWithAI(keywordId: string) {
// TU_API_KEY_AQUI
  const OPENROUTER_API_KEY = "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"; // pega_aqui_tu_token_generado_en_open_router

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
      // model: "qwen/qwen3-next-80b-a3b-instruct",
      // model: "meta-llama/llama-3.3-70b-instruct",
        model: "openai/gpt-oss-120b",
        // model: "google/gemma-3-27b-it",
      //   model: "tngtech/deepseek-r1t2-chimera:free",
      //   model: "nvidia/nemotron-3-nano-30b-a3b",
      //   model: "upstage/solar-pro-3:free",
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

