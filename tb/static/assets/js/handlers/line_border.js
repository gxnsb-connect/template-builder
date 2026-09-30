// ═══════════════════════════════════════════════════════
    // LINE BORDER — applied to .page-content (NOT .bdr — those
    // bands belong to the Graphic Border tab, built further down).
    //
    //   lineBorderConfig  — the "apply to all pages" global state
    //   pinnedBorderPages — page-content component ids that got a
    //                       "current page" override; an #id rule
    //                       always beats the .page-content class
    //                       rule, so pinned pages are never touched
    //                       by a later "apply to all".
    // ═══════════════════════════════════════════════════════
    const lineBorderConfig = {
      style:  'solid',
      weightMm: 0.25,
      color:  '#000000',
      corners: { all: false, tl: false, tr: false, br: false, bl: false },
      radiusMm: 0.25,
    };
    let lineBorderApplied = false;          // false → .page-content keeps its debug orange outline
    const pinnedBorderPages = new Set();    // component ids pinned via "current page"

    // Reads the live form (not lineBorderConfig) — used by the preview
    // and by Apply, so the preview always matches what Apply would do.
    function readLineBorderForm() {
      return {
        style:  document.getElementById('lb-style').value,
        weightMm: parseFloat(document.getElementById('lb-weight').value) || 0,
        color:  document.getElementById('lb-color').value,
        corners: {
          all: document.getElementById('lb-corner-all').checked,
          tl:  document.getElementById('lb-corner-tl').checked,
          tr:  document.getElementById('lb-corner-tr').checked,
          br:  document.getElementById('lb-corner-br').checked,
          bl:  document.getElementById('lb-corner-bl').checked,
        },
        radiusMm: parseFloat(document.getElementById('lb-radius').value) || 0,
      };
    }

    // Turns a line-border config into the CSS declarations for
    // .page-content (or a pinned #id rule) — border + border-radius.
    // border-radius order (TL TR BR BL) matches the checkbox order.
    function buildLineBorderCSS(cfg) {
      const c = cfg.corners;
      const tl = (c.all || c.tl) ? cfg.radiusMm : 0;
      const tr = (c.all || c.tr) ? cfg.radiusMm : 0;
      const br = (c.all || c.br) ? cfg.radiusMm : 0;
      const bl = (c.all || c.bl) ? cfg.radiusMm : 0;
      return {
        'border': `${cfg.weightMm}mm ${cfg.style} ${cfg.color}`,
        'border-radius': `${tl}mm ${tr}mm ${br}mm ${bl}mm`,
      };
    }

    // ── "All" corner checkbox — convenience: check/uncheck the four individually ──
    document.getElementById('lb-corner-all').addEventListener('change', (e) => {
      const on = e.target.checked;
      ['tl', 'tr', 'br', 'bl'].forEach(k => { document.getElementById(`lb-corner-${k}`).checked = on; });
      updateLineBorderPreview();
    });

    // ── LIVE PREVIEW — updates on every input, before Apply is pressed ──
    function updateLineBorderPreview() {
      const cfg = readLineBorderForm();
      const decl = buildLineBorderCSS(cfg);
      const el = document.getElementById('lb-preview-content');
      el.style.border = decl.border;
      el.style.borderRadius = decl['border-radius'];
    }
    ['lb-style', 'lb-weight', 'lb-color', 'lb-corner-tl', 'lb-corner-tr', 'lb-corner-br', 'lb-corner-bl', 'lb-radius']
      .forEach(id => document.getElementById(id).addEventListener('input', updateLineBorderPreview));
    updateLineBorderPreview(); // initial paint

    // ── Finds the .page-content component "in focus" — the closest
    // page ancestor of the current selection, falling back to the
    // first page if nothing (or something outside a page) is selected. ──
    function getCurrentPageContentComponent() {
      const selected = editor.getSelected();
      const pageComp = (selected && selected.closest && selected.closest('.page'))
        || editor.getWrapper().components().filter(c => c.getClasses().includes('page'))[0];
      if (!pageComp) return null;
      return pageComp.components().filter(c => c.getClasses().includes('page-content'))[0] || null;
    }
