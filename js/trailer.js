// Trailer do vídeo 01 ("O dilúvio está vindo"). Tudo é função do tempo t,
// então o gravador pode renderizar quadro a quadro com resultado idêntico.
// Tempos em js/trailer-tempos.js · Roteiro em docs/roteiro-video-01.md
import * as THREE from 'three';
import { Arca, ALTURA, LARGURA } from './arca.js';
import { Noe, Ajudantes, Animais, criarAnimal } from './personagens.js';
import { Cenario } from './cenario.js';
import { DURACAO, FALAS, CENAS, RAIOS, MARCOS, sincronizarComPalavras } from './trailer-tempos.js';

// Tempos de cada palavra, vindos da transcrição da narração (scripts/narracao.mjs).
// Sem o arquivo, cada palavra recebe um tempo proporcional dentro da frase.
let PALAVRAS = [];
try {
  const r = await fetch('audio/narracao-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }
sincronizarComPalavras(PALAVRAS);

const TOKENS = FALAS.map(([ini, fim, texto]) => {
  const tokens = texto.split(' ').map((tk) => ({ texto: tk.replaceAll('*', ''), destaque: tk.includes('*') }));
  const faladas = PALAVRAS.filter((w) => w.t >= ini - 0.15 && w.t < fim);
  tokens.forEach((tk, k) => {
    tk.t = faladas.length === tokens.length ? faladas[k].t : ini + ((fim - ini - 0.4) * k) / tokens.length;
  });
  return tokens;
});

const ss = THREE.MathUtils.smoothstep;
const lerp = THREE.MathUtils.lerp;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function cenaEm(t) {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
}

function mulberry(s) {
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ------------------------------------------------------------ Chuva
class Chuva {
  constructor(cena) {
    this.n = 3200;
    this.base = [];
    const rnd = mulberry(99);
    for (let i = 0; i < this.n; i++) this.base.push([(rnd() - 0.5) * 90, rnd() * 34, (rnd() - 0.5) * 90, rnd()]);
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
      const y = 34 - ((34 - y0 + t * (24 + f * 8)) % 34);
      const o = i * 6;
      this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
      this.pos[o + 3] = x + 0.12; this.pos[o + 4] = y + 1.1; this.pos[o + 5] = z;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
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

function etiqueta3D(texto, fundo, cor, largura = 300) {
  const c = document.createElement('canvas'); c.width = largura; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = fundo; x.beginPath(); x.roundRect(4, 4, largura - 8, 88, 44); x.fill();
  x.fillStyle = cor; x.font = '900 50px "DejaVu Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(texto, largura / 2, 52);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  s.scale.set((largura / 96) * 0.48, 0.48, 1); s.renderOrder = 20;
  return s;
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
const camera = new THREE.PerspectiveCamera(50, 540 / 960, 0.1, 500);
const cenario = new Cenario(cena);
const arca = new Arca();
cena.add(arca.grupo);
const noe = new Noe();
const NOE = V(-3.5, 0, 9.5);
noe.grupo.position.copy(NOE);
noe.grupo.rotation.y = 0.35;
cena.add(noe.grupo);
const ajudantes = new Ajudantes();
cena.add(ajudantes.grupo);
const animais = new Animais();
cena.add(animais.grupo);
const chuva = new Chuva(cena);

const CABECA = NOE.clone().add(V(0, 2.3, 0));
const ARCA = V(0, ALTURA * 0.55, 0);

// No trailer, os primeiros ajudantes chegam pertinho do Noé (para caberem no plano).
{
  const rnd = mulberry(5);
  for (let i = 0; i < 40; i++) {
    const ang = Math.PI * (0.05 + rnd() * 0.95) + (i < 14 ? 0 : Math.PI * 0.9 * rnd());
    const raio = 2.2 + (i < 14 ? rnd() * 3 : 3 + rnd() * 5);
    const d = ajudantes.dados[i];
    d.x = NOE.x + Math.cos(ang) * raio * 1.4;
    d.z = Math.max(LARGURA / 2 + 1, NOE.z - Math.sin(ang) * raio);
    d.rotacao = Math.atan2(NOE.x - d.x, NOE.z - d.z);
  }
}

// O ajudante "@VOCÊ": cai ao lado do Noé, ganha o bilhete e uma girafa.
const POS_VOCE = V(-1.4, 0, 10.8);
const voce = new THREE.Group();
const bilhete = etiqueta3D('🎟️ VAGA GARANTIDA', '#2e7d32', '#fff', 620);
{
  const m = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8 });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 7), m('#ffd23f'));
  corpo.position.y = 0.45;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), m('#f1c27d'));
  cabeca.position.y = 1.05;
  voce.add(corpo, cabeca);
  voce.traverse((o) => { o.castShadow = true; });
  const rot = etiqueta3D('@VOCÊ', '#ffd23f', '#111');
  rot.position.y = 1.75;
  voce.add(rot);
  bilhete.position.set(0.75, 2.45, 0);
  voce.add(bilhete);
  voce.position.copy(POS_VOCE);
  voce.rotation.y = -0.6;
  voce.visible = false;
  cena.add(voce);
}
const girafa = criarAnimal('girafa', 77);
girafa.scale.setScalar(0.8);
cena.add(girafa);

