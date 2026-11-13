// Avulso "Noé responde comentários #1". Tudo é função do tempo t.
// Tempos em js/responde1-tempos.js · Roteiro em docs/roteiro-responde-1.md
import * as THREE from 'three';
import { Arca, COMPRIMENTO, baseY, meiaLargura } from './arca.js';
import { Noe, Vizinho, Ajudantes, criarAnimal, criarCupim, criarTardigrado, TIPOS_DE_ANIMAIS } from './personagens.js';
import { Cenario } from './cenario.js';
import { etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V } from './efeitos.js';
import { DURACAO, FALAS, VOZES, CENAS, MARCOS, COMENTARIOS } from './responde1-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/responde1-palavras.json', { cache: 'no-store' });
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

// ------------------------------------------------------------ Montagem (a obra como ficou no vídeo 04)
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
arca.configurar(10, 10);
cena.add(arca.grupo);
const legendas = new Legendas($('legenda'), FALAS, PALAVRAS);

const N = V(-1, 0, 12.1);
const CABECA = N.clone().add(V(0, 2.15, 0));
const noe = new Noe();
noe.cajado.visible = false;
cena.add(noe.grupo);

const ajudantes = new Ajudantes();
ajudantes.definir(378, 378, []);
ajudantes.dados.forEach((d, i) => {
  if (d.x > -6 && d.x < 16 && d.z > 9.6 && d.z < 24) {
    const r = Math.sin(i * 12.9898) * 0.5 + 0.5;
    d.x = d.x < 5 ? -6.5 - r * 4 : 16.5 + r * 4;
    d.rotacao = Math.atan2(-d.x, -d.z);
  }
});
cena.add(ajudantes.grupo);

// ------------------------------------------------------------ Pergaminho (o cupim rói o canto no final)
const pergCanvas = document.createElement('canvas');
pergCanvas.width = 256; pergCanvas.height = 320;
const pergTex = new THREE.CanvasTexture(pergCanvas);
pergTex.colorSpace = THREE.SRGBColorSpace;
let pergMordida = -1;
function desenharPergaminho(mordida) {
  const m = Math.round(mordida * 4) / 4;
  if (m === pergMordida) return;
  pergMordida = m;
  const ctx = pergCanvas.getContext('2d');
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, 256, 320);
  ctx.fillStyle = '#f0dfb4'; ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 250, 314);
  ctx.fillStyle = '#7a5530';
  for (let i = 0; i < 9; i++) ctx.fillRect(28, 40 + i * 30, 120 + ((i * 53) % 80), 7);
  if (m > 0) { // mordidas em semicírculo no canto de cima
    ctx.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < Math.ceil(m * 4); k++) { ctx.beginPath(); ctx.arc(256 - k * 34, 0, 26, 0, Math.PI * 2); ctx.fill(); }
  }
  pergTex.needsUpdate = true;
}
desenharPergaminho(0);
const pergaminho = new THREE.Group();
{
  const folha = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.78), new THREE.MeshStandardMaterial({ map: pergTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
  pergaminho.add(folha);
  for (const y of [0.4, -0.4]) {
    const rolo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), madeira('#8a5a2b'));
    rolo.rotation.z = Math.PI / 2;
    rolo.position.y = y;
    pergaminho.add(rolo);
  }
  pergaminho.position.set(0, 1.02, 0.62);
  pergaminho.rotation.x = -0.25;
  noe.grupo.add(pergaminho); // anda junto com o Noé (escala dele: 1.25)
  pergaminho.scale.setScalar(0.8);
}

// ------------------------------------------------------------ Placa "PROIBIDO CUPIM" e o cupim (estrela do canal)
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
  const lados = madeira('#c98a45');
  const tabua = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.74, 0.06), [lados, lados, lados, lados, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }), lados]);
  tabua.position.y = 1.35;
  const poste = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), madeira('#6b4423'));
  poste.position.set(0, 0.6, -0.09);
  placa.add(tabua, poste);
  placa.position.copy(PLACA);
  placa.rotation.y = 0.25;
  cena.add(sombrear(placa));
}
const cupim = criarCupim();
cupim.scale.setScalar(1.4);
cena.add(cupim);
const rotuloCupim = etiqueta3D('🐜 O CUPIM', { fundo: '#c62828', cor: '#fff', altura: 0.34, fonte: 44 });
cena.add(rotuloCupim);

