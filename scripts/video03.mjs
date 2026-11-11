// Monta o vídeo 03 ("A chuva está chegando"): grava a imagem (video03.html),
// sintetiza trilha e efeitos sincronizados com js/video03-tempos.js, mixa a
// narração (audio/video03-narracao.mp3) e exporta o vídeo (Instagram e TikTok) e a capa.
//
// Uso:
//   node scripts/narracao.mjs --video=03     # gera a voz (só o que mudou)
//   node scripts/video03.mjs                 # grava tudo
//   node scripts/video03.mjs --so-audio      # reaproveita videos/video03-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'video03-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'video03-trilha.wav');
const T = await import('../js/video03-tempos.js');
const { MARCOS, COMENTARIOS } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

// ------------------------------------------------------------ 1. Imagem
if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=video03.html']);
}

// ------------------------------------------------------------ 2. Trilha
const f = (n) => n.toFixed(3);
const somaDe = (tempos, expr) => tempos.map((h) => `if(gte(t,${f(h)}),${expr.replaceAll('T', `(t-${f(h)})`)},0)`).join('+') || '0';
const env = (tempos, expr) => tempos.map((h) => `if(gte(t,${f(h)}),${expr.replaceAll('T', `(t-${f(h)})`)},0)`).join('+') || '0';
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
const [INI_ARCA] = cena('arca');
const [INI_MULT, FIM_MULT] = cena('multidao');
const [INI_UP, FIM_UP] = cena('upgrade');
const [INI_FINAL] = cena('final');

// Trovões dos raios (estalo seco + estrondo) e ronco de tempestade no começo
const TROVOES = T.RAIOS.map((r, i) => [r + 0.05, [1.2, 1.0, 1.1][i]]);
fonte(ruido('brown', 3), `lowpass=f=300,volume='${TROVOES.map(([h, s]) => `if(gte(t,${f(h)}),${s}*(1-exp(-(t-${f(h)})*30))*exp(-(t-${f(h)})*0.8)*(0.75+0.25*sin(2*PI*5*t)),0)`).join('+')}+if(lt(t,1.1),0.35*t/1.1,0)':eval=frame,volume=5.5`, 'trovao');
fonte(ruido('white', 4), `highpass=f=1500,lowpass=f=8000,volume='${env(TROVOES.map((x) => x[0]), 'exp(-T*9)')}':eval=frame,volume=0.7`, 'estalo');

// Vento forte no gancho/desespero; chuva no final
fonte(ruido('pink', 5), `bandpass=f=700:width_type=q:w=0.6,volume='if(lt(t,7.2),0.6+0.4*sin(2*PI*0.5*t),0)+if(gt(t,${INI_FINAL}),0.7,0)':eval=frame,volume=0.5`, 'vento');
fonte(ruido('pink', 6), `highpass=f=700,lowpass=f=9000,volume='if(gt(t,${MARCOS.chuvaFinal[0]}),clip((t-${MARCOS.chuvaFinal[0]})/1.6,0,1),0)':eval=frame,volume=0.32`, 'chuva');

// Bando fugindo: batidas de asas + piados
fonte(ruido('pink', 7), `bandpass=f=1800:width_type=q:w=0.9,volume='if(lt(t,3.4),(0.5+0.5*sin(2*PI*13*t))*sin(PI*clip(t/3.4,0,1)),0)':eval=frame,volume=0.9`, 'asas');
const piados = [0.25, 0.6, 0.85, 1.4, 1.75, 2.1, 2.6];
fonte(aeval(somaDe(piados, '0.5*sin(2*PI*(3200-1400*T/0.18)*T)*lt(T,0.18)*(1-T/0.18)')), 'volume=0.25', 'piados');

// Desespero: passos correndo + subida de tensão até o "AGORA!"
const passos = [];
for (let t = 3.3; t < 5.6; t += 0.19) passos.push(+t.toFixed(3));
fonte(aeval(somaDe(passos, 'sin(2*PI*(90+60*exp(-T*30))*T)*exp(-T*22)')), 'volume=0.6', 'passos');
fonte(aeval('if(between(t,3.4,5.85),pow((t-3.4)/2.45,2)*0.6*sin(2*PI*(120+500*pow((t-3.4)/2.45,2))*t),0)'), 'volume=0.3', 'tensao');
fonte(aeval(somaDe([5.88], 'sin(2*PI*(45+40*exp(-T*6))*T)*exp(-T*2)')), 'volume=1.0', 'impactoAgora');

