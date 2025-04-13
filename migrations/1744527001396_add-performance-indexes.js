/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
	// Formations indexes
	pgm.createIndex('formations', 'tags', { method: 'gin' }); // GIN index for array search
	pgm.createIndex('formations', 'formation_type');

	// Drills indexes
	pgm.createIndex('drills', 'name');
	pgm.createIndex('drills', 'date_created');
	pgm.createIndex('drills', 'number_of_people_min');
	pgm.createIndex('drills', 'number_of_people_max');
	// Partial index for hasVideo
	pgm.createIndex('drills', 'video_link', { where: 'video_link IS NOT NULL', name: 'idx_drills_has_video' });
	// Expression index for hasImages
	pgm.createIndex('drills', '(images IS NOT NULL AND array_length(images, 1) > 0)', { name: 'idx_drills_has_images' });
	// Expression index for hasDiagrams
	pgm.createIndex('drills', '(diagrams IS NOT NULL AND array_length(diagrams, 1) > 0)', { name: 'idx_drills_has_diagrams' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
	// Formations indexes
	pgm.dropIndex('formations', 'tags', { method: 'gin' });
	pgm.dropIndex('formations', 'formation_type');

	// Drills indexes
	pgm.dropIndex('drills', 'name');
	pgm.dropIndex('drills', 'date_created');
	pgm.dropIndex('drills', 'number_of_people_min');
	pgm.dropIndex('drills', 'number_of_people_max');
	pgm.dropIndex('drills', 'video_link', { name: 'idx_drills_has_video' });
	pgm.dropIndex('drills', '(images IS NOT NULL AND array_length(images, 1) > 0)', { name: 'idx_drills_has_images' });
	pgm.dropIndex('drills', '(diagrams IS NOT NULL AND array_length(diagrams, 1) > 0)', { name: 'idx_drills_has_diagrams' });
};
