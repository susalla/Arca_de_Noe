# A Arca do Noé 🔨🛶

**Cada novo seguidor no Instagram vira um ajudante do Noé.** No dia 1 só existe o Noé e uma
pilha de toras. Conforme o perfil cresce, a arca vai sendo construída peça por peça numa página 3D,
os ajudantes aparecem em volta da obra e, no fim, os animais chegam em casais.

## Como funciona

- **Ajudantes:** um bonequinho para cada seguidor (até 600 desenhados na tela; o contador continua acima disso).
- **Arca:** 55 peças, em ordem de construção: suportes → quilha → fundo → 11 costelas → 32 tábuas →
  convés → cabine → janelas → telhado → porta → rampa. Cada peça é liberada ao atingir um número de seguidores.
  A curva é quase linear (`EXPOENTE_CURVA = 1.25` em `js/arca.js`): uma peça a cada ~180 seguidores,
  e a arca fica pronta na `meta` (padrão: 10.000). Com 1700 seguidores são 13 peças (até a 10ª costela).
- **Clima:** o céu vai escurecendo conforme a arca fica pronta. O dilúvio está chegando!
- **Animais:** você escolhe quais casais entram, em `progresso.json`.
- **Nomes:** os @ dos novos ajudantes do dia aparecem flutuando sobre eles.

## Explorar a obra (site)

No site, o botão **🎮 Explorar a obra** coloca o visitante na obra como um ajudante:

- **Celular:** joystick no canto inferior esquerdo; arraste a tela para olhar em volta.
- **Computador:** WASD ou setas para andar, Shift para correr, arraste com o mouse para girar a câmera.
- **Noé:** trabalha sozinho num ciclo de ~27 s: busca tora na pilha → serra e prega na bancada → leva a tábua
  pronta até a arca → admira a obra. Se o visitante chega perto, ele para, acena e conversa.
- **Entrar na arca:** quando o casco estiver fechado e a porta e a rampa prontas, dá para subir a rampa e entrar.
  Lá dentro há baias, feno, lanternas e a placa **🎟️ SUA VAGA**. Antes disso, dá para andar entre as costelas da obra.

O progresso fica num painel pequeno no canto (toque no título para recolher), com o botão "Seguir" no outro canto.

Para testar a arca pronta: http://localhost:8080/?seguidores=10000

## Rotina diária (5 minutos)

1. Edite **`progresso.json`**:

   ```json
   {
     "dia": 12,
     "perfil": "@arca_do_noee",
     "seguidores": 340,
     "seguidoresOntem": 290,
     "meta": 10000,
     "novosAjudantes": ["@ana", "@joao", "@bia"],
     "animais": ["ovelha", "leao"]
   }
   ```

   - `seguidoresOntem`: o número do dia anterior. A diferença é o que aparece "chegando" no vídeo.
   - `animais`: o **último** da lista é tratado como o casal novo do dia e chega andando.
     Tipos disponíveis: `ovelha`, `vaca`, `cavalo`, `porco`, `leao`, `elefante`, `girafa`, `zebra`,
     `urso`, `coelho`, `galinha`, `cachorro`, `gato`, `camelo`, `pinguim`.

2. Grave o vídeo do dia:

   ```bash
   npm run video
   ```

   Sai em `videos/dia-012.mp4`, já em 1080×1920 (formato de Reels/Stories), com 12 s ou mais.

3. Publique o vídeo no Instagram e suba o `progresso.json` atualizado para o site.

## Vídeo 01: "O dilúvio está vindo" (trailer de lançamento)

Roteiro, gatilhos, texto da narração e legenda do post: [`docs/roteiro-video-01.md`](docs/roteiro-video-01.md).

```bash
npm run video:trailer
```

Gera em `videos/`: `video-01.mp4` (o mesmo arquivo serve para Instagram e TikTok) e `video-01-capa.jpg`.
A trilha e os efeitos (trovão, chuva, marteladas, pops, impacto, coração) são sintetizados no ffmpeg e
sincronizados com as cenas. Para incluir a voz do Noé, salve a narração em `audio/narracao.mp3` e rode
`npm run video:trailer:audio` (reaproveita as imagens e só refaz o áudio). A música abaixa sozinha quando ele fala.

Pré-visualização no navegador: http://localhost:8080/trailer.html

## Vídeo 02: "Os 10 primeiros ajudantes"

Roteiro e legenda: [`docs/roteiro-video-02.md`](docs/roteiro-video-02.md). Gere com `npm run video:02`
(saída: `videos/video-02.mp4` + capa). Cada pedido de animal aparece com o print do comentário de quem pediu
(`assets/comentarios/`).

