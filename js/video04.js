// Vídeo 04: "Era pra ser 200… chegaram 378!". Tudo é função do tempo t.
// Tempos em js/video04-tempos.js · Roteiro em docs/roteiro-video-04.md
import * as THREE from 'three';
import { Arca, COMPRIMENTO } from './arca.js';
import { Noe, Vizinho, Ajudantes, criarAnimal, baterAsas, TIPOS_DE_ANIMAIS } from './personagens.js';
import { Cenario } from './cenario.js';
import { etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V } from './efeitos.js';
import {
  DURACAO, FALAS, VOZES, CENAS, MARCOS, COMENTARIOS, NOVOS, AJUDANTES_COMENTARIO, ANIMAIS_NOVOS, SEGUIDORES, PECAS,
} from './video04-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/video04-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }

const $ = (id) => document.getElementById(id);
const cenaEm = (t) => {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
};
const YAW_CAMERA = -Math.PI / 2; // animais olham para +x; isso vira para +z (câmera)
const madeira = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, flatShading: true });
const sombrear = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

// ------------------------------------------------------------ Montagem
const canvas = $('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(540, 960, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 540 / 960, 0.1, 500);
const cenario = new Cenario(cena);
const arca = new Arca();
arca.configurar(PECAS.antes, PECAS.antes);
cena.add(arca.grupo);
const legendas = new Legendas($('legenda'), FALAS, PALAVRAS);

// Noé no lugar de sempre, na frente da obra
const N = V(-1, 0, 12.1);
const CABECA = N.clone().add(V(0, 2.15, 0));
const noe = new Noe();
noe.cajado.visible = false;
cena.add(noe.grupo);

// Ajudantes: 75 já estavam, chegam mais 303
const ajudantes = new Ajudantes();
ajudantes.definir(SEGUIDORES.antes, SEGUIDORES.antes, []);
cena.add(ajudantes.grupo);
const [INI_MULT, DUR_MULT] = MARCOS.multidao;
const novos = SEGUIDORES.depois - SEGUIDORES.antes;
const pousoAjudante = (i) => INI_MULT + ((i - SEGUIDORES.antes) / novos) * DUR_MULT + 0.5;
// Deixa livre a frente da obra (onde o Noé, a carroça e os bichos aparecem de perto):
// quem cairia ali vai para as laterais, formando um corredor.
ajudantes.dados.forEach((d, i) => {
  if (d.x > -6 && d.x < 16 && d.z > 9.6 && d.z < 24) {
    const r = Math.sin(i * 12.9898) * 0.5 + 0.5;
    d.x = d.x < 5 ? -6.5 - r * 4 : 16.5 + r * 4;
    d.rotacao = Math.atan2(-d.x, -d.z);
  }
});
const feixesMultidao = Array.from({ length: 16 }, (_, k) => ({ i: SEGUIDORES.antes + 4 + k * 18, feixe: new Feixe(cena) }));

// ------------------------------------------------------------ Faixa "200 AJUDANTES" (o vizinho corrige para 378)
const faixaCanvas = document.createElement('canvas');
faixaCanvas.width = 1024; faixaCanvas.height = 256;
const faixaTex = new THREE.CanvasTexture(faixaCanvas);
faixaTex.colorSpace = THREE.SRGBColorSpace;
let faixaChave = '';
function desenharFaixa(risco, escrita) {
  const chave = `${risco.toFixed(2)}|${escrita.toFixed(2)}`;
  if (chave === faixaChave) return;
  faixaChave = chave;
  const ctx = faixaCanvas.getContext('2d');
  ctx.fillStyle = '#f6ecd2'; ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = '#b5532a'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, 1010, 242);
  ctx.fillStyle = '#6b3a1d'; ctx.font = '900 118px "DejaVu Sans", sans-serif'; ctx.textBaseline = 'middle';
  ctx.fillText('200', 46, 136);
  ctx.font = '900 84px "DejaVu Sans", sans-serif';
  ctx.fillText('AJUDANTES', 312, 140);
  ctx.font = '84px "Noto Color Emoji", sans-serif';
  ctx.fillText('🎉', 860, 140);
  if (risco > 0) { // risco de carvão em cima do "200"
    ctx.strokeStyle = '#111'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(36, 150); ctx.lineTo(36 + 250 * risco, 118 - 10 * risco); ctx.stroke();
    if (risco > 0.5) { ctx.beginPath(); ctx.moveTo(40, 110); ctx.lineTo(40 + 250 * (risco - 0.5) * 2, 158); ctx.stroke(); }
  }
  if (escrita > 0) { // "378" torto, escrito à mão por cima
    ctx.save();
    ctx.beginPath(); ctx.rect(20, 0, 30 + 300 * escrita, 256); ctx.clip();
    ctx.translate(40, 70); ctx.rotate(-0.12);
    ctx.font = 'italic 900 112px "DejaVu Sans", sans-serif';
    ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.strokeText('378', 0, 0);
    ctx.fillStyle = '#c0281c'; ctx.fillText('378', 0, 0);
    ctx.restore();
  }
  faixaTex.needsUpdate = true;
}
desenharFaixa(0, 0);
const FAIXA = V(-1.0, 2.85, 9.2);
const faixa = new THREE.Group();
{
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), new THREE.MeshStandardMaterial({ map: faixaTex, roughness: 1, side: THREE.DoubleSide }));
  faixa.add(pano);
  for (const x of [-2.4, 2.4]) {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.6, 6), madeira('#6b4423'));
    poste.position.set(x, -1.05, -0.02);
    faixa.add(poste);
  }
  faixa.position.copy(FAIXA);
  cena.add(sombrear(faixa));
}

