// Avulso "POV: você tá construindo um barco a 500 km do mar". Tudo é função do tempo t.
// Tempos em js/avulso-pov-tempos.js · Roteiro em docs/roteiro-avulso-pov.md
import * as THREE from 'three';
import { Arca } from './arca.js';
import { Noe, Vizinho, criarAnimal, baterAsas, TIPOS_DE_ANIMAIS } from './personagens.js';
import { Cenario } from './cenario.js';
import { Chuva, etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V, mulberry } from './efeitos.js';
import { DURACAO, FALAS, VOZES, CENAS, RAIOS, MARCOS, MARTELADAS, MARTELADAS_VIZINHO, PEDIDOS } from './avulso-pov-tempos.js';
import { AJUDANTES_COMENTARIO } from './video03-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/avulso-pov-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }

const $ = (id) => document.getElementById(id);
const cenaEm = (t) => {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
};

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
arca.configurar(4, 4); // estado atual da obra: suportes, quilha, fundo e 1ª costela
cena.add(arca.grupo);
const chuva = new Chuva(cena);
const legendas = new Legendas($('legenda'), FALAS, PALAVRAS);

// Noé na bancada, de frente para a câmera
const N = V(2, 0, 10);
const noe = new Noe();
noe.cajado.visible = false;
cena.add(noe.grupo);
const CABECA_NOE = N.clone().add(V(0, 2.1, 0));

const madeira = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, flatShading: true });
const bancada = new THREE.Group();
const tampo = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.75), madeira('#8a5a2b'));
tampo.position.y = 0.9;
bancada.add(tampo);
for (const x of [-1, 1]) for (const z of [-0.28, 0.28]) {
  const perna = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), madeira('#6b4423'));
  perna.position.set(x, 0.45, z);
  bancada.add(perna);
}
const tabua = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.4), madeira('#c98a45'));
tabua.position.y = 1.02;
bancada.add(tabua);
const serragem = new THREE.Mesh(new THREE.CircleGeometry(1.4, 10).rotateX(-Math.PI / 2), madeira('#e3c08a'));
serragem.position.y = 0.03;
bancada.add(serragem);
bancada.position.set(N.x + 0.35, 0, N.z + 0.95);
bancada.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
cena.add(bancada);
const lascas = new Explosao(cena, { n: 14, cor: '#e7c08a', tamanho: 0.09, velocidade: 1.4, subida: 2.2, gravidade: 9, dur: 0.4, semente: 5 });

// Vizinho
const vizinho = new Vizinho();
cena.add(vizinho.grupo);
const PV = V(N.x + 2.5, 0, N.z + 0.35); // onde ele para, do lado do Noé
const CABECA_VIZ = PV.clone().add(V(0, 1.95, 0));
const PV_FINAL = V(N.x + 1.75, 0, N.z + 0.25); // martelando do lado do Noé, no final

// A única nuvenzinha do céu
const nuvenzinha = new THREE.Group();
{
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true });
  [[-0.32, 0, 0, 0.26], [0, 0.1, 0, 0.34], [0.33, 0, 0.02, 0.25], [0.1, -0.06, 0.16, 0.22]].forEach(([x, y, z, r]) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m);
    b.position.set(x, y, z);
    nuvenzinha.add(b);
  });
  nuvenzinha.position.copy(PV).add(V(0, 3.15, 0));
  nuvenzinha.visible = false;
  cena.add(nuvenzinha);
}

// Feixe dourado + rótulo quando o vizinho vira ajudante
const feixe = new Feixe(cena);
const onda = new Onda(cena);
const brilhos = new Explosao(cena, { n: 120, cor: '#ffd76a', tamanho: 0.16, velocidade: 5, subida: 4, dur: 1.1, semente: 21 });
const rotuloAjudante = etiqueta3D('+1 AJUDANTE 🔨', { fundo: '#2e7d32', cor: '#fff', altura: 0.42, fonte: 46 });
cena.add(rotuloAjudante);

