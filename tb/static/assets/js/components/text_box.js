export function TextBox(editor) {
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

}