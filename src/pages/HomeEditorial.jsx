import {useState} from 'react';
import {MotionConfig} from 'motion/react';
import {ArrowRight,ArrowUpRight,FolderOpen,MapPin,Coins,Landmark,RotateCcw,BookOpen} from 'lucide-react';
import Televisao3D from '../components/Televisao3D.jsx';
import Descobertas from './Descobertas.jsx';
import {PrintLabel,EditorialHeading,SourceNote} from '../components/Editorial.jsx';
import {comparisonSnapshot} from '../data/comparisonSnapshot.js';

const number=value=>value==null?'—':Number(value).toLocaleString('pt-BR',{maximumFractionDigits:2});
const CHAPTERS=[
 ['arquivo','ARQUIVO DE CANDIDATURAS','Puxe as fichas e compare perfis.',FolderOpen,'TRAJETÓRIAS'],
 ['atlas','ATLAS TERRITORIAL','Abra o mapa por estado e município.',MapPin,'TERRITÓRIOS'],
 ['campanhas','CONTAS DE CAMPANHA','Abra envelopes e gastos eleitorais.',Coins,'RECURSOS'],
 ['plenario','A SALA DO PODER','Entre no plenário 3D.',Landmark,'REPRESENTAÇÃO']
];
const legendRows=comparisonSnapshot('legenda',{cargo:'VEREADOR'}).rows;
const legend2020=legendRows.find(row=>row.ano===2020).valor;
const legend2024=legendRows.find(row=>row.ano===2024).valor;