// ------------------------------------------------------------ Animais que os seguidores já trouxeram
const YAW_CAMERA = -Math.PI / 2; // animais olham para +x; isso vira para +z (câmera)
function bicho(tipo, chave, pos, yaw, altura = 1.4) {
  const a = criarAnimal(tipo, 7);
  a.position.copy(pos);
  a.rotation.y = yaw;
  cena.add(a);
  const p = PEDIDOS[chave];
  const rot = etiqueta3D(`${p.arroba} ${p.emoji}`, { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
  rot.visible = false;
  cena.add(rot);
  return { a, rot, base: pos.clone(), yaw, altura };
}
const cachorro = bicho('cachorro', 'cachorro', V(2.4, 0, 12.7), 0, 1.25); // de olho no vizinho
const urubu = bicho('urubu', 'urubu', V(3.5, 0.97, 10.75), 0, 1.25);      // pousado na bancada
const leao1 = bicho('leao', 'leao1', V(6.3, 0, 7.6), -1.75, 2.0);
const leao2 = bicho('leao', 'leao2', V(7.6, 0, 6.8), -1.85, 2.0);
const elefante = bicho('elefante', 'elefante', V(-5, 0, 5.5), YAW_CAMERA + 0.5, 3.3);
const presentes = [cachorro, urubu, leao1, leao2, elefante];
function mostrarRotulo(b, t, [r0, r1], escala = 1) {
  const k = ss(t, r0, r0 + 0.2) * (1 - ss(t, r1 - 0.2, r1));
  b.rot.visible = k > 0.01;
  b.rot.position.copy(b.a.position).add(V(0, b.altura, 0));
  b.rot.userData.k = k * escala; // o tamanho na tela é acertado depois da câmera (ajustarRotulos)
}
// Rótulos dos bichos com o mesmo tamanho na tela, perto ou longe da câmera
function ajustarRotulos() {
  for (const b of presentes) {
    if (!b.rot.visible) continue;
    const f = (b.rot.userData.k * 0.04 * camera.position.distanceTo(b.rot.position)) / b.rot.userData.escala[1];
    b.rot.scale.set(b.rot.userData.escala[0] * f, b.rot.userData.escala[1] * f, 1);
  }
}

// ------------------------------------------------------------ A visão: gente e bicho a caminho
// Uma fila de ajudantes e outra de casais de animais vindo de longe até a obra.
const VEL_FILA = 1.3; // m/s
const procissao = new THREE.Group();
procissao.visible = false;
cena.add(procissao);
const CORES_ROUPA = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#e84393'];
const CORES_PELE = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const N_GENTE = 125;
const gente = [];
const corposGente = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 0.85, 7), new THREE.MeshStandardMaterial({ color: '#fff', flatShading: true }), N_GENTE);
const cabecasGente = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.19, 0), new THREE.MeshStandardMaterial({ color: '#fff', flatShading: true }), N_GENTE);
{
  const rnd = mulberry(77);
  for (let i = 0; i < N_GENTE; i++) {
    const fileira = Math.floor(i / 4), col = i % 4;
    gente.push({ x: 7 + col * 0.95 + (rnd() - 0.5) * 0.3, z: 21 + fileira * 1.15 + (rnd() - 0.5) * 0.4, fase: rnd() * 6 });
    corposGente.setColorAt(i, new THREE.Color(CORES_ROUPA[Math.floor(rnd() * CORES_ROUPA.length)]));
    cabecasGente.setColorAt(i, new THREE.Color(CORES_PELE[Math.floor(rnd() * CORES_PELE.length)]));
  }
  for (const m of [corposGente, cabecasGente]) { m.castShadow = true; m.frustumCulled = false; procissao.add(m); }
}
const rotulosGente = AJUDANTES_COMENTARIO.slice(0, 4).map((arroba, k) => {
  const r = etiqueta3D(`${arroba} 🔨`, { fundo: '#ffffff', altura: 0.75, fonte: 44 });
  procissao.add(r);
  return { r, i: [2, 17, 41, 70][k] };
});
// Casais de animais: primeiro os que os seguidores pediram, depois o resto
const FILA_ANIMAIS = ['elefante', 'jacare', 'onca', 'pantera', 'girafa', 'zebra', 'camelo', 'cavalo', 'urso', 'vaca', 'ovelha', 'porco', 'coelho', 'galinha', 'pinguim', 'gato'];
const casais = [];
{
  let z = 20;
  FILA_ANIMAIS.forEach((tipo, k) => {
    const comp = TIPOS_DE_ANIMAIS[tipo].corpo[0];
    z += comp * 0.6 + 1.2;
    for (const lado of [-1, 1]) {
      const a = criarAnimal(tipo, k * 31 + lado);
      a.rotation.y = Math.PI / 2; // andando para -z (em direção à obra)
      procissao.add(a);
      casais.push({ a, x: 13.2 + lado * (0.55 + (TIPOS_DE_ANIMAIS[tipo].corpo[2] || 0.5) * 0.6), z, fase: k + lado });
    }
    z += comp * 0.6;
  });
}
const rotulosAnimais = ['elefante', 'jacare', 'onca', 'pantera'].map((tipo) => {
  const p = PEDIDOS[tipo];
  const r = etiqueta3D(`${p.arroba} ${p.emoji}`, { fundo: '#ffd23f', altura: 0.8, fonte: 44 });
  procissao.add(r);
  return { r, c: casais[FILA_ANIMAIS.indexOf(tipo) * 2 + 1], altura: tipo === 'elefante' ? 3.4 : 1.9 };
});
// Aves voando por cima da fila (as quatro que os seguidores pediram)
const aves = ['aguia', 'gaviao', 'urubu', 'picapau'].map((tipo, k) => {
  const a = criarAnimal(tipo, k);
  a.scale.setScalar(1.6);
  procissao.add(a);
  const p = PEDIDOS[tipo];
  const r = etiqueta3D(`${p.arroba} ${p.emoji}`, { fundo: '#ffd23f', altura: 0.7, fonte: 44 });
  procissao.add(r);
  return { a, r, x: 9 + k * 1.9, y: 6.5 + (k % 2) * 1.4, z: 30 + k * 3.5, fase: k * 1.7 };
});
const auxGente = new THREE.Object3D();
function atualizarProcissao(t) {
  const andou = (t - 25) * VEL_FILA;
  gente.forEach((g, i) => {
    const pulo = Math.abs(Math.sin(t * 7 + g.fase)) * 0.12;
    auxGente.position.set(g.x, 0.43 + pulo, g.z - andou);
    auxGente.rotation.set(0, Math.PI, Math.sin(t * 7 + g.fase) * 0.08);
    auxGente.updateMatrix();
    corposGente.setMatrixAt(i, auxGente.matrix);
    auxGente.position.y = 1.0 + pulo;
    auxGente.updateMatrix();
    cabecasGente.setMatrixAt(i, auxGente.matrix);
  });
  corposGente.instanceMatrix.needsUpdate = true;
  cabecasGente.instanceMatrix.needsUpdate = true;
  for (const { r, i } of rotulosGente) r.position.set(gente[i].x, 1.85, gente[i].z - andou);
  for (const c of casais) {
    const passo = Math.sin(t * 6 + c.fase);
    c.a.position.set(c.x, Math.abs(passo) * 0.05, c.z - andou);
    c.a.userData.pernas.forEach((perna, i) => { perna.rotation.z = (i % 2 ? 1 : -1) * passo * 0.3; });
  }
  for (const { r, c, altura } of rotulosAnimais) r.position.copy(c.a.position).add(V(-2.2, altura, 0)); // puxado para dentro da tela
  for (const av of aves) {
    av.a.position.set(av.x, av.y + Math.sin(t * 2 + av.fase) * 0.4, av.z - andou * 1.6);
    av.a.rotation.y = Math.PI / 2;
    baterAsas(av.a, 1, t * 12 + av.fase);
    av.r.position.copy(av.a.position).add(V(0, 1.5, 0));
  }
}

