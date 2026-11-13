// Linha do tempo do avulso "Noé responde comentários #2".
// Fonte única para a imagem (js/responde2.js), a narração (scripts/narracao.mjs --video=responde2)
// e a trilha (scripts/responde2.mjs). Roteiro: docs/roteiro-responde-2.md

export const DURACAO = 63;

export const VOZ_IDS = { noe: 'pqHfZKP75CvOlQylNhV4' }; // "Bill"

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo
export const FALAS = [
  [0.4, 3.0, 'Prometi no número um… hoje eu leio o *seu.*', 'Prometi no número um... hoje eu leio o seu.'],
  [3.9, 8.6, 'Cento e doze vezes, Isaías?! …Tá bom. Unicórnio versão *obra.*', 'Cento e doze vezes, Isaías?! Tá bom... Unicórnio versão obra.'],
  [9.8, 15.6, 'Jafé eu já tenho! Sem, Cam e Jafé… mas *sobrinho* tem vaga!', 'Jafé eu já tenho! Sem, Cam e Jafé... mas sobrinho tem vaga!'],
  [16.4, 19.5, 'Orangotango comendo morango… até *rimou.*', 'Orangotango comendo morango... até rimou.'],
  [20.4, 26.2, 'Achei o seu balança-rabo-leitoso! Pequenininho… mas balança o *rabo.*', 'Achei o seu balança-rabo-leitoso! Pequenininho... mas balança o rabo.'],
  [27.0, 31.0, 'Barata gamer na obra? O chinelo tá *on-line.*'],
  [32.0, 36.5, 'Cem madeiras de disco voador? Pode descer, *pode descer!*'],
  [37.2, 42.8, 'Golira do tamanho de Golias? Cuidado… nessa história o *pequeno* ganha.', 'Golira do tamanho de Golias? Cuidado... nessa história o pequeno ganha.'],
  [45.4, 49.6, 'Promessa cumprida… mas *ninguém* olha no olho dele!', 'Promessa cumprida... mas ninguém olha no olho dele!'],
  [50.5, 51.3, '*Cupim?!*', 'Cupim?!'],
  [52.2, 55.3, 'Esse… vai ser importante quando a *água* chegar.', 'Esse... vai ser importante quando a água chegar.'],
  [58.0, 61.8, 'Comenta o seu bicho pro número três… e segue pra virar *ajudante!*', 'Comenta o seu bicho pro número três... e segue pra virar ajudante!'],
];

export const VOZES = FALAS.map(() => 'noe');

export const INTERPRETACAO = [
  { stability: 0.45, style: 0.55 },             // tranquilo, cumprindo a promessa
  { stability: 0.3, style: 0.8, speed: 1.08 },  // incrédulo → rendido
  { stability: 0.35, style: 0.75, speed: 1.08 },// rindo, paternal
  { stability: 0.4, style: 0.65 },              // achando graça da rima
  { stability: 0.35, style: 0.7, speed: 1.08 }, // carinhoso
  { stability: 0.4, style: 0.7 },               // ameaça de brincadeira
  { stability: 0.3, style: 0.85, speed: 1.05 }, // empolgado
  { stability: 0.4, style: 0.65, speed: 1.05 }, // sábio, piada bíblica
  { stability: 0.3, style: 0.8 },               // tenso
  { stability: 0.3, style: 0.9 },               // susto
  { stability: 0.6, style: 0.35, speed: 0.95 }, // sério, profético
  { stability: 0.35, style: 0.7, speed: 1.08 }, // convite
];

export const CENAS = [
  [0, 'abertura'], [3.4, 'unicornio'], [9.4, 'jafe'], [16.0, 'orangotango'], [20.0, 'passarinho'], [26.6, 'barata'],
  [31.6, 'nave'], [36.8, 'golias'], [43.2, 'basilisco'], [51.6, 'peixe'], [57.6, 'final'],
];

export const MARCOS = {
  selo: [3.7, 5.4],              // o contador do Isaías rola de ×65 até ×112
  cavalo: [6.5, 7.4],            // o cavalo com cone entra
  carimboUnicornio: 7.5,
  placas: [11.7, 12.48, 13.08],  // SEM · CAM · JAFÉ (no tempo das palavras)
  sobrinho: 14.5,                // o @_leomaltauro chega como sobrinho
  morango: [17.6, 18.4, 19.2],   // mordidas
  lupa: [20.6, 21.4],
  chinelo: 29.4,                 // o Noé saca o chinelo
  barataFoge: 30.0,
  nave: [31.8, 32.6],            // chega
  raio: [32.8, 35.6],
  torasPousam: 35.0,
  golira: [37.4, 40.0],          // cresce até ficar gigante
  basilisco: [43.4, 45.3],       // sobe atrás da arca
  tapaOlhos: 47.7,
  cupimOlha: 49.4,
  pedra: 49.9,
  visao: [51.6, 55.2],
  cartao: 58.4,
  toque: 59.3,
  pisca: 62.2,                   // o cupim de pedra pisca
};

export const COMENTARIOS = [
  { cartoes: [{ arroba: '@isaias10987654321', texto: 'Eu sou um unicórnio por favor', selo: '×65' }], inicio: 3.5, fim: 9.3 },
  { cartoes: [{ arroba: '@_leomaltauro', texto: 'Eu quero ser seu filho jafé' }], inicio: 9.5, fim: 15.8 },
  { cartoes: [{ arroba: '@gabba_gubi', texto: 'Eu quero ser um orangotango comendo morango' }], inicio: 16.1, fim: 19.8 },
  { cartoes: [{ arroba: '@arthuralbuquerquedeandrade', texto: 'Cade o meu balança-rabo-leitoso' }], inicio: 20.1, fim: 26.4 },
  { cartoes: [{ arroba: '@rese.rvagb57', texto: 'Quero ser a barata gamer' }], inicio: 26.7, fim: 31.4 },
  { cartoes: [{ arroba: '@vcasaril', texto: 'Eu quero ser uma nave alienígena q vai trazer 100 madeiras pra ajudar' }], inicio: 31.7, fim: 36.6 },
  { cartoes: [{ arroba: '@hentony_caldas7', texto: 'Eu quero ser um gorila mestre, que vai ser gigante, mais ainda um gorila, do tamanho de Golias' }], inicio: 36.9, fim: 42.9 },
  { cartoes: [{ arroba: '@rafa.viturin09', texto: 'Quero ser um basilisco', resposta: '↳ @arca_do_noee: gostei da referência meu filho, basilisco está por vir' }], inicio: 45.3, fim: 49.5 },
  { cartoes: [{ arroba: '@antonio.schnorr', texto: 'Quero ser um peixe gigante que vai ficar em baixo da arca protegendo' }], inicio: 51.7, fim: 57.4 },
];
