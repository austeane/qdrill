import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty) {
	if (!dirty) return '';
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS: [
			'p',
			'br',
			'strong',
			'em',
			'u',
			's',
			'ul',
			'ol',
			'li',
			'blockquote',
			'a',
			'img',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'table',
			'thead',
			'tbody',
			'tr',
			'td',
			'th'
		],
		ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
		ALLOW_DATA_ATTR: false,
		FORCE_BODY: true
	});
}
