// Vídeo 05: "O traidor da arca". Tudo é função do tempo t.
// Tempos em js/video05-tempos.js · Roteiro em docs/roteiro-video-05.md
import * as THREE from 'three';
import { Arca, COMPRIMENTO, baseY } from './arca.js';
import { Noe, Vizinho, Ajudantes, criarAnimal, criarCupim, baterAsas } from './personagens.js';
import { Cenario } from './cenario.js';
import { etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V } from './efeitos.js';
import { DURACAO, FALAS, VOZES, CENAS, MARCOS, COMENTARIOS, NOVOS, ESQUECIDOS, SEGUIDORES, PECAS } from './video05-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/video05-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }

const $ = (id) => document.getElementById(id);
const cenaEm = (t) => {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
};
const YAW_CAMERA = -Math.PI / 2;
const madeira = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, flatShading: true });
const sombrear = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const indiceCena = (nome) => CENAS.findIndex((x) => x[1] === nome);

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

const N = V(-1, 0, 12.1);
const CABECA = N.clone().add(V(0, 2.15, 0));
const noe = new Noe();
noe.cajado.visible = false;
cena.add(noe.grupo);

// Ajudantes (o desenho para em 600; o contador mostra o número real)
const ajudantes = new Ajudantes();
ajudantes.definir(SEGUIDORES.antes, SEGUIDORES.antes, []);
ajudantes.dados.forEach((d, i) => {
  if (d.x > -6 && d.x < 16 && d.z > 9.6 && d.z < 24) {
    const r = Math.sin(i * 12.9898) * 0.5 + 0.5;
    d.x = d.x < 5 ? -6.5 - r * 4 : 16.5 + r * 4;
    d.rotacao = Math.atan2(-d.x, -d.z);
  }
});
cena.add(ajudantes.grupo);
const [INI_MULT, DUR_MULT] = MARCOS.multidao;
const feixesMultidao = Array.from({ length: 14 }, (_, k) => ({ i: SEGUIDORES.antes + 4 + k * 15, feixe: new Feixe(cena) }));
const pousoAjudante = (i) => INI_MULT + ((i - SEGUIDORES.antes) / (600 - SEGUIDORES.antes)) * DUR_MULT + 0.5;

// ------------------------------------------------------------ O buraco no fundo da arca (com luz) e o olho
const BURACO = V(-5.0, baseY(-5.0) + 0.07, 1.3);
const buraco = new THREE.Group();
{
  const forma = new THREE.Shape();
  for (let i = 0; i <= 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const r = 0.42 + (Math.sin(i * 7.3) * 0.5 + 0.5) * 0.16; // borda roída, irregular
    i ? forma.lineTo(Math.cos(a) * r, Math.sin(a) * r) : forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const fundo = new THREE.Mesh(new THREE.ShapeGeometry(forma).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#0b0603' }));
  const lascasBorda = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.66, 12).rotateX(-Math.PI / 2), madeira('#d8a25e'));
  lascasBorda.position.y = -0.005;
  const luz = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 6, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: '#fff4c4', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  luz.position.y = 3;
  buraco.add(lascasBorda, fundo, luz);
  buraco.userData.luz = luz;
  buraco.position.copy(BURACO);
  cena.add(buraco);
}
const olho = new THREE.Group();
{
  const branco = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.3 }));
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshStandardMaterial({ color: '#7a3b12', roughness: 0.3 }));
  iris.position.set(0, 0.04, 0.16);
  const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 6), new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.2 }));
  pupila.position.set(0, 0.06, 0.24);
  olho.add(branco, iris, pupila);
  olho.position.copy(BURACO).add(V(0, -0.25, 0));
  cena.add(olho);
}

