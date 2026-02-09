# 🛒 Comparador de Precios (Falabella - MercadoLibre)

Extensión de Chrome (Manifest V3) que realiza scraping automatizado en Falabella y MercadoLibre, agrupa productos similares, calcula métricas comparativas y utiliza Inteligencia Artificial para generar recomendaciones de compra.

---

## 🚀 Características

- 🔎 Búsqueda por keyword
- 🕷 Scraping automatizado con paginación
- 📦 Límite configurable de productos por sitio
- 🧠 Agrupación inteligente por similitud de títulos
- 📊 Cálculo de estadísticas comparativas:
  - Precio mínimo
  - Precio máximo
  - Precio promedio
  - Mejor sitio
  - Ahorro absoluto y porcentual
- 🤖 Análisis con IA usando OpenRouter
- 🧼 Render seguro en Markdown (marked + DOMPurify)
- 🎨 UI moderna con TailwindCSS + Typography

---

## 🏗 Arquitectura

Extensión basada en **Manifest V3**:

- `background.ts` → Orquestador del scraping
- `content scripts` → Extracción de datos por sitio
- `popup.ts` → UI y lógica de interacción
- `similarity.ts` → Agrupación y métricas
- `aiAnalysis.ts` → Integración con modelo LLM

Flujo:

1. Usuario agrega keyword
2. Popup envía mensaje al background
3. Background crea nueva pestaña
4. Content script scrapea productos
5. Background gestiona paginación y almacenamiento
6. Popup muestra estadísticas
7. IA analiza y genera recomendación

---

## ⚙️ Instalación

## 1️⃣ Requisitos previos

- Tener instalado **Node.js (versión 18 o superior)**.
- Navegador **Google Chrome** o basado en Chromium (Edge, Brave).

---

## 2️ Clonar repositorio

```bash
git clone <https://github.com/kepfex/chrome-extension-scraping-comparador-precios.git>

cd chrome-extension-scraping-comparador-precios
---

## 3️⃣ Instalación de dependencias

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm install
```
---

## 4️⃣ Construcción del proyecto (Build)

Para compilar los archivos de TypeScript y generar la carpeta lista para producción:

```bash
npm run build
```

Esto generará la carpeta:

```
dist/
```
---

## 5️⃣ Cargar extensión en Chrome

1. Abre Chrome y navega a:

```
chrome://extensions/
```

2. Activa el **Modo de desarrollador (Developer mode)** en la esquina superior derecha.
3. Haz clic en **Cargar descomprimida (Load unpacked)**.
4. Selecciona la carpeta raíz del proyecto (dist).
5. En la lista de extensiones aparecerá y debes de elegir la opción Fijar para que aparezaca en la barra superior.

---

## 🚀 Uso

1. Abrir la extensión.
2. Escribir una keyword (Ej: `Nintendo Switch`).
3. Click en **Agregar**.
4. Seleccionar el sitio donde iniciar scraping:

   - 🟢 **Falabella**
   - 🟡 **MercadoLibre**

5. Esperar a que el scraping finalice.
6. Visualizar resultados:

   - 📊 **Estadísticas**
   - 🤖 **Análisis con IA**

---

## 🔐 Configuración de IA

Editar el archivo:

```
src/utils/aiAnalysis.ts
```

Reemplazar:

```ts
const OPENROUTER_API_KEY = "TU_API_KEY_AQUI";
```

Por tu API Key generada en:

```
https://openrouter.ai/
```

---

## 🧠 Criterio de Similitud

La agrupación se basa en normalización de títulos:

```ts
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter(word =>
      word.length > 2 && !STOPWORDS.includes(word)
    )
    .slice(0, 6)
    .join(" ");
}
```

### ¿Qué hace?

- Elimina tildes.
- Elimina símbolos.
- Quita palabras irrelevantes.
- Toma las primeras 6 palabras relevantes.
- Usa ese resultado como clave de agrupación.

---

## 📊 Cálculo de Métricas

En `calculateStats()`:

```ts
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const avgPrice =
  prices.reduce((a, b) => a + b, 0) / prices.length;
```

### Comparación entre sitios:

```ts
if (minFalabella < minML) {
  bestSite = "Falabella";
  savings = minML - minFalabella;
  savingsPercent = (savings / minML) * 100;
}
```

---

## 🤖 Análisis con IA

Se envían a la IA:

- Productos de **Falabella**
- Productos de **MercadoLibre**
- Precios
- URLs

Se utiliza el modelo:

```
qwen/qwen3-next-80b-a3b-instruct
```

La respuesta:

- Se convierte a Markdown con **marked**.
- Se sanitiza con **DOMPurify**.
- Se estiliza con **Tailwind Typography**.

---

## 🖼 Evidencia Visual