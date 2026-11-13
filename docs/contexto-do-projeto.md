# Arca do Noé: contexto completo do projeto

Resumo de tudo o que foi decidido e construído até agora, para retomar o trabalho em qualquer sessão.
Última atualização: depois do vídeo 03 ("A chuva está chegando").

---

## 1. A ideia

- **Personagem:** Noé, um senhor low-poly em 3D que precisa construir a arca antes do dilúvio.
- **Perfil:** **@arca_do_noee** no Instagram (os mesmos vídeos vão para o TikTok).
- **Mecânica:** cada novo seguidor vira um **ajudante** na obra. Ao seguir, a pessoa **garante uma vaga na arca** e
  **pode levar um animal**, que ela pede nos comentários.
- **Site 3D:** mostra a arca sendo construída peça por peça, conforme o número de seguidores.
  Endereço: **https://susalla.github.io/Arca_de_Noe/** (GitHub Pages, branch `main`).
- **Série diária:** cada vídeo mostra o progresso da obra, agradece os novos ajudantes e mostra os animais pedidos.

## 2. Regras de conteúdo (decididas com o dono do perfil)

1. **Sem meta final divulgada.** Nada de "com 10 mil a arca fica pronta". O mote é
   **"Quanto mais gente, mais rápido a gente constrói!"**. O `meta` do `progresso.json` só controla o ritmo interno das peças.
2. **O tempo é relativo na obra.** Cada vídeo é um **"dia da obra"** e não precisa bater com o calendário real.
   O Noé brinca com isso: "ontem pra mim… aqui o tempo passa diferente".
3. **Só o @, sem foto de perfil** dos seguidores nos vídeos. Se alguém pedir para sair, remover o @.
4. **Print do comentário:** quando o animal pedido aparece, mostrar um card "💬 PEDIDO NOS COMENTÁRIOS" com o
   comentário recortado (só @, tempo e texto, sem a foto), com um "plim" de notificação.
5. **Quem não escolheu animal** chega sem animal, e o vídeo pede para comentar.
6. **Quem pede para "ser" um animal** ganha o @ em cima do próprio animal (ou no print).
7. **Upgrade da arca "só um pouco"**, sempre honesto com o número real de seguidores.
8. **Um único `.mp4` por vídeo** (1080×1920, H.264 High, 30 fps, AAC 48 kHz), postado no Instagram e no TikTok.
9. **Legenda menor e baixa:** 30 px a ~70% da altura, longe da coluna de botões da direita e do rodapé do app.
   Legendas **palavra por palavra** (a palavra acende quando é falada).
10. **Gatilhos de retenção:** gancho de perigo nos 2–3 primeiros segundos, piadas com os animais pedidos,
    meta curta ("faltam 8"), CTA com o cartão do perfil e **loop** (o fim emenda no começo).
11. **A arca é grande** (40 × 11 × 8 m), para impressionar.
12. A **foto do perfil** (`assets/perfil.jpg`) aparece no cartão final de todos os vídeos.

## 3. Progresso da série

| Vídeo | Arquivo | Dia da obra | Seguidores | Peças da arca | Destaques |
| --- | --- | --- | --- | --- | --- |
| 01 "O dilúvio está vindo" | `videos/video-01-*.mp4` (versões antigas) | 1 | 0 | nenhuma | Noé sozinho, vaga na arca + animal, time-lapse "DIA ???" |
| 02 "Os 10 primeiros ajudantes" | `videos/video-02.mp4` | 2 | 10 | cavaletes (2%) | feixes de luz, jacaré/onça/elefante, holograma, "faltam 3 para a quilha" |
| 03 "A chuva está chegando" | `videos/video-03.mp4` | 3 | 75 | + quilha, fundo, 1ª costela (7%) | relâmpago, pássaros, pica-pau, "quero ser a arca", leões e pantera |

**Próximo marco:** a 2ª costela sai com **83 seguidores** (faltavam 8 no vídeo 03).

### Ajudantes e animais até agora

**Vídeo 02 (10 primeiros):** @ra.fa_3008, @bn_rlk_.00, @rosangelacosta5123, @vih.vieira13, @afonso_sossio,
@mariana_cardeal82, @lima__pedro17, @chiarellizim 🐊 jacaré, @elcilenebarroso 🐆 onça, @juli.ano15c 🐘 elefante.

**Vídeo 03 (pedidos nos comentários):**

| Animal | Quem pediu |
| --- | --- |
| 🦅 Águia | @m.s.d.s_zin16 |
| 🦅 Gavião | @matheuzin8376 |
| 🐦‍⬛ Urubu | @_kaike_pxp_ |
| 🐦 Pica-pau | @073_r4fael |
| 🛶 "A arca" (virou a quilha) | @smt_gabriel_051 |
| 🐕 Cachorro | @eu_fomiga |
| 🦁 Leão | @isa.bellyayla |
| 🦁 Leão | @offkzip__7 |
| 🐈‍⬛ Pantera negra | @pxt_luan7 |
| 🔨 Ajudantes sem animal | @_nattxw_, @matheus.luan0712, @livia.wts, @glebson_w07, @leo_555_silva |

Os prints recortados ficam em `assets/comentarios/<animal>.png`.

## 4. Como fazer o próximo vídeo (fluxo)

1. O dono manda: **número de seguidores**, **print da lista de seguidores novos** e **print dos comentários** com pedidos.
2. Escolher os animais mais diferentes e engraçados e propor o **roteiro para aprovação** antes de produzir.
3. Recortar os prints dos comentários (`ffmpeg -vf crop=...`), sem a foto de perfil.
4. Criar `js/videoNN-tempos.js` (falas, cenas, marcos), `videoNN.html`, `js/videoNN.js` e `scripts/videoNN.mjs`
   (copiando o vídeo anterior como base).
