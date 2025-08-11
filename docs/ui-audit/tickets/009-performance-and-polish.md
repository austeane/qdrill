## Ticket 009: Performance and Polish (Content-Visibility, Lazy Images, Logging)

Branch: `feat/ui-revamp-one-shot`

Objectives
- Improve perceived performance and reduce noise in production

Scope of Work
- Add `content-visibility: auto` to long sections/pages (plan viewer)
- Ensure all images specify width/height and are lazy-loaded
- Replace console debug logs with a leveled logger; silence logs in production
- Add subtle transitions for overlays/menus using tokenized durations/easings

Acceptance Criteria
- Scrolling long plan pages is smooth; no large layout shifts from images
- Production build has no noisy dev logs from components

Notes
- Keep logging minimal and guard by `NODE_ENV`