// ------------------------------------------------------------ Fila de suspeitos
const LINHA = V(6.0, 0, 13.0);
const paredeSuspeitos = new THREE.Group();
{
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 600;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5d6f86'; ctx.fillRect(0, 0, 1024, 600);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.fillStyle = '#fff'; ctx.font = '800 26px "DejaVu Sans", sans-serif';
  for (let i = 1; i <= 5; i++) {
    const y = 600 - i * 100;
    ctx.lineWidth = i % 2 ? 3 : 5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
    ctx.fillText(`${(i * 0.5).toFixed(1)} m`, 12, y - 8);
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const parede = new THREE.Mesh(new THREE.PlaneGeometry(5.12, 3.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  parede.position.set(0, 1.5, 0);
  paredeSuspeitos.add(parede);
  [1, 2, 3].forEach((num, k) => {
    const pc = document.createElement('canvas');
    pc.width = 128; pc.height = 96;
    const p = pc.getContext('2d');
    p.fillStyle = '#111'; p.fillRect(0, 0, 128, 96);
    p.fillStyle = '#fff'; p.font = '900 64px "DejaVu Sans", sans-serif'; p.textAlign = 'center'; p.textBaseline = 'middle';
    p.fillText(String(num), 64, 52);
    const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshBasicMaterial({ map: pt }));
    placa.position.set((k - 1) * 1.45, 0.25, 0.4);
    placa.rotation.x = -0.35;
    paredeSuspeitos.add(placa);
  });
  paredeSuspeitos.position.copy(LINHA).add(V(0, 0, -0.6));
  cena.add(paredeSuspeitos);
}
const cupimSuspeito = criarCupim();
cupimSuspeito.scale.setScalar(3.2);
cupimSuspeito.position.copy(LINHA).add(V(-1.45, 0.9, 0));
cena.add(cupimSuspeito);
const vizinho = new Vizinho();
cena.add(vizinho.grupo);
function criarBoneco(roupa, pele) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.85, 7), madeira(roupa));
  corpo.position.y = 0.43;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), madeira(pele));
  cabeca.position.y = 1.0;
  g.add(corpo, cabeca);
  return sombrear(g);
}
const encapuzado = criarBoneco('#2a2a30', '#1a1a1e');
{
  const capuz = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.55, 8), madeira('#2a2a30'));
  capuz.position.y = 1.12;
  encapuzado.add(capuz);
  for (const l of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
    o.position.set(l * 0.07, 1.0, 0.17);
    encapuzado.add(o);
  }
}
encapuzado.scale.setScalar(1.45);
encapuzado.position.copy(LINHA).add(V(1.45, 0, 0));
cena.add(encapuzado);
const rotuloEncapuzado = etiqueta3D('@emanuel_.boyzao ?', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloEncapuzado);

// ------------------------------------------------------------ "Ayrton Senna" (@valentina.m.s.o)
const senna = criarBoneco('#e8e8e8', '#e0ac69');
{
  const capacete = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), madeira('#ffd400'));
  capacete.position.y = 1.03;
  const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 16), madeira('#1b7a2e'));
  faixa.rotation.x = Math.PI / 2;
  faixa.position.y = 1.05;
  senna.add(capacete, faixa);
}
senna.scale.setScalar(1.3);
cena.add(senna);
const fumaca = new Explosao(cena, { n: 120, cor: '#d9d9d9', tamanho: 0.35, velocidade: 0.8, subida: 0.6, gravidade: -0.3, dur: 1.2, semente: 31 });
const rotuloSenna = etiqueta3D('@valentina.m.s.o 🏎️', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloSenna);

// ------------------------------------------------------------ Os esquecidos
const POS_ESQ = [N.clone().add(V(1.5, 0, 0.3)), N.clone().add(V(2.5, 0, 0.0)), N.clone().add(V(3.5, 0, -0.3))];
const esquecidos = ESQUECIDOS.map((arroba, k) => {
  const b = criarBoneco(['#c0392b', '#2e86c1', '#27ae60'][k], ['#f1c27d', '#c68642', '#e0ac69'][k]);
  b.scale.setScalar(1.25);
  cena.add(b);
  const rot = etiqueta3D(`${arroba} 🔨`, { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
  cena.add(rot);
  return { b, rot, pos: POS_ESQ[k], pouso: MARCOS.esquecidos[k], feixe: new Feixe(cena), onda: new Onda(cena) };
});

// ------------------------------------------------------------ Caramelo (@d4vix_408)
const caramelo = criarAnimal('cachorro', 8);
caramelo.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHexString() === 'c08a4a') { o.material = o.material.clone(); o.material.color.set('#d9893a'); } });
caramelo.scale.setScalar(1.25);
cena.add(caramelo);
const rotuloCaramelo = etiqueta3D('@d4vix_408 🐕', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloCaramelo);
const VIZ = N.clone().add(V(0.6, 0, 1.6));

