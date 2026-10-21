import {useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {CanvasTexture,LinearFilter,ShaderMaterial} from 'three';
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
 const texture=new CanvasTexture(canvas);texture.minFilter=LinearFilter;texture.magFilter=LinearFilter;
 return texture;
}
const vertex=`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment=`uniform sampler2D uFrom; uniform sampler2D uTo; uniform float uMix; varying vec2 vUv;
void main(){vec4 a=texture2D(uFrom,vUv); vec4 b=texture2D(uTo,vUv); vec4 color=mix(a,b,uMix);
float ink=dot(color.rgb,vec3(0.299,0.587,0.114)); color.rgb=mix(color.rgb,vec3(ink),0.035); gl_FragColor=color;}`;
function Sheet({texture,reducedMotion}){
 const invalidate=useThree(state=>state.invalidate);
 const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uFrom:{value:texture},uTo:{value:texture},uMix:{value:1}},vertexShader:vertex,fragmentShader:fragment}),[]);
 const progress=useRef(1);
 useEffect(()=>{
  if(reducedMotion){material.uniforms.uFrom.value=texture;material.uniforms.uTo.value=texture;material.uniforms.uMix.value=1;progress.current=1;invalidate();return;}
  material.uniforms.uFrom.value=material.uniforms.uTo.value;
  material.uniforms.uTo.value=texture;material.uniforms.uMix.value=0;progress.current=0;invalidate();
 },[texture,reducedMotion,material,invalidate]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame((_,delta)=>{if(progress.current<1){progress.current=Math.min(1,progress.current+delta/0.55);material.uniforms.uMix.value=progress.current;if(progress.current<1)invalidate();}});
 return <mesh material={material}><planeGeometry args={[740,510]}/></mesh>;
}
export default function AtlasShader({geo,path,lookup,indicator,reducedMotion,onFailure}){
 const texture=useMemo(()=>makeTexture(geo,path,lookup,indicator),[geo,path,lookup,indicator]);
 useEffect(()=>()=>{setTimeout(()=>texture.dispose(),700)},[texture]);
 return <div className="atlas-shader" aria-hidden="true"><Canvas frameloop="demand" orthographic camera={{position:[0,0,10],zoom:1}} onCreated={({gl})=>{gl.setClearColor(0xffffff,0)}} onError={onFailure} fallback={null}>
  <Sheet texture={texture} reducedMotion={reducedMotion}/>
 </Canvas></div>;
}
