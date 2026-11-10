// Monta o vídeo 01 completo: grava as imagens (trailer.html), sintetiza a trilha
// e os efeitos no ffmpeg (sincronizados com as cenas), mixa a narração se existir
// e exporta as versões para Instagram e TikTok + capa.
//
// Uso:
//   node scripts/trailer.mjs              # grava tudo do zero
//   node scripts/trailer.mjs --so-audio   # reaproveita videos/trailer-imagem.mp4
//
// Narração (opcional): coloque o arquivo em audio/narracao.mp3 (ou .wav/.m4a).
// A música abaixa sozinha quando o Noé fala (sidechain).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const VIDEOS = resolve(RAIZ, 'videos');
mkdirSync(VIDEOS, { recursive: true });
const IMAGEM = resolve(VIDEOS, 'trailer-imagem.mp4');
const TRILHA = resolve(VIDEOS, 'trailer-trilha.wav');
const D = 23; // duração (igual a DURACAO em js/trailer.js)
const SR = 48000;

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: RAIZ });
  if (r.status !== 0) throw new Error(`${cmd} falhou (código ${r.status})`);
}

// ------------------------------------------------------------ 1. Imagem
if (!process.argv.includes('--so-audio') || !existsSync(IMAGEM)) {
  rodar('node', ['scripts/gravar-video.mjs', IMAGEM, '--pagina=trailer.html']);
}

// ------------------------------------------------------------ 2. Trilha
// Tempos-chave (mesmos de js/trailer.js)
const RAIOS = [0.12, 1.55, 17.9, 19.35, 21.6];
const TROVOES = RAIOS.map((r, i) => [r + 0.15, [1, 0.7, 0.8, 1, 1.1][i]]);

// Marteladas: o braço do Noé desce em t = (π + 2πk) / 5
const marteladas = [];
for (let k = 0; ; k++) {
  const t = (Math.PI + 2 * Math.PI * k) / 5;
  if (t > 20) break;
  if ((t > 2.4 && t < 12.4) || (t > 16.6 && t < 19.8)) marteladas.push(+t.toFixed(3));
}
// Marteladas dos ajudantes (mais agudas, mais leves), só quando já tem gente
const marteladasAjudantes = [];
for (let t = 7.0; t < 12.4; t += 0.31) marteladasAjudantes.push(+(t + ((t * 7) % 0.11)).toFixed(3));

// "Pop" de cada ajudante pousando (mesma conta de Ajudantes.atualizar + 0,5 s de queda)
const pops = [];
for (let i = 0; i < 14; i++) pops.push(5.5 + (i / 14) * 3.0 + 0.5);
for (let i = 0; i < 26; i += 2) pops.push(8.8 + (i / 26) * 2.2 + 0.5);
const SINO_VOCE = 9.75; // o "@VOCÊ" pousa
const IMPACTO = 12.5;   // flash-forward
const CORACAO = [];
for (let t = 16.7; t < 19.9; t += 0.82) CORACAO.push(+t.toFixed(3), +(t + 0.2).toFixed(3));

const f = (n) => n.toFixed(3);
const somaDe = (tempos, expr) => tempos.map((h) => `if(gte(t,${f(h)}),${expr.replaceAll('T', `(t-${f(h)})`)},0)`).join('+') || '0';

// Cada som vira uma entrada "aevalsrc" (expressão de t) ou ruído com envelope.
const entradas = [];
const filtros = [];
let n = 0;
function fonte(src, cadeia, rotulo) {
  entradas.push('-f', 'lavfi', '-i', src);
  filtros.push(`[${n}:a]${cadeia}[${rotulo}]`);
  n++;
}
const aeval = (expr) => `aevalsrc='${expr}':s=${SR}:d=${D}`;

