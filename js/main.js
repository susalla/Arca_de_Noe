import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { Arca, ALTURA } from './arca.js';
import { Noe, Ajudantes, Animais } from './personagens.js';
import { Cenario } from './cenario.js';

const params = new URLSearchParams(location.search);
const MODO_VIDEO = params.has('video');

const PADRAO = { dia: 1, perfil: '@arca_do_noee', seguidores: 0, seguidoresOntem: 0, meta: 10000, novosAjudantes: [], animais: [], animaisOntem: null };

async function carregarProgresso() {
  let dados = { ...PADRAO };
  try {
    const r = await fetch('progresso.json', { cache: 'no-store' });
    if (r.ok) dados = { ...dados, ...(await r.json()) };
  } catch (e) {
    console.warn('Não consegui ler progresso.json, usando valores padrão.', e);
  }
  // Atalhos para testar: ?seguidores=500&ontem=420&dia=7&animais=ovelha,leao
  if (params.has('seguidores')) dados.seguidores = Number(params.get('seguidores'));
  if (params.has('ontem')) dados.seguidoresOntem = Number(params.get('ontem'));
  if (params.has('dia')) dados.dia = Number(params.get('dia'));
  if (params.has('meta')) dados.meta = Number(params.get('meta'));
  if (params.has('animais')) dados.animais = params.get('animais').split(',').filter(Boolean);
  if (params.has('nomes')) dados.novosAjudantes = params.get('nomes').split(',').filter(Boolean);
  dados.seguidoresOntem = Math.min(dados.seguidoresOntem ?? dados.seguidores, dados.seguidores);
  // Por padrão, o último casal da lista é o "novo do dia" e chega andando.
  if (!Array.isArray(dados.animaisOntem)) dados.animaisOntem = dados.animais.slice(0, Math.max(0, dados.animais.length - 1));
  return dados;
}

const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

