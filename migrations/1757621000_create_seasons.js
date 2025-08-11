export const up = (pgm) => {
  // Create seasons table
  pgm.createTable('seasons', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    team_id: { type: 'uuid', notNull: true, references: 'teams(id)', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date', notNull: true },
    is_active: { type: 'boolean', default: false, notNull: true },
    template_practice_plan_id: { type: 'integer', references: 'practice_plans(id)', onDelete: 'SET NULL' },
    public_view_token: { type: 'uuid', default: pgm.func('gen_random_uuid()') },
    ics_token: { type: 'uuid', default: pgm.func('gen_random_uuid()') },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Indexes
  pgm.createIndex('seasons', 'team_id');
  pgm.createIndex('seasons', ['team_id', 'is_active']);
  
  // Partial unique index for one active season per team
  pgm.createIndex('seasons', 'team_id', {
    unique: true,
    where: 'is_active = true',
    name: 'seasons_one_active_per_team'
  });
  
  // Add columns to practice_plans for template support
  pgm.addColumns('practice_plans', {
    is_template: { type: 'boolean', default: false },
    team_id: { type: 'uuid', references: 'teams(id)', onDelete: 'CASCADE' }
  });
  
  pgm.createIndex('practice_plans', ['team_id', 'is_template']);
};

export const down = (pgm) => {
  pgm.dropColumns('practice_plans', ['is_template', 'team_id']);
  pgm.dropTable('seasons');
};