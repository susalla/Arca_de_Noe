// Monta o avulso "Noé responde comentários #1": grava a imagem (responde1.html), sintetiza
// trilha e efeitos sincronizados com js/responde1-tempos.js, mixa as vozes
// (audio/responde1-narracao.mp3) e exporta o vídeo (Instagram e TikTok) e a capa.
//
// Uso:
//   node scripts/narracao.mjs --video=responde1   # gera as vozes (só o que mudou)
//   node scripts/responde1.mjs                    # grava tudo
//   node scripts/responde1.mjs --so-audio         # reaproveita videos/responde1-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'responde1-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'responde1-trilha.wav');
const T = await import('../js/responde1-tempos.js');
const { MARCOS, COMENTARIOS, FALAS } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

// ------------------------------------------------------------ 1. Imagem
if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=responde1.html']);
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
const serie = (ini, fim, passo) => { const r = []; for (let t = ini; t < fim; t += passo) r.push(+t.toFixed(3)); return r; };
const [te0, te1] = MARCOS.terror;
const [INI_PICA, FIM_PICA] = cena('picapau');
const [INI_FINAL] = cena('final');
const [INI_INS] = cena('insistentes');

// Pergaminho abrindo
fonte(ruido('white', 3), `bandpass=f=2500:width_type=q:w=0.8,volume='if(between(t,0.1,0.7),sin(PI*(t-0.1)/0.6),0)':eval=frame,volume=0.4`, 'papel');

// "Plim" de cada cartão
const plins = COMENTARIOS.flatMap((g) => g.cartoes.map((_, j) => +(g.inicio + j * 0.2).toFixed(3)));
fonte(aeval(somaDe(plins, '(0.6*sin(2*PI*1567.98*T)*exp(-T*9)*lt(T,0.09)+0.6*sin(2*PI*2093*(T-0.09))*exp(-(T-0.09)*7)*gte(T,0.09))')), 'volume=0.24', 'plim');

// Terror relâmpago: trovão + drone + coração
fonte(ruido('brown', 4), `lowpass=f=300,volume='if(gte(t,${f(MARCOS.trovao)}),1.3*(1-exp(-(t-${f(MARCOS.trovao)})*30))*exp(-(t-${f(MARCOS.trovao)})*1.4),0)':eval=frame,volume=5.5`, 'trovao');
fonte(aeval(`if(between(t,${te0},${te1 + 0.1}),(0.6*sin(2*PI*55*t)+0.4*sin(2*PI*77.78*t))*clip((${te1 + 0.1}-t)/0.15,0,1),0)`), 'lowpass=f=800,volume=0.35', 'droneTerror');
fonte(aeval(somaDe([te0 + 0.1, te0 + 0.32], 'sin(2*PI*(50+25*exp(-T*20))*T)*exp(-T*12)')), 'volume=0.9', 'coracao');
// Cupim: "hihi" quando espia e quando acena; roendo o pergaminho
const hihi = (h) => `if(between(t,${f(h)},${f(h + 0.32)}),0.4*sin(2*PI*(1800+300*sin(2*PI*14*(t-${f(h)})))*t)*(0.5+0.5*gt(sin(2*PI*6*(t-${f(h)})),0)),0)`;
fonte(aeval(`${hihi(MARCOS.cupimEspia[0] + 0.35)}+${hihi(MARCOS.cupimMorde[1] - 1.2)}`), 'volume=0.35', 'hihi');
fonte(ruido('white', 5), `bandpass=f=3500:width_type=q:w=2,volume='if(between(t,${MARCOS.cupimMorde[0] + 0.3},${MARCOS.cupimMorde[1] - 1.4}),0.5+0.5*gt(sin(2*PI*11*t),0),0)':eval=frame,volume=0.4`, 'roendo');

// Quedas com feixe (lontra, golira): subida + plim + baque
const QUEDAS = [MARCOS.lontraCai, MARCOS.goliraCai];
fonte(aeval(QUEDAS.map((F) => `if(between(t,${f(F - 0.45)},${f(F + 0.1)}),0.5*sin(2*PI*(300+900*clip((t-${f(F - 0.45)})/0.45,0,1))*t),0)`).join('+')), 'volume=0.2', 'subida');
fonte(aeval(somaDe([MARCOS.lontraCai], '0.4*sin(2*PI*(160+60*exp(-T*20))*T)*exp(-T*9)') + `+${somaDe([MARCOS.goliraCai], 'sin(2*PI*(45+40*exp(-T*6))*T)*exp(-T*2.2)')}`), 'volume=0.9', 'baques');
// Golira batendo no peito + carimbo
fonte(aeval(somaDe(serie(MARCOS.peito[0], MARCOS.peito[1], 0.196), 'sin(2*PI*(95+50*exp(-T*30))*T)*exp(-T*14)')), 'volume=0.7', 'peito');
fonte(aeval(somaDe([MARCOS.carimboGolira + 0.05], '(sin(2*PI*130*T)*exp(-T*25)+0.4*sin(2*PI*880*T)*exp(-T*60))')), 'volume=0.6', 'carimbo');

