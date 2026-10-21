"""Read-only aggregates for the campaign wall, never inferred from its page."""
import re
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix='/api/mural', tags=['mural'])
UFS = {'CE', 'MA', 'MS', 'RJ', 'RN', 'RS'}
CARGOS = {'VEREADOR', 'PREFEITO', 'DEPUTADO ESTADUAL', 'DEPUTADO FEDERAL', 'SENADOR', 'GOVERNADOR'}
RESULT_GROUP = """CASE WHEN UPPER(COALESCE(resultado,'')) LIKE 'ELEITO%' THEN 'eleito'
 WHEN UPPER(COALESCE(resultado,'')) IN ('NÃO ELEITO','NAO ELEITO') THEN 'nao_eleito'
 WHEN UPPER(COALESCE(resultado,''))='SUPLENTE' THEN 'suplente' ELSE 'indefinido' END"""


def candidate_scope(ano, uf, partido, cargo, resultado, search, municipio=''):
    uf = (uf or '').strip().upper()
    cargo = (cargo or '').strip().upper()
    if ano not in range(2002, 2025, 2):
        raise HTTPException(400, 'Ano fora da cobertura')
    if uf and uf not in UFS:
        raise HTTPException(400, 'UF fora da cobertura')
    if cargo and cargo not in CARGOS:
        raise HTTPException(400, 'Cargo inválido')
    if resultado not in ('', 'ELEITO', 'NÃO ELEITO', 'SUPLENTE', 'INDEFINIDO'):
        raise HTTPException(400, 'Resultado inválido')
    if len(partido) > 35 or len(search) > 80 or (municipio and not re.fullmatch(r'\d{7}', municipio)):
        raise HTTPException(400, 'Filtro inválido')
    sql = '''SELECT c.id_candidatura id,c.nome_urna nome,c.numero_urna numero,p.sigla partido,
      UPPER(e.cargo) cargo,e.ano,c.uf,m.nome municipio,CAST(c.id_municipio AS VARCHAR) municipio_id,
      c.escolaridade_candidatura escolaridade,c.patrimonio,c.gastos_campanha_total gastos,
      r.resultado,r.votos
      FROM v3.main.Candidatura c
      JOIN v3.main.Eleicao e ON c.id_eleicao=e.id_eleicao
      LEFT JOIN v3.main.Partido p ON c.id_partido=p.id_partido
      LEFT JOIN v3.main.Municipio m ON c.id_municipio=m.id_municipio
      LEFT JOIN v3.main.Resultado_Candidatura r ON c.id_candidatura=r.id_candidatura
      WHERE e.ano=? AND e.tipo_eleicao NOT ILIKE '%SUPLEMENTAR%'
      AND c.uf IN ('CE','MA','MS','RJ','RN','RS')
      AND (strip_accents(COALESCE(c.nome_urna,'')) ILIKE strip_accents(?)
        OR strip_accents(COALESCE(m.nome,'')) ILIKE strip_accents(?)
        OR strip_accents(COALESCE(p.sigla,'')) ILIKE strip_accents(?)
        OR CAST(c.numero_urna AS VARCHAR) ILIKE ?)
      AND (?='' OR c.uf=?) AND (?='' OR UPPER(p.sigla)=UPPER(?))
      AND (?='' OR UPPER(e.cargo)=?) AND (?='' OR CAST(c.id_municipio AS VARCHAR)=?)
      AND (?='' OR (?='ELEITO' AND UPPER(COALESCE(r.resultado,'')) LIKE 'ELEITO%')
        OR (?='NÃO ELEITO' AND UPPER(COALESCE(r.resultado,'')) IN ('NÃO ELEITO','NAO ELEITO'))
        OR (?='SUPLENTE' AND UPPER(COALESCE(r.resultado,''))='SUPLENTE')
        OR (?='INDEFINIDO' AND UPPER(COALESCE(r.resultado,'')) NOT LIKE 'ELEITO%'
          AND UPPER(COALESCE(r.resultado,'')) NOT IN ('NÃO ELEITO','NAO ELEITO','SUPLENTE')))'''
    args = [ano, *([f'%{search}%'] * 4), uf, uf, partido, partido, cargo, cargo,
            municipio, municipio, resultado, resultado, resultado, resultado, resultado]
    return sql, args


def run(sql, args=()):
    from app import _rows
    return _rows(sql, args)


