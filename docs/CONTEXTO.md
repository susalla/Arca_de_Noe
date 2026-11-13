# Contexto do projeto: A Arca do Noé (@arca_do_noee)

Resumo de tudo o que foi decidido e produzido nesta conversa, para retomar o trabalho em qualquer sessão.
Atualizado em 13/11/2026 (vídeo 06). Branch de trabalho: `claude/eloquent-hypatia-gj9ec9`.

---

## 1. O projeto

- **Perfil:** @arca_do_noee (Instagram e TikTok).
- **A ideia:** cada seguidor vira um "ajudante" do Noé, e a arca vai sendo construída em 3D conforme o perfil cresce.
- **Animais:** quem comenta pede o animal que vai levar.
- **Formato dos vídeos:** vertical 9:16, 1080×1920, um único `.mp4` para Instagram e TikTok. A legenda aparece palavra por palavra, na parte de baixo.
- **Tempo da obra:** cada vídeo de obra é um "DIA" da obra. O tempo é relativo onde o Noé está, então não precisa bater com o calendário.
- **Site:** página 3D interativa (`index.html`). O visitante pode andar pela obra como um ajudante, e o progresso vem de `progresso.json`.

### Como os vídeos são feitos (tudo por código, sem editor)
- **Linha do tempo:** cada vídeo tem um arquivo `js/<nome>-tempos.js`, que é a fonte única de falas, tempos, cenas, marcos e comentários.
- **Imagem:** `js/<nome>.js` + `<nome>.html` (cena em three.js, determinística por tempo `t`). O `scripts/gravar-video.mjs` grava quadro a quadro com o Playwright.
- **Trilha:** `scripts/<nome>.mjs` sintetiza trilha e efeitos no ffmpeg (sem samples), mixa a voz com ducking, exporta o `.mp4` e gera a capa.
- **Vozes:** `scripts/narracao.mjs --video=<nome>` gera as vozes na ElevenLabs (o proxy já injeta a chave), encaixa cada fala na janela de tempo e transcreve as palavras para as legendas. Só gera de novo o que mudou.
- **Pré-visualização de quadros:** script de apoio fora do repositório que renderiza tempos específicos da página para conferir o enquadramento.
- **Saída:** os vídeos saem em `videos/`, que fica no `.gitignore`. A gravação leva de 10 a 20 minutos por vídeo.

### Vozes
- **Noé:** "Bill" (`pqHfZKP75CvOlQylNhV4`), grave e madura.
- **Vizinho:** "Callum" (`N2lVS1w4EtoT3dr4eOWO`), rouca e debochada.

---

## 2. Preferências do usuário (seguir sempre)

- **Comunicação:** escreve em português do Brasil, e a resposta deve vir no mesmo idioma, com as legendas prontas para colar no chat.
- **Arquivos:** o usuário **não consegue abrir os arquivos**. Mandar roteiro, legenda e comentário fixado **no próprio chat**.
- **Produção um a um:** mandar o roteiro, esperar o ok, produzir e esperar o ok antes do próximo.
- **Comentários sem print:** aparecem em **cartão de texto** (avatar com a inicial, o @ e o comentário). Sempre precisam mostrar o @ e o comentário do seguidor.
- **Seguidores no vídeo:** mostrar os @ (rótulos em cima dos bichos e pessoas, créditos que sobem na tela) e criar interação com o que eles comentam.
- **Animais diferentes:** preferir os "diferentões" e evitar os genéricos (o casal de elefante foi cortado por ser genérico). Pôr só alguns por vídeo e guardar o resto para os próximos.
- **Cupim:** deve virar **algo icônico do canal**, um vilão fofo e recorrente.
- **Ritmo da obra:** os seguidores estão crescendo rápido, então a obra precisa **durar bastante** e não pode evoluir demais por vídeo. A arca termina nos **10 mil** ("depois inventamos algo pra continuar").
- **Conteúdo a evitar:** comentários com palavrão ou que possam soar ofensivos (ex.: "…de escravo", "viado", "seu caraio…").
- **Avulsos:** vídeos fora da obra para engajar (não avançam a arca) também fazem parte da estratégia.

---

