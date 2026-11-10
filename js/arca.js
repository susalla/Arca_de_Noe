// A arca é montada a partir de peças geradas por código (low-poly).
// Escala: 1 unidade = 1 metro. Todas as peças já nascem na posição final
// (sem escala/rotação "escondida"), só a animação de entrada mexe no transform.
import * as THREE from 'three';

export const COMPRIMENTO = 24;
export const LARGURA = 7;
export const ALTURA = 5;
export const ELEVACAO = 0.7; // altura dos suportes: o casco fica acima do chão

const META_X = COMPRIMENTO / 2;

// Metade da largura do casco no ponto x, na altura local y (0 = fundo, ALTURA = convés).
export function meiaLargura(x, y) {
  const u = Math.min(1, Math.abs(x) / META_X);
  const afinamento = Math.sqrt(Math.max(0, 1 - Math.pow(u, 3)));
  const perfil = 0.28 + 0.72 * Math.sin(Math.min(1, Math.max(0, y / ALTURA)) * Math.PI / 2);
  return (LARGURA / 2) * afinamento * perfil;
}

// O fundo sobe nas pontas (proa e popa), como um barco de verdade.
export function baseY(x) {
  const u = Math.min(1, Math.abs(x) / META_X);
  return ELEVACAO + 0.9 * Math.pow(u, 3);
}

function corMadeira(semente, escura = false) {
  const base = escura ? new THREE.Color('#6b4423') : new THREE.Color('#a8682f');
  const hsl = {};
  base.getHSL(hsl);
  const variacao = (Math.sin(semente * 12.9898) * 43758.5453) % 1;
  base.setHSL(hsl.h + variacao * 0.02, hsl.s, hsl.l + variacao * 0.06);
  return base;
}

function material(cor) {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
}

// Faixa do costado entre as alturas y0 e y1, de x0 a x1, em um dos lados (lado = -1 ou 1).
function geometriaTabua(y0, y1, x0, x1, lado, segmentos = 20) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= segmentos; i++) {
    const x = x0 + (x1 - x0) * (i / segmentos);
    for (const y of [y0, y1]) {
      pos.push(x, baseY(x) + y, lado * meiaLargura(x, y));
    }
  }
  for (let i = 0; i < segmentos; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Superfície horizontal que acompanha o casco (fundo ou convés).
function geometriaPiso(y, segmentos = 40, recuo = 1) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= segmentos; i++) {
    const x = -META_X + COMPRIMENTO * (i / segmentos);
    const w = meiaLargura(x, y) * recuo;
    pos.push(x, baseY(x) + y, -w, x, baseY(x) + y, w);
  }
  for (let i = 0; i < segmentos; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function costela(x) {
  const pontos = [];
  const passos = 8;
  for (let i = passos; i >= 0; i--) {
    const y = (ALTURA + 0.25) * (i / passos);
    pontos.push(new THREE.Vector3(x, baseY(x) + y, -meiaLargura(x, Math.min(y, ALTURA))));
  }
  for (let i = 1; i <= passos; i++) {
    const y = (ALTURA + 0.25) * (i / passos);
    pontos.push(new THREE.Vector3(x, baseY(x) + y, meiaLargura(x, Math.min(y, ALTURA))));
  }
  const curva = new THREE.CatmullRomCurve3(pontos);
  return new THREE.TubeGeometry(curva, 32, 0.13, 5, false);
}

function quilha() {
  const pontos = [new THREE.Vector3(-META_X - 0.6, baseY(META_X) + ALTURA + 0.9, 0)];
  for (let i = 0; i <= 12; i++) {
    const x = -META_X + COMPRIMENTO * (i / 12);
    pontos.push(new THREE.Vector3(x, baseY(x) - 0.12, 0));
  }
  pontos.push(new THREE.Vector3(META_X + 0.9, baseY(META_X) + ALTURA + 1.6, 0));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos), 64, 0.22, 6, false);
}

function caixa(l, a, p, x, y, z, cor) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, a, p), material(cor));
  m.position.set(x, y, z);
  return m;
}