**Padrão da série:** um único `.mp4` por vídeo (1080×1920, H.264, AAC 48 kHz) para Instagram e TikTok;
legenda palavra por palavra, menor e na parte de baixo, fora das áreas cobertas pelos botões do app;
cada vídeo é um "dia da obra" (o tempo é relativo onde o Noé está).

## Vídeo 04: "Era pra ser 200… chegaram 378!"

Roteiro e legenda: [`docs/roteiro-video-04.md`](docs/roteiro-video-04.md). Gere com `npm run video:04`
(saída: `videos/video-04.mp4` + capa). Os comentários aparecem como cartão de texto (@ + comentário),
e os 100 seguidores mais novos sobem na tela como créditos.

## Vídeo 05: "O traidor da arca"

Roteiro e legenda: [`docs/roteiro-video-05.md`](docs/roteiro-video-05.md). Gere com `npm run video:05`
(saída: `videos/video-05.mp4` + capa). Mistério do buraco, fila de suspeitos, harpia trazendo as costelas 8 a 10
e cena pós-créditos com a pegada de T-rex.

## Vídeo 06: "O roubo da madeira"

Roteiro e legenda: [`docs/roteiro-video-06.md`](docs/roteiro-video-06.md). Gere com `npm run video:06`
(saída: `videos/video-06.mp4` + capa). Visual de cinema: roubo na chuva, fio roxo na cena do crime, o T-rex devolvendo
a madeira, a transformação de anime, o esqueleto completo com as primeiras tábuas e o dragão rosa no pós-créditos.

## Vídeos avulsos (fora da obra)

Vídeos só para engajar, que não avançam a arca. Ideias e roteiros: [`docs/roteiros-avulsos.md`](docs/roteiros-avulsos.md).

- **POV "barco a 500 km do mar"** (Noé + Vizinho, duas vozes): [`docs/roteiro-avulso-pov.md`](docs/roteiro-avulso-pov.md).
  Gere com `npm run video:pov` (saída: `videos/avulso-pov.mp4` + capa).
- **Noé responde comentários #1:** [`docs/roteiro-responde-1.md`](docs/roteiro-responde-1.md).
  Gere com `npm run video:responde1` (saída: `videos/responde-1.mp4` + capa).

## Rodar localmente

```bash
npm run dev
```

Abra http://localhost:8080. Dá para girar a câmera com o mouse ou o dedo.

**Atalhos para testar estágios** sem mexer no `progresso.json` (funcionam no site e no gravador):

- http://localhost:8080/?seguidores=2600&ontem=2300&dia=30
- http://localhost:8080/?seguidores=9800&animais=ovelha,leao,elefante,girafa
- http://localhost:8080/?video=1 (pré-visualização do vídeo em loop, 9:16)

```bash
npm run video -- --seguidores=5000 --ontem=4700 --dia=50 --animais=ovelha,zebra
```

## Requisitos

- Node.js 18+
- Para gravar vídeos: [Playwright](https://playwright.dev) com Chromium (`npx playwright install chromium`) e `ffmpeg`.
- O site em si é estático (HTML + JS), sem build e sem dependências externas: o three.js está em `vendor/`.

## Publicar o site

Qualquer hospedagem estática serve. O caminho mais simples é o **GitHub Pages**: Settings → Pages →
"Deploy from a branch" → `main` / raiz. Depois coloque o link na bio do Instagram.

## Estrutura

| Arquivo | O que faz |
| --- | --- |
| `progresso.json` | Os números do dia (único arquivo que você edita no dia a dia) |
| `js/arca.js` | Geometria da arca e ordem/limiar de cada peça |
| `js/personagens.js` | Noé, ajudantes e animais |
| `js/cenario.js` | Chão, árvores, montanhas, nuvens e clima |
| `js/main.js` | Junta tudo: painel, câmera, modo site, modo exploração e modo vídeo |
| `js/jogador.js` | Modo exploração: avatar, joystick, teclado, colisões, rampa e porta |
| `js/noe-rotina.js` | Rotina de trabalho do Noé (pilha → bancada → obra) e conversa |
| `scripts/gravar-video.mjs` | Gera o MP4 vertical quadro a quadro |
| `docs/plano-instagram.md` | Estratégia de conteúdo e legendas prontas |
| `trailer.html` + `js/trailer.js` | Cenas do vídeo 01 (linha do tempo, chuva, raios, legendas) |
| `scripts/trailer.mjs` | Trilha sintetizada + mixagem + exportação Instagram/TikTok |

Tudo é low-poly e gerado por código, na escala de 1 unidade = 1 metro. Não há modelos 3D externos
para importar nem problema de escala ou rotação na exportação. Os ajudantes usam instancing, então
centenas de bonecos custam só 2 chamadas de desenho e o site roda bem no celular.
