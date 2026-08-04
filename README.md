# Site da Impulse One

No ar em https://iimpulseone.com.br

## Como funciona

- `index.html` — o site inteiro num arquivo so (HTML, CSS e JS).
- `logos/` — logos dos clientes que rodam no carrossel do rodape.
- `equipe/` — fotos dos socios e a foto dos tres.
- `antigo/` — versao anterior do site, arquivada em /antigo (com noindex).
- `supabase-function-diagnostico.ts` — fonte da edge function que recebe o
  formulario e grava em `public.leads` do Central Impulse.

## Textos editaveis

Todo texto tem `data-cms="chave"`. O site le a tabela `site_conteudo` do
Supabase e aplica por cima do padrao. A equipe edita pela aba **Site** do
Central Impulse, que abre `iimpulseone.com.br/?editor=1` num iframe e passa a
sessao por postMessage. Se o Supabase cair, o site continua mostrando o texto
padrao do HTML.

## Publicacao

Todo push nesta branch publica na Vercel (time CENTRAL IMPULSE,
projeto `site-impulse-one`).

<!-- publicacao automatica ativa -->
