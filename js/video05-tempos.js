// Linha do tempo do vídeo 05 ("O traidor da arca").
// Fonte única para a imagem (js/video05.js), a narração (scripts/narracao.mjs --video=05)
// e a trilha (scripts/video05.mjs). Roteiro: docs/roteiro-video-05.md

export const DURACAO = 54;

// Curva da arca mais "reta" (js/arca.js, EXPOENTE_CURVA): com 1700 seguidores são 13 peças e a próxima sai com 1808.
export const SEGUIDORES = { antes: 378, depois: 1700, proxima: 1808 };
export const PECAS = { antes: 10, depois: 13 }; // costelas 8, 9 e 10

export const VOZ_IDS = {
  noe: 'pqHfZKP75CvOlQylNhV4',     // "Bill"
  vizinho: 'N2lVS1w4EtoT3dr4eOWO', // "Callum"
};

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo
export const FALAS = [
  [0.5, 3.2, 'Alguém… fez um *buraco* na minha arca.', 'Alguém... fez um buraco na minha arca.'],
  [3.8, 6.6, 'E ainda *CONFESSOU* nos comentários?!', 'E ainda confessou nos comentários?!'],
  [8.6, 11.8, 'Eu *vou* descobrir quem foi… mas primeiro, *obra!*', 'Eu vou descobrir quem foi... mas primeiro, obra!'],
  [12.7, 16.6, 'Bem-vindos, ajudantes! Até o Ayrton Senna *chegou!*'],
  [17.9, 22.5, 'Gabriel, João, Felipe… nessa arca *ninguém* fica pra trás.', 'Gabriel, João, Felipe... nessa arca ninguém fica pra trás.'],
  [23.4, 26.9, 'O *caramelo* chegou! Agora sim é uma arca *brasileira!*'],
  [28.4, 35.0, 'A harpia trouxe a madeira! Oitava… nona… *DÉCIMA* costela!', 'A harpia trouxe a madeira! Oitava... nona... décima costela!'],
  [36.6, 40.0, 'Tá ficando linda… mas alguém tá *espiando.*', 'Tá ficando linda... mas alguém tá espiando.'],
  [41.0, 46.3, 'Comenta quem você acha que é o *traidor…* e segue pra me ajudar a descobrir!', 'Comenta quem você acha que é o traidor... e segue pra me ajudar a descobrir!'],
  [50.8, 53.0, '…Isso *não* é um cupim.', 'Isso não é um cupim.'],
];

export const VOZES = ['noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe'];

export const INTERPRETACAO = [
  { stability: 0.45, style: 0.55, speed: 0.95 }, // chocado, baixo
  { stability: 0.25, style: 0.9 },               // indignado
  { stability: 0.35, style: 0.7 },               // determinado
  { stability: 0.3, style: 0.8 },                // empolgado
  { stability: 0.45, style: 0.5, speed: 0.95 },  // carinhoso
  { stability: 0.3, style: 0.85 },               // festa
  { stability: 0.25, style: 0.9 },               // épico
  { stability: 0.45, style: 0.55, speed: 0.95 }, // desconfiado
  { stability: 0.35, style: 0.7 },               // convite
  { stability: 0.7, style: 0.3, speed: 0.85 },   // sussurrando, com medo
];

export const CENAS = [
  [0, 'buraco'], [3.5, 'confissao'], [6.9, 'suspeitos'], [12.1, 'multidao'], [17.4, 'esquecidos'],
  [22.9, 'caramelo'], [27.5, 'harpia'], [36.1, 'espiando'], [40.6, 'final'], [46.8, 'poscreditos'],
];