// ------------------------------------------------------------ Relâmpagos (mesma ideia do vídeo 03)
function criarRaio(semente, base) {
  const rnd = mulberry(semente);
  const pontos = [];
  let x = base.x, z = base.z;
  for (let y = 46; y >= 0; y -= 3.2) { pontos.push(V(x, y, z)); x += (rnd() - 0.5) * 3.2; z += (rnd() - 0.5) * 1.6; }
  pontos.push(V(base.x, 0, base.z));
  const mat = new THREE.MeshBasicMaterial({ color: '#e9f1ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos, false, 'catmullrom', 0.1), 80, 0.22, 5), mat));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos, false, 'catmullrom', 0.1), 80, 0.7, 5), mat.clone()));
  g.visible = false;
  cena.add(g);
  return { grupo: g };
}
const raios = RAIOS.map((r, i) => ({ t: r, ...criarRaio(31 + i, [V(-10, 0, -20), V(12, 0, -18)][i]) }));
function brilho(t) {
  let b = 0;
  for (const r of raios) {
    const d = t - r.t;
    if (d < 0 || d > 0.6) continue;
    b = Math.max(b, Math.exp(-d * 12) + (d > 0.1 ? 0.7 * Math.exp(-(d - 0.1) * 9) : 0));
  }
  // relâmpago sem raio visível junto com o trovão da tela preta
  const dp = t - MARCOS.trovaoPreto;
  if (dp > 0 && dp < 0.5) b = Math.max(b, Math.exp(-dp * 10) * 0.6);
  return Math.min(1, b);
}
function atualizarRaios(t) {
  for (const r of raios) {
    const d = t - r.t;
    const on = (d >= 0 && d < 0.07) || (d >= 0.1 && d < 0.3);
    r.grupo.visible = on;
    r.grupo.children.forEach((m, k) => { m.material.opacity = on ? (k === 1 ? 0.35 : 1) * (1 - Math.max(0, d - 0.1) / 0.25) : 0; });
  }
}

// ------------------------------------------------------------ Martelo
// Ângulo do braço para uma lista de golpes: sobe depois de cada batida, desce rápido na próxima.
function golpe(t, lista) {
  let i = lista.findIndex((h) => h > t);
  if (i < 0) i = lista.length;
  const h0 = lista[i - 1], h1 = lista[i];
  if (h1 === undefined || h0 === undefined) {
    if (h1 !== undefined && h1 - t < 0.35) return lerp(-1.6, -0.4, Math.pow(1 - (h1 - t) / 0.35, 2)); // primeiro golpe
    return null;
  }
  const p = (t - h0) / (h1 - h0);
  if (h1 - h0 > 1.2) { // pausa entre séries
    if (t - h0 < 0.3) return lerp(-0.4, -0.7, ss(t - h0, 0, 0.3));
    if (h1 - t < 0.35) return lerp(-1.6, -0.4, Math.pow(1 - (h1 - t) / 0.35, 2));
    return null;
  }
  return p < 0.6 ? -0.4 - 1.2 * ss(p, 0, 0.6) : -1.6 + 1.2 * Math.pow((p - 0.6) / 0.4, 2);
}
const ultimoGolpe = (t, lista) => { let u = -99; for (const h of lista) if (h <= t) u = h; return u; };

// ------------------------------------------------------------ Clima
function clima(c) {
  if (['gancho', 'chegada', 'noe', 'ceu', 'tchau', 'visao'].includes(c.nome)) return { tempestade: 0, chuva: 0, sol: 1 };
  if (c.nome === 'preto') return { tempestade: 1, chuva: 0.6, sol: 0 };
  return { tempestade: 1, chuva: 1, sol: 0 };
}

// ------------------------------------------------------------ Câmera
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  const mid = N.clone().lerp(PV, 0.5);
  switch (c.nome) {
    case 'gancho': // de baixo: o Noé martelando, a obra (só esqueleto) e o céu azul sem nuvem
      return [V(9, 7.5, 31).lerp(V(5.8, 2.4, 21.5), k), V(0, 2.2, 0).lerp(V(1.4, 2.6, 6), k)];
    case 'chegada':
      return [V(mid.x + 0.3, 2.3, 19.8).lerp(V(mid.x + 0.2, 2.2, 19.0), k), V(mid.x + 0.1, 1.7, N.z).lerp(V(mid.x, 1.7, N.z), k)];
    case 'noe':
      return [V(N.x + 0.9, 2.15, N.z + 4.4).lerp(V(N.x + 0.8, 2.1, N.z + 3.9), k), CABECA_NOE.clone().add(V(0.2, -0.25, 0))];
    case 'ceu': {
      const [o0, o1] = MARCOS.olhaCeu;
      const sobe = ss(t, o0 + 0.15, o1) * (1 - ss(t, o1 + 0.15, o1 + 0.75));
      const recua = ss(t, MARCOS.nuvenzinha - 0.1, MARCOS.nuvenzinha + 0.7);
      const pos = V(PV.x - 0.35, 2.05, PV.z + 4.0).lerp(V(PV.x - 0.3, 2.35, PV.z + 5.6), recua);
      const alvo = CABECA_VIZ.clone().add(V(-0.45, -0.3 + recua * 0.85, 0)).lerp(V(PV.x - 1, 22, PV.z - 20), sobe);
      return [pos, alvo];
    }
    case 'tchau': { // depois do rugido a câmera vira para os leões
      const r = ss(t, MARCOS.rugido - 0.1, MARCOS.rugido + 0.4);
      return [V(mid.x + 0.4, 2.3, 19.4).lerp(V(mid.x + 1.0, 2.3, 19.8), k).lerp(V(6.2, 2.0, 18.2), r), V(mid.x + 0.2, 1.7, N.z).lerp(V(mid.x + 1.0, 1.7, N.z), k).lerp(V(7.0, 1.3, 8.5), r)];
    }
    case 'preto':
      return [V(mid.x + 0.4, 2.3, 19.4), V(mid.x + 0.3, 1.8, N.z)];
    case 'chuva':
      return [V(mid.x + 0.5, 2.4, 19.6).lerp(V(mid.x + 0.2, 2.2, 18.0), k), V(mid.x + 0.3, 1.7, N.z).lerp(V(mid.x + 0.2, 1.7, N.z), k)];
    case 'ajudante': {
      if (t < 20.9) { const u = ss(t, c.inicio, 20.9); return [V(N.x + 0.9, 2.15, N.z + 4.2).lerp(V(N.x + 0.8, 2.1, N.z + 3.7), u), CABECA_NOE.clone().add(V(0.2, -0.25, 0))]; }
      const u = ss(t, 20.9, c.fim);
      return [V(PV.x - 0.4, 2.3, PV.z + 6.6).lerp(V(PV.x - 0.6, 2.4, PV.z + 7.4), u), V(PV.x - 0.5, 1.9, PV.z)];
    }
    case 'pressentimento': // vai fechando no rosto do Noé
      return [V(N.x + 0.9, 2.2, N.z + 6.2).lerp(V(N.x + 0.35, 2.2, N.z + 3.2), ss(t, c.inicio, c.fim + 0.3)), CABECA_NOE.clone().add(V(0.25, -0.2, 0))];
    case 'visao': // voo sobre a fila de gente e de bichos vindo para a obra
      return [V(27, 15, 72).lerp(V(21, 10.5, 40), k), V(11, 0, 52).lerp(V(8, 1, 14), k)];
    case 'final': {
      const m2 = N.clone().lerp(PV_FINAL, 0.5);
      return [V(m2.x + 0.1, 2.3, 18.6).lerp(V(m2.x, 2.2, 17.6), k), V(m2.x, 1.8, N.z)];
    }
  }
  return [V(0, 3, 20), V(0, 1, 0)];
}

// ------------------------------------------------------------ Noé
function poseDoNoe(c, t) {
  const n = noe;
  n.corpo.rotation.set(0, 0, 0); n.corpo.position.set(0, 0, 0);
  n.bracoDir.rotation.set(-0.4, 0, 0); n.bracoEsq.rotation.set(-0.9, 0, 0.15); // a esquerda segura a tábua
  n.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.16, 0.05, 0.05));
  n.martelo.visible = true;
  let yaw = 0;
  n.corpo.rotation.x = 0.18; // olhando para a tábua
  const a = golpe(t, MARTELADAS);
  if (a !== null) n.bracoDir.rotation.x = a;
  else n.bracoDir.rotation.x = -0.55;
  if (c.nome === 'ceu' || c.nome === 'tchau') {
    // martelo parado enquanto o vizinho fala; no tapinha ele nem se mexe
    n.bracoDir.rotation.x = -0.55;
  }
  if (c.nome === 'ajudante') {
    // fala sem parar de martelar e dá uma olhadinha de canto para o vizinho
    yaw = t > 20.2 && t < 21.2 ? 0.35 * Math.sin(ss(t, 20.2, 21.2) * Math.PI) : 0;
  }
  if (c.nome === 'pressentimento' || c.nome === 'visao') {
    // para de martelar e olha para o horizonte, como quem vê alguma coisa
    const k = ss(t, 22.55, 23.3);
    n.corpo.rotation.x = lerp(0.18, -0.12, k);
    yaw = lerp(0, 0.45, k);
    n.bracoDir.rotation.set(lerp(-0.55, -0.25, k), 0, 0);
    n.bracoEsq.rotation.set(lerp(-0.9, -0.3, k), 0, lerp(0.15, 2.6, ss(t, 23.6, 24.2))); // mão na testa
  }
  if (c.nome === 'final') {
    // volta da visão empolgado, aponta para a câmera e acena
    const k = ss(t, c.inicio, c.inicio + 0.4);
    n.corpo.rotation.x = lerp(0.18, -0.05, k);
    n.bracoDir.rotation.set(lerp(-0.55, -1.5, k), 0, 0);
    n.bracoEsq.rotation.set(-0.3, 0, 0.25);
    if (t > 31.6) { n.bracoDir.rotation.set(-0.2, 0, 2.5 + Math.sin(t * 9) * 0.25); n.martelo.visible = true; }
  }
  n.grupo.position.copy(N);
  n.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ Vizinho
