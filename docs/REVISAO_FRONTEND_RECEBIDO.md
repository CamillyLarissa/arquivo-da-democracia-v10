# Revisão da lógica do frontend fornecido — sem alterar a estética

Referência inspecionada: `pipeline_bdr-feat-votos-legenda-atualizada.zip`, principalmente `frontend/App.tsx`, `frontend/GraficosLegenda.tsx`, `frontend/PainelPatrimonio.tsx`, `frontend/PainelQ9.tsx`, `frontend/EvolucaoPublicidade.tsx`, `frontend/Mapa.tsx`, `frontend/README_ui.md`, `bdr/consultas_q2.sql` e `bdr/legenda_views.sql`.

**Objetivo:** aproveitar raciocínio e boas regras de análise, não copiar a interface Preact ou suas cores. O portal permanece na linguagem do *Arquivo da Democracia* (papel envelhecido, azul, cartazes, arquivos, 3D).

## Ideias relevantes identificadas

1. **Comparações locais e por cargo.** Q2 cruza patrimônio e resultado por ano, cargo e UF/município. Decis, medianas e taxas possuem denominadores explícitos. Resultado `#NULO` ou `2º TURNO` **não** vira derrota. Por isso a query Q2 desta entrega foi corrigida para excluir do denominador os resultados indefinidos, em vez de atribuir derrota. A consulta foi executada em 21/10/2026: para vereador em 2024, as taxas nos quatro quartis foram 13,18%, 19,68%, 24,30% e 27,68% (sem suplementares).
2. **Legenda tem dois denominadores diferentes:** (A) legenda / (legenda+nominal) mede parcela dos votos válidos do partido/cargo; (B) legenda recebida pelo partido / votos de legenda totais mede a distribuição da legenda entre siglas. Não intercambiar esses indicadores. Somar municípios com `id_municipio` e `id_partido` sem contar duas vezes; comparar primeiro turno, o mesmo cargo e anos compatíveis.
3. **Continuidade partidária histórica requer mapeamento consciente.** A referência conserva as siglas originais nos dados e cria grupos específicos de renomeações/fusões somente no gráfico comparativo. Um partido ausente não deve ser registrado automaticamente como zero, nem fusões interpretadas como persistência ideológica.
4. **Q9 orientada por campanha.** Pesquisa individual, seleção com ID estável, distribuição de categorias, mudança de perfil e comparação da relação com resultados. Distinção entre dados brutos e categorias normalizadas; despesas nulas/sem categoria devem ser expostas, não mascaradas.
5. **Território com geometria e carregamento progressivo.** O frontend original carrega malhas TopoJSON por UF e mantém um catálogo de municípios, aborta requisições antigas e diferencia sem registro de zero real. Isso pode ser incorporado ao Atlas quando for oportuno, mas *não foi refeito nesta atualização*, para preservar a interface existente.
6. **Controle de seleções.** Cargos e anos válidos, comparação contextual, no máximo duas a três candidaturas na mesa; identificar o universo de cada taxa.

## Aplicado ao protótipo v6

- **Fichário ampliado** com pastas suspensas e classificação lateral (`ano`, `partido`, `cargo`, `estado`).
- A pasta que se abre corresponde à **faceta da candidatura realmente selecionada**, mesmo que esteja em outra página de divisórias.
- **Busca incremental**, localização automática após digitação, aproximação de câmera, abertura, destaque, retirada animada e cartão frente/verso.
- Listagem de 12 resultados por página, busca por nome, número, município e sigla, comparação de 3 fichas com alerta quando anos/cargos diferem.
- **Bug corrigido**: selecionar `ELEITO` não inclui mais `NÃO ELEITO` no catálogo (estava utilizando substring).
- **Q2** exclui situações indeterminadas dos decis/taxas de eleição. Q5 exige primeiro turno também em `Eleicao`.
- **Dados reais** somente via backend de leitura ou por snapshot explicitamente identificado. Sem token no navegador.

## Limites a não extrapolar

- A base cobre somente seis UFs e 1.236 municípios.
- Q1 (custo por cadeira): gasto agregado de todas as candidaturas / eleitos; não custo pessoal dos eleitos nem valor real da cadeira.
- Q2: associação de patrimônio declarado e vitória **não** comprova causalidade. Comparar categorias equivalentes e informar cobertura da variável.
- Q3: não comparar IDHM entre 2010 e 2022 como se fossem medições independentes; mesmo valor foi replicado na base.
- Q4, Q6: dados demográficos e educacionais dos eleitores estão incompletos no banco v3; idade das candidaturas ≠ idade dos eleitores.
- Q5: não misturar eleição geral de deputado com vereador; percentuais exigem denominadores nomeados.
- Q7: partido líder não equivale a ideologia nem explica voto individual.
- Q8: faltam receitas de financiamento público/privado; despesas não identificam origem.
- Q9: as views existentes do v3 referenciam o catálogo v2 indisponível; classificações brutas de publicidade não formam grupos mutuamente exclusivos.
- Q10: identidade histórica depende de ID pessoal confiável, e eleições suplementares devem ser tratadas separadamente.

## Cenário para futura integração

O repositório de referência contém rotas e regras analíticas mais completas para Q2, Q5, Q9 e dados geográficos. **Não incorporamos seu frontend no projeto React:** a arquitetura Preact, rotas e componentes são diferentes. A consulta real já existente no FastAPI continua read-only, com parâmetros validados. As correções deste ciclo foram pontuais e testadas com unidades.
