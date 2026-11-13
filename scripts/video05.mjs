// Monta o vídeo 05 ("O traidor da arca"): grava a imagem (video05.html), sintetiza trilha e
// efeitos sincronizados com js/video05-tempos.js, mixa a voz (audio/video05-narracao.mp3)
// e exporta o vídeo (Instagram e TikTok) e a capa.
//
// Uso:
//   node scripts/narracao.mjs --video=05     # gera a voz (só o que mudou)
//   node scripts/video05.mjs                 # grava tudo
//   node scripts/video05.mjs --so-audio      # reaproveita videos/video05-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'video05-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'video05-trilha.wav');
const T = await import('../js/video05-tempos.js');
const { MARCOS, COMENTARIOS } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=video05.html']);
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
const [, FIM_BUR] = cena('buraco');
const [INI_SUS, FIM_SUS] = cena('suspeitos');
const [INI_MULT, FIM_MULT] = cena('multidao');
const [INI_ESQ, FIM_ESQ] = cena('esquecidos');
const [INI_CAR, FIM_CAR] = cena('caramelo');
const [INI_HAR, FIM_HAR] = cena('harpia');
const [INI_ESP, FIM_ESP] = cena('espiando');
const [INI_FINAL, FIM_FINAL] = cena('final');
const [INI_POS] = cena('poscreditos');

// Suspense no buraco: drone grave + brilho da luz
fonte(aeval(`if(lt(t,${FIM_BUR + 3.2}),(0.6*sin(2*PI*55*t)+0.4*sin(2*PI*82.4*t)+0.2*sin(2*PI*116.5*t))*clip(t/0.8,0,1)*clip((${FIM_BUR + 3.2}-t)/0.5,0,1),0)+if(between(t,${INI_ESP + 1.5},${FIM_ESP}),(0.6*sin(2*PI*55*t)+0.4*sin(2*PI*77.8*t))*clip((t-${INI_ESP + 1.5})/0.6,0,1),0)`), 'lowpass=f=900,volume=0.3', 'drone');
fonte(aeval('if(lt(t,3.4),0.3*sin(2*PI*1760*t)*(0.5+0.5*sin(2*PI*0.7*t))*exp(-0.3*t),0)'), 'volume=0.08', 'brilho');
// "Dun dun DUNNN" na confissão
fonte(aeval(somaDe([3.9, 4.25], '(0.6*sin(2*PI*146.8*T)+0.4*sin(2*PI*220*T))*exp(-T*4)') + `+${somaDe([4.6], '(0.6*sin(2*PI*138.6*T)+0.4*sin(2*PI*207.7*T)+0.3*sin(2*PI*69.3*T))*exp(-T*1.2)')}`), 'lowpass=f=2500,volume=0.35', 'dundun');
// Suspeitos: clique + flash de câmera, e o vizinho assobiando
fonte(ruido('white', 3), `highpass=f=3000,volume='${MARCOS.flashes.map((h) => `if(gte(t,${f(h)}),exp(-(t-${f(h)})*60)+0.5*exp(-(t-${f(h)}-0.05)*40)*gte(t,${f(h + 0.05)}),0)`).join('+')}':eval=frame,volume=0.6`, 'flash');
const assobio = [[9.25, 988], [9.5, 1175], [9.75, 1319], [10.05, 1175], [10.3, 988]];
fonte(aeval(assobio.map(([h, hz]) => `if(between(t,${h},${h + 0.22}),0.4*sin(2*PI*${hz}*t+0.5*sin(2*PI*6*t))*sin(PI*(t-${h})/0.22),0)`).join('+')), 'volume=0.3', 'assobio');
// Música noir na fila (baixo andando)
const andando = [110, 130.8, 146.8, 164.8, 174.6, 164.8, 146.8, 130.8];
const baixo = `if(between(t,${INI_SUS},${FIM_SUS}),0.7*sin(2*PI*if(eq(mod(floor((t-${INI_SUS})/0.32),8),0),${andando[0]},if(eq(mod(floor((t-${INI_SUS})/0.32),8),1),${andando[1]},if(eq(mod(floor((t-${INI_SUS})/0.32),8),2),${andando[2]},if(eq(mod(floor((t-${INI_SUS})/0.32),8),3),${andando[3]},if(eq(mod(floor((t-${INI_SUS})/0.32),8),4),${andando[4]},if(eq(mod(floor((t-${INI_SUS})/0.32),8),5),${andando[5]},if(eq(mod(floor((t-${INI_SUS})/0.32),8),6),${andando[6]},${andando[7]})))))))*t)*exp(-mod(t-${INI_SUS},0.32)*6),0)`;
fonte(aeval(baixo), 'lowpass=f=700,volume=0.35', 'baixo');

