// 04-header/menu-lateral/frontend/menu.js
// Menu lateral universal — lê ../backent/menu.json, renderiza categorias/abas,
// começa FECHADO, abre pelo hambúrguer e esconde o ícone quando aberto.

// ===== utils =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const lsGet = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Admin simples (trocar depois por verificação real)
function isAdmin(){ return lsGet('qg.isAdmin') === '1' || lsGet('qg.isAdmin') === 1; }

// Normaliza path
function norm(p){
  try{ const a=document.createElement('a'); a.href=p; return (a.pathname||'').replace(/\/+/g,'/'); }catch{ return p||''; }
}

// Marca item ativo
function markActive(menuRoot){
  const here = norm(location.pathname);
  const links = $$('.qg-item', menuRoot);
  let best=null, bestLen=-1;
  links.forEach(a=>{
    const t = norm(a.getAttribute('href')||'');
    if(!t) return;
    if(here.endsWith(t) || t.endsWith(here) || here.includes(t)){
      const len=t.length;
      if(len>bestLen){ bestLen=len; best=a; }
    }
  });
  links.forEach(a=>a.classList.remove('active'));
  if(best){
    best.classList.add('active');
    const panel = best.closest('.qg-panel');
    if(panel) openPanel(panel,true);
  }
}

// Estado dos painéis (categorias abertas)
const STATE_KEY='qg.menu.openCats';
const getOpenState=()=>lsGet(STATE_KEY,{});
const setOpenState=s=>lsSet(STATE_KEY,s);

function openPanel(panel, forceOpen=null){
  const cat = panel?.dataset?.catId;
  const header = panel?.previousElementSibling;
  const state = getOpenState();
  const cur = panel.classList.contains('open');
  const will = (forceOpen===null)? !cur : !!forceOpen;
  panel.classList.toggle('open', will);
  if(header) header.setAttribute('aria-expanded', String(will));
  if(cat){ state[cat]=will; setOpenState(state); }
}

function el(tag, cls, txt){
  const e=document.createElement(tag);
  if(cls) e.className=cls;
  if(txt!=null) e.textContent=txt;
  return e;
}

// Render categoria
function renderCategory(cat, ui, menuRoot){
  const frag=document.createDocumentFragment();

  const catBtn=el('button','qg-cat'); catBtn.type='button';
  catBtn.setAttribute('aria-expanded','false'); catBtn.dataset.catId=cat.id;
  catBtn.append( el('span','',cat.label), el('span','qg-caret','⌄') );

  const panel=el('div','qg-panel'); panel.dataset.catId=cat.id;

  const itemsBox=el('div','qg-items');
  (cat.items||[]).forEach(item=>{
    const a=el('a','qg-item',item.label); a.href=item.href; a.dataset.itemId=item.id;
    itemsBox.appendChild(a);
  });
  panel.appendChild(itemsBox);

  const actions=el('div','qg-actions');
  if(ui?.showVoltar){
    const voltar=el('button','qg-btn secondary','Voltar'); voltar.type='button';
    voltar.addEventListener('click',()=>openPanel(panel,false));
    actions.appendChild(voltar);
  }
  if(ui?.showAdicionar && isAdmin()){
    const add=el('button','qg-btn primary','Adicionar'); add.type='button';
    add.addEventListener('click',()=>{
      const ev=new CustomEvent('qg:create-tab',{detail:{categoryId:cat.id}});
      window.dispatchEvent(ev);
      if(!ev.defaultPrevented) alert(`Criar nova aba em: ${cat.label}\n(Fluxo será tratado no Painel ADM)`);
    });
    actions.appendChild(add);
  }
  if(actions.children.length) panel.appendChild(actions);

  catBtn.addEventListener('click',()=>openPanel(panel));

  const state=getOpenState(); if(state[cat.id]) openPanel(panel,true);

  frag.append(catBtn,panel);
  menuRoot.appendChild(frag);
}

// Painel ADM
function renderAdmBlock(ui, root){
  if(!ui?.painelAdm?.enabled) return;
  const box=el('div','qg-adm');
  const link=el('a','',ui.painelAdm.label||'Painel ADM'); link.href=ui.painelAdm.href||'#';
  box.appendChild(link);

  if(ui.painelAdm.showCriarCategoria && isAdmin()){
    const bar=el('div','qg-adm-actions');
    const btn=el('button','qg-btn primary','Criar Categoria'); btn.type='button';
    btn.addEventListener('click',()=>{
      const ev=new CustomEvent('qg:create-category',{detail:{}});
      window.dispatchEvent(ev);
      if(!ev.defaultPrevented) alert('Criar nova categoria\n(Fluxo será tratado no Painel ADM)');
    });
    bar.appendChild(btn); box.appendChild(bar);
  }
  root.appendChild(box);
}

// Rodapé
function renderFooter(root){
  const foot=el('div','qg-foot'); foot.append(el('span','', 'QG 007'), el('span','', 'v1.0')); root.appendChild(foot);
}

// ==== bootstrap ====
(function initMenu(){
  const host = $('#qg-sidebar');
  if(!host) return console.warn('[menu.js] #qg-sidebar não encontrado.');

  // força iniciar FECHADO
  host.classList.add('collapsed');

  const trigger = $('.qg-trigger');
  function openSidebar(){ host.classList.remove('collapsed'); }
  function closeSidebar(){ host.classList.add('collapsed'); }

  // abrir/fechar pelo trigger
  if(trigger){
    trigger.addEventListener('click', openSidebar);
  }

  // fechar com ESC
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape') closeSidebar();
  });

  // fechar ao clicar fora do menu (opcional)
  document.addEventListener('click',(e)=>{
    const clickedInside = host.contains(e.target) || (trigger && trigger.contains(e.target));
    if(!clickedInside) closeSidebar();
  });

  // carregar configuração
  const src = host.getAttribute('data-menu-src');
  if(!src) return console.warn('[menu.js] data-menu-src não definido.');

  fetch(src)
    .then(r=>{ if(!r.ok) throw new Error(`Falha ao carregar ${src}`); return r.json(); })
    .then(cfg=>{
      host.innerHTML='';

      const brand=el('div','qg-brand','QG 007'); host.appendChild(brand);

      const menu=el('div','qg-menu'); host.appendChild(menu);
      (cfg.categories||[]).forEach(cat=>renderCategory(cat,cfg.ui,menu));

      renderAdmBlock(cfg.ui, host);
      renderFooter(host);

      markActive(host);
      window.addEventListener('popstate',()=>markActive(host));
      window.addEventListener('qg:refresh-active',()=>markActive(host));

      // ao clicar numa aba, fecha o menu (bom para mobile)
      $$('.qg-item', host).forEach(a=>{
        a.addEventListener('click',()=>closeSidebar());
      });
    })
    .catch(err=>{
      console.error('[menu.js]',err);
      host.innerHTML='<div class="qg-menu-loading">Erro ao carregar o menu.</div>';
    });
})();
