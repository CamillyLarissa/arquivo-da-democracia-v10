# Ajustes da V8 — fidelidade visual + integridade dos dados

## Fichário e santinho
- Uma ficha é extraída fisicamente da gaveta (Three.js). Durante o movimento, o modelo 3D apresenta nome, número e sigla; quando aberto, o santinho completo se sobrepõe **dentro da área da cena**, com frente e verso interativos.
- A frente recupera número de urna, nome, partido, cargo, ano, resultado e município. O verso organiza votos, despesas, patrimônio e escolaridade quando disponíveis.
- **Não há fotos dos candidatos no banco utilizado.** Usamos uma silhueta **declaradamente ilustrativa**; não inventamos retratos de pessoas reais.

## Adesivaria
- Três materiais classificados no banco (ADESIV-, SANTINH-, BANDEIRA-) foram convertidos em **selos redondos**, com borda impressa e canto de papel descolando quando o usuário seleciona.
- Nova área com adesivos redondos *de candidaturas*, frente e verso: número, nome, partido, UF, ano e, no verso, votos, gastos totais e resultado. **São recriações editoriais**, não santinhos reais e muito menos comprovantes de aquisição.
- O backend retorna número, total de gastos, votos e resultado dos candidatos do ranking de materiais. Consulte os campos de origem para não confundir despesas específicas da categoria com gastos gerais.

## Prestação de contas
- Envelope maior, com dobra e animação de abertura; começa fechado após selecionar uma candidatura.
- Extrato é retirado apenas quando o usuário abre. Na ausência de lançamentos, apresenta um documento explicativo útil com total da candidatura, **sem fabricar registros**.
- A prévia contém cinco lançamentos reais (maiores valores) para BELLA CARMELO e RONALDO MARTINS, anteriormente ausentes. Consultados no MotherDuck `pipeline_bdr_der_completo_v3`, em 21/10/2026.
- O extrato **não é nota fiscal original**: a base contém categoria/valor e identificador de lançamento, não imagem ou XML fiscal completo.

## Plenário
- Remodelados tablado, degraus, mesa diretora elevada com cadeiras da presidência, microfones e tribuna central.
- Cadeiras agora têm estofados coloridos por **três blocos cenográficos A/B/C**; não indicam a composição partidária real da casa e **não indicam posicionamento político/ideológico**. Números (72) são cenográficos.
- Ajustada a câmera e o piso para dar maior ênfase ao palco e às bancadas curvas.
- A visualização monetária do painel usa os indicadores disponíveis do recorte de seis estados; não representa custo causal nem preço de mandato.

## Dados e privacidade
- Banco `pipeline_bdr_der_completo_v3`, 1.236 municípios em CE, MA, MS, RJ, RN, RS. Sem cobertura nacional completa.
- A API de leitura se conecta ao MotherDuck somente pelo servidor, via token `MOTHERDUCK_TOKEN` no ambiente. Nunca inclua um token nos arquivos públicos.
- Modo sem servidor mostra **amostra real e parcial**, não toda a base. Para consultar as candidaturas completas, iniciar o servidor e frontend.

## Verificações
- `npm run build` (Vite): aprovado.
- `node --test tests/*.mjs` e `python -m unittest discover -s tests -p 'test_*.py'`: aprovados.
- Consulta SQL da nova resposta da Adesivaria executada com sucesso no MotherDuck (recorte CE/2024).
- Renderização visual em navegador: **não confirmada** neste ambiente; Chromium bloqueou a abertura da URL local com `ERR_BLOCKED_BY_ADMINISTRATOR`. Como teste alternativo, carregamos o bundle em um HTML inline: a navegação e as telas 2D funcionaram, assim como o envelope de BELLA CARMELO e os adesivos clicáveis; o ambiente bloqueia a criação do contexto WebGL, por isso a aparência final do 3D ainda requer teste em desktop/mobile. Para dispositivos sem WebGL, adicionamos alternativas 2D funcionais.
