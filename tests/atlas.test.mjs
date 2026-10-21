import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {geoArea,geoMercator,geoPath} from 'd3-geo';
import {COVERAGE,prepareGeography,municipalityId,mapColor} from '../src/atlas/geography.js';
import {municipiosAmostra} from '../src/data/municipios-amostra.js';
const load=name=>JSON.parse(readFileSync(new URL(`../public/maps/${name}.geojson`,import.meta.url)));
test('malhas do acervo contêm 1.236 códigos únicos e toda a amostra',()=>{
 const features=COVERAGE.flatMap(uf=>load(uf).features);
 const ids=new Set(features.map(municipalityId));
 assert.equal(ids.size,1236);
 for(const municipality of municipiosAmostra)assert.ok(ids.has(municipality.id),municipality.nome);
 assert.equal(load('estados').features.length,27);
});
test('orientação das malhas desenha o Brasil, sem preencher o exterior do globo',()=>{
 for(const name of ['estados',...COVERAGE]){
   const source=load(name),copy=JSON.stringify(source),geo=prepareGeography(source);
   assert.equal(JSON.stringify(source),copy);
   const path=geoPath(geoMercator().fitExtent([[38,24],[702,475]],geo));
   for(const feature of geo.features){
     assert.ok(geoArea(feature)<1);
     assert.ok(!path(feature).includes('NaN'));
     assert.ok(path.centroid(feature).every(Number.isFinite));
   }
 }
});
test('mapa distingue ausência de valor de zero e limita valores extremos',()=>{
 assert.equal(mapColor(null,'populacao'),'#d5d2c9');
 assert.notEqual(mapColor(0,'populacao'),'#d5d2c9');
 assert.equal(mapColor(6211223,'populacao'),'#244e86');
});
