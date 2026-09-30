

// Editor Components
import { PagContentComponent } from "./components/page_content.js";
import { PageComponent } from "./components/page.js";
import { PageBorderFrame } from "./components/page_border_frame.js";
import { TextBox } from "./components/text_box.js";


// Utils
import PAGE_SIZES from "./utils/page_utils.js"
import pageConfig from "./utils/page_utils.js"
import { getPageDimensions } from "./utils/page_utils.js";
import { computePageLayout } from "./utils/page_utils.js";


    // ═══════════════════════════════════════════════════════
    // PAGE SIZE REGISTRY (all values in mm)
    // ═══════════════════════════════════════════════════════
    // const PAGE_SIZES = {
    //   A0: { width: 841, height: 1189 },
    //   A1: { width: 594, height: 841  },
    //   A2: { width: 420, height: 594  },
    //   A3: { width: 297, height: 420  },
    //   A4: { width: 210, height: 297  },   // default
    //   A5: { width: 148, height: 210  },
    //   A6: { width: 105, height: 148  },
    //   A7: { width: 74,  height: 105  },
    //   A8: { width: 52,  height: 74   },
    // };

    // ── PAGE CONFIG ──
    // Layout reads left→right / top→bottom as:
    //   [ margin | borderSize | contentPadding | content-area | contentPadding | borderSize | margin ]
    // "Page margin" set in the Page Layout dropdown is applied as the
    // OUTER edge of the border band (i.e. the border frame sits inset
    // from the page edge by `margin`, and is `borderSize` thick).
    // const pageConfig = {
    //   size:        'A4',        // key into PAGE_SIZES
    //   orientation: 'portrait',  // 'portrait' | 'landscape' — swaps width/height when read
    //   unit:        'mm',
    //   margin:         { top: 10, right: 10, bottom: 10, left: 10 },  // page edge → border band, mm
    //   borderSize:     0,   // thickness of the decorative border band, mm (all 4 sides equal for now)
    //   contentPadding: 0,   // gutter between border band and content-area, mm
    // };

    // ── RESOLVE ACTUAL DIMENSIONS FROM size + orientation ──
    // function getPageDimensions() {
    //   const base = PAGE_SIZES[pageConfig.size] || PAGE_SIZES.A4;
    //   const { width, height } = base;
    //   return pageConfig.orientation === 'landscape'
    //     ? { width: height, height: width }
    //     : { width, height };
    // }

    

    // ═══════════════════════════════════════════════════════
    // PAGE LAYOUT MATH — the single source of truth for every
    // rectangle on the page. Everything else (CSS, export,
    // future PDF math) should read geometry from here rather
    // than recomputing it.
    //
    //   pageWidth / pageHeight    — full sheet, mm
    //   margin.{top,right,bottom,left} — page edge → border band, mm
    //   borderSize                — border band thickness, mm
    //   contentPadding            — border band → content-area gutter, mm
    //
    // Returns mm numbers (not CSS strings) so callers can also
    // use them for validation/export math, not just rendering.
    // ═══════════════════════════════════════════════════════


    // function computePageLayout(config = pageConfig) {
    //   const { width: pageWidth, height: pageHeight } = getPageDimensions();
    //   const m  = config.margin;
    //   const bs = config.borderSize;
    //   const cp = config.contentPadding;

    //   // ── Border frame — inset from the page edge by `margin` ──
    //   const frame = {
    //     top:    m.top,
    //     left:   m.left,
    //     width:  pageWidth  - m.left - m.right,
    //     height: pageHeight - m.top  - m.bottom,
    //   };

    //   // ── Border bands — drawn along the 4 edges of the frame, `borderSize` thick ──
    //   const bands = {
    //     top:    { top: 0,                 left: 0,                 width: frame.width,               height: bs },
    //     bottom: { top: frame.height - bs,  left: 0,                 width: frame.width,               height: bs },
    //     left:   { top: bs,                 left: 0,                 width: bs,                         height: frame.height - 2 * bs },
    //     right:  { top: bs,                 left: frame.width - bs,  width: bs,                         height: frame.height - 2 * bs },
    //   };

    //   // ── Content area — inset from the page edge by margin + borderSize + contentPadding ──
    //   const inset = { top: m.top + bs + cp, right: m.right + bs + cp, bottom: m.bottom + bs + cp, left: m.left + bs + cp };
    //   const content = {
    //     top:    inset.top,
    //     left:   inset.left,
    //     width:  pageWidth  - inset.left - inset.right,
    //     height: pageHeight - inset.top  - inset.bottom,
    //   };

    //   return { pageWidth, pageHeight, margin: m, borderSize: bs, contentPadding: cp, frame, bands, content };
    // }



    // ═══════════════════════════════════════════════════════
    // EDITOR INIT
    // blockManager still points at a container so blocks can
    // be registered later (editor.Blocks.add(...)) — the block
    // bar UI itself has been removed and will be rebuilt.
    // ═══════════════════════════════════════════════════════
    const editor = grapesjs.init({
      container: '#gjs',
      height: '100%',
      width:  '100%',
      storageManager: false,

      blockManager:  { appendTo: null },   // no bar in this build; add UI + re-point when ready
      panels:        { defaults: [] },

      // PlainDraggable (github.com/anseki/plain-draggable) drives the
      // free-text box's whole-box move (see the free-text component's
      // view below) — GrapesJS's own absolute-drag has version-specific
      // internal assumptions (unit parsing, native HTML5 DnD side
      // effects) that kept fighting us. `canvas.scripts` loads it
      // straight into the canvas iframe's own document/window, which is
      // where the draggable elements actually live — loading it in the
      // parent page's <head> would leave it invisible in there.
      canvas: {
        scripts: ['https://cdn.jsdelivr.net/npm/plain-draggable@2.5.15/plain-draggable.min.js'],
      },

      // No default RTE toolbar (bold/italic/link/etc.) — text formatting
      // now goes entirely through the custom Format Menu (the "curtain"
      // panel), not GrapesJS's own bubble. Emptying `actions` removes
      // both the buttons AND the keyboard shortcuts/commands behind
      // them, so nothing from the old bar can show OR run.
      richTextEditor: { actions: [] },
    });

    // ── PAGE SIZE SELECTOR ──
    document.getElementById('page-size-select').addEventListener('change', (e) => {
      pageConfig.size = e.target.value;
      applyPageStyle();
      refreshGraphicBorderInstances();
      reclampAllFreeTextBoxes();
      editor.trigger('pageConfig:change');
    });

    // ── ORIENTATION SELECTOR (independent of size) ──
    document.getElementById('page-orientation-select').addEventListener('change', (e) => {
      const isLandscape = e.target.value === 'landscape';
      pageConfig.orientation = e.target.value;

      document.body.classList.toggle('landscape', isLandscape);

      applyPageStyle();
      refreshGraphicBorderInstances();
      reclampAllFreeTextBoxes();
      editor.trigger('pageConfig:change');
    });

    // ── PAGE MARGIN INPUTS (applied as the border-band's outer edge) ──
    function wireMarginInput(id, side) {
      document.getElementById(id).addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        pageConfig.margin[side] = Number.isFinite(v) && v >= 0 ? v : 0;
        applyPageStyle();
        refreshGraphicBorderInstances();
        reclampAllFreeTextBoxes();
        editor.trigger('pageConfig:change');
      });
    }
    wireMarginInput('page-margin-top',    'top');
    wireMarginInput('page-margin-right',  'right');
    wireMarginInput('page-margin-bottom', 'bottom');
    wireMarginInput('page-margin-left',   'left');

    // ── PAGE LAYOUT DROPDOWN — persistent, toggled open/closed ──
    const pageLayoutMenu   = document.getElementById('page-layout-menu');
    const pageLayoutToggle = document.getElementById('btn-page-layout-toggle');

    pageLayoutToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      pageLayoutMenu.classList.toggle('open');
    });
    document.getElementById('btn-close-page-layout').addEventListener('click', (e) => {
      e.stopPropagation();
      pageLayoutMenu.classList.remove('open');
    });
    pageLayoutMenu.addEventListener('click', (e) => e.stopPropagation());

    // ── PAGE BORDER DROPDOWN — persistent, toggled open/closed ──
    const pageBorderMenu   = document.getElementById('page-border-menu');
    const pageBorderToggle = document.getElementById('btn-page-border-toggle');

    pageBorderToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      pageBorderMenu.classList.toggle('open');
    });
    document.getElementById('btn-close-page-border').addEventListener('click', (e) => {
      e.stopPropagation();
      pageBorderMenu.classList.remove('open');
    });
    pageBorderMenu.addEventListener('click', (e) => e.stopPropagation());

    // ── PAGE BORDER — tab switching (Line Border / Graphic Border) ──
    document.querySelectorAll('.pb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.pb-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.pb-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
        // Graphic tab needs an icon grid + preview strip, so the menu grows
        pageBorderMenu.classList.toggle('wide-graphic', tab.dataset.target === 'pb-tab-graphic');
      });
    });

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

    // ── APPLY ──
    document.getElementById('btn-apply-line-border').addEventListener('click', () => {
      const cfg = readLineBorderForm();
      const scope = document.querySelector('input[name="lb-scope"]:checked').value;

      if (scope === 'all') {
        Object.assign(lineBorderConfig, cfg);
        lineBorderApplied = true;
        applyPageStyle();   // rebuilds .page-content class rule; pinned pages keep their #id override
      } else {
        const contentComp = getCurrentPageContentComponent();
        if (!contentComp) {
          console.warn('Line Border: no current page found to apply to.');
          return;
        }
        const cid = contentComp.getId();
        pinnedBorderPages.add(cid);
        editor.Css.setRule(`#${cid}`, buildLineBorderCSS(cfg));
      }

      // Mutual exclusivity: this page (or all pages) now has a line
      // border, so clear any graphic border already sitting on it.
      getScopedTargetPages('lb-scope').forEach(pageComp => removeGraphicBorderFromPage(pageComp));
    });

    // ═══════════════════════════════════════════════════════
    // GRAPHIC BORDER — SVG icons duplicated around the .bdr bands
    // (top/bottom/left/right) inside .page-border-frame.
    //
    // SVG SOURCE: in production this array is the Django `svgs`
    // context var (see read_svg_json_lib() / tb() in your view) —
    //     const SVG_LIBRARY_RAW = {{ svgs|safe }};
    // For this standalone build it's mocked below in the same
    // shape your screenshot showed: entries keyed by `slot-id`
    // (some libraries emit `slot` instead — normalizeSvgLibrary
    // reads either), `supported_areas`, `fill`, and a `path` array.
    // Only entries whose `supported_areas` includes "border" show
    // up in the icon picker below.
    //
    // Fallback ONLY for entries with no viewBox of their own — every
    // real library entry (svg_data.json) now carries its own, so this
    // only fires for a malformed/incomplete future entry, not the norm.
    const DEFAULT_VIEWBOX = '0 0 100 100';   // last-resort guess, not a real default

    const SVG_LIBRARY_RAW = JSON.parse(document.getElementById('svg-data').textContent);

    function normalizeSvgLibrary(raw) {
      return raw
        .map(entry => ({
          slotId:         entry['slot-id'] || entry['slot'] || entry.slotId || '',
          supportedAreas: entry.supported_areas || entry.supportedAreas || [],
          fill:           entry.fill || 'currentColor',
          paths:          entry.path || entry.paths || [],
          viewBox:        entry.viewBox || DEFAULT_VIEWBOX,
        }))
        .filter(e => e.slotId && e.paths.length);
    }

    const SVG_LIBRARY  = normalizeSvgLibrary(SVG_LIBRARY_RAW);
    const BORDER_SVGS  = SVG_LIBRARY.filter(e => e.supportedAreas.includes('border'));

    const GB_SIZE_MM = { Thin: 3, Small: 5, Medium: 8, Large: 12, Big: 16 };

    let selectedIconSlotId = null;

    // ── LAST-APPLIED TRACKING — so the graphic border can be
    // recomputed whenever a band's length changes (orientation
    // switch, page size switch, margin edits) instead of leaving
    // a gap or overflow from stale icon offsets. ──
    let lastGraphicBorderCfg = null;              // { cfg, entry } from the most recent Apply
    const graphicBorderAppliedPages = new Set();  // page component ids that currently carry icons

    // ── INSTANCE TRACKING STORE ──
    // One entry per icon actually placed on the page(s), in the shape
    // from your screenshot: { slotId, instanceSlot, colorFill }. This
    // is what next session's Django export will read to rebuild each
    // instance with its own (possibly recolored) copy of the source SVG.
    const borderInstanceData = [];

    function uuid6() {
      return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
    }

    function pathsMarkup(entry, colorHex) {
      return entry.paths.map(d => `<path d="${d}" fill="${colorHex}"/>`).join('');
    }

    // ── ICON PICKER ──
    function renderIconGrid() {
      const grid = document.getElementById('gb-icon-grid');
      grid.innerHTML = '';

      if (!BORDER_SVGS.length) {
        grid.innerHTML = '<span class="tb-label">No SVGs tagged for the "border" area.</span>';
        return;
      }

      BORDER_SVGS.forEach(entry => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gb-icon-btn' + (entry.slotId === selectedIconSlotId ? ' selected' : '');
        btn.title = entry.slotId;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${entry.viewBox}">${pathsMarkup(entry, '#000000')}</svg>`;
        btn.addEventListener('click', () => {
          selectedIconSlotId = entry.slotId;
          document.querySelectorAll('.gb-icon-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          updateGraphicPreview();
        });
        grid.appendChild(btn);
      });

      if (!selectedIconSlotId) selectedIconSlotId = BORDER_SVGS[0].slotId;
    }

    // ── SPACING MATH — shared by the live preview and the real apply.
    // Returns start-offsets (mm) along the band's length axis for each
    // icon instance.
    //   fitMode 'fit'      → spacing stretches evenly so the row lands
    //                        flush with both ends of the band.
    //   fitMode 'overflow' → fixed icon+gap step; any leftover space
    //                        at the end is left blank rather than resized.
    // ═══════════════════════════════════════════════════════
    function computeBandInstanceOffsets(lengthMm, iconMm, gapMm, fitMode) {
      if (iconMm <= 0 || lengthMm <= 0) return [];
      const step = iconMm + gapMm;
      const count = Math.max(1, Math.floor((lengthMm + gapMm) / step));

      let effectiveGap = gapMm;
      if (fitMode === 'fit' && count > 1) {
        effectiveGap = Math.max(0, (lengthMm - count * iconMm) / (count - 1));
      }

      const offsets = [];
      for (let i = 0; i < count; i++) offsets.push(i * (iconMm + effectiveGap));
      return offsets;
    }

    // ── LIVE PREVIEW — top band only, at a fixed 100mm proxy length ──
    function updateGraphicPreview() {
      const strip = document.getElementById('gb-preview-strip');
      const entry = BORDER_SVGS.find(e => e.slotId === selectedIconSlotId);
      if (!strip || !entry) { if (strip) strip.innerHTML = ''; return; }

      const color   = document.getElementById('gb-color').value;
      const sizeMm  = GB_SIZE_MM[document.getElementById('gb-size').value] || GB_SIZE_MM.Small;
      const gapMm   = parseFloat(document.getElementById('gb-gap').value) || 0;
      const fitMode = document.getElementById('gb-fit').value;

      const previewLengthMm = 100;   // proxy length — not any real page's band
      const pxPerMm = 2;

      const offsets = computeBandInstanceOffsets(previewLengthMm, sizeMm, gapMm, fitMode);
      strip.style.width = `${previewLengthMm * pxPerMm}px`;
      strip.innerHTML = offsets.map(offsetMm => `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${entry.viewBox}" style="position:absolute; left:${offsetMm * pxPerMm}px; top:0;
             width:${sizeMm * pxPerMm}px; height:${sizeMm * pxPerMm}px;">${pathsMarkup(entry, color)}</svg>
      `).join('');
    }
    ['gb-color', 'gb-size', 'gb-gap', 'gb-fit'].forEach(id =>
      document.getElementById(id).addEventListener('input', updateGraphicPreview)
    );

    renderIconGrid();
    updateGraphicPreview();

    // ── PAGE / BAND LOOKUP ──
    function getCurrentPageComponent() {
      const selected = editor.getSelected();
      return (selected && selected.closest && selected.closest('.page'))
        || editor.getWrapper().components().filter(c => c.getClasses().includes('page'))[0]
        || null;
    }
    function getAllPageComponents() {
      return editor.getWrapper().components().filter(c => c.getClasses().includes('page'));
    }

    function clearBandInstances(bandComp) {
      bandComp.components()
        .filter(c => c.getAttributes()['data-instance-slot'])
        .forEach(c => c.remove());
    }

    // ═══════════════════════════════════════════════════════
    // FREE TEXT — keep every box inside its page's content area
    // (i.e. inside the page margin) at all times: clamp position
    // while dragging/after resizing, and re-clamp whenever the
    // content area itself changes shape (margin, orientation, size).
    // ═══════════════════════════════════════════════════════

    // Reads the box's rendered position against its DOM parent
    // (.page-content — already inset by margin/border/padding, so
    // it IS "the content area") and pulls it back inside if needed.
    // Writes the clamped position straight to the DOM for an instant
    // visual snap, then persists it on the model via addStyle so it
    // survives re-render and export.
    function clampFreeTextBox(comp) {
      if (!comp || !comp.getClasses || !comp.getClasses().includes('free-text-box')) return;
      const el = comp.getEl && comp.getEl();
      const parentEl = el && el.parentElement;
      if (!el || !parentEl) return;

      const elRect = el.getBoundingClientRect();
      const parentRect = parentEl.getBoundingClientRect();
      if (!elRect.width && !elRect.height) return; // not rendered yet

      const maxLeft = Math.max(0, parentRect.width  - elRect.width);
      const maxTop  = Math.max(0, parentRect.height - elRect.height);

      const left = Math.min(Math.max(0, elRect.left - parentRect.left), maxLeft);
      const top  = Math.min(Math.max(0, elRect.top  - parentRect.top),  maxTop);

      el.style.left = `${left}px`;
      el.style.top  = `${top}px`;
      comp.addStyle({ left: `${left}px`, top: `${top}px` });
    }

    // Same as clampFreeTextBox, but also persists width/height into the
    // model — needed after a resize (whose updateTarget writes width/
    // height straight to el.style for instant feedback, bypassing
    // GrapesJS's model-backed style storage, so it'd silently revert on
    // export otherwise). Kept OUT of the plain drag path on purpose:
    // dragging here goes through the browser's native HTML5 drag-and-
    // drop, and calling addStyle() — which re-renders the component —
    // on every drag tick visibly disrupts an in-progress native drag.
    function persistResizedFreeTextBox(comp) {
      if (!comp || !comp.getClasses || !comp.getClasses().includes('free-text-box')) return;
      const el = comp.getEl && comp.getEl();
      if (!el) return;
      const elRect = el.getBoundingClientRect();
      if (!elRect.width && !elRect.height) return;
      clampFreeTextBox(comp);
      comp.addStyle({ width: `${elRect.width}px`, height: `${elRect.height}px` });
    }

    // Resolves whichever component GrapesJS's drag event handed us —
    // different builds pass the model directly, or wrapped as
    // { target }, so fall back to the current selection either way.
    function resolveDragComponent(arg) {
      if (arg && typeof arg.getEl === 'function') return arg;
      if (arg && arg.target && typeof arg.target.getEl === 'function') return arg.target;
      return editor.getSelected();
    }

    // Whole-box moving is PlainDraggable's job now (see the free-text
    // component's `view` above), so there's no 'component:drag' to hook
    // here anymore — only resize still goes through GrapesJS itself.
    editor.on('component:resize', (arg) => persistResizedFreeTextBox(resolveDragComponent(arg)));

    // ── TRACKER — re-run the clamp for every free text box on every
    // page whenever the content area's own size changes (margin edit,
    // orientation flip, page-size change), so a box that fit before a
    // shrink doesn't end up spilling past the new, smaller margin. ──
    function reclampAllFreeTextBoxes() {
      getAllPageComponents().forEach(pageComp => {
        const contentComp = pageComp.components().filter(c => c.getClasses().includes('page-content'))[0];
        if (!contentComp) return;
        contentComp.components().filter(c => c.getClasses().includes('free-text-box'))
          .forEach(comp => {
            clampFreeTextBox(comp);
            // PlainDraggable caches its containment rect and only
            // recalculates it automatically on window resize/scroll —
            // a page-size, orientation or margin change here doesn't
            // trigger either, so nudge it to re-measure directly.
            const el = comp.getEl && comp.getEl();
            if (el && el._plainDraggable) el._plainDraggable.position();
          });
      });
    }

    // ═══════════════════════════════════════════════════════
    // BORDER MUTUAL EXCLUSIVITY — a page only ever carries ONE
    // border type. Applying a line border clears any graphic
    // border on the same page(s), and applying a graphic border
    // clears any line border on the same page(s). "No border"
    // (on either tab) clears both. This is enforced live, every
    // time either Apply button (or No border) fires.
    // ═══════════════════════════════════════════════════════
    const NO_BORDER_CSS = { border: 'none', 'border-radius': '0' };

    // Pins an explicit "no border" #id override onto this page's
    // .page-content — needed even under a global "all pages" line
    // border, since a pinned rule always beats the class rule.
    function removeLineBorderFromPage(pageComp) {
      const contentComp = pageComp.components().filter(c => c.getClasses().includes('page-content'))[0];
      if (!contentComp) return;
      const cid = contentComp.getId();
      pinnedBorderPages.add(cid);
      editor.Css.setRule(`#${cid}`, NO_BORDER_CSS);
    }

    // Clears any icon instances from this page's 4 bands and drops it
    // from the applied-pages tracker. Border-band THICKNESS is still a
    // single global value shared by every page, so it's only reset to
    // 0 once no page is using the graphic border anymore.
    function removeGraphicBorderFromPage(pageComp) {
      const frameComp = pageComp.components().filter(c => c.getClasses().includes('page-border-frame'))[0];
      if (frameComp) {
        ['bdr-top', 'bdr-bottom', 'bdr-left', 'bdr-right'].forEach(cls => {
          const bandComp = frameComp.components().filter(c => c.getClasses().includes(cls))[0];
          if (bandComp) clearBandInstances(bandComp);
        });
      }
      graphicBorderAppliedPages.delete(pageComp.getId());
      if (!graphicBorderAppliedPages.size) {
        pageConfig.borderSize = 0;
        applyPageStyle();
      }
    }

    // Resolves the page(s) a tab's scope radio currently points at —
    // shared by both Apply handlers and both "No border" buttons.
    function getScopedTargetPages(scopeInputName) {
      const scope = document.querySelector(`input[name="${scopeInputName}"]:checked`).value;
      return scope === 'all' ? getAllPageComponents() : [getCurrentPageComponent()].filter(Boolean);
    }

    // "No border" — available on both tabs, clears whichever border
    // type(s) the target page(s) currently have.
    function handleNoBorder(scopeInputName) {
      const scope = document.querySelector(`input[name="${scopeInputName}"]:checked`).value;
      const targets = getScopedTargetPages(scopeInputName);
      if (!targets.length) {
        console.warn('No border: no page found.');
        return;
      }
      if (scope === 'all') {
        // Reset the global "all pages" line-border state too, so pages
        // added later also start with no border instead of inheriting it.
        lineBorderApplied = false;
        applyPageStyle();
      }
      targets.forEach(pageComp => {
        removeLineBorderFromPage(pageComp);
        removeGraphicBorderFromPage(pageComp);
      });
    }
    document.getElementById('btn-no-border-line').addEventListener('click', () => handleNoBorder('lb-scope'));
    document.getElementById('btn-no-border-graphic').addEventListener('click', () => handleNoBorder('gb-scope'));

    function buildInstanceSvgHtml(entry, sizeMm, colorHex, instanceSlot, axis, offsetMm) {
      const posStyle = axis === 'x'
        ? `left:${offsetMm}mm; top:50%; transform:translateY(-50%);`
        : `top:${offsetMm}mm; left:50%; transform:translateX(-50%);`;
      return `<svg xmlns="http://www.w3.org/2000/svg" data-instance-slot="${instanceSlot}" data-slot-id="${entry.slotId}"
        class="bdr-icon-instance"
        style="position:absolute; ${posStyle} width:${sizeMm}mm; height:${sizeMm}mm; overflow:visible;"
        viewBox="${entry.viewBox}">${pathsMarkup(entry, colorHex)}</svg>`;
    }

    // ── APPLY GRAPHIC BORDER TO ONE PAGE — reads current global
    // layout math (computePageLayout), fills all 4 bands, records
    // each instance into borderInstanceData. ──
    function applyGraphicBorderToPage(pageComp, cfg, entry) {
      const frameComp = pageComp.components().filter(c => c.getClasses().includes('page-border-frame'))[0];
      if (!frameComp) return;

      const layout = computePageLayout();
      const bandDefs = [
        { cls: 'bdr-top',    axis: 'x', lengthMm: layout.bands.top.width    },
        { cls: 'bdr-bottom', axis: 'x', lengthMm: layout.bands.bottom.width },
        { cls: 'bdr-left',   axis: 'y', lengthMm: layout.bands.left.height  },
        { cls: 'bdr-right',  axis: 'y', lengthMm: layout.bands.right.height },
      ];

      bandDefs.forEach(({ cls, axis, lengthMm }) => {
        const bandComp = frameComp.components().filter(c => c.getClasses().includes(cls))[0];
        if (!bandComp) return;

        clearBandInstances(bandComp);

        const offsets = computeBandInstanceOffsets(lengthMm, cfg.sizeMm, cfg.gapMm, cfg.fit);
        offsets.forEach(offsetMm => {
          const instanceSlot = uuid6();
          bandComp.append(buildInstanceSvgHtml(entry, cfg.sizeMm, cfg.color, instanceSlot, axis, offsetMm));
          borderInstanceData.push({ slotId: entry.slotId, instanceSlot, colorFill: cfg.color });
        });
      });
    }

    // ── REFLOW — re-run the graphic border for every page that already
    // has one applied, reusing its own last-applied icon + config.
    // applyGraphicBorderToPage() always reads fresh band lengths from
    // computePageLayout(), so calling it again here just re-fits the
    // existing icons to whatever the bands measure now — this is what
    // makes portrait ↔ landscape (and page-size / margin) changes
    // auto-recalculate instead of leaving a gap. ──
    function refreshGraphicBorderInstances() {
      if (!lastGraphicBorderCfg || !graphicBorderAppliedPages.size) return;
      const { cfg, entry } = lastGraphicBorderCfg;
      getAllPageComponents().forEach(pageComp => {
        if (graphicBorderAppliedPages.has(pageComp.getId())) {
          applyGraphicBorderToPage(pageComp, cfg, entry);
        }
      });
    }

    // ── APPLY ──
    document.getElementById('btn-apply-graphic-border').addEventListener('click', () => {
      const entry = BORDER_SVGS.find(e => e.slotId === selectedIconSlotId);
      if (!entry) {
        console.warn('Graphic Border: no icon selected.');
        return;
      }

      const cfg = {
        color: document.getElementById('gb-color').value,
        sizeMm: GB_SIZE_MM[document.getElementById('gb-size').value] || GB_SIZE_MM.Small,
        gapMm: parseFloat(document.getElementById('gb-gap').value) || 0,
        fit: document.getElementById('gb-fit').value,
      };
      const scope = document.querySelector('input[name="gb-scope"]:checked').value;

      // Border-band THICKNESS is still a single global value (pageConfig.borderSize,
      // see computePageLayout from the Page Layout work) — there's no per-page
      // border-thickness override yet, so sizing the band always affects every
      // page's geometry. What scope actually controls is which page(s) get their
      // bands FILLED with icon instances below.
      pageConfig.borderSize = cfg.sizeMm + 0.5;
      applyPageStyle();

      const targets = scope === 'all' ? getAllPageComponents() : [getCurrentPageComponent()].filter(Boolean);
      if (!targets.length) {
        console.warn('Graphic Border: no page found to apply to.');
        return;
      }
      targets.forEach(pageComp => applyGraphicBorderToPage(pageComp, cfg, entry));

      // Remember what was just applied (and to which pages) so a later
      // orientation/size/margin change can reflow these same icons.
      lastGraphicBorderCfg = { cfg, entry };
      targets.forEach(pageComp => graphicBorderAppliedPages.add(pageComp.getId()));

      // Mutual exclusivity: this page (or all pages) now has a graphic
      // border, so clear any line border already sitting on it.
      targets.forEach(pageComp => removeLineBorderFromPage(pageComp));
    });

    // ═══════════════════════════════════════════════════════
    // COMPONENT TYPES — page / page-content / page-border-frame.
    // (page-header / page-footer types still removed along with
    // those features — reintroduce them if those modules come back.)
    // ═══════════════════════════════════════════════════════
    editor.Components.addType('page', {
      isComponent: el => el.classList && el.classList.contains('page'),
      model: {
        defaults: {
          tagName: 'div',
          attributes: { class: 'page' },
          droppable: false,
          draggable: false,
          removable: false,
          copyable: false,
          selectable: false,
          hoverable: false,
        }
      }
    });

    editor.Components.addType('page-content', {
      isComponent: el => el.classList && el.classList.contains('page-content'),
      model: {
        defaults: {
          tagName: 'div',
          attributes: { class: 'page-content' },
          droppable: true,
          draggable: false,
          removable: false,
          copyable: false,
          selectable: false,
          hoverable: false,
        }
      }
    });

    // The border frame + its 4 bands (top/bottom/left/right). Bands are
    // blank structural divs for now — decorative fill (asterisks, icon
    // repeats, etc.) gets added later without touching this geometry.
    editor.Components.addType('page-border-frame', {
      isComponent: el => el.classList && el.classList.contains('page-border-frame'),
      model: {
        defaults: {
          tagName: 'div',
          attributes: { class: 'page-border-frame' },
          droppable: false,
          draggable: false,
          removable: false,
          copyable: false,
          selectable: false,
          hoverable: false,
        }
      }
    });

    // A free-floating, editable text box — transparent background,
    // dashed guide border (canvas-only, shown only on hover/focus,
    // stripped on print/export), double-click to type (inherits the
    // built-in 'text' type's RTE). Resizing (8 handles) is still
    // GrapesJS's own resizer — that works correctly (see the custom
    // updateTarget below). Whole-box MOVING is handled entirely by
    // PlainDraggable (github.com/anseki/plain-draggable, loaded into
    // the canvas iframe via canvas.scripts above; wired up in `view`
    // below) instead of GrapesJS's own absolute-drag: that kept hitting
    // version-specific internal assumptions (unit parsing in
    // CommandComponentDrag.getPosition, native-HTML5-DnD side effects)
    // that were fighting us. `draggable: false` here turns GrapesJS's
    // own move-by-drag OFF for this component so the two don't compete.
    // No default toolbar (select-parent/move/clone/delete icons) —
    // dragging works directly off the box itself; delete still works
    // via the Backspace/Delete key on a selected box.
    editor.Components.addType('free-text', {
      extend: 'text',
      isComponent: el => el.getAttribute && el.getAttribute('data-gjs-type') === 'free-text',
      model: {
        defaults: {
          tagName: 'div',
          attributes: { class: 'free-text-box', 'data-gjs-type': 'free-text' },
          droppable: false,
          draggable: false,
          removable: true,
          copyable: true,
          selectable: true,
          hoverable: true,
          editable: true,
          // Plain `resizable: true` only ever changes width/height — it
          // never moves top/left. That's fine for the br/bc/cr handles
          // (the anchor corner/edge is the opposite one, so top/left can
          // stay put) but tl/tc/cl need the box's top/left to shift too,
          // or the box just grows toward the bottom-right no matter which
          // handle you drag — which looks exactly like "top and left
          // don't work". updateTarget below writes the resizer's
          // already-computed rect (it accounts for which handle was
          // used) straight to the element, so all 8 handles move it.
          resizable: {
            tl: 1, tc: 1, tr: 1, cl: 1, cr: 1, bl: 1, bc: 1, br: 1,
            // GrapesJS's resizer passes the computed rect with SHORT keys
            // (w/h/t/l), not width/height/top/left — reading the long
            // names silently produced "undefinedpx" and killed resizing
            // outright. Read both forms defensively so this keeps working
            // across GrapesJS versions that may name them either way.
            updateTarget: (el, rect) => {
              const width  = rect.width  ?? rect.w;
              const height = rect.height ?? rect.h;
              const top    = rect.top    ?? rect.t;
              const left   = rect.left   ?? rect.l;
              if (width  != null) el.style.width  = `${width}px`;
              if (height != null) el.style.height = `${height}px`;
              if (top    != null) el.style.top    = `${top}px`;
              if (left   != null) el.style.left   = `${left}px`;
            },
          },
          toolbar: [],
          // No hover/selected name badge ("Free-text") either — the
          // format-menu trigger button (wired up below) is the only
          // overlay this box shows now.
          badgable: false,
          style: {
            position: 'absolute',
            // top/left MUST be px, not mm: GrapesJS's whole-box drag
            // (CommandComponentDrag.getPosition) reads these two
            // properties with a plain parseFloat(), assuming the number
            // is already pixels. parseFloat('20mm') silently returns 20
            // — read as 20px — while the box actually renders ~76px
            // from the edge, so a drag starts ~56px off from where the
            // box visually is and immediately pins against the "can't
            // go past the edge" clamp on the top/left side, leaving only
            // rightward/downward movement visible. 76px ≈ 20mm at 96dpi,
            // so this keeps the same default placement.
            // min-width/min-height/padding/font-size aren't read this
            // way (the resizer measures real rendered pixels instead),
            // so mm is safe to keep for those.
            top: '76px',
            left: '76px',
            'min-width': '30mm',
            'min-height': '8mm',
            padding: '1mm 2mm',
            'font-size': '4mm',
          },
          content: 'Text',
        }
      },
      view: {
        // NOT onRender(): GrapesJS builds a component's element and
        // calls onRender() *before* it's actually inserted into the
        // iframe's live DOM (it gets appended right after, by the
        // caller). PlainDraggable checks compareDocumentPosition(...) &
        // DOCUMENT_POSITION_DISCONNECTED and throws "This element is not
        // accepted" on a still-detached node — which is exactly what was
        // happening. 'component:mount' (bound below, outside addType)
        // fires right after the real appendChild, so the element is
        // guaranteed live by then.
        // `plain-draggable.min.js` is also loaded asynchronously into the
        // canvas iframe (canvas.scripts, in the editor config above) —
        // it may well not have finished loading yet the first time an
        // early component mounts, so retry briefly instead of assuming
        // it's ready.
        setupPlainDraggable(triesLeft = 40) {
          const el = this.el;
          if (!el || el._plainDraggable) return;
          const win = el.ownerDocument.defaultView;
          if (win && win.PlainDraggable) {
            this.initPlainDraggable(win);
          } else if (triesLeft > 0) {
            setTimeout(() => this.setupPlainDraggable(triesLeft - 1), 50);
          }
        },
        initPlainDraggable(win) {
          const el = this.el;
          if (el._plainDraggable) return;
          const model = this.model;
          const instance = new win.PlainDraggable(el, {
            // Move style.left/style.top directly (matching the rest of
            // this app's positioning) instead of PlainDraggable's
            // default `translate` CSS.
            leftTop: true,
            // Defaults to the element's own parent already, but named
            // explicitly since that's exactly "stay inside the page's
            // content area" — the same boundary clampFreeTextBox enforces
            // for resize.
            containment: el.parentElement || undefined,
            onDragEnd: (pos) => {
              // PlainDraggable only touches the DOM directly; persist the
              // final position into the model so it survives re-render
              // and export.
              model.addStyle({
                left: `${Math.round(pos.left)}px`,
                top: `${Math.round(pos.top)}px`,
              });
            },
          });
          el._plainDraggable = instance;
          // The built-in 'text' type's RTE toggle (see rte:enable/disable
          // below) resets the raw DOM `draggable` attribute to `true`
          // whenever editing stops, for its own native-HTML5-drag scheme
          // — which we don't want here, since it can hijack the mouse
          // gesture before PlainDraggable's own mousedown handling gets
          // it. Keep it forced off.
          el.draggable = false;
        },
        removed() {
          const el = this.el;
          if (el && el._plainDraggable) {
            el._plainDraggable.remove();
            delete el._plainDraggable;
          }
        },
      },
    });

    // Fires only after a component's element is actually appended into
    // the iframe's live DOM (unlike the view's own onRender(), which
    // runs first) — see the comment on the free-text type's `view`
    // above for why that timing matters here.
    editor.on('component:mount', (model) => {
      if (!model.getClasses || !model.getClasses().includes('free-text-box')) return;
      const view = model.getView && model.getView();
      if (view && view.setupPlainDraggable) view.setupPlainDraggable();
    });

    // Suspend PlainDraggable while the box is being typed into (RTE
    // edit mode) so selecting/clicking through text doesn't drag the
    // whole box, and re-force `draggable = false` afterward — see the
    // comment in initPlainDraggable above for why that's necessary.
    editor.on('rte:enable', (view) => {
      const el = view && view.el;
      if (el && el._plainDraggable) el._plainDraggable.disabled = true;
    });
    editor.on('rte:disable', (view) => {
      const el = view && view.el;
      if (el && el._plainDraggable) {
        el._plainDraggable.disabled = false;
        el.draggable = false;
      }
    });

    // ═══════════════════════════════════════════════════════
    // FREE TEXT — FORMAT MENU TRIGGER
    // Shows a small button, positioned over the box's own corner,
    // only while the box is BOTH selected (gjs-selected) AND
    // currently hovered. Clicking it opens the Format Menu ("curtain",
    // defined earlier in <body>) targeted at that same box. This is
    // meant to generalize to other component types later — free-text
    // is just the first one wired up to it.
    // ═══════════════════════════════════════════════════════
    let formatMenuTarget = null; // the component the curtain is currently editing

    function ensureFormatMenuTriggerBtn() {
      const doc = editor.Canvas.getDocument();
      if (!doc) return null;
      let btn = doc.getElementById('ft-format-trigger');
      if (btn) return btn;
      btn = doc.createElement('button');
      btn.id = 'ft-format-trigger';
      btn.type = 'button';
      btn.title = 'Format text';
      btn.innerHTML = '<i class="bi bi-fonts"></i>';
      btn.style.cssText = [
        'position:absolute', 'z-index:99999', 'display:none',
        'width:26px', 'height:26px', 'border-radius:6px',
        'align-items:center', 'justify-content:center',
        'background:#e94560', 'color:#fff', 'border:1px solid #e94560',
        'font-size:13px', 'line-height:1', 'cursor:pointer', 'padding:0',
        'box-shadow:0 2px 6px rgba(0,0,0,.4)',
      ].join(';');
      // Keep the click from also landing on the canvas underneath (which
      // would deselect the box or start a drag instead of opening the menu).
      ['mousedown', 'click'].forEach(evt => {
        btn.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
      });
      btn.addEventListener('click', () => openFormatMenuFor(editor.getSelected()));
      doc.body.appendChild(btn);
      return btn;
    }

    function positionFormatMenuTrigger(boxEl) {
      const btn = ensureFormatMenuTriggerBtn();
      if (!btn) return;
      const doc = boxEl.ownerDocument;
      const win = doc.defaultView;
      const scrollX = (win && win.scrollX) || doc.documentElement.scrollLeft || 0;
      const scrollY = (win && win.scrollY) || doc.documentElement.scrollTop || 0;
      const rect = boxEl.getBoundingClientRect();
      btn.style.display = 'flex';
      btn.style.left = `${rect.right - 26 + scrollX}px`;
      btn.style.top  = `${Math.max(0, rect.top - 30) + scrollY}px`;
    }

    function hideFormatMenuTrigger() {
      const doc = editor.Canvas.getDocument();
      const btn = doc && doc.getElementById('ft-format-trigger');
      if (btn) btn.style.display = 'none';
    }

    function openFormatMenuFor(comp) {
      if (!comp) return;
      formatMenuTarget = comp;
      document.getElementById('curtain').classList.add('show');
    }

    function wireFreeTextFormatMenuTrigger() {
      const doc = editor.Canvas.getDocument();
      if (!doc) return;

      doc.addEventListener('mouseover', (e) => {
        const boxEl = e.target.closest && e.target.closest('.free-text-box');
        if (!boxEl || !boxEl.classList.contains('gjs-selected')) return;
        positionFormatMenuTrigger(boxEl);
      });

      doc.addEventListener('mouseout', (e) => {
        const boxEl = e.target.closest && e.target.closest('.free-text-box');
        if (!boxEl) return;
        const to = e.relatedTarget;
        if (to && to.id === 'ft-format-trigger') return; // moving onto the button itself
        hideFormatMenuTrigger();
      });

      // Dragging/resizing invalidates the trigger's position — hide it
      // on mousedown inside the box and let the next hover reposition it.
      doc.addEventListener('mousedown', (e) => {
        if (e.target.closest && e.target.closest('.free-text-box')) hideFormatMenuTrigger();
      }, true);
    }

    editor.on('load', wireFreeTextFormatMenuTrigger);
    editor.on('component:deselected', hideFormatMenuTrigger);

    // ═══════════════════════════════════════════════════════
    // CANVAS + PAGE STYLE — reads geometry from computePageLayout()
    // and turns it into the CSS injected into the canvas iframe as
    // <style id="page-style">.
    //
    // DEBUG: .page-border-frame gets a primary-accent outline and
    // .page-content gets an orange outline so the math is visually
    // verifiable before any real border art or content goes in.
    // ═══════════════════════════════════════════════════════
    function buildPageCSS() {
      const layout = computePageLayout();
      const w = `${layout.pageWidth}mm`;
      const h = `${layout.pageHeight}mm`;
      const { frame, bands, content } = layout;

      // Real line-border (once applied "to all pages") replaces the
      // debug orange outline on .page-content; pinned per-page overrides
      // still win via their higher-specificity #id rule regardless.
      const contentBorderDecl = lineBorderApplied
        ? buildLineBorderCSS(lineBorderConfig)
        : { border: '1px solid orange', 'border-radius': '0' };  // DEBUG default

      return `
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: #141414 !important;
        }

        body {
          min-width: 100%;
          padding: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
          box-sizing: border-box;
          background: #2b2b3b;
        }

        /* ── PAGE — canvas preview, matches print exactly ── */
        .page {
          position: relative;
          background: #262626;
          width: ${w};
          height: ${h};
          box-sizing: border-box;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: none !important;
          border: 1px solid #7a7a7aff;
          margin-bottom: 2rem !important;
        }

        /* ── BORDER FRAME — inset from page edge by margin, DEBUG outline ── */
        .page-border-frame {
          position: absolute;
          top: ${frame.top}mm;
          left: ${frame.left}mm;
          width: ${frame.width}mm;
          height: ${frame.height}mm;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 1;
          border: 1px solid var(--accent2);   /* DEBUG — primary */
        }

        /* ── Border bands — thickness = borderSize, blank until filled ── */
        .bdr {
          position: absolute;
          box-sizing: border-box;
          overflow: hidden;
        }
        .bdr-top {
          top: ${bands.top.top}mm; left: ${bands.top.left}mm;
          width: ${bands.top.width}mm; height: ${bands.top.height}mm;
        }
        .bdr-bottom {
          top: ${bands.bottom.top}mm; left: ${bands.bottom.left}mm;
          width: ${bands.bottom.width}mm; height: ${bands.bottom.height}mm;
        }
        .bdr-left {
          top: ${bands.left.top}mm; left: ${bands.left.left}mm;
          width: ${bands.left.width}mm; height: ${bands.left.height}mm;
        }
        .bdr-right {
          top: ${bands.right.top}mm; left: ${bands.right.left}mm;
          width: ${bands.right.width}mm; height: ${bands.right.height}mm;
        }
        .bdr .rot {
          display: block;
          transform-origin: top left;
        }

        /* ── CONTENT ZONE — inset by margin + borderSize + contentPadding ── */
        .page-content {
          position: absolute;
          top: ${content.top}mm;
          left: ${content.left}mm;
          width: ${content.width}mm;
          height: ${content.height}mm;
          overflow: hidden;
          box-sizing: border-box;
          z-index: 2;
          border: ${contentBorderDecl.border};   ${lineBorderApplied ? '' : '/* DEBUG */'}
          border-radius: ${contentBorderDecl['border-radius']};
        }

        .page.gjs-selected,
        .page.gjs-hovered,
        .page-border-frame.gjs-selected,
        .page-border-frame.gjs-hovered,
        .page-content.gjs-selected,
        .page-content.gjs-hovered {
          outline: none !important;
          box-shadow: none !important;
        }

        /* ── FREE TEXT BOX — transparent, freely draggable/resizable,
           editable. Border stays fully transparent (no visible guide)
           until the box is hovered, focused (mid-edit), or selected —
           border-box sizing keeps the 1px reserved either way so
           nothing shifts when it appears. Capped to its parent's
           content box so it can never be resized past it. ── */
        .free-text-box {
          position: absolute;
          background: transparent;
          border: 1px dashed transparent;
          max-width: 100%;
          max-height: 100%;
          cursor: move;
          box-sizing: border-box;
        }
        .free-text-box:hover,
        .free-text-box:focus,
        .free-text-box.gjs-comp-editing,
        .free-text-box.gjs-selected {
          border-color: var(--accent2);
        }

        /* ── PRINT — non-negotiable, always emitted ── */
        @media print {
          body {
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            display: block !important;
          }

          @page {
            size: ${w} ${h};
            margin: 0;
          }

          .page {
            width: ${w} !important;
            height: ${h} !important;
            box-sizing: border-box;
            overflow: hidden;
          }

          /* Debug outlines are canvas-only aids — strip them on print.
             .page-border-frame is always debug-only right now (graphic
             border lands next session). .page-content keeps its border
             in print once a real line border has been applied. */
          .page-border-frame { border-color: transparent !important; }
          ${lineBorderApplied ? '' : '.page-content { border-color: transparent !important; }'}
          .free-text-box { border-color: transparent !important; }
        }
      `;
    }

    function applyPageStyle() {
      const wrapperComp = editor.getWrapper();
      if (wrapperComp) {
        wrapperComp.setStyle({
          ...wrapperComp.getStyle(),
          'background-color': '#111314ff !important;',
          'gap': '40px',
        });
      }

      const canvasDoc = editor.Canvas.getDocument();
      if (!canvasDoc) return;

      let styleTag = canvasDoc.getElementById('page-style');
      if (!styleTag) {
        styleTag = canvasDoc.createElement('style');
        styleTag.id = 'page-style';
        canvasDoc.head.appendChild(styleTag);
      }
      styleTag.innerHTML = buildPageCSS();
    }

    // ── PAGE MARKUP — page, border-frame (+ 4 blank bands), page-content.
    // (header/footer markup removed with those modules; border art —
    // asterisks, icon repeats, etc. — gets filled into the .bdr divs later,
    // left blank here on purpose.) ──
    function buildPageHTML() {
      return `<div class="page" data-gjs-type="page">
        <div class="page-border-frame" data-gjs-type="page-border-frame">
          <div class="bdr bdr-top"></div>
          <div class="bdr bdr-bottom"></div>
          <div class="bdr bdr-left"><span class="rot"></span></div>
          <div class="bdr bdr-right"><span class="rot"></span></div>
        </div>
        <div class="page-content" data-gjs-type="page-content"></div>
      </div>`;
    }

    editor.on('load', () => {
      editor.getWrapper().set('droppable', false); // disable drop on root wrapper
      applyPageStyle();
      editor.setComponents(buildPageHTML());
    });

    // ── ADD PAGE ──
    document.getElementById('btn-add-page').addEventListener('click', () => {
      editor.getWrapper().append(buildPageHTML());
    });

    // ── ADD TEXT — drops a transparent, editable, freely-draggable text
    // box into the focused page's content zone. Each add is nudged a
    // little further down/right so repeats don't land exactly on top
    // of each other. ──
    document.getElementById('btn-add-text').addEventListener('click', () => {
      const contentComp = getCurrentPageContentComponent();
      if (!contentComp) {
        console.warn('Add Text: no current page found to add to.');
        return;
      }
      const existing = contentComp.components().filter(c => c.getClasses().includes('free-text-box')).length;
      const step = (existing % 6) * 8; // mm
      const [added] = contentComp.append({ type: 'free-text' });
      added.addStyle({ top: `${20 + step}mm`, left: `${20 + step}mm` });
      editor.select(added);
      clampFreeTextBox(added); // in case the cascading offset lands outside a small page
    });

    // ═══════════════════════════════════════════════════════
    // EXPORT — bundles editor HTML/CSS + the injected page-style
    // tag into a single standalone .html file.
    // (Other style-tag ids — header/footer/bg/numbering/watermark
    //  — removed along with those modules; add their ids back to
    //  styleTagIds below if/when reintroduced.)
    // ═══════════════════════════════════════════════════════
    document.getElementById('btn-export').addEventListener('click', () => {
      const canvasDoc = editor.Canvas.getDocument();

      const styleTagIds = ['page-style'];

      const injectedCss = styleTagIds
        .map(id => canvasDoc.getElementById(id)?.innerHTML || '')
        .join('\n');

      const html = editor.getHtml();
      const css  = editor.getCss() + '\n' + injectedCss
        // Export-only guarantee: strip the free-text guide border for
        // good — no hover/focus/selected state exists in a static
        // export, but this makes the "no border" outcome explicit and
        // immune to anything upstream in the cascade.
        + '\n.free-text-box, .free-text-box:hover, .free-text-box:focus, .free-text-box:active '
        + '{ border: none !important; cursor: default !important; }';

      const blob = new Blob([`<style>${css}</style>${html}`], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'template.html';
      a.click();
    });
