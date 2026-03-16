// ══════════════════════════════════════════════════════════════
// PAGE STYLE — PAGE NUMBERING
// page-style-numbering.js
//
// TABLE OF CONTENTS
// ─────────────────
// SECTION 1  — Config & State Object
// SECTION 2  — Position → CSS Map
// SECTION 3  — Number Formatter  (Arabic / Roman / Alpha / Hyphen)
// SECTION 4  — Roman Numeral Converter  (toRoman / fromRoman)
// SECTION 5  — Alpha Converter           (toAlpha / fromAlpha)
// SECTION 6  — Start-At Validator & Parser
// SECTION 7  — Start-At Hint Text (per format)
// SECTION 8  — Canvas <style> Tag Builder
// SECTION 9  — Apply Numbering to Canvas  ← CORE ENGINE
// SECTION 10 — Remove Numbering from Canvas
// SECTION 11 — UI: Position Buttons
// SECTION 12 — UI: Format Buttons
// SECTION 13 — UI: Start-Mode Radios  (Continue / Start At)
// SECTION 14 — UI: Start-At Input     (live validation)
// SECTION 15 — UI: Apply Button
// SECTION 16 — UI: Remove Button
// SECTION 17 — Live Preview Updater
// SECTION 18 — Modal Open: Sync UI to current state
// SECTION 19 — GrapesJS Events  (page add / remove / device)
// ══════════════════════════════════════════════════════════════


// ──────────────────────────────────────────────────────────────
// SECTION 1 — CONFIG & STATE OBJECT
// ──────────────────────────────────────────────────────────────

const numberingConfig = {
  enabled   : false,
  position  : 'bottom-center',   // 'top-left'|'top-center'|'top-right'|
                                  // 'bottom-left'|'bottom-center'|'bottom-right'
  format    : 'arabic',          // 'arabic'|'roman-upper'|'roman-lower'|
                                  // 'alpha-upper'|'alpha-lower'|'hyphen'
  startMode : 'continue',        // 'continue' | 'start-at'
  startAt   : 1,                 // always stored as 1-based arabic integer
  fontSize  : 11,                // px — canvas number element font size
  color     : '#555555',         // canvas number element color
};


// ──────────────────────────────────────────────────────────────
// SECTION 2 — POSITION → CSS STYLE MAP
// Values applied directly to the injected .page-number-el div.
// Empty strings reset any previously-set opposite side.
// ──────────────────────────────────────────────────────────────

const NUM_POSITION_MAP = {
  'top-left'     : { top: '12px', bottom: '',    left: '16px', right: '',    transform: 'none'             },
  'top-center'   : { top: '12px', bottom: '',    left: '50%',  right: '',    transform: 'translateX(-50%)' },
  'top-right'    : { top: '12px', bottom: '',    left: '',     right: '16px', transform: 'none'            },
  'bottom-left'  : { top: '',     bottom: '12px', left: '16px', right: '',   transform: 'none'             },
  'bottom-center': { top: '',     bottom: '12px', left: '50%',  right: '',   transform: 'translateX(-50%)' },
  'bottom-right' : { top: '',     bottom: '12px', left: '',     right: '16px', transform: 'none'           },
};


// ──────────────────────────────────────────────────────────────
// SECTION 3 — NUMBER FORMATTER
// Converts a 1-based arabic integer to the chosen display format.
// ──────────────────────────────────────────────────────────────

function formatPageNumber(n, format) {
  if (!n || n < 1) n = 1;
  switch (format) {
    case 'arabic'     : return String(n);
    case 'roman-upper': return toRoman(n).toUpperCase();
    case 'roman-lower': return toRoman(n).toLowerCase();
    case 'alpha-upper': return toAlpha(n).toUpperCase();
    case 'alpha-lower': return toAlpha(n).toLowerCase();
    case 'hyphen'     : return `-${n}-`;
    default           : return String(n);
  }
}


// ──────────────────────────────────────────────────────────────
// SECTION 4 — ROMAN NUMERAL CONVERTERS
// ──────────────────────────────────────────────────────────────

// Integer → Roman string (1 – 3999)
function toRoman(n) {
  if (n < 1 || n > 3999) return String(n);
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  vals.forEach((v, i) => { while (n >= v) { result += syms[i]; n -= v; } });
  return result; // always uppercase; caller lowercases for roman-lower
}

