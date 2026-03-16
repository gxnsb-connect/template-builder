// ══════════════════════════════════════════════════════════════
// PAGE STYLE — PAGE FOOTER
// page-style-footer.js
//
// TABLE OF CONTENTS
// ─────────────────
// SECTION 1  — Config & State Object
// SECTION 2  — Canvas CSS Builder
// SECTION 3  — Inject CSS into Canvas iframe
// SECTION 4  — Apply Footer Visibility (scope logic)
// SECTION 5  — Remove All Footers
// SECTION 6  — Render Cells (replace {{PAGE}} token with real number)
// SECTION 7  — Activate Footer (double-click → editable mode)
// SECTION 8  — Deactivate All Footers (save content, render tokens)
// SECTION 9  — Inject Double-Click Behaviour into Canvas iframe
// SECTION 10 — Modal: Scope Buttons
// SECTION 11 — Modal: Enable Toggle
// SECTION 12 — Modal: Apply Button
// SECTION 13 — Modal: Remove Button
// SECTION 14 — Modal: Sync UI on Open
// SECTION 15 — GrapesJS Events
// ══════════════════════════════════════════════════════════════


// ──────────────────────────────────────────────────────────────
// SECTION 1 — CONFIG & STATE OBJECT
// ──────────────────────────────────────────────────────────────

const footerConfig = {
  enabled : false,
  scope   : 'all',   // 'current' | 'all-except-first' | 'all'
  cells   : {
    left   : '',
    center : '',
    right  : '',
  },
};

// Tracks which page the user last interacted with (for 'current' scope)
let _footerCurrentPageIndex = 0;


// ──────────────────────────────────────────────────────────────
// SECTION 2 — CANVAS CSS BUILDER
// Footer sits at bottom: 0. Height auto-matches bottom margin.
// Overlay covers the TOP portion of the page while footer is active.
// ──────────────────────────────────────────────────────────────

function buildFooterCSS() {
  // Auto-match bottom margin; minimum 36px so cells are never too cramped
  const footerH = Math.max(pageConfig.padding.bottom, 36);

  return `
    /* ── PAGE FOOTER WRAPPER ── */
    .page-footer {
      position      : absolute;
      bottom        : 0;
      left          : 0;
      right         : 0;
      height        : ${footerH}px;
      z-index       : 5;
      box-sizing    : border-box;
      pointer-events: auto;
      display       : none;       /* hidden until enabled */
      cursor        : default;
    }

    /* Enabled = footer is visible on this page */
    .page-footer.footer-enabled {
      display: block;
    }

    /* ── FOOTER TABLE ── */
    .page-footer-table {
      width          : 100%;
      height         : 100%;
      border-collapse: collapse;
      table-layout   : fixed;
    }

    /* ── FOOTER CELLS — inactive (default) ── */
    .page-footer-cell {
      padding        : 4px 10px;
      vertical-align : middle;
      font-size      : 11px;
      font-family    : 'Segoe UI', Arial, sans-serif;
      color          : rgba(60, 60, 60, 0.40);
      user-select    : none;
      outline        : none;
      border         : 1px solid transparent;
      box-sizing     : border-box;
      overflow       : hidden;
      white-space    : nowrap;
      cursor         : default;
    }

    /* Column alignment — locked forever */
    .pf-left   { text-align: left;   }
    .pf-center { text-align: center; }
    .pf-right  { text-align: right;  }

    /* ── ACTIVE STATE (double-clicked → now editable) ── */
    .page-footer.footer-active {
      pointer-events: auto;
      border-top    : 2px dashed rgba(100, 149, 237, 0.70);
    }

    .page-footer.footer-active .page-footer-cell {
      border      : 1px solid rgba(100, 149, 237, 0.50);
      color       : rgba(20, 20, 20, 0.90);
      user-select : text;
      cursor      : text;
      white-space : pre-wrap;
      word-break  : break-word;
      overflow    : visible;
    }

    .page-footer.footer-active .page-footer-cell:focus {
      background: rgba(100, 149, 237, 0.06);
      outline   : none;
    }

    /* ── PAGE FOOTER OVERLAY (dims page body while footer is being edited) ──
       Covers from top of page down to where footer begins.              */
    .page-footer-overlay {
      position  : absolute;
      top       : 0;
      left      : 0;
      right     : 0;
      bottom    : ${footerH}px;
      background: rgba(110, 110, 110, 0.18);
      z-index   : 4;
      cursor    : default;
    }

    /* ── PAGE NUMBER TOKEN inside a footer cell ── */
    .page-number-token {
      display   : inline;
      font-style: normal;
    }
  `;
}