// ------------------------------------------------------------ Harpia (@guto_2.018) carregando as costelas 8, 9 e 10
const harpia = criarAnimal('harpia', 1);
cena.add(harpia);
const rotuloHarpia = etiqueta3D('@guto_2.018 🦅', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloHarpia);
const xsCostelas = [];
for (let i = 1; i <= 11; i++) xsCostelas.push(-COMPRIMENTO / 2 + COMPRIMENTO * (i / 12));
xsCostelas.sort((a, b) => Math.abs(a) - Math.abs(b));
const novasPecas = [0, 1, 2].map((k) => {
  const peca = arca.pecas[PECAS.antes + k];
  const x = xsCostelas[PECAS.antes - 3 + k]; // peça 3 = 1ª costela → peça 10 = 8ª costela = 8º da lista ordenada
  const carregada = peca.objeto.clone();
  carregada.visible = false;
  cena.add(carregada);
  return {
    peca, x, carregada, pouso: MARCOS.pecasPouso[k],
    onda: new Onda(cena, '#ffe9a8'),
    faiscas: new Explosao(cena, { n: 140, cor: '#ffd76a', tamanho: 0.2, velocidade: 8, subida: 5, dur: 1.2, semente: 300 + k }),
  };
});
const ALTURA_VOO = 10.9;
function posicaoHarpia(t) {
  const [p0, p1, p2] = MARCOS.pecasPouso;
  const pontos = [
    [27.6, V(-34, 18, 6)],
    [p0 - 0.5, V(novasPecas[0].x, ALTURA_VOO, 0.4)],
    [p0 + 0.1, V(novasPecas[0].x, ALTURA_VOO + 0.6, 0.4)],
    [p1 - 0.5, V(novasPecas[1].x, ALTURA_VOO, 0.4)],
    [p1 + 0.1, V(novasPecas[1].x, ALTURA_VOO + 0.6, 0.4)],
    [p2 - 0.5, V(novasPecas[2].x, ALTURA_VOO, 0.4)],
    [p2 + 0.1, V(novasPecas[2].x, ALTURA_VOO + 0.6, 0.4)],
    [36.2, V(-30, 22, -10)],
  ];
  if (t <= pontos[0][0]) return pontos[0][1].clone();
  for (let i = 0; i + 1 < pontos.length; i++) {
    const [ta, a] = pontos[i], [tb, b] = pontos[i + 1];
    if (t <= tb) return a.clone().lerp(b, ss(t, ta, tb));
  }
  return pontos[pontos.length - 1][1].clone();
}

// ------------------------------------------------------------ Pós-créditos: a pegada gigante
const pegada = new THREE.Group();
{
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3b2412';
  ctx.beginPath(); ctx.ellipse(128, 170, 52, 62, 0, 0, Math.PI * 2); ctx.fill();
  for (const [dx, ang] of [[-62, -0.45], [0, 0], [62, 0.45]]) { // três dedos com garra
    ctx.save(); ctx.translate(128 + dx * 0.9, 110); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, -48, 20, 56, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -100); ctx.lineTo(0, -126); ctx.lineTo(10, -100); ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, depthWrite: false }));
  decal.position.y = 0.04;
  pegada.add(decal);
  pegada.position.set(6.2, 0, 15.2);
  pegada.rotation.y = 0.5;
  cena.add(pegada);
}
const poeiraPegada = new Explosao(cena, { n: 160, cor: '#c9a87a', tamanho: 0.2, velocidade: 5, subida: 3, dur: 1.4, semente: 91 });
const torasPulando = [0, 1, 2, 3].map((k) => {
  const tora = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 7), madeira('#a8682f'));
  tora.rotation.z = Math.PI / 2;
  tora.rotation.y = k * 0.4;
  tora.userData.base = V(3.2 + k * 0.5, 0.16, 17.2 + (k % 2) * 0.5);
  cena.add(sombrear(tora));
  return tora;
});
const luar = new THREE.DirectionalLight('#8fb0ff', 0);
luar.position.set(-20, 30, 20);
cena.add(luar);

// ------------------------------------------------------------ Efeitos gerais
const flashSuspeitos = MARCOS.flashes;

