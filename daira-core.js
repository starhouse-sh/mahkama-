// daira-core.js - كل دايرة ليها ملف لوحده
function getCurrentDaira() {
  return localStorage.getItem('current_daira') || '32';
}

// اسم ملف الدرايف حسب الدايرة
function getDairaFileName() {
  const d = getCurrentDaira();
  return `D${d}_DB_latest.json`;
}

// ده اللي هتعدله في index.html
// بدل ما كنت كاتب رابط ثابت لملف واحد، هتستخدم ده

/* 
مثال للاستخدام في index.html :

const FOLDER_ID = 'ID_الفولدر_بتاعك_على_درايف'; // نفس الفولدر اللي فيه الـ 39 ملف
const fileName = getDairaFileName(); // هيطلع مثلا D5_DB_latest.json لو انت د/5

// بعدها تجيب الملف من الدرايف بالاسم
const url = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}'+and+'${FOLDER_ID}'+in+parents&key=YOUR_API_KEY&fields=files(id,name)`;

fetch(url).then(r=>r.json()).then(data=>{
  if(data.files && data.files.length>0){
    const fileId = data.files[0].id;
    // حمل محتوى الملف
    return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=YOUR_API_KEY`);
  } else {
    console.log('مفيش ملف للدائرة دي لسه');
    return null;
  }
})

*/

// لو بتستخدم Apps Script Web App
function getDairaDataUrl() {
  const d = getCurrentDaira();
  // حط هنا رابط الـ Web App بتاعك + ?daira=D5
  const BASE_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  return `${BASE_URL}?daira=D${d}`;
}

// عرض رقم الدائرة في الصفحة
function showDairaNumber() {
  const el = document.getElementById('current-daira-display');
  if (el) el.textContent = 'دائرة ' + getCurrentDaira();
}
document.addEventListener('DOMContentLoaded', showDairaNumber);
