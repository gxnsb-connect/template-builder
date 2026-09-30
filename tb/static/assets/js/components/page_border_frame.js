export function PageBorderFrame(editor) {
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

}