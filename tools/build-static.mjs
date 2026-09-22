// Package the generated pages and public assets for the existing Sites preview.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = join(root, 'dist');
const publicRootFiles = new Set(['index.html', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'tokens.css']);
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
let copied = 0;
for (const file of new Set(files)) {
  if (file.startsWith('.') || /^(content|tools|api|preview-dist|dist)\//.test(file)) continue;
  if (!file.startsWith('assets/') && !file.endsWith('/index.html') && !publicRootFiles.has(file)) continue;
  const target = join(destination, file);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(join(root, file), target);
  copied++;
}
console.log(`Static preview ready: ${copied} public files.`);
