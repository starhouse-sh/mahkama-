let DATA=[];
try{DATA=JSON.parse(localStorage.getItem('DATA32_FINAL')||'[]');}catch(e){DATA=[];}
function saveData(){localStorage.setItem('DATA32_FINAL',JSON.stringify(DATA));let el=document.getElementById('countAll'); if(el) el.textContent=DATA.length;}
function norm(s){return String(s||'').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[أإآ]/g,'ا').replace(/\s+/g,'').toLowerCase();}
function showPage(name){
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  let btn=document.getElementById('b_'+name); if(btn) btn.classList.add('active');
  let c=document.getElementById('app-container');
  if(name==='import'){
    c.innerHTML=<div style="background:#fff;padding:16px;border-radius:12px"><h3>📥 استيراد المتداول</h3><p style="background:#eef2ff;padding:8px;border-radius:6px;font-size:11px">رقم_الاستئناف / سنة_الاستئناف / اسم_المستأنف / اسم_المستأنف_ضده / تاريخ_الجلسة / قرار_الجلسة / حالة_القضية / كود_القاضي</p><input type="file" id="fileInput" accept=".csv"><button onclick="doImport()" style="background:#0f1f3a;color:#fff;padding:8px 14px;border:none;border-radius:6px">استيراد</button><div id="log" style="margin-top:10px;background:#f9f9f9;padding:10px;border-radius:8px"></div></div>;
  }
  if(name==='sessions'){
    c.innerHTML=<div style="background:#fff;padding:16px;border-radius:12px"><h3>📅 الجلسات والتسديد</h3><input type="date" id="qsDate"><button onclick="searchS()" style="background:#0f1f3a;color:#fff;padding:6px 12px;border:none;border-radius:6px">بحث</button><button onclick="openTasdeed()" style="background:#c89b2a;color:#fff;padding:6px 12px;border:none;border-radius:6px">💰 تسديد جماعي</button><div id="resS" style="margin-top:12px"></div></div>;
    setTimeout(searchS,100);
  }
  if(name==='ahkam'){c.innerHTML=<div style="background:#fff;padding:16px;border-radius:12px"><h3>الأحكام</h3><p>العدد: ${DATA.length}</p></div>;}
  if(name==='appeals'){
    let html=DATA.slice(0,100).map(d=><tr><td>${d.raqm}</td><td>${d.sana}</td><td>${d.mostanef}</td><td>${d.hala}</td></tr>).join('');
    c.innerHTML=<div style="background:#fff;padding:16px;border-radius:12px"><h3>كل الاستئنافات (${DATA.length})</h3><table border="1" style="width:100%;border-collapse:collapse"><tr><th>رقم</th><th>سنة</th><th>مستأنف</th><th>حالة</th></tr>${html}</table></div>;
  }
}
function doImport(){
  let file=document.getElementById('fileInput').files[0]; if(!file){alert('اختار ملف');return;}
  let rd=new FileReader();
  rd.onload=function(e){
    let text=e.target.result.replace(/^\uFEFF/,''); let lines=text.split(/\r?\n/).filter(l=>l.trim()!=='');
    let delim=(lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length?';':',';
    let raw=lines[0].split(delim).map(x=>x.replace(/"/g,'').trim()); let normH=raw.map(norm);
    function find(keys){for(let k of keys){let nk=norm(k);let idx=normH.findIndex(h=>h.includes(nk)); if(idx>=0) return idx;} return -1;}
    let mp={raqm:find(['رقم الاستئناف']),sana:find(['سنه الاستئناف']),mostanef:find(['اسم المستأنف']),ded:find(['المستأنف ضده']),sessDate:find(['تاريخ الجلسه']),sessQarar:find(['قرار الجلسه']),hala:find(['حاله القضيه']),judge:find(['كود القاضي'])};
    let groups={};
    for(let i=1;i<lines.length;i++){
      let cols=lines[i].split(delim).map(x=>x.replace(/"/g,'').trim());
      let g=(k)=>{let idx=mp[k]; return idx>=0&&idx<cols.length?cols[idx]:'';};
      let aNum=g('raqm'); if(!aNum) continue;
      let key=aNum+'_'+g('sana');
      if(!groups[key]) groups[key]={raqm:aNum,sana:g('sana'),mostanef:g('mostanef'),ded:g('ded'),hala:g('hala')||'متداولة',judge:g('judge'),jalsat:[]};
      if(g('sessDate')) groups[key].jalsat.push({tarikh:g('sessDate'),qarar:g('sessQarar')});
    }
    DATA=Object.values(groups); saveData();
    document.getElementById('log').innerHTML='✅ تم استيراد '+DATA.length+'<br>الأعمدة: '+raw.join(' | ');
    showPage('sessions');
  };
  rd.readAsText(file,'UTF-8');
}
function searchS(){
  let d=document.getElementById('qsDate'); let div=document.getElementById('resS'); if(!div) return;
  let list=DATA; if(d&&d.value) list=DATA.filter(x=>x.jalsat.some(j=>j.tarikh===d.value));
  if(list.length===0){div.innerHTML='مفيش بيانات - استورد الأول';return;}
  div.innerHTML='<table border="1" style="width:100%;border-collapse:collapse"><tr><th>رقم</th><th>سنة</th><th>مستأنف</th><th>تاريخ</th></tr>'+list.map(x=><tr><td>${x.raqm}</td><td>${x.sana}</td><td>${x.mostanef}</td><td>${x.jalsat[0]?.tarikh||''}</td></tr>).join('')+'</table>';
}
function openTasdeed(){let d=document.getElementById('qsDate'); if(!d||!d.value){alert('اختار تاريخ الجلسة الأول');return;} document.getElementById('tasdeedDateLabel').textContent=d.value; document.getElementById('modalTasdeed').style.display='flex';}
function confirmTasdeed(){let qarar=document.getElementById('tasdeedQarar').value; let next=document.getElementById('tasdeedNext').value; let date=document.getElementById('qsDate').value; if(!qarar){alert('اكتب القرار');return;} let c=0; DATA.forEach(it=>{it.jalsat.forEach(j=>{if(j.tarikh===date){j.qarar=qarar;c++;}}); if(next&&it.jalsat.some(j=>j.tarikh===date)) it.jalsat.push({tarikh:next,qarar:''});}); saveData(); closeModal('modalTasdeed'); searchS(); alert('تم تسديد '+c);}
function closeModal(id){document.getElementById(id).style.display='none';}
window.onload=function(){saveData(); showPage('import');};