// Confete quando o contador passa dos 200
const confetes = ['#ff4d6d', '#ffd23f', '#3ec1f3', '#7bd389'].map((cor, k) =>
  new Explosao(cena, { n: 90, cor, tamanho: 0.12, velocidade: 3.5, subida: 7, gravidade: 5, dur: 2.4, semente: 40 + k }));

// ------------------------------------------------------------ Vizinho (agora ajudante)
const vizinho = new Vizinho();
vizinho.martelo.visible = false;
cena.add(vizinho.grupo);

// ------------------------------------------------------------ Carroça com toras, puxada pelo cavalo do @kaike_salless
const CARROCA = V(7.6, 0, 14.4);
const carroca = new THREE.Group();
const torasCarroca = [];
{
  const leito = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 1.5), madeira('#8a5a2b'));
  leito.position.y = 0.75;
  carroca.add(leito);
  for (const z of [-0.72, 0.72]) {
    const lateral = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 0.08), madeira('#6b4423'));
    lateral.position.set(0, 0.98, z);
    carroca.add(lateral);
  }
  for (const x of [-0.9, 0.9]) for (const z of [-0.85, 0.85]) {
    const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12), madeira('#5a3a1d'));
    roda.rotation.x = Math.PI / 2;
    roda.position.set(x, 0.45, z);
    roda.userData.roda = true;
    carroca.add(roda);
  }
  const vara = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), madeira('#6b4423'));
  vara.position.set(-2.1, 0.8, 0);
  carroca.add(vara);
  for (let i = 0; i < 6; i++) {
    const tora = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 2.5, 7), madeira('#a8682f'));
    tora.rotation.z = Math.PI / 2;
    tora.position.set(0, 1.0 + Math.floor(i / 3) * 0.3, (i % 3 - 1) * 0.36 + (i >= 3 ? 0.18 : 0) - (i >= 3 ? 0.18 : 0));
    if (i >= 3) tora.position.z = (i % 3 - 1) * 0.32;
    carroca.add(tora);
    torasCarroca.push(tora);
  }
  cena.add(sombrear(carroca));
}
const cavalo = criarAnimal('cavalo', 5);
cavalo.rotation.y = Math.PI; // puxa para -x
cena.add(cavalo);
const rotuloCavalo = etiqueta3D('@kaike_salless 🐎', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
const rotuloCarroca = etiqueta3D('@garciaxxzn 🪵', { fundo: '#ffffff', altura: 0.34, fonte: 44 });
cena.add(rotuloCavalo, rotuloCarroca);

// ------------------------------------------------------------ @rodri.cuts: dessa vez foi escolhido
function criarBoneco(roupa, pele) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.85, 7), madeira(roupa));
  corpo.position.y = 0.43;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), madeira(pele));
  cabeca.position.y = 1.0;
  g.add(corpo, cabeca);
  return sombrear(g);
}
const RODRI = N.clone().add(V(2.0, 0, -0.9));
const rodri = criarBoneco('#2e86c1', '#c68642');
rodri.scale.setScalar(1.25);
cena.add(rodri);
const feixeRodri = new Feixe(cena);
const ondaRodri = new Onda(cena);
const rotuloRodri = etiqueta3D('@rodri.cuts 🔨', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloRodri);

// ------------------------------------------------------------ Placa "PROIBIDO CUPIM"
const PLACA = N.clone().add(V(-1.45, 0, 0.95));
const placa = new THREE.Group();
{
  const c = document.createElement('canvas');
  c.width = 512; c.height = 300;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 512, 300);
  ctx.strokeStyle = '#c62828'; ctx.lineWidth = 22; ctx.strokeRect(11, 11, 490, 278);
  ctx.fillStyle = '#c62828'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 66px "DejaVu Sans", sans-serif'; ctx.fillText('PROIBIDO', 256, 88);
  ctx.fillStyle = '#111'; ctx.fillText('CUPIM', 200, 196);
  ctx.font = '80px "Noto Color Emoji", sans-serif'; ctx.fillText('🚫', 400, 200);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const tabua = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.74, 0.06), [madeira('#c98a45'), madeira('#c98a45'), madeira('#c98a45'), madeira('#c98a45'),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }), madeira('#c98a45')]);
  tabua.position.y = 1.35;
  const poste = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), madeira('#6b4423'));
  poste.position.set(0, 0.6, -0.09);
  placa.add(tabua, poste);
  placa.position.copy(PLACA);
  placa.rotation.y = 0.25;
  cena.add(sombrear(placa));
}
const poeiraPlaca = new Explosao(cena, { n: 70, cor: '#e8c58a', tamanho: 0.12, velocidade: 2.5, subida: 1.6, dur: 0.8, semente: 61 });

// ------------------------------------------------------------ Terror: "Quem pedir cupim vai se ver comigo"
const luzTerror = new THREE.PointLight('#ff2a14', 0, 6, 1.6); // lanterna vermelha por baixo do rosto
luzTerror.position.copy(N).add(V(0.1, 0.9, 1.1));
cena.add(luzTerror);

