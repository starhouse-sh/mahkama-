// daira-core.js - بيحول كل الصفحات للدايرة اللي اخترتها
(function(){
  const daira = localStorage.getItem('current_daira') || localStorage.getItem('DAIRA') || '32';
  window.CURRENT_DAIRA = daira;
  window.DAIRA_NUM = daira;

  const origOpen = indexedDB.open.bind(indexedDB);
  indexedDB.open = function(name, version){
    if(typeof name === 'string'){
      if(name === 'D32_DB' || name === 'D32DB' || name.indexOf('D32') === 0){
        name = 'D' + daira + '_DB';
      }
      if(name === 'D32_DB_V3' || name === 'D32_V3'){
        name = 'D' + daira + '_DB';
      }
    }
    return origOpen(name, version);
  };

  const origGet = Storage.prototype.getItem;
  const origSet = Storage.prototype.setItem;
  function mapKey(k){
    if(typeof k !== 'string') return k;
    if(k.indexOf('D32_') === 0) return 'D' + daira + '_' + k.slice(4);
    if(k === 'D32_DB') return 'D' + daira + '_DB';
    return k;
  }
  Storage.prototype.getItem = function(k){ return origGet.call(this, mapKey(k)); };
  Storage.prototype.setItem = function(k,v){ return origSet.call(this, mapKey(k), v); };
})();
