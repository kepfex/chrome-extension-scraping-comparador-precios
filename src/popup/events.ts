import { addBtn, closeStatsModal, input, listContainer, statsModal } from "./dom";
import { openAIModalAndAnalyze } from "./services/ai.service";
import { addKeyword, deleteKeyword, loadAndRenderKeywords } from "./services/keyword.service";
import { startScraping } from "./services/scraping.service";
import { openStatsModal } from "./services/stats.service";

export const initEvents = () => {

    closeStatsModal.addEventListener("click", () => {
        statsModal.classList.add("hidden");
        statsModal.classList.remove("flex");
    });

    // Cerrar si hace click fuera del contenido
    statsModal.addEventListener("click", (e) => {
        if (e.target === statsModal) {
            statsModal.classList.add("hidden");
            statsModal.classList.remove("flex");
        }
    });

    addBtn.addEventListener("click", async () => {
        const text = input.value.trim();
        if (!text) return;

        await addKeyword(text);
        input.value = '';

        await loadAndRenderKeywords();
    });

    input.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            addBtn.click();
        }
    });

    // Escuchador global para la lista (Event Delegation)
    listContainer.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button'); // Busca el botón más cercano al cl


        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;
        const site = button.dataset.site as "falabella" | "mercadolibre" | undefined;

        if (!action || !id) return;

        // -------- DELETE --------
        if (action === "delete") {
            await deleteKeyword(id);
            return;
        }

        // -------- SCRAP --------
        if (action === "scrap" && site) {
  
            await startScraping(id, site);
            return;
        }

        // -------- CANCEL --------
        if (action === "cancel") {
            chrome.runtime.sendMessage({ action: "cancel_scraping" });
            return;
        }

        // -------- STATS --------
        if (action === "stats") {
            await openStatsModal(id);
            return;
        }

        // -------- AI --------
        if (action === "ai") {
            await openAIModalAndAnalyze(id);
            return;
        }

        if (action === 'toggle-products' && id) { // Modo plegable | Toggle
            const panel = document.getElementById(`products-${id}`);
            if (!panel) return;

            // panel.classList.toggle('hidden');

            // button.textContent = panel.classList.contains('hidden')
            //   ? 'Ver productos'
            //   : 'Ocultar productos';

            const isOpen = panel.dataset.open === "true";

            if (isOpen) {
                panel.style.maxHeight = '';
                panel.dataset.open = "false";
                button.textContent = 'Ver productos'
                panel.classList.remove('mt-4', 'border-t', 'border-slate-200', 'pt-4')
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
                panel.dataset.open = "true";
                button.textContent = 'Ocultar productos'
                panel.classList.add('mt-4', 'border-t', 'border-slate-200', 'pt-4')
            }

            return;
        }
    });
}