// Reviravolta: grito da águia ao longe, asas no pouso, "tchan-tchan" do urubu
fonte(aeval(somaDe([7.45, 8.1], '0.6*sin(2*PI*(2700-900*T/0.6+60*sin(2*PI*25*T))*T)*lt(T,0.6)*sin(PI*T/0.6)')), 'volume=0.22', 'aguia');
const pousosAves = [MARCOS.aguiaPousa, MARCOS.gaviaoPousa, MARCOS.urubuPousa, MARCOS.picapauPousa];
fonte(ruido('pink', 8), `bandpass=f=1400:width_type=q:w=1,volume='${env(pousosAves.map((p) => p - 0.5), 'lt(T,0.55)*(0.5+0.5*sin(2*PI*16*T))*sin(PI*T/0.55)')}':eval=frame,volume=1.1`, 'pousoAsas');
fonte(aeval(somaDe([MARCOS.urubuPousa + 0.55, MARCOS.urubuPousa + 0.85], '0.8*sin(2*PI*110*T)*exp(-T*4)+0.4*sin(2*PI*220*T)*exp(-T*5)') + `+${somaDe([MARCOS.urubuPousa + 0.85], '0.6*sin(2*PI*103.8*T)*exp(-T*2.5)')}`), 'volume=0.35', 'tchan');

// Pica-pau: metralhadora de bicadas na madeira (11 por segundo)
const bicadas = [];
for (let t = MARCOS.bicadas[0] + 0.045; t < MARCOS.bicadas[1]; t += 1 / 11) bicadas.push(+t.toFixed(3));
fonte(aeval(somaDe(bicadas, '(0.8*sin(2*PI*1100*T)*exp(-T*120)+0.6*sin(2*PI*420*T)*exp(-T*70))')), 'volume=0.35', 'bicadas');

// Silêncio constrangedor com grilos enquanto o Noé encara a câmera
const [e0, e1] = MARCOS.encarar;
fonte(aeval(`if(between(t,${f(e0)},${f(e1 + 0.2)}),0.4*sin(2*PI*4400*t)*gt(sin(2*PI*14*t),0)*gt(sin(2*PI*1.6*(t-${f(e0)})),0),0)`), 'volume=0.25', 'grilos');

// Multidão: brilho dos feixes, pops, torcida; cachorro, leões e pantera
const pops = [];
for (let i = 10; i < 75; i += 3) pops.push(+(MARCOS.multidao[0] + ((i - 10) / 65) * MARCOS.multidao[1] + 0.5).toFixed(3));
fonte(aeval(somaDe(pops, '0.5*sin(2*PI*(500+1500*T)*T)*exp(-T*20)')), 'volume=0.25', 'pops');
fonte(ruido('pink', 9), `bandpass=f=1200:width_type=q:w=0.6,volume='if(between(t,${INI_MULT + 0.4},${FIM_MULT}),sin(PI*(t-${INI_MULT + 0.4})/${(FIM_MULT - INI_MULT - 0.4).toFixed(2)})*(0.7+0.3*sin(2*PI*3*t)),0)':eval=frame,volume=0.45`, 'torcida');
const latidos = [MARCOS.cachorroPousa + 0.15, MARCOS.cachorroPousa + 0.42];
fonte(aeval(somaDe(latidos, '(0.7*sin(2*PI*(420-180*T/0.16)*T)+0.4*sin(2*PI*(840-300*T/0.16)*T))*lt(T,0.16)*(1-T/0.16)')), 'volume=0.4', 'latido');
fonte(ruido('brown', 10), `bandpass=f=220:width_type=q:w=1.4,volume='${env([MARCOS.leao1Pousa + 0.15], 'lt(T,1.5)*(0.6+0.4*sin(2*PI*22*T))*sin(PI*T/1.5)')}+${env([MARCOS.panteraPousa + 0.1], 'lt(T,0.9)*(0.6+0.4*sin(2*PI*30*T))*sin(PI*T/0.9)*0.7')}':eval=frame,volume=7`, 'rugido');
fonte(aeval(somaDe([MARCOS.leao1Pousa + 0.15], 'lt(T,1.5)*sin(PI*T/1.5)*0.6*sin(2*PI*(85+20*sin(2*PI*3*T))*T)')), 'volume=0.6', 'rugidoGrave');
fonte(aeval(somaDe([MARCOS.cachorroPousa, MARCOS.leao1Pousa, MARCOS.leao2Pousa, MARCOS.panteraPousa], '(sin(2*PI*(55+90*exp(-T*25))*T)*exp(-T*10))')), 'volume=0.55', 'baques');

// "Plim" quando aparece cada print
const plins = COMENTARIOS.flatMap((g) => g.prints.map((_, j) => +(g.inicio + j * 0.15).toFixed(3)));
fonte(aeval(somaDe(plins, '(0.6*sin(2*PI*1567.98*T)*exp(-T*9)*lt(T,0.09)+0.6*sin(2*PI*2093*(T-0.09))*exp(-(T-0.09)*7)*gte(T,0.09))')), 'volume=0.26', 'plim');

