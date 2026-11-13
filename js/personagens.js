import * as THREE from 'three';
import { COMPRIMENTO, LARGURA } from './arca.js';

const mat = (cor, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.85, flatShading: true, ...extra });

function sombra(obj) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return obj;
}

// Gerador de números pseudoaleatórios com semente: o mesmo seguidor
// sempre aparece no mesmo lugar, com a mesma roupa.
export function aleatorio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- Noé
export class Noe {
  constructor() {
    const g = new THREE.Group();
    const pele = mat('#e0ac7e');

    const tunica = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 1.35, 8), mat('#8a5a2b'));
    tunica.position.y = 0.68;
    const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.12, 8), mat('#d9b45a'));
    faixa.position.y = 0.95;
    const manto = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 8, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat('#4f6d9e', { side: THREE.DoubleSide }));
    manto.position.y = 1.12;

    const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 1), pele);
    cabeca.position.y = 1.62;
    const barba = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 7), mat('#f2f2f2'));
    barba.position.set(0, 1.27, 0.17);
    barba.rotation.x = Math.PI;
    const cabelo = new THREE.Mesh(new THREE.SphereGeometry(0.29, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), mat('#f2f2f2'));
    cabelo.position.set(0, 1.64, -0.03);
    const olhos = new THREE.Group();
    for (const lado of [-1, 1]) {
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), mat('#1b1b1b'));
      olho.position.set(lado * 0.09, 1.68, 0.24);
      olhos.add(olho);
    }
    this.olhos = olhos;

    // Braço esquerdo segura o cajado, o direito martela.
    const bracoEsq = new THREE.Group();
    this.bracoEsq = bracoEsq;
    bracoEsq.position.set(-0.4, 1.2, 0);
    const mangaE = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 6), mat('#8a5a2b'));
    mangaE.position.y = -0.28;
    bracoEsq.add(mangaE);
    bracoEsq.rotation.z = 0.25;
    const cajado = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 6), mat('#5a3a1d'));
    cajado.position.set(-0.62, 1.0, 0.15);
    this.cajado = cajado;

    this.bracoDir = new THREE.Group();
    this.bracoDir.position.set(0.4, 1.2, 0);
    const mangaD = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 6), mat('#8a5a2b'));
    mangaD.position.y = -0.28;
    const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 6), mat('#5a3a1d'));
    cabo.position.set(0, -0.6, 0.18);
    cabo.rotation.x = Math.PI / 2;
    const ferro = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.28), mat('#6e6e6e'));
    ferro.position.set(0, -0.6, 0.45);
    ferro.rotation.x = Math.PI / 2;
    this.martelo = new THREE.Group();
    this.martelo.add(cabo, ferro);
    // Serrote (aparece só quando ele serra)
    this.serrote = new THREE.Group();
    const lamina = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.6), mat('#b8bcc2', { metalness: 0.6, roughness: 0.4 }));
    lamina.position.set(0, -0.62, 0.42);
    const punho = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.14), mat('#7a4a22'));
    punho.position.set(0, -0.6, 0.08);
    this.serrote.add(lamina, punho);
    this.serrote.visible = false;
    this.bracoDir.add(mangaD, this.martelo, this.serrote);

    // Pés (aparecem embaixo da túnica quando ele anda)
    this.pes = [-1, 1].map((lado) => {
      const pe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.3), mat('#4a3020'));
      pe.position.set(lado * 0.16, 0.05, 0.05);
      return pe;
    });
    // Tora carregada no ombro
    this.tora = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.2, 7), mat('#a8682f'));
    this.tora.rotation.x = Math.PI / 2;
    this.tora.position.set(-0.4, 1.58, 0.1);
    this.tora.visible = false;
    // Tábua (já serrada) carregada nos braços
    this.tabua = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 1.9), mat('#c98a45'));
    this.tabua.position.set(0, 0.95, 0.45);
    this.tabua.visible = false;
    this.corpo = new THREE.Group();
    this.corpo.add(tunica, faixa, manto, cabeca, barba, cabelo, olhos, bracoEsq, cajado, this.bracoDir, this.tora, this.tabua);

    g.add(this.corpo, ...this.pes);
    g.scale.setScalar(1.25); // Noé é um pouco maior que os ajudantes: é o protagonista
    this.grupo = sombra(g);
  }

  atualizar(t) {
    const batida = Math.max(0, Math.sin(t * 5));
    this.bracoDir.rotation.x = -0.4 - batida * 1.1;
    this.grupo.position.y = Math.abs(Math.sin(t * 5)) * 0.03;
  }
}

// ------------------------------------------------------------ Vizinho
// Personagem dos avulsos de humor: mesma base dos ajudantes (corpo de cone e
// cabeça low-poly), em tamanho de gente, com chapéu de palha e túnica roxa.
export class Vizinho {
  constructor() {
    const g = new THREE.Group();
    this.roupa = mat('#7d4fa1');
    this.pele = mat('#d9a066');
    const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.48, 1.3, 8), this.roupa);
    corpo.position.y = 0.65;
    const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.1, 8), mat('#5a3a1d'));
    cinto.position.y = 0.9;
    this.cabeca = new THREE.Group();
    this.cabeca.position.y = 1.55;
    const rosto = new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 1), this.pele);
    for (const lado of [-1, 1]) {
      const olho = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), mat('#1b1b1b'));
      olho.position.set(lado * 0.09, 0.05, 0.24);
      const sobrancelha = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.03), mat('#3b2414'));
      sobrancelha.position.set(lado * 0.09, 0.13, 0.245);
      sobrancelha.rotation.z = lado * -0.25; // cara de deboche
      this.cabeca.add(olho, sobrancelha);
    }
    const bigode = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), mat('#3b2414'));
    bigode.position.set(0, -0.06, 0.25);
    // Chapéu de palha (aba larga + copa)
    this.chapeu = new THREE.Group();
    const palha = mat('#e2c46b');
    const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.04, 14), palha);
    const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.22, 10), palha);
    copa.position.y = 0.12;
    const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.05, 10), mat('#a8322d'));
    fita.position.y = 0.04;
    this.chapeu.add(aba, copa, fita);
    this.chapeu.position.y = 0.2;
    this.chapeu.rotation.z = 0.12;
    this.cabeca.add(rosto, bigode, this.chapeu);

    // Braços: grupos no ombro, a manga aponta para baixo
    const braco = (lado) => {
      const b = new THREE.Group();
      b.position.set(lado * 0.38, 1.18, 0);
      const manga = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.58, 6), this.roupa);
      manga.position.y = -0.27;
      const mao = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), this.pele);
      mao.position.y = -0.58;
      b.add(manga, mao);
      return b;
    };
    this.bracoEsq = braco(-1);
    this.bracoDir = braco(1);
    // Martelo (só no final, quando ele vira ajudante)
    this.martelo = new THREE.Group();
    const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mat('#5a3a1d'));
    cabo.position.set(0, -0.6, 0.18);
    cabo.rotation.x = Math.PI / 2;
    const ferro = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.24), mat('#6e6e6e'));
    ferro.position.set(0, -0.6, 0.42);
    ferro.rotation.x = Math.PI / 2;
    this.martelo.add(cabo, ferro);
    this.martelo.visible = false;
    this.bracoDir.add(this.martelo);

    this.pes = [-1, 1].map((lado) => {
      const pe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.28), mat('#4a3020'));
      pe.position.set(lado * 0.15, 0.05, 0.05);
      return pe;
    });
    this.corpo = new THREE.Group();
    this.corpo.add(corpo, cinto, this.cabeca, this.bracoEsq, this.bracoDir);
    g.add(this.corpo, ...this.pes);
    g.scale.setScalar(1.18);
    this.grupo = sombra(g);
  }

  // Encharcado: roupa e pele mais escuras e brilhantes
  molhar(k) {
    this.roupa.color.set('#7d4fa1').lerp(new THREE.Color('#3f2758'), k);
    this.roupa.roughness = 0.85 - k * 0.5;
    this.pele.roughness = 0.85 - k * 0.45;
  }

  // Pose neutra (antes de cada quadro)
  neutro() {
    this.corpo.rotation.set(0, 0, 0);
    this.corpo.position.set(0, 0, 0);
    this.cabeca.rotation.set(0, 0, 0);
    this.bracoEsq.rotation.set(0, 0, 0.15);
    this.bracoDir.rotation.set(0, 0, -0.15);
    this.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.15, 0.05, 0.05));
    this.chapeu.position.set(0, 0.2, 0);
    this.chapeu.rotation.set(0, 0, 0.12);
    this.martelo.visible = false;
  }

  bracosCruzados() {
    this.bracoDir.rotation.set(-1.25, 0, -1.15);
    this.bracoEsq.rotation.set(-1.15, 0, 1.15);
  }

  andar(t, velocidade = 9, amplitude = 0.2) {
    const passo = Math.sin(t * velocidade);
    this.pes[0].position.z = 0.05 + passo * amplitude;
    this.pes[1].position.z = 0.05 - passo * amplitude;
    this.corpo.position.y = Math.abs(passo) * 0.06;
    return passo;
  }
}

