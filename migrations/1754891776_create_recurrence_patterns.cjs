export const up = async function (pgm) {
	// Create season_recurrences table for storing recurrence patterns
	pgm.createTable('season_recurrences', {
		id: 'id',
		team_id: {
			type: 'uuid',
			notNull: true,
			references: 'teams',
			onDelete: 'CASCADE'
		},
		season_id: {
			type: 'uuid',
			notNull: true,
			references: 'seasons',
			onDelete: 'CASCADE'
		},
		name: {
			type: 'varchar(255)',
			notNull: true
		},
		pattern: {
			type: 'varchar(50)',
			notNull: true
		}, // 'weekly', 'biweekly', 'monthly', 'custom'
		day_of_week: {
			type: 'integer[]'
		}, // [1,3,5] for Mon/Wed/Fri
		day_of_month: {
			type: 'integer[]'
		}, // [1,15] for 1st and 15th
		time_of_day: {
			type: 'time'
		},
		duration_minutes: {
			type: 'integer',
			default: 90
		},
		template_plan_id: {
			type: 'uuid',
			references: 'practice_plans',
			onDelete: 'SET NULL'
		},
		skip_dates: {
			type: 'date[]',
			default: '{}'
		},
		skip_markers: {
			type: 'boolean',
			default: false
		},
		is_active: {
			type: 'boolean',
			default: true
		},
		created_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp')
		},
		updated_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp')
		},
		created_by: {
			type: 'uuid',
			notNull: true,
			references: 'users',
			onDelete: 'CASCADE'
		}
	});

	// Create season_generation_logs table for tracking batch generation history
	pgm.createTable('season_generation_logs', {
		id: 'id',
		recurrence_id: {
			type: 'uuid',
			notNull: true,
			references: 'season_recurrences',
			onDelete: 'CASCADE'
		},
		generated_count: {
			type: 'integer',
			notNull: true
		},
		skipped_count: {
			type: 'integer',
			notNull: true,
			default: 0
		},
		start_date: {
			type: 'date',
			notNull: true
		},
		end_date: {
			type: 'date',
			notNull: true
		},
		generated_plan_ids: {
			type: 'uuid[]',
			default: '{}'
		},
		skip_reasons: {
			type: 'jsonb'
		}, // {date: reason} mapping
		generated_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp')
		},
		generated_by: {
			type: 'uuid',
			notNull: true,
			references: 'users',
			onDelete: 'CASCADE'
		}
	});

	// Add indexes
	pgm.createIndex('season_recurrences', 'team_id');
	pgm.createIndex('season_recurrences', 'season_id');
	pgm.createIndex('season_recurrences', 'template_plan_id');
	pgm.createIndex('season_generation_logs', 'recurrence_id');
	pgm.createIndex('season_generation_logs', 'generated_at');

	// Add unique constraint to prevent duplicate patterns
	pgm.addConstraint('season_recurrences', 'unique_recurrence_per_season', {
		unique: ['season_id', 'name']
	});
};

export const down = function (pgm) {
	pgm.dropTable('season_generation_logs');
	pgm.dropTable('season_recurrences');
};
