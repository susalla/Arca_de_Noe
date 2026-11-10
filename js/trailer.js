// Trailer do vídeo 01 ("O dilúvio está vindo"). Tudo é função do tempo t,
// então o gravador pode renderizar quadro a quadro com resultado idêntico.
// Roteiro e tempos: docs/roteiro-video-01.md
import * as THREE from 'three';
import { Arca, ALTURA } from './arca.js';
import { Noe, Ajudantes, Animais } from './personagens.js';
import { Cenario } from './cenario.js';

export const DURACAO = 23;

// [início, fim, texto] — *palavra* fica em amarelo
export const FALAS = [
  [0.25, 2.35, 'O *dilúvio* está vindo.'],
  [2.45, 5.0, 'E eu preciso construir uma arca… *sozinho.*'],
  [5.1, 8.6, 'Mas cada pessoa que me *seguir* vira um ajudante.'],
  [8.7, 12.35, 'Me siga e amanhã *você* aparece aqui comigo.'],
  [12.6, 16.4, 'Com *10* *mil* ajudantes, a arca fica pronta.'],
  [16.6, 19.9, 'Sem eles… você *sabe* o que acontece.'],
  [20.1, 23.0, 'Me segue. O dilúvio *não* *espera.*'],
];

// Tempos de cada palavra, vindos da transcrição da narração (scripts/narracao.mjs).
// Sem o arquivo, cada palavra recebe um tempo proporcional dentro da frase.
let PALAVRAS = [];
try {
  const r = await fetch('audio/narracao-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }

const TOKENS = FALAS.map(([ini, fim, texto]) => {
  const tokens = texto.split(' ').map((tk) => ({ texto: tk.replaceAll('*', ''), destaque: tk.includes('*') }));
  const faladas = PALAVRAS.filter((w) => w.t >= ini - 0.15 && w.t < fim);
  tokens.forEach((tk, k) => {
    tk.t = faladas.length === tokens.length ? faladas[k].t : ini + ((fim - ini - 0.4) * k) / tokens.length;
  });
  return tokens;
});

// Raios (o som do trovão vem ~0,15 s depois, ver scripts/trilha-trailer.mjs)
export const RAIOS = [0.12, 1.55, 17.9, 19.35, 21.6];

// Cenas: [início, nome]
const CENAS = [
  [0, 'gancho'], [2.4, 'sozinho'], [5.0, 'chegada'], [8.7, 'voce'],
  [12.5, 'futuro'], [16.5, 'ameaca'], [20.0, 'chamado'],
];

const ss = THREE.MathUtils.smoothstep;
const lerp = THREE.MathUtils.lerp;

function cenaEm(t) {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
}

// ------------------------------------------------------------ Chuva
class Chuva {
  constructor(cena) {
    this.n = 2600;
    this.base = [];
    const rnd = mulberry(99);
    for (let i = 0; i < this.n; i++) this.base.push([(rnd() - 0.5) * 70, rnd() * 30, (rnd() - 0.5) * 70, rnd()]);
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.n * 6);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: '#c9d6e6', transparent: true, opacity: 0 });
    this.linhas = new THREE.LineSegments(this.geo, this.mat);
    this.linhas.frustumCulled = false;
    cena.add(this.linhas);
  }
  atualizar(t, intensidade) {
    this.linhas.visible = intensidade > 0.01;
    this.mat.opacity = 0.55 * intensidade;
    if (!this.linhas.visible) return;
    for (let i = 0; i < this.n; i++) {
      const [x, y0, z, f] = this.base[i];
      const y = 30 - ((30 - y0 + t * (24 + f * 8)) % 30);
      const o = i * 6;
      this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
      this.pos[o + 3] = x + 0.12; this.pos[o + 4] = y + 1.1; this.pos[o + 5] = z;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}

function mulberry(s) {
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function brilhoDoRaio(t) {
  let b = 0;
  for (const r of RAIOS) {
    const d = t - r;
    if (d < 0 || d > 0.6) continue;
    // dois estalos rápidos e um decaimento, como raio de verdade
    b = Math.max(b, Math.exp(-d * 14) + (d > 0.09 ? 0.7 * Math.exp(-(d - 0.09) * 10) : 0));
  }
  return Math.min(1, b);
}

// ------------------------------------------------------------ Montagem
const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(540, 960, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 540 / 960, 0.1, 400);
const cenario = new Cenario(cena);
const arca = new Arca();
cena.add(arca.grupo);
const noe = new Noe();
noe.grupo.position.set(-3.5, 0, 9.5);
noe.grupo.rotation.y = 0.35;
cena.add(noe.grupo);
const ajudantes = new Ajudantes();
cena.add(ajudantes.grupo);
const animais = new Animais();
animais.definir(['elefante', 'girafa', 'leao', 'zebra', 'ovelha'], 5);
cena.add(animais.grupo);
const chuva = new Chuva(cena);

// No trailer, os primeiros ajudantes chegam pertinho do Noé (para caberem no plano).
{
  const rnd = mulberry(5);
  for (let i = 0; i < 40; i++) {
    const ang = Math.PI * (0.05 + rnd() * 0.95) + (i < 14 ? 0 : Math.PI * 0.9 * rnd());
    const raio = 2.2 + (i < 14 ? rnd() * 3 : 3 + rnd() * 5);
    const d = ajudantes.dados[i];
    d.x = -3.5 + Math.cos(ang) * raio * 1.4;
    d.z = 9.5 - Math.sin(ang) * raio;
    d.rotacao = Math.atan2(-3.5 - d.x, 9.5 - d.z);
  }
}

// O ajudante "@VOCÊ": aparece ao lado do Noé, com etiqueta amarela.
const voce = new THREE.Group();
{
  const m = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8 });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 7), m('#ffd23f'));
  corpo.position.y = 0.45;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), m('#f1c27d'));
  cabeca.position.y = 1.05;
  voce.add(corpo, cabeca);
  voce.traverse((o) => { o.castShadow = true; });
  const c = document.createElement('canvas'); c.width = 300; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#ffd23f'; x.beginPath(); x.roundRect(4, 4, 292, 88, 44); x.fill();
  x.fillStyle = '#111'; x.font = '900 54px "DejaVu Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('@VOCÊ', 150, 52);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const rot = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  rot.scale.set(1.5, 0.48, 1); rot.position.y = 1.75; rot.renderOrder = 20;
  voce.add(rot);
  voce.position.set(-1.6, 0, 10.6);
  voce.rotation.y = -0.6;
  voce.visible = false;
  cena.add(voce);
}

