import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { authGuard } from '$lib/server/authGuard';

const client = createClient();
await client.connect();

async function updateSkills(skills, drillId) {
  for (const skill of skills) {
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
}

export const POST = async (event) => {
    const drill = await event.request.json();
    const session = await event.locals.getSession();
    const userId = session?.user?.id || null;

    let {
        name,
        brief_description,
        detailed_description,
        skill_level,
        complexity,
        suggested_length,
        number_of_people_min,
        number_of_people_max,
        skills_focused_on,
        positions_focused_on,
        video_link,
        images,
        diagrams,
        drill_type,
        is_editable_by_others = false,
        visibility = 'public'
    } = drill;

    if (!Array.isArray(diagrams)) {
        diagrams = diagrams ? [diagrams] : [];
    }

    diagrams = diagrams.map(diagram => JSON.stringify(diagram));

    if (typeof skill_level === 'string') {
        skill_level = [skill_level];
    }

    if (typeof skills_focused_on === 'string') {
        skills_focused_on = [skills_focused_on];
    }

    if (typeof positions_focused_on === 'string') {
        positions_focused_on = [positions_focused_on];
    }

    if (!Array.isArray(images)) {
        images = [];
    }

    if (typeof drill_type === 'string') {
        drill_type = [drill_type];
    }

    try {
        const result = await client.query(
            `INSERT INTO drills (
                name, brief_description, detailed_description, skill_level, complexity,
                suggested_length, number_of_people_min, number_of_people_max, skills_focused_on,
                positions_focused_on, video_link, images, diagrams, drill_type,
                created_by, is_editable_by_others, visibility
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                $10, $11, $12, $13, $14,
                $15, $16, $17
            ) RETURNING id`,
            [
                name,
                brief_description,
                detailed_description,
                skill_level,
                complexity,
                suggested_length,
                number_of_people_min,
                number_of_people_max,
                skills_focused_on,
                positions_focused_on,
                video_link,
                images,
                diagrams,
                drill_type,
                userId,
                is_editable_by_others,
                visibility
            ]
        );
        
        const drillId = result.rows[0].id;
        await updateSkills(skills_focused_on, drillId);
        
        return json(result.rows[0]);
    } catch (error) {
        console.error('Error occurred while inserting drill:', error);
        return json({ error: 'An error occurred while creating the drill', details: error.toString() }, { status: 500 });
    }
};

export const GET = async (event) => {
  // Get session if available
  const session = await event.locals.getSession();
  const userId = session?.user?.id;

  try {
    const result = await client.query('SELECT * FROM drills');
    const drills = result.rows.filter(drill => {
      if (drill.visibility === 'public') {
        return true;
      } else if (drill.visibility === 'unlisted') {
        return true; // Include unlisted drills
      } else if (drill.visibility === 'private') {
        return drill.created_by === userId;
      }
      return false;
    }).map(drill => ({
      ...drill,
      dateCreated: drill.date_created, // Add this line
      diagrams: drill.diagrams || [],
      min_duration: drill.min_duration || 5,
      max_duration: drill.max_duration || 15,
      suggested_length: drill.suggested_length || Math.floor((drill.min_duration + drill.max_duration) / 2)
    }));
    return json(drills);
  } catch (error) {
    console.error('Error fetching drills:', error);
    return json({ error: 'Failed to fetch drills' }, { status: 500 });
  }
};

export const PUT = authGuard(async ({ request, locals }) => {
    const drill = await request.json();
    const session = await locals.getSession();
    const userId = session.user.id;

    const { id } = drill;

    // Check if the user is the owner or if the drill is editable by others
    const { rows } = await client.query(
        `SELECT created_by, is_editable_by_others FROM drills WHERE id = $1`,
        [id]
    );

    const drillData = rows[0];

    if (drillData.created_by !== userId && !drillData.is_editable_by_others) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    let {
        name,
        brief_description,
        detailed_description,
        skill_level,
        complexity,
        suggested_length,
        number_of_people_min,
        number_of_people_max,
        skills_focused_on,
        positions_focused_on,
        video_link,
        images,
        diagrams,
        drill_type,
        is_editable_by_others,
        visibility
    } = drill;

    if (!Array.isArray(diagrams)) {
        diagrams = diagrams ? [diagrams] : [];
    }
    diagrams = diagrams.map(diagram => JSON.stringify(diagram));

    if (typeof drill_type === 'string') {
        drill_type = [drill_type];
    }

    try {
        // First, get the existing skills for this drill
        const existingSkillsResult = await client.query('SELECT skills_focused_on FROM drills WHERE id = $1', [id]);
        const existingSkills = existingSkillsResult.rows[0].skills_focused_on;

        // Update the drill
        const result = await client.query(
          `UPDATE drills SET 
           name = $2, brief_description = $3, detailed_description = $4, skill_level = $5, 
           complexity = $6, suggested_length = $7, number_of_people_min = $8, number_of_people_max = $9, 
           skills_focused_on = $10, positions_focused_on = $11, video_link = $12, images = $13, diagrams = $14, drill_type = $15,
           is_editable_by_others = $16, visibility = $17
           WHERE id = $1 RETURNING *`,
          [id, name, brief_description, detailed_description, skill_level, complexity, suggested_length, 
           number_of_people_min, number_of_people_max, skills_focused_on, positions_focused_on, video_link, images, diagrams, drill_type,
           is_editable_by_others, visibility]
        );

        // Update skills
        const skillsToRemove = existingSkills.filter(skill => !skills_focused_on.includes(skill));
        const skillsToAdd = skills_focused_on.filter(skill => !existingSkills.includes(skill));

        // Remove skills no longer used in this drill
        for (const skill of skillsToRemove) {
          await client.query(
            `UPDATE skills SET 
             drills_used_in = drills_used_in - 1
             WHERE skill = $1`,
            [skill]
          );
        }

        // Add new skills used in this drill
        await updateSkills(skillsToAdd, id);

        return json(result.rows[0]);
    } catch (error) {
        console.error('Error occurred while updating drill:', error);
        return json({ error: 'An error occurred while updating the drill', details: error.toString() }, { status: 500 });
    }
});
