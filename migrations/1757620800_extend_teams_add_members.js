export const up = (pgm) => {
  // Extend existing teams table
  pgm.addColumns('teams', {
    slug: { type: 'varchar(255)', unique: true, notNull: true },
    default_start_time: { type: 'time', default: '09:00:00' },
    timezone: { type: 'varchar(100)', default: 'America/New_York', notNull: true },
    created_by: { type: 'text', references: 'users(id)', onDelete: 'SET NULL' }
  });
  
  // Create team_members table
  pgm.createTable('team_members', {
    team_id: { type: 'uuid', references: 'teams(id)', onDelete: 'CASCADE', notNull: true },
    user_id: { type: 'text', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    role: { type: 'varchar(20)', notNull: true, default: 'member' },
    created_at: { type: 'timestamp', default: pgm.func('now()') },
    updated_at: { type: 'timestamp', default: pgm.func('now()') }
  });
  
  // Indexes
  pgm.createIndex('teams', 'slug');
  pgm.createIndex('team_members', 'team_id');
  pgm.createIndex('team_members', 'user_id');
  pgm.addConstraint('team_members', 'team_members_unique', {
    unique: ['team_id', 'user_id']
  });
};

export const down = (pgm) => {
  pgm.dropTable('team_members');
  pgm.dropColumns('teams', ['slug', 'default_start_time', 'timezone', 'created_by']);
};