function poseDoVizinho(c, t) {
  const v = vizinho;
  v.neutro();
  v.grupo.visible = true;
  const pos = PV.clone();
  let yaw = -0.45; // virado para o Noé e um pouco para a câmera
  const molhado = ['preto', 'chuva', 'ajudante', 'pressentimento', 'visao', 'final'].includes(c.nome);
  v.molhar(molhado ? 1 : 0);

  switch (c.nome) {
    case 'gancho': v.grupo.visible = false; break;
    case 'chegada': {
      const [e0, e1] = MARCOS.vizinhoEntra;
      const k = ss(t, e0, e1);
      pos.x = lerp(PV.x + 7, PV.x, k);
      if (t < e1) { yaw = -Math.PI / 2; v.andar(t, 9); v.bracoDir.rotation.x = Math.sin(t * 9) * 0.4; v.bracoEsq.rotation.x = -Math.sin(t * 9) * 0.4; }
      else {
        v.bracosCruzados();
        // olha a obra de cima a baixo
        v.cabeca.rotation.x = -0.35 * Math.sin(ss(t, e1, e1 + 1.2) * Math.PI);
        yaw = lerp(-Math.PI / 2, -0.45, ss(t, e1, e1 + 0.4));
        if (t > 4.6 && t < 5.4) v.corpo.rotation.z = Math.sin((t - 4.6) * 12) * 0.03; // deboche no "mar"
        // o cachorro late e ele dá um pulinho
        const s = t - MARCOS.susto;
        if (s > 0 && s < 0.5) { pos.y = Math.sin((s / 0.5) * Math.PI) * 0.3; v.bracoDir.rotation.set(0, 0, 1.8); v.bracoEsq.rotation.set(0, 0, -1.8); }
      }
      break;
    }
    case 'noe': v.bracosCruzados(); v.cabeca.rotation.y = -0.4; break;
    case 'ceu': {
      v.bracosCruzados();
      const [o0, o1] = MARCOS.olhaCeu;
      const olha = ss(t, o0, o1) * (1 - ss(t, o1 + 0.2, o1 + 0.6));
      v.cabeca.rotation.x = -0.9 * olha;
      v.corpo.rotation.x = -0.08 * olha;
      yaw = lerp(-0.45, -0.08, ss(t, o1 + 0.2, o1 + 0.6)); // vira para a câmera
      // risadinha no "Chover?"
      if (t > 9.3 && t < 9.9) v.corpo.position.y = Math.abs(Math.sin((t - 9.3) * 22)) * 0.03;
      break;
    }
    case 'tchau': {
      const [p0, p1] = MARCOS.tapinhas;
      const [s0, s1] = MARCOS.vizinhoSai;
      // ri e chega um passo mais perto, dá dois tapinhas no ombro do Noé
      const perto = ss(t, c.inicio, p0) * (1 - ss(t, s0, s0 + 0.2));
      pos.x = lerp(PV.x, PV.x - 1.1, perto);
      v.corpo.position.y = Math.abs(Math.sin(t * 20)) * 0.025;
      v.bracoEsq.rotation.set(0, 0, 0.15);
      if (t < s0) {
        v.bracoDir.rotation.set(-0.3, 0, 0);
        const tap = t > p0 - 0.2 && t < p1 + 0.15;
        if (tap) v.bracoDir.rotation.set(-0.3, 0, -1.35 - (Math.sin((t - p0) * Math.PI / 0.15) > 0 ? 0.12 : 0));
        yaw = -0.7;
      } else {
        // vai embora andando para a direita, balançando a mão
        yaw = Math.PI / 2;
        const ru = MARCOS.rugido;
        if (t < ru) {
          pos.x = lerp(PV.x - 1.1, PV.x + 6, ss(t, s0, s1 + 0.6));
          v.andar(t, 9);
          v.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 10) * 0.35); // tchauzinho
        } else {
          // os leões rugem: pulo de susto e sai correndo
          const x0 = lerp(PV.x - 1.1, PV.x + 6, ss(ru, s0, s1 + 0.6));
          pos.x = x0 + (t - ru) * 6.5;
          pos.y = t - ru < 0.35 ? Math.sin(((t - ru) / 0.35) * Math.PI) * 0.35 : 0;
          const passo = v.andar(t, 18, 0.3);
          v.corpo.rotation.x = 0.25;
          v.bracoDir.rotation.set(0, 0, 2.7 + passo * 0.3);
          v.bracoEsq.rotation.set(0, 0, -2.7 - passo * 0.3);
          v.chapeu.position.y = 0.2 + Math.min(0.5, (t - ru) * 2); // o chapéu voa
        }
      }
      break;
    }
    case 'preto': v.grupo.visible = false; break;
    case 'chuva': {
      const [r0, r1] = MARCOS.correndo;
      const k = ss(t, r0, r1);
      pos.x = lerp(PV.x + 8, PV.x, k);
      // segura o chapéu com a mão esquerda
      v.bracoEsq.rotation.set(0, 0, -2.75);
      if (t < r1) {
        yaw = -Math.PI / 2;
        const passo = v.andar(t, 16, 0.28);
        v.corpo.rotation.x = 0.2;
        v.bracoDir.rotation.x = passo * 0.8;
      } else {
        // ofegante, meio curvado
        v.corpo.rotation.x = 0.22 + Math.sin(t * 9) * 0.04;
        v.corpo.position.y = Math.sin(t * 9) * 0.02;
        v.bracoDir.rotation.set(-0.5, 0, 0.2);
        yaw = lerp(-Math.PI / 2, -0.5, ss(t, r1, r1 + 0.4));
        v.chapeu.rotation.z = 0.35; // chapéu torto e murcho
      }
      break;
    }
    case 'ajudante': {
      v.bracoEsq.rotation.set(0, 0, -2.75);
      v.chapeu.rotation.z = 0.35;
      v.corpo.rotation.x = 0.15 + Math.sin(t * 9) * 0.03;
      yaw = -0.5;
      if (t > MARCOS.feixe - 0.2) {
        // o feixe pega ele: estica o corpo, braços para cima comemorando
        const k = ss(t, MARCOS.feixe - 0.2, MARCOS.feixe + 0.2);
        v.corpo.rotation.x = lerp(0.15, 0, k);
        v.bracoDir.rotation.set(0, 0, lerp(0, 2.6, k) + Math.sin(t * 10) * 0.2 * k);
        v.bracoEsq.rotation.set(0, 0, lerp(-2.75, -2.6, k) - Math.sin(t * 10) * 0.2 * k);
        pos.y = Math.max(0, Math.sin(ss(t, MARCOS.feixe, MARCOS.feixe + 0.6) * Math.PI)) * 0.35;
        yaw = lerp(-0.5, -0.15, k);
      }
      break;
    }
    case 'pressentimento': case 'visao': case 'final': {
      pos.copy(PV_FINAL);
      yaw = -0.35;
      v.chapeu.rotation.z = 0.3;
      v.martelo.visible = true;
      v.corpo.rotation.x = 0.2;
      const a = golpe(t, MARTELADAS_VIZINHO);
      v.bracoDir.rotation.set(a ?? -0.55, 0, 0);
      v.bracoEsq.rotation.set(-0.9, 0, -0.1);
      break;
    }
  }
  v.grupo.position.copy(pos);
  v.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ Bichos da obra
