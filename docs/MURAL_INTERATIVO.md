# Mural de Campanhas — experimento editorial

Base: `origin/feat/identidade-visual-brasileira`, commit `1706673`.
Branch de entrega: `feat/mural-pixijs-interativo`. Nenhum merge automático.

## Onde ver

Na navegação existente, abra **Partidos**. O mural começa com “O MURO TEM NOME. E OS NOMES TÊM DADOS.”. Homepage, Atlas, plenário, componentes editoriais e CSS da identidade permanecem na versão aprovada.

Este checkout fica em `repo-branch`, dentro da pasta de trabalho original. Execute os comandos do projeto nessa pasta, não no diretório externo. A prévia utilizada nesta sessão está em `http://127.0.0.1:5174/`.

## Implementação

- Cartazes tipográficos reais, papel, fita, pequenas rotações e destaque da seleção. Nenhum retrato foi criado ou atribuído a candidatos.
- Exploração por rolagem, arraste do fundo com mouse, toque, setas e Page Up/Down; zoom e grade alternativa em HTML.
- Reorganização por votos, despesas, resultado, partido e material reconhecido. A ordenação adicional por gasto/voto foi preservada.
- Seleção traz o papel à frente; ficha permite virar e ler votos, despesas, patrimônio, resultado e razão descritiva gasto/voto.
- Lançamentos usam o endpoint existente de despesas; o atalho para documentos financeiros foi preservado.
- Mesa de até três candidaturas, atravessando páginas e filtros, reutiliza `ComparisonPanel` e Recharts. Cada ficha mantém seu contexto. Disputas distintas recebem aviso explícito.
- Filtros por ano, UF, município, cargo, partido, resultado e nome/número. Categorias de resultado separam eleitos, não eleitos, suplentes e indefinidos.
- Tabela com valores exatos, textos selecionáveis, foco visível, botão de animação e respeito ao movimento reduzido do sistema.
- Módulo da cena carregado por `React.lazy`; até 18 cartazes por página. Transições de posição são pontuais e desativadas fora da área visível. Sem loop permanente de renderização.
- Ligações existentes para investigações sobre partidos e propaganda foram mantidas.

## Avaliação de PixiJS

**Nenhuma biblioteca instalada.** O experimento usa React/HTML/CSS, Motion já existente e o comparador Recharts já existente. Não depende de WebGL; a grade alternativa também mantém as informações.

Com apenas 18 cartazes montados por vez e conteúdo essencialmente textual, não foi demonstrado ganho que justificasse uma segunda representação em canvas. HTML preserva seleção de texto, botões nativos, leitores de tela e foco sem duplicar cada cartaz numa camada acessível. Motion aplica transformações de posição, escala e rotação com duração limitada. Não houve benchmark comparativo de um protótipo PixiJS; os números abaixo medem apenas as implementações HTML anterior e atual.

