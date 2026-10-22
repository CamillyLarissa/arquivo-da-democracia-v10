// Caixa de fichas tridimensional + busca paginada, preservando o design do portal.
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {motion,AnimatePresence} from 'motion/react';
import {Search,RotateCcw,FolderOpen,ArrowRight,ArrowLeft,X,SlidersHorizontal,Users,Layers3,ChevronsRight,MapPin,Flag,CalendarDays,Landmark} from 'lucide-react';
import Arquivo3D from '../components/Arquivo3D.jsx';
import ComparisonPanel from '../components/ComparisonPanel.jsx';
import {sampleCandidates} from '../data/candidatos-amostra.js';
import {states} from '../data/snapshot.js';
import {getCandidates} from '../data/client.js';
import {FACETS,PARTIES,YEARS,OFFICES,drawerOptions,optionsForFacet,matchesCandidate,compareIsEquivalent} from '../arquivo/filing.js';

const fmtMoney=n=>n==null?'Não informado':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const fmtNum=n=>n==null?'—':Number(n).toLocaleString('pt-BR');
const PAGE_SIZE=12;
const PASTA=['pasta-yellow','pasta-red','pasta-blue','pasta-green','pasta-coral'];
const FACET_ICONS={ano:CalendarDays,partido:Flag,cargo:Landmark,uf:MapPin};
const TITLES={ano:'Fichário cronológico',partido:'Fichário de partidos',cargo:'Fichário por cargo',uf:'Fichário territorial'};

