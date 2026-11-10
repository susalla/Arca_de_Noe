// Modo exploração: o visitante vira um ajudante e caminha pela obra.
// Controles: joystick na tela (toque/mouse), WASD/setas, Shift para correr,
// arrastar no cenário para girar a câmera.
import * as THREE from 'three';
import { COMPRIMENTO, ALTURA, PORTA, meiaLargura, baseY } from './arca.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.8, flatShading: true });
const RAIO = 0.35;           // "largura" do jogador para colisões
const LIMITE_MUNDO = 70; // o chão é plano até 72 m (ver cenario.js)
const ANDAR = 4.2, CORRER = 7.5; // m/s

// ------------------------------------------------------------ Joystick
export class Joystick {
  constructor(elemento) {
    this.el = elemento;
    this.base = elemento.querySelector('.base');
    this.pino = elemento.querySelector('.pino');
    this.x = 0; this.y = 0; this.id = null;
    const raio = () => this.base.getBoundingClientRect().width / 2;
    const mover = (e) => {
      const r = this.base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy), max = raio();
      if (d > max) { dx *= max / d; dy *= max / d; }
      this.x = dx / max; this.y = dy / max;
      this.pino.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const soltar = (e) => {
      if (e.pointerId !== this.id) return;
      this.id = null; this.x = 0; this.y = 0;
      this.pino.style.transform = 'translate(0, 0)';
    };
    elemento.addEventListener('pointerdown', (e) => {
      this.id = e.pointerId;
      elemento.setPointerCapture(e.pointerId);
      mover(e);
      e.preventDefault();
    });
    elemento.addEventListener('pointermove', (e) => { if (e.pointerId === this.id) mover(e); });
    elemento.addEventListener('pointerup', soltar);
    elemento.addEventListener('pointercancel', soltar);
  }
}

// ------------------------------------------------------------ Teclado
export class Teclado {
  constructor() {
    this.teclas = new Set();
    addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      this.teclas.add(e.key.toLowerCase());
    });
    addEventListener('keyup', (e) => this.teclas.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.teclas.clear());
  }
  eixo() {
    const t = this.teclas;
    const x = (t.has('d') || t.has('arrowright') ? 1 : 0) - (t.has('a') || t.has('arrowleft') ? 1 : 0);
    const y = (t.has('s') || t.has('arrowdown') ? 1 : 0) - (t.has('w') || t.has('arrowup') ? 1 : 0);
    return { x, y, correr: t.has('shift') };
  }
}

// ------------------------------------------------------------ Avatar
function criarAvatar() {
  const g = new THREE.Group();
  const corpo = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.85, 8), mat('#ffd23f'));
  tronco.position.y = 0.72;
  const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.08, 8), mat('#7a4a22'));
  cinto.position.y = 0.55;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), mat('#f1c27d'));
  cabeca.position.y = 1.36;
  const chapeu = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.14, 8), mat('#c0392b'));
  chapeu.position.y = 1.56;
  const olhos = [-1, 1].map((l) => { const o = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), mat('#111')); o.position.set(l * 0.08, 1.4, 0.19); return o; });
  corpo.add(tronco, cinto, cabeca, chapeu, ...olhos);
  const pernas = [-1, 1].map((l) => {
    const p = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.16), mat('#5a3a1d'));
    m.position.y = -0.16;
    p.add(m);
    p.position.set(l * 0.12, 0.32, 0);
    return p;
  });
  const bracos = [-1, 1].map((l) => {
    const b = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.48, 0.11), mat('#ffd23f'));
    m.position.y = -0.22;
    b.add(m);
    b.position.set(l * 0.33, 1.05, 0);
    return b;
  });
  corpo.add(...bracos);
  g.add(corpo, ...pernas);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  // Etiqueta "VOCÊ"
  const c = document.createElement('canvas'); c.width = 256; c.height = 80;
  const x = c.getContext('2d');
  x.fillStyle = '#ffd23f'; x.beginPath(); x.roundRect(4, 4, 248, 72, 36); x.fill();
  x.fillStyle = '#111'; x.font = '900 44px "DejaVu Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('VOCÊ', 128, 43);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const rotulo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  rotulo.scale.set(1.1, 0.34, 1); rotulo.position.y = 2.05; rotulo.renderOrder = 30;
  g.add(rotulo);
  return { grupo: g, corpo, pernas, bracos, rotulo };
}

// ------------------------------------------------------------ Mundo
// Diz onde o jogador pode pisar e empurra para fora do que é sólido.
class Mundo {
  constructor(arca, obstaculos) {
    this.arca = arca;
    this.obstaculos = obstaculos; // [{x, z, r}]
  }

