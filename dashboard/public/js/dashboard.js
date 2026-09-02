function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `${type === 'success' ? '&#10003;' : '&#10007;'} ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

function autoSave(guildId, data) {
  fetch(`/dashboard/${guildId}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => {
    if (r.ok) showToast('Saved!');
    else showToast('Error saving', 'error');
  }).catch(() => showToast('Network error', 'error'));
}

document.querySelectorAll('[data-auto]').forEach(el => {
  const guildId = el.closest('[data-guild]')?.dataset.guild;
  if (!guildId) return;
  const key = el.dataset.auto;
  el.addEventListener('change', () => {
    let val = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
    autoSave(guildId, { [key]: val });
  });
  if (el.tagName === 'SELECT') {
    el.addEventListener('change', () => {
      autoSave(guildId, { [key]: el.value });
    });
  }
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
