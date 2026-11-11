// Avulso "POV: você tá construindo um barco a 500 km do mar". Tudo é função do tempo t.
// Tempos em js/avulso-pov-tempos.js · Roteiro em docs/roteiro-avulso-pov.md
import * as THREE from 'three';
import { Arca } from './arca.js';
import { Noe, Vizinho } from './personagens.js';
import { Cenario } from './cenario.js';
import { Chuva, etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V, mulberry } from './efeitos.js';
import { DURACAO, FALAS, VOZES, CENAS, RAIOS, MARCOS, MARTELADAS, MARTELADAS_VIZINHO } from './avulso-pov-tempos.js';

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
  if (['gancho', 'chegada', 'noe', 'ceu', 'tchau'].includes(c.nome)) return { tempestade: 0, chuva: 0, sol: 1 };
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
      const pos = V(PV.x + 0.25, 2.15, PV.z + 3.3).lerp(V(PV.x + 0.3, 2.35, PV.z + 5.0), recua);
      const alvo = CABECA_VIZ.clone().add(V(0, recua * 0.75, 0)).lerp(V(PV.x - 1, 22, PV.z - 20), sobe);
      return [pos, alvo];
    }
    case 'tchau':
      return [V(mid.x + 0.4, 2.3, 19.4).lerp(V(mid.x + 1.0, 2.3, 19.8), k), V(mid.x + 0.2, 1.7, N.z).lerp(V(mid.x + 1.0, 1.7, N.z), k)];
    case 'preto':
      return [V(mid.x + 0.4, 2.3, 19.4), V(mid.x + 0.3, 1.8, N.z)];
    case 'chuva':
      return [V(mid.x + 0.5, 2.4, 19.6).lerp(V(mid.x + 0.2, 2.2, 18.0), k), V(mid.x + 0.3, 1.7, N.z).lerp(V(mid.x + 0.2, 1.7, N.z), k)];
    case 'ajudante': {
      if (t < 20.9) { const u = ss(t, c.inicio, 20.9); return [V(N.x + 0.9, 2.15, N.z + 4.2).lerp(V(N.x + 0.8, 2.1, N.z + 3.7), u), CABECA_NOE.clone().add(V(0.2, -0.25, 0))]; }
      const u = ss(t, 20.9, c.fim);
      return [V(PV.x - 0.4, 2.3, PV.z + 6.6).lerp(V(PV.x - 0.6, 2.4, PV.z + 7.4), u), V(PV.x - 0.5, 1.9, PV.z)];
    }
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
  if (c.nome === 'final') {
    // para e aponta para a câmera
    const k = ss(t, 22.5, 22.9);
    n.corpo.rotation.x = lerp(0.18, -0.05, k);
    n.bracoDir.rotation.set(lerp(-0.55, -1.5, k), 0, 0);
    n.bracoEsq.rotation.set(-0.3, 0, 0.25);
    if (t > 23.4) { n.bracoDir.rotation.set(-0.2, 0, 2.5 + Math.sin(t * 9) * 0.25); n.martelo.visible = true; }
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
  const molhado = ['preto', 'chuva', 'ajudante', 'final'].includes(c.nome);
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
        const k = ss(t, s0, s1 + 0.6);
        pos.x = lerp(PV.x - 1.1, PV.x + 6, k);
        yaw = Math.PI / 2;
        v.andar(t, 9);
        v.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 10) * 0.35); // tchauzinho
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
    case 'final': {
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

  // Final: aviso, cartão de seguir e pergunta
  $('segue').style.opacity = c.nome === 'final' ? String(ss(t, 22.5, 22.8) * (0.8 + 0.2 * Math.sin(t * 10))) : '0';
  const card = $('cartao');
  const kc = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35);
  const sai = ss(t, 25.4, 25.7);
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
  const kr = ss(t, MARCOS.toque + 0.5, MARCOS.toque + 0.8);
  $('recado').style.opacity = String(kr);
  $('recado').style.transform = `scale(${0.85 + 0.15 * kr + (t > 25.1 ? Math.sin((t - 25.1) * 8) * 0.03 : 0)})`;
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
  $('flash').style.opacity = String(raio * 0.7);
  $('escuro').style.opacity = String(ss(tempestade, 0.3, 1) * 0.55 * (1 - raio * 0.8));
  $('sol').style.opacity = String(sol);
  renderer.toneMappingExposure = 1.05 - ss(tempestade, 0.3, 1) * 0.15;
  cenario.atualizar(t * 3);
  chuva.atualizar(t, intensidadeChuva);
  atualizarRaios(t);
  arca.atualizar(t);

  poseDoNoe(c, t);
  poseDoVizinho(c, t);

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
