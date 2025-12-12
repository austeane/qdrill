exports.shorthands = undefined;

exports.up = (pgm) => {
	// Older code paths and existing migrations use drills.date_created for sorting.
	// A previous migration created idx_drills_created_at on drills.created_at, which may not exist
	// and doesn't help the actual queries. Fix by ensuring a DESC index on date_created and
	// dropping the created_at index if present.
	pgm.sql('DROP INDEX IF EXISTS idx_drills_created_at;');
	pgm.sql(
		'CREATE INDEX IF NOT EXISTS idx_drills_date_created_desc ON drills (date_created DESC);'
	);
};

exports.down = (pgm) => {
	pgm.sql('DROP INDEX IF EXISTS idx_drills_date_created_desc;');
	// Best-effort restore of the previous index (if created_at exists).
	try {
		pgm.sql('CREATE INDEX IF NOT EXISTS idx_drills_created_at ON drills (created_at DESC);');
	} catch {}
};

