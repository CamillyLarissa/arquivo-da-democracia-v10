import {memo,useRef} from 'react';
import {motion,useInView} from 'motion/react';
import {ArrowUpRight,Plus,Check} from 'lucide-react';
import {money,number,hasValue,posterTone,resultGroup,RESULTS,strongestMaterial,MATERIALS,costPerVote} from './model.js';

export default memo(function MuralPoster({candidate:c,position,rank,mode,selected,hasSelection,pinned,onPick,onCompare,maxExpense,maxVotes,materials,viewport,reduce,busy,grid}){
 const ref=useRef(null),visible=useInView(ref,{root:grid?undefined:viewport,margin:'80px',amount:0});
 const material=strongestMaterial(c.id,materials);
 const metric=mode==='materiais'?material?.valor:mode==='gastos'?c.gastos:mode==='custo_voto'?costPerVote(c):c.votos;
 const denominator=mode==='gastos'?maxExpense:maxVotes;
 const ratio=hasValue(metric)&&Number(denominator)>0?Math.min(100,Math.max(0,Number(metric)/Number(denominator)*100)):null;
 const amount=['gastos','custo_voto','materiais'].includes(mode)?money(metric):number(metric);
 const active=selected===c.id;
 return <motion.article ref={ref} layout={reduce||!visible?false:'position'} className={`mw-poster mw-tone-${posterTone(mode==='partido'?(c.partido||'Sem partido informado'):c.id)} ${active?'is-selected':''} ${pinned?'is-pinned':''}`} data-candidate-id={c.id}
  style={grid?{}:{left:position.x,top:position.y,zIndex:active?20:1}}
  initial={false} animate={{rotate:grid?0:active?0:position.rotation,scale:active&&!grid?1.035:1,opacity:hasSelection&&!active&&!pinned ? .7 : 1}}
  whileHover={reduce?undefined:{rotate:0,scale:active&&!grid?1.035:1.02,opacity:1,zIndex:21}}
  transition={{duration:reduce||!visible?0:.38,ease:[.22,.68,0,1]}}>
  <button type="button" className="mw-poster-open" aria-label={`Abrir cartaz de ${c.nome}`} aria-pressed={active} onClick={()=>onPick(c)}>
   <span className="mw-poster-registration"><span>{c.ano} / {c.uf}</span><span>{c.partido||'Sem partido'}</span></span>
   <span className="mw-poster-rank">{busy?'ATUALIZANDO A ORDEM':['votos','gastos','custo_voto'].includes(mode)?(hasValue(metric)?`${rank}º NO RECORTE${mode==='custo_voto'?' · GASTO/VOTO':''}`:'SEM VALOR PARA RANKING'):mode==='materiais'?(material?MATERIALS[material.grupo]:'SEM MATERIAL CARREGADO'):RESULTS[resultGroup(c.resultado)]}</span>
   <strong className="mw-poster-name" style={{fontSize:c.nome.length>35?23:c.nome.length>23?28:35}}>{c.nome}</strong>
   <span className="mw-poster-number">{c.numero??'—'}</span>
   <span className="mw-poster-place">{c.cargo} · {c.municipio||'Município não informado'}</span>
   <span className="mw-poster-score"><b>{amount}</b><small>{mode==='materiais'?'MATERIAL DO GRUPO · LANÇAMENTOS':mode==='gastos'?'DESPESAS DECLARADAS':mode==='custo_voto'?'GASTO POR VOTO · DESCRITIVO':'VOTOS OBTIDOS'}</small></span>
   {['gastos','votos'].includes(mode)&&<span className="mw-poster-ruler" aria-hidden="true"><i style={{width:ratio==null?'0%':`${ratio}%`}}/></span>}
   <span className="mw-poster-result">{RESULTS[resultGroup(c.resultado)]}</span>
   <span className="mw-poster-read">PUXAR O CARTAZ <ArrowUpRight size={15}/></span>
  </button>
  <button type="button" className="mw-poster-compare" aria-label={`${pinned?'Retirar':'Adicionar'} ${c.nome} ${pinned?'da':'à'} mesa de comparação`} aria-pressed={pinned} onClick={()=>onCompare(c)}>{pinned?<Check size={13}/>:<Plus size={13}/>} {pinned?'NA MESA':'COMPARAR'}</button>
 </motion.article>;
});