const $ = (id) => document.getElementById(id);
let cenaAtual = -1;
const TIPOS_FILA = ['elefante', 'girafa', 'leao', 'zebra', 'ovelha', 'cavalo', 'urso'];

function entrarNaCena(c) {
  animais.grupo.visible = false;
  switch (c.nome) {
    case 'gancho': case 'sozinho': case 'ameaca': case 'chamado':
      arca.configurar(0, 0);
      ajudantes.definir(0, 0, []);
      break;
    case 'chegada':
      arca.configurar(0, 0);
      ajudantes.definir(14, 0, [], c.inicio + 0.5, 3.0);
      break;
    case 'voce':
      arca.configurar(0, 0);
      ajudantes.definir(40, 14, [], c.inicio + 0.1, 2.2);
      break;
    case 'vaga':
      arca.configurar(0, 0);
      ajudantes.definir(40, 40, []);
      break;
    case 'construcao':
      // time-lapse: a arca inteira sobe e a multidão cresce
      arca.configurar(0, arca.total, MARCOS.pecasInicio, MARCOS.pecasDuracao / arca.total);
      ajudantes.definir(600, 40, [], c.inicio, 3.4);
      animais.definir(TIPOS_FILA, 0, MARCOS.animaisInicio, 0.22);
      animais.grupo.visible = true;
      break;
  }
}

