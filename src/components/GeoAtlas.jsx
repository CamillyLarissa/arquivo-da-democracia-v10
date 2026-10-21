import {useEffect,useMemo,useState} from 'react';
import {geoMercator,geoPath,geoGraticule} from 'd3-geo';
import {ArrowLeft,MapPin,RotateCcw} from 'lucide-react';
import {COVERAGE,indicatorSettings,mapColor,prepareGeography,municipalityId} from '../atlas/geography.js';

const cache=new Map();
export default function GeoAtlas({uf,onUf,onSelect,municipios,indicator,selected}){
  const [loaded,setLoaded]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[hover,setHover]=useState(null);
  const source=uf||'estados';
  useEffect(()=>{
    setHover(null);setError(false);
    if(cache.has(source)){setLoaded({source,geo:cache.get(source)});return}
    const controller=new AbortController();
    fetch(`/maps/${source}.geojson`,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error('Malha indisponível');return r.json()})
      .then(prepareGeography).then(geo=>{cache.set(source,geo);setLoaded({source,geo})})
      .catch(e=>{if(e.name!=='AbortError')setError(true)});
    return()=>controller.abort();
  },[source,retry]);
  const geo=loaded?.source===source?loaded.geo:null;
  const path=useMemo(()=>geo?geoPath(geoMercator().fitExtent([[38,24],[702,475]],geo)):null,[geo]);
  const grid=useMemo(()=>geoGraticule().extent([[-76,-35],[-33,7]]).step([5,5])(),[]);
  const lookup=useMemo(()=>new Map(municipios.map(m=>[String(m.id),m])),[municipios]);
  const activeFeature=uf&&geo?.features.find(f=>municipalityId(f)===String(selected?.id));
  const activePoint=activeFeature&&path?.centroid(activeFeature);
  const stateName=cache.get('estados')?.features.find(f=>f.properties.uf===uf)?.properties.nome||uf;
  const formatValue=value=>value==null?'Sem dados neste recorte':Number(value).toLocaleString('pt-BR',{maximumFractionDigits:indicator==='idhm'?3:2})+(indicator==='abstencao_2024'?'%':'');
  return <div className="atlas-cartography">
    <div className="atlas-map-heading"><div><span>CADERNO DE TERRITÓRIOS / {uf||'BRASIL'}</span><h3>{uf?stateName:'UM PAÍS, SEIS RECORTES.'}</h3></div>{uf?<button onClick={()=>onUf('')}><ArrowLeft size={15}/> VER BRASIL</button>:<span className="atlas-map-edition">01 / 06 UFs</span>}</div>
    <p className="atlas-map-instruction">{uf?'Selecione um município para abrir sua ficha.':'Selecione um dos estados destacados para explorar seus municípios.'}</p>
    <div className="atlas-map-sheet" aria-busy={!geo&&!error}>
      {!geo?<div className="atlas-map-message" role="status"><MapPin size={32}/><p>{error?'Não foi possível abrir o mapa.':'Desdobrando o mapa…'}</p>{error&&<button onClick={()=>setRetry(n=>n+1)}><RotateCcw size={15}/> TENTAR NOVAMENTE</button>}</div>:<svg viewBox="0 0 740 510" className="atlas-geographic-map" role="group" aria-label={uf?`Mapa dos municípios de ${stateName}`:'Mapa do Brasil com os seis estados do acervo'}>
        <defs><filter id="atlas-map-texture"><feTurbulence baseFrequency="0.6" numOctaves="2" result="noise" seed="3"/><feColorMatrix type="saturate" values="0"/></filter><pattern id="atlas-outside" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#e9dfcc"/><path d="M0 5L5 0" stroke="#d5c7b0" strokeWidth=".6"/></pattern></defs>
        {!uf&&<path d={path(grid)||''} className="atlas-graticule" fill="none"/>}
        {geo.features.map(f=>{
          const p=f.properties,id=municipalityId(f),record=lookup.get(id),covered=uf||COVERAGE.includes(p.uf);
          const active=uf&&String(selected?.id)===id;
          const label=uf?`${p.nome} · ${formatValue(record?.[indicator])}`:`${p.nome}${covered?' · Explorar municípios':' · Fora do acervo'}`;
          const pick=()=>{if(uf)onSelect(record||{id,nome:p.nome,uf});else if(covered)onUf(p.uf)};
          return <path key={id} d={path(f)||''} className={`atlas-region ${covered?'is-interactive':''} ${active?'is-selected':''}`}
            fill={uf?mapColor(record?.[indicator],indicator):covered?'#deb651':'url(#atlas-outside)'}
            stroke={active?'#173e78':uf?'#fbf4e4':'#bba683'} strokeWidth={active?2.3:uf?.65:1}
            vectorEffect="non-scaling-stroke" role={covered?'button':undefined} tabIndex={covered?0:undefined}
            aria-label={label} aria-pressed={covered?!!active:undefined} onClick={covered?pick:undefined}
            onKeyDown={e=>{if(covered&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pick()}}}
            onMouseEnter={()=>setHover(label)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(label)} onBlur={()=>setHover(null)}><title>{label}</title></path>;
        })}
        {!uf&&geo.features.filter(f=>COVERAGE.includes(f.properties.uf)).map(f=>{const [x,y]=path.centroid(f);return <g key={f.properties.uf} className="atlas-state-label" transform={`translate(${x},${y})`} aria-hidden="true"><rect x="-15" y="-12" width="30" height="24" rx="2"/><text textAnchor="middle" y="4">{f.properties.uf}</text></g>})}
        {activePoint&&<g transform={`translate(${activePoint[0]},${activePoint[1]})`} className="atlas-location-pin" aria-hidden="true"><circle r="9"/><circle r="3"/></g>}
<g className="atlas-map-seal" transform="translate(65,445)" aria-hidden="true"><rect x="-42" y="-15" width="84" height="29" rx="1"/><text x="0" y="4" textAnchor="middle">ATLAS · 01</text></g>
        <g className="atlas-map-scale" transform="translate(570,450)" aria-hidden="true"><rect width="98" height="5"/><rect x="0" width="49" height="5" fill="#173e78"/><text x="49" y="-8" textAnchor="middle">ESCALA ILUSTRATIVA</text></g>
        <g className="atlas-compass" transform="translate(690,45)" aria-hidden="true"><text x="0" y="-15" textAnchor="middle">N</text><path d="M0 -8L5 10L0 6L-5 10Z"/></g>
        {!uf&&<text className="atlas-ocean" x="590" y="310" transform="rotate(-65 590 310)" aria-hidden="true">OCEANO ATLÂNTICO</text>}
      </svg>}
      <div className="atlas-map-readout" aria-live="polite"><MapPin size={14}/>{hover|| (selected&&uf?`${selected.nome} · ${formatValue(selected[indicator])}`:uf?'Explore os limites municipais':'6 estados · 1.236 municípios no acervo')}</div>
    </div>
    <div className="atlas-map-key">{uf?<><span><i style={{background:'#d5d2c9'}}/>Sem dados no recorte</span><span>{indicatorSettings[indicator].label}</span></>:<><span><i style={{background:'#deb651'}}/>Estados do acervo</span><span><i className="outside"/>Fora do acervo</span></>}</div>
    <div className="atlas-map-source">Malha simplificada: <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noreferrer">IBGE</a> · Limites geográficos não indicam disponibilidade de dados.</div>
  </div>;
}
