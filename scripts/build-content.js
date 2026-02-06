import {spawnSync} from 'child_process'
import path from 'path';
import fs from 'fs'
import { fileURLToPath } from 'url';

// Configuración de __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, "..");
const contentDir = path.join(root, "src", "content");

// la carpeta existe para evitar errores
if (!fs.existsSync(contentDir)) {
  console.error("❌ No se encontró la carpeta src/content");
  process.exit(1);
}

const files = fs.readdirSync(contentDir);
const entries = files
  .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
  .map((f) => f.replace(/\.(ts|js)x?$/, ""));

for (const name of entries) {
  console.log(`>> 🛠️ Construyendo content script: ${name}`); // Log para debug
  const r = spawnSync(
    "npx", // opcional en Windows (npx.cmd) para mayor estabilidad
    ["vite", "build", "--config", "vite.content.config.ts", "--emptyOutDir", "false"], // Agreguamos el flag aquí
    {
      cwd: root,
      stdio: "inherit",
      shell: true, // ¡ESTO ES CLAVE EN WINDOWS!
      env: { ...process.env, VITE_CONTENT_ENTRY: name },
    },
  );
  if (r.status !== 0) process.exit(r.status || 1);
}

