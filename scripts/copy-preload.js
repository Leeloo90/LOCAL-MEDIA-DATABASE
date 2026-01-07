import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const preloadMjsPath = join(__dirname, '../out/preload/preload.mjs');
const preloadJsPath = join(__dirname, '../out/preload/preload.js');

try {
  // Read the .mjs file
  const content = readFileSync(preloadMjsPath, 'utf8');

  // Convert ES imports to CommonJS
  const cjsContent = content
    .replace(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g, 'const { $1 } = require("$2")')
    .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require("$2")');

  // Write the .js file
  writeFileSync(preloadJsPath, cjsContent, 'utf8');
  console.log('✓ Converted preload.mjs to CommonJS preload.js');
} catch (error) {
  console.error('Error converting preload:', error.message);
  process.exit(1);
}
