// Vídeo 06: "O roubo da madeira". Tudo é função do tempo t.
// Tempos em js/video06-tempos.js · Roteiro em docs/roteiro-video-06.md
import * as THREE from 'three';
import { Arca } from './arca.js';
import { Noe, Vizinho, Ajudantes, criarAnimal, criarCupim, baterAsas, criarTrex, criarDragao } from './personagens.js';
import { Cenario } from './cenario.js';
import { Chuva, brilhoDoRaio, etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V, mulberry } from './efeitos.js';
import { DURACAO, FALAS, VOZES, CENAS, MARCOS, COMENTARIOS, NOVOS, APARECEU, SEGUIDORES, PECAS } from './video06-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/video06-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }

const $ = (id) => document.getElementById(id);
const cenaEm = (t) => {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
};
const indiceCena = (nome) => CENAS.findIndex((x) => x[1] === nome);
const faixa = (nome) => { const i = indiceCena(nome); return [CENAS[i][0], CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO]; };
const madeira = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, flatShading: true });
const sombrear = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const aditivo = (cor, opacidade) => new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opacidade, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
// direção "para frente" (+x local) de um objeto girado em y
const frenteDe = (yaw) => V(Math.cos(yaw), 0, -Math.sin(yaw));
const yawPara = (de, para) => Math.atan2(-(para.z - de.z), para.x - de.x);

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
const chuva = new Chuva(cena);
const luar = new THREE.DirectionalLight('#8fb0ff', 0);
luar.position.set(-20, 30, 20);
cena.add(luar);

const N = V(-1, 0, 12.1);
const noe = new Noe();
noe.cajado.visible = false;
cena.add(noe.grupo);

// Ajudantes: com 1700 já são os 600 desenhados. A frente da obra fica livre para as cenas.
const ajudantes = new Ajudantes();
ajudantes.definir(SEGUIDORES.antes, SEGUIDORES.antes, []);
ajudantes.dados.forEach((d, i) => {
  if (d.x > -24 && d.x < 17 && d.z > 7.2 && d.z < 28) {
    const r = Math.sin(i * 12.9898) * 0.5 + 0.5;
    d.x = d.x < -3 ? -24.5 - r * 5 : 17.5 + r * 5;
    d.rotacao = Math.atan2(-d.x, -d.z);
  }
});
ajudantes.definir(SEGUIDORES.antes, SEGUIDORES.antes, []);
cena.add(ajudantes.grupo);

// Boneco de gente (mesma base dos ajudantes), com braços. Olha para +z.
function criarPessoa(roupa, pele, escala = 1.25) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.85, 7), madeira(roupa));
  corpo.position.y = 0.43;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), madeira(pele));
  cabeca.position.y = 1.0;
  g.add(corpo, cabeca);
  const bracos = [-1, 1].map((l) => {
    const pivo = new THREE.Group();
    pivo.position.set(l * 0.23, 0.78, 0);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.5, 6).translate(0, -0.25, 0), madeira(roupa));
    pivo.add(b);
    pivo.rotation.z = l * 0.25;
    pivo.userData.malha = b;
    g.add(pivo);
    return pivo;
  });
  g.userData.bracos = bracos;
  g.userData.cabeca = cabeca;
  g.userData.corpo = corpo;
  g.scale.setScalar(escala);
  return sombrear(g);
}
const tora = (comp = 1.4, raio = 0.16) => sombrear(new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, comp, 7), madeira('#a8682f')));

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
const etiqueta = (texto, fundo = '#ffd23f', cor = '#111') => { const e = etiqueta3D(texto, { fundo, cor, altura: 0.34, fonte: 44 }); cena.add(e); return e; };
function cair(obj, base, pouso, t, dur = 0.5, altura = 7) {
  obj.visible = t > pouso - dur;
  if (!obj.visible) return;
  const k = Math.min(1, (t - (pouso - dur)) / dur);
  obj.position.copy(base).add(V(0, (1 - k * k) * altura, 0));
}

// ------------------------------------------------------------ O ladrão encapuzado (olhos amarelos)
const encapuzado = new THREE.Group();
{
  const p = criarPessoa('#2a2a30', '#1a1a1e', 1.0);
  encapuzado.add(p);
  encapuzado.userData.pessoa = p;
  const capuz = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.55, 8), madeira('#2a2a30'));
  capuz.position.y = 1.12;
  const capa = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.9, 8, 1, true), new THREE.MeshStandardMaterial({ color: '#202026', roughness: 1, side: THREE.DoubleSide }));
  capa.position.y = 0.55;
  encapuzado.add(capuz, capa);
  for (const l of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
    o.position.set(l * 0.07, 1.0, 0.17);
    encapuzado.add(o);
  }
  const t1 = tora(1.5, 0.15);
  t1.rotation.x = Math.PI / 2;
  t1.position.set(0.2, 1.05, 0);
  encapuzado.add(t1);
  encapuzado.userData.tora = t1;
  encapuzado.scale.setScalar(1.45);
  cena.add(sombrear(encapuzado));
}
const toraDerrubada = tora(1.5, 0.15);
toraDerrubada.rotation.z = Math.PI / 2;
cena.add(toraDerrubada);

// ------------------------------------------------------------ Cena do crime: pegada, estaca com o fio roxo, lupa
const PILHA = cenario.pilha.position.clone();
const pegada = new THREE.Group();
{
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3b2412';
  ctx.beginPath(); ctx.ellipse(128, 170, 52, 62, 0, 0, Math.PI * 2); ctx.fill();
  for (const [dx, ang] of [[-62, -0.45], [0, 0], [62, 0.45]]) {
    ctx.save(); ctx.translate(128 + dx * 0.9, 110); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, -48, 20, 56, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -100); ctx.lineTo(0, -126); ctx.lineTo(10, -100); ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, depthWrite: false }));
  decal.position.y = 0.04;
  pegada.add(decal);
  pegada.position.set(-4.6, 0, 10.6);
  pegada.rotation.y = -0.6;
  cena.add(pegada);
}
// Restos da pilha roubada (duas lascas no chão)
const restos = new THREE.Group();
for (let k = 0; k < 3; k++) {
  const l = tora(0.5 + k * 0.15, 0.06);
  l.rotation.set(Math.PI / 2, 0, k * 1.1);
  l.position.set((k - 1) * 0.7, 0.06, (k % 2) * 0.5);
  restos.add(l);
}
restos.position.copy(PILHA);
cena.add(restos);

const ESTACA = V(-5.4, 0, 9.6);
const estaca = new THREE.Group();
{
  const poste = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), madeira('#8a5a2b'));
  poste.position.y = 0.65;
  const prego = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.7, roughness: 0.35 }));
  prego.rotation.x = Math.PI / 2;
  prego.position.set(0, 1.0, 0.13);
  const cabecaPrego = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 8), prego.material);
  cabecaPrego.rotation.x = Math.PI / 2;
  cabecaPrego.position.set(0, 1.0, 0.21);
  estaca.add(poste, prego, cabecaPrego);
  const curva = new THREE.CatmullRomCurve3([V(0, 1.0, 0.17), V(0.04, 0.93, 0.2), V(-0.02, 0.84, 0.22), V(0.05, 0.74, 0.21), V(0.02, 0.66, 0.24)]);
  const fio = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, 0.009, 6), new THREE.MeshStandardMaterial({ color: '#8e3fd6', emissive: '#5a1f99', emissiveIntensity: 0.35, roughness: 0.6 }));
  estaca.add(fio);
  estaca.userData.fio = fio;
  estaca.position.copy(ESTACA);
  cena.add(sombrear(estaca));
}
const lupa = new THREE.Group();
{
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 28), new THREE.MeshStandardMaterial({ color: '#2b2b2b', metalness: 0.5, roughness: 0.4 }));
  const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.155, 28), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide }));
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.32, 8), madeira('#5a3a1d'));
  cabo.position.set(0.15, -0.26, 0);
  cabo.rotation.z = 0.55;
  lupa.add(aro, vidro, cabo);
  cena.add(lupa);
}

