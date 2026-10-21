import {geoArea} from 'd3-geo';

export const COVERAGE = ['CE','MA','MS','RJ','RN','RS'];
export const indicatorSettings = {
  abstencao_2024:{label:'ABSTENÇÃO (%)',low:8,high:34},
  idhm:{label:'IDHM*',low:.52,high:.85},
  pib_per_capita:{label:'PIB POR HABITANTE (R$)',low:9000,high:100000},
  populacao:{label:'POPULAÇÃO',low:1000,high:1000000},
};
export const MAP_COLORS = ['#f7dfa2','#e5b55d','#c7764c','#ad4439','#244e86'];
export function mapColor(value,indicator){
  if(value==null||!Number.isFinite(Number(value)))return '#d5d2c9';
  const {low,high}=indicatorSettings[indicator];
  const fraction=Math.max(0,Math.min(1,(Number(value)-low)/(high-low)));
  return MAP_COLORS[Math.min(4,Math.floor(fraction*5))];
}
// RFC 7946 and d3-geo use opposite exterior ring winding conventions.
// Normalize a copy so Brazilian polygons never render as the rest of the globe.
export function prepareGeography(collection){
  if(collection?.type!=='FeatureCollection'||!collection.features?.length)throw new Error('Malha inválida');
  return {...collection,features:collection.features.map(feature=>{
    if(geoArea(feature)<=2*Math.PI)return feature;
    const geometry=feature.geometry;
    const reversePolygon=polygon=>polygon.map(ring=>[...ring].reverse());
    return {...feature,geometry:{...geometry,coordinates:geometry.type==='MultiPolygon'
      ?geometry.coordinates.map(reversePolygon):reversePolygon(geometry.coordinates)}};
  })};
}
export function municipalityId(feature){
  const p=feature.properties||{};
  return String(p.codarea||p.CD_MUN||p.CD_GEOCMU||p.cod_ibge||p.id_municipio||feature.id||'');
}
