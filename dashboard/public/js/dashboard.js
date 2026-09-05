function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `${type === 'success' ? '✓' : '✗'} ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

function saveToSupabase(guildId) {
  fetch(`/api/guilds/${guildId}/supabase-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).then(r => r.json()).then(data => {
    if (data.success) showToast('Settings synced to Supabase!');
    else showToast('Error syncing to Supabase', 'error');
  }).catch(() => showToast('Network error', 'error'));
}

const pendingChanges = new Map();

document.querySelectorAll('[data-guild]').forEach(container => {
  const guildId = container.dataset.guild;
  const settingsArea = container.querySelector('.main');
  if (!settingsArea) return;

  const autoFields = settingsArea.querySelectorAll('[data-auto]');
  const formGroups = new Map();

  autoFields.forEach(el => {
    const key = el.dataset.auto;
    const eventType = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(eventType, () => {
      let val = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      if (!pendingChanges.has(guildId)) pendingChanges.set(guildId, new Map());
      const guildChanges = pendingChanges.get(guildId);
      guildChanges.set(key, val);
      updateSaveButton(guildId);
    });
  });
});

function updateSaveButton(guildId) {
  const existing = document.getElementById(`save-btn-${guildId}`);
  if (!existing) return;
  const count = pendingChanges.get(guildId)?.size || 0;
  existing.style.display = count > 0 ? 'inline-flex' : 'none';
  if (count > 0) {
    existing.textContent = `Save to Supabase (${count} changes)`;
  } else {
    existing.textContent = 'Save to Supabase';
  }
}

function showSavePopup(guildId) {
  const changes = pendingChanges.get(guildId);
  if (!changes || changes.size === 0) {
    showToast('No changes to save', 'error');
    return;
  }
  const changeList = Array.from(changes.entries()).map(([k, v]) => `${k}: ${v}`).join('\n');
  const confirmed = confirm(`You have ${changes.size} unsaved changes:\n\n${changeList}\n\nClick OK to sync to Supabase, or Cancel to discard.`);
  if (confirmed) {
    saveToSupabase(guildId);
    pendingChanges.delete(guildId);
    const btn = document.getElementById(`save-btn-${guildId}`);
    if (btn) btn.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-guild]').forEach(container => {
    const guildId = container.dataset.guild;
    const navBar = document.querySelector('.nav');
    if (!navBar) return;
    const navR = navBar.querySelector('.nav-r');
    if (!navR) return;
    const saveBtn = document.createElement('button');
    saveBtn.id = `save-btn-${guildId}`;
    saveBtn.className = 'btn btn-p';
    saveBtn.style.cssText = 'display:none;margin-left:1rem;padding:0.4rem 1rem;font-size:0.75rem;';
    saveBtn.textContent = 'Save to Supabase';
    saveBtn.onclick = () => showSavePopup(guildId);
    navR.appendChild(saveBtn);
    updateSaveButton(guildId);
  });
});

document.querySelectorAll('[data-preview]').forEach(el => {
  el.addEventListener('input', () => {
    const target = document.querySelector(el.dataset.preview);
    if (target) target.textContent = el.value || el.placeholder || '';
  });
});

document.querySelectorAll('[data-color-preview]').forEach(el => {
  el.addEventListener('input', () => {
    const target = document.querySelector(el.dataset.colorPreview);
    if (target) target.style.borderLeftColor = el.value;
  });
});

function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
});

document.querySelectorAll('[data-confirm]').forEach(el => {
  el.addEventListener('click', e => {
    if (!confirm(el.dataset.confirm)) e.preventDefault();
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelectorAll('.card, .stat, .sc').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.boxShadow = '0 0 40px rgba(0,240,255,0.15), 0 0 80px rgba(255,0,255,0.05)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.boxShadow = '';
  });
});

document.querySelectorAll('.sb-link').forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.2s';
      setTimeout(() => { window.location.href = href; }, 200);
    }
  });
});
