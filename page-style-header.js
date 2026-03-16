// ══════════════════════════════════════════════════════════════
// PAGE STYLE — PAGE HEADER
// page-style-header.js
//
// TABLE OF CONTENTS
// ─────────────────
// SECTION 1  — Config & State Object
// SECTION 2  — Canvas CSS Builder
// SECTION 3  — Inject CSS into Canvas iframe
// SECTION 4  — Apply Header Visibility (scope logic)
// SECTION 5  — Remove All Headers
// SECTION 6  — Render Cells (replace {{PAGE}} token with real number)
// SECTION 7  — Activate Header (double-click → editable mode)
// SECTION 8  — Deactivate All Headers (save content, render tokens)
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

const headerConfig = {
  enabled : false,
  scope   : 'all',   // 'current' | 'all-except-first' | 'all'
  cells   : {
    left   : '',
    center : '',
    right  : '',
  },
};

// Tracks which page the user last interacted with (for 'current' scope)
let _headerCurrentPageIndex = 0;


// ──────────────────────────────────────────────────────────────
// SECTION 2 — CANVAS CSS BUILDER
// Builds the full CSS string that is injected into the
// GrapesJS canvas iframe. Header height auto-matches top margin.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// SECTION 2 — CANVAS CSS BUILDER  (fixed)
// ──────────────────────────────────────────────────────────────

function buildHeaderCSS() {
  const headerH = Math.max(pageConfig.padding.top, 36);

  return `
    /* ── PAGE HEADER WRAPPER ── */
    .page-header {
      position      : absolute;
      top           : 0;
      left          : 0;
      right         : 0;
      height        : ${headerH}px;
      z-index       : 5;
      box-sizing    : border-box;
      width         : 80%;
      margin-left   : auto;
      margin-right  : auto;

      /* FIX: was 'none' — blocked all mouse events including dblclick.
         Now 'auto' so dblclick reaches our handler.
         Cells still block text-selection via user-select:none below. */
      pointer-events: auto;

      display       : none;    /* hidden until enabled */
      cursor        : default; /* no text cursor in inactive state */
    }

    /* Enabled = header is visible on this page */
    .page-header.header-enabled {
      display: block;
    }

    /* ── HEADER TABLE ── */
    .page-header-table {
      width          : 100%;
      height         : 100%;
      border-collapse: collapse;
      table-layout   : fixed;
    }

    /* ── HEADER CELLS — inactive (default) ── */
    .page-header-cell {
      padding        : 4px 10px;
      vertical-align : middle;
      font-size      : 11px;
      font-family    : 'Segoe UI', Arial, sans-serif;
      color          : rgba(60, 60, 60, 0.40);
      user-select    : none;    /* no text selection when inactive */
      outline        : none;
      border         : 1px solid transparent;
      box-sizing     : border-box;
      overflow       : hidden;
      white-space    : nowrap;
      cursor         : default; /* no text cursor when inactive */
    }

    /* Column alignment — locked forever */
    .ph-left   { text-align: left;   }
    .ph-center { text-align: center; }
    .ph-right  { text-align: right;  }

    /* ── ACTIVE STATE (double-clicked → now editable) ── */
    .page-header.header-active {
      pointer-events: auto;
      border-bottom : 2px dashed rgba(100, 149, 237, 0.70);
    }

    .page-header.header-active .page-header-cell {
      border      : 1px solid rgba(100, 149, 237, 0.50);
      color       : rgba(20, 20, 20, 0.90);
      user-select : text;
      cursor      : text;
      white-space : pre-wrap;
      word-break  : break-word;
      overflow    : visible;
    }

    .page-header.header-active .page-header-cell:focus {
      background: rgba(100, 149, 237, 0.06);
      outline   : none;
    }

    /* ── PAGE OVERLAY (dims body while header is being edited) ── */
    .page-content-overlay {
      position  : absolute;
      top       : ${headerH}px;
      left      : 0;
      right     : 0;
      bottom    : 0;
      background: rgba(110, 110, 110, 0.18);
      z-index   : 4;
      cursor    : default;
    }

    /* ── PAGE NUMBER TOKEN inside a header cell ── */
    .page-number-token {
      display   : inline;
      font-style: normal;
    }
  `;
}


