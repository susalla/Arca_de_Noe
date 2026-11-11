// Vídeo 03: "A chuva está chegando". Tudo é função do tempo t.
// Tempos em js/video03-tempos.js · Roteiro em docs/roteiro-video-03.md
import * as THREE from 'three';
import { Arca, baseY } from './arca.js';
import { Noe, Ajudantes, criarAnimal, baterAsas, TIPOS_DE_ANIMAIS } from './personagens.js';
import { Cenario } from './cenario.js';
import { Chuva, etiqueta3D, Legendas, Feixe, Onda, Explosao, ss, lerp, V, mulberry } from './efeitos.js';
import { DURACAO, FALAS, CENAS, RAIOS, PEDIDOS, AJUDANTES_COMENTARIO, MARCOS, COMENTARIOS } from './video03-tempos.js';

let PALAVRAS = [];
try {
  const r = await fetch('audio/video03-palavras.json', { cache: 'no-store' });
  if (r.ok) PALAVRAS = await r.json();
} catch { /* legendas por frase */ }

const $ = (id) => document.getElementById(id);
const cenaEm = (t) => {
  let i = 0;
  while (i + 1 < CENAS.length && t >= CENAS[i + 1][0]) i++;
  return { indice: i, nome: CENAS[i][1], inicio: CENAS[i][0], fim: CENAS[i + 1] ? CENAS[i + 1][0] : DURACAO };
};
const yawParaCamera = -Math.PI / 2; // animais olham para +x; isso vira para +z (câmera)

// ------------------------------------------------------------ Montagem
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
arca.configurar(1, 1); // cavaletes do dia 2 já estão de pé
cena.add(arca.grupo);
const chuva = new Chuva(cena);
const legendas = new Legendas($('legenda'), FALAS, PALAVRAS);

const C = V(-1, 0, 11.5);
const noe = new Noe();
noe.cajado.visible = false;
cena.add(noe.grupo);
const CABECA = C.clone().add(V(0, 2.2, 0.6));

// Os 10 ajudantes do dia 2 + os 65 novos (multidão em volta da arca)
const ajudantes = new Ajudantes();
ajudantes.definir(10, 10, []);
cena.add(ajudantes.grupo);
const [INI_MULTIDAO, DUR_MULTIDAO] = MARCOS.multidao;
const pousoAjudante = (i) => INI_MULTIDAO + ((i - 10) / 65) * DUR_MULTIDAO + 0.5;
const feixesMultidao = Array.from({ length: 11 }, (_, k) => ({ i: 10 + k * 6, feixe: new Feixe(cena) }));

// ------------------------------------------------------------ Relâmpagos
function criarRaio(semente, base) {
  const rnd = mulberry(semente);
  const pontos = [];
  let x = base.x, z = base.z;
  for (let y = 46; y >= 0; y -= 3.2) { pontos.push(V(x, y, z)); x += (rnd() - 0.5) * 3.2; z += (rnd() - 0.5) * 1.6; }
  pontos.push(V(base.x, 0, base.z));
  const mat = new THREE.MeshBasicMaterial({ color: '#e9f1ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos, false, 'catmullrom', 0.1), 80, 0.22, 5), mat));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos, false, 'catmullrom', 0.1), 80, 0.7, 5), mat.clone()));
  // galho
  const meio = pontos[Math.floor(pontos.length * 0.45)];
  const galho = [meio.clone(), meio.clone().add(V(3, -4, 1)), meio.clone().add(V(5, -9, 0.5))];
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(galho), 20, 0.12, 4), mat.clone()));
  g.visible = false;
  cena.add(g);
  return { grupo: g, base, onda: new Onda(cena, '#cfe3ff'), faiscas: new Explosao(cena, { n: 90, cor: '#dbe9ff', tamanho: 0.2, velocidade: 8, subida: 6, dur: 0.9, semente }) };
}
const raios = RAIOS.map((r, i) => ({ t: r, ...criarRaio(11 + i, [V(-9, 0, -22), V(7, 0, -15), V(-13, 0, -19)][i]) }));
function brilho(t) {
  let b = 0;
  for (const r of raios) {
    const d = t - r.t;
    if (d < 0 || d > 0.6) continue;
    b = Math.max(b, Math.exp(-d * 12) + (d > 0.1 ? 0.7 * Math.exp(-(d - 0.1) * 9) : 0));
  }
  return Math.min(1, b);
}
function atualizarRaios(t) {
  for (const r of raios) {
    const d = t - r.t;
    const on = (d >= 0 && d < 0.07) || (d >= 0.1 && d < 0.3);
    r.grupo.visible = on;
    r.grupo.children.forEach((m, k) => { m.material.opacity = on ? (k === 1 ? 0.35 : 1) * (1 - Math.max(0, d - 0.1) / 0.25) : 0; });
    r.onda.atualizar(t, r.base.x, r.base.z, r.t, 9, 0.8);
    r.faiscas.atualizar(t, r.base.clone().add(V(0, 0.3, 0)), r.t);
  }
}

