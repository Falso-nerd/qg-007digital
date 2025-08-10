// area-de-membro/shared/menu.js
// Menu lateral único para TODAS as páginas da área de membro.
// Injeta HTML + CSS, controla submenus, ativa Admin por e-mail e marca item ativo.

// ========== CONFIG ==========
const ADMIN_EMAILS = ["admin@007digital.com.br"]; // ajuste sua lista

// Caminhos (relativos a /area-de-membro/)
const LINKS = {
  chat: "chats-ia.html",
  arquivos: "arquivos.html",
  geral: "geral.html",
  contaDarkHome: "../conta-dark/home-dark/index.html",
  contaDarkDownloads: "../conta-dark/home-dark/index.html#downloads",
  contaDarkEdicao: "../conta-dark/home-dark/index.html#edicao",
  contaDarkAgendador: "../conta-dark/home-dark/index.html#agendador",
  admin: "../admin/painel/index.html",
  home: "index.html",
  login: "login.html",
};

// ========== HTML ==========
const sidebarHTML = `
<aside class="sidebar">
  <button id="qgBtnToggle" class="menu-toggle" title="Abrir menu" type="button" aria-expanded="false">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" stroke-width="2"/>
      <path d="M7 9h10M7 12h10M7 15h10" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>

  <div class="logo">QG 007</div>

  <div class="pill-list">

    <button class="pill" data-link="chat">
      <span class="label">Chat IA</span>
    </button>

    <button class="pill" id="qgPillDark">
      <span class="label">Conta Dark</span>
      <span class="caret">⌄</span>
    </button>
    <div class="submenu" id="qgSubDark">
      <a data-link="contaDarkHome">Contas</a>
      <a data-link="contaDarkDownloads">Downloads</a>
      <a data-link="contaDarkEdicao">Edição</a>
      <a data-link="contaDarkAgendador">Agendador</a>
    </div>

    <button class="pill" id="qgPillGeral">
      <span class="label">Geral</span>
      <span class="caret">⌄</span>
    </button>
    <div class="submenu" id="qgSubGeral">
      <a data-link="arquivos">Arquivos</a>
      <a data-link="geral">Ferramentas/Conteúdos</a>
    </div>

    <button class="pill" id="qgPillAdmin" style="display:none" data-link="admin">
      <span class="label">Painel (Admin)</span>
    </button>

    <button class="pill" data-link="home">
      <span class="label">Voltar</span>
    </button>
  </div>

  <div class="side-foot">v1.0</div>
</aside>
`;

// ========== CSS (injeção) ==========
const css = `
:root{
  --bg:#0d0d0d; --bg2:#1a1a1a; --glass:rgba(255,255,255,.06);
  --borda:rgba(255,255,255,.12); --verde:#00ff88;
  --sbw-closed:68px; --sbw-open:280px;
}
.qg-menu-ready body{ display:grid; grid-template-columns:var(--sbw-closed) 1fr; min-height:100%; }
.qg-open body{ grid-template-columns:var(--sbw-open) 1fr; }

.sidebar{
  position:sticky; top:0; height:100vh; padding:12px;
  background:#0f0f10; border-right:1px solid #222;
  display:flex; flex-direction:column; gap:12px; overflow:hidden; z-index:50;
}
.menu-toggle{
  width:44px; height:44px; border-radius:12px; border:1px solid var(--borda);
  background:#000; color:#fff; display:grid; place-items:center; cursor:pointer;
  transition:transform .08s ease, background .2s ease;
}
.menu-toggle:hover{ transform:translateY(-1px); background:#0b0b0b }

.logo{
  margin-top:6px; padding:8px 14px; border-radius:12px; border:1px solid var(--borda);
  background:#000; font-weight:900; letter-spacing:.5px; text-transform:uppercase;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  opacity:0; transform:translateX(-6px); transition:opacity .2s, transform .2s;
}
.qg-open .logo{ opacity:1; transform:none; }

.pill-list{
  margin-top:6px; display:flex; flex-direction:column; gap:10px;
  opacity:0; transform:translateX(-8px); transition:opacity .2s, transform .2s, max-height .25s ease;
  max-height:0;
}
.qg-open .pill-list{ opacity:1; transform:none; max-height:1000px; }

.pill{
  background:#151515; border:1px solid var(--borda); color:#fff;
  padding:12px 14px; border-radius:14px; display:flex; align-items:center; justify-content:space-between;
  gap:10px; cursor:pointer; transition:transform .08s ease, background .2s ease, box-shadow .2s ease;
}
.pill:hover{ transform:translateY(-1px); background:#181818; box-shadow:0 0 10px rgba(255,255,255,.04) }
.pill .label{ font-weight:700 }
.caret{ transition:transform .2s ease }

.submenu{
  border-left:2px solid rgba(255,255,255,.08);
  margin-left:8px; padding-left:8px; display:none;
}
.submenu a{
  display:block; color:#fff; text-decoration:none; padding:10px 12px; border-radius:10px;
  border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04);
  margin-top:8px; transition:background .2s, transform .08s;
}
.submenu a:hover{ background:rgba(255,255,255,.08); transform:translateX(2px) }

/* marca item ativo (por pathname) */
.pill[data-active="true"],
.submenu a[data-active="true"]{
  outline:2px solid var(--verde);
  background:#1c1c1c;
}
.side-foot{margin-top:auto; font-size:12px; color:#aaa}
`;