// ---------------------------------------------------------- Ajudantes
// Um ajudante por seguidor, desenhados com InstancedMesh (2 draw calls para
// centenas de bonecos). Acima de MAX_VISIVEIS a contagem continua no HUD.
export const MAX_VISIVEIS = 600;
const CORES_ROUPA = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#7f8c8d', '#e84393'];
const CORES_PELE = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];

function posicaoDoAjudante(i) {
  const r = aleatorio(i * 7919 + 13);
  // Os primeiros ficam pertinho da arca; os seguintes vão formando uma multidão em volta.
  const anel = 1 + Math.floor(Math.sqrt(i) * 0.55);
  const angulo = r() * Math.PI * 2;
  const rx = COMPRIMENTO / 2 + 1.5 + anel * 1.1 + r() * 0.8;
  const rz = LARGURA / 2 + 2 + anel * 1.1 + r() * 0.8;
  let x = Math.cos(angulo) * rx;
  let z = Math.sin(angulo) * rz;
  // Deixa livre o caminho da rampa (lado da frente, perto de x = 3).
  if (z > 0 && Math.abs(x - 3) < 2.2 && z < LARGURA / 2 + 10) x += x > 3 ? 2.6 : -2.6;
  // Área de trabalho do Noé livre (pilha de toras, bancada e caminho até a obra):
  // quem cair ali é empurrado para a borda mais próxima.
  const [x0, x1, z0, z1] = [-14, -1.2, 6.6, 14.2];
  if (x > x0 && x < x1 && z > z0 && z < z1) {
    const opcoes = [[x0 - 0.3 - (x - x0) * 0.2, z], [x1 + 0.3 + (x1 - x) * 0.2, z], [x, z1 + 0.3 + (z1 - z) * 0.3]];
    [x, z] = opcoes.reduce((m, o) => (Math.hypot(o[0] - x, o[1] - z) < Math.hypot(m[0] - x, m[1] - z) ? o : m));
  }
  return { x, z, fase: r() * Math.PI * 2, rotacao: Math.atan2(-x, -z) + (r() - 0.5) * 0.6, roupa: CORES_ROUPA[Math.floor(r() * CORES_ROUPA.length)], pele: CORES_PELE[Math.floor(r() * CORES_PELE.length)] };
}

export class Ajudantes {
  constructor() {
    this.grupo = new THREE.Group();
    this.corpos = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 0.85, 7), mat('#ffffff'), MAX_VISIVEIS);
    this.cabecas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.19, 0), mat('#ffffff'), MAX_VISIVEIS);
    for (const m of [this.corpos, this.cabecas]) {
      m.castShadow = true;
      // As posições mudam a cada quadro: sem isso o three.js usa uma área de
      // visibilidade antiga e some com os bonecos quando a câmera não vê o centro.
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.grupo.add(m);
    }
    this.dados = [];
    for (let i = 0; i < MAX_VISIVEIS; i++) {
      const d = posicaoDoAjudante(i);
      this.dados.push(d);
      this.corpos.setColorAt(i, new THREE.Color(d.roupa));
      this.cabecas.setColorAt(i, new THREE.Color(d.pele));
    }
    this.rotulos = new THREE.Group();
    this.grupo.add(this.rotulos);
    this.aux = new THREE.Object3D();
    this.definir(0, 0, []);
  }

  // `jaEstavam` aparecem desde o início; os novos (até `total`) chegam animados.
  definir(total, jaEstavam, nomes, inicio = 0.6, duracao = 3) {
    this.total = Math.min(total, MAX_VISIVEIS);
    this.jaEstavam = Math.min(jaEstavam, this.total);
    this.inicio = inicio;
    this.duracao = duracao;
    this.corpos.count = this.total;
    this.cabecas.count = this.total;

    this.rotulos.clear();
    // Os nomes dos novos ajudantes do dia flutuam acima deles.
    nomes.slice(0, 12).forEach((nome, k) => {
      const i = this.total - 1 - k;
      if (i < 0) return;
      const sprite = criarRotulo(nome);
      sprite.userData.indice = i;
      this.rotulos.add(sprite);
    });
  }

  atualizar(t) {
    const novos = this.total - this.jaEstavam;
    for (let i = 0; i < this.total; i++) {
      const d = this.dados[i];
      let chegada = 1;
      if (i >= this.jaEstavam && novos > 0) {
        const quando = this.inicio + ((i - this.jaEstavam) / novos) * this.duracao;
        chegada = THREE.MathUtils.clamp((t - quando) / 0.5, 0, 1);
      }
      const pulo = Math.abs(Math.sin(t * 4 + d.fase)) * 0.12;
      const queda = (1 - chegada) * 6;
      const escala = Math.max(0.001, chegada);

      this.aux.rotation.set(0, d.rotacao, Math.sin(t * 4 + d.fase) * 0.06);
      this.aux.scale.setScalar(escala);
      this.aux.position.set(d.x, 0.43 + pulo + queda, d.z);
      this.aux.updateMatrix();
      this.corpos.setMatrixAt(i, this.aux.matrix);
      this.aux.position.y = 1.0 + pulo + queda;
      this.aux.updateMatrix();
      this.cabecas.setMatrixAt(i, this.aux.matrix);
    }
    this.corpos.instanceMatrix.needsUpdate = true;
    this.cabecas.instanceMatrix.needsUpdate = true;

    for (const s of this.rotulos.children) {
      const d = this.dados[s.userData.indice];
      s.position.set(d.x, 1.9 + Math.abs(Math.sin(t * 4 + d.fase)) * 0.12, d.z);
    }
  }
}

