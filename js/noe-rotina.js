// Rotina de trabalho do Noé no site: busca tora na pilha → serra e prega na
// bancada → leva a tábua pronta até a obra → admira a arca → recomeça.
// É função do "tempo de rotina", então os vídeos continuam determinísticos.
import * as THREE from 'three';

const mat = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, flatShading: true });
const ss = THREE.MathUtils.smoothstep;
const lerp = THREE.MathUtils.lerp;

// Pontos de trabalho (a pilha de toras fica em (-7.5, 0, 8), ver cenario.js)
export const PONTOS = {
  toras: new THREE.Vector3(-7.5, 0, 9.9),
  bancada: new THREE.Vector3(-3.5, 0, 11.3),
  obra: new THREE.Vector3(-12, 0, 9.2),
};
const BANCADA = new THREE.Vector3(-3.5, 0, 12.35);
const PILHA_TABUAS = new THREE.Vector3(-12, 0, 7.7);
const VELOCIDADE = 1.25; // m/s

function caixa(l, a, p, cor) { return new THREE.Mesh(new THREE.BoxGeometry(l, a, p), mat(cor)); }

function criarProps(cena) {
  const g = new THREE.Group();
  // Bancada de carpinteiro
  const bancada = new THREE.Group();
  const tampo = caixa(2.6, 0.14, 0.9, '#8a5a2b'); tampo.position.y = 0.9;
  bancada.add(tampo);
  for (const x of [-1.1, 1.1]) for (const z of [-0.35, 0.35]) {
    const perna = caixa(0.12, 0.9, 0.12, '#6b4423'); perna.position.set(x, 0.45, z); bancada.add(perna);
  }
  // Ferramentas e serragem
  const serragem = new THREE.Mesh(new THREE.CircleGeometry(1.3, 10).rotateX(-Math.PI / 2), mat('#e3c08a'));
  serragem.position.y = 0.03;
  bancada.add(serragem);
  const balde = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 8), mat('#7a5230'));
  balde.position.set(1.6, 0.2, 0.2);
  bancada.add(balde);
  bancada.position.copy(BANCADA);
  g.add(bancada);

  // Peça em cima da bancada (aparece enquanto ele serra/prega)
  const pecaNaBancada = caixa(2.2, 0.12, 0.45, '#c98a45');
  pecaNaBancada.position.set(BANCADA.x, 1.03, BANCADA.z);
  pecaNaBancada.visible = false;
  g.add(pecaNaBancada);

  // Pilha de tábuas prontas, encostada na arca
  const pilha = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const t = caixa(0.5, 0.08, 2.0, i % 2 ? '#c98a45' : '#b97a3c');
    t.position.set((i % 3) * 0.55 - 0.55, 0.05 + Math.floor(i / 3) * 0.09, 0);
    t.rotation.y = Math.PI / 2;
    pilha.add(t);
  }
  pilha.position.copy(PILHA_TABUAS);
  g.add(pilha);

  // Cajado encostado na bancada (ele trabalha com as duas mãos)
  const cajado = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 6), mat('#5a3a1d'));
  cajado.position.set(BANCADA.x - 1.45, 1.0, BANCADA.z + 0.3);
  cajado.rotation.z = 0.25;
  g.add(cajado);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  cena.add(g);
  return { pecaNaBancada };
}

