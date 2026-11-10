// Monta o vídeo 02 ("Os 10 primeiros ajudantes"): grava a imagem (video02.html),
// sintetiza trilha e efeitos no ffmpeg sincronizados com js/video02-tempos.js,
// mixa a narração (audio/video02-narracao.mp3) e exporta Instagram, TikTok e capa.
//
// Uso:
//   node scripts/narracao.mjs --video=02     # gera a voz (só o que mudou)
//   node scripts/video02.mjs                 # grava tudo
//   node scripts/video02.mjs --so-audio      # reaproveita videos/video02-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'video02-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'video02-trilha.wav');
const T = await import('../js/video02-tempos.js');
const { MARCOS, AJUDANTES } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

// ------------------------------------------------------------ 1. Imagem
if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=video02.html']);
}

// ------------------------------------------------------------ 2. Trilha
const f = (n) => n.toFixed(3);
const somaDe = (tempos, expr) => tempos.map((h) => `if(gte(t,${f(h)}),${expr.replaceAll('T', `(t-${f(h)})`)},0)`).join('+') || '0';
const entradas = [];
const filtros = [];
const camadas = [];
let n = 0;
function fonte(src, cadeia, rotulo) {
  entradas.push('-f', 'lavfi', '-i', src);
  filtros.push(`[${n}:a]${cadeia}[${rotulo}]`);
  camadas.push(rotulo);
  n++;
}
const aeval = (expr) => `aevalsrc='${expr}':s=${SR}:d=${D}`;
const ruido = (cor, seed) => `anoisesrc=color=${cor}:sample_rate=${SR}:d=${D}:seed=${seed}`;

// Tempos-chave
const TROVOES = T.RAIOS.map((r, i) => [r + 0.15, [1, 0.7, 0.9][i] ?? 1]);
const pousos = AJUDANTES.map((a) => a.pousa);
const comuns = AJUDANTES.filter((a) => !a.animal).map((a) => a.pousa);
const [JACARE, ONCA, ELEFANTE] = ['jacare', 'onca', 'elefante'].map((b) => AJUDANTES.find((a) => a.animal === b).pousa);
const ticks = [];
for (let t = 2.65, dt = 0.26; t < MARCOS.viraDia - 0.02; t += dt, dt = Math.max(0.045, dt * 0.86)) ticks.push(+t.toFixed(3));
const batidas = [];
for (let t = MARCOS.marteladas[0] + 0.0938; t < MARCOS.marteladas[1]; t += 0.375) batidas.push(+t.toFixed(3));
const contratempo = batidas.map((b) => +(b + 0.1875).toFixed(3)).filter((b) => b < MARCOS.marteladas[1]);
const ORDEM_BROTOS = 9;
const brotos = [];
for (let j = 0; j < ORDEM_BROTOS - 1; j++) brotos.push(+(MARCOS.suportesInicio + j * MARCOS.suportesPasso + 0.32).toFixed(3));
const FINAL = MARCOS.suporteFinal;
const [H0, H1] = MARCOS.holograma;

// Trovão + estalo
const envTrovao = TROVOES.map(([h, s]) => `if(gte(t,${f(h)}),${s}*(1-exp(-(t-${f(h)})*25))*exp(-(t-${f(h)})*0.9)*(0.75+0.25*sin(2*PI*5*t)),0)`).join('+');
fonte(ruido('brown', 3), `lowpass=f=320,volume='${envTrovao}':eval=frame,volume=5.5`, 'trovao');
const envEstalo = TROVOES.map(([h, s]) => `if(gte(t,${f(h)}),${s}*exp(-(t-${f(h)})*7),0)`).join('+');
fonte(ruido('white', 4), `highpass=f=1800,lowpass=f=7000,volume='${envEstalo}':eval=frame,volume=0.5`, 'estalo');

// Chuva (abertura e fechamento em loop)
const chuva = 'if(lt(t,2.5),1,if(lt(t,3.2),1-(t-2.5)/0.7,if(gt(t,31),(t-31)/0.9*0.8,0)))';
fonte(ruido('pink', 5), `highpass=f=700,lowpass=f=9000,volume='${chuva}':eval=frame,volume=0.3`, 'chuva');

// Relógio acelerando + "ding" quando vira o dia + vento do time-lapse
fonte(aeval(somaDe(ticks, '(0.7*sin(2*PI*2600*T)+0.4*sin(2*PI*1300*T))*exp(-T*260)')), 'volume=0.5', 'relogio');
fonte(aeval(somaDe([MARCOS.viraDia], '(0.6*sin(2*PI*1568*T)+0.4*sin(2*PI*2349*T)+0.2*sin(2*PI*3136*T))*exp(-T*3)')), 'volume=0.4', 'ding');
fonte(ruido('pink', 6), `bandpass=f=900:width_type=q:w=0.7,volume='if(between(t,2.6,5.7),sin(PI*(t-2.6)/3.1),0)':eval=frame,volume=0.55`, 'vento');