function criarRotulo(texto) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const fonte = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.font = fonte;
  const w = Math.ceil(ctx.measureText(texto).width) + 40;
  c.width = w;
  c.height = 72;
  ctx.font = fonte;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 72, 36);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 20, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set((w / 72) * 0.55, 0.55, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// ------------------------------------------------------------- Animais
// Cada tipo é um "boneco" de caixas parametrizado. Para adicionar um animal novo,
// basta incluir uma entrada aqui e usar o nome em progresso.json.
export const TIPOS_DE_ANIMAIS = {
  ovelha:   { emoji: '🐑', corpo: [0.9, 0.6, 0.6], perna: 0.35, pescoco: 0.1, cabeca: 0.3, cor: '#f4f1ea', corCabeca: '#2d2d2d' },
  vaca:     { emoji: '🐄', corpo: [1.5, 0.8, 0.7], perna: 0.6, pescoco: 0.2, cabeca: 0.4, cor: '#f5f5f5', corCabeca: '#3a2a20', manchas: '#2b2b2b' },
  cavalo:   { emoji: '🐎', corpo: [1.5, 0.7, 0.55], perna: 0.9, pescoco: 0.6, cabeca: 0.38, cor: '#8b5a2b' },
  porco:    { emoji: '🐖', corpo: [1.0, 0.6, 0.6], perna: 0.25, pescoco: 0.05, cabeca: 0.38, cor: '#f2a6b3' },
  leao:     { emoji: '🦁', corpo: [1.4, 0.7, 0.6], perna: 0.6, pescoco: 0.25, cabeca: 0.45, cor: '#d9a441', juba: '#8a4b14' },
  elefante: { emoji: '🐘', corpo: [2.2, 1.5, 1.4], perna: 1.0, pescoco: 0.1, cabeca: 0.8, cor: '#8e8e93', tromba: true },
  girafa:   { emoji: '🦒', corpo: [1.4, 0.8, 0.6], perna: 1.5, pescoco: 1.9, cabeca: 0.35, cor: '#e8b04a', manchas: '#8a5222' },
  zebra:    { emoji: '🦓', corpo: [1.4, 0.7, 0.55], perna: 0.85, pescoco: 0.5, cabeca: 0.36, cor: '#f7f7f7', manchas: '#1d1d1d' },
  urso:     { emoji: '🐻', corpo: [1.4, 0.9, 0.8], perna: 0.5, pescoco: 0.15, cabeca: 0.5, cor: '#6b4226' },
  coelho:   { emoji: '🐇', corpo: [0.5, 0.35, 0.35], perna: 0.12, pescoco: 0.05, cabeca: 0.25, cor: '#d9d2c5', orelhas: true },
  galinha:  { emoji: '🐔', corpo: [0.45, 0.4, 0.35], perna: 0.25, pescoco: 0.15, cabeca: 0.2, cor: '#fafafa', crista: true },
  cachorro: { emoji: '🐕', corpo: [0.9, 0.5, 0.4], perna: 0.4, pescoco: 0.2, cabeca: 0.32, cor: '#c08a4a' },
  gato:     { emoji: '🐈', corpo: [0.6, 0.35, 0.3], perna: 0.25, pescoco: 0.1, cabeca: 0.25, cor: '#f39c12', orelhas: true },
  camelo:   { emoji: '🐫', corpo: [1.6, 0.8, 0.6], perna: 1.2, pescoco: 0.7, cabeca: 0.35, cor: '#c9a26b', corcova: true },
  pinguim:  { emoji: '🐧', corpo: [0.45, 0.5, 0.45], perna: 0.1, pescoco: 0.05, cabeca: 0.28, cor: '#222222', corCabeca: '#222222' },
  jacare:   { emoji: '🐊', corpo: [1.9, 0.34, 0.62], perna: 0.16, pescoco: 0.02, cabeca: 0.3, cor: '#4e7d3a', focinho: 0.8, dentes: true, raboLongo: 1.7, escamas: '#3a6330' },
  pantera:  { emoji: '🐈‍⬛', corpo: [1.5, 0.62, 0.55], perna: 0.58, pescoco: 0.18, cabeca: 0.42, cor: '#17171c', corOlho: '#f1c40f', orelhinhas: true, raboLongo: 1.1 },
  aguia:    { emoji: '🦅', passaro: true, tamanho: 1.25, cor: '#5a3a20', corCabeca: '#f3efe6', bico: '#f2b822', asa: '#4a2f18' },
  gaviao:   { emoji: '🦅', passaro: true, tamanho: 1.0, cor: '#7a6248', corCabeca: '#8a7358', peito: '#e9dcc4', bico: '#2b2b2b', asa: '#5e4a36' },
  urubu:    { emoji: '🐦‍⬛', passaro: true, tamanho: 1.15, cor: '#1c1c1f', corCabeca: '#4a4a50', bico: '#9a9a9a', asa: '#141416', careca: true },
  picapau:  { emoji: '🐦', passaro: true, tamanho: 0.75, cor: '#1f1f22', corCabeca: '#c0392b', peito: '#f2f2f2', bico: '#d9a531', asa: '#2a2a2e', crista: '#d62d20', bicoLongo: true, listras: '#f2f2f2' },
  onca:     { emoji: '🐆', corpo: [1.45, 0.6, 0.55], perna: 0.55, pescoco: 0.18, cabeca: 0.42, cor: '#e3a63d', manchas: '#3a2410', manchasQtd: 16, orelhinhas: true, raboLongo: 1.0 },
  lontra:       { emoji: '🦦', corpo: [0.85, 0.3, 0.32], perna: 0.14, pescoco: 0.08, cabeca: 0.26, cor: '#6b4a2e', corCabeca: '#a07a55', raboGrosso: true, raboLongo: 0.6, orelhinhas: true },
  // Os "diferentões" pedidos nos comentários
  hipopotamo:   { emoji: '🦛', corpo: [1.9, 1.0, 1.1], perna: 0.42, pescoco: 0.05, cabeca: 0.68, cor: '#8a7b8f', focinho: 0.42, orelhinhas: true, dentoes: true },
  ornitorrinco: { emoji: '🦫', corpo: [0.75, 0.3, 0.45], perna: 0.1, pescoco: 0.02, cabeca: 0.26, cor: '#7a4b2a', bicoPato: '#3a3a3e', raboRemo: true },
  camaleao:     { emoji: '🦎', corpo: [0.6, 0.32, 0.26], perna: 0.2, pescoco: 0.04, cabeca: 0.26, cor: '#5fbf4a', olhosGrandes: true, raboEnrolado: true, escamas: '#3f9a33' },
  lagarto:      { emoji: '🦎', corpo: [0.8, 0.2, 0.3], perna: 0.1, pescoco: 0.02, cabeca: 0.2, cor: '#7fae3c', focinho: 0.22, raboLongo: 0.8, escamas: '#5f8c2a' },
  tigre:        { emoji: '🐅', corpo: [1.5, 0.64, 0.56], perna: 0.58, pescoco: 0.18, cabeca: 0.44, cor: '#e8822b', listras: '#1b1b1b', orelhinhas: true, raboLongo: 1.0 },
  puma:         { emoji: '🐆', corpo: [1.4, 0.58, 0.5], perna: 0.55, pescoco: 0.18, cabeca: 0.4, cor: '#c49a62', orelhinhas: true, raboLongo: 1.0 },
  gorila:       { emoji: '🦍', primata: true, tamanho: 1.35, cor: '#2b2b2e', rosto: '#4a4448', costas: '#9a9aa0' },
  macaco:       { emoji: '🐒', primata: true, tamanho: 0.7, cor: '#8a5a2b', rosto: '#e2b98c', rabo: true },
  harpia:       { emoji: '🦅', passaro: true, tamanho: 2.6, cor: '#3a3a3e', corCabeca: '#c9c9cc', peito: '#efefef', bico: '#222', asa: '#45454a', crista: '#55555a' },
  flamingo:     { emoji: '🦩', passaro: true, tamanho: 1.0, cor: '#f48fb1', corCabeca: '#f48fb1', bico: '#2b2b2b', asa: '#ec6f9c', pernaLonga: '#f06292', pescocoLongo: true },
  bicodesapato: { emoji: '🐦', passaro: true, tamanho: 1.2, cor: '#8c97a3', corCabeca: '#9aa4ae', bico: '#c8b27a', asa: '#6f7a86', bicoSapato: true, pernaLonga: '#3a3a3a' },
  queroquero:   { emoji: '🐦', passaro: true, tamanho: 0.8, cor: '#b8b4a8', corCabeca: '#cfccc2', peito: '#1e1e1e', bico: '#d84b3a', asa: '#8a8678', pernaLonga: '#d84b3a' },
  // Vídeo 06: os insistentes
  arara:        { emoji: '🦜', passaro: true, tamanho: 0.9, cor: '#d62d20', corCabeca: '#d62d20', bico: '#efe8d8', asa: '#1f5fd1', listras: '#f2c200', caudaLonga: '#d62d20' },
  lobo:         { emoji: '🐺', corpo: [1.15, 0.5, 0.42], perna: 0.55, pescoco: 0.28, cabeca: 0.36, cor: '#7d7f86', corCabeca: '#8e9097', focinho: 0.26, orelhinhas: true, raboLongo: 0.75 },
  maracaja:     { emoji: '🐆', corpo: [0.85, 0.36, 0.32], perna: 0.3, pescoco: 0.12, cabeca: 0.3, cor: '#c99a52', manchas: '#3a2410', manchasQtd: 12, orelhinhas: true, raboLongo: 0.75 },
  // Noé responde #2
  orangotango:  { emoji: '🦧', primata: true, tamanho: 1.15, cor: '#c4621f', rosto: '#7a4a2e' },
  balancarabo:  { emoji: '🐦', passaro: true, tamanho: 0.5, cor: '#8fa3b8', corCabeca: '#8fa3b8', peito: '#f4f4f4', bico: '#222', asa: '#5f6f80', caudaLonga: '#2b2b2b' },
};

// Pássaro low-poly, de frente para +x (como os outros animais), com asas que batem.
export function criarPassaro(p) {
  const g = new THREE.Group();
  const e = p.tamanho || 1;
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(p.cor));
  corpo.scale.set(1.35, 0.9, 0.85);
  corpo.position.y = 0.55;
  g.add(corpo);
  if (p.peito) {
    const peito = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), mat(p.peito));
    peito.scale.set(0.9, 1, 0.9);
    peito.position.set(0.16, 0.5, 0);
    g.add(peito);
  }
  const cabeca = new THREE.Group();
  cabeca.position.set(0.36, 0.86, 0);
  const altura = p.pernaLonga ? 0.75 : 0; // flamingo, bico-de-sapato e quero-quero ficam no alto
  if (p.pescocoLongo) {
    const pescoco = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 5, 10, Math.PI * 1.1), mat(p.cor));
    pescoco.rotation.z = -0.3;
    pescoco.position.set(0.3, 0.95, 0);
    g.add(pescoco);
    cabeca.position.set(0.5, 1.3, 0);
  }
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(p.careca ? 0.13 : 0.16, 7, 5), mat(p.corCabeca || p.cor));
  cabeca.add(cranio);
  const bico = p.bicoSapato
    ? new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.22), mat(p.bico)) // bico enorme, de "sapato"
    : new THREE.Mesh(new THREE.ConeGeometry(0.055, p.bicoLongo ? 0.36 : 0.2, 5), mat(p.bico));
  if (p.bicoSapato) bico.position.set(0.24, -0.06, 0);
  else {
    bico.rotation.z = -Math.PI / 2 + (p.bicoLongo ? 0 : 0.35) - (p.pescocoLongo ? 0.8 : 0);
    bico.position.set(p.bicoLongo ? 0.3 : 0.2, p.bicoLongo ? 0 : -0.03, 0);
  }
  cabeca.add(bico);
  for (const lado of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(p.careca ? '#c0392b' : '#111'));
    olho.position.set(0.09, 0.04, lado * 0.12);
    cabeca.add(olho);
  }
  if (p.crista) {
    const crista = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 5), mat(p.crista));
    crista.rotation.z = 0.7;
    crista.position.set(-0.08, 0.15, 0);
    cabeca.add(crista);
  }
  if (p.careca) { // urubu: pescoço pelado e "colarinho" de penas
    const colar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 5, 8), mat(p.cor));
    colar.rotation.y = Math.PI / 2;
    colar.position.set(0.3, 0.74, 0);
    g.add(colar);
  }
  g.add(cabeca);
  const asas = [-1, 1].map((lado) => {
    const pivo = new THREE.Group();
    pivo.position.set(0, 0.7, lado * 0.2);
    const asa = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.75), mat(p.asa));
    asa.position.set(-0.05, 0, lado * 0.36);
    pivo.add(asa);
    if (p.listras) for (let i = 0; i < 3; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.055, 0.6), mat(p.listras));
      l.position.set(-0.22 + i * 0.16, 0.002, lado * 0.38);
      pivo.add(l);
    }
    pivo.userData.lado = lado;
    g.add(pivo);
    return pivo;
  });
  const cauda = p.caudaLonga // arara: cauda comprida e fina
    ? new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.16).translate(-0.3, 0, 0), mat(p.caudaLonga))
    : new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.28), mat(p.asa));
  cauda.position.set(-0.48, 0.52, 0);
  cauda.rotation.z = 0.25;
  g.add(cauda);
  const pernas = [-1, 1].map((lado) => {
    const comp = 0.3 + altura;
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, comp, 4), mat(p.pernaLonga || '#c9a227'));
    perna.position.set(0.02, comp / 2 + 0.02 - altura, lado * 0.1);
    g.add(perna);
    return perna;
  });
  if (altura) { // levanta tudo menos as pernas
    g.children.forEach((c) => { if (!pernas.includes(c)) c.position.y += altura; });
    pernas.forEach((pp) => { pp.position.y += altura; });
  }
  g.scale.setScalar(e);
  g.userData.asas = asas;
  g.userData.cauda = cauda;
  g.userData.cabeca = cabeca;
  g.userData.pernas = [];
  g.userData.patas = pernas;
  return sombra(g);
}

