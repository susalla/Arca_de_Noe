// Servidor estático mínimo (sem dependências) para abrir o site localmente.
// Uso: node scripts/servidor.mjs [porta]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

export function criarServidor() {
  return http.createServer(async (req, res) => {
    try {
      const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let arquivo = normalize(join(RAIZ, caminho));
      if (!arquivo.startsWith(RAIZ)) throw new Error('fora da raiz');
      if (caminho.endsWith('/')) arquivo = join(arquivo, 'index.html');
      const conteudo = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(conteudo);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não encontrado');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const porta = Number(process.argv[2] || 8080);
  criarServidor().listen(porta, () => console.log(`Arca do Noé em http://localhost:${porta}`));
}