// ------------------------------------------------------------ Câmera
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  const L = (a, b) => a.clone().lerp(b, k);
  switch (c.nome) {
    case 'buraco': return [L(BURACO.clone().add(V(1.6, 3.4, 3.8)), BURACO.clone().add(V(0.8, 2.3, 2.4))), BURACO.clone()];
    case 'confissao': return [L(N.clone().add(V(0.4, 2.05, 4.4)), N.clone().add(V(0.3, 2.05, 3.6))), CABECA.clone().add(V(0, -0.3, 0))];
    case 'suspeitos': return [L(LINHA.clone().add(V(0.3, 1.9, 9.6)), LINHA.clone().add(V(0.1, 1.8, 8.6))), LINHA.clone().add(V(0, 1.25, 0))];
    case 'multidao':
      if (t < 14.4) return [V(10, 18, 46).lerp(V(7, 15, 41), ss(t, c.inicio, 14.4)), V(0, 1, 4)];
      return [V(1.5, 1.7, 24.5).lerp(V(1.2, 1.6, 23.5), ss(t, 14.4, c.fim)), V(0.5, 1.1, 17.5)];
    case 'esquecidos': return [L(N.clone().add(V(2.4, 2.1, 7.8)), N.clone().add(V(2.3, 2.0, 7.0))), N.clone().add(V(2.2, 1.25, 0))];
    case 'caramelo': return [L(N.clone().add(V(1.8, 2.3, 9.4)), N.clone().add(V(1.6, 2.2, 8.6))), N.clone().add(V(1.5, 0.9, 1.4))];
    case 'harpia': {
      const h = posicaoHarpia(t);
      const hx = Math.max(-17, Math.min(15, h.x));
      return [V(hx * 0.75, 5.5, 25), V(hx, 8.2, 0)];
    }
    case 'espiando': {
      const desce = ss(t, c.inicio + 0.3, 38.4);
      return [V(-2, 10, 24).lerp(BURACO.clone().add(V(0.5, 1.6, 2.2)), desce), V(-2, 3, 0).lerp(BURACO.clone(), desce)];
    }
    case 'final': return [L(N.clone().add(V(0.6, 2.0, 5.0)), N.clone().add(V(0.5, 1.95, 4.3))), N.clone().add(V(0.15, 1.6, 0))];
    case 'poscreditos': return [V(3.6, 3.2, 21.5).lerp(V(4.0, 2.9, 20.6), k), V(5.6, 0.4, 15.6)];
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
  n.grupo.visible = true;
  const pos = N.clone();
  let yaw = 0;
  switch (c.nome) {
    case 'confissao': { // indignado, braços abertos
      const tremor = Math.sin(t * 30) * 0.05;
      n.bracoDir.rotation.set(-0.4, 0, 1.6 + tremor); n.bracoEsq.rotation.set(-0.4, 0, -1.6 - tremor);
      n.corpo.rotation.x = 0.08;
      break;
    }
    case 'suspeitos': yaw = 0.9; n.bracoDir.rotation.set(-1.6, 0, 0.2); break;
    case 'multidao': n.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 8) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.5 - Math.sin(t * 8) * 0.2); break;
    case 'esquecidos': yaw = 0.45; n.bracoDir.rotation.set(-0.5, 0, 1.4); n.bracoEsq.rotation.set(-0.5, 0, -1.4); break; // braços abertos
    case 'caramelo': yaw = 0.4; n.bracoDir.rotation.set(0, 0, 2.4 + Math.sin(t * 9) * 0.25); n.corpo.position.y = Math.abs(Math.sin(t * 6)) * 0.06; break;
    case 'harpia': case 'espiando': yaw = Math.PI * 0.85; n.bracoDir.rotation.set(0, 0, 2.5); n.bracoEsq.rotation.set(0, 0, -2.5); break;
    case 'final': if (t < 44.6) n.bracoDir.rotation.set(-1.5, 0, 0); else { n.bracoDir.rotation.set(-0.3, 0, 0.9); n.bracoEsq.rotation.set(-0.3, 0, -0.9); yaw = Math.sin(t * 2.5) * 0.3; } break;
    case 'poscreditos': { // de lanterna? não: tremendo, encolhido, olhando a pegada
      pos.set(4.0, 0, 16.6);
      yaw = 0.9;
      n.corpo.rotation.x = 0.12;
      const tremor = Math.sin(t * 40) * 0.04;
      n.bracoDir.rotation.set(-1.2, 0, -0.6 + tremor); n.bracoEsq.rotation.set(-1.2, 0, 0.6 - tremor);
      break;
    }
  }
  n.grupo.position.copy(pos);
  n.grupo.rotation.y = yaw;
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
function cair(obj, base, pouso, t, dur = 0.5, altura = 7) {
  obj.visible = t > pouso - dur;
  if (!obj.visible) return;
  const k = Math.min(1, (t - (pouso - dur)) / dur);
  obj.position.copy(base).add(V(0, (1 - k * k) * altura, 0));
}

