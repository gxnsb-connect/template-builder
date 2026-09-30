export function PageComponent(editor) {
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

}