// ──────────────────────────────────────────────────────────────
// SECTION 3 — INJECT CSS INTO CANVAS IFRAME
// Called by applyPageStyle() in template_builder.html whenever
// the page margins change, so header height stays in sync.
// ──────────────────────────────────────────────────────────────

function applyHeaderStyleTag() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  let tag = canvasDoc.getElementById('page-header-style');
  if (!tag) {
    tag = canvasDoc.createElement('style');
    tag.id = 'page-header-style';
    canvasDoc.head.appendChild(tag);
  }
  tag.innerHTML = buildHeaderCSS();
}


// ──────────────────────────────────────────────────────────────
// SECTION 4 — APPLY HEADER VISIBILITY (scope logic)
// Adds/removes 'header-enabled' class on each page's header
// according to headerConfig.scope.
// ──────────────────────────────────────────────────────────────

function applyHeaderToCanvas() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  // Always refresh the CSS first (margin may have changed)
  applyHeaderStyleTag();

  const pages = canvasDoc.querySelectorAll('.page');

  // ── CASE: header is disabled ──
  if (!headerConfig.enabled) {
    pages.forEach(pageEl => {
      const h = pageEl.querySelector('.page-header');
      if (h) {
        h.classList.remove('header-enabled', 'header-active');
        h.querySelectorAll('.page-header-cell').forEach(c => {
          c.removeAttribute('contenteditable');
        });
      }
      // Remove any leftover overlays
      pageEl.querySelectorAll('.page-content-overlay').forEach(o => o.remove());
    });
    return;
  }

  // ── CASE: header is enabled — apply scope ──
  pages.forEach((pageEl, index) => {
    const h = pageEl.querySelector('.page-header');
    if (!h) return;

    let shouldEnable = false;

    switch (headerConfig.scope) {
      case 'all':
        shouldEnable = true;
        break;

      case 'all-except-first':
        shouldEnable = (index > 0);
        break;

      case 'current':
        shouldEnable = (index === _headerCurrentPageIndex);
        break;
    }

    if (shouldEnable) {
      h.classList.add('header-enabled');
    } else {
      // This page does NOT get a header
      h.classList.remove('header-enabled', 'header-active');
      h.querySelectorAll('.page-header-cell').forEach(c => {
        c.removeAttribute('contenteditable');
      });
      pageEl.querySelectorAll('.page-content-overlay').forEach(o => o.remove());
    }
  });

  // Render cell content on all enabled pages
  renderAllHeaderCells();

  // Re-inject iframe double-click behaviour
  injectHeaderBehaviour();
}


// ──────────────────────────────────────────────────────────────
// SECTION 5 — REMOVE ALL HEADERS
// Clears everything and resets config.
// ──────────────────────────────────────────────────────────────

function removeHeaderFromCanvas() {
  headerConfig.enabled       = false;
  headerConfig.cells.left    = '';
  headerConfig.cells.center  = '';
  headerConfig.cells.right   = '';
  applyHeaderToCanvas();
}


// ──────────────────────────────────────────────────────────────
// SECTION 6 — RENDER CELLS
// Replaces the {{PAGE}} token with the actual formatted page
// number. Called whenever header is deactivated or re-applied.
// ──────────────────────────────────────────────────────────────

// Returns the formatted page number for a given page index,
// or an empty string if numbering is not active.
function _getFormattedPageNum(pageIndex) {
  if (typeof numberingConfig === 'undefined' || !numberingConfig.enabled) {
    return '';
  }
  const n = (numberingConfig.startAt || 1) + pageIndex;
  return (typeof formatPageNumber === 'function')
    ? formatPageNumber(n, numberingConfig.format)
    : String(n);
}

