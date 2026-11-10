// Grava o vídeo vertical do dia (1080x1920, 30 fps) para Reels/Stories.
// Uso: node scripts/gravar-video.mjs [saida.mp4] [--seguidores=500 --ontem=420 ...]
// Precisa de: Playwright (com Chromium) e ffmpeg instalados.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { criarServidor } from './servidor.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const FPS = 30;
const args = process.argv.slice(2);
const extras = new URLSearchParams();
let saida = null;
for (const a of args) {
  if (a.startsWith('--')) {
    const [k, v = ''] = a.slice(2).split('=');
    extras.set(k, v);
  } else saida = a;
}

const progresso = JSON.parse(await readFile(new URL('../progresso.json', import.meta.url), 'utf8'));
const dia = extras.get('dia') || progresso.dia;
saida = resolve(saida || `videos/dia-${String(dia).padStart(3, '0')}.mp4`);
await mkdir(dirname(saida), { recursive: true });

const servidor = criarServidor();
await new Promise((ok) => servidor.listen(0, ok));
const porta = servidor.address().port;

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pagina = await navegador.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
pagina.on('pageerror', (e) => console.error('Erro na página:', e.message));
extras.set('video', '1');
extras.set('gravando', '1');
await pagina.goto(`http://localhost:${porta}/?${extras}`);
await pagina.waitForFunction(() => window.__pronto === true, null, { timeout: 60000 });
const duracao = await pagina.evaluate(() => window.__duracao);
const total = Math.ceil(duracao * FPS);
console.log(`Gravando ${duracao.toFixed(1)}s (${total} quadros) → ${saida}`);

const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-vf', 'scale=1080:1920:flags=lanczos,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart',
  saida,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const terminou = new Promise((ok, erro) => ffmpeg.on('close', (c) => (c === 0 ? ok() : erro(new Error(`ffmpeg saiu com código ${c}`)))));

for (let i = 0; i < total; i++) {
  await pagina.evaluate((t) => window.__renderizarEm(t), i / FPS);
  const quadro = await pagina.screenshot({ type: 'png' });
  if (!ffmpeg.stdin.write(quadro)) await new Promise((ok) => ffmpeg.stdin.once('drain', ok));
  if (i % FPS === 0) process.stdout.write(`\r${Math.round((i / total) * 100)}%`);
}
ffmpeg.stdin.end();
await terminou;
process.stdout.write('\r100%\n');

await navegador.close();
servidor.close();
console.log(`Pronto: ${saida}`);
