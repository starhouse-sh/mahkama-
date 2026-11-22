// daira-core.js - نسخة آمنة
try{
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOTKlstkN7iqYr9IX_CM43EKs6ViBDpMcNJH7s3tU-52LCRIQAFjbI7sx_AD240A/exec';
  window.SCRIPT_URL = SCRIPT_URL;
  window.MY_DAIRA = localStorage.getItem('MY_DAIRA');
  window.DAIRA_PASS = localStorage.getItem('DAIRA_PASS');
  window.showUpdateNeeded = function(){
    let div = document.createElement('div');
    div.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#C9A227; color:#0b1e3a; text-align:center; padding:12px; z-index:99999';
    div.innerHTML = '🔄 التطبيق يحتاج إلى تحديث من الإنترنت - يجب أن تتصل بالنت لإجراء بعض التحديثات.';
    document.body.appendChild(div);
  };
  window.checkLicense = function(){
    try{
      let last = parseInt(localStorage.getItem('LAST_ONLINE_CHECK') || '0');
      let diffDays = (Date.now() - last) / (1000*60*60*24);
      if(last !== 0 && diffDays > 7 && !navigator.onLine){ showUpdateNeeded(); }
      if(navigator.onLine){ localStorage.setItem('LAST_ONLINE_CHECK', Date.now().toString()); }
    }catch(e){}
  };
  window.addEventListener('load', checkLicense);
  window.syncWithDrive = async function(){
    try{
      let res = await fetch(`${SCRIPT_URL}?action=get&daira=${window.MY_DAIRA}`).then(r=>r.json());
      if(res && res.error === 'update_needed'){ showUpdateNeeded(); return null; }
      return res;
    }catch(e){ return null; }
  };
  window.uploadToDrive = async function(data){
    try{
      data._password = window.DAIRA_PASS;
      data._daira = window.MY_DAIRA;
      await fetch(`${SCRIPT_URL}?daira=${window.MY_DAIRA}`, {method:'POST', body: JSON.stringify(data)});
      localStorage.setItem('LAST_ONLINE_CHECK', Date.now().toString());
    }catch(e){}
  };
}catch(e){}