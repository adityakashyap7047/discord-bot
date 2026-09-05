function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `${type === 'success' ? '✓' : '✗'} ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

function saveToSupabase(guildId) {
  const changes = pendingChanges.get(guildId);
  const payload = {};
  if (changes) {
    changes.forEach((val, key) => { payload[key] = val; });
  }
  fetch(`/api/guilds/${guildId}/supabase-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json()).then(data => {
    if (data.success) {
      showToast('Settings saved locally & synced to Supabase!');
      pendingChanges.delete(guildId);
    } else {
      showToast('Error saving: ' + (data.error || 'Unknown'), 'error');
    }
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
    const eventType = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
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
  const bar = document.getElementById(`save-bar-${guildId}`);
  if (!bar) return;
  const count = pendingChanges.get(guildId)?.size || 0;
  bar.style.display = count > 0 ? 'block' : 'none';
  const status = document.getElementById(`save-status-${guildId}`);
  if (status) {
    status.textContent = count > 0 ? `${count} unsaved change${count > 1 ? 's' : ''}` : 'No changes';
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
    const bar = document.getElementById(`save-bar-${guildId}`);
    if (bar) bar.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-guild]').forEach(container => {
    const guildId = container.dataset.guild;
    const main = container.querySelector('.main');
    if (!main) return;

    const saveBar = document.createElement('div');
    saveBar.id = `save-bar-${guildId}`;
    saveBar.style.cssText = 'display:none;position:sticky;bottom:0;z-index:50;padding:1rem 0;margin-top:1.5rem;';
    saveBar.innerHTML = `<div style="display:flex;align-items:center;gap:1rem;background:rgba(5,2,15,0.9);border:1px solid var(--neon-blue);border-radius:var(--r);padding:1rem 1.5rem;backdrop-filter:blur(20px);box-shadow:0 -4px 30px rgba(0,212,255,0.15);">
      <span style="flex:1;font-weight:600;font-size:0.9rem;" id="save-status-${guildId}">Unsaved changes</span>
      <button class="btn btn-s" onclick="discardChanges('${guildId}')" style="font-size:0.8rem;">Discard</button>
      <button class="btn btn-p" onclick="showSavePopup('${guildId}')" style="font-size:0.8rem;">Save to Supabase</button>
    </div>`;
    main.appendChild(saveBar);
    updateSaveButton(guildId);
  });
});

function discardChanges(guildId) {
  pendingChanges.delete(guildId);
  const bar = document.getElementById(`save-bar-${guildId}`);
  if (bar) bar.style.display = 'none';
  showToast('Changes discarded');
}

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