// ------------------------------------------------------------ Pássaros
// Bando fugindo (silhuetas escuras)
const bando = Array.from({ length: 22 }, (_, i) => {
  const rnd = mulberry(500 + i);
  const p = criarAnimal('urubu', i);
  p.scale.setScalar(0.42 + rnd() * 0.15);
  const dados = { x0: -16 - rnd() * 16, y: 9 + rnd() * 8, z: -6 - rnd() * 16, vel: 18 + rnd() * 6, fase: rnd() * 6 };
  p.userData.voo = dados;
  cena.add(p);
  return p;
});
// Pássaros dos pedidos: voam de longe e pousam em cima dos cavaletes
const topoCavalete = (x) => baseY(x) + 0.1;
function criarAve(tipo, xPouso, pousa, chegaDe) {
  const envoltorio = new THREE.Group();
  const corpo = criarAnimal(tipo, 3);
  envoltorio.add(corpo);
  cena.add(envoltorio);
  const pedido = PEDIDOS[tipo];
  const rot = etiqueta3D(`${pedido.arroba} ${TIPOS_DE_ANIMAIS[tipo].emoji}`, { fundo: '#ffd23f', altura: 0.5, fonte: 44 });
  cena.add(rot);
  return { tipo, envoltorio, corpo, rot, destino: V(xPouso, topoCavalete(xPouso), 0.05), pousa, origem: chegaDe };
}
const aves = [
  criarAve('aguia', -4, MARCOS.aguiaPousa, V(34, 20, -30)),
  criarAve('gaviao', 0, MARCOS.gaviaoPousa, V(38, 24, -26)),
  criarAve('urubu', 4, MARCOS.urubuPousa, V(36, 18, -32)),
  criarAve('picapau', -8, MARCOS.picapauPousa, V(-30, 16, -20)),
];
const lascas = new Explosao(cena, { n: 18, cor: '#e7c08a', tamanho: 0.12, velocidade: 1.8, subida: 2.6, gravidade: 9, dur: 0.45, semente: 77 });

// ------------------------------------------------------------ Cachorro, leões e pantera (caem do céu)
function criarChegada(tipo, chave, pos, pousa, yawExtra = 0) {
  const a = criarAnimal(tipo, 9);
  a.position.copy(pos);
  a.rotation.y = yawParaCamera + yawExtra;
  cena.add(a);
  const pedido = PEDIDOS[chave];
  const rot = etiqueta3D(`${pedido.arroba} ${TIPOS_DE_ANIMAIS[tipo].emoji}`, { fundo: '#ffd23f', altura: 0.55, fonte: 44 });
  cena.add(rot);
  return { a, rot, pos, pousa, feixe: new Feixe(cena), onda: new Onda(cena), poeira: new Explosao(cena, { n: 90, semente: 30 + pousa * 10, cor: '#e8c58a', tamanho: 0.17, velocidade: 4.5, subida: 3, dur: 1.2 }), alturaRot: tipo === 'cachorro' ? 1.6 : 2.3 };
}
const chegadas = [
  criarChegada('cachorro', 'cachorro', C.clone().add(V(-2.2, 0, 1.6)), MARCOS.cachorroPousa, 0.3),
  criarChegada('leao', 'leao1', C.clone().add(V(2.4, 0, 0.7)), MARCOS.leao1Pousa, 0.25),
  criarChegada('leao', 'leao2', C.clone().add(V(3.9, 0, -0.5)), MARCOS.leao2Pousa, 0.15),
  criarChegada('pantera', 'pantera', C.clone().add(V(-3.4, 0, 0.3)), MARCOS.panteraPousa, -0.25),
];

