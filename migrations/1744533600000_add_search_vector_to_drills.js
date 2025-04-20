/**
 * Add search_vector column and GIN index for full-text search on drills
 *
 * Uses node-pg-migrate migration builder.
 */

/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  // 1. Add the tsvector column
  pgm.addColumn('drills', {
    search_vector: {
      type: 'tsvector',
      notNull: false,
    },
  });

  // 2. Create an update function to keep the column in sync
  pgm.sql(`
    CREATE OR REPLACE FUNCTION drills_search_vector_update()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.brief_description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.detailed_description, '')), 'C');
      RETURN NEW;
    END
    $$;
  `);

  // 3. Create trigger that calls the function on INSERT / UPDATE
  pgm.createTrigger('drills', 'drills_search_vector_trigger', {
    when: 'BEFORE',
    operation: ['INSERT', 'UPDATE'],
    level: 'ROW',
    function: 'drills_search_vector_update',
  });

  // 4. Back‑fill existing rows
  pgm.sql(`
    UPDATE drills
    SET search_vector =
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(brief_description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(detailed_description, '')), 'C');
  `);

  // 5. Create GIN index on the new column
  pgm.createIndex('drills', 'search_vector', {
    method: 'gin',
    name: 'idx_gin_drill_search_vector',
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.dropIndex('drills', 'search_vector', { name: 'idx_gin_drill_search_vector' });
  pgm.dropTrigger('drills', 'drills_search_vector_trigger');
  pgm.sql('DROP FUNCTION IF EXISTS drills_search_vector_update();');
  pgm.dropColumn('drills', 'search_vector');
}; 