// ──────────────────────────────────────────────────────────────
// SECTION 3 — INJECT CSS INTO CANVAS IFRAME
// Called by applyPageStyle() in template_builder.html whenever
// the page margins change, so footer height stays in sync.
// ──────────────────────────────────────────────────────────────

function applyFooterStyleTag() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  let tag = canvasDoc.getElementById('page-footer-style');
  if (!tag) {
    tag = canvasDoc.createElement('style');
    tag.id = 'page-footer-style';
    canvasDoc.head.appendChild(tag);
  }
  tag.innerHTML = buildFooterCSS();
}


// ──────────────────────────────────────────────────────────────
// SECTION 4 — APPLY FOOTER VISIBILITY (scope logic)
// Adds/removes 'footer-enabled' class on each page's footer
// according to footerConfig.scope.
// ──────────────────────────────────────────────────────────────

function applyFooterToCanvas() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  // Always refresh the CSS first (margin may have changed)
  applyFooterStyleTag();

  const pages = canvasDoc.querySelectorAll('.page');

  // ── CASE: footer is disabled ──
  if (!footerConfig.enabled) {
    pages.forEach(pageEl => {
      const f = pageEl.querySelector('.page-footer');
      if (f) {
        f.classList.remove('footer-enabled', 'footer-active');
        f.querySelectorAll('.page-footer-cell').forEach(c => {
          c.removeAttribute('contenteditable');
        });
      }
      // Remove any leftover overlays
      pageEl.querySelectorAll('.page-footer-overlay').forEach(o => o.remove());
    });
    return;
  }

  // ── CASE: footer is enabled — apply scope ──
  pages.forEach((pageEl, index) => {
    const f = pageEl.querySelector('.page-footer');
    if (!f) return;

    let shouldEnable = false;

    switch (footerConfig.scope) {
      case 'all':
        shouldEnable = true;
        break;

      case 'all-except-first':
        shouldEnable = (index > 0);
        break;

      case 'current':
        shouldEnable = (index === _footerCurrentPageIndex);
        break;
    }

    if (shouldEnable) {
      f.classList.add('footer-enabled');
    } else {
      // This page does NOT get a footer
      f.classList.remove('footer-enabled', 'footer-active');
      f.querySelectorAll('.page-footer-cell').forEach(c => {
        c.removeAttribute('contenteditable');
      });
      pageEl.querySelectorAll('.page-footer-overlay').forEach(o => o.remove());
    }
  });

  // Render cell content on all enabled pages
  renderAllFooterCells();

  // Re-inject iframe double-click behaviour
  injectFooterBehaviour();
}


// ──────────────────────────────────────────────────────────────
// SECTION 5 — REMOVE ALL FOOTERS
// Clears everything and resets config.
// ──────────────────────────────────────────────────────────────

function removeFooterFromCanvas() {
  footerConfig.enabled      = false;
  footerConfig.cells.left   = '';
  footerConfig.cells.center = '';
  footerConfig.cells.right  = '';
  applyFooterToCanvas();
}


// ──────────────────────────────────────────────────────────────
// SECTION 6 — RENDER CELLS
// Replaces {{PAGE}} token with the actual formatted page number.
// Re-uses _getFormattedPageNum and _renderOneCell from
// page-style-header.js (both are global function declarations).
// ──────────────────────────────────────────────────────────────

