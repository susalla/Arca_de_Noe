// Avulso "Noé responde comentários #2". Tudo é função do tempo t.
// Tempos em js/responde2-tempos.js · Roteiro em docs/roteiro-responde-2.md
import * as THREE from 'three';
import { Arca } from './arca.js';
import { Noe, Ajudantes, criarAnimal, criarCupim, baterAsas, criarTrex } from './personagens.js';
import { Cenario } from './cenario.js';
import { Chuva, etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V, mulberry } from './efeitos.js';
import { DURACAO, FALAS, CENAS, MARCOS, COMENTARIOS } from './responde2-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/responde2-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }

const $ = (id) => document.getElementById(id);
const cenaEm = (t) => {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
};
const indiceCena = (nome) => CENAS.findIndex((x) => x[1] === nome);
const YAW_CAMERA = -Math.PI / 2; // animais olham para +x; assim olham para a câmera (+z)
const madeira = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, flatShading: true });
const sombrear = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const aditivo = (cor, opacidade) => new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opacidade, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

// ------------------------------------------------------------ Montagem (a obra como ficou no vídeo 06)
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
arca.configurar(19, 19);
cena.add(arca.grupo);
const legendas = new Legendas($('legenda'), FALAS, PALAVRAS);
const chuva = new Chuva(cena, 1600);

const N = V(-1, 0, 12.1);
const noe = new Noe();
noe.cajado.visible = false;
cena.add(noe.grupo);

const ajudantes = new Ajudantes();
ajudantes.definir(600, 600, []);
ajudantes.dados.forEach((d, i) => {
  if (d.x > -8 && d.x < 17 && d.z > 7.2 && d.z < 28) {
    const r = Math.sin(i * 12.9898) * 0.5 + 0.5;
    d.x = d.x < 4 ? -8.5 - r * 5 : 17.5 + r * 5;
    d.rotacao = Math.atan2(-d.x, -d.z);
  }
});
ajudantes.definir(600, 600, []);
cena.add(ajudantes.grupo);

// Arara do @biel.x7_ga no ombro (presa ao Noé)
const arara = criarAnimal('arara', 1);
arara.scale.setScalar(0.72);
arara.position.set(0.42, 1.36, 0.02);
arara.rotation.y = YAW_CAMERA + 0.5;
noe.grupo.add(arara);

// ------------------------------------------------------------ Pergaminho remendado com fita
const pergCanvas = document.createElement('canvas');
pergCanvas.width = 256; pergCanvas.height = 320;
{
  const ctx = pergCanvas.getContext('2d');
  ctx.fillStyle = '#f0dfb4'; ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 250, 314);
  ctx.fillStyle = '#7a5530';
  for (let i = 0; i < 9; i++) ctx.fillRect(28, 40 + i * 30, 120 + ((i * 53) % 80), 7);
  ctx.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(256 - k * 34, 0, 22, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.translate(200, 40); ctx.rotate(-0.6); // fita adesiva por cima da mordida
  ctx.fillStyle = 'rgba(235,235,225,.92)'; ctx.fillRect(-70, -16, 140, 32);
  ctx.strokeStyle = 'rgba(160,160,150,.8)'; ctx.lineWidth = 2; ctx.strokeRect(-70, -16, 140, 32);
  ctx.restore();
}
const pergTex = new THREE.CanvasTexture(pergCanvas);
pergTex.colorSpace = THREE.SRGBColorSpace;
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
  pergaminho.scale.setScalar(0.8);
  noe.grupo.add(pergaminho);
}
// Chinelo na mão do Noé (o do @lazaroluizgabryell)
const chinelo = new THREE.Group();
{
  const sola = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.62).translate(0, 0, 0.25), new THREE.MeshStandardMaterial({ color: '#2f6fd6', roughness: 0.7 }));
  const tira = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 5, 10, Math.PI), new THREE.MeshStandardMaterial({ color: '#f5f5f5' }));
  tira.position.set(0, 0.03, 0.3);
  chinelo.add(sola, tira);
  chinelo.position.set(0, -0.62, 0.05);
  noe.bracoDir.add(chinelo);
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
const todasEtiquetas = [];
const etiqueta = (texto, fundo = '#ffd23f', cor = '#111') => { const e = etiqueta3D(texto, { fundo, cor, altura: 0.34, fonte: 44 }); cena.add(e); todasEtiquetas.push(e); return e; };
const tora = (comp = 1.4, raio = 0.16) => sombrear(new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, comp, 7), madeira('#a8682f')));

// ------------------------------------------------------------ Unicórnio versão obra (@isaias10987654321)
const cavalo = criarAnimal('cavalo', 2);
cavalo.scale.setScalar(1.15);
{
  const cone = new THREE.Group();
  const corpoCone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 12), new THREE.MeshStandardMaterial({ color: '#ff7a1a', roughness: 0.6 }));
  const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.08, 12), new THREE.MeshStandardMaterial({ color: '#ffffff' }));
  faixa.position.y = 0.02;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.28), new THREE.MeshStandardMaterial({ color: '#ff7a1a' }));
  base.position.y = -0.25;
  const elastico = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 4, 14), new THREE.MeshStandardMaterial({ color: '#222' }));
  elastico.rotation.x = Math.PI / 2;
  elastico.position.y = -0.3;
  cone.add(corpoCone, faixa, base, elastico);
  cone.position.set(0.95, 2.48, 0);
  cone.rotation.z = -0.45;
  cavalo.add(sombrear(cone));
}
cena.add(cavalo);
const rotuloCavalo = etiqueta('🦄 @isaias10987654321');

// ------------------------------------------------------------ Sobrinho (@_leomaltauro)
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
    pivo.add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.5, 6).translate(0, -0.25, 0), madeira(roupa)));
    pivo.rotation.z = l * 0.25;
    g.add(pivo);
    return pivo;
  });
  g.userData.bracos = bracos;
  g.scale.setScalar(escala);
  return sombrear(g);
}
const SOBR = N.clone().add(V(1.5, 0, 0.6));
const sobrinho = criarPessoa('#2e86c1', '#e0ac69');
cena.add(sobrinho);
const feixeSobrinho = new Feixe(cena);
const ondaSobrinho = new Onda(cena);
const rotuloSobrinho = etiqueta('@_leomaltauro · SOBRINHO 🔨');