// Monta a sequência de etapas com a duração de cada uma.
function criarRoteiro() {
  const etapas = [];
  const andar = (de, para, carregando) => etapas.push({ tipo: 'andar', de, para, carregando, dur: de.distanceTo(para) / VELOCIDADE });
  const fazer = (tipo, dur, extra = {}) => etapas.push({ tipo, dur, ...extra });
  andar(PONTOS.obra, PONTOS.toras, null);
  fazer('pegarTora', 1.4, { olhar: Math.PI });
  andar(PONTOS.toras, PONTOS.bancada, 'tora');
  fazer('largarNaBancada', 0.8, { olhar: 0 });
  fazer('serrar', 3.4, { olhar: 0 });
  fazer('martelar', 3.0, { olhar: 0 });
  fazer('pegarTabua', 0.7, { olhar: 0 });
  andar(PONTOS.bancada, PONTOS.obra, 'tabua');
  fazer('largarTabua', 1.0, { olhar: Math.PI });
  fazer('admirar', 2.6, { olhar: Math.PI * 0.85 });
  let t = 0;
  for (const e of etapas) { e.ini = t; t += e.dur; }
  return { etapas, ciclo: t };
}

export class RotinaDoNoe {
  constructor(noe, cena) {
    this.noe = noe;
    this.props = criarProps(cena);
    const { etapas, ciclo } = criarRoteiro();
    this.etapas = etapas;
    this.ciclo = ciclo;
    noe.cajado.visible = false;
    this.yawConversa = null;
    this.etapaAtual = null;
  }

