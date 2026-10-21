# Relatório de auditoria e contrato visual · MotherDuck v3

Data do snapshot: 21/10/2026. Fonte: `pipeline_bdr_der_completo_v3`, compartilhamento MotherDuck consultado em leitura.

## Cobertura da base

- 12 tabelas e 5 views; `Municipio`: 1.236; `Candidato`: 382.866; `Candidatura`: 608.587; `Resultado_Candidatura`: 608.587.
- `Despesa_Candidatura`: 1.707.133 lançamentos; `Patrimonio_Candidato`: 455.886 linhas de bens, referentes a 136.297 grupos (ano, eleição, UF, sequencial); `Censo_Municipio`: 2.470 linhas (2010, 2022); `Participacao_Eleitoral`: 2.472 (2022, 2024).
- Estados: RS 497 municípios, MA 217, CE 184, RN 167, RJ 92 e MS 79.
- Eleições 2002–2024, incluindo suplementares, que devem ser excluídas das comparações de referência.

## Resultados implementados no site

| Q | Principal indicador inicial | Fontes | Observações |
|---|---|---|---|
| 1 | Gasto agregado por eleito/cadeira | Candidatura, Eleicao, Resultado_Candidatura | Gasto de todas candidaturas / número de eleitos; não corrigido pelo IPCA. |
| 2 | Taxa de eleição por quartis de patrimônio | Candidatura, Resultado | Quartis apenas entre declaração não nula; não causalidade. |
| 3 | Pearson IDHM × abstenção (2022 e 2024) | Censo, Participacao | Correlacionar por UF; IDHM 2010 não é IDHM 2022. |
| 4 | Escolaridade das candidaturas a vereador 2024 | Candidatura, Eleicao | Não há escolaridade municipal de comparação. |
| 5 | Proporção votos de legenda | Votos_Partido_Municipio | Apenas cargos proporcionais, primeiro turno. |
| 6 | % candidaturas 18–29 a partir de nascimento | Candidato, Candidatura, Eleicao | Faixas etárias do ELEITORADO indisponíveis. |
| 7 | Município mantém sigla líder de 2020 a 2024 | Votos_Partido_Municipio | Resultado não é orientação ideológica. |
| 8 | Não computável | Fonte faltante | Receita pública/privada não identificada. |
| 9 | Gastos por descrição original | Despesa_Candidatura | Precisa consolidar categoria de propaganda e corrigir views referindo catálogo v2. |
| 10 | Nº de anos/candidaturas/partidos/vitórias por pessoa | Candidatura, Resultado | Validar identificadores pessoais em séries antigas. |

## Achados reais de exemplo

- Gasto agregado/eleito: vereador R$ 21.755,19 (2020), R$ 51.493,01 (2024); dep. federal R$ 2.294.220,62 (2018), R$ 5.458.150,64 (2022) no recorte.
- Taxa de eleição para vereador por quartil de patrimônio: 2024 = 13,18% (inferior), 19,68%, 24,30%, 27,68% (superior).
- Votos de legenda em deputado federal: 6,49% (2018), 4,15% (2022); vereador: 5,43% (2020), 3,69% (2024).
- Municípios com mesma sigla líder para vereador 2020→2024: 452 de 1.236 (36,57%).
- `Candidato.dt_nascimento` permite derivar idade na eleição apesar do campo `Candidatura.idade_eleicao` estar vazio.
- Q9: categorias brutas `SANTINHOS`, `BANDEIRAS`, `ADESIVOS`, entre outras; a view `vw_q9_resumo_categorias` apresentou dependência quebrada para `pipeline_bdr_der_completo_v2`.

## Validações recomendadas antes de publicação

1. Auditoria de totalizações por pleito e cargo (turnos, suplementares e pessoas duplicadas).
2. Definir corretamente cargos proporcionais e municípios/estados comparáveis por ano.
3. Ligar IPCA para comparações monetárias reais e comparar gasto/eleito de forma transparente.
4. Auditar a relação do dado censitário `ano_referencia` com ano eleitoral e respeitar a data original do IDHM.
5. Ingerir receitas eleitorais e tabelas etárias/educacionais para completar Q4, Q6 e Q8.
6. Normalizar classificações das despesas Q9 sem duplicar eventos (a soma detalhada deve reconciliar com as candidaturas).
7. Implementar intervalo de confiança e modelos multivariados antes de publicar interpretações explicativas.

## Contrato de API

`GET /api/analysis/{id}` retorna `{'question': id, 'rows': [...], 'mode': 'live'}`; para Q8 retorna status `indisponivel`. O frontend mapeia os campos com `getChartData` em `src/App.jsx` e usa `snapshot.js` em caso de indisponibilidade.

**Importante:** esta implementação é um MVP navegável de pesquisa, não um laudo estatístico validado nem um portal oficial do TSE.