// ------------------------------------------------------------ Lontra (@paolodesouzanunes)
const LONTRA = N.clone().add(V(1.0, 0, 1.7));
const lontra = criarAnimal('lontra', 3);
lontra.rotation.y = YAW_CAMERA + 0.4;
lontra.scale.setScalar(1.3);
cena.add(lontra);
const feixeLontra = new Feixe(cena);
const ondaLontra = new Onda(cena);
const rotuloLontra = etiqueta3D('@paolodesouzanunes 🦦', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloLontra);

// ------------------------------------------------------------ Tardígrado + lupa (@rick.brucee)
const TARD = N.clone().add(V(1.1, 0, 2.6));
const pedra = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), madeira('#8d8a84'));
pedra.scale.set(1.4, 0.45, 1.1);
pedra.position.copy(TARD).add(V(0, 0.06, 0));
cena.add(sombrear(pedra));
const tardigrado = criarTardigrado();
tardigrado.position.copy(TARD).add(V(0, 0.14, 0));
tardigrado.rotation.y = 0.5;
cena.add(tardigrado);
const lupa = new THREE.Group();
{
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 28), new THREE.MeshStandardMaterial({ color: '#2b2b2e', metalness: 0.4, roughness: 0.4 }));
  const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.3, 28), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 }));
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.5, 8), madeira('#6b4423'));
  cabo.position.set(0.28, -0.42, 0);
  cabo.rotation.z = 0.6;
  lupa.add(aro, vidro, cabo);
  cena.add(lupa);
}
const rotuloTard = etiqueta3D('@rick.brucee 🔬', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloTard);

// ------------------------------------------------------------ Camaleão na costela (@kaio_kainan_)
const xsCostelas = [];
for (let i = 1; i <= 11; i++) xsCostelas.push(-COMPRIMENTO / 2 + COMPRIMENTO * (i / 12));
xsCostelas.sort((a, b) => Math.abs(a) - Math.abs(b));
const XC = xsCostelas.find((x) => x > 0); // costela da direita, perto do centro
const CAM_Y = 1.7;
const CAMA = V(XC + 0.18, baseY(XC) + CAM_Y, meiaLargura(XC, CAM_Y) + 0.12);
const camaleao = criarAnimal('camaleao', 4);
camaleao.position.copy(CAMA);
camaleao.rotation.set(0, YAW_CAMERA, Math.PI / 2 - 0.3); // agarrado na costela, de cabeça para cima
const materiaisCamaleao = [];
camaleao.traverse((o) => {
  if (!o.isMesh) return;
  o.material = o.material.clone();
  o.material.transparent = true;
  o.userData.corOriginal = o.material.color.clone();
  materiaisCamaleao.push(o);
});
cena.add(camaleao);
const COR_MADEIRA = new THREE.Color('#6b4423');
const rotuloCamaleao = etiqueta3D('@kaio_kainan_ 🦎', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloCamaleao);

// ------------------------------------------------------------ Golira (@breno_gx_077)
const GOL = N.clone().add(V(2.3, 0, 0.5));
const golira = criarAnimal('gorila', 5);
golira.rotation.y = YAW_CAMERA + 0.35;
cena.add(golira);
const feixeGolira = new Feixe(cena);
const ondaGolira = new Onda(cena);
const poeiraGolira = new Explosao(cena, { n: 90, cor: '#e8c58a', tamanho: 0.15, velocidade: 4, subida: 2.5, dur: 1.0, semente: 9 });
const rotuloGolira = etiqueta3D('@breno_gx_077 🦍', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloGolira);

// ------------------------------------------------------------ Pica-pau, o 1º lugar (@073_r4fael)
const XP = xsCostelas.find((x) => x < 0);
const PIC_Y = 2.3;
const PIC = V(XP + 0.12, baseY(XP) + PIC_Y, meiaLargura(XP, PIC_Y) + 0.1);
const picapau = criarAnimal('picapau', 2);
picapau.position.copy(PIC).add(V(0.28, -0.35, 0));
picapau.rotation.y = Math.PI; // de perfil para a câmera, bicando a costela
picapau.scale.setScalar(0.95);
cena.add(picapau);
const lascas = new Explosao(cena, { n: 18, cor: '#e7c08a', tamanho: 0.07, velocidade: 1.6, subida: 2.4, gravidade: 9, dur: 0.45, semente: 77 });
const rotuloPica = etiqueta3D('🥇 1º LUGAR · @073_r4fael', { fundo: '#ffd23f', altura: 0.34, fonte: 44 });
cena.add(rotuloPica);

