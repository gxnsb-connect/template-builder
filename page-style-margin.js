// ══════════════════════════════════════════════
// PAGE STYLE — PAGE MARGIN
// ══════════════════════════════════════════════


// ── MARGIN PRESETS ──
const MARGIN_PRESETS = {
  'narrow':        { top: 48,  bottom: 48,  left: 48,  right: 48  },
  'medium-narrow': { top: 72,  bottom: 72,  left: 72,  right: 72  },
  'standard':      { top: 96,  bottom: 96,  left: 96,  right: 96  },
  'moderate':      { top: 96,  bottom: 96,  left: 120, right: 120 },
  'wide':          { top: 96,  bottom: 96,  left: 196, right: 196 },
};

// ── Active preset tracker ──
let activePreset = 'standard';

// ── Pinned pages tracker ──
// Stores page-content component IDs that have been individually set.
// Pinned pages are NEVER overridden by Apply to All — CSS ID specificity handles this.
const pinnedPages = new Set();


// ── UPDATE DIAGRAM LABELS ──
function updateDiagram(top, bottom, left, right) {
  document.getElementById('diag-top').textContent    = `Top: ${top}px`;
  document.getElementById('diag-bottom').textContent = `Bottom: ${bottom}px`;
  document.getElementById('diag-left').textContent   = `Left: ${left}px`;
  document.getElementById('diag-right').textContent  = `Right: ${right}px`;
}


// ══════════════════════════════════════════════
// CORE — Apply margin using GrapesJS CSS engine
// ══════════════════════════════════════════════
function applyMarginToCanvas(p) {

  const marginStyle = {
    position:     'absolute',
    top:          `${p.top}px`,
    right:        `${p.right}px`,
    bottom:       `${p.bottom}px`,
    left:         `${p.left}px`,
    'box-sizing': 'border-box',
    border:       '1px dashed rgba(100, 149, 237, 0.45)',
  };

  const applyToAll = document.getElementById('scope-all').checked;
  const wrapper    = editor.getWrapper();
  const allPages   = wrapper.components().filter(c => c.getClasses().includes('page'));

  // ════════════════════════════════
  // BRANCH A — Current Page (default)
  // Uses editor.Css.setRule with #id selector.
  // ID specificity (1,0,0) always beats .page-content (0,1,0).
  // This page becomes PINNED — Apply to All can never override it.
  // ════════════════════════════════
  if (!applyToAll) {

    const activeCard  = document.querySelector('.page-card.active-page');
    const activeIndex = activeCard ? parseInt(activeCard.dataset.pageIndex) : 0;
    const targetPage  = allPages[activeIndex];

    if (!targetPage) {
      console.warn('Page Margin: no active page at index', activeIndex);
      return;
    }

    targetPage.components().forEach(child => {
      if (!child.getClasses().includes('page-content')) return;

      const cid = child.getId();

      // Pin this page — future Apply to All skips it
      pinnedPages.add(cid);

      // Set margin via GrapesJS CSS engine using ID selector
      editor.Css.setRule(`#${cid}`, marginStyle);
    });

  // ════════════════════════════════
  // BRANCH B — Apply to All
  // Updates global pageConfig + rebuilds the .page-content class rule.
  // Pinned pages automatically keep their ID-rule overrides (higher specificity).
  // New pages added after this will inherit the global rule naturally.
  // ════════════════════════════════
  } else {

    // Update global pageConfig — new pages will inherit this
    pageConfig.padding.top    = p.top;
    pageConfig.padding.bottom = p.bottom;
    pageConfig.padding.left   = p.left;
    pageConfig.padding.right  = p.right;

    // Rebuild global .page-content CSS rule via GrapesJS canvas style tag.
    // Non-pinned pages immediately reflect this.
    // Pinned pages are unaffected — their #id rules have higher specificity.
    applyPageStyle();
  }
}


// ── TOGGLE HIGHLIGHT — keep label borders in sync ──
document.querySelectorAll('input[name="margin-scope"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('scope-current-label').style.borderColor =
      document.getElementById('scope-current').checked ? 'var(--accent2)' : 'var(--border)';
    document.getElementById('scope-all-label').style.borderColor =
      document.getElementById('scope-all').checked ? 'var(--accent2)' : 'var(--border)';
  });
});


// ── PRESET BUTTON CLICK ──
document.querySelectorAll('.margin-preset').forEach(btn => {
  btn.addEventListener('click', () => {

    document.querySelectorAll('.margin-preset').forEach(b => {
      b.style.borderColor = 'var(--border)';
    });
    btn.style.borderColor = 'var(--accent2)';

    activePreset = btn.dataset.preset;

    if (activePreset === 'custom') return;

    const p = MARGIN_PRESETS[activePreset];

    document.getElementById('margin-top').value    = p.top;
    document.getElementById('margin-bottom').value = p.bottom;
    document.getElementById('margin-left').value   = p.left;
    document.getElementById('margin-right').value  = p.right;

    updateDiagram(p.top, p.bottom, p.left, p.right);

    applyMarginToCanvas(p);
  });
});


// ── LIVE UPDATE DIAGRAM ON MANUAL INPUT ──
['margin-top', 'margin-bottom', 'margin-left', 'margin-right'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    activePreset = 'custom';

    document.querySelectorAll('.margin-preset').forEach(b => {
      b.style.borderColor = b.dataset.preset === 'custom'
        ? 'var(--accent2)'
        : 'var(--border)';
    });

    updateDiagram(
      document.getElementById('margin-top').value,
      document.getElementById('margin-bottom').value,
      document.getElementById('margin-left').value,
      document.getElementById('margin-right').value
    );
  });
});


// ── APPLY BUTTON (Custom / manual values) ──
document.getElementById('btn-apply-margin').addEventListener('click', () => {
  const p = {
    top:    parseInt(document.getElementById('margin-top').value)    || 96,
    bottom: parseInt(document.getElementById('margin-bottom').value) || 96,
    left:   parseInt(document.getElementById('margin-left').value)   || 96,
    right:  parseInt(document.getElementById('margin-right').value)  || 96,
  };

  updateDiagram(p.top, p.bottom, p.left, p.right);
  applyMarginToCanvas(p);

  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-margin')
  ).hide();
});


// ── SYNC INPUTS when modal opens ──
document.getElementById('modal-page-margin').addEventListener('show.bs.modal', () => {
  const p = pageConfig.padding;

  document.getElementById('margin-top').value    = p.top;
  document.getElementById('margin-bottom').value = p.bottom;
  document.getElementById('margin-left').value   = p.left;
  document.getElementById('margin-right').value  = p.right;

  updateDiagram(p.top, p.bottom, p.left, p.right);
});