// O detetive: @gabrielteixeira6191
const GAB = V(-1.3, 0, 13.5);
const gabriel = criarPessoa('#c0392b', '#f1c27d');
const chapeuDetetive = new THREE.Group();
{
  const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.16, 10), madeira('#8a6a3a'));
  const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 14), madeira('#7a5a2e'));
  aba.position.y = -0.07;
  const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.04, 10), madeira('#3a2a1a'));
  fita.position.y = -0.04;
  chapeuDetetive.add(copa, aba, fita);
  chapeuDetetive.position.y = 1.2;
  gabriel.add(sombrear(chapeuDetetive));
  const lupaMao = lupa.clone();
  lupaMao.scale.setScalar(0.9);
  lupaMao.position.set(0.05, -0.55, 0.12);
  lupaMao.rotation.y = Math.PI / 2;
  gabriel.userData.bracos[0].add(lupaMao);
}
cena.add(gabriel);
const rotuloGabriel = etiqueta('@gabrielteixeira6191 🕵️');

// O vizinho (suspeito: o fio é roxo…) e o cupim rindo atrás da tora
const vizinho = new Vizinho();
cena.add(vizinho.grupo);
const cupim = criarCupim();
cupim.scale.setScalar(2.4);
cena.add(cupim);
const toraEsconderijo = tora(1.6, 0.2);
toraEsconderijo.rotation.z = Math.PI / 2;
cena.add(toraEsconderijo);

// ------------------------------------------------------------ T-rex (@pedro_2015_22, @guisimoes7777, @vvgh_244)
const trex = criarTrex();
cena.add(trex);
const TREX0 = V(-30, 0, -6);
const TREX1 = V(-14.2, 0, 9.4);
const YAW_TREX = yawPara(TREX0, TREX1);
const YAW_TREX_PARADO = 0.05;
const rotuloTrex = etiqueta('🦖 @pedro_2015_22 · @guisimoes7777');
// Toras na boca (presas na cabeça)
const feixeToras = new THREE.Group();
for (let k = 0; k < 4; k++) {
  const tt = tora(2.2, 0.15);
  tt.rotation.x = Math.PI / 2;
  tt.position.set(1.2 + (k % 2) * 0.15, -0.2 + Math.floor(k / 2) * 0.28, 0);
  feixeToras.add(tt);
}
trex.userData.cabeca.add(feixeToras);
const torasCaindo = feixeToras.clone();
cena.add(torasCaindo);
const poeiraToras = new Explosao(cena, { n: 160, cor: '#c9a87a', tamanho: 0.22, velocidade: 5, subida: 3, dur: 1.3, semente: 61 });
const poeiraPassos = [0, 1, 2].map((k) => new Explosao(cena, { n: 90, cor: '#b9a080', tamanho: 0.2, velocidade: 3.5, subida: 2, dur: 1.0, semente: 70 + k }));
// Bracinho curto: martelo na mão e uma tábua com prego fora do alcance
const marteloTrex = new THREE.Group();
{
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), madeira('#5a3a1d'));
  cabo.rotation.z = Math.PI / 2;
  cabo.position.x = 0.2;
  const ferro = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), new THREE.MeshStandardMaterial({ color: '#6e6e6e', metalness: 0.5, roughness: 0.5 }));
  ferro.position.x = 0.45;
  marteloTrex.add(cabo, ferro);
  trex.userData.bracos[1].userData.mao.add(sombrear(marteloTrex));
}
const cavalete = new THREE.Group();
{
  const tabua = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 2.0), madeira('#c98a45'));
  tabua.position.y = 2.45;
  for (const z of [-0.8, 0.8]) {
    const pe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), madeira('#8a5a2b'));
    pe.position.set(0, 1.2, z);
    cavalete.add(pe);
  }
  const prego = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.7, roughness: 0.35 }));
  prego.position.set(0, 2.6, 0.62);
  cavalete.add(tabua, prego);
  cena.add(sombrear(cavalete));
}

// ------------------------------------------------------------ +1000 ajudantes
const [INI_MULT, DUR_MULT] = MARCOS.multidao;
const rnd = mulberry(606);
const CORES = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#16a085', '#e84393'];
const PELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const chegando = Array.from({ length: 34 }, (_, k) => {
  const b = criarPessoa(CORES[k % CORES.length], PELES[k % PELES.length], 1.2);
  b.rotation.y = (rnd() - 0.5) * 0.8;
  cena.add(b);
  const pos = V(-8 + rnd() * 23, 0, 9.5 + rnd() * 6.5);
  return { b, pos, pouso: INI_MULT + 0.4 + (k / 34) * DUR_MULT, feixe: k % 3 === 0 ? new Feixe(cena) : null };
});
// No chão: @dinheiro854, @cofrinho2026 e os que "nunca aparecem"
const DESTAQUES = [
  { destaque: true, arroba: '@dinheiro854 💰', pos: V(-0.85, 0, 19.7), pouso: MARCOS.dinheiro, cor: '#2e7d32', alt: 2.15 },
  { destaque: true, arroba: '@cofrinho2026 🐷', pos: V(0.85, 0, 19.9), pouso: MARCOS.cofrinho, cor: '#e84393', alt: 1.65 },
  ...APARECEU.map((arroba, k) => ({ arroba: `${arroba} ✅`, pos: [V(-2.3, 0, 16.6), V(-0.8, 0, 15.8), V(0.8, 0, 16.0), V(2.3, 0, 16.8)][k], pouso: MARCOS.apareceu[k], cor: CORES[(k + 2) % CORES.length], alt: k % 2 ? 2.6 : 1.8 })),
].map((d, k) => {
  const b = criarPessoa(d.cor, PELES[(k + 1) % PELES.length], 1.25);
  cena.add(b);
  return { ...d, b, rot: etiqueta(d.arroba, k < 2 ? '#ffd23f' : '#ffffff'), feixe: new Feixe(cena), onda: new Onda(cena) };
});

// ------------------------------------------------------------ Anime: o ajudante do @guilherme_lima.2310
const GUER = V(3.2, 0, 16.4);
const guerreiro = criarPessoa('#2f8f5b', '#f1c27d', 1.35);
const cabeloMat = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.6, flatShading: true, emissive: '#000000' });
{
  const cabelo = new THREE.Group();
  const pontas = [[0, 0.22, 0, 0], [0.12, 0.18, 0.05, -0.6], [-0.12, 0.18, 0.05, 0.6], [0.08, 0.16, -0.12, -0.4], [-0.08, 0.16, -0.12, 0.4], [0, 0.2, -0.1, 0.1], [0.16, 0.08, -0.04, -1.0], [-0.16, 0.08, -0.04, 1.0]];
  for (const [x, y, z, rz] of pontas) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 5), cabeloMat);
    c.position.set(x, y + 0.02, z);
    c.rotation.set(z * -3, 0, rz);
    cabelo.add(c);
  }
  cabelo.position.y = 1.0;
  guerreiro.add(cabelo);
  const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.25, 0.08, 8), madeira('#4a2f18'));
  cinto.position.y = 0.55;
  guerreiro.add(cinto);
}
cena.add(guerreiro);
const auras = [0, 1].map((k) => {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.9 + k * 0.25, 3.2 + k * 0.5, 18, 1, true), aditivo(k ? '#9fc3ff' : '#e9f2ff', 0));
  cena.add(m);
  return m;
});
const pedras = Array.from({ length: 12 }, (_, k) => {
  const r = mulberry(800 + k);
  const p = sombrear(new THREE.Mesh(new THREE.IcosahedronGeometry(0.08 + r() * 0.14, 0), madeira('#8d8478')));
  p.userData = { ang: r() * Math.PI * 2, raio: 1.3 + r() * 1.2, altura: 0.4 + r() * 2.0, atraso: r() * 0.6, giro: (r() - 0.5) * 4 };
  cena.add(p);
  return p;
});
const ondaAura = new Onda(cena, '#dbe8ff');
const rotuloGuerreiro = etiqueta('⚡ @guilherme_lima.2310');
// A corrida da turma do anime (braços para trás, tora na cabeça)
const corredores = Array.from({ length: 6 }, (_, k) => {
  const b = criarPessoa(['#e67e22', '#2e86c1', '#c0392b', '#27ae60', '#8e44ad', '#f1c40f'][k], PELES[k % PELES.length], 1.25);
  const tt = tora(1.3, 0.12);
  tt.rotation.x = Math.PI / 2;
  tt.position.y = 1.25;
  b.add(tt);
  b.userData.tora = tt;
  cena.add(b);
  return { b, dx: -k * 1.35 - (k % 2) * 0.3, z: 19.4 + (k % 2) * 1.1 };
});
const rotulosCorrida = [etiqueta('@abne_rzin99'), etiqueta('@rdg4284'), etiqueta('@_.09kaka 🖐️')];
const toraLonge = tora(1.3, 0.14);
toraLonge.rotation.x = Math.PI / 2;
cena.add(toraLonge);

