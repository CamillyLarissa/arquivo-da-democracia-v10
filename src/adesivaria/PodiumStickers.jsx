import {useState} from 'react';
import {motion} from 'motion/react';
import {candidateScope,money,num,ratio,known} from './model.js';

/** Preserve the original circular campaign stickers, including their reverse. */
export default function PodiumStickers({rows,onPick,material,maximum,animate}){
 const [turned,setTurned]=useState(null);
 return <div className="ar-podium-grid ar-sticker-podium">{rows.map((c,index)=>{const back=turned===c.id;return <motion.article key={c.id} className="candidate-sticker-entry ar-sticker-entry" initial={false} animate={{rotate:back?0:[-3,3,-2][index]}} transition={{duration:animate?0.3:0}}>
 <button type="button" className={`candidate-round-sticker ${back?'sticker-turned':''}`} aria-label={`Virar adesivo de ${c.nome}, ${c.posicao_gastos}º por gastos`} aria-pressed={back} onClick={()=>setTurned(back?null:c.id)}>
  <span className="candidate-sticker-front" aria-hidden={back}><small>{c.posicao_gastos}º POR GASTOS · {c.ano}</small><span className="candidate-sticker-silhouette" aria-hidden="true"><span/></span><strong>{c.nome}</strong><b>{c.numero??'—'}</b><em>{c.partido||'SIGLA NÃO INFORMADA'} · {c.uf}</em><i className="candidate-sticker-curl"/></span>
  <span className="candidate-sticker-back" aria-hidden={!back}><small>VERSO / {material.toUpperCase()}</small><strong>{c.nome}</strong><span>DESPESA CLASSIFICADA <b>{money(c.gastos_classificados)}</b></span><span>VOTOS · 1º TURNO <b>{num(c.votos)}</b></span><em>↻ VOLTAR</em></span>
 </button>
 <div className="ar-sticker-caption"><span className="ar-kicker">{c.posicao_gastos}º / {material.toUpperCase()}</span><h4>{c.nome}</h4><p>{candidateScope(c)}<br/>{c.partido||'Partido não informado'} · Nº {c.numero??'—'}</p><strong>{money(c.gastos_classificados)}</strong><span className="ar-sticker-value-label">EM LANÇAMENTOS CLASSIFICADOS</span><span className="ar-sticker-bar" aria-hidden="true"><i style={{width:ratio(c.gastos_classificados,maximum)+'%'}}/></span><small>{num(c.votos)}{known(c.votos)?' votos':''} · {c.posicao_votos?`${c.posicao_votos}º na votação`:'Votação sem posição'}</small></div>
 <button type="button" className="candidate-sticker-open" onClick={()=>onPick(c)} aria-label={`Abrir ficha de ${c.nome}`}>CONFERIR A CONTA ↗</button>
 </motion.article>})}<p className="candidate-sticker-note">Artes editoriais, não peças originais de campanha. A silhueta é um ícone neutro, não um retrato. As cores não indicam posicionamento ideológico.</p></div>;
}
