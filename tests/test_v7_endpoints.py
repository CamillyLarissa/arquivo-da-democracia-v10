import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import app

class V7Endpoints(unittest.TestCase):
 def test_rankings_have_parameterized_filters(self):
  original=app._rows; seen=[]
  def fake(sql,params=()):
   self.assertEqual(sql.count('?'),len(params))
   self.assertNotIn('2024 OR',sql)
   seen.append((sql,params))
   return []
  app._rows=fake
  try:
   r=app.descobertas(ano=2024,cargo='VEREADOR',uf='RJ')
   self.assertEqual(r['ano'],2024)
   self.assertEqual(len(seen),4)
   self.assertEqual(seen[0][1],[2024,'VEREADOR','RJ','RJ'])
  finally: app._rows=original
 def test_stickers_use_aggregated_expenses_not_invoices(self):
  original=app._rows; seen=[]
  def fake(sql,params=()):
   self.assertEqual(sql.count('?'),len(params))
   self.assertIn('Despesa_Candidatura',sql)
   self.assertIn("LIKE 'ADESIV%'",sql)
   seen.append(sql)
   return []
  app._rows=fake
  try:
   r=app.adesivaria(ano=2024,uf='CE',partido='PT')
   self.assertEqual(len(seen),3)
   self.assertEqual(r['document_type'],'SINTESSE_DE_LANCAMENTOS')
  finally:app._rows=original
if __name__=='__main__': unittest.main()
