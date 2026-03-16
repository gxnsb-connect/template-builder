// ══════════════════════════════════════════════════════════════
// PAGE STYLE — PAGE COLOR
// page-style-background.js
//
// HOW IT WORKS (Important — read this):
// ─────────────────────────────────────
// buildPageCSS() in template_builder.html injects a <style> tag
// into the canvas iframe with:  .page { background: #ffffff }
//
// page.setStyle() goes through GrapesJS CSS manager and LOSES
// the specificity battle against that rule.
//
// SOLUTION: We inject our OWN <style id="page-bg-style"> tag
// into the canvas iframe using .page:nth-child(N) selectors
// with !important — guaranteed to override the base page CSS.
//
// Per-page colors are stored in pageBgColors = { index: color }
// so the style tag can be rebuilt at any time.
//
// TABLE OF CONTENTS
// -----------------
// SECTION 1  — Per-page color store + bgConfig
// SECTION 2  — Target page resolver
// SECTION 3  — Canvas style tag builder (the core engine)
// SECTION 4  — Apply background to canvas
// SECTION 5  — Remove background from canvas
// SECTION 6  — UI: All swatch click handlers (grid + standard)
// SECTION 7  — UI: No Color button
// SECTION 8  — UI: Hex input
// SECTION 9  — UI: Native color picker
// SECTION 10 — UI: Scope radios
// SECTION 11 — UI: Apply button
// SECTION 12 — UI: Remove buttons
// SECTION 13 — Live preview updater
// SECTION 14 — Modal open: Sync UI to current state
// SECTION 15 — Persist colors when pages are added/removed
// ══════════════════════════════════════════════════════════════


// ──────────────────────────────────────────────────────────────
// SECTION 1 — PER-PAGE COLOR STORE + BGCONFIG
// pageBgColors: key = 0-based page index, value = CSS color string
// Missing key = No Color (page shows default white).
// ──────────────────────────────────────────────────────────────

const pageBgColors = {};

const bgConfig = {
  color : null,       // null = No Color
  scope : 'current',  // 'current' | 'all'
};


// ──────────────────────────────────────────────────────────────
// SECTION 2 — TARGET PAGE RESOLVER
// ──────────────────────────────────────────────────────────────

function getBgTargetPages(scope) {
  const wrapper  = editor.getWrapper();
  const allPages = wrapper.components().filter(c => c.getClasses().includes('page'));

  if (scope === 'all') return allPages;

  const activeCard  = document.querySelector('.page-card.active-page');
  const activeIndex = activeCard ? parseInt(activeCard.dataset.pageIndex) : 0;
  const target      = allPages[activeIndex];
  return target ? [target] : (allPages.length ? [allPages[0]] : []);
}


// ──────────────────────────────────────────────────────────────
// SECTION 3 — CANVAS STYLE TAG BUILDER
//
// Injects/rebuilds <style id="page-bg-style"> in the canvas
// iframe. Uses .page:nth-child(N) + !important to guarantee
// these rules override .page { background: #ffffff } from
// buildPageCSS() / applyPageStyle().
// ──────────────────────────────────────────────────────────────

function rebuildBgStyleTag() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) {
    console.warn('Page Color: canvas document not ready');
    return;
  }

  let styleTag = canvasDoc.getElementById('page-bg-style');
  if (!styleTag) {
    styleTag = canvasDoc.createElement('style');
    styleTag.id = 'page-bg-style';
    canvasDoc.head.appendChild(styleTag);
  }

  // Build one CSS rule per colored page.
  // pageBgColors keys are 0-based; nth-child is 1-based.
  const rules = Object.entries(pageBgColors)
    .filter(([, color]) => color !== null && color !== '')
    .map(([idx, color]) =>
      `.page:nth-child(${parseInt(idx) + 1}) { background-color: ${color} !important; }`
    )
    .join('\n');

  styleTag.innerHTML = rules;
}


// ──────────────────────────────────────────────────────────────
// SECTION 4 — APPLY BACKGROUND TO CANVAS
//
// TWO-LAYER STRATEGY:
//   Layer A — Direct DOM: pageEl.style.backgroundColor
//             Instant visual feedback in canvas.
//   Layer B — rebuildBgStyleTag()
//             Persists across GrapesJS re-renders by injecting
//             a dedicated <style> tag into the canvas iframe.
// ──────────────────────────────────────────────────────────────