// Lista ordenada de peças. A ordem é a ordem de construção.
function criarPecas() {
  const pecas = [];
  const add = (nome, objeto) => {
    objeto.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    pecas.push({ nome, objeto });
  };

  // 1. Suportes (cavaletes de madeira no chão)
  const suportes = new THREE.Group();
  for (let i = -4; i <= 4; i++) {
    const x = i * 2.4;
    suportes.add(caixa(0.5, baseY(x) + 0.1, LARGURA * 0.35, x, (baseY(x) + 0.1) / 2, 0, corMadeira(i, true)));
  }
  add('Suportes', suportes);

  // 2. Quilha
  add('Quilha', new THREE.Mesh(quilha(), material(corMadeira(2, true))));

  // 3. Fundo
  add('Fundo do casco', new THREE.Mesh(geometriaPiso(0.05, 40, 0.98), material(corMadeira(3))));

  // 4. Costelas, do centro para as pontas
  const xsCostelas = [];
  for (let i = 1; i <= 11; i++) xsCostelas.push(-META_X + COMPRIMENTO * (i / 12));
  xsCostelas.sort((a, b) => Math.abs(a) - Math.abs(b));
  xsCostelas.forEach((x, i) => add(`Costela ${i + 1}`, new THREE.Mesh(costela(x), material(corMadeira(10 + i, true)))));

  // 5. Tábuas do costado, de baixo para cima, alternando lados e metades
  const fileiras = 8;
  for (let f = 0; f < fileiras; f++) {
    const y0 = (ALTURA * f) / fileiras;
    const y1 = (ALTURA * (f + 1)) / fileiras + 0.04;
    for (const lado of [1, -1]) {
      for (const [x0, x1] of [[-META_X, 0], [0, META_X]]) {
        const cor = corMadeira(f * 7 + lado * 3 + x0);
        add(`Tábua ${f + 1}`, new THREE.Mesh(geometriaTabua(y0, y1, x0, x1, lado), material(cor)));
      }
    }
  }

  // 6. Convés
  add('Convés', new THREE.Mesh(geometriaPiso(ALTURA, 40, 1.0), material(corMadeira(40))));

  // 7. Cabine (paredes)
  const deckY = baseY(0) + ALTURA;
  const cabL = COMPRIMENTO * 0.55, cabW = LARGURA * 0.55, cabH = 2.4, esp = 0.18;
  const corCab = corMadeira(50);
  add('Parede da cabine', caixa(cabL, cabH, esp, 0, deckY + cabH / 2, cabW / 2, corCab));
  add('Parede da cabine', caixa(cabL, cabH, esp, 0, deckY + cabH / 2, -cabW / 2, corCab));
  add('Parede da cabine', caixa(esp, cabH, cabW, cabL / 2, deckY + cabH / 2, 0, corCab));
  add('Parede da cabine', caixa(esp, cabH, cabW, -cabL / 2, deckY + cabH / 2, 0, corCab));

  // 8. Janelas
  const janelas = new THREE.Group();
  const corJanela = new THREE.Color('#2b1a0e');
  for (let i = -3; i <= 3; i++) {
    for (const lado of [1, -1]) {
      janelas.add(caixa(0.9, 0.6, 0.05, i * 1.8, deckY + cabH * 0.62, lado * (cabW / 2 + 0.1), corJanela));
    }
  }
  add('Janelas', janelas);

  // 9. Telhado (duas águas)
  const inclinacao = Math.atan2(1.1, cabW / 2);
  const larguraAgua = Math.hypot(1.1, cabW / 2) + 0.35;
  for (const lado of [1, -1]) {
    const agua = caixa(cabL + 0.8, 0.16, larguraAgua, 0, deckY + cabH + 0.55, lado * cabW / 4, corMadeira(60, true));
    agua.rotation.x = lado * inclinacao;
    add('Telhado', agua);
  }

  // 10. Porta no costado e 11. rampa até o chão
  const xPorta = 3;
  const zCostado = meiaLargura(xPorta, ALTURA * 0.45);
  const porta = caixa(2.2, 2.4, 0.12, xPorta, baseY(xPorta) + ALTURA * 0.45, zCostado + 0.05, corJanela);
  add('Porta', porta);

  const baseRampaY = baseY(xPorta) + ALTURA * 0.45 - 1.2;
  const comprimentoRampa = Math.hypot(baseRampaY, 5.5);
  const rampa = caixa(2.2, 0.18, comprimentoRampa, xPorta, baseRampaY / 2, zCostado + 5.5 / 2, corMadeira(70));
  rampa.rotation.x = Math.atan2(baseRampaY, 5.5);
  add('Rampa', rampa);

  return pecas;
}

// Quantos seguidores são necessários para liberar a peça i.
// Curva quadrática: no começo cada poucos seguidores já mostram progresso.
export function limiarDaPeca(i, total, meta) {
  if (i === 0) return 1;
  return Math.max(i + 1, Math.round(meta * Math.pow((i + 1) / total, 2)));
}

export class Arca {
  constructor() {
    this.grupo = new THREE.Group();
    this.pecas = criarPecas();
    for (const p of this.pecas) {
      p.objeto.visible = false;
      p.posicaoFinal = p.objeto.position.clone();
      this.grupo.add(p.objeto);
    }
  }

  get total() { return this.pecas.length; }

  pecasLiberadas(seguidores, meta) {
    let n = 0;
    while (n < this.total && seguidores >= limiarDaPeca(n, this.total, meta)) n++;
    return n;
  }

  proximaPeca(seguidores, meta) {
    const n = this.pecasLiberadas(seguidores, meta);
    if (n >= this.total) return null;
    return { nome: this.pecas[n].nome, faltam: limiarDaPeca(n, this.total, meta) - seguidores };
  }

  // Peças [0, jaProntas) aparecem prontas; [jaProntas, liberadas) entram animadas
  // a partir do segundo `inicio`, uma depois da outra.
  configurar(jaProntas, liberadas, inicio = 0.6, intervalo = 0.35) {
    this.pecas.forEach((p, i) => {
      p.objeto.visible = i < liberadas;
      p.entrada = i >= jaProntas && i < liberadas ? inicio + (i - jaProntas) * intervalo : null;
    });
    this.fimDasEntradas = inicio + Math.max(0, liberadas - jaProntas) * intervalo + 0.8;
  }

  atualizar(t) {
    for (const p of this.pecas) {
      if (!p.objeto.visible) continue;
      if (p.entrada === null) {
        p.objeto.position.copy(p.posicaoFinal);
        p.objeto.scale.setScalar(1);
        continue;
      }
      const k = THREE.MathUtils.clamp((t - p.entrada) / 0.8, 0, 1);
      const suave = 1 - Math.pow(1 - k, 3);
      const quique = k < 1 ? Math.sin(k * Math.PI) * 0.15 : 0;
      p.objeto.position.copy(p.posicaoFinal);
      p.objeto.position.y += (1 - suave) * 8;
      p.objeto.scale.setScalar(Math.max(0.001, suave + quique));
    }
  }
}
