// Efeitos reutilizáveis dos vídeos: chuva, raios, etiquetas, legendas palavra
// por palavra, feixes de luz, ondas de choque e explosões de partículas.
// Tudo é função do tempo t (determinístico para gravação quadro a quadro).
import * as THREE from 'three';

export const ss = THREE.MathUtils.smoothstep;
export const lerp = THREE.MathUtils.lerp;
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function mulberry(s) {
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ------------------------------------------------------------ Chuva
export class Chuva {
  constructor(cena, n = 3200) {
    this.n = n;
    this.base = [];
    const rnd = mulberry(99);
    for (let i = 0; i < n; i++) this.base.push([(rnd() - 0.5) * 90, rnd() * 34, (rnd() - 0.5) * 90, rnd()]);
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 6);
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

export function brilhoDoRaio(t, raios) {
  let b = 0;
  for (const r of raios) {
    const d = t - r;
    if (d < 0 || d > 0.6) continue;
    b = Math.max(b, Math.exp(-d * 14) + (d > 0.09 ? 0.7 * Math.exp(-(d - 0.09) * 10) : 0));
  }
  return Math.min(1, b);
}

// ------------------------------------------------------------ Etiqueta 3D
export function etiqueta3D(texto, { fundo = '#ffd23f', cor = '#111', altura = 0.42, fonte = 46 } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const f = `900 ${fonte}px "DejaVu Sans", sans-serif`;
  ctx.font = f;
  const w = Math.ceil(ctx.measureText(texto).width) + 44;
  c.width = w; c.height = 84;
  ctx.font = f;
  ctx.fillStyle = fundo; ctx.beginPath(); ctx.roundRect(3, 3, w - 6, 78, 39); ctx.fill();
  ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texto, w / 2, 45);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.userData.escala = [(w / 84) * altura, altura];
  s.scale.set(...s.userData.escala, 1);
  s.renderOrder = 20;
  return s;
}

// ------------------------------------------------------------ Legendas
// Palavra por palavra: a palavra acende quando é falada (tempos da transcrição).
export class Legendas {
  constructor(elemento, falas, palavras = []) {
    this.el = elemento;
    this.falas = falas;
    const listas = falas.map(([, , texto]) => texto.split(' ').map((tk) => ({ texto: tk.replaceAll('*', ''), destaque: tk.includes('*') })));
    const total = listas.reduce((n, l) => n + l.length, 0);
    // Se a transcrição tem exatamente as mesmas palavras das legendas, distribui em ordem
    // (robusto a pequenas diferenças de tempo); senão, usa a janela de tempo de cada fala.
    let k = 0;
    this.tokens = listas.map((tokens, i) => {
      const [ini, fim] = falas[i];
      const ditas = palavras.length === total ? palavras.slice(k, k + tokens.length) : palavras.filter((w) => w.t >= ini - 0.15 && w.t < fim);
      k += tokens.length;
      tokens.forEach((tk, j) => { tk.t = ditas.length === tokens.length ? ditas[j].t : ini + ((fim - ini - 0.4) * j) / tokens.length; });
      return tokens;
    });
  }
  atualizar(t) {
    const i = this.falas.findIndex(([a, b]) => t >= a && t < b);
    if (i < 0) { this.el.style.opacity = '0'; return false; }
    if (this.el.dataset.f !== String(i)) {
      this.el.innerHTML = this.tokens[i].map((tk) => `<span class="p${tk.destaque ? ' em' : ''}">${tk.texto}</span>`).join(' ');
      this.el.dataset.f = String(i);
    }
    const k = Math.min(1, (t - this.falas[i][0]) / 0.18);
    this.el.style.opacity = '1';
    this.el.style.transform = `scale(${0.88 + 0.12 * (1 - Math.pow(1 - k, 3))})`;
    this.el.querySelectorAll('.p').forEach((el, j) => {
      const dt = t - this.tokens[i][j].t;
      const dita = dt >= -0.02;
      el.style.opacity = dita ? '1' : '0.4';
      el.style.transform = dita && dt < 0.16 ? `scale(${1 + 0.16 * Math.sin((dt / 0.16) * Math.PI)})` : 'none';
    });
    return true;
  }
}

// ------------------------------------------------------------ Feixe de luz
export class Feixe {
  constructor(cena, cor = '#ffd76a') {
    this.mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.malha = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 40, 18, 1, true), this.mat);
    this.nucleo = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 40, 10, 1, true), this.mat.clone());
    this.grupo = new THREE.Group();
    this.grupo.add(this.malha, this.nucleo);
    this.grupo.position.y = 20;
    this.grupo.visible = false;
    cena.add(this.grupo);
  }
  // pousa: instante do pouso. Aparece 0,45 s antes e some 0,7 s depois.
  atualizar(t, x, z, pousa) {
    const a = ss(t, pousa - 0.45, pousa - 0.15) * (1 - ss(t, pousa + 0.1, pousa + 0.75));
    this.grupo.visible = a > 0.01;
    this.grupo.position.x = x; this.grupo.position.z = z;
    this.mat.opacity = 0.32 * a;
    this.nucleo.material.opacity = 0.75 * a;
    const pulso = 1 + 0.08 * Math.sin(t * 40);
    this.grupo.scale.set(pulso, 1, pulso);
  }
}

// ------------------------------------------------------------ Onda de choque
export class Onda {
  constructor(cena, cor = '#fff2b0') {
    this.mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.malha = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 48).rotateX(-Math.PI / 2), this.mat);
    this.malha.position.y = 0.06;
    this.malha.visible = false;
    cena.add(this.malha);
  }
  atualizar(t, x, z, inicio, raio = 5, dur = 0.65) {
    const k = (t - inicio) / dur;
    this.malha.visible = k > 0 && k < 1;
    if (!this.malha.visible) return;
    const e = 1 - Math.pow(1 - k, 2);
    this.malha.position.x = x; this.malha.position.z = z;
    this.malha.scale.setScalar(0.3 + e * raio);
    this.mat.opacity = 0.85 * (1 - k);
  }
}

// ------------------------------------------------------------ Explosão de partículas
// Faíscas/poeira saindo de um ponto, com gravidade. Posições calculadas por t.
export class Explosao {
  constructor(cena, { n = 70, cor = '#ffd76a', tamanho = 0.14, velocidade = 4, subida = 4, gravidade = 9, dur = 1.1, semente = 1 } = {}) {
    const rnd = mulberry(semente);
    this.n = n; this.dur = dur; this.gravidade = gravidade;
    this.vel = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = (0.35 + rnd() * 0.65) * velocidade;
      this.vel.push([Math.cos(a) * r, subida * (0.4 + rnd() * 0.8), Math.sin(a) * r]);
    }
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.PointsMaterial({ color: cor, size: tamanho, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.pontos = new THREE.Points(this.geo, this.mat);
    this.pontos.frustumCulled = false;
    this.pontos.visible = false;
    cena.add(this.pontos);
  }
  atualizar(t, origem, inicio) {
    const d = t - inicio;
    this.pontos.visible = d >= 0 && d < this.dur;
    if (!this.pontos.visible) return;
    for (let i = 0; i < this.n; i++) {
      const [vx, vy, vz] = this.vel[i];
      this.pos[i * 3] = origem.x + vx * d;
      this.pos[i * 3 + 1] = Math.max(0.03, origem.y + vy * d - 0.5 * this.gravidade * d * d);
      this.pos[i * 3 + 2] = origem.z + vz * d;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.mat.opacity = 1 - d / this.dur;
  }
}