// Quilha, fundo e 1ª costela (peças 1 a 3) com ondas e faíscas ao encaixar
const efeitosPecas = [0, 1, 2].map((k) => ({
  fim: MARCOS.pecasInicio + k * MARCOS.pecasPasso + 0.8,
  onda: new Onda(cena, '#ffe9a8'),
  faiscas: new Explosao(cena, { n: 160, cor: '#ffd76a', tamanho: 0.2, velocidade: 9, subida: 5, dur: 1.3, semente: 200 + k }),
}));
const rotuloQuilha = etiqueta3D(`${PEDIDOS.arca.arroba} virou a quilha 😅`, { fundo: '#ffffff', altura: 0.95, fonte: 44 });
rotuloQuilha.position.set(0, 0.6, 6.5);
cena.add(rotuloQuilha);

// ------------------------------------------------------------ Clima
function clima(c, t) {
  switch (c.nome) {
    case 'gancho': return { tempestade: lerp(0.35, 0.85, ss(t, 0, 1.0)), chuva: 0 };
    case 'desespero': return { tempestade: 0.85, chuva: 0 };
    case 'reviravolta': case 'picapau': case 'arca': return { tempestade: 0.55, chuva: 0 };
    case 'multidao': return { tempestade: 0.5, chuva: 0 };
    case 'upgrade': return { tempestade: lerp(0.55, 0.8, ss(t, c.inicio, c.fim)), chuva: 0 };
    case 'final': return { tempestade: lerp(0.8, 1, ss(t, c.inicio, c.inicio + 1.5)), chuva: ss(t, ...MARCOS.chuvaFinal) };
  }
  return { tempestade: 0.5, chuva: 0 };
}

// ------------------------------------------------------------ Câmera
function cameraEm(c, t) {
  const k = ss(t, c.inicio, c.fim);
  let p0, p1, a0, a1;
  switch (c.nome) {
    case 'gancho': {
      // de baixo, olhando o céu com os pássaros e o raio; termina no rosto do Noé
      const vira = ss(t, 2.2, 3.2);
      const pos = V(C.x + 2.2, 1.1, C.z + 6.5).lerp(V(C.x + 1.2, 1.9, C.z + 5.2), vira);
      const alvo = V(C.x - 2, 9, C.z - 20).lerp(CABECA, vira);
      return [pos, alvo];
    }
    case 'desespero': {
      const ang = lerp(-0.55, 0.55, k); // sempre de frente para o Noé
      return [V(C.x + Math.sin(ang) * 6.5, 2.3, C.z + 0.6 + Math.cos(ang) * 6.5), noe.grupo.position.clone().add(V(0, 1.6, 0))];
    }
    case 'reviravolta': {
      if (t < 8.3) return [V(C.x + 1, 2, C.z + 7.5), V(14, 9, -14).lerp(V(0, 2, 0), ss(t, 7.3, 8.3))];
      if (t < 10.2) { const u = ss(t, 8.3, 10.2); return [V(3, 4.5, 15).lerp(V(2, 3.5, 12), u), V(0, 1.2, 0)]; }
      const u = ss(t, 10.2, c.fim);
      return [V(6.2, 2.0, 5.2).lerp(V(5.4, 1.7, 4.2), u), V(4, 1.3, 0)];
    }
    case 'picapau': p0 = V(-6.4, 1.8, 3.6); p1 = V(-6.9, 1.5, 2.9); a0 = V(-8, 1.1, 0); a1 = V(-8, 1.05, 0); break;
    case 'arca': p0 = V(C.x + 0.2, 2.3, C.z + 4.6); p1 = V(C.x + 0.1, 2.25, C.z + 3.7); a0 = CABECA.clone(); a1 = CABECA.clone(); break;
    case 'multidao': {
      if (t < 23.3) { const u = ss(t, c.inicio, 23.3); return [V(10, 18, 44).lerp(V(6, 13, 38), u), V(0, 1, 4)]; }
      const u = ss(t, 23.3, c.fim);
      return [V(C.x + 2.6, 2.7, C.z + 8.6).lerp(V(C.x + 2.3, 2.5, C.z + 7.6), u), V(C.x + 2.0, 2.4, C.z + 0.2)];
    }
    case 'upgrade': p0 = V(15, 7.5, 24); p1 = V(9, 9.5, 27); a0 = V(0, 1.6, 0); a1 = V(0, 2.0, 0); break;
    case 'final': p0 = V(C.x + 0.6, 2.3, C.z + 5.2); p1 = V(C.x + 0.3, 2.3, C.z + 4.3); a0 = CABECA.clone(); a1 = CABECA.clone(); break;
  }
  return [p0.clone().lerp(p1, k), a0.clone().lerp(a1, k)];
}

