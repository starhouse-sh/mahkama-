 // D32_auto_backup.js - حط الملف ده جنب index.html
// ويشتغل تلقائي مع الموقع
(function(){
  const WEBHOOK='https://mmn108855.app.n8n.cloud/webhook/d32-backup';
  const DB_NAME='D32_DB';

  function openDB(){return new Promise((res,rej)=>{let r=indexedDB.open(DB_NAME,2);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}

  async function backup(isAuto=false){
    try{
      let db=await openDB();
      let tx=db.transaction(['ahkam','cases'],'readonly');
      let r1=tx.objectStore('ahkam').get('D32_AHKAM');
      let r2=tx.objectStore('cases').get('D32_V3');
      let ahkam=[], mot=[];
      await new Promise(d=>{
        let c=0; const chk=()=>{c++; if(c==2) d();};
        r1.onsuccess=()=>{ try{let a=JSON.parse(r1.result); if(Array.isArray(a[1])) a=a[1]; ahkam=a||[];}catch{} chk(); };
        r1.onerror=()=>chk();
        r2.onsuccess=()=>{ try{let a=JSON.parse(r2.result); if(Array.isArray(a[1])) a=a[1]; mot=a||[];}catch{} chk(); };
        r2.onerror=()=>chk();
      });
      if(ahkam.length===0 && mot.length===0) return;
      let payload={source:isAuto?'D32_Auto_With_Site':'D32_Auto_First_Open', timestamp:new Date().toISOString(), stats:{ahkam:ahkam.length, motadawal:mot.length, total:ahkam.length+mot.length}, data:{D32_AHKAM:ahkam, D32_V3:mot}};
      await fetch(WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      console.log('✅ D32 Auto Backup:', payload.stats, isAuto?'(تلقائي كل ساعة)':'(فتح الموقع)');
      localStorage.setItem('_D32_LAST_AUTO', new Date().toISOString());
    }catch(e){ console.log('Auto backup error', e); }
  }

  // 1- أول ما الموقع يفتح بعد 3 ثواني يرفع
  window.addEventListener('load', ()=>{ setTimeout(()=>backup(false), 3000); });

  // 2- كل ساعة يرفع تلقائي طول ما الموقع مفتوح
  setInterval(()=>backup(true), 3600000);

  // 3- أول ما تحفظ أي حكم يرفع بعد ثانيتين
  let _origSaveAhkam=null, _origSaveMot=null;
  let _timer=null;
  function hookSave(){
    if(window.saveAllAhkam &&!_origSaveAhkam){
      _origSaveAhkam=window.saveAllAhkam;
      window.saveAllAhkam=function(){ _origSaveAhkam.apply(this,arguments); clearTimeout(_timer); _timer=setTimeout(()=>backup(true),2000); };
    }
    if(window.saveAllMotadawal &&!_origSaveMot){
      _origSaveMot=window.saveAllMotadawal;
      window.saveAllMotadawal=function(){ _origSaveMot.apply(this,arguments); clearTimeout(_timer); _timer=setTimeout(()=>backup(true),2000); };
    }
  }
  let hookInterval=setInterval(()=>{ hookSave(); if(_origSaveAhkam && _origSaveMot) clearInterval(hookInterval); },1000);
})();