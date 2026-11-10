// Gera a narração do Noé na ElevenLabs, uma fala por vez, e encaixa cada fala
// no tempo da legenda correspondente (js/trailer-tempos.js → FALAS).
// Resultado: audio/narracao.mp3 (usado por scripts/trailer.mjs).
//
// Uso: node scripts/narracao.mjs [--voz=VOICE_ID] [--refazer]
// A chave vem de ELEVENLABS_API_KEY. Neste ambiente de nuvem ela é injetada
// pelo proxy, então qualquer valor de placeholder funciona.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PASTA = resolve(RAIZ, 'audio/falas');
mkdirSync(PASTA, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const VOZ = args.voz || 'pqHfZKP75CvOlQylNhV4'; // "Bill": madura, sábia, grave (voz padrão da ElevenLabs)
const CHAVE = process.env.ELEVENLABS_API_KEY || 'proxy-injected';
// Falas, tempos e interpretação vêm da linha do tempo do vídeo (fonte única)
const TEMPOS = await import('../js/trailer-tempos.js');
const DURACAO = TEMPOS.DURACAO;
const FALAS = TEMPOS.FALAS.map(([ini, fim, legenda, falado]) => [ini, fim, falado || legenda.replaceAll('*', '').replaceAll('…', '...')]);
const ESTILO = TEMPOS.INTERPRETACAO;

const duracaoDe = (arq) => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).stdout.toString().trim());

function gerar(i) {
  // O nome do arquivo depende do texto, da voz e da interpretação:
  // só gera de novo (e gasta créditos) o que mudou.
  const id = createHash('sha1').update(JSON.stringify([FALAS[i][2], VOZ, ESTILO[i]])).digest('hex').slice(0, 10);
  const arq = resolve(PASTA, `fala-${id}.mp3`);
  if (existsSync(arq) && !args.refazer) return arq;
  const corpo = JSON.stringify({
    text: FALAS[i][2],
    model_id: 'eleven_multilingual_v2',
    language_code: 'pt',
    previous_text: FALAS[i - 1]?.[2],
    next_text: FALAS[i + 1]?.[2],
    voice_settings: { similarity_boost: 0.8, speed: 1.0, ...ESTILO[i] },
  });
  // curl respeita HTTPS_PROXY e os certificados do sistema em qualquer máquina
  const r = spawnSync('curl', ['-sS', '-o', arq, '-w', '%{http_code}', '-X', 'POST',
    `https://api.elevenlabs.io/v1/text-to-speech/${VOZ}?output_format=mp3_44100_128`,
    '-H', `xi-api-key: ${CHAVE}`, '-H', 'Content-Type: application/json', '--data-binary', '@-'], { input: corpo });
  const status = r.stdout.toString().trim();
  if (status !== '200') {
    const erro = existsSync(arq) ? readFileSync(arq, 'utf8').slice(0, 400) : r.stderr.toString();
    unlinkSync(arq);
    throw new Error(`ElevenLabs respondeu ${status}: ${erro}`);
  }
  return arq;
}

const arquivos = [];
for (let i = 0; i < FALAS.length; i++) {
  arquivos.push(gerar(i));
  process.stdout.write(`fala ${i + 1}/${FALAS.length} ok\n`);
}

// Encaixe: corta o silêncio das pontas e, se a fala passar da janela da legenda
// (+0,25 s de folga), acelera só o necessário (no máximo 1,25x).
const filtros = [];
const entradas = [];
arquivos.forEach((arq, i) => {
  const [ini, fim] = FALAS[i];
  entradas.push('-i', arq);
  const limpo = arq.replace(/\.mp3$/, '-limpa.wav');
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', arq, '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', limpo]);
  const dur = duracaoDe(limpo);
  const janela = fim - ini + 0.25;
  const tempo = Math.min(1.25, Math.max(1, dur / janela));
  console.log(`fala ${i + 1}: ${dur.toFixed(2)}s na janela de ${janela.toFixed(2)}s → ${tempo > 1 ? `acelera ${tempo.toFixed(2)}x` : 'cabe'}`);
  entradas.splice(entradas.length - 1, 1, limpo);
  filtros.push(`[${i}:a]aresample=48000,${tempo > 1 ? `atempo=${tempo.toFixed(3)},` : ''}adelay=${Math.round(ini * 1000)}:all=1[f${i}]`);
});
filtros.push(`${arquivos.map((_, i) => `[f${i}]`).join('')}amix=inputs=${arquivos.length}:normalize=0,apad,atrim=0:${DURACAO}[voz]`);

const saida = resolve(RAIZ, 'audio/narracao.mp3');
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[voz]', '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '2', saida], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
console.log(`Pronto: ${saida}`);

// Tempo de cada palavra (Scribe) → legendas palavra por palavra no trailer
const stt = spawnSync('curl', ['-sS', '-X', 'POST', 'https://api.elevenlabs.io/v1/speech-to-text',
  '-H', `xi-api-key: ${CHAVE}`, '-F', 'model_id=scribe_v2', '-F', 'language_code=por', '-F', `file=@${saida}`]);
try {
  const d = JSON.parse(stt.stdout.toString());
  const palavras = d.words.filter((w) => w.type === 'word').map((w) => ({ t: +w.start.toFixed(2), fim: +w.end.toFixed(2), p: w.text }));
  writeFileSync(resolve(RAIZ, 'audio/narracao-palavras.json'), JSON.stringify(palavras, null, 1) + '\n');
  console.log(`Transcrição: ${d.text}`);
} catch {
  console.warn('Não consegui transcrever; o trailer usa legendas por frase.');
}