// Trovão: ruído marrom grave com envelope de estrondo + estalo agudo no início
const envTrovao = TROVOES.map(([h, s]) => `if(gte(t,${f(h)}),${s}*(1-exp(-(t-${f(h)})*25))*exp(-(t-${f(h)})*0.9)*(0.75+0.25*sin(2*PI*5*t)),0)`).join('+');
fonte(`anoisesrc=color=brown:sample_rate=${SR}:d=${D}:seed=3`, `lowpass=f=320,volume='${envTrovao}':eval=frame,volume=5.5`, 'trovao');
const envEstalo = TROVOES.map(([h, s]) => `if(gte(t,${f(h)}),${s}*exp(-(t-${f(h)})*7),0)`).join('+');
fonte(`anoisesrc=color=white:sample_rate=${SR}:d=${D}:seed=4`, `highpass=f=1800,lowpass=f=7000,volume='${envEstalo}':eval=frame,volume=0.55`, 'estalo');

// Chuva (acompanha a intensidade da chuva na imagem)
const chuva = 'if(lt(t,2.4),1,if(lt(t,16.5),0,if(lt(t,20),clip((t-17.4)/2.1,0,1)*0.9,1)))';
fonte(`anoisesrc=color=pink:sample_rate=${SR}:d=${D}:seed=5`, `highpass=f=700,lowpass=f=9000,volume='${chuva}':eval=frame,volume=0.33`, 'chuva');

// Vento no "sozinho"
fonte(`anoisesrc=color=pink:sample_rate=${SR}:d=${D}:seed=6`, `bandpass=f=420:width_type=q:w=0.8,volume='if(between(t,2.4,5.2),0.5+0.5*sin(2*PI*0.4*t),0)':eval=frame,volume=0.6`, 'vento');

// Marteladas: tom de madeira (180 Hz) + clique
fonte(aeval(somaDe(marteladas, '(0.9*sin(2*PI*175*T)*exp(-T*38)+0.5*sin(2*PI*410*T)*exp(-T*60))')), 'volume=0.55', 'martelo');
fonte(aeval(somaDe(marteladasAjudantes, '0.5*sin(2*PI*260*T)*exp(-T*55)')), 'volume=0.28', 'martelo2');

// Pops dos ajudantes + sino do @VOCÊ
fonte(aeval(somaDe(pops, '0.6*sin(2*PI*(520+1400*T)*T)*exp(-T*22)')), 'volume=0.35', 'pops');
fonte(aeval(somaDe([SINO_VOCE], '(0.6*sin(2*PI*1318.5*T)+0.4*sin(2*PI*1975.5*T))*exp(-T*3.5)') + '+' + somaDe([SINO_VOCE + 0.12], '0.5*sin(2*PI*2637*T)*exp(-T*4)')), 'volume=0.4', 'sino');

// Subida (riser) + impacto grave do flash-forward
fonte(aeval(`if(between(t,11.0,${IMPACTO}),pow((t-11)/1.5,2)*(0.5*sin(2*PI*(150+700*pow((t-11)/1.5,2))*t)),0)`), 'volume=0.35', 'riser');
fonte(`anoisesrc=color=white:sample_rate=${SR}:d=${D}:seed=7`, `highpass=f=2000,volume='if(between(t,11,${IMPACTO}),pow((t-11)/1.5,3),0)':eval=frame,volume=0.25`, 'riser2');
fonte(aeval(somaDe([IMPACTO], '(sin(2*PI*(42+30*exp(-T*6))*T)*exp(-T*1.6))')), 'volume=1.1', 'impacto');

// Batida de coração
fonte(aeval(somaDe(CORACAO, 'sin(2*PI*55*T)*exp(-T*16)')), 'lowpass=f=200,volume=1.0', 'coracao');

// Música: drone tenso (Ré menor) → arpejo esperançoso → acorde épico (Ré maior) → drone escuro
const nota = (hz, amp) => `${amp}*sin(2*PI*${hz}*t)`;
const drone = `(${nota(73.42, 0.5)}+${nota(110, 0.35)}+${nota(146.83, 0.25)}+${nota(174.61, 0.18)})*(0.8+0.2*sin(2*PI*0.25*t))`;
const volDrone = `if(lt(t,2.4),0.9,if(lt(t,5),0.35,if(lt(t,12.5),0.25,if(lt(t,16.5),0,if(lt(t,22.9),0.5+0.5*clip((t-16.5)/4,0,1),0)))))`;
fonte(aeval(`(${drone})*(${volDrone})`), 'lowpass=f=900,volume=0.22', 'drone');