  // tRotina: relógio da rotina (pausa enquanto ele conversa).
  // jogador: posição do jogador (ou null). Retorna true se está conversando.
  atualizar(tRotina, tReal, jogador = null) {
    const n = this.noe;
    const tc = ((tRotina % this.ciclo) + this.ciclo) % this.ciclo;
    const e = this.etapas.find((x) => tc >= x.ini && tc < x.ini + x.dur) || this.etapas[0];
    const k = (tc - e.ini) / e.dur;
    this.etapaAtual = e.tipo;

    // Reseta a pose
    n.corpo.rotation.set(0, 0, 0);
    n.corpo.position.set(0, 0, 0);
    n.bracoDir.rotation.set(-0.3, 0, 0);
    n.bracoEsq.rotation.set(0, 0, 0.25);
    n.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.16, 0.05, 0.05));
    n.martelo.visible = true;
    n.serrote.visible = false;
    n.tora.visible = false;
    n.tabua.visible = false;
    this.props.pecaNaBancada.visible = false;

    let yaw = e.olhar ?? 0;
    const pos = n.grupo.position;

    if (e.tipo === 'andar') {
      pos.copy(e.de).lerp(e.para, ss(k, 0, 1) * 0.15 + k * 0.85);
      yaw = Math.atan2(e.para.x - e.de.x, e.para.z - e.de.z);
      const passo = Math.sin(tRotina * 7.5);
      n.pes[0].position.z = 0.05 + passo * 0.2; n.pes[0].position.y = 0.05 + Math.max(0, passo) * 0.08;
      n.pes[1].position.z = 0.05 - passo * 0.2; n.pes[1].position.y = 0.05 + Math.max(0, -passo) * 0.08;
      n.corpo.position.y = Math.abs(passo) * 0.04;
      n.corpo.rotation.z = passo * 0.04;
      if (e.carregando === 'tora') {
        n.tora.visible = true;
        n.bracoEsq.rotation.set(0, 0, 2.6); // mão no ombro segurando a tora
        n.bracoDir.rotation.set(-0.2 - passo * 0.3, 0, 0);
      } else if (e.carregando === 'tabua') {
        n.tabua.visible = true;
        n.martelo.visible = false;
        n.bracoDir.rotation.set(-1.2, 0, 0);
        n.bracoEsq.rotation.set(-1.2, 0, 0.1);
      } else {
        n.bracoDir.rotation.x = -0.2 - passo * 0.4;
        n.bracoEsq.rotation.x = passo * 0.4;
      }
    } else {
      const ponto = { pegarTora: PONTOS.toras, largarNaBancada: PONTOS.bancada, serrar: PONTOS.bancada, martelar: PONTOS.bancada, pegarTabua: PONTOS.bancada, largarTabua: PONTOS.obra, admirar: PONTOS.obra }[e.tipo];
      pos.copy(ponto);
      switch (e.tipo) {
        case 'pegarTora': {
          const curva = Math.sin(k * Math.PI);           // abaixa e levanta
          n.corpo.rotation.x = curva * 0.55;
          n.bracoDir.rotation.x = -curva * 1.4;
          n.bracoEsq.rotation.set(-curva * 1.4, 0, 0.25 + (k > 0.5 ? (k - 0.5) * 4.7 : 0));
          n.tora.visible = k > 0.5;
          break;
        }
        case 'largarNaBancada':
          n.tora.visible = k < 0.5;
          n.bracoEsq.rotation.set(-k * 1.2, 0, 2.6 * (1 - k));
          this.props.pecaNaBancada.visible = k >= 0.5;
          break;
        case 'serrar': {
          this.props.pecaNaBancada.visible = true;
          n.martelo.visible = false;
          n.serrote.visible = true;
          const vai = Math.sin(tRotina * 9);
          n.corpo.rotation.x = 0.28;
          n.bracoDir.rotation.set(-1.25 + vai * 0.25, 0, 0);
          n.bracoDir.position.z = vai * 0.12;
          n.bracoEsq.rotation.set(-1.0, 0, 0.1);      // mão esquerda segurando a madeira
          break;
        }
        case 'martelar': {
          this.props.pecaNaBancada.visible = true;
          const batida = Math.max(0, Math.sin(tRotina * 6));
          n.corpo.rotation.x = 0.25;
          n.bracoDir.rotation.set(-0.9 - batida * 1.0, 0, 0);
          n.bracoEsq.rotation.set(-1.0, 0, 0.1);
          break;
        }
        case 'pegarTabua':
          n.corpo.rotation.x = Math.sin(k * Math.PI) * 0.35;
          n.martelo.visible = false;
          n.tabua.visible = k > 0.5;
          this.props.pecaNaBancada.visible = k <= 0.5;
          n.bracoDir.rotation.x = -1.2; n.bracoEsq.rotation.set(-1.2, 0, 0.1);
          break;
        case 'largarTabua': {
          const curva = Math.sin(k * Math.PI);
          n.corpo.rotation.x = curva * 0.5;
          n.martelo.visible = false;
          n.tabua.visible = k < 0.5;
          n.bracoDir.rotation.x = -1.2 + curva * 0.2; n.bracoEsq.rotation.set(-1.2, 0, 0.1);
          break;
        }
        case 'admirar':
          // olha para cima, para a arca, com a mão na cintura
          n.corpo.rotation.x = -0.18;
          n.bracoEsq.rotation.set(0, 0, 0.9);
          n.bracoDir.rotation.set(-0.2, 0, -0.2 + Math.sin(tRotina * 2) * 0.05);
          break;
      }
    }
    if (n.bracoDir.position.z !== 0 && e.tipo !== 'serrar') n.bracoDir.position.z = 0;

    // Conversa: se o jogador chega perto, ele para, vira e acena
    let conversando = false;
    if (jogador) {
      const dx = jogador.x - pos.x, dz = jogador.z - pos.z;
      if (dx * dx + dz * dz < 3.4 * 3.4) {
        conversando = true;
        const alvo = Math.atan2(dx, dz);
        if (this.yawConversa === null) this.yawConversa = n.grupo.rotation.y;
        let d = alvo - this.yawConversa;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        this.yawConversa += d * 0.12;
        yaw = this.yawConversa;
        n.corpo.rotation.x = 0;
        n.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.16, 0.05, 0.05));
        if (!n.tora.visible && !n.tabua.visible) {
          n.bracoDir.rotation.set(-0.2, 0, 2.5 + Math.sin(tReal * 9) * 0.35); // tchau! (braço para cima e para fora)
          n.bracoEsq.rotation.set(0, 0, 0.25);
        }
      } else this.yawConversa = null;
    }
    n.grupo.rotation.y = yaw;
    return conversando;
  }
}