function applyBgToCanvas(color, scope) {
  const wrapper  = editor.getWrapper();
  const allPages = wrapper.components().filter(c => c.getClasses().includes('page'));
  const targets  = getBgTargetPages(scope);

  if (targets.length === 0) {
    console.warn('Page Color: no target pages for scope:', scope);
    return;
  }

  targets.forEach(page => {
    const idx = allPages.indexOf(page);

    // Update the color store
    if (color === null) {
      delete pageBgColors[idx];
    } else {
      pageBgColors[idx] = color;
    }

    // Layer A: Direct DOM — instant visual feedback
    const pageEl = page.getEl();
    if (pageEl) {
      pageEl.style.backgroundColor = color !== null ? color : '';
    }
  });

  // Layer B: Rebuild the dedicated canvas style tag
  rebuildBgStyleTag();
}


// ──────────────────────────────────────────────────────────────
// SECTION 5 — REMOVE BACKGROUND FROM CANVAS
// ──────────────────────────────────────────────────────────────

function removeBgFromCanvas(scope) {
  applyBgToCanvas(null, scope);

  if (scope === 'all') {
    bgConfig.color = null;
    updateBgPreview();
    refreshBgSwatchSelection();
  }
}


// ──────────────────────────────────────────────────────────────
// SECTION 6 — UI: ALL SWATCH CLICK HANDLERS
// ──────────────────────────────────────────────────────────────

function clearBgSwatchSelections() {
  document.querySelectorAll('.pgbg-swatch, .pgbg-standard-swatch').forEach(s => {
    s.classList.remove('selected');
  });
  const noBtn = document.getElementById('pgbg-no-color-btn');
  if (noBtn) noBtn.classList.remove('selected');
}

function refreshBgSwatchSelection() {
  clearBgSwatchSelections();

  if (bgConfig.color === null) {
    const noBtn = document.getElementById('pgbg-no-color-btn');
    if (noBtn) noBtn.classList.add('selected');
    return;
  }

  document.querySelectorAll('.pgbg-swatch, .pgbg-standard-swatch').forEach(s => {
    if (s.dataset.color && s.dataset.color.toLowerCase() === bgConfig.color.toLowerCase()) {
      s.classList.add('selected');
    }
  });
}

document.querySelectorAll('.pgbg-swatch, .pgbg-standard-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    bgConfig.color = swatch.dataset.color;

    clearBgSwatchSelections();
    swatch.classList.add('selected');

    document.getElementById('pgbg-color-hex').value                   = swatch.dataset.color;
    document.getElementById('pgbg-color-picker').value                = swatch.dataset.color;
    document.getElementById('pgbg-hex-preview-chip').style.background = swatch.dataset.color;

    updateBgPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 7 — UI: NO COLOR BUTTON
// ──────────────────────────────────────────────────────────────

document.getElementById('pgbg-no-color-btn').addEventListener('click', () => {
  bgConfig.color = null;

  clearBgSwatchSelections();
  document.getElementById('pgbg-no-color-btn').classList.add('selected');

  document.getElementById('pgbg-color-hex').value                   = '';
  document.getElementById('pgbg-color-picker').value                = '#ffffff';
  document.getElementById('pgbg-hex-preview-chip').style.background = 'transparent';

  updateBgPreview();
});


// ──────────────────────────────────────────────────────────────
// SECTION 8 — UI: HEX INPUT
// ──────────────────────────────────────────────────────────────

document.getElementById('pgbg-color-hex').addEventListener('input', (e) => {
  const raw = e.target.value.trim();
  const val = raw.startsWith('#') ? raw : '#' + raw;

  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) return;

  bgConfig.color = val;
  clearBgSwatchSelections();
  document.getElementById('pgbg-color-picker').value                = val;
  document.getElementById('pgbg-hex-preview-chip').style.background = val;

  updateBgPreview();
});


// ──────────────────────────────────────────────────────────────
// SECTION 9 — UI: NATIVE COLOR PICKER
// ──────────────────────────────────────────────────────────────

document.getElementById('pgbg-color-picker').addEventListener('input', (e) => {
  const val = e.target.value;
  bgConfig.color = val;

  clearBgSwatchSelections();
  document.getElementById('pgbg-color-hex').value                   = val;
  document.getElementById('pgbg-hex-preview-chip').style.background = val;

  updateBgPreview();
});