// Arpejo (Ré–Fá#–Lá–Ré) em colcheias, 5,0 s → 12,4 s
const passo = 0.3;
const idx = `mod(floor((t-5)/${passo}),4)`;
const freq = `if(eq(${idx},0),293.66,if(eq(${idx},1),369.99,if(eq(${idx},2),440,587.33)))`;
const fase = `mod(t-5,${passo})`;
fonte(aeval(`if(between(t,5,12.4),(sin(2*PI*${freq}*${fase})+0.3*sin(4*PI*${freq}*${fase}))*exp(-${fase}*9)*(0.6+0.4*clip((t-5)/6,0,1)),0)`), 'lowpass=f=3000,volume=0.18', 'arpejo');

// Acorde épico do futuro (Ré maior, com cordas "abrindo")
const epico = [73.42, 146.83, 220, 293.66, 369.99, 440].map((hz, i) => nota(hz, [0.5, 0.4, 0.3, 0.25, 0.2, 0.15][i]) + `*(1+0.004*sin(2*PI*5*t))`).join('+');
fonte(aeval(`if(between(t,${IMPACTO},16.6),(${epico})*clip((t-${IMPACTO})/0.4,0,1)*clip((16.6-t)/0.3,0,1),0)`), 'lowpass=f=2500,volume=0.2', 'epico');

const camadas = ['trovao', 'estalo', 'chuva', 'vento', 'martelo', 'martelo2', 'pops', 'sino', 'riser', 'riser2', 'impacto', 'coracao', 'drone', 'arpejo', 'epico'];
filtros.push(`${camadas.map((c) => `[${c}]`).join('')}amix=inputs=${camadas.length}:normalize=0,afade=t=out:st=22.75:d=0.25[efeitos]`);

// Narração opcional com ducking
const narracao = ['mp3', 'wav', 'm4a'].map((e) => resolve(RAIZ, `audio/narracao.${e}`)).find(existsSync);
if (narracao) {
  console.log(`Narração encontrada: ${narracao}`);
  entradas.push('-i', narracao);
  filtros.push(`[${n}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,asplit=2[voz][chave]`);
  filtros.push(`[efeitos]aformat=channel_layouts=stereo[ef]`);
  filtros.push(`[ef][chave]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[abaixado]`);
  filtros.push(`[abaixado][voz]amix=inputs=2:normalize=0:duration=first[mix]`);
} else {
  console.log('Sem narração (audio/narracao.mp3 não existe): exportando só trilha e efeitos.');
  filtros.push(`[efeitos]aformat=channel_layouts=stereo[mix]`);
}
filtros.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=${SR},atrim=0:${D}[saida]`);

rodar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '2', TRILHA]);

// ------------------------------------------------------------ 3. Exportar
const sufixo = narracao ? '' : '-sem-narracao';
const INSTA = resolve(VIDEOS, `video-01-instagram${sufixo}.mp4`);
const TIKTOK = resolve(VIDEOS, `video-01-tiktok${sufixo}.mp4`);

// Instagram Reels: 1080x1920, H.264 High, AAC 48 kHz
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', IMAGEM, '-i', TRILHA,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level', '4.1',
  '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-shortest', INSTA]);

// TikTok: mesmo formato, arquivo menor (limite de upload no celular)
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-i', INSTA, '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
  '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', TIKTOK]);

// Capa: quadro do "sozinho" com título
const CAPA = resolve(VIDEOS, 'video-01-capa.jpg');
rodar('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '4.6', '-i', IMAGEM, '-frames:v', '1',
  '-vf', "drawbox=y=ih*0.06:w=iw:h=ih*0.2:color=black@0.55:t=fill," +
    "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='O DILÚVIO':fontcolor=0xffd23f:fontsize=120:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.075," +
    "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='ESTÁ VINDO':fontcolor=white:fontsize=110:borderw=8:bordercolor=black:x=(w-tw)/2:y=h*0.155",
  '-q:v', '2', CAPA]);

console.log(`\nPronto:\n  ${INSTA}\n  ${TIKTOK}\n  ${CAPA}`);
