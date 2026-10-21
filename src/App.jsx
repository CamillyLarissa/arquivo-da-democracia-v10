import {useEffect,useMemo,useRef,useState} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import gsap from 'gsap';
import {
  Archive,ArrowRight,ArrowLeft,ArrowUpRight,BookOpen,Clapperboard,Coins,
  Database,FileText,Flag,FolderOpen,Globe2,Landmark,MapPin,Menu,Newspaper,
  Play,RotateCcw,Search,SlidersHorizontal,SquareArrowOutUpRight,Ticket,
  Tv2,Users,Wallet,X,CheckCircle2,AlertTriangle
} from 'lucide-react';
import {
  BarChart,Bar,LineChart,Line,CartesianGrid,XAxis,YAxis,Tooltip,
  ResponsiveContainer,PieChart,Pie,Cell,Legend,ReferenceLine
} from 'recharts';
import GeoAtlas from './components/GeoAtlas.jsx';
import {indicatorSettings as atlasIndicators,MAP_COLORS} from './atlas/geography.js';
import Plenario3D,{plenarioAssentos} from './components/Plenario3D.jsx';
import Televisao3D from './components/Televisao3D.jsx';
import ComparisonPanel from './components/ComparisonPanel.jsx';
import ArchivePart from './pages/ArchivePart.jsx';
import Descobertas from './pages/Descobertas.jsx';
import Adesivaria from './pages/Adesivaria.jsx';
import MuralCampanhas from './pages/MuralCampanhas.jsx';
import PrestacaoDeContas from './pages/PrestacaoDeContas.jsx';
import {blockSeats} from './components/data.js';
import {analyses,states,overview,stamp} from './data/snapshot.js';
import {getHealth,getOverview,getAnalysis,getMunicipios} from './data/client.js';
import {municipiosAmostra} from './data/municipios-amostra.js';

const COLORS=['#173e78','#d24c39','#e7b83d','#21765e','#68718a','#bb7847'];
const fNum=(n)=>n==null?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const money=(n)=>n==null?'—':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const pageNames={inicio:'Início',arquivo:'Arquivo',atlas:'Atlas',partidos:'Partidos',campanhas:'Campanhas',adesivos:'Adesivaria',plenario:'Plenário',descobertas:'Descobertas',investigacoes:'Investigações'};
const navItems=[['inicio',Globe2],['arquivo',FolderOpen],['atlas',MapPin],['partidos',Flag],['campanhas',Wallet],['adesivos',Ticket],['plenario',Landmark],['descobertas',Search],['investigacoes',BookOpen]];