// ------------------------------------------------------------ Orangotango comendo morango (@gabba_gubi)
const ORANGO = N.clone().add(V(1.9, 0, 0.9));
const orangotango = criarAnimal('orangotango', 1);
cena.add(orangotango);
const toraOrango = tora(1.6, 0.22);
toraOrango.rotation.x = Math.PI / 2;
toraOrango.position.copy(ORANGO).add(V(0, 0.22, 0));
cena.add(toraOrango);
const morango = new THREE.Group();
{
  const fruta = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshStandardMaterial({ color: '#e0242c', roughness: 0.5 }));
  fruta.scale.set(1, 1.25, 1);
  for (let k = 0; k < 14; k++) { // sementinhas
    const a = k * 2.4, y = -0.12 + (k / 14) * 0.26;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 3), new THREE.MeshStandardMaterial({ color: '#ffe066' }));
    const r = Math.sqrt(Math.max(0, 1 - (y / 0.21) ** 2)) * 0.17;
    s.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    fruta.add(s);
  }
  const folhas = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.08, 6), new THREE.MeshStandardMaterial({ color: '#2e9d3a' }));
  folhas.position.y = 0.22;
  folhas.rotation.x = Math.PI;
  morango.add(fruta, folhas);
  morango.userData.fruta = fruta;
  morango.scale.setScalar(1.8);
  morango.position.set(0.72, 1.32, 0);
  orangotango.add(morango);
}
const migalhas = new Explosao(cena, { n: 40, cor: '#e0242c', tamanho: 0.06, velocidade: 1.5, subida: 1.5, dur: 0.6, semente: 12 });
const rotuloOrango = etiqueta('🦧🍓 @gabba_gubi');

// ------------------------------------------------------------ Balança-rabo-leitoso no dedo (@arthuralbuquerquedeandrade)
const passarinho = criarAnimal('balancarabo', 4);
passarinho.scale.setScalar(0.6);
cena.add(passarinho);
const lupa = new THREE.Group();
{
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 28), new THREE.MeshStandardMaterial({ color: '#2b2b2b', metalness: 0.5, roughness: 0.4 }));
  const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.155, 28), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.16, roughness: 0.05, side: THREE.DoubleSide }));
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.32, 8), madeira('#5a3a1d'));
  cabo.position.set(0.15, -0.26, 0);
  cabo.rotation.z = 0.55;
  lupa.add(aro, vidro, cabo);
  cena.add(lupa);
}
const rotuloPassarinho = etiqueta('🐦 @arthuralbuquerquedeandrade');

// ------------------------------------------------------------ Barata gamer (@rese.rvagb57)
const BARATA = N.clone().add(V(1.3, 0, 1.6));
const barata = new THREE.Group();
const pernasBarata = [];
const antenasBarata = [];
{
  const casca = new THREE.MeshStandardMaterial({ color: '#5a2e14', roughness: 0.35, metalness: 0.1 });
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), casca);
  corpo.scale.set(1, 0.38, 1.6);
  corpo.position.y = 0.16;
  const listra = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.85), madeira('#3a1d0c'));
  listra.position.set(0, 0.28, -0.05);
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), madeira('#4a2510'));
  cabeca.position.set(0, 0.2, 0.5);
  barata.add(corpo, listra, cabeca);
  for (const l of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshStandardMaterial({ color: '#fff' }));
    olho.position.set(l * 0.07, 0.27, 0.6);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), new THREE.MeshStandardMaterial({ color: '#111' }));
    pupila.position.set(l * 0.07, 0.27, 0.635);
    barata.add(olho, pupila);
    const piv = new THREE.Group();
    piv.position.set(l * 0.05, 0.3, 0.58);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.7, 4).translate(0, 0.35, 0), madeira('#3a1d0c'));
    piv.add(ant);
    piv.rotation.set(0.9, 0, l * 0.4);
    barata.add(piv);
    antenasBarata.push(piv);
    for (let k = 0; k < 3; k++) {
      const pv = new THREE.Group();
      pv.position.set(l * 0.22, 0.12, -0.2 + k * 0.2);
      const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 4).translate(0, -0.16, 0), madeira('#3a1d0c'));
      pv.add(perna);
      pv.rotation.z = -l * 1.0;
      barata.add(pv);
      pernasBarata.push(pv);
    }
  }
  // fone de ouvido e a telinha do jogo
  const arco = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: '#111' }));
  arco.position.set(0, 0.22, 0.5);
  arco.rotation.y = Math.PI / 2;
  arco.rotation.x = 0;
  barata.add(arco);
  for (const l of [-1, 1]) {
    const concha = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), new THREE.MeshStandardMaterial({ color: '#e53935', emissive: '#7a0000', emissiveIntensity: 0.4 }));
    concha.rotation.z = Math.PI / 2;
    concha.position.set(l * 0.15, 0.22, 0.5);
    barata.add(concha);
  }
  const tela = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.03), new THREE.MeshStandardMaterial({ color: '#0d1b2a', emissive: '#3fb6ff', emissiveIntensity: 1.1 }));
  tela.position.set(0, 0.32, 0.86);
  tela.rotation.x = -0.4;
  barata.add(tela);
  barata.userData.tela = tela;
  barata.scale.setScalar(1.4);
  cena.add(sombrear(barata));
}
const luzTela = new THREE.PointLight('#3fb6ff', 0, 3, 2);
cena.add(luzTela);
const rotuloBarata = etiqueta('🪳🎮 @rese.rvagb57');