// Renders ALL enabled footers (skips footers currently being edited)
function renderAllFooterCells() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  const pages = canvasDoc.querySelectorAll('.page');

  pages.forEach((pageEl, pageIndex) => {
    const f = pageEl.querySelector('.page-footer');
    if (!f)                                    return;  // no footer on this page
    if (!f.classList.contains('footer-enabled')) return;  // not visible
    if (f.classList.contains('footer-active'))   return;  // user is editing — leave alone

    ['left', 'center', 'right'].forEach(col => {
      const cell = f.querySelector(`.pf-${col}`);
      // _renderOneCell is defined in page-style-header.js and is global
      if (cell && typeof _renderOneCell === 'function') {
        _renderOneCell(cell, footerConfig.cells[col], pageIndex);
      }
    });
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 7 — ACTIVATE FOOTER
// Called when the user double-clicks on a footer. Makes the
// footer cells contenteditable and adds the page overlay.
// ──────────────────────────────────────────────────────────────

function activateFooter(footerEl) {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  // If header is open, close it first — only one zone active at a time
  if (typeof deactivateAllHeaders === 'function') deactivateAllHeaders();

  // Deactivate any other footer that might be open
  deactivateAllFooters();

  // Mark this footer as active
  footerEl.classList.add('footer-active');

  // Show RAW text in cells (user sees {{PAGE}} literally while editing)
  ['left', 'center', 'right'].forEach(col => {
    const cell = footerEl.querySelector(`.pf-${col}`);
    if (!cell) return;
    cell.textContent = footerConfig.cells[col] || '';
    cell.setAttribute('contenteditable', 'true');
  });

  // Inject the page overlay (dims everything ABOVE the footer)
  const pageEl = footerEl.closest('.page');
  if (pageEl && !pageEl.querySelector('.page-footer-overlay')) {
    const overlay = canvasDoc.createElement('div');
    overlay.className = 'page-footer-overlay';
    pageEl.appendChild(overlay);
  }

  // Auto-focus the left cell
  const firstCell = footerEl.querySelector('.pf-left');
  if (firstCell) setTimeout(() => firstCell.focus(), 40);
}


// ──────────────────────────────────────────────────────────────
// SECTION 8 — DEACTIVATE ALL FOOTERS
// Saves cell content back to footerConfig, removes editing state,
// removes overlay, then re-renders the {{PAGE}} tokens.
// ──────────────────────────────────────────────────────────────

function deactivateAllFooters() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  canvasDoc.querySelectorAll('.page-footer.footer-active').forEach(f => {
    // ── Save typed content to config ──
    ['left', 'center', 'right'].forEach(col => {
      const cell = f.querySelector(`.pf-${col}`);
      if (cell) {
        footerConfig.cells[col] = cell.textContent || '';
        cell.removeAttribute('contenteditable');
      }
    });

    // Remove active class
    f.classList.remove('footer-active');

    // Remove overlay from the parent page
    const pageEl = f.closest('.page');
    if (pageEl) {
      pageEl.querySelectorAll('.page-footer-overlay').forEach(o => o.remove());
    }
  });

  // Re-render all cells now that we are back in view mode
  renderAllFooterCells();
}


// ──────────────────────────────────────────────────────────────
// SECTION 9 — INJECT DOUBLE-CLICK BEHAVIOUR INTO CANVAS IFRAME
// Uses separate event keys (_ftrDblClick / _ftrClick) so it
// never conflicts with the header's listeners.
// ──────────────────────────────────────────────────────────────

function injectFooterBehaviour() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc || !canvasDoc.body) return;

  // ── Remove old listeners before re-attaching (prevents duplicates) ──
  if (canvasDoc._ftrDblClick) {
    canvasDoc.body.removeEventListener('dblclick', canvasDoc._ftrDblClick);
  }
  if (canvasDoc._ftrClick) {
    canvasDoc.body.removeEventListener('click', canvasDoc._ftrClick);
  }

  // ── Single-click: track which page the user is on ──
  const clickHandler = function(e) {
    const pageEl = e.target.closest('.page');
    if (pageEl) {
      const allPages = Array.from(canvasDoc.querySelectorAll('.page'));
      _footerCurrentPageIndex = allPages.indexOf(pageEl);
    }
  };
  canvasDoc._ftrClick = clickHandler;
  canvasDoc.body.addEventListener('click', clickHandler);

  // ── Double-click: activate / deactivate footer ──
  const dblClickHandler = function(e) {
    const target = e.target;

    // ── Case A: double-clicked on the footer overlay → deactivate ──
    if (target.classList.contains('page-footer-overlay')) {
      deactivateAllFooters();
      return;
    }

    // ── Case B: double-clicked inside a footer ──
    const footerEl = target.closest('.page-footer');
    if (footerEl && footerEl.classList.contains('footer-enabled')) {
      activateFooter(footerEl);
      return;
    }

    // ── Case C: double-clicked elsewhere while a footer is active ──
    if (canvasDoc.querySelector('.page-footer.footer-active')) {
      deactivateAllFooters();
    }
  };
  canvasDoc._ftrDblClick = dblClickHandler;
  canvasDoc.body.addEventListener('dblclick', dblClickHandler);
}


