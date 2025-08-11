import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a server-side DOMPurify instance using JSDOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize potentially unsafe HTML.
 * Always use this before rendering any user-provided or rich text HTML.
 */
export function sanitizeHtml(input) {
  if (input == null) return '';
  return DOMPurify.sanitize(String(input));
}