function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `${type === 'success' ? '✓' : '✗'} ${msg}`;
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

// Particle effect for cards
document.querySelectorAll('.card, .stat, .sc').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.boxShadow = '0 0 40px rgba(0,240,255,0.15), 0 0 80px rgba(255,0,255,0.05)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.boxShadow = '';
  });
});

// Smooth page transitions
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