// ------------------------------------------------------------ Disco voador com 100 madeiras (@vcasaril)
const NAVE_ALVO = N.clone().add(V(4.2, 0, -1.2));
const nave = new THREE.Group();
const luzesNave = [];
{
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.45, 32), new THREE.MeshStandardMaterial({ color: '#b8c0c8', metalness: 0.8, roughness: 0.25 }));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.8, 0.35, 24), new THREE.MeshStandardMaterial({ color: '#7d868f', metalness: 0.8, roughness: 0.3 }));
  base.position.y = -0.38;
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7fe9ff', transparent: true, opacity: 0.55, roughness: 0.1, emissive: '#1a6f80', emissiveIntensity: 0.4 }));
  cupula.position.y = 0.2;
  nave.add(disco, base, cupula);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffe066' }));
    l.position.set(Math.cos(a) * 2.45, -0.05, Math.sin(a) * 2.45);
    nave.add(l);
    luzesNave.push(l);
  }
  cena.add(nave);
}
const raio = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.2, 1, 24, 1, true), aditivo('#d6ff9a', 0));
cena.add(raio);
const torasRaio = Array.from({ length: 6 }, (_, k) => {
  const tt = tora(2.0, 0.17);
  tt.rotation.z = Math.PI / 2;
  tt.rotation.y = k * 0.5;
  cena.add(tt);
  return tt;
});
const pilhaNova = new THREE.Group();
for (let camada = 0; camada < 3; camada++) for (let i = 0; i < 4 - camada; i++) {
  const tt = tora(2.6, 0.2);
  tt.rotation.z = Math.PI / 2;
  tt.position.set(0, 0.2 + camada * 0.36, (i - (3 - camada) / 2) * 0.42);
  pilhaNova.add(tt);
}
pilhaNova.position.copy(NAVE_ALVO);
cena.add(pilhaNova);
const poeiraToras = new Explosao(cena, { n: 140, cor: '#c9a87a', tamanho: 0.2, velocidade: 4, subida: 2.5, dur: 1.2, semente: 21 });
const trex = criarTrex();
trex.position.set(-15, 0, 3);
trex.rotation.y = -0.3;
trex.scale.setScalar(0.95);
cena.add(trex);
const rotuloNave = etiqueta('🛸 @vcasaril');

// ------------------------------------------------------------ Golira tamanho Golias (@hentony_caldas7)
const GOL = N.clone().add(V(3.4, 0, -1.4));
const golira = criarAnimal('gorila', 5);
golira.rotation.y = YAW_CAMERA + 0.45;
cena.add(golira);
const rotuloGolira = etiqueta('🦍 @hentony_caldas7');

// ------------------------------------------------------------ O basilisco (@rafa.viturin09)
const basilisco = new THREE.Group();
const cabecaBas = new THREE.Group();
const olhosBasMat = new THREE.MeshStandardMaterial({ color: '#ffe14a', emissive: '#ffcc00', emissiveIntensity: 2.2 });
{
  const escama = new THREE.MeshStandardMaterial({ color: '#2f5a2a', roughness: 0.55, flatShading: true });
  const pontos = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    pontos.push(V(Math.sin(u * Math.PI * 1.6) * 2.4, u * 14, Math.cos(u * Math.PI * 1.2) * 1.2 - 1.2));
  }
  const curva = new THREE.CatmullRomCurve3(pontos);
  const corpo = new THREE.Mesh(new THREE.TubeGeometry(curva, 80, 1.15, 10), escama);
  const barriga = new THREE.Mesh(new THREE.TubeGeometry(curva, 80, 1.08, 10), new THREE.MeshStandardMaterial({ color: '#b8b06a', roughness: 0.7, flatShading: true }));
  barriga.position.z = 0.12;
  basilisco.add(corpo, barriga);
  const topo = pontos[pontos.length - 1];
  cabecaBas.position.copy(topo).add(V(0, 0.4, 0.4));
  const cranio = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 2.6), escama);
  cranio.position.z = 0.6;
  const focinho = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.2), escama);
  focinho.position.set(0, -0.15, 2.3);
  cabecaBas.add(cranio, focinho);
  for (const l of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), olhosBasMat);
    olho.position.set(l * 0.62, 0.48, 1.95);
    const pupila = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), new THREE.MeshStandardMaterial({ color: '#111' }));
    pupila.position.set(l * 0.62, 0.48, 2.22);
    const chifre = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 5), new THREE.MeshStandardMaterial({ color: '#d9d2b0' }));
    chifre.position.set(l * 0.6, 0.85, 0.1);
    chifre.rotation.x = -0.6;
    const presa = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 5), new THREE.MeshStandardMaterial({ color: '#f4f1e6' }));
    presa.rotation.x = Math.PI;
    presa.position.set(l * 0.45, -0.65, 2.6);
    cabecaBas.add(olho, pupila, chifre, presa);
  }
  const lingua = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 1.0), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
  lingua.position.set(0, -0.4, 3.2);
  cabecaBas.add(lingua);
  cabecaBas.userData.lingua = lingua;
  basilisco.add(cabecaBas);
  basilisco.position.set(1.5, 0, -6);
  basilisco.scale.setScalar(0.82);
  cena.add(sombrear(basilisco));
}
function cabecaBasMundo() {
  basilisco.updateMatrixWorld(true);
  return cabecaBas.localToWorld(V(0, 0, 1.2));
}
const luzOlhos = new THREE.PointLight('#ffd23f', 0, 40, 1.2);
cena.add(luzOlhos);

// O cupim (vira pedra)
const CUPIM = N.clone().add(V(1.35, 0, 0.9));
const cupim = criarCupim();
cupim.scale.setScalar(1.6);
cena.add(cupim);
const toraCupim = tora(1.2, 0.2);
toraCupim.rotation.z = Math.PI / 2;
toraCupim.position.copy(CUPIM).add(V(0, 0.2, -0.15));
cena.add(toraCupim);
const coresCupim = [];
cupim.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); coresCupim.push([o, o.material.color.clone()]); } });
const PEDRA = new THREE.Color('#8b8b88');
const poeiraPedra = new Explosao(cena, { n: 60, cor: '#b0b0aa', tamanho: 0.07, velocidade: 2, subida: 1.5, dur: 0.8, semente: 31 });
const rotuloCupim = etiqueta('🐜 O CUPIM', '#c62828', '#fff');

