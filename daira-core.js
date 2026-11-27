// daira-core.js - موديول موحد لبيانات الدائرة - 7 أعضاء + نيابة + أمين سر + دور + فترة
function getCurrentDaira() {
  try{
    return localStorage.getItem('current_daira') || localStorage.getItem('DAIRA') || (window.parent && window.parent.localStorage ? window.parent.localStorage.getItem('current_daira') : null) || '32';
  }catch(e){ return '32'; }
}

function cleanVal(v){
  if(v===null||v===undefined) return '';
  if(typeof v==='string'){
    if(v==='[object Object]'||v.includes('[object Object]')) return '';
    return v.trim();
  }
  if(typeof v==='object'){
    return (v.name||v.raees||v.text||v.value||'').toString().trim();
  }
  return String(v).trim();
}

// دالة موحدة تجيب بيانات الدائرة من أي مكان (parent, localStorage, IndexedDB, Drive)
async function getDairaInfo(callback){
  let info = null;
  let daira = getCurrentDaira();
  
  // 1. جرب من parent لو انت جوه iframe
  try{
    if(window.parent && window.parent!==window){
      let pLS = window.parent.localStorage;
      if(pLS){
        let raw = pLS.getItem('D'+daira+'_DAIRA_INFO') || pLS.getItem('DAIRA_INFO_'+daira) || pLS.getItem('daira_info');
        if(raw){ info = JSON.parse(raw); }
      }
      if(!info && window.parent.getDairaInfoSync){
        info = window.parent.getDairaInfoSync();
      }
    }
  }catch(e){}

  // 2. جرب localStorage الحالي
  if(!info){
    try{
      let raw = localStorage.getItem('D'+daira+'_DAIRA_INFO') || localStorage.getItem('DAIRA_INFO_'+daira) || localStorage.getItem('daira_info');
      if(raw) info = JSON.parse(raw);
    }catch(e){}
  }

  // 3. جرب IndexedDB
  if(!info){
    try{
      let dbName = 'D'+daira+'_DB';
      let req = indexedDB.open(dbName, 2);
      info = await new Promise((res)=>{
        req.onsuccess = (e)=>{
          let db=e.target.result;
          try{
            let tx=db.transaction('d32store','readonly');
            let keys=['D'+daira+'_DAIRA_INFO','D'+daira+'_DAIRA_CONFIG','D32_DAIRA_INFO','D32_CIRCLE'];
            let idx=0;
            function tryNext(){
              if(idx>=keys.length){ res(null); return; }
              let k=keys[idx++];
              try{
                let q=tx.objectStore('d32store').get(k);
                q.onsuccess=()=>{
                  if(q.result){
                    try{ let d=JSON.parse(q.result); res(d); return; }catch(e){ tryNext(); }
                  } else { tryNext(); }
                };
                q.onerror=()=>tryNext();
              }catch(e){ tryNext(); }
            }
            tryNext();
          }catch(e){ res(null); }
        };
        req.onerror=()=>res(null);
      });
    }catch(e){}
  }

  // 4. نظف البيانات
  if(info){
    // نظف [object Object]
    let members = Array.isArray(info.members) ? info.members.map(cleanVal) : [];
    // لو members فاضي جرب الحقول المنفصلة
    if(members.length===0 || members.every(m=>!m)){
      members = [
        cleanVal(info.raees),
        cleanVal(info.odw2 || info.yameen),
        cleanVal(info.odw3 || info.shamal),
        cleanVal(info.odw4),
        cleanVal(info.odw5),
        cleanVal(info.odw6),
        cleanVal(info.odw7)
      ];
    }
    info.raees = members[0] || cleanVal(info.raees);
    info.odw2 = members[1] || '';
    info.odw3 = members[2] || '';
    info.odw4 = members[3] || '';
    info.odw5 = members[4] || '';
    info.odw6 = members[5] || '';
    info.odw7 = members[6] || '';
    info.members = members;
    info.dawr = cleanVal(info.dawr);
    info.fatra = cleanVal(info.fatra);
    info.raeesNiyaba = cleanVal(info.raeesNiyaba);
    info.ameenSerr = cleanVal(info.ameenSerr || info.ameen);
    info.maw3ed = info.dawr && info.fatra ? (info.dawr + ' - ' + info.fatra) : (info.maw3ed || '');
  }

  if(callback && typeof callback==='function') callback(info);
  return info;
}

function getDairaInfoSync(){
  try{
    let daira=getCurrentDaira();
    let raw=localStorage.getItem('D'+daira+'_DAIRA_INFO') || localStorage.getItem('DAIRA_INFO_'+daira) || localStorage.getItem('daira_info');
    if(raw){
      let info=JSON.parse(raw);
      if(info){
        let members=Array.isArray(info.members)?info.members.map(cleanVal):[];
        if(members.length===0) members=[cleanVal(info.raees),cleanVal(info.odw2||info.yameen),cleanVal(info.odw3||info.shamal),cleanVal(info.odw4),cleanVal(info.odw5),cleanVal(info.odw6),cleanVal(info.odw7)];
        info.members=members;
        info.raees=members[0]||'';
        return info;
      }
    }
  }catch(e){}
  return null;
}

// دالة تساعد صفحات المحاضر تعرض التشكيل
async function renderDairaHeader(containerId){
  let info = await getDairaInfo();
  let el = document.getElementById(containerId);
  if(!el) return;
  if(!info || (!info.raees && !info.members?.some(m=>m))){
    el.innerHTML='<div style="padding:8px;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;font-size:12px">لم يتم إدخال بيانات الدائرة بعد - ادخل من ⚙ بيانات الدائرة</div>';
    return;
  }
  let html='<div style="background:#0A2342;color:#FFD700;padding:10px;border-radius:8px;font-size:12px;line-height:1.8">';
  html+='<b>دائرة '+ (info.dairaNumber||info.daira||getCurrentDaira()) +' - '+ (info.dawr||'') +' '+ (info.fatra||'') +'</b><br>';
  if(info.raees) html+='رئيس الدائرة: <b>'+info.raees+'</b><br>';
  for(let i=1;i<info.members.length;i++){
    if(info.members[i]) html+='العضو '+(i+1)+': '+info.members[i]+'<br>';
  }
  if(info.raeesNiyaba) html+='رئيس النيابة: '+info.raeesNiyaba+'<br>';
  if(info.ameenSerr) html+='أمين السر: '+info.ameenSerr+'<br>';
  html+='</div>';
  el.innerHTML=html;
}

// للتوافق مع الكود القديم
function showDairaNumber() {
  const el = document.getElementById('current-daira-display');
  if (el) el.textContent = 'دائرة ' + getCurrentDaira();
}
document.addEventListener('DOMContentLoaded', showDairaNumber);
