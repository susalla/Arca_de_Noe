// Linha do tempo do avulso "Noé responde comentários #1".
// Fonte única para a imagem (js/responde1.js), a narração (scripts/narracao.mjs --video=responde1)
// e a trilha (scripts/responde1.mjs). Roteiro: docs/roteiro-responde-1.md

export const DURACAO = 50;

export const VOZ_IDS = {
  noe: 'pqHfZKP75CvOlQylNhV4',     // "Bill"
  vizinho: 'N2lVS1w4EtoT3dr4eOWO', // "Callum"
};

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo
export const FALAS = [
  [0.3, 2.9, 'Pausa na obra. Bora ler os *comentários…*', 'Pausa na obra. Bora ler os comentários...'],
  [3.2, 4.6, 'Chantagem com *cupim?*'],
  [5.7, 7.9, '…Pode ser uma lontra. *Pode* *sim.*', 'Pode ser uma lontra. Pode sim.'],
  [8.4, 13.6, 'Tardígrado sobrevive até no espaço. Esse não precisa de arca… precisa de *lupa.*', 'Tardígrado sobrevive até no espaço. Esse não precisa de arca... precisa de lupa.'],
  [14.0, 17.0, 'O camaleão já tá na obra. Você só não tá *vendo.*'],
  [17.6, 21.8, '*Golira.* Anotado. Primeiro golira da história.', 'Golira. Anotado. Primeiro golira da história.'],
  [22.3, 26.6, 'Segundo lugar? Tá bom… mas o primeiro *ninguém* tira.', 'Segundo lugar? Tá bom... mas o primeiro ninguém tira.'],
  [27.1, 33.3, 'Sessenta e cinco unicórnios… trinta e oito dragões-de-komodo… vocês dois tão *competindo?*', 'Sessenta e cinco unicórnios... trinta e oito dragões-de-komodo... vocês dois tão competindo?'],
  [33.8, 36.5, 'Quer ser o Noé? Isso *Noé* da sua conta!'],
  [37.0, 38.8, 'E a roupa roxa é *exclusiva.*'],
  [40.8, 42.8, 'Esses dois aí… eu *não* *vi.*', 'Esses dois aí... eu não vi.'],
  [43.4, 49.0, 'No próximo eu leio o *seu.* Comenta aí… e segue pra virar *ajudante!*', 'No próximo eu leio o seu. Comenta aí... e segue pra virar ajudante!'],
];

export const VOZES = ['noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'vizinho', 'noe', 'noe'];

export const INTERPRETACAO = [
  { stability: 0.45, style: 0.5 },              // tranquilo
  { stability: 0.4, style: 0.7 },               // desconfiado
  { stability: 0.35, style: 0.75, speed: 1.05 },// sem graça, cedendo rápido
  { stability: 0.4, style: 0.6, speed: 1.1 },   // explicando, irônico
  { stability: 0.45, style: 0.55 },             // misterioso
  { stability: 0.35, style: 0.75 },             // segurando o riso
  { stability: 0.4, style: 0.6 },               // orgulhoso do pica-pau
  { stability: 0.3, style: 0.8, speed: 1.1 },   // incrédulo
  { stability: 0.35, style: 0.8 },              // trocadilho
  { stability: 0.4, style: 0.6 },               // vizinho, metido
  { stability: 0.5, style: 0.4, speed: 0.95 },  // seco
  { stability: 0.35, style: 0.7 },              // convite
];

export const CENAS = [
  [0, 'abertura'], [3.0, 'lontra'], [8.2, 'tardigrado'], [13.8, 'camaleao'], [17.3, 'golira'],
  [22.1, 'picapau'], [26.9, 'insistentes'], [33.6, 'noe'], [39.1, 'mosquito'], [43.1, 'final'],
];

export const MARCOS = {
  terror: [4.7, 5.45],         // olho vermelho por meio segundo (callback do vídeo 04)
  trovao: 4.72,
  cupimEspia: [3.6, 5.4],      // o cupim espia atrás da placa na chantagem
  lontraCai: 7.0,
  camaleaoPisca: [15.2, 15.45],
  camaleaoSome: [16.2, 16.9],
  goliraCai: 17.85,
  peito: [18.5, 21.4],         // o golira bate no peito
  carimboGolira: 19.2,
  colisao: 27.6,               // os cartões dos insistentes se chocam
  vizinhoEntra: 36.6,
  zumbido: [39.2, 40.4],
  plaft: 40.45,
  cartao: 45.0,
  toque: 46.0,
  cupimMorde: [46.6, 49.6],    // o cupim rói o pergaminho e acena
};

// Cartões de comentário (texto). selo: contador de repetições; ringue: os dois cartões se chocam
export const COMENTARIOS = [
  { cartoes: [{ arroba: '@paolodesouzanunes', texto: 'Lontra se não colocar vou querer cupim' }], inicio: 2.9, fim: 8.0 },
  { cartoes: [{ arroba: '@rick.brucee', texto: 'Sou um tardigrado' }], inicio: 8.3, fim: 13.7 },
  { cartoes: [{ arroba: '@kaio_kainan_', texto: 'Eu quero se um mamaleao' }], inicio: 13.9, fim: 17.1 },
  { cartoes: [{ arroba: '@breno_gx_077', texto: 'Quero ser golira' }], inicio: 17.4, fim: 22.0 },
  { cartoes: [{ arroba: '@vitinksgk', texto: 'Eu quero ser o 2 ajudante que mais ajudou na arca' }], inicio: 22.2, fim: 26.7 },
  { cartoes: [{ arroba: '@isaias10987654321', texto: 'Unicórnio', selo: '×65' }, { arroba: '@lccscoutinho', texto: 'Dragão-de-komodo', selo: '×38' }], inicio: 27.0, fim: 33.4, ringue: true },
  { cartoes: [{ arroba: '@enzinho125c', texto: 'Eu quero ser o noe' }], inicio: 33.7, fim: 36.6 },
  { cartoes: [{ arroba: '@thayxyl', texto: 'Vizinho quero ter um cabelo preto e uma roupa roxa' }], inicio: 36.6, fim: 39.0 },
  { cartoes: [{ arroba: '@shinaydabazar', texto: 'Eu quero ser um pernilongo' }, { arroba: '@paulo.sjb_', texto: 'Eu quero ser um mosquito' }], inicio: 39.2, fim: 42.9, amassa: 40.45 },
];