function atualizarBichos(c, t) {
  for (const b of presentes) { b.a.position.copy(b.base); b.a.rotation.set(0, b.yaw, 0); b.a.scale.setScalar(1); }
  // Cachorro: late para o vizinho quando ele zoa a obra
  const late = MARCOS.latidos.some((h) => t >= h && t < h + 0.22);
  if (late) { cachorro.a.position.y = 0.12; cachorro.a.rotation.z = 0.18; }
  mostrarRotulo(cachorro, t, MARCOS.rotuloCachorro);
  // Urubu: encara o vizinho e inclina a cabeça quando aparece a nuvem
  urubu.a.rotation.y = c.nome === 'ceu' ? -0.5 : 0;
  urubu.a.userData.cabeca.rotation.x = c.nome === 'ceu' && t > 10.0 ? Math.sin(Math.min(1, (t - 10.0) / 0.4) * Math.PI / 2) * 0.55 : 0;
  if (c.nome === 'ceu' && t > MARCOS.nuvenzinha + 0.2) urubu.a.userData.cabeca.rotation.x = -0.6; // olha a nuvem
  mostrarRotulo(urubu, t, MARCOS.rotuloUrubu);
  // Leões: rugem e o vizinho sai correndo
  for (const [b, atraso] of [[leao1, 0], [leao2, 0.12]]) {
    const r = t - MARCOS.rugido - atraso;
    if (r > 0 && r < 0.9) { const k = Math.sin(Math.min(1, r / 0.9) * Math.PI); b.a.scale.set(1 + k * 0.08, 1 + k * 0.12, 1 + k * 0.08); b.a.rotation.z = k * 0.15; }
    mostrarRotulo(b, t, MARCOS.rotuloLeoes);
  }
  elefante.rot.visible = false;
  for (const b of presentes) b.a.visible = c.nome !== 'visao';
}

