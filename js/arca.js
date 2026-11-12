// A arca é montada a partir de peças geradas por código (low-poly).
// Escala: 1 unidade = 1 metro. Todas as peças já nascem na posição final
// (sem escala/rotação "escondida"), só a animação de entrada mexe no transform.
import * as THREE from 'three';

// Grande de propósito: perto dela, o Noé e os ajudantes parecem formiguinhas.
export const COMPRIMENTO = 40;
export const LARGURA = 11;
export const ALTURA = 8;
export const ELEVACAO = 0.7; // altura dos suportes: o casco fica acima do chão

const META_X = COMPRIMENTO / 2;
// Altura (local, a partir do fundo) do piso interno; a porta abre exatamente nele.
const PISO_LOCAL = 3.0;
const PORTA_ALTURA = 3.4;

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
    const x = i * (COMPRIMENTO / 10);
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
  const cabL = COMPRIMENTO * 0.55, cabW = LARGURA * 0.55, cabH = ALTURA * 0.45, esp = 0.22;
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
      janelas.add(caixa(1.3, 0.9, 0.05, i * (cabL / 8), deckY + cabH * 0.62, lado * (cabW / 2 + 0.1), corJanela));
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
  const alcanceRampa = 9;
  const meioPorta = PISO_LOCAL + PORTA_ALTURA / 2;
  const zCostado = meiaLargura(xPorta, meioPorta);
  const porta = caixa(3, PORTA_ALTURA, 0.12, xPorta, baseY(xPorta) + meioPorta, zCostado + 0.05, corJanela);
  add('Porta', porta);

  const baseRampaY = baseY(xPorta) + PISO_LOCAL;
  const comprimentoRampa = Math.hypot(baseRampaY, alcanceRampa);
  const rampa = caixa(3, 0.2, comprimentoRampa, xPorta, baseRampaY / 2, zCostado + alcanceRampa / 2, corMadeira(70));
  rampa.rotation.x = Math.atan2(baseRampaY, alcanceRampa);
  add('Rampa', rampa);

  return pecas;
}

// Porta e rampa (usadas pelo modo exploração para entrar na arca)
export const PORTA = (() => {
  const x = 3, alcance = 9;
  const z = meiaLargura(x, PISO_LOCAL + PORTA_ALTURA / 2);
  const nivel = baseY(x) + PISO_LOCAL; // piso interno = soleira da porta = topo da rampa
  return { x, largura: 3, z, nivel, alcance };
})();

// Interior: piso na altura da porta, lanternas, feno e a baia "SUA VAGA"
function criarInterior() {
  const g = new THREE.Group();
  const nivel = PORTA.nivel;
  const pos = [], idx = [];
  const seg = 48;
  for (let i = 0; i <= seg; i++) {
    const x = -META_X + COMPRIMENTO * (i / seg);
    const yLocal = nivel - baseY(x);
    const w = yLocal > 0 ? Math.max(0, meiaLargura(x, yLocal) - 0.05) : 0;
    pos.push(x, nivel, -w, x, nivel, w);
  }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const piso = new THREE.Mesh(geo, material(new THREE.Color('#8f5a2a')));
  piso.receiveShadow = true;
  g.add(piso);

  // Baias de madeira dos dois lados do corredor central
  const corBaia = new THREE.Color('#7a4a22');
  for (let i = -5; i <= 5; i++) {
    const x = i * 2.6;
    if (Math.abs(x - PORTA.x) < 2) continue; // corredor da porta livre
    for (const lado of [-1, 1]) {
      const w = meiaLargura(x, nivel - baseY(x));
      if (w < 2.6) continue;
      const divisoria = caixa(0.12, 1.2, w - 1.4, x, nivel + 0.6, lado * (1.4 + (w - 1.4) / 2), corBaia);
      g.add(divisoria);
      const feno = caixa(1.0, 0.5, 0.7, x + 1.2, nivel + 0.25, lado * (w - 0.8), new THREE.Color('#d8b65a'));
      feno.rotation.y = 0.2 * lado;
      g.add(feno);
    }
  }

  // Lanternas (luz quente) penduradas no teto
  const luzes = [];
  for (const x of [-10, 0, 10]) {
    const lanterna = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshStandardMaterial({ color: '#ffcf6b', emissive: '#ffb340', emissiveIntensity: 1.5 }));
    lanterna.position.set(x, baseY(x) + ALTURA - 1.2, 0);
    const luz = new THREE.PointLight('#ffc070', 0, 26, 1.2);
    luz.position.copy(lanterna.position);
    g.add(lanterna, luz);
    luzes.push(luz);
  }

  // Placa da sua vaga, logo na entrada
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#3d2614'; x.fillRect(0, 0, 512, 256);
  x.strokeStyle = '#d9b45a'; x.lineWidth = 12; x.strokeRect(10, 10, 492, 236);
  x.fillStyle = '#ffd23f'; x.font = '900 64px "DejaVu Sans", sans-serif'; x.textAlign = 'center';
  x.fillText('🎟️ SUA VAGA', 256, 110);
  x.fillStyle = '#fff'; x.font = '700 34px "DejaVu Sans", sans-serif';
  x.fillText('reservada para ajudantes', 256, 175);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: tex }));
  // De frente para a porta: é a primeira coisa que o visitante vê ao entrar
  placa.position.set(PORTA.x, nivel + 1.55, -meiaLargura(PORTA.x, PISO_LOCAL + 1.55) + 0.3);
  g.add(placa);

  g.visible = false;
  return { grupo: g, luzes };
}

// Quantos seguidores são necessários para liberar a peça i.
// Curva quadrática: no começo cada poucos seguidores já mostram progresso.
// Curva de liberação das peças: 1.25 é quase linear (uma peça a cada ~180 seguidores com meta 10.000).
// Era 2 (quadrática), mas os seguidores cresceram rápido e a obra precisava durar mais.
export const EXPOENTE_CURVA = 1.25;

export function limiarDaPeca(i, total, meta) {
  if (i === 0) return 1;
  return Math.max(i + 1, Math.round(meta * Math.pow((i + 1) / total, EXPOENTE_CURVA)));
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
    this.interior = criarInterior();
    this.grupo.add(this.interior.grupo);
  }

  temPeca(nome) { return this.pecas.some((p) => p.nome === nome && p.objeto.visible); }

  // Casco fechado = todas as tábuas no lugar (só então dá para "entrar" na arca)
  cascoFechado() { return this.pecas.filter((p) => p.nome.startsWith('Tábua')).every((p) => p.objeto.visible); }

  podeEntrar() { return this.cascoFechado() && this.temPeca('Porta') && this.temPeca('Rampa'); }

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
    const fechado = this.cascoFechado();
    this.interior.grupo.visible = fechado;
    this.interior.luzes.forEach((l) => { l.intensity = fechado ? 6 : 0; });
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
