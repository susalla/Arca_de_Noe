// Monta o vídeo 06 ("O roubo da madeira"): grava a imagem (video06.html), sintetiza trilha e
// efeitos sincronizados com js/video06-tempos.js, mixa as vozes (audio/video06-narracao.mp3)
// e exporta o vídeo (Instagram e TikTok) e a capa.
//
// Uso:
//   node scripts/narracao.mjs --video=06     # gera as vozes (só o que mudou)
//   node scripts/video06.mjs                 # grava tudo
//   node scripts/video06.mjs --so-audio      # reaproveita videos/video06-imagem.mp4
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'video06-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'video06-trilha.wav');
const T = await import('../js/video06-tempos.js');
const { MARCOS: M, COMENTARIOS } = T;
const D = T.DURACAO;
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=video06.html']);
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
const janela = (a, b, sobe = 0.3, desce = 0.3) => `clip((t-${a})/${sobe},0,1)*clip((${b}-t)/${desce},0,1)*between(t,${a},${b})`;
const [, FIM_TIT] = cena('titulo');
const [INI_FIO, FIM_FIO] = cena('fio');
const [INI_TREX] = cena('trex');
const [INI_BRACO, FIM_BRACO] = cena('braco');
const [INI_MULT, FIM_MULT] = cena('multidao');
const [INI_ANIME, FIM_ANIME] = cena('anime');
const [INI_OBRA, FIM_OBRA] = cena('obra');
const [INI_INS, FIM_INS] = cena('insistentes');
const [INI_FINAL, FIM_FINAL] = cena('final');
const [INI_POS] = cena('poscreditos');

// ---------------------------------------------------------------- Noite do roubo
fonte(ruido('pink', 1), `highpass=f=700,lowpass=f=9000,volume='${janela(0, FIM_TIT, 0.4, 0.6)}':eval=frame,volume=0.3`, 'chuva');
fonte(ruido('brown', 2), `lowpass=f=300,volume='${M.raios.map((h, k) => `if(gte(t,${f(h)}),${[0.8, 1.0, 1.4][k]}*(1-exp(-(t-${f(h)})*30))*exp(-(t-${f(h)})*0.8)*(0.75+0.25*sin(2*PI*5*t)),0)`).join('+')}':eval=frame,volume=5.5`, 'trovao');
fonte(ruido('brown', 3), `bandpass=f=260:width_type=q:w=1.5,volume='${janela(0.2, 2.7, 0.2, 0.3)}*(0.6+0.4*sin(2*PI*1.8*t))':eval=frame,volume=1.6`, 'arrasto');
fonte(aeval(`if(lt(t,${FIM_TIT}),(0.6*sin(2*PI*55*t)+0.4*sin(2*PI*82.4*t)+0.25*sin(2*PI*58.3*t))*clip(t/0.8,0,1)*clip((${FIM_TIT}-t)/0.6,0,1),0)`), 'lowpass=f=700,volume=0.28', 'drone');
// BRAAAM do título
const braam = [55, 110, 165, 220, 277.2, 330].map((hz, i) => `${[0.6, 0.5, 0.35, 0.3, 0.2, 0.15][i]}*sin(2*PI*${hz}*T+${0.3 * i}*sin(2*PI*3*T))`).join('+');
fonte(aeval(somaDe([M.titulo], `(${braam})*clip(T/0.08,0,1)*exp(-T*0.9)*lt(T,3)`)), 'lowpass=f=1800,volume=0.5', 'braam');

