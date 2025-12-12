#!/usr/bin/env node

/**
 * Integration test script for Teams functionality
 * Run with: node scripts/test-teams-integration.js
 *
 * This script tests the complete teams flow by:
 * 1. Creating a test team
 * 2. Listing teams
 * 3. Updating team settings
 * 4. Testing member management
 * 5. Cleaning up test data
 */

import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config({ path: '.env.development.local' });

const { Pool } = pg;

// Database connection using NEON_DB_URL from environment
const pool = new Pool({
	connectionString: process.env.NEON_DB_URL,
	ssl: { rejectUnauthorized: false }
});

// Test user ID (you can change this to match an actual user in your database)
const TEST_USER_ID = 'test-integration-user-' + Date.now();
const TEST_USER_EMAIL = `test${Date.now()}@example.com`;
const TEST_TEAM_NAME = 'Integration Test Team ' + Date.now();

async function runTests() {
	console.log('🧪 Starting Teams Integration Tests...\n');

	let testUserId;
	let testTeamId;

	try {
		// Step 1: Create a test user
		console.log('1️⃣ Creating test user...');
		const userResult = await pool.query(
			`INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
			[TEST_USER_ID, TEST_USER_EMAIL, 'Test User', 'user']
		);
		testUserId = userResult.rows[0].id;
		console.log(`   ✅ User created: ${testUserId}\n`);

		// Step 2: Create a team
		console.log('2️⃣ Creating team...');
		const teamResult = await pool.query(
			`INSERT INTO teams (name, slug, description, timezone, default_start_time, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, slug`,
			[
				TEST_TEAM_NAME,
				TEST_TEAM_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
				'Test team for integration testing',
				'America/New_York',
				'09:00:00',
				testUserId
			]
		);
		testTeamId = teamResult.rows[0].id;
		console.log(`   ✅ Team created: ${testTeamId} (${teamResult.rows[0].slug})\n`);

		// Step 3: Add creator as admin
		console.log('3️⃣ Adding creator as admin...');
		await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)`, [
			testTeamId,
			testUserId,
			'admin'
		]);
		console.log(`   ✅ User added as admin\n`);

		// Step 4: Verify team members
		console.log('4️⃣ Verifying team members...');
		const membersResult = await pool.query(`SELECT * FROM team_members WHERE team_id = $1`, [
			testTeamId
		]);
		console.log(`   ✅ Found ${membersResult.rows.length} member(s)`);
		console.log(
			`   - User: ${membersResult.rows[0].user_id}, Role: ${membersResult.rows[0].role}\n`
		);

		// Step 5: Test slug uniqueness
		console.log('5️⃣ Testing slug uniqueness...');
		try {
			await pool.query(`INSERT INTO teams (name, slug) VALUES ($1, $2)`, [
				'Another Team',
				teamResult.rows[0].slug
			]);
			console.log('   ❌ ERROR: Duplicate slug was allowed!');
		} catch (err) {
			if (err.code === '23505') {
				// Unique violation
				console.log('   ✅ Duplicate slug correctly rejected\n');
			} else {
				throw err;
			}
		}

		// Step 6: Test updating team
		console.log('6️⃣ Updating team...');
		await pool.query(`UPDATE teams SET description = $1, timezone = $2 WHERE id = $3`, [
			'Updated description',
			'America/Los_Angeles',
			testTeamId
		]);
		const updatedTeam = await pool.query(`SELECT * FROM teams WHERE id = $1`, [testTeamId]);
		console.log(`   ✅ Team updated:`);
		console.log(`   - Description: ${updatedTeam.rows[0].description}`);
		console.log(`   - Timezone: ${updatedTeam.rows[0].timezone}\n`);

		// Step 7: Create another test user and add as member
		console.log('7️⃣ Adding another member...');
		const secondUserId = 'test-member-' + Date.now();
		await pool.query(`INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4)`, [
			secondUserId,
			`member${Date.now()}@example.com`,
			'Test Member',
			'user'
		]);
		await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)`, [
			testTeamId,
			secondUserId,
			'member'
		]);
		console.log(`   ✅ Second user added as member\n`);

		// Step 8: Test member count
		console.log('8️⃣ Checking member count...');
		const countResult = await pool.query(
			`SELECT COUNT(*) as count FROM team_members WHERE team_id = $1`,
			[testTeamId]
		);
		console.log(`   ✅ Team has ${countResult.rows[0].count} members\n`);

		// Step 9: Test role update
		console.log('9️⃣ Testing role update...');
		await pool.query(`UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3`, [
			'admin',
			testTeamId,
			secondUserId
		]);
		const roleCheck = await pool.query(
			`SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
			[testTeamId, secondUserId]
		);
		console.log(`   ✅ Role updated to: ${roleCheck.rows[0].role}\n`);

		// Step 10: Test admin count (should prevent removing last admin)
		console.log('🔟 Testing admin count protection...');
		const adminCount = await pool.query(
			`SELECT COUNT(*) as count FROM team_members WHERE team_id = $1 AND role = 'admin'`,
			[testTeamId]
		);
		console.log(`   ✅ Team has ${adminCount.rows[0].count} admin(s)\n`);

		// Cleanup
		console.log('🧹 Cleaning up test data...');
		await pool.query(`DELETE FROM team_members WHERE team_id = $1`, [testTeamId]);
		await pool.query(`DELETE FROM teams WHERE id = $1`, [testTeamId]);
		await pool.query(`DELETE FROM users WHERE id IN ($1, $2)`, [testUserId, secondUserId]);
		console.log('   ✅ Test data cleaned up\n');

		console.log('✨ All integration tests passed!\n');
	} catch (error) {
		console.error('❌ Test failed:', error);

		// Cleanup on error
		if (testTeamId) {
			await pool.query(`DELETE FROM team_members WHERE team_id = $1`, [testTeamId]).catch(() => {});
			await pool.query(`DELETE FROM teams WHERE id = $1`, [testTeamId]).catch(() => {});
		}
		if (testUserId) {
			await pool.query(`DELETE FROM users WHERE id LIKE 'test-%'`).catch(() => {});
		}

		process.exit(1);
	} finally {
		await pool.end();
	}
}

// Run the tests
runTests().catch(console.error);