// Renders one cell. Splits on {{PAGE}} and wraps the number in a span.
function _renderOneCell(cellEl, rawText, pageIndex) {
  if (!rawText) {
    cellEl.textContent = '';
    return;
  }
  if (!rawText.includes('{{PAGE}}')) {
    cellEl.textContent = rawText;
    return;
  }

  const pageNum = _getFormattedPageNum(pageIndex);
  const parts   = rawText.split('{{PAGE}}');

  cellEl.innerHTML = '';   // clear first

  parts.forEach((part, i) => {
    // Add the plain-text segment
    if (part) {
      cellEl.appendChild(document.createTextNode(part));
    }
    // After every segment except the last, insert the number span
    if (i < parts.length - 1) {
      const span = document.createElement('span');
      span.className = 'page-number-token';
      span.setAttribute('contenteditable', 'false');
      span.textContent = pageNum;
      cellEl.appendChild(span);
    }
  });
}

// Renders ALL enabled headers (skips headers currently being edited)
function renderAllHeaderCells() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  const pages = canvasDoc.querySelectorAll('.page');

  pages.forEach((pageEl, pageIndex) => {
    const h = pageEl.querySelector('.page-header');
    if (!h)                                    return;   // no header on this page
    if (!h.classList.contains('header-enabled')) return;  // not visible
    if (h.classList.contains('header-active'))   return;  // user is editing — leave alone

    ['left', 'center', 'right'].forEach(col => {
      const cell = h.querySelector(`.ph-${col}`);
      if (cell) _renderOneCell(cell, headerConfig.cells[col], pageIndex);
    });
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 7 — ACTIVATE HEADER
// Called when the user double-clicks on a header. Makes the
// header cells contenteditable and adds the page overlay.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// SECTION 7 — ACTIVATE HEADER  (updated — cross-deactivates footer)
// ──────────────────────────────────────────────────────────────

function activateHeader(headerEl) {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  // If footer is open, close it first — only one zone active at a time
  if (typeof deactivateAllFooters === 'function') deactivateAllFooters();

  // Deactivate any other header that might be open
  deactivateAllHeaders();

  // Mark this header as active
  headerEl.classList.add('header-active');

  // Show RAW text in cells (user sees {{PAGE}} literally while editing)
  ['left', 'center', 'right'].forEach(col => {
    const cell = headerEl.querySelector(`.ph-${col}`);
    if (!cell) return;
    cell.textContent = headerConfig.cells[col] || '';
    cell.setAttribute('contenteditable', 'true');
  });

  // Inject the page overlay (dims the rest of the page)
  const pageEl = headerEl.closest('.page');
  if (pageEl && !pageEl.querySelector('.page-content-overlay')) {
    const overlay = canvasDoc.createElement('div');
    overlay.className = 'page-content-overlay';
    pageEl.appendChild(overlay);
  }

  // Auto-focus the left cell
  const firstCell = headerEl.querySelector('.ph-left');
  if (firstCell) setTimeout(() => firstCell.focus(), 40);
}


// ──────────────────────────────────────────────────────────────
// SECTION 8 — DEACTIVATE ALL HEADERS
// Saves cell content back to headerConfig, removes editing state,
// removes overlay, then re-renders the {{PAGE}} tokens.
// ──────────────────────────────────────────────────────────────

function deactivateAllHeaders() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  canvasDoc.querySelectorAll('.page-header.header-active').forEach(h => {
    // ── Save typed content to config ──
    ['left', 'center', 'right'].forEach(col => {
      const cell = h.querySelector(`.ph-${col}`);
      if (cell) {
        headerConfig.cells[col] = cell.textContent || '';
        cell.removeAttribute('contenteditable');
      }
    });

    // Remove active class
    h.classList.remove('header-active');

    // Remove overlay from the parent page
    const pageEl = h.closest('.page');
    if (pageEl) {
      pageEl.querySelectorAll('.page-content-overlay').forEach(o => o.remove());
    }
  });

  // Re-render all cells now that we are back in view mode
  renderAllHeaderCells();
}


// ──────────────────────────────────────────────────────────────
// SECTION 9 — INJECT DOUBLE-CLICK BEHAVIOUR INTO CANVAS IFRAME
// This must run after the canvas is loaded. It attaches event
// listeners directly on the iframe's document.body.
// ──────────────────────────────────────────────────────────────

function injectHeaderBehaviour() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc || !canvasDoc.body) return;

  // ── Remove old listeners before re-attaching ──
  // (prevents duplicates when applyHeaderToCanvas is called multiple times)
  if (canvasDoc._hdrDblClick) {
    canvasDoc.body.removeEventListener('dblclick', canvasDoc._hdrDblClick);
  }
  if (canvasDoc._hdrClick) {
    canvasDoc.body.removeEventListener('click', canvasDoc._hdrClick);
  }

  // ── Single-click: track which page the user is on ──
  // This is used by 'current' scope to know the active page.
  const clickHandler = function(e) {
    const pageEl = e.target.closest('.page');
    if (pageEl) {
      const allPages = Array.from(canvasDoc.querySelectorAll('.page'));
      _headerCurrentPageIndex = allPages.indexOf(pageEl);
    }
  };
  canvasDoc._hdrClick = clickHandler;
  canvasDoc.body.addEventListener('click', clickHandler);

  // ── Double-click: activate / deactivate header ──
  const dblClickHandler = function(e) {
    const target = e.target;

    // ── Case A: double-clicked on the overlay → deactivate ──
    if (target.classList.contains('page-content-overlay')) {
      deactivateAllHeaders();
      return;
    }

    // ── Case B: double-clicked inside a header ──
    const headerEl = target.closest('.page-header');
    if (headerEl && headerEl.classList.contains('header-enabled')) {
      activateHeader(headerEl);
      return;
    }

    // ── Case C: double-clicked elsewhere on page while a header is active ──
    if (canvasDoc.querySelector('.page-header.header-active')) {
      deactivateAllHeaders();
    }
  };
  canvasDoc._hdrDblClick = dblClickHandler;
  canvasDoc.body.addEventListener('dblclick', dblClickHandler);
}