// ------------------------------------------------------------ Os diferentões: ornitorrinco, flamingo e hipopótamo caem do céu
const POS_DIFERENTOES = [V(-6.4, 0, 15.9), V(-4.9, 0, 16.6), V(-3.1, 0, 15.6), V(-5.6, 0, 17.6)]; // longe da câmera das cenas do Noé
const animaisNovos = ANIMAIS_NOVOS.map((a, k) => {
  const obj = criarAnimal(a.tipo, 50 + k);
  const base = POS_DIFERENTOES[k];
  obj.position.copy(base);
  obj.rotation.y = YAW_CAMERA - 0.35;
  if (a.tipo === 'flamingo') obj.scale.setScalar(1.3);
  cena.add(obj);
  const rot = etiqueta3D(`${a.arroba} ${TIPOS_DE_ANIMAIS[a.tipo].emoji}`, { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
  cena.add(rot);
  const queda = MARCOS.quedas[k]; // os três primeiros caem na cena deles; o 2º flamingo já chega junto
  return {
    obj, rot, k, base, queda: queda ?? MARCOS.quedas[1] + 0.25,
    altura: { hipopotamo: 2.1, ornitorrinco: 0.9, flamingo: 2.15 }[a.tipo] ?? 1.4,
    feixe: new Feixe(cena), onda: new Onda(cena),
    poeira: new Explosao(cena, { n: 80, cor: '#e8c58a', tamanho: 0.15, velocidade: 4, subida: 2.5, dur: 1.0, semente: 80 + k }),
  };
});

// ------------------------------------------------------------ Cupim espiando atrás da tora (gancho)
const TORA = N.clone().add(V(1.05, 0, 1.7));
const toraChao = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.8, 8), madeira('#a8682f'));
toraChao.rotation.z = Math.PI / 2;
toraChao.rotation.y = 0.3;
toraChao.position.copy(TORA).add(V(0, 0.24, 0));
const toraCima = toraChao.clone();
toraCima.position.y = 0.66;
toraChao.add(toraCima);
toraCima.position.set(0, -0.42, 0); // por cima da outra (eixo local do cilindro deitado)
cena.add(sombrear(toraChao));
const cupim = new THREE.Group();
{
  const corpoMat = madeira('#f1e3c4');
  const cabecaMat = madeira('#a0522d');
  const cab = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), cabecaMat);
  const corpo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), corpoMat);
  corpo.position.set(0, -0.17, -0.12);
  const olhos = [-1, 1].map((l) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.4 }));
    o.position.set(l * 0.07, 0.05, 0.13);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshStandardMaterial({ color: '#111' }));
    pupila.position.set(l * 0.06, 0.05, 0.18);
    return [o, pupila];
  }).flat();
  const antenas = [-1, 1].map((l) => {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.25, 4), cabecaMat);
    a.position.set(l * 0.07, 0.22, 0.04);
    a.rotation.z = -l * 0.5;
    return a;
  });
  const mandibula = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.06), madeira('#5a2e14'));
  mandibula.position.set(0, -0.07, 0.15);
  cupim.add(cab, corpo, ...olhos, ...antenas, mandibula);
  cupim.scale.setScalar(1.3);
  cena.add(cupim);
}

// ------------------------------------------------------------ Efeitos das costelas 2 a 7
const xsCostelas = [];
for (let i = 1; i <= 11; i++) xsCostelas.push(-COMPRIMENTO / 2 + COMPRIMENTO * (i / 12));
xsCostelas.sort((a, b) => Math.abs(a) - Math.abs(b));
const efeitosPecas = [0, 1, 2, 3, 4, 5].map((k) => ({
  fim: MARCOS.pecasInicio + k * MARCOS.pecasPasso + 0.8,
  x: xsCostelas[k + 1],
  onda: new Onda(cena, '#ffe9a8'),
  faiscas: new Explosao(cena, { n: 140, cor: '#ffd76a', tamanho: 0.2, velocidade: 8, subida: 5, dur: 1.2, semente: 200 + k }),
}));

// ------------------------------------------------------------ Câmera
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  const L = (a, b) => a.clone().lerp(b, k);
  switch (c.nome) {
    case 'festa': return [L(N.clone().add(V(1.4, 2.0, 9.5)), N.clone().add(V(1.0, 2.0, 8.3))), N.clone().add(V(0, 2.2, -2))];
    case 'contador': return [L(N.clone().add(V(0.6, 0.9, 7.2)), N.clone().add(V(0.4, 0.8, 6.2))), N.clone().add(V(0, 3.1, -1))];
    case 'faixa': return [L(V(-4.6, 2.7, 18.5), V(-4.4, 2.6, 17.4)), V(-1.7, 2.2, 9.4)];
    case 'multidao': return [L(V(10, 18, 46), V(6, 14, 40)), V(0, 1, 4)];
    case 'carroca': return [L(V(5.4, 5.0, 27.5), V(5.2, 4.6, 26.0)), V(5.6, 1.3, 14.2)];
    case 'rodri': return [L(N.clone().add(V(1.0, 2.0, 6.4)), N.clone().add(V(1.1, 1.95, 5.6))), N.clone().add(V(1.05, 1.5, -0.3))];
    case 'cupim': {
      // terror: a câmera mergulha no rosto do Noé
      const [z0] = MARCOS.terror;
      if (t > z0) {
        const kz = ss(t, z0, z0 + 2.4);
        return [N.clone().add(V(-0.8, 1.8, 5.3)).lerp(N.clone().add(V(0.05, 1.8, 2.7)), kz), CABECA.clone().lerp(CABECA.clone().add(V(0, -0.15, 0)), kz)];
      }
      return [L(N.clone().add(V(-0.7, 1.9, 6.0)), N.clone().add(V(-0.8, 1.8, 5.3))), N.clone().add(V(-0.95, 1.45, 0.5))];
    }
    case 'diferentoes': {
      // acompanha cada queda (ornitorrinco → flamingo → hipopótamo) e no fim abre para os três
      const q = MARCOS.quedas;
      const alvos = [V(-6.4, 0.9, 15.9), V(-4.9, 1.5, 16.6), V(-3.1, 1.4, 15.6)];
      let a = alvos[0].clone();
      if (t > q[0] + 0.35) a.lerp(alvos[1], ss(t, q[0] + 0.35, q[1] - 0.25));
      if (t > q[1] + 0.35) a = alvos[1].clone().lerp(alvos[2], ss(t, q[1] + 0.35, q[2] - 0.25));
      const abre = ss(t, q[2] + 0.6, q[2] + 1.6);
      const dist = t < q[0] + 0.35 ? 3.4 : t < q[1] + 0.35 ? lerp(3.4, 5.8, ss(t, q[0] + 0.35, q[1] - 0.25)) : 6.2;
      const perto = a.clone().add(V(0.4, 0.9 + dist * 0.12, dist));
      const longe = V(-4.2, 2.4, 24.5);
      return [perto.lerp(longe, abre), a.clone().lerp(V(-5.0, 1.0, 16.2), abre)];
    }
    case 'davi': return [L(N.clone().add(V(0.3, 2.2, 4.6)), N.clone().add(V(0.2, 2.15, 4.0))), CABECA.clone().add(V(0, -0.35, 0))];
    case 'upgrade': return [L(V(16, 8, 26), V(10, 10, 29)), V(0, 2, 0)];
    case 'panorama': return [L(V(-15, 12, 38), V(-6, 9, 40)), V(-0.5, 1.5, 10)];
    case 'final': return [L(N.clone().add(V(1.3, 1.95, 5.8)), N.clone().add(V(1.1, 1.9, 5.1))), N.clone().add(V(0.7, 1.2, 0.6))];
  }
  return [V(0, 3, 20), V(0, 1, 0)];
}

