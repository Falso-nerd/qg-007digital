/**
 * QG Auto Menu Loader
 * Injeta CSS, carrega o menu.html e menu.js em qualquer página.
 * Não aparece nas páginas inicial, login e cadastro.
 */
(function () {
  // Bloqueio automático
  const BLOCKED = [
    /^\/00-login\/inicial\/frontend\/.*$/i,
    /^\/00-login\/login\/frontend\/.*$/i,
    /^\/00-login\/cadastro\/frontend\/.*$/i,
  ];
  if (BLOCKED.some(rx => rx.test(location.pathname))) return;

  const BASE = "/04-header/menu-lateral/frontend";

  // Injeta CSS
  const cssHref = `${BASE}/menu.css`;
  const hasCSS = Array.from(document.styleSheets).some(s => s.href && s.href.includes(cssHref));
  if (!hasCSS) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssHref;
    document.head.appendChild(link);
  }

  // Botão hamburguer
  const btn = document.createElement('button');
  btn.id = 'qg-hamburger';
  btn.setAttribute('aria-label', 'Abrir menu');
  btn.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="2" rx="1" stroke="white"/>
      <rect x="3" y="11" width="18" height="2" rx="1" stroke="white"/>
      <rect x="3" y="16" width="18" height="2" rx="1" stroke="white"/>
    </svg>
  `;
  Object.assign(btn.style, {
    position: 'fixed',
    top: '14px',
    left: '14px',
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: '#111',
    border: '1px solid #2b2b2b',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    zIndex: '1100',
    boxShadow: '0 2px 8px rgba(0,0,0,.3)'
  });
  btn.addEventListener('mouseenter', () => btn.style.outline = '2px solid rgba(34,197,94,.4)');
  btn.addEventListener('mouseleave', () => btn.style.outline = 'none');

  // Ao clicar no hamburguer, carrega e abre menu
  btn.addEventListener('click', async () => {
    if (!document.getElementById('qg-drawer')) {
      try {
        const html = await fetch(`${BASE}/menu.html`, { cache: 'no-cache' }).then(r => r.text());
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        // Carrega script do menu
        const s = document.createElement('script');
        s.src = `${BASE}/menu.js`;
        s.defer = true;
        document.body.appendChild(s);

        // Mostra drawer
        setTimeout(() => {
          document.getElementById('qg-drawer').classList.add('open');
          document.getElementById('qg-backdrop').hidden = false;
        }, 50);
      } catch (e) {
        console.error('Erro ao carregar menu:', e);
      }
    } else {
      document.getElementById('qg-drawer').classList.add('open');
      document.getElementById('qg-backdrop').hidden = false;
    }
  });

  document.body.appendChild(btn);
})();