function Eyebrow({children}){return <div className="eyebrow"><span className="eyebrow-dot"/>{children}</div>}
function Frame({children,className='',label='',right=''}){return <div className={'frame '+className}><div className="frame-caption"><span>● {label}</span><span>{right||'ARQUIVO DA DEMOCRACIA · 2026'}</span></div>{children}</div>}
function Stamp({children,tone='red'}){return <span className={'stamp stamp-'+tone}>{children}</span>}
function Status({mode}){return <span className={'status status-'+(mode==='live'?'live':'snap')}><span/>{mode==='live'?'ACERVO ATUALIZADO':'ACERVO CONSULTÁVEL'}</span>}
function SectionHero({kicker,title,detail,children}){return <div className="section-header"><div><Eyebrow>{kicker}</Eyebrow><h2>{title}</h2><p>{detail}</p></div>{children}</div>}
function Intro({onGo,mode}){
 const [channel,setChannel]=useState(0);
 const channels=[{name:'Os municípios do acervo',value:'1.236',detail:'6 UFs · cobertura parcial',to: 'atlas'},
 {name:'Pessoas registradas',value:'382.866',detail:'Candidaturas e trajetórias',to:'arquivo'},
 {name:'Permanência partidária',value:'36,57%',detail:'2020 → 2024 · vereador',to:'investigacoes'},
 {name:'Despesas da disputa',value:'R$ 4,37 bi',detail:'Lançamentos disponíveis',to:'campanhas'}];
 const next=()=>setChannel(c=>(c+1)%channels.length);
 return <div className="home-grid"><div className="home-poster">
   <Eyebrow>EDIÇÃO 01 · ELEIÇÕES BRASILEIRAS</Eyebrow>
   <div className="hero-float-tag">UM PAÍS<br/>MUITOS VOTOS</div>
   <h1>ARQUIVO <small>DA</small><br/><em>DEMOCRACIA</em></h1>
   <p className="home-lead">Por trás de cada santinho há um nome. Por trás de cada voto, uma história. Explore os números de um Brasil em disputa.</p>
   <div className="home-brush">OS DADOS SAEM DO PAPEL.</div>
   <div className="home-actions"><button className="btn-red" onClick={()=>onGo('atlas')}>ABRIR O ATLAS <ArrowRight size={18}/></button><button className="btn-outline" onClick={()=>onGo('arquivo')}>PUXAR UMA FICHA <FolderOpen size={17}/></button></div>
   <div className="crowd-motif" aria-hidden="true">{Array.from({length:36},(_,i)=><span key={i} style={{height:20+(i*31)%70}}/>)}</div>
   <p className="hero-micro">ACERVO INDEPENDENTE • DADOS AUDITADOS • DESIGN EDITORIAL</p>
 </div><div className="tv-column"><div className="tv-head"><span>◉ TRANSMISSÃO EXPERIMENTAL</span><Status mode={mode}/></div>
   <div className="tv-canvas"><Televisao3D channel={channels[channel]} onNext={next}/></div>
   <div className="channel-info"><div><span className="micro">CANAL {String(channel+1).padStart(2,'0')} / 04</span><h3>{channels[channel].name}</h3><p>{channels[channel].detail}</p></div><button onClick={next} className="channel-next" aria-label="Trocar canal"><RotateCcw size={19}/></button></div>
   <button className="tv-action" onClick={()=>onGo(channels[channel].to)}>INVESTIGAR ESTA TRANSMISSÃO <ArrowUpRight size={17}/></button>
 </div></div>;
}
function Home({onGo,mode,data}){
 const first=[['arquivo','ARQUIVO DE CANDIDATURAS','Puxe as fichas e compare perfis',FolderOpen],['atlas','ATLAS TERRITORIAL','Abra o mapa por estado e município',MapPin],['campanhas','CONTAS DE CAMPANHA','Abra envelopes e gastos eleitorais',Coins],['plenario','A SALA DO PODER','Entre no plenário 3D',Landmark]];
 return <><Intro onGo={onGo} mode={mode}/><div className="home-stats">
 {[[fNum(data.coverage),'MUNICÍPIOS'],[String(data.states),'UNIDADES FEDERATIVAS'],[fNum(data.applications),'CANDIDATURAS'],[fNum(data.people),'PESSOAS']].map(([v,t])=><div key={t}><strong>{v}</strong><span>{t}</span></div>)}
 </div><div className="notice-strip"><AlertTriangle size={17}/><p><strong>RECORTE REAL, NÃO NACIONAL:</strong> a base cobre municípios de RS, MA, CE, RN, RJ e MS. Os demais estados não estão representados neste levantamento.</p></div>
 <div className="home-chapters"><div className="chapter-intro"><Eyebrow>EXPLORE OS AMBIENTES</Eyebrow><h2>CADA DADO<br/><em>GUARDA UMA HISTÓRIA.</em></h2></div>{first.map(([id,t,desc,Icon],i)=><button className={'chapter chapter-'+i} key={id} onClick={()=>onGo(id)}><span className="chapter-index">0{i+1} / ACERVO</span><Icon size={35} strokeWidth={1.5}/><strong>{t}</strong><span>{desc}</span><ArrowUpRight className="chapter-arrow" size={22}/></button>)}</div>
 <Descobertas mode={mode} onGo={onGo} compact/><div className="home-investigate"><div><Eyebrow>LABORATÓRIO / PERGUNTAS & EVIDÊNCIAS</Eyebrow><h2>AS PERGUNTAS<br/><em>POR TRÁS DOS NÚMEROS.</em></h2><p>Dez investigações relacionadas aos temas do acervo, sem transformar o site em uma lista de exercícios.</p><button className="btn-red" onClick={()=>onGo('investigacoes')}>VER AS INVESTIGAÇÕES <ArrowRight size={16}/></button></div><div className="poster-collage"><div>QUANTO<br/>CUSTA UMA<br/><b>CADEIRA?</b></div><div>O VOTO<br/>É NA SIGLA?</div><div>QUEM<br/>FINANCIA?</div></div></div></>;
}