// Bate as asas (abertura de 0 = fechada a 1 = aberta; fase anima o bater)
export function baterAsas(passaro, abertura, fase) {
  for (const a of passaro.userData.asas || []) {
    // fechada: asa caída junto ao corpo (1,35 rad); aberta: sobe e desce com a fase
    a.rotation.x = a.userData.lado * THREE.MathUtils.lerp(1.35, -0.9 * Math.sin(fase), abertura);
  }
}

// Gorila e macaco: em pé, apoiados nos braços compridos (os "nós dos dedos" no chão)
function criarPrimata(p) {
  const g = new THREE.Group();
  const pelo = mat(p.cor);
  const rosto = mat(p.rosto);
  const tronco = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.7), pelo);
  tronco.position.set(0, 0.95, 0);
  tronco.rotation.z = -0.35; // inclinado para a frente (+x)
  g.add(tronco);
  if (p.costas) {
    const prata = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.72), mat(p.costas));
    prata.position.set(-0.18, 1.05, 0);
    prata.rotation.z = -0.35;
    g.add(prata);
  }
  const cabeca = new THREE.Group();
  cabeca.position.set(0.32, 1.42, 0);
  const cranio = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), pelo);
  const cara = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.28), rosto);
  cara.position.set(0.19, -0.04, 0);
  const testa = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.36), pelo);
  testa.position.set(0.2, 0.1, 0);
  cabeca.add(cranio, cara, testa);
  for (const sz of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.05), mat('#111'));
    olho.position.set(0.225, 0.03, sz * 0.07);
    cabeca.add(olho);
    if (p.rabo) { // macaco: orelhas de abano
      const orelha = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.1), rosto);
      orelha.position.set(0, 0, sz * 0.22);
      cabeca.add(orelha);
    }
  }
  g.add(cabeca);
  const membro = (comp, grossura, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(grossura, comp, grossura).translate(0, -comp / 2, 0), pelo);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  const bracos = [-1, 1].map((sz) => membro(1.18, 0.2, 0.3, 1.18, sz * 0.42));
  const pernas = [-1, 1].map((sz) => membro(0.6, 0.22, -0.2, 0.6, sz * 0.2));
  bracos.forEach((b) => { b.rotation.z = 0.12; });
  if (p.rabo) {
    const rabo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 5, 10, Math.PI * 1.4), pelo);
    rabo.position.set(-0.45, 0.85, 0);
    g.add(rabo);
  }
  g.scale.setScalar(p.tamanho || 1);
  g.userData.pernas = [...bracos, ...pernas];
  g.userData.cabeca = cabeca;
  return sombra(g);
}

