# Adesivaria — Quem pagou pelo muro?

Branch independente: `feat/adesivaria-ranking-gastos`, criada a partir do commit aprovado `1706673` da identidade visual brasileira. O mural da branch `feat/mural-pixijs-interativo` permanece salvo em `49c0115`; não houve merge dessas branches nem alteração da main.

## Visual e navegação

Abra **Adesivaria** no menu existente. Durante a implementação, o usuário pediu a volta do estilo anterior dos adesivos. A entrega preserva os adesivos circulares azul, vermelho e amarelo, o muro, o canto descolando e os adesivos de candidaturas com frente e verso, reutilizando as classes originais de `styles.css` e `v8.css` sem editar esses arquivos.

Os novos dados permanecem: pódio, ordenações por despesas e votos, posições em ambos os rankings, conta dos partidos, cobertura, descrições incluídas e ficha com lançamentos. Os valores e barras ficam legíveis também fora do verso do adesivo. A silhueta é o mesmo ícone neutro da versão anterior, não um retrato ou fotografia inventada.

Não foram instaladas bibliotecas. HTML/CSS e Motion já existentes resolvem a interface. A Adesivaria funciona sem WebGL, tem controle de animação, respeita movimento reduzido e usa diálogos nativos com foco, teclado e Escape. O caderno Recharts existente permanece ao final, identificado como uma série com filtros próprios.

## Recorte e interpretação

- Ano e cargo são sempre específicos. O universo territorial é **CE, MA, MS, RJ, RN e RS**, nunca o Brasil inteiro.
- Os filtros aceitam seis estados, uma UF ou município. A busca de município usa nome e código, com seleção inequívoca do código de sete dígitos e dependência da UF.
- O filtro municipal aceita somente prefeito/vereador em anos de eleições municipais. A UF do município é verificada no banco. Candidaturas estaduais ou federais não recebem despesas atribuídas a um município.
- O município indica a candidatura, não comprova o local de compra ou circulação da propaganda.
- Candidaturas de eleições ordinárias do **1º turno**, com votos e resultado do **1º turno**. A vinculação não permite deduzir a data ou o turno de execução de cada gasto. Registros de candidaturas do segundo turno não são acrescentados ao recorte.
- Despesa de material significa soma de lançamentos classificados, distinta da despesa total declarada da campanha. Ambas aparecem separadamente na ficha.
- O ranking de votos abrange todas as candidaturas filtradas com votos conhecidos, inclusive as que não possuem lançamento no material selecionado. O ranking de gastos exige valor classificado conhecido. Os denominadores são visíveis.
- Os rankings são descritivos. A interface informa se a liderança coincide ou difere, sem afirmar causalidade. Rankings municipais agregados em UF/seis estados não representam uma disputa única; há aviso para restringir a um município.
- Posições são ordinais, com desempate por nome e identificador. Barras usam escala linear relativa ao máximo do respectivo indicador no recorte inteiro, inclusive após mudar de página. Valores negativos permanecem escritos, sem barra positiva.
- Valores ausentes não são zero. Contagem zero de lançamentos significa apenas ausência de registros incluídos, sem presumir que a candidatura nada gastou.

## Classificação conservadora

Descrições normalizadas sem acento e sem diferença entre maiúsculas/minúsculas. O nome do produto deve começar a descrição: **ADESIVO(S)/ADESIVA(S), SANTINHO(S)/SANTINHA(S), BANDEIRA(S)**. São aceitos prefixos explícitos de aquisição, compra, confecção, impressão, fornecimento ou produção, com ou sem “de”.

São excluídas descrições com mais de um desses grupos, serviços de instalação, retirada, remoção, distribuição, colagem, adesivagem, locação ou mão de obra. Menções a outros produtos — banner, panfleto, folheto, cartaz, faixa, outdoor, camiseta, brinde, bandeirola, crachá ou colinha — também excluem o lançamento. Não há rateio presumido. Essa política pode deixar gastos legítimos sem classificação: é uma cobertura conservadora, não uma taxonomia exaustiva da propaganda.