export const MARCOS = {
  flashes: [8.0, 9.2, 10.4],     // foto de cada suspeito (cupim, vizinho, encapuzado)
  multidao: [12.4, 3.6],         // início e duração da chegada
  creditos: [12.3, 17.2],
  senna: [14.6, 15.6],           // o ajudante de capacete passa voando
  esquecidos: [19.0, 19.8, 20.6],// os três feixes
  caramelo: [23.1, 24.4],        // entra correndo e rouba o chapéu
  chapeu: 24.0,
  pecasPouso: [30.8, 32.4, 34.0], // costelas 8, 9 e 10 encaixam no "oitava… nona… décima"
  olho: [38.4, 40.4],            // o olho espia pelo buraco
  cartao: 42.4,
  toque: 43.4,
  tremores: [48.2, 48.9, 49.6],  // pós-créditos: passos gigantes
  pegada: 49.6,
};

// Cartões de comentário (texto)
export const COMENTARIOS = [
  { cartoes: [{ arroba: '@emanuel_.boyzao', texto: 'Sou o traidor que fez um buraco escondido no fundo da arca' }], inicio: 3.6, fim: 6.8 },
  { cartoes: [{ arroba: '@cf.nicoletti_01', texto: 'Eu quero ser o cupim', selo: '×3' }], inicio: 7.9, fim: 9.1 },
  { cartoes: [{ arroba: '@valentina.m.s.o', texto: 'Eu quero ser o Airton Senna,ajudante' }], inicio: 14.3, fim: 16.8 },
  { cartoes: [{ arroba: '@gabrielteixeira6191', texto: 'Pô eu acompanho desde o primeiro episódio Noé e eu nunca entrei pra ser ajudante… nem me escolheu😢' }], inicio: 17.5, fim: 19.0 },
  { cartoes: [{ arroba: '@joaozin.lz', texto: 'Euu vc nem me escolhe 😢' }], inicio: 19.0, fim: 19.8 },
  { cartoes: [{ arroba: '@felipinho_snts2016', texto: 'eu segui e não apareci' }], inicio: 19.8, fim: 22.7 },
  { cartoes: [{ arroba: '@d4vix_408', texto: 'Eu quero ser um caramelo' }], inicio: 23.0, fim: 27.2 },
  { cartoes: [{ arroba: '@guto_2.018', texto: 'eu quero ser uma arpia Brasileira e posso ajudar em carregar a madeira' }], inicio: 27.6, fim: 31.0 },
  { cartoes: [{ arroba: '@vvgh_244', texto: 'Dia 2 pedindo para ser um dinossauro T-rex' }], inicio: 50.0, fim: 53.8 },
];

export const ESQUECIDOS = ['@gabrielteixeira6191', '@joaozin.lz', '@felipinho_snts2016'];