// Roman string → arabic integer, or null if the string is not a valid Roman numeral
function fromRoman(str) {
  str = str.trim().toUpperCase();
  if (!str) return null;
  const map = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  let result = 0, prev = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    const val = map[str[i]];
    if (val === undefined) return null;   // invalid character
    if (val < prev) result -= val;
    else            result += val;
    prev = val;
  }
  return result > 0 ? result : null;
}


// ──────────────────────────────────────────────────────────────
// SECTION 5 — ALPHA CONVERTERS
// A=1, B=2 … Z=26, AA=27, AB=28, … (Excel-column style)
// ──────────────────────────────────────────────────────────────

// Integer → alpha string  (1→A, 26→Z, 27→AA, 703→AAA …)
function toAlpha(n) {
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result; // always uppercase; caller lowercases for alpha-lower
}

// Alpha string → 1-based integer, or null if invalid
function fromAlpha(str) {
  str = str.trim().toUpperCase();
  if (!str || !/^[A-Z]+$/.test(str)) return null;
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * 26 + (str.charCodeAt(i) - 64);
  }
  return result > 0 ? result : null;
}


// ──────────────────────────────────────────────────────────────
// SECTION 6 — START-AT VALIDATOR & PARSER
//
// Returns { valid, arabic, formatted, message }
//   valid     — boolean, whether input is accepted
//   arabic    — 1-based integer (safe default 1 when invalid)
//   formatted — what the first page number will look like
//   message   — human-readable error string (empty when valid)
//
// Rules per format:
//   arabic / hyphen  → pure digits only
//   roman-*          → roman numeral string  OR  plain digits
//   alpha-*          → letters only          OR  plain digits
// ──────────────────────────────────────────────────────────────

function parseStartAt(rawVal, format) {
  const val = (rawVal || '').trim();

  // ── Empty input ──
  if (!val) {
    return {
      valid     : false,
      arabic    : 1,
      formatted : formatPageNumber(1, format),
      message   : 'Please enter a start value.',
    };
  }

  switch (format) {

    // ── ARABIC: positive integer only ──
    case 'arabic': {
      if (!/^\d+$/.test(val)) {
        return { valid: false, arabic: 1, formatted: '1',
          message: `"${val}" is not a number. Use digits only (e.g. 3).` };
      }
      const n = parseInt(val, 10);
      if (n < 1) {
        return { valid: false, arabic: 1, formatted: '1',
          message: 'Must be 1 or greater.' };
      }
      return { valid: true, arabic: n, formatted: String(n), message: '' };
    }

    // ── HYPHEN: positive integer → formatted as -n- ──
    case 'hyphen': {
      // Accept "3", "-3-", "- 3 -"
      const stripped = val.replace(/-/g, '').trim();
      if (!/^\d+$/.test(stripped) || stripped === '') {
        return { valid: false, arabic: 1, formatted: '-1-',
          message: `"${val}" is not valid. Enter a number (e.g. 3 or -3-).` };
      }
      const n = parseInt(stripped, 10);
      if (n < 1) {
        return { valid: false, arabic: 1, formatted: '-1-',
          message: 'Must be 1 or greater.' };
      }
      return { valid: true, arabic: n, formatted: `-${n}-`, message: '' };
    }

    // ── ROMAN UPPER / LOWER: roman string OR plain digits ──
    case 'roman-upper':
    case 'roman-lower': {
      // Plain number entered: treat as arabic position
      if (/^\d+$/.test(val)) {
        const n = parseInt(val, 10);
        if (n < 1 || n > 3999) {
          return { valid: false, arabic: 1, formatted: formatPageNumber(1, format),
            message: 'Must be between 1 and 3999.' };
        }
        return { valid: true, arabic: n, formatted: formatPageNumber(n, format), message: '' };
      }
      // Try as roman numeral
      const n = fromRoman(val);
      if (n === null || n < 1) {
        return { valid: false, arabic: 1, formatted: formatPageNumber(1, format),
          message: `"${val}" is not a valid Roman numeral. Try IV, VII, or just 4.` };
      }
      return { valid: true, arabic: n, formatted: formatPageNumber(n, format), message: '' };
    }

    // ── ALPHA UPPER / LOWER: letters OR plain digits ──
    case 'alpha-upper':
    case 'alpha-lower': {
      // Plain number entered: treat as position (A=1, B=2 …)
      if (/^\d+$/.test(val)) {
        const n = parseInt(val, 10);
        if (n < 1) {
          return { valid: false, arabic: 1, formatted: formatPageNumber(1, format),
            message: 'Must be 1 or greater.' };
        }
        return { valid: true, arabic: n, formatted: formatPageNumber(n, format), message: '' };
      }
      // Letters entered
      if (/^[A-Za-z]+$/.test(val)) {
        const n = fromAlpha(val.toUpperCase());
        if (!n || n < 1) {
          return { valid: false, arabic: 1, formatted: formatPageNumber(1, format),
            message: `"${val}" could not be parsed as an alphabet page number.` };
        }
        return { valid: true, arabic: n, formatted: formatPageNumber(n, format), message: '' };
      }
      // Mixed or unsupported characters
      return { valid: false, arabic: 1, formatted: formatPageNumber(1, format),
        message: `"${val}" is not valid. Enter a letter (e.g. C) or a number (e.g. 3).` };
    }

    default:
      return { valid: true, arabic: 1, formatted: '1', message: '' };
  }
}


