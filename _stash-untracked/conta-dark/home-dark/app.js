// conta-dark/home-dark/app.js
// ===== Dropdown + Tabs + Firebase Auth (gate) + Conectar Instagram (Profile API) =====

// ---------------- Dropdown "Conta Dark" ----------------
const dropdown = document.getElementById('menuContaDark');
const btnToggle = document.getElementById('btnContaDark');
const panel = document.getElementById('listaContaDark');

function toggleDropdown(force) {
  const shouldOpen = typeof force === 'boolean' ? force : !dropdown.classList.contains('open');
  dropdown.classList.toggle('open', shouldOpen);
  btnToggle.setAttribute('aria-expanded', String(shouldOpen));
}
btnToggle.addEventListener('click', () => toggleDropdown());
btnToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
});
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
    btnToggle.setAttribute('aria-expanded','false');
  }
});

// ---------------- Abas ----------------
const links = panel.querySelectorAll('.nav a[data-tab]');
const sections = {
  inicio:    document.getElementById('tab-inicio'),
  config:    document.getElementById('tab-config'),
  downloads: document.getElementById('tab-downloads'),
  edicao:    document.getElementById('tab-edicao'),
  agendador: document.getElementById('tab-agendador'),
};

function ativarAba(tab) {
  links.forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  Object.entries(sections).forEach(([key, sec]) => sec.classList.toggle('active', key === tab));
  const target = Object.keys(sections).includes(tab) ? `#tab-${tab}` : '#tab-inicio';
  history.replaceState(null, '', target);
}
links.forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    ativarAba(a.dataset.tab);
    dropdown.classList.remove('open');
    btnToggle.setAttribute('aria-expanded','false');
  });
});
(function openFromHash() {
  const hash = (location.hash || '#tab-inicio').replace('#tab-','');
  if (sections[hash]) ativarAba(hash); else ativarAba('inicio');
})();

// ---------------- Firebase Auth (gate) ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3qLC0mq0snYDVjgcMqlxpotgALTHd0uY",
  authDomain: "qg007-b890a.firebaseapp.com",
  projectId: "qg007-b890a",
  storageBucket: "qg007-b890a.firebasestorage.app",
  messagingSenderId: "230480486221",
  appId: "1:230480486221:web:a232dcd4d9225ab254e104"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "../../login.html";
});
document.getElementById('btnSair')?.addEventListener('click', () => {
  signOut(auth).finally(() => window.location.href = "../../login.html");
});

// ---------------- Conectar Instagram (Profile API) ----------------
const API_BASE = "http://localhost:3201";
const LS_PROFILE = "qg007dark.igProfile";

// elementos UI (aba Config)
const btnConectar = document.getElementById('btnConectarIG');
const btnDesconectar = document.getElementById('btnDesconectarIG');
const statusConfig = document.getElementById('statusConfig');

const previewWrap = document.getElementById('perfilPreview');
const igAvatar = document.getElementById('igAvatar');
const igAt     = document.getElementById('igAt');
const igName   = document.getElementById('igName');
const igBio    = document.getElementById('igBio');

function setStatus(msg) {
  if (statusConfig) statusConfig.textContent = msg || "";
}

function renderPerfil(data) {
  if (!data || !data.username) {
    previewWrap.style.display = "none";
    return;
  }
  igAt.textContent   = `@${data.username || ''}`;
  igName.textContent = data.name || '';
  igBio.textContent  = data.biography || '';
  igAvatar.src       = data.profile_picture_url || '';
  igAvatar.alt       = `Avatar de @${data.username || ''}`;
  previewWrap.style.display = "flex";
}

function cachePerfil(data) {
  try {
    localStorage.setItem(LS_PROFILE, JSON.stringify({
      ...data,
      cachedAt: new Date().toISOString()
    }));
  } catch {}
}

function clearPerfil() {
  try { localStorage.removeItem(LS_PROFILE); } catch {}
  renderPerfil(null);
  setStatus("Desconectado.");
}

function loadPerfilFromCache() {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Fluxo: Conectar = chamar nossa API e salvar preview
async function conectarInstagram() {
  setStatus("Conectando ao Instagram...");
  try {
    const res = await fetch(`${API_BASE}/api/ig/profile`, { method: "GET" });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json(); // { username, name, biography, profile_picture_url }
    renderPerfil(data);
    cachePerfil(data);
    setStatus("Conectado.");
  } catch (e) {
    console.error(e);
    setStatus("Não foi possível conectar. Verifique se a Profile API está rodando em http://localhost:3201.");
  }
}

// Eventos
btnConectar?.addEventListener('click', conectarInstagram);
btnDesconectar?.addEventListener('click', clearPerfil);

// Inicialização: tenta mostrar cache
const cached = loadPerfilFromCache();
if (cached) renderPerfil(cached);