// ------------------------------------------------------------ Créditos (HTML)
$('trilho').innerHTML = NOVOS.map((a) => `<div>${a}</div>`).join('');

// ------------------------------------------------------------ HUD
let grupoComentario = -1;
const coresAvatar = ['#e1306c', '#833ab4', '#f77737', '#405de6', '#2e7d32'];
const inicial = (a) => (a[1] === '_' || a[1] === '.' ? a[2] : a[1]).toUpperCase();
function hud(c, t) {
  legendas.atualizar(t);
  $('falante').style.opacity = '0';
  $('dia').style.opacity = c.nome === 'poscreditos' ? '0' : '1';
  $('alerta').style.opacity = c.nome === 'buraco' || c.nome === 'confissao' ? String(0.75 + 0.25 * Math.sin(t * 10)) : '0';
  $('titulo').style.opacity = String(c.nome === 'suspeitos' ? ss(t, 7.2, 7.5) : 0);

  const cont = $('contador');
  if (c.nome === 'multidao') {
    const n = Math.round((SEGUIDORES.depois - SEGUIDORES.antes) * ss(t, INI_MULT + 0.5, INI_MULT + DUR_MULT + 0.5));
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = `+${n} AJUDANTES`;
  } else if (c.nome === 'harpia' || c.nome === 'espiando') {
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = `${SEGUIDORES.depois} AJUDANTES`;
  } else if (c.nome === 'final') {
    cont.style.opacity = String(ss(t, c.inicio + 0.2, c.inicio + 0.5));
    cont.style.background = 'rgba(20,90,140,.92)'; cont.style.fontSize = '17px';
    cont.textContent = `PRÓXIMA PEÇA: 11ª COSTELA · FALTAM ${SEGUIDORES.proxima - SEGUIDORES.depois} 👀`;
  } else cont.style.opacity = '0';

  const [k0, k1] = MARCOS.creditos;
  const kc = ss(t, k0, k0 + 0.3) * (1 - ss(t, k1 - 0.3, k1)) * (t < 14.4 ? 1 : 0);
  $('creditos').style.opacity = String(kc);
  $('creditosTitulo').style.opacity = String(kc);
  const altura = $('trilho').offsetHeight;
  $('trilho').style.transform = `translateY(${lerp(600, 260 - altura, Math.min(1, Math.max(0, (t - k0) / (14.4 - k0))))}px)`;

  $('progresso').style.opacity = ['harpia', 'espiando', 'final'].includes(c.nome) ? '1' : '0';
  const pecas = PECAS.antes + novasPecas.filter((p) => t >= p.pouso).length;
  $('barra').style.width = `${(pecas / arca.total) * 100}%`;
  $('progresso-rotulo').textContent = `ARCA ${Math.round((pecas / arca.total) * 100)}%`;
  document.querySelectorAll('.carimbo').forEach((el, k) => {
    const t0 = novasPecas[k].pouso + 0.05;
    const e = Math.min(1, Math.max(0, (t - t0) / 0.25));
    const some = ss(t, 35.6, 36.0);
    el.style.opacity = String(Math.min(1, e * 3) * (1 - some));
    el.style.transform = `scale(${e > 0 ? lerp(1.8, 1, e) : 0}) rotate(${k % 2 ? 5 : -6}deg)`;
  });

  // Cartões de comentário
  const iGrupo = COMENTARIOS.findIndex((g) => t >= g.inicio && t < g.fim);
  const caixa = $('comentarios');
  if (iGrupo !== grupoComentario) {
    grupoComentario = iGrupo;
    const g = COMENTARIOS[iGrupo];
    caixa.innerHTML = iGrupo < 0 ? '' : g.cartoes.map((ct, j) => `
      <div class="comentario"><div class="cabeca">💬 NOS COMENTÁRIOS</div>
        <div class="cartao-texto"><div class="av" style="background:${coresAvatar[(iGrupo + j) % coresAvatar.length]}">${inicial(ct.arroba)}</div>
          <div><div class="arroba">${ct.arroba}</div><div class="txt">${ct.texto}</div></div></div>
        ${ct.selo ? `<div class="selo">${ct.selo}</div>` : ''}</div>`).join('');
  }
  if (iGrupo >= 0) {
    const g = COMENTARIOS[iGrupo];
    caixa.querySelectorAll('.comentario').forEach((el, j) => {
      const e = Math.min(1, Math.max(0, (t - g.inicio) / 0.25));
      const sai = ss(t, g.fim - 0.2, g.fim);
      const escala = (e < 1 ? 1 - Math.pow(1 - e, 3) + Math.sin(e * Math.PI) * 0.12 : 1) * (1 - sai * 0.3);
      el.style.opacity = String(Math.min(1, e * 2) * (1 - sai));
      el.style.transform = `translateY(${-sai * 30}px) scale(${escala}) rotate(${j % 2 ? 2 : -2}deg)`;
    });
  }

  // Cartão de seguir + recado
  const card = $('cartao');
  const kcard = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35) * (1 - ss(t, 45.6, 45.9));
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
  $('recado').style.opacity = String(c.nome === 'final' ? ss(t, MARCOS.toque + 0.6, MARCOS.toque + 0.9) : 0);

  // Pós-créditos: tela preta com o aviso, depois a noite
  const [p0] = CENAS[indiceCena('poscreditos')];
  $('preto').style.opacity = String(ss(t, p0 - 0.15, p0) * (1 - ss(t, p0 + 0.9, p0 + 1.2)));
}