// ------------------------------------------------------------ Noé
function poseDoNoe(c, t) {
  const n = noe;
  n.corpo.rotation.set(0, 0, 0); n.corpo.position.set(0, 0, 0);
  n.bracoDir.rotation.set(-0.3, 0, 0); n.bracoEsq.rotation.set(0, 0, 0.25);
  n.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.16, 0.05, 0.05));
  n.martelo.visible = false;
  const pos = N.clone();
  let yaw = 0;
  switch (c.nome) {
    case 'festa': // orgulhoso, mãos na cintura, olhando a faixa e depois a câmera
      n.bracoDir.rotation.set(0, 0, 0.9); n.bracoEsq.rotation.set(0, 0, -0.9);
      yaw = t < 1.6 ? lerp(Math.PI * 0.85, 0, ss(t, 1.0, 1.6)) : 0;
      n.corpo.position.y = t > 1.6 ? Math.abs(Math.sin(t * 5)) * 0.03 : 0;
      break;
    case 'contador': {
      n.corpo.rotation.x = -0.3; // olhando o contador lá em cima
      const [, f200] = MARCOS.contaAte200;
      if (t < f200) { n.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 10) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.5 - Math.sin(t * 10) * 0.2); }
      else if (t < MARCOS.contaAte378[1]) { n.bracoDir.rotation.set(-0.4, 0, 1.2); n.bracoEsq.rotation.set(-0.4, 0, -1.2); n.corpo.rotation.x = -0.4; }
      else { // mãos na cabeça: 378!
        const tremor = Math.sin(t * 40) * 0.05;
        n.bracoDir.rotation.set(-0.3, 0, 2.6 + tremor); n.bracoEsq.rotation.set(-0.3, 0, -2.6 - tremor);
        pos.y = Math.max(0, Math.sin(ss(t, 7.6, 8.0) * Math.PI)) * 0.3;
      }
      break;
    }
    case 'faixa': yaw = 0.5; n.bracoDir.rotation.set(0, 0, 0.9); n.bracoEsq.rotation.set(0, 0, -0.9); break;
    case 'multidao': n.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 8) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.5 - Math.sin(t * 8) * 0.2); pos.y = Math.abs(Math.sin(t * 6)) * 0.1; break;
    case 'carroca': yaw = 0.9; n.bracoDir.rotation.set(-1.7, 0, 0.2); n.corpo.rotation.x = t < 18 ? 0.1 : 0; break; // aponta a carroça
    case 'rodri': {
      // encara a câmera; no "escolhi" aponta o lado onde o @rodri.cuts cai
      if (t > MARCOS.feixeRodri - 0.3) { yaw = 0.35; n.bracoDir.rotation.set(-1.5, 0, 0.3); }
      break;
    }
    case 'cupim': {
      yaw = -0.45; n.martelo.visible = true;
      const ultimo = MARCOS.marteladasPlaca.filter((h) => h <= t).pop();
      const proximo = MARCOS.marteladasPlaca.find((h) => h > t);
      let a = -0.6;
      if (proximo !== undefined && proximo - t < 0.2) a = lerp(-1.9, -0.5, 1 - (proximo - t) / 0.2);
      else if (ultimo !== undefined && t - ultimo < 0.25) a = lerp(-0.5, -1.9, (t - ultimo) / 0.25);
      else if (proximo !== undefined && t > MARCOS.placa) a = -1.9;
      n.bracoDir.rotation.set(a, 0, 0);
      if (t > MARCOS.terror[0]) { // ameaçador: inclinado para a câmera, martelo na mão
        const k = ss(t, MARCOS.terror[0], MARCOS.terror[0] + 0.6);
        yaw = lerp(-0.45, 0, k);
        n.corpo.rotation.x = 0.14 * k;
        n.bracoDir.rotation.set(lerp(-0.6, -1.1, k) + Math.sin(t * 6) * 0.08 * k, 0, 0.2);
        n.bracoEsq.rotation.set(-1.0 * k, 0, 0.4 * k);
      }
      break;
    }
    case 'diferentoes': yaw = 0.25; n.bracoDir.rotation.set(-0.3, 0, 1.6 + Math.sin(t * 3) * 0.2); n.bracoEsq.rotation.set(-0.3, 0, -1.6); n.corpo.rotation.z = Math.sin(t * 2) * 0.08; break; // coçando a cabeça
    case 'davi': {
      // rindo, depois soterrado pelos "EU"
      n.corpo.rotation.x = Math.sin(t * 18) * 0.04 - 0.05;
      n.bracoDir.rotation.set(-0.4, 0, 1.0); n.bracoEsq.rotation.set(-0.4, 0, -1.0);
      if (t > 32.3) { n.bracoDir.rotation.set(0, 0, 2.7); n.bracoEsq.rotation.set(0, 0, -2.7); }
      break;
    }
    case 'upgrade': case 'panorama':
      yaw = Math.PI * 0.85; n.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 9) * 0.25); n.bracoEsq.rotation.set(0, 0, -2.5 - Math.sin(t * 9) * 0.25);
      break;
    case 'final': {
      // aponta a câmera ("faltam 22"); no "cupim" desconfia e olha para os lados
      n.bracoDir.rotation.set(-1.5, 0, 0);
      if (t > 48.5) { n.bracoDir.rotation.set(-0.3, 0, 0.9); n.bracoEsq.rotation.set(-0.3, 0, -0.9); yaw = Math.sin((t - 48.5) * 3) * 0.5; n.corpo.rotation.x = 0.1; }
      break;
    }
  }
  n.grupo.position.copy(pos);
  n.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ Vizinho
