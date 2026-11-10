// Vídeo 02: "Os 10 primeiros ajudantes". Tudo é função do tempo t.
// Tempos em js/video02-tempos.js · Roteiro em docs/roteiro-video-02.md
import * as THREE from 'three';
import { Arca } from './arca.js';
import { Noe, criarAnimal } from './personagens.js';
import { Cenario } from './cenario.js';
import { Chuva, brilhoDoRaio, etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V, mulberry } from './efeitos.js';
import { DURACAO, FALAS, CENAS, AJUDANTES, RAIOS, MARCOS } from './video02-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/video02-palavras.json', { cache: 'no-store' });
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
arca.configurar(0, 0);
cena.add(arca.grupo);
const chuva = new Chuva(cena);
const legendas = new Legendas($('legenda'), FALAS, PALAVRAS);

// Noé no centro, de frente para a câmera
const C = V(-1, 0, 11.5);
const noe = new Noe();
noe.cajado.visible = false;
noe.grupo.position.copy(C).add(V(0, 0, 0.6));
cena.add(noe.grupo);
const CABECA = noe.grupo.position.clone().add(V(0, 2.2, 0));

// Vagas: fileira de trás (6) e da frente (4), em volta do Noé
const VAGAS = [[2.7, -0.3], [1.4, -0.3], [3.0, -2.2], [1.8, -2.2], [0.6, -2.2], [-0.6, -2.2], [-1.8, -2.2], [-1.4, -0.3], [-2.7, -0.3], [-3.0, -2.2]]
  .map(([x, z]) => V(C.x + x, 0, C.z + z));
const ROUPAS = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#e84393', '#f1c40f', '#7f8c8d'];
const PELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const EMOJI = { jacare: '🐊', onca: '🐆', elefante: '🐘' };
const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true });

function criarFigura(i) {
  const g = new THREE.Group();
  const corpo = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.85, 8), mat(ROUPAS[i]));
  tronco.position.y = 0.43;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), mat(PELES[i % PELES.length]));
  cabeca.position.y = 1.05;
  const olhos = [-1, 1].map((l) => { const o = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), mat('#111')); o.position.set(l * 0.07, 1.09, 0.17); return o; });
  const braco = new THREE.Group();
  braco.position.set(0.3, 0.75, 0);
  const manga = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.1), mat(ROUPAS[i]));
  manga.position.y = -0.2;
  const martelo = new THREE.Group();
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 5), mat('#5a3a1d'));
  cabo.rotation.x = Math.PI / 2; cabo.position.set(0, -0.42, 0.14);
  const ferro = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.2), mat('#6e6e6e'));
  ferro.rotation.x = Math.PI / 2; ferro.position.set(0, -0.42, 0.34);
  martelo.add(cabo, ferro);
  martelo.visible = false;
  braco.add(manga, martelo);
  corpo.add(tronco, cabeca, ...olhos, braco);
  g.add(corpo);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { grupo: g, corpo, braco, martelo };
}

