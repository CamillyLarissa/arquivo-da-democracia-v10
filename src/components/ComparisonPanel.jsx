/**
 * Folha de comparação reutilizada entre as seções existentes. Os gráficos usam
 * agregações auditadas e a mesma fonte de dados das fichas, sem inventar séries.
 * Contextos: arquivo, atlas, partidos, campanhas, adesivaria, plenario, mesa.
 */
import {useEffect,useMemo,useState} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {ArrowLeftRight,ChartNoAxesCombined,Download,FileSpreadsheet,Info,RefreshCw,TrendingUp} from 'lucide-react';
import {Bar,BarChart,CartesianGrid,Cell,Legend,Line,LineChart,
        ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {getComparison} from '../data/client.js';
import {comparisonSnapshot} from '../data/comparisonSnapshot.js';
import {states} from '../data/snapshot.js';
import {comparisonMetrics,buildComparisonChart,formatComparisonValue,isComparableCandidates} from '../data/comparisonLogic.js';

const COLORS=['#19447f','#c44838','#d79f23','#1a7c60','#81649e','#9c6134'];
const ALL_CARGOS=['VEREADOR','DEPUTADO FEDERAL','DEPUTADO ESTADUAL'];
const PARTIES=['','PT','PL','PSOL','PSD','MDB','UNIÃO','PP','REPUBLICANOS','PSDB','PDT','PSB','NOVO','REDE','PODE'];
const TITLES={legenda:'VOTOS DE LEGENDA',abstencao:'ABSTENÇÃO ELEITORAL',cadeiras:'CUSTO POR CADEIRA',escolaridade:'ESCOLARIDADE E VITÓRIA',propaganda:'GASTOS DE PROPAGANDA',patrimonio:'PATRIMÔNIO E ELEIÇÃO',fichas:'FICHAS LADO A LADO',municipios:'DOIS MUNICÍPIOS'};
const OPTIONS={
 arquivo:['escolaridade','patrimonio'],
 atlas:['abstencao','legenda','municipios'],
 partidos:['legenda','propaganda'],
 campanhas:['propaganda','cadeiras'],
 adesivos:['propaganda'],
 plenario:['cadeiras','legenda'],
 investigacoes:['legenda','escolaridade','patrimonio','cadeiras','abstencao','propaganda'],
 fichas:['fichas']
};
const OFFICE_LABEL={'VEREADOR':'Vereador','DEPUTADO FEDERAL':'Deputado federal','DEPUTADO ESTADUAL':'Deputado estadual'};
const schoolScopes=[['2024','VEREADOR'],['2022','DEPUTADO ESTADUAL'],['2022','DEPUTADO FEDERAL']];
const wealthScopes=[['2024','VEREADOR'],['2020','VEREADOR'],['2022','DEPUTADO ESTADUAL'],['2018','DEPUTADO FEDERAL'],['2022','DEPUTADO FEDERAL'],['2018','DEPUTADO ESTADUAL']];
const valueOf=(v)=>v==null?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2});
const s=(n)=>String(n??'');
function selectorsToRows(kind,municipios,candidatos,metrica,first,second){
 if(kind==='fichas')return candidatos.map(c=>({serie:c.nome,valor:c[metrica]??null,partido:c.partido,ano:c.ano,cargo:c.cargo,uf:c.uf}));
 if(kind==='municipios')return [first,second].map(id=>municipios.find(m=>m.id===id)).filter(Boolean).map(m=>({serie:`${m.nome} (${m.uf})`,valor:m[metrica]??null,id:m.id}));
 return [];
}
function downloadRows(filename,header,rows){
 const cell=v=>'"'+String(v==null?'':v).replaceAll('"','""')+'"';
 const csv='\uFEFF'+[header,...rows].map(r=>r.map(cell).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const Combo=({title,selected,onChange,options})=><label className="compare-label"><span>{title}</span><select value={selected} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
const UFOPTIONS=[{value:'',label:'Todos os seis estados'},...states.map(x=>({value:x.uf,label:x.nome}))];
const partiesOptions=PARTIES.map(p=>({value:p,label:p||'Todos os partidos'}));
const officeOptions=ALL_CARGOS.map(c=>({value:c,label:OFFICE_LABEL[c]}));
const toScopes=arr=>arr.map(([ano,cargo])=>({value:`${ano}|${cargo}`,label:`${ano} · ${OFFICE_LABEL[cargo]}`}));
const MetricOptions=({kind,metric,setMetric})=><div className="compare-metric-choices" role="group" aria-label="Indicador do gráfico">{comparisonMetrics(kind).map(({key,label})=><button type="button" key={key} className={metric===key?'active':''} aria-pressed={metric===key} onClick={()=>setMetric(key)}>{label}</button>)}</div>;
const formatTooltip=(value,metric,kind)=>value==null?'Sem informação':formatComparisonValue(value,metric,kind);

export default function ComparisonPanel({topic='investigacoes',mode='snapshot',candidates=[],municipios=[],defaultKind}){
 const choices=OPTIONS[topic]??OPTIONS.investigacoes;
 const [kind,setKind]=useState(defaultKind&&choices.includes(defaultKind)?defaultKind:choices[0]);
 const [cargo,setCargo]=useState('VEREADOR'),[uf,setUf]=useState('');
 const [firstParty,setFirstParty]=useState(''),[secondParty,setSecondParty]=useState(''),[promoParty,setPromoParty]=useState('');
 const [ufs,setUfs]=useState(['RJ','RS']);
 const [schoolScope,setSchoolScope]=useState('2024|VEREADOR'),[wealthScope,setWealthScope]=useState('2024|VEREADOR');
 const [metric,setMetric]=useState('valor');
 const [rowsResult,setRowsResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
 const [showTable,setShowTable]=useState(false);
 const [townOne,setTownOne]=useState(''),[townTwo,setTownTwo]=useState('');
 useEffect(()=>{setMetric(comparisonMetrics(kind)[0].key);setShowTable(false)},[kind]);
 useEffect(()=>{if(!choices.includes(kind))setKind(choices[0])},[topic,choices.join('|')]);
 useEffect(()=>{if(municipios.length<1)return;
   if(!municipios.some(m=>m.id===townOne))setTownOne(municipios[0].id);
   if(!municipios.some(m=>m.id===townTwo))setTownTwo(municipios[Math.min(1,municipios.length-1)].id);
 },[municipios,townOne,townTwo]);
 const params=useMemo(()=>{
    if(kind==='legenda')return {cargo,uf,primeiro:firstParty,segundo:secondParty};
    if(kind==='abstencao')return {ufs:ufs.join(',')};
    if(kind==='cadeiras')return {cargo,uf};
    if(kind==='propaganda')return {cargo,uf,partido:promoParty};
    if(kind==='escolaridade'){const [ano,cargo]=schoolScope.split('|');return {ano,cargo,uf}}
    if(kind==='patrimonio'){const [ano,cargo]=wealthScope.split('|');return {ano,cargo,uf}}
    return {};
 },[kind,cargo,uf,firstParty,secondParty,promoParty,ufs.join(','),schoolScope,wealthScope]);
 const offline=useMemo(()=>comparisonSnapshot(kind,params),[kind,JSON.stringify(params)]);
 useEffect(()=>{
   let active=true;
   if(kind==='fichas'||kind==='municipios'){setRowsResult(null);setError('');setBusy(false);return;}
   if(mode!=='live'){setRowsResult(offline);setError('');setBusy(false);return;}
   setBusy(true);setError('');setRowsResult(null);
   const timer=setTimeout(()=>getComparison(kind,params).then(result=>{if(active)setRowsResult(result)}).catch(()=>{
      if(active){setError('Não foi possível atualizar esta comparação agora.');setRowsResult(offline)}
   }).finally(()=>{if(active)setBusy(false)}),140);
   return ()=>{active=false;clearTimeout(timer)};
 },[mode,kind,JSON.stringify(params),version,offline]);
 const local=kind==='fichas'||kind==='municipios';
 const localRows=useMemo(()=>selectorsToRows(kind,municipios,candidates,metric,townOne,townTwo),[kind,municipios,candidates,metric,townOne,townTwo]);
 const result=local?{rows:localRows,source:mode==='live'?'consulta':'snapshot'}:rowsResult;
 const rows=result?.rows??[];
 const comparable=isComparableCandidates(candidates);
 const expectedYears=useMemo(()=>(['legenda','cadeiras','propaganda'].includes(kind)?(cargo==='VEREADOR'?[2020,2024]:[2018,2022]):kind==='abstencao'?[2022,2024]:null),[kind,cargo]);
 const chart=useMemo(()=>buildComparisonChart(kind,rows,metric,expectedYears),[kind,rows,metric,expectedYears]);
 const unit=(kind==='fichas' || kind==='municipios')?null:result?.unidade;
 const moneyMetric=(kind==='fichas'&&['gastos','patrimonio'].includes(metric))||(kind==='municipios'&&metric==='pib_per_capita')||(kind==='cadeiras')||(kind==='propaganda'&&metric==='valor')||(kind==='patrimonio'&&metric==='mediana');
 const percentageMetric=(kind==='municipios'&&metric==='abstencao_2024')||(['legenda','abstencao','escolaridade','patrimonio'].includes(kind)&&metric==='valor');
 const formatter=(n)=>n==null?'—':moneyMetric?Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}):percentageMetric?valueOf(n)+'%':valueOf(n);
 const caption=kind==='fichas'?`${candidates.length} candidaturas selecionadas`:
    kind==='municipios'?'Municípios do atlas · mesma métrica':result?.escopo||'Dados do recorte eleitoral';
 const methodology=kind==='fichas'?'Valores declarados ou votação no recorte de cada candidatura; a comparação não indica causalidade.':
    kind==='municipios'?'Somente municípios cobertos pelo atlas. Compare o mesmo indicador; dados ausentes não equivalem a zero.':
    result?.metodo||'Selecione outro filtro para carregar dados deste recorte.';
 const rowsTable=kind==='fichas'||kind==='municipios'?rows.map(r=>[r.serie,r.valor]):
    chart.raw.map(r=>[r.ano??r.quartil??r.serie,r.serie,r[metric]??null,
       ...(kind==='legenda'?[r.legenda??null,r.nominais??null]:[]),
       ...(kind==='cadeiras'?[r.eleitos??null,r.gasto_total??null]:[]),
       ...(kind==='escolaridade'?[r.candidaturas??null,r.eleitos??null,r.definidos??null]:[]),
       ...(kind==='propaganda'?[r.lancamentos??null]:[])]);
 const tableHeaders=kind==='fichas'||kind==='municipios'?['Elemento','Valor']:
    ['Ano / grupo','Série','Indicador',
       ...(kind==='legenda'?['Votos de legenda','Votos nominais']:[]),
       ...(kind==='cadeiras'?['Eleitos','Despesas agregadas']:[]),
       ...(kind==='escolaridade'?['Candidaturas','Eleitos','Resultados definidos']:[]),
       ...(kind==='propaganda'?['Lançamentos']:[])];
 return <section className="comparison-panel" aria-label="Painel de gráficos comparativos">
   <header className="comparison-heading"><div><span className="comparison-kicker"><ArrowLeftRight size={16}/> DOCUMENTO COMPARATIVO / LEITURA CRUZADA</span><h3>COMPARE OS <em>NÚMEROS.</em></h3><p>Escolha um recorte. As curvas e barras revelam diferenças que uma ficha isolada não mostra.</p></div><div className="comparison-seal">SÉRIE<br/>ELEITORAL<br/>↗</div></header>
   {choices.length>1&&<div className="compare-tabs" role="group" aria-label="Tipos de comparação">{choices.map(k=><button type="button" key={k} aria-pressed={kind===k} className={kind===k?'active':''} onClick={()=>setKind(k)}>{TITLES[k]}</button>)}</div>}
   <div className="compare-document"><div className="compare-doc-cap"><span>◉ {TITLES[kind]}</span><span>{caption}</span></div>
    <div className="compare-filters" aria-label="Filtros da comparação">
      {['legenda','cadeiras','propaganda'].includes(kind)&&<Combo title="Cargo (mesma disputa)" selected={cargo} onChange={setCargo} options={officeOptions}/>}
      {['legenda','cadeiras','propaganda','patrimonio','escolaridade'].includes(kind)&&<Combo title="Estado" selected={uf} onChange={setUf} options={UFOPTIONS}/>}
      {kind==='legenda'&&<><Combo title="Partido / série 1" selected={firstParty} onChange={v=>{setFirstParty(v);if(!v||v===secondParty)setSecondParty('')}} options={partiesOptions}/>
       {firstParty&&<Combo title="Comparar com" selected={secondParty} onChange={setSecondParty} options={[{value:'',label:'Sem segunda série'},...partiesOptions.filter(p=>p.value&&p.value!==firstParty)]}/>}</>}
      {kind==='propaganda'&&<Combo title="Partido" selected={promoParty} onChange={setPromoParty} options={partiesOptions}/>}
      {kind==='escolaridade'&&<Combo title="Eleição e cargo" selected={schoolScope} onChange={setSchoolScope} options={toScopes(schoolScopes)}/>}
      {kind==='patrimonio'&&<Combo title="Eleição e cargo" selected={wealthScope} onChange={setWealthScope} options={toScopes(wealthScopes)}/>}
      {kind==='abstencao'&&<div className="compare-ufs"><span>COMPARAR ESTADOS (ATÉ 3)</span><div>{states.map(({uf})=><button type="button" key={uf} aria-pressed={ufs.includes(uf)} className={ufs.includes(uf)?'active':''} onClick={()=>setUfs(prev=>prev.includes(uf)?(prev.length>1?prev.filter(v=>v!==uf):prev):(prev.length>=3?[...prev.slice(1),uf]:[...prev,uf]))}>{uf}</button>)}</div></div>}
      {kind==='municipios'&&<><Combo title="Município A" selected={townOne} onChange={setTownOne} options={municipios.map(m=>({value:m.id,label:`${m.nome} / ${m.uf}`}))}/><Combo title="Município B" selected={townTwo} onChange={setTownTwo} options={municipios.map(m=>({value:m.id,label:`${m.nome} / ${m.uf}`}))}/></>}
     </div>
     <MetricOptions kind={kind} metric={metric} setMetric={setMetric}/>
     {busy?<div className="compare-state" role="status"><RefreshCw className="compare-spin"/> Consultando os dados do recorte…</div>:rows.length===0?<div className="compare-state" role="status"><Info size={25}/>{local&&kind==='fichas'?'Retire ao menos duas fichas e coloque-as na mesa para comparar.':(!local&&mode!=='live'?'Este filtro não faz parte da amostra arquivada. Ative a consulta ao acervo para ver o resultado.':error||'Nenhum valor disponível neste recorte.')}</div>:
     <AnimatePresence mode="wait"><motion.div className="compare-chart-shell" key={kind+'-'+metric+'-'+JSON.stringify(params)} initial={{opacity:.4,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.35}}>
        {error&&<p role="alert" className="compare-alert">{error} Exibindo somente os dados arquivados compatíveis com o filtro.</p>}
        <div className="compare-graph-title"><ChartNoAxesCombined size={18}/><strong>{kind==='escolaridade'&&metric==='candidaturas'?'QUANTIDADE DE CANDIDATURAS':kind==='cadeiras'&&metric==='gasto_total'?'DESPESAS TOTAIS POR ANO':TITLES[kind]}</strong><small>{percentageMetric?'PORCENTAGEM':moneyMetric?'VALORES NOMINAIS EM R$':'INDICADOR SELECIONADO'}</small></div>
        {!showTable?<div className="compare-plot" aria-label="Gráfico comparativo; veja a tabela para valores exatos"><ResponsiveContainer width="100%" height={350}>
          {chart.type==='line'?<LineChart data={chart.points} margin={{top:23,right:22,left:8,bottom:24}}><CartesianGrid stroke="#d1c19e" strokeDasharray="2 7"/><XAxis dataKey="periodo" tick={{fontSize:12,fill:'#153e72',fontWeight:700}}/><YAxis tickFormatter={v=>Number(v)>=1000000?(v/1000000).toFixed(1)+'M':Number(v)>=1000?(v/1000).toFixed(0)+'k':v} tick={{fontSize:11}} width={68}/><Tooltip formatter={v=>formatter(v)} labelFormatter={v=>'ELEIÇÃO '+v} contentStyle={{background:'#fff6e2',border:'2px solid #17417c'}}/>{chart.series.map((serie,i)=><Line key={serie} dataKey={serie} name={serie} type="linear" stroke={COLORS[i%COLORS.length]} strokeWidth={3} dot={{r:6,strokeWidth:2,fill:'#fff8e7'}} activeDot={{r:8}} connectNulls={false}/>) }<Legend wrapperStyle={{fontSize:12,fontWeight:700}}/></LineChart>:
          <BarChart data={chart.points} layout={chart.type==='bar-horizontal'?'vertical':'horizontal'} margin={{top:20,right:30,left:chart.type==='bar-horizontal'?12:0,bottom:chart.type==='bar-horizontal'?2:75}}><CartesianGrid stroke="#d1c19e" strokeDasharray="3 5"/><XAxis type={chart.type==='bar-horizontal'?'number':'category'} dataKey={chart.type==='bar-horizontal'?undefined:'rotulo'} tick={{fontSize:11}} angle={chart.type==='bar-horizontal'?0:-14} height={chart.type==='bar-horizontal'?30:82} textAnchor={chart.type==='bar-horizontal'?'middle':'end'}/><YAxis type={chart.type==='bar-horizontal'?'category':'number'} dataKey={chart.type==='bar-horizontal'?'rotulo':undefined} width={chart.type==='bar-horizontal'?166:68} interval={0} tick={{fontSize:10,fill:'#163e76'}}/><Tooltip formatter={v=>formatter(v)} contentStyle={{background:'#fff6e2',border:'2px solid #17417c'}}/><Bar dataKey="valor" name={kind==='escolaridade'?'Escolaridade':kind==='patrimonio'?'Quartil':kind==='fichas'?'Candidaturas':'Municípios'} maxBarSize={51} radius={[0,4,4,0]}>{chart.points.map((p,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>}
         </ResponsiveContainer></div>:<div className="compare-table-wrap"><table><thead><tr>{tableHeaders.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rowsTable.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{j>=2&&typeof v==='number'?valueOf(v):v==null?'—':s(v)}</td>)}</tr>)}</tbody></table></div>}
        <div className="compare-actions"><button type="button" onClick={()=>setShowTable(t=>!t)}><FileSpreadsheet size={17}/>{showTable?'VER GRÁFICO':'VER TABELA'}</button><button type="button" onClick={()=>downloadRows(`arquivo-comparativo-${kind}.csv`,tableHeaders,rowsTable)}><Download size={17}/> BAIXAR DADOS DESTE GRÁFICO</button><span>{result?.source==='snapshot'?'RECORTE ARQUIVADO · 21/10/2026':'CONSULTA ATUAL DO ACERVO'}</span></div>
      </motion.div></AnimatePresence>}
     <div className="compare-method"><Info size={18}/><p>{methodology}{kind==='fichas'&&!comparable&&candidates.length>1?' Atenção: fichas de anos, cargos ou UFs diferentes não formam uma disputa equivalente.':''} {kind==='municipios'&&townOne===townTwo?' Você selecionou o mesmo município nos dois campos.':''} <strong>Base limitada aos estados CE, MA, MS, RJ, RN e RS.</strong></p></div>
   </div>
 </section>;
}
