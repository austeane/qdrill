export async function upsertSkillCounts(client, skill, drillId) {
	await client.query(
		`INSERT INTO skills (skill, drills_used_in, usage_count)
         VALUES ($1, 1, 1)
         ON CONFLICT (skill) DO UPDATE SET
         drills_used_in =
           CASE
             WHEN NOT EXISTS (SELECT 1 FROM drills WHERE id = $2 AND $1 = ANY(skills_focused_on))
             THEN skills.drills_used_in + 1
             ELSE skills.drills_used_in
           END,
         usage_count = skills.usage_count + 1`,
		[skill, drillId]
	);
}
