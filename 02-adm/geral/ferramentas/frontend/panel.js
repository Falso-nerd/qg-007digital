// 02-adm/geral/ferramentas/frontend/panel.js
// Edição inline para a página "Ferramentas"
// - Só aparece para admin (localStorage 'qg.isAdmin' == "1")
// - Adiciona FAB "Editar" e botão ✏️ em cada .tool-card
// - Salva alterações no localStorage (MVP). Depois trocamos por Firestore.
// - Campo secundário agora é "Link de download" (antes era 'alt').

(function () {
  const isAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('qg.isAdmin')) === 1 || localStorage.getItem('qg.isAdmin') === '1'; }
    catch { return false; }
  })();
  if (!isAdmin) return;

  const css = `
  .ft-admin-fab{
    position: fixed; right: 18px; bottom: 18px; z-index: 1100;
    border: none; border-radius: 999px; padding: 12px 16px; font-weight: 800;
    background: #00ff88; color: #000; cursor: pointer;
    box-shadow: 0 12px 30px rgba(0,0,0,.35);
  }
  .ft-admin-fab:hover{ background:#00e07a; transform: translateY(-2px); }

  .ft-admin-badge{
    position: absolute; right: 10px; top: 10px; z-index: 20; display:none;
  }
  .ft-admin-badge .btn{
    border:none; border-radius: 8px; padding: 8px 10px; font-weight: 700; cursor:pointer;
    background: rgba(0,0,0,.75); color:#fff; border:1px solid rgba(255,255,255,.18);
    backdrop-filter: blur(6px);
  }
  .ft-admin-on .ft-admin-badge{ display:block; }

  .ft-admin-back{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:none; z-index:1200; }
  .ft-admin-modal{
    position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
    width:min(680px,92vw); background:rgba(20,20,20,.9); color:#eee;
    border:1px solid rgba(255,255,255,.18); border-radius:14px; padding:16px;
    backdrop-filter:blur(10px); display:none; z-index:1201;
  }
  .ft-admin-modal h3{ margin:0 0 10px; color:#9fffcf }
  .ft-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .ft-grid .full{ grid-column:1/-1; }
  .ft-field{ display:flex; flex-direction:column; gap:6px; }
  .ft-field label{ font-size:13px; color:#cfcfcf }
  .ft-field input, .ft-field textarea{
    background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
    color:#fff; padding:10px; border-radius:10px; outline:none;
  }
  .ft-actions{ display:flex; gap:8px; margin-top:12px; justify-content:flex-end; }
  .ft-btn{ border:none; border-radius:10px; padding:10px 12px; font-weight:800; cursor:pointer; }
  .ft-btn.primary{ background:#00ff88; color:#000; }
  .ft-btn.primary:hover{ background:#00e07a; }
  .ft-btn.secondary{ background:#444; color:#fff; }
  .ft-btn.secondary:hover{ background:#666; }
  `;
  const style = document.createElement('style');
  style.textContent = css; document.head.appendChild(style);

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const OV_KEY = 'tools.catalog.overrides';
  const getOverrides = () => { try { return JSON.parse(localStorage.getItem(OV_KEY)) || {}; } catch { return {}; } };
  const setOverrides = (obj) => localStorage.setItem(OV_KEY, JSON.stringify(obj));

  function getCardId(card){
    const explicit = card.getAttribute('data-id');
    if (explicit) return explicit;
    const title = card.querySelector('.title')?.textContent?.trim() || 'tool';
    return 'tool-' + title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
  }

  function applyOverrides(){
    const ov = getOverrides();
    $$('.tool-card').forEach(card=>{
      const id = getCardId(card);
      const data = ov[id]; if(!data) return;

      const $title = card.querySelector('.title');
      const $desc  = card.querySelector('.meta');
      const $tags  = card.querySelector('.tags');
      const $go    = card.querySelector('.actions a.btn.primary');   // Abrir
      const $dl    = card.querySelector('.actions a.btn.secondary'); // Baixar

      if (data.titulo && $title) $title.textContent = data.titulo;
      if (data.desc && $desc) $desc.textContent = data.desc;
      if (Array.isArray(data.tags) && $tags) {
        $tags.innerHTML = data.tags.map(t=>`<span class="tag">${t}</span>`).join('');
      }
      if (data.link && $go) $go.href = data.link;

      // prioridade para 'download'; mantém compatibilidade com overrides antigos via 'alt'
      const downloadUrl = data.download || data.alt;
      if ($dl && downloadUrl) {
        $dl.href = downloadUrl;
        $dl.setAttribute('download', ''); // força comportamento de download
      }

      if (data.categoria) card.dataset.cat = data.categoria;
    });
  }

  function attachBadges(){
    $$('.tool-card').forEach(card=>{
      if (card.querySelector('.ft-admin-badge')) return;
      const badge = document.createElement('div');
      badge.className = 'ft-admin-badge';
      const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = '✏️ Editar';
      btn.type = 'button'; btn.addEventListener('click', ()=> openModal(card));
      badge.appendChild(btn);
      card.style.position = 'relative';
      card.appendChild(badge);
    });
  }

  let back, modal, currentCard = null;
  function buildModal(){
    back = document.createElement('div'); back.className = 'ft-admin-back'; back.addEventListener('click', closeModal);
    modal = document.createElement('div'); modal.className = 'ft-admin-modal';
    modal.innerHTML = `
      <h3>Editar ferramenta</h3>
      <div class="ft-grid">
        <div class="ft-field full">
          <label>Título</label><input id="ft_titulo" type="text"/>
        </div>
        <div class="ft-field full">
          <label>Descrição</label><textarea id="ft_desc" rows="3"></textarea>
        </div>
        <div class="ft-field">
          <label>Categoria</label><input id="ft_cat" type="text" placeholder="auto, media, seo, social..."/>
        </div>
        <div class="ft-field">
          <label>Tags (vírgula)</label><input id="ft_tags" type="text" placeholder="AI, Export, PDF"/>
        </div>
        <div class="ft-field">
          <label>Link principal (Abrir)</label><input id="ft_link" type="url" placeholder="https://..."/>
        </div>
        <div class="ft-field">
          <label>Link de download</label><input id="ft_download" type="url" placeholder="https://.../arquivo.zip"/>
        </div>
      </div>
      <div class="ft-actions">
        <button class="ft-btn secondary" type="button" id="ft_cancel">Cancelar</button>
        <button class="ft-btn primary" type="button" id="ft_save">Salvar</button>
      </div>
    `;
    document.body.appendChild(back); document.body.appendChild(modal);
    $('#ft_cancel', modal).addEventListener('click', closeModal);
    $('#ft_save', modal).addEventListener('click', saveModal);
  }

  function openModal(card){
    currentCard = card;
    const id = getCardId(card);
    const ov = getOverrides()[id] || {};
    $('#ft_titulo', modal).value   = ov.titulo || card.querySelector('.title')?.textContent?.trim() || '';
    $('#ft_desc',   modal).value   = ov.desc   || card.querySelector('.meta')?.textContent?.trim()  || '';
    $('#ft_cat',    modal).value   = ov.categoria || card.dataset.cat || '';
    const tagsDom = Array.from(card.querySelectorAll('.tags .tag')).map(x=>x.textContent.trim());
    $('#ft_tags',   modal).value   = ov.tags ? ov.tags.join(', ') : tagsDom.join(', ');
    $('#ft_link',   modal).value   = ov.link || card.querySelector('.actions a.btn.primary')?.getAttribute('href') || '';

    // compatibilidade: se 'download' não existir, tenta 'alt'
    const dlDom   = card.querySelector('.actions a.btn.secondary')?.getAttribute('href') || '';
    $('#ft_download', modal).value = ov.download || ov.alt || dlDom || '';
    back.style.display = 'block'; modal.style.display = 'block';
  }

  function closeModal(){ currentCard=null; back.style.display='none'; modal.style.display='none'; }

  function saveModal(){
    if(!currentCard) return;
    const id = getCardId(currentCard);
    const ov = getOverrides();
    ov[id] = {
      titulo:    $('#ft_titulo', modal).value.trim(),
      desc:      $('#ft_desc', modal).value.trim(),
      categoria: $('#ft_cat', modal).value.trim(),
      tags:      $('#ft_tags', modal).value.split(',').map(s=>s.trim()).filter(Boolean),
      link:      $('#ft_link', modal).value.trim(),
      download:  $('#ft_download', modal).value.trim()
    };
    setOverrides(ov);
    applyOverrides();
    closeModal();
  }

  function buildFab(){
    const fab = document.createElement('button');
    fab.className = 'ft-admin-fab'; fab.type='button'; fab.textContent = 'Editar';
    fab.addEventListener('click', ()=>{
      document.body.classList.toggle('ft-admin-on');
      fab.textContent = document.body.classList.contains('ft-admin-on') ? 'Sair do modo edição' : 'Editar';
      if (document.body.classList.contains('ft-admin-on')) attachBadges();
    });
    document.body.appendChild(fab);
  }

  function boot(){
    buildFab(); buildModal(); applyOverrides();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
