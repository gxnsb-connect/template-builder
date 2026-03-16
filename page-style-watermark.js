// ══════════════════════════════════════════════════════════════
// PAGE STYLE — WATERMARK
// page-style-watermark.js
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────
// A <style id="watermark-style"> tag is injected directly into
// the GrapesJS canvas iframe. Watermark text is rendered using
// CSS ::before pseudo-elements on .page divs — this means the
// watermark is NEVER a selectable GrapesJS component, cannot be
// accidentally clicked or deleted by the user, and always sits
// on top of all page content.
//
// Color is always converted to rgba() with 0.15 opacity so the
// watermark is always faded/transparent regardless of the color
// the user picks.
//
// Per-page removal is tracked in wmRemovedPages (a Set of 0-based
// page indexes). When rebuilding the style tag, removed pages get
// an override rule that hides the ::before on that page.
//
// TABLE OF CONTENTS
// -----------------
// SECTION 1  — State: wmConfig + wmRemovedPages
// SECTION 2  — Helper: hex color → rgba with opacity
// SECTION 3  — Helper: get active (current) page index
// SECTION 4  — Core: Build CSS rules string from wmConfig
// SECTION 5  — Core: Inject/rebuild <style id="watermark-style">
// SECTION 6  — Core: Apply watermark to canvas
// SECTION 7  — Core: Remove watermark (current page or all)
// SECTION 8  — UI: Enable/Disable toggle
// SECTION 9  — UI: Preset / Custom type radio switch
// SECTION 10 — UI: Preset button selection
// SECTION 11 — UI: Layout radio (Diagonal / Horizontal)
// SECTION 12 — UI: Scope radio (All / Except First / Current)
// SECTION 13 — UI: Color picker sync
// SECTION 14 — UI: Apply button
// SECTION 15 — UI: Remove Current Page button
// SECTION 16 — UI: Remove All button
// SECTION 17 — Modal open: Sync UI to current state
// ══════════════════════════════════════════════════════════════


// ──────────────────────────────────────────────────────────────
// SECTION 1 — STATE
//
// wmConfig       : all current watermark settings
// wmRemovedPages : Set of 0-based page indexes where the
//                  watermark has been individually removed
// ──────────────────────────────────────────────────────────────

const wmConfig = {
  enabled   : false,
  type      : 'preset',          // 'preset' | 'custom'
  text      : 'CONFIDENTIAL',    // resolved watermark text
  fontSize  : 72,
  color     : '#ff0000',         // hex — converted to rgba on apply
  textCase  : 'uppercase',       // 'uppercase' | 'capitalize' | 'lowercase'
  layout    : 'diagonal',        // 'diagonal' | 'horizontal'
  scope     : 'all',             // 'all' | 'except-first' | 'current'
};

// Tracks 0-based page indexes where watermark was individually removed
const wmRemovedPages = new Set();


// ──────────────────────────────────────────────────────────────
// SECTION 2 — HELPER: HEX → RGBA WITH OPACITY
//
// Always forces opacity to 0.15 so watermark is always faded.
// Accepts full (#rrggbb) or short (#rgb) hex strings.
// ──────────────────────────────────────────────────────────────

function wmHexToRgba(hex, opacity) {
  // Strip the leading #
  let clean = hex.replace('#', '');

  // Expand shorthand #rgb → #rrggbb
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  // Validate — fall back to red if parse fails
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(255, 0, 0, ${opacity})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}


// ──────────────────────────────────────────────────────────────
// SECTION 3 — HELPER: GET ACTIVE PAGE INDEX
//
// Reads the active-page card from the left panel (same approach
// used by page-style-margin.js and page-style-background.js).
// Returns 0 if no active card is found.
// ──────────────────────────────────────────────────────────────

function wmGetActivePageIndex() {
  const activeCard = document.querySelector('.page-card.active-page');
  return activeCard ? parseInt(activeCard.dataset.pageIndex) : 0;
}


