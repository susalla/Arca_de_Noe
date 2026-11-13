// Linha do tempo do vídeo 06 ("O roubo da madeira").
// Fonte única para a imagem (js/video06.js), a narração (scripts/narracao.mjs --video=06)
// e a trilha (scripts/video06.mjs). Roteiro: docs/roteiro-video-06.md

export const DURACAO = 72.5;

// Curva da arca (js/arca.js, EXPOENTE_CURVA = 1.25, 56 peças): com 2700 seguidores são 19 peças e a próxima sai com 2761.
export const SEGUIDORES = { antes: 1700, depois: 2700, proxima: 2761 };
export const PECAS = { antes: 13, depois: 19 }; // 11ª costela (esqueleto completo) + tábuas 1 a 5

export const VOZ_IDS = {
  noe: 'pqHfZKP75CvOlQylNhV4',     // "Bill"
  vizinho: 'N2lVS1w4EtoT3dr4eOWO', // "Callum"
};

// [início, fim, legenda, texto falado (se diferente)] — *palavra* em amarelo
export const FALAS = [
  [0.6, 3.5, 'Ele avisou nos comentários… e *cumpriu.*', 'Ele avisou nos comentários... e cumpriu.'],
  [4.4, 6.85, 'Dia seis. A noite do *roubo.*'],
  [7.6, 11.0, 'Sumiu a madeira! Gabriel… você é meu *detetive.*', 'Sumiu a madeira! Gabriel... você é meu detetive.'],
  [12.3, 14.6, 'Um fio… *roxo?*', 'Um fio... roxo?'],
  [14.9, 17.6, 'Roxo? Ah… roxo é bem *comum*, né?', 'Roxo? Ah... roxo é bem comum, né?'],
  [20.6, 25.0, 'Calma, gente! Ele não é o ladrão… ele trouxe a madeira *de volta!*', 'Calma, gente! Ele não é o ladrão... ele trouxe a madeira de volta!'],
  [25.8, 27.5, 'Só não alcança o *prego.*'],
  [28.6, 34.4, 'Mil ajudantes novos! *Dinheiro…* *Cofrinho…* finalmente verba pra obra!', 'Mil ajudantes novos! Dinheiro, Cofrinho... finalmente verba pra obra!'],
  [36.2, 39.2, 'Guilherme, eu prometi… promessa é *dívida!*', 'Guilherme, eu prometi... promessa é dívida!'],
  [39.6, 42.3, 'E a turma do anime veio carregar *tora!*'],
  [43.6, 50.3, 'Décima primeira costela… o esqueleto tá *completo!* E agora… as primeiras *TÁBUAS!*', 'Décima primeira costela... o esqueleto tá completo! E agora... as primeiras tábuas!'],
  [51.6, 54.2, 'Cinco dias, Biel? A arara *chegou!*'],
  [56.0, 58.7, 'É *maracajá…* não *maracujá!*', 'É maracajá... não maracujá!'],
  [59.3, 64.5, 'Faltam *61*… e o traidor continua *solto.* Comenta quem foi!', 'Faltam sessenta e um... e o traidor continua solto. Comenta quem foi!'],
  [68.4, 72.3, 'Segurança contratada. *Rosa…* mas contratada.', 'Segurança contratada. Rosa, mas contratada.'],
];

