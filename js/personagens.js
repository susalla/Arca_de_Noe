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
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(p.careca ? 0.13 : 0.16, 7, 5), mat(p.corCabeca || p.cor));
  cabeca.add(cranio);
  const bico = new THREE.Mesh(new THREE.ConeGeometry(0.055, p.bicoLongo ? 0.36 : 0.2, 5), mat(p.bico));
  bico.rotation.z = -Math.PI / 2 + (p.bicoLongo ? 0 : 0.35);
  bico.position.set(p.bicoLongo ? 0.3 : 0.2, p.bicoLongo ? 0 : -0.03, 0);
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
  const cauda = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.28), mat(p.asa));
  cauda.position.set(-0.48, 0.52, 0);
  cauda.rotation.z = 0.25;
  g.add(cauda);
  const pernas = [-1, 1].map((lado) => {
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 4), mat('#c9a227'));
    perna.position.set(0.02, 0.17, lado * 0.1);
    g.add(perna);
    return perna;
  });
  g.scale.setScalar(e);
  g.userData.asas = asas;
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

export function criarAnimal(tipo, semente) {
  const p = TIPOS_DE_ANIMAIS[tipo];
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
  if (p.orelhinhas) {
    for (const sz of [-1, 1]) {
      const orelha = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), cabecaMat);
      orelha.position.set(cabeca.position.x - 0.08, cabeca.position.y + p.cabeca * 0.55, sz * p.cabeca * 0.3);
      g.add(orelha);
    }
  }

  if (p.raboLongo) {
    // rabo longo e afinando para trás
    const rabo = new THREE.Mesh(new THREE.ConeGeometry(p.escamas ? cp * 0.33 : 0.09, p.raboLongo, 5), corpoMat);
    rabo.rotation.z = Math.PI / 2; // ponta para -x
    rabo.position.set(-frente - p.raboLongo / 2 + 0.05, p.perna + ca * (p.escamas ? 0.4 : 0.75), 0);
    if (!p.escamas) { // felino: rabo sobe em curva para trás
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