// Os 200 seguidores mais novos (créditos)
export const NOVOS = ["@matheus49251", "@manfredysoaresdelima", "@breno_8115", "@eu_isabelly51", "@1733theo", "@twdogusta", "@silvaxx11_zz", "@klassmanarthur23", "@ticahrm", "@enzo_rockrider", "@carlosandresatiago", "@berwf_10", "@eukaiquedutra", "@alerzinwx", "@thalesdavi30", "@lcz.12_", "@marcelinhohenrique.ofc", "@analivia2109s", "@pablo_henrique1290_bjj", "@riquelmy_d_santox", "@pedrinnl7zin____244", "@michaeljack_185", "@alice_damiani_de_carvalho", "@sofiamarks1810", "@lccscoutinho", "@jao.lucas11", "@jkaue_30_", "@juli0_11g0at", "@juhh.p.silva", "@menorzin.jota", "@snicolastorresda", "@giaco_mo2012_", "@miket_zx", "@atilarogeriosantos", "@bernado_andrade3", "@miguel.xl", "@frazaoraphael67", "@lh.davi", "@deivissongabriel288", "@theo66923", "@guthnergamer", "@bruno_eduar_do_bjj", "@mc_wzhinho", "@valentinac0802", "@vict.orhugo7828", "@nicolasluis6180", "@henrzinhovt", "@marcosantonio110706", "@murilo.santostj", "@mano_rafa157cafazera", "@renata_florencio07", "@josuelucas_do_grau_557", "@antoniofaustinofabris", "@__jlucas00", "@natalianicolydasilvadeoliveira", "@israel_santos_2017", "@davixzn07xz_", "@danilo_monte_ofc_", "@pedroszx1705", "@tropa_dob_15", "@mateus.fernandes___", "@adszi.nn", "@heitor_corintiano", "@olk_e_a_tami", "@adriano.76770", "@zuzinha_blox2026", "@scl0.07", "@isaias10987654321", "@lucifer1357800", "@arthur565492", "@julia.peter222", "@miguelcs160916", "@luiznho.lm", "@krc_090", "@nogueirazin_07", "@kaiqsa7_silva11", "@_silvaaxz174", "@lilice0814", "@anaraqueldacruzbarbosa", "@dr713934", "@menorfogo_19", "@eu.jose_12", "@pedro.guilhermew", "@marcos_rhenzo", "@kauamm.12354meyreles", "@heitorzx7", "@mathh_bjj", "@_biel_silva14", "@laura.sofiamdrs", "@danielcelio5", "@atnopalaxz", "@ramon_carvalho0012", "@kauan_1140", "@ghors_t777", "@jeni88148", "@privs_gmelo", "@calebirochamorais", "@souz_prx", "@thoma.zb", "@nezukko_mah_22", "@joaog_abriel2505", "@felipe_556688gf", "@murilo.c.chaves", "@sebinharoberto", "@mxz_samtos23", "@erik_iluminado68", "@naoya______zeninn", "@ana_alice.p8", "@davidph", "@marii052026", "@eo_vitinho.00", "@yagzin_76793", "@luluqunhafc990", "@miguel_producoes_ia", "@caiqueuliana", "@whsley7z78", "@lucasriquelme08", "@sx_danntas_10_", "@augusto_venuto", "@danielvieira1712", "@paradela2.0", "@vitor17766", "@mx_vitinx7", "@marco.asouz", "@joaozinho.lucass", "@sz_oseias_", "@_dv.japa", "@sufista_01_ofc_", "@isabel.guimaxz", "@henriquejonermoraes2014", "@mar.tinellil", "@felipe_rl2_2", "@46ruanx", "@silva.luisgabrielnunesda", "@neto.kingz", "@lucasfig011", "@arthurmessiascustodio", "@paolodesouzanunes", "@werik4103", "@davi_luiz026", "@eo_.gouveia_", "@jovanisabaini", "@emanuel_noso_deus", "@vieira_da_vk_", "@itoshi_rin4677", "@isabelly31011", "@miguel.moraes21", "@luiz._.otavio.p", "@brandao_joaoguilherme", "@pietrofrancada", "@eloa.senab", "@polakoo00", "@eduardo490009", "@hts_fran", "@priv_pridias", "@davipaulino_pele", "@ra.faella8397", "@maria_clarabs123", "@joaovitornaoteama", "@bjj.1432", "@y._rodrigxz", "@_sk_sontx__", "@kael14869", "@natalia_oliveira3236", "@wellington_24157", "@alveszk35", "@duda_barreto9625", "@reisyaradacruz", "@nathyeveline", "@thzin_ats", "@ka_vida11", "@rebequinha.star", "@bananaolopes", "@vitin__yxz", "@carlos902086", "@70.235124", "@lauraanateles", "@eo_silvaao", "@danielbernardo1497", "@caua_albanez", "@theowx.zz", "@miguell___.133", "@_t.rentini", "@guizzim", "@maira.cristina_0", "@joao_miguel2573", "@migueldearaujodutra", "@rafael_raiter109ca", "@jgplacas_scrp2026", "@henriquerazxy", "@luanhenrique4434", "@luiz_filho8", "@thaizinha_2012", "@murillo_sanches_da_silva", "@emidioenzosaturnino", "@anto_ny244244", "@filipe12071", "@adrielpereira234", "@rhayck_levy", "@_paulo01xs"];
