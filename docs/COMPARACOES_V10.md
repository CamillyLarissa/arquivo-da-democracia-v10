# Comparações editoriais v10 — arquitetura e metodologia

## Intenção
O portal mantém as nove áreas visuais da v9 **sem criar nova página**. Um painel de comparação reutilizável entra dentro de Arquivo, Atlas, Mural, Campanhas, Adesivaria, Plenário e Investigações. Os usuários podem usar tabelas ou gráficos e baixar CSV dos **valores agregados atualmente exibidos**, sem jamais receber token do banco.

## Fontes reais
Dados de `pipeline_bdr_der_completo_v3.main` (compartilhamento MotherDuck; leitura somente) com cobertura de **1.236 municípios de seis UFs** (CE, MA, MS, RJ, RN, RS). O protótipo **não** representa o conjunto nacional. A API usa parâmetros preparados e respostas resumidas para evitar carregar 608 mil candidaturas no navegador.

## Visões implementadas

| Comparação | Onde aparece | Recortes / eixo | Cálculo / cuidados |
| --- | --- | --- | --- |
| Legenda (%) | Atlas, Mural, Plenário, Investigações | Cargo proporcional, estado, até 2 partidos; tempo | Somatório legenda / (legenda + nominal), primeiro turno. **Vereador 2020–24**, deputados **2018–22**. Série do mesmo cargo. |
| Abstenção (%) | Atlas, Investigações | Até 3 UFs, 2022 e 2024 | Soma de abstenções / soma de eleitores aptos. Eleições gerais e municipais não são a mesma disputa. |
| Gasto agregado por eleito | Plenário, Campanhas, Investigações | Cargo, UF, tempo | Soma das despesas informadas de todas candidaturas do cargo / número de eleitos. Não mede gasto de um eleito específico nem custo causal de ganhar. Moeda nominal, sem inflação. |
| Escolaridade | Arquivo, Investigações | Ano/cargo/UF, barras | Taxa de eleição entre resultados definidos, ou total de candidaturas por escolaridade. **Não é escolaridade do eleitorado**, fonte ausente no v3. |
| Patrimônio | Arquivo, Investigações | Ano/cargo/UF, quartis | Quartis formados apenas por candidaturas com patrimônio preenchido e resultado definido. Diferencial não implica causalidade. |
| Materiais de campanha | Campanhas, Mural, Adesivaria, Investigações | Cargo, partido/UF, tempo | Prefixos de categoria SANTINH, ADESIV e BANDEIRA. Grupos parciais; não representam todas despesas com propaganda. |
| Candidaturas na mesa | Arquivo | 2 a 3 fichas, barras | Votos, despesas totais, bens declarados. Aviso em caso de anos/cargos/UFs diferentes. |
| Municípios | Atlas | Escolha de dois municípios, barras | Abstenção 2024, IDHM armazenado, PIB per capita, população. Os indicadores podem ter anos de referência distintos. |

## Autonomia e integridade da informação
- A API se encontra em `server/comparacoes.py`, incluída pelo `server/app.py` como `/api/comparacoes/{indicador}`. A autenticação fica exclusivamente no backend (variáveis de ambiente de `server/.env`).
- O frontend em `src/components/ComparisonPanel.jsx` usa `getComparison`, do módulo `src/data/client.js`.
- Sem API, `src/data/comparisonSnapshot.js` habilita **somente recortes previamente auditados** em 21/10/2026. Filtros não auditados ficam indisponíveis. Mudança de partido para PSOL ou de estado, por exemplo, NÃO reutiliza valores nacionais da amostra.
- Nulos não são convertidos em zeros. Ausência de valores em anos de comparação aparece como lacuna.
- CSV contém **apenas as linhas agregadas vistas na comparação**, não dados individuais em massa nem documentos originais.
- Páginas não exibem nome de fornecedores técnicos do banco; marca e conexão são detalhes internos.
- Q6 sobre padrões de **jovens eleitores** e Q8 sobre **financiamento público/privado** continuam parciais ou indisponíveis até incorporar fontes complementares.

## Testes e execução

```bash
npm install
npm run dev
# para dados atualizados: configure server/.env e execute em outro terminal:
python -m pip install -r server/requirements.txt
python server/run.py
# verificações:
node --test tests/*.test.mjs
python -m unittest discover -s tests -p 'test_*.py' -q
npm run build
```

Se a API local estiver indisponível, o portal abre em modo acervo arquivado, com valores rastreáveis e etiquetas claras; a conexão de ChatGPT ao MotherDuck **não** configura automaticamente o serviço no computador do usuário.
