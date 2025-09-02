exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('pending_practice_plans', {
    token: { type: 'uuid', primaryKey: true },
    data: { type: 'jsonb', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });
  pgm.createIndex('pending_practice_plans', 'expires_at', { name: 'idx_pending_practice_plans_expires_at' });
};

exports.down = (pgm) => {
  pgm.dropIndex('pending_practice_plans', 'expires_at', { ifExists: true, name: 'idx_pending_practice_plans_expires_at' });
  pgm.dropTable('pending_practice_plans', { ifExists: true });
};

