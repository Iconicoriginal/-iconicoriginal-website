// Private visual review: copy generated pages and assets, without the Vercel API.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.name.startsWith('.') || ['api', 'content', 'tools', 'preview-dist', 'dist', 'node_modules'].includes(entry.name)) continue;
  if (entry.isDirectory() || ['index.html', 'favicon.ico', 'tokens.css', 'sitemap.xml'].includes(entry.name)) {
    cpSync(join(root, entry.name), join(output, entry.name), { recursive: true });
  }
}
writeFileSync(join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

// Ship the web versions without unused duplicate photographic originals.
// Preserve every filename referenced by a page, stylesheet, script or data file.
const listFiles = (directory) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? listFiles(join(directory, entry.name)) : [join(directory, entry.name)]);
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.xml', '.svg']);
const references = listFiles(output).filter((file) => textExtensions.has(extname(file)))
  .map((file) => readFileSync(file, 'utf8')).join('\n');
for (const file of listFiles(join(output, 'assets', 'img'))) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const webVersion = file.replace(/\.(jpe?g|png)$/i, '.webp');
  if (existsSync(webVersion) && !references.includes(basename(file))) rmSync(file);
}
console.log('Private preview assets ready.');

// Keep the long corridor clip below the hosting asset-size limit.
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', join(root, 'assets/video/savhotel-mantegna/savhotel-mantegna-corridoio-prima.mp4'), '-c:v', 'libx264', '-crf', '25', '-preset', 'fast', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', join(output, 'assets/video/savhotel-mantegna/savhotel-mantegna-corridoio-prima.mp4')], { stdio: 'inherit' });
