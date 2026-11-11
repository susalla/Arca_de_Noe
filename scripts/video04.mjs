// Monta o vídeo 04 ("Era pra ser 200… chegaram 378!"): grava a imagem (video04.html),
// sintetiza trilha e efeitos sincronizados com js/video04-tempos.js, mixa as vozes
// (audio/video04-narracao.mp3) e exporta o vídeo (Instagram e TikTok) e a capa.
//
// Uso:
//   node scripts/narracao.mjs --video=04     # gera as vozes (só o que mudou)
//   node scripts/video04.mjs                 # grava tudo
//   node scripts/video04.mjs --so-audio      # reaproveita videos/video04-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'video04-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'video04-trilha.wav');
const T = await import('../js/video04-tempos.js');
const { MARCOS, COMENTARIOS } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

// ------------------------------------------------------------ 1. Imagem
if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=video04.html']);
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
const [INI_CONT, FIM_CONT] = cena('contador');
const [INI_FAIXA] = cena('faixa');
const [INI_MULT, FIM_MULT] = cena('multidao');
const [INI_UP, FIM_UP] = cena('upgrade');
const [INI_PAN, FIM_PAN] = cena('panorama');
const [INI_FINAL] = cena('final');
const serie = (ini, fim, passo) => { const r = []; for (let t = ini; t < fim; t += passo) r.push(+t.toFixed(3)); return r; };
const env = (tempos, expr) => tempos.map((h) => `if(gte(t,${f(h)}),${expr.replaceAll('T', `(t-${f(h)})`)},0)`).join('+') || '0';

// Contador: tique-tique subindo; língua de sogra + confete no 200; rufar até o 378; impacto
const [a0, a1] = MARCOS.contaAte200;
const [b0, b1] = MARCOS.contaAte378;
fonte(aeval(somaDe([...serie(a0, a1, 0.09), ...serie(b0, b1, 0.06)], '0.4*sin(2*PI*2400*T)*exp(-T*70)')), 'volume=0.3', 'tiques');
fonte(aeval(`if(between(t,${f(MARCOS.confete)},${f(MARCOS.confete + 0.6)}),0.5*sin(2*PI*(380+60*sin(2*PI*6*t))*t)*(1+0.6*sin(2*PI*760*t)),0)`), 'lowpass=f=3000,volume=0.3', 'linguaDeSogra');
fonte(aeval(somaDe(serie(MARCOS.confete, MARCOS.confete + 0.4, 0.05), '0.5*sin(2*PI*(500+1500*T)*T)*exp(-T*25)')), 'volume=0.25', 'popsConfete');
fonte(ruido('white', 3), `highpass=f=900,lowpass=f=5000,volume='if(between(t,${b0},${b1}),(0.5+0.5*gt(sin(2*PI*28*t),0))*clip((t-${b0})/(${b1}-${b0}),0.2,1),0)':eval=frame,volume=0.6`, 'rufar');
fonte(aeval(somaDe([b1], 'sin(2*PI*(45+40*exp(-T*6))*T)*exp(-T*2)+0.4*sin(2*PI*90*T)*exp(-T*3)')), 'volume=1.0', 'impacto');
fonte(ruido('pink', 4), `bandpass=f=900:width_type=q:w=0.7,volume='if(between(t,${b1 + 0.05},${b1 + 1.1}),sin(PI*(t-${b1 + 0.05})/1.05),0)':eval=frame,volume=0.5`, 'espanto');

// Vizinho rabiscando com carvão
fonte(ruido('white', 5), `bandpass=f=3000:width_type=q:w=1.5,volume='if(between(t,${MARCOS.rabisco[0]},${MARCOS.escreve[1]}),0.5+0.5*gt(sin(2*PI*7*t),0),0)':eval=frame,volume=0.35`, 'rabisco');

// Multidão: pops dos feixes + torcida
fonte(aeval(somaDe(serie(MARCOS.multidao[0] + 0.5, MARCOS.multidao[0] + MARCOS.multidao[1] + 0.5, 0.11), '0.5*sin(2*PI*(500+1500*T)*T)*exp(-T*20)')), 'volume=0.22', 'pops');
fonte(ruido('pink', 6), `bandpass=f=1200:width_type=q:w=0.6,volume='if(between(t,${INI_MULT + 0.4},${FIM_MULT}),sin(PI*(t-${INI_MULT + 0.4})/${(FIM_MULT - INI_MULT - 0.4).toFixed(2)})*(0.7+0.3*sin(2*PI*3*t)),0)+if(between(t,${INI_PAN},${FIM_PAN}),0.5*sin(PI*(t-${INI_PAN})/${(FIM_PAN - INI_PAN).toFixed(2)}),0)':eval=frame,volume=0.45`, 'torcida');