function Atlas({mode,onResearch}){
 const [uf,setUf]=useState(''),[text,setText]=useState(''),[municipios,setMunicipios]=useState([]),[loading,setLoading]=useState(false);
 const [indicator,setIndicator]=useState('abstencao_2024'),[order,setOrder]=useState('desc'),[selected,setSelected]=useState(null);
 useEffect(()=>{if(mode!=='live')return;let active=true;setLoading(true);setMunicipios([]);const t=setTimeout(async()=>{try{const rows=await getMunicipios({search:text,uf,limit:1500});if(active)setMunicipios(rows)}catch{if(active)setMunicipios([])}finally{if(active)setLoading(false)}},250);return()=>{active=false;clearTimeout(t)}},[mode,uf,text]);
 const filtered=useMemo(()=>{const data=mode==='live'?municipios:municipiosAmostra.filter(m=>(!uf||m.uf===uf)&&(!text||m.nome.toLowerCase().includes(text.toLowerCase())));return [...data].sort((a,b)=>{const x=a[indicator],y=b[indicator];if(x==null)return 1;if(y==null)return -1;return (Number(x)-Number(y))*(order==='asc'?1:-1)})},[mode,municipios,uf,text,indicator,order]);
 const fmt=(m)=>m?.[indicator]==null?'Sem registro':indicator==='idhm'?Number(m[indicator]).toFixed(3):indicator==='abstencao_2024'?fNum(m[indicator])+'%':indicator==='pib_per_capita'?money(m[indicator]):fNum(m[indicator]);
 return <><SectionHero kicker="AMBIENTE 02 / TERRITÓRIO" title={<>DESDOBRE O <em>ATLAS.</em></>} detail="Filtre por estado e município. Compare abstenção, desenvolvimento, população e PIB por habitante com os dados disponíveis no acervo."/>
 <div className="atlas-indicator-strip"><span>COLORIR O MAPA POR</span>{Object.entries(atlasIndicators).map(([key,v])=><button key={key} className={indicator===key?'active':''} aria-pressed={indicator===key} onClick={()=>{setIndicator(key);setSelected(null)}}>{v.label}</button>)}</div>
 <div className="atlas-layout"><Frame label="ATLAS MUNICIPAL · INDICADORES" right="SEIS UNIDADES FEDERATIVAS"><div className="atlas-filter"><button className={!uf?'active':''} aria-pressed={!uf} onClick={()=>{setUf('');setSelected(null)}}>TODOS</button>{states.map(s=><button className={uf===s.uf?'active':''} aria-pressed={uf===s.uf} key={s.uf} onClick={()=>{setUf(s.uf);setSelected(null)}}>{s.uf}</button>)}</div><GeoAtlas uf={uf} onUf={value=>{setUf(value);setSelected(null)}} onSelect={setSelected} municipios={filtered} indicator={indicator} selected={selected}/>{uf&&<div className="atlas-legend"><span>VALORES MENORES</span>{MAP_COLORS.map(c=><i key={c} style={{background:c}}/>)}<span>MAIORES</span><small>Áreas cinzas: sem dados neste recorte.</small></div>}</Frame>
 <Frame label="FICHÁRIO TERRITORIAL" right="COMPARE MUNICÍPIOS"><div className="municipality-panel"><div className="input-search"><Search size={18}/><input aria-label="Buscar município" placeholder="Nome de município..." value={text} onChange={e=>{setText(e.target.value);setSelected(null)}}/></div><div className="atlas-sort"><strong>{filtered.length} MUNICÍPIOS EXIBIDOS</strong><select aria-label="Ordenar indicadores" value={order} onChange={e=>setOrder(e.target.value)}><option value="desc">Maiores valores</option><option value="asc">Menores valores</option></select></div>
 {selected&&<div className="atlas-selected"><span>FICHA SELECIONADA</span><h3>{selected.nome} · {selected.uf}</h3><div><b>{atlasIndicators[indicator].label}</b><strong>{fmt(selected)}</strong></div><p>População: {fNum(selected.populacao)} · Abstenção 2024: {selected.abstencao_2024==null?'—':fNum(selected.abstencao_2024)+'%'}</p></div>}
 {loading?<p className="data-unavailable">Abrindo fichas do território…</p>:<div className="municipio-list atlas-scroll-list">{filtered.slice(0,120).map(m=><button className={selected?.id===m.id?'active':''} key={m.id} onClick={()=>{setSelected(m);setUf(m.uf)}}><span><strong>{m.nome}</strong><small>{m.uf}</small></span><b>{fmt(m)}</b></button>)}{!filtered.length&&<p>Nenhum município encontrado no recorte atual.</p>}</div>}
 <p className="atlas-count-note">{mode==='live'?'Consulta detalhada da cobertura disponível.':'Amostra documentada de 18 municípios para exploração imediata.'} O atlas não representa resultados de todo o país.</p></div></Frame></div>
 <div className="atlas-investigate"><div><strong>O QUE O TERRITÓRIO EXPLICA?</strong><p>Em 2022, a associação IDHM × abstenção foi negativa no conjunto analisado; em 2024, mudou de sinal. A composição estadual e os anos precisam ser analisados separadamente.</p></div><button onClick={()=>onResearch(3)}>DESDOBRAR ESTA INVESTIGAÇÃO <ArrowUpRight size={15}/></button><button onClick={()=>onResearch(7)}>VER A MUDANÇA NOS PARTIDOS <ArrowUpRight size={15}/></button></div>
 <ComparisonPanel topic="atlas" mode={mode} municipios={filtered}/>
 <p className="editorial-note">* IDHM do acervo tem valores referentes a 2010, mesmo quando consta numa linha de referência 2022. População/PIB e participação eleitoral podem ter anos de referência distintos; confira a metodologia na seção Investigações.</p></>;
}
function Plenario({onResearch,mode}){
 const [focus,setFocus]=useState('todos'),[seat,setSeat]=useState(null),[replay,setReplay]=useState(0),[recorte,setRecorte]=useState(5);
 const options=[{name:'Deputados estaduais · 2018',value:777964.76},{name:'Deputados estaduais · 2022',value:1448803.47},{name:'Deputados federais · 2018',value:2294220.62},{name:'Deputados federais · 2022',value:5458150.64},{name:'Vereadores · 2020',value:21755.19},{name:'Vereadores · 2024',value:51493.01}];
 return <><SectionHero kicker="AMBIENTE 05 / REPRESENTAÇÃO" title={<>O PODER TEM <em>CADEIRAS.</em></>} detail="Explore a tribuna, a mesa diretora e o plenário tridimensional. As cores distinguem grupos cenográficos; o viés ideológico ainda não foi calculado. Use os recortes de gastos para investigar a representação."/>
 <div className="plenary-layout"><Frame label="PLENÁRIO INTERATIVO / CENOGRAFIA" right="GIRE · APROXIME · SELECIONE"><div className="plenary-canvas"><Plenario3D focus={focus} selectedSeat={seat} onPick={setSeat} replay={replay}/></div>
 <div className="plenary-controls">{blockSeats.map(b=><button key={b.id} className={focus===b.id?'chosen':''} onClick={()=>setFocus(focus===b.id?'todos':b.id)}><span style={{background:b.color}}/> {b.name}: {b.count}</button>)}<button onClick={()=>{setReplay(n=>n+1);setSeat(null)}}><RotateCcw size={15}/> REVER CENA</button></div></Frame>
 <div className="plenary-aside"><Stamp>UMA MAQUETE PARA EXPLORAR</Stamp><h3>{seat?`CADEIRA ${String(seat.number).padStart(2,'0')}`:'A CASA EM MOVIMENTO.'}</h3><p>{seat?`Fileira ${seat.row} · ${seat.name}. A cadeira destaca uma posição cenográfica, não uma pessoa eleita.`:'As cadeiras ajudam a visualizar representação. Selecione um recorte abaixo para ler os gastos agregados correspondentes.'}</p>
 <label className="micro">FOCO EM UMA CADEIRA<select value={seat?.number??''} onChange={e=>setSeat(plenarioAssentos.find(s=>s.number===Number(e.target.value))||null)}><option value="">SELECIONE UMA CADEIRA</option>{plenarioAssentos.map(s=><option key={s.number} value={s.number}>ASSENTO {s.number} — {s.name}</option>)}</select></label>
 <label className="micro">COMPARE A REPRESENTAÇÃO<select value={recorte} onChange={e=>setRecorte(Number(e.target.value))}>{options.map((x,i)=><option key={i} value={i}>{x.name}</option>)}</select></label>
 <motion.div key={recorte} className="plenary-big-number" initial={{scale:.9,opacity:.5}} animate={{scale:1,opacity:1}}><span>DESPESA AGREGADA POR ELEITO</span><strong>{money(options[recorte].value)}</strong><small>{options[recorte].name.toUpperCase()} · 6 UFs</small></motion.div>
 <p className="plenary-method">Este indicador divide as despesas declaradas por todas as candidaturas do cargo pelo número de eleitos. Não é o preço de um mandato nem uma relação causal.</p>
 <button className="btn-red" onClick={()=>onResearch(1)}>ENTENDER COMO O CÁLCULO É FEITO <ArrowRight size={16}/></button>
 <div className="plenary-links"><button onClick={()=>onResearch(2)}>PATRIMÔNIO E ELEIÇÃO ↗</button><button onClick={()=>onResearch(9)}>PROPAGANDA E DESPESAS ↗</button></div><p className="micro disclaimer">As 72 cadeiras e suas cores são ilustrativas, não a composição partidária real nem uma classificação ideológica. Os indicadores monetários se referem apenas à base disponível.</p></div></div><ComparisonPanel topic="plenario" mode={mode}/> </>;
}