// ──────────────────────────────────────────────────────────────
// SECTION 7 — START-AT HINT TEXT
// Updates the small italic hint below the input to tell the user
// what kind of value is accepted for the active format.
// ──────────────────────────────────────────────────────────────

const NUM_FORMAT_HINTS = {
  'arabic'     : 'Enter a positive number — e.g. 3',
  'hyphen'     : 'Enter a number — e.g. 3 (displayed as -3-)',
  'roman-upper': 'Enter a Roman numeral (e.g. IV) or a number (e.g. 4)',
  'roman-lower': 'Enter a Roman numeral (e.g. iv) or a number (e.g. 4)',
  'alpha-upper': 'Enter a letter (e.g. C) or a number (e.g. 3 → C)',
  'alpha-lower': 'Enter a letter (e.g. c) or a number (e.g. 3 → c)',
};

function updateStartAtHint() {
  const hint = document.getElementById('num-start-at-hint');
  if (hint) hint.textContent = NUM_FORMAT_HINTS[numberingConfig.format] || '';
}


// ──────────────────────────────────────────────────────────────
// SECTION 8 — CANVAS <style> TAG BUILDER
//
// Injects / updates  <style id="page-numbering-style">  in the
// GrapesJS canvas iframe, containing base rules for the injected
// .page-number-el elements.
// ──────────────────────────────────────────────────────────────