// ──────────────────────────────────────────────────────────────
// SECTION 4 — CORE: BUILD CSS RULES STRING
//
// Builds the full CSS string that will go inside the
// <style id="watermark-style"> tag.
//
// THREE scope modes produce different CSS selectors:
//   all          → .page::before { ... }
//   except-first → .page:not(:first-child)::before { ... }
//   current      → .page:nth-child(N)::before { ... }
//
// Per-page removals (wmRemovedPages) always add an override:
//   .page:nth-child(N)::before { display:none !important; }
// ──────────────────────────────────────────────────────────────

function wmBuildCSS() {

  // ── Resolve the watermark text ──
  let rawText = '';
  if (wmConfig.type === 'preset') {
    rawText = wmConfig.text;
  } else {
    const customInput = document.getElementById('watermark-custom-text');
    rawText = customInput ? customInput.value.trim() : '';
  }

  // ── Apply text case ──
  let displayText = rawText;
  if      (wmConfig.textCase === 'uppercase')  displayText = rawText.toUpperCase();
  else if (wmConfig.textCase === 'lowercase')  displayText = rawText.toLowerCase();
  else if (wmConfig.textCase === 'capitalize') {
    displayText = rawText.replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Fallback if empty ──
  if (!displayText) displayText = 'WATERMARK';

  // ── Color: always faded at 0.15 opacity ──
  const rgbaColor = wmHexToRgba(wmConfig.color, 0.15);

  // ── Rotation: diagonal = -45deg, horizontal = 0deg ──
  const rotation = wmConfig.layout === 'diagonal' ? '-45deg' : '0deg';

  // ── Font size ──
  const fontSize = wmConfig.fontSize || 72;

  // ── Base ::before rule CSS properties ──
  const baseProps = `
    content: "${displayText}";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(${rotation});
    font-size: ${fontSize}px;
    font-weight: 700;
    color: ${rgbaColor};
    pointer-events: none;
    z-index: 9999;
    white-space: nowrap;
    letter-spacing: 4px;
    text-transform: none;
    user-select: none;
    -webkit-user-select: none;
  `.trim();

  // ── .page divs need position:relative so ::before can be absolute ──
  const pagePositionRule = `.page { position: relative !important; overflow: hidden; }`;

  // ── Build the scope selector ──
  let rules = '';

  if (wmConfig.scope === 'all') {

    rules += `.page::before { ${baseProps} }\n`;

  } else if (wmConfig.scope === 'except-first') {

    rules += `.page:not(:first-child)::before { ${baseProps} }\n`;

  } else if (wmConfig.scope === 'current') {

    // nth-child is 1-based; wmGetActivePageIndex() is 0-based
    const nthChild = wmGetActivePageIndex() + 1;
    rules += `.page:nth-child(${nthChild})::before { ${baseProps} }\n`;

  }

  // ── Per-page removal overrides ──
  // Any page in wmRemovedPages gets display:none to hide its ::before
  wmRemovedPages.forEach(pageIdx => {
    const nthChild = pageIdx + 1;
    rules += `.page:nth-child(${nthChild})::before { display:none !important; }\n`;
  });

  return pagePositionRule + '\n' + rules;
}


// ──────────────────────────────────────────────────────────────
// SECTION 5 — CORE: INJECT / REBUILD STYLE TAG IN CANVAS
//
// Gets or creates <style id="watermark-style"> inside the
// GrapesJS canvas iframe head, then sets its innerHTML to
// the CSS string from wmBuildCSS().
// ──────────────────────────────────────────────────────────────

function wmRebuildStyleTag() {
  const canvasDoc = editor.Canvas.getDocument();

  if (!canvasDoc) {
    console.warn('Watermark: canvas document not ready.');
    return;
  }

  let styleTag = canvasDoc.getElementById('watermark-style');

  if (!styleTag) {
    styleTag = canvasDoc.createElement('style');
    styleTag.id = 'watermark-style';
    canvasDoc.head.appendChild(styleTag);
  }

  styleTag.innerHTML = wmBuildCSS();
}


// ──────────────────────────────────────────────────────────────
// SECTION 6 — CORE: APPLY WATERMARK TO CANVAS
//
// Reads all current settings from modal UI into wmConfig,
// then builds CSS and injects into canvas.
// Called by the Apply button (Section 14).
// ──────────────────────────────────────────────────────────────

function wmApply() {

  if (!wmConfig.enabled) {
    console.warn('Watermark: toggle is OFF — nothing applied.');
    return;
  }

  // ── Sync wmConfig from modal UI before building CSS ──

  // Text (preset text already set by preset btn click; custom read here)
  if (wmConfig.type === 'custom') {
    const customInput = document.getElementById('watermark-custom-text');
    wmConfig.text = customInput ? customInput.value.trim() : 'WATERMARK';
  }

  // Font size
  const fontSizeInput = document.getElementById('watermark-font-size');
  wmConfig.fontSize = fontSizeInput ? (parseInt(fontSizeInput.value) || 72) : 72;

  // Color
  const colorInput = document.getElementById('watermark-color');
  wmConfig.color = colorInput ? colorInput.value : '#ff0000';

  // Text case
  const caseSelect = document.getElementById('watermark-text-case');
  wmConfig.textCase = caseSelect ? caseSelect.value : 'uppercase';

  // Layout
  wmConfig.layout = document.getElementById('wm-layout-diagonal').checked
    ? 'diagonal' : 'horizontal';

  // Scope
  if      (document.getElementById('wm-scope-all').checked)          wmConfig.scope = 'all';
  else if (document.getElementById('wm-scope-except-first').checked)  wmConfig.scope = 'except-first';
  else                                                                  wmConfig.scope = 'current';

  // ── Rebuild style tag with fresh CSS ──
  wmRebuildStyleTag();

  console.log('Watermark applied:', wmConfig);
}


// ──────────────────────────────────────────────────────────────
// SECTION 7 — CORE: REMOVE WATERMARK
//
// wmRemoveCurrentPage():
//   Adds current page index to wmRemovedPages then rebuilds.
//   Only that page is hidden — all others keep their watermark.
//
// wmRemoveAll():
//   Empties the style tag completely and resets all state.
// ──────────────────────────────────────────────────────────────

function wmRemoveCurrentPage() {
  const idx = wmGetActivePageIndex();
  wmRemovedPages.add(idx);
  wmRebuildStyleTag();
  console.log('Watermark removed from page index:', idx);
}

function wmRemoveAll() {
  const canvasDoc = editor.Canvas.getDocument();

  if (canvasDoc) {
    const styleTag = canvasDoc.getElementById('watermark-style');
    if (styleTag) {
      styleTag.innerHTML = '';
    }
  }

  // Reset all state
  wmRemovedPages.clear();
  wmConfig.enabled = false;

  // Reflect toggle OFF in the UI
  const toggle = document.getElementById('watermark-enabled');
  if (toggle) toggle.checked = false;

  // Hide the settings panel
  const wrapper = document.getElementById('watermark-settings-wrapper');
  if (wrapper) wrapper.style.display = 'none';

  console.log('Watermark removed from all pages.');
}


// ──────────────────────────────────────────────────────────────
// SECTION 8 — UI: ENABLE / DISABLE TOGGLE
//
// Shows or hides the settings wrapper below the toggle.
// When turned OFF, clears the canvas style tag immediately.
// ──────────────────────────────────────────────────────────────

document.getElementById('watermark-enabled').addEventListener('change', function () {
  wmConfig.enabled = this.checked;

  const wrapper = document.getElementById('watermark-settings-wrapper');

  if (this.checked) {
    // Show settings panel
    wrapper.style.display = 'flex';
  } else {
    // Hide settings panel and clear watermark from canvas immediately
    wrapper.style.display = 'none';

    const canvasDoc = editor.Canvas.getDocument();
    if (canvasDoc) {
      const styleTag = canvasDoc.getElementById('watermark-style');
      if (styleTag) styleTag.innerHTML = '';
    }
  }
});


// ──────────────────────────────────────────────────────────────
// SECTION 9 — UI: PRESET / CUSTOM TYPE RADIO SWITCH
//
// Switching between Preset and Custom:
//   - Highlights the selected label border with accent2 color
//   - Shows/hides the correct input section
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="wm-type"]').forEach(radio => {
  radio.addEventListener('change', function () {

    wmConfig.type = this.value;

    const presetLabel   = document.getElementById('wm-type-preset-label');
    const customLabel   = document.getElementById('wm-type-custom-label');
    const presetChoices = document.getElementById('wm-preset-choices');
    const customInput   = document.getElementById('wm-custom-input');

    if (this.value === 'preset') {
      presetLabel.style.borderColor = 'var(--accent2)';
      customLabel.style.borderColor = 'var(--border)';
      presetChoices.style.display   = 'block';
      customInput.style.display     = 'none';
    } else {
      presetLabel.style.borderColor = 'var(--border)';
      customLabel.style.borderColor = 'var(--accent2)';
      presetChoices.style.display   = 'none';
      customInput.style.display     = 'block';
    }
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 10 — UI: PRESET BUTTON SELECTION
//
// Clicking a preset button:
//   - Highlights the clicked button border with accent2 color
//   - Removes highlight from all other preset buttons
//   - Sets wmConfig.text to the button's data-preset value
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.wm-preset-btn').forEach(btn => {
  btn.addEventListener('click', function () {

    // Remove highlight from all preset buttons
    document.querySelectorAll('.wm-preset-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
    });

    // Highlight the clicked button
    this.style.borderColor = 'var(--accent2)';

    // Store in wmConfig
    wmConfig.text = this.dataset.preset;

    console.log('Watermark preset selected:', wmConfig.text);
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 11 — UI: LAYOUT RADIO (DIAGONAL / HORIZONTAL)
//
// Highlights the selected layout label and stores the choice.
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="wm-layout"]').forEach(radio => {
  radio.addEventListener('change', function () {

    wmConfig.layout = this.value;

    const diagLabel  = document.getElementById('wm-layout-diagonal-label');
    const horizLabel = document.getElementById('wm-layout-horizontal-label');

    if (this.value === 'diagonal') {
      diagLabel.style.borderColor  = 'var(--accent2)';
      horizLabel.style.borderColor = 'var(--border)';
    } else {
      diagLabel.style.borderColor  = 'var(--border)';
      horizLabel.style.borderColor = 'var(--accent2)';
    }
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 12 — UI: SCOPE RADIO (ALL / EXCEPT FIRST / CURRENT)
//
// Highlights the selected scope label and stores the choice.
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="wm-scope"]').forEach(radio => {
  radio.addEventListener('change', function () {

    wmConfig.scope = this.value;

    // Reset all scope label borders
    document.getElementById('wm-scope-all-label').style.borderColor          = 'var(--border)';
    document.getElementById('wm-scope-except-first-label').style.borderColor = 'var(--border)';
    document.getElementById('wm-scope-current-label').style.borderColor      = 'var(--border)';

    // Highlight the selected one
    const selectedLabel = document.getElementById(`wm-scope-${this.value}-label`);
    if (selectedLabel) selectedLabel.style.borderColor = 'var(--accent2)';
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 13 — UI: COLOR PICKER SYNC
//
// Keeps the hex label next to the color picker in sync as the
// user picks a color.
// ──────────────────────────────────────────────────────────────

document.getElementById('watermark-color').addEventListener('input', function () {
  wmConfig.color = this.value;

  const hexLabel = document.getElementById('watermark-color-hex');
  if (hexLabel) hexLabel.textContent = this.value;
});


// ──────────────────────────────────────────────────────────────
// SECTION 14 — UI: APPLY BUTTON
//
// Validates toggle is ON, calls wmApply(), closes the modal.
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-wm-apply').addEventListener('click', function () {

  if (!wmConfig.enabled) {
    alert('Please enable the watermark toggle first.');
    return;
  }

  wmApply();

  // Close modal
  const modalEl = document.getElementById('modal-page-watermark');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 15 — UI: REMOVE CURRENT PAGE BUTTON
//
// Hides watermark on the currently active page only,
// then closes the modal.
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-wm-remove-current').addEventListener('click', function () {
  wmRemoveCurrentPage();

  const modalEl = document.getElementById('modal-page-watermark');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 16 — UI: REMOVE ALL BUTTON
//
// Calls wmRemoveAll() — clears canvas style tag, resets all
// state, turns toggle OFF, then closes the modal.
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-wm-remove-all').addEventListener('click', function () {
  wmRemoveAll();

  const modalEl = document.getElementById('modal-page-watermark');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 17 — MODAL OPEN: SYNC UI TO CURRENT STATE
//
// When the modal opens, reflect wmConfig back into all UI
// controls so the user always sees the current active settings.
// Same pattern used by page-style-margin.js (show.bs.modal).
// ──────────────────────────────────────────────────────────────

document.getElementById('modal-page-watermark').addEventListener('show.bs.modal', function () {

  // ── Toggle ──
  const toggle  = document.getElementById('watermark-enabled');
  toggle.checked = wmConfig.enabled;

  const wrapper = document.getElementById('watermark-settings-wrapper');
  wrapper.style.display = wmConfig.enabled ? 'flex' : 'none';

  // ── Type radio ──
  document.getElementById(
    wmConfig.type === 'preset' ? 'wm-type-preset' : 'wm-type-custom'
  ).checked = true;

  document.getElementById('wm-type-preset-label').style.borderColor
    = wmConfig.type === 'preset' ? 'var(--accent2)' : 'var(--border)';
  document.getElementById('wm-type-custom-label').style.borderColor
    = wmConfig.type === 'custom' ? 'var(--accent2)' : 'var(--border)';

  document.getElementById('wm-preset-choices').style.display
    = wmConfig.type === 'preset' ? 'block' : 'none';
  document.getElementById('wm-custom-input').style.display
    = wmConfig.type === 'custom' ? 'block' : 'none';

  // ── Preset button highlight ──
  document.querySelectorAll('.wm-preset-btn').forEach(btn => {
    btn.style.borderColor = btn.dataset.preset === wmConfig.text
      ? 'var(--accent2)' : 'var(--border)';
  });

  // ── Custom text ──
  const customInput = document.getElementById('watermark-custom-text');
  if (customInput && wmConfig.type === 'custom') {
    customInput.value = wmConfig.text;
  }

  // ── Font size ──
  document.getElementById('watermark-font-size').value = wmConfig.fontSize;

  // ── Color ──
  document.getElementById('watermark-color').value       = wmConfig.color;
  document.getElementById('watermark-color-hex').textContent = wmConfig.color;

  // ── Text case ──
  document.getElementById('watermark-text-case').value = wmConfig.textCase;

  // ── Layout radio ──
  document.getElementById(
    wmConfig.layout === 'diagonal' ? 'wm-layout-diagonal' : 'wm-layout-horizontal'
  ).checked = true;

  document.getElementById('wm-layout-diagonal-label').style.borderColor
    = wmConfig.layout === 'diagonal' ? 'var(--accent2)' : 'var(--border)';
  document.getElementById('wm-layout-horizontal-label').style.borderColor
    = wmConfig.layout === 'horizontal' ? 'var(--accent2)' : 'var(--border)';

  // ── Scope radio ──
  const scopeId = wmConfig.scope === 'all'          ? 'wm-scope-all'
                : wmConfig.scope === 'except-first' ? 'wm-scope-except-first'
                :                                     'wm-scope-current';
  document.getElementById(scopeId).checked = true;

  // Reset all scope label borders first
  ['wm-scope-all-label', 'wm-scope-except-first-label', 'wm-scope-current-label']
    .forEach(id => {
      document.getElementById(id).style.borderColor = 'var(--border)';
    });

  // Highlight the active scope
  document.getElementById(`wm-scope-${wmConfig.scope}-label`).style.borderColor
    = 'var(--accent2)';

});