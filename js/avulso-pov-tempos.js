// Linha do tempo do avulso "POV: você tá construindo um barco a 500 km do mar".
// Fonte única para a imagem (js/avulso-pov.js), a narração (scripts/narracao.mjs --video=avulso-pov)
// e a trilha (scripts/avulso-pov.mjs). Roteiro: docs/roteiro-avulso-pov.md

export const DURACAO = 27.2;

// Vozes da ElevenLabs de cada personagem
export const VOZ_IDS = {
  noe: 'pqHfZKP75CvOlQylNhV4',     // "Bill": a mesma voz grave dos outros vídeos
  vizinho: 'N2lVS1w4EtoT3dr4eOWO', // "Callum": rouca e debochada
};

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo
export const FALAS = [
  [3.3, 5.7, 'Ô Noé… cadê o *mar?*', 'Ô Noé... cadê o mar?'],
  [6.3, 7.9, 'Vai *chover.*', 'Vai chover.'],
  [9.3, 11.4, 'Chover? Não tem *uma* nuvem, Noé.'],
  [11.7, 13.4, 'Boa sorte com o *barco!*'],
  [15.9, 18.6, 'Noé… ainda dá pra ser *ajudante?*', 'Noé... ainda dá pra ser ajudante?'],
  [19.4, 21.3, 'Dá. É só *seguir* o perfil.'],
  [22.6, 26.8, 'E você? Seria o *vizinho…* ou o *ajudante?* Comenta aí!', 'E você? Seria o vizinho... ou o ajudante? Comenta aí!'],
];

// Quem fala cada fala (mesma ordem de FALAS)
export const VOZES = ['vizinho', 'noe', 'vizinho', 'vizinho', 'vizinho', 'noe', 'noe'];

export const INTERPRETACAO = [
  { stability: 0.3, style: 0.75 },              // deboche
  { stability: 0.55, style: 0.3, speed: 0.95 }, // seco, sem tirar os olhos do martelo
  { stability: 0.3, style: 0.8 },               // risada contida
  { stability: 0.3, style: 0.8 },               // sarcástico
  { stability: 0.25, style: 0.85 },             // ofegante, sem graça
  { stability: 0.5, style: 0.4 },               // tranquilo, sorrisinho
  { stability: 0.35, style: 0.65 },             // para a câmera
];

export const CENAS = [
  [0, 'gancho'], [2.8, 'chegada'], [6.0, 'noe'], [8.2, 'ceu'], [11.5, 'tchau'],
  [13.5, 'preto'], [15.0, 'chuva'], [19.3, 'ajudante'], [22.4, 'final'],
];

// Raios (com trovão) na parte da chuva
export const RAIOS = [15.25, 24.8];

export const MARCOS = {
  vizinhoEntra: [2.85, 4.6],   // caminha da direita até o lado do Noé
  olhaCeu: [8.3, 9.2],         // o vizinho olha para cima (a câmera sobe junto)
  grilos: [8.3, 9.3],
  nuvenzinha: 10.6,            // a única nuvem aparece em cima da cabeça dele (no "uma")
  tapinhas: [11.85, 12.15],
  vizinhoSai: [12.3, 13.6],
  trovaoPreto: 13.55,
  correndo: [15.0, 15.9],      // volta correndo e encharcado
  feixe: 21.7,                 // o vizinho vira ajudante (logo depois do "perfil")
  rotuloAjudante: [21.75, 22.4],
  cartao: 23.3,
  toque: 24.3,
};

// Marteladas do Noé (o som e o braço seguem esta lista)
const serie = (ini, fim, passo) => { const r = []; for (let t = ini; t < fim; t += passo) r.push(+t.toFixed(3)); return r; };
export const MARTELADAS = [
  ...serie(0.35, 8.1, 0.55),
  ...serie(15.4, 21.6, 0.55),
];
// O vizinho martelando do lado do Noé no final
export const MARTELADAS_VIZINHO = serie(22.9, 26.3, 0.5);