// ------------------------------------------------------------ A visão do peixe gigante (@antonio.schnorr)
const peixe = new THREE.Group();
const caudaPeixe = new THREE.Group();
{
  const pele = new THREE.MeshStandardMaterial({ color: '#2f6f8f', roughness: 0.4, metalness: 0.2, flatShading: true });
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), pele);
  corpo.scale.set(4.2, 1.5, 1.0);
  const barriga = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: '#cfe3ea', roughness: 0.5, flatShading: true }));
  barriga.scale.set(3.6, 1.0, 0.9);
  barriga.position.y = -0.55;
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 4), pele);
  dorsal.position.set(-0.4, 1.6, 0);
  dorsal.rotation.z = 0.5;
  const forma = new THREE.Shape();
  forma.moveTo(0, 0); forma.lineTo(-2.2, 1.8); forma.lineTo(-1.5, 0); forma.lineTo(-2.2, -1.8); forma.lineTo(0, 0);
  const nadadeira = new THREE.Mesh(new THREE.ShapeGeometry(forma), new THREE.MeshStandardMaterial({ color: '#245a73', side: THREE.DoubleSide }));
  caudaPeixe.add(nadadeira);
  caudaPeixe.position.x = -3.9;
  for (const l of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff' }));
    olho.position.set(3.2, 0.35, l * 0.62);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: '#111' }));
    pupila.position.set(3.32, 0.35, l * 0.74);
    peixe.add(olho, pupila);
  }
  peixe.add(corpo, barriga, dorsal, caudaPeixe);
  cena.add(peixe);
}
const superficie = new THREE.Mesh(new THREE.PlaneGeometry(300, 300).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
superficie.position.y = 9.5;
cena.add(superficie);
const bolhas = [0, 1, 2].map((k) => new Explosao(cena, { n: 90, cor: '#dff4ff', tamanho: 0.14, velocidade: 1.5, subida: 4, gravidade: -1.5, dur: 2.2, semente: 50 + k }));
const rotuloPeixe = etiqueta('🐟 @antonio.schnorr');

// ------------------------------------------------------------ Câmera
const maoDoNoe = () => { noe.grupo.updateMatrixWorld(true); return noe.bracoDir.localToWorld(V(0, -0.66, 0.05)); };
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  const L = (a, b) => a.clone().lerp(b, k);
  switch (c.nome) {
    case 'abertura': return [L(N.clone().add(V(0.4, 2.1, 5.2)), N.clone().add(V(0.3, 2.0, 4.4))), N.clone().add(V(0.15, 1.6, 0))];
    case 'unicornio': return [L(N.clone().add(V(1.4, 3.0, 8.2)), N.clone().add(V(1.4, 2.9, 7.4))), N.clone().add(V(1.3, 2.3, 0.6))];
    case 'jafe': return [L(N.clone().add(V(0.7, 2.0, 5.6)), N.clone().add(V(0.6, 1.95, 4.9))), N.clone().add(V(0.5, 1.5, 0))];
    case 'orangotango': return [L(ORANGO.clone().add(V(0.4, 1.8, 6.0)), ORANGO.clone().add(V(0.3, 1.7, 5.2))), ORANGO.clone().add(V(-0.3, 1.35, 0))];
    case 'passarinho': {
      const m = maoDoNoe();
      return [m.clone().add(V(0.5, 0.5, 3.2)).lerp(m.clone().add(V(0.4, 0.45, 2.6)), k), m.clone().add(V(-0.15, 0.3, 0))];
    }
    case 'barata':
      if (t < MARCOS.chinelo - 0.3) return [L(BARATA.clone().add(V(1.6, 0.9, 2.6)), BARATA.clone().add(V(1.3, 0.8, 2.1))), BARATA.clone().add(V(0.2, 0.35, 0))];
      return [N.clone().add(V(1.2, 1.9, 6.4)), N.clone().add(V(0.9, 1.1, 0.5))];
    case 'nave': return [L(N.clone().add(V(1.6, 2.2, 13.5)), N.clone().add(V(1.8, 2.4, 12.5))), NAVE_ALVO.clone().add(V(-1.0, 4.6, 0))];
    case 'golias': {
      const cresce = ss(t, MARCOS.golira[0], MARCOS.golira[1]);
      return [N.clone().add(V(-0.4, 1.4, 6.8)).lerp(N.clone().add(V(-0.6, 1.2, 13.0)), cresce), N.clone().add(V(1.6, 1.6, 0)).lerp(GOL.clone().add(V(-1.3, 4.6, -2.5)), cresce)];
    }
    case 'basilisco': {
      if (t >= MARCOS.cupimOlha - 0.2) return [CUPIM.clone().add(V(0.25, 0.9, 1.9)), CUPIM.clone().add(V(0, 0.55, 0))];
      if (t >= MARCOS.tapaOlhos - 0.1) return [N.clone().add(V(0.3, 2.0, 4.4)), N.clone().add(V(0.1, 1.85, 0))];
      if (t >= MARCOS.basilisco[1]) { const h = cabecaBasMundo(); return [h.clone().add(V(0.6, -1.6, 9.5)).lerp(h.clone().add(V(0.4, -1.2, 7.5)), ss(t, MARCOS.basilisco[1], MARCOS.tapaOlhos)), h.clone().add(V(0, -0.4, 0))]; }
      const sobe = ss(t, MARCOS.basilisco[0], MARCOS.basilisco[1]);
      return [N.clone().add(V(0.8, 1.4, 8.5)).lerp(N.clone().add(V(0.4, 1.6, 13.0)), sobe), N.clone().add(V(0.8, 2.2, 0)).lerp(cabecaBasMundo(), sobe)];
    }
    case 'peixe':
      if (t < MARCOS.visao[1]) {
        const kv = ss(t, MARCOS.visao[0], MARCOS.visao[1]);
        return [V(13, 1.4, 22).lerp(V(9, 1.6, 19), kv), V(0, 4.2, 2)];
      }
      return [L(N.clone().add(V(0.4, 1.9, 4.6)), N.clone().add(V(0.3, 1.85, 4.0))), N.clone().add(V(0.2, 1.75, 0))];
    case 'final': return [L(N.clone().add(V(0.8, 2.0, 5.4)), N.clone().add(V(0.7, 1.95, 4.7))), N.clone().add(V(0.55, 1.45, 0))];
  }
  return [V(0, 3, 20), V(0, 1, 0)];
}

