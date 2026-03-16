// ══════════════════════════════════════════════════════════════
// PAGE STYLE — PAGE BORDER
// page-style-border.js
//
// TABLE OF CONTENTS
// -----------------
// SECTION 1  — Border State Object
// SECTION 2  — GrapesJS Target Page Resolver
// SECTION 3  — Border Style Object Builder
// SECTION 4  — Apply Border to Canvas  (main write)
// SECTION 5  — Remove Border from Canvas
// SECTION 6  — UI: Border Design Buttons  (Left/Right/Top/Bottom/All)
// SECTION 7  — UI: Border Weight Buttons  (1px–16px)
// SECTION 8  — UI: Border Style Buttons   (Solid/Dashed/Dotted/Double)
// SECTION 9  — UI: Border Color           (swatches + hex + picker)
// SECTION 10 — UI: Apply-To Scope Radios
// SECTION 11 — UI: Apply Button
// SECTION 12 — UI: Remove Border Button
// SECTION 13 — Live Preview Updater
// SECTION 14 — Modal Open: Sync UI to current state
// ══════════════════════════════════════════════════════════════


// ──────────────────────────────────────────────────────────────
// SECTION 1 — BORDER STATE OBJECT
// Tracks the user's current selections across modal open/close.
// ──────────────────────────────────────────────────────────────

const borderConfig = {
  design : 'all',       // 'all' | 'top' | 'bottom' | 'left' | 'right'
  weight : '1',         // '1','2','3','4','6','8','10','12','16'
  style  : 'solid',     // 'solid' | 'dashed' | 'dotted' | 'double'
  color  : '#000000',   // hex color string  e.g. '#1565C0'
  scope  : 'current',   // 'current' | 'first' | 'except-first' | 'all'
};


// ──────────────────────────────────────────────────────────────
// SECTION 2 — GRAPESJS TARGET PAGE RESOLVER
// Returns the correct array of GrapesJS page components
// depending on the selected Apply-To scope.
// ──────────────────────────────────────────────────────────────

function getBorderTargetPages(scope) {
  const wrapper  = editor.getWrapper();
  const allPages = wrapper.components().filter(c => c.getClasses().includes('page'));

  if (scope === 'first')         return allPages.slice(0, 1);
  if (scope === 'except-first')  return allPages.slice(1);
  if (scope === 'all')           return allPages;

  // ── Default: 'current' ──
  // Read which page card is highlighted in the Left Panel
  const activeCard  = document.querySelector('.page-card.active-page');
  const activeIndex = activeCard ? parseInt(activeCard.dataset.pageIndex) : 0;
  const target      = allPages[activeIndex];

  // Fallback to page 0 if nothing is active
  return target ? [target] : (allPages.length ? [allPages[0]] : []);
}


// ──────────────────────────────────────────────────────────────
// SECTION 3 — BORDER STYLE OBJECT BUILDER
// Converts borderConfig into a GrapesJS-compatible style object.
// Each call produces top/right/bottom/left individually so that
// partial borders work correctly with GrapesJS setStyle().
// ──────────────────────────────────────────────────────────────

function buildBorderStyleObj(cfg) {
  const val  = `${cfg.weight}px ${cfg.style} ${cfg.color}`;  // e.g. "2px solid #000"
  const none = 'none';

  // Start with all sides set to 'none'
  const sides = { top: none, right: none, bottom: none, left: none };

  if (cfg.design === 'all') {
    // Set every side
    sides.top = sides.right = sides.bottom = sides.left = val;
  } else {
    // Only set the chosen side; leave others as 'none'
    sides[cfg.design] = val;
  }

  return {
    'border'        : '',            // Clear CSS shorthand to prevent conflict
    'border-top'    : sides.top,
    'border-right'  : sides.right,
    'border-bottom' : sides.bottom,
    'border-left'   : sides.left,
  };
}


// ──────────────────────────────────────────────────────────────
// SECTION 4 — APPLY BORDER TO CANVAS
// Writes border styles to the target GrapesJS .page component(s)
// using setStyle() — the correct GrapesJS approach.
// Note: We target .page (the white A4 sheet), NOT .page-content.
// ──────────────────────────────────────────────────────────────