async function iniciar() {
  const dados = await carregarProgresso();
  if (MODO_VIDEO) document.body.classList.add('video');

  const canvas = document.getElementById('cena');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: MODO_VIDEO });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(MODO_VIDEO ? 55 : 45, 1, 0.1, 400);

  const cenario = new Cenario(cena);
  const arca = new Arca();
  cena.add(arca.grupo);

  const noe = new Noe();
  noe.grupo.position.set(-3.5, 0, 9.5);
  noe.grupo.rotation.y = 0.35;
  cena.add(noe.grupo);

  const ajudantes = new Ajudantes();
  cena.add(ajudantes.grupo);

  const animais = new Animais();
  cena.add(animais.grupo);

  // ----- Estado do dia
  const INICIO = MODO_VIDEO ? 2.8 : 0.8; // no vídeo, primeiro mostramos o Noé de perto
  const pecasHoje = arca.pecasLiberadas(dados.seguidores, dados.meta);
  const pecasOntem = arca.pecasLiberadas(dados.seguidoresOntem, dados.meta);
  const novasPecas = pecasHoje - pecasOntem;
  const intervalo = novasPecas > 0 ? Math.min(0.35, 4 / novasPecas) : 0.35;
  arca.configurar(pecasOntem, pecasHoje, INICIO, intervalo);
  ajudantes.definir(dados.seguidores, dados.seguidoresOntem, dados.novosAjudantes, INICIO, 3);
  animais.definir(dados.animais, dados.animaisOntem.length, Math.max(INICIO + 1, arca.fimDasEntradas - 1));
  const progresso = pecasHoje / arca.total;
  cenario.definirClima(progresso);

  // ----- HUD
  const $ = (id) => document.getElementById(id);
  $('hud-dia').textContent = `Dia ${dados.dia}`;
  $('hud-perfil').textContent = dados.perfil;
  $('hud-animais').textContent = animais.emojis(dados.animais);
  const ganho = dados.seguidores - dados.seguidoresOntem;
  if (ganho > 0) {
    $('ganho').hidden = false;
    $('ganho').textContent = `+${fmt(ganho)} ${ganho === 1 ? 'ajudante novo' : 'ajudantes novos'} hoje!`;
  }
  const proxima = arca.proximaPeca(dados.seguidores, dados.meta);
  $('hud-proxima').textContent = proxima
    ? `Próxima peça: ${proxima.nome} — faltam ${fmt(proxima.faltam)} ${proxima.faltam === 1 ? 'seguidor' : 'seguidores'}`
    : 'A arca está pronta! Agora é chamar os animais 🐘🦒';

  const duracaoContagem = Math.max(2, arca.fimDasEntradas - INICIO);
  function atualizarHud(t) {
    const k = THREE.MathUtils.smoothstep(t, INICIO, INICIO + duracaoContagem);
    const contador = dados.seguidoresOntem + (dados.seguidores - dados.seguidoresOntem) * k;
    const pecas = pecasOntem + (pecasHoje - pecasOntem) * k;
    $('hud-ajudantes').textContent = fmt(contador);
    $('hud-ajudantes-rotulo').textContent = Math.round(contador) === 1 ? 'ajudante' : 'ajudantes';
    const pct = (pecas / arca.total) * 100;
    $('hud-barra').style.width = `${pct}%`;
    $('hud-porcentagem').textContent = `${Math.floor(pct)}%`;
  }

  // ----- Câmera
  const alvoArca = new THREE.Vector3(0, ALTURA * 0.55, 0);
  const cabecaNoe = new THREE.Vector3().copy(noe.grupo.position).add(new THREE.Vector3(0, 1.9, 0));
  let controles = null;

  if (!MODO_VIDEO) {
    controles = new OrbitControls(camera, canvas);
    controles.target.copy(alvoArca);
    controles.enableDamping = true;
    controles.maxPolarAngle = Math.PI * 0.48;
    controles.minDistance = 6;
    controles.maxDistance = 90;
    controles.autoRotate = true;
    controles.autoRotateSpeed = 0.4;
    controles.addEventListener('start', () => { controles.autoRotate = false; });
  }

  // Duração do vídeo: no mínimo 12s, mais se o dia tiver muita coisa nova.
  const fimAnimais = animais.lista.reduce((m, a) => Math.max(m, (a.entrada ?? 0) + 1.2), 0);
  const DURACAO_VIDEO = Math.max(12, arca.fimDasEntradas + 3, fimAnimais + 2.5);

  const posA = new THREE.Vector3(), alvo = new THREE.Vector3();
  function cameraDoVideo(t) {
    // 1) close no Noé martelando
    const close = new THREE.Vector3(cabecaNoe.x + 2.6, 2.6, cabecaNoe.z + 6.2);
    // 2) recua e revela a obra  3) dá uma volta lenta
    const anguloInicial = Math.atan2(30, 14);
    const orbita = (tt) => {
      const a = anguloInicial + tt * 0.06;
      return new THREE.Vector3(Math.cos(a) * 33, 13, Math.sin(a) * 33);
    };
    const k = THREE.MathUtils.smoothstep(t, 1.6, 4.2);
    posA.copy(close).lerp(orbita(Math.max(0, t - 4.2)), k);
    if (t > 4.2) posA.copy(orbita(t - 4.2));
    alvo.copy(cabecaNoe).lerp(alvoArca, k);
    camera.position.copy(posA);
    camera.lookAt(alvo);
  }

  function ajustarTamanho() {
    let w = window.innerWidth, h = window.innerHeight;
    if (MODO_VIDEO) { w = 540; h = 960; }
    renderer.setSize(w, h, false);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    camera.aspect = w / h;
    // Em tela de celular (retrato), afasta a câmera para caber a arca inteira.
    camera.fov = MODO_VIDEO ? 55 : (camera.aspect < 0.8 ? 62 : 45);
    camera.updateProjectionMatrix();
  }
  ajustarTamanho();
  window.addEventListener('resize', ajustarTamanho);
  if (!MODO_VIDEO) camera.position.set(16, 12, camera.aspect < 0.8 ? 42 : 32);

  function renderizarEm(t) {
    arca.atualizar(t);
    noe.atualizar(t);
    ajudantes.atualizar(t);
    animais.atualizar(t);
    cenario.atualizar(t);
    atualizarHud(t);
    if (MODO_VIDEO) cameraDoVideo(t);
    else controles.update();
    renderer.render(cena, camera);
  }

  document.getElementById('carregando').classList.add('sumir');

  if (MODO_VIDEO) {
    // O script de gravação controla o tempo quadro a quadro (resultado sempre igual).
    window.__duracao = DURACAO_VIDEO;
    window.__renderizarEm = renderizarEm;
    renderizarEm(0);
    window.__pronto = true;
    if (!params.has('gravando')) {
      const t0 = performance.now();
      renderer.setAnimationLoop(() => renderizarEm(((performance.now() - t0) / 1000) % DURACAO_VIDEO));
    }
  } else {
    const t0 = performance.now();
    renderer.setAnimationLoop(() => renderizarEm((performance.now() - t0) / 1000));
  }
}

iniciar().catch((e) => {
  console.error(e);
  document.getElementById('carregando').textContent = 'Ops, o Noé tropeçou. Recarregue a página.';
});
