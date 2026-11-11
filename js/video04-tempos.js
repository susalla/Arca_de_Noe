// Linha do tempo do vídeo 04 ("Era pra ser 200… chegaram 378!").
// Fonte única para a imagem (js/video04.js), a narração (scripts/narracao.mjs --video=04)
// e a trilha (scripts/video04.mjs). Roteiro: docs/roteiro-video-04.md

export const DURACAO = 55;

export const SEGUIDORES = { antes: 75, depois: 378, proxima: 400 };
export const PECAS = { antes: 4, depois: 10 }; // suportes..1ª costela → até a 7ª costela

// Vozes da ElevenLabs de cada personagem
export const VOZ_IDS = {
  noe: 'pqHfZKP75CvOlQylNhV4',     // "Bill"
  vizinho: 'N2lVS1w4EtoT3dr4eOWO', // "Callum"
};

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo
export const FALAS = [
  [0.4, 3.4, 'Tá tudo pronto pra festa dos *duzentos!*'],
  [4.2, 8.0, 'Duzentos… duzentos e cinquenta… *TREZENTOS* *E* *SETENTA* *E* *OITO?!*', 'Duzentos... duzentos e cinquenta... trezentos e setenta e oito?!'],
  [8.7, 10.9, 'Corrigi pra você, *Noé.*'],
  [11.4, 14.8, 'Bem-vindos, *ajudantes!* Procura teu nome aí!'],
  [16.5, 19.9, 'Caminhão eu não sei o que é… mas *material* chegou!', 'Caminhão eu não sei o que é... mas material chegou!'],
  [20.6, 23.8, 'Rodri Cuts… *dessa* *vez* eu te escolhi.', 'Rodri Cuts... dessa vez eu te escolhi.'],
  [24.4, 26.5, 'Cupim? Numa obra de *madeira?*'],
  [27.3, 30.2, 'Quem pedir cupim… *vai* *se* *ver* *comigo.*', 'Quem pedir cupim... vai se ver comigo.'],
  [30.6, 34.9, 'Ornitorrinco… *flamingo…* hipopótamo?! Que arca *diferente!*', 'Ornitorrinco... flamingo... hipopótamo?! Que arca diferente!'],
  [35.3, 38.6, 'Já entendi, Davi! Ajudante *vinte* *e* *sete* vezes!'],
  [38.9, 45.3, 'Segunda… terceira… quarta… quinta… sexta… *SÉTIMA* costela!', 'Segunda... terceira... quarta... quinta... sexta... sétima costela!'],
  [46.1, 49.3, 'Olha o *tamanho* que isso tá ficando…', 'Olha o tamanho que isso tá ficando...'],
  [50.1, 54.5, 'Faltam só *vinte* *e* *dois…* e alguém viu um *cupim* por aí?', 'Faltam só vinte e dois... e alguém viu um cupim por aí?'],
];

