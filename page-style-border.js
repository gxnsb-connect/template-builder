// ══════════════════════════════════════════════════════════════
// PAGE STYLE — PAGE BORDER
// page-style-border.js
//
// TABLE OF CONTENTS
// -----------------
// SECTION 1  — Border State Object
// SECTION 2  — GrapesJS Target Page Resolver
// SECTION 3  — Border Style Value Builder
// SECTION 4  — Apply Border to Canvas
// SECTION 5  — Remove Border from Canvas
// SECTION 6  — UI: Border Design Buttons
// SECTION 7  — UI: Border Weight Buttons
// SECTION 8  — UI: Border Style Buttons
// SECTION 9  — UI: Border Color (swatches + hex + picker)
// SECTION 10 — UI: Apply-To Scope Radios
// SECTION 11 — UI: Apply Button
// SECTION 12 — UI: Remove Border Button (by scope)
// SECTION 12b— UI: Remove Current Page Border Button
// SECTION 13 — Live Preview Updater
// SECTION 14 — Modal Open: Sync UI to current state
// ══════════════════════════════════════════════════════════════


// ──────────────────────────────────────────────────────────────
// SECTION 1 — BORDER STATE OBJECT
// ──────────────────────────────────────────────────────────────

const borderConfig = {
  design : 'all',       // 'all' | 'top' | 'bottom' | 'left' | 'right'
  weight : '1',         // '1','2','3','4','6','8','10','12','16'
  style  : 'solid',     // 'solid' | 'dashed' | 'dotted' | 'double'
  color  : '#000000',   // hex string
  scope  : 'current',   // 'current' | 'first' | 'except-first' | 'all'
};


// ──────────────────────────────────────────────────────────────
// SECTION 2 — GRAPESJS TARGET PAGE RESOLVER
// ──────────────────────────────────────────────────────────────

function getBorderTargetPages(scope) {
  const wrapper  = editor.getWrapper();
  const allPages = wrapper.components().filter(c => c.getClasses().includes('page'));

  if (scope === 'first')        return allPages.slice(0, 1);
  if (scope === 'except-first') return allPages.slice(1);
  if (scope === 'all')          return allPages;

  // 'current' — read active card from left panel
  const activeCard  = document.querySelector('.page-card.active-page');
  const activeIndex = activeCard ? parseInt(activeCard.dataset.pageIndex) : 0;
  const target      = allPages[activeIndex];
  return target ? [target] : (allPages.length ? [allPages[0]] : []);
}


// ──────────────────────────────────────────────────────────────
// SECTION 3 — BORDER STYLE VALUE BUILDER
// Returns the four side values as strings.
// NOTE: No 'border':'' empty string — GrapesJS rejects it.
// ──────────────────────────────────────────────────────────────

function buildBorderSides(cfg) {
  const val  = `${cfg.weight}px ${cfg.style} ${cfg.color}`;
  const none = 'none';
  return {
    top    : (cfg.design === 'all' || cfg.design === 'top')    ? val : none,
    right  : (cfg.design === 'all' || cfg.design === 'right')  ? val : none,
    bottom : (cfg.design === 'all' || cfg.design === 'bottom') ? val : none,
    left   : (cfg.design === 'all' || cfg.design === 'left')   ? val : none,
  };
}


// ──────────────────────────────────────────────────────────────
// SECTION 4 — APPLY BORDER TO CANVAS
//
// TWO-LAYER STRATEGY:
//   Layer A — Direct DOM: page.getEl().querySelector('.page-border-frame')
//             Immediately visible. Bypasses GrapesJS DOM-sync issues.
//   Layer B — GrapesJS model: frameComp.setStyle()
//             Persists border in Export HTML/CSS output.
//
// Target: .page-border-frame (sibling of .page-content, z-index:1)
// NOT .page — because .page-content (z-index:2) would cover it.
// ──────────────────────────────────────────────────────────────