## 3. A arca e a regra das peças

- **Peças:** 56 no total (as contas antigas usavam 55; o site e os vídeos usam 56), na ordem suportes → quilha → fundo → 11 costelas → 32 tábuas → convés → cabine → janelas → telhado → porta → rampa.
- **Ordem das costelas:** do centro para as pontas. A peça 3 é a 1ª costela, e a peça 10 é a 8ª.
- **Curva atual:** `EXPOENTE_CURVA = 1.25` em `js/arca.js`, quase linear, com `meta` de 10.000. Dá mais ou menos uma peça a cada ~180 seguidores.
  - Antes a curva era quadrática (expoente 2). Mudou no vídeo 05 porque com 1700 seguidores pularia para 22 peças.

| Seguidores | Peças | Situação |
| --- | --- | --- |
| 75 | 4 | vídeo 03 (quilha, fundo, 1ª costela) |
| 378 | 10 | vídeo 04 (até a 7ª costela), ainda na curva antiga |
| 1700 | 13 | vídeo 05 (até a 10ª costela, 23%) |
| **2700** | **19** | **vídeo 06 (11ª costela + tábuas 1 a 5, 34%)** |
| 2761 | 20 | próxima peça: 6ª tábua |
| 5000 / 10000 | ~31 / 56 | projeção |

`progresso.json` atual: dia 6, 2700 seguidores, meta 10.000.

---

## 4. Personagens e elementos recorrentes

- **Noé:** o protagonista. Tem martelo, pergaminho e **olhos que brilham em vermelho** no "modo terror" (`noe.olhos`).
- **Vizinho:** túnica roxa, chapéu de palha, bigode e sobrancelha de deboche (classe `Vizinho` em `js/personagens.js`).
  - Zombou da obra no POV e virou ajudante.
  - "A roupa roxa é exclusiva."
  - Foi suspeito no vídeo 05, e o caramelo roubou o chapéu dele.
- **Cupim:** o vilão fofo do canal (`criarCupim()`), com cabeça marrom, olhos grandes, antenas e mandíbula que rói.
  - Placa "PROIBIDO CUPIM 🚫" e a fala "Quem pedir cupim… vai se ver comigo".
  - Espia nos finais, roeu o pergaminho no Noé responde e foi suspeito do buraco.
- **Pica-pau do @073_r4fael:** bica a costela sem parar ao fundo. É o "🥇 1º LUGAR".
- **Mistério do traidor:** o @emanuel_.boyzao confessou ter feito um buraco no fundo da arca. Os suspeitos são o Cupim, o Vizinho e um encapuzado. Também há um olho espiando pelo buraco.
- **Dinossauro:** pegada de T-rex na cena pós-créditos do vídeo 05. Vários seguidores pediram dinossauro.
- **Animais já modelados** (em `TIPOS_DE_ANIMAIS`):
  - **Comuns:** ovelha, vaca, cavalo, porco, leão, elefante, girafa, zebra, urso, coelho, galinha, cachorro, gato, camelo, pinguim, jacaré, pantera, onça.
  - **Aves:** águia, gavião, urubu, pica-pau, flamingo, harpia, bico-de-sapato, quero-quero.
  - **Diferentões:** hipopótamo, ornitorrinco, camaleão, lagarto, tigre, puma, gorila ("golira"), macaco, lontra.
  - **Construtores próprios:** tardígrado (`criarTardigrado()`) e cupim (`criarCupim()`).
- **Já usados nos vídeos:** ornitorrinco, flamingo, hipopótamo, golira, camaleão, lontra, tardígrado e harpia.
- **Modelados e ainda não usados:** macaco, tigre, puma, lagarto, bico-de-sapato e quero-quero.
- **Novos no vídeo 06:** `criarTrex()` (bracinho com martelo), `criarDragao()` (rosa, asas laranjas, funciona com `baterAsas`), e os tipos `arara`, `lobo` e `maracaja`.

---

## 5. Vídeos produzidos