// ------------------------------------------------------------ Quadro
let cenaAtual = -1;
function renderizarEm(t) {
  const c = cenaEm(t);
  if (c.indice !== cenaAtual) {
    cenaAtual = c.indice;
    const iMult = indiceCena('multidao');
    if (c.indice === iMult) ajudantes.definir(SEGUIDORES.depois, SEGUIDORES.antes, [], INI_MULT, DUR_MULT);
    else if (c.indice > iMult) ajudantes.definir(SEGUIDORES.depois, SEGUIDORES.depois, []);
    else ajudantes.definir(SEGUIDORES.antes, SEGUIDORES.antes, []);
    arca.configurar(PECAS.antes, PECAS.antes);
  }

  // Clima: dia; pós-créditos à noite
  const noite = c.nome === 'poscreditos' ? 1 : 0;
  cenario.definirClima(noite ? 0.75 : 0.2);
  cenario.atualizar(t * 3);
  if (noite) { cenario.sol.intensity = 0.15; cenario.hemisferica.intensity = 0.35; }
  luar.intensity = noite * 2.2;
  $('noite').style.opacity = String(noite * 0.38);
  renderer.toneMappingExposure = 1.0;
  $('escuro').style.opacity = '0';

  poseDoNoe(c, t);

  // Buraco: luz pulsando; o olho sobe e pisca
  buraco.userData.luz.material.opacity = 0.16 + Math.sin(t * 3) * 0.05;
  const [o0, o1] = MARCOS.olho;
  const sobeOlho = ss(t, o0, o0 + 0.4) * (1 - ss(t, o1 - 0.3, o1));
  olho.visible = c.nome === 'espiando' && sobeOlho > 0.01;
  olho.position.copy(BURACO).add(V(0, -0.25 + sobeOlho * 0.27, 0));
  olho.lookAt(camera.position);
  const piscada = t > o0 + 1.0 && t < o0 + 1.15 ? 0.1 : 1;
  olho.scale.set(1, piscada, 1);

  // Fila de suspeitos
  const naFila = c.nome === 'suspeitos';
  paredeSuspeitos.visible = cupimSuspeito.visible = encapuzado.visible = naFila;
  cupimSuspeito.rotation.y = Math.sin(t * 2) * 0.2;
  cupimSuspeito.userData.antenas.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (0.5 + Math.sin(t * 9) * 0.25); });
  encapuzado.rotation.y = Math.sin(t * 1.3) * 0.15;
  const flash = Math.max(0, ...flashSuspeitos.map((h) => (t > h && t < h + 0.35 ? Math.exp(-(t - h) * 12) : 0)));
  $('flash').style.opacity = String(naFila ? flash * 0.9 : 0);
  rotulo(rotuloEncapuzado, naFila ? ss(t, flashSuspeitos[2], flashSuspeitos[2] + 0.2) : 0, encapuzado.position.clone().add(V(0, 2.4, 0)));

  // Vizinho: suspeito assobiando; depois perde o chapéu para o caramelo
  const v = vizinho;
  v.neutro();
  v.grupo.visible = naFila || c.nome === 'caramelo';
  if (naFila) {
    v.grupo.position.copy(LINHA);
    v.grupo.rotation.y = 0;
    v.bracoDir.rotation.set(0.6, 0, -0.2); v.bracoEsq.rotation.set(0.6, 0, 0.2); // mãos para trás
    v.cabeca.rotation.set(-0.25, 0, Math.sin(t * 3) * 0.12); // olhando para cima, disfarçando
  } else if (c.nome === 'caramelo') {
    v.grupo.position.copy(VIZ);
    v.grupo.rotation.y = 0.2;
    v.chapeu.visible = t < MARCOS.chapeu;
    if (t > MARCOS.chapeu) { v.bracoDir.rotation.set(0, 0, 2.6); v.bracoEsq.rotation.set(0, 0, -2.6); v.corpo.rotation.z = Math.sin(t * 12) * 0.06; }
  }

  // Ajudantes caindo
  for (const { i, feixe } of feixesMultidao) {
    const d = ajudantes.dados[i];
    feixe.atualizar(c.nome === 'multidao' ? t : -99, d.x, d.z, pousoAjudante(i));
  }
  ajudantes.atualizar(t);

  // Senna passa voando com fumaça
  const [sn0, sn1] = MARCOS.senna;
  const ks = (t - sn0) / (sn1 - sn0);
  senna.visible = c.nome === 'multidao' && ks > -0.1 && ks < 1.4;
  const xs = lerp(-14, 16, Math.min(1.2, Math.max(-0.1, ks)));
  senna.position.set(xs, Math.abs(Math.sin(t * 25)) * 0.06, 17.6);
  senna.rotation.set(0, Math.PI / 2, -0.25);
  fumaca.atualizar(c.nome === 'multidao' ? t : -99, V(Math.max(-14, xs - 1.2), 0.4, 17.6), sn0 + 0.2);
  rotulo(rotuloSenna, c.nome === 'multidao' && t > 14.4 ? ss(t, sn0, sn0 + 0.2) : 0, senna.position.clone().add(V(-0.8, 1.9, 0)));

  // Os esquecidos caem em feixes dourados
  for (const e of esquecidos) {
    cair(e.b, e.pos, e.pouso, t);
    e.b.visible = e.b.visible && c.indice >= indiceCena('esquecidos') && c.indice <= indiceCena('caramelo');
    e.feixe.atualizar(t, e.pos.x, e.pos.z, e.pouso);
    e.onda.atualizar(t, e.pos.x, e.pos.z, e.pouso, 3);
    rotulo(e.rot, c.nome === 'esquecidos' ? ss(t, e.pouso + 0.1, e.pouso + 0.3) : 0, e.pos.clone().add(V(0, 1.75 + (e.b === esquecidos[1].b ? 0.4 : 0), 0)));
  }

  // Caramelo: entra correndo, rouba o chapéu e dá voltas
  const [cr0, cr1] = MARCOS.caramelo;
  caramelo.visible = c.nome === 'caramelo';
  let cp;
  if (t < cr1) cp = V(lerp(N.x + 7, VIZ.x + 0.7, ss(t, cr0, cr1)), 0, VIZ.z + 0.6);
  else { const a = (t - cr1) * 3.2; cp = N.clone().add(V(1.4 + Math.cos(a) * 1.3, 0, 2.3 + Math.sin(a) * 0.6)); }
  const pulo = t > MARCOS.chapeu - 0.3 && t < MARCOS.chapeu + 0.2 ? Math.sin(((t - MARCOS.chapeu + 0.3) / 0.5) * Math.PI) * 0.8 : 0;
  caramelo.position.copy(cp).add(V(0, pulo + Math.abs(Math.sin(t * 14)) * 0.05, 0));
  caramelo.rotation.y = t < cr1 ? Math.PI : -((t - cr1) * 3.2) - Math.PI / 2;
  caramelo.userData.pernas.forEach((p, i) => { p.rotation.z = (i % 2 ? 1 : -1) * Math.sin(t * 16) * 0.5; });
  // o chapéu vai junto, na boca do caramelo
  if (!caramelo.userData.chapeu) {
    const ch = v.chapeu.clone();
    ch.scale.setScalar(1.1);
    cena.add(ch);
    caramelo.userData.chapeu = ch;
  }
  const chapeuBoca = caramelo.userData.chapeu;
  chapeuBoca.visible = c.nome === 'caramelo' && t > MARCOS.chapeu;
  const frente = V(Math.cos(-caramelo.rotation.y) * 0.75, 0, Math.sin(-caramelo.rotation.y) * 0.75);
  chapeuBoca.position.copy(caramelo.position).add(frente).add(V(0, 1.05, 0));
  chapeuBoca.rotation.set(0.5, t * 2, 0.3);
  rotulo(rotuloCaramelo, c.nome === 'caramelo' ? ss(t, cr1 - 0.3, cr1) : 0, caramelo.position.clone().add(V(0, 1.7, 0)));

  // Harpia e as costelas
  const hp = posicaoHarpia(t);
  harpia.visible = c.nome === 'harpia';
  harpia.position.copy(hp);
  const prox = posicaoHarpia(t + 0.05);
  const dir = prox.clone().sub(hp);
  if (dir.lengthSq() > 1e-6) harpia.rotation.y = Math.atan2(-dir.z, dir.x);
  else harpia.rotation.y = YAW_CAMERA;
  baterAsas(harpia, 1, t * 9);
  rotulo(rotuloHarpia, c.nome === 'harpia' ? ss(t, 28.2, 28.5) * (1 - ss(t, 35.4, 35.7)) : 0, hp.clone().add(V(0, 2.4, 0)));
  arca.atualizar(t);
  const iHarpia = indiceCena('harpia');
  for (const p of novasPecas) {
    const solta = p.pouso - 0.5;
    const carregando = c.nome === 'harpia' && t < solta && t > 27.6;
    p.carregada.visible = carregando && (p === novasPecas.find((q) => t < q.pouso - 0.5));
    if (p.carregada.visible) p.carregada.position.set(hp.x - p.x, hp.y - 8.9, hp.z - 0.4);
    p.peca.objeto.visible = c.indice > iHarpia || (c.indice === iHarpia && t > solta);
    if (p.peca.objeto.visible) {
      p.peca.objeto.position.copy(p.peca.posicaoFinal);
      p.peca.objeto.scale.setScalar(1);
      if (t < p.pouso) { const k = (t - solta) / 0.5; p.peca.objeto.position.y += (1 - k * k) * (ALTURA_VOO - 8.9); }
    }
    p.onda.atualizar(t, p.x, 0, p.pouso, 9, 0.9);
    p.faiscas.atualizar(t, V(p.x, 4, 0), p.pouso);
  }
  $('ouro').style.opacity = String(Math.max(0, ...novasPecas.map((p) => 1 - Math.abs(t - p.pouso) / 0.3)) * 0.6);

  // Pós-créditos: tremores, toras pulando, pegada gigante
  const tremores = MARCOS.tremores;
  const tremor0 = noite ? Math.max(0, ...tremores.map((h) => (t > h ? Math.exp(-(t - h) * 5) : 0))) : 0;
  torasPulando.forEach((tora, k) => {
    tora.visible = !!noite;
    const pulo2 = Math.max(0, ...tremores.map((h) => (t > h && t < h + 0.35 ? Math.sin(((t - h) / 0.35) * Math.PI) * (0.25 + k * 0.05) : 0)));
    tora.position.copy(tora.userData.base).add(V(0, pulo2, 0));
  });
  pegada.visible = noite && t > MARCOS.pegada;
  poeiraPegada.atualizar(noite ? t : -99, pegada.position.clone().add(V(0, 0.2, 0)), MARCOS.pegada);

  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  const tremor = novasPecas.reduce((s, p) => s + impacto(p.pouso, 0.3, 6), 0) + tremor0 * 0.35 + (c.nome === 'confissao' ? 0.015 : 0);
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