function applyBorderToCanvas(cfg) {
  const pages = getBorderTargetPages(cfg.scope);
  if (pages.length === 0) {
    console.warn('Page Border: no target pages for scope:', cfg.scope);
    return;
  }

  const sides = buildBorderSides(cfg);

  pages.forEach(page => {

    // ── Layer A: Direct DOM ──
    const pageEl = page.getEl();
    if (pageEl) {
      const frameEl = pageEl.querySelector('.page-border-frame');
      if (frameEl) {
        frameEl.style.borderTop    = sides.top;
        frameEl.style.borderRight  = sides.right;
        frameEl.style.borderBottom = sides.bottom;
        frameEl.style.borderLeft   = sides.left;
      } else {
        console.warn('Page Border: .page-border-frame not found in DOM');
      }
    }

    // ── Layer B: GrapesJS model ──
    // Use .models (plain array) not .find() (Backbone method)
    const frameComp = page.components().models.find(
      c => c.getClasses().includes('page-border-frame')
    );
    if (frameComp) {
      const existing = { ...frameComp.getStyle() };
      delete existing['border'];
      frameComp.setStyle({
        ...existing,
        'border-top'    : sides.top,
        'border-right'  : sides.right,
        'border-bottom' : sides.bottom,
        'border-left'   : sides.left,
      });
    }
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 5 — REMOVE BORDER FROM CANVAS
// Same two-layer strategy — clears all border styles from frame.
// ──────────────────────────────────────────────────────────────

function removeBorderFromPages(scope) {
  const pages = getBorderTargetPages(scope);

  const BORDER_KEYS = [
    'border', 'border-top', 'border-right',
    'border-bottom', 'border-left',
    'border-width', 'border-style', 'border-color',
  ];

  pages.forEach(page => {

    // ── Layer A: Direct DOM ──
    const pageEl = page.getEl();
    if (pageEl) {
      const frameEl = pageEl.querySelector('.page-border-frame');
      if (frameEl) {
        frameEl.style.borderTop    = '';
        frameEl.style.borderRight  = '';
        frameEl.style.borderBottom = '';
        frameEl.style.borderLeft   = '';
        frameEl.style.border       = '';
      }
    }

    // ── Layer B: GrapesJS model ──
    const frameComp = page.components().models.find(
      c => c.getClasses().includes('page-border-frame')
    );
    if (frameComp) {
      const existing = { ...frameComp.getStyle() };
      BORDER_KEYS.forEach(key => delete existing[key]);
      frameComp.setStyle(existing);
    }
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 6 — UI: BORDER DESIGN BUTTONS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.border-design-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.border-design-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.color       = 'var(--text)';
      b.style.background  = 'var(--bg-item)';
    });
    btn.style.borderColor = 'var(--accent2)';
    btn.style.color       = 'var(--accent2)';
    btn.style.background  = 'rgba(78,205,196,0.12)';
    borderConfig.design   = btn.dataset.design;
    updateBorderPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 7 — UI: BORDER WEIGHT BUTTONS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.border-weight-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.border-weight-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.color       = 'var(--text-muted)';
      b.style.background  = 'var(--bg-item)';
    });
    btn.style.borderColor = 'var(--accent2)';
    btn.style.color       = 'var(--accent2)';
    btn.style.background  = 'rgba(78,205,196,0.12)';
    borderConfig.weight   = btn.dataset.weight;
    updateBorderPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 8 — UI: BORDER STYLE BUTTONS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.border-style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.border-style-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.color       = 'var(--text-muted)';
      b.style.background  = 'var(--bg-item)';
    });
    btn.style.borderColor = 'var(--accent2)';
    btn.style.color       = 'var(--accent2)';
    btn.style.background  = 'rgba(78,205,196,0.12)';
    borderConfig.style    = btn.dataset.style;
    updateBorderPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 9 — UI: BORDER COLOR
// ──────────────────────────────────────────────────────────────

// 9a — Swatch click
document.querySelectorAll('.border-color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.border-color-swatch').forEach(s => {
      s.style.outline = 'none'; s.style.outlineOffset = '0';
    });
    swatch.style.outline       = '2px solid var(--accent2)';
    swatch.style.outlineOffset = '2px';
    borderConfig.color = swatch.dataset.color;
    document.getElementById('border-color-hex').value    = swatch.dataset.color;
    document.getElementById('border-color-picker').value = swatch.dataset.color;
    updateBorderPreview();
  });
});

// 9b — Hex text input
document.getElementById('border-color-hex').addEventListener('input', (e) => {
  const val = e.target.value.trim();
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) return;
  document.querySelectorAll('.border-color-swatch').forEach(s => {
    s.style.outline = 'none'; s.style.outlineOffset = '0';
  });
  borderConfig.color = val;
  document.getElementById('border-color-picker').value = val;
  updateBorderPreview();
});