// ------------------------------------------------------------ Vizinho (roupa roxa exclusiva)
const vizinho = new Vizinho();
cena.add(vizinho.grupo);

// ------------------------------------------------------------ Terror relâmpago (callback do vídeo 04)
const luzTerror = new THREE.PointLight('#ff2a14', 0, 6, 1.6);
luzTerror.position.copy(N).add(V(0.1, 0.9, 1.1));
cena.add(luzTerror);

// ------------------------------------------------------------ Câmera
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  const L = (a, b) => a.clone().lerp(b, k);
  switch (c.nome) {
    case 'abertura': return [L(N.clone().add(V(0.6, 2.0, 5.6)), N.clone().add(V(0.4, 1.95, 4.6))), N.clone().add(V(0, 1.75, 0))];
    case 'lontra': {
      const [t0, t1] = MARCOS.terror;
      const kz = ss(t, t0 - 0.05, t0 + 0.2) * (1 - ss(t, t1 - 0.1, t1 + 0.05));
      const base = N.clone().add(V(0.2, 1.9, 7.3));
      return [base.lerp(N.clone().add(V(0.05, 1.85, 2.9)), kz), N.clone().add(V(0.05, 1.2, 0.6)).lerp(CABECA.clone().add(V(0, -0.15, 0)), kz)];
    }
    case 'tardigrado': return [L(TARD.clone().add(V(0.05, 0.5, 1.6)), TARD.clone().add(V(0.02, 0.42, 1.25))), TARD.clone().add(V(0, 0.22, 0))];
    case 'camaleao': return [L(CAMA.clone().add(V(0.6, 0.15, 2.6)), CAMA.clone().add(V(0.4, 0.1, 2.0))), CAMA.clone()];
    case 'golira': return [L(N.clone().add(V(1.4, 2.0, 7.2)), N.clone().add(V(1.3, 1.9, 6.4))), N.clone().add(V(1.3, 1.35, 0.5))];
    case 'picapau': return [L(PIC.clone().add(V(1.0, 0.5, 6.2)), PIC.clone().add(V(0.8, 0.45, 5.3))), PIC.clone().add(V(0.2, 0.15, 0))];
    case 'insistentes': return [L(N.clone().add(V(0.4, 2.0, 5.0)), N.clone().add(V(0.3, 2.0, 4.4))), N.clone().add(V(0, 1.6, 0))];
    case 'noe': return [L(N.clone().add(V(1.0, 2.0, 5.8)), N.clone().add(V(0.9, 1.95, 5.2))), N.clone().add(V(0.85, 1.55, 0))];
    case 'mosquito': return [L(N.clone().add(V(0.3, 2.1, 4.4)), N.clone().add(V(0.2, 2.1, 3.8))), CABECA.clone().add(V(0, -0.3, 0))];
    case 'final': return [L(N.clone().add(V(0.6, 2.0, 5.0)), N.clone().add(V(0.5, 1.95, 4.3))), N.clone().add(V(0.15, 1.6, 0))];
  }
  return [V(0, 3, 20), V(0, 1, 0)];
}