// ------------------------------------------------------------ Obra: 11ª costela + tábuas 1 a 5
const novasPecas = [];
for (let i = PECAS.antes; i < PECAS.depois; i++) {
  const peca = arca.pecas[i];
  const caixaPeca = new THREE.Box3().setFromObject(peca.objeto);
  const centro = caixaPeca.getCenter(new THREE.Vector3());
  const k = i - PECAS.antes;
  novasPecas.push({
    peca, centro, ehCostela: k === 0,
    pouso: k === 0 ? MARCOS.costela[1] : MARCOS.tabuas[k - 1],
    onda: new Onda(cena, '#ffe9a8'),
    faiscas: new Explosao(cena, { n: 120, cor: '#ffd76a', tamanho: 0.2, velocidade: 7, subida: 4, dur: 1.1, semente: 400 + k }),
  });
}
const poeiraCostela = new Explosao(cena, { n: 220, cor: '#c9a87a', tamanho: 0.3, velocidade: 3, subida: 2.5, gravidade: 1, dur: 2.4, semente: 77 });

// ------------------------------------------------------------ Os insistentes
const arara = criarAnimal('arara', 1);
cena.add(arara);
const rotuloArara = etiqueta('🦜 @biel.x7_ga');
const lobo = criarAnimal('lobo', 3);
lobo.scale.setScalar(1.3);
cena.add(lobo);
const rotuloLobo = etiqueta('🐺 @alyfergabrielcamargo');
const maracuja = new THREE.Group();
{
  const fruta = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshStandardMaterial({ color: '#e7c41f', roughness: 0.55 }));
  const cabinho = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.1, 5), madeira('#5a7a2a'));
  cabinho.position.y = 0.19;
  maracuja.add(fruta, cabinho);
  cena.add(sombrear(maracuja));
}
const estrelas = etiqueta3D('💫', { fundo: 'rgba(0,0,0,0)', altura: 0.5, fonte: 60 });
cena.add(estrelas);
const maracaja = criarAnimal('maracaja', 5);
maracaja.scale.setScalar(1.2);
cena.add(maracaja);
const rotuloMaracaja = etiqueta('🐆 @maria_luiza02015');

// ------------------------------------------------------------ Final: cupim e o chinelo
const chinelo = new THREE.Group();
{
  const sola = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.26), new THREE.MeshStandardMaterial({ color: '#2f6fd6', roughness: 0.7 }));
  const tira = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 5, 10, Math.PI), new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.6 }));
  tira.position.set(0.05, 0.03, 0);
  tira.rotation.y = Math.PI / 2;
  chinelo.add(sola, tira);
  chinelo.scale.setScalar(1.3);
  cena.add(sombrear(chinelo));
}
const POS_CUPIM_FINAL = N.clone().add(V(1.5, 0, -0.2));
const toraFinal = tora(1.4, 0.2);
toraFinal.rotation.z = Math.PI / 2;
cena.add(toraFinal);
const poeiraChinelo = new Explosao(cena, { n: 70, cor: '#d8c4a0', tamanho: 0.12, velocidade: 3, subida: 2, dur: 0.8, semente: 51 });

// ------------------------------------------------------------ Pós-créditos: o dragão rosa
const dragao = criarDragao();
cena.add(dragao);
const DRAG = V(-12.2, 0, 6.6);
const YAW_DRAG = -0.75;
const chama = new THREE.Group();
const chamaMats = [aditivo('#ff7a1a', 0), aditivo('#ffd36a', 0)];
chamaMats.forEach((m, k) => {
  const c = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 14, 1, true).rotateX(-Math.PI / 2).translate(0, 0, 0.5), m);
  c.scale.setScalar(k ? 0.55 : 1);
  chama.add(c);
});
cena.add(chama);
const luzFogo = new THREE.PointLight('#ff8a2a', 0, 30, 1.5);
cena.add(luzFogo);
const brasas = new Explosao(cena, { n: 200, cor: '#ffb347', tamanho: 0.16, velocidade: 5, subida: 3, gravidade: 2, dur: 1.4, semente: 88 });
const ALVO_FOGO = V(-7.2, 0.1, 11.2);
const rotuloDragao = etiqueta('🐉 @neguim.031 · @dinheiro854');

// ------------------------------------------------------------ Câmera
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  const L = (a, b) => a.clone().lerp(b, k);
  switch (c.nome) {
    case 'roubo': return [L(V(-4.0, 0.7, 18.5), V(-4.6, 0.8, 17.4)), V(-9.2, 1.9, 10.6)];
    case 'titulo': return [L(V(20, 9, 44), V(15, 7, 36)), V(0, 3.5, 0)];
    case 'manha': return [L(V(-0.6, 3.6, 23.5), V(-0.9, 3.3, 22.0)), V(-3.6, 1.2, 10.8)];
    case 'fio': {
      if (t < MARCOS.vizinho) return [L(ESTACA.clone().add(V(0.25, 1.05, 1.5)), ESTACA.clone().add(V(0.15, 1.0, 1.15))), ESTACA.clone().add(V(0.02, 0.86, 0.2))];
      const k2 = ss(t, MARCOS.vizinho, MARCOS.vizinho + 0.6);
      return [ESTACA.clone().add(V(0.15, 1.0, 1.15)).lerp(ESTACA.clone().add(V(0.9, 2.2, 7.8)), k2), ESTACA.clone().add(V(0.02, 0.86, 0.2)).lerp(ESTACA.clone().add(V(0.5, 1.4, 0.6)), k2)];
    }
    case 'trex': {
      const cab = cabecaTrexMundo();
      if (t < MARCOS.rugido[0]) return [N.clone().add(V(1.6, 0.8, 4.4)), cab.clone().lerp(N.clone().add(V(-4, 2, -2)), 0.2)];
      if (t < MARCOS.rugido[1] + 0.2) {
        const k3 = ss(t, MARCOS.rugido[0], MARCOS.rugido[1]);
        return [TREX1.clone().add(V(9.5, 3.6, 5.5)).lerp(TREX1.clone().add(V(8.0, 4.0, 4.4)), k3), cab];
      }
      return [L(V(-5.4, 3.8, 22.2), V(-6.0, 3.6, 21.0)), V(-12.6, 5.8, 9.4)];
    }
    case 'braco': {
      const f = frenteDe(YAW_TREX_PARADO);
      const lado = V(-f.z, 0, f.x);
      const base = TREX1.clone().add(f.clone().multiplyScalar(1.9)).add(V(0, 3.0, 0));
      return [L(base.clone().add(lado.clone().multiplyScalar(5.6)).add(V(0, 0.3, 0)), base.clone().add(lado.clone().multiplyScalar(4.8)).add(V(0, 0.2, 0))), base.clone().add(f.clone().multiplyScalar(0.6)).add(V(0, 0.55, 0))];
    }
    case 'multidao':
      if (t < MARCOS.chao) return [V(10, 18, 48).lerp(V(7, 15, 42), ss(t, c.inicio, MARCOS.chao)), V(0, 1, 6)];
      return [V(0.0, 2.1, 28.0).lerp(V(0.0, 2.0, 27.0), ss(t, MARCOS.chao, c.fim)), V(0.0, 1.5, 18.0)];
    case 'anime':
      if (t < MARCOS.corrida[0]) {
        const k4 = ss(t, c.inicio, MARCOS.corrida[0]);
        return [GUER.clone().add(V(0.5, 0.55, 4.4)).lerp(GUER.clone().add(V(0.3, 0.45, 3.3)), k4), GUER.clone().add(V(0, 1.55, 0))];
      }
      {
        const x = xCorrida(t) - 1.2;
        return [V(x - 0.5, 2.2, 27.5), V(x, 2.0, 19.5)];
      }
    case 'obra': {
      const cx = novasPecas[0].centro.x;
      if (t < MARCOS.completo + 0.6) return [L(V(cx + 12, 4.5, 24), V(cx + 8, 5.0, 21)), V(cx - 2, 3.4, 0)];
      const k5 = ss(t, MARCOS.completo + 0.6, MARCOS.tabuas[0]);
      return [V(cx + 8, 5.0, 21).lerp(V(8, 13, 42), k5), V(cx - 2, 3.4, 0).lerp(V(0, 3.0, 0), k5)];
    }
    case 'insistentes': {
      const [u0, u1] = MARCOS.uivo;
      if (t >= u0 - 0.1 && t < u1 + 0.1) return [PILHA.clone().add(V(4.6, 2.0, 7.4)), PILHA.clone().add(V(0, 2.3, 0))];
      if (t > MARCOS.maracuja + 0.6) {
        const k8 = ss(t, MARCOS.maracuja + 0.6, MARCOS.maracaja);
        return [N.clone().add(V(0.4, 1.9, 4.2)).lerp(N.clone().add(V(0.7, 2.2, 7.0)), k8), N.clone().add(V(0.4, 1.55, 0)).lerp(N.clone().add(V(0.7, 1.3, 0)), k8)];
      }
      return [L(N.clone().add(V(0.5, 2.0, 5.0)), N.clone().add(V(0.4, 1.9, 4.2))), N.clone().add(V(0.4, 1.55, 0))];
    }
    case 'final': return [L(N.clone().add(V(0.9, 2.0, 5.6)), N.clone().add(V(0.8, 1.95, 4.9))), N.clone().add(V(0.6, 1.4, 0))];
    case 'poscreditos': {
      const [p0] = faixa('poscreditos');
      if (t < MARCOS.chama[0]) return [V(-3.4, 1.5, 17.5).lerp(V(-3.8, 1.6, 16.6), ss(t, p0 + 1.2, MARCOS.chama[0])), V(-8.4, 1.4, 10.0)];
      const k6 = ss(t, MARCOS.chama[0], MARCOS.dragao + 0.8);
      return [V(-3.8, 1.6, 16.6).lerp(V(-5.6, 2.6, 15.4), k6), V(-8.4, 1.4, 10.0).lerp(V(-11.2, 4.4, 7.0), k6)];
    }
  }
  return [V(0, 3, 20), V(0, 1, 0)];
}