function rebuildNumberingStyleTag() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) { console.warn('Page Numbering: canvas not ready'); return; }

  let styleTag = canvasDoc.getElementById('page-numbering-style');
  if (!styleTag) {
    styleTag = canvasDoc.createElement('style');
    styleTag.id = 'page-numbering-style';
    canvasDoc.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    .page-number-el {
      position   : absolute;
      font-size  : ${numberingConfig.fontSize}px;
      color      : ${numberingConfig.color};
      pointer-events: none;
      z-index    : 10;
      font-family: 'Segoe UI', Arial, sans-serif;
      user-select: none;
      line-height: 1;
      white-space: nowrap;
    }
  `;
}


// ──────────────────────────────────────────────────────────────
// SECTION 9 — APPLY NUMBERING TO CANVAS  ← CORE ENGINE
//
// Strategy:
//   1. Remove all existing .page-number-el nodes from canvas DOM
//   2. If disabled, stop.
//   3. Rebuild the <style> tag with current font/color settings
//   4. Loop every .page element in the canvas iframe and inject
//      a fresh <div class="page-number-el"> with the computed
//      number string and the chosen position CSS.
//
// This is a "direct DOM" approach (same pattern as page-background)
// — instant visual feedback, survives GrapesJS re-renders.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// SECTION 9 — APPLY NUMBERING TO CANVAS  ← CORE ENGINE  (updated)
//
// Changes vs original:
//  • TOP positions (top-left / top-center / top-right) now route
//    INTO the matching header cell when the header is enabled.
//  • BOTTOM positions are unchanged — still floating elements.
//  • On every call, any existing {{PAGE}} tokens are cleared from
//    header cells first, then re-injected into the correct cell.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// SECTION 9 — APPLY NUMBERING TO CANVAS  (final — header + footer)
//
//  TOP    position + header enabled → number lives in header cell
//  BOTTOM position + footer enabled → number lives in footer cell
//  All other cases                  → floating .page-number-el
// ──────────────────────────────────────────────────────────────

function applyNumberingToCanvas() {
  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) { console.warn('Page Numbering: canvas not ready'); return; }

  // ── STEP 1: Remove all existing floating number elements ──
  canvasDoc.querySelectorAll('.page-number-el').forEach(el => el.remove());

  // ── STEP 2: Clear any existing {{PAGE}} token from header cells ──
  if (typeof headerConfig !== 'undefined') {
    ['left', 'center', 'right'].forEach(col => {
      if (headerConfig.cells[col] === '{{PAGE}}') {
        headerConfig.cells[col] = '';
      }
    });
  }

  // ── STEP 3: Clear any existing {{PAGE}} token from footer cells ──
  if (typeof footerConfig !== 'undefined') {
    ['left', 'center', 'right'].forEach(col => {
      if (footerConfig.cells[col] === '{{PAGE}}') {
        footerConfig.cells[col] = '';
      }
    });
  }

  // ── STEP 4: Bail if numbering is disabled ──
  if (!numberingConfig.enabled) {
    if (typeof renderAllHeaderCells === 'function') renderAllHeaderCells();
    if (typeof renderAllFooterCells === 'function') renderAllFooterCells();
    return;
  }

  // ── STEP 5: Rebuild floating element CSS ──
  rebuildNumberingStyleTag();

  // ── STEP 6: Determine routing ──
  const isTopPos    = numberingConfig.position.startsWith('top-');
  const isBottomPos = numberingConfig.position.startsWith('bottom-');
  const hdrOn       = (typeof headerConfig !== 'undefined') && headerConfig.enabled;
  const ftrOn       = (typeof footerConfig !== 'undefined') && footerConfig.enabled;

  // ── ROUTE A: Top position + header enabled → inject into header cell ──
  if (isTopPos && hdrOn) {
    const col = numberingConfig.position.replace('top-', '');
    // Replaces any existing text in that cell (confirmed user decision)
    headerConfig.cells[col] = '{{PAGE}}';
    if (typeof renderAllHeaderCells === 'function') renderAllHeaderCells();
    return;
  }

  // ── ROUTE B: Bottom position + footer enabled → inject into footer cell ──
  if (isBottomPos && ftrOn) {
    const col = numberingConfig.position.replace('bottom-', '');
    // Replaces any existing text in that cell (confirmed user decision)
    footerConfig.cells[col] = '{{PAGE}}';
    if (typeof renderAllFooterCells === 'function') renderAllFooterCells();
    return;
  }

  // ── ROUTE C: No active header/footer for this position → floating element ──
  const pos     = NUM_POSITION_MAP[numberingConfig.position] || NUM_POSITION_MAP['bottom-center'];
  const pageEls = canvasDoc.querySelectorAll('.page');

  pageEls.forEach((pageEl, index) => {
    const pageNum   = numberingConfig.startAt + index;
    const formatted = formatPageNumber(pageNum, numberingConfig.format);

    const numEl       = canvasDoc.createElement('div');
    numEl.className   = 'page-number-el';
    numEl.textContent = formatted;

    numEl.style.top       = pos.top       || '';
    numEl.style.bottom    = pos.bottom    || '';
    numEl.style.left      = pos.left      || '';
    numEl.style.right     = pos.right     || '';
    numEl.style.transform = pos.transform || '';

    pageEl.appendChild(numEl);
  });
}

// ──────────────────────────────────────────────────────────────
// SECTION 10 — REMOVE NUMBERING FROM CANVAS
// ──────────────────────────────────────────────────────────────

function removeNumberingFromCanvas() {
  numberingConfig.enabled = false;

  const canvasDoc = editor.Canvas.getDocument();
  if (!canvasDoc) return;

  // Remove all injected number elements
  canvasDoc.querySelectorAll('.page-number-el').forEach(el => el.remove());

  // Wipe the canvas style tag so no stale rules remain
  const styleTag = canvasDoc.getElementById('page-numbering-style');
  if (styleTag) styleTag.innerHTML = '';
}


// ──────────────────────────────────────────────────────────────
// SECTION 11 — UI: POSITION BUTTONS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.num-position-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // Reset all button styles
    document.querySelectorAll('.num-position-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.color       = 'var(--text)';
      b.style.background  = 'var(--bg-item)';
    });

    // Highlight clicked
    btn.style.borderColor = 'var(--accent2)';
    btn.style.color       = 'var(--accent2)';
    btn.style.background  = 'rgba(78,205,196,0.12)';

    numberingConfig.position = btn.dataset.position;
    updateNumberingPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 12 — UI: FORMAT BUTTONS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('.num-format-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // Reset all
    document.querySelectorAll('.num-format-btn').forEach(b => {
      b.style.borderColor = 'var(--border)';
      b.style.color       = 'var(--text-muted)';
      b.style.background  = 'var(--bg-item)';
    });

    // Highlight clicked
    btn.style.borderColor = 'var(--accent2)';
    btn.style.color       = 'var(--accent2)';
    btn.style.background  = 'rgba(78,205,196,0.12)';

    numberingConfig.format = btn.dataset.format;

    // Update hint for the new format
    updateStartAtHint();

    // Re-validate whatever is currently in the start-at input
    validateStartAtInput();

    updateNumberingPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 13 — UI: START MODE RADIOS
// ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="num-start-mode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    numberingConfig.startMode = radio.value;

    // Show / hide the start-at input row
    const row = document.getElementById('num-start-at-row');
    if (row) row.style.display = (numberingConfig.startMode === 'start-at') ? 'flex' : 'none';

    // Update label border highlights
    document.getElementById('num-mode-continue-label').style.borderColor =
      (numberingConfig.startMode === 'continue') ? 'var(--accent2)' : 'var(--border)';
    document.getElementById('num-mode-startat-label').style.borderColor =
      (numberingConfig.startMode === 'start-at')  ? 'var(--accent2)' : 'var(--border)';

    // Switching back to Continue resets startAt
    if (numberingConfig.startMode === 'continue') {
      numberingConfig.startAt = 1;
    }

    updateNumberingPreview();
  });
});


// ──────────────────────────────────────────────────────────────
// SECTION 14 — UI: START-AT INPUT  (live validation + preview)
// ──────────────────────────────────────────────────────────────

function validateStartAtInput() {
  const input    = document.getElementById('num-start-at-input');
  const feedback = document.getElementById('num-start-at-feedback');
  const preview  = document.getElementById('num-start-at-preview');
  if (!input) return;

  const result = parseStartAt(input.value, numberingConfig.format);

  if (result.valid) {
    // ── Valid ──
    input.style.borderColor = 'var(--accent2)';

    if (feedback) {
      feedback.textContent = '';
      feedback.style.color = '';
    }
    if (preview) {
      preview.textContent = `→ ${result.formatted}`;
      preview.style.color = 'var(--accent2)';
    }
    numberingConfig.startAt = result.arabic;

  } else {
    // ── Invalid — show error, fall back to safe default ──
    input.style.borderColor = 'var(--accent)';  // red border

    if (feedback) {
      feedback.textContent = result.message;
      feedback.style.color = 'var(--accent)';
    }
    if (preview) {
      preview.textContent = `→ Default: ${result.formatted}`;
      preview.style.color = 'var(--text-muted)';
    }
    numberingConfig.startAt = result.arabic;  // use safe fallback (always 1)
  }

  updateNumberingPreview();
}

// Attach live handler
document.getElementById('num-start-at-input').addEventListener('input', validateStartAtInput);


// ──────────────────────────────────────────────────────────────
// SECTION 15 — UI: APPLY BUTTON
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-apply-numbering').addEventListener('click', () => {

  // Run a final validation pass when Start At mode is active
  if (numberingConfig.startMode === 'start-at') {
    validateStartAtInput();
  } else {
    // Continue mode: always starts at 1
    numberingConfig.startAt = 1;
  }

  numberingConfig.enabled = true;
  applyNumberingToCanvas();

  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-numbering')
  ).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 16 — UI: REMOVE BUTTON
// ──────────────────────────────────────────────────────────────

document.getElementById('btn-remove-numbering').addEventListener('click', () => {
  removeNumberingFromCanvas();

  bootstrap.Modal.getInstance(
    document.getElementById('modal-page-numbering')
  ).hide();
});


// ──────────────────────────────────────────────────────────────
// SECTION 17 — LIVE PREVIEW UPDATER
//
// Shows the formatted number in the correct slot inside the
// mini page diagram (#num-live-preview).
// ──────────────────────────────────────────────────────────────

function updateNumberingPreview() {
  const previewEl = document.getElementById('num-live-preview');
  if (!previewEl) return;

  // Reset all slots to hidden
  previewEl.querySelectorAll('.num-preview-pos').forEach(p => {
    p.style.opacity  = '0';
    p.textContent    = '';
  });

  // Get sample number (use startAt, fall back to 1)
  const sampleNum = numberingConfig.startAt >= 1 ? numberingConfig.startAt : 1;
  const formatted = formatPageNumber(sampleNum, numberingConfig.format);

  // Light up the active slot
  const target = previewEl.querySelector(
    `[data-preview-pos="${numberingConfig.position}"]`
  );
  if (target) {
    target.textContent   = formatted;
    target.style.opacity = '1';
    target.style.color   = 'var(--accent2)';
  }
}


// ──────────────────────────────────────────────────────────────
// SECTION 18 — MODAL OPEN: SYNC UI TO CURRENT STATE
// Restores all buttons / inputs / labels to match numberingConfig
// every time the modal is opened.
// ──────────────────────────────────────────────────────────────

document.getElementById('modal-page-numbering').addEventListener('show.bs.modal', () => {

  // ── Position buttons ──
  document.querySelectorAll('.num-position-btn').forEach(b => {
    const on = (b.dataset.position === numberingConfig.position);
    b.style.borderColor = on ? 'var(--accent2)' : 'var(--border)';
    b.style.color       = on ? 'var(--accent2)' : 'var(--text)';
    b.style.background  = on ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // ── Format buttons ──
  document.querySelectorAll('.num-format-btn').forEach(b => {
    const on = (b.dataset.format === numberingConfig.format);
    b.style.borderColor = on ? 'var(--accent2)' : 'var(--border)';
    b.style.color       = on ? 'var(--accent2)' : 'var(--text-muted)';
    b.style.background  = on ? 'rgba(78,205,196,0.12)' : 'var(--bg-item)';
  });

  // ── Start-mode radio ──
  const modeRadio = document.querySelector(
    `input[name="num-start-mode"][value="${numberingConfig.startMode}"]`
  );
  if (modeRadio) modeRadio.checked = true;

  // ── Mode label borders ──
  document.getElementById('num-mode-continue-label').style.borderColor =
    (numberingConfig.startMode === 'continue') ? 'var(--accent2)' : 'var(--border)';
  document.getElementById('num-mode-startat-label').style.borderColor =
    (numberingConfig.startMode === 'start-at')  ? 'var(--accent2)' : 'var(--border)';

  // ── Start-at row visibility ──
  const row = document.getElementById('num-start-at-row');
  if (row) row.style.display = (numberingConfig.startMode === 'start-at') ? 'flex' : 'none';

  // ── Start-at input: pre-fill with the formatted current value ──
  const input = document.getElementById('num-start-at-input');
  if (input) {
    input.value = formatPageNumber(numberingConfig.startAt, numberingConfig.format);
    input.style.borderColor = 'var(--border)';  // reset colour
  }

  // ── Clear leftover feedback from previous session ──
  const feedback = document.getElementById('num-start-at-feedback');
  if (feedback) { feedback.textContent = ''; }
  const preview = document.getElementById('num-start-at-preview');
  if (preview) { preview.textContent = ''; }

  // ── Hint text ──
  updateStartAtHint();

  // ── Live preview ──
  updateNumberingPreview();
});


// ──────────────────────────────────────────────────────────────
// SECTION 19 — GRAPESJS EVENTS
//
// Re-apply numbering whenever pages are added, removed, or the
// device (canvas size) is switched.
// ──────────────────────────────────────────────────────────────

// Page added: inject a new number element
editor.on('component:add', (component) => {
  if (!component.getClasses().includes('page')) return;
  if (!numberingConfig.enabled) return;
  setTimeout(applyNumberingToCanvas, 200);
});

// Page removed: rebuild all numbers so indices stay sequential
editor.on('component:remove', (component) => {
  if (!component.getClasses().includes('page')) return;
  if (!numberingConfig.enabled) return;
  setTimeout(applyNumberingToCanvas, 200);
});

// Device switch (portrait ↔ landscape): canvas re-renders, re-inject
editor.on('change:device', () => {
  if (!numberingConfig.enabled) return;
  setTimeout(applyNumberingToCanvas, 350);
});
