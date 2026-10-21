# Malhas do Atlas

Fonte: API de Malhas Geográficas v3 do IBGE e API de Localidades v1.
Obtidas em 21/10/2026; limites simplificados, qualidade mínima. O parâmetro de
período foi omitido para usar a versão disponível no serviço; a data de obtenção
não é o ano de referência da malha.

- Estados: https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=UF
- Municípios: https://servicodados.ibge.gov.br/api/v3/malhas/estados/23?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=municipio
  (21 MA, 23 CE, 24 RN, 33 RJ, 43 RS e 50 MS).
- Nomes: https://servicodados.ibge.gov.br/api/v1/localidades/estados/CE/municipios
  (repetido para cada uma das seis UFs).
- Documentação: https://servicodados.ibge.gov.br/api/docs/malhas?versao=3

Os arquivos mantêm as geometrias e o identificador `codarea` do IBGE; acrescentam
`uf` e `nome` para navegação acessível. Total: 27 UFs e 1.236 municípios nas seis
malhas municipais. Os indicadores são associados pelo código IBGE, nunca pelo
nome. Geometria disponível não significa indicador disponível: valores ausentes
permanecem cinzas. O carregamento é local e por UF, sem token ou chamada ao IBGE
no navegador. A orientação dos anéis é normalizada em memória para d3-geo.