export function criarAnimal(tipo, semente) {
  const p = TIPOS_DE_ANIMAIS[tipo];
  if (p.primata) return criarPrimata(p);
  if (p.passaro) {
    const passaro = criarPassaro(p);
    baterAsas(passaro, 0, 0);
    return passaro;
  }
  const g = new THREE.Group();
  const [cl, ca, cp] = p.corpo;
  const corpoMat = mat(p.cor);
  const cabecaMat = mat(p.corCabeca || p.cor);

  const corpo = new THREE.Mesh(new THREE.BoxGeometry(cl, ca, cp), corpoMat);
  corpo.position.y = p.perna + ca / 2;
  g.add(corpo);

  if (p.manchas) {
    const r = aleatorio(semente);
    for (let i = 0; i < (p.manchasQtd || 6); i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(cl * (p.manchasQtd ? 0.08 : 0.15), ca * (p.manchasQtd ? 0.18 : 0.3), 0.02), mat(p.manchas));
      const lado = p.manchasQtd ? (i % 2 ? 1 : -1) : (r() > 0.5 ? 1 : -1); // muitas pintas: metade de cada lado
      m.position.set((r() - 0.5) * cl * 0.8, p.perna + ca * (0.25 + r() * 0.5), lado * (cp / 2 + 0.01));
      g.add(m);
    }
  }
  if (p.corcova) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(ca * 0.45, 0), corpoMat);
    c.position.set(0, p.perna + ca, 0);
    g.add(c);
  }

  const pernaGeo = new THREE.BoxGeometry(Math.min(0.18, cl * 0.15), p.perna, Math.min(0.18, cp * 0.3));
  pernaGeo.translate(0, -p.perna / 2, 0);
  const pernas = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const perna = new THREE.Mesh(pernaGeo, cabecaMat === corpoMat ? corpoMat : mat(p.cor));
    perna.position.set(sx * cl * 0.35, p.perna, sz * cp * 0.3);
    pernas.push(perna);
    g.add(perna);
  }

  const frente = cl / 2;
  const pescoco = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.15, cp * 0.35), p.pescoco + 0.1, Math.max(0.15, cp * 0.35)), corpoMat);
  pescoco.position.set(frente - 0.1, p.perna + ca + p.pescoco / 2 - 0.1, 0);
  pescoco.rotation.z = -0.25;
  g.add(pescoco);

  const cabeca = new THREE.Mesh(new THREE.BoxGeometry(p.cabeca * 1.2, p.cabeca, p.cabeca * 0.9), cabecaMat);
  cabeca.position.set(frente + p.cabeca * 0.3, p.perna + ca + p.pescoco, 0);
  g.add(cabeca);

  for (const sz of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), mat(p.corOlho || '#111'));
    olho.position.set(cabeca.position.x + p.cabeca * 0.35, cabeca.position.y + p.cabeca * 0.15, sz * p.cabeca * 0.46);
    g.add(olho);
  }

  if (p.juba) {
    const juba = new THREE.Mesh(new THREE.IcosahedronGeometry(p.cabeca * 0.95, 0), mat(p.juba));
    juba.position.copy(cabeca.position).add(new THREE.Vector3(-0.12, 0, 0));
    g.add(juba);
  }
  if (p.tromba) {
    const tromba = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.9, 6), cabecaMat);
    tromba.position.set(cabeca.position.x + p.cabeca * 0.7, cabeca.position.y - 0.45, 0);
    g.add(tromba);
    for (const sz of [-1, 1]) {
      const orelha = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.6), cabecaMat);
      orelha.position.set(cabeca.position.x - 0.2, cabeca.position.y, sz * (p.cabeca * 0.6 + 0.2));
      g.add(orelha);
    }
  }
  if (p.orelhas) {
    for (const sz of [-1, 1]) {
      const orelha = new THREE.Mesh(new THREE.BoxGeometry(0.06, p.cabeca * 0.9, 0.08), cabecaMat);
      orelha.position.set(cabeca.position.x - 0.03, cabeca.position.y + p.cabeca * 0.8, sz * p.cabeca * 0.25);
      g.add(orelha);
    }
  }
  if (p.crista) {
    const crista = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.05), mat('#e74c3c'));
    crista.position.set(cabeca.position.x, cabeca.position.y + p.cabeca * 0.6, 0);
    g.add(crista);
  }

  if (p.focinho) {
    // focinho comprido (jacaré), com dentes à mostra
    const focinho = new THREE.Mesh(new THREE.BoxGeometry(p.focinho, p.cabeca * 0.45, p.cabeca * 0.75), cabecaMat);
    focinho.position.set(cabeca.position.x + p.cabeca * 0.6 + p.focinho / 2, cabeca.position.y - p.cabeca * 0.2, 0);
    g.add(focinho);
    if (p.dentes) {
      for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) {
        const dente = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 4), mat('#f4f1e6'));
        dente.rotation.x = Math.PI;
        dente.position.set(focinho.position.x - p.focinho / 2 + 0.08 + i * (p.focinho - 0.12) / 6, focinho.position.y - p.cabeca * 0.25, sz * p.cabeca * 0.36);
        g.add(dente);
      }
    }
  }
  if (p.escamas) {
    for (let i = 0; i < 7; i++) {
      const escama = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), mat(p.escamas));
      escama.position.set(frente - 0.2 - i * (cl - 0.3) / 6, p.perna + ca + 0.05, 0);
      g.add(escama);
    }
  }
  if (p.listras) { // tigre: listras verticais dos dois lados
    for (let i = 0; i < 7; i++) for (const sz of [-1, 1]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, ca * 0.75, 0.02), mat(p.listras));
      l.position.set(-cl * 0.4 + i * cl * 0.13, p.perna + ca * 0.55, sz * (cp / 2 + 0.01));
      l.rotation.x = sz * 0.0;
      g.add(l);
    }
  }
  if (p.dentoes) { // hipopótamo: dois dentões para fora
    for (const sz of [-1, 1]) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), mat('#f4f1e6'));
      d.position.set(cabeca.position.x + p.cabeca * 0.6 + (p.focinho || 0) - 0.05, cabeca.position.y - p.cabeca * 0.02, sz * p.cabeca * 0.25);
      g.add(d);
    }
  }
  if (p.bicoPato) { // ornitorrinco: bico de pato achatado
    const bico = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.07, 0.3), mat(p.bicoPato));
    bico.position.set(cabeca.position.x + p.cabeca * 0.6 + 0.16, cabeca.position.y - p.cabeca * 0.15, 0);
    g.add(bico);
  }
  if (p.raboRemo) { // ornitorrinco: rabo de castor (um remo)
    const remo = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.32), mat('#5a3519'));
    remo.position.set(-frente - 0.2, p.perna + 0.06, 0);
    g.add(remo);
  }
  if (p.olhosGrandes) { // camaleão: olhos de bolinha que giram
    for (const sz of [-1, 1]) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), cabecaMat);
      o.position.set(cabeca.position.x + 0.03, cabeca.position.y + 0.04, sz * p.cabeca * 0.5);
      const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), mat('#111'));
      pupila.position.set(cabeca.position.x + 0.09, cabeca.position.y + 0.05, sz * (p.cabeca * 0.5 + 0.05));
      g.add(o, pupila);
    }
  }
  if (p.raboEnrolado) { // camaleão: rabo em espiral
    const rabo = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 5, 12, Math.PI * 1.7), corpoMat);
    rabo.position.set(-frente - 0.1, p.perna + 0.12, 0);
    g.add(rabo);
  }
  if (p.orelhinhas) {
    for (const sz of [-1, 1]) {
      const orelha = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), cabecaMat);
      orelha.position.set(cabeca.position.x - 0.08, cabeca.position.y + p.cabeca * 0.55, sz * p.cabeca * 0.3);
      g.add(orelha);
    }
  }

  if (p.raboEnrolado || p.raboRemo) {
    // já tem rabo próprio
  } else if (p.raboLongo) {
    // rabo longo e afinando para trás
    const reto = p.escamas || p.raboGrosso; // jacaré e lontra: rabo grosso e reto, rente ao chão
    const rabo = new THREE.Mesh(new THREE.ConeGeometry(reto ? cp * 0.33 : 0.09, p.raboLongo, 5), corpoMat);
    rabo.rotation.z = Math.PI / 2; // ponta para -x
    rabo.position.set(-frente - p.raboLongo / 2 + 0.05, p.perna + ca * (reto ? 0.4 : 0.75), 0);
    if (!reto) { // felino: rabo sobe em curva para trás
      rabo.rotation.z = Math.PI / 2 - 0.55;
      rabo.position.set(-frente - p.raboLongo * 0.42, p.perna + ca * 0.75 + p.raboLongo * 0.24, 0);
    }
    g.add(rabo);
  } else {
    const rabo = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06).translate(-0.2, 0, 0), corpoMat);
    rabo.position.set(-frente, p.perna + ca * 0.8, 0);
    g.add(rabo);
  }

  g.userData.pernas = pernas;
  return sombra(g);
}