const ajudantes = AJUDANTES.map((a, i) => {
  const f = criarFigura(i);
  f.dados = a;
  f.vaga = VAGAS[a.vaga];
  f.trasGrupo = a.vaga >= 2 && a.vaga <= 6 || a.vaga === 9;
  f.grupo.position.copy(f.vaga);
  f.rotulo = etiqueta3D(a.arroba + (a.animal ? ` ${EMOJI[a.animal]}` : ''), { fundo: a.animal ? '#ffd23f' : '#ffffff', altura: 0.62, fonte: 44 });
  f.rotulo.position.y = 1.7 + (f.trasGrupo ? 0.55 : 0) + (i % 2) * 0.4;
  f.grupo.add(f.rotulo);
  f.feixe = new Feixe(cena);
  f.onda = new Onda(cena);
  f.poeira = new Explosao(cena, { n: 60, semente: 10 + i, velocidade: 3, subida: 3.2, dur: 1.0 });
  f.faiscas = new Explosao(cena, { n: 14, semente: 40 + i, cor: '#ffe9a0', tamanho: 0.09, velocidade: 1.6, subida: 2.4, gravidade: 10, dur: 0.32 });
  f.durQueda = a.lento ? 0.95 : 0.45;
  cena.add(f.grupo);
  if (a.animal) {
    const bicho = criarAnimal(a.animal, 5 + i);
    const ajuste = { jacare: [0.1, 1.2, -Math.PI / 2 + 0.25], onca: [-0.2, 1.1, -Math.PI / 2 - 0.3], elefante: [-2.1, -0.5, -Math.PI / 2 + 0.6] }[a.animal];
    bicho.position.copy(f.vaga).add(V(ajuste[0], 0, ajuste[1]));
    bicho.rotation.y = ajuste[2];
    bicho.userData.base = bicho.position.clone();
    cena.add(bicho);
    f.animal = bicho;
    f.ondaAnimal = new Onda(cena, a.animal === 'elefante' ? '#ffe2a8' : '#fff2b0');
    f.poeiraAnimal = new Explosao(cena, { n: a.animal === 'elefante' ? 160 : 80, semente: 70 + i, cor: '#e8c58a', tamanho: 0.18, velocidade: a.animal === 'elefante' ? 7 : 4, subida: 3, dur: 1.3 });
  }
  return f;
});

// Cavaletes (peça 1 da arca): brotam do chão um a um, o do meio por último
const suportes = arca.pecas[0].objeto;
const ORDEM = [0, 8, 1, 7, 2, 6, 3, 5, 4];
const brotos = ORDEM.map((idx, j) => {
  const m = suportes.children[idx];
  const final = j === ORDEM.length - 1;
  return {
    malha: m, alturaY: m.position.y,
    inicio: final ? MARCOS.suporteFinal - 0.55 : MARCOS.suportesInicio + j * MARCOS.suportesPasso,
    dur: final ? 0.55 : 0.32, final,
    onda: new Onda(cena, final ? '#fff6c8' : '#f7d79a'),
    poeira: new Explosao(cena, { n: final ? 180 : 70, semente: 90 + j, cor: final ? '#ffe58a' : '#d9b07a', tamanho: final ? 0.2 : 0.15, velocidade: final ? 9 : 4, subida: final ? 6 : 3.5, dur: final ? 1.6 : 1.0 }),
  };
});

