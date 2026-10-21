import {useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {CanvasTexture,LinearFilter,ShaderMaterial,SRGBColorSpace} from 'three';
import {mapColor,municipalityId} from '../atlas/geography.js';

// The SVG remains the interactive and accessible map. This texture uses the
// same geometry, values and colour scale; the GPU only presents its colours.
function makeTexture(geo,path,lookup,indicator){
 const canvas=document.createElement('canvas');canvas.width=740;canvas.height=510;
 const ctx=canvas.getContext('2d');
 for(const feature of geo.features){
  const shape=new Path2D(path(feature)||'');
  ctx.fillStyle=mapColor(lookup.get(municipalityId(feature))?.[indicator],indicator);
  ctx.fill(shape);
 }
 const texture=new CanvasTexture(canvas);texture.minFilter=LinearFilter;texture.magFilter=LinearFilter;texture.colorSpace=SRGBColorSpace;
 return texture;
}
// Clip-space quad: fills the shared SVG viewport at any CSS width and DPR.
// Neither the camera's pixel dimensions nor zoom can shift the map's texture.
const vertex=`varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.0,1.0);}`;
const fragment=`uniform sampler2D uFrom; uniform sampler2D uTo; uniform float uMix; varying vec2 vUv;
void main(){vec4 a=texture2D(uFrom,vUv); vec4 b=texture2D(uTo,vUv); gl_FragColor=mix(a,b,uMix);
#include <colorspace_fragment>
}`;
function Sheet({texture,reducedMotion,onReady,onFailure}){
 const invalidate=useThree(state=>state.invalidate);
 const gl=useThree(state=>state.gl);
 const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{uFrom:{value:texture},uTo:{value:texture},uMix:{value:1}},vertexShader:vertex,fragmentShader:fragment}),[]);
 const progress=useRef(1);
 const started=useRef(0);
 const ready=useRef(false);
 useEffect(()=>{
  const lost=event=>{event.preventDefault();onFailure()};
  gl.domElement.addEventListener('webglcontextlost',lost);
  const previous=gl.debug.onShaderError;gl.debug.onShaderError=onFailure;
  return()=>{gl.domElement.removeEventListener('webglcontextlost',lost);gl.debug.onShaderError=previous};
 },[gl,onFailure]);
 useEffect(()=>{
  if(reducedMotion||material.uniforms.uTo.value===texture){material.uniforms.uFrom.value=texture;material.uniforms.uTo.value=texture;material.uniforms.uMix.value=1;progress.current=1;invalidate();return;}
  material.uniforms.uFrom.value=material.uniforms.uTo.value;
  material.uniforms.uTo.value=texture;material.uniforms.uMix.value=0;progress.current=0;started.current=performance.now();invalidate();
 },[texture,reducedMotion,material,invalidate]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame(()=>{
  if(!ready.current){ready.current=true;onReady()}
  if(progress.current<1){progress.current=Math.min(1,(performance.now()-started.current)/550);material.uniforms.uMix.value=progress.current;if(progress.current<1)invalidate();}
 });
 return <mesh material={material} frustumCulled={false}><planeGeometry args={[2,2]}/></mesh>;
}
export default function AtlasShader({geo,path,lookup,indicator,reducedMotion,onReady,onFailure}){
 const texture=useMemo(()=>makeTexture(geo,path,lookup,indicator),[geo,path,lookup,indicator]);
 const disposals=useRef(new Map());
 useEffect(()=>{
  clearTimeout(disposals.current.get(texture));disposals.current.delete(texture);
  return()=>{const timer=setTimeout(()=>{texture.dispose();disposals.current.delete(texture)},700);disposals.current.set(texture,timer)};
 },[texture]);
 return <div className="atlas-shader" aria-hidden="true"><Canvas frameloop="demand" dpr={[1,2]} gl={{alpha:true,antialias:true}} onCreated={({gl})=>{gl.setClearColor(0xffffff,0)}} fallback={null}>
  <Sheet texture={texture} reducedMotion={reducedMotion} onReady={onReady} onFailure={onFailure}/>
 </Canvas></div>;
}
