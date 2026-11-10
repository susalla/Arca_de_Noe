# Plano de conteúdo: A Arca do Noé

## A mecânica que faz viralizar

1. **Participação real:** seguir = virar ajudante. A pessoa vê o próprio impacto no dia seguinte.
2. **Reconhecimento:** os @ dos novos ajudantes aparecem flutuando no vídeo. Quem é marcado compartilha.
3. **Progresso visível:** contador e "próxima peça: faltam X seguidores". O progresso é concreto, mas o fim fica em aberto: "quanto mais gente, mais rápido a gente constrói".
4. **Vaga na arca + animal:** cada seguidor garante uma vaga e escolhe um animal para levar. A escolha nos comentários vira conteúdo dos próximos vídeos.
5. **Tensão crescente:** o céu escurece conforme a arca fica pronta. "Será que dá tempo antes do dilúvio?"
6. **Formato de série:** "Dia 1", "Dia 2"… Quem chega quer ver o começo, e quem acompanha não quer perder o fim.

## Formato do Reel diário (12–15 s)

| Tempo | O que aparece | Sugestão de áudio/texto |
| --- | --- | --- |
| 0–3 s | Close no Noé martelando | Gancho: "Dia 12 construindo a arca com meus seguidores" |
| 3–7 s | Câmera recua; peças novas caem do céu; ajudantes chegam | Contador subindo |
| 7–12 s | Volta em torno da obra; casal de animais chegando | "Faltam 82 para a próxima tábua" |

Dica: use um áudio em alta do momento por baixo e coloque o texto do gancho nos 2 primeiros segundos.

## Legendas prontas

**Dia 1**
> Meu nome é Noé e eu preciso construir uma arca. Sozinho não vai dar. 🔨
> Cada pessoa que me seguir vira um ajudante na obra, e você vai ver seu bonequinho aqui amanhã.
> Dia 1: só eu e umas toras. Bora?

**Dia comum**
> Dia {N}: {X} ajudantes novos chegaram! 🛠️
> A arca está {P}% pronta. Faltam {F} seguidores para a próxima peça ({PECA}).
> Bem-vindos, {@nomes}! Me siga e vire ajudante também. O céu está começando a fechar… ⛈️

**Animal novo**
> Chegou o primeiro casal: {ANIMAL} {EMOJI}{EMOJI}!
> Comenta qual animal deve entrar amanhã. O mais votado sobe a rampa. 👇

**Marcos (100, 1.000, 5.000…)**
> {N} AJUDANTES! 😭 Olha o tamanho dessa obra. Obrigado de verdade.
> Marca alguém que ainda não está ajudando o Noé.

## Interação que alimenta o crescimento

- **Enquete nos Stories:** "Qual animal entra amanhã?" Depois, coloque o vencedor em `animais` no `progresso.json`.
- **Caixinha de perguntas:** responda como o Noé ("Noé, vai caber o elefante?").
- **Fixe nos comentários:** "Me siga e amanhã você aparece trabalhando na arca 🔨".
- **Link na bio:** o site 3D, onde a pessoa gira a câmera e procura o próprio bonequinho.
- **Collab:** convide perfis de animais/pets para "mandar o casal deles" para a arca.

## Ritmo sugerido

- 1 Reel por dia (o vídeo gerado por `npm run video`).
- 2–4 Stories por dia (enquete, bastidores, contagem regressiva para a próxima peça).
- 1 post carrossel por semana com o antes e depois da semana (tire prints com `?seguidores=...`).

## Cuidados

- Mantenha os números honestos: o charme é a construção coletiva real.
- Só exiba @ de quem seguiu e pode ser marcado. Se alguém pedir para sair, remova da lista `novosAjudantes`.
- Não divulgue um número final. O `meta` do `progresso.json` só controla o ritmo interno das peças no site;
  ajuste à vontade conforme a série andar (e dá para lançar uma "temporada 2": o dilúvio!).