  rampaAltura(x, z) {
    if (!this.arca.temPeca('Rampa')) return null;
    if (Math.abs(x - PORTA.x) > PORTA.largura / 2) return null;
    const u = (z - PORTA.z) / PORTA.alcance; // 0 no casco, 1 no chão
    if (u < -0.02 || u > 1) return null;
    return PORTA.nivel * (1 - Math.max(0, u));
  }

  // Meia-largura do casco (por fora) na altura da cabeça do jogador:
  // dá para ficar embaixo da "barriga" do casco, mas não atravessá-lo.
  larguraCasco(x, yMundo) {
    if (Math.abs(x) >= COMPRIMENTO / 2) return 0;
    const yLocal = Math.min(ALTURA, Math.max(0.2, yMundo + 1.7 - baseY(x)));
    return meiaLargura(x, yLocal);
  }

  // Resolve a nova posição. `dentro`: jogador está dentro da arca.
  resolver(pos, novo, dentro) {
    const a = this.arca;
    if (dentro) {
      // Dentro: piso fixo na altura da porta, paredes do casco ao redor.
      novo.y = PORTA.nivel;
      const lim = Math.max(0.4, meiaLargura(novo.x, PORTA.nivel - baseY(novo.x)) - RAIO - 0.15);
      const naPorta = Math.abs(novo.x - PORTA.x) < PORTA.largura / 2 - RAIO;
      if (novo.z > lim) {
        if (naPorta) return { pos: V(novo.x, PORTA.nivel, PORTA.z + 0.4), dentro: false }; // saiu pela porta, para o topo da rampa
        novo.z = lim;
      }
      if (novo.z < -lim) novo.z = -lim;
      const xMax = COMPRIMENTO / 2 - 3.5;
      novo.x = Math.max(-xMax, Math.min(xMax, novo.x));
      return { pos: novo, dentro: true };
    }

    // Fora
    const fechado = a.cascoFechado();
    const temFundo = a.temPeca('Fundo do casco');
    // A rampa só "pega" quem já está nela ou chega pelo pé (nada de teleporte por baixo)
    const rampa = this.rampaAltura(novo.x, novo.z);
    let y = 0;
    if (rampa !== null && (pos.y > 0.05 || rampa < 0.45)) y = rampa;
    const naRampa = y > 0;

    // Estava no alto da rampa no quadro anterior? (correndo, dá para pular o trecho final num quadro só)
    const vinhaDoTopo = pos.y > PORTA.nivel * 0.5 && Math.abs(pos.x - PORTA.x) < PORTA.largura / 2 + 0.3 && pos.z >= PORTA.z - 0.2;
    if ((naRampa || vinhaDoTopo) && novo.z <= PORTA.z + 0.15) {
      // Topo da rampa: entra pela porta (se a arca estiver pronta) ou para ali
      if (a.podeEntrar() && Math.abs(novo.x - PORTA.x) < PORTA.largura / 2 - RAIO) {
        const lim = meiaLargura(novo.x, PORTA.nivel - baseY(novo.x)) - RAIO - 0.15;
        return { pos: V(novo.x, PORTA.nivel, Math.min(lim - 0.4, 1.2)), dentro: true }; // um passo para dentro
      }
      novo.z = PORTA.z + 0.15;
      y = this.rampaAltura(novo.x, novo.z) ?? PORTA.nivel;
      novo.y = y;
      return { pos: novo, dentro: false };
    }

    if (!naRampa) {
      const w = this.larguraCasco(novo.x, 0);
      const noContorno = Math.abs(novo.x) < COMPRIMENTO / 2 && Math.abs(novo.z) < w + RAIO;
      if (noContorno) {
        if (fechado) {
          // Parede: empurra para fora pelo lado de onde veio
          novo.z = Math.sign(pos.z || novo.z || 1) * (w + RAIO);
        } else if (temFundo) {
          // Obra aberta: dá para andar entre as costelas, por cima do fundo
          y = baseY(novo.x) + 0.08;
        }
      }
    }

    // Obstáculos simples (Noé, bancada, pilhas)
    for (const o of this.obstaculos) {
      const dx = novo.x - o.x, dz = novo.z - o.z, d = Math.hypot(dx, dz), min = o.r + RAIO;
      if (d < min && d > 1e-4) { novo.x = o.x + (dx / d) * min; novo.z = o.z + (dz / d) * min; }
    }
    const r = Math.hypot(novo.x, novo.z);
    if (r > LIMITE_MUNDO) { novo.x *= LIMITE_MUNDO / r; novo.z *= LIMITE_MUNDO / r; }
    novo.y = y;
    return { pos: novo, dentro: false };
  }
}

