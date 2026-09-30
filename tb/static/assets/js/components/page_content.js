export function PagContentComponent(editor) {
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

}