export default function ArchivePart({mode,onResearch,onOpenCandidate,initialCandidate=null}){
  const [facet,setFacet]=useState('ano'),[facetPage,setFacetPage]=useState(0);
  const [year,setYear]=useState(String(initialCandidate?.ano||2024)),[uf,setUf]=useState(initialCandidate?.uf||''),[party,setParty]=useState(initialCandidate?.partido||''),[cargo,setCargo]=useState(initialCandidate?.cargo||''),[resultado,setResultado]=useState('');
  const [search,setSearch]=useState(initialCandidate?.nome||''),[page,setPage]=useState(0),[order,setOrder]=useState('votos');
  const [drawer,setDrawer]=useState('2024'),[focusIndex,setFocusIndex]=useState(-1),[phase,setPhase]=useState('pronta');
  const [rows,setRows]=useState([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(false),[err,setErr]=useState('');
  const [chosen,setChosen]=useState(null),[flip,setFlip]=useState(false),[compare,setCompare]=useState([]);
  const timers=useRef([]),lastAuto=useRef('');
  const clearTimeline=()=>{timers.current.forEach(clearTimeout);timers.current=[]};
  useEffect(()=>()=>clearTimeline(),[]);
  useEffect(()=>setPage(0),[year,uf,party,cargo,resultado,search,order]);
  useEffect(()=>{
    if(mode!=='live')return;
    let active=true;
    setLoading(true);setRows([]);setErr('');
    const timer=setTimeout(async()=>{
      try{
        const result=await getCandidates({ano:year,uf,partido:party,cargo,resultado,search,ordem:order,limit:PAGE_SIZE,offset:page*PAGE_SIZE});
        if(active){setRows(result.rows||[]);setTotal(result.total||0)}
      }catch{
        if(active){setRows([]);setTotal(0);setErr('Não foi possível consultar as fichas neste momento.')}
      }finally{if(active)setLoading(false)}
    },240);
    return()=>{active=false;clearTimeout(timer)};
  },[mode,year,uf,party,cargo,resultado,search,order,page]);
  const preview=useMemo(()=>{
    if(mode==='live')return rows;
    const all=sampleCandidates.filter(c=>matchesCandidate(c,{ano:year,uf,partido:party,cargo,resultado,search}));
    const sortValue=c=>order==='gastos'?(c.gastos??-1):order==='custo_voto'?(c.gastos!=null&&c.votos>0?c.gastos/c.votos:-1):(c.votos??-1);
    return all.sort((a,b)=>sortValue(b)-sortValue(a));
  },[mode,rows,year,uf,party,cargo,resultado,search,order]);
  const visible=mode==='live'?preview:preview.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  const count=mode==='live'?total:preview.length;
  const pages=Math.ceil(count/PAGE_SIZE);
  const drawerRecords=visible.filter(c=>String(c[facet]??'')===drawer);
  const fileCount=loading?0:drawerRecords.length;
  const selectedFile=drawerRecords.findIndex(c=>c.id===visible[focusIndex]?.id);
  const options=useMemo(()=>drawerOptions(facet,facetPage),[facet,facetPage]);
  const maxFacetPage=Math.max(0,Math.ceil(optionsForFacet(facet).length/6)-1);

  // Seleção do ano, sigla, cargo ou UF ocorre pelo mesmo gesto: abrir uma divisória.
  const chooseDrawer=(value)=>{
    clearTimeline();setPhase('abrindo');setFocusIndex(-1);setChosen(null);setFlip(false);
    setDrawer(drawer===value?'':value);
    if(facet==='ano')setYear(value);
    if(facet==='partido')setParty(value);
    if(facet==='cargo')setCargo(value);
    if(facet==='uf')setUf(value);
    timers.current.push(setTimeout(()=>setPhase('pronta'),900));
  };
  const changeFacet=(next)=>{
    clearTimeline();setFacet(next);setPhase('pronta');setFocusIndex(-1);setChosen(null);setFlip(false);
    const selected=next==='ano'?year:next==='partido'?party:next==='cargo'?cargo:uf;
    const location=optionsForFacet(next).indexOf(selected);
    setFacetPage(location<0?0:Math.floor(location/6));
    setDrawer(location<0?'':selected);
  };
  useEffect(()=>{
    if(phase==='localizando')return;
    const current=facet==='ano'?year:facet==='partido'?party:facet==='cargo'?cargo:uf;
    const view=drawerOptions(facet,facetPage);
    setDrawer(view.some(x=>x.id===current)?current:'');
  },[facet,facetPage,year,uf,party,cargo]);

  useEffect(()=>{
    clearTimeline();setChosen(null);setFocusIndex(-1);setFlip(false);setPhase('pronta');
    const current=facet==='ano'?year:facet==='partido'?party:facet==='cargo'?cargo:uf;
    const location=optionsForFacet(facet).indexOf(current);
    setFacetPage(location<0?0:Math.floor(location/6));
  },[year,uf,party,cargo,resultado,search,order,page]);

  const locate=useCallback((candidate,index)=>{
    if(!candidate)return;
    clearTimeline();setChosen(null);setFlip(false);setFocusIndex(index);setDrawer('');setPhase('localizando');
    if(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
      const value=facet==='ano'?String(candidate.ano):facet==='partido'?candidate.partido:facet==='cargo'?candidate.cargo:candidate.uf;
      const index=optionsForFacet(facet).indexOf(value);
      if(index>=0)setFacetPage(Math.floor(index/6));
      setDrawer(value||'');setChosen(candidate);setPhase('pronta');return;
    }
    // A câmera encontra a divisória, seleciona a ficha e ela emerge da caixa indexada.
    // Ir à divisória REAL do candidato, não à primeira divisória arbitrária.
    const target=facet==='ano'?String(candidate.ano):facet==='partido'?candidate.partido:facet==='cargo'?candidate.cargo:candidate.uf;
    const all=optionsForFacet(facet);
    const location=all.indexOf(target);
    if(location>=0 && Math.floor(location/6)!==facetPage)setFacetPage(Math.floor(location/6));
    const shelf=drawerOptions(facet,location>=0?Math.floor(location/6):facetPage);
    const destination=shelf.some(o=>o.id===target)?target:(shelf[0]?.id||'');
    timers.current.push(setTimeout(()=>{setDrawer(destination);setPhase('abrindo')},380));
    timers.current.push(setTimeout(()=>setPhase('extraindo'),1080));
    timers.current.push(setTimeout(()=>{setChosen(candidate);setPhase('pronta')},1900));
  },[facet,facetPage,year,uf,party,cargo]);
  // Pesquisa de texto aciona o percurso pelo arquivo após a digitação estabilizar.
  useEffect(()=>{
    if(loading||visible.length===0||search.trim().length<3)return;
    const signature=[search,year,uf,party,cargo,resultado,page,mode].join('|');
    if(lastAuto.current===signature)return;
    const linked=initialCandidate&&search===initialCandidate.nome;
    const target=linked?visible.find(c=>c.id===initialCandidate.id):visible[0];
    if(!target)return;
    const t=setTimeout(()=>{lastAuto.current=signature;locate(target,visible.indexOf(target))},550);
    return()=>clearTimeout(t);
  },[search,year,uf,party,cargo,resultado,page,mode,loading,visible,locate]);
  const addToDesk=c=>setCompare(old=>old.some(x=>x.id===c.id)?old:old.length>=3?old:[...old,c]);
  const phaseLabel={localizando:'LOCALIZANDO A PASTA',abrindo:'LOCALIZANDO A DIVISÓRIA',extraindo:'RETIRANDO A FICHA',pronta:'ARQUIVO PRONTO'}[phase];
  const reset=()=>{clearTimeline();setSearch('');setParty('');setCargo('');setResultado('');setUf('');setYear('2024');setPage(0);setFacet('ano');setFacetPage(0);setDrawer('2024');setChosen(null);setFlip(false);setPhase('pronta');setFocusIndex(-1);lastAuto.current=''};
  return <div className="archive-v6">
    <div className="section-header"><div><div className="eyebrow"><span className="eyebrow-dot"/>ACERVO · CANDIDATURAS E TRAJETÓRIAS</div><h2>O ARQUIVO <em>SE ABRE.</em></h2><p>Pesquise, encontre a pasta e abra o dossiê na própria cena 3D. Clique no santinho para virá-lo, compare candidaturas e descubra suas trajetórias.</p></div></div>
    <div className="archive-v6-theatre archive-v7-theatre">
      <section className="frame archive-v6-scene archive-v7-scene" aria-label="Fichário de candidaturas em três dimensões">
        <div className="frame-caption"><span>● FICHÁRIO ELEITORAL</span><span>ESCOLHA UMA DIVISÓRIA · RETIRE UMA FICHA · VIRE EM 3D</span></div>
        <div className="archive-v6-canvas archive-v7-canvas"><Arquivo3D drawers={options} activeDrawer={drawer} selectedFile={focusIndex}
           fileCount={Math.min(12,visible.length)} candidate={chosen} travelCandidate={visible[focusIndex]||null} flipped={flip} onFlip={()=>setFlip(v=>!v)} onClose={()=>{setChosen(null);setFlip(false);setFocusIndex(-1)}} onCompare={()=>chosen&&addToDesk(chosen)} onExpenses={()=>chosen&&onOpenCandidate(chosen)} onChoose={chooseDrawer} onPull={(_,i)=>{const c=visible[i];if(!loading&&c)locate(c,i)}} phase={phase}/>
          <div className="archive-v6-floating-title" aria-hidden="true">ARQUIVO<br/><strong>DA DEMOCRACIA</strong><small>PASTAS · CANDIDATURAS · MEMÓRIA</small></div>
          <div className="archive-v6-camera-note" aria-live="polite"><span className={'archive-v6-led '+(phase!=='pronta'?'in-motion':'')}/>{phaseLabel}</div>
          <div className="archive-v6-camera-hint">ARRASTE PARA OBSERVAR · TOQUE NAS DIVISÓRIAS E NAS FICHAS PARA EXPLORAR</div>
        </div>
        <div className="file-reality"><span className="dot-real"/>{mode==='live'?'Acervo pesquisável por ano, cargo, partido e UF.':'Amostra reduzida sem conexão. Com o acervo conectado, a busca alcança todas as candidaturas do recorte.'}</div>
      </section>
      <aside className="archive-v6-rail archive-v7-rail" aria-label="Organizar as divisórias">
        <header><span>CLASSIFICAÇÃO & BUSCA</span><strong>COMO QUER PROCURAR?</strong><small>Busque pelo nome, filtre por ano/partido e toque numa pasta: a ficha surge dentro do armário.</small></header>
        <div className="archive-v6-facets" role="group" aria-label="Categoria das divisórias">
          {FACETS.map(entry=>{const Icon=FACET_ICONS[entry.id];return <button type="button" key={entry.id} className={facet===entry.id?'active':''} aria-pressed={facet===entry.id} onClick={()=>changeFacet(entry.id)}><Icon size={17}/>{entry.label}</button>})}
        </div>
        <div className="archive-v6-rail-label">{TITLES[facet]}<small>{drawer?`DIVISÓRIA SELECIONADA · ${drawer}`:'ESCOLHA UMA DIVISÓRIA'}</small></div>
        <div className="archive-v6-tabs">{options.map(o=><button type="button" key={o.id} onClick={()=>chooseDrawer(o.id)} className={drawer===o.id?'active':''} aria-pressed={drawer===o.id} style={{'--tab-color':o.color}}><span className="tab-dot"/>{o.label}<ArrowRight size={15}/></button>)}</div>
        {maxFacetPage>0&&<div className="archive-v6-tab-pages"><button aria-label="Divisórias anteriores" disabled={!facetPage} onClick={()=>setFacetPage(x=>Math.max(0,x-1))}>←</button><span>{facetPage+1}/{maxFacetPage+1}</span><button aria-label="Próximas divisórias" disabled={facetPage>=maxFacetPage} onClick={()=>setFacetPage(x=>Math.min(maxFacetPage,x+1))}>→</button></div>}
        <section className="catalogue archive-v7-catalogue" aria-label="Busca e pastas de candidaturas">
                <div className="catalogue-head"><span>LOCALIZADOR DE FICHAS</span><strong>{fmtNum(count)} REGISTROS</strong></div>
                <form className="archive-v6-search" onSubmit={e=>{e.preventDefault();if(visible[0])locate(visible[0],0)}}>
                  <label><Search size={20}/><input aria-label="Procurar candidatura, município, sigla ou número" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, número, município ou sigla..."/></label>
                  <button type="submit" disabled={!visible.length||loading}><ChevronsRight size={17}/> LOCALIZAR E PUXAR</button>
                </form>
                <div className="catalogue-filters archive-v6-filters">
                  <select aria-label="Ano" value={year} onChange={e=>setYear(e.target.value)}>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select>
                  <select aria-label="Estado" value={uf} onChange={e=>setUf(e.target.value)}><option value="">Todos os estados</option>{states.map(s=><option key={s.uf} value={s.uf}>{s.uf}</option>)}</select>
                  <select aria-label="Partido" value={party} onChange={e=>setParty(e.target.value)}><option value="">Todos os partidos</option>{PARTIES.map(p=><option key={p} value={p}>{p}</option>)}</select>
                  <select aria-label="Cargo" value={cargo} onChange={e=>setCargo(e.target.value)}><option value="">Todos os cargos</option>{OFFICES.map(v=><option key={v} value={v}>{v}</option>)}</select>
                  <select aria-label="Resultado" value={resultado} onChange={e=>setResultado(e.target.value)}><option value="">Todos os resultados</option><option value="ELEITO">Eleitos</option><option value="NÃO ELEITO">Não eleitos</option><option value="SUPLENTE">Suplentes</option></select>
                  <select aria-label="Ordenar registros" value={order} onChange={e=>setOrder(e.target.value)}><option value="votos">Mais votos</option><option value="gastos">Maiores despesas</option><option value="custo_voto">Mais despesas por voto</option></select>
                </div>
                <div className="folder-hint"><SlidersHorizontal size={15}/> Clique numa pasta para ver a animação. Toque no nome para retirar e abrir uma ficha dentro da cena 3D.</div>
                {loading?<div className="catalogue-empty">Procurando no arquivo…</div>:err?<div className="catalogue-empty">{err}</div>:visible.length===0?<div className="catalogue-empty"><FolderOpen size={38}/><p>Não encontramos fichas nesse recorte{mode!=='live'?' da amostra local':''}. Tente outros filtros.</p></div>:<div className="archive-v6-folder-list">
                  {visible.map((c,i)=><motion.button type="button" key={c.id} whileHover={{x:5}} whileTap={{scale:.985}}
                    onClick={()=>locate(c,i)} className={`folder-tab ${PASTA[i%PASTA.length]} ${chosen?.id===c.id?'selected':''}`} aria-label={`Localizar e retirar ficha de ${c.nome}`}>
                    <span className="folder-ear">{c.partido||'—'}</span><span className="folder-name">{c.nome}</span><small>{c.municipio||c.uf} · {c.ano} · {c.cargo}</small><ArrowRight size={18}/>
                  </motion.button>)}
                </div>}
                <div className="catalogue-pagination"><button disabled={page===0} onClick={()=>setPage(x=>Math.max(0,x-1))}><ArrowLeft size={16}/> ANTERIOR</button><span>{pages?`${page+1} / ${pages}`:'SEM RESULTADOS'}</span><button disabled={page+1>=pages} onClick={()=>setPage(x=>x+1)}>PRÓXIMAS PASTAS <ArrowRight size={16}/></button></div>
              </section>
        <button className="archive-v6-restore" type="button" onClick={reset}><RotateCcw size={14}/> REORGANIZAR TUDO</button>
        <p>As cores das divisórias servem à navegação. Não representam ideologias nem partidos.</p>
      </aside>
    </div>
    <section className="comparison-desk"><div className="desk-caption"><span>MESA DE COMPARAÇÃO</span><span>{compare.length} / 3 FICHAS</span></div>
      <div className="desk-items">{[0,1,2].map(i=><div className={'desk-file '+(compare[i]?'filled':'')} key={i}>{compare[i]?<><button className="desk-remove" onClick={()=>setCompare(list=>list.filter(x=>x.id!==compare[i].id))} aria-label={`Remover ${compare[i].nome}`}><X size={14}/></button><small>{compare[i].partido} · {compare[i].ano}</small><strong>{compare[i].nome}</strong><span>VOTOS {fmtNum(compare[i].votos)}</span><span>GASTOS {fmtMoney(compare[i].gastos)}</span><span>PATRIMÔNIO {fmtMoney(compare[i].patrimonio)}</span></>:<span>+ COLOQUE A FICHA {i+1}</span>}</div>)}</div>
      <p>{compare.length>1&&!compareIsEquivalent(compare)?'⚠ Os candidatos selecionados disputaram cargos ou anos diferentes. Compare com cautela.':'Para comparar taxas ou custos, use candidaturas do mesmo cargo, ano e território. Ausência de valor não equivale a zero.'}</p>
      <ComparisonPanel topic="fichas" mode={mode} candidates={compare}/>
    </section>
    <ComparisonPanel topic="arquivo" mode={mode}/>
    <section className="archive-insight"><div><span className="insight-index">INVESTIGAÇÃO / PATRIMÔNIO E VITÓRIA</span><h3>O QUE EXISTE ATRÁS DO <em>SANTINHO?</em></h3><p>Entre candidaturas a vereador com patrimônio informado, a taxa de eleição foi maior nas faixas superiores de patrimônio. A comparação é descritiva, não demonstra causalidade.</p><button onClick={()=>onResearch(2)}>EXPLORAR A INVESTIGAÇÃO <ArrowRight size={16}/></button></div><div className="quartile-stamps">{[{n:'QUARTIL INFERIOR',v:'13,18%'},{n:'QUARTIL SUPERIOR',v:'27,68%'}].map(x=><div key={x.n}><small>{x.n}</small><strong>{x.v}</strong><span>Vereador · 2024 · patrimônio informado</span></div>)}</div></section>
  </div>;
}
