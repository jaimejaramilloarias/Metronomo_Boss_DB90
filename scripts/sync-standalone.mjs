import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');
const distAssetsDir = join(distDir, 'assets');
const standaloneDir = join(projectRoot, 'standalone');
const standaloneAssetsDir = join(standaloneDir, 'assets');

async function ensureDistAssets() {
  try {
    const stats = await stat(distAssetsDir);
    if (!stats.isDirectory()) {
      throw new Error('dist/assets is not a directory.');
    }
  } catch (error) {
    throw new Error('No se encontró la carpeta dist/assets después de compilar. Ejecuta `npm run build` antes de sincronizar.');
  }
}

async function syncStandalone() {
  await ensureDistAssets();
  await rm(standaloneAssetsDir, { recursive: true, force: true });
  await mkdir(standaloneDir, { recursive: true });
  await cp(distAssetsDir, standaloneAssetsDir, { recursive: true });
}

syncStandalone().catch((error) => {
  console.error('[sync-standalone] Error al preparar el bundle para GitHub Pages:', error.message || error);
  process.exitCode = 1;
});
