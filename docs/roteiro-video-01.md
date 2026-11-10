# Vídeo 01: "O dilúvio está vindo"

**Perfil:** @arca_do_noee · **Formato:** vertical 9:16, 23 s · **Plataformas:** Instagram Reels e TikTok

## A ideia em uma frase

O Noé precisa construir a arca antes do dilúvio e está **sozinho**. Cada seguidor vira um ajudante de verdade na obra.

## Gatilhos usados

| Gatilho | Onde |
| --- | --- |
| **Gancho de perigo** nos primeiros 2 s (tempestade, raio, "O DILÚVIO está vindo") | 0–2,4 s |
| **Vulnerabilidade / empatia** ("SOZINHO", plano aberto com o Noé pequeno no campo vazio) | 2,4–5 s |
| **Regra simples do jogo** (seguir = virar ajudante) | 5–8,6 s |
| **Recompensa pessoal** ("amanhã VOCÊ aparece aqui", etiqueta "@você") | 8,7–12,4 s |
| **Visão do futuro / meta coletiva** (arca pronta, animais, 10 mil) | 12,5–16,5 s |
| **Ameaça / curiosidade** ("você sabe o que acontece") | 16,5–20 s |
| **CTA direto + urgência** ("O dilúvio NÃO ESPERA") | 20–23 s |
| **Loop**: o fim escuro e chuvoso emenda no começo, então a pessoa assiste de novo sem perceber | 23 s → 0 s |

## Roteiro cronometrado

| Tempo | Imagem | Fala do Noé (narração) | Som |
| --- | --- | --- | --- |
| 0,0–2,4 | Céu de tempestade, chuva, **raio**. Câmera desce do céu até o Noé, pequenininho. Topo: "DIA 1 · 0 AJUDANTES" | **"O dilúvio está vindo."** (grave, sério) | Trovão forte, chuva |
| 2,4–5,0 | Corte seco para o dia claro. Close no Noé martelando; a câmera sobe e mostra o campo **vazio**, só ele e as toras | **"E eu preciso construir uma arca… sozinho."** (pausa antes de "sozinho") | Martelada solitária, vento |
| 5,0–8,6 | Ajudantes começam a **cair do céu** em volta dele, um por um. Contador: +1, +2… | **"Mas cada pessoa que me seguir vira um ajudante na obra."** | "Pop" a cada ajudante, marteladas em ritmo |
| 8,7–12,4 | Mais ajudantes; aparece a etiqueta **"@você"** sobre um deles | **"Me siga e amanhã você aparece aqui, martelando comigo."** (sorrindo) | Marteladas, música crescendo |
| 12,5–16,5 | **Flash-forward:** a arca pronta, centenas de ajudantes, animais em fila, céu fechando. Topo: "DIA ??? · 10.000 AJUDANTES" | **"Com dez mil ajudantes, a arca fica pronta."** | Subida (riser) + impacto grave |
| 16,5–20,0 | Volta ao presente: Noé sozinho de novo, o céu escurece, começa a chover | **"Sem eles… você sabe o que acontece."** (baixo) | Batida de coração, chuva aumentando, trovão |
| 20,0–23,0 | Close no Noé na chuva. Cartão: **"SEGUIR @arca_do_noee"** | **"Me segue. O dilúvio não espera."** (firme) | Trovão final → corta seco |

**Tom da voz:** um senhor de idade, voz grave e calorosa, um pouco cansada, mas com bom humor. Fale devagar no gancho e no "sozinho" e com energia no "me siga".

## Texto para narração (para gravar ou colar no gerador de voz)

```
O dilúvio está vindo.
E eu preciso construir uma arca... sozinho.
Mas cada pessoa que me seguir vira um ajudante na obra.
Me siga e amanhã você aparece aqui, martelando comigo.
Com dez mil ajudantes, a arca fica pronta.
Sem eles... você sabe o que acontece.
Me segue. O dilúvio não espera.
```

### Voz (já gerada)

A narração está em `audio/narracao.mp3`, gerada na ElevenLabs com a voz padrão **"Bill"** (madura e grave),
modelo `eleven_multilingual_v2`, uma fala por vez, com interpretação ajustada para cada trecho (mais séria no gancho,
mais animada no "me siga", mais baixa na ameaça). A transcrição automática (Scribe) confirmou o português
e os tempos, e esses tempos alimentam as legendas palavra por palavra (`audio/narracao-palavras.json`).

Para regerar (gasta ~330 caracteres do plano):

```bash
node scripts/narracao.mjs --refazer
```

Outra voz: `node scripts/narracao.mjs --refazer --voz=VOICE_ID`. No plano gratuito, só as vozes padrão funcionam pela API;
as da biblioteca, como as brasileiras "Moutella" e "Neto", que soariam ainda mais naturais, exigem o plano Starter.

Depois de mudar a voz: `npm run video:trailer:audio`.

## Legenda do post

> O dilúvio está vindo e eu estou SOZINHO. 😰🌧️
> Cada pessoa que me seguir vira um ajudante na construção da arca, e amanhã você aparece no vídeo martelando comigo. 🔨
> Meta: 10.000 ajudantes antes da chuva.
> Dia 1 de ??? ⛈️
>
> #arcadonoe #noé #desafio #construção #viral #fyp #reels #animação3d

**Comentário fixado:** "Comenta 🔨 que eu coloco seu nome na arca amanhã."

## Dicas de publicação

- **Capa:** use `capa.jpg` (o Noé sozinho com "O DILÚVIO ESTÁ VINDO").
- **Horário:** entre 18h e 21h. Responda os primeiros comentários na primeira hora.
- **Áudio em alta:** se quiser, coloque um som em alta do momento bem baixinho (5–10%) por baixo da narração.
- **TikTok:** mesmo arquivo. Ative "Permitir Dueto/Costura", porque é um convite natural.
- **Vídeo 02 (amanhã):** mostre os primeiros ajudantes que chegaram, com os @ de verdade. É a prova de que funciona.