// Multidão: pops + torcida
fonte(aeval(somaDe(serie(MARCOS.multidao[0] + 0.5, MARCOS.multidao[0] + MARCOS.multidao[1] + 0.5, 0.11), '0.5*sin(2*PI*(500+1500*T)*T)*exp(-T*20)')), 'volume=0.2', 'pops');
fonte(ruido('pink', 4), `bandpass=f=1200:width_type=q:w=0.6,volume='if(between(t,${INI_MULT + 0.4},${FIM_MULT}),sin(PI*(t-${INI_MULT + 0.4})/${(FIM_MULT - INI_MULT - 0.4).toFixed(2)})*(0.7+0.3*sin(2*PI*3*t)),0)+if(between(t,${INI_CAR + 1.2},${FIM_CAR}),0.8*sin(PI*(t-${INI_CAR + 1.2})/${(FIM_CAR - INI_CAR - 1.2).toFixed(2)}),0)':eval=frame,volume=0.45`, 'torcida');
// "Senna": ronco de motor passando (efeito doppler)
const [sn0, sn1] = MARCOS.senna;
fonte(aeval(`if(between(t,${sn0 - 0.4},${sn1 + 0.6}),0.5*sin(2*PI*(if(lt(t,${(sn0 + sn1) / 2}),260,170)+30*sin(2*PI*40*t))*t)*exp(-pow((t-${(sn0 + sn1) / 2})/0.45,2)),0)`), 'lowpass=f=2500,volume=0.6', 'motor');

// Feixes dourados (esquecidos): subida + plim + acorde emocionante
fonte(aeval(MARCOS.esquecidos.map((F) => `if(between(t,${f(F - 0.45)},${f(F + 0.1)}),0.5*sin(2*PI*(300+900*clip((t-${f(F - 0.45)})/0.45,0,1))*t),0)`).join('+')), 'volume=0.2', 'subida');
fonte(aeval(somaDe(MARCOS.esquecidos, '(0.6*sin(2*PI*1567.98*T)*exp(-T*7)+0.5*sin(2*PI*2093*T)*exp(-T*5))')), 'volume=0.25', 'plimFeixe');
fonte(aeval(`if(between(t,${INI_ESQ},${FIM_ESQ}),(0.4*sin(2*PI*261.6*t)+0.35*sin(2*PI*329.6*t)+0.3*sin(2*PI*392*t)+0.2*sin(2*PI*523.3*t))*clip((t-${INI_ESQ})/1,0,1)*clip((${FIM_ESQ}-t)/0.4,0,1),0)`), 'lowpass=f=2000,volume=0.14', 'pad');

