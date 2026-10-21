// Resultados observados em consultas somente de leitura ao banco eleitoral, 21/10/2026.
// Universo restrito a CE, MA, MS, RJ, RN e RS. Não representa o país inteiro.
export const discoveriesSnapshot={
 coverage:'CE · MA · MS · RJ · RN · RS',ano:2024,cargo:'VEREADOR',
 leaders:[
  {nome:'CARLOS BOLSONARO',uf:'RJ',partido:'PL',numero:22222,votos:130480,gastos:1507522},
  {nome:'MARCIO RIBEIRO',uf:'RJ',partido:'PSD',numero:55005,votos:56770,gastos:690474},
  {nome:'TAINÁ DE PAULA',uf:'RJ',partido:'PT',numero:13777,votos:49986,gastos:1290783},
  {nome:'CARLO CAIADO',uf:'RJ',partido:'PSD',numero:55622,votos:47671,gastos:1568013},
  {nome:'RAFAEL FREITAS',uf:'RJ',partido:'PSD',numero:55123,votos:40892,gastos:532782},
  {nome:'MARCELO DINIZ',uf:'RJ',partido:'PSD',numero:55888,votos:39967,gastos:200000},
  {nome:'ROSA FERNANDES',uf:'RJ',partido:'PSD',numero:55000,votos:39804,gastos:885323},
  {nome:'PRISCILA COSTA',uf:'CE',partido:'PL',numero:22222,votos:36226,gastos:500637},
  {nome:'LENIEL BOREL',uf:'RJ',partido:'PP',numero:11100,votos:34359,gastos:73600},
  {nome:'FELIPE MICHEL',uf:'RJ',partido:'PP',numero:11021,votos:31773,gastos:477852}
 ],
 abstencaoAlta:[{nome:'Uruguaiana',uf:'RS',eleitorado:88769,percentual:33.79},{nome:"Sant'Ana do Livramento",uf:'RS',eleitorado:74760,percentual:33.08},{nome:'Itaqui',uf:'RS',eleitorado:27768,percentual:32.71},{nome:'Canoas',uf:'RS',eleitorado:259585,percentual:31.83},{nome:'Alegrete',uf:'RS',eleitorado:58263,percentual:31.63}],
 abstencaoBaixa:[{nome:'Morrinhos',uf:'CE',eleitorado:18973,percentual:6.94},{nome:'Serra do Mel',uf:'RN',eleitorado:13040,percentual:7.63},{nome:'Jardim de Piranhas',uf:'RN',eleitorado:11079,percentual:7.76},{nome:'Ocara',uf:'CE',eleitorado:25336,percentual:7.96},{nome:'Acarape',uf:'CE',eleitorado:12558,percentual:8.27}],
 porEstado:[{uf:'RJ',municipios:92,percentual:26.24},{uf:'MS',municipios:79,percentual:23.89},{uf:'RS',municipios:497,percentual:23.69},{uf:'MA',municipios:217,percentual:17.05},{uf:'RN',municipios:167,percentual:16.54},{uf:'CE',municipios:184,percentual:14.21}],
 methodology:'Ranking de votos nominais para vereador em 2024, sem eleição suplementar. Abstenção em 2024: apenas municípios com pelo menos 10 mil eleitores aptos. Percentuais estaduais ponderados pelo eleitorado, não média simples dos municípios.'
};
export const stickersSnapshot={
 source:'Despesa_Candidatura · 6 estados · todos os anos disponíveis',
 data:[{tipo:'Santinhos',codigo:'santinhos',registros:110291,valor:145970129.67,descricao:'Folhetos impressos entregues aos eleitores'},{tipo:'Adesivos',codigo:'adesivos',registros:229661,valor:259448173.92,descricao:'Adesivos, vinil e perfurados'},{tipo:'Bandeiras',codigo:'bandeiras',registros:63285,valor:123474760.0,descricao:'Bandeiras e suportes classificados explicitamente'}],
 // Totais de grupos definidos por prefixo, obtidos em consulta de leitura à base v3; não representam toda a propaganda eleitoral.
 note:'Agrupamento ilustrativo de registros cuja categoria começa com SANTINH-, ADESIV- ou BANDEIRA. Existem grafias variantes; os totais para filtros diferentes são recalculados ao consultar o acervo. Não inclui toda a propaganda eleitoral.'
};
