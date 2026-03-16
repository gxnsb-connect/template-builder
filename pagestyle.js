// ── CUSTOM PAGE STYLE DROPDOWN ──
const pageStyleMenu = document.getElementById('page-style-menu');
const pageStyleToggle = document.getElementById('btn-page-style-toggle');

// Toggle open/close on button click
pageStyleToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = pageStyleMenu.style.display === 'block';
  pageStyleMenu.style.display = isOpen ? 'none' : 'block';
});

// Close button inside dropdown
document.getElementById('btn-close-page-style').addEventListener('click', (e) => {
  e.stopPropagation();
  pageStyleMenu.style.display = 'none';
});

// Prevent clicks inside menu from bubbling
pageStyleMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});

// ── Open correct modal when menu item clicked ──
document.querySelectorAll('.ps-menu-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const modalEl = document.querySelector(btn.dataset.modal);
    if (modalEl) new bootstrap.Modal(modalEl).show();
  });
});