function applyBorderToCanvas(cfg) {
  const pages       = getBorderTargetPages(cfg.scope);
  const borderStyle = buildBorderStyleObj(cfg);

  if (pages.length === 0) {
    console.warn('Page Border: No target pages found for scope:', cfg.scope);
    return;
  }

  pages.forEach(page => {
    // Merge new border styles into the existing inline styles
    const existing = { ...page.getStyle() };
    delete existing['border'];  // Remove shorthand to avoid conflict with individual sides
    page.setStyle({ ...existing, ...borderStyle });
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 5 — REMOVE BORDER FROM CANVAS
// Deletes all border inline styles from target pages.
// This lets the base CSS (.page { border: 1px solid rgba... })
// take effect again (the thin gray page outline is restored).
// ──────────────────────────────────────────────────────────────

function removeBorderFromPages(scope) {
  const pages = getBorderTargetPages(scope);

  const BORDER_KEYS = [
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-width',
    'border-style',
    'border-color',
  ];

  pages.forEach(page => {
    const existing = { ...page.getStyle() };
    // Delete all border-related keys from inline styles
    BORDER_KEYS.forEach(key => delete existing[key]);
    page.setStyle(existing);
  });
}


// ──────────────────────────────────────────────────────────────
// SECTION 6 — UI: BORDER DESIGN BUTTONS
// Handles: Left Border, Right Border, Top Border, Bottom Border,
// and Border All buttons.
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.border-design-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // ── Step A: Reset all design buttons to inactive state
    document.querySelectorAll('.border-design-btn').forEach(b => {
      b.style.borderColor  = 'var(--border)';
      b.style.color        = 'var(--text)';
      b.style.background   = 'var(--bg-item)';
    });

    // ── Step B: Mark clicked button as active
    btn.style.borderColor  = 'var(--accent2)';
    btn.style.color        = 'var(--accent2)';
    btn.style.background   = 'rgba(78,205,196,0.12)';

    // ── Step C: Save to state
    borderConfig.design = btn.dataset.design;

    // ── Step D: Update the live preview box
    updateBorderPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 7 — UI: BORDER WEIGHT BUTTONS
// Handles: 1px, 2px, 3px, 4px, 6px, 8px, 10px, 12px, 16px
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.border-weight-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // ── Step A: Reset all weight buttons
    document.querySelectorAll('.border-weight-btn').forEach(b => {
      b.style.borderColor  = 'var(--border)';
      b.style.color        = 'var(--text-muted)';
      b.style.background   = 'var(--bg-item)';
    });

    // ── Step B: Activate clicked
    btn.style.borderColor  = 'var(--accent2)';
    btn.style.color        = 'var(--accent2)';
    btn.style.background   = 'rgba(78,205,196,0.12)';

    // ── Step C: Save to state
    borderConfig.weight = btn.dataset.weight;

    // ── Step D: Update preview
    updateBorderPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 8 — UI: BORDER STYLE BUTTONS
// Handles: Solid, Dashed, Dotted, Double
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.border-style-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // ── Step A: Reset all style buttons
    document.querySelectorAll('.border-style-btn').forEach(b => {
      b.style.borderColor  = 'var(--border)';
      b.style.color        = 'var(--text-muted)';
      b.style.background   = 'var(--bg-item)';
    });

    // ── Step B: Activate clicked
    btn.style.borderColor  = 'var(--accent2)';
    btn.style.color        = 'var(--accent2)';
    btn.style.background   = 'rgba(78,205,196,0.12)';

    // ── Step C: Save to state
    borderConfig.style = btn.dataset.style;

    // ── Step D: Update preview
    updateBorderPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 9 — UI: BORDER COLOR
// Three ways to pick a color:
//   9a. Click a swatch from the color palette grid
//   9b. Type a hex value directly in the text input
//   9c. Use the native OS color picker ("More Colors")
// ──────────────────────────────────────────────────────────────

// ── 9a: Color Swatch Click ──
document.querySelectorAll('.border-color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {

    // Clear selection ring from all swatches
    document.querySelectorAll('.border-color-swatch').forEach(s => {
      s.style.outline       = 'none';
      s.style.outlineOffset = '0';
    });

    // Add selection ring to clicked swatch
    swatch.style.outline       = '2px solid var(--accent2)';
    swatch.style.outlineOffset = '2px';

    // Save color + sync the inputs + update preview
    const hex = swatch.dataset.color;
    borderConfig.color = hex;
    document.getElementById('border-color-hex').value    = hex;
    document.getElementById('border-color-picker').value = hex;
    updateBorderPreview();
  });
});

// ── 9b: Hex Text Input ──
document.getElementById('border-color-hex').addEventListener('input', (e) => {
  const val     = e.target.value.trim();
  const isValid = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);
  if (!isValid) return;

  // Deselect all swatches — user is typing manually
  document.querySelectorAll('.border-color-swatch').forEach(s => {
    s.style.outline = 'none';
    s.style.outlineOffset = '0';
  });

  borderConfig.color = val;
  document.getElementById('border-color-picker').value = val;
  updateBorderPreview();
});

// ── 9c: Native OS Color Picker ──
document.getElementById('border-color-picker').addEventListener('input', (e) => {
  const val = e.target.value;   // always valid hex from browser

  // Deselect all swatches
  document.querySelectorAll('.border-color-swatch').forEach(s => {
    s.style.outline = 'none';
    s.style.outlineOffset = '0';
  });

  borderConfig.color = val;
  document.getElementById('border-color-hex').value = val;
  updateBorderPreview();
});


