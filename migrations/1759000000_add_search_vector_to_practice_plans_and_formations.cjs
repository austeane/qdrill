exports.shorthands = undefined;

exports.up = (pgm) => {
  // practice_plans: search_vector column, trigger, GIN index
  pgm.addColumn('practice_plans', { search_vector: { type: 'tsvector' } });
  pgm.sql(`
    CREATE OR REPLACE FUNCTION practice_plans_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.practice_goals::text, '')), 'C');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;
  `);
  pgm.createTrigger('practice_plans', 'practice_plans_search_vector_trigger', {
    when: 'BEFORE',
    operation: ['INSERT', 'UPDATE'],
    level: 'ROW',
    function: 'practice_plans_search_vector_update'
  });
  pgm.createIndex('practice_plans', 'search_vector', { name: 'idx_gin_practice_plans_search_vector', method: 'gin' });

  // formations: search_vector column, trigger, GIN index
  pgm.addColumn('formations', { search_vector: { type: 'tsvector' } });
  pgm.sql(`
    CREATE OR REPLACE FUNCTION formations_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.brief_description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.detailed_description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.tags::text, '')), 'C');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;
  `);
  pgm.createTrigger('formations', 'formations_search_vector_trigger', {
    when: 'BEFORE',
    operation: ['INSERT', 'UPDATE'],
    level: 'ROW',
    function: 'formations_search_vector_update'
  });
  pgm.createIndex('formations', 'search_vector', { name: 'idx_gin_formations_search_vector', method: 'gin' });

  // Backfill existing rows
  pgm.sql(`
    UPDATE practice_plans SET search_vector =
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(notes, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(practice_goals::text, '')), 'C');
  `);
  pgm.sql(`
    UPDATE formations SET search_vector =
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(brief_description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(detailed_description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(tags::text, '')), 'C');
  `);
};

exports.down = (pgm) => {
  // formations teardown
  pgm.dropIndex('formations', 'search_vector', { name: 'idx_gin_formations_search_vector' });
  pgm.dropTrigger('formations', 'formations_search_vector_trigger');
  pgm.sql('DROP FUNCTION IF EXISTS formations_search_vector_update();');
  pgm.dropColumn('formations', 'search_vector');

  // practice_plans teardown
  pgm.dropIndex('practice_plans', 'search_vector', { name: 'idx_gin_practice_plans_search_vector' });
  pgm.dropTrigger('practice_plans', 'practice_plans_search_vector_trigger');
  pgm.sql('DROP FUNCTION IF EXISTS practice_plans_search_vector_update();');
  pgm.dropColumn('practice_plans', 'search_vector');
};