// ------------------------------------------------------------ T-rex: posição e pose
function posicaoTrex(t) {
  const [a, , c] = MARCOS.passos;
  const k = ss(t, a - 0.4, c + 0.15);
  return TREX0.clone().lerp(TREX1, k);
}
function poseTrex(t) {
  const u = trex.userData;
  trex.position.copy(posicaoTrex(t));
  const andando = t < MARCOS.passos[2] + 0.2;
  trex.rotation.y = andando ? YAW_TREX : lerp(YAW_TREX, YAW_TREX_PARADO, ss(t, MARCOS.passos[2], MARCOS.passos[2] + 0.6));
  const passo = Math.sin((t - MARCOS.passos[0]) * Math.PI / 0.6);
  u.pernas.forEach((p, i) => { p.rotation.z = andando ? (i ? 1 : -1) * passo * 0.35 : 0; });
  trex.position.y = andando ? Math.abs(passo) * 0.12 : 0;
  // Rugido: cabeça sobe, boca escancarada
  const [r0, r1] = MARCOS.rugido;
  const ruge = ss(t, r0, r0 + 0.25) * (1 - ss(t, r1 - 0.2, r1 + 0.1));
  const solta = ss(t, MARCOS.torasCaem - 0.25, MARCOS.torasCaem) * (1 - ss(t, MARCOS.torasCaem + 0.4, MARCOS.torasCaem + 0.8));
  u.cabeca.rotation.z = 0.35 * ruge - 0.25 * solta + Math.sin(t * 1.6) * 0.03 + (ruge ? Math.sin(t * 40) * 0.02 : 0);
  u.mandibula.rotation.z = -0.75 * ruge - 0.45 * solta - (t > MARCOS.torasCaem + 0.8 ? 0.12 + 0.08 * Math.sin(t * 6) : 0);
  u.bracos.forEach((b) => { b.rotation.set(0, 0, 0); });
}
function cabecaTrexMundo() {
  trex.updateMatrixWorld(true);
  return trex.userData.cabeca.localToWorld(V(1.0, 0, 0));
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
    case 'roubo': case 'titulo': case 'fio': case 'braco': n.grupo.visible = false; break;
    case 'manha':
      pos.set(-2.7, 0, 12.4);
      if (t < 8.9) { // indignado com a pilha vazia
        const tremor = Math.sin(t * 30) * 0.05;
        yaw = -0.5;
        n.bracoDir.rotation.set(-0.4, 0, 1.6 + tremor); n.bracoEsq.rotation.set(-0.4, 0, -1.6 - tremor);
      } else { yaw = 0.7; n.bracoDir.rotation.set(-1.5, 0, 0.2); } // aponta para o Gabriel
      break;
    case 'trex': {
      yaw = -1.1;
      if (t < MARCOS.rugido[1] + 0.1) { // apavorado, mãos para cima
        const tremor = Math.sin(t * 38) * 0.06;
        n.bracoDir.rotation.set(0, 0, 2.7 + tremor); n.bracoEsq.rotation.set(0, 0, -2.7 - tremor);
        n.corpo.rotation.x = -0.1;
      } else if (t < MARCOS.torasCaem) { // "calma, gente!"
        n.bracoDir.rotation.set(-1.1, 0, 0.6 + Math.sin(t * 7) * 0.3); n.bracoEsq.rotation.set(-1.1, 0, -0.6 - Math.sin(t * 7) * 0.3);
        yaw = -0.3;
      } else { n.bracoDir.rotation.set(0, 0, 2.4 + Math.sin(t * 8) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.4 - Math.sin(t * 8) * 0.2); yaw = -0.3; }
      break;
    }
    case 'multidao': n.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 8) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.5 - Math.sin(t * 8) * 0.2); break;
    case 'anime': pos.set(-0.6, 0, 13.4); yaw = 0.9; n.bracoDir.rotation.set(-1.2, 0, 0.4); break;
    case 'obra': yaw = Math.PI * 0.85; n.bracoDir.rotation.set(0, 0, 2.5); n.bracoEsq.rotation.set(0, 0, -2.5); break;
    case 'insistentes': {
      const bonk = MARCOS.maracuja;
      if (t > bonk && t < bonk + 0.8) { n.corpo.rotation.z = Math.sin((t - bonk) * 20) * 0.08 * (1 - (t - bonk) / 0.8); n.corpo.position.y = -0.04; }
      if (t > 53.6 && t < 54.3) { n.bracoEsq.rotation.set(0, 0, -2.3); }
      if (t > 56.0 && t < 58.8) { n.bracoDir.rotation.set(-1.4, 0, 0.3 + Math.sin(t * 6) * 0.15); } // corrigindo: "maracajá!"
      yaw = 0.15;
      break;
    }
    case 'final': if (t < 62.6) n.bracoDir.rotation.set(-1.5, 0, 0); else { n.bracoDir.rotation.set(-0.3, 0, 0.9); n.bracoEsq.rotation.set(-0.3, 0, -0.9); yaw = Math.sin(t * 2.5) * 0.25; } break;
    case 'poscreditos': {
      pos.set(-6.4, 0, 11.6);
      yaw = -1.0;
      n.corpo.rotation.x = 0.25;
      n.corpo.position.y = -0.15;
      const tremor = Math.sin(t * 40) * 0.04;
      n.bracoDir.rotation.set(-1.3, 0, -0.5 + tremor); n.bracoEsq.rotation.set(-1.3, 0, 0.5 - tremor);
      break;
    }
  }
  n.grupo.position.copy(pos);
  n.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ Corrida
const xCorrida = (t) => lerp(-7, 16, clamp01((t - MARCOS.corrida[0]) / (MARCOS.corrida[1] - MARCOS.corrida[0])));

// ------------------------------------------------------------ Créditos (HTML)
$('trilho').innerHTML = NOVOS.map((a) => `<div>${a}</div>`).join('');

