(() => {
  'use strict';
  const cfg = window.ASHES_CONFIG;
  const $ = id => document.getElementById(id);
  const demoRequested = new URLSearchParams(location.search).get('demo') === '1';
  const demo = demoRequested && cfg.allowDemo === true;
  const sessionKey = '2875-story-run-v3.1';
  const playerKey = '2875-anonymous-browser-id';
  const state = {
    doc:null,revision:null,run:null,nodeId:null,history:[],startedAt:null,
    endingId:null,busy:false,pending:null
  };
  const fallbackMap = {
    s01_intro:'02',s02_last_home:'03',s02a_parent_shot:'04',s02b_parent_leave:'05',
    s03_low_point:'06',s03_recruitment:'07',role_research:'08',research_focus:'10',
    role_combat:'09',combat_focus:'11',s04_last_stand:'12',s06_entry:'13',
    entry_route:'14',entry_route_safe:'14',entry_route_check:'15',team_response:'16',
    s06_rejoin:'17',s05_hall:'18',s05h_lower_lab:'19',s06_vaccine:'20',
    e01_dawn:'12',e02_embers:'21',e03_truth:'22'
  };
  const fallbackUrl = id => fallbackMap[id] ? `assets/scenes/2875_${fallbackMap[id]}.webp` : '';
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function view(id){['home','play','ending'].forEach(k=>$(k).classList.toggle('hidden',k!==id));window.scrollTo(0,0);}
  function notify(message){$('notice').textContent=message;$('notice').classList.remove('hidden');}
  function clearNotice(){$('notice').textContent='';$('notice').classList.add('hidden');}
  function describeError(error){
    const code=error?.code || error?.message || String(error);
    const messages={
      origin_not_allowed:'ConoHa 尚未允許你的 GitHub Pages 網域，請在後台 API 跨站設定加入正確 Origin。',
      story_not_found:'找不到已正式發布的故事，請確認 slug 與 prod 版本。',
      stale_story_reload:'正式劇情版本已更新，請重新載入後再開始。',
      rate_limited:'請稍後再試，後端限制了過於頻繁的請求。',
      invalid_choice:'劇情資料與伺服器不同步，請重新整理後恢復本次遊玩。',
      already_finished:'這輪遊玩已完成；請重新整理頁面。',
      option_not_allowed:'這個選項已不是當前節點的有效選項，請重新載入。',
      invalid_run:'本次遊玩資訊無效，請重新開始。'
    };
    return messages[code] || (code==='Failed to fetch' ? '無法連線到 ConoHa API；請檢查 HTTPS、CORS、網路與 API 是否運作。' : code);
  }
  async function curtainSwitch(callback){
    if(state.busy)return;
    state.busy=true;
    const overlay=$('curtain');
    if(!prefersReducedMotion){overlay.classList.remove('reveal');overlay.classList.add('cover');await wait(460);}
    try{await callback();}
    catch(error){notify('操作未完成：'+describeError(error));}
    finally {
      if(!prefersReducedMotion){overlay.classList.remove('cover');overlay.classList.add('reveal');await wait(640);overlay.classList.remove('reveal');}
      state.busy=false;
    }
  }
  async function api(action, payload){
    const url=cfg.apiBase+'?action='+encodeURIComponent(action)+(action==='story'?'&slug='+encodeURIComponent(cfg.slug):'');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    let response;
    try{
      const options=payload ? {method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(payload),signal:controller.signal}:{credentials:'omit',signal:controller.signal};
      response=await fetch(url,options);
      const data=await response.json().catch(()=>{throw new Error('API 沒有回傳 JSON（HTTP '+response.status+'）');});
      if(!response.ok || !data?.ok){const e=new Error(data?.error||'HTTP '+response.status);e.code=data?.error;e.status=response.status;throw e;}
      return data;
    }catch(e){if(e.name==='AbortError')throw new Error('連線逾時（12 秒）。選擇可能已由後端記錄，請使用原選項重試。');throw e;}
    finally{clearTimeout(timer);}
  }
  async function loadStory(force=false){
    if(state.doc&&!force)return;
    if(demo){
      const response=await fetch(cfg.previewFile,{cache:'no-store'});
      if(!response.ok)throw new Error('本機測試故事 JSON 不存在');
      state.doc=await response.json();state.revision='preview';$('source-mode').textContent='LOCAL DEMO';
    }else{
      const response=await api('story');state.doc=response.story;state.revision=response.revision;
      $('source-mode').textContent='LIVE · REV '+state.revision;
    }
    if(!state.doc?.nodes?.[state.doc.entry])throw new Error('故事起點不存在，請檢查後台故事 JSON');
  }
  function anonymousId(){
    let id;try{id=localStorage.getItem(playerKey);}catch(_){}
    if(!id){id=crypto.randomUUID();try{localStorage.setItem(playerKey,id);}catch(_){}}
    return id;
  }
  function saveSession(){
    if(demo)return;
    try{sessionStorage.setItem(sessionKey,JSON.stringify({run:state.run,history:state.history,startedAt:state.startedAt,revision:state.revision,pending:state.pending}));}catch(_){}
  }
  function clearSession(){try{sessionStorage.removeItem(sessionKey);}catch(_){}state.pending=null;}
  function role(){return state.history.find(ev=>ev.node_id==='s03_recruitment')?.option_id||'';}
  function validatedImageUrl(node){
    const raw=typeof node?.image==='string'?node.image.trim():'';
    if(raw.startsWith('/uploads/'))return new URL(raw,cfg.imageBase).href;
    if(/^https:\/\//i.test(raw))return raw;
    if(raw.startsWith('assets/scenes/'))return raw;
    return '';
  }
  function loadImg(src,timeout=4200){
    return new Promise(resolve=>{
      if(!src)return resolve(false);
      const image=new Image();let settled=false;
      const done=success=>{if(settled)return;settled=true;clearTimeout(t);resolve(success);};
      const t=setTimeout(()=>done(false),timeout);
      image.onload=()=>done(true);image.onerror=()=>done(false);
      image.src=src;
      if(image.complete && image.naturalWidth)done(true);
    });
  }
  async function setSceneImage(element,nodeId,node){
    const local=fallbackUrl(nodeId);
    const remote=validatedImageUrl(node);
    let chosen=demo ? local : remote;
    // The curtain stays black until the new poster loads, or its local fallback is ready.
    if(!chosen || !await loadImg(chosen)){
      chosen=local;
      if(chosen)await loadImg(chosen,2500);
    }
    if(!chosen){element.removeAttribute('src');element.alt='本幕尚未指定圖片';}
    else{element.src=chosen;element.alt=(node?.title||'場景')+'的背景圖片';}
  }
  function showChoices(node){
    const holder=$('scene-choices');holder.replaceChildren();
    for(const [i,opt] of (node.choices||[]).entries()){
      const button=document.createElement('button');button.type='button';button.className='choice';
      const title=document.createElement('span');title.textContent=String.fromCharCode(65+i)+'  '+opt.label;
      const arrow=document.createElement('span');arrow.textContent='→';arrow.className='arrow';
      button.append(title,arrow);button.addEventListener('click',()=>pick(node,opt));holder.append(button);
    }
  }
  async function render(nodeId,node=null,after=''){
    const n=node||state.doc?.nodes?.[nodeId];
    if(!n)throw new Error('後台找不到節點 '+nodeId);
    state.nodeId=nodeId;
    if(n.type==='ending')return renderEnding(nodeId,n);
    await setSceneImage($('scene-img'),nodeId,n);
    clearNotice();view('play');
    $('play').classList.remove('scene-appear');void $('play').offsetWidth;$('play').classList.add('scene-appear');
    $('display-code').textContent=n.display_code||nodeId;
    $('scene-subhead').textContent='2875 / '+(n.display_code||'STORY');
    $('scene-title').textContent=n.title||'';
    $('scene-text').textContent=n.text||'';
    const extra=n.text_by_role?.[role()]||'';
    $('role-text').textContent=extra;$('role-text').classList.toggle('hidden',!extra);
    $('after-text').textContent=after;$('after-text').classList.toggle('hidden',!after);
    showChoices(n);
    const progress=Math.min(92,Math.round((state.history.length/16)*100));
    $('progress-fill').style.width=progress+'%';
    $('play-status').textContent=(demo?'本機測試 · 不寫入後台':'正式版 · 遊玩紀錄同步至 ConoHa')+' · 已選擇 '+state.history.length+' 次';
  }
  async function renderEnding(nodeId,node){
    state.endingId=node.ending_id;
    await setSceneImage($('end-img'),nodeId,node);
    clearNotice();view('ending');
    $('end-code').textContent='ENDING '+(node.ending_id||'');
    $('end-title').textContent=node.title||'';
    $('end-text').textContent=node.text||'';
    const extra=node.text_by_role?.[role()]||'';
    $('end-role').textContent=extra;$('end-role').classList.toggle('hidden',!extra);
    const elapsed=state.startedAt?Math.max(1,Math.round((Date.now()-Date.parse(state.startedAt))/1000)):0;
    $('run-summary').textContent=(demo?'本機測試，未寫入伺服器 · ':'結局已由 ConoHa 確認記錄 · ')+(node.ending_id||'')+' · '+Math.floor(elapsed/60)+' 分 '+elapsed%60+' 秒';
    $('progress-fill').style.width='100%';clearSession();
  }
  async function begin(){
    await curtainSwitch(async()=>{
      clearNotice();await loadStory();
      state.history=[];state.startedAt=new Date().toISOString();state.endingId=null;state.pending=null;
      if(demo){state.run={run_id:'demo-'+Date.now()};await render(state.doc.entry);}
      else {
        let started;
        try{started=await api('start',{slug:cfg.slug,revision:state.revision,player_id:anonymousId()});}
        catch(e){if(e.code!=='stale_story_reload')throw e;await loadStory(true);started=await api('start',{slug:cfg.slug,revision:state.revision,player_id:anonymousId()});}
        state.run={run_id:started.run_id,run_token:started.run_token};
        saveSession();await render(started.node_id);
      }
    });
  }
  async function pick(node,option){
    if(state.busy)return;
    if(state.pending&&(state.pending.node_id!==state.nodeId||state.pending.option_id!==option.id)){
      notify('上一次選擇可能已送達後台，但回覆尚未確認。請重新點選原選項，避免產生錯誤紀錄。');return;
    }
    await curtainSwitch(async()=>{
      let nextId,nextNode;
      if(demo){nextId=option.next;nextNode=state.doc.nodes[nextId];}
      else {
        if(!state.pending){state.pending={node_id:state.nodeId,option_id:option.id,event_key:crypto.randomUUID()};saveSession();}
        const reply=await api('choose',{...state.run,event_key:state.pending.event_key,option_id:option.id});
        nextId=reply.node_id;nextNode=reply.node||state.doc?.nodes?.[nextId];
      }
      state.history.push({node_id:state.nodeId,option_id:option.id});state.pending=null;saveSession();
      await render(nextId,nextNode,option.after_text||'');
    });
  }
  async function resume(){
    if(demo)return;
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem(sessionKey)||'null');}catch(_){}
    if(!saved?.run?.run_id||!saved?.run?.run_token)return;
    try{
      const reply=await api('resume',saved.run);
      state.run=saved.run;state.history=reply.history||saved.history||[];
      state.startedAt=saved.startedAt;state.pending=saved.pending||null;
      if(state.pending&&state.pending.node_id!==reply.node_id)state.pending=null;
      await render(reply.node_id,reply.node);
      if(state.pending)notify('前次選擇尚未確認，請重新點選同一選項。');
      if(reply.status==='finished')clearSession();
      else saveSession();
    }catch(e){clearSession();notify('無法恢復上次遊玩：'+describeError(e)+'。請重新開始。');}
  }
  $('begin').addEventListener('click',begin);
  $('again').addEventListener('click',()=>{clearSession();begin();});
  $('restart-top').addEventListener('click',()=>{if(state.busy)return;if($('home').classList.contains('hidden')&&!confirm('放棄目前進度，回到首頁？'))return;clearSession();view('home');clearNotice();});
  $('brand').addEventListener('click',event=>{event.preventDefault();if(state.busy)return;if($('home').classList.contains('hidden')&&!confirm('放棄目前進度，回到首頁？'))return;clearSession();view('home');clearNotice();});
  $('export-run').addEventListener('click',()=>{
    const record={mode:demo?'local-demo':'production',run_id:state.run?.run_id||null,revision:state.revision,started_at:state.startedAt,ending_id:state.endingId,choices:state.history};
    const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='2875-story-run-'+Date.now()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  });
  if(demoRequested&&!demo){
    notify('公開展示版已停用示範資料模式；請使用正式連線，或下載專用的本機測試包。');
    $('begin').disabled=true;
  }else {
    loadStory().then(resume).catch(error=>{
      notify('目前尚無法讀取正式劇情：'+describeError(error)+'。請確認 ConoHa 已發布 prod 版本，且 GitHub Origin 已被允許。');
    });
  }
})();
