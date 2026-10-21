"""Valida paginação e filtros parametrizados sem acesso ao banco remoto."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import app

class ExpensesPagination(unittest.TestCase):
 def test_all_pages_are_parametrized(self):
  original=app._rows;seen=[]
  def fake(sql,args=()):
   self.assertEqual(sql.count('?'),len(args));seen.append((sql,args))
   if 'SELECT c.id_candidatura id' in sql:return [{'id':'abc','nome':'Pessoa demonstrativa'}]
   if 'COUNT(*) quantidade,ROUND(SUM(valor)' in sql:return [{'quantidade':67,'total':1000}]
   if 'SELECT COUNT(*) quantidade FROM' in sql:return [{'quantidade':13}]
   return []
  app._rows=fake
  try:
   result=app.candidate_expenses('a'*32,categoria='ADESIVOS',limit=40,offset=40)
   self.assertEqual(result['total_filtered'],13)
   self.assertEqual(result['offset'],40)
   self.assertEqual(result['limit'],40)
   self.assertTrue(any('LIMIT ? OFFSET ?' in sql for sql,_ in seen))
   self.assertEqual(seen[-1][1][-2:],[40,40])
  finally:app._rows=original
if __name__=='__main__':unittest.main()
