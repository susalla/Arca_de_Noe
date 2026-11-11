# Avulso: "POV: você tá construindo um barco a 500 km do mar"

**Perfil:** @arca_do_noee · **Formato:** vertical 9:16, 27 s · **Arquivo:** `videos/avulso-pov.mp4` (Instagram e TikTok) · **Capa:** `videos/avulso-pov-capa.jpg`
**Tipo:** humor avulso (não avança a obra nem a contagem de ajudantes)
**Status:** ✅ aprovado e produzido

## Por que "500 km do mar" e não "deserto"

O cenário da obra é um campo verde, não um deserto. "Longe do mar" combina com o que aparece na tela
e a piada continua a mesma: construir um barco onde não tem água.

## Personagens

- **Noé:** a mesma voz grave dos outros vídeos. Aqui ele fica seco e tranquilo, quase sem tirar os olhos do martelo.
- **Vizinho (novo):** um boneco com a mesma base dos ajudantes, só que com túnica de outra cor, chapéu de palha
  e braços cruzados. A voz é **outra**: "Callum" da ElevenLabs, rouca e debochada (para trocar, mude
  `VOZ_IDS.vizinho` em `js/avulso-pov-tempos.js`). Ele pode virar personagem fixo dos avulsos de humor
  (o boneco é a classe `Vizinho` em `js/personagens.js`).

## A arca no vídeo

A arca aparece **no estado atual** (quilha + fundo + 1ª costela). A piada fica até melhor assim: o vizinho
está zoando um "barco" que ainda é só esqueleto.

## Roteiro cronometrado

| Tempo | Imagem | Fala |
| --- | --- | --- |
| 0–2,8 | **Sol forte, céu azul sem nenhuma nuvem.** Câmera baixa, o Noé martelando a costela. Som de marteladas e cigarras. Texto no topo: **"POV: você tá construindo um barco a 500 km do mar 🌊❌"** | (só marteladas) |
| 2,8–6 | O **Vizinho** entra pela direita, de braços cruzados, para do lado do Noé e olha a obra de cima a baixo | **Vizinho:** "Ô Noé… cadê o *mar*?" |
| 6,3–8 | O Noé **nem olha**, continua martelando | **Noé:** "Vai *chover*." |
| 8,3–11,5 | O Vizinho olha para o céu (a câmera sobe junto: azul total). Ele volta e encara a câmera. **Grilos.** No "uma", aparece **uma única nuvenzinha** bem em cima da cabeça dele, e ele não percebe | **Vizinho:** "Chover? Não tem *uma* nuvem, Noé." |
| 11,5–13,5 | O Vizinho ri, dá dois tapinhas no ombro do Noé e vai embora dando tchauzinho | **Vizinho:** "Boa sorte com o *barco*!" |
| 13,5–15 | **Tela preta**, texto **"ALGUM TEMPO DEPOIS…"**, trovão forte | (trovão) |
| 15–19,5 | **Céu escuro, chuva forte, raio.** O Vizinho volta **correndo e encharcado**, segurando o chapéu, e para ofegante do lado do Noé | **Vizinho:** "Noé… ainda dá pra ser *ajudante*?" |
| 19,5–22,5 | O Noé, **sem parar de martelar**, dá um sorrisinho de canto. Na fala dele, o Vizinho é atingido pelo **feixe dourado** (o mesmo efeito de quando chega seguidor novo) e aparece **"+1 AJUDANTE 🔨"** | **Noé:** "Dá. É só *seguir* o perfil." |
| 22,4–27,2 | O Vizinho já martelando do lado do Noé, na chuva. Texto: **"SEGUE ANTES QUE A CHUVA APERTE ⛈️"** + cartão de seguir com toque. Pergunta na tela: **"VIZINHO 😂 ou AJUDANTE 🔨?"** | **Noé:** "E você? Seria o *vizinho*… ou o *ajudante*? Comenta aí!" |

As palavras entre `*asteriscos*` aparecem em amarelo na legenda, como nos outros vídeos.

### Áudio

- **0–13,5:** cigarras, marteladas e uma trilha leve e "despreocupada".
- **8,3–11,5:** a trilha some e entram só os grilos (pausa cômica).
- **13,5:** corte seco com trovão.
- **15–26,5:** chuva forte, trovões e a trilha voltando mais épica até o final.

## (Opcional) Versão "baseada em comentários reais"

Se você tiver comentários de gente **zoando ou duvidando** da arca (tipo "isso nunca vai ficar pronto",
"vai chover nada kkk", "pra que barco aqui?"), eles podem aparecer como **prints** saindo do Vizinho
na cena de 2,8 a 13,5 s. Aí o texto do topo vira **"Baseado em comentários reais 😂"**.

Isso costuma engajar mais, porque quem foi zoado vira personagem e marca os amigos. Precisa de 2 ou 3 prints
com o @ visível.

## Legenda do post

> Todo mundo riu… até começar a chover ⛈️😂
>
> E você? Seria o VIZINHO 😂 ou o AJUDANTE 🔨?
> Comenta 👇
>
> Cada pessoa que segue vira um ajudante na obra. Segue antes que a chuva aperte 🛶
>
> #arcadonoe #noé #pov #humor #fé #reels #fyp #animação3d

**Comentário fixado:** "Comenta 🔨 se você seria AJUDANTE ou 😂 se seria o VIZINHO"

## Como gerar de novo

```bash
npm run video:pov          # vozes (só o que mudou) + imagem + trilha + exportação
npm run video:pov:audio    # refaz só as vozes e o áudio
```

Pré-visualização no navegador: http://localhost:8080/avulso-pov.html (rode `npm run dev` antes).

Tempos, falas e vozes ficam em `js/avulso-pov-tempos.js`; a cena em `js/avulso-pov.js`; a trilha em `scripts/avulso-pov.mjs`.
