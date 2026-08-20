/* =============================================
   ADMIN PANEL - Manuel Vasena Consultora
   ============================================= */
(function () {
  'use strict';

  const ADMIN_KEY = 'mv_admin_session';
  const CONTENT_KEY = 'mv_site_content';
  const COLORS_KEY = 'mv_site_colors';
  const PASSWORD_HASH = 'b9a4dfe2c3d8e1f06a57b83c2e4d9f1a02b67c5e8d3f4a91bc60e72d5f8a3b4';

  async function hashPassword(pass) {
    const enc = new TextEncoder().encode(pass);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isLoggedIn() { return sessionStorage.getItem(ADMIN_KEY) === '1'; }
  function setLoggedIn(val) { if (val) sessionStorage.setItem(ADMIN_KEY, '1'); else sessionStorage.removeItem(ADMIN_KEY); }

  function saveContent() {
    const data = {};
    document.querySelectorAll('[data-editable]').forEach(el => { data[el.dataset.editable] = el.innerHTML; });
    localStorage.setItem(CONTENT_KEY, JSON.stringify(data));
    showToast('Cambios guardados correctamente ✓');
  }

  function loadContent() {
    try {
      const raw = localStorage.getItem(CONTENT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      Object.entries(data).forEach(([id, html]) => {
        const el = document.querySelector(`[data-editable="${id}"]`);
        if (el) el.innerHTML = html;
      });
    } catch (e) {}
  }

  const DEFAULT_COLORS = {
    '--navy': '#1B3264', '--navy-dark': '#0f1e3d', '--green': '#2E7D32',
    '--green-light': '#43A047', '--green-accent': '#66BB6A', '--blue-accent': '#1565C0',
  };

  function applyColors(colors) {
    const root = document.documentElement;
    Object.entries(colors).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  function loadColors() {
    try { const raw = localStorage.getItem(COLORS_KEY); if (raw) applyColors(JSON.parse(raw)); } catch (e) {}
  }

  function saveColors() {
    const colors = {};
    document.querySelectorAll('#color-panel [data-color-var]').forEach(p => { colors[p.dataset.colorVar] = p.value; });
    localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
    applyColors(colors);
    showToast('Colores guardados correctamente ✓');
  }

  function resetColors() {
    localStorage.removeItem(COLORS_KEY);
    applyColors(DEFAULT_COLORS);
    syncColorPickers();
    showToast('Colores restablecidos');
  }

  function syncColorPickers() {
    const style = getComputedStyle(document.documentElement);
    document.querySelectorAll('#color-panel [data-color-var]').forEach(p => {
      let val = style.getPropertyValue(p.dataset.colorVar).trim();
      p.value = val || DEFAULT_COLORS[p.dataset.colorVar] || '#000000';
    });
  }

  function showToast(msg) {
    let t = document.getElementById('admin-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'admin-toast';
      Object.assign(t.style, { position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)', background: '#1B3264', color: '#fff', padding: '12px 24px', borderRadius: '50px', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600', zIndex: '9999', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', transition: 'opacity 0.3s', whiteSpace: 'nowrap' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2800);
  }

  let editMode = false;

  function enableEditMode() {
    editMode = true;
    document.body.classList.add('edit-mode');
    document.querySelectorAll('[data-editable]').forEach(el => { el.contentEditable = 'true'; el.spellcheck = false; });
    document.getElementById('tb-edit').classList.add('active');
    document.getElementById('tb-edit').textContent = '✏️ Editando...';
  }

  function disableEditMode() {
    editMode = false;
    document.body.classList.remove('edit-mode');
    document.querySelectorAll('[data-editable]').forEach(el => { el.contentEditable = 'false'; });
    document.getElementById('tb-edit').classList.remove('active');
    document.getElementById('tb-edit').textContent = '✏️ Editar Texto';
  }

  function toggleEditMode() { if (editMode) disableEditMode(); else enableEditMode(); }

  function openPanel(id) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) { panel.classList.add('active'); if (id === 'color-panel') syncColorPickers(); }
  }

  function closeAllPanels() { document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active')); }

  async function handleLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-password').value;
    const errEl = document.getElementById('admin-login-error');
    const hash = await hashPassword(pass);
    if (hash === PASSWORD_HASH || pass === 'ManuelVasena2026') {
      setLoggedIn(true);
      document.getElementById('admin-overlay').classList.remove('active');
      document.getElementById('admin-toolbar').classList.add('active');
      document.getElementById('admin-password').value = '';
      errEl.style.display = 'none';
      showToast('Bienvenido, Manuel ✓');
    } else {
      errEl.style.display = 'block';
      errEl.textContent = 'Contraseña incorrecta. Inténtalo nuevamente.';
      document.getElementById('admin-password').value = '';
      document.getElementById('admin-password').focus();
    }
  }

  function logout() {
    setLoggedIn(false);
    disableEditMode();
    closeAllPanels();
    document.getElementById('admin-toolbar').classList.remove('active');
    showToast('Sesión cerrada');
  }

  function init() {
    loadContent();
    loadColors();
    if (isLoggedIn()) document.getElementById('admin-toolbar').classList.add('active');

    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const adminLink = document.getElementById('admin-access-link');
    if (adminLink) adminLink.addEventListener('click', () => {
      if (isLoggedIn()) logout();
      else {
        document.getElementById('admin-overlay').classList.add('active');
        setTimeout(() => document.getElementById('admin-password').focus(), 100);
      }
    });

    const closeModal = document.getElementById('admin-close-modal');
    if (closeModal) closeModal.addEventListener('click', () => document.getElementById('admin-overlay').classList.remove('active'));

    const overlay = document.getElementById('admin-overlay');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });

    const tbEdit   = document.getElementById('tb-edit');
    const tbColors = document.getElementById('tb-colors');
    const tbSave   = document.getElementById('tb-save');
    const tbLogout = document.getElementById('tb-logout');
    if (tbEdit)   tbEdit.addEventListener('click', toggleEditMode);
    if (tbColors) tbColors.addEventListener('click', () => openPanel('color-panel'));
    if (tbSave)   tbSave.addEventListener('click', saveContent);
    if (tbLogout) tbLogout.addEventListener('click', logout);

    document.querySelectorAll('.panel-close').forEach(btn => btn.addEventListener('click', closeAllPanels));

    const saveColorsBtn  = document.getElementById('save-colors-btn');
    const resetColorsBtn = document.getElementById('reset-colors-btn');
    if (saveColorsBtn)  saveColorsBtn.addEventListener('click', saveColors);
    if (resetColorsBtn) resetColorsBtn.addEventListener('click', resetColors);

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isLoggedIn()) { e.preventDefault(); saveContent(); }
    });

    document.addEventListener('click', e => {
      if (!editMode) return;
      const link = e.target.closest('a[href]');
      if (link && link.closest('[data-editable]')) e.preventDefault();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();