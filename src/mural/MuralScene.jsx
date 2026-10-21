import {useEffect,useMemo,useRef,useState} from 'react';
import {Minus,Plus,Move,RotateCcw,Grid2X2,Scan} from 'lucide-react';
import {useInView} from 'motion/react';
import MuralPoster from './MuralPoster.jsx';
import {wallLayout,number,posterTone} from './model.js';

export default function MuralScene({rows,mode,onPick,onCompare,selected,pinned,reduce,materials,summary,offset,busy}){
 const viewport=useRef(null),drag=useRef(null);
 const [width,setWidth]=useState(800),[zoom,setZoom]=useState(1),[grid,setGrid]=useState(false);
 const visible=useInView(viewport,{margin:'100px',amount:0});
 useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));observer.observe(viewport.current);return()=>observer.disconnect()},[]);
 const columns=width<520?1:width<750?2:3;
 const layout=useMemo(()=>wallLayout(rows,mode,columns,materials),[rows,mode,columns,materials]);
 const padding=Math.max(0,(width/zoom-layout.width)/2);
 useEffect(()=>{viewport.current?.scrollTo({top:0,left:0,behavior:'instant'})},[mode,rows.map(row=>row.id).sort().join(',')]);
 const reset=()=>{setZoom(1);viewport.current?.scrollTo({top:0,left:0,behavior:'instant'})};
 const down=event=>{
  if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('button,a,select,input')||grid)return;
  drag.current={x:event.clientX,y:event.clientY,left:viewport.current.scrollLeft,top:viewport.current.scrollTop};
  event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.classList.add('is-panning');
 };
 const move=event=>{if(drag.current){viewport.current.scrollLeft=drag.current.left+drag.current.x-event.clientX;viewport.current.scrollTop=drag.current.top+drag.current.y-event.clientY}};
 const up=event=>{drag.current=null;event.currentTarget.classList.remove('is-panning')};
 const key=event=>{
  if(event.target!==viewport.current||grid)return;
  const steps={ArrowDown:[0,100],ArrowUp:[0,-100],ArrowLeft:[-100,0],ArrowRight:[100,0],PageDown:[0,500],PageUp:[0,-500]};
  if(steps[event.key]){event.preventDefault();viewport.current.scrollBy({left:steps[event.key][0],top:steps[event.key][1],behavior:'instant'})}
 };
 const maxExpense=summary?.leaders?.find(row=>row.criterio==='gastos')?.gastos,maxVotes=summary?.leaders?.find(row=>row.criterio==='votos')?.votos;
 return <section className="mw-scene" aria-label="Mural interativo de candidaturas"><div className="mw-scene-tools"><span><Move size={16}/> EXPLORE O MURO</span><div role="group" aria-label="Visualização do mural"><button type="button" aria-pressed={!grid} onClick={()=>setGrid(false)}><Scan size={15}/> MURAL</button><button type="button" aria-pressed={grid} onClick={()=>setGrid(true)}><Grid2X2 size={15}/> GRADE</button></div><div className="mw-zoom-controls"><button type="button" aria-label="Diminuir zoom do mural" disabled={grid||zoom<=.75} onClick={()=>setZoom(value=>Math.max(.75,value-.1))}><Minus size={15}/></button><output aria-label="Zoom do mural">{Math.round(zoom*100)}%</output><button type="button" aria-label="Aumentar zoom do mural" disabled={grid||zoom>=1.3} onClick={()=>setZoom(value=>Math.min(1.3,value+.1))}><Plus size={15}/></button><button type="button" aria-label="Restaurar posição e zoom do mural" onClick={reset}><RotateCcw size={15}/></button></div></div>
 <p className="mw-scene-instruction">{grid?'Todos os cartazes desta página, em uma grade de leitura.':'Arraste o fundo, deslize no celular ou foque o mural e use as setas. Selecione um cartaz para trazê-lo à frente.'}</p>
 {mode==='partido'&&<div className="mw-party-legend" aria-label="Legenda editorial dos partidos desta página">{[...new Set(rows.map(row=>row.partido||'Sem partido informado'))].map(party=><span key={party} className={`mw-tone-${posterTone(party)}`}>{party}</span>)}<small>Paleta editorial, sem classificação ideológica. Cores podem se repetir; os nomes identificam cada grupo.</small></div>}
 <div ref={viewport} tabIndex={0} aria-label="Área de exploração do mural; use as setas para percorrer" className={`mw-viewport ${grid?'is-grid':''}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
  <div className="mw-stage-size" style={grid?{}:{width:Math.max(width,layout.width*zoom),height:layout.height*zoom}}>
   <div className={`mw-world ${grid?'mw-grid':''}`} inert={busy?true:undefined} style={grid?{}:{width:Math.max(layout.width,width/zoom),height:layout.height,transform:`scale(${zoom})`,transformOrigin:'top left'}}>
    {!grid&&layout.headings.map(group=><div key={group.key} className="mw-group-label" style={{top:group.y,left:26+padding}}><strong>{group.label}</strong><span>{group.count} nesta página</span></div>)}
    {rows.map((row,index)=>{const position=layout.cards.find(card=>card.id===row.id);return <MuralPoster key={row.id} candidate={row} position={{...position,x:position.x+padding}} rank={offset+index+1} mode={mode} selected={selected?.id} hasSelection={!!selected} pinned={pinned.some(c=>c.id===row.id)} onPick={onPick} onCompare={onCompare} maxExpense={maxExpense} maxVotes={maxVotes} materials={materials} viewport={viewport} reduce={reduce||!visible} busy={busy} grid={grid}/>})}
   </div>
  </div>
 </div><div className="mw-scene-note"><span>{number(rows.length)} CARTAZES CARREGADOS · CORES EDITORIAIS, SEM CLASSIFICAÇÃO POLÍTICA</span><span>{mode==='gastos'||mode==='votos'?'Régua: valor do cartaz ÷ maior valor informado no recorte. Sem alteração da área do papel.':mode==='materiais'?'Grupos identificados nas despesas carregadas; itens mistos não são rateados.':'Os agrupamentos mostram somente os cartazes desta página.'}</span></div>
 </section>;
}