| # | Título | Duração | Comando | Roteiro |
| --- | --- | --- | --- | --- |
| 01 | "O dilúvio está vindo" (trailer) | — | `npm run video:trailer` | `docs/roteiro-video-01.md` |
| 02 | "Os 10 primeiros ajudantes" | 32 s | `npm run video:02` | `docs/roteiro-video-02.md` |
| 03 | "A chuva está chegando" | 36,5 s | `npm run video:03` | `docs/roteiro-video-03.md` |
| Avulso | "POV: barco a 500 km do mar" | 39 s | `npm run video:pov` | `docs/roteiro-avulso-pov.md` |
| 04 | "Era pra ser 200… chegaram 378!" | 55 s | `npm run video:04` | `docs/roteiro-video-04.md` |
| Avulso | "Noé responde comentários #1" | 50 s | `npm run video:responde1` | `docs/roteiro-responde-1.md` |
| 05 | "O traidor da arca" | 54 s | `npm run video:05` | `docs/roteiro-video-05.md` |
| 06 | "O roubo da madeira" | 72,5 s | `npm run video:06` | `docs/roteiro-video-06.md` |
| Avulso | "Noé responde comentários #2" | 63 s | `npm run video:responde2` | `docs/roteiro-responde-2.md` |

Cada comando tem a variante `:audio`, que refaz só a voz e a trilha e reaproveita a imagem gravada. Saídas: `videos/<nome>.mp4` e `videos/<nome>-capa.jpg`.

### Resumo de cada um (os vídeos produzidos nesta conversa)

**Avulso POV "barco a 500 km do mar"**
- O Vizinho zomba ("cadê o mar?"), o Noé responde "vai chover" e aparece uma nuvenzinha em cima da cabeça do Vizinho.
- Os bichos dos seguidores reagem:
  - O cachorro do @eu_fomiga late.
  - O urubu do @_kaike_pxp_ encara.
  - Os leões do @isa.bellyayla e do @offkzip__7 rugem, e o Vizinho foge.
- "Algum tempo depois…" vem a chuva, o Vizinho volta pedindo para ser ajudante e vira +1 ajudante.
- O Noé tem uma **visão** de gente e bichos a caminho, com o contador "200 AJUDANTES A CAMINHO".
- O gancho prometeu: "no próximo vídeo a gente comemora 200 ajudantes".
- Pergunta final: "vizinho ou ajudante?".

**Vídeo 04 "Era pra ser 200… chegaram 378!"** (DIA 4, 75 → 378)
- **A promessa dos 200:** faixa "200 AJUDANTES", e o contador passa dos 200 até 378. O Vizinho risca o 200 e escreve 378.
- **Novos ajudantes:** chuva de 303 ajudantes, com os 100 @ mais novos em créditos.
- **Material:** a carroça de toras do @garciaxxzn ("caminhão com material"), puxada pelo cavalo do @kaike_salless.
- **Os escolhidos:** "@rodri.cuts… dessa vez eu te escolhi".
- **Cupim:** placa PROIBIDO CUPIM e a **cena de terror**, com céu escuro, luz vermelha, olhos vermelhos e zoom: "Quem pedir cupim… vai se ver comigo".
- **Os diferentões caindo do céu:** o ornitorrinco do @negao_paciencia, o flamingo do @barbara.ilopes (casal com o do @pxt_luan7) e o hipopótamo do @kendrewff.
- **"Eu" ×27:** balões "Eu" do @davi.lucas.0077.
- **A obra:** as costelas 2 a 7 sobem, a arca vai de 7% para 18%, e o cupim espia no final.

**Noé responde comentários #1**
- **Chantagem da lontra:** "Lontra se não colocar vou querer cupim", do @paolodesouzanunes. O olho vermelho volta por meio segundo e o Noé cede: "pode ser uma lontra".
- **Tardígrado na lupa:** do @rick.brucee.
- **Camaleão:** do @kaio_kainan_, camuflado na costela, pisca verde.
- **Golira:** do @breno_gx_077, cai batendo no peito.
- **2º lugar:** o @vitinksgk pediu; o 1º é do pica-pau.
- **Os insistentes:** unicórnio ×65 do @isaias10987654321 contra dragão-de-komodo ×38 do @lccscoutinho, num ringue.
- **"Eu quero ser o noe"** (@enzinho125c): "Isso **Noé** da sua conta!".
- **Roupa roxa:** o Vizinho responde ao @thayxyl.
- **PLAFT:** no pernilongo (@shinaydabazar) e no mosquito (@paulo.sjb_).
- **Final:** o cupim rói o pergaminho e acena.

