/**
 * blocks.js — FormCraft Template Designer
 * ─────────────────────────────────────────
 * All drag & drop blocks registered into GrapesJS.
 * Call initBlocks(editor) after grapesjs.init()
 *
 * Block Categories:
 *  1. Text & Typography
 *  2. Form Fields
 *  3. Layout
 *  4. Document Elements
 *  5. Date Blocks
 */

function initBlocks(editor) {

  const bm = editor.BlockManager;

  // ═══════════════════════════════════════════════════
  // SHARED STYLES (injected into canvas)
  // ═══════════════════════════════════════════════════
  const baseFieldStyle = `
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #000;
    box-sizing: border-box;
  `;

  const labelStyle = `
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: #555;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;

  const inputStyle = `
    display: block;
    width: 100%;
    border: none;
    border-bottom: 1.5px solid #333;
    padding: 4px 2px;
    font-size: 12px;
    font-family: Arial, sans-serif;
    outline: none;
    background: transparent;
    color: #000;
  `;

  const boxStyle = `
    border: 1px solid #333;
    padding: 8px;
    min-height: 36px;
    font-size: 12px;
    font-family: Arial, sans-serif;
    background: #fff;
    box-sizing: border-box;
  `;


  // ═══════════════════════════════════════════════════
  // 1. TEXT & TYPOGRAPHY
  // ═══════════════════════════════════════════════════

  // TEXT BLOCK
  bm.add('text-block', {
    label: 'Text Block',
    category: 'Text & Typography',
    attributes: { class: 'bi bi-fonts' },
    content: {
      type: 'text',
      content: 'Click to edit this text...',
      style: {
        'font-family': 'Arial, sans-serif',
        'font-size': '12px',
        'color': '#000000',
        'padding': '6px',
        'min-height': '30px',
        'line-height': '1.6',
      },
      editable: true,
    },
  });

  // HEADING
  bm.add('heading', {
    label: 'Heading',
    category: 'Text & Typography',
    attributes: { class: 'bi bi-type-h1' },
    content: `<h2 style="
      font-family: Arial, sans-serif;
      font-size: 20px;
      font-weight: bold;
      color: #000;
      margin: 0 0 8px 0;
      padding: 4px 0;
      border-bottom: 2px solid #333;
    ">Section Heading</h2>`,
  });

  // BULLET LIST
  bm.add('bullet-list', {
    label: 'Bullet List',
    category: 'Text & Typography',
    attributes: { class: 'bi bi-list-ul' },
    content: `<ul style="
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
      padding-left: 20px;
      margin: 6px 0;
      line-height: 1.8;
    ">
      <li>List item one</li>
      <li>List item two</li>
      <li>List item three</li>
    </ul>`,
  });

  // NOTE / CALLOUT
  bm.add('note', {
    label: 'Note',
    category: 'Text & Typography',
    attributes: { class: 'bi bi-sticky' },
    content: `<div style="
      border-left: 4px solid #f0ad4e;
      background: #fffbf0;
      padding: 10px 14px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #555;
      margin: 6px 0;
      border-radius: 0 4px 4px 0;
    ">
      <strong style="color:#c87f00;">📝 Note:</strong>
      Type your note or instruction here.
    </div>`,
  });


  // ═══════════════════════════════════════════════════
  // 2. FORM FIELDS
  // ═══════════════════════════════════════════════════

  // FIELD BLOCK (text input line)
  bm.add('field-block', {
    label: 'Field Block',
    category: 'Form Fields',
    attributes: { class: 'bi bi-input-cursor-text' },
    content: `<div style="${baseFieldStyle} padding: 4px 0; margin-bottom: 12px;">
      <label style="${labelStyle}">Field Label</label>
      <div style="${inputStyle} min-height: 24px;">&nbsp;</div>
    </div>`,
  });

  // CHECKBOX
  bm.add('checkbox', {
    label: 'Checkbox',
    category: 'Form Fields',
    attributes: { class: 'bi bi-check2-square' },
    content: `<div style="${baseFieldStyle} padding: 6px 0;">
      <table style="border-collapse:collapse; font-family:Arial,sans-serif; font-size:12px;">
        <tr>
          <td style="padding: 3px 8px 3px 0;">
            <span style="display:inline-block; width:14px; height:14px; border:1.5px solid #333; vertical-align:middle; margin-right:6px;"></span>
            Option One
          </td>
        </tr>
        <tr>
          <td style="padding: 3px 8px 3px 0;">
            <span style="display:inline-block; width:14px; height:14px; border:1.5px solid #333; vertical-align:middle; margin-right:6px;"></span>
            Option Two
          </td>
        </tr>
        <tr>
          <td style="padding: 3px 8px 3px 0;">
            <span style="display:inline-block; width:14px; height:14px; border:1.5px solid #333; vertical-align:middle; margin-right:6px;"></span>
            Option Three
          </td>
        </tr>
      </table>
    </div>`,
  });

  // DROPDOWN (select)
  bm.add('dropdown', {
    label: 'Dropdown',
    category: 'Form Fields',
    attributes: { class: 'bi bi-menu-button-wide' },
    content: `<div style="${baseFieldStyle} padding: 4px 0; margin-bottom: 12px;">
      <label style="${labelStyle}">Select Field</label>
      <div style="
        border: 1px solid #333;
        padding: 5px 8px;
        font-size: 12px;
        font-family: Arial, sans-serif;
        background: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span style="color:#999;">Choose an option...</span>
        <span style="color:#333;">▼</span>
      </div>
    </div>`,
  });

  // DATE BOX
  bm.add('date-box', {
    label: 'Date Box',
    category: 'Form Fields',
    attributes: { class: 'bi bi-calendar-date' },
    content: `<div style="${baseFieldStyle} padding: 4px 0; margin-bottom: 12px;">
      <label style="${labelStyle}">Date</label>
      <div style="display:flex; gap:4px; align-items:center;">
        <div style="${boxStyle} width:44px; text-align:center; min-height:30px;">DD</div>
        <span style="font-size:14px; font-weight:bold;">/</span>
        <div style="${boxStyle} width:44px; text-align:center; min-height:30px;">MM</div>
        <span style="font-size:14px; font-weight:bold;">/</span>
        <div style="${boxStyle} width:60px; text-align:center; min-height:30px;">YYYY</div>
      </div>
    </div>`,
  });

  // TIME BOX
  bm.add('time-box', {
    label: 'Time Box',
    category: 'Form Fields',
    attributes: { class: 'bi bi-clock' },
    content: `<div style="${baseFieldStyle} padding: 4px 0; margin-bottom: 12px;">
      <label style="${labelStyle}">Time</label>
      <div style="display:flex; gap:4px; align-items:center;">
        <div style="${boxStyle} width:44px; text-align:center; min-height:30px;">HH</div>
        <span style="font-size:16px; font-weight:bold;">:</span>
        <div style="${boxStyle} width:44px; text-align:center; min-height:30px;">MM</div>
        <div style="${boxStyle} width:36px; text-align:center; min-height:30px; font-size:11px;">AM</div>
      </div>
    </div>`,
  });

  // CURRENCY
  bm.add('currency', {
    label: 'Currency',
    category: 'Form Fields',
    attributes: { class: 'bi bi-currency-dollar' },
    content: `<div style="${baseFieldStyle} padding: 4px 0; margin-bottom: 12px;">
      <label style="${labelStyle}">Amount</label>
      <div style="display:flex; align-items:center; border-bottom: 1.5px solid #333;">
        <span style="font-size:13px; font-weight:bold; padding: 4px 6px 4px 2px; color:#333;">$</span>
        <div style="flex:1; padding: 4px 2px; min-height:24px; font-size:12px; font-family:Arial;">&nbsp;</div>
        <span style="font-size:10px; color:#888; padding: 4px 2px;">USD</span>
      </div>
    </div>`,
  });


  // ═══════════════════════════════════════════════════
  // 3. LAYOUT
  // ═══════════════════════════════════════════════════

  // TABLE
  bm.add('table', {
    label: 'Table',
    category: 'Layout',
    attributes: { class: 'bi bi-table' },
    content: `<table style="
      width: 100%;
      border-collapse: collapse;
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
      margin: 8px 0;
    ">
      <thead>
        <tr style="background:#333; color:#fff;">
          <th style="border:1px solid #333; padding:7px 10px; text-align:left;">Column 1</th>
          <th style="border:1px solid #333; padding:7px 10px; text-align:left;">Column 2</th>
          <th style="border:1px solid #333; padding:7px 10px; text-align:left;">Column 3</th>
          <th style="border:1px solid #333; padding:7px 10px; text-align:left;">Column 4</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
          <td style="border:1px solid #ccc; padding:6px 10px;">&nbsp;</td>
        </tr>
      </tbody>
    </table>`,
  });

  // 2 COLUMNS
  bm.add('two-col', {
    label: '2 Columns',
    category: 'Layout',
    attributes: { class: 'bi bi-layout-split' },
    content: `<div style="display:flex; gap:16px; width:100%; box-sizing:border-box;">
      <div style="flex:1; min-height:60px; border:1px dashed #ccc; padding:10px; font-family:Arial,sans-serif; font-size:12px; color:#999;">
        Left column — drop content here
      </div>
      <div style="flex:1; min-height:60px; border:1px dashed #ccc; padding:10px; font-family:Arial,sans-serif; font-size:12px; color:#999;">
        Right column — drop content here
      </div>
    </div>`,
  });

  // 3 COLUMNS
  bm.add('columns', {
    label: '3 Columns',
    category: 'Layout',
    attributes: { class: 'bi bi-layout-three-columns' },
    content: `<div style="display:flex; gap:12px; width:100%; box-sizing:border-box;">
      <div style="flex:1; min-height:60px; border:1px dashed #ccc; padding:10px; font-family:Arial,sans-serif; font-size:12px; color:#999;">Column 1</div>
      <div style="flex:1; min-height:60px; border:1px dashed #ccc; padding:10px; font-family:Arial,sans-serif; font-size:12px; color:#999;">Column 2</div>
      <div style="flex:1; min-height:60px; border:1px dashed #ccc; padding:10px; font-family:Arial,sans-serif; font-size:12px; color:#999;">Column 3</div>
    </div>`,
  });

  // TITLE BLOCK
  bm.add('title-block', {
    label: 'Title Block',
    category: 'Layout',
    attributes: { class: 'bi bi-textarea-t' },
    content: `<div style="
      text-align: center;
      padding: 16px;
      border-bottom: 3px double #333;
      margin-bottom: 12px;
      font-family: Arial, sans-serif;
    ">
      <div style="font-size:20px; font-weight:bold; color:#000; letter-spacing:1px;">DOCUMENT TITLE</div>
      <div style="font-size:12px; color:#555; margin-top:4px;">Subtitle or document reference number</div>
    </div>`,
  });

  // LETTERHEAD
  bm.add('letterhead', {
    label: 'Letterhead',
    category: 'Layout',
    attributes: { class: 'bi bi-file-earmark-text' },
    content: `<div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 3px solid #333;
      margin-bottom: 16px;
      font-family: Arial, sans-serif;
    ">
      <div>
        <div style="width:80px; height:50px; border:1px dashed #ccc; display:flex; align-items:center; justify-content:center; color:#aaa; font-size:10px;">LOGO</div>
      </div>
      <div style="text-align:center; flex:1; padding:0 20px;">
        <div style="font-size:18px; font-weight:bold; color:#000;">COMPANY NAME</div>
        <div style="font-size:10px; color:#555; margin-top:2px;">Address Line 1, City, Country | Tel: 000-000-0000 | email@company.com</div>
      </div>
      <div style="text-align:right; font-size:10px; color:#555;">
        <div>Ref: ___________</div>
        <div style="margin-top:4px;">Date: ___________</div>
      </div>
    </div>`,
  });

  // HEADER BAND
  bm.add('header-block', {
    label: 'Header',
    category: 'Layout',
    attributes: { class: 'bi bi-layout-text-window-reverse' },
    content: `<div style="
      background: #333;
      color: #fff;
      padding: 10px 16px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    ">SECTION HEADER</div>`,
  });

  // FOOTER BAND
  bm.add('footer-block', {
    label: 'Footer',
    category: 'Layout',
    attributes: { class: 'bi bi-layout-text-window' },
    content: `<div style="
      border-top: 2px solid #333;
      padding: 8px 16px;
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: #555;
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    ">
      <span>Confidential — Internal Use Only</span>
      <span>Page 1 of 1</span>
      <span>Version 1.0</span>
    </div>`,
  });

  // SOLID LINE / HR
  bm.add('line-solid', {
    label: 'Solid Line',
    category: 'Layout',
    attributes: { class: 'bi bi-dash-lg' },
    content: `<hr style="border:none; border-top:1.5px solid #333; margin:10px 0;" />`,
  });

  // DASHED LINE
  bm.add('line-dashed', {
    label: 'Dashed Line',
    category: 'Layout',
    attributes: { class: 'bi bi-dash' },
    content: `<hr style="border:none; border-top:1.5px dashed #333; margin:10px 0;" />`,
  });

  // DOTTED LINE
  bm.add('line-dotted', {
    label: 'Dotted Line',
    category: 'Layout',
    attributes: { class: 'bi bi-three-dots' },
    content: `<hr style="border:none; border-top:1.5px dotted #333; margin:10px 0;" />`,
  });


  // ═══════════════════════════════════════════════════
  // 4. DOCUMENT ELEMENTS
  // ═══════════════════════════════════════════════════

  // SIGNATURE BOX
  bm.add('signature-box', {
    label: 'Signature Box',
    category: 'Document Elements',
    attributes: { class: 'bi bi-pen' },
    content: `<div style="${baseFieldStyle} padding: 4px 0; margin-bottom: 12px; display:inline-block; min-width:200px;">
      <div style="
        border: 1px solid #333;
        height: 70px;
        width: 100%;
        background: #fafafa;
        position: relative;
      ">
        <span style="
          position:absolute; bottom:6px; left:8px;
          font-size:9px; color:#aaa; letter-spacing:0.5px;
        ">SIGNATURE</span>
      </div>
      <div style="border-top: 1.5px solid #333; margin-top:4px; padding-top:3px; font-size:10px; color:#555;">
        Name: _________________________ &nbsp; Date: ___________
      </div>
    </div>`,
  });

  // SIGNATURE LINE (simple)
  bm.add('signature-line', {
    label: 'Signature Line',
    category: 'Document Elements',
    attributes: { class: 'bi bi-pen-fill' },
    content: `<div style="${baseFieldStyle} padding: 4px 0; margin: 16px 0 4px;">
      <div style="border-bottom: 1.5px solid #333; min-width:200px; height:30px;"></div>
      <div style="font-size:10px; color:#555; margin-top:3px;">Signature &amp; Date</div>
    </div>`,
  });

  // DIGITAL SIGNATURE PLACEHOLDER
  bm.add('digital-sig', {
    label: 'Digital Signature',
    category: 'Document Elements',
    attributes: { class: 'bi bi-shield-lock' },
    content: `<div style="
      border: 1.5px dashed #4f8ef7;
      background: #f0f6ff;
      padding: 12px 16px;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #4f8ef7;
      text-align: center;
      border-radius: 4px;
      margin: 8px 0;
    ">
      🔒 <strong>Digital Signature Required</strong><br/>
      <span style="font-size:10px; color:#888;">This field will be signed electronically</span>
    </div>`,
  });

  // PASSPORT PHOTO BOX
  bm.add('photo-box', {
    label: 'Passport Photo',
    category: 'Document Elements',
    attributes: { class: 'bi bi-person-badge' },
    content: `<div style="
      width: 90px;
      height: 110px;
      border: 1.5px solid #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 9px;
      color: #aaa;
      text-align: center;
      background: #fafafa;
    ">
      <div style="font-size:28px; color:#ccc;">👤</div>
      <div style="margin-top:4px; line-height:1.3;">Passport<br/>Photo<br/>35×45mm</div>
    </div>`,
  });

  // IMAGE BLOCK
  bm.add('image-block', {
    label: 'Image',
    category: 'Document Elements',
    attributes: { class: 'bi bi-image' },
    content: {
      type: 'image',
      style: {
        'width': '200px',
        'height': '120px',
        'object-fit': 'cover',
        'border': '1px solid #ccc',
      },
      attributes: { src: 'https://placehold.co/200x120?text=Image', alt: 'Image' },
    },
  });

  // WATERMARK
  bm.add('watermark', {
    label: 'Watermark',
    category: 'Document Elements',
    attributes: { class: 'bi bi-water' },
    content: `<div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72px;
      font-family: Arial, sans-serif;
      font-weight: bold;
      color: rgba(0,0,0,0.07);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      letter-spacing: 8px;
    ">DRAFT</div>`,
  });

  // ICON BLOCK
  bm.add('icon-block', {
    label: 'Icon / Star',
    category: 'Document Elements',
    attributes: { class: 'bi bi-star' },
    content: `<div style="
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #333;
      padding: 4px 0;
    ">
      <span style="font-size:18px;">★</span>
      <span>Label text</span>
    </div>`,
  });

  // COLOUR PLACEHOLDER
  bm.add('placeholder', {
    label: 'Placeholder',
    category: 'Document Elements',
    attributes: { class: 'bi bi-bounding-box' },
    content: `<div style="
      border: 2px dashed #f0ad4e;
      background: #fffbf0;
      min-height: 60px;
      min-width: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #c87f00;
      border-radius: 4px;
      padding: 10px;
    ">[ Placeholder ]</div>`,
  });


  // ═══════════════════════════════════════════════════
  // 5. DATE BLOCKS
  // ═══════════════════════════════════════════════════

  // MY — Month / Year
  bm.add('date-my', {
    label: 'MY',
    category: 'Date Blocks',
    attributes: { class: 'bi bi-calendar2' },
    content: `<div style="${baseFieldStyle} padding:4px 0; margin-bottom:10px;">
      <label style="${labelStyle}">Month / Year</label>
      <div style="display:flex; gap:4px; align-items:center;">
        <div style="${boxStyle} width:50px; text-align:center; min-height:30px; font-size:11px;">MM</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:64px; text-align:center; min-height:30px; font-size:11px;">YYYY</div>
      </div>
    </div>`,
  });

  // MD — Month / Day
  bm.add('date-md', {
    label: 'MD',
    category: 'Date Blocks',
    attributes: { class: 'bi bi-calendar2-day' },
    content: `<div style="${baseFieldStyle} padding:4px 0; margin-bottom:10px;">
      <label style="${labelStyle}">Month / Day</label>
      <div style="display:flex; gap:4px; align-items:center;">
        <div style="${boxStyle} width:50px; text-align:center; min-height:30px; font-size:11px;">MM</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:50px; text-align:center; min-height:30px; font-size:11px;">DD</div>
      </div>
    </div>`,
  });

  // MDY — Month / Day / Year
  bm.add('date-mdy', {
    label: 'MDY',
    category: 'Date Blocks',
    attributes: { class: 'bi bi-calendar2-range' },
    content: `<div style="${baseFieldStyle} padding:4px 0; margin-bottom:10px;">
      <label style="${labelStyle}">Month / Day / Year</label>
      <div style="display:flex; gap:4px; align-items:center;">
        <div style="${boxStyle} width:44px; text-align:center; min-height:30px; font-size:11px;">MM</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:44px; text-align:center; min-height:30px; font-size:11px;">DD</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:60px; text-align:center; min-height:30px; font-size:11px;">YYYY</div>
      </div>
    </div>`,
  });

  // MDY HR — Month / Day / Year + Hour/Min
  bm.add('date-mdy-hr', {
    label: 'MDY + HR',
    category: 'Date Blocks',
    attributes: { class: 'bi bi-calendar2-plus' },
    content: `<div style="${baseFieldStyle} padding:4px 0; margin-bottom:10px;">
      <label style="${labelStyle}">Date & Time</label>
      <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">MM</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">DD</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:56px; text-align:center; min-height:30px; font-size:11px;">YYYY</div>
        <span style="color:#555; font-size:11px; padding:0 2px;">at</span>
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">HH</div>
        <span style="font-weight:bold;">:</span>
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">MM</div>
      </div>
    </div>`,
  });

  // MAD HR — Month / Day + AM/PM
  bm.add('date-mad-hr', {
    label: 'MAD HR',
    category: 'Date Blocks',
    attributes: { class: 'bi bi-calendar3' },
    content: `<div style="${baseFieldStyle} padding:4px 0; margin-bottom:10px;">
      <label style="${labelStyle}">Date & AM/PM</label>
      <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">MM</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">DD</div>
        <span style="font-weight:bold;">/</span>
        <div style="${boxStyle} width:56px; text-align:center; min-height:30px; font-size:11px;">YYYY</div>
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">HH</div>
        <span style="font-weight:bold;">:</span>
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px;">MM</div>
        <div style="${boxStyle} width:40px; text-align:center; min-height:30px; font-size:11px; color:#555;">AM</div>
      </div>
    </div>`,
  });


  console.log('✅ FormCraft blocks loaded —', bm.getAll().length, 'blocks registered');
}