// ------------------------------------------------------------ Noé
function poseDoNoe(c, t) {
  const n = noe;
  n.corpo.rotation.set(0, 0, 0); n.corpo.position.set(0, 0, 0);
  n.bracoDir.rotation.set(-0.3, 0, 0); n.bracoEsq.rotation.set(0, 0, 0.25);
  n.pes.forEach((p, i) => p.position.set((i ? 1 : -1) * 0.16, 0.05, 0.05));
  n.martelo.visible = false;
  const pos = C.clone().add(V(0, 0, 0.6));
  let yaw = 0;
  const tremor = (a) => Math.sin(t * 40) * a;
  switch (c.nome) {
    case 'gancho':
      n.corpo.rotation.x = -0.32; // olhando para o céu
      n.bracoDir.rotation.set(-0.3, 0, 2.6 + tremor(0.05)); n.bracoEsq.rotation.set(-0.3, 0, -2.6 - tremor(0.05)); // mãos na cabeça
      break;
    case 'desespero': {
      if (t < 5.6) {
        // corre de um lado para o outro
        const u = (t - 3.2) * 2.4;
        pos.x += Math.sin(u) * 2.4;
        yaw = Math.cos(u) > 0 ? Math.PI / 2 : -Math.PI / 2;
        const passo = Math.sin(t * 16);
        n.pes[0].position.z = 0.05 + passo * 0.22; n.pes[1].position.z = 0.05 - passo * 0.22;
        n.corpo.position.y = Math.abs(passo) * 0.08;
        n.bracoDir.rotation.set(0, 0, 2.3 + passo * 0.4); n.bracoEsq.rotation.set(0, 0, -2.3 + passo * 0.4);
      } else {
        // para e clama aos céus
        n.corpo.rotation.x = -0.3;
        n.bracoDir.rotation.set(-0.2, 0, 2.8 + tremor(0.08)); n.bracoEsq.rotation.set(-0.2, 0, -2.8 - tremor(0.08));
      }
      break;
    }
    case 'reviravolta':
      yaw = t < 10.2 ? -0.35 : 0.6;
      n.bracoDir.rotation.set(-1.9, 0, 0.3); // apontando
      if (t > 10.4) { n.corpo.rotation.x = 0.12; n.bracoDir.rotation.set(-0.6, 0, 0); n.bracoEsq.rotation.set(-0.6, 0, 0); } // desconfiado
      break;
    case 'picapau': yaw = -0.9; n.bracoEsq.rotation.set(0, 0, 0.9); n.bracoDir.rotation.set(0, 0, -0.9 + 1.8); break;
    case 'arca': {
      // encara a câmera em silêncio, depois fala seco
      const [e0, e1] = MARCOS.encarar;
      n.corpo.rotation.x = t > e0 && t < e1 ? 0.05 : 0;
      n.bracoEsq.rotation.set(0, 0, 0.9); n.bracoDir.rotation.set(0, 0, 0.9);
      break;
    }
    case 'multidao': n.bracoDir.rotation.set(0, 0, 2.5 + Math.sin(t * 8) * 0.2); n.bracoEsq.rotation.set(0, 0, -2.5 - Math.sin(t * 8) * 0.2); pos.y = Math.abs(Math.sin(t * 6)) * 0.1; break;
    case 'upgrade': yaw = Math.PI * 0.85; n.bracoDir.rotation.set(-1.8 + Math.sin(t * 9) * 0.3, 0, 0); break;
    case 'final': {
      n.bracoDir.rotation.set(-0.2, 0, 2.6 + Math.sin(t * 10) * 0.35); n.bracoEsq.rotation.set(-0.2, 0, -2.6 - Math.sin(t * 10) * 0.35);
      n.corpo.rotation.x = -0.1;
      break;
    }
  }
  n.grupo.position.copy(pos);
  n.grupo.rotation.y = yaw;
}

