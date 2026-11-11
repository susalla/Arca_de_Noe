// Linha do tempo do vídeo 03 ("A chuva está chegando").
// Fonte única para a imagem (js/video03.js), a narração (scripts/narracao.mjs --video=03)
// e a trilha (scripts/video03.mjs). Roteiro: docs/roteiro-video-03.md

export const DURACAO = 36.5;

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo
export const FALAS = [
  [0.3, 3.0, 'Os pássaros estão fugindo… a *chuva* tá chegando!', 'Os pássaros estão fugindo... a chuva tá chegando!'],
  [3.6, 6.6, 'Eu preciso de ajuda… *AGORA!*', 'Eu preciso de ajuda... agora!'],
  [7.2, 9.6, 'Espera… eles estão vindo *pra* *cá?*', 'Espera... eles estão vindo pra cá?'],
  [10.8, 13.2, 'Um *urubu?* Isso não é bom sinal…', 'Um urubu? Isso não é bom sinal...'],
  [14.3, 16.6, 'Pelo menos *esse* aqui trabalha!'],
  [17.9, 20.5, 'Amigo… a vaga de arca já tá *ocupada.*', 'Amigo... a vaga de arca já tá ocupada.'],
  [23.7, 25.7, 'E chegou até um *casal* de leões!'],
  [26.1, 30.3, 'Quilha… fundo… costela! *Vai,* vai, vai!', 'Quilha, fundo, costela! Vai, vai, vai!'],
  [31.3, 36.0, 'Faltam só *oito* pra próxima costela… me *ajuda,* rápido!', 'Faltam só oito pra próxima costela... me ajuda, rápido!'],
];

export const INTERPRETACAO = [
  { stability: 0.25, style: 0.8, speed: 1.08 }, // pânico
  { stability: 0.2, style: 0.9 },               // desespero, gritando
  { stability: 0.3, style: 0.7 },               // surpresa
  { stability: 0.35, style: 0.6 },              // desconfiado
  { stability: 0.35, style: 0.6 },              // aprovação engraçada
  { stability: 0.45, style: 0.4, speed: 1.15 }, // seco, deadpan
  { stability: 0.3, style: 0.75 },              // empolgado
  { stability: 0.25, style: 0.85, speed: 1.15 },// pressa
  { stability: 0.25, style: 0.85, speed: 1.15 },// urgência
];

export const CENAS = [
  [0, 'gancho'], [3.2, 'desespero'], [7.0, 'reviravolta'], [13.4, 'picapau'], [16.8, 'arca'],
  [20.6, 'multidao'], [25.8, 'upgrade'], [31.0, 'final'],
];

// Raios que caem (relâmpago visível)
export const RAIOS = [1.2, 28.5, 32.4];

// Quem pediu cada animal (o @ fica em cima do próprio animal)
export const PEDIDOS = {
  aguia: { arroba: '@m.s.d.s_zin16', print: 'aguia' },
  gaviao: { arroba: '@matheuzin8376', print: 'gaviao' },
  urubu: { arroba: '@_kaike_pxp_', print: 'urubu' },
  picapau: { arroba: '@073_r4fael', print: 'picapau' },
  arca: { arroba: '@smt_gabriel_051', print: 'arca' },
  cachorro: { arroba: '@eu_fomiga', print: 'cachorro' },
  leao1: { arroba: '@isa.bellyayla', print: 'leao-isa' },
  leao2: { arroba: '@offkzip__7', print: 'leao-offkzip' },
  pantera: { arroba: '@pxt_luan7', print: 'pantera' },
};

// Quem comentou "sou ajudante" (sem animal): aparecem com o @ na multidão
export const AJUDANTES_COMENTARIO = ['@_nattxw_', '@matheus.luan0712', '@livia.wts', '@glebson_w07', '@leo_555_silva'];

export const MARCOS = {
  revoada: [0.0, 3.2],         // bando de pássaros fugindo
  aguiaPousa: 8.6,
  gaviaoPousa: 9.2,
  urubuPousa: 10.4,
  picapauPousa: 13.7,
  bicadas: [14.1, 16.6],
  encarar: [17.1, 17.9],       // Noé encara a câmera em silêncio
  multidao: [20.9, 3.2],       // início e duração da chegada dos 65
  cachorroPousa: 21.9,
  leao1Pousa: 23.55,
  leao2Pousa: 23.95,
  panteraPousa: 24.5,
  pecasInicio: 26.0,           // quilha, fundo e costela caem com 1 s de intervalo
  pecasPasso: 1.0,
  rotuloQuilha: [29.3, 31.0],  // "@smt_gabriel_051 virou a quilha"
  cartao: 33.1,
  toque: 34.1,
  chuvaFinal: [31.6, 33.2],
};

// Cards com o print do comentário (um ou mais empilhados)
export const COMENTARIOS = [
  { prints: ['aguia', 'gaviao'], inicio: 8.75, fim: 10.25 },
  { prints: ['urubu'], inicio: 10.55, fim: 13.3 },
  { prints: ['picapau'], inicio: 13.9, fim: 16.7 },
  { prints: ['arca'], inicio: 17.0, fim: 20.5 },
  { prints: ['cachorro'], inicio: 22.05, fim: 23.4 },
  { prints: ['leao-isa', 'leao-offkzip', 'pantera'], inicio: 23.7, fim: 25.7 },
];
