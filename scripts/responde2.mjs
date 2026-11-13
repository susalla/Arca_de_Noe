// Monta o avulso "Noé responde comentários #2": grava a imagem (responde2.html), sintetiza trilha e
// efeitos sincronizados com js/responde2-tempos.js, mixa a voz (audio/responde2-narracao.mp3)
// e exporta o vídeo (Instagram e TikTok) e a capa.
//
// Uso:
//   node scripts/narracao.mjs --video=responde2   # gera a voz (só o que mudou)
//   node scripts/responde2.mjs                    # grava tudo
//   node scripts/responde2.mjs --so-audio         # reaproveita videos/responde2-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'responde2-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'responde2-trilha.wav');
const T = await import('../js/responde2-tempos.js');
const { MARCOS: M, COMENTARIOS } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=responde2.html']);
}

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
const serie = (ini, fim, passo) => { const r = []; for (let t = ini; t < fim; t += passo) r.push(+t.toFixed(3)); return r; };
const [INI_UNI, FIM_UNI] = cena('unicornio');
const [INI_JAFE, FIM_JAFE] = cena('jafe');
const [INI_ORA, FIM_ORA] = cena('orangotango');
const [INI_PAS, FIM_PAS] = cena('passarinho');
const [INI_BAR, FIM_BAR] = cena('barata');
const [INI_NAVE, FIM_NAVE] = cena('nave');
const [INI_GOL, FIM_GOL] = cena('golias');
const [INI_BAS, FIM_BAS] = cena('basilisco');
const [INI_PEI, FIM_PEI] = cena('peixe');
const [INI_FIM, FIM_FIM] = cena('final');

// Vinheta de abertura: "tchan-tchan"
fonte(aeval(somaDe([0.15, 0.4], '(0.5*sin(2*PI*523.3*T)+0.4*sin(2*PI*659.3*T)+0.3*sin(2*PI*784*T))*exp(-T*5)')), 'volume=0.25', 'vinheta');
// Plim de cada cartão
fonte(aeval(somaDe(COMENTARIOS.map((g) => g.inicio), '(0.6*sin(2*PI*1567.98*T)*exp(-T*9)*lt(T,0.09)+0.6*sin(2*PI*2093*(T-0.09))*exp(-(T-0.09)*7)*gte(T,0.09))')), 'volume=0.2', 'plim');

// Unicórnio: o contador rolando (tique-tique), suspiro e trote; carimbo
const [s0, s1] = M.selo;
fonte(aeval(somaDe(serie(s0, s1, 0.06), '0.5*sin(2*PI*2400*T)*exp(-T*120)')), 'volume=0.25', 'contador');
fonte(aeval(somaDe(serie(M.cavalo[0], M.cavalo[1], 0.17), '(0.7*sin(2*PI*(500+300*exp(-T*40))*T)*exp(-T*40))')), 'volume=0.35', 'trote');
fonte(aeval(somaDe([M.cavalo[1] + 0.1], '0.4*sin(2*PI*(700-300*T)*T+3*sin(2*PI*30*T))*lt(T,0.6)*sin(PI*T/0.6)')), 'volume=0.18', 'relincho');
fonte(aeval(somaDe([M.carimboUnicornio, ...M.placas], '(sin(2*PI*130*T)*exp(-T*25)+0.4*sin(2*PI*880*T)*exp(-T*60))')), 'volume=0.5', 'carimbo');

// Jafé: feixe do sobrinho
fonte(aeval(`if(between(t,${M.sobrinho - 0.15},${M.sobrinho + 0.4}),0.5*sin(2*PI*(300+900*clip((t-${M.sobrinho - 0.15})/0.45,0,1))*t),0)`), 'volume=0.18', 'subida');
fonte(aeval(somaDe([M.sobrinho + 0.3], '(0.6*sin(2*PI*1567.98*T)*exp(-T*7)+0.5*sin(2*PI*2093*T)*exp(-T*5))')), 'volume=0.22', 'plimFeixe');

// Orangotango: mordidas (nhac)
fonte(ruido('white', 3), `bandpass=f=2500:width_type=q:w=2,volume='${M.morango.map((m) => `if(between(t,${f(m)},${f(m + 0.12)}),exp(-(t-${f(m)})*30),0)`).join('+')}':eval=frame,volume=1.2`, 'nhac');