export const VOZES = ['noe', 'noe', 'noe', 'noe', 'vizinho', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe', 'noe'];

export const INTERPRETACAO = [
  { stability: 0.7, style: 0.3, speed: 0.98 },  // sussurrando, sombrio
  { stability: 0.5, style: 0.6, speed: 1.0 },   // voz de trailer
  { stability: 0.3, style: 0.8 },               // indignado → decidido
  { stability: 0.45, style: 0.55, speed: 0.92 },// desconfiado
  { stability: 0.3, style: 0.8, speed: 1.12 },  // vizinho disfarçando
  { stability: 0.25, style: 0.9, speed: 1.12 }, // aliviado, gritando
  { stability: 0.5, style: 0.5, speed: 0.95 },  // seco, piada
  { stability: 0.3, style: 0.85, speed: 1.15 }, // festa
  { stability: 0.3, style: 0.8, speed: 1.12 },  // promessa
  { stability: 0.3, style: 0.85 },              // empolgado
  { stability: 0.25, style: 0.9, speed: 1.12 }, // épico
  { stability: 0.35, style: 0.75 },             // carinhoso
  { stability: 0.4, style: 0.7 },               // corrigindo, bravo
  { stability: 0.35, style: 0.7, speed: 1.12 }, // convite
  { stability: 0.65, style: 0.35, speed: 1.05 }, // sussurrando
];

export const CENAS = [
  [0, 'roubo'], [4, 'titulo'], [7.2, 'manha'], [12, 'fio'], [17.8, 'trex'], [25.2, 'braco'], [28, 'multidao'],
  [35, 'anime'], [43, 'obra'], [51, 'insistentes'], [59, 'final'], [64.6, 'poscreditos'],
];

export const MARCOS = {
  raios: [0.3, 2.95, 4.15],          // relâmpagos (o 3º abre o título)
  titulo: 4.15,
  lupa: [12.1, 12.9],                // a lupa desliza até o fio roxo
  vizinho: 14.5,                     // o vizinho entra assobiando
  cupimRi: [16.0, 17.5],
  passos: [18.0, 18.6, 19.2],        // T-rex saindo da neblina
  rugido: [19.4, 20.6],
  torasCaem: 23.4,                   // ele larga as toras roubadas
  marteladas: [25.8, 26.35, 26.9, 27.45], // o bracinho não alcança
  multidao: [28.2, 2.4],             // início e duração da chegada
  creditos: [28.0, 30.4],
  chao: 30.4,                        // a câmera desce para o chão
  dinheiro: 30.6, cofrinho: 31.3,    // quando o Noé fala o nome de cada um
  apareceu: [32.4, 32.75, 33.1, 33.45],
  grito: 35.3,                       // o ajudante do @guilherme_lima.2310 começa a se transformar
  aura: 35.9,
  corrida: [39.2, 43.0],
  borracha: [40.6, 41.9],            // o braço estica e volta com a tora
  costela: [43.5, 46.1],             // a 11ª costela sobe em câmera lenta
  completo: 46.9,                    // carimbo "ESQUELETO COMPLETO"
  tabuas: [48.4, 48.8, 49.2, 49.6, 50.0],
  arara: 53.0,                       // pousa no ombro do Noé
  uivo: [54.3, 55.7],
  maracuja: 56.1,                    // a fruta cai na cabeça do Noé
  maracaja: 57.6,                    // chega a maracajá de verdade
  cartao: 59.8,
  toque: 60.7,
  recado: 61.7,
  chinelo: [62.0, 62.6],             // voa e faz PLAFT ao lado do cupim
  sombraAsas: 66.5,
  chama: [67.0, 68.1],
  dragao: 68.2,                      // pousa
};

// Cartões de comentário (texto). `resposta`: resposta da página embaixo do comentário.
export const COMENTARIOS = [
  { cartoes: [{ arroba: '@emanuel_.boyzao', texto: 'Sou um traidor e sempre serei, irei roubar os materiais para fazer a arca' }], inicio: 0.9, fim: 3.9 },
  { cartoes: [{ arroba: '@gabrielteixeira6191', texto: 'Vou ser o que vai mais ajudar kk e vamo desmascarar esse traidor' }], inicio: 8.4, fim: 11.9 },
  { cartoes: [{ arroba: '@joaquim.mello17', texto: 'Vizinho' }], inicio: 14.9, fim: 17.6 },
  { cartoes: [
    { arroba: '@pedro_2015_22', texto: 'Quero ser um dinossauro ajudante' },
    { arroba: '@guisimoes7777', texto: 'Quero ser o t rex' },
    { arroba: '@vvgh_244', texto: 'Dia 2 pedindo para ser um dinossauro T-rex' },
  ], inicio: 21.0, fim: 25.0 },
  { cartoes: [{ arroba: '@guilherme_lima.2310', texto: 'Eu quero ser o goku estinto superior', resposta: '↳ @arca_do_noee: próximo vídeo vai ter Goku!!! 🙌' }], inicio: 35.3, fim: 39.0 },
  { cartoes: [
    { arroba: '@abne_rzin99', texto: 'Quero ser o Naruto' },
    { arroba: '@rdg4284', texto: 'Quero ser o Naruto em modo bárion' },
    { arroba: '@_.09kaka', texto: 'Quero ser o luffy no guer 5' },
  ], inicio: 39.1, fim: 42.6 },
  { cartoes: [{ arroba: '@biel.x7_ga', texto: 'Quinto dia pedindo para ser uma arara' }], inicio: 51.2, fim: 54.2 },
  { cartoes: [{ arroba: '@alyfergabrielcamargo', texto: 'Lobo · Lobo · Lbo · Lobo… Até agora eu ainda não apareci', selo: '×30' }], inicio: 54.2, fim: 55.8 },
  { cartoes: [{ arroba: '@maria_luiza02015', texto: 'Quero ser uma maracujá', selo: '×30' }], inicio: 55.8, fim: 58.8 },
  { cartoes: [{ arroba: '@lazaroluizgabryell', texto: 'eu quero ser o chinelo havaianas do noé' }], inicio: 61.7, fim: 64.4 },
  { cartoes: [
    { arroba: '@neguim.031', texto: '3 dia pedindo pra ser um dragão vou proteger a arca de qualquer coisa' },
    { arroba: '@dinheiro854', texto: 'Quero ser um dragão de comodo rosa com asas laranjas e sou ajudante' },
  ], inicio: 68.6, fim: 72.4 },
];

// Quem reclamou que nunca aparece (ganha o selo "APARECEU ✅")
export const APARECEU = ['@gael_kk22', '@gabee.wxz_', '@sr_allan91', '@pietranicolli124'];

// Os 200 seguidores mais novos (créditos)
export const NOVOS = ["@pedro.edd_","@dinheiro854","@baddieinspobtch","@dani_42314","@bbiel972","@3useik","@luiz_gustavoss1602","@luana_souzafig","@josezin2498","@eo_kaue_fxp","@jx_07722","@heitor_sf11","@mgzinn.xv7","@dvzincr7","@filipe0848","@reserva___j0ta","@isaias_w.s_luiz","@silvaalyandro","@brenogk__","@enzo.omr_","@arthurcribari2000","@gabriel_santos_0008","@cofrinho2026","@hann.ie0_0","@nathankapuscinski08","@jessicavitoria1456","@lvzin.wz_777","@arthur_custodio06","@joao_vzin89","@abelzaparollipauluci","@lucas_nascimento844","@mariaeduarda755309","@freitas_684","@muryllo_amaral26","@leozingbyz","@032_itallo","@carlos2447890","@caitano010","@levi8.09","@priv_santo_16","@muril.oxzzk","@pedro_nunes670","@eo_.camargz_.7x","@antonioalencar433","@rhuanzin.vp7","@danie_lkokimoto2","@laurinha_beatrix2","@luishenrique10149","@silva_gdo","@davi_emanoel011","@willyam._.ramirez","@vitinbh24459d","@txt_crls","@dsvi.kk","@grego015_","@derickanastaciopereira","@felipe_silvazx2011","@_marquess005","@gxt_letleti","@anonimoqz.5","@a_paula_torres","@oliveiraxzy7__","@isa_948376","@davi_pele","@raphael60916","@hottaviooo","@dossantosenzogabriel","@palhinhax___","@emanuel159647","@mariatkd09","@lia.dxx","@_jhow0.13","@larasou.xs","@it.is_jane","@vztr43","@sophiavitoria23062014","@ray127648","@gustavo801701","@beatrizhbalbinot","@victorgabriels8","@fotos_de_salsishas","@majusayum","@1.2.3_e_demais","@elisadantasvale","@rochaxxzs__","@p7.caos_","@eo_vitinbkzin","@joaopedro_12334","@kaiozin_vp","@guizin_hzx32","@vi.tinnz","@monster_energy_aurudo","@pietrinho24451","@lele_santana_00","@b.r.u.n.o._.e.d.u.a.r.d.o01","@filosophia_1810","@b1g.xz_","@seishironagi.mar","@eaa_silva.10","@miguelohbrabo","@davialmeidaandujar","@nunes_2014.0r","@bento_izidoro","@elnsk_01","@joaopedrolopeszonin","@sop.sop03","@araujobritox","@lucas.levrone","@pyetrodmr","@davi_murillo015","@slly_dcst","@anasophiakkj","@yuriyt2026","@luizgustavoprobst","@fran.ciscovolei","@offline.23","@miguel194937","@victor579103","@.menor_gb","@gab_55._o","@_flavinho_oficial_1","@vickk_k7","@ryan_grau__","@opvd_dolesz","@enzo227253","@nicolas_ortiz.77","@felip_eluis2015","@oliveirj.joana","@mreisfreitassilva","@matheustokunaga","@miguelmoraes142987","@web_vamp14","@ryanzin997745","@_3fx_eljoa__gg","@pvd_da_vitoria10","@kelvin_phzim","@slk_kauea_","@menezes94k_","@_pedrinho__fut62","@dvsilvaph_021","@thomaswillhan979","@nielzin.013","@moura.martim1234","@lu_heri011","@rafael875653","@levy_silva8","@dtv.dant","@dvx_fxp.7","@matheusbrito7288","@marcusqueroll","@_santhx_s7","@noronh777","@_jnrelikiaa","@luiz_gustavo_pinheiro_bia2073","@sim_e_o_saguado","@vt_batista.2014","@vktmwy","@davilucascjb_bjj","@math1_ofc01","@gustavihenriquecamosogrodovski","@heitorfranz","@gas_heliooo","@sahak_zaza","@ptzin_free_faire","@mateuscardoso3_","@pedrinnz6__","@arptvv7","@rickgamer2020oficial","@lucin32zx","@pqedrinho","@guilhermedavisoares","@pietranicolli124","@dav.ivie","@kennot7_","@santiagomiguelreis","@gabb_xsantosx","@drax.2hx","@evan.affton","@americamariacarolina","@eloazinha_lindinhazinha","@o_jezin_","@iae.fp75","@lucaspatrick518","@lalaurarioss97","@marcos.rafael13_","@desatt.77","@cf_inayarinha","@yveigh7","@kaike__martins11","@zayanguilherme_","@_jonatas_of","@arthurcruz2809","@kaleb_itj","@pedripecias","@dvdpandora","@cwb_lucas_sendeski","@aricleyston","@lilica_mal","@agap.e6742","@alice_ramiresx"];