// ──────────────────────────────────────────────────────────────
// SECTION 10 — UI: APPLY-TO SCOPE RADIOS
// Current Page / First Page Only / All Except First / All Pages
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="border-scope"]').forEach(radio => {
  radio.addEventListener('change', () => {
    borderConfig.scope = radio.value;

    // Update the visual border on each label card
    document.querySelectorAll('.border-scope-label').forEach(lbl => {
      lbl.style.borderColor = lbl.dataset.scope === borderConfig.scope
        ? 'var(--accent2)'
        : 'var(--border)';
    });
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 11 — UI: APPLY BUTTON
// Writes the border to the canvas then closes the modal.
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-apply-border').addEventListener('click', () => {

  // Apply border via GrapesJS setStyle()
  applyBorderToCanvas(borderConfig);

  // Close the modal
  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-border')
  ).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 12 — UI: REMOVE BORDER BUTTON
// Clears all border inline styles from the target pages.
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-remove-border').addEventListener('click', () => {

  // Clear all border styles via GrapesJS
  removeBorderFromPages(borderConfig.scope);

  // Close the modal
  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-border')
  ).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 13 — LIVE PREVIEW UPDATER
// Updates the small page thumbnail inside the modal in real-time
// so the user can see what the border will look like before Apply.
// ──────────────────────────────────────────────────────────────

function updateBorderPreview() {
  const previewEl = document.getElementById('border-live-preview');
  if (!previewEl) return;

  const val  = `${borderConfig.weight}px ${borderConfig.style} ${borderConfig.color}`;
  const none = 'none';

  previewEl.style.borderTop    = (borderConfig.design === 'all' || borderConfig.design === 'top')    ? val : none;
  previewEl.style.borderRight  = (borderConfig.design === 'all' || borderConfig.design === 'right')  ? val : none;
  previewEl.style.borderBottom = (borderConfig.design === 'all' || borderConfig.design === 'bottom') ? val : none;
  previewEl.style.borderLeft   = (borderConfig.design === 'all' || borderConfig.design === 'left')   ? val : none;
}


// ──────────────────────────────────────────────────────────────
// SECTION 14 — MODAL OPEN: SYNC UI TO CURRENT STATE
// Every time the modal opens, restore all button highlights,
// color swatch selection, hex value, and radio state
// to match whatever is stored in borderConfig.
// ──────────────────────────────────────────────────────────────

document.getElementById('modal-page-border').addEventListener('show.bs.modal', () => {

  // ── Sync Design Buttons ──
  document.querySelectorAll('.border-design-btn').forEach(b => {
    const active = b.dataset.design === borderConfig.design;
    b.style.borderColor  = active ? 'var(--accent2)' : 'var(--border)';
    b.style.color        = active ? 'var(--accent2)' : 'var(--text)';
    b.style.background   = active ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // ── Sync Weight Buttons ──
  document.querySelectorAll('.border-weight-btn').forEach(b => {
    const active = b.dataset.weight === borderConfig.weight;
    b.style.borderColor  = active ? 'var(--accent2)' : 'var(--border)';
    b.style.color        = active ? 'var(--accent2)' : 'var(--text-muted)';
    b.style.background   = active ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // ── Sync Style Buttons ──
  document.querySelectorAll('.border-style-btn').forEach(b => {
    const active = b.dataset.style === borderConfig.style;
    b.style.borderColor  = active ? 'var(--accent2)' : 'var(--border)';
    b.style.color        = active ? 'var(--accent2)' : 'var(--text-muted)';
    b.style.background   = active ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // ── Sync Hex Input & Color Picker ──
  document.getElementById('border-color-hex').value    = borderConfig.color;
  document.getElementById('border-color-picker').value = borderConfig.color;

  // ── Sync Color Swatches ──
  document.querySelectorAll('.border-color-swatch').forEach(s => {
    const match = s.dataset.color.toLowerCase() === borderConfig.color.toLowerCase();
    s.style.outline       = match ? '2px solid var(--accent2)' : 'none';
    s.style.outlineOffset = match ? '2px' : '0';
  });

  // ── Sync Scope Radio ──
  const activeRadio = document.querySelector(
    `input[name="border-scope"][value="${borderConfig.scope}"]`
  );
  if (activeRadio) activeRadio.checked = true;

  // ── Sync Scope Label Borders ──
  document.querySelectorAll('.border-scope-label').forEach(lbl => {
    lbl.style.borderColor = lbl.dataset.scope === borderConfig.scope
      ? 'var(--accent2)'
      : 'var(--border)';
  });

  // ── Refresh Live Preview ──
  updateBorderPreview();
});