// Passarinho: piados e brilho da lupa
fonte(aeval(somaDe(serie(INI_PAS + 0.5, FIM_PAS - 0.3, 0.9), '0.4*sin(2*PI*(3800+600*sin(2*PI*40*T))*T)*lt(T,0.12)*sin(PI*T/0.12)')), 'volume=0.12', 'piado');
fonte(aeval(somaDe([M.lupa[1]], '0.35*(sin(2*PI*(1800+1200*T)*T)+sin(2*PI*(2700+1500*T)*T))*exp(-T*3)*lt(T,1.2)')), 'volume=0.15', 'brilhoLupa');

// Barata gamer: musiquinha de videogame (onda quadrada) e fuga com o chinelo
const chip = [659.3, 784, 987.8, 1318.5, 987.8, 784];
let fr = String(chip[chip.length - 1]);
const idx = `mod(floor((t-${INI_BAR})/0.13),${chip.length})`;
for (let i = chip.length - 2; i >= 0; i--) fr = `if(eq(${idx},${i}),${chip[i]},${fr})`;
fonte(aeval(`if(between(t,${INI_BAR},${M.barataFoge}),0.25*(2*gt(sin(2*PI*${fr}*t),0)-1)*exp(-mod(t-${INI_BAR},0.13)*8),0)`), 'lowpass=f=4000,volume=0.22', 'chiptune');
fonte(ruido('white', 4), `bandpass=f=1200:width_type=q:w=1.5,volume='if(between(t,${M.chinelo - 0.25},${M.chinelo + 0.1}),sin(PI*(t-${M.chinelo - 0.25})/0.35),0)':eval=frame,volume=0.5`, 'saca');
fonte(aeval(somaDe(serie(M.barataFoge, M.barataFoge + 1.1, 0.05), '0.3*sin(2*PI*3000*T)*exp(-T*200)')), 'volume=0.3', 'patinhas');

// Disco voador: zumbido com tremolo e o raio; toras pousando
fonte(aeval(`if(between(t,${INI_NAVE},${FIM_NAVE}),(0.4*sin(2*PI*(180+20*sin(2*PI*6*t))*t)+0.3*sin(2*PI*(360+40*sin(2*PI*6*t))*t))*clip((t-${INI_NAVE})/0.4,0,1)*clip((${FIM_NAVE}-t)/0.4,0,1),0)`), 'volume=0.25', 'ovni');
fonte(aeval(`if(between(t,${M.raio[0]},${M.raio[1]}),0.3*sin(2*PI*(600+400*sin(2*PI*0.5*(t-${M.raio[0]})))*t)*(0.6+0.4*sin(2*PI*12*t)),0)`), 'volume=0.18', 'raio');
fonte(aeval(somaDe([M.torasPousam, M.torasPousam + 0.1, M.torasPousam + 0.22], '(0.8*sin(2*PI*(140+60*exp(-T*30))*T)*exp(-T*14)+0.3*sin(2*PI*420*T)*exp(-T*30))')), 'volume=0.6', 'toras');

// Golias: crescendo grave e batidas no peito
const [g0, g1] = M.golira;
fonte(aeval(`if(between(t,${g0},${g1}),0.6*sin(2*PI*(110-60*(t-${g0})/${(g1 - g0).toFixed(2)})*t),0)`), 'volume=0.35', 'cresce');
fonte(aeval(somaDe(serie(g1 - 0.4, g1 + 1.4, 0.196), 'sin(2*PI*(70+40*exp(-T*20))*T)*exp(-T*12)')), 'volume=0.8', 'peito');

// Basilisco: tremor, sibilo, acorde de susto; pedra
const [b0, b1] = M.basilisco;
fonte(ruido('brown', 5), `lowpass=f=150,volume='if(between(t,${b0},${b1 + 0.4}),clip((t-${b0})/0.5,0,1)*clip((${b1 + 0.4}-t)/0.4,0,1),0)':eval=frame,volume=5`, 'tremor');
fonte(ruido('white', 6), `highpass=f=4000,volume='if(between(t,${b1},${M.tapaOlhos}),0.6*pow(max(0,sin(2*PI*1.2*(t-${b1}))),2),0)':eval=frame,volume=0.5`, 'sibilo');
fonte(aeval(somaDe([b1], '(0.5*sin(2*PI*233.1*T)+0.5*sin(2*PI*329.6*T)+0.4*sin(2*PI*466.2*T)+0.4*sin(2*PI*58.3*T))*exp(-T*1.2)*lt(T,3)')), 'volume=0.35', 'susto');
fonte(aeval(`if(between(t,${b0},${M.pedra}),(0.5*sin(2*PI*55*t)+0.4*sin(2*PI*58.3*t))*clip((t-${b0})/0.6,0,1),0)`), 'lowpass=f=600,volume=0.3', 'drone');
fonte(ruido('white', 7), `bandpass=f=1800:width_type=q:w=1,volume='if(gte(t,${M.pedra}),2.5*exp(-(t-${M.pedra})*14),0)':eval=frame,volume=0.6`, 'crec');
fonte(aeval(somaDe([M.pedra + 0.05], '0.6*sin(2*PI*(220-120*T)*T)*exp(-T*5)')), 'volume=0.4', 'pedra');