O usuário pode conferir as descrições originais incluídas, com contagem de registros, valores informados, soma e paginação. Na ficha, os próprios lançamentos da candidatura também são paginados. Não foram fabricados fornecedores, notas fiscais, fotografias ou quantidades físicas de peças.

## Endpoints

### `GET /api/adesivaria`

Parâmetros: `ano`, `cargo`, `abrangencia` (`seis_estados`, `estado`, `municipio`), `uf`, `municipio`, `partido`, `material` (`adesivos`, `santinhos`, `bandeiras`, `todos`), `limit` (1–24), `offset`, `offset_votos`, `offset_categorias`.

Retorna estatísticas do recorte, grupos, pódio global, páginas independentes de candidaturas por despesas e votos, partidos e categorias incluídas (25 por página). Pódio e denominadores não dependem das páginas. A ausência de `abrangencia` infere município, UF ou seis estados a partir dos filtros, preservando chamadas anteriores que informam uma UF. Rankings exigem ano específico; não há combinação de anos como se fossem a mesma eleição.

A consulta consolida as despesas **antes** de juntar um resultado por candidatura. Resultados idênticos repetidos são consolidados; valores distintos conflitantes ficam indisponíveis no campo correspondente, com sinalização. Não se somam votos de diferentes turnos nem se usa `SUM(DISTINCT valor)`, que perderia despesas legítimas de mesmo valor. Os agregados são produzidos numa única consulta SQL parametrizada, com reutilização das CTEs. A resposta é construída no backend, sem expor SQL ou credenciais.

### `GET /api/adesivaria/candidatura/{id}`

Mesmo recorte e material, identificador validado, `limit` de 1–50 e `offset`. Retorna candidatura, grupos de materiais, posições globais, total de lançamentos selecionados e página de descrições/valores originais. Uma candidatura fora do recorte não é aceita. O atalho de prestação de contas usa o fluxo já existente. Para abrir o fichário na candidatura correta, foi acrescentado somente um parâmetro opcional de entrada ao `ArchivePart` e sua ligação no `App`; o uso normal do arquivo permanece com os mesmos padrões.

Também foi corrigido o alias SQL reservado `value` do endpoint `/api/overview`, que causava erro no parser DuckDB atual. O frontend das outras seções não foi redesenhado.

## Offline

A amostra existente contém 24 candidaturas reais de vereador/2024 em seis capitais e lançamentos parciais de algumas delas. A mesma classificação é aplicada a esses lançamentos. O rótulo de amostra permanece visível e os líderes são apresentados somente como líderes da amostra filtrada. Não se reutilizam totais históricos de vários anos num filtro específico. Outros anos/cargos podem legitimamente retornar vazio.

Uma falha de consulta produz mensagem de indisponibilidade; não há substituição silenciosa por uma amostra. Quando há conexão, o usuário pode escolher explicitamente explorar a amostra e voltar à consulta.

## Validação

- `node --test tests/*.test.mjs`: **39 aprovados**.
- `python -m pytest tests -q`: **29 testes e 18 subtestes aprovados**.
- `npm run build`: aprovado; permanece o aviso já existente de bundle principal acima de 500 kB.
- `python tests/adesivaria_browser.py`: Chrome local com perfil temporário, desktop 1440×1000 e celular emulado 390×844. Alternativa de navegador previamente autorizada pelo usuário.
- Conferência visual das capturas: estilo circular anterior, dobras, frente/verso, legibilidade móvel e ficha. Sem overflow horizontal da página nem erros de JavaScript nas execuções registradas.
- Testes de interação: materiais, UF, município por código, ano, cargo, partido, páginas independentes, categorias paginadas, modal, Escape, teclado, links corretos para arquivo e prestação de contas, movimento reduzido e Chrome sem WebGL.
- Teste de falha de API mantém mensagem de erro e permite troca explícita para offline.
- SQL executado em DuckDB isolado com fixtures sintéticas: líder fora da primeira página, resultados repetidos e de outro turno, resultados conflitantes, despesas distintas de mesmo valor, zero/ausência/negativo, escopos, validação e paginação. Nenhum registro de teste entra no produto.
- Consulta real: vereador/2024 em seis UFs — **84.953 candidaturas**; CE — **12.223**; Fortaleza/CE — **771**. Deputado federal/2022 no CE — **414**, sem atribuição municipal. Lista municipal do CE — **184 municípios**. Valores, líderes e tempos observados ficam em `live-api.json`.
- Exemplos de resposta da consulta consolidada após conexão: aproximadamente **0,4–1,0 s** nos recortes registrados. Não é SLA nem benchmark sob concorrência.

