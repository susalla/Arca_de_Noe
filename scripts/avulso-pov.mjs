// Monta o avulso "POV: você tá construindo um barco a 500 km do mar": grava a imagem
// (avulso-pov.html), sintetiza trilha e efeitos sincronizados com js/avulso-pov-tempos.js,
// mixa as vozes (audio/avulso-pov-narracao.mp3) e exporta o vídeo (Instagram e TikTok) e a capa.
//
// Uso:
//   node scripts/narracao.mjs --video=avulso-pov   # gera as vozes (só o que mudou)
//   node scripts/avulso-pov.mjs                    # grava tudo
//   node scripts/avulso-pov.mjs --so-audio         # reaproveita videos/avulso-pov-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'avulso-pov-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'avulso-pov-trilha.wav');
const T = await import('../js/avulso-pov-tempos.js');
const { MARCOS, MARTELADAS, MARTELADAS_VIZINHO, RAIOS } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

// ------------------------------------------------------------ 1. Imagem
if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=avulso-pov.html']);
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
const cena = (nome) => { const i = T.CENAS.findIndex((c) => c[1] === nome); return [T.CENAS[i][0], T.CENAS[i + 1] ? T.CENAS[i + 1][0] : D]; };
const [, FIM_SOL] = cena('tchau');      // até aqui é dia de sol
const [INI_PRETO] = cena('preto');
const [INI_CHUVA] = cena('chuva');
const [INI_FINAL] = cena('final');
const [g0, g1] = MARCOS.grilos;

// Marteladas (madeira + prego): as do Noé um pouco mais fortes que as do vizinho
const batida = '(0.9*sin(2*PI*(170+90*exp(-T*40))*T)*exp(-T*28)+0.5*sin(2*PI*1250*T)*exp(-T*90)+0.25*sin(2*PI*2900*T)*exp(-T*140))';
fonte(aeval(somaDe(MARTELADAS, batida)), 'volume=0.5', 'martelo');
fonte(aeval(somaDe(MARTELADAS_VIZINHO.map((h) => h + 0.01), batida)), 'volume=0.32', 'marteloViz');

// Cigarras no sol (some nos grilos e na tela preta)
fonte(ruido('white', 3), `bandpass=f=5200:width_type=q:w=4,volume='if(lt(t,${FIM_SOL}),(0.55+0.45*sin(2*PI*0.7*t))*(0.6+0.4*gt(sin(2*PI*38*t),0))*(1-between(t,${g0},${MARCOS.olhaCeu[1] + 0.9})),0)':eval=frame,volume=0.5`, 'cigarra');

// Grilos na pausa cômica
fonte(aeval(`if(between(t,${f(g0)},${f(g1 + 0.3)}),0.4*sin(2*PI*4400*t)*gt(sin(2*PI*14*t),0)*gt(sin(2*PI*1.6*(t-${f(g0)})),0),0)`), 'volume=0.3', 'grilos');

// Passos do vizinho (chegando, indo embora, voltando correndo)
const passos = [];
for (let t = MARCOS.vizinhoEntra[0]; t < MARCOS.vizinhoEntra[1]; t += 0.35) passos.push(+t.toFixed(3));
for (let t = MARCOS.vizinhoSai[0]; t < MARCOS.vizinhoSai[1]; t += 0.35) passos.push(+t.toFixed(3));
fonte(aeval(somaDe(passos, 'sin(2*PI*(90+50*exp(-T*30))*T)*exp(-T*25)')), 'volume=0.35', 'passos');
const correndo = [];
for (let t = MARCOS.correndo[0]; t < MARCOS.correndo[1]; t += 0.2) correndo.push(+t.toFixed(3));
fonte(ruido('pink', 4), `bandpass=f=500:width_type=q:w=1,volume='${correndo.map((h) => `if(gte(t,${f(h)}),exp(-(t-${f(h)})*30),0)`).join('+')}':eval=frame,volume=1.6`, 'splash');

// Tapinhas no ombro
fonte(aeval(somaDe(MARCOS.tapinhas, 'sin(2*PI*260*T)*exp(-T*45)')), 'volume=0.4', 'tapinhas');

// "Pop" da nuvenzinha
fonte(aeval(somaDe([MARCOS.nuvenzinha], '0.6*sin(2*PI*(400+900*T)*T)*exp(-T*12)')), 'volume=0.3', 'popNuvem');

// Trovões: o da tela preta (corte seco) e os dos raios
const TROVOES = [[MARCOS.trovaoPreto, 1.4], ...RAIOS.map((r) => [r + 0.05, 1.0])];
fonte(ruido('brown', 5), `lowpass=f=300,volume='${TROVOES.map(([h, s]) => `if(gte(t,${f(h)}),${s}*(1-exp(-(t-${f(h)})*30))*exp(-(t-${f(h)})*0.8)*(0.75+0.25*sin(2*PI*5*t)),0)`).join('+')}':eval=frame,volume=5.5`, 'trovao');
fonte(ruido('white', 6), `highpass=f=1500,lowpass=f=8000,volume='${TROVOES.map(([h]) => `if(gte(t,${f(h)}),exp(-(t-${f(h)})*9),0)`).join('+')}':eval=frame,volume=0.7`, 'estalo');

