import { loadAndRenderKeywords } from "./services/keyword.service";
import { initEvents } from "./events";

// Entry limpio | punto de entrada

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndRenderKeywords();
  initEvents();
})





