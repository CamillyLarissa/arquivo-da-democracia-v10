import ComparisonPanel from '../components/ComparisonPanel.jsx';
import {useEffect,useMemo,useState} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {ArrowRight,ArrowUpRight,Search,ReceiptText,ChevronDown,TicketPercent,RotateCcw,Files,FileText} from 'lucide-react';
import {sampleCandidates} from '../data/candidatos-amostra.js';
import {sampleExpenses} from '../data/despesas-amostra.js';
import {getCandidates,getCandidateExpenses} from '../data/client.js';
import {states} from '../data/snapshot.js';
const money=n=>n==null?'—':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmt=n=>n==null?'—':Number(n).toLocaleString('pt-BR');
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const localExpense=c=>({candidate:c,entries:sampleExpenses[c?.id]||[],categories:(sampleExpenses[c?.id]||[]).map(x=>({categoria:x.categoria,valor:x.valor,quantidade:1})),stats:{quantidade:null,total:null},snapshot:true});
function FiscalMirror({record,person,index,total}){
 return <motion.article key={record?.id||'empty'} initial={{opacity:0,y:68,rotate:-3,scale:.95}} animate={{opacity:1,y:0,rotate:0,scale:1}} exit={{opacity:0,x:-75,rotate:5}} transition={{type:'spring',stiffness:175,damping:21}} className="fiscal-document-v9">
  <div className="fiscal-margin-holes" aria-hidden="true"><i/><i/><i/></div>
  <header className="fiscal-doc-top"><div><small>ARQUIVO DA DEMOCRACIA · CONTAS ELEITORAIS</small><strong>DOCUMENTO DE DESPESA</strong><span>ESPELHO INFORMATIVO · {person?.ano||'—'}</span></div><b> {String(index+1).padStart(2,'0')}<small> / {String(total).padStart(2,'0')}</small></b></header>
  <div className="fiscal-doc-warning">RECONSTRUÇÃO EDITORIAL DE LANÇAMENTO · NÃO É NOTA FISCAL ORIGINAL</div>
  <div className="fiscal-doc-area"><small>DESTINATÁRIO / CAMPANHA</small><strong>{person?.nome||'—'}</strong><span>{person?.partido||'—'} · {person?.cargo||'—'} · {person?.municipio||person?.uf||'—'} · {person?.ano||'—'}</span></div>
  <div className="fiscal-doc-grid"><div><small>FORNECEDOR / EMITENTE</small><b>Não disponível</b></div><div><small>CNPJ DO EMITENTE</small><b>Não disponível</b></div><div><small>DATA DE EMISSÃO</small><b>Não disponível</b></div><div><small>NÚMERO DA NOTA ORIGINAL</small><b>Não disponível</b></div></div>
  <div className="fiscal-doc-linehead"><span>DESCRIÇÃO DO LANÇAMENTO ELEITORAL</span><span>VALOR DECLARADO</span></div>
  <div className="fiscal-doc-item"><strong>{record?.categoria||'Categoria não informada'}</strong><b>{money(record?.valor)}</b></div>
  <div className="fiscal-doc-total"><span>VALOR DO LANÇAMENTO</span><strong>{money(record?.valor)}</strong></div>
  <section className="fiscal-doc-observations"><span>OBSERVAÇÕES SOBRE O REGISTRO</span><p>Esta folha foi montada a partir da categoria e do valor declarados na prestação de contas. Não contém dados originais de uma nota fiscal eletrônica. A ausência desses campos não significa ausência do documento na Justiça Eleitoral.</p></section>
  <footer className="fiscal-doc-footer"><span>LANÇAMENTO {index+1} DE {total} · FONTE: PRESTAÇÃO DE CONTAS ELEITORAL</span><strong>REGISTRO DOCUMENTAL</strong></footer>
 </motion.article>;
}
export default function PrestacaoDeContas({mode,onResearch,initialCandidate}){
 const [year,setYear]=useState('2024'),[uf,setUf]=useState(''),[search,setSearch]=useState(''),[party,setParty]=useState(''),[cargo,setCargo]=useState('VEREADOR');
 const [list,setList]=useState([]),[count,setCount]=useState(0),[pick,setPick]=useState(null),[detail,setDetail]=useState(null);
 const [index,setIndex]=useState(0),[expenseOffset,setExpenseOffset]=useState(0),[busy,setBusy]=useState(false),[category,setCategory]=useState('');const [paperOpen,setPaperOpen]=useState(false);
 useEffect(()=>{if(initialCandidate){setPick(initialCandidate);setYear(String(initialCandidate.ano));setUf(initialCandidate.uf||'');setSearch('');setParty('');setCargo(initialCandidate.cargo||'VEREADOR');setIndex(0);setExpenseOffset(0);setPaperOpen(true)}},[initialCandidate]);
 useEffect(()=>{if(mode!=='live')return;let active=true;const t=setTimeout(async()=>{try{const x=await getCandidates({ano:year,uf,search,partido:party,cargo,limit:24,ordem:'gastos'});if(active){setList(x.rows||[]);setCount(x.total||0)}}catch{if(active){setList([]);setCount(0)}}},280);return()=>{active=false;clearTimeout(t)}},[year,uf,search,party,cargo,mode]);
 useEffect(()=>{setExpenseOffset(0);setCategory('');setIndex(0);setDetail(null)},[pick?.id]);
 useEffect(()=>{if(!pick)return;if(mode!=='live'){setDetail(localExpense(pick));return;}let active=true;setBusy(true);
   getCandidateExpenses(pick.id,{categoria:category,limit:40,offset:expenseOffset}).then(x=>{if(active)setDetail(x)}).catch(()=>{if(active)setDetail(localExpense(pick))}).finally(()=>{if(active)setBusy(false)});return()=>{active=false}},[pick?.id,mode,expenseOffset,category]);
 const sampleFiltered=useMemo(()=>sampleCandidates.filter(c=>String(c.ano)===year&&c.cargo===cargo&&(!uf||c.uf===uf)&&(!party||c.partido===party)&&(!search||norm([c.nome,c.partido,c.municipio].join(' ')).includes(norm(search)))).sort((a,b)=>(b.gastos||0)-(a.gastos||0)).slice(0,24),[year,uf,party,cargo,search]);
 const candidates=mode==='live'?list:sampleFiltered;
 const entries=detail?.entries||[];
 const categories=detail?.categories||[];
 const filtered=useMemo(()=>mode==='live'?entries:(category?entries.filter(x=>x.categoria===category):entries),[entries,category,mode]);
 const current=filtered[Math.min(index,filtered.length-1)]||null;
 const expenseTotal=mode==='live'?(detail?.total_filtered??filtered.length):filtered.length;
 const maxCategory=Math.max(1,...categories.map(c=>Number(c.valor)||0));
 const valorCamp=pick?.gastos??null;const perVote=(pick?.votos>0&&valorCamp!=null)?valorCamp/pick.votos:null;
 return <div className="prestacao-v5"><div className="section-header"><div><div className="eyebrow"><span className="eyebrow-dot"/>DOSSIÊS FINANCEIROS / CAMPANHAS</div><h2>ABRA O <em>LIVRO-CAIXA.</em></h2><p>Escolha uma candidatura, abra cada lançamento diretamente na pasta fiscal e confira os valores em documentos visuais. Cada registro é um dado da prestação de contas — não uma nota fiscal original.</p></div></div>
 <div className="receipt-navigation"><label><Search size={16}/><input aria-label="Buscar campanha" placeholder="Buscar candidatura ou partido" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <select value={year} aria-label="Ano eleitoral" onChange={e=>{setYear(e.target.value);setPick(null);setDetail(null)}}>{[2024,2022,2020,2018].map(y=><option key={y}>{y}</option>)}</select>
 <select value={uf} aria-label="Estado" onChange={e=>{setUf(e.target.value);setPick(null);setDetail(null)}}><option value="">6 estados</option>{states.map(s=><option value={s.uf} key={s.uf}>{s.uf}</option>)}</select>
 <select aria-label="Cargo" value={cargo} onChange={e=>{setCargo(e.target.value);setPick(null);setDetail(null)}}><option value="VEREADOR">Vereador</option><option value="PREFEITO">Prefeito</option><option value="DEPUTADO ESTADUAL">Deputado estadual</option><option value="DEPUTADO FEDERAL">Deputado federal</option><option value="SENADOR">Senador</option><option value="GOVERNADOR">Governador</option></select>
 <select aria-label="Partido" value={party} onChange={e=>{setParty(e.target.value);setPick(null);setDetail(null)}}><option value="">Todos os partidos</option>{['PT','PL','PSOL','PSD','UNIÃO','PP','REPUBLICANOS','PSDB','PDT','PSB','NOVO'].map(v=><option value={v} key={v}>{v}</option>)}</select>
 <span>DESPESAS DECLARADAS · CONSULTA POR CAMPANHA</span></div>
 <div className="receipt-experience"><aside className="receipt-campaigns"><div className="panel-heading"><span>PASTAS FINANCEIRAS</span><b>{mode==='live'?fmt(count):fmt(sampleFiltered.length)} CANDIDATURAS</b></div>
 <p>Selecione a campanha para conferir seus lançamentos.</p><div className="campaign-stack">{candidates.map((c,i)=><button key={c.id} onClick={()=>{setPick(c);setPaperOpen(false)}} className={'campaign-tab '+(pick?.id===c.id?'active':'')}>
 <span className="campaign-tab-number">{c.numero||'—'}</span><span><strong>{c.nome}</strong><small>{c.partido} · {c.uf} · {c.ano}</small><b>{money(c.gastos)}</b></span><ArrowRight size={16}/></button>)}{!candidates.length&&<p>Nenhuma campanha no recorte. Tente outro filtro{mode!=='live'?' ou volte para 2024':''}.</p>}</div>
 <small className="slice-note">{mode==='live'?'As 24 candidaturas com mais despesas deste recorte. Pesquise para localizar outras.':'Amostra de candidaturas reais. Para acessar todas as campanhas e lançamentos, conecte o servidor de dados.'}</small></aside>
 <main className="paperstage"><div className="panel-heading"><span>DOCUMENTO RETIRADO</span><b>{pick?.nome||'AGUARDANDO SELEÇÃO'}</b></div>
 {!pick?<div className="no-receipt"><Files size={61}/><h3>ESCOLHA UMA PASTA.</h3><p>Os lançamentos ficarão organizados em uma pasta. Selecione uma campanha e folheie as folhas fiscais reconstruídas a partir dos dados disponíveis.</p></div>:<><div className="fiscal-folder-strip"><div><small>PASTA ELEITORAL · {pick.ano} · {pick.uf}</small><strong>{pick.nome}</strong><span>{busy?'LOCALIZANDO DOCUMENTOS...':`${expenseTotal} lançamentos disponíveis${detail?.snapshot?' nesta amostra':''}`}</span></div><div className="fiscal-folder-stamps"><span>PRESTAÇÃO DE CONTAS</span><b>{filtered.length} REGISTROS NO RECORTE</b></div></div>
 <div className="fiscal-stack-stage"><div className="fiscal-paper-stack" aria-hidden="true"><i/><i/><i/></div>
 <AnimatePresence mode="wait">{current?<FiscalMirror key={`${pick.id}-${current?.id}`} record={current} person={pick} index={expenseOffset+index} total={expenseTotal}/>:<motion.div className="receipt-empty-document" key={pick.id+'-vazio'} initial={{opacity:0,y:55}} animate={{opacity:1,y:0}}><b>DOCUMENTAÇÃO · {pick.ano}</b><h3>{pick.nome}</h3><p>Não há lançamentos detalhados disponíveis neste recorte do acervo.</p><strong>DESPESAS TOTAIS DECLARADAS</strong><em>{money(pick.gastos)}</em><small>Não criamos notas fiscais nem valores para registros ausentes.</small></motion.div>}</AnimatePresence></div>
 <div className="slip-pager"><button disabled={expenseOffset+index<=0||busy} onClick={()=>{if(index>0)setIndex(i=>i-1);else {setExpenseOffset(n=>Math.max(0,n-40));setIndex(39)}}}>← ANTERIOR</button><span>{expenseTotal?`${expenseOffset+index+1}/${expenseTotal} LANÇAMENTOS`:'SEM LANÇAMENTOS'}</span><button disabled={expenseOffset+index>=expenseTotal-1||busy} onClick={()=>{if(index+1<filtered.length)setIndex(i=>i+1);else{setExpenseOffset(n=>n+40);setIndex(0)}}}>PRÓXIMO →</button></div>
 </>}</main>
 <aside className="expense-ledger"><div className="panel-heading"><span>ANÁLISE DA CAMPANHA</span><b>INDICADORES</b></div>
 {pick?<><div className="expense-ledger-top"><span>{pick.ano} · {pick.cargo} · {pick.uf}</span><h3>{pick.nome}</h3><strong>{money(valorCamp)}</strong><small>DESPESAS TOTAIS REGISTRADAS NA CANDIDATURA</small></div>
 <div className="expense-metrics"><div><span>VOTOS</span><b>{fmt(pick.votos)}</b></div><div><span>DESPESA / VOTO OBTIDO</span><b>{perVote==null?'—':money(perVote)}</b></div><div><span>RESULTADO</span><b>{pick.resultado||'—'}</b></div></div>
 <div className="receipt-category-analysis"><div className="micro">PARA ONDE FOI O DINHEIRO? · CATEGORIAS DOS LANÇAMENTOS</div>{categories.slice(0,6).map((c,i)=><button key={i} className={'receipt-category-row '+(category===c.categoria?'selected':'')} onClick={()=>{setCategory(category===c.categoria?'':c.categoria);setIndex(0);setExpenseOffset(0)}}><span>{c.categoria}</span><strong>{money(c.valor)}</strong><i><em style={{width:`${Math.max(2,100*Number(c.valor||0)/maxCategory)}%`}}/></i></button>)}<small>Distribuição dos lançamentos cadastrados, não das notas fiscais originais. Clique numa categoria para folhear seus registros.</small></div>
 <div className="entries-panel"><div className="entries-head"><b>LANÇAMENTOS</b><button onClick={()=>{setIndex(0);setCategory('');setExpenseOffset(0)}}><RotateCcw size={13}/> LIMPAR</button></div><label className="category-filter"><span>FILTRAR CATEGORIA</span><select value={category} onChange={e=>{setCategory(e.target.value);setIndex(0);setExpenseOffset(0)}}><option value="">Todas as categorias</option>{categories.map((c,i)=><option key={i} value={c.categoria}>{c.categoria}</option>)}</select></label>
 <div className="receipt-items">{filtered.map((row,i)=><button key={row.id||i} className={index===i?'active':''} onClick={()=>{setIndex(i);setPaperOpen(true)}}><span><strong>{row.categoria}</strong><small>{money(row.valor)}</small></span><FileText size={16}/></button>)}{!filtered.length&&<p>Não há lançamentos disponíveis na amostra desta campanha. A busca completa mostra os registros existentes no banco.</p>}</div>
 <p className="ledger-disclaimer">O valor total da candidatura pode ser maior que os lançamentos exibidos: os lançamentos são paginados em grupos de 40 na consulta ao vivo; a versão desconectada exibe uma amostra reduzida. Datas, fornecedor e documento fiscal original não constam desta base.</p></div>
 <div className="receipt-related"><span>INVESTIGUE TAMBÉM</span><button onClick={()=>onResearch(1)}>O CUSTO DE UMA CADEIRA <ArrowUpRight size={15}/></button><button onClick={()=>onResearch(9)}>ONDE SE GASTA EM PROPAGANDA <ArrowUpRight size={15}/></button><button onClick={()=>onResearch(8)}>A ORIGEM DO DINHEIRO: O QUE FALTA <ArrowUpRight size={15}/></button></div>
 </>:<div className="expense-no-choice">Escolha uma campanha à esquerda para abrir seus gastos, comparar o total declarado aos votos e conhecer as categorias de despesas.</div>}</aside>
 </div>
 <ComparisonPanel topic="campanhas" mode={mode}/>
 </div>;
}
