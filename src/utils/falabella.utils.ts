// export async function scrollToBottom(doc: Document): Promise<void> {
//     return new Promise((resolve) => {
//         let totalHeight = 0;
//         let distance = 100;
//         let timer = setInterval(() => {
//             let scrollHeight = doc.body.scrollHeight;
//             window.scrollBy(0, distance);
//             totalHeight += distance;

//             if (totalHeight >= scrollHeight) {
//                 clearInterval(timer);
//                 resolve();
//             }
//         }, 600); // Scroll más suave para disparar el lazy load
//     });
// }

export async function scrollToBottom(doc: Document): Promise<void> {
  return new Promise((resolve) => {
    let lastHeight = doc.documentElement.scrollHeight;
    let checkCount = 0; // Contador para dar tiempo a que cargue el contenido

    const timer = setInterval(() => {
      const distance = 500;
      window.scrollBy(0, distance);

      const currentHeight = doc.documentElement.scrollHeight;
      const scrollPos = window.innerHeight + window.scrollY;

      // Si la posición actual es el final Y la altura no ha cambiado
      if (scrollPos >= currentHeight && currentHeight === lastHeight) {
        checkCount++;
        
        // Esperamos 2 ciclos (aprox 1.2s) para confirmar que no hay más carga
        if (checkCount >= 2) {
          clearInterval(timer);
          resolve();
        }
      } else {
        // Si la altura cambió o seguimos moviéndonos, reiniciamos el contador
        lastHeight = currentHeight;
        checkCount = 0;
      }
    }, 600);
  });
}

export const waitSeconds = (s: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}