// ------------------------------------------------------------ HUD
function hud(c, t) {
  legendas.atualizar(t);
  const iFala = FALAS.findIndex(([a, b]) => t >= a && t < b);
  const falante = $('falante');
  falante.style.opacity = iFala >= 0 ? '1' : '0';
  if (iFala >= 0) {
    const quem = VOZES[iFala];
    const chip = falante.firstElementChild;
    chip.textContent = quem === 'noe' ? 'NOÉ' : 'VIZINHO';
    chip.style.background = quem === 'noe' ? '#ffd23f' : '#c9a7ff';
  }

  // POV: aparece logo no começo e sai quando o vizinho fala
  const pov = $('pov');
  pov.style.opacity = String(ss(t, 0.05, 0.3) * (1 - ss(t, 5.7, 6.0)));
  pov.style.transform = `translateX(-50%) scale(${0.9 + 0.1 * ss(t, 0.05, 0.3)})`;

  // Tela preta
  const preto = $('preto');
  const kp = ss(t, 13.45, 13.6) * (1 - ss(t, 14.75, 15.05));
  preto.style.opacity = String(kp);
  preto.firstElementChild.style.opacity = String(ss(t, 13.6, 13.9) * (1 - ss(t, 14.6, 14.8)));

  // Visão: contador de quem está a caminho
  const cont = $('contadorTexto');
  const [c0, c1] = MARCOS.contador;
  $('contador').style.opacity = c.nome === 'visao' ? String(ss(t, c0 - 0.3, c0)) : '0';
  cont.textContent = `${Math.round(200 * ss(t, c0, c1))} AJUDANTES A CAMINHO 👀`;
  cont.style.transform = `scale(${t > c1 && t < c1 + 0.3 ? 1.12 : 1})`;
  $('visao').style.opacity = String(c.nome === 'visao' ? 1 : ss(t, 23.8, 24.95) * (c.nome === 'pressentimento' ? 0.7 : 0));

  // Final: gancho do próximo vídeo, cartão de seguir e pergunta
  $('segue').style.opacity = c.nome === 'final' ? String(ss(t, c.inicio + 0.2, c.inicio + 0.5) * (0.85 + 0.15 * Math.sin(t * 10))) : '0';
  const card = $('cartao');
  const kc = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35);
  const sai = ss(t, 35.0, 35.3);
  card.style.transform = `translateX(-50%) scale(${kc * (1 - sai) * (1 + Math.sin(Math.min(1, Math.max(0, t - MARCOS.cartao) / 0.35) * Math.PI) * 0.08)})`;
  const toque = t > MARCOS.toque;
  const botao = card.querySelector('.botao');
  botao.textContent = toque ? 'Seguindo ✓' : 'Seguir';
  botao.style.background = toque ? '#efefef' : '#0095f6';
  botao.style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, MARCOS.toque - 0.7, MARCOS.toque - 0.5) * (1 - ss(t, MARCOS.toque + 0.7, MARCOS.toque + 1.0)));
  const kcur = ss(t, MARCOS.toque - 0.6, MARCOS.toque - 0.05);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > MARCOS.toque - 0.05 && t < MARCOS.toque + 0.15 ? 0.85 : 1})`;
  const kr = ss(t, 35.1, 35.4);
  $('recado').style.opacity = String(kr);
  $('recado').style.transform = `scale(${0.85 + 0.15 * kr + (t > 35.4 ? Math.sin((t - 35.4) * 8) * 0.03 : 0)})`;
}

// ------------------------------------------------------------ Quadro
function renderizarEm(t) {
  const c = cenaEm(t);
  const { tempestade, chuva: intensidadeChuva, sol } = clima(c);
  cenario.definirClima(tempestade);
  cenario.nuvens.visible = tempestade > 0.5; // céu de verão: nenhuma nuvem
  if (sol) { cenario.sol.intensity = 2.7; cenario.hemisferica.intensity = 1.2; }
  const raio = brilho(t);
  cenario.hemisferica.intensity += raio * 2.5;
  const flashVisao = Math.max(0, 1 - Math.abs(t - MARCOS.flashVisao) / 0.3, 1 - Math.abs(t - MARCOS.flashVolta) / 0.3);
  $('flash').style.opacity = String(Math.max(raio * 0.7, flashVisao));
  $('escuro').style.opacity = String(ss(tempestade, 0.3, 1) * 0.55 * (1 - raio * 0.8));
  $('sol').style.opacity = String(sol);
  renderer.toneMappingExposure = 1.05 - ss(tempestade, 0.3, 1) * 0.15;
  cenario.atualizar(t * 3);
  chuva.atualizar(t, intensidadeChuva);
  atualizarRaios(t);
  arca.atualizar(t);

  poseDoNoe(c, t);
  poseDoVizinho(c, t);
  atualizarBichos(c, t);
  procissao.visible = c.nome === 'visao';
  if (procissao.visible) atualizarProcissao(t);

  // lascas a cada martelada do Noé
  const ug = ultimoGolpe(t, MARTELADAS);
  lascas.atualizar(t, bancada.position.clone().add(V(-0.2, 1.08, -0.1)), t - ug < 0.4 && c.nome !== 'ceu' && c.nome !== 'tchau' ? ug : -99);

  // nuvenzinha em cima do vizinho
  const kn = ss(t, MARCOS.nuvenzinha, MARCOS.nuvenzinha + 0.25);
  nuvenzinha.visible = c.nome === 'ceu' && kn > 0;
  nuvenzinha.scale.setScalar(0.8 * kn * (1 + Math.sin(Math.min(1, (t - MARCOS.nuvenzinha) / 0.3) * Math.PI) * 0.2));
  nuvenzinha.position.x = PV.x + Math.sin(t * 1.5) * 0.05;

  // vira ajudante
  feixe.atualizar(t, PV.x, PV.z, MARCOS.feixe);
  onda.atualizar(t, PV.x, PV.z, MARCOS.feixe, 3.5);
  brilhos.atualizar(t, PV.clone().add(V(0, 1.2, 0)), MARCOS.feixe);
  const [r0, r1] = MARCOS.rotuloAjudante;
  const kr = ss(t, r0, r0 + 0.25) * (1 - ss(t, r1 - 0.25, r1));
  rotuloAjudante.visible = kr > 0.01;
  rotuloAjudante.position.copy(PV).add(V(0, 2.75, 0));
  rotuloAjudante.scale.set(rotuloAjudante.userData.escala[0] * kr, rotuloAjudante.userData.escala[1] * kr, 1);
  $('ouro').style.opacity = String(Math.max(0, 1 - Math.abs(t - MARCOS.feixe) / 0.45) * 0.8);

  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  const tremor = raio * 0.18 + impacto(MARCOS.feixe, 0.12, 6);
  pos.x += Math.sin(t * 61) * tremor; pos.y += Math.cos(t * 47) * tremor;
  camera.position.copy(pos);
  camera.lookAt(alvo);
  ajustarRotulos();

  hud(c, t);
  renderer.render(cena, camera);
}

await new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = 'assets/perfil.jpg'; });

window.__duracao = DURACAO;
window.__renderizarEm = renderizarEm;
renderizarEm(0);
window.__pronto = true;

if (!new URLSearchParams(location.search).has('gravando')) {
  const t0 = performance.now();
  renderer.setAnimationLoop(() => renderizarEm(((performance.now() - t0) / 1000) % DURACAO));
}