function poseDoVizinho(c, t) {
  const v = vizinho;
  v.neutro();
  v.grupo.visible = c.nome === 'faixa' || c.nome === 'upgrade' || c.nome === 'panorama';
  const pos = V(-2.35, 0, 9.85);
  let yaw = Math.PI; // de costas para a câmera, escrevendo na faixa
  if (c.nome === 'faixa') {
    const [r0] = MARCOS.rabisco;
    const [, e1] = MARCOS.escreve;
    if (t < r0) { pos.x = lerp(-0.2, -2.35, ss(t, c.inicio, r0)); yaw = -Math.PI / 2 - 0.5; v.andar(t, 9); }
    else if (t < e1) { v.bracoDir.rotation.set(-2.3 + Math.sin(t * 22) * 0.12, 0, Math.sin(t * 9) * 0.25); } // rabiscando
    else { yaw = lerp(Math.PI, Math.PI * 2 - 0.4, ss(t, e1, e1 + 0.35)); v.bracosCruzados(); } // vira, orgulhoso
  } else {
    pos.set(1.0, 0, 11.6); yaw = Math.PI * 0.8;
    v.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 9) * 0.25);
  }
  v.grupo.position.copy(pos);
  v.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ Rótulos 3D com tamanho constante na tela
const rotulos = [];
function rotulo(r, k, pos) {
  r.visible = k > 0.01;
  if (!r.visible) return;
  r.position.copy(pos);
  r.userData.k = k;
  rotulos.push(r);
}
function ajustarRotulos() {
  for (const r of rotulos) {
    const f = (r.userData.k * 0.04 * camera.position.distanceTo(r.position)) / r.userData.escala[1];
    r.scale.set(r.userData.escala[0] * f, r.userData.escala[1] * f, 1);
  }
  rotulos.length = 0;
}

// ------------------------------------------------------------ Créditos e balões (HTML)
$('trilho').innerHTML = NOVOS.map((a) => `<div>${a}</div>`).join('');
const baloes = Array.from({ length: 28 }, (_, i) => {
  const el = document.createElement('div');
  el.textContent = i === 0 ? 'Eiu😂' : 'Eu';
  $('baloes').appendChild(el);
  const r = Math.sin(i * 91.7) * 0.5 + 0.5, r2 = Math.sin(i * 37.3) * 0.5 + 0.5;
  return { el, x: 110 + r * 280, chao: 470 + r2 * 110, t0: MARCOS.baloes[0] + (i / 28) * (MARCOS.baloes[1] - MARCOS.baloes[0]), giro: (r - 0.5) * 30 };
});

