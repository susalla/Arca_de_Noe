# Vídeo 01: "O dilúvio está vindo"

**Perfil:** @arca_do_noee · **Formato:** vertical 9:16, 27 s · **Plataformas:** Instagram Reels e TikTok

## A ideia em uma frase

O Noé precisa construir a arca antes do dilúvio e está **sozinho**. Cada seguidor vira um ajudante na obra,
**garante uma vaga na arca e pode levar um animal**. Quanto mais gente, mais rápido a arca fica pronta.
Não existe meta fixa: o final fica em aberto, e cada dia mostramos o progresso.

## Gatilhos usados

| Gatilho | Onde |
| --- | --- |
| **Gancho de perigo** nos primeiros 2 s (tempestade, raio, "O DILÚVIO está vindo") | 0–2,4 s |
| **Vulnerabilidade / empatia** ("SOZINHO", plano aberto com o Noé pequeno no campo vazio) | 2,4–5 s |
| **Regra simples do jogo** (seguir = virar ajudante) | 5–8,7 s |
| **Recompensa pessoal** ("amanhã VOCÊ aparece aqui", etiqueta "@VOCÊ") | 8,7–12 s |
| **Oferta irresistível / escassez** ("VAGA GARANTIDA" na arca + levar um animal; a girafa chega) | 12–15,8 s |
| **Poder coletivo + mistério** (time-lapse da arca gigante subindo, dias passando até "DIA ???") | 15,8–19,8 s |
| **Ameaça / curiosidade** ("você sabe o que acontece") | 19,8–23,3 s |
| **CTA direto + urgência** (cartão com a foto do perfil, "O dilúvio NÃO ESPERA") | 23,3–27 s |
| **Loop**: o fim escuro e chuvoso emenda no começo, e a pessoa assiste de novo sem perceber | 27 s → 0 s |

## Roteiro cronometrado

| Tempo | Imagem | Fala do Noé | Som |
| --- | --- | --- | --- |
| 0,0–2,4 | Tempestade, chuva, **raio**. Câmera baixa se aproxima do Noé. Topo: "⚠️ DIA 1 · 0 AJUDANTES" | **"O dilúvio está vindo."** | Trovão forte, chuva |
| 2,4–5,0 | Corte seco para o dia claro. Close no Noé martelando; a câmera sobe e mostra o campo **vazio** | **"E eu preciso construir uma arca… sozinho."** | Martelada solitária, vento |
| 5,0–8,7 | Ajudantes **caem do céu** em volta dele. Contador: +1, +2… | **"Mas cada pessoa que me seguir vira um ajudante."** | "Pop" a cada ajudante, marteladas |
| 8,7–12,0 | Mais ajudantes; o boneco amarelo **"@VOCÊ"** cai ao lado do Noé | **"Me siga e amanhã você aparece aqui comigo!"** | Sino quando o @VOCÊ pousa |
| 12,0–15,8 | Close no @VOCÊ: aparece o bilhete **"🎟️ VAGA GARANTIDA"** e uma **girafa** chega andando | **"E ainda garante uma vaga na arca… e pode levar um animal!"** | Arpejo de conquista no "vaga", subida (riser) |
| 15,8–19,8 | **Time-lapse:** a arca gigante (40 m) sobe peça por peça, a multidão cresce, animais chegam. Topo: "⏩ DIA 4… 58… DIA ???" | **"Quanto mais gente, mais rápido a gente constrói!"** | Impacto grave, canteiro frenético, acorde épico |
| 19,8–23,3 | Volta ao presente: Noé sozinho de novo, céu escurecendo, começa a chover | **"Sem ajuda… você sabe o que acontece."** | Coração, chuva aumentando, trovões |
| 23,3–27,0 | Close no Noé na chuva. Cartão com a **foto do perfil** e o botão "Seguir" sendo tocado | **"Me segue. O dilúvio não espera."** | Trovão final → corta seco |

## Voz

A narração está em `audio/narracao.mp3`, gerada na ElevenLabs com a voz padrão **"Bill"** (madura e grave),
modelo `eleven_multilingual_v2`, uma fala por vez, com interpretação e velocidade ajustadas para cada trecho
(`js/trailer-tempos.js` → `INTERPRETACAO`). A transcrição automática (Scribe) confirmou o português e os tempos.
Esses tempos alimentam as legendas palavra por palavra e sincronizam o bilhete e a girafa com as palavras "vaga" e "animal".

```bash
node scripts/narracao.mjs        # gera só as falas que mudaram
npm run video:trailer:audio      # refaz o áudio do vídeo
npm run video:trailer            # refaz tudo (imagem + áudio)
```

Para mudar o roteiro, edite só `js/trailer-tempos.js`. A imagem, a narração e a trilha leem os mesmos tempos.

Outra voz: `node scripts/narracao.mjs --voz=VOICE_ID`. No plano gratuito, só as vozes padrão funcionam pela API;
as vozes brasileiras da biblioteca ("Moutella", "Neto") exigem o plano Starter.

## Legenda do post

> O dilúvio está vindo e eu estou SOZINHO. 😰🌧️
> Cada pessoa que me seguir vira ajudante na construção da arca, ganha VAGA GARANTIDA e pode levar um animal! 🎟️🦒
> Quanto mais gente, mais rápido a gente constrói. 🔨
> Dia 1 de ??? ⛈️
>
> 👇 Comenta qual animal você levaria pra arca!
>
> #arcadonoe #noé #desafio #construção #viral #fyp #reels #animação3d

**Comentário fixado:** "Comenta 🔨 + o animal que você vai levar, e amanhã você aparece na obra!"

## Dicas de publicação

- **Capa:** `videos/video-01-capa.jpg` (o Noé sozinho com "O DILÚVIO ESTÁ VINDO").
- **Horário:** entre 18h e 21h. Responda os primeiros comentários na primeira hora.
- **Comentários = conteúdo:** os animais que o pessoal pedir viram a fila de animais dos próximos vídeos.
- **TikTok:** use `video-01-tiktok.mp4`. Ative "Permitir Dueto/Costura", porque é um convite natural.
- **Vídeo 02 (amanhã):** os primeiros ajudantes de verdade, com os @, e o animal que cada um escolheu.
