import {useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import SceneBoundary from './SceneBoundary.jsx';

// Arquivador físico com divisórias: a mesma caixa aceita milhares de registros,
// carregados em páginas pelo componente de busca. Tudo no Canvas é geometria real.
const CREAM='#f5e8c9', INK='#173b71', RED='#bf4738', GOLD='#ecc454';
const fmt=n=>n==null?'Não informado':Number(n).toLocaleString('pt-BR');
const money=n=>n==null?'Não informado':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const safe=s=>String(s??'—');
function canvasTexture(draw,width=960,height=1280){
 const c=document.createElement('canvas');c.width=width;c.height=height;
 const x=c.getContext('2d');draw(x,width,height);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function labelTexture(title,color=INK){return canvasTexture((c,w,h)=>{
 c.fillStyle='#f2e7cf';c.fillRect(0,0,w,h);c.strokeStyle=color;c.lineWidth=26;c.strokeRect(13,13,w-26,h-26);
 c.fillStyle=color;c.font='900 190px Arial';c.textAlign='center';c.textBaseline='middle';
 const t=safe(title).slice(0,11).toUpperCase();
 c.font=`900 ${t.length>9?125:t.length>6?156:205}px Arial`;c.fillText(t,w/2,h/2,w-85);
 },700,330)}
function textLines(ctx,text,x,y,maxWidth,size=90,color=INK,lineHeight=1.02,maxLines=3){
 ctx.font=`900 ${size}px 'Arial Narrow',Arial,sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;
 const words=safe(text).toUpperCase().split(/\s+/),lines=[];let current='';
 for(const word of words){const candidate=(current+' '+word).trim();if(ctx.measureText(candidate).width>maxWidth&&current){lines.push(current);current=word}else current=candidate}
 if(current)lines.push(current);lines.slice(0,maxLines).forEach((line,i)=>ctx.fillText(line,x,y+i*size*lineHeight,maxWidth));
 return y+Math.min(lines.length,maxLines)*size*lineHeight;
}
function createCandidateTexture(candidate,back=false){return canvasTexture((c,w,h)=>{
 c.fillStyle='#fff0d3';c.fillRect(0,0,w,h);
 for(let y=10;y<h;y+=24){for(let x=12;x<w;x+=25){c.fillStyle='rgba(100,73,42,.055)';c.fillRect(x,y,2,2)}}
 c.strokeStyle='#a89472';c.lineWidth=9;c.strokeRect(20,20,w-40,h-40);
 c.fillStyle=INK;c.fillRect(35,36,w-70,170);
 c.textAlign='center';c.fillStyle='#fff4da';c.font='900 42px Arial';c.fillText(back?'DOSSIÊ ELEITORAL / VERSO':'ARQUIVO DA DEMOCRACIA',w/2,102);
 c.fillStyle=GOLD;c.font='700 34px monospace';c.fillText(`${safe(candidate.ano)}  ·  ${safe(candidate.uf)}  ·  ${safe(candidate.cargo)}`.slice(0,45),w/2,160,w-110);
 if(!back){
   c.fillStyle='#c54835';c.fillRect(35,210,w-70,74);
   c.fillStyle='#fff5df';c.font='bold 37px Arial';c.fillText('SANTINHO DO ACERVO · NÃO É PROPAGANDA OFICIAL',w/2,259,w-100);
   // Ilustração editorial neutra; não inventar retratos.
   c.fillStyle='#dfc499';c.fillRect(115,312,730,375);
   for(let y=325;y<683;y+=8){c.strokeStyle='#bc9c6959';c.lineWidth=2;c.beginPath();c.moveTo(120,y);c.lineTo(838,y);c.stroke()}
   c.fillStyle='#184476';c.beginPath();c.arc(480,434,102,0,Math.PI*2);c.fill();
   c.fillStyle='#184476';c.beginPath();c.ellipse(480,676,235,181,0,Math.PI,Math.PI*2);c.fill();
   c.fillStyle='#fff2d4';c.fillRect(120,642,720,39);c.font='bold 22px monospace';c.fillStyle='#8b6341';c.fillText('RETRATO NÃO DISPONÍVEL · SILHUETA EDITORIAL',w/2,667,690);
   c.fillStyle=RED;c.font='900 178px Arial';c.fillText(safe(candidate.numero),w/2,876,835);
   const final=textLines(c,candidate.nome,w/2,979,840,88,INK,1,2);
   c.fillStyle=INK;c.fillRect(100,Math.min(final+8,1137),760,58);
   c.fillStyle='#fff5df';c.font='bold 32px Arial';c.fillText(`${safe(candidate.partido)}  ·  ${safe(candidate.resultado)}`.slice(0,35),w/2,Math.min(final+47,1177),715);
 }else{
  const fields=[['CANDIDATURA',safe(candidate.nome)],['NÚMERO / PARTIDO',`${safe(candidate.numero)} · ${safe(candidate.partido)}`],['TERRITÓRIO',`${safe(candidate.municipio||candidate.uf)} / ${safe(candidate.uf)}`],['VOTOS',fmt(candidate.votos)],['DESPESAS DECLARADAS',money(candidate.gastos)],['PATRIMÔNIO DECLARADO',money(candidate.patrimonio)],['ESCOLARIDADE',safe(candidate.escolaridade||'Não informada')],['RESULTADO',safe(candidate.resultado)]];
  let y=290;fields.forEach(([a,b],i)=>{c.fillStyle=i%2?'#eadac0':'#f8ecd5';c.fillRect(61,y-33,840,101);c.fillStyle=RED;c.textAlign='left';c.font='bold 22px monospace';c.fillText(a,84,y,780);c.fillStyle=INK;c.font='bold 36px Arial';c.fillText(b.slice(0,49),83,y+43,760);y+=112});
  c.textAlign='center';c.fillStyle='#7c684e';c.font='bold 22px Arial';c.fillText('FONTE: DADOS ELEITORAIS · AUSÊNCIA DE DADO ≠ ZERO',w/2,1235,870);
 }
 })}
function Block({position,args,color,metalness=0,roughness=.77,onClick}){
 return <mesh position={position} onClick={onClick} castShadow receiveShadow><boxGeometry args={args}/><meshStandardMaterial color={color} roughness={roughness} metalness={metalness}/></mesh>;
}
function IndexDivider({entry,i,count,selected,onChoose}){
 const z=1.32-i*(3.15/Math.max(count-1,1));const [active,setActive]=useState(false);
 const tex=useMemo(()=>labelTexture(entry.short||entry.label,entry.color||INK),[entry.short,entry.label,entry.color]);
 useEffect(()=>()=>tex.dispose(),[tex]);

 return <group position={[-1.75,0,z]} onClick={e=>{e.stopPropagation();onChoose(entry.id)}} onPointerOver={e=>{e.stopPropagation();setActive(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setActive(false);document.body.style.cursor=''}}>
  <Block position={[0,1.4,0]} args={[4.5,2.22,.055]} color={selected?'#fce7b8':'#e7d8b9'}/>
  <Block position={[-1.33,2.59,.006]} args={[1.7,.38,.08]} color={selected?'#d75a46':entry.color||'#b78954'}/>
  <mesh position={[-1.33,2.59,.056]}><planeGeometry args={[1.55,.28]}/><meshBasicMaterial map={tex} side={THREE.DoubleSide}/></mesh>
  {active&&<Block position={[0,.23,.08]} args={[4.55,.08,.04]} color="#d5af66"/>}
 </group>;
}
function RowCard({i,count,selected,onPull,color}){
 const ref=useRef();const [hover,setHover]=useState(false);
 const z=1.64-i*.24;
 useFrame((_,dt)=>{if(ref.current){const target=hover?.2:selected?.5:0;ref.current.position.y=THREE.MathUtils.damp(ref.current.position.y,target,9,dt)}});
 return <group ref={ref} position={[-1.75,0,z]} onClick={e=>{e.stopPropagation();onPull('',i)}} onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(false);document.body.style.cursor=''}}>
   <Block args={[4.06,2.18,.075]} position={[0,1.35,0]} color={selected?'#fff3d5':hover?'#f8eed4':'#f0e1c0'}/>
   <Block args={[1.15,.24,.09]} position={[1.15,2.49,.01]} color={selected?'#d14f3d':color}/>
 </group>;
}
function Extracted({candidate,flipped,onFlip}){
 const root=useRef();const front=useMemo(()=>createCandidateTexture(candidate,false),[candidate]);
 const back=useMemo(()=>createCandidateTexture(candidate,true),[candidate]);
 useEffect(()=>()=>{front.dispose();back.dispose()},[front,back]);
 const born=useRef(0);useEffect(()=>{born.current=0},[candidate.id]);
 useFrame((_,dt)=>{
  if(!root.current)return;
  born.current=Math.min(1,born.current+dt*.84);
  const t=1-Math.pow(1-born.current,3);
  root.current.position.set(-1.75+4.15*t,1.25+1.34*t,1.0+3.38*t);
  root.current.rotation.y=THREE.MathUtils.damp(root.current.rotation.y,flipped?Math.PI:0,8,dt);
  root.current.rotation.z=THREE.MathUtils.damp(root.current.rotation.z,t*.034,6,dt);
  root.current.scale.setScalar(.45+.55*t);
 });
 return <group ref={root} position={[-1.75,1.25,1]} onClick={e=>{e.stopPropagation();onFlip()}} onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor=''}}>
  <Block position={[0,0,0]} args={[2.87,3.91,.07]} color="#d0b792"/>
  <mesh position={[0,0,.039]}><planeGeometry args={[2.78,3.82]}/><meshBasicMaterial map={front} side={THREE.FrontSide}/></mesh>
  <mesh position={[0,0,-.039]} rotation-y={Math.PI}><planeGeometry args={[2.78,3.82]}/><meshBasicMaterial map={back} side={THREE.FrontSide}/></mesh>
 </group>;
}
function CameraRig({onChoose,drawers,activeDrawer,fileCount,selectedFile,onPull,candidate,flipped,onFlip,phase}){
 const orbit=useRef();const {camera}=useThree();
 useEffect(()=>{camera.position.set(6.9,6.1,12.8);camera.lookAt(.05,1.75,.6);camera.updateProjectionMatrix()},[camera]);
 useFrame((_,dt)=>{if(!orbit.current)return;const goal=candidate?new THREE.Vector3(1.15,2.05,1.55):new THREE.Vector3(.3,1.7,0);
  if(orbit.current.target.distanceTo(goal)>.018){const was=orbit.current.target.clone();orbit.current.target.lerp(goal,1-Math.exp(-dt*2.3));camera.position.add(orbit.current.target.clone().sub(was));orbit.current.update()}
 });
 return <>
  <color attach="background" args={['#d6c4a7']}/><ambientLight intensity={1.6}/><hemisphereLight args={['#fff1d4','#776048',1.15]}/>
  <directionalLight position={[5,8,10]} intensity={2.3}/><directionalLight position={[-6,3,4]} intensity={.8} color="#d5e1f2"/>
  <mesh rotation-x={-Math.PI/2} position={[0,-.12,0]} receiveShadow><planeGeometry args={[45,35]}/><meshStandardMaterial color="#cab69b" roughness={1}/></mesh>
  {/* Caixa física horizontal, inspirada no fichário de cartões indexados. */}
  <group position={[-1.75,0,0]}>
   <Block args={[5.25,.17,4.5]} position={[0,.08,-.02]} color="#343f46" metalness={.25}/>
   <Block args={[.24,1.76,4.45]} position={[-2.61,.92,0]} color="#4a5459" metalness={.28}/>
   <Block args={[.24,1.76,4.45]} position={[2.61,.92,0]} color="#4a5459" metalness={.28}/>
   <Block args={[5.27,1.76,.22]} position={[0,.92,-2.25]} color="#333f47" metalness={.32}/>
   <Block args={[5.3,1.20,.24]} position={[0,.66,2.22]} color="#4d585d" metalness={.2}/>
   <Block args={[5.5,.14,4.7]} position={[0,.10,0]} color="#62727a" metalness={.31}/>
   <Block args={[5.28,.16,.22]} position={[0,1.36,2.24]} color="#7d898c" metalness={.4}/>
   <Block args={[1.8,.30,.05]} position={[0,.55,2.37]} color="#e0c995"/>
   <Block args={[1.6,.18,.065]} position={[0,.55,2.41]} color="#183e78"/>
  </group>
  {drawers.map((entry,i)=><IndexDivider key={entry.id} entry={entry} i={i} count={drawers.length} selected={activeDrawer===entry.id} onChoose={onChoose}/>)}
  {Array.from({length:Math.max(9,Math.min(fileCount,12))},(_,i)=><RowCard key={i} i={i} count={fileCount} selected={i===selectedFile} onPull={onPull} color={['#f1c951','#b9503b','#296aa0','#568a71'][i%4]}/>)}
  {candidate&&<Extracted key={candidate.id} candidate={candidate} flipped={flipped} onFlip={onFlip}/>}
  <OrbitControls ref={orbit} enablePan={false} minDistance={9.4} maxDistance={25} minPolarAngle={.52} maxPolarAngle={1.32} minAzimuthAngle={-.8} maxAzimuthAngle={.8} target={[.3,1.7,0]}/>
 </>;
}
function FallbackIndex({candidate,flipped,onFlip,drawers,onChoose,onExpenses}){
 return <div className="index-graphic-fallback"><div className="index-box-face"><div className="index-tab-line">{drawers.map(d=><button key={d.id} style={{'--folder-tone':d.color}} onClick={()=>onChoose(d.id)}>{d.short||d.label}</button>)}</div><div className="index-stack-visual">{Array.from({length:9},(_,i)=><i key={i}/>)}</div><div className="index-box-front">ARQUIVO · CANDIDATURAS</div></div>{candidate&&<button className="index-fallback-poster" onClick={onFlip}><small>{candidate.ano} · {candidate.partido}</small><b>{flipped?fmt(candidate.votos):candidate.numero}</b><strong>{candidate.nome}</strong><span>{flipped?`${money(candidate.gastos)} EM DESPESAS`:'TOQUE PARA VIRAR ↻'}</span></button>}</div>;
}
export default function Arquivo3D({drawers=[],activeDrawer='',selectedFile=-1,onChoose=()=>{},onPull=()=>{},fileCount=0,phase='pronta',candidate=null,flipped=false,onFlip=()=>{},onClose=()=>{},onCompare=()=>{},onExpenses=()=>{}}){
 return <div className="index-3d-stage">
  <SceneBoundary fallback={<FallbackIndex candidate={candidate} flipped={flipped} onFlip={onFlip} drawers={drawers} onChoose={onChoose} onExpenses={onExpenses}/> }>
   <Canvas dpr={[1,1.4]} camera={{position:[6.9,6.1,12.8],fov:40}} gl={{antialias:true,alpha:false}}>
    <CameraRig drawers={drawers} activeDrawer={activeDrawer} selectedFile={selectedFile} onChoose={onChoose} onPull={onPull} fileCount={fileCount} candidate={candidate} flipped={flipped} onFlip={onFlip} phase={phase}/>
   </Canvas>
  </SceneBoundary>
  {candidate&&<div className="index-scene-actions"><span>FICHA RETIRADA · {candidate.nome}</span><button onClick={onFlip}>↻ VIRAR</button><button onClick={onCompare}>+ COMPARAR</button><button onClick={onExpenses}>VER DESPESAS ↗</button><button onClick={onClose} aria-label="Guardar ficha">✕</button></div>}
 </div>;
}