// Os animais formam uma fila em casais, subindo a rampa da arca.
export class Animais {
  constructor() {
    this.grupo = new THREE.Group();
    this.lista = [];
  }

  definir(tipos, jaEstavam, inicio = 0.6, intervalo = 0.6) {
    this.grupo.clear();
    this.lista = [];
    const validos = tipos.filter((t) => TIPOS_DE_ANIMAIS[t]);
    let distancia = 0;
    validos.forEach((tipo, k) => {
      const tamanho = TIPOS_DE_ANIMAIS[tipo].corpo?.[0] ?? 0.9; // pássaros não têm "corpo" de caixa
      distancia += tamanho * 0.6 + 0.9;
      for (const lado of [-1, 1]) {
        const a = criarAnimal(tipo, k * 31 + lado);
        // Fila sai do pé da rampa (x = 3, z ≈ 9) e se afasta pela frente.
        const x = 3 + lado * 0.75;
        const z = LARGURA / 2 + 8 + distancia;
        a.position.set(x, 0, z);
        a.rotation.y = Math.PI / 2; // olhando para a arca
        this.grupo.add(a);
        this.lista.push({ obj: a, base: a.position.clone(), entrada: k >= jaEstavam ? inicio + (k - jaEstavam) * intervalo : null, fase: k + lado });
      }
      distancia += tamanho * 0.6;
    });
  }