**Vídeo 05 "O traidor da arca"** (DIA 5, 378 → 1700)
- **O mistério:** buraco no fundo com luz, confissão do @emanuel_.boyzao e fila de suspeitos.
- **Novos ajudantes:** os 200 @ novos em créditos, e o "Ayrton Senna" do @valentina.m.s.o passa de capacete.
- **Fila dos esquecidos:** @gabrielteixeira6191, @joaozin.lz e @felipinho_snts2016.
- **Caramelo:** o do @d4vix_408 rouba o chapéu do Vizinho.
- **A obra:** a harpia do @guto_2.018 carrega as costelas 8, 9 e 10.
- **Final:** o olho espia pelo buraco e vem a pergunta "QUEM É O TRAIDOR? Comenta".
- **Pós-créditos:** pegada de T-rex. O cartão é do @vvgh_244, e o Noé sussurra "…Isso não é um cupim."

**Vídeo 06 "O roubo da madeira"** (DIA 6, 1700 → 2700, 72,5 s, visual de cinema)
- **Abertura fria:** o encapuzado rouba a madeira na chuva (@emanuel_.boyzao: "irei roubar os materiais"), título de filme "O ROUBO".
- **Cena do crime:** o @gabrielteixeira6191 vira detetive; a lupa acha um **fio roxo**; o Vizinho: "roxo é bem comum, né?"; cartão do @joaquim.mello17 "Vizinho".
- **T-rex:** sai da neblina, ruge e **devolve as toras** (@pedro_2015_22, @guisimoes7777, @vvgh_244); o bracinho não alcança o prego.
- **+1000:** créditos dos 200 novos; @dinheiro854 e @cofrinho2026 ("finalmente verba"); selo "VOCÊS APARECERAM" para @gael_kk22, @gabee.wxz_, @sr_allan91 e @pietranicolli124.
- **Anime (homenagem):** o ajudante do @guilherme_lima.2310 fica de cabelo prateado com aura (promessa da página cumprida); a turma corre de braços para trás com tora na cabeça e um estica o braço de borracha.
- **Obra:** 11ª costela (esqueleto completo) + tábuas 1 a 5 (23% → 34%).
- **Insistentes:** arara do @biel.x7_ga (5º dia), lobo do @alyfergabrielcamargo (×30), maracujá/maracajá da @maria_luiza02015 (×30).
- **Final:** faltam 61 para a 6ª tábua; chinelo do @lazaroluizgabryell no cupim. **Pós-créditos:** o dragão rosa (@neguim.031, @dinheiro854) espanta o encapuzado.

As legendas prontas e os comentários fixados de cada vídeo estão no respectivo `docs/roteiro-*.md`.

---

## 6. Material guardado para os próximos vídeos

### Ganchos em aberto
- **Quem é o traidor?** No vídeo 06 o encapuzado roubou a madeira e deixou um **fio roxo** (o Vizinho disfarçou: "roxo é bem comum"). Usar os palpites dos comentários no próximo.
- **O dragão rosa de asas laranjas** (@neguim.031 e @dinheiro854) virou o segurança da arca no pós-créditos do vídeo 06.
- **O T-rex** (@pedro_2015_22, @guisimoes7777, @vvgh_244) é ajudante, mas o bracinho não alcança o prego.
- **O dinossauro da pegada.** Pedidos de dinossauro:
  - **T-rex:** @vvgh_244 ("dia 2 pedindo").
  - **Espinossauro:** @lor.enzo_cardo.so.
  - **Dinossauro:** @nycollasazevedocorreia e @pedro_2015_22.
- **Noé responde #2:** feito (unicórnio versão obra, sobrinho Jafé, orangotango, balança-rabo-leitoso, barata gamer, disco voador, golira-Golias, basilisco, peixe gigante). O cupim virou pedra e piscou no final; o #3 foi prometido. Guardados para o #3: efelonte, babuíno da bunda dourada, tubarão fora d'água, jacaré comendo banana e ajudante de roupa rosa.
- **O cupim:** continua rondando a obra.

