// Linha do tempo do vídeo 02 ("Os 10 primeiros ajudantes").
// Fonte única para a imagem (js/video02.js), a narração (scripts/narracao.mjs --video=02)
// e a trilha (scripts/video02.mjs). Roteiro: docs/roteiro-video-02.md

export const DURACAO = 32;

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo.
// Legenda e fala com o mesmo número de palavras (legenda palavra por palavra).
export const FALAS = [
  [0.3, 2.35, 'Ontem eu estava *sozinho…*', 'Ontem eu estava sozinho...'],
  [2.5, 5.7, 'Bom… ontem pra mim. Aqui o tempo passa *diferente.*', 'Bom, ontem pra mim. Aqui o tempo passa diferente.'],
  [5.9, 7.9, 'Mas olha só quem *chegou!*'],
  [10.0, 11.4, 'Um *JACARÉ?!*', 'Um jacaré?!'],
  [12.1, 14.1, 'Uma onça… fica do *outro* lado, tá?', 'Uma onça... fica do outro lado, tá?'],
  [14.9, 16.7, 'Ainda bem que a arca é *grande.*'],
  [17.0, 19.6, 'Dez ajudantes… e a arca já *começou!*', 'Dez ajudantes... e a arca já começou!'],
  [23.4, 26.3, 'Faltam só *três* pra eu colocar a *quilha.*'],
  [27.2, 29.6, '*Obrigado,* ajudantes! Quem vem agora?'],
];

export const INTERPRETACAO = [
  { stability: 0.35, style: 0.55 },             // melancólico
  { stability: 0.35, style: 0.6, speed: 1.2 },  // piada, cúmplice
  { stability: 0.3, style: 0.7 },               // surpresa feliz
  { stability: 0.25, style: 0.8 },              // espanto
  { stability: 0.3, style: 0.7, speed: 1.17 },  // medo engraçado
  { stability: 0.35, style: 0.6 },              // alívio irônico
  { stability: 0.3, style: 0.75 },              // emoção, conquista
  { stability: 0.4, style: 0.55 },              // provocação
  { stability: 0.3, style: 0.75 },              // gratidão + chamado
];

export const CENAS = [
  [0, 'gancho'], [2.5, 'tempo'], [5.8, 'chegada'], [9.3, 'jacare'], [11.5, 'onca'],
  [14.2, 'elefante'], [16.8, 'construcao'], [23.2, 'holograma'], [27.0, 'final'],
];

// Os 10 primeiros ajudantes (só o @, sem foto). Os 7 sem animal chegam primeiro.
export const AJUDANTES = [
  { arroba: '@ra.fa_3008', vaga: 3, pousa: 6.4 },
  { arroba: '@bn_rlk_.00', vaga: 6, pousa: 7.0 },
  { arroba: '@rosangelacosta5123', vaga: 2, pousa: 7.5 },
  { arroba: '@vih.vieira13', vaga: 7, pousa: 7.9 },
  { arroba: '@afonso_sossio', vaga: 4, pousa: 8.25 },
  { arroba: '@mariana_cardeal82', vaga: 5, pousa: 8.55 },
  { arroba: '@lima__pedro17', vaga: 1, pousa: 8.85 },
  { arroba: '@chiarellizim', vaga: 0, pousa: 9.75, animal: 'jacare', lento: true },
  { arroba: '@elcilenebarroso', vaga: 8, pousa: 11.95, animal: 'onca', lento: true },
  { arroba: '@juli.ano15c', vaga: 9, pousa: 14.65, animal: 'elefante', lento: true },
];

export const RAIOS = [0.1, 1.45, 30.6];

export const MARCOS = {
  viraDia: 4.55,          // "DIA 1" vira "DIA 2" no time-lapse
  marteladas: [16.9, 18.5],
  suportesInicio: 18.5,   // cavaletes brotam do chão
  suportesPasso: 0.27,
  suporteFinal: 20.75,    // último cavalete, em câmera lenta
  flash: 21.25,
  carimbo: 21.4,          // "1ª PEÇA DA ARCA ✅"
  holograma: [23.4, 26.6],
  cartao: 28.2,
  toque: 29.3,
  recado: 29.7,           // "7 ajudantes ainda não escolheram o animal…"
  escurece: [29.5, 32],
};
