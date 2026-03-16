// ════════════════════════════════════════
// LEFT PANEL — TAB SWITCHING
// ════════════════════════════════════════

document.querySelectorAll('.lp-tab').forEach(btn => {
  btn.addEventListener('click', () => {

    // Deactivate all tabs and panels
    document.querySelectorAll('.lp-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.lp-tab-content').forEach(p => p.classList.remove('active'));

    // Activate clicked tab
    btn.classList.add('active');
    const targetId = btn.dataset.target;
    document.getElementById(targetId).classList.add('active');
    
  });
});


// ════════════════════════════════════════
// PAGES TAB — Build & FRefresh Page List
// ════════════════════════════════════════

function refreshPagesList() {
  const list = document.getElementById('pages-list');
  list.innerHTML = ''; // clear current cards

  const wrapper = editor.getWrapper();
  const pages = wrapper.components().filter(c => c.getClasses().includes('page'));

  pages.forEach((pageComp, index) => {
    const card = document.createElement('div');
    card.className = 'page-card';
    card.dataset.pageIndex = index;

    card.innerHTML = `
      <div class="page-card-thumb">
        <span>${index + 1}</span>
      </div>
      <span class="page-card-label">Page ${index + 1}</span>
      <button class="page-card-delete" title="Delete page" data-index="${index}">
        <i class="bi bi-trash"></i>
      </button>
    `;

    // Click card body → scroll that page into view inside the canvas
    card.addEventListener('click', (e) => {
      if (e.target.closest('.page-card-delete')) return; // ignore delete btn click

      // Mark this card as active
      document.querySelectorAll('.page-card').forEach(c => c.classList.remove('active-page'));
      card.classList.add('active-page');

      // Scroll to the matching page inside the GrapesJS canvas iframe
      const canvasDoc = editor.Canvas.getDocument();
      const pageEls = canvasDoc.querySelectorAll('.page');
      if (pageEls[index]) {
        pageEls[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Delete button — remove the page component
    card.querySelector('.page-card-delete').addEventListener('click', () => {
      const allPages = wrapper.components().filter(c => c.getClasses().includes('page'));

      if (allPages.length <= 1) {
        alert('You must have at least one page.');
        return;
      }

      allPages[index].remove();
      refreshPagesList(); // rebuild the list after deletion
    });

    list.appendChild(card);
  });

  // Mark the first card as active by default if none is active
  const firstCard = list.querySelector('.page-card');
  if (firstCard) firstCard.classList.add('active-page');
}


// ════════════════════════════════════════
// HOOK INTO GRAPESJS EVENTS
// ════════════════════════════════════════

// Refresh list when editor finishes loading
editor.on('load', () => {
  setTimeout(() => {
    refreshPagesList();
    setupScrollObserver();
  }, 200);
});

// Refresh list + re-observe when pages are added or removed
editor.on('component:add', () => {
  refreshPagesList();
  setupScrollObserver();
});
editor.on('component:remove', () => {
  refreshPagesList();
  setupScrollObserver();
});


// ════════════════════════════════════════
// SCROLL OBSERVER — sync active card when
// user scrolls inside the GrapesJS canvas
// ════════════════════════════════════════

let scrollObserver = null; // keep reference so we can disconnect & reconnect

function setupScrollObserver() {

  // 1. Disconnect any existing observer before creating a new one
  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = null;
  }

  // 2. Get the canvas iframe's document and window
  const canvasDoc    = editor.Canvas.getDocument();
  const canvasWindow = editor.Canvas.getWindow();
  if (!canvasDoc || !canvasWindow) return;

  // 3. Get all .page elements inside the iframe
  const pageEls = canvasDoc.querySelectorAll('.page');
  if (!pageEls.length) return;

  // 4. Create IntersectionObserver rooted to the iframe's own scrolling area
  scrollObserver = new canvasWindow.IntersectionObserver(
    (entries) => {

      // Find the page with the highest visibility ratio
      let maxRatio = 0;
      let mostVisibleIndex = -1;

      entries.forEach(entry => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio           = entry.intersectionRatio;
          mostVisibleIndex   = parseInt(entry.target.dataset.scrollIndex);
        }
      });

      // Only update if a page is meaningfully visible
      if (mostVisibleIndex < 0 || maxRatio < 0.1) return;

      // Update the active card in the left panel
      document.querySelectorAll('.page-card').forEach(card => {
        card.classList.toggle(
          'active-page',
          parseInt(card.dataset.pageIndex) === mostVisibleIndex
        );
      });
    },
    {
      // root: null means the iframe viewport itself
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
    }
  );

  // 5. Tag each page element with its index and start observing
  pageEls.forEach((el, index) => {
    el.dataset.scrollIndex = index;
    scrollObserver.observe(el);
  });
}