// 02-adm/la/chat-ia/frontend/panel.js
// Painel Admin para "Chat IA"
// - Mostra FAB "Editar" (liga/desliga modo edição) e FAB "Adicionar Chat"
// - Em modo edição, aparece um botão ✏️ em cada .chat-card para editar
// - "Adicionar Chat" abre o mesmo modal em modo criação
// - Salva overrides no localStorage (MVP): 'chat.catalog.overrides'
// - Salva itens criados no localStorage (MVP): 'chat.catalog.created'
// - Ao carregar, injeta no grid (#cards) os chats criados anteriormente

(function () {
  // --- Gate admin ---
  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('qg.isAdmin')) === 1 || localStorage.getItem('qg.isAdmin') === '1'; }
    catch { return false; }
  })();
  if (!isAdmin) return;

  // --- Helpers & state ---
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const GRID = $('#cards');

  const OV_KEY  = 'chat.catalog.overrides';
  const ADD_KEY = 'chat.catalog.created';

  const getOverrides = () => { try { return JSON.parse(localStorage.getItem(OV_KEY)) || {}; } catch { return {}; } };
  const setOverrides = (obj) => localStorage.setItem(OV_KEY, JSON.stringify(obj));

  const getCreated = () => { try { return JSON.parse(localStorage.getItem(ADD_KEY)) || []; } catch { return []; } };
  const setCreated = (arr) => localStorage.setItem(ADD_KEY, JSON.stringify(arr));

  function slugify(str){
    return (str || '')
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .slice(0,60) || 'chat';
  }

  function getCardId(card){
    const explicit = card.getAttribute('data-id');
    if (explicit) return explicit;
    const title = card.querySelector('.title')?.textContent?.trim() || 'chat';
    return 'chat-' + slugify(title);
  }

  function makeCardDOM(data){
    const root = document.createElement('article');
    root.className = 'chat-card';
    root.dataset.cat = data.categoria || '';
    root.setAttribute('data-id', data.id);
    root.innerHTML = `
      <div class="thumb">${data.titulo || 'Novo Chat'}</div>
      <div class="body">
        <h3 class="title">${data.titulo || ''}</h3>
        <p class="meta">${data.desc || ''}</p>
        <div class="tags">
          ${(data.tags || []).map(t=>`<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="actions">
        <a class="btn primary" href="${data.usar || '#'}" target="_blank" rel="noopener">Usar</a>
      </div>
    `;
    return root;
  }

  // --- Styles ---
  const css = `
  .ci-fab, .ci-fab-add{
    position: fixed; right: 18px; z-index: 1100;
    border: none; border-radius: 999px; padding: 12px 16px; font-weight: 800;
    background: #00ff88; color:#000; cursor:pointer; box-shadow:0 12px 30px rgba(0,0,0,.35);
    transition: transform .08s ease, background .25s ease;
  }
  .ci-fab{ bottom: 18px; }
  .ci-fab-add{ bottom: 70px; }
  .ci-fab:hover, .ci-fab-add:hover{ background:#00e07a; transform: translateY(-2px); }

  .ci-badge{
    position:absolute; right:10px; top:10px; z-index:20; display:none;
  }
  .ci-badge .btn{
    border:none; border-radius:8px; padding:8px 10px; font-weight:700; cursor:pointer;
    background:rgba(0,0,0,.75); color:#fff; border:1px solid rgba(255,255,255,.18);
    backdrop-filter:blur(6px);
  }
  .ci-on .ci-badge{ display:block; }

  .ci-back{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:none; z-index:1200; }
  .ci-modal{
    position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
    width:min(680px,92vw); background:rgba(20,20,20,.9); color:#eee;
    border:1px solid rgba(255,255,255,.18); border-radius:14px; padding:16px;
    backdrop-filter:blur(10px); display:none; z-index:1201;
  }
  .ci-modal h3{ margin:0 0 10px; color:#9fffcf }
  .ci-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .ci-grid .full{ grid-column:1/-1; }
  .ci-field{ display:flex; flex-direction:column; gap:6px; }
  .ci-field label{ font-size:13px; color:#cfcfcf }
  .ci-field input, .ci-field textarea{
    background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
    color:#fff; padding:10px; border-radius:10px; outline:none;
  }
  .ci-actions{ display:flex; gap:8px; margin-top:12px; justify-content:flex-end; }
  .ci-btn{ border:none; border-radius:10px; padding:10px 12px; font-weight:800; cursor:pointer; }
  .ci-btn.primary{ background:#00ff88; color:#000; }
  .ci-btn.primary:hover{ background:#00e07a; }
  .ci-btn.secondary{ background:#444; color:#fff; }
  .ci-btn.secondary:hover{ background:#666; }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // --- Apply overrides in DOM ---
  function applyOverrides(){
    const ov = getOverrides();
    $$('.chat-card').forEach(card=>{
      const id = getCardId(card);
      const data = ov[id]; if (!data) return;

      const $title = card.querySelector('.title');
      const $desc  = card.querySelector('.meta');
      const $tags  = card.querySelector('.tags');
      const $usar  = card.querySelector('.actions a.btn.primary');

      if (data.titulo && $title) $title.textContent = data.titulo;
      if (data.desc && $desc)   $desc.textContent  = data.desc;
      if (Array.isArray(data.tags) && $tags) {
        $tags.innerHTML = data.tags.map(t=>`<span class="tag">${t}</span>`).join('');
      }
      if (data.usar && $usar) {
        $usar.href = data.usar;
        $usar.setAttribute('target','_blank');
        $usar.setAttribute('rel','noopener');
      }
      if (data.categoria) card.dataset.cat = data.categoria;

      // thumb também mostra o título
      const $thumb = card.querySelector('.thumb');
      if ($thumb && data.titulo) $thumb.textContent = data.titulo;
    });
  }

  // --- Badges on cards ---
  function attachBadges(){
    $$('.chat-card').forEach(card=>{
      if (card.querySelector('.ci-badge')) return;
      const badge = document.createElement('div');
      badge.className = 'ci-badge';
      const btn = document.createElement('button');
      btn.className = 'btn'; btn.type='button'; btn.textContent = '✏️ Editar';
      btn.addEventListener('click', ()=> openModal({ mode:'edit', card }));
      badge.appendChild(btn);
      card.style.position = 'relative';
      card.appendChild(badge);
    });
  }

  // --- Inject created items from localStorage ---
  function injectCreated(){
    const created = getCreated();
    if (!created.length || !GRID) return;
    created.forEach(obj=>{
      if (!obj.id) obj.id = 'chat-' + slugify(obj.titulo);
      // evita duplicar se já existe um card com mesmo id
      if ($(`.chat-card[data-id="${obj.id}"]`)) return;
      GRID.appendChild(makeCardDOM(obj));
    });
  }

  // --- Modal ---
  let back, modal, current = { mode:'edit', card:null };

  function buildModal(){
    back = document.createElement('div'); back.className = 'ci-back'; back.addEventListener('click', closeModal);
    modal = document.createElement('div'); modal.className = 'ci-modal';
    modal.innerHTML = `
      <h3 id="ci_title">Editar chat</h3>
      <div class="ci-grid">
        <div class="ci-field full">
          <label>Título</label>
          <input id="ci_titulo" type="text" />
        </div>
        <div class="ci-field full">
          <label>Descrição</label>
          <textarea id="ci_desc" rows="3"></textarea>
        </div>
        <div class="ci-field">
          <label>Categoria</label>
          <input id="ci_cat" type="text" placeholder="conteudo, sites, social..." />
        </div>
        <div class="ci-field">
          <label>Tags (vírgula)</label>
          <input id="ci_tags" type="text" placeholder="Prompt, Guia, Reels" />
        </div>
        <div class="ci-field full">
          <label>Link "Usar"</label>
          <input id="ci_usar" type="url" placeholder="https://..." />
        </div>
      </div>
      <div class="ci-actions">
        <button class="ci-btn secondary" type="button" id="ci_cancel">Cancelar</button>
        <button class="ci-btn primary"   type="button" id="ci_save">Salvar</button>
      </div>
    `;
    document.body.appendChild(back); document.body.appendChild(modal);
    $('#ci_cancel', modal).addEventListener('click', closeModal);
    $('#ci_save',   modal).addEventListener('click', saveModal);
  }

  function openModal({mode, card}){
    current.mode = mode; current.card = card || null;

    $('#ci_title', modal).textContent = mode === 'create' ? 'Adicionar chat' : 'Editar chat';

    if (mode === 'edit' && card){
      const id = getCardId(card);
      const ov = getOverrides()[id] || {};
      $('#ci_titulo', modal).value = ov.titulo || card.querySelector('.title')?.textContent?.trim() || '';
      $('#ci_desc',   modal).value = ov.desc   || card.querySelector('.meta')?.textContent?.trim()  || '';
      $('#ci_cat',    modal).value = ov.categoria || card.dataset.cat || '';
      const tagsDom = Array.from(card.querySelectorAll('.tags .tag')).map(x=>x.textContent.trim());
      $('#ci_tags',   modal).value = ov.tags ? ov.tags.join(', ') : tagsDom.join(', ');
      $('#ci_usar',   modal).value = ov.usar || card.querySelector('.actions a.btn.primary')?.getAttribute('href') || '';
    } else {
      // create
      $('#ci_titulo', modal).value = '';
      $('#ci_desc',   modal).value = '';
      $('#ci_cat',    modal).value = '';
      $('#ci_tags',   modal).value = '';
      $('#ci_usar',   modal).value = '';
    }

    back.style.display = 'block'; modal.style.display = 'block';
  }

  function closeModal(){ current.card=null; back.style.display='none'; modal.style.display='none'; }

  function saveModal(){
    const titulo = $('#ci_titulo', modal).value.trim();
    const desc   = $('#ci_desc',   modal).value.trim();
    const cat    = $('#ci_cat',    modal).value.trim();
    const tags   = $('#ci_tags',   modal).value.split(',').map(s=>s.trim()).filter(Boolean);
    const usar   = $('#ci_usar',   modal).value.trim();

    if (current.mode === 'edit' && current.card){
      const id = getCardId(current.card);
      const ov = getOverrides();
      ov[id] = { titulo, desc, categoria:cat, tags, usar };
      setOverrides(ov);
      applyOverrides();
      closeModal();
      return;
    }

    // create
    const id = 'chat-' + slugify(titulo || Date.now().toString());
    const created = getCreated();
    const obj = { id, titulo, desc, categoria:cat, tags, usar };
    created.push(obj);
    setCreated(created);

    // injeta no DOM
    if (GRID) {
      GRID.prepend(makeCardDOM(obj));
      // se já estiver em modo edição, garante badge no novo card
      if (document.body.classList.contains('ci-on')) attachBadges();
    }

    closeModal();
  }

  // --- FABs ---
  function buildFabs(){
    const fabEdit = document.createElement('button');
    fabEdit.className = 'ci-fab'; fabEdit.type='button'; fabEdit.textContent = 'Editar';
    fabEdit.addEventListener('click', ()=>{
      document.body.classList.toggle('ci-on');
      fabEdit.textContent = document.body.classList.contains('ci-on') ? 'Sair do modo edição' : 'Editar';
      if (document.body.classList.contains('ci-on')) attachBadges();
    });

    const fabAdd = document.createElement('button');
    fabAdd.className = 'ci-fab-add'; fabAdd.type='button'; fabAdd.textContent = 'Adicionar Chat';
    fabAdd.addEventListener('click', ()=> openModal({ mode:'create' }));

    document.body.appendChild(fabAdd);
    document.body.appendChild(fabEdit);
  }

  // --- Boot ---
  function boot(){
    injectCreated();        // coloca no grid o que foi criado antes
    buildFabs();
    buildModal();
    applyOverrides();       // aplica edições nos cards já existentes
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