const NOE = new THREE.Vector3(-3.5, 0, 9.5);
const CABECA = NOE.clone().add(new THREE.Vector3(0, 2.3, 0));
const ARCA = new THREE.Vector3(0, ALTURA * 0.6, 0);

const $ = (id) => document.getElementById(id);
let cenaAtual = -1;

function entrarNaCena(c) {
  switch (c.nome) {
    case 'gancho':
    case 'sozinho':
    case 'ameaca':
    case 'chamado':
      arca.configurar(0, 0);
      ajudantes.definir(0, 0, []);
      animais.grupo.visible = false;
      break;
    case 'chegada':
      arca.configurar(0, 0);
      ajudantes.definir(14, 0, [], c.inicio + 0.5, 3.0);
      animais.grupo.visible = false;
      break;
    case 'voce':
      arca.configurar(0, 0);
      ajudantes.definir(40, 14, [], c.inicio + 0.1, 2.2);
      animais.grupo.visible = false;
      break;
    case 'futuro':
      arca.configurar(arca.total, arca.total);
      ajudantes.definir(600, 600, []);
      animais.grupo.visible = true;
      break;
  }
}

// Câmera de cada cena: [posição inicial, posição final, alvo inicial, alvo final]
function camera_(c, t) {
  const k = ss(t, c.inicio, c.fim);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let p0, p1, a0, a1;
  switch (c.nome) {
    case 'gancho':  p0 = V(0.5, 1.6, 26); p1 = V(-1.9, 1.9, 15.2); a0 = CABECA.clone().add(V(0, 3, 0)); a1 = CABECA.clone().add(V(0, 0.6, 0)); break;
    case 'sozinho': {
      // close e depois sobe para mostrar o vazio
      const sobe = ss(t, 3.7, 5.0);
      p0 = V(-1.4, 2.5, 14.6); p1 = V(-1.0, 2.6, 14.2);
      const pos = p0.clone().lerp(p1, k).lerp(V(4, 22, 30), sobe);
      const alvo = CABECA.clone().lerp(NOE.clone().add(V(0, 0, -2)), sobe);
      return [pos, alvo];
    }
    case 'chegada': p0 = V(2.5, 6.5, 22); p1 = V(1.5, 5.5, 20); a0 = NOE.clone().add(V(0.5, 0.6, -1)); a1 = NOE.clone().add(V(0.5, 0.8, -1)); break;
    case 'voce':    p0 = V(2.5, 4.2, 20.5); p1 = V(0.8, 3.6, 18.5); a0 = V(-1.6, 1.2, 9.5); a1 = V(-1.8, 1.3, 10); break;
    case 'futuro': {
      const ang = lerp(0.95, 1.35, k);
      return [V(Math.cos(ang) * 36, lerp(20, 12, k), Math.sin(ang) * 36), ARCA.clone().add(V(0, 0, 3))];
    }
    case 'ameaca':  p0 = V(5, 9, 28); p1 = V(-1.2, 2.2, 16); a0 = NOE.clone().add(V(0, 1, -2)); a1 = CABECA; break;
    case 'chamado': p0 = V(-1.6, 2.6, 14.2); p1 = V(-2.2, 2.5, 13.3); a0 = CABECA; a1 = CABECA; break;
  }
  return [p0.clone().lerp(p1, k), a0.clone().lerp(a1, k)];
}