function getChartData(meta,live){
 if(!live?.rows?.length)return meta.data;
 const rows=live.rows;
 if(meta.id===1)return rows.map(r=>({label:`${r.cargo==='VEREADOR'?'Ver.':r.cargo==='DEPUTADO FEDERAL'?'Dep. fed.':'Dep. est.'} ${r.ano}`,value:r.valor}));
 if(meta.id===2){const y=rows.filter(r=>r.cargo==='VEREADOR'&&(r.ano===2020||r.ano===2024));return [1,2,3,4].map(q=>({label:q===1?'25% menores':q===4?'25% maiores':`${q}º quartil`,y2020:y.find(x=>x.ano===2020&&x.quartil===q)?.taxa??null,y2024:y.find(x=>x.ano===2024&&x.quartil===q)?.taxa??null}));}
 if(meta.id===3)return rows.filter(r=>r.ano===2024).map(r=>({label:r.uf,value:r.r_idhm})); // correlações por UF, jamais média de coeficientes
 if(meta.id===4)return rows.filter(r=>r.ano===2024&&r.cargo==='VEREADOR').sort((a,b)=>b.candidaturas-a.candidaturas).slice(0,7).map(r=>({label:r.escolaridade,value:r.candidaturas}));
 if(meta.id===5)return [2018,2020,2022,2024].map(y=>({label:String(y),federal:rows.find(r=>r.ano===y&&r.cargo==='DEPUTADO FEDERAL')?.pct_legenda??null,estadual:rows.find(r=>r.ano===y&&r.cargo==='DEPUTADO ESTADUAL')?.pct_legenda??null,vereador:rows.find(r=>r.ano===y&&r.cargo==='VEREADOR')?.pct_legenda??null}));
 if(meta.id===6)return rows.map(r=>({label:`${r.cargo==='VEREADOR'?'Ver.':'Dep. est.'} ${r.ano}`,value:r.pct_jovens}));
 if(meta.id===7)return [{label:'Mesmo partido',value:rows[0].estaveis},{label:'Líder diferente',value:rows[0].municipios-rows[0].estaveis}];
 if(meta.id===9)return rows.slice(0,9).map(r=>({label:r.categoria,value:r.total}));
 if(meta.id===10)return [{label:'Mais de um ano',value:rows[0].multi_anos},{label:'Três ou mais anos',value:rows[0].tres_anos},{label:'Mais de um partido',value:rows[0].multi_partidos},{label:'Duas ou mais vitórias',value:rows[0].multi_vitorias}];
 return meta.data;
}
const AxisTick=(props)=><text x={props.x} y={props.y+9} textAnchor="end" transform={`rotate(-23 ${props.x} ${props.y})`} fontSize="10" fill="#334155">{String(props.payload.value).slice(0,22)}</text>;
function AnalysisChart({meta,live}){
 const data=getChartData(meta,live);
 if(meta.type==='missing')return <div className="not-available"><AlertTriangle size={36}/><h3>AINDA NÃO HÁ DADOS DE RECEITAS.</h3><p>É preciso integrar ao banco a origem pública e privada dos recursos de campanha. A tabela de despesas não responde à pergunta.</p></div>;
 const percent=[2,5,6].includes(meta.id);
 return <div className="chart-stage" role="img" aria-label={meta.measure}><div className="graph-title"><span>{meta.id===3&&live?.rows?.length?'Correlação IDHM × abstenção por UF (2024)':meta.measure}</span><span>SEIS ESTADOS · ACERVO PARCIAL</span></div>
 <ResponsiveContainer width="100%" height={330}>
 {meta.type==='donut'?<PieChart><Tooltip formatter={v=>fNum(v)+' municípios'}/><Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={68} outerRadius={112} label={({name,percent})=>`${name}: ${(percent*100).toFixed(1)}%`}>{data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Legend/></PieChart>:
 meta.type==='lines'?<LineChart data={data} margin={{top:25,right:25,left:0,bottom:68}}><CartesianGrid strokeDasharray="4 5" stroke="#dfd5bf"/><XAxis dataKey="label" tick={AxisTick} interval={0} height={76}/><YAxis/><Tooltip formatter={v=>v==null?'—':fNum(v)+'%'}/><Line type="monotone" dataKey={meta.id===2?'y2020':'federal'} name={meta.id===2?'2020':'Deputado federal'} connectNulls stroke="#173e78" strokeWidth={3}/><Line type="monotone" dataKey={meta.id===2?'y2024':'estadual'} name={meta.id===2?'2024':'Deputado estadual'} connectNulls stroke="#d24c39" strokeWidth={3}/>{meta.id===5&&<Line type="monotone" dataKey="vereador" name="Vereador" connectNulls stroke="#21765e" strokeWidth={3}/>}<Legend verticalAlign="top"/></LineChart>:
 <BarChart data={data} margin={{top:25,right:22,left:3,bottom:88}}><CartesianGrid strokeDasharray="4 5" stroke="#e6ddcb"/><XAxis dataKey="label" tick={AxisTick} interval={0} height={88}/><YAxis tickFormatter={v=>meta.id===3?v.toFixed(1):v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(0)+'k':String(v)} width={48}/><Tooltip formatter={v=>meta.id===1||meta.id===9?money(v):percent?fNum(v)+'%':fNum(v)}/>{meta.id===3&&<ReferenceLine y={0} stroke="#263345"/>}<Bar dataKey="value" radius={[4,4,0,0]} maxBarSize={65}>{data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>}
 </ResponsiveContainer><p className="chart-foot">{live?.rows?.length?'Consulta aos dados eleitorais disponíveis.':'Snapshot real da auditoria de 21/10/2026 (não atualizado em tempo real).'}</p></div>;
}
function Investigacoes({defaultId=1,mode,onGo}){
 const [id,setId]=useState(defaultId),[live,setLive]=useState(null),[busy,setBusy]=useState(false),[viewTable,setViewTable]=useState(false),[theme,setTheme]=useState('todos');
 useEffect(()=>setId(defaultId),[defaultId]);
 useEffect(()=>{let active=true;setLive(null);if(mode==='live'){setBusy(true);getAnalysis(id).then(v=>{if(active)setLive(v)}).finally(()=>{if(active)setBusy(false)})}return()=>{active=false}},[id,mode]);
 const data=analyses.find(q=>q.id===id)??analyses[0];const chartData=getChartData(data,live);
 const themes=[...new Set(analyses.map(x=>x.theme))];
 return <><SectionHero kicker="LABORATÓRIO EDITORIAL / 10 INVESTIGAÇÕES" title={<>OS DADOS TÊM <em>PERGUNTAS.</em></>} detail="As questões da pesquisa aparecem aqui como investigações editoriais conectadas entre si — o restante do portal é livre para exploração."/>
 <div className="research-filters"><button onClick={()=>setTheme('todos')} className={theme==='todos'?'active':''}>TODOS</button>{themes.map(t=><button key={t} className={theme===t?'active':''} onClick={()=>setTheme(t)}>{t}</button>)}</div>
 <div className="investigations-layout"><div className="question-stack">{analyses.filter(a=>theme==='todos'||a.theme===theme).map(x=><button className={id===x.id?'active':''} key={x.id} onClick={()=>{setId(x.id);setViewTable(false)}}><span>#{String(x.id).padStart(2,'0')}</span><strong>{x.title}</strong><small>{x.theme}</small></button>)}</div>
 <Frame label={'DOSSIÊ '+String(id).padStart(2,'0')+' / DADOS REAIS'} right={busy?'CONSULTANDO…':data.status.toUpperCase()}><div className="investigation-document"><div className="investigation-title"><Eyebrow>{data.theme} · {data.years}</Eyebrow><h3>{data.title}</h3><p>{data.subtitle}</p></div><div className="analysis-status"><span className={'status-label status-'+data.status}>{data.status==='verificado'?'● CONSULTA REAL':data.status==='parcial'?'◐ ANÁLISE PARCIAL':'○ FONTE NECESSÁRIA'}</span><button className="table-toggle" onClick={()=>setViewTable(v=>!v)}>{viewTable?'VER GRÁFICO':'VER TABELA DE DADOS'}</button></div>
 {viewTable?<div className="table-overflow"><table className="data-table"><thead><tr><th>Indicador / categoria</th>{[...new Set(chartData.flatMap(d=>Object.keys(d).filter(k=>k!=='label')))].map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{chartData.map((r,i)=><tr key={i}><td>{r.label}</td>{[...new Set(chartData.flatMap(d=>Object.keys(d).filter(k=>k!=='label')))].map(k=><td key={k}>{r[k]==null?'—':fNum(r[k])}</td>)}</tr>)}</tbody></table></div>:<AnalysisChart meta={data} live={live}/>}<div className="document-method"><strong>COMO LER ESTE RESULTADO</strong><p>{data.note}</p><span>ORIGEM DOS DADOS: {data.id===3||data.id===6?'TSE e IBGE':'Tribunal Superior Eleitoral'} · Veja os critérios acima.</span></div><div className="relational"><strong>CRUZE COM OUTRAS INVESTIGAÇÕES</strong><div>{data.related.map(n=><button key={n} onClick={()=>{setId(n);setTheme('todos');setViewTable(false)}}>Q{String(n).padStart(2,'0')} <ArrowUpRight size={13}/></button>)}</div></div></div></Frame></div>
 <ComparisonPanel topic="investigacoes" key={id} defaultKind={({1:'cadeiras',2:'patrimonio',3:'abstencao',4:'escolaridade',5:'legenda',9:'propaganda'})[id]||'legenda'} mode={mode}/>
 </>;
}
function Footer(){return <footer><div><strong>ARQUIVO DA DEMOCRACIA</strong><span>ACERVO INDEPENDENTE · SEM VÍNCULO COM A JUSTIÇA ELEITORAL</span></div><p>Dados eleitorais de 6 UFs, consulta atualizada ou amostra arquivada. Gráficos, filtros e definições devem ser acompanhados de documentação metodológica. Imagens e interfaces são interpretações autorais; nunca simulam canais oficiais.</p></footer>}
export default function App(){
 const [page,setPage]=useState('inicio'),[mode,setMode]=useState('snapshot'),[counts,setCounts]=useState(overview),[investigation,setInvestigation]=useState(1),[mobileMenu,setMobileMenu]=useState(false),[campaignCandidate,setCampaignCandidate]=useState(null);
 const mainRef=useRef();
 useEffect(()=>{getHealth().then(h=>{if(h.connected)setMode('live')});getOverview().then(o=>setCounts(o));},[]);
 useEffect(()=>{if(mainRef.current){gsap.fromTo(mainRef.current,{opacity:.4,y:15},{opacity:1,y:0,duration:.55,ease:'power2.out'})}window.scrollTo({top:0,behavior:'instant'});},[page]);
 const go=(id)=>{setPage(id);setMobileMenu(false)};
 const goResearch=(n)=>{setInvestigation(n);go('investigacoes')};
 const openCampaign=(candidate)=>{setCampaignCandidate(candidate);go('campanhas')};
 return <div className="site"><header className="site-header"><button className="brand" onClick={()=>go('inicio')} aria-label="Arquivo da Democracia, início"><div className="brand-icon"><Archive size={25}/></div><div><strong>ARQUIVO <em>DA</em> DEMOCRACIA</strong><small>ATLAS · CAMPANHAS · REPRESENTAÇÃO</small></div></button><nav className={mobileMenu?'mobile-open':''} aria-label="Navegação principal">{navItems.map(([id,Icon])=><button key={id} onClick={()=>go(id)} className={id===page?'active':''}><Icon size={15}/>{pageNames[id]}</button>)}</nav><button className="menu-toggle" onClick={()=>setMobileMenu(v=>!v)} aria-label="Abrir menu"><Menu size={21}/></button></header>
 <div className="utility-ribbon"><span>◈ OBSERVATÓRIO ELEITORAL BRASILEIRO</span><span>RECORTE: RS · MA · CE · RN · RJ · MS</span><span><Status mode={mode}/></span></div>
 <main ref={mainRef} className="content-shell">{page==='inicio'&&<Home onGo={go} mode={mode} data={counts}/>} {page==='arquivo'&&<ArchivePart mode={mode} onResearch={goResearch} onOpenCandidate={openCampaign}/>} {page==='atlas'&&<Atlas mode={mode} onResearch={goResearch}/>} {page==='partidos'&&<MuralCampanhas mode={mode} onResearch={goResearch} onOpenCandidate={openCampaign}/>} {page==='campanhas'&&<PrestacaoDeContas mode={mode} onResearch={goResearch} initialCandidate={campaignCandidate}/>} {page==='adesivos'&&<Adesivaria mode={mode} onResearch={goResearch} onOpenCandidate={openCampaign}/>} {page==='descobertas'&&<Descobertas mode={mode} onGo={go}/>} {page==='plenario'&&<Plenario onResearch={goResearch} mode={mode}/>} {page==='investigacoes'&&<Investigacoes defaultId={investigation} mode={mode} onGo={go}/>}</main>
 <Footer/></div>;
}
