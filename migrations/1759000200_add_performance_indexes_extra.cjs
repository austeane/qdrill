exports.shorthands = undefined;

exports.up = (pgm) => {
	// Practice plans: frequent queries by team and date
	pgm.createIndex('practice_plans', ['team_id', { name: 'scheduled_date', sort: 'DESC' }], {
		name: 'idx_practice_plans_team_date'
	});

	// Practice plans: JSON goals often filtered -> GIN on jsonb
	pgm.createIndex('practice_plans', 'practice_goals', {
		method: 'gin',
		name: 'idx_practice_plans_goals_gin'
	});

	// Practice plan drills: lookups and ordering
	pgm.createIndex('practice_plan_drills', ['practice_plan_id', 'section_id', 'order_in_section'], {
		name: 'idx_practice_plan_drills_composite'
	});
	pgm.createIndex('practice_plan_drills', 'drill_id', { name: 'idx_practice_plan_drills_drill' });

	// Team members: common lookups
	pgm.createIndex('team_members', 'user_id', { name: 'idx_team_members_user' });
	pgm.createIndex('team_members', 'team_id', { name: 'idx_team_members_team' });

	// Drills common sorts/lookups
	pgm.createIndex(
		'drills',
		{ name: 'created_at', sort: 'DESC' },
		{ name: 'idx_drills_created_at' }
	);
	pgm.createIndex('drills', 'created_by', { name: 'idx_drills_user_id' });

	// Formations lookup
	pgm.createIndex('formations', 'team_id', { name: 'idx_formations_team_id' });

	// Votes lookups
	// Some schemas use separate columns; adapt to existing 'practice_plan_id' and 'drill_id'
	pgm.createIndex('votes', ['user_id', 'practice_plan_id'], { name: 'idx_votes_user_plan' });
	pgm.createIndex('votes', ['user_id', 'drill_id'], { name: 'idx_votes_user_drill' });
	pgm.createIndex('votes', 'practice_plan_id', { name: 'idx_votes_plan' });
	pgm.createIndex('votes', 'drill_id', { name: 'idx_votes_drill' });

	// Comments lookup (assumes entity-specific columns)
	try {
		pgm.createIndex('comments', ['drill_id', { name: 'created_at', sort: 'DESC' }], {
			name: 'idx_comments_drill'
		});
	} catch {
		// Index may already exist - ignore
	}
	try {
		pgm.createIndex('comments', ['practice_plan_id', { name: 'created_at', sort: 'DESC' }], {
			name: 'idx_comments_plan'
		});
	} catch {
		// Index may already exist - ignore
	}
};

exports.down = (pgm) => {
	pgm.dropIndex('practice_plans', ['team_id', { name: 'scheduled_date', sort: 'DESC' }], {
		name: 'idx_practice_plans_team_date',
		ifExists: true
	});
	pgm.dropIndex('practice_plans', 'practice_goals', {
		name: 'idx_practice_plans_goals_gin',
		ifExists: true
	});
	pgm.dropIndex('practice_plan_drills', ['practice_plan_id', 'section_id', 'order_in_section'], {
		name: 'idx_practice_plan_drills_composite',
		ifExists: true
	});
	pgm.dropIndex('practice_plan_drills', 'drill_id', {
		name: 'idx_practice_plan_drills_drill',
		ifExists: true
	});
	pgm.dropIndex('team_members', 'user_id', { name: 'idx_team_members_user', ifExists: true });
	pgm.dropIndex('team_members', 'team_id', { name: 'idx_team_members_team', ifExists: true });
	pgm.dropIndex(
		'drills',
		{ name: 'created_at', sort: 'DESC' },
		{ name: 'idx_drills_created_at', ifExists: true }
	);
	pgm.dropIndex('drills', 'created_by', { name: 'idx_drills_user_id', ifExists: true });
	pgm.dropIndex('formations', 'team_id', { name: 'idx_formations_team_id', ifExists: true });
	pgm.dropIndex('votes', ['user_id', 'practice_plan_id'], {
		name: 'idx_votes_user_plan',
		ifExists: true
	});
	pgm.dropIndex('votes', ['user_id', 'drill_id'], { name: 'idx_votes_user_drill', ifExists: true });
	pgm.dropIndex('votes', 'practice_plan_id', { name: 'idx_votes_plan', ifExists: true });
	pgm.dropIndex('votes', 'drill_id', { name: 'idx_votes_drill', ifExists: true });
	try {
		pgm.dropIndex('comments', ['drill_id', { name: 'created_at', sort: 'DESC' }], {
			name: 'idx_comments_drill',
			ifExists: true
		});
	} catch {
		// Index may not exist - ignore
	}
	try {
		pgm.dropIndex('comments', ['practice_plan_id', { name: 'created_at', sort: 'DESC' }], {
			name: 'idx_comments_plan',
			ifExists: true
		});
	} catch {
		// Index may not exist - ignore
	}
};
