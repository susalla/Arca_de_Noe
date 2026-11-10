// Gera a narração do Noé na ElevenLabs, uma fala por vez, e encaixa cada fala
// no tempo da legenda correspondente (js/trailer.js → FALAS).
// Resultado: audio/narracao.mp3 (usado por scripts/trailer.mjs).
//
// Uso: node scripts/narracao.mjs [--voz=VOICE_ID] [--refazer]
// A chave vem de ELEVENLABS_API_KEY. Neste ambiente de nuvem ela é injetada
// pelo proxy, então qualquer valor de placeholder funciona.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PASTA = resolve(RAIZ, 'audio/falas');
mkdirSync(PASTA, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const VOZ = args.voz || 'pqHfZKP75CvOlQylNhV4'; // "Bill": madura, sábia, grave (voz padrão da ElevenLabs)
const CHAVE = process.env.ELEVENLABS_API_KEY || 'proxy-injected';
const DURACAO = 23;

// Texto falado (pode diferir da legenda: números por extenso, pausas com vírgula)
const FALAS = [
  [0.25, 2.35, 'O dilúvio está vindo.'],
  [2.45, 5.0, 'E eu preciso construir uma arca, sozinho.'],
  [5.1, 8.6, 'Mas cada pessoa que me seguir vira um ajudante.'],
  [8.7, 12.35, 'Me siga, e amanhã você aparece aqui, comigo!'],
  [12.6, 16.4, 'Com dez mil ajudantes, a arca fica pronta.'],
  [16.6, 19.9, 'Sem eles... você sabe o que acontece.'],
  [20.1, 23.0, 'Me segue. O dilúvio não espera.'],
];

// Ajuste de interpretação por fala: estabilidade menor = mais emoção
const ESTILO = [
  { stability: 0.4, style: 0.5 },  // grave, sério
  { stability: 0.4, style: 0.45 }, // cansado, "sozinho"
  { stability: 0.5, style: 0.35 }, // explicando
  { stability: 0.35, style: 0.6 }, // animado, sorrindo
  { stability: 0.45, style: 0.5 }, // épico
  { stability: 0.35, style: 0.55 },// baixo, ameaçador
  { stability: 0.4, style: 0.6 },  // firme, chamado
];

const duracaoDe = (arq) => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).stdout.toString().trim());

function gerar(i) {
  const arq = resolve(PASTA, `fala-${i + 1}.mp3`);
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
  const limpo = resolve(PASTA, `fala-${i + 1}-limpa.wav`);
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