// ------------------------------------------------------------ Noé
function poseDoNoe(c, t) {
  const n = noe;
  n.corpo.rotation.set(0, 0, 0); n.corpo.position.set(0, 0, 0);
  n.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.16, 0.05, 0.05));
  n.martelo.visible = false;
  n.bracoDir.rotation.set(-1.15, 0, -0.35); n.bracoEsq.rotation.set(-1.15, 0, 0.35); // segurando o pergaminho
  pergaminho.visible = c.nome === 'abertura' || c.nome === 'final';
  chinelo.visible = false;
  n.grupo.visible = true;
  let yaw = 0;
  switch (c.nome) {
    case 'unicornio':
      n.bracoDir.rotation.set(0, 0, 0.9); n.bracoEsq.rotation.set(0, 0, -0.9); // mãos na cintura
      if (t < 6.4) n.corpo.rotation.x = 0.06 + Math.sin(t * 3) * 0.03;
      else { yaw = 0.45; n.corpo.rotation.z = -0.05; } // suspira e olha o "unicórnio"
      break;
    case 'jafe': {
      const [p0, p1, p2] = MARCOS.placas;
      n.bracoDir.rotation.set(-1.4, 0, -0.2); n.bracoEsq.rotation.set(-0.4, 0, 0.3);
      if (t > p0 - 0.1 && t < p2 + 0.6) n.bracoDir.rotation.set(-1.6 + (t > p1 ? 0.15 : 0) + (t > p2 ? 0.15 : 0), 0, -0.2);
      if (t > MARCOS.sobrinho) { yaw = 0.5; n.bracoDir.rotation.set(-0.3, 0, 1.4); n.bracoEsq.rotation.set(-0.3, 0, -1.2); }
      break;
    }
    case 'orangotango': n.grupo.visible = false; break;
    case 'passarinho': yaw = 0.15; n.bracoDir.rotation.set(-1.45, 0, 0.05); n.bracoEsq.rotation.set(0, 0, 0.25); n.corpo.rotation.x = 0.06; break;
    case 'barata':
      if (t > MARCOS.chinelo - 0.3) { chinelo.visible = true; n.bracoDir.rotation.set(0, 0, 2.6 + Math.sin(t * 10) * 0.12); yaw = 0.5; }
      else { n.bracoDir.rotation.set(-0.3, 0, 0.3); n.bracoEsq.rotation.set(-0.3, 0, -0.3); yaw = 0.5; n.corpo.rotation.x = 0.15; }
      break;
    case 'nave': yaw = 0.6; n.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 8) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.5 - Math.sin(t * 8) * 0.2); break;
    case 'golias':
      yaw = 0.5;
      n.corpo.rotation.x = -0.12 * ss(t, MARCOS.golira[0], MARCOS.golira[1]); // olha para cima
      if (t > 40.6) { yaw = 0.15; n.bracoDir.rotation.set(-1.4, 0, 0.3); n.corpo.rotation.x = 0; } // dedo para cima: "cuidado…"
      break;
    case 'basilisco':
      yaw = Math.PI * 0.05;
      n.corpo.rotation.x = -0.1;
      if (t > MARCOS.tapaOlhos && t < MARCOS.pedra + 0.5) { n.bracoDir.rotation.set(-2.55, 0, -0.5); n.bracoEsq.rotation.set(-2.55, 0, 0.5); n.corpo.rotation.x = 0.12; }
      if (t > MARCOS.pedra + 0.5) { yaw = 0.8; n.bracoDir.rotation.set(0, 0, 2.3); n.bracoEsq.rotation.set(0, 0, -2.3); }
      break;
    case 'peixe':
      if (t < MARCOS.visao[1]) n.grupo.visible = false;
      else { n.corpo.rotation.x = -0.12; n.bracoDir.rotation.set(-0.2, 0, 0.3); n.bracoEsq.rotation.set(-0.2, 0, -0.3); }
      break;
    case 'final':
      if (t > 58.0 && t < 60.4) { n.bracoDir.rotation.set(-1.5, 0, 0); pergaminho.visible = false; }
      break;
  }
  n.grupo.position.copy(N);
  n.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ HUD
let grupoComentario = -1;
const coresAvatar = ['#e1306c', '#833ab4', '#f77737', '#405de6', '#2e7d32'];
const inicial = (a) => (a[1] === '_' || a[1] === '.' ? a[2] : a[1]).toUpperCase();
function hud(c, t) {
  legendas.atualizar(t);
  $('falante').style.opacity = '0';
  $('dia').style.opacity = '0';
  $('alerta').style.opacity = '0';
  $('progresso').style.opacity = '0';
  $('titulo').style.opacity = String(ss(t, 0.1, 0.35) * (1 - ss(t, 3.1, 3.4)));
  $('titulo').firstElementChild.style.transform = `scale(${0.8 + 0.2 * ss(t, 0.1, 0.35)}) rotate(-2deg)`;

  // Carimbo do unicórnio
  const ku = clamp01((t - MARCOS.carimboUnicornio) / 0.25);
  const cg = $('carimboGolira');
  cg.style.opacity = String(c.nome === 'unicornio' ? Math.min(1, ku * 3) : 0);
  cg.firstElementChild.style.transform = `scale(${ku > 0 ? lerp(1.8, 1, ku) : 0}) rotate(-8deg)`;

  // SEM · CAM · JAFÉ
  $('carimbos').className = 'trio';
  document.querySelectorAll('.carimbo').forEach((el, k) => {
    const e = clamp01((t - MARCOS.placas[k]) / 0.22);
    el.style.opacity = String(c.nome === 'jafe' ? Math.min(1, e * 3) * (1 - ss(t, MARCOS.sobrinho - 0.2, MARCOS.sobrinho + 0.1)) : 0);
    el.style.transform = `scale(${e > 0 ? lerp(1.7, 1, e) : 0}) rotate(${k % 2 ? 4 : -5}deg)`;
  });
  $('versiculo').style.opacity = String(c.nome === 'jafe' ? ss(t, MARCOS.placas[0], MARCOS.placas[0] + 0.3) * (1 - ss(t, MARCOS.sobrinho - 0.2, MARCOS.sobrinho + 0.1)) : 0);

  // +100 madeiras
  const cont = $('contador');
  if (c.nome === 'nave' && t > MARCOS.torasPousam) {
    cont.style.opacity = String(ss(t, MARCOS.torasPousam, MARCOS.torasPousam + 0.2));
    cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '26px';
    cont.textContent = '+100 🪵';
    cont.style.transform = `scale(${1 + Math.max(0, 1 - (t - MARCOS.torasPousam) / 0.3) * 0.4})`;
  } else cont.style.opacity = '0';

  // Barras de cinema no basilisco
  const cine = ss(t, MARCOS.basilisco[0] - 0.2, MARCOS.basilisco[0] + 0.2) * (1 - ss(t, MARCOS.cupimOlha - 0.4, MARCOS.cupimOlha - 0.2));
  $('barraTopo').style.transform = `translateY(${-120 * (1 - cine)}px)`;
  $('barraBase').style.transform = `translateY(${120 * (1 - cine)}px)`;

  // Cartões de comentário (o selo do Isaías conta de 65 até 112)
  const iGrupo = COMENTARIOS.findIndex((g) => t >= g.inicio && t < g.fim);
  const caixa = $('comentarios');
  if (iGrupo !== grupoComentario) {
    grupoComentario = iGrupo;
    const g = COMENTARIOS[iGrupo];
    caixa.className = '';
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
      const e = clamp01((t - g.inicio) / 0.25);
      const sai = ss(t, g.fim - 0.2, g.fim);
      const escala = (e < 1 ? 1 - Math.pow(1 - e, 3) + Math.sin(e * Math.PI) * 0.12 : 1) * (1 - sai * 0.3);
      el.style.opacity = String(Math.min(1, e * 2) * (1 - sai));
      el.style.transform = `translateY(${-sai * 30}px) scale(${escala}) rotate(${j % 2 ? 2 : -2}deg)`;
    });
    const selo = caixa.querySelector('.selo');
    if (selo && iGrupo === 0) {
      const [s0, s1] = MARCOS.selo;
      const nSelo = Math.round(lerp(65, 112, ss(t, s0, s1)));
      selo.textContent = `×${nSelo}`;
      selo.style.transform = `rotate(-6deg) scale(${t > s1 && t < s1 + 0.3 ? 1.3 : 1})`;
    }
  }

  // Cartão de seguir + recado
  const card = $('cartao');
  const kcard = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35) * (1 - ss(t, 60.6, 60.9));
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
  $('recado').style.opacity = String(c.nome === 'final' ? ss(t, 60.8, 61.1) : 0);
}