// Caramelo: latidos + "pop" do chapéu
fonte(aeval(somaDe([MARCOS.caramelo[0] + 0.3, MARCOS.caramelo[0] + 0.6, MARCOS.chapeu + 0.3, MARCOS.chapeu + 0.55, MARCOS.chapeu + 1.6], '(0.7*sin(2*PI*(420-180*T/0.16)*T)+0.4*sin(2*PI*(840-300*T/0.16)*T))*lt(T,0.16)*(1-T/0.16)')), 'volume=0.45', 'latido');
fonte(aeval(somaDe([MARCOS.chapeu], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)')), 'volume=0.3', 'popChapeu');

// "Plim" dos cartões
const plins = COMENTARIOS.map((g) => g.inicio);
fonte(aeval(somaDe(plins, '(0.6*sin(2*PI*1567.98*T)*exp(-T*9)*lt(T,0.09)+0.6*sin(2*PI*2093*(T-0.09))*exp(-(T-0.09)*7)*gte(T,0.09))')), 'volume=0.22', 'plim');

// Harpia: grito, batidas de asas, costelas encaixando, tambores
fonte(aeval(somaDe([INI_HAR + 0.6], '0.6*sin(2*PI*(2700-900*T/0.7+60*sin(2*PI*25*T))*T)*lt(T,0.7)*sin(PI*T/0.7)')), 'volume=0.25', 'grito');
fonte(ruido('pink', 5), `bandpass=f=400:width_type=q:w=1,volume='if(between(t,${INI_HAR},${FIM_HAR}),(0.5+0.5*sin(2*PI*1.6*t))*0.6,0)':eval=frame,volume=0.6`, 'asas');
const pousos = MARCOS.pecasPouso;
fonte(aeval(somaDe(pousos.map((p) => p - 0.5), '0.4*sin(2*PI*(900-700*T/0.5)*T)*lt(T,0.5)')), 'volume=0.2', 'soltou');
fonte(aeval(somaDe(pousos, '(sin(2*PI*(40+60*exp(-T*7))*T)*exp(-T*2.2)+0.3*sin(2*PI*1760*T)*exp(-T*8))')), 'volume=0.9', 'pecas');
fonte(aeval(somaDe(pousos.map((p) => p + 0.07), '(sin(2*PI*130*T)*exp(-T*25)+0.4*sin(2*PI*880*T)*exp(-T*60))')), 'volume=0.5', 'carimbos');
fonte(aeval(somaDe(serie(INI_HAR + 0.4, FIM_HAR - 0.2, 0.5), 'sin(2*PI*(55+80*exp(-T*28))*T)*exp(-T*8)')), 'volume=0.4', 'tambor');

// Olho espiando: susto agudo
fonte(aeval(somaDe([MARCOS.olho[0] + 0.2], '(0.5*sin(2*PI*233.1*T)+0.5*sin(2*PI*329.6*T)+0.4*sin(2*PI*466.2*T))*exp(-T*2.5)*lt(T,1.4)')), 'volume=0.3', 'susto');
// Cartão de seguir
fonte(aeval(somaDe([MARCOS.cartao], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)') + `+${somaDe([MARCOS.toque], '0.7*sin(2*PI*2400*T)*exp(-T*90)')}`), 'volume=0.3', 'cartao');

// Pós-créditos: grilos, passos gigantes, rugido
fonte(aeval(`if(gt(t,${INI_POS + 0.9}),0.3*sin(2*PI*4400*t)*gt(sin(2*PI*14*t),0)*gt(sin(2*PI*1.4*t),0.3),0)`), 'volume=0.18', 'grilos');
fonte(aeval(somaDe(MARCOS.tremores, 'sin(2*PI*(32+30*exp(-T*5))*T)*exp(-T*1.6)+0.4*sin(2*PI*60*T)*exp(-T*4)')), 'volume=1.2', 'passos');
fonte(ruido('brown', 6), `bandpass=f=180:width_type=q:w=1.2,volume='if(between(t,${MARCOS.pegada + 0.6},${MARCOS.pegada + 2.6}),sin(PI*(t-${MARCOS.pegada + 0.6})/2)*(0.6+0.4*sin(2*PI*18*t)),0)':eval=frame,volume=6`, 'rugido');
fonte(aeval(somaDe([MARCOS.pegada + 0.6], 'lt(T,2)*sin(PI*T/2)*0.6*sin(2*PI*(70+20*sin(2*PI*2*T))*T)')), 'volume=0.7', 'rugidoGrave');

// Música
const arpejo = (ini, fim, passo, notas, vol) => {
  const idx = `mod(floor((t-${ini})/${passo}),${notas.length})`;
  let fr = String(notas[notas.length - 1]);
  for (let i = notas.length - 2; i >= 0; i--) fr = `if(eq(${idx},${i}),${notas[i]},${fr})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${fr}*${fase})+0.3*sin(4*PI*${fr}*${fase}))*exp(-${fase}*${passo < 0.2 ? 14 : 9}),0)`;
};
const heroico = [293.66, 369.99, 440, 587.33];
const feliz = [293.66, 369.99, 440, 369.99, 392, 493.88, 587.33, 493.88];
const urgente = [293.66, 349.23, 440, 349.23];
fonte(aeval([
  arpejo(INI_MULT, FIM_MULT, 0.2, heroico, '1'),
  arpejo(INI_CAR, FIM_CAR, 0.18, feliz, '0.9'),
  arpejo(INI_HAR, FIM_HAR, 0.2, heroico, '0.9'),
  arpejo(INI_FINAL, FIM_FINAL - 0.2, 0.14, urgente, '0.9'),
].join('+')), 'lowpass=f=3200,volume=0.15', 'musica');
const epico = [73.42, 146.83, 220, 293.66, 369.99, 440].map((hz, i) => `${[0.5, 0.45, 0.35, 0.3, 0.22, 0.18][i]}*sin(2*PI*${hz}*t)`).join('+');
fonte(aeval(`if(between(t,${pousos[0]},${FIM_HAR}),(${epico})*clip((t-${pousos[0]})/0.1,0,1)*clip((${FIM_HAR}-t)/0.6,0,1),0)`), 'lowpass=f=2600,volume=0.15', 'epico');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.3}:d=0.3,aformat=channel_layouts=stereo[efeitos]`);

const NARRACAO = resolve(RAIZ, 'audio/video05-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=${D},asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem voz: rode antes  node scripts/narracao.mjs --video=05');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

const VIDEO = resolve(VIDEOS, 'video-05.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', VIDEO]);

// Capa: a fila de suspeitos
const CAPA = resolve(VIDEOS, 'video-05-capa.jpg');
const ttf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '11.95', '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.62:w=iw:h=ih*0.2:color=black@0.6:t=fill,` +
    `drawtext=fontfile=${ttf}:text='TEM UM TRAIDOR':fontcolor=white:fontsize=88:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.635,` +
    `drawtext=fontfile=${ttf}:text='NA ARCA!':fontcolor=0xffd23f:fontsize=100:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.71`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${VIDEO}\n  ${CAPA}`);