// ------------------------------------------------------------ HUD
let grupoComentario = -1;
const coresAvatar = ['#e1306c', '#833ab4', '#f77737', '#405de6', '#2e7d32'];
const inicial = (a) => (a[1] === '_' || a[1] === '.' ? (a[2] === '.' ? a[3] : a[2]) : a[1]).toUpperCase();
function hud(c, t) {
  legendas.atualizar(t);
  const iFala = FALAS.findIndex(([a, b]) => t >= a && t < b);
  const ehVizinho = iFala >= 0 && VOZES[iFala] === 'vizinho';
  const falante = $('falante');
  falante.style.opacity = ehVizinho ? '1' : '0';
  if (ehVizinho) { falante.firstElementChild.textContent = 'VIZINHO'; falante.firstElementChild.style.background = '#c9a7ff'; }

  $('dia').style.opacity = ['roubo', 'titulo', 'poscreditos'].includes(c.nome) ? '0' : '1';
  $('alerta').style.opacity = c.nome === 'manha' ? String(0.75 + 0.25 * Math.sin(t * 10)) : '0';
  $('titulo').style.opacity = String(c.nome === 'fio' ? ss(t, 12.2, 12.5) * (1 - ss(t, MARCOS.vizinho - 0.2, MARCOS.vizinho)) : 0);

  // Barras de cinema
  const cine = Math.max(
    1 - ss(t, 7.0, 7.5),
    ss(t, 17.8, 18.2) * (1 - ss(t, MARCOS.rugido[1], MARCOS.rugido[1] + 0.4)),
    ss(t, MARCOS.grito - 0.2, MARCOS.grito) * (1 - ss(t, MARCOS.corrida[0] - 0.4, MARCOS.corrida[0])),
    ss(t, faixa('poscreditos')[0] + 1.0, faixa('poscreditos')[0] + 1.4),
  );
  $('barraTopo').style.transform = `translateY(${-120 * (1 - cine)}px)`;
  $('barraBase').style.transform = `translateY(${120 * (1 - cine)}px)`;
  // Título de filme
  const kf = ss(t, MARCOS.titulo, MARCOS.titulo + 0.5) * (1 - ss(t, 6.8, 7.2));
  const fil = $('filme');
  fil.style.opacity = String(kf);
  fil.style.transform = `scale(${1.12 - 0.12 * ss(t, MARCOS.titulo, 7.2)})`;

  const cont = $('contador');
  if (c.nome === 'multidao') {
    const n = Math.round((SEGUIDORES.depois - SEGUIDORES.antes) * ss(t, INI_MULT + 0.3, INI_MULT + DUR_MULT + 0.4));
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = `+${n} AJUDANTES`;
  } else if (c.nome === 'obra') {
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = `${SEGUIDORES.depois} AJUDANTES`;
  } else if (c.nome === 'final') {
    cont.style.opacity = String(ss(t, c.inicio + 0.2, c.inicio + 0.5));
    cont.style.background = 'rgba(20,90,140,.92)'; cont.style.fontSize = '17px';
    cont.textContent = `PRÓXIMA PEÇA: 6ª TÁBUA · FALTAM ${SEGUIDORES.proxima - SEGUIDORES.depois} 👀`;
  } else cont.style.opacity = '0';

  const [k0, k1] = MARCOS.creditos;
  const kc = ss(t, k0, k0 + 0.3) * (1 - ss(t, k1 - 0.3, k1));
  $('creditos').style.opacity = String(kc);
  $('creditosTitulo').style.opacity = String(kc);
  const altura = $('trilho').offsetHeight;
  $('trilho').style.transform = `translateY(${lerp(600, 260 - altura, clamp01((t - k0) / (k1 - k0)))}px)`;

  // Selo "VOCÊS APARECERAM"
  const ks = MARCOS.apareceu[3] + 0.3;
  const es = clamp01((t - ks) / 0.25);
  $('selo').style.opacity = String(c.nome === 'multidao' ? Math.min(1, es * 3) * (1 - ss(t, 34.6, 34.95)) : 0);
  $('selo').firstElementChild.style.transform = `scale(${es > 0 ? lerp(1.8, 1, es) : 0}) rotate(-6deg)`;

  $('progresso').style.opacity = ['obra', 'final'].includes(c.nome) ? '1' : '0';
  const pecas = PECAS.antes + novasPecas.filter((p) => t >= p.pouso).length;
  $('barra').style.width = `${(pecas / arca.total) * 100}%`;
  $('progresso-rotulo').textContent = `ARCA ${Math.round((pecas / arca.total) * 100)}%`;
  const carimbos = [MARCOS.completo, MARCOS.tabuas[4] + 0.15];
  document.querySelectorAll('.carimbo').forEach((el, k) => {
    const e = clamp01((t - carimbos[k]) / 0.25);
    const some = Math.max(ss(t, 50.7, 51.0), k === 0 ? ss(t, carimbos[1] - 0.1, carimbos[1]) : 0);
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
        ${ct.resposta ? `<div class="resposta">${ct.resposta}</div>` : ''}
        ${ct.selo ? `<div class="selo">${ct.selo}</div>` : ''}</div>`).join('');
  }
  if (iGrupo >= 0) {
    const g = COMENTARIOS[iGrupo];
    caixa.querySelectorAll('.comentario').forEach((el, j) => {
      const e = clamp01((t - g.inicio - j * 0.18) / 0.25);
      const sai = ss(t, g.fim - 0.2, g.fim);
      const escala = (e < 1 ? 1 - Math.pow(1 - e, 3) + Math.sin(e * Math.PI) * 0.12 : 1) * (1 - sai * 0.3);
      el.style.opacity = String(Math.min(1, e * 2) * (1 - sai));
      el.style.transform = `translateY(${-sai * 30}px) scale(${escala}) rotate(${j % 2 ? 2 : -2}deg)`;
    });
  }

  // Cartão de seguir + recado
  const card = $('cartao');
  const kcard = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35) * (1 - ss(t, MARCOS.recado - 0.3, MARCOS.recado));
  card.style.transform = `translateX(-50%) scale(${kcard * (1 + Math.sin(clamp01((t - MARCOS.cartao) / 0.35) * Math.PI) * 0.08)})`;
  const toque = t > MARCOS.toque;
  const botao = card.querySelector('.botao');
  botao.textContent = toque ? 'Seguindo ✓' : 'Seguir';
  botao.style.background = toque ? '#efefef' : '#0095f6';
  botao.style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, MARCOS.toque - 0.7, MARCOS.toque - 0.5) * (1 - ss(t, MARCOS.toque + 0.7, MARCOS.toque + 1.0)));
  const kcur = ss(t, MARCOS.toque - 0.6, MARCOS.toque - 0.05);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > MARCOS.toque - 0.05 && t < MARCOS.toque + 0.15 ? 0.85 : 1})`;
  $('recado').style.opacity = String(c.nome === 'final' ? ss(t, MARCOS.recado, MARCOS.recado + 0.3) : 0);

  // Pós-créditos: tela preta com o aviso, depois a noite
  const [p0] = faixa('poscreditos');
  $('preto').style.opacity = String(ss(t, p0 - 0.15, p0) * (1 - ss(t, p0 + 0.9, p0 + 1.2)));
}

// ------------------------------------------------------------ Quadro
function renderizarEm(t) {
  const c = cenaEm(t);
  const iC = c.indice;
  const noite = ['roubo', 'titulo', 'poscreditos'].includes(c.nome);

  // Clima
  cenario.definirClima(noite ? 0.8 : 0.25);
  cenario.atualizar(t * 3);
  if (noite) { cenario.sol.intensity = 0.12; cenario.hemisferica.intensity = 0.3; }
  const raio = c.nome === 'poscreditos' ? 0 : brilhoDoRaio(t, MARCOS.raios);
  luar.intensity = noite ? 2.8 + raio * 6 : 0;
  $('noite').style.opacity = String(noite ? 0.3 - raio * 0.2 : 0);
  $('flash').style.opacity = String(raio * 0.4);
  chuva.atualizar(t, c.nome === 'roubo' || c.nome === 'titulo' ? 0.9 : 0);
  if (c.nome === 'trex' && t < MARCOS.rugido[0] + 0.4) cena.fog = new THREE.Fog(cena.background, 10, lerp(40, 160, ss(t, MARCOS.passos[1], MARCOS.rugido[0] + 0.4)));
  renderer.toneMappingExposure = 1.0;
  $('escuro').style.opacity = '0';

  poseDoNoe(c, t);
  ajudantes.atualizar(t);

  // A pilha de toras: some no roubo e volta quando o T-rex devolve
  cenario.pilha.visible = c.nome === 'roubo' || c.nome === 'titulo' || iC > indiceCena('trex') || (c.nome === 'trex' && t > MARCOS.torasCaem + 0.45);
  restos.visible = !cenario.pilha.visible;
  pegada.visible = ['manha', 'fio', 'trex'].includes(c.nome);
  estaca.visible = c.nome === 'manha' || c.nome === 'fio';
  estaca.userData.fio.rotation.z = Math.sin(t * 2.2) * 0.04;

  // Roubo: o encapuzado arrasta a tora na chuva e olha para trás no relâmpago
  const roubando = c.nome === 'roubo';
  const posCreditos = c.nome === 'poscreditos';
  encapuzado.visible = roubando || posCreditos;
  toraDerrubada.visible = false;
  if (roubando) {
    const k = clamp01(t / 4);
    encapuzado.position.copy(PILHA.clone().add(V(0.6, 0, 2.2)).lerp(PILHA.clone().add(V(-4.2, 0, 3.6)), k));
    const olhaTras = ss(t, 2.7, 3.0);
    encapuzado.rotation.y = lerp(-Math.PI / 2 - 0.2, 0.5, olhaTras);
    encapuzado.position.y = Math.abs(Math.sin(t * 7)) * 0.05 * (1 - olhaTras);
    encapuzado.userData.tora.visible = true;
    const p = encapuzado.userData.pessoa.userData;
    p.bracos.forEach((b) => b.rotation.set(-2.6, 0, 0));
  } else if (posCreditos) {
    const [p0] = faixa('poscreditos');
    const foge = ss(t, MARCOS.chama[0] + 0.35, MARCOS.chama[0] + 1.6);
    const chegou = ss(t, p0 + 1.2, MARCOS.sombraAsas);
    encapuzado.position.copy(V(-11.6, 0, 13.4).lerp(V(-8.0, 0, 11.4), chegou).lerp(V(-17, 0, 16), foge));
    encapuzado.rotation.y = foge > 0 ? -2.2 : 0.9 + (t > MARCOS.sombraAsas ? Math.sin(t * 9) * 0.3 : 0);
    encapuzado.position.y = Math.abs(Math.sin(t * (foge > 0 ? 16 : 7))) * 0.06;
    encapuzado.userData.tora.visible = false;
    const p = encapuzado.userData.pessoa.userData;
    p.bracos.forEach((b, i) => b.rotation.set(foge > 0 ? -2.8 : -0.6, 0, (i ? 1 : -1) * (t > MARCOS.sombraAsas ? 0.9 : 0.25)));
    // a tora que ele larga ao fugir
    toraDerrubada.visible = t > MARCOS.chama[0] + 0.4;
    toraDerrubada.position.set(-8.2, 0.15, 11.6);
  }

  // Manhã: Gabriel, o detetive
  gabriel.visible = c.nome === 'manha';
  gabriel.position.copy(GAB);
  gabriel.rotation.y = t < 9.6 ? -0.4 : -0.9;
  const kChapeu = ss(t, 9.7, 10.0);
  chapeuDetetive.scale.setScalar(Math.max(0.001, kChapeu * (1 + Math.sin(kChapeu * Math.PI) * 0.3)));
  gabriel.userData.bracos[0].rotation.set(t > 9.7 ? -1.3 : 0, 0, -0.25);
  gabriel.userData.bracos[1].rotation.set(0, 0, t > 9.7 ? 2.4 + Math.sin(t * 8) * 0.2 : 0.25);
  rotulo(rotuloGabriel, c.nome === 'manha' ? ss(t, 9.0, 9.3) : 0, GAB.clone().add(V(-0.9, 2.25, 0)));

  // Fio roxo: a lupa desliza até ele
  const [l0, l1] = MARCOS.lupa;
  lupa.visible = c.nome === 'fio' && t < MARCOS.vizinho + 0.4;
  const kl = ss(t, l0, l1);
  lupa.position.copy(ESTACA.clone().add(V(-0.55, 1.15, 0.65)).lerp(ESTACA.clone().add(V(0.02, 0.86, 0.5)), kl));
  lupa.lookAt(camera.position);
  lupa.scale.setScalar(1 + Math.sin(t * 3) * 0.02);

  // Vizinho disfarçando e o cupim rindo
  const v = vizinho;
  v.neutro();
  v.grupo.visible = c.nome === 'fio' && t > MARCOS.vizinho - 0.1;
  if (v.grupo.visible) {
    const entra = ss(t, MARCOS.vizinho, MARCOS.vizinho + 0.7);
    v.grupo.position.copy(ESTACA.clone().add(V(4.2, 0, 1.4)).lerp(ESTACA.clone().add(V(1.6, 0, 1.1)), entra));
    v.grupo.rotation.y = entra < 1 ? -1.2 : -0.35;
    if (entra < 1) v.andar(t);
    v.bracoDir.rotation.set(0.6, 0, -0.2); v.bracoEsq.rotation.set(0.6, 0, 0.2);
    v.cabeca.rotation.set(-0.25, 0, Math.sin(t * 3) * 0.12);
    if (t > 15.4 && t < 17.0) { v.bracoDir.rotation.set(-0.3, 0, 1.2); v.cabeca.rotation.set(0, 0.3, 0); } // "roxo é comum, né?"
  }
  const [cr0, cr1] = MARCOS.cupimRi;
  cupim.visible = c.nome === 'fio' || c.nome === 'final';
  toraEsconderijo.visible = c.nome === 'fio';
  toraFinal.visible = c.nome === 'final';
  if (c.nome === 'fio') {
    cupim.scale.setScalar(2.4);
    const espia = ss(t, cr0, cr0 + 0.3) * (1 - ss(t, cr1 - 0.2, cr1));
    const base = ESTACA.clone().add(V(-1.0, 0, 0.9));
    toraEsconderijo.position.copy(base).add(V(0, 0.2, 0.25));
    cupim.position.copy(base).add(V(0, 0.1 + espia * 0.55 + Math.abs(Math.sin(t * 22)) * 0.04 * espia, 0));
    cupim.rotation.set(0, 0.5, Math.sin(t * 18) * 0.1 * espia);
    cupim.userData.mandibula.position.y = -0.07 - Math.abs(Math.sin(t * 20)) * 0.03;
  }
  cupim.userData.antenas.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (0.5 + Math.sin(t * 9) * 0.25); });

  // T-rex
  const trexVisivel = ['trex', 'braco', 'obra'].includes(c.nome);
  trex.visible = trexVisivel;
  poseTrex(t);
  if (c.nome === 'obra') { trex.position.set(-27, 0, 7); trex.rotation.y = -0.35; }
  feixeToras.visible = c.nome === 'trex' && t < MARCOS.torasCaem;
  const kCai = clamp01((t - MARCOS.torasCaem) / 0.45);
  torasCaindo.visible = c.nome === 'trex' && t >= MARCOS.torasCaem && t < MARCOS.torasCaem + 0.45;
  if (torasCaindo.visible) {
    const boca = cabecaTrexMundo();
    torasCaindo.position.copy(boca.clone().lerp(PILHA.clone().add(V(0, 0.4, 0)), kCai)).add(V(0, -kCai * kCai * 0.5, 0));
    torasCaindo.rotation.set(0, trex.rotation.y, kCai * 1.2);
  }
  poeiraToras.atualizar(c.nome === 'trex' ? t : -99, PILHA.clone().add(V(0, 0.3, 0)), MARCOS.torasCaem + 0.45);
  MARCOS.passos.forEach((h, k) => {
    const pe = posicaoTrex(h).add(V(0.6, 0.2, (k % 2 ? 1 : -1) * 0.75));
    poeiraPassos[k].atualizar(c.nome === 'trex' ? t : -99, pe, h);
  });
  rotulo(rotuloTrex, c.nome === 'trex' && t > MARCOS.torasCaem + 0.3 ? ss(t, MARCOS.torasCaem + 0.3, MARCOS.torasCaem + 0.6) : 0, TREX1.clone().add(V(0.5, 6.4, 0)));
  // Bracinho: tenta martelar o prego e não alcança
  marteloTrex.visible = c.nome === 'braco';
  cavalete.visible = c.nome === 'braco';
  if (c.nome === 'braco') {
    const f = frenteDe(YAW_TREX_PARADO);
    cavalete.position.copy(TREX1.clone().add(f.clone().multiplyScalar(3.05)));
    cavalete.position.y = 0.55;
    cavalete.rotation.y = YAW_TREX_PARADO;
    const batida = Math.max(0, ...MARCOS.marteladas.map((h) => (t > h - 0.25 && t < h + 0.2 ? Math.sin(clamp01((t - h + 0.25) / 0.45) * Math.PI) : 0)));
    trex.userData.bracos.forEach((b, i) => { b.rotation.z = (i ? 0.9 : 0.6) * batida - 0.2; });
    trex.rotation.z = -0.08 * batida; // inclina o corpo, mas o braço não chega
    trex.userData.cabeca.rotation.z = -0.3 - 0.1 * batida;
    trex.userData.mandibula.rotation.z = -0.15;
  } else trex.rotation.z = 0;

  // +1000 ajudantes chegando
  for (const a of chegando) {
    cair(a.b, a.pos, a.pouso, t);
    a.b.visible = a.b.visible && c.nome === 'multidao' && t < MARCOS.chao;
    if (a.feixe) a.feixe.atualizar(c.nome === 'multidao' ? t : -99, a.pos.x, a.pos.z, a.pouso);
    a.b.userData.bracos.forEach((b, i) => b.rotation.set(0, 0, (i ? 1 : -1) * (2.4 + Math.sin(t * 8 + a.pos.x) * 0.3)));
  }
  for (const d of DESTAQUES) {
    cair(d.b, d.pos, d.pouso, t);
    d.b.visible = d.b.visible && c.nome === 'multidao';
    d.feixe.atualizar(c.nome === 'multidao' ? t : -99, d.pos.x, d.pos.z, d.pouso);
    d.onda.atualizar(c.nome === 'multidao' ? t : -99, d.pos.x, d.pos.z, d.pouso, 2.5);
    d.b.userData.bracos.forEach((b, i) => b.rotation.set(0, 0, (i ? 1 : -1) * (t > d.pouso ? 2.5 + Math.sin(t * 9 + d.pos.x) * 0.25 : 0.25)));
    rotulo(d.rot, c.nome === 'multidao' && t > MARCOS.chao && d.destaque ? ss(t, d.pouso + 0.05, d.pouso + 0.25) : 0, d.pos.clone().add(V(0, d.alt + 0.3, 0)));
  }

  // Anime: transformação
  const [a0] = faixa('anime');
  const naTransformacao = c.nome === 'anime' && t < MARCOS.corrida[0];
  guerreiro.visible = naTransformacao;
  const aura = ss(t, MARCOS.aura - 0.1, MARCOS.aura + 0.15);
  const carrega = ss(t, MARCOS.grito, MARCOS.aura);
  guerreiro.position.copy(GUER).add(V(0, -0.08 * carrega * (1 - aura) + aura * (0.15 + Math.sin(t * 3) * 0.05), 0));
  guerreiro.rotation.y = 0.15;
  const gb = guerreiro.userData.bracos;
  if (t < MARCOS.grito) { gb[0].rotation.set(0, 0, -0.25); gb[1].rotation.set(0, 0, 0.25); }
  else { const tre = Math.sin(t * 45) * 0.04 * (1 - aura * 0.5); gb[0].rotation.set(-0.5 + tre, 0, -0.55); gb[1].rotation.set(-0.5 - tre, 0, 0.55); }
  guerreiro.userData.corpo.scale.set(1 + aura * 0.08, 1, 1 + aura * 0.08);
  cabeloMat.color.set('#141414').lerp(new THREE.Color('#eef3ff'), aura);
  cabeloMat.emissive.set('#000000').lerp(new THREE.Color('#9fb8ff'), aura * 0.6);
  auras.forEach((m, k) => {
    m.visible = naTransformacao && aura > 0.01;
    m.position.copy(GUER).add(V(0, 1.35 + k * 0.1, 0));
    const pulso = 1 + Math.sin(t * (22 + k * 9)) * 0.06;
    m.scale.set(pulso, 1 + Math.sin(t * 17 + k) * 0.05, pulso);
    m.material.opacity = (k ? 0.18 : 0.32) * aura * (0.8 + 0.2 * Math.sin(t * 30 + k));
    m.rotation.y = t * (k ? -2 : 3);
  });
  pedras.forEach((p) => {
    const u = p.userData;
    p.visible = naTransformacao && t > MARCOS.grito;
    const sobe = ss(t, MARCOS.grito + u.atraso, MARCOS.aura + 0.8 + u.atraso);
    const ang = u.ang + (t - a0) * 0.6;
    p.position.copy(GUER).add(V(Math.cos(ang) * u.raio, 0.08 + sobe * u.altura + Math.sin(t * 2 + u.ang) * 0.06 * sobe, Math.sin(ang) * u.raio));
    p.rotation.set(t * u.giro, t * u.giro * 0.7, 0);
  });
  ondaAura.atualizar(c.nome === 'anime' ? t : -99, GUER.x, GUER.z, MARCOS.aura, 6, 0.8);
  $('aura').style.opacity = String(naTransformacao ? aura * (0.55 + 0.25 * Math.sin(t * 25)) : 0);
  rotulo(rotuloGuerreiro, naTransformacao ? ss(t, MARCOS.aura + 0.3, MARCOS.aura + 0.6) : 0, GUER.clone().add(V(0, 2.5, 0)));
  // Corrida
  const correndo = c.nome === 'anime' && t >= MARCOS.corrida[0];
  $('velocidade').style.opacity = String(correndo ? 0.5 : 0);
  $('velocidade').style.backgroundPosition = `${-t * 2200}px 0`;
  const xl = xCorrida(t);
  const [b0, b1] = MARCOS.borracha;
  corredores.forEach((r, k) => {
    r.b.visible = correndo;
    r.b.position.set(xl + r.dx, Math.abs(Math.sin(t * 16 + k)) * 0.12, r.z);
    r.b.rotation.set(0, Math.PI / 2, -0.22);
    const [be, bd] = r.b.userData.bracos;
    if (k === 3) { // o braço de borracha estica até a tora lá na frente e volta com ela
      const estica = Math.sin(clamp01((t - b0) / (b1 - b0)) * Math.PI);
      bd.rotation.set(-Math.PI / 2, 0, 0);
      bd.userData.malha.scale.y = 1 + estica * 10;
      be.rotation.set(1.5, 0, -0.1);
      r.b.userData.tora.visible = t > (b0 + b1) / 2;
    } else {
      be.rotation.set(1.5, 0, -0.1); bd.rotation.set(1.5, 0, 0.1);
    }
  });
  const runner3 = corredores[3];
  toraLonge.visible = correndo && t < (b0 + b1) / 2;
  toraLonge.position.set(xCorrida(b0) + runner3.dx + 5.5, 0.15, runner3.z);
  if (correndo && t > b0 && t < (b0 + b1) / 2) { // tora presa na mão esticada
    const k7 = ss(t, (b0 + b1) / 2 - 0.25, (b0 + b1) / 2);
    toraLonge.position.lerp(runner3.b.position.clone().add(V(0.3, 1.4, 0)), k7);
  }
  [0, 2, 3].forEach((ir, j) => {
    const r = corredores[ir];
    rotulo(rotulosCorrida[j], correndo ? ss(t, MARCOS.corrida[0] + 0.3 + j * 0.25, MARCOS.corrida[0] + 0.5 + j * 0.25) : 0, r.b.position.clone().add(V(0, 2.3 + j * 0.05, 0)));
  });

  // Obra: a 11ª costela sobe e as tábuas encaixam
  arca.atualizar(t);
  const iObra = indiceCena('obra');
  for (const p of novasPecas) {
    const o = p.peca.objeto;
    o.position.copy(p.peca.posicaoFinal);
    if (p.ehCostela) {
      const [s0, s1] = MARCOS.costela;
      o.visible = iC > iObra || (iC === iObra && t > s0);
      const k = ss(t, s0, s1);
      o.position.y -= (1 - k) * 9.5;
      poeiraCostela.atualizar(c.nome === 'obra' ? t : -99, V(p.centro.x, 0.3, 0), s0);
    } else {
      o.visible = iC > iObra || (iC === iObra && t > p.pouso - 0.4);
      const k = clamp01((t - (p.pouso - 0.4)) / 0.4);
      const lado = Math.sign(p.centro.z) || 1;
      o.position.add(V(0, (1 - k * k) * 3, lado * (1 - k) * 4));
    }
    p.onda.atualizar(t, p.centro.x, p.centro.z * 0.3, p.pouso, 9, 0.9);
    p.faiscas.atualizar(t, V(p.centro.x, p.ehCostela ? 6 : 1.5, p.centro.z), p.pouso);
  }
  $('ouro').style.opacity = String(Math.max(0, ...novasPecas.map((p) => 1 - Math.abs(t - p.pouso) / 0.3)) * 0.55);

  // Insistentes: arara no ombro, lobo uivando, maracujá na cabeça e a maracajá
  const [ins0] = faixa('insistentes');
  const ombro = N.clone().add(V(0.62, 2.05, 0.05));
  arara.visible = iC >= indiceCena('insistentes') && iC <= indiceCena('final');
  const kv = ss(t, ins0 + 0.6, MARCOS.arara);
  const deOnde = V(9, 7, 16);
  arara.position.copy(deOnde.clone().lerp(ombro, kv)).add(V(0, Math.sin(kv * Math.PI) * 1.2, 0));
  arara.rotation.y = kv < 1 ? yawPara(deOnde, ombro) : -Math.PI / 2 + 0.5;
  baterAsas(arara, kv < 1 ? 1 : (t < MARCOS.arara + 0.35 ? 0.4 : 0), t * 14);
  rotulo(rotuloArara, c.nome === 'insistentes' && t < MARCOS.uivo[0] ? ss(t, MARCOS.arara, MARCOS.arara + 0.25) : 0, ombro.clone().add(V(0.3, 0.75, 0)));

  const [u0, u1] = MARCOS.uivo;
  lobo.visible = c.nome === 'insistentes' && t > u0 - 0.2 && t < u1 + 0.2;
  lobo.position.copy(PILHA).add(V(0.2, 1.05, 0.3));
  const uiva = ss(t, u0 + 0.1, u0 + 0.35);
  lobo.rotation.set(0, 0.6, 0.55 * uiva);
  rotulo(rotuloLobo, lobo.visible ? ss(t, u0, u0 + 0.2) : 0, PILHA.clone().add(V(0.2, 3.5, 0.3)));

  const bonk = MARCOS.maracuja;
  maracuja.visible = c.nome === 'insistentes' && t > bonk - 0.5 && t < bonk + 1.2;
  const cabecaNoe = N.clone().add(V(0, 2.42, 0));
  if (t < bonk) maracuja.position.copy(cabecaNoe).add(V(0, (bonk - t) * 12, 0));
  else { const d = t - bonk; maracuja.position.copy(cabecaNoe).add(V(d * 1.6, 0.5 * Math.sin(Math.min(1, d / 0.5) * Math.PI) * 1.2 - Math.max(0, d - 0.5) * 4, d * 0.6)); }
  maracuja.rotation.set(t * 5, t * 3, 0);
  estrelas.visible = c.nome === 'insistentes' && t > bonk && t < bonk + 1.4;
  if (estrelas.visible) { estrelas.position.copy(cabecaNoe).add(V(Math.cos(t * 8) * 0.3, 0.15, Math.sin(t * 8) * 0.3)); estrelas.scale.set(0.5, 0.5, 1); }
  maracaja.visible = c.nome === 'insistentes' && t > MARCOS.maracaja - 1.0;
  const kmc = ss(t, MARCOS.maracaja - 1.0, MARCOS.maracaja);
  maracaja.position.copy(N.clone().add(V(5.0, 0, 1.0)).lerp(N.clone().add(V(1.6, 0, 0.9)), kmc));
  maracaja.rotation.y = kmc < 1 ? Math.PI : -2.4;
  maracaja.userData.pernas.forEach((p, i) => { p.rotation.z = kmc < 1 ? (i % 2 ? 1 : -1) * Math.sin(t * 16) * 0.5 : 0; });
  rotulo(rotuloMaracaja, c.nome === 'insistentes' ? ss(t, MARCOS.maracaja - 0.2, MARCOS.maracaja + 0.1) : 0, maracaja.position.clone().add(V(-1.0, 1.35, 0)));

  // Final: o cupim espia e o chinelo voa
  if (c.nome === 'final') {
    toraFinal.position.copy(POS_CUPIM_FINAL).add(V(0, 0.2, 0.3));
    const [ch0, ch1] = MARCOS.chinelo;
    const abaixa = ss(t, ch1 - 0.15, ch1) * (1 - ss(t, ch1 + 0.8, ch1 + 1.2));
    cupim.scale.setScalar(1.8);
    cupim.position.copy(POS_CUPIM_FINAL).add(V(0, 0.5 - abaixa * 0.45, 0));
    cupim.rotation.set(0, -0.3, t > ch1 + 1.2 ? Math.sin(t * 10) * 0.2 : 0);
    const kch = clamp01((t - ch0) / (ch1 - ch0));
    chinelo.visible = t > ch0;
    const ini = N.clone().add(V(-3.5, 2.6, 2.5));
    const fim = POS_CUPIM_FINAL.clone().add(V(-0.35, 0.05, 0.75));
    chinelo.position.copy(ini.lerp(fim, kch)).add(V(0, Math.sin(kch * Math.PI) * 1.0, 0));
    chinelo.rotation.set(kch < 1 ? t * 14 : 0, kch < 1 ? t * 9 : 0.4, 0);
    poeiraChinelo.atualizar(t, fim.clone().add(V(0, 0.1, 0)), ch1);
  } else chinelo.visible = false;

  // Pós-créditos: o segurança da arca
  const [pc0] = faixa('poscreditos');
  dragao.visible = posCreditos && t > MARCOS.sombraAsas - 0.4;
  const desce = ss(t, MARCOS.sombraAsas - 0.4, MARCOS.dragao);
  dragao.position.copy(DRAG.clone().add(V(-6, 14, -8)).lerp(DRAG, desce));
  dragao.position.y += t < MARCOS.dragao ? 1.2 * Math.sin(desce * Math.PI) : 0;
  dragao.rotation.y = YAW_DRAG;
  dragao.rotation.z = t < MARCOS.chama[1] ? -0.25 : 0;
  baterAsas(dragao, t < MARCOS.dragao + 0.6 ? 1 : 0.15, t * 9);
  dragao.userData.cabeca.rotation.z = t > MARCOS.chama[0] && t < MARCOS.chama[1] ? -0.45 : Math.sin(t * 2) * 0.05;
  const [f0, f1] = MARCOS.chama;
  const fogo = posCreditos ? ss(t, f0, f0 + 0.15) * (1 - ss(t, f1 - 0.2, f1)) : 0;
  chama.visible = fogo > 0.01;
  if (chama.visible) {
    dragao.updateMatrixWorld(true);
    const boca = dragao.userData.cabeca.localToWorld(V(1.35, -0.1, 0));
    chama.position.copy(boca);
    chama.lookAt(ALVO_FOGO);
    const comp = boca.distanceTo(ALVO_FOGO) * (0.6 + 0.4 * fogo);
    const larg = 0.9 + Math.sin(t * 40) * 0.12;
    chama.scale.set(larg, larg, comp);
    chamaMats[0].opacity = 0.6 * fogo; chamaMats[1].opacity = 0.75 * fogo;
    luzFogo.position.copy(boca.clone().lerp(ALVO_FOGO, 0.6));
  }
  luzFogo.intensity = posCreditos ? fogo * (60 + Math.sin(t * 50) * 15) + ss(t, f1, f1 + 0.3) * (26 + Math.sin(t * 13) * 4) : 0;
  if (posCreditos && t > f1) luzFogo.position.copy(ALVO_FOGO).add(V(-1.5, 2.2, -1.0));
  brasas.atualizar(posCreditos ? t : -99, ALVO_FOGO.clone().add(V(0, 0.3, 0)), f0 + 0.3);
  $('escuro').style.opacity = String(posCreditos ? 0.55 * Math.exp(-Math.pow((t - MARCOS.sombraAsas) / 0.25, 2)) : 0); // a sombra das asas passa
  rotulo(rotuloDragao, posCreditos ? ss(t, MARCOS.dragao + 0.3, MARCOS.dragao + 0.6) : 0, DRAG.clone().add(V(0.6, 6.2, 0.4)));

  // Câmera (com tremores)
  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  let tremor = novasPecas.reduce((s, p) => s + impacto(p.pouso, p.ehCostela ? 0.45 : 0.18, 6), 0);
  if (c.nome === 'trex') tremor += MARCOS.passos.reduce((s, h) => s + impacto(h, 0.35, 6), 0) + (t > MARCOS.rugido[0] && t < MARCOS.rugido[1] ? 0.06 : 0) + impacto(MARCOS.torasCaem + 0.45, 0.25, 6);
  if (c.nome === 'anime' && t < MARCOS.corrida[0]) tremor += (t > MARCOS.grito ? 0.02 : 0) + impacto(MARCOS.aura, 0.3, 4) + aura * 0.015;
  if (c.nome === 'insistentes') tremor += impacto(bonk, 0.08, 8);
  if (posCreditos) tremor += impacto(MARCOS.dragao, 0.3, 5) + fogo * 0.03;
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
