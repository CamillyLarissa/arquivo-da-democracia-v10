import {useEffect,useState} from 'react';
import {motion} from 'motion/react';
import {getCandidateExpenses} from '../data/client.js';
import {sampleExpenses} from '../data/despesas-amostra.js';
import {candidateScope,costPerVote,money,number} from './model.js';

export default function MuralDossier({candidate:c,live,reduce,onCompare,onOpenCandidate,onClose}){
 const [back,setBack]=useState(false),[expenses,setExpenses]=useState(false),[ledger,setLedger]=useState(null);
 useEffect(()=>{setBack(false);setExpenses(false);setLedger(null)},[c?.id,live]);
 useEffect(()=>{
  if(!c||!expenses||!live)return;
  let active=true;
  getCandidateExpenses(c.id,{limit:8}).then(data=>{if(active)setLedger({id:c.id,data})}).catch(()=>{if(active)setLedger({id:c.id,error:true})});
  return()=>{active=false};
 },[c?.id,expenses,live]);
 if(!c)return <aside className="mw-dossier mw-dossier-empty"><span className="mw-kicker">FICHA RETIRADA DO MURO</span><strong>Um nome.<br/>Uma campanha.<br/>Muitas perguntas.</strong><p>Selecione um cartaz para ler seus indicadores, virar o papel e investigar os lançamentos declarados.</p><span className="mw-hand-arrow" aria-hidden="true">↙</span></aside>;
 const entries=live?(ledger?.id===c.id?ledger.data?.entries:[]):sampleExpenses[c.id]||[];
 return <aside className="mw-dossier" aria-label={`Ficha de ${c.nome}`}><div className="mw-dossier-top"><span className="mw-kicker">FICHA RETIRADA DO MURO</span><button onClick={onClose} aria-label="Fechar ficha">×</button></div>
 <motion.div key={c.id+String(back)} initial={reduce?false:{opacity:.5,y:10,rotate:-1}} animate={{opacity:1,y:0,rotate:0}} transition={{duration:reduce?0:.25}} className="mw-dossier-paper">
 <span className="mw-kicker">{back?'VERSO / LEITURA DOS DADOS':'FRENTE / IDENTIFICAÇÃO'}</span><h3>{c.nome}</h3><p className="mw-scope">{candidateScope(c)}</p>
 {!back?<><strong className="mw-dossier-number">{c.numero??'—'}</strong><p>{c.partido||'Partido não informado'} · {c.resultado||'Resultado indefinido'}</p><dl><div><dt>Votos obtidos</dt><dd>{number(c.votos)}</dd></div><div><dt>Despesas declaradas</dt><dd>{money(c.gastos)}</dd></div></dl></>:<><dl><div><dt>Votos obtidos</dt><dd>{number(c.votos)}</dd></div><div><dt>Despesas declaradas</dt><dd>{money(c.gastos)}</dd></div><div><dt>Gasto por voto</dt><dd>{money(costPerVote(c))}</dd></div><div><dt>Patrimônio declarado</dt><dd>{money(c.patrimonio)}</dd></div></dl><p className="mw-method">Gasto por voto = despesa declarada ÷ votos, somente quando há votos positivos e despesa informada. É uma razão descritiva: não demonstra causalidade nem compra de votos.</p></>}
 <button className="mw-flip" onClick={()=>setBack(value=>!value)}>↻ {back?'VOLTAR À FRENTE':'VIRAR O PAPEL'}</button></motion.div>
 <div className="mw-dossier-actions"><button onClick={()=>onCompare(c)}>+ COMPARAR</button><button aria-expanded={expenses} onClick={()=>setExpenses(value=>!value)}>VER LANÇAMENTOS</button></div>
 {expenses&&<section className="mw-ledger" aria-label="Lançamentos da candidatura"><h4>Livro de despesas</h4><p>{live?'Até 8 maiores lançamentos. Não são notas fiscais.':'Amostra parcial de lançamentos; não equivale ao total declarado.'}</p>{live&&ledger?.id!==c.id?<p role="status">Consultando lançamentos…</p>:ledger?.error?<p role="alert">Consulta indisponível. Tente fechar e abrir os lançamentos.</p>:entries?.length?<ul>{entries.map((entry,i)=><li key={entry.id||i}><span>{entry.categoria||'Descrição não informada'}</span><b>{money(entry.valor)}</b></li>)}</ul>:<p>Nenhum lançamento carregado. Isso não significa despesa zero.</p>}<button onClick={()=>onOpenCandidate?.(c)}>ABRIR DOCUMENTOS FINANCEIROS ↗</button></section>}
 </aside>;
}