// ------------------------------------------------------------ HUD
let grupoComentario = -1;
const coresAvatar = ['#e1306c', '#833ab4', '#f77737', '#405de6', '#2e7d32'];
function hud(c, t) {
  legendas.atualizar(t);
  const iFala = FALAS.findIndex(([a, b]) => t >= a && t < b);
  const falante = $('falante');
  const ehVizinho = iFala >= 0 && VOZES[iFala] === 'vizinho';
  falante.style.opacity = ehVizinho ? '1' : '0';
  if (ehVizinho) { falante.firstElementChild.textContent = 'VIZINHO'; falante.firstElementChild.style.background = '#c9a7ff'; }

  $('alerta').style.opacity = c.nome === 'festa' ? String(ss(t, 0.3, 0.6)) : '0';

  // Contador gigante: 75 → 200 (confete) → 378
  const [a0, a1] = MARCOS.contaAte200;
  const [b0, b1] = MARCOS.contaAte378;
  const num = t < b0 ? lerp(SEGUIDORES.antes, 200, ss(t, a0, a1)) : lerp(200, SEGUIDORES.depois, Math.pow(Math.min(1, Math.max(0, (t - b0) / (b1 - b0))), 0.8));
  const grande = $('grande');
  grande.style.opacity = c.nome === 'contador' ? '1' : '0';
  $('grandeNum').textContent = String(Math.round(num));
  const pulso = (t > a1 && t < a1 + 0.3) || (t > b1 && t < b1 + 0.4) ? 1.25 : 1;
  grande.firstElementChild.style.transform = `scale(${pulso}) rotate(${t > b1 ? Math.sin(t * 30) * 2 : 0}deg)`;
  grande.firstElementChild.style.borderColor = t > b1 ? '#ff4d6d' : '#ffd23f';

  const cont = $('contador');
  if (c.nome === 'multidao') {
    const n = Math.round(novos * ss(t, INI_MULT + 0.5, INI_MULT + DUR_MULT + 0.5));
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = `+${n} AJUDANTES`;
  } else if (c.nome === 'upgrade' || c.nome === 'panorama') {
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = `${SEGUIDORES.depois} AJUDANTES`;
  } else if (c.nome === 'final') {
    cont.style.opacity = String(ss(t, c.inicio + 0.2, c.inicio + 0.5));
    cont.style.background = 'rgba(20,90,140,.92)'; cont.style.fontSize = '17px';
    cont.textContent = `PRÓXIMA PEÇA: 8ª COSTELA · FALTAM ${SEGUIDORES.proxima - SEGUIDORES.depois} 👀`;
  } else cont.style.opacity = '0';

  // Créditos dos 100 @ mais novos
  const [k0, k1] = MARCOS.creditos;
  const kc = ss(t, k0, k0 + 0.3) * (1 - ss(t, k1 - 0.3, k1));
  $('creditos').style.opacity = String(kc);
  $('creditosTitulo').style.opacity = String(kc);
  const altura = $('trilho').offsetHeight;
  $('trilho').style.transform = `translateY(${lerp(600, 260 - altura, Math.min(1, Math.max(0, (t - k0) / (k1 - k0))))}px)`;

  const prog = $('progresso');
  prog.style.opacity = c.nome === 'upgrade' || c.nome === 'panorama' || c.nome === 'final' ? '1' : '0';
  const pecas = PECAS.antes + efeitosPecas.filter((e) => t >= e.fim).length;
  $('barra').style.width = `${(pecas / arca.total) * 100}%`;
  $('progresso-rotulo').textContent = `ARCA ${Math.round((pecas / arca.total) * 100)}%`;

  document.querySelectorAll('.carimbo').forEach((el, k) => {
    const t0 = efeitosPecas[k].fim + 0.05;
    const e = Math.min(1, Math.max(0, (t - t0) / 0.25));
    const some = ss(t, 41.4, 41.9);
    el.style.opacity = String(Math.min(1, e * 3) * (1 - some));
    el.style.transform = `scale(${e > 0 ? lerp(1.8, 1, e) : 0}) rotate(${k % 2 ? 6 : -8}deg)`;
  });

  // Cartões de comentário
  const iGrupo = COMENTARIOS.findIndex((g) => t >= g.inicio && t < g.fim);
  const caixa = $('comentarios');
  if (iGrupo !== grupoComentario) {
    grupoComentario = iGrupo;
    caixa.innerHTML = iGrupo < 0 ? '' : COMENTARIOS[iGrupo].cartoes.map((ct, j) => `
      <div class="comentario"><div class="cabeca">💬 NOS COMENTÁRIOS</div>
        <div class="cartao-texto"><div class="av" style="background:${coresAvatar[(iGrupo + j) % coresAvatar.length]}">${ct.arroba[1].toUpperCase() === '_' ? ct.arroba[2].toUpperCase() : ct.arroba[1].toUpperCase()}</div>
          <div><div class="arroba">${ct.arroba}</div><div class="txt">${ct.texto}</div>${ct.extra ? `<div class="extra">${ct.extra}</div>` : ''}</div></div></div>`).join('');
  }
  if (iGrupo >= 0) {
    const g = COMENTARIOS[iGrupo];
    caixa.querySelectorAll('.comentario').forEach((el, j) => {
      const t0 = g.inicio + j * (g.passo ?? 0.2);
      const e = Math.min(1, Math.max(0, (t - t0) / 0.28));
      const sai = ss(t, g.fim - 0.25, g.fim);
      const escala = (e < 1 ? 1 - Math.pow(1 - e, 3) + Math.sin(e * Math.PI) * 0.12 : 1) * (1 - sai * 0.3);
      el.style.opacity = String(Math.min(1, e * 2) * (1 - sai));
      el.style.transform = `translateY(${-sai * 30}px) scale(${escala}) rotate(${j % 2 ? 2 : -2}deg)`;
    });
  }

  // "EU" caindo em cima do Noé
  for (const b of baloes) {
    const d = t - b.t0;
    const vis = c.nome === 'davi' && d > 0;
    b.el.style.opacity = vis ? '1' : '0';
    if (!vis) continue;
    const y = Math.min(b.chao, -40 + 0.5 * 2600 * d * d);
    b.el.style.transform = `translate(${b.x}px, ${y}px) rotate(${y >= b.chao ? b.giro : 0}deg)`;
  }

  // Cartão de seguir + recado
  const card = $('cartao');
  const kcard = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35);
  card.style.transform = `translateX(-50%) scale(${kcard * (1 + Math.sin(Math.min(1, Math.max(0, t - MARCOS.cartao) / 0.35) * Math.PI) * 0.08)})`;
  const toque = t > MARCOS.toque;
  const botao = card.querySelector('.botao');
  botao.textContent = toque ? 'Seguindo ✓' : 'Seguir';
  botao.style.background = toque ? '#efefef' : '#0095f6';
  botao.style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, MARCOS.toque - 0.7, MARCOS.toque - 0.5) * (1 - ss(t, MARCOS.toque + 0.7, MARCOS.toque + 1.0)));
  const kcur = ss(t, MARCOS.toque - 0.6, MARCOS.toque - 0.05);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > MARCOS.toque - 0.05 && t < MARCOS.toque + 0.15 ? 0.85 : 1})`;
  $('recado').style.opacity = String(ss(t, MARCOS.toque + 0.6, MARCOS.toque + 0.9));
}

// ------------------------------------------------------------ Quadro
let cenaAtual = -1;
function renderizarEm(t) {
  const c = cenaEm(t);
  if (c.indice !== cenaAtual) {
    cenaAtual = c.indice;
    const antes = CENAS.findIndex((x) => x[1] === 'multidao');
    if (c.nome === 'multidao') ajudantes.definir(SEGUIDORES.depois, SEGUIDORES.antes, AJUDANTES_COMENTARIO, INI_MULT, DUR_MULT);
    else if (c.indice > antes) ajudantes.definir(SEGUIDORES.depois, SEGUIDORES.depois, []);
    else ajudantes.definir(SEGUIDORES.antes, SEGUIDORES.antes, []);
    if (c.nome === 'upgrade') arca.configurar(PECAS.antes, PECAS.depois, MARCOS.pecasInicio, MARCOS.pecasPasso);
    else if (c.nome === 'panorama' || c.nome === 'final') arca.configurar(PECAS.depois, PECAS.depois);
    else arca.configurar(PECAS.antes, PECAS.antes);
  }

  cenario.definirClima(0.2); // sol depois da chuva
  cenario.atualizar(t * 3);
  renderer.toneMappingExposure = 1.0;
  $('escuro').style.opacity = '0';

  poseDoNoe(c, t);
  poseDoVizinho(c, t);

  // Faixa: o vizinho risca o 200 e escreve 378
  desenharFaixa(ss(t, ...MARCOS.rabisco), ss(t, ...MARCOS.escreve));
  faixa.visible = !['upgrade', 'panorama'].includes(c.nome);
  confetes.forEach((cf, k) => cf.atualizar(t, N.clone().add(V((k - 1.5) * 0.8, 3.6, 0.8)), MARCOS.confete + k * 0.04));

  // Ajudantes caindo
  for (const { i, feixe } of feixesMultidao) {
    const d = ajudantes.dados[i];
    feixe.atualizar(c.nome === 'multidao' ? t : -99, d.x, d.z, pousoAjudante(i));
  }
  ajudantes.atualizar(t);

  // Carroça e cavalo
  const [c0, c1] = MARCOS.carroca;
  const chegou = ss(t, c0, c1);
  const xCarroca = c.indice < CENAS.findIndex((x) => x[1] === 'carroca') ? 99 : lerp(CARROCA.x + 18, CARROCA.x, chegou);
  carroca.position.set(xCarroca, 0, CARROCA.z);
  carroca.children.forEach((m) => { if (m.userData.roda) m.rotation.y = (CARROCA.x + 18 - xCarroca) / 0.45; });
  const andando = t > c0 && t < c1;
  cavalo.position.set(xCarroca - 2.9, andando ? Math.abs(Math.sin(t * 9)) * 0.06 : 0, CARROCA.z);
  cavalo.userData.pernas.forEach((perna, i) => { perna.rotation.z = andando ? (i % 2 ? 1 : -1) * Math.sin(t * 9) * 0.35 : 0; });
  torasCarroca.forEach((tora, k) => { tora.visible = t < efeitosPecas[k].fim - 0.5; });
  const kRotCarroca = c.nome === 'carroca' ? ss(t, c1 - 0.2, c1 + 0.1) : 0;
  rotulo(rotuloCavalo, kRotCarroca, cavalo.position.clone().add(V(0, 2.35, 0)));
  rotulo(rotuloCarroca, kRotCarroca, carroca.position.clone().add(V(0.3, 2.0, 0)));

  // @rodri.cuts cai do céu
  const R0 = MARCOS.feixeRodri;
  rodri.visible = t > R0 - 0.45 && c.nome !== 'festa' && c.nome !== 'contador';
  if (rodri.visible) {
    const kq = Math.min(1, (t - (R0 - 0.45)) / 0.45);
    rodri.position.copy(RODRI).add(V(0, (1 - kq * kq) * 7, 0));
  }
  feixeRodri.atualizar(t, RODRI.x, RODRI.z, R0);
  ondaRodri.atualizar(t, RODRI.x, RODRI.z, R0, 3);
  rotulo(rotuloRodri, c.nome === 'rodri' ? ss(t, R0, R0 + 0.2) : 0, RODRI.clone().add(V(0, 1.85, 0)));

  // Placa "PROIBIDO CUPIM" cai e é cravada
  const P0 = MARCOS.placa;
  placa.visible = t > P0 - 0.4;
  if (placa.visible) {
    const kp = Math.min(1, (t - (P0 - 0.4)) / 0.4);
    const cravada = MARCOS.marteladasPlaca.filter((h) => h <= t).length;
    placa.position.copy(PLACA).add(V(0, (1 - kp * kp) * 5 - cravada * 0.08, 0));
  }
  poeiraPlaca.atualizar(t, PLACA.clone().add(V(0, 0.1, 0)), P0);

  // Terror: céu escuro, luz vermelha no rosto e olhos brilhando
  const [te0, te1] = MARCOS.terror;
  const kt = c.nome === 'cupim' ? ss(t, te0, te0 + 0.5) : 0;
  luzTerror.intensity = kt * (14 + Math.sin(t * 23) * 2);
  noe.olhos.children.forEach((o) => { o.material.emissive.set('#ff1a0a'); o.material.emissiveIntensity = kt * 2.5; });
  if (kt > 0) {
    cenario.definirClima(lerp(0.2, 1, kt));
    cenario.sol.intensity *= 1 - kt * 0.85;
    cenario.hemisferica.intensity *= 1 - kt * 0.8;
  }
  $('terror').style.opacity = String(kt);
  const relampago = t > MARCOS.trovaoTerror && t < MARCOS.trovaoTerror + 0.5 ? Math.exp(-(t - MARCOS.trovaoTerror) * 9) : 0;
  $('flash').style.opacity = String(relampago * 0.8);
  camera.fov = lerp(50, 42, c.nome === 'cupim' ? ss(t, te0, te0 + 2.4) : 0);
  camera.updateProjectionMatrix();

  // Os diferentões caem do céu (feixe + poeira) e ficam para o panorama
  const iDif = CENAS.findIndex((x) => x[1] === 'diferentoes');
  for (const a of animaisNovos) {
    a.obj.visible = c.indice > iDif || (c.indice === iDif && t > a.queda - 0.7);
    if (c.indice === iDif && t < a.queda) {
      const kq = Math.max(0, Math.min(1, (t - (a.queda - 0.7)) / 0.7));
      a.obj.position.copy(a.base).add(V(0, (1 - kq * kq) * 9, 0));
      a.obj.scale.setScalar(a.obj.userData.escalaBase ?? (a.obj.userData.escalaBase = a.obj.scale.x));
    } else {
      a.obj.position.copy(a.base);
      const eb = a.obj.userData.escalaBase ?? (a.obj.userData.escalaBase = a.obj.scale.x);
      const amassa = t > a.queda && t < a.queda + 0.3 ? 1 - Math.sin(((t - a.queda) / 0.3) * Math.PI) * 0.18 : 1;
      a.obj.scale.set(eb * (1 + (1 - amassa) * 0.4), eb * amassa, eb * (1 + (1 - amassa) * 0.4));
    }
    a.feixe.atualizar(c.indice === iDif ? t : -99, a.base.x, a.base.z, a.queda);
    a.onda.atualizar(c.indice === iDif ? t : -99, a.base.x, a.base.z, a.queda, 3.5);
    a.poeira.atualizar(c.indice === iDif ? t : -99, a.base.clone().add(V(0, 0.2, 0)), a.queda);
    let kr = 0;
    if (c.indice === iDif) kr = ss(t, a.queda + 0.1, a.queda + 0.3);
    if (c.nome === 'panorama') { const ini = c.inicio + 0.4 + a.k * 0.6; kr = ss(t, ini, ini + 0.15) * (1 - ss(t, ini + 1.6, ini + 1.75)); }
    rotulo(a.rot, kr, a.obj.position.clone().add(V(0, a.altura + (a.k % 2) * 0.35, 0)));
  }

  // Costelas 2 a 7
  arca.atualizar(t);
  for (const e of efeitosPecas) {
    e.onda.atualizar(t, e.x, 0, e.fim, 9, 0.9);
    e.faiscas.atualizar(t, V(e.x, 4, 0), e.fim);
  }
  $('ouro').style.opacity = String(Math.max(0, ...efeitosPecas.map((e) => 1 - Math.abs(t - e.fim) / 0.3)) * 0.7);

  // Cupim espiando atrás da tora (só no final)
  const [s0, s1] = MARCOS.cupimEspia;
  const sobe = ss(t, s0, s0 + 0.3) * (1 - ss(t, s1 - 0.25, s1));
  cupim.visible = c.nome === 'final' && sobe > 0.01;
  toraChao.visible = c.nome === 'final';
  cupim.position.copy(TORA).add(V(0.15, 0.7 + sobe * 0.5, -0.3));
  cupim.rotation.y = -0.2 + Math.sin(t * 2) * 0.2;

  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  const tremor = efeitosPecas.reduce((s, e) => s + impacto(e.fim, 0.25, 6), 0) + animaisNovos.slice(0, 3).reduce((s, a) => s + impacto(a.queda, 0.12, 6), 0) + impacto(P0, 0.08, 8) + impacto(MARCOS.trovaoTerror, 0.12, 4)
    + (c.nome === 'contador' && t > MARCOS.contaAte378[1] ? 0.03 : 0);
  pos.x += Math.sin(t * 61) * tremor; pos.y += Math.cos(t * 47) * tremor;
  camera.position.copy(pos);
  camera.lookAt(alvo);
  ajustarRotulos();

  hud(c, t);
  renderer.render(cena, camera);
}

await new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = 'assets/perfil.jpg'; });
await document.fonts.ready;

window.__duracao = DURACAO;
window.__renderizarEm = renderizarEm;
renderizarEm(0);
window.__pronto = true;

if (!new URLSearchParams(location.search).has('gravando')) {
  const t0 = performance.now();
  renderer.setAnimationLoop(() => renderizarEm(((performance.now() - t0) / 1000) % DURACAO));
}
