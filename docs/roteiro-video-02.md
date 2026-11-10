# Vídeo 02: "Os 10 primeiros ajudantes"

**Perfil:** @arca_do_noee · **Formato:** vertical 9:16, 32 s · **Arquivo:** `videos/video-02.mp4` (o mesmo para Instagram Reels e TikTok)

## Regra da série: o tempo é relativo na obra

Cada vídeo é um **"dia da obra"**, que não precisa coincidir com o calendário real. O Noé brinca com isso:
*"Ontem eu estava sozinho… Bom, ontem pra mim. Aqui o tempo passa diferente."* Assim dá para postar no ritmo
que fizer sentido, sem quebrar a história.

## Os ajudantes (só o @, sem foto)

| Ordem | Ajudante | Animal |
| --- | --- | --- |
| 1 | @ra.fa_3008 | (ainda não escolheu) |
| 2 | @bn_rlk_.00 | (ainda não escolheu) |
| 3 | @rosangelacosta5123 | (ainda não escolheu) |
| 4 | @vih.vieira13 | (ainda não escolheu) |
| 5 | @afonso_sossio | (ainda não escolheu) |
| 6 | @mariana_cardeal82 | (ainda não escolheu) |
| 7 | @lima__pedro17 | (ainda não escolheu) |
| 8 | @chiarellizim | 🐊 jacaré |
| 9 | @elcilenebarroso | 🐆 onça |
| 10 | @juli.ano15c | 🐘 elefante |

Se alguém pedir para não aparecer, tire o @ de `js/video02-tempos.js` (e do `progresso.json`).

## Prints dos pedidos

Quando cada animal chega, aparece um card **"💬 PEDIDO NOS COMENTÁRIOS"** com o print do comentário
de quem pediu (com um "plim" de notificação), para valorizar quem comentou. Os prints ficam em
`assets/comentarios/<animal>.png`, recortados só com o @, o tempo e o texto (sem a foto de perfil).

## Roteiro cronometrado

| Tempo | Imagem | Fala do Noé | Som |
| --- | --- | --- | --- |
| 0–2,5 | Tempestade, Noé sozinho e cabisbaixo. Topo: "DIA 1" | **"Ontem eu estava sozinho…"** | Trovão, chuva, drone triste |
| 2,5–5,8 | **Time-lapse do céu** (tempestade → noite → aurora → dia), o Noé coça a cabeça, o contador gira e vira **"DIA 2"**. Nota: "⏳ aqui na obra o tempo passa diferente" | **"Bom… ontem pra mim. Aqui o tempo passa diferente."** | Relógio acelerando, vento, "ding" |
| 5,8–9,3 | **Feixes de luz dourada** descem e os 7 primeiros ajudantes pousam com onda de choque e poeira dourada. Contador "1/10 → 7/10 AJUDANTES" | **"Mas olha só quem chegou!"** | Coral angelical, brilho e baque a cada pouso, notas subindo |
| 9,3–11,5 | Close em câmera lenta: **@chiarellizim chega com o jacaré** + **print do comentário dele** ("vamos com o jacaré") | **"Um JACARÉ?!"** | Grave em câmera lenta, duas bocadas |
| 11,5–14,2 | Close: **@elcilenebarroso chega com a onça** + **print do comentário** ("Vou com uma onça"); o Noé dá um passo para o lado | **"Uma onça… fica do outro lado, tá?"** | Rosnado |
| 14,2–16,8 | **@juli.ano15c chega com o elefante** + **print do comentário** ("Meu mano Noé to chegando com o elefante"): o chão treme | **"Ainda bem que a arca é grande."** | Estrondo, tremor, barrido |
| 16,8–23,2 | Os 10 martelam juntos com **faíscas**; a câmera sobe e os **cavaletes brotam do chão** um a um, com ondas de choque; o último em câmera lenta com **flash dourado**; carimbo **"1ª PEÇA DA ARCA ✅"**; barra "ARCA 2%" | **"Dez ajudantes… e a arca já começou!"** | Batuque de marteladas, baques, "reverse", impacto épico, carimbo |
| 23,2–27 | **Holograma azul** da arca completa sobre os cavaletes, que se desfaz em partículas. Topo: "PRÓXIMA PEÇA: QUILHA · FALTAM 3 👀" | **"Faltam só três pra eu colocar a quilha."** | Zumbido de ficção científica, brilhos subindo |
| 27–32 | Foto de grupo: os 10 pulando e acenando com o Noé. Cartão com a foto do perfil e "Seguir" sendo tocado. Recado: **"7 ajudantes ainda não escolheram o animal… comenta aí 👇"**. O céu volta a escurecer (loop) | **"Obrigado, ajudantes! Quem vem agora?"** | Arpejo de festa, torcida, trovão no fim |

## Legenda do post

> DIA 2 DA OBRA ⏳ (aqui o tempo passa diferente 😅)
> 10 pessoas responderam ao chamado e o Noé não está mais sozinho! 🙌
> Obrigado @ra.fa_3008 @bn_rlk_.00 @rosangelacosta5123 @vih.vieira13 @afonso_sossio @mariana_cardeal82 @lima__pedro17 @chiarellizim 🐊 @elcilenebarroso 🐆 @juli.ano15c 🐘
> A 1ª peça da arca está de pé. Faltam só 3 ajudantes para a QUILHA! 👀
>
> 👇 Ainda não escolheu seu animal? Comenta aí!
> Me siga e garanta sua vaga na arca 🎟️
>
> #arcadonoe #noé #desafio #construção #viral #fyp #reels #animação3d

**Comentário fixado:** "Comenta 🔨 + o animal que você vai levar! Os 3 próximos ajudantes colocam a QUILHA 🛶"

## Como gerar de novo

```bash
npm run video:02          # voz (só as falas que mudaram) + imagem + trilha + exportação
npm run video:02:audio    # refaz só a voz e o áudio, reaproveitando a imagem
```

Saída em `videos/`: `video-02.mp4` (serve para Instagram e TikTok) e `video-02-capa.jpg`.
