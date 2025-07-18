import { tabbable } from 'tabbable';

export function focusTrap(node) {
  const previouslyFocused = document.activeElement;

  const focusFirst = () => {
    const nodes = tabbable(node);
    if (nodes.length > 0) {
      nodes[0].focus();
    } else {
      node.focus();
    }
  };

  const handleKeydown = (e) => {
    if (e.key !== 'Tab') return;
    const nodes = tabbable(node);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  node.addEventListener('keydown', handleKeydown);
  focusFirst();

  return {
    destroy() {
      node.removeEventListener('keydown', handleKeydown);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    }
  };
}
