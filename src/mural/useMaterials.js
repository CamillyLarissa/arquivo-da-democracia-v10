import {useEffect,useMemo,useRef,useState} from 'react';
import {request} from '../data/client.js';
import {offlineMaterials} from './model.js';

export default function useMaterials(rows,enabled,live,revision){
 const ids=rows.map(row=>row.id).sort().join(','),key=ids+':'+revision;
 const cache=useRef(new Map()),[state,setState]=useState(null);
 const sample=useMemo(()=>offlineMaterials(rows),[ids]);
 useEffect(()=>{
  if(!live||!enabled||!ids)return;
  if(cache.current.has(key)){setState({key,rows:cache.current.get(key)});return;}
  const controller=new AbortController();
  request('/mural/materiais?'+new URLSearchParams({ids}),{signal:controller.signal}).then(result=>{
   if(controller.signal.aborted)return;
   if(cache.current.size>=6)cache.current.delete(cache.current.keys().next().value);
   cache.current.set(key,result.rows||[]);setState({key,rows:result.rows||[]});
  }).catch(()=>{if(!controller.signal.aborted)setState({key,error:true,rows:[]})});
  return()=>controller.abort();
 },[live,enabled,key]);
 if(!live)return {rows:sample,busy:false,error:false,partial:true};
 const current=state?.key===key?state:null;
 return {rows:current?.rows||[],busy:enabled&&!!ids&&!current,error:!!current?.error,partial:false};
}