// Carroça: cascos, rangido e parada
const [c0, c1] = MARCOS.carroca;
fonte(aeval(somaDe(serie(c0, c1, 0.26).flatMap((h) => [h, h + 0.09]), '(0.8*sin(2*PI*(700+300*exp(-T*80))*T)*exp(-T*55)+0.3*sin(2*PI*180*T)*exp(-T*30))')), 'volume=0.35', 'cascos');
fonte(aeval(`if(between(t,${c0},${c1}),0.25*sin(2*PI*(160+40*sin(2*PI*1.3*t))*t)*(0.5+0.5*sin(2*PI*2.2*t)),0)`), 'bandpass=f=400:width_type=q:w=1,volume=0.5', 'rangido');
fonte(aeval(somaDe([c1], 'sin(2*PI*(70+40*exp(-T*12))*T)*exp(-T*7)')), 'volume=0.7', 'paradaCarroca');

// Feixes dourados (@rodri.cuts e o 2º elefante): subida + plim
const FEIXES = [MARCOS.feixeRodri, MARCOS.feixeElefante];
fonte(aeval(FEIXES.map((F) => `if(between(t,${f(F - 0.45)},${f(F + 0.1)}),0.5*sin(2*PI*(300+900*clip((t-${f(F - 0.45)})/0.45,0,1))*t),0)`).join('+')), 'volume=0.22', 'subida');
fonte(aeval(somaDe(FEIXES, '(0.6*sin(2*PI*1567.98*T)*exp(-T*7)+0.5*sin(2*PI*2093*T)*exp(-T*5)+0.3*sin(2*PI*2637*T)*exp(-T*4))')), 'volume=0.28', 'plim');

// Placa caindo + marteladas cravando
fonte(aeval(somaDe([MARCOS.placa], 'sin(2*PI*(90+60*exp(-T*25))*T)*exp(-T*9)')), 'volume=0.8', 'placa');
fonte(aeval(somaDe(MARCOS.marteladasPlaca, '(0.9*sin(2*PI*(170+90*exp(-T*40))*T)*exp(-T*28)+0.5*sin(2*PI*1250*T)*exp(-T*90))')), 'volume=0.55', 'marteladas');

// Elefante: baque + barrito (trombeta) + "aaah" fofo
const F2 = MARCOS.feixeElefante;
fonte(aeval(somaDe([F2], 'sin(2*PI*(45+40*exp(-T*6))*T)*exp(-T*2.2)')), 'volume=1.0', 'baque');
fonte(aeval(somaDe([F2 + 0.35], 'lt(T,0.9)*sin(PI*T/0.9)*0.7*sin(2*PI*(520+180*sin(2*PI*1.1*T)+30*sin(2*PI*31*T))*T)')), 'bandpass=f=900:width_type=q:w=0.8,volume=0.9', 'barrito');
fonte(aeval(somaDe([F2 + 0.5, F2 + 0.8, F2 + 1.1], '0.4*sin(2*PI*(1046.5+200*T)*T)*exp(-T*5)')), 'volume=0.2', 'coracoes');

// "EU" caindo: um pop por balão
fonte(aeval(somaDe(serie(MARCOS.baloes[0] + 0.3, MARCOS.baloes[1] + 0.3, (MARCOS.baloes[1] - MARCOS.baloes[0]) / 28), '0.5*sin(2*PI*(700+600*T)*T)*exp(-T*28)')), 'volume=0.22', 'baloes');

// "Plim" de cada cartão de comentário
const plins = COMENTARIOS.flatMap((g) => g.cartoes.map((_, j) => +(g.inicio + j * 0.2).toFixed(3)));
fonte(aeval(somaDe(plins, '(0.6*sin(2*PI*1567.98*T)*exp(-T*9)*lt(T,0.09)+0.6*sin(2*PI*2093*(T-0.09))*exp(-(T-0.09)*7)*gte(T,0.09))')), 'volume=0.24', 'plimCartao');

// Upgrade: tambores + impacto e carimbo a cada costela
const pecas = [0, 1, 2, 3, 4, 5].map((k) => +(MARCOS.pecasInicio + k * MARCOS.pecasPasso + 0.8).toFixed(3));
const tambores = serie(INI_UP + 0.4, FIM_UP - 0.2, 0.5);
fonte(aeval(somaDe(tambores, 'sin(2*PI*(55+80*exp(-T*28))*T)*exp(-T*8)')), 'volume=0.42', 'tambor');
fonte(ruido('white', 7), `highpass=f=1800,volume='${env(tambores.map((t) => t + 0.25), 'exp(-T*26)')}':eval=frame,volume=0.25`, 'caixa');
fonte(aeval(somaDe(pecas, '(sin(2*PI*(40+60*exp(-T*7))*T)*exp(-T*2.2)+0.3*sin(2*PI*1760*T)*exp(-T*8))')), 'volume=0.9', 'pecas');
fonte(aeval(somaDe(pecas.map((p) => p + 0.07), '(sin(2*PI*130*T)*exp(-T*25)+0.4*sin(2*PI*880*T)*exp(-T*60))')), 'volume=0.5', 'carimbos');

