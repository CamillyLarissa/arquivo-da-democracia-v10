import {useEffect,useMemo,useState} from 'react';
import {getCandidates,request} from '../data/client.js';
import {PAGE_SIZE,filterCandidates,sortCandidates,offlineCandidates,summarizeCandidates,orderForMode} from './model.js';

export default function useMuralData(params,page,organization,live,revision=0){
 const scopeKey=JSON.stringify([params,revision]),pageKey=JSON.stringify([params,page,orderForMode(organization),revision]);
 const [pageState,setPageState]=useState(null),[summaryState,setSummaryState]=useState(null);
 useEffect(()=>{
  if(!live)return;
  const controller=new AbortController();
  const timer=setTimeout(()=>getCandidates({...params,ordem:orderForMode(organization),offset:page*PAGE_SIZE,limit:PAGE_SIZE},{signal:controller.signal})
   .then(data=>{if(!controller.signal.aborted)setPageState({key:pageKey,scope:scopeKey,page,data})}).catch(()=>{if(!controller.signal.aborted)setPageState({key:pageKey,error:true})}),250);
  return()=>{clearTimeout(timer);controller.abort()};
 },[pageKey,live]);
 useEffect(()=>{
  if(!live)return;
  const controller=new AbortController();
  const timer=setTimeout(()=>request('/mural/resumo?'+new URLSearchParams(params),{signal:controller.signal})
   .then(data=>{if(!controller.signal.aborted)setSummaryState({key:scopeKey,data})}).catch(()=>{if(!controller.signal.aborted)setSummaryState({key:scopeKey,error:true})}),300);
  return()=>{clearTimeout(timer);controller.abort()};
 },[scopeKey,live]);
 const offline=useMemo(()=>{
  const all=filterCandidates(offlineCandidates,params);
  return {rows:sortCandidates(all,organization).slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),total:all.length,summary:summarizeCandidates(all)};
 },[scopeKey,page,organization]);
 if(!live)return {...offline,busy:false,summaryBusy:false,problem:false,summaryProblem:false};
 const current=pageState?.key===pageKey?pageState:null,summary=summaryState?.key===scopeKey?summaryState:null;
 const previous=pageState?.scope===scopeKey&&pageState?.page===page?pageState.data:null;
 return {rows:current?.data?.rows||(!current?previous?.rows:[])||[],total:current?.data?.total??summary?.data?.stats?.total??null,summary:summary?.data||null,busy:!current,summaryBusy:!summary,problem:!!current?.error,summaryProblem:!!summary?.error};
}
