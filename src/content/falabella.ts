
console.log('✔ Falabella content script inyectada')

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "scraping-channel") return;

  port.onMessage.addListener((msg) => {
    if (msg.action === "start") {
      console.log("Señal de inicio recibida para:", msg.keyword);
      
      // Respuesta de progreso requerida 
      port.postMessage({ action: 'progress', count: 5 });
      
      // Aquí lógica de scraping 
    }
  });
});