// ──────────────────────────────────────────────────────────────
// SECTION 10 — MODAL: SCOPE BUTTONS
// Highlights the selected scope button and updates headerConfig.
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.header-scope-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // Reset all scope buttons to inactive style
    document.querySelectorAll('.header-scope-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.background  = 'var(--bg-item)';
      b.style.color       = 'var(--text)';
    });

    // Highlight the clicked button
    btn.style.borderColor = 'var(--accent2)';
    btn.style.background  = 'rgba(78,205,196,0.12)';
    btn.style.color       = 'var(--accent2)';

    // Save to config
    headerConfig.scope = btn.dataset.scope;
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 11 — MODAL: ENABLE TOGGLE
// Shows/hides the options body based on toggle state.
// ──────────────────────────────────────────────────────────────

const _hdrToggleEl = document.getElementById('header-enable-toggle');

if (_hdrToggleEl) {
  _hdrToggleEl.addEventListener('change', () => {
    const body = document.getElementById('header-modal-body');
    if (!body) return;

    if (_hdrToggleEl.checked) {
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
// Reads toggle + scope from modal, saves to headerConfig, applies.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// SECTION 12 — MODAL: APPLY BUTTON
// Reads toggle + scope, saves to headerConfig, applies to canvas,
// then immediately activates the first visible header so the user
// can start typing without needing to double-click.
// ──────────────────────────────────────────────────────────────

const _btnApplyHeader = document.getElementById('btn-apply-header');

if (_btnApplyHeader) {
  _btnApplyHeader.addEventListener('click', () => {

    // ── STEP 1: Read toggle state ──
    const toggle = document.getElementById('header-enable-toggle');
    if (toggle) headerConfig.enabled = toggle.checked;

    // ── STEP 2: Apply header visibility to canvas ──
    // (headerConfig.scope is already live-updated by scope buttons)
    applyHeaderToCanvas();

    // ── STEP 3: Close the modal first, THEN activate ──
    // We must close the modal before activating because Bootstrap modal
    // traps focus — activating while it is open would steal focus back.
    const modalEl = document.getElementById('modal-page-header');
    const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;

    if (modalInstance) {
      // Listen for the modal's "fully hidden" event, then activate
      modalEl.addEventListener('hidden.bs.modal', function activateAfterClose() {

        // Remove this one-time listener immediately
        modalEl.removeEventListener('hidden.bs.modal', activateAfterClose);

        // Only activate if header was enabled
        if (!headerConfig.enabled) return;

        // ── STEP 4: Find the first enabled header on the canvas ──
        const canvasDoc = editor.Canvas.getDocument();
        if (!canvasDoc) return;

        const firstEnabledHeader = canvasDoc.querySelector(
          '.page-header.header-enabled'
        );

        if (firstEnabledHeader) {
          // Small delay so canvas has fully settled after modal close
          setTimeout(() => activateHeader(firstEnabledHeader), 80);
        }

      });

      modalInstance.hide();

    } else {
      // Fallback — no modal instance found, just activate directly
      if (headerConfig.enabled) {
        const canvasDoc = editor.Canvas.getDocument();
        if (!canvasDoc) return;
        const firstEnabledHeader = canvasDoc.querySelector('.page-header.header-enabled');
        if (firstEnabledHeader) {
          setTimeout(() => activateHeader(firstEnabledHeader), 80);
        }
      }
    }

  });
}

// ──────────────────────────────────────────────────────────────
// SECTION 13 — MODAL: REMOVE BUTTON
// Clears everything and hides the modal.
// ──────────────────────────────────────────────────────────────

const _btnRemoveHeader = document.getElementById('btn-remove-header');

if (_btnRemoveHeader) {
  _btnRemoveHeader.addEventListener('click', () => {
    removeHeaderFromCanvas();

    // Reset toggle UI
    const toggle = document.getElementById('header-enable-toggle');
    if (toggle) {
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change'));  // trigger opacity reset
    }

    // Close the modal
    const modalEl = document.getElementById('modal-page-header');
    if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 14 — MODAL: SYNC UI ON OPEN
// When the modal opens, its controls reflect the current state
// of headerConfig (so it doesn't reset to defaults every time).
// ──────────────────────────────────────────────────────────────

const _modalPageHeaderEl = document.getElementById('modal-page-header');

if (_modalPageHeaderEl) {
  _modalPageHeaderEl.addEventListener('show.bs.modal', () => {

    // ── Sync toggle ──
    const toggle = document.getElementById('header-enable-toggle');
    if (toggle) {
      toggle.checked = headerConfig.enabled;
      toggle.dispatchEvent(new Event('change'));  // update opacity
    }

    // ── Sync scope buttons ──
    document.querySelectorAll('.header-scope-btn').forEach(btn => {
      const isActive = (btn.dataset.scope === headerConfig.scope);
      btn.style.borderColor = isActive ? 'var(--accent2)' : 'var(--border)';
      btn.style.background  = isActive ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
      btn.style.color       = isActive ? 'var(--accent2)' : 'var(--text)';
    });
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 15 — GRAPESJS EVENTS
// Re-apply header after canvas loads and after pages are added.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// SECTION 15 — GRAPESJS EVENTS  (fixed)
// ──────────────────────────────────────────────────────────────

// FIX: 'canvas:frame:load' does not exist in GrapeJS.
// The correct event is 'load' — same one used in template_builder.html.
// GrapeJS allows multiple listeners on 'load', so adding here is safe.
editor.on('load', () => {
  // Delay so template_builder.html's load handler runs first
  // (it calls setComponents which builds the page DOM we need)
  setTimeout(() => {
    applyHeaderStyleTag();
    injectHeaderBehaviour();
  }, 300);
});

// After a new page is added — give it a header if enabled
editor.on('component:add', () => {
  setTimeout(() => applyHeaderToCanvas(), 150);
});

// When device changes (Portrait ↔ Landscape) — header height may change
editor.on('change:device', () => {
  setTimeout(() => applyHeaderToCanvas(), 150);
});