// Coral angelical (Ré maior) quando os feixes começam a cair
const coro = [293.66, 369.99, 440, 587.33, 739.99].map((hz, i) => `${[0.5, 0.4, 0.4, 0.3, 0.15][i]}*sin(2*PI*${hz}*t+${(0.3 * i).toFixed(1)}*sin(2*PI*5.2*t))`).join('+');
fonte(aeval(`if(between(t,5.3,9.6),(${coro})*clip((t-5.3)/0.7,0,1)*clip((9.6-t)/0.6,0,1),0)`), 'lowpass=f=2400,volume=0.16', 'coro');

// Feixe (brilho descendo), pouso (baque) e nota do contador subindo a cada ajudante
fonte(aeval(somaDe(pousos.map((p) => p - 0.45), '0.4*sin(2*PI*(2600-1500*T)*T)*clip(T/0.1,0,1)*clip((0.5-T)/0.15,0,1)')), 'volume=0.22', 'brilho');
fonte(aeval(somaDe(pousos, '(sin(2*PI*(55+90*exp(-T*25))*T)*exp(-T*11)+0.35*sin(2*PI*420*T)*exp(-T*40))')), 'volume=0.6', 'pouso');
const notas = pousos.map((p, i) => [p + 0.05, 659.25 * Math.pow(2, i / 12)]);
fonte(aeval(notas.map(([h, hz]) => `if(gte(t,${f(h)}),(0.6*sin(2*PI*${hz.toFixed(2)}*(t-${f(h)}))+0.25*sin(4*PI*${hz.toFixed(2)}*(t-${f(h)})))*exp(-(t-${f(h)})*6),0)`).join('+')), 'volume=0.2', 'contador');

// Jacaré: chegada em câmera lenta (grave descendo) e duas bocadas
fonte(aeval(`if(between(t,${f(JACARE - 0.9)},${f(JACARE)}),0.7*sin(2*PI*(220-150*(t-${f(JACARE - 0.9)})/0.9)*t)*sin(PI*(t-${f(JACARE - 0.9)})/0.9),0)`), 'volume=0.3', 'lentoJ');
fonte(ruido('white', 8), `highpass=f=900,volume='${[JACARE + 0.12, JACARE + 0.32].map((h) => `if(gte(t,${f(h)}),exp(-(t-${f(h)})*45),0)`).join('+')}':eval=frame,volume=0.9`, 'bocada');
fonte(aeval(somaDe([JACARE + 0.12, JACARE + 0.32], 'sin(2*PI*180*T)*exp(-T*35)')), 'volume=0.6', 'bocada2');

// Onça: rosnado
fonte(ruido('brown', 9), `bandpass=f=170:width_type=q:w=1.2,volume='if(between(t,${f(ONCA + 0.05)},${f(ONCA + 1.1)}),(0.6+0.4*sin(2*PI*28*t))*sin(PI*(t-${f(ONCA + 0.05)})/1.05),0)':eval=frame,volume=6`, 'rosnado');

// Elefante: estrondo, tremor de chão e barrido
fonte(aeval(somaDe([ELEFANTE], 'sin(2*PI*(32+45*exp(-T*5))*T)*exp(-T*1.4)')), 'volume=1.3', 'estrondo');
fonte(ruido('brown', 10), `lowpass=f=140,volume='if(gte(t,${f(ELEFANTE)}),exp(-(t-${f(ELEFANTE)})*1.6),0)':eval=frame,volume=3.5`, 'tremor');
const B0 = ELEFANTE + 0.55;
const barrido = [1, 2, 3, 4, 5, 6].map((k) => `${(1 / k).toFixed(3)}*sin(2*PI*${k}*(330+260*clip((t-${f(B0)})/0.5,0,1))*(t-${f(B0)})+0.3*sin(2*PI*6*t))`).join('+');
fonte(aeval(`if(between(t,${f(B0)},${f(B0 + 1.0)}),(${barrido})*sin(PI*(t-${f(B0)})/1.0),0)`), 'lowpass=f=3500,volume=0.13', 'barrido');

// Construção: batuque de marteladas (todos juntos) + bumbo e caixa
fonte(aeval(somaDe(batidas, '(0.9*sin(2*PI*190*T)*exp(-T*40)+0.5*sin(2*PI*450*T)*exp(-T*65))')), 'volume=0.5', 'marteladas');
fonte(aeval(somaDe(batidas, 'sin(2*PI*(50+70*exp(-T*30))*T)*exp(-T*9)')), 'volume=0.7', 'bumbo');
fonte(ruido('white', 11), `highpass=f=1500,volume='${contratempo.map((h) => `if(gte(t,${f(h)}),exp(-(t-${f(h)})*30),0)`).join('+') || '0'}':eval=frame,volume=0.35`, 'caixa');

