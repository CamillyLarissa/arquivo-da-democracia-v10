import {lazy,Suspense,useCallback,useEffect,useMemo,useState} from 'react';
import {geoMercator,geoPath,geoGraticule} from 'd3-geo';
import {ArrowLeft,MapPin,RotateCcw} from 'lucide-react';
import SceneBoundary from './SceneBoundary.jsx';
import {COVERAGE,NO_DATA_COLOR,indicatorSettings,indicatorLegend,formatIndicator,mapColor,prepareGeography,municipalityId} from '../atlas/geography.js';

const cache=new Map();
const AtlasShader=lazy(()=>import('./AtlasShader.jsx'));
function hasWebGL(){try{const context=document.createElement('canvas').getContext('webgl2');context?.getExtension('WEBGL_lose_context')?.loseContext();return !!context}catch{return false}}
export default function GeoAtlas({uf,onUf,onSelect,municipios,indicator,selected,effects=false,reducedMotion=false,loading=false}){
  const [loaded,setLoaded]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[hover,setHover]=useState(null);
  const [webgl,setWebgl]=useState(false),[shaderFailed,setShaderFailed]=useState(false);
  const [shaderReadySource,setShaderReadySource]=useState(null);
  useEffect(()=>setWebgl(hasWebGL()),[]);
  const source=uf||'estados';
  const onShaderReady=useCallback(()=>setShaderReadySource(source),[source]);
  const onShaderFailure=useCallback(()=>{setShaderFailed(true);setShaderReadySource(null)},[]);
  useEffect(()=>{if(!effects)setShaderReadySource(null)},[effects]);
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
  const shaderEnabled=!!(effects&&webgl&&!shaderFailed&&uf&&geo&&path);
  const shaderVisible=shaderEnabled&&shaderReadySource===source;
  const activeFeature=uf&&geo?.features.find(f=>municipalityId(f)===String(selected?.id));
  const activePoint=activeFeature&&path?.centroid(activeFeature);
  const stateName=cache.get('estados')?.features.find(f=>f.properties.uf===uf)?.properties.nome||uf;
  const formatValue=value=>formatIndicator(value,indicator);
  return <div className="atlas-cartography">
    <div className="atlas-map-heading"><div><span>CADERNO DE TERRITÓRIOS / {uf||'BRASIL'}</span><h3>{uf?stateName:'UM PAÍS, SEIS RECORTES.'}</h3></div>{uf?<button onClick={()=>onUf('')}><ArrowLeft size={15}/> VER BRASIL</button>:<span className="atlas-map-edition">01 / 06 UFs</span>}</div>
    <p className="atlas-map-instruction">{uf?'Cada contorno, um município. Selecione no mapa ou encontre a ficha ao lado.':'Mapa de cobertura. Abra um dos seis estados para consultar seus municípios.'}</p>
    <div className="atlas-map-sheet" aria-busy={!geo&&!error}>
      <div className="atlas-map-viewport">
      {shaderEnabled&&<SceneBoundary fallback={null} onError={onShaderFailure}><Suspense fallback={null}><AtlasShader geo={geo} path={path} lookup={lookup} indicator={indicator} reducedMotion={reducedMotion} onReady={onShaderReady} onFailure={onShaderFailure}/></Suspense></SceneBoundary>}
      {!geo?<div className="atlas-map-message" role="status"><MapPin size={32}/><p>{error?'Não foi possível abrir o mapa.':'Desdobrando o mapa…'}</p>{error&&<button onClick={()=>setRetry(n=>n+1)}><RotateCcw size={15}/> TENTAR NOVAMENTE</button>}</div>:<svg viewBox="0 0 740 510" preserveAspectRatio="xMidYMid meet" className="atlas-geographic-map" role="group" aria-label={uf?`Mapa dos municípios de ${stateName} · ${indicatorSettings[indicator].context}`:'Mapa do Brasil com os seis estados do acervo'}>
        <defs><pattern id="atlas-outside" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#e8e4d5"/><path d="M0 6L6 0" stroke="#c5c8b7" strokeWidth=".65"/></pattern></defs>
        {!uf&&<path d={path(grid)||''} className="atlas-graticule" fill="none"/>}
        {geo.features.map(f=>{
          const p=f.properties,id=municipalityId(f),record=lookup.get(id),covered=uf||COVERAGE.includes(p.uf);
          const active=uf&&String(selected?.id)===id;
          const label=uf?`${p.nome} · ${uf} · ${formatValue(record?.[indicator])} · ${indicatorSettings[indicator].context}`:`${p.nome}${covered?' · Explorar municípios':' · Fora do acervo'}`;
          const pick=()=>{if(uf)onSelect(record||{id,nome:p.nome,uf});else if(covered)onUf(p.uf)};
          return <path key={id} d={path(f)||''} className={`atlas-region ${covered?'is-interactive':''} ${active?'is-selected':''}`}
            fill={uf?(shaderVisible?'transparent':mapColor(record?.[indicator],indicator)):covered?'#d4dfb1':'url(#atlas-outside)'}
            stroke={active?'#b13b2e':uf?'#506968':'#829781'} strokeWidth={active?2.3:uf?.6:1}
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
      </div>
      <div className="atlas-map-readout" aria-live="polite"><MapPin size={16}/>{loading?'Carregando as fichas de todos os municípios deste recorte…':hover|| (selected&&uf?`${selected.nome} · ${uf} · ${formatValue(selected[indicator])}`:uf?'Os contornos permitem abrir as fichas, mesmo quando não há valor carregado.':'6 estados · 1.236 municípios · Cobertura parcial do Brasil')}</div>
    </div>
    {uf?<div className="atlas-numeric-legend" aria-label={`Legenda numérica: ${indicatorSettings[indicator].label}`}><div className="atlas-legend-heading"><strong>{indicatorSettings[indicator].label}</strong><span>CLASSES FIXAS · DO MENOR AO MAIOR</span></div><ul>{indicatorLegend(indicator).map(bin=><li key={bin.color}><i style={{background:bin.color}} aria-hidden="true"/><span>{bin.label}</span></li>)}</ul><p><i style={{background:NO_DATA_COLOR}} aria-hidden="true"/>Sem valor carregado · não equivale a zero.</p><small>Limite inferior incluído; limite superior excluído. As mesmas classes são usadas em todas as UFs.</small></div>:<div className="atlas-map-key"><span><i style={{background:'#d4dfb1'}}/>Estados do acervo</span><span><i className="outside"/>Fora do acervo</span><p>A cor dos estados indica cobertura, não o valor dos indicadores.</p></div>}
    {effects&&(!webgl||shaderFailed)&&<p className="atlas-effect-note" role="status">Efeito indisponível neste dispositivo: o mapa SVG continua ativo.</p>}
    {effects&&webgl&&!shaderFailed&&!uf&&<p className="atlas-effect-note">Abra uma UF para ver o efeito de cor nos municípios.</p>}
    <div className="atlas-map-source">Malha simplificada: <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noreferrer">IBGE</a> · Limites geográficos não indicam disponibilidade de dados.</div>
  </div>;
}
