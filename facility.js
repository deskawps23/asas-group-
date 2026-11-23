import { getEligibilityDecision } from './eligibility-client.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. OTOMATIS PASANG ANIMASI SCROLL KE SECTION (Tahap 2)
  const sections = document.querySelectorAll('section');
  sections.forEach(sec => {
    // Jangan pasang animasi di hero-section (biar langsung muncul di awal)
    if (!sec.classList.contains('hero-section')) {
      sec.classList.add('reveal-on-scroll');
    }
  });

  // 2. FUNGSI NAVIGASI BAWAAN
  const navButtons = document.querySelectorAll('[data-nav], .btn-header');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.nav;
      if (target) {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (btn.classList.contains('btn-header')) {
        alert("Order Saya belum tersedia di versi pilot.");
      }
    });
  });

  // 3. LOGIKA ELIGIBILITY (Tahap 1)
  const actionButtons = document.querySelectorAll('button, a');
  actionButtons.forEach(btn => {
    if (btn.innerText.includes('Pesan Sekarang') || btn.innerText.toLowerCase().includes('setrika')) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const originalHTML = btn.innerHTML;
        btn.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        btn.style.transform = 'scale(0.90)';
        btn.style.pointerEvents = "none";

        setTimeout(() => {
          btn.style.transform = 'scale(1)';
          btn.innerHTML = `
            <span style="display:inline-flex; align-items:center; justify-content:center; gap:8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" style="stroke-dasharray: 60; stroke-dashoffset: 0; transform-origin: center; animation: spin 1s linear infinite;"></circle>
              </svg>
              Memproses...
            </span>`;
        }, 150);

        try {
          const decision = await getEligibilityDecision('dummy-person-id');
          await new Promise(resolve => setTimeout(resolve, 600));

          if (!document.startViewTransition) {
            btn.innerHTML = originalHTML;
            btn.style.pointerEvents = "auto";
            showToast("Anda siap melanjutkan pesanan.", "success");
          } else {
            document.startViewTransition(() => {
              btn.innerHTML = originalHTML;
              btn.style.pointerEvents = "auto";
              showToast("Anda siap melanjutkan pesanan.", "success");
            });
          }
        } catch (error) {
          btn.innerHTML = originalHTML;
          btn.style.pointerEvents = "auto";
          showToast("Terjadi kendala teknis.", "error");
        }
      });
    }
  });
});

function showToast(message, type) {
  const old = document.getElementById('asas-toast');
  if (old) old.remove();

  let bgColor = type === "success" ? "#059669" : "#dc2626"; 
  let icon = type === "success" 
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  const toast = document.createElement('div');
  toast.id = 'asas-toast';
  toast.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translate(-50%, 30px) scale(0.9);
    background-color: ${bgColor}; color: white; padding: 14px 20px; border-radius: 12px;
    font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    z-index: 9999; opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    white-space: nowrap;
  `;
  
  toast.innerHTML = `${icon} <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0) scale(1)';
  }, 50);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 10px) scale(0.9)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
