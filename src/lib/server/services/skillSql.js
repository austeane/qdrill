import { sql } from 'kysely';

export async function upsertSkillCounts(trx, skill, drillId) {
	await sql`
		INSERT INTO skills (skill, drills_used_in, usage_count)
		VALUES (${skill}, 1, 1)
		ON CONFLICT (skill) DO UPDATE SET
			drills_used_in =
				CASE
					WHEN NOT EXISTS (
						SELECT 1 FROM drills WHERE id = ${drillId} AND ${skill} = ANY(skills_focused_on)
					)
					THEN skills.drills_used_in + 1
					ELSE skills.drills_used_in
				END,
			usage_count = skills.usage_count + 1
	`.execute(trx);
}
