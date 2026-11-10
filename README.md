# A Arca do Noé 🔨🛶

**Cada novo seguidor no Instagram vira um ajudante do Noé.** No dia 1 só existe o Noé e uma
pilha de toras. Conforme o perfil cresce, a arca vai sendo construída peça por peça numa página 3D,
os ajudantes aparecem em volta da obra e, no fim, os animais chegam em casais.

## Como funciona

- **Ajudantes:** um bonequinho para cada seguidor (até 600 desenhados na tela; o contador continua acima disso).
- **Arca:** 55 peças, em ordem de construção: suportes → quilha → fundo → 11 costelas → 32 tábuas →
  convés → cabine → janelas → telhado → porta → rampa. Cada peça é liberada ao atingir um número de seguidores.
  A curva é quadrática: no começo poucos seguidores já mostram progresso (a 1ª peça sai com 1 seguidor,
  a 10ª com ~330), e a arca fica pronta na `meta` (padrão: 10.000).
- **Clima:** o céu vai escurecendo conforme a arca fica pronta. O dilúvio está chegando!
- **Animais:** você escolhe quais casais entram, em `progresso.json`.
- **Nomes:** os @ dos novos ajudantes do dia aparecem flutuando sobre eles.

## Rotina diária (5 minutos)

1. Edite **`progresso.json`**:

   ```json
   {
     "dia": 12,
     "perfil": "@arcadonoe",
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
| `js/main.js` | Junta tudo: HUD, câmera, modo site e modo vídeo |
| `scripts/gravar-video.mjs` | Gera o MP4 vertical quadro a quadro |
| `docs/plano-instagram.md` | Estratégia de conteúdo e legendas prontas |

Tudo é low-poly e gerado por código, na escala de 1 unidade = 1 metro. Não há modelos 3D externos
para importar nem problema de escala ou rotação na exportação. Os ajudantes usam instancing, então
centenas de bonecos custam só 2 chamadas de desenho e o site roda bem no celular.
