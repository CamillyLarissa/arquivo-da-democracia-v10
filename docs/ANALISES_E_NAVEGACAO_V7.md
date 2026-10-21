# Como as análises aparecem nas experiências do portal

| Pesquisa | Exploração editorial | Dados principais | Cuidado |
|---|---|---|---|
| Q1 Custo por cadeira | Plenário 3D e investigação detalhada | gastos e candidaturas eleitas por cargo/pleito | indicador nominal, não custo real de eleição de um mandato |
| Q2 Patrimônio e vitória | ficha que vira dentro do 3D | patrimônio declarado, votos, eleição | excluir resultados indefinidos, comparar cargo/ano |
| Q3 Condições socioeconômicas e voto | Atlas cartográfico, rankings territoriais | PIB per capita, IDHM, participação, votos | correlação não identifica quem votou em quem; IDHM replicado de 2010 |
| Q4 Escolaridade | ficha do arquivo e investigação | escolaridade de candidatura | falta escolaridade populacional na base |
| Q5 Votos de legenda | TV, mural partidário e investigação | votos nominais e legenda | compare vereador com vereador, deputados com deputados |
| Q6 Juventude | arquivo e investigação | idade de quem concorre pela data de nascimento | não responde idade do eleitorado sem nova fonte |
| Q7 Continuidade partidária | muro de campanhas e atlas | sigla líder municipal 2020→2024 | sigla não equivale a ideologia; sucessões exigem tratamento |
| Q8 Fontes de financiamento | investigação explica falta de receitas | despesas não identificam origem | não inferir público/privado sem tabela de receitas |
| Q9 Formas de propaganda | Adesivaria, mural e mesa de contas | Despesa_Candidatura e categorias | prefixos 'SANTINH-', 'ADESIV-', 'BANDEIRA-' são recorte incompleto |
| Q10 Trajetória | arquivo histórico 2002→2024 | pessoa e candidatura por ano | identidade entre anos requer validação |

## Descobertas em evidência

- Ranking de votos é restringido ao **mesmo ano e cargo**; opcionalmente por UF. Não é ranking nacional.
- Ranking municipal de abstenção fixa **mínimo de 10 mil eleitores aptos** e usa taxa de 2022/2024 disponível em Participacao_Eleitoral.
- Estados são ordenados pela **taxa agregada = soma das abstenções / soma do eleitorado apto**, em vez da média simples das taxas municipais.
- Na Adesivaria os totais vêm da soma de lançamentos em `Despesa_Candidatura` e não do valor total de gastos de cada campanha. As despesas foram identificadas pelo prefixo explícito no campo categoria; pode haver outros formatos não classificados.
- O ranking de candidaturas por gastos na Adesivaria considera **somente** os três grupos selecionados, jamais o gasto total geral.

## Interação

Um nome pesquisado determina uma gaveta; ela desliza, a pasta sobe, a ficha extrai-se em Three.js; dentro do mesmo viewport abre uma página interativa virável com Motion. A lista lateral garante acesso equivalente por teclado e busca, inclusive em dispositivos sem mouse.

## Fontes

Consultas de leitura realizadas no banco `pipeline_bdr_der_completo_v3` em 21/10/2026; malha cartográfica GeoJSON já fornecida pelo usuário, baseada nos limites IBGE. Capturas e números estáticos são snapshots, não dados em tempo real.
