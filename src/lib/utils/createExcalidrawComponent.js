export async function createExcalidrawComponent(props) {
const React = await import('react');
const ReactDOM = await import('react-dom/client');
const { Excalidraw } = await import('@excalidraw/excalidraw');

return {
render: (node) => {
const root = ReactDOM.createRoot(node);
root.render(React.createElement(Excalidraw, { ...props, portalContainer: node }));
return {
destroy: () => root.unmount()
};
}
};
}