// Holograma da arca completa (contorno azul) que se desfaz em partículas
const holo = new Arca();
holo.configurar(holo.total, holo.total);
holo.atualizar(0);
holo.interior.grupo.visible = false;
holo.interior.luzes.forEach((l) => { l.intensity = 0; });
const matHolo = new THREE.MeshBasicMaterial({ color: '#2fa8ff', wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
holo.grupo.traverse((o) => { if (o.isMesh) { o.material = matHolo; o.castShadow = false; o.receiveShadow = false; } });
holo.grupo.visible = false;
cena.add(holo.grupo);
const nHolo = 900;
const rndH = mulberry(321);
const baseHolo = Array.from({ length: nHolo }, () => [(rndH() - 0.5) * 40, 1 + rndH() * 10, (rndH() - 0.5) * 10, 0.5 + rndH()]);
const geoHolo = new THREE.BufferGeometry();
const posHolo = new Float32Array(nHolo * 3);
geoHolo.setAttribute('position', new THREE.BufferAttribute(posHolo, 3));
const matPart = new THREE.PointsMaterial({ color: '#9fe8ff', size: 0.22, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const particulasHolo = new THREE.Points(geoHolo, matPart);
particulasHolo.frustumCulled = false;
cena.add(particulasHolo);

// ------------------------------------------------------------ Clima e céu
const CEU = { tempestade: new THREE.Color('#4a5560'), noite: new THREE.Color('#0d1530'), aurora: new THREE.Color('#f2a065'), dia: new THREE.Color('#79b8e8') };
function clima(c, t) {
  switch (c.nome) {
    case 'gancho': return { tempestade: 1, chuva: 1 };
    case 'tempo': return { tempestade: 1 - ss(t, 2.6, 3.4), chuva: 1 - ss(t, 2.6, 3.2) };
    case 'holograma': return { tempestade: 0.25, chuva: 0 };
    case 'final': return { tempestade: ss(t, MARCOS.escurece[0], MARCOS.escurece[1]) * 0.95, chuva: ss(t, 31.0, 31.9) * 0.8 };
  }
  return { tempestade: 0, chuva: 0 };
}
// Time-lapse do céu: tempestade → noite → aurora → dia
function ceuDoTempo(t) {
  const k = ss(t, 2.7, 5.6);
  const chaves = [[0, CEU.tempestade, 0.4], [0.3, CEU.noite, 0.12], [0.62, CEU.aurora, 0.8], [1, CEU.dia, 1]];
  let i = 0;
  while (i + 1 < chaves.length && k > chaves[i + 1][0]) i++;
  const [a, ca, la] = chaves[i], [b, cb, lb] = chaves[Math.min(i + 1, chaves.length - 1)];
  const u = b > a ? (k - a) / (b - a) : 1;
  return { cor: ca.clone().lerp(cb, u), luz: lerp(la, lb, u), k };
}

// ------------------------------------------------------------ Câmera
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  let p0, p1, a0, a1;
  const S = (i) => VAGAS[i];
  switch (c.nome) {
    case 'gancho': p0 = V(C.x + 1.2, 1.5, C.z + 7); p1 = V(C.x + 0.8, 1.8, C.z + 5); a0 = CABECA.clone().add(V(0, 0.4, 0)); a1 = CABECA.clone(); break;
    case 'tempo': p0 = V(C.x + 0.8, 1.8, C.z + 5); p1 = V(C.x + 3, 3.2, C.z + 12); a0 = CABECA.clone(); a1 = V(C.x, 6, C.z - 4); break;
    case 'chegada': p0 = V(C.x + 0.6, 5, C.z + 13); p1 = V(C.x + 0.2, 4.6, C.z + 12); a0 = V(C.x, 1.2, C.z - 1.2); a1 = V(C.x, 1.0, C.z - 1.2); break;
    case 'jacare': p0 = V(S(0).x + 0.9, 1.9, S(0).z + 6.8); p1 = V(S(0).x + 0.4, 1.5, S(0).z + 5.6); a0 = V(S(0).x, 0.7, S(0).z + 0.8); a1 = V(S(0).x, 0.6, S(0).z + 0.8); break;
    case 'onca': p0 = V(S(8).x - 0.9, 2.0, S(8).z + 6.6); p1 = V(S(8).x - 0.5, 1.7, S(8).z + 5.5); a0 = V(S(8).x - 0.2, 0.9, S(8).z + 0.7); a1 = V(S(8).x - 0.2, 0.8, S(8).z + 0.7); break;
    case 'elefante': p0 = V(C.x - 1.2, 3.6, C.z + 12.5); p1 = V(C.x - 2.2, 3.2, C.z + 11); a0 = V(S(9).x - 1.2, 1.6, S(9).z); a1 = V(S(9).x - 0.6, 1.5, S(9).z); break;
    case 'construcao': {
      const sobe = ss(t, 18.3, 20.2);
      const perto = V(C.x + 0.4, 3.4, C.z + 9.5), alto = V(C.x + 7, 12, C.z + 26);
      const pos = perto.clone().lerp(alto, sobe).add(V(Math.sin(t * 0.3) * 0.3, 0, 0));
      const alvo = V(C.x, 0.9, C.z - 1).lerp(V(0, 0.8, 0), sobe);
      return [pos, alvo];
    }
    case 'holograma': {
      const ang = lerp(1.15, 1.45, k);
      return [V(Math.cos(ang) * 46, lerp(16, 12, k), Math.sin(ang) * 46), V(0, 4.5, 0)];
    }
    case 'final': p0 = V(C.x + 0.3, 3.0, C.z + 11.5); p1 = V(C.x + 0.3, 2.8, C.z + 10.4); a0 = V(C.x, 1.4, C.z - 1); a1 = V(C.x, 1.4, C.z - 1); break;
  }
  return [p0.clone().lerp(p1, k), a0.clone().lerp(a1, k)];
}

// ------------------------------------------------------------ Poses do Noé
function poseDoNoe(c, t) {
  const n = noe;
  n.corpo.rotation.set(0, 0, 0); n.corpo.position.set(0, 0, 0);
  n.bracoDir.rotation.set(-0.3, 0, 0); n.bracoEsq.rotation.set(0, 0, 0.25);
  n.martelo.visible = c.nome === 'construcao';
  n.grupo.position.copy(C).add(V(0, 0, 0.6));
  let yaw = 0;
  const falando = PALAVRAS.some((w) => t >= w.t && t < w.fim + 0.05);
  switch (c.nome) {
    case 'gancho': n.corpo.rotation.x = 0.32; n.bracoDir.rotation.set(0, 0, 0.1); n.bracoEsq.rotation.set(0, 0, 0.1); break;
    case 'tempo': n.corpo.rotation.x = -0.18; n.bracoDir.rotation.set(-0.4, 0, 2.3 + Math.sin(t * 6) * 0.15); break; // coça a cabeça
    case 'chegada': {
      const pulo = Math.abs(Math.sin(t * 6));
      n.grupo.position.y = pulo * 0.12;
      n.bracoDir.rotation.set(0, 0, 2.6 + Math.sin(t * 8) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.6 - Math.sin(t * 8) * 0.2);
      break;
    }
    case 'jacare': yaw = 0.7; n.corpo.rotation.x = -0.28; n.grupo.position.z -= ss(t, 9.75, 10.1) * 0.5; n.bracoDir.rotation.set(-0.6, 0, 2.0); n.bracoEsq.rotation.set(-0.6, 0, -2.0); break;
    case 'onca': yaw = -0.7; n.grupo.position.x += ss(t, 11.95, 12.3) * 0.5; n.bracoDir.rotation.set(-1.3, 0, 0); n.bracoEsq.rotation.set(-1.3, 0, 0); break;
    case 'elefante': yaw = -0.6; n.corpo.rotation.x = -0.3 + Math.sin(Math.max(0, t - 14.65) * 30) * Math.exp(-Math.max(0, t - 14.65) * 4) * 0.08; break;
    case 'construcao': {
      const batida = Math.max(0, Math.sin((t - MARCOS.marteladas[0]) * Math.PI * 2 / 0.375));
      n.corpo.rotation.x = 0.28;
      n.bracoDir.rotation.set(-0.9 - batida * 1.0, 0, 0);
      if (t > 18.6) { n.corpo.rotation.x = -0.15; n.bracoDir.rotation.set(0, 0, 2.5); n.bracoEsq.rotation.set(0, 0, -2.5); } // comemora
      break;
    }
    case 'holograma': yaw = Math.PI; n.corpo.rotation.x = -0.2; break;
    case 'final': n.bracoDir.rotation.set(-0.2, 0, 2.5 + Math.sin(t * 9) * 0.35); n.grupo.position.y = Math.abs(Math.sin(t * 4)) * 0.06; break;
  }
  if (falando && c.nome !== 'gancho') yaw += Math.sin(t * 7) * 0.04;
  n.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ HUD
function hud(c, t) {
  legendas.atualizar(t);
  const dia = $('dia');
  if (t < MARCOS.viraDia) {
    dia.textContent = 'DIA 1';
    dia.className = c.nome === 'gancho' ? 'alerta' : '';
    // os números "giram" rápido antes de virar
    if (t > 3.6) dia.textContent = `DIA ${['1', '⏳', '1', '⏳'][Math.floor(t * 8) % 4]}`;
    dia.style.transform = 'none';
  } else {
    dia.textContent = 'DIA 2';
    dia.className = '';
    const k = Math.min(1, (t - MARCOS.viraDia) / 0.3);
    dia.style.transform = `scale(${1 + Math.sin(k * Math.PI) * 0.35})`;
  }
  $('tempo-nota').style.opacity = String(ss(t, 2.7, 3.0) * (1 - ss(t, 6.0, 6.4)));

  const cont = $('contador');
  const pousados = ajudantes.filter((f) => t >= f.dados.pousa).length;
  if (t >= 6.2 && t < 16.8) {
    cont.style.opacity = '1';
    cont.style.background = 'rgba(46,125,50,.9)';
    cont.style.fontSize = '22px';
    cont.textContent = `${pousados}/10 AJUDANTES`;
    const ultimo = Math.max(...ajudantes.filter((f) => t >= f.dados.pousa).map((f) => f.dados.pousa), -1);
    const kp = Math.min(1, Math.max(0, t - ultimo) / 0.25);
    cont.style.transform = `scale(${1 + Math.sin(kp * Math.PI) * 0.25})`;
  } else if (c.nome === 'holograma') {
    cont.style.opacity = String(ss(t, 24.0, 24.3));
    cont.style.background = 'rgba(20,90,140,.92)';
    cont.style.fontSize = '18px';
    cont.style.transform = 'none';
    cont.textContent = 'PRÓXIMA PEÇA: QUILHA · FALTAM 3 👀';
  } else cont.style.opacity = '0';

  const prog = $('progresso');
  prog.style.opacity = String(c.nome === 'construcao' || c.nome === 'holograma' ? ss(t, 17.0, 17.3) : 0);
  const pct = ss(t, MARCOS.suportesInicio, MARCOS.suporteFinal) * 2;
  $('barra').style.width = `${pct}%`;
  $('progresso-rotulo').textContent = `ARCA ${Math.round(pct)}%`;

  const kc = (t - MARCOS.carimbo) / 0.3;
  const carimbo = $('carimbo');
  if (kc > 0 && t < 23.0) {
    const e = Math.min(1, kc);
    carimbo.style.opacity = String(1 - ss(t, 22.6, 23.0));
    carimbo.style.transform = `translate(-50%, -50%) scale(${lerp(1.7, 1, e) + (e >= 1 ? Math.sin((t - MARCOS.carimbo - 0.3) * 18) * Math.exp(-(t - MARCOS.carimbo - 0.3) * 6) * 0.06 : 0)}) rotate(-12deg)`;
  } else carimbo.style.transform = 'translate(-50%, -50%) scale(0) rotate(-12deg)';

  // Cartão de seguir e recado dos animais
  const card = $('cartao');
  const k = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35);
  card.style.transform = `translateX(-50%) scale(${k * (1 + Math.sin(Math.min(1, Math.max(0, t - MARCOS.cartao) / 0.35) * Math.PI) * 0.08)})`;
  const toque = t > MARCOS.toque;
  const botao = card.querySelector('.botao');
  botao.textContent = toque ? 'Seguindo ✓' : 'Seguir';
  botao.style.background = toque ? '#efefef' : '#0095f6';
  botao.style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, MARCOS.toque - 0.7, MARCOS.toque - 0.5) * (1 - ss(t, MARCOS.toque + 0.7, MARCOS.toque + 1.0)));
  const kcur = ss(t, MARCOS.toque - 0.6, MARCOS.toque - 0.05);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > MARCOS.toque - 0.05 && t < MARCOS.toque + 0.15 ? 0.85 : 1})`;
  $('recado').style.opacity = String(ss(t, MARCOS.recado, MARCOS.recado + 0.3));

  // Print do comentário de quem pediu o animal: entra logo depois que ele pousa
  const card2 = $('comentario');
  const pedido = COMENTARIOS.find((p) => t >= p.inicio && t < p.fim);
  if (pedido) {
    if (card2.dataset.animal !== pedido.animal) {
      $('comentario-img').src = `assets/comentarios/${pedido.animal}.png`;
      $('comentario-bicho').textContent = EMOJI[pedido.animal];
      card2.dataset.animal = pedido.animal;
    }
    const e = Math.min(1, (t - pedido.inicio) / 0.28);
    const sai = ss(t, pedido.fim - 0.25, pedido.fim);
    const escala = (e < 1 ? 1 - Math.pow(1 - e, 3) + Math.sin(e * Math.PI) * 0.12 : 1) * (1 - sai * 0.3);
    card2.style.opacity = String(Math.min(1, e * 2) * (1 - sai));
    card2.style.transform = `translateX(-50%) translateY(${-sai * 30}px) scale(${escala}) rotate(-3deg)`;
  } else card2.style.opacity = '0';
}

// Janelas em que aparece o print de cada pedido (do pouso até o fim da cena)
const COMENTARIOS = AJUDANTES.filter((a) => a.animal).map((a) => {
  const cena = CENAS.find(([, nome]) => nome === (a.animal === 'onca' ? 'onca' : a.animal));
  const i = CENAS.indexOf(cena);
  return { animal: a.animal, inicio: a.pousa + 0.2, fim: (CENAS[i + 1]?.[0] ?? DURACAO) - 0.1 };
});
// Pré-carrega os prints para não "piscar" na gravação
const PRINTS_PRONTOS = Promise.all(COMENTARIOS.map((c) => new Promise((ok) => { const img = new Image(); img.onload = img.onerror = ok; img.src = `assets/comentarios/${c.animal}.png`; })));

// ------------------------------------------------------------ Quadro
let cenaAtual = -1;
function renderizarEm(t) {
  const c = cenaEm(t);
  if (c.indice !== cenaAtual) {
    cenaAtual = c.indice;
    // cavaletes visíveis a partir da construção
    if (c.nome === 'construcao' || c.nome === 'holograma' || c.nome === 'final') arca.configurar(1, 1);
    else arca.configurar(0, 0);
  }

  // Clima
  const { tempestade, chuva: intensidadeChuva } = clima(c, t);
  cenario.definirClima(tempestade);
  let escuro = ss(tempestade, 0.3, 1) * 0.62;
  if (c.nome === 'tempo') {
    const ceu = ceuDoTempo(t);
    cena.background = ceu.cor;
    cena.fog.color.copy(ceu.cor);
    cenario.sol.intensity = 2.2 * ceu.luz;
    cenario.hemisferica.intensity = 0.25 + 0.85 * ceu.luz;
    escuro = (1 - ceu.luz) * 0.5;
  }
  const raio = tempestade > 0.5 ? brilhoDoRaio(t, RAIOS) : 0;
  cenario.hemisferica.intensity += raio * 2.5;
  const flashFinal = Math.max(0, 1 - Math.abs(t - MARCOS.flash) / 0.22);
  $('flash').style.opacity = String(Math.max(raio * 0.75, flashFinal * 0.9));
  $('escuro').style.opacity = String(escuro * (1 - raio * 0.8));
  $('ouro').style.opacity = String(ss(t, MARCOS.flash - 0.1, MARCOS.flash + 0.1) * (1 - ss(t, MARCOS.flash + 0.6, MARCOS.flash + 1.6)));
  renderer.toneMappingExposure = 1 - ss(tempestade, 0.3, 1) * 0.3;
  // nuvens correm no time-lapse
  cenario.atualizar(t + ss(t, 2.7, 5.6) * 90);
  chuva.atualizar(t, intensidadeChuva);

  // Ajudantes: caem no feixe de luz, pousam com onda e poeira
  const martelando = c.nome === 'construcao' && t < 18.6;
  const finalFesta = c.nome === 'final';
  const tPassoMartelo = 0.375;
  for (const [i, f] of ajudantes.entries()) {
    const { pousa } = f.dados;
    const visivel = t >= pousa - f.durQueda && c.nome !== 'gancho' && c.nome !== 'tempo';
    f.grupo.visible = visivel;
    f.feixe.atualizar(t, f.vaga.x, f.vaga.z, pousa);
    f.onda.atualizar(t, f.vaga.x, f.vaga.z, pousa, f.dados.lento ? 4 : 2.6);
    f.poeira.atualizar(t, V(f.vaga.x, 0.15, f.vaga.z), pousa);
    if (visivel) {
      const k = Math.min(1, (t - (pousa - f.durQueda)) / f.durQueda);
      const queda = (1 - k * k) * 9;
      const amassa = t > pousa ? 1 - Math.sin(Math.min(1, (t - pousa) / 0.22) * Math.PI) * 0.22 : 1;
      let pulo = Math.abs(Math.sin(t * 4 + i)) * 0.05;
      if (finalFesta) pulo = Math.abs(Math.sin(t * 5 + i * 0.7)) * 0.35;
      f.grupo.position.set(f.vaga.x, queda + (t > pousa ? pulo : 0), f.vaga.z);
      f.corpo.scale.set(1 + (1 - amassa) * 0.5, amassa, 1 + (1 - amassa) * 0.5);
      f.grupo.rotation.y = Math.atan2(C.x - f.vaga.x, (C.z + 6) - f.vaga.z) * 0.5;
      // etiqueta: grande ao pousar, depois menor
      const ke = ss(t, pousa, pousa + 0.18);
      const grande = 1 - ss(t, pousa + 1.4, pousa + 1.9) * 0.35;
      // Nos closes dos animais só aparece o @ do dono; nos planos abertos, todos
      const foco = { jacare: 0, onca: 8 }[c.nome];
      let fator = 1;
      if (foco !== undefined) fator = 0; // nos closes, o card com o print do comentário mostra o nome
      else if (c.nome === 'construcao') fator = t > 21.0 ? 1.6 : 0;
      else if (c.nome === 'holograma') fator = 0;
      f.rotulo.visible = ke > 0.01 && fator > 0;
      f.rotulo.scale.set(f.rotulo.userData.escala[0] * ke * grande * fator, f.rotulo.userData.escala[1] * ke * grande * fator, 1);
      // martelar em ritmo / acenar no final
      f.martelo.visible = martelando;
      if (martelando) {
        const fase = (t - MARCOS.marteladas[0]) / tPassoMartelo;
        const batida = Math.max(0, Math.sin(fase * Math.PI * 2));
        f.braco.rotation.set(-0.8 - batida * 1.1, 0, 0);
        f.corpo.rotation.x = 0.2;
        const ultimaBatida = MARCOS.marteladas[0] + (Math.floor(fase - 0.25) + 0.25) * tPassoMartelo + tPassoMartelo * 0.25;
        f.faiscas.atualizar(t, f.grupo.position.clone().add(V(Math.sin(f.grupo.rotation.y) * 0.5, 0.1, Math.cos(f.grupo.rotation.y) * 0.5)), ultimaBatida);
      } else {
        f.corpo.rotation.x = 0;
        f.faiscas.atualizar(t, V(), -99);
        f.braco.rotation.set(0, 0, finalFesta || (c.nome === 'construcao' && t > 18.6) ? 2.5 + Math.sin(t * 9 + i) * 0.35 : 0.15);
      }
    } else f.faiscas.atualizar(t, V(), -99);

    // Animal do ajudante
    if (f.animal) {
      const vis = visivel;
      f.animal.visible = vis;
      if (vis) {
        const k = Math.min(1, (t - (pousa - f.durQueda)) / f.durQueda);
        const base = f.animal.userData.base;
        f.animal.position.set(base.x, (1 - k * k) * 9, base.z);
        const pesado = f.dados.animal === 'elefante';
        const amassa = t > pousa ? 1 - Math.sin(Math.min(1, (t - pousa) / 0.3) * Math.PI) * (pesado ? 0.25 : 0.15) : 1;
        f.animal.scale.set(1 + (1 - amassa) * 0.4, amassa, 1 + (1 - amassa) * 0.4);
        const passo = Math.sin(t * 5 + i);
        f.animal.userData.pernas.forEach((p, j) => { p.rotation.z = (j % 2 ? 1 : -1) * passo * 0.08; });
      }
      f.ondaAnimal.atualizar(t, f.animal.userData.base.x, f.animal.userData.base.z, pousa + 0.02, f.dados.animal === 'elefante' ? 9 : 4.5, f.dados.animal === 'elefante' ? 0.9 : 0.65);
      f.poeiraAnimal.atualizar(t, f.animal.userData.base.clone().add(V(0, 0.2, 0)), pousa);
    }
  }

  // Cavaletes brotando
  for (const b of brotos) {
    const k = Math.min(1, Math.max(0, (t - b.inicio) / b.dur));
    // "back" easing: passa um pouco do tamanho e volta
    const e = k <= 0 ? 0.001 : 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
    b.malha.scale.y = Math.max(0.001, e);
    b.malha.position.y = b.alturaY * Math.max(0.001, e);
    const fim = b.inicio + b.dur;
    b.onda.atualizar(t, b.malha.position.x, 0, fim, b.final ? 14 : 4, b.final ? 1.1 : 0.6);
    b.poeira.atualizar(t, V(b.malha.position.x, 0.4, 0), fim);
  }

  // Holograma
  const [h0, h1] = MARCOS.holograma;
  const aparece = ss(t, h0, h0 + 0.6);
  const some = ss(t, h1 - 0.9, h1);
  holo.grupo.visible = c.nome === 'holograma' && aparece > 0.01 && some < 0.99;
  matHolo.opacity = 0.28 * aparece * (1 - some) * (0.85 + 0.15 * Math.sin(t * 20));
  holo.grupo.position.y = Math.sin(t * 2) * 0.08;
  const dt = t - (h1 - 0.9);
  particulasHolo.visible = c.nome === 'holograma' && dt > 0 && dt < 2.2;
  if (particulasHolo.visible) {
    for (let i = 0; i < nHolo; i++) {
      const [x, y, z, v] = baseHolo[i];
      posHolo[i * 3] = x + Math.sin(i + t * 2) * 0.3 * dt;
      posHolo[i * 3 + 1] = y + v * dt * 3;
      posHolo[i * 3 + 2] = z;
    }
    geoHolo.attributes.position.needsUpdate = true;
    matPart.opacity = 1 - dt / 2.2;
  }

  poseDoNoe(c, t);

  // Câmera, com tremidas nos impactos
  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  const tremor = raio * 0.2 + impacto(AJUDANTES[9].pousa, 0.55, 4) + impacto(MARCOS.suporteFinal, 0.45, 4) + impacto(AJUDANTES[7].pousa, 0.12) + impacto(AJUDANTES[8].pousa, 0.12);
  pos.x += Math.sin(t * 61) * tremor; pos.y += Math.cos(t * 47) * tremor;
  camera.position.copy(pos);
  camera.lookAt(alvo);

  hud(c, t);
  renderer.render(cena, camera);
}

window.__duracao = DURACAO;
window.__renderizarEm = renderizarEm;
renderizarEm(0);
await PRINTS_PRONTOS;
window.__pronto = true;

if (!new URLSearchParams(location.search).has('gravando')) {
  const t0 = performance.now();
  renderer.setAnimationLoop(() => renderizarEm(((performance.now() - t0) / 1000) % DURACAO));
}
