import test from 'node:test';
import assert from 'node:assert/strict';
import {PAGE_SIZE,filterCandidates,offlineCandidates,offlineTowns,sortCandidates,summarizeCandidates,materialGroup,strongestMaterial,wallLayout,hasValue,costPerVote,resultGroup} from '../src/mural/model.js';

const scope={ano:2024,cargo:'VEREADOR'};
test('offline coverage and pagination keep the summary independent of the visible page',()=>{
 const all=filterCandidates(offlineCandidates,scope),summary=summarizeCandidates(all);
 assert.equal(all.length,24);assert.equal(offlineTowns.length,6);
 const page=sortCandidates(all,'gastos').slice(PAGE_SIZE);
 assert.equal(page.length,6);assert.equal(summary.stats.total,24);
 assert.equal(summary.leaders.find(row=>row.criterio==='votos').id,sortCandidates(all,'votos')[0].id);
 assert.deepEqual(summarizeCandidates(all),summary);
});
test('result, ballot number, accent, town and empty historical filters are exact',()=>{
 const row=offlineCandidates[0];
 assert.ok(filterCandidates(offlineCandidates,{...scope,search:String(row.numero)}).some(c=>c.id===row.id));
 assert.ok(filterCandidates(offlineCandidates,{...scope,municipio:row.municipio_id}).every(c=>c.municipio_id===row.municipio_id));
 assert.ok(filterCandidates(offlineCandidates,{...scope,resultado:'ELEITO'}).every(c=>resultGroup(c.resultado)==='eleito'));
 assert.ok(filterCandidates(offlineCandidates,{...scope,resultado:'NÃO ELEITO'}).every(c=>resultGroup(c.resultado)==='nao_eleito'));
 assert.equal(filterCandidates(offlineCandidates,{...scope,ano:2022}).length,0);
 const synthetic=[{...row,id:'unknown',resultado:null},{...row,id:'not',resultado:'NÃO ELEITO'}];
 assert.deepEqual(filterCandidates(synthetic,{...scope,resultado:'INDEFINIDO'}).map(c=>c.id),['unknown']);
});
test('unknown values stay missing; zero is known and cost per vote needs positive votes',()=>{
 for(const value of [null,undefined,'',NaN])assert.equal(hasValue(value),false);
 assert.equal(hasValue(0),true);assert.equal(costPerVote({gastos:100,votos:0}),null);
 const rows=[{id:'a',nome:'A',votos:null,gastos:null},{id:'b',nome:'B',votos:0,gastos:0}];
 assert.equal(sortCandidates(rows,'votos')[0].id,'b');
 assert.equal(summarizeCandidates(rows).stats.votos_informados,1);
 assert.equal(summarizeCandidates(rows.slice(0,1)).stats.gastos,null);
});
test('materials use conservative matches with mixed descriptions separated',()=>{
 assert.equal(materialGroup('Impressão de SANTINHOS'),'santinhos');
 assert.equal(materialGroup('Adesivos e bandeiras'),'mistos');
 assert.equal(materialGroup('Publicidade digital'),'nao_identificado');
 assert.equal(materialGroup('Material gráfico'),'outros_impressos');
 assert.equal(strongestMaterial('a',[{id:'a',grupo:'mistos',valor:10000},{id:'a',grupo:'adesivos',valor:200}]).grupo,'adesivos');
});
test('layouts are bounded, deterministic and regroup without losing candidate IDs',()=>{
 const rows=offlineCandidates.slice(0,PAGE_SIZE);
 for(const mode of ['votos','gastos','resultado','partido','materiais']){
  const layout=wallLayout(rows,mode,1);
  assert.equal(layout.cards.length,PAGE_SIZE);
  assert.deepEqual(layout,wallLayout(rows,mode,1));
  assert.deepEqual(new Set(layout.cards.map(c=>c.id)),new Set(rows.map(c=>c.id)));
  assert.ok(layout.cards.every(card=>card.y+324<=layout.height));
 }
});