A documentação do PixiJS explica a rasterização do texto de canvas em texturas: [Canvas Text](https://pixijs.com/8.x/guides/components/scene-objects/text/canvas). A decisão deve ser revista se houver evidência de necessidade de centenas de elementos simultâneos ou efeitos que não sejam atendidos por composição HTML. Isso exigiria um benchmark específico; não é uma recomendação para aumentar a quantidade de dados no navegador.

## Dados, denominadores e limites

`/api/candidates` continua paginado e recebe o filtro adicional de município, ordenações de agrupamento e resultado indefinido. Os parâmetros são validados; as consultas são somente leitura. Nenhum token ou SQL é enviado ao frontend.

Os endpoints novos são necessários para não tratar uma página como o universo do recorte:

- `GET /api/mural/resumo`: agrega **todas** as candidaturas filtradas. Retorna contagem, cobertura dos valores, líderes, resultados, partidos e grupos dos lançamentos, independentemente de limite/offset dos cartazes.
- `GET /api/mural/materiais`: recebe de 1 a 24 identificadores validados e agrega os materiais dos cartazes carregados. O mural usa no máximo 18. Cache local limitado a seis páginas e cancelamento de consultas obsoletas.

Líderes consideram somente valores conhecidos; empates são resolvidos por nome e identificador, como na ordenação dos cartazes. A posição ordinal é a posição nessa ordenação, não uma categoria de empate compartilhada. Na amostra, os líderes são explicitamente da amostra inteira filtrada, nunca somente da página visível.

Valores ausentes continuam ausentes; zero conhecido continua zero. Média de despesas utiliza somente candidaturas com despesa informada, com denominador visível. Resultado indefinido não vira derrota. Despesas declaradas e soma dos lançamentos são indicadores diferentes e podem não coincidir. Gasto/voto requer votos positivos; não mede causalidade nem compra de votos.

Materiais são reconhecidos por palavras nas descrições reais: santinho, adesivo, bandeira, panfleto, folheto, cartaz e material gráfico. Descrições com mais de um grupo ficam em **mistas**, sem rateio e sem dupla contagem. As demais ficam sem material reconhecido. O agrupamento do cartaz usa o maior valor entre os grupos reconhecidos daquela candidatura. O valor impresso nesse modo corresponde aos lançamentos do grupo, não à despesa total. A página é selecionada por despesas declaradas; não constitui um ranking completo de gasto em materiais. O painel editorial calcula as somas dos materiais no recorte inteiro.

As cores são editoriais. No modo partido há legenda nominal, com possíveis repetições de cor, sem atribuição ideológica. Nos modos quantitativos a magnitude é codificada por uma régua linear: valor ÷ maior valor conhecido no recorte. A área dos cartazes não representa magnitude.

Offline utiliza exclusivamente as 24 candidaturas reais e os lançamentos parciais já existentes no projeto, de vereador/2024 em seis capitais. Outros filtros podem legitimamente retornar vazio. Uma falha de consulta não troca silenciosamente o acervo pela amostra: a interface informa a falha e oferece escolha explícita.

Durante a integração foi corrigido um erro pré-existente no endpoint de conexão `/api/overview`: `value` passou a ser um alias SQL entre aspas, compatível com o parser DuckDB atual. Não houve alteração visual ou funcional das outras páginas.

## Validação em 21/10/2026

- `node --test tests/*.test.mjs`: **39 testes aprovados**.
- `python -m pytest tests -q`: **27 testes e 8 subtestes aprovados**.
- `npm run build`: aprovado. Mantém o aviso de bundle principal acima de 500 kB, já existente na base.
- `python tests/mural_browser.py`: aprovado no Chrome local, perfil temporário, desktop 1440×1000 e viewport móvel 390×844. A alternativa ao navegador integrado foi autorizada pelo usuário.
- Verificação visual das capturas: leitura dos nomes (com correção do corte da segunda linha), cores, ficha, comparação móvel e agrupamento com indicadores reais.
- Interações verificadas: seleção, verso, despesas, teclado, limite de três comparações, agrupamentos, zoom, grade, tabela, paginação, filtros e ausência de dados.
- Chrome com WebGL desativado; movimento reduzido do sistema verificado. Sem erros de JavaScript ou overflow horizontal da página nas execuções registradas.
- Falha de API simulada mantém a identificação de consulta e mensagem de erro; troca explícita para amostra verificada.
- Consulta real: vereador/2024, seis UFs, **84.953 candidaturas**, com 81.409 valores de votos e 84.366 valores de despesas informados. Resumo em **2,803 s** e segunda página em **0,299 s** nessa execução, após conexão inicial. São tempos locais observados, não SLA.
- Lista municipal do CE: **184 municípios** carregados. Filtro Fortaleza/CE, vereador/2024, não eleitos: **145 candidaturas**, 18 exibidas.
- Teste DuckDB isolado usa 40 registros sintéticos identificados como fixture: o líder em votos não aparece na primeira página por despesa, mas aparece corretamente no resumo integral. Esses registros nunca entram no produto.

### Bundle

| Artefato | Base aprovada | Experimento |
|---|---:|---:|
| JS principal | 2.079,68 kB / 610,11 kB gzip | 2.095,42 kB / 616,02 kB gzip |
| CSS | 147,08 kB / 31,38 kB gzip | 163,76 kB / 34,47 kB gzip |
| Cena sob demanda | inexistente | 10,45 kB / 4,14 kB gzip |

Não foi acrescentada dependência gráfica. Aumento inicial de JS + CSS: 9,00 kB gzip, além de 4,14 kB gzip da cena sob demanda. O custo inicial adicional é principalmente a interface e a análise do mural. O bundle principal já era grande e sua divisão geral está fora do escopo desta entrega.

### Comparação de desempenho

Mesma máquina, Chrome headless, Vite de desenvolvimento, amostra offline, 18 cartazes e oito alternâncias entre votos e despesas. Medida: evento de alteração até dois `requestAnimationFrame`, mediana; **não mede FPS, duração completa da animação nem tempo de GPU**.

| Viewport | Antes | Depois registrado |
|---|---:|---:|
| Desktop | 80,8 ms | 67,5 ms |
| Celular emulado | 77,6 ms | 62,9 ms |

Há variação relevante entre execuções; não se conclui superioridade geral de renderização. O DOM cresceu de cerca de 600 para 1.185 elementos devido às descobertas, controles e tabela, mantendo apenas 18 cartazes. As medições detalhadas e limitações estão nos JSONs anexos. Validação móvel é emulação de viewport, não teste em aparelho físico.

## Capturas e evidências

| Situação | Desktop | Celular |
|---|---|---|
| Antes | [Página anterior](../artifacts/mural/before-desktop.png) | [Página anterior](../artifacts/mural/before-mobile.png) |
| Depois | [Página completa](../artifacts/mural/after-desktop.png) | [Página completa](../artifacts/mural/after-mobile.png) |
| Muro | [Cartazes](../artifacts/mural/after-desktop-wall.png) | [Cartazes](../artifacts/mural/after-mobile-wall.png) |
| Verso | [Ficha](../artifacts/mural/after-desktop-reverse.png) | [Ficha](../artifacts/mural/after-mobile-reverse.png) |
| Comparação | [Mesa e gráfico](../artifacts/mural/after-desktop-comparison.png) | [Mesa e gráfico](../artifacts/mural/after-mobile-comparison.png) |

- [Materiais com dados reais](../artifacts/mural/after-live-materials.png)
- [Descobertas com dados reais](../artifacts/mural/after-live-findings.png)
- [Movimento reduzido](../artifacts/mural/after-reduced-motion.png)
- [Relatório de navegador](../artifacts/mural/browser-validation.json)
- [Consultas reais e tempos](../artifacts/mural/live-api.json)

## Arquivos de implementação

- `src/pages/MuralCampanhas.jsx`: integração, filtros, paginação, tabela e mesa.
- `src/mural/MuralScene.jsx`, `MuralPoster.jsx`: exploração, composição e transições.
- `src/mural/MuralDossier.jsx`, `MuralFindings.jsx`: ficha, despesas e descobertas.
- `src/mural/model.js`, `useMuralData.js`, `useMaterials.js`: regras, amostra, consultas e cobertura.
- `src/mural/mural.css`: estilos exclusivos do mural.
- `src/data/client.js`: encaminhamento opcional de cancelamento, preservando assinaturas existentes.
- `server/mural.py`, `server/app.py`: agregados, filtros adicionais e correção de alias.
- `tests/mural.test.mjs`, `tests/test_mural.py`, `tests/mural_browser.py`: testes específicos e auditoria reproduzível.
- Este documento e `artifacts/mural/`: decisões e evidências.

## Próximos ajustes

Medir uso em aparelhos físicos, testar leitores de tela reais e observar latência sob concorrência antes de considerar cache de agregados no servidor. Avaliar reconhecimento de novas descrições de materiais com exemplos auditados; a classificação atual é propositalmente conservadora. O detalhamento local mostra somente os oito maiores lançamentos; o documento financeiro existente mantém a consulta paginada completa. Não foi criada uma infraestrutura de texturas ou GPU que precise ser destruída ao sair da página.
