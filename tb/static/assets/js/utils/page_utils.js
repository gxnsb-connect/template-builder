// ═══════════════════════════════════════════════════════
// PAGE SIZE REGISTRY (all values in mm)
// ═══════════════════════════════════════════════════════
const PAGE_SIZES = {
      A0: { width: 841, height: 1189 },
      A1: { width: 594, height: 841  },
      A2: { width: 420, height: 594  },
      A3: { width: 297, height: 420  },
      A4: { width: 210, height: 297  },   // default
      A5: { width: 148, height: 210  },
      A6: { width: 105, height: 148  },
      A7: { width: 74,  height: 105  },
      A8: { width: 52,  height: 74   },
    };




// ── PAGE CONFIG ──
// Layout reads left→right / top→bottom as:
//   [ margin | borderSize | contentPadding | content-area | contentPadding | borderSize | margin ]
// "Page margin" set in the Page Layout dropdown is applied as the
// OUTER edge of the border band (i.e. the border frame sits inset
// from the page edge by `margin`, and is `borderSize` thick).
const pageConfig = {
      size:        'A4',        // key into PAGE_SIZES
      orientation: 'portrait',  // 'portrait' | 'landscape' — swaps width/height when read
      unit:        'mm',
      margin:         { top: 10, right: 10, bottom: 10, left: 10 },  // page edge → border band, mm
      borderSize:     0,   // thickness of the decorative border band, mm (all 4 sides equal for now)
      contentPadding: 0,   // gutter between border band and content-area, mm
    };


    // ── RESOLVE ACTUAL DIMENSIONS FROM size + orientation ──
export function getPageDimensions() {
    const base = PAGE_SIZES[pageConfig.size] || PAGE_SIZES.A4;
    const { width, height } = base;
    return pageConfig.orientation === 'landscape'
        ? { width: height, height: width }
        : { width, height };
    }

export function computePageLayout(config = pageConfig) {
      const { width: pageWidth, height: pageHeight } = getPageDimensions();
      const m  = config.margin;
      const bs = config.borderSize;
      const cp = config.contentPadding;

      // ── Border frame — inset from the page edge by `margin` ──
      const frame = {
        top:    m.top,
        left:   m.left,
        width:  pageWidth  - m.left - m.right,
        height: pageHeight - m.top  - m.bottom,
      };

      // ── Border bands — drawn along the 4 edges of the frame, `borderSize` thick ──
      const bands = {
        top:    { top: 0,                 left: 0,                 width: frame.width,               height: bs },
        bottom: { top: frame.height - bs,  left: 0,                 width: frame.width,               height: bs },
        left:   { top: bs,                 left: 0,                 width: bs,                         height: frame.height - 2 * bs },
        right:  { top: bs,                 left: frame.width - bs,  width: bs,                         height: frame.height - 2 * bs },
      };

      // ── Content area — inset from the page edge by margin + borderSize + contentPadding ──
      const inset = { top: m.top + bs + cp, right: m.right + bs + cp, bottom: m.bottom + bs + cp, left: m.left + bs + cp };
      const content = {
        top:    inset.top,
        left:   inset.left,
        width:  pageWidth  - inset.left - inset.right,
        height: pageHeight - inset.top  - inset.bottom,
      };

      return { pageWidth, pageHeight, margin: m, borderSize: bs, contentPadding: cp, frame, bands, content };
    }
