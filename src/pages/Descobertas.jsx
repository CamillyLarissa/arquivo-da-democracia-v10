import {useEffect,useMemo,useState} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {ArrowUpRight,ArrowRight,MapPin,Search,Trophy,BarChart3,BookOpen,RotateCcw} from 'lucide-react';
import {states} from '../data/snapshot.js';
import {discoveriesSnapshot} from '../data/descobertas.js';
import {getDescobertas} from '../data/client.js';
const num=n=>n==null?'—':Number(n).toLocaleString('pt-BR');
const money=n=>n==null?'—':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const VIEW=[{id:'votos',name:'Mais votos',detail:'Candidaturas em destaque'},{id:'abstencaoAlta',name:'Maior abstenção',detail:'Municípios acima de 10 mil eleitores'},{id:'abstencaoBaixa',name:'Menor abstenção',detail:'Municípios acima de 10 mil eleitores'},{id:'porEstado',name:'Por estado',detail:'Abstenção ponderada pelo eleitorado'}];
export default function Descobertas({mode,onGo=()=>{},compact=false}){
 const [ano,setAno]=useState(2024),[cargo,setCargo]=useState('VEREADOR'),[uf,setUf]=useState('');
 const [view,setView]=useState('votos'),[data,setData]=useState(discoveriesSnapshot),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const snapshotFilter=mode!=='live'&&(ano!==2024||cargo!=='VEREADOR'||uf!=='');
 useEffect(()=>{if(mode!=='live'){setData(discoveriesSnapshot);return}let mounted=true;setBusy(true);setError('');getDescobertas({ano,cargo,uf}).then(x=>{if(mounted)setData(x)}).catch(()=>{if(mounted){setError('Não foi possível atualizar a descoberta.');setData(discoveriesSnapshot)}}).finally(()=>{if(mounted)setBusy(false)});return()=>{mounted=false}},[mode,ano,cargo,uf]);
 const effective=(!snapshotFilter&&!error)||mode==='live'?data:null;
 const selected=VIEW.find(x=>x.id===view);
 const values=effective?(view==='votos'?(effective.leaders||[]):(effective[view]||[])):[];
 const isVotes=view==='votos';
 return <section className={'discoveries '+(compact?'discoveries-compact':'')}>
  <div className="discoveries-masthead"><div><span className="eyebrow">◉ BOLETIM DO ACERVO · RANKINGS REAIS</span><h2>ACHADOS QUE<br/><em>CHAMAM A ATENÇÃO.</em></h2><p>O primeiro colocado não explica tudo. Descubra os extremos, compare candidaturas equivalentes e veja o território por outra perspectiva.</p></div><div className="discoveries-postmark">NÚMEROS<br/>EM CARTAZ<br/><b>✦</b></div></div>
  <div className="discoveries-controls"><label>ELEIÇÃO<select value={ano} onChange={e=>setAno(Number(e.target.value))}>{[2024,2022,2020,2018].map(y=><option key={y} value={y}>{y}</option>)}</select></label><label>CARGO<select value={cargo} onChange={e=>setCargo(e.target.value)}>{['VEREADOR','PREFEITO','DEPUTADO ESTADUAL','DEPUTADO FEDERAL','SENADOR','GOVERNADOR'].map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>ESTADO<select value={uf} onChange={e=>setUf(e.target.value)}><option value="">6 estados</option>{states.map(s=><option value={s.uf} key={s.uf}>{s.nome}</option>)}</select></label><span className="discoveries-proof">{busy?'ATUALIZANDO…':mode==='live'&&!error?'DADOS CONSULTADOS':'CONSULTA ARQUIVADA'}</span></div>
  <div className="discoveries-switch">{VIEW.map(item=><button key={item.id} onClick={()=>setView(item.id)} className={view===item.id?'active':''}>{item.name} <ArrowUpRight size={13}/></button>)}</div>
  <div className="discoveries-sheet"><div className="discoveries-sheet-top"><span>RECORTE / {ano} · {cargo} {uf&&'· '+uf}</span><span>RANKING {isVotes?'CANDIDATURAS':'TERRITORIAL'}</span></div>
   {(!effective||error)?<div className="discoveries-empty"><Search size={30}/><p>{error||'Este filtro precisa da conexão ativa com o acervo. A prévia local apresenta 2024 / vereador / 6 UFs.'}</p><button onClick={()=>{setAno(2024);setCargo('VEREADOR');setUf('')}}>VER DADOS ARQUIVADOS</button></div>:
   <><div className="discoveries-one"><span>EM DESTAQUE / {selected.name.toUpperCase()}</span><AnimatePresence mode="wait"><motion.div key={view+ano+cargo+uf} initial={{opacity:0,y:17,rotate:-2}} animate={{opacity:1,y:0,rotate:0}} exit={{opacity:0,y:-16}}><strong>{values[0]?(isVotes?values[0].nome:view==='porEstado'?values[0].uf:values[0].nome):'NÃO HÁ REGISTROS'}</strong><b>{values[0]?(isVotes?num(values[0].votos)+' VOTOS':num(values[0].percentual)+'%'):''}</b><small>{isVotes?values[0]?.uf+' · '+(values[0]?.partido||'—'):(view==='porEstado'?'ABSTENÇÃO ESTADUAL PONDERADA': 'ABSTENÇÃO MUNICIPAL · ELEITORADO ≥ 10 MIL')}</small></motion.div></AnimatePresence></div>
    <div className="discoveries-ranked">{values.slice(0,compact?5:10).map((r,i)=><motion.div className={'discoveries-item '+(i===0?'first':'')} key={(r.id||r.nome||r.uf)+i} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:i*.035}}><span className="rank-number">{String(i+1).padStart(2,'0')}</span><span className="rank-name"><b>{isVotes?r.nome:view==='porEstado'?r.uf:r.nome}</b><small>{isVotes?`${r.partido||'—'} · ${r.uf} · ${money(r.gastos)} em gastos`:view==='porEstado'?`${num(r.municipios)} municípios`:r.uf+' · '+num(r.eleitorado)+' eleitores aptos'}</small></span><span className="rank-score">{isVotes?num(r.votos):num(r.percentual)+'%'}<small>{isVotes?'VOTOS':'ABSTENÇÃO'}</small></span></motion.div>)}</div></>}
   <p className="discoveries-method">{view==='votos'?'Candidaturas do mesmo cargo/ano, ordenadas por votos; pleitos suplementares excluídos.':'Abstenção territorial por ano; mínimo de 10 mil eleitores aptos no ranking municipal. O indicador por estado é ponderado pelo eleitorado.'} Dados de CE, MA, MS, RJ, RN e RS; não representa o Brasil inteiro.</p>
  </div>
  <div className="discoveries-foot"><p>Explore os resultados diretamente nas fichas de candidaturas, nos municípios ou nas investigações.</p><div><button onClick={()=>onGo('arquivo')}>PUXAR FICHAS <ArrowRight size={15}/></button><button onClick={()=>onGo('atlas')}>ABRIR O ATLAS <MapPin size={15}/></button>{!compact&&<button onClick={()=>onGo('investigacoes')}>ENTENDER AS ANÁLISES <BookOpen size={15}/></button>}</div></div>
 </section>;
}