export default function HomeEditorial({onGo,onResearch,mode,data}){
 const [channel,setChannel]=useState(0);
 const channels=[
  {name:'Os municípios do acervo',value:number(data.coverage),detail:'6 UFs · cobertura parcial',to:'atlas'},
  {name:'Pessoas registradas',value:number(data.people),detail:'Todos os anos e cargos disponíveis · 6 UFs',to:'arquivo'},
  {name:'Permanência do partido líder',value:'36,57%',detail:'2020 → 2024 · vereador · 6 UFs · recorte arquivado',to:'investigacoes'},
  {name:'Despesas da disputa',value:'R$ 4,37 bi',detail:'Todos os anos disponíveis · 6 UFs · recorte arquivado',to:'campanhas'}
 ];
 const next=()=>setChannel(value=>(value+1)%channels.length);
 return <MotionConfig reducedMotion="user"><div className="br-home br-scope">
  <div className="br-edition-line"><span>PUBLICAÇÃO INDEPENDENTE</span><span>ELEIÇÕES · TERRITÓRIOS · MEMÓRIA</span><span>EDIÇÃO DIGITAL / 01</span></div>
  <header className="br-home-masthead"><p>UM ACERVO PARA LER O BRASIL</p><h1>ARQUIVO <span>DA</span><br/>DEMOCRACIA</h1><div><span>Dados públicos.<br/>Histórias em disputa.</span><PrintLabel tone="red">ACERVO INDEPENDENTE</PrintLabel></div></header>
  <section className="br-home-front" aria-label="Capa do acervo">
   <div className="br-cover-poster br-enter"><div className="br-poster-registration"><span>CADERNOS DA DEMOCRACIA</span><span>CE · MA · MS · RJ · RN · RS</span></div><h2>CADA VOTO<br/>TEM UMA<br/><em>HISTÓRIA.</em></h2><p>Por trás de cada santinho há um nome. Por trás de cada voto, uma história. Explore os números de um Brasil em disputa.</p><div className="br-cover-actions"><button className="br-button br-button-yellow" onClick={()=>onGo('atlas')}>ABRIR O ATLAS <ArrowUpRight size={19}/></button><button className="br-cover-link" onClick={()=>onGo('arquivo')}>PUXAR UMA FICHA <FolderOpen size={17}/></button></div><div className="br-cover-bottom"><span>OS DADOS SAEM DO PAPEL.</span><span className="br-print-rosette" aria-hidden="true">✳</span></div></div>
   <div className="br-cover-stories"><button className="br-story-paper br-story-ballot br-enter" onClick={()=>onResearch(5)}><span className="br-story-kicker">01 / PARTIDOS EM PERSPECTIVA</span><h2>O VOTO É NO<br/>NOME OU<br/><em>NA SIGLA?</em></h2><div className="br-story-values"><span>{number(legend2020)}%<small>2020</small></span><ArrowRight aria-hidden="true"/><span>{number(legend2024)}%<small>2024</small></span></div><p>Participação dos votos de legenda · vereador · seis UFs. Recorte auditado em 21/10/2026.</p><span className="br-story-read">ABRIR A INVESTIGAÇÃO <ArrowUpRight size={20}/></span></button>
    <button className="br-story-paper br-story-territory" onClick={()=>onGo('atlas')}><div><span className="br-story-kicker">02 / CARTOGRAFIA ELEITORAL</span><h3>UM PAÍS.<br/>MUITOS RECORTES.</h3><p>{number(data.coverage)} municípios em seis estados.<br/>O mapa conta o que a média esconde.</p></div><MapPin size={46} strokeWidth={1.25}/><ArrowUpRight className="br-paper-arrow" size={23}/></button></div>
  </section>
  <section className="br-home-census" aria-label="Dimensão do acervo"><div><PrintLabel>O ACERVO EM NÚMEROS</PrintLabel><p>Todos os anos e cargos disponíveis<br/>CE · MA · MS · RJ · RN · RS</p></div>{[[data.coverage,'MUNICÍPIOS'],[data.states,'UNIDADES FEDERATIVAS'],[data.applications,'CANDIDATURAS'],[data.people,'PESSOAS']].map(([value,label])=><div key={label}><strong>{number(value)}</strong><span>{label}</span></div>)}</section>
  <p className="br-coverage-ribbon"><b>RECORTE REAL, NÃO NACIONAL.</b> A base cobre municípios de seis UFs. Os demais estados não estão representados neste levantamento.</p>
  <section className="br-home-index"><EditorialHeading number="01" kicker="GUIA DE LEITURA" title={<>Cada dado guarda<br/><em>uma história.</em></>}><p>Escolha por onde começar. Cruze um nome, um território e uma eleição para encontrar novas perguntas.</p></EditorialHeading><div className="br-chapter-grid">{CHAPTERS.map(([id,title,detail,Icon,tag],index)=><button key={id} className={`br-chapter br-chapter-${index}`} onClick={()=>onGo(id)}><span className="br-chapter-top"><span>{String(index+1).padStart(2,'0')} / {tag}</span><Icon size={25}/></span><strong>{title}</strong><p>{detail}</p><span className="br-chapter-bottom">EXPLORAR O ACERVO <ArrowUpRight size={21}/></span></button>)}</div></section>
  <section className="br-home-broadcast" aria-label="Transmissão do acervo"><div className="br-broadcast-receiver"><div className="br-broadcast-caption"><PrintLabel tone="yellow">TV ELEITORAL</PrintLabel><span>{mode==='live'?'ACERVO ATUALIZADO':'ACERVO CONSULTÁVEL'}</span></div><div className="br-television-stage"><Televisao3D channel={channels[channel]} onNext={next}/></div><div className="br-channel"><div><span>CANAL {String(channel+1).padStart(2,'0')} / 04</span><h3>{channels[channel].name}</h3><p>{channels[channel].detail}</p></div><button onClick={next} aria-label="Trocar canal"><RotateCcw size={22}/></button></div><button className="br-transmission-link" onClick={()=>channel===2?onResearch(7):onGo(channels[channel].to)}>INVESTIGAR ESTA TRANSMISSÃO <ArrowUpRight size={19}/></button></div><article className="br-broadcast-article"><PrintLabel tone="blue">PERGUNTAS & EVIDÊNCIAS</PrintLabel><h2>OS NÚMEROS<br/>NÃO FALAM<br/><em>SOZINHOS.</em></h2><p>Quanto custa uma cadeira? O voto é na sigla? Quem financia? Dez investigações conectam as perguntas aos dados disponíveis.</p><button className="br-button br-button-blue" onClick={()=>onGo('investigacoes')}>VER AS INVESTIGAÇÕES <BookOpen size={18}/></button><SourceNote>Cada análise apresenta seu ano, cargo, cobertura e método. Dados ausentes continuam sendo dados ausentes.</SourceNote></article></section>
  <Descobertas mode={mode} onGo={onGo} compact/>
 </div></MotionConfig>;
}
