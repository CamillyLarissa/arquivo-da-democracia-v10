"""Testa apenas o contrato parametrizado; não exige token nem faz rede."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1] / 'server'))
import app

class QueryContractTest(unittest.TestCase):
    def test_candidate_search_filters_and_parameters(self):
        previous = app._rows
        queries=[]
        def fake(sql, args=()):
            self.assertEqual(sql.count('?'),len(args))
            queries.append((sql,args))
            return [{'id':'example','total_encontrado':1}]
        app._rows = fake
        try:
            for status in ('ELEITO','NÃO ELEITO','SUPLENTE',''):
                result=app.candidates(search='joao',ano=2024,uf='MA',partido='PT',cargo='VEREADOR',resultado=status,limit=12,offset=0,ordem='votos')
                self.assertEqual(result['total'],1)
            sql,args=queries[-1]
            self.assertIn("LIKE 'ELEITO%'",sql)
            self.assertIn("'NÃO ELEITO'",sql)
            self.assertIn('strip_accents',sql)
            self.assertIn('CAST(c.numero_urna AS VARCHAR)',sql)
        finally:
            app._rows = previous
    def test_q2_excludes_unknown_outcomes(self):
        self.assertIn('WHERE eleito IS NOT NULL',app.QUERY[2])
        self.assertIn('SUPLENTE',app.QUERY[2])
    def test_q5_filters_first_round(self):
        self.assertIn('v.turno=1 AND e.turno=1',app.QUERY[5])

if __name__=='__main__':unittest.main()
