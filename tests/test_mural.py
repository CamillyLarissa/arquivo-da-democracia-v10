"""Execute actual read-only SQL against a synthetic, isolated DuckDB fixture."""
import sys
import re
import unittest
from pathlib import Path
from unittest.mock import patch
import duckdb
from fastapi import HTTPException
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'server'))
import app
import mural


class MuralQueries(unittest.TestCase):
    def setUp(self):
        self.con = duckdb.connect(':memory:')
        self.con.execute("ATTACH ':memory:' AS v3")
        self.con.execute('CREATE TABLE v3.main.Eleicao(id_eleicao INTEGER,ano INTEGER,cargo VARCHAR,tipo_eleicao VARCHAR)')
        self.con.execute("INSERT INTO v3.main.Eleicao VALUES(1,2024,'VEREADOR','ORDINÁRIA')")
        self.con.execute('CREATE TABLE v3.main.Partido(id_partido INTEGER,sigla VARCHAR)')
        self.con.execute("INSERT INTO v3.main.Partido VALUES(1,'PT'),(2,'PL')")
        self.con.execute('CREATE TABLE v3.main.Municipio(id_municipio INTEGER,nome VARCHAR)')
        self.con.execute("INSERT INTO v3.main.Municipio VALUES(2304400,'Fortaleza'),(3304557,'Rio de Janeiro')")
        self.con.execute('''CREATE TABLE v3.main.Candidatura(id_candidatura VARCHAR,nome_urna VARCHAR,numero_urna INTEGER,
         id_partido INTEGER,id_eleicao INTEGER,id_municipio INTEGER,uf VARCHAR,escolaridade_candidatura VARCHAR,
         patrimonio DOUBLE,gastos_campanha_total DOUBLE)''')
        self.con.execute('CREATE TABLE v3.main.Resultado_Candidatura(id_candidatura VARCHAR,resultado VARCHAR,votos INTEGER)')
        self.con.execute('CREATE TABLE v3.main.Despesa_Candidatura(id_candidatura VARCHAR,categoria VARCHAR,valor DOUBLE)')
        for i in range(40):
            cid=f'{i:032x}'
            self.con.execute('INSERT INTO v3.main.Candidatura VALUES(?,?,?,?,?,?,?,?,?,?)',[cid,f'Nome {i:02}',10000+i,1+i%2,1,2304400 if i<39 else 3304557,'CE' if i<39 else 'RJ','Superior',None,i*100])
            outcome=['ELEITO POR QP','NÃO ELEITO','SUPLENTE',None][i%4]
            self.con.execute('INSERT INTO v3.main.Resultado_Candidatura VALUES(?,?,?)',[cid,outcome,100-i])
        self.con.execute('INSERT INTO v3.main.Despesa_Candidatura VALUES(?,?,?),(?,?,?),(?,?,?)',
                         [f'{1:032x}','Santinhos',25,f'{1:032x}','Adesivos e bandeiras',90,f'{2:032x}','Publicidade digital',None])

    def tearDown(self):
        self.con.close()

    def rows(self,sql,args=()):
        self.assertEqual(re.sub(r"'(?:[^']|'')*'", "''", sql).count('?'),len(args))
        self.assertTrue(sql.lstrip().upper().startswith(('WITH','SELECT')))
        cursor=self.con.execute(sql,args)
        return [dict(zip([c[0] for c in cursor.description],row)) for row in cursor.fetchall()]

    def candidates(self,**kw):
        params=dict(ano=2024,uf='',partido='',cargo='VEREADOR',resultado='',search='',municipio='',limit=18,offset=0,ordem='gastos')
        params.update(kw)
        with patch.object(app,'_rows',self.rows):return app.candidates(**params)

    def test_full_scope_leader_is_not_in_first_expense_page(self):
        page=self.candidates()
        with patch.object(app,'_rows',self.rows):summary=mural.summary()
        self.assertEqual(page['total'],40)
        self.assertEqual(len(page['rows']),18)
        self.assertEqual(summary['stats']['total'],40)
        leader=next(row for row in summary['leaders'] if row['criterio']=='votos')
        self.assertNotIn(leader['id'],[row['id'] for row in page['rows']])
        self.assertEqual(leader['votos'],100)
        self.assertEqual(sum(row['quantidade'] for row in summary['results']),40)
        self.assertEqual(sum(row['quantidade'] for row in summary['parties']),40)
        materials={row['grupo']:row for row in summary['materials']}
        self.assertEqual(materials['mistos']['valor'],90)
        self.assertEqual(materials['santinhos']['valor'],25)
        self.assertIsNone(materials['nao_identificado']['valor'])

    def test_filters_match_scope_in_summary_and_page(self):
        for result,count in [('ELEITO',10),('NÃO ELEITO',10),('SUPLENTE',10),('INDEFINIDO',10)]:
            self.assertEqual(self.candidates(resultado=result)['total'],count)
            with patch.object(app,'_rows',self.rows):summary=mural.summary(resultado=result)
            self.assertEqual(summary['stats']['total'],count)
        self.assertEqual(self.candidates(search='10039')['rows'][0]['nome'],'Nome 39')
        self.assertEqual(self.candidates(municipio='2304400')['total'],39)
        self.assertEqual(self.candidates(search="' OR 1=1 --")['total'],0)
        second=self.candidates(offset=18)
        self.assertFalse(set(row['id'] for row in second['rows']) & set(row['id'] for row in self.candidates()['rows']))

    def test_material_validation_and_missing_data(self):
        for ids in ['', 'invalid',','.join([f'{1:032x}']*2),','.join(f'{i:032x}' for i in range(25))]:
            with self.assertRaises(HTTPException):mural.page_materials(ids)
        with patch.object(app,'_rows',self.rows):
            rows=mural.page_materials(f'{1:032x}')['rows']
            empty=mural.summary(search='absent')
        self.assertEqual(sum(row['valor'] for row in rows),115)
        self.assertEqual(empty['stats']['total'],0)
        self.assertIsNone(empty['stats']['gastos'])
        for params in [dict(ano=2023),dict(uf='SP'),dict(cargo='INVALID'),dict(municipio="1 OR 1=1")]:
            args=dict(ano=2024,uf='',partido='',cargo='VEREADOR',resultado='',search='');args.update(params)
            with self.assertRaises(HTTPException):mural.candidate_scope(**args)

    def test_connection_overview_quotes_reserved_value_alias(self):
        # The actual DuckDB parser rejects COUNT(*) value without quotes.
        def query(sql,args=()):
            safe=sql
            for table in ['Candidato','Despesa_Candidatura','Patrimonio_Candidato','Votos_Partido_Municipio','Municipio']:
                safe=safe.replace('v3.main.'+table+' ', 'v3.main.Candidatura ')
            safe=safe.replace('v3.main.Municipio', 'v3.main.Candidatura')
            return self.rows(safe,args)
        with patch.object(app,'_rows',query):result=app.overview()
        self.assertEqual(result['values']['applications'],40)