// ---------------------------------------------------------------- Cena do crime
fonte(aeval(somaDe([7.35], '(0.6*sin(2*PI*146.8*T)+0.4*sin(2*PI*220*T))*exp(-T*3)')), 'lowpass=f=2500,volume=0.3', 'dun');
fonte(aeval(somaDe([9.7], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)')), 'volume=0.3', 'popChapeu');
fonte(aeval(somaDe([M.lupa[1]], '0.35*(sin(2*PI*(1800+1200*T)*T)+sin(2*PI*(2700+1500*T)*T))*exp(-T*3)*lt(T,1.2)')), 'volume=0.18', 'brilhoLupa');
const andando = [110, 130.8, 146.8, 164.8, 174.6, 164.8, 146.8, 130.8];
let fr = String(andando[7]);
const idx = `mod(floor((t-${INI_FIO})/0.32),8)`;
for (let i = 6; i >= 0; i--) fr = `if(eq(${idx},${i}),${andando[i]},${fr})`;
fonte(aeval(`if(between(t,${INI_FIO},${FIM_FIO}),0.7*sin(2*PI*${fr}*t)*exp(-mod(t-${INI_FIO},0.32)*6),0)`), 'lowpass=f=700,volume=0.32', 'baixoNoir');
const assobio = [[0, 988], [0.25, 1175], [0.5, 1319], [0.8, 1175], [1.05, 988]].map(([d, hz]) => [M.vizinho + 0.1 + d, hz]);
fonte(aeval(assobio.map(([h, hz]) => `if(between(t,${h},${h + 0.22}),0.4*sin(2*PI*${hz}*t+0.5*sin(2*PI*6*t))*sin(PI*(t-${h})/0.22),0)`).join('+')), 'volume=0.28', 'assobio');
fonte(aeval(somaDe(serie(M.cupimRi[0] + 0.2, M.cupimRi[1] - 0.2, 0.16), '0.5*sin(2*PI*(1500-400*T/0.1)*T)*lt(T,0.1)*sin(PI*T/0.1)')), 'volume=0.22', 'risadinha');

// ---------------------------------------------------------------- T-rex
fonte(aeval(somaDe(M.passos, 'sin(2*PI*(32+30*exp(-T*5))*T)*exp(-T*1.6)+0.4*sin(2*PI*60*T)*exp(-T*4)')), 'volume=1.2', 'passos');
const [r0, r1] = M.rugido;
fonte(ruido('brown', 6), `bandpass=f=200:width_type=q:w=1.0,volume='if(between(t,${r0},${r1}),sin(PI*(t-${r0})/${(r1 - r0).toFixed(2)})*(0.6+0.4*sin(2*PI*22*t)),0)':eval=frame,volume=7`, 'rugido');
fonte(aeval(`if(between(t,${r0},${r1}),sin(PI*(t-${r0})/${(r1 - r0).toFixed(2)})*0.6*sin(2*PI*(75+25*sin(2*PI*3*t))*t),0)`), 'volume=0.75', 'rugidoGrave');
fonte(aeval(somaDe([M.torasCaem + 0.45, M.torasCaem + 0.55, M.torasCaem + 0.68, M.torasCaem + 0.8], '(0.8*sin(2*PI*(140+60*exp(-T*30))*T)*exp(-T*14)+0.3*sin(2*PI*420*T)*exp(-T*30))')), 'volume=0.6', 'toras');
fonte(aeval(`if(between(t,${r1 + 0.3},${INI_BRACO}),(0.4*sin(2*PI*261.6*t)+0.35*sin(2*PI*329.6*t)+0.3*sin(2*PI*392*t))*clip((t-${r1 + 0.3})/1,0,1)*clip((${INI_BRACO}-t)/0.4,0,1),0)`), 'lowpass=f=2000,volume=0.12', 'alivio');
// Bracinho: martelo no vento e o "wah wah" no fim
fonte(ruido('white', 7), `bandpass=f=900:width_type=q:w=2,volume='${M.marteladas.map((h) => `if(between(t,${f(h - 0.25)},${f(h + 0.1)}),sin(PI*(t-${f(h - 0.25)})/0.35),0)`).join('+')}':eval=frame,volume=0.5`, 'vento');
fonte(aeval(somaDe([FIM_BRACO - 0.55, FIM_BRACO - 0.3], '0.5*(sin(2*PI*(233-20*T)*T)+0.5*sin(2*PI*(466-40*T)*T))*lt(T,0.24)*sin(PI*T/0.24)')), 'lowpass=f=1500,volume=0.3', 'wahwah');

// ---------------------------------------------------------------- +1000 ajudantes
fonte(aeval(somaDe(serie(M.multidao[0] + 0.4, M.multidao[0] + M.multidao[1] + 0.4, 0.08), '0.5*sin(2*PI*(500+1500*T)*T)*exp(-T*20)')), 'volume=0.18', 'pops');
fonte(ruido('pink', 8), `bandpass=f=1200:width_type=q:w=0.6,volume='${janela(INI_MULT + 0.4, FIM_MULT, 0.6, 0.5)}*(0.7+0.3*sin(2*PI*3*t))+${janela(FIM_ANIME - 3.8, FIM_ANIME, 0.3, 0.4)}*0.6+${janela(M.completo, FIM_OBRA, 0.2, 0.6)}*0.8':eval=frame,volume=0.4`, 'torcida');
const pousosDestaque = [M.dinheiro, M.cofrinho, ...M.apareceu];
fonte(aeval(somaDe(pousosDestaque, '(0.6*sin(2*PI*1567.98*T)*exp(-T*7)+0.5*sin(2*PI*2093*T)*exp(-T*5))')), 'volume=0.2', 'plimFeixe');
fonte(aeval(somaDe([M.dinheiro + 0.1], '0.5*(sin(2*PI*2637*T)*lt(T,0.08)+sin(2*PI*3520*(T-0.08))*gte(T,0.08))*exp(-T*6)')), 'volume=0.25', 'caixa');
fonte(aeval(somaDe([M.apareceu[3] + 0.3, M.completo, M.tabuas[4] + 0.15], '(sin(2*PI*130*T)*exp(-T*25)+0.4*sin(2*PI*880*T)*exp(-T*60))')), 'volume=0.55', 'carimbos');

// ---------------------------------------------------------------- Anime
fonte(ruido('white', 9), `highpass=f=1500,volume='if(between(t,${M.grito},${M.aura}),pow((t-${M.grito})/${(M.aura - M.grito).toFixed(2)},2),0)':eval=frame,volume=0.5`, 'carregando');
fonte(aeval(`if(between(t,${M.grito},${M.aura}),0.5*sin(2*PI*(90+700*pow((t-${M.grito})/${(M.aura - M.grito).toFixed(2)},2))*t),0)`), 'volume=0.35', 'subidaAura');
fonte(aeval(somaDe([M.aura], 'sin(2*PI*(45+80*exp(-T*6))*T)*exp(-T*1.5)+0.4*sin(2*PI*1760*T)*exp(-T*4)')), 'volume=0.9', 'explosaoAura');
fonte(aeval(`if(between(t,${M.aura},${M.corrida[0]}),(0.5*sin(2*PI*110*t)+0.3*sin(2*PI*220.6*t)+0.2*sin(2*PI*331*t))*(0.7+0.3*sin(2*PI*14*t))*clip((${M.corrida[0]}-t)/0.4,0,1),0)`), 'lowpass=f=1200,volume=0.22', 'zumbidoAura');
fonte(ruido('pink', 10), `bandpass=f=700:width_type=q:w=1.2,volume='if(between(t,${M.corrida[0]},${FIM_ANIME}),0.5+0.5*sin(2*PI*5*t),0)':eval=frame,volume=0.5`, 'corridaVento');
const [b0, b1] = M.borracha;
fonte(aeval(somaDe([b0, (b0 + b1) / 2 + 0.05], '0.5*sin(2*PI*(220+180*sin(2*PI*9*T))*T)*exp(-T*2.5)*lt(T,0.6)')), 'volume=0.35', 'boing');

// ---------------------------------------------------------------- Obra
const [c0, c1] = M.costela;
fonte(ruido('brown', 11), `lowpass=f=160,volume='if(between(t,${c0},${c1}),clip((t-${c0})/${(c1 - c0).toFixed(2)},0,1),0)':eval=frame,volume=4`, 'ronco');
const pousos = [c1, ...M.tabuas];
fonte(aeval(somaDe(pousos, '(sin(2*PI*(40+60*exp(-T*7))*T)*exp(-T*2.2)+0.3*sin(2*PI*1760*T)*exp(-T*8))')), 'volume=0.85', 'pecas');
fonte(aeval(somaDe(M.tabuas.map((p) => p - 0.05), '(0.9*sin(2*PI*(170+90*exp(-T*40))*T)*exp(-T*28)+0.5*sin(2*PI*1250*T)*exp(-T*90))')), 'volume=0.5', 'marteladas');
fonte(aeval(somaDe(serie(INI_OBRA + 0.3, FIM_OBRA - 0.2, 0.5), 'sin(2*PI*(55+80*exp(-T*28))*T)*exp(-T*8)')), 'volume=0.4', 'tambor');
const epico = [73.42, 146.83, 220, 293.66, 369.99, 440].map((hz, i) => `${[0.5, 0.45, 0.35, 0.3, 0.22, 0.18][i]}*sin(2*PI*${hz}*t)`).join('+');
fonte(aeval(`if(between(t,${c1},${FIM_OBRA}),(${epico})*clip((t-${c1})/0.1,0,1)*clip((${FIM_OBRA}-t)/0.6,0,1),0)`), 'lowpass=f=2600,volume=0.15', 'epico');

// ---------------------------------------------------------------- Os insistentes
fonte(ruido('pink', 12), `bandpass=f=500:width_type=q:w=1,volume='if(between(t,${INI_INS + 0.6},${M.arara + 0.35}),(0.5+0.5*sin(2*PI*7*t)),0)':eval=frame,volume=0.5`, 'asasArara');
fonte(aeval(somaDe([M.arara + 0.1, M.arara + 0.55], '0.5*(sin(2*PI*(1300+500*sin(2*PI*30*T))*T)+0.5*sin(2*PI*(2600+800*sin(2*PI*30*T))*T))*lt(T,0.28)*sin(PI*T/0.28)')), 'volume=0.2', 'grasnado');
const [u0, u1] = M.uivo;
fonte(aeval(`if(between(t,${u0 + 0.1},${u1}),0.6*sin(2*PI*(380+240*sin(PI*clip((t-${u0 + 0.1})/${(u1 - u0 - 0.1).toFixed(2)},0,1))+8*sin(2*PI*6*t))*t)*sin(PI*(t-${u0 + 0.1})/${(u1 - u0 - 0.1).toFixed(2)}),0)`), 'lowpass=f=2500,volume=0.4', 'uivo');
fonte(aeval(`if(between(t,${M.maracuja - 0.5},${M.maracuja}),0.4*sin(2*PI*(1600-1200*(t-${M.maracuja - 0.5})/0.5)*t),0)`), 'volume=0.18', 'queda');
fonte(aeval(somaDe([M.maracuja], '(0.8*sin(2*PI*820*T)*exp(-T*35)+0.5*sin(2*PI*1240*T)*exp(-T*45))')), 'volume=0.6', 'bonk');
fonte(aeval(somaDe(serie(M.maracuja + 0.2, M.maracuja + 1.3, 0.22), '0.4*sin(2*PI*3136*T)*exp(-T*25)')), 'volume=0.15', 'piu');
fonte(aeval(somaDe([M.maracaja - 0.1], '0.5*sin(2*PI*(700-250*T/0.4)*T)*lt(T,0.4)*sin(PI*T/0.4)')), 'volume=0.18', 'miado');

// ---------------------------------------------------------------- Cartões, seguir e chinelo
fonte(aeval(somaDe(COMENTARIOS.map((g) => g.inicio), '(0.6*sin(2*PI*1567.98*T)*exp(-T*9)*lt(T,0.09)+0.6*sin(2*PI*2093*(T-0.09))*exp(-(T-0.09)*7)*gte(T,0.09))')), 'volume=0.2', 'plim');
fonte(aeval(somaDe([M.cartao], '0.6*sin(2*PI*(600+900*T)*T)*exp(-T*14)') + `+${somaDe([M.toque], '0.7*sin(2*PI*2400*T)*exp(-T*90)')}`), 'volume=0.3', 'cartao');
const [h0, h1] = M.chinelo;
fonte(ruido('white', 13), `bandpass=f=1400:width_type=q:w=1.5,volume='if(between(t,${h0},${h1}),sin(PI*(t-${h0})/${(h1 - h0).toFixed(2)}),0)+if(gte(t,${h1}),3*exp(-(t-${h1})*40),0)':eval=frame,volume=0.55`, 'chinelo');

// ---------------------------------------------------------------- Pós-créditos: o dragão
fonte(aeval(`if(gt(t,${INI_POS + 0.9}),0.3*sin(2*PI*4400*t)*gt(sin(2*PI*14*t),0)*gt(sin(2*PI*1.4*t),0.3),0)`), 'volume=0.16', 'grilos');
fonte(ruido('pink', 14), `bandpass=f=300:width_type=q:w=0.8,volume='exp(-pow((t-${M.sombraAsas})/0.3,2))*2+if(between(t,${M.sombraAsas},${M.dragao + 0.6}),0.6*pow(max(0,sin(2*PI*1.8*t)),3),0)':eval=frame,volume=1.2`, 'asasDragao');
const [f0, f1] = M.chama;
fonte(ruido('brown', 15), `bandpass=f=500:width_type=q:w=0.7,volume='if(between(t,${f0},${f1 + 0.3}),clip((t-${f0})/0.1,0,1)*clip((${f1 + 0.3}-t)/0.4,0,1)*(0.8+0.2*sin(2*PI*17*t)),0)':eval=frame,volume=5`, 'fogo');
fonte(ruido('white', 16), `highpass=f=3000,volume='if(gt(t,${f0}),0.25*gt(sin(2*PI*23*t+3*sin(2*PI*7*t)),0.97)*exp(-(t-${f1})*0.5*gt(t,${f1})),0)':eval=frame,volume=1.4`, 'estalos');
fonte(aeval(somaDe([M.dragao], 'sin(2*PI*(38+30*exp(-T*5))*T)*exp(-T*1.8)')), 'volume=1.0', 'pouso');
fonte(aeval(`if(between(t,${M.dragao + 0.3},${M.dragao + 1.5}),0.5*sin(2*PI*(90+15*sin(2*PI*5*t))*t)*sin(PI*(t-${M.dragao + 0.3})/1.2),0)`), 'volume=0.5', 'rosnado');

// ---------------------------------------------------------------- Música
const arpejo = (ini, fim, passo, notas, vol) => {
  const i2 = `mod(floor((t-${ini})/${passo}),${notas.length})`;
  let fq = String(notas[notas.length - 1]);
  for (let i = notas.length - 2; i >= 0; i--) fq = `if(eq(${i2},${i}),${notas[i]},${fq})`;
  const fase = `mod(t-${ini},${passo})`;
  return `if(between(t,${ini},${fim}),${vol}*(sin(2*PI*${fq}*${fase})+0.3*sin(4*PI*${fq}*${fase}))*exp(-${fase}*${passo < 0.2 ? 14 : 9}),0)`;
};
const heroico = [293.66, 369.99, 440, 587.33];
const feliz = [293.66, 369.99, 440, 369.99, 392, 493.88, 587.33, 493.88];
const urgente = [293.66, 349.23, 440, 349.23];
const anime = [329.63, 392, 493.88, 587.33, 493.88, 392];
fonte(aeval([
  arpejo(r1 + 0.3, INI_BRACO, 0.22, heroico, '0.8'),
  arpejo(INI_MULT, FIM_MULT, 0.2, heroico, '1'),
  arpejo(M.corrida[0], FIM_ANIME, 0.11, anime, '1'),
  arpejo(INI_OBRA, FIM_OBRA, 0.2, heroico, '0.8'),
  arpejo(INI_INS, FIM_INS, 0.18, feliz, '0.9'),
  arpejo(INI_FINAL, FIM_FINAL - 0.2, 0.14, urgente, '0.9'),
].join('+')), 'lowpass=f=3200,volume=0.15', 'musica');

filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=${D - 0.3}:d=0.3,aformat=channel_layouts=stereo[efeitos]`);

const NARRACAO = resolve(RAIZ, 'audio/video06-narracao.mp3');
if (existsSync(NARRACAO)) {
  entradas.push('-i', NARRACAO);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=${D},asplit=2[voz][chave]`);
  filtros.push(`[efeitos][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem voz: rode antes  node scripts/narracao.mjs --video=06');
  filtros.push(`[efeitos]anull[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);
rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

const VIDEO = resolve(VIDEOS, 'video-06.mp4');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', VIDEO]);

// Capa: o rugido do T-rex
const CAPA = resolve(VIDEOS, 'video-06-capa.jpg');
const ttf = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(M.rugido[0] + 0.55), '-i', IMAGEM, '-frames:v', '1',
  '-vf', `drawbox=y=ih*0.6:w=iw:h=ih*0.2:color=black@0.6:t=fill,` +
    `drawtext=fontfile=${ttf}:text='ROUBARAM A':fontcolor=white:fontsize=96:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.615,` +
    `drawtext=fontfile=${ttf}:text='MADEIRA!':fontcolor=0xffd23f:fontsize=120:borderw=9:bordercolor=black:x=(w-tw)/2:y=h*0.69`,
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${VIDEO}\n  ${CAPA}`);
