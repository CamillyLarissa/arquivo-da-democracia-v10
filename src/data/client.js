import {overview as base, analyses, states} from './snapshot.js';
const API_TIMEOUT=12500;
export async function request(path,{signal}={}){
  const controller=new AbortController();const t=setTimeout(()=>controller.abort(),API_TIMEOUT);
  const cancel=()=>controller.abort();
  if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
  try{const r=await fetch('/api'+path,{signal:controller.signal});if(!r.ok)throw new Error('API '+r.status);return await r.json();}
  finally{clearTimeout(t);signal?.removeEventListener('abort',cancel)}
}
export async function getHealth(){try{return await request('/health')}catch{return {connected:false,mode:'snapshot'}}}
export async function getOverview(){try{const live=await request('/overview');return {...base,...live.values,mode:'live'}}catch{return {...base,mode:'snapshot'}}}
export async function getAnalysis(id){try{return await request('/analysis/'+id)}catch{return null}}
export async function getCandidates(params={},options){const q=new URLSearchParams(params);return request('/candidates?'+q.toString(),options)}
export async function getCandidateExpenses(id,params={}){const q=new URLSearchParams(params);return request('/candidate-expenses/'+encodeURIComponent(id)+'?'+q.toString())}
export async function getMunicipios(params={}){const q=new URLSearchParams(params);return request('/municipios?'+q.toString())}
export {analyses,states};

export async function getDescobertas(params={}){const q=new URLSearchParams(params);return request('/descobertas?'+q.toString())}
export async function getAdesivaria(params={}){const q=new URLSearchParams(params);return request('/adesivaria?'+q.toString())}

/** Série comparativa: SQL pré-definido, somente leitura e parâmetros na API. */
export async function getComparison(kind, params={}){
  const allowed=['legenda','abstencao','cadeiras','escolaridade','propaganda','patrimonio'];
  if(!allowed.includes(kind))throw new Error('Comparador desconhecido');
  const q=new URLSearchParams(params);
  return request(`/comparacoes/${kind}?${q.toString()}`);
}