// ========== Helpers ==========
function injectStyle() {
  if (document.getElementById("qg-menu-style")) return;
  const s = document.createElement("style");
  s.id = "qg-menu-style";
  s.textContent = css;
  document.head.appendChild(s);
}

function injectSidebar() {
  let target = document.getElementById("sidebar-root");
  if (!target) {
    target = document.createElement("div");
    target.id = "sidebar-root";
    document.body.prepend(target);
  }
  target.innerHTML = sidebarHTML;
  document.documentElement.classList.add("qg-menu-ready");
}

function bindBasics() {
  const html = document.documentElement;
  const btn = document.getElementById("qgBtnToggle");
  btn?.addEventListener("click", () => {
    const open = html.classList.toggle("qg-open");
    btn.setAttribute("aria-expanded", String(open));
  });

  // fechar clicando fora
  document.addEventListener("click", (e) => {
    if (!html.classList.contains("qg-open")) return;
    if (!e.target.closest(".sidebar")) html.classList.remove("qg-open");
  });

  // submenus
  function bindSub(pillId, subId){
    const pill = document.getElementById(pillId);
    const sub  = document.getElementById(subId);
    if(!pill || !sub) return;
    pill.addEventListener("click", ()=>{
      const open = sub.style.display === "block";
      sub.style.display = open ? "none" : "block";
      const caret = pill.querySelector(".caret");
      if (caret) caret.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
    });
  }
  bindSub("qgPillDark","qgSubDark");
  bindSub("qgPillGeral","qgSubGeral");

  // navegação pelos data-link
  document.querySelectorAll('[data-link]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const key = el.getAttribute('data-link');
      const href = LINKS[key];
      if (href) location.href = href;
    });
  });

  // marcar ativo pelo pathname (simples)
  const here = location.pathname.split("/").pop() || "index.html";
  const activeMap = {
    "index.html": ["home"],
    "chats-ia.html": ["chat"],
    "arquivos.html": ["arquivos"],
    "geral.html": ["geral"],
  };
  const actKeys = activeMap[here] || [];
  actKeys.forEach(k=>{
    const el = document.querySelector(`[data-link="${k}"]`);
    if (el) el.setAttribute("data-active","true");
  });
}

// ========== Firebase (mostrar admin) ==========
async function enableAdminIfAuthorized() {
  // Carrega Firebase via módulos CDN e inicializa se necessário
  const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

  const firebaseConfig = {
    apiKey: "AIzaSyD3qLC0mq0snYDVjgcMqlxpotgALTHd0uY",
    authDomain: "qg007-b890a.firebaseapp.com",
    projectId: "qg007-b890a",
    storageBucket: "qg007-b890a.firebasestorage.app",
    messagingSenderId: "230480486221",
    appId: "1:230480486221:web:a232dcd4d9225ab254e104"
  };

  if (getApps().length === 0) initializeApp(firebaseConfig);
  const auth = getAuth();

  onAuthStateChanged(auth, (user)=>{
    const btnAdmin = document.getElementById("qgPillAdmin");
    if (!btnAdmin) return;
    const ok = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
    btnAdmin.style.display = ok ? "flex" : "none";
  });
}

// ========== Boot ==========
(function boot(){
  injectStyle();
  injectSidebar();
  bindBasics();
  enableAdminIfAuthorized();
})();