// ------------------------------------------------------------ Noé
function poseDoNoe(c, t) {
  const n = noe;
  n.corpo.rotation.set(0, 0, 0); n.corpo.position.set(0, 0, 0);
  n.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.16, 0.05, 0.05));
  n.martelo.visible = false;
  // segurando o pergaminho com as duas mãos
  n.bracoDir.rotation.set(-1.15, 0, -0.35); n.bracoEsq.rotation.set(-1.15, 0, 0.35);
  pergaminho.visible = ['abertura', 'insistentes', 'noe', 'final'].includes(c.nome);
  let yaw = 0;
  switch (c.nome) {
    case 'abertura': n.corpo.rotation.x = 0.08; break;
    case 'lontra': {
      pergaminho.visible = false;
      n.bracoDir.rotation.set(0, 0, 0.9); n.bracoEsq.rotation.set(0, 0, -0.9); // mãos na cintura
      const [t0, t1] = MARCOS.terror;
      if (t > t0 && t < t1) { n.corpo.rotation.x = 0.14; n.bracoDir.rotation.set(-1.0, 0, 0.2); n.martelo.visible = true; }
      if (t > t1 + 0.1) { yaw = 0.35; n.bracoDir.rotation.set(-0.3, 0, 2.2); n.corpo.rotation.z = 0.06; } // "pode sim", sem graça
      break;
    }
    case 'golira': yaw = 0.5; n.bracoDir.rotation.set(-1.0, 0, -0.2); n.bracoEsq.rotation.set(-1.3, 0, 0.4); break; // anota no ar
    case 'insistentes': yaw = Math.sin(t * 2.2) * 0.35; break; // olha de um cartão para o outro
    case 'noe':
      if (t > MARCOS.vizinhoEntra) yaw = 0.45;
      if (t < 34.6) { n.bracoDir.rotation.set(-1.35, 0, -1.1); n.bracoEsq.rotation.set(-1.25, 0, 1.1); pergaminho.visible = false; } // braços cruzados
      break;
    case 'mosquito': {
      pergaminho.visible = false;
      const p = MARCOS.plaft;
      const d = t - p;
      // segue o zumbido com os olhos, depois PLAFT
      yaw = t < p ? Math.sin(t * 7) * 0.4 : 0;
      if (d > -0.25 && d < 0.5) { const fecha = ss(d, -0.25, 0); n.bracoDir.rotation.set(-1.5, 0, lerp(1.0, -0.25, fecha)); n.bracoEsq.rotation.set(-1.5, 0, lerp(-1.0, 0.25, fecha)); }
      else if (d >= 0.5) { n.bracoDir.rotation.set(0, 0, 0.9); n.bracoEsq.rotation.set(0, 0, -0.9); }
      else { n.bracoDir.rotation.set(-0.3, 0, 0.6); n.bracoEsq.rotation.set(-0.3, 0, -0.6); }
      break;
    }
    case 'final':
      if (t > 43.6 && t < 46.4) { n.bracoDir.rotation.set(-1.5, 0, 0); } // aponta para a câmera
      break;
  }
  n.grupo.position.copy(N);
  n.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ Rótulos com tamanho constante na tela
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

// Queda do céu com "amassadinha" no pouso
function cair(obj, base, pouso, t, dur = 0.6, altura = 8) {
  obj.visible = t > pouso - dur;
  if (!obj.visible) return;
  const k = Math.min(1, (t - (pouso - dur)) / dur);
  obj.position.copy(base).add(V(0, (1 - k * k) * altura, 0));
  const eb = obj.userData.escalaBase ?? (obj.userData.escalaBase = obj.scale.x);
  const amassa = t > pouso && t < pouso + 0.3 ? 1 - Math.sin(((t - pouso) / 0.3) * Math.PI) * 0.18 : 1;
  obj.scale.set(eb * (1 + (1 - amassa) * 0.4), eb * amassa, eb * (1 + (1 - amassa) * 0.4));
}