// ------------------------------------------------------------ Quadro
function cair(obj, base, pouso, t, dur = 0.6, altura = 8) {
  obj.visible = t > pouso - dur;
  if (!obj.visible) return;
  const k = Math.min(1, (t - (pouso - dur)) / dur);
  obj.position.copy(base).add(V(0, (1 - k * k) * altura, 0));
}
function renderizarEm(t) {
  const c = cenaEm(t);
  todasEtiquetas.forEach((e) => { e.visible = false; });

  // Clima: escurece no basilisco; azul de "debaixo d'água" na visão; nublado depois
  const naVisao = c.nome === 'peixe' && t < MARCOS.visao[1];
  const escurece = c.nome === 'basilisco' ? ss(t, MARCOS.basilisco[0], MARCOS.basilisco[0] + 0.8) : 0;
  const nublado = c.nome === 'peixe' && !naVisao ? 0.7 : c.nome === 'final' ? 0.55 : 0.25;
  cenario.definirClima(escurece ? lerp(0.25, 0.85, escurece) : nublado);
  cenario.atualizar(t * 3);
  if (naVisao) { cena.background = new THREE.Color('#0d4a6e'); cena.fog = new THREE.Fog('#0d4a6e', 8, 55); }
  $('noite').style.opacity = String(escurece * 0.35);
  $('visao').style.opacity = String(naVisao ? ss(t, MARCOS.visao[0], MARCOS.visao[0] + 0.3) * (1 - ss(t, MARCOS.visao[1] - 0.3, MARCOS.visao[1])) : 0);
  $('flash').style.opacity = String(c.nome === 'basilisco' && t > MARCOS.pedra && t < MARCOS.pedra + 0.25 ? 0.6 * (1 - (t - MARCOS.pedra) / 0.25) : (naVisao && t < MARCOS.visao[0] + 0.2 ? 0.5 : 0));
  chuva.atualizar(t, c.nome === 'peixe' && !naVisao ? 0.5 : 0);
  superficie.visible = naVisao;
  superficie.material.opacity = 0.3 + Math.sin(t * 3) * 0.05;

  poseDoNoe(c, t);
  ajudantes.atualizar(t);
  arca.atualizar(t);
  baterAsas(arara, 0, 0);
  arara.userData.cabeca.rotation.y = Math.sin(t * 1.7) * 0.4;

  // Unicórnio versão obra
  const [cv0, cv1] = MARCOS.cavalo;
  const kcv = ss(t, cv0, cv1);
  cavalo.visible = c.nome === 'unicornio' && t > cv0 - 0.1;
  cavalo.position.copy(N.clone().add(V(7.0, 0, 1.2)).lerp(N.clone().add(V(2.6, 0, 1.2)), kcv));
  cavalo.rotation.y = kcv < 1 ? Math.PI : lerp(Math.PI, Math.PI * 2 - 2.05, ss(t, cv1, cv1 + 0.4));
  cavalo.userData.pernas.forEach((p, i) => { p.rotation.z = kcv < 1 ? (i % 2 ? 1 : -1) * Math.sin(t * 14) * 0.5 : 0; });
  cavalo.position.y = kcv < 1 ? Math.abs(Math.sin(t * 14)) * 0.06 : 0;
  rotulo(rotuloCavalo, c.nome === 'unicornio' ? ss(t, cv1, cv1 + 0.25) : 0, cavalo.position.clone().add(V(-1.4, 3.2, 0)));

  // Sobrinho
  cair(sobrinho, SOBR, MARCOS.sobrinho + 0.3, t);
  sobrinho.visible = sobrinho.visible && c.nome === 'jafe';
  sobrinho.rotation.y = -0.4;
  sobrinho.userData.bracos.forEach((b, i) => b.rotation.set(0, 0, (i ? 1 : -1) * (t > MARCOS.sobrinho + 0.3 ? 2.4 + Math.sin(t * 9) * 0.25 : 0.25)));
  feixeSobrinho.atualizar(c.nome === 'jafe' ? t : -99, SOBR.x, SOBR.z, MARCOS.sobrinho + 0.3);
  ondaSobrinho.atualizar(c.nome === 'jafe' ? t : -99, SOBR.x, SOBR.z, MARCOS.sobrinho + 0.3, 2.5);
  rotulo(rotuloSobrinho, c.nome === 'jafe' ? ss(t, MARCOS.sobrinho + 0.35, MARCOS.sobrinho + 0.55) : 0, SOBR.clone().add(V(-0.6, 1.95, 0)));

  // Orangotango comendo morango
  orangotango.visible = toraOrango.visible = c.nome === 'orangotango';
  orangotango.position.copy(ORANGO).add(V(-0.2, 0.42, 0));
  orangotango.rotation.y = YAW_CAMERA + 0.4;
  const mordidas = MARCOS.morango.filter((m) => t > m).length;
  const mastiga = Math.max(0, ...MARCOS.morango.map((m) => (t > m - 0.25 && t < m + 0.15 ? Math.sin(clamp01((t - m + 0.25) / 0.4) * Math.PI) : 0)));
  morango.scale.setScalar(1.8 * (1 - mordidas * 0.27));
  morango.position.set(0.5 - mastiga * 0.15, 1.12 + mastiga * 0.15, 0.55);
  orangotango.userData.cabeca.rotation.z = -mastiga * 0.25;
  const [braco1, braco2] = orangotango.userData.pernas;
  braco1.rotation.z = 1.75 + mastiga * 0.3; braco2.rotation.z = 1.75 + mastiga * 0.3;
  MARCOS.morango.forEach((m) => migalhas.atualizar(c.nome === 'orangotango' ? t : -99, ORANGO.clone().add(V(0.3, 1.95, 0.6)), m));
  rotulo(rotuloOrango, c.nome === 'orangotango' ? ss(t, 16.3, 16.6) : 0, ORANGO.clone().add(V(-0.4, 2.6, 0)));

  // Passarinho no dedo + lupa
  const naMao = c.nome === 'passarinho';
  passarinho.visible = naMao;
  lupa.visible = naMao && t > MARCOS.lupa[0] - 0.1;
  if (naMao) {
    const m = maoDoNoe();
    passarinho.position.copy(m).add(V(0, 0.1, 0.12));
    passarinho.rotation.set(0, YAW_CAMERA + 0.9 + Math.sin(t * 2) * 0.2, 0);
    passarinho.userData.cauda.rotation.z = 0.25 + Math.sin(t * 22) * 0.5; // balança o rabo sem parar
    passarinho.userData.cabeca.rotation.y = Math.sin(t * 5) * 0.4;
    const kl = ss(t, MARCOS.lupa[0], MARCOS.lupa[1]);
    lupa.position.copy(m.clone().add(V(-0.8, 0.5, 0.6)).lerp(m.clone().add(V(-0.22, 0.32, 0.6)), kl));
    lupa.lookAt(camera.position);
    lupa.scale.setScalar(1.15);
    rotulo(rotuloPassarinho, ss(t, MARCOS.lupa[1], MARCOS.lupa[1] + 0.3), m.clone().add(V(-0.05, 0.55, 0)));
  }

  // Barata gamer
  barata.visible = c.nome === 'barata';
  const foge = ss(t, MARCOS.barataFoge, MARCOS.barataFoge + 1.2);
  barata.position.copy(BARATA).add(V(foge * 6, 0, foge * 0.5));
  barata.rotation.y = t < MARCOS.barataFoge ? Math.PI / 2 - 0.35 : Math.PI / 2;
  antenasBarata.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (0.4 + Math.sin(t * 9 + i) * 0.2); });
  pernasBarata.forEach((p, i) => { p.rotation.x = t > MARCOS.barataFoge ? Math.sin(t * 30 + i) * 0.6 : Math.sin(t * 3 + i) * 0.05; });
  barata.userData.tela.material.emissiveIntensity = 0.9 + Math.sin(t * 17) * 0.3;
  barata.userData.tela.visible = t < MARCOS.barataFoge + 0.2;
  luzTela.position.copy(barata.position).add(V(1.0, 0.7, 0.4));
  luzTela.intensity = barata.visible && t < MARCOS.barataFoge ? 1.2 + Math.sin(t * 17) * 0.4 : 0;
  rotulo(rotuloBarata, c.nome === 'barata' ? ss(t, 27.0, 27.3) * (1 - foge) : 0, BARATA.clone().add(V(0, 1.4, 0)));

  // Disco voador
  const naNave = c.nome === 'nave';
  nave.visible = naNave;
  trex.visible = naNave;
  trex.userData.cabeca.rotation.z = 0.5 * ss(t, 32.5, 33.2);
  trex.userData.mandibula.rotation.z = -0.4 * ss(t, 33.0, 33.4);
  const chega = ss(t, MARCOS.nave[0], MARCOS.nave[1]);
  nave.position.copy(NAVE_ALVO.clone().add(V(-30, 22, -20)).lerp(NAVE_ALVO.clone().add(V(0, 8.5, 0)), chega)).add(V(0, Math.sin(t * 2.5) * 0.15, 0));
  nave.rotation.y = t * 1.5;
  nave.rotation.z = (1 - chega) * 0.3;
  luzesNave.forEach((l, k) => { l.material.color.set((Math.floor(t * 8) + k) % 3 === 0 ? '#ffe066' : '#7fe9ff'); });
  const [r0, r1] = MARCOS.raio;
  const kr = ss(t, r0, r0 + 0.3) * (1 - ss(t, r1 - 0.3, r1));
  raio.visible = naNave && kr > 0.01;
  raio.material.opacity = 0.32 * kr * (0.85 + 0.15 * Math.sin(t * 20));
  raio.position.copy(NAVE_ALVO).add(V(0, 4.1, 0));
  raio.scale.set(1, 8.2, 1);
  torasRaio.forEach((tt, k) => {
    const desce = ss(t, r0 + 0.3 + k * 0.12, MARCOS.torasPousam);
    tt.visible = naNave && t > r0 + 0.2 && t < MARCOS.torasPousam;
    tt.position.copy(NAVE_ALVO).add(V(Math.sin(k * 2.1) * 0.6, lerp(7.8, 0.6, desce), Math.cos(k * 1.7) * 0.5));
    tt.rotation.x = t * (1 + k * 0.3);
  });
  pilhaNova.visible = naNave && t > MARCOS.torasPousam;
  poeiraToras.atualizar(naNave ? t : -99, NAVE_ALVO.clone().add(V(0, 0.3, 0)), MARCOS.torasPousam);
  rotulo(rotuloNave, naNave ? ss(t, MARCOS.nave[1], MARCOS.nave[1] + 0.3) : 0, NAVE_ALVO.clone().add(V(0, 10.0, 0)));

  // Golira vira Golias
  golira.visible = c.nome === 'golias';
  const cresce = ss(t, MARCOS.golira[0], MARCOS.golira[1]);
  golira.scale.setScalar(lerp(1.35, 5.2, cresce));
  golira.position.copy(GOL).add(V(-1.5 * cresce, 0, -2.5 * cresce));
  const peito = t > MARCOS.golira[1] - 0.4 && t < MARCOS.golira[1] + 1.4;
  const [ba, bb] = golira.userData.pernas;
  ba.rotation.z = peito ? 1.6 + Math.max(0, Math.sin(t * 16)) * 0.5 : 0.12;
  bb.rotation.z = peito ? 1.6 + Math.max(0, Math.sin(t * 16 + Math.PI)) * 0.5 : 0.12;
  $('escuro').style.opacity = String(c.nome === 'golias' ? 0.18 * cresce : 0);
  rotulo(rotuloGolira, c.nome === 'golias' ? ss(t, 37.1, 37.4) : 0, golira.position.clone().add(V(0.3, lerp(1.35, 5.2, cresce) * 1.65 + 0.3, 0)));

  // Basilisco: sobe atrás da arca, olhos acesos
  const naBas = c.nome === 'basilisco';
  const sobe = ss(t, MARCOS.basilisco[0], MARCOS.basilisco[1]);
  basilisco.visible = naBas;
  basilisco.position.set(1.5, lerp(-13, 0, sobe), -6);
  basilisco.rotation.y = Math.sin(t * 0.8) * 0.08;
  cabecaBas.rotation.set(0.35 + Math.sin(t * 1.3) * 0.05, Math.sin(t * 0.9) * 0.1, 0);
  cabecaBas.userData.lingua.visible = Math.sin(t * 6) > 0.4;
  olhosBasMat.emissiveIntensity = 1.8 + Math.sin(t * 9) * 0.6;
  luzOlhos.intensity = naBas ? sobe * 60 : 0;
  luzOlhos.position.copy(cabecaBasMundo()).add(V(0, 0, 4));

  // Cupim: vira pedra e, no fim, pisca
  cupim.visible = toraCupim.visible = c.nome === 'basilisco' || c.nome === 'final';
  cupim.position.copy(CUPIM).add(V(0, 0.55, 0));
  const olhando = ss(t, MARCOS.cupimOlha, MARCOS.cupimOlha + 0.3);
  const virouPedra = t > MARCOS.pedra || c.nome === 'final';
  cupim.rotation.set(-0.5 * olhando, -0.5 + 0.5 * olhando, 0);
  if (c.nome === 'final') cupim.rotation.set(0, -0.35, 0);
  const abreOlhos = c.nome === 'final' && t > MARCOS.pisca && t < MARCOS.pisca + 0.45;
  for (const [o, cor] of coresCupim) o.material.color.copy(virouPedra && !(abreOlhos && o.geometry.type === 'SphereGeometry') ? PEDRA : cor);
  cupim.userData.antenas.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (virouPedra ? 0.5 : 0.5 + Math.sin(t * 9) * 0.25); });
  const tremeCupim = naBas && t > MARCOS.pedra && t < MARCOS.pedra + 0.3 ? Math.sin(t * 80) * 0.03 : 0;
  cupim.position.x += tremeCupim;
  // a piscada final: os olhos (brancos) somem e voltam
  const pisca = abreOlhos && t > MARCOS.pisca + 0.2 && t < MARCOS.pisca + 0.3;
  cupim.children.forEach((o) => { if (o.isMesh && o.geometry.type === 'SphereGeometry') o.scale.y = pisca ? 0.1 : 1; });
  poeiraPedra.atualizar(naBas ? t : -99, cupim.position.clone(), MARCOS.pedra);
  rotulo(rotuloCupim, naBas && t > MARCOS.cupimOlha ? ss(t, MARCOS.cupimOlha, MARCOS.cupimOlha + 0.2) : 0, CUPIM.clone().add(V(0, 1.25, 0)));

  // Visão do peixe gigante
  peixe.visible = naVisao;
  if (naVisao) {
    const kp = (t - MARCOS.visao[0]) / (MARCOS.visao[1] - MARCOS.visao[0]);
    peixe.position.set(lerp(-26, 22, kp), 3.2 + Math.sin(t * 1.5) * 0.3, 9.5);
    peixe.rotation.set(0, 0, Math.sin(t * 1.5) * 0.04);
    caudaPeixe.rotation.y = Math.sin(t * 5) * 0.45;
    bolhas.forEach((b, k) => b.atualizar(t, V(lerp(-10, 12, k / 2), 0.5, 6 + k), MARCOS.visao[0] + k * 0.8));
  } else bolhas.forEach((b) => b.atualizar(-99, V(0, 0, 0), 0));
  rotulo(rotuloPeixe, naVisao ? ss(t, MARCOS.visao[0] + 0.8, MARCOS.visao[0] + 1.1) : 0, peixe.position.clone().add(V(0, 2.6, 0)));

  // Câmera (com tremores)
  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  let tremor = 0;
  if (naBas && t < MARCOS.basilisco[1] + 0.3) tremor += 0.05 * sobe + 0.03;
  if (c.nome === 'golias') tremor += cresce > 0 && cresce < 1 ? 0.04 : 0;
  if (c.nome === 'nave') tremor += impacto(MARCOS.torasPousam, 0.15, 6);
  tremor += impacto(MARCOS.pedra, 0.04, 9) * (naBas ? 1 : 0);
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