// Câmera de cada cena → [posição, alvo]
function camera_(c, t) {
  const k = ss(t, c.inicio, c.fim);
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
    case 'vaga':    p0 = V(0.4, 3.0, 19.2); p1 = V(1.4, 3.1, 19.6); a0 = POS_VOCE.clone().add(V(0.4, 1.7, 0)); a1 = POS_VOCE.clone().add(V(0.8, 1.8, 0)); break;
    case 'construcao': {
      // gira em volta da arca enquanto ela sobe; termina de frente, mostrando o tamanho
      const ang = lerp(0.55, 1.25, k);
      const raio = lerp(42, 58, k);
      return [V(Math.cos(ang) * raio, lerp(9, 20, k), Math.sin(ang) * raio), ARCA.clone().add(V(0, lerp(-1, 1.5, k), 2))];
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
    case 'construcao': return { tempestade: lerp(0.15, 0.75, ss(t, c.inicio, c.fim)), chuva: 0 };
    case 'ameaca': {
      const [c0, c1] = MARCOS.chuvaAmeaca;
      return { tempestade: lerp(0.2, 1, ss(t, c.inicio, c.fim)), chuva: ss(t, c0, c1) * 0.9 };
    }
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
  if (c.nome === 'vaga') ajud = 40;
  if (c.nome === 'construcao') {
    // dias passando rápido... e o final fica em aberto
    const k = ss(t, c.inicio + 0.2, c.fim - 0.7);
    const dia = 2 + Math.floor(Math.pow(k, 1.6) * 97);
    et.textContent = t > c.fim - 0.7 ? '⏩ DIA ???' : `⏩ DIA ${dia}`;
    et.className = '';
  } else if (c.nome === 'ameaca' || c.nome === 'chamado' || c.nome === 'gancho') { et.textContent = '⚠️ DIA 1 · 0 AJUDANTES'; et.className = 'alerta'; }
  else { et.textContent = `DIA 1 · ${ajud} ${ajud === 1 ? 'AJUDANTE' : 'AJUDANTES'}`; et.className = ''; }
  $('topo').style.opacity = c.nome === 'chamado' ? String(1 - ss(t, c.inicio, c.inicio + 0.4)) : '1';

  // contador "+N" durante a chegada
  const cont = $('contador');
  if (c.nome === 'chegada' || c.nome === 'voce') {
    cont.style.opacity = String(ss(t, 5.5, 5.8));
    cont.textContent = `+${Math.max(1, ajud)}`;
  } else cont.style.opacity = '0';

  // cartão de seguir no final (com a foto do perfil)
  const card = $('cartao');
  const kc = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35);
  const toque = t > MARCOS.toque ? 1 : 0;
  card.style.transform = `translateX(-50%) scale(${kc * (1 + Math.sin(Math.min(1, Math.max(0, t - MARCOS.cartao) / 0.35) * Math.PI) * 0.08)})`;
  const botao = card.querySelector('.botao');
  botao.textContent = toque ? 'Seguindo ✓' : 'Seguir';
  botao.style.background = toque ? '#efefef' : '#0095f6';
  botao.style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, MARCOS.toque - 0.7, MARCOS.toque - 0.5) * (1 - ss(t, MARCOS.toque + 0.8, MARCOS.toque + 1.1)));
  const kcur = ss(t, MARCOS.toque - 0.6, MARCOS.toque - 0.05);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > MARCOS.toque - 0.05 && t < MARCOS.toque + 0.15 ? 0.85 : 1})`;
}

function renderizarEm(t) {
  const c = cenaEm(t);
  if (c.indice !== cenaAtual) { cenaAtual = c.indice; entrarNaCena(c); }

  const { tempestade, chuva: intensidadeChuva } = clima(c, t);
  cenario.definirClima(tempestade);
  const raio = tempestade > 0.5 ? brilhoDoRaio(t) : 0;
  cenario.hemisferica.intensity += raio * 2.5;
  $('flash').style.opacity = String(raio * 0.75);
  $('escuro').style.opacity = String(ss(tempestade, 0.3, 1) * 0.62 * (1 - raio * 0.8));
  renderer.toneMappingExposure = 1 - ss(tempestade, 0.3, 1) * 0.3;

  // "@VOCÊ" cai do céu e fica martelando; na cena da vaga ganha o bilhete
  voce.visible = c.nome === 'voce' || c.nome === 'vaga';
  if (voce.visible) {
    const k = Math.min(1, Math.max(0, (t - (MARCOS.vocePousa - 0.45)) / 0.45));
    voce.position.y = (1 - k * k) * 7 + (k >= 1 ? Math.abs(Math.sin(t * 5)) * 0.12 : 0);
    voce.scale.setScalar(Math.max(0.001, k));
    const kb = ss(t, MARCOS.bilhete, MARCOS.bilhete + 0.25);
    bilhete.visible = kb > 0;
    const pulso = 1 + Math.sin(Math.min(1, kb) * Math.PI) * 0.15;
    bilhete.scale.set(2.6 * kb * pulso, 0.4 * kb * pulso, 1);
  }
  // A girafa entra andando pela direita e para ao lado do @VOCÊ
  girafa.visible = c.nome === 'vaga';
  if (girafa.visible) {
    const kg = ss(t, MARCOS.animal - 1.7, MARCOS.animal);
    girafa.position.set(lerp(7, POS_VOCE.x + 2.1, kg), 0, POS_VOCE.z - 0.9);
    girafa.rotation.y = Math.PI; // olhando para a esquerda (para o @VOCÊ)
    const passo = kg < 1 ? Math.sin(t * 9) : 0;
    girafa.userData.pernas.forEach((p, i) => { p.rotation.z = (i % 2 ? 1 : -1) * passo * 0.3; });
  }

  arca.atualizar(t);
  noe.atualizar(t);
  // Noé "falando": balança levemente enquanto fala
  const falando = PALAVRAS.length ? PALAVRAS.some((w) => t >= w.t && t < w.fim + 0.05) : FALAS.some(([a, b]) => t >= a && t < b);
  noe.grupo.rotation.y = 0.35 + (falando ? Math.sin(t * 7) * 0.05 : 0);
  ajudantes.atualizar(t);
  animais.atualizar(t);
  cenario.atualizar(t);
  chuva.atualizar(t, intensidadeChuva);

  const [pos, alvo] = camera_(c, t);
  // tremida de câmera nos raios e no impacto do time-lapse
  const tremor = raio * 0.25 + (c.nome === 'construcao' ? Math.exp(-(t - MARCOS.impacto) * 4) * 0.6 : 0);
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