### Comentários bons que ainda não foram usados
- **Para um final emocionante:** @nicolas_0exe0, "Eu trago a semente pras árvores".
- **Dragão:** @guisimoes7777. A página já respondeu "dragão 🐉 gostei da ideia".
- **Outros pedidos de animal:**
  - lagosta: @lucas.antunes27
  - tamanduá-bandeira: @joaoamancio2012
  - ocapi: @santox.__zz
  - panda: @loh_soarex98 e @luluqunhafc990
  - raposa: @heiygeo
  - lobo: @bernard0_7
  - tatu: @m.s.d.s_zin16
  - paca: @trista_costa
  - ovelha rosa: @izalinda04
  - pônei: @reisyaradacruz
  - alce: @thallescavalcante848
  - arara, 2º dia pedindo: @biel.x7_ga
  - hiena: @_dv.japa
  - macaco: @plxzk.bh, @jonatan.you7 e @miguel____ferro
  - tigre: @bananaolopes, @arthurxx_57, @augusto_venuto e @santosbeatrizcostados
  - onça-pintada: @priv_pridias e @marialuisaa_santana
  - guepardo: @adszi.nn
  - dragão-de-komodo: @miguel.xl
  - rato: @davidph
  - anta: @antony_kauanz
- **Comentários que dão roteiro:**
  - "Eu quero ser um construtor profissional" (@renata_florencio07)
  - "Eu quero ser um bicho" (@rodriguessvitor_)
  - "Eu quero chegar sendo pessoas" (@_luar4.85)

### Seguidores
- **Usados nos créditos:** a lista dos 100 seguidores do vídeo 04 e dos 200 do vídeo 05 está nos `js/video04-tempos.js` e `js/video05-tempos.js`.
- **Comentaram "Ajudante" e ainda não ganharam destaque:** @sebinharoberto, @italo_quem, @joaog_abriel2505, @vict.orhugo7828, @lh.davi, @kauamm.12354meyreles, @mano_rafa157cafazera, @alice_damiani_de_carvalho, @snicolastorresda, @heitor_corintiano ("sendo um elefante") e @luiz_otaviojgdr ("chegando em um leão").

### Ideias de avulsos do primeiro roteiro (`docs/roteiros-avulsos.md`)
- **Série "Você sabia?":** cada vídeo traz uma revelação com o versículo na tela:
  - quem fechou a porta foi Deus (Gn 7:16)
  - sete pares de animais limpos (Gn 7:2)
  - mais de um ano dentro da arca
  - o Noé tinha 600 anos
  - o corvo antes da pomba (Gn 8:7)
  - a arca media ~135 m (Gn 6:15)
  - Deus avisou 7 dias antes (Gn 7:4)
- **"Lista de embarque":** o Noé faz a chamada dos novos seguidores e as pessoas pausam o vídeo para achar o próprio nome.
- **Mito ou verdade:** "tinha dinossauro na arca?" combina com a pegada.

---

## 7. Fluxo de trabalho para o próximo vídeo

1. **Material do usuário:** número de seguidores do dia, comentários dos últimos vídeos e lista de seguidores novos.
2. **Seleção:** escolher os comentários mais engraçados e diferentes (sem palavrão nem ofensa) e dividir entre o vídeo de obra e o avulso.
3. **Peças da obra:** calcular quantas peças sobem com a curva atual (`limiarDaPeca` em `js/arca.js`) e o "faltam X" da próxima.
4. **Aprovação do roteiro:** mandar o roteiro **no chat**, com uma tabela de tempo, tela e fala, mais a legenda e o comentário fixado, e esperar o ok.
5. **Produção:** criar `js/<nome>-tempos.js`, gerar as vozes (`node scripts/narracao.mjs --video=<nome>`), montar a cena, conferir os quadros, escrever a trilha e gravar.
6. **Entrega:** conferir a capa, mandar vídeo e capa, colar a legenda e o comentário fixado no chat, fazer commit e push no branch, e atualizar o `progresso.json` e o README.