5. `node scripts/narracao.mjs --video=NN`: gera a voz e confere se as palavras batem com as legendas.
6. Revisar quadros-chave antes de gravar e depois gravar com `node scripts/videoNN.mjs`.
7. Conferir: 1080×1920, ~-14/-15 LUFS, duração certa e a transcrição do vídeo final com a voz audível.
8. Atualizar `progresso.json` (dia, seguidores, `novosAjudantes`, `animais`), o roteiro em `docs/` e enviar para a `main`.
9. Entregar ao dono: vídeo, capa, **legenda do post** e **comentário para fixar** (com os @).

## 5. Estrutura técnica

| Caminho | Função |
| --- | --- |
| `index.html`, `css/estilo.css`, `js/main.js` | Site: painel discreto no canto, botão "Seguir", modo exploração, modo vídeo (`?video=1`) |
| `js/arca.js` | Arca procedural de 55 peças (suportes, quilha, fundo, 11 costelas, 32 tábuas, convés, cabine, janelas, telhado, porta, rampa), porta/rampa e interior |
| `js/personagens.js` | Noé, ajudantes (InstancedMesh), animais quadrúpedes, pássaros (`criarPassaro`, `baterAsas`) |
| `js/noe-rotina.js` | Rotina do Noé no site: busca tora → serra/prega na bancada → leva a tábua → admira; conversa com o jogador |
| `js/jogador.js` | Modo exploração: avatar, joystick, WASD, colisões, rampa e entrada na arca |
| `js/cenario.js` | Chão (plano até 72 m), árvores, montanhas, nuvens, clima |
| `js/efeitos.js` | Chuva, raios, etiquetas 3D, legendas palavra por palavra, feixes, ondas, explosões |
| `trailer.html` + `js/trailer.js` + `js/trailer-tempos.js` | Vídeo 01 |
| `videoNN.html` + `js/videoNN.js` + `js/videoNN-tempos.js` | Vídeos 02 e 03 |
| `scripts/gravar-video.mjs` | Grava a página quadro a quadro (Playwright) e gera o MP4 (ffmpeg) |
| `scripts/narracao.mjs` | Voz na ElevenLabs por fala, encaixe nas janelas, transcrição (Scribe) para as legendas |
| `scripts/trailer.mjs`, `scripts/video02.mjs`, `scripts/video03.mjs` | Trilha sintetizada no ffmpeg + mixagem com ducking + exportação + capa |
| `progresso.json` | Números do dia usados pelo site |
| `assets/perfil.jpg`, `assets/comentarios/` | Foto do perfil e prints dos pedidos |
| `audio/` | Narrações e tempos das palavras de cada vídeo |
| `.claude/skills/` | Skills do projeto: **3d-modeling**, **ffmpeg**, **elevenlabs** |

### Regra das peças da arca

Peça *i* libera com `max(i+1, round(meta × ((i+1)/55)²))` seguidores, com `meta = 10000`.
Com 1 seguidor saem os cavaletes; com 13, a quilha; com 30, o fundo; com 53, a 1ª costela; com 83, a 2ª costela; e assim por diante.

### Comandos

```bash
npm run dev                # site em http://localhost:8080
npm run video              # vídeo diário genérico a partir do progresso.json
npm run video:02           # vídeo 02 (voz + imagem + trilha)
npm run video:03           # vídeo 03
npm run video:03:audio     # refaz só voz e áudio do vídeo 03
```

Testar estágios no site: `?seguidores=10000` (arca pronta), `?seguidores=2600&ontem=2300&dia=30`.

## 6. Voz e áudio

- **ElevenLabs**, voz padrão **"Bill"** (madura, grave), modelo `eleven_multilingual_v2`, interpretação ajustada por fala.
- No plano gratuito, as vozes brasileiras da biblioteca ("Moutella", "Neto") não funcionam pela API (exigem o plano Starter).
- A chave fica salva como segredo de rede do ambiente **"Arca_de_Noe"** (nunca no código). **Pendente:** gerar uma chave nova,
  porque a atual foi colada no chat.
- Trilha e efeitos são **sintetizados no ffmpeg** (trovão, chuva, marteladas, pops, rugidos etc.), sincronizados com a linha do tempo.
- A narração é completada com silêncio até o fim do vídeo (evita cortar os últimos décimos).

## 7. Ambiente e GitHub

- Repositório: **susalla/Arca_de_Noe**. Tudo vai para a `main` (o site é publicado dela) e para a branch de trabalho
  `claude/affectionate-dijkstra-xgv7o5`.
- O app Claude do GitHub está instalado no repositório e o GitHub Pages está ativo (`main`, raiz).
- Os vídeos (`videos/`) não vão para o Git; são entregues como arquivos.
- O ambiente de nuvem "Arca_de_Noe" guarda a chave da ElevenLabs. O site `skills.sh` é bloqueado pela rede.

## 8. Ideias e pendências

- **Integração com o Instagram:** a API oficial dá números (seguidores, alcance, plays) e **comentários com @**, mas **não**
  dá a lista de quem seguiu. Sugestão: mudar a regra para **"comente 🔨 + seu animal para entrar na obra"** e criar um app gratuito
  na Meta com um token (salvo como segredo) para buscar números e comentários automaticamente. O dono ainda não decidiu.
  Alternativa paga: conectores Windsor.ai ou Supermetrics no claude.ai.
- Trocar para uma voz brasileira se assinar o ElevenLabs Starter (`node scripts/narracao.mjs --voz=ID`).
- Gerar uma chave nova da ElevenLabs.
- Futuro: "temporada 2", o dilúvio, quando a arca estiver pronta.