// Cupim: rangidinho de mandíbula + "hihi" agudo; cartão: pop e clique
fonte(aeval(somaDe(serie(MARCOS.cupimEspia[0] + 0.3, MARCOS.cupimEspia[0] + 1.0, 0.07), '0.5*sin(2*PI*3200*T)*exp(-T*90)') + `+${somaDe([MARCOS.cupimEspia[0] + 1.1], 'lt(T,0.35)*0.4*sin(2*PI*(1800+300*sin(2*PI*14*T))*T)')}`), 'volume=0.3', 'cupim');
fonte(aeval(somaDe([MARCOS.cartao], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)') + `+${somaDe([MARCOS.toque], '0.7*sin(2*PI*2400*T)*exp(-T*90)')}`), 'volume=0.3', 'cartao');

// Música
const arpejo = (ini, fim, passo, notas, vol) => {
  const idx = `mod(floor((t-${ini})/${passo}),${notas.length})`;
  let fr = String(notas[notas.length - 1]);
  for (let i = notas.length - 2; i >= 0; i--) fr = `if(eq(${idx},${i}),${notas[i]},${fr})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${fr}*${fase})+0.3*sin(4*PI*${fr}*${fase}))*exp(-${fase}*${passo < 0.2 ? 14 : 9}),0)`;
};
const feliz = [261.63, 329.63, 392, 523.25, 392, 329.63, 349.23, 440, 523.25, 440, 392, 493.88];
const pizz = [392, 0, 493.88, 587.33, 392, 0, 523.25, 493.88];
const heroico = [293.66, 369.99, 440, 587.33];
const urgente = [293.66, 349.23, 440, 349.23];
const musica = [
  arpejo(0, INI_CONT, 0.25, feliz, '0.8'),
  arpejo(INI_FAIXA, INI_MULT, 0.3, pizz, '0.8'),
  arpejo(INI_MULT, FIM_MULT, 0.2, heroico, '1'),
  arpejo(FIM_MULT, INI_UP, 0.3, pizz, '0.7'),
  arpejo(INI_UP, FIM_PAN, 0.2, heroico, '0.9'),
  arpejo(INI_FINAL, D - 0.2, 0.14, urgente, '0.9'),
].join('+');
fonte(aeval(musica), 'lowpass=f=3200,volume=0.15', 'musica');
// Subida de tensão no contador
fonte(aeval(`if(between(t,${b0},${b1}),pow((t-${b0})/${(b1 - b0).toFixed(2)},2)*0.6*sin(2*PI*(120+500*pow((t-${b0})/${(b1 - b0).toFixed(2)},2))*t),0)`), 'volume=0.25', 'tensao');
const epico = [73.42, 146.83, 220, 293.66, 369.99, 440].map((hz, i) => `${[0.5, 0.45, 0.35, 0.3, 0.22, 0.18][i]}*sin(2*PI*${hz}*t)`).join('+');
fonte(aeval(`if(between(t,${pecas[0]},${FIM_PAN}),(${epico})*clip((t-${pecas[0]})/0.1,0,1)*clip((${FIM_PAN}-t)/0.6,0,1),0)`), 'lowpass=f=2600,volume=0.16', 'epico');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.3}:d=0.3,aformat=channel_layouts=stereo[efeitos]`);

// Vozes com ducking
const NARRACAO = resolve(RAIZ, 'audio/video04-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=${D},asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem vozes: rode antes  node scripts/narracao.mjs --video=04');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

// ------------------------------------------------------------ 3. Exportar (um arquivo para Instagram e TikTok)
const VIDEO = resolve(VIDEOS, 'video-04.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', VIDEO]);

// Capa: o contador marcando 378 com o Noé de mãos na cabeça
const CAPA = resolve(VIDEOS, 'video-04-capa.jpg');
const ttf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '8.15', '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.62:w=iw:h=ih*0.2:color=black@0.6:t=fill,` +
    `drawtext=fontfile=${ttf}:text='ERA PRA SER 200…':fontcolor=white:fontsize=78:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.635,` +
    `drawtext=fontfile=${ttf}:text='CHEGARAM 378!':fontcolor=0xffd23f:fontsize=108:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.71`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${VIDEO}\n  ${CAPA}`);