// Lupa e camaleão: "bling" mágico
fonte(aeval(somaDe([cena('tardigrado')[0] + 1.3, MARCOS.camaleaoPisca[0]], '(0.5*sin(2*PI*1318.5*T)*exp(-T*4)+0.4*sin(2*PI*1975.5*T)*exp(-T*3.5))')), 'volume=0.22', 'bling');

// Pica-pau: metralhadora de bicadas
fonte(aeval(somaDe(serie(INI_PICA + 0.2, FIM_PICA - 0.2, 1 / 11), '(0.8*sin(2*PI*1100*T)*exp(-T*120)+0.6*sin(2*PI*420*T)*exp(-T*70))')), 'volume=0.3', 'bicadas');

// Ringue dos insistentes: sino de luta + soco + "uuuh" da plateia
fonte(aeval(somaDe([INI_INS + 0.15, INI_INS + 0.45], '0.6*sin(2*PI*1180*T)*exp(-T*3)+0.3*sin(2*PI*2360*T)*exp(-T*4)')), 'volume=0.3', 'sino');
fonte(aeval(somaDe([MARCOS.colisao], 'sin(2*PI*(60+90*exp(-T*25))*T)*exp(-T*9)')), 'volume=0.9', 'soco');
fonte(ruido('pink', 6), `bandpass=f=700:width_type=q:w=0.8,volume='if(between(t,${MARCOS.colisao + 0.1},${MARCOS.colisao + 1.3}),sin(PI*(t-${MARCOS.colisao + 0.1})/1.2),0)':eval=frame,volume=0.45`, 'uuuh');

// Trocadilho "Isso Noé da sua conta": tu-dum-tss
const fimPiada = FALAS[8][1] - 0.2;
fonte(aeval(somaDe([fimPiada, fimPiada + 0.18], 'sin(2*PI*(110+60*exp(-T*30))*T)*exp(-T*14)')), 'volume=0.7', 'badum');
fonte(ruido('white', 7), `highpass=f=6000,volume='if(gte(t,${f(fimPiada + 0.36)}),exp(-(t-${f(fimPiada + 0.36)})*5),0)':eval=frame,volume=0.35`, 'tss');

// Mosquito: zumbido + PLAFT
const [z0, z1] = MARCOS.zumbido;
fonte(aeval(`if(between(t,${z0},${MARCOS.plaft}),0.4*sin(2*PI*(620+60*sin(2*PI*7*t)+30*sin(2*PI*31*t))*t),0)`), 'volume=0.35', 'zumbido');
fonte(ruido('white', 8), `bandpass=f=1800:width_type=q:w=0.6,volume='if(gte(t,${f(MARCOS.plaft)}),exp(-(t-${f(MARCOS.plaft)})*35),0)':eval=frame,volume=2.2`, 'plaft');

// Cartão de seguir: pop e clique
fonte(aeval(somaDe([MARCOS.cartao], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)') + `+${somaDe([MARCOS.toque], '0.7*sin(2*PI*2400*T)*exp(-T*90)')}`), 'volume=0.3', 'cartao');

// Música: pizzicato cômico o tempo todo (some no terror e no zumbido), animada no final
const arpejo = (ini, fim, passo, notas, vol) => {
  const idx = `mod(floor((t-${ini})/${passo}),${notas.length})`;
  let fr = String(notas[notas.length - 1]);
  for (let i = notas.length - 2; i >= 0; i--) fr = `if(eq(${idx},${i}),${notas[i]},${fr})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${fr}*${fase})+0.3*sin(4*PI*${fr}*${fase}))*exp(-${fase}*${passo < 0.2 ? 14 : 9}),0)`;
};
const pizz = [392, 0, 493.88, 587.33, 392, 0, 523.25, 493.88, 440, 0, 523.25, 659.25, 587.33, 0, 493.88, 392];
const feliz = [293.66, 369.99, 440, 369.99, 392, 493.88, 587.33, 493.88];
fonte(aeval([
  arpejo(0, te0 - 0.05, 0.28, pizz, '0.8'),
  arpejo(te1 + 0.2, z0, 0.28, pizz, '0.8'),
  arpejo(MARCOS.plaft + 0.3, INI_FINAL, 0.28, pizz, '0.8'),
  arpejo(INI_FINAL, D - 0.2, 0.18, feliz, '0.9'),
].join('+')), 'lowpass=f=3200,volume=0.15', 'musica');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.3}:d=0.3,aformat=channel_layouts=stereo[efeitos]`);

// Vozes com ducking
const NARRACAO = resolve(RAIZ, 'audio/responde1-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=${D},asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem vozes: rode antes  node scripts/narracao.mjs --video=responde1');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

// ------------------------------------------------------------ 3. Exportar
const VIDEO = resolve(VIDEOS, 'responde-1.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', VIDEO]);

// Capa: o Noé de olho vermelho (a chantagem do cupim)
const CAPA = resolve(VIDEOS, 'responde-1-capa.jpg');
const ttf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '5.0', '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.62:w=iw:h=ih*0.2:color=black@0.6:t=fill,` +
    `drawtext=fontfile=${ttf}:text='NOÉ RESPONDE #1':fontcolor=white:fontsize=84:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.635,` +
    `drawtext=fontfile=${ttf}:text='CHANTAGEM COM CUPIM?!':fontcolor=0xffd23f:fontsize=76:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.72`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${VIDEO}\n  ${CAPA}`);