// ------------------------------------------------------------ HUD
let grupoComentario = -1;
function hud(c, t) {
  legendas.atualizar(t);
  $('dia').textContent = 'DIA 3';
  const alerta = c.nome === 'gancho' || c.nome === 'desespero' || c.nome === 'final';
  $('alerta').style.opacity = alerta ? String(0.75 + 0.25 * Math.sin(t * 10)) : '0';

  const cont = $('contador');
  if (c.nome === 'multidao') {
    const n = Math.round(65 * ss(t, INI_MULTIDAO + 0.5, INI_MULTIDAO + DUR_MULTIDAO + 0.5));
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = `+${n} AJUDANTES`;
  } else if (c.nome === 'upgrade') {
    cont.style.opacity = '1'; cont.style.background = 'rgba(46,125,50,.92)'; cont.style.fontSize = '22px';
    cont.textContent = '75 AJUDANTES';
  } else if (c.nome === 'final') {
    cont.style.opacity = String(ss(t, c.inicio + 0.3, c.inicio + 0.6));
    cont.style.background = 'rgba(20,90,140,.92)'; cont.style.fontSize = '17px';
    cont.textContent = 'PRÓXIMA PEÇA: 2ª COSTELA · FALTAM 8 👀';
  } else cont.style.opacity = '0';

  const prog = $('progresso');
  prog.style.opacity = c.nome === 'upgrade' || c.nome === 'final' ? '1' : '0';
  const pecas = 1 + [0, 1, 2].filter((k) => t >= MARCOS.pecasInicio + k * MARCOS.pecasPasso + 0.8).length;
  $('barra').style.width = `${(pecas / arca.total) * 100}%`;
  $('progresso-rotulo').textContent = `ARCA ${Math.round((pecas / arca.total) * 100)}%`;

  // Carimbos em sequência
  document.querySelectorAll('.carimbo').forEach((el, k) => {
    const t0 = MARCOS.pecasInicio + k * MARCOS.pecasPasso + 0.85;
    const e = Math.min(1, Math.max(0, (t - t0) / 0.25));
    const some = ss(t, 30.6, 31.0);
    el.style.opacity = String(Math.min(1, e * 3) * (1 - some));
    el.style.transform = `scale(${e > 0 ? lerp(1.8, 1, e) : 0}) rotate(-8deg)`;
  });

  // Prints dos pedidos (um ou mais empilhados)
  const iGrupo = COMENTARIOS.findIndex((g) => t >= g.inicio && t < g.fim);
  const caixa = $('comentarios');
  if (iGrupo !== grupoComentario) {
    grupoComentario = iGrupo;
    caixa.innerHTML = iGrupo < 0 ? '' : COMENTARIOS[iGrupo].prints.map((p) => {
      const chave = Object.keys(PEDIDOS).find((k) => PEDIDOS[k].print === p);
      const tipo = chave.startsWith('leao') ? 'leao' : chave;
      const emoji = TIPOS_DE_ANIMAIS[tipo]?.emoji ?? '🛶';
      return `<div class="comentario"><div class="cabeca">💬 PEDIDO NOS COMENTÁRIOS</div><img src="assets/comentarios/${p}.png" alt=""><div class="bicho">${emoji}</div></div>`;
    }).join('');
  }
  if (iGrupo >= 0) {
    const g = COMENTARIOS[iGrupo];
    caixa.querySelectorAll('.comentario').forEach((el, j) => {
      const t0 = g.inicio + j * 0.15;
      const e = Math.min(1, Math.max(0, (t - t0) / 0.28));
      const sai = ss(t, g.fim - 0.25, g.fim);
      const escala = (e < 1 ? 1 - Math.pow(1 - e, 3) + Math.sin(e * Math.PI) * 0.12 : 1) * (1 - sai * 0.3);
      el.style.opacity = String(Math.min(1, e * 2) * (1 - sai));
      el.style.transform = `translateY(${-sai * 30}px) scale(${escala}) rotate(${j % 2 ? 2 : -3}deg)`;
    });
  }

  // Cartão de seguir + recado
  const card = $('cartao');
  const kc = ss(t, MARCOS.cartao, MARCOS.cartao + 0.35);
  card.style.transform = `translateX(-50%) scale(${kc * (1 + Math.sin(Math.min(1, Math.max(0, t - MARCOS.cartao) / 0.35) * Math.PI) * 0.08)})`;
  const toque = t > MARCOS.toque;
  const botao = card.querySelector('.botao');
  botao.textContent = toque ? 'Seguindo ✓' : 'Seguir';
  botao.style.background = toque ? '#efefef' : '#0095f6';
  botao.style.color = toque ? '#111' : '#fff';
  const cur = $('cursor');
  cur.style.opacity = String(ss(t, MARCOS.toque - 0.7, MARCOS.toque - 0.5) * (1 - ss(t, MARCOS.toque + 0.7, MARCOS.toque + 1.0)));
  const kcur = ss(t, MARCOS.toque - 0.6, MARCOS.toque - 0.05);
  cur.style.transform = `translate(${lerp(90, 0, kcur)}px, ${lerp(140, 0, kcur)}px) scale(${t > MARCOS.toque - 0.05 && t < MARCOS.toque + 0.15 ? 0.85 : 1})`;
  $('recado').style.opacity = String(ss(t, MARCOS.toque + 0.6, MARCOS.toque + 0.9));
}

