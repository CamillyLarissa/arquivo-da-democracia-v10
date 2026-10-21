// Amostra de municípios do acervo v3 verificada em 21/10/2026. Não é todo o território.
// IDHM cadastrado na referência 2022 mas oriundo de 2010; nunca apresentar como evolução.
export const municipiosAmostra = [
['2304400','Fortaleza','CE',2428708,.754,33500.25,15.52],['2303709','Caucaia','CE',355679,.682,27810.31,14.75],['2307304','Juazeiro do Norte','CE',286120,.694,20214.35,16.14],
['2111300','São Luís','MA',1037775,.768,38137.58,19.30],['2105302','Imperatriz','MA',273110,.731,32122.98,20.57],['2111201','São José de Ribamar','MA',244579,.708,11745.42,17.84],
['5002704','Campo Grande','MS',898100,.784,45071.37,25.50],['5003702','Dourados','MS',243367,.747,71668.71,21.43],['5008305','Três Lagoas','MS',132152,.744,98714.14,29.35],
['3304557','Rio de Janeiro','RJ',6211223,.799,61241,30.58],['3304904','São Gonçalo','RJ',896744,.739,22929.31,26.15],['3301702','Duque de Caxias','RJ',808161,.711,81495.31,23.63],
['2408102','Natal','RN',751300,.763,36599.79,25.22],['2408003','Mossoró','RN',264577,.720,36219.64,16.65],['2403251','Parnamirim','RN',252716,.766,29640.74,20.82],
['4314902','Porto Alegre','RS',1332845,.805,67686,31.51],['4305108','Caxias do Sul','RS',463501,.782,74092.82,25.13],['4304606','Canoas','RS',347657,.750,82894.41,31.83],
].map(([id,nome,uf,populacao,idhm,pib_per_capita,abstencao_2024])=>({id,nome,uf,populacao,idhm,pib_per_capita,abstencao_2024}));
