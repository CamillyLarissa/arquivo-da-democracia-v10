import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,known,sumKnown,offlineData,offlineDetail,offlineCandidates,ratio,municipalOffice} from '../src/adesivaria/model.js';
const scope={ano:2024,cargo:'VEREADOR',uf:'',municipio:'',partido:'',material:'adesivos',abrangencia:'seis_estados'};
test('classification recognizes explicit products and controlled purchase/production prefixes',()=>{
 for(const description of ['ADESIVO PERFURADO','adesivos 10x10','AQUISIÇÃO DE ADESIVOS','Impressão de adesivos'])assert.equal(classify(description),'Adesivos');
 assert.equal(classify('Confecção de santinhos'),'Santinhos');
 assert.equal(classify('BANDEIRAS DE TECIDO'),'Bandeiras');
 for(const description of ['INSTALAÇÃO DE ADESIVOS','RETIRADA DE ADESIVOS','Adesivagem do comitê','PESSOAL PARA DISTRIBUIÇÃO DE SANTINHOS','ADESIVOS E BANDEIRAS','BANDEIRAS - LOCAÇÃO','PUBLICIDADE DIGITAL','MATERIAL GRÁFICO','SERVIÇOS GENÉRICOS','ADESIVANTE'])assert.equal(classify(description),null,description);
});
test('missing values stay missing and known zero/negative values stay numeric',()=>{
 for(const value of [null,undefined,'',NaN])assert.equal(known(value),false);
 assert.equal(known(0),true);assert.equal(sumKnown([null]),null);assert.equal(sumKnown([0,null]),0);assert.equal(sumKnown([100,-20]),80);
 assert.equal(ratio(50,100),50);assert.equal(ratio(null,100),0);assert.equal(ratio(-10,100),0);
});
test('offline totals and leaders use the full filtered sample independently of pages',()=>{
 const first=offlineData(scope),next=offlineData(scope,{offset:12,offset_votos:12});
 assert.equal(first.stats.candidaturas,24);assert.equal(first.votes.length,12);assert.equal(next.votes.length,12);
 assert.deepEqual(first.stats,next.stats);assert.deepEqual(first.podium,next.podium);
 assert.equal(next.votes[0].posicao_votos,13);assert.equal(first.stats.maior_votacao,first.votes[0].votos);
 assert.equal(first.stats.valor,sumKnown(first.parties.map(row=>row.valor)));
 assert.equal(first.stats.lancamentos,first.categories.reduce((sum,row)=>sum+row.registros,0));
 assert.ok(first.votes.some(row=>row.gastos_classificados===null));
 assert.ok(first.podium.every(row=>row.gastos_classificados!==row.gastos));
});
test('offline filters preserve exact municipal codes and do not invent historical/federal data',()=>{
 const row=offlineCandidates.find(c=>c.uf==='CE');
 const municipal=offlineData({...scope,uf:'CE',abrangencia:'municipio',municipio:row.municipio_id});
 assert.ok(municipal.votes.every(c=>c.uf==='CE'&&c.municipio_id===row.municipio_id));
 assert.equal(offlineData({...scope,ano:2022}).stats.candidaturas,0);
 assert.equal(offlineData({...scope,cargo:'DEPUTADO FEDERAL'}).stats.candidaturas,0);
 assert.equal(offlineData({...scope,partido:'INEXISTENTE'}).stats.valor,null);
 assert.equal(municipalOffice('PREFEITO'),true);assert.equal(municipalOffice('SENADOR'),false);
});
test('candidate ledger and per-material amounts agree with the selected sample ranking',()=>{
 for(const material of ['adesivos','santinhos','bandeiras','todos']){
  const data=offlineData({...scope,material});
  for(const row of data.podium){
   const detail=offlineDetail(row.id,{...scope,material});
   assert.equal(detail.candidate.gastos_classificados,row.gastos_classificados);
   assert.equal(detail.total,row.lancamentos);
   assert.equal(sumKnown(detail.entries.map(entry=>entry.valor)),row.gastos_classificados);
   assert.equal(detail.candidate.posicao_gastos,row.posicao_gastos);
  }
 }
});
