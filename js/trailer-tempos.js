// Linha do tempo do vídeo 01. Fonte única para a imagem (js/trailer.js),
// a narração (scripts/narracao.mjs) e a trilha (scripts/trailer.mjs).
// Roteiro: docs/roteiro-video-01.md

export const DURACAO = 27;

// [início, fim, legenda, texto falado (opcional, se diferente da legenda)]
// Na legenda, *palavra* fica em amarelo. Legenda e fala precisam ter o mesmo
// número de palavras para as legendas acenderem palavra por palavra.
export const FALAS = [
  [0.25, 2.35, 'O *dilúvio* está vindo.'],
  [2.45, 5.0, 'E eu preciso construir uma arca… *sozinho.*', 'E eu preciso construir uma arca, sozinho.'],
  [5.1, 8.6, 'Mas cada pessoa que me *seguir* vira um ajudante.'],
  [8.7, 11.9, 'Me siga e amanhã *você* aparece aqui comigo.', 'Me siga, e amanhã você aparece aqui, comigo!'],
  [12.0, 15.7, 'E ainda garante uma *vaga* na arca… e pode levar um *animal!*', 'E ainda garante uma vaga na arca... e pode levar um animal!'],
  [15.9, 19.7, 'Quanto mais gente, mais *rápido* a gente constrói!'],
  [19.9, 23.2, 'Sem ajuda… você *sabe* o que acontece.', 'Sem ajuda... você sabe o que acontece.'],
  [23.4, 26.7, 'Me segue. O dilúvio *não* *espera.*', 'Me segue. O dilúvio não espera.'],
];

// Interpretação de cada fala na ElevenLabs (estabilidade menor = mais emoção)
export const INTERPRETACAO = [
  { stability: 0.4, style: 0.5 },   // grave, sério
  { stability: 0.4, style: 0.45, speed: 1.07 },  // cansado, "sozinho"
  { stability: 0.5, style: 0.35 },  // explicando
  { stability: 0.35, style: 0.6, speed: 1.15 },  // animado, sorrindo
  { stability: 0.35, style: 0.65, speed: 1.08 }, // empolgado, oferta
  { stability: 0.3, style: 0.7 },   // energia máxima
  { stability: 0.35, style: 0.55 }, // baixo, ameaçador
  { stability: 0.4, style: 0.6 },   // firme, chamado
];

export const CENAS = [
  [0, 'gancho'], [2.4, 'sozinho'], [5.0, 'chegada'], [8.7, 'voce'], [12.0, 'vaga'],
  [15.8, 'construcao'], [19.8, 'ameaca'], [23.3, 'chamado'],
];

export const RAIOS = [0.12, 1.55, 21.2, 22.6, 24.9];

export const MARCOS = {
  vocePousa: 9.75,     // o "@VOCÊ" cai ao lado do Noé
  bilhete: 13.1,       // "VAGA GARANTIDA" (sincronizado com a palavra "vaga" se houver transcrição)
  animal: 14.6,        // a girafa chega (sincronizada com "animal")
  impacto: 15.8,       // começa o time-lapse da construção
  pecasInicio: 16.0,   // primeira peça do time-lapse
  pecasDuracao: 3.3,   // todas as peças caem nesse intervalo
  animaisInicio: 18.4, // fila de animais no time-lapse
  chuvaAmeaca: [20.7, 22.8],
  cartao: 23.55,
  toque: 24.7,
};

// Ajusta os marcos à narração real (tempo de cada palavra)
export function sincronizarComPalavras(palavras) {
  const achar = (raiz, depoisDe) => palavras.find((w) => w.t > depoisDe && w.p.toLowerCase().startsWith(raiz));
  const vaga = achar('vaga', 11.5);
  const animal = achar('animal', 12.5);
  if (vaga) MARCOS.bilhete = vaga.t;
  if (animal) MARCOS.animal = animal.t;
}