// Clima por cena: 0 = céu limpo, 1 = tempestade. Chuva de 0 a 1.
function clima(c, t) {
  switch (c.nome) {
    case 'gancho': return { tempestade: 1, chuva: 1 };
    case 'sozinho': case 'chegada': case 'voce': return { tempestade: 0, chuva: 0 };
    case 'futuro': return { tempestade: 0.8, chuva: 0 };
    case 'ameaca': { const k = ss(t, c.inicio, c.fim); return { tempestade: lerp(0.2, 1, k), chuva: ss(t, 17.4, 19.5) * 0.9 }; }
    case 'chamado': return { tempestade: 1, chuva: 1 };
  }
  return { tempestade: 0, chuva: 0 };
}

function hud(c, t) {
  // legenda palavra por palavra: a palavra acende quando é falada
  const iFala = FALAS.findIndex(([a, b]) => t >= a && t < b);
  const leg = $('legenda');
  if (iFala >= 0) {
    if (leg.dataset.f !== String(iFala)) {
      leg.innerHTML = TOKENS[iFala].map((tk) => `<span class="p${tk.destaque ? ' em' : ''}">${tk.texto}</span>`).join(' ');
      leg.dataset.f = String(iFala);
    }
    const k = Math.min(1, (t - FALAS[iFala][0]) / 0.18);
    leg.style.opacity = '1';
    leg.style.transform = `scale(${0.85 + 0.15 * (1 - Math.pow(1 - k, 3))})`;
    leg.querySelectorAll('.p').forEach((el, j) => {
      const dt = t - TOKENS[iFala][j].t;
      const dita = dt >= -0.02;
      el.style.opacity = dita ? '1' : '0.38';
      el.style.transform = dita && dt < 0.16 ? `scale(${1 + 0.18 * Math.sin((dt / 0.16) * Math.PI)})` : 'none';
    });
  } else leg.style.opacity = '0';

  // etiqueta do topo
  const et = $('etiqueta');
  let ajud = 0;
  if (c.nome === 'chegada') ajud = Math.round(14 * ss(t, c.inicio + 0.5, c.inicio + 3.5));
  if (c.nome === 'voce') ajud = Math.round(lerp(14, 40, ss(t, c.inicio + 0.1, c.inicio + 2.3)));
  if (c.nome === 'futuro') { et.textContent = 'DIA ??? · 10.000 AJUDANTES'; et.className = ''; }
  else if (c.nome === 'ameaca' || c.nome === 'chamado' || c.nome === 'gancho') { et.textContent = '⚠️ DIA 1 · 0 AJUDANTES'; et.className = 'alerta'; }
  else { et.textContent = `DIA 1 · ${ajud} ${ajud === 1 ? 'AJUDANTE' : 'AJUDANTES'}`; et.className = ''; }
  $('topo').style.opacity = c.nome === 'chamado' ? String(1 - ss(t, 20, 20.4)) : '1';

  // contador "+N" durante a chegada
  const cont = $('contador');
  if (c.nome === 'chegada' || c.nome === 'voce') {
    cont.style.opacity = String(ss(t, 5.5, 5.8));
    cont.textContent = `+${Math.max(1, ajud)}`;
  } else cont.style.opacity = '0';

  // cartão de seguir no final
  const card = $('cartao');
  const kc = ss(t, 20.25, 20.6);
  const toque = t > 21.4 ? 1 : 0;
  card.style.transform = `translateX(-50%) scale(${kc * (1 + Math.sin(Math.min(1, (t - 20.25) / 0.35) * Math.PI) * 0.08)})`;
  card.querySelector('.botao').textContent = toque ? 'Seguindo ✓' : 'Seguir';
  card.querySelector('.botao').style.background = toque ? '#efefef' : '#0095f6';
  card.querySelector('.botao').style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, 20.7, 20.9) * (1 - ss(t, 22.2, 22.5)));
  const kcur = ss(t, 20.8, 21.35);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > 21.35 && t < 21.55 ? 0.85 : 1})`;
}

function renderizarEm(t) {
  const c = cenaEm(t);
  if (c.indice !== cenaAtual) { cenaAtual = c.indice; entrarNaCena(c); }

  const { tempestade, chuva: intensidadeChuva } = clima(c, t);
  cenario.definirClima(tempestade);
  const raio = tempestade > 0.5 ? brilhoDoRaio(t) : 0;
  cenario.hemisferica.intensity += raio * 2.5;
  $('flash').style.opacity = String(raio * 0.75);

  // "@VOCÊ" cai do céu em 9,3 s e fica martelando
  voce.visible = c.nome === 'voce';
  if (voce.visible) {
    const k = Math.min(1, Math.max(0, (t - 9.3) / 0.45));
    voce.position.y = (1 - k * k) * 7 + (k >= 1 ? Math.abs(Math.sin(t * 5)) * 0.12 : 0);
    voce.scale.setScalar(Math.max(0.001, k));
  }
  $('escuro').style.opacity = String(ss(tempestade, 0.3, 1) * 0.62 * (1 - raio * 0.8));
  renderer.toneMappingExposure = 1 - ss(tempestade, 0.3, 1) * 0.3;

  arca.atualizar(t);
  noe.atualizar(t);
  // Noé "falando": balança a cabeça/corpo quando há fala
  const falando = PALAVRAS.length ? PALAVRAS.some((w) => t >= w.t && t < w.fim + 0.05) : FALAS.some(([a, b]) => t >= a && t < b);
  noe.grupo.rotation.y = 0.35 + (falando ? Math.sin(t * 7) * 0.05 : 0);
  ajudantes.atualizar(t);
  animais.atualizar(t);
  cenario.atualizar(t);
  chuva.atualizar(t, intensidadeChuva);

  const [pos, alvo] = camera_(c, t);
  // tremida de câmera nos raios e no impacto do futuro
  const tremor = raio * 0.25 + (c.nome === 'futuro' ? Math.exp(-(t - 12.5) * 4) * 0.5 : 0);
  pos.x += Math.sin(t * 61) * tremor; pos.y += Math.cos(t * 47) * tremor;
  camera.position.copy(pos);
  camera.lookAt(alvo);

  hud(c, t);
  renderer.render(cena, camera);
}

window.__duracao = DURACAO;
window.__renderizarEm = renderizarEm;
renderizarEm(0);
window.__pronto = true;

if (!new URLSearchParams(location.search).has('gravando')) {
  const t0 = performance.now();
  renderer.setAnimationLoop(() => renderizarEm(((performance.now() - t0) / 1000) % DURACAO));
}