// ------------------------------------------------------------ Jogador
export class Jogador {
  constructor(cena, arca, obstaculos) {
    this.avatar = criarAvatar();
    this.avatar.grupo.visible = false;
    cena.add(this.avatar.grupo);
    this.mundo = new Mundo(arca, obstaculos);
    this.pos = V(6, 0, 24);
    this.yaw = Math.PI;      // direção do corpo
    this.camYaw = 0;         // câmera atrás do jogador (0 = olhando para -z)
    this.camPitch = 0.32;
    this.dentro = false;
    this.ativo = false;
    this.passo = 0;
    this.yVisual = 0;
    this.camPos = V();
  }

  entrar() {
    this.ativo = true;
    this.pos.set(6, 0, 24);
    this.dentro = false;
    this.camYaw = 0; this.camPitch = 0.32;
    this.avatar.grupo.visible = true;
    this.camPos.set(6, 4, 31);
  }

  sair() {
    this.ativo = false;
    this.avatar.grupo.visible = false;
  }

  girarCamera(dx, dy) {
    this.camYaw -= dx * 0.006;
    this.camPitch = Math.max(-0.1, Math.min(1.1, this.camPitch + dy * 0.004));
  }

  // entrada: {x, y, correr} em -1..1 (y negativo = para frente)
  atualizar(dt, entrada, camera) {
    if (!this.ativo) return;
    const intensidade = Math.min(1, Math.hypot(entrada.x, entrada.y));
    const correr = entrada.correr || intensidade > 0.92;
    let andando = false;
    if (intensidade > 0.08) {
      // movimento relativo à câmera
      const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
      const rx = Math.cos(this.camYaw), rz = -Math.sin(this.camYaw);
      const mx = rx * entrada.x + fx * -entrada.y;
      const mz = rz * entrada.x + fz * -entrada.y;
      const len = Math.hypot(mx, mz) || 1;
      const vel = (correr ? CORRER : ANDAR) * Math.min(1, intensidade * 1.15);
      const novo = this.pos.clone().add(V((mx / len) * vel * dt, 0, (mz / len) * vel * dt));
      const r = this.mundo.resolver(this.pos, novo, this.dentro);
      this.pos.copy(r.pos);
      this.dentro = r.dentro;
      const alvo = Math.atan2(mx, mz);
      let d = alvo - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * 12);
      this.passo += dt * vel * 2.2;
      andando = true;
    } else {
      // parado: ainda aplica o chão (ex.: a rampa sumiu)
      const r = this.mundo.resolver(this.pos, this.pos.clone(), this.dentro);
      this.pos.copy(r.pos); this.dentro = r.dentro;
    }

    // Avatar
    const av = this.avatar;
    this.yVisual += (this.pos.y - this.yVisual) * Math.min(1, dt * 14);
    av.grupo.position.set(this.pos.x, this.yVisual, this.pos.z);
    av.grupo.rotation.y = this.yaw;
    const s = andando ? Math.sin(this.passo) : 0;
    av.pernas[0].rotation.x = s * 0.7; av.pernas[1].rotation.x = -s * 0.7;
    av.bracos[0].rotation.x = -s * 0.6; av.bracos[1].rotation.x = s * 0.6;
    av.corpo.position.y = andando ? Math.abs(s) * 0.06 : Math.sin(performance.now() / 500) * 0.01;

    // Câmera em terceira pessoa (mais perto dentro da arca)
    const dist = this.dentro ? 4.4 : 6.5;
    const pitch = this.dentro ? Math.min(Math.max(this.camPitch, 0.25), 0.6) : this.camPitch;
    av.rotulo.visible = !this.dentro;
    const alvo = V(this.pos.x, this.yVisual + 1.4, this.pos.z);
    const desejada = V(
      alvo.x + Math.sin(this.camYaw) * Math.cos(pitch) * dist,
      alvo.y + Math.sin(pitch) * dist,
      alvo.z + Math.cos(this.camYaw) * Math.cos(pitch) * dist,
    );
    if (this.dentro) {
      // não deixa a câmera atravessar o casco nem o convés
      const lim = meiaLargura(desejada.x, PORTA.nivel - baseY(desejada.x)) - 0.4;
      desejada.z = Math.max(-lim, Math.min(lim, desejada.z));
      desejada.y = Math.min(desejada.y, baseY(desejada.x) + ALTURA - 0.5);
      const xMax = COMPRIMENTO / 2 - 3;
      desejada.x = Math.max(-xMax, Math.min(xMax, desejada.x));
    } else {
      desejada.y = Math.max(desejada.y, 0.6);
    }
    this.camPos.lerp(desejada, Math.min(1, dt * 8));
    camera.position.copy(this.camPos);
    camera.lookAt(alvo);
  }
}
