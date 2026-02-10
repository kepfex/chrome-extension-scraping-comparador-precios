import { marked } from "marked";
import DOMPurify from "dompurify";
import { createAIModal } from "../render";

export const openAIModalAndAnalyze = async (keywordId: string) => {

  createAIModal();

  const contentDiv = document.getElementById("aiContent")!;

  try {
    const response = await new Promise<string>((resolve) => {
      chrome.runtime.sendMessage(
        { action: "analyze_with_ai", keywordId },
        (res) => resolve(res?.ai || "No se obtuvo respuesta.")
      );
    });

    const rawHtml = await marked.parse(response);
    const cleanHtml = DOMPurify.sanitize(rawHtml);

    // contentDiv.innerHTML = `
    //         <div class="whitespace-pre-wrap leading-relaxed">
    //             ${cleanHtml}
    //         </div>
    //     `;

    contentDiv.innerHTML = cleanHtml;

  } catch (error) {
    contentDiv.innerHTML = `
            <p class="text-red-600">
                Error generando análisis.
            </p>
        `;
  }
}