# Renovação editorial: inicial, Atlas e comparativos

Base: `feat/visualizacoes-shaders`, commit `702772f`.
Branch de entrega: `feat/identidade-visual-brasileira`.

## Auditoria e decisões

- A inicial combinava cartaz, televisão, índices e descobertas com uma hierarquia semelhante. A nova capa organiza esses mesmos conteúdos em manchete, cartaz principal, chamadas de investigações, índice dos ambientes e transmissão. As chamadas levam às rotas e investigações existentes.
- O Atlas misturava navegação, ornamentos e controle de um efeito cromático sem pergunta analítica associada. O SVG passa a ser o caminho único de apresentação do mapa: removidos o botão, o shader de apresentação e os carimbos/escala ilustrativa dentro da malha. Seleção, teclado, carregamento por UF, busca, valores e legenda permanecem. O experimento anterior continua no histórico da branch de origem.
- Os comparativos usavam cores pela posição das séries e um tamanho mínimo que provocava rolagem no celular. A nova folha estatística separa filtros, título/contexto, escolha gráfico/tabela, legenda de destaque e achados descritivos. Corrigida a leitura do campo normalizado `valor` em comparações locais de fichas e municípios.

## Vocabulário compartilhado

`src/identidade.css` define verde `#176B50`, amarelo `#EDBF42`, azul `#174A8B`, vermelho `#C84D38` e papel `#F3E5C8`, além de tintas neutras, azul-claro, tipos, etiquetas e notas de fonte. As variáveis não substituem os tokens globais das demais experiências; são aplicadas aos escopos renovados. `Editorial.jsx` fornece cabeçalhos, etiquetas e notas reutilizáveis.

Barlow Condensed compõe manchetes e números; DM Sans sustenta a leitura; IBM Plex Mono identifica recortes e fontes. Fundos verdes, azuis, claros e papéis alternam hierarquias sem cobrir todas as superfícies de bege. As referências de impressão são tipográficas e vetoriais, sem fotos ou candidatos fabricados.

## Contrato dos dados

- As chamadas da inicial usam os dados agregados existentes e o snapshot auditado dos votos de legenda. Os valores arquivados são identificados.
- O Atlas mantém sua escala sequencial azul e seus limites numéricos fixos; as cores decorativas não modificam os polígonos quantitativos.
- Achados territoriais são mínimo, máximo e amplitude **somente entre os municípios com valor carregado**, com quantidade, ano, indicador e território. Não extrapolam para municípios sem registros, nem representam ranking nacional.
- As cores e tracejados das séries são estáveis por identidade textual, definidos em `comparisonPresentation.js`, sem correspondência com ideologia ou identidade visual partidária. Categorias conhecidas têm índices fixos; outras usam hash determinístico. Colisões de cor são possíveis; legendas e nomes permanecem explícitos.
- As diferenças dos gráficos são subtrações dos valores disponíveis. Percentuais usam pontos percentuais; variações nunca convertem lacunas em zero ou inferem causalidade. Fichas de disputas diferentes não recebem anotações numéricas de comparação.
- Tabela e CSV preservados; a exportação inclui recorte, indicador e fonte. Nenhum endpoint, esquema de dados ou credencial foi alterado.

## Movimento e fallback

As linhas são desenhadas uma vez por mudança dos dados, sem laço contínuo. `prefers-reduced-motion` desliga o desenho e as transições espaciais. O Atlas não requer WebGL. A televisão existente mantém seus canais e controles, com renderização sob demanda e fallback já existente. Não foram introduzidos novos objetos 3D ou bibliotecas.

## Validação e limites

Testes cobrem escalas/legendas, ausência versus zero, carga completa das UFs, diferenças entre partidos, cores estáveis, extremos da amostra e a regressão das barras locais. Os testes Python preservam a validação dos endpoints e da conexão do servidor.

O navegador integrado não estava disponível durante a tentativa de auditoria: a descoberta retornou uma lista vazia. Portanto não há capturas antes/depois nem alegação de inspeção visual real de desktop/mobile. Layouts foram implementados para desktop, tablet e celular, mas a conferência visual permanece uma limitação explícita da entrega.

Verificações realizadas:

- `node --test tests/*.test.mjs`: 34 testes aprovados.
- `PYTHONUTF8=1 python -m pytest tests -q`: 23 testes e 8 subtestes aprovados.
- `vite build`: concluído; permanece o aviso de tamanho do bundle já existente no projeto.
- Renderização React da aplicação inicial e dos comparativos nos contextos Atlas, Arquivo, Partidos, Campanhas, Plenário e Investigações: sem exceções. Esta verificação não substitui um navegador.
- Contrastes dos pares principais: papel sobre verde 6,30:1; azul sobre branco 8,58:1; tinta sobre amarelo 7,02:1; azul sobre azul-claro 7,19:1; acento vermelho escuro sobre branco 6,12:1.
- Prévia local iniciada em `http://127.0.0.1:5174/`. Nova tentativa de conectar ao navegador após a confirmação do usuário também retornou indisponibilidade.