// 9c — Native color picker
document.getElementById('border-color-picker').addEventListener('input', (e) => {
  document.querySelectorAll('.border-color-swatch').forEach(s => {
    s.style.outline = 'none'; s.style.outlineOffset = '0';
  });
  borderConfig.color = e.target.value;
  document.getElementById('border-color-hex').value = e.target.value;
  updateBorderPreview();
});


// ──────────────────────────────────────────────────────────────
// SECTION 10 — UI: APPLY-TO SCOPE RADIOS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="border-scope"]').forEach(radio => {
  radio.addEventListener('change', () => {
    borderConfig.scope = radio.value;
    document.querySelectorAll('.border-scope-label').forEach(lbl => {
      lbl.style.borderColor = lbl.dataset.scope === borderConfig.scope
        ? 'var(--accent2)' : 'var(--border)';
    });
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 11 — UI: APPLY BUTTON
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-apply-border').addEventListener('click', () => {
  applyBorderToCanvas(borderConfig);
  bootstrap.Modal.getInstance(document.getElementById('modal-page-border')).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 12 — UI: REMOVE BORDER BUTTON
// Removes border from whichever scope is selected in Apply To.
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-remove-border').addEventListener('click', () => {
  removeBorderFromPages(borderConfig.scope);
  bootstrap.Modal.getInstance(document.getElementById('modal-page-border')).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 12b — UI: REMOVE CURRENT PAGE BORDER BUTTON
// Always removes border from the current active page only.
// Ignores the Apply To scope selection completely.
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-remove-border-current').addEventListener('click', () => {
  removeBorderFromPages('current'); // hard-coded — never reads borderConfig.scope
  bootstrap.Modal.getInstance(document.getElementById('modal-page-border')).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 13 — LIVE PREVIEW UPDATER
// ──────────────────────────────────────────────────────────────

function updateBorderPreview() {
  const previewEl = document.getElementById('border-live-preview');
  if (!previewEl) return;
  const sides = buildBorderSides(borderConfig);
  previewEl.style.borderTop    = sides.top;
  previewEl.style.borderRight  = sides.right;
  previewEl.style.borderBottom = sides.bottom;
  previewEl.style.borderLeft   = sides.left;
}


// ──────────────────────────────────────────────────────────────
// SECTION 14 — MODAL OPEN: SYNC UI TO CURRENT STATE
// ──────────────────────────────────────────────────────────────

document.getElementById('modal-page-border').addEventListener('show.bs.modal', () => {

  // Design buttons
  document.querySelectorAll('.border-design-btn').forEach(b => {
    const on = b.dataset.design === borderConfig.design;
    b.style.borderColor = on ? 'var(--accent2)' : 'var(--border)';
    b.style.color       = on ? 'var(--accent2)' : 'var(--text)';
    b.style.background  = on ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // Weight buttons
  document.querySelectorAll('.border-weight-btn').forEach(b => {
    const on = b.dataset.weight === borderConfig.weight;
    b.style.borderColor = on ? 'var(--accent2)' : 'var(--border)';
    b.style.color       = on ? 'var(--accent2)' : 'var(--text-muted)';
    b.style.background  = on ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // Style buttons
  document.querySelectorAll('.border-style-btn').forEach(b => {
    const on = b.dataset.style === borderConfig.style;
    b.style.borderColor = on ? 'var(--accent2)' : 'var(--border)';
    b.style.color       = on ? 'var(--accent2)' : 'var(--text-muted)';
    b.style.background  = on ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // Hex + picker
  document.getElementById('border-color-hex').value    = borderConfig.color;
  document.getElementById('border-color-picker').value = borderConfig.color;

  // Swatches
  document.querySelectorAll('.border-color-swatch').forEach(s => {
    const match = s.dataset.color.toLowerCase() === borderConfig.color.toLowerCase();
    s.style.outline       = match ? '2px solid var(--accent2)' : 'none';
    s.style.outlineOffset = match ? '2px' : '0';
  });

  // Scope radio
  const radio = document.querySelector(`input[name="border-scope"][value="${borderConfig.scope}"]`);
  if (radio) radio.checked = true;

  // Scope label borders
  document.querySelectorAll('.border-scope-label').forEach(lbl => {
    lbl.style.borderColor = lbl.dataset.scope === borderConfig.scope
      ? 'var(--accent2)' : 'var(--border)';
  });

  // Refresh preview
  updateBorderPreview();
});
