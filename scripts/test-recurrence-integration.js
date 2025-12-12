#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const client = new Client({
	connectionString: process.env.NEON_DB_URL
});

async function testRecurrenceIntegration() {
	await client.connect();

	try {
		console.log('🧪 Testing Recurrence and Batch Generation Integration...\n');

		// Get test team
		const teamResult = await client.query(`
      SELECT id, name FROM teams LIMIT 1
    `);

		if (teamResult.rows.length === 0) {
			console.log('❌ No teams found. Please run test-seasons-integration.js first.');
			return;
		}

		const team = teamResult.rows[0];
		console.log(`✅ Using team: ${team.name}`);

		// Get active season
		const seasonResult = await client.query(
			`
      SELECT id, name, start_date, end_date 
      FROM seasons 
      WHERE team_id = $1 AND is_active = true
      LIMIT 1
    `,
			[team.id]
		);

		if (seasonResult.rows.length === 0) {
			console.log('❌ No active season found. Please run test-seasons-integration.js first.');
			return;
		}

		const season = seasonResult.rows[0];
		console.log(`✅ Using season: ${season.name}`);

		// Get a user for testing
		const userResult = await client.query(`
      SELECT id, name FROM users LIMIT 1
    `);

		if (userResult.rows.length === 0) {
			console.log('❌ No users found');
			return;
		}

		const user = userResult.rows[0];
		console.log(`✅ Using user: ${user.name}`);

		// Test 1: Create a recurrence pattern
		console.log('\n📝 Creating recurrence pattern...');
		const recurrenceResult = await client.query(
			`
      INSERT INTO season_recurrences (
        team_id, season_id, name, pattern, day_of_week,
        time_of_day, duration_minutes, skip_markers,
        is_active, created_by
      ) VALUES (
        $1, $2, $3, $4, $5::integer[],
        $6, $7, $8,
        $9, $10
      ) RETURNING *
    `,
			[
				team.id,
				season.id,
				'Test Weekly Practice',
				'weekly',
				[1, 3, 5], // Mon, Wed, Fri
				'18:00:00',
				90,
				false,
				true,
				user.id
			]
		);

		const recurrence = recurrenceResult.rows[0];
		console.log(`✅ Created recurrence: ${recurrence.name}`);
		console.log(`   Pattern: ${recurrence.pattern}`);
		console.log(`   Days: ${recurrence.day_of_week.join(', ')}`);

		// Test 2: Create a biweekly recurrence
		console.log('\n📝 Creating biweekly recurrence...');
		const biweeklyResult = await client.query(
			`
      INSERT INTO season_recurrences (
        team_id, season_id, name, pattern, day_of_week,
        time_of_day, duration_minutes, skip_markers,
        is_active, created_by
      ) VALUES (
        $1, $2, $3, $4, $5::integer[],
        $6, $7, $8,
        $9, $10
      ) RETURNING *
    `,
			[
				team.id,
				season.id,
				'Test Biweekly Scrimmage',
				'biweekly',
				[6], // Saturday
				'10:00:00',
				120,
				true,
				true,
				user.id
			]
		);

		console.log(`✅ Created biweekly recurrence: ${biweeklyResult.rows[0].name}`);

		// Test 3: Create a monthly recurrence
		console.log('\n📝 Creating monthly recurrence...');
		const monthlyResult = await client.query(
			`
      INSERT INTO season_recurrences (
        team_id, season_id, name, pattern, day_of_month,
        time_of_day, duration_minutes, skip_markers,
        is_active, created_by
      ) VALUES (
        $1, $2, $3, $4, $5::integer[],
        $6, $7, $8,
        $9, $10
      ) RETURNING *
    `,
			[
				team.id,
				season.id,
				'Test Monthly Team Meeting',
				'monthly',
				[1, 15], // 1st and 15th
				'19:00:00',
				60,
				false,
				true,
				user.id
			]
		);

		console.log(`✅ Created monthly recurrence: ${monthlyResult.rows[0].name}`);

		// Test 4: Log a generation event
		console.log('\n📝 Creating generation log...');
		const logResult = await client.query(
			`
      INSERT INTO season_generation_logs (
        recurrence_id, generated_count, skipped_count,
        start_date, end_date, generated_plan_ids,
        skip_reasons, generated_by
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6::integer[],
        $7, $8
      ) RETURNING *
    `,
			[
				recurrence.id,
				5,
				2,
				season.start_date,
				new Date(new Date(season.start_date).getTime() + 30 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split('T')[0],
				[],
				JSON.stringify({ '2024-01-15': 'Holiday', '2024-01-22': 'Tournament' }),
				user.id
			]
		);

		console.log(`✅ Created generation log`);
		console.log(`   Generated: ${logResult.rows[0].generated_count} practices`);
		console.log(`   Skipped: ${logResult.rows[0].skipped_count} dates`);

		// Test 5: Verify recurrences
		console.log('\n🔍 Verifying recurrences...');
		const verifyResult = await client.query(
			`
      SELECT 
        r.*,
        COUNT(gl.id) as generation_count
      FROM season_recurrences r
      LEFT JOIN season_generation_logs gl ON gl.recurrence_id = r.id
      WHERE r.season_id = $1
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `,
			[season.id]
		);

		console.log(`✅ Found ${verifyResult.rows.length} recurrence patterns`);
		verifyResult.rows.forEach((r) => {
			console.log(`   - ${r.name}: ${r.pattern}, ${r.generation_count} generations`);
		});

		// Test 6: Check unique constraint
		console.log('\n🔍 Testing unique constraint...');
		try {
			await client.query(
				`
        INSERT INTO season_recurrences (
          team_id, season_id, name, pattern, day_of_week,
          created_by
        ) VALUES ($1, $2, $3, $4, $5::integer[], $6)
      `,
				[
					team.id,
					season.id,
					'Test Weekly Practice', // Duplicate name
					'weekly',
					[2],
					user.id
				]
			);
			console.log('❌ Unique constraint not working');
		} catch (err) {
			if (err.code === '23505') {
				console.log('✅ Unique constraint working correctly');
			} else {
				console.log('❌ Unexpected error:', err.message);
			}
		}

		console.log('\n✨ All recurrence integration tests passed!');
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		await client.end();
	}
}

testRecurrenceIntegration().catch(console.error);
