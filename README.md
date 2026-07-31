# Agosto Laranja — NeuroLab

Site escolar estático sobre a campanha Agosto Laranja e a esclerose múltipla. A pasta já contém todo o código, as imagens e o jogo NeuroLab necessários para publicação no GitHub Pages.

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub.
2. Envie **todo o conteúdo desta pasta** para a raiz do repositório — o arquivo `index.html` precisa ficar na página inicial do repositório.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **GitHub Actions**.
5. Aguarde a ação chamada **Publicar no GitHub Pages** terminar.
6. O endereço do site aparecerá em **Settings → Pages**.

O arquivo `.github/workflows/pages.yml` já automatiza a publicação a cada atualização da branch `main`.

## Personalizar os créditos

Abra `index.html` e procure por:

- `Nome(s) do(s) estudante(s)`
- `Nome da escola`
- `Nome(s) do(s) professor(es)`
- `Preencher aqui · 2026`

Substitua esses textos pelos dados corretos antes da entrega.

## Arquivos principais

- `index.html`: conteúdo e estrutura do site.
- `styles.css`: identidade visual responsiva.
- `game.js`: jogo NeuroLab com cinco fases.
- `assets/`: imagens utilizadas pelo site.
- `.nojekyll`: garante que o GitHub Pages sirva os arquivos diretamente.
- `.github/workflows/pages.yml`: publicação automática.

Os dois vídeos são incorporados do YouTube e precisam de conexão com a internet para serem reproduzidos.