// Chuva e vento (da tela preta até o fim)
fonte(ruido('pink', 7), `highpass=f=700,lowpass=f=9000,volume='if(gt(t,${INI_PRETO + 0.2}),clip((t-${INI_PRETO + 0.2})/1.2,0,1),0)':eval=frame,volume=0.38`, 'chuva');
fonte(ruido('pink', 8), `bandpass=f=600:width_type=q:w=0.6,volume='if(gt(t,${INI_PRETO}),0.6+0.4*sin(2*PI*0.4*t),0)':eval=frame,volume=0.35`, 'vento');

// Feixe dourado: subida + brilho + "plim"
const F = MARCOS.feixe;
fonte(aeval(`if(between(t,${f(F - 0.45)},${f(F + 0.9)}),0.5*sin(2*PI*(300+900*clip((t-${f(F - 0.45)})/0.45,0,1))*t)*clip((${f(F + 0.9)}-t)/0.9,0,1),0)`), 'volume=0.25', 'subida');
fonte(aeval(somaDe([F], '(0.6*sin(2*PI*1567.98*T)*exp(-T*7)+0.5*sin(2*PI*2093*T)*exp(-T*5)+0.3*sin(2*PI*2637*T)*exp(-T*4))')), 'volume=0.3', 'plim');
fonte(ruido('pink', 9), `bandpass=f=1200:width_type=q:w=0.6,volume='if(between(t,${F},${F + 1.4}),sin(PI*(t-${F})/1.4),0)':eval=frame,volume=0.4`, 'vivas');

// Cartão: pop e clique
fonte(aeval(somaDe([MARCOS.cartao], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)') + `+${somaDe([MARCOS.toque], '0.7*sin(2*PI*2400*T)*exp(-T*90)')}`), 'volume=0.3', 'cartao');

// Música
const arpejo = (ini, fim, passo, notas, vol) => {
  const idx = `mod(floor((t-${ini})/${passo}),${notas.length})`;
  let fr = String(notas[notas.length - 1]);
  for (let i = notas.length - 2; i >= 0; i--) fr = `if(eq(${idx},${i}),${notas[i]},${fr})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${fr}*${fase})+0.3*sin(4*PI*${fr}*${fase}))*exp(-${fase}*${passo < 0.2 ? 14 : 9}),0)`;
};
// Dia de sol: "violãozinho" despreocupado em dó maior (pausa nos grilos)
const despreocupado = [261.63, 329.63, 392, 329.63, 349.23, 440, 523.25, 440, 392, 493.88, 587.33, 493.88, 261.63, 329.63, 392, 523.25];
const sol1 = arpejo(0, g0 - 0.05, 0.275, despreocupado, '0.8');
const sol2 = arpejo(MARCOS.olhaCeu[1] + 0.9, INI_PRETO - 0.05, 0.275, despreocupado, '0.8');
// Chuva: tenso no retorno do vizinho, heroico quando vira ajudante, animado no final
const tenso = arpejo(INI_CHUVA, F - 0.4, 0.3, [220, 261.63, 329.63, 261.63], '0.6');
const heroico = arpejo(F, INI_FINAL, 0.2, [293.66, 369.99, 440, 587.33], '0.9');
const final = arpejo(INI_FINAL, D - 0.2, 0.18, [293.66, 369.99, 440, 369.99, 392, 493.88, 587.33, 493.88], '0.8');
fonte(aeval(`${sol1}+${sol2}+${tenso}+${heroico}+${final}`), 'lowpass=f=3400,volume=0.15', 'musica');
const drone = '(0.5*sin(2*PI*73.42*t)+0.35*sin(2*PI*110*t)+0.25*sin(2*PI*146.83*t))*(0.8+0.2*sin(2*PI*0.4*t))';
fonte(aeval(`(${drone})*if(gt(t,${INI_CHUVA}),0.6+0.4*clip((t-${F})/1,0,1),0)`), 'lowpass=f=1000,volume=0.18', 'drone');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.3}:d=0.3,aformat=channel_layouts=stereo[efeitos]`);

// Vozes com ducking
const NARRACAO = resolve(RAIZ, 'audio/avulso-pov-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=${D},asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem vozes: rode antes  node scripts/narracao.mjs --video=avulso-pov');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

// ------------------------------------------------------------ 3. Exportar (um arquivo para Instagram e TikTok)
const VIDEO = resolve(VIDEOS, 'avulso-pov.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', VIDEO]);

// Capa: o vizinho de braços cruzados do lado do Noé, com a pergunta
const CAPA = resolve(VIDEOS, 'avulso-pov-capa.jpg');
const ttf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '5.9', '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.62:w=iw:h=ih*0.2:color=black@0.6:t=fill,` +
    `drawtext=fontfile=${ttf}:text='NOÉ…':fontcolor=white:fontsize=86:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.632,` +
    `drawtext=fontfile=${ttf}:text='CADÊ O MAR?':fontcolor=0xffd23f:fontsize=112:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.708`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${VIDEO}\n  ${CAPA}`);