  emojis(tipos) {
    return tipos.filter((t) => TIPOS_DE_ANIMAIS[t]).map((t) => TIPOS_DE_ANIMAIS[t].emoji + TIPOS_DE_ANIMAIS[t].emoji).join(' ');
  }

  atualizar(t) {
    for (const a of this.lista) {
      let k = 1;
      if (a.entrada !== null) k = THREE.MathUtils.clamp((t - a.entrada) / 1.2, 0, 1);
      const suave = 1 - Math.pow(1 - k, 3);
      a.obj.position.copy(a.base);
      a.obj.position.z += (1 - suave) * 14; // chegam andando de longe
      const passo = Math.sin(t * 6 + a.fase);
      a.obj.position.y = Math.abs(passo) * 0.04;
      a.obj.userData.pernas.forEach((perna, i) => { perna.rotation.z = (i % 2 ? 1 : -1) * passo * 0.25; });
      a.obj.visible = k > 0 || a.entrada === null;
    }
  }
}

// ------------------------------------------------------------- Cupim
// O "vilão" fofo do canal: cabeça marrom, corpo creme, olhos grandes e antenas.
// Olha para +z. userData: antenas (para acenar) e mandibula (para roer).
export function criarCupim() {
  const g = new THREE.Group();
  const corpoMat = mat('#f1e3c4');
  const cabecaMat = mat('#a0522d');
  const cab = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), cabecaMat);
  const corpo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), corpoMat);
  corpo.position.set(0, -0.17, -0.12);
  for (const l of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.4 }));
    o.position.set(l * 0.07, 0.05, 0.13);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshStandardMaterial({ color: '#111' }));
    pupila.position.set(l * 0.06, 0.05, 0.18);
    g.add(o, pupila);
  }
  const antenas = [-1, 1].map((l) => {
    const pivo = new THREE.Group();
    pivo.position.set(l * 0.07, 0.12, 0.04);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.25, 4).translate(0, 0.12, 0), cabecaMat);
    pivo.add(a);
    pivo.rotation.z = -l * 0.5;
    g.add(pivo);
    return pivo;
  });
  const mandibula = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.06), mat('#5a2e14'));
  mandibula.position.set(0, -0.07, 0.15);
  g.add(cab, corpo, mandibula);
  g.userData.antenas = antenas;
  g.userData.mandibula = mandibula;
  return sombra(g);
}

// --------------------------------------------------------- Tardígrado
// O "urso-d'água": gordinho, em gomos, com 8 perninhas e boca de tubo. Olha para +z.
export function criarTardigrado() {
  const g = new THREE.Group();
  const pele = mat('#e8c9b0');
  for (let i = 0; i < 4; i++) {
    const gomo = new THREE.Mesh(new THREE.SphereGeometry(0.11 - Math.abs(i - 1.5) * 0.012, 10, 8), pele);
    gomo.scale.set(1, 0.85, 0.9);
    gomo.position.set(0, 0.12, -0.24 + i * 0.13);
    g.add(gomo);
    for (const l of [-1, 1]) {
      const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.08, 6), pele);
      perna.position.set(l * 0.08, 0.04, -0.24 + i * 0.13);
      g.add(perna);
    }
  }
  const boca = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.06, 8), mat('#c99b80'));
  boca.rotation.x = Math.PI / 2;
  boca.position.set(0, 0.11, 0.2);
  g.add(boca);
  for (const l of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), mat('#111'));
    olho.position.set(l * 0.045, 0.16, 0.17);
    g.add(olho);
  }
  return sombra(g);
}

