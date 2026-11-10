import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { Arca, ALTURA, LARGURA, PORTA } from './arca.js';
import { Noe, Ajudantes, Animais } from './personagens.js';
import { Cenario } from './cenario.js';
import { RotinaDoNoe, PONTOS } from './noe-rotina.js';
import { Jogador, Joystick, Teclado } from './jogador.js';

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
const $ = (id) => document.getElementById(id);
const guardar = { ler: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, gravar: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } } };

const FALAS_DO_NOE = [
  'Ei, ajudante! Bem-vindo à obra! 🔨',
  'Pega um martelo! O dilúvio não espera. ⛈️',
  'Sua vaga na arca já está garantida 🎟️',
  'Quanto mais gente, mais rápido a gente constrói!',
  'Qual animal você vai trazer? 🦒🐘',
  'Siga @arca_do_noee e apareça no vídeo de amanhã!',
];

async function iniciar() {
  const dados = await carregarProgresso();
  if (MODO_VIDEO) document.body.classList.add('video');

  const canvas = $('cena');
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
  noe.grupo.position.copy(PONTOS.bancada);
  cena.add(noe.grupo);
  const rotina = new RotinaDoNoe(noe, cena);

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
  cenario.definirClima(pecasHoje / arca.total);

  // ----- Textos (painel do site e HUD do vídeo)
  const ganho = dados.seguidores - dados.seguidoresOntem;
  const proxima = arca.proximaPeca(dados.seguidores, dados.meta);
  const textoProxima = proxima
    ? `Próxima peça: ${proxima.nome} · faltam ${fmt(proxima.faltam)} ${proxima.faltam === 1 ? 'seguidor' : 'seguidores'}`
    : 'Arca pronta! Agora é chamar os animais 🐘🦒';
  const emojis = animais.emojis(dados.animais);

  $('hud-dia').textContent = `Dia ${dados.dia}`;
  $('hud-perfil').textContent = dados.perfil;
  $('hud-animais').textContent = emojis;
  $('hud-proxima').textContent = textoProxima;
  if (ganho > 0) {
    $('ganho').hidden = false;
    $('ganho').textContent = `+${fmt(ganho)} ${ganho === 1 ? 'ajudante novo' : 'ajudantes novos'} hoje!`;
    $('painel-ganho').hidden = false;
    $('painel-ganho').textContent = `+${fmt(ganho)} hoje`;
  }
  $('painel-dia').textContent = `Dia ${dados.dia}`;
  $('painel-proxima').textContent = textoProxima;
  $('painel-animais').textContent = emojis;
  $('seguir-perfil').textContent = dados.perfil;

  // Painel recolhível (lembra a escolha do visitante)
  const painel = $('painel');
  const definirRecolhido = (sim) => {
    painel.classList.toggle('recolhido', sim);
    $('painel-topo').setAttribute('aria-expanded', String(!sim));
  };
  definirRecolhido(guardar.ler('painel-recolhido') === '1');
  $('painel-topo').addEventListener('click', () => {
    const sim = !painel.classList.contains('recolhido');
    definirRecolhido(sim);
    guardar.gravar('painel-recolhido', sim ? '1' : '0');
  });

  const duracaoContagem = Math.max(2, arca.fimDasEntradas - INICIO);
  function atualizarTextos(t) {
    const k = THREE.MathUtils.smoothstep(t, INICIO, INICIO + duracaoContagem);
    const contador = dados.seguidoresOntem + (dados.seguidores - dados.seguidoresOntem) * k;
    const pct = ((pecasOntem + (pecasHoje - pecasOntem) * k) / arca.total) * 100;
    const rotulo = Math.round(contador) === 1 ? 'ajudante' : 'ajudantes';
    if (MODO_VIDEO) {
      $('hud-ajudantes').textContent = fmt(contador);
      $('hud-ajudantes-rotulo').textContent = rotulo;
      $('hud-barra').style.width = `${pct}%`;
      $('hud-porcentagem').textContent = `${Math.floor(pct)}%`;
    } else {
      $('painel-ajudantes').textContent = fmt(contador);
      $('painel-ajudantes-rotulo').textContent = `${rotulo} · arca ${Math.floor(pct)}%`;
      $('painel-barra').style.width = `${pct}%`;
    }
  }

  // ----- Câmera
  const alvoArca = new THREE.Vector3(0, ALTURA * 0.55, 0);
  const cabecaNoe = () => noe.grupo.position.clone().add(new THREE.Vector3(0, 2.2, 0));
  let controles = null;

  function posicaoOrbita() { return new THREE.Vector3(26, 18, camera.aspect < 0.8 ? 66 : 50); }

  if (!MODO_VIDEO) {
    controles = new OrbitControls(camera, canvas);
    controles.target.copy(alvoArca);
    controles.enableDamping = true;
    controles.maxPolarAngle = Math.PI * 0.48;
    controles.minDistance = 6;
    controles.maxDistance = 150;
    controles.autoRotate = true;
    controles.autoRotateSpeed = 0.4;
    controles.addEventListener('start', () => { controles.autoRotate = false; });
  }

  // Duração do vídeo: no mínimo 12s, mais se o dia tiver muita coisa nova.
  const fimAnimais = animais.lista.reduce((m, a) => Math.max(m, (a.entrada ?? 0) + 1.2), 0);
  const DURACAO_VIDEO = Math.max(12, arca.fimDasEntradas + 3, fimAnimais + 2.5);

  function cameraDoVideo(t) {
    // 1) close no Noé trabalhando  2) recua e revela a obra  3) volta lenta
    const cab = cabecaNoe();
    const close = new THREE.Vector3(cab.x + 2.6, 2.6, cab.z + 6.2);
    const anguloInicial = Math.atan2(30, 14);
    const orbita = (tt) => { const a = anguloInicial + tt * 0.06; return new THREE.Vector3(Math.cos(a) * 52, 19, Math.sin(a) * 52); };
    const k = THREE.MathUtils.smoothstep(t, 1.6, 4.2);
    const pos = t > 4.2 ? orbita(t - 4.2) : close.clone().lerp(orbita(0), k);
    camera.position.copy(pos);
    camera.lookAt(cab.lerp(alvoArca, k));
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
  if (!MODO_VIDEO) camera.position.copy(posicaoOrbita());

  // ----- Modo exploração
  const obstaculoNoe = { x: 0, z: 0, r: 0.55 };
  const jogador = new Jogador(cena, arca, [
    obstaculoNoe,
    { x: -3.5, z: 12.35, r: 1.3 },  // bancada
    { x: -7.5, z: 8, r: 1.7 },      // pilha de toras
    { x: -12, z: 7.7, r: 1.1 },     // pilha de tábuas
    ...cenario.arvores,
  ]);
  let explorando = false;
  let teclado = null, joystick = null;
  if (!MODO_VIDEO) {
    teclado = new Teclado();
    joystick = new Joystick($('joystick'));

    // Arrastar no cenário gira a câmera do jogador
    let arrasto = null;
    canvas.addEventListener('pointerdown', (e) => { if (explorando) { arrasto = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); } });
    canvas.addEventListener('pointermove', (e) => {
      if (!arrasto || e.pointerId !== arrasto.id) return;
      jogador.girarCamera(e.clientX - arrasto.x, e.clientY - arrasto.y);
      arrasto.x = e.clientX; arrasto.y = e.clientY;
    });
    const fimArrasto = (e) => { if (arrasto && e.pointerId === arrasto.id) arrasto = null; };
    canvas.addEventListener('pointerup', fimArrasto);
    canvas.addEventListener('pointercancel', fimArrasto);

    let timerDica = null;
    $('explorar').addEventListener('click', () => {
      explorando = true;
      document.body.classList.add('explorando');
      controles.enabled = false;
      controles.autoRotate = false;
      jogador.entrar();
      definirRecolhido(true);
      for (const id of ['joystick', 'sair', 'dica']) $(id).hidden = false;
      $('dica').style.opacity = '1';
      clearTimeout(timerDica);
      timerDica = setTimeout(() => { $('dica').style.opacity = '0'; }, 7000);
      canvas.focus?.();
    });
    $('sair').addEventListener('click', () => {
      explorando = false;
      document.body.classList.remove('explorando');
      jogador.sair();
      for (const id of ['joystick', 'sair', 'dica', 'aviso', 'balao']) $(id).hidden = true;
      definirRecolhido(guardar.ler('painel-recolhido') === '1');
      camera.position.copy(posicaoOrbita());
      controles.target.copy(alvoArca);
      controles.enabled = true;
    });
  }

  // ----- Avisos de contexto e balão do Noé
  let falaInicio = null;
  function mostrarAviso(texto) {
    const el = $('aviso');
    el.hidden = !texto;
    if (texto && el.textContent !== texto) el.textContent = texto;
  }
  function atualizarInteracao(tReal, conversando) {
    if (!explorando) return;
    const p = jogador.pos;
    if (jogador.dentro) mostrarAviso('🐾 Você está dentro da arca! Procure a placa da sua vaga.');
    else if (Math.abs(p.x) < 22 && Math.abs(p.z) < LARGURA / 2 + 4) {
      mostrarAviso(arca.podeEntrar() ? '🚪 Suba a rampa para entrar na arca' : '🚧 A arca ainda está em obra. Siga @arca_do_noee para ajudar!');
    } else if (arca.podeEntrar() && Math.abs(p.x - PORTA.x) < 4 && p.z > PORTA.z && p.z < PORTA.z + PORTA.alcance + 4) {
      mostrarAviso('🚪 Suba a rampa para entrar na arca');
    } else mostrarAviso('');

    const balao = $('balao');
    if (conversando) {
      if (falaInicio === null) falaInicio = tReal;
      const i = Math.floor((tReal - falaInicio) / 3.6) % FALAS_DO_NOE.length;
      if (balao.textContent !== FALAS_DO_NOE[i]) balao.textContent = FALAS_DO_NOE[i];
      const s = cabecaNoe().add(new THREE.Vector3(0, 0.6, 0)).project(camera);
      balao.hidden = s.z > 1;
      balao.style.left = `${(s.x * 0.5 + 0.5) * innerWidth}px`;
      balao.style.top = `${(-s.y * 0.5 + 0.5) * innerHeight}px`;
    } else {
      falaInicio = null;
      balao.hidden = true;
    }
  }

  // ----- Laço
  let tRotina = 0;
  let ultimo = null;
  function renderizarEm(t) {
    const dt = ultimo === null ? 0 : Math.min(0.05, Math.max(0, t - ultimo));
    ultimo = t;
    arca.atualizar(t);

    // A rotina do Noé pausa enquanto ele conversa com o jogador
    const conversando = rotina.atualizar(MODO_VIDEO ? t : tRotina, t, explorando ? jogador.pos : null);
    if (!conversando) tRotina += dt;
    obstaculoNoe.x = noe.grupo.position.x; obstaculoNoe.z = noe.grupo.position.z;

    ajudantes.atualizar(t);
    animais.atualizar(t);
    cenario.atualizar(t);
    atualizarTextos(t);

    if (MODO_VIDEO) cameraDoVideo(t);
    else if (explorando) {
      const tec = teclado.eixo();
      const entrada = Math.hypot(joystick.x, joystick.y) > 0.05 ? { x: joystick.x, y: joystick.y, correr: false } : tec;
      jogador.atualizar(dt, entrada, camera);
    } else controles.update();

    atualizarInteracao(t, conversando);
    renderer.render(cena, camera);
  }

  $('carregando').classList.add('sumir');

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
    // Para testes automáticos
    window.__jogo = {
      jogador, arca, noe, rotina, camera,
      explorar: () => $('explorar').click(),
      // congela o laço e desenha um quadro com o Noé num instante da rotina
      quadroDoNoe: (tr) => { renderer.setAnimationLoop(null); rotina.atualizar(tr, tr, null); renderer.render(cena, camera); },
    };
  }
}

iniciar().catch((e) => {
  console.error(e);
  $('carregando').textContent = 'Ops, o Noé tropeçou. Recarregue a página.';
});