# Conservative lexical matches on actual descriptions. Mixed descriptions are
# kept apart, never split across categories or counted twice.
_text = "UPPER(strip_accents(COALESCE(categoria,'')))"
_patterns = [r'(^|[^A-Z])SANTINH[OA]S?([^A-Z]|$)', r'(^|[^A-Z])ADESIV[OA]S?([^A-Z]|$)',
             r'(^|[^A-Z])BANDEIRAS?([^A-Z]|$)', r'(^|[^A-Z])(PANFLETOS?|FOLHETOS?|CARTAZ(ES)?|MATERIAL GRAFICO)([^A-Z]|$)']
_matches = [f"regexp_matches({_text},'{pattern}')" for pattern in _patterns]
MATERIAL_CASE = 'CASE WHEN ' + ' + '.join(f'CAST({m} AS INTEGER)' for m in _matches) + ">1 THEN 'mistos' "
MATERIAL_CASE += ' '.join(f"WHEN {match} THEN '{key}'" for match, key in zip(_matches, ['santinhos', 'adesivos', 'bandeiras', 'outros_impressos']))
MATERIAL_CASE += " ELSE 'nao_identificado' END"


@router.get('/resumo')
def summary(ano: int = 2024, uf: str = '', partido: str = '', cargo: str = 'VEREADOR',
            resultado: str = '', search: str = '', municipio: str = ''):
    base, args = candidate_scope(ano, uf, partido, cargo, resultado, search, municipio)
    cte = f'WITH b AS ({base}) '
    stats = run(cte + '''SELECT COUNT(*) total,COUNT(votos) votos_informados,SUM(votos) votos,
      COUNT(gastos) gastos_informados,ROUND(SUM(gastos),2) gastos FROM b''', args)[0]
    leaders = run(cte + '''SELECT * FROM (
      SELECT 'votos' criterio,* FROM b WHERE votos IS NOT NULL ORDER BY votos DESC,nome,id LIMIT 1)
      UNION ALL SELECT * FROM (
      SELECT 'gastos' criterio,* FROM b WHERE gastos IS NOT NULL ORDER BY gastos DESC,nome,id LIMIT 1)''', args)
    results = run(cte + f'''SELECT {RESULT_GROUP} grupo,COUNT(*) quantidade,
      COUNT(gastos) gastos_informados,ROUND(SUM(gastos),2) gastos,ROUND(AVG(gastos),2) media_gastos
      FROM b GROUP BY 1 ORDER BY 1''', args)
    parties = run(cte + '''SELECT COALESCE(partido,'Sem partido informado') partido,COUNT(*) quantidade
      FROM b GROUP BY 1 ORDER BY quantidade DESC,partido''', args)
    materials = run(cte + f'''SELECT {MATERIAL_CASE} grupo,COUNT(*) registros,COUNT(valor) valores_informados,
      ROUND(SUM(valor),2) valor,COUNT(DISTINCT id_candidatura) candidaturas
      FROM v3.main.Despesa_Candidatura WHERE id_candidatura IN (SELECT id FROM b)
      GROUP BY 1 ORDER BY valor DESC NULLS LAST,grupo''', args)
    return {'stats': stats, 'leaders': leaders, 'results': results, 'parties': parties, 'materials': materials,
            'source': 'consulta', 'scope': {'ano': ano, 'cargo': cargo, 'uf': uf, 'municipio': municipio},
            'method': 'Agregados de todas as candidaturas que atendem aos filtros, sem limite de página. Despesas declaradas e lançamentos são indicadores distintos.'}


@router.get('/materiais')
def page_materials(ids: str = Query(..., max_length=791)):
    parts = ids.split(',')
    if not 1 <= len(parts) <= 24 or len(set(parts)) != len(parts) or any(not re.fullmatch(r'[0-9a-f]{32}', part) for part in parts):
        raise HTTPException(400, 'Selecione de 1 a 24 candidaturas distintas')
    marks = ','.join('?' for _ in parts)
    rows = run(f'''SELECT id_candidatura id,{MATERIAL_CASE} grupo,COUNT(*) registros,
      COUNT(valor) valores_informados,ROUND(SUM(valor),2) valor
      FROM v3.main.Despesa_Candidatura WHERE id_candidatura IN ({marks})
      GROUP BY 1,2 ORDER BY id,valor DESC NULLS LAST,grupo''', parts)
    return {'rows': rows, 'source': 'consulta', 'scope': 'Lançamentos das candidaturas desta página; agrupamento por descrições, sem ratear itens mistos.'}
