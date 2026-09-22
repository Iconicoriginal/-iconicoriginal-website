// Package the generated pages and public assets for the existing Sites preview.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, statSync } from 'node:fs';
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
  if (file.startsWith('assets/video/savhotel-mantegna/') && file.endsWith('.mp4')) {
    // Keep the originals in Git; publish browser-compatible H.264 copies.
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', join(root, file),
      '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', target]);
  } else {
    cpSync(join(root, file), target);
  }
  if (statSync(target).size > 25 * 1024 * 1024) throw new Error(`Static asset exceeds 25 MiB: ${file}`);
  copied++;
}
console.log(`Static preview ready: ${copied} public files.`);
