// زر تثبيت التطبيق - يظهر أول ما الموقع يفتح
let deferredPrompt = null;
let installBtn = null;

function createInstallButton() {
  if (document.getElementById('custom-install-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'custom-install-btn';
  btn.innerHTML = '📱 ثبّت التطبيق';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #f8d775;
    color: #333;
    border: none;
    padding: 12px 28px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 99999;
    cursor: pointer;
    display: none;
    font-family: inherit;
  `;
  
  btn.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      btn.style.display = 'none';
    }
    deferredPrompt = null;
  };

  document.body.appendChild(btn);
  installBtn = btn;
}

// اسمع حدث التثبيت
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  createInstallButton();
  // اظهر الزرار بعد ثانية
  setTimeout(() => {
    if (installBtn) installBtn.style.display = 'block';
  }, 1000);
});

// لو التطبيق اتثبت قبل كده اخفي الزرار
window.addEventListener('appinstalled', () => {
  if (installBtn) installBtn.style.display = 'none';
  deferredPrompt = null;
});

// انشئ الزرار أول ما الصفحة تحمل (عشان يبقى جاهز)
document.addEventListener('DOMContentLoaded', createInstallButton);
