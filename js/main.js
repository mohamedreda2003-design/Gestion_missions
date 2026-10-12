/* =========================================
   INITIALISATION
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

/* =========================================
   TOASTS (Messages de notification)
   ========================================= */
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) { alert(message); return; }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 15px 25px;
    border-radius: 5px;
    margin-bottom: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    font-family: sans-serif;
    font-weight: bold;
    animation: slideIn 0.3s ease-out;
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
  `;
  toast.innerHTML = (type === 'success' ? '✓ ' : '✗ ') + message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
};