## Capturas

| Visão | Desktop | Celular |
|---|---|---|
| Antes | [Página anterior](../artifacts/adesivaria/before-desktop.png) | [Página anterior](../artifacts/adesivaria/before-mobile.png) |
| Depois | [Página atual](../artifacts/adesivaria/after-desktop.png) | [Página atual](../artifacts/adesivaria/after-mobile.png) |
| Estilo restaurado | [Adesivos de materiais](../artifacts/adesivaria/after-desktop-materials.png) | [Adesivos de materiais](../artifacts/adesivaria/after-mobile-materials.png) |
| Pódio | [Candidaturas](../artifacts/adesivaria/after-desktop-podium.png) | [Candidaturas](../artifacts/adesivaria/after-mobile-podium.png) |
| Verso | [Adesivos virados](../artifacts/adesivaria/after-desktop-reverse.png) | [Adesivos virados](../artifacts/adesivaria/after-mobile-reverse.png) |
| Ficha | [Detalhes](../artifacts/adesivaria/after-desktop-candidate.png) | [Detalhes](../artifacts/adesivaria/after-mobile-candidate.png) |

[Materiais com consulta real](../artifacts/adesivaria/after-live-materials.png) · [Pódio real](../artifacts/adesivaria/after-live-podium.png) · [Rankings reais](../artifacts/adesivaria/after-live-rankings.png) · [Ficha real](../artifacts/adesivaria/after-live-candidate.png) · [Relatório do navegador](../artifacts/adesivaria/browser-validation.json) · [Valores e tempos reais](../artifacts/adesivaria/live-api.json).

## Arquivos e limites

- `src/pages/Adesivaria.jsx`: investigação, filtros e integração.
- `src/adesivaria/PodiumStickers.jsx`, `RankingList.jsx`, `CandidatePanel.jsx`: adesivos restaurados, rankings e ficha.
- `src/adesivaria/model.js`, `useRankings.js`, `adesivaria.css`: amostra, classificação, consultas e estilos locais.
- `src/data/client.js`: cancelamento opcional e novos serviços; timeout maior somente nas consultas da Adesivaria.
- `src/App.jsx`, `src/pages/ArchivePart.jsx`: ligação opcional para abrir a candidatura no fichário existente.
- `server/adesivaria.py`, `server/app.py`: agregações, validações e endpoints.
- `tests/adesivaria-ranking.test.mjs`, `test_adesivaria_ranking.py`, `adesivaria_browser.py`: testes novos. `tests/v8-ui.test.mjs` e `test_v7_endpoints.py`: contratos atualizados para a investigação, mantendo o estilo circular.
- Este documento e `artifacts/adesivaria/`: evidências.

A classificação lexical não reconhece toda a propaganda, a amostra não é uma eleição completa e a inspeção móvel é emulada, não realizada num aparelho físico. Próximos ajustes: auditar descrições ainda não reconhecidas com critérios documentados, testar leitores de tela em aparelhos reais e medir concorrência antes de introduzir cache de servidor. Atlas, homepage, plenário, navegação, CSS compartilhado e o mural não foram redesenhados.