// ------------------------------------------------------------ HUD
let grupoComentario = -1;
const coresAvatar = ['#e1306c', '#833ab4', '#f77737', '#405de6', '#2e7d32'];
const inicial = (a) => (a[1] === '_' || a[1] === '.' ? a[2] : a[1]).toUpperCase();
function hud(c, t) {
  legendas.atualizar(t);
  const iFala = FALAS.findIndex(([a, b]) => t >= a && t < b);
  const ehVizinho = iFala >= 0 && VOZES[iFala] === 'vizinho';
  $('falante').style.opacity = ehVizinho ? '1' : '0';
  if (ehVizinho) { $('falante').firstElementChild.textContent = 'VIZINHO'; $('falante').firstElementChild.style.background = '#c9a7ff'; }
  $('dia').style.opacity = '0';
  $('titulo').style.opacity = String(ss(t, 0.1, 0.35) * (1 - ss(t, 2.6, 2.9)));
  $('titulo').firstElementChild.style.transform = `scale(${0.8 + 0.2 * ss(t, 0.1, 0.35)}) rotate(-2deg)`;

  // Carimbo "GOLIRA ✅"
  const kc = ss(t, MARCOS.carimboGolira, MARCOS.carimboGolira + 0.2) * (1 - ss(t, 21.6, 21.9));
  $('carimboGolira').style.opacity = String(kc);
  $('carimboGolira').firstElementChild.style.transform = `scale(${t > MARCOS.carimboGolira ? lerp(1.8, 1, Math.min(1, (t - MARCOS.carimboGolira) / 0.2)) : 0}) rotate(-8deg)`;

  // Cartões de comentário
  const iGrupo = COMENTARIOS.findIndex((g) => t >= g.inicio && t < g.fim);
  const caixa = $('comentarios');
  if (iGrupo !== grupoComentario) {
    grupoComentario = iGrupo;
    const g = COMENTARIOS[iGrupo];
    caixa.className = g?.ringue ? 'ringue' : '';
    caixa.innerHTML = iGrupo < 0 ? '' : g.cartoes.map((ct, j) => `
      <div class="comentario"><div class="cabeca">💬 NOS COMENTÁRIOS</div>
        <div class="cartao-texto"><div class="av" style="background:${coresAvatar[(iGrupo + j) % coresAvatar.length]}">${inicial(ct.arroba)}</div>
          <div><div class="arroba">${ct.arroba}</div><div class="txt">${ct.texto}</div></div></div>
        ${ct.selo ? `<div class="selo">${ct.selo}</div>` : ''}</div>`).join('');
  }
  if (iGrupo >= 0) {
    const g = COMENTARIOS[iGrupo];
    caixa.querySelectorAll('.comentario').forEach((el, j) => {
      const sai = ss(t, g.fim - 0.25, g.fim);
      if (g.ringue) { // os dois cartões vêm dos lados e se chocam
        const e = ss(t, g.inicio, MARCOS.colisao);
        const tranco = t > MARCOS.colisao ? Math.exp(-(t - MARCOS.colisao) * 6) * Math.sin((t - MARCOS.colisao) * 40) * 10 : 0;
        el.style.opacity = String(Math.min(1, e * 3) * (1 - sai));
        el.style.transform = `translateX(${(j ? 1 : -1) * (lerp(300, 0, e) + tranco)}px) rotate(${(j ? 3 : -3)}deg)`;
        return;
      }
      const t0 = g.inicio + j * 0.2;
      const e = Math.min(1, Math.max(0, (t - t0) / 0.28));
      const escala = (e < 1 ? 1 - Math.pow(1 - e, 3) + Math.sin(e * Math.PI) * 0.12 : 1) * (1 - sai * 0.3);
      if (g.amassa && t > g.amassa) { // PLAFT: amassados, caem
        const d = t - g.amassa;
        el.style.opacity = String(1 - ss(d, 0.6, 1.0));
        el.style.transform = `translateY(${d * d * 900}px) scale(${lerp(1, 0.55, Math.min(1, d * 6))}, ${lerp(1, 0.35, Math.min(1, d * 6))}) rotate(${(j ? 1 : -1) * d * 160}deg)`;
        el.style.filter = 'brightness(.7) contrast(1.2)';
        return;
      }
      el.style.filter = '';
      el.style.opacity = String(Math.min(1, e * 2) * (1 - sai));
      el.style.transform = `translateY(${-sai * 30}px) scale(${escala}) rotate(${j % 2 ? 2 : -2}deg)`;
    });
  }
  const dc = t - MARCOS.colisao;
  $('pow').style.opacity = dc > 0 && dc < 0.6 ? String(1 - dc / 0.6) : '0';
  $('pow').style.transform = `scale(${dc > 0 ? 0.6 + dc * 1.5 : 0})`;

  // Final: cartão de seguir + recado do #2
  const card = $('cartao');
  const kcard = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35);
  card.style.transform = `translateX(-50%) scale(${kcard * (1 - ss(t, 46.4, 46.7)) * (1 + Math.sin(Math.min(1, Math.max(0, t - MARCOS.cartao) / 0.35) * Math.PI) * 0.08)})`;
  const toque = t > MARCOS.toque;
  const botao = card.querySelector('.botao');
  botao.textContent = toque ? 'Seguindo ✓' : 'Seguir';
  botao.style.background = toque ? '#efefef' : '#0095f6';
  botao.style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, MARCOS.toque - 0.7, MARCOS.toque - 0.5) * (1 - ss(t, MARCOS.toque + 0.7, MARCOS.toque + 1.0)));
  const kcur = ss(t, MARCOS.toque - 0.6, MARCOS.toque - 0.05);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > MARCOS.toque - 0.05 && t < MARCOS.toque + 0.15 ? 0.85 : 1})`;
  $('recado').style.opacity = String(c.nome === 'final' ? ss(t, 43.4, 43.7) : 0);
}

// ------------------------------------------------------------ Quadro
function renderizarEm(t) {
  const c = cenaEm(t);
  cenario.definirClima(0.2);
  cenario.atualizar(t * 3);
  renderer.toneMappingExposure = 1.0;
  $('escuro').style.opacity = '0';

  poseDoNoe(c, t);

  // Terror relâmpago na chantagem
  const [te0, te1] = MARCOS.terror;
  const kt = ss(t, te0, te0 + 0.08) * (1 - ss(t, te1 - 0.08, te1));
  luzTerror.intensity = kt * 14;
  noe.olhos.children.forEach((o) => { o.material.emissive.set('#ff1a0a'); o.material.emissiveIntensity = kt * 2.5; });
  if (kt > 0) { cenario.definirClima(lerp(0.2, 1, kt)); cenario.sol.intensity *= 1 - kt * 0.85; cenario.hemisferica.intensity *= 1 - kt * 0.8; }
  $('terror').style.opacity = String(kt);
  const rel = t > MARCOS.trovao && t < MARCOS.trovao + 0.4 ? Math.exp(-(t - MARCOS.trovao) * 10) : 0;
  $('flash').style.opacity = String(rel * 0.8);

  // Cupim: espia atrás da placa na chantagem; no final rói o pergaminho e acena
  const [ce0, ce1] = MARCOS.cupimEspia;
  const [cm0, cm1] = MARCOS.cupimMorde;
  const espia = ss(t, ce0, ce0 + 0.3) * (1 - ss(t, ce1 - 0.3, ce1));
  let kRotCupim = 0;
  if (c.nome === 'lontra' && espia > 0.01) {
    cupim.visible = true;
    cupim.scale.setScalar(1.4);
    cupim.position.copy(PLACA).add(V(0.5, 1.45 + espia * 0.38, -0.12));
    cupim.rotation.set(0, 0.2, 0);
    kRotCupim = espia;
  } else if (c.nome === 'final' && t > cm0) {
    cupim.visible = true;
    // em cima do pergaminho (posição no mundo, acompanhando o Noé)
    pergaminho.updateWorldMatrix(true, false);
    const topo = V(0.3, 0.47, 0.05).applyMatrix4(pergaminho.matrixWorld); // canto de cima, à direita
    const sobe = ss(t, cm0, cm0 + 0.35);
    cupim.position.copy(topo).add(V(0.12, -0.2 + sobe * 0.22, 0.06));
    cupim.scale.setScalar(1.0);
    cupim.rotation.set(0.15, 0, 0);
    const acena = t > cm1 - 1.3;
    cupim.userData.antenas.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * 0.5 + (acena ? Math.sin(t * 14) * 0.5 : 0); });
    cupim.userData.mandibula.scale.y = acena ? 1 : 1 + Math.abs(Math.sin(t * 22)) * 2; // roendo
    kRotCupim = acena ? ss(t, cm1 - 1.3, cm1 - 1.1) : 0;
  } else cupim.visible = false;
  desenharPergaminho(c.nome === 'final' ? ss(t, cm0 + 0.3, cm1 - 1.4) : 0);
  rotulo(rotuloCupim, kRotCupim, cupim.position.clone().add(V(0, 0.55, 0)));

  // Lontra
  const L0 = MARCOS.lontraCai;
  cair(lontra, LONTRA, L0, t);
  lontra.visible = lontra.visible && c.nome === 'lontra';
  feixeLontra.atualizar(t, LONTRA.x, LONTRA.z, L0);
  ondaLontra.atualizar(t, LONTRA.x, LONTRA.z, L0, 3);
  rotulo(rotuloLontra, c.nome === 'lontra' ? ss(t, L0 + 0.1, L0 + 0.3) : 0, LONTRA.clone().add(V(-0.5, 0.95, 0)));

  // Tardígrado: cresce quando a lupa passa na frente
  const lupaK = c.nome === 'tardigrado' ? ss(t, c.inicio + 0.6, c.inicio + 1.4) : 0;
  lupa.visible = lupaK > 0.01;
  tardigrado.visible = pedra.visible = c.nome === 'tardigrado';
  lupa.position.copy(TARD).add(V(lerp(0.9, 0.02, lupaK), 0.32, 0.55));
  lupa.lookAt(camera.position);
  tardigrado.scale.setScalar(lerp(0.45, 1.25, lupaK));
  tardigrado.rotation.y = 0.5 + Math.sin(t * 2) * 0.3;
  rotulo(rotuloTard, c.nome === 'tardigrado' ? ss(t, c.inicio + 1.4, c.inicio + 1.6) : 0, TARD.clone().add(V(0, 0.78, 0)));

  // Camaleão: cor da madeira, pisca verde e some
  const [p0, p1] = MARCOS.camaleaoPisca;
  const pisca = t > p0 && t < p1 ? 1 : 0;
  const some = ss(t, MARCOS.camaleaoSome[0], MARCOS.camaleaoSome[1]);
  camaleao.visible = c.nome === 'camaleao';
  for (const m of materiaisCamaleao) {
    m.material.color.copy(m.userData.corOriginal).lerp(COR_MADEIRA, pisca ? 0 : 0.85);
    m.material.opacity = 1 - some;
  }
  rotulo(rotuloCamaleao, c.nome === 'camaleao' ? ss(t, p0, p0 + 0.2) * (1 - some) : 0, CAMA.clone().add(V(0, 0.55, 0.1)));

  // Golira: cai do céu e bate no peito
  const G0 = MARCOS.goliraCai;
  cair(golira, GOL, G0, t, 0.7, 9);
  golira.visible = golira.visible && c.nome === 'golira';
  feixeGolira.atualizar(t, GOL.x, GOL.z, G0);
  ondaGolira.atualizar(t, GOL.x, GOL.z, G0, 4);
  poeiraGolira.atualizar(t, GOL.clone().add(V(0, 0.2, 0)), G0);
  const [pe0, pe1] = MARCOS.peito;
  const [bracoA, bracoB] = golira.userData.pernas;
  if (t > pe0 && t < pe1 && c.nome === 'golira') {
    const batida = Math.sin((t - pe0) * 16);
    bracoA.rotation.set(0, 0, 0.12 + 1.6 + batida * 0.3); bracoA.rotation.x = 0.9;
    bracoB.rotation.set(0, 0, 0.12 + 1.6 - batida * 0.3); bracoB.rotation.x = -0.9;
  } else { bracoA.rotation.set(0, 0, 0.12); bracoB.rotation.set(0, 0, 0.12); }
  rotulo(rotuloGolira, c.nome === 'golira' ? ss(t, G0 + 0.1, G0 + 0.3) : 0, GOL.clone().add(V(0, 2.55, 0)));

  // Pica-pau bicando sem parar
  picapau.rotation.z = 0;
  if (c.nome === 'picapau') {
    picapau.rotation.z = -0.15 - Math.abs(Math.sin(t * Math.PI * 11)) * 0.75;
    const periodo = 0.27;
    lascas.atualizar(t, PIC.clone().add(V(-0.1, -0.2, 0.05)), Math.floor(t / periodo) * periodo);
  } else lascas.atualizar(t, V(), -99);
  rotulo(rotuloPica, c.nome === 'picapau' ? ss(t, c.inicio + 0.4, c.inicio + 0.6) : 0, PIC.clone().add(V(0, 0.75, 0.1)));

  // Vizinho: chega ajeitando o chapéu
  const v = vizinho;
  v.neutro();
  v.grupo.visible = c.nome === 'noe' && t > MARCOS.vizinhoEntra - 0.8;
  if (v.grupo.visible) {
    const k = ss(t, MARCOS.vizinhoEntra - 0.8, MARCOS.vizinhoEntra);
    const pos = N.clone().add(V(lerp(5, 1.75, k), 0, 0.3));
    let yaw = -Math.PI / 2;
    if (k < 1) v.andar(t, 9);
    else { yaw = -0.35; v.bracoDir.rotation.set(-0.3, 0, 2.6 + Math.sin(t * 6) * 0.15); v.chapeu.rotation.z = 0.12 + Math.sin(t * 6) * 0.06; }
    v.grupo.position.copy(pos);
    v.grupo.rotation.y = yaw;
  }

  arca.atualizar(t);
  ajudantes.atualizar(t);

  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  const tremor = impacto(G0, 0.15, 6) + impacto(MARCOS.trovao, 0.1, 5) + impacto(MARCOS.plaft, 0.06, 9);
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