// Cavaletes brotando: baque de madeira + brilho; o último com "reverse" e impacto épico
fonte(aeval(somaDe(brotos, '(sin(2*PI*(80+60*exp(-T*20))*T)*exp(-T*13)+0.3*sin(2*PI*1760*T)*exp(-T*12))')), 'volume=0.55', 'brotos');
fonte(ruido('white', 12), `highpass=f=2500,volume='if(between(t,${f(FINAL - 1.0)},${f(FINAL)}),pow((t-${f(FINAL - 1.0)})/1.0,3),0)':eval=frame,volume=0.3`, 'reverso');
fonte(aeval(somaDe([FINAL], 'sin(2*PI*(38+50*exp(-T*6))*T)*exp(-T*1.5)')), 'volume=1.2', 'impacto');
const epico = [73.42, 146.83, 220, 293.66, 369.99, 440, 587.33].map((hz, i) => `${[0.5, 0.45, 0.35, 0.3, 0.25, 0.2, 0.12][i]}*sin(2*PI*${hz}*t)`).join('+');
fonte(aeval(`if(between(t,${f(MARCOS.flash)},${f(H0)}),(${epico})*clip((t-${f(MARCOS.flash)})/0.05,0,1)*clip((${f(H0)}-t)/0.8,0,1),0)`), 'lowpass=f=2600,volume=0.2', 'epico');
fonte(aeval(somaDe([MARCOS.carimbo + 0.28], '(sin(2*PI*120*T)*exp(-T*25)+0.4*sin(2*PI*900*T)*exp(-T*60))')), 'volume=0.7', 'carimbo');

// Holograma: zumbido de ficção científica e brilhos subindo quando se desfaz
fonte(aeval(`if(between(t,${f(H0)},${f(H1 + 0.6)}),(0.5*sin(2*PI*440*t)+0.4*sin(2*PI*660.5*t)+0.3*sin(2*PI*880*t))*(0.6+0.4*sin(2*PI*9*t))*clip((t-${f(H0)})/0.5,0,1)*clip((${f(H1 + 0.6)}-t)/0.9,0,1),0)`), 'lowpass=f=4000,volume=0.07', 'holo');
const brilhos = [];
for (let i = 0; i < 14; i++) brilhos.push([+(H1 - 0.9 + i * 0.09).toFixed(3), 1500 + ((i * 397) % 9) * 260]);
fonte(aeval(brilhos.map(([h, hz]) => `if(gte(t,${f(h)}),0.5*sin(2*PI*${hz}*(t-${f(h)}))*exp(-(t-${f(h)})*9),0)`).join('+')), 'volume=0.18', 'brilhos');

// Torcida no final
fonte(ruido('pink', 13), `bandpass=f=1200:width_type=q:w=0.6,volume='if(between(t,27.1,29.6),sin(PI*(t-27.1)/2.5)*(0.7+0.3*sin(2*PI*3*t)),0)':eval=frame,volume=0.55`, 'torcida');

// Música: drone triste → arpejo alegre → (batuque) → acorde → pad → arpejo da festa → tempestade
const drone = `(0.5*sin(2*PI*73.42*t)+0.35*sin(2*PI*110*t)+0.25*sin(2*PI*146.83*t)+0.18*sin(2*PI*174.61*t))*(0.8+0.2*sin(2*PI*0.25*t))`;
fonte(aeval(`(${drone})*(if(lt(t,2.6),0.9,0)+if(gt(t,30.2),clip((t-30.2)/0.8,0,1)*0.9,0))`), 'lowpass=f=900,volume=0.22', 'drone');
const arpejo = (ini, fim, passo, notasHz, vol) => {
  const idx = `mod(floor((t-${ini})/${passo}),${notasHz.length})`;
  let freq = String(notasHz[notasHz.length - 1]);
  for (let i = notasHz.length - 2; i >= 0; i--) freq = `if(eq(${idx},${i}),${notasHz[i]},${freq})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${freq}*${fase})+0.3*sin(4*PI*${freq}*${fase}))*exp(-${fase}*9),0)`;
};
fonte(aeval(`${arpejo(5.8, 16.7, 0.25, [293.66, 369.99, 440, 587.33], '(0.6+0.4*clip((t-5.8)/8,0,1))')}+${arpejo(27.0, 30.4, 0.18, [392, 493.88, 587.33, 783.99], '1')}`), 'lowpass=f=3200,volume=0.17', 'arpejo');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.25}:d=0.25,aformat=channel_layouts=stereo[efeitos]`);

// Narração com ducking
const NARRACAO = resolve(RAIZ, 'audio/video02-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem narração: rode antes  node scripts/narracao.mjs --video=02');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

// ------------------------------------------------------------ 3. Exportar
const INSTA = resolve(VIDEOS, 'video-02-instagram.mp4');
const TIKTOK = resolve(VIDEOS, 'video-02-tiktok.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', INSTA]);
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', INSTA, '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
  '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', TIKTOK]);

// Capa: os feixes caindo, com título
const CAPA = resolve(VIDEOS, 'video-02-capa.jpg');
const fonteTtf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '8.95', '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.62:w=iw:h=ih*0.2:color=black@0.55:t=fill,` +
    `drawtext=fontfile=${fonteTtf}:text='OS 10 PRIMEIROS':fontcolor=0xffd23f:fontsize=92:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.64,` +
    `drawtext=fontfile=${fonteTtf}:text='AJUDANTES CHEGARAM':fontcolor=white:fontsize=68:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.72`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${INSTA}\n  ${TIKTOK}\n  ${CAPA}`);