// Peixe: bolhas, pad emocionante; chuva depois
const [v0, v1] = M.visao;
fonte(aeval(somaDe(serie(v0 + 0.2, v1 - 0.2, 0.23), '0.3*sin(2*PI*(500+1500*T)*T)*exp(-T*25)')), 'volume=0.15', 'bolhas');
fonte(aeval(`if(between(t,${INI_PEI},${FIM_PEI}),(0.4*sin(2*PI*196*t)+0.35*sin(2*PI*246.9*t)+0.3*sin(2*PI*293.7*t)+0.2*sin(2*PI*392*t))*clip((t-${INI_PEI})/1.2,0,1)*clip((${FIM_PEI}-t)/0.6,0,1),0)`), 'lowpass=f=1800,volume=0.16', 'pad');
fonte(ruido('pink', 8), `highpass=f=700,lowpass=f=9000,volume='if(between(t,${v1},${FIM_PEI}),clip((t-${v1})/0.8,0,1)*clip((${FIM_PEI}-t)/0.6,0,1),0)':eval=frame,volume=0.22`, 'chuva');
fonte(ruido('brown', 9), `lowpass=f=300,volume='if(gte(t,${v1 + 0.6}),0.8*(1-exp(-(t-${v1 + 0.6})*30))*exp(-(t-${v1 + 0.6})*0.9),0)':eval=frame,volume=4`, 'trovao');

// Final: cartão de seguir e a piscada do cupim de pedra
fonte(aeval(somaDe([M.cartao], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)') + `+${somaDe([M.toque], '0.7*sin(2*PI*2400*T)*exp(-T*90)')}`), 'volume=0.3', 'cartao');
fonte(aeval(somaDe([M.pisca + 0.2], '0.6*sin(2*PI*(1200+2000*T)*T)*exp(-T*12)')), 'volume=0.25', 'pisca');

// Música leve (arpejos) entre as cenas de humor
const arpejo = (ini, fim, passo, notas, vol) => {
  const i2 = `mod(floor((t-${ini})/${passo}),${notas.length})`;
  let fq = String(notas[notas.length - 1]);
  for (let i = notas.length - 2; i >= 0; i--) fq = `if(eq(${i2},${i}),${notas[i]},${fq})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${fq}*${fase})+0.3*sin(4*PI*${fq}*${fase}))*exp(-${fase}*${passo < 0.2 ? 14 : 9}),0)`;
};
const feliz = [293.66, 369.99, 440, 369.99, 392, 493.88, 587.33, 493.88];
const leve = [261.6, 329.6, 392, 329.6];
const heroico = [293.66, 369.99, 440, 587.33];
fonte(aeval([
  arpejo(0.6, INI_UNI, 0.2, leve, '0.7'),
  arpejo(INI_UNI, FIM_ORA, 0.2, feliz, '0.8'),
  arpejo(INI_PAS, INI_BAR, 0.22, leve, '0.7'),
  arpejo(INI_NAVE, FIM_GOL, 0.2, heroico, '0.8'),
  arpejo(INI_FIM, FIM_FIM - 0.2, 0.18, feliz, '0.8'),
].join('+')), 'lowpass=f=3200,volume=0.14', 'musica');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.3}:d=0.3,aformat=channel_layouts=stereo[efeitos]`);

const NARRACAO = resolve(RAIZ, 'audio/responde2-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=${D},asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem voz: rode antes  node scripts/narracao.mjs --video=responde2');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-12.5:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

const VIDEO = resolve(VIDEOS, 'responde-2.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', VIDEO]);

// Capa: o basilisco
const CAPA = resolve(VIDEOS, 'responde-2-capa.jpg');
const ttf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(M.tapaOlhos - 0.4), '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.6:w=iw:h=ih*0.2:color=black@0.6:t=fill,` +
    `drawtext=fontfile=${ttf}:text='NOÉ RESPONDE #2':fontcolor=white:fontsize=84:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.62,` +
    `drawtext=fontfile=${ttf}:text='NÃO OLHA NO OLHO!':fontcolor=0xffd23f:fontsize=86:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.70`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${VIDEO}\n  ${CAPA}`);