// ------------------------------------------------------------ Quadro
let cenaAtual = -1;
function renderizarEm(t) {
  const c = cenaEm(t);
  if (c.indice !== cenaAtual) {
    cenaAtual = c.indice;
    if (c.nome === 'multidao') ajudantes.definir(75, 10, AJUDANTES_COMENTARIO, INI_MULTIDAO, DUR_MULTIDAO);
    else if (c.nome === 'upgrade' || c.nome === 'final') ajudantes.definir(75, 75, AJUDANTES_COMENTARIO);
    else ajudantes.definir(10, 10, []);
    if (c.nome === 'upgrade' || c.nome === 'final') arca.configurar(1, 4, MARCOS.pecasInicio, MARCOS.pecasPasso);
    else arca.configurar(1, 1);
  }

  const { tempestade, chuva: intensidadeChuva } = clima(c, t);
  cenario.definirClima(tempestade);
  const raio = brilho(t);
  cenario.hemisferica.intensity += raio * 2.5;
  $('flash').style.opacity = String(raio * 0.7);
  $('escuro').style.opacity = String(ss(tempestade, 0.3, 1) * 0.6 * (1 - raio * 0.8));
  renderer.toneMappingExposure = 1 - ss(tempestade, 0.3, 1) * 0.28;
  cenario.atualizar(t * 3);
  chuva.atualizar(t, intensidadeChuva);
  atualizarRaios(t);

  // Bando fugindo
  const [r0, r1] = MARCOS.revoada;
  for (const p of bando) {
    const d = p.userData.voo;
    const u = t - r0;
    p.visible = t >= r0 && t < r1 + 0.5;
    if (!p.visible) continue;
    p.position.set(d.x0 + u * d.vel, d.y + Math.sin(u * 3 + d.fase) * 0.6, d.z);
    p.rotation.y = 0; // voando para +x
    baterAsas(p, 1, t * 16 + d.fase);
  }

  // Aves dos pedidos: voo em arco até o cavalete, depois pousadas viradas para a câmera
  for (const a of aves) {
    const voo = 1.6;
    const u = (t - (a.pousa - voo)) / voo;
    const ativo = t >= a.pousa - voo && c.nome !== 'gancho' && c.nome !== 'desespero';
    a.envoltorio.visible = ativo;
    a.rot.visible = false;
    if (!ativo) continue;
    if (u < 1) {
      const e = 1 - Math.pow(1 - u, 2);
      const p = a.origem.clone().lerp(a.destino, e);
      p.y += Math.sin(u * Math.PI) * 3;
      a.envoltorio.position.copy(p);
      const dir = a.destino.clone().sub(a.origem);
      a.envoltorio.rotation.y = Math.atan2(-dir.z, dir.x);
      baterAsas(a.corpo, 1, t * 14);
      a.corpo.rotation.z = 0;
    } else {
      a.envoltorio.position.copy(a.destino);
      a.envoltorio.rotation.y = yawParaCamera + (a.tipo === 'picapau' ? 1.1 : 0);
      const fecha = Math.min(1, (t - a.pousa) / 0.35);
      baterAsas(a.corpo, 1 - fecha, t * 14);
      a.corpo.rotation.z = 0;
      a.corpo.userData.cabeca.rotation.x = 0;
      if (a.tipo === 'urubu' && t > a.pousa + 0.6) a.corpo.userData.cabeca.rotation.x = Math.sin(Math.min(1, (t - a.pousa - 0.6) / 0.4) * Math.PI / 2) * 0.55; // inclina a cabeça
      if (a.tipo === 'picapau') {
        const [b0, b1] = MARCOS.bicadas;
        if (t >= b0 && t < b1) {
          a.corpo.rotation.z = -0.15 - Math.abs(Math.sin((t - b0) * Math.PI * 11)) * 0.75; // bica sem parar
          const periodo = 0.27;
          lascas.atualizar(t, a.destino.clone().add(V(0.15, 0.05, 0.25)), b0 + Math.floor((t - b0) / periodo) * periodo);
        } else lascas.atualizar(t, V(), -99);
      }
      // @ em cima do pássaro, nas cenas em que ele está em destaque
      const destaque = { aguia: ['reviravolta'], gaviao: ['reviravolta'], urubu: ['reviravolta'], picapau: ['picapau'] }[a.tipo].includes(c.nome);
      a.rot.visible = false && destaque; // o print do comentário já mostra o @
      a.rot.position.copy(a.destino).add(V(0, a.tipo === 'picapau' ? 1.25 : 1.75, 0));
      const ke = ss(t, a.pousa + 0.1, a.pousa + 0.3);
      const fator = c.nome === 'reviravolta' && t < 10.2 ? 1.7 : 1;
      a.rot.scale.set(a.rot.userData.escala[0] * ke * fator, a.rot.userData.escala[1] * ke * fator, 1);
    }
  }

  // Cachorro, leões e pantera
  for (const ch of chegadas) {
    const dur = ch.a === chegadas[0].a ? 0.45 : 0.85;
    const vis = t >= ch.pousa - dur && (c.nome === 'multidao' || c.nome === 'upgrade' || c.nome === 'final');
    ch.a.visible = vis;
    ch.feixe.atualizar(t, ch.pos.x, ch.pos.z, ch.pousa);
    ch.onda.atualizar(t, ch.pos.x, ch.pos.z, ch.pousa, 4.5);
    ch.poeira.atualizar(t, ch.pos.clone().add(V(0, 0.2, 0)), ch.pousa);
    if (vis) {
      const k = Math.min(1, (t - (ch.pousa - dur)) / dur);
      ch.a.position.set(ch.pos.x, (1 - k * k) * 9, ch.pos.z);
      const amassa = t > ch.pousa ? 1 - Math.sin(Math.min(1, (t - ch.pousa) / 0.3) * Math.PI) * 0.15 : 1;
      ch.a.scale.set(1 + (1 - amassa) * 0.4, amassa, 1 + (1 - amassa) * 0.4);
    }
    // só o cachorro ganha etiqueta 3D; leões e pantera já aparecem nos prints
    const mostra = vis && c.nome === 'multidao' && t > ch.pousa && ch === chegadas[0];
    ch.rot.visible = mostra;
    ch.rot.position.copy(ch.pos).add(V(0, ch.alturaRot, 0));
    const ke = ss(t, ch.pousa, ch.pousa + 0.2);
    ch.rot.scale.set(ch.rot.userData.escala[0] * ke, ch.rot.userData.escala[1] * ke, 1);
  }

  // Multidão: alguns feixes acompanhando quem cai
  for (const { i, feixe } of feixesMultidao) {
    const d = ajudantes.dados[i];
    feixe.atualizar(c.nome === 'multidao' ? t : -99, d.x, d.z, pousoAjudante(i));
  }
  ajudantes.atualizar(t);

  // Peças da arca + efeitos
  arca.atualizar(t);
  for (const e of efeitosPecas) {
    e.onda.atualizar(t, 0, 0, e.fim, 16, 1.0);
    e.faiscas.atualizar(t, V(0, 1.2, 0), e.fim);
  }
  const [q0, q1] = MARCOS.rotuloQuilha;
  const kq = ss(t, q0, q0 + 0.25) * (1 - ss(t, q1 - 0.25, q1));
  rotuloQuilha.visible = kq > 0.01 && c.nome === 'upgrade';
  rotuloQuilha.scale.set(rotuloQuilha.userData.escala[0] * kq, rotuloQuilha.userData.escala[1] * kq, 1);
  $('ouro').style.opacity = String(Math.max(...efeitosPecas.map((e) => Math.max(0, 1 - Math.abs(t - e.fim) / 0.35))) * 0.8);

  poseDoNoe(c, t);

  const [pos, alvo] = cameraEm(c, t);
  const impacto = (t0, forca, dec = 5) => (t >= t0 ? Math.exp(-(t - t0) * dec) * forca : 0);
  const tremor = raio * 0.3 + efeitosPecas.reduce((s, e) => s + impacto(e.fim, 0.35, 5), 0) + (c.nome === 'desespero' ? 0.04 : 0);
  pos.x += Math.sin(t * 61) * tremor; pos.y += Math.cos(t * 47) * tremor;
  camera.position.copy(pos);
  camera.lookAt(alvo);

  hud(c, t);
  renderer.render(cena, camera);
}

// Pré-carrega prints e foto do perfil
const imagens = [...new Set(COMENTARIOS.flatMap((g) => g.prints))].map((p) => `assets/comentarios/${p}.png`).concat(['assets/perfil.jpg']);
await Promise.all(imagens.map((src) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = src; })));

window.__duracao = DURACAO;
window.__renderizarEm = renderizarEm;
renderizarEm(0);
window.__pronto = true;

if (!new URLSearchParams(location.search).has('gravando')) {
  const t0 = performance.now();
  renderer.setAnimationLoop(() => renderizarEm(((performance.now() - t0) / 1000) % DURACAO));
}
