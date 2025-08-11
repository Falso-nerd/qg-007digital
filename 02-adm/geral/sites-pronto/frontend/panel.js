// 02-adm/geral/sites-pronto/frontend/panel.js
// Edição inline para "Sites Pronto"
// - Só aparece para admin (localStorage 'qg.isAdmin' == "1")
// - FAB "Editar" + botão ✏️ em cada .card
// - Salva no localStorage (MVP) com chave 'sp.catalog.overrides'
// - Campo secundário agora é "Link de download (ZIP)" e o 2º botão força download.

(function () {
  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('qg.isAdmin')) === 1 || localStorage.getItem('qg.isAdmin') === '1'; }
    catch { return false; }
  })();
  if (!isAdmin) return;

  const css = `
  .sp-admin-fab{
    position: fixed; right: 18px; bottom: 18px; z-index: 1100;
    border: none; border-radius: 999px; padding: 12px 16px; font-weight: 800;
    background: #00ff88; color: #000; cursor: pointer;
    box-shadow: 0 12px 30px rgba(0,0,0,.35);
  }
  .sp-admin-fab:hover{ background:#00e07a; transform: translateY(-2px); }

  .sp-admin-badge{
    position: absolute; right: 10px; top: 10px; z-index: 20; display:none;
  }
  .sp-admin-badge .btn{
    border:none; border-radius: 8px; padding: 8px 10px; font-weight: 700; cursor:pointer;
    background: rgba(0,0,0,.75); color:#fff; border:1px solid rgba(255,255,255,.18);
    backdrop-filter: blur(6px);
  }
  .sp-admin-on .sp-admin-badge{ display:block; }

  .sp-admin-modal-back{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:none; z-index:1200; }
  .sp-admin-modal{
    position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
    width:min(680px,92vw); background:rgba(20,20,20,.9); color:#eee;
    border:1px solid rgba(255,255,255,.18); border-radius:14px; padding:16px;
    backdrop-filter:blur(10px); display:none; z-index:1201;
  }
  .sp-admin-modal h3{ margin:0 0 10px; color:#9fffcf }
  .sp-admin-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .sp-admin-grid .full{ grid-column:1/-1; }
  .sp-admin-field{ display:flex; flex-direction:column; gap:6px; }
  .sp-admin-field label{ font-size:13px; color:#cfcfcf }
  .sp-admin-field input, .sp-admin-field textarea{
    background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
    color:#fff; padding:10px; border-radius:10px; outline:none;
  }
  .sp-admin-actions{ display:flex; gap:8px; margin-top:12px; justify-content:flex-end; }
  .sp-btn{ border:none; border-radius:10px; padding:10px 12px; font-weight:800; cursor:pointer; }
  .sp-btn.primary{ background:#00ff88; color:#000; }
  .sp-btn.primary:hover{ background:#00e07a; }
  .sp-btn.secondary{ background:#444; color:#fff; }
  .sp-btn.secondary:hover{ background:#666; }
  `;
  const style = document.createElement('style');
  style.textContent = css; document.head.appendChild(style);

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const OV_KEY = 'sp.catalog.overrides';
  const getOverrides = () => { try { return JSON.parse(localStorage.getItem(OV_KEY)) || {}; } catch { return {}; } };
  const setOverrides = (obj) => localStorage.setItem(OV_KEY, JSON.stringify(obj));

  function getCardId(card){
    const explicit = card.getAttribute('data-id');
    if (explicit) return explicit;
    const title = card.querySelector('.title')?.textContent?.trim() || 'card';
    return 'card-' + title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
  }

  function applyOverrides(){
    const ov = getOverrides();
    $$('.card').forEach(card=>{
      const id = getCardId(card);
      const data = ov[id]; if(!data) return;

      const $title = card.querySelector('.title');
      const $desc  = card.querySelector('.meta');
      const $tags  = card.querySelector('.tags');
      const $demo  = card.querySelector('.actions a.btn.secondary'); // "Ver Demo"
      const $zip   = card.querySelector('.actions a.btn.primary');   // "Baixar ZIP"

      if (data.titulo && $title) $title.textContent = data.titulo;
      if (data.desc && $desc) $desc.textContent = data.desc;
      if (Array.isArray(data.tags) && $tags) {
        $tags.innerHTML = data.tags.map(t=>`<span class="tag">${t}</span>`).join('');
      }
      if (data.demo && $demo) {
        $demo.href = data.demo;
        $demo.removeAttribute('download');
        $demo.setAttribute('target','_blank');
        $demo.setAttribute('rel','noopener');
      }
      // prioridade para 'download' mas mantém compat com chave 'zip'
      const zipUrl = data.download || data.zip;
      if ($zip && zipUrl) {
        $zip.href = zipUrl;
        $zip.setAttribute('download','');
        $zip.removeAttribute('target');
        $zip.removeAttribute('rel');
      }
      if (data.categoria) card.dataset.cat = data.categoria;
    });
  }

  function attachBadges(){
    $$('.card').forEach(card=>{
      if (card.querySelector('.sp-admin-badge')) return;
      const badge = document.createElement('div');
      badge.className = 'sp-admin-badge';
      const btn = document.createElement('button');
      btn.className = 'btn'; btn.type = 'button'; btn.textContent = '✏️ Editar';
      btn.addEventListener('click', ()=> openModalFor(card));
      badge.appendChild(btn);
      card.style.position = 'relative';
      card.appendChild(badge);
    });
  }

  let modalBack, modal, currentCard = null;
  function buildModal(){
    modalBack = document.createElement('div');
    modalBack.className = 'sp-admin-modal-back';
    modalBack.addEventListener('click', closeModal);

    modal = document.createElement('div');
    modal.className = 'sp-admin-modal';
    modal.innerHTML = `
      <h3>Editar template</h3>
      <div class="sp-admin-grid">
        <div class="sp-admin-field full">
          <label>Título</label>
          <input type="text" id="spf_titulo" />
        </div>
        <div class="sp-admin-field full">
          <label>Descrição</label>
          <textarea id="spf_desc" rows="3"></textarea>
        </div>
        <div class="sp-admin-field">
          <label>Categoria</label>
          <input type="text" id="spf_cat" placeholder="landing, portfolio, loja, blog..." />
        </div>
        <div class="sp-admin-field">
          <label>Tags (vírgula)</label>
          <input type="text" id="spf_tags" placeholder="HTML, CSS, JS" />
        </div>
        <div class="sp-admin-field">
          <label>Link Demo</label>
          <input type="url" id="spf_demo" placeholder="https://..." />
        </div>
        <div class="sp-admin-field">
          <label>Link de download (ZIP)</label>
          <input type="url" id="spf_zip" placeholder="https://.../arquivo.zip" />
        </div>
      </div>
      <div class="sp-admin-actions">
        <button class="sp-btn secondary" type="button" id="sp_cancel">Cancelar</button>
        <button class="sp-btn primary" type="button" id="sp_save">Salvar</button>
      </div>
    `;
    document.body.appendChild(modalBack);
    document.body.appendChild(modal);

    $('#sp_cancel', modal).addEventListener('click', closeModal);
    $('#sp_save', modal).addEventListener('click', saveModal);
  }

  function openModalFor(card){
    currentCard = card;
    const id = getCardId(card);
    const ov = getOverrides()[id] || {};

    $('#spf_titulo', modal).value = ov.titulo || card.querySelector('.title')?.textContent?.trim() || '';
    $('#spf_desc',   modal).value = ov.desc   || card.querySelector('.meta')?.textContent?.trim()  || '';
    $('#spf_cat',    modal).value = ov.categoria || card.dataset.cat || '';
    const tagsDom = Array.from(card.querySelectorAll('.tags .tag')).map(x=>x.textContent.trim());
    $('#spf_tags',   modal).value = ov.tags ? ov.tags.join(', ') : tagsDom.join(', ');
    $('#spf_demo',   modal).value = ov.demo || card.querySelector('.actions a.btn.secondary')?.getAttribute('href') || '';

    const zipDom = card.querySelector('.actions a.btn.primary')?.getAttribute('href') || '';
    $('#spf_zip', modal).value = ov.download || ov.zip || zipDom || '';

    modalBack.style.display = 'block';
    modal.style.display = 'block';
  }

  function closeModal(){ currentCard = null; modalBack.style.display = 'none'; modal.style.display = 'none'; }

  function saveModal(){
    if (!currentCard) return;
    const id = getCardId(currentCard);
    const ov = getOverrides();

    ov[id] = {
      titulo:    $('#spf_titulo', modal).value.trim(),
      desc:      $('#spf_desc', modal).value.trim(),
      categoria: $('#spf_cat', modal).value.trim(),
      tags:      $('#spf_tags', modal).value.split(',').map(s=>s.trim()).filter(Boolean),
      demo:      $('#spf_demo', modal).value.trim(),
      download:  $('#spf_zip', modal).value.trim() // mantém compat com 'zip' antigo
    };
    setOverrides(ov);
    applyOverrides();
    closeModal();
  }

  function buildFab(){
    const fab = document.createElement('button');
    fab.className = 'sp-admin-fab'; fab.type='button'; fab.textContent = 'Editar';
    fab.addEventListener('click', ()=>{
      document.body.classList.toggle('sp-admin-on');
      fab.textContent = document.body.classList.contains('sp-admin-on') ? 'Sair do modo edição' : 'Editar';
      if (document.body.classList.contains('sp-admin-on')) attachBadges();
    });
    document.body.appendChild(fab);
  }

  function boot(){ buildFab(); buildModal(); applyOverrides(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