// ----------------------------------------------------------- T-rex
// O dinossauro ajudante do vídeo 06. Olha para +x (como os animais), ~5,5 m de altura.
// userData: cabeca (grupo), mandibula (abre com rotation.z), bracos (bracinhos curtos), pernas (pivôs do quadril).
export function criarTrex() {
  const g = new THREE.Group();
  const pele = mat('#5f7d3c');
  const barriga = mat('#cbbd8c');
  const escuro = mat('#3f5628');
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), pele);
  corpo.scale.set(1.9, 1.15, 1.05);
  corpo.position.set(0, 3.1, 0);
  corpo.rotation.z = 0.18;
  const ventre = new THREE.Mesh(new THREE.SphereGeometry(0.9, 9, 7), barriga);
  ventre.scale.set(1.6, 0.9, 0.85);
  ventre.position.set(0.25, 2.8, 0);
  g.add(corpo, ventre);
  for (let i = 0; i < 7; i++) { // placas nas costas
    const pl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 4), escuro);
    pl.position.set(1.0 - i * 0.62, 4.25 - i * 0.1 - Math.max(0, i - 3) * 0.12, 0);
    g.add(pl);
  }
  const pescoco = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.3, 8), pele);
  pescoco.position.set(1.55, 3.85, 0);
  pescoco.rotation.z = -0.75;
  g.add(pescoco);
  // Cabeça (pivô na nuca)
  const cabeca = new THREE.Group();
  cabeca.position.set(2.0, 4.45, 0);
  const cranio = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 0.95), pele);
  cranio.position.set(0.7, 0.15, 0);
  const focinho = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.8), pele);
  focinho.position.set(1.65, 0.05, 0);
  const sobrancelha = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 1.05), escuro);
  sobrancelha.position.set(0.45, 0.58, 0);
  cabeca.add(cranio, focinho, sobrancelha);
  for (const l of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat('#f6d24a'));
    olho.position.set(0.5, 0.38, l * 0.47);
    const pupila = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), mat('#111'));
    pupila.position.set(0.56, 0.38, l * 0.55);
    const narina = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), mat('#222'));
    narina.position.set(1.95, 0.25, l * 0.22);
    cabeca.add(olho, pupila, narina);
  }
  for (let i = 0; i < 7; i++) for (const l of [-1, 1]) { // dentes de cima
    const d = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 4), mat('#f4f1e6'));
    d.rotation.x = Math.PI;
    d.position.set(0.55 + i * 0.22, -0.32, l * 0.36);
    cabeca.add(d);
  }
  const mandibula = new THREE.Group();
  mandibula.position.set(0.1, -0.25, 0);
  const queixo = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 0.8), pele);
  queixo.position.set(0.95, -0.16, 0);
  const lingua = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.5), mat('#c0392b'));
  lingua.position.set(0.9, 0.02, 0);
  mandibula.add(queixo, lingua);
  for (let i = 0; i < 6; i++) for (const l of [-1, 1]) {
    const d = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.17, 4), mat('#f4f1e6'));
    d.position.set(0.55 + i * 0.22, 0.06, l * 0.32);
    mandibula.add(d);
  }
  cabeca.add(mandibula);
  g.add(cabeca);
  // Bracinhos (a piada do vídeo)
  const bracos = [-1, 1].map((l) => {
    const pivo = new THREE.Group();
    pivo.position.set(1.35, 3.2, l * 0.62);
    const braco = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.55, 6).translate(0, -0.27, 0), pele);
    braco.rotation.z = 0.9;
    const mao = new THREE.Group();
    mao.position.set(0.42, -0.32, 0);
    for (const k of [-1, 1]) {
      const garra = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4), mat('#f4f1e6'));
      garra.rotation.z = -Math.PI / 2;
      garra.position.set(0.06, 0, k * 0.05);
      mao.add(garra);
    }
    pivo.add(braco, mao);
    pivo.userData.mao = mao;
    g.add(pivo);
    return pivo;
  });
  // Pernas grossas (pivô no quadril)
  const pernas = [-1, 1].map((l) => {
    const pivo = new THREE.Group();
    pivo.position.set(-0.3, 2.9, l * 0.75);
    const coxa = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.5, 0.6).translate(0.05, -0.55, 0), pele);
    const canela = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.45).translate(-0.15, -1.7, 0), pele);
    const pe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.6).translate(0.15, -2.75, 0), escuro);
    pivo.add(coxa, canela, pe);
    for (const k of [-1, 0, 1]) {
      const garra = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), mat('#e8e2d0'));
      garra.rotation.z = -Math.PI / 2;
      garra.position.set(0.75, -2.8, k * 0.2);
      pivo.add(garra);
    }
    g.add(pivo);
    return pivo;
  });
  // Rabo comprido
  const rabo = new THREE.Mesh(new THREE.ConeGeometry(0.75, 4.2, 8), pele);
  rabo.rotation.z = Math.PI / 2 - 0.22;
  rabo.position.set(-3.4, 3.2, 0);
  g.add(rabo);
  g.userData.cabeca = cabeca;
  g.userData.mandibula = mandibula;
  g.userData.bracos = bracos;
  g.userData.pernas = pernas;
  return sombra(g);
}

// ---------------------------------------------------------- Dragão
// O segurança da arca (vídeo 06): rosa com asas laranjas, como pediram nos comentários.
// Olha para +x. As asas seguem a convenção dos pássaros, então baterAsas() funciona.
export function criarDragao() {
  const g = new THREE.Group();
  const pele = mat('#f48fb1');
  const barriga = mat('#ffd1e0');
  const asaMat = mat('#ff8a1e', { side: THREE.DoubleSide });
  const chifre = mat('#fff3e0');
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), pele);
  corpo.scale.set(1.7, 1.0, 1.0);
  corpo.position.set(0, 1.9, 0);
  const ventre = new THREE.Mesh(new THREE.SphereGeometry(0.85, 9, 7), barriga);
  ventre.scale.set(1.5, 0.8, 0.85);
  ventre.position.set(0.2, 1.65, 0);
  g.add(corpo, ventre);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const perna = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.3, 0.4).translate(0, -0.65, 0), pele);
    perna.position.set(sx * 0.9, 1.4, sz * 0.6);
    g.add(perna);
  }
  const pescoco = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.6, 8), pele);
  pescoco.position.set(1.5, 2.8, 0);
  pescoco.rotation.z = -0.55;
  g.add(pescoco);
  const cabeca = new THREE.Group();
  cabeca.position.set(2.05, 3.55, 0);
  const cranio = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.7), pele);
  cranio.position.set(0.3, 0, 0);
  const focinho = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.55), pele);
  focinho.position.set(0.95, -0.08, 0);
  cabeca.add(cranio, focinho);
  for (const l of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 5), chifre);
    c.position.set(0.05, 0.45, l * 0.22);
    c.rotation.z = 0.6;
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat('#ffe14a', { emissive: '#ffb300', emissiveIntensity: 0.6 }));
    olho.position.set(0.5, 0.16, l * 0.33);
    const pupila = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.13, 0.03), mat('#111'));
    pupila.position.set(0.56, 0.16, l * 0.4);
    const narina = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), mat('#8a3050'));
    narina.position.set(1.3, 0.05, l * 0.14);
    cabeca.add(c, olho, pupila, narina);
  }
  for (let i = 0; i < 6; i++) { // crista
    const cr = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), mat('#ff8a1e'));
    cr.position.set(0.8 - i * 0.55, 2.95 - Math.abs(i - 1) * 0.08, 0);
    g.add(cr);
  }
  g.add(cabeca);
  const asas = [-1, 1].map((lado) => {
    const pivo = new THREE.Group();
    pivo.position.set(0.3, 2.6, lado * 0.6);
    const forma = new THREE.Shape();
    forma.moveTo(0, 0); forma.lineTo(1.0, 3.2); forma.lineTo(-0.4, 2.6); forma.lineTo(-1.2, 2.9); forma.lineTo(-1.6, 1.6); forma.lineTo(-2.2, 1.2); forma.lineTo(-0.8, 0);
    const membrana = new THREE.Mesh(new THREE.ShapeGeometry(forma), asaMat);
    membrana.rotation.x = lado * Math.PI / 2; // estende para o lado (em z)
    const osso = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.3, 5).translate(0, 1.65, 0), pele);
    osso.rotation.set(lado * Math.PI / 2, 0, -0.3 * lado * 0);
    osso.rotation.z = 0;
    osso.position.set(0.3, 0, 0);
    osso.rotation.x = lado * Math.PI / 2;
    osso.rotateOnAxis(new THREE.Vector3(0, 0, 1), -0.3);
    pivo.add(membrana, osso);
    pivo.userData.lado = lado;
    g.add(pivo);
    return pivo;
  });
  const rabo = new THREE.Mesh(new THREE.ConeGeometry(0.45, 3.0, 7), pele);
  rabo.rotation.z = Math.PI / 2 + 0.25;
  rabo.position.set(-2.8, 1.5, 0);
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 4), mat('#ff8a1e'));
  ponta.rotation.z = Math.PI / 2;
  ponta.position.set(-4.3, 1.15, 0);
  g.add(rabo, ponta);
  g.userData.asas = asas;
  g.userData.cabeca = cabeca;
  return sombra(g);
}