export const VOZES = ['noe', 'noe', 'vizinho', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe'];

export const INTERPRETACAO = [
  { stability: 0.4, style: 0.6 },               // orgulhoso
  { stability: 0.2, style: 0.9, speed: 1.2 },   // contando, cada vez mais chocado
  { stability: 0.4, style: 0.6 },               // vizinho, seco e debochado
  { stability: 0.3, style: 0.8 },               // empolgado
  { stability: 0.35, style: 0.7 },              // confuso e feliz
  { stability: 0.45, style: 0.5, speed: 0.95 }, // carinhoso
  { stability: 0.35, style: 0.75 },             // bravo, engraçado
  { stability: 0.6, style: 0.55, speed: 0.85 }, // ameaçador, grave e devagar (terror)
  { stability: 0.3, style: 0.85, speed: 1.1 },  // espantado e divertido
  { stability: 0.3, style: 0.8, speed: 1.1 },   // rindo
  { stability: 0.25, style: 0.9 },              // crescendo, épico
  { stability: 0.45, style: 0.5, speed: 0.95 }, // maravilhado
  { stability: 0.3, style: 0.8 },               // urgência + desconfiado
];

export const CENAS = [
  [0, 'festa'], [4.0, 'contador'], [8.3, 'faixa'], [11.2, 'multidao'], [16.2, 'carroca'],
  [20.2, 'rodri'], [24.2, 'cupim'], [30.3, 'diferentoes'], [35.0, 'davi'], [38.6, 'upgrade'],
  [45.9, 'panorama'], [49.9, 'final'],
];

export const MARCOS = {
  contaAte200: [4.3, 5.5],     // 75 → 200 (confete)
  confete: 5.5,
  contaAte378: [5.8, 7.6],     // 200 → 378
  rabisco: [8.6, 9.4],         // o vizinho risca o "200"
  escreve: [9.4, 10.4],        // e escreve "378"
  multidao: [11.4, 3.6],       // início e duração da chegada dos 303
  creditos: [11.3, 16.1],      // os 100 @ mais novos sobem na tela
  carroca: [16.3, 18.2],       // a carroça entra e para
  feixeRodri: 22.4,
  placa: 25.0,                 // a placa cai e o Noé crava
  marteladasPlaca: [25.45, 25.9, 26.35],
  terror: [26.8, 30.25],       // céu escuro, luz vermelha e zoom no rosto do Noé
  trovaoTerror: 26.9,
  quedas: [30.8, 31.9, 33.1],  // ornitorrinco, flamingo e hipopótamo caem do céu
  baloes: [35.4, 37.5],        // os "EU" caem em cima do Noé
  pecasInicio: 39.0,           // costelas 2 a 7 (uma por segundo)
  pecasPasso: 1.0,
  cartao: 51.0,
  toque: 52.0,
  cupimEspia: [52.4, 54.3],    // o cupim espia atrás da tora
};

// Cartões de comentário (texto): o @ e o comentário de quem escreveu
export const COMENTARIOS = [
  { cartoes: [{ arroba: '@garciaxxzn', texto: 'Eu ajudante de caminhão com material' }], inicio: 16.4, fim: 20.0 },
  { cartoes: [{ arroba: '@rodri.cuts', texto: 'Poxa mano noé, nem me escolheu😔' }], inicio: 20.3, fim: 22.3 },
  { cartoes: [{ arroba: '@oi_boanoite143667', texto: 'Eu quero ser o cupim' }, { arroba: '@_pandilhawzs7', texto: 'Eu quero ser um cupim' }], inicio: 24.3, fim: 25.2 },
  { cartoes: [{ arroba: '@negao_paciencia', texto: 'Ornitorrinco' }], inicio: 30.5, fim: 31.75 },
  { cartoes: [{ arroba: '@barbara.ilopes', texto: 'Hey um flamingo 🦩' }], inicio: 31.75, fim: 32.85 },
  { cartoes: [{ arroba: '@kendrewff', texto: 'Ajudante quero ser um hipopótamo' }], inicio: 32.85, fim: 34.9 },
  { cartoes: [{ arroba: '@davi.lucas.0077', texto: 'Eiu😂', extra: '+27 comentários "Eu"' }], inicio: 35.1, fim: 38.4 },
];

// Os 100 seguidores mais novos (créditos)
export const NOVOS = [
  '@henriquebotelho_vieira', '@heitor_cristhian', '@nunu_zinha3', '@karlasantoslara', '@carlinhos_1983', '@spam_do_show',
  '@diaryof_dodoca', '@monteiromimix', '@ximendespomar', '@_dudu.ofcx', '@cmsilvaxx', '@valentinnabernardini', '@mx_duda10',
  '@kalil_skt11', '@anthony47474637474', '@isa_belicostapereira', '@davi_lucca_medeiros_santos', '@vingador_08_',
  '@vn__rlk079', '@dgz_abencoado00', '@sophia_ou_sofi09', '@joaozn_dlx01', '@gabrielsouza43794', '@guiaguiar832',
  '@anna.dmelo', '@davi2527437', '@_candido007', '@gustavo_o_i', '@nepomuceno.joaomiguel', '@silvazzk_028',
  '@renz_santos_xit_00', '@vosso_rei9173', '@marcelavalentinapp', '@paulo_henrigue244', '@lucxz_n8', '@theorafael23',
  '@yuta_fan18', '@capybara_chique', '@kyaradalaroza', '@_asaph_zx', '@yy.mahdzzz', '@ello_victoria01',
  '@alexandramanoelsantos', '@emilypereiramiranda', '@yasmindasilvabemtamaro', '@arthur_luiz_063', '@the_oswald0_',
  '@garciaxxzn', '@itzzys.lisa', '@heitordefaria13', '@cristofer_santos_019', '@b.nolovaiko', '@mp_films.pr.160',
  '@__.sdarkes7', '@senaa_ofc12', '@lorenafarinacandido', '@lop3s_051', '@furia.fc.time', '@guivieirar_oficial',
  '@wil.fxp777', '@atai_dexs', '@gabi_luisa11', '@e_o_eduzin', '@dafuriarlk9', '@tutu_7kzim', '@lucienepereirados371',
  '@luizin_xx01', '@_ronaldtexeiraa013', '@muri.lo24476', '@secretdachiclete', '@analyce.karolineh', '@p.e.h_s',
  '@gi.margo0', '@new_princess_waniffer', '@g.moreira_da_gti', '@phapmsp', '@_gabiziinhha', '@dionisio11_',
  '@marcelim_2017', '@kkca.2026', '@diogo93505', '@angelomacleciodos', '@eulaviniavidal_', '@annalupvd5',
  '@natasharodriguesdesouza', '@kaike_salless', '@weiniere_sw', '@46arthurrr__', '@isalst_00', '@gustax_532',
  '@vlg_mrlxz0102', '@ditinho_11400', '@maycom102026', '@eodpaz7', '@gabi892603', '@_jjoaopedro_00', '@kelvinr14g',
  '@milenanacarvalho', '@caceresluizgustavo', '@jennierubyye87',
];

// Quem comentou "ajudante": o @ flutua em cima do próprio boneco na multidão
export const AJUDANTES_COMENTARIO = ['@marcelavalentinapp', '@dionisio11_', '@vosso_rei9173', '@cmsilvaxx', '@joaozn_dlx01',
  '@marcos.rafael13_', '@eodpaz7', '@o_davi.nunes', '@ligiaeduarda10', '@itzrafaxx', '@dieguin_dgrau', '@trista_costa'];

// Os "diferentões" (com o @ de quem pediu): os três primeiros caem do céu na cena deles,
// e todos aparecem no panorama. Os outros modelados (golira, camaleão, macaco, tigre…) ficam para os próximos vídeos.
export const ANIMAIS_NOVOS = [
  { tipo: 'ornitorrinco', arroba: '@negao_paciencia' },
  { tipo: 'flamingo', arroba: '@barbara.ilopes' },
  { tipo: 'hipopotamo', arroba: '@kendrewff' },
  { tipo: 'flamingo', arroba: '@pxt_luan7' }, // o casal de flamingo
];