// Upgrade: tambores épicos, impacto + brilho a cada peça, carimbos
const pecas = [0, 1, 2].map((k) => +(MARCOS.pecasInicio + k * MARCOS.pecasPasso + 0.8).toFixed(3));
const tambores = [];
for (let t = INI_UP + 0.75; t < FIM_UP - 0.2; t += 0.5) tambores.push(+t.toFixed(3)); // começa depois do "Quilha"
fonte(aeval(somaDe(tambores, 'sin(2*PI*(55+80*exp(-T*28))*T)*exp(-T*8)')), 'volume=0.42', 'tambor');
fonte(ruido('white', 11), `highpass=f=1800,volume='${env(tambores.map((t) => t + 0.25), 'exp(-T*26)')}':eval=frame,volume=0.25`, 'caixa');
fonte(aeval(somaDe(pecas, '(sin(2*PI*(40+60*exp(-T*7))*T)*exp(-T*2.2)+0.3*sin(2*PI*1760*T)*exp(-T*8))')), 'volume=1.0', 'pecas');
fonte(aeval(somaDe(pecas.map((p) => p + 0.07), '(sin(2*PI*130*T)*exp(-T*25)+0.4*sin(2*PI*880*T)*exp(-T*60))')), 'volume=0.5', 'carimbos');

// Cartão: pop e clique
fonte(aeval(somaDe([MARCOS.cartao], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)') + `+${somaDe([MARCOS.toque], '0.7*sin(2*PI*2400*T)*exp(-T*90)')}`), 'volume=0.3', 'cartao');

// Música: drone tenso → pizzicato cômico (corta no silêncio) → heroico → épico → urgente
const drone = '(0.5*sin(2*PI*73.42*t)+0.35*sin(2*PI*110*t)+0.25*sin(2*PI*146.83*t)+0.2*sin(2*PI*174.61*t))*(0.8+0.2*sin(2*PI*0.4*t))';
fonte(aeval(`(${drone})*(if(lt(t,7.0),0.6+0.4*clip(t/6,0,1),0)+if(between(t,${INI_UP},${D}),0.5+0.5*clip((t-${INI_FINAL})/3,0,1),0))`), 'lowpass=f=1000,volume=0.2', 'drone');
const arpejo = (ini, fim, passo, notas, vol) => {
  const idx = `mod(floor((t-${ini})/${passo}),${notas.length})`;
  let fr = String(notas[notas.length - 1]);
  for (let i = notas.length - 2; i >= 0; i--) fr = `if(eq(${idx},${i}),${notas[i]},${fr})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${fr}*${fase})+0.3*sin(4*PI*${fr}*${fase}))*exp(-${fase}*${passo < 0.2 ? 14 : 10}),0)`;
};
const pizz = arpejo(7.0, e0 - 0.05, 0.3, [392, 0, 493.88, 587.33, 392, 0, 523.25, 493.88], '0.8');
const heroico = arpejo(INI_MULT, FIM_MULT, 0.2, [293.66, 369.99, 440, 587.33], '1');
const urgente = arpejo(INI_FINAL, D - 0.2, 0.14, [293.66, 349.23, 440, 349.23], '0.9');
fonte(aeval(`${pizz}+${heroico}+${urgente}+${arpejo(e1 + 0.2, INI_MULT, 0.3, [392, 493.88, 587.33, 493.88], '0.6')}`), 'lowpass=f=3200,volume=0.16', 'musica');
const epico = [73.42, 146.83, 220, 293.66, 369.99, 440].map((hz, i) => `${[0.5, 0.45, 0.35, 0.3, 0.22, 0.18][i]}*sin(2*PI*${hz}*t)`).join('+');
fonte(aeval(`if(between(t,${pecas[0]},${FIM_UP}),(${epico})*clip((t-${pecas[0]})/0.1,0,1)*clip((${FIM_UP}-t)/0.6,0,1),0)`), 'lowpass=f=2600,volume=0.18', 'epico');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.25}:d=0.25,aformat=channel_layouts=stereo[efeitos]`);

// Narração com ducking
const NARRACAO = resolve(RAIZ, 'audio/video03-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=${D},asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem narração: rode antes  node scripts/narracao.mjs --video=03');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

// ------------------------------------------------------------ 3. Exportar (um arquivo para Instagram e TikTok)
const VIDEO = resolve(VIDEOS, 'video-03.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', VIDEO]);

// Capa: o Noé desesperado com os braços para o céu
const CAPA = resolve(VIDEOS, 'video-03-capa.jpg');
const ttf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '6.75', '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.62:w=iw:h=ih*0.2:color=black@0.55:t=fill,` +
    `drawtext=fontfile=${ttf}:text='A CHUVA':fontcolor=0xffd23f:fontsize=112:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.635,` +
    `drawtext=fontfile=${ttf}:text='ESTÁ CHEGANDO':fontcolor=white:fontsize=86:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.725`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${VIDEO}\n  ${CAPA}`);
