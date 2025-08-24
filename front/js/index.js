// index.js — Clean launcher interactions (GPU friendly)
document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const loginBtn  = $('#login-btn');
  const logoutBtn = $('#logout-btn');
  const openBtn   = $('#open-launcher');
  const launcher  = $('#launcher');
  const grid      = $('.grid', launcher);
  const scrollHint= $('.scroll-hint');
  const yearEl    = $('#year');

  // Year stamp
  yearEl.textContent = new Date().getFullYear();

  // Auth state
  const token    = localStorage.getItem('x-access-token');
  const userRole = localStorage.getItem('user-role');

  if (token) {
    loginBtn?.classList.add('hidden');
    logoutBtn?.classList.remove('hidden');
    if (userRole !== 'admin') $$('.admin-only').forEach(el => el.style.display = 'none');
  } else {
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    $$('.admin-only').forEach(el => el.style.display = 'none');
  }

  // Logout
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('user-role');
    alert('로그아웃 되었습니다.');
    window.location.replace('./signin.html');
  }, { passive: true });

  // Open launcher: scroll + set expanded state (accessibility)
  const openLauncher = () => {
    if (!launcher) return;
    openBtn.setAttribute('aria-expanded', 'true');
    launcher.classList.add('show');
    launcher.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  openBtn?.addEventListener('click', openLauncher, { passive: true });
  scrollHint?.addEventListener('click', openLauncher, { passive: true });

  // App tile click -> quick tap feedback then navigate (event delegation)
  grid?.addEventListener('click', (e) => {
    const a = e.target.closest('a.app');
    if (!a) return;
    e.preventDefault();
    // quick tap animation via class
    a.classList.add('tap');
    setTimeout(() => {
      window.location.href = a.getAttribute('href');
    }, 160);
  });

  // Intersection observer for entrance animations (single observer)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });

    $$('.app', grid).forEach((tile, i) => {
      tile.style.setProperty('--stagger', `${i * 30}ms`);
      io.observe(tile);
    });
  } else {
    // fallback: show instantly
    $$('.app', grid).forEach((tile) => tile.classList.add('in'));
  }
});
