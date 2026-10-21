import {sampleCandidates} from '../data/candidatos-amostra.js';
import {sampleExpenses} from '../data/despesas-amostra.js';
import {municipiosAmostra} from '../data/municipios-amostra.js';

export const PAGE_SIZE=18;
export const MODES=[['votos','Mais votados'],['gastos','Maiores despesas'],['resultado','Eleitos e não eleitos'],['partido','Partidos'],['materiais','Materiais de propaganda']];
export const RESULTS={eleito:'Eleitos',nao_eleito:'Não eleitos',suplente:'Suplentes',indefinido:'Resultado indefinido'};
export const MATERIALS={santinhos:'Santinhos',adesivos:'Adesivos',bandeiras:'Bandeiras',outros_impressos:'Outros impressos identificados',mistos:'Descrição mista · sem rateio',nao_identificado:'Sem material reconhecido'};
export const hasValue=v=>(typeof v==='number'||typeof v==='string')&&String(v).trim()!==''&&Number.isFinite(Number(v));
export const number=v=>hasValue(v)?Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2}):'Não informado';
export const money=v=>hasValue(v)?Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}):'Não informado';
export const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
export const resultGroup=value=>normalize(value).startsWith('ELEITO')?'eleito':normalize(value)==='NAO ELEITO'?'nao_eleito':normalize(value)==='SUPLENTE'?'suplente':'indefinido';
export const costPerVote=row=>hasValue(row?.gastos)&&hasValue(row?.votos)&&Number(row.votos)>0?Number(row.gastos)/Number(row.votos):null;
export const orderForMode=mode=>mode==='materiais'?'gastos':mode;
export const candidateScope=row=>`${row.ano} · ${row.cargo} · ${row.municipio||'Município não informado'} / ${row.uf}`;
export function materialGroup(description){
 const text=normalize(description);
 const patterns=[/(^|[^A-Z])SANTINH[OA]S?([^A-Z]|$)/,/(^|[^A-Z])ADESIV[OA]S?([^A-Z]|$)/,/(^|[^A-Z])BANDEIRAS?([^A-Z]|$)/,/(^|[^A-Z])(PANFLETOS?|FOLHETOS?|CARTAZ(ES)?|MATERIAL GRAFICO)([^A-Z]|$)/];
 const matches=patterns.map((pattern,index)=>pattern.test(text)?['santinhos','adesivos','bandeiras','outros_impressos'][index]:null).filter(Boolean);
 return matches.length>1?'mistos':matches[0]||'nao_identificado';
}
export const offlineCandidates=sampleCandidates.map(row=>({...row,municipio_id:municipiosAmostra.find(m=>m.uf===row.uf&&normalize(m.nome)===normalize(row.municipio))?.id||''}));
export const offlineTowns=municipiosAmostra.filter(m=>offlineCandidates.some(c=>c.municipio_id===m.id));
export function filterCandidates(rows,params){
 const query=normalize(params.search).trim();
 return rows.filter(row=>Number(row.ano)===Number(params.ano)&&(!params.cargo||normalize(row.cargo)===normalize(params.cargo))&&(!params.uf||row.uf===params.uf)&&(!params.municipio||String(row.municipio_id)===params.municipio)&&(!params.partido||normalize(row.partido)===normalize(params.partido))&&(!params.resultado||resultGroup(row.resultado)===({'ELEITO':'eleito','NÃO ELEITO':'nao_eleito','SUPLENTE':'suplente','INDEFINIDO':'indefinido'})[params.resultado])&&(!query||[row.nome,row.numero,row.municipio,row.partido].some(v=>normalize(v).includes(query))));
}
const textCompare=(a,b)=>String(a)===String(b)?0:String(a)<String(b)?-1:1;
export function sortCandidates(rows,mode){
 const order=orderForMode(mode);
 const metric=row=>order==='custo_voto'?costPerVote(row):row[order==='gastos'?'gastos':'votos'];
 return [...rows].sort((a,b)=>{
  const group=order==='partido'?textCompare(a.partido??'\uffff',b.partido??'\uffff'):order==='resultado'?textCompare(resultGroup(a.resultado),resultGroup(b.resultado)):0;
  if(group)return group;
  const x=metric(a),y=metric(b);
  const diff=!hasValue(x)?(hasValue(y)?1:0):!hasValue(y)?-1:Number(y)-Number(x);
  return diff||textCompare(a.nome,b.nome)||textCompare(a.id,b.id);
 });
}
function sumKnown(rows,key){const valid=rows.filter(row=>hasValue(row[key]));return {known:valid.length,value:valid.length?valid.reduce((sum,row)=>sum+Number(row[key]),0):null}}
export function offlineMaterials(rows){
 return rows.flatMap(row=>{
  const groups=new Map();
  for(const expense of sampleExpenses[row.id]||[]){
   const key=materialGroup(expense.categoria);
   if(!groups.has(key))groups.set(key,[]);groups.get(key).push(expense);
  }
  return [...groups].map(([grupo,expenses])=>({id:row.id,grupo,registros:expenses.length,valores_informados:sumKnown(expenses,'valor').known,valor:sumKnown(expenses,'valor').value}));
 });
}
export function summarizeCandidates(rows){
 const votes=sumKnown(rows,'votos'),spending=sumKnown(rows,'gastos');
 const results=Object.keys(RESULTS).map(grupo=>{const group=rows.filter(row=>resultGroup(row.resultado)===grupo),values=sumKnown(group,'gastos');return {grupo,quantidade:group.length,gastos_informados:values.known,gastos:values.value,media_gastos:values.known?values.value/values.known:null}});
 const parties=[...new Set(rows.map(row=>row.partido||'Sem partido informado'))].map(partido=>({partido,quantidade:rows.filter(row=>(row.partido||'Sem partido informado')===partido).length})).sort((a,b)=>b.quantidade-a.quantidade||textCompare(a.partido,b.partido));
 const materials=Object.keys(MATERIALS).flatMap(grupo=>{const values=offlineMaterials(rows).filter(row=>row.grupo===grupo);const sum=sumKnown(values,'valor');return values.length?[{grupo,registros:values.reduce((total,row)=>total+row.registros,0),valor:sum.value,candidaturas:values.length}]:[]});
 return {stats:{total:rows.length,votos:votes.value,votos_informados:votes.known,gastos:spending.value,gastos_informados:spending.known},leaders:['votos','gastos'].flatMap(criterio=>{const first=sortCandidates(rows.filter(row=>hasValue(row[criterio])),criterio)[0];return first?[{...first,criterio}]:[]}),results,parties,materials,source:'amostra',partial_materials:true};
}
export function strongestMaterial(candidateId,materials){
 return materials.filter(row=>row.id===candidateId&&['santinhos','adesivos','bandeiras','outros_impressos'].includes(row.grupo)&&hasValue(row.valor)).sort((a,b)=>Number(b.valor)-Number(a.valor)||textCompare(a.grupo,b.grupo))[0]||null;
}
export function posterTone(id){let hash=0;for(const ch of String(id))hash=(hash*31+ch.charCodeAt(0))>>>0;return ['green','blue','paper','yellow','red'][hash%5]}
export function wallLayout(rows,mode,columns=3,materials=[]){
 const groups=new Map();
 const groupFor=row=>mode==='resultado'?resultGroup(row.resultado):mode==='partido'?(row.partido||'Sem partido informado'):mode==='materiais'?(strongestMaterial(row.id,materials)?.grupo||'sem_registro'):'geral';
 for(const row of rows){const group=groupFor(row);if(!groups.has(group))groups.set(group,[]);groups.get(group).push(row)}
 const cards=[],headings=[];let y=30;
 for(const [group,entries] of groups){
  const label=mode==='resultado'?RESULTS[group]:mode==='materiais'?(MATERIALS[group]||'Sem material carregado'):group==='geral'?'Cartazes desta página':group;
  headings.push({key:group,label,count:entries.length,y});y+=45;
  entries.forEach((row,index)=>cards.push({id:row.id,x:26+(index%columns)*254,y:y+Math.floor(index/columns)*350,rotation:[-1.8,1.3,-.7,1.8,-1.2,.5][cards.length%6]}));
  y+=Math.ceil(entries.length/columns)*350+30;
 }
 return {cards,headings,width:columns*254+26,height:Math.max(500,y)};
}