// ──────────────────────────────────────────────────────────────
// SECTION 10 — MODAL: SCOPE BUTTONS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.footer-scope-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // Reset all scope buttons to inactive style
    document.querySelectorAll('.footer-scope-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.background  = 'var(--bg-item)';
      b.style.color       = 'var(--text)';
    });

    // Highlight the clicked button
    btn.style.borderColor = 'var(--accent2)';
    btn.style.background  = 'rgba(78,205,196,0.12)';
    btn.style.color       = 'var(--accent2)';

    // Save to config
    footerConfig.scope = btn.dataset.scope;
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 11 — MODAL: ENABLE TOGGLE
// ──────────────────────────────────────────────────────────────

const _ftrToggleEl = document.getElementById('footer-enable-toggle');

if (_ftrToggleEl) {
  _ftrToggleEl.addEventListener('change', () => {
    const body = document.getElementById('footer-modal-body');
    if (!body) return;

    if (_ftrToggleEl.checked) {
      body.style.opacity       = '1';
      body.style.pointerEvents = 'auto';
    } else {
      body.style.opacity       = '0.4';
      body.style.pointerEvents = 'none';
    }
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 12 — MODAL: APPLY BUTTON
// Applies footer to canvas then immediately activates the first
// visible footer after the modal closes — same pattern as header.
// ──────────────────────────────────────────────────────────────

const _btnApplyFooter = document.getElementById('btn-apply-footer');

if (_btnApplyFooter) {
  _btnApplyFooter.addEventListener('click', () => {

    // ── STEP 1: Read toggle state ──
    const toggle = document.getElementById('footer-enable-toggle');
    if (toggle) footerConfig.enabled = toggle.checked;

    // ── STEP 2: Apply footer visibility to canvas ──
    applyFooterToCanvas();

    // ── STEP 3: Close modal, then activate first enabled footer ──
    const modalEl       = document.getElementById('modal-page-footer');
    const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;

    if (modalInstance) {
      modalEl.addEventListener('hidden.bs.modal', function activateAfterClose() {
        modalEl.removeEventListener('hidden.bs.modal', activateAfterClose);

        if (!footerConfig.enabled) return;

        const canvasDoc = editor.Canvas.getDocument();
        if (!canvasDoc) return;

        const firstEnabledFooter = canvasDoc.querySelector('.page-footer.footer-enabled');
        if (firstEnabledFooter) {
          setTimeout(() => activateFooter(firstEnabledFooter), 80);
        }
      });

      modalInstance.hide();

    } else {
      // Fallback — no modal instance
      if (footerConfig.enabled) {
        const canvasDoc = editor.Canvas.getDocument();
        if (!canvasDoc) return;
        const firstEnabledFooter = canvasDoc.querySelector('.page-footer.footer-enabled');
        if (firstEnabledFooter) {
          setTimeout(() => activateFooter(firstEnabledFooter), 80);
        }
      }
    }

  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 13 — MODAL: REMOVE BUTTON
// ──────────────────────────────────────────────────────────────

const _btnRemoveFooter = document.getElementById('btn-remove-footer');

if (_btnRemoveFooter) {
  _btnRemoveFooter.addEventListener('click', () => {
    removeFooterFromCanvas();

    // Reset toggle UI
    const toggle = document.getElementById('footer-enable-toggle');
    if (toggle) {
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change'));
    }

    // Close the modal
    const modalEl = document.getElementById('modal-page-footer');
    if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 14 — MODAL: SYNC UI ON OPEN
// ──────────────────────────────────────────────────────────────

const _modalPageFooterEl = document.getElementById('modal-page-footer');

if (_modalPageFooterEl) {
  _modalPageFooterEl.addEventListener('show.bs.modal', () => {

    // Sync toggle
    const toggle = document.getElementById('footer-enable-toggle');
    if (toggle) {
      toggle.checked = footerConfig.enabled;
      toggle.dispatchEvent(new Event('change'));
    }

    // Sync scope buttons
    document.querySelectorAll('.footer-scope-btn').forEach(btn => {
      const isActive = (btn.dataset.scope === footerConfig.scope);
      btn.style.borderColor = isActive ? 'var(--accent2)' : 'var(--border)';
      btn.style.background  = isActive ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
      btn.style.color       = isActive ? 'var(--accent2)' : 'var(--text)';
    });
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 15 — GRAPESJS EVENTS
// ──────────────────────────────────────────────────────────────

editor.on('load', () => {
  setTimeout(() => {
    applyFooterStyleTag();
    injectFooterBehaviour();
  }, 350);  // slightly after header's 300ms so both settle cleanly
});

editor.on('component:add', () => {
  setTimeout(() => applyFooterToCanvas(), 150);
});

editor.on('change:device', () => {
  setTimeout(() => applyFooterToCanvas(), 150);
});