// ──────────────────────────────────────────────────────────────
// SECTION 10 — UI: SCOPE RADIOS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="bg-scope"]').forEach(radio => {
  radio.addEventListener('change', () => {
    bgConfig.scope = radio.value;

    document.querySelectorAll('.pgbg-scope-label').forEach(lbl => {
      lbl.style.borderColor =
        lbl.dataset.scope === bgConfig.scope ? 'var(--accent2)' : 'var(--border)';
    });
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 11 — UI: APPLY BUTTON
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-apply-bg').addEventListener('click', () => {
  applyBgToCanvas(bgConfig.color, bgConfig.scope);

  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-background')
  ).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 12 — UI: REMOVE BUTTONS
// btn-remove-bg-current → removes from current page only (hard-coded)
// btn-remove-bg-all     → removes from all pages
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-remove-bg-current').addEventListener('click', () => {
  removeBgFromCanvas('current');
  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-background')
  ).hide();
});

document.getElementById('btn-remove-bg-all').addEventListener('click', () => {
  removeBgFromCanvas('all');
  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-background')
  ).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 13 — LIVE PREVIEW UPDATER
// ──────────────────────────────────────────────────────────────

function updateBgPreview() {
  const preview = document.getElementById('pgbg-live-preview');
  if (!preview) return;
  preview.style.background = bgConfig.color !== null ? bgConfig.color : '#ffffff';
}


// ──────────────────────────────────────────────────────────────
// SECTION 14 — MODAL OPEN: SYNC UI TO CURRENT STATE
// When modal opens, reads the active page's stored color and
// restores all UI controls to match.
// ──────────────────────────────────────────────────────────────

document.getElementById('modal-page-background').addEventListener('show.bs.modal', () => {

  // Read active page index from left panel
  const activeCard = document.querySelector('.page-card.active-page');
  const activeIdx  = activeCard ? parseInt(activeCard.dataset.pageIndex) : 0;

  // Load that page's stored color into bgConfig
  bgConfig.color = pageBgColors[activeIdx] !== undefined ? pageBgColors[activeIdx] : null;

  // Restore swatch selection
  refreshBgSwatchSelection();

  // Restore hex + picker + chip
  if (bgConfig.color !== null) {
    document.getElementById('pgbg-color-hex').value                   = bgConfig.color;
    document.getElementById('pgbg-color-picker').value                = bgConfig.color;
    document.getElementById('pgbg-hex-preview-chip').style.background = bgConfig.color;
  } else {
    document.getElementById('pgbg-color-hex').value                   = '';
    document.getElementById('pgbg-color-picker').value                = '#ffffff';
    document.getElementById('pgbg-hex-preview-chip').style.background = 'transparent';
  }

  // Restore scope radio
  const radio = document.querySelector(`input[name="bg-scope"][value="${bgConfig.scope}"]`);
  if (radio) radio.checked = true;

  // Restore scope label borders
  document.querySelectorAll('.pgbg-scope-label').forEach(lbl => {
    lbl.style.borderColor =
      lbl.dataset.scope === bgConfig.scope ? 'var(--accent2)' : 'var(--border)';
  });

  updateBgPreview();
});


// ──────────────────────────────────────────────────────────────
// SECTION 15 — PERSIST COLORS WHEN PAGES ARE ADDED/REMOVED
//
// On add: new page has no entry — rebuild style tag (no-op for it).
// On remove: re-index the pageBgColors map so nth-child rules
//            remain correct after the removed page shifts others.
// ──────────────────────────────────────────────────────────────

editor.on('component:add', (component) => {
  if (!component.getClasses().includes('page')) return;
  setTimeout(rebuildBgStyleTag, 150);
});

editor.on('component:remove', (component) => {
  if (!component.getClasses().includes('page')) return;

  // Wait for GrapesJS to finish removing, then re-index
  setTimeout(() => {
    const wrapper   = editor.getWrapper();
    const remaining = wrapper.components().filter(c => c.getClasses().includes('page'));

    // Drop any stored index that no longer has a page
    Object.keys(pageBgColors).forEach(idx => {
      if (parseInt(idx) >= remaining.length) {
        delete pageBgColors[idx];
      }
    });

    rebuildBgStyleTag();
  }, 150);
});
